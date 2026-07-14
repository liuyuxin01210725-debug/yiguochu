import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildRecipeGrounding,
  canonicalRecipeIngredient,
  selectRecipeCandidates,
  validateGroundedMeal,
} from '../worker/src/worker.js';

const TOOLS_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CASES_PATH = path.join(TOOLS_DIR, 'data', 'recipe-regression.json');
const LIBRARY_PATH = path.join(TOOLS_DIR, 'data', 'recipe-library.json');
const PURPOSES = new Set(['quick', 'pantry', 'fresh', 'batch']);
const SERVINGS = new Set([1, 2, 4]);
const REQUIRED_FIELDS = [
  'id',
  'purpose',
  'servings',
  'pantry',
  'dislikes',
  'expected_recipe_ids',
  'forbidden_recipe_ids',
];
const ARRAY_FIELDS = ['pantry', 'dislikes', 'expected_recipe_ids', 'forbidden_recipe_ids'];
const MAX_LIVE_CASES = 100;

class CliError extends Error {
  constructor(message) {
    super(message);
    this.code = 'cli_error';
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function parsePositiveInteger(value, flag) {
  if (!/^\d+$/.test(String(value || ''))) throw new CliError(`${flag} must be a positive integer`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > MAX_LIVE_CASES) {
    throw new CliError(`${flag} must be between 1 and ${MAX_LIVE_CASES}`);
  }
  return parsed;
}

function localBase(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new CliError('--base must be an absolute local HTTP URL');
  }
  const allowedHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  if (url.protocol !== 'http:' || !allowedHost || url.username || url.password) {
    throw new CliError('--base only accepts http://localhost or http://127.0.0.1');
  }
  if ((url.pathname && url.pathname !== '/') || url.search || url.hash) {
    throw new CliError('--base must not contain a path, query, or fragment');
  }
  return url.origin;
}

function parseArgs(argv) {
  const options = { file: DEFAULT_CASES_PATH, base: null, limit: null };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!['--file', '--base', '--limit'].includes(flag)) throw new CliError(`unknown argument: ${flag}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new CliError(`${flag} requires a value`);
    index += 1;
    if (flag === '--file') options.file = path.resolve(value);
    if (flag === '--base') options.base = localBase(value);
    if (flag === '--limit') options.limit = parsePositiveInteger(value, '--limit');
  }
  if (!options.base && options.limit !== null) throw new CliError('--limit requires an explicit --base');
  if (options.base && options.limit === null) options.limit = 30;
  return options;
}

function parseJsonFile(filePath, label) {
  let text;
  try {
    text = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`${label} unreadable: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} invalid JSON: ${error.message}`);
  }
}

function validStringArray(value, { allowEmpty = true } = {}) {
  return Array.isArray(value)
    && (allowEmpty || value.length > 0)
    && value.every(item => typeof item === 'string' && item.trim() === item && item.length > 0)
    && new Set(value).size === value.length;
}

function validateCaseSchema(cases, library) {
  const errors = [];
  if (!Array.isArray(cases)) return ['corpus must be a JSON array'];
  if (cases.length !== 100) errors.push(`corpus must contain exactly 100 cases; got ${cases.length}`);
  const recipeIds = new Set(library.recipes.map(recipe => recipe.id));
  const seenIds = new Set();

  for (const [index, testCase] of cases.entries()) {
    const label = isPlainObject(testCase) && typeof testCase.id === 'string'
      ? testCase.id
      : `case[${index}]`;
    if (!isPlainObject(testCase)) {
      errors.push(`${label} must be an object`);
      continue;
    }
    for (const field of REQUIRED_FIELDS) {
      if (!Object.hasOwn(testCase, field)) errors.push(`${label} missing ${field}`);
    }
    if (typeof testCase.id !== 'string' || !/^[a-z0-9-]+$/.test(testCase.id)) errors.push(`${label} has invalid id`);
    if (seenIds.has(testCase.id)) errors.push(`${label} duplicates an earlier id`);
    seenIds.add(testCase.id);
    if (!PURPOSES.has(testCase.purpose)) errors.push(`${label} has invalid purpose`);
    if (!SERVINGS.has(testCase.servings)) errors.push(`${label} has invalid servings`);
    for (const field of ARRAY_FIELDS) {
      const allowEmpty = field !== 'expected_recipe_ids';
      if (!validStringArray(testCase[field], { allowEmpty })) errors.push(`${label} has invalid ${field}`);
    }
    if (validStringArray(testCase.expected_recipe_ids, { allowEmpty: false })) {
      for (const id of testCase.expected_recipe_ids) {
        if (!recipeIds.has(id)) errors.push(`${label} expects unknown recipe ${id}`);
      }
    }
    if (validStringArray(testCase.forbidden_recipe_ids)) {
      for (const id of testCase.forbidden_recipe_ids) {
        if (!recipeIds.has(id)) errors.push(`${label} forbids unknown recipe ${id}`);
      }
    }
    if (Array.isArray(testCase.expected_recipe_ids) && Array.isArray(testCase.forbidden_recipe_ids)) {
      const overlap = testCase.expected_recipe_ids.filter(id => testCase.forbidden_recipe_ids.includes(id));
      if (overlap.length) errors.push(`${label} has expected/forbidden overlap: ${overlap.join(',')}`);
    }
    for (const field of ['recent_families', 'recent_base_recipes', 'expected_grounding_tokens']) {
      if (Object.hasOwn(testCase, field) && !validStringArray(testCase[field], { allowEmpty: false })) {
        errors.push(`${label} has invalid ${field}`);
      }
    }
    if (Object.hasOwn(testCase, 'diet') && (typeof testCase.diet !== 'string' || !testCase.diet.trim())) {
      errors.push(`${label} has invalid diet`);
    }
    if (testCase.case_group === 'adversarial') {
      if (typeof testCase.adversarial_kind !== 'string' || !testCase.adversarial_kind) errors.push(`${label} missing adversarial_kind`);
      if (!isPlainObject(testCase.meal_fixture)) errors.push(`${label} missing meal_fixture`);
      if (!validStringArray(testCase.expected_validation_flags, { allowEmpty: false })) errors.push(`${label} has invalid expected_validation_flags`);
      if (!validStringArray(testCase.forbidden_validation_flags)) errors.push(`${label} has invalid forbidden_validation_flags`);
      if (typeof testCase.validation_recipe_id !== 'string' || !recipeIds.has(testCase.validation_recipe_id)) {
        errors.push(`${label} has invalid validation_recipe_id`);
      }
    }
  }

  if (seenIds.size !== cases.length) errors.push('case IDs must be unique');
  for (let index = 1; index < cases.length; index += 1) {
    if (isPlainObject(cases[index - 1]) && isPlainObject(cases[index]) && cases[index - 1].id >= cases[index].id) {
      errors.push('cases must be sorted by ID');
      break;
    }
  }
  return errors;
}

function constraintsFor(testCase) {
  return {
    purpose: testCase.purpose,
    servings: testCase.servings,
    pantry: testCase.pantry,
    dislikes: testCase.dislikes,
    ...(testCase.diet ? { diet: testCase.diet } : {}),
    ...(testCase.recent_families ? { recent_families: testCase.recent_families } : {}),
    ...(testCase.recent_base_recipes ? { recent_base_recipes: testCase.recent_base_recipes } : {}),
  };
}

function unreplaceableDislikedCore(recipe, dislikes, aliases) {
  const canonical = name => canonicalRecipeIngredient(name, aliases);
  const disliked = new Set(dislikes.map(canonical).filter(Boolean));
  for (const coreName of recipe.core_ingredients || []) {
    const core = canonical(coreName);
    if (!disliked.has(core)) continue;
    const replacementExists = (recipe.substitution_slots || []).some(slot => {
      const replacesCore = (slot.replaces || []).map(canonical).includes(core);
      if (!replacesCore) return false;
      return (slot.allowed || []).some(item => {
        const raw = String(item || '').trim();
        const replacement = canonical(raw);
        return replacement && replacement !== core && !disliked.has(replacement) && !/^不(?:放|加|用)/.test(raw);
      });
    });
    if (!replacementExists) return coreName;
  }
  return null;
}

function printFamilyTotals(library, familyTotals) {
  console.log('family totals:');
  for (const family of library.families) {
    console.log(`  ${family.id}: ${familyTotals.get(family.id) || 0}`);
  }
}

function runStatic(cases, library) {
  const failures = [];
  const failedCases = new Set();
  const familyTotals = new Map(library.families.map(family => [family.id, 0]));
  const fail = (caseId, code, message) => {
    failures.push({ caseId, code, message });
    failedCases.add(caseId);
  };

  const schemaErrors = validateCaseSchema(cases, library);
  for (const message of schemaErrors) fail('<corpus>', 'schema_error', message);

  if (!schemaErrors.length) {
    for (const testCase of cases) {
      const constraints = constraintsFor(testCase);
      const candidates = selectRecipeCandidates(library, constraints);
      const candidateIds = candidates.map(candidate => candidate.recipe.id);
      if (!candidateIds.length) {
        fail(testCase.id, 'no_candidate', 'selector returned no candidates');
        continue;
      }

      const expectedSelection = candidates.find(candidate => testCase.expected_recipe_ids.includes(candidate.recipe.id));
      if (!expectedSelection) {
        fail(testCase.id, 'expected_miss', `expected one of ${testCase.expected_recipe_ids.join(',')}; got ${candidateIds.join(',')}`);
      }
      const forbiddenHits = candidateIds.filter(id => testCase.forbidden_recipe_ids.includes(id));
      if (forbiddenHits.length) fail(testCase.id, 'forbidden_hit', forbiddenHits.join(','));

      for (const candidate of candidates) {
        const core = unreplaceableDislikedCore(candidate.recipe, testCase.dislikes, library.ingredient_aliases);
        if (core) {
          fail(testCase.id, 'disliked_fixed_core_survived', `${candidate.recipe.id}:${core}`);
        }
      }

      const counted = expectedSelection || candidates[0];
      familyTotals.set(counted.recipe.family_id, (familyTotals.get(counted.recipe.family_id) || 0) + 1);

      if (testCase.meal_fixture) {
        const validationSelection = candidates.find(candidate => candidate.recipe.id === testCase.validation_recipe_id);
        if (!validationSelection) {
          fail(testCase.id, 'validation_recipe_missing', testCase.validation_recipe_id);
          continue;
        }
        const flags = validateGroundedMeal(testCase.meal_fixture, validationSelection, constraints);
        for (const flag of testCase.expected_validation_flags) {
          if (!flags.includes(flag)) {
            fail(testCase.id, 'validation_expected_flag_missing', `${flag}; got ${flags.join(',') || '<none>'}`);
          }
        }
        for (const flag of testCase.forbidden_validation_flags) {
          if (flags.includes(flag)) fail(testCase.id, 'validation_forbidden_flag_present', flag);
        }
        if (testCase.expected_grounding_tokens) {
          const grounding = buildRecipeGrounding(validationSelection);
          for (const token of testCase.expected_grounding_tokens) {
            if (!grounding.includes(token)) fail(testCase.id, 'grounding_token_missing', token);
          }
        }
      }
    }

    for (const family of library.families) {
      if (!familyTotals.get(family.id)) fail('<families>', 'family_not_represented', family.id);
    }
  }

  for (const failure of failures) {
    console.error(`FAIL ${failure.caseId} [${failure.code}] ${failure.message}`);
  }
  printFamilyTotals(library, familyTotals);
  const codeTotals = new Map();
  for (const failure of failures) codeTotals.set(failure.code, (codeTotals.get(failure.code) || 0) + 1);
  console.log(`failure codes: ${codeTotals.size
    ? [...codeTotals.entries()].sort(([left], [right]) => compareText(left, right)).map(([code, count]) => `${code}=${count}`).join(', ')
    : 'none'}`);

  if (failures.length) {
    const passed = Math.max(0, cases.length - [...failedCases].filter(id => id !== '<corpus>' && id !== '<families>').length);
    console.error(`static cases passed: ${passed}/${cases.length}; failures: ${failures.length}`);
    return false;
  }
  console.log('100/100 static cases passed');
  return true;
}

function ingredientName(item) {
  if (typeof item === 'string') return item.trim();
  if (!isPlainObject(item)) return '';
  return String(item.name || '').trim();
}

async function runLive(cases, library, base, limit) {
  const endpoint = new URL('/generate-meal', `${base}/`).toString();
  let passed = 0;
  let failed = 0;
  for (const testCase of cases.slice(0, limit)) {
    const constraints = constraintsFor(testCase);
    const problems = [];
    let body;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal_name: '这次的一锅主餐',
          targets: { kcal: 1200, p: 50, fb: 16 },
          constraints,
        }),
      });
      if (!response.ok) {
        problems.push(`http_status:${response.status}`);
        body = await response.text();
      } else {
        body = await response.json();
      }
    } catch (error) {
      problems.push(`request_error:${error.message}`);
    }

    if (!problems.length) {
      if (!isPlainObject(body)) {
        problems.push('response_not_object');
      } else {
        if (typeof body.base_recipe_id !== 'string' || !body.base_recipe_id.trim()) problems.push('base_recipe_id_empty');
        if (typeof body.pairing_basis !== 'string' || !body.pairing_basis.trim()) problems.push('pairing_basis_empty');
        if (!Array.isArray(body.validation_flags)) problems.push('validation_flags_not_array');
        else if (body.validation_flags.length) problems.push(`response_validation_flags:${body.validation_flags.join(',')}`);
        if (!Array.isArray(body.ingredients) || !body.ingredients.length) problems.push('ingredients_empty');
        if (!Array.isArray(body.steps) || !body.steps.length || !body.steps.every(step => typeof step === 'string' && step.trim())) {
          problems.push('steps_empty_or_invalid');
        }

        const names = Array.isArray(body.ingredients) ? body.ingredients.map(ingredientName).filter(Boolean) : [];
        const disliked = new Set(testCase.dislikes.map(name => canonicalRecipeIngredient(name, library.ingredient_aliases)).filter(Boolean));
        const dislikedHits = names.filter(name => disliked.has(canonicalRecipeIngredient(name, library.ingredient_aliases)));
        if (dislikedHits.length) problems.push(`disliked_ingredient:${unique(dislikedHits).join(',')}`);

        const selection = selectRecipeCandidates(library, constraints)
          .find(candidate => candidate.recipe.id === body.base_recipe_id);
        if (!selection) {
          problems.push(`base_recipe_not_selected:${body.base_recipe_id || '<empty>'}`);
        } else {
          const localFlags = validateGroundedMeal(body, selection, constraints);
          const missingSteps = localFlags.filter(flag => flag.startsWith('ingredient_missing_in_steps:'));
          if (missingSteps.length) problems.push(`non_seasoning_missing_in_steps:${missingSteps.join(',')}`);
          const otherFlags = localFlags.filter(flag => !flag.startsWith('ingredient_missing_in_steps:'));
          if (otherFlags.length) problems.push(`local_validation_flags:${otherFlags.join(',')}`);
        }
      }
    }

    if (problems.length) {
      failed += 1;
      console.error(`LIVE FAIL ${testCase.id} [${problems.join('; ')}]`);
    } else {
      passed += 1;
      console.log(`LIVE PASS ${testCase.id}`);
    }
  }
  console.log(`live cases: ${passed}/${limit} passed`);
  return failed === 0;
}

function unique(items) {
  return [...new Set(items)];
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const library = parseJsonFile(LIBRARY_PATH, 'recipe library');
  const cases = parseJsonFile(options.file, 'recipe regression corpus');
  const staticPassed = runStatic(cases, library);
  if (!staticPassed) {
    process.exitCode = 1;
    return;
  }
  if (options.base) {
    const livePassed = await runLive(cases, library, options.base, options.limit);
    if (!livePassed) process.exitCode = 1;
  }
}

main().catch(error => {
  const code = error.code || 'runner_error';
  console.error(`ERROR [${code}] ${error.message}`);
  process.exitCode = 1;
});

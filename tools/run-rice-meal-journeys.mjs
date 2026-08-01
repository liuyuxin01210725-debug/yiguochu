import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectRiceMealCandidates } from '../worker/src/rice-meal-selector.js';
import {
  buildRiceMealPlanToken,
  compileRiceMeal,
  verifyAndRecomputeRiceMealPlan,
} from '../worker/src/rice-meal-compiler.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const taxonomy = readJson('tools/data/ingredient-taxonomy.v1.json');
const catalog = readJson('tools/data/rice-meal-catalog.v1.json');
const ratios = readJson('tools/data/ratio-rules.v1.json');
const recipes = readJson('tools/data/recipe-library.json');
const corpus = readJson('tools/data/rice-meal-journeys.v1.json');
const compilerAssets = Object.freeze({ catalog, taxonomy, ratios, recipes });
const compilerSecret = 'rice-meal-journey-contract-v1';
const STATUS_ORDER = [
  'ready',
  'needs_balance_input',
  'no_reliable_rice_meal',
  'no_alternative_rice_meal',
  'unsafe_recipe',
];

function reasonCodes(result) {
  return new Set([
    ...(result.unused_items || []),
    ...(result.unsafe_items || []),
    ...result.candidates.flatMap(candidate => candidate.unused_items || []),
  ].map(item => item.reason_code).filter(Boolean));
}

function select(request) {
  return selectRiceMealCandidates({ request, catalog, taxonomy, ratioCatalog: ratios, recentPlanIds: [] });
}

function executeJourney(journey) {
  if (!journey.swap_from_variant_id) return select(journey.request);
  const initial = select(journey.request);
  const current = initial.candidates.find(candidate => candidate.variant_id === journey.swap_from_variant_id);
  if (!current) {
    return {
      schema_version: 3,
      catalog_version: catalog.catalog_version,
      status: 'no_reliable_rice_meal',
      candidates: [],
      unused_items: [],
      journey_setup_error: `initial candidate ${journey.swap_from_variant_id} was absent`,
    };
  }
  return select({ ...journey.request, current_plan_id: current.plan_id });
}

function validateJourney(journey, result) {
  const expected = journey.expect;
  const errors = [];
  if (result.journey_setup_error) errors.push(result.journey_setup_error);
  if (result.status !== expected.status) errors.push(`status want=${expected.status} got=${result.status}`);
  if (expected.status === 'ready') {
    if (!result.candidates.length) {
      errors.push('ready journey emitted no candidate');
    } else if (!expected.expected_first_variant) {
      errors.push('ready journey is missing expected_first_variant');
    } else if (result.candidates[0].variant_id !== expected.expected_first_variant) {
      errors.push(`first variant want=${expected.expected_first_variant} got=${result.candidates[0].variant_id}`);
    }
  }
  for (const candidate of result.candidates) {
    if (!expected.allowed_variant_ids.includes(candidate.variant_id)) {
      errors.push(`unexpected variant ${candidate.variant_id}`);
    }
    if (expected.forbidden_variant_ids.includes(candidate.variant_id)) {
      errors.push(`forbidden variant ${candidate.variant_id}`);
    }
    if (candidate.coverage_count < expected.min_coverage_count) {
      errors.push(`coverage ${candidate.coverage_count} below ${expected.min_coverage_count}`);
    }
    if (!expected.nutrition_grades.includes(candidate.nutrition_grade)) {
      errors.push(`unexpected nutrition grade ${candidate.nutrition_grade}`);
    }
  }
  const first = result.candidates[0];
  if (first && Number.isInteger(expected.expected_coverage_count)
      && first.coverage_count !== expected.expected_coverage_count) {
    errors.push(`coverage count want=${expected.expected_coverage_count} got=${first.coverage_count}`);
  }
  if (first && Number.isInteger(expected.expected_coverage_total)
      && first.coverage_total !== expected.expected_coverage_total) {
    errors.push(`coverage total want=${expected.expected_coverage_total} got=${first.coverage_total}`);
  }
  if (first && Array.isArray(expected.expected_used_raw)
      && JSON.stringify(first.used_items.map(item => item.raw)) !== JSON.stringify(expected.expected_used_raw)) {
    errors.push(`used items want=${JSON.stringify(expected.expected_used_raw)} got=${JSON.stringify(first.used_items.map(item => item.raw))}`);
  }
  if (first && Array.isArray(expected.expected_unused_raw)
      && JSON.stringify(first.unused_items.map(item => item.raw)) !== JSON.stringify(expected.expected_unused_raw)) {
    errors.push(`unused items want=${JSON.stringify(expected.expected_unused_raw)} got=${JSON.stringify(first.unused_items.map(item => item.raw))}`);
  }
  if (first && Array.isArray(expected.expected_substitutions)
      && JSON.stringify(first.substitutions) !== JSON.stringify(expected.expected_substitutions)) {
    errors.push(`substitutions want=${JSON.stringify(expected.expected_substitutions)} got=${JSON.stringify(first.substitutions)}`);
  }
  if (Array.isArray(expected.expected_ignored_basic_raw)
      && JSON.stringify((result.normalized_request?.ignored_basic_items || []).map(item => item.raw))
        !== JSON.stringify(expected.expected_ignored_basic_raw)) {
    errors.push(`ignored basics want=${JSON.stringify(expected.expected_ignored_basic_raw)} got=${JSON.stringify((result.normalized_request?.ignored_basic_items || []).map(item => item.raw))}`);
  }
  const actualReasons = reasonCodes(result);
  for (const reasonCode of expected.required_unused_reason_codes) {
    if (!actualReasons.has(reasonCode)) errors.push(`missing unused reason ${reasonCode}`);
  }
  return errors;
}

function validateCompilerJourney(journey, result) {
  const expected = journey.compiler_expect;
  if (!expected) return [];
  const errors = [];
  const candidate = result.candidates?.[0];
  if (!candidate) return ['compiler journey emitted no candidate'];
  try {
    const token = buildRiceMealPlanToken(candidate, compilerSecret);
    const recomputed = verifyAndRecomputeRiceMealPlan({ plan_token: token }, compilerAssets, compilerSecret);
    const output = compileRiceMeal(recomputed, compilerAssets);
    const meal = output.meals?.[0];
    if (output.plan_id !== candidate.plan_id) errors.push('compiler changed candidate plan id');
    if (meal?.dish_name !== expected.dish_name) {
      errors.push(`dish name want=${expected.dish_name} got=${meal?.dish_name || 'missing'}`);
    }
    const amounts = output.plan?.ingredient_amounts?.map(item => [item.canonical_id, item.grams]);
    if (JSON.stringify(amounts) !== JSON.stringify(expected.ingredient_amounts)) {
      errors.push(`ingredient amounts want=${JSON.stringify(expected.ingredient_amounts)} got=${JSON.stringify(amounts)}`);
    }
    const actionCodes = meal?.steps?.map(step => step.action_code);
    if (JSON.stringify(actionCodes) !== JSON.stringify(expected.action_codes)) {
      errors.push(`action codes want=${JSON.stringify(expected.action_codes)} got=${JSON.stringify(actionCodes)}`);
    }
    if (JSON.stringify(meal?.safety_endpoints) !== JSON.stringify(expected.safety_endpoints)) {
      errors.push(`safety endpoints want=${JSON.stringify(expected.safety_endpoints)} got=${JSON.stringify(meal?.safety_endpoints)}`);
    }
  } catch (error) {
    errors.push(`compiler ${error?.code || error?.message || 'failed'}`);
  }
  return errors;
}

function summaryFor(result) {
  const first = result.candidates[0];
  if (first) {
    return `variant=${first.variant_id} coverage=${first.coverage_count}/${first.coverage_total} grade=${first.nutrition_grade}`;
  }
  if (result.current_candidate) return `current=${result.current_candidate.variant_id}`;
  const reasons = [...reasonCodes(result)].sort();
  return `no-candidate reasons=${reasons.join(',') || 'none'}`;
}

const counts = Object.fromEntries(STATUS_ORDER.map(status => [status, 0]));
const failures = [];
let compilerPassed = 0;
let compilerFailed = 0;
for (const journey of corpus.journeys || []) {
  const result = executeJourney(journey);
  counts[result.status] = (counts[result.status] || 0) + 1;
  const errors = validateJourney(journey, result);
  const compilerErrors = validateCompilerJourney(journey, result);
  const prefix = errors.length || compilerErrors.length ? '✖' : '✓';
  const compilerSuffix = journey.compiler_expect ? ` contract=${compilerErrors.length ? 'failed' : 'passed'}` : '';
  console.log(`${prefix} ${journey.id} status=${result.status} ${summaryFor(result)}${compilerSuffix}`);
  if (errors.length) failures.push({ id: journey.id, errors });
  if (journey.compiler_expect) {
    if (compilerErrors.length) {
      compilerFailed += 1;
      failures.push({ id: `${journey.id}:compiler`, errors: compilerErrors });
    } else {
      compilerPassed += 1;
    }
  }
}

const selectorFailed = failures.filter(failure => !failure.id.endsWith(':compiler')).length;
console.log(`Rice meal journey gate: total=${corpus.journeys.length} selector_passed=${corpus.journeys.length - selectorFailed} selector_failed=${selectorFailed} compiler_passed=${compilerPassed} compiler_failed=${compilerFailed}`);
console.log(`Candidate-to-compiler contract: passed=${compilerPassed} failed=${compilerFailed}; executed by the journey gate.`);
console.log('Status distribution:');
for (const status of STATUS_ORDER) console.log(`  ${status}: ${counts[status] || 0}`);

if (failures.length) {
  console.error('Journey failures:');
  for (const failure of failures) console.error(`  ${failure.id}: ${failure.errors.join('; ')}`);
  process.exitCode = 1;
}

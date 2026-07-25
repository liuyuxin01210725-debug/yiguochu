import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateMenuVerificationCases } from '../lib/menu-verification-validator.mjs';
import { buildMenuMaster, summarizeVerificationForMenu } from '../lib/menu-master-builder.mjs';

const library = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
const taxonomy = JSON.parse(fs.readFileSync(new URL('../data/ingredient-taxonomy.v1.json', import.meta.url), 'utf8'));
const research = JSON.parse(fs.readFileSync(new URL('../data/regional-menu-research.v1.json', import.meta.url), 'utf8'));
const verification = JSON.parse(fs.readFileSync(new URL('../data/menu-verification-cases.v1.json', import.meta.url), 'utf8'));

function validCase(overrides = {}) {
  return {
    case_id: 'valid-case',
    case_type: 'positive',
    recipe_ids: ['known-recipe'],
    family_ids: ['known-family'],
    input: { mode: 'recommend', intent: 'normal', servings: 2, items: ['番茄'] },
    expected: { planned_items: ['番茄'], plan_status: 'ready' },
    status: 'pending',
    ...overrides,
  };
}

function validationErrors(entries) {
  return validateMenuVerificationCases({
    schema_version: 1,
    catalog_version: 'menu-verification-v1-20260725',
    entries,
  }, new Set(['known-recipe']), new Set(['known-family']));
}

test('stage-zero verification ledger is valid and intentionally empty', () => {
  assert.equal(verification.entries.length, 0);
  assert.deepEqual(validateMenuVerificationCases(
    verification,
    new Set(library.recipes.map(recipe => recipe.id)),
    new Set(library.families.map(family => family.id)),
  ), []);
});

test('all 72 production menus appear as pending in the derived matrix', () => {
  const master = buildMenuMaster({
    recipeLibrary: library,
    taxonomy,
    regionalResearch: research,
    verificationCases: verification,
  });
  assert.equal(master.production_menus.length, 72);
  assert.ok(master.production_menus.every(menu => menu.audit.verification_status === 'pending'));
});

test('verification cases reject unknown recipe references', () => {
  const broken = {
    ...verification,
    entries: [{
      case_id: 'unknown-recipe-positive',
      case_type: 'positive',
      recipe_ids: ['missing-recipe'],
      family_ids: [],
      input: { mode: 'recommend', intent: 'normal', servings: 2, items: ['番茄'] },
      expected: { planned_items: ['番茄'], plan_status: 'ready' },
      status: 'pending',
    }],
  };
  assert.match(
    validateMenuVerificationCases(broken, new Set(), new Set()).join('\n'),
    /unknown recipe_id missing-recipe/,
  );
});

test('menu verification summary requires positive and negative coverage', () => {
  const cases = [
    { case_id: 'cross-first', case_type: 'cross_menu', recipe_ids: ['menu-1'] },
    { case_id: 'positive-second', case_type: 'positive', recipe_ids: ['menu-1'] },
    { case_id: 'negative-third', case_type: 'negative', recipe_ids: ['menu-1'] },
  ];
  assert.deepEqual(summarizeVerificationForMenu('menu-1', cases), {
    positive_case_count: 1,
    negative_case_count: 1,
    cross_menu_case_count: 1,
    case_ids: ['cross-first', 'negative-third', 'positive-second'],
    status: 'covered',
  });
  assert.equal(summarizeVerificationForMenu('missing-menu', cases).status, 'pending');
  assert.equal(summarizeVerificationForMenu('menu-1', cases.slice(0, 2)).status, 'in_progress');
});

test('menu master exposes the derived verification summary in its audit row', () => {
  const targetRecipe = library.recipes[0];
  const entries = [
    { case_id: 'positive-case', case_type: 'positive', recipe_ids: [targetRecipe.id] },
    { case_id: 'negative-case', case_type: 'negative', recipe_ids: [targetRecipe.id] },
  ];
  const master = buildMenuMaster({
    recipeLibrary: { recipes: [targetRecipe] },
    taxonomy,
    regionalResearch: { entries: [] },
    verificationCases: { entries },
  });
  assert.equal(master.production_menus[0].audit.verification.status, 'covered');
  assert.equal(master.production_menus[0].audit.verification_status, 'covered');
});

test('verification cases reject duplicate references and invalid request enums', () => {
  const errors = validationErrors([
    validCase(),
    validCase({
      case_type: 'positve',
      status: 'approved',
      recipe_ids: ['known-recipe'],
      family_ids: ['missing-family'],
      input: { mode: 'suggest', intent: 'fast', servings: 2, items: ['番茄'] },
    }),
  ]).join('\n');
  assert.match(errors, /duplicate verification case_id valid-case/);
  assert.match(errors, /unknown family_id missing-family/);
  assert.match(errors, /invalid case_type/);
  assert.match(errors, /invalid status/);
  assert.match(errors, /input mode must be recommend or pantry/);
  assert.match(errors, /input intent must be normal, quick, fresh, or batch/);
});

test('verification cases enforce serving and item boundaries', () => {
  assert.deepEqual(validationErrors([
    validCase({ case_id: 'one-serving', input: { mode: 'pantry', intent: 'quick', servings: 1, items: ['米'] } }),
    validCase({ case_id: 'eight-servings', input: { mode: 'recommend', intent: 'batch', servings: 8, items: ['米'] } }),
  ]), []);

  const errors = validationErrors([
    validCase({ case_id: 'zero-servings', input: { mode: 'recommend', intent: 'normal', servings: 0, items: ['米'] } }),
    validCase({ case_id: 'nine-servings', input: { mode: 'recommend', intent: 'normal', servings: 9, items: ['米'] } }),
    validCase({ case_id: 'empty-items', input: { mode: 'recommend', intent: 'normal', servings: 2, items: [] } }),
  ]).join('\n');
  assert.equal((errors.match(/input servings must be an integer from 1 to 8/g) || []).length, 2);
  assert.match(errors, /input items must be a non-empty string array/);
});

test('verification cases require structured expected plans and controlled plan statuses', () => {
  const errors = validationErrors([
    validCase({ case_id: 'missing-expected', expected: null }),
    validCase({ case_id: 'typo-status', expected: { planned_items: ['番茄'], plan_status: 'reayd' } }),
    validCase({ case_id: 'empty-success-plan', expected: { planned_items: [], plan_status: 'complete' } }),
  ]).join('\n');
  assert.match(errors, /expected must be an object/);
  assert.match(errors, /expected plan_status must be one of/);
  assert.match(errors, /expected planned_items must be a non-empty string array for complete/);
});

test('negative no-valid-plan cases may record an empty planned item list', () => {
  assert.deepEqual(validationErrors([
    validCase({
      case_id: 'no-valid-plan',
      case_type: 'negative',
      expected: { plan_status: 'no_valid_plan', planned_items: [] },
    }),
    validCase({
      case_id: 'no-alternative-plan',
      case_type: 'negative',
      expected: { plan_status: 'no_alternative_plan', planned_items: [] },
    }),
    validCase({
      case_id: 'decision-can-retain-planned-items',
      expected: { plan_status: 'needs_user_decision', planned_items: ['番茄'] },
    }),
  ]), []);
});

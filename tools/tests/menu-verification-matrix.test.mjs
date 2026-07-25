import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateMenuVerificationCases } from '../lib/menu-verification-validator.mjs';
import { buildMenuMaster, summarizeVerificationForMenu } from '../lib/menu-master-builder.mjs';

const library = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
const taxonomy = JSON.parse(fs.readFileSync(new URL('../data/ingredient-taxonomy.v1.json', import.meta.url), 'utf8'));
const research = JSON.parse(fs.readFileSync(new URL('../data/regional-menu-research.v1.json', import.meta.url), 'utf8'));
const verification = JSON.parse(fs.readFileSync(new URL('../data/menu-verification-cases.v1.json', import.meta.url), 'utf8'));

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

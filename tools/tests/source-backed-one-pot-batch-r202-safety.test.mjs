import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expectedIds = [
  'instant-pot-tuscan-chicken-rice',
  'taiwan-red-amaranth-chicken-rice',
  'taiwan-provencal-mushroom-chicken-risotto',
  'taiwan-tea-oil-bamboo-shoot-chicken-rice',
  'taiwan-golden-mushroom-chicken-rice',
];

test('r202 closes five directly evidenced chicken safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r229');
  assert.equal(catalog.recipes.length, 923);

  for (const recipeId of expectedIds) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.deepEqual(recipe.safety_endpoints, [{
      code: 'poultry_fully_cooked',
      minimum_core_temperature_c: 74,
      source_ids: ['S-SAFETY-TEMPERATURES-1'],
    }], recipeId);
    const safetySource = recipe.source_refs.find((source) => source.source_id === 'S-SAFETY-TEMPERATURES-1');
    assert.ok(safetySource, `${recipeId}: safety source`);
    assert.equal(safetySource.access_status, 'opened', recipeId);
    assert.equal(safetySource.evidence_tier, 1, recipeId);
    assert.deepEqual(safetySource.claim_scopes, ['safety'], recipeId);
    assert.ok(!['approved', 'auto_approved', 'executable', 'preview_ready'].includes(recipe.status), recipeId);
  }
});

test('r202 preserves each source appliance and staged-cooking boundary', () => {
  const instant = byId.get('instant-pot-tuscan-chicken-rice');
  assert.match(instant.cooking_sequence.map((step) => step.instruction).join(' '), /Instant Pot|高压|鸡腿/u);
  assert.equal(instant.cooker_adaptation.status, 'source_limited');

  const redAmaranth = byId.get('taiwan-red-amaranth-chicken-rice');
  assert.match(redAmaranth.cooking_sequence.map((step) => step.instruction).join(' '), /红凤菜|鸡腿|电饭锅/u);
  assert.equal(redAmaranth.cooker_adaptation.status, 'source_limited');

  const provencal = byId.get('taiwan-provencal-mushroom-chicken-risotto');
  assert.match(provencal.cooking_sequence.map((step) => step.instruction).join(' '), /鸡肉|菇类|电锅/u);
  assert.equal(provencal.cooker_adaptation.status, 'source_limited');

  const teaOil = byId.get('taiwan-tea-oil-bamboo-shoot-chicken-rice');
  assert.match(teaOil.cooking_sequence.map((step) => step.instruction).join(' '), /鸡腿|先以茶油煎熟|电锅/u);
  assert.equal(teaOil.cooker_adaptation.status, 'source_limited');

  const golden = byId.get('taiwan-golden-mushroom-chicken-rice');
  assert.match(golden.cooking_sequence.map((step) => step.instruction).join(' '), /鸡绞肉|炒熟|电锅/u);
  assert.equal(golden.cooker_adaptation.status, 'source_limited');
});

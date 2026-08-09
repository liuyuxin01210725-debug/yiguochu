import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expectedIds = [
  'cleveland-clinic-chicken-brown-rice-casserole',
  'bmc-chicken-carrots-brown-rice',
  'kidney-care-chicken-tikka-pulao',
  'firststeps-turkey-vegetable-pilaf',
  'healthvermont-one-pot-chicken-brown-rice',
];

test('r200 closes five directly evidenced medical and nutrition-source poultry gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r219');
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

test('r200 preserves the original one-pot, skillet, and oven boundaries', () => {
  const cleveland = byId.get('cleveland-clinic-chicken-brown-rice-casserole');
  assert.match(cleveland.cooking_sequence.map((step) => step.instruction).join(' '), /汤锅|低火|鸡肉/u);
  assert.equal(cleveland.cooker_adaptation.status, 'source_limited');

  const bmc = byId.get('bmc-chicken-carrots-brown-rice');
  assert.match(bmc.cooking_sequence.map((step) => step.instruction).join(' '), /煎锅|鸡腿|肉汤/u);
  assert.equal(bmc.cooker_adaptation.status, 'source_limited');

  const kidney = byId.get('kidney-care-chicken-tikka-pulao');
  assert.match(kidney.cooking_sequence.map((step) => step.instruction).join(' '), /鸡胸肉|低火|鸡汤/u);
  assert.equal(kidney.cooker_adaptation.status, 'source_limited');

  const turkey = byId.get('firststeps-turkey-vegetable-pilaf');
  assert.match(turkey.cooking_sequence.map((step) => step.instruction).join(' '), /火鸡胸|盖锅|400ml/u);
  assert.equal(turkey.cooker_adaptation.status, 'source_limited');

  const vermont = byId.get('healthvermont-one-pot-chicken-brown-rice');
  assert.match(vermont.cooking_sequence.map((step) => step.instruction).join(' '), /烤箱|鸡腿|45至50/u);
  assert.equal(vermont.cooker_adaptation.status, 'source_limited');
});

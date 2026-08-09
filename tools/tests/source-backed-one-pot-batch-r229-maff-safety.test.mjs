import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';

const expected = {
  'maff-ehime-shoyu-meshi': 'poultry_fully_cooked',
  'maff-okayama-todomese': 'poultry_fully_cooked',
};

test('r229 closes two MAFF raw-chicken safety gaps without changing recipe status', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r241');
  assert.equal(catalog.recipes.length, 923);
  for (const [recipeId, code] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    const endpoint = recipe.safety_endpoints.find(row => row.code === code);
    assert.ok(endpoint, `${recipeId} missing ${code}`);
    assert.equal(endpoint.minimum_core_temperature_c, 74, recipeId);
    assert.deepEqual(endpoint.source_ids, [safetySourceId], recipeId);
    const safetySource = recipe.source_refs.find(row => row.source_id === safetySourceId);
    assert.ok(safetySource, `${recipeId} missing shared safety source`);
    assert.equal(safetySource.url, 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures', recipeId);
    assert.equal(safetySource.access_status, 'opened', recipeId);
    assert.equal(safetySource.evidence_tier, 1, recipeId);
    assert.deepEqual(safetySource.claim_scopes, ['safety'], recipeId);
    assert.match(safetySource.evidence_locator, /poultry|chicken|74/i, recipeId);
  }
});

test('r229 keeps both MAFF recipes as source-backed research records', () => {
  for (const recipeId of Object.keys(expected)) {
    const recipe = byId[recipeId];
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.equal('executable' in recipe, false, recipeId);
    assert.equal(recipe.cooker_adaptation.status, 'not_adapted', recipeId);
  }
});

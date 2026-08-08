import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

const expected = {
  'tiger-duck-matsutake-rice': /poultry|duck|74/u,
  'maff-hyogo-aromatic-takikomi': /poultry|chicken|74/u,
  'instant-pot-one-pot-chicken-brown-rice': /poultry|chicken|74/u,
  'illinois-extension-arroz-con-pollo': /poultry|chicken|74/u,
};

test('r186 closes four directly evidenced raw poultry safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r194');
  for (const [recipeId, locator] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    const endpoint = recipe.safety_endpoints.find(row => row.code === 'poultry_fully_cooked');
    assert.ok(endpoint, `${recipeId} missing poultry endpoint`);
    assert.equal(endpoint.minimum_core_temperature_c, 74, recipeId);
    assert.deepEqual(endpoint.source_ids, [safetySourceId], recipeId);
    const source = recipe.source_refs.find(row => row.source_id === safetySourceId);
    assert.ok(source, `${recipeId} missing shared safety source`);
    assert.equal(source.url, safetyUrl, recipeId);
    assert.equal(source.access_status, 'opened', recipeId);
    assert.equal(source.evidence_tier, 1, recipeId);
    assert.match(source.evidence_locator, locator, recipeId);
    assert.deepEqual(source.claim_scopes, ['safety'], recipeId);
  }
});

test('r186 preserves original appliance and staged-process boundaries', () => {
  assert.equal(byId['tiger-duck-matsutake-rice']?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId['maff-hyogo-aromatic-takikomi']?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId['instant-pot-one-pot-chicken-brown-rice']?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId['illinois-extension-arroz-con-pollo']?.cooker_adaptation?.status, 'source_limited');
  assert.deepEqual(byId['r60-tiger-szechuan-pork-tacook-rice']?.safety_endpoints, []);
});

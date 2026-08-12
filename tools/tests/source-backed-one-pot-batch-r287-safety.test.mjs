import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

const expected = {
  'r58-taiwan-afa-pumpkin-rice': { code: 'pork_fully_cooked', temperature: 74, locator: /pork|猪|ground|绞/u },
  'startsmart-tomato-chicken-congee': { code: 'poultry_fully_cooked', temperature: 74, locator: /poultry|chicken|鸡|74/u },
  'taiwan-tuna-mushroom-quinoa-rice': { code: 'seafood_fully_cooked', temperature: 63, locator: /fish|tuna|鱼|63/u },
};

test('r287 closes three same-source raw-protein safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);

  for (const [recipeId, expectedEndpoint] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    const endpoint = recipe.safety_endpoints.find(row => row.code === expectedEndpoint.code);
    assert.ok(endpoint, `${recipeId} missing ${expectedEndpoint.code}`);
    assert.equal(endpoint.minimum_core_temperature_c, expectedEndpoint.temperature, recipeId);
    assert.deepEqual(endpoint.source_ids, [safetySourceId], recipeId);
    const source = recipe.source_refs.find(row => row.source_id === safetySourceId);
    assert.ok(source, `${recipeId} missing shared safety source`);
    assert.equal(source.url, safetyUrl, recipeId);
    assert.equal(source.access_status, 'opened', recipeId);
    assert.equal(source.evidence_tier, 1, recipeId);
    assert.match(source.evidence_locator, expectedEndpoint.locator, recipeId);
    assert.deepEqual(source.claim_scopes, ['safety'], recipeId);
  }
});

test('r287 preserves all three original source and appliance boundaries', () => {
  assert.equal(byId['r58-taiwan-afa-pumpkin-rice'].cooker_adaptation.status, 'source_limited');
  assert.equal(byId['startsmart-tomato-chicken-congee'].cooker_adaptation.status, 'not_adapted');
  assert.equal(byId['taiwan-tuna-mushroom-quinoa-rice'].cooker_adaptation.status, 'source_limited');
});

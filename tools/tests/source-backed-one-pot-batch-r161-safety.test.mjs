import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

const expected = {
  'instant-pot-quick-chicken-steamed-rice': { code: 'poultry_fully_cooked', temperature: 74, locator: /165|74|poultry|chicken/u },
  'instant-pot-spanish-chicken-rice': { code: 'poultry_fully_cooked', temperature: 74, locator: /74|poultry|chicken/u },
  'maff-hiroshima-tai-meshi': { code: 'seafood_fully_cooked', temperature: 63, locator: /63|fish|鲷/u },
  'maff-yamanashi-sanma-meshi': { code: 'seafood_fully_cooked', temperature: 63, locator: /63|fish|秋刀鱼/u },
  'tatung-salmon-pumpkin-milk-risotto': { code: 'seafood_fully_cooked', temperature: 63, locator: /63|fish|salmon|三文鱼/u },
};

test('r161 closes five directly evidenced raw poultry and fish safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r177');
  for (const [recipeId, expectedEndpoint] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
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

test('r161 keeps unresolved state and process conflicts blocked', () => {
  assert.deepEqual(byId['r60-tiger-szechuan-pork-tacook-rice']?.safety_endpoints, []);
  assert.deepEqual(byId['panasonic-tokyo-seafood-pilaf']?.safety_endpoints, []);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

const expected = {
  'taiwan-angelica-sesame-chicken-rice': { code: 'poultry_fully_cooked', temperature: 74, locator: /poultry|chicken|74/u },
  'panasonic-taiwan-chicken-curry-rice': { code: 'poultry_fully_cooked', temperature: 74, locator: /poultry|chicken|74/u },
  'panasonic-taiwan-pumpkin-mushroom-chicken-brown-rice': { code: 'poultry_fully_cooked', temperature: 74, locator: /poultry|chicken|74/u },
  'panasonic-taiwan-ginseng-chicken-rice': { code: 'poultry_fully_cooked', temperature: 74, locator: /poultry|chicken|74/u },
};

test('r246 closes four directly evidenced poultry safety gaps', () => {
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
    assert.equal('executable' in recipe, false, recipeId);
  }
});

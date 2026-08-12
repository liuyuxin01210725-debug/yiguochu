import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

const expected = {
  'iris-pc-mb3-takikomi-rice': {
    code: 'poultry_fully_cooked',
    temperature: 74,
    locator: /poultry|chicken|74/u,
  },
  'cookpot-three-cup-chicken-rice': {
    code: 'poultry_fully_cooked',
    temperature: 74,
    locator: /poultry|chicken|74/u,
  },
  'panasonic-taiwan-salmon-daikon-golden-rice': {
    code: 'seafood_fully_cooked',
    temperature: 63,
    locator: /fish|salmon|63/u,
  },
};

test('r260 closes three same-cooker raw-protein safety gaps with the existing controlled source', () => {
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

test('r260 preserves recipe contracts and does not promote the three records', () => {
  for (const recipeId of Object.keys(expected)) {
    const recipe = byId[recipeId];
    assert.equal(recipe.cooker_adaptation.status, 'source_limited', recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

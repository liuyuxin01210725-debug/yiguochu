import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

const expected = {
  'r60-tiger-garlic-shrimp-herbed-rice': {
    code: 'shellfish_fully_cooked',
    temperature: undefined,
    locator: /shrimp|shellfish|甲壳类|虾/u,
  },
  'r60-tiger-taiwan-minced-pork-rice': {
    code: 'pork_fully_cooked',
    temperature: 74,
    locator: /pork|猪|casseroles|74/u,
  },
  'r60-tiger-salmon-rice': {
    code: 'seafood_fully_cooked',
    temperature: 63,
    locator: /salmon|fish|63/u,
  },
  'r60-tiger-chicken-brown-rice-soup': {
    code: 'poultry_fully_cooked',
    temperature: 74,
    locator: /poultry|chicken|74/u,
  },
  'taiwan-pork-rib-claypot-rice': {
    code: 'pork_fully_cooked',
    temperature: 74,
    locator: /pork|猪|casseroles|74/u,
  },
  'panasonic-taiwan-mushroom-chicken-bamboo-rice': {
    code: 'poultry_fully_cooked',
    temperature: 74,
    locator: /poultry|chicken|74/u,
  },
  'panasonic-taiwan-shiitake-bamboo-chicken-rice': {
    code: 'poultry_fully_cooked',
    temperature: 74,
    locator: /poultry|chicken|74/u,
  },
  'hk-tomato-mushroom-chicken-rice': {
    code: 'poultry_fully_cooked',
    temperature: 74,
    locator: /poultry|chicken|74/u,
  },
  'hk-pumpkin-shiitake-pork-rice': {
    code: 'pork_fully_cooked',
    temperature: 74,
    locator: /pork|猪|casseroles|74/u,
  },
  'hk-sakura-shrimp-chicken-quinoa-rice': {
    code: 'poultry_fully_cooked',
    temperature: 74,
    locator: /poultry|chicken|74/u,
  },
};

test('r160 closes only directly evidenced raw-protein safety gaps with the existing controlled source', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r202');
  for (const [recipeId, expectedEndpoint] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    const endpoint = recipe.safety_endpoints.find(row => row.code === expectedEndpoint.code);
    assert.ok(endpoint, `${recipeId} missing ${expectedEndpoint.code}`);
    if (expectedEndpoint.temperature === undefined) assert.equal(endpoint.minimum_core_temperature_c, undefined, recipeId);
    else assert.equal(endpoint.minimum_core_temperature_c, expectedEndpoint.temperature, recipeId);
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

test('r160 keeps the Tiger process-conflict candidate blocked', () => {
  assert.deepEqual(byId['r60-tiger-szechuan-pork-tacook-rice']?.safety_endpoints, []);
});

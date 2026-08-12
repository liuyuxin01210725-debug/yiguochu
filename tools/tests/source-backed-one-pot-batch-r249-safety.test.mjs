import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

const expected = [
  'r99-taiwan-golden-wild-mushroom-quinoa-chicken-rice',
  'saito-wakeshiko-torimeshi',
];

test('r249 closes two directly evidenced fixed-batch poultry safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  for (const recipeId of expected) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.ok(recipe.fixed_batch, recipeId);
    assert.ok(recipe.liquid_contract, recipeId);
    const endpoint = recipe.safety_endpoints.find(row => row.code === 'poultry_fully_cooked');
    assert.ok(endpoint, `${recipeId} missing poultry endpoint`);
    assert.equal(endpoint.minimum_core_temperature_c, 74, recipeId);
    assert.deepEqual(endpoint.source_ids, [safetySourceId], recipeId);
    const source = recipe.source_refs.find(row => row.source_id === safetySourceId);
    assert.ok(source, `${recipeId} missing shared safety source`);
    assert.equal(source.url, safetyUrl, recipeId);
    assert.equal(source.access_status, 'opened', recipeId);
    assert.equal(source.evidence_tier, 1, recipeId);
    assert.match(source.evidence_locator, /poultry|chicken|74/u, recipeId);
    assert.deepEqual(source.claim_scopes, ['safety'], recipeId);
    assert.equal('executable' in recipe, false, recipeId);
  }
});

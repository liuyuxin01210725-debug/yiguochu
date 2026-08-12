import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

const expected = {
  'tvb-chestnut-chicken-rice': /chicken thigh|焗熟/u,
  'tvb-quinoa-chestnut-mushroom-chicken-rice': /marinated frozen chicken thigh|急凍雞髀肉/u,
};

test('r273 adds poultry endpoints only where the TVB source explicitly supplies chicken process/state facts', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  for (const [recipeId, locatorPattern] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.deepEqual(recipe.safety_endpoints, [{
      code: 'poultry_fully_cooked',
      minimum_core_temperature_c: 74,
      source_ids: [safetySourceId],
    }], recipeId);
    const safetySource = recipe.source_refs.find((source) => source.source_id === safetySourceId);
    assert.ok(safetySource, `${recipeId} missing safety source`);
    assert.equal(safetySource.url, safetyUrl, recipeId);
    assert.equal(safetySource.access_status, 'opened', recipeId);
    assert.equal(safetySource.evidence_tier, 1, recipeId);
    assert.deepEqual(safetySource.claim_scopes, ['safety'], recipeId);
    assert.match(safetySource.evidence_locator, locatorPattern, recipeId);
  }
});

test('r273 keeps unrelated TVB and source-conflict safety gaps untouched', () => {
  assert.deepEqual(byId['r60-tiger-szechuan-pork-tacook-rice']?.safety_endpoints, []);
  assert.deepEqual(byId['tvb-quinoa-chestnut-mushroom-chicken-rice']?.cooker_adaptation?.status, 'source_limited');
});

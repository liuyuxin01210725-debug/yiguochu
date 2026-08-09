import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

const expected = {
  'hk-salmon-edamame-quinoa-rice': /fin fish|salmon|63/u,
  'taiwan-brown-rice-salmon-rice': /fin fish|salmon|63/u,
  'taiwan-fresh-fish-wild-mushroom-rice': /fin fish|fish|63/u,
};

test('r187 closes three directly evidenced raw fish safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r238');
  for (const [recipeId, locator] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    const endpoint = recipe.safety_endpoints.find(row => row.code === 'seafood_fully_cooked');
    assert.ok(endpoint, `${recipeId} missing seafood endpoint`);
    assert.equal(endpoint.minimum_core_temperature_c, 63, recipeId);
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

test('r187 preserves direct and staged appliance boundaries', () => {
  assert.equal(byId['hk-salmon-edamame-quinoa-rice']?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId['taiwan-brown-rice-salmon-rice']?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId['taiwan-fresh-fish-wild-mushroom-rice']?.cooker_adaptation?.status, 'source_limited');
  assert.match(byId['taiwan-fresh-fish-wild-mushroom-rice']?.cooking_sequence?.[2]?.instruction ?? '', /鱼肉确认熟透/u);
  assert.deepEqual(byId['tiger-steamed-abalone-rice']?.safety_endpoints, []);
});

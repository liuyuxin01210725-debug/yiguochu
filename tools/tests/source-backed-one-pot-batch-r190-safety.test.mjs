import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';

const expected = {
  'ntuh-salmon-mixed-mushroom-rice': ['seafood_fully_cooked', 63, /fish|salmon|鲑/u],
  'taiwan-pine-nut-chicken-wild-mushroom-rice': ['poultry_fully_cooked', 74, /poultry|chicken|禽|鸡/u],
};

test('r190 closes two directly evidenced raw-protein safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r254');
  for (const [recipeId, [code, temperature, locatorPattern]] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    const endpoint = recipe.safety_endpoints.find(row => row.code === code);
    assert.ok(endpoint, `${recipeId} missing ${code}`);
    assert.equal(endpoint.minimum_core_temperature_c, temperature, recipeId);
    assert.deepEqual(endpoint.source_ids, [safetySourceId], recipeId);
    const source = recipe.source_refs.find(row => row.source_id === safetySourceId);
    assert.ok(source, `${recipeId} missing safety source`);
    assert.equal(source.access_status, 'opened', recipeId);
    assert.equal(source.evidence_tier, 1, recipeId);
    assert.match(source.evidence_locator, locatorPattern, recipeId);
    assert.deepEqual(source.claim_scopes, ['safety'], recipeId);
  }
});

test('r190 keeps the two recipes source-limited and does not infer shellfish safety', () => {
  assert.equal(byId['ntuh-salmon-mixed-mushroom-rice']?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId['taiwan-pine-nut-chicken-wild-mushroom-rice']?.cooker_adaptation?.status, 'source_limited');
  for (const recipeId of Object.keys(expected)) {
    assert.deepEqual(byId[recipeId]?.safety_endpoints.filter(row => row.code === 'shellfish_fully_cooked'), [], recipeId);
  }
});

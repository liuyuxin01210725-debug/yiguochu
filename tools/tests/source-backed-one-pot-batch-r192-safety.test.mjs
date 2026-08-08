import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';

const expected = {
  'maff-salmon-green-onion-takikomi': ['seafood_fully_cooked', 63, /fish|salmon|鲑/u],
  'zojirushi-nonokomeshi-el-mb30': ['poultry_fully_cooked', 74, /poultry|chicken|禽|鸡/u],
};

test('r192 closes two directly evidenced raw-protein safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r202');
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

test('r192 preserves the source-specific ordinary-pot and pressure-IH boundaries', () => {
  assert.equal(byId['maff-salmon-green-onion-takikomi']?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(byId['zojirushi-nonokomeshi-el-mb30']?.cooker_adaptation?.status, 'source_limited');
  assert.match(byId['maff-salmon-green-onion-takikomi']?.cooking_sequence?.[0]?.instruction ?? '', /普通锅|米/u);
  assert.match(byId['zojirushi-nonokomeshi-el-mb30']?.cooking_sequence?.[1]?.instruction ?? '', /压力|27分/u);
});

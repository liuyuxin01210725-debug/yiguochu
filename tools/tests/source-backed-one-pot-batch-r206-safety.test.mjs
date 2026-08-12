import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

const expected = {
  'sichuan-rice-cooker-pork-ribs-rice': ['pork_fully_cooked', 74],
  'tiger-gomoku-rice-post43': ['poultry_fully_cooked', 74],
  'panasonic-spring-chicken-vegetable-risotto': ['poultry_fully_cooked', 74],
  'panasonic-chicken-biryani-sr-da182': ['poultry_fully_cooked', 74],
  'iris-kpc-ma2-paella-recipe29': ['poultry_fully_cooked', 74],
  'iris-kpc-ma2-hainan-chicken-rice': ['poultry_fully_cooked', 74],
};

test('r206 closes six directly evidenced raw poultry and pork safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);

  for (const [recipeId, [code, temperature]] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    const endpoint = recipe.safety_endpoints.find(row => row.code === code);
    assert.ok(endpoint, `${recipeId} missing ${code}`);
    assert.equal(endpoint.minimum_core_temperature_c, temperature, recipeId);
    assert.deepEqual(endpoint.source_ids, [safetySourceId], recipeId);
    const source = recipe.source_refs.find(row => row.source_id === safetySourceId);
    assert.ok(source, `${recipeId} missing shared safety source`);
    assert.equal(source.url, safetyUrl, recipeId);
    assert.equal(source.access_status, 'opened', recipeId);
    assert.equal(source.evidence_tier, 1, recipeId);
    assert.deepEqual(source.claim_scopes, ['safety'], recipeId);
  }
});

test('r206 preserves source-specific cooker and staged boundaries', () => {
  assert.match(byId['sichuan-rice-cooker-pork-ribs-rice'].evidence_notes, /焯|煎|电饭煲/u);
  assert.match(byId['tiger-gomoku-rice-post43'].cooker_adaptation.notes, /Tiger|指定|不外推/u);
  assert.match(byId['panasonic-spring-chicken-vegetable-risotto'].cooker_adaptation.notes, /Panasonic|普通电饭煲|source/u);
  assert.match(byId['panasonic-chicken-biryani-sr-da182'].cooker_adaptation.notes, /SR-DA182|分阶段|不外推/u);
  assert.match(byId['iris-kpc-ma2-paella-recipe29'].cooker_adaptation.notes, /KPC-MA2|压力|不外推/u);
  assert.match(byId['iris-kpc-ma2-hainan-chicken-rice'].evidence_notes, /酱汁另做|KPC-MA2|铺米/u);
});

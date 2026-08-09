import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

const promoted = {
  'tiger-chicken-bamboo-rice': ['poultry_fully_cooked', 74],
  'tiger-whitefish-mixed-rice': ['seafood_fully_cooked', 63],
  'panasonic-claypot-style-chicken-rice': ['poultry_fully_cooked', 74],
  'hk-pumpkin-taro-chicken-claypot-rice': ['poultry_fully_cooked', 74],
  'tiger-pork-bamboo-rice': ['pork_fully_cooked', 74],
  'tiger-steak-mushroom-barley-rice': ['beef_fully_cooked', 71],
  'tatung-salmon-pumpkin-milk-risotto': ['seafood_fully_cooked', 63],
  'tatung-seafood-porridge': ['seafood_fully_cooked', 63],
};

test('r203 promotes only the eight complete source-backed contracts', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r218');
  assert.equal(catalog.recipes.length, 923);
  for (const [recipeId, [safetyCode, temperature]] of Object.entries(promoted)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, 'executable', recipeId);
    for (const field of ['fixed_batch', 'liquid_contract', 'cooking_sequence', 'time_contract', 'safety_endpoints', 'allergen_labels']) {
      assert.ok(recipe[field] != null && (!Array.isArray(recipe[field]) || recipe[field].length > 0), `${recipeId} missing ${field}`);
    }
    const endpoint = recipe.safety_endpoints.find(row => row.code === safetyCode);
    assert.ok(endpoint, `${recipeId} missing ${safetyCode}`);
    assert.equal(endpoint.minimum_core_temperature_c, temperature, recipeId);
    assert.deepEqual(endpoint.source_ids, ['S-SAFETY-TEMPERATURES-1'], recipeId);
  }
});

test('r203 preserves unresolved contracts outside the executable promotion', () => {
  const stillFactChecked = [
    'taiwan-cabbage-rice',
    'taiwan-pumpkin-rice',
    'r60-tiger-taiwan-minced-pork-rice',
    'r60-tiger-garlic-shrimp-herbed-rice',
  ];
  for (const recipeId of stillFactChecked) assert.equal(byId[recipeId]?.status, 'recipe_fact_checked', recipeId);
  assert.equal(Object.values(byId).filter(recipe => recipe.status === 'executable').length, 36);
});

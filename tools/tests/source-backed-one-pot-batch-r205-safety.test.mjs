import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

const expected = {
  'hk-yam-longan-chicken-claypot-rice': [['poultry_fully_cooked', 74]],
  'cookpot-beef-wild-mushroom-rice': [['beef_fully_cooked', 71]],
  'tatung-pork-daikon-rice': [['pork_fully_cooked', 74]],
  'tatung-wakayama-ginger-rice': [['poultry_fully_cooked', 74]],
  'tefal-paella-r106320': [
    ['poultry_fully_cooked', 74],
    ['seafood_fully_cooked', 63],
    ['shellfish_fully_cooked', null],
  ],
  'tefal-risotto-with-shrimps-r106225': [['shellfish_fully_cooked', null]],
  'global-spain-arroz-negro': [['seafood_fully_cooked', 63]],
  'hk-mushroom-grass-carp-congee': [['seafood_fully_cooked', 63]],
  'instant-pot-chicken-enchilada-rice': [['poultry_fully_cooked', 74]],
  'va-pork-rice-skillet': [['pork_fully_cooked', 74]],
};

test('r205 closes ten directly sourced safety contracts', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r235');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(catalog.recipes.filter(recipe => recipe.status === 'executable').length, 36);
  for (const [recipeId, endpoints] of Object.entries(expected)) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, recipeId === 'va-pork-rice-skillet' ? 'recipe_fact_checked' : 'executable', recipeId);
    assert.ok(recipe.fixed_batch, recipeId);
    assert.ok(recipe.liquid_contract, recipeId);
    assert.ok(Array.isArray(recipe.cooking_sequence) && recipe.cooking_sequence.length > 0, recipeId);
    assert.ok(recipe.time_contract, recipeId);
    assert.ok(Array.isArray(recipe.allergen_labels) && recipe.allergen_labels.length > 0, recipeId);
    for (const [code, temperature] of endpoints) {
      const endpoint = recipe.safety_endpoints.find(item => item.code === code);
      assert.ok(endpoint, `${recipeId} missing ${code}`);
      if (temperature === null) assert.equal(endpoint.minimum_core_temperature_c, undefined, recipeId);
      else assert.equal(endpoint.minimum_core_temperature_c, temperature, recipeId);
      assert.deepEqual(endpoint.source_ids, ['S-SAFETY-TEMPERATURES-1'], recipeId);
    }
    assert.ok(recipe.source_refs.some(source => source.source_id === 'S-SAFETY-TEMPERATURES-1'), recipeId);
  }
});

test('r205 keeps staged and named-appliance boundaries', () => {
  const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.match(byId['hk-yam-longan-chicken-claypot-rice'].cooker_adaptation.notes, /煲|电饭煲/u);
  assert.match(byId['tefal-paella-r106320'].cooker_adaptation.notes, /Tefal|温控|普通电饭煲/u);
  assert.match(byId['tefal-risotto-with-shrimps-r106225'].cooker_adaptation.notes, /Tefal|分次|搅拌/u);
  assert.match(byId['instant-pot-chicken-enchilada-rice'].cooker_adaptation.notes, /Instant Pot|Sauté|压力/u);
});

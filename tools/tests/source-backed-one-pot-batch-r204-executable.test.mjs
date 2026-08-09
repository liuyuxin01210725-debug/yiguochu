import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const expected = {
  'tatung-paella-style-seafood-rice': ['shellfish_fully_cooked', null],
  'tiger-chinese-sticky-rice': ['pork_fully_cooked', 74],
  'hk-taro-shrimp-multigrain-steamed-rice': ['seafood_fully_cooked', 74],
  'r61-tiger-easy-khao-man-gai': ['poultry_fully_cooked', 74],
  'tiger-usa-century-egg-fish-porridge': ['seafood_fully_cooked', 63],
  'instant-pot-chicken-satay-rice': ['poultry_fully_cooked', 74],
  'tamu-turkey-burrito-bowl': ['poultry_fully_cooked', 74],
};

test('r204 promotes seven fully contracted source-backed recipes', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r235');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(catalog.recipes.filter(recipe => recipe.status === 'executable').length, 36);
  for (const [recipeId, [code, temperature]] of Object.entries(expected)) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'executable', recipeId);
    assert.ok(recipe.fixed_batch, recipeId);
    assert.ok(recipe.liquid_contract, recipeId);
    assert.ok(Array.isArray(recipe.cooking_sequence) && recipe.cooking_sequence.length > 0, recipeId);
    assert.ok(recipe.time_contract, recipeId);
    const endpoint = recipe.safety_endpoints.find(item => item.code === code);
    assert.ok(endpoint, `${recipeId} missing ${code}`);
    if (temperature === null) assert.equal(endpoint.minimum_core_temperature_c, undefined, recipeId);
    else assert.equal(endpoint.minimum_core_temperature_c, temperature, recipeId);
    assert.deepEqual(endpoint.source_ids, ['S-SAFETY-TEMPERATURES-1'], recipeId);
    assert.ok(Array.isArray(recipe.allergen_labels) && recipe.allergen_labels.length > 0, recipeId);
  }
});

test('r204 keeps the named appliance and staged boundaries intact', () => {
  const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.equal(byId['tatung-paella-style-seafood-rice'].cooker_adaptation.status, 'source_limited');
  assert.match(byId['tiger-chinese-sticky-rice'].cooker_adaptation.notes, /おこわ|浸泡|先炒/u);
  assert.equal(byId['hk-taro-shrimp-multigrain-steamed-rice'].cooker_adaptation.status, 'not_adapted');
  assert.match(byId['r61-tiger-easy-khao-man-gai'].cooker_adaptation.notes, /COK-A220|压力/u);
  assert.match(byId['tiger-usa-century-egg-fish-porridge'].cooker_adaptation.notes, /Porridge|水位/u);
  assert.match(byId['instant-pot-chicken-satay-rice'].cooker_adaptation.notes, /Instant Pot|Sauté|压力/u);
  assert.match(byId['tamu-turkey-burrito-bowl'].cooker_adaptation.notes, /电压力锅|Sauté|高压/u);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const ingredient = (recipe, name) => {
  const found = recipe.fixed_batch?.ingredients?.find((item) => item.name === name);
  assert.ok(found, `${recipe.recipe_id} missing ${name}`);
  return found;
};

test('r237 records exact fixed batches from the opened official public pages', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r246');
  assert.equal(catalog.recipes.length, 923);

  const expected = [
    ['r100-macau-tomato-chicken-rice', 4, '鸡腿肉', 400, 'g'],
    ['r100-hk-corn-pumpkin-chicken-ball-rice', 1, '鸡球', 142, 'g'],
    ['r100-hk-scallop-egg-braised-rice', 2, '瑶柱', 15, 'g'],
    ['r100-hk-garlic-wild-mushroom-stonepot-rice', 1, '杂菜', 150, 'g'],
  ];

  for (const [recipeId, servings, ingredientName, value, unit] of expected) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.fixed_batch?.servings, servings, recipeId);
    assert.deepEqual(ingredient(recipe, ingredientName).amount, { value, unit }, recipeId);
    assert.equal(recipe.liquid_contract, null, recipeId);
    assert.equal(recipe.time_contract, null, recipeId);
    assert.equal(recipe.cooker_adaptation.status, 'not_adapted', recipeId);
  }
});

test('r237 preserves cooked-rice and multi-stage boundaries', () => {
  for (const recipeId of [
    'r100-macau-tomato-chicken-rice',
    'r100-hk-corn-pumpkin-chicken-ball-rice',
    'r100-hk-scallop-egg-braised-rice',
    'r100-hk-garlic-wild-mushroom-stonepot-rice',
  ]) {
    const recipe = byId[recipeId];
    assert.match(recipe.cooker_adaptation.notes, /熟饭|另煮|石锅|多阶段/u, recipeId);
    assert.equal('executable' in recipe, false, recipeId);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalog = JSON.parse(
  fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'),
);

const byId = (recipeId) => {
  const recipe = catalog.recipes.find((entry) => entry.recipe_id === recipeId);
  assert.ok(recipe, `missing ${recipeId}`);
  return recipe;
};

const ingredient = (recipe, name) => {
  const found = recipe.fixed_batch?.ingredients?.find((entry) => entry.name === name);
  assert.ok(found, `${recipe.recipe_id} missing ingredient ${name}`);
  return found;
};

test('r224 keeps the 923-entry catalog and advances the catalog version', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r230');
  assert.equal(catalog.recipes.length, 923);
});

test('r224 closes the five-person Shizuoka someimeshi batch without inventing optional sesame', () => {
  const recipe = byId('maff-shizuoka-someimeshi');
  assert.equal(recipe.fixed_batch.servings, 5);
  for (const [name, amount] of [
    ['米', { value: 1, unit: '合' }],
    ['糯米', { value: 1, unit: '合' }],
    ['栀子', { value: 1, unit: '至2个' }],
    ['水（栀子浸出液）', { value: 1, unit: 'cup' }],
    ['盐', { value: 0.6666666667, unit: '小匙' }],
    ['酒', { value: 1, unit: '大匙' }],
    ['水（A调味液）', { value: 1, unit: 'cup' }],
    ['煎茶', { value: 1, unit: '小匙' }],
  ]) {
    assert.deepEqual(ingredient(recipe, name).amount, amount);
  }
  assert.deepEqual(recipe.liquid_contract, {
    kind: 'added_water',
    amount: { value: 2, unit: 'cup' },
    source_ids: ['S-MAFF-SHIZUOKA-SOMEIMESHI-1'],
  });
  assert.equal(recipe.time_contract, null);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.cooker_adaptation.status, 'source_limited');
  assert.equal('executable' in recipe, false);
});

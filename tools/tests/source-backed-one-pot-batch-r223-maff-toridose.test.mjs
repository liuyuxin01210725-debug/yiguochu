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

test('r223 keeps the 923-entry catalog and advances the catalog version', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r236');
  assert.equal(catalog.recipes.length, 923);
});

test('r223 closes the exact Chiba toridose batch while preserving its cooked-rice boundary', () => {
  const recipe = byId('maff-chiba-toridose');
  assert.equal(recipe.fixed_batch.servings, 10);
  for (const [name, amount] of [
    ['熟饭', { value: 10, unit: '碗' }],
    ['鸡肉', { value: 500, unit: 'g' }],
    ['牛蒡', { value: 300, unit: 'g' }],
    ['水或出汁', { value: 2, unit: 'L' }],
  ]) {
    assert.deepEqual(ingredient(recipe, name).amount, amount);
  }
  assert.deepEqual(recipe.liquid_contract, {
    kind: 'added_water',
    amount: { value: 2, unit: 'L' },
    source_ids: ['S-MAFF-CHIBA-TORIDOSE-1'],
  });
  assert.equal(recipe.time_contract, null);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
  assert.equal('executable' in recipe, false);
});

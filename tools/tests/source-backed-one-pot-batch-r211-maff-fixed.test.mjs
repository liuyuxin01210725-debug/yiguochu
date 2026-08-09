import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

function ingredient(recipe, name) {
  return recipe.fixed_batch.ingredients.find((row) => row.name === name);
}

test('r211 closes Kagoshima ginger takikomi exact four-person batch', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r246');
  const recipe = byId['kagoshima-ginger-takikomi-gohan'];
  assert.ok(recipe);
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.equal(ingredient(recipe, '米').amount.value, 2);
  assert.equal(ingredient(recipe, '油豆腐').amount.value, 60);
  assert.equal(ingredient(recipe, '新姜').amount.value, 30);
  assert.deepEqual(recipe.fixed_batch.source_ids, ['S-KAGOSHIMA-GINGER-R62']);
});

test('r211 closes Kochi mushroom ginkgo takikomi exact four-person batch', () => {
  const recipe = byId['kochi-nakamura-mushroom-ginkgo-takikomi'];
  assert.ok(recipe);
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.equal(ingredient(recipe, '米').amount.value, 450);
  assert.equal(ingredient(recipe, '真姬菇').amount.value, 100);
  assert.equal(ingredient(recipe, '金针菇').amount.value, 100);
  assert.equal(ingredient(recipe, '鸡腿肉').amount.value, 160);
  assert.deepEqual(recipe.fixed_batch.source_ids, ['S-KOCHI-NAKAMURA-MUSHROOM-GINKGO-R62']);
});

test('r211 closes Wakayama pea rice exact four-person batch', () => {
  const recipe = byId['wakayama-usuendo-mame-gohan'];
  assert.ok(recipe);
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.equal(ingredient(recipe, '米').amount.value, 3);
  assert.equal(ingredient(recipe, '豌豆').amount.value, 200);
  assert.equal(ingredient(recipe, '酒').amount.value, 2);
  assert.equal(ingredient(recipe, '盐').amount.value, 1);
  assert.deepEqual(recipe.fixed_batch.source_ids, ['S-MAFF-WAKAYAMA-USUENDO-R62']);
});

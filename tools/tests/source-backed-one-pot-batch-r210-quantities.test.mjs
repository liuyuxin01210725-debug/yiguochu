import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

function ingredient(recipe, name) {
  return recipe.fixed_batch.ingredients.find((row) => row.name === name);
}

test('r210 closes Tiger takeout vegetable fried rice fixed batch and source cooking time', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r220');
  const recipe = byId['r60-tiger-takeout-vegetable-fried-rice'];
  assert.ok(recipe);
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.equal(ingredient(recipe, '生白米').amount.value, 2);
  assert.equal(ingredient(recipe, '混合蔬菜').amount.value, 3);
  assert.equal(ingredient(recipe, '鸡汤').amount.value, 1.75);
  assert.equal(recipe.time_contract.total_minutes, 65);
  assert.deepEqual(recipe.fixed_batch.source_ids, ['S-TIGER-TAKEOUT-VEGETABLE-FRIED-RICE-R60']);
  assert.deepEqual(recipe.time_contract.source_ids, ['S-TIGER-TAKEOUT-VEGETABLE-FRIED-RICE-R60']);
});

test('r210 closes Tiger brown rice curry pilaf exact three-person batch', () => {
  const recipe = byId['tiger-brown-rice-curry-pilaf'];
  assert.ok(recipe);
  assert.equal(recipe.fixed_batch.servings, 3);
  assert.equal(ingredient(recipe, '玄米').amount.value, 2);
  assert.equal(ingredient(recipe, '香肠').amount.value, 80);
  assert.equal(ingredient(recipe, '蘑菇').amount.value, 30);
  assert.deepEqual(recipe.fixed_batch.source_ids, ['S-TIGER-BROWN-RICE-CURRY-PILAF-1']);
});

test('r210 closes Panasonic cabbage mackerel rice exact three-person batch', () => {
  const recipe = byId['panasonic-taiwan-cabbage-mackerel-rice'];
  assert.ok(recipe);
  assert.equal(recipe.fixed_batch.servings, 3);
  assert.equal(ingredient(recipe, '白米').amount.value, 1);
  assert.equal(ingredient(recipe, '薄盐鲭鱼').amount.value, 1);
  assert.equal(ingredient(recipe, '鸿喜菇').amount.value, 0.25);
  assert.deepEqual(recipe.fixed_batch.source_ids, ['S-PANASONIC-TAIWAN-CABBAGE-MACKEREL-RICE-1']);
});

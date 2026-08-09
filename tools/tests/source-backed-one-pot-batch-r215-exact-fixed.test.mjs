import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

function ingredient(recipe, name) {
  return recipe.fixed_batch?.ingredients?.find((item) => item.name === name);
}

test('r215 closes Tiger COK-B220 chicken paella fixed batch and poultry endpoint', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r243');
  const recipe = byId['tiger-chicken-paella'];
  assert.equal(recipe.fixed_batch.servings, 3);
  assert.equal(ingredient(recipe, '米').amount.value, 300);
  assert.equal(ingredient(recipe, '水').amount.value, 330);
  assert.equal(ingredient(recipe, '鸡腿肉').amount.value, 120);
  assert.equal(recipe.safety_endpoints[0].code, 'poultry_fully_cooked');
});

test('r215 closes Tiger COK-B220 cheese curry pilaf fixed batch', () => {
  const recipe = byId['tiger-cheese-curry-pilaf'];
  assert.equal(recipe.fixed_batch.servings, 3);
  assert.equal(ingredient(recipe, '米').amount.value, 300);
  assert.equal(ingredient(recipe, '金枪鱼').amount.value, 70);
  assert.equal(ingredient(recipe, '玉米').amount.value, 70);
  assert.equal(ingredient(recipe, '芝士').amount.value, 30);
});

test('r215 closes MAFF Aichi kakimawashi four-person known quantities and poultry endpoint', () => {
  const recipe = byId['maff-aichi-kakimawashi'];
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.equal(ingredient(recipe, '米').amount.value, 2);
  assert.equal(ingredient(recipe, '鸡腿肉').amount.value, 50);
  assert.equal(ingredient(recipe, '牛蒡').amount.value, 0.25);
  assert.equal(ingredient(recipe, '竹轮').amount.value, 2);
  assert.equal(recipe.safety_endpoints[0].code, 'poultry_fully_cooked');
});

test('r215 closes Tatung Fukagawa two-person exact non-range quantities without collapsing clam range', () => {
  const recipe = byId['tatung-fukagawa-rice'];
  assert.equal(recipe.fixed_batch.servings, 2);
  assert.equal(ingredient(recipe, '米').amount.value, 2);
  assert.equal(ingredient(recipe, '油炸豆腐').amount.value, 1);
  assert.equal(ingredient(recipe, '胡萝卜').amount.value, 30);
  assert.equal(ingredient(recipe, '青葱').amount.value, 2);
  assert.equal(ingredient(recipe, '蛤蜊'), undefined);
});

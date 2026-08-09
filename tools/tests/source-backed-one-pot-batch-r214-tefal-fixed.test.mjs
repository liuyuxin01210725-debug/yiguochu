import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

function ingredient(recipe, name) {
  return recipe.fixed_batch?.ingredients?.find((item) => item.name === name);
}

test('r214 closes TEFAL602 chicken-pea risotto four-person batch', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r215');
  const recipe = byId['tefal-602-chicken-pea-risotto'];
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.equal(ingredient(recipe, 'Arborio米').amount.value, 300);
  assert.equal(ingredient(recipe, '鸡高汤').amount.value, 650);
  assert.equal(ingredient(recipe, '熟鸡肉').amount.value, 250);
  assert.equal(ingredient(recipe, '豌豆').amount.value, 75);
});

test('r214 closes TEFAL602 smoked-haddock kedgeree four-person batch', () => {
  const recipe = byId['tefal-602-smoked-haddock-kedgeree'];
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.equal(ingredient(recipe, '印度香米').amount.value, 250);
  assert.equal(ingredient(recipe, '烟熏黑线鳕').amount.value, 300);
  assert.equal(ingredient(recipe, '高汤').amount.value, 400);
});

test('r214 closes TEFAL602 seafood paella four-person batch', () => {
  const recipe = byId['tefal-602-seafood-paella'];
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.equal(ingredient(recipe, 'Paella米').amount.value, 300);
  assert.equal(ingredient(recipe, '鱼高汤').amount.value, 500);
  assert.equal(ingredient(recipe, '海鲜混合').amount.value, 250);
  assert.equal(ingredient(recipe, '豌豆').amount.value, 75);
});

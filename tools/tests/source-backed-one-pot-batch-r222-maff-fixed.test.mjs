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

test('r222 keeps the 923-entry catalog and advances the catalog version', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r249');
  assert.equal(catalog.recipes.length, 923);
});

test('r222 closes the one-person Miyazaki toukibimeshi quantity without inventing liquid', () => {
  const recipe = byId('maff-miyazaki-toukibimeshi');
  assert.equal(recipe.fixed_batch.servings, 1);
  assert.deepEqual(ingredient(recipe, '米').amount, { value: 160, unit: 'g' });
  assert.deepEqual(ingredient(recipe, '粗磨玉米或细磨玉米').amount, { value: 20, unit: 'g' });
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
  assert.equal('executable' in recipe, false);
});

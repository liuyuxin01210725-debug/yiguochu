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

test('r225 keeps the 923-entry catalog and advances the catalog version', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r235');
  assert.equal(catalog.recipes.length, 923);
});

test('r225 closes the four-person Hokkaido ikameshi batch while preserving squid range and liquid gaps', () => {
  const recipe = byId('maff-hokkaido-ikameshi');
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.deepEqual(ingredient(recipe, '鱿鱼').amount, { value: 4, unit: '至8杯' });
  assert.deepEqual(ingredient(recipe, '糯米').amount, { value: 1, unit: '杯' });
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
  assert.equal('executable' in recipe, false);
});

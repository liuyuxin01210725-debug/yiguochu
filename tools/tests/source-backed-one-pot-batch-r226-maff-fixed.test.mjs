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

test('r226 keeps the 923-entry catalog and advances the catalog version', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r241');
  assert.equal(catalog.recipes.length, 923);
});

test('r226 closes four MAFF fixed batches without collapsing vessel or rice-state boundaries', () => {
  const mitama = byId('maff-ishikawa-mitama');
  assert.equal(mitama.fixed_batch.servings, 4);
  assert.deepEqual(ingredient(mitama, '糯米').amount, { value: 5, unit: '杯' });
  assert.deepEqual(ingredient(mitama, '黑豆').amount, { value: 1, unit: '杯' });
  assert.equal(mitama.liquid_contract, null);

  const irimeshi = byId('maff-tokushima-irimeshi');
  assert.equal(irimeshi.fixed_batch.servings, 4);
  assert.deepEqual(ingredient(irimeshi, '米').amount, { value: 300, unit: 'g（2合）' });
  assert.deepEqual(irimeshi.liquid_contract, {
    kind: 'added_water',
    amount: { value: 450, unit: 'mL' },
    source_ids: ['S-MAFF-TOKUSHIMA-IRIMESHI-1'],
  });

  const koshimeshi = byId('maff-kochi-koshimeshi');
  assert.equal(koshimeshi.fixed_batch.servings, 10);
  assert.deepEqual(ingredient(koshimeshi, '米').amount, { value: 750, unit: 'g（5合）' });
  assert.equal(koshimeshi.liquid_contract, null);

  const kuri = byId('maff-saga-kuri-okowa');
  assert.equal(kuri.fixed_batch.servings, 4);
  assert.deepEqual(ingredient(kuri, '糯米').amount, { value: 400, unit: 'g' });
  assert.deepEqual(ingredient(kuri, '栗').amount, { value: 300, unit: 'g' });
  assert.equal(kuri.liquid_contract, null);

  for (const recipe of [mitama, irimeshi, koshimeshi, kuri]) {
    assert.equal(recipe.status, 'recipe_fact_checked');
    assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
    assert.equal('executable' in recipe, false);
  }
});

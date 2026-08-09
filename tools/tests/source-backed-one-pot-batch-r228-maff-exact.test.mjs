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

test('r228 keeps the 923-entry catalog and advances the catalog version', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r229');
  assert.equal(catalog.recipes.length, 923);
});

test('r228 closes two exact MAFF fixed batches without inferring time or appliance adaptation', () => {
  const salmon = byId('maff-salmon-green-onion-takikomi');
  assert.equal(salmon.fixed_batch.servings, 2);
  assert.deepEqual(ingredient(salmon, '米').amount, { value: 1, unit: '合' });
  assert.deepEqual(ingredient(salmon, '鲑鱼').amount, { value: 1, unit: '切' });
  assert.deepEqual(ingredient(salmon, '葱').amount, { value: 0.5, unit: '本' });
  assert.deepEqual(salmon.liquid_contract, {
    kind: 'added_water',
    amount: { value: 180, unit: 'mL' },
    source_ids: ['S-MAFF-SALMON-GREEN-ONION-R62'],
  });
  assert.equal(salmon.time_contract, null);
  assert.equal(salmon.cooker_adaptation.status, 'not_adapted');

  const tofu = byId('maff-tofumeshi');
  assert.equal(tofu.fixed_batch.servings, 4);
  assert.deepEqual(ingredient(tofu, '米').amount, { value: 2, unit: '合' });
  assert.deepEqual(ingredient(tofu, '木棉豆腐').amount, { value: 200, unit: 'g' });
  assert.deepEqual(ingredient(tofu, '鲭鱼罐头').amount, { value: 80, unit: 'g' });
  assert.equal(tofu.liquid_contract, null);
  assert.equal(tofu.time_contract, null);
  assert.match(tofu.cooker_adaptation.notes, /熟饭蒸合/);

  for (const recipe of [salmon, tofu]) {
    assert.equal(recipe.status, 'recipe_fact_checked');
    assert.equal('executable' in recipe, false);
  }
});

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

test('r221 keeps the 923-entry catalog and closes two same-source MAFF batches', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r243');
  assert.equal(catalog.recipes.length, 923);
});
test('r221 closes the direct satoimo rice batch and dashi amount', () => {
  const recipe = byId('maff-satoimo-rice');
  assert.equal(recipe.fixed_batch.servings, 2);
  assert.deepEqual(ingredient(recipe, '米').amount, { value: 180, unit: 'g' });
  assert.deepEqual(ingredient(recipe, '芋头').amount, { value: 100, unit: 'g' });
  assert.deepEqual(ingredient(recipe, '油炸豆腐').amount, { value: 20, unit: 'g' });
  assert.deepEqual(ingredient(recipe, '淡口酱油').amount, { value: 1, unit: '小匙' });
  assert.deepEqual(ingredient(recipe, '酒').amount, { value: 1, unit: '小匙1强' });
  assert.deepEqual(ingredient(recipe, '盐').amount, { value: 0.2, unit: '小匙' });
  assert.deepEqual(recipe.liquid_contract, {
    kind: 'added_dashi',
    amount: { value: 1.2, unit: 'cup' },
    source_ids: ['S-MAFF-SATOIMO-RICE-R62'],
  });
});

test('r221 closes the six-person Nara irogohan example without resolving its liquid conflict', () => {
  const recipe = byId('maff-irogohan-nara');
  assert.equal(recipe.fixed_batch.servings, 6);
  for (const [name, amount] of [
    ['米', { value: 3, unit: '杯' }],
    ['胡萝卜', { value: 60, unit: 'g' }],
    ['香菇', { value: 60, unit: 'g' }],
    ['牛蒡', { value: 60, unit: 'g' }],
    ['油炸豆腐', { value: 60, unit: 'g' }],
    ['蒟蒻', { value: 100, unit: 'g' }],
    ['鸡肉', { value: 200, unit: 'g' }],
    ['酱油', { value: 60, unit: 'mL' }],
    ['酒', { value: 40, unit: 'mL' }],
    ['出汁昆布', { value: 15, unit: 'g' }],
    ['花柴鱼片', { value: 25, unit: 'g' }],
  ]) {
    assert.deepEqual(ingredient(recipe, name).amount, amount);
  }
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
  assert.equal('executable' in recipe, false);
});

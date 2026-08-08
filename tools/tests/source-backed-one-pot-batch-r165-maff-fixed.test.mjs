import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

const expected = {
  'maff-mie-chagayu': {
    sourceId: 'S-MAFF-MIE-CHAGAYU-1',
    servings: 4,
    ingredients: [
      ['米', 140, 'g'],
      ['水', 8, '杯'],
      ['焙茶', 1, '大匙'],
    ],
    liquid: { kind: 'added_water', value: 8, unit: '杯' },
  },
  'maff-aichi-kiinai-okowa': {
    sourceId: 'S-MAFF-AICHI-KIINAI-OKOWA-1',
    servings: 4,
    ingredients: [
      ['もち米', 3, '合'],
      ['黑豆', 70, 'g'],
      ['くちなしの実', 1, '个'],
      ['盐', 1, '小匙'],
    ],
  },
};

test('r165 closes two exact MAFF fixed batches without changing recipe scope', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r179');
  assert.equal(catalog.recipes.length, 923);
  for (const [recipeId, expectedBatch] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.equal(recipe.fixed_batch?.servings, expectedBatch.servings, recipeId);
    assert.deepEqual(recipe.fixed_batch?.source_ids, [expectedBatch.sourceId], recipeId);
    for (const [name, value, unit] of expectedBatch.ingredients) {
      const item = recipe.fixed_batch.ingredients.find(ingredient => ingredient.name === name);
      assert.ok(item, `${recipeId} missing ingredient ${name}`);
      assert.deepEqual(item.amount, { value, unit }, `${recipeId} ${name}`);
      assert.deepEqual(item.source_ids, [expectedBatch.sourceId], `${recipeId} ${name} source`);
    }
    const source = recipe.source_refs.find(row => row.source_id === expectedBatch.sourceId);
    assert.ok(source, `${recipeId} missing source`);
    assert.ok(source.claim_scopes.includes('quantity'), `${recipeId} source lacks quantity scope`);
  }
  assert.deepEqual(byId['maff-mie-chagayu'].liquid_contract, {
    kind: 'added_water',
    amount: { value: 8, unit: '杯' },
    source_ids: ['S-MAFF-MIE-CHAGAYU-1'],
  });
});

test('r165 preserves ranges and variable-fill boundaries', () => {
  assert.equal(byId['maff-mie-chagayu']?.time_contract, null);
  assert.equal(byId['maff-aichi-kiinai-okowa']?.liquid_contract, null);
  assert.equal(byId['maff-hokkaido-ikameshi']?.fixed_batch, null);
  assert.equal(byId['maff-shizuoka-someimeshi']?.fixed_batch, null);
});

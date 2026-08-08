import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

const expected = {
  'maff-tokushima-omiisan': {
    sourceId: 'S-MAFF-TOKUSHIMA-OMIISAN-1',
    servings: 4,
    ingredients: [
      ['米', 100, 'g'],
      ['だし汁', 4, '杯'],
      ['煮干', 15, 'g'],
      ['里芋', 250, 'g'],
      ['大根', 200, 'g'],
      ['大根の葉', 0.5, '束'],
      ['みそ', 40, 'g'],
    ],
    liquid: { kind: 'added_dashi', value: 4, unit: '杯' },
  },
  'instant-pot-spinach-chickpea-rice': {
    sourceId: 'S-INSTANTPOT-SPINACH-CHICKPEA-RICE-1',
    servings: 4,
    ingredients: [
      ['印度香米', 1, 'cup'],
      ['食用油', 1, 'tsp'],
      ['姜', 1, 'tsp'],
      ['大蒜', 2, 'clove'],
      ['青椒', 1, 'piece'],
      ['菠菜', 1.5, 'cup'],
      ['番茄', 0.5, 'cup'],
      ['鹰嘴豆', 1, 'can'],
      ['水', 1, 'cup'],
    ],
  },
  'instant-pot-coconut-chicken-pineapple-rice': {
    sourceId: 'S-INSTANTPOT-COCONUT-CHICKEN-PINEAPPLE-RICE-1',
    servings: 4,
    ingredients: [
      ['鸡腿肉', 1.5, 'lb'],
      ['玉米淀粉', 2, 'tbsp'],
      ['盐', 1, 'tbsp'],
      ['芝麻油', 2, 'tbsp'],
      ['植物油', 1, 'tbsp'],
      ['茉莉香米', 1.5, 'cup'],
      ['姜', 1, 'tbsp'],
      ['大蒜', 3, 'clove'],
      ['椰奶', 14, 'oz'],
      ['水', 1.25, 'cup'],
      ['酱油', 0.25, 'cup'],
      ['红糖', 2, 'tbsp'],
      ['甜椒', 1, 'piece'],
      ['胡萝卜', 1, 'cup'],
      ['菠萝', 1.5, 'cup'],
    ],
  },
};

test('r164 closes three exact serving contracts without changing recipe scope', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r202');
  assert.equal(catalog.recipes.length, 923);
  for (const [recipeId, expectedBatch] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.equal(recipe.fixed_batch?.servings, expectedBatch.servings, recipeId);
    assert.deepEqual(recipe.fixed_batch?.source_ids, [expectedBatch.sourceId], recipeId);
    for (const [name, value, unit] of expectedBatch.ingredients) {
      const ingredient = recipe.fixed_batch.ingredients.find(item => item.name === name);
      assert.ok(ingredient, `${recipeId} missing ingredient ${name}`);
      assert.deepEqual(ingredient.amount, { value, unit }, `${recipeId} ${name}`);
      assert.deepEqual(ingredient.source_ids, [expectedBatch.sourceId], `${recipeId} ${name} source`);
    }
    const source = recipe.source_refs.find(row => row.source_id === expectedBatch.sourceId);
    assert.ok(source, `${recipeId} missing source`);
    assert.ok(source.claim_scopes.includes('quantity'), `${recipeId} source lacks quantity scope`);
  }
  assert.deepEqual(byId['maff-tokushima-omiisan'].liquid_contract, {
    kind: 'added_dashi',
    amount: { value: 4, unit: '杯' },
    source_ids: ['S-MAFF-TOKUSHIMA-OMIISAN-1'],
  });
});

test('r164 keeps mixed-liquid batches unresolved while later same-source closures remain visible', () => {
  assert.equal(byId['cuckoo-abalone-pot-rice']?.fixed_batch?.servings, 4);
  assert.equal(byId['instant-pot-coconut-chicken-pineapple-rice']?.liquid_contract, null);
});

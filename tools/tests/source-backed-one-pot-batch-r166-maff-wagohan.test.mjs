import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

test('r166 closes the same-source MAFF taro-and-pickled-mustard fixed batch', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r178');
  assert.equal(catalog.recipes.length, 923);
  const recipe = byId['maff-satoimo-takana-takikomi-gohan'];
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.fixed_batch?.servings, 2);
  assert.deepEqual(recipe.fixed_batch?.source_ids, ['S-MAFF-SATOIMO-TAKANA-R62']);
  for (const [name, value, unit] of [
    ['米', 2, '合'],
    ['芋头', 150, 'g'],
    ['高菜腌菜', 50, 'g'],
    ['芝麻油', 1, '大匙'],
    ['盐', 1, '小匙'],
  ]) {
    const ingredient = recipe.fixed_batch.ingredients.find(item => item.name === name);
    assert.ok(ingredient, `missing ${name}`);
    assert.deepEqual(ingredient.amount, { value, unit });
    assert.deepEqual(ingredient.source_ids, ['S-MAFF-SATOIMO-TAKANA-R62']);
  }
  assert.deepEqual(recipe.time_contract, {
    total_minutes: 45,
    source_ids: ['S-MAFF-SATOIMO-TAKANA-R62'],
  });
  assert.equal(recipe.liquid_contract, null);
});

test('r166 leaves variable-water and staged MAFF boundaries unresolved', () => {
  assert.equal(byId['maff-satoimo-takana-takikomi-gohan']?.liquid_contract, null);
  assert.equal(byId['maff-air-buri-daikon-daikon-meshi']?.fixed_batch, null);
  assert.equal(byId['maff-kagoshima-keihan']?.fixed_batch, null);
});

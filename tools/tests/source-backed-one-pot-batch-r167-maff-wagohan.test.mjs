import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

test('r167 closes the same-source MAFF beef mushroom yolk fixed batch', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r244');
  assert.equal(catalog.recipes.length, 923);
  const recipe = byId['maff-beef-mushroom-yolk-rice'];
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.fixed_batch?.servings, 2);
  assert.deepEqual(recipe.fixed_batch?.source_ids, ['S-MAFF-BEEF-MUSHROOM-YOLK-R62']);
  for (const [name, value, unit] of [
    ['米', 2, '合'],
    ['蟹味菇', 50, 'g'],
    ['胡萝卜', 30, 'g'],
    ['薄切牛肉', 150, 'g'],
    ['日式颗粒高汤', 1, '小匙'],
    ['酱油', 2, '大匙'],
    ['蛋黄', 2, '个'],
  ]) {
    const ingredient = recipe.fixed_batch.ingredients.find(item => item.name === name);
    assert.ok(ingredient, `missing ${name}`);
    assert.deepEqual(ingredient.amount, { value, unit });
    assert.deepEqual(ingredient.source_ids, ['S-MAFF-BEEF-MUSHROOM-YOLK-R62']);
  }
  assert.deepEqual(recipe.time_contract, {
    total_minutes: 45,
    source_ids: ['S-MAFF-BEEF-MUSHROOM-YOLK-R62'],
  });
  assert.equal(recipe.liquid_contract, null);
});

test('r167 preserves the source-specific water and safety boundaries', () => {
  const recipe = byId['maff-beef-mushroom-yolk-rice'];
  assert.equal(recipe?.liquid_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, [{
    code: 'beef_fully_cooked',
    minimum_core_temperature_c: 71,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.equal(byId['maff-air-buri-daikon-daikon-meshi']?.fixed_batch, null);
});

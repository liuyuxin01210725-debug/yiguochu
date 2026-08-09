import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find((item) => item.recipe_id === 'startsmart-three-bean-egg-tofu-red-rice');

function ingredient(name) {
  const found = recipe?.fixed_batch?.ingredients?.find((item) => item.name === name);
  assert.ok(found, `missing ${name}`);
  return found;
}

test('r238 closes the exact 60-person StartSmart institutional batch', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r240');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.fixed_batch?.servings, 60);
  assert.deepEqual(ingredient('鸡蛋').amount, { value: 17, unit: '只' });
  assert.deepEqual(ingredient('杂菜粒').amount, { value: 1, unit: '磅' });
  assert.deepEqual(ingredient('芥兰').amount, { value: 3, unit: '斤' });
  assert.deepEqual(ingredient('豆腐').amount, { value: 5, unit: '砖' });
  assert.deepEqual(ingredient('白米').amount, { value: 12, unit: '杯' });
  assert.deepEqual(ingredient('红米').amount, { value: 2, unit: '杯' });
  assert.deepEqual(ingredient('粟米油').amount, { value: 3, unit: '汤匙' });
  assert.deepEqual(ingredient('盐').amount, { value: 3, unit: '茶匙' });
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
});

test('r238 preserves the source staged cooked-rice and oven boundary', () => {
  assert.ok(recipe);
  assert.match(recipe.cooker_adaptation.notes, /60人份|先煮后焗/u);
  assert.match(recipe.cooking_sequence.map((step) => step.instruction).join(' '), /熟|焗/u);
  assert.equal('executable' in recipe, false);
});

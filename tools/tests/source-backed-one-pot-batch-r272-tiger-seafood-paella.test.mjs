import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const catalog = JSON.parse(
  readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'),
);

test('r272 closes Tiger seafood paella exact batch, waterline, time, and safety', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);

  const recipe = catalog.recipes.find((item) => item.recipe_id === 'tiger-seafood-paella-post118');
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.deepEqual(recipe.fixed_batch.ingredients, [
    { name: '米', amount: { value: 3, unit: '杯' }, source_ids: ['S-TIGER-POST118-1'] },
    { name: '有头虾', amount: { value: 4, unit: '尾' }, source_ids: ['S-TIGER-POST118-1'] },
    { name: '鱿鱼', amount: { value: 0.5, unit: '杯' }, source_ids: ['S-TIGER-POST118-1'] },
    { name: '贻贝', amount: { value: 8, unit: '个' }, source_ids: ['S-TIGER-POST118-1'] },
    { name: '蛤蜊', amount: { value: 12, unit: '粒' }, source_ids: ['S-TIGER-POST118-1'] },
    { name: '白葡萄酒', amount: { value: 100, unit: 'mL' }, source_ids: ['S-TIGER-POST118-1'] },
    { name: '橄榄油', amount: { value: 2, unit: '小匙' }, source_ids: ['S-TIGER-POST118-1'] },
    { name: '鸡腿肉', amount: { value: 80, unit: 'g' }, source_ids: ['S-TIGER-POST118-1'] },
    { name: '洋葱', amount: { value: 0.5, unit: '个' }, source_ids: ['S-TIGER-POST118-1'] },
    { name: '大蒜', amount: { value: 1, unit: '片分' }, source_ids: ['S-TIGER-POST118-1'] },
    { name: '青椒', amount: { value: 1, unit: '个' }, source_ids: ['S-TIGER-POST118-1'] },
    { name: '红椒', amount: { value: 1, unit: '个' }, source_ids: ['S-TIGER-POST118-1'] },
    { name: '黑橄榄', amount: { value: 4, unit: '粒' }, source_ids: ['S-TIGER-POST118-1'] },
    { name: '小番茄', amount: { value: 4, unit: '个' }, source_ids: ['S-TIGER-POST118-1'] },
    { name: '藏红花', amount: { value: 0.3, unit: 'g' }, source_ids: ['S-TIGER-POST118-1'] },
    { name: '鸡汤粉', amount: { value: 1, unit: '大匙' }, source_ids: ['S-TIGER-POST118-1'] },
    { name: '盐', amount: { value: 0.6666666667, unit: '小匙' }, source_ids: ['S-TIGER-POST118-1'] },
    { name: '柠檬', amount: { value: 4, unit: '切' }, source_ids: ['S-TIGER-POST118-1'] },
  ]);
  assert.deepEqual(recipe.liquid_contract, {
    kind: 'waterline',
    waterline: {
      appliance_model: 'Tiger 060/100尺寸机型',
      scale: 'white_rice',
      mark: '3 (060) / 6 (100)',
    },
    source_ids: ['S-TIGER-POST118-1'],
  });
  assert.deepEqual(recipe.time_contract, {
    total_minutes: 55,
    source_ids: ['S-TIGER-POST118-1'],
  });
  assert.deepEqual(recipe.safety_endpoints, [
    {
      code: 'seafood_fully_cooked',
      minimum_core_temperature_c: 63,
      source_ids: ['S-SAFETY-SEAFOOD-GENERAL-CDC-1'],
    },
    {
      code: 'shellfish_fully_cooked',
      visual_endpoint: '肉质呈珍珠白或白色且不透明',
      source_ids: ['S-SAFETY-TEMPERATURES-1'],
    },
    {
      code: 'poultry_fully_cooked',
      minimum_core_temperature_c: 74,
      source_ids: ['S-SAFETY-TEMPERATURES-1'],
    },
  ]);
});

test('r272 preserves Tiger staged seafood and model boundaries', () => {
  const recipe = catalog.recipes.find((item) => item.recipe_id === 'tiger-seafood-paella-post118');
  assert.ok(recipe);
  assert.equal(recipe.cooker_adaptation.status, 'source_limited');
  assert.match(recipe.cooker_adaptation.notes, /另锅|水位|55/);
  assert.notEqual(recipe.status, 'executable');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalog = JSON.parse(
  fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'),
);

test('r271 closes the exact fixed batch for Tiger clam and tomato rice', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);

  const recipe = catalog.recipes.find((item) => item.recipe_id === 'tiger-clam-tomato-rice');
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.deepEqual(recipe.fixed_batch.ingredients, [
    { name: '米', amount: { value: 3, unit: '杯（Tiger量杯）' }, source_ids: ['S-TIGER-CLAM-TOMATO-RICE-R65'] },
    { name: '蛤蜊', amount: { value: 250, unit: 'g' }, source_ids: ['S-TIGER-CLAM-TOMATO-RICE-R65'] },
    { name: '白酒', amount: { value: 100, unit: 'mL' }, source_ids: ['S-TIGER-CLAM-TOMATO-RICE-R65'] },
    { name: '番茄', amount: { value: 1, unit: '个' }, source_ids: ['S-TIGER-CLAM-TOMATO-RICE-R65'] },
    { name: '罗勒', amount: { value: 4, unit: '片' }, source_ids: ['S-TIGER-CLAM-TOMATO-RICE-R65'] },
    { name: '鸡汤块', amount: { value: 1, unit: '块' }, source_ids: ['S-TIGER-CLAM-TOMATO-RICE-R65'] },
  ]);
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.deepEqual(recipe.safety_endpoints, [{
    code: 'shellfish_fully_cooked',
    visual_endpoint: '肉质呈珍珠白或白色且不透明',
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
});

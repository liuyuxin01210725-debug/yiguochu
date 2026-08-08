import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

test('r93 records Toshiba Hong Kong chicken and dried-scallop porridge with contradictory liquid facts preserved', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r200');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(catalog.recipes.filter(item => item.status === 'recipe_fact_checked').length, 794);

  const recipe = catalog.recipes.find(item => item.recipe_id === 'toshiba-hk-chicken-scallop-porridge-pc48drshk');
  assert.equal(recipe?.canonical_name, 'Chicken Porridge with dried scallops');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.region_codes, ['HK']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract?.total_minutes, 20);
  assert.deepEqual(recipe?.nutrition_structure?.roles, ['carbohydrate', 'protein']);
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.match(recipe?.evidence_notes ?? '', /6杯|4杯|矛盾|无单位|缺少禽肉安全/u);

  const barley = catalog.recipes.find(item => item.recipe_id === 'japan-hyogo-barley-chicken-vegetable-rice');
  assert.equal(barley?.canonical_name, '栄養満点！もち麦炊き込みご飯');
  assert.equal(barley?.status, 'recipe_fact_checked');
  assert.equal(barley?.fixed_batch?.servings, 2);
  assert.equal(barley?.liquid_contract, null);
  assert.deepEqual(barley?.nutrition_structure?.roles, ['carbohydrate', 'protein', 'fiber']);

  const blackSoy = catalog.recipes.find(item => item.recipe_id === 'japan-hokkaido-black-chiset-soy-rice');
  assert.equal(blackSoy?.canonical_name, '黒千石炊き込みご飯');
  assert.equal(blackSoy?.status, 'recipe_fact_checked');
  assert.equal(blackSoy?.fixed_batch, null);
  assert.equal(blackSoy?.liquid_contract, null);
  assert.deepEqual(blackSoy?.nutrition_structure?.roles, ['carbohydrate', 'protein', 'fiber']);
});

test('r93 keeps Toshiba porridge model-scoped and research-only', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const recipe = catalog.recipes.find(item => item.recipe_id === 'toshiba-hk-chicken-scallop-porridge-pc48drshk');
  assert.equal(recipe?.traditional_vessels?.[0], 'Toshiba PC-48DRSHK(K) 电压力锅');
  assert.notEqual(recipe?.status, 'executable');
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.match(recipe?.evidence_notes ?? '', /Quick Porridge|不外推/u);
  assert.equal(catalog.recipes.find(item => item.recipe_id === 'japan-hyogo-barley-chicken-vegetable-rice')?.traditional_vessels?.[0], '燃气灶/锅');
  assert.equal(catalog.recipes.find(item => item.recipe_id === 'japan-hokkaido-black-chiset-soy-rice')?.traditional_vessels?.[0], '电饭煲');
});

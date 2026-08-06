import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

test('r88 records two Panasonic Taiwan same-pot rice recipes and two Hong Kong official porridge recipes', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260806-national-r89');
  assert.equal(catalog.recipes.length, 756);
  assert.equal(catalog.recipes.filter(item => item.status === 'recipe_fact_checked').length, 659);

  const mushroom = catalog.recipes.find(item => item.recipe_id === 'panasonic-taiwan-mushroom-vegetable-oil-shallot-rice');
  assert.equal(mushroom?.canonical_name, '菌菇玉菜油蔥飯');
  assert.equal(mushroom?.status, 'recipe_fact_checked');
  assert.deepEqual(mushroom?.region_codes, []);
  assert.equal(mushroom?.liquid_contract?.amount?.value, 350);
  assert.equal(mushroom?.liquid_contract?.amount?.unit, 'g鸡高汤');
  assert.equal(mushroom?.fixed_batch, null);
  assert.deepEqual(mushroom?.safety_endpoints, []);
  assert.match(mushroom?.evidence_notes ?? '', /仿雞腿|不证明传统|未给/u);

  const salmon = catalog.recipes.find(item => item.recipe_id === 'panasonic-taiwan-salmon-daikon-golden-rice');
  assert.equal(salmon?.canonical_name, '鮭魚白蘿蔔金黃炊飯');
  assert.equal(salmon?.status, 'recipe_fact_checked');
  assert.deepEqual(salmon?.region_codes, []);
  assert.equal(salmon?.liquid_contract?.kind, 'added_water');
  assert.equal(salmon?.liquid_contract?.amount?.value, 3);
  assert.deepEqual(salmon?.safety_endpoints, []);
  assert.match(salmon?.evidence_notes ?? '', /3杯|蛋液|安全终点/u);

  const porridge = catalog.recipes.find(item => item.recipe_id === 'hk-mushroom-grass-carp-congee');
  assert.equal(porridge?.canonical_name, '香菇魚腩粥');
  assert.equal(porridge?.status, 'recipe_fact_checked');
  assert.equal(porridge?.fixed_batch?.servings, 18);
  assert.equal(porridge?.liquid_contract?.amount?.value, 6500);
  assert.equal(porridge?.liquid_contract?.amount?.unit, 'mL');
  assert.deepEqual(porridge?.safety_endpoints, []);
  assert.match(porridge?.evidence_notes ?? '', /批量|鱼类熟制|电饭煲/u);

  const seafoodPorridge = catalog.recipes.find(item => item.recipe_id === 'hk-golden-seafood-congee');
  assert.equal(seafoodPorridge?.canonical_name, '黃金海鮮粥');
  assert.equal(seafoodPorridge?.status, 'recipe_fact_checked');
  assert.equal(seafoodPorridge?.fixed_batch?.servings, 5);
  assert.equal(seafoodPorridge?.liquid_contract?.amount?.value, 4);
  assert.equal(seafoodPorridge?.liquid_contract?.amount?.unit, '碗');
  assert.deepEqual(seafoodPorridge?.safety_endpoints, []);
  assert.match(seafoodPorridge?.evidence_notes ?? '', /海鲜|煮至熟透|电饭煲/u);
});

test('r88 keeps manufacturer recipes model-scoped and does not promote incomplete contracts', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  for (const id of [
    'panasonic-taiwan-mushroom-vegetable-oil-shallot-rice',
    'panasonic-taiwan-salmon-daikon-golden-rice',
  ]) {
    const recipe = catalog.recipes.find(item => item.recipe_id === id);
    assert.deepEqual(recipe?.region_codes, []);
    assert.notEqual(recipe?.status, 'executable');
    assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  }
});

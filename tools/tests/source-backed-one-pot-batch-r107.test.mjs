import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  ['cn-hunan-xiangxi-miao-cooked-rice', '湘西苗家饭', 'recipe_fact_checked', 'https://whhlyt.hunan.gov.cn/whhlyt/english/Culture/Delicacies/202304/t20230406_29306991.html'],
  ['cn-henan-linzhou-millet-thick-rice', '林州小米稠饭', 'recipe_fact_checked', 'https://zhuanti.mct.gov.cn/rxhmxjgn2022/beijing/detail_g7yU_504/3407.html'],
  ['cn-fujian-yongchun-xianjia-dried-mustard-rice', '永春仙夹菜干饭', 'recipe_fact_checked', 'https://www.fjyc.gov.cn/zjyc/mfms/201312/t20131210_1597109.htm'],
  ['cn-quanzhou-nanan-penghua-mustard-rice', '南安蓬华芥菜饭', 'identity_verified', 'https://www.quanzhou.gov.cn/gastronomy/ch/msdh/xwqz/202509/t20250909_3208177.htm'],
  ['cn-yunnan-ruili-dai-steamed-rice-technique', '傣族蒸米饭制作技艺（瑞丽）', 'identity_verified', 'https://www.rl.gov.cn/slyj/Web/_F0_0_6I73ZWNB4E833B0A675745BEBE.htm'],
  ['cn-yunnan-ruili-jingpo-steamed-rice-technique', '景颇族蒸米饭制作技艺（瑞丽）', 'identity_verified', 'https://www.rl.gov.cn/slyj/Web/_F0_0_6I73ZWNB4E833B0A675745BEBE.htm'],
  ['cn-jiangsu-jintan-maoshan-qingjing-rice-technique', '茅山青精饭制作技艺', 'identity_verified', 'https://www.changzhou.gov.cn/gi_news/61167487373135'],
];

test('r107 adds seven deduplicated mainland records without executable promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r157');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);
  for (const [recipeId, name, status, url] of expected) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.canonical_name, name, recipeId);
    assert.equal(recipe.status, status, recipeId);
    assert.equal(recipe.identity_status, 'verified', recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients), recipeId);
    assert.ok(recipe.source_refs.some((source) => source.url === url), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
  for (const recipeId of ['cn-hunan-xiangxi-miao-cooked-rice', 'cn-henan-linzhou-millet-thick-rice', 'cn-fujian-yongchun-xianjia-dried-mustard-rice']) {
    assert.ok(byId.get(recipeId).core_ingredients.length >= 2, recipeId);
  }
});

test('r107 keeps incomplete evidence explicit and does not invent cooker contracts', () => {
  const miao = byId.get('cn-hunan-xiangxi-miao-cooked-rice');
  assert.match(miao.evidence_notes, /无克重|电饭煲|分阶段/u);
  assert.equal(miao.fixed_batch, null);
  assert.equal(miao.liquid_contract, null);
  assert.equal(miao.cooker_adaptation.status, 'not_adapted');

  const linzhou = byId.get('cn-henan-linzhou-millet-thick-rice');
  assert.equal(linzhou.fixed_batch, null);
  assert.equal(linzhou.liquid_contract, null);
  assert.equal(linzhou.cooker_adaptation.status, 'not_adapted');

  for (const recipeId of [
    'cn-quanzhou-nanan-penghua-mustard-rice',
    'cn-yunnan-ruili-dai-steamed-rice-technique',
    'cn-yunnan-ruili-jingpo-steamed-rice-technique',
    'cn-jiangsu-jintan-maoshan-qingjing-rice-technique',
  ]) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe.fixed_batch, null, recipeId);
    assert.equal(recipe.liquid_contract, null, recipeId);
    assert.equal(recipe.cooking_sequence.length, 0, recipeId);
    assert.equal(recipe.cooker_adaptation.status, 'not_adapted', recipeId);
  }
});

test('r107 records distinct regional names exactly once', () => {
  for (const [, name] of expected) {
    assert.equal(catalog.recipes.filter((recipe) => recipe.canonical_name === name).length, 1, name);
  }
});

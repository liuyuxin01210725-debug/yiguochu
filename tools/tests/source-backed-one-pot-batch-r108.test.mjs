import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  ['cn-xj-qiele-pilaf', '策勒抓饭', 'identity_verified', 'https://www.xjcl.gov.cn/clxrmzf/c118969/201609/6abb0617b5e3449caa8d2b5141fc3834.shtml'],
  ['cn-jiangxi-ganzhou-anyuan-menfan', '安远焖饭', 'identity_verified', 'https://www.ay.gov.cn/ayzf/c103773/tt.shtml'],
  ['cn-shanxi-wuxiang-millet-braised-rice', '武乡小米焖饭', 'identity_verified', 'https://credit.changzhi.gov.cn/82/17645.html'],
  ['cn-hainan-sanya-miao-three-color-rice', '苗族三色饭制作技艺', 'identity_verified', 'https://lwj.sanya.gov.cn/wljsite/zcjd/202507/a3513a34ca2543a0b86ff0dd12e9a4af.shtml'],
  ['cn-shanxi-qinshui-handmade-soft-rice', '沁水传统手工软米饭', 'identity_verified', 'https://xxgk.qinshui.gov.cn/xzf/qsgxj/fdzdgknr/gzdt/202501/t20250106_2083576.shtml'],
];

test('r108 adds five deduplicated mainland records without executable promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r156');
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
});

test('r108 keeps missing contracts explicit and preserves source boundaries', () => {
  for (const [recipeId] of expected) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe.fixed_batch, null, recipeId);
    assert.equal(recipe.liquid_contract, null, recipeId);
    assert.equal(recipe.time_contract, null, recipeId);
    assert.equal(recipe.cooker_adaptation.status, 'not_adapted', recipeId);
  }
  for (const recipe of catalog.recipes.filter((item) => expected.some(([id]) => id === item.recipe_id))) {
    assert.ok(recipe.evidence_notes && recipe.evidence_notes.length > 20, recipe.recipe_id);
    assert.ok(recipe.source_refs.every((source) => source.claim_scopes?.includes('identity')), recipe.recipe_id);
  }
});

test('r108 does not duplicate existing regional canonical names', () => {
  for (const [, name] of expected) {
    assert.equal(catalog.recipes.filter((recipe) => recipe.canonical_name === name).length, 1, name);
  }
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

const expected = [
  ['utsunomiya-shimotsukare-style-rice', 'しもつかれ風炊き込み飯', 'recipe_fact_checked'],
  ['hasami-boubura-zuushi', 'ぼうぶらずうし', 'recipe_fact_checked'],
  ['saito-wakeshiko-torimeshi', 'わけしこ飯（とりめし）', 'recipe_fact_checked'],
  ['zojirushi-nonokomeshi-el-mb30', 'ののこ飯', 'recipe_fact_checked'],
  ['zojirushi-kasuyose-el-mb30', 'かすよせ', 'recipe_fact_checked'],
  ['panasonic-nara-chagayu-nf-ac1000', '奈良ご当地 茶がゆ', 'recipe_fact_checked'],
  ['jinyuan-liumi-rice', '晋源馏米饭', 'recipe_fact_checked'],
  ['mindong-she-black-rice', '闽东畲族乌饭', 'identity_verified'],
];

test('r71 adds directly sourced named candidates without promotion', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r211');
  assert.equal(catalog.recipes.length, 923);
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.equal(recipe?.identity_status, 'verified', recipeId);
    assert.ok(recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.evidence_locator === 'string' && source.evidence_locator.length > 0), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.attribution === 'string' && source.attribution.length > 0), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.license === 'string' && source.license.length > 0), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients) && recipe.core_ingredients.length >= (status === 'identity_verified' ? 1 : 2), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r71 preserves regional, appliance, nutrition, and process boundaries', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.match(byId.get('utsunomiya-shimotsukare-style-rice')?.evidence_notes ?? '', /酒粕|鲑鱼|大豆|电饭煲/);
  assert.match(byId.get('hasami-boubura-zuushi')?.evidence_notes ?? '', /鲸肉|电饭煲|炉灶|替换/);
  assert.match(byId.get('saito-wakeshiko-torimeshi')?.evidence_notes ?? '', /宫崎|鸡腿|牛蒡|电饭煲/);
  assert.match(byId.get('zojirushi-nonokomeshi-el-mb30')?.evidence_notes ?? '', /鸟取|豆腐皮|压力|电饭煲/);
  assert.match(byId.get('zojirushi-kasuyose-el-mb30')?.evidence_notes ?? '', /熊本|副菜|预炒/);
  assert.match(byId.get('panasonic-nara-chagayu-nf-ac1000')?.evidence_notes ?? '', /茶粥|纯碳水|NF-AC/);
  assert.match(byId.get('jinyuan-liumi-rice')?.evidence_notes ?? '', /甜|糯米|红枣|电饭煲/);
  assert.match(byId.get('mindong-she-black-rice')?.evidence_notes ?? '', /畲族|非遗|身份|跨地域/);
});

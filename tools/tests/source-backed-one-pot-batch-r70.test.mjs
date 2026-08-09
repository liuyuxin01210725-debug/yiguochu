import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

const expected = [
  ['baguazhou-luhao-braised-rice', '八卦洲芦蒿焖饭', 'identity_verified'],
  ['yangzhong-pufferfish-eight-pot-rice', '河豚八煲饭', 'identity_verified'],
  ['hongdong-steamed-rice', '洪洞蒸饭', 'identity_verified'],
  ['tiger-hotaruika-rice', 'ほたるいかのごはん', 'recipe_fact_checked'],
  ['tefal-homechef-paella', 'Paella', 'recipe_fact_checked'],
  ['tefal-homechef-mushroom-risotto', 'Mushroom risotto', 'recipe_fact_checked'],
  ['taiwan-red-rice-banana-rice', '红米香蕉饭', 'identity_verified'],
  ['taiwan-taro-rice-aroma', '芋飯飄香', 'identity_verified'],
  ['yunlin-soft-egg-roast-pork-rice', '溏心蛋燒肉飯', 'identity_verified'],
];

test('r70 records directly sourced named candidates without promotion', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r223');
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
    assert.ok(Array.isArray(recipe.core_ingredients) && recipe.core_ingredients.length >= 2, recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r70 keeps high-risk, non-rice, and multi-stage boundaries explicit', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.match(byId.get('yangzhong-pufferfish-eight-pot-rice')?.evidence_notes ?? '', /河豚|高风险|家庭执行/);
  assert.match(byId.get('hongdong-steamed-rice')?.evidence_notes ?? '', /甜|蛋白|主餐/);
  assert.match(byId.get('tiger-hotaruika-rice')?.evidence_notes ?? '', /萤火鱿|Tiger|海鲜/);
  assert.match(byId.get('tefal-homechef-paella')?.evidence_notes ?? '', /Home Chef|多功能锅|多阶段/);
  assert.match(byId.get('tefal-homechef-mushroom-risotto')?.evidence_notes ?? '', /蘑菇|多功能锅|奶酪/);
  assert.match(byId.get('baguazhou-luhao-braised-rice')?.evidence_notes ?? '', /身份|流程|器具/);
  assert.match(byId.get('taiwan-red-rice-banana-rice')?.evidence_notes ?? '', /红米|香蕉|蛋白/);
  assert.match(byId.get('taiwan-taro-rice-aroma')?.evidence_notes ?? '', /芋|图卡|流程/);
  assert.match(byId.get('yunlin-soft-egg-roast-pork-rice')?.evidence_notes ?? '', /电锅|溏心|视频/);
});

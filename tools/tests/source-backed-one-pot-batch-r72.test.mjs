import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

const expected = [
  ['taitung-tree-bean-millet-rice', '樹豆小米飯', 'recipe_fact_checked'],
  ['taiwan-sesame-chicken-mushroom-vegetable-rice', '菇味麻油雞佐鮮蔬燉飯', 'recipe_fact_checked'],
  ['jingzhou-wumi-rice', '靖州乌米饭', 'recipe_fact_checked'],
  ['tefal-pilaf-with-lamb-r200302', 'Pilaf with lamb', 'recipe_fact_checked'],
  ['tefal-paella-r106320', 'Paella（Tefal锅内温控版）', 'executable'],
  ['tefal-italian-sundried-tomato-chicken-rice-r942720', 'One-pot Italian sundried tomato chicken and rice', 'recipe_fact_checked'],
  ['midea-pea-purple-sweet-potato-rice', '豌豆紫薯饭', 'identity_verified'],
  ['midea-quinoa-yam-red-date-rice', '藜麦山药红枣饭', 'identity_verified'],
  ['zojirushi-china-tomato-seafood-rice', '番茄海鲜饭', 'identity_verified'],
];

test('r72 records directly sourced named candidates without promotion', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r235');
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
    assert.ok(Array.isArray(recipe.core_ingredients) && recipe.core_ingredients.length >= 2, recipeId);
    if (status !== 'executable') assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r72 preserves nutrition, appliance, source mismatch, and regional boundaries', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.match(byId.get('taitung-tree-bean-millet-rice')?.evidence_notes ?? '', /樹豆|少许|电子锅|数量/);
  assert.match(byId.get('taiwan-sesame-chicken-mushroom-vegetable-rice')?.evidence_notes ?? '', /预炒|电锅|鸡腿|安全/);
  assert.match(byId.get('jingzhou-wumi-rice')?.evidence_notes ?? '', /乌米|糯米|碳水|电饭煲/);
  assert.match(byId.get('tefal-pilaf-with-lamb-r200302')?.evidence_notes ?? '', /羊肉|鹰嘴豆|多功能锅|普通电饭煲/);
  assert.match(byId.get('tefal-paella-r106320')?.evidence_notes ?? '', /鸡肉|海鲜|温控|安全/);
  assert.match(byId.get('tefal-italian-sundried-tomato-chicken-rice-r942720')?.evidence_notes ?? '', /烤箱|鸡肉|一锅|电饭煲/);
  assert.match(byId.get('midea-pea-purple-sweet-potato-rice')?.evidence_notes ?? '', /豌豆|紫薯|水量|蛋白/);
  assert.match(byId.get('midea-quinoa-yam-red-date-rice')?.evidence_notes ?? '', /藜麦|山药|红枣|比例/);
  assert.match(byId.get('zojirushi-china-tomato-seafood-rice')?.evidence_notes ?? '', /番茄|海鲜|步骤|错配/);
});

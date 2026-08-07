import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

const expected = [
  ['panasonic-bamboo-brown-rice-nf-pc400', 'たけのこ入り玄米ごはん', 'recipe_fact_checked'],
  ['panasonic-chinese-sticky-rice-nf-pc400', '中華おこわ（Panasonic NF-PC400版）', 'recipe_fact_checked'],
  ['zojirushi-rice-beans-bacon-collard-greens', 'Rice and Beans with Bacon and Collard Greens', 'recipe_fact_checked'],
  ['zojirushi-spicy-basmati-lentil-spinach-rice', 'Spicy Basmati Rice with Lentils and Spinach', 'recipe_fact_checked'],
  ['tefal-risotto-with-peas-r106322', 'Risotto with peas', 'recipe_fact_checked'],
  ['tefal-risotto-with-shrimps-r106225', 'Risotto with shrimps', 'recipe_fact_checked'],
  ['putian-yellow-croaker-rice', '莆田黄瓜鱼饭', 'identity_verified'],
  ['hekou-buyi-five-color-rice', '河口布依族五色花米饭', 'recipe_fact_checked'],
];

test('r73 records direct named candidates without promotion', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r128');
  assert.equal(catalog.recipes.length, 895);
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
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r73 preserves appliance, nutrition, and evidence boundaries', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.match(byId.get('panasonic-bamboo-brown-rice-nf-pc400')?.evidence_notes ?? '', /NF-PC400|糙米|笋|普通电饭煲/);
  assert.match(byId.get('panasonic-chinese-sticky-rice-nf-pc400')?.evidence_notes ?? '', /NF-PC400|糯米|叉烧|Tiger|压力锅/);
  assert.match(byId.get('zojirushi-rice-beans-bacon-collard-greens')?.evidence_notes ?? '', /豆|培根|叶菜|预熟|拌入/);
  assert.match(byId.get('zojirushi-spicy-basmati-lentil-spinach-rice')?.evidence_notes ?? '', /扁豆|菠菜|出锅|电饭煲/);
  assert.match(byId.get('tefal-risotto-with-peas-r106322')?.evidence_notes ?? '', /豌豆|分段|搅拌|多功能锅/);
  assert.match(byId.get('tefal-risotto-with-shrimps-r106225')?.evidence_notes ?? '', /虾|分次|高汤|海鲜/);
  assert.match(byId.get('putian-yellow-croaker-rice')?.evidence_notes ?? '', /黄瓜鱼|莆仙|用量|鱼类安全/);
  assert.match(byId.get('hekou-buyi-five-color-rice')?.evidence_notes ?? '', /河口|布依|植物|碳水|蒸/);
});

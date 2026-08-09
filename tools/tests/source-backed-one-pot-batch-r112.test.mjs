import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  ['maff-miyazaki-hiezushi', '稗ずーしー／稗がゆ', 'https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/hie_zushii_miyazaki.html'],
  ['maff-saga-ochagai-chagayu', 'お茶がい／茶がゆ', 'https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/45_5_saga.html'],
  ['maff-yamanashi-yakome', 'やこめ', 'https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/yakome_yama_nashi.html'],
  ['maff-yamanashi-obaku', 'おばく', 'https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/obaku_yama_nashi.html'],
  ['maff-kagawa-mossou-meshi', 'もっそうめし', 'https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/mossou_meshi_kagawa.html'],
];

test('r112 adds five directly opened MAFF rice/porridge candidates without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r250');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);
  for (const [recipeId, name, url] of expected) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.canonical_name, name, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.equal(recipe.identity_status, 'verified', recipeId);
    assert.ok(recipe.core_ingredients.some((ingredient) => /米|麦|稗|粥|饭|飯/.test(ingredient)), recipeId);
    assert.ok(recipe.cooking_sequence.length >= 2, recipeId);
    const source = recipe.source_refs.find((item) => item.url === url);
    assert.ok(source, recipeId);
    assert.equal(source.access_status, 'opened', recipeId);
    assert.ok(Number.isInteger(source.evidence_tier) && source.evidence_tier <= 5, recipeId);
    assert.ok(source.evidence_locator, recipeId);
    assert.ok(source.claim_scopes.includes('identity'), recipeId);
    assert.ok(source.claim_scopes.includes('ingredients'), recipeId);
    assert.ok(source.claim_scopes.includes('process'), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r112 preserves staged and traditional vessel boundaries instead of inventing cooker parameters', () => {
  const hiezushi = byId.get('maff-miyazaki-hiezushi');
  assert.equal(hiezushi.fixed_batch.servings, 1);
  assert.equal(hiezushi.liquid_contract, null);
  assert.equal(hiezushi.cooker_adaptation.status, 'not_adapted');
  assert.match(hiezushi.cooker_adaptation.notes, /猪|稗|鍋|电饭煲|不推导/u);

  const ochagai = byId.get('maff-saga-ochagai-chagayu');
  assert.equal(ochagai.fixed_batch.servings, 4);
  assert.equal(ochagai.liquid_contract.amount.value, 1600);
  assert.equal(ochagai.liquid_contract.amount.unit, 'mL');
  assert.equal(ochagai.cooker_adaptation.status, 'not_adapted');
  assert.match(ochagai.cooker_adaptation.notes, /茶|锅|电饭煲|不推导/u);

  const yakome = byId.get('maff-yamanashi-yakome');
  assert.equal(yakome.fixed_batch.servings, 15);
  assert.equal(yakome.cooker_adaptation.status, 'not_adapted');
  assert.match(yakome.cooker_adaptation.notes, /蒸|大豆|不推导/u);

  const obaku = byId.get('maff-yamanashi-obaku');
  assert.equal(obaku.fixed_batch.servings, 20);
  assert.equal(obaku.liquid_contract.amount.value, 800);
  assert.equal(obaku.liquid_contract.amount.unit, 'mL');
  assert.equal(obaku.cooker_adaptation.status, 'not_adapted');
  assert.match(obaku.cooker_adaptation.notes, /丸麦|锅|不推导/u);

  const mossou = byId.get('maff-kagawa-mossou-meshi');
  assert.equal(mossou.fixed_batch.servings, 20);
  assert.equal(mossou.cooker_adaptation.status, 'not_adapted');
  assert.match(mossou.cooker_adaptation.notes, /炊熟|具|不推导/u);
});

test('r112 keeps source scope honest and all entries in research-only status', () => {
  for (const [recipeId, , url] of expected) {
    const recipe = byId.get(recipeId);
    const source = recipe.source_refs.find((item) => item.url === url);
    assert.equal(source.publisher, '農林水産省', recipeId);
    assert.equal(source.license, 'government_site_terms_unspecified', recipeId);
    assert.deepEqual(source.claim_scopes.includes('quantity'), true, recipeId);
    assert.deepEqual(source.claim_scopes.includes('process'), true, recipeId);
    assert.ok(!source.claim_scopes.includes('liquid') || recipe.liquid_contract, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.equal(recipe.cooker_adaptation.status, 'not_adapted', recipeId);
  }
});

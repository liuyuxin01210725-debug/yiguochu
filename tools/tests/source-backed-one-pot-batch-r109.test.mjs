import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  [
    'maff-hokkaido-amanatto-sekihan',
    '北海道赤飯',
    'https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/sekihan_hokkaido.html',
  ],
  [
    'maff-carrot-asparagus-pilaf',
    '人参とアスパラガスのピラフ',
    'https://www.maff.go.jp/j/seisan/kakou/mezamasi/recipe/recipe021.html',
  ],
];

test('r109 adds two direct official rice candidates without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r197');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);
  for (const [recipeId, name, url] of expected) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.canonical_name, name, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.equal(recipe.identity_status, 'verified', recipeId);
    assert.ok(recipe.core_ingredients.length >= 2, recipeId);
    assert.ok(recipe.cooking_sequence.length > 0, recipeId);
    assert.ok(recipe.source_refs.some((source) => source.url === url), recipeId);
    assert.ok(recipe.source_refs.every((source) => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every((source) => Number.isInteger(source.evidence_tier)), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r109 preserves direct-pot and staged preparation boundaries', () => {
  const sekihan = byId.get('maff-hokkaido-amanatto-sekihan');
  assert.equal(sekihan.cooker_adaptation.status, 'not_adapted');
  assert.match(sekihan.cooker_adaptation.notes, /炉上锅|甜纳豆|电饭煲/u);
  assert.equal(sekihan.fixed_batch.servings, 4);
  assert.equal(sekihan.liquid_contract.amount.value, 3);
  assert.equal(sekihan.liquid_contract.amount.unit, '杯');
  assert.match(sekihan.evidence_notes, /甜味|蛋白|电饭煲/u);

  const pilaf = byId.get('maff-carrot-asparagus-pilaf');
  assert.equal(pilaf.cooker_adaptation.status, 'source_limited');
  assert.match(pilaf.cooker_adaptation.notes, /预炒|预煮|炊饭器/u);
  assert.match(pilaf.evidence_notes, /预炒|芦笋|电饭煲/u);
  assert.ok(pilaf.fixed_batch.ingredients.some((item) => item.name === '免洗米' || item.name === '米'), 'rice');
});

test('r109 keeps each official source directly attributable', () => {
  for (const [recipeId] of expected) {
    const recipe = byId.get(recipeId);
    for (const source of recipe.source_refs) {
      assert.equal(source.publisher, '農林水産省', recipeId);
      assert.equal(source.license, 'government_site_terms_unspecified', recipeId);
      assert.ok(source.evidence_locator, recipeId);
      assert.deepEqual(source.claim_scopes.includes('identity'), true, recipeId);
    }
  }
});

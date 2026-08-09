import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  ['r106-tw-red-date-rice', '紅棗飯', 'https://kids.moa.gov.tw/theme_data.php?theme=kids_cooking&id=200'],
  ['r106-tw-taro-salted-congee', '芋頭鹹粥', 'https://kids.moa.gov.tw/theme_data.php?id=203&theme=kids_cooking'],
  ['r106-tw-rice-bean-vegetable-mixed-rice', '米豆鮮蔬拌飯', 'https://fae.moa.gov.tw/files/topics/1383/A02_1.pdf'],
  ['r106-jp-aichi-mukago-gohan', 'むかごご飯', 'https://www.pref.aichi.jp/shokuiku/shokuikunet/mind/recipe/recipe010.html'],
];

test('r106 adds four official Taiwan/Japan rice records without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r249');
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

test('r106 preserves direct-pot versus staged/cooked-rice boundaries', () => {
  const redDate = byId.get('r106-tw-red-date-rice');
  const mukago = byId.get('r106-jp-aichi-mukago-gohan');
  assert.match(redDate.cooker_adaptation.notes, /煮饭锅|一锅|型号/u);
  assert.match(mukago.cooker_adaptation.notes, /炊饭器|刻度|不.*推/u);
  for (const recipeId of ['r106-tw-taro-salted-congee', 'r106-tw-rice-bean-vegetable-mixed-rice']) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe.cooker_adaptation.status, 'not_adapted', recipeId);
    assert.match(recipe.cooker_adaptation.notes, /分阶段|炒锅|电锅|熟饭/u, recipeId);
  }
  assert.match(byId.get('r106-tw-taro-salted-congee').evidence_notes, /猪肉|鸡蛋|安全/u);
  assert.match(byId.get('r106-tw-rice-bean-vegetable-mixed-rice').evidence_notes, /浸泡|熟饭|拌炒/u);
});

test('r106 does not duplicate existing canonical names', () => {
  for (const [, name] of expected) {
    assert.equal(catalog.recipes.filter((recipe) => recipe.canonical_name === name).length, 1, name);
  }
});

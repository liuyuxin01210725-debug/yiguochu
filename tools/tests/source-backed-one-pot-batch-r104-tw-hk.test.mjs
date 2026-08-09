import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  ['r104-hk-tomato-wintermelon-soup-rice', '西紅柿瓜湯西施飯', 'extra_pan_or_steam', 1],
  ['r104-hk-pumpkin-shrimp-golden-rice', '南瓜蝦仁黃金飯', 'extra_pan_or_steam', 2],
  ['r104-hk-tomato-egg-beef-soup-rice', '番茄蛋鮮牛肉湯泡飯', 'cooked_rice_second_cook', 1],
  ['r104-hk-mushroom-italian-rice-ricotta', '蘑菇意大利飯配軟芝士', 'extra_pan_or_steam', 1],
  ['r104-hk-tomato-garden-vegetable-pao-rice', '番茄湯田園雜菜泡飯', 'cooked_rice_second_cook', 4],
  ['r104-hk-carrot-seafood-rice', '胡蘿蔔海鮮飯', 'extra_pan_or_steam', 4],
];

test('r104 adds six opened official Hong Kong rice records without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r246');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);
  for (const [recipeId, name, boundary, servings] of expected) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.canonical_name, name, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.equal(recipe.identity_status, 'verified', recipeId);
    assert.equal(recipe.fixed_batch?.servings ?? null, servings, recipeId);
    assert.ok(Array.isArray(recipe.cooking_sequence) && recipe.cooking_sequence.length > 0, recipeId);
    assert.equal(recipe.cooker_adaptation.status, 'not_adapted', recipeId);
    assert.match(recipe.cooker_adaptation.notes, new RegExp(boundary === 'cooked_rice_second_cook' ? '熟饭二次烹' : '分阶段|预炒|预煮|蒸制'));
    assert.ok(recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every((source) => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every((source) => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every((source) => source.url.startsWith('https://restaurant.eatsmart.gov.hk/')), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r104 preserves source boundaries and does not invent universal electric-cooker contracts', () => {
  const staged = expected.filter(([, , boundary]) => boundary === 'extra_pan_or_steam').map(([recipeId]) => byId.get(recipeId));
  const cookedRice = expected.filter(([, , boundary]) => boundary === 'cooked_rice_second_cook').map(([recipeId]) => byId.get(recipeId));
 for (const recipe of staged) {
    const expectedLiquid = recipe.recipe_id === 'r104-hk-mushroom-italian-rice-ricotta'
      ? { kind: 'added_broth', amount: { value: 200, unit: 'mL蔬菜高汤' }, source_ids: ['S-R104-HK-MUSHROOM-ITALIAN-RICE-RICOTTA-1'] }
      : recipe.recipe_id === 'r104-hk-carrot-seafood-rice'
        ? { kind: 'added_chicken_stock', amount: { value: 100, unit: 'mL鸡汤' }, source_ids: ['S-R104-HK-CARROT-SEAFOOD-RICE-1'] }
        : null;
    assert.deepEqual(recipe.liquid_contract, expectedLiquid, recipe.recipe_id);
   assert.equal(recipe.time_contract, null, recipe.recipe_id);
   assert.match(recipe.evidence_notes, /不能|不.*电饭煲|分阶段|熟饭/u, recipe.recipe_id);
 }
  for (const recipe of cookedRice) {
    assert.match(recipe.cooker_adaptation.notes, /熟饭二次烹/u, recipe.recipe_id);
    assert.equal(recipe.cooker_adaptation.status, 'not_adapted', recipe.recipe_id);
  }
  assert.match(byId.get('r104-hk-pumpkin-shrimp-golden-rice').evidence_notes, /虾|安全/u);
});

test('r104 records only new Hong Kong names and does not duplicate prior catalog entries', () => {
  const names = catalog.recipes.map((recipe) => recipe.canonical_name);
  for (const [, name] of expected) {
    assert.equal(names.filter((candidate) => candidate === name).length, 1, name);
  }
  for (const duplicateName of ['粟米南瓜雞球飯', '菜片瑤柱鴛鴦蛋燴飯', '南瓜五穀飯']) {
    assert.equal(names.filter((candidate) => candidate === duplicateName).length, 1, duplicateName);
  }
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  ['r105-tiger-healthy-vegetable-brown-fried-rice', 'Healthy Vegetable Fried Rice (Brown Rice)', 'https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/healthy-vegetable-fried-rice-brown-rice/'],
  ['r105-tiger-bacon-parmesan-risotto', 'Bacon and Parmesan Risotto', 'https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/bacon-and-parmesan-risotto/'],
  ['r105-tiger-corn-shumai-chinese-mixed-rice', 'Corn Shumai and Chinese Style Mixed Rice', 'https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/corn-shumai-steamed-dumplings-chinese-style-mixed-rice/'],
  ['r105-panasonic-taiwan-preserved-egg-pork-congee', '皮蛋瘦肉粥（Panasonic）', 'https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/216'],
  ['r105-zojirushi-taiwan-preserved-egg-pork-congee', '皮蛋瘦肉粥（象印）', 'https://www.zojirushi.com.tw/recipe/rice-cookers/446/csr'],
];

test('r105 catalog version and five official manufacturer records are present without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r188');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);
  for (const [recipeId, name, url] of expected) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.canonical_name, name, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.equal(recipe.identity_status, 'verified', recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients) && recipe.core_ingredients.length >= 3, recipeId);
    assert.ok(Array.isArray(recipe.cooking_sequence) && recipe.cooking_sequence.length > 0, recipeId);
    assert.ok(recipe.source_refs.some((source) => source.url === url), recipeId);
    assert.ok(recipe.source_refs.every((source) => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every((source) => Number.isInteger(source.evidence_tier)), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r105 preserves manufacturer and appliance boundaries instead of inventing universal contracts', () => {
  for (const [recipeId] of expected) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe.cooker_adaptation.status, 'source_limited', recipeId);
    assert.match(recipe.cooker_adaptation.notes, /来源|Tiger|Panasonic|象印/u, recipeId);
    assert.match(recipe.evidence_notes, /来源|页面|器具|流程/u, recipeId);
  }
  assert.match(byId.get('r105-tiger-healthy-vegetable-brown-fried-rice').evidence_notes, /熟饭|炒蛋|二次/u);
  assert.match(byId.get('r105-tiger-corn-shumai-chinese-mixed-rice').evidence_notes, /Tacook|同步|双层/u);
  assert.match(byId.get('r105-panasonic-taiwan-preserved-egg-pork-congee').evidence_notes, /中途|安全|水位/u);
  assert.match(byId.get('r105-zojirushi-taiwan-preserved-egg-pork-congee').evidence_notes, /余温|安全|水位/u);
});

test('r105 does not duplicate existing canonical manufacturer records', () => {
  const names = catalog.recipes.map((recipe) => recipe.canonical_name);
  for (const [, name] of expected) {
    assert.equal(names.filter((candidate) => candidate === name).length, 1, name);
  }
  assert.equal(names.filter((name) => name === '金沙皮蛋香菇粥').length, 1);
});

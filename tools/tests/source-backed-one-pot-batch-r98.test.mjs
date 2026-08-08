import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('r98 adds six directly verified rice/congee candidates without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r201');
  assert.equal(catalog.recipes.length, 923);
  const expected = new Map([
    ['r98-zojirushi-taiwan-corn-chicken-brown-congee', ['玉米雞蓉糙米粥', 'recipe_fact_checked']],
    ['r98-zojirushi-china-chestnut-chicken-congee', ['板栗鸡丝粥', 'recipe_fact_checked']],
    ['r98-panasonic-taiwan-preserved-egg-mushroom-congee', ['金沙皮蛋香菇粥', 'recipe_fact_checked']],
    ['r98-zojirushi-taiwan-wild-mushroom-chicken-mixed-rice', ['日式野菇雞肉炊飯', 'recipe_fact_checked']],
    ['r98-philips-hk-seaweed-chicken-rice-soup', ['紫菜雞粒湯飯', 'recipe_fact_checked']],
    ['r98-philips-hk-red-bean-coix-oat-congee', ['紅豆薏米燕麥粥', 'recipe_fact_checked']],
  ]);
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  for (const [recipeId, [name, status]] of expected) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe?.canonical_name, name, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.equal(recipe?.identity_status, 'verified', recipeId);
    assert.ok(recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
  assert.equal(byId.get('r98-zojirushi-taiwan-corn-chicken-brown-congee')?.cooker_adaptation.status, 'source_limited');
  assert.equal(byId.get('r98-philips-hk-seaweed-chicken-rice-soup')?.liquid_contract.amount.value, 350);
  assert.equal(byId.get('r98-philips-hk-red-bean-coix-oat-congee')?.time_contract.total_minutes, 120);
});

test('r98 keeps model-specific and cooked-rice boundaries explicit', () => {
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  const cookedRice = byId.get('r98-philips-hk-seaweed-chicken-rice-soup');
  assert.ok(cookedRice.core_ingredients.includes('熟白饭'));
  assert.match(cookedRice.evidence_notes, /熟饭基底/);
  assert.match(cookedRice.cooker_adaptation.notes, /生米炊饭/);
  const modelRecipes = [
    byId.get('r98-zojirushi-taiwan-corn-chicken-brown-congee'),
    byId.get('r98-zojirushi-china-chestnut-chicken-congee'),
    byId.get('r98-panasonic-taiwan-preserved-egg-mushroom-congee'),
    byId.get('r98-zojirushi-taiwan-wild-mushroom-chicken-mixed-rice'),
    byId.get('r98-philips-hk-red-bean-coix-oat-congee'),
  ];
  assert.ok(modelRecipes.every(recipe => recipe.cooker_adaptation.status === 'source_limited'));
  assert.ok(modelRecipes.every(recipe => recipe.fixed_batch === null));
});

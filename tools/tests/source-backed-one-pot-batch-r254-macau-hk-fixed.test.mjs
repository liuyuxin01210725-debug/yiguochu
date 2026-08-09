import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

test('r254 closes six exact Macau/Hong Kong source contracts without adding canonical recipes', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r254');
  assert.equal(catalog.recipes.length, 923);

  const expected = [
    ['r100-macau-tomato-chicken-rice', 4],
    ['r100-macau-high-fiber-brown-fried-rice', 3],
    ['r100-hk-corn-pumpkin-chicken-ball-rice', 1],
    ['r100-hk-scallop-egg-braised-rice', 2],
    ['r100-hk-garlic-wild-mushroom-stonepot-rice', 1],
    ['r100-hk-pumpkin-multigrain-rice', 2],
  ];
  for (const [recipeId, servings] of expected) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe?.status, 'recipe_fact_checked', recipeId);
    assert.equal(recipe?.fixed_batch?.servings, servings, recipeId);
    assert.ok(recipe?.cooking_sequence?.length >= 2, recipeId);
    const source = recipe.source_refs.find(item => item.source_id === recipe.fixed_batch.source_ids[0]);
    assert.ok(source?.claim_scopes?.includes('quantity'), recipeId);
    assert.ok(source?.claim_scopes?.includes('process'), recipeId);
    assert.equal(recipe?.safety_endpoints?.length, 0, recipeId);
    assert.notEqual(recipe?.status, 'executable', recipeId);
  }
});

test('r254 preserves cooked-rice, stone-pot, and multi-vessel boundaries', () => {
  assert.match(byId.get('r100-macau-tomato-chicken-rice').cooker_adaptation.notes, /熟饭二次烹/u);
  assert.match(byId.get('r100-macau-high-fiber-brown-fried-rice').cooker_adaptation.notes, /冷藏|熟饭/u);
  assert.match(byId.get('r100-hk-garlic-wild-mushroom-stonepot-rice').cooker_adaptation.notes, /石锅|熟饭/u);
  assert.match(byId.get('r100-hk-pumpkin-multigrain-rice').cooker_adaptation.notes, /烤箱|蒸|炒锅/u);
  assert.equal(byId.get('r100-hk-pumpkin-seafood-brown-rice').status, 'discovered');
});

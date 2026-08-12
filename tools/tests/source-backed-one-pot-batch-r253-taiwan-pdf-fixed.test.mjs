import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

function ingredient(recipeId, name) {
  return byId.get(recipeId)?.fixed_batch?.ingredients?.find((item) => item.name === name);
}

test('r253 closes four exact Taiwan PDF batch contracts without adding canonical recipes', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);

  assert.equal(byId.get('r100-taiwan-red-quinoa-lotus-leaf-rice')?.fixed_batch?.servings, 5);
  assert.equal(ingredient('r100-taiwan-red-quinoa-lotus-leaf-rice', '糯米')?.amount.value, 120);
  assert.equal(ingredient('r100-taiwan-red-quinoa-lotus-leaf-rice', '广式腊肠')?.amount.value, 50);

  assert.equal(byId.get('r100-taiwan-quinoa-oil-rice')?.fixed_batch?.servings, 4);
  assert.equal(ingredient('r100-taiwan-quinoa-oil-rice', '长糯米')?.amount.value, 300);
  assert.equal(byId.get('r100-taiwan-quinoa-oil-rice')?.liquid_contract?.amount.value, 60);

  assert.equal(byId.get('r100-taiwan-momordica-vegetable-risotto')?.fixed_batch?.servings, 5);
  assert.equal(ingredient('r100-taiwan-momordica-vegetable-risotto', '台梗九号米')?.amount.value, 250);
  assert.equal(ingredient('r100-taiwan-momordica-vegetable-risotto', '素鸡')?.amount.value, 150);

  assert.equal(byId.get('r100-taiwan-grain-health-congee')?.fixed_batch?.servings, 5);
  assert.equal(ingredient('r100-taiwan-grain-health-congee', '桂圆干')?.amount.value, 120);
  assert.equal(byId.get('r100-taiwan-grain-health-congee')?.liquid_contract?.amount.value, 2000);
});

test('r253 preserves source-specific staged vessels and non-executable boundaries', () => {
  for (const id of [
    'r100-taiwan-red-quinoa-lotus-leaf-rice',
    'r100-taiwan-quinoa-oil-rice',
    'r100-taiwan-momordica-vegetable-risotto',
    'r100-taiwan-grain-health-congee',
  ]) {
    const recipe = byId.get(id);
    assert.equal(recipe?.status, 'recipe_fact_checked', id);
    assert.ok(recipe?.cooking_sequence?.length, id);
    assert.equal('executable' in recipe, false, id);
  }
  assert.equal(byId.get('r100-taiwan-momordica-vegetable-risotto')?.liquid_contract, null);
  assert.match(byId.get('r100-taiwan-red-quinoa-lotus-leaf-rice')?.cooker_adaptation?.notes ?? '', /蒸笼|炒锅/u);
  assert.match(byId.get('r100-taiwan-quinoa-oil-rice')?.cooker_adaptation?.notes ?? '', /蒸锅|炒锅/u);
  assert.match(byId.get('r100-taiwan-grain-health-congee')?.cooker_adaptation?.notes ?? '', /甜粥|多阶段/u);
});

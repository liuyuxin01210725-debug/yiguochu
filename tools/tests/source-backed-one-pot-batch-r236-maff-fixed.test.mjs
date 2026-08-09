import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

function loadCatalog() {
  return JSON.parse(readFileSync(catalogPath, 'utf8'));
}

test('r236 closes three exact MAFF fixed-batch gaps without changing staged boundaries', () => {
  const catalog = loadCatalog();
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r247');
  assert.equal(catalog.recipes.length, 923);

  const expected = [
    ['maff-fukushima-harako-meshi', 4, '米', 3],
    ['maff-hiroshima-uomeshi', 4, '白身鱼', 120],
    ['maff-tokyo-fukagawa-meshi', 1, '蛤蜊', 100],
  ];

  for (const [recipeId, servings, ingredientName, amount] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked');
    assert.equal(recipe.fixed_batch?.servings, servings);
    assert.equal(recipe.fixed_batch?.ingredients.find(item => item.name === ingredientName)?.amount.value, amount);
    assert.equal(recipe.fixed_batch?.source_ids.length, 1);
    assert.notEqual(recipe.status, 'executable');
  }
});

test('r236 preserves the official cooked-rice and topping boundaries', () => {
  const catalog = loadCatalog();
  const harako = catalog.recipes.find(item => item.recipe_id === 'maff-fukushima-harako-meshi');
  const uomeshi = catalog.recipes.find(item => item.recipe_id === 'maff-hiroshima-uomeshi');
  const fukagawa = catalog.recipes.find(item => item.recipe_id === 'maff-tokyo-fukagawa-meshi');
  assert.ok(harako && uomeshi && fukagawa);
  assert.equal(harako.liquid_contract, null);
  assert.equal(uomeshi.liquid_contract, null);
  assert.equal(fukagawa.liquid_contract, null);
  assert.match(harako.evidence_notes, /炊好米饭|腌鱼子/u);
  assert.match(uomeshi.evidence_notes, /熟饭|浇汁/u);
  assert.match(fukagawa.evidence_notes, /熟饭|浇汁/u);
  assert.equal(harako.cooker_adaptation.status, 'not_adapted');
  assert.equal(uomeshi.cooker_adaptation.status, 'not_adapted');
  assert.equal(fukagawa.cooker_adaptation.status, 'not_adapted');
});

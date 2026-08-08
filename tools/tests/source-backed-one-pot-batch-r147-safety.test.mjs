import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const ids = [
  'panasonic-one-pot-chicken-rice',
  'panasonic-claypot-style-chicken-rice',
  'tatung-avocado-chicken-rice',
  'joyoung-pumpkin-shiitake-chicken-rice',
  'instant-pot-coconut-chicken-pineapple-rice',
];

test('r147 keeps the catalog size and records the five-source safety batch', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r180');
  assert.equal(catalog.recipes.length, 923);
  for (const id of ids) {
    const recipe = catalog.recipes.find(({ recipe_id: recipeId }) => recipeId === id);
    assert.ok(recipe, `missing ${id}`);
    assert.equal(recipe.status, 'recipe_fact_checked');
    assert.deepEqual(recipe.safety_endpoints, [{
      code: 'poultry_fully_cooked',
      minimum_core_temperature_c: 74,
      source_ids: ['S-SAFETY-TEMPERATURES-1'],
    }]);
    const safetySource = recipe.source_refs.find(({ source_id: sourceId }) => sourceId === 'S-SAFETY-TEMPERATURES-1');
    assert.ok(safetySource, `${id} lacks the shared FoodSafety.gov source`);
    assert.ok(safetySource.claim_scopes.includes('safety'));
    assert.equal(safetySource.url, 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures');
  }
});

test('r147 retains the recipe-specific appliance and process boundaries', () => {
  const byId = Object.fromEntries(catalog.recipes.filter(({ recipe_id: id }) => ids.includes(id)).map(recipe => [recipe.recipe_id, recipe]));
  assert.match(byId['panasonic-one-pot-chicken-rice'].cooker_adaptation.notes, /SR-HL151/u);
  assert.match(byId['panasonic-claypot-style-chicken-rice'].cooker_adaptation.notes, /Panasonic|机型/u);
  assert.match(byId['tatung-avocado-chicken-rice'].evidence_notes, /煎|牛油果/u);
  assert.match(byId['joyoung-pumpkin-shiitake-chicken-rice'].evidence_notes, /JRC-4TD01|翻炒/u);
  assert.match(byId['instant-pot-coconut-chicken-pineapple-rice'].cooker_adaptation.notes, /Instant Pot|压力/u);
});

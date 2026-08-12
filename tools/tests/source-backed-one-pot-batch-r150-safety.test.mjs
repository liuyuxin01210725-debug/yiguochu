import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';
const expected = {
  'tiger-pork-kimchi-brown-rice': {
    code: 'pork_fully_cooked',
    temperature: 74,
    locator: /casseroles.*165°F \/ 74°C/u,
  },
  'philips-pumpkin-minced-pork-congee': {
    code: 'pork_fully_cooked',
    temperature: 74,
    locator: /casseroles.*165°F \/ 74°C/u,
  },
  'tiger-steak-mushroom-barley-rice': {
    code: 'beef_fully_cooked',
    temperature: 71,
    locator: /beef.*71°C/u,
  },
  'philips-japanese-wagyu-beef-rice-bowl': {
    code: 'beef_fully_cooked',
    temperature: 71,
    locator: /beef.*71°C/u,
  },
  'panasonic-taiwan-salmon-mushroom-rice': {
    code: 'seafood_fully_cooked',
    temperature: 63,
    locator: /fish 145°F \/ 63°C minimum internal temperature/u,
  },
};
const executableIds = new Set(['tiger-steak-mushroom-barley-rice']);

test('r150 closes five existing raw pork, beef, and fish safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  for (const [id, expectedEndpoint] of Object.entries(expected)) {
    const recipe = catalog.recipes.find(({ recipe_id: recipeId }) => recipeId === id);
    assert.ok(recipe, `missing ${id}`);
    assert.equal(recipe.status, executableIds.has(id) ? 'executable' : 'recipe_fact_checked');
    assert.deepEqual(recipe.safety_endpoints, [{
      code: expectedEndpoint.code,
      minimum_core_temperature_c: expectedEndpoint.temperature,
      source_ids: ['S-SAFETY-TEMPERATURES-1'],
    }]);
    const source = recipe.source_refs.find(({ source_id: sourceId }) => sourceId === 'S-SAFETY-TEMPERATURES-1');
    assert.ok(source, `${id} lacks FoodSafety.gov source`);
    assert.deepEqual(source.claim_scopes, ['safety']);
    assert.equal(source.url, safetyUrl);
    assert.equal(source.access_status, 'opened');
    assert.equal(source.evidence_tier, 1);
    assert.match(source.evidence_locator, expectedEndpoint.locator);
  }
});

test('r150 keeps staged and model-scoped process boundaries visible', () => {
  const catalogById = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.equal(catalogById['tiger-steak-mushroom-barley-rice'].cooker_adaptation.status, 'source_limited');
  assert.match(catalogById['tiger-steak-mushroom-barley-rice'].cooking_sequence[1].instruction, /平底锅中煎/u);
  assert.match(catalogById['philips-japanese-wagyu-beef-rice-bowl'].cooker_adaptation.notes, /倒数5分钟/u);
  assert.match(catalogById['panasonic-taiwan-salmon-mushroom-rice'].cooker_adaptation.notes, /SR-PAA100/u);
  for (const id of Object.keys(expected)) {
    if (!executableIds.has(id)) assert.notEqual(catalogById[id].status, 'executable');
  }
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';
const expected = {
  'panasonic-taiwan-taiyu-scallop-quinoa-rice': {
    code: 'seafood_fully_cooked',
    temperature: 63,
    locator: /fish 145°F \/ 63°C|鱼类中心温度63°C/u,
  },
  'panasonic-my-century-egg-chicken-congee': {
    code: 'poultry_fully_cooked',
    temperature: 74,
    locator: /poultry|禽肉|鸡肉|165°F \/ 74°C/u,
  },
  'r97-zojirushi-taiwan-brown-cabbage-mixed-rice': {
    code: 'pork_fully_cooked',
    temperature: 74,
    locator: /pork|猪肉|165°F \/ 74°C/u,
  },
  'r98-zojirushi-taiwan-wild-mushroom-chicken-mixed-rice': {
    code: 'poultry_fully_cooked',
    temperature: 74,
    locator: /poultry|禽肉|鸡肉|165°F \/ 74°C/u,
  },
};

test('r154 closes four existing raw fish, poultry, and pork safety gaps without adding recipes', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r173');
  assert.equal(catalog.recipes.length, 923);
  for (const [id, expectedEndpoint] of Object.entries(expected)) {
    const recipe = catalog.recipes.find(({ recipe_id: recipeId }) => recipeId === id);
    assert.ok(recipe, `missing ${id}`);
    assert.equal(recipe.status, 'recipe_fact_checked');
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

test('r154 preserves raw-ingredient and appliance boundaries, and leaves the conflicted pumpkin entry untouched', () => {
  const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.match(byId['panasonic-taiwan-taiyu-scallop-quinoa-rice'].evidence_notes, /干贝|干燥|鲷鱼/u);
  assert.match(byId['panasonic-my-century-egg-chicken-congee'].cooker_adaptation.notes, /搅拌机|Panasonic/u);
  assert.match(byId['r97-zojirushi-taiwan-brown-cabbage-mixed-rice'].cooker_adaptation.notes, /压力IH|水位|机型/u);
  assert.match(byId['r98-zojirushi-taiwan-wild-mushroom-chicken-mixed-rice'].cooker_adaptation.notes, /压力IH|水位|机型/u);
  assert.deepEqual(byId['panasonic-my-chicken-pumpkin-lotus-mixed-rice'].safety_endpoints, []);
  assert.match(byId['panasonic-my-chicken-pumpkin-lotus-mixed-rice'].evidence_notes, /投料|冲突|缺步/u);
  for (const id of Object.keys(expected)) assert.notEqual(byId[id].status, 'executable');
});

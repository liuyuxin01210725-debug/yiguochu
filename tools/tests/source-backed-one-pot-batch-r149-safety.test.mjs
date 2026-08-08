import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const expected = {
  'panasonic-chicken-cream-pilaf': {
    code: 'poultry_fully_cooked',
    minimum_core_temperature_c: 74,
    locator: /poultry 165°F \/ 74°C minimum internal temperature/u,
  },
  'taiwan-vegetable-chicken-rice': {
    code: 'poultry_fully_cooked',
    minimum_core_temperature_c: 74,
    locator: /poultry 165°F \/ 74°C minimum internal temperature/u,
  },
  'hk-pumpkin-taro-chicken-claypot-rice': {
    code: 'poultry_fully_cooked',
    minimum_core_temperature_c: 74,
    locator: /poultry 165°F \/ 74°C minimum internal temperature/u,
  },
  'hk-taro-shrimp-multigrain-steamed-rice': {
    code: 'seafood_fully_cooked',
    minimum_core_temperature_c: 74,
    locator: /shellfish\/seafood fully cooked.*165°F \/ 74°C/u,
  },
};

test('r149 closes four existing safety gaps with the shared official endpoint', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r149');
  assert.equal(catalog.recipes.length, 923);
  for (const [id, expectedEndpoint] of Object.entries(expected)) {
    const recipe = catalog.recipes.find(({ recipe_id: recipeId }) => recipeId === id);
    assert.ok(recipe, `missing ${id}`);
    assert.equal(recipe.status, 'recipe_fact_checked');
    assert.deepEqual(recipe.safety_endpoints, [{
      code: expectedEndpoint.code,
      minimum_core_temperature_c: expectedEndpoint.minimum_core_temperature_c,
      source_ids: ['S-SAFETY-TEMPERATURES-1'],
    }]);
    const safetySource = recipe.source_refs.find(({ source_id: sourceId }) => sourceId === 'S-SAFETY-TEMPERATURES-1');
    assert.ok(safetySource, `${id} lacks the shared FoodSafety.gov source`);
    assert.deepEqual(safetySource.claim_scopes, ['safety']);
    assert.equal(safetySource.url, 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures');
    assert.equal(safetySource.access_status, 'opened');
    assert.equal(safetySource.evidence_tier, 1);
    assert.match(safetySource.evidence_locator, expectedEndpoint.locator);
  }
});

test('r149 keeps the oyster recipe blocked while its ingredient state is unknown', () => {
  const recipe = catalog.recipes.find(({ recipe_id: id }) => id === 'panasonic-oyster-negi-takikomi-rice');
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.safety_endpoints, []);
  assert.equal(recipe.source_refs.some(({ source_id: id }) => id === 'S-SAFETY-TEMPERATURES-1'), false);
});

test('r149 does not alter the original appliance and staged-process boundaries', () => {
  const byId = Object.fromEntries(catalog.recipes
    .filter(({ recipe_id: id }) => Object.hasOwn(expected, id))
    .map(recipe => [recipe.recipe_id, recipe]));
  assert.equal(byId['panasonic-chicken-cream-pilaf'].cooker_adaptation.status, 'source_limited');
  assert.match(byId['taiwan-vegetable-chicken-rice'].cooker_adaptation.notes, /电锅|总时长/u);
  assert.equal(byId['hk-pumpkin-taro-chicken-claypot-rice'].cooker_adaptation.status, 'not_adapted');
  assert.match(byId['hk-taro-shrimp-multigrain-steamed-rice'].cooker_adaptation.notes, /分阶段|投虾|瓦煲/u);
});

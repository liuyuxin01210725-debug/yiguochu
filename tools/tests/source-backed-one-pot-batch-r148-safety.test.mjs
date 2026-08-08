import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const ids = [
  'tiger-chicken-bamboo-rice',
  'tiger-whitefish-mixed-rice',
  'tiger-chinese-sticky-rice',
  'jp-hiroshima-kakimeshi',
  'jp-shiga-amenoio-gohan',
];

const expected = {
  'tiger-chicken-bamboo-rice': {
    code: 'poultry_fully_cooked',
    minimum_core_temperature_c: 74,
  },
  'tiger-whitefish-mixed-rice': {
    code: 'seafood_fully_cooked',
    minimum_core_temperature_c: 63,
  },
  'tiger-chinese-sticky-rice': {
    code: 'pork_fully_cooked',
    minimum_core_temperature_c: 74,
  },
  'jp-hiroshima-kakimeshi': {
    code: 'seafood_fully_cooked',
    minimum_core_temperature_c: 74,
  },
  'jp-shiga-amenoio-gohan': {
    code: 'seafood_fully_cooked',
    minimum_core_temperature_c: 63,
  },
};

test('r148 adds only source-backed safety endpoints to the five audited recipes', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r197');
  assert.equal(catalog.recipes.length, 923);
  for (const id of ids) {
    const recipe = catalog.recipes.find(({ recipe_id: recipeId }) => recipeId === id);
    assert.ok(recipe, `missing ${id}`);
    assert.equal(recipe.status, 'recipe_fact_checked');
    assert.deepEqual(recipe.safety_endpoints, [{
      ...expected[id],
      source_ids: ['S-SAFETY-TEMPERATURES-1'],
    }]);
    const safetySource = recipe.source_refs.find(({ source_id: sourceId }) => sourceId === 'S-SAFETY-TEMPERATURES-1');
    assert.ok(safetySource, `${id} lacks the shared FoodSafety.gov source`);
    assert.deepEqual(safetySource.claim_scopes, ['safety']);
    assert.equal(safetySource.url, 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures');
    assert.equal(safetySource.access_status, 'opened');
    assert.equal(safetySource.evidence_tier, 1);
    assert.match(safetySource.evidence_locator, /FoodSafety.gov|Internal Temperature|最低中心温度/u);
  }
});

test('r148 leaves recipe identity, original process, and appliance boundaries unchanged', () => {
  const byId = Object.fromEntries(catalog.recipes.filter(({ recipe_id: id }) => ids.includes(id)).map(recipe => [recipe.recipe_id, recipe]));
  assert.match(byId['tiger-chicken-bamboo-rice'].cooker_adaptation.notes, /Tiger|机型|水位/u);
  assert.match(byId['tiger-whitefish-mixed-rice'].evidence_notes, /预煎|拆骨|两阶段/u);
  assert.match(byId['tiger-chinese-sticky-rice'].evidence_notes, /前处理|器具/u);
  assert.match(byId['jp-hiroshima-kakimeshi'].evidence_notes, /牡蛎|回锅|温度/u);
  assert.match(byId['jp-shiga-amenoio-gohan'].evidence_notes, /琵琶鳟|先煮|温度/u);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);
const targetIds = [
  'r58-sharp-matsusaka-pork-mushroom-rice',
  'r58-cookpot-salmon-milk-brown-rice-risotto',
  'r58-cookpot-corn-rice-beef-meatballs',
];

test('r233 closes three directly evidenced raw-protein safety gaps', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r241');
  assert.equal(catalog.recipes.length, 923);
  const expected = {
    'r58-sharp-matsusaka-pork-mushroom-rice': ['pork_fully_cooked', 74],
    'r58-cookpot-salmon-milk-brown-rice-risotto': ['seafood_fully_cooked', 63],
    'r58-cookpot-corn-rice-beef-meatballs': ['beef_fully_cooked', 71],
  };
  for (const id of targetIds) {
    const recipe = catalog.recipes.find(item => item.recipe_id === id);
    assert.ok(recipe, id);
    assert.equal(recipe.status, 'recipe_fact_checked');
    const [code, temperature] = expected[id];
    assert.deepEqual(recipe.safety_endpoints, [{
      code,
      minimum_core_temperature_c: temperature,
      source_ids: ['S-SAFETY-TEMPERATURES-1'],
    }]);
    const safetySource = recipe.source_refs.find(source => source.source_id === 'S-SAFETY-TEMPERATURES-1');
    assert.equal(safetySource?.url, 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures');
    assert.equal(safetySource?.access_status, 'opened');
    assert.deepEqual(safetySource?.claim_scopes, ['safety']);
    assert.notEqual(recipe.status, 'executable');
  }
});

test('r233 preserves staged appliance boundaries and avoids promoting the safety batch', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const sharp = catalog.recipes.find(item => item.recipe_id === targetIds[0]);
  const salmon = catalog.recipes.find(item => item.recipe_id === targetIds[1]);
  const meatballs = catalog.recipes.find(item => item.recipe_id === targetIds[2]);
  assert.equal(sharp.cooker_adaptation.status, 'source_limited');
  assert.equal(salmon.cooker_adaptation.status, 'source_limited');
  assert.equal(meatballs.cooker_adaptation.status, 'source_limited');
  assert.match(sharp.evidence_notes, /水波炉|上下层|不外推/u);
  assert.match(salmon.evidence_notes, /IH|焖5分钟|边界/u);
  assert.match(meatballs.evidence_notes, /一锅二菜|分层|不伪装/u);
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const recipeIds = [
  'maff-fukuoka-kashiwa-meshi',
  'maff-chiba-takatsu-torimeshi',
  'maff-hokkaido-bibai-torimeshi',
  'maff-miyazaki-torimeshi',
];

test('r198 closes four directly evidenced MAFF raw-chicken safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r251');
  for (const recipeId of recipeIds) {
    const recipe = byId[recipeId];
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.deepEqual(recipe.safety_endpoints, [{
      code: 'poultry_fully_cooked',
      minimum_core_temperature_c: 74,
      source_ids: [safetySourceId],
    }], recipeId);
    const safetySource = recipe.source_refs.find(source => source.source_id === safetySourceId);
    assert.ok(safetySource, `${recipeId} missing FoodSafety.gov source`);
    assert.equal(safetySource.access_status, 'opened', recipeId);
    assert.deepEqual(safetySource.claim_scopes, ['safety'], recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r198 keeps MAFF preparation and cooked-rice mixing boundaries intact', () => {
  assert.match(byId['maff-fukuoka-kashiwa-meshi'].evidence_notes, /鸡肉|鶏肉|拌饭/u);
  assert.match(byId['maff-chiba-takatsu-torimeshi'].evidence_notes, /鸡肉|鶏肉|煮/u);
  assert.match(byId['maff-hokkaido-bibai-torimeshi'].evidence_notes, /鸡肉|鶏肉|分汁|拌回/u);
  assert.match(byId['maff-miyazaki-torimeshi'].evidence_notes, /鸡肉|鶏肉|炒|炊/u);
  for (const recipeId of recipeIds) {
    assert.notEqual(byId[recipeId].cooker_adaptation?.status, 'adapted', recipeId);
  }
});

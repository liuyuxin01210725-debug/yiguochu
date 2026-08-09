import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

const expected = {
  'instant-pot-easy-chicken-rice': /Instant Pot官方页面支持|1\.25lb/u,
  'instant-pot-chicken-rice-soup': /Instant Pot官方页面直接支持|1\/2lb/u,
};

test('r207 closes two directly evidenced raw-chicken safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r236');
  assert.equal(catalog.recipes.length, 923);

  for (const [recipeId, note] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    const endpoint = recipe.safety_endpoints.find((row) => row.code === 'poultry_fully_cooked');
    assert.deepEqual(endpoint, {
      code: 'poultry_fully_cooked',
      minimum_core_temperature_c: 74,
      source_ids: [safetySourceId],
    }, recipeId);
    const safetySource = recipe.source_refs.find((row) => row.source_id === safetySourceId);
    assert.ok(safetySource, `${recipeId}: shared safety source`);
    assert.equal(safetySource.url, safetyUrl, recipeId);
    assert.equal(safetySource.access_status, 'opened', recipeId);
    assert.equal(safetySource.evidence_tier, 1, recipeId);
    assert.deepEqual(safetySource.claim_scopes, ['safety'], recipeId);
    assert.match(recipe.evidence_notes, note, recipeId);
  }
});

test('r207 preserves pressure-cooker and staged-chicken boundaries', () => {
  assert.match(byId['instant-pot-easy-chicken-rice'].cooker_adaptation.notes, /Instant Pot|高压|不外推/u);
  assert.match(byId['instant-pot-chicken-rice-soup'].evidence_notes, /Pressure Cook|撕鸡|回锅/u);
  assert.equal(byId['instant-pot-easy-chicken-rice'].time_contract, null);
  assert.equal(byId['instant-pot-chicken-rice-soup'].time_contract, null);
});

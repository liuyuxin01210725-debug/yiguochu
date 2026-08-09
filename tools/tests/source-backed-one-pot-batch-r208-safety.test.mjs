import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

const expected = {
  'panasonic-taiwan-gyudon-onion-takikomi-rice': /生牛肉同锅炊煮/u,
  'maff-beef-mushroom-yolk-rice': /生薄牛肉/u,
};

test('r208 closes two directly evidenced raw-beef safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r230');
  assert.equal(catalog.recipes.length, 923);

  for (const [recipeId, rawEvidence] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.deepEqual(recipe.safety_endpoints.find((row) => row.code === 'beef_fully_cooked'), {
      code: 'beef_fully_cooked',
      minimum_core_temperature_c: 71,
      source_ids: [safetySourceId],
    }, recipeId);
    const safetySource = recipe.source_refs.find((row) => row.source_id === safetySourceId);
    assert.ok(safetySource, `${recipeId}: shared safety source`);
    assert.equal(safetySource.url, safetyUrl, recipeId);
    assert.equal(safetySource.access_status, 'opened', recipeId);
    assert.equal(safetySource.evidence_tier, 1, recipeId);
    assert.deepEqual(safetySource.claim_scopes, ['safety'], recipeId);
    assert.match(recipe.evidence_notes, rawEvidence, recipeId);
  }
});

test('r208 preserves each source-specific beef process boundary', () => {
  assert.match(byId['panasonic-taiwan-gyudon-onion-takikomi-rice'].cooker_adaptation.notes, /SR-PAA100|水位|不外推/u);
  assert.match(byId['maff-beef-mushroom-yolk-rice'].evidence_notes, /焖10分钟|电饭锅刻度|余温/u);
});

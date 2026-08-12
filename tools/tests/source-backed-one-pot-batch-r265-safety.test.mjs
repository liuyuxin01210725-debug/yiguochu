import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

const expected = {
  'huangshi-radish-braised-rice': [['pork_fully_cooked', 74]],
  'r104-hk-pumpkin-shrimp-golden-rice': [['shellfish_fully_cooked', null]],
  'r104-hk-carrot-seafood-rice': [['shellfish_fully_cooked', null], ['seafood_fully_cooked', 63]],
};

test('r265 closes three directly evidenced meat and seafood endpoints only', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  for (const [recipeId, endpoints] of Object.entries(expected)) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked');
    assert.deepEqual(recipe.safety_endpoints.map(item => [item.code, item.minimum_core_temperature_c ?? null]), endpoints);
    for (const endpoint of recipe.safety_endpoints) {
      assert.deepEqual(endpoint.source_ids, ['S-SAFETY-TEMPERATURES-1']);
      const source = recipe.source_refs.find(item => item.source_id === 'S-SAFETY-TEMPERATURES-1');
      assert.ok(source, `${recipeId} safety source`);
      assert.equal(source.access_status, 'opened');
      assert.equal(source.evidence_tier, 1);
      assert.deepEqual(source.claim_scopes, ['safety']);
    }
  }
});

test('r265 does not turn staged or ambiguous recipes into executable entries', () => {
  for (const recipeId of Object.keys(expected)) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.notEqual(recipe.status, 'executable');
  }
});

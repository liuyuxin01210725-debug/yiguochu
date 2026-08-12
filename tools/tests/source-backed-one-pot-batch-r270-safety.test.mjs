import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

const expected = {
  'tiger-seafood-pilaf': [
    ['seafood_fully_cooked', 63, 'S-SAFETY-SEAFOOD-GENERAL-CDC-1'],
  ],
  'tiger-usa-chinese-rice-bowl': [
    ['seafood_fully_cooked', 63, 'S-SAFETY-SEAFOOD-GENERAL-CDC-1'],
    ['pork_fully_cooked', 74, 'S-SAFETY-TEMPERATURES-1'],
  ],
};

test('r270 closes directly evidenced Tiger seafood and pork endpoints', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  for (const [recipeId, endpointFacts] of Object.entries(expected)) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked');
    assert.deepEqual(recipe.safety_endpoints.map(item => [item.code, item.minimum_core_temperature_c ?? null]), endpointFacts.map(([code, temperature]) => [code, temperature]));
    for (const [code, temperature, sourceId] of endpointFacts) {
      const endpoint = recipe.safety_endpoints.find(item => item.code === code);
      assert.ok(endpoint, `${recipeId} ${code}`);
      assert.deepEqual(endpoint.source_ids, [sourceId]);
      assert.equal(endpoint.minimum_core_temperature_c ?? null, temperature);
      const source = recipe.source_refs.find(item => item.source_id === sourceId);
      assert.ok(source, `${recipeId} ${sourceId}`);
      assert.ok(source.url.startsWith('https://'));
      assert.equal(source.access_status, 'opened');
      assert.equal(source.evidence_tier, 1);
      assert.deepEqual(source.claim_scopes, ['safety']);
    }
  }
});

test('r270 preserves Tiger rice-cooker and Tacook boundaries without promotion', () => {
  for (const recipeId of Object.keys(expected)) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe.cooker_adaptation.status, 'source_limited');
    assert.notEqual(recipe.status, 'executable');
  }
});

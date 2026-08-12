import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

const expected = {
  'maff-fukushima-hokki-meshi': ['shellfish_fully_cooked', null, 'S-SAFETY-TEMPERATURES-1'],
  'maff-tottori-igai-meshi': ['shellfish_fully_cooked', null, 'S-SAFETY-TEMPERATURES-1'],
  'maff-ehime-taimeshi': ['seafood_fully_cooked', 63, 'S-SAFETY-SEAFOOD-GENERAL-CDC-1'],
};

test('r267 closes three directly evidenced MAFF seafood endpoints', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  for (const [recipeId, [code, temperature, sourceId]] of Object.entries(expected)) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked');
    assert.deepEqual(recipe.safety_endpoints.map(item => [item.code, item.minimum_core_temperature_c ?? null]), [[code, temperature]]);
    const endpoint = recipe.safety_endpoints[0];
    assert.deepEqual(endpoint.source_ids, [sourceId]);
    const source = recipe.source_refs.find(item => item.source_id === sourceId);
    assert.ok(source, `${recipeId} safety source`);
    assert.ok(source.url.startsWith('https://'));
    assert.equal(source.access_status, 'opened');
    assert.equal(source.evidence_tier, 1);
    assert.deepEqual(source.claim_scopes, ['safety']);
  }
});

test('r267 preserves the MAFF source appliance and does not promote entries', () => {
  for (const recipeId of Object.keys(expected)) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
    assert.notEqual(recipe.status, 'executable');
  }
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

const expected = {
  'maff-air-buri-daikon-daikon-meshi': { minutes: 30, sourceId: 'S-MAFF-AIR-BURI-DAIKON-R62' },
  'iris-hijiki-tuna-mixed-rice': { minutes: 55, sourceId: 'S-IRIS-HIJIKI-TUNA-MIXED-RICE-1' },
  'iris-cooking-kettle-saba-canned-rice': { minutes: 45, sourceId: 'S-IRIS-SABA-CANNED-RICE-1' },
  'iris-chinese-chicken-congee': { minutes: 65, sourceId: 'S-IRIS-CHINESE-CHICKEN-CONGEE-1' },
  'iris-rc-pga-paella': { minutes: 75, sourceId: 'S-IRIS-RC-PGA-PAELLA-1' },
  'iris-rc-pga-chicken-rice': { minutes: 75, sourceId: 'S-IRIS-RC-PGA-CHICKEN-RICE-1' },
  'tiger-brown-rice-curry-pilaf': { minutes: 90, sourceId: 'S-TIGER-BROWN-RICE-CURRY-PILAF-1' },
};

test('r162 closes seven exact source-backed time contracts without changing recipe scope', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r197');
  assert.equal(catalog.recipes.length, 923);
  for (const [recipeId, expectedTime] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.equal(recipe.time_contract?.total_minutes, expectedTime.minutes, recipeId);
    assert.deepEqual(recipe.time_contract?.source_ids, [expectedTime.sourceId], recipeId);
    const source = recipe.source_refs.find(row => row.source_id === expectedTime.sourceId);
    assert.ok(source, `${recipeId} missing source`);
    assert.ok(source.claim_scopes.includes('time'), `${recipeId} source lacks time scope`);
  }
});

test('r162 does not infer total time from preparation ranges or staged boundaries', () => {
  assert.equal(byId['tiger-usa-asparagus-mushroom-risotto']?.time_contract, null);
  assert.equal(byId['maff-oita-torimeshi']?.time_contract, null);
  assert.equal(byId['maff-mie-chagayu']?.time_contract, null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalog = JSON.parse(fs.readFileSync('tools/data/source-backed-one-pot-recipes.v1.json', 'utf8'));

function recipe(id) {
  return catalog.recipes.find((row) => row.recipe_id === id);
}

test('r280 closes Tiger hamo rice fish safety with the controlled 63C endpoint', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  const row = recipe('tiger-hamo-rice');
  assert.equal(row.status, 'recipe_fact_checked');
  assert.deepEqual(row.safety_endpoints, [{
    code: 'seafood_fully_cooked',
    minimum_core_temperature_c: 63,
    source_ids: ['S-SAFETY-TEMPERATURES-1']
  }]);
  assert.ok(row.source_refs.some((source) => source.source_id === 'S-SAFETY-TEMPERATURES-1'));
});

test('r280 closes Macau fishball porridge with fish safety only', () => {
  const row = recipe('macau-lettuce-fishball-porridge');
  assert.equal(row.status, 'recipe_fact_checked');
  assert.deepEqual(row.safety_endpoints, [{
    code: 'seafood_fully_cooked',
    minimum_core_temperature_c: 63,
    source_ids: ['S-SAFETY-TEMPERATURES-1']
  }]);
  assert.ok(row.source_refs.some((source) => source.source_id === 'S-SAFETY-TEMPERATURES-1'));
  assert.equal(row.cooker_adaptation.status, 'not_adapted');
});

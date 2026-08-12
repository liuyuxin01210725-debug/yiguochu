import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalog = JSON.parse(fs.readFileSync('tools/data/source-backed-one-pot-recipes.v1.json', 'utf8'));

test('r285 closes two explicitly boiled chicken records with the controlled poultry endpoint', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  for (const recipeId of ['maff-kagoshima-keihan', 'nu-zu-rou-ban-fan']) {
    const row = catalog.recipes.find((recipe) => recipe.recipe_id === recipeId);
    assert.equal(row.status, 'recipe_fact_checked');
    assert.deepEqual(row.safety_endpoints, [{
      code: 'poultry_fully_cooked',
      minimum_core_temperature_c: 74,
      source_ids: ['S-SAFETY-TEMPERATURES-1']
    }], recipeId);
    assert.ok(row.source_refs.some((source) => source.source_id === 'S-SAFETY-TEMPERATURES-1'), recipeId);
  }
});

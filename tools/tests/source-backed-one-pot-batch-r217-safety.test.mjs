import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

test('r217 closes the fish endpoint for the ASMI rice-cooker salmon meal', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r224');
  const recipe = byId['asmi-pink-salmon-rice-bowls'];
  assert.equal(recipe.safety_endpoints[0].code, 'seafood_fully_cooked');
  assert.equal(recipe.safety_endpoints[0].minimum_core_temperature_c, 63);
  assert.deepEqual(recipe.safety_endpoints[0].source_ids, ['S-SAFETY-TEMPERATURES-1']);
});

test('r217 closes the poultry endpoint for Tiger chicken meatballs', () => {
  const recipe = byId['tiger-chicken-meatballs-grated-daikon'];
  assert.equal(recipe.safety_endpoints[0].code, 'poultry_fully_cooked');
  assert.equal(recipe.safety_endpoints[0].minimum_core_temperature_c, 74);
  assert.deepEqual(recipe.safety_endpoints[0].source_ids, ['S-SAFETY-TEMPERATURES-1']);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

const TARGETS = [
  ['cookpot-taro-chestnut-pork-rice', 'pork_fully_cooked', 74],
  ['maff-okinawa-yafara-jushi', 'pork_fully_cooked', 74],
  ['maff-chiba-gonjuu', 'pork_fully_cooked', 74],
  ['tiger-chinese-sticky-rice-post-fry', 'pork_fully_cooked', 74],
];

test('r294 closes four source-explicit pork safety endpoints without adding recipes', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  for (const [recipeId, code, temperature] of TARGETS) {
    const recipe = byId[recipeId];
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked');
    assert.deepEqual(recipe.safety_endpoints, [{
      code,
      minimum_core_temperature_c: temperature,
      source_ids: ['S-SAFETY-TEMPERATURES-1'],
    }]);
    assert.ok(recipe.source_refs.some(source => source.source_id === 'S-SAFETY-TEMPERATURES-1'));
  }
});

test('r294 keeps cooker and staged boundaries unchanged', () => {
  assert.equal(byId['cookpot-taro-chestnut-pork-rice'].cooker_adaptation.status, 'source_limited');
  assert.equal(byId['maff-okinawa-yafara-jushi'].cooker_adaptation.status, 'not_adapted');
  assert.equal(byId['maff-chiba-gonjuu'].cooker_adaptation.status, 'not_adapted');
  assert.equal(byId['tiger-chinese-sticky-rice-post-fry'].cooker_adaptation.status, 'not_adapted');
});

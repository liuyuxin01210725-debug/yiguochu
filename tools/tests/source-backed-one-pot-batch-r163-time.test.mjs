import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

const expected = {
  'maff-tokushima-omiisan': { minutes: 30, sourceId: 'S-MAFF-TOKUSHIMA-OMIISAN-1' },
  'panasonic-brown-rice-soybean-rice-nf-pc400': { minutes: 80, sourceId: 'S-R67-PANASONIC-BROWN-SOY' },
  'tiger-cheese-curry-pilaf': { minutes: 45, sourceId: 'S-R69-TIGER-CHEESE-CURRY-PILAF' },
  'philips-soy-milk-chicken-congee': { minutes: 35, sourceId: 'S-PHILIPS-SOY-MILK-CHICKEN-CONGEE-1' },
};

test('r163 closes four exact official time contracts without changing recipe scope', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r236');
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

test('r163 leaves ranged, staged, and preparation-only times unresolved', () => {
  assert.equal(byId['zojirushi-minced-pork-greens-rice-nl-erh']?.time_contract, null);
  assert.equal(byId['maff-tokushima-sobagome-zosui']?.time_contract, null);
  assert.equal(byId['startsmart-corn-lean-pork-porridge']?.time_contract, null);
  assert.equal(byId['tiger-usa-asparagus-mushroom-risotto']?.time_contract, null);
});

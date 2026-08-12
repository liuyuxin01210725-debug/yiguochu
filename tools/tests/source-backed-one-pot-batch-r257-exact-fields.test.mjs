import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

test('r257 closes four same-source liquid and time fields without adding recipes', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);

  const fehd = byId.get('fehd-cheese-asparagus-seafood-rice');
  assert.deepEqual(fehd.liquid_contract, {
    kind: 'added_water',
    amount: { value: 0.8, unit: '杯水' },
    source_ids: ['S-FEHD-CHEESE-ASPARAGUS-SEAFOOD-1'],
  });
  assert.equal(fehd.fixed_batch, null);
  assert.equal(fehd.time_contract, null);

  const mushroom = byId.get('panasonic-taiwan-mushroom-risotto');
  assert.deepEqual(mushroom.time_contract, {
    total_minutes: 56,
    source_ids: ['S-PANASONIC-MUSHROOM-RISOTTO-1'],
  });
  assert.equal(mushroom.liquid_contract.amount.value, 3);

  const chestnut = byId.get('panasonic-taiwan-chestnut-rice-steam-oven');
  assert.deepEqual(chestnut.liquid_contract, {
    kind: 'added_water',
    amount: { value: 200, unit: 'cc' },
    source_ids: ['S-PANASONIC-TAIWAN-CHESTNUT-RICE-1'],
  });
  assert.deepEqual(chestnut.time_contract, {
    total_minutes: 20,
    source_ids: ['S-PANASONIC-TAIWAN-CHESTNUT-RICE-1'],
  });
});

test('r257 preserves source-specific boundaries and does not promote these records', () => {
  for (const recipeId of [
    'fehd-cheese-asparagus-seafood-rice',
    'panasonic-taiwan-mushroom-risotto',
    'panasonic-taiwan-chestnut-rice-steam-oven',
  ]) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
    assert.ok(recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every((source) => source.access_status === 'opened'), recipeId);
  }
  assert.equal(byId.get('fehd-cheese-asparagus-seafood-rice').safety_endpoints.length, 0);
  assert.equal(byId.get('panasonic-taiwan-chestnut-rice-steam-oven').cooker_adaptation.status, 'source_limited');
});

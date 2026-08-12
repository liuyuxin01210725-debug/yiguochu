import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

const expected = new Map([
  ['startsmart-corn-lean-pork-porridge', 30],
  ['maff-hokkaido-ikameshi', 30],
  ['instant-pot-one-pot-chicken-brown-rice', 45],
  ['instant-pot-easy-chicken-rice', 25],
  ['instant-pot-chicken-rice-soup', 20],
  ['tefal-602-chicken-pea-risotto', 28],
  ['tefal-602-smoked-haddock-kedgeree', 28],
]);

test('r316 writes only single-valued official cooking durations', () => {
  for (const [recipeId, minutes] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.ok(recipe, `${recipeId} exists`);
    assert.equal(recipe.time_contract?.total_minutes, minutes, `${recipeId} time`);
    assert.equal(recipe.time_contract?.source_ids?.length, 1, `${recipeId} source binding`);
    const source = recipe.source_refs.find(item => item.source_id === recipe.time_contract.source_ids[0]);
    assert.ok(source, `${recipeId} time source exists`);
    assert.ok(source.claim_scopes.includes('time'), `${recipeId} source supports time`);
  }
});

test('r316 leaves source time ranges uncompressed', () => {
  for (const recipeId of ['instant-pot-quick-chicken-steamed-rice', 'maff-mie-chagayu', 'uconn-crock-pot-enchilada-rice']) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.ok(recipe, `${recipeId} exists`);
    assert.equal(recipe.time_contract, null, `${recipeId} retains range/phase boundary`);
  }
});

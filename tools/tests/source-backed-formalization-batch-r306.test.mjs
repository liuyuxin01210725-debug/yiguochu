import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const evidence = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-ratio-evidence.v1.json', import.meta.url), 'utf8'));
const review = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-candidate-review.v1.json', import.meta.url), 'utf8'));

const IDS = [
  'tatung-tarako-kamameshi',
  'tatung-kumamoto-ebimeshi',
  'tatung-hijiki-umeboshi-rice',
  'tatung-tomato-pumpkin-rice',
  'tatung-seafood-porridge',
  'tatung-tuna-garlic-butter-rice',
  'startsmart-corn-lean-pork-porridge',
  'r58-sharp-matsusaka-pork-mushroom-rice',
  'r58-cookpot-salmon-milk-brown-rice-risotto',
  'r58-cookpot-corn-rice-beef-meatballs',
  'r60-tiger-basic-chicken-congee',
  'r60-tiger-takeout-vegetable-fried-rice',
  'taiwan-brown-rice-sishen-porridge',
  'r61-tiger-dried-shrimp-salted-kelp-brown-rice',
  'r61-tiger-chestnut-brown-rice',
  'r61-tiger-multigrain-medicinal-porridge',
  'r61-tiger-red-can-curry-pilaf',
  'r61-tiger-easy-khao-man-gai',
  'r61-tiger-broad-bean-rice',
  'tiger-post-196-gomoku-rice',
];

test('r306 adds twenty more source-complete fixed-batch contracts without activation', () => {
  const entries = new Map(evidence.entries.map(entry => [entry.recipe_id, entry]));
  for (const recipeId of IDS) {
    const entry = entries.get(recipeId);
    assert.ok(entry, recipeId);
    assert.equal(entry.compile_status, 'source_bounded_non_executable', recipeId);
    assert.equal(entry.executable, false, recipeId);
    assert.equal(entry.source_bounded_contract?.scaling, 'fixed_batch_only', recipeId);
    assert.equal(entry.source_bounded_contract?.cross_appliance_conversion, false, recipeId);
    assert.ok(entry.source_contract_snapshot?.fixed_batch, recipeId);
    assert.ok(entry.source_contract_snapshot?.liquid_contract, recipeId);
    assert.ok(entry.source_contract_snapshot?.cooking_sequence?.length, recipeId);
    assert.ok(entry.source_contract_snapshot?.time_contract, recipeId);
  }
  assert.equal(evidence.counts.source_bounded_non_executable, evidence.counts.total);
});

test('r306 preserves formal blockers for fixed-batch evidence', () => {
  const byId = new Map(review.records.map(record => [record.recipe_id, record]));
  for (const recipeId of IDS) {
    const record = byId.get(recipeId);
    assert.ok(record, recipeId);
    assert.equal(record.ratio_dsl.status, 'source_bounded', recipeId);
    assert.ok(record.blocker_codes.includes('ratio_dsl'), recipeId);
    assert.ok(record.blocker_codes.includes('cooker_boundary'), recipeId);
    assert.ok(record.blocker_codes.includes('kitchen_observed'), recipeId);
    assert.ok(record.blocker_codes.includes('journey_coverage'), recipeId);
  }
  assert.equal(review.counts.formal_ready, 0);
});

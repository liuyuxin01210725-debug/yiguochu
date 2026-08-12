import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const evidence = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-ratio-evidence.v1.json', import.meta.url), 'utf8'));
const review = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-candidate-review.v1.json', import.meta.url), 'utf8'));

const IDS = [
  'zojirushi-okayama-ebimeshi-el-ns23',
  'tatung-oyster-mountain-vegetable-rice',
  'tatung-paella-style-seafood-rice',
  'tatung-nasi-goreng-style-rice',
  'tiger-chicken-bamboo-rice',
];

test('r298 marks the fifth five exact source contracts as bounded but non-executable', () => {
  const entries = new Map(evidence.entries.map(entry => [entry.recipe_id, entry]));
  for (const recipeId of IDS) {
    const entry = entries.get(recipeId);
    assert.ok(entry, recipeId);
    assert.equal(entry.compile_status, 'source_bounded_non_executable', recipeId);
    assert.equal(entry.executable, false, recipeId);
    assert.equal(entry.source_bounded_contract?.scaling, 'fixed_batch_only', recipeId);
    assert.equal(entry.source_bounded_contract?.cross_appliance_conversion, false, recipeId);
  }
  assert.ok(evidence.counts.source_bounded_non_executable >= 25);
});

test('r298 retains seafood and Tiger appliance boundaries while keeping Planner blockers', () => {
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
  assert.ok(review.counts.ratio_dsl.source_bounded >= 25);
  assert.equal(review.counts.formal_ready, 0);
});

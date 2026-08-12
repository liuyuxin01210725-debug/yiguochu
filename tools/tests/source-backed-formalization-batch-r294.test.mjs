import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const evidence = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-ratio-evidence.v1.json', import.meta.url), 'utf8'));
const review = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-candidate-review.v1.json', import.meta.url), 'utf8'));

const IDS = [
  'tatung-beef-burdock-takikomi-rice',
  'tiger-pork-bamboo-rice',
  'tatung-pork-daikon-rice',
  'tatung-wakayama-ginger-rice',
  'sichuan-rice-cooker-pork-ribs-rice',
];

test('r294 marks the first five exact source contracts as bounded but non-executable', () => {
  const entries = new Map(evidence.entries.map(entry => [entry.recipe_id, entry]));
  for (const recipeId of IDS) {
    const entry = entries.get(recipeId);
    assert.ok(entry, recipeId);
    assert.equal(entry.compile_status, 'source_bounded_non_executable', recipeId);
    assert.equal(entry.executable, false, recipeId);
    assert.equal(entry.source_bounded_contract?.scaling, 'fixed_batch_only', recipeId);
    assert.equal(entry.source_bounded_contract?.cross_appliance_conversion, false, recipeId);
    assert.ok(entry.source_bounded_contract?.fixed_batch, recipeId);
    assert.ok(entry.source_bounded_contract?.liquid_contract, recipeId);
    assert.ok(entry.source_bounded_contract?.cooking_sequence?.length, recipeId);
  }
  assert.ok(evidence.counts.source_bounded_non_executable >= 5);
  assert.equal(evidence.counts.candidate_evidence_only + evidence.counts.source_bounded_non_executable, evidence.counts.total);
});

test('r294 keeps source-bounded contracts out of formal Planner readiness', () => {
  const byId = new Map(review.records.map(record => [record.recipe_id, record]));
  for (const recipeId of IDS) {
    const record = byId.get(recipeId);
    assert.ok(record, recipeId);
    assert.equal(record.ratio_dsl.status, 'source_bounded', recipeId);
    assert.ok(record.blocker_codes.includes('ratio_dsl'), recipeId);
    assert.equal(record.kitchen_observed.status, 'pending', recipeId);
    assert.equal(record.journey_coverage.status, 'pending', recipeId);
  }
  assert.ok(review.counts.ratio_dsl.source_bounded >= 5);
  assert.equal(review.counts.formal_ready, 0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const evidence = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-ratio-evidence.v1.json', import.meta.url), 'utf8'));
const review = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-candidate-review.v1.json', import.meta.url), 'utf8'));

const IDS = [
  'kidney-care-chicken-tikka-pulao',
  'firststeps-turkey-vegetable-pilaf',
  'au-slhd-oven-baked-biryani',
];

test('r304 closes the final three exact source contracts in the explicit ratio-evidence set', () => {
  const entries = new Map(evidence.entries.map(entry => [entry.recipe_id, entry]));
  for (const recipeId of IDS) {
    const entry = entries.get(recipeId);
    assert.ok(entry, recipeId);
    assert.equal(entry.compile_status, 'source_bounded_non_executable', recipeId);
    assert.equal(entry.executable, false, recipeId);
    assert.equal(entry.source_bounded_contract?.scaling, 'fixed_batch_only', recipeId);
    assert.equal(entry.source_bounded_contract?.cross_appliance_conversion, false, recipeId);
  }
  assert.equal(evidence.counts.source_bounded_non_executable, evidence.counts.total);
  assert.equal(evidence.counts.candidate_evidence_only, 0);
});

test('r304 keeps staged and oven boundaries visible and does not activate Planner', () => {
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
  assert.equal(review.counts.ratio_dsl.source_bounded, evidence.counts.total);
  assert.equal(review.counts.formal_ready, 0);
});

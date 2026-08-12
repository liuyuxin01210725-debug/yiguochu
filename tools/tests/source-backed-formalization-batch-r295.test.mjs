import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const evidence = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-ratio-evidence.v1.json', import.meta.url), 'utf8'));
const review = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-candidate-review.v1.json', import.meta.url), 'utf8'));

const IDS = [
  'philips-cantonese-cured-rice',
  'shanghai-salted-pork-vegetable-rice',
  'toshiba-mixed-chicken-bamboo-rice-rc-dr18t',
  'panasonic-nf-pc400-takikomi-rice',
  'panasonic-khao-man-gai-nf-ac1000',
];

test('r295 marks the second five exact source contracts as bounded but non-executable', () => {
  const entries = new Map(evidence.entries.map(entry => [entry.recipe_id, entry]));
  for (const recipeId of IDS) {
    const entry = entries.get(recipeId);
    assert.ok(entry, recipeId);
    assert.equal(entry.compile_status, 'source_bounded_non_executable', recipeId);
    assert.equal(entry.executable, false, recipeId);
    assert.equal(entry.source_bounded_contract?.scaling, 'fixed_batch_only', recipeId);
    assert.equal(entry.source_bounded_contract?.cross_appliance_conversion, false, recipeId);
  }
  assert.ok(evidence.counts.source_bounded_non_executable >= 10);
});

test('r295 keeps machine and staged boundaries visible while retaining formal blockers', () => {
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
  assert.ok(review.counts.ratio_dsl.source_bounded >= 10);
  assert.equal(review.counts.formal_ready, 0);
});

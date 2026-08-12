import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const evidence = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-ratio-evidence.v1.json', import.meta.url), 'utf8'));
const review = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-candidate-review.v1.json', import.meta.url), 'utf8'));

const IDS = [
  'cantonese-cured-meat-claypot-rice',
  'tiger-shirasu-tomato-multigrain-rice',
  'tiger-mackerel-aromatic-barley-rice',
  'tiger-hamo-rice',
  'cuckoo-abalone-pot-rice',
  'instant-pot-spinach-chickpea-rice',
  'toshiba-mixed-mushroom-ume-rice',
  'toshiba-seafood-paella-rice',
  'toshiba-sakuraebi-rice',
  'toshiba-sekihan-rcp30r',
  'toshiba-kuri-okowa',
  'panasonic-sekihan-nf-ac1000',
  'tiger-beef-matsutake-rice',
  'tiger-steamed-abalone-rice',
  'toshiba-chinese-sticky-rice-rcp30r',
  'tiger-oyster-mushroom-rice',
  'maff-aomori-goma-gohan',
  'zojirushi-corn-risotto',
  'zojirushi-turkish-risotto',
  'tatung-yugao-sakuraebi-rice',
];

test('r305 adds twenty source-complete fixed-batch contracts without activating Planner', () => {
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

test('r305 keeps source-complete records blocked on formal Planner gates', () => {
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

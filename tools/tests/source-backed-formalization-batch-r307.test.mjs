import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const evidence = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-ratio-evidence.v1.json', import.meta.url), 'utf8'));
const review = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-candidate-review.v1.json', import.meta.url), 'utf8'));

const IDS = [
  'tiger-brown-rice-curry-pilaf',
  'maff-tokushima-omiisan',
  'philips-soy-milk-chicken-congee',
  'toshiba-steamed-sekihan-edion-rice-cooker',
  'panasonic-brown-rice-soybean-rice-nf-pc400',
  'tefal-risotto-milanese',
  'tefal-saffron-rice-seafood',
  'tiger-cheese-curry-pilaf',
  'tiger-hotaruika-rice',
  'tefal-homechef-mushroom-risotto',
  'zojirushi-kasuyose-el-mb30',
  'panasonic-nara-chagayu-nf-ac1000',
  'panasonic-bamboo-brown-rice-nf-pc400',
  'panasonic-chinese-sticky-rice-nf-pc400',
  'tefal-risotto-with-peas-r106322',
  'tefal-risotto-with-shrimps-r106225',
  'tefal-602-chicken-pea-risotto',
  'tefal-602-smoked-haddock-kedgeree',
  'tiger-crab-miso-rice-post6',
  'tiger-canned-curry-takikomi-pilaf',
];

test('r307 adds twenty source-complete fixed-batch contracts without activation', () => {
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

test('r307 preserves formal blockers for fixed-batch evidence', () => {
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

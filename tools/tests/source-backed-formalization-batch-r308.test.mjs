import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const evidence = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-ratio-evidence.v1.json', import.meta.url), 'utf8'));
const review = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-candidate-review.v1.json', import.meta.url), 'utf8'));

const IDS = [
  'tiger-seafood-paella-post118',
  'philips-corn-quinoa-vegetable-rice',
  'tefal-portuguese-rice-r106506',
  'tiger-usa-century-egg-fish-porridge',
  'panasonic-autocooker-seasoned-rice-kit',
  'instant-pot-easy-chicken-rice',
  'instant-pot-chicken-rice-soup',
  'instant-pot-chicken-satay-rice',
  'instant-pot-chicken-enchilada-rice',
  'instant-pot-spanish-chicken-rice',
  'global-greece-mushroom-mageiritsa',
  'qld-one-pot-beans-rice',
  'rda-korea-naengi-panbap',
  'unh-spanish-rice',
  'sdsu-easy-red-beans-rice',
  'urochester-smoky-hoppin-john',
  'firststeps-vegetable-biryani',
  'healthvermont-spinach-carrot-rice-pilaf',
  'ca-health-multigrain-congee',
];

test('r308 closes the remaining source-complete fixed-batch contracts', () => {
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

test('r308 leaves kitchen, journey and Planner activation gates explicit', () => {
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

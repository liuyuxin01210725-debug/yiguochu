import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  buildSourceBackedFormalStaging,
  validateSourceBackedFormalStaging,
} from '../lib/source-backed-formal-staging.mjs';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const review = JSON.parse(readFileSync(new URL('../data/source-backed-formal-candidate-review.v1.json', import.meta.url), 'utf8'));
const staging = buildSourceBackedFormalStaging(catalog, review);

test('source-complete candidates enter a formal staging queue without becoming production recipes', () => {
  assert.equal(staging.source_catalog_version, catalog.catalog_version);
  assert.equal(staging.counts.total, 923);
  assert.equal(staging.counts.source_complete, 138);
  assert.equal(staging.counts.research_only, 785);
  assert.equal(staging.counts.formal_ready, 0);
  assert.equal(staging.counts.kitchen_pending, 923);
  assert.equal(staging.counts.journey_pending, 923);
  assert.equal(staging.records.length, 923);
  for (const record of staging.records) {
    assert.equal(record.promotion_status, 'not_formal');
    assert.equal(record.formal_planner_status, 'not_in_formal_72');
    assert.ok(record.blocker_codes.includes('ratio_dsl'), record.recipe_id);
    assert.ok(record.blocker_codes.includes('cooker_boundary'), record.recipe_id);
    assert.ok(record.blocker_codes.includes('kitchen_observed'), record.recipe_id);
    assert.ok(record.blocker_codes.includes('journey_coverage'), record.recipe_id);
    assert.ok(record.source_contract, record.recipe_id);
  }
  assert.equal(staging.records.filter(record => record.formal_candidate_status === 'source_complete_pending_formal').length, 138);
  assert.equal(staging.records.filter(record => record.formal_candidate_status === 'research_only').length, 785);
});

test('formal staging is deterministic and rejects a record marked formal', () => {
  assert.deepEqual(validateSourceBackedFormalStaging(staging, catalog, review), []);
  const tampered = structuredClone(staging);
  tampered.records[0].promotion_status = 'formal';
  assert.match(validateSourceBackedFormalStaging(tampered, catalog, review).join('\n'), /promotion_status/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildSourceBackedFormalCandidateReview,
  validateSourceBackedFormalCandidateReview,
} from '../lib/source-backed-formal-candidate-review.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const taxonomy = JSON.parse(fs.readFileSync(new URL('../data/ingredient-taxonomy.v1.json', import.meta.url), 'utf8'));
const ratioCatalog = JSON.parse(fs.readFileSync(new URL('../data/ratio-rules.v1.json', import.meta.url), 'utf8'));
const formalRatioEvidence = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-ratio-evidence.v1.json', import.meta.url), 'utf8'));

test('formal candidate review covers every source-backed recipe with explicit gate states', () => {
  const review = buildSourceBackedFormalCandidateReview(catalog, taxonomy, ratioCatalog, formalRatioEvidence);

  assert.equal(review.review_version, 'source-backed-formal-candidate-review-v1-20260812-r2');
  assert.equal(review.source_catalog_version, catalog.catalog_version);
  assert.equal(review.records.length, 923);
  assert.equal(review.counts.total, 923);
  assert.equal(review.counts.source_complete, 138);
  assert.equal(review.counts.research_only, 785);
  assert.ok(review.counts.taxonomy.missing > 0);
  assert.ok(review.counts.ratio_dsl.source_bounded >= 25);
  assert.equal(review.counts.ratio_dsl.source_bounded + review.counts.ratio_dsl.candidate_evidence_only + review.counts.ratio_dsl.unmapped, 923);
  assert.equal(review.counts.ratio_dsl.unmapped, 791);
  assert.ok(review.counts.safety.not_applicable > 0);
  assert.equal(review.counts.safety.closed + review.counts.safety.missing + review.counts.safety.not_applicable, 923);
  assert.equal(review.counts.kitchen_observed.pending, 923);
  assert.equal(review.counts.journey_coverage.pending, 923);

  const ids = new Set();
  for (const record of review.records) {
    assert.equal(ids.has(record.recipe_id), false, `duplicate review row ${record.recipe_id}`);
    ids.add(record.recipe_id);
    assert.ok(record.canonical_name);
    assert.ok(record.source_contract);
    assert.ok(Array.isArray(record.taxonomy_mapping.matched));
    assert.ok(Array.isArray(record.taxonomy_mapping.seasoning_ignored));
    assert.ok(Array.isArray(record.taxonomy_mapping.missing));
    assert.ok(['unmapped', 'candidate_evidence_only', 'source_bounded'].includes(record.ratio_dsl.status));
    assert.equal(record.kitchen_observed.status, 'pending');
    assert.equal(record.journey_coverage.status, 'pending');
    assert.ok(record.blocker_codes.includes('ratio_dsl'));
    assert.ok(record.blocker_codes.includes('kitchen_observed'));
    assert.ok(record.blocker_codes.includes('journey_coverage'));
    assert.ok(record.next_action.length > 0);
  }
});

test('review exposes a source-complete candidate without inventing taxonomy or ratio matches', () => {
  const review = buildSourceBackedFormalCandidateReview(catalog, taxonomy, ratioCatalog, formalRatioEvidence);
  const row = review.records.find(record => record.recipe_id === 'tiger-pork-bamboo-rice');

  assert.ok(row);
  assert.equal(row.formal_candidate_status, 'source_complete_pending_formal');
  assert.deepEqual(row.source_contract.required_fields, ['fixed_batch', 'liquid_contract', 'cooking_sequence', 'time_contract', 'safety_endpoints']);
  assert.equal(row.source_contract.missing_fields.length, 0);
  assert.ok(row.taxonomy_mapping.matched.some(item => item.canonical_id === 'raw-rice'));
  assert.ok(row.taxonomy_mapping.matched.some(item => item.canonical_id === 'pork-belly'));
  assert.ok(row.taxonomy_mapping.matched.some(item => item.source_label === '竹笋' && item.canonical_id === 'bamboo-shoot'));
  assert.deepEqual(row.ratio_dsl.candidate_rule_ids, [
    'source-tiger-pork-bamboo-rice-calibration-v1',
    'source-evidence-tiger-pork-bamboo-rice-v1',
  ]);
  assert.equal(row.ratio_dsl.status, 'source_bounded');
  assert.equal(row.safety.status, 'closed');
});

test('review validator rejects an incomplete review and accepts the generated artifact', () => {
  const review = buildSourceBackedFormalCandidateReview(catalog, taxonomy, ratioCatalog, formalRatioEvidence);
  assert.deepEqual(validateSourceBackedFormalCandidateReview(review, catalog, taxonomy, ratioCatalog, formalRatioEvidence), []);

  const broken = structuredClone(review);
  broken.records.pop();
  assert.match(validateSourceBackedFormalCandidateReview(broken, catalog, taxonomy, ratioCatalog, formalRatioEvidence).join('\n'), /must cover every source recipe/u);
});

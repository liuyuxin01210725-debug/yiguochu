import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildNortheastStewResearchReport,
  formatNortheastStewResearchSummary,
  validateNortheastStewResearchReport,
} from '../lib/northeast-stew-research-builder.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const assessment = readJson('../data/northeast-stew-research.v1.json');
const regionalAtlas = readJson('../data/regional-atlas.v2.json');
const regionalResearch = readJson('../data/regional-menu-research.v1.json');
const inputs = { assessment, regionalAtlas, regionalResearch };

test('report contains the regional and M1 readiness deliverables', () => {
  const report = buildNortheastStewResearchReport(inputs);
  assert.deepEqual(validateNortheastStewResearchReport(report), []);
  assert.equal(report.region_overview.region_id, 'northeast');
  assert.deepEqual(report.region_overview.province_codes, ['CN-LN', 'CN-JL', 'CN-HL']);
  assert.equal(report.prototype_candidates.length, 4);
  assert.equal(report.variant_relationships.length, 4);
  assert.equal(report.ingredient_coverage_matrix.length, 11);
  assert.equal(report.source_evidence_pack.length, 7);
  assert.equal(report.home_adaptation_boundaries.length, 7);
  assert.equal(report.product_destination_decisions.length, 4);
  assert.equal(report.machine_rule_readiness.length, 2);
  assert.equal(report.calibration_readiness.length, 3);
  assert.equal(report.capability_journey_cases.length, 22);
});

test('report separates supported family facts from unproven exact combinations', () => {
  const report = buildNortheastStewResearchReport(inputs);
  const chicken = report.prototype_candidates.find(row => row.atlas_id.includes('chicken'));
  assert.equal(chicken.exact_combination_status, 'not_proven');
  assert.equal(chicken.family_compatibility_status, 'supported');
  const sticky = report.prototype_candidates.find(row => row.atlas_id.endsWith('sticky-rolls'));
  assert.deepEqual(sticky.verified_geography.province_codes, ['CN-BJ']);
  assert.equal(sticky.northeast_identity_status, 'not_proven');
});

test('report keeps three staple forms and four safety branches separate', () => {
  const report = buildNortheastStewResearchReport(inputs);
  assert.deepEqual(report.family_model.staple_forms.map(row => row.form_id).sort(), [
    'corn_dough_cake', 'sticky_roll', 'wheat_flower_roll',
  ]);
  assert.deepEqual(report.family_model.safety_branches.map(row => row.branch_id).sort(), [
    'chicken', 'fish', 'green_beans', 'pork_ribs',
  ]);
});

test('source summary and prototype states are derived without promoting research', () => {
  const report = buildNortheastStewResearchReport(inputs);
  assert.deepEqual(report.summary.source_count_by_grade, { A: 6, B: 1, C: 0 });
  assert.equal(report.summary.fact_checked_count, 1);
  assert.equal(report.summary.needs_more_evidence_count, 3);
  assert.equal(report.summary.rejected_count, 0);
  assert.equal(report.summary.production_recipe_changes, 0);
});

test('initial northeast round remains in progress instead of claiming completion', () => {
  const report = buildNortheastStewResearchReport(inputs);
  assert.equal(report.completion_status.status, 'research_in_progress');
  assert.deepEqual(report.completion_status.blocking_gaps, [
    'prototype_evidence_incomplete',
    'ratio_evidence_incomplete',
    'safety_evidence_incomplete',
    'human_journey_review_incomplete',
    'machine_rule_candidates_blocked',
    'calibration_2_3_4_servings_incomplete',
  ]);
  assert.equal(report.summary.ratio_ready_form_count, 0);
  assert.equal(report.summary.safety_ready_branch_count, 0);
  assert.equal(report.summary.journey_reviewed_count, 0);
});

test('summary text is derived from the report facts', () => {
  const report = buildNortheastStewResearchReport(inputs);
  assert.equal(report.summary.journey_count, 10);
  assert.equal(
    formatNortheastStewResearchSummary(report),
    '4 prototypes · 7 sources · 10 regional journeys · 2 blocked machine rules · 0 active · 3 pending calibrations · 22 staged capability journeys · research_in_progress',
  );
});

test('report validator catches dishonest completion and malformed summaries', () => {
  const report = buildNortheastStewResearchReport(inputs);
  const broken = structuredClone(report);
  broken.completion_status.status = 'regional_round_complete';
  broken.completion_status.blocking_gaps = [];
  broken.summary.source_count = 99;
  const message = validateNortheastStewResearchReport(broken).join('\n');
  assert.match(message, /completion status cannot be complete while evidence or review is incomplete/);
  assert.match(message, /summary source_count expected 7, got 99/);
});

test('builder and report validator are total for malformed nested inputs', () => {
  assert.doesNotThrow(() => buildNortheastStewResearchReport({
    assessment: { prototypes: [null], source_refs: [null], family_model: null },
    regionalAtlas: null,
    regionalResearch: { entries: [null] },
  }));
  assert.deepEqual(validateNortheastStewResearchReport(null), ['report must be an object']);
});

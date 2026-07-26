import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildCentralPlainsNoodleResearchReport,
  formatCentralPlainsNoodleResearchSummary,
  validateCentralPlainsNoodleResearchReport,
} from '../lib/central-plains-noodle-research-builder.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const inputs = {
  assessment: readJson('../data/central-plains-noodle-research.v1.json'),
  recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'),
  regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

test('report contains the complete Central Plains audit package', () => {
  const report = buildCentralPlainsNoodleResearchReport(inputs);
  assert.deepEqual(validateCentralPlainsNoodleResearchReport(report), []);
  assert.equal(report.region_overview.region_id, 'central_plains');
  assert.deepEqual(report.region_overview.province_codes, ['CN-HA']);
  assert.equal(report.production_recipe_audits.length, 1);
  assert.equal(report.candidate_audits.length, 4);
  assert.equal(report.concrete_research_leads.length, 3);
  assert.equal(report.source_evidence.length, 8);
  assert.equal(report.household_journeys.length, 12);
});

test('report separates five cooking families instead of merging all noodles', () => {
  const report = buildCentralPlainsNoodleResearchReport(inputs);
  const ids = new Set(report.family_model.map(row => row.family_id));
  for (const id of [
    'noodle-braise', 'noodle-steam-braise', 'broth-pulled-noodle',
    'fermented-sour-noodle-bowl', 'grain-vegetable-thick-bowl',
  ]) assert.ok(ids.has(id), id);
  assert.equal(report.family_model.find(row => row.family_id === 'noodle-steam-braise').meal_structure, 'multi_stage_vessel');
  assert.equal(report.family_model.find(row => row.family_id === 'broth-pulled-noodle').meal_structure, 'broth_bowl');
});

test('production audit stays cross-regional while four Henan hypotheses remain visible', () => {
  const report = buildCentralPlainsNoodleResearchReport(inputs);
  assert.equal(report.production_recipe_audits[0].recipe_name, '北方豆角焖面');
  assert.equal(report.production_recipe_audits[0].regional_scope_decision, 'cross_regional_chinese');
  assert.deepEqual(report.production_recipe_audits[0].province_codes, []);
  assert.ok(report.candidate_audits.every(row => row.province_codes.includes('CN-HA')));
  assert.ok(report.candidate_audits.every(row => row.status === 'research_queue'));
});

test('ingredient matrix preserves cooking forms and does not flatten them to generic noodles', () => {
  const report = buildCentralPlainsNoodleResearchReport(inputs);
  const shapes = new Set(report.ingredient_shape_matrix.map(row => row.shape));
  for (const expected of [
    'fresh_noodle', 'presteamed_noodle', 'steamed_then_mixed_and_resteamed',
    'pulled_noodle', 'fermented_sour_liquid', 'ground_roasted_grain_powder',
  ]) assert.ok(shapes.has(expected), expected);
});

test('initial round remains research_in_progress with exact blockers', () => {
  const report = buildCentralPlainsNoodleResearchReport(inputs);
  assert.equal(report.completion.status, 'research_in_progress');
  assert.deepEqual(report.completion.blockers, [
    'province_specific_identity_gaps',
    'candidate_core_evidence_gaps',
    'vessel_process_equivalence_incomplete',
    'ratio_moisture_evidence_incomplete',
    'safety_endpoint_incomplete',
    'human_journey_review_incomplete',
  ]);
  assert.equal(report.summary.production_recipe_changes, 0);
  assert.equal(report.summary.human_journey_reviewed_count, 0);
});

test('summary is derived from report rows', () => {
  const report = buildCentralPlainsNoodleResearchReport(inputs);
  assert.deepEqual(report.summary.source_count_by_grade, { A: 6, B: 2, C: 0 });
  assert.equal(report.summary.production_audit_count, 1);
  assert.equal(report.summary.candidate_audit_count, 4);
  assert.equal(report.summary.concrete_research_lead_count, 3);
  assert.equal(report.summary.household_journey_count, 12);
  assert.equal(
    formatCentralPlainsNoodleResearchSummary(report),
    '1 Central Plains production audit · 4 candidates · 12 journeys · Central Plains research ok',
  );
});

test('report validator rejects dishonest completion and mismatched counts', () => {
  const broken = structuredClone(buildCentralPlainsNoodleResearchReport(inputs));
  broken.completion.status = 'regional_round_complete';
  broken.completion.blockers = [];
  broken.summary.source_count = 99;
  broken.region_overview.production_recipe_count = 2;
  const message = validateCentralPlainsNoodleResearchReport(broken).join('\n');
  assert.match(message, /completion cannot be complete while evidence or review is incomplete/);
  assert.match(message, /summary source_count expected 8, got 99/);
  assert.match(message, /region production_recipe_count expected 1, got 2/);
});

test('builder rejects invalid source input while report validator remains total', () => {
  const broken = structuredClone(inputs);
  broken.assessment.production_recipe_audits[0].regional_scope_decision = 'province_specific';
  assert.throws(() => buildCentralPlainsNoodleResearchReport(broken), /cross_regional_chinese/);
  assert.deepEqual(validateCentralPlainsNoodleResearchReport(null), ['report must be an object']);
});

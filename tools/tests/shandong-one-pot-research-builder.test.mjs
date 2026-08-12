import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildShandongOnePotResearchReport,
  formatShandongOnePotResearchSummary,
  validateShandongOnePotResearchReport,
} from '../lib/shandong-one-pot-research-builder.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const inputs = {
  assessment: readJson('../data/shandong-one-pot-research.v1.json'),
  recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'),
  regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

test('report contains the complete Shandong audit package', () => {
  const report = buildShandongOnePotResearchReport(inputs);
  assert.deepEqual(validateShandongOnePotResearchReport(report), []);
  assert.equal(report.region_overview.region_id, 'shandong');
  assert.deepEqual(report.region_overview.province_codes, ['CN-SD']);
  assert.equal(report.production_recipe_audits.length, 1);
  assert.equal(report.candidate_audits.length, 4);
  assert.equal(report.concrete_research_leads.length, 2);
  assert.equal(report.source_evidence.length, 9);
  assert.equal(report.household_journeys.length, 12);
});

test('report separates same-pot pot-plus-ready-staple and multi-process routes', () => {
  const report = buildShandongOnePotResearchReport(inputs);
  const ids = new Set(report.family_model.map(row => row.family_id));
  assert.ok(ids.has('noodle-braise'));
  assert.ok(ids.has('grain-soy-composite-bowl'));
  assert.ok(ids.has('seafood-noodle-broth'));
  assert.ok(ids.has('pot-plus-ready-staple'));
  assert.ok(ids.has('multi-process-pancake-meal'));
  assert.equal(report.family_model.find(row => row.family_id === 'pot-plus-ready-staple').meal_structure, 'pot_plus_ready_staple');
});

test('production audit stays cross-regional while the four Shandong hypotheses remain visible', () => {
  const report = buildShandongOnePotResearchReport(inputs);
  assert.equal(report.production_recipe_audits[0].recipe_name, '北方豆角焖面');
  assert.equal(report.production_recipe_audits[0].regional_scope_decision, 'cross_regional_chinese');
  assert.deepEqual(report.production_recipe_audits[0].province_codes, []);
  assert.ok(report.candidate_audits.every(row => row.province_codes.includes('CN-SD')));
  assert.ok(report.candidate_audits.every(row => row.status === 'research_queue'));
});

test('ingredient matrix keeps noodle and cornmeal shapes separate', () => {
  const report = buildShandongOnePotResearchReport(inputs);
  const shapes = new Set(report.ingredient_shape_matrix.map(row => row.shape));
  for (const expected of ['fresh_noodle_staple', 'dough_drop', 'sweet_potato_noodle', 'ready_pancake', 'cornmeal_batter', 'pot-edge-cake']) {
    assert.ok(shapes.has(expected), expected);
  }
});

test('initial round remains research_in_progress with exact blockers', () => {
  const report = buildShandongOnePotResearchReport(inputs);
  assert.equal(report.completion.status, 'research_in_progress');
  assert.deepEqual(report.completion.blockers, [
    'regional_identity_gaps',
    'candidate_specificity_gaps',
    'ratio_evidence_incomplete',
    'safety_endpoint_incomplete',
    'human_journey_review_incomplete',
  ]);
  assert.equal(report.summary.production_recipe_changes, 0);
  assert.equal(report.summary.human_journey_reviewed_count, 0);
});

test('summary is derived from report rows', () => {
  const report = buildShandongOnePotResearchReport(inputs);
  assert.deepEqual(report.summary.source_count_by_grade, { A: 9, B: 0, C: 0 });
  assert.equal(report.summary.production_audit_count, 1);
  assert.equal(report.summary.candidate_audit_count, 4);
  assert.equal(report.summary.concrete_research_lead_count, 2);
  assert.equal(report.summary.household_journey_count, 12);
  assert.equal(
    formatShandongOnePotResearchSummary(report),
    '1 Shandong production audit · 4 candidates · 12 journeys · Shandong research ok',
  );
});

test('report validator rejects dishonest completion and mismatched counts', () => {
  const broken = structuredClone(buildShandongOnePotResearchReport(inputs));
  broken.completion.status = 'regional_round_complete';
  broken.completion.blockers = [];
  broken.summary.source_count = 99;
  broken.region_overview.production_recipe_count = 2;
  const message = validateShandongOnePotResearchReport(broken).join('\n');
  assert.match(message, /completion cannot be complete while evidence or review is incomplete/);
  assert.match(message, /summary source_count expected 9, got 99/);
  assert.match(message, /region production_recipe_count expected 1, got 2/);
});

test('builder and report validator are total for malformed nested inputs', () => {
  assert.doesNotThrow(() => buildShandongOnePotResearchReport({
    assessment: { production_recipe_audits: [null], candidate_audits: [null], source_refs: [null], concrete_research_leads: [null], family_model: [null], journey_cases: [null] },
    recipeLibrary: { recipes: [null] }, regionalResearch: { entries: [null] }, regionalAtlas: null,
    regionalMappings: { production_recipe_mappings: [null], research_candidate_mappings: [null] },
  }));
  assert.deepEqual(validateShandongOnePotResearchReport(null), ['report must be an object']);
});

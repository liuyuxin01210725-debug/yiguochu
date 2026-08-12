import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildSichuanChongqingRiceResearchReport,
  formatSichuanChongqingRiceResearchSummary,
  validateSichuanChongqingRiceResearchReport,
} from '../lib/sichuan-chongqing-rice-research-builder.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const inputs = {
  assessment: readJson('../data/sichuan-chongqing-rice-research.v1.json'),
  recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'),
  regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

test('report derives zero production, four candidates, three leads and no runtime mutations', () => {
  const report = buildSichuanChongqingRiceResearchReport(inputs);
  assert.deepEqual(validateSichuanChongqingRiceResearchReport(report), []);
  assert.equal(report.region_overview.region_id, 'sichuan_chongqing');
  assert.deepEqual(report.region_overview.province_codes, ['CN-SC', 'CN-CQ']);
  assert.equal(report.production_recipe_audits.length, 0);
  assert.equal(report.candidate_audits.length, 4);
  assert.equal(report.concrete_research_leads.length, 3);
  assert.equal(report.source_evidence.length, 9);
  assert.equal(report.household_journeys.length, 12);
  assert.equal(report.summary.production_recipe_changes, 0);
  assert.equal(report.summary.regional_candidate_changes, 0);
});

test('claim matrix exposes regional presence separately from project equivalence', () => {
  const report = buildSichuanChongqingRiceResearchReport(inputs);
  const claims = new Map(report.claim_matrix.map(row => [`${row.subject_id}:${row.claim_id}`, row.verdict]));
  assert.equal(claims.get('chongqing-firewood-potato-rice-home:chongqing_potato_rice_identity'), 'supported');
  assert.equal(claims.get('chongqing-firewood-potato-rice-home:household_appliance_equivalence'), 'not_proven');
  assert.equal(claims.get('sichuan-bean-potato-rice:fixed_bean_potato_core'), 'not_proven');
  assert.equal(claims.get('sichuan-corn-potato-rice:fixed_corn_potato_core'), 'not_proven');
});

test('shape matrix makes rice states and ingredient forms inspectable', () => {
  const report = buildSichuanChongqingRiceResearchReport(inputs);
  const shapes = new Set(report.ingredient_shape_matrix.map(row => row.shape));
  for (const shape of ['raw_rice', 'parboiled_drained_rice', 'cornmeal', 'cured_pork_dice', 'wild_green_chopped']) {
    assert.ok(shapes.has(shape), shape);
  }
});

test('completion stays research in progress until ratios, appliance adaptation, safety and humans are resolved', () => {
  const report = buildSichuanChongqingRiceResearchReport(inputs);
  assert.equal(report.completion.status, 'research_in_progress');
  assert.deepEqual(report.completion.blockers, [
    'candidate_specificity_gaps',
    'rice_state_ratio_unresolved',
    'household_appliance_adaptation_unresolved',
    'safety_endpoint_incomplete',
    'human_journey_review_incomplete',
  ]);
  assert.equal(report.summary.human_journey_reviewed_count, 0);
});

test('summary is derived from report rows', () => {
  const report = buildSichuanChongqingRiceResearchReport(inputs);
  assert.deepEqual(report.summary.source_count_by_grade, { A: 8, B: 1, C: 0 });
  assert.equal(
    formatSichuanChongqingRiceResearchSummary(report),
    '0 Sichuan-Chongqing production audits · 4 candidates · 3 research leads · 12 journeys · Sichuan-Chongqing research ok',
  );
});

test('report validator rejects dishonest completion and mismatched counts', () => {
  const broken = structuredClone(buildSichuanChongqingRiceResearchReport(inputs));
  broken.completion.status = 'regional_round_complete';
  broken.completion.blockers = [];
  broken.summary.source_count = 99;
  broken.region_overview.candidate_count = 3;
  const message = validateSichuanChongqingRiceResearchReport(broken).join('\n');
  assert.match(message, /completion cannot be complete/);
  assert.match(message, /summary source_count expected 9, got 99/);
  assert.match(message, /region candidate_count expected 4, got 3/);
});

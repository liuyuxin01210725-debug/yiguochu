import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildNorthwestOnePotResearchReport,
  formatNorthwestOnePotResearchSummary,
  validateNorthwestOnePotResearchReport,
} from '../lib/northwest-one-pot-research-builder.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const inputs = {
  assessment: readJson('../data/northwest-one-pot-research.v1.json'),
  recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'),
  regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

test('report derives the fixed Northwest 3/0/8 baseline without adding recipes or candidates', () => {
  const report = buildNorthwestOnePotResearchReport(inputs);

  assert.deepEqual(validateNorthwestOnePotResearchReport(report), []);
  assert.equal(report.region_overview.region_id, 'northwest');
  assert.deepEqual(report.region_overview.province_codes, ['CN-SN', 'CN-GS', 'CN-NX', 'CN-XJ']);
  assert.equal(report.production_recipe_audits.length, 3);
  assert.equal(report.candidate_audits.length, 0);
  assert.equal(report.concrete_research_leads.length, 8);
  assert.equal(report.source_evidence.length, 25);
  assert.deepEqual(report.summary.source_count_by_grade, { A: 20, B: 4, C: 1 });
  assert.equal(report.household_journeys.length, 16);
  assert.equal(report.summary.production_recipe_changes, 0);
  assert.equal(report.summary.regional_candidate_changes, 0);
  assert.match(report.summary.scope_note, /不新增.*recipe.*candidate/i);
});

test('claim matrix keeps regional identity, ingredient shape, household adaptation, machine ratios and safety endpoints separate', () => {
  const report = buildNorthwestOnePotResearchReport(inputs);
  const claims = new Map(report.claim_matrix.map(row => [`${row.subject_id}:${row.claim_id}`, row]));

  assert.equal(claims.get('shaanbei-red-date-cowpea-rice:soft_grain_date_bean_identity').verdict, 'supported');
  assert.equal(claims.get('gansu-heyan-jiumianpian-broth:heyan_ich_identity').evidence_direction, 'proves');
  assert.equal(claims.get('xinjiang-lamb-pilaf:staged_lamb_carrot_onion_rice_structure').verdict, 'supported');
  assert.equal(claims.get('shaanbei-red-date-cowpea-rice:ordinary_rice_adaptation').verdict, 'not_proven');
  assert.equal(claims.get('xinjiang-vegetable-pilaf:current_formula_equivalence').evidence_direction, 'does_not_prove');
  assert.equal(claims.get('shaanbei-red-date-cowpea-rice:project_ratio_time_vessel').verdict, 'not_proven');
  assert.equal(claims.get('huaining-mixed-grain-jiaotuan:unattended_appliance_equivalence').verdict, 'not_proven');
  assert.equal(claims.get('ningxia-shengcuan-jiumian-bowl:meat_under_cooking').verdict, 'not_proven');
  assert.equal(report.safety_boundaries.find(row => row.safety_id === 'animal_food_cook_through_and_separate').evidence_status, 'principle_only');
});

test('province coverage preserves each province ownership and its two research leads', () => {
  const report = buildNorthwestOnePotResearchReport(inputs);
  const coverage = new Map(report.province_coverage_audits.map(row => [row.province_code, row]));

  assert.deepEqual(coverage.get('CN-SN').production_recipe_ids, ['shaanbei-red-date-cowpea-rice']);
  assert.deepEqual(coverage.get('CN-GS').production_recipe_ids, []);
  assert.deepEqual(coverage.get('CN-NX').production_recipe_ids, []);
  assert.deepEqual(coverage.get('CN-XJ').production_recipe_ids, ['xinjiang-lamb-pilaf', 'xinjiang-vegetable-pilaf']);
  assert.equal(coverage.get('CN-SN').lead_ids.length, 2);
  assert.equal(coverage.get('CN-GS').lead_ids.length, 2);
  assert.equal(coverage.get('CN-NX').lead_ids.length, 2);
  assert.equal(coverage.get('CN-XJ').lead_ids.length, 2);
});

test('completion remains research in progress while evidence, ratios, household adaptation, safety endpoints and human journeys are unresolved', () => {
  const report = buildNorthwestOnePotResearchReport(inputs);

  assert.equal(report.completion.status, 'research_in_progress');
  assert.deepEqual(report.completion.blockers, [
    'production_evidence_gaps',
    'ratio_dsl_unresolved',
    'household_vessel_adaptation_unresolved',
    'safety_endpoint_incomplete',
    'human_journey_review_incomplete',
  ]);
  assert.deepEqual(report.completion.baseline_facts, ['zero_candidate_baseline']);
  assert.equal(report.summary.human_journey_reviewed_count, 0);
});

test('summary is derived from report rows', () => {
  const report = buildNorthwestOnePotResearchReport(inputs);

  assert.deepEqual(report.summary.source_count_by_grade, { A: 20, B: 4, C: 1 });
  assert.equal(
    formatNorthwestOnePotResearchSummary(report),
    '3 Northwest production audits · 0 candidates · 8 research leads · 16 journeys · Northwest research in progress',
  );
});

test('report validator rejects dishonest completion and count drift', () => {
  const broken = structuredClone(buildNorthwestOnePotResearchReport(inputs));
  broken.completion = { status: 'regional_round_complete', blockers: [], baseline_facts: [] };
  broken.summary.source_count = 99;
  broken.region_overview.production_recipe_count = 1;
  const message = validateNorthwestOnePotResearchReport(broken).join('\n');

  assert.match(message, /completion cannot be complete/);
  assert.match(message, /summary source_count expected 25, got 99/);
  assert.match(message, /region production_recipe_count expected 3, got 1/);
});

test('report validator rejects a deleted claim matrix row', () => {
  const broken = structuredClone(buildNorthwestOnePotResearchReport(inputs));
  broken.claim_matrix.pop();

  assert.match(
    validateNorthwestOnePotResearchReport(broken).join('\n'),
    /claim_matrix must exactly match claims derived from audited rows/,
  );
});

test('builder fails closed on invalid fixed input while report validation stays total', () => {
  const broken = structuredClone(inputs);
  broken.assessment.candidate_audits.push({});
  assert.throws(() => buildNorthwestOnePotResearchReport(broken), /candidate_audits/);
  assert.deepEqual(validateNorthwestOnePotResearchReport(null), ['report must be an object']);
});

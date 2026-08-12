import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildFujianTaiwanRiceNoodleResearchReport,
  formatFujianTaiwanRiceNoodleResearchSummary,
  validateFujianTaiwanRiceNoodleResearchReport,
} from '../lib/fujian-taiwan-rice-noodle-research-builder.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const inputs = {
  assessment: readJson('../data/fujian-taiwan-rice-noodle-research.v1.json'),
  recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'),
  regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

test('report keeps six production audits, three research leads and zero runtime mutations', () => {
  const report = buildFujianTaiwanRiceNoodleResearchReport(inputs);
  assert.deepEqual(validateFujianTaiwanRiceNoodleResearchReport(report), []);
  assert.equal(report.region_overview.region_id, 'fujian_taiwan');
  assert.deepEqual(report.region_overview.province_codes, ['CN-FJ', 'CN-TW']);
  assert.equal(report.production_recipe_audits.length, 6);
  assert.equal(report.concrete_research_leads.length, 3);
  assert.equal(report.source_evidence.length, 11);
  assert.equal(report.household_journeys.length, 12);
  assert.equal(report.summary.production_recipe_changes, 0);
  assert.equal(report.summary.regional_candidate_changes, 0);
});

test('province coverage counts only province-specific recipes and keeps cross-regional She rice separate', () => {
  const report = buildFujianTaiwanRiceNoodleResearchReport(inputs);
  const byProvince = new Map(report.province_gap_audits.map(row => [row.province_code, row]));
  assert.equal(byProvince.get('CN-FJ').production_recipe_count, 3);
  assert.equal(byProvince.get('CN-FJ').lead_count, 2);
  assert.equal(byProvince.get('CN-TW').production_recipe_count, 2);
  assert.equal(byProvince.get('CN-TW').lead_count, 1);
  assert.equal(report.region_overview.cross_regional_recipe_count, 1);
});

test('claim matrix exposes source support separately from project equivalence', () => {
  const report = buildFujianTaiwanRiceNoodleResearchReport(inputs);
  const bySubjectClaim = new Map(report.claim_matrix.map(row => [`${row.subject_id}:${row.claim_id}`, row.verdict]));
  assert.equal(bySubjectClaim.get('taiwan-cabbage-mushroom-rice:regional_family'), 'supported');
  assert.equal(bySubjectClaim.get('taiwan-cabbage-mushroom-rice:project_ratio_equivalence'), 'not_proven');
  assert.equal(bySubjectClaim.get('quanzhou-oil-rice:exact_project_equivalence'), 'not_proven');
  assert.equal(bySubjectClaim.get('daxi-lotus-leaf-oil-rice:exact_project_formula'), 'not_proven');
});

test('ingredient shape matrix keeps rice, noodle, bean and wrapper states inspectable', () => {
  const report = buildFujianTaiwanRiceNoodleResearchReport(inputs);
  const shapes = new Set(report.ingredient_shape_matrix.map(row => row.shape));
  for (const shape of ['raw_non_glutinous_rice', 'ready_wheat_noodle', 'precooked_green_bean', 'pork_belly_dice']) {
    assert.ok(shapes.has(shape), shape);
  }
});

test('completion remains research_in_progress with evidence-specific blockers', () => {
  const report = buildFujianTaiwanRiceNoodleResearchReport(inputs);
  assert.equal(report.completion.status, 'research_in_progress');
  assert.deepEqual(report.completion.blockers, [
    'exact_recipe_equivalence_unresolved',
    'ratio_state_mismatch_unresolved',
    'ingredient_identity_unresolved',
    'new_family_ratio_unresolved',
    'safety_endpoint_incomplete',
    'human_journey_review_incomplete',
  ]);
  assert.equal(report.summary.human_journey_reviewed_count, 0);
});

test('summary is derived from report rows', () => {
  const report = buildFujianTaiwanRiceNoodleResearchReport(inputs);
  assert.deepEqual(report.summary.source_count_by_grade, { A: 10, B: 1, C: 0 });
  assert.equal(report.summary.production_audit_count, 6);
  assert.equal(report.summary.concrete_research_lead_count, 3);
  assert.equal(report.summary.household_journey_count, 12);
  assert.equal(
    formatFujianTaiwanRiceNoodleResearchSummary(report),
    '6 Fujian-Taiwan recipe audits · 3 research leads · 12 journeys · Fujian-Taiwan research ok',
  );
});

test('report validator rejects dishonest completion and mismatched counts', () => {
  const broken = structuredClone(buildFujianTaiwanRiceNoodleResearchReport(inputs));
  broken.completion.status = 'regional_round_complete';
  broken.completion.blockers = [];
  broken.summary.source_count = 99;
  broken.region_overview.production_recipe_count = 5;
  const message = validateFujianTaiwanRiceNoodleResearchReport(broken).join('\n');
  assert.match(message, /completion cannot be complete/);
  assert.match(message, /summary source_count expected 11, got 99/);
  assert.match(message, /region production_recipe_count expected 6, got 5/);
});

test('builder rejects invalid evidence while report validator remains total', () => {
  const broken = structuredClone(inputs);
  broken.assessment.production_recipe_audits.find(row => row.recipe_id === 'fujian-hyacinth-bean-rice').claims.bean_species_identity.verdict = 'supported';
  assert.throws(() => buildFujianTaiwanRiceNoodleResearchReport(broken), /bean species identity/);
  assert.deepEqual(validateFujianTaiwanRiceNoodleResearchReport(null), ['report must be an object']);
});

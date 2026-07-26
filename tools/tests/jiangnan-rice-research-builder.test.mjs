import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildJiangnanRiceResearchReport,
  formatJiangnanRiceResearchSummary,
  validateJiangnanRiceResearchReport,
} from '../lib/jiangnan-rice-research-builder.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const assessment = readJson('../data/jiangnan-rice-research.v1.json');
const recipeLibrary = readJson('../data/recipe-library.json');
const recipeCandidates = readJson('../data/recipe-candidates.json');
const regionalAtlas = readJson('../data/regional-atlas.v2.json');
const regionalMappings = readJson('../data/regional-menu-mappings.v1.json');
const inputs = { assessment, recipeLibrary, recipeCandidates, regionalAtlas, regionalMappings };

test('report contains the complete Jiangnan audit package', () => {
  const report = buildJiangnanRiceResearchReport(inputs);
  assert.deepEqual(validateJiangnanRiceResearchReport(report), []);
  assert.equal(report.region_overview.region_id, 'jiangnan');
  assert.deepEqual(report.region_overview.province_codes, ['CN-SH', 'CN-JS', 'CN-ZJ', 'CN-AH']);
  assert.equal(report.recipe_audits.length, 8);
  assert.equal(report.variant_relationships.length, 8);
  assert.ok(report.ingredient_coverage_matrix.length >= 12);
  assert.equal(report.source_evidence_pack.length, 8);
  assert.ok(report.home_adaptation_boundaries.length >= 8);
  assert.equal(report.product_destination_decisions.length, 10);
  assert.equal(report.province_research_leads.length, 2);
});

test('report derives province production counts and makes the Anhui gap explicit', () => {
  const report = buildJiangnanRiceResearchReport(inputs);
  const byCode = new Map(report.region_overview.provinces.map(row => [row.atlas_code, row]));
  assert.equal(byCode.get('CN-SH').production_recipe_count, 2);
  assert.equal(byCode.get('CN-JS').production_recipe_count, 4);
  assert.equal(byCode.get('CN-ZJ').production_recipe_count, 1);
  assert.equal(byCode.get('CN-AH').production_recipe_count, 0);
  assert.equal(byCode.get('CN-AH').research_lead_count, 2);
  assert.deepEqual(byCode.get('CN-AH').production_recipe_ids, []);
});

test('cross-regional She rice stays visible without acquiring a fake province', () => {
  const report = buildJiangnanRiceResearchReport(inputs);
  const she = report.recipe_audits.find(row => row.recipe_id === 'she-people-black-rice');
  assert.deepEqual(she.province_codes, []);
  assert.equal(she.regional_scope, 'cross_regional_chinese');
  assert.equal(report.summary.cross_regional_recipe_count, 1);
});

test('report separates cultural facts from project production adaptations', () => {
  const report = buildJiangnanRiceResearchReport(inputs);
  const nanjing = report.recipe_audits.find(row => row.recipe_id === 'nanjing-cured-pork-greens-rice');
  assert.equal(nanjing.claims.regional_variant.verdict, 'supported');
  assert.equal(nanjing.claims.production_staple_equivalence.verdict, 'not_proven');
  const banshan = report.recipe_audits.find(row => row.recipe_id === 'banshan-wild-rice');
  assert.equal(banshan.claims.cultural_identity.verdict, 'supported');
  assert.equal(banshan.claims.production_core_combination.verdict, 'not_proven');
});

test('initial round remains research_in_progress with exact blockers', () => {
  const report = buildJiangnanRiceResearchReport(inputs);
  assert.equal(report.completion_status.status, 'research_in_progress');
  assert.deepEqual(report.completion_status.blocking_gaps, [
    'production_claim_gaps',
    'ratio_evidence_incomplete',
    'safety_evidence_incomplete',
    'anhui_leads_not_promoted',
    'human_journey_review_incomplete',
  ]);
  assert.equal(report.summary.ratio_ready_branch_count, 0);
  assert.equal(report.summary.safety_ready_branch_count, 0);
  assert.equal(report.summary.journey_reviewed_count, 0);
  assert.equal(report.summary.production_recipe_changes, 0);
});

test('source and state summaries are derived from supplied rows', () => {
  const report = buildJiangnanRiceResearchReport(inputs);
  assert.deepEqual(report.summary.source_count_by_grade, { A: 7, B: 1, C: 0 });
  assert.equal(report.summary.evidence_checked_count, 2);
  assert.equal(report.summary.needs_more_evidence_count, 6);
  assert.equal(report.summary.research_lead_count, 2);
  assert.equal(report.summary.journey_count, 12);
  assert.equal(
    formatJiangnanRiceResearchSummary(report),
    '8 recipe audits · 8 sources · 2 Anhui leads · 12 journeys · research_in_progress',
  );
});

test('report validator catches dishonest completion and mismatched summaries', () => {
  const report = buildJiangnanRiceResearchReport(inputs);
  const broken = structuredClone(report);
  broken.completion_status.status = 'regional_round_complete';
  broken.completion_status.blocking_gaps = [];
  broken.summary.source_count = 99;
  broken.region_overview.provinces.find(row => row.atlas_code === 'CN-AH').production_recipe_count = 2;
  const message = validateJiangnanRiceResearchReport(broken).join('\n');
  assert.match(message, /completion status cannot be complete while evidence or review is incomplete/);
  assert.match(message, /summary source_count expected 8, got 99/);
  assert.match(message, /province production_recipe_count is inconsistent for CN-AH/);
});

test('builder and report validator are total for malformed nested inputs', () => {
  assert.doesNotThrow(() => buildJiangnanRiceResearchReport({
    assessment: { recipe_audits: [null], source_refs: [null], province_research_leads: [null], family_model: null },
    recipeLibrary: { recipes: [null] },
    recipeCandidates: { entries: [null] },
    regionalAtlas: null,
    regionalMappings: { production_recipe_mappings: [null] },
  }));
  assert.deepEqual(validateJiangnanRiceResearchReport(null), ['report must be an object']);
});

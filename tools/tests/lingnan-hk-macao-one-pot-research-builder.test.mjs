import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildLingnanHkMacaoOnePotResearchReport,
  formatLingnanHkMacaoOnePotResearchSummary,
  validateLingnanHkMacaoOnePotResearchReport,
} from '../lib/lingnan-hk-macao-one-pot-research-builder.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const inputs = {
  assessment: readJson('../data/lingnan-hk-macao-one-pot-research.v1.json'),
  recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'),
  regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

test('report derives the fixed Lingnan baseline without adding recipes or candidates', () => {
  const report = buildLingnanHkMacaoOnePotResearchReport(inputs);

  assert.deepEqual(validateLingnanHkMacaoOnePotResearchReport(report), []);
  assert.equal(report.region_overview.region_id, 'lingnan_hk_macao');
  assert.deepEqual(report.region_overview.province_codes, ['CN-GD', 'CN-GX', 'CN-HI', 'CN-HK', 'CN-MO']);
  assert.equal(report.production_recipe_audits.length, 5);
  assert.equal(report.candidate_audits.length, 0);
  assert.equal(report.concrete_research_leads.length, 5);
  assert.equal(report.family_model.length, 5);
  assert.equal(report.source_evidence.length, 11);
  assert.equal(report.household_journeys.length, 15);
  assert.equal(report.summary.production_recipe_changes, 0);
  assert.equal(report.summary.regional_candidate_changes, 0);
  assert.match(report.summary.scope_note, /不新增.*recipe.*candidate/i);
});

test('claim matrix separates supported identity from unproven household adaptation and project parameters', () => {
  const report = buildLingnanHkMacaoOnePotResearchReport(inputs);
  const claims = new Map(report.claim_matrix.map(row => [`${row.subject_id}:${row.claim_id}`, row]));

  assert.equal(claims.get('cantonese-cured-meat-claypot-rice:guangzhou_claypot_identity').verdict, 'supported');
  assert.equal(claims.get('cantonese-cured-meat-claypot-rice:guangzhou_claypot_identity').evidence_direction, 'proves');
  assert.equal(claims.get('cantonese-cured-meat-claypot-rice:ordinary_pot_equivalence').verdict, 'not_proven');
  assert.equal(claims.get('cantonese-cured-meat-claypot-rice:ordinary_pot_equivalence').evidence_direction, 'does_not_prove');
  assert.equal(claims.get('cantonese-cured-meat-claypot-rice:project_ratio_safety').verdict, 'not_proven');
  assert.equal(claims.get('guangxi-five-color-glutinous-rice:food_powder_as_traditional_equivalence').verdict, 'not_proven');
  assert.equal(claims.get('hainan-cai-bao-rice:single_vessel_one_pot_equivalence').verdict, 'not_proven');
});

test('province coverage honestly keeps Hong Kong and Macao at zero production while retaining research context', () => {
  const report = buildLingnanHkMacaoOnePotResearchReport(inputs);
  const coverage = new Map(report.province_coverage_audits.map(row => [row.province_code, row]));

  assert.deepEqual(coverage.get('CN-HK').production_recipe_ids, []);
  assert.ok(coverage.get('CN-HK').context_lead_ids.includes('cantonese-claypot-rice-technique'));
  assert.deepEqual(coverage.get('CN-MO').production_recipe_ids, []);
  assert.ok(coverage.get('CN-MO').lead_ids.includes('macao-portuguese-style-seafood-rice'));
});

test('completion remains research in progress while evidence, ratios, household adaptation, meal sufficiency and human journeys are unresolved', () => {
  const report = buildLingnanHkMacaoOnePotResearchReport(inputs);

  assert.equal(report.completion.status, 'research_in_progress');
  assert.deepEqual(report.completion.blockers, [
    'production_evidence_gaps',
    'ratio_dsl_unresolved',
    'household_vessel_adaptation_unresolved',
    'meal_sufficiency_unresolved',
    'safety_endpoint_incomplete',
    'human_journey_review_incomplete',
  ]);
  assert.deepEqual(report.completion.baseline_facts, ['zero_candidate_baseline']);
  assert.equal(report.summary.human_journey_reviewed_count, 0);
});

test('summary is derived from report rows', () => {
  const report = buildLingnanHkMacaoOnePotResearchReport(inputs);

  assert.deepEqual(report.summary.source_count_by_grade, { A: 8, B: 2, C: 1 });
  assert.equal(
    formatLingnanHkMacaoOnePotResearchSummary(report),
    '5 Lingnan production audits · 0 candidates · 5 research leads · 15 journeys · Lingnan research in progress',
  );
});

test('report validator rejects dishonest completion and count drift', () => {
  const broken = structuredClone(buildLingnanHkMacaoOnePotResearchReport(inputs));
  broken.completion = { status: 'regional_round_complete', blockers: [], baseline_facts: [] };
  broken.summary.source_count = 99;
  broken.region_overview.production_recipe_count = 1;
  const message = validateLingnanHkMacaoOnePotResearchReport(broken).join('\n');

  assert.match(message, /completion cannot be complete/);
  assert.match(message, /summary source_count expected 11, got 99/);
  assert.match(message, /region production_recipe_count expected 5, got 1/);
});

test('builder fails closed on an invalid assessment while report validation stays total', () => {
  const broken = structuredClone(inputs);
  broken.assessment.candidate_audits.push({});
  assert.throws(() => buildLingnanHkMacaoOnePotResearchReport(broken), /candidate_audits/);
  assert.deepEqual(validateLingnanHkMacaoOnePotResearchReport(null), ['report must be an object']);
});

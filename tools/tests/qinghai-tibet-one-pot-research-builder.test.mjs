import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildQinghaiTibetOnePotResearchReport,
  formatQinghaiTibetOnePotResearchSummary,
  validateQinghaiTibetOnePotResearchReport,
} from '../lib/qinghai-tibet-one-pot-research-builder.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const inputs = {
  assessment: readJson('../data/qinghai-tibet-one-pot-research.v1.json'),
  recipeLibrary: readJson('../data/recipe-library.json'),
  regionalResearch: readJson('../data/regional-menu-research.v1.json'),
  regionalAtlas: readJson('../data/regional-atlas.v2.json'),
  regionalMappings: readJson('../data/regional-menu-mappings.v1.json'),
};

test('report derives the fixed Qinghai Tibet 4/0/5/6/11/12 baseline and retains the normalized source fingerprint', () => {
  const report = buildQinghaiTibetOnePotResearchReport(inputs);

  assert.deepEqual(validateQinghaiTibetOnePotResearchReport(report), []);
  assert.equal(report.region_overview.region_id, 'qinghai_tibet');
  assert.deepEqual(report.region_overview.province_codes, ['CN-QH', 'CN-XZ']);
  assert.equal(report.production_recipe_audits.length, 4);
  assert.equal(report.candidate_audits.length, 0);
  assert.equal(report.concrete_research_leads.length, 5);
  assert.equal(report.family_model.length, 6);
  assert.equal(report.source_evidence.length, 11);
  assert.equal(report.household_journeys.length, 12);
  assert.equal(report.source_data_normalized_fingerprint, '224c33752390b6ff877d176bad8aa76ea18222d105f99781381b0f006cfff342');
  assert.deepEqual(report.summary.source_count_by_grade, { A: 11, B: 0, C: 0 });
});

test('claim and ingredient-shape matrices keep regional, meal-context, adaptation, ratio and safety evidence distinct', () => {
  const report = buildQinghaiTibetOnePotResearchReport(inputs);
  const claims = new Map(report.claim_matrix.map(row => [`${row.subject_id}:${row.claim_id}`, row]));
  const shapes = new Map(report.ingredient_shape_matrix.map(row => [row.shape, row]));

  assert.equal(claims.get('qinghai-hao-fan:regional_name_context').verdict, 'supported');
  assert.equal(claims.get('tibetan-patu-one-pot:broth_and_noodle_lump_structure').evidence_direction, 'proves');
  assert.equal(claims.get('lhasa-tibetan-noodle-breakfast:breakfast_context').verdict, 'supported');
  assert.equal(claims.get('qinghai-ga-mianpian-broth:project_single_pot_equivalence').verdict, 'not_proven');
  assert.equal(claims.get('tibetan-patu-one-pot:project_ratio_time_vessel_equivalence').evidence_direction, 'does_not_prove');
  assert.deepEqual(shapes.get('noodle_lump').lead_ids, ['tibetan-patu-one-pot']);
  assert.equal(report.safety_boundaries.find(row => row.safety_id === 'animal-food-cook-through-and-separate').evidence_status, 'principle_only');
});

test('product decisions and completion stay derived while the five fixed blockers remain unresolved', () => {
  const report = buildQinghaiTibetOnePotResearchReport(inputs);
  const patuDecision = report.product_decisions.find(row => row.subject_id === 'tibetan-patu-one-pot');

  assert.deepEqual(patuDecision, {
    subject_type: 'concrete_research_lead',
    subject_id: 'tibetan-patu-one-pot',
    state: 'research_only',
    product_destinations: ['new_family_research', 'research_only'],
    decision_reason: '独立记录帕图，不与古突混写。',
  });
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
  assert.equal(
    formatQinghaiTibetOnePotResearchSummary(report),
    '4 Qinghai Tibet production audits · 0 candidates · 5 research leads · 12 journeys · Qinghai Tibet research in progress',
  );
});

test('report validator rejects coordinated rewrites of claims and their reverse-indexed source evidence', () => {
  const broken = structuredClone(buildQinghaiTibetOnePotResearchReport(inputs));
  const token = 'lead:tibetan-patu-one-pot:single_pot_equivalence';
  const claim = broken.concrete_research_leads.find(row => row.lead_id === 'tibetan-patu-one-pot').claims.single_pot_equivalence;
  claim.verdict = 'supported';
  for (const sourceId of claim.evidence_source_ids) {
    const source = broken.source_evidence.find(row => row.source_id === sourceId);
    source.does_not_prove = source.does_not_prove.filter(value => value !== token);
    source.proves.push(token);
  }
  const matrixClaim = broken.claim_matrix.find(row => row.subject_id === 'tibetan-patu-one-pot' && row.claim_id === 'single_pot_equivalence');
  matrixClaim.verdict = 'supported';
  matrixClaim.evidence_direction = 'proves';
  broken.source_data_normalized_fingerprint = 'forged';

  assert.match(
    validateQinghaiTibetOnePotResearchReport(broken).join('\n'),
    /normalized source data fingerprint mismatch/,
  );
});

test('report validator rejects drift in fixed derived views and the builder fails closed on invalid Task 1 input', () => {
  const noShape = structuredClone(buildQinghaiTibetOnePotResearchReport(inputs));
  noShape.ingredient_shape_matrix = [];
  assert.match(validateQinghaiTibetOnePotResearchReport(noShape).join('\n'), /ingredient_shape_matrix must exactly match audited rows/);

  const noDecision = structuredClone(buildQinghaiTibetOnePotResearchReport(inputs));
  noDecision.product_decisions = [];
  assert.match(validateQinghaiTibetOnePotResearchReport(noDecision).join('\n'), /product_decisions must exactly match audited rows/);

  const forgedCoverage = structuredClone(buildQinghaiTibetOnePotResearchReport(inputs));
  forgedCoverage.province_coverage_audits.find(row => row.province_code === 'CN-QH').province_name = '伪造省份';
  assert.match(validateQinghaiTibetOnePotResearchReport(forgedCoverage).join('\n'), /province_coverage_audits must exactly match audited rows/);

  const invalid = structuredClone(inputs);
  invalid.assessment.candidate_audits.push({});
  assert.throws(() => buildQinghaiTibetOnePotResearchReport(invalid), /candidate_audits/);
  assert.deepEqual(validateQinghaiTibetOnePotResearchReport(null), ['report must be an object']);
});

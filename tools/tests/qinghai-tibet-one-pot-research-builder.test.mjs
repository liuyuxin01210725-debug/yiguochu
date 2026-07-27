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

test('planner capability bookkeeping does not invalidate Qinghai Tibet research inputs', () => {
  const baselineInputs = structuredClone(inputs);
  const capabilityRows = baselineInputs.regionalMappings.template_capability_mappings;
  delete baselineInputs.regionalMappings.template_capability_mappings;
  baselineInputs.regionalMappings.mapping_version = 'regional-menu-mappings-v1-20260726';
  const baseline = buildQinghaiTibetOnePotResearchReport(baselineInputs);

  const extendedInputs = structuredClone(baselineInputs);
  extendedInputs.regionalMappings.mapping_version = inputs.regionalMappings.mapping_version;
  extendedInputs.regionalMappings.template_capability_mappings = capabilityRows;
  const extended = buildQinghaiTibetOnePotResearchReport(extendedInputs);

  assert.equal(extended.input_data_normalized_fingerprint, baseline.input_data_normalized_fingerprint);
  assert.deepEqual(extended, baseline);
});

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
  assert.equal(report.critical_boundaries.length, 5);
  assert.equal(report.technique_boundaries.length, 3);
  assert.equal(report.source_data_normalized_fingerprint, 'a6a54b822d74d0a8f3a01abe31ba73cf28b066326c48f05ba58aa13c943639ff');
  assert.equal(report.input_data_normalized_fingerprint, '29e6ef75bf25989f90f66f4e09f627bb0134f2b10956be5155a744397221fdbc');
  assert.deepEqual(report.summary.source_count_by_grade, { A: 11, B: 0, C: 0 });
});

test('report carries machine-linked critical boundaries and the Tibet porridge audit journey without cross-region family reuse', () => {
  const report = buildQinghaiTibetOnePotResearchReport(inputs);
  const xz04 = report.household_journeys.find(row => row.journey_id === 'xz-04');
  assert.deepEqual(xz04, {
    journey_id: 'xz-04',
    province_code: 'CN-XZ',
    journey_kind: 'production_audit',
    input_items: ['青稞', '咸味粥'],
    expected_family_ids: [],
    audit_recipe_ids: ['tibetan-savory-congee'],
    forbidden_claims: ['traditional_replica'],
    human_review: { status: 'pending' },
  });
  const gutu = report.critical_boundaries.find(row => row.finding_id === 'gutu-non-food-symbols-forbidden');
  assert.deepEqual(gutu.subjects, [{ subject_type: 'production_recipe', subject_id: 'tibetan-gutu' }]);
  assert.ok(gutu.source_ids.includes('xz-gov-new-year-customs-2025'));
  assert.ok(gutu.boundary_ids.includes('tibetan-gutu-not-traditional-replica'));
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
  assert.deepEqual(shapes.get('barley_grain').production_recipe_ids, []);
  assert.deepEqual(shapes.get('barley_grain').production_evidence_context_recipe_ids, ['tibetan-savory-congee']);
  assert.deepEqual(shapes.get('milk').production_recipe_ids, ['tibetan-savory-congee']);
  assert.deepEqual(shapes.get('yak_beef_dice').lead_ids, ['tibetan-patu-one-pot']);
  assert.equal(report.safety_boundaries.find(row => row.safety_id === 'animal-food-cook-through-and-separate').evidence_status, 'principle_only');
});

test('report carries all three technique boundaries as validated machine data', () => {
  const report = buildQinghaiTibetOnePotResearchReport(inputs);
  const ids = report.technique_boundaries.map(row => row.technique_id).sort();
  assert.deepEqual(ids, ['qinghai-barley-long-simmer-boundary', 'qinghai-ga-mianpian-branch-boundary', 'tibetan-patu-yak-dice-boundary']);
  assert.ok(report.technique_boundaries.every(row => row.source_ids.length > 0 && row.claim_tokens.length > 0));
});

test('product decisions and completion stay derived while the five fixed blockers remain unresolved', () => {
  const report = buildQinghaiTibetOnePotResearchReport(inputs);
  const patuDecision = report.product_decisions.find(row => row.subject_id === 'tibetan-patu-one-pot');

  assert.deepEqual(patuDecision, {
    subject_type: 'concrete_research_lead',
    subject_id: 'tibetan-patu-one-pot',
    state: 'research_only',
    product_destinations: ['new_family_research', 'research_only'],
    decision_reason: '独立记录帕图与牦牛肉丁结构，不与古突或普通肉类替换混写。',
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
    /normalized report semantics fingerprint mismatch/,
  );
});

test('canonical input and report semantics reject coordinated rewrites of all consumed enrichments', () => {
  const mutations = [
    ['recipe name', report => { report.production_recipe_audits[0].recipe_name = '伪造菜名'; }],
    ['core ingredients', report => { report.production_recipe_audits[0].recipe_core_ingredients.push('伪造主料'); }],
    ['mapping scope', report => { report.production_recipe_audits[0].mapping_regional_scope = 'forged_scope'; }],
    ['region name', report => { report.region_overview.name = '伪造地域'; }],
    ['research focus', report => { report.region_overview.research_focus.push('伪造研究方向'); }],
  ];

  for (const [label, mutate] of mutations) {
    const broken = structuredClone(buildQinghaiTibetOnePotResearchReport(inputs));
    mutate(broken);
    assert.match(
      validateQinghaiTibetOnePotResearchReport(broken).join('\n'),
      /normalized report semantics fingerprint mismatch/,
      label,
    );
  }

  const researchDrift = structuredClone(inputs);
  researchDrift.regionalResearch.entries[0].prototype_name = '伪造研究候选';
  assert.throws(
    () => buildQinghaiTibetOnePotResearchReport(researchDrift),
    /canonical input fingerprint mismatch/,
  );
});

test('completion is derived from the actual evidence, ratio, adaptation, safety and human-review predicates', () => {
  const resolved = structuredClone(buildQinghaiTibetOnePotResearchReport(inputs));
  for (const audit of resolved.production_recipe_audits) for (const claim of Object.values(audit.claims)) claim.verdict = 'supported';
  for (const lead of resolved.concrete_research_leads) for (const claim of Object.values(lead.claims)) claim.verdict = 'supported';
  for (const safety of resolved.safety_boundaries) safety.evidence_status = 'verified_endpoint';
  for (const journey of resolved.household_journeys) journey.human_review.status = 'passed';
  resolved.completion = { status: 'regional_round_complete', blockers: [], baseline_facts: ['zero_candidate_baseline'] };
  resolved.summary.human_journey_reviewed_count = 12;

  assert.doesNotMatch(
    validateQinghaiTibetOnePotResearchReport(resolved).join('\n'),
    /completion blockers must retain production evidence, ratio, household adaptation, safety and human review gates/,
  );
});

test('formatter refuses missing or unknown completion state instead of presenting research ok', () => {
  const missing = structuredClone(buildQinghaiTibetOnePotResearchReport(inputs));
  delete missing.completion;
  assert.throws(() => formatQinghaiTibetOnePotResearchSummary(missing), /invalid Qinghai Tibet research report/);

  const unknown = structuredClone(buildQinghaiTibetOnePotResearchReport(inputs));
  unknown.completion.status = 'unknown';
  assert.throws(() => formatQinghaiTibetOnePotResearchSummary(unknown), /invalid Qinghai Tibet research report/);
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

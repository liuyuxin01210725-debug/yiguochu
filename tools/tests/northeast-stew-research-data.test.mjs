import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateNortheastStewResearch } from '../lib/northeast-stew-research-validator.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const assessment = readJson('../data/northeast-stew-research.v1.json');
const regionalAtlas = readJson('../data/regional-atlas.v2.json');
const regionalResearch = readJson('../data/regional-menu-research.v1.json');
const taxonomy = readJson('../data/ingredient-taxonomy.v1.json');
const inputs = { assessment, regionalAtlas, regionalResearch, taxonomy };

const EXPECTED_IDS = [
  'northeast-chicken-mushroom-potato-corn-cake',
  'northeast-fish-tofu-vegetable-corn-cake',
  'northeast-ribs-beans-corn-cake',
  'northeast-ribs-beans-sticky-rolls',
];

test('assessment covers exactly the four existing northeast candidates', () => {
  assert.deepEqual(assessment.prototypes.map(row => row.atlas_id).sort(), EXPECTED_IDS);
  assert.deepEqual(validateNortheastStewResearch(inputs), []);
});

test('claim evidence cannot merge separate source facts into a traditional fixed combination', () => {
  const chicken = assessment.prototypes.find(row => row.atlas_id.includes('chicken'));
  assert.equal(chicken.claims.exact_combination.verdict, 'not_proven');
  assert.equal(chicken.claims.family_compatibility.verdict, 'supported');
});

test('sticky rolls keep verified Beijing geography separate from an unproven northeast link', () => {
  const sticky = assessment.prototypes.find(row => row.atlas_id.endsWith('sticky-rolls'));
  assert.equal(sticky.claims.northeast_identity.verdict, 'not_proven');
  assert.deepEqual(sticky.verified_geography.province_codes, ['CN-BJ']);
  assert.match(sticky.claims.northeast_identity.reason, /不能证明东北不存在/);
});

test('fish plus tofu remains unproven even when fish plus corn cake is supported', () => {
  const fish = assessment.prototypes.find(row => row.atlas_id.includes('fish-tofu'));
  assert.equal(fish.claims.fish_corn_cake_family.verdict, 'supported');
  assert.equal(fish.claims.tofu_as_traditional_core.verdict, 'not_proven');
});

test('staple forms and safety branches remain separate without invented quantities', () => {
  assert.deepEqual(assessment.family_model.staple_forms.map(row => row.form_id).sort(), [
    'corn_dough_cake', 'sticky_roll', 'wheat_flower_roll',
  ]);
  assert.deepEqual(assessment.family_model.safety_branches.map(row => row.branch_id).sort(), [
    'chicken', 'fish', 'green_beans', 'pork_ribs',
  ]);
  for (const row of [...assessment.family_model.staple_forms, ...assessment.family_model.safety_branches]) {
    assert.equal(row.evidence_status, 'unresearched');
    assert.equal('grams' in row, false);
    assert.equal('minutes' in row, false);
    assert.equal('temperature_c' in row, false);
  }
});

test('validator rejects foreign IDs, fake completion and unsupported exclusion claims', () => {
  const broken = structuredClone(assessment);
  broken.prototypes[0].atlas_id = 'not-a-real-candidate';
  const fish = broken.prototypes.find(row => row.atlas_id.includes('fish-tofu'));
  fish.research_state = 'fact_checked';
  fish.claims.tofu_as_traditional_core.verdict = 'supported';
  const sticky = broken.prototypes.find(row => row.atlas_id.endsWith('sticky-rolls'));
  sticky.claims.northeast_identity.verdict = 'contradicted';
  const message = validateNortheastStewResearch({ ...inputs, assessment: broken }).join('\n');
  assert.match(message, /prototype atlas_id must match the approved northeast set/);
  assert.match(message, /fact_checked requires every identity claim to be supported/);
  assert.match(message, /supported claim requires evidence that proves the claim/);
  assert.match(message, /another verified geography cannot contradict northeast existence/);
});

test('validator is total for malformed roots and nested rows', () => {
  assert.deepEqual(validateNortheastStewResearch({ assessment: null }), ['assessment must be an object']);
  assert.doesNotThrow(() => validateNortheastStewResearch({
    assessment: { prototypes: [null], source_refs: [null] },
    regionalAtlas: null,
    regionalResearch: { entries: [null] },
  }));
});

test('ten household journeys cover positive negative and boundary cases', () => {
  assert.equal(assessment.journey_cases.length, 10);
  assert.equal(new Set(assessment.journey_cases.map(row => row.journey_id)).size, 10);
  assert.ok(assessment.journey_cases.some(row => row.expected_research_outcome === 'supported_family_route'));
  assert.ok(assessment.journey_cases.some(row => row.expected_research_outcome === 'needs_more_evidence'));
  assert.ok(assessment.journey_cases.some(row => row.expected_research_outcome === 'unsupported_for_family'));
  assert.ok(assessment.journey_cases.every(row => row.human_review.status === 'pending'));
  assert.ok(assessment.journey_cases.every(row => row.human_review.household_intuition === null));
  assert.ok(assessment.journey_cases.every(row => row.human_review.operability === null));
  assert.ok(assessment.journey_cases.every(row => row.human_review.taste_judgement === null));
});

test('journeys keep the critical household decisions explicit', () => {
  const byId = new Map(assessment.journey_cases.map(row => [row.journey_id, row]));
  assert.deepEqual(byId.get('ne-j03').expected_used_items, ['排骨', '油豆角', '玉米面']);
  assert.equal(byId.get('ne-j05').expected_research_outcome, 'needs_more_evidence');
  assert.match(byId.get('ne-j05').explanation, /北京平谷.*东北关联仍未核实/);
  assert.equal(byId.get('ne-j08').expected_research_outcome, 'unsupported_for_family');
  assert.deepEqual(byId.get('ne-j08').expected_unplanned_items, ['鸡肉', '蘑菇', '土豆']);
  assert.equal(byId.get('ne-j09').intent, 'quick');
  assert.equal(byId.get('ne-j10').expected_used_items.length, 0);
});

test('journey validator rejects invented review results and unsupported outcomes', () => {
  const broken = structuredClone(assessment);
  broken.journey_cases[0].human_review.status = 'passed';
  broken.journey_cases[0].human_review.reviewer = '';
  broken.journey_cases[1].expected_research_outcome = 'pretend_success';
  const message = validateNortheastStewResearch({ ...inputs, assessment: broken }).join('\n');
  assert.match(message, /completed human review requires reviewer, date, household judgement, notes and conclusion/);
  assert.match(message, /expected_research_outcome is invalid/);
});

test('M1 records two blocked machine-rule candidates and no production numbers', () => {
  assert.equal(assessment.schema_version, 2);
  assert.equal(assessment.assessment_version, 'northeast-stew-research-v1-20260727-m1');
  assert.deepEqual(
    assessment.machine_rule_candidates.map(row => row.rule_id).sort(),
    ['cornmeal-flour-to-dough-v1', 'stew-with-corn-cake-liquid-v1'],
  );
  assert.ok(assessment.machine_rule_candidates.every(row => row.activation_status === 'blocked'));
  assert.doesNotMatch(
    JSON.stringify(assessment.machine_rule_candidates),
    /"(?:grams|minutes|temperature_c|min|default|max)"/,
  );
});

test('calibration ledger reserves exactly 2 3 and 4 servings without fabricating results', () => {
  assert.deepEqual(assessment.calibration_cases.map(row => row.servings), [2, 3, 4]);
  for (const row of assessment.calibration_cases) {
    assert.equal(row.status, 'pending');
    assert.equal(row.operator, null);
    assert.equal(row.performed_at, null);
    assert.equal(row.cornmeal_shape_or_cut, null);
    assert.ok(Object.values(row.equipment).every(value => value === null));
    assert.ok(Object.values(row.measurements).every(value => value === null));
    assert.ok(Object.values(row.acceptance_checks).every(value => value === null));
  }
});

test('twenty two staged capability journeys keep M1 blocked and M2 expectations explicit', () => {
  assert.equal(assessment.capability_journey_cases.length, 22);
  assert.deepEqual(
    assessment.capability_journey_cases.map(row => row.journey_id),
    Array.from({ length:22 }, (_, index) => `ne-cap-j${String(index + 1).padStart(2, '0')}`),
  );
  assert.ok(assessment.capability_journey_cases.every(
    row => row.m1_runtime_expectation === 'template_not_runtime_eligible',
  ));
  assert.deepEqual(
    assessment.capability_journey_cases.slice(19).map(row => row.m2_expected_outcome),
    ['model_contract_violation', 'model_contract_violation', 'model_contract_violation'],
  );
});

test('M1 candidate references fail closed on invented taxonomy and source IDs', () => {
  const unknownTaxonomy = structuredClone(assessment);
  unknownTaxonomy.machine_rule_candidates[0].when.input_canonical_id = 'invented-flour';
  assert.match(
    validateNortheastStewResearch({ ...inputs, assessment: unknownTaxonomy }).join('\n'),
    /unknown taxonomy/,
  );

  const unknownSource = structuredClone(assessment);
  unknownSource.machine_rule_candidates[0].supporting_source_ids = ['invented-source'];
  assert.match(
    validateNortheastStewResearch({ ...inputs, assessment: unknownSource }).join('\n'),
    /unknown source/,
  );
});

test('pending calibration records cannot contain results or skip the 3-serving case', () => {
  const fabricated = structuredClone(assessment);
  fabricated.calibration_cases[0].measurements.cornmeal_grams = 100;
  assert.match(
    validateNortheastStewResearch({ ...inputs, assessment: fabricated }).join('\n'),
    /pending calibration must remain unfilled/,
  );

  const missingThree = structuredClone(assessment);
  missingThree.calibration_cases = missingThree.calibration_cases.filter(row => row.servings !== 3);
  assert.match(
    validateNortheastStewResearch({ ...inputs, assessment: missingThree }).join('\n'),
    /calibration cases must be exactly ne-cal-2 ne-cal-3 and ne-cal-4/,
  );
});

test('capability journey ledger rejects missing IDs premature M1 success and incomplete expectations', () => {
  const missingJourney = structuredClone(assessment);
  missingJourney.capability_journey_cases.splice(10, 1);
  assert.match(
    validateNortheastStewResearch({ ...inputs, assessment: missingJourney }).join('\n'),
    /journey_id must match ne-cap-j01 through ne-cap-j22/,
  );

  const prematureSuccess = structuredClone(assessment);
  prematureSuccess.capability_journey_cases[0].m1_runtime_expectation = 'complete';
  assert.match(
    validateNortheastStewResearch({ ...inputs, assessment: prematureSuccess }).join('\n'),
    /m1_runtime_expectation must remain template_not_runtime_eligible/,
  );

  const missingUsed = structuredClone(assessment);
  missingUsed.capability_journey_cases[0].expected_used_items = [];
  assert.match(
    validateNortheastStewResearch({ ...inputs, assessment: missingUsed }).join('\n'),
    /complete or ready journey requires expected_used_items/,
  );

  const missingViolation = structuredClone(assessment);
  missingViolation.capability_journey_cases[19].assertion_codes = ['model_output_checked'];
  assert.match(
    validateNortheastStewResearch({ ...inputs, assessment: missingViolation }).join('\n'),
    /model_contract_violation journey requires a model violation assertion/,
  );
});

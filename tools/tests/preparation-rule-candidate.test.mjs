import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertPreparationRuleCandidate,
  assertPreparationRuleDefinition,
  validatePreparationRuleCandidate,
  validatePreparationRuleDefinition,
} from '../lib/preparation-rule-validator.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const taxonomy = JSON.parse(fs.readFileSync(
  path.join(here, '../data/ingredient-taxonomy.v1.json'),
  'utf8',
));
const productionRatios = JSON.parse(fs.readFileSync(
  path.join(here, '../data/ratio-rules.v1.json'),
  'utf8',
));
const syntheticFixture = JSON.parse(fs.readFileSync(
  path.join(here, 'fixtures/northeast-stew-m1/preparation-rule.synthetic.json'),
  'utf8',
));

const taxonomyIds = new Set(taxonomy.items.map(item => item.canonical_id));
const context = {
  taxonomyIds,
  sourceIds: new Set(['source-a', 'source-b']),
};

function validPreparationCandidate() {
  return {
    rule_id: 'cornmeal-flour-to-dough-v1',
    rule_kind: 'preparation',
    activation_status: 'blocked',
    when: {
      input_canonical_id: 'cornmeal-flour',
      allowed_shape_or_cut: ['fine', 'coarse', 'unspecified'],
    },
    produces: {
      canonical_id: 'cornmeal-dough',
      state: 'prepared',
    },
    required_basic_extras: ['水'],
    supporting_source_ids: ['source-a'],
    numeric_evidence_source_ids: [],
    calibration_case_ids: [],
    evidence_status: 'missing',
    calibration_status: 'required',
    blocker_codes: ['numeric_evidence_missing', 'calibration_pending'],
  };
}

function validStewLiquidCandidate() {
  return {
    rule_id: 'stew-with-corn-cake-liquid-v1',
    rule_kind: 'stew_liquid',
    activation_status: 'blocked',
    when: {
      template_id: 'stew-with-staple-pot',
      staple_canonical_id: 'cornmeal-dough',
    },
    produces: {
      phase_allocations: ['prepare_staple', 'stew_liquid'],
      staple_position: 'above_stew_liquid',
      steam_required: true,
    },
    required_basic_extras: ['水'],
    supporting_source_ids: ['source-a'],
    numeric_evidence_source_ids: [],
    calibration_case_ids: [],
    evidence_status: 'missing',
    calibration_status: 'required',
    blocker_codes: ['numeric_evidence_missing', 'calibration_pending'],
  };
}

test('blocked preparation candidates preserve identities without production numbers', () => {
  const candidates = [validPreparationCandidate(), validStewLiquidCandidate()];
  for (const candidate of candidates) {
    assert.deepEqual(validatePreparationRuleCandidate(candidate, context), []);
    assert.equal(assertPreparationRuleCandidate(candidate, context), candidate);
    assert.equal(candidate.activation_status, 'blocked');
    assert.deepEqual(candidate.numeric_evidence_source_ids, []);
    assert.doesNotMatch(JSON.stringify(candidate), /"(?:grams|minutes|temperature_c|min|default|max)"/);
  }
  assert.deepEqual(
    new Set(candidates.map(row => row.rule_id)),
    new Set(['cornmeal-flour-to-dough-v1', 'stew-with-corn-cake-liquid-v1']),
  );
});

test('candidate schema fails closed on unknown identities sources and missing blockers', () => {
  const unknownTaxonomy = validPreparationCandidate();
  unknownTaxonomy.when.input_canonical_id = 'invented-flour';
  assert.match(validatePreparationRuleCandidate(unknownTaxonomy, context).join('\n'), /unknown taxonomy/);

  const unknownSource = validPreparationCandidate();
  unknownSource.supporting_source_ids = ['invented-source'];
  assert.match(validatePreparationRuleCandidate(unknownSource, context).join('\n'), /unknown source/);

  const noBlocker = validPreparationCandidate();
  noBlocker.blocker_codes = [];
  assert.match(validatePreparationRuleCandidate(noBlocker, context).join('\n'), /requires blocker_codes/);
});

test('candidate schema rejects production numbers and unsupported extras', () => {
  const numbered = validPreparationCandidate();
  numbered.when.instructions = { grams: 100, bounds: { min: 1, default: 2, max: 3 } };
  const numberedErrors = validatePreparationRuleCandidate(numbered, context).join('\n');
  assert.match(numberedErrors, /forbidden numeric field/);
  assert.match(numberedErrors, /unexpected field/);

  const extraIngredient = validPreparationCandidate();
  extraIngredient.required_basic_extras = ['水', '食用油'];
  assert.match(validatePreparationRuleCandidate(extraIngredient, context).join('\n'), /required_basic_extras must be exactly 水/);
});

test('candidate cannot claim evidence or calibration before its gates are complete', () => {
  const weakEvidence = validPreparationCandidate();
  weakEvidence.evidence_status = 'evidence_ready';
  weakEvidence.numeric_evidence_source_ids = ['source-a'];
  assert.match(validatePreparationRuleCandidate(weakEvidence, context).join('\n'), /two independent numeric sources/);

  const incompleteCalibration = validPreparationCandidate();
  incompleteCalibration.calibration_status = 'calibrated';
  incompleteCalibration.calibration_case_ids = ['ne-cal-2', 'ne-cal-3'];
  assert.match(validatePreparationRuleCandidate(incompleteCalibration, context).join('\n'), /requires 2 3 and 4 serving records/);

  const prematureActive = validPreparationCandidate();
  prematureActive.activation_status = 'active';
  assert.match(validatePreparationRuleCandidate(prematureActive, context).join('\n'), /active candidate requires evidence and calibration/);
});

test('preparation output differs from its input and stew phases are exact', () => {
  const sameIdentity = validPreparationCandidate();
  sameIdentity.produces.canonical_id = 'cornmeal-flour';
  assert.match(validatePreparationRuleCandidate(sameIdentity, context).join('\n'), /output must differ from input/);

  const incompletePhases = validStewLiquidCandidate();
  incompletePhases.produces.phase_allocations = ['stew_liquid'];
  assert.match(validatePreparationRuleCandidate(incompletePhases, context).join('\n'), /phase_allocations must be exactly/);
});

test('isolated synthetic active definition validates the future machine schema', () => {
  assert.equal(syntheticFixture.fixture_scope, 'synthetic_test_only');
  const syntheticContext = {
    taxonomyIds,
    sourceIds: new Set(['synthetic-source-a', 'synthetic-source-b']),
  };
  assert.deepEqual(validatePreparationRuleDefinition(syntheticFixture.rule, syntheticContext), []);
  assert.equal(assertPreparationRuleDefinition(syntheticFixture.rule, syntheticContext), syntheticFixture.rule);
});

test('active definition fails closed on bounds evidence calibration operation order and water phase', () => {
  const syntheticContext = {
    taxonomyIds,
    sourceIds: new Set(['synthetic-source-a', 'synthetic-source-b']),
  };

  const badBounds = structuredClone(syntheticFixture.rule);
  badBounds.operations[0].grams = { min: 3, default: 2, max: 1 };
  assert.match(validatePreparationRuleDefinition(badBounds, syntheticContext).join('\n'), /ordered positive bounds/);

  const weakEvidence = structuredClone(syntheticFixture.rule);
  weakEvidence.evidence_source_ids = ['synthetic-source-a'];
  assert.match(validatePreparationRuleDefinition(weakEvidence, syntheticContext).join('\n'), /at least two evidence sources/);

  const missingCalibration = structuredClone(syntheticFixture.rule);
  missingCalibration.calibration_record_ids = ['ne-cal-2', 'ne-cal-3'];
  assert.match(validatePreparationRuleDefinition(missingCalibration, syntheticContext).join('\n'), /exactly ne-cal-2 ne-cal-3 and ne-cal-4/);

  const reversedOperations = structuredClone(syntheticFixture.rule);
  reversedOperations.operations.reverse();
  assert.match(validatePreparationRuleDefinition(reversedOperations, syntheticContext).join('\n'), /operations must be per_serving then ratio/);

  const wrongWaterPhase = structuredClone(syntheticFixture.rule);
  wrongWaterPhase.operations[1].target.phase = 'stew_liquid';
  assert.match(validatePreparationRuleDefinition(wrongWaterPhase, syntheticContext).join('\n'), /water target must use prepare_staple phase/);
});

test('production Ratio DSL does not contain either blocked research candidate', () => {
  const production = JSON.stringify(productionRatios);
  assert.equal(production.includes('cornmeal-flour-to-dough-v1'), false);
  assert.equal(production.includes('stew-with-corn-cake-liquid-v1'), false);
});

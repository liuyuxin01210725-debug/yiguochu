import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  assertKitchenObservation,
  isKitchenObservationReady,
  validateKitchenObservation,
} from '../lib/kitchen-observation.mjs';

const schema = JSON.parse(readFileSync(new URL('../data/kitchen-observation.schema.v1.json', import.meta.url), 'utf8'));

function validObservation() {
  return {
    schema_version: 'kitchen-observation.v1',
    observation_id: 'ko-test-rice-001',
    recorded_at: '2026-08-13T10:00:00+08:00',
    observer: { operator_id: 'operator-test', household_id: 'household-test', role: 'cook' },
    recipe: {
      recipe_id: 'taiwan-tatung-cabbage-rice',
      variant_id: 'source-taiwan-tatung-cabbage-rice',
      canonical_name: '高丽菜饭（测试夹具）',
      catalog_version: 'source-backed-one-pot-v1-test',
      runtime_catalog_ref: 'runtime:test',
      execution_card_ref: 'execution:test',
      source_status_at_attempt: 'recipe_fact_checked',
      formalization_status_at_attempt: 'preview_candidate',
    },
    claim_scope: { servings_claimed: 2, servings_observed: 2, supported_batch_only: true },
    ingredients: [
      {
        canonical_id: 'rice',
        raw_label: '大米',
        state: 'raw',
        source_amount: { value: 300, unit: 'g' },
        observed_amount: { value: 298, unit: 'g' },
        measurement_method: 'scale',
        deviation_reason: '称量误差',
        used: true,
        substitution: null,
      },
      {
        canonical_id: 'pork',
        raw_label: '猪肉',
        state: 'raw',
        source_amount: { value: 200, unit: 'g' },
        observed_amount: { value: 201, unit: 'g' },
        measurement_method: 'scale',
        deviation_reason: '',
        used: true,
        substitution: null,
      },
    ],
    liquid: {
      source_contract: { type: 'water', amount: { value: 360, unit: 'g' }, expression: '内锅 2 杯水' },
      observed_added_amount: { value: 362, unit: 'g' },
      observed_retained_liquid: { value: 0, unit: 'g' },
      observed_absorbed_or_remaining: 'absorbed',
      waterline: { appliance_model: 'Tatung-test', scale: 'inner-pot', mark: '2-cup' },
      liquid_phase_split: [{ phase: 'inner_vessel', amount: { value: 362, unit: 'g' } }],
      liquid_deviation: { occurred: false, details: '' },
    },
    equipment: {
      brand: 'Tatung',
      model: 'test-model',
      capacity: { value: 6, unit: 'cup' },
      vessel_type: 'electric-rice-cooker',
      program: 'white-rice',
      pressure_or_heat_mode: 'heat',
      accessories: ['inner pot'],
      voltage_or_region_if_relevant: 'TW 110V',
      max_fill_or_waterline_limit: '2-cup mark',
    },
    timeline: {
      prep_started_at: '2026-08-13T10:00:00+08:00',
      cook_started_at: '2026-08-13T10:25:00+08:00',
      program_elapsed_minutes: 45,
      pressure_release_or_jump_at: '2026-08-13T11:10:00+08:00',
      rest_minutes: 10,
      finish_at: '2026-08-13T11:20:00+08:00',
      manual_intervention_at: [],
    },
    process_adherence: {
      steps: [
        {
          step: 1,
          completed: true,
          observed_at: '2026-08-13T10:20:00+08:00',
          deviation: '',
          deviation_reason: '',
          external_vessel_action: '',
        },
        {
          step: 2,
          completed: true,
          observed_at: '2026-08-13T10:25:00+08:00',
          deviation: '',
          deviation_reason: '',
          external_vessel_action: '',
        },
        {
          step: 3,
          completed: true,
          observed_at: '2026-08-13T11:10:00+08:00',
          deviation: '',
          deviation_reason: '',
          external_vessel_action: '',
        },
      ],
    },
    safety_endpoints: [
      {
        ingredient_or_hazard: '猪肉',
        required_endpoint: { kind: 'internal_temperature_c', minimum: 74 },
        observed: { value: 76, unit: 'C', instrument_id: 'thermometer-test', location: '最厚处', measured_at: '2026-08-13T11:12:00+08:00' },
        result: 'pass',
        evidence_ref: 'ev-safety-001',
      },
    ],
    sensory_result: {
      rice_texture: '合适',
      protein_texture: '合适',
      vegetable_texture: '不适用',
      liquid_or_bottom: '合适',
      taste: '合适',
      portion_complete: true,
      yield_observed: { servings: 2, amount: { value: 800, unit: 'g' } },
      photos_or_notes: 'ev-outcome-001',
    },
    feedback: {
      instruction_clarity: 'clear',
      missing_ingredient_or_tool: '',
      effort_level: 'medium',
      would_repeat: true,
      quote: '可以再做',
      photo_refs: ['ev-outcome-001'],
      reported_safety_or_discomfort: '',
    },
    journey_regression: {
      journey_id: 'RM-test-001',
      mode: 'give_me_one',
      intent: '快速晚餐',
      servings: 2,
      input_items: ['大米', '猪肉'],
      dislikes_or_allergens: [],
      expected_plan_status: 'ready',
      actual_plan_status: 'ready',
      used_items: ['大米', '猪肉'],
      unused_items_and_reason: [],
      substitution_result: { attempted: false, status: 'not_applicable', details: '' },
      failure_code: null,
      browser_evidence_ref: 'ev-journey-001',
    },
    disposition: { status: 'pending_review', reviewer_id: 'reviewer-test', reviewed_at: null, approve_for_production: false, notes: '' },
    evidence_refs: [
      { kind: 'ingredient_measurement', id: 'ev-ingredients-001', ref: 'local://test/ingredients' },
      { kind: 'liquid_measurement', id: 'ev-liquid-001', ref: 'local://test/liquid' },
      { kind: 'equipment', id: 'ev-equipment-001', ref: 'local://test/equipment' },
      { kind: 'timeline', id: 'ev-timeline-001', ref: 'local://test/timeline' },
      { kind: 'safety', id: 'ev-safety-001', ref: 'local://test/safety' },
      { kind: 'outcome', id: 'ev-outcome-001', ref: 'local://test/outcome' },
      { kind: 'journey', id: 'ev-journey-001', ref: 'local://test/journey' },
    ],
  };
}

test('schema declares kitchen-observation.v1 without a concrete observation record', () => {
  assert.equal(schema.$id, 'https://yiguochu.pages.dev/schemas/kitchen-observation.v1.json');
  assert.equal(schema.title, '一锅出厨房观察记录');
  assert.ok(schema.required.includes('ingredients'));
  assert.ok(schema.required.includes('evidence_refs'));
  assert.equal(schema.type, 'object');
});

test('complete observation keeps source contract and observed measurements separate', () => {
  const observation = validObservation();
  assert.deepEqual(validateKitchenObservation(observation), []);
  assert.equal(isKitchenObservationReady(observation), true);
  assert.notDeepEqual(observation.ingredients[0].source_amount, observation.ingredients[0].observed_amount);
  assert.ok(!('amount' in observation.ingredients[0]));
  assert.doesNotThrow(() => assertKitchenObservation(observation));
});

test('missing ingredient weighing blocks the kitchen gate', () => {
  const observation = validObservation();
  delete observation.ingredients[0].observed_amount;
  const errors = validateKitchenObservation(observation);
  assert.match(errors.join('\n'), /ingredients\[0\]\.observed_amount is required/u);
  assert.equal(isKitchenObservationReady(observation), false);
});

test('missing liquid contract blocks the kitchen gate', () => {
  const observation = validObservation();
  delete observation.liquid.observed_added_amount;
  const errors = validateKitchenObservation(observation);
  assert.match(errors.join('\n'), /liquid\.observed_added_amount is required/u);
});

test('missing appliance identity or program blocks the kitchen gate', () => {
  const observation = validObservation();
  delete observation.equipment.model;
  delete observation.equipment.program;
  const errors = validateKitchenObservation(observation);
  assert.match(errors.join('\n'), /equipment\.model is required/u);
  assert.match(errors.join('\n'), /equipment\.program is required/u);
});

test('missing timeline fields blocks the kitchen gate', () => {
  const observation = validObservation();
  delete observation.timeline.finish_at;
  const errors = validateKitchenObservation(observation);
  assert.match(errors.join('\n'), /timeline\.finish_at is required/u);
});

test('missing or failed safety endpoint blocks the kitchen gate', () => {
  const missing = validObservation();
  missing.safety_endpoints = [];
  assert.match(validateKitchenObservation(missing).join('\n'), /safety_endpoints must contain at least one endpoint/u);

  const failed = validObservation();
  failed.safety_endpoints[0].result = 'fail';
  assert.match(validateKitchenObservation(failed).join('\n'), /safety_endpoints\[0\] must pass/u);
});

test('missing evidence cannot be replaced by browser or automated journey evidence', () => {
  const observation = validObservation();
  observation.evidence_refs = [];
  const errors = validateKitchenObservation(observation);
  assert.match(errors.join('\n'), /evidence_refs must contain at least one evidence reference/u);

  const browserOnly = validObservation();
  browserOnly.evidence_refs = [{ kind: 'journey', id: 'browser-only', ref: 'browser://smoke' }];
  assert.match(validateKitchenObservation(browserOnly).join('\n'), /evidence_refs must include non-browser kitchen evidence/u);
});

test('production approval is not granted by an observation record alone', () => {
  const observation = validObservation();
  observation.disposition.status = 'production_approved';
  observation.disposition.approve_for_production = true;
  const errors = validateKitchenObservation(observation);
  assert.match(errors.join('\n'), /production_approved is not a valid kitchen observation disposition/u);
});


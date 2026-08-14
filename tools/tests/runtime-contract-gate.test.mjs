import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectRuntimeContract } from '../lib/runtime-contract-gate.mjs';

function completeInput() {
  return {
    recipe: {
      recipe_id: 'fixture-rice',
      source_refs: [{ url: 'https://example.test/recipe', title: 'Fixture', usage: 'approved' }],
    },
    runtime: {
      activation_status: 'active',
      action_profile_ref: { action_profile_id: 'fixture-actions', profile_version: 'v1' },
      safety_endpoints: [{ endpoint_code: 'poultry_fully_cooked', required: true }],
      equipment_contract: {
        vessel_type: 'rice_cooker',
        brand_or_family: 'Fixture',
        model: 'F-1',
        capacity: { value: 3, unit: 'L' },
        program: 'white_rice',
        boundary: 'use the named cooker only',
      },
      quantity_contract: {
        ingredients: [{ canonical_id: 'raw-rice', amount: { value: 300, unit: 'g' } }],
      },
      liquid_contract: { amount: { value: 450, unit: 'mL' } },
      time_contract: { total_minutes: 45 },
      step_contract: [{ step_id: 'start', action_code: 'add_and_cook' }],
    },
    actionProfile: { action_profile_id: 'fixture-actions', profile_version: 'v1', actions: [{ action_code: 'add_and_cook' }] },
  };
}

test('structured runtime contract accepts complete safety, equipment, quantity, liquid, time and steps', () => {
  const result = inspectRuntimeContract(completeInput());
  assert.deepEqual(result, { complete: true, reasons: [] });
});

test('free-text safety rules or an active runtime flag cannot satisfy the structured gate', () => {
  const input = completeInput();
  delete input.runtime.safety_endpoints;
  delete input.runtime.equipment_contract;
  input.recipe.safety_rules = ['加热至完全熟透'];
  const result = inspectRuntimeContract(input);
  assert.equal(result.complete, false);
  assert.ok(result.reasons.includes('safety_endpoints_missing'));
  assert.ok(result.reasons.includes('equipment_contract_missing'));
});

test('action profile and source contract must match the runtime entry', () => {
  const input = completeInput();
  input.runtime.action_profile_ref.profile_version = 'v2';
  input.recipe.source_refs = [];
  const result = inspectRuntimeContract(input);
  assert.equal(result.complete, false);
  assert.ok(result.reasons.includes('action_profile_ref_mismatch'));
  assert.ok(result.reasons.includes('source_contract_missing'));
});

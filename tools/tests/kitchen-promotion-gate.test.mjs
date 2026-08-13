import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateKitchenPromotion } from '../lib/kitchen-promotion-gate.mjs';

test('empty kitchen ledger cannot promote any runtime recipe', () => {
  const result = evaluateKitchenPromotion({
    runtimeCatalog: { entries: [{ recipe_id: 'chinese-congee', planner_runtime_eligible: true }] },
    observations: [],
    formalReview: { recipe_id: 'chinese-congee', reviewer_id: 'formal-reviewer', reviewed_at: '2026-08-13T12:00:00Z', approved: true },
  }, 'chinese-congee');
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes('kitchen_observation_missing'));
});

test('kitchen observation alone cannot promote without independent formal approval', () => {
  const observation = {
    observation_id: 'obs-1',
    recipe: { recipe_id: 'chinese-congee' },
    disposition: { status: 'kitchen_observed', reviewed_at: '2026-08-13T12:00:00Z', approve_for_production: false },
  };
  const result = evaluateKitchenPromotion({
    runtimeCatalog: { entries: [{ recipe_id: 'chinese-congee', planner_runtime_eligible: true }] },
    observations: [observation],
    formalReview: null,
  }, 'chinese-congee');
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes('independent_formal_approval_missing'));
});

test('promotion requires both observed kitchen evidence and independent approval', () => {
  const result = evaluateKitchenPromotion({
    runtimeCatalog: { entries: [{ recipe_id: 'chinese-congee', planner_runtime_eligible: true }] },
    observations: [{ observation_id: 'obs-1', recipe: { recipe_id: 'chinese-congee' }, disposition: { status: 'kitchen_observed', reviewed_at: '2026-08-13T12:00:00Z', approve_for_production: false } }],
    formalReview: { recipe_id: 'chinese-congee', reviewer_id: 'formal-reviewer', reviewed_at: '2026-08-13T12:00:00Z', approved: true },
    validatedObservationIds: ['obs-1'],
  }, 'chinese-congee');
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes('kitchen_observation_incomplete'));
});

test('formal promotion review must use a valid timestamp and explicit approval', () => {
  const result = evaluateKitchenPromotion({
    runtimeCatalog: { entries: [{ recipe_id: 'chinese-congee', planner_runtime_eligible: true }] },
    observations: [],
    formalReview: { recipe_id: 'chinese-congee', reviewer_id: 'formal-reviewer', reviewed_at: 'not-a-date', approved: 1 },
  }, 'chinese-congee');
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes('kitchen_observation_missing'));
  assert.ok(result.reasons.includes('independent_formal_approval_missing'));
});

test('runtime entry cannot be promoted when it already claims production approval', () => {
  const result = evaluateKitchenPromotion({
    runtimeCatalog: { entries: [{ recipe_id: 'chinese-congee', planner_runtime_eligible: true, production_approved: true }] },
    observations: [],
    formalReview: { recipe_id: 'chinese-congee', reviewer_id: 'formal-reviewer', reviewed_at: '2026-08-13T12:00:00Z', approved: true },
  }, 'chinese-congee');
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes('runtime_recipe_already_approved'));
});

test('promotion gate refuses a recipe when the observation points at a different runtime entry', () => {
  const result = evaluateKitchenPromotion({
    runtimeCatalog: { entries: [{ recipe_id: 'chinese-congee', planner_runtime_eligible: true }] },
    observations: [{
      observation_id: 'obs-wrong-recipe',
      recipe: { recipe_id: 'other-recipe' },
      disposition: { status: 'kitchen_observed', reviewed_at: '2026-08-13T12:00:00Z', approve_for_production: false },
    }],
    formalReview: { recipe_id: 'chinese-congee', reviewer_id: 'formal-reviewer', reviewed_at: '2026-08-13T12:00:00Z', approved: true },
  }, 'chinese-congee');
  assert.equal(result.allowed, false);
  assert.ok(result.reasons.includes('kitchen_observation_missing'));
});

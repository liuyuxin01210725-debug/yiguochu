import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as planner from '../../worker/src/planner-v2.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const readJson = name => JSON.parse(fs.readFileSync(path.join(here, '../data', name), 'utf8'));
const assets = Object.freeze({
  taxonomy: readJson('ingredient-taxonomy.v1.json'),
  templates: readJson('meal-templates.v2.json'),
  ratios: readJson('ratio-rules.v1.json'),
  recipes: readJson('recipe-library.json'),
});

function request({
  mode = 'pantry', intent = 'normal', must = [], prefer = [], dislikes = [], servings = 2,
  currentPlanId = null, recentPlanIds = [], decision = null,
} = {}) {
  return planner.normalizePlannerRequest({
    schema_version: 2,
    planner_version: 'pantry-planner-v2',
    constraints: {
      mode,
      intent,
      servings,
      must_use: must,
      prefer_use: prefer,
      dislikes,
      current_plan_id: currentPlanId,
      recent_plan_ids: recentPlanIds,
      decision,
    },
  });
}

function onlyTemplate(sourceAssets, templateId) {
  const clone = structuredClone(sourceAssets);
  for (const template of clone.templates.templates) {
    if (template.template_id !== templateId) {
      template.activation_status = 'planned';
      template.runtime_eligible = false;
    }
  }
  return clone;
}

const lockedPlan = Object.freeze({
  planner_version: 'pantry-planner-v2',
  template_catalog_version: 'templates-v2-test',
  mode: 'pantry',
  intent: 'normal',
  normalized_items: [
    { raw: '牛里脊', canonical: '牛肉', category: 'beef', shape_or_cut: 'tenderloin', recognized: true, role: 'must_use' },
    { raw: '熟米饭', canonical: '熟米饭', category: 'cooked_rice', shape_or_cut: 'whole', recognized: true, role: 'must_use' },
  ],
  plan: {
    plan_kind: 'single_pot',
    required_extra_items: [{ name: '水', canonical: '水', category: 'liquid', grams: 60 }],
    pots: [{
      meal_sequence: 1,
      template_id: 'beef-staple-pot',
      servings: 2,
      slot_assignment: {
        staple: [{ raw: '熟米饭', canonical: '熟米饭', category: 'cooked_rice', shape_or_cut: 'whole', source: 'user', role: 'must_use' }],
        protein: [{ raw: '牛里脊', canonical: '牛肉', category: 'beef', shape_or_cut: 'tenderloin', source: 'user', role: 'must_use' }],
      },
      ingredient_amounts: [{ name: '牛肉', grams: 240 }, { name: '熟米饭', grams: 400 }, { name: '水', grams: 60 }],
      required_extra_items: [{ name: '水', canonical: '水', category: 'liquid', grams: 60 }],
      liquid_constraints: { retained_liquid_grams: 60, rounding_grams: 5 },
      ratio_trace: [{ operator: 'ratio', denominator_slot_id: 'staple', multiplier: 0.15, matched_items: ['牛肉', '熟米饭'] }],
      safety_endpoints: [{ applies_to_category: 'beef', endpoint_code: 'beef_fully_cooked' }],
      time_range: { min_minutes: 15, max_minutes: 30 },
    }],
  },
});

function expectIdentityApi() {
  for (const name of ['canonicalPlanIdentityPayload', 'stableCanonicalJson', 'computePlanId', 'planMealWithIdentity', 'verifyPlanSnapshot']) {
    assert.equal(typeof planner[name], 'function', `${name} must be exported`);
  }
}

test('identity API is exposed without changing the synchronous planner API', () => {
  expectIdentityApi();
  assert.equal(typeof planner.planMeal, 'function');
  assert.equal(planner.planMeal(assets, request({ must: ['番茄'] })).status, 'complete');
});

test('plan ID ignores generated prose, UI facts, timestamps, plan ID itself and object insertion order', async () => {
  expectIdentityApi();
  const a = structuredClone(lockedPlan);
  a.generated = { dish_name: '甲', recommendation: '甲理由', steps: ['甲步骤'] };
  a.updated_at = '2026-07-24T00:00:00Z';
  a.plan.plan_id = 'caller-supplied';
  a.plan.pots[0].label = '第一锅';
  const b = JSON.parse(JSON.stringify({
    intent: lockedPlan.intent,
    plan: { ...structuredClone(lockedPlan.plan), ui_copy: '另一份文案' },
    normalized_items: structuredClone(lockedPlan.normalized_items),
    mode: lockedPlan.mode,
    template_catalog_version: lockedPlan.template_catalog_version,
    planner_version: lockedPlan.planner_version,
    generated: { dish_name: '乙', recommendation: '乙理由', steps: ['乙步骤'] },
  }));
  assert.equal(await planner.computePlanId(a), await planner.computePlanId(b));
});

test('plan IDs use exact unpadded Web-Crypto SHA-256 base64url form without Buffer dependency', async () => {
  expectIdentityApi();
  const originalBuffer = globalThis.Buffer;
  try {
    globalThis.Buffer = undefined;
    const id = await planner.computePlanId(lockedPlan);
    assert.match(id, /^pln_v2_[A-Za-z0-9_-]{43}$/);
    assert.equal(id.includes('='), false);
  } finally {
    globalThis.Buffer = originalBuffer;
  }
});

test('every declared identity fact changes the plan ID', async t => {
  expectIdentityApi();
  const baseId = await planner.computePlanId(lockedPlan);
  const changes = {
    planner_version: plan => { plan.planner_version = 'pantry-planner-v3'; },
    template_catalog_version: plan => { plan.template_catalog_version = 'templates-v2-next'; },
    mode: plan => { plan.mode = 'recommend'; },
    intent: plan => { plan.intent = 'quick'; },
    servings: plan => { plan.plan.pots[0].servings = 3; },
    normalized_raw_input: plan => { plan.normalized_items[0].raw = '牛柳'; },
    normalized_role: plan => { plan.normalized_items[0].role = 'prefer_use'; },
    template: plan => { plan.plan.pots[0].template_id = 'cooked-rice-stir-pot'; },
    slot_assignment: plan => { plan.plan.pots[0].slot_assignment.protein[0].shape_or_cut = 'sliced'; },
    ingredient_amount: plan => { plan.plan.pots[0].ingredient_amounts[0].grams += 5; },
    ratio_constraint: plan => { plan.plan.pots[0].ratio_trace[0].multiplier = 0.2; },
    liquid_constraint: plan => { plan.plan.pots[0].liquid_constraints.retained_liquid_grams += 5; },
    safety_endpoint: plan => { plan.plan.pots[0].safety_endpoints[0].endpoint_code = 'beef_endpoint_changed'; },
    pot_structure: plan => { plan.plan.pots.push({ ...structuredClone(plan.plan.pots[0]), meal_sequence: 2 }); },
    pot_sequence: plan => {
      plan.plan.pots.push({ ...structuredClone(plan.plan.pots[0]), template_id: 'cooked-rice-stir-pot', meal_sequence: 2 });
      plan.plan.pots[0].meal_sequence = 2;
      plan.plan.pots[1].meal_sequence = 1;
    },
  };
  for (const [name, mutate] of Object.entries(changes)) {
    await t.test(name, async () => {
      const changed = structuredClone(lockedPlan);
      mutate(changed);
      assert.notEqual(await planner.computePlanId(changed), baseId);
    });
  }
});

test('semantic set ordering is canonical while meal sequence remains meaningful', async () => {
  expectIdentityApi();
  const a = structuredClone(lockedPlan);
  const second = structuredClone(a.plan.pots[0]);
  second.meal_sequence = 2;
  second.template_id = 'cooked-rice-stir-pot';
  second.slot_assignment.protein[0].canonical = '鸡蛋';
  second.ingredient_amounts[0].name = '鸡蛋';
  a.plan.pots.push(second);
  a.normalized_items.reverse();
  a.plan.required_extra_items.push({ name: '油', canonical: '油', category: 'oil', grams: 10 });

  const reordered = structuredClone(a);
  reordered.normalized_items.reverse();
  reordered.plan.pots.reverse();
  reordered.plan.required_extra_items.reverse();
  for (const pot of reordered.plan.pots) {
    pot.safety_endpoints.reverse();
    pot.ingredient_amounts.reverse();
    pot.required_extra_items.reverse();
    pot.slot_assignment = Object.fromEntries(Object.entries(pot.slot_assignment).reverse());
  }
  assert.equal(await planner.computePlanId(a), await planner.computePlanId(reordered));

  const differentSequence = structuredClone(a);
  differentSequence.plan.pots[0].meal_sequence = 2;
  differentSequence.plan.pots[1].meal_sequence = 1;
  assert.notEqual(await planner.computePlanId(a), await planner.computePlanId(differentSequence));
});

test('identity-aware planning attaches plan_id without changing deterministic plan facts or using network/randomness', async () => {
  expectIdentityApi();
  const input = request({ must: ['番茄', '鸡蛋'] });
  const beforeAssets = structuredClone(assets);
  const beforeInput = structuredClone(input);
  const plain = planner.planMeal(assets, input);
  const originalFetch = globalThis.fetch;
  const originalRandom = Math.random;
  try {
    globalThis.fetch = () => { throw new Error('planner must not use network'); };
    Math.random = () => { throw new Error('planner must not use randomness'); };
    const identified = await planner.planMealWithIdentity(assets, input);
    assert.match(identified.plan.plan_id, /^pln_v2_[A-Za-z0-9_-]{43}$/);
    const stripped = structuredClone(identified);
    delete stripped.plan.plan_id;
    assert.deepEqual(stripped, plain);
  } finally {
    globalThis.fetch = originalFetch;
    Math.random = originalRandom;
  }
  assert.deepEqual(input, beforeInput);
  assert.deepEqual(assets, beforeAssets);
});

test('swap hard-excludes current plan and returns a real equal-promise Level 1 plan before Level 2', async () => {
  expectIdentityApi();
  const baseRequest = request({ must: ['番茄', '鸡蛋'] });
  const current = await planner.planMealWithIdentity(assets, baseRequest);
  const swapped = await planner.planMealWithIdentity(assets, { ...baseRequest, current_plan_id: current.plan.plan_id });
  assert.equal(swapped.status, 'complete');
  assert.equal(swapped.plan.coverage_ratio, 1);
  assert.notEqual(swapped.plan.plan_id, current.plan.plan_id);
  assert.notDeepEqual(swapped.plan.pots.map(pot => pot.template_id), current.plan.pots.map(pot => pot.template_id));
});

test('same-template different validated slot assignment is a Level 2 alternative', async () => {
  expectIdentityApi();
  const focusedAssets = onlyTemplate(assets, 'cooked-rice-stir-pot');
  const baseRequest = request({ mode: 'recommend', intent: 'quick', prefer: ['熟米饭', '鸡蛋', '牛里脊'] });
  const current = await planner.planMealWithIdentity(focusedAssets, baseRequest);
  const swapped = await planner.planMealWithIdentity(focusedAssets, { ...baseRequest, current_plan_id: current.plan.plan_id });
  assert.equal(swapped.status, 'ready');
  assert.deepEqual(swapped.plan.pots.map(pot => pot.template_id), current.plan.pots.map(pot => pot.template_id));
  assert.notDeepEqual(swapped.plan.pots.map(pot => pot.assignment_key), current.plan.pots.map(pot => pot.assignment_key));
  assert.notEqual(swapped.plan.plan_id, current.plan.plan_id);
});

test('pantry swap preserves complete coverage and recommend swap remains honest', async () => {
  expectIdentityApi();
  const pantryRequest = request({ must: ['牛里脊', '熟米饭'] });
  const pantryCurrent = await planner.planMealWithIdentity(assets, pantryRequest);
  const pantrySwap = await planner.planMealWithIdentity(assets, { ...pantryRequest, current_plan_id: pantryCurrent.plan.plan_id });
  assert.equal(pantrySwap.status, 'complete');
  assert.equal(pantrySwap.plan.coverage_ratio, 1);
  assert.deepEqual(pantrySwap.plan.unplanned_must_use, []);

  const recommendRequest = request({ mode: 'recommend', intent: 'quick', prefer: ['熟米饭', '鸡蛋', '牛里脊', '西兰花', '神秘叶子'] });
  const recommendCurrent = await planner.planMealWithIdentity(assets, recommendRequest);
  const recommendSwap = await planner.planMealWithIdentity(assets, { ...recommendRequest, current_plan_id: recommendCurrent.plan.plan_id });
  assert.equal(recommendSwap.status, 'ready');
  assert.ok(recommendSwap.plan.planned_prefer_use.some(item => item.recognized));
  assert.ok(recommendSwap.plan.unused_prefer_use.every(item => item.reason_code && item.reason));
});

test('recent IDs are soft demotion and never exhaust all valid alternatives', async () => {
  expectIdentityApi();
  const baseRequest = request({ mode: 'recommend', intent: 'quick', prefer: ['熟米饭', '鸡蛋', '牛里脊', '西兰花'] });
  const current = await planner.planMealWithIdentity(assets, baseRequest);
  const firstAlternative = await planner.planMealWithIdentity(assets, { ...baseRequest, current_plan_id: current.plan.plan_id });
  const nonRecent = await planner.planMealWithIdentity(assets, {
    ...baseRequest,
    current_plan_id: current.plan.plan_id,
    recent_plan_ids: [firstAlternative.plan.plan_id],
  });
  assert.notEqual(nonRecent.plan.plan_id, current.plan.plan_id);
  assert.notEqual(nonRecent.plan.plan_id, firstAlternative.plan.plan_id);

  const allAlternatives = [firstAlternative.plan.plan_id, nonRecent.plan.plan_id];
  const stillReturned = await planner.planMealWithIdentity(assets, {
    ...baseRequest,
    current_plan_id: current.plan.plan_id,
    recent_plan_ids: allAlternatives,
  });
  assert.equal(stillReturned.status, 'ready');
  assert.notEqual(stillReturned.plan.plan_id, current.plan.plan_id);
});

test('no equal-promise structure returns no_alternative_plan with the current plan and explicit paths', async () => {
  expectIdentityApi();
  const focusedAssets = onlyTemplate(assets, 'beef-staple-pot');
  const baseRequest = request({ must: ['牛里脊', '熟米饭'] });
  const current = await planner.planMealWithIdentity(focusedAssets, baseRequest);
  const result = await planner.planMealWithIdentity(focusedAssets, { ...baseRequest, current_plan_id: current.plan.plan_id });
  assert.equal(result.status, 'no_alternative_plan');
  assert.equal(result.code, 'no_alternative_plan');
  assert.equal(result.generation_allowed, false);
  assert.equal(result.message, '当前组合只有一个可靠的一锅方案');
  assert.equal(result.plan.plan_id, current.plan.plan_id);
  assert.deepEqual(result.normalized_items, current.normalized_items);
  assert.deepEqual(result.actions.map(action => action.action), ['relax_item', 'force_multi_pot', 'edit_ingredients']);
  assert.deepEqual(result.actions[0].eligible_items, ['牛肉', '熟米饭']);
  assert.equal(result.actions[0].requires_acknowledgement, true);
  assert.ok(result.actions.every(action => Array.isArray(action.unplanned_items)));
});

test('snapshot verification recomputes authoritative membership and never trusts prose or a naked ID', async () => {
  expectIdentityApi();
  const baseRequest = request({ must: ['番茄', '鸡蛋'] });
  const current = await planner.planMealWithIdentity(assets, baseRequest);
  const snapshot = {
    plan_id: current.plan.plan_id,
    planner_version: current.planner_version,
    template_catalog_version: current.template_catalog_version,
    dish_name: '伪造菜名',
  };
  const verified = await planner.verifyPlanSnapshot(assets, baseRequest, snapshot);
  assert.equal(verified.status, 'complete');
  assert.equal(verified.plan.plan_id, current.plan.plan_id);

  for (const [name, changedRequest, changedSnapshot] of [
    ['catalog', baseRequest, { ...snapshot, template_catalog_version: 'templates-next' }],
    ['planner', baseRequest, { ...snapshot, planner_version: 'planner-next' }],
    ['naked-id', baseRequest, { plan_id: snapshot.plan_id }],
    ['servings', { ...baseRequest, servings: 3 }, snapshot],
    ['intent', { ...baseRequest, intent: 'fresh' }, snapshot],
    ['dislike', { ...baseRequest, dislikes: ['鸡蛋'] }, snapshot],
    ['role', { ...baseRequest, mode: 'recommend', must_use: [], prefer_use: ['番茄', '鸡蛋'] }, snapshot],
    ['ingredient', { ...baseRequest, must_use: ['番茄'] }, snapshot],
  ]) {
    const stale = await planner.verifyPlanSnapshot(assets, changedRequest, changedSnapshot);
    assert.equal(stale.status, 'stale_plan', name);
    assert.equal(stale.code, 'stale_plan', name);
    assert.equal(stale.generation_allowed, false, name);
    assert.equal(stale.message, '计划规则或输入已经变化，请重新规划。', name);
    assert.deepEqual(stale.actions, [{
      action: 'replan',
      label: '重新规划',
      eligible_items: [],
      requires_acknowledgement: false,
      unplanned_items: [],
    }], name);
  }
});

test('an alternative snapshot is valid membership for the same authoritative input', async () => {
  expectIdentityApi();
  const baseRequest = request({ must: ['番茄', '鸡蛋'] });
  const current = await planner.planMealWithIdentity(assets, baseRequest);
  const alternative = await planner.planMealWithIdentity(assets, { ...baseRequest, current_plan_id: current.plan.plan_id });
  const verified = await planner.verifyPlanSnapshot(assets, baseRequest, {
    plan_id: alternative.plan.plan_id,
    planner_version: alternative.planner_version,
    template_catalog_version: alternative.template_catalog_version,
  });
  assert.equal(verified.plan.plan_id, alternative.plan.plan_id);
});

test('accept_partial current_plan_id remains a decision acknowledgement rather than being misread as swap', async () => {
  expectIdentityApi();
  const baseRequest = request({ must: ['番茄', '鸡蛋', '神秘叶子'] });
  const current = await planner.planMealWithIdentity(assets, baseRequest);
  assert.equal(current.status, 'needs_user_decision');
  const accepted = await planner.planMealWithIdentity(assets, {
    ...baseRequest,
    current_plan_id: current.plan.plan_id,
    decision: {
      action: 'accept_partial',
      plan_id: current.plan.plan_id,
      acknowledged_unplanned: ['神秘叶子'],
    },
  });
  assert.equal(accepted.status, 'partial_accepted');
  assert.equal(accepted.generation_allowed, true);
  assert.deepEqual(accepted.plan.unplanned_must_use.map(item => item.raw), ['神秘叶子']);
  assert.match(accepted.plan.plan_id, /^pln_v2_[A-Za-z0-9_-]{43}$/);
});

test('accept_partial rejects a client-forged self-consistent ID and validates swap_current shape', async () => {
  expectIdentityApi();
  const baseRequest = request({ must: ['番茄', '鸡蛋', '神秘叶子'] });
  await assert.rejects(() => planner.planMealWithIdentity(assets, {
    ...baseRequest,
    current_plan_id: 'pln_v2_forged',
    decision: {
      action: 'accept_partial',
      plan_id: 'pln_v2_forged',
      acknowledged_unplanned: ['神秘叶子'],
    },
  }), error => error?.code === 'invalid_planner_request');

  for (const decision of [
    { action: 'accept_partial', plan_id: 'x', acknowledged_unplanned: [], swap_current: 'yes' },
    { action: 'edit_ingredients', swap_current: false },
    { action: 'force_multi_pot', swap_current: true },
  ]) {
    assert.throws(() => planner.normalizePlannerRequest({
      schema_version: 2,
      planner_version: 'pantry-planner-v2',
      constraints: { mode: 'pantry', intent: 'normal', servings: 2, must_use: ['番茄'], prefer_use: [], dislikes: [], decision },
    }), error => error?.code === 'invalid_planner_request');
  }
});

test('verifyPlanSnapshot safely verifies an accepted-partial request without trusting cleared current ID', async () => {
  expectIdentityApi();
  const baseRequest = request({ must: ['番茄', '鸡蛋', '神秘叶子'] });
  const current = await planner.planMealWithIdentity(assets, baseRequest);
  const acceptedRequest = {
    ...baseRequest,
    current_plan_id: current.plan.plan_id,
    decision: {
      action: 'accept_partial',
      plan_id: current.plan.plan_id,
      acknowledged_unplanned: ['神秘叶子'],
    },
  };
  const accepted = await planner.planMealWithIdentity(assets, acceptedRequest);
  const verified = await planner.verifyPlanSnapshot(assets, acceptedRequest, {
    plan_id: accepted.plan.plan_id,
    planner_version: accepted.planner_version,
    template_catalog_version: accepted.template_catalog_version,
  });
  assert.equal(verified.status, 'partial_accepted');
  assert.equal(verified.plan.plan_id, accepted.plan.plan_id);
});

test('accepted-partial active swap returns stale_plan when the acknowledged input has changed', async () => {
  expectIdentityApi();
  const baseRequest = request({ must: ['番茄', '鸡蛋', '神秘叶子'], servings: 2 });
  const current = await planner.planMealWithIdentity(assets, baseRequest);
  const acceptance = {
    action: 'accept_partial',
    plan_id: current.plan.plan_id,
    acknowledged_unplanned: ['神秘叶子'],
    swap_current: true,
  };

  const changedRequest = request({ must: ['番茄', '鸡蛋', '神秘叶子'], servings: 3 });
  const result = await planner.planMealWithIdentity(assets, {
    ...changedRequest,
    current_plan_id: current.plan.plan_id,
    decision: acceptance,
  });
  assert.equal(result.status, 'stale_plan');
  assert.equal(result.code, 'stale_plan');
});

test('large partial pantry swap keeps the validated two-pot coverage instead of falling back to a greedy single pot', async () => {
  expectIdentityApi();
  const pantry = ['大米', '熟米饭', '面条', '番茄', '鸡蛋', '老豆腐', '牛里脊', '鸡胸肉', '猪里脊', '白菜', '西兰花', '青菜', '胡萝卜', '土豆', '金针菇', '香菇'];
  const baseRequest = request({ must: pantry, decision: { action: 'allow_third_pot' } });
  const current = await planner.planMealWithIdentity(assets, baseRequest);
  assert.equal(current.status, 'needs_user_decision');
  assert.equal(current.plan.pots.length, 2);
  assert.equal(current.plan.planned_must_use.length, 10);

  const swapped = await planner.planMealWithIdentity(assets, { ...baseRequest, current_plan_id: current.plan.plan_id });
  assert.equal(swapped.status, 'needs_user_decision');
  assert.ok(swapped.plan.planned_must_use.length >= current.plan.planned_must_use.length);
  assert.notEqual(swapped.plan.plan_id, current.plan.plan_id);
  assert.ok(swapped.plan.pots.length <= 2);

  const swappedAgain = await planner.planMealWithIdentity(assets, { ...baseRequest, current_plan_id: swapped.plan.plan_id });
  assert.notEqual(swappedAgain.status, 'stale_plan');
  assert.ok(swappedAgain.plan.planned_must_use.length >= swapped.plan.planned_must_use.length);
  assert.notEqual(swappedAgain.plan.plan_id, swapped.plan.plan_id);

  const verifiedAlternative = await planner.verifyPlanSnapshot(assets, baseRequest, {
    plan_id: swapped.plan.plan_id,
    planner_version: swapped.planner_version,
    template_catalog_version: swapped.template_catalog_version,
  });
  assert.notEqual(verifiedAlternative.status, 'stale_plan');
  assert.equal(verifiedAlternative.plan.plan_id, swapped.plan.plan_id);
});

test('partial acceptance can explicitly swap while preserving its acknowledged unplanned set', async () => {
  expectIdentityApi();
  const pantry = ['大米', '熟米饭', '面条', '番茄', '鸡蛋', '老豆腐', '牛里脊', '鸡胸肉', '猪里脊', '白菜', '西兰花', '青菜', '胡萝卜', '土豆', '金针菇', '香菇'];
  const baseRequest = request({ must: pantry, decision: { action: 'allow_third_pot' } });
  const current = await planner.planMealWithIdentity(assets, baseRequest);
  const acknowledged = current.plan.unplanned_must_use.map(item => item.canonical || item.raw);
  const acceptance = {
    action: 'accept_partial',
    plan_id: current.plan.plan_id,
    acknowledged_unplanned: acknowledged,
  };
  const accepted = await planner.planMealWithIdentity(assets, { ...baseRequest, current_plan_id: current.plan.plan_id, decision: acceptance });
  assert.equal(accepted.status, 'partial_accepted');
  const swapped = await planner.planMealWithIdentity(assets, {
    ...baseRequest,
    current_plan_id: accepted.plan.plan_id,
    decision: { ...acceptance, swap_current: true },
  });
  assert.equal(swapped.status, 'partial_accepted');
  assert.equal(swapped.generation_allowed, true);
  assert.notEqual(swapped.plan.plan_id, accepted.plan.plan_id);
  const originalUnplanned = new Set(acknowledged);
  assert.ok(swapped.plan.unplanned_must_use.every(item => originalUnplanned.has(item.canonical || item.raw)));

  const swappedAgain = await planner.planMealWithIdentity(assets, {
    ...baseRequest,
    current_plan_id: swapped.plan.plan_id,
    decision: { ...acceptance, swap_current: true },
  });
  assert.equal(swappedAgain.status, 'partial_accepted');
  assert.equal(swappedAgain.generation_allowed, true);
  assert.notEqual(swappedAgain.plan.plan_id, swapped.plan.plan_id);
  assert.ok(swappedAgain.plan.unplanned_must_use.every(item => originalUnplanned.has(item.canonical || item.raw)));

  const historyDemoted = await planner.planMealWithIdentity(assets, {
    ...baseRequest,
    current_plan_id: accepted.plan.plan_id,
    recent_plan_ids: [swapped.plan.plan_id],
    decision: { ...acceptance, swap_current: true },
  });
  assert.equal(historyDemoted.status, 'partial_accepted');
  assert.notEqual(historyDemoted.plan.plan_id, swapped.plan.plan_id);
});

test('ordinary small two-pot partial alternative is authoritative snapshot membership', async () => {
  expectIdentityApi();
  const baseRequest = request({ must: ['大米', '番茄', '神秘叶子'] });
  const current = await planner.planMealWithIdentity(assets, baseRequest);
  assert.equal(current.status, 'needs_user_decision');
  const swapped = await planner.planMealWithIdentity(assets, { ...baseRequest, current_plan_id: current.plan.plan_id });
  assert.equal(swapped.status, 'needs_user_decision');
  assert.equal(swapped.plan.pots.length, 2);
  assert.equal(swapped.plan.planned_must_use.length, current.plan.planned_must_use.length);
  const verified = await planner.verifyPlanSnapshot(assets, baseRequest, {
    plan_id: swapped.plan.plan_id,
    planner_version: swapped.planner_version,
    template_catalog_version: swapped.template_catalog_version,
  });
  assert.notEqual(verified.status, 'stale_plan');
  assert.equal(verified.plan.plan_id, swapped.plan.plan_id);
});

test('no-alternative relax_item action can explicitly downgrade a planned must-use item and replan', async () => {
  expectIdentityApi();
  const focusedAssets = onlyTemplate(assets, 'beef-staple-pot');
  const baseRequest = request({ must: ['牛里脊', '熟米饭'] });
  const current = await planner.planMealWithIdentity(focusedAssets, baseRequest);
  const noAlternative = await planner.planMealWithIdentity(focusedAssets, { ...baseRequest, current_plan_id: current.plan.plan_id });
  assert.equal(noAlternative.status, 'no_alternative_plan');
  assert.ok(noAlternative.actions.find(action => action.action === 'relax_item').eligible_items.includes('牛肉'));

  const replanned = await planner.planMealWithIdentity(focusedAssets, {
    ...baseRequest,
    current_plan_id: current.plan.plan_id,
    decision: { action: 'relax_item', item: '牛肉' },
  });
  assert.notEqual(replanned.status, 'stale_plan');
  assert.equal(replanned.normalized_items.find(item => item.canonical === '牛肉').role, 'prefer_use');
  assert.equal(replanned.plan.unplanned_must_use.some(item => item.canonical === '牛肉'), false);
});

test('16/20-item identity planning and active swap are deterministic, bounded, non-mutating and under five seconds per call', async () => {
  expectIdentityApi();
  const pantry = ['大米', '熟米饭', '面条', '番茄', '鸡蛋', '老豆腐', '牛里脊', '鸡胸肉', '猪里脊', '白菜', '西兰花', '青菜', '胡萝卜', '土豆', '金针菇', '香菇', '洋葱', '南瓜', '豆角', '黄瓜'];
  for (const size of [16, 20]) {
    const input = request({ must: pantry.slice(0, size), decision: { action: 'allow_third_pot' } });
    const before = structuredClone(input);
    let started = performance.now();
    const first = await planner.planMealWithIdentity(assets, input);
    assert.ok(performance.now() - started < 5000, `${size}-item planning should stay under five seconds`);
    started = performance.now();
    const second = await planner.planMealWithIdentity(assets, input);
    assert.ok(performance.now() - started < 5000, `${size}-item repeated planning should stay under five seconds`);
    assert.equal(first.plan.plan_id, second.plan.plan_id);
    assert.ok(first.plan.pots.length <= 3);
    started = performance.now();
    const swapped = await planner.planMealWithIdentity(assets, { ...input, current_plan_id: first.plan.plan_id });
    assert.ok(performance.now() - started < 5000, `${size}-item swap should stay under five seconds`);
    assert.ok(['needs_user_decision', 'no_alternative_plan'].includes(swapped.status));
    assert.ok(swapped.plan.pots.length <= 3);
    assert.deepEqual(input, before);
  }
});

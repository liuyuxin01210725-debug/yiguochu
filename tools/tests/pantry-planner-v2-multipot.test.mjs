import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computePlanId, normalizePlannerRequest, planMeal } from '../../worker/src/planner-v2.js';
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
  currentPlanId = null, decision = null,
} = {}) {
  return normalizePlannerRequest({
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
      recent_plan_ids: [],
      decision,
    },
  });
}

const plannedCanonicals = result => result.plan.planned_must_use.map(item => item.canonical);
const action = (result, name) => result.actions.find(entry => entry.action === name);

test('a real pantry that needs two independent meals completes as an ordered two-pot plan', () => {
  const result = planMeal(assets, request({ must: ['大米', '熟米饭', '番茄'] }));

  assert.equal(result.status, 'complete');
  assert.equal(result.generation_allowed, true);
  assert.equal(result.plan.plan_kind, 'multi_pot');
  assert.equal(result.plan.pots.length, 2);
  assert.deepEqual(result.plan.pots.map(pot => pot.meal_sequence), [1, 2]);
  assert.deepEqual(result.plan.pots.map(pot => pot.label), ['第一锅', '第二锅']);
  assert.ok(result.plan.pots.every(pot => pot.servings === 2));
  assert.ok(result.plan.pots.every(pot => !('unplanned_must_use' in pot) && !('unused_prefer_use' in pot)));
  assert.deepEqual(new Set(plannedCanonicals(result)), new Set(['大米', '熟米饭', '番茄']));
  assert.deepEqual(result.plan.unplanned_must_use, []);
  assert.equal(result.plan.coverage_ratio, 1);
});

test('when only three pots can cover everything the default keeps two pots and asks permission', () => {
  const must = ['大米', '熟米饭', '面条', '番茄', '洋葱'];
  const result = planMeal(assets, request({ must }));

  assert.equal(result.status, 'needs_user_decision');
  assert.equal(result.generation_allowed, false);
  assert.equal(result.plan.plan_kind, 'multi_pot');
  assert.equal(result.plan.pots.length, 2);
  assert.ok(result.plan.unplanned_must_use.length > 0);
  assert.ok(result.plan.unplanned_must_use.every(item => item.reason_code === 'third_pot_required'));
  assert.deepEqual(action(result, 'allow_third_pot'), {
    action: 'allow_third_pot',
    label: '需要第三锅才能全部安排',
    eligible_items: [],
    requires_acknowledgement: true,
    unplanned_items: result.plan.unplanned_must_use.map(item => item.canonical || item.raw),
    potential_full_coverage: true,
    additional_meals: 1,
  });
});

test('explicit third-pot acknowledgement reruns the same real journey and completes with at most three meals', () => {
  const must = ['大米', '熟米饭', '面条', '番茄', '洋葱'];
  const result = planMeal(assets, request({ must, decision: { action: 'allow_third_pot', plan_id: 'transition-only' } }));

  assert.equal(result.status, 'complete');
  assert.equal(result.generation_allowed, true);
  assert.equal(result.plan.pots.length, 3);
  assert.deepEqual(result.plan.pots.map(pot => pot.meal_sequence), [1, 2, 3]);
  assert.deepEqual(result.plan.pots.map(pot => pot.label), ['第一锅', '第二锅', '第三锅']);
  assert.equal(result.plan.coverage_ratio, 1);
  assert.deepEqual(result.plan.unplanned_must_use, []);
});

test('a sixteen-item recognized pantry exceeds three-pot capacity without hiding the partial work', () => {
  const must = ['大米', '熟米饭', '面条', '番茄', '鸡蛋', '老豆腐', '牛里脊', '鸡胸肉', '猪里脊', '白菜', '西兰花', '青菜', '胡萝卜', '土豆', '金针菇', '香菇'];
  const result = planMeal(assets, request({ must, decision: { action: 'allow_third_pot' } }));

  assert.equal(result.status, 'needs_user_decision');
  assert.equal(result.generation_allowed, false);
  assert.ok(result.plan.pots.length > 0 && result.plan.pots.length <= 2);
  assert.equal(result.plan.rejection_reason.reason_code, 'plan_capacity_exceeded');
  assert.ok(result.plan.unplanned_must_use.length > 0);
  assert.equal(result.plan.pots.length, 2);
  assert.equal(result.plan.planned_must_use.length, 10);
  const assigned = result.plan.pots.flatMap(pot => pot.planned_must_use.map(item => item.canonical));
  assert.equal(new Set(assigned).size, assigned.length);
  assert.ok(result.plan.unplanned_must_use.every(item => item.reason_code === 'plan_capacity_exceeded'
    || ['unsupported_shape_or_cut', 'allergen_conflict', 'time_constraint', 'incompatible_combination', 'safety_constraint'].includes(item.reason_code)));
  assert.equal(action(result, 'allow_third_pot'), undefined);
});

test('partial-search variants also expose the known disjoint acid-plus-beef two-pot cover', () => {
  const must = ['大米', '番茄', '鸡蛋', '胡萝卜', '金针菇', '面条', '牛里脊', '白菜'];
  const result = planMeal(assets, request({ must }));

  assert.equal(result.status, 'complete');
  assert.equal(result.plan.pots.length, 2);
  assert.equal(result.plan.coverage_ratio, 1);
  assert.deepEqual(new Set(plannedCanonicals(result)), new Set(['大米', '番茄', '鸡蛋', '胡萝卜', '金针菇', '面条', '牛肉', '白菜']));
});

test('partial planning preserves its capacity response for the full twenty-item request limit', () => {
  const must = ['大米', '熟米饭', '面条', '番茄', '鸡蛋', '老豆腐', '嫩豆腐', '牛里脊', '鸡胸肉', '猪里脊', '白菜', '西兰花', '青菜', '豆角', '黄瓜', '洋葱', '胡萝卜', '土豆', '金针菇', '香菇'];
  const result = planMeal(assets, request({ must, decision: { action: 'allow_third_pot' } }));

  assert.equal(result.status, 'needs_user_decision');
  assert.ok(result.plan.pots.length > 0 && result.plan.pots.length <= 2);
  assert.equal(result.plan.rejection_reason?.reason_code, 'plan_capacity_exceeded');
  assert.ok(result.plan.unplanned_must_use.some(item => item.reason_code === 'plan_capacity_exceeded'));
  assert.equal(new Set(result.plan.pots.flatMap(pot => pot.planned_must_use.map(item => item.canonical))).size,
    result.plan.planned_must_use.length);
});

test('the real twenty-item capacity journey exposes private deterministic diagnostics without changing its plan', () => {
  const must = ['大米', '熟米饭', '面条', '番茄', '鸡蛋', '老豆腐', '嫩豆腐', '牛里脊', '鸡胸肉', '猪里脊', '白菜', '西兰花', '青菜', '豆角', '黄瓜', '洋葱', '胡萝卜', '土豆', '金针菇', '香菇'];
  const input = request({ must, decision: { action: 'allow_third_pot' } });
  const withoutDiagnostics = planMeal(assets, input);
  assert.equal(typeof planner.planMealWithDiagnostics, 'function');
  const { result: withDiagnostics, diagnostics } = planner.planMealWithDiagnostics(assets, input);

  assert.deepEqual(withDiagnostics, withoutDiagnostics);
  assert.equal(withDiagnostics.status, 'needs_user_decision');
  assert.equal(withDiagnostics.plan.rejection_reason?.reason_code, 'plan_capacity_exceeded');
  assert.ok(withDiagnostics.plan.pots.length > 0 && withDiagnostics.plan.pots.length <= 2);
  assert.equal(diagnostics.capacity_short_circuit, true);
  assert.equal(diagnostics.exact_search_calls, 0);
  assert.equal(diagnostics.partial_search_max_depth, 2);
  assert.ok(Number.isInteger(diagnostics.valid_candidate_count) && diagnostics.valid_candidate_count > 0 && diagnostics.valid_candidate_count <= 5000);
  assert.ok(Number.isInteger(diagnostics.unique_user_mask_count) && diagnostics.unique_user_mask_count > 0 && diagnostics.unique_user_mask_count <= 3000);
  assert.ok(Number.isInteger(diagnostics.partial_pair_checks) && diagnostics.partial_pair_checks > 0 && diagnostics.partial_pair_checks <= 500000);
});

test('each diagnostics wrapper call owns fresh counters for its real planner request', () => {
  const capacityMust = ['大米', '熟米饭', '面条', '番茄', '鸡蛋', '老豆腐', '嫩豆腐', '牛里脊', '鸡胸肉', '猪里脊', '白菜', '西兰花', '青菜', '豆角', '黄瓜', '洋葱', '胡萝卜', '土豆', '金针菇', '香菇'];
  assert.equal(typeof planner.planMealWithDiagnostics, 'function');
  const capacity = planner.planMealWithDiagnostics(assets, request({ must: capacityMust, decision: { action: 'allow_third_pot' } }));
  const { result, diagnostics } = planner.planMealWithDiagnostics(assets, request({ must: ['番茄', '鸡蛋'] }));

  assert.equal(capacity.diagnostics.capacity_short_circuit, true);
  assert.equal(result.status, 'complete');
  assert.deepEqual(diagnostics, {
    exact_search_calls: 2,
    partial_search_max_depth: 0,
    valid_candidate_count: 10,
    unique_user_mask_count: 0,
    partial_pair_checks: 0,
    capacity_short_circuit: false,
  });
});

test('planMeal ignores a hostile third argument without accessing it or changing plan facts or identity', async () => {
  const input = request({ must: ['番茄', '鸡蛋'] });
  const baseline = planMeal(assets, input);
  const baselinePlanId = await computePlanId(baseline);
  let accesses = 0;
  const hostile = new Proxy({}, {
    get() { accesses += 1; throw new Error('third argument must not be read'); },
    set() { accesses += 1; throw new Error('third argument must not be written'); },
    ownKeys() { accesses += 1; throw new Error('third argument must not be enumerated'); },
  });
  const result = planMeal(assets, input, hostile);

  assert.equal(accesses, 0);
  assert.deepEqual(result, baseline);
  assert.equal(await computePlanId(result), baselinePlanId);
});

test('aggregate capacity is never blamed for an unsupported cut or an allergen conflict', () => {
  for (const raw of ['牛腩', '牛肉末']) {
    const result = planMeal(assets, request({ must: ['番茄', raw] }));
    assert.notEqual(result.plan.rejection_reason?.reason_code, 'plan_capacity_exceeded', raw);
    assert.equal(result.plan.unplanned_must_use.find(item => item.raw === raw)?.reason_code, 'unsupported_shape_or_cut', raw);
  }
  const allergy = planMeal(assets, request({ must: ['番茄', '鸡蛋'], dislikes: ['鸡蛋'] }));
  assert.notEqual(allergy.plan.rejection_reason?.reason_code, 'plan_capacity_exceeded');
  assert.equal(allergy.plan.unplanned_must_use.find(item => item.canonical === '鸡蛋')?.reason_code, 'allergen_conflict');
});

test('multi-pot search can omit an optional egg from one recompiled candidate to expose a valid two-pot plan', () => {
  const result = planMeal(assets, request({ must: ['大米', '面条', '鸡蛋'] }));

  assert.equal(result.status, 'complete');
  assert.equal(result.plan.plan_kind, 'multi_pot');
  assert.equal(result.plan.pots.length, 2);
  assert.equal(result.plan.pots.filter(pot => pot.planned_must_use.some(item => item.canonical === '鸡蛋')).length, 1);
  assert.deepEqual(new Set(plannedCanonicals(result)), new Set(['大米', '面条', '鸡蛋']));
});

test('three staple meals share an optional egg once and still respect the third-pot decision gate', () => {
  const must = ['大米', '熟米饭', '面条', '鸡蛋'];
  const initial = planMeal(assets, request({ must }));
  assert.equal(initial.status, 'needs_user_decision');
  assert.equal(initial.plan.pots.length, 2);
  assert.equal(action(initial, 'allow_third_pot')?.potential_full_coverage, true);

  const accepted = planMeal(assets, request({ must, decision: { action: 'allow_third_pot' } }));
  assert.equal(accepted.status, 'complete');
  assert.equal(accepted.plan.pots.length, 3);
  assert.equal(accepted.plan.pots.filter(pot => pot.planned_must_use.some(item => item.canonical === '鸡蛋')).length, 1);
  assert.deepEqual(new Set(plannedCanonicals(accepted)), new Set(must));
});

test('a deduplicated canonical user ingredient belongs to only one pot and basic extras do not count as assignments', () => {
  const result = planMeal(assets, request({ must: ['大米', '熟米饭', '番茄'] }));
  const assigned = result.plan.pots.flatMap(pot => pot.planned_must_use.map(item => item.canonical));
  assert.equal(new Set(assigned).size, assigned.length);
  assert.equal(result.plan.pots.flatMap(pot => pot.required_extra_items).some(extra => assigned.includes(extra.name)), false);
});

test('each pot is an independent meal with sequential remaining facts and quick constrains every pot', () => {
  const result = planMeal(assets, request({ intent: 'quick', must: ['大米', '熟米饭', '面条'] }));

  assert.equal(result.status, 'needs_user_decision');
  assert.ok(result.plan.pots.length >= 1 && result.plan.pots.length <= 2);
  assert.ok(result.plan.pots.every(pot => pot.servings === 2 && pot.time_range.max_minutes <= 30));
  for (const [index, pot] of result.plan.pots.entries()) {
    assert.equal(pot.meal_sequence, index + 1);
    assert.equal(pot.label, `第${['一', '二', '三'][index]}锅`);
    assert.ok(Array.isArray(pot.remaining_must_use_after));
  }
  const lastRemaining = result.plan.pots.at(-1).remaining_must_use_after.map(item => item.canonical || item.raw);
  assert.deepEqual(lastRemaining.sort(), result.plan.unplanned_must_use.map(item => item.canonical || item.raw).sort());
});

test('partial pantry plans retain pots, specific reasons, and complete structured decision actions', () => {
  const result = planMeal(assets, request({ must: ['番茄', '鸡蛋', '神秘叶子'] }));

  assert.equal(result.status, 'needs_user_decision');
  assert.equal(result.generation_allowed, false);
  assert.ok(result.plan.pots.length > 0);
  assert.deepEqual(result.plan.unplanned_must_use.map(item => item.reason_code), ['unrecognized_ingredient']);
  for (const name of ['relax_item', 'edit_ingredients', 'accept_partial']) {
    const entry = action(result, name);
    assert.ok(entry, name);
    assert.deepEqual(Object.keys(entry).sort(), ['action', 'eligible_items', 'label', 'requires_acknowledgement', 'unplanned_items'].sort());
    assert.deepEqual(entry.unplanned_items, ['神秘叶子']);
  }
});

test('relax_item moves only an eligible chosen item to prefer-use and replans without leaving pantry mode', () => {
  const result = planMeal(assets, request({
    must: ['番茄', '鸡蛋', '神秘叶子'],
    decision: { action: 'relax_item', item: '神秘叶子' },
  }));

  assert.equal(result.mode, 'pantry');
  assert.equal(result.status, 'complete');
  assert.equal(result.plan.coverage_ratio, 1);
  assert.equal(result.normalized_items.find(item => item.raw === '神秘叶子').role, 'prefer_use');
  assert.equal(result.plan.unused_prefer_use.find(item => item.raw === '神秘叶子').reason_code, 'unrecognized_ingredient');

  assert.throws(() => planMeal(assets, request({
    must: ['番茄', '鸡蛋', '神秘叶子'],
    decision: { action: 'relax_item', item: '番茄' },
  })), error => error?.code === 'invalid_planner_request');
});

test('edit_ingredients preserves input facts and assets and never enables generation', () => {
  const assetsBefore = structuredClone(assets);
  const input = request({ must: ['番茄', '鸡蛋', '神秘叶子'], decision: { action: 'edit_ingredients' } });
  const inputBefore = structuredClone(input);
  const result = planMeal(assets, input);

  assert.equal(result.status, 'needs_user_decision');
  assert.equal(result.generation_allowed, false);
  assert.deepEqual(result.normalized_items.map(item => item.raw), ['番茄', '鸡蛋', '神秘叶子']);
  assert.match(result.commitment, /已保留.*食材/);
  assert.deepEqual(input, inputBefore);
  assert.deepEqual(assets, assetsBefore);
});

test('accept_partial requires exact transitional plan identity and exact unplanned acknowledgement', () => {
  const base = { must: ['番茄', '鸡蛋', '神秘叶子'], currentPlanId: 'current-transition-plan' };
  for (const decision of [
    { action: 'accept_partial', plan_id: '' , acknowledged_unplanned: ['神秘叶子'] },
    { action: 'accept_partial', plan_id: 'wrong', acknowledged_unplanned: ['神秘叶子'] },
    { action: 'accept_partial', plan_id: 'current-transition-plan', acknowledged_unplanned: [] },
  ]) {
    assert.throws(() => planMeal(assets, request({ ...base, decision })), error => error?.code === 'invalid_planner_request');
  }

  const result = planMeal(assets, request({
    ...base,
    decision: {
      action: 'accept_partial',
      plan_id: 'current-transition-plan',
      acknowledged_unplanned: ['神秘叶子'],
    },
  }));
  assert.equal(result.status, 'partial_accepted');
  assert.equal(result.generation_allowed, true);
  assert.deepEqual(result.plan.unplanned_must_use.map(item => item.raw), ['神秘叶子']);
  assert.match(result.commitment, /部分处理方案/);
  assert.doesNotMatch(JSON.stringify(result), /完整清库存计划|全部安排完成/);
});

test('force_multi_pot never weakens pantry coverage or fabricates a different result', () => {
  const must = ['番茄', '鸡蛋'];
  const normal = planMeal(assets, request({ must }));
  const forced = planMeal(assets, request({ must, decision: { action: 'force_multi_pot' } }));

  assert.equal(normal.status, 'complete');
  assert.equal(forced.status, 'complete');
  assert.equal(forced.plan.coverage_ratio, 1);
  assert.ok(forced.plan.pots.length === 1 || forced.plan.pots.length === 2);
  if (forced.plan.pots.length === 2) {
    assert.notDeepEqual(forced.plan.pots.map(pot => [pot.template_id, pot.assignment_key]), normal.plan.pots.map(pot => [pot.template_id, pot.assignment_key]));
  }
});

test('ordinary pantry never adds an independent meal only to consume prefer-use', () => {
  const journeys = [
    { must: ['熟米饭', '神秘叶子'], prefer: ['大米'] },
    { must: ['大米', '神秘叶子'], prefer: ['熟米饭'] },
    { must: ['牛里脊', '神秘叶子'], prefer: ['鸡胸肉'] },
  ];
  for (const journey of journeys) {
    const withoutPrefer = planMeal(assets, request({ must: journey.must }));
    const withPrefer = planMeal(assets, request(journey));
    assert.equal(withPrefer.plan.pots.length, withoutPrefer.plan.pots.length, JSON.stringify(journey));
    assert.equal(withPrefer.plan.pots.length, 0, JSON.stringify(journey));
    assert.equal(withPrefer.plan.planned_must_use.length, withoutPrefer.plan.planned_must_use.length, JSON.stringify(journey));
    assert.equal(withPrefer.plan.planned_prefer_use.length, 0, JSON.stringify(journey));
  }
});

test('explicit force_multi_pot may choose two meals at equal must coverage', () => {
  const result = planMeal(assets, request({
    must: ['熟米饭', '神秘叶子'],
    prefer: ['大米'],
    decision: { action: 'force_multi_pot' },
  }));
  assert.equal(result.status, 'needs_user_decision');
  assert.equal(result.plan.pots.length, 2);
  assert.equal(result.plan.planned_must_use.length, 1);
});

test('recommend remains honest about partial use and is not forced into pantry completeness', () => {
  const result = planMeal(assets, request({
    mode: 'recommend',
    prefer: ['番茄', '鸡蛋', '西兰花', '牛里脊', '神秘叶子'],
  }));

  assert.equal(result.status, 'ready');
  assert.equal(result.generation_allowed, true);
  assert.ok(result.plan.planned_prefer_use.length >= 1);
  assert.ok(result.plan.unused_prefer_use.length >= 1);
  assert.equal(result.plan.coverage_ratio, result.plan.planned_prefer_use.length / 5);
  assert.equal(result.plan.recognition_ratio, 4 / 5);
  assert.equal(result.plan.recognized_coverage_ratio, result.plan.planned_prefer_use.length / 4);
  assert.doesNotMatch(result.commitment, /全部|清空|完整清库存/);
});

test('multi-pot planning returns detached objects and never mutates request, assets, or candidate facts', () => {
  const input = request({ must: ['大米', '熟米饭', '番茄'] });
  const inputBefore = structuredClone(input);
  const assetsBefore = structuredClone(assets);
  const result = planMeal(assets, input);
  result.plan.pots[0].planned_must_use[0].required_endpoint_codes.push('forged');
  result.plan.pots[0].required_extra_items[0].name = 'forged';
  result.normalized_items[0].compatible_slot_codes.push('forged');

  assert.deepEqual(input, inputBefore);
  assert.deepEqual(assets, assetsBefore);
  const second = planMeal(assets, request({ must: ['大米', '熟米饭', '番茄'] }));
  assert.equal(JSON.stringify(second).includes('forged'), false);
});

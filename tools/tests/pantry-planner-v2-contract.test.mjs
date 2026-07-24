import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePlannerRequest,
  plannerRequestFromLegacy,
} from '../../worker/src/planner-v2.js';

test('V2 keeps mode and intent orthogonal', () => {
  const request = normalizePlannerRequest({
    schema_version: 2,
    planner_version: 'pantry-planner-v2',
    constraints: {
      mode: 'pantry',
      intent: 'quick',
      servings: 2,
      must_use: ['番茄', '番茄', '鸡蛋'],
      prefer_use: ['青菜'],
    },
  });
  assert.equal(request.mode, 'pantry');
  assert.equal(request.intent, 'quick');
  assert.deepEqual(request.must_use, ['番茄', '鸡蛋']);
  assert.deepEqual(request.prefer_use, ['青菜']);
});

test('legacy purpose maps without changing its old meaning', () => {
  assert.deepEqual(
    plannerRequestFromLegacy({ purpose: 'pantry', pantry: ['豆腐'] }),
    { mode: 'pantry', intent: 'normal', must_use: ['豆腐'], prefer_use: [] },
  );
  assert.deepEqual(
    plannerRequestFromLegacy({ purpose: 'quick', pantry: ['豆腐'] }),
    { mode: 'recommend', intent: 'quick', must_use: [], prefer_use: ['豆腐'] },
  );
});

test('V2 trims exact duplicate ingredients and retains planner state', () => {
  const request = normalizePlannerRequest({
    schema_version: 2,
    planner_version: 'pantry-planner-v2',
    constraints: {
      mode: 'recommend',
      intent: 'batch',
      servings: 8,
      must_use: [' 豆腐 ', '豆腐', '鸡蛋'],
      prefer_use: [' 青菜 ', '青菜'],
      dislikes: [' 香菜 ', '香菜'],
      current_plan_id: ' plan-42 ',
      recent_plan_ids: [' old-1 ', 'old-1', 'old-2'],
      decision: { action: 'allow_third_pot', item: '豆腐' },
    },
  });

  assert.deepEqual(request.must_use, ['豆腐', '鸡蛋']);
  assert.deepEqual(request.prefer_use, ['青菜']);
  assert.deepEqual(request.dislikes, ['香菜']);
  assert.equal(request.current_plan_id, 'plan-42');
  assert.deepEqual(request.recent_plan_ids, ['old-1', 'old-2']);
  assert.deepEqual(request.decision, { action: 'allow_third_pot', item: '豆腐' });
  assert.equal(request.allow_third_pot, true);
});

test('V2 rejects invalid contracts instead of guessing', () => {
  const invalidRequests = [
    { constraints: { mode: 'unknown', intent: 'normal', servings: 2 } },
    { constraints: { mode: 'recommend', intent: 'unknown', servings: 2 } },
    { constraints: { mode: 'recommend', intent: 'normal', servings: 1.5 } },
    { constraints: { mode: 'recommend', intent: 'normal', servings: 9 } },
    { constraints: { mode: 'recommend', intent: 'normal', must_use: Array.from({ length: 21 }, (_, i) => `食材${i}`) } },
    { constraints: { mode: 'recommend', intent: 'normal', decision: { action: 'invent_action' } } },
  ];

  for (const request of invalidRequests) {
    assert.throws(
      () => normalizePlannerRequest({ schema_version: 2, planner_version: 'pantry-planner-v2', ...request }),
      (error) => error?.code === 'invalid_planner_request',
    );
  }
});

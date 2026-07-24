import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import worker, * as workerModule from '../../worker/src/worker.js';

const readAsset = name => fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8');
const SOURCE_ASSETS = Object.freeze({
  '/ingredient-taxonomy.v1.json': readAsset('ingredient-taxonomy.v1.json'),
  '/meal-templates.v2.json': readAsset('meal-templates.v2.json'),
  '/ratio-rules.v1.json': readAsset('ratio-rules.v1.json'),
  '/recipe-library.json': readAsset('recipe-library.json'),
});

function plannerRequest({
  mode = 'pantry', intent = 'normal', must = [], prefer = [], dislikes = [], servings = 2,
  currentPlanId = null, recentPlanIds = [], decision = null,
} = {}) {
  return {
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
  };
}

function assetBinding() {
  const calls = [];
  return {
    calls,
    async fetch(request) {
      const pathname = new URL(request.url).pathname;
      calls.push(pathname);
      if (!Object.prototype.hasOwnProperty.call(SOURCE_ASSETS, pathname)) {
        return new Response('missing', { status: 404 });
      }
      return new Response(SOURCE_ASSETS[pathname], {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
  };
}

function budgetKv() {
  const store = new Map();
  return {
    gets: 0,
    puts: 0,
    async get(key) { this.gets += 1; return store.get(key) ?? null; },
    async put(key, value) { this.puts += 1; store.set(key, String(value)); },
  };
}

async function obtainPlan(planRequest, assets = assetBinding()) {
  const response = await worker.fetch(new Request('https://generate.example/plan-meal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://generate.example' },
    body: JSON.stringify(planRequest),
  }), { ASSETS: assets });
  return { response, body: await response.json(), assets };
}

function envelope(planRequest, planned) {
  return {
    schema_version: 2,
    planner_version: planned.planner_version,
    template_catalog_version: planned.template_catalog_version,
    plan_id: planned.plan.plan_id,
    plan_request: structuredClone(planRequest),
  };
}

function lockedInputFromUpstreamBody(upstreamBody) {
  const content = upstreamBody?.messages?.find(message => message.role === 'user')?.content;
  const parsed = JSON.parse(content);
  assert.deepEqual(Object.keys(parsed).sort(), ['instructions', 'locked_plan']);
  return parsed.locked_plan;
}

function validModelOutput(lockedPlan) {
  return {
    plan_id: lockedPlan.plan_id,
    meals: lockedPlan.meals.map(meal => {
      const steps = meal.cooking_order.map((phase, index) => ({
        order: index + 1,
        action_code: phase.action_code,
        text: `按规划完成${phase.action_code}。`,
        ingredient_refs: [...phase.allowed_ingredient_refs],
        completed_safety_endpoints: [...phase.required_safety_endpoints],
      }));
      const referenced = new Set(steps.flatMap(step => step.ingredient_refs));
      const missing = meal.locked_ingredients.map(item => item.ingredient_ref).filter(ref => !referenced.has(ref));
      if (missing.length) steps[0].ingredient_refs.push(...missing);
      return {
        meal_sequence: meal.meal_sequence,
        dish_name: '按计划完成的一锅主餐',
        ingredient_refs: meal.locked_ingredients.map(item => item.ingredient_ref),
        steps,
        recommendation_reason: '食材与顺序均按已确认计划执行。',
      };
    }),
  };
}

async function postGenerate({
  planRequest,
  planned,
  assets = assetBinding(),
  requestEnvelope,
  rawBody,
  modelMutator,
  upstreamResponse,
  env = {},
} = {}) {
  const kv = budgetKv();
  const upstreamBodies = [];
  const requestObject = requestEnvelope ?? envelope(planRequest, planned);
  const untouchedEnvelope = structuredClone(requestObject);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    const upstreamBody = JSON.parse(String(options?.body || '{}'));
    upstreamBodies.push(upstreamBody);
    if (upstreamResponse) return upstreamResponse(upstreamBody, options);
    const locked = lockedInputFromUpstreamBody(upstreamBody);
    const output = validModelOutput(locked);
    if (modelMutator) modelMutator(output, locked);
    return Response.json({ choices: [{ message: { content: JSON.stringify(output) } }] });
  };
  try {
    const response = await worker.fetch(new Request('https://generate.example/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://generate.example' },
      body: rawBody ?? JSON.stringify(requestObject),
    }), {
      ASSETS: assets,
      DEEPSEEK_API_KEY: 'test-key',
      RATE_LIMIT: 0,
      RATE_KV: kv,
      ...env,
    });
    const responseText = await response.text();
    let body;
    try { body = JSON.parse(responseText); } catch { body = { raw: responseText }; }
    assert.deepEqual(requestObject, untouchedEnvelope, 'generation must not mutate the caller envelope');
    return { response, body, kv, upstreamBodies, assets };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function assertNoPaidWork(result) {
  assert.equal(result.kv.gets, 0);
  assert.equal(result.kv.puts, 0);
  assert.equal(result.upstreamBodies.length, 0);
}

async function preparedJourney(request) {
  const assets = assetBinding();
  const planned = await obtainPlan(request, assets);
  assert.equal(planned.response.status, 200);
  return { planRequest: request, planned: planned.body, assets };
}

test('generation contract exposes focused Worker-safe pure builder and validator APIs', () => {
  assert.equal(typeof workerModule.buildLockedPlanContract, 'function');
  assert.equal(typeof workerModule.validateGeneratedPlan, 'function');
});

test('valid single-pot generation recomputes the plan and spends exactly one budget attempt and upstream call', async () => {
  const journey = await preparedJourney(plannerRequest({ must: ['番茄', '鸡蛋'] }));
  const result = await postGenerate(journey);

  assert.equal(result.response.status, 200);
  assert.equal(result.body.plan_id, journey.planned.plan.plan_id);
  assert.equal(result.body.plan.pots.length, 1);
  assert.equal(result.body.meals.length, 1);
  assert.equal(result.kv.gets, 1);
  assert.equal(result.kv.puts, 1);
  assert.equal(result.upstreamBodies.length, 1);
  assert.deepEqual(result.body.plan.planned_must_use, journey.planned.plan.planned_must_use);
  assert.ok(result.body.meals[0].locked_ingredients.every(item => Number.isFinite(item.planned_grams)));
});

test('valid two-pot generation sends the whole plan in one upstream request and one budget write', async () => {
  const journey = await preparedJourney(plannerRequest({ must: ['大米', '熟米饭', '番茄'] }));
  assert.equal(journey.planned.plan.pots.length, 2);
  const result = await postGenerate(journey);

  assert.equal(result.response.status, 200);
  assert.equal(result.body.meals.length, 2);
  assert.equal(result.kv.gets, 1);
  assert.equal(result.kv.puts, 1);
  assert.equal(result.upstreamBodies.length, 1);
  const locked = lockedInputFromUpstreamBody(result.upstreamBodies[0]);
  assert.deepEqual(locked.meals.map(meal => meal.meal_sequence), [1, 2]);
});

test('stale envelope or changed exact request state exits before rate, budget and upstream work', async t => {
  const baseRequest = plannerRequest({ mode: 'pantry', intent: 'normal', must: ['番茄', '鸡蛋'], servings: 2 });
  const journey = await preparedJourney(baseRequest);
  const cases = [
    ['planner version', value => { value.planner_version = 'pantry-planner-v1'; }],
    ['catalog version', value => { value.template_catalog_version = 'templates-stale'; }],
    ['plan id', value => { value.plan_id = 'pln_v2_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'; }],
    ['servings', value => { value.plan_request.constraints.servings = 3; }],
    ['intent', value => { value.plan_request.constraints.intent = 'fresh'; }],
    ['ingredient', value => { value.plan_request.constraints.must_use = ['番茄', '西兰花']; }],
    ['role', value => { value.plan_request.constraints.must_use = ['番茄']; value.plan_request.constraints.prefer_use = ['鸡蛋']; }],
    ['dislike', value => { value.plan_request.constraints.dislikes = ['鸡蛋']; }],
  ];
  for (const [name, mutate] of cases) {
    await t.test(name, async () => {
      const forged = envelope(baseRequest, journey.planned);
      mutate(forged);
      const result = await postGenerate({ ...journey, requestEnvelope: forged });
      assert.equal(result.response.status, 409);
      assert.equal(result.body.status, 'stale_plan');
      assertNoPaidWork(result);
    });
  }
});

test('non-generatable planner states and no-alternative navigation never borrow a retained plan id', async t => {
  const decisionJourney = await preparedJourney(plannerRequest({ must: ['番茄', '神秘叶子'] }));
  const invalidJourney = await preparedJourney(plannerRequest({ must: ['神秘叶子'] }));
  const current = await preparedJourney(plannerRequest({ must: ['大米'] }));
  const noAlternativeRequest = plannerRequest({ must: ['大米'], currentPlanId: current.planned.plan.plan_id });
  const noAlternativeJourney = await preparedJourney(noAlternativeRequest);
  assert.equal(noAlternativeJourney.planned.status, 'no_alternative_plan');

  for (const [name, journey] of [
    ['needs_user_decision', decisionJourney],
    ['no_valid_plan', invalidJourney],
    ['no_alternative_plan', noAlternativeJourney],
  ]) {
    await t.test(name, async () => {
      const result = await postGenerate(journey);
      assert.equal(result.response.status, 409);
      assert.equal(result.body.status, name);
      assertNoPaidWork(result);
    });
  }
});

test('accepted partial generates only from the exact acknowledged request and retains unplanned facts', async () => {
  const baseRequest = plannerRequest({ must: ['番茄', '神秘叶子'] });
  const base = await preparedJourney(baseRequest);
  const acceptedRequest = plannerRequest({
    must: ['番茄', '神秘叶子'],
    currentPlanId: base.planned.plan.plan_id,
    decision: {
      action: 'accept_partial',
      plan_id: base.planned.plan.plan_id,
      acknowledged_unplanned: ['神秘叶子'],
    },
  });
  const accepted = await preparedJourney(acceptedRequest);
  assert.equal(accepted.planned.status, 'partial_accepted');
  const result = await postGenerate(accepted);
  assert.equal(result.response.status, 200);
  assert.equal(result.body.status, 'partial_accepted');
  assert.deepEqual(result.body.plan.unplanned_must_use, accepted.planned.plan.unplanned_must_use);
  assert.equal(result.body.meals.length, accepted.planned.plan.pots.length);
  assert.doesNotMatch(JSON.stringify(lockedInputFromUpstreamBody(result.upstreamBodies[0])), /神秘叶子/);
});

test('a forged accepted-partial id or acknowledgement is rejected before budget', async () => {
  const baseRequest = plannerRequest({ must: ['番茄', '神秘叶子'] });
  const base = await preparedJourney(baseRequest);
  const forgedRequest = plannerRequest({
    must: ['番茄', '神秘叶子'],
    currentPlanId: base.planned.plan.plan_id,
    decision: {
      action: 'accept_partial',
      plan_id: base.planned.plan.plan_id,
      acknowledged_unplanned: ['番茄'],
    },
  });
  const forgedEnvelope = envelope(baseRequest, base.planned);
  forgedEnvelope.plan_request = forgedRequest;
  const result = await postGenerate({ planRequest: forgedRequest, planned: base.planned, assets: base.assets, requestEnvelope: forgedEnvelope });
  assert.equal(result.response.status, 409);
  assert.equal(result.body.status, 'stale_plan');
  assertNoPaidWork(result);
});

test('pure validator rejects refs, substitutions, numeric overrides, action and safety drift', async t => {
  assert.equal(typeof workerModule.buildLockedPlanContract, 'function');
  assert.equal(typeof workerModule.validateGeneratedPlan, 'function');
  const journey = await preparedJourney(plannerRequest({ must: ['牛里脊', '番茄'] }));
  const locked = workerModule.buildLockedPlanContract(journey.planned, JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']));
  const valid = validModelOutput(locked);
  assert.equal(workerModule.validateGeneratedPlan(valid, locked, JSON.parse(SOURCE_ASSETS['/ingredient-taxonomy.v1.json'])).ok, true);
  const cases = [
    ['wrong plan id', value => { value.plan_id = 'pln_v2_wrong'; }],
    ['missing meal', value => { value.meals = []; }],
    ['wrong meal sequence', value => { value.meals[0].meal_sequence = 2; }],
    ['missing ref', value => { value.meals[0].ingredient_refs.pop(); }],
    ['unknown ref', value => { value.meals[0].ingredient_refs.push('i999'); }],
    ['duplicate ref', value => { value.meals[0].ingredient_refs.push(value.meals[0].ingredient_refs[0]); }],
    ['added mushroom prose', value => { value.meals[0].steps[0].text += '再加入香菇。'; }],
    ['changed beef cut', value => { value.meals[0].steps[0].text += '把牛里脊换成牛腩。'; }],
    ['changed grams', value => { value.meals[0].steps[0].text += '加入250克食材。'; }],
    ['changed liquid ratio', value => { value.meals[0].steps[0].text += '水按1:2加入。'; }],
    ['changed time', value => { value.meals[0].steps[0].text += '再煮20分钟。'; }],
    ['ingredient prose without its step ref', value => {
      const beefRef = locked.meals[0].locked_ingredients.find(item => item.raw_name === '牛里脊').ingredient_ref;
      const step = value.meals[0].steps.find(entry => !entry.ingredient_refs.includes(beefRef));
      step.text += '提前加入牛里脊。';
    }],
    ['reordered actions', value => { value.meals[0].steps.reverse(); value.meals[0].steps.forEach((step, index) => { step.order = index + 1; }); }],
    ['missing safety endpoint', value => { value.meals[0].steps.forEach(step => { step.completed_safety_endpoints = []; }); }],
    ['early safety endpoint', value => {
      const endpoint = value.meals[0].steps.flatMap(step => step.completed_safety_endpoints)[0];
      value.meals[0].steps.forEach(step => { step.completed_safety_endpoints = []; });
      value.meals[0].steps[0].completed_safety_endpoints = [endpoint];
    }],
    ['unknown safety endpoint', value => { value.meals[0].steps.at(-1).completed_safety_endpoints.push('invented_safe'); }],
    ['duplicate safety endpoint', value => {
      const step = value.meals[0].steps.find(entry => entry.completed_safety_endpoints.length);
      step.completed_safety_endpoints.push(step.completed_safety_endpoints[0]);
    }],
    ['extra key', value => { value.meals[0].steps[0].grams = 250; }],
    ['empty dish name', value => { value.meals[0].dish_name = ''; }],
    ['oversized dish name', value => { value.meals[0].dish_name = '菜'.repeat(81); }],
    ['invalid step order', value => { value.meals[0].steps[0].order = 0; }],
    ['multiple vessels', value => { value.meals[0].steps[0].text += '另起一口锅完成第二锅。'; }],
  ];
  for (const [name, mutate] of cases) {
    await t.test(name, () => {
      const output = structuredClone(valid);
      mutate(output);
      const checked = workerModule.validateGeneratedPlan(output, locked, JSON.parse(SOURCE_ASSETS['/ingredient-taxonomy.v1.json']));
      assert.equal(checked.ok, false);
      assert.equal(typeof checked.reason_code, 'string');
    });
  }
});

test('pure validator rejects chicken and mushroom substitutions plus an unused user item in prose', async () => {
  const taxonomy = JSON.parse(SOURCE_ASSETS['/ingredient-taxonomy.v1.json']);
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const journeys = [
    [plannerRequest({ must: ['鸡腿肉', '熟米饭'] }), '鸡胸肉'],
    [plannerRequest({ must: ['面条', '金针菇', '白菜'] }), '香菇'],
    [plannerRequest({ mode: 'recommend', prefer: ['番茄', '鸡蛋', '黄瓜'] }), '黄瓜'],
  ];
  for (const [request, forbidden] of journeys) {
    const journey = await preparedJourney(request);
    const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
    const output = validModelOutput(locked);
    output.meals[0].steps[0].text += `加入${forbidden}。`;
    assert.equal(workerModule.validateGeneratedPlan(output, locked, taxonomy).ok, false, forbidden);
  }
});

test('contract builder and validator return detached facts without mutating planner, catalog or model output', async () => {
  const journey = await preparedJourney(plannerRequest({ must: ['番茄', '鸡蛋'] }));
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const taxonomy = JSON.parse(SOURCE_ASSETS['/ingredient-taxonomy.v1.json']);
  const plannerBefore = structuredClone(journey.planned);
  const templatesBefore = structuredClone(templates);
  const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
  const output = validModelOutput(locked);
  const outputBefore = structuredClone(output);
  const checked = workerModule.validateGeneratedPlan(output, locked, taxonomy);
  assert.equal(checked.ok, true);
  assert.deepEqual(journey.planned, plannerBefore);
  assert.deepEqual(templates, templatesBefore);
  assert.deepEqual(output, outputBefore);
  checked.meals[0].dish_name = 'mutated detached result';
  assert.deepEqual(output, outputBefore);
});

test('locked safety endpoints come from the used template category and do not invent staple or duplicate poultry endpoints', async () => {
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const eggJourney = await preparedJourney(plannerRequest({ must: ['番茄', '鸡蛋'] }));
  const eggLocked = workerModule.buildLockedPlanContract(eggJourney.planned, templates);
  assert.deepEqual(eggLocked.meals[0].safety_endpoints, ['egg_fully_set']);

  const chickenJourney = await preparedJourney(plannerRequest({ must: ['鸡胸肉', '熟米饭'] }));
  const chickenLocked = workerModule.buildLockedPlanContract(chickenJourney.planned, templates);
  assert.deepEqual(chickenLocked.meals[0].safety_endpoints, ['poultry_fully_cooked_no_pink']);
});

test('endpoint rejects model contract violations without exposing payload or retrying', async t => {
  const journey = await preparedJourney(plannerRequest({ must: ['牛里脊', '番茄'] }));
  const cases = [
    ['added ingredient', value => { value.meals[0].steps[0].text += '加入香菇。'; }],
    ['changed cut', value => { value.meals[0].steps[0].text += '把牛里脊换成牛腩。'; }],
    ['missing step ref', value => { value.meals[0].steps.forEach(step => { step.ingredient_refs = []; }); }],
    ['wrong plan id', value => { value.plan_id = 'pln_v2_wrong'; }],
    ['extra object key', value => { value.runtime_backdoor = true; }],
  ];
  for (const [name, mutate] of cases) {
    await t.test(name, async () => {
      const result = await postGenerate({ ...journey, modelMutator: mutate });
      assert.equal(result.response.status, 422);
      assert.equal(result.body.code, 'model_contract_violation');
      assert.equal(result.upstreamBodies.length, 1);
      assert.equal(result.kv.puts, 1);
      assert.doesNotMatch(JSON.stringify(result.body), /香菇|牛腩|runtime_backdoor|pln_v2_wrong/);
    });
  }
});

test('one meal cannot reference another meal ingredient', async () => {
  const journey = await preparedJourney(plannerRequest({ must: ['大米', '熟米饭', '番茄'] }));
  const result = await postGenerate({
    ...journey,
    modelMutator(output) {
      output.meals[0].steps[0].ingredient_refs.push(output.meals[1].ingredient_refs[0]);
    },
  });
  assert.equal(result.response.status, 422);
  assert.equal(result.body.code, 'model_contract_violation');
  assert.equal(result.upstreamBodies.length, 1);
});

test('malformed model JSON and upstream errors fail once with no automatic retry', async t => {
  const journey = await preparedJourney(plannerRequest({ must: ['番茄', '鸡蛋'] }));
  const cases = [
    ['malformed JSON', async () => Response.json({ choices: [{ message: { content: '{broken' } }] }), 422, 'model_contract_violation'],
    ['JSON wrapped in prose', async upstreamBody => {
      const output = validModelOutput(lockedInputFromUpstreamBody(upstreamBody));
      return Response.json({ choices: [{ message: { content: `这里是结果：${JSON.stringify(output)}` } }] });
    }, 422, 'model_contract_violation'],
    ['non-2xx', async () => new Response('secret upstream body', { status: 500 }), 502, 'upstream_error'],
    ['timeout', async () => { const error = new Error('timed out'); error.name = 'TimeoutError'; throw error; }, 504, 'upstream_timeout'],
  ];
  for (const [name, upstreamResponse, status, code] of cases) {
    await t.test(name, async () => {
      const result = await postGenerate({ ...journey, upstreamResponse });
      assert.equal(result.response.status, status);
      assert.equal(result.body.code, code);
      assert.equal(result.upstreamBodies.length, 1);
      assert.equal(result.kv.puts, 1);
      assert.doesNotMatch(JSON.stringify(result.body), /secret upstream body|broken/);
    });
  }
});

test('invalid envelopes, missing key, rate limit and unavailable budget never reach upstream', async t => {
  const journey = await preparedJourney(plannerRequest({ must: ['番茄', '鸡蛋'] }));
  const cases = [
    ['empty body', { rawBody: '' }, 400, 'invalid_generate_plan_request', 0],
    ['array body', { rawBody: '[]' }, 400, 'invalid_generate_plan_request', 0],
    ['malformed JSON', { rawBody: '{broken' }, 400, 'invalid_json', 0],
    ['oversized body', { rawBody: JSON.stringify({ padding: 'x'.repeat(33 * 1024) }) }, 400, 'request_too_large', 0],
    ['missing api key', { env: { DEEPSEEK_API_KEY: undefined } }, 500, 'missing_api_key', 0],
    ['rate limit', { env: { RATE_LIMIT: 1 }, requestEnvelope: envelope(journey.planRequest, journey.planned) }, 429, 'rate_limited', 0],
    ['budget unavailable', { env: { RATE_KV: undefined } }, 503, 'budget_unavailable', 0],
  ];
  for (const [name, options, status, code, upstreamCount] of cases) {
    await t.test(name, async () => {
      if (name === 'rate limit') {
        await postGenerate({ ...journey, ...options });
      }
      const result = await postGenerate({ ...journey, ...options });
      assert.equal(result.response.status, status);
      assert.equal(result.body.code, code);
      assert.equal(result.upstreamBodies.length, upstreamCount);
    });
  }
});

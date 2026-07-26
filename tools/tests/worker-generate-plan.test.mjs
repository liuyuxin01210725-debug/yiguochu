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

function ingredientTermUniverse() {
  return workerModule.buildIngredientTermUniverse(
    JSON.parse(SOURCE_ASSETS['/ingredient-taxonomy.v1.json']),
    JSON.parse(SOURCE_ASSETS['/recipe-library.json']),
  );
}

function validModelOutput(lockedPlan) {
  return {
    plan_id: lockedPlan.plan_id,
    meals: lockedPlan.meals.map(meal => {
      const steps = meal.cooking_order.map((phase, index) => ({
        order: index + 1,
        action_code: phase.action_code,
        text: meal.generation_text_contract.steps[index].allowed_texts[0],
        ingredient_refs: [...phase.allowed_ingredient_refs],
        completed_safety_endpoints: [...phase.required_safety_endpoints],
      }));
      const referenced = new Set(steps.flatMap(step => step.ingredient_refs));
      const missing = meal.locked_ingredients.map(item => item.ingredient_ref).filter(ref => !referenced.has(ref));
      if (missing.length) steps[0].ingredient_refs.push(...missing);
      return {
        meal_sequence: meal.meal_sequence,
        dish_name: meal.generation_text_contract.dish_name_options[0],
        ingredient_refs: meal.locked_ingredients.map(item => item.ingredient_ref),
        steps,
        recommendation_reason: meal.generation_text_contract.recommendation_reason_options[0],
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
  assert.equal(typeof workerModule.buildIngredientTermUniverse, 'function');
  assert.equal(typeof workerModule.lockPlannerOwnedSafetyMetadata, 'function');
  assert.equal(typeof workerModule.validateGeneratedPlan, 'function');
  const universe = ingredientTermUniverse();
  for (const term of ['芝士', '料酒', '糖', '帕玛森奶酪', '鸡腿', '鸡胸肉']) {
    assert.ok(universe.some(entry => entry.term === term), term);
  }
  assert.ok(new Set(universe.map(entry => entry.normalized)).size >= 200);
});

test('endpoint ignores model-authored safety codes and restores the planner-owned phase metadata', async () => {
  const journey = await preparedJourney(plannerRequest({ must: ['大米', '番茄', '牛里脊'] }));
  const result = await postGenerate({
    ...journey,
    modelMutator(output) {
      for (const meal of output.meals) {
        for (const step of meal.steps) step.completed_safety_endpoints = ['完全熟透'];
      }
    },
  });

  assert.equal(result.response.status, 200);
  assert.equal(result.upstreamBodies.length, 1);
  assert.equal(result.kv.puts, 1);
  assert.deepEqual(
    result.body.meals[0].steps.map(step => step.completed_safety_endpoints),
    [[], [], [], ['beef_fully_cooked']],
  );
});

test('planner-owned safety metadata never repairs model-authored unsafe prose', async () => {
  const journey = await preparedJourney(plannerRequest({ must: ['大米', '番茄', '牛里脊'] }));
  const result = await postGenerate({
    ...journey,
    modelMutator(output) {
      const finalStep = output.meals[0].steps.at(-1);
      finalStep.completed_safety_endpoints = ['完全熟透'];
      finalStep.text += '但内部仍有粉红。';
    },
  });

  assert.equal(result.response.status, 422);
  assert.equal(result.body.code, 'model_contract_violation');
  assert.equal(result.upstreamBodies.length, 1);
  assert.equal(result.kv.puts, 1);
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
  assert.equal(result.upstreamBodies[0].max_tokens, 3000);
  assert.deepEqual(result.upstreamBodies[0].thinking, { type:'disabled' });
  assert.deepEqual(result.body.plan.planned_must_use, journey.planned.plan.planned_must_use);
  assert.ok(result.body.meals[0].locked_ingredients.every(item => Number.isFinite(item.planned_grams)));
  const prompt = result.upstreamBodies[0].messages.map(message => message.content).join('\n');
  assert.match(prompt, /required_safety_ingredient_refs/);
  assert.match(prompt, /requires_explicit_raw_name/);
  assert.match(prompt, /完全熟透.*内部无粉红/);
  assert.match(prompt, /鸡蛋.*完全凝固/);
  assert.match(prompt, /个、片、块、斤、两、温度/);
  assert.match(prompt, /\{\{i1\}\}/);
  assert.doesNotMatch(JSON.stringify(result.body), /\{\{[ie]\d+\}\}/);
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
  assert.equal(result.upstreamBodies[0].max_tokens, 3000);
  const locked = lockedInputFromUpstreamBody(result.upstreamBodies[0]);
  assert.deepEqual(locked.meals.map(meal => meal.meal_sequence), [1, 2]);
});

test('stale envelope or changed exact request state exits before rate, budget and upstream work', async t => {
  const baseRequest = plannerRequest({ mode: 'pantry', intent: 'normal', must: ['番茄', '鸡蛋'], servings: 2 });
  const journey = await preparedJourney(baseRequest);
  const cases = [
    ['planner version', value => { value.planner_version = 'pantry-planner-v1'; }],
    ['catalog version', value => { value.template_catalog_version = 'templates-v2-20260724'; }],
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
  const decisionJourney = await preparedJourney(plannerRequest({ must: ['番茄', '鸡蛋', '神秘叶子'] }));
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
  const baseRequest = plannerRequest({ must: ['番茄', '鸡蛋', '神秘叶子'] });
  const base = await preparedJourney(baseRequest);
  const acceptedRequest = plannerRequest({
    must: ['番茄', '鸡蛋', '神秘叶子'],
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
  const baseRequest = plannerRequest({ must: ['番茄', '鸡蛋', '神秘叶子'] });
  const base = await preparedJourney(baseRequest);
  const forgedRequest = plannerRequest({
    must: ['番茄', '鸡蛋', '神秘叶子'],
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
  assert.equal(workerModule.validateGeneratedPlan(valid, locked, ingredientTermUniverse()).ok, true);
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
      const checked = workerModule.validateGeneratedPlan(output, locked, ingredientTermUniverse());
      assert.equal(checked.ok, false);
      assert.equal(typeof checked.reason_code, 'string');
    });
  }
});

test('pure validator rejects chicken and mushroom substitutions plus an unused user item in prose', async () => {
  const termUniverse = ingredientTermUniverse();
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
    assert.equal(workerModule.validateGeneratedPlan(output, locked, termUniverse).ok, false, forbidden);
  }
});

test('locked Jiangnan cured rice cannot reintroduce planner-skipped oil or salt', async () => {
  const journey = await preparedJourney(plannerRequest({
    must: ['大米', '咸五花肉', '小白菜'],
  }));
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
  const lockedNames = locked.meals.flatMap(meal => meal.locked_ingredients.map(item => item.raw_name));
  assert.ok(lockedNames.includes('水'));
  assert.equal(lockedNames.includes('食用油'), false);
  assert.equal(lockedNames.includes('盐'), false);

  const valid = validModelOutput(locked);
  assert.equal(workerModule.validateGeneratedPlan(valid, locked, ingredientTermUniverse()).ok, true);
  for (const forbidden of ['食用油', '盐']) {
    const mutated = structuredClone(valid);
    mutated.meals[0].steps[0].text += `再加入${forbidden}。`;
    assert.equal(
      workerModule.validateGeneratedPlan(mutated, locked, ingredientTermUniverse()).ok,
      false,
      forbidden,
    );
  }
});

test('contract builder and validator return detached facts without mutating planner, catalog or model output', async () => {
  const journey = await preparedJourney(plannerRequest({ must: ['番茄', '鸡蛋'] }));
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const termUniverse = ingredientTermUniverse();
  const plannerBefore = structuredClone(journey.planned);
  const templatesBefore = structuredClone(templates);
  const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
  const output = validModelOutput(locked);
  const outputBefore = structuredClone(output);
  const checked = workerModule.validateGeneratedPlan(output, locked, termUniverse);
  assert.equal(checked.ok, true);
  assert.deepEqual(journey.planned, plannerBefore);
  assert.deepEqual(templates, templatesBefore);
  assert.deepEqual(output, outputBefore);
  checked.meals[0].dish_name = 'mutated detached result';
  assert.deepEqual(output, outputBefore);
});

test('one plan accepts two finite controlled wording variants without changing plan identity', async () => {
  const journey = await preparedJourney(plannerRequest({ must: ['番茄', '鸡蛋'] }));
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
  const first = validModelOutput(locked);
  const second = structuredClone(first);
  second.meals.forEach((meal, mealIndex) => {
    const contract = locked.meals[mealIndex].generation_text_contract;
    meal.dish_name = contract.dish_name_options[1];
    meal.recommendation_reason = contract.recommendation_reason_options[1];
    meal.steps.forEach((step, stepIndex) => { step.text = contract.steps[stepIndex].allowed_texts[1]; });
  });
  assert.notDeepEqual(first.meals, second.meals);
  const firstChecked = workerModule.validateGeneratedPlan(first, locked, ingredientTermUniverse());
  const secondChecked = workerModule.validateGeneratedPlan(second, locked, ingredientTermUniverse());
  assert.equal(firstChecked.ok, true);
  assert.equal(secondChecked.ok, true);
  assert.equal(first.plan_id, second.plan_id);
  assert.doesNotMatch(JSON.stringify(firstChecked.meals), /\{\{[ie]\d+\}\}/);
  assert.doesNotMatch(JSON.stringify(secondChecked.meals), /\{\{[ie]\d+\}\}/);
});

test('controlled phrases omit empty optional phases and render executable one-pot actions', async () => {
  const journey = await preparedJourney(plannerRequest({ must: ['牛里脊', '番茄'] }));
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
  assert.ok(locked.meals[0].cooking_order.every(phase => (
    phase.allowed_ingredient_refs.length > 0 || phase.required_safety_endpoints.length > 0
  )));
  assert.equal(locked.meals[0].cooking_order.some(phase => (
    phase.action_code === 'add_fast_cooking_items' && phase.allowed_ingredient_refs.length === 0
  )), false);
  const staplePhaseIndex = locked.meals[0].cooking_order
    .findIndex(phase => phase.action_code === 'add_staple_and_liquid');
  assert.ok(staplePhaseIndex >= 0);
  for (const text of locked.meals[0].generation_text_contract.steps[staplePhaseIndex].allowed_texts) {
    assert.match(text, /加盖焖煮.*(?:熟软|无硬芯)/);
  }
  const output = validModelOutput(locked);
  const checked = workerModule.validateGeneratedPlan(output, locked, ingredientTermUniverse());
  assert.equal(checked.ok, true);
  const prose = checked.meals[0].steps.map(step => step.text).join('\n');
  assert.match(prose, /牛里脊/);
  assert.match(prose, /牛里脊.*薄片/);
  assert.match(prose, /(?:放入|翻炒|焖煮|加热|拌匀|热透)/);
  assert.doesNotMatch(prose, /按规划使用.*完成|完成完成|\{\{/);
});

test('conditional cooking phases keep only the branch matching the locked protein category', async () => {
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const broth = templates.templates.find(row => row.template_id === 'broth-noodle-pot');
  broth.cooking_order = [
    { phase: 1, action_code: 'add_broth_and_noodles', slot_ids: ['liquid', 'staple'] },
    { phase: 2, action_code: 'cook_poultry_through', slot_ids: ['protein'], when: { slot_id: 'protein', category: 'chicken' } },
    { phase: 3, action_code: 'gentle_set_protein', slot_ids: ['protein'], when: { slot_id: 'protein', category: 'egg' } },
    { phase: 4, action_code: 'reach_safety_endpoints', slot_ids: ['protein'] },
  ];

  const eggJourney = await preparedJourney(plannerRequest({ must: ['面条', '鸡蛋'] }));
  const chickenJourney = await preparedJourney(plannerRequest({ must: ['面条', '鸡腿肉'] }));
  const eggLocked = workerModule.buildLockedPlanContract(eggJourney.planned, templates);
  const chickenLocked = workerModule.buildLockedPlanContract(chickenJourney.planned, templates);
  const eggActions = eggLocked.meals[0].cooking_order.map(row => row.action_code);
  const chickenActions = chickenLocked.meals[0].cooking_order.map(row => row.action_code);

  assert.ok(eggActions.includes('gentle_set_protein'));
  assert.equal(eggActions.includes('cook_poultry_through'), false);
  assert.ok(chickenActions.includes('cook_poultry_through'));
  assert.equal(chickenActions.includes('gentle_set_protein'), false);
  for (const meal of [...eggLocked.meals, ...chickenLocked.meals]) {
    const referenced = new Set(meal.cooking_order.flatMap(row => row.allowed_ingredient_refs));
    for (const ingredient of meal.locked_ingredients.filter(row => row.source === 'user')) {
      assert.ok(referenced.has(ingredient.ingredient_ref), ingredient.ingredient_ref);
    }
  }
});

test('conditional cooking phases fail closed when no retained phase owns a locked user ingredient', async () => {
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const broth = templates.templates.find(row => row.template_id === 'broth-noodle-pot');
  broth.cooking_order = [
    { phase: 1, action_code: 'add_broth_and_noodles', slot_ids: ['liquid', 'staple'] },
    { phase: 2, action_code: 'cook_poultry_through', slot_ids: ['protein'], when: { slot_id: 'protein', category: 'chicken' } },
  ];
  const eggJourney = await preparedJourney(plannerRequest({ must: ['面条', '鸡蛋'] }));
  assert.throws(
    () => workerModule.buildLockedPlanContract(eggJourney.planned, templates),
    /locked_cooking_order_ingredient_missing/,
  );
});

test('chicken, egg-tofu-vegetable and multi-pot journeys render complete household steps', async () => {
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const requests = [
    plannerRequest({ must: ['鸡腿肉', '熟米饭'] }),
    plannerRequest({ must: ['鸡蛋', '豆腐', '白菜'] }),
    plannerRequest({ must: ['大米', '熟米饭', '番茄'] }),
  ];
  for (const request of requests) {
    const journey = await preparedJourney(request);
    const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
    assert.ok(locked.meals.every(meal => meal.cooking_order.every(phase => (
      phase.allowed_ingredient_refs.length > 0 || phase.required_safety_endpoints.length > 0
    ))));
    const checked = workerModule.validateGeneratedPlan(
      validModelOutput(locked),
      locked,
      ingredientTermUniverse(),
    );
    assert.equal(checked.ok, true);
    for (const meal of checked.meals) {
      const prose = meal.steps.map(step => step.text).join('\n');
      assert.match(prose, /(?:切|打散|放入|加入|翻炒|翻拌|焖煮|加热|煮至|热透)/);
      assert.doesNotMatch(prose, /(?:acid_base|staple|protein|action_code|完成完成|\{\{)/);
    }
  }

  const chicken = await preparedJourney(requests[0]);
  const chickenLocked = workerModule.buildLockedPlanContract(chicken.planned, templates);
  const chickenChecked = workerModule.validateGeneratedPlan(
    validModelOutput(chickenLocked), chickenLocked, ingredientTermUniverse(),
  );
  assert.match(chickenChecked.meals[0].steps.map(step => step.text).join('\n'), /鸡腿肉.*完全熟透，内部无粉红/);

  const egg = await preparedJourney(requests[1]);
  const eggLocked = workerModule.buildLockedPlanContract(egg.planned, templates);
  const eggChecked = workerModule.validateGeneratedPlan(
    validModelOutput(eggLocked), eggLocked, ingredientTermUniverse(),
  );
  assert.match(eggChecked.meals.map(meal => meal.steps.map(step => step.text).join('\n')).join('\n'), /鸡蛋.*完全凝固/);
});

test('braised noodle plan survives the full generation contract with noodle, bean and pork safety evidence', async () => {
  const journey = await preparedJourney(plannerRequest({ must: ['面条', '豆角', '猪里脊'] }));
  assert.equal(journey.planned.status, 'complete');
  assert.equal(journey.planned.plan.pots[0].template_id, 'braised-noodle-pot');

  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
  assert.deepEqual(new Set(locked.meals[0].safety_endpoints), new Set([
    'noodle_tender', 'bean_fully_cooked', 'pork_fully_cooked',
  ]));

  const result = await postGenerate(journey);
  assert.equal(result.response.status, 200);
  const prose = result.body.meals[0].steps.map(step => step.text).join('\n');
  assert.match(prose, /无硬芯|熟透/);
  assert.match(prose, /煮熟软化/);
  assert.match(prose, /完全熟透/);
});

test('cooked-rice broth plan survives generation with conditional chicken and root-vegetable endpoints', async () => {
  const journey = await preparedJourney(plannerRequest({
    must: ['剩米饭', '鸡腿肉', '土豆'],
    servings: 2,
  }));
  assert.equal(journey.planned.status, 'complete');
  assert.equal(journey.planned.plan.pots[0].template_id, 'broth-rice-pot');

  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
  assert.deepEqual(new Set(locked.meals[0].safety_endpoints), new Set([
    'heated_through', 'poultry_fully_cooked_no_pink', 'tender',
  ]));
  const actions = locked.meals[0].cooking_order.map(row => row.action_code);
  assert.ok(actions.includes('cook_poultry_through'));
  assert.equal(actions.includes('gentle_set_protein'), false);

  const result = await postGenerate(journey);
  assert.equal(result.response.status, 200);
  assert.equal(result.upstreamBodies.length, 1);
  const prose = result.body.meals[0].steps.map(step => step.text).join('\n');
  assert.match(prose, /鸡腿肉.*完全熟透，内部无粉红/);
  assert.match(prose, /土豆.*熟软/);
  assert.match(prose, /剩米饭.*热透/);
});

test('locked safety endpoints come exactly from the selected template categories without duplicates', async () => {
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const eggJourney = await preparedJourney(plannerRequest({ must: ['番茄', '鸡蛋'] }));
  const eggLocked = workerModule.buildLockedPlanContract(eggJourney.planned, templates);
  assert.deepEqual(eggLocked.meals[0].safety_endpoints, ['egg_fully_set']);

  const chickenJourney = await preparedJourney(plannerRequest({ must: ['鸡胸肉', '熟米饭'] }));
  const chickenLocked = workerModule.buildLockedPlanContract(chickenJourney.planned, templates);
  assert.deepEqual(chickenLocked.meals[0].safety_endpoints, ['heated_through', 'poultry_fully_cooked_no_pink']);
});

test('controlled prose scan rejects finite basic and recipe-only ingredients outside the locked plan', async t => {
  const termUniverse = ingredientTermUniverse();
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const journey = await preparedJourney(plannerRequest({ must: ['番茄', '鸡蛋'] }));
  const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
  const cases = [
    ['step adds cheese alias', output => { output.meals[0].steps[0].text += '加入芝士。'; }],
    ['step adds cooking wine', output => { output.meals[0].steps[0].text += '淋入料酒。'; }],
    ['step adds generic sugar', output => { output.meals[0].steps[0].text += '再加糖。'; }],
    ['step adds unplanned salt', output => { output.meals[0].steps[0].text += '放入盐。'; }],
    ['step adds unplanned oil', output => { output.meals[0].steps[0].text += '倒入油。'; }],
    ['step adds recipe-only parmesan', output => { output.meals[0].steps[0].text += '撒帕玛森奶酪。'; }],
    ['step adds discouraged-only winter melon', output => { output.meals[0].steps[0].text += '加入冬瓜。'; }],
    ['dish name adds cheese', output => { output.meals[0].dish_name = '芝士番茄鸡蛋锅'; }],
    ['reason adds cooking wine', output => { output.meals[0].recommendation_reason += '料酒可以增香。'; }],
  ];
  for (const [name, mutate] of cases) {
    await t.test(name, () => {
      const output = validModelOutput(locked);
      mutate(output);
      assert.equal(workerModule.validateGeneratedPlan(output, locked, termUniverse).ok, false);
    });
  }
  const noWaterJourney = await preparedJourney(plannerRequest({ intent: 'quick', must: ['熟米饭', '鸡蛋'] }));
  const noWaterLocked = workerModule.buildLockedPlanContract(noWaterJourney.planned, templates);
  assert.equal(noWaterLocked.meals[0].locked_ingredients.some(item => item.canonical === '水'), false);
  const addsWater = validModelOutput(noWaterLocked);
  addsWater.meals[0].steps[0].text += '再加水。';
  assert.equal(workerModule.validateGeneratedPlan(addsWater, noWaterLocked, termUniverse).ok, false);
});

test('closed placeholder grammar rejects ingredients absent from every finite term index', async t => {
  const termUniverse = ingredientTermUniverse();
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const journey = await preparedJourney(plannerRequest({ must: ['鸡腿肉', '熟米饭'] }));
  const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
  const cases = [
    ['bacon in step', output => { output.meals[0].steps[0].text += '再加入培根。'; }],
    ['avocado in dish', output => { output.meals[0].dish_name = '牛油果鸡腿饭'; }],
    ['arbitrary main ingredient in reason', output => { output.meals[0].recommendation_reason += '星云菜也很适合。'; }],
  ];
  for (const [name, mutate] of cases) {
    await t.test(name, () => {
      const output = validModelOutput(locked);
      mutate(output);
      const checked = workerModule.validateGeneratedPlan(output, locked, termUniverse);
      assert.equal(checked.ok, false);
      assert.equal(checked.reason_code, 'uncontrolled_prose');
    });
  }
});

test('locked refs cannot conceal deletion or omission language', async t => {
  const termUniverse = ingredientTermUniverse();
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const journey = await preparedJourney(plannerRequest({ must: ['番茄', '鸡蛋'] }));
  const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
  const cases = [
    '番茄不使用，留在冰箱。',
    '丢弃番茄，不放入锅。',
    '省略番茄即可。',
    '去掉番茄。',
  ];
  for (const text of cases) {
    await t.test(text, () => {
      const output = validModelOutput(locked);
      const tomatoRef = locked.meals[0].locked_ingredients.find(item => item.raw_name === '番茄').ingredient_ref;
      const step = output.meals[0].steps.find(entry => entry.ingredient_refs.includes(tomatoRef));
      step.text = text;
      const checked = workerModule.validateGeneratedPlan(output, locked, termUniverse);
      assert.equal(checked.ok, false);
      assert.equal(checked.reason_code, 'ingredient_deletion_in_prose');
    });
  }
});

test('safety endpoint tags require the risk ingredient ref and achieved doneness evidence', async t => {
  const termUniverse = ingredientTermUniverse();
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const journey = await preparedJourney(plannerRequest({ must: ['鸡腿肉', '熟米饭'] }));
  const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
  const chickenRef = locked.meals[0].locked_ingredients.find(item => item.raw_name === '鸡腿肉').ingredient_ref;
  const cases = [
    ['still pink despite tag', step => { step.text = '鸡腿肉仍然粉红，稍后再煮熟。'; }, 'safety_evidence_invalid'],
    ['tag without risk ingredient ref', step => {
      step.text = '鸡腿肉完全熟透，内部无粉红。';
      step.ingredient_refs = step.ingredient_refs.filter(ref => ref !== chickenRef);
    }, 'safety_endpoint_ingredient_ref_missing'],
    ['future doneness claim', step => { step.text = '鸡腿肉稍后会煮熟。'; }, 'safety_evidence_invalid'],
    ['surface color only', step => { step.text = '鸡腿肉表面已经变色。'; }, 'safety_evidence_invalid'],
    ['elapsed time only', step => { step.text = '鸡腿肉已经加热。'; }, 'safety_evidence_invalid'],
    ['negated fully cooked', step => { step.text = '鸡腿肉并未完全熟透，内部无粉红。'; }, 'safety_evidence_invalid'],
    ['not fully cooked', step => { step.text = '鸡腿肉不是完全熟透，只是内部无粉红。'; }, 'safety_evidence_invalid'],
    ['not completely cooked', step => { step.text = '鸡腿肉不完全熟透，内部无粉红。'; }, 'safety_evidence_invalid'],
    ['by no means completely cooked', step => { step.text = '鸡腿肉并非完全熟透，内部无粉红。'; }, 'safety_evidence_invalid'],
    ['failed to cook completely', step => { step.text = '鸡腿肉未能完全熟透，内部无粉红。'; }, 'safety_evidence_invalid'],
    ['blood contradicts positive claim', step => { step.text = '鸡腿肉完全熟透，内部无粉红，但中心仍带血。'; }, 'safety_evidence_invalid'],
    ['pink contradicts positive claim', step => { step.text = '鸡腿肉完全熟透，但切开内部带粉红。'; }, 'safety_evidence_invalid'],
  ];
  for (const [name, mutate, reason] of cases) {
    await t.test(name, () => {
      const output = validModelOutput(locked);
      const safetyStep = output.meals[0].steps.find(step => step.completed_safety_endpoints.length);
      mutate(safetyStep);
      const checked = workerModule.validateGeneratedPlan(output, locked, termUniverse);
      assert.equal(checked.ok, false);
      assert.equal(checked.reason_code, reason);
    });
  }

  const eggJourney = await preparedJourney(plannerRequest({ must: ['番茄', '鸡蛋'] }));
  const eggLocked = workerModule.buildLockedPlanContract(eggJourney.planned, templates);
  for (const text of [
    '鸡蛋未完全凝固。',
    '鸡蛋没有完全凝固。',
    '鸡蛋不算完全凝固。',
    '鸡蛋不完全凝固。',
    '鸡蛋并非完全凝固。',
    '鸡蛋未能完全凝固。',
    '鸡蛋已经熟透，但蛋黄保持流心。',
    '鸡蛋完全凝固，但蛋黄仍是溏心。',
  ]) {
    await t.test(text, () => {
      const output = validModelOutput(eggLocked);
      const safetyStep = output.meals[0].steps.find(step => step.completed_safety_endpoints.length);
      safetyStep.text = text;
      const checked = workerModule.validateGeneratedPlan(output, eggLocked, termUniverse);
      assert.equal(checked.ok, false);
      assert.equal(checked.reason_code, 'safety_evidence_invalid');
    });
  }
});

test('specific meat cuts must survive in the dish or a relevant referenced step', async t => {
  const termUniverse = ingredientTermUniverse();
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const cases = [
    [plannerRequest({ must: ['牛里脊', '番茄'] }), '牛里脊', '牛肉'],
    [plannerRequest({ must: ['鸡腿肉', '熟米饭'] }), '鸡腿肉', '鸡肉'],
    [plannerRequest({ must: ['鸡胸肉', '熟米饭'] }), '鸡胸肉', '鸡肉'],
  ];
  for (const [request, rawPart, canonical] of cases) {
    await t.test(rawPart, async () => {
      const journey = await preparedJourney(request);
      const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
      const output = validModelOutput(locked);
      const special = locked.meals.flatMap(meal => meal.locked_ingredients)
        .find(item => item.raw_name === rawPart);
      const token = `{{${special.ingredient_ref}}}`;
      for (const meal of output.meals) {
        meal.dish_name = meal.dish_name.replaceAll(token, canonical);
        meal.recommendation_reason = meal.recommendation_reason.replaceAll(token, canonical);
        meal.steps.forEach(step => { step.text = step.text.replaceAll(token, canonical); });
      }
      assert.equal(workerModule.validateGeneratedPlan(output, locked, termUniverse).ok, false);
    });
  }

  await t.test('other chicken part in dish name', async () => {
    const journey = await preparedJourney(plannerRequest({ must: ['鸡腿肉', '熟米饭'] }));
    const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
    const output = validModelOutput(locked);
    output.meals[0].dish_name = '鸡胸肉一锅饭';
    assert.equal(workerModule.validateGeneratedPlan(output, locked, termUniverse).ok, false);
  });

  await t.test('other beef part in recommendation reason', async () => {
    const journey = await preparedJourney(plannerRequest({ must: ['牛里脊', '番茄'] }));
    const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
    const output = validModelOutput(locked);
    output.meals[0].recommendation_reason = '牛腩口感更适合这个计划。';
    assert.equal(workerModule.validateGeneratedPlan(output, locked, termUniverse).ok, false);
  });
});

test('locked Fujian mustard ground pork rice rejects ingredient substitutions', async () => {
  const journey = await preparedJourney(plannerRequest({ must: ['大米', '芥菜', '猪肉末'] }));
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
  const names = locked.meals.flatMap(meal => meal.locked_ingredients.map(item => item.raw_name));
  assert.ok(names.includes('芥菜'));
  assert.ok(names.includes('猪肉末'));
  const valid = validModelOutput(locked);
  assert.equal(workerModule.validateGeneratedPlan(valid, locked, ingredientTermUniverse()).ok, true);
  for (const forbidden of ['白菜', '猪肉片', '排骨']) {
    const output = structuredClone(valid);
    output.meals[0].steps[0].text += `加入${forbidden}。`;
    assert.equal(workerModule.validateGeneratedPlan(output, locked, ingredientTermUniverse()).ok, false, forbidden);
  }
});

test('colloquial quantities and unplanned appliances are rejected in every prose field', async t => {
  const termUniverse = ingredientTermUniverse();
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const journey = await preparedJourney(plannerRequest({ must: ['番茄', '鸡蛋'] }));
  const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
  const cases = [
    ['half bowl in step', output => { output.meals[0].steps[0].text += '加入半碗水。'; }],
    ['half spoon in dish', output => { output.meals[0].dish_name = '半勺盐番茄鸡蛋锅'; }],
    ['quarter hour in reason', output => { output.meals[0].recommendation_reason += '一刻钟就能完成。'; }],
    ['two quarters in step', output => { output.meals[0].steps[0].text += '烹调两刻钟。'; }],
    ['half hour in step', output => { output.meals[0].steps[0].text += '再等半小时。'; }],
    ['half cup in step', output => { output.meals[0].steps[0].text += '加入半杯水。'; }],
    ['tablespoon in dish', output => { output.meals[0].dish_name = '一汤匙油番茄鸡蛋锅'; }],
    ['teaspoon in reason', output => { output.meals[0].recommendation_reason += '一茶匙就够。'; }],
    ['seconds in step', output => { output.meals[0].steps[0].text += '搅拌30秒。'; }],
    ['egg count in step', output => { output.meals[0].steps[0].text += '打入2个鸡蛋。'; }],
    ['slice count in step', output => { output.meals[0].steps[0].text += '切3片。'; }],
    ['half jin in step', output => { output.meals[0].steps[0].text += '加入半斤番茄。'; }],
    ['two liang in reason', output => { output.meals[0].recommendation_reason += '二两番茄就够。'; }],
    ['unsafe Celsius symbol', output => { output.meals[0].steps[0].text += '加热到50℃。'; }],
    ['unsafe Celsius word', output => { output.meals[0].steps[0].text += '中心达到50摄氏度。'; }],
    ['oven in step', output => { output.meals[0].steps[0].text += '转入烤箱完成。'; }],
    ['air fryer in dish', output => { output.meals[0].dish_name = '空气炸锅番茄鸡蛋'; }],
    ['microwave in reason', output => { output.meals[0].recommendation_reason += '微波炉更省事。'; }],
    ['electric pressure cooker in step', output => { output.meals[0].steps[0].text += '改用电压力锅。'; }],
  ];
  for (const [name, mutate] of cases) {
    await t.test(name, () => {
      const output = validModelOutput(locked);
      mutate(output);
      const checked = workerModule.validateGeneratedPlan(output, locked, termUniverse);
      assert.equal(checked.ok, false);
      assert.equal(
        checked.reason_code,
        /oven|fryer|microwave|pressure/.test(name) ? 'multiple_vessels' : 'numeric_prose_override',
      );
    });
  }
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

test('placeholder refs are exact per phase and cannot cross meals', async t => {
  const termUniverse = ingredientTermUniverse();
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const single = await preparedJourney(plannerRequest({ must: ['番茄', '鸡蛋'] }));
  const singleLocked = workerModule.buildLockedPlanContract(single.planned, templates);

  await t.test('a phase cannot name another current-meal ref', () => {
    const output = validModelOutput(singleLocked);
    const step = output.meals[0].steps.find(entry => entry.ingredient_refs.length === 1);
    const other = output.meals[0].ingredient_refs.find(ref => !step.ingredient_refs.includes(ref));
    step.text = step.text.replace(`{{${step.ingredient_refs[0]}}}`, `{{${other}}}`);
    assert.equal(workerModule.validateGeneratedPlan(output, singleLocked, termUniverse).ok, false);
  });

  const multi = await preparedJourney(plannerRequest({ must: ['大米', '熟米饭', '番茄'] }));
  const multiLocked = workerModule.buildLockedPlanContract(multi.planned, templates);
  await t.test('dish name cannot use another meal placeholder', () => {
    const output = validModelOutput(multiLocked);
    const foreignRef = output.meals[1].ingredient_refs[0];
    const ownRef = output.meals[0].ingredient_refs[0];
    output.meals[0].dish_name = output.meals[0].dish_name.replace(`{{${ownRef}}}`, `{{${foreignRef}}}`);
    assert.equal(workerModule.validateGeneratedPlan(output, multiLocked, termUniverse).ok, false);
  });
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

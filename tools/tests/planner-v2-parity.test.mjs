import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import worker from '../../worker/src/worker.js';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const bridgePath = path.join(repoRoot, 'tools/planner-v2-local-bridge.mjs');
const assetNames = [
  'ingredient-taxonomy.v1.json',
  'meal-templates.v2.json',
  'ratio-rules.v1.json',
  'recipe-library.json',
  'recipe-runtime.v1.json',
  'recipe-action-profiles.v1.json',
  'rice-meal-catalog.v1.json',
  'rice-meal-collection.v1.json',
  'foods-tw.json',
];
const sourceAssets = Object.freeze(Object.fromEntries(assetNames.map(name => [
  `/${name}`,
  fs.readFileSync(path.join(repoRoot, 'tools/data', name), 'utf8'),
])));

function request({
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

function riceMealRequest(overrides = {}) {
  return {
    schema_version: 3,
    product_focus: 'rice_meal',
    servings: 2,
    pantry: ['鸡腿', '土豆'],
    dislikes: [],
    ...overrides,
  };
}

const RICE_MEAL_BUILD_META = JSON.stringify({
  buildId: 'rice-meal-parity',
  plannerRollout: 'direct-recommend',
  generationMode: 'deterministic',
  productFocus: 'rice-meal-v1',
});
const RICE_MEAL_SECRET = 'rice-meal-parity-secret';

function assets(source = sourceAssets) {
  return {
    async fetch(input) {
      const pathname = new URL(input.url).pathname;
      if (!Object.hasOwn(source, pathname)) return new Response('missing', { status: 404 });
      return new Response(source[pathname], {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    },
  };
}

async function workerPlan(body, source = sourceAssets) {
  const response = await worker.fetch(new Request('http://localhost:8765/plan-meal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:8081' },
    body: JSON.stringify(body),
  }), { ASSETS: assets(source), RATE_LIMIT: 0 });
  return { status: response.status, body: await response.json() };
}

async function workerRiceMeal(endpoint, body) {
  const response = await worker.fetch(new Request(`http://localhost:8765${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:8081' },
    body: JSON.stringify(body),
  }), {
    ASSETS: assets({ ...sourceAssets, '/build-meta.json': RICE_MEAL_BUILD_META }),
    RATE_LIMIT: 0,
    RICE_MEAL_PLAN_SECRET: RICE_MEAL_SECRET,
  });
  return { status: response.status, body: await response.json() };
}

function nodeBridgePlan(body, extraEnv = {}) {
  const result = spawnSync(process.execPath, [bridgePath, '/plan-meal'], {
    cwd: repoRoot,
    input: JSON.stringify(body),
    encoding: 'utf8',
    timeout: 40000,
    env: {
      ...process.env,
      DEEPSEEK_API_KEY: '',
      YIGUOCHU_GENERATION_MODE: 'deterministic',
      ...extraEnv,
    },
  });
  assert.equal(result.signal, null, result.stderr);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.bridge_version, 1);
  return { status: envelope.status, body: envelope.body };
}

function nodeBridge(endpoint, body, extraEnv = {}) {
  const result = spawnSync(process.execPath, [bridgePath, endpoint], {
    cwd: repoRoot,
    input: JSON.stringify(body),
    encoding: 'utf8',
    timeout: 40000,
    env: {
      ...process.env,
      DEEPSEEK_API_KEY: '',
      API_URL: '',
      MODEL_NAME: '',
      DAILY_BUDGET: '',
      RICE_MEAL_PLAN_SECRET: '',
      ...extraEnv,
    },
  });
  assert.equal(result.signal, null, result.stderr);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.bridge_version, 1);
  return { status: envelope.status, body: envelope.body };
}

function pythonPlannerChildEnv(extraEnv = {}) {
  const result = spawnSync('python3', [
    '-c',
    'import json, ai_proxy; print(json.dumps(ai_proxy._planner_bridge_env(), sort_keys=True))',
  ], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 15000,
    env: {
      ...process.env,
      HOST: '127.0.0.1',
      YIGUOCHU_PRODUCT_FOCUS: 'rice-meal-v1',
      RICE_MEAL_PLAN_SECRET: 'explicit-rice-secret',
      DEEPSEEK_API_KEY: 'must-not-cross-rice-boundary',
      API_URL: 'https://example.invalid/should-not-forward',
      MODEL_NAME: 'must-not-forward',
      DAILY_BUDGET: '999',
      YIGUOCHU_GENERATION_MODE: 'llm',
      ...extraEnv,
    },
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout.trim());
}

function syntheticShanghaiAssetFixture() {
  const source = structuredClone(sourceAssets);
  const ratios = JSON.parse(source['/ratio-rules.v1.json']);
  const runtime = JSON.parse(source['/recipe-runtime.v1.json']);
  const entry = runtime.entries.find(row => row.recipe_id === 'shanghai-salted-pork-vegetable-rice');
  const ruleId = 'test-parity-shanghai-executable-v1';
  ratios.rules.push({
    rule_id: ruleId,
    evidence_recipe_ids: [entry.recipe_id],
    execution_mode: 'executable',
    when: { recipe_id: entry.recipe_id },
    operations: [
      ['raw-rice', 'raw', null, 100],
      ['salted-pork-belly', 'cured', 'cured_slice', 50],
      ['small-bok-choy', 'raw', null, 75],
    ].map(([canonical_id, state, shape_or_cut, grams]) => ({
      operator: 'per_serving',
      target: { canonical_id, state, ...(shape_or_cut ? { shape_or_cut } : {}) },
      grams: { min: grams, default: grams, max: grams },
    })).concat({
      operator: 'ratio',
      target: { name: '水', category: 'liquid' },
      numerator: { resource: 'retained_liquid_grams' },
      denominator: { canonical_id: 'raw-rice', state: 'raw', measure: 'grams' },
      min: 1.3,
      default: 1.3,
      max: 1.3,
    }),
    rounding: { grams_to_nearest: 1 },
    example_context: { ingredient_name: '大米' },
  });
  const techniqueGraph = [
    { phase: 1, action_code: 'start_cured_pork_and_rice', slot_ids: ['protein', 'staple'], fact_refs: [] },
    { phase: 2, action_code: 'add_locked_liquid', slot_ids: ['staple'], fact_refs: ['total_liquid_grams'] },
    { phase: 3, action_code: 'cook_rice_until_tender_before_late_greens', slot_ids: ['staple'], fact_refs: [] },
    { phase: 4, action_code: 'add_leafy_vegetable_late', slot_ids: ['fast_vegetable'], fact_refs: [] },
    {
      phase: 5,
      action_code: 'complete_recipe_safety',
      slot_ids: ['protein', 'staple'],
      fact_refs: [],
      safety_endpoint_codes: ['pork_fully_cooked', 'grain_tender_no_hard_center'],
    },
  ];
  Object.assign(entry, {
    activation_status: 'preview_enabled',
    slot_assignment: { staple: ['raw-rice'], protein: ['salted-pork-belly'], fast_vegetable: ['small-bok-choy'] },
    ratio_rule_ids: [ruleId],
    ratio_default_rule_id: ruleId,
    action_profile_ref: { action_profile_id: 'test-parity-shanghai-profile', profile_version: 'test-v1' },
    technique_graph: techniqueGraph,
    seasoning_actions: [
      { action_code: 'taste_before_salt', amount_source: 'none' },
      { action_code: 'omit_extra_salt', amount_source: 'none' },
    ],
    safety_endpoints: [
      { endpoint_code: 'pork_fully_cooked', canonical_ids: ['salted-pork-belly'] },
      { endpoint_code: 'grain_tender_no_hard_center', canonical_ids: ['raw-rice'] },
    ],
    source_claims: ['identity', 'technique', 'ratio', 'seasoning', 'safety']
      .map(claim_type => ({ claim_type, evidence_index: 0 })),
    household_trial: {
      status: 'completed', trial_date: '2026-07-30', reviewer: 'synthetic-parity-fixture', outcome: 'passed',
    },
  });
  entry.identity_signature.identity_critical_action_sequence = techniqueGraph.map(step => step.action_code);
  const instances = techniqueGraph.map((step, index) => ({
    instance_id: `test-parity-shanghai-step-${index + 1}`,
    action_code: step.action_code,
    slot_ids: [...(step.slot_ids || [])],
    fact_refs: [...(step.fact_refs || [])],
    produces_resources: [...(step.produces_resources || [])],
    consumes_resources: [...(step.consumes_resources || [])],
    safety_endpoint_codes: [...(step.safety_endpoint_codes || [])],
  }));
  source['/ratio-rules.v1.json'] = JSON.stringify(ratios);
  source['/recipe-runtime.v1.json'] = JSON.stringify(runtime);
  source['/recipe-action-profiles.v1.json'] = JSON.stringify({
    action_profile_catalog_version: 'recipe-action-profiles-v1-20260731-r1',
    profiles: [{
      action_profile_id: entry.action_profile_ref.action_profile_id,
      profile_version: entry.action_profile_ref.profile_version,
      instances,
      execution_sequence: instances.map(instance => instance.instance_id),
    }],
  });
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'yiguochu-planner-assets-'));
  for (const name of assetNames) fs.writeFileSync(path.join(directory, name), source[`/${name}`]);
  return { source, directory };
}

async function workerRaw(endpoint, rawBody) {
  const response = await worker.fetch(new Request(`http://localhost:8765${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:8081' },
    body: rawBody,
  }), { ASSETS: assets(), RATE_LIMIT: 0 });
  return { status: response.status, body: await response.json() };
}

function pythonPlan(body, extraEnv = {}) {
  const result = spawnSync('python3', ['ai_proxy.py', '--plan-meal', JSON.stringify(body)], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 40000,
    env: {
      ...process.env,
      DEEPSEEK_API_KEY: '',
      KIMI_API_KEY: '',
      YIGUOCHU_GENERATION_MODE: 'llm',
      ...extraEnv,
    },
  });
  assert.equal(result.signal, null, result.stderr);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(result.stdout.trim(), 'CLI must print one JSON response body');
  return JSON.parse(result.stdout);
}

function pythonRiceMealPlan(body) {
  return pythonPlan(body, {
    YIGUOCHU_PRODUCT_FOCUS: 'rice-meal-v1',
    RICE_MEAL_PLAN_SECRET: RICE_MEAL_SECRET,
  });
}

function digestAssets() {
  const hash = crypto.createHash('sha256');
  for (const name of assetNames) hash.update(fs.readFileSync(path.join(repoRoot, 'tools/data', name)));
  return hash.digest('hex');
}

function generationEnvelope(planRequest, planned) {
  return {
    schema_version: 2,
    planner_version: planned.planner_version,
    template_catalog_version: planned.template_catalog_version,
    plan_id: planned.plan.plan_id,
    plan_request: structuredClone(planRequest),
  };
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
      const mentioned = new Set(steps.flatMap(step => step.ingredient_refs));
      const missing = meal.locked_ingredients.map(item => item.ingredient_ref).filter(ref => !mentioned.has(ref));
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

async function reservePort() {
  const server = http.createServer();
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', resolve).once('error', reject));
  const { port } = server.address();
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function startProxy(extraEnv = {}) {
  const port = await reservePort();
  const child = spawn('python3', ['ai_proxy.py'], {
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      DEEPSEEK_API_KEY: '',
      KIMI_API_KEY: '',
      YIGUOCHU_GENERATION_MODE: 'llm',
      ...extraEnv,
    },
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; });
  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`proxy exited: ${stdout}\n${stderr}`);
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) return { child, base, logs: () => ({ stdout, stderr }) };
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 40));
  }
  child.kill('SIGTERM');
  throw new Error(`proxy did not start: ${stdout}\n${stderr}`);
}

async function stopProxy(proxy) {
  if (proxy.child.exitCode !== null) return;
  proxy.child.kill('SIGTERM');
  await Promise.race([
    new Promise(resolve => proxy.child.once('exit', resolve)),
    new Promise(resolve => setTimeout(resolve, 1000)),
  ]);
  if (proxy.child.exitCode === null) proxy.child.kill('SIGKILL');
}

async function postJson(base, endpoint, body, rawBody = null) {
  const response = await fetch(`${base}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:8081' },
    body: rawBody ?? JSON.stringify(body),
  });
  return { response, body: await response.json() };
}

async function postRaw(base, endpoint, rawBody, { origin, contentType = 'text/plain' } = {}) {
  const headers = { 'Content-Type': contentType };
  if (origin !== undefined) headers.Origin = origin;
  const response = await fetch(`${base}${endpoint}`, {
    method: 'POST',
    headers,
    body: rawBody,
  });
  return { response, body: await response.json() };
}

async function fakeUpstream() {
  const calls = [];
  const server = http.createServer(async (req, res) => {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    calls.push({ url: req.url, headers: req.headers, raw });
    if (req.url === '/non2xx') {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('secret upstream payload');
      return;
    }
    let output;
    try {
      const upstreamBody = JSON.parse(raw);
      const user = upstreamBody.messages.find(message => message.role === 'user');
      const locked = JSON.parse(user.content).locked_plan;
      output = validModelOutput(locked);
      if (req.url === '/contract') output.plan_id = 'forged-model-plan';
    } catch {
      output = { invalid: true };
    }
    const content = req.url === '/malformed' ? '{broken' : JSON.stringify(output);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ choices: [{ message: { content } }] }));
  });
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', resolve).once('error', reject));
  const { port } = server.address();
  return {
    calls,
    url: pathname => `http://127.0.0.1:${port}${pathname}`,
    close: () => new Promise(resolve => server.close(resolve)),
  };
}

async function parityCase(name, body, expectedStatus) {
  const expected = await workerPlan(body);
  assert.equal(expected.body.status, expectedStatus, `${name}: fixture drifted`);
  const actual = pythonPlan(body);
  assert.deepEqual(actual, expected.body, `${name}: Python planner facts drifted from Worker`);
  return expected.body;
}

test('Python /plan-meal CLI is byte-semantic equivalent to Worker across real V2 journeys', async t => {
  const assetsBefore = digestAssets();
  const basePartialRequest = request({ must: ['番茄', '鸡蛋', '神秘叶子'] });
  const basePartial = (await workerPlan(basePartialRequest)).body;
  const acceptance = {
    action: 'accept_partial',
    plan_id: basePartial.plan.plan_id,
    acknowledged_unplanned: ['神秘叶子'],
  };
  const acceptedRequest = request({
    must: ['番茄', '鸡蛋', '神秘叶子'],
    currentPlanId: basePartial.plan.plan_id,
    decision: acceptance,
  });
  const accepted = (await workerPlan(acceptedRequest)).body;

  const noAlternativeBaseRequest = request({ must: ['大米'] });
  const noAlternativeBase = (await workerPlan(noAlternativeBaseRequest)).body;

  const staleBaseRequest = request({ must: ['番茄', '鸡蛋'] });
  const staleBase = (await workerPlan(staleBaseRequest)).body;

  const journeys = [
    ['recommend honest partial use', request({ mode: 'recommend', prefer: ['番茄', '鸡蛋', '西兰花', '神秘叶子'] }), 'ready'],
    ['full pantry', request({ must: ['番茄', '鸡蛋'] }), 'complete'],
    ['beef alias', request({ must: ['牛里脊', '番茄'] }), 'complete'],
    ['tofu aliases', request({ must: ['南豆腐', '北豆腐', '白菜'] }), 'complete'],
    ['unknown ingredient', basePartialRequest, 'needs_user_decision'],
    ['quick intent', request({ intent: 'quick', must: ['番茄', '鸡蛋'] }), 'complete'],
    ['braised noodle complete', request({ must: ['面条', '豆角', '猪肉'] }), 'complete'],
    ['cured meat mixed rice', request({ must: ['大米', '青菜', '咸肉'] }), 'complete'],
    ['slow cut remains unplanned', request({ must: ['面条', '白菜', '排骨'] }), 'needs_user_decision'],
    ['two pot plan', request({ must: ['大米', '熟米饭', '番茄'] }), 'complete'],
    ['third pot decision', request({ must: ['大米', '熟米饭', '面条', '番茄', '洋葱'] }), 'needs_user_decision'],
    ['partial accepted', acceptedRequest, 'partial_accepted'],
    ['accepted partial swap', request({
      must: ['番茄', '鸡蛋', '神秘叶子'],
      currentPlanId: accepted.plan.plan_id,
      decision: { ...acceptance, swap_current: true },
    }), ['partial_accepted', 'no_alternative_plan']],
    ['no alternative', request({ must: ['大米'], currentPlanId: noAlternativeBase.plan.plan_id }), 'no_alternative_plan'],
    ['stale current mismatch', request({ must: ['番茄', '西兰花'], currentPlanId: staleBase.plan.plan_id }), 'stale_plan'],
  ];

  for (const [name, body, expectedStatus] of journeys) {
    await t.test(name, async () => {
      const expected = await workerPlan(body);
      const acceptedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
      assert.ok(acceptedStatuses.includes(expected.body.status), `${name}: fixture drifted to ${expected.body.status}`);
      const actual = pythonPlan(body);
      assert.deepEqual(actual, expected.body);
    });
  }
  assert.equal(digestAssets(), assetsBefore, 'planner parity journeys must not mutate shared assets');
});

test('Python bridge mirrors initial candidate bundles without recursive candidates', async () => {
  const body = request({
    mode: 'recommend',
    prefer: ['番茄', '鸡蛋', '豆腐', '西兰花', '熟米饭'],
  });
  const expected = await workerPlan(body);
  const actual = pythonPlan(body);
  assert.deepEqual(actual, expected.body);
  assert.ok(actual.candidate_plans.length >= 1 && actual.candidate_plans.length <= 3);
  assert.equal(actual.preferred_plan_id, actual.candidate_plans[0].plan.plan_id);
  assert.ok(actual.candidate_plans.every(candidate => !('candidate_plans' in candidate)));
});

test('rice-meal Worker and local Python bridge preserve selector and compiler facts with no model route', async () => {
  const requestBody = riceMealRequest();
  const workerPlanResult = await workerRiceMeal('/plan-meal', requestBody);
  const pythonCliPlan = pythonRiceMealPlan(requestBody);

  assert.equal(workerPlanResult.status, 200);
  assert.deepEqual(pythonCliPlan, workerPlanResult.body);
  assert.deepEqual(workerPlanResult.body.candidates.map(candidate => candidate.variant_id), [
    'home-chicken-leg-potato-rice',
  ]);
  assert.deepEqual(
    workerPlanResult.body.candidates.map(candidate => ({
      used: candidate.used_items.map(item => item.canonical_id),
      unused: candidate.unused_items.map(item => item.canonical_id || item.raw),
      coverage: candidate.coverage_count,
      grade: candidate.nutrition_grade,
    })),
    [{ used:['chicken-leg', 'potato'], unused:[], coverage:2, grade:'B' }],
  );

  const workerGenerated = await workerRiceMeal('/generate-plan', {
    plan_token: workerPlanResult.body.candidates[0].plan_token,
  });
  const proxy = await startProxy({
    RATE_LIMIT: '1',
    DEEPSEEK_API_KEY: '',
    KIMI_API_KEY: '',
    YIGUOCHU_PRODUCT_FOCUS: 'rice-meal-v1',
    RICE_MEAL_PLAN_SECRET: RICE_MEAL_SECRET,
  });
  try {
    const proxyPlan = await postJson(proxy.base, '/plan-meal', requestBody);
    const proxyGenerated = await postJson(proxy.base, '/generate-plan', {
      plan_token: proxyPlan.body.candidates[0].plan_token,
    });
    assert.equal(proxyPlan.response.status, workerPlanResult.status);
    assert.deepEqual(proxyPlan.body, workerPlanResult.body);
    assert.equal(proxyGenerated.response.status, workerGenerated.status);
    assert.deepEqual(proxyGenerated.body, workerGenerated.body);
    assert.equal(proxyGenerated.body.meals[0].dish_name, '鸡腿土豆焖饭');
    assert.deepEqual(proxyGenerated.body.plan.ingredient_amounts.map(item => [item.canonical_id, item.grams]), [
      ['raw-rice', 200],
      ['chicken-leg', 120],
      ['potato', 100],
      ['water', 280],
    ]);
    assert.deepEqual(proxyGenerated.body.meals[0].steps.map(step => step.action_code), [
      'rinse_raw_rice',
      'cut_chicken_leg_to_small_pieces',
      'prepare_vegetables',
      'load_inner_pot',
      'start_closed_lid_program',
      'rest_lid_closed',
      'verify_safety_endpoints',
      'fluff_and_serve',
    ]);
  } finally {
    await stopProxy(proxy);
  }
});

test('Rice Meal bridge permits its fixed development signing secret only in explicit loopback dev mode', async () => {
  const unsafeHost = nodeBridge('/plan-meal', riceMealRequest(), {
    YIGUOCHU_PRODUCT_FOCUS: 'rice-meal-v1',
    YIGUOCHU_LOCAL_DEV: '1',
    HOST: '0.0.0.0',
  });
  assert.equal(unsafeHost.status, 503);
  assert.equal(unsafeHost.body.code, 'rice_meal_signing_unavailable');

  const implicitNodeDev = nodeBridge('/plan-meal', riceMealRequest(), {
    YIGUOCHU_PRODUCT_FOCUS: 'rice-meal-v1',
    HOST: '127.0.0.1',
  });
  assert.equal(implicitNodeDev.status, 503);
  assert.equal(implicitNodeDev.body.code, 'rice_meal_signing_unavailable');

  const explicitLoopbackDev = nodeBridge('/plan-meal', riceMealRequest(), {
    YIGUOCHU_PRODUCT_FOCUS: 'rice-meal-v1',
    YIGUOCHU_LOCAL_DEV: '1',
    HOST: '127.0.0.1',
  });
  assert.equal(explicitLoopbackDev.status, 200);
  assert.equal(explicitLoopbackDev.body.status, 'ready');

  const hosted = await startProxy({
    HOST: '0.0.0.0',
    YIGUOCHU_PRODUCT_FOCUS: 'rice-meal-v1',
    RICE_MEAL_PLAN_SECRET: '',
  });
  try {
    const response = await postJson(hosted.base, '/plan-meal', riceMealRequest());
    assert.equal(response.response.status, 503);
    assert.equal(response.body.code, 'rice_meal_signing_unavailable');
  } finally {
    await stopProxy(hosted);
  }

  const hostedMode = await startProxy({
    HOST: '127.0.0.1',
    YIGUOCHU_HOSTED_MODE: '1',
    YIGUOCHU_PRODUCT_FOCUS: 'rice-meal-v1',
    RICE_MEAL_PLAN_SECRET: '',
  });
  try {
    const response = await postJson(hostedMode.base, '/plan-meal', riceMealRequest());
    assert.equal(response.response.status, 503);
    assert.equal(response.body.code, 'rice_meal_signing_unavailable');
  } finally {
    await stopProxy(hostedMode);
  }
});

test('Rice Meal local bridge strips model configuration from its child environment', () => {
  const childEnv = pythonPlannerChildEnv();
  assert.equal(childEnv.YIGUOCHU_PRODUCT_FOCUS, 'rice-meal-v1');
  assert.equal(childEnv.RICE_MEAL_PLAN_SECRET, 'explicit-rice-secret');
  assert.equal(childEnv.YIGUOCHU_LOCAL_DEV, '1');
  for (const forbidden of [
    'DEEPSEEK_API_KEY',
    'API_URL',
    'MODEL_NAME',
    'DAILY_BUDGET',
    'YIGUOCHU_GENERATION_MODE',
  ]) assert.equal(Object.hasOwn(childEnv, forbidden), false, `${forbidden} must not reach a Rice bridge child`);

  const hostedEnv = pythonPlannerChildEnv({
    RICE_MEAL_PLAN_SECRET: '',
    YIGUOCHU_HOSTED_MODE: '1',
  });
  assert.equal(Object.hasOwn(hostedEnv, 'RICE_MEAL_PLAN_SECRET'), false);
  assert.equal(Object.hasOwn(hostedEnv, 'YIGUOCHU_LOCAL_DEV'), false);
});

test('Node local bridge and Worker return the same synthetic named identity, title, catalog and signed plan ID', async () => {
  const fixture = syntheticShanghaiAssetFixture();
  try {
    const body = request({
      mode: 'recommend',
      prefer: ['大米', '咸五花肉', '小白菜'],
    });
    const expected = await workerPlan(body, fixture.source);
    const actual = nodeBridgePlan(body, { YIGUOCHU_PLANNER_ASSET_DIR: fixture.directory });

    assert.equal(expected.status, 200, JSON.stringify(expected.body));
    assert.equal(expected.body.plan_source, 'named_recipe');
    assert.equal(expected.body.recipe_id, 'shanghai-salted-pork-vegetable-rice');
    assert.deepEqual(expected.body.presentation, {
      badge: '依据菜谱',
      title: '上海奉贤咸肉菜饭',
      subtitle: '按已核验菜谱的用料、比例与熟制顺序呈现。',
      source_label: '查看一锅出标准配方',
      canonical_path: '/recipes.html?id=shanghai-salted-pork-vegetable-rice',
    });
    assert.equal(expected.body.recipe_runtime_catalog_version, 'recipe-runtime-v1-20260730-r1');
    assert.equal(
      expected.body.plan.pots[0].execution_contract.action_profile_catalog_version,
      'recipe-action-profiles-v1-20260731-r1',
    );
    assert.deepEqual(actual, expected);
  } finally {
    fs.rmSync(fixture.directory, { recursive: true, force: true });
  }
});

test('Python plan CLI is deterministic, API-key free, asset immutable and shell inert', async () => {
  const body = request({ must: ['牛里脊', '番茄'], prefer: ['$(touch /tmp/yiguochu-planner-shell-injection)'] });
  const marker = '/tmp/yiguochu-planner-shell-injection';
  fs.rmSync(marker, { force: true });
  const before = digestAssets();
  const first = pythonPlan(body);
  const second = pythonPlan(body);
  assert.equal(first.plan.plan_id, second.plan.plan_id);
  assert.deepEqual(first, second);
  assert.equal(digestAssets(), before);
  assert.equal(fs.existsSync(marker), false);
});

test('fresh noodle identity is identical across Worker and Python bridge', async () => {
  const body = await parityCase(
    'fresh noodle braise',
    request({ must:['鲜小麦面条','豆角','猪肉末'] }),
    'complete',
  );
  const noodle = body.normalized_items.find(item => item.raw === '鲜小麦面条');
  assert.deepEqual(
    [noodle.canonical_id, noodle.canonical, noodle.category],
    ['fresh-wheat-noodle', '鲜小麦面条', 'noodle'],
  );
});

test('cowpea ambiguity and explicit states are identical across Worker and Python bridge', async () => {
  for (const must of [
    ['大米', '去核红枣', '豇豆'],
    ['大米', '去核红枣', '干豇豆'],
    ['大米', '去核红枣', '熟豇豆'],
  ]) {
    const requestBody = request({ must });
    const workerResult = await workerPlan(requestBody);
    const pythonResult = pythonPlan(requestBody);
    assert.equal(workerResult.status, 200);
    assert.deepEqual(pythonResult, workerResult.body);
  }
});

test('millet and chickpea states are identical across Worker and Python bridge', async t => {
  await t.test('cooked chickpea completes the soft millet pot', async () => {
    const body = await parityCase(
      'soft millet with cooked chickpea',
      request({ must: ['小米', '土豆', '熟鹰嘴豆'] }),
      'complete',
    );
    assert.equal(body.plan.pots[0].template_id, 'soft-family-rice-pot');
    assert.deepEqual(
      Object.fromEntries(body.normalized_items.map(item => [item.raw, item.state])),
      { '小米': 'raw', '土豆': 'raw', '熟鹰嘴豆': 'cooked' },
    );
    assert.deepEqual(
      Object.fromEntries(body.plan.pots[0].ingredient_amounts.map(item => [item.name, item.grams])),
      { '小米':80, '土豆':180, '熟鹰嘴豆':176, '食用油':10, '水':664, '盐':3 },
    );
  });

  await t.test('generic chickpea pauses for state clarification', async () => {
    const body = await parityCase(
      'ambiguous chickpea state',
      request({ must: ['小米', '土豆', '鹰嘴豆'] }),
      'needs_user_decision',
    );
    const item = body.plan.unplanned_must_use.find(row => row.raw === '鹰嘴豆');
    assert.equal(item.reason_code, 'ambiguous_ingredient_state');
    assert.deepEqual(item.eligible_items, ['干鹰嘴豆', '熟鹰嘴豆']);
    assert.equal(body.generation_allowed, false);
  });

  await t.test('dry chickpea remains explicit and unplanned', async () => {
    const body = await parityCase(
      'unsupported dry chickpea state',
      request({ must: ['小米', '土豆', '干鹰嘴豆'] }),
      'needs_user_decision',
    );
    const normalized = body.normalized_items.find(row => row.raw === '干鹰嘴豆');
    const unplanned = body.plan.unplanned_must_use.find(row => row.raw === '干鹰嘴豆');
    assert.deepEqual([normalized.category, normalized.state], ['dry_legume', 'dry']);
    assert.equal(unplanned.reason_code, 'unsupported_ingredient_state');
  });

  await t.test('quick intent rejects the slow soft millet template', async () => {
    const body = await parityCase(
      'quick soft millet',
      request({ intent: 'quick', must: ['小米', '土豆'] }),
      'no_valid_plan',
    );
    assert.equal(body.generation_allowed, false);
    assert.equal(body.plan.pots.length, 0);
  });
});

test('Xinjiang lamb leg rice facts are identical across Worker and Python bridge', async () => {
  const body = await parityCase(
    'Xinjiang lamb leg rice',
    request({ must: ['羊腿肉', '洋葱', '胡萝卜', '大米'] }),
    'complete',
  );
  assert.equal(body.plan.plan_kind, 'single_pot');
  assert.deepEqual(body.plan.unplanned_must_use, []);
  assert.equal(body.plan.pots[0].template_id, 'savory-mixed-rice-pot');
  const lamb = body.normalized_items.find(item => item.raw === '羊腿肉');
  assert.deepEqual(
    [lamb.canonical_id, lamb.canonical, lamb.shape_or_cut, lamb.cooking_risk],
    ['lamb-leg', '羊肉', 'leg', 'raw_lamb'],
  );
  assert.deepEqual(
    Object.fromEntries(body.plan.pots[0].ingredient_amounts.map(item => [item.name, item.grams])),
    { 大米:200, 羊腿肉:200, 胡萝卜:240, 洋葱:80, 水:270, 食用油:10, 盐:3 },
  );
});

test('Jiangnan cured rice facts are identical across Worker and Python bridge', async () => {
  const body = await parityCase(
    'Jiangnan cured rice',
    request({ must: ['大米', '咸五花肉', '小白菜'] }),
    'complete',
  );
  assert.deepEqual(body.plan.unplanned_must_use, []);
  assert.equal(body.plan.plan_kind, 'single_pot');
  assert.deepEqual(
    body.plan.pots[0].required_extra_items.map(item => item.name),
    ['水'],
  );
  assert.deepEqual(
    new Set(body.plan.pots[0].planned_must_use.map(item => item.raw)),
    new Set(['大米', '咸五花肉', '小白菜']),
  );
});

test('Fujian mustard ground pork rice facts are identical across Worker and Python bridge', async () => {
  const body = await parityCase(
    'Fujian mustard ground pork rice',
    request({ must: ['大米', '芥菜', '猪肉末'] }),
    'complete',
  );
  assert.equal(body.plan.plan_kind, 'single_pot');
  assert.deepEqual(body.plan.unplanned_must_use, []);
  assert.deepEqual(
    new Set(body.plan.pots[0].planned_must_use.map(item => item.raw)),
    new Set(['大米', '芥菜', '猪肉末']),
  );
  assert.equal(
    body.normalized_items.find(item => item.raw === '猪肉末')?.shape_or_cut,
    'ground',
  );
});

test('Lingnan skinless chicken mushroom rice facts are identical across Worker and Python bridge', async () => {
  const body = await parityCase(
    'Lingnan skinless chicken mushroom rice',
    request({ must: ['大米', '去皮鸡腿肉', '鲜香菇'] }),
    'complete',
  );
  assert.equal(body.plan.plan_kind, 'single_pot');
  assert.deepEqual(body.plan.unplanned_must_use, []);
  assert.deepEqual(
    new Set(body.plan.pots[0].planned_must_use.map(item => item.raw)),
    new Set(['大米', '去皮鸡腿肉', '鲜香菇']),
  );
  const leg = body.normalized_items.find(item => item.raw === '去皮鸡腿肉');
  assert.deepEqual(
    [leg.canonical, leg.shape_or_cut, leg.cooking_risk],
    ['鸡肉', 'leg', 'raw_poultry'],
  );
});

test('20-item planning stays within the approved bridge ceiling', () => {
  const pantry = ['大米', '熟米饭', '面条', '番茄', '鸡蛋', '老豆腐', '牛里脊', '鸡胸肉', '猪里脊', '白菜', '西兰花', '青菜', '胡萝卜', '土豆', '金针菇', '香菇', '洋葱', '玉米', '虾仁', '豆角'];
  const started = performance.now();
  const result = pythonPlan(request({ must: pantry, decision: { action: 'allow_third_pot' } }));
  assert.match(result.plan.plan_id, /^pln_v2_/);
  assert.ok(performance.now() - started < 40000);
});

test('Node bridge rejects malformed stdin with a bounded machine failure', () => {
  const result = spawnSync(process.execPath, [bridgePath, '/plan-meal'], {
    cwd: repoRoot,
    input: '{not-json',
    encoding: 'utf8',
    timeout: 15000,
    env: { PATH: process.env.PATH || '' },
  });
  assert.notEqual(result.status, 0);
  assert.ok((result.stdout.length + result.stderr.length) < 2048);
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, /not-json/);
  const machine = JSON.parse(result.stdout.trim());
  assert.equal(machine.bridge_version, 1);
  assert.equal(machine.error.code, 'invalid_bridge_input');
});

test('HTTP /plan-meal is key-free, rate-free and exactly reflects Worker planner facts', async () => {
  const proxy = await startProxy({ RATE_LIMIT: '1' });
  try {
    const body = request({ must: ['牛里脊', '番茄'], intent: 'quick' });
    const expected = await workerPlan(body);
    for (let index = 0; index < 2; index += 1) {
      const actual = await postJson(proxy.base, '/plan-meal', body);
      assert.equal(actual.response.status, expected.status);
      assert.deepEqual(actual.body, expected.body);
      assert.equal(actual.response.headers.get('access-control-allow-origin'), 'http://localhost:8081');
      assert.match(actual.response.headers.get('content-type'), /application\/json/);
    }
  } finally {
    await stopProxy(proxy);
  }
});

test('ambiguous HTTP planning pauses generation without rate or upstream work', async () => {
  const upstream = await fakeUpstream();
  const proxy = await startProxy({
    RATE_LIMIT: '1',
    DEEPSEEK_API_KEY: 'local-test-key',
    API_URL: upstream.url('/valid'),
  });
  try {
    const body = request({ must: ['大米', '去核红枣', '豇豆'] });
    for (let index = 0; index < 2; index += 1) {
      const result = await postJson(proxy.base, '/plan-meal', body);
      assert.equal(result.response.status, 200);
      assert.equal(result.body.status, 'needs_user_decision');
      assert.equal(result.body.generation_allowed, false);
      assert.equal(
        result.body.plan.unplanned_must_use.find(item => item.raw === '豇豆')?.reason_code,
        'ambiguous_ingredient_state',
      );
    }
    assert.equal(upstream.calls.length, 0);
  } finally {
    await stopProxy(proxy);
    await upstream.close();
  }
});

test('HTTP V2 request parsing exactly matches Worker before bridge or rate work', async t => {
  const proxy = await startProxy({ RATE_LIMIT: '1' });
  try {
    for (const [endpoint, cases] of [
      ['/plan-meal', ['{broken', '', '[]', JSON.stringify({ padding: 'x'.repeat(33 * 1024) })]],
      ['/generate-plan', ['{broken', '', '[]', JSON.stringify({ padding: 'x'.repeat(33 * 1024) })]],
    ]) {
      for (const raw of cases) {
        await t.test(`${endpoint} ${raw.length} bytes`, async () => {
          const expected = await workerRaw(endpoint, raw);
          const actual = await postJson(proxy.base, endpoint, null, raw);
          assert.equal(actual.response.status, expected.status);
          assert.deepEqual(actual.body, expected.body);
        });
      }
    }
  } finally {
    await stopProxy(proxy);
  }
});

test('valid single and multi-pot generation each use exactly one fake upstream request', async () => {
  const upstream = await fakeUpstream();
  const proxy = await startProxy({
    RATE_LIMIT: '10',
    DEEPSEEK_API_KEY: 'secret-key-must-not-leak',
    API_URL: upstream.url('/valid'),
  });
  try {
    for (const must of [['番茄', '鸡蛋'], ['大米', '熟米饭', '番茄']]) {
      const planRequest = request({ must });
      const planned = (await workerPlan(planRequest)).body;
      const before = upstream.calls.length;
      const generated = await postJson(proxy.base, '/generate-plan', generationEnvelope(planRequest, planned));
      assert.equal(generated.response.status, 200, JSON.stringify(generated.body));
      assert.equal(upstream.calls.length - before, 1);
      assert.equal(generated.body.plan_id, planned.plan.plan_id);
      assert.equal(generated.body.plan.pots.length, planned.plan.pots.length);
    }
    assert.doesNotMatch(JSON.stringify(proxy.logs()), /secret-key-must-not-leak/);
  } finally {
    await stopProxy(proxy);
    await upstream.close();
  }
});

test('deterministic local generation needs no key, spends no rate allowance and calls no upstream', async () => {
  const upstream = await fakeUpstream();
  const proxy = await startProxy({
    RATE_LIMIT: '1',
    DEEPSEEK_API_KEY: '',
    KIMI_API_KEY: '',
    API_URL: upstream.url('/valid'),
    YIGUOCHU_GENERATION_MODE: 'deterministic',
  });
  try {
    const planRequest = request({ must: ['番茄', '鸡蛋'] });
    const planned = (await workerPlan(planRequest)).body;
    const submitted = generationEnvelope(planRequest, planned);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const generated = await postJson(proxy.base, '/generate-plan', submitted);
      assert.equal(generated.response.status, 200, JSON.stringify(generated.body));
      assert.equal(generated.body.plan_id, planned.plan.plan_id);
    }
    assert.equal(upstream.calls.length, 0);
  } finally {
    await stopProxy(proxy);
    await upstream.close();
  }
});

test('local proxy treats a displayed non-preferred candidate as valid and still enforces its rate gate', async () => {
  const upstream = await fakeUpstream();
  const proxy = await startProxy({
    RATE_LIMIT: '1',
    DEEPSEEK_API_KEY: 'local-test-key',
    API_URL: upstream.url('/valid'),
  });
  try {
    const planRequest = request({
      mode: 'recommend',
      prefer: ['番茄', '鸡蛋', '豆腐', '西兰花', '熟米饭'],
    });
    const planned = await postJson(proxy.base, '/plan-meal', planRequest);
    assert.ok(planned.body.candidate_plans.length >= 2);
    const second = planned.body.candidate_plans[1];
    const generateRequest = generationEnvelope(planRequest, second);
    const first = await postJson(proxy.base, '/generate-plan', generateRequest);
    assert.equal(first.response.status, 200);
    assert.equal(first.body.plan_id, second.plan.plan_id);
    const secondAttempt = await postJson(proxy.base, '/generate-plan', generateRequest);
    assert.equal(secondAttempt.response.status, 429);
    assert.equal(secondAttempt.body.code, 'rate_limited');
    assert.equal(upstream.calls.length, 1);
  } finally {
    await stopProxy(proxy);
    await upstream.close();
  }
});

test('stale, non-generatable and forged partial requests spend zero rate and zero upstream calls', async () => {
  const upstream = await fakeUpstream();
  const proxy = await startProxy({
    RATE_LIMIT: '1',
    DEEPSEEK_API_KEY: 'test-key',
    API_URL: upstream.url('/valid'),
  });
  try {
    const validRequest = request({ must: ['番茄', '鸡蛋'] });
    const validPlan = (await workerPlan(validRequest)).body;
    const stale = generationEnvelope(validRequest, validPlan);
    stale.plan_id = 'pln_v2_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const staleResponse = await postJson(proxy.base, '/generate-plan', stale);
    assert.equal(staleResponse.response.status, 409);
    assert.equal(staleResponse.body.code, 'stale_plan');

    const decisionRequest = request({ must: ['番茄', '鸡蛋', '神秘叶子'] });
    const decisionPlan = (await workerPlan(decisionRequest)).body;
    const decisionResponse = await postJson(proxy.base, '/generate-plan', generationEnvelope(decisionRequest, decisionPlan));
    assert.equal(decisionResponse.response.status, 409);
    assert.equal(decisionResponse.body.status, 'needs_user_decision');

    const forgedRequest = request({
      must: ['番茄', '鸡蛋', '神秘叶子'],
      currentPlanId: decisionPlan.plan.plan_id,
      decision: {
        action: 'accept_partial',
        plan_id: 'pln_v2_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        acknowledged_unplanned: ['神秘叶子'],
      },
    });
    const forged = generationEnvelope(forgedRequest, decisionPlan);
    const forgedResponse = await postJson(proxy.base, '/generate-plan', forged);
    assert.equal(forgedResponse.response.status, 409);
    assert.equal(forgedResponse.body.code, 'stale_plan');
    assert.equal(upstream.calls.length, 0);

    const valid = await postJson(proxy.base, '/generate-plan', generationEnvelope(validRequest, validPlan));
    assert.equal(valid.response.status, 200, JSON.stringify(valid.body));
    assert.equal(upstream.calls.length, 1);
    const limited = await postJson(proxy.base, '/generate-plan', generationEnvelope(validRequest, validPlan));
    assert.equal(limited.response.status, 429);
    assert.equal(limited.body.code, 'rate_limited');
    assert.equal(upstream.calls.length, 1);
  } finally {
    await stopProxy(proxy);
    await upstream.close();
  }
});

test('missing DeepSeek key is checked before local rate accounting, then a keyed proxy spends one attempt', async t => {
  const upstream = await fakeUpstream();
  t.after(() => upstream.close());
  const planRequest = request({ must: ['番茄', '鸡蛋'] });
  const planned = (await workerPlan(planRequest)).body;
  const submitted = generationEnvelope(planRequest, planned);

  const keyless = await startProxy({ RATE_LIMIT: '1', DEEPSEEK_API_KEY: '', KIMI_API_KEY: '' });
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = await postJson(keyless.base, '/generate-plan', submitted);
      assert.equal(result.response.status, 500);
      assert.deepEqual(result.body, {
        error: 'DEEPSEEK_API_KEY 未配置',
        code: 'missing_api_key',
      });
    }
    assert.equal(upstream.calls.length, 0);
  } finally {
    await stopProxy(keyless);
  }

  const keyed = await startProxy({
    RATE_LIMIT: '1',
    DEEPSEEK_API_KEY: 'test-key',
    API_URL: upstream.url('/valid'),
  });
  try {
    const valid = await postJson(keyed.base, '/generate-plan', submitted);
    assert.equal(valid.response.status, 200, JSON.stringify(valid.body));
    assert.equal(upstream.calls.length, 1);
    const limited = await postJson(keyed.base, '/generate-plan', submitted);
    assert.equal(limited.response.status, 429);
    assert.equal(limited.body.code, 'rate_limited');
    assert.equal(upstream.calls.length, 1);
  } finally {
    await stopProxy(keyed);
  }
});

test('forbidden and opaque origins are rejected before planner bridge execution', async () => {
  const proxy = await startProxy({ PLANNER_NODE_EXECUTABLE: '/definitely/missing/yiguochu-node' });
  try {
    for (const origin of ['https://evil.example', 'null']) {
      const result = await postRaw(proxy.base, '/plan-meal', JSON.stringify(request({ must: ['番茄'] })), { origin });
      assert.equal(result.response.status, 403);
      assert.deepEqual(result.body, { error: '请求来源不允许', code: 'origin_forbidden' });
      assert.equal(result.response.headers.get('access-control-allow-origin'), null);
    }
  } finally {
    await stopProxy(proxy);
  }
});

test('evil/null text requests cannot spend rate or reach V2 and legacy generation side effects', async t => {
  const upstream = await fakeUpstream();
  t.after(() => upstream.close());
  const proxy = await startProxy({
    RATE_LIMIT: '1',
    DEEPSEEK_API_KEY: 'test-key',
    API_URL: upstream.url('/valid'),
  });
  try {
    const planRequest = request({ must: ['番茄', '鸡蛋'] });
    const planned = (await workerPlan(planRequest)).body;
    const submitted = JSON.stringify(generationEnvelope(planRequest, planned));
    for (const [endpoint, rawBody] of [
      ['/generate-plan', submitted],
      ['/generate-meal', '{broken'],
    ]) {
      for (const origin of ['https://evil.example', 'null']) {
        const rejected = await postRaw(proxy.base, endpoint, rawBody, { origin });
        assert.equal(rejected.response.status, 403, `${endpoint} ${origin}`);
        assert.equal(rejected.body.code, 'origin_forbidden');
      }
    }
    assert.equal(upstream.calls.length, 0);

    for (const origin of ['http://localhost:8081', 'http://127.0.0.1:8081']) {
      const allowedPlan = await postRaw(proxy.base, '/plan-meal', JSON.stringify(planRequest), {
        origin,
        contentType: 'application/json',
      });
      assert.equal(allowedPlan.response.status, 200);
    }
    const curlStyle = await postRaw(proxy.base, '/generate-plan', submitted, {
      origin: undefined,
      contentType: 'application/json',
    });
    assert.equal(curlStyle.response.status, 200, JSON.stringify(curlStyle.body));
    assert.equal(upstream.calls.length, 1);
    const limited = await postRaw(proxy.base, '/generate-plan', submitted, {
      origin: 'http://localhost:8081',
      contentType: 'application/json',
    });
    assert.equal(limited.response.status, 429);
    assert.equal(upstream.calls.length, 1);
  } finally {
    await stopProxy(proxy);
  }
});

test('model contract failures and upstream failures are never repaired, retried or leaked', async t => {
  for (const [pathname, status, code] of [
    ['/malformed', 422, 'model_contract_violation'],
    ['/contract', 422, 'model_contract_violation'],
    ['/non2xx', 502, 'upstream_error'],
  ]) {
    await t.test(pathname, async () => {
      const upstream = await fakeUpstream();
      const proxy = await startProxy({
        RATE_LIMIT: '10',
        DEEPSEEK_API_KEY: 'secret-key-must-not-leak',
        API_URL: upstream.url(pathname),
      });
      try {
        const planRequest = request({ must: ['番茄', '鸡蛋'] });
        const planned = (await workerPlan(planRequest)).body;
        const result = await postJson(proxy.base, '/generate-plan', generationEnvelope(planRequest, planned));
        assert.equal(result.response.status, status);
        assert.equal(result.body.code, code);
        assert.equal(upstream.calls.length, 1);
        assert.doesNotMatch(JSON.stringify(result.body), /secret upstream payload|secret-key-must-not-leak|broken|forged-model-plan/);
        assert.doesNotMatch(JSON.stringify(proxy.logs()), /secret upstream payload|secret-key-must-not-leak|forged-model-plan/);
      } finally {
        await stopProxy(proxy);
        await upstream.close();
      }
    });
  }
});

test('missing Node and invalid bridge JSON fail closed with bounded planner errors', async t => {
  for (const [name, executable] of [
    ['missing Node', '/definitely/missing/yiguochu-node'],
    ['invalid bridge JSON', '/bin/echo'],
  ]) {
    await t.test(name, async () => {
      const proxy = await startProxy({ PLANNER_NODE_EXECUTABLE: executable });
      try {
        const result = await postJson(proxy.base, '/plan-meal', request({ must: ['番茄'] }));
        assert.equal(result.response.status, 503);
        assert.equal(result.body.code, 'planner_unavailable');
        assert.ok(JSON.stringify(result.body).length < 512);
        assert.doesNotMatch(JSON.stringify(result.body), /missing\/yiguochu|planner-v2-local-bridge/);
      } finally {
        await stopProxy(proxy);
      }
    });
  }
});

test('generate bridge timeout is bounded and maps to upstream_timeout without retry', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'yiguochu-bridge-timeout-'));
  const wrapper = path.join(tempDir, 'node-wrapper');
  fs.writeFileSync(wrapper, `#!/bin/sh\nif [ "$2" = "/generate-plan" ]; then sleep 5; exit 0; fi\nexec "${process.execPath}" "$1" "$2"\n`);
  fs.chmodSync(wrapper, 0o700);
  const proxy = await startProxy({
    RATE_LIMIT: '10',
    DEEPSEEK_API_KEY: 'test-key',
    PLANNER_NODE_EXECUTABLE: wrapper,
    // Test-only timing: keep a wide scheduler margin under the serial full
    // suite without changing ai_proxy.py's production timeout default.
    PLANNER_BRIDGE_TIMEOUT_S: '1.5',
  });
  try {
    const planRequest = request({ must: ['番茄', '鸡蛋'] });
    const planned = (await workerPlan(planRequest)).body;
    const started = performance.now();
    const result = await postJson(proxy.base, '/generate-plan', generationEnvelope(planRequest, planned));
    const elapsed = performance.now() - started;
    assert.equal(result.response.status, 504);
    assert.equal(result.body.code, 'upstream_timeout');
    assert.ok(elapsed < 4000, `bridge timeout took ${elapsed}ms`);
    assert.doesNotMatch(JSON.stringify(result.body), /node-wrapper|planner-v2-local-bridge|test-key/);
  } finally {
    await stopProxy(proxy);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

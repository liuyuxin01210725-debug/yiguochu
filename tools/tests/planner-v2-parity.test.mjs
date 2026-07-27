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

function assets() {
  return {
    async fetch(input) {
      const pathname = new URL(input.url).pathname;
      if (!Object.hasOwn(sourceAssets, pathname)) return new Response('missing', { status: 404 });
      return new Response(sourceAssets[pathname], {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    },
  };
}

async function workerPlan(body) {
  const response = await worker.fetch(new Request('http://localhost:8765/plan-meal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:8081' },
    body: JSON.stringify(body),
  }), { ASSETS: assets(), RATE_LIMIT: 0 });
  return { status: response.status, body: await response.json() };
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
      ...extraEnv,
    },
  });
  assert.equal(result.signal, null, result.stderr);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(result.stdout.trim(), 'CLI must print one JSON response body');
  return JSON.parse(result.stdout);
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
  fs.writeFileSync(wrapper, `#!/bin/sh\nif [ "$2" = "/generate-plan" ]; then sleep 2; exit 0; fi\nexec "${process.execPath}" "$1" "$2"\n`);
  fs.chmodSync(wrapper, 0o700);
  const proxy = await startProxy({
    RATE_LIMIT: '10',
    DEEPSEEK_API_KEY: 'test-key',
    PLANNER_NODE_EXECUTABLE: wrapper,
    PLANNER_BRIDGE_TIMEOUT_S: '1',
  });
  try {
    const planRequest = request({ must: ['番茄', '鸡蛋'] });
    const planned = (await workerPlan(planRequest)).body;
    const started = performance.now();
    const result = await postJson(proxy.base, '/generate-plan', generationEnvelope(planRequest, planned));
    const elapsed = performance.now() - started;
    assert.equal(result.response.status, 504);
    assert.equal(result.body.code, 'upstream_timeout');
    assert.ok(elapsed < 1800, `bridge timeout took ${elapsed}ms`);
    assert.doesNotMatch(JSON.stringify(result.body), /node-wrapper|planner-v2-local-bridge|test-key/);
  } finally {
    await stopProxy(proxy);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

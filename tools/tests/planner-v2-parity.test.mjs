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
  const basePartialRequest = request({ must: ['番茄', '神秘叶子'] });
  const basePartial = (await workerPlan(basePartialRequest)).body;
  const acceptance = {
    action: 'accept_partial',
    plan_id: basePartial.plan.plan_id,
    acknowledged_unplanned: ['神秘叶子'],
  };
  const acceptedRequest = request({
    must: ['番茄', '神秘叶子'],
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
    ['two pot plan', request({ must: ['大米', '熟米饭', '番茄'] }), 'complete'],
    ['third pot decision', request({ must: ['大米', '熟米饭', '面条', '番茄', '洋葱'] }), 'needs_user_decision'],
    ['partial accepted', acceptedRequest, 'partial_accepted'],
    ['accepted partial swap', request({
      must: ['番茄', '神秘叶子'],
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

    const decisionRequest = request({ must: ['番茄', '神秘叶子'] });
    const decisionPlan = (await workerPlan(decisionRequest)).body;
    const decisionResponse = await postJson(proxy.base, '/generate-plan', generationEnvelope(decisionRequest, decisionPlan));
    assert.equal(decisionResponse.response.status, 409);
    assert.equal(decisionResponse.body.status, 'needs_user_decision');

    const forgedRequest = request({
      must: ['番茄', '神秘叶子'],
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

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';

import worker from '../worker/src/worker.js';

const readText = relative => fs.readFileSync(new URL(relative, import.meta.url), 'utf8');
const corpus = JSON.parse(readText('./data/pantry-planner-v2-journeys.json'));
const sourceAssets = Object.freeze({
  '/ingredient-taxonomy.v1.json': readText('./data/ingredient-taxonomy.v1.json'),
  '/meal-templates.v2.json': readText('./data/meal-templates.v2.json'),
  '/ratio-rules.v1.json': readText('./data/ratio-rules.v1.json'),
  '/recipe-library.json': readText('./data/recipe-library.json'),
});
const html = readText('../index.html');
const appScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).filter(script => !script.includes('serviceWorker'));

function assetBinding() {
  return {
    async fetch(request) {
      const pathname = new URL(request.url).pathname;
      return Object.hasOwn(sourceAssets, pathname)
        ? new Response(sourceAssets[pathname], { status: 200, headers: { 'Content-Type': 'application/json' } })
        : new Response('missing', { status: 404 });
    },
  };
}

function budgetBinding({ forbidden = false } = {}) {
  const store = new Map();
  return {
    gets: 0, puts: 0,
    async get(key) {
      this.gets += 1;
      if (forbidden) throw new Error('planner attempted a generation budget read');
      return store.get(key) ?? null;
    },
    async put(key, value) {
      this.puts += 1;
      if (forbidden) throw new Error('planner attempted a generation budget write');
      store.set(key, String(value));
    },
  };
}

function clone(value) { return structuredClone(value); }
function v2RequestFromLegacy(request) {
  const pantry = [...(request.pantry || [])];
  return {
    schema_version: 2,
    planner_version: 'pantry-planner-v2',
    constraints: {
      mode: request.purpose === 'pantry' ? 'pantry' : 'recommend',
      intent: request.purpose === 'pantry' ? 'normal' : ['quick', 'fresh', 'batch'].includes(request.purpose) ? request.purpose : 'normal',
      servings: Number(request.servings) || 2,
      must_use: request.purpose === 'pantry' ? pantry : [],
      prefer_use: request.purpose === 'pantry' ? [] : pantry,
      dislikes: [...(request.dislikes || [])], current_plan_id: null, recent_plan_ids: [], decision: null,
    },
  };
}

async function postPlan(request) {
  const budget = budgetBinding({ forbidden: true });
  let upstreamCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { upstreamCalls += 1; throw new Error('planner called upstream'); };
  try {
    const response = await worker.fetch(new Request('https://journeys.example/plan-meal', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://journeys.example' }, body: JSON.stringify(request),
    }), { ASSETS: assetBinding(), RATE_KV: budget });
    const body = await response.json();
    assert.equal(upstreamCalls, 0, 'plan-meal made a DeepSeek call');
    assert.equal(budget.gets, 0, 'plan-meal read generation budget');
    assert.equal(budget.puts, 0, 'plan-meal wrote generation budget');
    return { response, body, request: clone(request), upstreamCalls, budget };
  } finally { globalThis.fetch = originalFetch; }
}

function lockedInput(upstreamBody) {
  const content = upstreamBody.messages.find(message => message.role === 'user')?.content;
  return JSON.parse(content).locked_plan;
}

function validModelOutput(locked, alternate = false) {
  return {
    plan_id: locked.plan_id,
    meals: locked.meals.map(meal => {
      const steps = meal.cooking_order.map((phase, index) => ({
        order: index + 1,
        action_code: phase.action_code,
        text: meal.generation_text_contract.steps[index].allowed_texts[
          alternate && meal.generation_text_contract.steps[index].allowed_texts.length > 1 ? 1 : 0
        ],
        ingredient_refs: [...phase.allowed_ingredient_refs],
        completed_safety_endpoints: [...phase.required_safety_endpoints],
      }));
      const used = new Set(steps.flatMap(step => step.ingredient_refs));
      const missing = meal.locked_ingredients.map(item => item.ingredient_ref).filter(ref => !used.has(ref));
      if (missing.length) steps[0].ingredient_refs.push(...missing);
      return {
        meal_sequence: meal.meal_sequence,
        dish_name: meal.generation_text_contract.dish_name_options[alternate && meal.generation_text_contract.dish_name_options.length > 1 ? 1 : 0],
        ingredient_refs: meal.locked_ingredients.map(item => item.ingredient_ref),
        steps,
        recommendation_reason: meal.generation_text_contract.recommendation_reason_options[alternate && meal.generation_text_contract.recommendation_reason_options.length > 1 ? 1 : 0],
      };
    }),
  };
}

function mutateOutput(output, locked, mutation) {
  const first = output.meals[0];
  if (mutation === 'add_mushroom') first.dish_name += '香菇';
  if (mutation === 'tenderloin_to_brisket') first.dish_name = first.dish_name.replace(/牛里脊/g, '牛腩') + '牛腩';
  if (mutation === 'delete_mushroom') {
    const meal = locked.meals.find(item => item.locked_ingredients.some(ingredient => ingredient.raw_name === '金针菇')) || locked.meals[0];
    const mealIndex = locked.meals.indexOf(meal);
    const ref = meal.locked_ingredients.find(item => item.raw_name === '金针菇')?.ingredient_ref || output.meals[mealIndex].ingredient_refs[0];
    output.meals[mealIndex].ingredient_refs = output.meals[mealIndex].ingredient_refs.filter(item => item !== ref);
    for (const step of output.meals[mealIndex].steps) step.ingredient_refs = step.ingredient_refs.filter(item => item !== ref);
  }
  if (mutation === 'reverse_safety_order') first.steps.reverse();
  if (mutation === 'modify_ratio') first.steps[0].text += '再多加一倍水';
}

async function postGenerate(planRequest, planned, mutation) {
  const budget = budgetBinding();
  const upstreamBodies = [];
  const envelope = {
    schema_version: 2,
    planner_version: planned.planner_version,
    template_catalog_version: mutation === 'stale_catalog' ? 'templates-v2-stale' : planned.template_catalog_version,
    plan_id: planned.plan.plan_id,
    plan_request: clone(planRequest),
  };
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  const originalError = console.error;
  // Contract-negative journeys intentionally provoke Worker warnings. Capture
  // them inside the gate so a successful CLI remains a clean machine signal.
  console.warn = () => {};
  console.error = () => {};
  globalThis.fetch = async (_url, options) => {
    const upstreamBody = JSON.parse(String(options.body || '{}'));
    upstreamBodies.push(upstreamBody);
    if (mutation === 'upstream_failure') return new Response('upstream failed', { status: 503 });
    const locked = lockedInput(upstreamBody);
    const output = validModelOutput(locked, mutation === 'alternate_allowed_wording');
    mutateOutput(output, locked, mutation);
    return Response.json({ choices: [{ message: { content: JSON.stringify(output) } }] });
  };
  try {
    const response = await worker.fetch(new Request('https://journeys.example/generate-plan', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://journeys.example' }, body: JSON.stringify(envelope),
    }), { ASSETS: assetBinding(), DEEPSEEK_API_KEY: 'journey-test-key', RATE_LIMIT: 0, RATE_KV: budget });
    const body = await response.json();
    assert.ok(upstreamBodies.length <= 1, 'generate-plan retried DeepSeek');
    return { response, body, upstreamBodies, budget, envelope };
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    console.error = originalError;
  }
}

function frontendFixture(responses = [], profile = null) {
  const root = { innerHTML: '', addEventListener() {} };
  const calls = [];
  let responseIndex = 0;
  const location = { protocol: 'https:', hostname: 'journeys.example', origin: 'https://journeys.example' };
  const context = vm.createContext({
    console, URL, Date, Math, JSON, Set, Map, Promise, Error, RegExp, String, Number, Boolean, Array, Object,
    AbortController, structuredClone, setTimeout, clearTimeout, location,
    window: { scrollTo() {}, location, YIGUOCHU_PROXY: 'https://journeys.example' }, alert() {},
    localStorage: { getItem(key) { return key === 'yiguochu-v2' && profile ? JSON.stringify({ profile }) : null; }, setItem() {}, removeItem() {} },
    document: {
      getElementById(id) { return id === 'root' ? root : null; },
      querySelector() { return null; },
    },
    fetch: async (url, init) => {
      calls.push({ url, init });
      const next = responses[responseIndex++];
      if (!next) throw new Error('unexpected frontend fetch');
      return { ok: (next.status || 200) < 400, status: next.status || 200, async json() { return clone(next.body); } };
    },
  });
  appScripts.forEach((script, index) => vm.runInContext(script, context, { filename: `index-inline-${index + 1}.js` }));
  return { context, root, calls, eval(source) { return vm.runInContext(source, context); } };
}

function potItems(pot) { return [...(pot.planned_must_use || []), ...(pot.planned_prefer_use || [])]; }
function templates(result) { return (result.plan?.pots || []).map(pot => pot.template_id); }
function structure(result) {
  return JSON.stringify((result.plan?.pots || []).map(pot => ({ template_id: pot.template_id, slot_assignment: pot.slot_assignment })));
}
function allReasonCodes(result) {
  return new Set([...(result.plan?.unplanned_must_use || []), ...(result.plan?.unused_prefer_use || []), ...(result.unplanned || [])]
    .map(item => item.reason_code).filter(Boolean));
}
function assertNoLegacyMasquerade(body) {
  if (body.status !== 'ready') return;
  if (body.plan?.fallback_kind) assert.equal(body.plan.fallback_kind, 'legacy_recipe_selector');
  else assert.ok((body.plan?.pots || []).every(pot => pot.template_id), 'ready response had neither a template nor explicit fallback marker');
}
function assertNoDuplicateCanonicalAcrossPots(body) {
  const seen = new Set();
  for (const pot of body.plan?.pots || []) {
    for (const item of potItems(pot)) {
      if (!item.canonical) continue;
      assert.ok(!seen.has(item.canonical), `canonical ingredient duplicated across pots: ${item.canonical}`);
      seen.add(item.canonical);
    }
  }
}

async function resolveJourneyRequest(entry) {
  if (entry.request.legacy) return v2RequestFromLegacy(entry.request);
  const request = clone(entry.request);
  const marker = request.constraints.current_plan_id;
  if (!marker || !String(marker).startsWith('$')) return request;
  request.constraints.current_plan_id = null;
  request.constraints.decision = null;
  request.constraints.recent_plan_ids = [];
  const base = await postPlan(request);
  assert.equal(base.response.status, 200);
  if (marker === '$BASE_PLAN_ID') {
    entry._base = base.body;
    const id = base.body.plan.plan_id;
    const resolved = clone(entry.request);
    resolved.constraints.current_plan_id = id;
    if (resolved.constraints.decision?.plan_id === '$BASE_PLAN_ID') resolved.constraints.decision.plan_id = id;
    return resolved;
  }
  if (marker === '$ALTERNATIVE_PLAN_ID') return request;
  if (marker === '$DISCOVER_LEVEL2') {
    // A public-HTTP search over current catalog structures: the test is not
    // allowed to call the internal candidate helper to manufacture Level 2.
    let current = base.body;
    const seen = new Set([current.plan.plan_id]);
    for (let index = 0; index < 16; index += 1) {
      const probe = clone(request);
      probe.constraints.current_plan_id = current.plan.plan_id;
      probe.constraints.recent_plan_ids = [...seen];
      const next = await postPlan(probe);
      if (next.body.status === 'no_alternative_plan') break;
      if (templates(next.body).join('|') === templates(current).join('|') && structure(next.body) !== structure(current)) {
        entry._level2Base = current;
        return probe;
      }
      if (seen.has(next.body.plan.plan_id)) break;
      seen.add(next.body.plan.plan_id);
      current = next.body;
    }
    throw new Error('no same-template/different-slot Level 2 alternative is reachable through /plan-meal');
  }
  return request;
}

async function checkFrontend(entry, body, request) {
  if (!entry.frontend_required) return;
  if (entry.id === 'J41' || entry.id === 'J42') {
    const fixture = frontendFixture([{ body }], entry.request);
    const mapped = fixture.eval(`migrateProfile(${JSON.stringify(entry.request)})`);
    assert.equal(mapped.mode, entry.expect.mapped_mode);
    assert.equal(mapped.intent, entry.expect.mapped_intent);
    fixture.eval(`state.profile = migrateProfile(${JSON.stringify(entry.request)})`);
    const outbound = fixture.eval('buildPlanRequest()');
    assert.deepEqual([...outbound.constraints.must_use], entry.expect.must_use);
    assert.deepEqual([...outbound.constraints.prefer_use], entry.expect.prefer_use);
    await fixture.eval('fetchPlan(buildPlanRequest())');
    assert.equal(new URL(fixture.calls[0].url).pathname, '/plan-meal');
    assert.deepEqual(JSON.parse(fixture.calls[0].init.body), JSON.parse(JSON.stringify(outbound)));
    return;
  }
  const fixture = frontendFixture();
  fixture.eval(`state.profile=${JSON.stringify({ mode: request.constraints.mode, intent: request.constraints.intent, servings: String(request.constraints.servings), pantry: [...request.constraints.must_use, ...request.constraints.prefer_use].join(','), dislikes: request.constraints.dislikes.join(',') })}`);
  fixture.eval(`setDisplayedPlan(${JSON.stringify(body)},${JSON.stringify(request)},false)`);
  if (entry.id === 'J09') {
    assert.doesNotMatch(fixture.root.innerHTML, /全部用上|全部安排完成/);
    assert.match(fixture.root.innerHTML, /这次没有使用/);
  } else if (entry.id === 'J15') {
    assert.ok((body.plan?.pots || []).length <= 2);
    assert.match(fixture.root.innerHTML, /第三锅|还有食材没有安排/);
  } else if (entry.id === 'J16') {
    assert.ok((body.plan?.pots || []).length <= 3);
  } else if (entry.id === 'J21') {
    assert.ok(body.normalized_items.some(item => item.raw === '神秘叶子' && item.role === 'prefer_use'));
  } else if (entry.id === 'J22') {
    assert.match(fixture.root.innerHTML, /部分处理方案/);
    assert.match(fixture.root.innerHTML, /尚未处理/);
    assert.doesNotMatch(fixture.root.innerHTML, /全部安排完成/);
  } else if (entry.id === 'J23') {
    const before = clone(fixture.eval('state.profile'));
    fixture.eval("openEditableProfile()");
    const after = fixture.eval('state.profile');
    assert.equal(JSON.stringify(after), JSON.stringify(before));
    assert.equal(fixture.eval('state.view'), 'profile');
  } else if (entry.id === 'J29') {
    const cleanRequest = clone(request);
    cleanRequest.constraints.current_plan_id = null;
    const current = entry._base;
    const interactive = frontendFixture([{ body }]);
    interactive.eval(`state.profile=${JSON.stringify({ mode:'pantry', intent:'normal', servings:'2', pantry:'大米', dislikes:'' })}`);
    interactive.eval(`setDisplayedPlan(${JSON.stringify(current)},${JSON.stringify(cleanRequest)},false)`);
    await interactive.eval('requestAlternativePlan()');
    assert.equal(new URL(interactive.calls[0].url).pathname, '/plan-meal');
    const outbound = JSON.parse(interactive.calls[0].init.body);
    assert.equal(outbound.constraints.current_plan_id, current.plan.plan_id);
    assert.equal(interactive.eval('state.view'), 'v2-no-alternative');
    assert.match(interactive.root.innerHTML, /当前组合只有一个可靠的一锅方案/);
    assert.doesNotMatch(interactive.root.innerHTML, /生成失败|网络没接上/);
  }
}

async function runOne(entry) {
  const request = await resolveJourneyRequest(entry);
  const planned = await postPlan(request);
  assert.equal(planned.response.status, 200, `${entry.id} /plan-meal HTTP status`);
  const body = planned.body;
  assert.ok(entry.expect.status.includes(body.status), `${entry.id} unexpected status ${body.status}`);
  assert.ok(planned.upstreamCalls <= entry.plan_deepseek_max);
  if (body.status === 'complete') {
    assert.equal(body.plan.coverage_ratio, 1, `${entry.id} complete coverage`);
    assert.deepEqual(body.plan.unplanned_must_use, [], `${entry.id} complete has unplanned`);
    const submittedMust = body.normalized_items.filter(item => item.role === 'must_use' && !item.duplicate_of);
    const plannedCanonical = new Set((body.plan.planned_must_use || []).map(item => item.canonical || item.raw));
    assert.ok(submittedMust.every(item => plannedCanonical.has(item.canonical || item.raw)), `${entry.id} complete silently dropped must-use input`);
  }
  if (request.constraints.mode === 'pantry') assert.notEqual(body.plan?.fallback_kind, 'legacy_recipe_selector');
  if (request.constraints.decision?.action === 'allow_third_pot') assert.ok((body.plan?.pots || []).length <= 3, `${entry.id} exceeded acknowledged three-pot cap`);
  else assert.ok((body.plan?.pots || []).length <= 2, `${entry.id} exposed a third pot without acknowledgement`);
  if (request.constraints.mode === 'recommend') for (const item of body.plan?.unused_prefer_use || []) {
    assert.ok(item.reason_code && (item.reason || item.message), `${entry.id} recommend unused item lacks structured reason`);
  }
  if (entry.expect.generation_allowed != null) assert.equal(body.generation_allowed, entry.expect.generation_allowed);
  if (entry.expect.complete_forbidden) assert.notEqual(body.status, 'complete');
  if (entry.expect.pot_count_min != null) assert.ok((body.plan?.pots || []).length >= entry.expect.pot_count_min);
  if (entry.expect.pot_count_max != null) assert.ok((body.plan?.pots || []).length <= entry.expect.pot_count_max);
  if (entry.expect.pots_retained) assert.ok((body.plan?.pots || []).length > 0);
  if (entry.expect.complete_coverage != null && body.status === 'complete') assert.equal(body.plan.coverage_ratio, entry.expect.complete_coverage);
  if (entry.expect.single_pot_minimum_coverage != null && body.plan?.pots?.length === 1) assert.ok(body.plan.coverage_ratio >= entry.expect.single_pot_minimum_coverage);
  if (entry.expect.normalized) {
    const actual = body.normalized_items.find(item => item.raw === entry.expect.normalized.raw);
    assert.ok(actual, `${entry.id} normalized item missing`);
    for (const [key, value] of Object.entries(entry.expect.normalized)) if (key !== 'raw') assert.equal(actual[key], value, `${entry.id} normalized ${key}`);
  }
  if (entry.expect.reason_codes && body.status !== 'complete') {
    const actual = allReasonCodes(body);
    assert.ok(entry.expect.reason_codes.some(code => actual.has(code)), `${entry.id} expected one of ${entry.expect.reason_codes}; got ${[...actual]}`);
  }
  if (entry.expect.recognition_ratio_below != null) assert.ok(body.plan.recognition_ratio < entry.expect.recognition_ratio_below);
  if (entry.expect.minimum_items_per_pot != null) for (const pot of body.plan.pots) assert.ok(potItems(pot).length >= entry.expect.minimum_items_per_pot);
  if (entry.expect.no_duplicate_canonical_across_pots) assertNoDuplicateCanonicalAcrossPots(body);
  if (entry.expect.max_minutes_per_pot != null) for (const pot of body.plan.pots) assert.ok(pot.time_range.max_minutes <= entry.expect.max_minutes_per_pot);
  if (entry.expect.servings_per_pot != null) for (const pot of body.plan.pots) assert.equal(pot.servings, entry.expect.servings_per_pot);
  if (entry.expect.sequential_meals) assert.deepEqual(body.plan.pots.map(pot => pot.meal_sequence), body.plan.pots.map((_, index) => index + 1));
  if (entry.expect.semantic_denominator != null) {
    assert.equal(body.plan.coverage_ratio, 1);
    assert.equal(body.normalized_items.filter(item => !item.duplicate_of).length, entry.expect.semantic_denominator);
    assert.equal(body.normalized_items.length, entry.expect.raw_items_retained);
  }
  if (entry.expect.must_precedence_raw) {
    const items = body.normalized_items.filter(item => item.raw === entry.expect.must_precedence_raw);
    assert.equal(items.find(item => !item.duplicate_of)?.role, 'must_use');
    assert.equal(body.plan.planned_must_use.filter(item => item.canonical === '番茄').length, 1);
  }
  if (entry.expect.moisture_release_items_at_least != null) assert.ok(body.normalized_items.filter(item => item.moisture_release === 'high').length >= entry.expect.moisture_release_items_at_least);
  if (entry.expect.ratio_trace_required && body.plan.pots.length) assert.ok(body.plan.pots.some(pot => (pot.ratio_trace || []).length > 0));
  if (entry.expect.forbidden_template_ids) for (const pot of body.plan.pots || []) {
    if (!entry.expect.forbidden_template_ids.includes(pot.template_id)) continue;
    const assignedRaw = Object.values(pot.slot_assignment || {}).flat().map(item => item.raw);
    assert.ok(!assignedRaw.includes(entry.expect.normalized?.raw), `${entry.expect.normalized?.raw} entered ${pot.template_id}`);
  }
  if (entry.expect.forbidden_shapes) for (const pot of body.plan.pots || []) {
    const assignedShapes = Object.values(pot.slot_assignment || {}).flat().map(item => item.shape_or_cut).filter(Boolean);
    for (const shape of entry.expect.forbidden_shapes) assert.ok(!assignedShapes.includes(shape), `forbidden assigned shape ${shape}`);
  }
  if (entry.expect.forbidden_raw) for (const raw of entry.expect.forbidden_raw) assert.doesNotMatch(JSON.stringify(body.plan), new RegExp(raw));
  if (entry.expect.forbidden_required_extras) for (const raw of entry.expect.forbidden_required_extras) assert.doesNotMatch(JSON.stringify(body.plan?.required_extra_items || []), new RegExp(raw));
  if (entry.expect.allowed_extra_categories && body.plan?.required_extra_items) for (const item of body.plan.required_extra_items) assert.ok(entry.expect.allowed_extra_categories.includes(item.category));
  if (entry.expect.fallback_must_be_explicit) assertNoLegacyMasquerade(body);
  if (entry.expect.must_plan_raw) {
    const selected = [...(body.plan?.planned_must_use || []), ...(body.plan?.planned_prefer_use || [])];
    assert.ok(selected.some(item => item.raw === entry.expect.must_plan_raw), `${entry.expect.must_plan_raw} was not selected`);
  }
  if (entry.expect.different_plan_id) assert.notEqual(body.plan.plan_id, entry._base?.plan?.plan_id);
  if (entry.expect.same_template_different_slot_assignment) {
    assert.deepEqual(templates(body), templates(entry._level2Base));
    assert.notEqual(structure(body), structure(entry._level2Base));
  }
  if (entry.id === 'J19') assert.equal(body.plan.coverage_ratio, 1);
  if (entry.id === 'J27') {
    assert.notDeepEqual(templates(body), templates(entry._base));
    assert.notEqual(structure(body), structure(entry._base));
    assert.ok(body.plan.coverage_ratio >= entry._base.plan.coverage_ratio);
  }
  if (entry.id === 'J29') {
    assert.equal(body.code, 'no_alternative_plan');
    assert.ok(body.actions.some(action => action.action === 'relax_item'));
  }
  if (entry.id === 'J30') {
    // First discover a real alternative, then mark it as older history. It may
    // still be returned because history is a preference, never a hard ban.
    const clean = clone(request); clean.constraints.current_plan_id = null; clean.constraints.recent_plan_ids = [];
    const base = await postPlan(clean);
    const swap = clone(clean); swap.constraints.current_plan_id = base.body.plan.plan_id;
    const alternative = await postPlan(swap);
    assert.notEqual(alternative.body.status, 'no_alternative_plan');
    swap.constraints.recent_plan_ids = [alternative.body.plan.plan_id];
    const withHistory = await postPlan(swap);
    assert.notEqual(withHistory.body.status, 'no_alternative_plan');
    assert.notEqual(withHistory.body.plan.plan_id, base.body.plan.plan_id);
  }
  if (entry.id === 'J32') {
    const probes = [
      { ...clone(request), constraints: { ...clone(request.constraints), mode: 'recommend', must_use: [], prefer_use: ['番茄'] } },
      { ...clone(request), constraints: { ...clone(request.constraints), must_use: ['番茄', '鸡蛋'] } },
      clone(request),
    ];
    const statuses = [];
    for (const probe of probes) statuses.push((await postPlan(probe)).body.status);
    const complete = await postPlan(probes[1]);
    const swap = clone(probes[1]); swap.constraints.current_plan_id = complete.body.plan.plan_id;
    const swapped = await postPlan(swap);
    assert.ok(statuses.includes('ready'));
    assert.ok(statuses.includes('complete'));
    assert.ok(statuses.includes('needs_user_decision'));
    assert.ok(['complete','no_alternative_plan'].includes(swapped.body.status));
  }
  await checkFrontend(entry, body, request);

  if (entry.generate_deepseek_max > 0 || entry.model_mutation === 'stale_catalog') {
    assert.equal(body.generation_allowed, true, `${entry.id} must be generatable before generation boundary test`);
    const generated = await postGenerate(request, body, entry.model_mutation);
    assert.ok(generated.upstreamBodies.length <= entry.generate_deepseek_max);
    if (entry.expect.generate_http_status != null) assert.equal(generated.response.status, entry.expect.generate_http_status);
    if (entry.expect.generate_code) assert.equal(generated.body.code, entry.expect.generate_code);
    if (entry.expect.generate_status) assert.equal(generated.body.status, entry.expect.generate_status);
    if (entry.expect.forbidden_final_ingredients) for (const ingredient of entry.expect.forbidden_final_ingredients) assert.doesNotMatch(JSON.stringify(generated.body), new RegExp(ingredient));
    if (entry.expect.plan_id_stable_across_wording && generated.response.status === 200) assert.equal(generated.body.plan_id, body.plan.plan_id);
    if (entry.expect.locked_structure_stable && generated.response.status === 200) assert.deepEqual(generated.body.plan.pots, body.plan.pots);
    if (entry.id === 'J04' && generated.response.status === 200) assert.doesNotMatch(JSON.stringify(generated.body.meals), /煎制定型/);
    if (entry.id === 'J07' && generated.response.status === 200) assert.doesNotMatch(JSON.stringify(generated.body.meals), /鸡胸/);
    if (entry.id === 'J38') assert.equal(body.plan.pots.length, 3);
    if (entry.expect.plan_id_stable_across_wording && generated.response.status === 200) {
      const baseline = await postGenerate(request, body, null);
      assert.equal(baseline.response.status, 200);
      assert.equal(baseline.body.plan_id, generated.body.plan_id);
      assert.deepEqual(baseline.body.plan.pots, generated.body.plan.pots);
    }
    if (entry.model_mutation === 'stale_catalog') {
      assert.equal(generated.budget.gets, 0);
      assert.equal(generated.budget.puts, 0);
    }
  }
  return entry.category;
}

function validateCorpus() {
  assert.equal(corpus.journeys.length, 44);
  assert.deepEqual(corpus.journeys.map(entry => entry.spec_number), Array.from({ length: 44 }, (_, index) => index + 1));
  assert.equal(new Set(corpus.journeys.map(entry => entry.id)).size, 44);
  assert.equal(JSON.parse(sourceAssets['/recipe-library.json']).recipes.length, 72, 'journey gate must retain the 72-recipe evidence base');
  for (const entry of corpus.journeys) {
    assert.ok(entry.request && entry.expect && entry.category);
    assert.equal(entry.plan_deepseek_max, 0);
    assert.ok(entry.generate_deepseek_max === 0 || entry.generate_deepseek_max === 1);
    assert.equal(typeof entry.frontend_required, 'boolean');
    assert.ok(Object.hasOwn(entry, 'model_mutation'));
  }
}

export async function runPantryPlannerV2Journeys({ printSummary = false } = {}) {
  validateCorpus();
  const started = performance.now();
  const counts = {};
  let passed = 0;
  const failures = [];
  for (const entry of corpus.journeys) {
    try {
      const category = await runOne(entry);
      counts[category] = (counts[category] || 0) + 1;
      passed += 1;
    } catch (error) {
      const safeMessage = String(error?.message || error).replace(/journey-test-key/g, '[redacted]');
      failures.push(`${entry.id} ${entry.title}: ${safeMessage}`);
    }
  }
  if (failures.length) throw new Error(`${passed}/44 journeys passed\n${failures.join('\n')}`);
  const result = { passed, total: corpus.journeys.length, counts, duration_ms: Math.round(performance.now() - started) };
  if (printSummary) {
    console.log(Object.entries(counts).map(([name, count]) => `${name}=${count}`).join(' '));
    console.log('44/44 planner v2 journeys passed');
  }
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runPantryPlannerV2Journeys({ printSummary: true }).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

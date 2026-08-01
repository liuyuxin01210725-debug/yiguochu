import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import worker from '../../worker/src/worker.js';
import {
  computePlanId,
  enumerateAuthoritativeRecommendState,
  normalizePlannerRequest,
} from '../../worker/src/planner-v2.js';

const readAsset = name => fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8');
const SOURCE_ASSETS = Object.freeze({
  '/ingredient-taxonomy.v1.json': readAsset('ingredient-taxonomy.v1.json'),
  '/meal-templates.v2.json': readAsset('meal-templates.v2.json'),
  '/ratio-rules.v1.json': readAsset('ratio-rules.v1.json'),
  '/recipe-library.json': readAsset('recipe-library.json'),
  '/recipe-runtime.v1.json': readAsset('recipe-runtime.v1.json'),
  '/recipe-action-profiles.v1.json': readAsset('recipe-action-profiles.v1.json'),
  '/build-meta.json': JSON.stringify({
    buildId: 'preview-test-build',
    plannerRollout: 'direct-recommend',
    generationMode: 'deterministic',
    productFocus: 'legacy',
  }),
});

const COMPLETE_SOURCE_CLAIMS = ['identity', 'technique', 'ratio', 'seasoning', 'safety']
  .map(claim_type => ({ claim_type, evidence_index: 0 }));

function syntheticShanghaiPreviewOverrides() {
  const ratios = JSON.parse(SOURCE_ASSETS['/ratio-rules.v1.json']);
  const recipeRuntime = JSON.parse(SOURCE_ASSETS['/recipe-runtime.v1.json']);
  const entry = recipeRuntime.entries
    .find(candidate => candidate.recipe_id === 'shanghai-salted-pork-vegetable-rice');
  const ruleId = 'test-worker-shanghai-executable-v1';
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
    slot_assignment: {
      staple: ['raw-rice'],
      protein: ['salted-pork-belly'],
      fast_vegetable: ['small-bok-choy'],
    },
    ratio_rule_ids: [ruleId],
    ratio_default_rule_id: ruleId,
    action_profile_ref: { action_profile_id: 'test-worker-shanghai-profile', profile_version: 'test-v1' },
    technique_graph: techniqueGraph,
    seasoning_actions: [
      { action_code: 'taste_before_salt', amount_source: 'none' },
      { action_code: 'omit_extra_salt', amount_source: 'none' },
    ],
    safety_endpoints: [
      { endpoint_code: 'pork_fully_cooked', canonical_ids: ['salted-pork-belly'] },
      { endpoint_code: 'grain_tender_no_hard_center', canonical_ids: ['raw-rice'] },
    ],
    source_claims: structuredClone(COMPLETE_SOURCE_CLAIMS),
    household_trial: {
      status: 'completed',
      trial_date: '2026-07-30',
      reviewer: 'synthetic-worker-fixture',
      outcome: 'passed',
    },
  });
  entry.identity_signature.identity_critical_action_sequence = techniqueGraph.map(step => step.action_code);
  const instances = techniqueGraph.map((step, index) => ({
    instance_id: `test-worker-shanghai-step-${index + 1}`,
    action_code: step.action_code,
    slot_ids: [...(step.slot_ids || [])],
    fact_refs: [...(step.fact_refs || [])],
    produces_resources: [...(step.produces_resources || [])],
    consumes_resources: [...(step.consumes_resources || [])],
    safety_endpoint_codes: [...(step.safety_endpoint_codes || [])],
  }));
  const actionProfiles = {
    action_profile_catalog_version: 'recipe-action-profiles-v1-20260731-r1',
    profiles: [{
      action_profile_id: entry.action_profile_ref.action_profile_id,
      profile_version: entry.action_profile_ref.profile_version,
      instances,
      execution_sequence: instances.map(instance => instance.instance_id),
    }],
  };
  return {
    '/ratio-rules.v1.json': JSON.stringify(ratios),
    '/recipe-runtime.v1.json': JSON.stringify(recipeRuntime),
    '/recipe-action-profiles.v1.json': JSON.stringify(actionProfiles),
  };
}

function plannerBody({
  mode = 'recommend', intent = 'normal', must = [], prefer = [], dislikes = [], servings = 2,
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

function assetBinding(overrides = {}) {
  const calls = [];
  const bytes = { ...SOURCE_ASSETS, ...overrides };
  return {
    calls,
    bytes,
    async fetch(request) {
      const pathname = new URL(request.url).pathname;
      calls.push(pathname);
      if (!Object.prototype.hasOwnProperty.call(bytes, pathname)) return new Response('missing', { status: 404 });
      const value = bytes[pathname];
      if (value instanceof Response) return value.clone();
      return new Response(value, { status: 200, headers: { 'Content-Type': 'application/json' } });
    },
  };
}

async function postPlan(body, { assets = assetBinding(), rawBody, env = {} } = {}) {
  const kv = {
    gets: 0,
    puts: 0,
    async get() { this.gets += 1; throw new Error('planner must not read generation budget'); },
    async put() { this.puts += 1; throw new Error('planner must not write generation budget'); },
  };
  let upstreamCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    upstreamCalls += 1;
    throw new Error('planner must not call global fetch');
  };
  try {
    const request = new Request('https://planner.example/plan-meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://planner.example' },
      body: rawBody ?? JSON.stringify(body),
    });
    const response = await worker.fetch(request, { ASSETS: assets, RATE_KV: kv, ...env });
    return {
      response,
      body: await response.json(),
      assets,
      upstreamCalls,
      kvGets: kv.gets,
      kvPuts: kv.puts,
    };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function generationEnvelope(planRequest, planned, planId = planned.plan.plan_id) {
  return {
    schema_version: 2,
    planner_version: planned.planner_version,
    template_catalog_version: planned.template_catalog_version,
    plan_id: planId,
    plan_request: structuredClone(planRequest),
  };
}

function validModelOutput(lockedPlan) {
  return {
    plan_id: lockedPlan.plan_id,
    meals: lockedPlan.meals.map(meal => ({
      meal_sequence: meal.meal_sequence,
      dish_name: meal.generation_text_contract.dish_name_options[0],
      ingredient_refs: meal.locked_ingredients.map(item => item.ingredient_ref),
      steps: meal.cooking_order.map((phase, index) => ({
        order: index + 1,
        action_code: phase.action_code,
        text: meal.generation_text_contract.steps[index].allowed_texts[0],
        ingredient_refs: [...phase.allowed_ingredient_refs],
        completed_safety_endpoints: [...phase.required_safety_endpoints],
      })),
      recommendation_reason: meal.generation_text_contract.recommendation_reason_options[0],
    })),
  };
}

async function postGeneratePlan(body, {
  assets = assetBinding(), ip = '198.51.100.8', rateLimit = 1,
} = {}) {
  const kv = {
    values: new Map(),
    gets: 0,
    puts: 0,
    async get(key) { this.gets += 1; return this.values.get(String(key)) ?? null; },
    async put(key, value) { this.puts += 1; this.values.set(String(key), String(value)); },
  };
  let upstreamCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    upstreamCalls += 1;
    const upstreamBody = JSON.parse(options.body);
    const userMessage = JSON.parse(upstreamBody.messages[1].content);
    return new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify(validModelOutput(userMessage.locked_plan)) } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const response = await worker.fetch(new Request('https://planner.example/generate-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://planner.example',
        'X-Forwarded-For': ip,
      },
      body: JSON.stringify(body),
    }), {
      ASSETS: assets,
      RATE_KV: kv,
      RATE_LIMIT: rateLimit,
      DAILY_BUDGET: 10,
      DEEPSEEK_API_KEY: 'test-worker-key',
    });
    return {
      response,
      body: await response.json(),
      upstreamCalls,
      kvGets: kv.gets,
      kvPuts: kv.puts,
    };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function assertZeroGenerationWork(result) {
  assert.equal(result.upstreamCalls, 0);
  assert.equal(result.kvGets, 0);
  assert.equal(result.kvPuts, 0);
}

async function getHealth(assets = assetBinding()) {
  const response = await worker.fetch(new Request('https://planner.example/health', {
    headers: { Origin: 'https://planner.example' },
  }), { ASSETS: assets });
  return { response, body: await response.json(), assets };
}

test('health reports exact validated planner asset versions and catalog counts', async () => {
  const result = await getHealth();
  assert.equal(result.response.status, 200);
  assert.equal(result.body.recipeLibrary, 'ok');
  assert.equal(result.body.plannerAssets, 'ok');
  assert.equal(result.body.plannerVersion, 'pantry-planner-v2');
  assert.equal(result.body.templateCatalogVersion, 'templates-v2-20260731-r18');
  assert.equal(result.body.ingredientTaxonomyVersion, 'taxonomy-v1-20260728-r10');
  assert.equal(result.body.ratioRulesVersion, 'ratio-rules-v1-20260801-r11');
  assert.equal(result.body.activeTemplates, 11);
  assert.equal(result.body.plannedTemplates, 5);
  assert.equal(result.body.recipeRuntime, 'ok');
  assert.equal(result.body.recipeRuntimeCatalogVersion, 'recipe-runtime-v1-20260730-r1');
  assert.equal(result.body.recipeRuntimeEntries, 6);
  assert.equal(result.body.recipeRuntimePreviewEnabled, 0);
  assert.equal(result.body.actionProfiles, 'ok');
  assert.equal(result.body.actionProfileCatalogVersion, 'recipe-action-profiles-v1-20260731-r1');
  assert.equal(result.body.actionProfileCount, 0);
  assert.equal(result.body.baseRecipes, 72);
  assert.equal(result.body.buildId, 'preview-test-build');
  assert.equal(result.body.plannerRollout, 'direct-recommend');
  assert.equal(result.body.generationMode, 'deterministic');
  assert.equal(result.body.productFocus, 'legacy');
});

test('missing or invalid recipe runtime assets make health unavailable and planning fail closed', async t => {
  const invalidRuntime = JSON.parse(SOURCE_ASSETS['/recipe-runtime.v1.json']);
  invalidRuntime.recipe_runtime_catalog_version = 'forged-runtime-version';
  const invalidProfiles = JSON.parse(SOURCE_ASSETS['/recipe-action-profiles.v1.json']);
  invalidProfiles.profiles = {};
  const cases = [
    ['missing runtime', { '/recipe-runtime.v1.json': new Response('missing', { status: 404 }) }],
    ['invalid runtime', { '/recipe-runtime.v1.json': JSON.stringify(invalidRuntime) }],
    ['invalid action profiles', { '/recipe-action-profiles.v1.json': JSON.stringify(invalidProfiles) }],
  ];
  for (const [name, overrides] of cases) {
    await t.test(name, async () => {
      const assets = assetBinding(overrides);
      const health = await getHealth(assets);
      assert.equal(health.body.plannerAssets, 'unavailable');
      assert.equal(health.body.recipeRuntime, 'unavailable');
      assert.equal(health.body.recipeRuntimeCatalogVersion, null);
      assert.equal(health.body.recipeRuntimeEntries, 0);
      assert.equal(health.body.recipeRuntimePreviewEnabled, 0);
      assert.equal(health.body.actionProfiles, 'unavailable');
      assert.equal(health.body.actionProfileCatalogVersion, null);
      assert.equal(health.body.actionProfileCount, 0);

      const planned = await postPlan(plannerBody({ prefer: ['番茄'] }), { assets });
      assert.equal(planned.response.status, 503);
      assert.equal(planned.body.code, 'planner_assets_unavailable');
      assertZeroGenerationWork(planned);
    });
  }
});

test('health reports unavailable planner assets without claiming validated versions or counts', async () => {
  const result = await getHealth(assetBinding({
    '/ingredient-taxonomy.v1.json': new Response('missing', { status: 404 }),
  }));
  assert.equal(result.response.status, 200);
  assert.equal(result.body.recipeLibrary, 'ok');
  assert.equal(result.body.baseRecipes, 72);
  assert.equal(result.body.plannerAssets, 'unavailable');
  assert.equal(result.body.plannerVersion, null);
  assert.equal(result.body.templateCatalogVersion, null);
  assert.equal(result.body.ingredientTaxonomyVersion, null);
  assert.equal(result.body.ratioRulesVersion, null);
  assert.equal(result.body.activeTemplates, 0);
  assert.equal(result.body.plannedTemplates, 0);
});

test('health distinguishes source legacy defaults from invalid build metadata', async () => {
  for (const [buildMeta, expectedFocus, expectedMetadata] of [
    [new Response('missing', { status:404 }), 'legacy', 'ok'],
    [JSON.stringify({ buildId:'preview-test-build', plannerRollout:'everyone', generationMode:'deterministic', productFocus:'legacy' }), null, 'unavailable'],
    [JSON.stringify({ buildId:'preview-test-build', plannerRollout:'direct-recommend', generationMode:'hybrid', productFocus:'legacy' }), null, 'unavailable'],
    [JSON.stringify({ buildId:'preview-test-build', plannerRollout:'direct-recommend', generationMode:'deterministic', productFocus:'wrong' }), null, 'unavailable'],
    ['{bad json', null, 'unavailable'],
  ]) {
    const result = await getHealth(assetBinding({ '/build-meta.json':buildMeta }));
    assert.equal(result.response.status, 200);
    assert.equal(result.body.buildId, null);
    assert.equal(result.body.plannerRollout, 'off');
    assert.equal(result.body.generationMode, 'llm');
    assert.equal(result.body.productFocus, expectedFocus);
    assert.equal(result.body.buildMetadata, expectedMetadata);
    assert.equal(result.body.plannerAssets, 'ok');
  }
});

test('health never reports a semantically invalid recipe library as available', async () => {
  const invalidRecipes = JSON.parse(SOURCE_ASSETS['/recipe-library.json']);
  invalidRecipes.recipes[0].source_refs = [];
  const result = await getHealth(assetBinding({
    '/recipe-library.json': JSON.stringify(invalidRecipes),
  }));
  assert.equal(result.response.status, 200);
  assert.equal(result.body.recipeLibrary, 'unavailable');
  assert.equal(result.body.recipeFamilies, 0);
  assert.equal(result.body.baseRecipes, 0);
  assert.equal(result.body.plannerAssets, 'unavailable');
  assert.equal(result.body.plannerVersion, null);
  assert.equal(result.body.templateCatalogVersion, null);
  assert.equal(result.body.ingredientTaxonomyVersion, null);
  assert.equal(result.body.ratioRulesVersion, null);
  assert.equal(result.body.activeTemplates, 0);
  assert.equal(result.body.plannedTemplates, 0);
});

test('recommend planning returns a stable identified ready plan with honest used and unused facts', async () => {
  const submitted = plannerBody({ prefer: ['番茄', '鸡蛋', '西兰花', '神秘叶子'] });
  const untouched = structuredClone(submitted);
  const assets = assetBinding();
  const first = await postPlan(submitted, { assets });
  const second = await postPlan(submitted, { assets });

  assert.equal(first.response.status, 200);
  assert.equal(first.body.schema_version, 2);
  assert.equal(first.body.status, 'ready');
  assert.ok(first.body.candidate_plans.length >= 1 && first.body.candidate_plans.length <= 3);
  assert.equal(first.body.preferred_plan_id, first.body.plan.plan_id);
  assert.equal(first.body.candidate_plans[0].plan.plan_id, first.body.plan.plan_id);
  assert.ok(first.body.candidate_plans.every(candidate => !('candidate_plans' in candidate)));
  assert.match(first.body.plan.plan_id, /^pln_v2_[A-Za-z0-9_-]{43}$/);
  assert.ok(first.body.plan.planned_prefer_use.length >= 1);
  assert.ok(first.body.plan.unused_prefer_use.some(item => item.raw === '神秘叶子'));
  assert.equal(second.body.plan.plan_id, first.body.plan.plan_id);
  assert.deepEqual(second.body.plan.planned_prefer_use, first.body.plan.planned_prefer_use);
  assert.deepEqual(second.body.plan.unused_prefer_use, first.body.plan.unused_prefer_use);
  assert.deepEqual(submitted, untouched);
  assert.equal(assets.bytes['/ingredient-taxonomy.v1.json'], SOURCE_ASSETS['/ingredient-taxonomy.v1.json']);
  assertZeroGenerationWork(first);
  assertZeroGenerationWork(second);
});

test('isolated validated preview assets expose a fully materialized named candidate before signing', async () => {
  const assets = assetBinding(syntheticShanghaiPreviewOverrides());
  const planRequest = plannerBody({
    mode: 'recommend',
    prefer: ['大米', '咸五花肉', '小白菜'],
  });
  const result = await postPlan(planRequest, { assets });

  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.status, 'ready');
  assert.equal(result.body.plan_source, 'named_recipe');
  assert.equal(result.body.recipe_id, 'shanghai-salted-pork-vegetable-rice');
  assert.equal(result.body.variant_id, null);
  assert.equal(result.body.identity_level, 'canonical');
  assert.deepEqual(result.body.presentation, {
    badge: '依据菜谱',
    title: '上海奉贤咸肉菜饭',
    subtitle: '按已核验菜谱的用料、比例与熟制顺序呈现。',
    source_label: '查看一锅出标准配方',
    canonical_path: '/recipes.html?id=shanghai-salted-pork-vegetable-rice',
  });
  assert.equal(result.body.recipe_runtime_catalog_version, 'recipe-runtime-v1-20260730-r1');
  assert.equal(result.body.preferred_plan_id, result.body.plan.plan_id);
  assert.equal(result.body.candidate_plans[0].plan.plan_id, result.body.plan.plan_id);
  assert.equal(
    result.body.plan.pots[0].execution_contract.action_profile_catalog_version,
    'recipe-action-profiles-v1-20260731-r1',
  );
  assert.ok(result.body.plan.pots[0].ingredient_amounts.every(item => Number.isSafeInteger(item.grams)));
  assertZeroGenerationWork(result);
});

test('one synthetic hybrid authoritative set recognizes named and custom displayed members during swap', async () => {
  const assets = assetBinding(syntheticShanghaiPreviewOverrides());
  const initialRequest = plannerBody({
    mode: 'recommend',
    prefer: ['大米', '咸五花肉', '小白菜'],
  });
  const initial = await postPlan(initialRequest, { assets });
  assert.equal(initial.response.status, 200, JSON.stringify(initial.body));
  assert.equal(initial.body.plan_source, 'named_recipe');
  const displayed = new Map(initial.body.candidate_plans.map(candidate => [candidate.plan.plan_id, candidate]));
  const displayedCustom = initial.body.candidate_plans.find(candidate => candidate.plan_source === 'custom_template');
  assert.ok(displayedCustom, JSON.stringify(initial.body.candidate_plans));

  const fromNamed = await postPlan(plannerBody({
    mode: 'recommend',
    prefer: ['大米', '咸五花肉', '小白菜'],
    currentPlanId: initial.body.plan.plan_id,
  }), { assets });
  assert.equal(fromNamed.response.status, 200);
  assert.notEqual(fromNamed.body.status, 'stale_plan');
  assert.equal(fromNamed.body.plan_source, 'custom_template');
  assert.ok(displayed.has(fromNamed.body.plan.plan_id), JSON.stringify(fromNamed.body));
  assert.notEqual(fromNamed.body.plan.plan_id, initial.body.plan.plan_id);

  const fromCustom = await postPlan(plannerBody({
    mode: 'recommend',
    prefer: ['大米', '咸五花肉', '小白菜'],
    currentPlanId: displayedCustom.plan.plan_id,
  }), { assets });
  assert.equal(fromCustom.response.status, 200);
  assert.notEqual(fromCustom.body.status, 'stale_plan');
  assert.ok(displayed.has(fromCustom.body.plan.plan_id), JSON.stringify(fromCustom.body));
  assert.notEqual(fromCustom.body.plan.plan_id, displayedCustom.plan.plan_id);
  assertZeroGenerationWork(initial);
  assertZeroGenerationWork(fromNamed);
  assertZeroGenerationWork(fromCustom);
});

test('synthetic generation accepts exact displayed non-preferred membership and rejects foreign identities before work', async () => {
  const overrides = {
    ...syntheticShanghaiPreviewOverrides(),
    '/build-meta.json': JSON.stringify({
      buildId: 'preview-test-build',
      plannerRollout: 'direct-recommend',
      generationMode: 'llm',
      productFocus: 'legacy',
    }),
  };
  const assets = assetBinding(overrides);
  const planRequest = plannerBody({ mode: 'recommend', prefer: ['大米', '咸五花肉', '小白菜'] });
  const planned = await postPlan(planRequest, { assets });
  assert.equal(planned.body.plan_source, 'named_recipe');

  const displayedNonPreferred = planned.body.candidate_plans.find(candidate => (
    candidate.plan.plan_id !== planned.body.preferred_plan_id
      && candidate.plan_source === 'custom_template'
  ));
  assert.ok(displayedNonPreferred, JSON.stringify(planned.body.candidate_plans));
  const generated = await postGeneratePlan(
    generationEnvelope(planRequest, planned.body, displayedNonPreferred.plan.plan_id),
    { assets, ip: '198.51.100.90' },
  );
  assert.equal(generated.response.status, 200, JSON.stringify(generated.body));
  assert.equal(generated.body.plan_id, displayedNonPreferred.plan.plan_id);
  assert.equal(generated.upstreamCalls, 1);

  const foreign = structuredClone(planned.body.candidate_plans[0]);
  foreign.recipe_id = 'xinjiang-lamb-pilaf';
  foreign.presentation = { title: '新疆羊肉抓饭', canonical_name: '新疆羊肉抓饭' };
  foreign.plan.plan_id = await computePlanId(foreign);
  const forged = await postGeneratePlan(generationEnvelope(planRequest, planned.body, foreign.plan.plan_id), {
    assets,
    ip: '198.51.100.91',
  });
  assert.equal(forged.response.status, 409);
  assert.equal(forged.body.code, 'stale_plan');
  assert.equal(forged.upstreamCalls, 0);
  assert.equal(forged.kvGets, 0);
  assert.equal(forged.kvPuts, 0);

  const stale = await postGeneratePlan(generationEnvelope(
    planRequest,
    planned.body,
    'pln_v2_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  ), { assets, ip: '198.51.100.92' });
  assert.equal(stale.response.status, 409);
  assert.equal(stale.body.code, 'stale_plan');
  assert.equal(stale.upstreamCalls, 0);
  assert.equal(stale.kvGets, 0);
  assert.equal(stale.kvPuts, 0);
});

test('initial generation authorizes only the displayed top three, never a hidden authoritative member', async () => {
  const planRequest = plannerBody({
    mode: 'recommend',
    prefer: ['大米', '番茄', '鸡蛋'],
  });
  const assets = assetBinding();
  const initial = await postPlan(planRequest, { assets });
  assert.equal(initial.response.status, 200, JSON.stringify(initial.body));
  assert.equal(initial.body.candidate_plans.length, 3);

  const internalState = await enumerateAuthoritativeRecommendState({
    taxonomy: JSON.parse(SOURCE_ASSETS['/ingredient-taxonomy.v1.json']),
    templates: JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']),
    ratios: JSON.parse(SOURCE_ASSETS['/ratio-rules.v1.json']),
    recipes: JSON.parse(SOURCE_ASSETS['/recipe-library.json']),
  }, normalizePlannerRequest(planRequest));
  assert.ok(internalState.candidates.length > initial.body.candidate_plans.length);
  const displayedIds = new Set(initial.body.candidate_plans.map(candidate => candidate.plan.plan_id));
  const hidden = internalState.candidates.find(candidate => !displayedIds.has(candidate.plan.plan_id));
  assert.ok(hidden, JSON.stringify(internalState.candidates.map(candidate => candidate.plan.plan_id)));

  const preferred = await postGeneratePlan(
    generationEnvelope(planRequest, initial.body, initial.body.preferred_plan_id),
    { assets, ip: '198.51.100.97' },
  );
  assert.equal(preferred.response.status, 200, JSON.stringify(preferred.body));
  assert.equal(preferred.body.plan_id, initial.body.preferred_plan_id);

  const displayedNonPreferred = initial.body.candidate_plans[1];
  const nonPreferred = await postGeneratePlan(
    generationEnvelope(planRequest, initial.body, displayedNonPreferred.plan.plan_id),
    { assets, ip: '198.51.100.98' },
  );
  assert.equal(nonPreferred.response.status, 200, JSON.stringify(nonPreferred.body));
  assert.equal(nonPreferred.body.plan_id, displayedNonPreferred.plan.plan_id);

  const rejectedHidden = await postGeneratePlan(
    generationEnvelope(planRequest, initial.body, hidden.plan.plan_id),
    { assets, ip: '198.51.100.99' },
  );
  assert.equal(rejectedHidden.response.status, 409, JSON.stringify(rejectedHidden.body));
  assert.equal(rejectedHidden.body.status, 'stale_plan');
  assertZeroGenerationWork(rejectedHidden);
});

test('synthetic hybrid state keeps retained IDs non-generatable and partial acknowledgement exact', async () => {
  const assets = assetBinding(syntheticShanghaiPreviewOverrides());

  const soleRequest = plannerBody({ mode: 'recommend', prefer: ['虾仁', '玉米'] });
  const sole = await postPlan(soleRequest, { assets });
  assert.equal(sole.body.candidate_plans.length, 1);
  const noAlternativeRequest = plannerBody({
    mode: 'recommend',
    prefer: ['虾仁', '玉米'],
    currentPlanId: sole.body.plan.plan_id,
  });
  const noAlternative = await postPlan(noAlternativeRequest, { assets });
  assert.equal(noAlternative.body.status, 'no_alternative_plan');
  const rejectedRetained = await postGeneratePlan(
    generationEnvelope(noAlternativeRequest, noAlternative.body),
    { assets, ip: '198.51.100.93' },
  );
  assert.equal(rejectedRetained.response.status, 409);
  assert.equal(rejectedRetained.body.status, 'no_alternative_plan');
  assertZeroGenerationWork(rejectedRetained);

  const partialRequest = plannerBody({
    mode: 'pantry',
    must: ['番茄', '鸡蛋', '神秘叶子'],
  });
  const partial = await postPlan(partialRequest, { assets });
  assert.equal(partial.body.status, 'needs_user_decision');
  const rejectedDecision = await postGeneratePlan(
    generationEnvelope(partialRequest, partial.body),
    { assets, ip: '198.51.100.94' },
  );
  assert.equal(rejectedDecision.response.status, 409);
  assert.equal(rejectedDecision.body.status, 'needs_user_decision');
  assertZeroGenerationWork(rejectedDecision);

  const acknowledgement = {
    action: 'accept_partial',
    plan_id: partial.body.plan.plan_id,
    acknowledged_unplanned: ['神秘叶子'],
  };
  const acceptedRequest = plannerBody({
    mode: 'pantry',
    must: ['番茄', '鸡蛋', '神秘叶子'],
    currentPlanId: partial.body.plan.plan_id,
    decision: acknowledgement,
  });
  const accepted = await postPlan(acceptedRequest, { assets });
  assert.equal(accepted.body.status, 'partial_accepted');
  const generated = await postGeneratePlan(
    generationEnvelope(acceptedRequest, accepted.body),
    { assets, ip: '198.51.100.95' },
  );
  assert.equal(generated.response.status, 200, JSON.stringify(generated.body));

  const forgedAcknowledgementRequest = plannerBody({
    mode: 'pantry',
    must: ['番茄', '鸡蛋', '神秘叶子'],
    currentPlanId: partial.body.plan.plan_id,
    decision: { ...acknowledgement, acknowledged_unplanned: ['番茄'] },
  });
  const rejectedForgery = await postGeneratePlan(
    generationEnvelope(forgedAcknowledgementRequest, accepted.body),
    { assets, ip: '198.51.100.96' },
  );
  assert.equal(rejectedForgery.response.status, 409);
  assertZeroGenerationWork(rejectedForgery);
});

test('initial recommend candidate bundle does not call DeepSeek or duplicate a sole reliable plan', async () => {
  const result = await postPlan(plannerBody({ prefer: ['虾仁', '玉米'] }));
  assert.equal(result.response.status, 200);
  assert.equal(result.body.status, 'ready');
  assert.equal(result.body.candidate_plans.length, 1);
  assert.equal(result.body.preferred_plan_id, result.body.candidate_plans[0].plan.plan_id);
  assertZeroGenerationWork(result);
});

test('below-floor recommend returns an empty honest bundle with no legacy fallback marker', async () => {
  const result = await postPlan(plannerBody({
    prefer: ['虾仁', '玉米', '未知A', '未知B', '未知C'],
  }));
  assert.equal(result.response.status, 200);
  assert.equal(result.body.status, 'no_valid_plan');
  assert.deepEqual(result.body.candidate_plans, []);
  assert.equal(result.body.preferred_plan_id, null);
  assert.equal(result.body.legacy_fallback, undefined);
  assert.equal(result.body.plan_source, undefined);
  assertZeroGenerationWork(result);
});

test('fully coverable pantry returns complete without requiring a model key', async () => {
  const result = await postPlan(plannerBody({ mode: 'pantry', must: ['番茄', '鸡蛋'] }));
  assert.equal(result.response.status, 200);
  assert.equal(result.body.status, 'complete');
  assert.equal(result.body.generation_allowed, true);
  assert.equal(result.body.plan.coverage_ratio, 1);
  assert.deepEqual(result.body.plan.unplanned_must_use, []);
  assertZeroGenerationWork(result);
});

test('HTTP planner returns the complete measured soft millet pot without generation work', async () => {
  const input = plannerBody({
    mode: 'pantry',
    intent: 'normal',
    servings: 2,
    must: ['小米', '土豆', '熟鹰嘴豆'],
  });
  const current = await postPlan(input);
  assert.equal(current.response.status, 200);
  assert.equal(current.body.status, 'complete');
  assert.equal(current.body.generation_allowed, true);
  assert.equal(current.body.plan.coverage_ratio, 1);
  assert.equal(current.body.plan.pots[0].template_id, 'soft-family-rice-pot');
  assert.deepEqual(
    new Map(current.body.plan.pots[0].ingredient_amounts.map(row => [row.name, row.grams])),
    new Map([['小米',80], ['土豆',180], ['熟鹰嘴豆',176], ['水',664], ['食用油',10], ['盐',3]]),
  );
  assertZeroGenerationWork(current);

  const swapped = await postPlan(plannerBody({
    mode: 'pantry',
    intent: 'normal',
    servings: 2,
    must: ['小米', '土豆', '熟鹰嘴豆'],
    currentPlanId: current.body.plan.plan_id,
  }));
  assert.equal(swapped.body.status, 'no_alternative_plan');
  assert.equal(swapped.body.code, 'no_alternative_plan');
  assert.equal(swapped.body.plan.plan_id, current.body.plan.plan_id);
  assertZeroGenerationWork(swapped);
});

test('HTTP planner returns the executable cooked-rice broth plan without generation work', async () => {
  const result = await postPlan(plannerBody({
    mode: 'pantry',
    intent: 'normal',
    servings: 2,
    must: ['熟米饭', '鸡蛋', '白菜'],
  }));

  assert.equal(result.response.status, 200);
  assert.equal(result.body.status, 'complete');
  assert.equal(result.body.plan.pots.length, 1);
  assert.equal(result.body.plan.pots[0].template_id, 'broth-rice-pot');
  assert.equal(result.body.plan.coverage_ratio, 1);
  assertZeroGenerationWork(result);
});

test('incomplete pantry retains deterministic pots and pauses generation', async () => {
  const result = await postPlan(plannerBody({ mode: 'pantry', must: ['番茄', '鸡蛋', '神秘叶子'] }));
  assert.equal(result.response.status, 200);
  assert.equal(result.body.status, 'needs_user_decision');
  assert.equal(result.body.generation_allowed, false);
  assert.ok(result.body.plan.pots.length > 0);
  assert.equal(result.body.plan.unplanned_must_use[0].reason_code, 'unrecognized_ingredient');
  assertZeroGenerationWork(result);
});

test('M1 cornmeal identities do not activate the blocked stew template', async () => {
  const result = await postPlan(plannerBody({
    mode: 'pantry',
    intent: 'normal',
    servings: 2,
    must: ['排骨', '油豆角', '玉米面'],
  }));
  assert.notEqual(result.body.status, 'complete');
  assert.equal(result.body.generation_allowed, false);
  assert.ok(result.body.plan.unplanned_must_use.some(item => item.raw === '玉米面'));
  assert.equal(
    result.body.plan.pots.some(pot => pot.template_id === 'stew-with-staple-pot'),
    false,
  );
  assertZeroGenerationWork(result);
});

test('swap returns a structural alternative or exact no_alternative_plan, including accepted-partial swap_current', async () => {
  const noAlternativeRequest = plannerBody({ mode: 'pantry', must: ['大米'] });
  const current = await postPlan(noAlternativeRequest);
  const swapped = await postPlan(plannerBody({
    mode: 'pantry',
    must: ['大米'],
    currentPlanId: current.body.plan.plan_id,
  }));
  assert.equal(swapped.body.status, 'no_alternative_plan');
  assert.equal(swapped.body.code, 'no_alternative_plan');
  assert.equal(swapped.body.plan.plan_id, current.body.plan.plan_id);
  assertZeroGenerationWork(current);
  assertZeroGenerationWork(swapped);

  const partialRequest = plannerBody({ mode: 'pantry', must: ['番茄', '鸡蛋', '神秘叶子'] });
  const partial = await postPlan(partialRequest);
  const acceptance = {
    action: 'accept_partial',
    plan_id: partial.body.plan.plan_id,
    acknowledged_unplanned: ['神秘叶子'],
  };
  const accepted = await postPlan(plannerBody({
    mode: 'pantry',
    must: ['番茄', '鸡蛋', '神秘叶子'],
    currentPlanId: partial.body.plan.plan_id,
    decision: acceptance,
  }));
  const acceptedSwap = await postPlan(plannerBody({
    mode: 'pantry',
    must: ['番茄', '鸡蛋', '神秘叶子'],
    currentPlanId: accepted.body.plan.plan_id,
    decision: { ...acceptance, swap_current: true },
  }));
  assert.equal(accepted.body.status, 'partial_accepted');
  assert.ok(['partial_accepted', 'no_alternative_plan'].includes(acceptedSwap.body.status));
  assert.notEqual(acceptedSwap.body.status, 'stale_plan');
  assertZeroGenerationWork(partial);
  assertZeroGenerationWork(accepted);
  assertZeroGenerationWork(acceptedSwap);
});

test('unsupported input returns no_valid_plan rather than a generic worker failure', async () => {
  const result = await postPlan(plannerBody({ mode: 'pantry', must: ['神秘叶子'] }));
  assert.equal(result.response.status, 200);
  assert.equal(result.body.status, 'no_valid_plan');
  assert.match(result.body.plan.plan_id, /^pln_v2_/);
  assertZeroGenerationWork(result);
});

test('planner request parsing rejects malformed, oversized, empty, non-object and invalid contracts before planner assets or budget', async t => {
  const cases = [
    ['malformed JSON', '{not-json', 'invalid_json', false],
    ['oversized body', JSON.stringify({ padding: 'x'.repeat(33 * 1024) }), 'request_too_large', false],
    ['empty body', '', 'invalid_planner_request', true],
    ['array JSON', '[]', 'invalid_planner_request', true],
    ['invalid V2 contract', JSON.stringify(plannerBody({ intent: 'eventually' })), 'invalid_planner_request', true],
  ];
  for (const [name, rawBody, code, checksMetadata] of cases) {
    await t.test(name, async () => {
      const assets = assetBinding();
      const result = await postPlan(null, { assets, rawBody });
      assert.equal(result.response.status, 400);
      assert.equal(result.body.code, code);
      assert.deepEqual(assets.calls, checksMetadata ? ['/build-meta.json'] : []);
      assertZeroGenerationWork(result);
    });
  }
});

test('planner asset load and validation failures fail closed with a stable service response', async t => {
  const invalidTaxonomy = JSON.parse(SOURCE_ASSETS['/ingredient-taxonomy.v1.json']);
  invalidTaxonomy.taxonomy_version = 'taxonomy-wrong';
  const cases = [
    ['missing asset', { '/meal-templates.v2.json': new Response('missing', { status: 404 }) }],
    ['invalid JSON', { '/ratio-rules.v1.json': '{broken' }],
    ['wrong catalog version', { '/ingredient-taxonomy.v1.json': JSON.stringify(invalidTaxonomy) }],
  ];
  for (const [name, overrides] of cases) {
    await t.test(name, async () => {
      const result = await postPlan(plannerBody({ prefer: ['番茄'] }), { assets: assetBinding(overrides) });
      assert.equal(result.response.status, 503);
      assert.equal(result.body.code, 'planner_assets_unavailable');
      assert.doesNotMatch(JSON.stringify(result.body), /taxonomy-wrong|broken|stack/i);
      assertZeroGenerationWork(result);
    });
  }
});

test('runtime catalog validation rejects semantic schema bypasses before planning', async t => {
  const missingCookSpeed = JSON.parse(SOURCE_ASSETS['/ingredient-taxonomy.v1.json']);
  delete missingCookSpeed.items[0].cook_speed;
  const unknownTemplateField = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  unknownTemplateField.templates[0].runtime_backdoor = true;
  const missingSafetyEndpoints = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  delete missingSafetyEndpoints.templates[0].safety_endpoints;
  const aliasIdentityCollision = JSON.parse(SOURCE_ASSETS['/ingredient-taxonomy.v1.json']);
  aliasIdentityCollision.items.find(item => item.display_name === '大米').aliases.push('番茄');
  const cases = [
    ['missing taxonomy cook_speed', { '/ingredient-taxonomy.v1.json': JSON.stringify(missingCookSpeed) }],
    ['unknown template field', { '/meal-templates.v2.json': JSON.stringify(unknownTemplateField) }],
    ['missing template safety_endpoints', { '/meal-templates.v2.json': JSON.stringify(missingSafetyEndpoints) }],
    ['taxonomy alias identity collision', { '/ingredient-taxonomy.v1.json': JSON.stringify(aliasIdentityCollision) }],
  ];
  for (const [name, overrides] of cases) {
    await t.test(name, async () => {
      const result = await postPlan(plannerBody({ prefer: ['番茄'] }), { assets: assetBinding(overrides) });
      assert.equal(result.response.status, 503);
      assert.equal(result.body.code, 'planner_assets_unavailable');
      assertZeroGenerationWork(result);
    });
  }
});

test('runtime recipe evidence validation rejects malformed non-empty catalogs before planning', async t => {
  const wrongSchema = JSON.parse(SOURCE_ASSETS['/recipe-library.json']);
  wrongSchema.schema_version = 999;
  const malformedFamilies = JSON.parse(SOURCE_ASSETS['/recipe-library.json']);
  malformedFamilies.families = {};
  const malformedAliases = JSON.parse(SOURCE_ASSETS['/recipe-library.json']);
  malformedAliases.ingredient_aliases = [];
  const missingRecipeCore = JSON.parse(SOURCE_ASSETS['/recipe-library.json']);
  delete missingRecipeCore.recipes[0].core_ingredients;
  const cases = [
    ['wrong recipe schema', wrongSchema],
    ['malformed recipe families', malformedFamilies],
    ['malformed ingredient aliases', malformedAliases],
    ['missing recipe core structure', missingRecipeCore],
  ];
  for (const [name, library] of cases) {
    await t.test(name, async () => {
      assert.ok(Array.isArray(library.recipes) && library.recipes.length > 0);
      const result = await postPlan(plannerBody({ prefer: ['番茄'] }), {
        assets: assetBinding({ '/recipe-library.json': JSON.stringify(library) }),
      });
      assert.equal(result.response.status, 503);
      assert.equal(result.body.code, 'planner_assets_unavailable');
      assertZeroGenerationWork(result);
    });
  }
});

test('asset caches are scoped to the ASSETS binding and callers cannot poison a later deployment', async () => {
  const healthy = await postPlan(plannerBody({ prefer: ['番茄'] }), { assets: assetBinding() });
  const brokenTaxonomy = JSON.parse(SOURCE_ASSETS['/ingredient-taxonomy.v1.json']);
  brokenTaxonomy.taxonomy_version = 'poisoned';
  const broken = await postPlan(plannerBody({ prefer: ['番茄'] }), {
    assets: assetBinding({ '/ingredient-taxonomy.v1.json': JSON.stringify(brokenTaxonomy) }),
  });
  assert.equal(healthy.body.status, 'ready');
  assert.equal(broken.response.status, 503);
  assert.equal(broken.body.code, 'planner_assets_unavailable');
});

test('OPTIONS keeps CORS and legacy malformed JSON behavior remains unchanged', async () => {
  const options = await worker.fetch(new Request('https://planner.example/plan-meal', {
    method: 'OPTIONS',
    headers: { Origin: 'http://localhost:8081' },
  }), {});
  assert.equal(options.status, 204);
  assert.equal(options.headers.get('Access-Control-Allow-Origin'), 'http://localhost:8081');

  const legacy = await worker.fetch(new Request('https://planner.example/generate-meal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{bad-json',
  }), {});
  assert.equal(legacy.status, 400);
  assert.equal((await legacy.json()).code, 'invalid_json');
});

test('deployment documentation tracks the current draft planner asset baseline', () => {
  const deployment = fs.readFileSync(new URL('../../部署说明.md', import.meta.url), 'utf8');
  assert.match(deployment, /templates-v2-20260731-r18/);
  assert.match(deployment, /taxonomy-v1-20260728-r10/);
  assert.match(deployment, /ratio-rules-v1-20260801-r11/);
  assert.match(deployment, /11 个 active templates，5 个 planned templates/);
  assert.match(deployment, /138\/138/);
  assert.match(deployment, /未部署|不得部署/);
});

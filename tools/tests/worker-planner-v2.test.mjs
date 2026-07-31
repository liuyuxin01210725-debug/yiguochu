import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import worker from '../../worker/src/worker.js';

const readAsset = name => fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8');
const SOURCE_ASSETS = Object.freeze({
  '/ingredient-taxonomy.v1.json': readAsset('ingredient-taxonomy.v1.json'),
  '/meal-templates.v2.json': readAsset('meal-templates.v2.json'),
  '/ratio-rules.v1.json': readAsset('ratio-rules.v1.json'),
  '/recipe-library.json': readAsset('recipe-library.json'),
  '/build-meta.json': JSON.stringify({
    buildId: 'preview-test-build',
    plannerRollout: 'direct-recommend',
    generationMode: 'deterministic',
  }),
});

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
  assert.equal(result.body.templateCatalogVersion, 'templates-v2-20260729-r15');
  assert.equal(result.body.ingredientTaxonomyVersion, 'taxonomy-v1-20260728-r10');
  assert.equal(result.body.ratioRulesVersion, 'ratio-rules-v1-20260731-r9');
  assert.equal(result.body.activeTemplates, 11);
  assert.equal(result.body.plannedTemplates, 5);
  assert.equal(result.body.baseRecipes, 72);
  assert.equal(result.body.buildId, 'preview-test-build');
  assert.equal(result.body.plannerRollout, 'direct-recommend');
  assert.equal(result.body.generationMode, 'deterministic');
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

test('health fails build metadata closed when the asset is missing or invalid', async () => {
  for (const buildMeta of [
    new Response('missing', { status:404 }),
    JSON.stringify({ buildId:'preview-test-build', plannerRollout:'everyone' }),
    JSON.stringify({ buildId:'preview-test-build', plannerRollout:'direct-recommend', generationMode:'hybrid' }),
    '{bad json',
  ]) {
    const result = await getHealth(assetBinding({ '/build-meta.json':buildMeta }));
    assert.equal(result.response.status, 200);
    assert.equal(result.body.buildId, null);
    assert.equal(result.body.plannerRollout, 'off');
    assert.equal(result.body.generationMode, 'llm');
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

test('planner request parsing rejects malformed, oversized, empty, non-object and invalid contracts before assets or budget', async t => {
  const cases = [
    ['malformed JSON', '{not-json', 'invalid_json'],
    ['oversized body', JSON.stringify({ padding: 'x'.repeat(33 * 1024) }), 'request_too_large'],
    ['empty body', '', 'invalid_planner_request'],
    ['array JSON', '[]', 'invalid_planner_request'],
    ['invalid V2 contract', JSON.stringify(plannerBody({ intent: 'eventually' })), 'invalid_planner_request'],
  ];
  for (const [name, rawBody, code] of cases) {
    await t.test(name, async () => {
      const assets = assetBinding();
      const result = await postPlan(null, { assets, rawBody });
      assert.equal(result.response.status, 400);
      assert.equal(result.body.code, code);
      assert.equal(assets.calls.length, 0);
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
  assert.match(deployment, /templates-v2-20260729-r15/);
  assert.match(deployment, /taxonomy-v1-20260728-r10/);
  assert.match(deployment, /ratio-rules-v1-20260731-r9/);
  assert.match(deployment, /11 个 active templates，5 个 planned templates/);
  assert.match(deployment, /138\/138/);
  assert.match(deployment, /未部署|不得部署/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import worker from '../../worker/src/worker.js';

const readAsset = name => fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8');
const RICE_MEAL_BUILD_META = JSON.stringify({
  buildId: 'rice-meal-worker-test',
  plannerRollout: 'direct-recommend',
  generationMode: 'deterministic',
  productFocus: 'rice-meal-v1',
});
const LEGACY_BUILD_META = JSON.stringify({
  buildId: 'legacy-worker-test',
  plannerRollout: 'direct-recommend',
  generationMode: 'deterministic',
  productFocus: 'legacy',
});
const SOURCE_ASSETS = Object.freeze({
  '/ingredient-taxonomy.v1.json': readAsset('ingredient-taxonomy.v1.json'),
  '/meal-templates.v2.json': readAsset('meal-templates.v2.json'),
  '/ratio-rules.v1.json': readAsset('ratio-rules.v1.json'),
  '/recipe-library.json': readAsset('recipe-library.json'),
  '/recipe-runtime.v1.json': readAsset('recipe-runtime.v1.json'),
  '/recipe-action-profiles.v1.json': readAsset('recipe-action-profiles.v1.json'),
  '/rice-meal-catalog.v1.json': readAsset('rice-meal-catalog.v1.json'),
  '/rice-meal-collection.v1.json': readAsset('rice-meal-collection.v1.json'),
  '/foods-tw.json': readAsset('foods-tw.json'),
  '/build-meta.json': RICE_MEAL_BUILD_META,
});

function assetBinding(overrides = {}) {
  const bytes = { ...SOURCE_ASSETS, ...overrides };
  return {
    calls: [],
    async fetch(request) {
      const pathname = new URL(request.url).pathname;
      this.calls.push(pathname);
      if (!Object.hasOwn(bytes, pathname)) return new Response('missing', { status: 404 });
      return new Response(bytes[pathname], {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    },
  };
}

function zeroBudgetKv() {
  return {
    gets: 0,
    puts: 0,
    async get() { this.gets += 1; throw new Error('rice meal must not read generation budget'); },
    async put() { this.puts += 1; throw new Error('rice meal must not write generation budget'); },
  };
}

function ricePlanRequest(overrides = {}) {
  return {
    schema_version: 3,
    product_focus: 'rice_meal',
    servings: 2,
    pantry: ['鸡腿', '土豆'],
    dislikes: [],
    ...overrides,
  };
}

function legacyPlanRequest() {
  return {
    schema_version: 2,
    planner_version: 'pantry-planner-v2',
    constraints: {
      mode: 'pantry',
      intent: 'normal',
      servings: 2,
      must_use: ['番茄', '鸡蛋'],
      prefer_use: [],
      dislikes: [],
      current_plan_id: null,
      recent_plan_ids: [],
      decision: null,
    },
  };
}

async function post(endpoint, body, {
  assets = assetBinding(),
  rawBody = JSON.stringify(body),
  env = {},
} = {}) {
  const kv = zeroBudgetKv();
  let modelCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    modelCalls += 1;
    throw new Error('rice meal endpoints must not call DeepSeek');
  };
  try {
    const response = await worker.fetch(new Request(`https://rice-meal.example${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://rice-meal.example' },
      body: rawBody,
    }), {
      ASSETS: assets,
      RATE_KV: kv,
      RICE_MEAL_PLAN_SECRET: 'worker-rice-meal-test-secret',
      ...env,
    });
    return {
      status: response.status,
      body: await response.json(),
      assets,
      kv,
      modelCalls,
    };
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test('rice-meal build selects schema-v3 candidates without model or budget work', async () => {
  const result = await post('/plan-meal', ricePlanRequest());

  assert.equal(result.status, 200);
  assert.equal(result.body.schema_version, 3);
  assert.equal(result.body.product_focus, 'rice_meal');
  assert.equal(result.body.status, 'ready');
  assert.deepEqual(result.body.candidates.map(candidate => candidate.variant_id), [
    'home-chicken-leg-potato-rice',
  ]);
  assert.equal(result.body.candidates[0].coverage_total, 2);
  assert.match(result.body.candidates[0].plan_token, /^rm1\.[A-Za-z0-9_-]+\.[a-f0-9]{64}$/u);
  assert.equal(result.modelCalls, 0);
  assert.equal(result.kv.gets, 0);
  assert.equal(result.kv.puts, 0);
});

test('rice-meal HTTP swap returns no_alternative_plan without losing the current candidate', async () => {
  const planned = await post('/plan-meal', ricePlanRequest());
  const current = planned.body.candidates[0];
  const started = performance.now();
  const swapped = await post('/plan-meal', ricePlanRequest({
    swap: {
      current_plan_id: current.plan_id,
      recent_plan_ids: [current.plan_id],
    },
  }));

  assert.equal(swapped.status, 200);
  assert.equal(swapped.body.status, 'no_alternative_rice_meal');
  assert.equal(swapped.body.code, 'no_alternative_plan');
  assert.equal(swapped.body.current_candidate.plan_id, current.plan_id);
  assert.ok(performance.now() - started < 2000, 'no-alternative response must return within two seconds');
  assert.equal(swapped.modelCalls, 0);
  assert.equal(swapped.kv.gets, 0);
});

test('rice-meal build compiles only a signed token and preserves reviewed RM-15 facts without model work', async () => {
  const planned = await post('/plan-meal', ricePlanRequest());
  assert.equal(planned.status, 200);
  const result = await post('/generate-plan', { plan_token: planned.body.candidates[0].plan_token });

  assert.equal(result.status, 200);
  assert.equal(result.body.schema_version, 3);
  assert.equal(result.body.status, 'ready');
  assert.equal(result.body.variant_id, 'home-chicken-leg-potato-rice');
  assert.equal(result.body.meals[0].dish_name, '鸡腿土豆焖饭');
  assert.deepEqual(result.body.plan.ingredient_amounts.map(item => [item.canonical_id, item.grams]), [
    ['raw-rice', 200],
    ['chicken-leg', 120],
    ['potato', 100],
    ['water', 280],
  ]);
  assert.deepEqual(result.body.meals[0].steps.map(step => step.action_code), [
    'rinse_raw_rice',
    'cut_chicken_leg_to_small_pieces',
    'prepare_vegetables',
    'load_inner_pot',
    'start_closed_lid_program',
    'rest_lid_closed',
    'verify_safety_endpoints',
    'fluff_and_serve',
  ]);
  assert.equal(result.modelCalls, 0);
  assert.equal(result.kv.gets, 0);
  assert.equal(result.kv.puts, 0);
});

test('three-person rice meal keeps three servings through signed compilation and scales every amount', async () => {
  const planned = await post('/plan-meal', ricePlanRequest({ servings:3 }));
  assert.equal(planned.status, 200);
  assert.equal(planned.body.candidates[0].servings, 3);
  const result = await post('/generate-plan', { plan_token:planned.body.candidates[0].plan_token });
  assert.equal(result.status, 200);
  assert.equal(result.body.meals[0].servings, 3);
  assert.deepEqual(result.body.plan.ingredient_amounts.map(item => [item.canonical_id, item.grams]), [
    ['raw-rice', 300],
    ['chicken-leg', 180],
    ['potato', 150],
    ['water', 420],
  ]);
});

test('three-person Shanghai salted pork rice survives the real HTTP plan and generation handoff', async () => {
  const planned = await post('/plan-meal', ricePlanRequest({
    servings: 3,
    pantry: ['咸五花肉', '小白菜'],
  }));
  assert.equal(planned.status, 200);
  assert.equal(planned.body.candidates[0].variant_id, 'shanghai-salted-pork-rice');
  assert.deepEqual(planned.body.candidates[0].used_items.map(item => item.raw), ['咸五花肉', '小白菜']);

  const generated = await post('/generate-plan', {
    plan_token: planned.body.candidates[0].plan_token,
  });
  assert.equal(generated.status, 200);
  assert.equal(generated.body.meals[0].dish_name, '上海咸肉菜饭');
  assert.deepEqual(generated.body.plan.ingredient_amounts.map(item => [item.canonical_id, item.grams]), [
    ['raw-rice', 300],
    ['salted-pork-belly', 150],
    ['small-bok-choy', 400],
    ['water', 310],
  ]);
  assert.match(generated.body.meals[0].steps.find(step => (
    step.action_code === 'add_reserved_leafy_vegetable'
  )).text, /剩约10分钟.*30秒内合盖/u);
  assert.equal(generated.modelCalls, 0);
  assert.equal(generated.kv.gets, 0);
  assert.equal(generated.kv.puts, 0);
});

test('rice-meal endpoints reject malformed JSON before model or budget work', async () => {
  const result = await post('/generate-plan', null, { rawBody: '{bad json' });

  assert.equal(result.status, 400);
  assert.equal(result.body.code, 'invalid_json');
  assert.equal(result.modelCalls, 0);
  assert.equal(result.kv.gets, 0);
  assert.equal(result.kv.puts, 0);
});

test('rice-meal build fails closed when its catalog or focus metadata is unavailable', async () => {
  const missingCatalog = await post('/plan-meal', ricePlanRequest(), {
    assets: assetBinding({ '/rice-meal-catalog.v1.json': undefined }),
  });
  assert.equal(missingCatalog.status, 503);
  assert.equal(missingCatalog.body.code, 'rice_meal_assets_unavailable');
  assert.equal(missingCatalog.modelCalls, 0);

  const invalidMetadata = await post('/plan-meal', ricePlanRequest(), {
    assets: assetBinding({
      '/build-meta.json': JSON.stringify({
        buildId: 'broken-rice-focus',
        plannerRollout: 'direct-recommend',
        generationMode: 'deterministic',
        productFocus: 'not-a-focus',
      }),
    }),
  });
  assert.equal(invalidMetadata.status, 503);
  assert.equal(invalidMetadata.body.code, 'build_metadata_unavailable');
  assert.equal(invalidMetadata.modelCalls, 0);
});

test('rice build routes parsed invalid bodies by build metadata, never through legacy contracts', async () => {
  const malformedRicePlan = await post('/plan-meal', ricePlanRequest({ dislikes: '不吃辣' }));
  assert.equal(malformedRicePlan.status, 400);
  assert.equal(malformedRicePlan.body.code, 'invalid_rice_meal_request');
  assert.deepEqual(malformedRicePlan.assets.calls, ['/build-meta.json']);
  assert.equal(malformedRicePlan.modelCalls, 0);
  assert.equal(malformedRicePlan.kv.gets, 0);

  const malformedRiceToken = await post('/generate-plan', {
    plan_token: 'not-a-signed-token',
    ignored: true,
  });
  assert.equal(malformedRiceToken.status, 400);
  assert.equal(malformedRiceToken.body.code, 'invalid_plan_token');
  assert.deepEqual(malformedRiceToken.assets.calls, ['/build-meta.json']);
  assert.equal(malformedRiceToken.modelCalls, 0);
  assert.equal(malformedRiceToken.kv.gets, 0);

  const legacyInvalid = await post('/plan-meal', ricePlanRequest({ dislikes: '不吃辣' }), {
    assets: assetBinding({ '/build-meta.json': LEGACY_BUILD_META }),
  });
  assert.equal(legacyInvalid.status, 400);
  assert.equal(legacyInvalid.body.code, 'invalid_planner_request');
  assert.equal(legacyInvalid.modelCalls, 0);
  assert.equal(legacyInvalid.kv.gets, 0);
});

test('legacy build keeps the V2 planner route and cannot be switched by a rice request body', async () => {
  const result = await post('/plan-meal', legacyPlanRequest(), {
    assets: assetBinding({ '/build-meta.json': LEGACY_BUILD_META }),
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.schema_version, 2);
  assert.equal(result.body.status, 'complete');
  assert.equal(result.modelCalls, 0);
});

test('health reports rice catalog availability rather than claiming a missing catalog is ready', async () => {
  const assets = assetBinding({ '/rice-meal-catalog.v1.json': undefined });
  const response = await worker.fetch(new Request('https://rice-meal.example/health'), {
    ASSETS: assets,
    RICE_MEAL_PLAN_SECRET: 'worker-rice-meal-test-secret',
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.productFocus, 'rice-meal-v1');
  assert.equal(body.riceMealCatalog, 'unavailable');
  assert.equal(body.riceMealCatalogVersion, null);
  assert.equal(body.riceMealPreviewReady, 0);
});

test('health exposes rice catalog facts only for valid rice metadata and includes planned count', async () => {
  const healthy = await worker.fetch(new Request('https://rice-meal.example/health'), {
    ASSETS: assetBinding(),
    RICE_MEAL_PLAN_SECRET: 'worker-rice-meal-test-secret',
  });
  const healthyBody = await healthy.json();
  assert.equal(healthyBody.riceMealCatalog, 'ok');
  assert.equal(healthyBody.riceMealCatalogVersion, 'rice-meal-catalog-v1-20260801-r6');
  assert.equal(healthyBody.riceMealFamilies, 3);
  assert.equal(healthyBody.riceMealVariants, 11);
  assert.equal(healthyBody.riceMealPreviewReady, 8);
  assert.equal(healthyBody.riceMealPlanned, 3);

  for (const buildMeta of [
    '{bad json',
    LEGACY_BUILD_META,
  ]) {
    const response = await worker.fetch(new Request('https://rice-meal.example/health'), {
      ASSETS: assetBinding({ '/build-meta.json': buildMeta }),
      RICE_MEAL_PLAN_SECRET: 'worker-rice-meal-test-secret',
    });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.riceMealCatalog, 'unavailable');
    assert.equal(body.riceMealCatalogVersion, null);
    assert.equal(body.riceMealFamilies, 0);
    assert.equal(body.riceMealVariants, 0);
    assert.equal(body.riceMealPreviewReady, 0);
    assert.equal(body.riceMealPlanned, 0);
  }
});

test('health distinguishes a valid rice catalog from missing plan-token signing readiness', async () => {
  const withoutSecret = await worker.fetch(new Request('https://rice-meal.example/health'), {
    ASSETS: assetBinding(),
  });
  const withoutSecretBody = await withoutSecret.json();

  assert.equal(withoutSecret.status, 200);
  assert.equal(withoutSecretBody.riceMealCatalog, 'ok');
  assert.equal(withoutSecretBody.riceMealPlanSigner, 'unavailable');
  assert.equal(withoutSecretBody.riceMealRuntime, 'unavailable');

  const withSecret = await worker.fetch(new Request('https://rice-meal.example/health'), {
    ASSETS: assetBinding(),
    RICE_MEAL_PLAN_SECRET: 'worker-rice-meal-test-secret',
  });
  const withSecretBody = await withSecret.json();

  assert.equal(withSecret.status, 200);
  assert.equal(withSecretBody.riceMealCatalog, 'ok');
  assert.equal(withSecretBody.riceMealPlanSigner, 'ok');
  assert.equal(withSecretBody.riceMealRuntime, 'ok');
});

test('rice-meal planning reports a missing signer without pretending catalog assets are broken', async () => {
  const result = await post('/plan-meal', ricePlanRequest(), {
    env: { RICE_MEAL_PLAN_SECRET: '' },
  });

  assert.equal(result.status, 503);
  assert.equal(result.body.code, 'rice_meal_signing_unavailable');
  assert.equal(result.modelCalls, 0);
  assert.equal(result.kv.gets, 0);
});

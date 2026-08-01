import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import fs from 'node:fs';

import { selectRiceMealCandidates } from '../../worker/src/rice-meal-selector.js';

let compiler = {};
try {
  compiler = await import('../../worker/src/rice-meal-compiler.js');
} catch {
  // The first red run deliberately executes before the compiler exists.
}

test('rice meal compiler exposes the signed-plan and deterministic compilation APIs', () => {
  for (const name of [
    'buildRiceMealPlanToken',
    'verifyAndRecomputeRiceMealPlan',
    'compileRiceMeal',
  ]) {
    assert.equal(typeof compiler[name], 'function', `${name} must be exported`);
  }
});

const readAsset = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const assets = Object.freeze({
  catalog: readAsset('rice-meal-catalog.v1.json'),
  taxonomy: readAsset('ingredient-taxonomy.v1.json'),
  ratios: readAsset('ratio-rules.v1.json'),
  recipes: readAsset('recipe-library.json'),
});
const SECRET = 'rice-meal-test-secret';

function compilerApi(name) {
  assert.equal(typeof compiler[name], 'function', `${name} must be exported`);
  return compiler[name];
}

function select(request, ratioCatalog = assets.ratios) {
  const result = selectRiceMealCandidates({
    request,
    catalog: assets.catalog,
    taxonomy: assets.taxonomy,
    ratioCatalog,
    recentPlanIds: [],
  });
  assert.equal(result.status, 'ready', JSON.stringify(result));
  assert.ok(result.candidates.length > 0);
  return result.candidates[0];
}

function chickenCandidate(servings = 2) {
  return select({ servings, pantry: ['鸡腿', '土豆'], dislikes: [] });
}

function cornCandidate(servings = 2) {
  return select({ servings, pantry: ['鸡腿', '玉米', '胡萝卜'], dislikes: [] });
}

function expectCode(fn, code) {
  assert.throws(fn, error => error?.code === code || error?.message === code, code);
}

function decodeToken(token) {
  const [, encoded, signature] = token.split('.');
  const normalized = encoded.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  return { payload: JSON.parse(Buffer.from(padded, 'base64').toString('utf8')), signature };
}

function encodePayload(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64')
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function ratiosWithChickenWaterRatio(multiplier, rounding = 1) {
  const ratios = structuredClone(assets.ratios);
  const rule = ratios.rules.find(row => row.rule_id === 'chicken-leg-potato-braised-rice-executable-v1');
  const water = rule.operations.find(row => row.operator === 'ratio');
  water.min = multiplier;
  water.default = multiplier;
  water.max = multiplier;
  rule.rounding.grams_to_nearest = rounding;
  return ratios;
}

test('signed plan token is stable for the same plan and excludes display copy', () => {
  const buildToken = compilerApi('buildRiceMealPlanToken');
  const candidate = chickenCandidate();
  const renamed = structuredClone(candidate);
  renamed.display_name = '不参与签名的展示名';
  renamed.name_label = '临时推荐说明';
  renamed.recommendation_reason = '展示文案不应影响计划身份';

  assert.equal(buildToken(candidate, SECRET), buildToken(candidate, SECRET));
  assert.equal(buildToken(candidate, SECRET), buildToken(renamed, SECRET));
  const token = buildToken(candidate, SECRET);
  const [, encoded, signature] = token.split('.');
  assert.equal(signature, createHmac('sha256', SECRET).update(encoded).digest('hex'));
});

test('signed plan token uses a canonical normalized request snapshot rather than pantry aliases or order', () => {
  const buildToken = compilerApi('buildRiceMealPlanToken');
  const direct = chickenCandidate();
  const reversed = select({ servings: 2, pantry: ['土豆', '鸡腿'], dislikes: [] });
  const aliases = select({ servings: 2, pantry: ['去皮鸡腿肉', '马铃薯'], dislikes: [] });
  const canonicalDislike = select({ servings: 2, pantry: ['鸡腿', '土豆'], dislikes: ['香菜'] });
  const duplicateWhitespaceDislike = select({
    servings: 2,
    pantry: ['土豆', '鸡腿'],
    dislikes: [' 香 菜 ', '香菜'],
  });
  const normalizedUnknown = select({ servings: 2, pantry: ['鸡腿', '土豆', '火星菜'], dislikes: [] });
  const whitespaceUnknown = select({ servings: 2, pantry: ['鸡腿', '土豆', ' 火 星 菜 '], dislikes: [] });

  assert.equal(direct.plan_id, reversed.plan_id);
  assert.equal(direct.plan_id, aliases.plan_id);
  assert.equal(buildToken(direct, SECRET), buildToken(reversed, SECRET));
  assert.equal(buildToken(direct, SECRET), buildToken(aliases, SECRET));
  assert.equal(canonicalDislike.plan_id, duplicateWhitespaceDislike.plan_id);
  assert.equal(buildToken(canonicalDislike, SECRET), buildToken(duplicateWhitespaceDislike, SECRET));
  assert.equal(normalizedUnknown.plan_id, whitespaceUnknown.plan_id);
  assert.equal(buildToken(normalizedUnknown, SECRET), buildToken(whitespaceUnknown, SECRET));
  assert.deepEqual(direct.plan_snapshot, {
    catalog_version: assets.catalog.catalog_version,
    servings: 2,
    normalized_items: [
      { kind: 'recognized', canonical_id: 'chicken-leg', state: 'raw', shape_or_cut: 'leg' },
      { kind: 'recognized', canonical_id: 'potato', state: 'raw', shape_or_cut: null },
    ],
    dislikes: [],
  });
  assert.deepEqual(canonicalDislike.plan_snapshot.dislikes, ['香菜']);
  assert.ok(normalizedUnknown.plan_snapshot.normalized_items.some(item => (
    item.kind === 'unrecognized' && item.raw === '火星菜'
  )));
  const changedCut = structuredClone(direct);
  changedCut.plan_snapshot.normalized_items[0].shape_or_cut = 'breast';
  assert.notEqual(buildToken(direct, SECRET), buildToken(changedCut, SECRET));
});

test('signed plan token changes when semantic candidate facts change', () => {
  const buildToken = compilerApi('buildRiceMealPlanToken');
  const base = chickenCandidate();
  const variants = [
    cornCandidate(),
    chickenCandidate(3),
    (() => {
      const changed = structuredClone(base);
      changed.substitutions = [{
        target_canonical_id: 'potato',
        input_canonical_id: 'carrot',
        kind: 'approved_substitution',
      }];
      return changed;
    })(),
    (() => {
      const changed = structuredClone(base);
      changed.ratio_rule_ids = ['green-bean-pork-rib-braised-rice-executable-v1'];
      return changed;
    })(),
    (() => {
      const changed = structuredClone(base);
      changed.execution_actions.pre_actions[0].action_code = 'prepare_vegetables';
      return changed;
    })(),
    (() => {
      const changed = structuredClone(base);
      changed.catalog_version = 'rice-meal-catalog-test-next';
      return changed;
    })(),
  ];

  const token = buildToken(base, SECRET);
  for (const changed of variants) assert.notEqual(buildToken(changed, SECRET), token);
});

test('verification recomputes the server candidate and rejects bare, forged, and stale plans', () => {
  const buildToken = compilerApi('buildRiceMealPlanToken');
  const verify = compilerApi('verifyAndRecomputeRiceMealPlan');
  const compile = compilerApi('compileRiceMeal');
  const candidate = chickenCandidate();
  const token = buildToken(candidate, SECRET);
  const verified = verify({ plan_token: token }, assets, SECRET);
  assert.equal(verified.plan_id, candidate.plan_id);
  assert.equal(verified.variant_id, candidate.variant_id);

  expectCode(() => verify({ plan_id: candidate.plan_id }, assets, SECRET), 'invalid_plan_token');
  expectCode(() => verify({ plan_token: token, candidate: structuredClone(candidate) }, assets, SECRET), 'invalid_plan_token');

  const { payload, signature } = decodeToken(token);
  payload.candidate.selected_ingredient_ids[1] = 'beef-tenderloin';
  expectCode(
    () => verify({ plan_token: `rm1.${encodePayload(payload)}.${signature}` }, assets, SECRET),
    'invalid_plan_token',
  );

  const staleCatalog = structuredClone(assets.catalog);
  staleCatalog.catalog_version = 'rice-meal-catalog-v1-20260801-r6';
  expectCode(
    () => verify({ plan_token: token }, { ...assets, catalog: staleCatalog }, SECRET),
    'stale_plan',
  );

  const changedRatios = ratiosWithChickenWaterRatio(1.5);
  const signedOldRatioToken = buildToken(candidate, SECRET);
  expectCode(
    () => verify({ plan_token: signedOldRatioToken }, { ...assets, ratios: changedRatios }, SECRET),
    'stale_plan',
  );
  expectCode(() => compile(candidate, { ...assets, ratios: changedRatios }), 'stale_plan');
});

test('ratio machine facts change plan identity for water-ratio and rounding edits under one catalog version', () => {
  const buildToken = compilerApi('buildRiceMealPlanToken');
  const base = chickenCandidate();
  const changedWater = select(
    { servings: 2, pantry: ['鸡腿', '土豆'], dislikes: [] },
    ratiosWithChickenWaterRatio(1.5),
  );
  const changedRounding = select(
    { servings: 2, pantry: ['鸡腿', '土豆'], dislikes: [] },
    ratiosWithChickenWaterRatio(1.4, 5),
  );
  const changedLiquidSemantics = structuredClone(assets.ratios);
  changedLiquidSemantics.rules.find(row => row.rule_id === 'chicken-leg-potato-braised-rice-executable-v1')
    .liquid_contract.measurement = 'weigh_immediately_before_loading';
  const changedLiquidContract = select(
    { servings: 2, pantry: ['鸡腿', '土豆'], dislikes: [] },
    changedLiquidSemantics,
  );
  const displayOnly = structuredClone(assets.ratios);
  displayOnly.rules.find(row => row.rule_id === 'chicken-leg-potato-braised-rice-executable-v1')
    .example_context.ingredient_name = '仅供展示的别名';
  const changedDisplayOnly = select(
    { servings: 2, pantry: ['鸡腿', '土豆'], dislikes: [] },
    displayOnly,
  );
  const changedVersion = structuredClone(assets.ratios);
  changedVersion.ratio_catalog_version = 'ratio-rules-v1-20260731-r10';
  const changedCatalogVersion = select(
    { servings: 2, pantry: ['鸡腿', '土豆'], dislikes: [] },
    changedVersion,
  );

  assert.equal(base.ratio_catalog_version, assets.ratios.ratio_catalog_version);
  assert.match(base.ratio_facts_hash, /^sha256:[0-9a-f]{64}$/u);
  assert.notEqual(changedWater.plan_id, base.plan_id);
  assert.notEqual(changedWater.ratio_facts_hash, base.ratio_facts_hash);
  assert.notEqual(buildToken(changedWater, SECRET), buildToken(base, SECRET));
  assert.notEqual(changedRounding.plan_id, base.plan_id);
  assert.notEqual(changedRounding.ratio_facts_hash, base.ratio_facts_hash);
  assert.notEqual(changedLiquidContract.plan_id, base.plan_id);
  assert.notEqual(changedLiquidContract.ratio_facts_hash, base.ratio_facts_hash);
  assert.equal(changedCatalogVersion.ratio_catalog_version, changedVersion.ratio_catalog_version);
  assert.notEqual(changedCatalogVersion.plan_id, base.plan_id);
  assert.equal(changedDisplayOnly.plan_id, base.plan_id);
  assert.equal(changedDisplayOnly.ratio_facts_hash, base.ratio_facts_hash);
});

test('compiler locks catalog name, exact integer ratio grams, allowed ingredients, actions, and endpoints', () => {
  const compile = compilerApi('compileRiceMeal');
  const candidate = chickenCandidate();
  const output = compile(candidate, assets);
  const meal = output.meals[0];

  assert.equal(output.plan_id, candidate.plan_id);
  assert.equal(meal.dish_name, '鸡腿土豆焖饭');
  assert.deepEqual(output.plan.ingredient_amounts.map(item => [item.canonical_id, item.grams]), [
    ['raw-rice', 200],
    ['chicken-leg', 120],
    ['potato', 100],
    ['water', 280],
  ]);
  assert.ok(output.plan.ingredient_amounts.every(item => Number.isSafeInteger(item.grams) && item.grams > 0));
  assert.deepEqual(
    output.plan.ingredient_amounts.map(item => item.canonical_id).sort(),
    ['chicken-leg', 'potato', 'raw-rice', 'water'],
  );
  assert.deepEqual(meal.steps.map(step => step.action_code), [
    'rinse_raw_rice',
    'cut_chicken_leg_to_small_pieces',
    'prepare_vegetables',
    'load_inner_pot',
    'start_closed_lid_program',
    'rest_lid_closed',
    'verify_safety_endpoints',
    'fluff_and_serve',
  ]);
  assert.deepEqual(
    meal.steps.flatMap(step => step.completed_safety_endpoints),
    ['rice_tender', 'poultry_fully_cooked', 'tender'],
  );
  assert.match(meal.steps.at(-2).text, /鸡腿肉完全熟透，内部无粉红/u);
  assert.match(meal.steps.at(-2).text, /大米熟软且无硬芯/u);
  assert.match(meal.steps.at(-2).text, /土豆熟软/u);
  assert.doesNotMatch(JSON.stringify(output), /牛腩|香菇|虾仁/u);
  assert.ok(output.plan.nutrition_inputs.every(item => !Object.hasOwn(item, 'kcal')),
    'compiler must hand authority lookup inputs onward instead of inventing nutrition');
  assert.deepEqual(output.plan.liquid_constraints, {
    kind: 'total_free_liquid',
    measured_contributor_ids: ['water'],
    target_total_free_liquid_grams: 280,
    added_water_grams: 280,
    display_precision: 'approximate',
    display_grams: 280,
    retained_liquid_grams: 280,
    liquid_credit_grams: 0,
    rounding_grams: 1,
  });
});

test('compiler cannot be reached for controlled finish-only meals while their liquid contracts remain planned', () => {
  const cases = [
    ['豆腐', '白菜'],
    ['牛里脊', '西兰花'],
  ];
  for (const pantry of cases) {
    const result = selectRiceMealCandidates({
      request: { servings: 2, pantry, dislikes: [] },
      catalog: assets.catalog,
      taxonomy: assets.taxonomy,
      ratioCatalog: assets.ratios,
      recentPlanIds: [],
    });
    assert.equal(result.status, 'no_reliable_rice_meal');
    assert.deepEqual(result.candidates, []);
  }
});

test('meat-and-greens rice compiles its calibrated finish-fold plan', () => {
  const candidate = select({ servings: 2, pantry: ['猪肉末', '青菜'], dislikes: [] });
  assert.equal(candidate.variant_id, 'home-greens-minced-pork-rice');
  const output = compilerApi('compileRiceMeal')(candidate, assets);
  assert.equal(output.meals[0].dish_name, '肉糜青菜饭');
  assert.deepEqual(output.meals[0].steps.map(step => step.action_code), [
    'rinse_raw_rice',
    'brown_ground_pork_outside_cooker',
    'pre_cook_tender_vegetables_outside_cooker',
    'load_inner_pot',
    'start_closed_lid_program',
    'rest_lid_closed',
    'verify_safety_endpoints',
    'fold_in_pre_cooked_ingredients',
    'fluff_and_serve',
  ]);
});

test('every active rice-meal family renders its reviewed household prose with no engineering language', () => {
  const compile = compilerApi('compileRiceMeal');
  const snapshots = [
    {
      candidate: chickenCandidate(),
      dish: '鸡腿土豆焖饭',
      steps: [
        '淘洗大米后沥干，放在一旁备用。',
        '将鸡腿肉切成小块，方便在电饭煲中均匀熟透。',
        '将土豆切成大小相近的块，洗去表面淀粉。',
        '把大米、鸡腿肉、土豆放入内胆，加入约量好的水并轻轻铺平。',
        '确认大米、鸡腿肉、土豆已经放好，盖好锅盖，启动标准煮饭程序。',
        '程序结束后，让大米在盖好锅盖的状态下静置片刻。',
        '开盖检查：大米熟软且无硬芯；鸡腿肉完全熟透，内部无粉红；土豆熟软。',
        '将大米、鸡腿肉、土豆轻轻翻松，盛出即可。',
      ],
    },
    {
      candidate: cornCandidate(),
      dish: '玉米胡萝卜鸡腿焖饭',
      steps: [
        '淘洗大米后沥干，放在一旁备用。',
        '将鸡腿肉切成小块，方便在电饭煲中均匀熟透。',
        '将玉米洗净；胡萝卜切成大小均匀的小丁。',
        '把大米、鸡腿肉、玉米、胡萝卜放入内胆，加入约量好的水并轻轻铺平。',
        '确认大米、鸡腿肉、玉米、胡萝卜已经放好，盖好锅盖，启动标准煮饭程序。',
        '程序结束后，让大米在盖好锅盖的状态下静置片刻。',
        '开盖检查：大米熟软且无硬芯；鸡腿肉完全熟透，内部无粉红；胡萝卜熟软。',
        '将大米、鸡腿肉、玉米、胡萝卜轻轻翻松，盛出即可。',
      ],
    },
  ];
  for (const snapshot of snapshots) {
    const output = compile(snapshot.candidate, assets);
    assert.equal(output.meals[0].dish_name, snapshot.dish);
    assert.deepEqual(output.meals[0].steps.map(step => step.text), snapshot.steps);
    assert.doesNotMatch(
      [output.meals[0].dish_name, ...output.meals[0].steps.map(step => step.text), output.meals[0].recommendation_reason].join('\n'),
      /计划比例|slot|template|canonical|生产版|家里现成/u,
    );
  }
});

test('RM-15 is a signed candidate-to-compiler contract with zero DeepSeek work', () => {
  const buildToken = compilerApi('buildRiceMealPlanToken');
  const verify = compilerApi('verifyAndRecomputeRiceMealPlan');
  const compile = compilerApi('compileRiceMeal');
  const corpus = readAsset('rice-meal-journeys.v1.json');
  const journey = corpus.journeys.find(row => row.id === 'RM-15-selector-facts-for-compiler');
  assert.ok(journey);
  const candidate = select(journey.request);
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = () => { throw new Error('compiler must not call DeepSeek'); };
    const verified = verify({ plan_token: buildToken(candidate, SECRET) }, assets, SECRET);
    const output = compile(verified, assets);
    assert.equal(output.meals[0].dish_name, '鸡腿土豆焖饭');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

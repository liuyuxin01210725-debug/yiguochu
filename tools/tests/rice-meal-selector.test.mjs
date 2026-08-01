import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = path.dirname(fileURLToPath(import.meta.url));
const readJson = name => JSON.parse(fs.readFileSync(path.join(here, '../data', name), 'utf8'));
const taxonomy = readJson('ingredient-taxonomy.v1.json');
const catalog = readJson('rice-meal-catalog.v1.json');
const ratios = readJson('ratio-rules.v1.json');
const sourceEvidence = readJson('rice-cooker-source-evidence.v1.json');
const journeyCorpus = readJson('rice-meal-journeys.v1.json');

// The import is deliberately deferred so the first RED run fails as a test
// assertion (the public selector API is absent), rather than as a loader error.
let selectorModule = {};
try {
  selectorModule = await import('../../worker/src/rice-meal-selector.js');
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND') throw error;
}

const { normalizeRiceMealRequest, selectRiceMealCandidates } = selectorModule;

function controlledRatioCatalogFor(sourceCatalog) {
  const variants = (sourceCatalog.families || []).flatMap(family => family.variants || []);
  const variantByRuleId = new Map();
  for (const variant of variants) {
    for (const ruleId of variant.ratio_rule_ids || []) variantByRuleId.set(ruleId, variant);
  }
  const nativeRules = new Map(ratios.rules.map(rule => [rule.rule_id, rule]));
  const ruleIds = [...variantByRuleId.keys()];
  if (ruleIds.every(ruleId => nativeRules.has(ruleId))) return ratios;
  return {
    ratio_catalog_version: 'rice-meal-selector-fixture-ratios-v1',
    rules: ruleIds.map(ruleId => nativeRules.get(ruleId) || {
      rule_id: ruleId,
      when: { recipe_id: variantByRuleId.get(ruleId).recipe_id },
      execution_mode: 'executable',
      operations: [{ operator: 'fixture' }],
      rounding: { grams_to_nearest: 1 },
    }),
  };
}

function select(request, {
  sourceCatalog = catalog,
  sourceRatioCatalog = null,
  sourceTaxonomy = taxonomy,
  recentPlanIds = [],
  riceCatalogScope = 'ready',
} = {}) {
  assert.equal(typeof selectRiceMealCandidates, 'function', 'selectRiceMealCandidates must be exported');
  return selectRiceMealCandidates({
    request,
    catalog: sourceCatalog,
    taxonomy: sourceTaxonomy,
    ratioCatalog: sourceRatioCatalog || controlledRatioCatalogFor(sourceCatalog),
    sourceEvidence,
    recentPlanIds,
    riceCatalogScope,
  });
}

function normalize(request) {
  assert.equal(typeof normalizeRiceMealRequest, 'function', 'normalizeRiceMealRequest must be exported');
  return normalizeRiceMealRequest(request, taxonomy);
}

function resultUnused(result) {
  return [
    ...(result.unused_items || []),
    ...(result.unsafe_items || []),
    ...result.candidates.flatMap(candidate => candidate.unused_items || []),
  ];
}

function variant(id) {
  return catalog.families.flatMap(family => family.variants).find(row => row.variant_id === id);
}

function catalogWithChickenSeasonings(seasoningIds) {
  const sourceCatalog = structuredClone(catalog);
  sourceCatalog.catalog_version = `rice-meal-selector-seasoning-${seasoningIds.join('-')}`;
  const chicken = sourceCatalog.families.flatMap(family => family.variants)
    .find(row => row.variant_id === 'home-chicken-leg-potato-rice');
  chicken.controlled_seasonings = seasoningIds.map(canonicalId => ({
    canonical_ingredient_id: canonicalId,
    amount_rule_id: 'chicken-leg-potato-braised-rice-executable-v1',
    required: true,
    phase: 'start_actions',
    action_code: 'add_controlled_seasoning_before_start',
  }));
  const sourceRatios = structuredClone(ratios);
  const rule = sourceRatios.rules.find(row => row.rule_id === 'chicken-leg-potato-braised-rice-executable-v1');
  for (const canonicalId of seasoningIds) {
    const item = taxonomyItem(canonicalId);
    rule.operations.push({
      operator: 'scale_by_servings',
      target: { name: item.display_name, category: item.category },
      grams: { min: 5, default: 5, max: 5 },
    });
  }
  return { sourceCatalog, sourceRatios };
}

const TEST_NOTICE = '这道菜饭仍在家庭试做验证中，请先按页面克数和步骤操作。';
const FOUR_SERVING_CAPACITY_NOTICE = '请先确认普通电饭煲容量，食材和水不得超过最高刻度/说明书上限';

function taxonomyItem(canonicalId) {
  const item = taxonomy.items.find(row => row.canonical_id === canonicalId);
  assert.ok(item, `fixture needs taxonomy item ${canonicalId}`);
  return item;
}

function fixtureVariant({
  variantId,
  ingredientIds,
  grade = 'A',
  contributorIds = ingredientIds,
  identityLevel = 'household_reviewed',
  adaptation = 'direct_adaptation',
  activeTimeMinutes = 20,
  approvedSubstitutions = [],
  forbiddenCombinations = [],
  controlledSeasonings = [],
} = {}) {
  const allMaterialIds = ['raw-rice', ...ingredientIds];
  const contributors = grade === 'A'
    ? [
      { role: 'carb', canonical_ingredient_id: 'raw-rice' },
      { role: 'protein', canonical_ingredient_id: contributorIds[0] },
      { role: 'fiber', canonical_ingredient_id: contributorIds[1] || contributorIds[0] },
    ]
    : [
      { role: 'carb', canonical_ingredient_id: 'raw-rice' },
      { role: 'protein', canonical_ingredient_id: contributorIds[0] },
    ];
  return {
    variant_id: variantId,
    recipe_id: `fixture-${variantId}`,
    display_name: `夹具${variantId}`,
    name_label: '测试夹具',
    status: 'preview_ready',
    identity_level: identityLevel,
    rice: {
      canonical_ingredient_id: 'raw-rice',
      amount_rule_id: 'fixture-rule',
      action: '入内胆',
    },
    ingredients: ingredientIds.map((canonicalId, index) => ({
      canonical_ingredient_id: canonicalId,
      role: index === 0 ? '蛋白质' : '蔬菜',
      amount_rule_id: 'fixture-rule',
      action: '入内胆',
    })),
    controlled_seasonings: controlledSeasonings,
    approved_substitutions: approvedSubstitutions,
    forbidden_combinations: forbiddenCombinations,
    nutrition_structure: { grade, material_contributors: contributors },
    cooker_adaptation: {
      adaptation,
      closed_lid_continuation: true,
      requires_mid_cook_opening: false,
      completion_status: 'complete',
      pre_actions: [{ order: 1, action_code: 'prepare', ingredient_ids: allMaterialIds }],
      start_actions: [{ order: 1, action_code: 'load_inner_pot', ingredient_ids: allMaterialIds }],
      finish_actions: [{ order: 1, action_code: 'verify_safety_endpoints', ingredient_ids: allMaterialIds }],
      program: 'standard_rice',
      active_time_minutes: activeTimeMinutes,
      total_time_minutes: activeTimeMinutes + 20,
    },
    ratio_rule_ids: [`fixture-rule-${variantId}`],
    safety_endpoints: allMaterialIds.flatMap(canonicalId => taxonomyItem(canonicalId)
      .cooking_risk.required_endpoint_codes.map(endpoint_code => ({ canonical_ingredient_id: canonicalId, endpoint_code }))),
  };
}

function fixtureCatalog(variants, familyId = 'fixture-family') {
  return {
    schema_version: 1,
    catalog_version: 'rice-meal-catalog-selector-fixture-v1',
    families: [{ family_id: familyId, variants }],
  };
}

test('selector exposes the two documented pure-function entrypoints', () => {
  assert.equal(typeof normalizeRiceMealRequest, 'function');
  assert.equal(typeof selectRiceMealCandidates, 'function');
});

test('calibration variants are invisible by default and available only in the signed calibration scope', () => {
  const calibration = fixtureVariant({
    variantId:'calibration-chicken-potato-rice',
    ingredientIds:['chicken-leg','potato'],
    grade:'B',
  });
  calibration.status = 'calibration_preview';
  calibration.status_history = ['research_only','fact_checked','planned','calibration_preview'];
  calibration.supported_servings = [2];
  const sourceCatalog = fixtureCatalog([calibration]);

  const ordinary = select({ servings:2, pantry:['鸡腿','土豆'], dislikes:[] }, { sourceCatalog });
  assert.equal(ordinary.status, 'no_reliable_rice_meal');

  const internal = select({ servings:2, pantry:['鸡腿','土豆'], dislikes:[] }, {
    sourceCatalog,
    riceCatalogScope:'calibration',
  });
  assert.equal(internal.status, 'ready');
  assert.equal(internal.rice_catalog_scope, 'calibration');
  assert.equal(internal.candidates[0].rice_catalog_scope, 'calibration');
  assert.equal(internal.candidates[0].plan_snapshot.rice_catalog_scope, 'calibration');
});

test('the eight authentic calibration meals cover their reviewed pantry sets without leaking into ready scope', () => {
  const fixtures = [
    ['home-taiwan-cabbage-rice', ['卷心菜', '香菇', '虾米']],
    ['home-taiwan-pumpkin-rice', ['南瓜', '猪肉末', '香菇', '虾米']],
    ['home-curry-chicken-rice', ['鸡胸肉', '胡萝卜', '土豆', '洋葱']],
    ['home-sausage-mixed-rice', ['腊肠', '青豌豆', '香菇', '玉米', '胡萝卜']],
    ['home-beef-mixed-rice', ['牛肉末', '胡萝卜', '洋葱']],
    ['home-bamboo-vegetable-rice', ['猪肉末', '竹笋', '洋葱', '胡萝卜', '干木耳']],
    ['home-mixed-chicken-rice', ['鸡胸肉', '油炸豆腐', '牛蒡', '胡萝卜', '香菇']],
    ['home-fresh-shiitake-rice', ['鸡胸肉', '香菇', '芹菜']],
  ];

  for (const [variantId, pantry] of fixtures) {
    const ready = select({ servings: 2, pantry, dislikes: [] });
    assert.equal(ready.candidates.some(candidate => candidate.variant_id === variantId), false, variantId);

    const calibration = select({ servings: 2, pantry, dislikes: [] }, {
      riceCatalogScope: 'calibration',
    });
    assert.equal(calibration.status, 'ready', `${variantId}: ${JSON.stringify(calibration)}`);
    const candidate = calibration.candidates.find(row => row.variant_id === variantId);
    assert.ok(candidate, `${variantId} must be emitted in calibration scope`);
    assert.equal(candidate.coverage_count, pantry.length, variantId);
    assert.equal(candidate.coverage_total, pantry.length, variantId);
    assert.equal(candidate.coverage_ratio, 1, variantId);
    assert.deepEqual(candidate.unused_items, [], variantId);
    assert.equal(candidate.display_name, variant(variantId).display_name, variantId);
  }
});

test('controlled seasonings are signed candidate facts but never inflate pantry coverage', () => {
  const { sourceCatalog, sourceRatios } = catalogWithChickenSeasonings(['soy-sauce']);
  const result = select({ servings: 2, pantry: ['鸡腿', '土豆', '酱油'], dislikes: [] }, {
    sourceCatalog,
    sourceRatioCatalog: sourceRatios,
  });
  assert.equal(result.status, 'ready');
  const candidate = result.candidates[0];
  assert.equal(candidate.coverage_count, 2);
  assert.equal(candidate.coverage_total, 2);
  assert.deepEqual(candidate.controlled_seasonings.map(row => row.canonical_ingredient_id), ['soy-sauce']);
  assert.ok(candidate.selected_ingredient_ids.includes('soy-sauce'));
  assert.ok(candidate.required_extra_items.every(item => item.canonical_id !== 'soy-sauce'));

  const withoutPantrySeasoning = select({ servings: 2, pantry: ['鸡腿', '土豆'], dislikes: [] }, {
    sourceCatalog,
    sourceRatioCatalog: sourceRatios,
  }).candidates[0];
  assert.deepEqual(withoutPantrySeasoning.required_extra_items, [{
    canonical_id: 'soy-sauce',
    display_name: '酱油',
    kind: 'controlled_seasoning',
  }]);
  const unseasoned = select({ servings: 2, pantry: ['鸡腿', '土豆'], dislikes: [] }).candidates[0];
  assert.notEqual(withoutPantrySeasoning.plan_id, unseasoned.plan_id);
});

test('controlled seasoning allergen profiles block candidates before compilation', () => {
  const cases = [
    { seasoning: 'oyster-sauce', dislikes: ['海鲜'] },
    { seasoning: 'soy-sauce', dislikes: ['大豆'] },
    { seasoning: 'soy-sauce', dislikes: ['小麦'] },
    { seasoning: 'curry-block', dislikes: ['奶'] },
    { seasoning: 'sesame-oil', dislikes: ['芝麻'] },
    { seasoning: 'sesame-oil', dislikes: ['坚果'] },
  ];
  for (const testCase of cases) {
    const { sourceCatalog, sourceRatios } = catalogWithChickenSeasonings([testCase.seasoning]);
    const result = select({ servings: 2, pantry: ['鸡腿', '土豆'], dislikes: testCase.dislikes }, {
      sourceCatalog,
      sourceRatioCatalog: sourceRatios,
    });
    assert.equal(result.status, 'unsafe_recipe', JSON.stringify(testCase));
    assert.ok(result.safety_rejections.some(row => row.reason_code === 'seasoning_allergen_conflict'));
  }
});

test('selector accepts only the reviewed 1, 2, 3, and 4 serving request sizes', () => {
  for (const servings of [1, 2, 3, 4]) {
    assert.equal(normalize({ servings, pantry: ['鸡腿'], dislikes: [] }).servings, servings);
  }
  for (const servings of [5, 6, 7, 8]) {
    assert.throws(
      () => normalize({ servings, pantry: ['鸡腿'], dislikes: [] }),
      /servings must be one of 1, 2, 3, or 4/u,
      String(servings),
    );
  }
});

test('selector fails closed when the controlled ratio catalog is absent', () => {
  assert.throws(() => selectRiceMealCandidates({
    request: { servings: 2, pantry: ['鸡腿', '土豆'], dislikes: [] },
    catalog,
    taxonomy,
    recentPlanIds: [],
  }), /ratioCatalog/u);
});

test('selector binds every candidate to the exact source-evidence ledger version and hash', () => {
  const result = select({ servings: 2, pantry: ['鸡腿', '土豆'], dislikes: [] });
  assert.equal(result.status, 'ready');
  assert.equal(result.candidates[0].source_evidence_ledger_version, sourceEvidence.ledger_version);
  assert.match(result.candidates[0].source_evidence_hash, /^sha256:[a-f0-9]{64}$/u);

  assert.throws(() => selectRiceMealCandidates({
    request: { servings: 2, pantry: ['鸡腿', '土豆'], dislikes: [] },
    catalog,
    taxonomy,
    ratioCatalog: ratios,
    recentPlanIds: [],
  }), /sourceEvidence/u);
});

test('source-only runtime variants bind executable ratios by variant_id without borrowing a recipe identity', () => {
  const sourceOnlyCatalog = structuredClone(catalog);
  const sourceOnly = sourceOnlyCatalog.families
    .flatMap(family => family.variants)
    .find(row => row.variant_id === 'home-chicken-leg-potato-rice');
  sourceOnly.recipe_id = null;
  sourceOnly.display_name = '测试真实菜饭名';
  sourceOnly.evidence_refs = [{
    kind: 'source',
    id: 'panasonic-mixed-chicken-rice-sr-df151',
    supports: ['identity'],
  }];
  const sourceOnlyRatios = structuredClone(ratios);
  const rule = sourceOnlyRatios.rules.find(row => row.rule_id === 'chicken-leg-potato-braised-rice-executable-v1');
  rule.when = { variant_id: sourceOnly.variant_id };

  const result = select({ servings: 2, pantry: ['鸡腿', '土豆'], dislikes: [] }, {
    sourceCatalog: sourceOnlyCatalog,
    sourceRatioCatalog: sourceOnlyRatios,
  });
  assert.equal(result.status, 'ready');
  assert.equal(result.candidates[0].variant_id, sourceOnly.variant_id);
  assert.equal(result.candidates[0].recipe_id, null);
  assert.equal(result.candidates[0].display_name, '测试真实菜饭名');
  assert.deepEqual(result.candidates[0].source_refs, [{
    source_id: 'panasonic-mixed-chicken-rice-sr-df151',
    title: '什锦鸡饭',
    url: 'https://home.panasonic.cn/support/attachments/auld/manual/SR-DF151.pdf',
  }]);
});

test('Shanghai salted pork vegetable rice is a real three-serving plan and never leaks into unreviewed serving sizes', () => {
  const ready = select({ servings: 3, pantry: ['咸五花肉', '小白菜'], dislikes: [] });
  assert.equal(ready.status, 'ready');
  assert.equal(ready.candidates[0].variant_id, 'shanghai-salted-pork-rice');
  assert.equal(ready.candidates[0].display_name, '上海咸肉菜饭');
  assert.equal(ready.candidates[0].coverage_count, 2);
  assert.deepEqual(ready.candidates[0].execution_actions.mid_actions.map(action => action.action_code), [
    'add_reserved_leafy_vegetable',
  ]);

  const unsupported = select({ servings: 2, pantry: ['咸五花肉', '小白菜'], dislikes: [] });
  assert.notEqual(unsupported.candidates[0]?.variant_id, 'shanghai-salted-pork-rice');
});

test('every hand-authored rice-meal journey has its literal status, variant, coverage, grade, and reason contract', () => {
  assert.equal(journeyCorpus.journeys.length, 34, 'the fixed journey gate covers every public-ready and internal-calibration rice variant');
  for (const journey of journeyCorpus.journeys) {
    const riceCatalogScope = journey.rice_catalog_scope || 'ready';
    let result;
    if (journey.swap_from_variant_id) {
      const initial = select(journey.request, { riceCatalogScope });
      const current = initial.candidates.find(candidate => candidate.variant_id === journey.swap_from_variant_id);
      assert.ok(current, `${journey.id} fixture must first expose ${journey.swap_from_variant_id}`);
      result = select({ ...journey.request, current_plan_id: current.plan_id }, { riceCatalogScope });
      assert.equal(result.current_candidate?.variant_id, journey.swap_from_variant_id);
    } else {
      result = select(journey.request, { riceCatalogScope });
    }
    const expected = journey.expect;
    assert.equal(result.status, expected.status, journey.id);
    if (expected.status === 'unsafe_recipe') {
      assert.ok(Array.isArray(result.safety_rejections) && result.safety_rejections.length > 0,
        `${journey.id} must return structured safety rejection facts`);
    }
    if (expected.status === 'ready') {
      assert.ok(result.candidates.length > 0, `${journey.id} must emit at least one candidate`);
      assert.equal(result.candidates[0].variant_id, expected.expected_first_variant, `${journey.id} first candidate`);
      const first = result.candidates[0];
      if (Number.isInteger(expected.expected_coverage_count)) {
        assert.equal(first.coverage_count, expected.expected_coverage_count, `${journey.id} exact coverage count`);
      }
      if (Number.isInteger(expected.expected_coverage_total)) {
        assert.equal(first.coverage_total, expected.expected_coverage_total, `${journey.id} exact coverage total`);
      }
      if (Array.isArray(expected.expected_used_raw)) {
        assert.deepEqual(first.used_items.map(item => item.raw), expected.expected_used_raw, `${journey.id} used items`);
      }
      if (Array.isArray(expected.expected_unused_raw)) {
        assert.deepEqual(first.unused_items.map(item => item.raw), expected.expected_unused_raw, `${journey.id} unused items`);
      }
      if (Array.isArray(expected.expected_substitutions)) {
        assert.deepEqual(first.substitutions, expected.expected_substitutions, `${journey.id} substitutions`);
      }
      if (Array.isArray(expected.expected_ignored_basic_raw)) {
        assert.deepEqual(result.normalized_request.ignored_basic_items.map(item => item.raw), expected.expected_ignored_basic_raw,
          `${journey.id} ignored basic inputs`);
      }
    }
    assert.ok(
      result.candidates.every(candidate => expected.allowed_variant_ids.includes(candidate.variant_id)),
      `${journey.id} emitted a variant outside its literal allowlist`,
    );
    assert.ok(
      result.candidates.every(candidate => !expected.forbidden_variant_ids.includes(candidate.variant_id)),
      `${journey.id} emitted a forbidden or planned variant`,
    );
    for (const candidate of result.candidates) {
      assert.ok(candidate.coverage_count >= expected.min_coverage_count, `${journey.id} coverage fell below its literal floor`);
      assert.ok(expected.nutrition_grades.includes(candidate.nutrition_grade), `${journey.id} leaked an unexpected nutrition grade`);
    }
    const actualReasonCodes = new Set(resultUnused(result).map(item => item.reason_code));
    for (const reasonCode of expected.required_unused_reason_codes) {
      assert.ok(actualReasonCodes.has(reasonCode), `${journey.id} must explain ${reasonCode}`);
    }
  }
});

test('journey corpus exercises every public-ready and internal-calibration variant and the selector remains entirely local', () => {
  const exercised = new Set(journeyCorpus.journeys
    .filter(journey => journey.expect.status === 'ready')
    .map(journey => journey.expect.expected_first_variant));
  const active = catalog.families.flatMap(family => family.variants)
    .filter(row => ['preview_ready', 'calibration_preview'].includes(row.status))
    .map(row => row.variant_id);
  assert.deepEqual([...exercised].sort(), active.sort());
});

test('normalization reuses taxonomy aliases, deduplicates semantic duplicates, ignores default rice coverage, and preserves unknown input', () => {
  const normalized = normalize({
    servings: 2,
    pantry: ['大米', '白米', '鸡腿', '鸡腿肉', '土豆', '土豆', '火星菜', '火星菜'],
    dislikes: [],
  });

  assert.deepEqual(normalized.submitted_items.map(item => item.raw), ['鸡腿', '土豆', '火星菜']);
  assert.deepEqual(normalized.ignored_basic_items.map(item => item.raw), ['大米']);
  assert.deepEqual(normalized.duplicate_items.map(item => [item.raw, item.duplicate_of]), [
    ['白米', '大米'],
    ['鸡腿肉', '鸡腿'],
    ['土豆', '土豆'],
    ['火星菜', '火星菜'],
  ]);
  assert.deepEqual(normalized.unrecognized_items.map(item => item.raw), ['火星菜']);
});

test('rice input is a default basic item rather than a user-coverage item, and unknown input receives an explicit explanation', () => {
  const result = select({ servings: 2, pantry: ['大米', '鸡腿', '土豆', '火星菜'], dislikes: [] });
  assert.equal(result.status, 'ready');
  const candidate = result.candidates[0];
  assert.equal(candidate.variant_id, 'home-chicken-leg-potato-rice');
  assert.equal(candidate.submitted_count, 3);
  assert.equal(candidate.coverage_total, 3);
  assert.equal(candidate.coverage_count, 2);
  assert.equal(candidate.coverage_ratio, 2 / 3);
  assert.deepEqual(candidate.used_items.map(item => item.raw).sort(), ['土豆', '鸡腿']);
  assert.deepEqual(candidate.unused_items.map(item => [item.raw, item.reason_code]), [
    ['火星菜', 'unrecognized_ingredient'],
  ]);
});

test('only preview-ready variants may become candidates; planned Shanghai and Xinjiang records never leak into runtime selection', () => {
  const jiangnan = select({ servings: 2, pantry: ['青菜', '咸肉'], dislikes: [] });
  const xinjiang = select({ servings: 2, pantry: ['羊肉', '胡萝卜', '洋葱'], dislikes: [] });
  assert.equal(jiangnan.status, 'no_reliable_rice_meal');
  assert.equal(xinjiang.status, 'no_reliable_rice_meal');
  assert.deepEqual(jiangnan.candidates, []);
  assert.deepEqual(xinjiang.candidates, []);
});

test('beef tenderloin may fill an explicit generic-beef position but cannot fill brisket or ground-beef positions', () => {
  const fixture = fixtureCatalog([
    fixtureVariant({ variantId: 'generic-beef', ingredientIds: ['beef-generic', 'broccoli'] }),
    fixtureVariant({ variantId: 'brisket-beef', ingredientIds: ['beef-brisket', 'broccoli'] }),
    fixtureVariant({ variantId: 'ground-beef', ingredientIds: ['beef-ground', 'broccoli'] }),
  ]);
  const result = select({ servings: 2, pantry: ['牛里脊', '西兰花'], dislikes: [] }, { sourceCatalog: fixture });
  assert.equal(result.status, 'ready');
  assert.deepEqual(result.candidates.map(candidate => candidate.variant_id), ['generic-beef']);
  assert.deepEqual(result.candidates[0].used_items.map(item => item.canonical_id).sort(), ['beef-tenderloin', 'broccoli']);
});

test('controlled finish-only rice meals become selectable only with the calibrated drain and added-water contract', () => {
  const cases = [
    {
      pantry: ['豆腐', '白菜'],
      variant_id: 'home-cabbage-tofu-rice',
      used_canonical_ids: ['firm-tofu', 'napa-cabbage'],
    },
    {
      pantry: ['牛肉', '西兰花'],
      variant_id: 'home-broccoli-beef-rice',
      used_canonical_ids: ['beef-generic', 'broccoli'],
    },
    {
      pantry: ['牛里脊', '西兰花'],
      variant_id: 'home-broccoli-beef-rice',
      used_canonical_ids: ['beef-tenderloin', 'broccoli'],
    },
  ];
  for (const row of cases) {
    const result = select({ servings: 2, pantry: row.pantry, dislikes: [] });
    assert.equal(result.status, 'ready', row.variant_id);
    assert.equal(result.candidates[0].variant_id, row.variant_id);
    assert.deepEqual(
      result.candidates[0].used_items.map(item => item.canonical_id).sort(),
      [...row.used_canonical_ids].sort(),
    );
    assert.equal(variant(row.variant_id).status, 'preview_ready');
    assert.ok(
      result.candidates[0].execution_actions.pre_actions
        .some(action => action.action_code === 'pre_cook_tender_vegetables_drain_and_discard_liquid'),
      `${row.variant_id} must carry the controlled discard action into its candidate facts`,
    );
  }
  const calibrated = select({ servings: 2, pantry: ['猪肉末', '青菜'], dislikes: [] });
  assert.equal(calibrated.status, 'ready');
  assert.equal(calibrated.candidates[0].variant_id, 'home-greens-minced-pork-rice');
  assert.deepEqual(calibrated.candidates[0].used_items.map(item => item.canonical_id).sort(), ['ground-pork', 'leafy-greens']);
});

test('soft tofu and firm tofu never interchange without an explicit approved substitution', () => {
  const fixture = fixtureCatalog([
    fixtureVariant({ variantId: 'firm-tofu-rice', ingredientIds: ['firm-tofu', 'napa-cabbage'] }),
  ]);
  const soft = select({ servings: 2, pantry: ['嫩豆腐', '白菜'], dislikes: [] }, { sourceCatalog: fixture });
  const firm = select({ servings: 2, pantry: ['豆腐', '白菜'], dislikes: [] }, { sourceCatalog: fixture });
  assert.equal(soft.status, 'no_reliable_rice_meal');
  assert.deepEqual(soft.candidates, []);
  assert.equal(firm.status, 'ready');
  assert.deepEqual(firm.candidates.map(candidate => candidate.variant_id), ['firm-tofu-rice']);
});

test('a named chicken-leg rice meal never accepts chicken breast through a generic poultry slot', () => {
  const result = select({ servings: 2, pantry: ['鸡胸肉', '土豆'], dislikes: [] });
  assert.equal(result.status, 'no_reliable_rice_meal');
  assert.deepEqual(result.candidates, []);
  assert.ok(result.unused_items.some(item => item.raw === '鸡胸肉'));
});

test('unused-item reasons speak to a home cook instead of exposing catalog engineering terms', () => {
  const result = select({ servings: 2, pantry: ['鸡腿', '土豆', '胡萝卜', '番茄'], dislikes: [] });
  assert.equal(result.status, 'no_reliable_rice_meal');
  const reasons = result.unused_items.map(item => item.reason).join('\n');
  assert.doesNotMatch(reasons, /当前已激活目录|受控用料/);
  assert.match(reasons, /现有菜饭|这道菜饭/);
});

test('a B-grade variant must declare carb plus protein or fiber, not merely two arbitrary contributor roles', () => {
  const incompleteB = fixtureVariant({ variantId: 'protein-fiber-without-carb', ingredientIds: ['chicken-leg', 'potato'], grade: 'B' });
  incompleteB.nutrition_structure.material_contributors = [
    { role: 'protein', canonical_ingredient_id: 'chicken-leg' },
    { role: 'fiber', canonical_ingredient_id: 'potato' },
  ];
  const result = select({ servings: 2, pantry: ['鸡腿', '土豆'], dislikes: [] }, {
    sourceCatalog: fixtureCatalog([incompleteB]),
  });
  assert.equal(result.status, 'no_reliable_rice_meal');
  assert.deepEqual(result.candidates, []);
  assert.equal(result.best_available_candidate, undefined);
});

test('only current controlled starchy taxonomy identities enter the balance branch; carrot does not', () => {
  const carrot = select({ servings: 2, pantry: ['胡萝卜'], dislikes: [] });
  const sweetCorn = select({ servings: 2, pantry: ['甜玉米'], dislikes: [] });
  const potato = select({ servings: 2, pantry: ['土豆'], dislikes: [] });
  const starchyPair = select({ servings: 2, pantry: ['甜玉米', '土豆'], dislikes: [] });
  assert.equal(carrot.status, 'no_reliable_rice_meal');
  assert.equal(sweetCorn.status, 'needs_balance_input');
  assert.equal(potato.status, 'needs_balance_input');
  assert.equal(starchyPair.status, 'needs_balance_input');
  assert.deepEqual(carrot.candidates, []);
  assert.ok(carrot.unused_items.some(item => item.reason_code === 'not_in_active_catalog'));
});

test('an ordinary non-starchy one-of-two match stays no-reliable and preserves a diagnostic best candidate', () => {
  const fixture = fixtureCatalog([
    fixtureVariant({ variantId: 'chicken-only', ingredientIds: ['chicken-leg'], grade: 'B' }),
  ]);
  const result = select({ servings: 2, pantry: ['鸡腿', '番茄'], dislikes: [] }, { sourceCatalog: fixture });
  assert.equal(result.status, 'no_reliable_rice_meal');
  assert.deepEqual(result.candidates, []);
  assert.equal(result.best_available_candidate?.variant_id, 'chicken-only');
  assert.deepEqual(result.best_available_candidate?.used_items.map(item => item.raw), ['鸡腿']);
  assert.deepEqual(result.best_available_candidate?.unused_items.map(item => [item.raw, item.reason_code]), [
    ['番茄', 'limited_coverage'],
  ]);
  assert.deepEqual(result.unused_items.map(item => [item.raw, item.reason_code]), [
    ['番茄', 'limited_coverage'],
  ]);
});

test('one-of-two diagnostics run every partial through ratio and safety gates, prefer safe matches, and become unsafe only when all partial matches fail', () => {
  const unsafeFirst = fixtureVariant({ variantId: 'unsafe-first-partial', ingredientIds: ['chicken-leg'], grade: 'B' });
  unsafeFirst.ratio_rule_ids = [];
  const safeSecond = fixtureVariant({ variantId: 'safe-second-partial', ingredientIds: ['chicken-leg'], grade: 'B' });
  const request = { servings: 2, pantry: ['鸡腿', '番茄'], dislikes: [] };
  const firstUnsafe = select(request, { sourceCatalog: fixtureCatalog([unsafeFirst, safeSecond]) });
  const reversed = select(request, { sourceCatalog: fixtureCatalog([safeSecond, unsafeFirst]) });
  assert.equal(firstUnsafe.status, 'no_reliable_rice_meal');
  assert.equal(firstUnsafe.best_available_candidate?.variant_id, 'safe-second-partial');
  assert.equal(reversed.status, 'no_reliable_rice_meal');
  assert.equal(reversed.best_available_candidate?.variant_id, 'safe-second-partial');

  const unsafeAmount = fixtureVariant({ variantId: 'unsafe-amount-partial', ingredientIds: ['chicken-leg'], grade: 'B' });
  unsafeAmount.ingredients[0].amount_rule_id = null;
  const allUnsafe = select(request, { sourceCatalog: fixtureCatalog([unsafeFirst, unsafeAmount]) });
  assert.equal(allUnsafe.status, 'unsafe_recipe');
  assert.deepEqual(allUnsafe.safety_rejections.map(rejection => [rejection.variant_id, rejection.reason_code]), [
    ['unsafe-first-partial', 'ratio_rule_missing'],
    ['unsafe-amount-partial', 'material_amount_missing'],
  ]);
});

test('one-of-two diagnostic best candidate uses the formal stable rank, not catalog array order', () => {
  const genericSlow = fixtureVariant({
    variantId: 'generic-slow-partial',
    ingredientIds: ['chicken-leg'],
    grade: 'B',
    identityLevel: 'generic',
    adaptation: 'process_adaptation',
    activeTimeMinutes: 45,
  });
  const regionalFast = fixtureVariant({
    variantId: 'regional-fast-partial',
    ingredientIds: ['chicken-leg'],
    grade: 'B',
    identityLevel: 'regional',
    adaptation: 'direct_adaptation',
    activeTimeMinutes: 10,
  });
  const request = { servings: 2, pantry: ['鸡腿', '番茄'], dislikes: [] };
  const firstOrder = select(request, { sourceCatalog: fixtureCatalog([genericSlow, regionalFast]) });
  const reversedOrder = select(request, { sourceCatalog: fixtureCatalog([regionalFast, genericSlow]) });
  assert.equal(firstOrder.best_available_candidate?.variant_id, 'regional-fast-partial');
  assert.equal(reversedOrder.best_available_candidate?.variant_id, 'regional-fast-partial');
  assert.equal(firstOrder.best_available_candidate?.plan_id, reversedOrder.best_available_candidate?.plan_id);
});

test('a four-to-six-item request never emits a normal card that uses only one submitted ingredient', () => {
  const fixture = fixtureCatalog([
    fixtureVariant({ variantId: 'chicken-only', ingredientIds: ['chicken-leg'], grade: 'B' }),
  ]);
  const result = select({ servings: 2, pantry: ['鸡腿', '番茄', '香菇', '白菜'], dislikes: [] }, { sourceCatalog: fixture });
  assert.equal(result.status, 'no_reliable_rice_meal');
  assert.deepEqual(result.candidates, []);
});

test('four-to-six-item requests require a ceiling sixty-percent coverage floor', () => {
  const cases = [
    { submitted: ['鸡腿', '土豆', '胡萝卜', '番茄'], matched: ['chicken-leg', 'potato'], ready: false },
    { submitted: ['鸡腿', '土豆', '胡萝卜', '番茄'], matched: ['chicken-leg', 'potato', 'carrot'], ready: true },
    { submitted: ['鸡腿', '土豆', '胡萝卜', '番茄', '白菜'], matched: ['chicken-leg', 'potato'], ready: false },
    { submitted: ['鸡腿', '土豆', '胡萝卜', '番茄', '白菜'], matched: ['chicken-leg', 'potato', 'carrot'], ready: true },
    { submitted: ['鸡腿', '土豆', '胡萝卜', '番茄', '白菜', '香菇'], matched: ['chicken-leg', 'potato', 'carrot'], ready: false },
    { submitted: ['鸡腿', '土豆', '胡萝卜', '番茄', '白菜', '香菇'], matched: ['chicken-leg', 'potato', 'carrot', 'napa-cabbage'], ready: true },
  ];
  for (const row of cases) {
    const result = select({ servings: 2, pantry: row.submitted, dislikes: [] }, {
      sourceCatalog: fixtureCatalog([
        fixtureVariant({ variantId: `coverage-${row.submitted.length}-${row.matched.length}`, ingredientIds: row.matched }),
      ]),
    });
    assert.equal(result.status, row.ready ? 'ready' : 'no_reliable_rice_meal', `${row.matched.length}/${row.submitted.length}`);
    assert.equal(result.candidates.length > 0, row.ready, `${row.matched.length}/${row.submitted.length}`);
  }
});

test('a seven-plus request may select a controlled four-to-five-item meal without promising inventory clearance', () => {
  const fixture = fixtureCatalog([
    fixtureVariant({
      variantId: 'five-material-rice',
      ingredientIds: ['chicken-leg', 'potato', 'napa-cabbage', 'shiitake', 'carrot'],
      contributorIds: ['chicken-leg', 'napa-cabbage'],
    }),
  ]);
  const result = select({
    servings: 2,
    pantry: ['鸡腿', '土豆', '白菜', '香菇', '胡萝卜', '番茄', '鸡蛋'],
    dislikes: [],
  }, { sourceCatalog: fixture });
  assert.equal(result.status, 'ready');
  assert.equal(result.candidates[0].coverage_count, 5);
  assert.equal(result.candidates[0].submitted_count, 7);
  assert.deepEqual(result.candidates[0].unused_items.map(item => item.raw), ['番茄', '鸡蛋']);
});

test('project household test standards expose only controlled candidate notices', () => {
  const projectCases = [
    [['豆角', '排骨'], 'home-green-bean-pork-rib-rice'],
    [['香菇', '豆角', '排骨'], 'home-mushroom-green-bean-pork-rib-rice'],
    [['豆腐', '白菜'], 'home-cabbage-tofu-rice'],
    [['牛里脊', '西兰花'], 'home-broccoli-beef-rice'],
  ];
  for (const [pantry, variantId] of projectCases) {
    const two = select({ servings: 2, pantry, dislikes: [] }).candidates
      .find(row => row.variant_id === variantId);
    assert.deepEqual(two?.user_notices, [{
      code: 'household_test_pending_feedback',
      text: TEST_NOTICE,
    }]);
    assert.doesNotMatch(JSON.stringify(two.user_notices), /recipe-library|不宣称|人工批准/u);

    const four = select({ servings: 4, pantry, dislikes: [] }).candidates
      .find(row => row.variant_id === variantId);
    assert.deepEqual(four?.user_notices, [
      { code: 'household_test_pending_feedback', text: TEST_NOTICE },
      { code: 'four_serving_cooker_capacity_check', text: FOUR_SERVING_CAPACITY_NOTICE },
    ]);
  }

  for (const [pantry, matureVariant] of [
    [['鸡腿', '土豆'], 'home-chicken-leg-potato-rice'],
    [['鸡腿', '玉米', '胡萝卜'], 'home-corn-carrot-chicken-leg-rice'],
    [['猪肉末', '青菜'], 'home-greens-minced-pork-rice'],
    [['咸五花肉', '小白菜'], 'shanghai-salted-pork-rice'],
  ]) {
    const servings = matureVariant === 'shanghai-salted-pork-rice' ? 3 : 2;
    const candidate = select({ servings, pantry, dislikes: [] }).candidates
      .find(row => row.variant_id === matureVariant);
    assert.ok(candidate, matureVariant);
    assert.deepEqual(candidate.user_notices, []);
  }
});

test('a seven-plus request rejects a six-of-seven match instead of silently treating it as a valid coverage band', () => {
  const fixture = fixtureCatalog([
    fixtureVariant({
      variantId: 'six-material-rice',
      ingredientIds: ['chicken-leg', 'potato', 'napa-cabbage', 'shiitake', 'carrot', 'broccoli'],
      contributorIds: ['chicken-leg', 'napa-cabbage'],
    }),
  ]);
  const result = select({
    servings: 2,
    pantry: ['鸡腿', '土豆', '白菜', '香菇', '胡萝卜', '西兰花', '番茄'],
    dislikes: [],
  }, { sourceCatalog: fixture });
  assert.equal(result.status, 'no_reliable_rice_meal');
  assert.deepEqual(result.candidates, []);
  assert.equal(result.best_available_candidate, undefined);
  assert.equal(result.unused_items.length, 7, 'every submitted input remains explicitly accounted for');
});

test('the initial screen never pads the best coverage tier with weaker cards', () => {
  const coverageFixture = fixtureCatalog([
    fixtureVariant({ variantId: 'more-coverage-b', ingredientIds: ['chicken-leg', 'potato', 'carrot'], grade: 'B' }),
    fixtureVariant({ variantId: 'less-coverage-a', ingredientIds: ['pork-ribs', 'green-beans'], grade: 'A' }),
  ]);
  const coverageFirst = select({
    servings: 2,
    pantry: ['鸡腿', '土豆', '胡萝卜', '排骨', '豆角'],
    dislikes: [],
  }, { sourceCatalog: coverageFixture });
  assert.deepEqual(coverageFirst.candidates.map(candidate => candidate.variant_id), ['more-coverage-b']);

  const sixItemRequest = select({
    servings: 2,
    pantry: ['鸡腿', '土豆', '胡萝卜', '排骨', '豆角', '香菇'],
    dislikes: [],
  }, { sourceCatalog: fixtureCatalog([
    fixtureVariant({ variantId: 'four-of-six', ingredientIds: ['chicken-leg', 'potato', 'carrot', 'shiitake'], grade: 'B' }),
    fixtureVariant({ variantId: 'two-of-six', ingredientIds: ['pork-ribs', 'green-beans'], grade: 'A' }),
  ]) });
  assert.ok(sixItemRequest.candidates.length >= 1);
  assert.ok(sixItemRequest.candidates.every(candidate => candidate.coverage_count === 4));
});

test('stable sorting uses grade and recent history only inside the best coverage tier', () => {
  const request = { servings: 2, pantry: ['鸡腿', '土豆', '胡萝卜'], dislikes: [] };
  const fixture = fixtureCatalog([
    fixtureVariant({ variantId: 'alpha', ingredientIds: ['chicken-leg', 'potato'], grade: 'B' }),
    fixtureVariant({ variantId: 'beta', ingredientIds: ['chicken-leg', 'carrot'], grade: 'B' }),
  ]);
  const tiedInitial = select(request, { sourceCatalog: fixture });
  assert.deepEqual(tiedInitial.candidates.map(candidate => candidate.variant_id), ['alpha', 'beta']);
  const tiedHistory = select(request, {
    sourceCatalog: fixture,
    recentPlanIds: [tiedInitial.candidates[0].plan_id],
  });
  assert.deepEqual(tiedHistory.candidates.map(candidate => candidate.variant_id), ['beta', 'alpha']);
});

test('recent history cannot make the two-item rib rice outrank the three-item mushroom rib rice', () => {
  const request = { servings: 2, pantry: ['香菇', '豆角', '排骨'], dislikes: [] };
  const first = select(request);
  assert.deepEqual(first.candidates.map(candidate => candidate.variant_id), [
    'home-mushroom-green-bean-pork-rib-rice',
  ]);
  const withRecentBest = select(request, { recentPlanIds:[first.candidates[0].plan_id] });
  assert.deepEqual(withRecentBest.candidates.map(candidate => [candidate.variant_id, candidate.coverage_count]), [
    ['home-mushroom-green-bean-pork-rib-rice', 3],
  ]);
});

test('each tied card independently computes coverage from the original pantry instead of consuming a shared remainder', () => {
  const request = { servings: 2, pantry: ['鸡腿', '土豆', '胡萝卜'], dislikes: [] };
  const sourceCatalog = fixtureCatalog([
    fixtureVariant({ variantId: 'chicken-potato', ingredientIds: ['chicken-leg', 'potato'], grade: 'B' }),
    fixtureVariant({ variantId: 'chicken-carrot', ingredientIds: ['chicken-leg', 'carrot'], grade: 'B' }),
  ]);
  const result = select(request, { sourceCatalog });
  assert.deepEqual(Object.fromEntries(result.candidates.map(candidate => [candidate.variant_id, {
    coverage: [candidate.coverage_count, candidate.coverage_total],
    used: candidate.used_items.map(item => item.raw),
    unused: candidate.unused_items.map(item => item.raw),
  }])), {
    'chicken-potato': { coverage:[2, 3], used:['鸡腿', '土豆'], unused:['胡萝卜'] },
    'chicken-carrot': { coverage:[2, 3], used:['鸡腿', '胡萝卜'], unused:['土豆'] },
  });
});

test('the catalog identity enum ranks regional before household_reviewed before generic, before cooker adaptation burden', () => {
  const regional = fixtureVariant({
    variantId: 'regional-process',
    ingredientIds: ['chicken-leg', 'potato'],
    grade: 'B',
    identityLevel: 'regional',
    adaptation: 'process_adaptation',
  });
  const household = fixtureVariant({
    variantId: 'household-direct',
    ingredientIds: ['chicken-leg', 'potato'],
    grade: 'B',
    identityLevel: 'household_reviewed',
    adaptation: 'direct_adaptation',
  });
  const generic = fixtureVariant({
    variantId: 'generic-direct',
    ingredientIds: ['chicken-leg', 'potato'],
    grade: 'B',
    identityLevel: 'generic',
    adaptation: 'direct_adaptation',
  });
  const sourceCatalog = {
    schema_version: 1,
    catalog_version: 'identity-ranking-fixture-v1',
    families: [
      { family_id: 'regional-family', variants: [regional] },
      { family_id: 'household-family', variants: [household] },
      { family_id: 'generic-family', variants: [generic] },
    ],
  };
  const result = select({
    servings: 2,
    pantry: ['鸡腿', '土豆'],
    dislikes: [],
  }, { sourceCatalog });
  assert.equal(result.status, 'ready');
  assert.deepEqual(result.candidates.map(candidate => candidate.variant_id), [
    'regional-process',
    'household-direct',
    'generic-direct',
  ]);
});

test('candidate cards are structurally different and changing selection preserves a hard exclusion for only the current plan', () => {
  const request = { servings: 2, pantry: ['鸡腿', '土豆', '胡萝卜'], dislikes: [] };
  const sourceCatalog = fixtureCatalog([
    fixtureVariant({ variantId: 'chicken-potato', ingredientIds: ['chicken-leg', 'potato'], grade: 'B' }),
    fixtureVariant({ variantId: 'chicken-carrot', ingredientIds: ['chicken-leg', 'carrot'], grade: 'B' }),
  ]);
  const initial = select(request, { sourceCatalog });
  const [rib, chicken] = initial.candidates;
  assert.ok(
    rib.family_id !== chicken.family_id
      || rib.used_items.map(item => item.canonical_id).sort().join(',') !== chicken.used_items.map(item => item.canonical_id).sort().join(',')
      || rib.protein_variant_id !== chicken.protein_variant_id
      || rib.cooker_adaptation_level !== chicken.cooker_adaptation_level,
    'two cards must differ by family, material set, protein variant, or cooker burden',
  );
  const swapped = select({ ...request, current_plan_id: rib.plan_id }, { sourceCatalog });
  assert.equal(swapped.status, 'ready');
  assert.deepEqual(swapped.candidates.map(candidate => candidate.variant_id), [chicken.variant_id]);
  assert.ok(swapped.candidates.every(candidate => candidate.plan_id !== rib.plan_id));
});

test('swap never lowers pantry coverage and reports no alternative when only weaker plans remain', () => {
  const request = {
    servings: 2,
    pantry: ['鸡腿', '土豆', '排骨', '豆角', '香菇', '青菜'],
    dislikes: [],
  };
  const sourceCatalog = fixtureCatalog([
    fixtureVariant({ variantId: 'three-covered', ingredientIds: ['chicken-leg', 'potato', 'carrot'], grade: 'B' }),
    fixtureVariant({ variantId: 'two-covered', ingredientIds: ['pork-ribs', 'green-beans'], grade: 'A' }),
  ]);
  const adjustedRequest = { ...request, pantry: ['鸡腿', '土豆', '胡萝卜', '排骨', '豆角'] };
  const initial = select(adjustedRequest, { sourceCatalog });
  assert.equal(initial.status, 'ready');
  assert.equal(initial.candidates[0].variant_id, 'three-covered');
  assert.equal(initial.candidates[0].coverage_count, 3);
  assert.ok(initial.candidates.every(candidate => candidate.coverage_count === 3));

  const swapped = select({ ...adjustedRequest, current_plan_id: initial.candidates[0].plan_id }, { sourceCatalog });
  assert.equal(swapped.status, 'no_alternative_rice_meal');
  assert.equal(swapped.code, 'no_alternative_plan');
  assert.deepEqual(swapped.candidates, []);
  assert.equal(swapped.current_candidate.plan_id, initial.candidates[0].plan_id);
  assert.equal(swapped.current_candidate.coverage_count, 3);
});

test('a cooker-unsafe catalog match is rejected before it can become a candidate', () => {
  const unsafe = fixtureVariant({ variantId: 'unsafe-chicken-potato', ingredientIds: ['chicken-leg', 'potato'], grade: 'B' });
  unsafe.cooker_adaptation.requires_mid_cook_opening = true;
  const result = select({ servings: 2, pantry: ['鸡腿', '土豆'], dislikes: [] }, {
    sourceCatalog: fixtureCatalog([unsafe]),
  });
  assert.equal(result.status, 'unsafe_recipe');
  assert.deepEqual(result.candidates, []);
  assert.deepEqual(result.safety_rejections, [{
    reason_code: 'cooker_adaptation_incomplete',
    reason: '该菜饭的电饭煲流程不满足闭盖、完整完成的安全要求。',
    ingredient_ids: ['chicken-leg', 'potato'],
    variant_id: 'unsafe-chicken-potato',
  }]);
});

test('forbidden combinations inspect actual substitution assignments, not the replaced nominal target', () => {
  const substitution = [{
    replaces_canonical_id: 'carrot',
    allowed_canonical_ids: ['potato'],
  }];
  const nominalForbidden = fixtureVariant({
    variantId: 'carrot-to-potato-allowed',
    ingredientIds: ['chicken-leg', 'carrot'],
    grade: 'B',
    approvedSubstitutions: substitution,
    forbiddenCombinations: [{
      canonical_ingredient_ids: ['chicken-leg', 'carrot'],
      reason: '标称胡萝卜组合仅在未替换时禁止。',
    }],
  });
  const actualForbidden = fixtureVariant({
    variantId: 'carrot-to-potato-forbidden',
    ingredientIds: ['chicken-leg', 'carrot'],
    grade: 'B',
    approvedSubstitutions: substitution,
    forbiddenCombinations: [{
      canonical_ingredient_ids: ['chicken-leg', 'potato'],
      reason: '该夹具组合被目录明确禁止。',
    }],
  });
  const request = { servings: 2, pantry: ['鸡腿', '土豆'], dislikes: [] };
  const allowed = select(request, { sourceCatalog: fixtureCatalog([nominalForbidden]) });
  const rejected = select(request, { sourceCatalog: fixtureCatalog([actualForbidden]) });
  assert.equal(allowed.status, 'ready');
  assert.equal(allowed.candidates[0].variant_id, 'carrot-to-potato-allowed');
  assert.deepEqual(allowed.candidates[0].substitutions, [{
    target_canonical_id: 'carrot',
    input_canonical_id: 'potato',
    kind: 'approved_substitution',
  }]);
  assert.equal(rejected.status, 'unsafe_recipe');
  assert.deepEqual(rejected.candidates, []);
  assert.deepEqual(rejected.safety_rejections, [{
    reason_code: 'forbidden_combination',
    reason: '该夹具组合被目录明确禁止。',
    ingredient_ids: ['chicken-leg', 'potato'],
    variant_id: 'carrot-to-potato-forbidden',
  }]);
  assert.deepEqual(rejected.unused_items.map(item => [item.raw, item.reason_code]), [
    ['鸡腿', 'forbidden_combination'],
    ['土豆', 'forbidden_combination'],
  ]);
});

test('direct dislike preflight emits the same structured safety rejection contract', () => {
  const result = select({ servings: 2, pantry: ['鸡蛋', '鸡腿', '土豆'], dislikes: ['鸡蛋'] });
  assert.equal(result.status, 'unsafe_recipe');
  assert.deepEqual(result.safety_rejections, [{
    reason_code: 'allergen_conflict',
    reason: '这项食材与你设置的忌口冲突，不能进入菜饭推荐。',
    ingredient_ids: ['egg'],
    variant_id: null,
  }]);
});

test('direct 大豆 dislike preflight blocks tofu identities before candidate selection', () => {
  const tofu = select({ servings: 2, pantry: ['豆腐', '白菜'], dislikes: ['大豆'] });
  assert.equal(tofu.status, 'unsafe_recipe');
  assert.deepEqual(tofu.safety_rejections.map(row => row.ingredient_ids), [['firm-tofu']]);

  const friedTofu = select({
    servings: 2,
    pantry: ['鸡胸肉', '油炸豆腐', '牛蒡', '胡萝卜', '香菇'],
    dislikes: ['大豆'],
  }, { riceCatalogScope:'calibration' });
  assert.equal(friedTofu.status, 'unsafe_recipe');
  assert.ok(friedTofu.safety_rejections.some(row => row.ingredient_ids.includes('fried-tofu')));

});

test('controlled seasoning allergens are derived from taxonomy and fail closed before candidate selection', () => {
  const cases = [
    { seasoningId: 'oyster-sauce', dislike: '海鲜', allergenTags: ['贝类', '大豆', '小麦'] },
    { seasoningId: 'soy-sauce', dislike: '大豆', allergenTags: ['大豆', '小麦'] },
    { seasoningId: 'soy-sauce', dislike: '小麦', allergenTags: ['大豆', '小麦'] },
    { seasoningId: 'curry-block', dislike: '小麦', allergenTags: ['小麦', '奶', '大豆'] },
    { seasoningId: 'curry-block', dislike: '奶', allergenTags: ['小麦', '奶', '大豆'] },
    { seasoningId: 'curry-block', dislike: '大豆', allergenTags: ['小麦', '奶', '大豆'] },
    { seasoningId: 'sesame-oil', dislike: '芝麻', allergenTags: ['芝麻'] },
    { seasoningId: 'sesame-oil', dislike: '坚果', allergenTags: ['芝麻'] },
  ];
  for (const { seasoningId, dislike, allergenTags } of cases) {
    const seasonedVariant = fixtureVariant({
      variantId: `seasoning-conflict-${seasoningId}-${cases.indexOf(cases.find(row => row.seasoningId === seasoningId && row.dislike === dislike))}`,
      ingredientIds: ['chicken-leg', 'potato'],
      grade: 'B',
      controlledSeasonings: [{
        canonical_ingredient_id: seasoningId,
        amount_rule_id: 'fixture-controlled-seasoning-rule',
        required: true,
        phase: 'start_actions',
        action_code: 'add_controlled_seasoning_before_start',
      }],
    });
    const result = select(
      { servings: 2, pantry: ['鸡腿', '土豆'], dislikes: [dislike] },
      { sourceCatalog: fixtureCatalog([seasonedVariant]) },
    );
    assert.equal(result.status, 'unsafe_recipe', `${seasoningId} must reject ${dislike}`);
    assert.deepEqual(result.unsafe_reasons, ['seasoning_allergen_conflict']);
    assert.deepEqual(result.safety_rejections, [{
      reason_code: 'seasoning_allergen_conflict',
      reason: '这道菜饭的必需调味料与你设置的忌口冲突，已在候选阶段拦下。',
      ingredient_ids: [seasoningId],
      variant_id: seasonedVariant.variant_id,
      seasoning_canonical_id: seasoningId,
      allergen_tags: allergenTags,
      conflicting_dislikes: [dislike],
    }]);
  }
});

test('controlled seasonings are stable signed execution facts without inflating pantry coverage', () => {
  const seasoningRows = [
    {
      canonical_ingredient_id: 'soy-sauce',
      amount_rule_id: 'fixture-soy-sauce-rule',
      required: true,
      phase: 'start_actions',
      action_code: 'add_controlled_seasoning_before_start',
    },
    {
      canonical_ingredient_id: 'sesame-oil',
      amount_rule_id: 'fixture-sesame-oil-rule',
      required: true,
      phase: 'finish_actions',
      action_code: 'add_controlled_seasoning_after_cook',
    },
  ];
  const makeCatalog = rows => fixtureCatalog([fixtureVariant({
    variantId: 'signed-controlled-seasonings',
    ingredientIds: ['chicken-leg', 'potato'],
    grade: 'B',
    controlledSeasonings: rows,
  })]);
  const pantry = ['鸡腿', '土豆', '酱油', '料酒', '芝麻油', '蚝油', '咖喱块', '糖'];
  const first = select({ servings: 2, pantry, dislikes: [] }, {
    sourceCatalog: makeCatalog(seasoningRows),
  }).candidates[0];
  const reordered = select({ servings: 2, pantry, dislikes: [] }, {
    sourceCatalog: makeCatalog([...seasoningRows].reverse()),
  }).candidates[0];
  const withoutSeasonings = select({ servings: 2, pantry, dislikes: [] }, {
    sourceCatalog: makeCatalog([]),
  }).candidates[0];

  assert.equal(first.taxonomy_version, taxonomy.taxonomy_version);
  assert.match(first.taxonomy_hash, /^sha256:[0-9a-f]{64}$/u);
  assert.deepEqual(first.controlled_seasonings, [
    { ...seasoningRows[1], allergen_tags: ['芝麻'] },
    { ...seasoningRows[0], allergen_tags: ['大豆', '小麦'] },
  ]);
  assert.deepEqual(first.major_material_ids, ['raw-rice', 'chicken-leg', 'potato']);
  assert.deepEqual(first.execution_material_ids, [
    'raw-rice', 'chicken-leg', 'potato', 'sesame-oil', 'soy-sauce',
  ]);
  assert.deepEqual(first.selected_ingredient_ids, first.execution_material_ids);
  assert.deepEqual(first.selected_input_ids, ['chicken-leg', 'potato']);
  assert.equal(first.coverage_count, 2);
  assert.equal(first.coverage_total, 2);
  assert.equal(first.coverage_ratio, 1);
  assert.deepEqual(first.used_items.map(item => item.canonical_id), ['chicken-leg', 'potato']);
  assert.deepEqual(first.unused_items, []);
  assert.equal(first.plan_id, reordered.plan_id, 'catalog seasoning order is not semantic');
  assert.notEqual(first.plan_id, withoutSeasonings.plan_id, 'seasoning execution facts must be signed');

  const changedProfile = structuredClone(taxonomy);
  changedProfile.items.find(item => item.canonical_id === 'soy-sauce').allergen_tags.push('芝麻');
  const changedProfileCandidate = select({ servings: 2, pantry, dislikes: [] }, {
    sourceCatalog: makeCatalog(seasoningRows),
    sourceTaxonomy: changedProfile,
  }).candidates[0];
  assert.equal(changedProfileCandidate.taxonomy_version, taxonomy.taxonomy_version);
  assert.notEqual(first.taxonomy_hash, changedProfileCandidate.taxonomy_hash);
  assert.notEqual(first.plan_id, changedProfileCandidate.plan_id, 'allergen profile changes invalidate old plans');

  const changedVersion = structuredClone(taxonomy);
  changedVersion.taxonomy_version = `${taxonomy.taxonomy_version}-next`;
  const changedVersionCandidate = select({ servings: 2, pantry, dislikes: [] }, {
    sourceCatalog: makeCatalog(seasoningRows),
    sourceTaxonomy: changedVersion,
  }).candidates[0];
  assert.notEqual(first.plan_id, changedVersionCandidate.plan_id, 'taxonomy version changes invalidate old plans');
});

test('basic controlled seasonings entered by the user never count as major pantry coverage', () => {
  const normalized = normalize({
    servings: 2,
    pantry: ['鸡腿', '土豆', '酱油', '料酒', '芝麻油', '蚝油', '咖喱块', '糖'],
    dislikes: [],
  });
  assert.deepEqual(normalized.submitted_items.map(item => item.canonical_id), ['chicken-leg', 'potato']);
  assert.deepEqual(normalized.ignored_basic_items.map(item => item.canonical_id), [
    'soy-sauce', 'cooking-wine', 'sesame-oil', 'oyster-sauce', 'curry-block', 'sugar',
  ]);
});

test('candidate facts are a signed compiler handoff: name, material identities, ratio rule, actions, and recompute snapshot', () => {
  const compilerJourney = journeyCorpus.journeys.find(journey => journey.id === 'RM-15-selector-facts-for-compiler');
  assert.equal(compilerJourney?.contract_pending, undefined, 'RM-15 must execute its candidate-to-compiler contract');
  assert.ok(compilerJourney?.compiler_expect, 'RM-15 must state its reviewed compiler output');
  const result = select({ servings: 2, pantry: ['鸡腿', '土豆'], dislikes: [] });
  const candidate = result.candidates[0];
  assert.equal(result.status, 'ready');
  assert.equal(candidate.ratio_catalog_version, ratios.ratio_catalog_version);
  assert.match(candidate.ratio_facts_hash, /^sha256:[0-9a-f]{64}$/u);
  assert.deepEqual({
    variant_id: candidate.variant_id,
    display_name: candidate.display_name,
    name_label: candidate.name_label,
    nutrition_grade: candidate.nutrition_grade,
    plan_snapshot: candidate.plan_snapshot,
    selected_ingredient_ids: candidate.selected_ingredient_ids,
    ratio_rule_ids: candidate.ratio_rule_ids,
    pre_action_codes: candidate.execution_actions.pre_actions.map(action => action.action_code),
    start_action_codes: candidate.execution_actions.start_actions.map(action => action.action_code),
    finish_action_codes: candidate.execution_actions.finish_actions.map(action => action.action_code),
  }, {
    variant_id: 'home-chicken-leg-potato-rice',
    display_name: '鸡腿土豆焖饭',
    name_label: '家庭鸡腿焖饭',
    nutrition_grade: 'B',
    plan_snapshot: {
      catalog_version: catalog.catalog_version,
      rice_catalog_scope: 'ready',
      servings: 2,
      normalized_items: [
        { kind: 'recognized', canonical_id: 'chicken-leg', state: 'raw', shape_or_cut: 'leg' },
        { kind: 'recognized', canonical_id: 'potato', state: 'raw', shape_or_cut: null },
      ],
      available_basic_items: [],
      dislikes: [],
    },
    selected_ingredient_ids: ['raw-rice', 'chicken-leg', 'potato'],
    ratio_rule_ids: ['chicken-leg-potato-braised-rice-executable-v1'],
    pre_action_codes: ['rinse_raw_rice', 'cut_chicken_leg_to_small_pieces', 'prepare_vegetables'],
    start_action_codes: ['load_inner_pot', 'start_closed_lid_program'],
    finish_action_codes: ['rest_lid_closed', 'verify_safety_endpoints', 'fluff_and_serve'],
  });
});

test('the provisional candidate identity normalizes non-semantic arrays but preserves semantic action sequence', () => {
  const request = { servings: 2, pantry: ['鸡腿', '土豆'], dislikes: [] };
  const first = select(request).candidates[0];
  const same = select({ servings: 2, pantry: ['鸡腿肉', '马铃薯'], dislikes: [] }).candidates[0];
  const renamedCatalog = structuredClone(catalog);
  const renamed = renamedCatalog.families.flatMap(family => family.variants)
    .find(row => row.variant_id === 'home-chicken-leg-potato-rice');
  renamed.display_name = '不参与身份的临时展示文案';
  const renamedResult = select(request, { sourceCatalog: renamedCatalog }).candidates[0];
  const reorderedIngredientIdsCatalog = structuredClone(catalog);
  const reorderedIngredientIds = reorderedIngredientIdsCatalog.families.flatMap(family => family.variants)
    .find(row => row.variant_id === 'home-chicken-leg-potato-rice');
  reorderedIngredientIds.cooker_adaptation.start_actions[0].ingredient_ids.reverse();
  const reorderedIngredientIdsResult = select(request, { sourceCatalog: reorderedIngredientIdsCatalog }).candidates[0];
  const reorderedActionCatalog = structuredClone(catalog);
  const reorderedActions = reorderedActionCatalog.families.flatMap(family => family.variants)
    .find(row => row.variant_id === 'home-chicken-leg-potato-rice');
  const [firstPreAction, secondPreAction] = reorderedActions.cooker_adaptation.pre_actions;
  [firstPreAction.order, secondPreAction.order] = [secondPreAction.order, firstPreAction.order];
  const reorderedActionResult = select(request, { sourceCatalog: reorderedActionCatalog }).candidates[0];
  const substitutionVariant = fixtureVariant({
    variantId: 'two-substitutions',
    ingredientIds: ['chicken-leg', 'carrot', 'napa-cabbage'],
    grade: 'B',
    approvedSubstitutions: [
      { replaces_canonical_id: 'carrot', allowed_canonical_ids: ['potato'] },
      { replaces_canonical_id: 'napa-cabbage', allowed_canonical_ids: ['broccoli'] },
    ],
  });
  const substitutionCatalog = fixtureCatalog([substitutionVariant]);
  const reorderedSubstitutionCatalog = structuredClone(substitutionCatalog);
  reorderedSubstitutionCatalog.families[0].variants[0].approved_substitutions.reverse();
  const substitutionRequest = { servings: 2, pantry: ['鸡腿', '土豆', '西兰花'], dislikes: [] };
  const substitutionFirst = select(substitutionRequest, { sourceCatalog: substitutionCatalog }).candidates[0];
  const substitutionReordered = select(substitutionRequest, { sourceCatalog: reorderedSubstitutionCatalog }).candidates[0];
  const otherServings = select({ servings: 3, pantry: ['鸡腿', '土豆'], dislikes: [] }).candidates[0];
  assert.match(first.plan_id, /^sha256:[0-9a-f]{64}$/u);
  assert.equal(first.plan_id, same.plan_id);
  assert.equal(first.plan_id, renamedResult.plan_id);
  assert.equal(first.plan_id, reorderedIngredientIdsResult.plan_id);
  assert.notEqual(first.plan_id, reorderedActionResult.plan_id);
  assert.equal(substitutionFirst.plan_id, substitutionReordered.plan_id);
  assert.notEqual(first.plan_id, otherServings.plan_id);
});

test('the journey CLI enforces ready-candidate ordering and executes the compiler contract', () => {
  const run = spawnSync(process.execPath, ['tools/run-rice-meal-journeys.mjs'], {
    cwd: path.join(here, '../..'),
    encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  assert.match(run.stdout, /Rice meal journey gate: total=34 selector_passed=34 selector_failed=0 compiler_passed=1 compiler_failed=0/u);
  assert.match(run.stdout, /needs_balance_input: 1/u);
  assert.match(run.stdout, /no_reliable_rice_meal: 7/u);
  assert.match(run.stdout, /no_alternative_rice_meal: 1/u);
  assert.match(run.stdout, /ready: 22/u);
  assert.match(run.stdout, /unsafe_recipe: 3/u);
  assert.match(run.stdout, /RM-04-chicken-potato-b .*coverage=2\/2 grade=B/u);
  assert.match(run.stdout, /RM-15-selector-facts-for-compiler .*contract=passed/u);
  assert.match(run.stdout, /Candidate-to-compiler contract: passed=1 failed=0; executed by the journey gate\./u);
  assert.match(run.stdout, /RM-01-jiangnan-planned-only .*no_reliable_rice_meal .*not_in_active_catalog/u);
});

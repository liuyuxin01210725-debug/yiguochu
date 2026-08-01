import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const validatorModule = await import('../lib/rice-meal-catalog-validator.mjs').catch(error => ({ loadError: error }));

const context = {
  recipeLibrary: {
    recipes: [
      { id: 'known-recipe' },
      { id: 'banshan-wild-rice' },
      { id: 'daxi-lotus-leaf-oil-rice' },
      { id: 'cantonese-cured-meat-claypot-rice' },
      { id: 'cabbage-tofu-braised-rice' },
      { id: 'shanghai-salted-pork-vegetable-rice' },
    ],
  },
  taxonomy: {
    items: [
      {
        canonical_id: 'raw-rice',
        category: 'raw_rice',
        cooking_risk: { required_endpoint_codes: ['rice_tender'] },
      },
      {
        canonical_id: 'chicken-leg',
        category: 'chicken',
        cooking_risk: { required_endpoint_codes: ['poultry_fully_cooked'] },
      },
      {
        canonical_id: 'bok-choy',
        category: 'leafy_vegetable',
        cooking_risk: { required_endpoint_codes: [] },
      },
      {
        canonical_id: 'potato',
        category: 'root_vegetable',
        cooking_risk: { required_endpoint_codes: [] },
      },
      {
        canonical_id: 'shrimp',
        category: 'seafood',
        cooking_risk: { required_endpoint_codes: ['seafood_fully_cooked'] },
      },
      {
        canonical_id: 'firm-tofu',
        category: 'firm_tofu',
        cooking_risk: { required_endpoint_codes: ['heated_through'] },
      },
      {
        canonical_id: 'napa-cabbage',
        category: 'leafy_vegetable',
        cooking_risk: { required_endpoint_codes: [] },
      },
      {
        canonical_id: 'salted-pork-belly',
        category: 'pork',
        cooking_risk: { required_endpoint_codes: ['pork_fully_cooked'] },
      },
      {
        canonical_id: 'small-bok-choy',
        category: 'leafy_vegetable',
        cook_speed: 'fast',
        cooking_risk: { required_endpoint_codes: [] },
      },
    ],
  },
  ratioCatalog: {
    rules: [{
      rule_id: 'known-ratio',
      execution_mode: 'executable',
      when: { recipe_id: 'known-recipe' },
      liquid_contract: {
        kind: 'added_water',
        measurement: 'weigh_before_loading',
        display_precision: 'exact',
        display_rounding_grams: 1,
      },
      operations: [
        { operator: 'per_serving', target: { canonical_id: 'raw-rice' }, grams: { min: 100, default: 100, max: 100 } },
        { operator: 'per_serving', target: { canonical_id: 'chicken-leg' }, grams: { min: 100, default: 100, max: 100 } },
        { operator: 'per_serving', target: { canonical_id: 'bok-choy' }, grams: { min: 100, default: 100, max: 100 } },
        { operator: 'per_serving', target: { canonical_id: 'potato' }, grams: { min: 100, default: 100, max: 100 } },
        { operator: 'per_serving', target: { canonical_id: 'shrimp' }, grams: { min: 100, default: 100, max: 100 } },
        { operator: 'ratio', target: { name: '水', category: 'liquid' }, min: 1.4, default: 1.4, max: 1.4 },
      ],
    }, {
      rule_id: 'controlled-finish-ratio',
      execution_mode: 'executable',
      when: { recipe_id: 'cabbage-tofu-braised-rice' },
      liquid_contract: {
        kind: 'added_water',
        measurement: 'weigh_before_loading',
        display_precision: 'exact',
        display_rounding_grams: 1,
      },
      operations: [
        { operator: 'per_serving', target: { canonical_id: 'raw-rice' }, grams: { min: 100, default: 100, max: 100 } },
        { operator: 'per_serving', target: { canonical_id: 'firm-tofu' }, grams: { min: 60, default: 60, max: 60 } },
        { operator: 'per_serving', target: { canonical_id: 'napa-cabbage' }, grams: { min: 50, default: 50, max: 50 } },
        { operator: 'ratio', target: { name: '水', category: 'liquid' }, min: 1.3, default: 1.3, max: 1.3 },
      ],
    }, {
      rule_id: 'shanghai-mid-open-ratio',
      execution_mode: 'executable',
      when: { recipe_id: 'shanghai-salted-pork-vegetable-rice' },
      liquid_contract: {
        kind: 'added_water',
        measurement: 'weigh_before_loading',
        display_precision: 'approximate',
        display_rounding_grams: 10,
      },
      operations: [
        { operator: 'per_serving', target: { canonical_id: 'raw-rice' }, grams: { min: 100, default: 100, max: 100 } },
        { operator: 'per_serving', target: { canonical_id: 'salted-pork-belly' }, grams: { min: 50, default: 50, max: 50 } },
        { operator: 'per_serving', target: { canonical_id: 'small-bok-choy' }, grams: { min: 400 / 3, default: 400 / 3, max: 400 / 3 } },
        { operator: 'ratio', target: { name: '水', category: 'liquid' }, min: 31 / 30, default: 31 / 30, max: 31 / 30 },
      ],
    }],
  },
};

function clone(value) {
  return structuredClone(value);
}

function validCatalog() {
  return {
    schema_version: 1,
    catalog_version: 'rice-meal-catalog-v1-20260801-r6',
    families: [{
      family_id: 'closed-lid-rice-meal',
      variants: [{
        variant_id: 'closed-lid-chicken-rice',
        recipe_id: 'known-recipe',
        display_name: '鸡腿青菜焖饭',
        name_label: '家常电饭煲改编',
        review_note: '以项目菜谱中的固定食材、闭盖流程和安全终点为机器目录依据。',
        status: 'preview_ready',
        status_history: ['research_only', 'fact_checked', 'planned', 'preview_ready'],
        identity_level: 'regional',
        region_codes: ['CN-ZJ'],
        identity_refs: [{
          usage: 'identity',
          direct: true,
          source_kind: 'government',
          publisher: '文化和旅游部',
          retrieved_at: '2026-08-01',
          title: '鸡腿青菜焖饭的地方风味依据',
          url: 'https://www.gov.cn/identity',
        }],
        collection_candidate_id: 'household-chicken-rice',
        rice: {
          canonical_ingredient_id: 'raw-rice',
          amount_rule_id: 'known-ratio',
          action: 'closed_lid_cook',
        },
        ingredients: [
          {
            canonical_ingredient_id: 'chicken-leg',
            role: 'protein',
            amount_rule_id: 'known-ratio',
            action: 'closed_lid_cook',
          },
          {
            canonical_ingredient_id: 'bok-choy',
            role: 'fiber',
            amount_rule_id: 'known-ratio',
            action: 'closed_lid_cook',
          },
        ],
        approved_substitutions: [],
        forbidden_combinations: [],
        nutrition_structure: {
          grade: 'A',
          material_contributors: [
            { role: 'carb', canonical_ingredient_id: 'raw-rice' },
            { role: 'protein', canonical_ingredient_id: 'chicken-leg' },
            { role: 'fiber', canonical_ingredient_id: 'bok-choy' },
          ],
        },
        cooker_adaptation: {
          adaptation: 'direct_adaptation',
          closed_lid_continuation: true,
          requires_mid_cook_opening: false,
          completion_status: 'complete',
          pre_actions: [
            { order: 1, action_code: 'rinse_raw_rice', ingredient_ids: ['raw-rice'] },
            { order: 2, action_code: 'cut_chicken_leg_to_small_pieces', ingredient_ids: ['chicken-leg'] },
          ],
          start_actions: [
            { order: 1, action_code: 'load_inner_pot', ingredient_ids: ['raw-rice', 'chicken-leg', 'bok-choy'] },
            { order: 2, action_code: 'start_closed_lid_program', ingredient_ids: ['raw-rice', 'chicken-leg', 'bok-choy'] },
          ],
          finish_actions: [
            { order: 1, action_code: 'rest_lid_closed', ingredient_ids: ['raw-rice'] },
            { order: 2, action_code: 'verify_safety_endpoints', ingredient_ids: ['raw-rice', 'chicken-leg', 'bok-choy'] },
          ],
          program: 'standard_rice',
          active_time_minutes: 35,
          total_time_minutes: 45,
        },
        exclusion_flags: [],
        ratio_rule_ids: ['known-ratio'],
        safety_endpoints: [
          { canonical_ingredient_id: 'raw-rice', endpoint_code: 'rice_tender' },
          { canonical_ingredient_id: 'chicken-leg', endpoint_code: 'poultry_fully_cooked' },
        ],
        source_refs: [{ title: '家常电饭煲做法依据', url: 'https://example.com/source' }],
      }],
    }],
  };
}

function catalogCollection() {
  return {
    candidates: [{
      candidate_id: 'household-chicken-rice',
      name: '鸡腿青菜焖饭',
      core_ingredients: ['米', '鸡腿', '青菜'],
      core_ingredient_ids: ['raw-rice', 'chicken-leg', 'bok-choy'],
      runtime_name_aliases: ['鸡腿青菜焖饭'],
      nutrition_grade: 'A',
      status: 'runtime_ready',
    }],
    catalog_tracking: [{
      tracking_id: 'track-chicken',
      runtime_variant_id: 'closed-lid-chicken-rice',
      candidate_id: 'household-chicken-rice',
      core_ingredient_ids: ['raw-rice', 'chicken-leg', 'bok-choy'],
      nutrition_grade: 'A',
      status: 'runtime_ready',
      reverse_mapping_id: 'map-chicken',
    }],
    runtime_mappings: [{
      mapping_id: 'map-chicken',
      candidate_id: 'household-chicken-rice',
      tracking_id: 'track-chicken',
    }],
  };
}

function catalogWithCollection() {
  const catalog = validCatalog();
  return catalog;
}

function collectionForCatalog(catalog) {
  const variant = catalog.families[0].variants[0];
  const coreIngredientIds = [
    variant.rice.canonical_ingredient_id,
    ...variant.ingredients.map(item => item.canonical_ingredient_id),
  ];
  const status = variant.status === 'preview_ready' ? 'runtime_ready' : 'planned';
  return {
    candidates: [{
      candidate_id: variant.collection_candidate_id,
      name: variant.display_name,
      core_ingredients: ['受控测试食材'],
      core_ingredient_ids: coreIngredientIds,
      runtime_name_aliases: [variant.display_name],
      nutrition_grade: variant.nutrition_structure.grade,
      status,
    }],
    catalog_tracking: [{
      tracking_id: 'track-current',
      runtime_variant_id: variant.variant_id,
      candidate_id: variant.collection_candidate_id,
      core_ingredient_ids: coreIngredientIds,
      nutrition_grade: variant.nutrition_structure.grade,
      status,
      reverse_mapping_id: 'map-current',
    }],
    runtime_mappings: [{
      mapping_id: 'map-current',
      candidate_id: variant.collection_candidate_id,
      tracking_id: 'track-current',
    }],
  };
}

function controlledFinishCatalog() {
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.variant_id = 'home-cabbage-tofu-rice';
  variant.recipe_id = 'cabbage-tofu-braised-rice';
  variant.display_name = '白菜豆腐焖饭';
  variant.identity_level = 'household_reviewed';
  variant.region_codes = [];
  variant.identity_refs = [];
  variant.rice.amount_rule_id = 'controlled-finish-ratio';
  variant.ingredients = [
    {
      canonical_ingredient_id: 'firm-tofu',
      role: 'protein',
      amount_rule_id: 'controlled-finish-ratio',
      action: '随米饭从程序开始加热',
    },
    {
      canonical_ingredient_id: 'napa-cabbage',
      role: 'fiber',
      amount_rule_id: 'controlled-finish-ratio',
      action: '锅外熟制后保留，程序结束再拌入',
    },
  ];
  variant.nutrition_structure = {
    grade: 'A',
    material_contributors: [
      { role: 'carb', canonical_ingredient_id: 'raw-rice' },
      { role: 'protein', canonical_ingredient_id: 'firm-tofu' },
      { role: 'fiber', canonical_ingredient_id: 'napa-cabbage' },
    ],
  };
  variant.cooker_adaptation = {
    adaptation: 'process_adaptation',
    closed_lid_continuation: true,
    requires_mid_cook_opening: false,
    completion_status: 'complete',
    pre_actions: [
      { order: 1, action_code: 'rinse_raw_rice', ingredient_ids: ['raw-rice'] },
      { order: 2, action_code: 'pre_cook_tender_vegetables_outside_cooker', ingredient_ids: ['napa-cabbage'] },
    ],
    start_actions: [
      { order: 1, action_code: 'load_inner_pot', ingredient_ids: ['raw-rice', 'firm-tofu'] },
      { order: 2, action_code: 'start_closed_lid_program', ingredient_ids: ['raw-rice', 'firm-tofu'] },
    ],
    finish_actions: [
      { order: 1, action_code: 'rest_lid_closed', ingredient_ids: ['raw-rice'] },
      { order: 2, action_code: 'verify_safety_endpoints', ingredient_ids: ['raw-rice', 'firm-tofu', 'napa-cabbage'] },
      { order: 3, action_code: 'fold_in_pre_cooked_ingredients', ingredient_ids: ['napa-cabbage'] },
      { order: 4, action_code: 'fluff_and_serve', ingredient_ids: ['raw-rice', 'firm-tofu', 'napa-cabbage'] },
    ],
    program: 'standard_rice',
    active_time_minutes: 35,
    total_time_minutes: 35,
  };
  variant.ratio_rule_ids = ['controlled-finish-ratio'];
  variant.safety_endpoints = [
    { canonical_ingredient_id: 'raw-rice', endpoint_code: 'rice_tender' },
    { canonical_ingredient_id: 'firm-tofu', endpoint_code: 'heated_through' },
    { canonical_ingredient_id: 'napa-cabbage', endpoint_code: 'tender' },
  ];
  variant.exclusion_flags = [];
  return catalog;
}

function controlledMidOpenCatalog() {
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.variant_id = 'shanghai-salted-pork-rice';
  variant.recipe_id = 'shanghai-salted-pork-vegetable-rice';
  variant.display_name = '上海咸肉菜饭';
  variant.name_label = '普通电饭煲后段加青菜';
  variant.supported_servings = [3];
  variant.identity_level = 'regional';
  variant.region_codes = ['CN-SH'];
  variant.identity_refs = [{
    usage: 'identity',
    direct: true,
    source_kind: 'government',
    publisher: '上海市人民政府',
    retrieved_at: '2026-08-01',
    title: '上海乡村咸肉菜饭',
    url: 'https://www.shanghai.gov.cn/example',
  }];
  variant.rice.amount_rule_id = 'shanghai-mid-open-ratio';
  variant.ingredients = [
    {
      canonical_ingredient_id: 'salted-pork-belly',
      role: 'protein',
      amount_rule_id: 'shanghai-mid-open-ratio',
      action: '与米同煮',
    },
    {
      canonical_ingredient_id: 'small-bok-choy',
      role: 'fiber',
      amount_rule_id: 'shanghai-mid-open-ratio',
      action: '最后十分钟铺在饭面',
    },
  ];
  variant.nutrition_structure = {
    grade: 'A',
    material_contributors: [
      { role: 'carb', canonical_ingredient_id: 'raw-rice' },
      { role: 'protein', canonical_ingredient_id: 'salted-pork-belly' },
      { role: 'fiber', canonical_ingredient_id: 'small-bok-choy' },
    ],
  };
  variant.cooker_adaptation = {
    adaptation: 'process_adaptation',
    closed_lid_continuation: true,
    requires_mid_cook_opening: true,
    completion_status: 'complete',
    pre_actions: [
      { order: 1, action_code: 'rinse_raw_rice', ingredient_ids: ['raw-rice'] },
      { order: 2, action_code: 'prepare_raw_ingredients', ingredient_ids: ['salted-pork-belly'] },
      { order: 3, action_code: 'prepare_vegetables', ingredient_ids: ['small-bok-choy'] },
    ],
    start_actions: [
      { order: 1, action_code: 'load_inner_pot', ingredient_ids: ['raw-rice', 'salted-pork-belly'] },
      { order: 2, action_code: 'start_closed_lid_program', ingredient_ids: ['raw-rice', 'salted-pork-belly'] },
    ],
    mid_actions: [{
      order: 1,
      action_code: 'add_reserved_leafy_vegetable',
      ingredient_ids: ['small-bok-choy'],
      timing_basis: 'program_remaining_minutes',
      timing_min: 10,
      timing_max: 10,
      max_open_seconds: 30,
      placement: 'top_no_stir',
      resume_policy: 'same_program_auto_resume',
      required_post_close_minutes: 10,
    }],
    finish_actions: [
      { order: 1, action_code: 'rest_lid_closed', ingredient_ids: ['raw-rice'], rest_minutes: 5 },
      { order: 2, action_code: 'verify_safety_endpoints', ingredient_ids: ['raw-rice', 'salted-pork-belly', 'small-bok-choy'] },
      { order: 3, action_code: 'fluff_and_serve', ingredient_ids: ['raw-rice', 'salted-pork-belly', 'small-bok-choy'] },
    ],
    program: 'standard_rice',
    active_time_minutes: 15,
    total_time_minutes: 40,
  };
  variant.ratio_rule_ids = ['shanghai-mid-open-ratio'];
  variant.safety_endpoints = [
    { canonical_ingredient_id: 'raw-rice', endpoint_code: 'rice_tender' },
    { canonical_ingredient_id: 'salted-pork-belly', endpoint_code: 'pork_fully_cooked' },
    { canonical_ingredient_id: 'small-bok-choy', endpoint_code: 'tender' },
  ];
  variant.exclusion_flags = [];
  return catalog;
}

function validator() {
  assert.ok(!validatorModule.loadError, 'rice meal catalog validator module must exist');
  assert.equal(typeof validatorModule.validateRiceMealCatalog, 'function');
  assert.equal(typeof validatorModule.assertRiceMealCatalog, 'function');
  return validatorModule;
}

function validate(catalog, validationContext = context) {
  const nextContext = validationContext.collection
    ? validationContext
    : { ...validationContext, collection: collectionForCatalog(catalog) };
  return validator().validateRiceMealCatalog(catalog, nextContext);
}

function expectError(catalog, expected, validationContext = context) {
  assert.ok(validate(catalog, validationContext).some(error => error.includes(expected)), `expected error containing: ${expected}`);
}

test('accepts a complete closed-lid preview-ready catalog and returns it from the assertion API', () => {
  const catalog = validCatalog();
  assert.deepEqual(validate(catalog), []);
  assert.equal(validator().assertRiceMealCatalog(catalog, { ...context, collection: collectionForCatalog(catalog) }), catalog);
});

test('catalog validation fails closed when a collection dependency is absent', () => {
  assert.ok(
    validator().validateRiceMealCatalog(validCatalog(), context)
      .some(error => error.includes('collection dependency must be a valid collection object')),
  );
});

test('catalog variants require a bidirectional collection mapping', () => {
  const catalog = validCatalog();
  delete catalog.families[0].variants[0].collection_candidate_id;
  expectError(catalog, 'collection_candidate_id must be a non-empty collection candidate ID', {
    ...context,
    collection: catalogCollection(),
  });
});

test('catalog collection mapping rejects wrong candidate identity, materials, and non-runnable candidates', () => {
  const cases = [
    ['wrong candidate', catalog => { catalog.families[0].variants[0].collection_candidate_id = 'missing-candidate'; }, () => {}, 'references unknown collection candidate'],
    ['name identity', () => {}, (_catalog, collection) => { collection.candidates[0].name = '不相干的家庭焖饭'; collection.candidates[0].runtime_name_aliases = []; }, 'collection candidate name conflicts with display_name'],
    ['same suffix wrong locality', catalog => { catalog.families[0].variants[0].display_name = '新疆羊肉抓饭'; }, (_catalog, collection) => { collection.candidates[0].name = '广西羊肉抓饭'; collection.candidates[0].runtime_name_aliases = []; }, 'collection candidate name conflicts with display_name'],
    ['core materials', () => {}, (_catalog, collection) => { collection.catalog_tracking[0].core_ingredient_ids = ['raw-rice', 'chicken-leg']; }, 'collection core ingredient identities must match variant'],
    ['candidate core materials', () => {}, (_catalog, collection) => { collection.candidates[0].core_ingredient_ids = ['raw-rice', 'chicken-leg', 'shiitake']; }, 'collection candidate core ingredient identities must match variant'],
    ['nutrition C', () => {}, (_catalog, collection) => { collection.candidates[0].nutrition_grade = 'C'; }, 'cannot activate a nutrition grade C collection candidate'],
    ['excluded', () => {}, (_catalog, collection) => { collection.candidates[0].status = 'excluded'; }, 'cannot activate an excluded collection candidate'],
    ['planned to runtime ready', catalog => { const variant = catalog.families[0].variants[0]; variant.status = 'planned'; variant.status_history = ['research_only', 'fact_checked', 'planned']; }, (_catalog, collection) => { collection.catalog_tracking[0].status = 'planned'; }, 'planned must map to a planned collection candidate'],
  ];
  for (const [_label, mutateCatalog, mutateCollection, expected] of cases) {
    const catalog = catalogWithCollection();
    const collection = catalogCollection();
    mutateCatalog(catalog, collection);
    mutateCollection(catalog, collection);
    expectError(catalog, expected, { ...context, collection });
  }
});

test('preview-ready variants reject ambiguous liquid semantics', () => {
  const nextContext = clone(context);
  delete nextContext.ratioCatalog.rules[0].liquid_contract;
  expectError(validCatalog(), 'preview_ready requires explicit liquid contract semantics', nextContext);
});

test('accepts a blocked mid-open recipe only through the controlled outside-cook and finish-fold protocol', () => {
  const catalog = controlledFinishCatalog();
  assert.deepEqual(validate(catalog), []);
});

test('controlled finish-only adaptation rejects each missing protocol fact', () => {
  const mutations = [
    ['pre-cook', catalog => catalog.families[0].variants[0].cooker_adaptation.pre_actions.pop(), 'requires pre_cook_tender_vegetables_outside_cooker'],
    ['fold', catalog => catalog.families[0].variants[0].cooker_adaptation.finish_actions.splice(2, 1), 'requires fold_in_pre_cooked_ingredients'],
    ['endpoint', catalog => catalog.families[0].variants[0].safety_endpoints.pop(), 'finish-only ingredient requires a safety endpoint'],
    ['load', catalog => catalog.families[0].variants[0].cooker_adaptation.start_actions[0].ingredient_ids.push('napa-cabbage'), 'finish-only ingredient must stay out of load_inner_pot'],
  ];
  for (const [label, mutate, expected] of mutations) {
    const catalog = controlledFinishCatalog();
    mutate(catalog);
    expectError(catalog, expected);
  }
});

test('controlled finish-only adaptation rejects raw animal protein, egg, or seafood as the held-aside ingredient', () => {
  for (const [canonicalId, endpointCode] of [
    ['chicken-leg', 'poultry_fully_cooked'],
    ['shrimp', 'seafood_fully_cooked'],
  ]) {
    const catalog = controlledFinishCatalog();
    const variant = catalog.families[0].variants[0];
    variant.ingredients[1].canonical_ingredient_id = canonicalId;
    variant.nutrition_structure.material_contributors[2].canonical_ingredient_id = canonicalId;
    variant.cooker_adaptation.pre_actions[1].ingredient_ids = [canonicalId];
    variant.cooker_adaptation.finish_actions[2].ingredient_ids = [canonicalId];
    variant.safety_endpoints[2] = { canonical_ingredient_id: canonicalId, endpoint_code: endpointCode };
    expectError(catalog, 'finish-only ingredient cannot be raw animal protein, egg, or seafood');
  }
});

test('controlled finish-only adaptation rejects non-tender materials such as raw rice even when pre-cook and fold match', () => {
  const catalog = controlledFinishCatalog();
  const variant = catalog.families[0].variants[0];
  variant.cooker_adaptation.pre_actions[1].ingredient_ids = ['raw-rice'];
  variant.cooker_adaptation.finish_actions[2].ingredient_ids = ['raw-rice'];
  expectError(catalog, 'finish-only ingredient must be a controlled tender vegetable');
});

test('accepts only the source-locked Shanghai three-serving mid-cycle leafy protocol', () => {
  assert.deepEqual(validate(controlledMidOpenCatalog()), []);
});

test('controlled mid-cycle opening rejects unsupported servings, risky additions, load overlap, and protocol drift', () => {
  const mutations = [
    ['servings', catalog => { catalog.families[0].variants[0].supported_servings = [2, 3]; }, 'supported_servings must equal the reviewed batch [3]'],
    ['raw protein', catalog => { catalog.families[0].variants[0].cooker_adaptation.mid_actions[0].ingredient_ids = ['salted-pork-belly']; }, 'mid-cycle ingredient must be one fast leafy vegetable'],
    ['load overlap', catalog => { catalog.families[0].variants[0].cooker_adaptation.start_actions[0].ingredient_ids.push('small-bok-choy'); }, 'mid-cycle ingredient must stay out of load_inner_pot'],
    ['timing', catalog => { catalog.families[0].variants[0].cooker_adaptation.mid_actions[0].timing_min = 8; }, 'mid-cycle timing must be exactly ten remaining minutes'],
    ['opening', catalog => { catalog.families[0].variants[0].cooker_adaptation.mid_actions[0].max_open_seconds = 60; }, 'mid-cycle opening must close within 30 seconds'],
    ['resume', catalog => { catalog.families[0].variants[0].cooker_adaptation.mid_actions[0].resume_policy = 'restart_program'; }, 'mid-cycle action must resume the same program automatically'],
  ];
  for (const [label, mutate, expected] of mutations) {
    const catalog = controlledMidOpenCatalog();
    mutate(catalog);
    expectError(catalog, expected);
  }
});

test('rejects duplicate family and variant IDs', () => {
  const catalog = validCatalog();
  const duplicateFamily = clone(catalog.families[0]);
  duplicateFamily.variants[0].variant_id = 'another-variant';
  catalog.families.push(duplicateFamily);
  catalog.families[0].variants.push(clone(catalog.families[0].variants[0]));

  expectError(catalog, 'duplicate family id: closed-lid-rice-meal');
  expectError(catalog, 'duplicate variant id: closed-lid-chicken-rice');
});

test('rejects unresolved recipe, canonical ingredient, and ratio-rule references', () => {
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.recipe_id = 'missing-recipe';
  variant.ingredients[0].canonical_ingredient_id = 'missing-ingredient';
  variant.ratio_rule_ids = ['missing-ratio'];

  expectError(catalog, 'unknown recipe_id: missing-recipe');
  expectError(catalog, 'unknown canonical ingredient: missing-ingredient');
  expectError(catalog, 'unknown ratio rule: missing-ratio');
});

test('rejects a status that skips required promotion stages', () => {
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.status = 'production_approved';
  variant.status_history = ['research_only', 'production_approved'];

  expectError(catalog, 'status_history must progress one stage at a time');
});

test('rejects a missing display name and an unreferenced regional identity', () => {
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.display_name = '  ';
  variant.identity_refs = [];

  expectError(catalog, 'display_name must be a real non-empty name');
  expectError(catalog, 'regional identity requires at least one identity_ref');
});

test('rejects a not_suitable adaptation promoted to preview-ready', () => {
  const catalog = validCatalog();
  catalog.families[0].variants[0].cooker_adaptation.adaptation = 'not_suitable';

  expectError(catalog, 'not_suitable cooker_adaptation cannot be preview_ready or beyond');
});

test('rejects safety endpoints that name an invented taxonomy ingredient', () => {
  const catalog = validCatalog();
  catalog.families[0].variants[0].safety_endpoints.push({
    canonical_ingredient_id: 'invented-ingredient',
    endpoint_code: 'rice_tender',
  });

  expectError(catalog, 'safety_endpoints[2] unknown canonical ingredient: invented-ingredient');
});

test('rejects safety endpoints with codes outside the first-stage contract', () => {
  const catalog = validCatalog();
  catalog.families[0].variants[0].safety_endpoints.push({
    canonical_ingredient_id: 'raw-rice',
    endpoint_code: 'invented-endpoint',
  });

  expectError(catalog, 'safety_endpoints[2] endpoint_code is not allowed: invented-endpoint');
});

test('accepts an otherwise-valid shrimp variant with the controlled seafood endpoint', () => {
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.ingredients[0].canonical_ingredient_id = 'shrimp';
  variant.nutrition_structure.material_contributors[1].canonical_ingredient_id = 'shrimp';
  variant.safety_endpoints[1] = { canonical_ingredient_id: 'shrimp', endpoint_code: 'seafood_fully_cooked' };
  variant.cooker_adaptation.pre_actions[1] = {
    order: 2,
    action_code: 'prepare_raw_ingredients',
    ingredient_ids: ['shrimp'],
  };
  for (const action of [
    variant.cooker_adaptation.start_actions[0],
    variant.cooker_adaptation.start_actions[1],
    variant.cooker_adaptation.finish_actions[1],
  ]) {
    action.ingredient_ids = action.ingredient_ids.map(id => id === 'chicken-leg' ? 'shrimp' : id);
  }

  assert.deepEqual(validate(catalog), []);
});

test('rejects preview-ready variants carrying a controlled exclusion flag', () => {
  const catalog = validCatalog();
  catalog.families[0].variants[0].exclusion_flags = ['wild_mushroom'];

  expectError(catalog, 'exclusion_flags prevent preview_ready or higher status');
});

test('rejects unknown exclusion flags', () => {
  const catalog = validCatalog();
  catalog.families[0].variants[0].exclusion_flags = ['unknown-boundary'];

  expectError(catalog, 'exclusion_flags contains unknown value: unknown-boundary');
});

test('rejects a blocked wild-mushroom recipe even when it omits exclusion_flags', () => {
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.recipe_id = 'banshan-wild-rice';
  delete variant.exclusion_flags;

  expectError(catalog, 'exclusion_flags must match recipe_id derived risks: wild_mushroom');
  expectError(catalog, 'effective exclusion_flags prevent preview_ready or higher status');
});

for (const [flag, recipeId] of [
  ['wild_mushroom', 'banshan-wild-rice'],
  ['ceremonial_glutinous_rice', 'daxi-lotus-leaf-oil-rice'],
  ['requires_mid_cook_opening', 'cantonese-cured-meat-claypot-rice'],
]) {
  test(`rejects a preview-ready variant carrying the ${flag} risk`, () => {
    const catalog = validCatalog();
    const variant = catalog.families[0].variants[0];
    variant.recipe_id = recipeId;
    variant.exclusion_flags = [flag];

    expectError(catalog, 'effective exclusion_flags prevent preview_ready or higher status');
  });
}

test('rejects exclusion flags that disagree with the recipe-derived risk', () => {
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.recipe_id = 'banshan-wild-rice';
  variant.exclusion_flags = ['ceremonial_glutinous_rice'];

  expectError(catalog, 'exclusion_flags must match recipe_id derived risks: wild_mushroom');
});

test('rejects a regional claim backed only by a placeholder identity URL', () => {
  const catalog = validCatalog();
  catalog.families[0].variants[0].identity_refs[0].url = 'https://example.com/identity';

  expectError(catalog, 'regional identity requires at least one machine-verifiable identity_ref');
});

test('requires machine-verifiable identity evidence whenever region_codes are present', () => {
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.identity_level = 'generic';
  variant.identity_refs = [];

  expectError(catalog, 'region_codes require at least one machine-verifiable identity_ref');
});

test('rejects direct HTTPS identity references outside the trusted source suffix allowlist', () => {
  const catalog = validCatalog();
  catalog.families[0].variants[0].identity_refs[0].url = 'https://random-food-blog.example/identity';

  expectError(catalog, 'regional identity requires at least one machine-verifiable identity_ref');
});

test('rejects an identity reference without trusted source metadata', () => {
  const catalog = validCatalog();
  const ref = catalog.families[0].variants[0].identity_refs[0];
  ref.source_kind = 'blog';
  ref.publisher = '';
  ref.retrieved_at = '';

  expectError(catalog, 'source_kind must be government or institutional');
  expectError(catalog, 'publisher must be a non-empty string');
  expectError(catalog, 'retrieved_at must be a non-empty string');
});

test('allows a generic variant with no regional codes or identity references', () => {
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.identity_level = 'generic';
  variant.region_codes = [];
  variant.identity_refs = [];

  assert.deepEqual(validate(catalog), []);
});

test('accepts household-reviewed identity only when it carries no regional claim', () => {
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.identity_level = 'household_reviewed';
  variant.region_codes = [];
  variant.identity_refs = [];

  assert.deepEqual(validate(catalog), []);

  variant.region_codes = ['CN-ZJ'];
  expectError(catalog, 'household_reviewed must not declare region_codes');
});

test('rejects missing review basis and malformed closed-lid action protocol', () => {
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.review_note = '';
  variant.cooker_adaptation.pre_actions[0].order = 2;
  variant.cooker_adaptation.pre_actions[1].ingredient_ids = ['raw-rice'];
  variant.cooker_adaptation.start_actions[0].ingredient_ids = ['raw-rice', 'bok-choy'];
  variant.cooker_adaptation.start_actions[1].action_code = 'open_lid_mid_cycle';
  variant.cooker_adaptation.start_actions[1].ingredient_ids = ['raw-rice', 'bok-choy'];
  variant.cooker_adaptation.finish_actions[1].ingredient_ids = ['raw-rice'];
  variant.cooker_adaptation.program = 'two_cycle_rice';
  delete variant.cooker_adaptation.active_time_minutes;

  expectError(catalog, 'review_note must be a non-empty string');
  expectError(catalog, 'pre_actions must have contiguous order starting at 1');
  expectError(catalog, 'start_actions[1].action_code is not allowed');
  expectError(catalog, 'must reference every material ingredient across ordered actions');
  expectError(catalog, 'program is not allowed');
  expectError(catalog, 'active_time_minutes must be a positive integer');
});

test('rejects an A nutrition grade without carb, protein, and fiber material contributors', () => {
  const catalog = validCatalog();
  catalog.families[0].variants[0].nutrition_structure.material_contributors.pop();

  expectError(catalog, 'nutrition grade A requires carb, protein, and fiber material contributors');
});

test('rejects a B nutrition grade without two material roles', () => {
  const catalog = validCatalog();
  const nutrition = catalog.families[0].variants[0].nutrition_structure;
  nutrition.grade = 'B';
  nutrition.material_contributors = [{ role: 'carb', canonical_ingredient_id: 'raw-rice' }];

  expectError(catalog, 'nutrition grade B requires at least two material contributor roles');
});

test('rejects a grade C entry marked preview-ready', () => {
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.nutrition_structure.grade = 'C';
  variant.nutrition_structure.material_contributors = [{ role: 'carb', canonical_ingredient_id: 'raw-rice' }];

  expectError(catalog, 'nutrition grade C cannot be preview_ready');
});

test('rejects potato as a fiber contributor even when the grade A role list appears complete', () => {
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.ingredients[1].canonical_ingredient_id = 'potato';
  variant.nutrition_structure.material_contributors[2] = { role: 'fiber', canonical_ingredient_id: 'potato' };
  for (const actions of [
    variant.cooker_adaptation.start_actions,
    variant.cooker_adaptation.finish_actions,
  ]) {
    for (const action of actions) {
      action.ingredient_ids = action.ingredient_ids.map(id => id === 'bok-choy' ? 'potato' : id);
    }
  }

  expectError(catalog, 'role fiber is incompatible with potato (root_vegetable)');
});

test('rejects a major ingredient without both an amount rule and a cooker action', () => {
  const catalog = validCatalog();
  const ingredient = catalog.families[0].variants[0].ingredients[0];
  delete ingredient.amount_rule_id;
  ingredient.action = '';

  expectError(catalog, 'major ingredient must declare amount_rule_id');
  expectError(catalog, 'major ingredient must declare action');
});

test('preview-ready variants require recipe-bound executable quantity and liquid coverage', () => {
  const foreignContext = clone(context);
  foreignContext.ratioCatalog.rules.push({
    rule_id: 'foreign-bounds-ratio',
    execution_mode: 'bounds_only',
    when: { recipe_id: 'other-recipe' },
    operations: [
      { operator: 'reference_quantity', target: { canonical_id: 'raw-rice' }, grams: { min: 100, max: 100 } },
    ],
  });
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.rice.amount_rule_id = 'foreign-bounds-ratio';
  variant.ingredients[0].amount_rule_id = 'foreign-bounds-ratio';
  variant.ingredients[1].amount_rule_id = 'foreign-bounds-ratio';
  variant.ratio_rule_ids = ['foreign-bounds-ratio'];

  const undeclaredCatalog = validCatalog();
  undeclaredCatalog.families[0].variants[0].ingredients[0].amount_rule_id = 'foreign-bounds-ratio';
  expectError(undeclaredCatalog, 'amount_rule_id must be declared in ratio_rule_ids', foreignContext);
  expectError(catalog, 'must bind to recipe_id known-recipe', foreignContext);
  expectError(catalog, 'preview_ready ratio rule must be executable', foreignContext);
  expectError(catalog, 'does not quantify chicken-leg', foreignContext);
  expectError(catalog, 'does not quantify bok-choy', foreignContext);
  expectError(catalog, 'requires exactly one executable liquid operation', foreignContext);
});

test('planned variants use null rather than a rice-only rule for unquantified materials', () => {
  const boundsContext = clone(context);
  boundsContext.ratioCatalog.rules.push({
    rule_id: 'rice-only-bounds-ratio',
    execution_mode: 'bounds_only',
    when: { recipe_id: 'known-recipe' },
    operations: [
      { operator: 'reference_quantity', target: { canonical_id: 'raw-rice' }, grams: { min: 100, max: 100 } },
      { operator: 'ratio', target: { name: '水', category: 'liquid' }, min: 1.4, max: 1.4 },
    ],
  });
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.status = 'planned';
  variant.status_history = ['research_only', 'fact_checked', 'planned'];
  variant.review_note = '这两项主料尚未量化，不能据此生成可执行克数。';
  variant.ratio_rule_ids = ['rice-only-bounds-ratio'];
  variant.rice.amount_rule_id = 'rice-only-bounds-ratio';
  variant.ingredients[0].amount_rule_id = 'rice-only-bounds-ratio';
  variant.ingredients[1].amount_rule_id = null;

  expectError(catalog, 'does not quantify chicken-leg', boundsContext);

  variant.ingredients[0].amount_rule_id = null;
  assert.deepEqual(validate(catalog, boundsContext), []);
});

test('preview-ready substitutions require an independently executable substitution contract', () => {
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.approved_substitutions = [{
    replaces_canonical_id: 'bok-choy',
    allowed_canonical_ids: ['bok-choy'],
  }];

  expectError(catalog, 'preview_ready cannot declare approved_substitutions without an independently executable substitution contract');
});

test('preview-ready actions require one full load/start and endpoint verification', () => {
  const catalog = validCatalog();
  const adaptation = catalog.families[0].variants[0].cooker_adaptation;
  adaptation.start_actions = [
    { order: 1, action_code: 'load_inner_pot', ingredient_ids: ['raw-rice', 'bok-choy'] },
    { order: 2, action_code: 'load_inner_pot', ingredient_ids: ['raw-rice', 'chicken-leg', 'bok-choy'] },
    { order: 3, action_code: 'start_closed_lid_program', ingredient_ids: ['raw-rice', 'bok-choy'] },
    { order: 4, action_code: 'start_closed_lid_program', ingredient_ids: ['raw-rice', 'chicken-leg', 'bok-choy'] },
  ];
  adaptation.finish_actions[1].ingredient_ids = ['raw-rice'];

  expectError(catalog, 'preview_ready requires exactly one load_inner_pot action');
  expectError(catalog, 'preview_ready requires exactly one start_closed_lid_program action');
  expectError(catalog, 'load_inner_pot must cover every material ingredient');
  expectError(catalog, 'verify_safety_endpoints must cover every declared safety endpoint ingredient');
});

test('rejects poultry and seafood without their taxonomy safety endpoints', () => {
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.ingredients.push({
    canonical_ingredient_id: 'shrimp',
    role: 'protein',
    amount_rule_id: 'known-ratio',
    action: 'closed_lid_cook',
  });
  variant.safety_endpoints = [{ canonical_ingredient_id: 'raw-rice', endpoint_code: 'rice_tender' }];

  expectError(catalog, 'missing safety endpoint poultry_fully_cooked for chicken-leg');
  expectError(catalog, 'missing safety endpoint seafood_fully_cooked for shrimp');
});

test('rejects mid-cook opening, unknown fields, and incomplete preview entries', () => {
  const catalog = validCatalog();
  const variant = catalog.families[0].variants[0];
  variant.cooker_adaptation.requires_mid_cook_opening = true;
  variant.unreviewed_note = 'do not silently accept this';
  variant.cooker_adaptation.completion_status = 'incomplete';

  expectError(catalog, 'requires_mid_cook_opening must be false');
  expectError(catalog, 'unknown key unreviewed_note');
  expectError(catalog, 'preview_ready requires a complete cooker_adaptation');
});

test('recipe aggregate gate validates the catalog and reports its status counts', () => {
  const result = spawnSync(process.execPath, ['tools/check-recipes.mjs'], {
    cwd: new URL('../..', import.meta.url),
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /3 families · 11 variants · 4 preview_ready · 7 planned · rice meal catalog ok/);
});

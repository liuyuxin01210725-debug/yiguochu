import fs from 'node:fs';

const readText = name => fs.readFileSync(new URL(`../../data/${name}`, import.meta.url), 'utf8');

const SOURCE_TEXTS = Object.freeze({
  '/ingredient-taxonomy.v1.json': readText('ingredient-taxonomy.v1.json'),
  '/meal-templates.v2.json': readText('meal-templates.v2.json'),
  '/ratio-rules.v1.json': readText('ratio-rules.v1.json'),
  '/recipe-library.json': readText('recipe-library.json'),
  '/recipe-runtime.v1.json': readText('recipe-runtime.v1.json'),
  '/recipe-action-profiles.v1.json': readText('recipe-action-profiles.v1.json'),
  '/build-meta.json': JSON.stringify({
    buildId: 'recipe-runtime-task7-fixture',
    plannerRollout: 'direct-recommend',
    generationMode: 'deterministic',
  }),
});

const COMPLETE_SOURCE_CLAIMS = Object.freeze(
  ['identity', 'technique', 'ratio', 'seasoning', 'safety']
    .map(claim_type => Object.freeze({ claim_type, evidence_index: 0 })),
);

function perServing(canonical_id, state, grams, shape_or_cut = null) {
  return {
    operator: 'per_serving',
    target: { canonical_id, state, ...(shape_or_cut ? { shape_or_cut } : {}) },
    grams: { min: grams, default: grams, max: grams },
  };
}

function liquidRatio(canonical_id, state, resource, ratio, shape_or_cut = null) {
  return {
    operator: 'ratio',
    target: { name: '水', category: 'liquid' },
    numerator: { resource },
    denominator: {
      canonical_id,
      state,
      ...(shape_or_cut ? { shape_or_cut } : {}),
      measure: 'grams',
    },
    min: ratio,
    default: ratio,
    max: ratio,
  };
}

function executableRule(recipeId, ruleId, operations, extra = {}) {
  return {
    rule_id: ruleId,
    evidence_recipe_ids: [recipeId],
    execution_mode: 'executable',
    when: { recipe_id: recipeId },
    operations,
    ...extra,
    rounding: { grams_to_nearest: 1 },
    example_context: { ingredient_name: recipeId },
  };
}

const FIXTURE_DEFINITIONS = Object.freeze({
  'shanghai-salted-pork-vegetable-rice': {
    rule: executableRule('shanghai-salted-pork-vegetable-rice', 'task7-shanghai-executable-v1', [
      perServing('raw-rice', 'raw', 100),
      perServing('salted-pork-belly', 'cured', 50, 'cured_slice'),
      perServing('small-bok-choy', 'raw', 75),
      liquidRatio('raw-rice', 'raw', 'retained_liquid_grams', 1.3),
    ]),
    slot_assignment: {
      staple: ['raw-rice'], protein: ['salted-pork-belly'], fast_vegetable: ['small-bok-choy'],
    },
    technique_graph: [
      { phase: 1, action_code: 'start_cured_pork_and_rice', slot_ids: ['protein', 'staple'], fact_refs: [] },
      { phase: 2, action_code: 'add_locked_liquid', slot_ids: ['staple'], fact_refs: ['total_liquid_grams'] },
      { phase: 3, action_code: 'cook_rice_until_tender_before_late_greens', slot_ids: ['staple'], fact_refs: [] },
      { phase: 4, action_code: 'add_leafy_vegetable_late', slot_ids: ['fast_vegetable'], fact_refs: [] },
      {
        phase: 5, action_code: 'complete_recipe_safety', slot_ids: ['protein', 'staple'], fact_refs: [],
        safety_endpoint_codes: ['pork_fully_cooked', 'grain_tender_no_hard_center'],
      },
    ],
    seasoning_actions: [
      { action_code: 'taste_before_salt', amount_source: 'none' },
      { action_code: 'omit_extra_salt', amount_source: 'none' },
    ],
    safety_endpoints: [
      { endpoint_code: 'pork_fully_cooked', canonical_ids: ['salted-pork-belly'] },
      { endpoint_code: 'grain_tender_no_hard_center', canonical_ids: ['raw-rice'] },
    ],
  },
  'xinjiang-lamb-pilaf': {
    rule: executableRule('xinjiang-lamb-pilaf', 'task7-xinjiang-executable-v1', [
      perServing('raw-rice', 'raw', 100),
      perServing('lamb-leg', 'raw', 75, 'leg'),
      perServing('onion', 'raw', 50),
      perServing('carrot', 'raw', 75),
      liquidRatio('raw-rice', 'raw', 'retained_cooked_liquid_grams', 1.4),
      {
        operator: 'scale_by_servings', target: { name: '盐', category: 'seasoning' },
        grams: { min: 1, default: 1, max: 1 },
      },
    ]),
    slot_assignment: {
      staple: ['raw-rice'], protein: ['lamb-leg'], aromatic: ['onion'], slow_vegetable: ['carrot'],
    },
    technique_graph: [
      { phase: 1, action_code: 'brown_lamb_first', slot_ids: ['protein'], fact_refs: [] },
      { phase: 2, action_code: 'cook_onion_and_carrot', slot_ids: ['aromatic', 'slow_vegetable'], fact_refs: [] },
      {
        phase: 3, action_code: 'measure_retained_cooked_liquid', slot_ids: ['protein'],
        fact_refs: ['total_liquid_grams'], produces_resources: ['retained_cooked_liquid'], consumes_resources: [],
      },
      {
        phase: 4, action_code: 'add_raw_rice_to_retained_liquid', slot_ids: ['staple'], fact_refs: [],
        produces_resources: [], consumes_resources: ['retained_cooked_liquid'],
      },
      {
        phase: 5, action_code: 'braise_lamb_rice_until_done',
        slot_ids: ['protein', 'staple', 'slow_vegetable'], fact_refs: [],
      },
      {
        phase: 6, action_code: 'complete_recipe_safety',
        slot_ids: ['protein', 'staple', 'slow_vegetable'], fact_refs: [],
        safety_endpoint_codes: ['lamb_fully_cooked', 'grain_tender_no_hard_center', 'tender'],
      },
    ],
    seasoning_actions: [{ action_code: 'add_locked_salt', amount_source: 'ratio_default' }],
    safety_endpoints: [
      { endpoint_code: 'lamb_fully_cooked', canonical_ids: ['lamb-leg'] },
      { endpoint_code: 'grain_tender_no_hard_center', canonical_ids: ['raw-rice'] },
      { endpoint_code: 'tender', canonical_ids: ['carrot'] },
    ],
  },
  'taiwan-cabbage-mushroom-rice': {
    rule: executableRule('taiwan-cabbage-mushroom-rice', 'task7-taiwan-base-executable-v1', [
      perServing('raw-rice', 'raw', 100),
      perServing('green-cabbage', 'raw', 100),
      perServing('shiitake', 'raw', 50),
      liquidRatio('raw-rice', 'raw', 'retained_liquid_grams', 1.3),
    ]),
    slot_assignment: { staple: ['raw-rice'], mushroom: ['shiitake'], vegetable: ['green-cabbage'] },
    technique_graph: [
      {
        phase: 1, action_code: 'start_cabbage_mushroom_and_rice',
        slot_ids: ['staple', 'mushroom', 'vegetable'], fact_refs: [],
      },
      { phase: 2, action_code: 'add_locked_liquid', slot_ids: ['staple'], fact_refs: ['total_liquid_grams'] },
      {
        phase: 3, action_code: 'cook_cabbage_mushroom_rice',
        slot_ids: ['staple', 'mushroom', 'vegetable'], fact_refs: [],
      },
      {
        phase: 4, action_code: 'complete_recipe_safety', slot_ids: ['staple'], fact_refs: [],
        safety_endpoint_codes: ['grain_tender_no_hard_center'],
      },
    ],
    seasoning_actions: [
      { action_code: 'taste_before_salt', amount_source: 'none' },
      { action_code: 'omit_extra_salt', amount_source: 'none' },
    ],
    safety_endpoints: [
      { endpoint_code: 'grain_tender_no_hard_center', canonical_ids: ['raw-rice'] },
    ],
  },
  'north-china-green-bean-braised-noodles': {
    rule: executableRule('north-china-green-bean-braised-noodles', 'task7-north-china-executable-v1', [
      perServing('fresh-wheat-noodle', 'raw', 100, 'whole'),
      perServing('green-beans', 'raw', 90),
      perServing('ground-pork', 'raw', 80, 'ground'),
      liquidRatio('fresh-wheat-noodle', 'raw', 'retained_liquid_grams', 0.85, 'whole'),
    ], {
      liquid_distribution: {
        initial_fraction: 0.8,
        reserve_fraction: 0.2,
        reserve_action_code: 'add_reserved_liquid_if_needed',
      },
    }),
    slot_assignment: {
      staple: ['fresh-wheat-noodle'], vegetable: ['green-beans'], liquid: ['water'], protein: ['ground-pork'],
    },
    technique_graph: [
      { phase: 1, action_code: 'break_up_ground_pork', slot_ids: ['protein'], fact_refs: [] },
      {
        phase: 2, action_code: 'measure_add_initial_and_reserve_liquid', slot_ids: ['liquid'],
        fact_refs: ['initial_liquid_grams', 'reserve_liquid_grams'],
        produces_resources: ['reserved_liquid'], consumes_resources: [],
      },
      { phase: 3, action_code: 'simmer_pork_and_beans', slot_ids: ['protein', 'vegetable'], fact_refs: [] },
      { phase: 4, action_code: 'add_fresh_noodle', slot_ids: ['staple'], fact_refs: [] },
      {
        phase: 5, action_code: 'add_reserved_liquid_if_needed', slot_ids: ['liquid'],
        fact_refs: ['reserve_liquid_grams'], produces_resources: [], consumes_resources: ['reserved_liquid'],
      },
      {
        phase: 6, action_code: 'complete_recipe_safety',
        slot_ids: ['staple', 'protein', 'vegetable'], fact_refs: [],
        safety_endpoint_codes: ['pork_fully_cooked', 'bean_fully_cooked', 'noodle_tender'],
      },
    ],
    seasoning_actions: [{ action_code: 'omit_extra_salt', amount_source: 'none' }],
    safety_endpoints: [
      { endpoint_code: 'pork_fully_cooked', canonical_ids: ['ground-pork'] },
      { endpoint_code: 'bean_fully_cooked', canonical_ids: ['green-beans'] },
      { endpoint_code: 'noodle_tender', canonical_ids: ['fresh-wheat-noodle'] },
    ],
  },
});

function profileFor(entry) {
  const action_profile_id = `task7-${entry.recipe_id}-profile`;
  const profile_version = 'synthetic-fixture-v1';
  const instances = entry.technique_graph.map((step, index) => ({
    instance_id: `${entry.recipe_id}-step-${index + 1}`,
    action_code: step.action_code,
    slot_ids: [...(step.slot_ids || [])],
    fact_refs: [...(step.fact_refs || [])],
    produces_resources: [...(step.produces_resources || [])],
    consumes_resources: [...(step.consumes_resources || [])],
    safety_endpoint_codes: [...(step.safety_endpoint_codes || [])],
  }));
  entry.action_profile_ref = { action_profile_id, profile_version };
  return {
    action_profile_id,
    profile_version,
    instances,
    execution_sequence: instances.map(instance => instance.instance_id),
  };
}

export function recipeRuntimeJourneyFixtureTexts() {
  const ratios = JSON.parse(SOURCE_TEXTS['/ratio-rules.v1.json']);
  const runtime = JSON.parse(SOURCE_TEXTS['/recipe-runtime.v1.json']);
  const actionProfiles = JSON.parse(SOURCE_TEXTS['/recipe-action-profiles.v1.json']);

  for (const [recipeId, definition] of Object.entries(FIXTURE_DEFINITIONS)) {
    ratios.rules.push(structuredClone(definition.rule));
    const entry = runtime.entries.find(candidate => candidate.recipe_id === recipeId);
    entry.activation_status = 'preview_enabled';
    entry.slot_assignment = structuredClone(definition.slot_assignment);
    entry.ratio_rule_ids = [definition.rule.rule_id];
    entry.ratio_default_rule_id = definition.rule.rule_id;
    entry.technique_graph = structuredClone(definition.technique_graph);
    entry.identity_signature.identity_critical_action_sequence = entry.technique_graph.map(step => step.action_code);
    entry.approved_variants = [];
    entry.seasoning_actions = structuredClone(definition.seasoning_actions);
    entry.safety_endpoints = structuredClone(definition.safety_endpoints);
    entry.source_claims = structuredClone(COMPLETE_SOURCE_CLAIMS);
    entry.household_trial = {
      status: 'completed',
      trial_date: '2026-07-30',
      reviewer: 'synthetic-task7-test-fixture-not-a-real-household-trial',
      outcome: 'passed',
    };
    actionProfiles.profiles.push(profileFor(entry));
  }

  return Object.freeze({
    ...SOURCE_TEXTS,
    '/ratio-rules.v1.json': JSON.stringify(ratios),
    '/recipe-runtime.v1.json': JSON.stringify(runtime),
    '/recipe-action-profiles.v1.json': JSON.stringify(actionProfiles),
  });
}

export function recipeRuntimeMatcherFixtureAssets() {
  const texts = recipeRuntimeJourneyFixtureTexts();
  return {
    taxonomy: JSON.parse(texts['/ingredient-taxonomy.v1.json']),
    templates: JSON.parse(texts['/meal-templates.v2.json']),
    ratios: JSON.parse(texts['/ratio-rules.v1.json']),
    recipes: JSON.parse(texts['/recipe-library.json']),
    recipeRuntime: JSON.parse(texts['/recipe-runtime.v1.json']),
    actionProfiles: JSON.parse(texts['/recipe-action-profiles.v1.json']),
  };
}

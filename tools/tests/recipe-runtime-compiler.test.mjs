import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  buildDeterministicGeneratedPlan,
  buildGeneratedPlanResponse,
  buildIngredientTermUniverse,
  buildLockedPlanContract,
  validateGeneratedPlan,
} from '../../worker/src/generated-plan-contract.js';
import { compileRatioPlan, computePlanId, planMealWithIdentity } from '../../worker/src/planner-v2.js';
import { prepareRatioCatalog } from '../../worker/src/ratio-dsl.js';
import { validateRecipeRuntimeCatalog } from '../../worker/src/recipe-runtime-validator.js';
import { materializeNamedPlanFacts } from '../../worker/src/recipe-runtime-compiler.js';
import { RECIPE_ACTION_REGISTRY, RECIPE_SAFETY_EVIDENCE_REGISTRY } from '../../worker/src/recipe-action-registry.js';
import * as recipeActionRegistry from '../../worker/src/recipe-action-registry.js';
import { validateRecipeActionProfileCatalog } from '../../worker/src/recipe-action-profile-validator.js';

const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const productionAssets = {
  taxonomy: readJson('ingredient-taxonomy.v1.json'),
  templates: readJson('meal-templates.v2.json'),
  ratios: readJson('ratio-rules.v1.json'),
  recipes: readJson('recipe-library.json'),
  recipeRuntime: readJson('recipe-runtime.v1.json'),
  actionProfiles: readJson('recipe-action-profiles.v1.json'),
};
let profileFixtureCounter = 0;
const profileFixtures = new Map();

function namedPresentation(recipeId, title) {
  return {
    badge: '依据菜谱',
    title,
    subtitle: '按已核验菜谱的用料、比例与熟制顺序呈现。',
    source_label: '查看一锅出标准配方',
    canonical_path: `/recipes.html?id=${recipeId}`,
  };
}

function reviewedVariantPresentation(recipeId, title) {
  return {
    badge: '菜谱替换版',
    title,
    subtitle: '采用已复核的食材替换，并以菜谱替换版呈现。',
    source_label: '查看一锅出标准配方',
    canonical_path: `/recipes.html?id=${recipeId}`,
  };
}

function request(preferUse, servings = 2) {
  return {
    schema_version: 2,
    planner_version: 'pantry-planner-v2',
    mode: 'recommend',
    intent: 'normal',
    servings,
    must_use: [],
    prefer_use: preferUse,
    dislikes: [],
    current_plan_id: null,
    recent_plan_ids: [],
    decision: null,
  };
}

async function namedPlannerResult(preferUse, identity) {
  const planned = await planMealWithIdentity(productionAssets, request(preferUse));
  assert.equal(planned.status, 'ready');
  assert.equal(planned.plan.pots.length, 1);
  const named = {
    ...planned,
    recipe_runtime_catalog_version: productionAssets.recipeRuntime.recipe_runtime_catalog_version,
    plan_source: identity.plan_source,
    recipe_id: identity.recipe_id,
    variant_id: identity.variant_id ?? null,
    identity_level: identity.identity_level,
    presentation: structuredClone(identity.presentation),
  };
  named.plan.plan_id = await computePlanId(named);
  return named;
}

async function taiwanPlannerResult(identity) {
  const planned = await planMealWithIdentity(productionAssets, request(['大米', '卷心菜', '香菇']));
  assert.equal(planned.status, 'ready');
  const pot = planned.plan.pots[0];
  pot.template_id = 'mushroom-aroma-rice-pot';
  pot.slot_assignment.vegetable = pot.slot_assignment.fast_vegetable;
  delete pot.slot_assignment.fast_vegetable;
  const named = {
    ...planned,
    recipe_runtime_catalog_version: productionAssets.recipeRuntime.recipe_runtime_catalog_version,
    ...identity,
  };
  named.plan.plan_id = await computePlanId(named);
  return named;
}

function executableRule({
  recipeId, ruleId, ingredients, liquidRatio, liquidResource = 'retained_liquid_grams', includeSalt = false,
}) {
  return {
    rule_id: ruleId,
    evidence_recipe_ids: [recipeId],
    execution_mode: 'executable',
    when: { recipe_id: recipeId },
    operations: [
      ...ingredients.map(ingredient => ({
        operator: 'per_serving',
        target: {
          canonical_id: ingredient.canonical_id,
          state: ingredient.state,
          ...(ingredient.shape_or_cut ? { shape_or_cut: ingredient.shape_or_cut } : {}),
        },
        grams: { min: ingredient.grams, default: ingredient.grams, max: ingredient.grams },
      })),
      {
        operator: 'ratio',
        target: { name: '水', category: 'liquid' },
        numerator: { resource: liquidResource },
        denominator: { canonical_id: 'raw-rice', state: 'raw', measure: 'grams' },
        min: liquidRatio,
        default: liquidRatio,
        max: liquidRatio,
      },
      ...(includeSalt ? [{
        operator: 'scale_by_servings',
        target: { name: '盐', category: 'seasoning' },
        grams: { min: 1, default: 1, max: 1 },
      }] : []),
    ],
    rounding: { grams_to_nearest: 1 },
    example_context: { ingredient_name: ingredients[0].canonical_id },
  };
}

function preparedRatios(...rules) {
  const ratios = structuredClone(productionAssets.ratios);
  ratios.rules.push(...rules);
  const prepared = prepareRatioCatalog(ratios, productionAssets);
  assert.equal(prepared.ok, true, prepared.errors?.join('\n'));
  return prepared.catalog;
}

function promotedEntry(recipeId, patch) {
  const runtime = structuredClone(productionAssets.recipeRuntime);
  const entry = runtime.entries.find(candidate => candidate.recipe_id === recipeId);
  Object.assign(entry, structuredClone(patch), {
    activation_status: 'preview_enabled',
    source_claims: ['identity', 'technique', 'ratio', 'seasoning', 'safety']
      .map(claim_type => ({ claim_type, evidence_index: 0 })),
    household_trial: {
      status: 'completed', trial_date: '2026-07-30', reviewer: 'test-fixture-reviewer', outcome: 'passed',
    },
  });
  entry.identity_signature.identity_critical_action_sequence = entry.technique_graph.map(action => action.action_code);
  const actionProfiles = actionProfileCatalog(entry, `v1-${++profileFixtureCounter}`);
  entry.action_profile_ref = {
    action_profile_id: actionProfiles.profiles[0].action_profile_id,
    profile_version: actionProfiles.profiles[0].profile_version,
  };
  profileFixtures.set(`${entry.action_profile_ref.action_profile_id}\0${entry.action_profile_ref.profile_version}`,
    structuredClone(actionProfiles.profiles[0]));
  return { runtime, entry };
}

function profilesFor(runtime) {
  return {
    action_profile_catalog_version: 'recipe-action-profiles-v1-20260731-r1',
    profiles: runtime.entries.flatMap(entry => {
      const ref = entry.action_profile_ref;
      if (!ref) return [];
      const profile = profileFixtures.get(`${ref.action_profile_id}\0${ref.profile_version}`);
      return profile ? [structuredClone(profile)] : [];
    }),
  };
}

async function materializedNamed(planned, runtime, ratios) {
  const entry = runtime.entries.find(candidate => candidate.recipe_id === planned.recipe_id);
  const recipe = productionAssets.recipes.recipes.find(candidate => candidate.id === planned.recipe_id);
  const materialized = materializeNamedPlanFacts(planned, entry, ratios, recipe, profilesFor(runtime));
  materialized.plan.plan_id = await computePlanId(materialized);
  return materialized;
}

const namedCompiler = (planned, runtime, ratios) => buildLockedPlanContract(
  planned, productionAssets.templates, runtime, ratios, productionAssets.recipes, profilesFor(runtime),
);

function actionProfileCatalog(entry, suffix = 'v1') {
  const action_profile_id = `test-${entry.recipe_id}-profile`;
  const profile_version = suffix;
  const instances = entry.technique_graph.map((action, index) => ({
    instance_id: `step-${index + 1}`,
    action_code: action.action_code,
    slot_ids: [...(action.slot_ids || [])],
    fact_refs: [...(action.fact_refs || [])],
    produces_resources: [...(action.produces_resources || [])],
    consumes_resources: [...(action.consumes_resources || [])],
    safety_endpoint_codes: [...(action.safety_endpoint_codes || [])],
  }));
  return {
    action_profile_catalog_version: 'recipe-action-profiles-v1-20260731-r1',
    profiles: [{
      action_profile_id,
      profile_version,
      instances,
      execution_sequence: instances.map(instance => instance.instance_id),
    }],
  };
}

function independentProfileFixture(makeFixture, rule) {
  const { runtime, entry } = makeFixture();
  const profiles = actionProfileCatalog(entry);
  entry.action_profile_ref = {
    action_profile_id: profiles.profiles[0].action_profile_id,
    profile_version: profiles.profiles[0].profile_version,
  };
  delete entry.identity_signature.identity_critical_action_sequence;
  entry.technique_graph = [];
  return { runtime, entry, profiles, ratios: preparedRatios(rule) };
}

function profileWithoutAction(profiles, actionCode) {
  const missing = structuredClone(profiles);
  const instance = missing.profiles[0].instances.find(row => row.action_code === actionCode);
  assert.ok(instance, `fixture action ${actionCode} must exist`);
  missing.profiles[0].instances = missing.profiles[0].instances
    .filter(row => row.instance_id !== instance.instance_id);
  missing.profiles[0].execution_sequence = missing.profiles[0].execution_sequence
    .filter(instanceId => instanceId !== instance.instance_id);
  return missing;
}

function assertCoherentFixture(runtime, ratioCatalog) {
  assert.deepEqual(validateRecipeRuntimeCatalog(runtime, {
    ...productionAssets,
    ratios: ratioCatalog,
    actionProfiles: profilesFor(runtime),
  }), []);
}

const shanghaiRule = executableRule({
  recipeId: 'shanghai-salted-pork-vegetable-rice',
  ruleId: 'test-fixture-shanghai-executable-v1',
  ingredients: [
    { canonical_id: 'raw-rice', state: 'raw', grams: 100 },
    { canonical_id: 'salted-pork-belly', state: 'cured', shape_or_cut: 'cured_slice', grams: 50 },
    { canonical_id: 'small-bok-choy', state: 'raw', grams: 75 },
  ],
  liquidRatio: 1.3,
});

const xinjiangRule = executableRule({
  recipeId: 'xinjiang-lamb-pilaf',
  ruleId: 'test-fixture-xinjiang-executable-v1',
  ingredients: [
    { canonical_id: 'raw-rice', state: 'raw', grams: 100 },
    { canonical_id: 'lamb-leg', state: 'raw', shape_or_cut: 'leg', grams: 75 },
    { canonical_id: 'onion', state: 'raw', grams: 50 },
    { canonical_id: 'carrot', state: 'raw', grams: 75 },
  ],
  liquidRatio: 1.4,
  liquidResource: 'retained_cooked_liquid_grams',
  includeSalt: true,
});

const taiwanBaseRule = executableRule({
  recipeId: 'taiwan-cabbage-mushroom-rice',
  ruleId: 'test-fixture-taiwan-base-executable-v1',
  ingredients: [
    { canonical_id: 'raw-rice', state: 'raw', grams: 100 },
    { canonical_id: 'green-cabbage', state: 'raw', grams: 100 },
    { canonical_id: 'shiitake', state: 'raw', grams: 50 },
  ],
  liquidRatio: 1.3,
});

const northChinaRule = {
  rule_id: 'test-fixture-north-china-executable-v1',
  evidence_recipe_ids: ['north-china-green-bean-braised-noodles'],
  execution_mode: 'executable',
  when: { recipe_id: 'north-china-green-bean-braised-noodles' },
  operations: [
    {
      operator: 'per_serving',
      target: { canonical_id: 'fresh-wheat-noodle', state: 'raw', shape_or_cut: 'whole' },
      grams: { min: 100, default: 100, max: 100 },
    },
    {
      operator: 'per_serving',
      target: { canonical_id: 'green-beans', state: 'raw' },
      grams: { min: 90, default: 90, max: 90 },
    },
    {
      operator: 'per_serving',
      target: { canonical_id: 'ground-pork', state: 'raw', shape_or_cut: 'ground' },
      grams: { min: 80, default: 80, max: 80 },
    },
    {
      operator: 'ratio', target: { name: '水', category: 'liquid' },
      numerator: { resource: 'retained_liquid_grams' },
      denominator: { canonical_id: 'fresh-wheat-noodle', state: 'raw', measure: 'grams' },
      min: 0.85, default: 0.85, max: 0.85,
    },
  ],
  liquid_distribution: {
    initial_fraction: 0.8,
    reserve_fraction: 0.2,
    reserve_action_code: 'add_reserved_liquid_if_needed',
  },
  rounding: { grams_to_nearest: 1 },
  example_context: { ingredient_name: '鲜小麦面条' },
};

function northChinaPreviewFixture() {
  return promotedEntry('north-china-green-bean-braised-noodles', {
    slot_assignment: {
      staple: ['fresh-wheat-noodle'], vegetable: ['green-beans'], liquid: ['water'], protein: ['ground-pork'],
    },
    ratio_rule_ids: [northChinaRule.rule_id], ratio_default_rule_id: northChinaRule.rule_id,
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
        phase: 6, action_code: 'complete_recipe_safety', slot_ids: ['staple', 'protein', 'vegetable'], fact_refs: [],
        safety_endpoint_codes: ['pork_fully_cooked', 'bean_fully_cooked', 'noodle_tender'],
      },
    ],
    seasoning_actions: [{ action_code: 'omit_extra_salt', amount_source: 'none' }],
    safety_endpoints: [
      { endpoint_code: 'pork_fully_cooked', canonical_ids: ['ground-pork'] },
      { endpoint_code: 'bean_fully_cooked', canonical_ids: ['green-beans'] },
      { endpoint_code: 'noodle_tender', canonical_ids: ['fresh-wheat-noodle'] },
    ],
  });
}

function shanghaiPreviewFixture() {
  return promotedEntry('shanghai-salted-pork-vegetable-rice', {
    slot_assignment: { staple: ['raw-rice'], protein: ['salted-pork-belly'], fast_vegetable: ['small-bok-choy'] },
    ratio_rule_ids: [shanghaiRule.rule_id], ratio_default_rule_id: shanghaiRule.rule_id,
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
  });
}

function taiwanPreviewFixture() {
  return promotedEntry('taiwan-cabbage-mushroom-rice', {
    slot_assignment: { staple: ['raw-rice'], mushroom: ['shiitake'], vegetable: ['green-cabbage'] },
    ratio_rule_ids: [taiwanBaseRule.rule_id],
    ratio_default_rule_id: taiwanBaseRule.rule_id,
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
  });
}

test('authoritative planned named recipes fail closed instead of retaining a real title on generic steps', async () => {
  let planned = await namedPlannerResult(['大米', '咸五花肉', '小白菜'], {
    plan_source: 'named_recipe',
    recipe_id: 'shanghai-salted-pork-vegetable-rice',
    identity_level: 'canonical',
    presentation: namedPresentation('shanghai-salted-pork-vegetable-rice', '上海奉贤咸肉菜饭'),
  });
  const prepared = prepareRatioCatalog(productionAssets.ratios, productionAssets);
  assert.equal(prepared.ok, true);

  assert.throws(
    () => buildLockedPlanContract(planned, productionAssets.templates, productionAssets.recipeRuntime, prepared.catalog),
    /named_recipe_not_executable/u,
  );
});

test('named candidate is materialized before signing and compiler rejects every signed fact drift', async () => {
  const { runtime, entry } = shanghaiPreviewFixture();
  const ratios = preparedRatios(shanghaiRule);
  const generic = await namedPlannerResult(['大米', '咸五花肉', '小白菜'], {
    plan_source: 'named_recipe', recipe_id: entry.recipe_id, identity_level: 'canonical',
    presentation: namedPresentation(entry.recipe_id, '上海奉贤咸肉菜饭'),
  });
  assert.throws(() => namedCompiler(generic, runtime, ratios), /named_recipe_plan_fact_mismatch/u);

  const materialized = await materializedNamed(generic, runtime, ratios);
  assert.notEqual(materialized.plan.plan_id, generic.plan.plan_id);
  const locked = namedCompiler(materialized, runtime, ratios);
  const output = buildDeterministicGeneratedPlan(locked);
  const terms = buildIngredientTermUniverse(productionAssets.taxonomy, productionAssets.recipes);
  const checked = validateGeneratedPlan(output, locked, terms);
  assert.equal(checked.ok, true, checked.code);
  const response = buildGeneratedPlanResponse(materialized, locked, checked.meals);
  assert.deepEqual(response.plan, materialized.plan);
  assert.deepEqual(
    response.plan.pots[0].ingredient_amounts.map(item => [item.canonical_id, item.grams]).sort(),
    response.meals[0].locked_ingredients.map(item => [item.canonical_id, item.planned_grams]).sort(),
  );
  assert.deepEqual(response.plan.required_extra_items, response.plan.pots[0].required_extra_items);

  for (const field of ['ingredient_amounts', 'required_extra_items', 'ratio_trace', 'liquid_constraints',
    'time_range', 'safety_endpoints']) {
    const forged = structuredClone(materialized);
    if (field === 'ingredient_amounts') forged.plan.pots[0][field][0].grams += 1;
    else if (field === 'required_extra_items') forged.plan.pots[0][field][0].grams += 1;
    else if (field === 'ratio_trace') forged.plan.pots[0][field][0].rule_id += '-forged';
    else if (field === 'liquid_constraints') forged.plan.pots[0][field].retained_liquid_grams += 1;
    else if (field === 'time_range') forged.plan.pots[0][field].max_minutes += 1;
    else forged.plan.pots[0][field][0].endpoint_code += '-forged';
    assert.throws(() => namedCompiler(forged, runtime, ratios), new RegExp(`named_recipe_plan_fact_mismatch:${field}`), field);
  }

  const changed = structuredClone(materialized);
  changed.plan.pots[0].ingredient_amounts[0].grams += 1;
  changed.plan.plan_id = await computePlanId(changed);
  assert.notEqual(changed.plan.plan_id, materialized.plan.plan_id);

  const renamedExtraIdentity = structuredClone(materialized);
  renamedExtraIdentity.plan.required_extra_items[0].canonical_id = 'forged-water';
  renamedExtraIdentity.plan.pots[0].required_extra_items[0].canonical_id = 'forged-water';
  assert.notEqual(await computePlanId(renamedExtraIdentity), materialized.plan.plan_id);

  const changedRule = structuredClone(shanghaiRule);
  changedRule.operations.find(operation => operation.target?.canonical_id === 'small-bok-choy')
    .grams.default += 1;
  changedRule.operations.find(operation => operation.target?.canonical_id === 'small-bok-choy')
    .grams.max += 1;
  const changedRatios = preparedRatios(changedRule);
  assert.throws(
    () => namedCompiler(materialized, runtime, changedRatios),
    /named_recipe_plan_fact_mismatch:ingredient_amounts/u,
  );
  const rematerialized = await materializedNamed(generic, runtime, changedRatios);
  assert.notEqual(rematerialized.plan.plan_id, materialized.plan.plan_id);
});

test('custom compiler rejects any borrowed recipe identity or regional presentation', async () => {
  const custom = await planMealWithIdentity(productionAssets, request(['大米', '咸五花肉', '小白菜']));
  Object.assign(custom, {
    plan_source: 'custom_template',
    recipe_id: 'shanghai-salted-pork-vegetable-rice',
    variant_id: null,
    identity_level: 'canonical',
    presentation: namedPresentation('shanghai-salted-pork-vegetable-rice', '上海奉贤咸肉菜饭'),
  });
  assert.throws(
    () => buildLockedPlanContract(custom, productionAssets.templates),
    /custom_plan_identity_invalid/u,
  );
});

test('Shanghai named fixture locks its real title and recipe-specific pork-rice-then-late-greens order', async () => {
  const { runtime } = promotedEntry('shanghai-salted-pork-vegetable-rice', {
    slot_assignment: { staple: ['raw-rice'], protein: ['salted-pork-belly'], fast_vegetable: ['small-bok-choy'] },
    ratio_rule_ids: [shanghaiRule.rule_id],
    ratio_default_rule_id: shanghaiRule.rule_id,
    technique_graph: [
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
    ],
    seasoning_actions: [
      { action_code: 'taste_before_salt', amount_source: 'none' },
      { action_code: 'omit_extra_salt', amount_source: 'none' },
    ],
    safety_endpoints: [
      { endpoint_code: 'pork_fully_cooked', canonical_ids: ['salted-pork-belly'] },
      { endpoint_code: 'grain_tender_no_hard_center', canonical_ids: ['raw-rice'] },
    ],
  });
  let planned = await namedPlannerResult(['大米', '咸五花肉', '小白菜'], {
    plan_source: 'named_recipe', recipe_id: 'shanghai-salted-pork-vegetable-rice', identity_level: 'canonical',
    presentation: namedPresentation('shanghai-salted-pork-vegetable-rice', '上海奉贤咸肉菜饭'),
  });

  const ratios = preparedRatios(shanghaiRule);
  assertCoherentFixture(runtime, ratios);
  planned = await materializedNamed(planned, runtime, ratios);
  const locked = namedCompiler(planned, runtime, ratios);
  assert.deepEqual(locked.meals[0].generation_text_contract.dish_name_options, ['上海奉贤咸肉菜饭']);
  assert.deepEqual(locked.meals[0].cooking_order.map(step => step.action_code), [
    'start_cured_pork_and_rice', 'add_locked_liquid', 'cook_rice_until_tender_before_late_greens',
    'add_leafy_vegetable_late', 'taste_before_salt', 'omit_extra_salt', 'complete_recipe_safety',
  ]);
});

test('Xinjiang named fixture starts with lamb and measures retained cooked liquid before raw rice', async () => {
  const { runtime } = promotedEntry('xinjiang-lamb-pilaf', {
    slot_assignment: { staple: ['raw-rice'], protein: ['lamb-leg'], aromatic: ['onion'], slow_vegetable: ['carrot'] },
    ratio_rule_ids: [xinjiangRule.rule_id],
    ratio_default_rule_id: xinjiangRule.rule_id,
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
        phase: 5, action_code: 'braise_lamb_rice_until_done', slot_ids: ['protein', 'staple', 'slow_vegetable'],
        fact_refs: [],
      },
      {
        phase: 6,
        action_code: 'complete_recipe_safety',
        slot_ids: ['protein', 'staple', 'slow_vegetable'],
        fact_refs: [],
        safety_endpoint_codes: ['lamb_fully_cooked', 'grain_tender_no_hard_center', 'tender'],
      },
    ],
    seasoning_actions: [{ action_code: 'add_locked_salt', amount_source: 'ratio_default' }],
    safety_endpoints: [
      { endpoint_code: 'lamb_fully_cooked', canonical_ids: ['lamb-leg'] },
      { endpoint_code: 'grain_tender_no_hard_center', canonical_ids: ['raw-rice'] },
      { endpoint_code: 'tender', canonical_ids: ['carrot'] },
    ],
  });
  let planned = await namedPlannerResult(['大米', '羊腿肉', '洋葱', '胡萝卜'], {
    plan_source: 'named_recipe', recipe_id: 'xinjiang-lamb-pilaf', identity_level: 'canonical',
    presentation: namedPresentation('xinjiang-lamb-pilaf', '新疆羊肉抓饭'),
  });

  const ratios = preparedRatios(xinjiangRule);
  assertCoherentFixture(runtime, ratios);
  planned = await materializedNamed(planned, runtime, ratios);
  const locked = namedCompiler(planned, runtime, ratios);
  assert.deepEqual(locked.meals[0].cooking_order.map(step => step.action_code).slice(0, 4), [
    'brown_lamb_first', 'cook_onion_and_carrot', 'measure_retained_cooked_liquid', 'add_raw_rice_to_retained_liquid',
  ]);
  assert.deepEqual(locked.meals[0].liquid_constraints, {
    resource_code: 'retained_cooked_liquid',
    target_total_grams: 280,
    top_up: { canonical_id: 'water', mode: 'to_target' },
  });
  const measureStep = locked.meals[0].generation_text_contract.steps[2].allowed_texts.join('\n');
  assert.match(measureStep, /量取锅内熟制余液/u);
  assert.match(measureStep, /补水至总液体280克/u);
  assert.doesNotMatch(measureStep, /加入280克水/u);
  assert.deepEqual(locked.meals[0].cooking_order[2].produces_resources, ['retained_cooked_liquid']);
  assert.deepEqual(locked.meals[0].cooking_order[3].consumes_resources, ['retained_cooked_liquid']);
  const saltIndex = locked.meals[0].cooking_order.findIndex(step => step.action_code === 'add_locked_salt');
  assert.ok(saltIndex > 0);
  assert.deepEqual(locked.meals[0].cooking_order[saltIndex].locked_numeric_facts, ['2克']);
  assert.match(
    locked.meals[0].generation_text_contract.steps[saltIndex].allowed_texts.join('\n'),
    /加入2克/u,
  );
});

test('Taiwan base fixture uses its own base ratio and graph while every recipe variant remains fail closed', async () => {
  const { runtime } = taiwanPreviewFixture();
  const ratios = preparedRatios(taiwanBaseRule);
  assertCoherentFixture(runtime, ratios);
  let planned = await taiwanPlannerResult({
    plan_source: 'named_recipe', recipe_id: 'taiwan-cabbage-mushroom-rice', variant_id: null,
    identity_level: 'canonical', presentation: namedPresentation('taiwan-cabbage-mushroom-rice', '高丽菜香菇炊饭'),
  });
  planned = await materializedNamed(planned, runtime, ratios);
  const locked = namedCompiler(planned, runtime, ratios);
  assert.equal(locked.recipe_id, 'taiwan-cabbage-mushroom-rice');
  assert.deepEqual(locked.meals[0].cooking_order.map(step => step.action_code), [
    'start_cabbage_mushroom_and_rice', 'add_locked_liquid', 'cook_cabbage_mushroom_rice',
    'taste_before_salt', 'omit_extra_salt', 'complete_recipe_safety',
  ]);
  assert.equal(locked.meals[0].ratio_constraints[0].rule_id, taiwanBaseRule.rule_id);

  const variant = structuredClone(planned);
  variant.plan_source = 'recipe_variant';
  variant.variant_id = 'test-fixture-tomato-shrimp-variant';
  variant.identity_level = 'named_variant';
  variant.presentation = reviewedVariantPresentation('taiwan-cabbage-mushroom-rice', '番茄虾仁高丽菜炊饭');
  assert.throws(
    () => namedCompiler(variant, runtime, ratios),
    /recipe_variant_not_executable/u,
  );
});

test('recipe Ratio DSL output binds every amount to canonical state and shape identity', async () => {
  const planned = await namedPlannerResult(['大米', '羊腿肉', '洋葱', '胡萝卜'], {
    plan_source: 'named_recipe', recipe_id: 'xinjiang-lamb-pilaf', identity_level: 'canonical',
    presentation: namedPresentation('xinjiang-lamb-pilaf', '新疆羊肉抓饭'),
  });
  const pot = planned.plan.pots[0];
  const ratios = preparedRatios(xinjiangRule);
  const compiled = compileRatioPlan(xinjiangRule.rule_id, {
    recipe_id: 'xinjiang-lamb-pilaf',
    servings: 2,
    slots: Object.fromEntries(Object.entries(pot.slot_assignment).map(([slotId, items]) => [slotId, items.map(item => ({
      name: item.display_name, category: item.category, canonical_id: item.canonical_id,
      ratio_rule_policy: item.ratio_rule_policy, state: item.state, shape_or_cut: item.shape_or_cut,
    }))])),
  }, ratios);
  assert.equal(compiled.ok, true);
  assert.deepEqual(compiled.identity_amounts.find(item => item.canonical_id === 'lamb-leg'), {
    name: '羊腿肉', canonical_id: 'lamb-leg', state: 'raw', shape_or_cut: 'leg', grams: 150,
  });
});

test('retained cooked liquid must be produced before it is consumed exactly once', () => {
  const { runtime } = promotedEntry('xinjiang-lamb-pilaf', {
    slot_assignment: { staple: ['raw-rice'], protein: ['lamb-leg'], aromatic: ['onion'], slow_vegetable: ['carrot'] },
    ratio_rule_ids: [xinjiangRule.rule_id], ratio_default_rule_id: xinjiangRule.rule_id,
    technique_graph: [
      { phase: 1, action_code: 'brown_lamb_first', slot_ids: ['protein'], fact_refs: [] },
      {
        phase: 2, action_code: 'add_raw_rice_to_retained_liquid', slot_ids: ['staple'], fact_refs: [],
        produces_resources: [], consumes_resources: ['retained_cooked_liquid'],
      },
      {
        phase: 3, action_code: 'complete_recipe_safety', slot_ids: ['protein', 'staple', 'slow_vegetable'], fact_refs: [],
        safety_endpoint_codes: ['lamb_fully_cooked', 'grain_tender_no_hard_center', 'tender'],
      },
    ],
    seasoning_actions: [{ action_code: 'add_locked_salt', amount_source: 'ratio_default' }],
    safety_endpoints: [
      { endpoint_code: 'lamb_fully_cooked', canonical_ids: ['lamb-leg'] },
      { endpoint_code: 'grain_tender_no_hard_center', canonical_ids: ['raw-rice'] },
      { endpoint_code: 'tender', canonical_ids: ['carrot'] },
    ],
  });
  const errors = validateRecipeRuntimeCatalog(runtime, {
    ...productionAssets, ratios: preparedRatios(xinjiangRule),
  }).join('\n');
  assert.match(errors, /retained_cooked_liquid must be produced before it is consumed/u);
});

test('runtime graph schema rejects unknown actions, non-increasing phases, foreign facts and unreachable safety', () => {
  const { runtime } = promotedEntry('shanghai-salted-pork-vegetable-rice', {
    slot_assignment: { staple: ['raw-rice'], protein: ['salted-pork-belly'], fast_vegetable: ['small-bok-choy'] },
    ratio_rule_ids: [shanghaiRule.rule_id],
    ratio_default_rule_id: shanghaiRule.rule_id,
    technique_graph: [
      { phase: 2, action_code: 'invented_recipe_action', slot_ids: ['protein'], fact_refs: ['salt_grams'] },
      { phase: 2, action_code: 'complete_recipe_safety', slot_ids: ['protein'], fact_refs: [], safety_endpoint_codes: [] },
    ],
    seasoning_actions: [{ action_code: 'add_locked_salt', amount_source: 'ratio_default' }],
    safety_endpoints: [
      { endpoint_code: 'pork_fully_cooked', canonical_ids: ['salted-pork-belly'] },
      { endpoint_code: 'grain_tender_no_hard_center', canonical_ids: ['raw-rice'] },
    ],
  });
  const errors = validateRecipeRuntimeCatalog(runtime, {
    ...productionAssets,
    ratios: preparedRatios(shanghaiRule),
    actionProfiles: profilesFor(runtime),
  }).join('\n');
  assert.match(errors, /action_code is not an allowed recipe action/u);
  assert.match(errors, /phases must be strictly increasing and unique/u);
  assert.match(errors, /fact_refs.*not owned/u);
  assert.match(errors, /action profile.*unknown/u);
  assert.match(errors, /add_locked_salt.*locked salt fact/u);
});

test('runtime graph schema rejects missing ingredient reachability and wrong slot ownership', () => {
  const { runtime } = promotedEntry('shanghai-salted-pork-vegetable-rice', {
    slot_assignment: { staple: ['raw-rice'], protein: ['salted-pork-belly'], fast_vegetable: ['small-bok-choy'] },
    ratio_rule_ids: [shanghaiRule.rule_id],
    ratio_default_rule_id: shanghaiRule.rule_id,
    technique_graph: [
      { phase: 1, action_code: 'start_cured_pork_and_rice', slot_ids: ['invented'], fact_refs: [] },
      { phase: 2, action_code: 'complete_recipe_safety', slot_ids: ['protein'], fact_refs: [], safety_endpoint_codes: ['pork_fully_cooked'] },
    ],
    seasoning_actions: [{ action_code: 'omit_extra_salt', amount_source: 'none' }],
    safety_endpoints: [{ endpoint_code: 'pork_fully_cooked', canonical_ids: ['salted-pork-belly'] }],
  });
  const errors = validateRecipeRuntimeCatalog(runtime, {
    ...productionAssets,
    ratios: preparedRatios(shanghaiRule),
    actionProfiles: profilesFor(runtime),
  }).join('\n');
  assert.match(errors, /slot_ids must reference assigned slots/u);
  assert.match(errors, /must_precede requires action add_locked_liquid/u);
  assert.match(errors, /missing required safety endpoint grain_tender_no_hard_center/u);
});

test('shared action schema rejects cross-slot actions, missing facts and malformed resource ownership', () => {
  const cases = [
    {
      name: 'cross-slot',
      mutate(entry) { entry.technique_graph[0].slot_ids.push('fast_vegetable'); },
      expected: /slot_ids do not match action schema/u,
    },
    {
      name: 'missing-liquid-fact',
      mutate(entry) { entry.technique_graph[1].fact_refs = []; },
      expected: /fact_refs must exactly match required action facts/u,
    },
    {
      name: 'duplicate-slot',
      mutate(entry) { entry.technique_graph[0].slot_ids.push('protein'); },
      expected: /slot_ids must not contain duplicates/u,
    },
    {
      name: 'unexpected-resource',
      mutate(entry) { entry.technique_graph[0].produces_resources = ['retained_cooked_liquid']; },
      expected: /resources must exactly match action schema/u,
    },
  ];
  for (const fixture of cases) {
    const { runtime, entry } = shanghaiPreviewFixture();
    fixture.mutate(entry);
    const errors = validateRecipeRuntimeCatalog(runtime, {
      ...productionAssets, ratios: preparedRatios(shanghaiRule),
    }).join('\n');
    assert.match(errors, fixture.expected, fixture.name);
  }
});

test('named compiler independently rejects a mutated runtime action contract', async () => {
  const { runtime } = shanghaiPreviewFixture();
  const ratios = preparedRatios(shanghaiRule);
  let planned = await namedPlannerResult(['大米', '咸五花肉', '小白菜'], {
    plan_source: 'named_recipe', recipe_id: 'shanghai-salted-pork-vegetable-rice', identity_level: 'canonical',
    presentation: namedPresentation('shanghai-salted-pork-vegetable-rice', '上海奉贤咸肉菜饭'),
  });
  planned = await materializedNamed(planned, runtime, ratios);
  const cases = [
    ['cross-slot', entry => entry.technique_graph[0].slot_ids.push('fast_vegetable')],
    ['missing-fact', entry => { entry.technique_graph[1].fact_refs = []; }],
    ['foreign-resource', entry => { entry.technique_graph[0].produces_resources = ['retained_cooked_liquid']; }],
    ['critical-sequence', entry => { entry.identity_signature.identity_critical_action_sequence = ['cook_rice_until_tender_before_late_greens']; }],
    ['reordered-technique', entry => {
      [entry.technique_graph[0], entry.technique_graph[1]] = [entry.technique_graph[1], entry.technique_graph[0]];
      entry.technique_graph.forEach((action, index) => { action.phase = index + 1; });
    }],
    ['undeclared-safety', entry => entry.technique_graph.at(-1).safety_endpoint_codes.push('invented_endpoint')],
    ['early-safety', entry => {
      const final = entry.technique_graph.pop();
      entry.technique_graph.splice(1, 0, final);
      entry.technique_graph.forEach((action, index) => { action.phase = index + 1; });
      entry.identity_signature.identity_critical_action_sequence = entry.technique_graph.map(action => action.action_code);
    }],
  ];
  for (const [name, mutate] of cases) {
    const forged = structuredClone(runtime);
    mutate(forged.entries.find(entry => entry.recipe_id === planned.recipe_id));
    assert.throws(
      () => namedCompiler(planned, forged, ratios),
      /named_recipe_runtime_contract_invalid/u,
      name,
    );
  }
});

test('runtime schema rejects duplicate endpoints, endpoint members and seasoning decisions', () => {
  const duplicateEndpoint = shanghaiPreviewFixture();
  duplicateEndpoint.entry.safety_endpoints.push(structuredClone(duplicateEndpoint.entry.safety_endpoints[0]));
  assert.match(validateRecipeRuntimeCatalog(duplicateEndpoint.runtime, {
    ...productionAssets, ratios: preparedRatios(shanghaiRule),
  }).join('\n'), /endpoint_code must be unique/u);

  const duplicateMember = shanghaiPreviewFixture();
  duplicateMember.entry.safety_endpoints[0].canonical_ids.push('salted-pork-belly');
  assert.match(validateRecipeRuntimeCatalog(duplicateMember.runtime, {
    ...productionAssets, ratios: preparedRatios(shanghaiRule),
  }).join('\n'), /canonical_ids must not contain duplicates/u);

  const duplicateSeasoning = shanghaiPreviewFixture();
  duplicateSeasoning.entry.seasoning_actions.push(structuredClone(duplicateSeasoning.entry.seasoning_actions[0]));
  assert.match(validateRecipeRuntimeCatalog(duplicateSeasoning.runtime, {
    ...productionAssets, ratios: preparedRatios(shanghaiRule),
  }).join('\n'), /duplicate seasoning actions/u);

  const undeclaredSafety = shanghaiPreviewFixture();
  undeclaredSafety.entry.technique_graph.at(-1).safety_endpoint_codes.push('invented_endpoint');
  assert.match(validateRecipeRuntimeCatalog(undeclaredSafety.runtime, {
    ...productionAssets, ratios: preparedRatios(shanghaiRule),
  }).join('\n'), /safety_endpoint_codes invented_endpoint is not declared/u);

  const missingSaltDecision = shanghaiPreviewFixture();
  missingSaltDecision.entry.seasoning_actions = [{ action_code: 'taste_before_salt', amount_source: 'none' }];
  assert.match(validateRecipeRuntimeCatalog(missingSaltDecision.runtime, {
    ...productionAssets, ratios: preparedRatios(shanghaiRule),
  }).join('\n'), /exactly one salt decision/u);
});

test('shared registry provides writers for every allowed action and safety endpoint', () => {
  for (const [actionCode, schema] of Object.entries(RECIPE_ACTION_REGISTRY)) {
    assert.equal(typeof schema.writer, 'function', actionCode);
    assert.ok(Array.isArray(schema.exact_slot_sets) && schema.exact_slot_sets.length, actionCode);
    assert.ok(Array.isArray(schema.required_facts), actionCode);
    assert.ok(Array.isArray(schema.allowed_facts), actionCode);
    assert.ok(schema.required_facts.every(fact => schema.allowed_facts.includes(fact)), actionCode);
  }
  for (const endpoint of ['pork_fully_cooked', 'lamb_fully_cooked', 'grain_tender_no_hard_center',
    'bean_fully_cooked', 'noodle_tender', 'tender']) {
    assert.equal(typeof RECIPE_SAFETY_EVIDENCE_REGISTRY[endpoint], 'function', endpoint);
    const evidencePattern = recipeActionRegistry.RECIPE_SAFETY_EVIDENCE_PATTERNS?.[endpoint];
    assert.ok(evidencePattern instanceof RegExp, `${endpoint} evidence pattern`);
    assert.match(RECIPE_SAFETY_EVIDENCE_REGISTRY[endpoint]('{{i1}}'), evidencePattern, endpoint);
  }
});

test('North-China validator, materializer, compiler and deterministic validator share one water and full safety contract', async () => {
  const { runtime } = northChinaPreviewFixture();
  const ratios = preparedRatios(northChinaRule);
  assertCoherentFixture(runtime, ratios);
  let planned = await namedPlannerResult(['鲜小麦面条', '豆角', '猪肉末'], {
    plan_source: 'named_recipe', recipe_id: 'north-china-green-bean-braised-noodles', identity_level: 'canonical',
    presentation: namedPresentation('north-china-green-bean-braised-noodles', '北方豆角焖面'),
  });
  planned = await materializedNamed(planned, runtime, ratios);
  const locked = namedCompiler(planned, runtime, ratios);
  assert.deepEqual(locked.meals[0].cooking_order.map(step => step.action_code), [
    'break_up_ground_pork',
    'measure_add_initial_and_reserve_liquid',
    'simmer_pork_and_beans',
    'add_fresh_noodle',
    'add_reserved_liquid_if_needed',
    'omit_extra_salt',
    'complete_recipe_safety',
  ]);
  const water = locked.meals[0].locked_ingredients.filter(item => item.canonical_id === 'water');
  assert.equal(water.length, 1);
  assert.equal(water[0].source, 'basic_extra');
  assert.equal(water[0].planned_grams, 170);
  assert.deepEqual(locked.meals[0].liquid_constraints, {
    retained_liquid_grams: 170,
    liquid_credit_grams: 0,
    rounding_grams: 1,
    initial_liquid_grams: 136,
    reserve_liquid_grams: 34,
    reserve_action_code: 'add_reserved_liquid_if_needed',
  });
  assert.equal(locked.meals[0].locked_ingredients.filter(item => item.source === 'user').length, 3);
  assert.deepEqual(locked.meals[0].safety_endpoints.sort(), [
    'bean_fully_cooked', 'noodle_tender', 'pork_fully_cooked',
  ]);
  const texts = locked.meals[0].generation_text_contract.steps.flatMap(step => step.allowed_texts).join('\n');
  assert.match(texts, /猪肉完全熟透/u);
  assert.match(texts, /豆角熟软/u);
  assert.match(texts, /彻底熟透并软化/u);
  assert.match(texts, /面条熟透无硬芯/u);
  assert.match(texts, /先加136克/u);
  assert.match(texts, /另留34克/u);
  assert.match(texts, /锅底偏干/u);
  assert.deepEqual(locked.meals[0].cooking_order[1].locked_numeric_facts, ['136克', '34克']);
  assert.deepEqual(locked.meals[0].cooking_order[4].locked_numeric_facts, ['34克']);
  const output = buildDeterministicGeneratedPlan(locked);
  const checked = validateGeneratedPlan(
    output, locked, buildIngredientTermUniverse(productionAssets.taxonomy, productionAssets.recipes),
  );
  assert.equal(checked.ok, true, JSON.stringify(checked));
});

test('named compiler rejects forged identity, missing executable bindings, wrong state and extra food', async () => {
  const { runtime } = shanghaiPreviewFixture();
  const ratios = preparedRatios(shanghaiRule, xinjiangRule);
  assertCoherentFixture(runtime, ratios);
  let planned = await namedPlannerResult(['大米', '咸五花肉', '小白菜'], {
    plan_source: 'named_recipe', recipe_id: 'shanghai-salted-pork-vegetable-rice', identity_level: 'canonical',
    presentation: namedPresentation('shanghai-salted-pork-vegetable-rice', '上海奉贤咸肉菜饭'),
  });
  planned = await materializedNamed(planned, runtime, ratios);
  const compile = (candidate, runtimeCandidate = runtime) => namedCompiler(candidate, runtimeCandidate, ratios);

  const forgedTitle = structuredClone(planned);
  forgedTitle.presentation.title = '伪造正宗菜饭';
  assert.throws(() => compile(forgedTitle), /named_recipe_identity_invalid/u);

  const staleRuntime = structuredClone(runtime);
  staleRuntime.recipe_runtime_catalog_version = 'recipe-runtime-test-stale';
  assert.throws(() => compile(planned, staleRuntime), /named_recipe_runtime_catalog_stale/u);

  const noLegacyGraph = structuredClone(runtime);
  noLegacyGraph.entries[0].technique_graph = [];
  delete noLegacyGraph.entries[0].identity_signature.identity_critical_action_sequence;
  assert.doesNotThrow(() => compile(planned, noLegacyGraph));
  const missingSafety = structuredClone(runtime);
  missingSafety.entries[0].safety_endpoints = [];
  assert.throws(() => compile(planned, missingSafety), /named_recipe_plan_fact_mismatch:safety_endpoints/u);
  const missingRatio = structuredClone(runtime);
  missingRatio.entries[0].ratio_default_rule_id = null;
  assert.throws(() => compile(planned, missingRatio), /named_recipe_ratio_failed/u);

  const wrongRecipeRatio = structuredClone(runtime);
  wrongRecipeRatio.entries[0].ratio_default_rule_id = xinjiangRule.rule_id;
  assert.throws(() => compile(planned, wrongRecipeRatio), /ratio_context_identity_mismatch/u);

  const wrongState = structuredClone(planned);
  wrongState.plan.pots[0].slot_assignment.protein[0].state = 'raw';
  assert.throws(() => compile(wrongState), /named_recipe_ratio_failed:ratio_rule_invalid/u);

  const extraFood = structuredClone(planned);
  extraFood.plan.pots[0].slot_assignment.fast_vegetable.push({
    ...structuredClone(extraFood.plan.pots[0].slot_assignment.fast_vegetable[0]),
    raw: '胡萝卜', display_name: '胡萝卜', canonical: '胡萝卜', canonical_id: 'carrot',
    category: 'root_vegetable', shape_or_cut: 'whole',
  });
  assert.throws(() => compile(extraFood), /named_recipe_extra_ingredient/u);
});

test('Shanghai leafy vegetable cannot move early and generic order cannot validate as the named recipe', () => {
  const { runtime } = shanghaiPreviewFixture();
  const entry = runtime.entries[0];
  entry.technique_graph = [
    { phase: 1, action_code: 'add_leafy_vegetable_late', slot_ids: ['fast_vegetable'], fact_refs: [] },
    { phase: 2, action_code: 'add_locked_liquid', slot_ids: ['staple'], fact_refs: ['total_liquid_grams'] },
    { phase: 3, action_code: 'cook_rice_until_tender_before_late_greens', slot_ids: ['staple'], fact_refs: [] },
    { phase: 4, action_code: 'start_cured_pork_and_rice', slot_ids: ['protein', 'staple'], fact_refs: [] },
    {
      phase: 5, action_code: 'complete_recipe_safety', slot_ids: ['protein', 'staple'], fact_refs: [],
      safety_endpoint_codes: ['pork_fully_cooked', 'grain_tender_no_hard_center'],
    },
  ];
  assert.match(validateRecipeRuntimeCatalog(runtime, {
    ...productionAssets, ratios: preparedRatios(shanghaiRule), actionProfiles: profilesFor(runtime),
  }).join('\n'), /must match independent action profile/u);
});

test('custom ground pork never renders slice or thin-slice instructions', async () => {
  const planned = await planMealWithIdentity(productionAssets, request(['鲜小麦面条', '豆角', '猪肉末']));
  assert.equal(planned.status, 'ready');
  const locked = buildLockedPlanContract(planned, productionAssets.templates);
  assert.equal(locked.plan_source, 'custom_template');
  assert.equal(locked.meals[0].plan_source, 'custom_template');
  assert.equal(locked.meals[0].recipe_id, null);
  const groundRefs = new Set(locked.meals[0].locked_ingredients
    .filter(item => item.shape_or_cut === 'ground').map(item => item.ingredient_ref));
  const texts = locked.meals[0].cooking_order.flatMap((step, index) => (
    step.allowed_ingredient_refs.some(ref => groundRefs.has(ref))
      ? locked.meals[0].generation_text_contract.steps[index].allowed_texts
      : []
  ));
  assert.ok(texts.length > 0);
  assert.doesNotMatch(texts.join('\n'), /切(?:成)?(?:厚薄相近的)?薄片|切片/u);
  assert.match(texts.join('\n'), /炒散|拨散/u);
});

test('custom protein preparation preserves controlled part and shape semantics', async () => {
  for (const fixture of [
    { ingredient: '羊腿肉', shape: 'leg', expected: /原部位/u, forbidden: /切片|薄片/u },
    { ingredient: '鸡胸肉', shape: 'breast', expected: /原部位/u, forbidden: /切片|薄片/u },
    { ingredient: '咸五花肉', shape: 'cured_slice', expected: /分散|铺开/u, forbidden: /再切|切成.*薄片/u },
    { ingredient: '腊肠', shape: 'sausage', expected: /原形|小段/u, forbidden: /切片|薄片/u },
    { ingredient: '牛里脊', shape: 'tenderloin', expected: /薄片/u, forbidden: /牛腩|牛肉末/u },
  ]) {
    const planned = await planMealWithIdentity(productionAssets, request(['大米', fixture.ingredient]));
    assert.equal(planned.status, 'ready', fixture.ingredient);
    const locked = buildLockedPlanContract(planned, productionAssets.templates);
    const ref = locked.meals[0].locked_ingredients
      .find(item => item.shape_or_cut === fixture.shape)?.ingredient_ref;
    assert.ok(ref, fixture.ingredient);
    const texts = locked.meals[0].cooking_order.flatMap((step, index) => (
      step.action_code === 'protein_pretreat' && step.allowed_ingredient_refs.includes(ref)
        ? locked.meals[0].generation_text_contract.steps[index].allowed_texts : []
    )).join('\n');
    assert.match(texts, fixture.expected, fixture.ingredient);
    assert.doesNotMatch(texts, fixture.forbidden, fixture.ingredient);
    if (fixture.shape === 'tenderloin') {
      const output = buildDeterministicGeneratedPlan(locked);
      const checked = validateGeneratedPlan(
        output, locked, buildIngredientTermUniverse(productionAssets.taxonomy, productionAssets.recipes),
      );
      assert.equal(checked.ok, true);
      assert.match(checked.meals[0].steps.map(step => step.text).join('\n'), /牛里脊.*薄片/u);
    }
  }
});

test('named recipes use the unified generated-plan validator and reject all planner-owned boundary changes', async () => {
  const { runtime } = promotedEntry('xinjiang-lamb-pilaf', {
    slot_assignment: { staple: ['raw-rice'], protein: ['lamb-leg'], aromatic: ['onion'], slow_vegetable: ['carrot'] },
    ratio_rule_ids: [xinjiangRule.rule_id], ratio_default_rule_id: xinjiangRule.rule_id,
    technique_graph: [
      { phase: 1, action_code: 'brown_lamb_first', slot_ids: ['protein'], fact_refs: [] },
      { phase: 2, action_code: 'cook_onion_and_carrot', slot_ids: ['aromatic', 'slow_vegetable'], fact_refs: [] },
      {
        phase: 3, action_code: 'measure_retained_cooked_liquid', slot_ids: ['protein'], fact_refs: ['total_liquid_grams'],
        produces_resources: ['retained_cooked_liquid'], consumes_resources: [],
      },
      {
        phase: 4, action_code: 'add_raw_rice_to_retained_liquid', slot_ids: ['staple'], fact_refs: [],
        produces_resources: [], consumes_resources: ['retained_cooked_liquid'],
      },
      {
        phase: 5, action_code: 'braise_lamb_rice_until_done', slot_ids: ['protein', 'staple', 'slow_vegetable'],
        fact_refs: [],
      },
      {
        phase: 6, action_code: 'complete_recipe_safety', slot_ids: ['protein', 'staple', 'slow_vegetable'], fact_refs: [],
        safety_endpoint_codes: ['lamb_fully_cooked', 'grain_tender_no_hard_center', 'tender'],
      },
    ],
    seasoning_actions: [{ action_code: 'add_locked_salt', amount_source: 'ratio_default' }],
    safety_endpoints: [
      { endpoint_code: 'lamb_fully_cooked', canonical_ids: ['lamb-leg'] },
      { endpoint_code: 'grain_tender_no_hard_center', canonical_ids: ['raw-rice'] },
      { endpoint_code: 'tender', canonical_ids: ['carrot'] },
    ],
  });
  const ratios = preparedRatios(xinjiangRule);
  assertCoherentFixture(runtime, ratios);
  let planned = await namedPlannerResult(['大米', '羊腿肉', '洋葱', '胡萝卜'], {
    plan_source: 'named_recipe', recipe_id: 'xinjiang-lamb-pilaf', identity_level: 'canonical',
    presentation: namedPresentation('xinjiang-lamb-pilaf', '新疆羊肉抓饭'),
  });
  planned = await materializedNamed(planned, runtime, ratios);
  const locked = namedCompiler(planned, runtime, ratios);
  const output = buildDeterministicGeneratedPlan(locked);
  const terms = buildIngredientTermUniverse(productionAssets.taxonomy, productionAssets.recipes);
  const validated = validateGeneratedPlan(output, locked, terms);
  assert.equal(validated.ok, true);
  const response = buildGeneratedPlanResponse(planned, locked, validated.meals);
  for (const subject of [response, response.meals[0]]) {
    assert.equal(subject.plan_source, 'named_recipe');
    assert.equal(subject.recipe_id, 'xinjiang-lamb-pilaf');
    assert.equal(subject.variant_id, null);
    assert.equal(subject.identity_level, 'canonical');
    assert.deepEqual(subject.presentation, namedPresentation('xinjiang-lamb-pilaf', '新疆羊肉抓饭'));
  }
  assert.equal(response.recipe_runtime_catalog_version, productionAssets.recipeRuntime.recipe_runtime_catalog_version);

  const added = structuredClone(output);
  added.meals[0].dish_name += '香菇版';
  assert.equal(validateGeneratedPlan(added, locked, terms).ok, false);

  const changedGram = structuredClone(output);
  changedGram.meals[0].steps[2].text = changedGram.meals[0].steps[2].text.replace('280克', '281克');
  assert.equal(validateGeneratedPlan(changedGram, locked, terms).ok, false);

  const reordered = structuredClone(output);
  [reordered.meals[0].steps[0], reordered.meals[0].steps[1]] = [reordered.meals[0].steps[1], reordered.meals[0].steps[0]];
  assert.equal(validateGeneratedPlan(reordered, locked, terms).ok, false);

  const earlySafety = structuredClone(output);
  earlySafety.meals[0].steps[0].completed_safety_endpoints = ['lamb_fully_cooked'];
  assert.equal(validateGeneratedPlan(earlySafety, locked, terms).ok, false);
});

test('authoritative runtime assets remain six planned, zero preview, with no defaults or household trials', () => {
  assert.equal(productionAssets.recipeRuntime.entries.length, 6);
  assert.equal(productionAssets.recipeRuntime.entries.filter(entry => entry.activation_status === 'planned').length, 6);
  assert.equal(productionAssets.recipeRuntime.entries.filter(entry => entry.activation_status === 'preview_enabled').length, 0);
  assert.ok(productionAssets.recipeRuntime.entries.every(entry => entry.ratio_default_rule_id === null));
  assert.ok(productionAssets.recipeRuntime.entries.every(entry => entry.household_trial === null));
  assert.equal(productionAssets.actionProfiles.profiles.length, 0);
  const authoritativeRuleIds = new Set(productionAssets.recipeRuntime.entries.flatMap(entry => entry.ratio_rule_ids));
  assert.ok(productionAssets.ratios.rules.filter(rule => authoritativeRuleIds.has(rule.rule_id))
    .every(rule => rule.execution_mode === 'bounds_only'));
});

test('preview execution is owned by an independent instance profile and supports repeated action codes', () => {
  const { runtime, entry } = shanghaiPreviewFixture();
  const profiles = actionProfileCatalog(entry);
  entry.action_profile_ref = {
    action_profile_id: profiles.profiles[0].action_profile_id,
    profile_version: profiles.profiles[0].profile_version,
  };
  delete entry.identity_signature.identity_critical_action_sequence;
  entry.technique_graph = [];
  const repeat = structuredClone(profiles.profiles[0].instances[0]);
  repeat.instance_id = 'step-repeat';
  profiles.profiles[0].instances.splice(1, 0, repeat);
  profiles.profiles[0].execution_sequence.splice(1, 0, repeat.instance_id);

  assert.deepEqual(validateRecipeRuntimeCatalog(runtime, {
    ...productionAssets, ratios: preparedRatios(shanghaiRule), actionProfiles: profiles,
  }), []);

  const missing = structuredClone(profiles);
  missing.profiles[0].execution_sequence.pop();
  assert.match(validateRecipeRuntimeCatalog(runtime, {
    ...productionAssets, ratios: preparedRatios(shanghaiRule), actionProfiles: missing,
  }).join('\n'), /execution_sequence.*exactly cover/u);

  const duplicate = structuredClone(profiles);
  duplicate.profiles[0].instances[1].instance_id = duplicate.profiles[0].instances[0].instance_id;
  assert.match(validateRecipeRuntimeCatalog(runtime, {
    ...productionAssets, ratios: preparedRatios(shanghaiRule), actionProfiles: duplicate,
  }).join('\n'), /duplicate instance_id/u);

  const missingCriticalAction = structuredClone(profiles);
  const lateGreens = missingCriticalAction.profiles[0].instances
    .find(instance => instance.action_code === 'add_leafy_vegetable_late');
  missingCriticalAction.profiles[0].instances = missingCriticalAction.profiles[0].instances
    .filter(instance => instance.instance_id !== lateGreens.instance_id);
  missingCriticalAction.profiles[0].execution_sequence = missingCriticalAction.profiles[0].execution_sequence
    .filter(instanceId => instanceId !== lateGreens.instance_id);
  assert.match(validateRecipeRuntimeCatalog(runtime, {
    ...productionAssets, ratios: preparedRatios(shanghaiRule), actionProfiles: missingCriticalAction,
  }).join('\n'), /requires action add_leafy_vegetable_late/u);
});

test('catalog validator rejects Shanghai profile when cured-pork start and sequence member are both deleted', () => {
  const { profiles } = independentProfileFixture(shanghaiPreviewFixture, shanghaiRule);
  const missingStart = profileWithoutAction(profiles, 'start_cured_pork_and_rice');

  assert.match(validateRecipeActionProfileCatalog(missingStart).join('\n'),
    /cook_rice_until_tender_before_late_greens must_follow requires one action from start_cured_pork_and_rice/u);
});

test('runtime validator rejects Shanghai profile when cured-pork start and sequence member are both deleted', () => {
  const { runtime, profiles, ratios } = independentProfileFixture(shanghaiPreviewFixture, shanghaiRule);
  const missingStart = profileWithoutAction(profiles, 'start_cured_pork_and_rice');

  assert.match(validateRecipeRuntimeCatalog(runtime, {
    ...productionAssets, ratios, actionProfiles: missingStart,
  }).join('\n'),
  /cook_rice_until_tender_before_late_greens must_follow requires one action from start_cured_pork_and_rice/u);
});

test('named compiler rejects Shanghai profile when cured-pork start and sequence member are both deleted', async () => {
  const { runtime, entry, profiles, ratios } = independentProfileFixture(shanghaiPreviewFixture, shanghaiRule);
  const generic = await namedPlannerResult(['大米', '咸五花肉', '小白菜'], {
    plan_source: 'named_recipe', recipe_id: entry.recipe_id, identity_level: 'canonical',
    presentation: namedPresentation(entry.recipe_id, '上海奉贤咸肉菜饭'),
  });
  const recipe = productionAssets.recipes.recipes.find(row => row.id === entry.recipe_id);
  const materialized = materializeNamedPlanFacts(generic, entry, ratios, recipe, profiles);
  materialized.plan.plan_id = await computePlanId(materialized);
  const missingStart = profileWithoutAction(profiles, 'start_cured_pork_and_rice');

  assert.throws(() => buildLockedPlanContract(materialized, productionAssets.templates, runtime, ratios,
    productionAssets.recipes, missingStart),
  /named_recipe_action_profile_invalid:.*cook_rice_until_tender_before_late_greens must_follow requires one action from start_cured_pork_and_rice/u);
});

test('catalog validator rejects Taiwan profile when cabbage-mushroom start and sequence member are both deleted', () => {
  const { profiles } = independentProfileFixture(taiwanPreviewFixture, taiwanBaseRule);
  const missingStart = profileWithoutAction(profiles, 'start_cabbage_mushroom_and_rice');

  assert.match(validateRecipeActionProfileCatalog(missingStart).join('\n'),
    /cook_cabbage_mushroom_rice must_follow requires one action from start_cabbage_mushroom_and_rice/u);
});

test('runtime validator rejects Taiwan profile when cabbage-mushroom start and sequence member are both deleted', () => {
  const { runtime, profiles, ratios } = independentProfileFixture(taiwanPreviewFixture, taiwanBaseRule);
  const missingStart = profileWithoutAction(profiles, 'start_cabbage_mushroom_and_rice');

  assert.match(validateRecipeRuntimeCatalog(runtime, {
    ...productionAssets, ratios, actionProfiles: missingStart,
  }).join('\n'),
  /cook_cabbage_mushroom_rice must_follow requires one action from start_cabbage_mushroom_and_rice/u);
});

test('named compiler rejects Taiwan profile when cabbage-mushroom start and sequence member are both deleted', async () => {
  const { runtime, entry, profiles, ratios } = independentProfileFixture(taiwanPreviewFixture, taiwanBaseRule);
  const generic = await taiwanPlannerResult({
    plan_source: 'named_recipe', recipe_id: entry.recipe_id, variant_id: null,
    identity_level: 'canonical', presentation: namedPresentation(entry.recipe_id, '高丽菜香菇炊饭'),
  });
  const recipe = productionAssets.recipes.recipes.find(row => row.id === entry.recipe_id);
  const materialized = materializeNamedPlanFacts(generic, entry, ratios, recipe, profiles);
  materialized.plan.plan_id = await computePlanId(materialized);
  const missingStart = profileWithoutAction(profiles, 'start_cabbage_mushroom_and_rice');

  assert.throws(() => buildLockedPlanContract(materialized, productionAssets.templates, runtime, ratios,
    productionAssets.recipes, missingStart),
  /named_recipe_action_profile_invalid:.*cook_cabbage_mushroom_rice must_follow requires one action from start_cabbage_mushroom_and_rice/u);
});

test('action profile catalog independently enforces registry slots facts and resources', () => {
  const { entry } = shanghaiPreviewFixture();
  const profiles = actionProfileCatalog(entry);
  assert.deepEqual(validateRecipeActionProfileCatalog(profiles), []);
  for (const [name, mutate, expected] of [
    ['slot', instance => instance.slot_ids.push('fast_vegetable'), /slot_ids.*action schema/u],
    ['fact', instance => { instance.fact_refs = []; }, /fact_refs.*action schema/u],
    ['resource', instance => { instance.produces_resources = ['reserved_liquid']; }, /resources.*action schema/u],
  ]) {
    const invalid = structuredClone(profiles);
    const instance = name === 'fact'
      ? invalid.profiles[0].instances.find(row => row.action_code === 'add_locked_liquid')
      : invalid.profiles[0].instances[0];
    mutate(instance);
    assert.match(validateRecipeActionProfileCatalog(invalid).join('\n'), expected, name);
  }
});

test('generic rice cooking action remains reusable when a profile has no leafy-vegetable phase', () => {
  const profiles = {
    action_profile_catalog_version: 'recipe-action-profiles-v1-20260731-r1',
    profiles: [{
      action_profile_id: 'test-generic-rice-no-greens',
      profile_version: 'v1',
      instances: [
        { instance_id: 'liquid', action_code: 'add_locked_liquid', slot_ids: ['staple'], fact_refs: ['total_liquid_grams'], produces_resources: [], consumes_resources: [], safety_endpoint_codes: [] },
        { instance_id: 'rice', action_code: 'cook_rice_until_tender', slot_ids: ['staple'], fact_refs: [], produces_resources: [], consumes_resources: [], safety_endpoint_codes: [] },
        { instance_id: 'safe', action_code: 'complete_recipe_safety', slot_ids: ['staple'], fact_refs: [], produces_resources: [], consumes_resources: [], safety_endpoint_codes: ['grain_tender_no_hard_center'] },
      ],
      execution_sequence: ['liquid', 'rice', 'safe'],
    }],
  };
  assert.deepEqual(validateRecipeActionProfileCatalog(profiles), []);
});

test('independent profile ordering rejects Shanghai early greens and Xinjiang onion before lamb', () => {
  const cases = [
    {
      make: shanghaiPreviewFixture, rule: shanghaiRule,
      reorder(profile) {
        const rice = profile.instances.find(row => row.action_code === 'cook_rice_until_tender_before_late_greens').instance_id;
        const greens = profile.instances.find(row => row.action_code === 'add_leafy_vegetable_late').instance_id;
        profile.execution_sequence.splice(profile.execution_sequence.indexOf(greens), 1);
        profile.execution_sequence.splice(profile.execution_sequence.indexOf(rice), 0, greens);
      },
    },
    {
      make: () => promotedEntry('xinjiang-lamb-pilaf', {
        slot_assignment: { staple: ['raw-rice'], protein: ['lamb-leg'], aromatic: ['onion'], slow_vegetable: ['carrot'] },
        ratio_rule_ids: [xinjiangRule.rule_id], ratio_default_rule_id: xinjiangRule.rule_id,
        technique_graph: [
          { phase: 1, action_code: 'brown_lamb_first', slot_ids: ['protein'], fact_refs: [] },
          { phase: 2, action_code: 'cook_onion_and_carrot', slot_ids: ['aromatic', 'slow_vegetable'], fact_refs: [] },
          { phase: 3, action_code: 'measure_retained_cooked_liquid', slot_ids: ['protein'], fact_refs: ['total_liquid_grams'], produces_resources: ['retained_cooked_liquid'], consumes_resources: [] },
          { phase: 4, action_code: 'add_raw_rice_to_retained_liquid', slot_ids: ['staple'], fact_refs: [], produces_resources: [], consumes_resources: ['retained_cooked_liquid'] },
          { phase: 5, action_code: 'braise_lamb_rice_until_done', slot_ids: ['protein', 'staple', 'slow_vegetable'], fact_refs: [] },
          { phase: 6, action_code: 'complete_recipe_safety', slot_ids: ['protein', 'staple', 'slow_vegetable'], fact_refs: [], safety_endpoint_codes: ['lamb_fully_cooked', 'grain_tender_no_hard_center', 'tender'] },
        ],
        seasoning_actions: [{ action_code: 'add_locked_salt', amount_source: 'ratio_default' }],
        safety_endpoints: [
          { endpoint_code: 'lamb_fully_cooked', canonical_ids: ['lamb-leg'] },
          { endpoint_code: 'grain_tender_no_hard_center', canonical_ids: ['raw-rice'] },
          { endpoint_code: 'tender', canonical_ids: ['carrot'] },
        ],
      }),
      rule: xinjiangRule,
      reorder(profile) { [profile.execution_sequence[0], profile.execution_sequence[1]] = [profile.execution_sequence[1], profile.execution_sequence[0]]; },
    },
  ];
  for (const fixture of cases) {
    const { runtime, entry } = fixture.make();
    const profiles = actionProfileCatalog(entry);
    entry.action_profile_ref = {
      action_profile_id: profiles.profiles[0].action_profile_id,
      profile_version: profiles.profiles[0].profile_version,
    };
    delete entry.identity_signature.identity_critical_action_sequence;
    entry.technique_graph = [];
    fixture.reorder(profiles.profiles[0]);
    assert.match(validateRecipeRuntimeCatalog(runtime, {
      ...productionAssets, ratios: preparedRatios(fixture.rule), actionProfiles: profiles,
    }).join('\n'), /must_(?:precede|follow)/u);
  }
});

test('materialized execution contract is signed and stale profile plans fail closed', async () => {
  const { runtime, entry } = shanghaiPreviewFixture();
  const profiles = actionProfileCatalog(entry);
  entry.action_profile_ref = {
    action_profile_id: profiles.profiles[0].action_profile_id,
    profile_version: profiles.profiles[0].profile_version,
  };
  delete entry.identity_signature.identity_critical_action_sequence;
  entry.technique_graph = [];
  const ratios = preparedRatios(shanghaiRule);
  const generic = await namedPlannerResult(['大米', '咸五花肉', '小白菜'], {
    plan_source: 'named_recipe', recipe_id: entry.recipe_id, identity_level: 'canonical',
    presentation: namedPresentation(entry.recipe_id, '上海奉贤咸肉菜饭'),
  });
  const recipe = productionAssets.recipes.recipes.find(row => row.id === entry.recipe_id);
  const first = materializeNamedPlanFacts(generic, entry, ratios, recipe, profiles);
  first.plan.plan_id = await computePlanId(first);
  assert.equal(first.plan.pots[0].execution_contract.action_profile_id, profiles.profiles[0].action_profile_id);

  const changedProfiles = structuredClone(profiles);
  const repeatedStart = structuredClone(changedProfiles.profiles[0].instances[0]);
  repeatedStart.instance_id = 'step-reviewed-repeat';
  changedProfiles.profiles[0].instances.splice(1, 0, repeatedStart);
  changedProfiles.profiles[0].execution_sequence.splice(1, 0, repeatedStart.instance_id);
  assert.deepEqual(validateRecipeRuntimeCatalog(runtime, {
    ...productionAssets, ratios, actionProfiles: changedProfiles,
  }), []);
  const second = materializeNamedPlanFacts(generic, entry, ratios, recipe, changedProfiles);
  second.plan.plan_id = await computePlanId(second);
  assert.notEqual(second.plan.plan_id, first.plan.plan_id);
  assert.throws(() => buildLockedPlanContract(first, productionAssets.templates, runtime, ratios,
    productionAssets.recipes, changedProfiles), /named_recipe_plan_fact_mismatch:execution_contract|named_recipe_action_profile_stale/u);
});

test('custom plan rejects nested identity injection and response only returns its locked plan', async () => {
  const base = await planMealWithIdentity(productionAssets, request(['大米', '西红柿']));
  const fields = {
    plan_source: 'named_recipe', recipe_id: 'shanghai-salted-pork-vegetable-rice', variant_id: 'forged',
    identity_level: 'canonical', presentation: { title: '上海奉贤咸肉菜饭' }, canonical_name: '上海奉贤咸肉菜饭',
  };
  const topLevelCanonicalName = structuredClone(base);
  topLevelCanonicalName.canonical_name = '上海奉贤咸肉菜饭';
  assert.throws(() => buildLockedPlanContract(topLevelCanonicalName, productionAssets.templates),
    /custom_plan_identity_invalid/u);
  for (const layer of ['plan', 'pot']) {
    for (const [field, value] of Object.entries(fields)) {
      const forged = structuredClone(base);
      (layer === 'plan' ? forged.plan : forged.plan.pots[0])[field] = value;
      assert.throws(() => buildLockedPlanContract(forged, productionAssets.templates), /custom_plan_identity_invalid/u, `${layer}.${field}`);
    }
  }
  for (const [field, value] of Object.entries(fields)) {
    const forged = structuredClone(base);
    const nestedItem = Object.values(forged.plan.pots[0].slot_assignment).flat()[0];
    nestedItem[field] = value;
    assert.throws(() => buildLockedPlanContract(forged, productionAssets.templates), /custom_plan_identity_invalid/u,
      `pot.slot_assignment.item.${field}`);
  }

  const locked = buildLockedPlanContract(base, productionAssets.templates);
  assert.ok(locked.plan);
  const output = buildDeterministicGeneratedPlan(locked);
  const checked = validateGeneratedPlan(output, locked,
    buildIngredientTermUniverse(productionAssets.taxonomy, productionAssets.recipes));
  assert.equal(checked.ok, true);
  const before = structuredClone(locked.plan);
  base.plan.pots[0].recipe_id = 'forged-after-lock';
  const response = buildGeneratedPlanResponse(base, locked, checked.meals);
  assert.deepEqual(response.plan, before);
  assert.equal(response.plan_id, locked.plan_id);
  assert.equal(response.plan.pots[0].recipe_id, undefined);
});

test('custom compiler canonically binds presentation ingredients and technique to the current plan', async () => {
  const base = await planMealWithIdentity(productionAssets, request(['大米', '西红柿']));
  assert.equal(base.plan_source, 'custom_template');

  const foreignIngredient = structuredClone(base);
  const currentTechnique = ['焖饭','汤饭','汤面','焖面','炖锅','快炒饭']
    .find(technique => foreignIngredient.presentation.title.endsWith(technique));
  assert.ok(currentTechnique);
  foreignIngredient.presentation.title = `香菇${currentTechnique}`;
  assert.throws(
    () => buildLockedPlanContract(foreignIngredient, productionAssets.templates),
    /custom_plan_presentation_mismatch/u,
  );

  const wrongTechnique = structuredClone(base);
  const replacementTechnique = ['焖饭','汤饭','汤面','焖面','炖锅','快炒饭']
    .find(technique => technique !== currentTechnique);
  wrongTechnique.presentation.title = wrongTechnique.presentation.title
    .slice(0, -currentTechnique.length) + replacementTechnique;
  assert.throws(
    () => buildLockedPlanContract(wrongTechnique, productionAssets.templates),
    /custom_plan_presentation_mismatch/u,
  );
});

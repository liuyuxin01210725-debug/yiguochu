import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePlannerItems } from '../../worker/src/planner-v2.js';
import { minimumRecommendCoverageCount as sharedMinimumCoverageCount } from '../../worker/src/planner-coverage.js';
import { minimumRecommendCoverageCount as plannerMinimumCoverageCount } from '../../worker/src/planner-v2.js';
import { matchNamedRecipeCandidates } from '../../worker/src/recipe-runtime-matcher.js';
import { validateRecipeRuntimeCatalog } from '../../worker/src/recipe-runtime-validator.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const readJson = name => JSON.parse(fs.readFileSync(path.join(here, '../data', name), 'utf8'));
const baseRatios = readJson('ratio-rules.v1.json');
const productionAssets = Object.freeze({
  taxonomy: readJson('ingredient-taxonomy.v1.json'),
  recipes: readJson('recipe-library.json'),
  templates: readJson('meal-templates.v2.json'),
  ratios: baseRatios,
  recipeRuntime: readJson('recipe-runtime.v1.json'),
  actionProfiles: readJson('recipe-action-profiles.v1.json'),
});

const COMPLETE_SOURCE_CLAIMS = ['identity', 'technique', 'ratio', 'seasoning', 'safety']
  .map(claim_type => ({ claim_type, evidence_index: 0 }));

function addSyntheticExecutableRule(assets, recipeId, ruleId, { retainedCookedLiquid = false } = {}) {
  assets.ratios.rules.push({
    rule_id: ruleId,
    evidence_recipe_ids: [recipeId],
    execution_mode: 'executable',
    when: { recipe_id: recipeId },
    operations: [{
      operator: 'ratio',
      target: { name: '水', category: 'liquid' },
      numerator: { resource: retainedCookedLiquid ? 'retained_cooked_liquid_grams' : 'raw_staple_grams' },
      denominator: { canonical_id: 'raw-rice', state: 'raw', measure: 'grams' },
      min: 1,
      default: 1,
      max: 1,
    }],
  });
}

function completePreviewEntry(assets, entry, {
  ratioRuleId, slotAssignment, techniqueGraph, safetyEndpoints, seasoningActions,
}) {
  entry.activation_status = 'preview_enabled';
  entry.slot_assignment = slotAssignment;
  entry.ratio_rule_ids = [ratioRuleId];
  entry.ratio_default_rule_id = ratioRuleId;
  entry.technique_graph = techniqueGraph;
  entry.identity_signature.identity_critical_action_sequence = techniqueGraph.map(step => step.action_code);
  const instances = techniqueGraph.map((step, index) => ({
    instance_id: `${entry.recipe_id}-step-${index + 1}`,
    action_code: step.action_code,
    slot_ids: [...(step.slot_ids || [])],
    fact_refs: [...(step.fact_refs || [])],
    produces_resources: [...(step.produces_resources || [])],
    consumes_resources: [...(step.consumes_resources || [])],
    safety_endpoint_codes: [...(step.safety_endpoint_codes || [])],
  }));
  entry.action_profile_ref = { action_profile_id: `test-${entry.recipe_id}`, profile_version: 'test-v1' };
  assets.actionProfiles = {
    action_profile_catalog_version: 'recipe-action-profiles-v1-20260731-r1',
    profiles: [{
      ...entry.action_profile_ref,
      instances,
      execution_sequence: instances.map(instance => instance.instance_id),
    }],
  };
  entry.seasoning_actions = seasoningActions;
  entry.safety_endpoints = safetyEndpoints;
  entry.source_claims = structuredClone(COMPLETE_SOURCE_CLAIMS);
  entry.household_trial = {
    status: 'completed',
    trial_date: '2026-07-30',
    reviewer: 'synthetic-test-fixture',
    outcome: 'passed',
  };
}

function assertCoherentRuntimeFixture(assets) {
  assert.deepEqual(validateRecipeRuntimeCatalog(assets.recipeRuntime, assets), []);
  return assets;
}

function promotedShanghaiAssets() {
  const assets = structuredClone(productionAssets);
  const ratioRuleId = 'synthetic-shanghai-recipe-executable-v1';
  addSyntheticExecutableRule(assets, 'shanghai-salted-pork-vegetable-rice', ratioRuleId);
  const entry = assets.recipeRuntime.entries
    .find(candidate => candidate.recipe_id === 'shanghai-salted-pork-vegetable-rice');
  completePreviewEntry(assets, entry, {
    ratioRuleId,
    slotAssignment: {
      staple: ['raw-rice'],
      protein: ['salted-pork-belly'],
      fast_vegetable: ['small-bok-choy'],
    },
    techniqueGraph: [
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
    seasoningActions: [
      { action_code: 'taste_before_salt', amount_source: 'none' },
      { action_code: 'omit_extra_salt', amount_source: 'none' },
    ],
    safetyEndpoints: [
      { endpoint_code: 'pork_fully_cooked', canonical_ids: ['salted-pork-belly'] },
      { endpoint_code: 'grain_tender_no_hard_center', canonical_ids: ['raw-rice'] },
    ],
  });
  entry.approved_variants = [];
  return assertCoherentRuntimeFixture(assets);
}

// Matcher-only future fixture. The current upstream validator deliberately
// rejects preview variants until Task 4 supplies executable quantity transfer.
// This fixture verifies exact matching semantics without implying that setting
// activation_status alone is sufficient for runtime admission.
function futureChoySumMatcherFixture() {
  const assets = promotedShanghaiAssets();
  const entry = assets.recipeRuntime.entries
    .find(candidate => candidate.recipe_id === 'shanghai-salted-pork-vegetable-rice');
  entry.approved_variants = [{
    variant_id: 'shanghai-choy-sum-variant',
    identity_impact: 'named_variant',
    naming: { display_name: '上海奉贤咸肉菜饭（菜心版）' },
    substitutions: [{
      slot_id: 'fast_vegetable',
      replaces_canonical_ids: ['small-bok-choy'],
      allowed_canonical_ids: ['choy-sum'],
    }],
  }];
  return assets;
}

function promotedXinjiangAssets() {
  const assets = structuredClone(productionAssets);
  const ratioRuleId = 'synthetic-xinjiang-recipe-executable-v1';
  addSyntheticExecutableRule(assets, 'xinjiang-lamb-pilaf', ratioRuleId, { retainedCookedLiquid: true });
  const entry = assets.recipeRuntime.entries.find(candidate => candidate.recipe_id === 'xinjiang-lamb-pilaf');
  completePreviewEntry(assets, entry, {
    ratioRuleId,
    slotAssignment: {
      staple: ['raw-rice'],
      protein: ['lamb-leg'],
      aromatic: ['onion'],
      slow_vegetable: ['carrot'],
    },
    techniqueGraph: [
      { phase: 1, action_code: 'brown_lamb_first', slot_ids: ['protein'], fact_refs: [] },
      { phase: 2, action_code: 'cook_onion_and_carrot', slot_ids: ['aromatic', 'slow_vegetable'], fact_refs: [] },
      {
        phase: 3,
        action_code: 'measure_retained_cooked_liquid',
        slot_ids: ['protein'],
        fact_refs: ['total_liquid_grams'],
        produces_resources: ['retained_cooked_liquid'],
        consumes_resources: [],
      },
      {
        phase: 4,
        action_code: 'add_raw_rice_to_retained_liquid',
        slot_ids: ['staple'],
        fact_refs: [],
        produces_resources: [],
        consumes_resources: ['retained_cooked_liquid'],
      },
      { phase: 5, action_code: 'braise_lamb_rice_until_done', slot_ids: ['protein', 'staple', 'slow_vegetable'], fact_refs: [] },
      {
        phase: 6,
        action_code: 'complete_recipe_safety',
        slot_ids: ['protein', 'staple', 'slow_vegetable'],
        fact_refs: [],
        safety_endpoint_codes: ['lamb_fully_cooked', 'grain_tender_no_hard_center', 'tender'],
      },
    ],
    seasoningActions: [{ action_code: 'omit_extra_salt', amount_source: 'none' }],
    safetyEndpoints: [
      { endpoint_code: 'lamb_fully_cooked', canonical_ids: ['lamb-leg'] },
      { endpoint_code: 'grain_tender_no_hard_center', canonical_ids: ['raw-rice'] },
      { endpoint_code: 'tender', canonical_ids: ['carrot'] },
    ],
  });
  return assertCoherentRuntimeFixture(assets);
}

function normalizedRequest(assets, preferUse, extra = {}) {
  return {
    mode: 'recommend',
    intent: 'normal',
    servings: 2,
    prefer_use: [...preferUse],
    normalized_items: normalizePlannerItems(
      preferUse.map(raw => ({ raw, role: 'prefer_use' })),
      assets.taxonomy,
    ),
    ...extra,
  };
}

test('authoritative planned runtime entries remain shadow-only and never become named candidates', () => {
  const request = normalizedRequest(productionAssets, ['大米', '咸五花肉', '小白菜']);
  assert.deepEqual(matchNamedRecipeCandidates(productionAssets, request), []);
});

test('all authoritative runtime identities remain unavailable while every entry is planned', () => {
  const itemById = new Map(productionAssets.taxonomy.items.map(item => [item.canonical_id, item]));
  for (const entry of productionAssets.recipeRuntime.entries) {
    const pantry = entry.identity_signature.required_canonical_ids
      .map(canonicalId => itemById.get(canonicalId)?.display_name)
      .filter(Boolean);
    assert.equal(pantry.length, entry.identity_signature.required_canonical_ids.length, entry.recipe_id);
    assert.deepEqual(
      matchNamedRecipeCandidates(productionAssets, normalizedRequest(productionAssets, pantry)),
      [],
      entry.recipe_id,
    );
  }
});

test('complete canonical Shanghai identity yields its real name and exact honest coverage', () => {
  const assets = promotedShanghaiAssets();
  const request = normalizedRequest(assets, ['大米', '咸五花肉', '小白菜', '神秘叶子']);
  const [candidate] = matchNamedRecipeCandidates(assets, request);

  assert.equal(candidate.plan_source, 'named_recipe');
  assert.equal(candidate.recipe_runtime_catalog_version, assets.recipeRuntime.recipe_runtime_catalog_version);
  assert.equal(candidate.recipe_id, 'shanghai-salted-pork-vegetable-rice');
  assert.equal(candidate.variant_id, null);
  assert.deepEqual(candidate.runtime_candidate_authority, {
    candidate_id: 'shanghai-salted-pork-vegetable-rice',
    recipe_id: 'shanghai-salted-pork-vegetable-rice',
    variant_id: null,
    catalog_version: assets.recipeRuntime.recipe_runtime_catalog_version,
    contract_hash: candidate.runtime_candidate_authority.contract_hash,
  });
  assert.match(candidate.runtime_candidate_authority.contract_hash, /^[a-f0-9]{64}$/u);
  assert.equal(candidate.identity_level, 'canonical');
  assert.deepEqual(candidate.presentation, {
    badge: '依据菜谱',
    title: '上海奉贤咸肉菜饭',
    subtitle: '按已核验菜谱的用料、比例与熟制顺序呈现。',
    source_label: '查看一锅出标准配方',
    canonical_path: '/recipes.html?id=shanghai-salted-pork-vegetable-rice',
  });
  assert.equal(candidate.coverage_ratio, 3 / 4);
  assert.equal(candidate.recognition_ratio, 3 / 4);
  assert.equal(candidate.recognized_coverage_ratio, 1);
  assert.deepEqual(candidate.planned_prefer_use.map(item => item.raw), ['大米', '咸五花肉', '小白菜']);
  assert.deepEqual(candidate.unused_prefer_use.map(item => item.raw), ['神秘叶子']);
  assert.deepEqual(candidate.unrecognized_items.map(item => item.raw), ['神秘叶子']);
});

test('an explicit choy-sum substitution produces a named variant rather than canonical identity', () => {
  const assets = futureChoySumMatcherFixture();
  const request = normalizedRequest(assets, ['大米', '咸五花肉', '菜心']);
  const [candidate] = matchNamedRecipeCandidates(assets, request);

  assert.equal(candidate.recipe_id, 'shanghai-salted-pork-vegetable-rice');
  assert.equal(candidate.variant_id, 'shanghai-choy-sum-variant');
  assert.equal(candidate.runtime_candidate_authority.candidate_id, 'shanghai-salted-pork-vegetable-rice#shanghai-choy-sum-variant');
  assert.equal(candidate.runtime_candidate_authority.catalog_version, assets.recipeRuntime.recipe_runtime_catalog_version);
  assert.match(candidate.runtime_candidate_authority.contract_hash, /^[a-f0-9]{64}$/u);
  assert.equal(candidate.identity_level, 'approved_variant');
  assert.deepEqual(candidate.presentation, {
    badge: '菜谱替换版',
    title: '上海奉贤咸肉菜饭（菜心版）',
    subtitle: '采用已复核的食材替换，并以菜谱替换版呈现。',
    source_label: '查看一锅出标准配方',
    canonical_path: '/recipes.html?id=shanghai-salted-pork-vegetable-rice',
  });
  assert.equal(candidate.coverage_ratio, 1);
  assert.match(candidate.match_trace.join('\n'), /small-bok-choy.*choy-sum/u);
});

test('a substitution marked breaks_identity never retains the recipe name or identity', () => {
  const assets = futureChoySumMatcherFixture();
  const entry = assets.recipeRuntime.entries
    .find(candidate => candidate.recipe_id === 'shanghai-salted-pork-vegetable-rice');
  entry.approved_variants[0].identity_impact = 'breaks_identity';
  assert.deepEqual(matchNamedRecipeCandidates(
    assets,
    normalizedRequest(assets, ['大米', '咸五花肉', '菜心']),
  ), []);
});

test('complete Xinjiang core matches, while missing onion or carrot cannot retain pilaf identity', () => {
  const assets = promotedXinjiangAssets();
  const complete = matchNamedRecipeCandidates(
    assets,
    normalizedRequest(assets, ['大米', '羊腿肉', '洋葱', '胡萝卜']),
  );
  assert.equal(complete[0]?.presentation.title, '新疆羊肉抓饭');
  assert.equal(complete[0]?.coverage_ratio, 1);

  for (const incomplete of [
    ['大米', '羊腿肉', '胡萝卜'],
    ['大米', '羊腿肉', '洋葱'],
  ]) {
    assert.deepEqual(matchNamedRecipeCandidates(assets, normalizedRequest(assets, incomplete)), []);
  }
});

test('exact canonical and shape semantics never let beef tenderloin satisfy brisket', () => {
  const assets = structuredClone(productionAssets);
  assets.recipeRuntime = {
    recipe_runtime_catalog_version: 'server-validated-shape-fixture-v1',
    entries: [{
      recipe_id: 'shape-fixture',
      activation_status: 'preview_enabled',
      identity_level: 'canonical',
      identity_signature: {
        required_canonical_ids: ['beef-brisket'],
        required_states_or_cuts: [{ canonical_id: 'beef-brisket', value: 'brisket' }],
        forbidden_canonical_ids: [],
      },
      approved_variants: [],
      naming: { canonical_name: '牛腩做法夹具' },
    }],
  };
  assert.deepEqual(matchNamedRecipeCandidates(assets, normalizedRequest(assets, ['牛里脊'])), []);
});

test('required shape is selected from all rows with the same canonical id independent of input order', () => {
  const assets = structuredClone(productionAssets);
  assets.recipeRuntime = {
    recipe_runtime_catalog_version: 'server-validated-same-canonical-shape-v1',
    entries: [{
      recipe_id: 'sliced-beef-rice-fixture',
      activation_status: 'preview_enabled',
      identity_level: 'canonical',
      identity_signature: {
        required_canonical_ids: ['beef-generic', 'cooked-rice'],
        required_states_or_cuts: [{ canonical_id: 'beef-generic', value: 'slice' }],
        forbidden_canonical_ids: [],
      },
      approved_variants: [],
      naming: { canonical_name: '牛肉片饭夹具' },
    }],
  };
  for (const pantry of [
    ['牛肉', '牛肉片', '熟米饭'],
    ['牛肉片', '牛肉', '熟米饭'],
  ]) {
    const [candidate] = matchNamedRecipeCandidates(assets, normalizedRequest(assets, pantry));
    assert.equal(candidate.presentation.title, '牛肉片饭夹具');
    assert.equal(candidate.coverage_ratio, 2 / 3);
    assert.equal(candidate.planned_prefer_use.find(item => item.canonical_id === 'beef-generic').shape_or_cut, 'slice');
    assert.deepEqual(candidate.unused_prefer_use.map(item => item.raw), ['牛肉']);
  }
});

test('ground pork remains ground in a named candidate instead of being widened to generic pork', () => {
  const assets = structuredClone(productionAssets);
  assets.recipeRuntime = {
    recipe_runtime_catalog_version: 'server-validated-shape-fixture-v1',
    entries: [{
      recipe_id: 'ground-pork-fixture',
      activation_status: 'preview_enabled',
      identity_level: 'canonical',
      identity_signature: {
        required_canonical_ids: ['ground-pork'],
        required_states_or_cuts: [{ canonical_id: 'ground-pork', value: 'ground' }],
        forbidden_canonical_ids: [],
      },
      approved_variants: [],
      naming: { canonical_name: '猪肉末形态夹具' },
    }],
  };
  const [candidate] = matchNamedRecipeCandidates(assets, normalizedRequest(assets, ['猪肉末']));
  assert.equal(candidate.planned_prefer_use[0].canonical_id, 'ground-pork');
  assert.equal(candidate.planned_prefer_use[0].shape_or_cut, 'ground');
});

test('missing salted pork or required leafy vegetable cannot retain the Shanghai named identity', () => {
  const assets = promotedShanghaiAssets();
  for (const pantry of [
    ['大米', '小白菜'],
    ['大米', '咸五花肉'],
  ]) {
    assert.deepEqual(matchNamedRecipeCandidates(assets, normalizedRequest(assets, pantry)), []);
  }
});

test('client-supplied recipe identity cannot create or redirect a named match', () => {
  const assets = promotedShanghaiAssets();
  const request = normalizedRequest(assets, ['大米', '咸五花肉'], {
    recipe_id: 'shanghai-salted-pork-vegetable-rice',
    identity_level: 'canonical',
  });
  assert.deepEqual(matchNamedRecipeCandidates(assets, request), []);
});

test('named identity never waives the shared coverage floor when unknown items remain in the denominator', () => {
  const assets = promotedShanghaiAssets();
  assert.deepEqual(matchNamedRecipeCandidates(
    assets,
    normalizedRequest(assets, ['大米', '咸五花肉', '小白菜', '未知A', '未知B']),
  ), []);
});

test('two submitted items cannot expose a named recipe that uses only one', () => {
  const assets = structuredClone(productionAssets);
  assets.recipeRuntime = {
    recipe_runtime_catalog_version: 'server-validated-floor-fixture-v1',
    entries: [{
      recipe_id: 'one-item-fixture',
      activation_status: 'preview_enabled',
      identity_level: 'canonical',
      identity_signature: {
        required_canonical_ids: ['raw-rice'],
        required_states_or_cuts: [],
        forbidden_canonical_ids: [],
      },
      approved_variants: [],
      naming: { canonical_name: '单项夹具' },
    }],
  };
  assert.deepEqual(matchNamedRecipeCandidates(assets, normalizedRequest(assets, ['大米', '番茄'])), []);
});

test('specific identity matching preserves a generic slice and tenderloin as two submitted foods', () => {
  const assets = structuredClone(productionAssets);
  assets.recipeRuntime = {
    recipe_runtime_catalog_version: 'server-validated-exact-part-fixture-v1',
    entries: [{
      recipe_id: 'tenderloin-rice-fixture',
      activation_status: 'preview_enabled',
      identity_level: 'canonical',
      identity_signature: {
        required_canonical_ids: ['beef-tenderloin', 'cooked-rice'],
        required_states_or_cuts: [{ canonical_id: 'beef-tenderloin', value: 'tenderloin' }],
        forbidden_canonical_ids: [],
      },
      approved_variants: [],
      naming: { canonical_name: '里脊饭夹具' },
    }],
  };
  for (const pantry of [
    ['牛肉片', '牛里脊', '熟米饭'],
    ['牛里脊', '牛肉片', '熟米饭'],
  ]) {
    const [candidate] = matchNamedRecipeCandidates(assets, normalizedRequest(assets, pantry));
    assert.equal(candidate.coverage_ratio, 2 / 3);
    assert.deepEqual(candidate.planned_prefer_use.map(item => item.canonical_id).sort(), ['beef-tenderloin', 'cooked-rice']);
    assert.deepEqual(candidate.unused_prefer_use.map(item => item.raw), ['牛肉片']);
  }
});

test('matcher and planner consume the same coverage-floor function binding', () => {
  assert.equal(plannerMinimumCoverageCount, sharedMinimumCoverageCount);
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5, 6, 7, 20].map(sharedMinimumCoverageCount),
    [0, 1, 2, 2, 3, 4, 4, 5, 12],
  );
});

test('matcher consumes only a pre-reviewed variant display name and never invents one', () => {
  const assets = futureChoySumMatcherFixture();
  const entry = assets.recipeRuntime.entries
    .find(candidate => candidate.recipe_id === 'shanghai-salted-pork-vegetable-rice');
  delete entry.approved_variants[0].naming;
  assert.deepEqual(matchNamedRecipeCandidates(
    assets,
    normalizedRequest(assets, ['大米', '咸五花肉', '菜心']),
  ), []);
});

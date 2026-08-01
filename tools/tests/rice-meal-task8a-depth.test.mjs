import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { prepareRatioCatalog } from '../lib/ratio-dsl-validator.mjs';
import { selectRiceMealCandidates } from '../../worker/src/rice-meal-selector.js';
import {
  buildRiceMealPlanToken,
  compileRiceMeal,
  verifyAndRecomputeRiceMealPlan,
} from '../../worker/src/rice-meal-compiler.js';

const readAsset = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const assets = {
  catalog: readAsset('rice-meal-catalog.v1.json'),
  taxonomy: readAsset('ingredient-taxonomy.v1.json'),
  ratios: readAsset('ratio-rules.v1.json'),
  recipes: readAsset('recipe-library.json'),
  sourceEvidence: readAsset('rice-cooker-source-evidence.v1.json'),
  templates: readAsset('meal-templates.v2.json'),
};
const SECRET = 'task-8a-test-secret';

const variants = () => assets.catalog.families.flatMap(family => family.variants || []);
const variantById = id => variants().find(variant => variant.variant_id === id);
const ruleById = id => assets.ratios.rules.find(rule => rule.rule_id === id);

function candidateFor(pantry, variantId, servings = 2, ratioCatalog = assets.ratios) {
  const result = selectRiceMealCandidates({
    request: { pantry, dislikes: [], servings },
    catalog: assets.catalog,
    taxonomy: assets.taxonomy,
    ratioCatalog,
    sourceEvidence: assets.sourceEvidence,
    recentPlanIds: [],
  });
  assert.equal(result.status, 'ready', JSON.stringify(result));
  const candidate = result.candidates.find(row => row.variant_id === variantId);
  assert.ok(candidate, `${variantId} must be returned for ${pantry.join(',')}`);
  return candidate;
}

function amounts(output) {
  return Object.fromEntries(output.plan.ingredient_amounts.map(row => [row.canonical_id, row.grams]));
}

test('the focused catalog keeps eleven evidence variants and exposes eight liquid-audited Preview plans', () => {
  const active = variants().filter(variant => variant.status === 'preview_ready');
  assert.equal(assets.catalog.families.length, 3);
  assert.equal(variants().length, 11);
  assert.equal(active.length, 8);
  assert.equal(variants().filter(variant => variant.status === 'planned').length, 3);
  assert.equal(active.filter(variant => variant.nutrition_structure.grade === 'A').length, 7);
  assert.equal(active.filter(variant => variant.nutrition_structure.grade === 'B').length, 1);
  assert.equal(assets.recipes.recipes.length, 72);
});

test('group-total allocation preserves the calibrated total and declared member order', () => {
  const cases = [
    { servings: 1, corn: 38, carrot: 37, total: 75 },
    { servings: 2, corn: 75, carrot: 75, total: 150 },
    { servings: 3, corn: 113, carrot: 112, total: 225 },
    { servings: 4, corn: 150, carrot: 150, total: 300 },
  ];
  for (const row of cases) {
    const candidate = candidateFor(
      ['鸡腿', '玉米', '胡萝卜'],
      'home-corn-carrot-chicken-leg-rice',
      row.servings,
    );
    const output = compileRiceMeal(candidate, assets);
    const locked = amounts(output);
    assert.equal(locked['sweet-corn'], row.corn);
    assert.equal(locked.carrot, row.carrot);
    assert.equal(locked['sweet-corn'] + locked.carrot, row.total);
    const trace = output.plan.ratio_trace.find(entry => entry.operator === 'allocate_group_total_per_serving');
    assert.deepEqual(trace.member_canonical_ids, ['sweet-corn', 'carrot']);
    assert.equal(trace.group_total_grams, row.total);
    assert.equal(trace.allocation_policy, 'equal_split_ordered_residual');
    assert.equal(trace.amount_provenance, 'planner_allocation_not_source_individual_amounts');
  }
});

test('group-total rule rejects missing, duplicate, wrong members, and invalid totals', () => {
  const valid = structuredClone(assets.ratios);
  const rule = valid.rules.find(row => row.rule_id === 'corn-carrot-chicken-leg-covered-rice-executable-v1');
  assert.ok(rule, 'Task 8A executable group-total rule must exist');
  const operation = rule.operations.find(row => row.operator === 'allocate_group_total_per_serving');
  assert.ok(operation, 'Task 8A group-total operator must exist');

  const mutations = [
    ['missing member', op => op.member_targets.pop(), /requires exactly one quantity operation for carrot|member_targets/u],
    ['duplicate member', op => { op.member_targets[1] = structuredClone(op.member_targets[0]); }, /unique|exactly one quantity operation/u],
    ['wrong member', op => { op.member_targets[1] = { canonical_id: 'shrimp', state: 'raw', shape_or_cut: 'whole' }; }, /not an exact structured recipe identity|exactly one quantity operation/u],
    ['zero total', op => { op.grams = { min: 0, default: 0, max: 0 }; }, /positive|greater than zero/u],
    ['non-exact total', op => { op.grams = { min: 44, default: 45, max: 45 }; }, /exact group total|must satisfy/u],
  ];
  for (const [label, mutate, expected] of mutations) {
    const changed = structuredClone(valid);
    const changedOperation = changed.rules.find(row => row.rule_id === rule.rule_id)
      .operations.find(row => row.operator === operation.operator);
    mutate(changedOperation);
    const prepared = prepareRatioCatalog(changed, assets);
    assert.equal(prepared.ok, false, label);
    assert.match(prepared.errors.join('\n'), expected, label);
  }
});

test('signed ratio facts reject a tampered active group total while the second group rule is also Preview-ready', () => {
  const activeCase = {
    pantry: ['鸡腿', '玉米', '胡萝卜'],
    variant_id: 'home-corn-carrot-chicken-leg-rice',
    dish: '玉米胡萝卜鸡腿焖饭',
    rule_id: 'corn-carrot-chicken-leg-covered-rice-executable-v1',
    expected: { 'raw-rice': 200, 'chicken-leg': 110, 'sweet-corn': 75, carrot: 75, water: 280 },
  };
  const candidate = candidateFor(activeCase.pantry, activeCase.variant_id);
  const output = compileRiceMeal(candidate, assets);
  assert.equal(output.meals[0].dish_name, activeCase.dish);
  assert.deepEqual(amounts(output), activeCase.expected);
  assert.equal(Object.keys(activeCase.expected).length, output.plan.ingredient_amounts.length);

  const secondGroup = variantById('home-mushroom-green-bean-pork-rib-rice');
  assert.equal(secondGroup.status, 'preview_ready');
  assert.ok(ruleById('mushroom-green-bean-pork-rib-braised-rice-executable-v1')
    .operations.some(operation => operation.operator === 'allocate_group_total_per_serving'));

  const original = candidate;
  const token = buildRiceMealPlanToken(original, SECRET);
  const tamperedRatios = structuredClone(assets.ratios);
  const operation = tamperedRatios.rules.find(row => row.rule_id === activeCase.rule_id)
    .operations.find(row => row.operator === 'allocate_group_total_per_serving');
  operation.grams = { min: 74, default: 74, max: 74 };
  assert.throws(
    () => verifyAndRecomputeRiceMealPlan({ plan_token: token }, { ...assets, ratios: tamperedRatios }, SECRET),
    error => error?.code === 'stale_plan',
  );
});

test('Taiwan shrimp evidence remains non-executable until liquid and hot-hold kitchen validation exists', () => {
  const activeTaiwan = variants().find(variant => (
    variant.recipe_id === 'taiwan-cabbage-mushroom-rice'
    && variant.status === 'preview_ready'
  ));
  assert.equal(activeTaiwan, undefined);
  const evidenceRule = ruleById('taiwan-tomato-shrimp-rice-evidence-v1');
  assert.equal(evidenceRule.execution_mode, 'bounds_only');
  assert.equal(evidenceRule.operations.some(operation => operation.grams?.default != null || operation.default != null), false);
});

test('known six-item user journey is rejected below the sixty-percent floor without model work', () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = () => { throw new Error('Task 8A runtime must not call a model'); };
    const six = selectRiceMealCandidates({
      request: { pantry: ['鸡腿', '土豆', '排骨', '豆角', '香菇', '青菜'], dislikes: [], servings: 2 },
      catalog: assets.catalog,
      taxonomy: assets.taxonomy,
      ratioCatalog: assets.ratios,
      sourceEvidence: assets.sourceEvidence,
      recentPlanIds: [],
    });
    assert.equal(six.status, 'no_reliable_rice_meal');
    assert.deepEqual(six.candidates, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

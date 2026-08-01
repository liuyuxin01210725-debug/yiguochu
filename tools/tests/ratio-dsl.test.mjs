import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareRatioCatalog, validateRatioDslCatalog } from '../lib/ratio-dsl-validator.mjs';
import { validateMealTemplateCatalog } from '../lib/meal-template-validator.mjs';
import { compileRatioPlan } from '../../worker/src/planner-v2.js';
import { normalizeRatioGrams } from '../../worker/src/ratio-dsl.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const readJson = name => JSON.parse(fs.readFileSync(path.join(here, '../data', name), 'utf8'));
const rawCatalog = readJson('ratio-rules.v1.json');
const templates = readJson('meal-templates.v2.json');
const taxonomy = readJson('ingredient-taxonomy.v1.json');
const recipes = readJson('recipe-library.json');
const validationContext = { templates, taxonomy, recipes };
const item = (name, category, attributes = {}) => ({ name, category, attributes });
const prepared = prepareRatioCatalog(rawCatalog, validationContext);
assert.equal(prepared.ok, true);
const catalog = prepared.catalog;

const ACTIVE = new Set([
  'acid-staple-pot', 'savory-mixed-rice-pot', 'cooked-rice-stir-pot', 'broth-noodle-pot',
  'egg-tofu-vegetable-pot', 'mushroom-vegetable-stew-pot', 'beef-staple-pot', 'poultry-staple-pot',
  'braised-noodle-pot', 'broth-rice-pot',
  'soft-family-rice-pot',
]);
const OPERATORS = new Set(['per_serving', 'per_serving_by_category', 'ratio', 'bounded_sum', 'fixed_addition', 'scale_by_servings']);

function recipeBoundsRule() {
  return {
    rule_id: 'shanghai-salted-pork-liquid-evidence-v1',
    evidence_recipe_ids: ['shanghai-salted-pork-vegetable-rice'],
    execution_mode: 'bounds_only',
    when: { recipe_id: 'shanghai-salted-pork-vegetable-rice' },
    operations: [
      {
        operator: 'reference_quantity',
        target: { canonical_id: 'raw-rice', state: 'raw' },
        grams: { min: 100, max: 100 },
      },
      {
        operator: 'ratio',
        target: { name: '水', category: 'liquid' },
        numerator: { resource: 'retained_liquid_grams' },
        denominator: { canonical_id: 'raw-rice', state: 'raw', measure: 'grams' },
        min: 1.25,
        max: 1.4,
      },
    ],
    rounding: { grams_to_nearest: 1 },
    example_context: { ingredient_name: '大米' },
  };
}

function catalogWithRecipeRule(rule = recipeBoundsRule()) {
  const next = structuredClone(rawCatalog);
  next.rules = next.rules.filter(candidate => !candidate.when?.recipe_id);
  next.rules.push(rule);
  return next;
}

function executableShanghaiRule() {
  const rule = recipeBoundsRule();
  rule.execution_mode = 'executable';
  rule.operations = [
    { operator: 'per_serving', target: { canonical_id: 'raw-rice', state: 'raw' }, grams: { min: 100, default: 100, max: 100 } },
    { operator: 'per_serving', target: { canonical_id: 'salted-pork-belly', state: 'cured', shape_or_cut: 'cured_slice' }, grams: { min: 50, default: 50, max: 50 } },
    { operator: 'per_serving', target: { canonical_id: 'small-bok-choy', state: 'raw' }, grams: { min: 75, default: 75, max: 75 } },
    {
      operator: 'ratio',
      target: { name: '水', category: 'liquid' },
      numerator: { resource: 'retained_liquid_grams' },
      denominator: { canonical_id: 'raw-rice', state: 'raw', measure: 'grams' },
      min: 1.3,
      default: 1.3,
      max: 1.3,
    },
  ];
  return rule;
}

function executableNorthChinaNoodleRule() {
  return {
    rule_id: 'test-fixture-north-china-staged-liquid-v1',
    evidence_recipe_ids: ['north-china-green-bean-braised-noodles'],
    execution_mode: 'executable',
    when: { recipe_id: 'north-china-green-bean-braised-noodles' },
    operations: [
      { operator: 'per_serving', target: { canonical_id: 'fresh-wheat-noodle', state: 'raw', shape_or_cut: 'whole' }, grams: { min: 100, default: 100, max: 100 } },
      { operator: 'per_serving', target: { canonical_id: 'green-beans', state: 'raw' }, grams: { min: 90, default: 90, max: 90 } },
      { operator: 'per_serving', target: { canonical_id: 'ground-pork', state: 'raw', shape_or_cut: 'ground' }, grams: { min: 80, default: 80, max: 80 } },
      {
        operator: 'ratio', target: { name: '水', category: 'liquid' },
        numerator: { resource: 'retained_liquid_grams' },
        denominator: { canonical_id: 'fresh-wheat-noodle', state: 'raw', shape_or_cut: 'whole', measure: 'grams' },
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
}

test('ratio grams normalize exactly once at the executable DSL boundary', () => {
  assert.equal(normalizeRatioGrams(133.3, 1), 133);
  assert.equal(normalizeRatioGrams(133.3, 5), 135);
  assert.equal(normalizeRatioGrams(0, 5), 0);
  assert.throws(() => normalizeRatioGrams(10, 0), /invalid_ratio_grams/);
  assert.throws(() => normalizeRatioGrams(-1, 1), /invalid_ratio_grams/);
});

test('recipe liquid contract distinguishes added water, measurable total liquid, and cooker water line', () => {
  const executable = executableShanghaiRule();
  executable.liquid_contract = {
    kind: 'total_free_liquid',
    measured_contributor_ids: ['water'],
    measurement: 'weigh_before_loading',
    display_precision: 'approximate',
    display_rounding_grams: 10,
  };
  assert.equal(prepareRatioCatalog(catalogWithRecipeRule(executable), validationContext).ok, true);

  const foodMoisture = structuredClone(executable);
  foodMoisture.liquid_contract.measured_contributor_ids = ['small-bok-choy'];
  const moistureResult = prepareRatioCatalog(catalogWithRecipeRule(foodMoisture), validationContext);
  assert.equal(moistureResult.ok, false);
  assert.match(moistureResult.errors.join('\n'), /total_free_liquid requires unique known measured contributors/u);

  const waterLine = structuredClone(executable);
  waterLine.liquid_contract = {
    kind: 'cooker_water_line',
    measurement: 'cooker_mark',
    display_precision: 'appliance_mark',
    cup_source: 'manufacturer_cup',
    line_code: 'white_rice',
  };
  assert.equal(prepareRatioCatalog(catalogWithRecipeRule(waterLine), validationContext).ok, true);
});

test('Ratio DSL catalog covers every active template with only the six executable operators', () => {
  assert.equal(catalog.ratio_dsl_version, 1);
  assert.equal(catalog.ratio_catalog_version, 'ratio-rules-v1-20260801-r12');
  assert.deepEqual(validateRatioDslCatalog(catalog, templates, taxonomy, recipes), []);
  assert.deepEqual(validateMealTemplateCatalog(templates, taxonomy, recipes, catalog), []);

  const refs = new Set();
  for (const template of templates.templates.filter(template => ACTIVE.has(template.template_id))) {
    for (const ref of template.ratio_constraints) refs.add(ref);
  }
  const templateRules = catalog.rules.filter(rule => rule.when?.template_id);
  assert.deepEqual(new Set(templateRules.map(rule => rule.rule_id)), refs);
  for (const rule of templateRules) {
    assert.ok(rule.operations.length > 0);
    for (const operation of rule.operations) assert.ok(OPERATORS.has(operation.operator));
    assert.ok(
      rule.operations.some(operation => operation.target?.category === 'oil'),
      `${rule.rule_id} must provide a measured cooking oil baseline`,
    );
    assert.ok(
      rule.operations.some(operation => operation.target?.category === 'seasoning'),
      `${rule.rule_id} must provide a measured salt baseline`,
    );
    const template = templates.templates.find(entry => entry.template_id === rule.when.template_id);
    for (const slot of template.required_slots.filter(slot => slot.source_policy.includes('user'))) {
      assert.equal(rule.operations.filter(operation => ['per_serving', 'per_serving_by_category'].includes(operation.operator)
        && operation.target.slot_id === slot.slot_id).length, 1, `${rule.rule_id}/${slot.slot_id}`);
    }
  }
});

test('fresh noodle ratio is canonical-scoped and locks staged liquid', () => {
  const rule = rawCatalog.rules.find(row => row.rule_id === 'braised-fresh-wheat-noodle-liquid-v1');
  assert.ok(rule, 'missing braised-fresh-wheat-noodle-liquid-v1');
  assert.deepEqual(rule.when.canonical_ids, ['fresh-wheat-noodle']);
  assert.deepEqual(rule.liquid_distribution, {
    initial_fraction: 0.8,
    reserve_fraction: 0.2,
    reserve_action_code: 'add_reserved_liquid_if_needed',
  });
  const result = compileRatioPlan(rule.rule_id, {
    servings: 2,
    slots: {
      staple: [{ name:'鲜小麦面条', category:'noodle', canonical_id:'fresh-wheat-noodle', ratio_rule_policy:'canonical_required', attributes:{} }],
      vegetable: [{ name:'豆角', category:'pod_vegetable', canonical_id:'green-beans', ratio_rule_policy:'category_fallback', attributes:{ moisture_release:'low' } }],
      protein: [{ name:'猪肉末', category:'pork', canonical_id:'ground-pork', ratio_rule_policy:'category_fallback', attributes:{} }],
    },
  }, catalog);
  assert.equal(result.ok, true);
  assert.deepEqual(result.ingredient_amounts, [
    { name:'豆角', grams:180 },
    { name:'食用油', grams:7 },
    { name:'水', grams:170 },
    { name:'鲜小麦面条', grams:200 },
    { name:'盐', grams:3 },
    { name:'猪肉末', grams:160 },
  ]);
  assert.deepEqual(result.liquid_constraints, {
    retained_liquid_grams:170,
    liquid_credit_grams:0,
    rounding_grams:1,
    initial_liquid_grams:136,
    reserve_liquid_grams:34,
    reserve_action_code:'add_reserved_liquid_if_needed',
  });
});

test('ratio validator rejects unknown canonical scope and invalid liquid split', () => {
  const unknown = structuredClone(rawCatalog);
  const unknownRule = unknown.rules.find(row => row.rule_id === 'braised-fresh-wheat-noodle-liquid-v1');
  assert.ok(unknownRule, 'missing braised-fresh-wheat-noodle-liquid-v1');
  unknownRule.when.canonical_ids = ['invented-noodle'];
  assert.match(validateRatioDslCatalog(unknown, templates, taxonomy, recipes).join('\n'), /known canonical identities/);

  const split = structuredClone(rawCatalog);
  const splitRule = split.rules.find(row => row.rule_id === 'braised-fresh-wheat-noodle-liquid-v1');
  assert.ok(splitRule, 'missing braised-fresh-wheat-noodle-liquid-v1');
  splitRule.liquid_distribution.reserve_fraction = 0.3;
  assert.match(validateRatioDslCatalog(split, templates, taxonomy, recipes).join('\n'), /sum to 1/);
});

test('raw ratio catalog explicitly quantifies every user slot without prepare-time synthesis', () => {
  const rawResult = prepareRatioCatalog(rawCatalog, validationContext);
  assert.equal(rawResult.ok, true);
  assert.deepEqual(rawResult.catalog.rules, rawCatalog.rules);
  for (const rule of rawCatalog.rules.filter(candidate => candidate.when?.template_id)) {
    const template = templates.templates.find(entry => entry.template_id === rule.when.template_id);
    const userSlots = [...template.required_slots, ...template.optional_slots]
      .filter(slot => slot.source_policy.includes('user'))
      .map(slot => slot.slot_id);
    for (const slotId of userSlots) {
      assert.equal(rule.operations.filter(operation => ['per_serving', 'per_serving_by_category'].includes(operation.operator)
        && operation.target.slot_id === slotId).length, 1, `${rule.rule_id}/${slotId}`);
    }
  }
});

test('strict validator rejects unknown nested shapes and invalid ratio semantics', () => {
  const invalid = structuredClone(rawCatalog);
  invalid.rules[0].when.extra = true;
  invalid.rules[0].operations[0].target.extra = true;
  const ratioOperation = invalid.rules[0].operations.find(operation => operation.operator === 'ratio');
  ratioOperation.numerator.resource = 'recipe_prose';
  ratioOperation.denominator.measure = 'cups';
  ratioOperation.target.extra = true;
  invalid.rules[0].rounding.extra = true;
  invalid.rules[0].example_context.extra = true;
  const errors = validateRatioDslCatalog(invalid, templates, taxonomy, recipes);
  for (const expected of ['when unknown key', 'target unknown key', 'numerator.resource is invalid', 'denominator must measure', 'rounding unknown key', 'example_context unknown key']) {
    assert.ok(errors.some(error => error.includes(expected)), expected);
  }
});

test('rice and liquid compile deterministically from explicit high-moisture credit', () => {
  const result = compileRatioPlan('acid-staple-raw-rice-liquid-v1', {
    servings: 2,
    slots: { staple: ['大米'], acid_base: ['番茄'] },
    attributes: { 番茄: { moisture_release: 'high' } },
  }, catalog);

  assert.deepEqual(result.ingredient_amounts, [
    { name: '大米', grams: 200 },
    { name: '番茄', grams: 300 },
    { name: '食用油', grams: 6 },
    { name: '水', grams: 160 },
    { name: '盐', grams: 3 },
  ]);
  assert.deepEqual(result.required_extra_items, [
    { name: '食用油', category: 'oil', grams: 6 },
    { name: '水', category: 'liquid', grams: 160 },
    { name: '盐', category: 'seasoning', grams: 3 },
  ]);
  assert.equal(result.liquid_constraints.retained_liquid_grams, 160);
  assert.deepEqual(result.ratio_trace.map(entry => entry.operator), [
    'per_serving', 'per_serving', 'bounded_sum', 'ratio', 'fixed_addition', 'scale_by_servings',
  ]);
});

test('quick ratio rules stay inside their declared time and serving bounds', () => {
  const quickRules = catalog.rules.filter(rule => rule.when?.template_id).filter(rule => {
    const template = templates.templates.find(entry => entry.template_id === rule.when.template_id);
    return template.supported_intents.includes('quick');
  });
  assert.ok(quickRules.length > 0);
  for (const rule of quickRules) {
    const template = templates.templates.find(entry => entry.template_id === rule.when.template_id);
    assert.ok(template.time_range.max_minutes <= 30, rule.rule_id);
  }
});

test('fixed additions and serving-scaled additions produce ordered, non-zero basic extras', () => {
  const result = compileRatioPlan('savory-mixed-rice-liquid-v1', {
    servings: 2,
    slots: { staple: ['大米'] },
    attributes: {},
  }, catalog);
  assert.equal(result.ok, true);
  assert.deepEqual(result.required_extra_items, [
    { name: '食用油', category: 'oil', grams: 10 },
    { name: '水', category: 'liquid', grams: 270 },
    { name: '盐', category: 'seasoning', grams: 3 },
  ]);
  assert.deepEqual(result.ratio_trace.map(entry => entry.operator), [
    'per_serving', 'bounded_sum', 'ratio', 'fixed_addition', 'scale_by_servings',
  ]);
  assert.deepEqual(
    compileRatioPlan('savory-mixed-rice-liquid-v1', { servings: 2, slots: { staple: ['大米'] }, attributes: {} }, catalog),
    result,
  );
});

test('savory rice omits preset oil and salt for cured fat-rendering protein', () => {
  const context = {
    servings: 2,
    slots: {
      staple: [item('大米', 'raw_rice')],
      protein: [item('咸五花肉', 'pork', {
        texture_behavior: 'renders_fat_when_heated',
        texture_failure_modes: ['salty_when_overseasoned'],
      })],
      fast_vegetable: [item('小白菜', 'leafy_vegetable', { moisture_release: 'high' })],
    },
  };
  const result = compileRatioPlan('savory-mixed-rice-liquid-v1', context, catalog);
  assert.equal(result.ok, true);
  assert.deepEqual(result.required_extra_items.map(row => row.name), ['水']);
  assert.deepEqual(
    result.ratio_trace.filter(row => ['食用油', '盐'].includes(row.name)).map(row => ({
      name: row.name,
      applied: row.applied,
      matched_items: row.skip_reason?.matched_items,
    })),
    [
      { name: '食用油', applied: false, matched_items: ['咸五花肉'] },
      { name: '盐', applied: false, matched_items: ['咸五花肉'] },
    ],
  );
  assert.deepEqual(compileRatioPlan('savory-mixed-rice-liquid-v1', context, catalog), result);
});

test('savory rice keeps preset oil and salt for fresh protein', () => {
  const result = compileRatioPlan('savory-mixed-rice-liquid-v1', {
    servings: 2,
    slots: {
      staple: [item('大米', 'raw_rice')],
      protein: [item('鸡腿肉', 'chicken', {
        texture_behavior: 'tender_when_cooked_through',
        texture_failure_modes: ['dry_when_overcooked'],
      })],
    },
  }, catalog);
  assert.equal(result.ok, true);
  assert.ok(result.required_extra_items.some(row => row.name === '食用油'));
  assert.ok(result.required_extra_items.some(row => row.name === '盐'));
  assert.ok(result.ratio_trace
    .filter(row => ['食用油', '盐'].includes(row.name))
    .every(row => row.applied === true));
});

test('Ratio DSL accepts only finite guards on basic additions', () => {
  const guarded = structuredClone(rawCatalog);
  const savory = guarded.rules.find(rule => rule.rule_id === 'savory-mixed-rice-liquid-v1');
  savory.operations.find(operation => operation.target?.name === '食用油').skip_when = {
    slot_id: 'protein',
    attribute: 'texture_behavior',
    match: 'equals',
    value: 'renders_fat_when_heated',
  };
  savory.operations.find(operation => operation.target?.name === '盐').skip_when = {
    slot_id: 'protein',
    attribute: 'texture_failure_modes',
    match: 'contains',
    value: 'salty_when_overseasoned',
  };
  assert.deepEqual(validateRatioDslCatalog(guarded, templates, taxonomy, recipes), []);

  for (const [field, value, expected] of [
    ['slot_id', 'missing_slot', 'declared user slot'],
    ['attribute', 'states', 'controlled attribute match'],
    ['match', 'regex', 'controlled attribute match'],
    ['value', 'invented_value', 'controlled attribute match'],
  ]) {
    const invalid = structuredClone(guarded);
    invalid.rules.find(rule => rule.rule_id === 'savory-mixed-rice-liquid-v1')
      .operations.find(operation => operation.target?.name === '食用油').skip_when[field] = value;
    assert.ok(
      validateRatioDslCatalog(invalid, templates, taxonomy, recipes)
        .some(error => error.includes(expected)),
      field,
    );
  }

  for (const operator of ['per_serving', 'ratio', 'bounded_sum']) {
    const invalid = structuredClone(guarded);
    const operation = invalid.rules.flatMap(rule => rule.operations)
      .find(entry => entry.operator === operator);
    operation.skip_when = {
      slot_id: 'staple',
      attribute: 'texture_behavior',
      match: 'equals',
      value: 'absorbs_liquid',
    };
    assert.ok(validateRatioDslCatalog(invalid, templates, taxonomy, recipes)
      .some(error => error.includes('unknown key: skip_when')), operator);
  }
});

test('savory mixed rice credits high-moisture vegetables without hiding their grams', () => {
  const result = compileRatioPlan('savory-mixed-rice-liquid-v1', {
    servings: 2,
    slots: {
      staple: [item('大米', 'raw_rice')],
      fast_vegetable: [item('白菜', 'leafy_vegetable', { moisture_release: 'high' })],
    },
  }, catalog);
  assert.equal(result.ok, true);
  assert.deepEqual(result.ingredient_amounts, [
    { name: '白菜', grams: 240 },
    { name: '大米', grams: 200 },
    { name: '食用油', grams: 10 },
    { name: '水', grams: 240 },
    { name: '盐', grams: 3 },
  ]);
  assert.equal(result.liquid_constraints.liquid_credit_grams, 30);
});

test('braised noodle ratio deterministically measures noodles, vegetables, protein and retained liquid', () => {
  const result = compileRatioPlan('braised-noodle-liquid-v1', {
    servings: 2,
    slots: {
      staple: [item('面条', 'noodle')],
      vegetable: [item('白菜', 'leafy_vegetable', { moisture_release: 'high' })],
      protein: [item('鸡腿肉', 'chicken')],
    },
  }, catalog);
  assert.equal(result.ok, true);
  assert.deepEqual(result.ingredient_amounts, [
    { name: '白菜', grams: 180 },
    { name: '鸡腿肉', grams: 160 },
    { name: '面条', grams: 200 },
    { name: '食用油', grams: 7 },
    { name: '水', grams: 330 },
    { name: '盐', grams: 3 },
  ]);
  assert.equal(result.liquid_constraints.liquid_credit_grams, 30);
});

test('Ratio DSL validator is total and rejects malformed nested operations, unknown operators, and non-basic extras', () => {
  const invalid = structuredClone(catalog);
  invalid.rules[0].operations[0].grams.default = -1;
  invalid.rules[1].operations[0].operator = 'recipe_text_expression';
  invalid.rules[2].operations.push({ operator: 'fixed_addition', target: { name: '豆腐', category: 'firm_tofu' }, grams: { min: 1, default: 2, max: 3 } });
  invalid.rules[3].operations = [{ operator: 'ratio', numerator: null, denominator: [] }];
  assert.doesNotThrow(() => validateRatioDslCatalog(invalid, templates, taxonomy, recipes));
  const errors = validateRatioDslCatalog(invalid, templates, taxonomy, recipes);
  for (const expected of ['non-negative', 'unknown operator', 'basic extra', 'must be an object']) {
    assert.ok(errors.some(error => error.includes(expected)), expected);
  }
});

test('Ratio DSL validator rejects duplicate rules, stale references, and unknown keys without throwing', () => {
  const invalid = structuredClone(catalog);
  invalid.rules.push(structuredClone(invalid.rules[0]));
  invalid.rules[0].when.template_id = 'not-a-template';
  invalid.rules[1].operations[0].surprise = true;
  invalid.rules[2].evidence_recipe_ids = ['not-a-recipe'];
  invalid.rules[3].rounding.grams_to_nearest = 0;
  assert.doesNotThrow(() => validateRatioDslCatalog(invalid, templates, taxonomy, recipes));
  const errors = validateRatioDslCatalog(invalid, templates, taxonomy, recipes);
  for (const expected of ['duplicate rule_id', 'unknown template', 'unknown key', 'unknown evidence recipe', 'rounding']) {
    assert.ok(errors.some(error => error.includes(expected)), expected);
  }
});

test('ratio compiler returns structured failure for missing context instead of parsing recipe prose', () => {
  const result = compileRatioPlan('acid-staple-raw-rice-liquid-v1', { servings: 2, slots: {} }, catalog);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'ratio_context_missing');
  assert.deepEqual(result.ingredient_amounts, []);
});

test('ratio compiler safely rejects malformed nested operation data without emitting unnamed extras', () => {
  const malformed = structuredClone(catalog);
  malformed.rules[0].operations[2].target = { category: 'liquid' };
  const result = compileRatioPlan('acid-staple-raw-rice-liquid-v1', {
    servings: 2,
    slots: { staple: ['大米'], acid_base: ['番茄'] },
    attributes: { 番茄: { moisture_release: 'high' } },
  }, malformed);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'ratio_rule_invalid');
  assert.deepEqual(result.required_extra_items, []);
});

test('ratio validator rejects forged basic-extra categories and invalid active rule ordering or liquid coverage', () => {
  const invalid = structuredClone(catalog);
  invalid.rules[3].operations[2].target.name = '豆腐';
  const orderedRule = invalid.rules.find(rule => rule.rule_id === 'acid-staple-raw-rice-liquid-v1');
  const bounded = orderedRule.operations.find(operation => operation.operator === 'bounded_sum');
  orderedRule.operations = [bounded, ...orderedRule.operations.filter(operation => operation !== bounded)];
  invalid.rules[3].operations = invalid.rules[3].operations.filter(operation => operation.operator !== 'ratio');
  invalid.rules[4].operations = invalid.rules[4].operations.filter(operation => operation.operator !== 'per_serving');
  const errors = validateRatioDslCatalog(invalid, templates, taxonomy, recipes);
  for (const expected of ['operations must be ordered', 'missing retained liquid operation', 'exactly one per_serving']) {
    assert.ok(errors.some(error => error.includes(expected)), expected);
  }
});

test('compiler rejects forged extras and records scaled liquid in liquid constraints', () => {
  const forged = structuredClone(catalog);
  forged.rules[3].operations[2].target.name = '豆腐';
  forged.rules[3].operations[2].target.category = 'seasoning';
  const rejected = compileRatioPlan('savory-mixed-rice-liquid-v1', {
    servings: 2,
    slots: { staple: ['大米'] },
    attributes: {},
  }, forged);
  assert.equal(rejected.ok, false);
  assert.equal(rejected.code, 'ratio_rule_invalid');

  const scaledLiquid = compileRatioPlan('egg-tofu-vegetable-egg-portion-v1', {
    servings: 2,
    slots: { protein: ['鸡蛋'], vegetable: ['青菜'] },
    attributes: {},
  }, catalog);
  assert.equal(scaledLiquid.ok, true);
  assert.deepEqual(scaledLiquid.required_extra_items.find(item => item.name === '水'), { name: '水', category: 'liquid', grams: 300 });
  assert.equal(scaledLiquid.liquid_constraints.retained_liquid_grams, 300);
});

test('category-specific rules quantify every required staple and reject mismatched runtime categories', () => {
  const beefRice = compileRatioPlan('beef-staple-cooked-rice-portion-v1', {
    servings: 2,
    slots: { protein: [item('牛里脊', 'beef')], staple: [item('熟米饭', 'cooked_rice')] },
  }, catalog);
  assert.equal(beefRice.ok, true);
  assert.deepEqual(
    beefRice.ingredient_amounts.filter(row => row.name === '牛里脊' || row.name === '熟米饭'),
    [{ name: '牛里脊', grams: 200 }, { name: '熟米饭', grams: 360 }],
  );

  const poultryRice = compileRatioPlan('poultry-staple-raw-rice-portion-v1', {
    servings: 2,
    slots: { protein: [item('鸡腿肉', 'chicken')], staple: [item('大米', 'raw_rice')] },
  }, catalog);
  assert.equal(poultryRice.ok, true);
  assert.ok(poultryRice.ingredient_amounts.some(row => row.name === '大米' && row.grams > 0));

  const wrongRice = compileRatioPlan('acid-staple-raw-rice-liquid-v1', {
    servings: 2,
    slots: { staple: [item('熟米饭', 'cooked_rice')], acid_base: [item('番茄', 'acid_vegetable', { moisture_release: 'high' })] },
  }, catalog);
  assert.equal(wrongRice.code, 'ratio_context_category_mismatch');

  const wrongProtein = compileRatioPlan('egg-tofu-vegetable-egg-portion-v1', {
    servings: 2,
    slots: { protein: [item('老豆腐', 'firm_tofu')], vegetable: [item('青菜', 'leafy_vegetable')] },
  }, catalog);
  assert.equal(wrongProtein.code, 'ratio_context_category_mismatch');
});

test('quantified set prevents bounded_sum double-counting and quantifies every supplied optional item', () => {
  const mushroom = compileRatioPlan('mushroom-vegetable-stew-liquid-v1', {
    servings: 2,
    slots: { mushroom: [item('金针菇', 'mushroom', { moisture_release: 'medium' })], vegetable: [item('白菜', 'leafy_vegetable', { moisture_release: 'medium' })] },
  }, catalog);
  assert.equal(mushroom.ok, true);
  assert.equal(mushroom.ingredient_amounts.find(row => row.name === '金针菇').grams, 200);

  const optionalLeak = compileRatioPlan('egg-tofu-vegetable-egg-portion-v1', {
    servings: 2,
    slots: { protein: [item('鸡蛋', 'egg')], vegetable: [item('青菜', 'leafy_vegetable')], mushroom: [item('金针菇', 'mushroom')] },
  }, catalog);
  assert.equal(optionalLeak.ok, true);
  assert.ok(optionalLeak.ingredient_amounts.every(row => row.grams > 0));
  assert.ok(optionalLeak.ingredient_amounts.some(row => row.name === '金针菇'));
});

test('direct compilation rejects an unvalidated catalog and never rounds positive grams to zero', () => {
  const invalid = structuredClone(catalog);
  invalid.rules.push(structuredClone(invalid.rules[0]));
  const duplicate = compileRatioPlan('acid-staple-raw-rice-liquid-v1', {
    servings: 2,
    slots: { staple: [item('大米', 'raw_rice')], acid_base: [item('番茄', 'acid_vegetable', { moisture_release: 'high' })] },
  }, invalid);
  assert.equal(duplicate.code, 'ratio_rule_invalid');

  const tiny = structuredClone(catalog);
  tiny.rules[0].operations[0].grams = { min: 0.1, default: 0.1, max: 0.1 };
  const rounded = compileRatioPlan('acid-staple-raw-rice-liquid-v1', {
    servings: 1,
    slots: { staple: [item('大米', 'raw_rice')], acid_base: [item('番茄', 'acid_vegetable', { moisture_release: 'high' })] },
  }, tiny);
  assert.equal(rounded.code, 'ratio_rule_invalid');

  for (const mutate of [
    draft => { draft.rules[0].operations[0].grams.default = -1; },
    draft => { draft.rules[0].operations = [draft.rules[0].operations[3], ...draft.rules[0].operations.slice(1)]; },
    draft => { draft.rules[0].when.category = 'cooked_rice'; },
  ]) {
    const unsafe = structuredClone(catalog);
    mutate(unsafe);
    const result = compileRatioPlan('acid-staple-raw-rice-liquid-v1', {
      servings: 2,
      slots: { staple: [item('大米', 'raw_rice')], acid_base: [item('番茄', 'acid_vegetable', { moisture_release: 'high' })] },
    }, unsafe);
    assert.equal(result.code, 'ratio_rule_invalid');
  }
});

test('validator requires a complete required-slot category variant set for every active template', () => {
  const incomplete = structuredClone(catalog);
  incomplete.rules = incomplete.rules.filter(rule => rule.rule_id !== 'poultry-staple-noodle-portion-v1');
  const errors = validateRatioDslCatalog(incomplete, templates, taxonomy, recipes);
  assert.ok(errors.some(error => error.includes('poultry-staple-pot missing complete required category variant coverage')));
});

test('runtime resolves taxonomy identities, rejects spoofed or incompatible slots, and has stable output order', () => {
  for (const slots of [
    { protein:[item('豆腐','egg')], vegetable:[item('青菜','leafy_vegetable')] },
    { protein:[item('鸡蛋','egg')], vegetable:[item('鸡蛋','egg')] },
    { protein:[item('鸡蛋','egg')], vegetable:[item('青菜','leafy_vegetable')], mushroom:[item('牛里脊','beef')] },
  ]) {
    assert.equal(compileRatioPlan('egg-tofu-vegetable-egg-portion-v1', { servings:2, slots }, catalog).ok, false);
  }
  const forward = compileRatioPlan('acid-staple-raw-rice-liquid-v1', { servings:2, slots:{ staple:[item('大米','raw_rice')], acid_base:[item('番茄','acid_vegetable',{moisture_release:'high'})], protein:[item('鸡腿肉','chicken')] } }, catalog);
  const reverse = compileRatioPlan('acid-staple-raw-rice-liquid-v1', { servings:2, slots:{ protein:[item('鸡腿肉','chicken')], acid_base:[item('番茄','acid_vegetable',{moisture_release:'high'})], staple:[item('大米','raw_rice')] } }, catalog);
  assert.deepEqual(reverse.ingredient_amounts, forward.ingredient_amounts);
  assert.deepEqual(reverse.required_extra_items, forward.required_extra_items);
});

test('every active template accepts a real optional composition without silently dropping an item', () => {
  const probes = [
    ['acid-staple-raw-rice-liquid-v1',{staple:[item('大米','raw_rice')],acid_base:[item('番茄','acid_vegetable',{moisture_release:'high'})],protein:[item('鸡腿肉','chicken')]}],
    ['savory-mixed-rice-liquid-v1',{staple:[item('大米','raw_rice')],protein:[item('鸡蛋','egg')],fast_vegetable:[item('青菜','leafy_vegetable')]}],
    ['cooked-rice-stir-portion-v1',{staple:[item('熟米饭','cooked_rice')],vegetable:[item('青菜','leafy_vegetable')]}],
    ['broth-noodle-liquid-v1',{staple:[item('面条','noodle')],protein:[item('鸡蛋','egg')]}],
    ['egg-tofu-vegetable-egg-portion-v1',{protein:[item('鸡蛋','egg')],vegetable:[item('青菜','leafy_vegetable')],mushroom:[item('金针菇','mushroom')]}],
    ['mushroom-vegetable-stew-liquid-v1',{mushroom:[item('金针菇','mushroom')],vegetable:[item('青菜','leafy_vegetable')],protein:[item('老豆腐','firm_tofu')]}],
    ['beef-staple-cooked-rice-portion-v1',{protein:[item('牛里脊','beef')],staple:[item('熟米饭','cooked_rice')],vegetable:[item('西兰花','cruciferous_vegetable')]}],
    ['poultry-staple-raw-rice-portion-v1',{protein:[item('鸡腿肉','chicken')],staple:[item('大米','raw_rice')],mushroom:[item('金针菇','mushroom')]}],
    ['braised-noodle-liquid-v1',{staple:[item('面条','noodle')],vegetable:[item('豆角','pod_vegetable')],protein:[item('猪里脊','pork')]}],
  ];
  for (const [ruleId, slots] of probes) {
    const result = compileRatioPlan(ruleId,{servings:2,slots},catalog);
    assert.equal(result.ok,true,ruleId);
    for (const rows of Object.values(slots)) for (const supplied of rows) assert.ok(result.ingredient_amounts.some(row => row.name === supplied.name && row.grams > 0), `${ruleId}/${supplied.name}`);
  }
});

test('every executable template ratio rule emits only normalized integer gram amounts', () => {
  const identityFor = (categories, canonicalIds = []) => {
    const allowed = new Set(categories);
    const scoped = new Set(canonicalIds);
    const identity = taxonomy.items.find(entry => allowed.has(entry.category)
      && (!scoped.size || scoped.has(entry.canonical_id))
      && (scoped.size || entry.ratio_rule_policy !== 'canonical_required'));
    assert.ok(identity, `missing taxonomy identity for ${[...allowed].join(',')}`);
    return item(identity.display_name, identity.category, {
      moisture_release: identity.moisture_release,
      texture_behavior: identity.texture_behavior?.behavior_code,
      texture_failure_modes: identity.texture_behavior?.failure_mode_codes || [],
    });
  };

  for (const rule of catalog.rules.filter(candidate => candidate.when?.template_id)) {
    const template = templates.templates.find(entry => entry.template_id === rule.when.template_id);
    const slots = {};
    for (const slot of template.required_slots.filter(entry => entry.source_policy.includes('user'))) {
      const categories = slot.slot_id === rule.when.slot_id
        ? [rule.when.category]
        : template.ingredient_categories[slot.slot_id];
      slots[slot.slot_id] = [identityFor(categories, slot.slot_id === rule.when.slot_id
        ? rule.when.canonical_ids
        : [])];
    }
    const compiled = compileRatioPlan(rule.rule_id, { servings: 3, slots }, catalog);
    assert.equal(compiled.ok, true, rule.rule_id);
    for (const row of [...compiled.ingredient_amounts, ...compiled.required_extra_items]) {
      assert.equal(Number.isSafeInteger(row.grams), true, `${rule.rule_id}/${row.name}/${row.grams}`);
      assert.ok(row.grams >= 0, `${rule.rule_id}/${row.name}`);
    }
    for (const [key, grams] of Object.entries(compiled.liquid_constraints)) {
      if (!key.endsWith('_grams')) continue;
      assert.equal(Number.isSafeInteger(grams), true, `${rule.rule_id}/${key}/${grams}`);
      assert.ok(grams >= 0, `${rule.rule_id}/${key}`);
    }
  }
});

test('planner runtime dependency graph stays inside worker/src', () => {
  const root = path.resolve(here, '../../worker/src');
  const pending = [path.join(root, 'planner-v2.js')];
  const seen = new Set();
  while (pending.length) {
    const file = pending.pop();
    if (seen.has(file)) continue;
    seen.add(file);
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const specifier = match[1];
      assert.ok(specifier.startsWith('./'), `${file} escapes runtime source: ${specifier}`);
      const next = path.resolve(path.dirname(file), specifier);
      assert.ok(next.startsWith(root), `${file} escapes worker/src: ${specifier}`);
      pending.push(next.endsWith('.js') ? next : `${next}.js`);
    }
  }
});

test('prepare returns a deeply frozen defensive catalog and raw input cannot compile', () => {
  const raw = structuredClone(rawCatalog);
  const result = prepareRatioCatalog(raw, validationContext);
  assert.equal(result.ok, true);
  assert.notEqual(result.catalog, raw);
  assert.equal(Object.isFrozen(result.catalog), true);
  assert.equal(Object.isFrozen(result.catalog.rules[0].operations[0]), true);
  raw.rules[0].operations.push({ operator:'per_serving', target:{slot_id:'staple'}, grams:{min:80,default:100,max:120} });
  assert.equal(compileRatioPlan('acid-staple-raw-rice-liquid-v1',{servings:2,slots:{staple:[item('大米','raw_rice')],acid_base:[item('番茄','acid_vegetable',{moisture_release:'high'})]}},raw).ok,false);
  assert.throws(() => { result.catalog.rules[0].operations.push({}); }, TypeError);
});

test('high-moisture optional vegetables are quantified once before bounded_sum credit', () => {
  const result = compileRatioPlan('acid-staple-raw-rice-liquid-v1', { servings:2, slots:{
    staple:[item('大米','raw_rice')], acid_base:[item('番茄','acid_vegetable',{moisture_release:'high'})],
    vegetable:[item('白菜','leafy_vegetable',{moisture_release:'high'})], mushroom:[item('金针菇','mushroom',{moisture_release:'high'})],
  } }, catalog);
  assert.equal(result.ok,true);
  assert.equal(result.ingredient_amounts.find(row => row.name === '白菜').grams,240);
  assert.equal(result.ingredient_amounts.find(row => row.name === '金针菇').grams,200);
});

test('broth rice compiles evidence-derived quantities for two servings', () => {
  const result = compileRatioPlan('broth-rice-liquid-v1', {
    servings: 2,
    slots: {
      staple: [item('熟米饭', 'cooked_rice')],
      protein: [item('鸡蛋', 'egg')],
      fast_vegetable: [item('白菜', 'leafy_vegetable')],
      liquid: [item('水', 'liquid')],
    },
  }, catalog);
  assert.equal(result.ok, true);
  assert.deepEqual(new Map(result.ingredient_amounts.map(row => [row.name, row.grams])), new Map([
    ['水', 648],
    ['熟米饭', 360],
    ['白菜', 220],
    ['鸡蛋', 130],
    ['食用油', 4],
    ['盐', 3],
  ]));
  assert.deepEqual(result.required_extra_items, [
    { name: '食用油', category: 'oil', grams: 4 },
    { name: '水', category: 'liquid', grams: 648 },
    { name: '盐', category: 'seasoning', grams: 3 },
  ]);
});

test('soft millet ratio compiles exact household quantities without borrowing raw rice rules', () => {
  const slots = {
    staple: [{ name:'小米', category:'raw_millet', canonical_id:'raw-millet', attributes:{} }],
    root_vegetable: [{ name:'土豆', category:'root_vegetable', canonical_id:'potato', attributes:{} }],
    cooked_legume: [{ name:'熟鹰嘴豆', category:'cooked_legume', canonical_id:'cooked-chickpea-seed', attributes:{} }],
  };
  const result = compileRatioPlan('soft-family-millet-liquid-v1', { servings:2, slots }, catalog);
  assert.equal(result.ok, true);
  assert.deepEqual(new Map(result.ingredient_amounts.map(row => [row.name, row.grams])), new Map([
    ['小米', 80], ['土豆', 180], ['熟鹰嘴豆', 176], ['水', 664], ['食用油', 10], ['盐', 3],
  ]));
  assert.deepEqual(result.required_extra_items, [
    { name:'食用油', category:'oil', grams:10 },
    { name:'水', category:'liquid', grams:664 },
    { name:'盐', category:'seasoning', grams:3 },
  ]);

  for (const [servings, expected] of [[3, [120,270,264,996,10,5]], [4, [160,360,352,1328,10,6]]]) {
    const scaled = compileRatioPlan('soft-family-millet-liquid-v1', { servings, slots }, catalog);
    assert.equal(scaled.ok, true);
    assert.deepEqual(
      ['小米','土豆','熟鹰嘴豆','水','食用油','盐'].map(name => scaled.ingredient_amounts.find(row => row.name === name)?.grams),
      expected,
    );
  }

  const withLeaf = compileRatioPlan('soft-family-millet-liquid-v1', {
    servings:2,
    slots: { ...slots, leafy_vegetable:[{ name:'小白菜', category:'leafy_vegetable', canonical_id:'small-bok-choy', attributes:{} }] },
  }, catalog);
  assert.equal(withLeaf.ingredient_amounts.find(row => row.name === '小白菜')?.grams, 200);

  const wrongStaple = compileRatioPlan('soft-family-millet-liquid-v1', {
    servings:2,
    slots: { ...slots, staple:[{ name:'大米', category:'raw_rice', canonical_id:'raw-rice', attributes:{} }] },
  }, catalog);
  assert.equal(wrongStaple.code, 'ratio_context_category_mismatch');
});

function catalogWithCategorySpecificProtein(mutator = () => {}) {
  const next = structuredClone(rawCatalog);
  const rule = next.rules.find(row => row.rule_id === 'broth-noodle-liquid-v1');
  const protein = rule.operations.find(row => row.target?.slot_id === 'protein');
  protein.operator = 'per_serving_by_category';
  protein.grams_by_category = {
    egg: { min: 65, default: 65, max: 65 },
    soft_tofu: { min: 90, default: 90, max: 90 },
    firm_tofu: { min: 90, default: 90, max: 90 },
    chicken: { min: 90, default: 90, max: 90 },
    pork: { min: 90, default: 90, max: 90 },
  };
  delete protein.grams;
  mutator(protein, rule);
  return next;
}

test('category-specific per-serving quantities compile from the locked ingredient category', () => {
  const next = catalogWithCategorySpecificProtein();
  const preparedNext = prepareRatioCatalog(next, validationContext);
  assert.equal(preparedNext.ok, true, preparedNext.errors.join('\n'));

  const chicken = compileRatioPlan('broth-noodle-liquid-v1', {
    servings: 2,
    slots: {
      staple: [item('面条', 'noodle')],
      protein: [item('鸡腿肉', 'chicken')],
    },
  }, preparedNext.catalog);
  const egg = compileRatioPlan('broth-noodle-liquid-v1', {
    servings: 2,
    slots: {
      staple: [item('面条', 'noodle')],
      protein: [item('鸡蛋', 'egg')],
    },
  }, preparedNext.catalog);

  assert.equal(chicken.ok, true);
  assert.equal(egg.ok, true);
  assert.equal(chicken.ingredient_amounts.find(row => row.name === '鸡腿肉').grams, 180);
  assert.equal(egg.ingredient_amounts.find(row => row.name === '鸡蛋').grams, 130);
  assert.ok(chicken.ratio_trace.some(row => row.operator === 'per_serving_by_category'
    && row.slot_id === 'protein' && row.category === 'chicken' && row.grams_per_serving === 90));
});

test('category-specific per-serving quantities require exact declared category coverage', () => {
  const mutations = [
    map => { delete map.egg; },
    map => { map.beef = { min: 90, default: 90, max: 90 }; },
  ];
  for (const mutate of mutations) {
    const invalid = catalogWithCategorySpecificProtein(operation => mutate(operation.grams_by_category));
    const errors = validateRatioDslCatalog(invalid, templates, taxonomy, recipes);
    assert.ok(errors.some(error => error.includes('category coverage')), errors.join('\n'));
  }
});

test('category-specific per-serving quantities reject malformed bounds and targets without throwing', () => {
  const invalidBounds = catalogWithCategorySpecificProtein(operation => {
    operation.grams_by_category.egg.default = -1;
    operation.grams_by_category.egg.expression = 'servings * 65';
  });
  const invalidTarget = catalogWithCategorySpecificProtein(operation => {
    operation.target.slot_id = 'not_a_slot';
  });

  assert.doesNotThrow(() => validateRatioDslCatalog(invalidBounds, templates, taxonomy, recipes));
  const boundErrors = validateRatioDslCatalog(invalidBounds, templates, taxonomy, recipes);
  const targetErrors = validateRatioDslCatalog(invalidTarget, templates, taxonomy, recipes);
  assert.ok(boundErrors.some(error => error.includes('non-negative')), boundErrors.join('\n'));
  assert.ok(boundErrors.some(error => error.includes('unknown key')), boundErrors.join('\n'));
  assert.ok(targetErrors.some(error => error.includes('declared user slot')), targetErrors.join('\n'));
});

test('recipe Ratio DSL scope is exclusive, recipe-bound and rejects unknown recipes', () => {
  const valid = catalogWithRecipeRule();
  assert.deepEqual(validateRatioDslCatalog(valid, templates, taxonomy, recipes), []);

  const mixed = catalogWithRecipeRule();
  mixed.rules.at(-1).when.template_id = 'savory-mixed-rice-pot';
  assert.match(validateRatioDslCatalog(mixed, templates, taxonomy, recipes).join('\n'), /exactly one template or recipe scope/);

  const unknown = catalogWithRecipeRule();
  unknown.rules.at(-1).when.recipe_id = 'unknown-recipe';
  assert.match(validateRatioDslCatalog(unknown, templates, taxonomy, recipes).join('\n'), /unknown recipe/);

  const wrongBinding = catalogWithRecipeRule();
  wrongBinding.rules.at(-1).evidence_recipe_ids = ['xinjiang-lamb-pilaf'];
  assert.match(validateRatioDslCatalog(wrongBinding, templates, taxonomy, recipes).join('\n'), /must be evidence for recipe/);
});

test('recipe Ratio DSL requires exact machine identity, state and one quantity operation per quantified ingredient', () => {
  const duplicate = catalogWithRecipeRule();
  duplicate.rules.at(-1).operations.splice(1, 0, structuredClone(duplicate.rules.at(-1).operations[0]));
  assert.match(validateRatioDslCatalog(duplicate, templates, taxonomy, recipes).join('\n'), /exactly one quantity operation.*raw-rice/);

  const wrongState = catalogWithRecipeRule();
  wrongState.rules.at(-1).operations[0].target.state = 'cooked';
  assert.match(validateRatioDslCatalog(wrongState, templates, taxonomy, recipes).join('\n'), /state.*raw-rice/);

  const cookedDenominator = catalogWithRecipeRule();
  cookedDenominator.rules.at(-1).operations[1].denominator = {
    canonical_id: 'cooked-rice', state: 'cooked', measure: 'grams',
  };
  assert.match(validateRatioDslCatalog(cookedDenominator, templates, taxonomy, recipes).join('\n'), /denominator.*recipe identity/);

  const quanzhouRule = rawCatalog.rules.find(rule => rule.rule_id === 'quanzhou-soaked-rice-liquid-evidence-v1');
  const soakedMismatch = structuredClone(quanzhouRule);
  soakedMismatch.operations[0].target.state = 'raw';
  soakedMismatch.operations[1].denominator.state = 'raw';
  assert.match(validateRatioDslCatalog(catalogWithRecipeRule(soakedMismatch), templates, taxonomy, recipes).join('\n'), /does not match its structured evidence binding/);

  const inventedState = structuredClone(quanzhouRule);
  inventedState.evidence_bindings[0].state = 'invented_state';
  inventedState.operations[0].target.state = 'invented_state';
  inventedState.operations[1].denominator.state = 'invented_state';
  assert.match(validateRatioDslCatalog(catalogWithRecipeRule(inventedState), templates, taxonomy, recipes).join('\n'), /state does not match canonical_id/);
});

test('recipe Ratio DSL keeps all additions inside controlled basic-extra identities', () => {
  for (const target of [
    { name: '老豆腐', category: 'firm_tofu' },
    { name: '大米', category: 'raw_rice' },
  ]) {
    const invalid = catalogWithRecipeRule();
    invalid.rules.at(-1).operations.push({
      operator: 'fixed_addition',
      target,
      grams: { min: 100, max: 100 },
    });
    assert.match(validateRatioDslCatalog(invalid, templates, taxonomy, recipes).join('\n'), /liquid, oil, or seasoning basic extra/);
  }
});

test('authoritative recipe evidence stays bounds-only and fails closed at compile time', () => {
  const boundsOnlyRuleIds = new Set([
    'shanghai-salted-pork-liquid-evidence-v1',
    'xinjiang-lamb-pilaf-liquid-evidence-v1',
    'taiwan-cabbage-mushroom-liquid-evidence-v1',
    'taiwan-tomato-shrimp-rice-evidence-v1',
    'quanzhou-soaked-rice-liquid-evidence-v1',
    'shaanbei-red-date-cowpea-rice-liquid-evidence-v1',
    'corn-carrot-chicken-leg-covered-rice-evidence-v1',
    'mushroom-green-bean-pork-rib-braised-rice-evidence-v1',
  ]);
  const executableRuleIds = new Set([
    'chicken-leg-potato-braised-rice-executable-v1',
    'green-bean-pork-rib-braised-rice-executable-v1',
    'cabbage-tofu-braised-rice-executable-v1',
    'broccoli-beef-braised-rice-executable-v1',
    'greens-minced-pork-braised-rice-executable-v1',
    'corn-carrot-chicken-leg-covered-rice-executable-v1',
    'mushroom-green-bean-pork-rib-braised-rice-executable-v1',
  ]);
  const recipeRules = rawCatalog.rules.filter(rule => rule.when?.recipe_id);
  assert.deepEqual(
    new Set(recipeRules.map(rule => rule.rule_id)),
    new Set([...boundsOnlyRuleIds, ...executableRuleIds]),
  );
  const evidenceRules = recipeRules.filter(rule => boundsOnlyRuleIds.has(rule.rule_id));
  const ruleIds = new Set(evidenceRules.map(rule => rule.rule_id));
  assert.deepEqual(ruleIds, new Set([
    'shanghai-salted-pork-liquid-evidence-v1',
    'xinjiang-lamb-pilaf-liquid-evidence-v1',
    'taiwan-cabbage-mushroom-liquid-evidence-v1',
    'taiwan-tomato-shrimp-rice-evidence-v1',
    'quanzhou-soaked-rice-liquid-evidence-v1',
    'shaanbei-red-date-cowpea-rice-liquid-evidence-v1',
    'corn-carrot-chicken-leg-covered-rice-evidence-v1',
    'mushroom-green-bean-pork-rib-braised-rice-evidence-v1',
  ]));
  for (const rule of evidenceRules) {
    assert.equal(rule.execution_mode, 'bounds_only', rule.rule_id);
    assert.ok(rule.operations.some(operation => operation.operator === 'reference_quantity'), rule.rule_id);
    assert.equal(rule.operations.some(operation => operation.operator === 'per_serving'), false, rule.rule_id);
    assert.ok(rule.operations.every(operation => operation.default == null && operation.grams?.default == null), rule.rule_id);
  }
  const preparedCatalog = prepareRatioCatalog(rawCatalog, validationContext);
  assert.equal(preparedCatalog.ok, true, preparedCatalog.errors.join('\n'));
  const result = compileRatioPlan('shanghai-salted-pork-liquid-evidence-v1', {
    recipe_id: 'shanghai-salted-pork-vegetable-rice',
    servings: 2,
    slots: { staple: [{ name: '大米', category: 'raw_rice', canonical_id: 'raw-rice', state: 'raw' }] },
  }, preparedCatalog.catalog);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'ratio_rule_not_executable');
});

test('closed-lid first-stage rules use fixed source defaults, preserve high-moisture credit, and do not synthesize range midpoints', () => {
  const executableRuleIds = new Set([
    'chicken-leg-potato-braised-rice-executable-v1',
    'green-bean-pork-rib-braised-rice-executable-v1',
    'cabbage-tofu-braised-rice-executable-v1',
    'broccoli-beef-braised-rice-executable-v1',
    'greens-minced-pork-braised-rice-executable-v1',
    'corn-carrot-chicken-leg-covered-rice-executable-v1',
    'mushroom-green-bean-pork-rib-braised-rice-executable-v1',
  ]);
  const executableRules = rawCatalog.rules.filter(rule => executableRuleIds.has(rule.rule_id));
  assert.deepEqual(new Set(executableRules.map(rule => rule.rule_id)), executableRuleIds);
  for (const rule of executableRules) {
    assert.equal(rule.execution_mode, 'executable');
    assert.ok(rule.operations.some(operation => operation.operator === 'per_serving'
      && operation.target.canonical_id === 'raw-rice'
      && operation.grams.default === 100));
    const liquid = rule.operations.filter(operation => operation.operator === 'ratio');
    assert.equal(liquid.length, 1);
    assert.equal(liquid[0].min, liquid[0].default);
    assert.equal(liquid[0].default, liquid[0].max);
    assert.equal(rule.rounding.grams_to_nearest, 1);
  }

  const credited = compileRatioPlan('savory-mixed-rice-liquid-v1', {
    servings: 2,
    slots: {
      staple: [item('大米', 'raw_rice')],
      fast_vegetable: [item('白菜', 'leafy_vegetable', { moisture_release: 'high' })],
    },
  }, catalog);
  assert.equal(credited.ok, true);
  assert.equal(credited.liquid_constraints.liquid_credit_grams, 30);

  for (const ruleId of [
    'quanzhou-soaked-rice-liquid-evidence-v1',
    'xinjiang-lamb-pilaf-liquid-evidence-v1',
    'shaanbei-red-date-cowpea-rice-liquid-evidence-v1',
  ]) {
    const rule = rawCatalog.rules.find(candidate => candidate.rule_id === ruleId);
    assert.equal(rule.execution_mode, 'bounds_only');
    assert.equal(rule.operations.some(operation => operation.default != null || operation.grams?.default != null), false);
  }
});

test('non-core variant evidence and unresolved core identities use exact structured bindings', () => {
  const taiwanVariant = rawCatalog.rules.find(rule => rule.rule_id === 'taiwan-tomato-shrimp-rice-evidence-v1');
  assert.deepEqual(taiwanVariant.evidence_bindings, [
    { binding_type: 'structured_recipe_literal', recipe_path: '/optional_ingredients/1', literal: '番茄', canonical_id: 'tomato', state: 'raw' },
    { binding_type: 'structured_recipe_literal', recipe_path: '/substitution_slots/0/allowed/0', literal: '白菜', canonical_id: 'napa-cabbage', state: 'raw' },
    { binding_type: 'structured_recipe_literal', recipe_path: '/optional_ingredients/2', literal: '玉米', canonical_id: 'sweet-corn', state: 'raw', shape_or_cut: 'whole_seed' },
    { binding_type: 'structured_recipe_literal', recipe_path: '/substitution_slots/1/allowed/3', literal: '虾仁', canonical_id: 'shrimp', state: 'raw', shape_or_cut: 'whole' },
  ]);
  const quanzhou = rawCatalog.rules.find(rule => rule.rule_id === 'quanzhou-soaked-rice-liquid-evidence-v1');
  assert.deepEqual(quanzhou.evidence_bindings, [{
    binding_type: 'structured_recipe_literal',
    recipe_path: '/core_ingredients/0',
    literal: '泡发糯米',
    canonical_id: 'soaked-glutinous-rice',
    state: 'prepared',
    shape_or_cut: 'whole_grain',
  }]);

  const wrongLiteral = structuredClone(rawCatalog);
  wrongLiteral.rules.find(rule => rule.rule_id === 'taiwan-tomato-shrimp-rice-evidence-v1')
    .evidence_bindings[0].literal = '菜谱里不存在';
  assert.match(validateRatioDslCatalog(wrongLiteral, templates, taxonomy, recipes).join('\n'), /does not resolve to the exact recipe literal/);

  const driftedTarget = structuredClone(rawCatalog);
  driftedTarget.rules.find(rule => rule.rule_id === 'taiwan-tomato-shrimp-rice-evidence-v1')
    .operations.find(operation => operation.target?.canonical_id === 'tomato').target.shape_or_cut = 'dice';
  assert.match(validateRatioDslCatalog(driftedTarget, templates, taxonomy, recipes).join('\n'), /does not match its structured evidence binding/);
});

test('a calibrated test-only recipe rule compiles deterministically through the single rounding boundary', () => {
  const executable = recipeBoundsRule();
  executable.execution_mode = 'executable';
  executable.operations[0].operator = 'per_serving';
  executable.operations[0].grams = { min: 66.65, default: 66.65, max: 66.65 };
  executable.operations.splice(1, 0,
    {
      operator: 'per_serving',
      target: { canonical_id: 'salted-pork-belly', state: 'cured', shape_or_cut: 'cured_slice' },
      grams: { min: 50.25, default: 50.25, max: 50.25 },
    },
    {
      operator: 'per_serving',
      target: { canonical_id: 'small-bok-choy', state: 'raw' },
      grams: { min: 75.15, default: 75.15, max: 75.15 },
    },
  );
  executable.operations.at(-1).default = 1.333;
  executable.operations.push(
    { operator: 'fixed_addition', target: { name: '食用油', category: 'oil' }, grams: { min: 5, default: 5, max: 5 } },
    { operator: 'scale_by_servings', target: { name: '盐', category: 'seasoning' }, grams: { min: 1.5, default: 1.5, max: 1.5 } },
  );
  const next = catalogWithRecipeRule(executable);
  const preparedNext = prepareRatioCatalog(next, validationContext);
  assert.equal(preparedNext.ok, true, preparedNext.errors.join('\n'));
  const context = {
    recipe_id: executable.when.recipe_id,
    servings: 2,
    slots: {
      staple: [{ name: '大米', category: 'raw_rice', canonical_id: 'raw-rice', state: 'raw' }],
      protein: [{ name: '咸五花肉', category: 'pork', canonical_id: 'salted-pork-belly', state: 'cured', shape_or_cut: 'cured_slice' }],
      vegetable: [{ name: '小白菜', category: 'leafy_vegetable', canonical_id: 'small-bok-choy', state: 'raw' }],
    },
  };
  const result = compileRatioPlan(executable.rule_id, context, preparedNext.catalog);
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.deepEqual(result.ingredient_amounts, [
    { name: '大米', grams: 133 },
    { name: '食用油', grams: 5 },
    { name: '水', grams: 178 },
    { name: '咸五花肉', grams: 101 },
    { name: '小白菜', grams: 150 },
    { name: '盐', grams: 3 },
  ]);
  assert.deepEqual(compileRatioPlan(executable.rule_id, context, preparedNext.catalog), result);

  const retainedCookingLiquid = structuredClone(executable);
  retainedCookingLiquid.rule_id = 'shanghai-retained-cooked-liquid-fixture-v1';
  retainedCookingLiquid.operations.find(operation => operation.operator === 'ratio').numerator.resource = 'retained_cooked_liquid_grams';
  const cookedLiquidCatalog = catalogWithRecipeRule(retainedCookingLiquid);
  const preparedCookedLiquid = prepareRatioCatalog(cookedLiquidCatalog, validationContext);
  assert.equal(preparedCookedLiquid.ok, true, preparedCookedLiquid.errors.join('\n'));
  const compiledCookedLiquid = compileRatioPlan(retainedCookingLiquid.rule_id, {
    ...context,
  }, preparedCookedLiquid.catalog);
  assert.equal(compiledCookedLiquid.ok, true, JSON.stringify(compiledCookedLiquid));
  assert.ok(compiledCookedLiquid.ratio_trace.some(trace => trace.numerator === 'retained_cooked_liquid_grams'));
});

test('existing template-scoped Ratio DSL validates and compiles unchanged beside recipe evidence', () => {
  assert.deepEqual(validateRatioDslCatalog(rawCatalog, templates, taxonomy, recipes), []);
  const result = compileRatioPlan('savory-mixed-rice-liquid-v1', {
    servings: 2,
    slots: { staple: ['大米'] },
  }, catalog);
  assert.equal(result.ok, true);
  assert.equal(result.ingredient_amounts.find(item => item.name === '大米')?.grams, 200);
  const ratioTrace = result.ratio_trace.find(trace => trace.operator === 'ratio');
  assert.equal(Object.hasOwn(ratioTrace, 'denominator_canonical_id'), false);
});

test('recipe arithmetic rejects canonical identities authorized only by prose substrings', () => {
  const waxedPork = executableShanghaiRule();
  waxedPork.operations.splice(3, 0, {
    operator: 'per_serving',
    target: { canonical_id: 'waxed-pork-belly', state: 'cured', shape_or_cut: 'cured_slice' },
    grams: { min: 20, default: 20, max: 20 },
  });
  const next = catalogWithRecipeRule(waxedPork);
  assert.match(
    validateRatioDslCatalog(next, templates, taxonomy, recipes).join('\n'),
    /waxed-pork-belly.*exact structured recipe identity/,
  );
  assert.equal(prepareRatioCatalog(next, validationContext).ok, false);
  const compileAttempt = compileRatioPlan(waxedPork.rule_id, {
    recipe_id: waxedPork.when.recipe_id,
    servings: 2,
    slots: {
      staple: [{ name: '大米', category: 'raw_rice', canonical_id: 'raw-rice', state: 'raw' }],
      protein: [
        { name: '咸五花肉', category: 'pork', canonical_id: 'salted-pork-belly', state: 'cured', shape_or_cut: 'cured_slice' },
        { name: '腊五花肉', category: 'pork', canonical_id: 'waxed-pork-belly', state: 'cured', shape_or_cut: 'cured_slice' },
      ],
      vegetable: [{ name: '小白菜', category: 'leafy_vegetable', canonical_id: 'small-bok-choy', state: 'raw' }],
    },
  }, next);
  assert.equal(compileAttempt.ok, false);
  assert.equal(compileAttempt.code, 'ratio_rule_invalid');
});

test('taxonomy-backed recipe ingredients cannot use unresolved-name bindings or invented cooked state', () => {
  const invalid = {
    rule_id: 'quanzhou-ground-pork-fallback-adversary-v1',
    evidence_recipe_ids: ['quanzhou-oil-rice'],
    execution_mode: 'bounds_only',
    when: { recipe_id: 'quanzhou-oil-rice' },
    operations: [{
      operator: 'reference_quantity',
      target: { recipe_ingredient_name: '猪肉末', state: 'cooked' },
      grams: { min: 100, max: 100 },
    }],
    rounding: { grams_to_nearest: 1 },
    example_context: { ingredient_name: '猪肉末' },
  };
  assert.match(
    validateRatioDslCatalog(catalogWithRecipeRule(invalid), templates, taxonomy, recipes).join('\n'),
    /taxonomy-backed.*canonical_id/,
  );
});

test('executable recipe rules require every resolved core quantity and reject unresolved core identity', () => {
  const invalid = {
    rule_id: 'quanzhou-incomplete-core-executable-v1',
    evidence_recipe_ids: ['quanzhou-oil-rice'],
    execution_mode: 'executable',
    when: { recipe_id: 'quanzhou-oil-rice' },
    operations: [
      { operator: 'per_serving', target: { canonical_id: 'ground-pork', state: 'raw', shape_or_cut: 'ground' }, grams: { min: 50, default: 50, max: 50 } },
      { operator: 'per_serving', target: { canonical_id: 'shiitake', state: 'raw' }, grams: { min: 30, default: 30, max: 30 } },
    ],
    rounding: { grams_to_nearest: 1 },
    example_context: { ingredient_name: '猪肉末' },
  };
  assert.match(
    validateRatioDslCatalog(catalogWithRecipeRule(invalid), templates, taxonomy, recipes).join('\n'),
    /executable recipe requires exactly one quantity operation for soaked-glutinous-rice/,
  );

  const unresolved = {
    rule_id: 'shaanbei-unresolved-cowpea-executable-v1',
    evidence_recipe_ids: ['shaanbei-red-date-cowpea-rice'],
    execution_mode: 'executable',
    when: { recipe_id: 'shaanbei-red-date-cowpea-rice' },
    operations: [
      { operator: 'per_serving', target: { canonical_id: 'raw-rice', state: 'raw' }, grams: { min: 100, default: 100, max: 100 } },
      { operator: 'per_serving', target: { canonical_id: 'pitted-dried-jujube', state: 'dry', shape_or_cut: 'pitted' }, grams: { min: 20, default: 20, max: 20 } },
      { operator: 'ratio', target: { name: '水', category: 'liquid' }, numerator: { resource: 'retained_liquid_grams' }, denominator: { canonical_id: 'raw-rice', state: 'raw', measure: 'grams' }, min: 1.3, default: 1.3, max: 1.3 },
    ],
    rounding: { grams_to_nearest: 1 },
    example_context: { ingredient_name: '大米' },
  };
  assert.match(
    validateRatioDslCatalog(catalogWithRecipeRule(unresolved), templates, taxonomy, recipes).join('\n'),
    /executable recipe requires every core ingredient to resolve exactly once.*豇豆/,
  );
});

test('template rules forbid recipe-only execution_mode injection', () => {
  for (const executionMode of ['bounds_only', 'banana']) {
    const invalid = structuredClone(rawCatalog);
    invalid.rules.find(rule => rule.when?.template_id).execution_mode = executionMode;
    assert.match(
      validateRatioDslCatalog(invalid, templates, taxonomy, recipes).join('\n'),
      /execution_mode is only valid for recipe scope/,
    );
  }
});

test('recipe liquid_distribution is executable-only and uses the same validated split contract', () => {
  const executable = executableNorthChinaNoodleRule();
  assert.doesNotMatch(
    validateRatioDslCatalog(catalogWithRecipeRule(executable), templates, taxonomy, recipes).join('\n'),
    /liquid_distribution/u,
  );

  const boundsOnly = recipeBoundsRule();
  boundsOnly.liquid_distribution = structuredClone(executable.liquid_distribution);
  assert.match(
    validateRatioDslCatalog(catalogWithRecipeRule(boundsOnly), templates, taxonomy, recipes).join('\n'),
    /liquid_distribution is only executable for recipe scope/u,
  );

  const invalid = executableNorthChinaNoodleRule();
  invalid.liquid_distribution = {
    initial_fraction: 9,
    reserve_fraction: -8,
    reserve_action_code: 'invented_action',
  };
  assert.match(
    validateRatioDslCatalog(catalogWithRecipeRule(invalid), templates, taxonomy, recipes).join('\n'),
    /liquid_distribution.*(?:sum to 1|reserve_action_code)/u,
  );
});

test('recipe compiler rejects duplicate runtime matches instead of multiplying a quantified identity', () => {
  const executable = executableShanghaiRule();
  const preparedExecutable = prepareRatioCatalog(catalogWithRecipeRule(executable), validationContext);
  assert.equal(preparedExecutable.ok, true, preparedExecutable.errors.join('\n'));
  const result = compileRatioPlan(executable.rule_id, {
    recipe_id: executable.when.recipe_id,
    servings: 2,
    slots: {
      staple: [{ name: '大米', category: 'raw_rice', canonical_id: 'raw-rice', state: 'raw' }],
      protein: [
        { name: '咸五花肉', category: 'pork', canonical_id: 'salted-pork-belly', state: 'cured', shape_or_cut: 'cured_slice' },
        { name: '咸五花肉', category: 'pork', canonical_id: 'salted-pork-belly', state: 'cured', shape_or_cut: 'cured_slice' },
      ],
      vegetable: [{ name: '小白菜', category: 'leafy_vegetable', canonical_id: 'small-bok-choy', state: 'raw' }],
    },
  }, preparedExecutable.catalog);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'ratio_context_identity_ambiguous');
});

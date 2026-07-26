import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareRatioCatalog, validateRatioDslCatalog } from '../lib/ratio-dsl-validator.mjs';
import { validateMealTemplateCatalog } from '../lib/meal-template-validator.mjs';
import { compileRatioPlan } from '../../worker/src/planner-v2.js';

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
]);
const OPERATORS = new Set(['per_serving', 'per_serving_by_category', 'ratio', 'bounded_sum', 'fixed_addition', 'scale_by_servings']);

test('Ratio DSL catalog covers every active template with only the six executable operators', () => {
  assert.equal(catalog.ratio_dsl_version, 1);
  assert.equal(catalog.ratio_catalog_version, 'ratio-rules-v1-20260727-r3');
  assert.deepEqual(validateRatioDslCatalog(catalog, templates, taxonomy, recipes), []);
  assert.deepEqual(validateMealTemplateCatalog(templates, taxonomy, recipes, catalog), []);

  const refs = new Set();
  for (const template of templates.templates.filter(template => ACTIVE.has(template.template_id))) {
    for (const ref of template.ratio_constraints) refs.add(ref);
  }
  assert.deepEqual(new Set(catalog.rules.map(rule => rule.rule_id)), refs);
  for (const rule of catalog.rules) {
    assert.ok(rule.operations.length > 0);
    for (const operation of rule.operations) assert.ok(OPERATORS.has(operation.operator));
    const template = templates.templates.find(entry => entry.template_id === rule.when.template_id);
    for (const slot of template.required_slots.filter(slot => slot.source_policy.includes('user'))) {
      assert.equal(rule.operations.filter(operation => ['per_serving', 'per_serving_by_category'].includes(operation.operator)
        && operation.target.slot_id === slot.slot_id).length, 1, `${rule.rule_id}/${slot.slot_id}`);
    }
  }
});

test('raw ratio catalog explicitly quantifies every user slot without prepare-time synthesis', () => {
  const rawResult = prepareRatioCatalog(rawCatalog, validationContext);
  assert.equal(rawResult.ok, true);
  assert.deepEqual(rawResult.catalog.rules, rawCatalog.rules);
  for (const rule of rawCatalog.rules) {
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
  invalid.rules[0].operations.at(-1).numerator.resource = 'recipe_prose';
  invalid.rules[0].operations.at(-1).denominator.measure = 'cups';
  invalid.rules[0].operations.at(-1).target.extra = true;
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
    { name: '水', grams: 160 },
  ]);
  assert.deepEqual(result.required_extra_items, [{ name: '水', category: 'liquid', grams: 160 }]);
  assert.equal(result.liquid_constraints.retained_liquid_grams, 160);
  assert.deepEqual(result.ratio_trace.map(entry => entry.operator), [
    'per_serving', 'per_serving', 'bounded_sum', 'ratio',
  ]);
});

test('quick ratio rules stay inside their declared time and serving bounds', () => {
  const quickRules = catalog.rules.filter(rule => {
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
    { name: '水', grams: 330 },
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
  assert.deepEqual(beefRice.ingredient_amounts.slice(0, 2), [
    { name: '牛里脊', grams: 200 }, { name: '熟米饭', grams: 360 },
  ]);

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
    ['水', 650],
    ['熟米饭', 360],
    ['白菜', 220],
    ['鸡蛋', 130],
  ]));
  assert.deepEqual(result.required_extra_items, [{ name: '水', category: 'liquid', grams: 650 }]);
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

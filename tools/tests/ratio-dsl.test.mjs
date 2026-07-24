import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateRatioDslCatalog } from '../lib/ratio-dsl-validator.mjs';
import { validateMealTemplateCatalog } from '../lib/meal-template-validator.mjs';
import { compileRatioPlan } from '../../worker/src/planner-v2.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const readJson = name => JSON.parse(fs.readFileSync(path.join(here, '../data', name), 'utf8'));
const catalog = readJson('ratio-rules.v1.json');
const templates = readJson('meal-templates.v2.json');
const taxonomy = readJson('ingredient-taxonomy.v1.json');
const recipes = readJson('recipe-library.json');

const ACTIVE = new Set([
  'acid-staple-pot', 'savory-mixed-rice-pot', 'cooked-rice-stir-pot', 'broth-noodle-pot',
  'egg-tofu-vegetable-pot', 'mushroom-vegetable-stew-pot', 'beef-staple-pot', 'poultry-staple-pot',
]);
const OPERATORS = new Set(['per_serving', 'ratio', 'bounded_sum', 'fixed_addition', 'scale_by_servings']);

test('Ratio DSL catalog covers every active template with only the five executable operators', () => {
  assert.equal(catalog.ratio_dsl_version, 1);
  assert.equal(catalog.ratio_catalog_version, 'ratio-rules-v1-20260724');
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
    assert.equal(rule.operations.filter(operation => operation.operator === 'per_serving').length, 1, rule.rule_id);
    assert.equal(rule.operations.find(operation => operation.operator === 'per_serving').target.slot_id, rule.when.slot_id);
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
    'per_serving', 'bounded_sum', 'ratio',
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
    const result = compileRatioPlan(rule.rule_id, {
      servings: 8,
      slots: { [rule.when.slot_id]: [rule.example_context.slot_name] },
      attributes: {},
    }, catalog);
    assert.ok(result.ingredient_amounts.every(item => Number.isFinite(item.grams) && item.grams >= 0));
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
    { name: '水', category: 'liquid', grams: 240 },
    { name: '食用油', category: 'oil', grams: 10 },
    { name: '盐', category: 'seasoning', grams: 3 },
  ]);
  assert.deepEqual(result.ratio_trace.map(entry => entry.operator), [
    'per_serving', 'ratio', 'fixed_addition', 'scale_by_servings',
  ]);
  assert.deepEqual(
    compileRatioPlan('savory-mixed-rice-liquid-v1', { servings: 2, slots: { staple: ['大米'] }, attributes: {} }, catalog),
    result,
  );
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
  invalid.rules[1].operations[2].target.name = '豆腐';
  invalid.rules[2].operations[0] = invalid.rules[2].operations[2];
  invalid.rules[3].operations = invalid.rules[3].operations.filter(operation => operation.operator !== 'ratio');
  invalid.rules[4].operations = invalid.rules[4].operations.filter(operation => operation.operator !== 'per_serving');
  const errors = validateRatioDslCatalog(invalid, templates, taxonomy, recipes);
  for (const expected of ['target name', 'operations must be ordered', 'missing retained liquid operation', 'exactly one per_serving']) {
    assert.ok(errors.some(error => error.includes(expected)), expected);
  }
});

test('compiler rejects forged extras and records scaled liquid in liquid constraints', () => {
  const forged = structuredClone(catalog);
  forged.rules[1].operations[2].target.name = '豆腐';
  forged.rules[1].operations[2].target.category = 'seasoning';
  const rejected = compileRatioPlan('savory-mixed-rice-liquid-v1', {
    servings: 2,
    slots: { staple: ['大米'] },
    attributes: {},
  }, forged);
  assert.equal(rejected.ok, false);
  assert.equal(rejected.code, 'ratio_rule_invalid');

  const scaledLiquid = compileRatioPlan('egg-tofu-vegetable-portion-v1', {
    servings: 2,
    slots: { protein: ['鸡蛋'] },
    attributes: {},
  }, catalog);
  assert.equal(scaledLiquid.ok, true);
  assert.deepEqual(scaledLiquid.required_extra_items.find(item => item.name === '水'), { name: '水', category: 'liquid', grams: 300 });
  assert.equal(scaledLiquid.liquid_constraints.retained_liquid_grams, 300);
});

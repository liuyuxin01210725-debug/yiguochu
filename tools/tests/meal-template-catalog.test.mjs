import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertMealTemplateCatalog,
  getRuntimeEligibleTemplates,
  validateMealTemplateCatalog,
} from '../lib/meal-template-validator.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const readJson = name => JSON.parse(fs.readFileSync(path.join(here, '../data', name), 'utf8'));
const catalog = readJson('meal-templates.v2.json');
const taxonomy = readJson('ingredient-taxonomy.v1.json');
const recipeLibrary = readJson('recipe-library.json');

const ACTIVE = new Set([
  'acid-staple-pot',
  'savory-mixed-rice-pot',
  'cooked-rice-stir-pot',
  'broth-noodle-pot',
  'egg-tofu-vegetable-pot',
  'mushroom-vegetable-stew-pot',
  'beef-staple-pot',
  'poultry-staple-pot',
  'braised-noodle-pot',
  'broth-rice-pot',
  'soft-family-rice-pot',
]);
const PLANNED = new Set([
  'mushroom-aroma-rice-pot',
  'curry-staple-pot',
  'pork-staple-pot',
  'quick-breakfast-pot',
  'stew-with-staple-pot',
]);
const REQUIRED_TEMPLATE_FIELDS = [
  'required_slots', 'optional_slots', 'slot_limits', 'ingredient_categories',
  'compatibility_rules', 'incompatible_rules', 'shape_or_cut_requirements',
  'cooking_order', 'ratio_constraints', 'liquid_constraints', 'safety_endpoints',
  'time_range', 'supported_intents', 'evidence_recipe_ids',
];

test('catalog has the approved 11 active and 5 planned composable template IDs', () => {
  assert.equal(catalog.schema_version, 1);
  assert.equal(catalog.template_catalog_version, 'templates-v2-20260728-r12');
  assert.equal(catalog.ingredient_taxonomy_version, 'taxonomy-v1-20260728-r10');
  assert.equal(catalog.templates.length, 16);

  const byId = new Map(catalog.templates.map(template => [template.template_id, template]));
  assert.deepEqual(new Set(byId.keys()), new Set([...ACTIVE, ...PLANNED]));
  assert.deepEqual(
    new Set(catalog.templates.filter(template => template.activation_status === 'active').map(template => template.template_id)),
    ACTIVE,
  );
  assert.deepEqual(
    new Set(catalog.templates.filter(template => template.activation_status === 'planned').map(template => template.template_id)),
    PLANNED,
  );
  for (const template of catalog.templates) {
    for (const field of REQUIRED_TEMPLATE_FIELDS) assert.ok(field in template, `${template.template_id} missing ${field}`);
    assert.ok(!/[\u4e00-\u9fff]/u.test(template.template_id), 'template IDs describe structures, not display dish names');
  }

  const braised = catalog.templates.find(row => row.template_id === 'braised-noodle-pot');
  assert.deepEqual(new Set(braised.ratio_constraints), new Set([
    'braised-noodle-liquid-v1',
    'braised-fresh-wheat-noodle-liquid-v1',
  ]));
});

test('savory mixed rice accepts raw shrimp and sweet corn with an explicit seafood endpoint', () => {
  const template = catalog.templates.find(row => row.template_id === 'savory-mixed-rice-pot');
  const protein = template.optional_slots.find(row => row.slot_id === 'protein');
  const slowVegetable = template.optional_slots.find(row => row.slot_id === 'slow_vegetable');
  assert.ok(protein.accepts_categories.includes('seafood'));
  assert.ok(slowVegetable.accepts_categories.includes('starchy_vegetable'));
  assert.ok(template.ingredient_categories.protein.includes('seafood'));
  assert.ok(template.ingredient_categories.slow_vegetable.includes('starchy_vegetable'));
  assert.ok(template.safety_endpoints.some(row => (
    row.applies_to_category === 'seafood' && row.endpoint_code === 'seafood_fully_cooked'
  )));
});

test('soft family pot is a narrow millet branch rather than a generic rice recipe', () => {
  const soft = catalog.templates.find(row => row.template_id === 'soft-family-rice-pot');
  assert.equal(soft.activation_status, 'active');
  assert.equal(soft.runtime_eligible, true);
  assert.deepEqual(soft.required_slots.map(row => [row.slot_id, row.accepts_categories]), [
    ['staple', ['raw_millet']],
    ['root_vegetable', ['root_vegetable']],
  ]);
  assert.deepEqual(soft.optional_slots.map(row => [row.slot_id, row.accepts_categories]), [
    ['cooked_legume', ['cooked_legume']],
    ['leafy_vegetable', ['leafy_vegetable']],
  ]);
  assert.deepEqual(soft.slot_limits, {
    total_user_items_min: 2,
    total_user_items_max: 4,
    staple_max: 1,
    root_vegetable_max: 1,
    cooked_legume_max: 1,
    leafy_vegetable_max: 1,
  });
  assert.deepEqual(soft.supported_intents, ['normal', 'fresh', 'batch']);
  assert.deepEqual(soft.time_range, { min_minutes: 35, max_minutes: 50 });
  assert.deepEqual(soft.ratio_constraints, ['soft-family-millet-liquid-v1']);
  assert.deepEqual(soft.evidence_recipe_ids, ['chinese-congee', 'qinghai-hao-fan']);
  assert.deepEqual(new Set(soft.safety_endpoints.map(row => `${row.applies_to_category}/${row.endpoint_code}`)), new Set([
    'raw_millet/grain_tender_no_hard_center',
    'root_vegetable/tender',
    'cooked_legume/heated_through',
  ]));
  assert.equal(soft.required_slots[0].source_policy.includes('basic_extra'), false);
});

test('broth rice is cooked-rice only with category-specific order and safety', () => {
  const template = catalog.templates.find(row => row.template_id === 'broth-rice-pot');
  assert.equal(template.activation_status, 'active');
  assert.equal(template.runtime_eligible, true);
  assert.deepEqual(template.ingredient_categories.staple, ['cooked_rice']);
  assert.deepEqual(template.ingredient_categories.protein, ['egg', 'chicken']);
  assert.deepEqual(template.ingredient_categories.slow_vegetable, ['root_vegetable']);
  assert.deepEqual(template.ingredient_categories.fast_vegetable, ['leafy_vegetable']);
  assert.equal(template.slot_limits.total_user_items_min, 2);
  assert.equal(template.slot_limits.total_user_items_max, 4);
  assert.ok(template.cooking_order.some(row => row.when?.category === 'egg'
    && row.action_code === 'gentle_set_protein'));
  assert.ok(template.cooking_order.some(row => row.when?.category === 'chicken'
    && row.action_code === 'cook_poultry_through'));
  assert.deepEqual(new Set(template.safety_endpoints.map(row => `${row.applies_to_category}/${row.endpoint_code}`)), new Set([
    'cooked_rice/heated_through',
    'egg/egg_fully_set',
    'chicken/poultry_fully_cooked_no_pink',
    'root_vegetable/tender',
  ]));
  assert.deepEqual(template.evidence_recipe_ids, [
    'cabbage-egg-soup-rice',
    'tomato-chicken-leg-soup-rice',
  ]);
});

test('active templates are structurally complete and evidence points only to existing recipes', () => {
  const recipeIds = new Set(recipeLibrary.recipes.map(recipe => recipe.id));
  for (const template of catalog.templates.filter(entry => entry.activation_status === 'active')) {
    assert.ok(template.required_slots.length > 0, `${template.template_id} needs a required slot`);
    assert.ok(template.ratio_constraints.length > 0, `${template.template_id} needs a Ratio DSL reference`);
    assert.ok(template.evidence_recipe_ids.length > 0, `${template.template_id} needs evidence`);
    for (const recipeId of template.evidence_recipe_ids) assert.ok(recipeIds.has(recipeId), `${template.template_id} unknown evidence ${recipeId}`);
  }
});

test('validator accepts the catalog and exposes only active templates as runtime eligible', () => {
  assert.deepEqual(validateMealTemplateCatalog(catalog, taxonomy, recipeLibrary), []);
  assert.doesNotThrow(() => assertMealTemplateCatalog(catalog, taxonomy, recipeLibrary));
  assert.deepEqual(
    new Set(getRuntimeEligibleTemplates(catalog).map(template => template.template_id)),
    ACTIVE,
  );
});

test('northeast M1 keeps stew-with-staple planned and outside runtime selection', () => {
  const stew = catalog.templates.find(row => row.template_id === 'stew-with-staple-pot');
  assert.ok(stew);
  assert.equal(stew.activation_status, 'planned');
  assert.equal(stew.runtime_eligible, false);
  assert.equal(getRuntimeEligibleTemplates(catalog).includes(stew), false);
});

test('savory mixed rice accepts ground pork without changing regional evidence', () => {
  const template = catalog.templates.find(row => row.template_id === 'savory-mixed-rice-pot');
  const pork = template.shape_or_cut_requirements.find(row => row.slot_id === 'protein' && row.category === 'pork');
  assert.ok(pork.allowed_shapes.includes('ground'));
  assert.ok(pork.forbidden_shapes.includes('rib'));
  assert.equal(template.evidence_recipe_ids.includes('fujian-gai-cai-minced-pork-rice'), false);
});

test('savory mixed rice accepts only lamb leg and binds the Xinjiang evidence and endpoint', () => {
  const template = catalog.templates.find(row => row.template_id === 'savory-mixed-rice-pot');
  assert.ok(template.optional_slots.find(row => row.slot_id === 'protein').accepts_categories.includes('lamb'));
  assert.ok(template.ingredient_categories.protein.includes('lamb'));
  assert.deepEqual(
    template.shape_or_cut_requirements.find(row => row.category === 'lamb'),
    { slot_id:'protein', category:'lamb', allowed_shapes:['leg'], forbidden_shapes:[] },
  );
  assert.ok(template.safety_endpoints.some(row => (
    row.applies_to_category === 'lamb' && row.endpoint_code === 'lamb_fully_cooked'
  )));
  assert.ok(template.evidence_recipe_ids.includes('xinjiang-lamb-pilaf'));

  const invalid = structuredClone(catalog);
  invalid.templates.find(row => row.template_id === 'savory-mixed-rice-pot')
    .shape_or_cut_requirements.find(row => row.category === 'lamb').allowed_shapes = ['ground'];
  assert.match(
    validateMealTemplateCatalog(invalid, taxonomy, recipeLibrary).join('\n'),
    /allowed_shapes conflicts with taxonomy shape/,
  );
});

test('validator is total and rejects malformed catalog data without throwing', () => {
  const malformed = { schema_version: 1, templates: [{ template_id: null }] };
  assert.doesNotThrow(() => validateMealTemplateCatalog(malformed, null, null));
  const errors = validateMealTemplateCatalog(malformed, null, null);
  assert.ok(errors.length > 0);
  assert.ok(errors.every(error => typeof error === 'string'));
});

test('validator rejects illegal template semantics and planned runtime eligibility', () => {
  const invalid = structuredClone(catalog);
  const acid = invalid.templates.find(template => template.template_id === 'acid-staple-pot');
  const planned = invalid.templates.find(template => template.template_id === 'quick-breakfast-pot');
  invalid.templates.push(structuredClone(acid));
  acid.required_slots[0].accepts_categories = ['invented_category'];
  acid.required_slots[1].source_policy = ['basic_extra'];
  acid.required_slots[1].accepts_categories = ['beef'];
  acid.required_slots[0].min_items = 2;
  acid.required_slots[0].max_items = 1;
  acid.slot_limits.acid_base_max = 0;
  acid.compatibility_rules[0].requires_cooking_mode = ['invented_mode'];
  acid.incompatible_rules[0].forbids_attribute_count.attribute = 'invented_attribute';
  acid.shape_or_cut_requirements[0].allowed_shapes = ['invented_shape'];
  acid.cooking_order[0].action_code = '把食材煮熟并调味';
  acid.safety_endpoints[0].endpoint_code = 'invented_endpoint';
  acid.evidence_recipe_ids = ['not-a-recipe'];
  acid.ratio_constraints = [];
  acid.supported_intents = ['quick'];
  acid.time_range.max_minutes = 45;
  planned.runtime_eligible = true;

  const errors = validateMealTemplateCatalog(invalid, taxonomy, recipeLibrary);
  for (const expected of [
    'duplicate template_id', 'unknown category', 'basic_extra', 'min_items',
    'slot_limits', 'unknown cooking mode', 'unknown attribute', 'unknown shape',
    'action_code', 'unknown endpoint', 'unknown evidence recipe', 'ratio_constraints',
    'quick', 'planned template must not be runtime eligible',
  ]) assert.ok(errors.some(error => error.includes(expected)), expected);
});

test('validator rejects natural-language steps and executable expression fields', () => {
  const invalid = structuredClone(catalog);
  const template = invalid.templates[0];
  template.cooking_order[0].instruction = '先把鸡蛋炒熟，再放入番茄。';
  template.compatibility_rules[0].expression = 'item.category === "raw_rice"';
  const errors = validateMealTemplateCatalog(invalid, taxonomy, recipeLibrary);
  assert.ok(errors.some(error => error.includes('natural-language')));
  assert.ok(errors.some(error => error.includes('executable expression')));
});

test('validator closes schema bypasses around limits, basic extras, safety, and unused operators', () => {
  const invalid = structuredClone(catalog);
  const acid = invalid.templates.find(template => template.template_id === 'acid-staple-pot');
  const cookedRice = invalid.templates.find(template => template.template_id === 'cooked-rice-stir-pot');
  acid.required_slots[1].accepts_categories = [];
  acid.required_slots[1].accepts_slot_codes = ['quick_cook_protein'];
  acid.compatibility_rules = [{
    rule_code: 'unimplemented_requires_operator',
    when: { slot_id:'staple', category:'raw_rice' },
    requires: ['unvalidated-payload'],
  }];
  acid.safety_endpoints[0].applies_to_category = 'egg';
  cookedRice.safety_endpoints = [];

  const errors = validateMealTemplateCatalog(invalid, taxonomy, recipeLibrary);
  for (const expected of [
    'basic_extra', 'unknown rule operator',
    'does not apply to category', 'missing required safety endpoint',
  ]) assert.ok(errors.some(error => error.includes(expected)), expected);
});

test('validator requires the approved taxonomy version and category declarations for every slot', () => {
  const invalid = structuredClone(catalog);
  const acid = invalid.templates.find(template => template.template_id === 'acid-staple-pot');
  invalid.ingredient_taxonomy_version = 'taxonomy-v0';
  delete acid.ingredient_categories.mushroom;
  const errors = validateMealTemplateCatalog(invalid, taxonomy, recipeLibrary);
  for (const expected of [
    'ingredient_taxonomy_version', 'missing slot',
  ]) assert.ok(errors.some(error => error.includes(expected)), expected);
});

test('activation is locked by approved template ID and runtime selection cannot admit an extra template', () => {
  const invalid = structuredClone(catalog);
  const quickBreakfast = invalid.templates.find(template => template.template_id === 'quick-breakfast-pot');
  const acid = invalid.templates.find(template => template.template_id === 'acid-staple-pot');
  quickBreakfast.activation_status = 'active';
  quickBreakfast.runtime_eligible = true;
  acid.activation_status = 'planned';
  acid.runtime_eligible = false;

  const errors = validateMealTemplateCatalog(invalid, taxonomy, recipeLibrary);
  assert.ok(errors.some(error => error.includes('quick-breakfast-pot must be planned and runtime ineligible')));
  assert.ok(errors.some(error => error.includes('acid-staple-pot must be active and runtime eligible')));
  assert.deepEqual(
    new Set(getRuntimeEligibleTemplates(invalid).map(template => template.template_id)),
    new Set([...ACTIVE].filter(id => id !== 'acid-staple-pot')),
  );
});

test('slot acceptance is derived from direct categories and compatible slot codes without drift', () => {
  const invalid = structuredClone(catalog);
  const acid = invalid.templates.find(template => template.template_id === 'acid-staple-pot');
  acid.ingredient_categories.protein = ['egg'];
  acid.optional_slots.find(slot => slot.slot_id === 'protein').accepts_slot_codes = ['long_braise'];
  acid.shape_or_cut_requirements[0].category = 'root_vegetable';
  acid.shape_or_cut_requirements[0].allowed_shapes = ['dice'];
  acid.shape_or_cut_requirements[0].forbidden_shapes = [];
  const errors = validateMealTemplateCatalog(invalid, taxonomy, recipeLibrary);
  for (const expected of [
    'unknown compatible slot code', 'ingredient_categories.protein must exactly match',
    'shape category is not accepted by slot',
  ]) assert.ok(errors.some(error => error.includes(expected)), expected);
});

test('validator limits slot-limit keys and rejects unknown keys at every machine schema layer', () => {
  const invalid = structuredClone(catalog);
  const acid = invalid.templates.find(template => template.template_id === 'acid-staple-pot');
  acid.slot_limits.protein_max = 2;
  acid.slot_limits.invented_max = 1;
  acid.notes = 'not machine data';
  acid.required_slots[0].notes = 'not machine data';
  acid.compatibility_rules[0].notes = 'not machine data';
  acid.compatibility_rules[0].when.notes = 'not machine data';
  acid.shape_or_cut_requirements[0].notes = 'not machine data';
  acid.cooking_order[0].notes = 'not machine data';
  acid.liquid_constraints.notes = 'not machine data';
  acid.safety_endpoints[0].notes = 'not machine data';
  acid.time_range.notes = 'not machine data';
  const errors = validateMealTemplateCatalog(invalid, taxonomy, recipeLibrary);
  for (const expected of ['above slot max_items', 'unknown slot_limits key', 'unknown key']) {
    assert.ok(errors.some(error => error.includes(expected)), expected);
  }
});

test('planned raw-risk slots and safety endpoints are validated against derived slot categories', () => {
  const invalid = structuredClone(catalog);
  const pork = invalid.templates.find(template => template.template_id === 'pork-staple-pot');
  const beef = invalid.templates.find(template => template.template_id === 'beef-staple-pot');
  pork.safety_endpoints = [];
  beef.safety_endpoints.push({ applies_to_category:'egg', endpoint_code:'egg_fully_set' });
  const errors = validateMealTemplateCatalog(invalid, taxonomy, recipeLibrary);
  assert.ok(errors.some(error => error.includes('pork-staple-pot missing required safety endpoint for category pork')));
  assert.ok(errors.some(error => error.includes('safety endpoint category is not accepted by any slot')));
});

test('validator remains total for malformed nested template containers', () => {
  const invalid = structuredClone(catalog);
  const acid = invalid.templates.find(template => template.template_id === 'acid-staple-pot');
  acid.required_slots = { bad:true };
  acid.ingredient_categories = [];
  acid.compatibility_rules = [{ when: [] }];
  acid.liquid_constraints = [];
  acid.safety_endpoints = [{}];
  assert.doesNotThrow(() => validateMealTemplateCatalog(invalid, taxonomy, recipeLibrary));
  const errors = validateMealTemplateCatalog(invalid, taxonomy, recipeLibrary);
  assert.ok(errors.length > 0);
  assert.ok(errors.every(error => typeof error === 'string'));
});

test('validator requires reachable user-item bounds, non-empty non-overlapping shapes, and required cooking coverage', () => {
  const invalid = structuredClone(catalog);
  const acid = invalid.templates.find(template => template.template_id === 'acid-staple-pot');
  acid.slot_limits.total_user_items_min = 0;
  acid.slot_limits.total_user_items_max = 7;
  acid.shape_or_cut_requirements[0].allowed_shapes = [];
  acid.shape_or_cut_requirements[0].forbidden_shapes = [];
  acid.shape_or_cut_requirements.push({
    slot_id:'protein', category:'beef', allowed_shapes:['tenderloin'], forbidden_shapes:['tenderloin'],
  });
  acid.cooking_order = acid.cooking_order.map(phase => ({
    ...phase,
    slot_ids: phase.slot_ids.map(slotId => slotId === 'staple' ? 'acid_base' : slotId),
  }));
  const errors = validateMealTemplateCatalog(invalid, taxonomy, recipeLibrary);
  for (const expected of [
    'total_user_items_min is below required user slots',
    'total_user_items_max exceeds user-provided capacity',
    'allowed_shapes and forbidden_shapes cannot both be empty',
    'allowed_shapes and forbidden_shapes overlap',
    'required slot is missing from cooking_order: staple',
  ]) assert.ok(errors.some(error => error.includes(expected)), expected);
});

test('cooking phases accept only an exact declared slot and category condition', () => {
  const valid = structuredClone(catalog);
  const template = valid.templates.find(row => row.template_id === 'broth-noodle-pot');
  const proteinPhase = template.cooking_order.find(phase => phase.slot_ids.includes('protein'));
  proteinPhase.when = { slot_id: 'protein', category: 'egg' };
  assert.deepEqual(validateMealTemplateCatalog(valid, taxonomy, recipeLibrary), []);

  const invalid = structuredClone(valid);
  const invalidPhase = invalid.templates.find(row => row.template_id === 'broth-noodle-pot')
    .cooking_order.find(phase => phase.slot_ids.includes('protein'));
  invalidPhase.when = { slot_id: 'staple', category: 'egg', expression: 'true' };
  const errors = validateMealTemplateCatalog(invalid, taxonomy, recipeLibrary);
  assert.ok(errors.some(error => error.includes('cooking_order')), errors.join('\n'));
  assert.ok(errors.some(error => error.includes('unknown key') || error.includes('condition')), errors.join('\n'));
});

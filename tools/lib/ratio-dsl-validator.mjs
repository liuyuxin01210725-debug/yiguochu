import { BASIC_EXTRA_CATEGORIES, resolveBasicExtraIdentity } from '../../worker/src/taxonomy-identity.js';

const ACTIVE_TEMPLATE_IDS = new Set([
  'acid-staple-pot', 'savory-mixed-rice-pot', 'cooked-rice-stir-pot', 'broth-noodle-pot',
  'egg-tofu-vegetable-pot', 'mushroom-vegetable-stew-pot', 'beef-staple-pot', 'poultry-staple-pot',
]);
const CATALOG_KEYS = new Set(['ratio_dsl_version', 'ratio_catalog_version', 'rules']);
const RULE_KEYS = new Set(['rule_id', 'evidence_recipe_ids', 'when', 'operations', 'rounding', 'example_context']);
const WHEN_KEYS = new Set(['template_id', 'slot_id', 'category']);
const ROUNDING_KEYS = new Set(['grams_to_nearest']);
const EXAMPLE_KEYS = new Set(['slot_name']);
const OPERATORS = new Set(['per_serving', 'ratio', 'bounded_sum', 'fixed_addition', 'scale_by_servings']);
const MOISTURE_VALUES = new Set(['low', 'medium', 'high']);
const RULE_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*-v\d+$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function finiteNonNegative(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function assertAllowedKeys(value, allowed, label, errors) {
  if (!isObject(value)) return;
  for (const key of Object.keys(value)) {
    if (allowed.has(key)) continue;
    if (key === 'expression' || key === 'script' || key === 'code' || key === 'formula') {
      errors.push(`${label} unknown key ${key}: executable expressions are not allowed`);
    } else {
      errors.push(`${label} unknown key: ${key}`);
    }
  }
}

function validateBounds(value, label, errors) {
  if (!isObject(value)) {
    errors.push(`${label} must be an object`);
    return false;
  }
  assertAllowedKeys(value, new Set(['min', 'default', 'max']), label, errors);
  for (const key of ['min', 'default', 'max']) {
    if (!finiteNonNegative(value[key])) errors.push(`${label}.${key} must be finite and non-negative`);
  }
  if (finiteNonNegative(value.min) && finiteNonNegative(value.default) && finiteNonNegative(value.max)
    && !(value.min <= value.default && value.default <= value.max)) {
    errors.push(`${label} must satisfy min <= default <= max`);
  }
  return true;
}

function templateContext(templates, taxonomy, recipeLibrary) {
  const templateById = new Map();
  for (const template of Array.isArray(templates?.templates) ? templates.templates : []) {
    if (isString(template?.template_id)) templateById.set(template.template_id, template);
  }
  const categories = new Set();
  for (const item of Array.isArray(taxonomy?.items) ? taxonomy.items : []) {
    if (isString(item?.category)) categories.add(item.category);
  }
  const recipeIds = new Set(Array.isArray(recipeLibrary?.recipes)
    ? recipeLibrary.recipes.map(recipe => recipe?.id).filter(isString)
    : []);
  return { templateById, categories, recipeIds, taxonomy };
}

function slotCategories(template, slotId) {
  const declared = template?.ingredient_categories?.[slotId];
  return new Set(Array.isArray(declared) ? declared.filter(isString) : []);
}

function validateTarget(value, label, errors, { basicExtraOnly = false, allowSlot = false, allowAttribute = false } = {}) {
  if (!isObject(value)) {
    errors.push(`${label} must be an object`);
    return;
  }
  const allowed = new Set();
  if (allowSlot) allowed.add('slot_id');
  if (allowAttribute) {
    allowed.add('attribute');
    allowed.add('value');
  }
  if (basicExtraOnly) {
    allowed.add('name');
    allowed.add('category');
  }
  assertAllowedKeys(value, allowed, label, errors);
  const keys = Object.keys(value);
  const isSlot = allowSlot && isString(value.slot_id) && keys.length === 1;
  const isAttribute = allowAttribute && value.attribute === 'moisture_release' && MOISTURE_VALUES.has(value.value) && keys.length === 2;
  const isBasicExtra = basicExtraOnly && isString(value.name) && BASIC_EXTRA_CATEGORIES.has(value.category) && keys.length === 2;
  if (!isSlot && !isAttribute && !isBasicExtra) {
    errors.push(`${label} is invalid`);
  }
}

function validateBasicExtraIdentity(target, label, context, errors) {
  if (!resolveBasicExtraIdentity(target, context.taxonomy)) errors.push(`${label} target name category does not match taxonomy`);
}

function validateOperation(operation, label, rule, context, errors) {
  if (!isObject(operation)) {
    errors.push(`${label} must be an object`);
    return;
  }
  const operator = operation.operator;
  if (!OPERATORS.has(operator)) {
    errors.push(`${label} has unknown operator`);
    return;
  }
  const operationKeys = {
    per_serving: new Set(['operator', 'target', 'grams']),
    ratio: new Set(['operator', 'target', 'numerator', 'denominator', 'min', 'default', 'max']),
    bounded_sum: new Set(['operator', 'target', 'grams_per_serving', 'liquid_credit_grams_per_serving']),
    fixed_addition: new Set(['operator', 'target', 'grams']),
    scale_by_servings: new Set(['operator', 'target', 'grams']),
  };
  assertAllowedKeys(operation, operationKeys[operator], label, errors);
  if (operator === 'per_serving') {
    validateTarget(operation.target, `${label}.target`, errors, { allowSlot: true });
    const requiredUserSlots = (context.templateById.get(rule?.when?.template_id)?.required_slots || [])
      .filter(slot => slot?.source_policy?.includes('user')).map(slot => slot.slot_id);
    if (!requiredUserSlots.includes(operation.target?.slot_id) && !(context.templateById.get(rule?.when?.template_id)?.optional_slots || [])
      .some(slot => slot?.slot_id === operation.target?.slot_id && slot?.source_policy?.includes('user'))) {
      errors.push(`${label}.target must be a declared user slot`);
    }
    validateBounds(operation.grams, `${label}.grams`, errors);
  }
  if (operator === 'bounded_sum') {
    validateTarget(operation.target, `${label}.target`, errors, { allowAttribute: true });
    validateBounds(operation.grams_per_serving, `${label}.grams_per_serving`, errors);
    validateBounds(operation.liquid_credit_grams_per_serving, `${label}.liquid_credit_grams_per_serving`, errors);
  }
  if (operator === 'ratio') {
    validateTarget(operation.target, `${label}.target`, errors, { basicExtraOnly: true });
    validateBasicExtraIdentity(operation.target, `${label}.target`, context, errors);
    if (operation.target?.category !== 'liquid') errors.push(`${label}.target must be a liquid basic extra`);
    if (!isObject(operation.numerator)) errors.push(`${label}.numerator must be an object`);
    else {
      assertAllowedKeys(operation.numerator, new Set(['resource']), `${label}.numerator`, errors);
      if (operation.numerator.resource !== 'retained_liquid_grams') errors.push(`${label}.numerator.resource is invalid`);
    }
    if (!isObject(operation.denominator)) errors.push(`${label}.denominator must be an object`);
    else {
      assertAllowedKeys(operation.denominator, new Set(['slot_id', 'measure']), `${label}.denominator`, errors);
      if (operation.denominator.slot_id !== rule?.when?.slot_id || operation.denominator.measure !== 'grams') {
        errors.push(`${label}.denominator must measure rule when.slot_id grams`);
      }
    }
    validateBounds({ min: operation.min, default: operation.default, max: operation.max }, label, errors);
  }
  if (operator === 'fixed_addition' || operator === 'scale_by_servings') {
    validateTarget(operation.target, `${label}.target`, errors, { basicExtraOnly: true });
    validateBasicExtraIdentity(operation.target, `${label}.target`, context, errors);
    if (!BASIC_EXTRA_CATEGORIES.has(operation.target?.category)) errors.push(`${label}.target must be a basic extra`);
    validateBounds(operation.grams, `${label}.grams`, errors);
  }
}

function validateRule(rule, index, context, errors) {
  const label = `rules[${index}]`;
  if (!isObject(rule)) {
    errors.push(`${label} must be an object`);
    return;
  }
  assertAllowedKeys(rule, RULE_KEYS, label, errors);
  if (!isString(rule.rule_id) || !RULE_ID_RE.test(rule.rule_id)) errors.push(`${label}.rule_id is invalid`);
  if (!isObject(rule.when)) {
    errors.push(`${label}.when must be an object`);
  } else {
    assertAllowedKeys(rule.when, WHEN_KEYS, `${label}.when`, errors);
    const template = context.templateById.get(rule.when.template_id);
    if (!template) errors.push(`${label}.when has unknown template`);
    if (!template?.ratio_constraints?.includes(rule.rule_id)) errors.push(`${label}.when template does not reference rule_id`);
    const categories = slotCategories(template, rule.when.slot_id);
    if (!categories.size) errors.push(`${label}.when has unknown slot`);
    if (!context.categories.has(rule.when.category)) errors.push(`${label}.when has unknown category`);
    if (categories.size && !categories.has(rule.when.category)) errors.push(`${label}.when category is not accepted by slot`);
  }
  if (!Array.isArray(rule.evidence_recipe_ids) || rule.evidence_recipe_ids.length === 0 || rule.evidence_recipe_ids.some(id => !isString(id))) {
    errors.push(`${label}.evidence_recipe_ids must be a non-empty string array`);
  } else {
    const unique = new Set(rule.evidence_recipe_ids);
    if (unique.size !== rule.evidence_recipe_ids.length) errors.push(`${label}.evidence_recipe_ids must not contain duplicates`);
    const templateEvidence = new Set(context.templateById.get(rule.when?.template_id)?.evidence_recipe_ids || []);
    for (const id of rule.evidence_recipe_ids) {
      if (!context.recipeIds.has(id)) errors.push(`${label} has unknown evidence recipe`);
      if (templateEvidence.size && !templateEvidence.has(id)) errors.push(`${label} evidence recipe is not declared by template`);
    }
  }
  if (!Array.isArray(rule.operations) || rule.operations.length === 0) errors.push(`${label}.operations must be a non-empty array`);
  else {
    rule.operations.forEach((operation, operationIndex) => validateOperation(operation, `${label}.operations[${operationIndex}]`, rule, context, errors));
    const requiredUserSlots = (context.templateById.get(rule.when?.template_id)?.required_slots || [])
      .filter(slot => slot?.source_policy?.includes('user')).map(slot => slot.slot_id);
    for (const slotId of requiredUserSlots) {
      if (rule.operations.filter(operation => operation?.operator === 'per_serving' && operation.target?.slot_id === slotId).length !== 1) {
        errors.push(`${label} requires exactly one per_serving for required user slot ${slotId}`);
      }
    }
    const stageByOperator = new Map([
      ['per_serving', 1], ['bounded_sum', 1], ['ratio', 2], ['fixed_addition', 3], ['scale_by_servings', 3],
    ]);
    let previousStage = 0;
    for (const operation of rule.operations) {
      const stage = stageByOperator.get(operation?.operator);
      if (!stage) continue;
      if (stage < previousStage) errors.push(`${label}.operations must be ordered as food, liquid, then basic additions`);
      previousStage = Math.max(previousStage, stage);
    }
    const template = context.templateById.get(rule.when?.template_id);
    const hasRetainedLiquidOperation = rule.operations.some(operation => operation?.operator === 'ratio'
      || (['fixed_addition', 'scale_by_servings'].includes(operation?.operator) && operation?.target?.category === 'liquid'));
    if (template?.liquid_constraints?.retained_in_finished_meal === true && !hasRetainedLiquidOperation) {
      errors.push(`${label} missing retained liquid operation`);
    }
  }
  if (!isObject(rule.rounding)) errors.push(`${label}.rounding must be an object`);
  else {
    assertAllowedKeys(rule.rounding, ROUNDING_KEYS, `${label}.rounding`, errors);
    if (!Number.isInteger(rule.rounding.grams_to_nearest) || rule.rounding.grams_to_nearest <= 0) {
      errors.push(`${label}.rounding.grams_to_nearest must be a positive integer`);
    }
    if (Number.isInteger(rule.rounding.grams_to_nearest) && rule.rounding.grams_to_nearest > 0) {
      for (const operation of Array.isArray(rule.operations) ? rule.operations : []) {
        for (const field of ['grams', 'grams_per_serving', 'liquid_credit_grams_per_serving']) {
          const amount = operation?.[field]?.default;
          if (finiteNonNegative(amount) && amount > 0 && Math.round(amount / rule.rounding.grams_to_nearest) === 0) {
            errors.push(`${label}.${field} positive default rounds to 0g`);
          }
        }
      }
    }
  }
  if (!isObject(rule.example_context)) errors.push(`${label}.example_context must be an object`);
  else {
    assertAllowedKeys(rule.example_context, EXAMPLE_KEYS, `${label}.example_context`, errors);
    if (!isString(rule.example_context.slot_name)) errors.push(`${label}.example_context.slot_name must be a non-empty string`);
  }
}

// This is intentionally total: catalog mistakes become deterministic strings rather
// than worker crashes. It never evaluates user-authored expressions or recipe prose.
export function validateRatioDslCatalog(catalog, templates, taxonomy, recipeLibrary) {
  try {
    const errors = [];
    if (!isObject(catalog)) return ['ratio DSL catalog must be an object'];
    assertAllowedKeys(catalog, CATALOG_KEYS, 'ratio DSL catalog', errors);
    if (catalog.ratio_dsl_version !== 1) errors.push('ratio_dsl_version must be 1');
    if (catalog.ratio_catalog_version !== 'ratio-rules-v1-20260724') {
      errors.push('ratio_catalog_version must be ratio-rules-v1-20260724');
    }
    if (!Array.isArray(catalog.rules)) return [...errors, 'rules must be an array'];
    const context = templateContext(templates, taxonomy, recipeLibrary);
    const ids = new Set();
    catalog.rules.forEach((rule, index) => {
      if (isString(rule?.rule_id) && ids.has(rule.rule_id)) errors.push(`duplicate rule_id: ${rule.rule_id}`);
      if (isString(rule?.rule_id)) ids.add(rule.rule_id);
      validateRule(rule, index, context, errors);
    });
    const activeRefs = new Set();
    for (const template of context.templateById.values()) {
      if (!ACTIVE_TEMPLATE_IDS.has(template?.template_id)) continue;
      for (const ref of Array.isArray(template.ratio_constraints) ? template.ratio_constraints : []) activeRefs.add(ref);
    }
    for (const ref of activeRefs) if (!ids.has(ref)) errors.push(`active template ratio reference is unresolved: ${ref}`);
    for (const id of ids) if (!activeRefs.has(id)) errors.push(`ratio rule is not an active template reference: ${id}`);
    for (const template of context.templateById.values()) {
      if (!ACTIVE_TEMPLATE_IDS.has(template?.template_id)) continue;
      const rules = catalog.rules.filter(rule => rule?.when?.template_id === template.template_id);
      const requiredUserSlots = (template.required_slots || []).filter(slot => slot?.source_policy?.includes('user'));
      const hasCompleteVariantSlot = requiredUserSlots.some(slot => {
        const expected = slotCategories(template, slot.slot_id);
        const actual = new Set(rules.filter(rule => rule?.when?.slot_id === slot.slot_id).map(rule => rule.when.category));
        return expected.size > 0 && expected.size === actual.size && [...expected].every(category => actual.has(category));
      });
      if (!hasCompleteVariantSlot) errors.push(`${template.template_id} missing complete required category variant coverage`);
    }
    return errors;
  } catch (error) {
    return [`ratio DSL validation failed safely: ${error instanceof Error ? error.message : String(error)}`];
  }
}

export function assertRatioDslCatalog(catalog, templates, taxonomy, recipeLibrary) {
  const errors = validateRatioDslCatalog(catalog, templates, taxonomy, recipeLibrary);
  if (errors.length) throw new Error(`invalid ratio DSL catalog:\n${errors.join('\n')}`);
  return catalog;
}

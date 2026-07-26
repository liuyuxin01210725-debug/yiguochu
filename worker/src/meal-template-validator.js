import { validateRatioDslCatalog } from './ratio-dsl.js';

const EXPECTED_TEMPLATE_IDS = new Set([
  'acid-staple-pot', 'savory-mixed-rice-pot', 'cooked-rice-stir-pot', 'broth-noodle-pot',
  'egg-tofu-vegetable-pot', 'mushroom-vegetable-stew-pot', 'beef-staple-pot', 'poultry-staple-pot',
  'mushroom-aroma-rice-pot', 'broth-rice-pot', 'braised-noodle-pot', 'curry-staple-pot',
  'pork-staple-pot', 'soft-family-rice-pot', 'stew-with-staple-pot', 'quick-breakfast-pot',
]);
const TAXONOMY_VERSION = 'taxonomy-v1-20260727-r3';
const ACTIVE_TEMPLATE_IDS = new Set([
  'acid-staple-pot', 'savory-mixed-rice-pot', 'cooked-rice-stir-pot', 'broth-noodle-pot',
  'egg-tofu-vegetable-pot', 'mushroom-vegetable-stew-pot', 'beef-staple-pot', 'poultry-staple-pot',
  'braised-noodle-pot', 'broth-rice-pot',
]);
const BASIC_EXTRA_CATEGORIES = new Set(['raw_rice', 'cooked_rice', 'noodle', 'liquid', 'oil', 'seasoning']);
const SOURCE_POLICIES = new Set(['user', 'basic_extra']);
const INTENTS = new Set(['normal', 'quick', 'fresh', 'batch']);
const COOKING_MODES = new Set(['braise', 'simmer', 'quick_saute', 'short_simmer', 'long_simmer', 'steam']);
const ATTRIBUTE_VALUES = new Map([
  ['moisture_release', new Set(['low', 'medium', 'high'])],
  ['cook_speed', new Set(['no_cook', 'fast', 'medium', 'slow'])],
  ['cooking_risk', new Set(['none', 'raw_egg', 'raw_poultry', 'raw_pork', 'raw_beef', 'raw_seafood', 'raw_dough', 'unknown'])],
]);
// First-stage templates only need these two fully machine-checked operators.
// Do not accept future-looking operator names without a validated payload schema.
const RULE_OPERATORS = new Set(['forbids_attribute_count', 'requires_cooking_mode']);
const ACTION_CODES = new Set([
  'protein_pretreat', 'acid_base_cookdown', 'add_staple_and_liquid', 'add_fast_cooking_items',
  'reach_safety_endpoints', 'cook_aromatics', 'add_savory_base', 'simmer_until_staple_tender',
  'stir_cooked_rice', 'add_broth_and_noodles', 'gentle_set_protein', 'simmer_until_tender',
  'sear_beef', 'cook_poultry_through', 'add_mushroom', 'add_liquid', 'add_noodle',
  'add_soft_protein', 'finish_and_check_endpoints', 'add_pork', 'soften_family_texture',
  'quick_breakfast_heat', 'add_slow_cooking_items', 'position_staple_above_liquid',
  'steam_staple_with_lid',
]);
const LIQUID_CATEGORIES = new Set(['water', 'approved_stock']);

// The approved design spells poultry safety as "no pink", while taxonomy-v1's
// executable cooking-risk endpoint is the shorter canonical code. Templates keep
// the design-level code and this finite map is the only permitted reconciliation.
export const TEMPLATE_ENDPOINT_TO_TAXONOMY_ENDPOINT = Object.freeze({
  poultry_fully_cooked_no_pink: 'poultry_fully_cooked',
  rice_tender: 'rice_tender',
  heated_through: 'heated_through',
  noodle_tender: 'noodle_tender',
  egg_fully_set: 'egg_fully_set',
  beef_fully_cooked: 'beef_fully_cooked',
  pork_fully_cooked: 'pork_fully_cooked',
  bean_fully_cooked: 'bean_fully_cooked',
  tender: 'tender',
  dough_cooked_through: 'dough_cooked_through',
});
const TEMPLATE_ENDPOINTS = new Set(Object.keys(TEMPLATE_ENDPOINT_TO_TAXONOMY_ENDPOINT));
const ENDPOINT_CATEGORIES = new Map([
  ['poultry_fully_cooked_no_pink', new Set(['chicken'])],
  ['rice_tender', new Set(['raw_rice'])],
  ['heated_through', new Set(['cooked_rice', 'soft_tofu', 'firm_tofu'])],
  ['noodle_tender', new Set(['noodle'])],
  ['egg_fully_set', new Set(['egg'])],
  ['beef_fully_cooked', new Set(['beef'])],
  ['pork_fully_cooked', new Set(['pork'])],
  ['bean_fully_cooked', new Set(['pod_vegetable'])],
  ['tender', new Set(['cruciferous_vegetable', 'root_vegetable'])],
  ['dough_cooked_through', new Set(['cornmeal_dough', 'wheat_dough'])],
]);
const RATIO_REF_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*-v\d+$/;
const TEMPLATE_ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TEMPLATE_KEYS = new Set([
  'template_id', 'activation_status', 'runtime_eligible', 'required_slots', 'optional_slots', 'slot_limits',
  'ingredient_categories', 'compatibility_rules', 'incompatible_rules', 'shape_or_cut_requirements',
  'cooking_order', 'ratio_constraints', 'liquid_constraints', 'safety_endpoints', 'time_range',
  'supported_intents', 'evidence_recipe_ids',
]);
const SLOT_KEYS = new Set(['slot_id', 'min_items', 'max_items', 'source_policy', 'accepts_categories', 'accepts_slot_codes']);
const WHEN_KEYS = new Set(['slot_id', 'category']);
const COMPATIBILITY_RULE_KEYS = new Set(['rule_code', 'when', 'requires_cooking_mode']);
const INCOMPATIBILITY_RULE_KEYS = new Set(['rule_code', 'when', 'forbids_attribute_count']);
const ATTRIBUTE_COUNT_KEYS = new Set(['attribute', 'value', 'greater_than']);
const SHAPE_REQUIREMENT_KEYS = new Set(['slot_id', 'category', 'allowed_shapes', 'forbidden_shapes']);
const COOKING_ORDER_KEYS = new Set(['phase', 'action_code', 'slot_ids', 'when']);
const COOKING_ORDER_WHEN_KEYS = new Set(['slot_id', 'category']);
const LIQUID_CONSTRAINT_KEYS = new Set(['allowed_categories', 'max_liquid_types', 'must_be_measured', 'retained_in_finished_meal']);
const SAFETY_ENDPOINT_KEYS = new Set(['applies_to_category', 'endpoint_code']);
const TIME_RANGE_KEYS = new Set(['min_minutes', 'max_minutes']);
const CATALOG_KEYS = new Set(['schema_version', 'template_catalog_version', 'ingredient_taxonomy_version', 'templates']);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function stringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(isString);
}

function assertAllowedKeys(value, allowedKeys, label, errors) {
  if (!isObject(value)) return;
  for (const key of Object.keys(value)) {
    if (allowedKeys.has(key)) continue;
    if (key === 'instruction' || key === 'instructions' || key === 'step' || key === 'steps') {
      errors.push(`${label} unknown key ${key}: natural-language steps are not allowed`);
    } else if (key === 'expression' || key === 'script' || key === 'code' || key === 'formula') {
      errors.push(`${label} unknown key ${key}: executable expressions are not allowed`);
    } else {
      errors.push(`${label} unknown key: ${key}`);
    }
  }
}

function sameStringSet(left, right) {
  if (!Array.isArray(left) || left.some(value => !isString(value))) return false;
  const actual = new Set(left);
  return actual.size === left.length && actual.size === right.size && [...actual].every(value => right.has(value));
}

function taxonomyContext(taxonomy) {
  const categories = new Set();
  const shapes = new Set();
  const compatibleSlotCodes = new Set();
  const categoriesByCompatibleSlotCode = new Map();
  const shapesByCategory = new Map();
  const taxonomyItems = isObject(taxonomy) && Array.isArray(taxonomy.items) ? taxonomy.items : [];
  if (taxonomyItems.length === 0) return {
    categories, shapes, compatibleSlotCodes, categoriesByCompatibleSlotCode, shapesByCategory, taxonomyItems,
  };
  for (const item of taxonomyItems) {
    if (!isObject(item)) continue;
    if (isString(item.category)) {
      categories.add(item.category);
      if (!shapesByCategory.has(item.category)) shapesByCategory.set(item.category, new Set());
      for (const shape of Array.isArray(item.shapes_or_cuts) ? item.shapes_or_cuts : []) {
        if (isString(shape)) {
          shapes.add(shape);
          shapesByCategory.get(item.category).add(shape);
        }
      }
    }
    for (const code of Array.isArray(item.compatible_slot_codes) ? item.compatible_slot_codes : []) {
      if (!isString(code) || !isString(item.category)) continue;
      compatibleSlotCodes.add(code);
      if (!categoriesByCompatibleSlotCode.has(code)) categoriesByCompatibleSlotCode.set(code, new Set());
      categoriesByCompatibleSlotCode.get(code).add(item.category);
    }
  }
  return { categories, shapes, compatibleSlotCodes, categoriesByCompatibleSlotCode, shapesByCategory, taxonomyItems };
}

function checkSlot(slot, label, kind, context, errors) {
  if (!isObject(slot)) {
    errors.push(`${label} must be an object`);
    return null;
  }
  assertAllowedKeys(slot, SLOT_KEYS, label, errors);
  if (!isString(slot.slot_id)) errors.push(`${label}.slot_id must be a non-empty string`);
  if (!Number.isInteger(slot.min_items) || slot.min_items < 0) errors.push(`${label}.min_items must be a non-negative integer`);
  if (!Number.isInteger(slot.max_items) || slot.max_items < 0) errors.push(`${label}.max_items must be a non-negative integer`);
  if (Number.isInteger(slot.min_items) && Number.isInteger(slot.max_items) && slot.min_items > slot.max_items) {
    errors.push(`${label}.min_items must not exceed max_items`);
  }
  if (kind === 'required' && slot.min_items !== 1) errors.push(`${label}.min_items must be 1 for required slots`);
  if (kind === 'optional' && slot.min_items !== 0) errors.push(`${label}.min_items must be 0 for optional slots`);
  if (!stringArray(slot.source_policy) || slot.source_policy.some(policy => !SOURCE_POLICIES.has(policy))) {
    errors.push(`${label}.source_policy is invalid`);
  }
  const categories = Array.isArray(slot.accepts_categories) ? slot.accepts_categories : [];
  const slotCodes = Array.isArray(slot.accepts_slot_codes) ? slot.accepts_slot_codes : [];
  if (categories.length === 0 && slotCodes.length === 0) errors.push(`${label} must accept categories or slot codes`);
  if (categories.some(category => !context.categories.has(category))) errors.push(`${label} has unknown category`);
  if (slotCodes.some(code => !context.compatibleSlotCodes.has(code))) errors.push(`${label} has unknown compatible slot code`);
  if (Array.isArray(slot.source_policy) && slot.source_policy.includes('basic_extra')
      && (categories.length === 0 || slotCodes.length > 0 || categories.some(category => !BASIC_EXTRA_CATEGORIES.has(category)))) {
    errors.push(`${label}.basic_extra only permits explicit staple, liquid, oil, or seasoning categories`);
  }
  const acceptedCategories = new Set(categories.filter(category => context.categories.has(category)));
  for (const code of slotCodes) {
    for (const category of context.categoriesByCompatibleSlotCode.get(code) || []) acceptedCategories.add(category);
  }
  return isString(slot.slot_id) ? { id: slot.slot_id, acceptedCategories } : null;
}

function checkRules(rules, label, declaredSlots, acceptedCategoriesBySlot, context, errors, incompatible) {
  if (!Array.isArray(rules)) {
    errors.push(`${label} must be an array`);
    return;
  }
  rules.forEach((rule, index) => {
    const ruleLabel = `${label}[${index}]`;
    if (!isObject(rule)) {
      errors.push(`${ruleLabel} must be an object`);
      return;
    }
    assertAllowedKeys(rule, incompatible ? INCOMPATIBILITY_RULE_KEYS : COMPATIBILITY_RULE_KEYS, ruleLabel, errors);
    if (!isString(rule.rule_code)) errors.push(`${ruleLabel}.rule_code must be a non-empty string`);
    if (!isObject(rule.when)) errors.push(`${ruleLabel}.when must be an object`);
    else {
      assertAllowedKeys(rule.when, WHEN_KEYS, `${ruleLabel}.when`, errors);
      if (!declaredSlots.has(rule.when.slot_id)) errors.push(`${ruleLabel}.when has unknown slot`);
      if (!context.categories.has(rule.when.category)) errors.push(`${ruleLabel}.when has unknown category`);
      if (declaredSlots.has(rule.when.slot_id)
        && !acceptedCategoriesBySlot.get(rule.when.slot_id)?.has(rule.when.category)) {
        errors.push(`${ruleLabel}.when category is not accepted by slot`);
      }
    }
    const operators = Object.keys(rule).filter(key => key !== 'rule_code' && key !== 'when');
    if (operators.length !== 1 || !RULE_OPERATORS.has(operators[0])) errors.push(`${ruleLabel} has unknown rule operator`);
    const operator = operators[0];
    if (operator === 'requires_cooking_mode') {
      if (!stringArray(rule[operator]) || rule[operator].some(mode => !COOKING_MODES.has(mode))) {
        errors.push(`${ruleLabel} has unknown cooking mode`);
      }
    }
    if (operator === 'forbids_attribute_count') {
      const condition = rule[operator];
      assertAllowedKeys(condition, ATTRIBUTE_COUNT_KEYS, `${ruleLabel}.forbids_attribute_count`, errors);
      if (!isObject(condition) || !ATTRIBUTE_VALUES.has(condition.attribute)) errors.push(`${ruleLabel} has unknown attribute`);
      else if (!ATTRIBUTE_VALUES.get(condition.attribute).has(condition.value)) errors.push(`${ruleLabel} has unknown attribute value`);
      if (!isObject(condition) || !Number.isInteger(condition.greater_than) || condition.greater_than < 0) {
        errors.push(`${ruleLabel}.forbids_attribute_count.greater_than must be a non-negative integer`);
      }
    }
    if (incompatible && operator !== 'forbids_attribute_count') {
      errors.push(`${ruleLabel} has invalid incompatible rule operator`);
    }
  });
}

function checkShapeRequirements(requirements, label, declaredSlots, acceptedCategoriesBySlot, context, errors) {
  if (!Array.isArray(requirements)) {
    errors.push(`${label} must be an array`);
    return;
  }
  requirements.forEach((requirement, index) => {
    const itemLabel = `${label}[${index}]`;
    if (!isObject(requirement)) {
      errors.push(`${itemLabel} must be an object`);
      return;
    }
    assertAllowedKeys(requirement, SHAPE_REQUIREMENT_KEYS, itemLabel, errors);
    if (!declaredSlots.has(requirement.slot_id)) errors.push(`${itemLabel}.slot_id has unknown slot`);
    if (!context.categories.has(requirement.category)) errors.push(`${itemLabel}.category has unknown category`);
    if (declaredSlots.has(requirement.slot_id)
      && !acceptedCategoriesBySlot.get(requirement.slot_id)?.has(requirement.category)) {
      errors.push(`${itemLabel}.shape category is not accepted by slot`);
    }
    const categoryShapes = context.shapesByCategory.get(requirement.category) || new Set();
    for (const field of ['allowed_shapes', 'forbidden_shapes']) {
      if (!Array.isArray(requirement[field]) || requirement[field].some(shape => !context.shapes.has(shape))) {
        errors.push(`${itemLabel}.${field} has unknown shape`);
      } else if (requirement[field].some(shape => !categoryShapes.has(shape))) {
        errors.push(`${itemLabel}.${field} conflicts with taxonomy shape`);
      }
    }
    const allowedShapes = Array.isArray(requirement.allowed_shapes) ? requirement.allowed_shapes : [];
    const forbiddenShapes = Array.isArray(requirement.forbidden_shapes) ? requirement.forbidden_shapes : [];
    if (allowedShapes.length === 0 && forbiddenShapes.length === 0) {
      errors.push(`${itemLabel}.allowed_shapes and forbidden_shapes cannot both be empty`);
    }
    if (allowedShapes.some(shape => forbiddenShapes.includes(shape))) {
      errors.push(`${itemLabel}.allowed_shapes and forbidden_shapes overlap`);
    }
  });
}

function checkCookingOrder(order, label, declaredSlots, acceptedCategoriesBySlot, errors) {
  if (!Array.isArray(order) || order.length === 0) {
    errors.push(`${label} must be a non-empty array`);
    return;
  }
  let previousPhase = 0;
  order.forEach((phase, index) => {
    const phaseLabel = `${label}[${index}]`;
    if (!isObject(phase)) {
      errors.push(`${phaseLabel} must be an object`);
      return;
    }
    assertAllowedKeys(phase, COOKING_ORDER_KEYS, phaseLabel, errors);
    if (!Number.isInteger(phase.phase) || phase.phase <= previousPhase) errors.push(`${phaseLabel}.phase must be strictly increasing`);
    if (Number.isInteger(phase.phase)) previousPhase = phase.phase;
    if (!ACTION_CODES.has(phase.action_code)) errors.push(`${phaseLabel}.action_code must be a finite machine code`);
    if (!stringArray(phase.slot_ids) || phase.slot_ids.some(slot => !declaredSlots.has(slot))) errors.push(`${phaseLabel}.slot_ids has unknown slot`);
    if (phase.when !== undefined) {
      if (!isObject(phase.when)) {
        errors.push(`${phaseLabel}.when must be an object`);
      } else {
        assertAllowedKeys(phase.when, COOKING_ORDER_WHEN_KEYS, `${phaseLabel}.when`, errors);
        if (!isString(phase.when.slot_id) || !declaredSlots.has(phase.when.slot_id)) {
          errors.push(`${phaseLabel}.when.slot_id must be a declared slot`);
        } else {
          if (!phase.slot_ids?.includes(phase.when.slot_id)) {
            errors.push(`${phaseLabel}.when.slot_id must appear in phase slot_ids`);
          }
          if (!isString(phase.when.category)
            || !acceptedCategoriesBySlot.get(phase.when.slot_id)?.has(phase.when.category)) {
            errors.push(`${phaseLabel}.when.category must be accepted by its slot`);
          }
        }
      }
    }
  });
}

function checkTemplate(template, index, context, recipeIds, errors) {
  const label = `templates[${index}]`;
  if (!isObject(template)) {
    errors.push(`${label} must be an object`);
    return;
  }
  assertAllowedKeys(template, TEMPLATE_KEYS, label, errors);
  if (!isString(template.template_id) || !TEMPLATE_ID_RE.test(template.template_id)) errors.push(`${label}.template_id is invalid`);
  if (!['active', 'planned'].includes(template.activation_status)) errors.push(`${label}.activation_status must be active or planned`);
  if (template.activation_status === 'planned' && template.runtime_eligible !== false) errors.push(`${label} planned template must not be runtime eligible`);
  if (template.activation_status === 'active' && template.runtime_eligible !== true) errors.push(`${label} active template must be runtime eligible`);

  const requiredSlots = Array.isArray(template.required_slots) ? template.required_slots : [];
  const optionalSlots = Array.isArray(template.optional_slots) ? template.optional_slots : [];
  if (!Array.isArray(template.required_slots) || requiredSlots.length === 0) errors.push(`${label}.required_slots must be a non-empty array`);
  if (!Array.isArray(template.optional_slots)) errors.push(`${label}.optional_slots must be an array`);
  const slotIds = new Set();
  const slotById = new Map();
  const acceptedCategoriesBySlot = new Map();
  requiredSlots.forEach((slot, slotIndex) => {
    const record = checkSlot(slot, `${label}.required_slots[${slotIndex}]`, 'required', context, errors);
    if (record && slotIds.has(record.id)) errors.push(`${label} duplicate slot_id: ${record.id}`);
    if (record) {
      slotIds.add(record.id);
      slotById.set(record.id, slot);
      acceptedCategoriesBySlot.set(record.id, record.acceptedCategories);
    }
  });
  optionalSlots.forEach((slot, slotIndex) => {
    const record = checkSlot(slot, `${label}.optional_slots[${slotIndex}]`, 'optional', context, errors);
    if (record && slotIds.has(record.id)) errors.push(`${label} duplicate slot_id: ${record.id}`);
    if (record) {
      slotIds.add(record.id);
      slotById.set(record.id, slot);
      acceptedCategoriesBySlot.set(record.id, record.acceptedCategories);
    }
  });

  if (!isObject(template.slot_limits)) errors.push(`${label}.slot_limits must be an object`);
  else {
    for (const [key, value] of Object.entries(template.slot_limits)) {
      const allowedLimitKeys = new Set([
        'total_user_items_min', 'total_user_items_max', ...[...slotIds].map(slotId => `${slotId}_max`),
      ]);
      if (!allowedLimitKeys.has(key)) errors.push(`${label}.slot_limits unknown slot_limits key: ${key}`);
      if (!Number.isInteger(value) || value < 0) errors.push(`${label}.slot_limits.${key} must be a non-negative integer`);
      const slotId = key.replace(/_max$/, '');
      if (key.endsWith('_max') && slotIds.has(slotId)) {
        const matching = slotById.get(slotId);
        if (Number.isInteger(value) && Number.isInteger(matching?.min_items) && value < matching.min_items) {
          errors.push(`${label}.slot_limits.${key} is below slot min_items`);
        }
        if (Number.isInteger(value) && Number.isInteger(matching?.max_items) && value > matching.max_items) {
          errors.push(`${label}.slot_limits.${key} is above slot max_items`);
        }
      }
    }
    if (!Number.isInteger(template.slot_limits.total_user_items_min) || !Number.isInteger(template.slot_limits.total_user_items_max)
      || template.slot_limits.total_user_items_min > template.slot_limits.total_user_items_max) {
      errors.push(`${label}.slot_limits total_user_items bounds are invalid`);
    }
    const requiredUserMinimum = requiredSlots.reduce((total, slot) => total + (
      Array.isArray(slot?.source_policy) && !slot.source_policy.includes('basic_extra') && Number.isInteger(slot.min_items)
        ? slot.min_items
        : 0
    ), 0);
    const userCapacity = [...requiredSlots, ...optionalSlots].reduce((total, slot) => total + (
      Array.isArray(slot?.source_policy) && slot.source_policy.includes('user') && Number.isInteger(slot.max_items)
        ? slot.max_items
        : 0
    ), 0);
    if (Number.isInteger(template.slot_limits.total_user_items_min)
      && template.slot_limits.total_user_items_min < requiredUserMinimum) {
      errors.push(`${label}.slot_limits.total_user_items_min is below required user slots`);
    }
    if (Number.isInteger(template.slot_limits.total_user_items_max)
      && template.slot_limits.total_user_items_max > userCapacity) {
      errors.push(`${label}.slot_limits.total_user_items_max exceeds user-provided capacity`);
    }
    if (Number.isInteger(template.slot_limits.total_user_items_min)
      && template.slot_limits.total_user_items_min > userCapacity) {
      errors.push(`${label}.slot_limits.total_user_items_min exceeds user-provided capacity`);
    }
  }

  if (!isObject(template.ingredient_categories)) errors.push(`${label}.ingredient_categories must be an object`);
  else {
    for (const [slotId, categories] of Object.entries(template.ingredient_categories)) {
      if (!slotIds.has(slotId)) errors.push(`${label}.ingredient_categories has unknown slot`);
      if (!stringArray(categories) || categories.some(category => !context.categories.has(category))) {
        errors.push(`${label}.ingredient_categories has unknown category`);
      }
      if (slotIds.has(slotId) && !sameStringSet(categories, acceptedCategoriesBySlot.get(slotId) || new Set())) {
        errors.push(`${label}.ingredient_categories.${slotId} must exactly match derived slot acceptance`);
      }
    }
    for (const slotId of slotIds) {
      if (!Object.hasOwn(template.ingredient_categories, slotId)) {
        errors.push(`${label}.ingredient_categories missing slot ${slotId}`);
      }
    }
  }
  checkRules(template.compatibility_rules, `${label}.compatibility_rules`, slotIds, acceptedCategoriesBySlot, context, errors, false);
  checkRules(template.incompatible_rules, `${label}.incompatible_rules`, slotIds, acceptedCategoriesBySlot, context, errors, true);
  checkShapeRequirements(template.shape_or_cut_requirements, `${label}.shape_or_cut_requirements`, slotIds, acceptedCategoriesBySlot, context, errors);
  checkCookingOrder(template.cooking_order, `${label}.cooking_order`, slotIds, acceptedCategoriesBySlot, errors);
  if (Array.isArray(template.cooking_order)) {
    const coveredSlots = new Set(template.cooking_order.flatMap(phase => Array.isArray(phase?.slot_ids) ? phase.slot_ids : []));
    for (const slot of requiredSlots) {
      if (isString(slot?.slot_id) && !coveredSlots.has(slot.slot_id)) {
        errors.push(`${label} required slot is missing from cooking_order: ${slot.slot_id}`);
      }
    }
  }

  if (!Array.isArray(template.ratio_constraints) || template.ratio_constraints.some(ref => !isString(ref) || !RATIO_REF_RE.test(ref))) {
    errors.push(`${label}.ratio_constraints must be machine Ratio DSL references`);
  }
  if (template.activation_status === 'active' && (!Array.isArray(template.ratio_constraints) || template.ratio_constraints.length === 0)) {
    errors.push(`${label} active template requires ratio_constraints`);
  }
  if (isObject(template.liquid_constraints)) assertAllowedKeys(template.liquid_constraints, LIQUID_CONSTRAINT_KEYS, `${label}.liquid_constraints`, errors);
  if (!isObject(template.liquid_constraints)
    || !stringArray(template.liquid_constraints.allowed_categories)
    || template.liquid_constraints.allowed_categories.some(category => !LIQUID_CATEGORIES.has(category))
    || !Number.isInteger(template.liquid_constraints.max_liquid_types)
    || template.liquid_constraints.max_liquid_types < 1
    || typeof template.liquid_constraints.must_be_measured !== 'boolean'
    || typeof template.liquid_constraints.retained_in_finished_meal !== 'boolean') {
    errors.push(`${label}.liquid_constraints are invalid`);
  }
  if (!Array.isArray(template.safety_endpoints)) errors.push(`${label}.safety_endpoints must be an array`);
  else template.safety_endpoints.forEach((endpoint, endpointIndex) => {
    if (isObject(endpoint)) assertAllowedKeys(endpoint, SAFETY_ENDPOINT_KEYS, `${label}.safety_endpoints[${endpointIndex}]`, errors);
    if (!isObject(endpoint) || !context.categories.has(endpoint.applies_to_category)) errors.push(`${label}.safety_endpoints[${endpointIndex}] has unknown category`);
    if (!isObject(endpoint) || !TEMPLATE_ENDPOINTS.has(endpoint.endpoint_code)) errors.push(`${label}.safety_endpoints[${endpointIndex}] has unknown endpoint`);
    if (isObject(endpoint) && TEMPLATE_ENDPOINTS.has(endpoint.endpoint_code)
      && !ENDPOINT_CATEGORIES.get(endpoint.endpoint_code)?.has(endpoint.applies_to_category)) {
      errors.push(`${label}.safety_endpoints[${endpointIndex}] endpoint does not apply to category`);
    }
    const acceptedCategories = new Set([...acceptedCategoriesBySlot.values()].flatMap(categories => [...categories]));
    if (isObject(endpoint) && context.categories.has(endpoint.applies_to_category)
      && !acceptedCategories.has(endpoint.applies_to_category)) {
      errors.push(`${label}.safety_endpoints[${endpointIndex}] safety endpoint category is not accepted by any slot`);
    }
  });
  if (Array.isArray(template.safety_endpoints)) {
    const templateEndpoints = new Set(template.safety_endpoints.map(endpoint => TEMPLATE_ENDPOINT_TO_TAXONOMY_ENDPOINT[endpoint?.endpoint_code]));
    const usedCategories = new Set([...acceptedCategoriesBySlot.values()].flatMap(categories => [...categories]));
    for (const category of usedCategories) {
      const requiredEndpoints = new Set();
      for (const item of Array.isArray(context.taxonomyItems) ? context.taxonomyItems : []) {
        if (item?.category !== category || item?.cooking_risk?.risk_code === 'none') continue;
        for (const endpoint of Array.isArray(item.cooking_risk.required_endpoint_codes) ? item.cooking_risk.required_endpoint_codes : []) {
          requiredEndpoints.add(endpoint);
        }
      }
      for (const endpoint of requiredEndpoints) {
        if (!templateEndpoints.has(endpoint)) {
          errors.push(`${isString(template.template_id) ? template.template_id : label} missing required safety endpoint for category ${category}`);
        }
      }
    }
  }
  if (isObject(template.time_range)) assertAllowedKeys(template.time_range, TIME_RANGE_KEYS, `${label}.time_range`, errors);
  if (!isObject(template.time_range)
    || !Number.isInteger(template.time_range.min_minutes)
    || !Number.isInteger(template.time_range.max_minutes)
    || template.time_range.min_minutes < 1
    || template.time_range.min_minutes > template.time_range.max_minutes) {
    errors.push(`${label}.time_range is invalid`);
  }
  if (!stringArray(template.supported_intents) || template.supported_intents.some(intent => !INTENTS.has(intent))) {
    errors.push(`${label}.supported_intents are invalid`);
  }
  if (template.supported_intents?.includes('quick') && template.time_range?.max_minutes > 30) {
    errors.push(`${label} quick template time_range.max_minutes must not exceed 30`);
  }
  if (!stringArray(template.evidence_recipe_ids)) errors.push(`${label}.evidence_recipe_ids must be a non-empty array`);
  else if (template.evidence_recipe_ids.some(recipeId => !recipeIds.has(recipeId))) errors.push(`${label} has unknown evidence recipe`);
}

export function validateMealTemplateCatalog(catalog, taxonomy, recipeLibrary, ratioCatalog) {
  try {
    const errors = [];
    if (!isObject(catalog)) return ['template catalog must be an object'];
    assertAllowedKeys(catalog, CATALOG_KEYS, 'template catalog', errors);
    if (catalog.schema_version !== 1) errors.push('schema_version must be 1');
    if (catalog.template_catalog_version !== 'templates-v2-20260727-r4') errors.push('template_catalog_version must be templates-v2-20260727-r4');
    if (!isObject(taxonomy) || taxonomy.taxonomy_version !== TAXONOMY_VERSION
      || catalog.ingredient_taxonomy_version !== TAXONOMY_VERSION
      || catalog.ingredient_taxonomy_version !== taxonomy.taxonomy_version) {
      errors.push('ingredient_taxonomy_version must match approved taxonomy');
    }
    if (!Array.isArray(catalog.templates)) return [...errors, 'templates must be an array'];
    if (catalog.templates.length !== EXPECTED_TEMPLATE_IDS.size) errors.push('templates must contain exactly 16 entries');
    const context = taxonomyContext(taxonomy);
    const recipeIds = new Set(Array.isArray(recipeLibrary?.recipes) ? recipeLibrary.recipes.map(recipe => recipe?.id).filter(isString) : []);
    if (recipeIds.size === 0) errors.push('recipe library must provide recipe IDs');
    const ids = new Set();
    catalog.templates.forEach((template, index) => {
      const id = template?.template_id;
      if (isString(id) && ids.has(id)) errors.push(`duplicate template_id: ${id}`);
      if (isString(id)) ids.add(id);
      checkTemplate(template, index, context, recipeIds, errors);
    });
    for (const expected of EXPECTED_TEMPLATE_IDS) if (!ids.has(expected)) errors.push(`missing template_id: ${expected}`);
    for (const id of ids) if (!EXPECTED_TEMPLATE_IDS.has(id)) errors.push(`unexpected template_id: ${id}`);
    for (const id of ACTIVE_TEMPLATE_IDS) {
      const template = catalog.templates.find(entry => entry?.template_id === id);
      if (template?.activation_status !== 'active' || template?.runtime_eligible !== true) {
        errors.push(`${id} must be active and runtime eligible`);
      }
    }
    for (const id of EXPECTED_TEMPLATE_IDS) {
      if (ACTIVE_TEMPLATE_IDS.has(id)) continue;
      const template = catalog.templates.find(entry => entry?.template_id === id);
      if (template?.activation_status !== 'planned' || template?.runtime_eligible !== false) {
        errors.push(`${id} must be planned and runtime ineligible`);
      }
    }
    if (ratioCatalog !== undefined) errors.push(...validateRatioDslCatalog(ratioCatalog, catalog, taxonomy, recipeLibrary));
    return errors;
  } catch (error) {
    return [`template catalog validation failed safely: ${error instanceof Error ? error.message : String(error)}`];
  }
}

export function assertMealTemplateCatalog(catalog, taxonomy, recipeLibrary, ratioCatalog) {
  const errors = validateMealTemplateCatalog(catalog, taxonomy, recipeLibrary, ratioCatalog);
  if (errors.length) throw new Error(`invalid meal template catalog:\n${errors.join('\n')}`);
}

export function getRuntimeEligibleTemplates(catalog) {
  if (!isObject(catalog) || !Array.isArray(catalog.templates)) return [];
  return catalog.templates.filter(template => ACTIVE_TEMPLATE_IDS.has(template?.template_id)
    && template?.activation_status === 'active' && template.runtime_eligible === true);
}

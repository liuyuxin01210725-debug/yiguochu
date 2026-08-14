/**
 * Deterministic gate for one real kitchen observation.
 *
 * This module deliberately validates a record, not a source card or a Planner
 * recipe.  Source-contract fields and observed fields stay separate so a
 * kitchen observation can never silently rewrite the recipe it was based on.
 */

const TOP_LEVEL_REQUIRED = Object.freeze([
  'schema_version',
  'observation_id',
  'recorded_at',
  'observer',
  'recipe',
  'claim_scope',
  'ingredients',
  'liquid',
  'equipment',
  'timeline',
  'process_adherence',
  'safety_endpoints',
  'sensory_result',
  'feedback',
  'journey_regression',
  'disposition',
  'evidence_refs',
]);
const TOP_LEVEL_ALLOWED = new Set(TOP_LEVEL_REQUIRED);

const INGREDIENT_STATES = new Set(['raw', 'soaked', 'cooked', 'canned', 'drained', 'other']);
const MEASUREMENT_METHODS = new Set(['scale', 'count', 'volume', 'waterline']);
const SAFETY_RESULTS = new Set(['pass', 'fail', 'not_applicable']);
const REQUIRED_EVIDENCE_KINDS = new Set([
  'ingredient_measurement',
  'liquid_measurement',
  'equipment',
  'timeline',
  'safety',
  'outcome',
  'journey',
]);
const NON_BROWSER_EVIDENCE_KINDS = new Set([
  'ingredient_measurement',
  'liquid_measurement',
  'equipment',
  'timeline',
  'safety',
  'outcome',
  'feedback',
]);
const VALID_DISPOSITIONS = new Set(['pending_review', 'repeat_required', 'fail_quality', 'blocked', 'kitchen_observed']);

const LEDGER_TOP_LEVEL_REQUIRED = Object.freeze([
  'schema_version',
  'ledger_version',
  'scope',
  'policy',
  'observations',
]);
const LEDGER_TOP_LEVEL_ALLOWED = new Set(LEDGER_TOP_LEVEL_REQUIRED);
const LEDGER_SCOPE = 'private-kitchen-observation-ledger';
const LEDGER_POLICY_KEYS = Object.freeze([
  'public_runtime_must_not_include_observations',
  'kitchen_observed_requires_independent_promotion_gate',
  'household_identity_and_quotes_are_private',
]);

const SCHEMA_REQUIRED_BY_DEF = Object.freeze({
  observer: ['operator_id', 'household_id', 'role'],
  recipe: ['recipe_id', 'variant_id', 'canonical_name', 'catalog_version', 'runtime_catalog_ref', 'execution_card_ref', 'source_status_at_attempt', 'formalization_status_at_attempt'],
  claimScope: ['servings_claimed', 'servings_observed', 'supported_batch_only'],
  ingredient: ['canonical_id', 'raw_label', 'state', 'source_amount', 'observed_amount', 'measurement_method', 'deviation_reason', 'used', 'substitution'],
  liquid: ['source_contract', 'observed_added_amount', 'observed_retained_liquid', 'observed_absorbed_or_remaining', 'waterline', 'liquid_phase_split', 'liquid_deviation'],
  equipment: ['brand', 'model', 'capacity', 'vessel_type', 'program', 'pressure_or_heat_mode', 'accessories', 'voltage_or_region_if_relevant', 'max_fill_or_waterline_limit'],
  timeline: ['prep_started_at', 'cook_started_at', 'program_elapsed_minutes', 'pressure_release_or_jump_at', 'rest_minutes', 'finish_at', 'manual_intervention_at'],
  process: ['steps'],
  safety: ['ingredient_or_hazard', 'required_endpoint', 'observed', 'result', 'evidence_ref'],
  sensory: ['rice_texture', 'protein_texture', 'vegetable_texture', 'liquid_or_bottom', 'taste', 'portion_complete', 'yield_observed', 'photos_or_notes'],
  feedback: ['instruction_clarity', 'missing_ingredient_or_tool', 'effort_level', 'would_repeat', 'quote', 'photo_refs', 'reported_safety_or_discomfort'],
  journey: ['journey_id', 'mode', 'intent', 'servings', 'input_items', 'dislikes_or_allergens', 'expected_plan_status', 'actual_plan_status', 'used_items', 'unused_items_and_reason', 'substitution_result', 'failure_code', 'browser_evidence_ref'],
  disposition: ['status', 'reviewer_id', 'reviewed_at', 'approve_for_production', 'notes'],
  evidence: ['kind', 'id', 'ref'],
});

const SCHEMA_ENUMS_BY_DEF = Object.freeze({
  'observer.role': ['cook', 'reviewer'],
  'ingredient.state': ['raw', 'soaked', 'cooked', 'canned', 'drained', 'other'],
  'ingredient.measurement_method': ['scale', 'count', 'volume', 'waterline'],
  'safety.result': ['pass', 'fail', 'not_applicable'],
  'disposition.status': ['pending_review', 'repeat_required', 'fail_quality', 'blocked', 'kitchen_observed'],
});

const SCHEMA_NESTED_REQUIRED = Object.freeze({
  'liquid.source_contract': ['type', 'amount', 'expression'],
  'liquid.waterline': ['appliance_model', 'scale', 'mark'],
  'liquid.liquid_phase_split.items': ['phase', 'amount'],
  'liquid.liquid_deviation': ['occurred', 'details'],
  'equipment.capacity': ['value', 'unit'],
  'process.steps.items': ['step', 'completed', 'observed_at', 'deviation', 'deviation_reason', 'external_vessel_action'],
  'safety.required_endpoint': ['kind', 'minimum'],
  'safety.observed': ['value', 'unit', 'instrument_id', 'location', 'measured_at'],
  'sensory.yield_observed': ['servings', 'amount'],
  'journey.substitution_result': ['attempted', 'status', 'details'],
});

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function schemaTypeMatches(value, type) {
  if (type === 'null') return value === null;
  if (type === 'object') return isObject(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'string') return typeof value === 'string';
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (type === 'boolean') return typeof value === 'boolean';
  return true;
}

function resolveSchemaRef(root, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return null;
  return ref.slice(2).split('/').reduce((value, key) => value?.[key.replaceAll('~1', '/').replaceAll('~0', '~')], root);
}

function validateSchemaValue(value, schema, root, path, errors) {
  if (!isObject(schema)) return;
  if (schema.$ref) {
    const target = resolveSchemaRef(root, schema.$ref);
    if (!target) errors.push(`${path} has unresolved schema ref ${schema.$ref}`);
    else validateSchemaValue(value, target, root, path, errors);
    return;
  }
  if (schema.const !== undefined && JSON.stringify(value) !== JSON.stringify(schema.const)) errors.push(`${path} must equal schema const`);
  if (Array.isArray(schema.enum) && !schema.enum.some(option => JSON.stringify(option) === JSON.stringify(value))) errors.push(`${path} is not in schema enum`);
  const types = Array.isArray(schema.type) ? schema.type : (schema.type ? [schema.type] : []);
  if (types.length && !types.some(type => schemaTypeMatches(value, type))) {
    errors.push(`${path} has invalid schema type`);
    return;
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${path} is shorter than schema minLength`);
    if (schema.format === 'date-time' && !isIsoDateTime(value)) errors.push(`${path} is not a strict schema date-time`);
  }
  if (typeof value === 'number' && schema.minimum !== undefined && value < schema.minimum) errors.push(`${path} is below schema minimum`);
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${path} has fewer than schema minItems`);
    if (schema.items) value.forEach((item, index) => validateSchemaValue(item, schema.items, root, `${path}[${index}]`, errors));
  }
  if (isObject(value)) {
    for (const required of Array.isArray(schema.required) ? schema.required : []) {
      if (!Object.prototype.hasOwnProperty.call(value, required)) errors.push(`${path}.${required} is required by schema`);
    }
    const properties = isObject(schema.properties) ? schema.properties : {};
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) if (!Object.prototype.hasOwnProperty.call(properties, key)) errors.push(`${path}.${key} is not allowed by schema`);
    }
    for (const [key, childSchema] of Object.entries(properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) validateSchemaValue(value[key], childSchema, root, `${path}.${key}`, errors);
    }
  }
}

export function validateKitchenObservationSchemaInstance(observation, schema) {
  const errors = [];
  validateSchemaValue(observation, schema, schema, '$', errors);
  return [...new Set(errors)];
}

function isIsoDateTime(value) {
  return isNonEmptyString(value)
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/u.test(value)
    && !Number.isNaN(Date.parse(value));
}

export { isIsoDateTime };

function requiredObject(value, path, errors) {
  if (!isObject(value)) {
    errors.push(`${path} is required`);
    return false;
  }
  return true;
}

function requiredString(value, path, errors) {
  if (!isNonEmptyString(value)) errors.push(`${path} is required`);
}

function requiredText(value, path, errors) {
  if (typeof value !== 'string') errors.push(`${path} must be a string`);
}

function requiredDateTime(value, path, errors) {
  if (value === undefined || value === null || value === '') {
    errors.push(`${path} is required`);
  } else if (!isIsoDateTime(value)) {
    errors.push(`${path} must be an ISO date-time`);
  }
}

function numericUnit(unit) {
  const normalized = String(unit || '').trim().toLowerCase().replace(/[°\s]/g, '');
  if (normalized === 'c' || normalized === 'celsius') return 'c';
  if (normalized === 'f' || normalized === 'fahrenheit') return 'f';
  return normalized;
}

function convertTemperature(value, unit) {
  const normalized = numericUnit(unit);
  if (normalized === 'c') return value;
  if (normalized === 'f') return (value - 32) * (5 / 9);
  return null;
}

function requiredNumber(value, path, errors, { min = null } = {}) {
  if (!isFiniteNumber(value)) {
    errors.push(`${path} must be a finite number`);
  } else if (min !== null && value < min) {
    errors.push(`${path} must be >= ${min}`);
  }
}

function amountObject(value, path, errors) {
  if (!requiredObject(value, path, errors)) return;
  requiredNumber(value.value, `${path}.value`, errors, { min: 0 });
  requiredString(value.unit, `${path}.unit`, errors);
}

function validateObserver(observer, errors) {
  if (!requiredObject(observer, 'observer', errors)) return;
  requiredString(observer.operator_id, 'observer.operator_id', errors);
  requiredString(observer.household_id, 'observer.household_id', errors);
  if (!['cook', 'reviewer'].includes(observer.role)) errors.push('observer.role must be cook or reviewer');
}

function validateRecipe(recipe, errors) {
  if (!requiredObject(recipe, 'recipe', errors)) return;
  for (const field of [
    'recipe_id',
    'variant_id',
    'canonical_name',
    'catalog_version',
    'runtime_catalog_ref',
    'execution_card_ref',
    'source_status_at_attempt',
    'formalization_status_at_attempt',
  ]) requiredString(recipe[field], `recipe.${field}`, errors);
  if (Object.prototype.hasOwnProperty.call(recipe, 'required_safety_endpoint_codes')) {
    if (!Array.isArray(recipe.required_safety_endpoint_codes)) errors.push('recipe.required_safety_endpoint_codes must be an array');
    else recipe.required_safety_endpoint_codes.forEach((code, index) => requiredString(code, `recipe.required_safety_endpoint_codes[${index}]`, errors));
  }
  const trialFields = ['trial_catalog_version', 'trial_candidate_id', 'trial_variant_id', 'trial_contract_hashes'];
  if (trialFields.some(field => Object.prototype.hasOwnProperty.call(recipe, field))) {
    for (const field of ['trial_catalog_version', 'trial_candidate_id']) requiredString(recipe[field], `recipe.${field}`, errors);
    if (recipe.trial_variant_id !== null && !isNonEmptyString(recipe.trial_variant_id)) errors.push('recipe.trial_variant_id must be a string or null');
    if (!isObject(recipe.trial_contract_hashes)) {
      errors.push('recipe.trial_contract_hashes must be an object');
    } else {
      for (const key of ['source', 'execution', 'formalization', 'formal_review']) {
        if (!/^[a-f0-9]{64}$/u.test(recipe.trial_contract_hashes[key] || '')) errors.push(`recipe.trial_contract_hashes.${key} must be a SHA-256 hex digest`);
      }
      for (const key of Object.keys(recipe.trial_contract_hashes)) {
        if (!['source', 'execution', 'formalization', 'formal_review'].includes(key)) errors.push(`recipe.trial_contract_hashes.${key} is not allowed`);
      }
    }
  }
}

function validateClaimScope(scope, errors) {
  if (!requiredObject(scope, 'claim_scope', errors)) return;
  requiredNumber(scope.servings_claimed, 'claim_scope.servings_claimed', errors, { min: 1 });
  requiredNumber(scope.servings_observed, 'claim_scope.servings_observed', errors, { min: 1 });
  if (scope.supported_batch_only !== true) errors.push('claim_scope.supported_batch_only must be true');
}

function validateIngredients(ingredients, errors) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    errors.push('ingredients must be a non-empty array');
    return;
  }
  ingredients.forEach((ingredient, index) => {
    const path = `ingredients[${index}]`;
    if (!requiredObject(ingredient, path, errors)) return;
    for (const field of ['canonical_id', 'raw_label']) requiredString(ingredient[field], `${path}.${field}`, errors);
    if (!INGREDIENT_STATES.has(ingredient.state)) errors.push(`${path}.state is invalid`);
    amountObject(ingredient.source_amount, `${path}.source_amount`, errors);
    amountObject(ingredient.observed_amount, `${path}.observed_amount`, errors);
    requiredString(ingredient.measurement_method, `${path}.measurement_method`, errors);
    if (!MEASUREMENT_METHODS.has(ingredient.measurement_method)) errors.push(`${path}.measurement_method is invalid`);
    if (typeof ingredient.used !== 'boolean') errors.push(`${path}.used must be boolean`);
    if (Object.prototype.hasOwnProperty.call(ingredient, 'amount')) {
      errors.push(`${path}.amount is forbidden; use source_amount and observed_amount separately`);
    }
    if (ingredient.substitution !== null && !isObject(ingredient.substitution)) {
      errors.push(`${path}.substitution must be an object or null`);
    }
    if (isObject(ingredient.substitution)) {
      for (const field of ['replaces', 'actual_ingredient', 'approved_slot', 'reason']) {
        requiredString(ingredient.substitution[field], `${path}.substitution.${field}`, errors);
      }
    }
  });
}

function validateLiquid(liquid, errors) {
  if (!requiredObject(liquid, 'liquid', errors)) return;
  if (!isObject(liquid.source_contract)) errors.push('liquid.source_contract is required');
  else {
    requiredString(liquid.source_contract.type, 'liquid.source_contract.type', errors);
    amountObject(liquid.source_contract.amount, 'liquid.source_contract.amount', errors);
    requiredString(liquid.source_contract.expression, 'liquid.source_contract.expression', errors);
  }
  amountObject(liquid.observed_added_amount, 'liquid.observed_added_amount', errors);
  amountObject(liquid.observed_retained_liquid, 'liquid.observed_retained_liquid', errors);
  requiredString(liquid.observed_absorbed_or_remaining, 'liquid.observed_absorbed_or_remaining', errors);
  if (!requiredObject(liquid.waterline, 'liquid.waterline', errors)) return;
  for (const field of ['appliance_model', 'scale', 'mark']) requiredString(liquid.waterline[field], `liquid.waterline.${field}`, errors);
  if (!Array.isArray(liquid.liquid_phase_split) || liquid.liquid_phase_split.length === 0) {
    errors.push('liquid.liquid_phase_split must be a non-empty array');
  } else {
    liquid.liquid_phase_split.forEach((phase, index) => {
      const path = `liquid.liquid_phase_split[${index}]`;
      if (!requiredObject(phase, path, errors)) return;
      requiredString(phase.phase, `${path}.phase`, errors);
      amountObject(phase.amount, `${path}.amount`, errors);
    });
  }
  if (!requiredObject(liquid.liquid_deviation, 'liquid.liquid_deviation', errors)) return;
  if (typeof liquid.liquid_deviation.occurred !== 'boolean') errors.push('liquid.liquid_deviation.occurred must be boolean');
  requiredText(liquid.liquid_deviation.details, 'liquid.liquid_deviation.details', errors);
}

function validateEquipment(equipment, errors) {
  if (!requiredObject(equipment, 'equipment', errors)) return;
  for (const field of ['brand', 'model', 'vessel_type', 'program', 'pressure_or_heat_mode', 'voltage_or_region_if_relevant', 'max_fill_or_waterline_limit']) {
    requiredString(equipment[field], `equipment.${field}`, errors);
  }
  if (!isObject(equipment.capacity)) errors.push('equipment.capacity is required');
  else {
    requiredNumber(equipment.capacity.value, 'equipment.capacity.value', errors, { min: 0 });
    requiredString(equipment.capacity.unit, 'equipment.capacity.unit', errors);
  }
  if (!Array.isArray(equipment.accessories)) errors.push('equipment.accessories must be an array');
}

function validateTimeline(timeline, errors) {
  if (!requiredObject(timeline, 'timeline', errors)) return;
  for (const field of ['prep_started_at', 'cook_started_at', 'pressure_release_or_jump_at', 'finish_at']) {
    requiredDateTime(timeline[field], `timeline.${field}`, errors);
  }
  requiredNumber(timeline.program_elapsed_minutes, 'timeline.program_elapsed_minutes', errors, { min: 0 });
  requiredNumber(timeline.rest_minutes, 'timeline.rest_minutes', errors, { min: 0 });
  if (!Array.isArray(timeline.manual_intervention_at)) errors.push('timeline.manual_intervention_at must be an array');
  const dates = ['prep_started_at', 'cook_started_at', 'pressure_release_or_jump_at', 'finish_at']
    .map(field => Date.parse(timeline[field]));
  if (dates.every(Number.isFinite)) {
    if (!(dates[0] <= dates[1] && dates[1] <= dates[2] && dates[2] <= dates[3])) {
      errors.push('timeline must be chronological');
    }
    const elapsedMinutes = (dates[2] - dates[1]) / 60000;
    if (Math.abs(elapsedMinutes - timeline.program_elapsed_minutes) > 1) {
      errors.push('timeline.program_elapsed_minutes is inconsistent with timestamp interval');
    }
    const restMinutes = (dates[3] - dates[2]) / 60000;
    if (Math.abs(restMinutes - timeline.rest_minutes) > 1) {
      errors.push('timeline.rest_minutes is inconsistent with timestamp interval');
    }
  }
}

function validateProcessAdherence(process, errors) {
  if (!requiredObject(process, 'process_adherence', errors)) return;
  if (!Array.isArray(process.steps) || process.steps.length === 0) {
    errors.push('process_adherence.steps must be a non-empty array');
    return;
  }
  process.steps.forEach((step, index) => {
    const path = `process_adherence.steps[${index}]`;
    if (!requiredObject(step, path, errors)) return;
    requiredNumber(step.step, `${path}.step`, errors, { min: 1 });
    if (typeof step.completed !== 'boolean') errors.push(`${path}.completed must be boolean`);
    requiredDateTime(step.observed_at, `${path}.observed_at`, errors);
    for (const field of ['deviation', 'deviation_reason', 'external_vessel_action']) requiredText(step[field], `${path}.${field}`, errors);
  });
}

function validateSafetyEndpoints(endpoints, errors) {
  if (!Array.isArray(endpoints)) {
    errors.push('safety_endpoints must be an array');
    return;
  }
  endpoints.forEach((endpoint, index) => {
    const path = `safety_endpoints[${index}]`;
    if (!requiredObject(endpoint, path, errors)) return;
    requiredString(endpoint.ingredient_or_hazard, `${path}.ingredient_or_hazard`, errors);
    if (!requiredObject(endpoint.required_endpoint, `${path}.required_endpoint`, errors)) return;
    requiredString(endpoint.required_endpoint.kind, `${path}.required_endpoint.kind`, errors);
    requiredNumber(endpoint.required_endpoint.minimum, `${path}.required_endpoint.minimum`, errors);
    if (!requiredObject(endpoint.observed, `${path}.observed`, errors)) return;
    requiredNumber(endpoint.observed.value, `${path}.observed.value`, errors);
    requiredString(endpoint.observed.unit, `${path}.observed.unit`, errors);
    requiredString(endpoint.observed.instrument_id, `${path}.observed.instrument_id`, errors);
    requiredString(endpoint.observed.location, `${path}.observed.location`, errors);
    requiredDateTime(endpoint.observed.measured_at, `${path}.observed.measured_at`, errors);
    if (!SAFETY_RESULTS.has(endpoint.result)) errors.push(`${path}.result is invalid`);
    if (endpoint.result === 'fail') errors.push(`${path} must pass`);
    if (endpoint.result === 'pass') {
      const observedC = convertTemperature(endpoint.observed.value, endpoint.observed.unit);
      const requiredKind = String(endpoint.required_endpoint.kind || '').toLowerCase();
      const requiredMinimum = endpoint.required_endpoint.minimum;
      if (requiredKind.includes('temperature') && observedC === null) {
        errors.push(`${path} has an incompatible safety unit`);
      } else if (requiredKind.includes('temperature') && observedC < requiredMinimum) {
        errors.push(`${path} observed value is below required minimum`);
      }
    }
    requiredString(endpoint.evidence_ref, `${path}.evidence_ref`, errors);
  });
}

function validateEvidenceResolution(endpoints, refs, errors) {
  const ids = new Set((Array.isArray(refs) ? refs : []).map(ref => ref?.id).filter(isNonEmptyString));
  (Array.isArray(endpoints) ? endpoints : []).forEach((endpoint, index) => {
    if (isNonEmptyString(endpoint?.evidence_ref) && !ids.has(endpoint.evidence_ref)) {
      errors.push(`safety_endpoints[${index}].evidence_ref does not resolve to evidence_refs`);
    }
  });
}

function validateSensoryResult(result, errors) {
  if (!requiredObject(result, 'sensory_result', errors)) return;
  for (const field of ['rice_texture', 'protein_texture', 'vegetable_texture', 'liquid_or_bottom', 'taste', 'photos_or_notes']) {
    requiredString(result[field], `sensory_result.${field}`, errors);
  }
  if (typeof result.portion_complete !== 'boolean') errors.push('sensory_result.portion_complete must be boolean');
  if (!requiredObject(result.yield_observed, 'sensory_result.yield_observed', errors)) return;
  requiredNumber(result.yield_observed.servings, 'sensory_result.yield_observed.servings', errors, { min: 0 });
  amountObject(result.yield_observed.amount, 'sensory_result.yield_observed.amount', errors);
}

function validateFeedback(feedback, errors) {
  if (!requiredObject(feedback, 'feedback', errors)) return;
  for (const field of ['instruction_clarity', 'effort_level']) {
    requiredString(feedback[field], `feedback.${field}`, errors);
  }
  for (const field of ['missing_ingredient_or_tool', 'reported_safety_or_discomfort']) {
    requiredText(feedback[field], `feedback.${field}`, errors);
  }
  requiredString(feedback.quote, 'feedback.quote', errors);
  if (typeof feedback.would_repeat !== 'boolean') errors.push('feedback.would_repeat must be boolean');
  if (!Array.isArray(feedback.photo_refs)) errors.push('feedback.photo_refs must be an array');
}

function validateJourney(journey, errors) {
  if (!requiredObject(journey, 'journey_regression', errors)) return;
  for (const field of ['journey_id', 'mode', 'intent', 'expected_plan_status', 'actual_plan_status', 'browser_evidence_ref']) {
    requiredString(journey[field], `journey_regression.${field}`, errors);
  }
  requiredNumber(journey.servings, 'journey_regression.servings', errors, { min: 1 });
  for (const field of ['input_items', 'dislikes_or_allergens', 'used_items', 'unused_items_and_reason']) {
    if (!Array.isArray(journey[field])) errors.push(`journey_regression.${field} must be an array`);
  }
  if (!requiredObject(journey.substitution_result, 'journey_regression.substitution_result', errors)) return;
  if (typeof journey.substitution_result.attempted !== 'boolean') errors.push('journey_regression.substitution_result.attempted must be boolean');
  requiredString(journey.substitution_result.status, 'journey_regression.substitution_result.status', errors);
  requiredText(journey.substitution_result.details, 'journey_regression.substitution_result.details', errors);
  if (journey.failure_code !== null && !isNonEmptyString(journey.failure_code)) errors.push('journey_regression.failure_code must be a string or null');
}

function validateDisposition(disposition, errors) {
  if (!requiredObject(disposition, 'disposition', errors)) return;
  if (!VALID_DISPOSITIONS.has(disposition.status)) {
    errors.push('disposition.status is invalid; production_approved is not a valid kitchen observation disposition');
  }
  requiredString(disposition.reviewer_id, 'disposition.reviewer_id', errors);
  if (disposition.reviewed_at !== null) requiredDateTime(disposition.reviewed_at, 'disposition.reviewed_at', errors);
  if (typeof disposition.approve_for_production !== 'boolean') errors.push('disposition.approve_for_production must be boolean');
  if (disposition.approve_for_production === true) errors.push('disposition.approve_for_production must remain false until independent production gate');
  requiredText(disposition.notes, 'disposition.notes', errors);
}

function validateEvidenceRefs(refs, errors) {
  if (!Array.isArray(refs) || refs.length === 0) {
    errors.push('evidence_refs must contain at least one evidence reference');
    return;
  }
  const kinds = new Set();
  let hasNonBrowserEvidence = false;
  refs.forEach((ref, index) => {
    const path = `evidence_refs[${index}]`;
    if (!requiredObject(ref, path, errors)) return;
    requiredString(ref.kind, `${path}.kind`, errors);
    requiredString(ref.id, `${path}.id`, errors);
    requiredString(ref.ref, `${path}.ref`, errors);
    if (isNonEmptyString(ref.kind)) kinds.add(ref.kind);
    const browserOnly = ref.kind === 'browser' || /^browser:/u.test(ref.ref || '') || /^node:/u.test(ref.ref || '');
    if (!browserOnly && NON_BROWSER_EVIDENCE_KINDS.has(ref.kind)) hasNonBrowserEvidence = true;
  });
  for (const kind of REQUIRED_EVIDENCE_KINDS) {
    if (!kinds.has(kind)) errors.push(`evidence_refs must include ${kind} evidence`);
  }
  if (!hasNonBrowserEvidence) errors.push('evidence_refs must include non-browser kitchen evidence');
}

export function validateKitchenObservation(observation) {
  const errors = [];
  if (!isObject(observation)) return ['kitchen observation must be an object'];
  for (const field of Object.keys(observation)) {
    if (!TOP_LEVEL_ALLOWED.has(field)) errors.push(`unknown top-level field: ${field}`);
  }
  for (const field of TOP_LEVEL_REQUIRED) {
    if (!Object.prototype.hasOwnProperty.call(observation, field)) errors.push(`${field} is required`);
  }
  if (observation.schema_version !== 'kitchen-observation.v1') errors.push('schema_version must equal kitchen-observation.v1');
  requiredString(observation.observation_id, 'observation_id', errors);
  requiredDateTime(observation.recorded_at, 'recorded_at', errors);
  validateObserver(observation.observer, errors);
  validateRecipe(observation.recipe, errors);
  validateClaimScope(observation.claim_scope, errors);
  validateIngredients(observation.ingredients, errors);
  validateLiquid(observation.liquid, errors);
  validateEquipment(observation.equipment, errors);
  validateTimeline(observation.timeline, errors);
  validateProcessAdherence(observation.process_adherence, errors);
  validateSafetyEndpoints(observation.safety_endpoints, errors);
  validateSensoryResult(observation.sensory_result, errors);
  validateFeedback(observation.feedback, errors);
  validateJourney(observation.journey_regression, errors);
  validateDisposition(observation.disposition, errors);
  validateEvidenceRefs(observation.evidence_refs, errors);
  validateEvidenceResolution(observation.safety_endpoints, observation.evidence_refs, errors);
  return [...new Set(errors)];
}

export function isKitchenObservationReady(observation) {
  return validateKitchenObservation(observation).length === 0;
}

export function isKitchenObservedReady(observation, { requiredSafetyEndpointCodes = null } = {}) {
  if (!isKitchenObservationReady(observation)) return false;
  if (observation.disposition?.status !== 'kitchen_observed') return false;
  if (!isIsoDateTime(observation.disposition?.reviewed_at)) return false;
  if (!observation.sensory_result?.portion_complete) return false;
  if (!observation.process_adherence?.steps?.every(step => step.completed === true)) return false;
  const requiredCodes = Array.isArray(requiredSafetyEndpointCodes)
    ? requiredSafetyEndpointCodes
    : (Array.isArray(observation.recipe?.required_safety_endpoint_codes)
    ? observation.recipe.required_safety_endpoint_codes
    : []);
  if (!Array.isArray(observation.safety_endpoints)) return false;
  if (requiredCodes.length === 0 && observation.safety_endpoints.length === 0) return true;
  const seenRequired = new Set();
  for (const endpoint of observation.safety_endpoints) {
    const code = endpoint?.required_endpoint?.code;
    const required = code && requiredCodes.includes(code);
    if (required) {
      seenRequired.add(code);
      if (endpoint.result !== 'pass') return false;
    }
    if (!required && endpoint.result === 'not_applicable') continue;
    if (endpoint.result !== 'pass') return false;
  }
  if (requiredCodes.some(code => !seenRequired.has(code))) return false;
  return true;
}

export function validateKitchenObservationReferences(observation, { runtimeCatalog, trialCatalog, executionLibrary } = {}) {
  const errors = [];
  const recipeId = observation?.recipe?.recipe_id;
  if (!recipeId) return errors;
  const runtimeEntries = new Map((Array.isArray(runtimeCatalog?.entries) ? runtimeCatalog.entries : []).map(entry => [entry?.recipe_id, entry]));
  const trialEntries = new Map((Array.isArray(trialCatalog?.entries) ? trialCatalog.entries : []).map(entry => [entry?.recipe_id, entry]));
  const executionEntries = new Map((Array.isArray(executionLibrary?.entries) ? executionLibrary.entries : []).map(entry => [entry?.recipe_id, entry]));
  const runtimeVersion = runtimeCatalog?.runtime_catalog_version || runtimeCatalog?.recipe_runtime_catalog_version || null;
  const trialVersion = trialCatalog?.kitchen_trial_catalog_version || null;
  const executionVersion = executionLibrary?.execution_library_version || null;
  const runtimeRef = observation?.recipe?.runtime_catalog_ref;
  const executionRef = observation?.recipe?.execution_card_ref;
  const runtimePattern = runtimeVersion ? new RegExp(`^${escapeRegExp(runtimeVersion)}#([^#]+)$`, 'u') : null;
  const trialPattern = trialVersion ? new RegExp(`^${escapeRegExp(trialVersion)}#([^#]+)$`, 'u') : null;
  const executionPattern = executionVersion ? new RegExp(`^${escapeRegExp(executionVersion)}#([^#]+)$`, 'u') : null;
  const runtimeMatch = runtimePattern?.exec(runtimeRef || '');
  const trialMatch = trialPattern?.exec(runtimeRef || '');
  const executionMatch = executionPattern?.exec(executionRef || '');
  if (runtimeMatch) {
    if (runtimeMatch[1] !== recipeId || !runtimeEntries.has(runtimeMatch[1])) errors.push('recipe.runtime_catalog_ref does not resolve to recipe');
  } else if (trialMatch) {
    const trialEntry = trialEntries.get(trialMatch[1]);
    if (trialMatch[1] !== recipeId || !trialEntry || trialEntry.trial_eligible !== true || trialEntry.planner_runtime_eligible !== false || trialEntry.production_approved !== false) {
      errors.push('recipe.runtime_catalog_ref does not resolve to eligible trial recipe');
    } else {
      if (trialEntry.candidate_id !== recipeId) errors.push('trial candidate_id does not match recipe');
      if (trialEntry.variant_id !== null) errors.push('trial variant_id must remain null for the canonical trial candidate');
      if (!Array.isArray(trialEntry.eligibility_reasons) || trialEntry.eligibility_reasons.length !== 0) errors.push('trial candidate eligibility was not strictly recomputed');
      if (trialEntry.cooker_boundary_preserved !== true) errors.push('trial candidate cooker boundary is not preserved');
      const recipeTrial = observation?.recipe || {};
      if (recipeTrial.trial_catalog_version !== trialVersion) errors.push('recipe.trial_catalog_version does not match trial catalog');
      if (recipeTrial.trial_candidate_id !== (trialEntry.candidate_id || recipeId)) errors.push('recipe.trial_candidate_id does not match trial catalog candidate');
      if (recipeTrial.trial_variant_id !== (trialEntry.variant_id ?? null)) errors.push('recipe.trial_variant_id does not match trial catalog variant');
      if (JSON.stringify(recipeTrial.trial_contract_hashes || null) !== JSON.stringify(trialEntry.contract_hashes || null)) errors.push('recipe.trial_contract_hashes do not match trial contract hashes');
    }
  } else {
    errors.push('recipe.runtime_catalog_ref must use versioned runtime catalog ref or trial catalog ref');
  }
  if (!executionMatch) {
    errors.push('recipe.execution_card_ref must use versioned execution ref');
  } else if (executionMatch[1] !== recipeId || !executionEntries.has(executionMatch[1])) {
    errors.push('recipe.execution_card_ref does not resolve to recipe');
  }
  return errors;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validateRequiredFields(value, required, path, errors) {
  if (!isObject(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (!Array.isArray(value.required)) {
    errors.push(`${path}.required is missing`);
    return;
  }
  for (const field of required) {
    if (!value.required.includes(field)) errors.push(`${path}.${field} is required`);
  }
}

function validateEnumParity(schema, path, expected, errors) {
  const properties = path.split('.');
  const defName = properties.shift();
  let current = schema?.$defs?.[defName];
  for (const segment of properties) current = current?.properties?.[segment];
  const actual = Array.isArray(current?.enum) ? current.enum : null;
  if (!actual || JSON.stringify([...actual].sort()) !== JSON.stringify([...expected].sort())) {
    errors.push(`${path} enum does not match validator`);
  }
}

function schemaNode(schema, path) {
  const segments = path.split('.');
  const defName = segments.shift();
  let current = schema?.$defs?.[defName];
  for (const segment of segments) {
    if (segment === 'items') current = current?.items;
    else current = current?.properties?.[segment];
  }
  if (current?.$ref?.startsWith('#/$defs/')) {
    return schema?.$defs?.[current.$ref.slice('#/$defs/'.length)] || current;
  }
  return current;
}

export function validateKitchenObservationSchemaParity(schema) {
  const errors = [];
  if (!isObject(schema)) return ['kitchen observation schema must be an object'];
  if (schema.$id !== 'https://yiguochu.pages.dev/schemas/kitchen-observation.v1.json') errors.push('schema $id is stale');
  if (schema.type !== 'object') errors.push('schema root type must be object');
  if (schema.additionalProperties !== false) errors.push('schema root additionalProperties must be false');
  if (JSON.stringify([...(schema.required || [])].sort()) !== JSON.stringify([...TOP_LEVEL_REQUIRED].sort())) {
    errors.push('schema top-level required fields do not match validator');
  }
  for (const [defName, required] of Object.entries(SCHEMA_REQUIRED_BY_DEF)) {
    validateRequiredFields(schema?.$defs?.[defName], required, `$defs.${defName}`, errors);
  }
  for (const [path, required] of Object.entries(SCHEMA_NESTED_REQUIRED)) {
    validateRequiredFields(schemaNode(schema, path), required, `$defs.${path}`, errors);
  }
  for (const [path, expected] of Object.entries(SCHEMA_ENUMS_BY_DEF)) {
    validateEnumParity(schema, path, expected, errors);
  }
  const dispositionEnum = schema?.$defs?.disposition?.properties?.status?.enum;
  if (Array.isArray(dispositionEnum) && dispositionEnum.includes('production_approved')) {
    errors.push('disposition.status must not include production_approved');
  }
  const substitutionRequired = schema?.$defs?.ingredient?.properties?.substitution?.required;
  if (!Array.isArray(substitutionRequired)) errors.push('ingredient.substitution required fields are missing');
  const approvalConst = schema?.$defs?.disposition?.properties?.approve_for_production?.const;
  if (approvalConst !== false) errors.push('disposition.approve_for_production must be const false');
  return [...new Set(errors)];
}

export function validateKitchenObservationLedger(ledger) {
  const errors = [];
  if (!isObject(ledger)) return ['kitchen observation ledger must be an object'];
  for (const field of Object.keys(ledger)) {
    if (!LEDGER_TOP_LEVEL_ALLOWED.has(field)) errors.push(`unknown ledger field: ${field}`);
  }
  for (const field of LEDGER_TOP_LEVEL_REQUIRED) {
    if (!Object.prototype.hasOwnProperty.call(ledger, field)) errors.push(`ledger.${field} is required`);
  }
  if (ledger.schema_version !== 'kitchen-observations.v1') errors.push('ledger.schema_version must equal kitchen-observations.v1');
  requiredString(ledger.ledger_version, 'ledger.ledger_version', errors);
  if (ledger.scope !== LEDGER_SCOPE) errors.push('ledger.scope is invalid');
  if (!isObject(ledger.policy)) errors.push('ledger.policy is required');
  else {
    for (const field of LEDGER_POLICY_KEYS) {
      if (ledger.policy[field] !== true) errors.push(`ledger.policy.${field} must be true`);
    }
  }
  if (!Array.isArray(ledger.observations)) {
    errors.push('ledger.observations must be an array');
    return [...new Set(errors)];
  }
  const seen = new Set();
  ledger.observations.forEach((observation, index) => {
    const path = `observations[${index}]`;
    if (!isObject(observation)) {
      errors.push(`${path} must be an object`);
      return;
    }
    const observationErrors = validateKitchenObservation(observation);
    errors.push(...observationErrors.map(error => `${path}.${error}`));
    if (isNonEmptyString(observation.observation_id)) {
      if (seen.has(observation.observation_id)) errors.push(`duplicate observation_id ${observation.observation_id}`);
      seen.add(observation.observation_id);
    }
  });
  return [...new Set(errors)];
}

export function assertKitchenObservationLedger(ledger) {
  const errors = validateKitchenObservationLedger(ledger);
  if (errors.length > 0) throw new Error(`invalid kitchen observation ledger:\n${errors.join('\n')}`);
  return ledger;
}

export function assertKitchenObservation(observation) {
  const errors = validateKitchenObservation(observation);
  if (errors.length > 0) throw new Error(`invalid kitchen observation:\n${errors.join('\n')}`);
  return observation;
}

export const kitchenObservationRequiredFields = TOP_LEVEL_REQUIRED;

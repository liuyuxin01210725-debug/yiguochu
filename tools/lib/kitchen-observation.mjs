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

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isIsoDateTime(value) {
  return isNonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

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
  if (!Array.isArray(endpoints) || endpoints.length === 0) {
    errors.push('safety_endpoints must contain at least one endpoint');
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
    if (endpoint.result !== 'pass') errors.push(`${path} must pass`);
    requiredString(endpoint.evidence_ref, `${path}.evidence_ref`, errors);
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
  for (const field of ['instruction_clarity', 'effort_level', 'quote']) {
    requiredString(feedback[field], `feedback.${field}`, errors);
  }
  for (const field of ['missing_ingredient_or_tool', 'reported_safety_or_discomfort']) {
    requiredText(feedback[field], `feedback.${field}`, errors);
  }
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
  return [...new Set(errors)];
}

export function isKitchenObservationReady(observation) {
  return validateKitchenObservation(observation).length === 0;
}

export function assertKitchenObservation(observation) {
  const errors = validateKitchenObservation(observation);
  if (errors.length > 0) throw new Error(`invalid kitchen observation:\n${errors.join('\n')}`);
  return observation;
}

export const kitchenObservationRequiredFields = TOP_LEVEL_REQUIRED;

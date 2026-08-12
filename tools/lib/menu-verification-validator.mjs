const CASE_TYPES = new Set(['positive', 'negative', 'cross_menu']);
const CASE_STATUSES = new Set(['pending', 'pass', 'fail', 'needs_review']);
const MODES = new Set(['recommend', 'pantry']);
const INTENTS = new Set(['normal', 'quick', 'fresh', 'batch']);
const PLAN_STATUSES = new Set([
  'ready',
  'complete',
  'needs_user_decision',
  'partial_accepted',
  'no_alternative_plan',
  'no_valid_plan',
  'stale_plan',
]);
const PLAN_STATUSES_REQUIRING_ITEMS = new Set(['ready', 'complete', 'partial_accepted']);
const ENTRY_FIELDS = new Set(['case_id', 'case_type', 'recipe_ids', 'family_ids', 'input', 'expected', 'status', 'actual', 'human_review']);
const INPUT_FIELDS = new Set(['mode', 'intent', 'servings', 'items']);
const EXPECTED_FIELDS = new Set(['plan_status', 'planned_items']);
const ACTUAL_FIELDS = new Set([
  'plan_status', 'planned_items', 'planner_version', 'template_catalog_version',
  'executed_at', 'command', 'output_summary',
]);
const HUMAN_REVIEW_FIELDS = new Set([
  'verdict', 'reviewed_at', 'reviewer', 'notes', 'household_reasonableness',
]);

function hasStrings(value) {
  return Array.isArray(value)
    && value.every(item => typeof item === 'string' && item.trim());
}

function hasNonEmptyStrings(value) {
  return hasStrings(value) && value.length > 0;
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoTimestamp(value) {
  return hasText(value)
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && !Number.isNaN(Date.parse(value));
}

function validateAllowedFields(value, label, allowed, errors) {
  for (const field of Object.keys(value)) {
    if (!allowed.has(field)) errors.push(`${label} ${field} is not allowed`);
  }
}

function validatePlan(value, label, errors, allowedFields) {
  if (!isPlainObject(value)) {
    errors.push(`${label} must be an object`);
    return;
  }
  validateAllowedFields(value, label, allowedFields, errors);
  if (!PLAN_STATUSES.has(value.plan_status)) {
    errors.push(`${label} plan_status must be one of ${[...PLAN_STATUSES].join(', ')}`);
  }
  if (!hasStrings(value.planned_items)) {
    errors.push(`${label} planned_items must be a string array`);
  } else if (PLAN_STATUSES_REQUIRING_ITEMS.has(value.plan_status) && value.planned_items.length === 0) {
    errors.push(`${label} planned_items must be a non-empty string array for ${value.plan_status}`);
  }
}

export function validateMenuVerificationCases(catalog, recipeIds, familyIds) {
  const errors = [];
  const knownRecipeIds = recipeIds instanceof Set ? recipeIds : new Set();
  const knownFamilyIds = familyIds instanceof Set ? familyIds : new Set();

  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) {
    return ['verification catalog must be an object'];
  }
  if (catalog.schema_version !== 1) errors.push('verification catalog schema_version must be 1');
  if (catalog.catalog_version !== 'menu-verification-v1-20260725') {
    errors.push('verification catalog_version must be menu-verification-v1-20260725');
  }
  if (!Array.isArray(catalog.entries)) return [...errors, 'verification catalog entries must be an array'];

  const caseIds = new Set();
  for (const [index, entry] of catalog.entries.entries()) {
    const label = `verification entry ${index}`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      errors.push(`${label} must be an object`);
      continue;
    }
    validateAllowedFields(entry, label, ENTRY_FIELDS, errors);
    if (typeof entry.case_id !== 'string' || !entry.case_id.trim()) {
      errors.push(`${label} case_id must be a non-empty string`);
    } else if (caseIds.has(entry.case_id)) {
      errors.push(`duplicate verification case_id ${entry.case_id}`);
    } else {
      caseIds.add(entry.case_id);
    }
    if (!CASE_TYPES.has(entry.case_type)) errors.push(`${label} has invalid case_type`);
    if (!CASE_STATUSES.has(entry.status)) errors.push(`${label} has invalid status`);

    if (!Array.isArray(entry.recipe_ids)) {
      errors.push(`${label} recipe_ids must be an array`);
    } else {
      for (const recipeId of entry.recipe_ids) {
        if (!knownRecipeIds.has(recipeId)) errors.push(`unknown recipe_id ${recipeId}`);
      }
    }
    if (!Array.isArray(entry.family_ids)) {
      errors.push(`${label} family_ids must be an array`);
    } else {
      for (const familyId of entry.family_ids) {
        if (!knownFamilyIds.has(familyId)) errors.push(`unknown family_id ${familyId}`);
      }
    }
    if ((!Array.isArray(entry.recipe_ids) || entry.recipe_ids.length === 0)
      && (!Array.isArray(entry.family_ids) || entry.family_ids.length === 0)) {
      errors.push(`${label} must reference at least one recipe_id or family_id`);
    }

    const input = entry.input;
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      errors.push(`${label} input must be an object`);
    } else {
      validateAllowedFields(input, `${label} input`, INPUT_FIELDS, errors);
      if (!MODES.has(input.mode)) errors.push(`${label} input mode must be recommend or pantry`);
      if (!INTENTS.has(input.intent)) errors.push(`${label} input intent must be normal, quick, fresh, or batch`);
      if (!Number.isInteger(input.servings) || input.servings < 1 || input.servings > 8) {
        errors.push(`${label} input servings must be an integer from 1 to 8`);
      }
      if (!hasNonEmptyStrings(input.items)) errors.push(`${label} input items must be a non-empty string array`);
    }

    const expected = entry.expected;
    if (!expected || typeof expected !== 'object' || Array.isArray(expected)) {
      errors.push(`${label} expected must be an object`);
    } else {
      validatePlan(expected, `${label} expected`, errors, EXPECTED_FIELDS);
    }

    if (CASE_STATUSES.has(entry.status) && entry.status !== 'pending') {
      validatePlan(entry.actual, `${label} ${entry.status} actual`, errors, ACTUAL_FIELDS);
      if (isPlainObject(entry.actual)) {
        for (const field of ['planner_version', 'template_catalog_version', 'command', 'output_summary']) {
          if (!hasText(entry.actual[field])) errors.push(`${label} ${entry.status} actual ${field} must be a non-empty string`);
        }
        if (!isIsoTimestamp(entry.actual.executed_at)) {
          errors.push(`${label} ${entry.status} actual executed_at must be an ISO timestamp`);
        }
      }

      const review = entry.human_review;
      if (!isPlainObject(review)) {
        errors.push(`${label} ${entry.status} human_review must be an object`);
      } else {
        validateAllowedFields(review, `${label} human_review`, HUMAN_REVIEW_FIELDS, errors);
        if (review.verdict !== entry.status) errors.push(`${label} human_review verdict must match status ${entry.status}`);
        if (!isIsoTimestamp(review.reviewed_at)) errors.push(`${label} human_review reviewed_at must be an ISO timestamp`);
        for (const field of ['reviewer', 'notes', 'household_reasonableness']) {
          if (!hasText(review[field])) errors.push(`${label} human_review ${field} must be a non-empty string`);
        }
      }
    }
    if (entry.status === 'pending' && entry.actual !== undefined) {
      validatePlan(entry.actual, `${label} pending actual`, errors, ACTUAL_FIELDS);
      if (isPlainObject(entry.actual)) {
        for (const field of ['planner_version', 'template_catalog_version', 'command', 'output_summary']) {
          if (!hasText(entry.actual[field])) errors.push(`${label} pending actual ${field} must be a non-empty string`);
        }
        if (!isIsoTimestamp(entry.actual.executed_at)) {
          errors.push(`${label} pending actual executed_at must be an ISO timestamp`);
        }
      }
    }
    if (entry.status === 'pending' && entry.human_review !== undefined) {
      const review = entry.human_review;
      if (!isPlainObject(review)) {
        errors.push(`${label} pending human_review must be an object`);
      } else {
        validateAllowedFields(review, `${label} human_review`, HUMAN_REVIEW_FIELDS, errors);
        if (review.verdict !== 'pending') errors.push(`${label} human_review verdict must match status pending`);
        if (!isIsoTimestamp(review.reviewed_at)) errors.push(`${label} human_review reviewed_at must be an ISO timestamp`);
        for (const field of ['reviewer', 'notes', 'household_reasonableness']) {
          if (!hasText(review[field])) errors.push(`${label} human_review ${field} must be a non-empty string`);
        }
      }
    }
  }
  return errors;
}

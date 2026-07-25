const CASE_TYPES = new Set(['positive', 'negative', 'cross_menu']);
const CASE_STATUSES = new Set(['pending', 'pass', 'fail', 'needs_review']);
const MODES = new Set(['recommend', 'pantry']);
const INTENTS = new Set(['normal', 'quick', 'fresh', 'batch']);

function hasNonEmptyStrings(value) {
  return Array.isArray(value) && value.length > 0
    && value.every(item => typeof item === 'string' && item.trim());
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
      if (typeof expected.plan_status !== 'string' || !expected.plan_status.trim()) {
        errors.push(`${label} expected plan_status must be a non-empty string`);
      }
      if (!hasNonEmptyStrings(expected.planned_items)) {
        errors.push(`${label} expected planned_items must be a non-empty string array`);
      }
    }
  }
  return errors;
}

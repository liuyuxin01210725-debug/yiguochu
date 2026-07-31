const ACTIVATION_STATES = new Set(['planned', 'preview_enabled']);
const IDENTITY_LEVELS = new Set(['canonical']);
const R1_RECIPE_IDS = new Set([
  'shanghai-salted-pork-vegetable-rice',
  'xinjiang-lamb-pilaf',
  'taiwan-cabbage-mushroom-rice',
  'quanzhou-oil-rice',
  'cantonese-cured-meat-claypot-rice',
  'north-china-green-bean-braised-noodles',
]);
const ENTRY_FIELDS = new Set([
  'recipe_id', 'activation_status', 'identity_level', 'identity_evidence', 'identity_signature',
  'approved_variants', 'template_id', 'slot_assignment', 'ratio_rule_ids', 'ratio_default_rule_id',
  'technique_graph', 'seasoning_actions', 'safety_endpoints', 'naming', 'source_claims', 'household_trial',
]);
const IDENTITY_EVIDENCE_FIELDS = new Set(['title', 'url']);
const IDENTITY_SIGNATURE_FIELDS = new Set([
  'required_canonical_ids', 'required_states_or_cuts', 'forbidden_canonical_ids',
]);
const STATE_OR_CUT_FIELDS = new Set(['canonical_id', 'value']);
const NAMING_FIELDS = new Set(['canonical_name']);
const VARIANT_FIELDS = new Set(['variant_id', 'substitutions', 'identity_impact', 'naming']);
const VARIANT_NAMING_FIELDS = new Set(['display_name']);
const SUBSTITUTION_FIELDS = new Set(['slot_id', 'replaces_canonical_ids', 'allowed_canonical_ids']);
const HOUSEHOLD_TRIAL_FIELDS = new Set(['status', 'trial_date', 'reviewer', 'outcome']);
const TECHNIQUE_FIELDS = new Set(['phase', 'action_code', 'slot_ids']);
const SEASONING_FIELDS = new Set(['action_code', 'amount_source']);
const SAFETY_ENDPOINT_FIELDS = new Set(['endpoint_code', 'canonical_ids']);
const SOURCE_CLAIM_FIELDS = new Set(['claim_type', 'evidence_index']);
const SEASONING_ACTION_CODES = new Set(['add_measured_seasoning']);
const SOURCE_CLAIM_TYPES = new Set(['identity', 'technique', 'ratio', 'seasoning', 'safety']);
const REQUIRED_PREVIEW_CLAIM_TYPES = new Set(['identity', 'technique', 'ratio', 'seasoning', 'safety']);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function pushUnknownKeys(errors, value, allowed, label) {
  if (!isPlainObject(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`${label} unknown key ${key}`);
  }
}

function stringArray(value, label, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array`);
    return [];
  }
  for (const [index, item] of value.entries()) {
    if (!isNonEmptyString(item)) errors.push(`${label}[${index}] must be a non-empty string`);
  }
  return value.filter(isNonEmptyString);
}

function urlIsIndependentHttps(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return parsed.protocol === 'https:'
      && hostname !== 'yiguochu.pages.dev'
      && !hostname.endsWith('.yiguochu.pages.dev');
  } catch {
    return false;
  }
}

function knownIds(items, field) {
  return new Set((Array.isArray(items) ? items : [])
    .filter(isPlainObject)
    .map(item => item[field])
    .filter(isNonEmptyString));
}

function templateById(templates, templateId) {
  return (Array.isArray(templates?.templates) ? templates.templates : [])
    .find(template => template?.template_id === templateId) || null;
}

function canonicalById(taxonomy) {
  return new Map((Array.isArray(taxonomy?.items) ? taxonomy.items : [])
    .filter(item => isNonEmptyString(item?.canonical_id))
    .map(item => [item.canonical_id, item]));
}

function normalizedName(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s（）()_-]+/g, '');
}

function recipeCoreCanonicalIds(recipe, canonicalItems) {
  const coreNames = new Set((Array.isArray(recipe?.core_ingredients) ? recipe.core_ingredients : [])
    .map(normalizedName)
    .filter(Boolean));
  return new Set([...canonicalItems.values()]
    .filter(item => [item.display_name, ...(Array.isArray(item.aliases) ? item.aliases : [])]
      .map(normalizedName).some(name => coreNames.has(name)))
    .map(item => item.canonical_id));
}

function setsMatch(left, right) {
  return left.size === right.size && [...left].every(value => right.has(value));
}

function variantItemFitsSlot(item, slot, template) {
  const acceptsCategory = Array.isArray(slot?.accepts_categories) && slot.accepts_categories.includes(item?.category);
  const acceptsSlot = (Array.isArray(slot?.accepts_slot_codes) ? slot.accepts_slot_codes : [])
    .some(code => (Array.isArray(item?.compatible_slot_codes) ? item.compatible_slot_codes : []).includes(code));
  if (!acceptsCategory && !acceptsSlot) return false;
  const shapeRule = (Array.isArray(template?.shape_or_cut_requirements) ? template.shape_or_cut_requirements : [])
    .find(rule => rule.slot_id === slot.slot_id && rule.category === item.category);
  if (!shapeRule) return true;
  const shapes = new Set(Array.isArray(item.shapes_or_cuts) ? item.shapes_or_cuts : []);
  if ([...(shapeRule.forbidden_shapes || [])].some(shape => shapes.has(shape))) return false;
  return !(shapeRule.allowed_shapes || []).length
    || (shapeRule.allowed_shapes || []).some(shape => shapes.has(shape));
}

function collectCanonicalReferences(value, output = new Set()) {
  if (Array.isArray(value)) {
    value.forEach(item => collectCanonicalReferences(item, output));
    return output;
  }
  if (!isPlainObject(value)) return output;
  if (isNonEmptyString(value.canonical_id)) output.add(value.canonical_id);
  if (Array.isArray(value.canonical_ids)) value.canonical_ids.filter(isNonEmptyString).forEach(id => output.add(id));
  Object.values(value).forEach(item => collectCanonicalReferences(item, output));
  return output;
}

function validateVariant(variant, label, {
  canonicalIds, canonicalItems, requiredIdentityIds, forbiddenIdentityIds,
  template, assignedBySlot, canonicalName, requiredStatesOrCuts,
  safetyEndpoints, ratioDefaultRule,
}, errors) {
  if (!isPlainObject(variant)) {
    errors.push(`${label} must be an object; free-text substitutions are not allowed`);
    return;
  }
  pushUnknownKeys(errors, variant, VARIANT_FIELDS, label);
  if (!isNonEmptyString(variant.variant_id)) errors.push(`${label}.variant_id must be a non-empty string`);
  if (!['preserves_identity', 'named_variant', 'style_adaptation', 'breaks_identity'].includes(variant.identity_impact)) {
    errors.push(`${label}.identity_impact is invalid`);
  }
  if (!isPlainObject(variant.naming)) {
    errors.push(`${label}.naming must contain a pre-reviewed display_name`);
  } else {
    pushUnknownKeys(errors, variant.naming, VARIANT_NAMING_FIELDS, `${label}.naming`);
    if (!isNonEmptyString(variant.naming.display_name)) errors.push(`${label}.naming.display_name must be a non-empty string`);
    if (variant.identity_impact === 'style_adaptation' && variant.naming.display_name === canonicalName) {
      errors.push(`${label}.naming.display_name must distinguish a style adaptation from the canonical name`);
    }
  }
  if (!Array.isArray(variant.substitutions)) {
    errors.push(`${label}.substitutions must be an array`);
    return;
  }
  if (variant.substitutions.length === 0) errors.push(`${label}.substitutions must not be empty`);
  const slotById = new Map([
    ...(Array.isArray(template?.required_slots) ? template.required_slots : []),
    ...(Array.isArray(template?.optional_slots) ? template.optional_slots : []),
  ].map(slot => [slot.slot_id, slot]));
  const seenReplaced = new Set();
  const ratioIdentityIds = collectCanonicalReferences(ratioDefaultRule);
  const safetyByCanonicalId = new Map();
  for (const endpoint of Array.isArray(safetyEndpoints) ? safetyEndpoints : []) {
    for (const canonicalId of endpoint.canonical_ids || []) {
      if (!safetyByCanonicalId.has(canonicalId)) safetyByCanonicalId.set(canonicalId, new Set());
      safetyByCanonicalId.get(canonicalId).add(endpoint.endpoint_code);
    }
  }
  const stateOrCutByCanonicalId = new Map((Array.isArray(requiredStatesOrCuts) ? requiredStatesOrCuts : [])
    .map(requirement => [requirement.canonical_id, requirement.value]));
  for (const [index, substitution] of variant.substitutions.entries()) {
    const substitutionLabel = `${label}.substitutions[${index}]`;
    if (!isPlainObject(substitution)) {
      errors.push(`${substitutionLabel} must be an object; free-text substitutions are not allowed`);
      continue;
    }
    pushUnknownKeys(errors, substitution, SUBSTITUTION_FIELDS, substitutionLabel);
    if (!isNonEmptyString(substitution.slot_id)) errors.push(`${substitutionLabel}.slot_id must be a non-empty string`);
    const slot = slotById.get(substitution.slot_id);
    if (!slot) errors.push(`${substitutionLabel}.slot_id must reference a template slot`);
    const replacesCanonicalIds = stringArray(substitution.replaces_canonical_ids, `${substitutionLabel}.replaces_canonical_ids`, errors);
    const allowedCanonicalIds = stringArray(substitution.allowed_canonical_ids, `${substitutionLabel}.allowed_canonical_ids`, errors);
    if (replacesCanonicalIds.length === 0) errors.push(`${substitutionLabel}.replaces_canonical_ids must not be empty`);
    if (allowedCanonicalIds.length === 0) errors.push(`${substitutionLabel}.allowed_canonical_ids must not be empty`);
    for (const canonicalId of replacesCanonicalIds) {
      if (!canonicalIds.has(canonicalId)) errors.push(`${substitutionLabel} unknown canonical_id ${canonicalId}`);
      if (!requiredIdentityIds.has(canonicalId)) errors.push(`${substitutionLabel} canonical_id ${canonicalId} must be a required recipe identity`);
      if (!(assignedBySlot.get(substitution.slot_id) || []).includes(canonicalId)) {
        errors.push(`${substitutionLabel} canonical_id ${canonicalId} is not assigned to slot ${substitution.slot_id}`);
      }
      if (seenReplaced.has(canonicalId)) errors.push(`${substitutionLabel} canonical_id ${canonicalId} is replaced more than once`);
      seenReplaced.add(canonicalId);
      if (ratioIdentityIds.has(canonicalId)) {
        errors.push(`${substitutionLabel} canonical_id ${canonicalId} is bound by the recipe ratio default`);
      }
    }
    for (const canonicalId of allowedCanonicalIds) {
      if (!canonicalIds.has(canonicalId)) errors.push(`${substitutionLabel} unknown canonical_id ${canonicalId}`);
      const item = canonicalItems.get(canonicalId);
      if (item && slot && !variantItemFitsSlot(item, slot, template)) {
        errors.push(`${substitutionLabel} canonical_id ${canonicalId} is incompatible with template slot ${substitution.slot_id}`);
      }
      if (forbiddenIdentityIds.has(canonicalId)) errors.push(`${substitutionLabel} canonical_id ${canonicalId} is forbidden by identity_signature`);
      const requiredValue = (substitution.replaces_canonical_ids || [])
        .map(replacedId => stateOrCutByCanonicalId.get(replacedId)).find(Boolean);
      const controlledValues = new Set([...(item?.states || []), ...(item?.shapes_or_cuts || [])]);
      if (requiredValue && !controlledValues.has(requiredValue)) {
        errors.push(`${substitutionLabel} canonical_id ${canonicalId} does not preserve required state or cut ${requiredValue}`);
      }
      for (const endpointCode of item?.cooking_risk?.required_endpoint_codes || []) {
        if (!safetyByCanonicalId.get(canonicalId)?.has(endpointCode)) {
          errors.push(`${substitutionLabel} canonical_id ${canonicalId} lacks required safety endpoint ${endpointCode}`);
        }
      }
    }
  }
}

function validateHouseholdTrial(trial, label, errors) {
  if (!isPlainObject(trial)) {
    errors.push(`${label} must be a structured household_trial`);
    return;
  }
  pushUnknownKeys(errors, trial, HOUSEHOLD_TRIAL_FIELDS, label);
  if (trial.status !== 'completed') errors.push(`${label}.status must be completed`);
  if (!isNonEmptyString(trial.trial_date) || !ISO_DATE_RE.test(trial.trial_date)) {
    errors.push(`${label}.trial_date must use YYYY-MM-DD`);
  } else {
    const [year, month, day] = trial.trial_date.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      errors.push(`${label}.trial_date must be a real calendar date`);
    }
  }
  if (!isNonEmptyString(trial.reviewer)) errors.push(`${label}.reviewer must be a non-empty string`);
  if (trial.outcome !== 'passed') errors.push(`${label}.outcome must be passed`);
}

function validateSlotAssignment(assignment, label, template, canonicalItems, requiredIdentityIds, previewEnabled, errors) {
  const assignedBySlot = new Map();
  const assignedCounts = new Map();
  if (!isPlainObject(assignment)) {
    errors.push(`${label} must be an object`);
    return { assignedBySlot, assignedCounts };
  }
  const slots = [...(Array.isArray(template?.required_slots) ? template.required_slots : []),
    ...(Array.isArray(template?.optional_slots) ? template.optional_slots : [])];
  const slotById = new Map(slots.map(slot => [slot.slot_id, slot]));
  const assigned = Object.keys(assignment);
  if (previewEnabled && assigned.length === 0) errors.push(`${label} must not be empty for preview_enabled`);
  let totalAssigned = 0;
  for (const slotId of assigned) {
    const slot = slotById.get(slotId);
    if (!slot) {
      errors.push(`${label} unknown slot ${slotId}`);
      continue;
    }
    const canonicalIds = stringArray(assignment[slotId], `${label}.${slotId}`, errors);
    assignedBySlot.set(slotId, canonicalIds);
    totalAssigned += canonicalIds.length;
    if (previewEnabled && canonicalIds.length < (slot.min_items || 0)) {
      errors.push(`${label}.${slotId} is below min_items`);
    }
    if (Number.isInteger(slot.max_items) && canonicalIds.length > slot.max_items) {
      errors.push(`${label}.${slotId} exceeds max_items`);
    }
    if (previewEnabled && canonicalIds.length === 0) errors.push(`${label}.${slotId} must not be empty for preview_enabled`);
    for (const canonicalId of canonicalIds) {
      assignedCounts.set(canonicalId, (assignedCounts.get(canonicalId) || 0) + 1);
      const item = canonicalItems.get(canonicalId);
      if (!item) {
        errors.push(`${label}.${slotId} unknown canonical_id ${canonicalId}`);
        continue;
      }
      const acceptsCategory = Array.isArray(slot.accepts_categories) && slot.accepts_categories.includes(item.category);
      const acceptsSlot = (Array.isArray(slot.accepts_slot_codes) ? slot.accepts_slot_codes : [])
        .some(code => (Array.isArray(item.compatible_slot_codes) ? item.compatible_slot_codes : []).includes(code));
      if (!acceptsCategory && !acceptsSlot) errors.push(`${label}.${slotId} canonical_id ${canonicalId} is incompatible with template slot`);
      const basicExtraOnly = Array.isArray(slot.source_policy)
        && slot.source_policy.includes('basic_extra')
        && !slot.source_policy.includes('user');
      if (previewEnabled && !basicExtraOnly && !requiredIdentityIds.has(canonicalId)) {
        errors.push(`${label}.${slotId} canonical_id ${canonicalId} is not a required recipe identity`);
      }
    }
  }
  if (previewEnabled) {
    for (const slot of Array.isArray(template?.required_slots) ? template.required_slots : []) {
      const canonicalIds = assignedBySlot.get(slot.slot_id);
      if (!canonicalIds) errors.push(`${label} required slot ${slot.slot_id} must be assigned`);
      else if (canonicalIds.length < slot.min_items || canonicalIds.length > slot.max_items) {
        errors.push(`${label}.${slot.slot_id} violates required slot cardinality`);
      }
    }
    const limits = template?.slot_limits || {};
    if (Number.isInteger(limits.total_user_items_min) && totalAssigned < limits.total_user_items_min) {
      errors.push(`${label} is below total_user_items_min`);
    }
    if (Number.isInteger(limits.total_user_items_max) && totalAssigned > limits.total_user_items_max) {
      errors.push(`${label} exceeds total_user_items_max`);
    }
    for (const [slotId, canonicalIds] of assignedBySlot) {
      const limit = limits[`${slotId}_max`];
      if (Number.isInteger(limit) && canonicalIds.length > limit) errors.push(`${label}.${slotId} exceeds slot_limits maximum`);
    }
    for (const canonicalId of requiredIdentityIds) {
      if (assignedCounts.get(canonicalId) !== 1) errors.push(`${label} required canonical_id ${canonicalId} must be assigned exactly once`);
    }
  }
  return { assignedBySlot, assignedCounts };
}

function validateStateOrCuts(values, label, requiredIdentityIds, canonicalItems, errors) {
  if (!Array.isArray(values)) {
    errors.push(`${label} must be an array`);
    return;
  }
  for (const [index, stateOrCut] of values.entries()) {
    const stateLabel = `${label}[${index}]`;
    if (!isPlainObject(stateOrCut)) {
      errors.push(`${stateLabel} must be an object`);
      continue;
    }
    pushUnknownKeys(errors, stateOrCut, STATE_OR_CUT_FIELDS, stateLabel);
    const item = canonicalItems.get(stateOrCut.canonical_id);
    if (!item) {
      errors.push(`${stateLabel} unknown canonical_id ${stateOrCut.canonical_id}`);
      continue;
    }
    if (!requiredIdentityIds.has(stateOrCut.canonical_id)) errors.push(`${stateLabel}.canonical_id must be required by identity_signature`);
    const controlledValues = new Set([...(Array.isArray(item.states) ? item.states : []),
      ...(Array.isArray(item.shapes_or_cuts) ? item.shapes_or_cuts : [])]);
    if (!isNonEmptyString(stateOrCut.value) || !controlledValues.has(stateOrCut.value)) {
      errors.push(`${stateLabel}.value is not a controlled taxonomy state or cut`);
    }
  }
}

function templateStepApplies(step, assignedBySlot, canonicalItems) {
  const relevantSlots = (step.slot_ids || []).filter(slotId => assignedBySlot.has(slotId));
  if (relevantSlots.length === 0) return false;
  if (!isPlainObject(step.when)) return true;
  const whenItems = assignedBySlot.get(step.when.slot_id) || [];
  return whenItems.some(canonicalId => canonicalItems.get(canonicalId)?.category === step.when.category);
}

function stepKey(step) {
  return `${step.phase}\u0000${step.action_code}\u0000${[...(step.slot_ids || [])].sort().join('\u0001')}`;
}

function relevantStep(step, assignedBySlot) {
  return { ...step, slot_ids: (step.slot_ids || []).filter(slotId => assignedBySlot.has(slotId)) };
}

function validateTechniqueGraph(graph, label, template, assignedBySlot, canonicalItems, previewEnabled, errors) {
  if (!Array.isArray(graph)) {
    errors.push(`${label} must be an array`);
    return;
  }
  if (previewEnabled && graph.length === 0) errors.push(`${label} must not be empty for preview_enabled`);
  const templateSteps = Array.isArray(template?.cooking_order) ? template.cooking_order : [];
  for (const [index, step] of graph.entries()) {
    const stepLabel = `${label}[${index}]`;
    if (!isPlainObject(step)) {
      errors.push(`${stepLabel} must be an object`);
      continue;
    }
    pushUnknownKeys(errors, step, TECHNIQUE_FIELDS, stepLabel);
    if (!Number.isInteger(step.phase)) errors.push(`${stepLabel}.phase must be an integer`);
    if (!isNonEmptyString(step.action_code)) errors.push(`${stepLabel}.action_code must be a non-empty string`);
    const slotIds = stringArray(step.slot_ids, `${stepLabel}.slot_ids`, errors);
    if (slotIds.some(slotId => !assignedBySlot.has(slotId))) errors.push(`${stepLabel}.slot_ids must reference assigned slots`);
    const matchingStep = templateSteps.find(templateStep => templateStep.phase === step.phase
      && templateStep.action_code === step.action_code
      && slotIds.length > 0
      && slotIds.every(slotId => (templateStep.slot_ids || []).includes(slotId)));
    if (!matchingStep) errors.push(`${stepLabel} does not belong to template cooking_order`);
    else if (!templateStepApplies(matchingStep, assignedBySlot, canonicalItems)) errors.push(`${stepLabel} is not relevant to assigned ingredients`);
  }
  if (previewEnabled) {
    const supplied = new Set(graph.filter(isPlainObject).map(stepKey));
    for (const templateStep of templateSteps.filter(step => templateStepApplies(step, assignedBySlot, canonicalItems))) {
      const expected = relevantStep(templateStep, assignedBySlot);
      if (!supplied.has(stepKey(expected))) errors.push(`${label} missing required template step ${templateStep.phase}/${templateStep.action_code}`);
    }
  }
}

function validateSeasoningActions(actions, label, previewEnabled, errors) {
  if (!Array.isArray(actions)) {
    errors.push(`${label} must be an array`);
    return;
  }
  if (previewEnabled && actions.length === 0) errors.push(`${label} must not be empty for preview_enabled`);
  for (const [index, action] of actions.entries()) {
    const actionLabel = `${label}[${index}]`;
    if (!isPlainObject(action)) {
      errors.push(`${actionLabel} must be an object`);
      continue;
    }
    pushUnknownKeys(errors, action, SEASONING_FIELDS, actionLabel);
    if (!SEASONING_ACTION_CODES.has(action.action_code)) errors.push(`${actionLabel}.action_code is invalid`);
    if (action.amount_source !== 'ratio_default') errors.push(`${actionLabel}.amount_source must be ratio_default`);
  }
}

function validateSafetyEndpoints(endpoints, label, template, canonicalItems, assignedCounts, previewEnabled, errors) {
  if (!Array.isArray(endpoints)) {
    errors.push(`${label} must be an array`);
    return;
  }
  if (previewEnabled && endpoints.length === 0) errors.push(`${label} preview_enabled requires at least one safety endpoint`);
  const templateEndpoints = new Map((Array.isArray(template?.safety_endpoints) ? template.safety_endpoints : [])
    .map(endpoint => [endpoint.endpoint_code, endpoint.applies_to_category]));
  for (const [index, endpoint] of endpoints.entries()) {
    const endpointLabel = `${label}[${index}]`;
    if (!isPlainObject(endpoint)) {
      errors.push(`${endpointLabel} must be an object`);
      continue;
    }
    pushUnknownKeys(errors, endpoint, SAFETY_ENDPOINT_FIELDS, endpointLabel);
    if (!isNonEmptyString(endpoint.endpoint_code)) {
      errors.push(`${endpointLabel}.endpoint_code must be a non-empty string`);
      continue;
    }
    const category = templateEndpoints.get(endpoint.endpoint_code);
    if (!category) {
      errors.push(`${endpointLabel} safety endpoint ${endpoint.endpoint_code} does not belong to template`);
      continue;
    }
    const canonicalIds = stringArray(endpoint.canonical_ids, `${endpointLabel}.canonical_ids`, errors);
    if (previewEnabled && canonicalIds.length === 0) errors.push(`${endpointLabel}.canonical_ids must not be empty for preview_enabled`);
    for (const canonicalId of canonicalIds) {
      const item = canonicalItems.get(canonicalId);
      if (!item) errors.push(`${endpointLabel} unknown canonical_id ${canonicalId}`);
      else if (item.category !== category) errors.push(`${endpointLabel} canonical_id ${canonicalId} is incompatible with safety endpoint`);
      else if (previewEnabled && assignedCounts.get(canonicalId) !== 1) {
        errors.push(`${endpointLabel} safety endpoint ${endpoint.endpoint_code} canonical_id ${canonicalId} is not assigned`);
      }
    }
  }
  if (previewEnabled) {
    for (const [canonicalId, count] of assignedCounts) {
      if (count !== 1) continue;
      const item = canonicalItems.get(canonicalId);
      for (const [endpointCode, category] of templateEndpoints) {
        if (item?.category !== category) continue;
        const supplied = endpoints.some(endpoint => endpoint?.endpoint_code === endpointCode
          && Array.isArray(endpoint.canonical_ids) && endpoint.canonical_ids.includes(canonicalId));
        if (!supplied) errors.push(`${label} missing required safety endpoint ${endpointCode} for canonical_id ${canonicalId}`);
      }
    }
  }
}

function validateSourceClaims(claims, label, evidence, previewEnabled, errors) {
  if (!Array.isArray(claims)) {
    errors.push(`${label} must be an array`);
    return;
  }
  if (previewEnabled && claims.length === 0) errors.push(`${label} must not be empty for preview_enabled`);
  const presentClaimTypes = new Set();
  for (const [index, claim] of claims.entries()) {
    const claimLabel = `${label}[${index}]`;
    if (!isPlainObject(claim)) {
      errors.push(`${claimLabel} must be an object`);
      continue;
    }
    pushUnknownKeys(errors, claim, SOURCE_CLAIM_FIELDS, claimLabel);
    if (!SOURCE_CLAIM_TYPES.has(claim.claim_type)) errors.push(`${claimLabel}.claim_type is invalid`);
    else presentClaimTypes.add(claim.claim_type);
    if (!Number.isInteger(claim.evidence_index) || claim.evidence_index < 0 || claim.evidence_index >= evidence.length) {
      errors.push(`${claimLabel}.evidence_index must reference identity_evidence`);
    }
  }
  if (previewEnabled) {
    for (const claimType of REQUIRED_PREVIEW_CLAIM_TYPES) {
      if (!presentClaimTypes.has(claimType)) errors.push(`${label} missing required claim_type ${claimType}`);
    }
  }
}

export function validateRecipeRuntimeCatalog(catalog, { recipes, taxonomy, templates, ratios } = {}) {
  const errors = [];
  if (!isPlainObject(catalog)) return ['recipe runtime catalog must be an object'];
  pushUnknownKeys(errors, catalog, new Set(['recipe_runtime_catalog_version', 'entries']), 'catalog');
  if (catalog.recipe_runtime_catalog_version !== 'recipe-runtime-v1-20260730-r1') {
    errors.push('catalog recipe_runtime_catalog_version is invalid');
  }
  if (!Array.isArray(catalog.entries)) {
    errors.push('catalog entries must be an array');
    return errors;
  }

  const recipeIds = knownIds(recipes?.recipes, 'id');
  const canonicalIds = knownIds(taxonomy?.items, 'canonical_id');
  const templateIds = knownIds(templates?.templates, 'template_id');
  const ratioRuleIds = knownIds(ratios?.rules, 'rule_id');
  const canonicalItems = canonicalById(taxonomy);
  const recipesById = new Map((Array.isArray(recipes?.recipes) ? recipes.recipes : [])
    .filter(recipe => isNonEmptyString(recipe?.id))
    .map(recipe => [recipe.id, recipe]));
  const ratioById = new Map((Array.isArray(ratios?.rules) ? ratios.rules : [])
    .filter(rule => isNonEmptyString(rule?.rule_id))
    .map(rule => [rule.rule_id, rule]));
  const seenRecipeIds = new Set();

  for (const [index, entry] of catalog.entries.entries()) {
    const label = `entries[${index}]`;
    if (!isPlainObject(entry)) {
      errors.push(`${label} must be an object`);
      continue;
    }
    pushUnknownKeys(errors, entry, ENTRY_FIELDS, label);
    if (!isNonEmptyString(entry.recipe_id)) {
      errors.push(`${label}.recipe_id must be a non-empty string`);
    } else {
      if (seenRecipeIds.has(entry.recipe_id)) errors.push(`${label} duplicate recipe_id ${entry.recipe_id}`);
      seenRecipeIds.add(entry.recipe_id);
      if (!recipeIds.has(entry.recipe_id)) errors.push(`${label} unknown recipe_id ${entry.recipe_id}`);
    }
    if (!ACTIVATION_STATES.has(entry.activation_status)) errors.push(`${label}.activation_status is invalid`);
    if (!IDENTITY_LEVELS.has(entry.identity_level)) errors.push(`${label}.identity_level is invalid`);

    if (!Array.isArray(entry.identity_evidence)) {
      errors.push(`${label}.identity_evidence must be an array`);
    } else {
      if (entry.identity_level === 'canonical' && entry.identity_evidence.length === 0) {
        errors.push(`${label} canonical identity requires independent HTTPS identity evidence`);
      }
      for (const [evidenceIndex, evidence] of entry.identity_evidence.entries()) {
        const evidenceLabel = `${label}.identity_evidence[${evidenceIndex}]`;
        if (!isPlainObject(evidence)) {
          errors.push(`${evidenceLabel} must be an object`);
          continue;
        }
        pushUnknownKeys(errors, evidence, IDENTITY_EVIDENCE_FIELDS, evidenceLabel);
        if (!isNonEmptyString(evidence.title)) errors.push(`${evidenceLabel}.title must be a non-empty string`);
        if (!urlIsIndependentHttps(evidence.url)) errors.push(`${evidenceLabel} must be independent HTTPS identity evidence`);
      }
    }

    let requiredIdentityIds = new Set();
    if (!isPlainObject(entry.identity_signature)) {
      errors.push(`${label}.identity_signature must be an object`);
    } else {
      pushUnknownKeys(errors, entry.identity_signature, IDENTITY_SIGNATURE_FIELDS, `${label}.identity_signature`);
      for (const field of ['required_canonical_ids', 'forbidden_canonical_ids']) {
        const values = stringArray(entry.identity_signature[field], `${label}.identity_signature.${field}`, errors);
        for (const canonicalId of values) {
          if (!canonicalIds.has(canonicalId)) errors.push(`${label} unknown canonical_id ${canonicalId}`);
        }
      }
      requiredIdentityIds = new Set(stringArray(
        entry.identity_signature.required_canonical_ids,
        `${label}.identity_signature.required_canonical_ids`,
        errors,
      ));
      validateStateOrCuts(entry.identity_signature.required_states_or_cuts,
        `${label}.identity_signature.required_states_or_cuts`, requiredIdentityIds, canonicalItems, errors);
      if (entry.activation_status === 'preview_enabled'
        && requiredIdentityIds.size === 0) {
        errors.push(`${label}.identity_signature.required_canonical_ids must not be empty for preview_enabled`);
      }
      if (entry.activation_status === 'preview_enabled') {
        const recipe = recipesById.get(entry.recipe_id);
        const recipeCoreIds = recipeCoreCanonicalIds(recipe, canonicalItems);
        const recipeCoreCount = Array.isArray(recipe?.core_ingredients) ? recipe.core_ingredients.length : 0;
        if (recipeCoreIds.size !== recipeCoreCount) errors.push(`${label} recipe core identities do not resolve reliably`);
        for (const canonicalId of requiredIdentityIds) {
          if (!recipeCoreIds.has(canonicalId)) errors.push(`${label} canonical_id ${canonicalId} is not a recipe core identity`);
        }
      }
    }

    if (!isNonEmptyString(entry.template_id) || !templateIds.has(entry.template_id)) {
      errors.push(`${label} unknown template_id ${entry.template_id}`);
    }
    const template = templateById(templates, entry.template_id);
    const assignment = validateSlotAssignment(entry.slot_assignment, `${label}.slot_assignment`, template,
      canonicalItems, requiredIdentityIds, entry.activation_status === 'preview_enabled', errors);
    if (!Array.isArray(entry.approved_variants)) {
      errors.push(`${label}.approved_variants must be an array`);
    } else {
      if (entry.activation_status === 'preview_enabled' && entry.approved_variants.length > 0) {
        errors.push(`${label}.approved_variants preview variants require executable substitution quantity transfer`);
      }
      const seenVariantIds = new Set();
      const forbiddenIdentityIds = new Set(Array.isArray(entry.identity_signature?.forbidden_canonical_ids)
        ? entry.identity_signature.forbidden_canonical_ids : []);
      entry.approved_variants.forEach((variant, variantIndex) => {
        if (isNonEmptyString(variant?.variant_id)) {
          if (seenVariantIds.has(variant.variant_id)) errors.push(`${label}.approved_variants duplicate variant_id ${variant.variant_id}`);
          seenVariantIds.add(variant.variant_id);
        }
        validateVariant(variant, `${label}.approved_variants[${variantIndex}]`, {
          canonicalIds,
          canonicalItems,
          requiredIdentityIds,
          forbiddenIdentityIds,
          template,
          assignedBySlot: assignment.assignedBySlot,
          canonicalName: entry.naming?.canonical_name,
          requiredStatesOrCuts: entry.identity_signature?.required_states_or_cuts,
          safetyEndpoints: entry.safety_endpoints,
          ratioDefaultRule: ratioById.get(entry.ratio_default_rule_id),
        }, errors);
      });
    }
    const ratioIds = stringArray(entry.ratio_rule_ids, `${label}.ratio_rule_ids`, errors);
    for (const ratioRuleId of ratioIds) {
      if (!ratioRuleIds.has(ratioRuleId)) errors.push(`${label} unknown ratio_rule_id ${ratioRuleId}`);
      else {
        const ratioRule = ratioById.get(ratioRuleId);
        if (ratioRule?.when?.recipe_id !== entry.recipe_id) {
          errors.push(`${label} ratio_rule_id ${ratioRuleId} must be recipe-scoped to ${entry.recipe_id}`);
        }
      }
    }
    validateTechniqueGraph(entry.technique_graph, `${label}.technique_graph`, template,
      assignment.assignedBySlot, canonicalItems, entry.activation_status === 'preview_enabled', errors);
    validateSeasoningActions(entry.seasoning_actions, `${label}.seasoning_actions`, entry.activation_status === 'preview_enabled', errors);
    validateSafetyEndpoints(entry.safety_endpoints, `${label}.safety_endpoints`, template, canonicalItems,
      assignment.assignedCounts, entry.activation_status === 'preview_enabled', errors);
    validateSourceClaims(entry.source_claims, `${label}.source_claims`, entry.identity_evidence || [], entry.activation_status === 'preview_enabled', errors);
    if (!isPlainObject(entry.naming)) {
      errors.push(`${label}.naming must be an object`);
    } else {
      pushUnknownKeys(errors, entry.naming, NAMING_FIELDS, `${label}.naming`);
      if (!isNonEmptyString(entry.naming.canonical_name)) errors.push(`${label}.naming.canonical_name must be a non-empty string`);
    }

    if (entry.activation_status === 'planned') {
      if (entry.household_trial !== null) errors.push(`${label} planned entry household_trial must be null`);
      if (entry.ratio_default_rule_id != null) errors.push(`${label} planned entry must not set ratio_default_rule_id`);
    }
    if (entry.activation_status === 'preview_enabled') {
      const defaults = isNonEmptyString(entry.ratio_default_rule_id) ? [entry.ratio_default_rule_id] : [];
      if (defaults.length !== 1 || !ratioIds.includes(entry.ratio_default_rule_id)) {
        errors.push(`${label} preview_enabled requires exactly one ratio default`);
      }
      if (isNonEmptyString(entry.ratio_default_rule_id)
          && ratioById.get(entry.ratio_default_rule_id)?.execution_mode !== 'executable') {
        errors.push(`${label} ratio default must be executable`);
      }
      validateHouseholdTrial(entry.household_trial, `${label}.household_trial`, errors);
    }
  }
  if (!setsMatch(seenRecipeIds, R1_RECIPE_IDS)) errors.push('r1 recipe IDs must exactly match the specified pilot set');
  return errors;
}

export function assertRecipeRuntimeCatalog(catalog, context) {
  const errors = validateRecipeRuntimeCatalog(catalog, context);
  if (errors.length) throw new Error(`recipe runtime catalog validation failed:\n${errors.join('\n')}`);
}

const PROJECT_RECIPE_ORIGIN = 'https://yiguochu.pages.dev';
const ACTIVATION_STATES = new Set(['planned', 'preview_enabled']);
const IDENTITY_LEVELS = new Set(['canonical']);
const ENTRY_FIELDS = new Set([
  'recipe_id', 'activation_status', 'identity_level', 'identity_evidence', 'identity_signature',
  'approved_variants', 'template_id', 'slot_assignment', 'ratio_rule_ids', 'ratio_default_rule_id',
  'technique_graph', 'seasoning_actions', 'safety_endpoints', 'naming', 'source_claims', 'household_trial',
]);
const IDENTITY_EVIDENCE_FIELDS = new Set(['title', 'url']);
const IDENTITY_SIGNATURE_FIELDS = new Set([
  'required_canonical_ids', 'required_states_or_cuts', 'forbidden_canonical_ids',
]);
const NAMING_FIELDS = new Set(['canonical_name']);
const VARIANT_FIELDS = new Set(['variant_id', 'substitutions', 'identity_impact']);
const SUBSTITUTION_FIELDS = new Set(['slot_id', 'replaces_canonical_ids', 'allowed_canonical_ids']);
const HOUSEHOLD_TRIAL_FIELDS = new Set(['status', 'trial_date', 'reviewer', 'outcome']);

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
    return parsed.protocol === 'https:' && parsed.origin !== PROJECT_RECIPE_ORIGIN;
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

function knownEndpointCodes(templates) {
  const endpoints = new Set();
  for (const template of Array.isArray(templates?.templates) ? templates.templates : []) {
    for (const endpoint of Array.isArray(template?.safety_endpoints) ? template.safety_endpoints : []) {
      if (isNonEmptyString(endpoint?.endpoint_code)) endpoints.add(endpoint.endpoint_code);
    }
  }
  return endpoints;
}

function validateVariant(variant, label, canonicalIds, errors) {
  if (!isPlainObject(variant)) {
    errors.push(`${label} must be an object; free-text substitutions are not allowed`);
    return;
  }
  pushUnknownKeys(errors, variant, VARIANT_FIELDS, label);
  if (!isNonEmptyString(variant.variant_id)) errors.push(`${label}.variant_id must be a non-empty string`);
  if (!['preserves_identity', 'named_variant', 'style_adaptation', 'breaks_identity'].includes(variant.identity_impact)) {
    errors.push(`${label}.identity_impact is invalid`);
  }
  if (!Array.isArray(variant.substitutions)) {
    errors.push(`${label}.substitutions must be an array`);
    return;
  }
  for (const [index, substitution] of variant.substitutions.entries()) {
    const substitutionLabel = `${label}.substitutions[${index}]`;
    if (!isPlainObject(substitution)) {
      errors.push(`${substitutionLabel} must be an object; free-text substitutions are not allowed`);
      continue;
    }
    pushUnknownKeys(errors, substitution, SUBSTITUTION_FIELDS, substitutionLabel);
    if (!isNonEmptyString(substitution.slot_id)) errors.push(`${substitutionLabel}.slot_id must be a non-empty string`);
    for (const canonicalId of stringArray(substitution.replaces_canonical_ids, `${substitutionLabel}.replaces_canonical_ids`, errors)) {
      if (!canonicalIds.has(canonicalId)) errors.push(`${substitutionLabel} unknown canonical_id ${canonicalId}`);
    }
    for (const canonicalId of stringArray(substitution.allowed_canonical_ids, `${substitutionLabel}.allowed_canonical_ids`, errors)) {
      if (!canonicalIds.has(canonicalId)) errors.push(`${substitutionLabel} unknown canonical_id ${canonicalId}`);
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
  if (!isNonEmptyString(trial.trial_date)) errors.push(`${label}.trial_date must be a non-empty string`);
  if (!isNonEmptyString(trial.reviewer)) errors.push(`${label}.reviewer must be a non-empty string`);
  if (!isNonEmptyString(trial.outcome)) errors.push(`${label}.outcome must be a non-empty string`);
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
  const endpointCodes = knownEndpointCodes(templates);
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

    if (!isPlainObject(entry.identity_signature)) {
      errors.push(`${label}.identity_signature must be an object`);
    } else {
      pushUnknownKeys(errors, entry.identity_signature, IDENTITY_SIGNATURE_FIELDS, `${label}.identity_signature`);
      for (const field of IDENTITY_SIGNATURE_FIELDS) {
        const values = stringArray(entry.identity_signature[field], `${label}.identity_signature.${field}`, errors);
        if (field !== 'required_states_or_cuts') {
          for (const canonicalId of values) {
            if (!canonicalIds.has(canonicalId)) errors.push(`${label} unknown canonical_id ${canonicalId}`);
          }
        }
      }
    }

    if (!Array.isArray(entry.approved_variants)) {
      errors.push(`${label}.approved_variants must be an array`);
    } else {
      entry.approved_variants.forEach((variant, variantIndex) => validateVariant(
        variant,
        `${label}.approved_variants[${variantIndex}]`,
        canonicalIds,
        errors,
      ));
    }
    if (!isNonEmptyString(entry.template_id) || !templateIds.has(entry.template_id)) {
      errors.push(`${label} unknown template_id ${entry.template_id}`);
    }
    if (!isPlainObject(entry.slot_assignment)) errors.push(`${label}.slot_assignment must be an object`);
    const ratioIds = stringArray(entry.ratio_rule_ids, `${label}.ratio_rule_ids`, errors);
    for (const ratioRuleId of ratioIds) {
      if (!ratioRuleIds.has(ratioRuleId)) errors.push(`${label} unknown ratio_rule_id ${ratioRuleId}`);
    }
    for (const field of ['technique_graph', 'seasoning_actions', 'source_claims']) {
      if (!Array.isArray(entry[field])) errors.push(`${label}.${field} must be an array`);
    }
    for (const endpointCode of stringArray(entry.safety_endpoints, `${label}.safety_endpoints`, errors)) {
      if (!endpointCodes.has(endpointCode)) errors.push(`${label} unknown safety endpoint ${endpointCode}`);
    }
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
      validateHouseholdTrial(entry.household_trial, `${label}.household_trial`, errors);
    }
  }
  return errors;
}

export function assertRecipeRuntimeCatalog(catalog, context) {
  const errors = validateRecipeRuntimeCatalog(catalog, context);
  if (errors.length) throw new Error(`recipe runtime catalog validation failed:\n${errors.join('\n')}`);
}

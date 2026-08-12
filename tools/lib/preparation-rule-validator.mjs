const CANDIDATE_FIELDS = new Set([
  'rule_id', 'rule_kind', 'activation_status', 'when', 'produces',
  'required_basic_extras', 'supporting_source_ids', 'numeric_evidence_source_ids',
  'calibration_case_ids', 'evidence_status', 'calibration_status', 'blocker_codes',
]);
const DEFINITION_FIELDS = new Set([
  'rule_id', 'activation_status', 'when', 'produces', 'operations',
  'required_basic_extras', 'evidence_source_ids', 'calibration_record_ids', 'rounding',
]);
const PREPARATION_WHEN_FIELDS = new Set(['input_canonical_id', 'allowed_shape_or_cut']);
const PREPARATION_PRODUCES_FIELDS = new Set(['canonical_id', 'state']);
const STEW_WHEN_FIELDS = new Set(['template_id', 'staple_canonical_id']);
const STEW_PRODUCES_FIELDS = new Set(['phase_allocations', 'staple_position', 'steam_required']);
const DEFINITION_WHEN_FIELDS = new Set(['input_canonical_id', 'input_category']);
const DEFINITION_PRODUCES_FIELDS = new Set(['canonical_id', 'category', 'state']);
const OPERATOR_FIELDS = new Map([
  ['per_serving', new Set(['operator', 'target', 'grams'])],
  ['ratio', new Set(['operator', 'target', 'denominator', 'bounds'])],
]);
const BOUNDS_FIELDS = new Set(['min', 'default', 'max']);
const PER_SERVING_TARGET_FIELDS = new Set(['canonical_id']);
const RATIO_TARGET_FIELDS = new Set(['name', 'category', 'phase']);
const DENOMINATOR_FIELDS = new Set(['canonical_id', 'measure']);
const ROUNDING_FIELDS = new Set(['grams_to_nearest']);
const RULE_KINDS = new Set(['preparation', 'stew_liquid']);
const ACTIVATION = new Set(['blocked', 'active']);
const EVIDENCE = new Set(['missing', 'evidence_ready']);
const CALIBRATION = new Set(['required', 'calibrated']);
const CANDIDATE_RULES = new Map([
  ['cornmeal-flour-to-dough-v1', 'preparation'],
  ['stew-with-corn-cake-liquid-v1', 'stew_liquid'],
]);
const CALIBRATION_IDS = ['ne-cal-2', 'ne-cal-3', 'ne-cal-4'];
const FORBIDDEN_CANDIDATE_FIELDS = new Set([
  'grams', 'minutes', 'temperature_c', 'min', 'default', 'max',
]);

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value, { allowEmpty = true } = {}) {
  return Array.isArray(value)
    && (allowEmpty || value.length > 0)
    && value.every(item => typeof item === 'string' && item.length > 0)
    && new Set(value).size === value.length;
}

function exactArray(value, expected) {
  return Array.isArray(value)
    && value.length === expected.length
    && value.every((item, index) => item === expected[index]);
}

function exactSet(value, expected) {
  return isStringArray(value)
    && value.length === expected.length
    && expected.every(item => value.includes(item));
}

function validateContext(context, errors) {
  if (!(context?.taxonomyIds instanceof Set)) errors.push('context.taxonomyIds must be a Set');
  if (!(context?.sourceIds instanceof Set)) errors.push('context.sourceIds must be a Set');
  if (context?.taxonomyById != null && !(context.taxonomyById instanceof Map)) {
    errors.push('context.taxonomyById must be a Map when supplied');
  }
  if (context?.numericEvidenceSourceIds != null && !(context.numericEvidenceSourceIds instanceof Set)) {
    errors.push('context.numericEvidenceSourceIds must be a Set when supplied');
  }
  if (context?.passedCalibrationIds != null && !(context.passedCalibrationIds instanceof Set)) {
    errors.push('context.passedCalibrationIds must be a Set when supplied');
  }
}

function assertAllowedKeys(value, allowed, label, errors) {
  if (!isObject(value)) {
    errors.push(`${label} must be an object`);
    return false;
  }
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`${label}: unexpected field ${key}`);
  }
  return true;
}

function collectForbiddenCandidateFields(value, path, errors) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectForbiddenCandidateFields(item, `${path}[${index}]`, errors));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_CANDIDATE_FIELDS.has(key)) {
      errors.push(`${path}.${key}: forbidden numeric field in research candidate`);
    }
    collectForbiddenCandidateFields(child, `${path}.${key}`, errors);
  }
}

function validateKnownIds(ids, known, label, kind, errors, { allowEmpty = true } = {}) {
  if (!isStringArray(ids, { allowEmpty })) {
    errors.push(`${label} must be a unique string array`);
    return;
  }
  if (!(known instanceof Set)) return;
  for (const id of ids) {
    if (!known.has(id)) errors.push(`${label}: unknown ${kind} ${id}`);
  }
}

function validateRequiredWater(value, label, errors) {
  if (!exactArray(value, ['水'])) errors.push(`${label} must be exactly 水`);
}

function validateCandidatePreparation(candidate, context, label, errors) {
  const whenLabel = `${label}.when`;
  if (assertAllowedKeys(candidate.when, PREPARATION_WHEN_FIELDS, whenLabel, errors)) {
    if (typeof candidate.when.input_canonical_id !== 'string'
        || !context?.taxonomyIds?.has(candidate.when.input_canonical_id)) {
      errors.push(`${whenLabel}.input_canonical_id references unknown taxonomy identity`);
    }
    if (candidate.when.input_canonical_id !== 'cornmeal-flour') {
      errors.push(`${whenLabel}.input_canonical_id must be cornmeal-flour`);
    }
    if (!exactSet(candidate.when.allowed_shape_or_cut, ['fine', 'coarse', 'unspecified'])) {
      errors.push(`${whenLabel}.allowed_shape_or_cut must be exactly fine coarse and unspecified`);
    }
    const input = context?.taxonomyById?.get(candidate.when.input_canonical_id);
    if (input && (input.category !== 'cornmeal_flour'
      || !candidate.when.allowed_shape_or_cut?.every(shape => input.shapes_or_cuts?.includes(shape)))) {
      errors.push(`${whenLabel}: input taxonomy row does not support the declared cornmeal shapes`);
    }
  }

  const producesLabel = `${label}.produces`;
  if (assertAllowedKeys(candidate.produces, PREPARATION_PRODUCES_FIELDS, producesLabel, errors)) {
    if (typeof candidate.produces.canonical_id !== 'string'
        || !context?.taxonomyIds?.has(candidate.produces.canonical_id)) {
      errors.push(`${producesLabel}.canonical_id references unknown taxonomy identity`);
    }
    if (candidate.produces.canonical_id !== 'cornmeal-dough') {
      errors.push(`${producesLabel}.canonical_id must be cornmeal-dough`);
    }
    if (candidate.produces.canonical_id === candidate.when?.input_canonical_id) {
      errors.push(`${label}: preparation output must differ from input`);
    }
    if (candidate.produces.state !== 'prepared') errors.push(`${producesLabel}.state must be prepared`);
    const output = context?.taxonomyById?.get(candidate.produces.canonical_id);
    if (output && (output.category !== 'cornmeal_dough' || !output.states?.includes('prepared'))) {
      errors.push(`${producesLabel}: output taxonomy row must be prepared cornmeal_dough`);
    }
  }
}

function validateCandidateStewLiquid(candidate, context, label, errors) {
  const whenLabel = `${label}.when`;
  if (assertAllowedKeys(candidate.when, STEW_WHEN_FIELDS, whenLabel, errors)) {
    if (candidate.when.template_id !== 'stew-with-staple-pot') {
      errors.push(`${whenLabel}.template_id must be stew-with-staple-pot`);
    }
    if (typeof candidate.when.staple_canonical_id !== 'string'
        || !context?.taxonomyIds?.has(candidate.when.staple_canonical_id)) {
      errors.push(`${whenLabel}.staple_canonical_id references unknown taxonomy identity`);
    }
    if (candidate.when.staple_canonical_id !== 'cornmeal-dough') {
      errors.push(`${whenLabel}.staple_canonical_id must be cornmeal-dough`);
    }
  }

  const producesLabel = `${label}.produces`;
  if (assertAllowedKeys(candidate.produces, STEW_PRODUCES_FIELDS, producesLabel, errors)) {
    if (!exactArray(candidate.produces.phase_allocations, ['prepare_staple', 'stew_liquid'])) {
      errors.push(`${producesLabel}.phase_allocations must be exactly prepare_staple then stew_liquid`);
    }
    if (candidate.produces.staple_position !== 'above_stew_liquid') {
      errors.push(`${producesLabel}.staple_position must be above_stew_liquid`);
    }
    if (candidate.produces.steam_required !== true) {
      errors.push(`${producesLabel}.steam_required must be true`);
    }
  }
}

export function validatePreparationRuleCandidate(candidate, context) {
  const errors = [];
  const label = `candidate ${candidate?.rule_id || '<unknown>'}`;
  validateContext(context, errors);
  if (!assertAllowedKeys(candidate, CANDIDATE_FIELDS, label, errors)) return errors;
  collectForbiddenCandidateFields(candidate, label, errors);

  if (!CANDIDATE_RULES.has(candidate.rule_id)) errors.push(`${label}: rule_id is not allowed`);
  if (!RULE_KINDS.has(candidate.rule_kind)) errors.push(`${label}: rule_kind is invalid`);
  if (CANDIDATE_RULES.has(candidate.rule_id)
      && CANDIDATE_RULES.get(candidate.rule_id) !== candidate.rule_kind) {
    errors.push(`${label}: rule_id and rule_kind do not match`);
  }
  if (!ACTIVATION.has(candidate.activation_status)) errors.push(`${label}: activation_status is invalid`);
  if (!EVIDENCE.has(candidate.evidence_status)) errors.push(`${label}: evidence_status is invalid`);
  if (!CALIBRATION.has(candidate.calibration_status)) errors.push(`${label}: calibration_status is invalid`);

  validateRequiredWater(candidate.required_basic_extras, `${label}.required_basic_extras`, errors);
  validateKnownIds(candidate.supporting_source_ids, context?.sourceIds, `${label}.supporting_source_ids`, 'source', errors, { allowEmpty:false });
  validateKnownIds(candidate.numeric_evidence_source_ids, context?.sourceIds, `${label}.numeric_evidence_source_ids`, 'source', errors);
  if (!isStringArray(candidate.calibration_case_ids)) {
    errors.push(`${label}.calibration_case_ids must be a unique string array`);
  } else if (candidate.calibration_case_ids.some(id => !CALIBRATION_IDS.includes(id))) {
    errors.push(`${label}.calibration_case_ids contains an unknown calibration record`);
  }
  if (!isStringArray(candidate.blocker_codes)) errors.push(`${label}.blocker_codes must be a unique string array`);

  if (candidate.rule_kind === 'preparation') validateCandidatePreparation(candidate, context, label, errors);
  if (candidate.rule_kind === 'stew_liquid') validateCandidateStewLiquid(candidate, context, label, errors);

  if (candidate.activation_status === 'blocked' && candidate.blocker_codes?.length === 0) {
    errors.push(`${label}: blocked candidate requires blocker_codes`);
  }
  if (candidate.evidence_status === 'evidence_ready'
      && (!Array.isArray(candidate.numeric_evidence_source_ids)
        || candidate.numeric_evidence_source_ids.length < 2)) {
    errors.push(`${label}: evidence_ready requires two independent numeric sources`);
  }
  if (candidate.evidence_status === 'evidence_ready'
      && context?.numericEvidenceSourceIds instanceof Set) {
    for (const id of candidate.numeric_evidence_source_ids || []) {
      if (!context.numericEvidenceSourceIds.has(id)) {
        errors.push(`${label}: numeric evidence source is not classified for machine ratios: ${id}`);
      }
    }
  }
  if (candidate.calibration_status === 'calibrated'
      && !exactSet(candidate.calibration_case_ids, CALIBRATION_IDS)) {
    errors.push(`${label}: calibrated requires 2 3 and 4 serving records`);
  }
  if (candidate.calibration_status === 'calibrated'
      && context?.passedCalibrationIds instanceof Set
      && !CALIBRATION_IDS.every(id => context.passedCalibrationIds.has(id))) {
    errors.push(`${label}: calibrated candidate requires passed calibration records`);
  }
  if (candidate.activation_status === 'active'
      && (candidate.evidence_status !== 'evidence_ready'
        || candidate.calibration_status !== 'calibrated')) {
    errors.push(`${label}: active candidate requires evidence and calibration`);
  }
  return errors;
}

export function assertPreparationRuleCandidate(candidate, context) {
  const errors = validatePreparationRuleCandidate(candidate, context);
  if (errors.length) throw new Error(`Invalid preparation rule candidate:\n- ${errors.join('\n- ')}`);
  return candidate;
}

function validateBounds(value, label, errors) {
  if (!assertAllowedKeys(value, BOUNDS_FIELDS, label, errors)) return;
  const values = [value.min, value.default, value.max];
  if (!values.every(item => Number.isFinite(item) && item > 0)
      || !(value.min <= value.default && value.default <= value.max)) {
    errors.push(`${label} must contain ordered positive bounds`);
  }
}

function validateDefinitionOperations(operations, errors) {
  if (!Array.isArray(operations) || operations.length !== 2) {
    errors.push('definition.operations must contain exactly two operations');
    return;
  }
  if (operations[0]?.operator !== 'per_serving' || operations[1]?.operator !== 'ratio') {
    errors.push('definition.operations must be per_serving then ratio');
  }
  for (const [index, operation] of operations.entries()) {
    const label = `definition.operations[${index}]`;
    const allowed = OPERATOR_FIELDS.get(operation?.operator);
    if (!allowed) {
      errors.push(`${label}.operator is invalid`);
      continue;
    }
    if (!assertAllowedKeys(operation, allowed, label, errors)) continue;
    if (operation.operator === 'per_serving') {
      if (assertAllowedKeys(operation.target, PER_SERVING_TARGET_FIELDS, `${label}.target`, errors)
          && operation.target.canonical_id !== 'cornmeal-flour') {
        errors.push(`${label}.target.canonical_id must be cornmeal-flour`);
      }
      validateBounds(operation.grams, `${label}.grams`, errors);
    } else {
      if (assertAllowedKeys(operation.target, RATIO_TARGET_FIELDS, `${label}.target`, errors)) {
        if (operation.target.name !== '水' || operation.target.category !== 'liquid'
            || operation.target.phase !== 'prepare_staple') {
          errors.push(`${label}: water target must use prepare_staple phase`);
        }
      }
      if (assertAllowedKeys(operation.denominator, DENOMINATOR_FIELDS, `${label}.denominator`, errors)
          && (operation.denominator.canonical_id !== 'cornmeal-flour'
            || operation.denominator.measure !== 'grams')) {
        errors.push(`${label}.denominator must be cornmeal-flour grams`);
      }
      validateBounds(operation.bounds, `${label}.bounds`, errors);
    }
  }
}

export function validatePreparationRuleDefinition(rule, context) {
  const errors = [];
  validateContext(context, errors);
  if (!assertAllowedKeys(rule, DEFINITION_FIELDS, 'definition', errors)) return errors;
  if (rule.rule_id !== 'cornmeal-flour-to-dough-v1') errors.push('definition.rule_id is invalid');
  if (rule.activation_status !== 'active') errors.push('definition.activation_status must be active');

  if (assertAllowedKeys(rule.when, DEFINITION_WHEN_FIELDS, 'definition.when', errors)) {
    if (rule.when.input_canonical_id !== 'cornmeal-flour'
        || rule.when.input_category !== 'cornmeal_flour') {
      errors.push('definition.when must target cornmeal-flour and cornmeal_flour');
    }
    if (!context?.taxonomyIds?.has(rule.when.input_canonical_id)) {
      errors.push('definition.when.input_canonical_id references unknown taxonomy identity');
    }
  }
  if (assertAllowedKeys(rule.produces, DEFINITION_PRODUCES_FIELDS, 'definition.produces', errors)) {
    if (rule.produces.canonical_id !== 'cornmeal-dough'
        || rule.produces.category !== 'cornmeal_dough'
        || rule.produces.state !== 'prepared') {
      errors.push('definition.produces must be prepared cornmeal-dough');
    }
    if (!context?.taxonomyIds?.has(rule.produces.canonical_id)) {
      errors.push('definition.produces.canonical_id references unknown taxonomy identity');
    }
  }

  validateDefinitionOperations(rule.operations, errors);
  validateRequiredWater(rule.required_basic_extras, 'definition.required_basic_extras', errors);
  validateKnownIds(rule.evidence_source_ids, context?.sourceIds, 'definition.evidence_source_ids', 'source', errors, { allowEmpty:false });
  if (!Array.isArray(rule.evidence_source_ids) || rule.evidence_source_ids.length < 2) {
    errors.push('definition requires at least two evidence sources');
  }
  if (!exactSet(rule.calibration_record_ids, CALIBRATION_IDS)) {
    errors.push('definition.calibration_record_ids must be exactly ne-cal-2 ne-cal-3 and ne-cal-4');
  }
  if (assertAllowedKeys(rule.rounding, ROUNDING_FIELDS, 'definition.rounding', errors)
      && (!Number.isInteger(rule.rounding.grams_to_nearest)
        || rule.rounding.grams_to_nearest <= 0)) {
    errors.push('definition.rounding.grams_to_nearest must be a positive integer');
  }
  return errors;
}

export function assertPreparationRuleDefinition(rule, context) {
  const errors = validatePreparationRuleDefinition(rule, context);
  if (errors.length) throw new Error(`Invalid preparation rule definition:\n- ${errors.join('\n- ')}`);
  return rule;
}

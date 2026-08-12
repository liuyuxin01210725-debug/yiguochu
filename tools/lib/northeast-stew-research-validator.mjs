import { validatePreparationRuleCandidate } from './preparation-rule-validator.mjs';

const EXPECTED_ATLAS_IDS = new Set([
  'northeast-chicken-mushroom-potato-corn-cake',
  'northeast-fish-tofu-vegetable-corn-cake',
  'northeast-ribs-beans-corn-cake',
  'northeast-ribs-beans-sticky-rolls',
]);
const EXPECTED_PROVINCE_CODES = new Set(['CN-LN', 'CN-JL', 'CN-HL']);
const EXPECTED_SOURCE_IDS = new Set([
  'hlj-gov-iron-pot-2025', 'hlj-culture-autumn-pot-2025',
  'jilin-huadian-routes-2025', 'jilin-lishu-routes-2025',
  'jilin-baishan-food-2024', 'liaoning-autumn-food-2025',
  'beijing-pinggu-sticky-roll-2019',
]);
const EXPECTED_STAPLE_FORMS = new Set(['corn_dough_cake', 'wheat_flower_roll', 'sticky_roll']);
const EXPECTED_SAFETY_BRANCHES = new Set(['chicken', 'pork_ribs', 'fish', 'green_beans']);
const VERDICTS = new Set(['supported', 'not_proven', 'contradicted']);
const STATES = new Set(['fact_checked', 'needs_more_evidence', 'rejected']);
const DESTINATIONS = new Set(['recipe_evidence', 'template_evidence', 'taxonomy_rule', 'ratio_rule', 'content_only', 'rejected']);
const SOURCE_GRADES = new Set(['A', 'B', 'C']);
const EVIDENCE_STATUSES = new Set(['supported', 'family_supported', 'not_proven', 'supported_in_beijing']);
const JOURNEY_OUTCOMES = new Set(['supported_family_route', 'needs_more_evidence', 'unsupported_for_family']);
const JOURNEY_INTENTS = new Set(['normal', 'quick']);
const REVIEW_STATUSES = new Set(['pending', 'passed', 'failed']);
const M2_OUTCOMES = new Set([
  'complete', 'ready', 'unsupported_staple_state', 'unsupported_servings',
  'time_constraint', 'incompatible_combination', 'allergen_conflict',
  'stale_plan', 'no_alternative_plan', 'model_contract_violation',
]);
const CAPABILITY_MODES = new Set(['pantry', 'recommend']);
const CAPABILITY_INTENTS = new Set(['normal', 'quick', 'batch']);
const CALIBRATION_IDS = ['ne-cal-2', 'ne-cal-3', 'ne-cal-4'];
const CAPABILITY_JOURNEY_SIGNATURES = new Map([
  ['ne-cap-j01', ['pantry', 'normal', 2, ['排骨', '油豆角', '玉米面'], [], 'template_not_runtime_eligible', 'complete', 'stew-with-staple-pot', ['排骨', '油豆角', '玉米面'], [], null, ['original_cornmeal_retained', 'preparation_required', 'two_phase_water_required', 'regional_family_wording_allowed']]],
  ['ne-cap-j02', ['pantry', 'normal', 3, ['排骨', '油豆角', '玉米面'], [], 'template_not_runtime_eligible', 'complete', 'stew-with-staple-pot', ['排骨', '油豆角', '玉米面'], [], null, ['three_serving_calibration_required', 'stable_ratio_scaling']]],
  ['ne-cap-j03', ['pantry', 'batch', 4, ['排骨', '油豆角', '玉米面'], [], 'template_not_runtime_eligible', 'complete', 'stew-with-staple-pot', ['排骨', '油豆角', '玉米面'], [], null, ['four_serving_calibration_required', 'stable_ratio_scaling']]],
  ['ne-cap-j04', ['recommend', 'normal', 2, ['排骨', '油豆角', '玉米面'], [], 'template_not_runtime_eligible', 'ready', 'stew-with-staple-pot', ['排骨', '油豆角', '玉米面'], [], null, ['recommend_not_full_coverage_promise', 'regional_family_basis_explained']]],
  ['ne-cap-j05', ['pantry', 'normal', 2, ['鸡腿', '土豆', '玉米面'], [], 'template_not_runtime_eligible', 'complete', 'stew-with-staple-pot', ['鸡腿', '土豆', '玉米面'], [], null, ['household_adaptation_name_only', 'no_fixed_traditional_name_claim']]],
  ['ne-cap-j06', ['pantry', 'normal', 2, ['排骨', '普通豆角', '玉米面'], [], 'template_not_runtime_eligible', 'complete', 'stew-with-staple-pot', ['排骨', '普通豆角', '玉米面'], [], null, ['generic_beans_not_oil_beans', 'no_fixed_oil_beans_claim']]],
  ['ne-cap-j07', ['pantry', 'normal', 2, ['排骨', '豆角', '和好的玉米面团'], [], 'template_not_runtime_eligible', 'complete', 'stew-with-staple-pot', ['排骨', '豆角', '和好的玉米面团'], [], null, ['prepared_dough_identity_preserved', 'preparation_not_repeated']]],
  ['ne-cap-j08', ['pantry', 'normal', 2, ['排骨', '豆角', '现成玉米饼'], [], 'template_not_runtime_eligible', 'unsupported_staple_state', null, [], ['排骨', '豆角', '现成玉米饼'], 'unsupported_staple_state', ['ready_cake_identity_preserved', 'ready_cake_not_raw_dough', 'ready_cake_unsupported_first_stage']]],
  ['ne-cap-j09', ['pantry', 'normal', 2, ['排骨', '豆角', '玉米粒'], [], 'template_not_runtime_eligible', 'unsupported_staple_state', null, [], ['排骨', '豆角', '玉米粒'], 'unsupported_staple_state', ['corn_kernel_not_cornmeal']]],
  ['ne-cap-j10', ['pantry', 'normal', 2, ['排骨', '豆角', '小麦面粉'], [], 'template_not_runtime_eligible', 'unsupported_staple_state', null, [], ['排骨', '豆角', '小麦面粉'], 'unsupported_staple_state', ['wheat_flour_remains_unplanned']]],
  ['ne-cap-j11', ['pantry', 'quick', 2, ['排骨', '豆角', '玉米面'], [], 'template_not_runtime_eligible', 'time_constraint', 'stew-with-staple-pot', [], ['排骨', '豆角', '玉米面'], 'time_constraint', ['no_false_thirty_minute_plan']]],
  ['ne-cap-j12', ['pantry', 'normal', 1, ['排骨', '豆角', '玉米面'], [], 'template_not_runtime_eligible', 'unsupported_servings', 'stew-with-staple-pot', [], ['排骨', '豆角', '玉米面'], 'unsupported_servings', ['one_serving_not_calibrated']]],
  ['ne-cap-j13', ['pantry', 'normal', 5, ['排骨', '豆角', '玉米面'], [], 'template_not_runtime_eligible', 'unsupported_servings', 'stew-with-staple-pot', [], ['排骨', '豆角', '玉米面'], 'unsupported_servings', ['five_servings_requires_explicit_split']]],
  ['ne-cap-j14', ['pantry', 'normal', 2, ['排骨', '鸡腿', '豆角', '玉米面'], [], 'template_not_runtime_eligible', 'incompatible_combination', 'stew-with-staple-pot', [], ['排骨', '鸡腿', '豆角', '玉米面'], 'incompatible_combination', ['protein_max_one', 'no_forced_double_protein']]],
  ['ne-cap-j15', ['pantry', 'normal', 2, ['鱼', '豆腐', '白菜', '玉米面'], [], 'template_not_runtime_eligible', 'incompatible_combination', null, [], ['鱼', '豆腐', '白菜', '玉米面'], 'incompatible_combination', ['fish_branch_not_first_stage', 'tofu_not_traditional_core']]],
  ['ne-cap-j16', ['pantry', 'normal', 2, ['排骨', '豆角', '玉米面'], ['猪肉'], 'template_not_runtime_eligible', 'allergen_conflict', 'stew-with-staple-pot', [], ['排骨', '豆角', '玉米面'], 'allergen_conflict', ['pork_allergy_blocks_plan']]],
  ['ne-cap-j17', ['pantry', 'normal', 2, ['排骨', '油豆角', '玉米面'], [], 'template_not_runtime_eligible', 'complete', 'stew-with-staple-pot', ['排骨', '油豆角', '玉米面'], [], null, ['same_input_same_plan', 'same_input_same_plan_id']]],
  ['ne-cap-j18', ['pantry', 'normal', 2, ['排骨', '油豆角', '玉米面'], [], 'template_not_runtime_eligible', 'stale_plan', 'stew-with-staple-pot', ['排骨', '油豆角', '玉米面'], [], 'stale_plan', ['preparation_version_in_plan_identity', 'old_token_rejected']]],
  ['ne-cap-j19', ['pantry', 'normal', 2, ['排骨', '油豆角', '玉米面'], [], 'template_not_runtime_eligible', 'no_alternative_plan', 'stew-with-staple-pot', ['排骨', '油豆角', '玉米面'], [], 'no_alternative_plan', ['swap_replans_without_deepseek', 'no_equal_commitment_alternative']]],
  ['ne-cap-j20', ['pantry', 'normal', 2, ['排骨', '油豆角', '玉米面'], [], 'template_not_runtime_eligible', 'model_contract_violation', 'stew-with-staple-pot', ['排骨', '油豆角', '玉米面'], [], 'model_contract_violation', ['model_violation_added_wheat_flour_or_egg']]],
  ['ne-cap-j21', ['pantry', 'normal', 2, ['排骨', '油豆角', '玉米面'], [], 'template_not_runtime_eligible', 'model_contract_violation', 'stew-with-staple-pot', ['排骨', '油豆角', '玉米面'], [], 'model_contract_violation', ['model_violation_modified_preparation_or_stew_water']]],
  ['ne-cap-j22', ['pantry', 'normal', 2, ['排骨', '油豆角', '玉米面'], [], 'template_not_runtime_eligible', 'model_contract_violation', 'stew-with-staple-pot', ['排骨', '油豆角', '玉米面'], [], 'model_contract_violation', ['model_violation_changed_cornmeal_to_corn_kernel']]],
]);

const ROOT_FIELDS = new Set([
  'schema_version', 'assessment_version', 'region_id', 'family_id',
  'province_codes', 'source_refs', 'prototypes', 'family_model', 'journey_cases',
  'machine_rule_candidates', 'calibration_cases', 'capability_journey_cases',
]);
const SOURCE_FIELDS = new Set([
  'source_id', 'title', 'url', 'publisher', 'published_at', 'retrieved_at',
  'source_grade', 'evidence_summary', 'proves', 'does_not_prove',
]);
const PROTOTYPE_FIELDS = new Set([
  'atlas_id', 'research_state', 'verified_geography', 'claims', 'variant_relation',
  'ingredient_roles', 'ratio_evidence_status', 'safety_evidence_status',
  'product_destinations', 'priority', 'decision_reason',
]);
const CLAIM_FIELDS = new Set(['claim_id', 'verdict', 'evidence_source_ids', 'reason']);
const GEOGRAPHY_FIELDS = new Set(['region_ids', 'province_codes']);
const VARIANT_FIELDS = new Set(['family_anchor', 'exact_combination_status', 'notes']);
const INGREDIENT_ROLE_FIELDS = new Set(['item', 'role', 'evidence_status']);
const PRIORITY_FIELDS = new Set(['product_score', 'regional_score', 'risk_penalty', 'total_score']);
const FAMILY_FIELDS = new Set(['family_anchor', 'staple_forms', 'safety_branches']);
const STAPLE_FIELDS = new Set(['form_id', 'name', 'evidence_status', 'source_ids', 'shape_notes']);
const SAFETY_FIELDS = new Set(['branch_id', 'name', 'evidence_status', 'source_ids', 'safety_rule_ids', 'endpoint_note']);
const SAFETY_RULES_BY_BRANCH = new Map([
  ['chicken', []],
  ['pork_ribs', ['pork-ribs-safe-endpoint-v1']],
  ['fish', []],
  ['green_beans', ['green-beans-fully-cooked-v1', 'oil-beans-fully-cooked-v1']],
]);
const JOURNEY_FIELDS = new Set([
  'journey_id', 'mode', 'intent', 'raw_items', 'expected_used_items',
  'expected_unplanned_items', 'expected_research_outcome', 'explanation', 'human_review',
]);
const REVIEW_FIELDS = new Set([
  'status', 'reviewer', 'reviewed_at', 'household_intuition', 'operability',
  'taste_judgement', 'notes', 'conclusion',
]);
const CALIBRATION_FIELDS = new Set([
  'calibration_id', 'servings', 'status', 'operator', 'performed_at',
  'cornmeal_shape_or_cut', 'cornmeal_brand', 'preparation_water_temperature_c',
  'wheat_flour_added', 'fermentation_used', 'stew_liquid_level_at_paste',
  'equipment', 'measurements', 'acceptance_checks', 'notes',
]);
const EQUIPMENT_FIELDS = new Set(['pot_diameter_cm', 'pot_depth_cm', 'lid_fit_confirmed']);
const MEASUREMENT_FIELDS = new Set([
  'cornmeal_grams', 'preparation_water_grams', 'stew_water_grams', 'steam_minutes',
]);
const ACCEPTANCE_FIELDS = new Set([
  'dough_holds_shape', 'center_cooked_through', 'cake_above_liquid',
  'cake_holds_together', 'pot_not_scorched', 'pork_endpoint_reached',
  'beans_endpoint_reached',
]);
const CAPABILITY_JOURNEY_FIELDS = new Set([
  'journey_id', 'mode', 'intent', 'servings', 'raw_items', 'dislikes',
  'm1_runtime_expectation', 'm2_expected_outcome', 'expected_template_id',
  'expected_used_items', 'expected_unplanned_items', 'expected_reason_code',
  'assertion_codes',
]);

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const asObject = value => isObject(value) ? value : {};
const asArray = value => Array.isArray(value) ? value : [];
const hasText = value => typeof value === 'string' && value.trim().length > 0;

function unknownFields(value, allowed, label, errors) {
  if (!isObject(value)) return;
  for (const field of Object.keys(value)) if (!allowed.has(field)) errors.push(`${label}: ${field} is not allowed`);
}

function textArray(value, label, errors, { nonEmpty = true } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array`);
    return [];
  }
  if (nonEmpty && value.length === 0) errors.push(`${label} must be non-empty`);
  if (!value.every(hasText)) errors.push(`${label} items must be non-empty strings`);
  if (new Set(value).size !== value.length) errors.push(`${label} items must be unique`);
  return value.filter(hasText);
}

function exactSet(actual, expected, label, errors) {
  const left = [...actual].sort();
  const right = [...expected].sort();
  if (JSON.stringify(left) !== JSON.stringify(right)) errors.push(`${label} must match the approved northeast set`);
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value && value <= '2026-07-27';
}

function validateSources(sources, errors) {
  const ids = [];
  for (const [index, source] of sources.entries()) {
    const safe = asObject(source);
    const label = hasText(safe.source_id) ? safe.source_id : `source ${index}`;
    if (!isObject(source)) {
      errors.push(`${label}: source must be an object`);
      continue;
    }
    unknownFields(source, SOURCE_FIELDS, label, errors);
    for (const field of ['source_id', 'title', 'url', 'publisher', 'evidence_summary']) {
      if (!hasText(safe[field])) errors.push(`${label}: ${field} must be a non-empty string`);
    }
    try {
      const url = new URL(safe.url);
      if (url.protocol !== 'https:') errors.push(`${label}: url must use HTTPS`);
    } catch {
      errors.push(`${label}: url must be a valid HTTPS URL`);
    }
    for (const field of ['published_at', 'retrieved_at']) if (!validDate(safe[field])) errors.push(`${label}: ${field} must be a valid non-future date`);
    if (!SOURCE_GRADES.has(safe.source_grade)) errors.push(`${label}: source_grade is invalid`);
    textArray(safe.proves, `${label}: proves`, errors, { nonEmpty: false });
    textArray(safe.does_not_prove, `${label}: does_not_prove`, errors, { nonEmpty: false });
    ids.push(safe.source_id);
  }
  if (new Set(ids).size !== ids.length) errors.push('source_id must be unique');
  exactSet(ids.filter(hasText), EXPECTED_SOURCE_IDS, 'source_id', errors);
}

function validatePrototype(prototype, index, sourceById, errors) {
  const safe = asObject(prototype);
  const label = hasText(safe.atlas_id) ? safe.atlas_id : `prototype ${index}`;
  if (!isObject(prototype)) {
    errors.push(`${label}: prototype must be an object`);
    return;
  }
  unknownFields(prototype, PROTOTYPE_FIELDS, label, errors);
  if (!STATES.has(safe.research_state)) errors.push(`${label}: research_state is invalid`);
  const geography = asObject(safe.verified_geography);
  if (!isObject(safe.verified_geography)) errors.push(`${label}: verified_geography must be an object`);
  unknownFields(geography, GEOGRAPHY_FIELDS, `${label}: verified_geography`, errors);
  textArray(geography.region_ids, `${label}: verified_geography.region_ids`, errors);
  textArray(geography.province_codes, `${label}: verified_geography.province_codes`, errors);

  const claims = asObject(safe.claims);
  if (!isObject(safe.claims) || Object.keys(claims).length === 0) errors.push(`${label}: claims must be a non-empty object`);
  for (const [claimName, claimValue] of Object.entries(claims)) {
    const claim = asObject(claimValue);
    const claimLabel = `${label}: claims.${claimName}`;
    if (!isObject(claimValue)) {
      errors.push(`${claimLabel} must be an object`);
      continue;
    }
    unknownFields(claim, CLAIM_FIELDS, claimLabel, errors);
    if (!hasText(claim.claim_id)) errors.push(`${claimLabel}: claim_id must be a non-empty string`);
    if (!VERDICTS.has(claim.verdict)) errors.push(`${claimLabel}: verdict is invalid`);
    if (!hasText(claim.reason)) errors.push(`${claimLabel}: reason must be a non-empty string`);
    const evidenceIds = textArray(claim.evidence_source_ids, `${claimLabel}: evidence_source_ids`, errors);
    const evidence = evidenceIds.map(id => sourceById.get(id)).filter(Boolean);
    for (const id of evidenceIds) if (!sourceById.has(id)) errors.push(`${claimLabel}: unknown evidence source ${id}`);
    if (claim.verdict === 'supported') {
      if (!evidence.some(source => asArray(source.proves).includes(claim.claim_id))) {
        errors.push(`${claimLabel}: supported claim requires evidence that proves the claim`);
      }
      if (evidence.length > 0 && evidence.every(source => source.source_grade === 'C')) {
        errors.push(`${claimLabel}: source grade C cannot alone support fact_checked claims`);
      }
    }
    if (claim.verdict === 'contradicted' && !evidence.some(source => asArray(source.proves).includes(`not:${claim.claim_id}`))) {
      errors.push(`${claimLabel}: contradicted claim requires direct negative evidence`);
    }
  }
  if (safe.research_state === 'fact_checked' && Object.values(claims).some(value => asObject(value).verdict !== 'supported')) {
    errors.push(`${label}: fact_checked requires every identity claim to be supported`);
  }
  if (safe.atlas_id === 'northeast-ribs-beans-sticky-rolls'
    && asObject(claims.northeast_identity).verdict === 'contradicted'
    && asArray(geography.province_codes).includes('CN-BJ')) {
    errors.push(`${label}: another verified geography cannot contradict northeast existence`);
  }

  const variant = asObject(safe.variant_relation);
  if (!isObject(safe.variant_relation)) errors.push(`${label}: variant_relation must be an object`);
  unknownFields(variant, VARIANT_FIELDS, `${label}: variant_relation`, errors);
  for (const field of VARIANT_FIELDS) if (!hasText(variant[field])) errors.push(`${label}: variant_relation.${field} must be a non-empty string`);

  const roles = asArray(safe.ingredient_roles);
  if (!Array.isArray(safe.ingredient_roles) || roles.length === 0) errors.push(`${label}: ingredient_roles must be a non-empty array`);
  for (const [roleIndex, roleValue] of roles.entries()) {
    const role = asObject(roleValue);
    const roleLabel = `${label}: ingredient_roles[${roleIndex}]`;
    if (!isObject(roleValue)) errors.push(`${roleLabel} must be an object`);
    unknownFields(role, INGREDIENT_ROLE_FIELDS, roleLabel, errors);
    if (!hasText(role.item) || !hasText(role.role)) errors.push(`${roleLabel}: item and role must be non-empty strings`);
    if (!EVIDENCE_STATUSES.has(role.evidence_status)) errors.push(`${roleLabel}: evidence_status is invalid`);
  }
  if (safe.ratio_evidence_status !== 'unresearched') errors.push(`${label}: ratio_evidence_status must remain unresearched in phase one`);
  if (safe.safety_evidence_status !== 'unresearched') errors.push(`${label}: safety_evidence_status must remain unresearched in phase one`);
  const destinations = textArray(safe.product_destinations, `${label}: product_destinations`, errors);
  for (const destination of destinations) if (!DESTINATIONS.has(destination)) errors.push(`${label}: product destination ${destination} is invalid`);
  if (!hasText(safe.decision_reason)) errors.push(`${label}: decision_reason must be a non-empty string`);

  const priority = asObject(safe.priority);
  if (!isObject(safe.priority)) errors.push(`${label}: priority must be an object`);
  unknownFields(priority, PRIORITY_FIELDS, `${label}: priority`, errors);
  for (const field of PRIORITY_FIELDS) if (!Number.isInteger(priority[field])) errors.push(`${label}: priority.${field} must be an integer`);
  if (Number.isInteger(priority.product_score) && Number.isInteger(priority.regional_score)
    && Number.isInteger(priority.risk_penalty) && Number.isInteger(priority.total_score)
    && priority.product_score + priority.regional_score - priority.risk_penalty !== priority.total_score) {
    errors.push(`${label}: priority total_score is inconsistent`);
  }
}

function validateFamilyModel(value, sourceIds, errors) {
  const family = asObject(value);
  if (!isObject(value)) errors.push('family_model must be an object');
  unknownFields(family, FAMILY_FIELDS, 'family_model', errors);
  if (family.family_anchor !== 'northeast-iron-pot-stew-with-staple') errors.push('family_model.family_anchor is invalid');

  const stapleForms = asArray(family.staple_forms);
  if (!Array.isArray(family.staple_forms)) errors.push('family_model.staple_forms must be an array');
  exactSet(stapleForms.map(row => asObject(row).form_id).filter(hasText), EXPECTED_STAPLE_FORMS, 'staple form_id', errors);
  for (const [index, value] of stapleForms.entries()) {
    const row = asObject(value);
    const label = `staple form ${index}`;
    if (!isObject(value)) errors.push(`${label} must be an object`);
    unknownFields(row, STAPLE_FIELDS, label, errors);
    for (const field of ['form_id', 'name', 'shape_notes']) if (!hasText(row[field])) errors.push(`${label}: ${field} must be non-empty`);
    if (row.evidence_status !== 'unresearched') errors.push(`${label}: evidence_status must be unresearched`);
    for (const id of textArray(row.source_ids, `${label}: source_ids`, errors)) if (!sourceIds.has(id)) errors.push(`${label}: unknown source ${id}`);
    for (const forbidden of ['grams', 'minutes', 'temperature_c']) if (forbidden in row) errors.push(`${label}: ${forbidden} is not allowed before evidence`);
  }

  const safetyBranches = asArray(family.safety_branches);
  if (!Array.isArray(family.safety_branches)) errors.push('family_model.safety_branches must be an array');
  exactSet(safetyBranches.map(row => asObject(row).branch_id).filter(hasText), EXPECTED_SAFETY_BRANCHES, 'safety branch_id', errors);
  for (const [index, value] of safetyBranches.entries()) {
    const row = asObject(value);
    const label = `safety branch ${index}`;
    if (!isObject(value)) errors.push(`${label} must be an object`);
    unknownFields(row, SAFETY_FIELDS, label, errors);
    for (const field of ['branch_id', 'name', 'endpoint_note']) if (!hasText(row[field])) errors.push(`${label}: ${field} must be non-empty`);
    const expectedRuleIds = SAFETY_RULES_BY_BRANCH.get(row.branch_id) || [];
    const expectedStatus = expectedRuleIds.length ? 'calibration_ready' : 'unresearched';
    if (row.evidence_status !== expectedStatus) errors.push(`${label}: evidence_status must be ${expectedStatus}`);
    for (const id of textArray(row.source_ids, `${label}: source_ids`, errors)) if (!sourceIds.has(id)) errors.push(`${label}: unknown source ${id}`);
    const safetyRuleIds = textArray(row.safety_rule_ids, `${label}: safety_rule_ids`, errors, { nonEmpty: false });
    if (JSON.stringify(safetyRuleIds) !== JSON.stringify(expectedRuleIds)) errors.push(`${label}: safety_rule_ids must match the approved safety evidence rules`);
    for (const forbidden of ['grams', 'minutes', 'temperature_c']) if (forbidden in row) errors.push(`${label}: ${forbidden} is not allowed before evidence`);
  }
}

function validateJourneys(value, errors) {
  if (!Array.isArray(value)) {
    errors.push('assessment: journey_cases must be an array');
    return;
  }
  if (value.length !== 10) errors.push('assessment: journey_cases must contain exactly 10 items');
  const ids = [];
  for (const [index, journeyValue] of value.entries()) {
    const journey = asObject(journeyValue);
    const label = hasText(journey.journey_id) ? journey.journey_id : `journey ${index}`;
    if (!isObject(journeyValue)) {
      errors.push(`${label}: journey must be an object`);
      continue;
    }
    unknownFields(journey, JOURNEY_FIELDS, label, errors);
    if (!hasText(journey.journey_id)) errors.push(`${label}: journey_id must be a non-empty string`);
    if (journey.mode !== 'pantry') errors.push(`${label}: mode must be pantry`);
    if (!JOURNEY_INTENTS.has(journey.intent)) errors.push(`${label}: intent is invalid`);
    const raw = textArray(journey.raw_items, `${label}: raw_items`, errors);
    const used = textArray(journey.expected_used_items, `${label}: expected_used_items`, errors, { nonEmpty: false });
    const unplanned = textArray(journey.expected_unplanned_items, `${label}: expected_unplanned_items`, errors, { nonEmpty: false });
    if (used.some(item => unplanned.includes(item))) errors.push(`${label}: used and unplanned items must not overlap`);
    const partition = [...used, ...unplanned];
    if (JSON.stringify([...partition].sort()) !== JSON.stringify([...raw].sort())) {
      errors.push(`${label}: used and unplanned items must partition raw_items`);
    }
    if (!JOURNEY_OUTCOMES.has(journey.expected_research_outcome)) errors.push(`${label}: expected_research_outcome is invalid`);
    if (!hasText(journey.explanation)) errors.push(`${label}: explanation must be a non-empty string`);
    const review = asObject(journey.human_review);
    if (!isObject(journey.human_review)) errors.push(`${label}: human_review must be an object`);
    unknownFields(review, REVIEW_FIELDS, `${label}: human_review`, errors);
    if (!REVIEW_STATUSES.has(review.status)) errors.push(`${label}: human_review.status is invalid`);
    if (review.status === 'pending') {
      if (review.reviewer !== null || review.reviewed_at !== null
        || review.household_intuition !== null || review.operability !== null || review.taste_judgement !== null
        || review.conclusion !== null || review.notes !== '') {
        errors.push(`${label}: pending human review must remain unfilled`);
      }
    } else if (!hasText(review.reviewer) || !validDate(review.reviewed_at)
      || !hasText(review.household_intuition) || !hasText(review.operability) || !hasText(review.taste_judgement)
      || !hasText(review.notes) || !hasText(review.conclusion)) {
      errors.push(`${label}: completed human review requires reviewer, date, household judgement, notes and conclusion`);
    }
    ids.push(journey.journey_id);
  }
  if (new Set(ids).size !== ids.length) errors.push('journey_id must be unique');
  const expectedIds = Array.from({ length: 10 }, (_, index) => `ne-j${String(index + 1).padStart(2, '0')}`);
  if (JSON.stringify(ids.filter(hasText).sort()) !== JSON.stringify(expectedIds)) errors.push('journey_id must match ne-j01 through ne-j10');
}

function validateMachineRuleCandidates(value, taxonomy, sourceIds, calibrationCases, errors) {
  if (!Array.isArray(value)) {
    errors.push('assessment: machine_rule_candidates must be an array');
    return;
  }
  if (value.length !== 2) errors.push('assessment: machine_rule_candidates must contain exactly 2 items');
  const taxonomyRows = asArray(taxonomy?.items).filter(isObject);
  const taxonomyIds = new Set(taxonomyRows.map(row => row.canonical_id).filter(hasText));
  const taxonomyById = new Map(taxonomyRows.map(row => [row.canonical_id, row]));
  const passedCalibrationIds = new Set(
    asArray(calibrationCases).filter(row => row?.status === 'passed').map(row => row.calibration_id),
  );
  if (taxonomyIds.size === 0) errors.push('ingredient taxonomy is missing canonical identities');
  for (const candidate of value) {
    errors.push(...validatePreparationRuleCandidate(candidate, {
      taxonomyIds,
      taxonomyById,
      sourceIds,
      numericEvidenceSourceIds: new Set(),
      passedCalibrationIds,
    }));
    if (candidate?.activation_status !== 'blocked'
      || candidate?.evidence_status !== 'missing'
      || candidate?.calibration_status !== 'required') {
      errors.push(`${candidate?.rule_id || 'candidate'}: M1 machine rule candidates must remain blocked`);
    }
  }
  const ids = value.map(row => asObject(row).rule_id).filter(hasText).sort();
  const expected = ['cornmeal-flour-to-dough-v1', 'stew-with-corn-cake-liquid-v1'];
  if (JSON.stringify(ids) !== JSON.stringify(expected)) {
    errors.push('machine_rule_candidates must contain the two approved M1 candidate IDs');
  }
}

function valuesAreNull(value, expectedFields) {
  return isObject(value)
    && [...expectedFields].every(field => Object.hasOwn(value, field) && value[field] === null);
}

function validateCalibrationCases(value, errors) {
  if (!Array.isArray(value)) {
    errors.push('assessment: calibration_cases must be an array');
    return;
  }
  const ids = value.map(row => asObject(row).calibration_id).filter(hasText);
  if (JSON.stringify(ids) !== JSON.stringify(CALIBRATION_IDS)) {
    errors.push('calibration cases must be exactly ne-cal-2 ne-cal-3 and ne-cal-4');
  }
  for (const [index, calibrationValue] of value.entries()) {
    const calibration = asObject(calibrationValue);
    const label = hasText(calibration.calibration_id)
      ? calibration.calibration_id
      : `calibration ${index}`;
    if (!isObject(calibrationValue)) {
      errors.push(`${label}: calibration must be an object`);
      continue;
    }
    unknownFields(calibration, CALIBRATION_FIELDS, label, errors);
    const expectedId = CALIBRATION_IDS[index];
    const expectedServings = index + 2;
    if (calibration.calibration_id !== expectedId || calibration.servings !== expectedServings) {
      errors.push(`${label}: calibration ID and servings must preserve the 2 3 4 mapping`);
    }
    if (calibration.status !== 'pending') errors.push(`${label}: status must remain pending in M1`);
    const equipment = asObject(calibration.equipment);
    const measurements = asObject(calibration.measurements);
    const checks = asObject(calibration.acceptance_checks);
    unknownFields(equipment, EQUIPMENT_FIELDS, `${label}.equipment`, errors);
    unknownFields(measurements, MEASUREMENT_FIELDS, `${label}.measurements`, errors);
    unknownFields(checks, ACCEPTANCE_FIELDS, `${label}.acceptance_checks`, errors);
    if (calibration.operator !== null || calibration.performed_at !== null
      || calibration.cornmeal_shape_or_cut !== null || calibration.cornmeal_brand !== null
      || calibration.preparation_water_temperature_c !== null || calibration.wheat_flour_added !== null
      || calibration.fermentation_used !== null || calibration.stew_liquid_level_at_paste !== null
      || calibration.notes !== ''
      || !valuesAreNull(equipment, EQUIPMENT_FIELDS)
      || !valuesAreNull(measurements, MEASUREMENT_FIELDS)
      || !valuesAreNull(checks, ACCEPTANCE_FIELDS)) {
      errors.push(`${label}: pending calibration must remain unfilled`);
    }
  }
}

function validateCapabilityJourneys(value, errors) {
  if (!Array.isArray(value)) {
    errors.push('assessment: capability_journey_cases must be an array');
    return;
  }
  const expectedIds = Array.from({ length:22 }, (_, index) => `ne-cap-j${String(index + 1).padStart(2, '0')}`);
  const ids = value.map(row => asObject(row).journey_id).filter(hasText);
  if (JSON.stringify(ids) !== JSON.stringify(expectedIds)) {
    errors.push('capability journey_id must match ne-cap-j01 through ne-cap-j22');
  }
  for (const [index, journeyValue] of value.entries()) {
    const journey = asObject(journeyValue);
    const label = hasText(journey.journey_id) ? journey.journey_id : `capability journey ${index}`;
    if (!isObject(journeyValue)) {
      errors.push(`${label}: capability journey must be an object`);
      continue;
    }
    unknownFields(journey, CAPABILITY_JOURNEY_FIELDS, label, errors);
    if (!CAPABILITY_MODES.has(journey.mode)) errors.push(`${label}: mode is invalid`);
    if (!CAPABILITY_INTENTS.has(journey.intent)) errors.push(`${label}: intent is invalid`);
    if (!Number.isInteger(journey.servings) || journey.servings < 1) errors.push(`${label}: servings must be a positive integer`);
    const raw = textArray(journey.raw_items, `${label}: raw_items`, errors);
    textArray(journey.dislikes, `${label}: dislikes`, errors, { nonEmpty:false });
    const used = textArray(journey.expected_used_items, `${label}: expected_used_items`, errors, { nonEmpty:false });
    const unplanned = textArray(journey.expected_unplanned_items, `${label}: expected_unplanned_items`, errors, { nonEmpty:false });
    if (used.some(item => unplanned.includes(item))) errors.push(`${label}: used and unplanned items must not overlap`);
    if (JSON.stringify([...used, ...unplanned].sort()) !== JSON.stringify([...raw].sort())) {
      errors.push(`${label}: expected used and unplanned items must partition raw_items`);
    }
    if (journey.m1_runtime_expectation !== 'template_not_runtime_eligible') {
      errors.push(`${label}: m1_runtime_expectation must remain template_not_runtime_eligible`);
    }
    if (!M2_OUTCOMES.has(journey.m2_expected_outcome)) errors.push(`${label}: m2_expected_outcome is invalid`);
    if (journey.expected_template_id !== null && !hasText(journey.expected_template_id)) {
      errors.push(`${label}: expected_template_id must be null or a non-empty string`);
    }
    if (['complete', 'ready'].includes(journey.m2_expected_outcome) && used.length === 0) {
      errors.push(`${label}: complete or ready journey requires expected_used_items`);
    }
    if (['complete', 'ready'].includes(journey.m2_expected_outcome)
      && journey.expected_template_id !== 'stew-with-staple-pot') {
      errors.push(`${label}: successful journey must name stew-with-staple-pot`);
    }
    if (['complete', 'ready'].includes(journey.m2_expected_outcome)) {
      if (journey.expected_reason_code !== null) errors.push(`${label}: successful journey reason must be null`);
    } else if (!hasText(journey.expected_reason_code)) {
      errors.push(`${label}: rejected or boundary journey requires expected_reason_code`);
    }
    const assertions = textArray(journey.assertion_codes, `${label}: assertion_codes`, errors);
    if (journey.m2_expected_outcome === 'model_contract_violation'
      && !assertions.some(code => code.startsWith('model_violation_'))) {
      errors.push(`${label}: model_contract_violation journey requires a model violation assertion`);
    }
    const expectedSignature = CAPABILITY_JOURNEY_SIGNATURES.get(journey.journey_id);
    const actualSignature = [
      journey.mode,
      journey.intent,
      journey.servings,
      journey.raw_items,
      journey.dislikes,
      journey.m1_runtime_expectation,
      journey.m2_expected_outcome,
      journey.expected_template_id,
      journey.expected_used_items,
      journey.expected_unplanned_items,
      journey.expected_reason_code,
      journey.assertion_codes,
    ];
    if (expectedSignature && JSON.stringify(actualSignature) !== JSON.stringify(expectedSignature)) {
      errors.push(`${label}: capability journey semantics do not match the approved M1 contract`);
    }
  }
}

export function validateNortheastStewResearch({ assessment, regionalAtlas, regionalResearch, taxonomy } = {}) {
  if (!isObject(assessment)) return ['assessment must be an object'];
  const errors = [];
  unknownFields(assessment, ROOT_FIELDS, 'assessment', errors);
  if (assessment.schema_version !== 2) errors.push('assessment: schema_version must be 2');
  if (assessment.assessment_version !== 'northeast-stew-research-v1-20260727-m3') errors.push('assessment: assessment_version is invalid');
  if (assessment.region_id !== 'northeast') errors.push('assessment: region_id must be northeast');
  if (assessment.family_id !== 'stew-with-staple') errors.push('assessment: family_id must be stew-with-staple');
  const provinces = textArray(assessment.province_codes, 'assessment: province_codes', errors);
  exactSet(provinces, EXPECTED_PROVINCE_CODES, 'province_codes', errors);

  const atlasRegions = new Set(asArray(regionalAtlas?.regions).map(row => asObject(row).region_id));
  const atlasProvinces = new Set(asArray(regionalAtlas?.province_nodes).map(row => asObject(row).atlas_code));
  if (!atlasRegions.has('northeast')) errors.push('regional atlas is missing northeast');
  for (const code of EXPECTED_PROVINCE_CODES) if (!atlasProvinces.has(code)) errors.push(`regional atlas is missing ${code}`);

  const researchIds = new Set(asArray(regionalResearch?.entries).map(row => asObject(row).atlas_id).filter(hasText));
  for (const id of EXPECTED_ATLAS_IDS) if (!researchIds.has(id)) errors.push(`regional research is missing ${id}`);

  const sources = asArray(assessment.source_refs);
  if (!Array.isArray(assessment.source_refs)) errors.push('assessment: source_refs must be an array');
  validateSources(sources, errors);
  const sourceById = new Map(sources.filter(isObject).map(source => [source.source_id, source]));

  const prototypes = asArray(assessment.prototypes);
  if (!Array.isArray(assessment.prototypes)) errors.push('assessment: prototypes must be an array');
  const prototypeIds = prototypes.map(row => asObject(row).atlas_id).filter(hasText);
  if (new Set(prototypeIds).size !== prototypeIds.length) errors.push('prototype atlas_id must be unique');
  exactSet(prototypeIds, EXPECTED_ATLAS_IDS, 'prototype atlas_id', errors);
  for (const [index, prototype] of prototypes.entries()) validatePrototype(prototype, index, sourceById, errors);

  validateFamilyModel(assessment.family_model, new Set(sourceById.keys()), errors);
  validateJourneys(assessment.journey_cases, errors);
  validateMachineRuleCandidates(
    assessment.machine_rule_candidates,
    taxonomy,
    new Set(sourceById.keys()),
    assessment.calibration_cases,
    errors,
  );
  validateCalibrationCases(assessment.calibration_cases, errors);
  validateCapabilityJourneys(assessment.capability_journey_cases, errors);
  return errors;
}

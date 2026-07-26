const asArray = value => Array.isArray(value) ? value : [];
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value);
const isHttpsUrl = value => {
  if (!hasText(value)) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && hasText(parsed.hostname);
  } catch {
    return false;
  }
};
const exact = (actual, expected) => actual.length === expected.length && actual.every((value, index) => value === expected[index]);
const sameKeys = (value, keys) => isObject(value) && exact(Object.keys(value).sort(), [...keys].sort());

const LEDGER_VERSION = 'northeast-stew-numeric-evidence-v1-20260727-m2';
const PAPER_URL = 'https://www.spgykj.com/cn/article/doi/10.13386/j.issn1002-0306.2024110136';
const PAPER_DOI = '10.13386/j.issn1002-0306.2024110136';
const SOURCE_IDS = [
  'jiang-2025-whole-cornmeal-paper',
  'jessica-hot-water-cornbread-2024',
  'xiachufang-pot-edge-2021',
  'xiachufang-ribs-beans-2020',
  'meishichina-ribs-beans-2016',
];
const CALIBRATION_IDS = ['ne-cal-2', 'ne-cal-3', 'ne-cal-4'];
const TOP_LEVEL_FIELDS = ['schema_version', 'ledger_version', 'scope', 'sources', 'rules', 'calibration_case_ids'];
const SOURCE_FIELDS = ['source_id', 'title', 'url', 'doi', 'publisher', 'author', 'published_at', 'retrieved_at', 'rights_or_license', 'source_type', 'classification', 'independence_group', 'ingredient_state', 'numeric_observations', 'cannot_prove'];
const INGREDIENT_STATE_FIELDS = ['cornmeal', 'wheat_flour', 'fermentation', 'cooking_method'];
const OBSERVATION_FIELDS = ['metric', 'value', 'min', 'max', 'unit', 'basis'];
const OBSERVATION_UNITS = new Map([
  ['water_per_100g_cornmeal_ml', 'mL water per 100 g cornmeal'],
  ['water_temperature_c', 'C'],
  ['dough_water_g', 'g'],
  ['main_braise_minutes', 'min'],
  ['pre_paste_additional_braise_minutes', 'min'],
  ['total_water_g', 'g'],
  ['braise_minutes', 'min'],
]);
const RULE_FIELDS = ['rule_id', 'decision_status', 'candidate_source_ids', 'qualified_source_ids', 'blocking_reasons'];
const CALIBRATION_FIELDS = [
  'calibration_id', 'servings', 'status', 'operator', 'performed_at', 'cornmeal_shape_or_cut',
  'cornmeal_brand', 'preparation_water_temperature_c', 'wheat_flour_added', 'fermentation_used',
  'stew_liquid_level_at_paste', 'equipment', 'measurements', 'acceptance_checks', 'notes',
];
const EQUIPMENT_FIELDS = ['pot_diameter_cm', 'pot_depth_cm', 'lid_fit_confirmed'];
const MEASUREMENT_FIELDS = ['cornmeal_grams', 'preparation_water_grams', 'stew_water_grams', 'steam_minutes'];
const ACCEPTANCE_FIELDS = ['dough_holds_shape', 'center_cooked_through', 'cake_above_liquid', 'cake_holds_together', 'pot_not_scorched', 'pork_endpoint_reached', 'beans_endpoint_reached'];
const EXPECTED_RULES = [
  {
    rule_id: 'cornmeal-flour-to-dough-v1',
    candidate_source_ids: ['jiang-2025-whole-cornmeal-paper', 'jessica-hot-water-cornbread-2024'],
    blocking_reasons: ['no_qualified_same_state_source', 'calibration_2_3_4_servings_pending'],
  },
  {
    rule_id: 'stew-with-corn-cake-liquid-v1',
    candidate_source_ids: ['xiachufang-pot-edge-2021', 'xiachufang-ribs-beans-2020', 'meishichina-ribs-beans-2016'],
    blocking_reasons: ['no_qualified_same_state_source', 'cross_source_liquid_and_time_synthesis_forbidden', 'calibration_2_3_4_servings_pending'],
  },
];

function requireExactFields(errors, label, value, fields) {
  if (!sameKeys(value, fields)) errors.push(`${label} has unexpected fields or is missing required fields`);
}

export function validateNortheastStewNumericEvidence(ledger, calibrationCases) {
  if (!isObject(ledger)) return ['numeric evidence ledger must be an object'];
  const errors = [];
  requireExactFields(errors, 'ledger', ledger, TOP_LEVEL_FIELDS);
  if (ledger.schema_version !== 1) errors.push('schema_version must be 1');
  if (ledger.ledger_version !== LEDGER_VERSION) errors.push(`ledger_version must be ${LEDGER_VERSION}`);
  if (ledger.scope !== 'research_only') errors.push('scope must be research_only');
  if (!exact(asArray(ledger.calibration_case_ids), CALIBRATION_IDS)) errors.push('calibration_case_ids must be exactly ne-cal-2 ne-cal-3 and ne-cal-4');

  const sources = asArray(ledger.sources);
  if (!exact(sources.map(source => source?.source_id), SOURCE_IDS)) errors.push('sources must use the fixed five source IDs in order');
  for (const [index, source] of sources.entries()) {
    const label = `sources[${index}]`;
    requireExactFields(errors, label, source, SOURCE_FIELDS);
    if (!isObject(source)) continue;
    for (const field of ['source_id', 'title', 'url', 'publisher', 'author', 'published_at', 'retrieved_at', 'rights_or_license', 'source_type', 'classification', 'independence_group']) {
      if (!hasText(source[field])) errors.push(`${label}.${field} must be a non-empty string`);
    }
    if (!isHttpsUrl(source.url)) errors.push(`${label}.url must be a valid HTTPS URL`);
    if (source.source_type === 'paper' && (source.doi !== PAPER_DOI || source.url !== PAPER_URL)) errors.push(`${label}: paper must retain an official article URL and DOI`);
    if (source.source_type !== 'paper' && source.doi !== null) errors.push(`${label}: non-paper doi must be null`);
    if (source.classification === 'qualified_same_state') errors.push(`${label}: qualified_same_state is not permitted in this acquisition`);
    if (source.source_type === 'paper' && source.classification !== 'calibration_start_only') errors.push(`${label}: paper must be calibration_start_only`);
    if (source.source_type !== 'paper' && source.classification !== 'boundary_only') errors.push(`${label}: non-paper source must be boundary_only`);
    requireExactFields(errors, `${label}.ingredient_state`, source.ingredient_state, INGREDIENT_STATE_FIELDS);
    for (const key of INGREDIENT_STATE_FIELDS) if (!hasText(source.ingredient_state?.[key])) errors.push(`${label}.ingredient_state.${key} must be a non-empty string`);
    if (!asArray(source.numeric_observations).length) errors.push(`${label}.numeric_observations must be non-empty`);
    for (const [observationIndex, observation] of asArray(source.numeric_observations).entries()) {
      const observationLabel = `${label}.numeric_observations[${observationIndex}]`;
      requireExactFields(errors, observationLabel, observation, OBSERVATION_FIELDS);
      if (!isObject(observation)) {
        errors.push(`${observationLabel} is invalid`);
        continue;
      }
      const rangeValid = isFiniteNumber(observation.min) && isFiniteNumber(observation.max) && observation.min >= 0 && observation.min <= observation.max;
      const valueValid = observation.value === null || isFiniteNumber(observation.value);
      if (!hasText(observation.metric) || !hasText(observation.unit) || !hasText(observation.basis) || !rangeValid || !valueValid) errors.push(`${observationLabel} is invalid`);
      if (!OBSERVATION_UNITS.has(observation.metric)) errors.push(`${observationLabel}.metric is not recognized`);
      else if (observation.unit !== OBSERVATION_UNITS.get(observation.metric)) errors.push(`${observationLabel}.unit does not match metric`);
      if (rangeValid && isFiniteNumber(observation.value) && (observation.value < observation.min || observation.value > observation.max)) errors.push(`${observationLabel}.value must fall within min and max`);
    }
    if (!asArray(source.cannot_prove).length || asArray(source.cannot_prove).some(value => !hasText(value))) errors.push(`${label}.cannot_prove must be a non-empty text list`);
  }
  if (sources[2]?.independence_group !== 'xiachufang' || sources[3]?.independence_group !== 'xiachufang') errors.push('xiachufang sources must share the platform independence_group');

  const rules = asArray(ledger.rules);
  if (!exact(rules.map(rule => rule?.rule_id), EXPECTED_RULES.map(rule => rule.rule_id))) errors.push('rules must be exactly the two fixed numeric rule IDs in order');
  for (const [index, expected] of EXPECTED_RULES.entries()) {
    const rule = rules[index];
    const label = `rules[${index}]`;
    requireExactFields(errors, label, rule, RULE_FIELDS);
    if (!isObject(rule)) continue;
    if (!sameKeys(rule, RULE_FIELDS)) errors.push(`${label}: production defaults are forbidden`);
    if (!exact(asArray(rule.candidate_source_ids), expected.candidate_source_ids)) errors.push(`${label} must use exact candidate_source_ids without duplicates`);
    if (rule.decision_status !== 'blocked') errors.push(`${label} requires two independent qualified_same_state sources before any non-blocked decision`);
    if (!exact(asArray(rule.qualified_source_ids), [])) errors.push(`${label}.qualified_source_ids must remain empty for this acquisition`);
    if (!exact(asArray(rule.blocking_reasons), expected.blocking_reasons)) errors.push(`${label}.blocking_reasons must remain the exact blocked reasons`);
  }

  const cases = asArray(calibrationCases);
  if (!exact(cases.map(row => row?.calibration_id), CALIBRATION_IDS) || !exact(cases.map(row => row?.servings), [2, 3, 4])) errors.push('authoritative calibration cases must be exactly ne-cal-2 ne-cal-3 and ne-cal-4');
  for (const [index, row] of cases.entries()) {
    const label = `authoritative calibration_cases[${index}]`;
    requireExactFields(errors, label, row, CALIBRATION_FIELDS);
    if (!isObject(row)) continue;
    if (row.status !== 'pending') errors.push(`${label}.status must remain pending`);
    if (row.operator !== null || row.performed_at !== null || row.cornmeal_shape_or_cut !== null
      || row.cornmeal_brand !== null || row.preparation_water_temperature_c !== null
      || row.wheat_flour_added !== null || row.fermentation_used !== null
      || row.stew_liquid_level_at_paste !== null) errors.push(`${label} pending calibration identity fields must remain blank`);
    if (row.notes !== '') errors.push(`${label} pending calibration notes must be empty`);
    requireExactFields(errors, `${label}.equipment`, row.equipment, EQUIPMENT_FIELDS);
    requireExactFields(errors, `${label}.measurements`, row.measurements, MEASUREMENT_FIELDS);
    requireExactFields(errors, `${label}.acceptance_checks`, row.acceptance_checks, ACCEPTANCE_FIELDS);
    if (Object.values(row.equipment || {}).some(value => value !== null) || Object.values(row.measurements || {}).some(value => value !== null) || Object.values(row.acceptance_checks || {}).some(value => value !== null)) errors.push(`${label} pending calibration values must remain blank`);
  }
  return errors;
}

export function assertNortheastStewNumericEvidence(ledger, calibrationCases) {
  const errors = validateNortheastStewNumericEvidence(ledger, calibrationCases);
  if (errors.length) throw new Error(`Northeast numeric evidence validation failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  return ledger;
}

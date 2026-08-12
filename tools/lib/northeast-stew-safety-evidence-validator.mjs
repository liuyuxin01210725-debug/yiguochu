const asArray = value => Array.isArray(value) ? value : [];
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const exact = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);
const sameKeys = (value, fields) => isObject(value)
  && exact(Object.keys(value).sort(), [...fields].sort());

const LEDGER_VERSION = 'northeast-stew-safety-evidence-v1-20260727-m3';
const TOP_FIELDS = ['schema_version', 'ledger_version', 'scope', 'sources', 'rules', 'calibration_admission'];
const SOURCE_FIELDS = [
  'source_id', 'title', 'url', 'publisher', 'author', 'published_at', 'retrieved_at',
  'rights_or_license', 'source_type', 'classification', 'applies_to_canonical_ids',
  'endpoint_summary', 'cannot_prove',
];
const RULE_FIELDS = [
  'rule_id', 'branch_id', 'decision_status', 'applies_to_canonical_ids', 'source_ids',
  'all_of', 'method_constraints', 'cannot_prove',
];
const ENDPOINT_FIELDS = ['metric', 'operator', 'value', 'unit', 'measurement'];
const ADMISSION_FIELDS = [
  'status', 'eligible_calibration_case_ids', 'satisfied_safety_rule_ids',
  'remaining_blockers', 'production_activation_allowed',
];

const SOURCE_SPECS = [
  {
    source_id: 'foodsafety-gov-pork-ribs-2023',
    url: 'https://www.foodsafety.gov/print/pdf/node/13?id=beef-lamb-veal-roasting',
    source_type: 'official_safety_chart',
    classification: 'direct_official_endpoint',
    applies_to_canonical_ids: ['pork-ribs'],
  },
  {
    source_id: 'hubei-wjw-green-beans-2021',
    url: 'https://wjw.hubei.gov.cn/bmdt/jkhb/spyy/202105/t20210525_3555672.shtml',
    source_type: 'official_public_health_guidance',
    classification: 'direct_official_method_endpoint',
    applies_to_canonical_ids: ['green-beans'],
  },
  {
    source_id: 'hainan-amr-oil-beans-2017',
    url: 'https://amr.hainan.gov.cn/zw/xfts/201703/t20170309_1589724.html',
    source_type: 'official_consumer_safety_guidance',
    classification: 'direct_official_qualitative_endpoint',
    applies_to_canonical_ids: ['oil-beans'],
  },
];

const RULE_SPECS = [
  {
    rule_id: 'pork-ribs-safe-endpoint-v1',
    branch_id: 'pork_ribs',
    applies_to_canonical_ids: ['pork-ribs'],
    source_ids: ['foodsafety-gov-pork-ribs-2023'],
    all_of: [
      { metric: 'internal_temperature_c', operator: '>=', value: 63, unit: 'C', measurement: 'thickest edible meat portion, measured away from bone' },
      { metric: 'rest_time_minutes', operator: '>=', value: 3, unit: 'min', measurement: 'after removal from the heat source before carving or eating' },
    ],
  },
  {
    rule_id: 'green-beans-fully-cooked-v1',
    branch_id: 'green_beans',
    applies_to_canonical_ids: ['green-beans'],
    source_ids: ['hubei-wjw-green-beans-2021'],
    all_of: [
      { metric: 'covered_simmer_temperature_c', operator: '>=', value: 100, unit: 'C', measurement: 'covered low simmer in the documented household method' },
      { metric: 'covered_simmer_minutes', operator: '>', value: 10, unit: 'min', measurement: 'continuous covered low simmer after adding water' },
      { metric: 'even_heating_confirmed', operator: '==', value: true, unit: 'boolean', measurement: 'all pods turned during cooking and no crowded cold spots' },
      { metric: 'raw_green_absent', operator: '==', value: true, unit: 'boolean', measurement: 'all pods have lost the original raw green appearance' },
      { metric: 'bean_smell_absent', operator: '==', value: true, unit: 'boolean', measurement: 'no raw bean odor remains' },
    ],
  },
  {
    rule_id: 'oil-beans-fully-cooked-v1',
    branch_id: 'green_beans',
    applies_to_canonical_ids: ['oil-beans'],
    source_ids: ['hainan-amr-oil-beans-2017'],
    all_of: [
      { metric: 'pod_limp', operator: '==', value: true, unit: 'boolean', measurement: 'pods have changed from upright or stiff to limp' },
      { metric: 'dark_green_reached', operator: '==', value: true, unit: 'boolean', measurement: 'pod color has changed from bright green to dark green' },
      { metric: 'bean_smell_absent', operator: '==', value: true, unit: 'boolean', measurement: 'no raw bean odor remains' },
      { metric: 'fully_cooked_confirmed', operator: '==', value: true, unit: 'boolean', measurement: 'oil beans were fully cooked after the preliminary boiling endpoint; short high-heat cooking is forbidden' },
    ],
  },
];

const EXPECTED_BRANCHES = new Map([
  ['chicken', ['unresearched', []]],
  ['pork_ribs', ['calibration_ready', ['pork-ribs-safe-endpoint-v1']]],
  ['fish', ['unresearched', []]],
  ['green_beans', ['calibration_ready', ['green-beans-fully-cooked-v1', 'oil-beans-fully-cooked-v1']]],
]);
const CALIBRATION_IDS = ['ne-cal-2', 'ne-cal-3', 'ne-cal-4'];
const REMAINING_BLOCKERS = [
  'numeric_ratio_rules_blocked', 'calibration_2_3_4_servings_pending', 'template_not_runtime_eligible',
];

function exactFields(errors, label, value, fields) {
  if (!sameKeys(value, fields)) errors.push(`${label} has unexpected fields or is missing required fields`);
}

function validHttps(value) {
  if (!hasText(value)) return false;
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

export function validateNortheastStewSafetyEvidence({ ledger, research, taxonomy } = {}) {
  if (!isObject(ledger)) return ['safety evidence ledger must be an object'];
  const errors = [];
  exactFields(errors, 'ledger', ledger, TOP_FIELDS);
  if (ledger.schema_version !== 1) errors.push('schema_version must be 1');
  if (ledger.ledger_version !== LEDGER_VERSION) errors.push(`ledger_version must be ${LEDGER_VERSION}`);
  if (ledger.scope !== 'research_only') errors.push('scope must be research_only');

  const taxonomyById = new Map(asArray(taxonomy?.items).map(item => [item?.canonical_id, item]));
  const sources = asArray(ledger.sources);
  if (!exact(sources.map(source => source?.source_id), SOURCE_SPECS.map(source => source.source_id))) errors.push('sources must use the exact three approved source IDs in order');
  for (const [index, expected] of SOURCE_SPECS.entries()) {
    const source = sources[index];
    const label = `sources[${index}]`;
    exactFields(errors, label, source, SOURCE_FIELDS);
    if (!isObject(source)) continue;
    for (const field of ['source_id', 'title', 'url', 'publisher', 'author', 'published_at', 'retrieved_at', 'rights_or_license', 'source_type', 'classification', 'endpoint_summary']) {
      if (!hasText(source[field])) errors.push(`${label}.${field} must be a non-empty string`);
    }
    if (!validHttps(source.url)) errors.push(`${label}.url must be a valid HTTPS URL`);
    if (source.url !== expected.url) errors.push(`${label} must retain the exact official source URL`);
    if (source.source_type !== expected.source_type || source.classification !== expected.classification) errors.push(`${label} source type and classification must match the approved official evidence`);
    if (!exact(source.applies_to_canonical_ids, expected.applies_to_canonical_ids)) errors.push(`${label} must retain exact canonical scope`);
    for (const canonicalId of asArray(source.applies_to_canonical_ids)) if (!taxonomyById.has(canonicalId)) errors.push(`${label} references unknown taxonomy item ${canonicalId}`);
    if (!asArray(source.cannot_prove).length || source.cannot_prove.some(item => !hasText(item))) errors.push(`${label}.cannot_prove must be a non-empty text list`);
  }

  const sourceIds = new Set(sources.map(source => source?.source_id));
  const rules = asArray(ledger.rules);
  if (!exact(rules.map(rule => rule?.rule_id), RULE_SPECS.map(rule => rule.rule_id))) errors.push('rules must use the exact three approved rule IDs in order');
  for (const [index, expected] of RULE_SPECS.entries()) {
    const rule = rules[index];
    const label = `rules[${index}] ${expected.rule_id}`;
    exactFields(errors, label, rule, RULE_FIELDS);
    if (!isObject(rule)) continue;
    if (rule.decision_status !== 'calibration_ready') errors.push(`${label}.decision_status must be calibration_ready`);
    if (rule.branch_id !== expected.branch_id) errors.push(`${label}.branch_id is invalid`);
    if (!exact(rule.applies_to_canonical_ids, expected.applies_to_canonical_ids)) errors.push(`${label} must retain exact canonical scope`);
    if (!exact(rule.source_ids, expected.source_ids) || rule.source_ids.some(id => !sourceIds.has(id))) errors.push(`${label}.source_ids must match direct official evidence`);
    if (!exact(rule.all_of, expected.all_of)) {
      if (expected.rule_id === 'pork-ribs-safe-endpoint-v1') errors.push('pork-ribs rule must retain the exact approved endpoints at 63 C and 3 minutes');
      else if (expected.rule_id === 'green-beans-fully-cooked-v1') errors.push('green-beans rule must retain exact approved endpoints including more than 10 minutes');
      else errors.push('oil-beans rule must retain exact approved endpoints without an invented minute value');
    }
    for (const [endpointIndex, endpoint] of asArray(rule.all_of).entries()) {
      exactFields(errors, `${label}.all_of[${endpointIndex}]`, endpoint, ENDPOINT_FIELDS);
      if (!isObject(endpoint) || !hasText(endpoint.metric) || !hasText(endpoint.operator) || !hasText(endpoint.unit) || !hasText(endpoint.measurement)) errors.push(`${label}.all_of[${endpointIndex}] is invalid`);
    }
    if (!asArray(rule.method_constraints).length || rule.method_constraints.some(item => !hasText(item))) errors.push(`${label}.method_constraints must be a non-empty text list`);
    if (!asArray(rule.cannot_prove).length || rule.cannot_prove.some(item => !hasText(item))) errors.push(`${label}.cannot_prove must be a non-empty text list`);
  }

  const branches = asArray(research?.family_model?.safety_branches);
  const branchById = new Map(branches.map(branch => [branch?.branch_id, branch]));
  for (const [branchId, [status, ruleIds]] of EXPECTED_BRANCHES) {
    const branch = branchById.get(branchId);
    if (!branch) errors.push(`research safety branch ${branchId} is missing`);
    else {
      if (branch.evidence_status !== status) errors.push(`research safety branch ${branchId} must be ${status}`);
      if (!exact(branch.safety_rule_ids, ruleIds)) errors.push(`research safety branch ${branchId} must reference exact approved safety rules`);
    }
  }
  if (!exact([...branchById.keys()], [...EXPECTED_BRANCHES.keys()])) errors.push('research safety branches must remain the exact approved branch set and order');

  for (const [canonicalId, endpointCode] of [
    ['pork-ribs', 'pork_fully_cooked'], ['green-beans', 'bean_fully_cooked'], ['oil-beans', 'bean_fully_cooked'],
  ]) {
    const item = taxonomyById.get(canonicalId);
    if (!item || !asArray(item.cooking_risk?.required_endpoint_codes).includes(endpointCode)) errors.push(`${canonicalId} taxonomy must retain ${endpointCode}`);
  }

  const cases = asArray(research?.calibration_cases);
  if (!exact(cases.map(row => row?.calibration_id), CALIBRATION_IDS)) errors.push('calibration cases must remain ne-cal-2 ne-cal-3 and ne-cal-4');
  for (const row of cases) {
    if (row?.status !== 'pending') errors.push(`${row?.calibration_id || 'calibration'} must remain pending`);
    if (Object.values(row?.measurements || {}).some(value => value !== null)) errors.push(`${row?.calibration_id || 'calibration'} measurements must remain blank`);
    if (Object.values(row?.acceptance_checks || {}).some(value => value !== null)) errors.push(`${row?.calibration_id || 'calibration'} acceptance checks must remain blank`);
  }

  const admission = ledger.calibration_admission;
  exactFields(errors, 'calibration_admission', admission, ADMISSION_FIELDS);
  if (admission?.status !== 'ready_for_kitchen_calibration') errors.push('calibration_admission.status must be ready_for_kitchen_calibration');
  if (!exact(admission?.eligible_calibration_case_ids, CALIBRATION_IDS)) errors.push('calibration admission must reference exact calibration cases');
  if (!exact(admission?.satisfied_safety_rule_ids, RULE_SPECS.map(rule => rule.rule_id))) errors.push('calibration admission must reference all approved safety rules');
  if (!exact(admission?.remaining_blockers, REMAINING_BLOCKERS)) errors.push('calibration admission must retain all non-safety blockers');
  if (admission?.production_activation_allowed !== false) errors.push('production activation must remain forbidden');
  return errors;
}

export function assertNortheastStewSafetyEvidence(inputs) {
  const errors = validateNortheastStewSafetyEvidence(inputs);
  if (errors.length) throw new Error(`Northeast safety evidence validation failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  return inputs.ledger;
}

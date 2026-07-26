const EXPECTED_REGION_IDS = [
  'northeast', 'jingjinji', 'jinmeng', 'shandong', 'central_plains',
  'middle_yangtze', 'jiangnan', 'fujian_taiwan', 'lingnan_hk_macao',
  'sichuan_chongqing', 'yunnan_guizhou', 'northwest', 'qinghai_tibet',
];

const EXPECTED_PROVINCE_CODES = [
  'CN-AH', 'CN-BJ', 'CN-CQ', 'CN-FJ', 'CN-GD', 'CN-GS', 'CN-GX', 'CN-GZ',
  'CN-HA', 'CN-HB', 'CN-HE', 'CN-HI', 'CN-HK', 'CN-HL', 'CN-HN', 'CN-JL',
  'CN-JS', 'CN-JX', 'CN-LN', 'CN-MO', 'CN-NM', 'CN-NX', 'CN-QH', 'CN-SC',
  'CN-SD', 'CN-SH', 'CN-SN', 'CN-SX', 'CN-TJ', 'CN-TW', 'CN-XJ', 'CN-XZ',
  'CN-YN', 'CN-ZJ',
];

const EXPECTED_TECHNIQUE_IDS = [
  'raw-rice-braise', 'cooked-rice-stir', 'cooked-rice-stew', 'grain-porridge',
  'noodle-braise', 'noodle-steam-braise', 'noodle-broth', 'stew-with-staple',
  'claypot-rice', 'glutinous-mixed-rice', 'vessel-adapted-rice',
  'family-pot-with-absorbent-staple',
];

const ROOT_FIELDS = new Set([
  'schema_version', 'catalog_version', 'regions', 'province_nodes',
  'technique_families', 'cultural_overlays',
]);
const REGION_FIELDS = new Set(['region_id', 'name', 'province_codes', 'research_focus', 'status']);
const PROVINCE_FIELDS = new Set(['atlas_code', 'name', 'region_id', 'status', 'research_question', 'defer_reason']);
const TECHNIQUE_FIELDS = new Set(['family_id', 'name', 'staple_states', 'research_question', 'status']);
const OVERLAY_FIELDS = new Set(['overlay_id', 'name', 'target_province_codes', 'research_question', 'status']);

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const asArray = value => Array.isArray(value) ? value : [];

function checkUnknownFields(row, allowed, label, errors) {
  if (!isObject(row)) return;
  for (const field of Object.keys(row)) {
    if (!allowed.has(field)) errors.push(`${label}: ${field} is not allowed`);
  }
}
function checkTextArray(value, label, errors, { allowEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array`);
    return [];
  }
  if (!allowEmpty && value.length === 0) errors.push(`${label} must be non-empty`);
  if (!value.every(hasText)) errors.push(`${label} items must be non-empty strings`);
  return value;
}

function checkExactSet(actual, expected, label, errors) {
  const sorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  if (JSON.stringify(sorted) !== JSON.stringify(expectedSorted)) {
    errors.push(`${label} must match the approved phase-zero set`);
  }
}

export function validateRegionalAtlas(catalog) {
  if (!isObject(catalog)) return ['catalog must be an object'];
  const errors = [];
  checkUnknownFields(catalog, ROOT_FIELDS, 'catalog', errors);
  if (catalog.schema_version !== 2) errors.push('catalog: schema_version must be 2');
  if (catalog.catalog_version !== 'regional-atlas-v2-20260726') {
    errors.push('catalog: catalog_version must be regional-atlas-v2-20260726');
  }

  const regions = asArray(catalog.regions);
  const provinces = asArray(catalog.province_nodes);
  const techniques = asArray(catalog.technique_families);
  const overlays = asArray(catalog.cultural_overlays);
  if (!Array.isArray(catalog.regions)) errors.push('catalog: regions must be an array');
  if (!Array.isArray(catalog.province_nodes)) errors.push('catalog: province_nodes must be an array');
  if (!Array.isArray(catalog.technique_families)) errors.push('catalog: technique_families must be an array');
  if (!Array.isArray(catalog.cultural_overlays)) errors.push('catalog: cultural_overlays must be an array');
  if (regions.length !== 13) errors.push('catalog: regions must contain exactly 13 items');
  if (provinces.length !== 34) errors.push('catalog: province_nodes must contain exactly 34 items');
  if (techniques.length !== 12) errors.push('catalog: technique_families must contain exactly 12 items');

  const regionIds = [];
  for (const [index, row] of regions.entries()) {
    const label = isObject(row) && hasText(row.region_id) ? row.region_id : `region ${index}`;
    if (!isObject(row)) {
      errors.push(`${label}: region must be an object`);
      continue;
    }
    checkUnknownFields(row, REGION_FIELDS, label, errors);
    if (!hasText(row.region_id)) errors.push(`${label}: region_id must be a non-empty string`);
    if (!hasText(row.name)) errors.push(`${label}: name must be a non-empty string`);
    checkTextArray(row.province_codes, `${label}: province_codes`, errors);
    checkTextArray(row.research_focus, `${label}: research_focus`, errors);
    if (row.status !== 'skeleton_only') errors.push(`${label}: status must be skeleton_only`);
    regionIds.push(row.region_id);
  }
  if (new Set(regionIds).size !== regionIds.length) errors.push('region_id must be unique');
  checkExactSet(regionIds, EXPECTED_REGION_IDS, 'region_id set', errors);
  const knownRegions = new Set(regionIds.filter(hasText));

  const provinceCodes = [];
  const provincesByRegion = new Map(EXPECTED_REGION_IDS.map(id => [id, []]));
  for (const [index, row] of provinces.entries()) {
    const label = isObject(row) && hasText(row.atlas_code) ? row.atlas_code : `province ${index}`;
    if (!isObject(row)) {
      errors.push(`${label}: province must be an object`);
      continue;
    }
    checkUnknownFields(row, PROVINCE_FIELDS, label, errors);
    if (!hasText(row.atlas_code)) errors.push(`${label}: atlas_code must be a non-empty string`);
    if (!hasText(row.name)) errors.push(`${label}: name must be a non-empty string`);
    if (!hasText(row.region_id)) errors.push(`${label}: region_id must be a non-empty string`);
    else if (!knownRegions.has(row.region_id)) errors.push(`${label}: unknown region_id ${row.region_id}`);
    if (row.status !== 'skeleton_only') errors.push(`${label}: status must be skeleton_only`);
    const hasQuestion = hasText(row.research_question);
    const hasDefer = hasText(row.defer_reason);
    if (hasQuestion === hasDefer) errors.push(`${label}: exactly one of research_question or defer_reason is required`);
    provinceCodes.push(row.atlas_code);
    if (provincesByRegion.has(row.region_id)) provincesByRegion.get(row.region_id).push(row.atlas_code);
  }
  if (new Set(provinceCodes).size !== provinceCodes.length) errors.push('province atlas_code must be unique');
  checkExactSet(provinceCodes, EXPECTED_PROVINCE_CODES, 'province atlas_code set', errors);
  const knownProvinces = new Set(provinceCodes.filter(hasText));

  for (const row of regions) {
    if (!isObject(row) || !hasText(row.region_id) || !Array.isArray(row.province_codes)) continue;
    const actual = [...row.province_codes].sort();
    const derived = [...(provincesByRegion.get(row.region_id) || [])].sort();
    if (JSON.stringify(actual) !== JSON.stringify(derived)) {
      errors.push(`${row.region_id}: province_codes must match province node parents`);
    }
  }

  const techniqueIds = [];
  for (const [index, row] of techniques.entries()) {
    const label = isObject(row) && hasText(row.family_id) ? row.family_id : `technique ${index}`;
    if (!isObject(row)) {
      errors.push(`${label}: technique family must be an object`);
      continue;
    }
    checkUnknownFields(row, TECHNIQUE_FIELDS, label, errors);
    if (!hasText(row.family_id)) errors.push(`${label}: family_id must be a non-empty string`);
    if (!hasText(row.name)) errors.push(`${label}: name must be a non-empty string`);
    checkTextArray(row.staple_states, `${label}: staple_states`, errors);
    if (!hasText(row.research_question)) errors.push(`${label}: research_question must be a non-empty string`);
    if (row.status !== 'skeleton_only') errors.push(`${label}: status must be skeleton_only`);
    techniqueIds.push(row.family_id);
  }
  if (new Set(techniqueIds).size !== techniqueIds.length) errors.push('technique family_id must be unique');
  checkExactSet(techniqueIds, EXPECTED_TECHNIQUE_IDS, 'technique family_id set', errors);

  const overlayIds = [];
  for (const [index, row] of overlays.entries()) {
    const label = isObject(row) && hasText(row.overlay_id) ? row.overlay_id : `overlay ${index}`;
    if (!isObject(row)) {
      errors.push(`${label}: cultural overlay must be an object`);
      continue;
    }
    checkUnknownFields(row, OVERLAY_FIELDS, label, errors);
    if (!hasText(row.overlay_id)) errors.push(`${label}: overlay_id must be a non-empty string`);
    if (!hasText(row.name)) errors.push(`${label}: name must be a non-empty string`);
    const targets = checkTextArray(row.target_province_codes, `${label}: target_province_codes`, errors);
    for (const code of targets) {
      if (!knownProvinces.has(code)) errors.push(`${label}: unknown target province ${code}`);
    }
    if (!hasText(row.research_question)) errors.push(`${label}: research_question must be a non-empty string`);
    if (row.status !== 'skeleton_only') errors.push(`${label}: status must be skeleton_only`);
    overlayIds.push(row.overlay_id);
  }
  if (new Set(overlayIds).size !== overlayIds.length) errors.push('cultural overlay_id must be unique');

  return errors;
}

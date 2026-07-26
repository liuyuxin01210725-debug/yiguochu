const PROVINCES = new Set(['CN-SN', 'CN-GS', 'CN-NX', 'CN-XJ']);
const PRODUCTION = new Set(['shaanbei-red-date-cowpea-rice', 'xinjiang-lamb-pilaf', 'xinjiang-vegetable-pilaf']);
const LEADS = new Set(['xifu-jiaotuan-seasoned-bowl', 'huayin-mashi-pao', 'gansu-heyan-jiumianpian-broth', 'huaining-mixed-grain-jiaotuan', 'ningxia-shengcuan-jiumian-bowl', 'ningxia-rouzhanfan-steamed-rice', 'turpan-soup-rice-technique', 'xinjiang-household-jupianzi-soup']);
const FAMILIES = new Set(['festive-soft-grain-date-bean-braise', 'staged-pilaf-raw-rice', 'noodle-piece-broth-main-bowl', 'stirred-grain-thick-main-bowl', 'pre-saute-meat-vegetable-steamed-rice']);
const BOUNDARIES = new Set(['soft_grain_not_ordinary_rice', 'jiaotuan_not_unattended_appliance', 'huayin_cross_locality_and_single_pot_unproven', 'heyan_ich_not_recipe', 'sanfan_dispute_not_family', 'shengcuan_branches_not_one_recipe', 'rouzhanfan_not_any_meat_rice_braise', 'pilaf_named_branches_not_free_slots', 'turpan_ich_not_recipe']);
const VERDICTS = new Set(['supported', 'not_proven', 'contradicted']);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const array = value => Array.isArray(value) ? value : [];
const text = value => typeof value === 'string' && value.trim().length > 0;
const sameSet = (values, expected) => values.length === expected.size && new Set(values).size === expected.size && values.every(value => expected.has(value));

function validateSources(assessment, errors) {
  const ids = new Set();
  const directions = new Map();
  const rows = array(assessment.source_refs);
  if (!Array.isArray(assessment.source_refs)) errors.push('source_refs must be an array');
  if (rows.length !== 25) errors.push('source_refs must contain exactly 25 items');
  rows.forEach((row, index) => {
    const path = `source_refs[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    for (const field of ['source_id', 'title', 'url', 'publisher', 'published_at', 'retrieved_at', 'source_grade', 'evidence_summary']) if (!text(row[field])) errors.push(`${path}.${field} must be non-empty`);
    if (ids.has(row.source_id)) errors.push(`duplicate source_id ${row.source_id}`);
    ids.add(row.source_id);
    try { if (new URL(row.url).protocol !== 'https:') errors.push(`${path}.url must use HTTPS`); } catch { errors.push(`${path}.url must be valid`); }
    if (row.published_at !== 'undated' && !/^\d{4}-\d{2}-\d{2}$/.test(row.published_at || '')) errors.push(`${path}.published_at must be YYYY-MM-DD or undated`);
    if (row.published_at === 'undated' && !text(row.date_note)) errors.push(`${path}.date_note is required when published_at is undated`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.retrieved_at || '')) errors.push(`${path}.retrieved_at must be YYYY-MM-DD`);
    if (!['A', 'B', 'C'].includes(row.source_grade)) errors.push(`${path}.source_grade is invalid`);
    const entry = {};
    for (const direction of ['proves', 'does_not_prove', 'contradicts']) {
      if (!Array.isArray(row[direction]) || row[direction].some(item => !text(item))) errors.push(`${path}.${direction} must be an array of non-empty strings`);
      entry[direction] = new Set(array(row[direction]));
    }
    directions.set(row.source_id, entry);
  });
  return { ids, directions };
}

function validateClaims(claims, token, path, sourceIds, directions, errors) {
  if (!isObject(claims) || Object.keys(claims).length === 0) { errors.push(`${path} must be a non-empty object`); return; }
  for (const [claimId, claim] of Object.entries(claims)) {
    const claimPath = `${path}.${claimId}`;
    if (!isObject(claim)) { errors.push(`${claimPath} must be an object`); continue; }
    if (!VERDICTS.has(claim.verdict)) errors.push(`${claimPath}.verdict is invalid`);
    if (!text(claim.reason)) errors.push(`${claimPath}.reason must be non-empty`);
    if (!Array.isArray(claim.evidence_source_ids) || claim.evidence_source_ids.length === 0) { errors.push(`${claimPath}.evidence_source_ids must be non-empty`); continue; }
    const direction = claim.verdict === 'supported' ? 'proves' : claim.verdict === 'not_proven' ? 'does_not_prove' : 'contradicts';
    for (const sourceId of claim.evidence_source_ids) {
      if (!sourceIds.has(sourceId)) errors.push(`${claimPath} references unknown source ${sourceId}`);
      else if (!directions.get(sourceId)?.[direction]?.has(`${token}:${claimId}`)) errors.push(`${claimPath} verdict ${claim.verdict} must be reverse-indexed under ${direction} by source ${sourceId}`);
    }
  }
}

function validateRows(rows, idField, expected, tokenPrefix, sourceIds, directions, errors) {
  if (!sameSet(array(rows).filter(isObject).map(row => row[idField]), expected)) errors.push(`${idField === 'recipe_id' ? 'production audit IDs' : 'research lead IDs'} must match the fixed regional baseline`);
  array(rows).forEach((row, index) => {
    const path = `${idField}_rows[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    if (idField === 'lead_id') {
      if (!PROVINCES.has(row.province_code)) errors.push(`${path}.province_code is invalid`);
      if (!FAMILIES.has(row.family_id)) errors.push(`${path}.family_id must reference a fixed family`);
      if (row.production_recipe_id !== null) errors.push('research leads cannot reference a production recipe');
      if (row.candidate_id !== null) errors.push('research leads cannot reference a research candidate');
    }
    for (const sourceId of array(row.source_ids)) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
    validateClaims(row.claims, `${tokenPrefix}:${row[idField]}`, `${path}.claims`, sourceIds, directions, errors);
  });
}

function validateBaseline({ recipeLibrary, regionalResearch, regionalAtlas, regionalMappings }, errors) {
  const region = array(regionalAtlas?.regions).find(row => row?.region_id === 'northwest');
  if (!region || !sameSet(array(region.province_codes), PROVINCES)) errors.push('regional atlas Northwest node must retain the fixed four provinces');
  const recipeIds = new Set(array(recipeLibrary?.recipes).filter(isObject).map(row => row.id));
  for (const id of PRODUCTION) if (!recipeIds.has(id)) errors.push(`missing production recipe ${id}`);
  const mappings = array(regionalMappings?.production_recipe_mappings).filter(row => isObject(row) && array(row.region_ids).includes('northwest'));
  if (!sameSet(mappings.map(row => row.source_id), PRODUCTION)) errors.push('regional production mappings must retain the fixed 3-recipe baseline');
  const candidates = array(regionalMappings?.research_candidate_mappings).filter(row => isObject(row) && array(row.region_ids).includes('northwest'));
  if (candidates.length !== 0) errors.push('regional candidate mappings must remain empty');
  if (!Array.isArray(regionalResearch?.entries)) errors.push('regional research ledger must be an array');
}

export function validateNorthwestOnePotResearch({ assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings } = {}) {
  if (!isObject(assessment)) return ['assessment must be an object'];
  const errors = [];
  if (assessment.schema_version !== 1) errors.push('schema_version must be 1');
  if (assessment.assessment_version !== 'northwest-one-pot-research-v1-20260726') errors.push('assessment_version is invalid');
  if (assessment.region_id !== 'northwest') errors.push('region_id must be northwest');
  if (!sameSet(array(assessment.province_codes), PROVINCES)) errors.push('province_codes must contain CN-SN CN-GS CN-NX CN-XJ');
  const { ids, directions } = validateSources(assessment, errors);
  validateRows(assessment.production_recipe_audits, 'recipe_id', PRODUCTION, 'production', ids, directions, errors);
  if (!Array.isArray(assessment.candidate_audits) || assessment.candidate_audits.length !== 0) errors.push('candidate_audits must remain empty');
  validateRows(assessment.concrete_research_leads, 'lead_id', LEADS, 'lead', ids, directions, errors);
  if (!sameSet(array(assessment.family_model).filter(isObject).map(row => row.family_id), FAMILIES)) errors.push('family IDs must match the fixed regional contract');
  if (array(assessment.family_model).length !== 5) errors.push('family_model must contain exactly 5 items');
  const boundaries = array(assessment.adaptation_boundaries);
  if (!sameSet(boundaries.filter(isObject).map(row => row.boundary_id), BOUNDARIES)) errors.push('adaptation boundary IDs must match the fixed regional contract');
  boundaries.forEach((row, index) => {
    if (!isObject(row)) { errors.push(`adaptation_boundaries[${index}] must be an object`); return; }
    if (row.evidence_status !== 'not_proven') errors.push(`adaptation_boundaries[${index}].evidence_status must remain not_proven`);
    if (!text(row.notes)) errors.push(`adaptation_boundaries[${index}].notes must be non-empty`);
    for (const sourceId of array(row.source_ids)) if (!ids.has(sourceId)) errors.push(`adaptation_boundaries[${index}] references unknown source ${sourceId}`);
  });
  const journeys = array(assessment.journey_cases);
  if (journeys.length !== 16) errors.push('journey_cases must contain exactly 16 items');
  if (!sameSet([...new Set(journeys.filter(isObject).map(row => row.province_code))], PROVINCES)) errors.push('journeys must cover every Northwest province');
  journeys.forEach((row, index) => {
    if (!isObject(row)) { errors.push(`journey_cases[${index}] must be an object`); return; }
    if (row.human_review?.status !== 'pending') errors.push(`journey_cases[${index}].human_review.status must remain pending`);
    for (const familyId of array(row.expected_family_ids)) if (!FAMILIES.has(familyId)) errors.push(`journey_cases[${index}].expected_family_ids contains unknown family ${familyId}`);
  });
  validateBaseline({ recipeLibrary, regionalResearch, regionalAtlas, regionalMappings }, errors);
  return errors;
}

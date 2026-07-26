import { createHash } from 'node:crypto';

const PROVINCES = new Set(['CN-SN', 'CN-GS', 'CN-NX', 'CN-XJ']);
const PRODUCTION = new Set(['shaanbei-red-date-cowpea-rice', 'xinjiang-lamb-pilaf', 'xinjiang-vegetable-pilaf']);
const LEADS = new Set(['xifu-jiaotuan-seasoned-bowl', 'huayin-mashi-pao', 'gansu-heyan-jiumianpian-broth', 'huaining-mixed-grain-jiaotuan', 'ningxia-shengcuan-jiumian-bowl', 'ningxia-rouzhanfan-steamed-rice', 'turpan-soup-rice-technique', 'xinjiang-household-jupianzi-soup']);
const FAMILIES = new Set(['festive-soft-grain-date-bean-braise', 'staged-pilaf-raw-rice', 'noodle-piece-broth-main-bowl', 'stirred-grain-thick-main-bowl', 'pre-saute-meat-vegetable-steamed-rice']);
const BOUNDARIES = new Set(['soft_grain_not_ordinary_rice', 'jiaotuan_not_unattended_appliance', 'huayin_cross_locality_and_single_pot_unproven', 'heyan_ich_not_recipe', 'sanfan_dispute_not_family', 'shengcuan_branches_not_one_recipe', 'rouzhanfan_not_any_meat_rice_braise', 'pilaf_named_branches_not_free_slots', 'turpan_ich_not_recipe']);
const VERDICTS = new Set(['supported', 'not_proven', 'contradicted']);
const PRODUCTION_PROVINCES = { 'shaanbei-red-date-cowpea-rice': 'CN-SN', 'xinjiang-lamb-pilaf': 'CN-XJ', 'xinjiang-vegetable-pilaf': 'CN-XJ' };
const AUDIT_STATES = { 'shaanbei-red-date-cowpea-rice': 'needs_manual_review', 'xinjiang-lamb-pilaf': 'needs_manual_review', 'xinjiang-vegetable-pilaf': 'needs_more_evidence' };
const LEAD_PROVINCES = { 'xifu-jiaotuan-seasoned-bowl': 'CN-SN', 'huayin-mashi-pao': 'CN-SN', 'gansu-heyan-jiumianpian-broth': 'CN-GS', 'huaining-mixed-grain-jiaotuan': 'CN-GS', 'ningxia-shengcuan-jiumian-bowl': 'CN-NX', 'ningxia-rouzhanfan-steamed-rice': 'CN-NX', 'turpan-soup-rice-technique': 'CN-XJ', 'xinjiang-household-jupianzi-soup': 'CN-XJ' };
const CLAIM_VERDICTS = {"production:shaanbei-red-date-cowpea-rice:soft_grain_date_bean_identity":"supported","production:shaanbei-red-date-cowpea-rice:ordinary_rice_adaptation":"not_proven","production:shaanbei-red-date-cowpea-rice:project_ratio_time_vessel":"not_proven","production:xinjiang-lamb-pilaf:staged_lamb_carrot_onion_rice_structure":"supported","production:xinjiang-lamb-pilaf:named_lamb_cut_and_fruit_slots":"not_proven","production:xinjiang-lamb-pilaf:project_ratio_time_safety":"not_proven","production:xinjiang-vegetable-pilaf:vegetarian_pilaf_existence":"supported","production:xinjiang-vegetable-pilaf:current_formula_equivalence":"not_proven","lead:xifu-jiaotuan-seasoned-bowl:stirred_thick_mass_and_separate_seasoning":"supported","lead:xifu-jiaotuan-seasoned-bowl:single_vessel_complete_meal":"not_proven","lead:xifu-jiaotuan-seasoned-bowl:project_ratio_safety":"not_proven","lead:huayin-mashi-pao:huayin_local_presence":"supported","lead:huayin-mashi-pao:cross_locality_shape_not_proven":"not_proven","lead:huayin-mashi-pao:single_pot_equivalence":"not_proven","lead:gansu-heyan-jiumianpian-broth:heyan_ich_identity":"supported","lead:gansu-heyan-jiumianpian-broth:noodle_piece_broth_structure":"supported","lead:gansu-heyan-jiumianpian-broth:heyan_exact_recipe":"not_proven","lead:gansu-heyan-jiumianpian-broth:single_pot_equivalence":"not_proven","lead:huaining-mixed-grain-jiaotuan:manual_stirred_grain_structure":"supported","lead:huaining-mixed-grain-jiaotuan:unattended_appliance_equivalence":"not_proven","lead:ningxia-shengcuan-jiumian-bowl:shengcuan_meatball_noodle_piece_structure":"supported","lead:ningxia-shengcuan-jiumian-bowl:all_noodle_piece_branches_one_recipe":"not_proven","lead:ningxia-shengcuan-jiumian-bowl:meat_under_cooking":"not_proven","lead:ningxia-rouzhanfan-steamed-rice:pre_saute_then_steam_structure":"supported","lead:ningxia-rouzhanfan-steamed-rice:any_meat_rice_braise_equivalence":"not_proven","lead:turpan-soup-rice-technique:turpan_ich_identity":"supported","lead:turpan-soup-rice-technique:protection_unit":"supported","lead:turpan-soup-rice-technique:recipe_formula":"not_proven","lead:xinjiang-household-jupianzi-soup:household_soup_noodle_piece_description":"supported","lead:xinjiang-household-jupianzi-soup:exclusive_regional_identity":"not_proven","lead:xinjiang-household-jupianzi-soup:project_ratio_safety":"not_proven"};
const AUXILIARY_TOKENS = new Set(['safety:fresh_bean_cook_through:principle', 'safety:animal_food_cook_through_and_separate:principle', 'boundary:sanfan_dispute_not_family:naming_dispute']);
const AUXILIARY_EDGES = {
  'safety:fresh_bean_cook_through:principle': { source_id: 'sn-cdc-bean-safety-2018', direction: 'proves', entity_type: 'safety', entity_id: 'fresh_bean_cook_through' },
  'safety:animal_food_cook_through_and_separate:principle': { source_id: 'nx-lamb-safety-2025', direction: 'proves', entity_type: 'safety', entity_id: 'animal_food_cook_through_and_separate' },
  'boundary:sanfan_dispute_not_family:naming_dispute': { source_id: 'gs-sanfan-dispute-2019', direction: 'proves', entity_type: 'boundary', entity_id: 'sanfan_dispute_not_family' },
};
const SEMANTIC_FINGERPRINTS = { family_model: '0bddd3a49c80d7887bff926c4dcc47c15e4cf4c7d9d4e17f3b1daf03257c85d6', adaptation_boundaries: '2770b12abf15f454b70939164a45e78ab25724621a88a69267746aa47853c4f3', journey_cases: 'd6384c7af78e9619cc13493ff79cd4e4a61d5f98add7a8806b2944f3f5282804' };
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const array = value => Array.isArray(value) ? value : [];
const text = value => typeof value === 'string' && value.trim().length > 0;
const sameSet = (values, expected) => values.length === expected.size && new Set(values).size === expected.size && values.every(value => expected.has(value));
const canonicalJson = value => value === null || typeof value !== 'object' ? JSON.stringify(value) : Array.isArray(value) ? `[${value.map(canonicalJson).join(',')}]` : `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
const fingerprint = value => createHash('sha256').update(canonicalJson(value)).digest('hex');
const sourceProvince = sourceId => ({ sn: 'CN-SN', gs: 'CN-GS', nx: 'CN-NX', xj: 'CN-XJ' })[sourceId?.slice(0, 2)];

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

function validateClaims(claims, token, path, sourceIds, directions, provinceCode, errors) {
  if (!isObject(claims) || Object.keys(claims).length === 0) { errors.push(`${path} must be a non-empty object`); return; }
  for (const [claimId, claim] of Object.entries(claims)) {
    const claimPath = `${path}.${claimId}`;
    if (!isObject(claim)) { errors.push(`${claimPath} must be an object`); continue; }
    if (!VERDICTS.has(claim.verdict)) errors.push(`${claimPath}.verdict is invalid`);
    if (CLAIM_VERDICTS[`${token}:${claimId}`] !== claim.verdict) errors.push(`${claimPath} fixed verdict must remain ${CLAIM_VERDICTS[`${token}:${claimId}`]}`);
    if (!text(claim.reason)) errors.push(`${claimPath}.reason must be non-empty`);
    if (!Array.isArray(claim.evidence_source_ids) || claim.evidence_source_ids.length === 0) { errors.push(`${claimPath}.evidence_source_ids must be non-empty`); continue; }
    const direction = claim.verdict === 'supported' ? 'proves' : claim.verdict === 'not_proven' ? 'does_not_prove' : 'contradicts';
    for (const sourceId of claim.evidence_source_ids) {
      if (!sourceIds.has(sourceId)) errors.push(`${claimPath} references unknown source ${sourceId}`);
      else if (!directions.get(sourceId)?.[direction]?.has(`${token}:${claimId}`)) errors.push(`${claimPath} verdict ${claim.verdict} must be reverse-indexed under ${direction} by source ${sourceId}`);
      else if (sourceProvince(sourceId) !== provinceCode) errors.push(`${claimPath} source province must match ${provinceCode}`);
    }
  }
}

function validateRows(rows, idField, expected, tokenPrefix, sourceIds, directions, errors) {
  if (!sameSet(array(rows).filter(isObject).map(row => row[idField]), expected)) errors.push(`${idField === 'recipe_id' ? 'production audit IDs' : 'research lead IDs'} must match the fixed regional baseline`);
  array(rows).forEach((row, index) => {
    const path = `${idField}_rows[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    const expectedProvince = idField === 'lead_id' ? LEAD_PROVINCES[row[idField]] : PRODUCTION_PROVINCES[row[idField]];
    if (row.province_code !== expectedProvince) errors.push(`${idField === 'lead_id' ? 'lead' : 'production'} province mapping must remain fixed`);
    if (idField === 'recipe_id' && row.audit_state !== AUDIT_STATES[row.recipe_id]) errors.push(`${path}.audit_state must remain ${AUDIT_STATES[row.recipe_id]}`);
    if (idField === 'lead_id') {
      if (!PROVINCES.has(row.province_code)) errors.push(`${path}.province_code is invalid`);
      if (!FAMILIES.has(row.family_id)) errors.push(`${path}.family_id must reference a fixed family`);
      if (row.production_recipe_id !== null) errors.push('research leads cannot reference a production recipe');
      if (row.candidate_id !== null) errors.push('research leads cannot reference a research candidate');
    }
    for (const sourceId of array(row.source_ids)) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
    validateClaims(row.claims, `${tokenPrefix}:${row[idField]}`, `${path}.claims`, sourceIds, directions, row.province_code, errors);
  });
}

function collectClaimEvidence(assessment) {
  const edges = new Map();
  for (const [prefix, rows, idField] of [
    ['production', array(assessment.production_recipe_audits), 'recipe_id'],
    ['lead', array(assessment.concrete_research_leads), 'lead_id'],
  ]) for (const row of rows) for (const [claimId, claim] of Object.entries(isObject(row?.claims) ? row.claims : {})) {
    edges.set(`${prefix}:${row[idField]}:${claimId}`, new Set(array(claim?.evidence_source_ids)));
  }
  return edges;
}

function validateBaseline({ recipeLibrary, regionalResearch, regionalAtlas, regionalMappings }, errors) {
  const region = array(regionalAtlas?.regions).find(row => row?.region_id === 'northwest');
  if (!region || !sameSet(array(region.province_codes), PROVINCES)) errors.push('regional atlas Northwest node must retain the fixed four provinces');
  const recipeIds = new Set(array(recipeLibrary?.recipes).filter(isObject).map(row => row.id));
  for (const id of PRODUCTION) if (!recipeIds.has(id)) errors.push(`missing production recipe ${id}`);
  const mappings = array(regionalMappings?.production_recipe_mappings).filter(row => isObject(row) && array(row.region_ids).includes('northwest'));
  if (!sameSet(mappings.map(row => row.source_id), PRODUCTION)) errors.push('regional production mappings must retain the fixed 3-recipe baseline');
  for (const mapping of mappings) if (!sameSet(array(mapping.province_codes), new Set([PRODUCTION_PROVINCES[mapping.source_id]]))) errors.push('production mapping province scope must remain fixed');
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
  const claimEvidence = collectClaimEvidence(assessment);
  const canonicalTokens = new Set([...Object.keys(CLAIM_VERDICTS), ...AUXILIARY_TOKENS]);
  for (const [sourceId, sourceDirections] of directions) for (const direction of ['proves', 'does_not_prove', 'contradicts']) for (const token of sourceDirections[direction]) {
    if (!canonicalTokens.has(token)) errors.push(`source ${sourceId} ${direction} token ${token} is not a canonical claim token`);
    if (Object.hasOwn(CLAIM_VERDICTS, token) && CLAIM_VERDICTS[token] !== (direction === 'proves' ? 'supported' : direction === 'does_not_prove' ? 'not_proven' : 'contradicted')) errors.push(`source ${sourceId} token ${token} has an invalid evidence direction`);
    if (Object.hasOwn(CLAIM_VERDICTS, token) && !claimEvidence.get(token)?.has(sourceId)) errors.push(`source ${sourceId} token ${token} does not correspond to claim evidence source`);
    if (AUXILIARY_TOKENS.has(token) && (AUXILIARY_EDGES[token].source_id !== sourceId || AUXILIARY_EDGES[token].direction !== direction)) errors.push(`source ${sourceId} token ${token} does not match its fixed auxiliary evidence edge`);
  }
  for (const [token, edge] of Object.entries(AUXILIARY_EDGES)) if (!directions.get(edge.source_id)?.[edge.direction]?.has(token)) errors.push(`auxiliary token ${token} must remain in ${edge.direction} for ${edge.source_id}`);
  for (const token of Object.keys(CLAIM_VERDICTS)) {
    const [prefix, entityId] = token.split(':');
    const rows = prefix === 'production' ? array(assessment.production_recipe_audits) : array(assessment.concrete_research_leads);
    const claimId = token.split(':').slice(2).join(':');
    if (!rows.find(row => row?.[prefix === 'production' ? 'recipe_id' : 'lead_id'] === entityId)?.claims?.[claimId]) errors.push(`canonical token ${token} has no matching assessment claim`);
  }
  if (!sameSet(array(assessment.family_model).filter(isObject).map(row => row.family_id), FAMILIES)) errors.push('family IDs must match the fixed regional contract');
  if (array(assessment.family_model).length !== 5) errors.push('family_model must contain exactly 5 items');
  if (fingerprint(assessment.family_model) !== SEMANTIC_FINGERPRINTS.family_model) errors.push('family_model semantic fingerprint mismatch');
  const boundaries = array(assessment.adaptation_boundaries);
  if (!sameSet(boundaries.filter(isObject).map(row => row.boundary_id), BOUNDARIES)) errors.push('adaptation boundary IDs must match the fixed regional contract');
  boundaries.forEach((row, index) => {
    if (!isObject(row)) { errors.push(`adaptation_boundaries[${index}] must be an object`); return; }
    if (row.evidence_status !== 'not_proven') errors.push(`adaptation_boundaries[${index}].evidence_status must remain not_proven`);
    if (!text(row.notes)) errors.push(`adaptation_boundaries[${index}].notes must be non-empty`);
    for (const sourceId of array(row.source_ids)) if (!ids.has(sourceId)) errors.push(`adaptation_boundaries[${index}] references unknown source ${sourceId}`);
  });
  if (fingerprint(assessment.adaptation_boundaries) !== SEMANTIC_FINGERPRINTS.adaptation_boundaries) errors.push('adaptation_boundaries semantic fingerprint mismatch');
  const safetyBoundaries = array(assessment.safety_boundaries);
  for (const edge of Object.values(AUXILIARY_EDGES)) {
    const rows = edge.entity_type === 'safety' ? safetyBoundaries : boundaries;
    const idField = edge.entity_type === 'safety' ? 'safety_id' : 'boundary_id';
    const entity = rows.find(row => row?.[idField] === edge.entity_id);
    if (!entity) { errors.push(`${edge.entity_type === 'safety' ? 'safety boundary' : 'boundary entity'} ${edge.entity_id} must exist`); continue; }
    if (!array(entity.source_ids).includes(edge.source_id)) errors.push(`${edge.entity_type} ${edge.entity_id} must reference ${edge.source_id}`);
    const expectedStatus = edge.entity_type === 'safety' ? 'principle_only' : 'not_proven';
    if (entity.evidence_status !== expectedStatus) errors.push(`${edge.entity_type} ${edge.entity_id} evidence_status must remain ${expectedStatus}`);
  }
  const journeys = array(assessment.journey_cases);
  if (journeys.length !== 16) errors.push('journey_cases must contain exactly 16 items');
  if (new Set(journeys.filter(isObject).map(row => row.journey_id)).size !== journeys.length) errors.push('journey_ids must be unique');
  if (!sameSet([...new Set(journeys.filter(isObject).map(row => row.province_code))], PROVINCES)) errors.push('journeys must cover every Northwest province');
  journeys.forEach((row, index) => {
    if (!isObject(row)) { errors.push(`journey_cases[${index}] must be an object`); return; }
    if (row.human_review?.status !== 'pending') errors.push(`journey_cases[${index}].human_review.status must remain pending`);
    for (const familyId of array(row.expected_family_ids)) if (!FAMILIES.has(familyId)) errors.push(`journey_cases[${index}].expected_family_ids contains unknown family ${familyId}`);
  });
  if (fingerprint(assessment.journey_cases) !== SEMANTIC_FINGERPRINTS.journey_cases) errors.push('journey_cases semantic fingerprint mismatch');
  validateBaseline({ recipeLibrary, regionalResearch, regionalAtlas, regionalMappings }, errors);
  return errors;
}

const EXPECTED_REGIONS = new Set(['jingjinji', 'jinmeng']);
const EXPECTED_PROVINCES = new Set(['CN-BJ', 'CN-TJ', 'CN-HE', 'CN-SX', 'CN-NM']);
const EXPECTED_RECIPES = new Set(['north-china-green-bean-braised-noodles', 'shanxi-potato-rice', 'shanxi-nitun-millet-rice']);
const EXPECTED_CANDIDATES = new Set(['north-pork-bean-braised-noodles', 'north-potato-bean-braised-noodles', 'north-cabbage-pork-braised-noodles', 'north-mushroom-vegetable-braised-noodles']);
const EXPECTED_LEADS = new Set(['beijing-pinggu-sticky-roll', 'tianjin-fish-staple-pot', 'hebei-julu-braised-pancake', 'inner-mongolia-western-braised-noodle']);
const VERDICTS = new Set(['supported', 'not_proven', 'contradicted']);
const DESTINATIONS = new Set(['recipe_evidence', 'candidate_evidence', 'template_evidence', 'ratio_rule', 'new_family_research', 'research_only']);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const asArray = value => Array.isArray(value) ? value : [];
const asObject = value => isObject(value) ? value : {};
const hasText = value => typeof value === 'string' && value.trim().length > 0;

function sameStringSet(values, expected) {
  return values.length === expected.size && new Set(values).size === expected.size && values.every(value => expected.has(value));
}

function textArray(value, path, errors, { allowEmpty = false } = {}) {
  if (!Array.isArray(value)) { errors.push(`${path} must be an array`); return []; }
  if (!allowEmpty && value.length === 0) errors.push(`${path} must be non-empty`);
  if (value.some(item => !hasText(item))) errors.push(`${path} must contain non-empty strings`);
  if (new Set(value).size !== value.length) errors.push(`${path} must not contain duplicates`);
  return value.filter(hasText);
}

function validateSources(assessment, errors) {
  const rows = asArray(assessment.source_refs);
  if (!Array.isArray(assessment.source_refs)) errors.push('source_refs must be an array');
  if (rows.length !== 9) errors.push('source_refs must contain exactly 9 items');
  const sourceIds = new Set();
  const proofIndex = new Map();
  rows.forEach((row, index) => {
    const path = `source_refs[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    for (const field of ['source_id', 'title', 'url', 'publisher', 'retrieved_at', 'source_grade', 'evidence_summary']) if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
    if (sourceIds.has(row.source_id)) errors.push(`duplicate source_id ${row.source_id}`);
    if (hasText(row.source_id)) sourceIds.add(row.source_id);
    try { const url = new URL(row.url); if (url.protocol !== 'https:') errors.push(`${path}.url must use HTTPS`); if (url.hostname === 'yiguochu.pages.dev') errors.push('project canonical URL cannot be regional evidence'); } catch { errors.push(`${path}.url must be valid`); }
    if (row.published_at !== null && (!hasText(row.published_at) || !/^\d{4}-\d{2}-\d{2}$/.test(row.published_at))) errors.push(`${path}.published_at must be YYYY-MM-DD or null`);
    if (row.published_at === null && !hasText(row.date_note)) errors.push(`${path}.date_note is required when published_at is null`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.retrieved_at || '')) errors.push(`${path}.retrieved_at must be YYYY-MM-DD`);
    if (!['A', 'B', 'C'].includes(row.source_grade)) errors.push(`${path}.source_grade is invalid`);
    const proves = textArray(row.proves, `${path}.proves`, errors);
    textArray(row.does_not_prove, `${path}.does_not_prove`, errors, { allowEmpty: true });
    for (const proof of proves) { if (!proofIndex.has(proof)) proofIndex.set(proof, new Set()); proofIndex.get(proof).add(row.source_id); }
  });
  return { sourceIds, proofIndex };
}

function validateClaim(claim, proofKey, sourceIds, proofIndex, path, errors) {
  if (!isObject(claim)) { errors.push(`${path} must be an object`); return; }
  if (!VERDICTS.has(claim.verdict)) errors.push(`${path}.verdict is invalid`);
  const evidence = textArray(claim.evidence_source_ids, `${path}.evidence_source_ids`, errors);
  for (const id of evidence) if (!sourceIds.has(id)) errors.push(`${path} references unknown source ${id}`);
  if (!hasText(claim.reason)) errors.push(`${path}.reason must be non-empty`);
  if (claim.verdict === 'supported') {
    const proving = proofIndex.get(proofKey) || new Set();
    if (!evidence.some(id => proving.has(id))) errors.push(`${path} supported claim lacks reverse proof ${proofKey}`);
  }
  if (claim.verdict === 'contradicted' && evidence.length === 0) errors.push(`${path} contradicted claim needs evidence`);
}

function validateBaseline(assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings, errors) {
  if (!sameStringSet(asArray(assessment.region_ids), EXPECTED_REGIONS)) errors.push('region_ids must contain jingjinji and jinmeng');
  if (!sameStringSet(asArray(assessment.province_codes), EXPECTED_PROVINCES)) errors.push('province_codes must contain the fixed five nodes');
  const atlasRegions = asArray(regionalAtlas?.regions).filter(row => EXPECTED_REGIONS.has(row?.region_id));
  if (!sameStringSet(atlasRegions.map(row => row.region_id), EXPECTED_REGIONS)) errors.push('regional atlas nodes are missing or changed');
  if (asArray(regionalResearch?.entries).length !== 24) errors.push('regional research baseline must remain 24');
  const libraryIds = new Set(asArray(recipeLibrary?.recipes).filter(isObject).map(row => row.id));
  for (const id of EXPECTED_RECIPES) if (!libraryIds.has(id)) errors.push(`missing production recipe ${id}`);
  const candidateIds = new Set(asArray(regionalResearch?.entries).filter(isObject).map(row => row.atlas_id));
  for (const id of EXPECTED_CANDIDATES) if (!candidateIds.has(id)) errors.push(`missing research candidate ${id}`);
  const inScope = row => asArray(row?.region_ids).some(id => EXPECTED_REGIONS.has(id));
  const mappedRecipes = asArray(regionalMappings?.production_recipe_mappings).filter(isObject).filter(inScope).map(row => row.source_id);
  const mappedCandidates = asArray(regionalMappings?.research_candidate_mappings).filter(isObject).filter(inScope).map(row => row.source_id);
  if (!sameStringSet(mappedRecipes, EXPECTED_RECIPES)) errors.push('regional production mappings no longer match fixed three-recipe baseline');
  if (!sameStringSet(mappedCandidates, EXPECTED_CANDIDATES)) errors.push('regional candidate mappings no longer match fixed four-candidate baseline');
}

function validateGaps(assessment, regionalMappings, errors) {
  const rows = asArray(assessment.province_gap_audits);
  if (!sameStringSet(rows.filter(isObject).map(row => row.province_code), EXPECTED_PROVINCES)) errors.push('province gap audits must contain all five nodes');
  const production = asArray(regionalMappings?.production_recipe_mappings).filter(isObject);
  rows.forEach((row, index) => {
    const path = `province_gap_audits[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    if (!hasText(row.province_name) || !hasText(row.research_gap)) errors.push(`${path} must have province_name and research_gap`);
    const actual = production.filter(item => asArray(item.province_codes).includes(row.province_code)).map(item => item.source_id).filter(id => EXPECTED_RECIPES.has(id));
    if (!sameStringSet(textArray(row.production_recipe_ids, `${path}.production_recipe_ids`, errors, { allowEmpty: true }), new Set(actual))) errors.push(`${path} production IDs do not match mappings`);
    if (textArray(row.candidate_ids, `${path}.candidate_ids`, errors, { allowEmpty: true }).length !== 0) errors.push(`${path} province candidates must remain empty because current four are cross-regional`);
  });
}

function validateSubjects(rows, idField, expected, subjectPrefix, sourceIds, proofIndex, errors) {
  if (!sameStringSet(asArray(rows).filter(isObject).map(row => row[idField]), expected)) errors.push(`${idField} rows do not match fixed baseline`);
  asArray(rows).forEach((row, index) => {
    const path = `${idField}_rows[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    const sources = textArray(row.source_ids, `${path}.source_ids`, errors);
    for (const id of sources) if (!sourceIds.has(id)) errors.push(`${path} references unknown source ${id}`);
    const claims = asObject(row.claims);
    if (!Object.keys(claims).length) errors.push(`${path}.claims must be non-empty`);
    for (const [claimId, claim] of Object.entries(claims)) validateClaim(claim, `${subjectPrefix}:${row[idField]}:${claimId}`, sourceIds, proofIndex, `${path}.claims.${claimId}`, errors);
    textArray(row.forbidden_claims, `${path}.forbidden_claims`, errors);
    for (const destination of textArray(row.product_destinations, `${path}.product_destinations`, errors)) if (!DESTINATIONS.has(destination)) errors.push(`${path} has invalid destination ${destination}`);
  });
}

function validateLeads(assessment, sourceIds, proofIndex, errors) {
  const rows = asArray(assessment.concrete_research_leads);
  if (!sameStringSet(rows.filter(isObject).map(row => row.lead_id), EXPECTED_LEADS)) errors.push('research lead IDs do not match fixed four leads');
  rows.forEach((row, index) => {
    const path = `concrete_research_leads[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    if (!EXPECTED_PROVINCES.has(row.province_code)) errors.push(`${path}.province_code is invalid`);
    if (row.production_recipe_id !== null) errors.push('research leads cannot reference a production recipe');
    if (row.candidate_id !== null) errors.push('research leads cannot reference a research candidate');
    for (const field of ['name', 'family_id', 'meal_structure']) if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
    const sources = textArray(row.source_ids, `${path}.source_ids`, errors);
    for (const id of sources) if (!sourceIds.has(id)) errors.push(`${path} references unknown source ${id}`);
    for (const [claimId, claim] of Object.entries(asObject(row.claims))) validateClaim(claim, `lead:${row.lead_id}:${claimId}`, sourceIds, proofIndex, `${path}.claims.${claimId}`, errors);
    for (const field of ['ingredient_shapes', 'forbidden_shortcuts', 'known_structure', 'open_questions']) textArray(row[field], `${path}.${field}`, errors);
    for (const destination of textArray(row.product_destinations, `${path}.product_destinations`, errors)) if (!DESTINATIONS.has(destination)) errors.push(`${path} has invalid destination ${destination}`);
  });
}

function validateBoundaries(assessment, sourceIds, proofIndex, errors) {
  const families = asArray(assessment.family_model);
  if (families.length !== 6) errors.push('family_model must contain exactly 6 distinct families');
  families.forEach((row, index) => { if (!isObject(row)) errors.push(`family_model[${index}] must be an object`); else for (const field of ['family_id', 'name', 'meal_structure', 'evidence_status']) if (!hasText(row[field])) errors.push(`family_model[${index}].${field} must be non-empty`); });
  const adaptations = asArray(assessment.adaptation_boundaries);
  if (adaptations.length !== 5) errors.push('adaptation_boundaries must contain exactly 5 items');
  adaptations.forEach((row, index) => { if (!isObject(row)) errors.push(`adaptation_boundaries[${index}] must be an object`); else for (const field of ['boundary_id', 'evidence_status', 'notes']) if (!hasText(row[field])) errors.push(`adaptation_boundaries[${index}].${field} must be non-empty`); });
  const safety = asArray(assessment.safety_boundaries);
  if (safety.length !== 2) errors.push('safety_boundaries must contain exactly 2 items');
  safety.forEach((row, index) => {
    const path = `safety_boundaries[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    const sources = textArray(row.source_ids, `${path}.source_ids`, errors);
    for (const id of sources) if (!sourceIds.has(id)) errors.push(`${path} references unknown source ${id}`);
    const proof = proofIndex.get(`safety:${row.safety_id}:principle`) || new Set();
    if (!sources.some(id => proof.has(id))) errors.push(`${path} lacks safety principle proof`);
    if (row.evidence_status !== 'principle_only') errors.push(`${path}.evidence_status must remain principle_only`);
    textArray(row.required_controls, `${path}.required_controls`, errors);
    if (!hasText(row.endpoint_note)) errors.push(`${path}.endpoint_note must be non-empty`);
    for (const forbidden of ['grams', 'minutes', 'temperature_c', 'liquid_ml']) if (Object.hasOwn(row, forbidden)) errors.push(`${path} cannot invent ${forbidden}`);
  });
}

function validateJourneys(assessment, errors) {
  const rows = asArray(assessment.journey_cases);
  if (rows.length !== 15) errors.push('journey_cases must contain exactly 15 items');
  if (new Set(rows.filter(isObject).map(row => row.journey_id)).size !== rows.length) errors.push('journey_ids must be unique');
  rows.forEach((row, index) => {
    const path = `journey_cases[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    for (const field of ['journey_id', 'province_code', 'mode', 'intent', 'expected_structure', 'expected_outcome', 'reason']) if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
    if (!EXPECTED_PROVINCES.has(row.province_code)) errors.push(`${path}.province_code is invalid`);
    textArray(row.input_items, `${path}.input_items`, errors);
    textArray(row.expected_family_ids, `${path}.expected_family_ids`, errors);
    textArray(row.forbidden_claims, `${path}.forbidden_claims`, errors);
    if (!isObject(row.human_review) || !['pending', 'passed', 'failed'].includes(row.human_review?.status)) errors.push(`${path}.human_review.status is invalid`);
  });
}

export function validateJingjinjiJinmengOnePotResearch({ assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings } = {}) {
  if (!isObject(assessment)) return ['assessment must be an object'];
  const errors = [];
  if (assessment.schema_version !== 1) errors.push('schema_version must be 1');
  if (!hasText(assessment.assessment_version)) errors.push('assessment_version must be non-empty');
  validateBaseline(assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings, errors);
  const { sourceIds, proofIndex } = validateSources(assessment, errors);
  validateGaps(assessment, regionalMappings, errors);
  validateSubjects(assessment.production_recipe_audits, 'recipe_id', EXPECTED_RECIPES, 'recipe', sourceIds, proofIndex, errors);
  validateSubjects(assessment.candidate_audits, 'candidate_id', EXPECTED_CANDIDATES, 'candidate', sourceIds, proofIndex, errors);
  validateLeads(assessment, sourceIds, proofIndex, errors);
  validateBoundaries(assessment, sourceIds, proofIndex, errors);
  validateJourneys(assessment, errors);
  const recipes = new Map(asArray(assessment.production_recipe_audits).filter(isObject).map(row => [row.recipe_id, row]));
  if (recipes.get('north-china-green-bean-braised-noodles')?.claims?.province_exclusive_identity?.verdict !== 'not_proven') errors.push('province exclusivity must remain not_proven');
  for (const row of asArray(assessment.candidate_audits).filter(isObject)) if (row.claims?.fixed_traditional_core?.verdict !== 'not_proven') errors.push('candidate fixed traditional core must remain not_proven');
  const leads = new Map(asArray(assessment.concrete_research_leads).filter(isObject).map(row => [row.lead_id, row]));
  if (leads.get('hebei-julu-braised-pancake')?.claims?.raw_noodle_equivalence?.verdict !== 'contradicted') errors.push('braised pancake cannot equal raw noodle');
  if (leads.get('tianjin-fish-staple-pot')?.claims?.single_pot_process?.verdict !== 'not_proven') errors.push('Tianjin single-pot process must remain not_proven');
  return errors;
}

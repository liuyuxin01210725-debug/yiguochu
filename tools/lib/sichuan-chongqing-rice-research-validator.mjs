const EXPECTED_REGION = 'sichuan_chongqing';
const EXPECTED_PROVINCES = new Set(['CN-SC', 'CN-CQ']);
const EXPECTED_CANDIDATES = new Set([
  'chongqing-firewood-potato-rice-home',
  'sichuan-salted-pork-potato-rice',
  'sichuan-corn-potato-rice',
  'sichuan-bean-potato-rice',
]);
const EXPECTED_LEADS = new Set([
  'sichuan-kong-dry-rice',
  'sichuan-golden-wrapped-silver-rice',
  'chongqing-youzhou-shefan',
]);
const VERDICTS = new Set(['supported', 'not_proven', 'contradicted']);
const DESTINATIONS = new Set(['recipe_evidence', 'candidate_evidence', 'template_evidence', 'ratio_rule', 'new_family_research', 'research_only']);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const asArray = value => Array.isArray(value) ? value : [];
const asObject = value => isObject(value) ? value : {};
const hasText = value => typeof value === 'string' && value.trim().length > 0;

function sameSet(values, expected) {
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
    for (const field of ['source_id', 'title', 'url', 'publisher', 'retrieved_at', 'source_grade', 'evidence_summary']) {
      if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
    }
    if (sourceIds.has(row.source_id)) errors.push(`duplicate source_id ${row.source_id}`);
    if (hasText(row.source_id)) sourceIds.add(row.source_id);
    try {
      const url = new URL(row.url);
      if (url.protocol !== 'https:') errors.push(`${path}.url must use HTTPS`);
      if (url.hostname === 'yiguochu.pages.dev') errors.push('project canonical URL cannot be regional evidence');
    } catch { errors.push(`${path}.url must be valid`); }
    if (row.published_at !== null && (!hasText(row.published_at) || !/^\d{4}-\d{2}-\d{2}$/.test(row.published_at))) errors.push(`${path}.published_at must be YYYY-MM-DD or null`);
    if (row.published_at === null && !hasText(row.date_note)) errors.push(`${path}.date_note is required when published_at is null`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.retrieved_at || '')) errors.push(`${path}.retrieved_at must be YYYY-MM-DD`);
    if (!['A', 'B', 'C'].includes(row.source_grade)) errors.push(`${path}.source_grade is invalid`);
    const proves = textArray(row.proves, `${path}.proves`, errors);
    textArray(row.does_not_prove, `${path}.does_not_prove`, errors, { allowEmpty: true });
    for (const proof of proves) {
      if (!proofIndex.has(proof)) proofIndex.set(proof, new Set());
      proofIndex.get(proof).add(row.source_id);
    }
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
}

function validateBaseline(assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings, errors) {
  if (assessment.region_id !== EXPECTED_REGION) errors.push('region_id must be sichuan_chongqing');
  if (!sameSet(asArray(assessment.province_codes), EXPECTED_PROVINCES)) errors.push('province_codes must contain CN-SC and CN-CQ');
  const atlasRegion = asArray(regionalAtlas?.regions).find(row => row?.region_id === EXPECTED_REGION);
  if (!atlasRegion || !sameSet(asArray(atlasRegion.province_codes), EXPECTED_PROVINCES)) errors.push('regional atlas Sichuan-Chongqing node is missing or changed');
  const atlasNodes = asArray(regionalAtlas?.province_nodes).filter(row => EXPECTED_PROVINCES.has(row?.atlas_code)).map(row => row.atlas_code);
  if (!sameSet(atlasNodes, EXPECTED_PROVINCES)) errors.push('regional atlas province nodes are missing or changed');
  if (asArray(recipeLibrary?.recipes).length !== 72) errors.push('recipe library baseline must remain 72');
  if (asArray(regionalResearch?.entries).length !== 24) errors.push('regional research baseline must remain 24');
  const inScope = row => asArray(row?.region_ids).includes(EXPECTED_REGION);
  const mappedRecipes = asArray(regionalMappings?.production_recipe_mappings).filter(inScope).map(row => row.source_id);
  const mappedCandidates = asArray(regionalMappings?.research_candidate_mappings).filter(inScope).map(row => row.source_id);
  if (mappedRecipes.length !== 0) errors.push('Sichuan-Chongqing production mapping baseline must remain zero');
  if (!sameSet(mappedCandidates, EXPECTED_CANDIDATES)) errors.push('regional candidate mappings no longer match fixed four-candidate baseline');
  const candidateIds = asArray(regionalResearch?.entries).map(row => row?.atlas_id).filter(Boolean);
  for (const id of EXPECTED_CANDIDATES) if (!candidateIds.includes(id)) errors.push(`missing research candidate ${id}`);
}

function validateCandidates(assessment, sourceIds, proofIndex, errors) {
  const rows = asArray(assessment.candidate_audits);
  if (!sameSet(rows.filter(isObject).map(row => row.candidate_id), EXPECTED_CANDIDATES)) errors.push('candidate audits must match fixed four-candidate baseline');
  rows.forEach((row, index) => {
    const path = `candidate_audits[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    if (!hasText(row.audit_state) || !hasText(row.decision_reason)) errors.push(`${path} must have audit_state and decision_reason`);
    textArray(row.ingredient_shapes, `${path}.ingredient_shapes`, errors);
    textArray(row.forbidden_claims, `${path}.forbidden_claims`, errors);
    for (const destination of textArray(row.product_destinations, `${path}.product_destinations`, errors)) if (!DESTINATIONS.has(destination)) errors.push(`${path} has invalid destination ${destination}`);
    const claims = asObject(row.claims);
    if (!Object.keys(claims).length) errors.push(`${path}.claims must be non-empty`);
    for (const [claimId, claim] of Object.entries(claims)) validateClaim(claim, `candidate:${row.candidate_id}:${claimId}`, sourceIds, proofIndex, `${path}.claims.${claimId}`, errors);
    if (!isObject(row.priority)) errors.push(`${path}.priority must be an object`);
  });
}

function validateLeads(assessment, sourceIds, proofIndex, errors) {
  const rows = asArray(assessment.concrete_research_leads);
  if (!sameSet(rows.filter(isObject).map(row => row.lead_id), EXPECTED_LEADS)) errors.push('research lead IDs do not match fixed three leads');
  rows.forEach((row, index) => {
    const path = `concrete_research_leads[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    if (!EXPECTED_PROVINCES.has(row.province_code)) errors.push(`${path}.province_code is invalid`);
    if (row.production_recipe_id !== null) errors.push('research leads cannot reference a production recipe');
    if (row.candidate_id !== null) errors.push('research leads cannot reference a research candidate');
    for (const field of ['name', 'family_id', 'meal_structure', 'decision_reason']) if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
    const sources = textArray(row.source_ids, `${path}.source_ids`, errors);
    for (const id of sources) if (!sourceIds.has(id)) errors.push(`${path} references unknown source ${id}`);
    for (const [claimId, claim] of Object.entries(asObject(row.claims))) validateClaim(claim, `lead:${row.lead_id}:${claimId}`, sourceIds, proofIndex, `${path}.claims.${claimId}`, errors);
    for (const field of ['ingredient_shapes', 'known_structure', 'forbidden_shortcuts', 'open_questions']) textArray(row[field], `${path}.${field}`, errors);
    for (const destination of textArray(row.product_destinations, `${path}.product_destinations`, errors)) if (!DESTINATIONS.has(destination)) errors.push(`${path} has invalid destination ${destination}`);
  });
}

function validateBoundaries(assessment, sourceIds, proofIndex, errors) {
  const families = asArray(assessment.family_model);
  if (families.length !== 4) errors.push('family_model must contain exactly 4 items');
  families.forEach((row, index) => {
    if (!isObject(row)) { errors.push(`family_model[${index}] must be an object`); return; }
    for (const field of ['family_id', 'name', 'meal_structure', 'evidence_status']) if (!hasText(row[field])) errors.push(`family_model[${index}].${field} must be non-empty`);
  });
  const adaptations = asArray(assessment.adaptation_boundaries);
  if (adaptations.length !== 6) errors.push('adaptation_boundaries must contain exactly 6 items');
  adaptations.forEach((row, index) => {
    if (!isObject(row)) { errors.push(`adaptation_boundaries[${index}] must be an object`); return; }
    for (const field of ['boundary_id', 'evidence_status', 'notes']) if (!hasText(row[field])) errors.push(`adaptation_boundaries[${index}].${field} must be non-empty`);
  });
  const safety = asArray(assessment.safety_boundaries);
  if (safety.length !== 3) errors.push('safety_boundaries must contain exactly 3 items');
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
  if (rows.length !== 12) errors.push('journey_cases must contain exactly 12 items');
  if (new Set(rows.filter(isObject).map(row => row.journey_id)).size !== rows.length) errors.push('journey_ids must be unique');
  rows.forEach((row, index) => {
    const path = `journey_cases[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    for (const field of ['journey_id', 'province_code', 'mode', 'intent', 'expected_structure', 'expected_outcome', 'reason']) if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
    if (!EXPECTED_PROVINCES.has(row.province_code)) errors.push(`${path}.province_code is invalid`);
    textArray(row.input_items, `${path}.input_items`, errors);
    textArray(row.expected_family_ids, `${path}.expected_family_ids`, errors, { allowEmpty: true });
    textArray(row.forbidden_claims, `${path}.forbidden_claims`, errors);
    if (!isObject(row.human_review) || !['pending', 'passed', 'failed'].includes(row.human_review?.status)) errors.push(`${path}.human_review.status is invalid`);
  });
}

export function validateSichuanChongqingRiceResearch({ assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings } = {}) {
  if (!isObject(assessment)) return ['assessment must be an object'];
  const errors = [];
  if (assessment.schema_version !== 1) errors.push('schema_version must be 1');
  if (!hasText(assessment.assessment_version)) errors.push('assessment_version must be non-empty');
  validateBaseline(assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings, errors);
  if (!Array.isArray(assessment.production_recipe_audits) || assessment.production_recipe_audits.length !== 0) errors.push('production_recipe_audits must remain empty');
  const { sourceIds, proofIndex } = validateSources(assessment, errors);
  validateCandidates(assessment, sourceIds, proofIndex, errors);
  validateLeads(assessment, sourceIds, proofIndex, errors);
  validateBoundaries(assessment, sourceIds, proofIndex, errors);
  validateJourneys(assessment, errors);
  const candidates = new Map(asArray(assessment.candidate_audits).filter(isObject).map(row => [row.candidate_id, row]));
  if (candidates.get('sichuan-bean-potato-rice')?.claims?.fixed_bean_potato_core?.verdict !== 'not_proven') errors.push('bean potato fixed core must remain not_proven');
  if (candidates.get('sichuan-corn-potato-rice')?.claims?.fixed_corn_potato_core?.verdict !== 'not_proven') errors.push('corn potato fixed core must remain not_proven');
  if (candidates.get('sichuan-salted-pork-potato-rice')?.claims?.sichuan_fixed_cured_pork_core?.verdict !== 'not_proven') errors.push('Sichuan cured pork fixed core must remain not_proven');
  if (candidates.get('chongqing-firewood-potato-rice-home')?.claims?.household_appliance_equivalence?.verdict !== 'not_proven') errors.push('household appliance equivalence must remain not_proven');
  const leads = new Map(asArray(assessment.concrete_research_leads).filter(isObject).map(row => [row.lead_id, row]));
  if (!asArray(leads.get('sichuan-kong-dry-rice')?.ingredient_shapes).includes('parboiled_drained_rice')) errors.push('Kong rice must preserve parboiled drained rice shape');
  return errors;
}

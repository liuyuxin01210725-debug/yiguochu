const EXPECTED_REGION = 'lingnan_hk_macao';
const EXPECTED_PROVINCES = new Set(['CN-GD', 'CN-GX', 'CN-HI', 'CN-HK', 'CN-MO']);
const EXPECTED_PRODUCTION = new Set([
  'cantonese-black-bean-pork-rib-claypot-rice',
  'cantonese-cured-meat-claypot-rice',
  'cantonese-mushroom-chicken-claypot-rice',
  'guangxi-five-color-glutinous-rice',
  'hainan-cai-bao-rice',
]);
const EXPECTED_LEADS = new Set([
  'cantonese-claypot-rice-technique',
  'guangxi-natural-dye-five-color-glutinous-rice',
  'hainan-coconut-shredded-rice',
  'hainan-dingan-cai-bao-finished-rice',
  'macao-portuguese-style-seafood-rice',
]);
const VERDICTS = new Set(['supported', 'not_proven', 'contradicted']);
const DESTINATIONS = new Set(['recipe_evidence', 'template_evidence', 'ratio_rule', 'new_family_research', 'research_only', 'substitution_rule']);
const AUDIT_STATES = new Set(['needs_manual_review', 'needs_more_evidence', 'supported_with_boundaries']);
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
  const ids = new Set();
  const directions = new Map();
  const rows = asArray(assessment.source_refs);
  if (!Array.isArray(assessment.source_refs)) errors.push('source_refs must be an array');
  if (rows.length !== 11) errors.push('source_refs must contain exactly 11 items');
  rows.forEach((row, index) => {
    const path = `source_refs[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    for (const field of ['source_id', 'title', 'url', 'publisher', 'published_at', 'retrieved_at', 'source_grade', 'evidence_summary']) if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
    if (ids.has(row.source_id)) errors.push(`duplicate source_id ${row.source_id}`);
    if (hasText(row.source_id)) ids.add(row.source_id);
    try {
      const url = new URL(row.url);
      if (url.protocol !== 'https:') errors.push(`${path}.url must use HTTPS`);
      if (url.hostname === 'yiguochu.pages.dev') errors.push('project canonical URL cannot be regional evidence');
    } catch { errors.push(`${path}.url must be valid`); }
    if (row.published_at !== 'undated' && !/^\d{4}-\d{2}-\d{2}$/.test(row.published_at || '')) errors.push(`${path}.published_at must be YYYY-MM-DD or undated`);
    if (row.published_at === 'undated' && !hasText(row.date_note)) errors.push(`${path}.date_note is required when published_at is undated`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.retrieved_at || '')) errors.push(`${path}.retrieved_at must be YYYY-MM-DD`);
    if (!['A', 'B', 'C'].includes(row.source_grade)) errors.push(`${path}.source_grade is invalid`);
    const proves = textArray(row.proves, `${path}.proves`, errors, { allowEmpty: true });
    const doesNotProve = textArray(row.does_not_prove, `${path}.does_not_prove`, errors, { allowEmpty: true });
    const contradicts = row.contradicts === undefined ? [] : textArray(row.contradicts, `${path}.contradicts`, errors, { allowEmpty: true });
    if (new Set([...proves, ...doesNotProve, ...contradicts]).size !== proves.length + doesNotProve.length + contradicts.length) errors.push(`${path} claim directions must not overlap`);
    directions.set(row.source_id, { proves: new Set(proves), does_not_prove: new Set(doesNotProve), contradicts: new Set(contradicts) });
  });
  return { ids, directions };
}

function validateClaims(claims, token, path, sourceIds, directions, errors) {
  if (!isObject(claims) || Object.keys(claims).length === 0) { errors.push(`${path} must be a non-empty object`); return; }
  for (const [claimId, rawClaim] of Object.entries(claims)) {
    const claimPath = `${path}.${claimId}`;
    const claim = asObject(rawClaim);
    if (!VERDICTS.has(claim.verdict)) errors.push(`${claimPath}.verdict is invalid`);
    if (!hasText(claim.reason)) errors.push(`${claimPath}.reason must be non-empty`);
    const evidence = textArray(claim.evidence_source_ids, `${claimPath}.evidence_source_ids`, errors);
    const direction = claim.verdict === 'supported' ? 'proves' : claim.verdict === 'not_proven' ? 'does_not_prove' : 'contradicts';
    for (const sourceId of evidence) {
      if (!sourceIds.has(sourceId)) errors.push(`${claimPath} references unknown source ${sourceId}`);
      if (!directions.get(sourceId)?.[direction]?.has(`${token}:${claimId}`)) errors.push(`${claimPath} verdict ${claim.verdict} must be reverse-indexed under ${direction} by source ${sourceId}`);
    }
  }
}

function validateAudits(assessment, sourceIds, directions, errors) {
  const rows = asArray(assessment.production_recipe_audits);
  if (!sameSet(rows.filter(isObject).map(row => row.recipe_id), EXPECTED_PRODUCTION)) errors.push('production audit IDs must match the fixed regional baseline');
  rows.forEach((row, index) => {
    const path = `production_recipe_audits[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    if (!hasText(row.recipe_id)) errors.push(`${path}.recipe_id must be non-empty`);
    if (!AUDIT_STATES.has(row.audit_state)) errors.push(`${path}.audit_state is invalid`);
    validateClaims(row.claims, `production:${row.recipe_id}`, `${path}.claims`, sourceIds, directions, errors);
    for (const field of ['ingredient_shapes', 'forbidden_claims', 'product_destinations']) textArray(row[field], `${path}.${field}`, errors);
    for (const destination of asArray(row.product_destinations)) if (!DESTINATIONS.has(destination)) errors.push(`${path}.product_destinations contains invalid ${destination}`);
    if (!hasText(row.decision_reason)) errors.push(`${path}.decision_reason must be non-empty`);
  });
  if (!Array.isArray(assessment.candidate_audits) || assessment.candidate_audits.length !== 0) errors.push('candidate_audits must remain empty');
}

function validateLeads(assessment, sourceIds, directions, errors) {
  const rows = asArray(assessment.concrete_research_leads);
  if (!sameSet(rows.filter(isObject).map(row => row.lead_id), EXPECTED_LEADS)) errors.push('research lead IDs must match the fixed regional scope');
  rows.forEach((row, index) => {
    const path = `concrete_research_leads[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    for (const field of ['lead_id', 'name', 'province_code', 'family_id', 'meal_structure', 'decision_reason']) if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
    if (!EXPECTED_PROVINCES.has(row.province_code)) errors.push(`${path}.province_code is invalid`);
    if (row.production_recipe_id !== null) errors.push('research leads cannot reference a production recipe');
    if (row.candidate_id !== null) errors.push('research leads cannot reference a research candidate');
    for (const sourceId of textArray(row.source_ids, `${path}.source_ids`, errors)) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
    validateClaims(row.claims, `lead:${row.lead_id}`, `${path}.claims`, sourceIds, directions, errors);
    for (const field of ['ingredient_shapes', 'known_structure', 'forbidden_shortcuts', 'open_questions', 'product_destinations']) textArray(row[field], `${path}.${field}`, errors);
    for (const destination of asArray(row.product_destinations)) if (!DESTINATIONS.has(destination)) errors.push(`${path}.product_destinations contains invalid ${destination}`);
  });
}

function validateSupport(assessment, sourceIds, directions, errors) {
  const families = asArray(assessment.family_model);
  if (families.length !== 5) errors.push('family_model must contain exactly 5 items');
  families.forEach((row, index) => {
    const path = `family_model[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    for (const field of ['family_id', 'name', 'meal_structure', 'evidence_status']) if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
  });
  for (const field of ['adaptation_boundaries', 'safety_boundaries']) if (!Array.isArray(assessment[field]) || assessment[field].length === 0) errors.push(`${field} must be a non-empty array`);
  asArray(assessment.safety_boundaries).forEach((row, index) => {
    const path = `safety_boundaries[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    if (!hasText(row.safety_id) || row.evidence_status !== 'principle_only') errors.push(`${path} must remain principle_only with safety_id`);
    const sourceList = textArray(row.source_ids, `${path}.source_ids`, errors);
    for (const sourceId of sourceList) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
    if (!sourceList.some(id => directions.get(id)?.proves?.has(`safety:${row.safety_id}:principle`))) errors.push(`${path} lacks safety principle proof`);
    textArray(row.required_controls, `${path}.required_controls`, errors);
    if (!hasText(row.endpoint_note)) errors.push(`${path}.endpoint_note must be non-empty`);
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
    if (!['recommend', 'pantry'].includes(row.mode)) errors.push(`${path}.mode is invalid`);
    if (!['normal', 'quick', 'fresh', 'batch'].includes(row.intent)) errors.push(`${path}.intent is invalid`);
    for (const field of ['input_items', 'expected_family_ids', 'forbidden_claims']) textArray(row[field], `${path}.${field}`, errors, { allowEmpty: field === 'expected_family_ids' });
    if (!isObject(row.human_review) || row.human_review.status !== 'pending') errors.push(`${path}.human_review.status must remain pending`);
  });
}

function validateBaseline({ recipeLibrary, regionalResearch, regionalAtlas, regionalMappings }, errors) {
  const region = asArray(regionalAtlas?.regions).find(row => row?.region_id === EXPECTED_REGION);
  if (!region || !sameSet(asArray(region.province_codes), EXPECTED_PROVINCES)) errors.push('regional atlas must contain Lingnan Hong Kong Macao region and five province nodes');
  for (const code of EXPECTED_PROVINCES) {
    const node = asArray(regionalAtlas?.province_nodes).find(row => row?.atlas_code === code);
    if (!node || node.region_id !== EXPECTED_REGION) errors.push(`regional atlas must contain ${code} under lingnan_hk_macao`);
  }
  if (asArray(recipeLibrary?.recipes).length !== 72) errors.push('recipe library baseline must remain 72');
  if (asArray(regionalResearch?.entries).length !== 24) errors.push('regional research baseline must remain 24');
  const inScope = row => asArray(row?.region_ids).includes(EXPECTED_REGION);
  const productionMappings = asArray(regionalMappings?.production_recipe_mappings).filter(inScope);
  const candidateMappings = asArray(regionalMappings?.research_candidate_mappings).filter(inScope);
  if (!sameSet(productionMappings.map(row => row.source_id), EXPECTED_PRODUCTION)) errors.push('regional production mappings must remain exactly five');
  if (candidateMappings.length !== 0) errors.push('regional candidate mapping baseline must remain zero');
  const recipeIds = new Set(asArray(recipeLibrary?.recipes).filter(isObject).map(row => row.id));
  for (const id of EXPECTED_PRODUCTION) if (!recipeIds.has(id)) errors.push(`recipe library is missing ${id}`);
}

function validateInvariants(assessment, errors) {
  const production = new Map(asArray(assessment.production_recipe_audits).filter(isObject).map(row => [row.recipe_id, row]));
  const leads = new Map(asArray(assessment.concrete_research_leads).filter(isObject).map(row => [row.lead_id, row]));
  if (leads.get('cantonese-claypot-rice-technique')?.claims?.household_vessel_equivalence?.verdict !== 'not_proven') errors.push('household vessel equivalence must remain not_proven');
  if (production.get('guangxi-five-color-glutinous-rice')?.claims?.guangxi_pineapple_rice_regional_identity?.verdict !== 'not_proven') errors.push('Guangxi pineapple rice regional identity must remain not_proven');
  if (production.get('guangxi-five-color-glutinous-rice')?.claims?.food_powder_as_traditional_equivalence?.verdict !== 'not_proven') errors.push('food powder traditional equivalence must remain not_proven');
  if (production.get('hainan-cai-bao-rice')?.claims?.single_vessel_one_pot_equivalence?.verdict !== 'not_proven') errors.push('Dingan cai bao single-vessel equivalence must remain not_proven');
  if (leads.get('macao-portuguese-style-seafood-rice')?.claims?.portuguese_chicken_as_rice_pot?.verdict !== 'not_proven') errors.push('Portuguese chicken as rice pot must remain not_proven');
}

export function validateLingnanHkMacaoOnePotResearch({ assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings } = {}) {
  if (!isObject(assessment)) return ['assessment must be an object'];
  const errors = [];
  if (assessment.schema_version !== 1) errors.push('schema_version must be 1');
  if (!hasText(assessment.assessment_version)) errors.push('assessment_version must be non-empty');
  if (assessment.region_id !== EXPECTED_REGION) errors.push('region_id must be lingnan_hk_macao');
  if (!sameSet(asArray(assessment.province_codes), EXPECTED_PROVINCES)) errors.push('province_codes must contain CN-GD CN-GX CN-HI CN-HK CN-MO');
  const { ids, directions } = validateSources(assessment, errors);
  validateAudits(assessment, ids, directions, errors);
  validateLeads(assessment, ids, directions, errors);
  validateSupport(assessment, ids, directions, errors);
  validateJourneys(assessment, errors);
  validateBaseline({ recipeLibrary, regionalResearch, regionalAtlas, regionalMappings }, errors);
  validateInvariants(assessment, errors);
  return errors;
}

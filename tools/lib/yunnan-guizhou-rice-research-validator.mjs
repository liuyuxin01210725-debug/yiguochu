const EXPECTED_REGION = 'yunnan_guizhou';
const EXPECTED_PROVINCES = new Set(['CN-YN', 'CN-GZ']);
const EXPECTED_PRODUCTION = new Set(['dai-pineapple-purple-rice', 'guizhou-dong-community-rice']);
const EXPECTED_CANDIDATES = new Set([
  'yunnan-copper-pot-potato-rice-home',
  'yunnan-mushroom-potato-rice',
  'yunnan-corn-chicken-rice',
  'yunnan-ham-flavor-rice-pot',
]);
const EXPECTED_LEADS = new Set([
  'yunnan-jiangchuan-copper-pot-potato-rice',
  'yunnan-dai-pineapple-glutinous-rice',
  'guizhou-dong-shefan-parboiled-rice',
]);
const VERDICTS = new Set(['supported', 'not_proven', 'contradicted']);
const DESTINATIONS = new Set([
  'recipe_evidence', 'candidate_evidence', 'template_evidence', 'ratio_rule',
  'new_family_research', 'research_only', 'substitution_rule',
]);
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
  const rows = asArray(assessment.source_refs);
  if (!Array.isArray(assessment.source_refs)) errors.push('source_refs must be an array');
  if (rows.length !== 9) errors.push('source_refs must contain exactly 9 items');
  const ids = new Set();
  const proofIndex = new Map();
  rows.forEach((row, index) => {
    const path = `source_refs[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    for (const field of ['source_id', 'title', 'url', 'publisher', 'published_at', 'retrieved_at', 'source_grade', 'evidence_summary']) {
      if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
    }
    if (ids.has(row.source_id)) errors.push(`duplicate source_id ${row.source_id}`);
    if (hasText(row.source_id)) ids.add(row.source_id);
    try {
      const url = new URL(row.url);
      if (url.protocol !== 'https:') errors.push(`${path}.url must use HTTPS`);
      if (url.hostname === 'yiguochu.pages.dev') errors.push('project canonical URL cannot be regional evidence');
    } catch { errors.push(`${path}.url must be valid`); }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.published_at || '')) errors.push(`${path}.published_at must be YYYY-MM-DD`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.retrieved_at || '')) errors.push(`${path}.retrieved_at must be YYYY-MM-DD`);
    if (!['A', 'B', 'C'].includes(row.source_grade)) errors.push(`${path}.source_grade is invalid`);
    const proves = textArray(row.proves, `${path}.proves`, errors, { allowEmpty: true });
    const doesNotProve = textArray(row.does_not_prove, `${path}.does_not_prove`, errors, { allowEmpty: true });
    const contradicts = row.contradicts === undefined
      ? []
      : textArray(row.contradicts, `${path}.contradicts`, errors, { allowEmpty: true });
    const directionalClaims = [...proves, ...doesNotProve, ...contradicts];
    if (new Set(directionalClaims).size !== directionalClaims.length) errors.push(`${path} claim directions must not overlap`);
    proofIndex.set(row.source_id, {
      proves: new Set(proves),
      does_not_prove: new Set(doesNotProve),
      contradicts: new Set(contradicts),
    });
  });
  return { ids, proofIndex };
}

function validateClaims(claims, subjectToken, path, sourceIds, proofIndex, errors) {
  if (!isObject(claims) || Object.keys(claims).length === 0) {
    errors.push(`${path} must be a non-empty object`);
    return;
  }
  for (const [claimId, rawClaim] of Object.entries(claims)) {
    const claimPath = `${path}.${claimId}`;
    const claim = asObject(rawClaim);
    if (!isObject(rawClaim)) errors.push(`${claimPath} must be an object`);
    if (!VERDICTS.has(claim.verdict)) errors.push(`${claimPath}.verdict is invalid`);
    if (!hasText(claim.reason)) errors.push(`${claimPath}.reason must be non-empty`);
    const evidence = textArray(claim.evidence_source_ids, `${claimPath}.evidence_source_ids`, errors);
    const direction = claim.verdict === 'supported'
      ? 'proves'
      : claim.verdict === 'not_proven' ? 'does_not_prove' : 'contradicts';
    for (const sourceId of evidence) {
      if (!sourceIds.has(sourceId)) errors.push(`${claimPath} references unknown source ${sourceId}`);
      if (!proofIndex.get(sourceId)?.[direction]?.has(`${subjectToken}:${claimId}`)) {
        errors.push(`${claimPath} verdict ${claim.verdict} must be reverse-indexed under ${direction} by source ${sourceId}`);
      }
    }
  }
}

function validateAuditRows(rows, { kind, expected, sourceIds, proofIndex, errors }) {
  const idField = kind === 'production' ? 'recipe_id' : 'candidate_id';
  if (!Array.isArray(rows)) errors.push(`${kind}_recipe_audits must be an array`);
  const seen = [];
  asArray(rows).forEach((row, index) => {
    const path = `${kind === 'production' ? 'production_recipe_audits' : 'candidate_audits'}[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    const id = row[idField];
    if (!hasText(id)) errors.push(`${path}.${idField} must be non-empty`);
    else seen.push(id);
    if (!AUDIT_STATES.has(row.audit_state)) errors.push(`${path}.audit_state is invalid`);
    validateClaims(row.claims, `${kind}:${id}`, `${path}.claims`, sourceIds, proofIndex, errors);
    textArray(row.ingredient_shapes, `${path}.ingredient_shapes`, errors);
    textArray(row.forbidden_claims, `${path}.forbidden_claims`, errors);
    for (const destination of textArray(row.product_destinations, `${path}.product_destinations`, errors)) {
      if (!DESTINATIONS.has(destination)) errors.push(`${path}.product_destinations contains invalid ${destination}`);
    }
    const priority = asObject(row.priority);
    for (const field of ['product_score', 'regional_score', 'risk_penalty', 'total_score']) {
      if (!Number.isInteger(priority[field])) errors.push(`${path}.priority.${field} must be an integer`);
    }
    if (priority.total_score !== priority.product_score + priority.regional_score - priority.risk_penalty) {
      errors.push(`${path}.priority.total_score is inconsistent`);
    }
    if (!hasText(row.decision_reason)) errors.push(`${path}.decision_reason must be non-empty`);
  });
  if (!sameSet(seen, expected)) errors.push(`${kind} audit IDs must match the fixed regional baseline`);
}

function validateLeads(assessment, sourceIds, proofIndex, errors) {
  const rows = asArray(assessment.concrete_research_leads);
  if (!Array.isArray(assessment.concrete_research_leads)) errors.push('concrete_research_leads must be an array');
  const seen = [];
  rows.forEach((row, index) => {
    const path = `concrete_research_leads[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    if (hasText(row.lead_id)) seen.push(row.lead_id); else errors.push(`${path}.lead_id must be non-empty`);
    for (const field of ['name', 'province_code', 'family_id', 'meal_structure', 'decision_reason']) {
      if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
    }
    if (!EXPECTED_PROVINCES.has(row.province_code)) errors.push(`${path}.province_code is out of scope`);
    for (const sourceId of textArray(row.source_ids, `${path}.source_ids`, errors)) {
      if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
    }
    validateClaims(row.claims, `lead:${row.lead_id}`, `${path}.claims`, sourceIds, proofIndex, errors);
    textArray(row.ingredient_shapes, `${path}.ingredient_shapes`, errors);
    textArray(row.known_structure, `${path}.known_structure`, errors);
    textArray(row.forbidden_shortcuts, `${path}.forbidden_shortcuts`, errors);
    textArray(row.open_questions, `${path}.open_questions`, errors);
    for (const destination of textArray(row.product_destinations, `${path}.product_destinations`, errors)) {
      if (!DESTINATIONS.has(destination)) errors.push(`${path}.product_destinations contains invalid ${destination}`);
    }
    if (row.creates_production_recipe !== false) errors.push(`${path}.creates_production_recipe must be false`);
    if (row.creates_research_candidate !== false) errors.push(`${path}.creates_research_candidate must be false`);
  });
  if (!sameSet(seen, EXPECTED_LEADS)) errors.push('research lead IDs must match the fixed regional scope');
}

function validateSupportingRows(assessment, sourceIds, errors) {
  if (asArray(assessment.family_model).length !== 3) errors.push('family_model must contain exactly 3 items');
  if (asArray(assessment.adaptation_boundaries).length !== 4) errors.push('adaptation_boundaries must contain exactly 4 items');
  if (asArray(assessment.safety_boundaries).length !== 4) errors.push('safety_boundaries must contain exactly 4 items');
  for (const [field, idField] of [['family_model', 'family_id'], ['adaptation_boundaries', 'boundary_id'], ['safety_boundaries', 'safety_id']]) {
    asArray(assessment[field]).forEach((row, index) => {
      const path = `${field}[${index}]`;
      if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
      if (!hasText(row[idField])) errors.push(`${path}.${idField} must be non-empty`);
      for (const sourceId of textArray(row.source_ids, `${path}.source_ids`, errors)) {
        if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
      }
    });
  }
  const safetyIds = new Set(asArray(assessment.safety_boundaries).filter(isObject).map(row => row.safety_id));
  for (const expected of ['potato-sprout-green-control', 'identified-mushroom-only-and-cook-through', 'cured-meat-cook-through-and-salt', 'poultry-cook-through']) {
    if (!safetyIds.has(expected)) errors.push(`missing safety boundary ${expected}`);
  }
  asArray(assessment.safety_boundaries).filter(isObject).forEach((row, index) => {
    if (row.evidence_status !== 'principle_only') errors.push(`safety_boundaries[${index}].evidence_status must be principle_only`);
    if (!hasText(row.endpoint_note)) errors.push(`safety_boundaries[${index}].endpoint_note must be non-empty`);
    textArray(row.required_controls, `safety_boundaries[${index}].required_controls`, errors);
  });
}

function validateJourneys(assessment, errors) {
  const rows = asArray(assessment.journey_cases);
  if (!Array.isArray(assessment.journey_cases)) errors.push('journey_cases must be an array');
  if (rows.length !== 12) errors.push('journey_cases must contain exactly 12 items');
  const ids = new Set();
  rows.forEach((row, index) => {
    const path = `journey_cases[${index}]`;
    if (!isObject(row)) { errors.push(`${path} must be an object`); return; }
    for (const field of ['journey_id', 'province_code', 'mode', 'intent', 'expected_structure', 'expected_outcome']) {
      if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
    }
    if (ids.has(row.journey_id)) errors.push(`duplicate journey_id ${row.journey_id}`); else ids.add(row.journey_id);
    if (!EXPECTED_PROVINCES.has(row.province_code)) errors.push(`${path}.province_code is out of scope`);
    if (!['recommend', 'pantry'].includes(row.mode)) errors.push(`${path}.mode is invalid`);
    if (!['normal', 'quick', 'fresh', 'batch'].includes(row.intent)) errors.push(`${path}.intent is invalid`);
    textArray(row.input_items, `${path}.input_items`, errors);
    textArray(row.expected_family_ids, `${path}.expected_family_ids`, errors, { allowEmpty: true });
    textArray(row.forbidden_claims, `${path}.forbidden_claims`, errors);
    const review = asObject(row.human_review);
    if (review.status !== 'pending') errors.push(`${path}.human_review.status must remain pending`);
    for (const field of ['family_fit', 'household_feasibility', 'identity_preserved', 'notes']) {
      if (typeof review[field] !== 'string') errors.push(`${path}.human_review.${field} must be a string`);
    }
  });
}

function validateCrossReferences({ assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings }, errors) {
  const region = asArray(regionalAtlas?.regions).find(row => row?.region_id === EXPECTED_REGION);
  if (!region || !sameSet(asArray(region.province_codes), EXPECTED_PROVINCES)) errors.push('regional atlas must contain the Yunnan-Guizhou region and both province nodes');
  for (const code of EXPECTED_PROVINCES) {
    const province = asArray(regionalAtlas?.province_nodes).find(row => row?.atlas_code === code);
    if (!province || province.region_id !== EXPECTED_REGION) errors.push(`regional atlas must contain ${code} under yunnan_guizhou`);
  }
  const recipes = new Set(asArray(recipeLibrary?.recipes).filter(isObject).map(row => row.id));
  for (const id of EXPECTED_PRODUCTION) if (!recipes.has(id)) errors.push(`recipe library is missing ${id}`);
  const research = new Set(asArray(regionalResearch?.entries).filter(isObject).map(row => row.atlas_id));
  for (const id of EXPECTED_CANDIDATES) if (!research.has(id)) errors.push(`regional research ledger is missing ${id}`);
  const productionMappings = asArray(regionalMappings?.production_recipe_mappings).filter(isObject).filter(row => asArray(row.region_ids).includes(EXPECTED_REGION));
  const candidateMappings = asArray(regionalMappings?.research_candidate_mappings).filter(isObject).filter(row => asArray(row.region_ids).includes(EXPECTED_REGION));
  if (!sameSet(productionMappings.map(row => row.source_id), EXPECTED_PRODUCTION)) errors.push('regional production mappings must remain exactly two');
  if (!sameSet(candidateMappings.map(row => row.source_id), EXPECTED_CANDIDATES)) errors.push('regional candidate mappings must remain exactly four');
  for (const row of [...productionMappings, ...candidateMappings]) {
    if (!asArray(row.province_codes).every(code => EXPECTED_PROVINCES.has(code))) errors.push(`${row.source_id} mapping leaves the Yunnan-Guizhou scope`);
  }
  void assessment;
}

function validateInvariantClaims(assessment, errors) {
  const production = new Map(asArray(assessment.production_recipe_audits).filter(isObject).map(row => [row.recipe_id, row]));
  const candidates = new Map(asArray(assessment.candidate_audits).filter(isObject).map(row => [row.candidate_id, row]));
  if (candidates.get('yunnan-copper-pot-potato-rice-home')?.claims?.household_vessel_equivalence?.verdict !== 'not_proven') errors.push('household vessel equivalence must remain not_proven');
  if (production.get('dai-pineapple-purple-rice')?.claims?.mango_substitution_equivalence?.verdict !== 'not_proven') errors.push('mango substitution equivalence must remain not_proven');
  if (production.get('guizhou-dong-community-rice')?.claims?.raw_rice_braise_as_traditional_process?.verdict !== 'not_proven') errors.push('raw-rice braise as traditional process must remain not_proven');
  if (candidates.get('yunnan-mushroom-potato-rice')?.claims?.free_wild_mushroom_substitution?.verdict !== 'contradicted') errors.push('free wild-mushroom substitution must remain contradicted');
}

export function validateYunnanGuizhouRiceResearch({
  assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings,
} = {}) {
  if (!isObject(assessment)) return ['assessment must be an object'];
  const errors = [];
  if (assessment.schema_version !== 1) errors.push('schema_version must be 1');
  if (!hasText(assessment.assessment_version)) errors.push('assessment_version must be non-empty');
  if (assessment.region_id !== EXPECTED_REGION) errors.push('region_id must be yunnan_guizhou');
  if (!sameSet(asArray(assessment.province_codes), EXPECTED_PROVINCES)) errors.push('province_codes must contain CN-YN and CN-GZ');
  const { ids: sourceIds, proofIndex } = validateSources(assessment, errors);
  validateAuditRows(assessment.production_recipe_audits, { kind: 'production', expected: EXPECTED_PRODUCTION, sourceIds, proofIndex, errors });
  validateAuditRows(assessment.candidate_audits, { kind: 'candidate', expected: EXPECTED_CANDIDATES, sourceIds, proofIndex, errors });
  validateLeads(assessment, sourceIds, proofIndex, errors);
  validateSupportingRows(assessment, sourceIds, errors);
  validateJourneys(assessment, errors);
  validateCrossReferences({ assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings }, errors);
  validateInvariantClaims(assessment, errors);
  return errors;
}

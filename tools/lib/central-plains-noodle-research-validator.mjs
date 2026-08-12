const EXPECTED_PRODUCTION_IDS = new Set(['north-china-green-bean-braised-noodles']);
const EXPECTED_CANDIDATE_IDS = new Set([
  'henan-bean-pork-steamed-noodles',
  'henan-celery-pork-steamed-noodles',
  'henan-cabbage-mushroom-steamed-noodles',
  'henan-home-one-pot-steamed-braised-noodles',
]);
const EXPECTED_LEAD_FAMILIES = new Map([
  ['henan-huimian-broth-pulled-noodle', 'broth-pulled-noodle'],
  ['henan-luoyang-fermented-sour-noodle-bowl', 'fermented-sour-noodle-bowl'],
  ['henan-wugang-mohu-grain-vegetable-bowl', 'grain-vegetable-thick-bowl'],
]);
const EXPECTED_SAFETY_IDS = new Set(['bean-cook-through', 'pork-cook-through-cross-contamination']);
const EXPECTED_FAMILY_IDS = new Set([
  'noodle-braise', 'noodle-steam-braise', 'broth-pulled-noodle',
  'fermented-sour-noodle-bowl', 'grain-vegetable-thick-bowl',
]);
const VERDICTS = new Set(['supported', 'not_proven', 'contradicted']);
const AUDIT_STATES = new Set(['evidence_checked', 'needs_more_evidence', 'rejected']);
const DESTINATIONS = new Set([
  'recipe_evidence', 'template_evidence', 'taxonomy_rule', 'ratio_rule',
  'content_only', 'research_only', 'new_family_research', 'rejected',
]);

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const asObject = value => isObject(value) ? value : {};
const asArray = value => Array.isArray(value) ? value : [];
const hasText = value => typeof value === 'string' && value.trim().length > 0;

function sameStringSet(values, expected) {
  return values.length === expected.size && new Set(values).size === expected.size
    && values.every(value => expected.has(value));
}

function validateTextArray(value, path, errors, { allowEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return [];
  }
  if (!allowEmpty && value.length === 0) errors.push(`${path} must be non-empty`);
  if (value.some(item => !hasText(item))) errors.push(`${path} must contain non-empty strings`);
  if (new Set(value).size !== value.length) errors.push(`${path} must not contain duplicates`);
  return value.filter(hasText);
}

function validatePriority(priority, path, errors) {
  if (!isObject(priority)) {
    errors.push(`${path} must be an object`);
    return;
  }
  for (const field of ['product_score', 'regional_score', 'risk_penalty', 'total_score']) {
    if (!Number.isInteger(priority[field])) errors.push(`${path}.${field} must be an integer`);
  }
  if (Number.isInteger(priority.product_score) && Number.isInteger(priority.regional_score)
    && Number.isInteger(priority.risk_penalty)
    && priority.total_score !== priority.product_score + priority.regional_score - priority.risk_penalty) {
    errors.push(`${path}.total_score is inconsistent`);
  }
}

function validateSources(assessment, errors) {
  const sources = asArray(assessment.source_refs);
  if (!Array.isArray(assessment.source_refs)) errors.push('source_refs must be an array');
  if (sources.length !== 8) errors.push('source_refs must contain exactly 8 items');
  const sourceIds = new Set();
  const proofIndex = new Map();
  sources.forEach((sourceValue, index) => {
    const path = `source_refs[${index}]`;
    if (!isObject(sourceValue)) {
      errors.push(`${path} must be an object`);
      return;
    }
    const source = sourceValue;
    for (const field of ['source_id', 'title', 'url', 'publisher', 'published_at', 'retrieved_at', 'source_grade', 'evidence_summary']) {
      if (!hasText(source[field])) errors.push(`${path}.${field} must be non-empty`);
    }
    if (sourceIds.has(source.source_id)) errors.push(`duplicate source_id ${source.source_id}`);
    if (hasText(source.source_id)) sourceIds.add(source.source_id);
    if (hasText(source.url)) {
      try {
        const parsed = new URL(source.url);
        if (parsed.protocol !== 'https:') errors.push(`${path}.url must use HTTPS`);
        if (parsed.hostname === 'yiguochu.pages.dev') errors.push('project canonical URL cannot be regional evidence');
      } catch {
        errors.push(`${path}.url must be valid`);
      }
    }
    for (const field of ['published_at', 'retrieved_at']) {
      if (hasText(source[field]) && !/^\d{4}-\d{2}-\d{2}$/.test(source[field])) errors.push(`${path}.${field} must be YYYY-MM-DD`);
    }
    if (hasText(source.retrieved_at) && source.retrieved_at > '2026-07-26') errors.push(`${path}.retrieved_at cannot be in the future`);
    if (!['A', 'B', 'C'].includes(source.source_grade)) errors.push(`${path}.source_grade is invalid`);
    const proves = validateTextArray(source.proves, `${path}.proves`, errors);
    validateTextArray(source.does_not_prove, `${path}.does_not_prove`, errors, { allowEmpty: true });
    for (const proof of proves) {
      if (!proofIndex.has(proof)) proofIndex.set(proof, new Set());
      proofIndex.get(proof).add(source.source_id);
    }
  });
  return { sourceIds, proofIndex };
}

function validateClaim(claimValue, proofKey, sourceIds, proofIndex, path, errors) {
  if (!isObject(claimValue)) {
    errors.push(`${path} must be an object`);
    return;
  }
  const claim = claimValue;
  if (!VERDICTS.has(claim.verdict)) errors.push(`${path}.verdict is invalid`);
  const evidenceIds = validateTextArray(claim.evidence_source_ids, `${path}.evidence_source_ids`, errors);
  for (const sourceId of evidenceIds) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
  if (!hasText(claim.reason)) errors.push(`${path}.reason must be non-empty`);
  if (claim.verdict === 'supported') {
    const provingSources = proofIndex.get(proofKey) || new Set();
    if (!evidenceIds.some(sourceId => provingSources.has(sourceId))) errors.push(`${path} supported claim lacks reverse proof ${proofKey}`);
  }
}

function validateProduction(assessment, inputs, sourceIds, proofIndex, errors) {
  const audits = asArray(assessment.production_recipe_audits);
  if (!Array.isArray(assessment.production_recipe_audits)) errors.push('production_recipe_audits must be an array');
  if (!sameStringSet(audits.filter(isObject).map(row => row.recipe_id), EXPECTED_PRODUCTION_IDS)) {
    errors.push('production audit IDs must match the fixed Central Plains production recipe');
  }
  const recipes = new Map(asArray(inputs.recipeLibrary?.recipes).filter(isObject).map(row => [row.id, row]));
  const mappings = new Map(asArray(inputs.regionalMappings?.production_recipe_mappings).filter(isObject).map(row => [row.source_id, row]));
  audits.forEach((auditValue, index) => {
    const path = `production_recipe_audits[${index}]`;
    if (!isObject(auditValue)) {
      errors.push(`${path} must be an object`);
      return;
    }
    const audit = auditValue;
    const recipe = recipes.get(audit.recipe_id);
    if (!recipe) errors.push(`${path} references a recipe missing from recipe-library.json`);
    if (recipe && recipe.status !== 'auto_approved') errors.push(`${path} recipe must remain auto_approved`);
    const mapping = mappings.get(audit.recipe_id);
    if (!mapping || !asArray(mapping.region_ids).includes('central_plains')) errors.push(`${path} mapping must include central_plains`);
    if (mapping && asArray(mapping.province_codes).length !== 0) errors.push(`${path} mapping cannot acquire a Henan province code`);
    if (!AUDIT_STATES.has(audit.audit_state)) errors.push(`${path}.audit_state is invalid`);
    if (audit.regional_scope_decision !== 'cross_regional_chinese') errors.push('production audit must remain cross_regional_chinese');
    const claims = asObject(audit.claims);
    if (Object.keys(claims).length === 0) errors.push(`${path}.claims must be non-empty`);
    for (const [claimId, claim] of Object.entries(claims)) {
      validateClaim(claim, `production:${audit.recipe_id}:${claimId}`, sourceIds, proofIndex, `${path}.claims.${claimId}`, errors);
    }
    if (claims.henan_specific_origin?.verdict !== 'not_proven') errors.push('Henan-specific origin must remain not_proven');
    const roles = asArray(audit.ingredient_roles);
    if (roles.length === 0) errors.push(`${path}.ingredient_roles must be non-empty`);
    roles.forEach((row, roleIndex) => {
      if (!isObject(row)) errors.push(`${path}.ingredient_roles[${roleIndex}] must be an object`);
      else for (const field of ['item', 'role', 'evidence_status']) if (!hasText(row[field])) errors.push(`${path}.ingredient_roles[${roleIndex}].${field} must be non-empty`);
    });
    const destinations = validateTextArray(audit.product_destinations, `${path}.product_destinations`, errors);
    for (const value of destinations) if (!DESTINATIONS.has(value)) errors.push(`${path} has invalid destination ${value}`);
    validatePriority(audit.priority, `${path}.priority`, errors);
    if (!hasText(audit.decision_reason)) errors.push(`${path}.decision_reason must be non-empty`);
  });
}

function validateCandidates(assessment, inputs, sourceIds, proofIndex, errors) {
  const audits = asArray(assessment.candidate_audits);
  if (!Array.isArray(assessment.candidate_audits)) errors.push('candidate_audits must be an array');
  if (!sameStringSet(audits.filter(isObject).map(row => row.candidate_id), EXPECTED_CANDIDATE_IDS)) {
    errors.push('candidate audit IDs must match the fixed four Central Plains candidates');
  }
  const candidates = new Map(asArray(inputs.regionalResearch?.entries).filter(isObject).map(row => [row.atlas_id, row]));
  const mappings = new Map(asArray(inputs.regionalMappings?.research_candidate_mappings).filter(isObject).map(row => [row.source_id, row]));
  audits.forEach((auditValue, index) => {
    const path = `candidate_audits[${index}]`;
    if (!isObject(auditValue)) {
      errors.push(`${path} must be an object`);
      return;
    }
    const audit = auditValue;
    if (!candidates.has(audit.candidate_id)) errors.push(`${path} references a missing regional research candidate`);
    const mapping = mappings.get(audit.candidate_id);
    if (!mapping || JSON.stringify(mapping.province_codes) !== JSON.stringify(['CN-HA'])) errors.push(`${path} mapping must be CN-HA`);
    if (!mapping || !asArray(mapping.region_ids).includes('central_plains')) errors.push(`${path} mapping must include central_plains`);
    if (!AUDIT_STATES.has(audit.audit_state)) errors.push(`${path}.audit_state is invalid`);
    const claims = asObject(audit.claims);
    if (Object.keys(claims).length === 0) errors.push(`${path}.claims must be non-empty`);
    for (const [claimId, claim] of Object.entries(claims)) {
      validateClaim(claim, `candidate:${audit.candidate_id}:${claimId}`, sourceIds, proofIndex, `${path}.claims.${claimId}`, errors);
    }
    validateTextArray(audit.ingredient_shapes, `${path}.ingredient_shapes`, errors);
    validateTextArray(audit.shape_distinctions, `${path}.shape_distinctions`, errors);
    const destinations = validateTextArray(audit.product_destinations, `${path}.product_destinations`, errors);
    for (const value of destinations) if (!DESTINATIONS.has(value)) errors.push(`${path} has invalid destination ${value}`);
    validatePriority(audit.priority, `${path}.priority`, errors);
    if (!hasText(audit.decision_reason)) errors.push(`${path}.decision_reason must be non-empty`);
  });

  const byId = new Map(audits.filter(isObject).map(row => [row.candidate_id, row]));
  if (byId.get('henan-bean-pork-steamed-noodles')?.claims?.henan_exclusive_identity?.verdict !== 'not_proven') {
    errors.push('bean-pork Henan-exclusive identity must remain not_proven');
  }
  if (byId.get('henan-celery-pork-steamed-noodles')?.claims?.fixed_regional_core?.verdict !== 'not_proven') {
    errors.push('celery fixed regional core must remain not_proven');
  }
  if (byId.get('henan-cabbage-mushroom-steamed-noodles')?.claims?.fixed_regional_core?.verdict !== 'not_proven') {
    errors.push('cabbage-mushroom fixed regional core must remain not_proven');
  }
  const onePot = byId.get('henan-home-one-pot-steamed-braised-noodles');
  if (onePot?.claims?.traditional_single_pot_identity?.verdict !== 'not_proven') errors.push('traditional single-pot identity must remain not_proven');
  if (onePot?.claims?.vessel_process_equivalence?.verdict !== 'not_proven') errors.push('vessel-process equivalence must remain not_proven');
}

function validateLeads(assessment, sourceIds, proofIndex, errors) {
  const leads = asArray(assessment.concrete_research_leads);
  if (!Array.isArray(assessment.concrete_research_leads)) errors.push('concrete_research_leads must be an array');
  if (!sameStringSet(leads.filter(isObject).map(row => row.lead_id), new Set(EXPECTED_LEAD_FAMILIES.keys()))) {
    errors.push('research lead IDs must match the fixed three Central Plains leads');
  }
  leads.forEach((leadValue, index) => {
    const path = `concrete_research_leads[${index}]`;
    if (!isObject(leadValue)) {
      errors.push(`${path} must be an object`);
      return;
    }
    const lead = leadValue;
    if (!hasText(lead.lead_id) || !hasText(lead.name)) errors.push(`${path} must have lead_id and name`);
    if (lead.family_id !== EXPECTED_LEAD_FAMILIES.get(lead.lead_id)) errors.push(`${path}.family_id does not match the lead`);
    if (lead.production_recipe_id !== null) errors.push('research leads cannot reference a production recipe');
    const sourceRefs = validateTextArray(lead.source_ids, `${path}.source_ids`, errors);
    for (const sourceId of sourceRefs) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
    const proofKey = `lead:${lead.lead_id}:regional_structure`;
    const provingSources = proofIndex.get(proofKey) || new Set();
    if (!sourceRefs.some(sourceId => provingSources.has(sourceId))) errors.push(`${path} lacks regional structure proof`);
    validateTextArray(lead.ingredient_shapes, `${path}.ingredient_shapes`, errors);
    validateTextArray(lead.known_structure, `${path}.known_structure`, errors);
    validateTextArray(lead.open_questions, `${path}.open_questions`, errors);
    const destinations = validateTextArray(lead.product_destinations, `${path}.product_destinations`, errors);
    if (!destinations.includes('new_family_research')) errors.push(`${path} must remain new_family_research`);
    for (const value of destinations) if (!DESTINATIONS.has(value)) errors.push(`${path} has invalid destination ${value}`);
    validatePriority(lead.priority, `${path}.priority`, errors);
    if (!hasText(lead.decision_reason)) errors.push(`${path}.decision_reason must be non-empty`);
  });
}

function validateFamiliesAndBoundaries(assessment, errors) {
  const families = asArray(assessment.family_model);
  if (!Array.isArray(assessment.family_model)) errors.push('family_model must be an array');
  if (!sameStringSet(families.filter(isObject).map(row => row.family_id), EXPECTED_FAMILY_IDS)) {
    errors.push('family_model must contain the fixed five families');
  }
  families.forEach((row, index) => {
    if (!isObject(row)) errors.push(`family_model[${index}] must be an object`);
    else for (const field of ['family_id', 'name', 'meal_structure', 'evidence_status']) if (!hasText(row[field])) errors.push(`family_model[${index}].${field} must be non-empty`);
  });
  const boundaries = asArray(assessment.adaptation_boundaries);
  if (!Array.isArray(assessment.adaptation_boundaries) || boundaries.length === 0) errors.push('adaptation_boundaries must be a non-empty array');
  boundaries.forEach((row, index) => {
    if (!isObject(row)) errors.push(`adaptation_boundaries[${index}] must be an object`);
    else for (const field of ['boundary_id', 'evidence_status', 'notes']) if (!hasText(row[field])) errors.push(`adaptation_boundaries[${index}].${field} must be non-empty`);
  });
}

function validateSafety(assessment, sourceIds, proofIndex, errors) {
  const rows = asArray(assessment.safety_boundaries);
  if (!Array.isArray(assessment.safety_boundaries)) errors.push('safety_boundaries must be an array');
  if (!sameStringSet(rows.filter(isObject).map(row => row.safety_id), EXPECTED_SAFETY_IDS)) errors.push('safety boundaries must contain bean and pork endpoints');
  rows.forEach((rowValue, index) => {
    const path = `safety_boundaries[${index}]`;
    if (!isObject(rowValue)) {
      errors.push(`${path} must be an object`);
      return;
    }
    const row = rowValue;
    const sourceRefs = validateTextArray(row.source_ids, `${path}.source_ids`, errors);
    for (const sourceId of sourceRefs) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
    const provingSources = proofIndex.get(`safety:${row.safety_id}:principle`) || new Set();
    if (!sourceRefs.some(sourceId => provingSources.has(sourceId))) errors.push(`${path} lacks safety principle proof`);
    if (row.evidence_status !== 'principle_only') errors.push(`${path}.evidence_status must remain principle_only`);
    if (!hasText(row.endpoint_note)) errors.push(`${path}.endpoint_note must be non-empty`);
    for (const forbidden of ['grams', 'minutes', 'liquid_ml']) if (Object.hasOwn(row, forbidden)) errors.push(`${path} cannot invent ${forbidden}`);
  });
}

function validateJourneys(assessment, errors) {
  const rows = asArray(assessment.journey_cases);
  if (!Array.isArray(assessment.journey_cases)) errors.push('journey_cases must be an array');
  if (rows.length !== 12) errors.push('journey_cases must contain exactly 12 items');
  const ids = rows.filter(isObject).map(row => row.journey_id);
  if (new Set(ids).size !== ids.length) errors.push('journey_ids must be unique');
  rows.forEach((rowValue, index) => {
    const path = `journey_cases[${index}]`;
    if (!isObject(rowValue)) {
      errors.push(`${path} must be an object`);
      return;
    }
    const row = rowValue;
    for (const field of ['journey_id', 'mode', 'intent', 'expected_outcome', 'reason']) if (!hasText(row[field])) errors.push(`${path}.${field} must be non-empty`);
    validateTextArray(row.input_items, `${path}.input_items`, errors);
    validateTextArray(row.expected_family_ids, `${path}.expected_family_ids`, errors, { allowEmpty: true });
    validateTextArray(row.forbidden_claims, `${path}.forbidden_claims`, errors);
    if (!isObject(row.human_review)) errors.push(`${path}.human_review must be an object`);
    else {
      if (row.human_review.status !== 'pending') errors.push(`${path}.human_review.status must remain pending`);
      for (const field of ['family_fit', 'household_feasibility', 'identity_preserved']) {
        if (row.human_review[field] !== null) errors.push(`${path}.human_review.${field} must be null`);
      }
      if (row.human_review.notes !== '') errors.push(`${path}.human_review.notes must be empty`);
    }
  });
}

export function validateCentralPlainsNoodleResearch({
  assessment,
  recipeLibrary,
  regionalResearch,
  regionalAtlas,
  regionalMappings,
} = {}) {
  if (!isObject(assessment)) return ['assessment must be an object'];
  const errors = [];
  if (assessment.schema_version !== 1) errors.push('schema_version must be 1');
  if (assessment.assessment_version !== 'central-plains-noodle-research-v1-20260726') errors.push('assessment_version is invalid');
  if (assessment.region_id !== 'central_plains') errors.push('region_id must be central_plains');
  if (JSON.stringify(assessment.province_codes) !== JSON.stringify(['CN-HA'])) errors.push('province_codes must contain only CN-HA');

  const atlasRegion = asArray(regionalAtlas?.regions).find(row => row?.region_id === 'central_plains');
  const atlasProvince = asArray(regionalAtlas?.province_nodes).find(row => row?.atlas_code === 'CN-HA');
  if (!atlasRegion) errors.push('regional atlas must contain central_plains');
  if (!atlasProvince || atlasProvince.region_id !== 'central_plains') errors.push('regional atlas must contain CN-HA under central_plains');

  const { sourceIds, proofIndex } = validateSources(assessment, errors);
  const inputs = { recipeLibrary, regionalResearch, regionalMappings };
  validateProduction(assessment, inputs, sourceIds, proofIndex, errors);
  validateCandidates(assessment, inputs, sourceIds, proofIndex, errors);
  validateLeads(assessment, sourceIds, proofIndex, errors);
  validateFamiliesAndBoundaries(assessment, errors);
  validateSafety(assessment, sourceIds, proofIndex, errors);
  validateJourneys(assessment, errors);
  return errors;
}

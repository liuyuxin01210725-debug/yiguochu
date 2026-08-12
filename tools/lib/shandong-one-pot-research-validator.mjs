const EXPECTED_PRODUCTION_IDS = new Set(['north-china-green-bean-braised-noodles']);
const EXPECTED_CANDIDATE_IDS = new Set([
  'shandong-cabbage-tofu-vermicelli-pot',
  'shandong-vegetable-cornmeal-one-pot',
  'shandong-seafood-staple-pot',
  'shandong-southwest-family-pot',
]);
const EXPECTED_LEAD_IDS = new Set([
  'shandong-haixian-dough-drop-soup',
  'shandong-ninghai-naofan',
]);
const EXPECTED_FAMILY_IDS = new Set([
  'noodle-braise',
  'grain-soy-composite-bowl',
  'seafood-noodle-broth',
  'pot-plus-ready-staple',
  'multi-process-pancake-meal',
]);
const EXPECTED_SAFETY_IDS = new Set([
  'bean-cook-through',
  'seafood-cook-through-cross-contamination',
]);
const VERDICTS = new Set(['supported', 'not_proven', 'contradicted']);
const AUDIT_STATES = new Set(['evidence_checked', 'needs_more_evidence', 'rejected']);
const DESTINATIONS = new Set([
  'recipe_evidence', 'template_evidence', 'taxonomy_rule', 'ratio_rule',
  'content_only', 'research_only', 'new_family_research', 'rejected',
]);
const MODES = new Set(['recommend', 'pantry']);
const INTENTS = new Set(['normal', 'quick', 'fresh', 'batch']);
const OUTCOMES = new Set([
  'supported_family_route', 'needs_more_evidence', 'unsupported_for_family',
  'research_lead_only', 'unsafe_or_unrecognized',
]);

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const asArray = value => Array.isArray(value) ? value : [];
const asObject = value => isObject(value) ? value : {};
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const uniqueText = value => Array.isArray(value) && value.every(hasText) && new Set(value).size === value.length;

function sameStringSet(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.size
    && actual.every(value => typeof value === 'string' && expected.has(value));
}

function validateKeys(value, allowed, path, errors) {
  if (!isObject(value)) return;
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${path} contains unknown field ${key}`);
}

function validateTextArray(value, path, errors, { allowEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return [];
  }
  if (!allowEmpty && value.length === 0) errors.push(`${path} must not be empty`);
  if (!uniqueText(value)) errors.push(`${path} must contain unique non-empty strings`);
  return value.filter(hasText);
}

function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function validatePriority(priority, path, errors) {
  if (!isObject(priority)) {
    errors.push(`${path} must be an object`);
    return;
  }
  validateKeys(priority, new Set(['product_score', 'regional_score', 'risk_penalty', 'total_score']), path, errors);
  for (const field of ['product_score', 'regional_score', 'risk_penalty', 'total_score']) {
    if (!Number.isInteger(priority[field])) errors.push(`${path}.${field} must be an integer`);
  }
  if (['product_score', 'regional_score', 'risk_penalty', 'total_score'].every(field => Number.isInteger(priority[field]))
    && priority.product_score + priority.regional_score - priority.risk_penalty !== priority.total_score) {
    errors.push(`${path}.total_score must equal product_score + regional_score - risk_penalty`);
  }
}

function validateSources(assessment, errors) {
  const sources = asArray(assessment.source_refs);
  if (!Array.isArray(assessment.source_refs)) errors.push('source_refs must be an array');
  if (sources.length !== 9) errors.push('source_refs must contain exactly 9 items');
  const sourceIds = new Set();
  const proofIndex = new Map();
  sources.forEach((sourceValue, index) => {
    const path = `source_refs[${index}]`;
    if (!isObject(sourceValue)) {
      errors.push(`${path} must be an object`);
      return;
    }
    const source = sourceValue;
    validateKeys(source, new Set([
      'source_id', 'title', 'url', 'publisher', 'published_at', 'retrieved_at',
      'source_grade', 'evidence_summary', 'proves', 'does_not_prove',
    ]), path, errors);
    for (const field of ['source_id', 'title', 'url', 'publisher', 'published_at', 'retrieved_at', 'source_grade', 'evidence_summary']) {
      if (!hasText(source[field])) errors.push(`${path}.${field} must be a non-empty string`);
    }
    if (hasText(source.source_id)) {
      if (sourceIds.has(source.source_id)) errors.push(`duplicate source_id ${source.source_id}`);
      sourceIds.add(source.source_id);
    }
    let parsed;
    try { parsed = new URL(source.url); } catch { parsed = null; }
    if (!parsed || parsed.protocol !== 'https:') errors.push(`${path}.url must be a direct HTTPS URL`);
    if (parsed?.hostname === 'yiguochu.pages.dev') errors.push('project canonical URL cannot be regional evidence');
    for (const field of ['published_at', 'retrieved_at']) {
      if (!isCalendarDate(source[field]) || source[field] > '2026-07-26') errors.push(`${path}.${field} must be a real date on or before 2026-07-26`);
    }
    if (source.source_grade !== 'A') errors.push(`${path}.source_grade must be A in this round`);
    const proves = validateTextArray(source.proves, `${path}.proves`, errors);
    const doesNotProve = validateTextArray(source.does_not_prove, `${path}.does_not_prove`, errors);
    for (const claimKey of proves) {
      if (doesNotProve.includes(claimKey)) errors.push(`${path} cannot both prove and not prove ${claimKey}`);
      if (!proofIndex.has(claimKey)) proofIndex.set(claimKey, []);
      proofIndex.get(claimKey).push(source.source_id);
    }
  });
  return { sourceIds, proofIndex };
}

function validateClaim(claimValue, claimKey, sourceIds, proofIndex, path, errors) {
  if (!isObject(claimValue)) {
    errors.push(`${path} must be an object`);
    return;
  }
  validateKeys(claimValue, new Set(['verdict', 'evidence_source_ids', 'reason']), path, errors);
  if (!VERDICTS.has(claimValue.verdict)) errors.push(`${path}.verdict is invalid`);
  const evidenceIds = validateTextArray(claimValue.evidence_source_ids, `${path}.evidence_source_ids`, errors);
  for (const sourceId of evidenceIds) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
  if (!hasText(claimValue.reason)) errors.push(`${path}.reason must be non-empty`);
  if (claimValue.verdict === 'supported') {
    const proofSources = new Set(proofIndex.get(claimKey) || []);
    if (!evidenceIds.some(sourceId => proofSources.has(sourceId))) errors.push(`supported claim requires evidence that proves ${claimKey}`);
  }
}

function validateProductionAudits(assessment, context, errors) {
  const audits = asArray(assessment.production_recipe_audits);
  if (!Array.isArray(assessment.production_recipe_audits)) errors.push('production_recipe_audits must be an array');
  if (!sameStringSet(audits.filter(isObject).map(row => row.recipe_id), EXPECTED_PRODUCTION_IDS)) {
    errors.push('production audit IDs must match the fixed Shandong production set');
  }
  const recipes = asArray(context.recipeLibrary?.recipes);
  const recipeIndex = new Map(recipes.filter(isObject).map(row => [row.id, row]));
  const mappingIndex = new Map(asArray(context.regionalMappings?.production_recipe_mappings).filter(isObject).map(row => [row.source_id, row]));
  audits.forEach((auditValue, index) => {
    const path = `production_recipe_audits[${index}]`;
    if (!isObject(auditValue)) {
      errors.push(`${path} must be an object`);
      return;
    }
    const audit = auditValue;
    validateKeys(audit, new Set([
      'recipe_id', 'audit_state', 'regional_scope_decision', 'claims', 'ingredient_roles',
      'product_destinations', 'priority', 'decision_reason',
    ]), path, errors);
    const recipe = recipeIndex.get(audit.recipe_id);
    if (!recipe) errors.push(`${path} references a recipe missing from recipe-library.json`);
    if (recipe && recipe.status !== 'auto_approved') errors.push(`${path} recipe must remain auto_approved`);
    const mapping = mappingIndex.get(audit.recipe_id);
    if (!mapping || !asArray(mapping.region_ids).includes('shandong')) errors.push(`${path} mapping must include Shandong`);
    if (mapping && asArray(mapping.province_codes).length !== 0) errors.push(`${path} mapping cannot acquire a Shandong province code`);
    if (!AUDIT_STATES.has(audit.audit_state)) errors.push(`${path}.audit_state is invalid`);
    if (audit.regional_scope_decision !== 'cross_regional_chinese') errors.push('production audit must remain cross_regional_chinese');
    const claims = asObject(audit.claims);
    if (Object.keys(claims).length === 0) errors.push(`${path}.claims must be non-empty`);
    for (const [claimId, claim] of Object.entries(claims)) {
      validateClaim(claim, `production:${audit.recipe_id}:${claimId}`, context.sourceIds, context.proofIndex, `${path}.claims.${claimId}`, errors);
    }
    if (claims.shandong_specific_origin?.verdict !== 'not_proven') errors.push('Shandong-specific origin must remain not_proven');
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

function validateCandidateAudits(assessment, context, errors) {
  const audits = asArray(assessment.candidate_audits);
  if (!Array.isArray(assessment.candidate_audits)) errors.push('candidate_audits must be an array');
  if (!sameStringSet(audits.filter(isObject).map(row => row.candidate_id), EXPECTED_CANDIDATE_IDS)) {
    errors.push('candidate audit IDs must match the fixed four Shandong candidates');
  }
  const researchIndex = new Map(asArray(context.regionalResearch?.entries).filter(isObject).map(row => [row.atlas_id, row]));
  const mappingIndex = new Map(asArray(context.regionalMappings?.research_candidate_mappings).filter(isObject).map(row => [row.source_id, row]));
  audits.forEach((auditValue, index) => {
    const path = `candidate_audits[${index}]`;
    if (!isObject(auditValue)) {
      errors.push(`${path} must be an object`);
      return;
    }
    const audit = auditValue;
    validateKeys(audit, new Set([
      'candidate_id', 'audit_state', 'claims', 'ingredient_shapes', 'shape_distinctions',
      'product_destinations', 'priority', 'decision_reason',
    ]), path, errors);
    if (!researchIndex.has(audit.candidate_id)) errors.push(`${path} references a missing regional research candidate`);
    const mapping = mappingIndex.get(audit.candidate_id);
    if (!mapping || JSON.stringify(mapping.province_codes) !== JSON.stringify(['CN-SD'])) errors.push(`${path} mapping must be CN-SD`);
    if (!mapping || !asArray(mapping.region_ids).includes('shandong')) errors.push(`${path} mapping must include Shandong`);
    if (!AUDIT_STATES.has(audit.audit_state)) errors.push(`${path}.audit_state is invalid`);
    const claims = asObject(audit.claims);
    if (Object.keys(claims).length === 0) errors.push(`${path}.claims must be non-empty`);
    for (const [claimId, claim] of Object.entries(claims)) {
      validateClaim(claim, `candidate:${audit.candidate_id}:${claimId}`, context.sourceIds, context.proofIndex, `${path}.claims.${claimId}`, errors);
    }
    validateTextArray(audit.ingredient_shapes, `${path}.ingredient_shapes`, errors);
    validateTextArray(audit.shape_distinctions, `${path}.shape_distinctions`, errors, { allowEmpty: true });
    const destinations = validateTextArray(audit.product_destinations, `${path}.product_destinations`, errors);
    for (const value of destinations) if (!DESTINATIONS.has(value)) errors.push(`${path} has invalid destination ${value}`);
    validatePriority(audit.priority, `${path}.priority`, errors);
    if (!hasText(audit.decision_reason)) errors.push(`${path}.decision_reason must be non-empty`);
  });
  const cabbage = audits.find(row => row?.candidate_id === 'shandong-cabbage-tofu-vermicelli-pot');
  if (cabbage?.claims?.vermicelli_as_fixed_core?.verdict !== 'not_proven') errors.push('vermicelli as fixed core must remain not_proven');
  if (cabbage?.claims?.complete_same_pot_main_meal?.verdict !== 'not_proven') errors.push('complete same-pot main meal must remain not_proven');
  const southwest = audits.find(row => row?.candidate_id === 'shandong-southwest-family-pot');
  if (southwest?.claims?.regional_identity?.verdict !== 'not_proven') errors.push('southwest Shandong identity must remain not_proven');
  const cornmeal = audits.find(row => row?.candidate_id === 'shandong-vegetable-cornmeal-one-pot');
  if (JSON.stringify(cornmeal?.shape_distinctions) !== JSON.stringify(['ready_pancake', 'cornmeal_batter', 'pot-edge-cake'])) {
    errors.push('cornmeal candidate must distinguish ready pancake, batter and pot-edge cake');
  }
  const seafood = audits.find(row => row?.candidate_id === 'shandong-seafood-staple-pot');
  if (!asArray(seafood?.shape_distinctions).includes('dough_drop') || !asArray(seafood?.shape_distinctions).includes('sweet_potato_noodle')) {
    errors.push('seafood candidate must distinguish dough drops and sweet-potato noodles');
  }
}

function validateLeads(assessment, sourceIds, proofIndex, errors) {
  const leads = asArray(assessment.concrete_research_leads);
  if (!Array.isArray(assessment.concrete_research_leads)) errors.push('concrete_research_leads must be an array');
  if (!sameStringSet(leads.filter(isObject).map(row => row.lead_id), EXPECTED_LEAD_IDS)) errors.push('research lead IDs must match the fixed two leads');
  leads.forEach((leadValue, index) => {
    const path = `concrete_research_leads[${index}]`;
    if (!isObject(leadValue)) {
      errors.push(`${path} must be an object`);
      return;
    }
    const lead = leadValue;
    validateKeys(lead, new Set([
      'lead_id', 'name', 'production_recipe_id', 'source_ids', 'known_structure', 'open_questions',
      'product_destinations', 'decision_reason', 'priority',
    ]), path, errors);
    if (!hasText(lead.lead_id) || !hasText(lead.name)) errors.push(`${path} must have lead_id and name`);
    if (lead.production_recipe_id !== null) errors.push('research leads cannot reference a production recipe');
    const sourceRefs = validateTextArray(lead.source_ids, `${path}.source_ids`, errors);
    for (const sourceId of sourceRefs) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
    const proofKey = `lead:${lead.lead_id}:regional_structure`;
    const proofSources = new Set(proofIndex.get(proofKey) || []);
    if (!sourceRefs.some(sourceId => proofSources.has(sourceId))) errors.push(`${path} requires regional structure evidence`);
    validateTextArray(lead.known_structure, `${path}.known_structure`, errors);
    validateTextArray(lead.open_questions, `${path}.open_questions`, errors);
    const destinations = validateTextArray(lead.product_destinations, `${path}.product_destinations`, errors);
    if (!destinations.every(value => ['research_only', 'new_family_research'].includes(value))) errors.push(`${path} cannot be promoted beyond research`);
    if (!hasText(lead.decision_reason)) errors.push(`${path}.decision_reason must be non-empty`);
    validatePriority(lead.priority, `${path}.priority`, errors);
    for (const forbidden of ['grams', 'minutes', 'temperature_c', 'safety_endpoint']) if (forbidden in lead) errors.push(`${path} cannot contain ${forbidden}`);
  });
}

function validateModels(assessment, sourceIds, proofIndex, errors) {
  const families = asArray(assessment.family_model);
  if (!sameStringSet(families.filter(isObject).map(row => row.family_id), EXPECTED_FAMILY_IDS)) errors.push('family_model must contain the fixed five meal structures');
  families.forEach((row, index) => {
    if (!isObject(row)) return errors.push(`family_model[${index}] must be an object`);
    for (const field of ['family_id', 'name', 'meal_structure', 'evidence_status']) if (!hasText(row[field])) errors.push(`family_model[${index}].${field} must be non-empty`);
  });
  const boundaries = asArray(assessment.adaptation_boundaries);
  if (boundaries.length !== 6) errors.push('adaptation_boundaries must contain exactly 6 items');
  boundaries.forEach((row, index) => {
    if (!isObject(row)) return errors.push(`adaptation_boundaries[${index}] must be an object`);
    for (const field of ['boundary_id', 'evidence_status', 'notes']) if (!hasText(row[field])) errors.push(`adaptation_boundaries[${index}].${field} must be non-empty`);
  });
  const safety = asArray(assessment.safety_boundaries);
  if (!sameStringSet(safety.filter(isObject).map(row => row.safety_id), EXPECTED_SAFETY_IDS)) errors.push('safety boundaries must match the fixed bean and seafood set');
  safety.forEach((row, index) => {
    const path = `safety_boundaries[${index}]`;
    if (!isObject(row)) return errors.push(`${path} must be an object`);
    const refs = validateTextArray(row.source_ids, `${path}.source_ids`, errors);
    for (const sourceId of refs) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
    const proofSources = new Set(proofIndex.get(`safety:${row.safety_id}:endpoint_principle`) || []);
    if (!refs.some(sourceId => proofSources.has(sourceId))) errors.push(`${path} requires endpoint-principle evidence`);
    if (row.evidence_status !== 'principle_only') errors.push(`${path}.evidence_status must remain principle_only`);
    if (!hasText(row.endpoint_note)) errors.push(`${path}.endpoint_note must be non-empty`);
    for (const forbidden of ['grams', 'minutes', 'temperature_c']) if (forbidden in row) errors.push(`${path} cannot contain ${forbidden}`);
  });
}

function validateJourneys(assessment, errors) {
  const journeys = asArray(assessment.journey_cases);
  if (!Array.isArray(assessment.journey_cases)) errors.push('journey_cases must be an array');
  if (journeys.length !== 12) errors.push('journey_cases must contain exactly 12 items');
  const ids = new Set();
  journeys.forEach((row, index) => {
    const path = `journey_cases[${index}]`;
    if (!isObject(row)) return errors.push(`${path} must be an object`);
    if (!hasText(row.journey_id)) errors.push(`${path}.journey_id must be non-empty`);
    else if (ids.has(row.journey_id)) errors.push(`${path}.journey_id must be unique`);
    else ids.add(row.journey_id);
    if (!MODES.has(row.mode)) errors.push(`${path}.mode is invalid`);
    if (!INTENTS.has(row.intent)) errors.push(`${path}.intent is invalid`);
    validateTextArray(row.raw_items, `${path}.raw_items`, errors);
    validateTextArray(row.expected_used_items, `${path}.expected_used_items`, errors, { allowEmpty: true });
    validateTextArray(row.expected_unplanned_items, `${path}.expected_unplanned_items`, errors, { allowEmpty: true });
    if (!hasText(row.expected_structure)) errors.push(`${path}.expected_structure must be non-empty`);
    if (!OUTCOMES.has(row.expected_research_outcome)) errors.push(`${path}.expected_research_outcome is invalid`);
    if (!hasText(row.explanation)) errors.push(`${path}.explanation must be non-empty`);
    const review = asObject(row.human_review);
    if (!isObject(row.human_review)) return errors.push(`${path}.human_review must be an object`);
    if (review.status !== 'pending') errors.push(`${path}.human_review.status must remain pending`);
    for (const field of ['reviewer', 'reviewed_at', 'household_intuition', 'operability', 'taste_judgement', 'conclusion']) {
      if (review[field] !== null) errors.push(`${path}.human_review.${field} must be null while pending`);
    }
    if (review.notes !== '') errors.push(`${path}.human_review.notes must be empty while pending`);
  });
}

export function validateShandongOnePotResearch({
  assessment,
  recipeLibrary,
  regionalResearch,
  regionalAtlas,
  regionalMappings,
} = {}) {
  if (!isObject(assessment)) return ['assessment must be an object'];
  const errors = [];
  validateKeys(assessment, new Set([
    'schema_version', 'assessment_version', 'region_id', 'province_codes', 'source_refs',
    'production_recipe_audits', 'candidate_audits', 'concrete_research_leads',
    'family_model', 'adaptation_boundaries', 'safety_boundaries', 'journey_cases',
  ]), 'assessment', errors);
  if (assessment.schema_version !== 1) errors.push('schema_version must be 1');
  if (assessment.assessment_version !== 'shandong-one-pot-research-v1-20260726') errors.push('assessment_version is invalid');
  if (assessment.region_id !== 'shandong') errors.push('region_id must be shandong');
  if (JSON.stringify(assessment.province_codes) !== JSON.stringify(['CN-SD'])) errors.push('province_codes must contain only CN-SD');
  const atlasRegion = asArray(regionalAtlas?.regions).find(row => row?.region_id === 'shandong');
  if (!atlasRegion || JSON.stringify(atlasRegion.province_codes) !== JSON.stringify(['CN-SD'])) errors.push('regional atlas Shandong province does not match assessment');

  const { sourceIds, proofIndex } = validateSources(assessment, errors);
  const context = { recipeLibrary, regionalResearch, regionalMappings, sourceIds, proofIndex };
  validateProductionAudits(assessment, context, errors);
  validateCandidateAudits(assessment, context, errors);
  validateLeads(assessment, sourceIds, proofIndex, errors);
  validateModels(assessment, sourceIds, proofIndex, errors);
  validateJourneys(assessment, errors);
  return errors;
}

const EXPECTED_RECIPE_IDS = new Set([
  'shanghai-salted-pork-vegetable-rice',
  'suzhou-salted-pork-vegetable-rice',
  'nanjing-cured-pork-greens-rice',
  'nanjing-sausage-greens-rice',
  'nanjing-duck-greens-rice',
  'jinshan-clay-oven-vegetable-rice',
  'she-people-black-rice',
  'banshan-wild-rice',
]);
const EXPECTED_PROVINCES = ['CN-SH', 'CN-JS', 'CN-ZJ', 'CN-AH'];
const EXPECTED_LEAD_IDS = new Set([
  'anhui-dongzhi-farm-pot-crust-rice',
  'anhui-mugwort-pot-crust',
]);
const EXPECTED_STAPLE_STATES = new Set(['plain_rice', 'glutinous_rice', 'cooked_rice']);
const EXPECTED_PROTEIN_FORMS = new Set(['salted_pork', 'cured_pork', 'sausage', 'cooked_duck', 'fresh_meat']);
const EXPECTED_ADAPTATION_BOUNDARIES = new Set([
  'traditional-staple-to-plain-rice',
  'traditional-greens-to-common-greens',
  'wood-fired-stove-to-home-pot',
  'outdoor-fire-to-home-pot',
  'color-source-to-food-grade-powder',
]);
const VERDICTS = new Set(['supported', 'not_proven', 'contradicted']);
const AUDIT_STATES = new Set(['evidence_checked', 'needs_more_evidence', 'rejected']);
const DESTINATIONS = new Set([
  'recipe_evidence', 'template_evidence', 'taxonomy_rule',
  'ratio_rule', 'content_only', 'research_only', 'rejected',
]);
const LEAD_STATES = new Set(['discovery_only', 'needs_source_review', 'not_product_fit']);
const SOURCE_GRADES = new Set(['A', 'B', 'C']);
const OUTCOMES = new Set([
  'supported_family_route', 'needs_more_evidence',
  'unsupported_for_family', 'research_lead_only',
]);
const REVIEW_STATES = new Set(['pending', 'passed', 'failed']);
const MODES = new Set(['recommend', 'pantry']);
const INTENTS = new Set(['normal', 'quick', 'fresh', 'batch']);

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const asObject = value => isObject(value) ? value : {};
const asArray = value => Array.isArray(value) ? value : [];
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const isFiniteInteger = value => Number.isInteger(value) && Number.isFinite(value);
const uniqueStrings = value => Array.isArray(value)
  && value.every(hasText)
  && new Set(value).size === value.length;

function sameStringSet(actual, expected) {
  if (!Array.isArray(actual) || actual.some(value => typeof value !== 'string')) return false;
  return actual.length === expected.size && actual.every(value => expected.has(value));
}

function validateKeys(value, allowed, path, errors) {
  if (!isObject(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`${path} contains unknown field ${key}`);
  }
}

function validateTextArray(value, path, errors, { allowEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return [];
  }
  if (!allowEmpty && value.length === 0) errors.push(`${path} must not be empty`);
  if (!uniqueStrings(value)) errors.push(`${path} must contain unique non-empty strings`);
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
    if (!isFiniteInteger(priority[field])) errors.push(`${path}.${field} must be an integer`);
  }
  if ([priority.product_score, priority.regional_score, priority.risk_penalty, priority.total_score].every(isFiniteInteger)
    && priority.product_score + priority.regional_score - priority.risk_penalty !== priority.total_score) {
    errors.push(`${path}.total_score must equal product_score + regional_score - risk_penalty`);
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
    try {
      parsed = new URL(source.url);
    } catch {
      parsed = null;
    }
    if (!parsed || parsed.protocol !== 'https:') errors.push(`${path}.url must be a direct HTTPS URL`);
    if (parsed?.hostname === 'yiguochu.pages.dev') errors.push('project canonical URL cannot be regional evidence');
    for (const field of ['published_at', 'retrieved_at']) {
      if (!isCalendarDate(source[field]) || source[field] > '2026-07-26') {
        errors.push(`${path}.${field} must be a real date on or before 2026-07-26`);
      }
    }
    if (!SOURCE_GRADES.has(source.source_grade)) errors.push(`${path}.source_grade is invalid`);
    const proves = validateTextArray(source.proves, `${path}.proves`, errors);
    const doesNotProve = validateTextArray(source.does_not_prove, `${path}.does_not_prove`, errors);
    for (const claimKey of proves) {
      if (doesNotProve.includes(claimKey)) errors.push(`${path} cannot both prove and not prove ${claimKey}`);
      if (!proofIndex.has(claimKey)) proofIndex.set(claimKey, []);
      proofIndex.get(claimKey).push(source.source_id);
    }
  });
  return { sources, sourceIds, proofIndex };
}

function validateClaim(claimValue, claimKey, sourceIds, proofIndex, path, errors) {
  if (!isObject(claimValue)) {
    errors.push(`${path} must be an object`);
    return;
  }
  const claim = claimValue;
  validateKeys(claim, new Set(['verdict', 'evidence_source_ids', 'reason']), path, errors);
  if (!VERDICTS.has(claim.verdict)) errors.push(`${path}.verdict is invalid`);
  const evidenceIds = validateTextArray(claim.evidence_source_ids, `${path}.evidence_source_ids`, errors);
  for (const sourceId of evidenceIds) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
  if (!hasText(claim.reason)) errors.push(`${path}.reason must be a non-empty string`);
  if (claim.verdict === 'supported') {
    const provingSources = new Set(proofIndex.get(claimKey) || []);
    if (!evidenceIds.some(sourceId => provingSources.has(sourceId))) errors.push(`supported claim requires evidence that proves the claim: ${claimKey}`);
  }
}

function validateRecipeAudits(assessment, context, errors) {
  const audits = asArray(assessment.recipe_audits);
  if (!Array.isArray(assessment.recipe_audits)) errors.push('recipe_audits must be an array');
  const actualIds = audits.filter(isObject).map(row => row.recipe_id);
  if (!sameStringSet(actualIds, EXPECTED_RECIPE_IDS)) errors.push('recipe audit IDs must match the fixed Jiangnan production set');
  const recipes = Array.isArray(context.recipeLibrary)
    ? context.recipeLibrary
    : asArray(context.recipeLibrary?.recipes);
  const candidates = Array.isArray(context.recipeCandidates)
    ? context.recipeCandidates
    : asArray(context.recipeCandidates?.entries);
  const recipeIndex = new Map(recipes.filter(isObject).map(row => [row.id, row]));
  const candidateIndex = new Map(candidates.filter(isObject).map(row => [row.id, row]));
  const mappingIndex = new Map(asArray(context.regionalMappings?.production_recipe_mappings).filter(isObject).map(row => [row.source_id, row]));
  audits.forEach((auditValue, index) => {
    const path = `recipe_audits[${index}]`;
    if (!isObject(auditValue)) {
      errors.push(`${path} must be an object`);
      return;
    }
    const audit = auditValue;
    validateKeys(audit, new Set([
      'recipe_id', 'candidate_id', 'province_codes', 'audit_state', 'claims',
      'ingredient_roles', 'ratio_evidence_status', 'safety_evidence_status',
      'variant_relation', 'product_destinations', 'priority', 'decision_reason',
    ]), path, errors);
    for (const field of ['recipe_id', 'candidate_id', 'audit_state', 'ratio_evidence_status', 'safety_evidence_status', 'decision_reason']) {
      if (!hasText(audit[field])) errors.push(`${path}.${field} must be a non-empty string`);
    }
    const recipe = recipeIndex.get(audit.recipe_id);
    if (!recipe) errors.push(`${path} references a recipe missing from recipe-library.json`);
    if (recipe && recipe.status !== 'auto_approved') errors.push(`${path} recipe must remain auto_approved`);
    if (recipe && recipe.origin_candidate_id !== audit.candidate_id) errors.push(`${path}.candidate_id must match origin_candidate_id`);
    if (!candidateIndex.has(audit.candidate_id)) errors.push(`${path} references a missing recipe candidate`);
    const mapping = mappingIndex.get(audit.recipe_id);
    if (!mapping || !asArray(mapping.region_ids).includes('jiangnan')) errors.push(`${path} recipe mapping must include Jiangnan`);
    const provinces = validateTextArray(audit.province_codes, `${path}.province_codes`, errors, { allowEmpty: true });
    for (const province of provinces) if (!EXPECTED_PROVINCES.includes(province)) errors.push(`${path} has invalid province ${province}`);
    if (!AUDIT_STATES.has(audit.audit_state)) errors.push(`${path}.audit_state is invalid`);
    const claims = asObject(audit.claims);
    if (!isObject(audit.claims) || Object.keys(claims).length === 0) errors.push(`${path}.claims must be a non-empty object`);
    for (const [claimId, claim] of Object.entries(claims)) {
      validateClaim(claim, `${audit.recipe_id}:${claimId}`, context.sourceIds, context.proofIndex, `${path}.claims.${claimId}`, errors);
    }
    const roles = asArray(audit.ingredient_roles);
    if (!Array.isArray(audit.ingredient_roles) || roles.length === 0) errors.push(`${path}.ingredient_roles must be a non-empty array`);
    roles.forEach((roleValue, roleIndex) => {
      const rolePath = `${path}.ingredient_roles[${roleIndex}]`;
      if (!isObject(roleValue)) {
        errors.push(`${rolePath} must be an object`);
        return;
      }
      validateKeys(roleValue, new Set(['item', 'role', 'evidence_status']), rolePath, errors);
      for (const field of ['item', 'role', 'evidence_status']) if (!hasText(roleValue[field])) errors.push(`${rolePath}.${field} must be non-empty`);
    });
    if (!isObject(audit.variant_relation)) errors.push(`${path}.variant_relation must be an object`);
    else {
      validateKeys(audit.variant_relation, new Set(['family_anchor', 'variant_axis', 'notes']), `${path}.variant_relation`, errors);
      for (const field of ['family_anchor', 'variant_axis', 'notes']) if (!hasText(audit.variant_relation[field])) errors.push(`${path}.variant_relation.${field} must be non-empty`);
    }
    const destinations = validateTextArray(audit.product_destinations, `${path}.product_destinations`, errors);
    for (const destination of destinations) if (!DESTINATIONS.has(destination)) errors.push(`${path} has invalid product destination ${destination}`);
    validatePriority(audit.priority, `${path}.priority`, errors);
  });

  for (const audit of audits.filter(row => isObject(row) && row.recipe_id?.startsWith('nanjing-'))) {
    if (audit.claims?.production_staple_equivalence?.verdict !== 'not_proven') {
      errors.push('Nanjing plain-rice equivalence must remain not_proven');
    }
  }
  const she = audits.find(row => row?.recipe_id === 'she-people-black-rice');
  if (she?.claims?.traditional_color_source_equivalence?.verdict !== 'not_proven') {
    errors.push('She traditional color-source equivalence must remain not_proven');
  }
  const banshan = audits.find(row => row?.recipe_id === 'banshan-wild-rice');
  if (banshan?.claims?.production_core_combination?.verdict !== 'not_proven') {
    errors.push('Banshan production core combination must remain not_proven');
  }
  return audits;
}

function validateResearchLeads(assessment, sourceIds, errors) {
  const leads = asArray(assessment.province_research_leads);
  if (!Array.isArray(assessment.province_research_leads)) errors.push('province_research_leads must be an array');
  const actualIds = leads.filter(isObject).map(row => row.lead_id);
  if (!sameStringSet(actualIds, EXPECTED_LEAD_IDS)) errors.push('province research leads must match the fixed Anhui set');
  leads.forEach((leadValue, index) => {
    const path = `province_research_leads[${index}]`;
    if (!isObject(leadValue)) {
      errors.push(`${path} must be an object`);
      return;
    }
    const lead = leadValue;
    validateKeys(lead, new Set([
      'lead_id', 'province_codes', 'name', 'production_recipe_id', 'research_state',
      'source_ids', 'known_structure', 'open_questions', 'product_destinations',
      'decision_reason', 'priority',
    ]), path, errors);
    for (const field of ['lead_id', 'name', 'research_state', 'decision_reason']) if (!hasText(lead[field])) errors.push(`${path}.${field} must be non-empty`);
    if (lead.production_recipe_id !== null) errors.push('Anhui research leads cannot reference a production recipe');
    if (!LEAD_STATES.has(lead.research_state)) errors.push(`${path}.research_state is invalid`);
    const provinces = validateTextArray(lead.province_codes, `${path}.province_codes`, errors);
    if (provinces.length !== 1 || provinces[0] !== 'CN-AH') errors.push(`${path} must belong only to CN-AH`);
    const referencedSources = validateTextArray(lead.source_ids, `${path}.source_ids`, errors);
    for (const sourceId of referencedSources) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
    validateTextArray(lead.known_structure, `${path}.known_structure`, errors);
    validateTextArray(lead.open_questions, `${path}.open_questions`, errors);
    const destinations = validateTextArray(lead.product_destinations, `${path}.product_destinations`, errors);
    if (destinations.length !== 1 || destinations[0] !== 'research_only') errors.push('Anhui research leads must remain research_only');
    validatePriority(lead.priority, `${path}.priority`, errors);
    for (const forbidden of ['grams', 'minutes', 'temperature_c', 'safety_endpoint']) {
      if (forbidden in lead) errors.push(`${path} cannot contain ${forbidden}`);
    }
  });
  return leads;
}

function validateFamilyModel(assessment, errors) {
  const model = asObject(assessment.family_model);
  if (!isObject(assessment.family_model)) {
    errors.push('family_model must be an object');
    return;
  }
  validateKeys(model, new Set([
    'families', 'staple_states', 'protein_forms', 'adaptation_boundaries',
    'ratio_branches', 'safety_branches',
  ]), 'family_model', errors);
  for (const field of ['families', 'staple_states', 'protein_forms', 'adaptation_boundaries', 'ratio_branches', 'safety_branches']) {
    if (!Array.isArray(model[field]) || model[field].length === 0) errors.push(`family_model.${field} must be a non-empty array`);
  }
  const stapleIds = asArray(model.staple_states).filter(isObject).map(row => row.state_id);
  if (!sameStringSet(stapleIds, EXPECTED_STAPLE_STATES)) errors.push('family_model staple states must keep plain, glutinous and cooked rice separate');
  const proteinIds = asArray(model.protein_forms).filter(isObject).map(row => row.form_id);
  if (!sameStringSet(proteinIds, EXPECTED_PROTEIN_FORMS)) errors.push('family_model protein forms must keep all five controlled forms separate');
  const boundaryIds = asArray(model.adaptation_boundaries).filter(isObject).map(row => row.boundary_id);
  if (!sameStringSet(boundaryIds, EXPECTED_ADAPTATION_BOUNDARIES)) errors.push('family_model adaptation boundaries must match the fixed five boundaries');
  for (const [field, idField, allowedKeys] of [
    ['families', 'family_id', new Set(['family_id', 'name', 'supported_recipe_ids'])],
    ['staple_states', 'state_id', new Set(['state_id', 'name', 'evidence_status', 'notes'])],
    ['protein_forms', 'form_id', new Set(['form_id', 'name', 'compatibility'])],
    ['adaptation_boundaries', 'boundary_id', new Set(['boundary_id', 'name', 'evidence_status', 'notes'])],
    ['ratio_branches', 'branch_id', new Set(['branch_id', 'name', 'evidence_status', 'notes'])],
    ['safety_branches', 'branch_id', new Set(['branch_id', 'name', 'evidence_status', 'endpoint_note'])],
  ]) {
    const ids = new Set();
    asArray(model[field]).forEach((rowValue, index) => {
      const path = `family_model.${field}[${index}]`;
      if (!isObject(rowValue)) {
        errors.push(`${path} must be an object`);
        return;
      }
      validateKeys(rowValue, allowedKeys, path, errors);
      if (!hasText(rowValue[idField])) errors.push(`${path}.${idField} must be non-empty`);
      else if (ids.has(rowValue[idField])) errors.push(`${path}.${idField} must be unique`);
      else ids.add(rowValue[idField]);
      if (!hasText(rowValue.name)) errors.push(`${path}.name must be non-empty`);
      if (field === 'families') {
        const recipeIds = validateTextArray(rowValue.supported_recipe_ids, `${path}.supported_recipe_ids`, errors, { allowEmpty: true });
        for (const recipeId of recipeIds) if (!EXPECTED_RECIPE_IDS.has(recipeId)) errors.push(`${path} references unknown recipe ${recipeId}`);
      }
    });
  }
  for (const row of [...asArray(model.ratio_branches), ...asArray(model.safety_branches)]) {
    if (!isObject(row)) continue;
    if (row.evidence_status !== 'unresearched') errors.push('ratio and safety branches must remain unresearched in this round');
    for (const forbidden of ['grams', 'minutes', 'temperature_c']) if (forbidden in row) errors.push(`unresearched branch cannot contain ${forbidden}`);
  }
}

function validateJourneys(assessment, errors) {
  const journeys = asArray(assessment.journey_cases);
  if (!Array.isArray(assessment.journey_cases)) errors.push('journey_cases must be an array');
  if (journeys.length !== 12) errors.push('journey_cases must contain exactly 12 items');
  const ids = new Set();
  journeys.forEach((journeyValue, index) => {
    const path = `journey_cases[${index}]`;
    if (!isObject(journeyValue)) {
      errors.push(`${path} must be an object`);
      return;
    }
    const journey = journeyValue;
    validateKeys(journey, new Set([
      'journey_id', 'mode', 'intent', 'raw_items', 'expected_used_items',
      'expected_unplanned_items', 'expected_research_outcome', 'explanation', 'human_review',
    ]), path, errors);
    if (!hasText(journey.journey_id)) errors.push(`${path}.journey_id must be non-empty`);
    else if (ids.has(journey.journey_id)) errors.push(`${path}.journey_id must be unique`);
    else ids.add(journey.journey_id);
    if (!MODES.has(journey.mode)) errors.push(`${path}.mode is invalid`);
    if (!INTENTS.has(journey.intent)) errors.push(`${path}.intent is invalid`);
    validateTextArray(journey.raw_items, `${path}.raw_items`, errors);
    validateTextArray(journey.expected_used_items, `${path}.expected_used_items`, errors, { allowEmpty: true });
    validateTextArray(journey.expected_unplanned_items, `${path}.expected_unplanned_items`, errors, { allowEmpty: true });
    if (!OUTCOMES.has(journey.expected_research_outcome)) errors.push(`${path}.expected_research_outcome is invalid`);
    if (!hasText(journey.explanation)) errors.push(`${path}.explanation must be non-empty`);
    const review = asObject(journey.human_review);
    if (!isObject(journey.human_review)) {
      errors.push(`${path}.human_review must be an object`);
      return;
    }
    validateKeys(review, new Set([
      'status', 'household_intuition', 'operability', 'taste_judgement',
      'reviewer', 'reviewed_at', 'notes', 'conclusion',
    ]), `${path}.human_review`, errors);
    if (!REVIEW_STATES.has(review.status)) errors.push(`${path}.human_review.status is invalid`);
    if (review.status === 'pending') {
      for (const field of ['household_intuition', 'operability', 'taste_judgement', 'reviewer', 'reviewed_at', 'notes', 'conclusion']) {
        if (review[field] !== null) errors.push(`${path}.human_review.${field} must be null while pending`);
      }
    } else {
      const complete = ['household_intuition', 'operability', 'taste_judgement', 'reviewer', 'notes', 'conclusion'].every(field => hasText(review[field]))
        && isCalendarDate(review.reviewed_at)
        && review.reviewed_at <= '2026-07-26';
      if (!complete) errors.push('completed human review requires reviewer, date, household judgement, notes and conclusion');
    }
  });
}

export function validateJiangnanRiceResearch({
  assessment,
  recipeLibrary,
  recipeCandidates,
  regionalAtlas,
  regionalMappings,
} = {}) {
  if (!isObject(assessment)) return ['assessment must be an object'];
  const errors = [];
  validateKeys(assessment, new Set([
    'schema_version', 'assessment_version', 'region_id', 'family_id', 'province_codes',
    'source_refs', 'recipe_audits', 'province_research_leads', 'family_model', 'journey_cases',
  ]), 'assessment', errors);
  if (assessment.schema_version !== 1) errors.push('schema_version must be 1');
  if (assessment.assessment_version !== 'jiangnan-rice-research-v1-20260726') errors.push('assessment_version is invalid');
  if (assessment.region_id !== 'jiangnan') errors.push('region_id must be Jiangnan');
  if (assessment.family_id !== 'jiangnan-rice-families') errors.push('family_id is invalid');
  if (JSON.stringify(assessment.province_codes) !== JSON.stringify(EXPECTED_PROVINCES)) errors.push('province_codes must be CN-SH, CN-JS, CN-ZJ, CN-AH in order');

  const atlasRegions = asArray(regionalAtlas?.regions);
  const jiangnan = atlasRegions.find(row => row?.region_id === 'jiangnan');
  if (!jiangnan || JSON.stringify(jiangnan.province_codes) !== JSON.stringify(EXPECTED_PROVINCES)) {
    errors.push('regional atlas Jiangnan provinces do not match the assessment');
  }
  const { sourceIds, proofIndex } = validateSources(assessment, errors);
  validateRecipeAudits(assessment, {
    recipeLibrary, recipeCandidates, regionalMappings, sourceIds, proofIndex,
  }, errors);
  validateResearchLeads(assessment, sourceIds, errors);
  validateFamilyModel(assessment, errors);
  validateJourneys(assessment, errors);
  return errors;
}

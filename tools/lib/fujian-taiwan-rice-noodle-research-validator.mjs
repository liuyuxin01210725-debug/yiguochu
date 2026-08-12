const EXPECTED_PROVINCES = new Set(['CN-FJ', 'CN-TW']);
const EXPECTED_RECIPES = new Set([
  'taiwan-cabbage-mushroom-rice', 'quanzhou-oil-rice', 'fujian-gai-cai-minced-pork-rice',
  'fujian-hyacinth-bean-rice', 'daxi-lotus-leaf-oil-rice', 'she-people-black-rice',
]);
const EXPECTED_LEADS = new Map([
  ['quanzhou-seafood-pork-savory-rice', 'seafood-pork-savory-rice'],
  ['fujian-putian-lor-noodle', 'thick-broth-lor-noodle'],
  ['taiwan-hakka-vegetable-rice', 'rice-cooker-hakka-vegetable-rice'],
]);
const EXPECTED_FAMILIES = new Set([
  'raw-rice-vegetable-braise', 'glutinous-oil-rice', 'seafood-pork-savory-rice',
  'leaf-wrapped-glutinous-rice', 'thick-broth-lor-noodle',
  'rice-cooker-hakka-vegetable-rice', 'ritual-colored-glutinous-rice',
]);
const EXPECTED_SAFETY = new Set([
  'bean-identity-and-cook-through', 'animal-and-seafood-cook-through',
  'seafood-allergen-disclosure', 'leftover-rice-storage-and-reheat',
]);
const VERDICTS = new Set(['supported', 'not_proven', 'contradicted']);
const DESTINATIONS = new Set([
  'recipe_evidence', 'template_evidence', 'taxonomy_rule', 'ratio_rule',
  'content_only', 'research_only', 'new_family_research',
]);

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const asArray = value => Array.isArray(value) ? value : [];
const asObject = value => isObject(value) ? value : {};
const hasText = value => typeof value === 'string' && value.trim().length > 0;

function sameStringSet(values, expected) {
  return values.length === expected.size && new Set(values).size === expected.size
    && values.every(value => expected.has(value));
}

function textArray(value, path, errors, { allowEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return [];
  }
  if (!allowEmpty && value.length === 0) errors.push(`${path} must be non-empty`);
  if (value.some(item => !hasText(item))) errors.push(`${path} must contain non-empty strings`);
  if (new Set(value).size !== value.length) errors.push(`${path} must not contain duplicates`);
  return value.filter(hasText);
}

function validateSources(assessment, errors) {
  const rows = asArray(assessment.source_refs);
  if (!Array.isArray(assessment.source_refs)) errors.push('source_refs must be an array');
  if (rows.length !== 11) errors.push('source_refs must contain exactly 11 items');
  const sourceIds = new Set();
  const proofIndex = new Map();
  rows.forEach((value, index) => {
    const path = `source_refs[${index}]`;
    if (!isObject(value)) {
      errors.push(`${path} must be an object`);
      return;
    }
    for (const field of ['source_id', 'title', 'url', 'publisher', 'retrieved_at', 'source_grade', 'evidence_summary']) {
      if (!hasText(value[field])) errors.push(`${path}.${field} must be non-empty`);
    }
    if (sourceIds.has(value.source_id)) errors.push(`duplicate source_id ${value.source_id}`);
    if (hasText(value.source_id)) sourceIds.add(value.source_id);
    if (hasText(value.url)) {
      try {
        const url = new URL(value.url);
        if (url.protocol !== 'https:') errors.push(`${path}.url must use HTTPS`);
        if (url.hostname === 'yiguochu.pages.dev') errors.push('project canonical URL cannot be regional evidence');
      } catch {
        errors.push(`${path}.url must be valid`);
      }
    }
    if (value.published_at !== null && (!hasText(value.published_at) || !/^\d{4}-\d{2}-\d{2}$/.test(value.published_at))) {
      errors.push(`${path}.published_at must be YYYY-MM-DD or null`);
    }
    if (value.published_at === null && !hasText(value.date_note)) errors.push(`${path}.date_note is required when published_at is null`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.retrieved_at || '')) errors.push(`${path}.retrieved_at must be YYYY-MM-DD`);
    if (hasText(value.retrieved_at) && value.retrieved_at > '2026-07-26') errors.push(`${path}.retrieved_at cannot be in the future`);
    if (!['A', 'B', 'C'].includes(value.source_grade)) errors.push(`${path}.source_grade is invalid`);
    const proves = textArray(value.proves, `${path}.proves`, errors);
    textArray(value.does_not_prove, `${path}.does_not_prove`, errors, { allowEmpty: true });
    for (const proof of proves) {
      if (!proofIndex.has(proof)) proofIndex.set(proof, new Set());
      proofIndex.get(proof).add(value.source_id);
    }
  });
  return { sourceIds, proofIndex };
}

function validateClaim(value, proofKey, sourceIds, proofIndex, path, errors) {
  if (!isObject(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (!VERDICTS.has(value.verdict)) errors.push(`${path}.verdict is invalid`);
  const evidence = textArray(value.evidence_source_ids, `${path}.evidence_source_ids`, errors);
  for (const sourceId of evidence) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
  if (!hasText(value.reason)) errors.push(`${path}.reason must be non-empty`);
  if (value.verdict === 'supported') {
    const proving = proofIndex.get(proofKey) || new Set();
    if (!evidence.some(sourceId => proving.has(sourceId))) errors.push(`${path} supported claim lacks reverse proof ${proofKey}`);
  }
}

function validateProvinceGaps(assessment, regionalMappings, errors) {
  const rows = asArray(assessment.province_gap_audits);
  if (!Array.isArray(assessment.province_gap_audits)) errors.push('province_gap_audits must be an array');
  if (!sameStringSet(rows.filter(isObject).map(row => row.province_code), EXPECTED_PROVINCES)) {
    errors.push('province gap audits must contain CN-FJ and CN-TW');
  }
  const mappedProduction = asArray(regionalMappings?.production_recipe_mappings)
    .filter(isObject).filter(row => asArray(row.region_ids).includes('fujian_taiwan'));
  const mappedCandidates = asArray(regionalMappings?.research_candidate_mappings)
    .filter(isObject).filter(row => asArray(row.region_ids).includes('fujian_taiwan'));
  if (!sameStringSet(mappedProduction.map(row => row.source_id), EXPECTED_RECIPES)) errors.push('regional production mappings no longer match the fixed six-recipe baseline');
  if (mappedCandidates.length !== 0) errors.push('regional candidate mappings no longer match the fixed zero-candidate baseline');
  const mappedByProvince = new Map([...EXPECTED_PROVINCES].map(code => [code, mappedProduction.filter(row => asArray(row.province_codes).includes(code)).map(row => row.source_id)]));
  rows.forEach((value, index) => {
    const path = `province_gap_audits[${index}]`;
    if (!isObject(value)) {
      errors.push(`${path} must be an object`);
      return;
    }
    if (!hasText(value.province_name) || !hasText(value.research_gap)) errors.push(`${path} must have province_name and research_gap`);
    const production = textArray(value.production_recipe_ids, `${path}.production_recipe_ids`, errors);
    const candidates = textArray(value.candidate_ids, `${path}.candidate_ids`, errors, { allowEmpty: true });
    if (!sameStringSet(production, new Set(mappedByProvince.get(value.province_code) || []))) errors.push(`${path} production IDs do not match mappings`);
    if (candidates.length !== 0) errors.push(`${path} must preserve zero candidates`);
  });
}

function validateRecipeAudits(assessment, recipeLibrary, sourceIds, proofIndex, errors) {
  const rows = asArray(assessment.production_recipe_audits);
  if (!Array.isArray(assessment.production_recipe_audits)) errors.push('production_recipe_audits must be an array');
  if (!sameStringSet(rows.filter(isObject).map(row => row.recipe_id), EXPECTED_RECIPES)) errors.push('production audits must match the fixed six recipes');
  const libraryIds = new Set(asArray(recipeLibrary?.recipes).filter(isObject).map(row => row.id));
  rows.forEach((value, index) => {
    const path = `production_recipe_audits[${index}]`;
    if (!isObject(value)) {
      errors.push(`${path} must be an object`);
      return;
    }
    if (!libraryIds.has(value.recipe_id)) errors.push(`${path} references unknown recipe ${value.recipe_id}`);
    if (!['province_specific', 'cross_regional_chinese'].includes(value.mapping_scope)) errors.push(`${path}.mapping_scope is invalid`);
    if (value.mapping_scope === 'province_specific' && !EXPECTED_PROVINCES.has(value.province_code)) errors.push(`${path}.province_code is invalid`);
    if (value.mapping_scope === 'cross_regional_chinese' && value.province_code !== null) errors.push(`${path}.province_code must be null for cross-regional audit`);
    const sources = textArray(value.source_ids, `${path}.source_ids`, errors);
    for (const sourceId of sources) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
    const claims = asObject(value.claims);
    if (Object.keys(claims).length === 0) errors.push(`${path}.claims must be non-empty`);
    for (const [claimId, claim] of Object.entries(claims)) validateClaim(claim, `recipe:${value.recipe_id}:${claimId}`, sourceIds, proofIndex, `${path}.claims.${claimId}`, errors);
    textArray(value.forbidden_claims, `${path}.forbidden_claims`, errors);
    const destinations = textArray(value.product_destinations, `${path}.product_destinations`, errors);
    for (const destination of destinations) if (!DESTINATIONS.has(destination)) errors.push(`${path} has invalid destination ${destination}`);
  });
  const byId = new Map(rows.filter(isObject).map(row => [row.recipe_id, row]));
  if (byId.get('taiwan-cabbage-mushroom-rice')?.claims?.project_ratio_equivalence?.verdict !== 'not_proven') errors.push('cabbage rice ratio equivalence must remain not_proven');
  if (byId.get('quanzhou-oil-rice')?.claims?.exact_project_equivalence?.verdict !== 'not_proven') errors.push('Quanzhou project equivalence must remain not_proven');
  if (byId.get('fujian-hyacinth-bean-rice')?.claims?.bean_species_identity?.verdict !== 'not_proven') errors.push('bean species identity must remain not_proven');
  if (byId.get('daxi-lotus-leaf-oil-rice')?.claims?.exact_project_formula?.verdict !== 'not_proven') errors.push('Daxi exact project formula must remain not_proven');
  if (byId.get('she-people-black-rice')?.claims?.project_color_powder_equivalence?.verdict !== 'not_proven') errors.push('She rice color-powder equivalence must remain not_proven');
}

function validateLeads(assessment, sourceIds, proofIndex, errors) {
  const rows = asArray(assessment.concrete_research_leads);
  if (!Array.isArray(assessment.concrete_research_leads)) errors.push('concrete_research_leads must be an array');
  if (!sameStringSet(rows.filter(isObject).map(row => row.lead_id), new Set(EXPECTED_LEADS.keys()))) errors.push('research lead IDs must match the fixed three Fujian-Taiwan leads');
  rows.forEach((value, index) => {
    const path = `concrete_research_leads[${index}]`;
    if (!isObject(value)) {
      errors.push(`${path} must be an object`);
      return;
    }
    if (!EXPECTED_PROVINCES.has(value.province_code)) errors.push(`${path}.province_code is invalid`);
    if (value.family_id !== EXPECTED_LEADS.get(value.lead_id)) errors.push(`${path}.family_id does not match lead`);
    if (!hasText(value.name) || !hasText(value.meal_structure)) errors.push(`${path} must have name and meal_structure`);
    if (value.production_recipe_id !== null) errors.push('research leads cannot reference a production recipe');
    if (value.candidate_id !== null) errors.push('research leads cannot reference a research candidate');
    const sources = textArray(value.source_ids, `${path}.source_ids`, errors);
    for (const sourceId of sources) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
    const claims = asObject(value.claims);
    if (Object.keys(claims).length === 0) errors.push(`${path}.claims must be non-empty`);
    for (const [claimId, claim] of Object.entries(claims)) validateClaim(claim, `lead:${value.lead_id}:${claimId}`, sourceIds, proofIndex, `${path}.claims.${claimId}`, errors);
    for (const field of ['ingredient_shapes', 'forbidden_shortcuts', 'known_structure', 'open_questions']) textArray(value[field], `${path}.${field}`, errors);
    const destinations = textArray(value.product_destinations, `${path}.product_destinations`, errors);
    for (const destination of destinations) if (!DESTINATIONS.has(destination)) errors.push(`${path} has invalid destination ${destination}`);
  });
  const byId = new Map(rows.filter(isObject).map(row => [row.lead_id, row]));
  if (!asArray(byId.get('fujian-putian-lor-noodle')?.ingredient_shapes).includes('ready_wheat_noodle')) errors.push('Putian lor noodle must require ready wheat noodle');
  if (!asArray(byId.get('fujian-putian-lor-noodle')?.forbidden_shortcuts).includes('dry_noodle_without_hydration_rule')) errors.push('Putian dry noodle hydration must remain unresolved');
  if (!asArray(byId.get('taiwan-hakka-vegetable-rice')?.forbidden_shortcuts).includes('contest_recipe_as_canonical_hakka_tradition')) errors.push('Hakka contest recipe cannot define canonical tradition');
}

function validateFamiliesBoundariesSafety(assessment, sourceIds, proofIndex, errors) {
  const families = asArray(assessment.family_model);
  if (!Array.isArray(assessment.family_model)) errors.push('family_model must be an array');
  if (!sameStringSet(families.filter(isObject).map(row => row.family_id), EXPECTED_FAMILIES)) errors.push('family_model must contain the fixed seven families');
  families.forEach((value, index) => {
    if (!isObject(value)) errors.push(`family_model[${index}] must be an object`);
    else for (const field of ['family_id', 'name', 'meal_structure', 'evidence_status']) if (!hasText(value[field])) errors.push(`family_model[${index}].${field} must be non-empty`);
  });
  const boundaries = asArray(assessment.adaptation_boundaries);
  if (!Array.isArray(assessment.adaptation_boundaries) || boundaries.length !== 5) errors.push('adaptation_boundaries must contain exactly 5 items');
  boundaries.forEach((value, index) => {
    if (!isObject(value)) errors.push(`adaptation_boundaries[${index}] must be an object`);
    else for (const field of ['boundary_id', 'evidence_status', 'notes']) if (!hasText(value[field])) errors.push(`adaptation_boundaries[${index}].${field} must be non-empty`);
  });
  const safety = asArray(assessment.safety_boundaries);
  if (!Array.isArray(assessment.safety_boundaries)) errors.push('safety_boundaries must be an array');
  if (!sameStringSet(safety.filter(isObject).map(row => row.safety_id), EXPECTED_SAFETY)) errors.push('safety boundaries must contain the fixed four endpoints');
  safety.forEach((value, index) => {
    const path = `safety_boundaries[${index}]`;
    if (!isObject(value)) {
      errors.push(`${path} must be an object`);
      return;
    }
    const sources = textArray(value.source_ids, `${path}.source_ids`, errors);
    for (const sourceId of sources) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
    const proving = proofIndex.get(`safety:${value.safety_id}:principle`) || new Set();
    if (!sources.some(sourceId => proving.has(sourceId))) errors.push(`${path} lacks safety principle proof`);
    if (value.evidence_status !== 'principle_only') errors.push(`${path}.evidence_status must remain principle_only`);
    textArray(value.required_controls, `${path}.required_controls`, errors);
    if (!hasText(value.endpoint_note)) errors.push(`${path}.endpoint_note must be non-empty`);
    for (const forbidden of ['grams', 'minutes', 'liquid_ml', 'storage_hours']) if (Object.hasOwn(value, forbidden)) errors.push(`${path} cannot invent ${forbidden}`);
  });
}

function validateJourneys(assessment, errors) {
  const rows = asArray(assessment.journey_cases);
  if (!Array.isArray(assessment.journey_cases)) errors.push('journey_cases must be an array');
  if (rows.length !== 12) errors.push('journey_cases must contain exactly 12 items');
  const ids = rows.filter(isObject).map(row => row.journey_id);
  if (new Set(ids).size !== ids.length) errors.push('journey_ids must be unique');
  rows.forEach((value, index) => {
    const path = `journey_cases[${index}]`;
    if (!isObject(value)) {
      errors.push(`${path} must be an object`);
      return;
    }
    for (const field of ['journey_id', 'province_code', 'mode', 'intent', 'expected_structure', 'expected_outcome', 'reason']) if (!hasText(value[field])) errors.push(`${path}.${field} must be non-empty`);
    if (!EXPECTED_PROVINCES.has(value.province_code)) errors.push(`${path}.province_code is invalid`);
    textArray(value.input_items, `${path}.input_items`, errors);
    textArray(value.expected_family_ids, `${path}.expected_family_ids`, errors, { allowEmpty: true });
    textArray(value.forbidden_claims, `${path}.forbidden_claims`, errors);
    if (!isObject(value.human_review)) errors.push(`${path}.human_review must be an object`);
    else if (!['pending', 'passed', 'failed'].includes(value.human_review.status)) errors.push(`${path}.human_review.status is invalid`);
  });
}

export function validateFujianTaiwanRiceNoodleResearch({
  assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings,
} = {}) {
  if (!isObject(assessment)) return ['assessment must be an object'];
  const errors = [];
  if (assessment.schema_version !== 1) errors.push('schema_version must be 1');
  if (!hasText(assessment.assessment_version)) errors.push('assessment_version must be non-empty');
  if (assessment.region_id !== 'fujian_taiwan') errors.push('region_id must be fujian_taiwan');
  if (!sameStringSet(asArray(assessment.province_codes), EXPECTED_PROVINCES)) errors.push('province_codes must contain CN-FJ and CN-TW');
  const atlasRegion = asArray(regionalAtlas?.regions).find(row => row?.region_id === 'fujian_taiwan');
  if (!isObject(atlasRegion) || !sameStringSet(asArray(atlasRegion.province_codes), EXPECTED_PROVINCES)) errors.push('regional atlas Fujian-Taiwan node is missing or changed');
  if (asArray(regionalResearch?.entries).length !== 24) errors.push('regional research baseline must remain 24');
  const { sourceIds, proofIndex } = validateSources(assessment, errors);
  validateProvinceGaps(assessment, regionalMappings, errors);
  validateRecipeAudits(assessment, recipeLibrary, sourceIds, proofIndex, errors);
  validateLeads(assessment, sourceIds, proofIndex, errors);
  validateFamiliesBoundariesSafety(assessment, sourceIds, proofIndex, errors);
  validateJourneys(assessment, errors);
  return errors;
}

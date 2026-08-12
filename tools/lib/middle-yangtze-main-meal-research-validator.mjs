const EXPECTED_PROVINCES = new Set(['CN-HB', 'CN-HN', 'CN-JX']);
const EXPECTED_LEADS = new Map([
  ['hubei-wuhan-three-delicacy-doupi', 'filled-glutinous-rice-crepe'],
  ['hubei-enshi-ready-doupi-bowl', 'ready-rice-bean-sheet-bowl'],
  ['hubei-mianyang-mixed-grain-powder-steam', 'grain-powder-mixed-steam'],
  ['hubei-xiantao-eel-rice-noodle-bowl', 'long-broth-eel-rice-noodle'],
  ['hunan-xiangxi-shefan', 'cured-meat-herb-glutinous-rice'],
  ['hunan-yongzhou-grey-zongzi', 'alkaline-ash-water-wrapped-rice'],
  ['jiangxi-nanchang-stir-fried-rice-noodle', 'ready-rice-noodle-stir-fry'],
  ['jiangxi-nanfeng-rice-noodle-bowl', 'ready-rice-noodle-broth-or-stir'],
]);
const EXPECTED_FAMILIES = new Set(EXPECTED_LEADS.values());
const EXPECTED_SAFETY = new Set(['wet-rice-noodle-source-storage-discard', 'animal-and-aquatic-cook-through']);
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
  const sources = asArray(assessment.source_refs);
  if (!Array.isArray(assessment.source_refs)) errors.push('source_refs must be an array');
  if (sources.length !== 11) errors.push('source_refs must contain exactly 11 items');
  const sourceIds = new Set();
  const proofIndex = new Map();
  sources.forEach((value, index) => {
    const path = `source_refs[${index}]`;
    if (!isObject(value)) {
      errors.push(`${path} must be an object`);
      return;
    }
    for (const field of ['source_id', 'title', 'url', 'publisher', 'published_at', 'retrieved_at', 'source_grade', 'evidence_summary']) {
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
    for (const field of ['published_at', 'retrieved_at']) {
      if (hasText(value[field]) && !/^\d{4}-\d{2}-\d{2}$/.test(value[field])) errors.push(`${path}.${field} must be YYYY-MM-DD`);
    }
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
    errors.push('province gap audits must contain CN-HB, CN-HN and CN-JX');
  }
  const mappedProduction = asArray(regionalMappings?.production_recipe_mappings)
    .filter(isObject).filter(row => asArray(row.region_ids).includes('middle_yangtze'));
  const mappedCandidates = asArray(regionalMappings?.research_candidate_mappings)
    .filter(isObject).filter(row => asArray(row.region_ids).includes('middle_yangtze'));
  if (mappedProduction.length !== 0 || mappedCandidates.length !== 0) errors.push('regional mappings no longer match the fixed zero-mapping baseline');
  rows.forEach((value, index) => {
    const path = `province_gap_audits[${index}]`;
    if (!isObject(value)) {
      errors.push(`${path} must be an object`);
      return;
    }
    if (!hasText(value.province_name) || !hasText(value.research_gap)) errors.push(`${path} must have province_name and research_gap`);
    const production = textArray(value.production_recipe_ids, `${path}.production_recipe_ids`, errors, { allowEmpty: true });
    const candidates = textArray(value.candidate_ids, `${path}.candidate_ids`, errors, { allowEmpty: true });
    if (production.length || candidates.length) errors.push(`${path} must preserve the zero-mapping baseline`);
  });
}

function validateLeads(assessment, sourceIds, proofIndex, errors) {
  const leads = asArray(assessment.concrete_research_leads);
  if (!Array.isArray(assessment.concrete_research_leads)) errors.push('concrete_research_leads must be an array');
  if (!sameStringSet(leads.filter(isObject).map(row => row.lead_id), new Set(EXPECTED_LEADS.keys()))) {
    errors.push('research lead IDs must match the fixed eight Middle Yangtze leads');
  }
  leads.forEach((value, index) => {
    const path = `concrete_research_leads[${index}]`;
    if (!isObject(value)) {
      errors.push(`${path} must be an object`);
      return;
    }
    if (!hasText(value.name) || !hasText(value.meal_structure)) errors.push(`${path} must have name and meal_structure`);
    if (!EXPECTED_PROVINCES.has(value.province_code)) errors.push(`${path}.province_code is invalid`);
    if (value.family_id !== EXPECTED_LEADS.get(value.lead_id)) errors.push(`${path}.family_id does not match lead`);
    if (value.production_recipe_id !== null) errors.push('research leads cannot reference a production recipe');
    if (value.candidate_id !== null) errors.push('research leads cannot reference a research candidate');
    const sourceRefs = textArray(value.source_ids, `${path}.source_ids`, errors);
    for (const sourceId of sourceRefs) if (!sourceIds.has(sourceId)) errors.push(`${path} references unknown source ${sourceId}`);
    const claims = asObject(value.claims);
    if (Object.keys(claims).length === 0) errors.push(`${path}.claims must be non-empty`);
    for (const [claimId, claim] of Object.entries(claims)) {
      validateClaim(claim, `lead:${value.lead_id}:${claimId}`, sourceIds, proofIndex, `${path}.claims.${claimId}`, errors);
    }
    textArray(value.ingredient_shapes, `${path}.ingredient_shapes`, errors);
    textArray(value.forbidden_shortcuts, `${path}.forbidden_shortcuts`, errors);
    textArray(value.known_structure, `${path}.known_structure`, errors);
    textArray(value.open_questions, `${path}.open_questions`, errors);
    const destinations = textArray(value.product_destinations, `${path}.product_destinations`, errors);
    for (const destination of destinations) if (!DESTINATIONS.has(destination)) errors.push(`${path} has invalid destination ${destination}`);
  });

  const byId = new Map(leads.filter(isObject).map(row => [row.lead_id, row]));
  const enshi = byId.get('hubei-enshi-ready-doupi-bowl');
  if (!asArray(enshi?.forbidden_shortcuts).includes('raw_rice_to_ready_doupi_same_meal')) errors.push('ready doupi cannot be synthesized from raw rice');
  if (byId.get('hubei-mianyang-mixed-grain-powder-steam')?.claims?.staple_sufficiency?.verdict !== 'not_proven') {
    errors.push('Mianyang grain coating staple sufficiency must remain not_proven');
  }
  if (byId.get('hubei-xiantao-eel-rice-noodle-bowl')?.claims?.quick_household_equivalence?.verdict !== 'not_proven') {
    errors.push('Xiantao eel noodle quick equivalence must remain not_proven');
  }
  const shefan = byId.get('hunan-xiangxi-shefan');
  if (shefan?.claims?.executable_ratio?.verdict !== 'not_proven') errors.push('shefan executable ratio must remain not_proven');
  if (!asArray(shefan?.forbidden_shortcuts).includes('source_ratio_to_ratio_dsl')) errors.push('shefan ratio conflict must block Ratio DSL');
  const grey = byId.get('hunan-yongzhou-grey-zongzi');
  if (grey?.claims?.quick_household_equivalence?.verdict !== 'contradicted') errors.push('grey zongzi quick equivalence must remain contradicted');
  for (const id of ['jiangxi-nanchang-stir-fried-rice-noodle', 'jiangxi-nanfeng-rice-noodle-bowl']) {
    const row = byId.get(id);
    if (!asArray(row?.ingredient_shapes).some(shape => shape.includes('ready_or_precooked'))) errors.push(`${id} must require ready or precooked rice noodles`);
    if (!asArray(row?.forbidden_shortcuts).includes('dry_noodle_without_pretreatment')) errors.push(`${id} must reject untreated dry noodles`);
  }
}

function validateFamiliesAndBoundaries(assessment, proofIndex, errors) {
  const families = asArray(assessment.family_model);
  if (!Array.isArray(assessment.family_model)) errors.push('family_model must be an array');
  if (!sameStringSet(families.filter(isObject).map(row => row.family_id), EXPECTED_FAMILIES)) errors.push('family_model must contain the fixed eight families');
  families.forEach((value, index) => {
    if (!isObject(value)) errors.push(`family_model[${index}] must be an object`);
    else for (const field of ['family_id', 'name', 'meal_structure', 'evidence_status']) if (!hasText(value[field])) errors.push(`family_model[${index}].${field} must be non-empty`);
  });
  const boundaries = asArray(assessment.adaptation_boundaries);
  if (!Array.isArray(assessment.adaptation_boundaries) || boundaries.length === 0) errors.push('adaptation_boundaries must be a non-empty array');
  boundaries.forEach((value, index) => {
    if (!isObject(value)) errors.push(`adaptation_boundaries[${index}] must be an object`);
    else for (const field of ['boundary_id', 'evidence_status', 'notes']) if (!hasText(value[field])) errors.push(`adaptation_boundaries[${index}].${field} must be non-empty`);
  });
  const claypot = boundaries.find(row => row?.boundary_id === 'claypot-soup-plus-noodle-is-two-vessel');
  if (claypot?.evidence_status !== 'checked' || !(proofIndex.get('boundary:claypot-soup-plus-noodle-is-two-vessel:meal_structure')?.size > 0)) {
    errors.push('claypot soup plus noodle must remain two-vessel');
  }
}

function validateSafety(assessment, sourceIds, proofIndex, errors) {
  const rows = asArray(assessment.safety_boundaries);
  if (!Array.isArray(assessment.safety_boundaries)) errors.push('safety_boundaries must be an array');
  if (!sameStringSet(rows.filter(isObject).map(row => row.safety_id), EXPECTED_SAFETY)) errors.push('safety boundaries must contain wet-noodle and animal endpoints');
  rows.forEach((value, index) => {
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
  const wet = rows.find(row => row?.safety_id === 'wet-rice-noodle-source-storage-discard');
  const required = ['正规来源', '按标签冷藏', '保质期内尽快食用', '异常或过期立即丢弃'];
  if (JSON.stringify(wet?.required_controls) !== JSON.stringify(required) || !/加热.*不能.*米酵菌酸/.test(wet?.endpoint_note || '')) {
    errors.push('wet rice noodle controls must include source storage expiry discard and heat-resistant toxin warning');
  }
}

function validateJourneys(assessment, errors) {
  const rows = asArray(assessment.journey_cases);
  if (!Array.isArray(assessment.journey_cases)) errors.push('journey_cases must be an array');
  if (rows.length !== 15) errors.push('journey_cases must contain exactly 15 items');
  const ids = rows.filter(isObject).map(row => row.journey_id);
  if (new Set(ids).size !== ids.length) errors.push('journey_ids must be unique');
  rows.forEach((value, index) => {
    const path = `journey_cases[${index}]`;
    if (!isObject(value)) {
      errors.push(`${path} must be an object`);
      return;
    }
    for (const field of ['journey_id', 'province_code', 'mode', 'intent', 'expected_structure', 'expected_outcome', 'reason']) {
      if (!hasText(value[field])) errors.push(`${path}.${field} must be non-empty`);
    }
    if (!EXPECTED_PROVINCES.has(value.province_code)) errors.push(`${path}.province_code is invalid`);
    textArray(value.input_items, `${path}.input_items`, errors);
    textArray(value.expected_family_ids, `${path}.expected_family_ids`, errors, { allowEmpty: true });
    textArray(value.forbidden_claims, `${path}.forbidden_claims`, errors);
    if (!isObject(value.human_review)) errors.push(`${path}.human_review must be an object`);
    else {
      if (value.human_review.status !== 'pending') errors.push(`${path}.human_review.status must remain pending`);
      for (const field of ['family_fit', 'household_feasibility', 'identity_preserved']) {
        if (value.human_review[field] !== null) errors.push(`${path}.human_review.${field} must be null`);
      }
      if (value.human_review.notes !== '') errors.push(`${path}.human_review.notes must be empty`);
    }
  });
}

export function validateMiddleYangtzeMainMealResearch({
  assessment,
  recipeLibrary,
  regionalResearch,
  regionalAtlas,
  regionalMappings,
} = {}) {
  if (!isObject(assessment)) return ['assessment must be an object'];
  const errors = [];
  if (assessment.schema_version !== 1) errors.push('schema_version must be 1');
  if (assessment.assessment_version !== 'middle-yangtze-main-meal-research-v1-20260726') errors.push('assessment_version is invalid');
  if (assessment.region_id !== 'middle_yangtze') errors.push('region_id must be middle_yangtze');
  if (!sameStringSet(asArray(assessment.province_codes), EXPECTED_PROVINCES)) errors.push('province_codes must contain CN-HB, CN-HN and CN-JX');

  const atlasRegion = asArray(regionalAtlas?.regions).find(row => row?.region_id === 'middle_yangtze');
  if (!atlasRegion) errors.push('regional atlas must contain middle_yangtze');
  for (const code of EXPECTED_PROVINCES) {
    const province = asArray(regionalAtlas?.province_nodes).find(row => row?.atlas_code === code);
    if (!province || province.region_id !== 'middle_yangtze') errors.push(`regional atlas must contain ${code} under middle_yangtze`);
  }
  if (asArray(recipeLibrary?.recipes).length !== 72) errors.push('recipe library must remain at 72 recipes');
  if (asArray(regionalResearch?.entries).length !== 24) errors.push('regional research ledger must remain at 24 entries');

  const { sourceIds, proofIndex } = validateSources(assessment, errors);
  validateProvinceGaps(assessment, regionalMappings, errors);
  validateLeads(assessment, sourceIds, proofIndex, errors);
  validateFamiliesAndBoundaries(assessment, proofIndex, errors);
  validateSafety(assessment, sourceIds, proofIndex, errors);
  validateJourneys(assessment, errors);
  return errors;
}

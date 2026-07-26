const EXPECTED_ATLAS_IDS = new Set([
  'northeast-chicken-mushroom-potato-corn-cake',
  'northeast-fish-tofu-vegetable-corn-cake',
  'northeast-ribs-beans-corn-cake',
  'northeast-ribs-beans-sticky-rolls',
]);
const EXPECTED_PROVINCE_CODES = new Set(['CN-LN', 'CN-JL', 'CN-HL']);
const EXPECTED_SOURCE_IDS = new Set([
  'hlj-gov-iron-pot-2025', 'hlj-culture-autumn-pot-2025',
  'jilin-huadian-routes-2025', 'jilin-lishu-routes-2025',
  'jilin-baishan-food-2024', 'liaoning-autumn-food-2025',
  'beijing-pinggu-sticky-roll-2019',
]);
const EXPECTED_STAPLE_FORMS = new Set(['corn_dough_cake', 'wheat_flower_roll', 'sticky_roll']);
const EXPECTED_SAFETY_BRANCHES = new Set(['chicken', 'pork_ribs', 'fish', 'green_beans']);
const VERDICTS = new Set(['supported', 'not_proven', 'contradicted']);
const STATES = new Set(['fact_checked', 'needs_more_evidence', 'rejected']);
const DESTINATIONS = new Set(['recipe_evidence', 'template_evidence', 'taxonomy_rule', 'ratio_rule', 'content_only', 'rejected']);
const SOURCE_GRADES = new Set(['A', 'B', 'C']);
const EVIDENCE_STATUSES = new Set(['supported', 'family_supported', 'not_proven', 'supported_in_beijing']);

const ROOT_FIELDS = new Set([
  'schema_version', 'assessment_version', 'region_id', 'family_id',
  'province_codes', 'source_refs', 'prototypes', 'family_model', 'journey_cases',
]);
const SOURCE_FIELDS = new Set([
  'source_id', 'title', 'url', 'publisher', 'published_at', 'retrieved_at',
  'source_grade', 'evidence_summary', 'proves', 'does_not_prove',
]);
const PROTOTYPE_FIELDS = new Set([
  'atlas_id', 'research_state', 'verified_geography', 'claims', 'variant_relation',
  'ingredient_roles', 'ratio_evidence_status', 'safety_evidence_status',
  'product_destinations', 'priority', 'decision_reason',
]);
const CLAIM_FIELDS = new Set(['claim_id', 'verdict', 'evidence_source_ids', 'reason']);
const GEOGRAPHY_FIELDS = new Set(['region_ids', 'province_codes']);
const VARIANT_FIELDS = new Set(['family_anchor', 'exact_combination_status', 'notes']);
const INGREDIENT_ROLE_FIELDS = new Set(['item', 'role', 'evidence_status']);
const PRIORITY_FIELDS = new Set(['product_score', 'regional_score', 'risk_penalty', 'total_score']);
const FAMILY_FIELDS = new Set(['family_anchor', 'staple_forms', 'safety_branches']);
const STAPLE_FIELDS = new Set(['form_id', 'name', 'evidence_status', 'source_ids', 'shape_notes']);
const SAFETY_FIELDS = new Set(['branch_id', 'name', 'evidence_status', 'source_ids', 'endpoint_note']);

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const asObject = value => isObject(value) ? value : {};
const asArray = value => Array.isArray(value) ? value : [];
const hasText = value => typeof value === 'string' && value.trim().length > 0;

function unknownFields(value, allowed, label, errors) {
  if (!isObject(value)) return;
  for (const field of Object.keys(value)) if (!allowed.has(field)) errors.push(`${label}: ${field} is not allowed`);
}

function textArray(value, label, errors, { nonEmpty = true } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array`);
    return [];
  }
  if (nonEmpty && value.length === 0) errors.push(`${label} must be non-empty`);
  if (!value.every(hasText)) errors.push(`${label} items must be non-empty strings`);
  if (new Set(value).size !== value.length) errors.push(`${label} items must be unique`);
  return value.filter(hasText);
}

function exactSet(actual, expected, label, errors) {
  const left = [...actual].sort();
  const right = [...expected].sort();
  if (JSON.stringify(left) !== JSON.stringify(right)) errors.push(`${label} must match the approved northeast set`);
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value && value <= '2026-07-26';
}

function validateSources(sources, errors) {
  const ids = [];
  for (const [index, source] of sources.entries()) {
    const safe = asObject(source);
    const label = hasText(safe.source_id) ? safe.source_id : `source ${index}`;
    if (!isObject(source)) {
      errors.push(`${label}: source must be an object`);
      continue;
    }
    unknownFields(source, SOURCE_FIELDS, label, errors);
    for (const field of ['source_id', 'title', 'url', 'publisher', 'evidence_summary']) {
      if (!hasText(safe[field])) errors.push(`${label}: ${field} must be a non-empty string`);
    }
    try {
      const url = new URL(safe.url);
      if (url.protocol !== 'https:') errors.push(`${label}: url must use HTTPS`);
    } catch {
      errors.push(`${label}: url must be a valid HTTPS URL`);
    }
    for (const field of ['published_at', 'retrieved_at']) if (!validDate(safe[field])) errors.push(`${label}: ${field} must be a valid non-future date`);
    if (!SOURCE_GRADES.has(safe.source_grade)) errors.push(`${label}: source_grade is invalid`);
    textArray(safe.proves, `${label}: proves`, errors, { nonEmpty: false });
    textArray(safe.does_not_prove, `${label}: does_not_prove`, errors, { nonEmpty: false });
    ids.push(safe.source_id);
  }
  if (new Set(ids).size !== ids.length) errors.push('source_id must be unique');
  exactSet(ids.filter(hasText), EXPECTED_SOURCE_IDS, 'source_id', errors);
}

function validatePrototype(prototype, index, sourceById, errors) {
  const safe = asObject(prototype);
  const label = hasText(safe.atlas_id) ? safe.atlas_id : `prototype ${index}`;
  if (!isObject(prototype)) {
    errors.push(`${label}: prototype must be an object`);
    return;
  }
  unknownFields(prototype, PROTOTYPE_FIELDS, label, errors);
  if (!STATES.has(safe.research_state)) errors.push(`${label}: research_state is invalid`);
  const geography = asObject(safe.verified_geography);
  if (!isObject(safe.verified_geography)) errors.push(`${label}: verified_geography must be an object`);
  unknownFields(geography, GEOGRAPHY_FIELDS, `${label}: verified_geography`, errors);
  textArray(geography.region_ids, `${label}: verified_geography.region_ids`, errors);
  textArray(geography.province_codes, `${label}: verified_geography.province_codes`, errors);

  const claims = asObject(safe.claims);
  if (!isObject(safe.claims) || Object.keys(claims).length === 0) errors.push(`${label}: claims must be a non-empty object`);
  for (const [claimName, claimValue] of Object.entries(claims)) {
    const claim = asObject(claimValue);
    const claimLabel = `${label}: claims.${claimName}`;
    if (!isObject(claimValue)) {
      errors.push(`${claimLabel} must be an object`);
      continue;
    }
    unknownFields(claim, CLAIM_FIELDS, claimLabel, errors);
    if (!hasText(claim.claim_id)) errors.push(`${claimLabel}: claim_id must be a non-empty string`);
    if (!VERDICTS.has(claim.verdict)) errors.push(`${claimLabel}: verdict is invalid`);
    if (!hasText(claim.reason)) errors.push(`${claimLabel}: reason must be a non-empty string`);
    const evidenceIds = textArray(claim.evidence_source_ids, `${claimLabel}: evidence_source_ids`, errors);
    const evidence = evidenceIds.map(id => sourceById.get(id)).filter(Boolean);
    for (const id of evidenceIds) if (!sourceById.has(id)) errors.push(`${claimLabel}: unknown evidence source ${id}`);
    if (claim.verdict === 'supported') {
      if (!evidence.some(source => asArray(source.proves).includes(claim.claim_id))) {
        errors.push(`${claimLabel}: supported claim requires evidence that proves the claim`);
      }
      if (evidence.length > 0 && evidence.every(source => source.source_grade === 'C')) {
        errors.push(`${claimLabel}: source grade C cannot alone support fact_checked claims`);
      }
    }
    if (claim.verdict === 'contradicted' && !evidence.some(source => asArray(source.proves).includes(`not:${claim.claim_id}`))) {
      errors.push(`${claimLabel}: contradicted claim requires direct negative evidence`);
    }
  }
  if (safe.research_state === 'fact_checked' && Object.values(claims).some(value => asObject(value).verdict !== 'supported')) {
    errors.push(`${label}: fact_checked requires every identity claim to be supported`);
  }
  if (safe.atlas_id === 'northeast-ribs-beans-sticky-rolls'
    && asObject(claims.northeast_identity).verdict === 'contradicted'
    && asArray(geography.province_codes).includes('CN-BJ')) {
    errors.push(`${label}: another verified geography cannot contradict northeast existence`);
  }

  const variant = asObject(safe.variant_relation);
  if (!isObject(safe.variant_relation)) errors.push(`${label}: variant_relation must be an object`);
  unknownFields(variant, VARIANT_FIELDS, `${label}: variant_relation`, errors);
  for (const field of VARIANT_FIELDS) if (!hasText(variant[field])) errors.push(`${label}: variant_relation.${field} must be a non-empty string`);

  const roles = asArray(safe.ingredient_roles);
  if (!Array.isArray(safe.ingredient_roles) || roles.length === 0) errors.push(`${label}: ingredient_roles must be a non-empty array`);
  for (const [roleIndex, roleValue] of roles.entries()) {
    const role = asObject(roleValue);
    const roleLabel = `${label}: ingredient_roles[${roleIndex}]`;
    if (!isObject(roleValue)) errors.push(`${roleLabel} must be an object`);
    unknownFields(role, INGREDIENT_ROLE_FIELDS, roleLabel, errors);
    if (!hasText(role.item) || !hasText(role.role)) errors.push(`${roleLabel}: item and role must be non-empty strings`);
    if (!EVIDENCE_STATUSES.has(role.evidence_status)) errors.push(`${roleLabel}: evidence_status is invalid`);
  }
  if (safe.ratio_evidence_status !== 'unresearched') errors.push(`${label}: ratio_evidence_status must remain unresearched in phase one`);
  if (safe.safety_evidence_status !== 'unresearched') errors.push(`${label}: safety_evidence_status must remain unresearched in phase one`);
  const destinations = textArray(safe.product_destinations, `${label}: product_destinations`, errors);
  for (const destination of destinations) if (!DESTINATIONS.has(destination)) errors.push(`${label}: product destination ${destination} is invalid`);
  if (!hasText(safe.decision_reason)) errors.push(`${label}: decision_reason must be a non-empty string`);

  const priority = asObject(safe.priority);
  if (!isObject(safe.priority)) errors.push(`${label}: priority must be an object`);
  unknownFields(priority, PRIORITY_FIELDS, `${label}: priority`, errors);
  for (const field of PRIORITY_FIELDS) if (!Number.isInteger(priority[field])) errors.push(`${label}: priority.${field} must be an integer`);
  if (Number.isInteger(priority.product_score) && Number.isInteger(priority.regional_score)
    && Number.isInteger(priority.risk_penalty) && Number.isInteger(priority.total_score)
    && priority.product_score + priority.regional_score - priority.risk_penalty !== priority.total_score) {
    errors.push(`${label}: priority total_score is inconsistent`);
  }
}

function validateFamilyModel(value, sourceIds, errors) {
  const family = asObject(value);
  if (!isObject(value)) errors.push('family_model must be an object');
  unknownFields(family, FAMILY_FIELDS, 'family_model', errors);
  if (family.family_anchor !== 'northeast-iron-pot-stew-with-staple') errors.push('family_model.family_anchor is invalid');

  const stapleForms = asArray(family.staple_forms);
  if (!Array.isArray(family.staple_forms)) errors.push('family_model.staple_forms must be an array');
  exactSet(stapleForms.map(row => asObject(row).form_id).filter(hasText), EXPECTED_STAPLE_FORMS, 'staple form_id', errors);
  for (const [index, value] of stapleForms.entries()) {
    const row = asObject(value);
    const label = `staple form ${index}`;
    if (!isObject(value)) errors.push(`${label} must be an object`);
    unknownFields(row, STAPLE_FIELDS, label, errors);
    for (const field of ['form_id', 'name', 'shape_notes']) if (!hasText(row[field])) errors.push(`${label}: ${field} must be non-empty`);
    if (row.evidence_status !== 'unresearched') errors.push(`${label}: evidence_status must be unresearched`);
    for (const id of textArray(row.source_ids, `${label}: source_ids`, errors)) if (!sourceIds.has(id)) errors.push(`${label}: unknown source ${id}`);
    for (const forbidden of ['grams', 'minutes', 'temperature_c']) if (forbidden in row) errors.push(`${label}: ${forbidden} is not allowed before evidence`);
  }

  const safetyBranches = asArray(family.safety_branches);
  if (!Array.isArray(family.safety_branches)) errors.push('family_model.safety_branches must be an array');
  exactSet(safetyBranches.map(row => asObject(row).branch_id).filter(hasText), EXPECTED_SAFETY_BRANCHES, 'safety branch_id', errors);
  for (const [index, value] of safetyBranches.entries()) {
    const row = asObject(value);
    const label = `safety branch ${index}`;
    if (!isObject(value)) errors.push(`${label} must be an object`);
    unknownFields(row, SAFETY_FIELDS, label, errors);
    for (const field of ['branch_id', 'name', 'endpoint_note']) if (!hasText(row[field])) errors.push(`${label}: ${field} must be non-empty`);
    if (row.evidence_status !== 'unresearched') errors.push(`${label}: evidence_status must be unresearched`);
    for (const id of textArray(row.source_ids, `${label}: source_ids`, errors)) if (!sourceIds.has(id)) errors.push(`${label}: unknown source ${id}`);
    for (const forbidden of ['grams', 'minutes', 'temperature_c']) if (forbidden in row) errors.push(`${label}: ${forbidden} is not allowed before evidence`);
  }
}

export function validateNortheastStewResearch({ assessment, regionalAtlas, regionalResearch } = {}) {
  if (!isObject(assessment)) return ['assessment must be an object'];
  const errors = [];
  unknownFields(assessment, ROOT_FIELDS, 'assessment', errors);
  if (assessment.schema_version !== 1) errors.push('assessment: schema_version must be 1');
  if (assessment.assessment_version !== 'northeast-stew-research-v1-20260726') errors.push('assessment: assessment_version is invalid');
  if (assessment.region_id !== 'northeast') errors.push('assessment: region_id must be northeast');
  if (assessment.family_id !== 'stew-with-staple') errors.push('assessment: family_id must be stew-with-staple');
  const provinces = textArray(assessment.province_codes, 'assessment: province_codes', errors);
  exactSet(provinces, EXPECTED_PROVINCE_CODES, 'province_codes', errors);

  const atlasRegions = new Set(asArray(regionalAtlas?.regions).map(row => asObject(row).region_id));
  const atlasProvinces = new Set(asArray(regionalAtlas?.province_nodes).map(row => asObject(row).atlas_code));
  if (!atlasRegions.has('northeast')) errors.push('regional atlas is missing northeast');
  for (const code of EXPECTED_PROVINCE_CODES) if (!atlasProvinces.has(code)) errors.push(`regional atlas is missing ${code}`);

  const researchIds = new Set(asArray(regionalResearch?.entries).map(row => asObject(row).atlas_id).filter(hasText));
  for (const id of EXPECTED_ATLAS_IDS) if (!researchIds.has(id)) errors.push(`regional research is missing ${id}`);

  const sources = asArray(assessment.source_refs);
  if (!Array.isArray(assessment.source_refs)) errors.push('assessment: source_refs must be an array');
  validateSources(sources, errors);
  const sourceById = new Map(sources.filter(isObject).map(source => [source.source_id, source]));

  const prototypes = asArray(assessment.prototypes);
  if (!Array.isArray(assessment.prototypes)) errors.push('assessment: prototypes must be an array');
  const prototypeIds = prototypes.map(row => asObject(row).atlas_id).filter(hasText);
  if (new Set(prototypeIds).size !== prototypeIds.length) errors.push('prototype atlas_id must be unique');
  exactSet(prototypeIds, EXPECTED_ATLAS_IDS, 'prototype atlas_id', errors);
  for (const [index, prototype] of prototypes.entries()) validatePrototype(prototype, index, sourceById, errors);

  validateFamilyModel(assessment.family_model, new Set(sourceById.keys()), errors);
  if (!Array.isArray(assessment.journey_cases)) errors.push('assessment: journey_cases must be an array');
  return errors;
}

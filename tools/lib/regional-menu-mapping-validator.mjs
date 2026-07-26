const SCOPES = new Set([
  'province_specific', 'cross_regional_chinese', 'national_household', 'outside_cn_atlas',
]);
const BASIS_VALUES = new Set([
  'cuisine', 'name', 'recipe_evidence', 'research_hypothesis', 'family_crosswalk', 'manual_review',
]);
const RECORD_FIELDS = new Set([
  'source_type', 'source_id', 'regional_scope', 'region_ids', 'province_codes',
  'primary_family_id', 'secondary_family_ids', 'legacy_family_id',
  'mapping_basis', 'mapping_note',
]);
const FORBIDDEN_FIELDS = new Set([
  'ratio_rules', 'safety_rules', 'nutrition', 'steps', 'ingredients',
  'generation_optional_ingredients', 'substitution_slots',
]);

const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const asArray = value => Array.isArray(value) ? value : [];

function exactIds(actual, expected) {
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
}

function checkStringArray(value, label, errors, { nonEmpty = false, allowed = null } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array`);
    return [];
  }
  if (nonEmpty && value.length === 0) errors.push(`${label} must be non-empty`);
  if (!value.every(hasText)) errors.push(`${label} items must be non-empty strings`);
  if (new Set(value).size !== value.length) errors.push(`${label} items must be unique`);
  if (allowed) {
    for (const item of value) if (!allowed.has(item)) errors.push(`${label} contains unknown value ${item}`);
  }
  return value;
}

function validateRows({
  rows, kind, expectedIds, sourceById, regionIds, provinceByCode, techniqueIds, errors,
}) {
  const sourceType = kind === 'production' ? 'production_recipe' : 'research_candidate';
  const sourceIds = [];
  for (const [index, row] of rows.entries()) {
    const label = isObject(row) && hasText(row.source_id) ? row.source_id : `${kind} mapping ${index}`;
    if (!isObject(row)) {
      errors.push(`${label}: mapping must be an object`);
      continue;
    }
    for (const field of Object.keys(row)) {
      if (!RECORD_FIELDS.has(field)) errors.push(`${label}: ${field} is not allowed`);
      if (FORBIDDEN_FIELDS.has(field)) errors.push(`${label}: ${field} is not allowed in mapping records`);
    }
    if (row.source_type !== sourceType) errors.push(`${label}: source_type must be ${sourceType}`);
    if (!hasText(row.source_id)) errors.push(`${label}: source_id must be a non-empty string`);
    else if (!sourceById.has(row.source_id)) errors.push(`${label}: unknown source_id`);
    if (!SCOPES.has(row.regional_scope)) errors.push(`${label}: regional_scope is invalid`);
    const regions = checkStringArray(row.region_ids, `${label}: region_ids`, errors, { allowed: regionIds });
    const provinces = checkStringArray(row.province_codes, `${label}: province_codes`, errors, { allowed: new Set(provinceByCode.keys()) });
    const secondary = checkStringArray(row.secondary_family_ids, `${label}: secondary_family_ids`, errors, { allowed: techniqueIds });
    checkStringArray(row.mapping_basis, `${label}: mapping_basis`, errors, { nonEmpty: true, allowed: BASIS_VALUES });
    if (!hasText(row.legacy_family_id)) errors.push(`${label}: legacy_family_id must be a non-empty string`);
    else if (sourceById.has(row.source_id) && row.legacy_family_id !== sourceById.get(row.source_id)?.family_id) {
      errors.push(`${label}: legacy_family_id must match source family_id`);
    }
    if (!hasText(row.mapping_note)) errors.push(`${label}: mapping_note must be a non-empty string`);
    if (row.primary_family_id !== null && !hasText(row.primary_family_id)) {
      errors.push(`${label}: primary_family_id must be null or a non-empty string`);
    } else if (hasText(row.primary_family_id) && !techniqueIds.has(row.primary_family_id)) {
      errors.push(`${label}: unknown primary_family_id ${row.primary_family_id}`);
    }
    if (hasText(row.primary_family_id) && secondary.includes(row.primary_family_id)) {
      errors.push(`${label}: secondary_family_ids cannot repeat primary_family_id`);
    }

    if (row.regional_scope === 'province_specific') {
      if (provinces.length === 0) errors.push(`${label}: province_specific requires province_codes`);
      if (regions.length === 0) errors.push(`${label}: province_specific requires region_ids`);
    }
    if (row.regional_scope === 'cross_regional_chinese' && regions.length === 0) {
      errors.push(`${label}: cross_regional_chinese requires region_ids`);
    }
    if (row.regional_scope === 'national_household' || row.regional_scope === 'outside_cn_atlas') {
      if (regions.length || provinces.length) {
        errors.push(`${label}: ${row.regional_scope} must not bind Chinese regions or provinces`);
      }
    }
    if (row.regional_scope === 'outside_cn_atlas') {
      if (row.primary_family_id !== null) errors.push(`${label}: outside_cn_atlas primary_family_id must be null`);
    } else if (!hasText(row.primary_family_id)) {
      errors.push(`${label}: Chinese-scope mapping requires primary_family_id`);
    }
    for (const code of provinces) {
      const parent = provinceByCode.get(code)?.region_id;
      if (parent && !regions.includes(parent)) errors.push(`${label}: province ${code} belongs to region ${parent}`);
    }
    sourceIds.push(row.source_id);
  }
  if (new Set(sourceIds).size !== sourceIds.length) errors.push(`${kind} source_id must be unique`);
  if (!exactIds(sourceIds.filter(hasText), expectedIds)) {
    errors.push(`${kind} source ID set must exactly match ${kind === 'production' ? 'recipe library IDs' : 'regional research IDs'}`);
  }
}

export function validateRegionalMenuMappings({ mappings, atlas, recipeLibrary, regionalResearch } = {}) {
  if (!isObject(mappings)) return ['mappings must be an object'];
  const errors = [];
  if (mappings.schema_version !== 1) errors.push('mappings: schema_version must be 1');
  if (mappings.mapping_version !== 'regional-menu-mappings-v1-20260726') {
    errors.push('mappings: mapping_version must be regional-menu-mappings-v1-20260726');
  }
  const rootFields = new Set(['schema_version', 'mapping_version', 'production_recipe_mappings', 'research_candidate_mappings']);
  for (const field of Object.keys(mappings)) if (!rootFields.has(field)) errors.push(`mappings: ${field} is not allowed`);
  if (!Array.isArray(mappings.production_recipe_mappings)) errors.push('mappings: production_recipe_mappings must be an array');
  if (!Array.isArray(mappings.research_candidate_mappings)) errors.push('mappings: research_candidate_mappings must be an array');

  const recipes = asArray(recipeLibrary?.recipes).filter(isObject);
  const research = asArray(regionalResearch?.entries).filter(isObject);
  const recipeById = new Map(recipes.filter(row => hasText(row.id)).map(row => [row.id, row]));
  const researchById = new Map(research.filter(row => hasText(row.atlas_id)).map(row => [row.atlas_id, row]));
  const regions = asArray(atlas?.regions).filter(isObject);
  const provinces = asArray(atlas?.province_nodes).filter(isObject);
  const techniques = asArray(atlas?.technique_families).filter(isObject);
  const regionIds = new Set(regions.map(row => row.region_id).filter(hasText));
  const provinceByCode = new Map(provinces.filter(row => hasText(row.atlas_code)).map(row => [row.atlas_code, row]));
  const techniqueIds = new Set(techniques.map(row => row.family_id).filter(hasText));

  validateRows({
    rows: asArray(mappings.production_recipe_mappings),
    kind: 'production',
    expectedIds: recipeById.keys(),
    sourceById: recipeById,
    regionIds,
    provinceByCode,
    techniqueIds,
    errors,
  });
  validateRows({
    rows: asArray(mappings.research_candidate_mappings),
    kind: 'research',
    expectedIds: researchById.keys(),
    sourceById: researchById,
    regionIds,
    provinceByCode,
    techniqueIds,
    errors,
  });
  return errors;
}

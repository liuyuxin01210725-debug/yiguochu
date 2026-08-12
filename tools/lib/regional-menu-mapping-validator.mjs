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
const CAPABILITY_STATUSES = new Set([
  'research_only', 'blocked_by_evidence', 'blocked_by_taxonomy',
  'blocked_by_ratio', 'preview_candidate', 'covered_by_active_template',
]);
const CAPABILITY_SCOPES = new Set(['regional', 'national_household', 'mixed']);
const COVERAGE_LEVELS = new Set(['full', 'partial', 'none']);
const COVERAGE_BOUNDARY_CODES = new Set([
  'requires_acid_base', 'raw_noodle_only', 'plain_noodle_only',
  'fresh_dry_ratio_split', 'presteamed_noodle_uncovered',
]);
const CAPABILITY_FIELDS = new Set([
  'family_id', 'regional_scope', 'region_ids', 'coverage_level',
  'runtime_template_ids', 'candidate_template_ids',
  'covered_staple_states', 'uncovered_staple_states', 'coverage_boundary_codes',
  'promotion_status', 'evidence_recipe_ids', 'evidence_research_ids',
  'required_ratio_rule_ids', 'resolved_ratio_rule_ids',
  'taxonomy_item_ids', 'blocker_codes', 'scope_note',
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

function validateCapabilityRows({
  rows, regionIds, techniques, recipeIds, researchIds, templates, taxonomyIds, ratioIds, errors,
}) {
  const familyIds = [];
  for (const [index, row] of rows.entries()) {
    const label = isObject(row) && hasText(row.family_id) ? row.family_id : `capability mapping ${index}`;
    if (!isObject(row)) {
      errors.push(`${label}: capability mapping must be an object`);
      continue;
    }
    for (const field of Object.keys(row)) {
      if (!CAPABILITY_FIELDS.has(field)) errors.push(`${label}: ${field} is not allowed`);
    }
    if (!hasText(row.family_id)) errors.push(`${label}: family_id must be a non-empty string`);
    else if (!techniques.has(row.family_id)) errors.push(`${label}: unknown family_id`);
    if (!CAPABILITY_SCOPES.has(row.regional_scope)) errors.push(`${label}: regional_scope is invalid`);
    if (!COVERAGE_LEVELS.has(row.coverage_level)) errors.push(`${label}: coverage_level is invalid`);
    if (!CAPABILITY_STATUSES.has(row.promotion_status)) errors.push(`${label}: promotion_status is invalid`);
    const regions = checkStringArray(row.region_ids, `${label}: region_ids`, errors, { allowed: regionIds });
    if (row.regional_scope === 'national_household' && regions.length) errors.push(`${label}: national_household must not bind regions`);
    if (['regional', 'mixed'].includes(row.regional_scope) && !regions.length) errors.push(`${label}: ${row.regional_scope} requires regions`);

    const runtimeIds = checkStringArray(row.runtime_template_ids, `${label}: runtime_template_ids`, errors);
    const candidateIds = checkStringArray(row.candidate_template_ids, `${label}: candidate_template_ids`, errors);
    for (const id of runtimeIds) {
      const template = templates.get(id);
      if (!template) errors.push(`${label}: unknown runtime template ${id}`);
      else if (template.activation_status !== 'active' || !template.runtime_eligible) errors.push(`${label}: runtime template must be active and eligible ${id}`);
    }
    for (const id of candidateIds) if (!templates.has(id)) errors.push(`${label}: unknown candidate template ${id}`);
    if (runtimeIds.some(id => candidateIds.includes(id))) errors.push(`${label}: runtime and candidate templates must be disjoint`);

    const family = techniques.get(row.family_id);
    const expectedStates = new Set(asArray(family?.staple_states));
    const covered = checkStringArray(row.covered_staple_states, `${label}: covered_staple_states`, errors, { allowed: expectedStates });
    const uncovered = checkStringArray(row.uncovered_staple_states, `${label}: uncovered_staple_states`, errors, { allowed: expectedStates });
    const boundaries = checkStringArray(row.coverage_boundary_codes, `${label}: coverage_boundary_codes`, errors, { allowed: COVERAGE_BOUNDARY_CODES });
    if (covered.some(value => uncovered.includes(value))) errors.push(`${label}: covered and uncovered staple states must be disjoint`);
    if (!exactIds([...covered, ...uncovered], expectedStates)) errors.push(`${label}: staple state partition must match atlas family`);
    if (row.coverage_level === 'full' && (!covered.length || uncovered.length || boundaries.length)) errors.push(`${label}: full coverage cannot retain gaps`);
    if (row.coverage_level === 'partial' && (!covered.length || (!uncovered.length && !boundaries.length))) errors.push(`${label}: partial coverage requires an uncovered state or boundary`);
    if (row.coverage_level === 'none' && (covered.length || boundaries.length || runtimeIds.length || !exactIds(uncovered, expectedStates))) errors.push(`${label}: none coverage cannot have runtime templates or covered states`);

    const evidenceRecipes = checkStringArray(row.evidence_recipe_ids, `${label}: evidence_recipe_ids`, errors, { allowed: recipeIds });
    const evidenceResearch = checkStringArray(row.evidence_research_ids, `${label}: evidence_research_ids`, errors, { allowed: researchIds });
    if (!evidenceRecipes.length && !evidenceResearch.length) errors.push(`${label}: requires recipe or research evidence`);
    const requiredRatios = checkStringArray(row.required_ratio_rule_ids, `${label}: required_ratio_rule_ids`, errors);
    const resolvedRatios = checkStringArray(row.resolved_ratio_rule_ids, `${label}: resolved_ratio_rule_ids`, errors);
    checkStringArray(row.taxonomy_item_ids, `${label}: taxonomy_item_ids`, errors, { allowed: taxonomyIds });
    const blockers = checkStringArray(row.blocker_codes, `${label}: blocker_codes`, errors);
    if (!hasText(row.scope_note)) errors.push(`${label}: scope_note must be a non-empty string`);

    for (const ruleId of resolvedRatios) {
      if (!ratioIds.has(ruleId)) errors.push(`${label}: unknown resolved ratio rule ${ruleId}`);
      if (!requiredRatios.includes(ruleId)) errors.push(`${label}: resolved ratio rule must also be required ${ruleId}`);
    }
    const ready = row.promotion_status === 'preview_candidate'
      || row.promotion_status === 'covered_by_active_template';
    if (ready && blockers.length) errors.push(`${label}: ready capability cannot retain blockers`);
    if (ready && !exactIds(requiredRatios, resolvedRatios)) {
      errors.push(`${label}: ready capability must resolve every required ratio rule`);
    }
    if (ready && !runtimeIds.length) errors.push(`${label}: ready capability requires a runtime template`);
    if (row.promotion_status === 'covered_by_active_template' && row.coverage_level !== 'full') {
      errors.push(`${label}: covered_by_active_template requires full coverage`);
    }
    if ((row.promotion_status === 'research_only'
      || (typeof row.promotion_status === 'string' && row.promotion_status.startsWith('blocked_')))
      && blockers.length === 0) {
      errors.push(`${label}: blocked or research capability requires blocker_codes`);
    }
    if (hasText(row.family_id)) familyIds.push(row.family_id);
  }
  if (new Set(familyIds).size !== familyIds.length) errors.push('capability family_id must be unique');
  if (!exactIds(familyIds, techniques.keys())) {
    errors.push('capability family ID set must exactly match atlas technique families');
  }
}

export function validateRegionalMenuMappings({
  mappings, atlas, recipeLibrary, regionalResearch, templates, taxonomy, ratios,
} = {}) {
  if (!isObject(mappings)) return ['mappings must be an object'];
  const errors = [];
  if (mappings.schema_version !== 1) errors.push('mappings: schema_version must be 1');
  if (mappings.mapping_version !== 'regional-menu-mappings-v1-20260726-r2') {
    errors.push('mappings: mapping_version must be regional-menu-mappings-v1-20260726-r2');
  }
  const rootFields = new Set([
    'schema_version', 'mapping_version', 'production_recipe_mappings',
    'research_candidate_mappings', 'template_capability_mappings',
  ]);
  for (const field of Object.keys(mappings)) if (!rootFields.has(field)) errors.push(`mappings: ${field} is not allowed`);
  if (!Array.isArray(mappings.production_recipe_mappings)) errors.push('mappings: production_recipe_mappings must be an array');
  if (!Array.isArray(mappings.research_candidate_mappings)) errors.push('mappings: research_candidate_mappings must be an array');
  if (!Array.isArray(mappings.template_capability_mappings)) errors.push('mappings: template_capability_mappings must be an array');

  const recipes = asArray(recipeLibrary?.recipes).filter(isObject);
  const research = asArray(regionalResearch?.entries).filter(isObject);
  const recipeById = new Map(recipes.filter(row => hasText(row.id)).map(row => [row.id, row]));
  const researchById = new Map(research.filter(row => hasText(row.atlas_id)).map(row => [row.atlas_id, row]));
  const regions = asArray(atlas?.regions).filter(isObject);
  const provinces = asArray(atlas?.province_nodes).filter(isObject);
  const techniques = asArray(atlas?.technique_families).filter(isObject);
  const regionIds = new Set(regions.map(row => row.region_id).filter(hasText));
  const provinceByCode = new Map(provinces.filter(row => hasText(row.atlas_code)).map(row => [row.atlas_code, row]));
  const techniqueById = new Map(techniques.filter(row => hasText(row.family_id)).map(row => [row.family_id, row]));
  const techniqueIds = new Set(techniqueById.keys());
  const templateById = new Map(asArray(templates?.templates).filter(isObject).filter(row => hasText(row.template_id)).map(row => [row.template_id, row]));
  const taxonomyIds = new Set(asArray(taxonomy?.items).filter(isObject).map(row => row.canonical_id).filter(hasText));
  const ratioIds = new Set(asArray(ratios?.rules).filter(isObject).map(row => row.rule_id).filter(hasText));

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
  validateCapabilityRows({
    rows: asArray(mappings.template_capability_mappings),
    regionIds,
    techniques: techniqueById,
    recipeIds: new Set(recipeById.keys()),
    researchIds: new Set(researchById.keys()),
    templates: templateById,
    taxonomyIds,
    ratioIds,
    errors,
  });
  return errors;
}

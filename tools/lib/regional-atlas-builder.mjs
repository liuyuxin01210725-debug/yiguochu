const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const asObject = value => isObject(value) ? value : {};
const asArray = value => Array.isArray(value) ? value : [];
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const uniqueSorted = values => [...new Set(values.filter(hasText))].sort();

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function idsFor(rows, key, value, sourceKey = 'source_id') {
  return uniqueSorted(rows.filter(row => asArray(row?.[key]).includes(value)).map(row => row?.[sourceKey]));
}

function coverageStatus(productionIds, researchIds) {
  if (productionIds.length && researchIds.length) return 'production_and_research';
  if (productionIds.length) return 'production_only';
  if (researchIds.length) return 'research_only';
  return 'skeleton_only';
}

export function buildRegionalAtlasReport({ atlas, mappings, recipeLibrary, regionalResearch } = {}) {
  const safeAtlas = asObject(atlas);
  const safeMappings = asObject(mappings);
  const recipes = asArray(recipeLibrary?.recipes).filter(isObject);
  const research = asArray(regionalResearch?.entries).filter(isObject);
  const productionMappings = asArray(safeMappings.production_recipe_mappings).filter(isObject);
  const researchMappings = asArray(safeMappings.research_candidate_mappings).filter(isObject);
  const recipeById = new Map(recipes.filter(row => hasText(row.id)).map(row => [row.id, row]));
  const researchById = new Map(research.filter(row => hasText(row.atlas_id)).map(row => [row.atlas_id, row]));

  const productionAudit = productionMappings.map(mapping => {
    const recipe = asObject(recipeById.get(mapping.source_id));
    return {
      source_id: mapping.source_id,
      name: recipe.name || '',
      status: recipe.status || '',
      cuisine: recipe.cuisine || '',
      form: recipe.form || '',
      regional_scope: mapping.regional_scope,
      region_ids: clone(asArray(mapping.region_ids)),
      province_codes: clone(asArray(mapping.province_codes)),
      primary_family_id: mapping.primary_family_id ?? null,
      secondary_family_ids: clone(asArray(mapping.secondary_family_ids)),
      legacy_family_id: mapping.legacy_family_id || '',
      mapping_basis: clone(asArray(mapping.mapping_basis)),
      mapping_note: mapping.mapping_note || '',
      core_ingredients: clone(asArray(recipe.core_ingredients)),
      source_count: asArray(recipe.source_refs).length,
    };
  }).sort((a, b) => a.source_id.localeCompare(b.source_id));

  const researchAudit = researchMappings.map(mapping => {
    const candidate = asObject(researchById.get(mapping.source_id));
    return {
      source_id: mapping.source_id,
      prototype_name: candidate.prototype_name || '',
      status: candidate.status || '',
      source_confidence: candidate.source_confidence || '',
      regional_scope: mapping.regional_scope,
      region_ids: clone(asArray(mapping.region_ids)),
      province_codes: clone(asArray(mapping.province_codes)),
      primary_family_id: mapping.primary_family_id ?? null,
      secondary_family_ids: clone(asArray(mapping.secondary_family_ids)),
      legacy_family_id: mapping.legacy_family_id || '',
      mapping_basis: clone(asArray(mapping.mapping_basis)),
      mapping_note: mapping.mapping_note || '',
      pantry_gap_items: clone(asArray(candidate.pantry_gap_items)),
      source_ref_count: asArray(candidate.source_refs).length,
    };
  }).sort((a, b) => a.source_id.localeCompare(b.source_id));

  const regions = asArray(safeAtlas.regions).filter(isObject).map(row => {
    const regionId = row.region_id;
    const productionRecipeIds = idsFor(productionAudit, 'region_ids', regionId);
    const researchCandidateIds = idsFor(researchAudit, 'region_ids', regionId);
    return {
      region_id: regionId,
      name: row.name || '',
      province_codes: clone(asArray(row.province_codes)),
      research_focus: clone(asArray(row.research_focus)),
      status: row.status || '',
      production_recipe_ids: productionRecipeIds,
      research_candidate_ids: researchCandidateIds,
      coverage_status: coverageStatus(productionRecipeIds, researchCandidateIds),
    };
  });

  const provinceCoverage = asArray(safeAtlas.province_nodes).filter(isObject).map(row => {
    const productionRecipeIds = idsFor(productionAudit, 'province_codes', row.atlas_code);
    const researchCandidateIds = idsFor(researchAudit, 'province_codes', row.atlas_code);
    return {
      atlas_code: row.atlas_code,
      name: row.name || '',
      region_id: row.region_id || '',
      status: row.status || '',
      research_question: row.research_question || '',
      defer_reason: row.defer_reason || '',
      production_recipe_ids: productionRecipeIds,
      research_candidate_ids: researchCandidateIds,
      coverage_status: coverageStatus(productionRecipeIds, researchCandidateIds),
    };
  });

  const techniqueCoverage = asArray(safeAtlas.technique_families).filter(isObject).map(row => {
    const productionRecipeIds = uniqueSorted(productionAudit
      .filter(item => item.primary_family_id === row.family_id || item.secondary_family_ids.includes(row.family_id))
      .map(item => item.source_id));
    const researchCandidateIds = uniqueSorted(researchAudit
      .filter(item => item.primary_family_id === row.family_id || item.secondary_family_ids.includes(row.family_id))
      .map(item => item.source_id));
    return {
      family_id: row.family_id,
      name: row.name || '',
      staple_states: clone(asArray(row.staple_states)),
      research_question: row.research_question || '',
      status: row.status || '',
      production_recipe_ids: productionRecipeIds,
      research_candidate_ids: researchCandidateIds,
      coverage_status: coverageStatus(productionRecipeIds, researchCandidateIds),
    };
  });

  const capabilityByFamily = new Map(asArray(safeMappings.template_capability_mappings)
    .filter(isObject)
    .filter(row => hasText(row.family_id))
    .map(row => [row.family_id, row]));
  const capabilityCoverage = techniqueCoverage.map(family => {
    const source = clone(asObject(capabilityByFamily.get(family.family_id)));
    return { ...source, family_id: family.family_id, name: family.name };
  });

  const pantryIndex = new Map();
  for (const row of researchAudit) {
    for (const item of row.pantry_gap_items) {
      if (!hasText(item)) continue;
      if (!pantryIndex.has(item)) pantryIndex.set(item, []);
      pantryIndex.get(item).push(row.source_id);
    }
  }
  const pantryGapCoverage = [...pantryIndex.entries()].map(([item, ids]) => ({
    item,
    research_candidate_count: new Set(ids).size,
    research_candidate_ids: uniqueSorted(ids),
  })).sort((a, b) => b.research_candidate_count - a.research_candidate_count || a.item.localeCompare(b.item, 'zh-CN'));

  const sourceStatus = {
    production: {
      with_sources: productionAudit.filter(row => row.source_count > 0).length,
      without_sources: productionAudit.filter(row => row.source_count === 0).length,
    },
    research: {
      discovery_only: researchAudit.filter(row => row.source_confidence === 'discovery_only').length,
      fact_checked: researchAudit.filter(row => row.source_confidence === 'fact_checked').length,
      other: researchAudit.filter(row => !['discovery_only', 'fact_checked'].includes(row.source_confidence)).length,
    },
  };

  return {
    schema_version: 2,
    atlas_version: safeAtlas.catalog_version || '',
    mapping_version: safeMappings.mapping_version || '',
    summary: {
      region_count: regions.length,
      province_count: provinceCoverage.length,
      technique_family_count: techniqueCoverage.length,
      production_audit_count: productionAudit.length,
      research_audit_count: researchAudit.length,
      province_specific_count: productionAudit.filter(row => row.regional_scope === 'province_specific').length,
      cross_regional_chinese_count: productionAudit.filter(row => row.regional_scope === 'cross_regional_chinese').length,
      national_household_count: productionAudit.filter(row => row.regional_scope === 'national_household').length,
      outside_cn_atlas_count: productionAudit.filter(row => row.regional_scope === 'outside_cn_atlas').length,
      blank_province_count: provinceCoverage.filter(row => row.coverage_status === 'skeleton_only').length,
      capability_full_count: capabilityCoverage.filter(row => row.coverage_level === 'full').length,
      capability_partial_count: capabilityCoverage.filter(row => row.coverage_level === 'partial').length,
      capability_none_count: capabilityCoverage.filter(row => row.coverage_level === 'none').length,
    },
    regions,
    province_coverage: provinceCoverage,
    technique_coverage: techniqueCoverage,
    capability_coverage: capabilityCoverage,
    cultural_overlays: clone(asArray(safeAtlas.cultural_overlays).filter(isObject)),
    production_audit: productionAudit,
    research_audit: researchAudit,
    pantry_gap_coverage: pantryGapCoverage,
    source_status: sourceStatus,
  };
}

export function validateRegionalAtlasReport(report) {
  if (!isObject(report)) return ['report must be an object'];
  const errors = [];
  if (report.schema_version !== 2) errors.push('report schema_version must be 2');
  if (!hasText(report.atlas_version)) errors.push('report atlas_version must be a non-empty string');
  if (!hasText(report.mapping_version)) errors.push('report mapping_version must be a non-empty string');
  const arrays = {
    regions: asArray(report.regions),
    province_coverage: asArray(report.province_coverage),
    technique_coverage: asArray(report.technique_coverage),
    capability_coverage: asArray(report.capability_coverage),
    production_audit: asArray(report.production_audit),
    research_audit: asArray(report.research_audit),
    pantry_gap_coverage: asArray(report.pantry_gap_coverage),
    cultural_overlays: asArray(report.cultural_overlays),
  };
  for (const field of Object.keys(arrays)) if (!Array.isArray(report[field])) errors.push(`${field} must be an array`);
  if (arrays.regions.length !== 13) errors.push('regions must contain exactly 13 items');
  if (arrays.province_coverage.length !== 34) errors.push('province_coverage must contain exactly 34 items');
  if (arrays.technique_coverage.length !== 12) errors.push('technique_coverage must contain exactly 12 items');
  if (arrays.capability_coverage.length !== 12) errors.push('capability_coverage must contain exactly 12 items');
  if (arrays.production_audit.length !== 72) errors.push('production_audit must contain exactly 72 items');
  if (arrays.research_audit.length !== 24) errors.push('research_audit must contain exactly 24 items');

  const productionIds = arrays.production_audit.map(row => asObject(row).source_id);
  const researchIds = arrays.research_audit.map(row => asObject(row).source_id);
  if (new Set(productionIds).size !== productionIds.length) errors.push('production audit source_id must be unique');
  if (new Set(researchIds).size !== researchIds.length) errors.push('research audit source_id must be unique');
  const provinceCodes = arrays.province_coverage.map(row => asObject(row).atlas_code);
  const techniqueIds = arrays.technique_coverage.map(row => asObject(row).family_id);
  const capabilityIds = arrays.capability_coverage.map(row => asObject(row).family_id);
  if (new Set(provinceCodes).size !== provinceCodes.length) errors.push('province coverage atlas_code must be unique');
  if (new Set(techniqueIds).size !== techniqueIds.length) errors.push('technique coverage family_id must be unique');
  if (new Set(capabilityIds).size !== capabilityIds.length) errors.push('capability coverage family_id must be unique');

  const expectedSummary = {
    region_count: arrays.regions.length,
    province_count: arrays.province_coverage.length,
    technique_family_count: arrays.technique_coverage.length,
    production_audit_count: arrays.production_audit.length,
    research_audit_count: arrays.research_audit.length,
    province_specific_count: arrays.production_audit.filter(row => asObject(row).regional_scope === 'province_specific').length,
    cross_regional_chinese_count: arrays.production_audit.filter(row => asObject(row).regional_scope === 'cross_regional_chinese').length,
    national_household_count: arrays.production_audit.filter(row => asObject(row).regional_scope === 'national_household').length,
    outside_cn_atlas_count: arrays.production_audit.filter(row => asObject(row).regional_scope === 'outside_cn_atlas').length,
    blank_province_count: arrays.province_coverage.filter(row => asObject(row).coverage_status === 'skeleton_only').length,
    capability_full_count: arrays.capability_coverage.filter(row => asObject(row).coverage_level === 'full').length,
    capability_partial_count: arrays.capability_coverage.filter(row => asObject(row).coverage_level === 'partial').length,
    capability_none_count: arrays.capability_coverage.filter(row => asObject(row).coverage_level === 'none').length,
  };
  for (const [field, expected] of Object.entries(expectedSummary)) {
    if (report.summary?.[field] !== expected) errors.push(`summary ${field} expected ${expected}, got ${report.summary?.[field]}`);
  }

  const productionIdSet = new Set(productionIds);
  const researchIdSet = new Set(researchIds);
  for (const row of [...arrays.regions, ...arrays.province_coverage, ...arrays.technique_coverage]) {
    const safe = asObject(row);
    for (const id of asArray(safe.production_recipe_ids)) if (!productionIdSet.has(id)) errors.push(`coverage references unknown production ID ${id}`);
    for (const id of asArray(safe.research_candidate_ids)) if (!researchIdSet.has(id)) errors.push(`coverage references unknown research ID ${id}`);
  }
  for (const row of arrays.production_audit) {
    const safe = asObject(row);
    if (['national_household', 'outside_cn_atlas'].includes(safe.regional_scope)
      && (asArray(safe.region_ids).length || asArray(safe.province_codes).length)) {
      errors.push(`${safe.source_id || '<unknown>'}: non-regional audit binds Chinese geography`);
    }
  }
  return errors;
}

export function formatRegionalAtlasSummary(report) {
  const summary = asObject(report?.summary);
  return `${summary.region_count ?? 0} regions · ${summary.province_count ?? 0} provinces · ${summary.technique_family_count ?? 0} technique families · ${summary.production_audit_count ?? 0} production audits · ${summary.research_audit_count ?? 0} research audits`;
}

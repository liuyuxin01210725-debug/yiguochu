import {
  PLANNER_VERSION,
  buildPotCandidates,
  normalizePlannerItems,
  planMeal,
} from '../../worker/src/planner-v2.js';

const BASIC_CATEGORIES = new Set(['liquid', 'oil', 'seasoning']);
const AUDIT_STATUSES = [
  'full_single_pot_evidence_aligned',
  'full_single_pot_ingredient_compatible',
  'full_multi_pot',
  'taxonomy_gap',
  'planner_gap',
  'no_recognized_core',
  'invalid_source_record',
];
const PRIORITY_BANDS = ['P0', 'P1', 'P2', 'P3', 'covered'];
const REQUIRED_SOURCE_PATHS = [
  'tools/data/ingredient-taxonomy.v1.json',
  'tools/data/meal-templates.v2.json',
  'tools/data/menu-master-baseline.v1.json',
  'tools/data/ratio-rules.v1.json',
  'tools/data/recipe-library.json',
  'tools/data/regional-menu-mappings.v1.json',
  'tools/data/rice-meal-catalog.v1.json',
];

const asArray = value => Array.isArray(value) ? value : [];
const asObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const ratioOrNull = (numerator, denominator) => denominator === 0 ? null : numerator / denominator;

function uniqueBy(items, identity) {
  const seen = new Set();
  return items.filter(item => {
    const key = identity(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueStrings(values) {
  return uniqueBy(asArray(values).filter(value => typeof value === 'string'), value => value);
}

function promiseIdentity(item) {
  return item?.recognized && item.canonical ? `canonical:${item.canonical}` : `raw:${String(item?.raw || '').trim()}`;
}

function representativeItems(items) {
  return uniqueBy(asArray(items).filter(item => item?.duplicate_of === null), promiseIdentity);
}

function partitionCoreItems(rawCoreItems, taxonomy) {
  const normalized = normalizePlannerItems(
    rawCoreItems.map(raw => ({ raw, role: 'must_use' })),
    taxonomy,
  );
  return {
    normalized,
    plannerEligible: normalized.filter(row => row.recognized && !BASIC_CATEGORIES.has(row.category)),
    basics: normalized.filter(row => row.recognized && BASIC_CATEGORIES.has(row.category)),
    unknown: normalized.filter(row => !row.recognized),
  };
}

function plannerRequest(rawItems) {
  return {
    mode: 'pantry',
    intent: 'normal',
    servings: 2,
    must_use: uniqueStrings(rawItems.map(value => String(value).trim()).filter(Boolean)),
    prefer_use: [],
    dislikes: [],
    current_plan_id: null,
    recent_plan_ids: [],
    decision: null,
  };
}

function reasonCodes(result) {
  return uniqueStrings([
    result?.plan?.rejection_reason?.reason_code,
    ...asArray(result?.plan?.unplanned_must_use).map(item => item?.reason_code),
    ...asArray(result?.unplanned).map(item => item?.reason_code),
  ].filter(Boolean)).sort();
}

function runCoverageScenario(plannerAssets, rawItems) {
  const request = plannerRequest(rawItems);
  const candidates = buildPotCandidates(plannerAssets, request);
  const result = planMeal(plannerAssets, request);
  const planned = representativeItems(result?.plan?.planned_must_use);
  const unplanned = representativeItems(result?.plan?.unplanned_must_use);
  const pots = asArray(result?.plan?.pots);
  return {
    submitted_raw_items: [...request.must_use],
    status: result?.status || 'no_valid_plan',
    plan_kind: pots.length ? (result?.plan?.plan_kind || 'single_pot') : 'none',
    pot_count: pots.length,
    candidate_template_ids: uniqueStrings(candidates.map(candidate => candidate?.template_id).filter(Boolean)),
    selected_template_ids: pots.map(pot => pot?.template_id).filter(Boolean),
    planned_items: structuredClone(planned),
    planned_raw_items: planned.map(item => item.raw),
    unplanned_items: structuredClone(unplanned),
    unplanned_raw_items: unplanned.map(item => item.raw),
    reason_codes: reasonCodes(result),
    ratio_plans: pots.map(pot => ({
      template_id: pot.template_id,
      ingredient_amounts: structuredClone(asArray(pot.ingredient_amounts)),
      required_extra_items: structuredClone(asArray(pot.required_extra_items)),
      liquid_constraints: structuredClone(pot.liquid_constraints || null),
      ratio_trace: structuredClone(asArray(pot.ratio_trace)),
    })),
  };
}

function evidenceAlignment(selectedTemplateIds, recipeId, templates) {
  const byId = new Map(asArray(templates?.templates).map(template => [template?.template_id, template]));
  const evidenceTemplateIds = [];
  const compatibleOnlyTemplateIds = [];
  for (const templateId of uniqueStrings(selectedTemplateIds)) {
    const evidenceIds = asArray(byId.get(templateId)?.evidence_recipe_ids);
    if (evidenceIds.includes(recipeId)) evidenceTemplateIds.push(templateId);
    else compatibleOnlyTemplateIds.push(templateId);
  }
  return {
    direct_template_evidence: evidenceTemplateIds.length > 0,
    evidence_template_ids: evidenceTemplateIds,
    ingredient_compatible_only_template_ids: compatibleOnlyTemplateIds,
  };
}

function deriveAuditStatus(entry) {
  if (entry.source_record_valid === false) return 'invalid_source_record';
  if (entry.planner_eligible_items.filter(item => item.duplicate_of === null).length === 0) return 'no_recognized_core';
  if (entry.unclassified_core_items.length > 0) return 'taxonomy_gap';
  if (entry.raw_core_scenario.status !== 'complete'
      || entry.raw_core_scenario.end_to_end_core_coverage_ratio !== 1) return 'planner_gap';
  if (entry.raw_core_scenario.pot_count > 1) return 'full_multi_pot';
  if (entry.evidence_alignment.direct_template_evidence) return 'full_single_pot_evidence_aligned';
  return 'full_single_pot_ingredient_compatible';
}

function priorityBand(auditStatus) {
  if (['invalid_source_record', 'no_recognized_core'].includes(auditStatus)) return 'P0';
  if (['taxonomy_gap', 'planner_gap'].includes(auditStatus)) return 'P1';
  if (auditStatus === 'full_multi_pot') return 'P2';
  if (auditStatus === 'full_single_pot_ingredient_compatible') return 'P3';
  return 'covered';
}

function buildGapCodes(entry) {
  const codes = [];
  if (entry.source_record_valid === false) codes.push('invalid_source_record');
  if (entry.planner_eligible_items.filter(item => item.duplicate_of === null).length === 0) codes.push('no_recognized_core');
  if (entry.unclassified_core_items.length > 0) codes.push('taxonomy_gap');
  if (entry.recognized_only_scenario.status !== 'complete'
      || entry.recognized_only_scenario.recognized_planner_coverage_ratio !== 1) codes.push('planner_gap');
  return codes;
}

export function buildRecipeCoverageEntry(recipe, context = {}) {
  const safeRecipe = asObject(recipe);
  const rawCoreItems = asArray(safeRecipe.core_ingredients)
    .filter(value => typeof value === 'string')
    .map(value => value.trim())
    .filter(Boolean);
  const plannerAssets = asObject(context.plannerAssets);
  const partitioned = partitionCoreItems(rawCoreItems, plannerAssets.taxonomy);
  const eligibleRepresentatives = representativeItems(partitioned.plannerEligible);
  const unknownRepresentatives = representativeItems(partitioned.unknown);
  const denominator = eligibleRepresentatives.length + unknownRepresentatives.length;
  const basicRaw = new Set(partitioned.basics.map(item => item.raw));
  const rawScenarioItems = rawCoreItems.filter(raw => !basicRaw.has(raw));
  const recognizedScenarioItems = eligibleRepresentatives.map(item => item.raw);
  const rawCoreScenario = runCoverageScenario(plannerAssets, rawScenarioItems);
  const recognizedOnlyScenario = runCoverageScenario(plannerAssets, recognizedScenarioItems);
  const plannedRecognizedIdentities = new Set(
    recognizedOnlyScenario.planned_items.filter(item => item.recognized).map(promiseIdentity),
  );
  recognizedOnlyScenario.recognized_planner_coverage_ratio = ratioOrNull(
    plannedRecognizedIdentities.size,
    eligibleRepresentatives.length,
  );
  const rawPlannedIdentities = new Set(
    rawCoreScenario.planned_items.filter(item => item.recognized).map(promiseIdentity),
  );
  rawCoreScenario.end_to_end_core_coverage_ratio = ratioOrNull(rawPlannedIdentities.size, denominator);

  const mapping = context.mappingByRecipeId?.get?.(safeRecipe.id) || null;
  const sourceRecordValid = Boolean(
    safeRecipe.id && safeRecipe.name && safeRecipe.status && rawCoreItems.length
      && mapping,
  );
  const selectedForEvidence = rawCoreScenario.selected_template_ids;
  const entry = {
    recipe_id: safeRecipe.id || null,
    recipe_name: safeRecipe.name || null,
    recipe_status: safeRecipe.status || null,
    regional_scope: mapping?.regional_scope || null,
    region_ids: structuredClone(asArray(mapping?.region_ids)),
    technique_family_id: mapping?.primary_family_id || null,
    source_record_valid: sourceRecordValid,
    raw_core_items: [...rawCoreItems],
    planner_eligible_items: structuredClone(partitioned.plannerEligible),
    recognized_basic_items: structuredClone(partitioned.basics),
    unclassified_core_items: structuredClone(partitioned.unknown),
    identity_recognition_ratio: ratioOrNull(eligibleRepresentatives.length, denominator),
    recognized_only_scenario: recognizedOnlyScenario,
    raw_core_scenario: rawCoreScenario,
    evidence_alignment: evidenceAlignment(selectedForEvidence, safeRecipe.id, plannerAssets.templates),
  };
  entry.gap_codes = buildGapCodes(entry);
  entry.audit_status = deriveAuditStatus(entry);
  entry.priority_band = priorityBand(entry.audit_status);
  return entry;
}

export { PLANNER_VERSION };

function statusSummary(rows) {
  return Object.fromEntries(AUDIT_STATUSES.map(status => [
    status,
    rows.filter(row => row.audit_status === status).length,
  ]));
}

function prioritySummary(rows) {
  return Object.fromEntries(PRIORITY_BANDS.map(priority => [
    priority,
    rows.filter(row => row.priority_band === priority).length,
  ]));
}

function aggregateRows(values, recipeEntries) {
  return [...values].sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')).map(id => {
    const owned = recipeEntries.filter(entry => entry.region_ids.includes(id));
    return {
      region_id: id,
      recipe_count: owned.length,
      single_pot_full_count: owned.filter(entry => entry.audit_status.startsWith('full_single_pot_')).length,
      taxonomy_gap_count: owned.filter(entry => entry.gap_codes.includes('taxonomy_gap')).length,
      planner_gap_count: owned.filter(entry => entry.gap_codes.includes('planner_gap')).length,
    };
  });
}

function aggregateTechniques(mappings, recipeEntries) {
  const ids = uniqueStrings(asArray(mappings?.template_capability_mappings)
    .map(row => row?.family_id).filter(Boolean)).sort((left, right) => left.localeCompare(right));
  return ids.map(id => {
    const owned = recipeEntries.filter(entry => entry.technique_family_id === id);
    return {
      technique_family_id: id,
      recipe_count: owned.length,
      single_pot_full_count: owned.filter(entry => entry.audit_status.startsWith('full_single_pot_')).length,
      taxonomy_gap_count: owned.filter(entry => entry.gap_codes.includes('taxonomy_gap')).length,
      planner_gap_count: owned.filter(entry => entry.gap_codes.includes('planner_gap')).length,
    };
  });
}

function aggregateTemplates(templates, recipeEntries) {
  return asArray(templates?.templates)
    .filter(template => template?.activation_status === 'active' && template.runtime_eligible === true)
    .map(template => {
      const selected = recipeEntries.filter(entry => entry.raw_core_scenario.selected_template_ids.includes(template.template_id));
      return {
        template_id: template.template_id,
        selected_recipe_count: selected.length,
        direct_evidence_recipe_count: selected.filter(entry => entry.evidence_alignment.evidence_template_ids.includes(template.template_id)).length,
      };
    });
}

function aggregateUnknownItems(recipeEntries) {
  const recipeIdsByRaw = new Map();
  for (const entry of recipeEntries) {
    for (const item of representativeItems(entry.unclassified_core_items)) {
      if (!recipeIdsByRaw.has(item.raw)) recipeIdsByRaw.set(item.raw, new Set());
      recipeIdsByRaw.get(item.raw).add(entry.recipe_id);
    }
  }
  return [...recipeIdsByRaw.entries()].map(([raw, recipeIds]) => ({
    raw,
    recipe_count: recipeIds.size,
    recipe_ids: [...recipeIds].sort(),
  })).sort((left, right) => right.recipe_count - left.recipe_count
    || left.raw.localeCompare(right.raw, 'zh-Hans-CN'));
}

export function buildPlannerMenuCoverage(inputs = {}) {
  const recipeLibrary = asObject(inputs.recipeLibrary);
  const taxonomy = asObject(inputs.taxonomy);
  const templates = asObject(inputs.templates);
  const ratios = asObject(inputs.ratios);
  const mappings = asObject(inputs.mappings);
  const productionMappings = asArray(mappings.production_recipe_mappings);
  const mappingByRecipeId = new Map(productionMappings.map(mapping => [mapping?.source_id, mapping]));
  const plannerAssets = { recipes: recipeLibrary, taxonomy, templates, ratios };
  const recipes = asArray(recipeLibrary.recipes).map(recipe => buildRecipeCoverageEntry(recipe, {
    plannerAssets,
    mappingByRecipeId,
  }));
  const regionIds = new Set(productionMappings.flatMap(mapping => asArray(mapping?.region_ids)));
  return {
    schema_version: 1,
    planner_version: PLANNER_VERSION,
    template_catalog_version: templates.template_catalog_version || null,
    taxonomy_version: taxonomy.taxonomy_version || null,
    ratio_catalog_version: ratios.ratio_catalog_version || null,
    source_hashes: Object.fromEntries(Object.entries(asObject(inputs.sourceHashes)).sort(([left], [right]) => left.localeCompare(right))),
    summary: {
      recipe_count: recipes.length,
      approved_count: recipes.filter(recipe => recipe.recipe_status === 'approved').length,
      auto_approved_count: recipes.filter(recipe => recipe.recipe_status === 'auto_approved').length,
      status_counts: statusSummary(recipes),
      priority_counts: prioritySummary(recipes),
    },
    by_region: aggregateRows(regionIds, recipes),
    by_technique_family: aggregateTechniques(mappings, recipes),
    by_template: aggregateTemplates(templates, recipes),
    unclassified_items: aggregateUnknownItems(recipes),
    recipes,
  };
}

function numberEqual(left, right) {
  return left === right || (Number.isNaN(left) && Number.isNaN(right));
}

function unexpectedRuntimeFields(value, path = 'report', errors = []) {
  if (!value || typeof value !== 'object') return errors;
  const forbidden = new Set(['steps', 'dish_name', 'model_dish_name', 'generated_name', 'user_profile', 'network_data']);
  for (const [key, child] of Object.entries(value)) {
    if (forbidden.has(key)) errors.push(`${path} contains forbidden runtime field ${key}`);
    unexpectedRuntimeFields(child, `${path}.${key}`, errors);
  }
  return errors;
}

export function validatePlannerMenuCoverage(report, inputs = {}) {
  const errors = [];
  const safeReport = asObject(report);
  const recipes = asArray(safeReport.recipes);
  const baselineRows = asArray(inputs?.baseline?.production_menus);
  const expectedRows = baselineRows.map(row => ({ recipe_id: row?.id, recipe_status: row?.status }));
  const actualRows = recipes.map(row => ({ recipe_id: row?.recipe_id, recipe_status: row?.recipe_status }));
  if (safeReport.schema_version !== 1) errors.push('coverage schema_version must be 1');
  if (safeReport.planner_version !== PLANNER_VERSION) errors.push(`coverage planner_version must be ${PLANNER_VERSION}`);
  if (safeReport.template_catalog_version !== inputs?.templates?.template_catalog_version) errors.push('coverage template_catalog_version is stale');
  if (safeReport.taxonomy_version !== inputs?.taxonomy?.taxonomy_version) errors.push('coverage taxonomy_version is stale');
  if (safeReport.ratio_catalog_version !== inputs?.ratios?.ratio_catalog_version) errors.push('coverage ratio_catalog_version is stale');
  const sourceHashes = asObject(safeReport.source_hashes);
  if (JSON.stringify(Object.keys(sourceHashes)) !== JSON.stringify(REQUIRED_SOURCE_PATHS)
      || Object.values(sourceHashes).some(hash => typeof hash !== 'string' || !/^[0-9a-f]{64}$/.test(hash))) {
    errors.push('coverage source_hashes must contain the seven canonical SHA-256 inputs');
  }
  if (!Array.isArray(safeReport.recipes)) errors.push('coverage recipes must be an array');
  if (recipes.length !== baselineRows.length) errors.push(`coverage recipe count must be ${baselineRows.length}`);
  if (new Set(recipes.map(row => row?.recipe_id)).size !== recipes.length) errors.push('coverage recipe IDs must be unique');
  if (JSON.stringify(actualRows) !== JSON.stringify(expectedRows)) errors.push('coverage recipe ID/status order must match the menu baseline');

  const templateById = new Map(asArray(inputs?.templates?.templates).map(template => [template?.template_id, template]));
  const mappingById = new Map(asArray(inputs?.mappings?.production_recipe_mappings).map(mapping => [mapping?.source_id, mapping]));
  for (const [index, rowValue] of recipes.entries()) {
    const row = asObject(rowValue);
    const label = `coverage recipe ${index} ${row.recipe_id || '<missing>'}`;
    if (!AUDIT_STATUSES.includes(row.audit_status)) errors.push(`${label} has unknown audit_status`);
    if (!PRIORITY_BANDS.includes(row.priority_band)) errors.push(`${label} has unknown priority_band`);
    const mapping = mappingById.get(row.recipe_id);
    if (!mapping) errors.push(`${label} has no source mapping`);
    if ((row.technique_family_id ?? null) !== (mapping?.primary_family_id ?? null)) errors.push(`${label} technique family does not match source mapping`);
    const eligible = representativeItems(row.planner_eligible_items);
    const unknown = representativeItems(row.unclassified_core_items);
    const identityRatio = ratioOrNull(eligible.length, eligible.length + unknown.length);
    if (!numberEqual(row.identity_recognition_ratio, identityRatio)) errors.push(`${label} identity_recognition_ratio is inconsistent`);
    const plannedRecognized = new Set(asArray(row.recognized_only_scenario?.planned_items)
      .filter(item => item?.recognized).map(promiseIdentity));
    const recognizedCoverage = ratioOrNull(plannedRecognized.size, eligible.length);
    if (!numberEqual(row.recognized_only_scenario?.recognized_planner_coverage_ratio, recognizedCoverage)) {
      errors.push(`${label} recognized_planner_coverage_ratio is inconsistent`);
    }
    const rawPlanned = new Set(asArray(row.raw_core_scenario?.planned_items)
      .filter(item => item?.recognized).map(promiseIdentity));
    const endToEnd = ratioOrNull(rawPlanned.size, eligible.length + unknown.length);
    if (!numberEqual(row.raw_core_scenario?.end_to_end_core_coverage_ratio, endToEnd)) {
      errors.push(`${label} end_to_end_core_coverage_ratio is inconsistent`);
    }
    for (const scenarioName of ['recognized_only_scenario', 'raw_core_scenario']) {
      const scenario = asObject(row[scenarioName]);
      const selected = asArray(scenario.selected_template_ids);
      if (selected.some(templateId => !templateById.has(templateId))) errors.push(`${label} ${scenarioName} references unknown template`);
      if (scenario.pot_count !== selected.length) errors.push(`${label} ${scenarioName} pot_count does not match selected templates`);
      if (scenario.plan_kind === 'single_pot' && scenario.pot_count !== 1) errors.push(`${label} ${scenarioName} single_pot must contain one pot`);
      if (scenario.plan_kind === 'multi_pot' && scenario.pot_count < 2) errors.push(`${label} ${scenarioName} multi_pot must contain at least two pots`);
    }
    for (const templateId of asArray(row.evidence_alignment?.evidence_template_ids)) {
      if (!asArray(templateById.get(templateId)?.evidence_recipe_ids).includes(row.recipe_id)) {
        errors.push(`${label} claims false direct template evidence`);
      }
    }
    if (row.evidence_alignment?.direct_template_evidence !== (asArray(row.evidence_alignment?.evidence_template_ids).length > 0)) {
      errors.push(`${label} direct_template_evidence flag is inconsistent`);
    }
    const expectedAuditStatus = deriveAuditStatus(row);
    if (row.audit_status !== expectedAuditStatus) errors.push(`${label} audit_status is inconsistent`);
    if (row.priority_band !== priorityBand(expectedAuditStatus)) errors.push(`${label} priority_band is inconsistent`);
  }

  const expectedSummary = {
    recipe_count: recipes.length,
    approved_count: recipes.filter(recipe => recipe?.recipe_status === 'approved').length,
    auto_approved_count: recipes.filter(recipe => recipe?.recipe_status === 'auto_approved').length,
    status_counts: statusSummary(recipes),
    priority_counts: prioritySummary(recipes),
  };
  if (JSON.stringify(safeReport.summary) !== JSON.stringify(expectedSummary)) errors.push('coverage summary is inconsistent');
  const productionMappings = asArray(inputs?.mappings?.production_recipe_mappings);
  const regionIds = new Set(productionMappings.flatMap(mapping => asArray(mapping?.region_ids)));
  if (JSON.stringify(safeReport.by_region) !== JSON.stringify(aggregateRows(regionIds, recipes))) {
    errors.push('coverage by_region aggregate is inconsistent');
  }
  if (JSON.stringify(safeReport.by_technique_family) !== JSON.stringify(aggregateTechniques(inputs?.mappings, recipes))) {
    errors.push('coverage by_technique_family aggregate is inconsistent');
  }
  if (JSON.stringify(safeReport.by_template) !== JSON.stringify(aggregateTemplates(inputs?.templates, recipes))) {
    errors.push('coverage by_template aggregate is inconsistent');
  }
  if (JSON.stringify(safeReport.unclassified_items) !== JSON.stringify(aggregateUnknownItems(recipes))) {
    errors.push('coverage unclassified_items aggregate is inconsistent');
  }
  errors.push(...unexpectedRuntimeFields(safeReport));
  return errors;
}

export function formatPlannerMenuCoverageSummary(report) {
  const summary = asObject(report?.summary);
  const p1 = asObject(summary.priority_counts).P1 || 0;
  const p2 = asObject(summary.priority_counts).P2 || 0;
  return `${summary.recipe_count || 0} recipes · ${p1} P1 gaps · ${p2} P2 multi-pot records`;
}

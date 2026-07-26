import {
  PLANNER_VERSION,
  buildPotCandidates,
  normalizePlannerItems,
  planMeal,
} from '../../worker/src/planner-v2.js';

const BASIC_CATEGORIES = new Set(['liquid', 'oil', 'seasoning']);

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
    plan_kind: result?.plan?.plan_kind || 'none',
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
      && mapping && mapping.primary_family_id,
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

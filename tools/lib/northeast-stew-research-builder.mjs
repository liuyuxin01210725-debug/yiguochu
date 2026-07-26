const isObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const asObject = value => isObject(value) ? value : {};
const asArray = value => Array.isArray(value) ? value : [];
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const clone = value => value === undefined ? undefined : structuredClone(value);

function countBy(rows, key, expectedValues) {
  return Object.fromEntries(expectedValues.map(value => [value, rows.filter(row => asObject(row)[key] === value).length]));
}

function claimVerdict(prototype, claimName) {
  return asObject(asObject(prototype?.claims)[claimName]).verdict || 'not_proven';
}

function buildIngredientMatrix(prototypes) {
  const index = new Map();
  for (const prototype of prototypes) {
    for (const row of asArray(prototype.ingredient_roles)) {
      if (!hasText(row?.item)) continue;
      if (!index.has(row.item)) index.set(row.item, { prototype_ids: [], roles: [], evidence_statuses: [] });
      const entry = index.get(row.item);
      entry.prototype_ids.push(prototype.atlas_id);
      if (hasText(row.role)) entry.roles.push(row.role);
      if (hasText(row.evidence_status)) entry.evidence_statuses.push(row.evidence_status);
    }
  }
  return [...index.entries()].map(([item, value]) => ({
    item,
    prototype_ids: [...new Set(value.prototype_ids)].sort(),
    roles: [...new Set(value.roles)].sort(),
    evidence_statuses: [...new Set(value.evidence_statuses)].sort(),
  })).sort((a, b) => a.item.localeCompare(b.item, 'zh-CN'));
}

function buildHomeAdaptationBoundaries(familyModel) {
  const stapleBoundaries = asArray(familyModel?.staple_forms).map(row => ({
    boundary_id: `staple:${row?.form_id || 'unknown'}`,
    subject: row?.name || '',
    boundary_type: 'ratio_and_shape',
    evidence_status: row?.evidence_status || 'unresearched',
    explanation: row?.shape_notes || '',
  }));
  const safetyBoundaries = asArray(familyModel?.safety_branches).map(row => ({
    boundary_id: `safety:${row?.branch_id || 'unknown'}`,
    subject: row?.name || '',
    boundary_type: 'safety_endpoint',
    evidence_status: row?.evidence_status || 'unresearched',
    explanation: row?.endpoint_note || '',
  }));
  return [...stapleBoundaries, ...safetyBoundaries];
}

function completionFacts(prototypes, familyModel, journeys, machineRules, calibrationCases) {
  const concludedPrototypes = prototypes.filter(row => ['fact_checked', 'rejected'].includes(row.research_state)).length;
  const ratioReady = asArray(familyModel?.staple_forms).filter(row => row?.evidence_status === 'machine_ready').length;
  const safetyReady = asArray(familyModel?.safety_branches).filter(row => row?.evidence_status === 'machine_ready').length;
  const reviewedJourneys = journeys.filter(row => ['passed', 'failed'].includes(row?.human_review?.status)).length;
  const machineRulesReady = machineRules.filter(row => row.activation_status === 'active').length;
  const calibrationReady = calibrationCases.filter(row => row.status === 'passed').length;
  const blockingGaps = [];
  if (concludedPrototypes !== 4) blockingGaps.push('prototype_evidence_incomplete');
  if (ratioReady !== 3) blockingGaps.push('ratio_evidence_incomplete');
  if (safetyReady !== 4) blockingGaps.push('safety_evidence_incomplete');
  if (journeys.length !== 10 || reviewedJourneys !== 10) blockingGaps.push('human_journey_review_incomplete');
  if (machineRulesReady !== 2) blockingGaps.push('machine_rule_candidates_blocked');
  if (calibrationReady !== 3) blockingGaps.push('calibration_2_3_4_servings_incomplete');
  return {
    concludedPrototypes,
    ratioReady,
    safetyReady,
    reviewedJourneys,
    machineRulesReady,
    calibrationReady,
    blockingGaps,
  };
}

export function buildNortheastStewResearchReport({ assessment, regionalAtlas, regionalResearch } = {}) {
  const safeAssessment = asObject(assessment);
  const regions = asArray(regionalAtlas?.regions).filter(isObject);
  const provinceNodes = asArray(regionalAtlas?.province_nodes).filter(isObject);
  const discoveryEntries = asArray(regionalResearch?.entries).filter(isObject);
  const discoveryById = new Map(discoveryEntries.filter(row => hasText(row.atlas_id)).map(row => [row.atlas_id, row]));
  const sourceRefs = asArray(safeAssessment.source_refs).filter(isObject);
  const prototypes = asArray(safeAssessment.prototypes).filter(isObject);
  const familyModel = asObject(safeAssessment.family_model);
  const journeys = asArray(safeAssessment.journey_cases).filter(isObject);
  const machineRules = asArray(safeAssessment.machine_rule_candidates).filter(isObject);
  const calibrationCases = asArray(safeAssessment.calibration_cases).filter(isObject);
  const capabilityJourneys = asArray(safeAssessment.capability_journey_cases).filter(isObject);
  const northeast = asObject(regions.find(row => row.region_id === 'northeast'));
  const provinceCodes = asArray(safeAssessment.province_codes);

  const prototypeCandidates = prototypes.map(prototype => {
    const discovery = asObject(discoveryById.get(prototype.atlas_id));
    return {
      atlas_id: prototype.atlas_id,
      prototype_name: discovery.prototype_name || '',
      inclusion_class: discovery.inclusion_class || '',
      original_source_confidence: discovery.source_confidence || '',
      research_state: prototype.research_state || '',
      verified_geography: clone(asObject(prototype.verified_geography)),
      northeast_identity_status: claimVerdict(prototype, 'northeast_identity'),
      exact_combination_status: claimVerdict(prototype, 'exact_combination'),
      family_compatibility_status: claimVerdict(prototype, 'family_compatibility'),
      claims: clone(asObject(prototype.claims)),
      ingredient_roles: clone(asArray(prototype.ingredient_roles)),
      ratio_evidence_status: prototype.ratio_evidence_status || '',
      safety_evidence_status: prototype.safety_evidence_status || '',
      product_destinations: clone(asArray(prototype.product_destinations)),
      priority: clone(asObject(prototype.priority)),
      decision_reason: prototype.decision_reason || '',
    };
  }).sort((a, b) => a.atlas_id.localeCompare(b.atlas_id));

  const variantRelationships = prototypes.map(prototype => ({
    atlas_id: prototype.atlas_id,
    ...clone(asObject(prototype.variant_relation)),
  })).sort((a, b) => a.atlas_id.localeCompare(b.atlas_id));

  const productDestinationDecisions = prototypes.map(prototype => ({
    atlas_id: prototype.atlas_id,
    research_state: prototype.research_state || '',
    product_destinations: clone(asArray(prototype.product_destinations)),
    decision_reason: prototype.decision_reason || '',
    priority: clone(asObject(prototype.priority)),
  })).sort((a, b) => a.atlas_id.localeCompare(b.atlas_id));

  const completion = completionFacts(prototypes, familyModel, journeys, machineRules, calibrationCases);
  const sourceCountByGrade = countBy(sourceRefs, 'source_grade', ['A', 'B', 'C']);
  const report = {
    schema_version: 1,
    assessment_version: safeAssessment.assessment_version || '',
    region_overview: {
      region_id: safeAssessment.region_id || '',
      name: northeast.name || '',
      province_codes: clone(provinceCodes),
      provinces: provinceNodes.filter(row => provinceCodes.includes(row.atlas_code)).map(row => ({
        atlas_code: row.atlas_code,
        name: row.name || '',
        research_question: row.research_question || '',
      })),
      family_id: safeAssessment.family_id || '',
      research_focus: clone(asArray(northeast.research_focus)),
    },
    prototype_candidates: prototypeCandidates,
    variant_relationships: variantRelationships,
    ingredient_coverage_matrix: buildIngredientMatrix(prototypes),
    source_evidence_pack: clone(sourceRefs),
    home_adaptation_boundaries: buildHomeAdaptationBoundaries(familyModel),
    product_destination_decisions: productDestinationDecisions,
    family_model: clone(familyModel),
    journey_cases: clone(journeys),
    machine_rule_readiness: clone(machineRules),
    calibration_readiness: clone(calibrationCases),
    capability_journey_cases: clone(capabilityJourneys),
    completion_status: {
      status: completion.blockingGaps.length ? 'research_in_progress' : 'regional_round_complete',
      blocking_gaps: completion.blockingGaps,
    },
    summary: {
      prototype_count: prototypeCandidates.length,
      source_count: sourceRefs.length,
      source_count_by_grade: sourceCountByGrade,
      fact_checked_count: prototypes.filter(row => row.research_state === 'fact_checked').length,
      needs_more_evidence_count: prototypes.filter(row => row.research_state === 'needs_more_evidence').length,
      rejected_count: prototypes.filter(row => row.research_state === 'rejected').length,
      ratio_ready_form_count: completion.ratioReady,
      safety_ready_branch_count: completion.safetyReady,
      journey_count: journeys.length,
      journey_reviewed_count: completion.reviewedJourneys,
      machine_rule_candidate_count: machineRules.length,
      machine_rule_active_count: completion.machineRulesReady,
      calibration_case_count: calibrationCases.length,
      calibration_passed_count: completion.calibrationReady,
      capability_journey_count: capabilityJourneys.length,
      production_recipe_changes: 0,
      production_ratio_rule_changes: 0,
      runtime_template_changes: 0,
    },
  };
  return report;
}

export function validateNortheastStewResearchReport(report) {
  if (!isObject(report)) return ['report must be an object'];
  const errors = [];
  if (report.schema_version !== 1) errors.push('report schema_version must be 1');
  if (!hasText(report.assessment_version)) errors.push('report assessment_version must be a non-empty string');
  const arrays = {
    prototype_candidates: asArray(report.prototype_candidates),
    variant_relationships: asArray(report.variant_relationships),
    ingredient_coverage_matrix: asArray(report.ingredient_coverage_matrix),
    source_evidence_pack: asArray(report.source_evidence_pack),
    home_adaptation_boundaries: asArray(report.home_adaptation_boundaries),
    product_destination_decisions: asArray(report.product_destination_decisions),
    journey_cases: asArray(report.journey_cases),
    machine_rule_readiness: asArray(report.machine_rule_readiness),
    calibration_readiness: asArray(report.calibration_readiness),
    capability_journey_cases: asArray(report.capability_journey_cases),
  };
  for (const field of Object.keys(arrays)) if (!Array.isArray(report[field])) errors.push(`${field} must be an array`);
  if (arrays.prototype_candidates.length !== 4) errors.push('prototype_candidates must contain exactly 4 items');
  if (arrays.variant_relationships.length !== 4) errors.push('variant_relationships must contain exactly 4 items');
  if (arrays.source_evidence_pack.length !== 7) errors.push('source_evidence_pack must contain exactly 7 items');
  if (arrays.home_adaptation_boundaries.length !== 7) errors.push('home_adaptation_boundaries must contain exactly 7 items');
  if (arrays.product_destination_decisions.length !== 4) errors.push('product_destination_decisions must contain exactly 4 items');
  if (arrays.machine_rule_readiness.length !== 2) errors.push('machine_rule_readiness must contain exactly 2 items');
  if (arrays.calibration_readiness.length !== 3) errors.push('calibration_readiness must contain exactly 3 items');
  if (arrays.capability_journey_cases.length !== 22) errors.push('capability_journey_cases must contain exactly 22 items');
  if (!isObject(report.region_overview)) errors.push('region_overview must be an object');
  if (!isObject(report.family_model)) errors.push('family_model must be an object');
  if (!isObject(report.completion_status)) errors.push('completion_status must be an object');
  if (!isObject(report.summary)) errors.push('summary must be an object');

  const expectedSummary = {
    prototype_count: arrays.prototype_candidates.length,
    source_count: arrays.source_evidence_pack.length,
    fact_checked_count: arrays.prototype_candidates.filter(row => row?.research_state === 'fact_checked').length,
    needs_more_evidence_count: arrays.prototype_candidates.filter(row => row?.research_state === 'needs_more_evidence').length,
    rejected_count: arrays.prototype_candidates.filter(row => row?.research_state === 'rejected').length,
    ratio_ready_form_count: asArray(report.family_model?.staple_forms).filter(row => row?.evidence_status === 'machine_ready').length,
    safety_ready_branch_count: asArray(report.family_model?.safety_branches).filter(row => row?.evidence_status === 'machine_ready').length,
    journey_count: arrays.journey_cases.length,
    journey_reviewed_count: arrays.journey_cases.filter(row => ['passed', 'failed'].includes(row?.human_review?.status)).length,
    machine_rule_candidate_count: arrays.machine_rule_readiness.length,
    machine_rule_active_count: arrays.machine_rule_readiness.filter(row => row?.activation_status === 'active').length,
    calibration_case_count: arrays.calibration_readiness.length,
    calibration_passed_count: arrays.calibration_readiness.filter(row => row?.status === 'passed').length,
    capability_journey_count: arrays.capability_journey_cases.length,
    production_recipe_changes: 0,
    production_ratio_rule_changes: 0,
    runtime_template_changes: 0,
  };
  for (const [field, expected] of Object.entries(expectedSummary)) {
    if (report.summary?.[field] !== expected) errors.push(`summary ${field} expected ${expected}, got ${report.summary?.[field]}`);
  }
  const grades = countBy(arrays.source_evidence_pack, 'source_grade', ['A', 'B', 'C']);
  if (JSON.stringify(report.summary?.source_count_by_grade) !== JSON.stringify(grades)) {
    errors.push('summary source_count_by_grade is inconsistent');
  }

  const completion = completionFacts(
    arrays.prototype_candidates,
    report.family_model,
    arrays.journey_cases,
    arrays.machine_rule_readiness,
    arrays.calibration_readiness,
  );
  const shouldBeComplete = completion.blockingGaps.length === 0;
  if (report.completion_status?.status === 'regional_round_complete' && !shouldBeComplete) {
    errors.push('completion status cannot be complete while evidence or review is incomplete');
  }
  const expectedStatus = shouldBeComplete ? 'regional_round_complete' : 'research_in_progress';
  if (report.completion_status?.status !== expectedStatus) errors.push(`completion status expected ${expectedStatus}`);
  if (JSON.stringify(asArray(report.completion_status?.blocking_gaps)) !== JSON.stringify(completion.blockingGaps)) {
    errors.push('completion blocking_gaps are inconsistent');
  }

  const prototypeIds = arrays.prototype_candidates.map(row => row?.atlas_id);
  if (new Set(prototypeIds).size !== prototypeIds.length) errors.push('prototype candidate atlas_id must be unique');
  const decisionIds = arrays.product_destination_decisions.map(row => row?.atlas_id);
  if (JSON.stringify([...prototypeIds].sort()) !== JSON.stringify([...decisionIds].sort())) {
    errors.push('product destination decisions must cover every prototype');
  }
  return errors;
}

export function formatNortheastStewResearchSummary(report) {
  const summary = asObject(report?.summary);
  const blockedRules = (summary.machine_rule_candidate_count ?? 0) - (summary.machine_rule_active_count ?? 0);
  const pendingCalibrations = (summary.calibration_case_count ?? 0) - (summary.calibration_passed_count ?? 0);
  return `${summary.prototype_count ?? 0} prototypes · ${summary.source_count ?? 0} sources · ${summary.journey_count ?? 0} regional journeys · ${blockedRules} blocked machine rules · ${summary.machine_rule_active_count ?? 0} active · ${pendingCalibrations} pending calibrations · ${summary.capability_journey_count ?? 0} staged capability journeys · ${report?.completion_status?.status || 'research_in_progress'}`;
}

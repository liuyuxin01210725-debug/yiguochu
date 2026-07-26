const EXPECTED_PROVINCES = ['CN-SH', 'CN-JS', 'CN-ZJ', 'CN-AH'];

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const asObject = value => isObject(value) ? value : {};
const asArray = value => Array.isArray(value) ? value : [];
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const clone = value => value === undefined ? undefined : structuredClone(value);

function countBy(rows, field, keys) {
  const counts = Object.fromEntries(keys.map(key => [key, 0]));
  for (const row of rows) if (row && Object.hasOwn(counts, row[field])) counts[row[field]] += 1;
  return counts;
}

function buildIngredientMatrix(audits) {
  const index = new Map();
  for (const audit of audits) {
    if (!isObject(audit)) continue;
    for (const role of asArray(audit.ingredient_roles)) {
      if (!isObject(role) || !hasText(role.item)) continue;
      if (!index.has(role.item)) index.set(role.item, {
        recipe_ids: [], roles: [], evidence_statuses: [],
      });
      const entry = index.get(role.item);
      entry.recipe_ids.push(audit.recipe_id);
      if (hasText(role.role)) entry.roles.push(role.role);
      if (hasText(role.evidence_status)) entry.evidence_statuses.push(role.evidence_status);
    }
  }
  return [...index.entries()].map(([item, value]) => ({
    item,
    recipe_ids: [...new Set(value.recipe_ids)].sort(),
    roles: [...new Set(value.roles)].sort(),
    evidence_statuses: [...new Set(value.evidence_statuses)].sort(),
  })).sort((a, b) => a.item.localeCompare(b.item, 'zh-CN'));
}

function buildBoundaries(familyModel) {
  const model = asObject(familyModel);
  const adaptations = asArray(model.adaptation_boundaries).filter(isObject).map(row => ({
    boundary_id: `adaptation:${row.boundary_id || 'unknown'}`,
    subject: row.name || '',
    boundary_type: 'adaptation_equivalence',
    evidence_status: row.evidence_status || 'unresearched',
    explanation: row.notes || '',
  }));
  const ratios = asArray(model.ratio_branches).filter(isObject).map(row => ({
    boundary_id: `ratio:${row.branch_id || 'unknown'}`,
    subject: row.name || '',
    boundary_type: 'ratio_and_liquid',
    evidence_status: row.evidence_status || 'unresearched',
    explanation: row.notes || '',
  }));
  const safety = asArray(model.safety_branches).filter(isObject).map(row => ({
    boundary_id: `safety:${row.branch_id || 'unknown'}`,
    subject: row.name || '',
    boundary_type: 'safety_endpoint',
    evidence_status: row.evidence_status || 'unresearched',
    explanation: row.endpoint_note || '',
  }));
  return [...adaptations, ...ratios, ...safety];
}

function completionFacts(audits, leads, familyModel, journeys) {
  const productionClaimGaps = audits.some(audit => Object.values(asObject(audit?.claims)).some(claim => claim?.verdict !== 'supported'));
  const ratioBranches = asArray(familyModel?.ratio_branches);
  const safetyBranches = asArray(familyModel?.safety_branches);
  const ratioReady = ratioBranches.filter(row => row?.evidence_status === 'machine_ready').length;
  const safetyReady = safetyBranches.filter(row => row?.evidence_status === 'machine_ready').length;
  const anhuiPromoted = leads.length === 2 && leads.every(row => row?.research_state === 'product_fit_reviewed'
    && asArray(row?.product_destinations).some(destination => destination !== 'research_only'));
  const reviewedJourneys = journeys.filter(row => ['passed', 'failed'].includes(row?.human_review?.status)).length;
  const blockingGaps = [];
  if (productionClaimGaps) blockingGaps.push('production_claim_gaps');
  if (ratioBranches.length === 0 || ratioReady !== ratioBranches.length) blockingGaps.push('ratio_evidence_incomplete');
  if (safetyBranches.length === 0 || safetyReady !== safetyBranches.length) blockingGaps.push('safety_evidence_incomplete');
  if (!anhuiPromoted) blockingGaps.push('anhui_leads_not_promoted');
  if (journeys.length !== 12 || reviewedJourneys !== 12) blockingGaps.push('human_journey_review_incomplete');
  return { ratioReady, safetyReady, reviewedJourneys, blockingGaps };
}

export function buildJiangnanRiceResearchReport({
  assessment,
  recipeLibrary,
  recipeCandidates,
  regionalAtlas,
  regionalMappings,
} = {}) {
  const safeAssessment = asObject(assessment);
  const recipes = asArray(recipeLibrary?.recipes).filter(isObject);
  const candidates = asArray(recipeCandidates?.entries).filter(isObject);
  const atlasRegions = asArray(regionalAtlas?.regions).filter(isObject);
  const provinceNodes = asArray(regionalAtlas?.province_nodes).filter(isObject);
  const mappings = asArray(regionalMappings?.production_recipe_mappings).filter(isObject);
  const audits = asArray(safeAssessment.recipe_audits).filter(isObject);
  const leads = asArray(safeAssessment.province_research_leads).filter(isObject);
  const sources = asArray(safeAssessment.source_refs).filter(isObject);
  const familyModel = asObject(safeAssessment.family_model);
  const journeys = asArray(safeAssessment.journey_cases).filter(isObject);
  const recipeIndex = new Map(recipes.filter(row => hasText(row.id)).map(row => [row.id, row]));
  const candidateIndex = new Map(candidates.filter(row => hasText(row.id)).map(row => [row.id, row]));
  const mappingIndex = new Map(mappings.filter(row => hasText(row.source_id)).map(row => [row.source_id, row]));
  const jiangnan = asObject(atlasRegions.find(row => row.region_id === 'jiangnan'));
  const provinceCodes = asArray(safeAssessment.province_codes);

  const recipeAudits = audits.map(audit => {
    const recipe = asObject(recipeIndex.get(audit.recipe_id));
    const candidate = asObject(candidateIndex.get(audit.candidate_id));
    const mapping = asObject(mappingIndex.get(audit.recipe_id));
    return {
      recipe_id: audit.recipe_id,
      recipe_name: recipe.name || '',
      recipe_status: recipe.status || '',
      recipe_family_id: recipe.family_id || '',
      core_ingredients: clone(asArray(recipe.core_ingredients)),
      candidate_id: audit.candidate_id,
      candidate_name: candidate.name || '',
      candidate_traditional_basis: candidate.traditional_basis || '',
      province_codes: clone(asArray(audit.province_codes)),
      regional_scope: mapping.regional_scope || '',
      primary_family_id: mapping.primary_family_id || '',
      audit_state: audit.audit_state || '',
      claims: clone(asObject(audit.claims)),
      ingredient_roles: clone(asArray(audit.ingredient_roles)),
      ratio_evidence_status: audit.ratio_evidence_status || '',
      safety_evidence_status: audit.safety_evidence_status || '',
      variant_relation: clone(asObject(audit.variant_relation)),
      product_destinations: clone(asArray(audit.product_destinations)),
      priority: clone(asObject(audit.priority)),
      decision_reason: audit.decision_reason || '',
    };
  }).sort((a, b) => a.recipe_id.localeCompare(b.recipe_id));

  const provinceRows = provinceCodes.map(code => {
    const node = asObject(provinceNodes.find(row => row.atlas_code === code));
    const productionRecipeIds = mappings
      .filter(row => row.source_type === 'production_recipe' && asArray(row.province_codes).includes(code) && asArray(row.region_ids).includes('jiangnan'))
      .map(row => row.source_id)
      .sort();
    const researchLeadIds = leads.filter(row => asArray(row.province_codes).includes(code)).map(row => row.lead_id).sort();
    return {
      atlas_code: code,
      name: node.name || '',
      research_question: node.research_question || '',
      production_recipe_count: productionRecipeIds.length,
      production_recipe_ids: productionRecipeIds,
      research_lead_count: researchLeadIds.length,
      research_lead_ids: researchLeadIds,
    };
  });

  const variantRelationships = recipeAudits.map(row => ({
    recipe_id: row.recipe_id,
    ...clone(row.variant_relation),
  })).sort((a, b) => a.recipe_id.localeCompare(b.recipe_id));

  const productDestinationDecisions = [
    ...recipeAudits.map(row => ({
      subject_type: 'production_recipe',
      subject_id: row.recipe_id,
      state: row.audit_state,
      product_destinations: clone(row.product_destinations),
      priority: clone(row.priority),
      decision_reason: row.decision_reason,
    })),
    ...leads.map(row => ({
      subject_type: 'province_research_lead',
      subject_id: row.lead_id,
      state: row.research_state || '',
      product_destinations: clone(asArray(row.product_destinations)),
      priority: clone(asObject(row.priority)),
      decision_reason: row.decision_reason || '',
    })),
  ].sort((a, b) => a.subject_id.localeCompare(b.subject_id));

  const completion = completionFacts(recipeAudits, leads, familyModel, journeys);
  const sourceCountByGrade = countBy(sources, 'source_grade', ['A', 'B', 'C']);
  const report = {
    schema_version: 1,
    assessment_version: safeAssessment.assessment_version || '',
    region_overview: {
      region_id: safeAssessment.region_id || '',
      name: jiangnan.name || '',
      province_codes: clone(provinceCodes),
      provinces: provinceRows,
      family_id: safeAssessment.family_id || '',
      research_focus: clone(asArray(jiangnan.research_focus)),
    },
    recipe_audits: recipeAudits,
    variant_relationships: variantRelationships,
    ingredient_coverage_matrix: buildIngredientMatrix(audits),
    source_evidence_pack: clone(sources),
    home_adaptation_boundaries: buildBoundaries(familyModel),
    product_destination_decisions: productDestinationDecisions,
    province_research_leads: clone(leads),
    family_model: clone(familyModel),
    journey_cases: clone(journeys),
    completion_status: {
      status: completion.blockingGaps.length ? 'research_in_progress' : 'regional_round_complete',
      blocking_gaps: completion.blockingGaps,
    },
    summary: {
      recipe_audit_count: recipeAudits.length,
      source_count: sources.length,
      source_count_by_grade: sourceCountByGrade,
      evidence_checked_count: recipeAudits.filter(row => row.audit_state === 'evidence_checked').length,
      needs_more_evidence_count: recipeAudits.filter(row => row.audit_state === 'needs_more_evidence').length,
      rejected_count: recipeAudits.filter(row => row.audit_state === 'rejected').length,
      cross_regional_recipe_count: recipeAudits.filter(row => row.regional_scope === 'cross_regional_chinese').length,
      research_lead_count: leads.length,
      ratio_ready_branch_count: completion.ratioReady,
      safety_ready_branch_count: completion.safetyReady,
      journey_count: journeys.length,
      journey_reviewed_count: completion.reviewedJourneys,
      production_recipe_changes: 0,
    },
  };
  return report;
}

function provinceCounts(report, code) {
  const audits = asArray(report?.recipe_audits);
  const leads = asArray(report?.province_research_leads);
  return {
    productionRecipeIds: audits.filter(row => asArray(row?.province_codes).includes(code)).map(row => row.recipe_id).sort(),
    researchLeadIds: leads.filter(row => asArray(row?.province_codes).includes(code)).map(row => row.lead_id).sort(),
  };
}

export function validateJiangnanRiceResearchReport(report) {
  if (!isObject(report)) return ['report must be an object'];
  const errors = [];
  if (report.schema_version !== 1) errors.push('report schema_version must be 1');
  if (!hasText(report.assessment_version)) errors.push('report assessment_version must be a non-empty string');
  const arrays = {
    recipe_audits: asArray(report.recipe_audits),
    variant_relationships: asArray(report.variant_relationships),
    ingredient_coverage_matrix: asArray(report.ingredient_coverage_matrix),
    source_evidence_pack: asArray(report.source_evidence_pack),
    home_adaptation_boundaries: asArray(report.home_adaptation_boundaries),
    product_destination_decisions: asArray(report.product_destination_decisions),
    province_research_leads: asArray(report.province_research_leads),
    journey_cases: asArray(report.journey_cases),
  };
  for (const field of Object.keys(arrays)) if (!Array.isArray(report[field])) errors.push(`${field} must be an array`);
  if (arrays.recipe_audits.length !== 8) errors.push('recipe_audits must contain exactly 8 items');
  if (arrays.variant_relationships.length !== 8) errors.push('variant_relationships must contain exactly 8 items');
  if (arrays.source_evidence_pack.length !== 8) errors.push('source_evidence_pack must contain exactly 8 items');
  if (arrays.product_destination_decisions.length !== 10) errors.push('product_destination_decisions must contain exactly 10 items');
  if (arrays.province_research_leads.length !== 2) errors.push('province_research_leads must contain exactly 2 items');
  if (arrays.journey_cases.length !== 12) errors.push('journey_cases must contain exactly 12 items');
  if (!isObject(report.region_overview)) errors.push('region_overview must be an object');
  if (!isObject(report.family_model)) errors.push('family_model must be an object');
  if (!isObject(report.completion_status)) errors.push('completion_status must be an object');
  if (!isObject(report.summary)) errors.push('summary must be an object');

  const expectedSummary = {
    recipe_audit_count: arrays.recipe_audits.length,
    source_count: arrays.source_evidence_pack.length,
    evidence_checked_count: arrays.recipe_audits.filter(row => row?.audit_state === 'evidence_checked').length,
    needs_more_evidence_count: arrays.recipe_audits.filter(row => row?.audit_state === 'needs_more_evidence').length,
    rejected_count: arrays.recipe_audits.filter(row => row?.audit_state === 'rejected').length,
    cross_regional_recipe_count: arrays.recipe_audits.filter(row => row?.regional_scope === 'cross_regional_chinese').length,
    research_lead_count: arrays.province_research_leads.length,
    ratio_ready_branch_count: asArray(report.family_model?.ratio_branches).filter(row => row?.evidence_status === 'machine_ready').length,
    safety_ready_branch_count: asArray(report.family_model?.safety_branches).filter(row => row?.evidence_status === 'machine_ready').length,
    journey_count: arrays.journey_cases.length,
    journey_reviewed_count: arrays.journey_cases.filter(row => ['passed', 'failed'].includes(row?.human_review?.status)).length,
    production_recipe_changes: 0,
  };
  for (const [field, expected] of Object.entries(expectedSummary)) {
    if (report.summary?.[field] !== expected) errors.push(`summary ${field} expected ${expected}, got ${report.summary?.[field]}`);
  }
  const grades = countBy(arrays.source_evidence_pack, 'source_grade', ['A', 'B', 'C']);
  if (JSON.stringify(report.summary?.source_count_by_grade) !== JSON.stringify(grades)) errors.push('summary source_count_by_grade is inconsistent');

  const provinceRows = asArray(report.region_overview?.provinces);
  for (const code of EXPECTED_PROVINCES) {
    const row = provinceRows.find(item => item?.atlas_code === code);
    if (!row) {
      errors.push(`region overview missing province ${code}`);
      continue;
    }
    const expected = provinceCounts(report, code);
    if (row.production_recipe_count !== expected.productionRecipeIds.length
      || JSON.stringify(row.production_recipe_ids) !== JSON.stringify(expected.productionRecipeIds)) {
      errors.push(`province production_recipe_count is inconsistent for ${code}`);
    }
    if (row.research_lead_count !== expected.researchLeadIds.length
      || JSON.stringify(row.research_lead_ids) !== JSON.stringify(expected.researchLeadIds)) {
      errors.push(`province research_lead_count is inconsistent for ${code}`);
    }
  }

  const completion = completionFacts(arrays.recipe_audits, arrays.province_research_leads, report.family_model, arrays.journey_cases);
  const expectedStatus = completion.blockingGaps.length ? 'research_in_progress' : 'regional_round_complete';
  if (report.completion_status?.status === 'regional_round_complete' && completion.blockingGaps.length) {
    errors.push('completion status cannot be complete while evidence or review is incomplete');
  }
  if (report.completion_status?.status !== expectedStatus) errors.push(`completion status expected ${expectedStatus}`);
  if (JSON.stringify(report.completion_status?.blocking_gaps) !== JSON.stringify(completion.blockingGaps)) {
    errors.push('completion blocking_gaps are inconsistent');
  }
  const recipeIds = arrays.recipe_audits.map(row => row?.recipe_id);
  const decisionIds = arrays.product_destination_decisions.map(row => row?.subject_id);
  const allSubjects = [...recipeIds, ...arrays.province_research_leads.map(row => row?.lead_id)].sort();
  if (JSON.stringify([...decisionIds].sort()) !== JSON.stringify(allSubjects)) errors.push('product destination decisions must cover all audits and leads');
  return errors;
}

export function formatJiangnanRiceResearchSummary(report) {
  const summary = asObject(report?.summary);
  return `${summary.recipe_audit_count ?? 0} recipe audits · ${summary.source_count ?? 0} sources · ${summary.research_lead_count ?? 0} Anhui leads · ${summary.journey_count ?? 0} journeys · ${report?.completion_status?.status || 'research_in_progress'}`;
}

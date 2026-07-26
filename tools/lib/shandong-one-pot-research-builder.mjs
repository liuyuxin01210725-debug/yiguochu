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

function shapeMatrix(productionAudits, candidateAudits) {
  const index = new Map();
  const add = (shape, subjectType, subjectId) => {
    if (!hasText(shape)) return;
    if (!index.has(shape)) index.set(shape, { production_recipe_ids: [], candidate_ids: [], source_fields: [] });
    const entry = index.get(shape);
    if (subjectType === 'production') entry.production_recipe_ids.push(subjectId);
    else entry.candidate_ids.push(subjectId);
    entry.source_fields.push(subjectType);
  };
  for (const audit of productionAudits) {
    for (const role of asArray(audit?.ingredient_roles)) add(role?.role, 'production', audit.recipe_id);
  }
  for (const audit of candidateAudits) {
    for (const shape of asArray(audit?.ingredient_shapes)) add(shape, 'candidate', audit.candidate_id);
    for (const shape of asArray(audit?.shape_distinctions)) add(shape, 'candidate', audit.candidate_id);
  }
  return [...index.entries()].map(([shape, entry]) => ({
    shape,
    production_recipe_ids: [...new Set(entry.production_recipe_ids)].sort(),
    candidate_ids: [...new Set(entry.candidate_ids)].sort(),
    source_fields: [...new Set(entry.source_fields)].sort(),
  })).sort((a, b) => a.shape.localeCompare(b.shape));
}

function deriveCompletion(productionAudits, candidateAudits, safetyBoundaries, journeys) {
  const regionalIdentityGap = productionAudits.some(row => row?.claims?.shandong_specific_origin?.verdict !== 'supported')
    || candidateAudits.some(row => row?.claims?.regional_identity?.verdict === 'not_proven');
  const candidateSpecificityGap = candidateAudits.some(row => Object.values(asObject(row?.claims)).some(claim => claim?.verdict !== 'supported'));
  const safetyIncomplete = safetyBoundaries.length === 0 || safetyBoundaries.some(row => row?.evidence_status !== 'machine_ready');
  const reviewed = journeys.filter(row => ['passed', 'failed'].includes(row?.human_review?.status)).length;
  const blockers = [];
  if (regionalIdentityGap) blockers.push('regional_identity_gaps');
  if (candidateSpecificityGap) blockers.push('candidate_specificity_gaps');
  blockers.push('ratio_evidence_incomplete');
  if (safetyIncomplete) blockers.push('safety_endpoint_incomplete');
  if (journeys.length !== 12 || reviewed !== 12) blockers.push('human_journey_review_incomplete');
  return { status: blockers.length ? 'research_in_progress' : 'regional_round_complete', blockers, reviewed };
}

export function buildShandongOnePotResearchReport({
  assessment,
  recipeLibrary,
  regionalResearch,
  regionalAtlas,
  regionalMappings,
} = {}) {
  const source = asObject(assessment);
  const recipes = asArray(recipeLibrary?.recipes).filter(isObject);
  const researchRows = asArray(regionalResearch?.entries).filter(isObject);
  const region = asObject(asArray(regionalAtlas?.regions).find(row => row?.region_id === 'shandong'));
  const province = asObject(asArray(regionalAtlas?.province_nodes).find(row => row?.atlas_code === 'CN-SD'));
  const productionMappings = asArray(regionalMappings?.production_recipe_mappings).filter(isObject);
  const candidateMappings = asArray(regionalMappings?.research_candidate_mappings).filter(isObject);
  const recipeIndex = new Map(recipes.map(row => [row.id, row]));
  const researchIndex = new Map(researchRows.map(row => [row.atlas_id, row]));
  const productionMappingIndex = new Map(productionMappings.map(row => [row.source_id, row]));
  const candidateMappingIndex = new Map(candidateMappings.map(row => [row.source_id, row]));

  const productionAudits = asArray(source.production_recipe_audits).filter(isObject).map(audit => {
    const recipe = asObject(recipeIndex.get(audit.recipe_id));
    const mapping = asObject(productionMappingIndex.get(audit.recipe_id));
    return {
      ...clone(audit),
      recipe_name: recipe.name || '',
      recipe_status: recipe.status || '',
      recipe_family_id: recipe.family_id || '',
      core_ingredients: clone(asArray(recipe.core_ingredients)),
      mapping_regional_scope: mapping.regional_scope || '',
      province_codes: clone(asArray(mapping.province_codes)),
      primary_family_id: mapping.primary_family_id || '',
    };
  }).sort((a, b) => a.recipe_id.localeCompare(b.recipe_id));

  const candidateAudits = asArray(source.candidate_audits).filter(isObject).map(audit => {
    const candidate = asObject(researchIndex.get(audit.candidate_id));
    const mapping = asObject(candidateMappingIndex.get(audit.candidate_id));
    return {
      ...clone(audit),
      prototype_name: candidate.prototype_name || '',
      status: candidate.status || '',
      inclusion_class: candidate.inclusion_class || '',
      ingredient_hypothesis: clone(asArray(candidate.ingredient_hypothesis)),
      regional_scope: mapping.regional_scope || '',
      province_codes: clone(asArray(mapping.province_codes)),
      primary_family_id: mapping.primary_family_id || '',
    };
  }).sort((a, b) => a.candidate_id.localeCompare(b.candidate_id));

  const sources = asArray(source.source_refs).filter(isObject).map(clone);
  const leads = asArray(source.concrete_research_leads).filter(isObject).map(clone);
  const families = asArray(source.family_model).filter(isObject).map(clone);
  const boundaries = asArray(source.adaptation_boundaries).filter(isObject).map(clone);
  const safety = asArray(source.safety_boundaries).filter(isObject).map(clone);
  const journeys = asArray(source.journey_cases).filter(isObject).map(clone);
  const completion = deriveCompletion(productionAudits, candidateAudits, safety, journeys);
  const productDecisions = [
    ...productionAudits.map(row => ({
      subject_type: 'production_recipe', subject_id: row.recipe_id, state: row.audit_state,
      product_destinations: clone(row.product_destinations), priority: clone(row.priority), decision_reason: row.decision_reason,
    })),
    ...candidateAudits.map(row => ({
      subject_type: 'research_candidate', subject_id: row.candidate_id, state: row.audit_state,
      product_destinations: clone(row.product_destinations), priority: clone(row.priority), decision_reason: row.decision_reason,
    })),
    ...leads.map(row => ({
      subject_type: 'concrete_research_lead', subject_id: row.lead_id, state: 'research_only',
      product_destinations: clone(row.product_destinations), priority: clone(row.priority), decision_reason: row.decision_reason,
    })),
  ].sort((a, b) => a.subject_id.localeCompare(b.subject_id));

  return {
    schema_version: 1,
    assessment_version: source.assessment_version || '',
    region_overview: {
      region_id: source.region_id || '',
      name: region.name || '',
      province_codes: clone(asArray(source.province_codes)),
      research_focus: clone(asArray(region.research_focus)),
      province_research_question: province.research_question || '',
      production_recipe_count: productionAudits.length,
      candidate_count: candidateAudits.length,
      concrete_research_lead_count: leads.length,
    },
    production_recipe_audits: productionAudits,
    candidate_audits: candidateAudits,
    family_model: families,
    ingredient_shape_matrix: shapeMatrix(productionAudits, candidateAudits),
    adaptation_boundaries: boundaries,
    safety_boundaries: safety,
    source_evidence: sources,
    concrete_research_leads: leads,
    product_decisions: productDecisions,
    household_journeys: journeys,
    completion: { status: completion.status, blockers: completion.blockers },
    summary: {
      production_audit_count: productionAudits.length,
      candidate_audit_count: candidateAudits.length,
      concrete_research_lead_count: leads.length,
      source_count: sources.length,
      source_count_by_grade: countBy(sources, 'source_grade', ['A', 'B', 'C']),
      family_count: families.length,
      household_journey_count: journeys.length,
      human_journey_reviewed_count: completion.reviewed,
      production_recipe_changes: 0,
    },
  };
}

function expectedCompletion(report) {
  return deriveCompletion(
    asArray(report?.production_recipe_audits),
    asArray(report?.candidate_audits),
    asArray(report?.safety_boundaries),
    asArray(report?.household_journeys),
  );
}

export function validateShandongOnePotResearchReport(report) {
  if (!isObject(report)) return ['report must be an object'];
  const errors = [];
  const arrays = [
    'production_recipe_audits', 'candidate_audits', 'family_model', 'ingredient_shape_matrix',
    'adaptation_boundaries', 'safety_boundaries', 'source_evidence', 'concrete_research_leads',
    'product_decisions', 'household_journeys',
  ];
  if (report.schema_version !== 1) errors.push('report schema_version must be 1');
  if (!hasText(report.assessment_version)) errors.push('report assessment_version must be non-empty');
  for (const field of arrays) if (!Array.isArray(report[field])) errors.push(`${field} must be an array`);
  const production = asArray(report.production_recipe_audits);
  const candidates = asArray(report.candidate_audits);
  const leads = asArray(report.concrete_research_leads);
  const sources = asArray(report.source_evidence);
  const journeys = asArray(report.household_journeys);
  if (production.length !== 1) errors.push('production_recipe_audits must contain exactly 1 item');
  if (candidates.length !== 4) errors.push('candidate_audits must contain exactly 4 items');
  if (leads.length !== 2) errors.push('concrete_research_leads must contain exactly 2 items');
  if (sources.length !== 9) errors.push('source_evidence must contain exactly 9 items');
  if (journeys.length !== 12) errors.push('household_journeys must contain exactly 12 items');
  if (report.region_overview?.region_id !== 'shandong') errors.push('region_overview must be Shandong');
  if (JSON.stringify(report.region_overview?.province_codes) !== JSON.stringify(['CN-SD'])) errors.push('region_overview province_codes must contain CN-SD');
  if (report.region_overview?.production_recipe_count !== production.length) {
    errors.push(`region production_recipe_count expected ${production.length}, got ${report.region_overview?.production_recipe_count}`);
  }
  if (report.region_overview?.candidate_count !== candidates.length) errors.push('region candidate_count is inconsistent');
  if (report.region_overview?.concrete_research_lead_count !== leads.length) errors.push('region research lead count is inconsistent');
  const summary = asObject(report.summary);
  for (const [field, expected] of [
    ['production_audit_count', production.length],
    ['candidate_audit_count', candidates.length],
    ['concrete_research_lead_count', leads.length],
    ['source_count', sources.length],
    ['household_journey_count', journeys.length],
  ]) {
    if (summary[field] !== expected) errors.push(`summary ${field} expected ${expected}, got ${summary[field]}`);
  }
  const expected = expectedCompletion(report);
  if (report.completion?.status !== expected.status || JSON.stringify(report.completion?.blockers) !== JSON.stringify(expected.blockers)) {
    if (report.completion?.status === 'regional_round_complete') errors.push('completion cannot be complete while evidence or review is incomplete');
    else errors.push('completion status or blockers are inconsistent');
  }
  if (summary.production_recipe_changes !== 0) errors.push('production_recipe_changes must remain 0');
  return errors;
}

export function formatShandongOnePotResearchSummary(report) {
  const summary = asObject(report?.summary);
  return `${summary.production_audit_count ?? 0} Shandong production audit · ${summary.candidate_audit_count ?? 0} candidates · ${summary.household_journey_count ?? 0} journeys · Shandong research ok`;
}

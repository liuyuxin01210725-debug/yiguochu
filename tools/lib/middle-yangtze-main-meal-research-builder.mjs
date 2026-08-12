import { validateMiddleYangtzeMainMealResearch } from './middle-yangtze-main-meal-research-validator.mjs';

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const asObject = value => isObject(value) ? value : {};
const asArray = value => Array.isArray(value) ? value : [];
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const clone = value => structuredClone(value);

function countBy(rows, field, keys) {
  const counts = Object.fromEntries(keys.map(key => [key, 0]));
  for (const row of rows) if (row && Object.hasOwn(counts, row[field])) counts[row[field]] += 1;
  return counts;
}

function shapeMatrix(leads) {
  const index = new Map();
  for (const lead of leads) {
    for (const shape of asArray(lead?.ingredient_shapes)) {
      if (!hasText(shape)) continue;
      if (!index.has(shape)) index.set(shape, { lead_ids: [], province_codes: [], family_ids: [] });
      const row = index.get(shape);
      row.lead_ids.push(lead.lead_id);
      row.province_codes.push(lead.province_code);
      row.family_ids.push(lead.family_id);
    }
  }
  return [...index.entries()].map(([shape, row]) => ({
    shape,
    lead_ids: [...new Set(row.lead_ids)].sort(),
    province_codes: [...new Set(row.province_codes)].sort(),
    family_ids: [...new Set(row.family_ids)].sort(),
  })).sort((a, b) => a.shape.localeCompare(b.shape));
}

function deriveCompletion(gaps, leads, safety, journeys) {
  const blockers = [];
  if (gaps.every(row => asArray(row.production_recipe_ids).length === 0)) blockers.push('zero_production_mapping');
  if (gaps.every(row => asArray(row.candidate_ids).length === 0)) blockers.push('zero_candidate_mapping');
  const shefan = leads.find(row => row?.lead_id === 'hunan-xiangxi-shefan');
  if (shefan?.claims?.executable_ratio?.verdict !== 'supported') blockers.push('source_ratio_conflict_unresolved');
  const mianyang = leads.find(row => row?.lead_id === 'hubei-mianyang-mixed-grain-powder-steam');
  if (mianyang?.claims?.staple_sufficiency?.verdict !== 'supported') blockers.push('staple_sufficiency_unresolved');
  if (safety.length === 0 || safety.some(row => row?.evidence_status !== 'machine_ready')) blockers.push('safety_endpoint_incomplete');
  const reviewed = journeys.filter(row => ['passed', 'failed'].includes(row?.human_review?.status)).length;
  if (journeys.length !== 15 || reviewed !== 15) blockers.push('human_journey_review_incomplete');
  return { status: blockers.length ? 'research_in_progress' : 'regional_round_complete', blockers, reviewed };
}

export function buildMiddleYangtzeMainMealResearchReport({
  assessment,
  recipeLibrary,
  regionalResearch,
  regionalAtlas,
  regionalMappings,
} = {}) {
  const validationErrors = validateMiddleYangtzeMainMealResearch({
    assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings,
  });
  if (validationErrors.length) throw new Error(validationErrors.join('\n'));

  const source = asObject(assessment);
  const region = asObject(asArray(regionalAtlas?.regions).find(row => row?.region_id === 'middle_yangtze'));
  const provinceIndex = new Map(asArray(regionalAtlas?.province_nodes).filter(isObject).map(row => [row.atlas_code, row]));
  const leads = asArray(source.concrete_research_leads).filter(isObject).map(clone).sort((a, b) => a.lead_id.localeCompare(b.lead_id));
  const gaps = asArray(source.province_gap_audits).filter(isObject).map(gap => {
    const province = asObject(provinceIndex.get(gap.province_code));
    return {
      ...clone(gap),
      atlas_name: province.name || gap.province_name,
      atlas_status: province.status || '',
      research_question: province.research_question || '',
      lead_count: leads.filter(lead => lead.province_code === gap.province_code).length,
    };
  }).sort((a, b) => a.province_code.localeCompare(b.province_code));
  const sources = asArray(source.source_refs).filter(isObject).map(clone);
  const families = asArray(source.family_model).filter(isObject).map(clone);
  const boundaries = asArray(source.adaptation_boundaries).filter(isObject).map(clone);
  const safety = asArray(source.safety_boundaries).filter(isObject).map(clone);
  const journeys = asArray(source.journey_cases).filter(isObject).map(clone);
  const completion = deriveCompletion(gaps, leads, safety, journeys);

  return {
    schema_version: 1,
    assessment_version: source.assessment_version,
    region_overview: {
      region_id: source.region_id,
      name: region.name || '长江中游',
      province_codes: clone(source.province_codes),
      research_focus: clone(asArray(region.research_focus)),
      production_recipe_count: 0,
      candidate_count: 0,
      concrete_research_lead_count: leads.length,
    },
    province_gap_audits: gaps,
    family_model: families,
    ingredient_shape_matrix: shapeMatrix(leads),
    adaptation_boundaries: boundaries,
    safety_boundaries: safety,
    source_evidence: sources,
    concrete_research_leads: leads,
    product_decisions: leads.map(lead => ({
      subject_type: 'concrete_research_lead',
      subject_id: lead.lead_id,
      province_code: lead.province_code,
      state: 'research_only',
      product_destinations: clone(lead.product_destinations),
      decision_reason: lead.open_questions.join('；'),
    })),
    household_journeys: journeys,
    completion: { status: completion.status, blockers: completion.blockers },
    summary: {
      province_gap_count: gaps.length,
      production_audit_count: 0,
      candidate_audit_count: 0,
      concrete_research_lead_count: leads.length,
      source_count: sources.length,
      source_count_by_grade: countBy(sources, 'source_grade', ['A', 'B', 'C']),
      family_count: families.length,
      household_journey_count: journeys.length,
      human_journey_reviewed_count: completion.reviewed,
      production_recipe_changes: 0,
      regional_candidate_changes: 0,
    },
  };
}

function expectedCompletion(report) {
  return deriveCompletion(
    asArray(report?.province_gap_audits),
    asArray(report?.concrete_research_leads),
    asArray(report?.safety_boundaries),
    asArray(report?.household_journeys),
  );
}

export function validateMiddleYangtzeMainMealResearchReport(report) {
  if (!isObject(report)) return ['report must be an object'];
  const errors = [];
  const arrays = [
    'province_gap_audits', 'family_model', 'ingredient_shape_matrix', 'adaptation_boundaries',
    'safety_boundaries', 'source_evidence', 'concrete_research_leads', 'product_decisions',
    'household_journeys',
  ];
  if (report.schema_version !== 1) errors.push('report schema_version must be 1');
  if (!hasText(report.assessment_version)) errors.push('report assessment_version must be non-empty');
  for (const field of arrays) if (!Array.isArray(report[field])) errors.push(`${field} must be an array`);

  const gaps = asArray(report.province_gap_audits);
  const leads = asArray(report.concrete_research_leads);
  const sources = asArray(report.source_evidence);
  const families = asArray(report.family_model);
  const journeys = asArray(report.household_journeys);
  if (gaps.length !== 3) errors.push('province_gap_audits must contain exactly 3 items');
  if (leads.length !== 8) errors.push('concrete_research_leads must contain exactly 8 items');
  if (sources.length !== 11) errors.push('source_evidence must contain exactly 11 items');
  if (families.length !== 8) errors.push('family_model must contain exactly 8 items');
  if (journeys.length !== 15) errors.push('household_journeys must contain exactly 15 items');
  if (report.region_overview?.region_id !== 'middle_yangtze') errors.push('region_overview must be Middle Yangtze');
  if (JSON.stringify(report.region_overview?.province_codes) !== JSON.stringify(['CN-HB', 'CN-HN', 'CN-JX'])) {
    errors.push('region_overview province_codes must contain CN-HB, CN-HN and CN-JX');
  }
  if (report.region_overview?.production_recipe_count !== 0) {
    errors.push(`region production_recipe_count expected 0, got ${report.region_overview?.production_recipe_count}`);
  }
  if (report.region_overview?.candidate_count !== 0) errors.push('region candidate_count expected 0');
  if (report.region_overview?.concrete_research_lead_count !== leads.length) errors.push('region research lead count is inconsistent');

  const summary = asObject(report.summary);
  for (const [field, expected] of [
    ['province_gap_count', gaps.length],
    ['production_audit_count', 0],
    ['candidate_audit_count', 0],
    ['concrete_research_lead_count', leads.length],
    ['source_count', sources.length],
    ['family_count', families.length],
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
  if (summary.regional_candidate_changes !== 0) errors.push('regional_candidate_changes must remain 0');
  return errors;
}

export function formatMiddleYangtzeMainMealResearchSummary(report) {
  const summary = asObject(report?.summary);
  return `${summary.province_gap_count ?? 0} Middle Yangtze province gaps · ${summary.concrete_research_lead_count ?? 0} research leads · ${summary.household_journey_count ?? 0} journeys · Middle Yangtze research ok`;
}

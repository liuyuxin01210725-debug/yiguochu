import { validateFujianTaiwanRiceNoodleResearch } from './fujian-taiwan-rice-noodle-research-validator.mjs';

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

function claimMatrix(audits, leads) {
  const rows = [];
  for (const [subjectType, subjects, idField] of [
    ['production_recipe', audits, 'recipe_id'],
    ['research_lead', leads, 'lead_id'],
  ]) {
    for (const subject of subjects) {
      for (const [claimId, claim] of Object.entries(asObject(subject?.claims))) {
        rows.push({
          subject_type: subjectType,
          subject_id: subject[idField],
          claim_id: claimId,
          verdict: claim?.verdict || '',
          evidence_source_ids: clone(asArray(claim?.evidence_source_ids)),
          reason: claim?.reason || '',
        });
      }
    }
  }
  return rows.sort((a, b) => `${a.subject_type}:${a.subject_id}:${a.claim_id}`.localeCompare(`${b.subject_type}:${b.subject_id}:${b.claim_id}`));
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
  return [...index.entries()].map(([shape, value]) => ({
    shape,
    lead_ids: [...new Set(value.lead_ids)].sort(),
    province_codes: [...new Set(value.province_codes)].sort(),
    family_ids: [...new Set(value.family_ids)].sort(),
  })).sort((a, b) => a.shape.localeCompare(b.shape));
}

function deriveCompletion(audits, leads, safety, journeys) {
  const blockers = [];
  const audit = id => audits.find(row => row?.recipe_id === id);
  if ([
    audit('quanzhou-oil-rice')?.claims?.exact_project_equivalence,
    audit('daxi-lotus-leaf-oil-rice')?.claims?.exact_project_formula,
    audit('she-people-black-rice')?.claims?.project_color_powder_equivalence,
  ].some(claim => claim?.verdict !== 'supported')) blockers.push('exact_recipe_equivalence_unresolved');
  if (audit('taiwan-cabbage-mushroom-rice')?.claims?.project_ratio_equivalence?.verdict !== 'supported') blockers.push('ratio_state_mismatch_unresolved');
  if (audit('fujian-hyacinth-bean-rice')?.claims?.bean_species_identity?.verdict !== 'supported') blockers.push('ingredient_identity_unresolved');
  if (leads.some(lead => Object.entries(asObject(lead?.claims)).some(([claimId, claim]) => claimId.includes('ratio') && claim?.verdict !== 'supported'))) {
    blockers.push('new_family_ratio_unresolved');
  }
  if (safety.length === 0 || safety.some(row => row?.evidence_status !== 'machine_ready')) blockers.push('safety_endpoint_incomplete');
  const reviewed = journeys.filter(row => ['passed', 'failed'].includes(row?.human_review?.status)).length;
  if (journeys.length !== 12 || reviewed !== 12) blockers.push('human_journey_review_incomplete');
  return { status: blockers.length ? 'research_in_progress' : 'regional_round_complete', blockers, reviewed };
}

export function buildFujianTaiwanRiceNoodleResearchReport({
  assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings,
} = {}) {
  const validationErrors = validateFujianTaiwanRiceNoodleResearch({
    assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings,
  });
  if (validationErrors.length) throw new Error(validationErrors.join('\n'));

  const source = asObject(assessment);
  const region = asObject(asArray(regionalAtlas?.regions).find(row => row?.region_id === 'fujian_taiwan'));
  const provinceIndex = new Map(asArray(regionalAtlas?.province_nodes).filter(isObject).map(row => [row.atlas_code, row]));
  const recipeIndex = new Map(asArray(recipeLibrary?.recipes).filter(isObject).map(row => [row.id, row]));
  const mappingIndex = new Map(asArray(regionalMappings?.production_recipe_mappings).filter(isObject).map(row => [row.source_id, row]));
  const audits = asArray(source.production_recipe_audits).filter(isObject).map(item => ({
    ...clone(item),
    recipe_name: recipeIndex.get(item.recipe_id)?.name || '',
    recipe_status: recipeIndex.get(item.recipe_id)?.status || '',
    atlas_primary_family_id: mappingIndex.get(item.recipe_id)?.primary_family_id || '',
  })).sort((a, b) => a.recipe_id.localeCompare(b.recipe_id));
  const leads = asArray(source.concrete_research_leads).filter(isObject).map(clone).sort((a, b) => a.lead_id.localeCompare(b.lead_id));
  const gaps = asArray(source.province_gap_audits).filter(isObject).map(gap => {
    const province = asObject(provinceIndex.get(gap.province_code));
    return {
      ...clone(gap),
      atlas_name: province.name || gap.province_name,
      atlas_status: province.status || '',
      research_question: province.research_question || '',
      production_recipe_count: asArray(gap.production_recipe_ids).length,
      lead_count: leads.filter(lead => lead.province_code === gap.province_code).length,
    };
  }).sort((a, b) => a.province_code.localeCompare(b.province_code));
  const sources = asArray(source.source_refs).filter(isObject).map(clone);
  const families = asArray(source.family_model).filter(isObject).map(clone);
  const boundaries = asArray(source.adaptation_boundaries).filter(isObject).map(clone);
  const safety = asArray(source.safety_boundaries).filter(isObject).map(clone);
  const journeys = asArray(source.journey_cases).filter(isObject).map(clone);
  const completion = deriveCompletion(audits, leads, safety, journeys);

  return {
    schema_version: 1,
    assessment_version: source.assessment_version,
    region_overview: {
      region_id: source.region_id,
      name: region.name || '闽台',
      province_codes: clone(source.province_codes),
      research_focus: clone(asArray(region.research_focus)),
      production_recipe_count: audits.length,
      province_specific_recipe_count: audits.filter(row => row.mapping_scope === 'province_specific').length,
      cross_regional_recipe_count: audits.filter(row => row.mapping_scope === 'cross_regional_chinese').length,
      candidate_count: 0,
      concrete_research_lead_count: leads.length,
    },
    province_gap_audits: gaps,
    production_recipe_audits: audits,
    concrete_research_leads: leads,
    family_model: families,
    claim_matrix: claimMatrix(audits, leads),
    ingredient_shape_matrix: shapeMatrix(leads),
    adaptation_boundaries: boundaries,
    safety_boundaries: safety,
    source_evidence: sources,
    product_decisions: [
      ...audits.map(row => ({
        subject_type: 'production_recipe', subject_id: row.recipe_id, province_code: row.province_code,
        state: 'audited_existing_recipe', product_destinations: clone(row.product_destinations),
        decision_reason: row.forbidden_claims.join('；'),
      })),
      ...leads.map(row => ({
        subject_type: 'concrete_research_lead', subject_id: row.lead_id, province_code: row.province_code,
        state: 'research_only', product_destinations: clone(row.product_destinations),
        decision_reason: row.open_questions.join('；'),
      })),
    ],
    household_journeys: journeys,
    completion: { status: completion.status, blockers: completion.blockers },
    summary: {
      province_gap_count: gaps.length,
      production_audit_count: audits.length,
      province_specific_recipe_count: audits.filter(row => row.mapping_scope === 'province_specific').length,
      cross_regional_recipe_count: audits.filter(row => row.mapping_scope === 'cross_regional_chinese').length,
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
    asArray(report?.production_recipe_audits), asArray(report?.concrete_research_leads),
    asArray(report?.safety_boundaries), asArray(report?.household_journeys),
  );
}

export function validateFujianTaiwanRiceNoodleResearchReport(report) {
  if (!isObject(report)) return ['report must be an object'];
  const errors = [];
  for (const field of [
    'province_gap_audits', 'production_recipe_audits', 'concrete_research_leads', 'family_model',
    'claim_matrix', 'ingredient_shape_matrix', 'adaptation_boundaries', 'safety_boundaries',
    'source_evidence', 'product_decisions', 'household_journeys',
  ]) if (!Array.isArray(report[field])) errors.push(`${field} must be an array`);
  if (report.schema_version !== 1) errors.push('report schema_version must be 1');
  if (!hasText(report.assessment_version)) errors.push('report assessment_version must be non-empty');
  const gaps = asArray(report.province_gap_audits);
  const audits = asArray(report.production_recipe_audits);
  const leads = asArray(report.concrete_research_leads);
  const sources = asArray(report.source_evidence);
  const families = asArray(report.family_model);
  const journeys = asArray(report.household_journeys);
  if (gaps.length !== 2) errors.push('province_gap_audits must contain exactly 2 items');
  if (audits.length !== 6) errors.push('production_recipe_audits must contain exactly 6 items');
  if (leads.length !== 3) errors.push('concrete_research_leads must contain exactly 3 items');
  if (sources.length !== 11) errors.push('source_evidence must contain exactly 11 items');
  if (families.length !== 7) errors.push('family_model must contain exactly 7 items');
  if (journeys.length !== 12) errors.push('household_journeys must contain exactly 12 items');
  if (report.region_overview?.region_id !== 'fujian_taiwan') errors.push('region_overview must be Fujian-Taiwan');
  if (JSON.stringify(report.region_overview?.province_codes) !== JSON.stringify(['CN-FJ', 'CN-TW'])) errors.push('region_overview province_codes must contain CN-FJ and CN-TW');
  if (report.region_overview?.production_recipe_count !== 6) errors.push(`region production_recipe_count expected 6, got ${report.region_overview?.production_recipe_count}`);
  if (report.region_overview?.candidate_count !== 0) errors.push('region candidate_count expected 0');
  const summary = asObject(report.summary);
  for (const [field, expected] of [
    ['province_gap_count', gaps.length], ['production_audit_count', audits.length],
    ['candidate_audit_count', 0], ['concrete_research_lead_count', leads.length],
    ['source_count', sources.length], ['family_count', families.length],
    ['household_journey_count', journeys.length],
  ]) if (summary[field] !== expected) errors.push(`summary ${field} expected ${expected}, got ${summary[field]}`);
  const expected = expectedCompletion(report);
  if (report.completion?.status !== expected.status || JSON.stringify(report.completion?.blockers) !== JSON.stringify(expected.blockers)) {
    if (report.completion?.status === 'regional_round_complete') errors.push('completion cannot be complete while evidence or review is incomplete');
    else errors.push('completion status or blockers are inconsistent');
  }
  if (summary.production_recipe_changes !== 0) errors.push('production_recipe_changes must remain 0');
  if (summary.regional_candidate_changes !== 0) errors.push('regional_candidate_changes must remain 0');
  return errors;
}

export function formatFujianTaiwanRiceNoodleResearchSummary(report) {
  const summary = asObject(report?.summary);
  return `${summary.production_audit_count ?? 0} Fujian-Taiwan recipe audits · ${summary.concrete_research_lead_count ?? 0} research leads · ${summary.household_journey_count ?? 0} journeys · Fujian-Taiwan research ok`;
}

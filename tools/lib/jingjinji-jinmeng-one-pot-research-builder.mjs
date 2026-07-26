import { validateJingjinjiJinmengOnePotResearch } from './jingjinji-jinmeng-one-pot-research-validator.mjs';

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const asArray = value => Array.isArray(value) ? value : [];
const asObject = value => isObject(value) ? value : {};
const clone = value => structuredClone(value);
const countBy = (rows, field, keys) => Object.fromEntries(keys.map(key => [key, rows.filter(row => row?.[field] === key).length]));

function claimsFor(subjectType, subjects, idField) {
  return subjects.flatMap(subject => Object.entries(asObject(subject.claims)).map(([claimId, claim]) => ({ subject_type: subjectType, subject_id: subject[idField], claim_id: claimId, verdict: claim.verdict, evidence_source_ids: clone(asArray(claim.evidence_source_ids)), reason: claim.reason })));
}

function shapeMatrix(production, leads) {
  const index = new Map();
  for (const [subjectType, subjects, idField] of [['production_recipe', production, 'recipe_id'], ['research_lead', leads, 'lead_id']]) {
    for (const subject of subjects) for (const shape of asArray(subject.ingredient_shapes)) {
      if (!index.has(shape)) index.set(shape, []);
      index.get(shape).push(`${subjectType}:${subject[idField]}`);
    }
  }
  return [...index.entries()].map(([shape, subject_ids]) => ({ shape, subject_ids: [...new Set(subject_ids)].sort() })).sort((a, b) => a.shape.localeCompare(b.shape));
}

function completion(report) {
  const blockers = [];
  if (report.production_recipe_audits.filter(row => row.recipe_id.startsWith('shanxi-')).some(row => row.claims?.exact_project_equivalence?.verdict !== 'supported')) blockers.push('exact_recipe_equivalence_unresolved');
  const tianjin = report.concrete_research_leads.find(row => row.lead_id === 'tianjin-fish-staple-pot');
  if (tianjin?.claims?.staple_shape_equivalence?.verdict !== 'supported') blockers.push('staple_shape_boundary_unresolved');
  if (report.concrete_research_leads.some(row => row.claims?.project_ratio_safety?.verdict !== 'supported')) blockers.push('ratio_rule_unresolved');
  if (report.safety_boundaries.some(row => row.evidence_status !== 'machine_ready')) blockers.push('safety_endpoint_incomplete');
  const reviewed = report.household_journeys.filter(row => ['passed', 'failed'].includes(row.human_review?.status)).length;
  if (reviewed !== 15) blockers.push('human_journey_review_incomplete');
  return { status: blockers.length ? 'research_in_progress' : 'regional_round_complete', blockers, reviewed };
}

export function buildJingjinjiJinmengOnePotResearchReport({ assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings } = {}) {
  const errors = validateJingjinjiJinmengOnePotResearch({ assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings });
  if (errors.length) throw new Error(errors.join('\n'));
  const source = asObject(assessment);
  const recipeIndex = new Map(asArray(recipeLibrary?.recipes).filter(isObject).map(row => [row.id, row]));
  const candidateIndex = new Map(asArray(regionalResearch?.entries).filter(isObject).map(row => [row.atlas_id, row]));
  const mappingIndex = new Map([...asArray(regionalMappings?.production_recipe_mappings), ...asArray(regionalMappings?.research_candidate_mappings)].filter(isObject).map(row => [row.source_id, row]));
  const provinceIndex = new Map(asArray(regionalAtlas?.province_nodes).filter(isObject).map(row => [row.atlas_code, row]));
  const production = asArray(source.production_recipe_audits).map(row => ({ ...clone(row), recipe_name: recipeIndex.get(row.recipe_id)?.name || '', recipe_status: recipeIndex.get(row.recipe_id)?.status || '', atlas_primary_family_id: mappingIndex.get(row.recipe_id)?.primary_family_id || '' })).sort((a, b) => a.recipe_id.localeCompare(b.recipe_id));
  const candidates = asArray(source.candidate_audits).map(row => ({ ...clone(row), candidate_name: candidateIndex.get(row.candidate_id)?.prototype_name || '', atlas_primary_family_id: mappingIndex.get(row.candidate_id)?.primary_family_id || '' })).sort((a, b) => a.candidate_id.localeCompare(b.candidate_id));
  const leads = asArray(source.concrete_research_leads).map(clone).sort((a, b) => a.lead_id.localeCompare(b.lead_id));
  const gaps = asArray(source.province_gap_audits).map(row => ({ ...clone(row), research_question: provinceIndex.get(row.province_code)?.research_question || '', atlas_status: provinceIndex.get(row.province_code)?.status || '', lead_count: leads.filter(lead => lead.province_code === row.province_code).length })).sort((a, b) => a.province_code.localeCompare(b.province_code));
  const report = {
    schema_version: 1,
    assessment_version: source.assessment_version,
    region_overview: { region_ids: clone(source.region_ids), names: source.region_ids.map(id => asArray(regionalAtlas?.regions).find(row => row.region_id === id)?.name || id), province_codes: clone(source.province_codes), production_recipe_count: production.length, candidate_count: candidates.length, concrete_research_lead_count: leads.length },
    province_gap_audits: gaps,
    production_recipe_audits: production,
    candidate_audits: candidates,
    concrete_research_leads: leads,
    family_model: clone(source.family_model),
    claim_matrix: [...claimsFor('production_recipe', production, 'recipe_id'), ...claimsFor('research_candidate', candidates, 'candidate_id'), ...claimsFor('research_lead', leads, 'lead_id')].sort((a, b) => `${a.subject_type}:${a.subject_id}:${a.claim_id}`.localeCompare(`${b.subject_type}:${b.subject_id}:${b.claim_id}`)),
    ingredient_shape_matrix: shapeMatrix(production, leads),
    adaptation_boundaries: clone(source.adaptation_boundaries),
    safety_boundaries: clone(source.safety_boundaries),
    source_evidence: clone(source.source_refs),
    product_decisions: [
      ...production.map(row => ({ subject_type: 'production_recipe', subject_id: row.recipe_id, state: 'audited_existing_recipe', product_destinations: clone(row.product_destinations), decision_reason: row.forbidden_claims.join('；') })),
      ...candidates.map(row => ({ subject_type: 'research_candidate', subject_id: row.candidate_id, state: 'audited_existing_candidate', product_destinations: clone(row.product_destinations), decision_reason: row.forbidden_claims.join('；') })),
      ...leads.map(row => ({ subject_type: 'concrete_research_lead', subject_id: row.lead_id, state: 'research_only', product_destinations: clone(row.product_destinations), decision_reason: row.open_questions.join('；') })),
    ],
    household_journeys: clone(source.journey_cases),
  };
  const derived = completion(report);
  report.completion = { status: derived.status, blockers: derived.blockers };
  report.summary = { province_gap_count: gaps.length, production_audit_count: production.length, candidate_audit_count: candidates.length, concrete_research_lead_count: leads.length, source_count: report.source_evidence.length, source_count_by_grade: countBy(report.source_evidence, 'source_grade', ['A', 'B', 'C']), family_count: report.family_model.length, household_journey_count: report.household_journeys.length, human_journey_reviewed_count: derived.reviewed, production_recipe_changes: 0, regional_candidate_changes: 0 };
  return report;
}

export function validateJingjinjiJinmengOnePotResearchReport(report) {
  if (!isObject(report)) return ['report must be an object'];
  const errors = [];
  for (const field of ['province_gap_audits', 'production_recipe_audits', 'candidate_audits', 'concrete_research_leads', 'family_model', 'claim_matrix', 'ingredient_shape_matrix', 'adaptation_boundaries', 'safety_boundaries', 'source_evidence', 'product_decisions', 'household_journeys']) if (!Array.isArray(report[field])) errors.push(`${field} must be an array`);
  if (report.schema_version !== 1) errors.push('report schema_version must be 1');
  const summary = asObject(report.summary);
  for (const [field, expected] of [['province_gap_count', asArray(report.province_gap_audits).length], ['production_audit_count', asArray(report.production_recipe_audits).length], ['candidate_audit_count', asArray(report.candidate_audits).length], ['concrete_research_lead_count', asArray(report.concrete_research_leads).length], ['source_count', asArray(report.source_evidence).length], ['family_count', asArray(report.family_model).length], ['household_journey_count', asArray(report.household_journeys).length]]) if (summary[field] !== expected) errors.push(`summary ${field} expected ${expected}, got ${summary[field]}`);
  if (asArray(report.province_gap_audits).length !== 5) errors.push('province_gap_audits must contain exactly 5 items');
  if (asArray(report.production_recipe_audits).length !== 3) errors.push('production_recipe_audits must contain exactly 3 items');
  if (asArray(report.candidate_audits).length !== 4) errors.push('candidate_audits must contain exactly 4 items');
  if (asArray(report.concrete_research_leads).length !== 4) errors.push('concrete_research_leads must contain exactly 4 items');
  if (asArray(report.source_evidence).length !== 9) errors.push('source_evidence must contain exactly 9 items');
  if (asArray(report.household_journeys).length !== 15) errors.push('household_journeys must contain exactly 15 items');
  const expected = completion(report);
  if (report.completion?.status !== expected.status || JSON.stringify(report.completion?.blockers) !== JSON.stringify(expected.blockers)) {
    if (report.completion?.status === 'regional_round_complete') errors.push('completion cannot be complete while evidence or review is incomplete');
    else errors.push('completion status or blockers are inconsistent');
  }
  if (summary.production_recipe_changes !== 0) errors.push('production_recipe_changes must remain 0');
  if (summary.regional_candidate_changes !== 0) errors.push('regional_candidate_changes must remain 0');
  return errors;
}

export function formatJingjinjiJinmengOnePotResearchSummary(report) {
  const s = asObject(report?.summary);
  return `${s.production_audit_count ?? 0} North-China recipe audits · ${s.candidate_audit_count ?? 0} candidate audits · ${s.concrete_research_lead_count ?? 0} research leads · ${s.household_journey_count ?? 0} journeys · North-China research ok`;
}

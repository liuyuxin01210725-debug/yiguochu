import { validateLingnanHkMacaoOnePotResearch } from './lingnan-hk-macao-one-pot-research-validator.mjs';

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const asArray = value => Array.isArray(value) ? value : [];
const asObject = value => isObject(value) ? value : {};
const clone = value => structuredClone(value);
const CLAIM_DIRECTIONS = { supported: 'proves', not_proven: 'does_not_prove', contradicted: 'contradicts' };
const EXPECTED_PROVINCES = ['CN-GD', 'CN-GX', 'CN-HI', 'CN-HK', 'CN-MO'];
const FIXED_COMPLETION_BLOCKERS = [
  'production_evidence_gaps',
  'ratio_dsl_unresolved',
  'household_vessel_adaptation_unresolved',
  'meal_sufficiency_unresolved',
  'safety_endpoint_incomplete',
  'human_journey_review_incomplete',
];
const CLAIM_SOURCE_TOKENS = {
  production_recipe: 'production',
  research_candidate: 'candidate',
  concrete_research_lead: 'lead',
};

function countBy(rows, field, keys) {
  return Object.fromEntries(keys.map(key => [key, rows.filter(row => row?.[field] === key).length]));
}

function deriveClaimMatrix(subjectGroups) {
  return subjectGroups.flatMap(({ subjectType, rows, idField }) => rows.flatMap(row => Object.entries(asObject(row.claims)).map(([claimId, claim]) => ({
    subject_type: subjectType,
    subject_id: row[idField],
    claim_id: claimId,
    verdict: claim.verdict,
    evidence_direction: CLAIM_DIRECTIONS[claim.verdict] || '',
    evidence_source_ids: clone(asArray(claim.evidence_source_ids)),
    reason: claim.reason,
  })))).sort((a, b) => `${a.subject_type}:${a.subject_id}:${a.claim_id}`.localeCompare(`${b.subject_type}:${b.subject_id}:${b.claim_id}`));
}

function deriveShapeMatrix(subjectGroups) {
  const byShape = new Map();
  for (const { subjectType, rows, idField } of subjectGroups) {
    for (const row of rows) for (const shape of asArray(row.ingredient_shapes)) {
      if (!byShape.has(shape)) byShape.set(shape, { shape, production_recipe_ids: [], candidate_ids: [], lead_ids: [], source_types: [] });
      const entry = byShape.get(shape);
      if (subjectType === 'production_recipe') entry.production_recipe_ids.push(row[idField]);
      if (subjectType === 'research_candidate') entry.candidate_ids.push(row[idField]);
      if (subjectType === 'concrete_research_lead') entry.lead_ids.push(row[idField]);
      if (!entry.source_types.includes(subjectType)) entry.source_types.push(subjectType);
    }
  }
  return [...byShape.values()].map(entry => ({
    ...entry,
    production_recipe_ids: [...new Set(entry.production_recipe_ids)].sort(),
    candidate_ids: [...new Set(entry.candidate_ids)].sort(),
    lead_ids: [...new Set(entry.lead_ids)].sort(),
    source_types: entry.source_types.sort(),
  })).sort((a, b) => a.shape.localeCompare(b.shape));
}

function contextLeadIds(provinceCode, leads, sources) {
  const direct = leads.filter(lead => lead.province_code === provinceCode).map(lead => lead.lead_id);
  if (provinceCode !== 'CN-HK') return direct.sort();
  const hongKongContext = sources.flatMap(source => asArray(source.proves))
    .map(claim => /^lead:([^:]+):hong_kong_current_presence$/.exec(claim)?.[1])
    .filter(Boolean);
  return [...new Set([...direct, ...hongKongContext])].sort();
}

function deriveCompletion(report) {
  const production = asArray(report.production_recipe_audits);
  const leads = asArray(report.concrete_research_leads);
  const journeys = asArray(report.household_journeys);
  const blockers = [];
  if (production.some(row => Object.values(asObject(row.claims)).some(claim => claim?.verdict !== 'supported'))) blockers.push('production_evidence_gaps');
  if ([...production, ...leads].some(row => row?.claims?.project_ratio_safety?.verdict !== 'supported')) blockers.push('ratio_dsl_unresolved');
  if (leads.some(row => row?.claims?.household_vessel_equivalence?.verdict !== undefined && row.claims.household_vessel_equivalence.verdict !== 'supported')) blockers.push('household_vessel_adaptation_unresolved');
  if (leads.some(row => row?.claims?.complete_main_meal_sufficiency?.verdict !== undefined && row.claims.complete_main_meal_sufficiency.verdict !== 'supported')) blockers.push('meal_sufficiency_unresolved');
  if (asArray(report.safety_boundaries).some(row => row?.evidence_status !== 'verified_endpoint')) blockers.push('safety_endpoint_incomplete');
  const reviewed = journeys.filter(row => ['passed', 'failed'].includes(row?.human_review?.status)).length;
  if (journeys.length !== 15 || reviewed !== 15) blockers.push('human_journey_review_incomplete');
  return {
    status: blockers.length ? 'research_in_progress' : 'regional_round_complete',
    blockers,
    baseline_facts: asArray(report.candidate_audits).length === 0 ? ['zero_candidate_baseline'] : [],
    reviewed,
  };
}

function reportSubjectGroups(report) {
  return [
    { subjectType: 'production_recipe', rows: asArray(report.production_recipe_audits), idField: 'recipe_id' },
    { subjectType: 'research_candidate', rows: asArray(report.candidate_audits), idField: 'candidate_id' },
    { subjectType: 'concrete_research_lead', rows: asArray(report.concrete_research_leads), idField: 'lead_id' },
  ];
}

function validateClaimEvidence(subjectGroups, sourceEvidence, errors) {
  const sourceIndex = new Map(asArray(sourceEvidence).filter(isObject).map(source => [source.source_id, source]));
  for (const { subjectType, rows, idField } of subjectGroups) {
    for (const row of rows) for (const [claimId, claim] of Object.entries(asObject(row.claims))) {
      const direction = CLAIM_DIRECTIONS[claim?.verdict];
      const token = `${CLAIM_SOURCE_TOKENS[subjectType]}:${row?.[idField]}:${claimId}`;
      if (!direction) {
        errors.push(`claim ${token} has an invalid verdict`);
        continue;
      }
      if (!Array.isArray(claim?.evidence_source_ids) || claim.evidence_source_ids.length === 0) {
        errors.push(`claim ${token} must retain evidence_source_ids`);
      }
      if (typeof claim?.reason !== 'string' || claim.reason.trim().length === 0) errors.push(`claim ${token} must retain a reason`);
      for (const sourceId of asArray(claim?.evidence_source_ids)) {
        const source = sourceIndex.get(sourceId);
        if (!source) {
          errors.push(`claim ${token} references unknown source ${sourceId}`);
          continue;
        }
        if (!asArray(source[direction]).includes(token)) errors.push(`claim ${token} must be reverse-indexed under ${direction} by source ${sourceId}`);
      }
    }
  }
}

export function buildLingnanHkMacaoOnePotResearchReport({
  assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings,
} = {}) {
  const errors = validateLingnanHkMacaoOnePotResearch({ assessment, recipeLibrary, regionalResearch, regionalAtlas, regionalMappings });
  if (errors.length) throw new Error(errors.join('\n'));

  const source = asObject(assessment);
  const recipes = new Map(asArray(recipeLibrary?.recipes).filter(isObject).map(row => [row.id, row]));
  const candidatesById = new Map(asArray(regionalResearch?.entries).filter(isObject).map(row => [row.atlas_id, row]));
  const mappings = new Map([
    ...asArray(regionalMappings?.production_recipe_mappings),
    ...asArray(regionalMappings?.research_candidate_mappings),
  ].filter(isObject).map(row => [row.source_id, row]));
  const provinces = new Map(asArray(regionalAtlas?.province_nodes).filter(isObject).map(row => [row.atlas_code, row]));
  const region = asObject(asArray(regionalAtlas?.regions).find(row => row?.region_id === source.region_id));

  const production = asArray(source.production_recipe_audits).filter(isObject).map(row => {
    const recipe = asObject(recipes.get(row.recipe_id));
    const mapping = asObject(mappings.get(row.recipe_id));
    return {
      ...clone(row),
      recipe_name: recipe.name || '',
      recipe_status: recipe.status || '',
      cuisine: recipe.cuisine || '',
      recipe_core_ingredients: clone(asArray(recipe.core_ingredients)),
      recipe_substitution_slots: clone(asArray(recipe.substitution_slots)),
      mapping_regional_scope: mapping.regional_scope || '',
      province_codes: clone(asArray(mapping.province_codes)),
      atlas_primary_family_id: mapping.primary_family_id || '',
      atlas_secondary_family_ids: clone(asArray(mapping.secondary_family_ids)),
    };
  }).sort((a, b) => a.recipe_id.localeCompare(b.recipe_id));

  const candidates = asArray(source.candidate_audits).filter(isObject).map(row => {
    const candidate = asObject(candidatesById.get(row.candidate_id));
    const mapping = asObject(mappings.get(row.candidate_id));
    return {
      ...clone(row),
      prototype_name: candidate.prototype_name || '',
      candidate_status: candidate.status || '',
      ingredient_hypothesis: clone(asArray(candidate.ingredient_hypothesis)),
      mapping_regional_scope: mapping.regional_scope || '',
      province_codes: clone(asArray(mapping.province_codes)),
      atlas_primary_family_id: mapping.primary_family_id || '',
      atlas_secondary_family_ids: clone(asArray(mapping.secondary_family_ids)),
    };
  }).sort((a, b) => a.candidate_id.localeCompare(b.candidate_id));

  const leads = asArray(source.concrete_research_leads).filter(isObject).map(clone).sort((a, b) => a.lead_id.localeCompare(b.lead_id));
  const sources = asArray(source.source_refs).filter(isObject).map(clone);
  const subjectGroups = [
    { subjectType: 'production_recipe', rows: production, idField: 'recipe_id' },
    { subjectType: 'research_candidate', rows: candidates, idField: 'candidate_id' },
    { subjectType: 'concrete_research_lead', rows: leads, idField: 'lead_id' },
  ];
  const provinceCoverage = source.province_codes.map(provinceCode => {
    const province = asObject(provinces.get(provinceCode));
    return {
      province_code: provinceCode,
      province_name: province.name || '',
      atlas_status: province.status || '',
      research_question: province.research_question || '',
      production_recipe_ids: production.filter(row => row.province_codes.includes(provinceCode)).map(row => row.recipe_id).sort(),
      candidate_ids: candidates.filter(row => row.province_codes.includes(provinceCode)).map(row => row.candidate_id).sort(),
      lead_ids: leads.filter(row => row.province_code === provinceCode).map(row => row.lead_id).sort(),
      context_lead_ids: contextLeadIds(provinceCode, leads, sources),
    };
  });

  const report = {
    schema_version: 1,
    assessment_version: source.assessment_version,
    region_overview: {
      region_id: source.region_id,
      name: region.name || '岭南、香港与澳门',
      province_codes: clone(source.province_codes),
      research_focus: clone(asArray(region.research_focus)),
      production_recipe_count: production.length,
      candidate_count: candidates.length,
      concrete_research_lead_count: leads.length,
    },
    province_coverage_audits: provinceCoverage,
    production_recipe_audits: production,
    candidate_audits: candidates,
    concrete_research_leads: leads,
    family_model: clone(asArray(source.family_model)),
    claim_matrix: deriveClaimMatrix(subjectGroups),
    ingredient_shape_matrix: deriveShapeMatrix(subjectGroups),
    adaptation_boundaries: clone(asArray(source.adaptation_boundaries)),
    safety_boundaries: clone(asArray(source.safety_boundaries)),
    source_evidence: sources,
    product_decisions: [
      ...production.map(row => ({ subject_type: 'production_recipe', subject_id: row.recipe_id, state: row.audit_state, product_destinations: clone(row.product_destinations), decision_reason: row.decision_reason })),
      ...candidates.map(row => ({ subject_type: 'research_candidate', subject_id: row.candidate_id, state: row.audit_state, product_destinations: clone(row.product_destinations), decision_reason: row.decision_reason })),
      ...leads.map(row => ({ subject_type: 'concrete_research_lead', subject_id: row.lead_id, state: 'research_only', product_destinations: clone(row.product_destinations), decision_reason: row.decision_reason })),
    ].sort((a, b) => `${a.subject_type}:${a.subject_id}`.localeCompare(`${b.subject_type}:${b.subject_id}`)),
    household_journeys: clone(asArray(source.journey_cases)),
  };
  const completion = deriveCompletion(report);
  report.completion = { status: completion.status, blockers: completion.blockers, baseline_facts: completion.baseline_facts };
  report.summary = {
    province_coverage_count: provinceCoverage.length,
    production_audit_count: production.length,
    candidate_audit_count: candidates.length,
    concrete_research_lead_count: leads.length,
    source_count: sources.length,
    source_count_by_grade: countBy(sources, 'source_grade', ['A', 'B', 'C']),
    family_count: report.family_model.length,
    household_journey_count: report.household_journeys.length,
    human_journey_reviewed_count: completion.reviewed,
    production_recipe_changes: 0,
    regional_candidate_changes: 0,
    scope_note: '本轮仅新增研究审计与报告：不新增 recipe 或 candidate。',
  };
  return report;
}

export function validateLingnanHkMacaoOnePotResearchReport(report) {
  if (!isObject(report)) return ['report must be an object'];
  const errors = [];
  const arrayFields = [
    'province_coverage_audits', 'production_recipe_audits', 'candidate_audits',
    'concrete_research_leads', 'family_model', 'claim_matrix', 'ingredient_shape_matrix',
    'adaptation_boundaries', 'safety_boundaries', 'source_evidence', 'product_decisions', 'household_journeys',
  ];
  for (const field of arrayFields) if (!Array.isArray(report[field])) errors.push(`${field} must be an array`);
  if (report.schema_version !== 1) errors.push('report schema_version must be 1');
  if (report.region_overview?.region_id !== 'lingnan_hk_macao') errors.push('region_overview must be Lingnan Hong Kong Macao');
  if (JSON.stringify(report.region_overview?.province_codes) !== JSON.stringify(EXPECTED_PROVINCES)) errors.push('region_overview province_codes must match the five fixed provinces');
  const summary = asObject(report.summary);
  const counts = [
    ['province_coverage_count', asArray(report.province_coverage_audits).length],
    ['production_audit_count', asArray(report.production_recipe_audits).length],
    ['candidate_audit_count', asArray(report.candidate_audits).length],
    ['concrete_research_lead_count', asArray(report.concrete_research_leads).length],
    ['source_count', asArray(report.source_evidence).length],
    ['family_count', asArray(report.family_model).length],
    ['household_journey_count', asArray(report.household_journeys).length],
  ];
  for (const [field, expected] of counts) if (summary[field] !== expected) errors.push(`summary ${field} expected ${expected}, got ${summary[field]}`);
  const fixedCounts = [
    ['province_coverage_audits', 5], ['production_recipe_audits', 5], ['candidate_audits', 0],
    ['concrete_research_leads', 5], ['family_model', 5], ['source_evidence', 12], ['household_journeys', 15],
  ];
  for (const [field, expected] of fixedCounts) if (asArray(report[field]).length !== expected) errors.push(`${field} must contain exactly ${expected} items`);
  if (report.region_overview?.production_recipe_count !== asArray(report.production_recipe_audits).length) errors.push(`region production_recipe_count expected ${asArray(report.production_recipe_audits).length}, got ${report.region_overview?.production_recipe_count}`);
  if (report.region_overview?.candidate_count !== asArray(report.candidate_audits).length) errors.push(`region candidate_count expected ${asArray(report.candidate_audits).length}, got ${report.region_overview?.candidate_count}`);
  if (report.region_overview?.concrete_research_lead_count !== asArray(report.concrete_research_leads).length) errors.push(`region concrete_research_lead_count expected ${asArray(report.concrete_research_leads).length}, got ${report.region_overview?.concrete_research_lead_count}`);
  const expectedGrades = countBy(asArray(report.source_evidence), 'source_grade', ['A', 'B', 'C']);
  if (JSON.stringify(summary.source_count_by_grade) !== JSON.stringify(expectedGrades)) errors.push('summary source_count_by_grade is inconsistent');
  const subjectGroups = reportSubjectGroups(report);
  const expectedClaimMatrix = deriveClaimMatrix(subjectGroups);
  if (JSON.stringify(asArray(report.claim_matrix)) !== JSON.stringify(expectedClaimMatrix)) errors.push('claim_matrix must exactly match claims derived from audited rows');
  validateClaimEvidence(subjectGroups, report.source_evidence, errors);
  const coverage = new Map(asArray(report.province_coverage_audits).map(row => [row?.province_code, row]));
  if (asArray(coverage.get('CN-HK')?.production_recipe_ids).length !== 0 || !asArray(coverage.get('CN-HK')?.context_lead_ids).includes('cantonese-claypot-rice-technique')) errors.push('Hong Kong must retain zero production coverage with its claypot-rice research context');
  if (asArray(coverage.get('CN-MO')?.production_recipe_ids).length !== 0 || !asArray(coverage.get('CN-MO')?.lead_ids).includes('macao-portuguese-style-seafood-rice')) errors.push('Macao must retain zero production coverage with its research lead');
  const expectedCompletion = deriveCompletion(report);
  if (report.completion?.status === 'regional_round_complete') errors.push('completion cannot be complete while evidence or review is incomplete');
  if (report.completion?.status !== 'research_in_progress') errors.push('completion status must remain research_in_progress');
  if (JSON.stringify(report.completion?.blockers) !== JSON.stringify(FIXED_COMPLETION_BLOCKERS)) errors.push('completion blockers must remain the fixed Lingnan research blocker set');
  if (JSON.stringify(report.completion?.baseline_facts) !== JSON.stringify(['zero_candidate_baseline'])) errors.push('completion baseline_facts must retain zero_candidate_baseline');
  if (expectedCompletion.status !== 'research_in_progress' || JSON.stringify(expectedCompletion.blockers) !== JSON.stringify(FIXED_COMPLETION_BLOCKERS)) errors.push('audited rows no longer support the fixed Lingnan research gate');
  if (asArray(report.household_journeys).some(row => row?.human_review?.status !== 'pending')) errors.push('household journeys must remain pending manual review');
  if (summary.production_recipe_changes !== 0) errors.push('production_recipe_changes must remain 0');
  if (summary.regional_candidate_changes !== 0) errors.push('regional_candidate_changes must remain 0');
  if (summary.human_journey_reviewed_count !== 0) errors.push('human_journey_reviewed_count must remain 0');
  if (!/不新增.*recipe.*candidate/i.test(summary.scope_note || '')) errors.push('summary must state that no recipe or candidate was added');
  return errors;
}

export function formatLingnanHkMacaoOnePotResearchSummary(report) {
  const summary = asObject(report?.summary);
  const status = report?.completion?.status === 'research_in_progress' ? 'research in progress' : 'research ok';
  return `${summary.production_audit_count ?? 0} Lingnan production audits · ${summary.candidate_audit_count ?? 0} candidates · ${summary.concrete_research_lead_count ?? 0} research leads · ${summary.household_journey_count ?? 0} journeys · Lingnan ${status}`;
}

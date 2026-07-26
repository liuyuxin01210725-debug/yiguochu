import { createHash } from 'node:crypto';
import { validateQinghaiTibetOnePotResearch } from './qinghai-tibet-one-pot-research-validator.mjs';

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const rows = value => Array.isArray(value) ? value : [];
const object = value => isObject(value) ? value : {};
const copy = value => structuredClone(value);

const REGION_ID = 'qinghai_tibet';
const PROVINCES = ['CN-QH', 'CN-XZ'];
const FIXED_COUNTS = {
  province_coverage_audits: 2,
  production_recipe_audits: 4,
  candidate_audits: 0,
  concrete_research_leads: 5,
  family_model: 6,
  source_evidence: 11,
  household_journeys: 12,
};
const CLAIM_DIRECTIONS = { supported: 'proves', not_proven: 'does_not_prove', contradicted: 'contradicts' };
const SUBJECT_TOKENS = {
  production_recipe: 'production',
  research_candidate: 'candidate',
  concrete_research_lead: 'lead',
};
const COMPLETION_BLOCKERS = [
  'production_evidence_gaps',
  'ratio_dsl_unresolved',
  'household_vessel_adaptation_unresolved',
  'safety_endpoint_incomplete',
  'human_journey_review_incomplete',
];
const SOURCE_DATA_FINGERPRINT = '224c33752390b6ff877d176bad8aa76ea18222d105f99781381b0f006cfff342';
const FIXED_PROVINCE_DETAILS = {
  'CN-QH': {
    province_name: '青海',
    atlas_status: 'skeleton_only',
    research_question: '整理青海熬饭、面片与青稞杂粮主餐的技法和家庭适配。',
  },
  'CN-XZ': {
    province_name: '西藏',
    atlas_status: 'skeleton_only',
    research_question: '整理西藏咸稀饭、古突、人参果饭和青稞主餐的技法边界。',
  },
};
const ENRICHMENT_FIELDS = new Set([
  'recipe_name', 'recipe_status', 'cuisine', 'recipe_core_ingredients', 'recipe_substitution_slots',
  'mapping_regional_scope', 'mapping_province_codes', 'atlas_primary_family_id', 'atlas_secondary_family_ids',
]);

const canonicalJson = value => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
};

const fingerprint = value => createHash('sha256').update(canonicalJson(value)).digest('hex');
const countBy = (items, field, keys) => Object.fromEntries(keys.map(key => [key, items.filter(item => item?.[field] === key).length]));

function subjectGroups(report) {
  return [
    { subject_type: 'production_recipe', rows: rows(report.production_recipe_audits), id_field: 'recipe_id' },
    { subject_type: 'research_candidate', rows: rows(report.candidate_audits), id_field: 'candidate_id' },
    { subject_type: 'concrete_research_lead', rows: rows(report.concrete_research_leads), id_field: 'lead_id' },
  ];
}

function sourcePayload(report) {
  const stripEnrichment = row => {
    const normalized = copy(row);
    for (const field of ENRICHMENT_FIELDS) delete normalized[field];
    return normalized;
  };
  return {
    assessment_version: report.assessment_version,
    region_id: report.region_overview?.region_id,
    province_codes: copy(rows(report.region_overview?.province_codes)),
    production_recipe_audits: rows(report.production_recipe_audits).map(stripEnrichment).sort((a, b) => a.recipe_id.localeCompare(b.recipe_id)),
    candidate_audits: rows(report.candidate_audits).map(stripEnrichment).sort((a, b) => a.candidate_id.localeCompare(b.candidate_id)),
    concrete_research_leads: rows(report.concrete_research_leads).map(stripEnrichment).sort((a, b) => a.lead_id.localeCompare(b.lead_id)),
    family_model: copy(rows(report.family_model)),
    adaptation_boundaries: copy(rows(report.adaptation_boundaries)),
    safety_boundaries: copy(rows(report.safety_boundaries)),
    source_evidence: copy(rows(report.source_evidence)),
    household_journeys: copy(rows(report.household_journeys)),
  };
}

function deriveClaimMatrix(groups) {
  return groups.flatMap(({ subject_type, rows: auditedRows, id_field }) => auditedRows.flatMap(row => Object.entries(object(row.claims)).map(([claim_id, claim]) => ({
    subject_type,
    subject_id: row[id_field],
    claim_id,
    verdict: claim.verdict,
    evidence_direction: CLAIM_DIRECTIONS[claim.verdict] || '',
    evidence_source_ids: copy(rows(claim.evidence_source_ids)),
    reason: claim.reason,
  })))).sort((left, right) => `${left.subject_type}:${left.subject_id}:${left.claim_id}`.localeCompare(`${right.subject_type}:${right.subject_id}:${right.claim_id}`));
}

function deriveIngredientShapeMatrix(groups) {
  const shapes = new Map();
  for (const { subject_type, rows: auditedRows, id_field } of groups) {
    for (const row of auditedRows) for (const shape of rows(row.ingredient_shapes)) {
      const entry = shapes.get(shape) ?? { shape, production_recipe_ids: [], candidate_ids: [], lead_ids: [], source_types: [] };
      if (subject_type === 'production_recipe') entry.production_recipe_ids.push(row[id_field]);
      if (subject_type === 'research_candidate') entry.candidate_ids.push(row[id_field]);
      if (subject_type === 'concrete_research_lead') entry.lead_ids.push(row[id_field]);
      if (!entry.source_types.includes(subject_type)) entry.source_types.push(subject_type);
      shapes.set(shape, entry);
    }
  }
  return [...shapes.values()].map(entry => ({
    ...entry,
    production_recipe_ids: [...new Set(entry.production_recipe_ids)].sort(),
    candidate_ids: [...new Set(entry.candidate_ids)].sort(),
    lead_ids: [...new Set(entry.lead_ids)].sort(),
    source_types: entry.source_types.sort(),
  })).sort((left, right) => left.shape.localeCompare(right.shape));
}

function deriveProductDecisions(groups) {
  return groups.flatMap(({ subject_type, rows: auditedRows, id_field }) => auditedRows.map(row => ({
    subject_type,
    subject_id: row[id_field],
    state: subject_type === 'concrete_research_lead' ? 'research_only' : row.audit_state,
    product_destinations: copy(rows(row.product_destinations)),
    decision_reason: row.decision_reason,
  }))).sort((left, right) => `${left.subject_type}:${left.subject_id}`.localeCompare(`${right.subject_type}:${right.subject_id}`));
}

function deriveCompletion(report) {
  const journeys = rows(report.household_journeys);
  const reviewed = journeys.filter(journey => ['passed', 'failed'].includes(journey?.human_review?.status)).length;
  return {
    status: 'research_in_progress',
    blockers: copy(COMPLETION_BLOCKERS),
    baseline_facts: rows(report.candidate_audits).length === 0 ? ['zero_candidate_baseline'] : [],
    reviewed,
  };
}

function deriveProvinceCoverage(provinceCodes, provinces, groups) {
  return provinceCodes.map(province_code => {
    const province = object(provinces.get(province_code));
    const idsFor = (subject_type, id_field) => groups.find(group => group.subject_type === subject_type).rows
      .filter(row => row.province_code === province_code)
      .map(row => row[id_field])
      .sort();
    return {
      province_code,
      province_name: province.name || '',
      atlas_status: province.status || '',
      research_question: province.research_question || '',
      production_recipe_ids: idsFor('production_recipe', 'recipe_id'),
      candidate_ids: idsFor('research_candidate', 'candidate_id'),
      lead_ids: idsFor('concrete_research_lead', 'lead_id'),
    };
  });
}

function expectedCoverage(report) {
  const groups = subjectGroups(report);
  return PROVINCES.map(province_code => {
    return {
      province_code,
      ...FIXED_PROVINCE_DETAILS[province_code],
      production_recipe_ids: groups[0].rows.filter(item => item.province_code === province_code).map(item => item.recipe_id).sort(),
      candidate_ids: groups[1].rows.filter(item => item.province_code === province_code).map(item => item.candidate_id).sort(),
      lead_ids: groups[2].rows.filter(item => item.province_code === province_code).map(item => item.lead_id).sort(),
    };
  });
}

function validateClaimEvidence(report, errors) {
  const sourceIndex = new Map(rows(report.source_evidence).filter(isObject).map(source => [source.source_id, source]));
  for (const { subject_type, rows: auditedRows, id_field } of subjectGroups(report)) {
    for (const row of auditedRows) for (const [claim_id, claim] of Object.entries(object(row.claims))) {
      const direction = CLAIM_DIRECTIONS[claim?.verdict];
      const token = `${SUBJECT_TOKENS[subject_type]}:${row?.[id_field]}:${claim_id}`;
      if (!direction) errors.push(`claim ${token} has an invalid verdict`);
      if (!Array.isArray(claim?.evidence_source_ids) || claim.evidence_source_ids.length === 0) errors.push(`claim ${token} must retain evidence_source_ids`);
      if (typeof claim?.reason !== 'string' || claim.reason.trim().length === 0) errors.push(`claim ${token} must retain a reason`);
      for (const source_id of rows(claim?.evidence_source_ids)) {
        const source = sourceIndex.get(source_id);
        if (!source) errors.push(`claim ${token} references unknown source ${source_id}`);
        else if (!rows(source[direction]).includes(token)) errors.push(`claim ${token} must be reverse-indexed under ${direction} by source ${source_id}`);
      }
    }
  }
}

export function buildQinghaiTibetOnePotResearchReport(inputs = {}) {
  const errors = validateQinghaiTibetOnePotResearch(inputs);
  if (errors.length) throw new Error(errors.join('\n'));

  const assessment = object(inputs.assessment);
  const recipes = new Map(rows(inputs.recipeLibrary?.recipes).filter(isObject).map(recipe => [recipe.id, recipe]));
  const mappings = new Map([
    ...rows(inputs.regionalMappings?.production_recipe_mappings),
    ...rows(inputs.regionalMappings?.research_candidate_mappings),
  ].filter(isObject).map(mapping => [mapping.source_id, mapping]));
  const provinces = new Map(rows(inputs.regionalAtlas?.province_nodes).filter(isObject).map(province => [province.atlas_code, province]));
  const region = object(rows(inputs.regionalAtlas?.regions).find(item => item?.region_id === assessment.region_id));

  const production = rows(assessment.production_recipe_audits).filter(isObject).map(audit => {
    const recipe = object(recipes.get(audit.recipe_id));
    const mapping = object(mappings.get(audit.recipe_id));
    return {
      ...copy(audit),
      recipe_name: recipe.name || '',
      recipe_status: recipe.status || '',
      cuisine: recipe.cuisine || '',
      recipe_core_ingredients: copy(rows(recipe.core_ingredients)),
      recipe_substitution_slots: copy(rows(recipe.substitution_slots)),
      mapping_regional_scope: mapping.regional_scope || '',
      mapping_province_codes: copy(rows(mapping.province_codes)),
      atlas_primary_family_id: mapping.primary_family_id || '',
      atlas_secondary_family_ids: copy(rows(mapping.secondary_family_ids)),
    };
  }).sort((left, right) => left.recipe_id.localeCompare(right.recipe_id));
  const candidates = rows(assessment.candidate_audits).filter(isObject).map(copy).sort((left, right) => left.candidate_id.localeCompare(right.candidate_id));
  const leads = rows(assessment.concrete_research_leads).filter(isObject).map(copy).sort((left, right) => left.lead_id.localeCompare(right.lead_id));
  const groups = [
    { subject_type: 'production_recipe', rows: production, id_field: 'recipe_id' },
    { subject_type: 'research_candidate', rows: candidates, id_field: 'candidate_id' },
    { subject_type: 'concrete_research_lead', rows: leads, id_field: 'lead_id' },
  ];

  const report = {
    schema_version: 1,
    assessment_version: assessment.assessment_version,
    region_overview: {
      region_id: assessment.region_id,
      name: region.name || '青藏',
      province_codes: copy(assessment.province_codes),
      research_focus: copy(rows(region.research_focus)),
      production_recipe_count: production.length,
      candidate_count: candidates.length,
      concrete_research_lead_count: leads.length,
    },
    province_coverage_audits: deriveProvinceCoverage(assessment.province_codes, provinces, groups),
    production_recipe_audits: production,
    candidate_audits: candidates,
    concrete_research_leads: leads,
    family_model: copy(rows(assessment.family_model)),
    claim_matrix: deriveClaimMatrix(groups),
    ingredient_shape_matrix: deriveIngredientShapeMatrix(groups),
    adaptation_boundaries: copy(rows(assessment.adaptation_boundaries)),
    safety_boundaries: copy(rows(assessment.safety_boundaries)),
    source_evidence: copy(rows(assessment.source_refs)),
    product_decisions: deriveProductDecisions(groups),
    household_journeys: copy(rows(assessment.journey_cases)),
  };
  report.source_data_normalized_fingerprint = fingerprint(sourcePayload(report));
  const completion = deriveCompletion(report);
  report.completion = { status: completion.status, blockers: completion.blockers, baseline_facts: completion.baseline_facts };
  report.summary = {
    province_coverage_count: report.province_coverage_audits.length,
    production_audit_count: production.length,
    candidate_audit_count: candidates.length,
    concrete_research_lead_count: leads.length,
    source_count: report.source_evidence.length,
    source_count_by_grade: countBy(report.source_evidence, 'source_grade', ['A', 'B', 'C']),
    family_count: report.family_model.length,
    household_journey_count: report.household_journeys.length,
    human_journey_reviewed_count: completion.reviewed,
    production_recipe_changes: 0,
    regional_candidate_changes: 0,
    scope_note: '本轮仅新增研究审计与报告：不新增 recipe 或 candidate。',
  };
  return report;
}

export function validateQinghaiTibetOnePotResearchReport(report) {
  if (!isObject(report)) return ['report must be an object'];
  const errors = [];
  const arrayFields = [
    'province_coverage_audits', 'production_recipe_audits', 'candidate_audits', 'concrete_research_leads',
    'family_model', 'claim_matrix', 'ingredient_shape_matrix', 'adaptation_boundaries', 'safety_boundaries',
    'source_evidence', 'product_decisions', 'household_journeys',
  ];
  for (const field of arrayFields) if (!Array.isArray(report[field])) errors.push(`${field} must be an array`);
  if (report.schema_version !== 1) errors.push('report schema_version must be 1');
  if (report.region_overview?.region_id !== REGION_ID) errors.push('region_overview must be Qinghai Tibet');
  if (JSON.stringify(report.region_overview?.province_codes) !== JSON.stringify(PROVINCES)) errors.push('region_overview province_codes must match Qinghai Tibet');
  for (const [field, expected] of Object.entries(FIXED_COUNTS)) if (rows(report[field]).length !== expected) errors.push(`${field} must contain exactly ${expected} items`);
  if (report.region_overview?.production_recipe_count !== rows(report.production_recipe_audits).length) errors.push('region production_recipe_count must match audits');
  if (report.region_overview?.candidate_count !== rows(report.candidate_audits).length) errors.push('region candidate_count must match audits');
  if (report.region_overview?.concrete_research_lead_count !== rows(report.concrete_research_leads).length) errors.push('region concrete_research_lead_count must match audits');

  const summary = object(report.summary);
  const derivedSummaryCounts = [
    ['province_coverage_count', rows(report.province_coverage_audits).length],
    ['production_audit_count', rows(report.production_recipe_audits).length],
    ['candidate_audit_count', rows(report.candidate_audits).length],
    ['concrete_research_lead_count', rows(report.concrete_research_leads).length],
    ['source_count', rows(report.source_evidence).length],
    ['family_count', rows(report.family_model).length],
    ['household_journey_count', rows(report.household_journeys).length],
  ];
  for (const [field, expected] of derivedSummaryCounts) if (summary[field] !== expected) errors.push(`summary ${field} expected ${expected}, got ${summary[field]}`);
  if (JSON.stringify(summary.source_count_by_grade) !== JSON.stringify(countBy(rows(report.source_evidence), 'source_grade', ['A', 'B', 'C']))) errors.push('summary source_count_by_grade is inconsistent');
  if (summary.production_recipe_changes !== 0 || summary.regional_candidate_changes !== 0) errors.push('summary must retain zero product changes');
  if (summary.human_journey_reviewed_count !== 0) errors.push('summary human_journey_reviewed_count must remain 0');
  if (!/不新增.*recipe.*candidate/i.test(summary.scope_note || '')) errors.push('summary must state that no recipe or candidate was added');

  const groups = subjectGroups(report);
  if (JSON.stringify(rows(report.claim_matrix)) !== JSON.stringify(deriveClaimMatrix(groups))) errors.push('claim_matrix must exactly match audited rows');
  if (JSON.stringify(rows(report.ingredient_shape_matrix)) !== JSON.stringify(deriveIngredientShapeMatrix(groups))) errors.push('ingredient_shape_matrix must exactly match audited rows');
  if (JSON.stringify(rows(report.product_decisions)) !== JSON.stringify(deriveProductDecisions(groups))) errors.push('product_decisions must exactly match audited rows');
  if (JSON.stringify(rows(report.province_coverage_audits)) !== JSON.stringify(expectedCoverage(report))) errors.push('province_coverage_audits must exactly match audited rows');
  validateClaimEvidence(report, errors);

  const actualFingerprint = fingerprint(sourcePayload(report));
  if (report.source_data_normalized_fingerprint !== actualFingerprint) errors.push('source_data_normalized_fingerprint must match normalized report data');
  if (actualFingerprint !== SOURCE_DATA_FINGERPRINT) errors.push('normalized source data fingerprint mismatch');
  if (report.completion?.status !== 'research_in_progress') errors.push('completion status must remain research_in_progress');
  if (JSON.stringify(report.completion?.blockers) !== JSON.stringify(COMPLETION_BLOCKERS)) errors.push('completion blockers must retain production evidence, ratio, household adaptation, safety and human review gates');
  if (JSON.stringify(report.completion?.baseline_facts) !== JSON.stringify(['zero_candidate_baseline'])) errors.push('completion baseline_facts must retain zero_candidate_baseline');
  if (rows(report.household_journeys).some(journey => journey?.human_review?.status !== 'pending')) errors.push('household journeys must remain pending manual review');
  return errors;
}

export function formatQinghaiTibetOnePotResearchSummary(report) {
  const summary = object(report?.summary);
  const status = report?.completion?.status === 'research_in_progress' ? 'research in progress' : 'research ok';
  return `${summary.production_audit_count ?? 0} Qinghai Tibet production audits · ${summary.candidate_audit_count ?? 0} candidates · ${summary.concrete_research_lead_count ?? 0} research leads · ${summary.household_journey_count ?? 0} journeys · Qinghai Tibet ${status}`;
}

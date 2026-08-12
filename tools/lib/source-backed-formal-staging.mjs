const FORMAL_STAGING_VERSION = 'source-backed-formal-staging-v1-20260811-r2';
const SOURCE_COMPLETE_STATUS = 'source_complete_pending_formal';
const REQUIRED_BLOCKERS = Object.freeze([
  'ratio_dsl',
  'cooker_boundary',
  'kitchen_observed',
  'journey_coverage',
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function stagingRecord(reviewRecord) {
  const blockerCodes = [...new Set([
    ...asArray(reviewRecord?.blocker_codes),
    ...REQUIRED_BLOCKERS,
  ])];
  return {
    recipe_id: reviewRecord.recipe_id,
    canonical_name: reviewRecord.canonical_name,
    source_status: reviewRecord.source_status,
    method_card_status: reviewRecord.method_card_status,
    formal_candidate_status: reviewRecord.formal_candidate_status || 'research_only',
    promotion_status: 'not_formal',
    formal_planner_status: 'not_in_formal_72',
    source_contract: clone(reviewRecord.source_contract),
    taxonomy_mapping: clone(reviewRecord.taxonomy_mapping),
    ratio_dsl: clone(reviewRecord.ratio_dsl),
    nutrition: clone(reviewRecord.nutrition),
    safety: clone(reviewRecord.safety),
    cooker_boundary: clone(reviewRecord.cooker_boundary),
    blocker_codes: blockerCodes,
    kitchen_observed: {
      status: 'pending',
      evidence_ids: [],
    },
    journey_coverage: {
      status: 'pending',
      journey_ids: [],
    },
    next_action: reviewRecord.next_action || '先补来源合同、Ratio DSL 与同器具适配，再做厨房试做和真实旅程回归；完成前不得进入正式 Planner。',
  };
}

export function buildSourceBackedFormalStaging(catalog, review) {
  const records = asArray(review?.records)
    .map(stagingRecord);
  return {
    schema_version: 1,
    staging_version: FORMAL_STAGING_VERSION,
    source_catalog_version: catalog?.catalog_version || null,
    scope: 'source-backed-formal-staging',
    policy: {
      source_complete_is_not_formal: true,
      no_estimates_are_promoted_to_source_facts: true,
      ratio_dsl_and_cooker_boundary_required: true,
      kitchen_observed_required_before_production: true,
      journey_coverage_required_before_production: true,
    },
    counts: {
    total: records.length,
      source_complete: records.filter(record => record.formal_candidate_status === SOURCE_COMPLETE_STATUS).length,
      research_only: records.filter(record => record.formal_candidate_status === 'research_only').length,
      formal_ready: records.filter(record => record.promotion_status === 'formal').length,
      kitchen_pending: records.filter(record => record.kitchen_observed.status === 'pending').length,
      journey_pending: records.filter(record => record.journey_coverage.status === 'pending').length,
    },
    records,
  };
}

export function validateSourceBackedFormalStaging(staging, catalog, review) {
  const errors = [];
  if (!staging || typeof staging !== 'object' || Array.isArray(staging)) return ['staging must be an object'];
  if (staging.schema_version !== 1) errors.push('staging.schema_version must be 1');
  if (staging.staging_version !== FORMAL_STAGING_VERSION) errors.push('staging.staging_version is invalid');
  if (staging.scope !== 'source-backed-formal-staging') errors.push('staging.scope is invalid');
  if (staging.source_catalog_version !== catalog?.catalog_version) errors.push('staging.source_catalog_version does not match source catalog');
  const sourceIds = new Set(asArray(catalog?.recipes).map(recipe => recipe?.recipe_id).filter(Boolean));
  const expectedReviews = asArray(review?.records);
  const expectedIds = new Set(expectedReviews.map(record => record.recipe_id));
  const seen = new Set();
  for (const record of asArray(staging.records)) {
    if (!record?.recipe_id) {
      errors.push('staging record recipe_id is required');
      continue;
    }
    if (seen.has(record.recipe_id)) errors.push(`duplicate staging record ${record.recipe_id}`);
    seen.add(record.recipe_id);
    if (!sourceIds.has(record.recipe_id)) errors.push(`${record.recipe_id} is not in source catalog`);
    if (!expectedIds.has(record.recipe_id)) errors.push(`${record.recipe_id} is not in formal review`);
    if (!['research_only', SOURCE_COMPLETE_STATUS].includes(record.formal_candidate_status)) errors.push(`${record.recipe_id} formal_candidate_status is invalid`);
    if (record.promotion_status !== 'not_formal') errors.push(`${record.recipe_id} promotion_status must remain not_formal`);
    if (record.formal_planner_status !== 'not_in_formal_72') errors.push(`${record.recipe_id} formal_planner_status is invalid`);
    for (const blocker of REQUIRED_BLOCKERS) {
      if (!asArray(record.blocker_codes).includes(blocker)) errors.push(`${record.recipe_id} is missing required blocker ${blocker}`);
    }
    if (record.kitchen_observed?.status !== 'pending') errors.push(`${record.recipe_id} kitchen_observed must remain pending`);
    if (record.journey_coverage?.status !== 'pending') errors.push(`${record.recipe_id} journey_coverage must remain pending`);
  }
  if (seen.size !== expectedIds.size) errors.push(`staging records must cover all ${expectedIds.size} formal review rows`);
  const expected = buildSourceBackedFormalStaging(catalog, review);
  if (JSON.stringify(staging) !== JSON.stringify(expected)) errors.push('staging does not match deterministic build');
  if (staging.counts?.total !== expected.records.length) errors.push('staging counts.total is invalid');
  if (staging.counts?.source_complete !== expected.counts.source_complete) errors.push('staging counts.source_complete is invalid');
  if (staging.counts?.research_only !== expected.counts.research_only) errors.push('staging counts.research_only is invalid');
  if (staging.counts?.formal_ready !== 0) errors.push('staging counts.formal_ready must remain 0');
  return errors;
}

export const sourceBackedFormalStagingVersion = FORMAL_STAGING_VERSION;

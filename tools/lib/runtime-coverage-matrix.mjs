const RUNTIME_COVERAGE_MATRIX_VERSION = 'runtime-coverage-matrix-v1-20260813-c6';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function mapById(rows, key = 'id') {
  return new Map(asArray(rows).map(row => [row?.[key], row]));
}

function structuredRecipeIds(journey) {
  const ids = [];
  const fields = ['recipe_id', 'selected_recipe_id', 'candidate_recipe_ids', 'runtime_recipe_refs', 'evidence_recipe_ids'];
  for (const field of fields) {
    const value = journey?.[field];
    if (typeof value === 'string' && value) ids.push(value);
    else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item) ids.push(item);
        else if (item && typeof item.recipe_id === 'string' && item.recipe_id) ids.push(item.recipe_id);
      }
    }
  }
  return [...new Set(ids)];
}

function expectedVariantIds(journey) {
  const expect = journey?.expect || {};
  return [...new Set([
    ...asArray(expect.allowed_variant_ids),
    ...(expect.expected_first_variant ? [expect.expected_first_variant] : []),
  ].filter(value => typeof value === 'string' && value))];
}

function requestFor(sourceKind, journey) {
  if (sourceKind === 'recipe_runtime') {
    return {
      servings: null,
      pantry: asArray(journey.prefer_use),
      dislikes: asArray(journey.dislikes),
      intent: journey.scenario || null,
    };
  }
  if (sourceKind === 'rice_meal') {
    return {
      servings: journey.request?.servings ?? null,
      pantry: asArray(journey.request?.pantry),
      dislikes: asArray(journey.request?.dislikes),
      intent: 'rice_meal',
    };
  }
  return {
    servings: journey.servings ?? null,
    pantry: asArray(journey.prefer_use),
    dislikes: asArray(journey.dislikes),
    intent: journey.intent || null,
  };
}

function expectedFor(sourceKind, journey, formalIds, variantIds) {
  if (sourceKind === 'recipe_runtime') {
    const ids = structuredRecipeIds(journey);
    const valid = ids.filter(id => formalIds.has(id));
    return {
      status: journey.expected_title ? 'ready_candidate' : 'boundary_case',
      candidate_refs: { recipe_ids: valid, template_ids: [], variant_ids: [] },
      used_raw: [],
      unused_raw: [],
      reason_codes: journey.expected_title ? [] : ['not_observed'],
      nutrition_grades: [],
    };
  }
  if (sourceKind === 'rice_meal') {
    const expect = journey.expect || {};
    const ids = expectedVariantIds(journey);
    const valid = ids.filter(id => variantIds.has(id));
    return {
      status: expect.status || 'not_specified',
      candidate_refs: { recipe_ids: [], template_ids: [], variant_ids: valid },
      used_raw: asArray(expect.expected_used_raw),
      unused_raw: asArray(expect.expected_unused_raw),
      reason_codes: asArray(expect.required_unused_reason_codes),
      nutrition_grades: asArray(expect.nutrition_grades),
    };
  }
  const expect = journey.expect || {};
  return {
    status: asArray(expect.allowed_statuses).join('|') || 'not_specified',
    candidate_refs: { recipe_ids: [], template_ids: [], variant_ids: [] },
    used_raw: [],
    unused_raw: [],
    reason_codes: asArray(expect.required_unused_reason_codes),
    nutrition_grades: [],
  };
}

function rawCandidateIds(sourceKind, journey) {
  if (sourceKind === 'recipe_runtime') return structuredRecipeIds(journey);
  if (sourceKind === 'rice_meal') return expectedVariantIds(journey);
  return [];
}

function contractStatus() {
  return {
    status: 'not_observed',
    value: null,
    source: null,
  };
}

function scenarioRow(sourceKind, journey, formalIds, variantIds) {
  const sourceId = journey.id;
  const expected = expectedFor(sourceKind, journey, formalIds, variantIds);
  const candidateRefs = expected.candidate_refs;
  const knownIds = new Set([...formalIds, ...variantIds]);
  const rawIds = rawCandidateIds(sourceKind, journey);
  const resolvedIds = [...new Set([
    ...candidateRefs.recipe_ids,
    ...candidateRefs.template_ids,
    ...candidateRefs.variant_ids,
  ])];
  const unknownIds = [...new Set(rawIds.filter(id => !knownIds.has(id)))];
  const candidateJoinStatus = unknownIds.length > 0
    ? 'invalid'
    : (resolvedIds.length ? 'ok' : 'none');
  return {
    scenario_id: `${sourceKind}:${sourceId}`,
    source_kind: sourceKind,
    source_id: sourceId,
    request: requestFor(sourceKind, journey),
    expected,
    joins: {
      source: { status: 'ok', source_id: sourceId },
      candidate_refs: {
        status: candidateJoinStatus,
        resolved_ids: resolvedIds,
        unknown_ids: unknownIds,
        blocker_codes: unknownIds.length > 0
          ? ['unknown_candidate_id', 'candidate_join_invalid']
          : [],
      },
    },
    observation: {
      observed: false,
      status: 'not_observed',
      recipe_ids: [],
      template_ids: [],
      used_raw: [],
      unused_raw: [],
      hit: {
        recipe_ids: [],
        template_ids: [],
        reason_codes: ['not_observed'],
      },
    },
    quantity: contractStatus(),
    liquid: contractStatus(),
    safety: contractStatus(),
    production_eligible: false,
  };
}

export function buildRuntimeCoverageMatrix({
  runtimeJourneys,
  riceMealJourneys,
  directRecommendShadow,
  formalRecipeLibrary,
  riceMealCatalog,
} = {}) {
  const formalIds = new Set(asArray(formalRecipeLibrary?.recipes).map(recipe => recipe?.id).filter(Boolean));
  const variantIds = new Set(asArray(riceMealCatalog?.families).flatMap(family => asArray(family?.variants).map(variant => variant?.variant_id).filter(Boolean)));
  const sources = [
    ['recipe_runtime', asArray(runtimeJourneys?.journeys)],
    ['rice_meal', asArray(riceMealJourneys?.journeys)],
    ['direct_recommend_shadow', asArray(directRecommendShadow?.journeys)],
  ];
  const scenarios = sources.flatMap(([sourceKind, journeys]) => journeys.map(journey => scenarioRow(sourceKind, journey, formalIds, variantIds)));
  const bySource = Object.fromEntries(sources.map(([sourceKind, journeys]) => [sourceKind, journeys.length]));
  return {
    schema_version: 1,
    runtime_coverage_matrix_version: RUNTIME_COVERAGE_MATRIX_VERSION,
    scope: 'runtime-coverage-matrix',
    policy: {
      scenario_is_primary_key: true,
      structured_candidate_ids_only: true,
      text_mentions_are_not_evidence: true,
      observations_are_separate_from_expectations: true,
      missing_contracts_fail_closed: true,
      production_requires_observed_and_promoted: true,
      candidate_join_preserves_unknown_ids: true,
      candidate_join_includes_variant_ids: true,
    },
    counts: {
      total: scenarios.length,
      by_source: bySource,
      observed: scenarios.filter(row => row.observation.observed).length,
      production_eligible: scenarios.filter(row => row.production_eligible).length,
    candidate_joined: scenarios.filter(row => row.joins.candidate_refs.status === 'ok').length,
    candidate_join_invalid: scenarios.filter(row => row.joins.candidate_refs.status === 'invalid').length,
    },
    scenarios,
  };
}

export function validateRuntimeCoverageMatrix(matrix, inputs = {}) {
  const errors = [];
  if (!matrix || typeof matrix !== 'object' || Array.isArray(matrix)) return ['runtime coverage matrix must be an object'];
  if (matrix.schema_version !== 1) errors.push('runtime coverage matrix schema_version must be 1');
  if (matrix.runtime_coverage_matrix_version !== RUNTIME_COVERAGE_MATRIX_VERSION) errors.push('runtime coverage matrix version is invalid');
  if (matrix.scope !== 'runtime-coverage-matrix') errors.push('runtime coverage matrix scope is invalid');
  const expected = buildRuntimeCoverageMatrix(inputs);
  const ids = new Set();
  for (const scenario of asArray(matrix.scenarios)) {
    if (ids.has(scenario?.scenario_id)) errors.push(`duplicate scenario_id ${scenario.scenario_id}`);
    ids.add(scenario?.scenario_id);
    if (scenario?.production_eligible !== false) errors.push(`${scenario?.scenario_id} production_eligible must be false`);
    if (scenario?.observation?.observed !== false) errors.push(`${scenario?.scenario_id} observation must remain unobserved`);
  }
  if (JSON.stringify(matrix) !== JSON.stringify(expected)) errors.push('runtime coverage matrix does not match deterministic build');
  return errors;
}

export const runtimeCoverageMatrixVersion = RUNTIME_COVERAGE_MATRIX_VERSION;

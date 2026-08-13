const COVERAGE_MATRIX_VERSION = 'source-backed-coverage-matrix-v1-20260813-m1';

const PRIORITY_BY_METHOD_STATUS = Object.freeze({
  source_complete: 'P0',
  source_partial_with_draft: 'P1',
  draft_estimated: 'P2',
  identity_only_draft: 'P3',
});

const PRODUCT_PATHS = Object.freeze([
  {
    path_id: 'give_me_one',
    label: '给我一道',
    commitment: '只从可执行 Runtime Recipe 中选择；来源研究卡不能冒充生产菜谱。',
    notes: '现有 72 道正式基础菜谱仍是唯一可用生产基线；923 条 source card 不因 execution 完整而自动接入。',
  },
  {
    path_id: 'must_use_ingredients',
    label: '按我的食材做一锅',
    commitment: '用户指定的必用食材必须 100% 覆盖；无法覆盖时明确拒绝或请用户取舍。',
    notes: 'Coverage Matrix 只记录当前资产和门禁，不把一次推荐的部分覆盖误称为必须使用成功。',
  },
  {
    path_id: 'today_what_to_eat',
    label: '今天吃什么',
    commitment: '允许合理取舍，但必须展示实际使用、未使用及原因。',
    notes: '当前已有 direct-recommend shadow 与 rice-meal journeys 证据，尚未等同于全量 source recipe 运行覆盖。',
  },
  {
    path_id: 'clear_pantry',
    label: '清库存',
    commitment: '需要数量分配、跨多顿状态和完整覆盖合同，不能用一次推荐替代。',
    notes: '当前仍是后续独立实施范围，不在本矩阵中伪造完成状态。',
  },
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function countBy(rows, selector) {
  return rows.reduce((result, row) => {
    const value = selector(row);
    if (value !== undefined && value !== null && value !== '') {
      result[value] = (result[value] || 0) + 1;
    }
    return result;
  }, {});
}

function sourceContractStatus(reviewRecord) {
  const missing = asArray(reviewRecord?.source_contract?.missing_fields);
  return missing.length === 0 ? 'complete' : 'incomplete';
}

function formalLibraryById(formalRecipeLibrary) {
  return new Map(asArray(formalRecipeLibrary?.recipes).map(recipe => [recipe?.id, recipe]));
}

function mapById(rows) {
  return new Map(asArray(rows).map(row => [row?.recipe_id, row]));
}

function journeyEvidenceFor(recipeId, runtimeJourneys, riceMealJourneys) {
  const evidence = [];
  for (const journey of asArray(runtimeJourneys?.journeys)) {
    if (JSON.stringify(journey).includes(recipeId)) {
      evidence.push(`runtime:${journey.id}`);
    }
  }
  for (const journey of asArray(riceMealJourneys?.journeys)) {
    if (JSON.stringify(journey).includes(recipeId)) {
      evidence.push(`rice_meal:${journey.id}`);
    }
  }
  return evidence;
}

function sourceRecord(recipe, reviewRecord) {
  return {
    status: recipe?.status || null,
    identity_status: recipe?.identity_status || null,
    contract_status: sourceContractStatus(reviewRecord),
    source_id_count: asArray(recipe?.source_refs).length,
    cooker_boundary_status: recipe?.cooker_adaptation?.status || null,
  };
}

function executionRecord(executionEntry, ledgerRecord) {
  const readiness = ledgerRecord?.execution_readiness || {};
  return {
    status: executionEntry?.method_card_status || null,
    run_scope: executionEntry?.run_scope || null,
    readiness_status: readiness.status || null,
    unblocked: readiness.unblocked !== false,
    source_complete: executionEntry?.method_card_status === 'source_complete',
    ingredient_count: asArray(executionEntry?.execution_card?.ingredients).length,
    step_count: asArray(executionEntry?.execution_card?.steps).length,
  };
}

function formalRecord(ledgerRecord, reviewRecord, formalRecipe) {
  const formalBlockers = [
    ...asArray(reviewRecord?.blocker_codes),
    ...asArray(ledgerRecord?.formal_planner_blocker_codes),
  ];
  return {
    status: ledgerRecord?.formalization_status || null,
    planner_status: ledgerRecord?.formal_planner_status || null,
    library_match: Boolean(formalRecipe),
    library_status: formalRecipe?.status || 'not_in_formal_library',
    blocker_codes: [...new Set(formalBlockers)],
    ratio_status: reviewRecord?.ratio_dsl?.status || null,
    taxonomy_status: reviewRecord?.taxonomy_mapping?.status || null,
    nutrition_status: reviewRecord?.nutrition?.status || null,
    safety_status: reviewRecord?.safety?.status || null,
    cooker_boundary_status: reviewRecord?.cooker_boundary?.status || null,
  };
}

function blockedBySafety(executionEntry, ledgerRecord) {
  return executionEntry?.execution_card?.blocked_reason
    || ledgerRecord?.execution_readiness?.unblocked === false;
}

function gateRecord(status, evidenceIds, safetyBlocked) {
  if (safetyBlocked) {
    return { status: 'blocked', evidence_ids: [], evidence_status: 'blocked', evidence_count: 0 };
  }
  return {
    status: status || 'pending',
    evidence_ids: [...evidenceIds],
    evidence_status: evidenceIds.length ? 'shadow_evidence' : 'none',
    evidence_count: evidenceIds.length,
  };
}

function rowFor(recipe, {
  executionByRecipe,
  ledgerByRecipe,
  reviewByRecipe,
  stagingByRecipe,
  formalByRecipe,
  runtimeJourneys,
  riceMealJourneys,
}) {
  const execution = executionByRecipe.get(recipe.recipe_id);
  const ledger = ledgerByRecipe.get(recipe.recipe_id);
  const review = reviewByRecipe.get(recipe.recipe_id);
  const staging = stagingByRecipe.get(recipe.recipe_id);
  const formalRecipe = formalByRecipe.get(recipe.recipe_id);
  const safetyBlocked = Boolean(blockedBySafety(execution, ledger));
  const priority = PRIORITY_BY_METHOD_STATUS[execution?.method_card_status] || 'P3';
  const journeyEvidenceIds = journeyEvidenceFor(recipe.recipe_id, runtimeJourneys, riceMealJourneys);
  const kitchenStatus = staging?.kitchen_observed?.status || review?.kitchen_observed?.status || 'pending';
  const journeyStatus = staging?.journey_coverage?.status || review?.journey_coverage?.status || 'pending';
  const source = sourceRecord(recipe, review);
  const executionState = executionRecord(execution, ledger);
  const formal = formalRecord(ledger, review, formalRecipe);
  const kitchen = gateRecord(kitchenStatus, [], safetyBlocked);
  const journey = gateRecord(journeyStatus, journeyEvidenceIds, safetyBlocked);
  const gaps = new Set([
    ...asArray(review?.blocker_codes),
    ...asArray(formal?.blocker_codes),
  ]);

  if (source.contract_status !== 'complete') gaps.add('source_contract');
  if (executionState.readiness_status !== 'complete') gaps.add('execution_incomplete');
  if (formal.status !== 'preview_candidate') gaps.add('formalization');
  if (formal.planner_status !== 'production_approved') gaps.add('not_in_formal_72');
  if (kitchen.status === 'pending') gaps.add('kitchen_observed');
  if (journey.status === 'pending') gaps.add('journey_coverage');
  if (safetyBlocked) gaps.add('safety_blocked');

  return {
    recipe_id: recipe.recipe_id,
    canonical_name: recipe.canonical_name,
    priority,
    safety_blocked: safetyBlocked,
    source,
    execution: executionState,
    formal,
    kitchen,
    journey,
    product_paths: {
      give_me_one: { status: formalRecipe ? 'library_overlap_not_promoted' : 'source_card_not_runtime' },
      must_use_ingredients: { status: 'not_covered' },
      today_what_to_eat: { status: 'partial' },
      clear_pantry: { status: 'not_covered' },
    },
    gap_codes: [...gaps].sort(),
    next_action: ledger?.next_action
      || ledger?.formal_planner_next_action
      || '补齐来源、正式化、厨房观察和真实旅程门禁。',
  };
}

function aggregateGapCodes(records) {
  const result = {};
  for (const record of records) {
    for (const code of asArray(record.gap_codes)) result[code] = (result[code] || 0) + 1;
  }
  return result;
}

function buildProductPaths(records, {
  formalRecipeLibrary,
  runtimeJourneys,
  riceMealJourneys,
  directRecommendShadow,
}) {
  const formalRecipes = asArray(formalRecipeLibrary?.recipes);
  const formalApprovedCount = formalRecipes.filter(recipe => recipe?.status === 'approved').length;
  const formalAutoApprovedCount = formalRecipes.filter(recipe => recipe?.status === 'auto_approved').length;
  const kitchenPending = records.filter(record => record.kitchen.status === 'pending').length;
  const journeyPending = records.filter(record => record.journey.status === 'pending').length;
  const formalRecipeCount = formalRecipes.length;
  const commonGateBlockers = {
    kitchen_observed: kitchenPending,
    journey_coverage: journeyPending,
    ratio_dsl: records.filter(record => record.gap_codes.includes('ratio_dsl')).length,
  };
  const path = PRODUCT_PATHS.map(definition => ({
    ...clone(definition),
    formal_recipe_count: 0,
    formal_approved_count: 0,
    formal_auto_approved_count: 0,
    source_card_eligible_count: 0,
    coverage_status: 'not_covered',
    evidence: {},
    blocker_counts: {},
  }));
  const byId = new Map(path.map(item => [item.path_id, item]));

  const giveMeOne = byId.get('give_me_one');
  Object.assign(giveMeOne, {
    formal_recipe_count: formalRecipeCount,
    formal_approved_count: formalApprovedCount,
    formal_auto_approved_count: formalAutoApprovedCount,
    source_card_eligible_count: 0,
    coverage_status: formalRecipeCount ? 'partial' : 'not_covered',
    evidence: {
      formal_recipe_count: formalRecipeCount,
      formal_approved_count: formalApprovedCount,
      formal_auto_approved_count: formalAutoApprovedCount,
    },
    blocker_counts: {
      ...commonGateBlockers,
      runtime_catalog_activation: records.length,
    },
  });

  const mustUse = byId.get('must_use_ingredients');
  Object.assign(mustUse, {
    coverage_status: 'not_covered',
    evidence: {
      rice_meal_journey_cases: asArray(riceMealJourneys?.journeys).length,
      strict_must_use_cases: 0,
    },
    blocker_counts: {
      must_use_runtime_contract: 1,
      quantity_allocation: 1,
      multi_meal_state: 1,
    },
  });

  const today = byId.get('today_what_to_eat');
  Object.assign(today, {
    coverage_status: 'partial',
    evidence: {
      direct_recommend_shadow_cases: asArray(directRecommendShadow?.journeys).length,
      rice_meal_journey_cases: asArray(riceMealJourneys?.journeys).length,
      runtime_journey_cases: asArray(runtimeJourneys?.journeys).length,
    },
    blocker_counts: {
      source_runtime_integration: records.length,
      ...commonGateBlockers,
    },
  });

  const clearPantry = byId.get('clear_pantry');
  Object.assign(clearPantry, {
    coverage_status: 'not_covered',
    evidence: {
      strict_multi_meal_journey_cases: 0,
      quantity_allocation_cases: 0,
    },
    blocker_counts: {
      quantity_allocation: 1,
      multi_meal_state: 1,
      complete_inventory_contract: 1,
    },
  });
  return path;
}

export function buildSourceBackedCoverageMatrix({
  sourceCatalog,
  executionLibrary,
  formalizationLedger,
  formalReview,
  formalStaging,
  formalRecipeLibrary,
  runtimeJourneys,
  riceMealJourneys,
  directRecommendShadow,
  ratioEvidence,
} = {}) {
  const recipes = asArray(sourceCatalog?.recipes);
  const executionByRecipe = mapById(executionLibrary?.entries);
  const ledgerByRecipe = mapById(formalizationLedger?.records);
  const reviewByRecipe = mapById(formalReview?.records);
  const stagingByRecipe = mapById(formalStaging?.records);
  const formalByRecipe = formalLibraryById(formalRecipeLibrary);
  const records = recipes.map(recipe => rowFor(recipe, {
    executionByRecipe,
    ledgerByRecipe,
    reviewByRecipe,
    stagingByRecipe,
    formalByRecipe,
    runtimeJourneys,
    riceMealJourneys,
  }));
  const safetyBlocked = records.filter(record => record.safety_blocked).length;
  const pathRecords = buildProductPaths(records, {
    formalRecipeLibrary,
    runtimeJourneys,
    riceMealJourneys,
    directRecommendShadow,
  });
  return {
    schema_version: 1,
    coverage_matrix_version: COVERAGE_MATRIX_VERSION,
    source_catalog_version: sourceCatalog?.catalog_version || null,
    execution_library_version: executionLibrary?.execution_library_version || null,
    formalization_ledger_version: formalizationLedger?.ledger_version || null,
    scope: 'source-backed-coverage-matrix',
    policy: {
      source_cards_are_research_assets: true,
      execution_complete_is_not_production: true,
      formal_library_is_not_source_card_promotion: true,
      kitchen_observed_and_journey_coverage_are_required: true,
      safety_blocked_cards_are_never_kitchen_executable: true,
      deterministic_projection_only: true,
    },
    dimensions: {
      priorities: ['P0', 'P1', 'P2', 'P3'],
      status_fields: ['source', 'execution', 'formal', 'kitchen', 'journey'],
      product_paths: PRODUCT_PATHS.map(path => path.path_id),
    },
    counts: {
      total: records.length,
      priority: countBy(records, record => record.priority),
      safety_blocked: safetyBlocked,
      source_status: countBy(records, record => record.source.status),
      execution_status: countBy(records, record => record.execution.status),
      formal_status: countBy(records, record => record.formal.status),
      kitchen_status: countBy(records, record => record.kitchen.status),
      journey_status: countBy(records, record => record.journey.status),
      gap_codes: aggregateGapCodes(records),
    },
    aggregates: {
      source_status: countBy(records, record => record.source.status),
      execution_status: countBy(records, record => record.execution.status),
      formal_status: countBy(records, record => record.formal.status),
      kitchen_status: countBy(records, record => record.kitchen.status),
      journey_status: countBy(records, record => record.journey.status),
      formal_library_status: countBy(records, record => record.formal.library_status),
      gap_codes: aggregateGapCodes(records),
      journey_evidence_recipe_count: records.filter(record => record.journey.evidence_count > 0).length,
      journey_evidence_count: records.reduce((sum, record) => sum + record.journey.evidence_count, 0),
      ratio_evidence_count: asArray(ratioEvidence?.entries).length,
      runtime_journey_count: asArray(runtimeJourneys?.journeys).length,
      rice_meal_journey_count: asArray(riceMealJourneys?.journeys).length,
      direct_recommend_shadow_count: asArray(directRecommendShadow?.journeys).length,
      formal_recipe_count: asArray(formalRecipeLibrary?.recipes).length,
    },
    product_paths: pathRecords,
    records,
  };
}

export function validateSourceBackedCoverageMatrix(matrix, inputs = {}) {
  const errors = [];
  if (!matrix || typeof matrix !== 'object' || Array.isArray(matrix)) return ['coverage matrix must be an object'];
  if (matrix.schema_version !== 1) errors.push('coverage matrix schema_version must be 1');
  if (matrix.coverage_matrix_version !== COVERAGE_MATRIX_VERSION) errors.push('coverage matrix version is invalid');
  if (matrix.scope !== 'source-backed-coverage-matrix') errors.push('coverage matrix scope is invalid');
  if (matrix.source_catalog_version !== inputs.sourceCatalog?.catalog_version) errors.push('coverage matrix source_catalog_version is stale');
  const sourceRecipes = asArray(inputs.sourceCatalog?.recipes);
  const sourceById = new Map(sourceRecipes.map(recipe => [recipe.recipe_id, recipe]));
  const seen = new Set();
  for (const record of asArray(matrix.records)) {
    if (!record?.recipe_id) {
      errors.push('coverage record recipe_id is required');
      continue;
    }
    if (seen.has(record.recipe_id)) errors.push(`duplicate coverage recipe_id ${record.recipe_id}`);
    seen.add(record.recipe_id);
    const source = sourceById.get(record.recipe_id);
    if (!source) {
      errors.push(`${record.recipe_id} is not in source catalog`);
      continue;
    }
    if (record.canonical_name !== source.canonical_name) errors.push(`${record.recipe_id} canonical_name does not match source catalog`);
    if (!['P0', 'P1', 'P2', 'P3'].includes(record.priority)) errors.push(`${record.recipe_id} priority is invalid`);
    if (typeof record.safety_blocked !== 'boolean') errors.push(`${record.recipe_id} safety_blocked is required`);
    for (const field of ['source', 'execution', 'formal', 'kitchen', 'journey']) {
      if (!record[field] || typeof record[field].status !== 'string') errors.push(`${record.recipe_id} ${field}.status is required`);
    }
    if (!Array.isArray(record.gap_codes)) errors.push(`${record.recipe_id} gap_codes must be an array`);
    if (typeof record.next_action !== 'string' || !record.next_action) errors.push(`${record.recipe_id} next_action is required`);
  }
  if (seen.size !== sourceById.size) errors.push('records must cover every source recipe');
  if (matrix.counts?.total !== sourceById.size) errors.push(`counts.total must be ${sourceById.size}`);
  const expected = buildSourceBackedCoverageMatrix(inputs);
  if (JSON.stringify(matrix) !== JSON.stringify(expected)) errors.push('coverage matrix does not match deterministic build');
  const expectedPathIds = PRODUCT_PATHS.map(path => path.path_id);
  if (JSON.stringify(asArray(matrix.product_paths).map(path => path.path_id)) !== JSON.stringify(expectedPathIds)) errors.push('product paths are invalid');
  return errors;
}

export const sourceBackedCoverageMatrixVersion = COVERAGE_MATRIX_VERSION;

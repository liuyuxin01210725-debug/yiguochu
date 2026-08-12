import { buildSourceBackedPreviewManifest } from './source-backed-preview-manifest.mjs';
import { buildShelfCatalog } from './source-backed-shelf.mjs';

const LEDGER_VERSION = 'source-backed-formalization-v1-20260811-r2';

const CONTRACT_LABELS = Object.freeze({
  fixed_batch: '固定份数与食材用量',
  liquid_contract: '液体/水位合同',
  cooking_sequence: '来源步骤顺序',
  time_contract: '总时长',
  safety_endpoints: '食品安全终点',
  allergen_labels: '过敏原标签',
});

const REASON_LABELS = Object.freeze({
  appliance_scope: '器具/机型范围未闭合',
  cooker_boundary: '来源器具不能直接等同普通电饭煲',
  excluded_boundary: '熟饭、粥、汤饭、蒸制或另锅边界',
  missing_contract: '缺少正式执行合同字段',
  missing_safety: '缺少独立安全终点',
  nutrition_gate: '营养结构尚未满足主餐门槛',
  allergen_gate: '过敏原字段未闭合',
  source_archive: '来源档案尚未完成归档核验',
  status_not_ready: '来源状态尚未达到正式化阶段',
  validator_block: '源目录校验仍有结构阻塞',
});

const NEXT_ACTIONS = Object.freeze({
  appliance_scope: '补齐机型、模式或器具边界；不得跨器具外推。',
  cooker_boundary: '完成同一器具/模式的适配证据，或保留在原器具品类。',
  excluded_boundary: '拆分到熟饭、粥、汤饭、蒸制或另锅品类，不改写成生米一锅。',
  missing_contract: '回到同一来源补齐固定批量、液体、步骤和总时长。',
  missing_safety: '挂接同一食材状态对应的权威安全终点；不能用烹调时长替代。',
  nutrition_gate: '补齐可核验的碳水、蛋白质和膳食纤维角色。',
  allergen_gate: '核对来源食材并写入受控过敏原标签。',
  source_archive: '完成原始 PDF/页面归档和定位核验。',
  status_not_ready: '补做来源打开、身份核验和人工研究审查。',
  validator_block: '修复源目录结构错误后再重新跑晋升门禁。',
});

const FORMAL_PLANNER_BLOCKERS = Object.freeze([
  'not_in_formal_72',
  'taxonomy_mapping',
  'ratio_dsl',
  'kitchen_observed',
  'journey_coverage',
]);

const FORMAL_PLANNER_BLOCKER_LABELS = Object.freeze({
  not_in_formal_72: '尚未建立正式 Planner 菜谱条目',
  taxonomy_mapping: '核心食材尚未逐项绑定 taxonomy 身份与营养行',
  ratio_dsl: '尚未建立可编译的 Ratio DSL 与份数边界',
  kitchen_observed: '尚未完成厨房试做与人工复核',
  journey_coverage: '尚未完成真实旅程、过敏和替换回归',
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function methodStatusFor(shelf, recipeId) {
  return shelf.records.find(record => record.recipe_id === recipeId)?.research_method?.status || 'unknown';
}

function labelsForFields(fields) {
  return asArray(fields).map(field => CONTRACT_LABELS[field] || field);
}

function nextActionFor(reasonCodes, missingContracts) {
  const reasons = asArray(reasonCodes);
  if (missingContracts.length) return NEXT_ACTIONS.missing_contract;
  const first = reasons.find(reason => NEXT_ACTIONS[reason]);
  return first ? NEXT_ACTIONS[first] : '补做厨房验证、Planner 映射和真实旅程后再晋升。';
}

function sourceRefIds(recipe) {
  return asArray(recipe?.source_refs).map(source => source?.source_id).filter(Boolean);
}

const TRIAL_OBSERVATIONS = Object.freeze([
  'measured_ingredients',
  'measured_liquid_or_waterline',
  'cooker_or_vessel_and_program',
  'elapsed_time_and_rest',
  'texture_and_safety_endpoint',
  'planner_journey_regression',
]);

function provenanceSummary(values) {
  const list = asArray(values);
  const counts = { source: 0, source_hint: 0, estimated: 0, missing: 0 };
  for (const value of list) {
    const provenance = value?.provenance;
    if (provenance === 'source') counts.source += 1;
    else if (provenance === 'source_hint') counts.source_hint += 1;
    else if (provenance === 'estimated') counts.estimated += 1;
    else counts.missing += 1;
  }
  const present = list.length > 0;
  const status = !present
    ? 'missing'
    : counts.estimated > 0 || counts.missing > 0
      ? 'estimated_or_mixed'
      : counts.source_hint > 0
        ? 'source_hint'
        : 'source';
  return { status, item_count: list.length, ...counts };
}

function executionReadiness(method) {
  const ingredients = asArray(method?.ingredients);
  const steps = asArray(method?.steps);
  const quantities = provenanceSummary(ingredients.map(item => ({ provenance: item?.provenance })));
  const liquid = provenanceSummary(method?.liquid ? [method.liquid] : []);
  const stepsSummary = provenanceSummary(steps);
  const time = provenanceSummary(method?.time ? [method.time] : []);
  const fields = {
    quantities,
    liquid,
    steps: stepsSummary,
    time,
  };
  const complete = ingredients.length > 0
    && ingredients.every(item => Number.isFinite(item?.amount?.value))
    && Boolean(method?.liquid)
    && steps.length >= 3
    && Number.isFinite(method?.time?.total_minutes);
  const unblocked = !method?.blocked_reason;
  return {
    status: complete ? 'complete' : 'incomplete',
    unblocked,
    fields,
    blocked_reason: method?.blocked_reason || null,
  };
}

function queuePriority(methodStatus, readiness) {
  if (!readiness.unblocked) return 'blocked_safety';
  if (methodStatus === 'source_complete') return 'P0_source_contract';
  if (methodStatus === 'source_partial_with_draft' && readiness.status === 'complete') return 'P1_complete_research_card';
  if (methodStatus === 'draft_estimated') return 'P2_estimated_draft';
  return 'P3_identity_or_incomplete';
}

function formalizationQueue(methodStatus, readiness, nextAction) {
  const priority = queuePriority(methodStatus, readiness);
  const queueNextAction = !readiness.unblocked
    ? readiness.blocked_reason || '安全阻断，禁止家庭执行。'
    : priority === 'P0_source_contract'
      ? '按来源器具完成首次厨房试做，记录实际液体、时间、成品状态，再进入 Planner 映射。'
      : readiness.status === 'complete'
        ? '按研究执行卡完成首次厨房试做；来源缺字段仍不得被当成原文事实。'
        : nextAction;
  return {
    priority,
    status: 'pending',
    trial_packet: {
      status: 'pending',
      required_observations: [...TRIAL_OBSERVATIONS],
      evidence_fields: ['kitchen_observed', 'journey_coverage'],
    },
    next_action: queueNextAction,
  };
}

function buildRecord(recipe, previewRow, shelf) {
  const selected = previewRow?.preview_status === 'preview_ready';
  const methodStatus = methodStatusFor(shelf, recipe.recipe_id);
  const shelfRecord = shelf.records.find(record => record.recipe_id === recipe.recipe_id);
  const readiness = executionReadiness(shelfRecord?.research_method);
  const missingContracts = asArray(previewRow?.missing_contracts);
  const reasonCodes = asArray(previewRow?.reason_codes);
  const blockers = [
    ...labelsForFields(missingContracts),
    ...reasonCodes
      .filter(reason => !(reason === 'missing_contract' && missingContracts.length))
      .map(reason => REASON_LABELS[reason] || reason),
  ];
  const dedupedBlockers = [...new Set(blockers)];
  return {
    recipe_id: recipe.recipe_id,
    canonical_name: recipe.canonical_name,
    source_status: recipe.status,
    method_card_status: methodStatus,
    formalization_status: selected ? 'preview_candidate' : 'blocked',
    formal_planner_status: 'not_in_formal_72',
    formal_planner_blocker_codes: [...FORMAL_PLANNER_BLOCKERS],
    formal_planner_blocker_labels: FORMAL_PLANNER_BLOCKERS.map(code => FORMAL_PLANNER_BLOCKER_LABELS[code]),
    formal_planner_next_action: '逐项绑定 taxonomy/营养、编写 Ratio DSL、完成厨房观察和真实旅程后，才能进入正式 Planner。',
    source_ids: sourceRefIds(recipe),
    missing_contracts: missingContracts,
    missing_contract_labels: labelsForFields(missingContracts),
    blocker_codes: reasonCodes,
    blocker_labels: dedupedBlockers,
    next_action: nextActionFor(reasonCodes, missingContracts),
    preserves_cooker_boundary: recipe.cooker_adaptation?.status !== 'not_adapted',
    has_method_steps: Boolean(shelfRecord?.research_method?.steps?.length),
    execution_readiness: readiness,
    formalization_queue: formalizationQueue(methodStatus, readiness, nextActionFor(reasonCodes, missingContracts)),
  };
}

export function buildSourceBackedFormalizationLedger(catalog) {
  const recipes = asArray(catalog?.recipes);
  const preview = buildSourceBackedPreviewManifest(catalog);
  const previewById = new Map([
    ...asArray(preview.records).map(row => [row.recipe_id, row]),
    ...asArray(preview.blocked).map(row => [row.recipe_id, row]),
  ]);
  const shelf = buildShelfCatalog(catalog);
  const records = recipes.map(recipe => buildRecord(recipe, previewById.get(recipe.recipe_id), shelf));
  const counts = records.reduce((result, record) => {
    result[record.formalization_status] = (result[record.formalization_status] || 0) + 1;
    result.method_cards[record.method_card_status] = (result.method_cards[record.method_card_status] || 0) + 1;
    result.execution_complete += record.execution_readiness.status === 'complete' ? 1 : 0;
    result.execution_unblocked_complete += record.execution_readiness.status === 'complete' && record.execution_readiness.unblocked ? 1 : 0;
    result.execution_safety_blocked += record.execution_readiness.unblocked ? 0 : 1;
    result.queue_priority[record.formalization_queue.priority] = (result.queue_priority[record.formalization_queue.priority] || 0) + 1;
    return result;
  }, {
    preview_candidate: 0,
    blocked: 0,
    method_cards: {},
    execution_complete: 0,
    execution_unblocked_complete: 0,
    execution_safety_blocked: 0,
    queue_priority: {
      P0_source_contract: 0,
      P1_complete_research_card: 0,
      P2_estimated_draft: 0,
      P3_identity_or_incomplete: 0,
      blocked_safety: 0,
    },
  });
  return {
    schema_version: 1,
    ledger_version: LEDGER_VERSION,
    source_catalog_version: catalog?.catalog_version || null,
    scope: 'source-backed-to-formal-planner',
    policy: {
      formal_planner_requires_taxonomy_ratio_safety_nutrition_and_journeys: true,
      estimated_method_cards_are_not_formal_contracts: true,
      source_cooker_boundaries_must_be_preserved: true,
      kitchen_observed_required_before_production: true,
    },
    counts: {
      total: records.length,
      preview_candidate: counts.preview_candidate,
      blocked: counts.blocked,
      method_cards: counts.method_cards,
      execution_complete: counts.execution_complete,
      execution_unblocked_complete: counts.execution_unblocked_complete,
      execution_safety_blocked: counts.execution_safety_blocked,
      queue_priority: counts.queue_priority,
    },
    records,
  };
}

export function validateSourceBackedFormalizationLedger(ledger, catalog) {
  const errors = [];
  if (!ledger || typeof ledger !== 'object' || Array.isArray(ledger)) return ['ledger must be an object'];
  if (ledger.schema_version !== 1) errors.push('ledger.schema_version must be 1');
  if (ledger.scope !== 'source-backed-to-formal-planner') errors.push('ledger.scope is invalid');
  if (ledger.source_catalog_version !== catalog?.catalog_version) errors.push('ledger.source_catalog_version does not match source catalog');
  const sourceById = new Map(asArray(catalog?.recipes).map(recipe => [recipe.recipe_id, recipe]));
  const seen = new Set();
  for (const row of asArray(ledger.records)) {
    if (!row?.recipe_id) {
      errors.push('ledger row recipe_id is required');
      continue;
    }
    if (seen.has(row.recipe_id)) errors.push(`duplicate ledger recipe_id ${row.recipe_id}`);
    seen.add(row.recipe_id);
    const source = sourceById.get(row.recipe_id);
    if (!source) {
      errors.push(`${row.recipe_id} not found in source catalog`);
      continue;
    }
    if (row.canonical_name !== source.canonical_name) errors.push(`${row.recipe_id} canonical_name does not match source catalog`);
    if (!['preview_candidate', 'blocked'].includes(row.formalization_status)) errors.push(`${row.recipe_id} formalization_status is invalid`);
    if (row.formal_planner_status !== 'not_in_formal_72') errors.push(`${row.recipe_id} formal_planner_status is invalid`);
    if (JSON.stringify(row.formal_planner_blocker_codes) !== JSON.stringify(FORMAL_PLANNER_BLOCKERS)) errors.push(`${row.recipe_id} formal_planner_blocker_codes are incomplete`);
    if (JSON.stringify(row.formal_planner_blocker_labels) !== JSON.stringify(FORMAL_PLANNER_BLOCKERS.map(code => FORMAL_PLANNER_BLOCKER_LABELS[code]))) errors.push(`${row.recipe_id} formal_planner_blocker_labels are incomplete`);
    if (!Array.isArray(row.next_action) && typeof row.next_action !== 'string') errors.push(`${row.recipe_id} next_action is required`);
    if (!Array.isArray(row.source_ids)) errors.push(`${row.recipe_id} source_ids must be an array`);
    if (!row.execution_readiness || !['complete', 'incomplete'].includes(row.execution_readiness.status)) errors.push(`${row.recipe_id} execution_readiness is incomplete`);
    if (typeof row.execution_readiness.unblocked !== 'boolean') errors.push(`${row.recipe_id} execution_readiness.unblocked is required`);
    for (const field of ['quantities', 'liquid', 'steps', 'time']) {
      if (!row.execution_readiness.fields?.[field]?.status) errors.push(`${row.recipe_id} execution_readiness.fields.${field} is required`);
    }
    if (!['P0_source_contract', 'P1_complete_research_card', 'P2_estimated_draft', 'P3_identity_or_incomplete', 'blocked_safety'].includes(row.formalization_queue?.priority)) {
      errors.push(`${row.recipe_id} formalization_queue.priority is invalid`);
    }
    if (row.formalization_queue?.status !== 'pending') errors.push(`${row.recipe_id} formalization_queue.status must remain pending`);
    if (!Array.isArray(row.formalization_queue?.trial_packet?.required_observations) || row.formalization_queue.trial_packet.required_observations.length === 0) {
      errors.push(`${row.recipe_id} formalization_queue.trial_packet.required_observations is required`);
    }
  }
  const expected = buildSourceBackedFormalizationLedger(catalog);
  if (JSON.stringify(ledger) !== JSON.stringify(expected)) errors.push('ledger does not match deterministic formalization build');
  if (ledger.counts?.total !== sourceById.size) errors.push(`ledger counts.total must be ${sourceById.size}`);
  if (ledger.counts?.preview_candidate !== asArray(ledger.records).filter(row => row.formalization_status === 'preview_candidate').length) {
    errors.push('ledger counts.preview_candidate does not match records');
  }
  if (ledger.counts?.blocked !== asArray(ledger.records).filter(row => row.formalization_status === 'blocked').length) {
    errors.push('ledger counts.blocked does not match records');
  }
  if (ledger.counts?.execution_complete !== asArray(ledger.records).filter(row => row.execution_readiness?.status === 'complete').length) {
    errors.push('ledger counts.execution_complete does not match records');
  }
  if (ledger.counts?.execution_unblocked_complete !== asArray(ledger.records).filter(row => row.execution_readiness?.status === 'complete' && row.execution_readiness?.unblocked).length) {
    errors.push('ledger counts.execution_unblocked_complete does not match records');
  }
  if (ledger.counts?.execution_safety_blocked !== asArray(ledger.records).filter(row => row.execution_readiness?.unblocked === false).length) {
    errors.push('ledger counts.execution_safety_blocked does not match records');
  }
  return errors;
}

export const sourceBackedFormalizationLedgerVersion = LEDGER_VERSION;

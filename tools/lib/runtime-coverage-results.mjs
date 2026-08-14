import { decideRuntimeAuthority, normalizeRuntimeAuthority } from './runtime-authority.mjs';

const RUNTIME_COVERAGE_RESULTS_VERSION = 'runtime-coverage-results-v1-20260814-c32';

const asArray = value => Array.isArray(value) ? value : [];
const clone = value => typeof structuredClone === 'function'
  ? structuredClone(value)
  : JSON.parse(JSON.stringify(value));

function authorityModeLabel(mode) {
  return mode === 'catalog-enforced' ? 'catalog_enforced' : 'shadow_preview';
}

function catalogHealth(runtimeCatalog) {
  if (!runtimeCatalog || typeof runtimeCatalog !== 'object' || Array.isArray(runtimeCatalog)) return null;
  const counts = runtimeCatalog.counts || {};
  return {
    status: 'ok',
    entries: Number(counts.total) || asArray(runtimeCatalog.entries).length,
    plannerRuntimeEligible: Number(counts.planner_runtime_eligible) || 0,
    productionApproved: Number(counts.production_approved) || 0,
  };
}

function authorityStatus(authority, runtimeCatalog) {
  const normalized = normalizeRuntimeAuthority(authority);
  const mode = authorityModeLabel(normalized.mode);
  if (normalized.mode === 'catalog-enforced'
      && runtimeCatalog
      && typeof runtimeCatalog.runtime_catalog_version === 'string'
      && normalized.catalog_version
      && runtimeCatalog.runtime_catalog_version !== normalized.catalog_version) {
    return {
      mode: normalized.mode,
      authority_mode: mode,
      catalog_version: normalized.catalog_version,
      authorized: false,
      code: 'runtime_catalog_version_mismatch',
      eligible: 0,
    };
  }
  const decision = decideRuntimeAuthority(normalized, catalogHealth(runtimeCatalog));
  return {
    mode: normalized.mode,
    authority_mode: mode,
    catalog_version: normalized.catalog_version,
    authorized: decision.authorized,
    code: decision.code,
    eligible: decision.eligible,
  };
}

function expectedCandidateRefs(scenario) {
  const refs = scenario?.expected?.candidate_refs || {};
  return {
    recipe_ids: asArray(refs.recipe_ids).filter(Boolean),
    template_ids: asArray(refs.template_ids).filter(Boolean),
    variant_ids: asArray(refs.variant_ids).filter(Boolean),
  };
}

function firstCandidate(candidateRefs) {
  if (candidateRefs.recipe_ids.length) return { recipe_id: candidateRefs.recipe_ids[0] };
  if (candidateRefs.template_ids.length) return { template_id: candidateRefs.template_ids[0] };
  if (candidateRefs.variant_ids.length) return { variant_id: candidateRefs.variant_ids[0] };
  return null;
}

function contractProjection(scenario, field) {
  const value = scenario?.[field];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { status: 'not_observed', value: null, source: null };
  }
  return clone(value);
}

function scenarioIngredients(scenario) {
  const expected = scenario?.expected || {};
  const requested = asArray(scenario?.request?.pantry);
  const used = asArray(expected.used_raw);
  const unused = asArray(expected.unused_raw);
  const reasonCodes = asArray(expected.reason_codes);
  return {
    requested,
    used,
    unused,
    unused_reasons: reasonCodes,
    status: 'not_observed',
    source: 'scenario_expectation',
    observed_used: null,
    observed_unused: null,
    observed_reasons: null,
  };
}

function scenarioResult(scenario, status) {
  const candidateRefs = expectedCandidateRefs(scenario);
  const first = firstCandidate(candidateRefs);
  const ingredients = scenarioIngredients(scenario);
  const quantity = contractProjection(scenario, 'quantity');
  const liquid = contractProjection(scenario, 'liquid');
  const safety = contractProjection(scenario, 'safety');
  const catalogBlocked = status.code !== 'shadow_preview_only' && !status.authorized;
  const blockerCodes = catalogBlocked
    ? [...new Set([status.code, ...(status.code === 'runtime_catalog_empty' ? ['no_candidate'] : [])])]
    : ['not_observed'];
  const resultStatus = catalogBlocked ? 'blocked' : 'not_observed';
  const authorityStatusRow = clone(status);
  return {
    scenario_id: scenario.scenario_id,
    source_kind: scenario.source_kind,
    source_id: scenario.source_id,
    request: clone(scenario.request || {}),
    expected: clone(scenario.expected || {}),
    joins: clone(scenario.joins || {}),
    authority_mode: status.authority_mode,
    authority_status: authorityStatusRow,
    observed: false,
    result_status: resultStatus,
    runtime_response: null,
    planner_state: null,
    candidates: {
      first,
      all: candidateRefs,
    },
    // Explicit aliases keep the coverage report readable to both the audit
    // renderer and callers that do not know the nested candidates contract.
    first_candidate: first,
    all_candidates: clone(candidateRefs),
    ingredients,
    used_ingredients: clone(ingredients.used),
    unused_ingredients: clone(ingredients.unused),
    reason_codes: clone(ingredients.unused_reasons),
    quantity,
    liquid,
    safety,
    contracts: {
      quantity: clone(quantity),
      liquid: clone(liquid),
      safety: clone(safety),
    },
    blocker_codes: blockerCodes,
    evidence_refs: [],
  };
}

/**
 * Build a deterministic, non-observed coverage report.
 *
 * The matrix is a registry of expectations. This projection intentionally
 * never executes Planner/Worker and can therefore only emit `dry_run` or a
 * structured catalog block; it must never manufacture `passed` evidence.
 */
export function buildRuntimeCoverageResults({ matrix, authority = { mode: 'shadow' }, runtimeCatalog } = {}) {
  const status = authorityStatus(authority, runtimeCatalog);
  const scenarios = asArray(matrix?.scenarios).map(scenario => scenarioResult(scenario, status));
  const blocked = scenarios.filter(row => row.result_status === 'blocked').length;
  const notObserved = scenarios.filter(row => row.observed === false).length;
  const mode = status.authority_mode;
  return {
    schema_version: 1,
    runtime_coverage_results_version: RUNTIME_COVERAGE_RESULTS_VERSION,
    scope: 'runtime-coverage-results',
    policy: {
      registry_is_not_execution_evidence: true,
      shadow_and_catalog_enforced_are_separate: true,
      unobserved_results_cannot_authorize_production: true,
      actual_browser_or_worker_observation_required: true,
      dry_run_never_reports_passed: true,
      catalog_enforced_empty_is_structured_block: true,
      candidate_projection_preserves_first_and_all: true,
      contract_projection_preserves_quantity_liquid_safety: true,
    },
    source_matrix_version: matrix?.runtime_coverage_matrix_version ?? null,
    runner: {
      mode: 'deterministic_dry_run',
      planner_invoked: false,
      observation_source: null,
      note: 'No Planner/Worker call was made; this projection cannot establish execution evidence.',
    },
    authority_mode: mode,
    authority_status: clone(status),
    execution: {
      mode,
      status: mode === 'shadow_preview' ? 'dry_run' : (status.authorized ? 'dry_run' : 'blocked'),
      code: mode === 'shadow_preview' ? 'shadow_preview_only' : status.code,
      observed: false,
    },
    authority_modes: ['shadow_preview', 'catalog_enforced'],
    counts: {
      total: scenarios.length,
      observed: 0,
      not_observed: notObserved,
      dry_run: scenarios.filter(row => row.result_status === 'not_observed').length,
      blocked,
      no_candidate: scenarios.filter(row => row.blocker_codes.includes('no_candidate')).length,
      passed: 0,
      failed: 0,
    },
    scenarios,
  };
}

/**
 * Runner entry point used by the CLI and tests. It is intentionally a dry run
 * until a real browser/Worker observation adapter is supplied; returning this
 * projection is safer than turning a registry into a fabricated pass.
 */
export function runRuntimeCoverage(options = {}) {
  return buildRuntimeCoverageResults(options);
}

export function validateRuntimeCoverageResults(results, {
  matrix,
  authority = { mode: 'shadow' },
  runtimeCatalog,
} = {}) {
  const errors = [];
  if (!results || typeof results !== 'object' || Array.isArray(results)) return ['runtime coverage results must be an object'];
  if (results.schema_version !== 1) errors.push('runtime coverage results schema_version must be 1');
  if (results.runtime_coverage_results_version !== RUNTIME_COVERAGE_RESULTS_VERSION) errors.push('runtime coverage results version is invalid');
  if (results.scope !== 'runtime-coverage-results') errors.push('runtime coverage results scope is invalid');
  for (const row of asArray(results.scenarios)) {
    if (row?.observed !== false) errors.push(`${row?.scenario_id} observed must remain false`);
    if (row?.result_status === 'passed') errors.push(`${row?.scenario_id} cannot claim passed without observation`);
    if (row?.authority_mode === 'catalog_enforced' && row?.authority_status?.code === 'runtime_catalog_empty') {
      if (row.result_status !== 'blocked') errors.push(`${row?.scenario_id} empty catalog must be blocked`);
      if (!asArray(row.blocker_codes).includes('no_candidate')) errors.push(`${row?.scenario_id} empty catalog must include no_candidate`);
    }
  }
  const expected = buildRuntimeCoverageResults({ matrix, authority, runtimeCatalog });
  if (JSON.stringify(results) !== JSON.stringify(expected)) errors.push('runtime coverage results do not match deterministic build');
  return [...new Set(errors)];
}

export const runtimeCoverageResultsVersion = RUNTIME_COVERAGE_RESULTS_VERSION;

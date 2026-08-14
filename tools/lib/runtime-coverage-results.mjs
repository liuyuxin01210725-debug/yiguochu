const RUNTIME_COVERAGE_RESULTS_VERSION = 'runtime-coverage-results-v1-20260814-c21';

const asArray = value => Array.isArray(value) ? value : [];

export function buildRuntimeCoverageResults({ matrix, authority = { mode: 'shadow' } } = {}) {
  const mode = authority?.mode === 'catalog-enforced' ? 'catalog_enforced' : 'shadow_preview';
  const scenarios = asArray(matrix?.scenarios).map(scenario => ({
    scenario_id: scenario.scenario_id,
    source_kind: scenario.source_kind,
    source_id: scenario.source_id,
    authority_mode: mode,
    observed: false,
    result_status: 'not_observed',
    runtime_response: null,
    planner_state: null,
    blocker_codes: ['not_observed'],
    evidence_refs: [],
  }));
  return {
    schema_version: 1,
    runtime_coverage_results_version: RUNTIME_COVERAGE_RESULTS_VERSION,
    scope: 'runtime-coverage-results',
    policy: {
      registry_is_not_execution_evidence: true,
      shadow_and_catalog_enforced_are_separate: true,
      unobserved_results_cannot_authorize_production: true,
      actual_browser_or_worker_observation_required: true,
    },
    source_matrix_version: matrix?.runtime_coverage_matrix_version ?? null,
    authority_modes: ['shadow_preview', 'catalog_enforced'],
    counts: {
      total: scenarios.length,
      observed: scenarios.filter(row => row.observed).length,
      not_observed: scenarios.filter(row => !row.observed).length,
      passed: scenarios.filter(row => row.result_status === 'passed').length,
      failed: scenarios.filter(row => row.result_status === 'failed').length,
    },
    scenarios,
  };
}

export function validateRuntimeCoverageResults(results, { matrix, authority = { mode: 'shadow' } } = {}) {
  const errors = [];
  if (!results || typeof results !== 'object' || Array.isArray(results)) return ['runtime coverage results must be an object'];
  if (results.schema_version !== 1) errors.push('runtime coverage results schema_version must be 1');
  if (results.runtime_coverage_results_version !== RUNTIME_COVERAGE_RESULTS_VERSION) errors.push('runtime coverage results version is invalid');
  if (results.scope !== 'runtime-coverage-results') errors.push('runtime coverage results scope is invalid');
  const expected = buildRuntimeCoverageResults({ matrix, authority });
  if (JSON.stringify(results) !== JSON.stringify(expected)) errors.push('runtime coverage results do not match deterministic build');
  return errors;
}

export const runtimeCoverageResultsVersion = RUNTIME_COVERAGE_RESULTS_VERSION;

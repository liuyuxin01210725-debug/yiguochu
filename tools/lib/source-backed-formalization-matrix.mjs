import {
  buildSourceBackedCoverageMatrix,
} from './source-backed-coverage-matrix.mjs';

const FORMALIZATION_MATRIX_VERSION = 'source-backed-formalization-matrix-v1-20260813-c3';

export function buildSourceBackedFormalizationMatrix(inputs = {}) {
  const coverage = buildSourceBackedCoverageMatrix(inputs);
  return {
    schema_version: 1,
    formalization_matrix_version: FORMALIZATION_MATRIX_VERSION,
    source_catalog_version: coverage.source_catalog_version,
    execution_library_version: coverage.execution_library_version,
    formalization_ledger_version: coverage.formalization_ledger_version,
    scope: 'source-backed-formalization-matrix',
    policy: {
      source_cards_are_research_assets: true,
      execution_complete_is_not_production: true,
      formal_library_is_not_source_card_promotion: true,
      kitchen_observed_and_journey_coverage_are_required: true,
      safety_blocked_cards_are_never_kitchen_executable: true,
      deterministic_projection_only: true,
      structured_journey_recipe_ids_only: true,
      missing_joins_fail_closed: true,
    },
    dimensions: coverage.dimensions,
    counts: coverage.counts,
    aggregates: coverage.aggregates,
    product_paths: coverage.product_paths,
    records: coverage.records,
  };
}

export function validateSourceBackedFormalizationMatrix(matrix, inputs = {}) {
  const errors = [];
  if (!matrix || typeof matrix !== 'object' || Array.isArray(matrix)) return ['formalization matrix must be an object'];
  if (matrix.schema_version !== 1) errors.push('formalization matrix schema_version must be 1');
  if (matrix.formalization_matrix_version !== FORMALIZATION_MATRIX_VERSION) errors.push('formalization matrix version is invalid');
  if (matrix.scope !== 'source-backed-formalization-matrix') errors.push('formalization matrix scope is invalid');
  if (matrix.source_catalog_version !== inputs.sourceCatalog?.catalog_version) errors.push('formalization matrix source_catalog_version is stale');
  const expected = buildSourceBackedFormalizationMatrix(inputs);
  if (JSON.stringify(matrix) !== JSON.stringify(expected)) errors.push('formalization matrix does not match deterministic build');
  return errors;
}

export const sourceBackedFormalizationMatrixVersion = FORMALIZATION_MATRIX_VERSION;

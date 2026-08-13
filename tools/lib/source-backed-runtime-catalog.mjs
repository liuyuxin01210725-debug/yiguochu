const RUNTIME_CATALOG_VERSION = 'source-backed-runtime-v1-20260813-m1';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function sourceById(catalog) {
  return new Map(asArray(catalog?.recipes).map(recipe => [recipe.recipe_id, recipe]));
}

function executionById(library) {
  return new Map(asArray(library?.entries).map(entry => [entry.recipe_id, entry]));
}

function formalizationById(ledger) {
  return new Map(asArray(ledger?.records).map(record => [record.recipe_id, record]));
}

function releaseState(formalization) {
  if (formalization?.formalization_status === 'preview_candidate') return 'preview_only';
  if (formalization?.execution_readiness?.unblocked === false) return 'blocked';
  return 'research_only';
}

function projectEntry(recipe, execution, formalization) {
  const state = releaseState(formalization);
  return {
    recipe_id: recipe.recipe_id,
    canonical_name: recipe.canonical_name,
    source_status: recipe.status,
    execution_ref: execution?.recipe_id || null,
    formalization_ref: formalization?.recipe_id || null,
    method_card_status: execution?.method_card_status || null,
    formalization_status: formalization?.formalization_status || null,
    formal_planner_status: formalization?.formal_planner_status || 'not_in_formal_72',
    release_state: state,
    planner_runtime_eligible: false,
    preview_eligible: state === 'preview_only',
    kitchen_observed: false,
    source_blocker_codes: asArray(formalization?.blocker_codes),
    formal_blocker_codes: asArray(formalization?.formal_planner_blocker_codes),
    next_action: formalization?.next_action || formalization?.formal_planner_next_action || null,
  };
}

export function buildSourceBackedRuntimeCatalog({ sourceCatalog, executionLibrary, formalizationLedger } = {}) {
  const recipes = asArray(sourceCatalog?.recipes);
  const execution = executionById(executionLibrary);
  const formalization = formalizationById(formalizationLedger);
  const entries = recipes.map(recipe => projectEntry(recipe, execution.get(recipe.recipe_id), formalization.get(recipe.recipe_id)));
  const counts = entries.reduce((result, entry) => {
    result.total += 1;
    result[entry.release_state] += 1;
    if (entry.kitchen_observed) result.kitchen_observed += 1;
    if (entry.formal_planner_status === 'production_approved') result.formal_active += 1;
    return result;
  }, { total: 0, preview_only: 0, research_only: 0, blocked: 0, formal_active: 0, kitchen_observed: 0 });
  return {
    schema_version: 1,
    runtime_catalog_version: RUNTIME_CATALOG_VERSION,
    source_catalog_version: sourceCatalog?.catalog_version || null,
    execution_library_version: executionLibrary?.execution_library_version || null,
    formalization_ledger_version: formalizationLedger?.ledger_version || null,
    scope: 'source-backed-runtime-catalog',
    policy: {
      source_cards_are_not_production_recipes: true,
      planner_runtime_eligibility_requires_formal_and_kitchen_gates: true,
      preview_is_not_production: true,
      deterministic_projection_only: true,
    },
    counts,
    entries,
  };
}

export function validateSourceBackedRuntimeCatalog(runtime, { sourceCatalog, executionLibrary, formalizationLedger } = {}) {
  const errors = [];
  if (!runtime || typeof runtime !== 'object' || Array.isArray(runtime)) return ['runtime catalog must be an object'];
  if (runtime.schema_version !== 1) errors.push('runtime catalog schema_version must be 1');
  if (runtime.scope !== 'source-backed-runtime-catalog') errors.push('runtime catalog scope is invalid');
  if (runtime.source_catalog_version !== sourceCatalog?.catalog_version) errors.push('runtime catalog source_catalog_version is stale');
  if (runtime.execution_library_version !== executionLibrary?.execution_library_version) errors.push('runtime catalog execution_library_version is stale');
  if (runtime.formalization_ledger_version !== formalizationLedger?.ledger_version) errors.push('runtime catalog formalization_ledger_version is stale');
  const source = sourceById(sourceCatalog);
  const execution = executionById(executionLibrary);
  const formalization = formalizationById(formalizationLedger);
  const seen = new Set();
  for (const entry of asArray(runtime.entries)) {
    if (!entry?.recipe_id) { errors.push('runtime entry recipe_id is required'); continue; }
    if (seen.has(entry.recipe_id)) errors.push(`duplicate runtime entry ${entry.recipe_id}`);
    seen.add(entry.recipe_id);
    if (!source.has(entry.recipe_id)) errors.push(`${entry.recipe_id} is not in source catalog`);
    if (entry.execution_ref !== entry.recipe_id || !execution.has(entry.execution_ref)) errors.push(`${entry.recipe_id} execution_ref does not match execution library`);
    if (entry.formalization_ref !== entry.recipe_id || !formalization.has(entry.formalization_ref)) errors.push(`${entry.recipe_id} formalization_ref does not match formalization ledger`);
    if (!['preview_only', 'research_only', 'blocked'].includes(entry.release_state)) errors.push(`${entry.recipe_id} release_state is invalid`);
    if (entry.planner_runtime_eligible !== false) errors.push(`${entry.recipe_id} must not be planner runtime eligible`);
    if (entry.kitchen_observed !== false) errors.push(`${entry.recipe_id} cannot claim kitchen observation`);
  }
  if (seen.size !== source.size) errors.push('runtime entries must cover every source recipe');
  const expected = buildSourceBackedRuntimeCatalog({ sourceCatalog, executionLibrary, formalizationLedger });
  if (JSON.stringify(runtime) !== JSON.stringify(expected)) errors.push('runtime catalog does not match deterministic build');
  return errors;
}

export const sourceBackedRuntimeCatalogVersion = RUNTIME_CATALOG_VERSION;

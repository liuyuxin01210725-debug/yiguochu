import { buildShelfCatalog } from './source-backed-shelf.mjs';
import { buildSourceBackedFormalizationLedger } from './source-backed-formalization-ledger.mjs';

const EXECUTION_LIBRARY_VERSION = 'source-backed-execution-v1-20260811-r1';

const METHOD_STATUSES = Object.freeze([
  'source_complete',
  'source_partial_with_draft',
  'draft_estimated',
  'identity_only_draft',
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function sourceContract(recipe) {
  return {
    fixed_batch: clone(recipe?.fixed_batch || null),
    liquid_contract: clone(recipe?.liquid_contract || null),
    cooking_sequence: clone(recipe?.cooking_sequence || []),
    time_contract: clone(recipe?.time_contract || null),
    safety_endpoints: clone(recipe?.safety_endpoints || []),
    allergen_labels: clone(recipe?.allergen_labels || []),
  };
}

function executionCard(method) {
  const card = {
    schema_version: 'source-execution-card.v1',
    status: method?.status || 'identity_only_draft',
    method_type: method?.method_type || 'one_pot_research',
    research_profile: clone(method?.research_profile || null),
    servings: clone(method?.servings || null),
    servings_source_hint: clone(method?.servings_source_hint || null),
    ingredients: clone(asArray(method?.ingredients)),
    liquid: clone(method?.liquid || null),
    time: clone(method?.time || null),
    steps: clone(asArray(method?.steps)),
    safety_note: method?.safety_note || '',
    assumptions: clone(asArray(method?.assumptions)),
    missing_source_fields: clone(asArray(method?.missing_source_fields)),
    source_facts: clone(asArray(method?.source_facts)),
    source_quantity_hints: clone(asArray(method?.source_quantity_hints)),
    source_process_hints: clone(asArray(method?.source_process_hints)),
    source_time_hints: clone(asArray(method?.source_time_hints)),
  };
  if (method?.blocked_reason) card.blocked_reason = method.blocked_reason;
  return card;
}

function buildEntry(recipe, shelfRecord, ledgerRecord) {
  const methodStatus = shelfRecord?.research_method?.status || 'identity_only_draft';
  return {
    recipe_id: recipe.recipe_id,
    canonical_name: recipe.canonical_name,
    aliases: clone(asArray(recipe.aliases)),
    source_status: recipe.status,
    shelf: shelfRecord?.shelf || 'C',
    shelf_label: shelfRecord?.shelf_label || 'C · 研究起步架（来源字段待补）',
    method_card_status: methodStatus,
    run_scope: methodStatus === 'source_complete' ? 'source_bounded_preview' : 'research_only',
    formalization_status: ledgerRecord?.formalization_status || 'blocked',
    formal_planner_status: ledgerRecord?.formal_planner_status || 'not_in_formal_72',
    formal_blocker_codes: clone(ledgerRecord?.formal_planner_blocker_codes || []),
    formal_blocker_labels: clone(ledgerRecord?.formal_planner_blocker_labels || []),
    source_blocker_codes: clone(asArray(ledgerRecord?.blocker_codes)),
    source_blocker_labels: clone(asArray(ledgerRecord?.blocker_labels)),
    next_action: ledgerRecord?.next_action || '补做来源核验、正式 Planner 映射与厨房观察。',
    cooker_boundary_preserved: ledgerRecord?.preserves_cooker_boundary === true,
    source_ids: clone(asArray(ledgerRecord?.source_ids)),
    source_contract: sourceContract(recipe),
    execution_card: executionCard(shelfRecord?.research_method),
  };
}

export function buildSourceBackedExecutionLibrary(catalog) {
  const recipes = asArray(catalog?.recipes);
  const shelf = buildShelfCatalog(catalog);
  const ledger = buildSourceBackedFormalizationLedger(catalog);
  const shelfById = new Map(shelf.records.map(record => [record.recipe_id, record]));
  const ledgerById = new Map(ledger.records.map(record => [record.recipe_id, record]));
  const entries = recipes.map(recipe => buildEntry(recipe, shelfById.get(recipe.recipe_id), ledgerById.get(recipe.recipe_id)));
  const counts = entries.reduce((result, entry) => {
    result.total += 1;
    result[entry.method_card_status] = (result[entry.method_card_status] || 0) + 1;
    result.run_scope[entry.run_scope] = (result.run_scope[entry.run_scope] || 0) + 1;
    return result;
  }, {
    total: 0,
    source_complete: 0,
    source_partial_with_draft: 0,
    draft_estimated: 0,
    identity_only_draft: 0,
    run_scope: { source_bounded_preview: 0, research_only: 0 },
  });
  return {
    schema_version: 1,
    execution_library_version: EXECUTION_LIBRARY_VERSION,
    source_catalog_version: catalog?.catalog_version || null,
    scope: 'source-backed-execution-cards',
    policy: {
      source_complete_is_preview_only_until_kitchen_observed: true,
      estimated_values_are_marked_per_field: true,
      source_cooker_boundaries_are_preserved: true,
      formal_planner_requires_taxonomy_ratio_safety_nutrition_and_journeys: true,
    },
    counts,
    entries,
  };
}

export function validateSourceBackedExecutionLibrary(library, catalog) {
  const errors = [];
  if (!library || typeof library !== 'object' || Array.isArray(library)) return ['execution library must be an object'];
  if (library.schema_version !== 1) errors.push('execution library schema_version must be 1');
  if (library.scope !== 'source-backed-execution-cards') errors.push('execution library scope is invalid');
  if (library.source_catalog_version !== catalog?.catalog_version) errors.push('execution library source_catalog_version does not match source catalog');
  const sourceById = new Map(asArray(catalog?.recipes).map(recipe => [recipe.recipe_id, recipe]));
  const seen = new Set();
  for (const entry of asArray(library.entries)) {
    if (!entry?.recipe_id) {
      errors.push('execution entry recipe_id is required');
      continue;
    }
    if (seen.has(entry.recipe_id)) errors.push(`duplicate execution entry ${entry.recipe_id}`);
    seen.add(entry.recipe_id);
    const source = sourceById.get(entry.recipe_id);
    if (!source) {
      errors.push(`${entry.recipe_id} is not in source catalog`);
      continue;
    }
    if (entry.canonical_name !== source.canonical_name) errors.push(`${entry.recipe_id} canonical_name does not match source catalog`);
    if (!METHOD_STATUSES.includes(entry.method_card_status)) errors.push(`${entry.recipe_id} method_card_status is invalid`);
    if (!['source_bounded_preview', 'research_only'].includes(entry.run_scope)) errors.push(`${entry.recipe_id} run_scope is invalid`);
    if (!Array.isArray(entry.execution_card?.ingredients) || entry.execution_card.ingredients.length === 0) errors.push(`${entry.recipe_id} execution ingredients are missing`);
    if (!Array.isArray(entry.execution_card?.steps) || entry.execution_card.steps.length === 0) errors.push(`${entry.recipe_id} execution steps are missing`);
    if (entry.execution_card?.steps?.some(step => !['source', 'estimated', 'source_hint'].includes(step?.provenance))) errors.push(`${entry.recipe_id} step provenance is invalid`);
    if (!Array.isArray(entry.formal_blocker_codes) || !entry.formal_blocker_codes.includes('not_in_formal_72')) errors.push(`${entry.recipe_id} formal blocker ledger is missing`);
  }
  if (seen.size !== sourceById.size) errors.push('entries must cover every source recipe');
  const expected = buildSourceBackedExecutionLibrary(catalog);
  if (JSON.stringify(library) !== JSON.stringify(expected)) errors.push('execution library does not match deterministic build');
  if (library.counts?.total !== sourceById.size) errors.push(`execution library counts.total must be ${sourceById.size}`);
  return errors;
}

export const sourceBackedExecutionLibraryVersion = EXECUTION_LIBRARY_VERSION;

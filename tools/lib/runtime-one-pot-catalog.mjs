import crypto from 'node:crypto';

const RUNTIME_CATALOG_VERSION = 'runtime-one-pot-catalog-v1-20260813-correction';
const TRUSTED_STATUSES = new Set(['approved', 'auto_approved']);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function mapById(value, key = 'recipe_id') {
  return new Map(asArray(value).map(item => [item?.[key] ?? item?.id, item]));
}

function stableHash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function sourceSummary(sourceCatalog, recipeId) {
  const source = mapById(sourceCatalog?.recipes).get(recipeId);
  if (!source) return null;
  return {
    source_recipe_id: source.recipe_id,
    canonical_name: source.canonical_name,
    status: source.status,
    source_refs: asArray(source.source_refs).map(ref => ({
      id: ref.id ?? null,
      url: ref.url ?? null,
      title: ref.title ?? null,
      usage: ref.usage ?? null,
      evidence_tier: ref.evidence_tier ?? null,
    })),
  };
}

function kitchenState(kitchenLedger, recipeId) {
  const observations = asArray(kitchenLedger?.observations).filter(item => item?.recipe?.recipe_id === recipeId);
  const observed = observations.some(item => item?.disposition?.status === 'kitchen_observed');
  return { observed, observation_ids: observations.map(item => item.observation_id).filter(Boolean) };
}

function projectRecipe(recipe, inputs) {
  const recipeId = recipe.id;
  const runtime = mapById(inputs.recipeRuntime?.entries).get(recipeId) ?? null;
  const actionProfile = mapById(inputs.actionProfiles?.profiles, 'profile_id').get(recipeId) ?? null;
  const source = sourceSummary(inputs.sourceCatalog, recipeId);
  const formal = mapById(inputs.formalizationLedger?.records).get(recipeId) ?? null;
  const execution = mapById(inputs.executionLibrary?.entries).get(recipeId) ?? null;
  const kitchen = kitchenState(inputs.kitchenLedger, recipeId);
  const plannerRuntimeEligible = TRUSTED_STATUSES.has(recipe.status);
  return {
    recipe_id: recipeId,
    canonical_name: recipe.name,
    family_id: recipe.family_id,
    status: recipe.status,
    planner_runtime_eligible: plannerRuntimeEligible,
    production_approved: false,
    kitchen_observed: kitchen.observed,
    runtime_contract: runtime,
    action_profile: actionProfile,
    ratio_contract: {
      rule_ids: asArray(recipe.ratio_rules),
      catalog_version: inputs.ratios?.ratio_catalog_version ?? null,
    },
    taxonomy_contract: {
      catalog_version: inputs.taxonomy?.taxonomy_version ?? null,
      core_ingredients: asArray(recipe.core_ingredients),
    },
    source_summary: source,
    execution_summary: execution ? {
      recipe_id: execution.recipe_id,
      method_card_status: execution.method_card_status ?? null,
      blocked_reason: execution.execution_card?.blocked_reason ?? null,
    } : null,
    formalization_summary: formal ? {
      recipe_id: formal.recipe_id,
      formalization_status: formal.formalization_status ?? null,
      formal_planner_status: formal.formal_planner_status ?? null,
      blocker_codes: asArray(formal.formal_planner_blocker_codes),
    } : null,
    kitchen_observation_ids: kitchen.observation_ids,
    contract_hashes: {
      recipe_library: stableHash(recipe),
      recipe_runtime: stableHash(runtime),
      action_profile: stableHash(actionProfile),
      ratio_rules: stableHash(inputs.ratios),
      taxonomy: stableHash(inputs.taxonomy),
      source_summary: stableHash(source),
      safety: stableHash(recipe.safety_rules),
    },
  };
}

export function buildRuntimeOnePotCatalog(inputs = {}) {
  const recipes = asArray(inputs.recipeLibrary?.recipes);
  const entries = recipes.filter(recipe => TRUSTED_STATUSES.has(recipe?.status)).map(recipe => projectRecipe(recipe, inputs));
  const productionApproved = entries.filter(entry => entry.production_approved).length;
  const kitchenObserved = entries.filter(entry => entry.kitchen_observed).length;
  return {
    schema_version: 1,
    runtime_catalog_version: RUNTIME_CATALOG_VERSION,
    scope: 'runtime-one-pot-catalog',
    policy: {
      only_trusted_formal_recipes: true,
      source_cards_are_not_runtime_entries: true,
      research_assets_have_no_planner_authority: true,
      kitchen_observed_does_not_grant_production_approval: true,
      production_approval_requires_independent_gate: true,
    },
    source_versions: {
      recipe_library: inputs.recipeLibrary?.schema_version ?? null,
      recipe_runtime: inputs.recipeRuntime?.recipe_runtime_catalog_version ?? null,
      action_profiles: inputs.actionProfiles?.action_profile_catalog_version ?? null,
      ratios: inputs.ratios?.ratio_catalog_version ?? null,
      taxonomy: inputs.taxonomy?.taxonomy_version ?? null,
      source_catalog: inputs.sourceCatalog?.catalog_version ?? null,
      execution_library: inputs.executionLibrary?.execution_library_version ?? null,
      formalization_ledger: inputs.formalizationLedger?.ledger_version ?? null,
    },
    counts: {
      total: entries.length,
      planner_runtime_eligible: entries.filter(entry => entry.planner_runtime_eligible).length,
      production_approved: productionApproved,
      kitchen_observed: kitchenObserved,
    },
    kitchen_observation_summary: {
      observations: asArray(inputs.kitchenLedger?.observations).length,
      observed_recipe_ids: entries.filter(entry => entry.kitchen_observed).map(entry => entry.recipe_id),
    },
    entries,
  };
}

export function validateRuntimeOnePotCatalog(catalog, inputs = {}) {
  const errors = [];
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) return ['runtime catalog must be an object'];
  if (catalog.schema_version !== 1) errors.push('runtime catalog schema_version must be 1');
  if (catalog.scope !== 'runtime-one-pot-catalog') errors.push('runtime catalog scope is invalid');
  const expected = buildRuntimeOnePotCatalog(inputs);
  if (catalog.entries?.length !== expected.entries.length) errors.push('runtime catalog must contain exactly the trusted formal recipes');
  const expectedById = new Map(expected.entries.map(entry => [entry.recipe_id, entry]));
  const seen = new Set();
  for (const entry of asArray(catalog.entries)) {
    if (!entry?.recipe_id) { errors.push('runtime entry recipe_id is required'); continue; }
    if (seen.has(entry.recipe_id)) errors.push(`duplicate runtime entry ${entry.recipe_id}`);
    seen.add(entry.recipe_id);
    const expectedEntry = expectedById.get(entry.recipe_id);
    if (!expectedEntry) { errors.push(`${entry.recipe_id} is not a trusted formal recipe`); continue; }
    if (JSON.stringify(entry) !== JSON.stringify(expectedEntry)) errors.push(`${entry.recipe_id} does not match deterministic runtime contract or hash`);
    if (entry.planner_runtime_eligible !== true) errors.push(`${entry.recipe_id} must be planner runtime eligible`);
    if (entry.production_approved !== false) errors.push(`${entry.recipe_id} cannot claim production approval`);
  }
  if (JSON.stringify(catalog) !== JSON.stringify(expected)) errors.push('runtime catalog does not match deterministic build');
  return [...new Set(errors)];
}

export const runtimeOnePotCatalogVersion = RUNTIME_CATALOG_VERSION;

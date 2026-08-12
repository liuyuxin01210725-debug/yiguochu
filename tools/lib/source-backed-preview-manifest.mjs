import { validateSourceBackedOnePotCatalog } from './source-backed-one-pot-catalog-validator.mjs';
import { requiresSourceSafetyEndpoint } from './source-backed-safety-applicability.mjs';

const PREVIEW_VERSION = 'source-backed-one-pot-preview-v1-20260811-r1';
const CONTRACT_FIELDS = Object.freeze([
  'fixed_batch',
  'liquid_contract',
  'cooking_sequence',
  'time_contract',
  'safety_endpoints',
  'allergen_labels',
]);
const ELIGIBLE_SOURCE_STATUSES = new Set(['executable', 'recipe_fact_checked']);
const EXCLUDED_BOUNDARY = /粥|稀饭|汤饭|湯飯|congee|porridge|rice[- ]?soup|soup|leftover\s+rice|剩饭/iu;

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasContract(recipe, field) {
  if (field === 'safety_endpoints' || field === 'allergen_labels') {
    if (field === 'safety_endpoints' && !requiresSourceSafetyEndpoint(recipe)) return true;
    return Array.isArray(recipe?.[field]) && recipe[field].length > 0;
  }
  if (field === 'cooking_sequence') {
    return Array.isArray(recipe?.[field]) && recipe[field].length > 0;
  }
  return Boolean(recipe?.[field]);
}

function missingContracts(recipe) {
  return CONTRACT_FIELDS.filter(field => !hasContract(recipe, field));
}

function pathForRecipe(catalog, recipe) {
  return `catalog.recipes[${catalog.recipes.indexOf(recipe)}]`;
}

function candidateValidationErrors(catalog, recipe) {
  const previewCatalog = clone(catalog);
  const previewRecipe = previewCatalog.recipes.find(row => row.recipe_id === recipe.recipe_id);
  previewRecipe.status = 'preview_ready';
  const path = pathForRecipe(previewCatalog, previewRecipe);
  return validateSourceBackedOnePotCatalog(previewCatalog)
    .filter(error => error.startsWith(path));
}

function reasonCodes(recipe, errors = []) {
  const reasons = new Set();
  if (!ELIGIBLE_SOURCE_STATUSES.has(recipe?.status)) reasons.add('status_not_ready');
  if (missingContracts(recipe).length) reasons.add('missing_contract');
  if (requiresSourceSafetyEndpoint(recipe)
      && (!Array.isArray(recipe?.safety_endpoints) || recipe.safety_endpoints.length === 0)) reasons.add('missing_safety');
  if (recipe?.cooker_adaptation?.status !== 'source_limited') reasons.add('cooker_boundary');
  if (EXCLUDED_BOUNDARY.test([
    recipe?.canonical_name,
    ...asArray(recipe?.aliases),
    recipe?.cuisine_family,
  ].filter(Boolean).join(' '))) reasons.add('excluded_boundary');
  for (const error of errors) {
    if (/high-risk .* requires safety endpoint/u.test(error)) reasons.add('missing_safety');
    else if (/nutrition structure|nutrition_structure/u.test(error)) reasons.add('nutrition_gate');
    else if (/allergen_labels/u.test(error)) reasons.add('allergen_gate');
    else if (/PDF contract evidence|local_archive/u.test(error)) reasons.add('source_archive');
    else if (/named appliance|appliance support/u.test(error)) reasons.add('appliance_scope');
    else reasons.add('validator_block');
  }
  return [...reasons].sort();
}

function compactRecord(recipe, previewStatus, errors = []) {
  return {
    recipe_id: recipe.recipe_id,
    canonical_name: recipe.canonical_name,
    original_status: recipe.status,
    preview_status: previewStatus,
    cuisine_family: recipe.cuisine_family,
    region_codes: asArray(recipe.region_codes),
    source_ids: asArray(recipe.source_refs).map(source => source?.source_id).filter(Boolean),
    cooker_adaptation_status: recipe.cooker_adaptation?.status || null,
    missing_contracts: missingContracts(recipe),
    reason_codes: reasonCodes(recipe, errors),
  };
}

export function buildSourceBackedPreviewManifest(catalog) {
  const recipes = Array.isArray(catalog?.recipes) ? catalog.recipes : [];
  const records = [];
  const blocked = [];
  let contractComplete = 0;
  let validatorClean = 0;

  for (const recipe of recipes) {
    const missing = missingContracts(recipe);
    if (missing.length === 0) contractComplete += 1;
    const errors = missing.length === 0 ? candidateValidationErrors(catalog, recipe) : [];
    if (missing.length === 0 && errors.length === 0) validatorClean += 1;

    const eligible = ELIGIBLE_SOURCE_STATUSES.has(recipe.status)
      && missing.length === 0
      && errors.length === 0
      && recipe.cooker_adaptation?.status === 'source_limited'
      && !EXCLUDED_BOUNDARY.test([
        recipe.canonical_name,
        ...asArray(recipe.aliases),
        recipe.cuisine_family,
      ].filter(Boolean).join(' '));

    if (eligible) records.push(compactRecord(recipe, 'preview_ready'));
    else blocked.push(compactRecord(recipe, 'blocked', errors));
  }

  return {
    schema_version: 1,
    preview_version: PREVIEW_VERSION,
    source_catalog_version: catalog?.catalog_version || null,
    scope: 'source-backed-public-preview',
    policy: {
      label: '来源合同闭合的预览池（非 Planner 正式菜谱）',
      requires_kitchen_observed_before_production: true,
      preserves_source_cooker_boundary: true,
      excludes_estimated_research_cards: true,
    },
    counts: {
      total: recipes.length,
      contract_complete: contractComplete,
      validator_clean: validatorClean,
      selected: records.length,
      blocked: blocked.length,
    },
    records,
    blocked,
  };
}

export function validateSourceBackedPreviewManifest(manifest, catalog) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) return ['manifest must be an object'];
  if (manifest.schema_version !== 1) errors.push('manifest.schema_version must be 1');
  if (manifest.scope !== 'source-backed-public-preview') errors.push('manifest.scope is invalid');
  if (manifest.source_catalog_version !== catalog?.catalog_version) errors.push('manifest.source_catalog_version does not match source catalog');
  const catalogById = new Map((Array.isArray(catalog?.recipes) ? catalog.recipes : []).map(recipe => [recipe.recipe_id, recipe]));
  const allRows = [...asArray(manifest.records), ...asArray(manifest.blocked)];
  const seen = new Set();
  for (const row of allRows) {
    if (!row?.recipe_id) {
      errors.push('manifest row recipe_id is required');
      continue;
    }
    if (seen.has(row.recipe_id)) errors.push(`duplicate manifest recipe_id ${row.recipe_id}`);
    seen.add(row.recipe_id);
    const source = catalogById.get(row.recipe_id);
    if (!source) {
      errors.push(`${row.recipe_id} not found in source catalog`);
      continue;
    }
    if (row.canonical_name !== source.canonical_name) errors.push(`${row.recipe_id} canonical_name does not match source catalog`);
    if (row.original_status !== source.status) errors.push(`${row.recipe_id} original_status does not match source catalog`);
  }
  const counts = manifest.counts || {};
  if (counts.total !== catalogById.size) errors.push(`manifest counts.total must be ${catalogById.size}`);
  if (counts.selected !== asArray(manifest.records).length) errors.push('manifest counts.selected does not match records length');
  if (counts.blocked !== asArray(manifest.blocked).length) errors.push('manifest counts.blocked does not match blocked length');
  if (counts.selected + counts.blocked !== counts.total) errors.push('manifest selected + blocked must equal total');
  if (asArray(manifest.records).some(row => row.preview_status !== 'preview_ready')) errors.push('manifest records must be preview_ready');
  const expected = buildSourceBackedPreviewManifest(catalog);
  if (JSON.stringify(manifest) !== JSON.stringify(expected)) errors.push('manifest does not match deterministic preview selection');
  return errors;
}

export const sourceBackedPreviewVersion = PREVIEW_VERSION;

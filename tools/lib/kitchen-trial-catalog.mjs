const KITCHEN_TRIAL_CATALOG_VERSION = 'kitchen-trial-catalog-v1-20260813-c13';

const asArray = value => Array.isArray(value) ? value : [];

function mapById(rows) {
  return new Map(asArray(rows).map(row => [row?.recipe_id, row]));
}

function sourceRef(version, recipeId) {
  return `${version}#${recipeId}`;
}

function stableHash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
}

export function buildKitchenTrialCatalog({ sourceCatalog, executionLibrary, formalizationLedger, formalReview } = {}) {
  const sourceById = mapById(sourceCatalog?.recipes);
  const executionById = mapById(executionLibrary?.entries);
  const reviewById = mapById(formalReview?.records);
  const entries = asArray(formalizationLedger?.records)
    .filter(record => record?.formalization_status === 'preview_candidate')
    .filter(record => record?.execution_readiness?.unblocked === true)
    .map(record => {
      const id = record.recipe_id;
      const source = sourceById.get(id);
      const execution = executionById.get(id);
      const review = reviewById.get(id);
      const endpointCodes = asArray(review?.safety?.endpoint_codes);
      const sourceReady = Boolean(source && typeof sourceCatalog?.catalog_version === 'string');
      const executionReady = Boolean(execution && typeof executionLibrary?.execution_library_version === 'string');
      const formalReady = Boolean(review && typeof formalizationLedger?.ledger_version === 'string');
      return {
        recipe_id: id,
        canonical_name: record.canonical_name || source?.canonical_name || execution?.canonical_name || id,
        trial_eligible: sourceReady && executionReady && formalReady,
        planner_runtime_eligible: false,
        production_approved: false,
        source_catalog_ref: sourceRef(sourceCatalog?.catalog_version, id),
        execution_card_ref: sourceRef(executionLibrary?.execution_library_version, id),
        formalization_ref: sourceRef(formalizationLedger?.ledger_version, id),
        required_safety_endpoint_codes: endpointCodes,
        source_status: record.source_status,
        formalization_status: record.formalization_status,
        cooker_boundary_preserved: execution?.cooker_boundary_preserved === true,
        contract_hashes: {
          source: stableHash(source),
          execution: stableHash(execution),
          formalization: stableHash(record),
          formal_review: stableHash(review),
        },
        next_action: '记录同源固定批次、液体/水位、器具程序、时间、安全终点和真实旅程，再提交独立评审。',
      };
    });
  return {
    schema_version: 1,
    kitchen_trial_catalog_version: KITCHEN_TRIAL_CATALOG_VERSION,
    source_catalog_version: sourceCatalog?.catalog_version || null,
    execution_library_version: executionLibrary?.execution_library_version || null,
    formalization_ledger_version: formalizationLedger?.ledger_version || null,
    scope: 'kitchen-trial-catalog',
    policy: {
      trial_only: true,
      planner_authority: false,
      production_authority: false,
      source_contract_is_fixed_batch_only: true,
      required_safety_codes_come_from_formal_review: true,
    },
    counts: { total: entries.length, trial_eligible: entries.filter(entry => entry.trial_eligible).length },
    entries,
  };
}

export function validateKitchenTrialCatalog(catalog, inputs = {}) {
  const errors = [];
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) return ['kitchen trial catalog must be an object'];
  if (catalog.schema_version !== 1) errors.push('kitchen trial catalog schema_version must be 1');
  if (catalog.kitchen_trial_catalog_version !== KITCHEN_TRIAL_CATALOG_VERSION) errors.push('kitchen trial catalog version is invalid');
  if (catalog.scope !== 'kitchen-trial-catalog') errors.push('kitchen trial catalog scope is invalid');
  if (catalog.policy?.trial_only !== true || catalog.policy?.planner_authority !== false || catalog.policy?.production_authority !== false) {
    errors.push('kitchen trial catalog policy must remain trial-only');
  }
  const seen = new Set();
  for (const entry of asArray(catalog.entries)) {
    if (seen.has(entry?.recipe_id)) errors.push(`duplicate trial recipe_id ${entry?.recipe_id}`);
    seen.add(entry?.recipe_id);
    if (entry?.trial_eligible !== true) errors.push(`${entry?.recipe_id} trial_eligible must be true`);
    if (entry?.planner_runtime_eligible !== false) errors.push(`${entry?.recipe_id} planner_runtime_eligible must be false`);
    if (entry?.production_approved !== false) errors.push(`${entry?.recipe_id} production_approved must be false`);
    if (!Array.isArray(entry?.required_safety_endpoint_codes)) errors.push(`${entry?.recipe_id} required_safety_endpoint_codes must be an array`);
    if (!entry?.contract_hashes || !['source', 'execution', 'formalization', 'formal_review'].every(key => /^[a-f0-9]{64}$/u.test(entry.contract_hashes[key] || ''))) {
      errors.push(`${entry?.recipe_id} contract_hashes must include four sha256 values`);
    }
    if (!entry?.source_catalog_ref || !entry?.execution_card_ref || !entry?.formalization_ref) errors.push(`${entry?.recipe_id} versioned refs are required`);
  }
  const expected = buildKitchenTrialCatalog(inputs);
  if (JSON.stringify(catalog) !== JSON.stringify(expected)) errors.push('kitchen trial catalog does not match deterministic build');
  return [...new Set(errors)];
}

export const kitchenTrialCatalogVersion = KITCHEN_TRIAL_CATALOG_VERSION;
import crypto from 'node:crypto';

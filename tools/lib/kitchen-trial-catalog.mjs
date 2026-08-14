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

const CONTRACT_HASH_KEYS = Object.freeze(['source', 'execution', 'formalization', 'formal_review']);

function contractHashes(source, execution, record, review) {
  return {
    source: stableHash(source),
    execution: stableHash(execution),
    formalization: stableHash(record),
    formal_review: stableHash(review),
  };
}

function validContractHashes(value) {
  return CONTRACT_HASH_KEYS.every(key => /^[a-f0-9]{64}$/u.test(value?.[key] || ''));
}

function validAmount(value) {
  return value && typeof value === 'object'
    && Number.isFinite(value.value)
    && value.value >= 0
    && typeof value.unit === 'string'
    && value.unit.trim().length > 0;
}

function validFixedBatch(contract) {
  return contract && Number.isFinite(contract.servings)
    && contract.servings > 0
    && Array.isArray(contract.ingredients)
    && contract.ingredients.length > 0
    && contract.ingredients.every(item => typeof item?.name === 'string' && item.name.trim() && validAmount(item.amount));
}

function validLiquid(contract) {
  const amountReady = validAmount(contract?.amount);
  const waterlineReady = contract?.waterline
    && typeof contract.waterline.appliance_model === 'string'
    && contract.waterline.appliance_model.trim()
    && typeof contract.waterline.scale === 'string'
    && contract.waterline.scale.trim()
    && contract.waterline.mark !== undefined
    && contract.waterline.mark !== null;
  return Boolean(amountReady || waterlineReady);
}

function validCookingSequence(sequence) {
  return Array.isArray(sequence)
    && sequence.length > 0
    && sequence.every(step => Number.isFinite(step?.step) && typeof step?.instruction === 'string' && step.instruction.trim());
}

function validTimeContract(contract) {
  return contract && Number.isFinite(contract.total_minutes) && contract.total_minutes > 0;
}

function validSafetyContract(contract, formalReview) {
  if (Array.isArray(contract) && contract.length > 0) {
    return contract.every(endpoint => typeof endpoint?.code === 'string' && endpoint.code.trim()
      && Number.isFinite(endpoint.minimum_core_temperature_c));
  }
  return formalReview?.safety?.status === 'not_applicable'
    && formalReview?.safety?.applicability === 'not_applicable';
}

function validEquipmentContract(execution) {
  const equipment = execution?.equipment_contract || execution?.execution_card?.equipment_contract;
  const capacity = equipment?.capacity;
  const capacityReady = Number.isFinite(capacity)
    || (capacity && typeof capacity === 'object' && Number.isFinite(capacity.value) && typeof capacity.unit === 'string' && capacity.unit.trim());
  return Boolean(equipment
    && typeof equipment.brand === 'string' && equipment.brand.trim()
    && typeof equipment.model === 'string' && equipment.model.trim()
    && typeof equipment.program === 'string' && equipment.program.trim()
    && capacityReady);
}

function executionEligibilityReasons(execution, formalReview) {
  const sourceContract = execution?.source_contract || {};
  return [
    ...(!validFixedBatch(sourceContract.fixed_batch) ? ['source_fixed_batch_missing_or_incomplete'] : []),
    ...(!validLiquid(sourceContract.liquid_contract) ? ['liquid_contract_missing'] : []),
    ...(!validCookingSequence(sourceContract.cooking_sequence) ? ['cooking_sequence_missing_or_incomplete'] : []),
    ...(!validTimeContract(sourceContract.time_contract) ? ['time_contract_missing_or_incomplete'] : []),
    ...(!validSafetyContract(sourceContract.safety_endpoints, formalReview) ? ['safety_endpoint_missing_or_incomplete'] : []),
    ...(!validEquipmentContract(execution) ? ['equipment_contract_missing'] : []),
  ];
}

export function isKitchenTrialEntryStrictlyEligible(entry = {}) {
  return entry.trial_eligible === true
    && entry.planner_runtime_eligible === false
    && entry.production_approved === false
    && entry.candidate_id === entry.recipe_id
    && entry.variant_id === null
    && entry.cooker_boundary_preserved === true
    && Array.isArray(entry.eligibility_reasons)
    && entry.eligibility_reasons.length === 0
    && validContractHashes(entry.contract_hashes)
    && typeof entry.source_catalog_ref === 'string'
    && typeof entry.execution_card_ref === 'string'
    && typeof entry.formalization_ref === 'string';
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
      const boundaryReady = execution?.cooker_boundary_preserved === true;
      const hashes = contractHashes(source, execution, record, review);
      const hashReady = validContractHashes(hashes);
      const executionReasons = executionEligibilityReasons(execution, review);
      const eligibilityReasons = [
        ...(!sourceReady ? ['source_contract_missing_or_unversioned'] : []),
        ...(!executionReady ? ['execution_contract_missing_or_unversioned'] : []),
        ...(!formalReady ? ['formal_review_contract_missing_or_unversioned'] : []),
        ...(!boundaryReady ? ['cooker_boundary_not_preserved'] : []),
        ...(!hashReady ? ['contract_hashes_incomplete'] : []),
        ...executionReasons,
      ];
      return {
        recipe_id: id,
        candidate_id: id,
        variant_id: null,
        canonical_name: record.canonical_name || source?.canonical_name || execution?.canonical_name || id,
        trial_eligible: eligibilityReasons.length === 0,
        planner_runtime_eligible: false,
        production_approved: false,
        source_catalog_ref: sourceRef(sourceCatalog?.catalog_version, id),
        execution_card_ref: sourceRef(executionLibrary?.execution_library_version, id),
        formalization_ref: sourceRef(formalizationLedger?.ledger_version, id),
        required_safety_endpoint_codes: endpointCodes,
        source_status: record.source_status,
        formalization_status: record.formalization_status,
        cooker_boundary_preserved: boundaryReady,
        equipment_contract: execution?.equipment_contract
          || execution?.execution_card?.equipment_contract
          || null,
        contract_hashes: hashes,
        eligibility_reasons: eligibilityReasons,
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
    if (typeof entry?.trial_eligible !== 'boolean') errors.push(`${entry?.recipe_id} trial_eligible must be boolean`);
    if (entry?.candidate_id !== entry?.recipe_id) errors.push(`${entry?.recipe_id} candidate_id must equal recipe_id for the canonical trial candidate`);
    if (entry?.variant_id !== null) errors.push(`${entry?.recipe_id} variant_id must be null until an approved trial variant exists`);
    if (entry?.planner_runtime_eligible !== false) errors.push(`${entry?.recipe_id} planner_runtime_eligible must be false`);
    if (entry?.production_approved !== false) errors.push(`${entry?.recipe_id} production_approved must be false`);
    if (!Array.isArray(entry?.required_safety_endpoint_codes)) errors.push(`${entry?.recipe_id} required_safety_endpoint_codes must be an array`);
    if (!entry?.contract_hashes || !validContractHashes(entry.contract_hashes)) {
      errors.push(`${entry?.recipe_id} contract_hashes must include four sha256 values`);
    }
    if (!Array.isArray(entry?.eligibility_reasons)) errors.push(`${entry?.recipe_id} eligibility_reasons must be an array`);
    if (entry?.trial_eligible === true && entry?.eligibility_reasons?.length) errors.push(`${entry?.recipe_id} eligible trial candidate cannot retain eligibility_reasons`);
    if (entry?.trial_eligible === false && !entry?.eligibility_reasons?.length) errors.push(`${entry?.recipe_id} ineligible trial candidate must declare eligibility_reasons`);
    if (entry?.trial_eligible === true && !validEquipmentContract({ equipment_contract: entry?.equipment_contract })) errors.push(`${entry?.recipe_id} eligible trial candidate requires equipment_contract`);
    if (!entry?.source_catalog_ref || !entry?.execution_card_ref || !entry?.formalization_ref) errors.push(`${entry?.recipe_id} versioned refs are required`);
  }
  const expected = buildKitchenTrialCatalog(inputs);
  if (JSON.stringify(catalog) !== JSON.stringify(expected)) errors.push('kitchen trial catalog does not match deterministic build');
  return [...new Set(errors)];
}

export const kitchenTrialCatalogVersion = KITCHEN_TRIAL_CATALOG_VERSION;
import crypto from 'node:crypto';

const asArray = value => Array.isArray(value) ? value : [];

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function positiveAmount(value) {
  return isObject(value)
    && Number.isFinite(value.value)
    && value.value > 0
    && nonEmpty(value.unit);
}

function hasQuantityContract(value) {
  return isObject(value)
    && asArray(value.ingredients).length > 0
    && asArray(value.ingredients).every(item => (
      isObject(item)
      && nonEmpty(item.canonical_id)
      && positiveAmount(item.amount)
    ));
}

function hasLiquidContract(value) {
  return isObject(value) && (positiveAmount(value.amount) || nonEmpty(value.waterline));
}

function hasTimeContract(value) {
  return isObject(value)
    && ((Number.isFinite(value.total_minutes) && value.total_minutes > 0)
      || nonEmpty(value.program));
}

function hasStepContract(value) {
  return asArray(value).length > 0 && asArray(value).every(step => (
    isObject(step) && nonEmpty(step.step_id) && nonEmpty(step.action_code)
  ));
}

function hasEquipmentContract(value) {
  return isObject(value)
    && nonEmpty(value.vessel_type)
    && nonEmpty(value.brand_or_family)
    && nonEmpty(value.model)
    && positiveAmount(value.capacity)
    && nonEmpty(value.program)
    && nonEmpty(value.boundary);
}

function hasSafetyContract(value) {
  return asArray(value).length > 0 && asArray(value).every(endpoint => (
    isObject(endpoint)
      && nonEmpty(endpoint.endpoint_code)
      && endpoint.required === true
  ));
}

export function inspectRuntimeContract({ recipe, runtime, actionProfile } = {}) {
  const reasons = [];
  if (!hasSafetyContract(runtime?.safety_endpoints)) reasons.push('safety_endpoints_missing');
  if (!hasEquipmentContract(runtime?.equipment_contract)) reasons.push('equipment_contract_missing');
  if (!hasQuantityContract(runtime?.quantity_contract)) reasons.push('quantity_contract_missing');
  if (!hasLiquidContract(runtime?.liquid_contract)) reasons.push('liquid_contract_missing');
  if (!hasTimeContract(runtime?.time_contract)) reasons.push('time_contract_missing');
  if (!hasStepContract(runtime?.step_contract)) reasons.push('step_contract_missing');
  const ref = runtime?.action_profile_ref;
  if (!isObject(ref) || !nonEmpty(ref.action_profile_id) || !nonEmpty(ref.profile_version)) {
    reasons.push('action_profile_ref_missing');
  } else if (!isObject(actionProfile)
      || actionProfile.action_profile_id !== ref.action_profile_id
      || actionProfile.profile_version !== ref.profile_version
      || !asArray(actionProfile.actions).length) {
    reasons.push('action_profile_ref_mismatch');
  }
  if (!asArray(recipe?.source_refs).some(refItem => (
    isObject(refItem) && nonEmpty(refItem.url) && /^https:\/\//u.test(refItem.url)
  ))) reasons.push('source_contract_missing');
  return { complete: reasons.length === 0, reasons };
}

export function validateRuntimeContract(input = {}) {
  const result = inspectRuntimeContract(input);
  return result.reasons;
}

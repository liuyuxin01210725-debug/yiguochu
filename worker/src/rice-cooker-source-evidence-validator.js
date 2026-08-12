const TOP_LEVEL_KEYS = new Set(['schema_version', 'ledger_version', 'scope', 'entries']);
const ENTRY_KEYS = new Set([
  'source_id',
  'source_title',
  'source_url',
  'publisher',
  'source_kind',
  'retrieved_at',
  'rights',
  'quantities',
  'appliance_profile',
  'verdict',
  'cannot_prove',
]);
const LIQUID_SEMANTICS = new Set([
  'added_water_exact',
  'added_water_texture_range',
  'added_water_ratio_to_rice_measure',
  'ambiguous_source_ratio',
  'waterline_after_liquid_seasonings',
  'inner_vessel_total_liquid_with_separate_outer_water',
  'inner_vessel_added_water_with_separate_outer_water',
]);
const VERDICTS = new Set(['executable_reference', 'research_only']);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function presentString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isHttps(value) {
  return presentString(value) && /^https:\/\//u.test(value);
}

function validateQuantityItem(item, path, errors) {
  if (!isObject(item)) {
    errors.push(`${path} must be an object`);
    return;
  }
  if (!presentString(item.name)) errors.push(`${path}.name is required`);
  if (!isObject(item.quantity) || Object.keys(item.quantity).length === 0) {
    errors.push(`${path}.quantity is required`);
  }
}

export function validateRiceCookerSourceEvidence(ledger) {
  const errors = [];
  if (!isObject(ledger)) return ['ledger must be an object'];

  for (const key of Object.keys(ledger)) {
    if (!TOP_LEVEL_KEYS.has(key)) errors.push(`unknown top-level field: ${key}`);
  }
  if (ledger.schema_version !== 1) errors.push('schema_version must equal 1');
  if (!presentString(ledger.ledger_version)) errors.push('ledger_version is required');
  if (!presentString(ledger.scope)) errors.push('scope is required');
  if (!Array.isArray(ledger.entries) || ledger.entries.length === 0) {
    errors.push('entries must be a non-empty array');
    return errors;
  }

  const sourceIds = new Set();
  ledger.entries.forEach((entry, index) => {
    const path = `entries[${index}]`;
    if (!isObject(entry)) {
      errors.push(`${path} must be an object`);
      return;
    }
    for (const key of Object.keys(entry)) {
      if (!ENTRY_KEYS.has(key)) errors.push(`${path}: unknown field ${key}`);
    }
    if (!presentString(entry.source_id)) errors.push(`${path}.source_id is required`);
    if (sourceIds.has(entry.source_id)) errors.push(`duplicate source_id: ${entry.source_id}`);
    sourceIds.add(entry.source_id);
    if (!presentString(entry.source_title)) errors.push(`${path}.source_title is required`);
    if (!isHttps(entry.source_url)) errors.push(`${path}.source_url must be HTTPS`);
    if (!presentString(entry.publisher)) errors.push(`${path}.publisher is required`);
    if (!presentString(entry.source_kind)) errors.push(`${path}.source_kind is required`);
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(entry.retrieved_at || '')) {
      errors.push(`${path}.retrieved_at must be YYYY-MM-DD`);
    }

    if (!isObject(entry.rights)) {
      errors.push(`${path}.rights is required`);
    } else {
      if (!presentString(entry.rights.license_name)) errors.push(`${path}.rights.license_name is required`);
      if (!presentString(entry.rights.usage_boundary)) errors.push(`${path}.rights.usage_boundary is required`);
      if (!Array.isArray(entry.rights.allowed_use) || entry.rights.allowed_use.length === 0) {
        errors.push(`${path}.rights.allowed_use is required`);
      }
      if (!Array.isArray(entry.rights.forbidden_use) || entry.rights.forbidden_use.length === 0) {
        errors.push(`${path}.rights.forbidden_use is required`);
      }
      if (entry.rights.license_url !== null && !isHttps(entry.rights.license_url)) {
        errors.push(`${path}.rights.license_url must be HTTPS or null`);
      }
      if (entry.rights.contribution_permission_url !== null
          && !isHttps(entry.rights.contribution_permission_url)) {
        errors.push(`${path}.rights.contribution_permission_url must be HTTPS or null`);
      }
    }

    if (!isObject(entry.quantities)) {
      errors.push(`${path}.quantities is required`);
    } else {
      if (!isObject(entry.quantities.rice)) errors.push(`${path}.quantities.rice is required`);
      if (!Array.isArray(entry.quantities.protein_items)) {
        errors.push(`${path}.quantities.protein_items must be an array`);
      } else {
        entry.quantities.protein_items.forEach((item, itemIndex) => (
          validateQuantityItem(item, `${path}.quantities.protein_items[${itemIndex}]`, errors)
        ));
      }
      if (!Array.isArray(entry.quantities.vegetable_items)) {
        errors.push(`${path}.quantities.vegetable_items must be an array`);
      } else {
        entry.quantities.vegetable_items.forEach((item, itemIndex) => (
          validateQuantityItem(item, `${path}.quantities.vegetable_items[${itemIndex}]`, errors)
        ));
      }

      const liquid = entry.quantities.liquid_contract;
      if (!isObject(liquid) || !LIQUID_SEMANTICS.has(liquid?.semantic)) {
        errors.push(`${path}.quantities.liquid_contract.semantic is invalid`);
      } else if (liquid.semantic === 'added_water_exact' && !isObject(liquid.amount)) {
        errors.push(`${path}: added_water_exact requires amount`);
      } else if (liquid.semantic === 'added_water_texture_range' && !isObject(liquid.amounts_ml)) {
        errors.push(`${path}: added_water_texture_range requires amounts_ml`);
      } else if (liquid.semantic === 'added_water_ratio_to_rice_measure' && !isObject(liquid.ratio)) {
        errors.push(`${path}: added_water_ratio_to_rice_measure requires ratio`);
      } else if (liquid.semantic === 'ambiguous_source_ratio' && !presentString(liquid.source_expression)) {
        errors.push(`${path}: ambiguous_source_ratio requires source_expression`);
      } else if (liquid.semantic === 'waterline_after_liquid_seasonings' && !isObject(liquid.waterline)) {
        errors.push(`${path}: waterline_after_liquid_seasonings requires waterline`);
      } else if (liquid.semantic.startsWith('inner_vessel_')
          && (!isObject(liquid.amount) || !presentString(liquid.outer_vessel_boundary))) {
        errors.push(`${path}: inner-vessel liquid requires amount and outer_vessel_boundary`);
      }
    }

    if (!isObject(entry.appliance_profile) || !presentString(entry.appliance_profile.profile)) {
      errors.push(`${path}.appliance_profile.profile is required`);
    }
    if (!isObject(entry.verdict) || !VERDICTS.has(entry.verdict.status)) {
      errors.push(`${path}.verdict.status is invalid`);
    }
    if (!presentString(entry.verdict?.scope)) errors.push(`${path}.verdict.scope is required`);
    if (entry.quantities?.liquid_contract?.semantic === 'ambiguous_source_ratio'
        && entry.verdict?.status !== 'research_only') {
      errors.push(`${path}: ambiguous_source_ratio cannot be executable_reference`);
    }
    if (!Array.isArray(entry.cannot_prove) || entry.cannot_prove.length === 0) {
      errors.push(`${path}.cannot_prove must be non-empty`);
    }
  });
  return errors;
}

export function assertRiceCookerSourceEvidence(ledger) {
  const errors = validateRiceCookerSourceEvidence(ledger);
  if (errors.length > 0) {
    throw new Error(`invalid rice-cooker source evidence:\n${errors.join('\n')}`);
  }
  return ledger;
}

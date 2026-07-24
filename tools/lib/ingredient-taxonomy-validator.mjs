const CATEGORIES = new Set([
  'raw_rice', 'cooked_rice', 'noodle', 'acid_vegetable', 'egg', 'soft_tofu', 'firm_tofu',
  'beef', 'chicken', 'pork', 'leafy_vegetable', 'cruciferous_vegetable', 'pod_vegetable',
  'watery_vegetable', 'aromatic_vegetable', 'root_vegetable', 'mushroom', 'liquid', 'oil', 'seasoning',
]);
const STATES = new Set(['raw', 'cooked', 'basic']);
const SHAPES = new Set(['whole', 'slice', 'dice', 'shred', 'ground', 'tenderloin', 'breast', 'leg', 'rib', 'brisket', 'liquid']);
const COOK_SPEEDS = new Set(['no_cook', 'fast', 'medium', 'slow']);
const MOISTURE_RELEASE = new Set(['low', 'medium', 'high']);
const TEXTURE_BEHAVIORS = new Set([
  'absorbs_liquid', 'reheats_without_breaking', 'softens_with_simmering', 'releases_juice_when_cooked',
  'sets_when_heated', 'delicate_breaks_when_stirred', 'firm_holds_shape', 'tender_when_quick_cooked',
  'tender_after_long_simmer', 'crumbles_when_cooked', 'tender_when_cooked_through', 'wilts_quickly', 'liquid', 'dissolves',
]);
const RISK_CODES = new Set(['none', 'raw_egg', 'raw_poultry', 'raw_pork', 'raw_beef', 'raw_seafood', 'unknown']);

function isStringArray(value) {
  return Array.isArray(value) && value.every(item => typeof item === 'string' && item.trim());
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicate = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicate.add(value);
    seen.add(value);
  }
  return [...duplicate];
}

export function validateIngredientTaxonomy(data) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return ['taxonomy must be an object'];
  if (data.taxonomy_version !== 'taxonomy-v1-20260724') errors.push('taxonomy_version must be taxonomy-v1-20260724');
  if (!Array.isArray(data.items) || data.items.length === 0) return [...errors, 'items must be a non-empty array'];

  const ids = [];
  const aliases = [];
  const displayNames = [];
  data.items.forEach((item, index) => {
    const label = `items[${index}]`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`${label} must be an object`);
      return;
    }
    for (const field of ['canonical_id', 'display_name']) {
      if (typeof item[field] !== 'string' || !item[field].trim()) errors.push(`${label}.${field} must be a non-empty string`);
    }
    if (item.canonical_id) ids.push(item.canonical_id);
    if (item.display_name) displayNames.push(item.display_name);
    if (item.canonical_name != null && (typeof item.canonical_name !== 'string' || !item.canonical_name.trim())) {
      errors.push(`${label}.canonical_name must be a non-empty string when present`);
    }
    if (!isStringArray(item.aliases) && !(Array.isArray(item.aliases) && item.aliases.length === 0)) {
      errors.push(`${label}.aliases must be a string array`);
    } else {
      aliases.push(...item.aliases);
    }
    if (!CATEGORIES.has(item.category)) errors.push(`${label}.category is invalid`);
    if (!isStringArray(item.states) || item.states.some(state => !STATES.has(state))) errors.push(`${label}.states are invalid`);
    if (!isStringArray(item.shapes_or_cuts) || item.shapes_or_cuts.some(shape => !SHAPES.has(shape))) errors.push(`${label}.shapes_or_cuts are invalid`);
    if (item.default_shape_or_cut != null && !item.shapes_or_cuts?.includes(item.default_shape_or_cut)) {
      errors.push(`${label}.default_shape_or_cut must be a declared shape`);
    }
    if (!COOK_SPEEDS.has(item.cook_speed)) errors.push(`${label}.cook_speed is invalid`);
    if (!MOISTURE_RELEASE.has(item.moisture_release)) errors.push(`${label}.moisture_release is invalid`);
    if (!item.texture_behavior || typeof item.texture_behavior !== 'object'
      || !TEXTURE_BEHAVIORS.has(item.texture_behavior.behavior_code)
      || !isStringArray(item.texture_behavior.best_method_codes)
      || !Array.isArray(item.texture_behavior.failure_mode_codes)
      || !item.texture_behavior.failure_mode_codes.every(code => typeof code === 'string' && code.trim())) {
      errors.push(`${label}.texture_behavior is invalid`);
    }
    if (!item.cooking_risk || typeof item.cooking_risk !== 'object'
      || !RISK_CODES.has(item.cooking_risk.risk_code)
      || !Array.isArray(item.cooking_risk.required_endpoint_codes)
      || !item.cooking_risk.required_endpoint_codes.every(code => typeof code === 'string' && code.trim())) {
      errors.push(`${label}.cooking_risk is invalid`);
    }
    for (const field of ['compatible_slot_codes', 'incompatible_slot_codes']) {
      if (!Array.isArray(item[field]) || !item[field].every(code => typeof code === 'string' && code.trim())) {
        errors.push(`${label}.${field} must be a string array`);
      }
    }
    if (item.alias_shape_or_cut != null) {
      if (!item.alias_shape_or_cut || typeof item.alias_shape_or_cut !== 'object' || Array.isArray(item.alias_shape_or_cut)) {
        errors.push(`${label}.alias_shape_or_cut must be an object`);
      } else {
        for (const [alias, shape] of Object.entries(item.alias_shape_or_cut)) {
          if (!item.aliases?.includes(alias) || !item.shapes_or_cuts?.includes(shape)) {
            errors.push(`${label}.alias_shape_or_cut must reference an alias and declared shape`);
          }
        }
      }
    }
  });
  for (const id of duplicateValues(ids)) errors.push(`duplicate canonical_id: ${id}`);
  for (const name of duplicateValues(displayNames)) errors.push(`duplicate display_name: ${name}`);
  for (const alias of duplicateValues(aliases)) errors.push(`duplicate alias: ${alias}`);
  const displaySet = new Set(displayNames);
  for (const alias of aliases) if (displaySet.has(alias)) errors.push(`alias conflicts with display_name: ${alias}`);
  return errors;
}

export function assertIngredientTaxonomy(data) {
  const errors = validateIngredientTaxonomy(data);
  if (errors.length) throw new Error(`ingredient taxonomy invalid: ${errors.join('; ')}`);
  return data;
}

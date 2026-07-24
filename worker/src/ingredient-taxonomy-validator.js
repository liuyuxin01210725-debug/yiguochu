import { normalizeIngredientTaxonomyKey } from './planner-v2.js';

export { normalizeIngredientTaxonomyKey };

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
const METHOD_CODES = new Set(['simmer', 'braise', 'quick_saute', 'short_simmer', 'long_simmer', 'steam']);
const FAILURE_MODE_CODES = new Set([
  'undercooked_when_liquid_is_short', 'mushy_when_overmixed', 'soft_when_overcooked',
  'watery_when_overloaded', 'rubbery_when_overcooked', 'breaks_when_stirred',
  'dry_when_overcooked', 'tough_when_overcooked', 'tough_when_rushed',
  'chewy_when_undercooked', 'firm_when_undercooked', 'burns_when_unattended', 'smokes_when_overheated',
]);
const ENDPOINT_CODES = new Set([
  'rice_tender', 'heated_through', 'noodle_tender', 'egg_fully_set', 'beef_fully_cooked',
  'poultry_fully_cooked', 'pork_fully_cooked', 'bean_fully_cooked', 'tender',
]);
const SLOT_CODES = new Set([
  'staple', 'raw_rice', 'cooked_rice', 'noodle', 'acid_base', 'vegetable', 'protein', 'egg',
  'soft_tofu', 'firm_tofu', 'generic_beef', 'quick_cook_protein', 'brisket_required',
  'ground_meat_required', 'generic_poultry', 'generic_pork', 'rib_required',
  'fast_cooking_vegetable', 'aromatic', 'mushroom', 'liquid', 'oil', 'seasoning',
  'hard_stir_fry', 'long_braise',
]);

function isStringArray(value) {
  return Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'string' && item.trim());
}

export function validateIngredientTaxonomy(data) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return ['taxonomy must be an object'];
  if (data.taxonomy_version !== 'taxonomy-v1-20260724') errors.push('taxonomy_version must be taxonomy-v1-20260724');
  if (!Array.isArray(data.items) || data.items.length === 0) return [...errors, 'items must be a non-empty array'];

  const ids = [];
  const displayEntries = new Map();
  const aliasEntries = new Map();
  data.items.forEach((item, index) => {
    const label = `items[${index}]`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`${label} must be an object`);
      return;
    }
    const aliases = Array.isArray(item.aliases) ? item.aliases : [];
    const shapes = Array.isArray(item.shapes_or_cuts) ? item.shapes_or_cuts : [];
    for (const field of ['canonical_id', 'display_name']) {
      if (typeof item[field] !== 'string' || !item[field].trim()) errors.push(`${label}.${field} must be a non-empty string`);
    }
    if (item.canonical_id) ids.push(item.canonical_id);
    if (item.display_name) {
      const key = normalizeIngredientTaxonomyKey(item.display_name);
      const entries = displayEntries.get(key) || [];
      entries.push(item);
      displayEntries.set(key, entries);
    }
    if (item.canonical_name != null && (typeof item.canonical_name !== 'string' || !item.canonical_name.trim())) {
      errors.push(`${label}.canonical_name must be a non-empty string when present`);
    }
    if (!isStringArray(item.aliases) && !(Array.isArray(item.aliases) && item.aliases.length === 0)) {
      errors.push(`${label}.aliases must be a string array`);
    } else {
      for (const alias of item.aliases) {
        const key = normalizeIngredientTaxonomyKey(alias);
        const entries = aliasEntries.get(key) || [];
        entries.push(item);
        aliasEntries.set(key, entries);
      }
    }
    if (!CATEGORIES.has(item.category)) errors.push(`${label}.category is invalid`);
    if (!isStringArray(item.states) || item.states.some(state => !STATES.has(state))) errors.push(`${label}.states are invalid`);
    if (!isStringArray(item.shapes_or_cuts) || item.shapes_or_cuts.some(shape => !SHAPES.has(shape))) errors.push(`${label}.shapes_or_cuts are invalid`);
    if (item.default_shape_or_cut != null && !shapes.includes(item.default_shape_or_cut)) {
      errors.push(`${label}.default_shape_or_cut must be a declared shape`);
    }
    if (!COOK_SPEEDS.has(item.cook_speed)) errors.push(`${label}.cook_speed is invalid`);
    if (!MOISTURE_RELEASE.has(item.moisture_release)) errors.push(`${label}.moisture_release is invalid`);
    if (!item.texture_behavior || typeof item.texture_behavior !== 'object'
      || !TEXTURE_BEHAVIORS.has(item.texture_behavior.behavior_code)
      || !isStringArray(item.texture_behavior.best_method_codes)
      || !item.texture_behavior.best_method_codes.every(code => METHOD_CODES.has(code))) {
      errors.push(`${label}.texture_behavior is invalid`);
    }
    if (!item.texture_behavior || !Array.isArray(item.texture_behavior.failure_mode_codes)
      || !item.texture_behavior.failure_mode_codes.every(code => FAILURE_MODE_CODES.has(code))) {
      errors.push(`${label}.texture_behavior.failure_mode_codes are invalid`);
    }
    if (!item.texture_behavior || !isStringArray(item.texture_behavior.best_method_codes)
      || !item.texture_behavior.best_method_codes.every(code => METHOD_CODES.has(code))) {
      errors.push(`${label}.texture_behavior.best_method_codes are invalid`);
    }
    if (!item.cooking_risk || typeof item.cooking_risk !== 'object'
      || !RISK_CODES.has(item.cooking_risk.risk_code)
      || !Array.isArray(item.cooking_risk.required_endpoint_codes)
      || !item.cooking_risk.required_endpoint_codes.every(code => ENDPOINT_CODES.has(code))) {
      errors.push(`${label}.cooking_risk is invalid`);
    }
    if (!item.cooking_risk || !Array.isArray(item.cooking_risk.required_endpoint_codes)
      || !item.cooking_risk.required_endpoint_codes.every(code => ENDPOINT_CODES.has(code))) {
      errors.push(`${label}.cooking_risk.required_endpoint_codes are invalid`);
    }
    if (item.cooking_risk && RISK_CODES.has(item.cooking_risk.risk_code)
      && item.cooking_risk.risk_code !== 'none'
      && item.cooking_risk.required_endpoint_codes?.length === 0) {
      errors.push(`${label}.cooking_risk.required_endpoint_codes must not be empty for ${item.cooking_risk.risk_code}`);
    }
    for (const field of ['compatible_slot_codes', 'incompatible_slot_codes']) {
      if (!Array.isArray(item[field]) || (field === 'compatible_slot_codes' && item[field].length === 0)
        || !item[field].every(code => SLOT_CODES.has(code))) {
        errors.push(`${label}.${field} are invalid`);
      }
    }
    if (item.alias_shape_or_cut != null) {
      if (!item.alias_shape_or_cut || typeof item.alias_shape_or_cut !== 'object' || Array.isArray(item.alias_shape_or_cut)) {
        errors.push(`${label}.alias_shape_or_cut must be an object`);
      } else {
        for (const [alias, shape] of Object.entries(item.alias_shape_or_cut)) {
          if (!aliases.includes(alias) || !shapes.includes(shape)) {
            errors.push(`${label}.alias_shape_or_cut must reference an alias and declared shape`);
          }
        }
      }
    }
  });
  for (const [key, entries] of displayEntries) {
    if (entries.length > 1) errors.push(`duplicate normalized display_name: ${key}`);
  }
  const idsSeen = new Set();
  for (const id of ids) {
    if (idsSeen.has(id)) errors.push(`duplicate canonical_id: ${id}`);
    idsSeen.add(id);
  }
  for (const [key, entries] of aliasEntries) {
    if (entries.length > 1) errors.push(`duplicate normalized alias: ${key}`);
    if (displayEntries.has(key)) errors.push(`normalized alias conflicts with display_name: ${key}`);
  }
  for (const item of data.items) {
    if (!item?.canonical_name) continue;
    const ownKey = normalizeIngredientTaxonomyKey(item.display_name);
    const targetKey = normalizeIngredientTaxonomyKey(item.canonical_name);
    if (targetKey === ownKey) {
      errors.push(`${item.canonical_id}.canonical_name must not point to itself`);
      continue;
    }
    const targets = displayEntries.get(targetKey) || [];
    if (targets.length !== 1) {
      errors.push(`${item.canonical_id}.canonical_name must name an existing display_name`);
      continue;
    }
    const [target] = targets;
    if (target.canonical_name) errors.push(`${item.canonical_id}.canonical_name must not point to another canonical alias`);
    if (target.category !== item.category) errors.push(`${item.canonical_id}.canonical_name category must match`);
  }
  return errors;
}

export function assertIngredientTaxonomy(data) {
  const errors = validateIngredientTaxonomy(data);
  if (errors.length) throw new Error(`ingredient taxonomy invalid: ${errors.join('; ')}`);
  return data;
}

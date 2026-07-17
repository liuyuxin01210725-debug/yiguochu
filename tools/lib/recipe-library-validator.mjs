const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const REASON_TYPES = new Set(['taste', 'texture_water', 'timing', 'safety']);
const CONSTRAINT_PROFILE_IDS = new Set(['rice-allergy-complete-main']);
const CONSTRAINT_PROFILE_FIELDS = new Set(['id', 'basis']);
const STRING_ARRAY_FIELDS = [
  'purposes',
  'core_ingredients',
  'optional_ingredients',
  'technique',
  'ratio_rules',
  'safety_rules',
];
const OBJECT_ARRAY_FIELDS = ['substitution_slots', 'discouraged', 'source_refs'];

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateRequiredArray(value, label, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${label} must be non-empty`);
    return false;
  }
  return true;
}

function validateStringArray(value, label, errors) {
  if (!validateRequiredArray(value, label, errors)) return false;
  for (let index = 0; index < value.length; index += 1) {
    if (!isNonEmptyString(value[index])) {
      errors.push(`${label} must contain non-empty strings`);
      return false;
    }
  }
  return true;
}

function isHttpsUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

function isValidIsoDate(value) {
  if (typeof value !== 'string') return false;
  const match = ISO_DATE_RE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  const leapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= daysInMonth[month - 1];
}

function safeId(value, fallback) {
  return isNonEmptyString(value) ? value : fallback;
}

export function validateRecipeLibrary(lib) {
  const errors = [];
  if (lib?.schema_version !== 1) errors.push('schema_version must be 1');
  if (!isPlainObject(lib?.ingredient_aliases)) {
    errors.push('ingredient_aliases must be an object');
  }
  if (!Array.isArray(lib?.families)) errors.push('families must be an array');
  if (!Array.isArray(lib?.recipes)) errors.push('recipes must be an array');
  if (errors.length) return errors;

  for (const [alias, canonical] of Object.entries(lib.ingredient_aliases)) {
    if (!isNonEmptyString(alias) || !isNonEmptyString(canonical)) {
      errors.push('ingredient_aliases must map non-empty strings to non-empty strings');
      break;
    }
  }

  const familyIds = new Set();
  for (const [index, family] of lib.families.entries()) {
    if (!isPlainObject(family)) {
      errors.push(`family at index ${index} must be an object`);
      continue;
    }
    const id = typeof family.id === 'string' ? family.id : '';
    if (!ID_RE.test(id)) errors.push(`invalid family id: ${id || '<empty>'}`);
    if (id && familyIds.has(id)) errors.push(`duplicate family id: ${id}`);
    if (id) familyIds.add(id);
    const label = safeId(id, `family at index ${index}`);
    for (const key of ['name', 'form']) {
      if (!isNonEmptyString(family[key])) errors.push(`${label} missing ${key}`);
    }
  }

  const recipeIds = new Set();
  for (const [index, recipe] of lib.recipes.entries()) {
    if (!isPlainObject(recipe)) {
      errors.push(`recipe at index ${index} must be an object`);
      continue;
    }
    const id = typeof recipe.id === 'string' ? recipe.id : '';
    const label = safeId(id, `recipe at index ${index}`);
    if (!ID_RE.test(id)) errors.push(`invalid recipe id: ${id || '<empty>'}`);
    if (id && recipeIds.has(id)) errors.push(`duplicate recipe id: ${id}`);
    if (id) recipeIds.add(id);
    if (typeof recipe.family_id !== 'string' || !familyIds.has(recipe.family_id)) {
      const familyId = isNonEmptyString(recipe.family_id) ? recipe.family_id : '<invalid>';
      errors.push(`${label} missing family ${familyId}`);
    }
    if (recipe.status !== 'approved') errors.push(`${label} status must be approved`);
    for (const key of ['name', 'cuisine', 'form']) {
      if (!isNonEmptyString(recipe[key])) errors.push(`${label} missing ${key}`);
    }
    if (recipe.total_time_minutes !== undefined
      && (!Number.isInteger(recipe.total_time_minutes)
        || recipe.total_time_minutes < 1
        || recipe.total_time_minutes > 60)) {
      errors.push(`${label} total_time_minutes must be an integer from 1 to 60`);
    }
    if (recipe.adaptation_note !== undefined
      && (typeof recipe.adaptation_note !== 'string'
        || recipe.adaptation_note.trim().length < 1
        || recipe.adaptation_note.trim().length > 400)) {
      errors.push(`${label} adaptation_note must contain 1 to 400 characters`);
    }
    for (const key of STRING_ARRAY_FIELDS) {
      validateStringArray(recipe[key], `${label} ${key}`, errors);
    }
    for (const key of OBJECT_ARRAY_FIELDS) {
      validateRequiredArray(recipe[key], `${label} ${key}`, errors);
    }

    if (recipe.constraint_profiles !== undefined) {
      if (!Array.isArray(recipe.constraint_profiles) || recipe.constraint_profiles.length === 0) {
        errors.push(`${label} constraint_profiles must be a non-empty array`);
      } else {
        const profileIds = new Set();
        for (const [profileIndex, profile] of recipe.constraint_profiles.entries()) {
          if (!isPlainObject(profile)) {
            errors.push(`${label} constraint profile at index ${profileIndex} must be an object`);
            continue;
          }
          const profileId = isNonEmptyString(profile.id) ? profile.id : '<invalid>';
          if (!CONSTRAINT_PROFILE_IDS.has(profileId)) {
            errors.push(`${label} constraint profile at index ${profileIndex} has unknown id ${profileId}`);
          }
          if (profileIds.has(profileId)) {
            errors.push(`${label} duplicate constraint profile ${profileId}`);
          }
          profileIds.add(profileId);
          if (!isNonEmptyString(profile.basis)) {
            errors.push(`${label} constraint profile at index ${profileIndex} missing basis`);
          }
          if (Object.keys(profile).some(key => !CONSTRAINT_PROFILE_FIELDS.has(key))) {
            errors.push(`${label} constraint profile at index ${profileIndex} has unexpected fields`);
          }
        }
      }
    }

    if (Array.isArray(recipe.substitution_slots)) {
      for (const [slotIndex, slot] of recipe.substitution_slots.entries()) {
        if (!isPlainObject(slot)) {
          errors.push(`${label} substitution slot at index ${slotIndex} must be an object`);
          continue;
        }
        let invalidSlot = false;
        if (!isNonEmptyString(slot.slot)) {
          errors.push(`${label} substitution slot at index ${slotIndex} missing slot`);
          invalidSlot = true;
        }
        if (!validateStringArray(slot.replaces, `${label} substitution slot at index ${slotIndex} replaces`, errors)) {
          invalidSlot = true;
        }
        if (!validateStringArray(slot.allowed, `${label} substitution slot at index ${slotIndex} allowed`, errors)) {
          invalidSlot = true;
        }
        if (invalidSlot) errors.push(`${label} invalid substitution slot`);
      }
    }

    if (Array.isArray(recipe.discouraged)) {
      for (const [ruleIndex, item] of recipe.discouraged.entries()) {
        if (!isPlainObject(item)) {
          errors.push(`${label} discouraged rule at index ${ruleIndex} must be an object`);
          continue;
        }
        if (!REASON_TYPES.has(item.reason_type)) {
          const reasonType = typeof item.reason_type === 'string' ? item.reason_type : '<invalid>';
          errors.push(`${label} invalid reason_type ${reasonType}`);
        }
        let invalidRule = false;
        if (!validateStringArray(item.ingredients, `${label} discouraged rule at index ${ruleIndex} ingredients`, errors)) {
          invalidRule = true;
        }
        if (!isNonEmptyString(item.reason)) {
          errors.push(`${label} discouraged rule at index ${ruleIndex} missing reason`);
          invalidRule = true;
        }
        if (invalidRule) errors.push(`${label} invalid discouraged rule`);
      }
    }

    if (Array.isArray(recipe.source_refs)) {
      for (const [sourceIndex, source] of recipe.source_refs.entries()) {
        if (!isPlainObject(source)) {
          errors.push(`${label} source at index ${sourceIndex} must be an object`);
          continue;
        }
        if (source.usage !== 'approved') errors.push(`${label} source usage must be approved`);
        if (!isHttpsUrl(source.url)) errors.push(`${label} source URL must be HTTPS`);
        for (const key of ['title', 'license', 'attribution']) {
          if (!isNonEmptyString(source[key])) errors.push(`${label} source missing ${key}`);
        }
        if (!isValidIsoDate(source.retrieved_at)) {
          errors.push(`${label} source retrieved_at must be a valid ISO YYYY-MM-DD date`);
        }
        if (typeof source.url === 'string' && /recipedb/i.test(source.url)) {
          errors.push(`${label} RecipeDB cannot be approved`);
        }
      }
    }
  }
  return errors;
}

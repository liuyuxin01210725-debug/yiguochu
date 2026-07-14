const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REASON_TYPES = new Set(['taste', 'texture_water', 'timing', 'safety']);

export function validateRecipeLibrary(lib) {
  const errors = [];
  if (lib?.schema_version !== 1) errors.push('schema_version must be 1');
  if (!lib?.ingredient_aliases || typeof lib.ingredient_aliases !== 'object' || Array.isArray(lib.ingredient_aliases)) {
    errors.push('ingredient_aliases must be an object');
  }
  if (!Array.isArray(lib?.families)) errors.push('families must be an array');
  if (!Array.isArray(lib?.recipes)) errors.push('recipes must be an array');
  if (errors.length) return errors;

  const familyIds = new Set();
  for (const family of lib.families) {
    if (!ID_RE.test(family.id || '')) errors.push(`invalid family id: ${family.id || '<empty>'}`);
    if (familyIds.has(family.id)) errors.push(`duplicate family id: ${family.id}`);
    familyIds.add(family.id);
    for (const key of ['name', 'form']) {
      if (!String(family[key] || '').trim()) errors.push(`${family.id} missing ${key}`);
    }
  }

  const recipeIds = new Set();
  for (const recipe of lib.recipes) {
    if (!ID_RE.test(recipe.id || '')) errors.push(`invalid recipe id: ${recipe.id || '<empty>'}`);
    if (recipeIds.has(recipe.id)) errors.push(`duplicate recipe id: ${recipe.id}`);
    recipeIds.add(recipe.id);
    if (!familyIds.has(recipe.family_id)) errors.push(`${recipe.id} missing family ${recipe.family_id}`);
    if (recipe.status !== 'approved') errors.push(`${recipe.id} status must be approved`);
    for (const key of ['name', 'cuisine', 'form']) {
      if (!String(recipe[key] || '').trim()) errors.push(`${recipe.id} missing ${key}`);
    }
    for (const key of ['purposes', 'core_ingredients', 'optional_ingredients', 'substitution_slots', 'discouraged', 'technique', 'ratio_rules', 'safety_rules', 'source_refs']) {
      if (!Array.isArray(recipe[key]) || recipe[key].length === 0) errors.push(`${recipe.id} ${key} must be non-empty`);
    }
    for (const slot of recipe.substitution_slots || []) {
      if (!String(slot.slot || '').trim() || !Array.isArray(slot.replaces) || !slot.replaces.length || !Array.isArray(slot.allowed) || !slot.allowed.length) {
        errors.push(`${recipe.id} invalid substitution slot`);
      }
    }
    for (const item of recipe.discouraged || []) {
      if (!REASON_TYPES.has(item.reason_type)) errors.push(`${recipe.id} invalid reason_type ${item.reason_type}`);
      if (!Array.isArray(item.ingredients) || !item.ingredients.length || !String(item.reason || '').trim()) {
        errors.push(`${recipe.id} invalid discouraged rule`);
      }
    }
    for (const source of recipe.source_refs || []) {
      if (source.usage !== 'approved') errors.push(`${recipe.id} source usage must be approved`);
      if (!/^https:\/\//.test(source.url || '')) errors.push(`${recipe.id} source URL must be HTTPS`);
      for (const key of ['title', 'license', 'attribution', 'retrieved_at']) {
        if (!String(source[key] || '').trim()) errors.push(`${recipe.id} source missing ${key}`);
      }
      if (/recipedb/i.test(source.url || '')) errors.push(`${recipe.id} RecipeDB cannot be approved`);
    }
  }
  return errors;
}

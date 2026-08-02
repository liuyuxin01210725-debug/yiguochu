const STATUSES = new Set([
  'discovered',
  'identity_verified',
  'recipe_fact_checked',
  'executable',
  'preview_ready',
  'kitchen_observed',
  'production_approved',
]);

const CLAIM_SCOPES = new Set([
  'identity', 'ingredients', 'quantity', 'liquid',
  'process', 'appliance', 'time', 'safety',
]);

export const PUBLIC_SOURCE_BACKED_STATUSES = new Set([
  'preview_ready', 'kitchen_observed', 'production_approved',
]);

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HTTPS_URL = /^https:\/\/[^/\s]+(?:\/[^\s]*)?$/i;
const REQUIRED_EXECUTABLE_SCOPES = [
  'identity', 'ingredients', 'quantity', 'liquid', 'process', 'time',
];
const REQUIRED_EXECUTABLE_FIELDS = [
  'fixed_batch', 'liquid_contract', 'cooking_sequence',
  'time_contract', 'safety_endpoints', 'allergen_labels',
];
const RAW_HIGH_RISK_INGREDIENT = /\b(raw\s+)?(poultry|chicken|turkey|duck|pork|beef|lamb|seafood|fish|shrimp|crab|egg|eggs|beans|wild\s+mushrooms?|live\s+shellfish)\b|生(?:鸡|禽|猪|牛|羊|鱼|虾|蟹|海鲜|鸡蛋|蛋|豆|野生蘑菇|贝)|(?:鸡|鸭|鹅|禽肉|猪肉|牛肉|羊肉|海鲜|鱼|虾|蟹|鸡蛋|生蛋|生豆|野生菌|活贝)/i;

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function addRequiredStringError(errors, value, path) {
  if (!nonEmptyString(value)) errors.push(`${path} must be a nonempty string`);
}

function canonicalRegionKey(recipe) {
  if (!Array.isArray(recipe.region_codes)) return null;
  return `${recipe.canonical_name}\u0000${[...recipe.region_codes].sort().join(',')}`;
}

function validateSource(source, path, errors) {
  if (!isRecord(source)) {
    errors.push(`${path} must be an object`);
    return;
  }

  addRequiredStringError(errors, source.source_id, `${path}.source_id`);
  addRequiredStringError(errors, source.title, `${path}.title`);
  addRequiredStringError(errors, source.publisher, `${path}.publisher`);
  addRequiredStringError(errors, source.retrieved_at, `${path}.retrieved_at`);
  addRequiredStringError(errors, source.license, `${path}.license`);
  addRequiredStringError(errors, source.attribution, `${path}.attribution`);
  addRequiredStringError(errors, source.source_kind, `${path}.source_kind`);

  if (!nonEmptyString(source.url) || !HTTPS_URL.test(source.url)) {
    errors.push(`${path}.url must be an HTTPS URL`);
  }

  if (!Array.isArray(source.claim_scopes) || source.claim_scopes.length === 0) {
    errors.push(`${path}.claim_scopes must be a nonempty array`);
  } else {
    for (const scope of source.claim_scopes) {
      if (!CLAIM_SCOPES.has(scope)) {
        errors.push(`${path}.claim_scopes contains unsupported scope: ${String(scope)}`);
      }
    }
  }
}

function sourceClaimScopes(recipe) {
  const sourceRefs = Array.isArray(recipe.source_refs) ? recipe.source_refs : [];
  return new Set(sourceRefs.flatMap(source => (
    Array.isArray(source?.claim_scopes) ? source.claim_scopes : []
  )));
}

function missingRequiredField(recipe, field) {
  return recipe[field] === null || recipe[field] === undefined;
}

function claimsNamedAppliance(recipe) {
  const adaptation = isRecord(recipe.cooker_adaptation) ? recipe.cooker_adaptation : {};
  return [
    recipe.appliance,
    recipe.appliance_name,
    recipe.named_appliance,
    recipe.user_facing_appliance,
    adaptation.appliance,
    adaptation.appliance_name,
    adaptation.named_appliance,
  ].some(nonEmptyString);
}

function containsRawHighRiskIngredient(recipe) {
  const ingredients = [
    ...(Array.isArray(recipe.core_ingredients) ? recipe.core_ingredients : []),
    ...(Array.isArray(recipe.fixed_batch?.ingredients) ? recipe.fixed_batch.ingredients : []),
  ];
  return ingredients.some(ingredient => {
    if (nonEmptyString(ingredient)) return RAW_HIGH_RISK_INGREDIENT.test(ingredient);
    if (!isRecord(ingredient)) return false;
    return [ingredient.name, ingredient.ingredient, ingredient.canonical_name, ingredient.canonical_id]
      .filter(nonEmptyString)
      .some(name => RAW_HIGH_RISK_INGREDIENT.test(name));
  });
}

function isProjectSelfCitation(url, projectHosts) {
  if (!nonEmptyString(url)) return false;
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return projectHosts.some(host => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

function validatePromotionGates(recipe, path, errors) {
  if (isRecord(recipe.cooker_adaptation)
    && recipe.cooker_adaptation.status === 'adapted'
    && nonEmptyString(recipe.cooker_adaptation.adapted_name)
    && recipe.cooker_adaptation.adapted_name.trim() === recipe.canonical_name?.trim()) {
    errors.push(`${path}.cooker_adaptation.adapted_name must not equal canonical_name`);
  }

  if (!PUBLIC_SOURCE_BACKED_STATUSES.has(recipe.status)) return;

  const scopes = sourceClaimScopes(recipe);
  const missingScopes = REQUIRED_EXECUTABLE_SCOPES.filter(scope => !scopes.has(scope));
  if (missingScopes.includes('identity')) {
    errors.push(`${path} public recipe requires identity support`);
  }
  if (missingScopes.length > 0) {
    errors.push(`${path} public recipe is missing required claim scopes: ${missingScopes.join(', ')}`);
  }

  const missingFields = REQUIRED_EXECUTABLE_FIELDS.filter(field => missingRequiredField(recipe, field));
  if (missingFields.includes('fixed_batch') || missingFields.includes('liquid_contract')) {
    errors.push(`${path} public recipe requires fixed_batch and liquid_contract`);
  }
  for (const field of missingFields) {
    if (field !== 'fixed_batch' && field !== 'liquid_contract') {
      errors.push(`${path}.${field} is required for public recipes`);
    }
  }

  if (claimsNamedAppliance(recipe) && !scopes.has('appliance')) {
    errors.push(`${path} named appliance claims require appliance support`);
  }
  if (containsRawHighRiskIngredient(recipe) && !scopes.has('safety')) {
    errors.push(`${path} raw high-risk ingredients require safety support`);
  }

  if (!isRecord(recipe.nutrition_structure)
    || !['A', 'B'].includes(recipe.nutrition_structure.grade)) {
    errors.push(`${path} public recipe requires nutrition structure grade A or B`);
  }
}

export function validateSourceBackedOnePotCatalog(catalog, options = {}) {
  const errors = [];
  const projectHosts = Array.isArray(options.project_hosts)
    ? options.project_hosts
    : ['yiguochu.pages.dev'];

  if (!isRecord(catalog)) return ['catalog must be an object'];
  if (catalog.schema_version !== 1) errors.push('catalog.schema_version must be 1');
  addRequiredStringError(errors, catalog.catalog_version, 'catalog.catalog_version');
  if (catalog.scope !== 'savory-rice-main-meal') {
    errors.push('catalog.scope must be savory-rice-main-meal');
  }
  if (!Array.isArray(catalog.reviewed_regions)) errors.push('catalog.reviewed_regions must be an array');
  if (!Array.isArray(catalog.regional_blanks)) errors.push('catalog.regional_blanks must be an array');
  if (!Array.isArray(catalog.recipes)) {
    errors.push('catalog.recipes must be an array');
    return errors;
  }

  const recipeIds = new Set();
  const canonicalRegionKeys = new Set();
  for (const [index, recipe] of catalog.recipes.entries()) {
    const path = `catalog.recipes[${index}]`;
    if (!isRecord(recipe)) {
      errors.push(`${path} must be an object`);
      continue;
    }

    if (!nonEmptyString(recipe.recipe_id) || !KEBAB_CASE.test(recipe.recipe_id)) {
      errors.push(`${path}.recipe_id must be unique kebab-case`);
    } else if (recipeIds.has(recipe.recipe_id)) {
      errors.push(`${path}.recipe_id duplicates ${recipe.recipe_id}`);
    } else {
      recipeIds.add(recipe.recipe_id);
    }

    addRequiredStringError(errors, recipe.canonical_name, `${path}.canonical_name`);
    if (!Array.isArray(recipe.region_codes) || recipe.region_codes.length === 0 || !recipe.region_codes.every(nonEmptyString)) {
      errors.push(`${path}.region_codes must be a nonempty string array`);
    } else if (nonEmptyString(recipe.canonical_name)) {
      const key = canonicalRegionKey(recipe);
      if (canonicalRegionKeys.has(key)) errors.push(`${path}.canonical_name + region_codes must be unique`);
      canonicalRegionKeys.add(key);
    }

    if (!STATUSES.has(recipe.status)) errors.push(`${path}.status is invalid`);
    if (!Array.isArray(recipe.source_refs) || recipe.source_refs.length === 0) {
      errors.push(`${path}.source_refs must be a nonempty array`);
    } else {
      recipe.source_refs.forEach((source, sourceIndex) => {
        const sourcePath = `${path}.source_refs[${sourceIndex}]`;
        validateSource(source, sourcePath, errors);
        if (isProjectSelfCitation(source?.url, projectHosts)) {
          errors.push(`${sourcePath}.url must not be a project self-citation`);
        }
      });
    }
    validatePromotionGates(recipe, path, errors);
  }

  return errors;
}

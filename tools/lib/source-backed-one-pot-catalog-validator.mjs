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
export const REQUIRED_EXECUTABLE_SCOPES = [
  'identity', 'ingredients', 'quantity', 'liquid', 'process', 'time',
];
const REQUIRED_EXECUTABLE_FIELDS = [
  'fixed_batch', 'liquid_contract', 'cooking_sequence',
  'time_contract', 'safety_endpoints', 'allergen_labels',
];
const DEFAULT_PROJECT_HOSTS = ['yiguochu.pages.dev'];
const MIGRATION_DISPOSITIONS = new Set([
  'source_backed_migrated',
  'source_backed_research_only',
  'manufacturer_recipe_migrated',
  'project_original_excluded',
  'scope_excluded',
  'duplicate_alias',
]);
const MIGRATION_TARGET_DISPOSITIONS = new Set([
  'source_backed_migrated',
  'source_backed_research_only',
  'manufacturer_recipe_migrated',
  'duplicate_alias',
]);
const MANDATORY_PROJECT_ORIGINAL_COMBINATION_VARIANT_IDS = new Set([
  'home-broccoli-beef-rice',
  'home-cabbage-tofu-rice',
  'home-chicken-leg-potato-rice',
  'home-corn-carrot-chicken-leg-rice',
  'home-green-bean-pork-rib-rice',
  'home-mushroom-green-bean-pork-rib-rice',
]);
const RAW_HIGH_RISK_INGREDIENT = /\b(raw\s+)?(poultry|chicken|turkey|duck|pork|beef|lamb|seafood|fish|shrimp|crab|egg|eggs|beans|wild\s+mushrooms?|live\s+shellfish)\b|生(?:鸡|禽|猪|牛|羊|鱼|虾|蟹|海鲜|鸡蛋|蛋|豆|野生蘑菇|贝)|(?:鸡|鸭|鹅|禽肉|猪肉|牛肉|羊肉|海鲜|鱼|虾|蟹|鸡蛋|生蛋|生豆|野生菌|活贝|蚝|牡蛎|蛤蜊|扇贝)|(?:生蚝|牡蛎|蚝|贝类|蛤蜊|扇贝)/i;
const APPLIANCE_CLAIM = /电饭煲|电锅|饭煲|电压力锅|压力锅|空气炸锅|微波炉|烤箱|蒸箱|rice cooker|slow cooker|instant pot/i;

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function addRequiredStringError(errors, value, path) {
  if (!nonEmptyString(value)) errors.push(`${path} must be a nonempty string`);
}

function isNonEmptyRecord(value) {
  return isRecord(value) && Object.keys(value).length > 0;
}

function isPositiveFiniteNumber(value) {
  return Number.isFinite(value) && value > 0;
}

function hasNonEmptyStrings(value) {
  return Array.isArray(value) && value.length > 0 && value.every(nonEmptyString);
}

function isMeaningfulAmount(value) {
  return isNonEmptyRecord(value)
    && isPositiveFiniteNumber(value.value)
    && nonEmptyString(value.unit);
}

function isMeaningfulFixedBatchIngredient(value) {
  return isNonEmptyRecord(value)
    && nonEmptyString(value.name)
    && isMeaningfulAmount(value.amount);
}

function isMeaningfulCookingSequence(value) {
  return Array.isArray(value) && value.length > 0 && value.every(entry => (
    isNonEmptyRecord(entry)
    && Number.isInteger(entry.step)
    && entry.step > 0
    && nonEmptyString(entry.instruction)
  ));
}

function isMeaningfulSafetyEndpoints(value) {
  return Array.isArray(value) && value.length > 0 && value.every(endpoint => (
    isNonEmptyRecord(endpoint) && nonEmptyString(endpoint.code)
  ));
}

function isMeaningfulFixedBatch(value) {
  return isNonEmptyRecord(value)
    && isPositiveFiniteNumber(value.servings)
    && Array.isArray(value.ingredients)
    && value.ingredients.length > 0
    && value.ingredients.every(isMeaningfulFixedBatchIngredient);
}

function isMeaningfulLiquidContract(value) {
  return isNonEmptyRecord(value)
    && nonEmptyString(value.kind)
    && isMeaningfulAmount(value.amount);
}

function isMeaningfulNutritionRoles(value) {
  return isRecord(value) && hasNonEmptyStrings(value.roles);
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

  const isUnparsedPdfLead = source.access_status === 'pdf_not_parsed';
  if (!Array.isArray(source.claim_scopes)
    || (source.claim_scopes.length === 0 && !isUnparsedPdfLead)) {
    errors.push(`${path}.claim_scopes must be a nonempty array unless access_status is pdf_not_parsed`);
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

function invalidExecutableFields(recipe) {
  const valid = {
    fixed_batch: isMeaningfulFixedBatch(recipe.fixed_batch),
    liquid_contract: isMeaningfulLiquidContract(recipe.liquid_contract),
    cooking_sequence: isMeaningfulCookingSequence(recipe.cooking_sequence),
    time_contract: isNonEmptyRecord(recipe.time_contract)
      && isPositiveFiniteNumber(recipe.time_contract.total_minutes),
    safety_endpoints: isMeaningfulSafetyEndpoints(recipe.safety_endpoints),
    allergen_labels: hasNonEmptyStrings(recipe.allergen_labels),
  };
  return REQUIRED_EXECUTABLE_FIELDS.filter(field => !valid[field]);
}

export function claimsNamedAppliance(recipe) {
  const adaptation = isRecord(recipe.cooker_adaptation) ? recipe.cooker_adaptation : {};
  const namedApplianceFields = [
    recipe.appliance,
    recipe.appliance_name,
    recipe.named_appliance,
    recipe.user_facing_appliance,
    adaptation.appliance,
    adaptation.appliance_name,
    adaptation.named_appliance,
  ];
  if (namedApplianceFields.some(nonEmptyString)) return true;

  const applianceClaimText = [
    adaptation.notes,
    ...collectText(recipe.cooking_sequence),
  ];
  return applianceClaimText.some(text => APPLIANCE_CLAIM.test(text));
}

function collectText(value) {
  if (nonEmptyString(value)) return [value];
  if (Array.isArray(value)) return value.flatMap(collectText);
  if (isRecord(value)) return Object.values(value).flatMap(collectText);
  return [];
}

export function containsRawHighRiskIngredient(recipe) {
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
    return [...projectHosts].some(host => hostname === host || hostname.endsWith(`.${host}`));
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

  const missingFields = invalidExecutableFields(recipe);
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
  if (!isMeaningfulNutritionRoles(recipe.nutrition_structure)) {
    errors.push(`${path}.nutrition_structure.roles must be a nonempty array`);
  }
}

export function validateSourceBackedOnePotCatalog(catalog, options = {}) {
  const errors = [];
  const safeOptions = isRecord(options) ? options : {};
  const additionalProjectHosts = Array.isArray(safeOptions.project_hosts)
    ? safeOptions.project_hosts.filter(nonEmptyString)
    : [];
  const projectHosts = new Set([
    ...DEFAULT_PROJECT_HOSTS,
    ...additionalProjectHosts.map(host => host.toLowerCase()),
  ]);

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
    let hasValidRegionCodes = false;
    if (recipe.cuisine_family === 'manufacturer-rice-cooker-recipes') {
      hasValidRegionCodes = Array.isArray(recipe.region_codes) && recipe.region_codes.length === 0;
      if (!hasValidRegionCodes) {
        errors.push(`${path}.manufacturer-rice-cooker-recipes region_codes must be an empty array`);
      }
    } else {
      hasValidRegionCodes = Array.isArray(recipe.region_codes)
        && recipe.region_codes.length > 0
        && recipe.region_codes.every(nonEmptyString);
      if (!hasValidRegionCodes) errors.push(`${path}.region_codes must be a nonempty string array`);
    }
    if (hasValidRegionCodes && nonEmptyString(recipe.canonical_name)) {
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

export function validateSourceBackedCatalogMigration(migration, legacyVariants, sourceBackedCatalog) {
  const errors = [];
  if (!isRecord(migration)) return ['migration must be an object'];
  if (migration.schema_version !== 1) errors.push('migration.schema_version must be 1');
  addRequiredStringError(errors, migration.migration_version, 'migration.migration_version');
  if (!Array.isArray(migration.items)) {
    errors.push('migration.items must be an array');
    return errors;
  }

  const legacyIds = new Set();
  const legacyVariantsById = new Map();
  if (!Array.isArray(legacyVariants)) {
    errors.push('legacyVariants must be an array');
  } else {
    for (const [index, legacy] of legacyVariants.entries()) {
      if (!nonEmptyString(legacy?.variant_id)) {
        errors.push(`legacyVariants[${index}].variant_id must be a nonempty string`);
      } else {
        legacyIds.add(legacy.variant_id);
        legacyVariantsById.set(legacy.variant_id, legacy);
      }
    }
  }

  const targetRecipeIds = new Set();
  const needsSourceBackedCatalog = migration.items.some(item => (
    isRecord(item)
    && (MIGRATION_TARGET_DISPOSITIONS.has(item.disposition)
      || item.disposition === 'project_original_excluded')
  ));
  const hasUsableSourceBackedCatalog = isRecord(sourceBackedCatalog)
    && Array.isArray(sourceBackedCatalog.recipes);
  const sourceBackedRecipes = hasUsableSourceBackedCatalog ? sourceBackedCatalog.recipes : [];
  if (!hasUsableSourceBackedCatalog) {
    if (needsSourceBackedCatalog) {
      errors.push('sourceBackedCatalog is required for target and project-original validation');
    } else if (sourceBackedCatalog !== undefined) {
      errors.push('sourceBackedCatalog.recipes must be an array');
    }
  }
  for (const recipe of sourceBackedRecipes) {
    if (nonEmptyString(recipe?.recipe_id)) targetRecipeIds.add(recipe.recipe_id);
  }

  const accountedLegacyIds = new Set();
  for (const [index, item] of migration.items.entries()) {
    const path = `migration.items[${index}]`;
    if (!isRecord(item)) {
      errors.push(`${path} must be an object`);
      continue;
    }

    addRequiredStringError(errors, item.legacy_variant_id, `${path}.legacy_variant_id`);
    addRequiredStringError(errors, item.legacy_display_name, `${path}.legacy_display_name`);
    addRequiredStringError(errors, item.reason, `${path}.reason`);
    if (!MIGRATION_DISPOSITIONS.has(item.disposition)) {
      errors.push(`${path}.disposition is invalid`);
    }

    if (nonEmptyString(item.legacy_variant_id)) {
      if (accountedLegacyIds.has(item.legacy_variant_id)) {
        errors.push(`duplicate legacy variant ${item.legacy_variant_id}`);
      }
      accountedLegacyIds.add(item.legacy_variant_id);
      if (Array.isArray(legacyVariants) && !legacyIds.has(item.legacy_variant_id)) {
        errors.push(`unknown legacy variant ${item.legacy_variant_id}`);
      }
    }

    if (MIGRATION_TARGET_DISPOSITIONS.has(item.disposition)) {
      if (!nonEmptyString(item.target_recipe_id)) {
        errors.push(`${path}.target_recipe_id must be a nonempty string for ${item.disposition}`);
      } else if (hasUsableSourceBackedCatalog && !targetRecipeIds.has(item.target_recipe_id)) {
        errors.push(`target_recipe_id ${item.target_recipe_id} does not exist in source-backed catalog`);
      }
    } else if (
      item.disposition === 'project_original_excluded'
      || item.disposition === 'scope_excluded'
    ) {
      if (item.target_recipe_id !== null) {
        errors.push(`${path}.target_recipe_id must be null for ${item.disposition}`);
      }
    }

    if (
      item.disposition === 'project_original_excluded'
      && MANDATORY_PROJECT_ORIGINAL_COMBINATION_VARIANT_IDS.has(item.legacy_variant_id)
      && hasUsableSourceBackedCatalog
    ) {
      const legacy = legacyVariantsById.get(item.legacy_variant_id);
      if (!legacy) continue;

      if (nonEmptyString(legacy.recipe_id) && targetRecipeIds.has(legacy.recipe_id)) {
        errors.push(`project-original legacy variant ${item.legacy_variant_id} reappears as recipe_id ${legacy.recipe_id}`);
      }
      const prohibitedNames = [
        legacy.display_name,
        legacy.name_label,
        ...(Array.isArray(legacy.aliases) ? legacy.aliases : []),
      ].filter(nonEmptyString);
      for (const recipe of sourceBackedRecipes) {
        const catalogNames = [
          recipe?.canonical_name,
          ...(Array.isArray(recipe?.aliases) ? recipe.aliases : []),
        ].filter(nonEmptyString);
        for (const prohibitedName of prohibitedNames) {
          if (catalogNames.includes(prohibitedName)) {
            errors.push(`project-original legacy variant ${item.legacy_variant_id} reappears as a catalog name: ${prohibitedName}`);
          }
        }
      }
    }
  }

  for (const legacyId of legacyIds) {
    if (!accountedLegacyIds.has(legacyId)) errors.push(`missing legacy variant ${legacyId}`);
  }

  return errors;
}

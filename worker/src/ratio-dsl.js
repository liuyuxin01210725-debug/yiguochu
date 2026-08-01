import { BASIC_EXTRA_CATEGORIES, resolveBasicExtraIdentity } from './taxonomy-identity.js';

const ACTIVE = new Set(['acid-staple-pot','savory-mixed-rice-pot','cooked-rice-stir-pot','broth-noodle-pot','egg-tofu-vegetable-pot','mushroom-vegetable-stew-pot','beef-staple-pot','poultry-staple-pot','braised-noodle-pot','broth-rice-pot','soft-family-rice-pot']);
const OPS = new Set(['per_serving','per_serving_by_category','ratio','bounded_sum','fixed_addition','scale_by_servings']);
const GROUP_ALLOCATION_OPERATOR = 'allocate_group_total_per_serving';
const GROUP_ALLOCATION_POLICY = 'equal_split_ordered_residual';
const PREPARED = new WeakMap();
const RULE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*-v\d+$/;
const MOISTURE = new Set(['low','medium','high']);
const LIQUID_ACTIONS = new Set(['add_reserved_liquid_if_needed']);
const LIQUID_CONTRACT_KINDS = new Set(['added_water','total_free_liquid','cooker_water_line']);
const SKIP_GUARDS = new Map([
  ['texture_behavior', { match:'equals', values:new Set(['renders_fat_when_heated']) }],
  ['texture_failure_modes', { match:'contains', values:new Set(['salty_when_overseasoned']) }],
]);
const RECIPE_MACHINE_STATES = new Set(['raw','cooked','soaked','cured','basic','prepared','derived_plan_output']);
const UNRESOLVED_RECIPE_SHAPES = new Set(['whole_soaked_grain']);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim();
const number = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const allowed = (value, keys, label, errors) => { if (object(value)) for (const key of Object.keys(value)) if (!keys.has(key)) errors.push(`${label} unknown key: ${key}`); };
const bounds = (value, label, errors, requireDefault = true) => {
  if (!object(value)) { errors.push(`${label} must be an object`); return; }
  allowed(value, new Set(['min','default','max']), label, errors);
  for (const key of requireDefault ? ['min','default','max'] : ['min','max']) if (!number(value[key])) errors.push(`${label}.${key} must be finite and non-negative`);
  if (!requireDefault && value.default != null) errors.push(`${label}.default is forbidden for bounds_only evidence`);
  if (number(value.min) && number(value.default) && number(value.max) && !(value.min <= value.default && value.default <= value.max)) errors.push(`${label} must satisfy min <= default <= max`);
  if (number(value.min) && number(value.max) && value.min > value.max) errors.push(`${label} must satisfy min <= max`);
};
const exactObject = (value, keys, label, errors) => {
  if (!object(value)) { errors.push(`${label} must be an object`); return false; }
  allowed(value, keys, label, errors);
  return true;
};
const validateCanonicalScope = (value, taxonomyIds, label, errors) => {
  if (value == null) return;
  if (!Array.isArray(value) || value.length === 0
      || value.some(id => typeof id !== 'string' || !taxonomyIds.has(id))
      || new Set(value).size !== value.length) {
    errors.push(`${label} must contain unique known canonical identities`);
  }
};
const validateLiquidDistribution = (value, label, errors) => {
  if (value == null) return;
  if (!exactObject(value,
    new Set(['initial_fraction','reserve_fraction','reserve_action_code']), label, errors)) return;
  const { initial_fraction:initial, reserve_fraction:reserve } = value;
  if (!number(initial) || !number(reserve) || initial > 1 || reserve > 1
      || Math.abs(initial + reserve - 1) > Number.EPSILON * 8) {
    errors.push(`${label} fractions must be between 0 and 1 and sum to 1`);
  }
  if (!LIQUID_ACTIONS.has(value.reserve_action_code)) {
    errors.push(`${label}.reserve_action_code is invalid`);
  }
};
const validateLiquidContract = (value, label, taxonomyById, errors) => {
  if (value == null) return;
  if (!exactObject(value,
    new Set(['kind','measured_contributor_ids','measurement','display_precision','display_rounding_grams','cup_source','line_code']),
    label, errors)) return;
  if (!LIQUID_CONTRACT_KINDS.has(value.kind)) errors.push(`${label}.kind is invalid`);
  if (!['weigh_before_loading','cooker_mark'].includes(value.measurement)) {
    errors.push(`${label}.measurement is invalid`);
  }
  if (!['exact','approximate','appliance_mark'].includes(value.display_precision)) {
    errors.push(`${label}.display_precision is invalid`);
  }
  if (value.kind === 'added_water') {
    if (value.measurement !== 'weigh_before_loading' || value.display_precision === 'appliance_mark') {
      errors.push(`${label} added_water must use a weighed amount`);
    }
    if (value.measured_contributor_ids != null) {
      errors.push(`${label} added_water must not declare measured contributors`);
    }
  }
  if (value.kind === 'total_free_liquid') {
    if (!Array.isArray(value.measured_contributor_ids) || value.measured_contributor_ids.length === 0
        || new Set(value.measured_contributor_ids).size !== value.measured_contributor_ids.length
        || value.measured_contributor_ids.some(id => taxonomyById.get(id)?.category !== 'liquid')) {
      errors.push(`${label} total_free_liquid requires unique known measured contributors`);
    }
    if (value.measurement !== 'weigh_before_loading' || value.display_precision !== 'approximate') {
      errors.push(`${label} total_free_liquid must be weighed and displayed as approximate`);
    }
  }
  if (value.kind === 'cooker_water_line') {
    if (value.measurement !== 'cooker_mark' || value.display_precision !== 'appliance_mark'
        || !text(value.cup_source) || !text(value.line_code)) {
      errors.push(`${label} cooker_water_line requires cup_source and line_code`);
    }
  } else if (value.cup_source != null || value.line_code != null) {
    errors.push(`${label} cup_source and line_code are only valid for cooker_water_line`);
  }
  if (value.kind !== 'cooker_water_line'
      && (!Number.isSafeInteger(value.display_rounding_grams) || value.display_rounding_grams <= 0)) {
    errors.push(`${label}.display_rounding_grams must be a positive integer`);
  }
};

export function normalizeRatioGrams(value, nearest = 1) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0
      || !Number.isSafeInteger(nearest) || nearest <= 0) {
    throw new Error('invalid_ratio_grams');
  }
  const normalized = Math.round(value / nearest) * nearest;
  if (!Number.isSafeInteger(normalized) || normalized < 0) {
    throw new Error('invalid_ratio_grams');
  }
  return normalized;
}

const targetSlot = (target, label, permitted, errors) => {
  if (!exactObject(target, new Set(['slot_id']), label, errors) || !text(target.slot_id) || !permitted.includes(target.slot_id) || Object.keys(target).length !== 1) errors.push(`${label} must be a declared user slot`);
};
const targetMoisture = (target, label, errors) => {
  if (!exactObject(target, new Set(['attribute','value']), label, errors) || target.attribute !== 'moisture_release' || !MOISTURE.has(target.value) || Object.keys(target).length !== 2) errors.push(`${label} is invalid`);
};
const targetBasic = (target, label, taxonomy, errors, liquidOnly = false) => {
  if (!exactObject(target, new Set(['name','category']), label, errors) || !text(target.name) || !BASIC_EXTRA_CATEGORIES.has(target.category) || Object.keys(target).length !== 2) errors.push(`${label} must be a basic extra`);
  if (liquidOnly && target?.category !== 'liquid') errors.push(`${label} must be a liquid basic extra`);
  if (!resolveBasicExtraIdentity(target, taxonomy)) errors.push(`${label} target name category does not match taxonomy`);
};
const validateSkipWhen = (value, template, label, errors) => {
  if (!exactObject(value, new Set(['slot_id','attribute','match','value']), label, errors)) return;
  const userSlots = new Set([...(template?.required_slots || []), ...(template?.optional_slots || [])]
    .filter(slot => slot?.source_policy?.includes('user')).map(slot => slot.slot_id));
  if (!userSlots.has(value.slot_id)) errors.push(`${label}.slot_id must be a declared user slot`);
  const guard = SKIP_GUARDS.get(value.attribute);
  if (!guard || value.match !== guard.match || !guard.values.has(value.value)) {
    errors.push(`${label} must use a controlled attribute match`);
  }
};

const normalizedIngredientName = value => String(value || '').trim().toLowerCase().replace(/[\s（）()_-]+/g, '');
const exactTaxonomyIdsForLiteral = (literal, taxonomyById) => {
  const wanted = normalizedIngredientName(literal);
  return [...taxonomyById.values()].filter(item => [item.display_name, ...(item.aliases || [])]
    .filter(Boolean).some(name => normalizedIngredientName(name) === wanted)).map(item => item.canonical_id);
};
const exactRecipeCoreIdentityResolution = (recipe, taxonomyById) => {
  const canonicalIds = new Set();
  const unresolvedOrAmbiguous = [];
  for (const literal of Array.isArray(recipe?.core_ingredients) ? recipe.core_ingredients : []) {
    const matches = exactTaxonomyIdsForLiteral(literal, taxonomyById);
    if (matches.length !== 1 || canonicalIds.has(matches[0])) unresolvedOrAmbiguous.push(literal);
    else canonicalIds.add(matches[0]);
  }
  return { canonicalIds, unresolvedOrAmbiguous };
};
const recipeLiteralAtPath = (recipe, path) => {
  if (typeof path !== 'string' || !(
    /^\/(?:core_ingredients|optional_ingredients|generation_optional_ingredients)\/\d+$/.test(path)
    || /^\/substitution_slots\/\d+\/(?:replaces|allowed)\/\d+$/.test(path)
  )) return { ok:false, value:null };
  let value = recipe;
  for (const segment of path.slice(1).split('/')) {
    if (Array.isArray(value)) {
      if (!/^\d+$/.test(segment) || Number(segment) >= value.length) return { ok:false, value:null };
      value = value[Number(segment)];
    } else if (object(value) && Object.hasOwn(value, segment)) {
      value = value[segment];
    } else return { ok:false, value:null };
  }
  return { ok:true, value };
};
const validateRecipeEvidenceBindings = (rule, label, recipe, taxonomyById, errors) => {
  const canonicalIds = new Set();
  const canonicalById = new Map();
  const unresolvedByName = new Map();
  if (rule.evidence_bindings == null) return { canonicalIds, canonicalById, unresolvedByName };
  if (!Array.isArray(rule.evidence_bindings)) {
    errors.push(`${label}.evidence_bindings must be an array`);
    return { canonicalIds, canonicalById, unresolvedByName };
  }
  if (rule.execution_mode !== 'bounds_only' && rule.evidence_bindings.length) {
    errors.push(`${label}.evidence_bindings are evidence-only and forbidden for executable recipe rules`);
  }
  for (const [index, binding] of rule.evidence_bindings.entries()) {
    const bindingLabel = `${label}.evidence_bindings[${index}]`;
    if (!object(binding)) { errors.push(`${bindingLabel} must be an object`); continue; }
    const structured = binding.binding_type === 'structured_recipe_literal';
    const unresolved = binding.binding_type === 'unresolved_core_identity';
    if (!structured && !unresolved) {
      errors.push(`${bindingLabel}.binding_type is invalid`);
      continue;
    }
    allowed(binding, new Set(structured
      ? ['binding_type','recipe_path','literal','canonical_id','state','shape_or_cut']
      : ['binding_type','recipe_path','literal','recipe_ingredient_name','state','shape_or_cut']), bindingLabel, errors);
    const resolved = recipeLiteralAtPath(recipe, binding.recipe_path);
    if (!resolved.ok || resolved.value !== binding.literal) {
      errors.push(`${bindingLabel} does not resolve to the exact recipe literal`);
    }
    if (structured) {
      const item = taxonomyById.get(binding.canonical_id);
      const exactMatches = exactTaxonomyIdsForLiteral(binding.literal, taxonomyById);
      if (!item || exactMatches.length !== 1 || exactMatches[0] !== binding.canonical_id) {
        errors.push(`${bindingLabel}.canonical_id must exactly match the structured recipe literal`);
      } else {
        if (!(item.states || []).includes(binding.state)) errors.push(`${bindingLabel}.state does not match canonical_id ${binding.canonical_id}`);
        if (binding.shape_or_cut != null && !(item.shapes_or_cuts || []).includes(binding.shape_or_cut)) errors.push(`${bindingLabel}.shape_or_cut does not match canonical_id ${binding.canonical_id}`);
        if (canonicalIds.has(binding.canonical_id)) errors.push(`${bindingLabel}.canonical_id must not be duplicated`);
        canonicalIds.add(binding.canonical_id);
        canonicalById.set(binding.canonical_id, binding);
      }
    } else {
      if (!/^\/core_ingredients\/\d+$/.test(binding.recipe_path || '')) errors.push(`${bindingLabel}.recipe_path must identify an exact core ingredient`);
      if (!text(binding.recipe_ingredient_name) || binding.recipe_ingredient_name !== binding.literal) errors.push(`${bindingLabel}.recipe_ingredient_name must equal literal`);
      if (exactTaxonomyIdsForLiteral(binding.literal, taxonomyById).length) errors.push(`${bindingLabel} taxonomy-backed ingredients must use canonical_id`);
      if (!RECIPE_MACHINE_STATES.has(binding.state)) errors.push(`${bindingLabel}.state must be a controlled machine state`);
      if (!UNRESOLVED_RECIPE_SHAPES.has(binding.shape_or_cut)) errors.push(`${bindingLabel}.shape_or_cut must be a controlled unresolved recipe shape`);
      const key = normalizedIngredientName(binding.recipe_ingredient_name);
      if (unresolvedByName.has(key)) errors.push(`${bindingLabel}.recipe_ingredient_name must not be duplicated`);
      unresolvedByName.set(key, binding);
    }
  }
  return { canonicalIds, canonicalById, unresolvedByName };
};
const recipeIdentityKey = target => target?.canonical_id
  ? `canonical:${target.canonical_id}`
  : target?.recipe_ingredient_name ? `recipe:${normalizedIngredientName(target.recipe_ingredient_name)}` : null;
const validateRecipeIngredientTarget = (target, label, taxonomyById, allowedCanonicalIds, canonicalEvidenceById, unresolvedByName,
  executionMode, errors, measureAllowed = false) => {
  const allowedKeys = new Set(['canonical_id','recipe_ingredient_name','state','shape_or_cut']);
  if (measureAllowed) allowedKeys.add('measure');
  if (!exactObject(target, allowedKeys, label, errors)) return null;
  const hasCanonical = text(target.canonical_id);
  const hasRecipeName = text(target.recipe_ingredient_name);
  if ((hasCanonical ? 1 : 0) + (hasRecipeName ? 1 : 0) !== 1) {
    errors.push(`${label} must identify exactly one canonical or recipe ingredient`);
    return null;
  }
  if (!text(target.state)) errors.push(`${label}.state must be explicit`);
  if (measureAllowed && target.measure !== 'grams') errors.push(`${label}.measure must be grams`);
  if (hasCanonical) {
    const item = taxonomyById.get(target.canonical_id);
    if (!item) errors.push(`${label} unknown canonical_id ${target.canonical_id}`);
    else {
      if (!allowedCanonicalIds.has(target.canonical_id)) errors.push(`${label} canonical_id ${target.canonical_id} is not an exact structured recipe identity`);
      if (!(item.states || []).includes(target.state)) errors.push(`${label}.state does not match canonical_id ${target.canonical_id}`);
      if (target.shape_or_cut != null && !(item.shapes_or_cuts || []).includes(target.shape_or_cut)) errors.push(`${label}.shape_or_cut does not match canonical_id ${target.canonical_id}`);
      const evidenceBinding = canonicalEvidenceById.get(target.canonical_id);
      if (evidenceBinding && (target.state !== evidenceBinding.state
          || (target.shape_or_cut ?? null) !== (evidenceBinding.shape_or_cut ?? null))) {
        errors.push(`${label} does not match its structured evidence binding`);
      }
    }
  } else {
    if (exactTaxonomyIdsForLiteral(target.recipe_ingredient_name, taxonomyById).length) {
      errors.push(`${label} taxonomy-backed recipe ingredients must use canonical_id`);
    }
    const binding = unresolvedByName.get(normalizedIngredientName(target.recipe_ingredient_name));
    if (!binding) errors.push(`${label}.recipe_ingredient_name requires an explicit unresolved core identity binding`);
    else if (target.state !== binding.state || target.shape_or_cut !== binding.shape_or_cut) {
      errors.push(`${label} must match the unresolved binding state and shape_or_cut`);
    }
    if (executionMode !== 'bounds_only') errors.push(`${label}.recipe_ingredient_name is evidence-only and not executable`);
  }
  return recipeIdentityKey(target);
};

export function validateRatioDslCatalog(catalog, templates, taxonomy, recipes) {
  try {
    const errors = [];
    if (!object(catalog)) return ['ratio DSL catalog must be an object'];
    allowed(catalog, new Set(['ratio_dsl_version','ratio_catalog_version','rules']), 'ratio DSL catalog', errors);
    if (catalog.ratio_dsl_version !== 1) errors.push('ratio_dsl_version must be 1');
    if (catalog.ratio_catalog_version !== 'ratio-rules-v1-20260801-r13') errors.push('ratio_catalog_version must be ratio-rules-v1-20260801-r13');
    if (!Array.isArray(catalog.rules)) return [...errors, 'rules must be an array'];
    const templateById = new Map((templates?.templates || []).filter(t => text(t?.template_id)).map(t => [t.template_id, t]));
    const recipeIds = new Set((recipes?.recipes || []).map(r => r?.id).filter(text));
    const recipeById = new Map((recipes?.recipes || []).filter(recipe => text(recipe?.id)).map(recipe => [recipe.id, recipe]));
    const taxonomyById = new Map((taxonomy?.items || [])
      .filter(item => text(item?.canonical_id)).map(item => [item.canonical_id, item]));
    const taxonomyIds = new Set(taxonomyById.keys());
    const ids = new Set();
    for (const [index, rule] of catalog.rules.entries()) {
      const label = `rules[${index}]`;
      if (!object(rule)) { errors.push(`${label} must be an object`); continue; }
      allowed(rule, new Set(['rule_id','evidence_recipe_ids','evidence_bindings','execution_mode','when','operations','liquid_distribution','liquid_contract','rounding','example_context']), label, errors);
      if (!text(rule.rule_id) || !RULE_ID.test(rule.rule_id)) errors.push(`${label}.rule_id is invalid`);
      if (ids.has(rule.rule_id)) errors.push(`duplicate rule_id: ${rule.rule_id}`); ids.add(rule.rule_id);
      const hasTemplateScope = text(rule.when?.template_id);
      const hasRecipeScope = text(rule.when?.recipe_id);
      if ((hasTemplateScope ? 1 : 0) + (hasRecipeScope ? 1 : 0) !== 1) {
        errors.push(`${label}.when must use exactly one template or recipe scope`);
      }
      if (hasRecipeScope) {
        exactObject(rule.when, new Set(['recipe_id']), `${label}.when`, errors);
        const recipe = recipeById.get(rule.when.recipe_id);
        if (!recipe) errors.push(`${label}.when has unknown recipe`);
        if (!['bounds_only','executable'].includes(rule.execution_mode)) errors.push(`${label}.execution_mode is invalid`);
        if (!Array.isArray(rule.evidence_recipe_ids) || rule.evidence_recipe_ids.length !== 1
            || rule.evidence_recipe_ids[0] !== rule.when.recipe_id) {
          errors.push(`${label}.evidence_recipe_ids must be evidence for recipe ${rule.when.recipe_id}`);
        }
        if (rule.liquid_distribution != null) {
          if (rule.execution_mode !== 'executable') {
            errors.push(`${label}.liquid_distribution is only executable for recipe scope`);
          } else {
            validateLiquidDistribution(rule.liquid_distribution, `${label}.liquid_distribution`, errors);
          }
        }
        validateLiquidContract(rule.liquid_contract, `${label}.liquid_contract`, taxonomyById, errors);
        const coreResolution = exactRecipeCoreIdentityResolution(recipe, taxonomyById);
        const coreCanonicalIds = coreResolution.canonicalIds;
        if (rule.execution_mode === 'executable' && coreResolution.unresolvedOrAmbiguous.length) {
          errors.push(`${label} executable recipe requires every core ingredient to resolve exactly once: ${coreResolution.unresolvedOrAmbiguous.join(', ')}`);
        }
        const evidenceBindings = validateRecipeEvidenceBindings(rule, label, recipe, taxonomyById, errors);
        const allowedCanonicalIds = new Set(coreCanonicalIds);
        if (rule.execution_mode === 'bounds_only') for (const canonicalId of evidenceBindings.canonicalIds) allowedCanonicalIds.add(canonicalId);
        if (!Array.isArray(rule.operations) || !rule.operations.length) {
          errors.push(`${label}.operations must be a non-empty array`);
        } else {
          const quantityCounts = new Map();
          let lastStage = 0;
          const stage = operation => ['reference_quantity','per_serving',GROUP_ALLOCATION_OPERATOR].includes(operation?.operator) ? 0
            : operation?.operator === 'ratio' || operation?.target?.category === 'liquid' ? 2 : 3;
          for (const [opIndex, op] of rule.operations.entries()) {
            const opLabel = `${label}.operations[${opIndex}]`;
            if (!object(op)) { errors.push(`${opLabel} must be an object`); continue; }
            if (!['reference_quantity','per_serving',GROUP_ALLOCATION_OPERATOR,'ratio','fixed_addition','scale_by_servings'].includes(op.operator)) {
              errors.push(`${opLabel} has unknown operator`);
              continue;
            }
            allowed(op, new Set(['reference_quantity','per_serving'].includes(op.operator) ? ['operator','target','grams']
              : op.operator === GROUP_ALLOCATION_OPERATOR ? ['operator','member_targets','grams','allocation_policy']
              : op.operator === 'ratio' ? ['operator','target','numerator','denominator','min','default','max']
                : ['operator','target','grams']), opLabel, errors);
            const currentStage = stage(op);
            if (currentStage < lastStage) errors.push(`${label}.operations must be ordered as food, liquid, then basic additions`);
            lastStage = Math.max(lastStage, currentStage);
            const requiresDefault = rule.execution_mode === 'executable';
            if (op.operator === 'reference_quantity' && rule.execution_mode !== 'bounds_only') {
              errors.push(`${opLabel}.reference_quantity is only valid for bounds_only evidence`);
            }
            if (op.operator === 'per_serving' && rule.execution_mode !== 'executable') {
              errors.push(`${opLabel}.per_serving is only valid for executable recipe rules`);
            }
            if (['reference_quantity','per_serving'].includes(op.operator)) {
              const key = validateRecipeIngredientTarget(op.target, `${opLabel}.target`, taxonomyById,
                allowedCanonicalIds, evidenceBindings.canonicalById, evidenceBindings.unresolvedByName,
                rule.execution_mode, errors);
              bounds(op.grams, `${opLabel}.grams`, errors, requiresDefault);
              if (key) quantityCounts.set(key, (quantityCounts.get(key) || 0) + 1);
            }
            if (op.operator === GROUP_ALLOCATION_OPERATOR) {
              if (rule.execution_mode !== 'executable') {
                errors.push(`${opLabel}.${GROUP_ALLOCATION_OPERATOR} is only valid for executable recipe rules`);
              }
              if (!Array.isArray(op.member_targets) || op.member_targets.length < 2) {
                errors.push(`${opLabel}.member_targets must contain at least two unique recipe ingredients`);
              } else {
                const memberKeys = op.member_targets.map((target, memberIndex) => validateRecipeIngredientTarget(
                  target,
                  `${opLabel}.member_targets[${memberIndex}]`,
                  taxonomyById,
                  allowedCanonicalIds,
                  evidenceBindings.canonicalById,
                  evidenceBindings.unresolvedByName,
                  rule.execution_mode,
                  errors,
                ));
                if (memberKeys.some(key => key == null) || new Set(memberKeys).size !== memberKeys.length) {
                  errors.push(`${opLabel}.member_targets must contain unique valid recipe ingredients`);
                }
                for (const key of memberKeys.filter(Boolean)) {
                  quantityCounts.set(key, (quantityCounts.get(key) || 0) + 1);
                }
              }
              bounds(op.grams, `${opLabel}.grams`, errors, true);
              if (!number(op.grams?.default) || op.grams.default <= 0
                  || op.grams.min !== op.grams.default || op.grams.max !== op.grams.default) {
                errors.push(`${opLabel}.grams must be a positive exact group total`);
              }
              if (op.allocation_policy !== GROUP_ALLOCATION_POLICY) {
                errors.push(`${opLabel}.allocation_policy must be ${GROUP_ALLOCATION_POLICY}`);
              }
            }
            if (op.operator === 'ratio') {
              bounds({ min:op.min, default:op.default, max:op.max }, opLabel, errors, requiresDefault);
              targetBasic(op.target, `${opLabel}.target`, taxonomy, errors, true);
              exactObject(op.numerator, new Set(['resource']), `${opLabel}.numerator`, errors);
              if (!['retained_liquid_grams','retained_cooked_liquid_grams'].includes(op.numerator?.resource)) {
                errors.push(`${opLabel}.numerator.resource is invalid`);
              }
              const denominatorKey = validateRecipeIngredientTarget(op.denominator, `${opLabel}.denominator`, taxonomyById,
                allowedCanonicalIds, evidenceBindings.canonicalById, evidenceBindings.unresolvedByName,
                rule.execution_mode, errors, true);
              if (denominatorKey && quantityCounts.get(denominatorKey) !== 1) {
                errors.push(`${label} requires exactly one quantity operation for ${denominatorKey.replace(/^[^:]+:/, '')}`);
              }
            }
            if (['fixed_addition','scale_by_servings'].includes(op.operator)) {
              bounds(op.grams, `${opLabel}.grams`, errors, requiresDefault);
              targetBasic(op.target, `${opLabel}.target`, taxonomy, errors);
              if (!['liquid','oil','seasoning'].includes(op.target?.category)) {
                errors.push(`${opLabel}.target must be a liquid, oil, or seasoning basic extra`);
              }
            }
          }
          for (const [key, count] of quantityCounts) if (count !== 1) {
            errors.push(`${label} requires exactly one quantity operation for ${key.replace(/^[^:]+:/, '')}`);
          }
          if (rule.execution_mode === 'executable') {
            for (const canonicalId of coreCanonicalIds) {
              if (quantityCounts.get(`canonical:${canonicalId}`) !== 1) {
                errors.push(`${label} executable recipe requires exactly one quantity operation for ${canonicalId}`);
              }
            }
          }
        }
        exactObject(rule.rounding, new Set(['grams_to_nearest']), `${label}.rounding`, errors);
        if (!object(rule.rounding) || !Number.isInteger(rule.rounding.grams_to_nearest) || rule.rounding.grams_to_nearest <= 0) {
          errors.push(`${label}.rounding.grams_to_nearest must be a positive integer`);
        }
        exactObject(rule.example_context, new Set(['ingredient_name']), `${label}.example_context`, errors);
        if (!text(rule.example_context?.ingredient_name)) errors.push(`${label}.example_context.ingredient_name must be a non-empty string`);
        continue;
      }
      if (rule.execution_mode != null) errors.push(`${label}.execution_mode is only valid for recipe scope`);
      if (rule.evidence_bindings != null) errors.push(`${label}.evidence_bindings are only valid for recipe scope`);
      exactObject(rule.when, new Set(['template_id','slot_id','category','canonical_ids']), `${label}.when`, errors);
      validateCanonicalScope(rule.when?.canonical_ids, taxonomyIds, `${label}.when.canonical_ids`, errors);
      if (Array.isArray(rule.when?.canonical_ids)) {
        for (const canonicalId of rule.when.canonical_ids) {
          const identity = taxonomyById.get(canonicalId);
          if (identity && identity.category !== rule.when?.category) {
            errors.push(`${label}.when canonical identity category must match when.category`);
          }
        }
      }
      const template = templateById.get(rule.when?.template_id);
      if (!template) errors.push(`${label}.when has unknown template`);
      const slotCategories = new Set(template?.ingredient_categories?.[rule.when?.slot_id] || []);
      if (!slotCategories.size) errors.push(`${label}.when has unknown slot`);
      if (!slotCategories.has(rule.when?.category)) errors.push(`${label}.when category is not accepted by slot`);
      if (!template?.ratio_constraints?.includes(rule.rule_id)) errors.push(`${label}.when template does not reference rule_id`);
      if (!Array.isArray(rule.evidence_recipe_ids) || !rule.evidence_recipe_ids.length || rule.evidence_recipe_ids.some(id => !text(id))) errors.push(`${label}.evidence_recipe_ids must be a non-empty string array`);
      if (new Set(rule.evidence_recipe_ids || []).size !== (rule.evidence_recipe_ids || []).length) errors.push(`${label}.evidence_recipe_ids must not contain duplicates`);
      for (const id of rule.evidence_recipe_ids || []) { if (!recipeIds.has(id)) errors.push(`${label} has unknown evidence recipe`); if (template && !template.evidence_recipe_ids.includes(id)) errors.push(`${label} evidence recipe is not declared by template`); }
      if (!Array.isArray(rule.operations) || !rule.operations.length) { errors.push(`${label}.operations must be a non-empty array`); continue; }
      const requiredUserSlots = (template?.required_slots || []).filter(slot => slot?.source_policy?.includes('user')).map(slot => slot.slot_id);
      const optionalUserSlots = (template?.optional_slots || []).filter(slot => slot?.source_policy?.includes('user')).map(slot => slot.slot_id);
      const allUserSlots = [...requiredUserSlots, ...optionalUserSlots];
      const userSlotCategories = new Map(allUserSlots.map(slotId => [
        slotId,
        new Set(template?.ingredient_categories?.[slotId] || []),
      ]));
      const stage = op => ['per_serving','per_serving_by_category'].includes(op.operator) ? 0 : op.operator === 'bounded_sum' ? 1 : op.operator === 'ratio' || (['fixed_addition','scale_by_servings'].includes(op.operator) && op.target?.category === 'liquid') ? 2 : ['fixed_addition','scale_by_servings'].includes(op.operator) ? 3 : 1;
      let last = 0;
      for (const [opIndex, op] of rule.operations.entries()) {
        const opLabel = `${label}.operations[${opIndex}]`;
        if (!object(op)) { errors.push(`${opLabel} must be an object`); continue; }
        if (!OPS.has(op.operator)) { errors.push(`${opLabel} has unknown operator`); continue; }
        allowed(op, new Set(op.operator === 'per_serving' ? ['operator','target','grams'] : op.operator === 'per_serving_by_category' ? ['operator','target','grams_by_category'] : op.operator === 'ratio' ? ['operator','target','numerator','denominator','min','default','max'] : op.operator === 'bounded_sum' ? ['operator','target','grams_per_serving','liquid_credit_grams_per_serving'] : ['operator','target','grams','skip_when']), opLabel, errors);
        if (stage(op) < last) errors.push(`${label}.operations must be ordered as food, liquid, then basic additions`); last = Math.max(last, stage(op));
        if (op.operator === 'per_serving') { targetSlot(op.target, `${opLabel}.target`, allUserSlots, errors); bounds(op.grams, `${opLabel}.grams`, errors); }
        if (op.operator === 'per_serving_by_category') {
          targetSlot(op.target, `${opLabel}.target`, allUserSlots, errors);
          const expectedCategories = userSlotCategories.get(op.target?.slot_id) || new Set();
          if (!object(op.grams_by_category)) {
            errors.push(`${opLabel}.grams_by_category must be an object`);
          } else {
            const actualCategories = Object.keys(op.grams_by_category);
            if (actualCategories.length !== expectedCategories.size
              || actualCategories.some(category => !expectedCategories.has(category))) {
              errors.push(`${opLabel}.grams_by_category must provide exact slot category coverage`);
            }
            for (const [category, categoryBounds] of Object.entries(op.grams_by_category)) {
              bounds(categoryBounds, `${opLabel}.grams_by_category.${category}`, errors);
            }
          }
        }
        if (op.operator === 'bounded_sum') { targetMoisture(op.target, `${opLabel}.target`, errors); bounds(op.grams_per_serving, `${opLabel}.grams_per_serving`, errors); bounds(op.liquid_credit_grams_per_serving, `${opLabel}.liquid_credit_grams_per_serving`, errors); }
        if (op.operator === 'ratio') { bounds({min:op.min,default:op.default,max:op.max}, opLabel, errors); targetBasic(op.target, `${opLabel}.target`, taxonomy, errors, true); exactObject(op.numerator, new Set(['resource']), `${opLabel}.numerator`, errors); if (op.numerator?.resource !== 'retained_liquid_grams') errors.push(`${opLabel}.numerator.resource is invalid`); exactObject(op.denominator, new Set(['slot_id','measure']), `${opLabel}.denominator`, errors); if (op.denominator?.slot_id !== rule.when?.slot_id || op.denominator?.measure !== 'grams') errors.push(`${opLabel}.denominator must measure rule when.slot_id grams`); }
        if (['fixed_addition','scale_by_servings'].includes(op.operator)) {
          bounds(op.grams, `${opLabel}.grams`, errors);
          targetBasic(op.target, `${opLabel}.target`, taxonomy, errors);
          if (op.skip_when != null) validateSkipWhen(op.skip_when, template, `${opLabel}.skip_when`, errors);
        }
      }
      const quantityOperationsFor = slotId => rule.operations.filter(op => ['per_serving','per_serving_by_category'].includes(op?.operator) && op.target?.slot_id === slotId);
      for (const slotId of requiredUserSlots) if (quantityOperationsFor(slotId).length !== 1) errors.push(`${label} requires exactly one per_serving or per_serving_by_category operation for user slot ${slotId}`);
      for (const slotId of optionalUserSlots) if (quantityOperationsFor(slotId).length !== 1) errors.push(`${label} requires exactly one per_serving or per_serving_by_category operation for user slot ${slotId}`);
      if (template?.liquid_constraints?.retained_in_finished_meal && !rule.operations.some(op => op?.operator === 'ratio' || (['fixed_addition','scale_by_servings'].includes(op?.operator) && op.target?.category === 'liquid'))) errors.push(`${label} missing retained liquid operation`);
      exactObject(rule.rounding, new Set(['grams_to_nearest']), `${label}.rounding`, errors);
      if (!object(rule.rounding) || !Number.isInteger(rule.rounding.grams_to_nearest) || rule.rounding.grams_to_nearest <= 0) errors.push(`${label}.rounding.grams_to_nearest must be a positive integer`);
      if (Number.isInteger(rule.rounding?.grams_to_nearest) && rule.rounding.grams_to_nearest > 0) for (const op of rule.operations) for (const field of ['grams','grams_per_serving','liquid_credit_grams_per_serving']) if (number(op?.[field]?.default) && op[field].default > 0 && Math.round(op[field].default / rule.rounding.grams_to_nearest) === 0) errors.push(`${label}.${field} positive default rounds to 0g`);
      validateLiquidDistribution(rule.liquid_distribution, `${label}.liquid_distribution`, errors);
      exactObject(rule.example_context, new Set(['slot_name']), `${label}.example_context`, errors);
      if (!text(rule.example_context?.slot_name)) errors.push(`${label}.example_context.slot_name must be a non-empty string`);
    }
    const refs = new Set();
    for (const template of templateById.values()) if (ACTIVE.has(template.template_id)) for (const ref of template.ratio_constraints || []) refs.add(ref);
    for (const ref of refs) if (!ids.has(ref)) errors.push(`active template ratio reference is unresolved: ${ref}`);
    for (const rule of catalog.rules) if (rule?.when?.template_id && !refs.has(rule.rule_id)) errors.push(`ratio rule is not an active template reference: ${rule.rule_id}`);
    for (const template of templateById.values()) if (ACTIVE.has(template.template_id)) {
      const userRequired = (template.required_slots || []).filter(slot => slot?.source_policy?.includes('user'));
      if (!userRequired.some(slot => { const wanted = new Set(template.ingredient_categories?.[slot.slot_id] || []); const actual = new Set(catalog.rules.filter(rule => rule?.when?.template_id === template.template_id && rule?.when?.slot_id === slot.slot_id).map(rule => rule.when.category)); return wanted.size && wanted.size === actual.size && [...wanted].every(x => actual.has(x)); })) errors.push(`${template.template_id} missing complete required category variant coverage`);
    }
    return errors;
  } catch (error) { return [`ratio DSL validation failed safely: ${error instanceof Error ? error.message : String(error)}`]; }
}

export function prepareRatioCatalog(catalog, context) {
  const draft = structuredClone(catalog);
  const errors = validateRatioDslCatalog(draft, context?.templates, context?.taxonomy, context?.recipes);
  if (errors.length) return { ok:false, errors, catalog:null };
  const freeze = value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      for (const child of Object.values(value)) freeze(child);
      Object.freeze(value);
    }
    return value;
  };
  const prepared = freeze(draft);
  const preparedContext = freeze(structuredClone(context));
  PREPARED.set(prepared, preparedContext);
  return { ok:true, errors:[], catalog:prepared };
}

export function preparedRatioCatalogContext(catalog) { return PREPARED.get(catalog) || null; }

export function assertRatioDslCatalog(catalog, templates, taxonomy, recipes) {
  const errors = validateRatioDslCatalog(catalog, templates, taxonomy, recipes);
  if (errors.length) throw new Error(`invalid ratio DSL catalog:\n${errors.join('\n')}`);
  return catalog;
}

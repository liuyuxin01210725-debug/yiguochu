import { normalizeRatioGrams } from './ratio-dsl.js';
import { validateRiceCookerSourceEvidence } from './rice-cooker-source-evidence-validator.js';

const CATALOG_VERSION = 'rice-meal-catalog-v1-20260802-r7';
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUSES = ['research_only', 'fact_checked', 'planned', 'calibration_preview', 'preview_ready', 'pilot_observed', 'production_approved'];
const STATUS_SET = new Set(STATUSES);
const NUTRITION_GRADES = new Set(['A', 'B', 'C']);
const ADAPTATIONS = new Set(['direct_adaptation', 'process_adaptation', 'style_adaptation', 'not_suitable']);
const IDENTITY_LEVELS = new Set(['generic', 'regional', 'household_reviewed']);
const PREVIEW_NOTICE_CODES = new Set(['household_test_pending_feedback']);
const CONTROLLED_SEASONING_IDS = new Set([
  'soy-sauce', 'cooking-wine', 'sesame-oil', 'oyster-sauce',
  'curry-block', 'sugar', 'salt', 'cooking-oil',
]);
const CONTROLLED_SEASONING_ACTIONS = Object.freeze({
  pre_actions: new Set(['use_controlled_seasoning_outside_cooker']),
  start_actions: new Set(['add_controlled_seasoning_before_start']),
  finish_actions: new Set(['add_controlled_seasoning_after_cook']),
});
const EVIDENCE_KINDS = new Set(['recipe', 'source']);
const EVIDENCE_SUPPORTS = new Set(['identity', 'quantity', 'liquid', 'appliance', 'process']);
const SOURCE_ALLOWED_USE_BY_SUPPORT = Object.freeze({
  identity: new Set(['source_identity', 'manufacturer_recipe_fact', 'recipe_identity', 'regional_identity', 'core_combination']),
  quantity: new Set(['ingredient_quantities', 'fixed_batch_fact']),
  liquid: new Set([
    'added_water_fact', 'liquid_contract_research', 'waterline_semantics',
    'inner_vessel_liquid_fact', 'inner_vessel_added_water_fact', 'rice_measure_ratio_fact',
  ]),
  appliance: new Set(['appliance_program_fact', 'appliance_capability_fact', 'electric_cooker_process_fact']),
  process: new Set([
    'manufacturer_recipe_fact', 'high_level_process_research', 'appliance_program_fact',
    'appliance_capability_fact', 'electric_cooker_process_fact', 'electric_cooker_process_research',
    'double_pot_process_research',
  ]),
});
const SOURCE_FORBIDDEN_USE_BY_SUPPORT = Object.freeze({
  liquid: new Set(['convert_waterline_to_unverified_grams']),
  appliance: new Set(['claim_generic_cooker_equivalence']),
});
const SOURCE_CANNOT_PROVE_BY_SUPPORT = Object.freeze({
  identity: /不能证明[^。]*(?:菜名|地域身份|地域归属|真实名称)/u,
  quantity: /不能证明[^。]*(?:实际克数|对应统一克数|固定批量)/u,
  liquid: /不能证明[^。]*(?:新增液量|新增水量|米水(?:质量|体积)?比|水位线语义)/u,
  appliance: /不能证明[^。]*(?:适用机型|电饭煲程序|器具程序)/u,
  process: /不能证明[^。]*(?:完整操作流程|入锅时机|操作步骤)/u,
});
const RICE_CATEGORIES = new Set(['raw_rice', 'prepared_glutinous_rice']);
const PREVIEW_OR_HIGHER = new Set(['calibration_preview', 'preview_ready', 'pilot_observed', 'production_approved']);
const NUTRITION_ROLE_POLICY = Object.freeze({
  carb: {
    categories: new Set(['raw_rice', 'prepared_glutinous_rice', 'starchy_vegetable']),
    canonicalIds: new Set(['potato']),
    excludedCanonicalIds: new Set(),
  },
  protein: {
    categories: new Set(['chicken', 'pork', 'lamb', 'seafood', 'beef', 'firm_tofu', 'soft_tofu', 'egg', 'legume', 'dry_legume', 'cooked_legume']),
    canonicalIds: new Set(),
    excludedCanonicalIds: new Set(),
  },
  fiber: {
    categories: new Set(['leafy_vegetable', 'cruciferous_vegetable', 'pod_vegetable', 'root_vegetable', 'aromatic_vegetable', 'mushroom', 'dried_fruit', 'legume', 'dry_legume', 'cooked_legume', 'squash_vegetable', 'shoot_vegetable']),
    canonicalIds: new Set(['sweet-corn']),
    excludedCanonicalIds: new Set(['potato']),
  },
});
const SUBSTANTIAL_CARB_GRAMS = 80;
const SUBSTANTIAL_FIBER_GRAMS = 75;
const SUBSTANTIAL_PROTEIN_GRAMS_BY_CATEGORY = Object.freeze({
  chicken: 50,
  pork: 50,
  lamb: 50,
  seafood: 50,
  beef: 50,
  firm_tofu: 90,
  soft_tofu: 90,
  egg: 45,
  legume: 75,
  dry_legume: 30,
  cooked_legume: 75,
});
const SUBSTANTIAL_PROTEIN_GRAMS_BY_CANONICAL_ID = Object.freeze({
  // Pork-rib plans declare bone-in raw weight, not edible lean-pork weight.
  'pork-ribs': 100,
});
const EXCLUSION_FLAGS = new Set([
  'wild_mushroom',
  'ceremonial_glutinous_rice',
  'requires_mid_cook_opening',
]);
// Derived from the seven closed-lid first-stage recipes and their current taxonomy safety contracts.
const FIRST_STAGE_SAFETY_ENDPOINT_CODES = new Set([
  'rice_tender',
  'pork_fully_cooked',
  'lamb_fully_cooked',
  'tender',
  'pit_absent_verified',
  'poultry_fully_cooked',
  'bean_fully_cooked',
  'seafood_fully_cooked',
  'beef_fully_cooked',
  'heated_through',
]);
const PREVIEW_BLOCKED_VARIANT_IDS = Object.freeze({
  wild_mushroom: new Set(['home-wild-mushroom-rice']),
  ceremonial_glutinous_rice: new Set(['home-lotus-leaf-oil-rice']),
  requires_mid_cook_opening: new Set([
    'home-cantonese-cured-meat-claypot-rice',
    'home-cantonese-mushroom-chicken-claypot-rice',
    'home-cantonese-black-bean-pork-rib-claypot-rice',
    'shanghai-salted-pork-rice',
    'home-suzhou-salted-pork-vegetable-rice',
    'home-nanjing-cured-pork-greens-rice',
    'home-nanjing-sausage-greens-rice',
    'home-taiwan-cabbage-mushroom-rice',
    'home-fujian-gai-cai-minced-pork-rice',
    'home-xinjiang-vegetable-pilaf',
    'home-cabbage-tofu-rice',
    'home-mushroom-greens-tofu-rice',
    'home-broccoli-beef-rice',
    'home-greens-minced-pork-rice',
  ]),
});
const CONTROLLED_FINISH_OVERRIDE_VARIANT_IDS = new Set([
  'home-cabbage-tofu-rice',
  'home-broccoli-beef-rice',
  'home-greens-minced-pork-rice',
]);
const CONTROLLED_MID_OPEN_OVERRIDE_VARIANT_IDS = new Set([
  'shanghai-salted-pork-rice',
]);
const FORBIDDEN_FINISH_ONLY_CATEGORIES = new Set([
  'chicken', 'pork', 'lamb', 'beef', 'seafood', 'egg',
]);
const CONTROLLED_FINISH_ONLY_CATEGORIES = new Set(['leafy_vegetable', 'cruciferous_vegetable']);
const TRUSTED_IDENTITY_URL_SUFFIXES = ['gov.cn', 'gov.tw', 'edu.tw'];
const ROOT_FIELDS = new Set(['schema_version', 'catalog_version', 'families']);
const FAMILY_FIELDS = new Set(['family_id', 'variants']);
const VARIANT_FIELDS = new Set([
  'variant_id', 'recipe_id', 'evidence_refs', 'display_name', 'name_label', 'status', 'status_history',
  'identity_level', 'region_codes', 'identity_refs', 'rice', 'ingredients', 'approved_substitutions',
  'forbidden_combinations', 'nutrition_structure', 'cooker_adaptation', 'ratio_rule_ids',
  'safety_endpoints', 'source_refs', 'exclusion_flags', 'review_note',
  'supported_servings', 'collection_candidate_id', 'preview_notice_code', 'controlled_seasonings',
]);
const EVIDENCE_REFERENCE_FIELDS = new Set(['kind', 'id', 'supports']);
const CONTROLLED_SEASONING_FIELDS = new Set([
  'canonical_ingredient_id', 'amount_rule_id', 'required', 'phase', 'action_code',
]);
const REFERENCE_FIELDS = new Set(['title', 'url']);
const IDENTITY_REFERENCE_FIELDS = new Set([
  'usage', 'direct', 'source_kind', 'publisher', 'retrieved_at', 'title', 'url',
]);
const RICE_FIELDS = new Set(['canonical_ingredient_id', 'amount_rule_id', 'action']);
const INGREDIENT_FIELDS = new Set(['canonical_ingredient_id', 'role', 'amount_rule_id', 'action']);
const NUTRITION_FIELDS = new Set(['grade', 'material_contributors']);
const CONTRIBUTOR_FIELDS = new Set(['role', 'canonical_ingredient_id']);
const ADAPTATION_FIELDS = new Set([
  'adaptation', 'closed_lid_continuation', 'requires_mid_cook_opening', 'completion_status',
  'pre_actions', 'start_actions', 'mid_actions', 'finish_actions', 'program', 'active_time_minutes', 'total_time_minutes',
]);
const ACTION_FIELDS = new Set(['order', 'action_code', 'ingredient_ids']);
const REST_ACTION_FIELDS = new Set([...ACTION_FIELDS, 'rest_minutes']);
const MID_ACTION_FIELDS = new Set([
  ...ACTION_FIELDS,
  'timing_basis', 'timing_min', 'timing_max', 'max_open_seconds', 'placement',
  'resume_policy', 'required_post_close_minutes',
]);
const COOKER_PROGRAMS = new Set(['standard_rice']);
const PHASE_ACTION_CODES = Object.freeze({
  pre_actions: new Set([
    'rinse_raw_rice',
    'verify_soaked_glutinous_rice',
    'brown_ground_pork_and_mushrooms_outside_cooker',
    'brown_lamb_and_aromatics_outside_cooker',
    'verify_pitted_dried_fruit',
    'pre_cook_cowpea_pods_outside_cooker',
    'cut_chicken_leg_to_small_pieces',
    'prepare_raw_ingredients',
    'prepare_vegetables',
    'pre_cook_pork_ribs_outside_cooker',
    'pre_cook_pork_ribs_drain_and_discard_liquid',
    'drain_prepared_vegetables_before_loading',
    'brown_ground_pork_outside_cooker',
    'pre_cook_tender_vegetables_outside_cooker',
    'pre_cook_tender_vegetables_drain_and_discard_liquid',
    'pre_saute_materials_outside_cooker',
    'prepare_dried_wood_ear',
  ]),
  start_actions: new Set(['load_inner_pot', 'start_closed_lid_program']),
  mid_actions: new Set(['add_reserved_leafy_vegetable']),
  finish_actions: new Set(['rest_lid_closed', 'verify_safety_endpoints', 'fold_in_pre_cooked_ingredients', 'fluff_and_serve']),
});
const ACTION_REQUIRED_MATERIALS = Object.freeze({
  verify_soaked_glutinous_rice: ['soaked-glutinous-rice'],
  brown_ground_pork_and_mushrooms_outside_cooker: ['ground-pork', 'shiitake'],
  brown_lamb_and_aromatics_outside_cooker: ['lamb-leg'],
  verify_pitted_dried_fruit: ['pitted-dried-jujube'],
  pre_cook_cowpea_pods_outside_cooker: ['fresh-cowpea-pod'],
  cut_chicken_leg_to_small_pieces: ['chicken-leg'],
  pre_cook_pork_ribs_outside_cooker: ['pork-ribs'],
  pre_cook_pork_ribs_drain_and_discard_liquid: ['pork-ribs'],
  brown_ground_pork_outside_cooker: ['ground-pork'],
});
const SAFETY_ENDPOINT_FIELDS = new Set(['canonical_ingredient_id', 'endpoint_code']);
const SUBSTITUTION_FIELDS = new Set(['replaces_canonical_id', 'allowed_canonical_ids']);
const FORBIDDEN_COMBINATION_FIELDS = new Set(['canonical_ingredient_ids', 'reason']);
const COLLECTION_MAPPING_SCOPES = new Set(['exact', 'partial_adaptation']);
// These are controlled source-language labels whose canonical taxonomy spelling differs.
// They are intentionally narrow: an unmapped research label must remain canonical_id: null.
const COLLECTION_LABEL_ALIASES = new Map([
  ['米', new Set(['raw-rice'])],
  ['香米', new Set(['raw-rice'])],
  ['鲜米', new Set(['raw-rice'])],
  ['肉糜', new Set(['ground-pork'])],
  ['豇豆', new Set(['fresh-cowpea-pod'])],
]);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function pushUnknownKeys(errors, value, allowed, label) {
  if (!isPlainObject(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`${label} unknown key ${key}`);
  }
}

function idSet(items, field) {
  return new Set((Array.isArray(items) ? items : [])
    .filter(isPlainObject)
    .map(item => item[field])
    .filter(isNonEmptyString));
}

function canonicalItems(taxonomy) {
  return new Map((Array.isArray(taxonomy?.items) ? taxonomy.items : [])
    .filter(item => isPlainObject(item) && isNonEmptyString(item.canonical_id))
    .map(item => [item.canonical_id, item]));
}

function knownRatioIds(ratioCatalog) {
  return idSet(ratioCatalog?.rules, 'rule_id');
}

function knownRatioRules(ratioCatalog) {
  return new Map((Array.isArray(ratioCatalog?.rules) ? ratioCatalog.rules : [])
    .filter(rule => isPlainObject(rule) && isNonEmptyString(rule.rule_id))
    .map(rule => [rule.rule_id, rule]));
}

function validateReference(ref, label, errors) {
  if (!isPlainObject(ref)) {
    errors.push(`${label} must be an object`);
    return;
  }
  pushUnknownKeys(errors, ref, REFERENCE_FIELDS, label);
  if (!isNonEmptyString(ref.title)) errors.push(`${label}.title must be a non-empty string`);
  if (!isNonEmptyString(ref.url) || !ref.url.startsWith('https://')) errors.push(`${label}.url must be an HTTPS URL`);
}

function isMachineVerifiableIdentityUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    const projectUrl = hostname === 'yiguochu.pages.dev' || hostname.endsWith('.yiguochu.pages.dev');
    const placeholderUrl = ['example.com', 'example.org', 'example.net']
      .some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
    const trustedSource = TRUSTED_IDENTITY_URL_SUFFIXES
      .some(suffix => hostname === suffix || hostname.endsWith(`.${suffix}`));
    return parsed.protocol === 'https:' && !projectUrl && !placeholderUrl && trustedSource;
  } catch {
    return false;
  }
}

function isMachineVerifiableIdentityRef(ref) {
  return isPlainObject(ref)
    && ref.usage === 'identity'
    && ref.direct === true
    && ['government', 'institutional'].includes(ref.source_kind)
    && isNonEmptyString(ref.publisher)
    && isNonEmptyString(ref.retrieved_at)
    && isNonEmptyString(ref.title)
    && isMachineVerifiableIdentityUrl(ref.url);
}

function validateIdentityReference(ref, label, errors) {
  if (!isPlainObject(ref)) {
    errors.push(`${label} must be an object`);
    return;
  }
  pushUnknownKeys(errors, ref, IDENTITY_REFERENCE_FIELDS, label);
  if (ref.usage !== 'identity') errors.push(`${label}.usage must be identity`);
  if (ref.direct !== true) errors.push(`${label}.direct must be true`);
  if (!['government', 'institutional'].includes(ref.source_kind)) errors.push(`${label}.source_kind must be government or institutional`);
  if (!isNonEmptyString(ref.publisher)) errors.push(`${label}.publisher must be a non-empty string`);
  if (!isNonEmptyString(ref.retrieved_at)) errors.push(`${label}.retrieved_at must be a non-empty string`);
  if (!isNonEmptyString(ref.title)) errors.push(`${label}.title must be a non-empty string`);
  // This verifies source eligibility only; it does not infer or endorse page content.
  if (!isMachineVerifiableIdentityUrl(ref.url)) errors.push(`${label}.url must use a trusted direct non-project non-placeholder HTTPS suffix`);
}

function derivedExclusionFlags(variantId) {
  return new Set(Object.entries(PREVIEW_BLOCKED_VARIANT_IDS)
    .filter(([, variantIds]) => variantIds.has(variantId))
    .map(([flag]) => flag));
}

function setsMatch(left, right) {
  return left.size === right.size && [...left].every(value => right.has(value));
}

function normalizedIdentityName(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s（）()_-]+/gu, '');
}

function collectionLabelMatches(label, canonicalId, canonicals) {
  const canonical = canonicals.get(canonicalId);
  const normalized = normalizedIdentityName(label);
  if ([canonical?.display_name, canonical?.canonical_name, ...(canonical?.aliases || [])]
    .some(name => normalizedIdentityName(name) === normalized)) return true;
  return COLLECTION_LABEL_ALIASES.get(normalized)?.has(canonicalId) === true;
}

function collectionCandidateCoreIds(candidate, label, canonicals, errors) {
  const ids = new Set();
  if (!Array.isArray(candidate?.core_ingredients) || candidate.core_ingredients.length === 0) {
    errors.push(`${label}.core_ingredients must be a non-empty structured array`);
    return ids;
  }
  candidate.core_ingredients.forEach((entry, index) => {
    const entryLabel = `${label}.core_ingredients[${index}]`;
    if (!isPlainObject(entry)) {
      errors.push(`${entryLabel} must be an object`);
      return;
    }
    pushUnknownKeys(errors, entry, new Set(['canonical_id', 'label']), entryLabel);
    if (!isNonEmptyString(entry.label)) errors.push(`${entryLabel}.label must be a non-empty string`);
    if (entry.canonical_id !== null && !isNonEmptyString(entry.canonical_id)) {
      errors.push(`${entryLabel}.canonical_id must be a canonical ID or null`);
      return;
    }
    if (isNonEmptyString(entry.canonical_id)) {
      if (!canonicals.has(entry.canonical_id)) errors.push(`${entryLabel}.canonical_id unknown canonical ingredient: ${entry.canonical_id}`);
      else if (isNonEmptyString(entry.label) && !collectionLabelMatches(entry.label, entry.canonical_id, canonicals)) {
        errors.push(`${entryLabel}.label conflicts with canonical_id ${entry.canonical_id}`);
      }
      if (ids.has(entry.canonical_id)) errors.push(`${entryLabel}.canonical_id duplicates another core ingredient`);
      ids.add(entry.canonical_id);
    }
  });
  return ids;
}

function matchesCollectionIdentity(variant, candidate) {
  const displayName = normalizedIdentityName(variant.display_name);
  const controlledNames = [candidate?.name, ...(Array.isArray(candidate?.runtime_name_aliases)
    ? candidate.runtime_name_aliases
    : [])];
  return controlledNames.some(name => normalizedIdentityName(name) === displayName);
}

function collectionContext(collection) {
  if (!isPlainObject(collection)) return null;
  const candidates = new Map((Array.isArray(collection.candidates) ? collection.candidates : [])
    .filter(item => isPlainObject(item) && isNonEmptyString(item.candidate_id))
    .map(item => [item.candidate_id, item]));
  const tracking = new Map((Array.isArray(collection.catalog_tracking) ? collection.catalog_tracking : [])
    .filter(item => isPlainObject(item) && isNonEmptyString(item.runtime_variant_id))
    .map(item => [item.runtime_variant_id, item]));
  const mappings = new Map((Array.isArray(collection.runtime_mappings) ? collection.runtime_mappings : [])
    .filter(item => isPlainObject(item) && isNonEmptyString(item.mapping_id))
    .map(item => [item.mapping_id, item]));
  return { candidates, tracking, mappings };
}

function validateCollectionMapping(variant, label, materialIds, collection, canonicals, errors) {
  if (!isNonEmptyString(variant.collection_candidate_id)) {
    errors.push(`${label}.collection_candidate_id must be a non-empty collection candidate ID`);
    return;
  }
  if (!collection) {
    errors.push(`${label} collection dependency must be a valid collection object`);
    return;
  }
  const candidate = collection.candidates.get(variant.collection_candidate_id);
  if (!candidate) {
    errors.push(`${label}.collection_candidate_id references unknown collection candidate`);
    return;
  }
  if (!matchesCollectionIdentity(variant, candidate)) {
    errors.push(`${label} collection candidate name conflicts with display_name`);
  }
  const tracking = collection.tracking.get(variant.variant_id);
  if (!tracking || tracking.candidate_id !== variant.collection_candidate_id) {
    errors.push(`${label} must have exactly one matching collection tracking row`);
    return;
  }
  const trackedMaterialIds = new Set(Array.isArray(tracking.core_ingredient_ids) ? tracking.core_ingredient_ids : []);
  if (!setsMatch(materialIds, trackedMaterialIds)) {
    errors.push(`${label} collection core ingredient identities must match variant`);
  }
  const candidateCoreIds = collectionCandidateCoreIds(candidate, `${label} collection candidate`, canonicals, errors);
  const mappedCoreIds = new Set(Array.isArray(candidate.mapped_core) ? candidate.mapped_core : []);
  if (mappedCoreIds.size === 0 || mappedCoreIds.size !== candidate.mapped_core?.length) {
    errors.push(`${label} collection candidate mapped_core must be a non-empty unique canonical ID array`);
  }
  for (const canonicalId of mappedCoreIds) {
    if (!canonicals.has(canonicalId)) errors.push(`${label} collection candidate mapped_core unknown canonical ingredient: ${canonicalId}`);
  }
  if (!COLLECTION_MAPPING_SCOPES.has(candidate.mapping_scope)) {
    errors.push(`${label} collection candidate mapping_scope is invalid`);
  } else if (candidate.mapping_scope === 'exact') {
    if (candidate.mapping_note !== undefined) errors.push(`${label} exact collection candidate mapping must not declare mapping_note`);
    if (!setsMatch(candidateCoreIds, mappedCoreIds)) {
      errors.push(`${label} exact collection candidate core ingredient identities must match mapped_core`);
    }
  } else if (!isNonEmptyString(candidate.mapping_note)) {
    errors.push(`${label} partial_adaptation collection candidate requires mapping_note`);
  }
  if (!setsMatch(materialIds, mappedCoreIds)) {
    errors.push(`${label} collection candidate core ingredient identities must match variant`);
  }
  if (!setsMatch(trackedMaterialIds, mappedCoreIds)) {
    errors.push(`${label} collection candidate mapped_core must match tracking`);
  }
  const mapping = collection.mappings.get(tracking.reverse_mapping_id);
  if (!mapping || mapping.candidate_id !== variant.collection_candidate_id || mapping.tracking_id !== tracking.tracking_id) {
    errors.push(`${label} collection reverse mapping must match variant and candidate`);
  }
  const expectedTrackingStatus = variant.status === 'calibration_preview' ? 'calibration_ready'
    : variant.status === 'preview_ready' ? 'runtime_ready'
    : variant.status === 'planned' ? 'planned' : null;
  if (expectedTrackingStatus && tracking.status !== expectedTrackingStatus) {
    errors.push(`${label} collection tracking status must match variant status`);
  }
  if (candidate.nutrition_grade === 'C') {
    errors.push(`${label} cannot activate a nutrition grade C collection candidate`);
  }
  if (candidate.status === 'excluded') {
    errors.push(`${label} cannot activate an excluded collection candidate`);
  }
  const candidateStatusByCatalogStatus = {
    research_only: new Set(['identity_only', 'research_candidate']),
    fact_checked: new Set(['research_candidate']),
    planned: new Set(['planned']),
    calibration_preview: new Set(['calibration_ready']),
    preview_ready: new Set(['runtime_ready']),
    pilot_observed: new Set(['runtime_ready']),
    production_approved: new Set(['runtime_ready']),
  };
  const allowedCandidateStatuses = candidateStatusByCatalogStatus[variant.status];
  if (allowedCandidateStatuses && !allowedCandidateStatuses.has(candidate.status)) {
    const expected = [...allowedCandidateStatuses].join(' or ');
    errors.push(`${label} ${variant.status} must map to a ${expected} collection candidate`);
  }
  if (variant.status === 'preview_ready' && !['A', 'B'].includes(candidate.nutrition_grade)) {
    errors.push(`${label} preview_ready must map to an A/B runtime_ready collection candidate`);
  }
}

function validateKnownCanonicalId(value, label, canonicals, errors) {
  if (!isNonEmptyString(value)) {
    errors.push(`${label} must be a non-empty canonical ingredient ID`);
    return null;
  }
  if (!canonicals.has(value)) {
    errors.push(`${label} unknown canonical ingredient: ${value}`);
    return null;
  }
  return canonicals.get(value);
}

function validateKnownRatioId(value, label, ratios, errors) {
  if (!isNonEmptyString(value)) {
    errors.push(`${label} must be a non-empty ratio rule ID`);
  } else if (!ratios.has(value)) {
    errors.push(`${label} unknown ratio rule: ${value}`);
  }
}

function validateStatus(variant, label, errors) {
  if (!STATUS_SET.has(variant.status)) {
    errors.push(`${label}.status must be one of ${STATUSES.join('|')}`);
    return;
  }
  if (!Array.isArray(variant.status_history) || variant.status_history.length === 0) {
    errors.push(`${label}.status_history must record every completed stage`);
    return;
  }
  const promotionStatuses = ['research_only', 'fact_checked', 'planned', 'preview_ready', 'pilot_observed', 'production_approved'];
  const expected = variant.status === 'calibration_preview'
    ? ['research_only', 'fact_checked', 'planned', 'calibration_preview']
    : promotionStatuses.slice(0, promotionStatuses.indexOf(variant.status) + 1);
  if (variant.status_history.length !== expected.length
    || variant.status_history.some((status, index) => status !== expected[index])) {
    errors.push(`${label}.status_history must progress one stage at a time to status`);
  }
}

function validateMaterialAmountRule(value, label, status, ratios, errors) {
  if (value === null && !PREVIEW_OR_HIGHER.has(status)) return;
  if (!isNonEmptyString(value)) {
    errors.push(`${label} major ingredient must declare amount_rule_id`);
    return;
  }
  validateKnownRatioId(value, label, ratios, errors);
}

function validateIngredient(item, label, canonicals, ratios, status, errors) {
  if (!isPlainObject(item)) {
    errors.push(`${label} must be an object`);
    return null;
  }
  pushUnknownKeys(errors, item, INGREDIENT_FIELDS, label);
  const canonical = validateKnownCanonicalId(item.canonical_ingredient_id, label, canonicals, errors);
  if (!isNonEmptyString(item.role)) errors.push(`${label}.role must be a non-empty string`);
  validateMaterialAmountRule(item.amount_rule_id, label, status, ratios, errors);
  if (!isNonEmptyString(item.action)) errors.push(`${label} major ingredient must declare action`);
  return canonical;
}

function nutritionRoleCompatible(role, canonicalId, category) {
  const policy = NUTRITION_ROLE_POLICY[role];
  return Boolean(policy
    && !policy.excludedCanonicalIds.has(canonicalId)
    && (policy.categories.has(category) || policy.canonicalIds.has(canonicalId)));
}

function ruleQuantifiesMaterial(rule, canonicalId, { executableOnly = false, canonicals = new Map() } = {}) {
  if (!isPlainObject(rule) || !Array.isArray(rule.operations)) return false;
  const canonical = canonicals.get(canonicalId);
  return rule.operations.some(operation => (
    isPlainObject(operation)
    && (
      (operation.target?.canonical_id === canonicalId
        && (operation.operator === 'per_serving'
          || (!executableOnly && operation.operator === 'reference_quantity')))
      || (operation.operator === 'allocate_group_total_per_serving'
        && operation.member_targets?.some(target => target?.canonical_id === canonicalId))
      || (['fixed_addition', 'scale_by_servings'].includes(operation.operator)
        && canonical
        && operation.target?.name === canonical.display_name
        && operation.target?.category === canonical.category)
    )
  ));
}

function validateControlledSeasonings(variant, label, context, errors) {
  const rows = variant.controlled_seasonings;
  if (!Array.isArray(rows)) {
    errors.push(`${label}.controlled_seasonings must be an array`);
    return new Set();
  }
  const ids = new Set();
  const declaredRatioIds = new Set(Array.isArray(variant.ratio_rule_ids) ? variant.ratio_rule_ids : []);
  for (const [index, row] of rows.entries()) {
    const rowLabel = `${label}.controlled_seasonings[${index}]`;
    if (!isPlainObject(row)) {
      errors.push(`${rowLabel} must be an object`);
      continue;
    }
    pushUnknownKeys(errors, row, CONTROLLED_SEASONING_FIELDS, rowLabel);
    const canonical = validateKnownCanonicalId(row.canonical_ingredient_id, rowLabel, context.canonicals, errors);
    if (canonical && !CONTROLLED_SEASONING_IDS.has(row.canonical_ingredient_id)) {
      errors.push(`${rowLabel}.canonical_ingredient_id is not an allowed controlled seasoning`);
    }
    if (ids.has(row.canonical_ingredient_id)) {
      errors.push(`${label}.controlled_seasonings must not contain duplicate canonical ingredients`);
    }
    ids.add(row.canonical_ingredient_id);
    if (!isNonEmptyString(row.amount_rule_id)) {
      errors.push(`${rowLabel}.amount_rule_id must be a non-empty ratio rule ID`);
    } else {
      validateKnownRatioId(row.amount_rule_id, `${rowLabel}.amount_rule_id`, context.ratios, errors);
      if (!declaredRatioIds.has(row.amount_rule_id)) {
        errors.push(`${rowLabel}.amount_rule_id must be declared in ratio_rule_ids`);
      }
      const rule = context.ratioRules.get(row.amount_rule_id);
      if (rule && !ruleQuantifiesMaterial(rule, row.canonical_ingredient_id, {
        executableOnly: PREVIEW_OR_HIGHER.has(variant.status),
        canonicals: context.canonicals,
      })) {
        errors.push(`${rowLabel}.amount_rule_id does not quantify ${row.canonical_ingredient_id}`);
      }
    }
    if (row.required !== true) errors.push(`${rowLabel}.required must be true`);
    if (!Object.hasOwn(CONTROLLED_SEASONING_ACTIONS, row.phase)
        || !CONTROLLED_SEASONING_ACTIONS[row.phase].has(row.action_code)) {
      errors.push(`${rowLabel} phase/action_code pair is not allowed`);
    }
  }
  return ids;
}

export function resolveDefaultPerServingMaterialGrams(variant, ratioCatalog, servings = 1) {
  if (!Number.isSafeInteger(servings) || servings <= 0) {
    throw new Error('servings must be a positive integer');
  }
  const amounts = new Map();
  const ratioRules = knownRatioRules(ratioCatalog);
  const addAmount = (canonicalId, grams) => {
    if (amounts.has(canonicalId)) throw new Error(`duplicate executable material amount for ${canonicalId}`);
    amounts.set(canonicalId, grams);
  };
  for (const ruleId of Array.isArray(variant?.ratio_rule_ids) ? variant.ratio_rule_ids : []) {
    const rule = ratioRules.get(ruleId);
    if (!rule) throw new Error(`missing declared ratio rule ${ruleId}`);
    if (rule.execution_mode !== 'executable') continue;
    if (!Array.isArray(rule.operations)) throw new Error(`executable ratio rule ${ruleId} requires operations`);
    const nearest = rule.rounding?.grams_to_nearest;
    if (!Number.isSafeInteger(nearest) || nearest <= 0) {
      throw new Error(`executable ratio rule ${ruleId} rounding must be a positive integer`);
    }
    const normalizeWholePot = value => {
      let normalized;
      try {
        normalized = normalizeRatioGrams(value, nearest);
      } catch (_error) {
        throw new Error(`executable ratio rule ${ruleId} grams do not normalize to a positive integer`);
      }
      if (normalized <= 0) {
        throw new Error(`executable ratio rule ${ruleId} grams do not normalize to a positive integer`);
      }
      return normalized;
    };
    for (const operation of rule.operations) {
      if (!isPlainObject(operation)) {
        throw new Error(`executable operation in ${ruleId} must be an object`);
      }
      if (operation.operator === 'per_serving') {
        const canonicalId = operation.target?.canonical_id;
        const grams = operation.grams?.default;
        if (!isNonEmptyString(canonicalId)
            || !Number.isFinite(grams) || grams <= 0
            || operation.grams?.min !== grams || operation.grams?.max !== grams) {
          throw new Error(`executable per_serving operation in ${ruleId} requires positive exact grams`);
        }
        addAmount(canonicalId, normalizeWholePot(grams * servings) / servings);
        continue;
      }
      if (operation.operator !== 'allocate_group_total_per_serving') continue;
      if (operation.allocation_policy !== 'equal_split_ordered_residual') {
        throw new Error(`executable group allocation policy in ${ruleId} is invalid`);
      }
      if (!Array.isArray(operation.member_targets) || operation.member_targets.length < 2
          || operation.member_targets.some(target => !isNonEmptyString(target?.canonical_id))) {
        throw new Error(`executable group in ${ruleId} requires at least two valid members`);
      }
      const memberIds = operation.member_targets.map(target => target.canonical_id);
      if (new Set(memberIds).size !== memberIds.length) {
        throw new Error(`executable group in ${ruleId} requires unique members`);
      }
      const groupGrams = operation.grams?.default;
      if (!Number.isFinite(groupGrams) || groupGrams <= 0
          || operation.grams?.min !== groupGrams || operation.grams?.max !== groupGrams) {
        throw new Error(`executable group in ${ruleId} requires positive exact grams`);
      }
      const lockedTotal = normalizeWholePot(groupGrams * servings);
      const totalUnits = lockedTotal / nearest;
      if (!Number.isSafeInteger(totalUnits) || totalUnits < memberIds.length) {
        throw new Error(`executable group in ${ruleId} cannot allocate at least one rounding unit per member`);
      }
      const baseUnits = Math.floor(totalUnits / memberIds.length);
      const residualUnits = totalUnits % memberIds.length;
      memberIds.forEach((canonicalId, index) => {
        const wholePotGrams = (baseUnits + (index < residualUnits ? 1 : 0)) * nearest;
        addAmount(canonicalId, wholePotGrams / servings);
      });
      continue;
    }
    for (const operation of rule.operations) {
      if (['per_serving', 'allocate_group_total_per_serving', 'ratio', 'fixed_addition', 'scale_by_servings']
        .includes(operation.operator)) continue;
      throw new Error(`unsupported executable operator ${String(operation.operator)} in ${ruleId}`);
    }
  }
  return amounts;
}

export function validateSubstantialNutrition(variant, taxonomy, ratioCatalog) {
  const errors = [];
  const nutrition = variant?.nutrition_structure;
  if (!isPlainObject(nutrition) || !Array.isArray(nutrition.material_contributors)) return errors;
  const canonicals = canonicalItems(taxonomy);
  const servingSizes = Array.isArray(variant?.supported_servings) && variant.supported_servings.length
    ? variant.supported_servings
    : [1];

  for (const servings of servingSizes) {
    const servingLabel = `${servings} servings`;
    let amounts;
    try {
      amounts = resolveDefaultPerServingMaterialGrams(variant, ratioCatalog, servings);
    } catch (error) {
      errors.push(`executable nutrition quantities are invalid at ${servingLabel}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    const substantialRoles = new Set();
    let fiberGrams = 0;
    let hasFiberContributor = false;
    const fiberContributorIds = new Set();

    for (const contributor of nutrition.material_contributors) {
      if (!isPlainObject(contributor) || !isNonEmptyString(contributor.canonical_ingredient_id)) continue;
      const canonicalId = contributor.canonical_ingredient_id;
      const canonical = canonicals.get(canonicalId);
      if (!canonical || !nutritionRoleCompatible(contributor.role, canonicalId, canonical.category)) continue;
      const grams = amounts.get(canonicalId);
      if (!Number.isFinite(grams)) {
        errors.push(`${canonicalId} has no executable default grams for ${contributor.role} role at ${servingLabel}`);
        continue;
      }
      if (contributor.role === 'carb') {
        if (canonical.category === 'raw_rice' && grams >= SUBSTANTIAL_CARB_GRAMS) substantialRoles.add('carb');
        else errors.push(`${canonicalId} resolves to ${grams}g/person below carb threshold ${SUBSTANTIAL_CARB_GRAMS}g/person at ${servingLabel}`);
        continue;
      }
      if (contributor.role === 'protein') {
        const threshold = SUBSTANTIAL_PROTEIN_GRAMS_BY_CANONICAL_ID[canonicalId]
          ?? SUBSTANTIAL_PROTEIN_GRAMS_BY_CATEGORY[canonical.category];
        if (Number.isFinite(threshold) && grams >= threshold) substantialRoles.add('protein');
        else if (Number.isFinite(threshold)) errors.push(`${canonicalId} resolves to ${grams}g/person below protein threshold ${threshold}g/person at ${servingLabel}`);
        continue;
      }
      if (contributor.role === 'fiber') {
        hasFiberContributor = true;
        if (!fiberContributorIds.has(canonicalId)) {
          fiberContributorIds.add(canonicalId);
          fiberGrams += grams;
        }
      }
    }

    if (hasFiberContributor) {
      if (fiberGrams >= SUBSTANTIAL_FIBER_GRAMS) substantialRoles.add('fiber');
      else errors.push(`fiber contributors resolve to ${fiberGrams}g/person below fiber threshold ${SUBSTANTIAL_FIBER_GRAMS}g/person at ${servingLabel}`);
    }
    if (nutrition.grade === 'A' && !['carb', 'protein', 'fiber'].every(role => substantialRoles.has(role))) {
      errors.push(`nutrition grade A requires substantial carb, protein, and fiber executable defaults at ${servingLabel}`);
    }
    if (nutrition.grade === 'B'
        && (!substantialRoles.has('carb')
          || (!substantialRoles.has('protein') && !substantialRoles.has('fiber')))) {
      errors.push(`nutrition grade B requires substantial carb plus protein or fiber executable defaults at ${servingLabel}`);
    }
  }
  return errors;
}

function executableLiquidOperationCount(rules) {
  return rules.reduce((count, rule) => count + (Array.isArray(rule?.operations)
    ? rule.operations.filter(operation => (
      isPlainObject(operation)
      && operation.target?.category === 'liquid'
      && ['per_serving', 'ratio', 'fixed_addition', 'scale_by_servings'].includes(operation.operator)
    )).length
    : 0), 0);
}

function validateRatioBindings(variant, label, materialRules, context, errors) {
  const ratioRuleIds = Array.isArray(variant.ratio_rule_ids) ? variant.ratio_rule_ids : [];
  const declaredRatioIds = new Set(ratioRuleIds.filter(isNonEmptyString));
  const declaredRulePairs = ratioRuleIds
    .map((ruleId, index) => ({ index, rule: context.ratioRules.get(ruleId) }))
    .filter(pair => pair.rule);
  const declaredRules = declaredRulePairs.map(pair => pair.rule);

  for (const { index, rule } of declaredRulePairs) {
    const bindsVariant = rule.when?.variant_id === variant.variant_id;
    const bindsLegacyRecipe = isNonEmptyString(variant.recipe_id)
      && rule.when?.recipe_id === variant.recipe_id;
    if (!bindsVariant && !bindsLegacyRecipe) {
      const legacySuffix = isNonEmptyString(variant.recipe_id)
        ? ` or must bind to recipe_id ${variant.recipe_id}`
        : '';
      errors.push(`${label}.ratio_rule_ids[${index}] must bind to variant_id ${variant.variant_id}${legacySuffix}`);
    }
    if (PREVIEW_OR_HIGHER.has(variant.status) && rule.execution_mode !== 'executable') {
      errors.push(`${label} preview_ready ratio rule must be executable`);
    }
  }

  for (const material of materialRules) {
    const { canonicalId, amountRuleId, materialLabel } = material;
    if (!isNonEmptyString(amountRuleId)) continue;
    if (!declaredRatioIds.has(amountRuleId)) {
      errors.push(`${materialLabel}.amount_rule_id must be declared in ratio_rule_ids`);
      continue;
    }
    const rule = context.ratioRules.get(amountRuleId);
    if (!rule) continue;
    const executableOnly = PREVIEW_OR_HIGHER.has(variant.status);
    if (!ruleQuantifiesMaterial(rule, canonicalId, { executableOnly })) {
      errors.push(`${materialLabel}.amount_rule_id does not quantify ${canonicalId}`);
    }
  }

  if (PREVIEW_OR_HIGHER.has(variant.status)
      && executableLiquidOperationCount(declaredRules.filter(rule => rule.execution_mode === 'executable')) !== 1) {
    errors.push(`${label} preview_ready requires exactly one executable liquid operation`);
  }
  if (PREVIEW_OR_HIGHER.has(variant.status)
      && declaredRules.some(rule => !isPlainObject(rule.liquid_contract))) {
    errors.push(`${label} preview_ready requires explicit liquid contract semantics`);
  }

  if (variant.status === 'planned'
      && materialRules.some(material => material.amountRuleId === null)
      && !String(variant.review_note || '').includes('未量化')) {
    errors.push(`${label} planned unquantified materials require a review_note that explains 未量化 gap`);
  }
}

function sourceSupportErrors(entry, support) {
  const errors = [];
  const allowedUses = new Set(Array.isArray(entry?.rights?.allowed_use) ? entry.rights.allowed_use : []);
  const capabilityUses = SOURCE_ALLOWED_USE_BY_SUPPORT[support] || new Set();
  if (![...capabilityUses].some(use => allowedUses.has(use))) {
    errors.push(`support ${support} is not allowed by source rights`);
  }
  if (entry?.verdict?.status === 'research_only' && support !== 'identity') {
    errors.push(`research_only source may support identity only, not ${support}`);
  }
  const forbiddenUses = new Set(Array.isArray(entry?.rights?.forbidden_use) ? entry.rights.forbidden_use : []);
  if ([...(SOURCE_FORBIDDEN_USE_BY_SUPPORT[support] || [])].some(use => forbiddenUses.has(use))) {
    errors.push(`support ${support} conflicts with forbidden_use`);
  }
  const cannotProve = Array.isArray(entry?.cannot_prove) ? entry.cannot_prove.join('；') : '';
  if (SOURCE_CANNOT_PROVE_BY_SUPPORT[support]?.test(cannotProve)) {
    errors.push(`support ${support} conflicts with cannot_prove`);
  }
  return errors;
}

function recipeSupportErrors(recipe, support, context) {
  const recipeId = recipe?.id;
  const evidenceRules = [...context.ratioRules.values()].filter(rule => (
    rule?.when?.recipe_id === recipeId
    || (Array.isArray(rule?.evidence_recipe_ids) && rule.evidence_recipe_ids.includes(recipeId))
  ));
  const hasQuantity = evidenceRules.some(rule => Array.isArray(rule?.operations)
    && rule.operations.some(operation => [
      'reference_quantity', 'per_serving', 'allocate_group_total_per_serving',
    ].includes(operation?.operator)));
  const hasLiquid = evidenceRules.some(rule => Array.isArray(rule?.operations)
    && rule.operations.some(operation => operation?.operator === 'ratio'
      || ['liquid'].includes(operation?.target?.category)));
  const capabilities = {
    identity: isNonEmptyString(recipeId) && isNonEmptyString(recipe?.name),
    quantity: hasQuantity,
    liquid: hasLiquid,
    appliance: false,
    process: Array.isArray(recipe?.technique) && recipe.technique.some(isNonEmptyString),
  };
  return capabilities[support] ? [] : [`recipe evidence ${recipeId} cannot support ${support}`];
}

function validateEvidenceReferences(evidenceRefs, label, context, errors) {
  if (!Array.isArray(evidenceRefs) || evidenceRefs.length === 0) {
    errors.push(`${label}.evidence_refs must be a non-empty array`);
    return;
  }
  const seen = new Set();
  for (const [index, ref] of evidenceRefs.entries()) {
    const refLabel = `${label}.evidence_refs[${index}]`;
    if (!isPlainObject(ref)) {
      errors.push(`${refLabel} must be an object`);
      continue;
    }
    pushUnknownKeys(errors, ref, EVIDENCE_REFERENCE_FIELDS, refLabel);
    if (!EVIDENCE_KINDS.has(ref.kind)) {
      errors.push(`${refLabel}.kind must be recipe or source`);
    }
    if (!ID_RE.test(ref.id || '')) {
      errors.push(`${refLabel}.id must be a kebab-case ID`);
    } else if (ref.kind === 'recipe' && !context.recipeIds.has(ref.id)) {
      errors.push(`${refLabel} unknown recipe evidence id: ${ref.id}`);
    } else if (ref.kind === 'source' && !context.sourceEvidenceById.has(ref.id)) {
      errors.push(`${refLabel} unknown source evidence id: ${ref.id}`);
    }
    const identity = `${String(ref.kind)}:${String(ref.id)}`;
    if (seen.has(identity)) errors.push(`${label}.evidence_refs must not contain duplicate kind/id pairs`);
    seen.add(identity);
    if (!Array.isArray(ref.supports) || ref.supports.length === 0) {
      errors.push(`${refLabel}.supports must be a non-empty array`);
      continue;
    }
    const seenSupports = new Set();
    for (const support of ref.supports) {
      if (!EVIDENCE_SUPPORTS.has(support)) {
        errors.push(`${refLabel}.supports contains unsupported value: ${String(support)}`);
      } else if (ref.kind === 'recipe' && context.recipeById.has(ref.id)) {
        for (const recipeError of recipeSupportErrors(context.recipeById.get(ref.id), support, context)) {
          errors.push(`${refLabel} ${recipeError}`);
        }
      } else if (ref.kind === 'source' && context.sourceEvidenceById.has(ref.id)) {
        for (const sourceError of sourceSupportErrors(context.sourceEvidenceById.get(ref.id), support)) {
          errors.push(`${refLabel} ${sourceError}`);
        }
      }
      if (seenSupports.has(support)) errors.push(`${refLabel}.supports must not contain duplicates`);
      seenSupports.add(support);
    }
  }
}

function validateNutrition(nutrition, label, materialIds, controlledSeasoningIds, canonicals, status, errors) {
  if (!isPlainObject(nutrition)) {
    errors.push(`${label}.nutrition_structure must be an object`);
    return;
  }
  pushUnknownKeys(errors, nutrition, NUTRITION_FIELDS, `${label}.nutrition_structure`);
  if (!NUTRITION_GRADES.has(nutrition.grade)) {
    errors.push(`${label}.nutrition_structure.grade must be one of A|B|C`);
    return;
  }
  if (!Array.isArray(nutrition.material_contributors)) {
    errors.push(`${label}.nutrition_structure.material_contributors must be an array`);
    return;
  }
  const roles = new Set();
  for (const [index, contributor] of nutrition.material_contributors.entries()) {
    const contributorLabel = `${label}.nutrition_structure.material_contributors[${index}]`;
    if (!isPlainObject(contributor)) {
      errors.push(`${contributorLabel} must be an object`);
      continue;
    }
    pushUnknownKeys(errors, contributor, CONTRIBUTOR_FIELDS, contributorLabel);
    if (!isNonEmptyString(contributor.role)) errors.push(`${contributorLabel}.role must be a non-empty string`);
    else roles.add(contributor.role);
    const canonical = validateKnownCanonicalId(contributor.canonical_ingredient_id, contributorLabel, canonicals, errors);
    if (controlledSeasoningIds.has(contributor.canonical_ingredient_id)
        && ['protein', 'fiber'].includes(contributor.role)) {
      errors.push(`${contributorLabel} controlled seasoning ${contributor.canonical_ingredient_id} cannot be a protein or fiber contributor`);
    }
    if (canonical && !materialIds.has(contributor.canonical_ingredient_id)) {
      errors.push(`${contributorLabel}.canonical_ingredient_id must be a material ingredient`);
    }
    if (canonical && isNonEmptyString(contributor.role)
      && !nutritionRoleCompatible(contributor.role, contributor.canonical_ingredient_id, canonical.category)) {
      errors.push(`${contributorLabel}.role ${contributor.role} is incompatible with ${contributor.canonical_ingredient_id} (${canonical.category})`);
    }
  }
  if (nutrition.grade === 'A' && !['carb', 'protein', 'fiber'].every(role => roles.has(role))) {
    errors.push(`${label} nutrition grade A requires carb, protein, and fiber material contributors`);
  }
  if (nutrition.grade === 'B' && roles.size < 2) {
    errors.push(`${label} nutrition grade B requires at least two material contributor roles`);
  }
  if (nutrition.grade === 'C' && PREVIEW_OR_HIGHER.has(status)) {
    errors.push(`${label} nutrition grade C cannot be preview_ready or beyond`);
  }
}

function validateActionList(value, phase, label, materials, actionMaterialIds, errors) {
  const phaseLabel = `${label}.cooker_adaptation.${phase}`;
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${phaseLabel} must be a non-empty ordered action array`);
    return;
  }
  for (const [index, action] of value.entries()) {
    const actionLabel = `${phaseLabel}[${index}]`;
    if (!isPlainObject(action)) {
      errors.push(`${actionLabel} must be an object`);
      continue;
    }
    const allowedActionFields = phase === 'mid_actions'
      ? MID_ACTION_FIELDS
      : (phase === 'finish_actions' && action.action_code === 'rest_lid_closed' ? REST_ACTION_FIELDS : ACTION_FIELDS);
    pushUnknownKeys(errors, action, allowedActionFields, actionLabel);
    if (!Number.isInteger(action.order) || action.order !== index + 1) {
      errors.push(`${phaseLabel} must have contiguous order starting at 1`);
    }
    if (!PHASE_ACTION_CODES[phase].has(action.action_code)) {
      errors.push(`${actionLabel}.action_code is not allowed`);
    }
    if (!Array.isArray(action.ingredient_ids) || action.ingredient_ids.length === 0
      || new Set(action.ingredient_ids).size !== action.ingredient_ids.length) {
      errors.push(`${actionLabel}.ingredient_ids must be a non-empty unique material ingredient array`);
      continue;
    }
    for (const [ingredientIndex, canonicalId] of action.ingredient_ids.entries()) {
      if (!materials.has(canonicalId)) {
        errors.push(`${actionLabel}.ingredient_ids[${ingredientIndex}] must be a material ingredient`);
      } else {
        actionMaterialIds.add(canonicalId);
      }
    }
    for (const requiredCanonicalId of ACTION_REQUIRED_MATERIALS[action.action_code] || []) {
      if (!action.ingredient_ids.includes(requiredCanonicalId)) {
        errors.push(`${actionLabel}.action_code must reference ${requiredCanonicalId}`);
      }
    }
  }
}

function controlledMidCycleProtocol(variant, materials, safetyEndpoints) {
  const eligible = CONTROLLED_MID_OPEN_OVERRIDE_VARIANT_IDS.has(variant.variant_id)
    && PREVIEW_OR_HIGHER.has(variant.status);
  if (!eligible) return { eligible: false, ok: false, heldIds: new Set(), errors: [] };
  const adaptation = isPlainObject(variant.cooker_adaptation) ? variant.cooker_adaptation : {};
  const midActions = Array.isArray(adaptation.mid_actions) ? adaptation.mid_actions : [];
  const startActions = Array.isArray(adaptation.start_actions) ? adaptation.start_actions : [];
  const finishActions = Array.isArray(adaptation.finish_actions) ? adaptation.finish_actions : [];
  const protocolErrors = [];
  if (JSON.stringify(variant.supported_servings) !== JSON.stringify([3])) {
    protocolErrors.push('supported_servings must equal the reviewed batch [3]');
  }
  if (midActions.length !== 1 || midActions[0]?.action_code !== 'add_reserved_leafy_vegetable') {
    protocolErrors.push('requires add_reserved_leafy_vegetable exactly once');
  }
  const mid = midActions[0] || {};
  const heldIds = new Set(mid.ingredient_ids || []);
  const heldItems = [...heldIds].map(id => materials.get(id)).filter(Boolean);
  if (heldIds.size !== 1 || heldItems.length !== 1
      || heldItems[0].category !== 'leafy_vegetable' || heldItems[0].cook_speed !== 'fast') {
    protocolErrors.push('mid-cycle ingredient must be one fast leafy vegetable');
  }
  const load = startActions.find(action => action?.action_code === 'load_inner_pot');
  if ([...heldIds].some(canonicalId => load?.ingredient_ids?.includes(canonicalId))) {
    protocolErrors.push('mid-cycle ingredient must stay out of load_inner_pot');
  }
  const endpointIds = new Set((Array.isArray(safetyEndpoints) ? safetyEndpoints : [])
    .map(endpoint => endpoint?.canonical_ingredient_id).filter(isNonEmptyString));
  if ([...heldIds].some(canonicalId => !endpointIds.has(canonicalId))) {
    protocolErrors.push('mid-cycle ingredient requires a safety endpoint');
  }
  if (mid.timing_basis !== 'program_remaining_minutes' || mid.timing_min !== 10 || mid.timing_max !== 10
      || mid.required_post_close_minutes !== 10) {
    protocolErrors.push('mid-cycle timing must be exactly ten remaining minutes');
  }
  if (mid.max_open_seconds !== 30) {
    protocolErrors.push('mid-cycle opening must close within 30 seconds');
  }
  if (mid.placement !== 'top_no_stir') {
    protocolErrors.push('mid-cycle leafy vegetable must be placed on top without stirring');
  }
  if (mid.resume_policy !== 'same_program_auto_resume') {
    protocolErrors.push('mid-cycle action must resume the same program automatically');
  }
  const rest = finishActions.filter(action => action?.action_code === 'rest_lid_closed');
  if (rest.length !== 1 || rest[0]?.rest_minutes !== 5) {
    protocolErrors.push('controlled Shanghai finish must rest closed for 5 minutes');
  }
  if (adaptation.adaptation !== 'process_adaptation') {
    protocolErrors.push('controlled mid-cycle protocol requires process_adaptation');
  }
  if (adaptation.requires_mid_cook_opening !== true) {
    protocolErrors.push('controlled mid-cycle protocol requires explicit mid-cook opening');
  }
  return {
    eligible,
    ok: protocolErrors.length === 0,
    heldIds,
    errors: [...new Set(protocolErrors)],
  };
}

function controlledFinishProtocol(variant, materials, safetyEndpoints) {
  const eligible = CONTROLLED_FINISH_OVERRIDE_VARIANT_IDS.has(variant.variant_id)
    && PREVIEW_OR_HIGHER.has(variant.status);
  if (!eligible) return { eligible: false, ok: false, heldIds: new Set(), errors: [] };
  const adaptation = isPlainObject(variant.cooker_adaptation) ? variant.cooker_adaptation : {};
  const preActions = Array.isArray(adaptation.pre_actions) ? adaptation.pre_actions : [];
  const startActions = Array.isArray(adaptation.start_actions) ? adaptation.start_actions : [];
  const finishActions = Array.isArray(adaptation.finish_actions) ? adaptation.finish_actions : [];
  const pre = preActions.filter(action => [
    'pre_cook_tender_vegetables_outside_cooker',
    'pre_cook_tender_vegetables_drain_and_discard_liquid',
  ].includes(action?.action_code));
  const folds = finishActions.filter(action => action?.action_code === 'fold_in_pre_cooked_ingredients');
  const protocolErrors = [];
  if (pre.length !== 1) protocolErrors.push('requires pre_cook_tender_vegetables_outside_cooker exactly once');
  if (folds.length !== 1) protocolErrors.push('requires fold_in_pre_cooked_ingredients exactly once');
  const preIds = new Set(pre[0]?.ingredient_ids || []);
  const foldIds = new Set(folds[0]?.ingredient_ids || []);
  const heldIds = new Set([...preIds, ...foldIds]);
  if (!preIds.size || !foldIds.size || !setsMatch(preIds, foldIds)) {
    protocolErrors.push('pre-cooked and finish-fold ingredient sets must match');
  }
  const load = startActions.find(action => action?.action_code === 'load_inner_pot');
  if ([...heldIds].some(canonicalId => load?.ingredient_ids?.includes(canonicalId))) {
    protocolErrors.push('finish-only ingredient must stay out of load_inner_pot');
  }
  const endpointIds = new Set((Array.isArray(safetyEndpoints) ? safetyEndpoints : [])
    .map(endpoint => endpoint?.canonical_ingredient_id).filter(isNonEmptyString));
  for (const canonicalId of heldIds) {
    const item = materials.get(canonicalId);
    if (item && FORBIDDEN_FINISH_ONLY_CATEGORIES.has(item.category)) {
      protocolErrors.push('finish-only ingredient cannot be raw animal protein, egg, or seafood');
    }
    if (item && !CONTROLLED_FINISH_ONLY_CATEGORIES.has(item.category)) {
      protocolErrors.push('finish-only ingredient must be a controlled tender vegetable');
    }
    if (!endpointIds.has(canonicalId)) {
      protocolErrors.push('finish-only ingredient requires a safety endpoint');
    }
  }
  if (adaptation.adaptation !== 'process_adaptation') {
    protocolErrors.push('controlled finish-only protocol requires process_adaptation');
  }
  return {
    eligible,
    ok: protocolErrors.length === 0,
    heldIds,
    errors: [...new Set(protocolErrors)],
  };
}

function validateAdaptation(adaptation, label, status, materials, safetyEndpoints, controlledFinish, controlledMidCycle, errors) {
  if (!isPlainObject(adaptation)) {
    errors.push(`${label}.cooker_adaptation must be an object`);
    return;
  }
  pushUnknownKeys(errors, adaptation, ADAPTATION_FIELDS, `${label}.cooker_adaptation`);
  if (!ADAPTATIONS.has(adaptation.adaptation)) {
    errors.push(`${label}.cooker_adaptation.adaptation must be one of ${[...ADAPTATIONS].join('|')}`);
  }
  if (adaptation.closed_lid_continuation !== true) {
    errors.push(`${label}.cooker_adaptation.closed_lid_continuation must be true`);
  }
  if (adaptation.requires_mid_cook_opening !== false && !controlledMidCycle?.ok) {
    errors.push(`${label}.cooker_adaptation.requires_mid_cook_opening must be false or use the approved controlled mid-cycle protocol`);
  }
  if (!['complete', 'incomplete'].includes(adaptation.completion_status)) {
    errors.push(`${label}.cooker_adaptation.completion_status must be complete or incomplete`);
  }
  if (PREVIEW_OR_HIGHER.has(status)
    && adaptation.completion_status !== 'complete') {
    errors.push(`${label} preview_ready requires a complete cooker_adaptation`);
  }
  if (adaptation.adaptation === 'not_suitable' && PREVIEW_OR_HIGHER.has(status)) {
    errors.push(`${label} not_suitable cooker_adaptation cannot be preview_ready or beyond`);
  }
  const actionMaterialIds = new Set();
  for (const phase of ['pre_actions', 'start_actions', 'finish_actions']) {
    validateActionList(adaptation[phase], phase, label, materials, actionMaterialIds, errors);
  }
  if (adaptation.requires_mid_cook_opening === true || adaptation.mid_actions !== undefined) {
    validateActionList(adaptation.mid_actions, 'mid_actions', label, materials, actionMaterialIds, errors);
  }
  if (!controlledMidCycle?.ok && (adaptation.finish_actions || [])
    .some(action => action?.rest_minutes !== undefined)) {
    errors.push(`${label}.cooker_adaptation.rest_minutes is reserved for the approved controlled mid-cycle protocol`);
  }
  if (Array.isArray(adaptation.start_actions)
      && adaptation.start_actions.at(-1)?.action_code !== 'start_closed_lid_program') {
    errors.push(`${label}.cooker_adaptation.start_actions must end with start_closed_lid_program`);
  }
  if (Array.isArray(adaptation.finish_actions)
      && !adaptation.finish_actions.some(action => action?.action_code === 'verify_safety_endpoints')) {
    errors.push(`${label}.cooker_adaptation.finish_actions must include verify_safety_endpoints`);
  }
  if (PREVIEW_OR_HIGHER.has(status)) {
    const startActions = Array.isArray(adaptation.start_actions) ? adaptation.start_actions : [];
    const loadActions = startActions.filter(action => action?.action_code === 'load_inner_pot');
    const programActions = startActions.filter(action => action?.action_code === 'start_closed_lid_program');
    if (loadActions.length !== 1) {
      errors.push(`${label} preview_ready requires exactly one load_inner_pot action`);
    }
    if (programActions.length !== 1) {
      errors.push(`${label} preview_ready requires exactly one start_closed_lid_program action`);
    }
    const heldIds = new Set([
      ...(controlledFinish?.ok ? controlledFinish.heldIds : []),
      ...(controlledMidCycle?.ok ? controlledMidCycle.heldIds : []),
    ]);
    if (loadActions.some(action => [...materials.keys()].filter(canonicalId => !heldIds.has(canonicalId))
      .some(canonicalId => !action.ingredient_ids?.includes(canonicalId)))) {
      errors.push(`${label} preview_ready load_inner_pot must cover every ${heldIds.size ? 'start-load ' : ''}material ingredient`);
    }
    const endpointIds = new Set((Array.isArray(safetyEndpoints) ? safetyEndpoints : [])
      .map(endpoint => endpoint?.canonical_ingredient_id)
      .filter(isNonEmptyString));
    const verificationActions = (Array.isArray(adaptation.finish_actions) ? adaptation.finish_actions : [])
      .filter(action => action?.action_code === 'verify_safety_endpoints');
    if (verificationActions.some(action => [...endpointIds]
      .some(canonicalId => !action.ingredient_ids?.includes(canonicalId)))) {
      errors.push(`${label} preview_ready verify_safety_endpoints must cover every declared safety endpoint ingredient`);
    }
  }
  for (const canonicalId of materials.keys()) {
    if (!actionMaterialIds.has(canonicalId)) {
      errors.push(`${label}.cooker_adaptation must reference every material ingredient across ordered actions: ${canonicalId}`);
    }
  }
  if (!COOKER_PROGRAMS.has(adaptation.program)) {
    errors.push(`${label}.cooker_adaptation.program is not allowed`);
  }
  for (const key of ['active_time_minutes', 'total_time_minutes']) {
    if (!Number.isInteger(adaptation[key]) || adaptation[key] <= 0) {
      errors.push(`${label}.cooker_adaptation.${key} must be a positive integer`);
    }
  }
  if (Number.isInteger(adaptation.active_time_minutes) && Number.isInteger(adaptation.total_time_minutes)
      && adaptation.active_time_minutes > adaptation.total_time_minutes) {
    errors.push(`${label}.cooker_adaptation.active_time_minutes must not exceed total_time_minutes`);
  }
}

function validateSafetyEndpoints(value, label, materials, canonicals, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${label}.safety_endpoints must be an array`);
    return;
  }
  const provided = new Map();
  for (const [index, endpoint] of value.entries()) {
    const endpointLabel = `${label}.safety_endpoints[${index}]`;
    if (!isPlainObject(endpoint)) {
      errors.push(`${endpointLabel} must be an object`);
      continue;
    }
    pushUnknownKeys(errors, endpoint, SAFETY_ENDPOINT_FIELDS, endpointLabel);
    if (!isNonEmptyString(endpoint.canonical_ingredient_id)) errors.push(`${endpointLabel}.canonical_ingredient_id must be a non-empty string`);
    else if (!canonicals.has(endpoint.canonical_ingredient_id)) errors.push(`${endpointLabel} unknown canonical ingredient: ${endpoint.canonical_ingredient_id}`);
    if (!isNonEmptyString(endpoint.endpoint_code)) errors.push(`${endpointLabel}.endpoint_code must be a non-empty string`);
    else if (!FIRST_STAGE_SAFETY_ENDPOINT_CODES.has(endpoint.endpoint_code)) errors.push(`${endpointLabel} endpoint_code is not allowed: ${endpoint.endpoint_code}`);
    if (isNonEmptyString(endpoint.canonical_ingredient_id) && isNonEmptyString(endpoint.endpoint_code)) {
      if (!provided.has(endpoint.canonical_ingredient_id)) provided.set(endpoint.canonical_ingredient_id, new Set());
      provided.get(endpoint.canonical_ingredient_id).add(endpoint.endpoint_code);
    }
  }
  for (const [canonicalId, item] of materials) {
    const expected = Array.isArray(item?.cooking_risk?.required_endpoint_codes)
      ? item.cooking_risk.required_endpoint_codes.filter(isNonEmptyString)
      : [];
    for (const endpointCode of expected) {
      if (!provided.get(canonicalId)?.has(endpointCode)) {
        errors.push(`${label} missing safety endpoint ${endpointCode} for ${canonicalId}`);
      }
    }
  }
}

function validateVariant(variant, label, context, variantIds, errors) {
  if (!isPlainObject(variant)) {
    errors.push(`${label} must be an object`);
    return;
  }
  pushUnknownKeys(errors, variant, VARIANT_FIELDS, label);
  if (!ID_RE.test(variant.variant_id || '')) errors.push(`${label}.variant_id must be a kebab-case ID`);
  else if (variantIds.has(variant.variant_id)) errors.push(`duplicate variant id: ${variant.variant_id}`);
  else variantIds.add(variant.variant_id);
  if (variant.recipe_id !== undefined && variant.recipe_id !== null) {
    if (!ID_RE.test(variant.recipe_id || '')) errors.push(`${label}.recipe_id must be null or a kebab-case ID`);
    else if (!context.recipeIds.has(variant.recipe_id)) errors.push(`${label}.recipe_id unknown recipe_id: ${String(variant.recipe_id)}`);
  }
  validateEvidenceReferences(variant.evidence_refs, label, context, errors);
  if (isNonEmptyString(variant.recipe_id)
      && !(Array.isArray(variant.evidence_refs) && variant.evidence_refs.some(ref => (
        ref?.kind === 'recipe' && ref?.id === variant.recipe_id
      )))) {
    errors.push(`${label}.recipe_id ${variant.recipe_id} requires a same-ID recipe evidence_ref`);
  }
  if (!isNonEmptyString(variant.display_name)) errors.push(`${label}.display_name must be a real non-empty name`);
  if (!isNonEmptyString(variant.name_label)) errors.push(`${label}.name_label must be a non-empty string`);
  if (!isNonEmptyString(variant.review_note)) errors.push(`${label}.review_note must be a non-empty string`);
  if (variant.preview_notice_code !== undefined && !PREVIEW_NOTICE_CODES.has(variant.preview_notice_code)) {
    errors.push(`${label}.preview_notice_code is not allowed`);
  }
  validateStatus(variant, label, errors);
  if (variant.supported_servings !== undefined) {
    if (!Array.isArray(variant.supported_servings) || variant.supported_servings.length === 0
        || variant.supported_servings.some(value => !Number.isInteger(value) || value < 1 || value > 8)
        || new Set(variant.supported_servings).size !== variant.supported_servings.length) {
      errors.push(`${label}.supported_servings must be a non-empty unique integer array from 1 to 8`);
    }
  }
  if (variant.status === 'calibration_preview'
      && JSON.stringify(variant.supported_servings) !== JSON.stringify([2])) {
    errors.push(`${label} calibration_preview supported_servings must equal [2]`);
  }
  if (PREVIEW_OR_HIGHER.has(variant.status)
      && variant.status !== 'calibration_preview'
      && variant.variant_id !== 'shanghai-salted-pork-rice'
      && JSON.stringify(variant.supported_servings) !== JSON.stringify([1, 2, 3, 4])) {
    errors.push(`${label} preview_ready supported_servings must equal [1,2,3,4]`);
  }
  if (!IDENTITY_LEVELS.has(variant.identity_level)) errors.push(`${label}.identity_level must be generic, regional, or household_reviewed`);
  const regionCodes = variant.region_codes === undefined ? [] : variant.region_codes;
  if (!Array.isArray(regionCodes)) {
    errors.push(`${label}.region_codes must be an array`);
  } else {
    const uniqueRegionCodes = new Set();
    regionCodes.forEach((code, index) => {
      if (!isNonEmptyString(code)) errors.push(`${label}.region_codes[${index}] must be a non-empty string`);
      else if (uniqueRegionCodes.has(code)) errors.push(`${label}.region_codes must not contain duplicates`);
      else uniqueRegionCodes.add(code);
    });
  }
  const identityRefs = variant.identity_refs;
  if (!Array.isArray(identityRefs)) errors.push(`${label}.identity_refs must be an array`);
  else {
    if (variant.identity_level === 'regional' && identityRefs.length === 0) errors.push(`${label} regional identity requires at least one identity_ref`);
    identityRefs.forEach((ref, index) => validateIdentityReference(ref, `${label}.identity_refs[${index}]`, errors));
    const hasMachineVerifiableIdentityRef = identityRefs.some(isMachineVerifiableIdentityRef);
    if (variant.identity_level === 'regional' && !hasMachineVerifiableIdentityRef) {
      errors.push(`${label} regional identity requires at least one machine-verifiable identity_ref`);
    }
    if (Array.isArray(regionCodes) && regionCodes.length > 0 && !hasMachineVerifiableIdentityRef) {
      errors.push(`${label} region_codes require at least one machine-verifiable identity_ref`);
    }
    if (variant.identity_level === 'household_reviewed' && identityRefs.length > 0) {
      errors.push(`${label} household_reviewed must not declare identity_refs`);
    }
  }
  if (variant.identity_level === 'household_reviewed' && Array.isArray(regionCodes) && regionCodes.length > 0) {
    errors.push(`${label} household_reviewed must not declare region_codes`);
  }
  const rice = variant.rice;
  let riceItem = null;
  if (!isPlainObject(rice)) {
    errors.push(`${label}.rice must be an object`);
  } else {
    pushUnknownKeys(errors, rice, RICE_FIELDS, `${label}.rice`);
    riceItem = validateKnownCanonicalId(rice.canonical_ingredient_id, `${label}.rice`, context.canonicals, errors);
    if (riceItem && !RICE_CATEGORIES.has(riceItem.category)) errors.push(`${label}.rice must reference a supported rice canonical ingredient`);
    validateMaterialAmountRule(rice.amount_rule_id, `${label}.rice`, variant.status, context.ratios, errors);
    if (!isNonEmptyString(rice.action)) errors.push(`${label}.rice.action must be a non-empty string`);
  }
  const materials = new Map();
  const materialRules = [];
  if (riceItem) materialRules.push({
    canonicalId: rice.canonical_ingredient_id,
    amountRuleId: rice.amount_rule_id,
    materialLabel: `${label}.rice`,
  });
  if (riceItem) materials.set(rice.canonical_ingredient_id, riceItem);
  if (!Array.isArray(variant.ingredients)) {
    errors.push(`${label}.ingredients must be an array`);
  } else {
    if (variant.ingredients.length === 0) errors.push(`${label}.ingredients must not be empty`);
    for (const [index, ingredient] of variant.ingredients.entries()) {
      const ingredientLabel = `${label}.ingredients[${index}]`;
      const item = validateIngredient(ingredient, ingredientLabel, context.canonicals, context.ratios, variant.status, errors);
      if (item) {
        materials.set(ingredient.canonical_ingredient_id, item);
        materialRules.push({
          canonicalId: ingredient.canonical_ingredient_id,
          amountRuleId: ingredient.amount_rule_id,
          materialLabel: ingredientLabel,
        });
      }
    }
  }
  for (const key of ['approved_substitutions', 'forbidden_combinations']) {
    if (!Array.isArray(variant[key])) errors.push(`${label}.${key} must be an array`);
  }
  if (Array.isArray(variant.approved_substitutions)) {
    variant.approved_substitutions.forEach((entry, index) => {
      const entryLabel = `${label}.approved_substitutions[${index}]`;
      if (!isPlainObject(entry)) errors.push(`${entryLabel} must be an object`);
      else {
        pushUnknownKeys(errors, entry, SUBSTITUTION_FIELDS, entryLabel);
        validateKnownCanonicalId(entry.replaces_canonical_id, entryLabel, context.canonicals, errors);
        if (!Array.isArray(entry.allowed_canonical_ids) || entry.allowed_canonical_ids.length === 0) errors.push(`${entryLabel}.allowed_canonical_ids must be a non-empty array`);
        else entry.allowed_canonical_ids.forEach((id, itemIndex) => validateKnownCanonicalId(id, `${entryLabel}.allowed_canonical_ids[${itemIndex}]`, context.canonicals, errors));
      }
    });
    if (PREVIEW_OR_HIGHER.has(variant.status) && variant.approved_substitutions.length > 0) {
      errors.push(`${label} preview_ready cannot declare approved_substitutions without an independently executable substitution contract`);
    }
  }
  if (Array.isArray(variant.forbidden_combinations)) {
    variant.forbidden_combinations.forEach((entry, index) => {
      const entryLabel = `${label}.forbidden_combinations[${index}]`;
      if (!isPlainObject(entry)) errors.push(`${entryLabel} must be an object`);
      else {
        pushUnknownKeys(errors, entry, FORBIDDEN_COMBINATION_FIELDS, entryLabel);
        if (!Array.isArray(entry.canonical_ingredient_ids) || entry.canonical_ingredient_ids.length < 2) errors.push(`${entryLabel}.canonical_ingredient_ids must list at least two items`);
        else entry.canonical_ingredient_ids.forEach((id, itemIndex) => validateKnownCanonicalId(id, `${entryLabel}.canonical_ingredient_ids[${itemIndex}]`, context.canonicals, errors));
        if (!isNonEmptyString(entry.reason)) errors.push(`${entryLabel}.reason must be a non-empty string`);
      }
    });
  }
  const controlledSeasoningIds = validateControlledSeasonings(variant, label, context, errors);
  validateNutrition(
    variant.nutrition_structure,
    label,
    new Set(materials.keys()),
    controlledSeasoningIds,
    context.canonicals,
    variant.status,
    errors,
  );
  validateCollectionMapping(variant, label, new Set(materials.keys()), context.collection, context.canonicals, errors);
  const finishProtocol = controlledFinishProtocol(variant, materials, variant.safety_endpoints);
  for (const error of finishProtocol.errors) errors.push(`${label} ${error}`);
  const midCycleProtocol = controlledMidCycleProtocol(variant, materials, variant.safety_endpoints);
  for (const error of midCycleProtocol.errors) errors.push(`${label} ${error}`);
  validateAdaptation(variant.cooker_adaptation, label, variant.status, materials, variant.safety_endpoints, finishProtocol, midCycleProtocol, errors);
  const exclusionFlags = variant.exclusion_flags === undefined ? [] : variant.exclusion_flags;
  if (!Array.isArray(exclusionFlags)) {
    errors.push(`${label}.exclusion_flags must be an array`);
  } else {
    const seenExclusionFlags = new Set();
    for (const flag of exclusionFlags) {
      if (!EXCLUSION_FLAGS.has(flag)) errors.push(`${label}.exclusion_flags contains unknown value: ${String(flag)}`);
      if (seenExclusionFlags.has(flag)) errors.push(`${label}.exclusion_flags must not contain duplicates`);
      seenExclusionFlags.add(flag);
    }
    const explicitFlags = new Set(exclusionFlags);
    const derivedFlags = derivedExclusionFlags(variant.variant_id);
    if (finishProtocol.ok) derivedFlags.delete('requires_mid_cook_opening');
    if (midCycleProtocol.ok) derivedFlags.delete('requires_mid_cook_opening');
    if (derivedFlags.size > 0 && !setsMatch(explicitFlags, derivedFlags)) {
      errors.push(`${label}.exclusion_flags must match variant_id derived risks: ${[...derivedFlags].join(', ')}`);
    }
    const effectiveFlags = new Set([...explicitFlags, ...derivedFlags]);
    if (effectiveFlags.size > 0 && PREVIEW_OR_HIGHER.has(variant.status)) {
      errors.push(`${label}.exclusion_flags prevent preview_ready or higher status`);
      errors.push(`${label}.effective exclusion_flags prevent preview_ready or higher status`);
    }
  }
  if (!Array.isArray(variant.ratio_rule_ids) || variant.ratio_rule_ids.length === 0) {
    errors.push(`${label}.ratio_rule_ids must be a non-empty array`);
  } else {
    variant.ratio_rule_ids.forEach((ratioId, index) => validateKnownRatioId(ratioId, `${label}.ratio_rule_ids[${index}]`, context.ratios, errors));
  }
  validateRatioBindings(variant, label, materialRules, context, errors);
  if (PREVIEW_OR_HIGHER.has(variant.status)) {
    for (const error of validateSubstantialNutrition(variant, context.taxonomy, context.ratioCatalog)) {
      errors.push(`${label} ${error}`);
    }
  }
  validateSafetyEndpoints(variant.safety_endpoints, label, materials, context.canonicals, errors);
  if (!Array.isArray(variant.source_refs)) errors.push(`${label}.source_refs must be an array`);
  else {
    if (PREVIEW_OR_HIGHER.has(variant.status) && variant.source_refs.length === 0) {
      errors.push(`${label} preview_ready requires at least one source_ref`);
    }
    variant.source_refs.forEach((ref, index) => validateReference(ref, `${label}.source_refs[${index}]`, errors));
  }
}

export function validateRiceMealCatalog(catalog, {
  recipeLibrary,
  sourceEvidence,
  taxonomy,
  ratioCatalog,
  collection,
} = {}) {
  try {
    const errors = [];
    if (!isPlainObject(catalog)) return ['rice meal catalog must be an object'];
    pushUnknownKeys(errors, catalog, ROOT_FIELDS, 'rice meal catalog');
    if (catalog.schema_version !== 1) errors.push('schema_version must be 1');
    if (catalog.catalog_version !== CATALOG_VERSION) errors.push(`catalog_version must be ${CATALOG_VERSION}`);
    if (!Array.isArray(catalog.families)) return [...errors, 'families must be an array'];
    const sourceEvidenceErrors = validateRiceCookerSourceEvidence(sourceEvidence);
    errors.push(...sourceEvidenceErrors.map(error => `source evidence ledger: ${error}`));
    const sourceEvidenceById = sourceEvidenceErrors.length === 0
      ? new Map(sourceEvidence.entries.map(entry => [entry.source_id, entry]))
      : new Map();
    const context = {
      recipeIds: idSet(recipeLibrary?.recipes, 'id'),
      recipeById: new Map((Array.isArray(recipeLibrary?.recipes) ? recipeLibrary.recipes : [])
        .filter(recipe => isNonEmptyString(recipe?.id)).map(recipe => [recipe.id, recipe])),
      sourceEvidenceById,
      canonicals: canonicalItems(taxonomy),
      ratios: knownRatioIds(ratioCatalog),
      ratioRules: knownRatioRules(ratioCatalog),
      taxonomy,
      ratioCatalog,
      collection: collectionContext(collection),
    };
    const familyIds = new Set();
    const variantIds = new Set();
    for (const [index, family] of catalog.families.entries()) {
      const label = `families[${index}]`;
      if (!isPlainObject(family)) {
        errors.push(`${label} must be an object`);
        continue;
      }
      pushUnknownKeys(errors, family, FAMILY_FIELDS, label);
      if (!ID_RE.test(family.family_id || '')) errors.push(`${label}.family_id must be a kebab-case ID`);
      else if (familyIds.has(family.family_id)) errors.push(`duplicate family id: ${family.family_id}`);
      else familyIds.add(family.family_id);
      if (!Array.isArray(family.variants)) {
        errors.push(`${label}.variants must be an array`);
        continue;
      }
      family.variants.forEach((variant, variantIndex) => validateVariant(
        variant,
        `${label}.variants[${variantIndex}]`,
        context,
        variantIds,
        errors,
      ));
    }
    return errors;
  } catch (error) {
    return [`rice meal catalog validation failed safely: ${error instanceof Error ? error.message : String(error)}`];
  }
}

export function assertRiceMealCatalog(catalog, context) {
  const errors = validateRiceMealCatalog(catalog, context);
  if (errors.length) throw new Error(`invalid rice meal catalog:\n${errors.join('\n')}`);
  return catalog;
}

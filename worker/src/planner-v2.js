import { prepareRatioCatalog, preparedRatioCatalogContext } from './ratio-dsl.js';
import { resolveBasicExtraIdentity, taxonomyIdentityIndex } from './taxonomy-identity.js';
import { matchAllergy } from './allergen-semantics.js';

export const PLANNER_SCHEMA_VERSION = 2;
export const PLANNER_VERSION = 'pantry-planner-v2';
export const PLANNER_MODES = new Set(['recommend', 'pantry']);
export const PLANNER_INTENTS = new Set(['normal', 'quick', 'fresh', 'batch']);

const DECISION_ACTIONS = new Set([
  'relax_item',
  'accept_partial',
  'allow_third_pot',
  'force_multi_pot',
  'edit_ingredients',
]);
const MAX_ITEMS = 20;
function createPlannerDiagnostics() {
  return {
    exact_search_calls: 0,
    partial_search_max_depth: 0,
    valid_candidate_count: 0,
    unique_user_mask_count: 0,
    partial_pair_checks: 0,
    capacity_short_circuit: false,
  };
}

function addPlannerDiagnostic(diagnostics, field, amount = 1) {
  if (diagnostics) diagnostics[field] += amount;
}

function maxPlannerDiagnostic(diagnostics, field, value) {
  if (diagnostics) diagnostics[field] = Math.max(diagnostics[field], value);
}

function invalidPlannerRequest(message) {
  const error = new Error(message);
  error.code = 'invalid_planner_request';
  return error;
}

function trimmedUniqueStrings(value, field, limitSubmittedItems = true) {
  if (value == null) return [];
  if (!Array.isArray(value) || (limitSubmittedItems && value.length > MAX_ITEMS)) {
    throw invalidPlannerRequest(`${field} must contain at most ${MAX_ITEMS} items`);
  }
  const values = [];
  const seen = new Set();
  for (const item of value) {
    if (typeof item !== 'string') throw invalidPlannerRequest(`${field} entries must be strings`);
    const trimmed = item.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      values.push(trimmed);
    }
  }
  if (values.length > MAX_ITEMS) {
    throw invalidPlannerRequest(`${field} must contain at most ${MAX_ITEMS} items`);
  }
  return values;
}

function optionalPlanId(value, field) {
  if (value == null) return null;
  if (typeof value !== 'string') throw invalidPlannerRequest(`${field} must be a string or null`);
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeDecision(value) {
  if (value == null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value) || !DECISION_ACTIONS.has(value.action)) {
    throw invalidPlannerRequest('decision.action is invalid');
  }
  const hasSwapCurrent = Object.prototype.hasOwnProperty.call(value, 'swap_current');
  if ((hasSwapCurrent && value.action !== 'accept_partial')
      || (hasSwapCurrent && typeof value.swap_current !== 'boolean')) {
    throw invalidPlannerRequest('decision.swap_current is invalid');
  }
  return { ...value };
}

export function plannerRequestFromLegacy(constraints = {}) {
  const purpose = String(constraints.purpose || 'quick');
  const pantry = Array.isArray(constraints.pantry) ? constraints.pantry : [];
  if (purpose === 'pantry') {
    return { mode: 'pantry', intent: 'normal', must_use: pantry, prefer_use: [] };
  }
  return {
    mode: 'recommend',
    intent: PLANNER_INTENTS.has(purpose) ? purpose : 'normal',
    must_use: [],
    prefer_use: pantry,
  };
}

function plannerItemInput(rawItem) {
  if (typeof rawItem === 'string') {
    const raw = rawItem.trim();
    if (!raw) throw invalidPlannerRequest('planner item raw must not be blank');
    return { raw, role: 'must_use' };
  }
  if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem) || typeof rawItem.raw !== 'string') {
    throw invalidPlannerRequest('planner item must be a string or { raw, role } object');
  }
  const role = rawItem.role == null ? 'must_use' : rawItem.role;
  if (role !== 'must_use' && role !== 'prefer_use') {
    throw invalidPlannerRequest('planner item role is invalid');
  }
  const raw = rawItem.raw.trim();
  if (!raw) throw invalidPlannerRequest('planner item raw must not be blank');
  return { raw, role };
}

export function normalizeIngredientTaxonomyKey(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}

export const normalizePlannerTaxonomyKey = normalizeIngredientTaxonomyKey;

function taxonomyItemIndex(taxonomy) {
  const index = new Map();
  for (const item of taxonomy?.items || []) {
    if (item.input_scope === 'derived_only') continue;
    for (const name of [item.display_name, ...(item.aliases || [])]) {
      const key = normalizeIngredientTaxonomyKey(name);
      if (key && !index.has(key)) index.set(key, item);
    }
  }
  return index;
}

function taxonomyAmbiguityIndex(taxonomy) {
  const index = new Map();
  for (const ambiguity of taxonomy?.ambiguous_inputs || []) {
    for (const input of [ambiguity.input, ...(ambiguity.aliases || [])]) {
      const key = normalizeIngredientTaxonomyKey(input);
      if (key && !index.has(key)) index.set(key, ambiguity);
    }
  }
  return index;
}

function taxonomyShapeForInput(item, raw) {
  const rawKey = normalizeIngredientTaxonomyKey(raw);
  const mapped = Object.entries(item.alias_shape_or_cut || {}).find(([alias]) => normalizeIngredientTaxonomyKey(alias) === rawKey)?.[1];
  if (mapped) return mapped;
  if (item.default_shape_or_cut) return item.default_shape_or_cut;
  return item.shapes_or_cuts?.length === 1 ? item.shapes_or_cuts[0] : null;
}

// 只依据受控 taxonomy 做精确身份识别。此处故意不看 recipe evidence，
// 也不做模糊分类；未知食材保留为 recognized:false，交给后续 planner 解释。
export function normalizePlannerItems(rawItems = [], taxonomy = {}) {
  if (!Array.isArray(rawItems)) throw invalidPlannerRequest('planner items must be an array');
  const index = taxonomyItemIndex(taxonomy);
  const ambiguityIndex = taxonomyAmbiguityIndex(taxonomy);
  const parsed = rawItems.map(plannerItemInput).map(input => {
    const key = normalizeIngredientTaxonomyKey(input.raw);
    const item = index.get(key) || null;
    return {
      ...input,
      item,
      ambiguity: item ? null : ambiguityIndex.get(key) || null,
    };
  });
  const representativeByCanonical = new Map();
  for (let indexOfItem = 0; indexOfItem < parsed.length; indexOfItem += 1) {
    const entry = parsed[indexOfItem];
    if (entry.role !== 'must_use') continue;
    const identity = entry.item
      ? entry.item.canonical_name || entry.item.display_name
      : entry.ambiguity ? `ambiguity:${entry.ambiguity.ambiguity_id}` : null;
    if (identity && !representativeByCanonical.has(identity)) {
      representativeByCanonical.set(identity, indexOfItem);
    }
  }
  for (let indexOfItem = 0; indexOfItem < parsed.length; indexOfItem += 1) {
    const entry = parsed[indexOfItem];
    const identity = entry.item
      ? entry.item.canonical_name || entry.item.display_name
      : entry.ambiguity ? `ambiguity:${entry.ambiguity.ambiguity_id}` : null;
    if (identity && !representativeByCanonical.has(identity)) {
      representativeByCanonical.set(identity, indexOfItem);
    }
  }
  return parsed.map((entry, indexOfItem) => {
    const { raw, role, item, ambiguity } = entry;
    if (!item) {
      const ambiguityIdentity = ambiguity ? `ambiguity:${ambiguity.ambiguity_id}` : null;
      const representativeIndex = ambiguityIdentity == null
        ? indexOfItem
        : representativeByCanonical.get(ambiguityIdentity);
      return {
        raw,
        canonical_id: null,
        canonical: null,
        ratio_rule_policy: null,
        category: null,
        state: null,
        shape_or_cut: null,
        cook_speed: null,
        moisture_release: null,
        texture_behavior: null,
        cooking_risk: 'unknown',
        recognized: false,
        ambiguity_id: ambiguity?.ambiguity_id || null,
        ambiguity_code: ambiguity?.reason_code || null,
        ambiguity_reason: ambiguity?.reason || null,
        eligible_items: [...(ambiguity?.eligible_items || [])],
        role,
        duplicate_of: representativeIndex === indexOfItem ? null : parsed[representativeIndex].raw,
      };
    }
    const canonical = item.canonical_name || item.display_name;
    const representativeIndex = representativeByCanonical.get(canonical);
    const duplicate_of = representativeIndex === indexOfItem ? null : parsed[representativeIndex].raw;
    return {
      raw,
      canonical_id: item.canonical_id,
      canonical,
      ratio_rule_policy: item.ratio_rule_policy || 'category_fallback',
      display_name: item.display_name,
      category: item.category,
      state: item.states?.length === 1 ? item.states[0] : null,
      shape_or_cut: taxonomyShapeForInput(item, raw),
      cook_speed: item.cook_speed,
      moisture_release: item.moisture_release,
      texture_behavior: item.texture_behavior.behavior_code,
      texture_failure_modes: [...(item.texture_behavior.failure_mode_codes || [])],
      cooking_risk: item.cooking_risk.risk_code,
      required_endpoint_codes: [...(item.cooking_risk.required_endpoint_codes || [])],
      compatible_slot_codes: [...(item.compatible_slot_codes || [])],
      incompatible_slot_codes: [...(item.incompatible_slot_codes || [])],
      recognized: true,
      ambiguity_id: null,
      ambiguity_code: null,
      ambiguity_reason: null,
      eligible_items: [],
      role,
      duplicate_of,
    };
  });
}

export function normalizePlannerRequest(request = {}) {
  if (!request || typeof request !== 'object' || Array.isArray(request)
    || request.schema_version !== PLANNER_SCHEMA_VERSION
    || request.planner_version !== PLANNER_VERSION
    || !request.constraints || typeof request.constraints !== 'object' || Array.isArray(request.constraints)) {
    throw invalidPlannerRequest('planner request envelope is invalid');
  }

  const constraints = request.constraints;
  if (!PLANNER_MODES.has(constraints.mode)) throw invalidPlannerRequest('mode is invalid');
  if (!PLANNER_INTENTS.has(constraints.intent)) throw invalidPlannerRequest('intent is invalid');
  if (!Number.isInteger(constraints.servings) || constraints.servings < 1 || constraints.servings > 8) {
    throw invalidPlannerRequest('servings must be an integer from 1 to 8');
  }

  const decision = normalizeDecision(constraints.decision);
  return {
    mode: constraints.mode,
    intent: constraints.intent,
    servings: constraints.servings,
    must_use: trimmedUniqueStrings(constraints.must_use, 'must_use'),
    prefer_use: trimmedUniqueStrings(constraints.prefer_use, 'prefer_use'),
    dislikes: trimmedUniqueStrings(constraints.dislikes, 'dislikes'),
    current_plan_id: optionalPlanId(constraints.current_plan_id, 'current_plan_id'),
    recent_plan_ids: trimmedUniqueStrings(constraints.recent_plan_ids, 'recent_plan_ids', false),
    decision,
    allow_third_pot: decision?.action === 'allow_third_pot',
  };
}

function ratioFailure(code, message) {
  return {
    ok: false,
    code,
    message,
    ingredient_amounts: [],
    required_extra_items: [],
    liquid_constraints: {},
    ratio_trace: [],
  };
}

function finiteNonNegativeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function roundRatioGrams(value, nearest) {
  return Math.round(value / nearest) * nearest;
}

function ratioSlots(context, taxonomy) {
  if (!context || typeof context !== 'object' || Array.isArray(context) || !context.slots || typeof context.slots !== 'object'
    || Array.isArray(context.slots)) return null;
  const slots = new Map();
  for (const [slotId, value] of Object.entries(context.slots)) {
    const items = Array.isArray(value) ? value : [value];
    const identities = taxonomyIdentityIndex(taxonomy);
    const normalized = items.map(item => typeof item === 'string'
      ? (() => {
        const identity = identities.get(item.trim().toLowerCase().replace(/\s+/g, ''));
        return identity ? {
          name: identity.name,
          category: identity.category,
          canonical_id: identity.canonical_id,
          ratio_rule_policy: identity.ratio_rule_policy,
          attributes: {},
        } : null;
      })()
      : (() => {
        const identity = identities.get(item?.name?.trim?.().toLowerCase().replace(/\s+/g, ''));
        if (!identity || identity.category !== item?.category
          || (item?.canonical_id != null && item.canonical_id !== identity.canonical_id)
          || (item?.ratio_rule_policy != null && item.ratio_rule_policy !== identity.ratio_rule_policy)) return null;
        return {
          name: identity.name,
          category: identity.category,
          canonical_id: identity.canonical_id,
          ratio_rule_policy: identity.ratio_rule_policy,
          attributes: item.attributes || {},
        };
      })());
    if (normalized.some(item => !item || typeof item !== 'object' || Array.isArray(item)
      || typeof item.name !== 'string' || !item.name.trim() || typeof item.category !== 'string' || !item.category.trim())) return null;
    slots.set(slotId, normalized.map(item => ({
      name: item.name.trim(),
      category: item.category.trim(),
      canonical_id: item.canonical_id,
      ratio_rule_policy: item.ratio_rule_policy,
      attributes: item.attributes || {},
    })));
  }
  return slots;
}

function defaultBound(bounds) {
  return bounds?.default;
}

function matchRatioSkipWhen(skipWhen, slots) {
  if (!skipWhen) return { matched:false, matchedItems:[] };
  const matchedItems = (slots.get(skipWhen.slot_id) || []).filter(item => {
    const actual = item.attributes?.[skipWhen.attribute];
    if (skipWhen.match === 'equals') return actual === skipWhen.value;
    return skipWhen.match === 'contains' && Array.isArray(actual) && actual.includes(skipWhen.value);
  }).map(item => item.name);
  return { matched:matchedItems.length > 0, matchedItems };
}

// Ratio compilation is deliberately a pure interpreter for the five fixed DSL
// operators. It never reads recipe prose, evaluates expressions, or calls a model.
export function compileRatioPlan(ruleId, context = {}, ratioCatalog = {}) {
  try {
    if (typeof ruleId !== 'string' || !Array.isArray(ratioCatalog?.rules)) {
      return ratioFailure('ratio_rule_not_found', '未找到可执行的份量规则。');
    }
    const validationContext = preparedRatioCatalogContext(ratioCatalog);
    if (!validationContext) return ratioFailure('ratio_rule_invalid', '份量规则未通过机器校验。');
    const rule = ratioCatalog.rules.find(candidate => candidate?.rule_id === ruleId);
    if (!rule) return ratioFailure('ratio_rule_not_found', '未找到可执行的份量规则。');
    if (!Number.isInteger(context?.servings) || context.servings < 1 || context.servings > 8) {
      return ratioFailure('ratio_context_missing', '份数必须是 1 到 8 的整数。');
    }
    const slots = ratioSlots(context, validationContext.taxonomy);
    if (!slots || !slots.get(rule.when?.slot_id)?.length) {
      return ratioFailure('ratio_context_missing', '缺少规则需要的食材槽位。');
    }
    const nearest = rule.rounding?.grams_to_nearest;
    if (!Number.isInteger(nearest) || nearest <= 0) {
      return ratioFailure('ratio_rule_invalid', '份量规则缺少有效的取整单位。');
    }
    if (slots.get(rule.when.slot_id).some(item => item.category !== rule.when.category)) {
      return ratioFailure('ratio_context_category_mismatch', '食材类别与这条份量规则不匹配。');
    }
    const scopedItems = slots.get(rule.when.slot_id) || [];
    if (rule.when.canonical_ids?.length
        && scopedItems.some(item => !rule.when.canonical_ids.includes(item.canonical_id))) {
      return ratioFailure('ratio_context_identity_mismatch', '食材身份与这条份量规则不匹配。');
    }
    if (!rule.when.canonical_ids?.length
        && scopedItems.some(item => item.ratio_rule_policy === 'canonical_required')) {
      return ratioFailure('ratio_context_identity_mismatch', '该食材必须使用身份精确的份量规则。');
    }
    const template = validationContext.templates?.templates?.find(entry => entry?.template_id === rule.when?.template_id);
    const optionalSlotIds = new Set((template?.optional_slots || []).filter(slot => slot?.source_policy?.includes('user')).map(slot => slot.slot_id));
    const amounts = new Map();
    const extras = new Map();
    const trace = [];
    let liquidCredit = 0;
    let retainedLiquid = null;
    const addAmount = (name, grams, extra = null) => {
      const rounded = roundRatioGrams(grams, nearest);
      if (!finiteNonNegativeNumber(rounded) || (grams > 0 && rounded === 0) || rounded > 5000 || !name) return false;
      amounts.set(name, (amounts.get(name) || 0) + rounded);
      if (extra) {
        const existing = extras.get(name);
        extras.set(name, { name, category: extra.category, grams: (existing?.grams || 0) + rounded });
      }
      return true;
    };
    const attributes = context.attributes && typeof context.attributes === 'object' && !Array.isArray(context.attributes)
      ? context.attributes
      : {};
    const allSlotItems = [...slots.values()].flat();

    for (const operation of Array.isArray(rule.operations) ? rule.operations : []) {
      const operator = operation?.operator;
      if (operator === 'per_serving_by_category') {
        const items = slots.get(operation.target?.slot_id);
        if (!items?.length && optionalSlotIds.has(operation.target?.slot_id)) continue;
        if (!items?.length) return ratioFailure('ratio_context_missing', '缺少按类别计算的食材槽位。');
        for (const item of items) {
          const grams = operation.grams_by_category?.[item.category]?.default;
          if (!finiteNonNegativeNumber(grams) || grams <= 0
            || !addAmount(item.name, grams * context.servings)) {
            return ratioFailure('ratio_rule_invalid', '按类别份量规则无效。');
          }
          trace.push({
            operator,
            slot_id: operation.target.slot_id,
            category: item.category,
            grams_per_serving: grams,
          });
        }
        continue;
      }
      if (operator === 'per_serving') {
        const items = slots.get(operation.target?.slot_id);
        const grams = defaultBound(operation.grams);
        if (!items?.length && optionalSlotIds.has(operation.target?.slot_id)) continue;
        if (!items?.length || !finiteNonNegativeNumber(grams)) {
          return ratioFailure('ratio_rule_invalid', '按份数规则无效。');
        }
        for (const item of items) if (!addAmount(item.name, grams * context.servings)) return ratioFailure('ratio_rule_invalid', '按份数结果无效。');
        trace.push({ operator, slot_id: operation.target.slot_id, grams_per_serving: grams });
        continue;
      }
      if (operator === 'bounded_sum') {
        const matching = allSlotItems.filter(item => (item.attributes?.[operation.target?.attribute] || attributes?.[item.name]?.[operation.target?.attribute]) === operation.target?.value);
        const grams = defaultBound(operation.grams_per_serving);
        const credit = defaultBound(operation.liquid_credit_grams_per_serving);
        if (operation.target?.attribute !== 'moisture_release' || !['low', 'medium', 'high'].includes(operation.target?.value)
          || !finiteNonNegativeNumber(grams) || !finiteNonNegativeNumber(credit)) {
          return ratioFailure('ratio_rule_invalid', '食材总量规则无效。');
        }
        if (matching.length) {
          const each = (grams * context.servings) / matching.length;
          for (const item of matching) {
            if (!amounts.has(item.name) && !addAmount(item.name, each)) return ratioFailure('ratio_rule_invalid', '食材总量结果无效。');
          }
          liquidCredit += credit * context.servings;
        }
        trace.push({ operator, attribute: operation.target?.attribute, value: operation.target?.value, matched_items: matching.map(item => item.name), liquid_credit_grams: matching.length ? roundRatioGrams(credit * context.servings, nearest) : 0 });
        continue;
      }
      if (operator === 'ratio') {
        const denominatorItems = slots.get(operation.denominator?.slot_id);
        const multiplier = operation.default;
        if (!denominatorItems?.length || operation.denominator?.slot_id !== rule.when?.slot_id
          || operation.denominator?.measure !== 'grams' || operation.numerator?.resource !== 'retained_liquid_grams'
          || !resolveBasicExtraIdentity(operation.target, validationContext.taxonomy) || operation.target?.category !== 'liquid' || !finiteNonNegativeNumber(multiplier)) {
          return ratioFailure('ratio_rule_invalid', '液体比例规则无效。');
        }
        const denominatorGrams = denominatorItems.reduce((sum, item) => sum + (amounts.get(item.name) || 0), 0);
        if (!finiteNonNegativeNumber(denominatorGrams) || denominatorGrams <= 0) return ratioFailure('ratio_context_missing', '缺少可计算液体比例的主食克数。');
        retainedLiquid = Math.max(0, denominatorGrams * multiplier - liquidCredit);
        if (!addAmount(operation.target?.name, retainedLiquid, operation.target)) return ratioFailure('ratio_rule_invalid', '液体比例结果无效。');
        trace.push({ operator, numerator: operation.numerator?.resource, denominator_slot_id: operation.denominator?.slot_id, multiplier, liquid_credit_grams: roundRatioGrams(liquidCredit, nearest) });
        continue;
      }
      if (operator === 'fixed_addition' || operator === 'scale_by_servings') {
        const guard = matchRatioSkipWhen(operation.skip_when, slots);
        if (guard.matched) {
          trace.push({
            operator,
            name: operation.target?.name,
            applied: false,
            skip_reason: {
              slot_id: operation.skip_when.slot_id,
              attribute: operation.skip_when.attribute,
              matched_items: guard.matchedItems,
            },
          });
          continue;
        }
        const grams = defaultBound(operation.grams);
        const multiplier = operator === 'scale_by_servings' ? context.servings : 1;
        if (!finiteNonNegativeNumber(grams) || !resolveBasicExtraIdentity(operation.target, validationContext.taxonomy)) {
          return ratioFailure('ratio_rule_invalid', '基础补充规则无效。');
        }
        if (!addAmount(operation.target.name, grams * multiplier, operation.target)) return ratioFailure('ratio_rule_invalid', '基础补充结果无效。');
        trace.push({ operator, name: operation.target.name, applied: true, grams: roundRatioGrams(grams * multiplier, nearest) });
        continue;
      }
      return ratioFailure('ratio_rule_invalid', '份量规则包含不支持的操作。');
    }
    const acceptedCategories = new Map([
      ...(template?.required_slots || []), ...(template?.optional_slots || []),
    ].map(slot => [slot.slot_id, new Set(template?.ingredient_categories?.[slot.slot_id] || [])]));
    for (const [slotId, items] of slots) {
      const accepted = acceptedCategories.get(slotId);
      if (!accepted || items.some(item => !accepted.has(item.category))) return ratioFailure('ratio_context_category_mismatch', '食材类别与槽位不兼容。');
    }
    for (const item of allSlotItems) {
      if (!amounts.has(item.name) || amounts.get(item.name) <= 0) return ratioFailure('ratio_rule_invalid', '已确定食材缺少可执行克数。');
    }
    const ingredient_amounts = [...amounts.entries()].map(([name, grams]) => ({ name, grams })).sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
    const required_extra_items = [...extras.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
    const retainedLiquidGrams = required_extra_items
      .filter(item => item.category === 'liquid')
      .reduce((sum, item) => sum + item.grams, 0);
    const distribution = rule.liquid_distribution;
    const initialLiquidGrams = distribution
      ? roundRatioGrams(retainedLiquidGrams * distribution.initial_fraction, nearest)
      : null;
    const reserveLiquidGrams = distribution
      ? retainedLiquidGrams - initialLiquidGrams
      : null;
    if (trace[0]) trace[0] = { ...trace[0], rule_id:rule.rule_id };
    return {
      ok: true,
      code: 'ratio_compiled',
      ingredient_amounts,
      required_extra_items,
      liquid_constraints: retainedLiquidGrams === 0 ? {} : {
        retained_liquid_grams: retainedLiquidGrams,
        liquid_credit_grams: roundRatioGrams(liquidCredit, nearest),
        rounding_grams: nearest,
        ...(distribution ? {
          initial_liquid_grams: initialLiquidGrams,
          reserve_liquid_grams: reserveLiquidGrams,
          reserve_action_code: distribution.reserve_action_code,
        } : {}),
      },
      ratio_trace: trace,
    };
  } catch {
    return ratioFailure('ratio_rule_invalid', '份量规则无法安全计算。');
  }
}

const ACTIVE_TEMPLATE_IDS = new Set([
  'acid-staple-pot', 'savory-mixed-rice-pot', 'cooked-rice-stir-pot', 'broth-noodle-pot',
  'egg-tofu-vegetable-pot', 'mushroom-vegetable-stew-pot', 'beef-staple-pot', 'poultry-staple-pot',
  'braised-noodle-pot', 'broth-rice-pot',
  'soft-family-rice-pot',
]);
const BASIC_EXTRA_CATEGORIES = new Set(['raw_rice', 'cooked_rice', 'noodle', 'liquid', 'oil', 'seasoning']);
const RAW_RISK_CODES = new Set(['raw_egg', 'raw_poultry', 'raw_pork', 'raw_beef', 'raw_lamb', 'raw_seafood', 'raw_dough', 'raw_grain']);
const ENDPOINT_ALIASES = Object.freeze({ poultry_fully_cooked_no_pink: 'poultry_fully_cooked' });

// 过敏 matcher 的 alias 顺序固定：taxonomy 是规划语义权威源，recipe aliases 只补充
// taxonomy 没声明的归一化 key。每次返回新的普通对象，不修改任一 catalog。
export function buildPlannerAllergenAliases(taxonomy = {}, recipeLibrary = {}) {
  const aliases = {};
  const seen = new Set();
  const add = (rawAlias, rawTarget) => {
    const alias = typeof rawAlias === 'string' ? rawAlias.trim() : '';
    const target = typeof rawTarget === 'string' ? rawTarget.trim() : '';
    const key = normalizeIngredientTaxonomyKey(alias);
    if (!key || !target || seen.has(key)) return;
    seen.add(key);
    aliases[alias] = target;
  };
  const taxonomyItems = [...(Array.isArray(taxonomy?.items) ? taxonomy.items : [])]
    .sort((left, right) => String(left?.display_name || '').localeCompare(String(right?.display_name || ''), 'zh-Hans-CN'));
  for (const item of taxonomyItems) {
    for (const alias of [...(Array.isArray(item?.aliases) ? item.aliases : [])].sort((a, b) => String(a).localeCompare(String(b), 'zh-Hans-CN'))) {
      add(alias, item.display_name);
    }
  }
  for (const [alias, target] of Object.entries(recipeLibrary?.ingredient_aliases || {})
    .sort(([left], [right]) => left.localeCompare(right, 'zh-Hans-CN'))) {
    add(alias, target);
  }
  return aliases;
}

function rejection(reason_code, message, details = {}) {
  return { ok: false, rejection_reason: { reason_code, message, ...details } };
}

function stableItemCompare(left, right) {
  return `${left.canonical || ''}\u0000${left.shape_or_cut || ''}\u0000${left.raw || ''}`
    .localeCompare(`${right.canonical || ''}\u0000${right.shape_or_cut || ''}\u0000${right.raw || ''}`, 'zh-Hans-CN');
}

function acceptedCategoryCount(slot, template) {
  return new Set(template.ingredient_categories?.[slot.slot_id] || slot.accepts_categories || []).size;
}

function itemFit(slot, item, template) {
  const categoryAccepted = (slot.accepts_categories || []).includes(item.category);
  const codeAccepted = (slot.accepts_slot_codes || []).some(code => item.compatible_slot_codes?.includes(code));
  const requirement = (template.shape_or_cut_requirements || [])
    .find(entry => entry.slot_id === slot.slot_id && entry.category === item.category);
  if (requirement && item.shape_or_cut && ((requirement.forbidden_shapes || []).includes(item.shape_or_cut)
      || ((requirement.allowed_shapes || []).length && !(requirement.allowed_shapes || []).includes(item.shape_or_cut)))) {
    return { ok: false, reason_code: 'unsupported_shape_or_cut' };
  }
  if (!categoryAccepted && !codeAccepted) return { ok: false, reason_code: 'no_compatible_slot' };
  if ((item.incompatible_slot_codes || []).some(code => (slot.accepts_slot_codes || []).includes(code))) {
    return { ok: false, reason_code: 'unsupported_shape_or_cut' };
  }
  return { ok: true };
}

function itemMatchesDislikes(item, dislikes = [], allergyAliases = {}) {
  return dislikes.some(dislike => [item.raw, item.display_name, item.canonical]
    .filter(Boolean).some(name => matchAllergy(dislike, name, allergyAliases)));
}

function basicSlotChoices(slot, taxonomy, dislikes = [], allergyAliases = {}) {
  if (!(slot.source_policy || []).includes('basic_extra')) return [];
  const accepted = new Set(slot.accepts_categories || []);
  return (taxonomy?.items || [])
    .filter(item => BASIC_EXTRA_CATEGORIES.has(item.category) && accepted.has(item.category))
    .filter(item => !dislikes.some(dislike => matchAllergy(dislike, item.display_name, allergyAliases)))
    .sort((a, b) => a.display_name.localeCompare(b.display_name, 'zh-Hans-CN'))
    .map(item => ({
      raw: item.display_name,
      canonical_id: item.canonical_id,
      canonical: item.canonical_name || item.display_name,
      ratio_rule_policy: item.ratio_rule_policy || 'category_fallback',
      display_name: item.display_name,
      category: item.category,
      state: item.states?.length === 1 ? item.states[0] : null,
      shape_or_cut: item.default_shape_or_cut || item.shapes_or_cuts?.[0] || null,
      cook_speed: item.cook_speed,
      moisture_release: item.moisture_release,
      texture_behavior: item.texture_behavior?.behavior_code || null,
      cooking_risk: item.cooking_risk?.risk_code || 'none',
      required_endpoint_codes: [...(item.cooking_risk?.required_endpoint_codes || [])],
      compatible_slot_codes: [...(item.compatible_slot_codes || [])],
      incompatible_slot_codes: [...(item.incompatible_slot_codes || [])],
      recognized: true,
      role: 'basic_extra',
      duplicate_of: null,
      source: 'basic_extra',
    }));
}

function assignedUserRecord(item) {
  return { ...structuredClone(item), source: 'user' };
}

function assignedItems(assignment) {
  return Object.values(assignment).flat();
}

function boundedCombinations(items, maxItems) {
  const output = [];
  const visit = (start, wanted, current) => {
    if (current.length === wanted) {
      output.push([...current]);
      return;
    }
    for (let index = start; index <= items.length - (wanted - current.length); index += 1) {
      current.push(items[index]);
      visit(index + 1, wanted, current);
      current.pop();
    }
  };
  for (let size = Math.min(maxItems, items.length); size >= 0; size -= 1) visit(0, size, []);
  return output;
}

function incompatibleReason(template, assignment) {
  const all = assignedItems(assignment);
  const cookingModes = new Set((template.compatibility_rules || [])
    .flatMap(rule => rule.requires_cooking_mode || []));
  if (cookingModes.has('quick_saute')
      && all.some(item => item.source === 'user' && item.cook_speed === 'slow')) {
    return rejection('incompatible_combination', '慢熟食材不适合快炒锅的熟制节奏。', {
      rule_code: 'quick_saute_rejects_slow_items',
    });
  }
  for (const rule of template.incompatible_rules || []) {
    const trigger = (assignment[rule.when?.slot_id] || []).some(item => item.category === rule.when?.category);
    if (!trigger) continue;
    const constraint = rule.forbids_attribute_count;
    const count = all.filter(item => item.source === 'user' && item[constraint?.attribute] === constraint?.value).length;
    if (count > constraint?.greater_than) {
      return rejection('incompatible_combination', '这组食材的出水或熟制节奏不适合放进同一锅。', {
        slot_id: rule.when.slot_id,
        rule_code: rule.rule_code,
      });
    }
  }
  return null;
}

function safetyReason(template, assignment) {
  const endpoints = new Set((template.safety_endpoints || []).map(endpoint => ENDPOINT_ALIASES[endpoint.endpoint_code] || endpoint.endpoint_code));
  for (const item of assignedItems(assignment)) {
    if (item.source !== 'user' || !RAW_RISK_CODES.has(item.cooking_risk)) continue;
    const required = item.required_endpoint_codes || [];
    if (required.some(endpoint => !endpoints.has(endpoint))) {
      return rejection('safety_constraint', '这个模板缺少该食材所需的明确熟制终点。', { item: item.raw });
    }
  }
  return null;
}

function ratioContextFor(assignment, servings) {
  return {
    servings,
    slots: Object.fromEntries(Object.entries(assignment).map(([slotId, items]) => [slotId, items.map(item => ({
      name: item.display_name,
      category: item.category,
      canonical_id: item.canonical_id,
      ratio_rule_policy: item.ratio_rule_policy,
      attributes: {
        cook_speed: item.cook_speed,
        moisture_release: item.moisture_release,
        texture_behavior: item.texture_behavior,
        texture_failure_modes: [...(item.texture_failure_modes || [])],
        cooking_risk: item.cooking_risk,
      },
    }))])),
  };
}

export function selectRatioRule(template, assignment, ratioCatalog) {
  const candidates = (ratioCatalog?.rules || []).filter(rule => {
    if (rule.when?.template_id !== template.template_id
        || !template.ratio_constraints?.includes(rule.rule_id)) return false;
    const items = (assignment[rule.when.slot_id] || [])
      .filter(item => item.category === rule.when.category);
    if (!items.length) return false;
    if (!rule.when.canonical_ids?.length) return true;
    return items.every(item => rule.when.canonical_ids.includes(item.canonical_id));
  });
  const exact = candidates.filter(rule => rule.when.canonical_ids?.length);
  const matchingItems = candidates.flatMap(rule => assignment[rule.when.slot_id] || []);
  if (!exact.length && matchingItems.some(item => item.ratio_rule_policy === 'canonical_required')) {
    return { ok:false, code:'ratio_rule_not_found', rule:null };
  }
  const best = exact.length ? exact : candidates.filter(rule => !rule.when.canonical_ids?.length);
  if (best.length === 0) return { ok:false, code:'ratio_rule_not_found', rule:null };
  if (best.length > 1) return { ok:false, code:'ratio_rule_ambiguous', rule:null };
  return { ok:true, code:'ratio_rule_selected', rule:best[0] };
}

function assignmentKey(assignment) {
  return Object.keys(assignment).sort().map(slotId => `${slotId}:${assignment[slotId]
    .map(item => `${item.canonical || item.display_name}/${item.shape_or_cut || ''}/${item.source}`)
    .sort().join(',')}`).join('|');
}

function mergeRequiredExtras(compiled, assignment) {
  const byName = new Map((compiled.required_extra_items || []).map(item => [item.name, { ...item }]));
  const amountByName = new Map((compiled.ingredient_amounts || []).map(item => [item.name, item.grams]));
  for (const item of assignedItems(assignment).filter(entry => entry.source === 'basic_extra')) {
    const grams = amountByName.get(item.display_name);
    if (!(grams > 0) || byName.has(item.display_name)) continue;
    byName.set(item.display_name, { name: item.display_name, category: item.category, grams });
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
}

export function assignItemsToTemplate(template, normalizedItems, context = {}) {
  if (!template || template.activation_status !== 'active' || !template.runtime_eligible || !ACTIVE_TEMPLATE_IDS.has(template.template_id)) {
    return rejection('no_compatible_slot', '这个模板目前不参与规划。');
  }
  if (!template.supported_intents?.includes(context.intent)
      || (context.intent === 'quick' && template.time_range?.max_minutes > 30)) {
    return rejection('time_constraint', '这个模板无法满足本次时间要求。');
  }
  if (!Array.isArray(normalizedItems)) return rejection('no_compatible_slot', '没有可用于规划的食材。');
  const dislikes = Array.isArray(context.dislikes) ? context.dislikes : [];
  const allergyAliases = context.allergyAliases && typeof context.allergyAliases === 'object'
    ? context.allergyAliases
    : {};
  const uniqueRecognized = normalizedItems.filter(item => item.recognized && item.duplicate_of === null);
  const dislikedUsers = uniqueRecognized.filter(item => itemMatchesDislikes(item, dislikes, allergyAliases));
  const users = uniqueRecognized.filter(item => !itemMatchesDislikes(item, dislikes, allergyAliases)).sort(stableItemCompare);
  const required = [...(template.required_slots || [])];
  const optional = [...(template.optional_slots || [])]
    .filter(slot => slot.source_policy?.includes('user'))
    .sort((a, b) => acceptedCategoryCount(a, template) - acceptedCategoryCount(b, template)
      || a.slot_id.localeCompare(b.slot_id));
  const requiredAssignments = [];
  let mostSpecificFailure = null;

  const visitRequired = (index, assignment, used) => {
    if (index === required.length) {
      requiredAssignments.push({ assignment, used });
      return;
    }
    const slot = required[index];
    const userChoices = [];
    if (slot.source_policy?.includes('user')) {
      for (const item of users) {
        if (used.has(item)) continue;
        const fit = itemFit(slot, item, template);
        if (fit.ok) userChoices.push(item);
        else if (fit.reason_code === 'unsupported_shape_or_cut') {
          mostSpecificFailure = rejection('unsupported_shape_or_cut', '这个食材的部位或形态不适合该做法。', {
            item: item.raw, slot_id: slot.slot_id,
          });
        }
      }
    }
    const userCombinations = boundedCombinations(userChoices, slot.max_items)
      .filter(combination => combination.length >= slot.min_items);
    for (const combination of userCombinations) {
      const nextUsed = new Set(used);
      combination.forEach(item => nextUsed.add(item));
      visitRequired(index + 1, {
        ...assignment,
        [slot.slot_id]: combination.map(assignedUserRecord),
      }, nextUsed);
    }
    for (const choice of basicSlotChoices(slot, context.taxonomy, dislikes, allergyAliases)) {
      visitRequired(index + 1, { ...assignment, [slot.slot_id]: [choice] }, new Set(used));
    }
  };
  visitRequired(0, {}, new Set());
  if (!requiredAssignments.length) {
    if (dislikedUsers.length) {
      return rejection('allergen_conflict', '忌口食材不能进入这个模板。', { item: dislikedUsers[0].raw });
    }
    return mostSpecificFailure || rejection('no_compatible_slot', '缺少模板必需且兼容的食材槽位。');
  }

  const completed = [];
  let hardFailure = null;
  for (const requiredResult of requiredAssignments) {
    const optionalAssignments = [];
    const visitOptional = (index, assignment, used) => {
      if (index === optional.length) {
        optionalAssignments.push(assignment);
        return;
      }
      const slot = optional[index];
      const matches = users.filter(item => !used.has(item) && itemFit(slot, item, template).ok);
      for (const combination of boundedCombinations(matches, slot.max_items)) {
        const next = Object.fromEntries(Object.entries(assignment).map(([slotId, items]) => [slotId, [...items]]));
        if (combination.length) next[slot.slot_id] = combination.map(assignedUserRecord);
        const nextUsed = new Set(used);
        combination.forEach(item => nextUsed.add(item));
        visitOptional(index + 1, next, nextUsed);
      }
    };
    visitOptional(0, Object.fromEntries(Object.entries(requiredResult.assignment).map(([slotId, items]) => [slotId, [...items]])), new Set(requiredResult.used));

    for (const assignment of optionalAssignments) {
      const userCount = assignedItems(assignment).filter(item => item.source === 'user').length;
      if (userCount < template.slot_limits.total_user_items_min || userCount > template.slot_limits.total_user_items_max) {
        hardFailure ||= rejection('no_compatible_slot', '现有兼容食材数量不足以组成这个模板。');
        continue;
      }
      const incompatible = incompatibleReason(template, assignment);
      if (incompatible) { hardFailure ||= incompatible; continue; }
      const safety = safetyReason(template, assignment);
      if (safety) { hardFailure ||= safety; continue; }
      const selected = selectRatioRule(template, assignment, context.ratioCatalog);
      if (!selected.ok) {
        hardFailure ||= rejection('would_break_ratio', '这组槽位没有唯一可执行的份量比例。', {
          ratio_code: selected.code,
        });
        continue;
      }
      const rule = selected.rule;
      const compiled = compileRatioPlan(rule.rule_id, ratioContextFor(assignment, context.servings), context.ratioCatalog);
      if (!compiled.ok) {
        hardFailure ||= rejection('would_break_ratio', '这组食材无法通过份量与液体比例检查。', { ratio_code: compiled.code });
        continue;
      }
      const conflictingExtra = (compiled.required_extra_items || []).find(item => dislikes
        .some(dislike => matchAllergy(dislike, item.name, allergyAliases)));
      if (conflictingExtra) {
        hardFailure ||= rejection('allergen_conflict', '份量规则需要的基础补充项与忌口冲突。', { item: conflictingExtra.name });
        continue;
      }
      completed.push({
        ok: true,
        template_id: template.template_id,
        slot_assignment: assignment,
        assignment_key: assignmentKey(assignment),
        servings: context.servings,
        time_range: { ...template.time_range },
        safety_endpoints: (template.safety_endpoints || []).map(endpoint => ({ ...endpoint })),
        safety_complete: true,
        ingredient_amounts: compiled.ingredient_amounts.map(item => ({ ...item })),
        required_extra_items: mergeRequiredExtras(compiled, assignment),
        liquid_constraints: { ...compiled.liquid_constraints },
        ratio_trace: compiled.ratio_trace.map(entry => ({ ...entry })),
        rejection_reason: null,
      });
    }
  }
  if (!completed.length) return hardFailure || rejection('would_break_ratio', '没有可执行的单锅份量方案。');
  completed.sort((left, right) => {
    const leftUsers = assignedItems(left.slot_assignment).filter(item => item.source === 'user');
    const rightUsers = assignedItems(right.slot_assignment).filter(item => item.source === 'user');
    const leftMust = leftUsers.filter(item => item.role === 'must_use').length;
    const rightMust = rightUsers.filter(item => item.role === 'must_use').length;
    const leftPrefer = leftUsers.filter(item => item.role === 'prefer_use').length;
    const rightPrefer = rightUsers.filter(item => item.role === 'prefer_use').length;
    return rightMust - leftMust
      || (context.mode === 'recommend' ? rightPrefer - leftPrefer : rightUsers.length - leftUsers.length)
      || left.required_extra_items.length - right.required_extra_items.length
      || left.assignment_key.localeCompare(right.assignment_key, 'zh-Hans-CN');
  });
  if (context.collect_valid_variants === true) {
    return { ok: true, variants: completed };
  }
  return completed[0];
}

function uniqueSubmittedItems(normalizedItems) {
  return normalizedItems.filter(item => item.duplicate_of === null);
}

function unusedReason(item, assignment, template, role, dislikes = [], allergyAliases = {}) {
  if (itemMatchesDislikes(item, dislikes, allergyAliases)) return {
    ...structuredClone(item),
    reason_code: 'allergen_conflict',
    reason: '这项食材与你设置的忌口冲突。',
  };
  if (item.ambiguity_code === 'ambiguous_ingredient_state') return {
    ...structuredClone(item),
    reason_code: item.ambiguity_code,
    reason: item.ambiguity_reason,
    eligible_items: [...item.eligible_items],
  };
  if (!item.recognized) return {
    ...structuredClone(item),
    reason_code: 'unrecognized_ingredient',
    reason: '暂时无法识别这种食材，因此不能承诺已经安排。',
  };
  if (item.category === 'dry_legume') return {
    ...structuredClone(item),
    reason_code: 'unsupported_ingredient_state',
    reason: '当前计划只接受已经煮熟的豆类；干豆需要单独泡发并彻底煮熟。',
  };
  const slots = [...(template.required_slots || []), ...(template.optional_slots || [])].filter(slot => slot.source_policy?.includes('user'));
  const fits = slots.map(slot => ({ slot, fit: itemFit(slot, item, template) }));
  if (fits.some(entry => entry.fit.reason_code === 'unsupported_shape_or_cut')) {
    return {
      ...structuredClone(item),
      reason_code: 'unsupported_shape_or_cut',
      reason: '这个食材的部位或形态不适合当前做法。',
    };
  }
  const fitSlots = fits.filter(entry => entry.fit.ok).map(entry => entry.slot);
  for (const slot of fitSlots) {
    if ((assignment[slot.slot_id]?.length || 0) >= slot.max_items) continue;
    const trial = Object.fromEntries(Object.entries(assignment).map(([slotId, items]) => [slotId, [...items]]));
    trial[slot.slot_id] = [...(trial[slot.slot_id] || []), assignedUserRecord(item)];
    if (incompatibleReason(template, trial)) {
      return {
        ...structuredClone(item),
        reason_code: role === 'must_use' ? 'incompatible_combination' : 'texture_conflict',
        reason: '加入这项食材会破坏当前锅的出水或熟制节奏。',
      };
    }
  }
  const reason_code = fitSlots.length ? 'exceeds_slot_limit' : role === 'must_use' ? 'no_compatible_slot' : 'lower_compatibility';
  return {
    ...structuredClone(item),
    reason_code,
    reason: fitSlots.length ? '兼容槽位已经由更合适的食材占用。' : '这项食材与当前单锅结构不够匹配。',
  };
}

function displayFloor(totalMustUse, plannedMustUse) {
  if (totalMustUse === 0) return false;
  if (totalMustUse === 1) return plannedMustUse === 1;
  if (totalMustUse === 2) return plannedMustUse === 2;
  if (totalMustUse === 3) return plannedMustUse >= 2;
  if (totalMustUse <= 6) return plannedMustUse / totalMustUse >= 0.6;
  return false;
}

export function minimumRecommendCoverageCount(totalSubmitted) {
  if (totalSubmitted <= 0) return 0;
  if (totalSubmitted <= 2) return totalSubmitted;
  if (totalSubmitted === 3) return 2;
  return Math.ceil(totalSubmitted * 0.6);
}

export function coverageFieldsFor(promiseItems = [], plannedItems = []) {
  const plannedKeys = new Set(plannedItems.map(item => item.canonical || `raw:${item.raw}`));
  const recognized = promiseItems.filter(item => item.recognized);
  const plannedRecognized = recognized.filter(item => (
    plannedKeys.has(item.canonical || `raw:${item.raw}`)
  ));
  return {
    coverage_ratio: promiseItems.length ? plannedItems.length / promiseItems.length : 0,
    recognition_ratio: promiseItems.length ? recognized.length / promiseItems.length : 0,
    recognized_coverage_ratio: recognized.length ? plannedRecognized.length / recognized.length : 0,
  };
}

function buildPotCandidatesInternal(assets = {}, request = {}, collectValidVariants = false) {
  const normalizedItems = normalizePlannerItems([
    ...(request.must_use || []).map(raw => ({ raw, role: 'must_use' })),
    ...(request.prefer_use || []).map(raw => ({ raw, role: 'prefer_use' })),
  ], assets.taxonomy);
  const prepared = prepareRatioCatalog(assets.ratios || assets.ratioCatalog, {
    taxonomy: assets.taxonomy,
    templates: assets.templates,
    recipes: assets.recipes,
  });
  if (!prepared.ok) return [];
  const unique = uniqueSubmittedItems(normalizedItems);
  const must = unique.filter(item => item.role === 'must_use');
  const prefer = unique.filter(item => item.role === 'prefer_use');
  const recognizedSubmitted = unique.filter(item => item.recognized);
  const allergyAliases = buildPlannerAllergenAliases(assets.taxonomy, assets.recipes);
  const candidates = [];
  for (const template of assets.templates?.templates || []) {
    if (!ACTIVE_TEMPLATE_IDS.has(template.template_id) || template.activation_status !== 'active' || !template.runtime_eligible) continue;
    const assigned = assignItemsToTemplate(template, normalizedItems, {
      taxonomy: assets.taxonomy,
      ratioCatalog: prepared.catalog,
      mode: request.mode,
      intent: request.intent,
      servings: request.servings,
      dislikes: request.dislikes || [],
      allergyAliases,
      collect_valid_variants: collectValidVariants,
    });
    if (!assigned.ok) continue;
    const variants = collectValidVariants ? (() => {
      const seenAssignments = new Set();
      return assigned.variants.filter(variant => {
        const signature = variant.assignment_key;
        if (seenAssignments.has(signature)) return false;
        seenAssignments.add(signature);
        return true;
      });
    })() : [assigned];
    for (const variant of variants) {
      const planned = assignedItems(variant.slot_assignment).filter(item => item.source === 'user');
      const plannedKeys = new Set(planned.map(item => `${item.role}\u0000${item.canonical}`));
      const plannedMust = must.filter(item => plannedKeys.has(`must_use\u0000${item.canonical}`));
      const plannedPrefer = prefer.filter(item => plannedKeys.has(`prefer_use\u0000${item.canonical}`));
      if (request.mode === 'recommend' && recognizedSubmitted.length && plannedPrefer.length === 0) continue;
      const unplannedMust = must.filter(item => !plannedKeys.has(`must_use\u0000${item.canonical}`))
        .map(item => unusedReason(item, variant.slot_assignment, template, 'must_use', request.dislikes || [], allergyAliases));
      const unusedPrefer = prefer.filter(item => !plannedKeys.has(`prefer_use\u0000${item.canonical}`))
        .map(item => unusedReason(item, variant.slot_assignment, template, 'prefer_use', request.dislikes || [], allergyAliases));
      const promiseItems = request.mode === 'pantry' ? must : prefer;
      const plannedPromiseItems = request.mode === 'pantry' ? plannedMust : plannedPrefer;
      const coverage = coverageFieldsFor(promiseItems, plannedPromiseItems);
      candidates.push({
        ...variant,
        planned_must_use: plannedMust.map(item => ({ ...item })),
        planned_prefer_use: plannedPrefer.map(item => ({ ...item })),
        unplanned_must_use: unplannedMust,
        unused_prefer_use: unusedPrefer,
        ...coverage,
        single_pot_eligible: request.mode === 'recommend'
          ? plannedPrefer.length >= minimumRecommendCoverageCount(prefer.length)
          : displayFloor(must.length, plannedMust.length),
      });
    }
  }
  return candidates;
}

export function buildPotCandidates(assets = {}, request = {}) {
  return buildPotCandidatesInternal(assets, request, false);
}

export function rankPotCandidates(candidates = [], request = {}) {
  return [...candidates].sort((left, right) => {
    const leftPrimary = request.mode === 'pantry' ? left.planned_must_use.length : left.planned_prefer_use.length;
    const rightPrimary = request.mode === 'pantry' ? right.planned_must_use.length : right.planned_prefer_use.length;
    if (leftPrimary !== rightPrimary) return rightPrimary - leftPrimary;
    const leftSafe = left.safety_complete === true ? 1 : 0;
    const rightSafe = right.safety_complete === true ? 1 : 0;
    if (leftSafe !== rightSafe) return rightSafe - leftSafe;
    if (left.required_extra_items.length !== right.required_extra_items.length) return left.required_extra_items.length - right.required_extra_items.length;
    return left.template_id.localeCompare(right.template_id)
      || left.assignment_key.localeCompare(right.assignment_key, 'zh-Hans-CN');
  });
}

function canonicalUserKeys(pot) {
  return new Set([
    ...(pot.planned_must_use || []), ...(pot.planned_prefer_use || []),
  ].map(item => item.canonical || `raw:${item.raw}`));
}

// 完整多锅只搜索最多 3 锅。候选先按“用户食材集合 + must 集合”去重，
// 然后每层固定选一个尚未覆盖的 must item，枚举所有能覆盖它的已重新校验候选。
// 因此不会构造 N²/N³ 组合数组，也没有可能截断有效 1–3 锅解的任意 cap。
function findExactCompletePotCombination(rankedCandidates, mustUse, exactPotCount, diagnostics) {
  addPlannerDiagnostic(diagnostics, 'exact_search_calls');
  if (!mustUse.length || mustUse.some(item => !item.recognized)) return null;
  const targetKeys = [...new Set(mustUse.map(item => item.canonical || `raw:${item.raw}`))]
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'));
  const allUserKeys = [...new Set([...targetKeys, ...rankedCandidates.flatMap(candidate => [...canonicalUserKeys(candidate)])])]
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'));
  const bitByUserKey = new Map(allUserKeys.map((key, index) => [key, 1n << BigInt(index)]));
  const targetMask = targetKeys.reduce((mask, key) => mask | (bitByUserKey.get(key) || 0n), 0n);
  const uniqueCandidates = [];
  const seenSignatures = new Set();
  for (let candidateRank = 0; candidateRank < rankedCandidates.length; candidateRank += 1) {
    const candidate = rankedCandidates[candidateRank];
    const mustKeys = [...combinedItemKeys([candidate], 'planned_must_use')].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
    if (!mustKeys.length) continue;
    const userKeys = [...canonicalUserKeys(candidate)].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
    const signature = `${mustKeys.join('\u0000')}\u0001${userKeys.join('\u0000')}`;
    if (seenSignatures.has(signature)) continue;
    seenSignatures.add(signature);
    const mustMask = mustKeys.reduce((mask, key) => mask | (bitByUserKey.get(key) || 0n), 0n);
    const userMask = userKeys.reduce((mask, key) => mask | (bitByUserKey.get(key) || 0n), 0n);
    uniqueCandidates.push({ candidate, mustMask, userMask });
  }
  const byMustKey = new Map(targetKeys.map(key => [key, []]));
  for (const entry of uniqueCandidates) {
    for (const key of combinedItemKeys([entry.candidate], 'planned_must_use')) byMustKey.get(key)?.push(entry);
  }
  const failed = new Set();

  const search = (selected, coveredMask, usedMask) => {
    if (coveredMask === targetMask) return selected.length === exactPotCount ? selected : null;
    if (selected.length === exactPotCount) return null;
    const state = `${selected.length}:${coveredMask}:${usedMask}`;
    if (failed.has(state)) return null;
    const uncovered = targetKeys.filter(key => (coveredMask & bitByUserKey.get(key)) === 0n)
      .sort((left, right) => (byMustKey.get(left)?.length || 0) - (byMustKey.get(right)?.length || 0)
        || left.localeCompare(right, 'zh-Hans-CN'))[0];
    for (const entry of byMustKey.get(uncovered) || []) {
      if ((entry.userMask & usedMask) !== 0n) continue;
      const found = search([...selected, entry.candidate], coveredMask | entry.mustMask, usedMask | entry.userMask);
      if (found) return found;
    }
    failed.add(state);
    return null;
  };
  return search([], 0n, 0n);
}

function combinedItemKeys(pots, field) {
  return new Set(pots.flatMap(pot => pot[field] || []).map(item => item.canonical || `raw:${item.raw}`));
}

function aggregateRequiredExtras(pots) {
  const aggregated = new Map();
  for (const extra of pots.flatMap(pot => pot.required_extra_items || [])) {
    const key = `${extra.name}\u0000${extra.category || ''}`;
    if (!aggregated.has(key)) aggregated.set(key, { ...structuredClone(extra) });
    else if (finiteNonNegativeNumber(extra.grams)) aggregated.get(key).grams += extra.grams;
  }
  return [...aggregated.values()].sort((left, right) => left.name.localeCompare(right.name, 'zh-Hans-CN')
    || String(left.category || '').localeCompare(String(right.category || '')));
}

function countMaskBits(mask) {
  let count = 0;
  for (let remaining = mask; remaining; remaining >>= 1n) count += Number(remaining & 1n);
  return count;
}

// 部分计划也使用经完整校验的装槽变体。这里只保留当前最优的单锅/两锅，
// 不构造候选 pair 数组；相同用户食材集合只保留按合同更优的那个已编译候选。
function findBestPartialPotCombination(rankedCandidates, request, diagnostics) {
  if (!rankedCandidates.length) return [];
  const allKeys = [...new Set(rankedCandidates.flatMap(candidate => [...canonicalUserKeys(candidate)]))]
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'));
  const bitByKey = new Map(allKeys.map((key, index) => [key, 1n << BigInt(index)]));
  const entryByUserMask = new Map();
  for (let candidateRank = 0; candidateRank < rankedCandidates.length; candidateRank += 1) {
    const candidate = rankedCandidates[candidateRank];
    const userMask = [...canonicalUserKeys(candidate)].reduce((mask, key) => mask | bitByKey.get(key), 0n);
    if (userMask === 0n) continue;
    const entry = {
      candidate,
      userMask,
      mustMask: [...combinedItemKeys([candidate], 'planned_must_use')].reduce((mask, key) => mask | bitByKey.get(key), 0n),
      preferMask: [...combinedItemKeys([candidate], 'planned_prefer_use')].reduce((mask, key) => mask | bitByKey.get(key), 0n),
      extras: candidate.required_extra_items?.length || 0,
      quickTime: candidate.time_range?.max_minutes || 0,
      identity: `${candidate.template_id}\u0000${candidate.assignment_key}`,
      rank: candidateRank,
    };
    const existing = entryByUserMask.get(userMask);
    if (!existing || entry.extras < existing.extras
        || (entry.extras === existing.extras && request.intent === 'quick' && entry.quickTime < existing.quickTime)
        || (entry.extras === existing.extras && (request.intent !== 'quick' || entry.quickTime === existing.quickTime)
          && entry.identity.localeCompare(existing.identity, 'zh-Hans-CN') < 0)) {
      entryByUserMask.set(userMask, entry);
    }
  }
  const entries = [...entryByUserMask.values()];
  // One entry remains for every distinct user-ingredient mask after partial-search deduplication.
  addPlannerDiagnostic(diagnostics, 'unique_user_mask_count', entries.length);
  for (const entry of entries) {
    // Partial selection evaluates one pot here, and only two-pot pairs below.
    maxPlannerDiagnostic(diagnostics, 'partial_search_max_depth', 1);
    entry.mustCount = countMaskBits(entry.mustMask);
    entry.preferCount = countMaskBits(entry.preferMask);
  }
  const forceTwo = request.decision?.action === 'force_multi_pot';
  const identityFor = selected => [...selected].sort((left, right) => left.rank - right.rank)
    .map(entry => entry.identity).join('\u0001');
  const better = (metrics, selected) => {
    if (!best) return true;
    return metrics.must !== best.metrics.must ? metrics.must > best.metrics.must
      : metrics.force !== best.metrics.force ? metrics.force > best.metrics.force
        : metrics.pots !== best.metrics.pots ? metrics.pots < best.metrics.pots
          : metrics.extras !== best.metrics.extras ? metrics.extras < best.metrics.extras
            : request.intent === 'quick' && metrics.quickTime !== best.metrics.quickTime ? metrics.quickTime < best.metrics.quickTime
              : metrics.prefer !== best.metrics.prefer ? metrics.prefer > best.metrics.prefer
                : identityFor(selected).localeCompare(best.metrics.identity, 'zh-Hans-CN') < 0;
  };
  let best = null;
  for (const entry of entries) {
    const selected = [entry];
    const metrics = {
      must: entry.mustCount,
      prefer: entry.preferCount,
      force: 0,
      pots: 1,
      extras: entry.extras,
      quickTime: entry.quickTime,
    };
    if (better(metrics, selected)) best = { selected, metrics: { ...metrics, identity: identityFor(selected) } };
  }
  const pairEntries = [...entries].sort((left, right) => right.mustCount - left.mustCount
    || right.preferCount - left.preferCount
    || left.rank - right.rank);
  const maxMustPerPot = pairEntries[0]?.mustCount || 0;
  for (let left = 0; left < pairEntries.length; left += 1) {
    const bestMust = best?.metrics.must ?? -1;
    if (pairEntries[left].mustCount + maxMustPerPot < bestMust) break;
    for (let right = left + 1; right < pairEntries.length; right += 1) {
      // Count each pair only once it reaches the actual inner-loop predicate sequence.
      addPlannerDiagnostic(diagnostics, 'partial_pair_checks');
      maxPlannerDiagnostic(diagnostics, 'partial_search_max_depth', 2);
      if (pairEntries[left].mustCount + pairEntries[right].mustCount < bestMust) break;
      if ((pairEntries[left].userMask & pairEntries[right].userMask) !== 0n) continue;
      const selected = [pairEntries[left], pairEntries[right]];
      const metrics = {
        must: pairEntries[left].mustCount + pairEntries[right].mustCount,
        prefer: pairEntries[left].preferCount + pairEntries[right].preferCount,
        force: forceTwo ? 1 : 0,
        pots: 2,
        extras: pairEntries[left].extras + pairEntries[right].extras,
        quickTime: pairEntries[left].quickTime + pairEntries[right].quickTime,
      };
      if (better(metrics, selected)) best = { selected, metrics: { ...metrics, identity: identityFor(selected) } };
    }
  }
  return [...(best?.selected || [])].sort((left, right) => left.rank - right.rank).map(entry => entry.candidate);
}

const UNPLANNED_REASON_PRIORITY = Object.freeze({
  allergen_conflict: 0,
  unsupported_shape_or_cut: 1,
  ambiguous_ingredient_state: 2,
  unsupported_ingredient_state: 3,
  unrecognized_ingredient: 4,
  time_constraint: 5,
  safety_constraint: 6,
  incompatible_combination: 7,
  would_break_ratio: 8,
  exceeds_slot_limit: 9,
  no_compatible_slot: 10,
  lower_compatibility: 11,
});

function bestExistingReason(item, ranked, field) {
  const key = item.canonical || `raw:${item.raw}`;
  return ranked.flatMap(candidate => candidate[field] || [])
    .filter(entry => (entry.canonical || `raw:${entry.raw}`) === key)
    .sort((left, right) => (UNPLANNED_REASON_PRIORITY[left.reason_code] ?? 99)
      - (UNPLANNED_REASON_PRIORITY[right.reason_code] ?? 99))[0] || null;
}

function fallbackUnplannedReason(item, request, allergyAliases, role) {
  if (itemMatchesDislikes(item, request.dislikes || [], allergyAliases)) return {
    ...structuredClone(item),
    reason_code: 'allergen_conflict',
    reason: '这项食材与你设置的忌口冲突。',
  };
  if (item.ambiguity_code === 'ambiguous_ingredient_state') return {
    ...structuredClone(item),
    reason_code: item.ambiguity_code,
    reason: item.ambiguity_reason,
    eligible_items: [...item.eligible_items],
  };
  if (!item.recognized) return {
    ...structuredClone(item),
    reason_code: 'unrecognized_ingredient',
    reason: role === 'must_use' ? '暂时无法识别这种食材，因此不能承诺已经安排。' : '暂时无法识别这种食材。',
  };
  if (item.category === 'dry_legume') return {
    ...structuredClone(item),
    reason_code: 'unsupported_ingredient_state',
    reason: '当前计划只接受已经煮熟的豆类；干豆需要单独泡发并彻底煮熟。',
  };
  return {
    ...structuredClone(item),
    reason_code: role === 'must_use' ? 'no_compatible_slot' : 'lower_compatibility',
    reason: role === 'must_use' ? '当前启用模板没有能可靠接纳这项食材的槽位。' : '当前没有足够可靠的组合来使用这项食材。',
  };
}

function reasonForUnplanned(item, ranked, request, allergyAliases, role, overrideCode = null) {
  const existing = bestExistingReason(item, ranked, role === 'must_use' ? 'unplanned_must_use' : 'unused_prefer_use');
  const reason = existing ? structuredClone(existing) : fallbackUnplannedReason(item, request, allergyAliases, role);
  const specific = new Set([
    'allergen_conflict', 'unsupported_shape_or_cut', 'ambiguous_ingredient_state',
    'unrecognized_ingredient', 'unsupported_ingredient_state', 'time_constraint', 'safety_constraint', 'incompatible_combination',
  ]);
  if (overrideCode && !specific.has(reason.reason_code)) {
    reason.reason_code = overrideCode;
    reason.reason = overrideCode === 'third_pot_required'
      ? '这项食材需要放入第三锅，需要你先确认额外一顿主餐。'
      : '最多三锅仍无法把这项食材安排进完整计划。';
  }
  return reason;
}

function decoratePots(pots, allMustUse, promiseItems, mode) {
  const remaining = new Map(allMustUse.map(item => [item.canonical || `raw:${item.raw}`, structuredClone(item)]));
  const labels = ['第一锅', '第二锅', '第三锅'];
  return pots.map((pot, index) => {
    for (const item of pot.planned_must_use || []) remaining.delete(item.canonical || `raw:${item.raw}`);
    const localPot = structuredClone(pot);
    delete localPot.unplanned_must_use;
    delete localPot.unused_prefer_use;
    const plannedPromiseItems = mode === 'pantry'
      ? localPot.planned_must_use || []
      : localPot.planned_prefer_use || [];
    return {
      ...localPot,
      ...coverageFieldsFor(promiseItems, plannedPromiseItems),
      meal_sequence: index + 1,
      label: labels[index],
      remaining_must_use_after: [...remaining.values()].map(item => ({ ...item })),
    };
  });
}

function structuredAction(action, label, unplannedItems, options = {}) {
  return {
    action,
    label,
    eligible_items: options.eligible_items || [],
    requires_acknowledgement: options.requires_acknowledgement === true,
    unplanned_items: [...unplannedItems],
    ...(options.extra || {}),
  };
}

function partialActions(unplanned, includeThirdPot = false) {
  const identities = unplanned.map(item => item.canonical || item.raw);
  const actions = [];
  if (includeThirdPot) actions.push(structuredAction('allow_third_pot', '需要第三锅才能全部安排', identities, {
    requires_acknowledgement: true,
    extra: { potential_full_coverage: true, additional_meals: 1 },
  }));
  actions.push(structuredAction('relax_item', '放宽一种食材', identities, {
    eligible_items: identities,
    requires_acknowledgement: true,
  }));
  actions.push(structuredAction('edit_ingredients', '调整食材', identities));
  actions.push(structuredAction('accept_partial', '接受部分规划', identities, { requires_acknowledgement: true }));
  return actions;
}

function buildPlannerResponse(assets, request, normalizedItems, ranked, selectedPots, options = {}) {
  const unique = uniqueSubmittedItems(normalizedItems);
  const must = unique.filter(item => item.role === 'must_use');
  const prefer = unique.filter(item => item.role === 'prefer_use');
  const plannedMustKeys = combinedItemKeys(selectedPots, 'planned_must_use');
  const plannedPreferKeys = combinedItemKeys(selectedPots, 'planned_prefer_use');
  const plannedMust = must.filter(item => plannedMustKeys.has(item.canonical || `raw:${item.raw}`));
  const plannedPrefer = prefer.filter(item => plannedPreferKeys.has(item.canonical || `raw:${item.raw}`));
  const thirdPotKeys = options.thirdPot ? canonicalUserKeys(options.thirdPot) : new Set();
  const unplannedMust = must.filter(item => !plannedMustKeys.has(item.canonical || `raw:${item.raw}`)).map(item => {
    const key = item.canonical || `raw:${item.raw}`;
    const override = thirdPotKeys.has(key) ? 'third_pot_required' : options.capacityExceeded ? 'plan_capacity_exceeded' : null;
    return reasonForUnplanned(item, ranked, request, options.allergyAliases, 'must_use', override);
  });
  const unusedPrefer = prefer.filter(item => !plannedPreferKeys.has(item.canonical || `raw:${item.raw}`))
    .map(item => reasonForUnplanned(item, ranked, request, options.allergyAliases, 'prefer_use'));
  const promiseItems = request.mode === 'pantry' ? must : prefer;
  const plannedPromiseItems = request.mode === 'pantry' ? plannedMust : plannedPrefer;
  const coverage = coverageFieldsFor(promiseItems, plannedPromiseItems);
  const coverageRatio = coverage.coverage_ratio;
  const complete = request.mode === 'pantry' && unplannedMust.length === 0 && coverageRatio === 1;
  const ready = request.mode === 'recommend' && plannedPrefer.length > 0;
  const status = ready ? 'ready' : complete ? 'complete' : selectedPots.length ? 'needs_user_decision' : 'no_valid_plan';
  const decoratedPots = decoratePots(selectedPots, must, promiseItems, request.mode);
  const rejectionReason = options.capacityExceeded
    ? { reason_code: 'plan_capacity_exceeded', message: '最多三锅仍无法完整覆盖本次清库存食材。' }
    : options.thirdPot ? { reason_code: 'third_pot_required', message: '需要第三锅才能完整覆盖。' }
      : status === 'needs_user_decision' ? { reason_code: 'incomplete_coverage', message: '仍有清库存食材没有安排。' } : null;
  const result = {
    schema_version: 2,
    planner_version: PLANNER_VERSION,
    template_catalog_version: assets.templates?.template_catalog_version || null,
    status,
    generation_allowed: ready || complete,
    mode: request.mode,
    intent: request.intent,
    normalized_items: normalizedItems.map(item => structuredClone(item)),
    commitment: ready
      ? '直接推荐会选择较合适的组合，并如实列出这次未使用的食材。'
      : complete ? '完整清库存计划。' : selectedPots.length ? '还有食材没有安排，需要你先决定下一步。' : '当前没有达到承诺门槛的可靠计划。',
    plan: {
      plan_kind: decoratedPots.length > 1 ? 'multi_pot' : 'single_pot',
      planned_must_use: plannedMust.map(item => structuredClone(item)),
      planned_prefer_use: plannedPrefer.map(item => structuredClone(item)),
      unplanned_must_use: unplannedMust,
      unused_prefer_use: unusedPrefer,
      required_extra_items: aggregateRequiredExtras(selectedPots),
      ...coverage,
      rejection_reason: rejectionReason,
      pots: decoratedPots,
    },
    unplanned: unplannedMust.map(item => structuredClone(item)),
    actions: status === 'needs_user_decision' ? partialActions(unplannedMust, Boolean(options.thirdPot)) : [],
  };
  return result;
}

function maxPlannerUserItemsPerPot(assets, request) {
  return Math.max(0, ...(assets.templates?.templates || [])
    .filter(template => ACTIVE_TEMPLATE_IDS.has(template.template_id)
      && template.activation_status === 'active'
      && template.runtime_eligible
      && template.supported_intents?.includes(request.intent)
      && !(request.intent === 'quick' && template.time_range?.max_minutes > 30))
    .map(template => template.slot_limits?.total_user_items_max || 0));
}

function legacyRecipeFallbackResponse(assets, request, normalizedItems, reason) {
  return {
    schema_version: 2,
    planner_version: PLANNER_VERSION,
    template_catalog_version: assets.templates?.template_catalog_version || null,
    status: 'ready',
    generation_allowed: false,
    mode: request.mode,
    intent: request.intent,
    normalized_items: normalizedItems.map(item => structuredClone(item)),
    plan_source: 'legacy_recipe_selector',
    legacy_fallback: true,
    fallback_reason: reason,
    commitment: '这次没有指定食材，将从可信基础菜谱中直接推荐一顿主餐。',
    plan: {
      plan_kind: 'legacy_fallback',
      fallback_kind: 'legacy_recipe_selector',
      planned_must_use: [],
      planned_prefer_use: [],
      unplanned_must_use: [],
      unused_prefer_use: [],
      required_extra_items: [],
      coverage_ratio: 0,
      recognition_ratio: 0,
      recognized_coverage_ratio: 0,
      rejection_reason: null,
      pots: [],
    },
    unplanned: [],
    actions: [],
  };
}

function planMealCore(assets, request, diagnostics) {
  const normalized_items = normalizePlannerItems([
    ...(request.must_use || []).map(raw => ({ raw, role: 'must_use' })),
    ...(request.prefer_use || []).map(raw => ({ raw, role: 'prefer_use' })),
  ], assets.taxonomy);
  if (request.mode === 'recommend'
      && uniqueSubmittedItems(normalized_items).filter(item => item.role === 'prefer_use').length === 0) {
    return legacyRecipeFallbackResponse(assets, request, normalized_items, 'recommend_no_submitted_ingredients');
  }
  const publicRanked = rankPotCandidates(buildPotCandidates(assets, request), request);
  const must = uniqueSubmittedItems(normalized_items).filter(item => item.role === 'must_use');
  const recognizedMustCount = must.filter(item => item.recognized).length;
  const exceedsAbsoluteThreePotCapacity = request.mode === 'pantry'
    && recognizedMustCount > maxPlannerUserItemsPerPot(assets, request) * 3;
  const searchRanked = request.mode === 'pantry'
    ? rankPotCandidates(buildPotCandidatesInternal(assets, request, true), request)
    : publicRanked;
  // Search-ranked candidates have completed candidate validation at this point.
  addPlannerDiagnostic(diagnostics, 'valid_candidate_count', searchRanked.length);
  const allergyAliases = buildPlannerAllergenAliases(assets.taxonomy, assets.recipes);
  if (request.mode === 'recommend') {
    const chosen = publicRanked.find(candidate => candidate.single_pot_eligible);
    return buildPlannerResponse(assets, request, normalized_items, publicRanked, chosen ? [chosen] : [], { allergyAliases });
  }

  if (exceedsAbsoluteThreePotCapacity && diagnostics) diagnostics.capacity_short_circuit = true;
  const completeSingle = exceedsAbsoluteThreePotCapacity ? null : findExactCompletePotCombination(searchRanked, must, 1, diagnostics);
  const completePair = exceedsAbsoluteThreePotCapacity ? null : findExactCompletePotCombination(searchRanked, must, 2, diagnostics);
  const forceMulti = request.decision?.action === 'force_multi_pot';
  if (forceMulti && completePair) {
    return buildPlannerResponse(assets, request, normalized_items, publicRanked, completePair, { allergyAliases });
  }
  if (completeSingle) {
    return buildPlannerResponse(assets, request, normalized_items, publicRanked, completeSingle, { allergyAliases });
  }
  if (completePair) {
    return buildPlannerResponse(assets, request, normalized_items, publicRanked, completePair, { allergyAliases });
  }

  const completeTriple = exceedsAbsoluteThreePotCapacity ? null : findExactCompletePotCombination(searchRanked, must, 3, diagnostics);
  if (completeTriple) {
    const triple = completeTriple;
    if (request.allow_third_pot) {
      return buildPlannerResponse(assets, request, normalized_items, publicRanked, triple, { allergyAliases });
    }
    return buildPlannerResponse(assets, request, normalized_items, publicRanked, triple.slice(0, 2), {
      allergyAliases,
      thirdPot: triple[2],
    });
  }

  const selected = findBestPartialPotCombination(searchRanked, request, diagnostics);
  const hasAmbiguousMust = must.some(item => item.ambiguity_code === 'ambiguous_ingredient_state');
  const displayableSelected = selected.length === 1
    && selected[0].single_pot_eligible !== true
    && !hasAmbiguousMust ? [] : selected;
  const allIndividuallyCoverable = must.length > 0 && must.every(item => item.recognized
    && searchRanked.some(candidate => candidate.planned_must_use.some(planned => planned.canonical === item.canonical)));
  const capacityExceeded = displayableSelected.length > 0
    && (exceedsAbsoluteThreePotCapacity || allIndividuallyCoverable);
  return buildPlannerResponse(assets, request, normalized_items, publicRanked, displayableSelected, {
    allergyAliases,
    capacityExceeded,
  });
}

function acknowledgementIdentity(item) {
  return item.canonical || item.raw;
}

function exactStringSet(left, right) {
  if (!Array.isArray(left) || left.some(value => typeof value !== 'string')) return false;
  const normalize = values => [...new Set(values.map(value => value.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

function planMealInternal(assets = {}, request = {}, diagnostics = null) {
  const sink = diagnostics;
  const decision = request.decision;
  const baseRequest = {
    ...structuredClone(request),
    decision: null,
    allow_third_pot: false,
  };
  if (!decision) return planMealCore(assets, baseRequest, sink);

  if (decision.action === 'relax_item') {
    const current = planMealCore(assets, baseRequest, sink);
    const eligible = current.plan.unplanned_must_use || [];
    const chosen = typeof decision.item === 'string' ? decision.item.trim() : '';
    const target = eligible.find(item => chosen && (item.raw === chosen || item.canonical === chosen));
    if (!target) throw invalidPlannerRequest('relax_item must select one current unplanned item');
    const normalizedMust = normalizePlannerItems((baseRequest.must_use || []).map(raw => ({ raw, role: 'must_use' })), assets.taxonomy);
    const movedRaw = normalizedMust.filter(item => item.raw === target.raw || (target.canonical && item.canonical === target.canonical)).map(item => item.raw);
    const moved = new Set(movedRaw);
    return planMealCore(assets, {
      ...baseRequest,
      must_use: (baseRequest.must_use || []).filter(raw => !moved.has(raw)),
      prefer_use: [...new Set([...(baseRequest.prefer_use || []), ...movedRaw])],
    }, sink);
  }

  const decisionRequest = {
    ...baseRequest,
    decision: structuredClone(decision),
    allow_third_pot: decision.action === 'allow_third_pot',
  };
  const current = planMealCore(assets, decisionRequest, sink);
  if (decision.action === 'edit_ingredients') {
    current.status = current.status === 'no_valid_plan' ? 'no_valid_plan' : 'needs_user_decision';
    current.generation_allowed = false;
    current.commitment = '已保留你输入的食材，请返回调整后再规划。';
    return current;
  }
  if (decision.action === 'accept_partial') {
    const planId = typeof decision.plan_id === 'string' ? decision.plan_id.trim() : '';
    const expected = (current.plan.unplanned_must_use || []).map(acknowledgementIdentity);
    if (!planId || planId !== request.current_plan_id || !exactStringSet(decision.acknowledged_unplanned, expected)
        || current.status !== 'needs_user_decision' || !current.plan.pots.length) {
      throw invalidPlannerRequest('accept_partial acknowledgement does not match the current partial plan');
    }
    current.status = 'partial_accepted';
    current.generation_allowed = true;
    current.commitment = '部分处理方案：已为可规划食材保留做法，仍会显示未处理食材。';
    current.actions = [];
    return current;
  }
  return current;
}

export function planMeal(assets = {}, request = {}) {
  return planMealInternal(assets, request);
}

export function planMealWithDiagnostics(assets = {}, request = {}) {
  const diagnostics = createPlannerDiagnostics();
  const result = planMealInternal(assets, request, diagnostics);
  return { result, diagnostics: structuredClone(diagnostics) };
}

function identityText(value) {
  return typeof value === 'string' ? value : value == null ? null : String(value);
}

function identityStringArray(value) {
  return [...new Set((Array.isArray(value) ? value : []).map(identityText).filter(value => value !== null))]
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'));
}

function identityIngredient(item = {}) {
  return {
    raw: identityText(item.raw),
    canonical_id: identityText(item.canonical_id),
    canonical: identityText(item.canonical),
    ratio_rule_policy: identityText(item.ratio_rule_policy),
    category: identityText(item.category),
    state: identityText(item.state),
    shape_or_cut: identityText(item.shape_or_cut),
    cook_speed: identityText(item.cook_speed),
    moisture_release: identityText(item.moisture_release),
    texture_behavior: identityText(item.texture_behavior),
    cooking_risk: identityText(item.cooking_risk),
    required_endpoint_codes: identityStringArray(item.required_endpoint_codes),
    compatible_slot_codes: identityStringArray(item.compatible_slot_codes),
    incompatible_slot_codes: identityStringArray(item.incompatible_slot_codes),
    ambiguity_id: identityText(item.ambiguity_id),
    ambiguity_code: identityText(item.ambiguity_code),
    eligible_items: identityStringArray(item.eligible_items),
    recognized: item.recognized === true,
    role: identityText(item.role),
    duplicate_of: identityText(item.duplicate_of),
    source: identityText(item.source),
  };
}

function identityIngredientKey(item) {
  return `${item.canonical || ''}\u0000${item.raw || ''}\u0000${item.shape_or_cut || ''}\u0000${item.role || ''}\u0000${item.source || ''}`;
}

function identitySlotAssignment(slotAssignment = {}) {
  return Object.entries(slotAssignment || {})
    .map(([slotId, items]) => ({
      slot_id: slotId,
      ingredients: (Array.isArray(items) ? items : []).map(identityIngredient)
        .sort((left, right) => identityIngredientKey(left).localeCompare(identityIngredientKey(right), 'zh-Hans-CN')),
    }))
    .sort((left, right) => left.slot_id.localeCompare(right.slot_id));
}

function identityExtra(item = {}) {
  return {
    name: identityText(item.name),
    canonical: identityText(item.canonical || item.name),
    category: identityText(item.category),
    grams: finiteNonNegativeNumber(item.grams) ? item.grams : null,
  };
}

function identityExtras(items = []) {
  return (Array.isArray(items) ? items : []).map(identityExtra)
    .sort((left, right) => `${left.category || ''}\u0000${left.canonical || left.name || ''}`
      .localeCompare(`${right.category || ''}\u0000${right.canonical || right.name || ''}`, 'zh-Hans-CN'));
}

function identityAmounts(items = []) {
  return (Array.isArray(items) ? items : []).map(item => ({
    name: identityText(item.name),
    canonical: identityText(item.canonical || item.name),
    grams: finiteNonNegativeNumber(item.grams) ? item.grams : null,
  })).sort((left, right) => `${left.canonical || ''}\u0000${left.name || ''}`
    .localeCompare(`${right.canonical || ''}\u0000${right.name || ''}`, 'zh-Hans-CN'));
}

function identitySafetyEndpoints(items = []) {
  return (Array.isArray(items) ? items : []).map(item => ({
    applies_to_category: identityText(item.applies_to_category),
    endpoint_code: identityText(item.endpoint_code),
  })).sort((left, right) => `${left.applies_to_category || ''}\u0000${left.endpoint_code || ''}`
    .localeCompare(`${right.applies_to_category || ''}\u0000${right.endpoint_code || ''}`));
}

function identityRatioTrace(items = []) {
  return (Array.isArray(items) ? items : []).map(item => {
    const trace = structuredClone(item || {});
    if (Array.isArray(trace.matched_items)) trace.matched_items = identityStringArray(trace.matched_items);
    return recursivelySortObjectKeys(trace);
  });
}

function identityPot(pot = {}) {
  return {
    meal_sequence: Number.isInteger(pot.meal_sequence) ? pot.meal_sequence : null,
    template_id: identityText(pot.template_id),
    servings: Number.isInteger(pot.servings) ? pot.servings : null,
    slot_assignment: identitySlotAssignment(pot.slot_assignment),
    ingredient_amounts: identityAmounts(pot.ingredient_amounts),
    ratio_constraints: identityRatioTrace(pot.ratio_trace),
    required_extra_items: identityExtras(pot.required_extra_items),
    liquid_constraints: structuredClone(pot.liquid_constraints || {}),
    safety_endpoints: identitySafetyEndpoints(pot.safety_endpoints),
    time_range: {
      min_minutes: finiteNonNegativeNumber(pot.time_range?.min_minutes) ? pot.time_range.min_minutes : null,
      max_minutes: finiteNonNegativeNumber(pot.time_range?.max_minutes) ? pot.time_range.max_minutes : null,
    },
  };
}

export function canonicalPlanIdentityPayload(result = {}) {
  const pots = (Array.isArray(result.plan?.pots) ? result.plan.pots : []).map(identityPot)
    .sort((left, right) => (left.meal_sequence ?? Number.MAX_SAFE_INTEGER) - (right.meal_sequence ?? Number.MAX_SAFE_INTEGER)
      || String(left.template_id || '').localeCompare(String(right.template_id || '')));
  const singlePot = pots.length === 1 ? pots[0] : null;
  return {
    planner_version: identityText(result.planner_version),
    template_catalog_version: identityText(result.template_catalog_version),
    template_id: singlePot?.template_id || null,
    normalized_items: (Array.isArray(result.normalized_items) ? result.normalized_items : [])
      .map(identityIngredient)
      .sort((left, right) => `${left.role || ''}\u0000${identityIngredientKey(left)}`
        .localeCompare(`${right.role || ''}\u0000${identityIngredientKey(right)}`, 'zh-Hans-CN')),
    slot_assignment: singlePot?.slot_assignment || [],
    pots,
    required_extra_items: identityExtras(result.plan?.required_extra_items),
    mode: identityText(result.mode),
    intent: identityText(result.intent),
  };
}

function recursivelySortObjectKeys(value) {
  if (Array.isArray(value)) return value.map(recursivelySortObjectKeys);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, recursivelySortObjectKeys(value[key])]));
}

export function stableCanonicalJson(value) {
  return JSON.stringify(recursivelySortObjectKeys(structuredClone(value)));
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

export async function computePlanId(result) {
  const payload = canonicalPlanIdentityPayload(result);
  const bytes = new TextEncoder().encode(stableCanonicalJson(payload));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return `pln_v2_${bytesToBase64Url(new Uint8Array(digest))}`;
}

async function attachPlanIdentity(result) {
  const detached = structuredClone(result);
  detached.plan = detached.plan || {};
  detached.plan.plan_id = await computePlanId(detached);
  return detached;
}

function planStructurePayload(result) {
  return (result.plan?.pots || []).map(pot => ({
    meal_sequence: pot.meal_sequence,
    template_id: pot.template_id,
    slot_assignment: identitySlotAssignment(pot.slot_assignment),
  })).sort((left, right) => left.meal_sequence - right.meal_sequence);
}

function planStructureKey(result) {
  return stableCanonicalJson({
    plan_kind: result.plan?.plan_kind || null,
    pots: planStructurePayload(result),
  });
}

function templateSequence(result) {
  return planStructurePayload(result).map(pot => pot.template_id).join('\u0000');
}

function requestWithoutSwapHistory(request) {
  return {
    ...structuredClone(request),
    current_plan_id: null,
    recent_plan_ids: [],
  };
}

function completeCombinationEntries(rankedCandidates, mustUse) {
  if (!mustUse.length || mustUse.some(item => !item.recognized)) return null;
  const targetKeys = [...new Set(mustUse.map(item => item.canonical || `raw:${item.raw}`))]
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'));
  const allUserKeys = [...new Set([...targetKeys, ...rankedCandidates.flatMap(candidate => [...canonicalUserKeys(candidate)])])]
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'));
  const bitByKey = new Map(allUserKeys.map((key, index) => [key, 1n << BigInt(index)]));
  const targetMask = targetKeys.reduce((mask, key) => mask | bitByKey.get(key), 0n);
  const entries = rankedCandidates.map((candidate, rank) => {
    const mustKeys = [...combinedItemKeys([candidate], 'planned_must_use')];
    const userKeys = [...canonicalUserKeys(candidate)];
    return {
      candidate,
      rank,
      mustMask: mustKeys.reduce((mask, key) => mask | (bitByKey.get(key) || 0n), 0n),
      userMask: userKeys.reduce((mask, key) => mask | (bitByKey.get(key) || 0n), 0n),
    };
  }).filter(entry => entry.mustMask !== 0n);
  const byTargetKey = new Map(targetKeys.map(key => [key, []]));
  for (const entry of entries) {
    for (const key of combinedItemKeys([entry.candidate], 'planned_must_use')) byTargetKey.get(key)?.push(entry);
  }
  return { targetKeys, bitByKey, targetMask, byTargetKey };
}

// This enumerates only validated pot assignments at an explicit depth of one,
// two or three. It chooses an uncovered must-use identity at every level, so it
// never constructs an unconstrained Cartesian product or uses a lossy top-N cap.
function collectExactCompletePotCombinations(rankedCandidates, mustUse, exactPotCount) {
  const index = completeCombinationEntries(rankedCandidates, mustUse);
  if (!index) return [];
  const results = [];
  const resultKeys = new Set();
  const search = (selected, coveredMask, usedMask) => {
    if (coveredMask === index.targetMask) {
      if (selected.length !== exactPotCount) return;
      const ordered = [...selected].sort((left, right) => left.rank - right.rank);
      const signature = ordered.map(entry => `${entry.candidate.template_id}\u0000${entry.candidate.assignment_key}`).join('\u0001');
      if (!resultKeys.has(signature)) {
        resultKeys.add(signature);
        results.push(ordered.map(entry => entry.candidate));
      }
      return;
    }
    if (selected.length >= exactPotCount) return;
    const uncovered = index.targetKeys.filter(key => (coveredMask & index.bitByKey.get(key)) === 0n)
      .sort((left, right) => (index.byTargetKey.get(left)?.length || 0) - (index.byTargetKey.get(right)?.length || 0)
        || left.localeCompare(right, 'zh-Hans-CN'))[0];
    for (const entry of index.byTargetKey.get(uncovered) || []) {
      if (selected.includes(entry) || (entry.userMask & usedMask) !== 0n) continue;
      search([...selected, entry], coveredMask | entry.mustMask, usedMask | entry.userMask);
    }
  };
  search([], 0n, 0n);
  return results;
}

function makeAlternativePartial(result, reference) {
  if (reference.status !== 'partial_accepted') return result;
  const referenceUnplanned = new Set((reference.plan?.unplanned_must_use || []).map(acknowledgementIdentity));
  const candidateUnplanned = result.plan?.unplanned_must_use || [];
  if (candidateUnplanned.some(item => !referenceUnplanned.has(acknowledgementIdentity(item)))) return null;
  result.status = 'partial_accepted';
  result.generation_allowed = true;
  result.commitment = '部分处理方案：已为可规划食材保留做法，仍会显示未处理食材。';
  result.actions = [];
  return result;
}

function responsePromiseClass(result) {
  if (result.status === 'complete') return 'complete';
  if (result.status === 'ready') return 'ready';
  if (result.status === 'partial_accepted') return 'partial_accepted';
  if (result.status === 'needs_user_decision') return 'needs_user_decision';
  return result.status;
}

function preservesPromise(candidate, current) {
  if (responsePromiseClass(candidate) !== responsePromiseClass(current)) return false;
  if (current.status === 'complete') {
    return candidate.plan?.coverage_ratio === 1 && (candidate.plan?.unplanned_must_use || []).length === 0;
  }
  if (current.status === 'partial_accepted') {
    const currentUnplanned = new Set((current.plan?.unplanned_must_use || []).map(acknowledgementIdentity));
    return (candidate.plan?.unplanned_must_use || []).every(item => currentUnplanned.has(acknowledgementIdentity(item)));
  }
  if (current.status === 'ready') {
    return (candidate.plan?.planned_prefer_use || []).some(item => item.recognized)
      && (candidate.plan?.unused_prefer_use || []).every(item => item.reason_code && item.reason);
  }
  return true;
}

function candidatePlanningRequest(request) {
  const clean = requestWithoutSwapHistory(request);
  if (clean.decision?.action === 'accept_partial') {
    return { ...clean, decision: null, allow_third_pot: false };
  }
  return clean;
}

function enumerateValidatedPlanResults(assets, request) {
  const planningRequest = candidatePlanningRequest(request);
  const authoritative = planMeal(assets, requestWithoutSwapHistory(request));
  const results = [authoritative];
  const normalizedItems = normalizePlannerItems([
    ...(planningRequest.must_use || []).map(raw => ({ raw, role: 'must_use' })),
    ...(planningRequest.prefer_use || []).map(raw => ({ raw, role: 'prefer_use' })),
  ], assets.taxonomy);
  const publicRanked = rankPotCandidates(buildPotCandidates(assets, planningRequest), planningRequest);
  const needsAssignmentVariants = planningRequest.mode === 'recommend' || authoritative.status === 'complete';
  const searchRanked = needsAssignmentVariants
    ? rankPotCandidates(buildPotCandidatesInternal(assets, planningRequest, true), planningRequest)
    : publicRanked;
  const allergyAliases = buildPlannerAllergenAliases(assets.taxonomy, assets.recipes);
  if (planningRequest.mode === 'recommend') {
    for (const candidate of searchRanked) {
      if (!candidate.single_pot_eligible) continue;
      results.push(buildPlannerResponse(assets, planningRequest, normalizedItems, publicRanked, [candidate], { allergyAliases }));
    }
  } else if (authoritative.status === 'complete') {
    const must = uniqueSubmittedItems(normalizedItems).filter(item => item.role === 'must_use');
    const maxPots = planningRequest.allow_third_pot ? 3 : 2;
    for (let potCount = 1; potCount <= maxPots; potCount += 1) {
      for (const pots of collectExactCompletePotCombinations(searchRanked, must, potCount)) {
        results.push(buildPlannerResponse(assets, planningRequest, normalizedItems, publicRanked, pots, { allergyAliases }));
      }
    }
  } else if (authoritative.status === 'needs_user_decision' || authoritative.status === 'partial_accepted') {
    for (const candidate of searchRanked) {
      const partial = buildPlannerResponse(assets, planningRequest, normalizedItems, publicRanked, [candidate], { allergyAliases });
      const adjusted = makeAlternativePartial(partial, authoritative);
      if (adjusted) results.push(adjusted);
    }
  }
  const unique = new Map();
  for (const result of results) {
    const key = planStructureKey(result);
    if (!unique.has(key)) unique.set(key, result);
  }
  return [...unique.values()];
}

async function identifiedValidPlans(assets, request) {
  const results = enumerateValidatedPlanResults(assets, request);
  const identified = [];
  const seenIds = new Set();
  for (const result of results) {
    const withId = await attachPlanIdentity(result);
    if (seenIds.has(withId.plan.plan_id)) continue;
    seenIds.add(withId.plan.plan_id);
    identified.push(withId);
  }
  return identified;
}

function submittedRecommendCount(result) {
  return uniqueSubmittedItems(result.normalized_items || [])
    .filter(item => item.role === 'prefer_use').length;
}

function isNormalRecommendCandidate(result) {
  if (result?.status !== 'ready' || result.generation_allowed !== true
      || result.mode !== 'recommend' || result.legacy_fallback === true
      || result.plan_source === 'legacy_recipe_selector'
      || result.plan?.plan_kind !== 'single_pot'
      || result.plan?.pots?.length !== 1) return false;
  const submittedCount = submittedRecommendCount(result);
  const plannedCount = result.plan?.planned_prefer_use?.length || 0;
  if (submittedCount > 0 && plannedCount < minimumRecommendCoverageCount(submittedCount)) return false;
  if (!(result.plan?.unused_prefer_use || []).every(item => item.reason_code && item.reason)) return false;
  return (result.plan?.required_extra_items || [])
    .every(item => BASIC_EXTRA_CATEGORIES.has(item.category));
}

function selectDiverseCandidates(candidates, limit) {
  const boundedLimit = Math.max(1, Math.min(3, Number.isInteger(limit) ? limit : 3));
  const ordered = [...candidates].sort((left, right) => {
    const coverageDifference = (right.plan?.planned_prefer_use?.length || 0)
      - (left.plan?.planned_prefer_use?.length || 0);
    if (coverageDifference) return coverageDifference;
    const extraDifference = (left.plan?.required_extra_items?.length || 0)
      - (right.plan?.required_extra_items?.length || 0);
    if (extraDifference) return extraDifference;
    return planStructureKey(left).localeCompare(planStructureKey(right), 'zh-Hans-CN')
      || left.plan.plan_id.localeCompare(right.plan.plan_id);
  });
  if (!ordered.length) return [];
  const bestCoverage = ordered[0].plan?.planned_prefer_use?.length || 0;
  const selected = [];
  const selectedIds = new Set();
  const selectedStructures = new Set();
  for (const candidate of ordered) {
    if ((candidate.plan?.planned_prefer_use?.length || 0) < bestCoverage - 1) continue;
    const planId = candidate.plan?.plan_id;
    const structure = planStructureKey(candidate);
    if (!planId || selectedIds.has(planId) || selectedStructures.has(structure)) continue;
    selected.push(candidate);
    selectedIds.add(planId);
    selectedStructures.add(structure);
    if (selected.length >= boundedLimit) break;
  }
  return selected;
}

export async function planMealCandidateBundle(assets = {}, request = {}, { limit = 3 } = {}) {
  const cleanRequest = requestWithoutSwapHistory(request);
  const plans = await identifiedValidPlans(assets, cleanRequest);
  const selected = selectDiverseCandidates(plans.filter(isNormalRecommendCandidate), limit);
  if (!selected.length) {
    const authoritative = await attachPlanIdentity(planMeal(assets, cleanRequest));
    return {
      ...authoritative,
      candidate_plans: [],
      preferred_plan_id: null,
    };
  }
  return {
    ...structuredClone(selected[0]),
    candidate_plans: selected.map(candidate => structuredClone(candidate)),
    preferred_plan_id: selected[0].plan.plan_id,
  };
}

export async function resolveAuthoritativePlanById(assets = {}, request = {}, planId = '') {
  if (request.mode === 'recommend' && !request.current_plan_id && !request.decision) {
    const bundle = await planMealCandidateBundle(assets, request, { limit: 3 });
    const member = bundle.candidate_plans.find(candidate => candidate.plan?.plan_id === planId);
    if (member) return structuredClone(member);
    if (bundle.plan?.plan_id === planId && !bundle.candidate_plans.length) {
      const detached = structuredClone(bundle);
      delete detached.candidate_plans;
      delete detached.preferred_plan_id;
      return detached;
    }
    return null;
  }
  const authoritative = await planMealWithIdentity(assets, request);
  return authoritative.plan?.plan_id === planId ? authoritative : null;
}

function stalePlanResponse() {
  return {
    status: 'stale_plan',
    code: 'stale_plan',
    generation_allowed: false,
    message: '计划规则或输入已经变化，请重新规划。',
    actions: [structuredAction('replan', '重新规划', [])],
  };
}

function noAlternativeResponse(current) {
  const retained = structuredClone(current);
  const unplannedItems = (retained.plan?.unplanned_must_use || []).map(acknowledgementIdentity);
  const eligible = retained.mode === 'pantry'
    ? uniqueSubmittedItems(retained.normalized_items || []).filter(item => item.role === 'must_use').map(acknowledgementIdentity)
    : [];
  retained.status = 'no_alternative_plan';
  retained.code = 'no_alternative_plan';
  retained.generation_allowed = false;
  retained.message = '当前组合只有一个可靠的一锅方案';
  retained.actions = [
    structuredAction('relax_item', '放宽一种食材', unplannedItems, { eligible_items: eligible, requires_acknowledgement: true }),
    structuredAction('force_multi_pot', '分成两锅', unplannedItems),
    structuredAction('edit_ingredients', '返回修改食材', unplannedItems),
  ];
  return retained;
}

function alternativeLevel(candidate, current) {
  if (templateSequence(candidate) !== templateSequence(current)) return 1;
  return planStructureKey(candidate) !== planStructureKey(current) ? 2 : 99;
}

function selectedPotSignature(selected) {
  return selected.map(entry => `${entry.candidate.template_id}\u0000${entry.candidate.assignment_key}`).join('\u0001');
}

function selectedTemplateSequence(selected) {
  return selected.map(entry => entry.candidate.template_id).join('\u0000');
}

// A decision-state swap must not fall back from the reviewed two-pot partial
// search to a greedy single pot. Scan the same validated assignment variants at
// depth <=2, retain only maximum-coverage/equal-promise structures, then hash
// tied finalists lazily. With at most 20 recent IDs, the first non-recent winner
// is found after at most 21 hashes without inventing a top-N eligibility cap.
function buildPartialAlternativeContext(assets, request) {
  const planningRequest = candidatePlanningRequest(request);
  const normalizedItems = normalizePlannerItems([
    ...(planningRequest.must_use || []).map(raw => ({ raw, role: 'must_use' })),
    ...(planningRequest.prefer_use || []).map(raw => ({ raw, role: 'prefer_use' })),
  ], assets.taxonomy);
  const searchRanked = rankPotCandidates(buildPotCandidatesInternal(assets, planningRequest, true), planningRequest);
  const seenTemplates = new Set();
  const publicRanked = searchRanked.filter(candidate => {
    if (seenTemplates.has(candidate.template_id)) return false;
    seenTemplates.add(candidate.template_id);
    return true;
  });
  const allergyAliases = buildPlannerAllergenAliases(assets.taxonomy, assets.recipes);
  const must = uniqueSubmittedItems(normalizedItems).filter(item => item.role === 'must_use');
  const entries = searchRanked.map((candidate, rank) => ({
    candidate,
    rank,
    userKeys: canonicalUserKeys(candidate),
    mustKeys: combinedItemKeys([candidate], 'planned_must_use'),
  }));
  return { planningRequest, normalizedItems, publicRanked, searchRanked, allergyAliases, must, entries };
}

function capacityPartialContext(assets, request) {
  if (request.mode !== 'pantry') return null;
  const normalizedItems = normalizePlannerItems([
    ...(request.must_use || []).map(raw => ({ raw, role: 'must_use' })),
    ...(request.prefer_use || []).map(raw => ({ raw, role: 'prefer_use' })),
  ], assets.taxonomy);
  const must = uniqueSubmittedItems(normalizedItems).filter(item => item.role === 'must_use');
  const recognizedMustCount = must.filter(item => item.recognized).length;
  if (recognizedMustCount <= maxPlannerUserItemsPerPot(assets, request) * 3) return null;
  const context = buildPartialAlternativeContext(assets, request);
  const selected = findBestPartialPotCombination(context.searchRanked, context.planningRequest);
  const current = buildPlannerResponse(assets, context.planningRequest, context.normalizedItems, context.publicRanked, selected, {
    allergyAliases: context.allergyAliases,
    capacityExceeded: selected.length > 0,
  });
  return { ...context, current };
}

function maximumCoveragePartialSelections(context) {
  const { entries, must } = context;
  let bestCoverageCount = -1;
  const finalists = new Map();
  const consider = selected => {
    const count = new Set(selected.flatMap(entry => [...entry.mustKeys])).size;
    if (count === must.length) return;
    if (count > bestCoverageCount) {
      bestCoverageCount = count;
      finalists.clear();
    }
    if (count === bestCoverageCount) finalists.set(selectedPotSignature(selected), selected);
  };
  for (const entry of entries) consider([entry]);
  for (let left = 0; left < entries.length; left += 1) {
    for (let right = left + 1; right < entries.length; right += 1) {
      if ([...entries[left].userKeys].some(key => entries[right].userKeys.has(key))) continue;
      consider([entries[left], entries[right]]);
    }
  }
  return [...finalists.entries()].sort(([left], [right]) => left.localeCompare(right, 'zh-Hans-CN')).map(([, selected]) => selected);
}

async function findPartialPlanMembership(assets, context, planId) {
  for (const selected of maximumCoveragePartialSelections(context)) {
    const response = buildPlannerResponse(assets, context.planningRequest, context.normalizedItems, context.publicRanked,
      selected.map(entry => entry.candidate), { allergyAliases: context.allergyAliases });
    if (response.status !== 'needs_user_decision') continue;
    const identified = await attachPlanIdentity(response);
    if (identified.plan.plan_id === planId) return identified;
  }
  return null;
}

async function findBestPartialAlternative(assets, request, current, preparedContext = null) {
  const context = preparedContext || buildPartialAlternativeContext(assets, request);
  const {
    planningRequest, normalizedItems, publicRanked, allergyAliases, must, entries,
  } = context;
  const currentCount = current.plan?.planned_must_use?.length || 0;
  const currentTemplates = templateSequence(current);
  const currentStructure = planStructureKey(current);
  let bestCoverageCount = -1;
  let bestLevel = Number.MAX_SAFE_INTEGER;
  const finalists = new Map();
  const consider = selected => {
    const mustKeys = new Set(selected.flatMap(entry => [...entry.mustKeys]));
    if (mustKeys.size < currentCount || mustKeys.size === must.length) return;
    const level = selectedTemplateSequence(selected) === currentTemplates ? 2 : 1;
    const signature = selectedPotSignature(selected);
    if (mustKeys.size > bestCoverageCount || (mustKeys.size === bestCoverageCount && level < bestLevel)) {
      bestCoverageCount = mustKeys.size;
      bestLevel = level;
      finalists.clear();
    }
    if (mustKeys.size === bestCoverageCount && level === bestLevel) finalists.set(signature, selected);
  };
  for (const entry of entries) consider([entry]);
  for (let left = 0; left < entries.length; left += 1) {
    for (let right = left + 1; right < entries.length; right += 1) {
      if ([...entries[left].userKeys].some(key => entries[right].userKeys.has(key))) continue;
      consider([entries[left], entries[right]]);
    }
  }
  const recent = new Set(request.recent_plan_ids || []);
  let firstRecent = null;
  for (const selected of [...finalists.entries()].sort(([left], [right]) => left.localeCompare(right, 'zh-Hans-CN')).map(([, value]) => value)) {
    let response = buildPlannerResponse(assets, planningRequest, normalizedItems, publicRanked,
      selected.map(entry => entry.candidate), { allergyAliases });
    response = makeAlternativePartial(response, current);
    if (!response) continue;
    if (response.status !== current.status || response.plan.planned_must_use.length < currentCount) continue;
    const identified = await attachPlanIdentity(response);
    if (identified.plan.plan_id === current.plan.plan_id || planStructureKey(identified) === currentStructure) continue;
    if (!recent.has(identified.plan.plan_id)) return identified;
    if (!firstRecent) firstRecent = identified;
  }
  return firstRecent;
}

async function validatedPartialAcceptance(assets, request) {
  const baselineRequest = {
    ...requestWithoutSwapHistory(request),
    decision: null,
  };
  const current = await attachPlanIdentity(planMeal(assets, baselineRequest));
  const decisionPlanId = typeof request.decision?.plan_id === 'string' ? request.decision.plan_id.trim() : '';
  const acknowledged = request.decision?.acknowledged_unplanned;
  const expected = (current.plan?.unplanned_must_use || []).map(acknowledgementIdentity);
  const swapCurrent = request.decision?.swap_current === true;
  if (!decisionPlanId || (!swapCurrent && decisionPlanId !== request.current_plan_id) || decisionPlanId !== current.plan.plan_id
      || current.status !== 'needs_user_decision' || !current.plan?.pots?.length
      || !exactStringSet(acknowledged, expected)) {
    throw invalidPlannerRequest('accept_partial acknowledgement does not match the authoritative partial plan');
  }
  current.status = 'partial_accepted';
  current.generation_allowed = true;
  current.commitment = '部分处理方案：已为可规划食材保留做法，仍会显示未处理食材。';
  current.actions = [];
  return current;
}

async function handleExplicitRelaxDecision(assets, request) {
  const baseRequest = {
    ...requestWithoutSwapHistory(request),
    decision: null,
  };
  const current = await attachPlanIdentity(planMeal(assets, baseRequest));
  const chosen = typeof request.decision?.item === 'string' ? request.decision.item.trim() : '';
  const unplannedTarget = (current.plan?.unplanned_must_use || [])
    .find(item => chosen && (item.raw === chosen || item.canonical === chosen));
  if (unplannedTarget) return attachPlanIdentity(planMeal(assets, request));

  if (!request.current_plan_id || request.current_plan_id !== current.plan.plan_id) {
    throw invalidPlannerRequest('relax_item planned-item decision does not match the authoritative plan');
  }
  const swapProbe = await planMealWithIdentity(assets, { ...baseRequest, current_plan_id: current.plan.plan_id });
  if (swapProbe.status !== 'no_alternative_plan') {
    throw invalidPlannerRequest('relax_item planned-item decision is only valid after no_alternative_plan');
  }
  const eligible = new Set(swapProbe.actions.find(action => action.action === 'relax_item')?.eligible_items || []);
  if (!chosen || !eligible.has(chosen)) throw invalidPlannerRequest('relax_item must select one eligible current must-use item');
  const normalizedMust = normalizePlannerItems((baseRequest.must_use || []).map(raw => ({ raw, role: 'must_use' })), assets.taxonomy);
  const movedRaw = normalizedMust.filter(item => item.raw === chosen || item.canonical === chosen).map(item => item.raw);
  if (!movedRaw.length) throw invalidPlannerRequest('relax_item must select one eligible current must-use item');
  const moved = new Set(movedRaw);
  return attachPlanIdentity(planMeal(assets, {
    ...baseRequest,
    must_use: (baseRequest.must_use || []).filter(raw => !moved.has(raw)),
    prefer_use: [...new Set([...(baseRequest.prefer_use || []), ...movedRaw])],
  }));
}

export async function planMealWithIdentity(assets = {}, request = {}) {
  if (request.decision?.action === 'accept_partial') {
    let accepted;
    try {
      accepted = await validatedPartialAcceptance(assets, request);
    } catch (error) {
      // First acceptance is an input-validation boundary and rejects forged
      // acknowledgements. An explicit accepted-plan swap is active navigation:
      // if its prior acknowledgement no longer belongs to the recomputed input,
      // surface the protocol's stale state instead of turning it into a 400.
      if (request.decision.swap_current === true && error?.code === 'invalid_planner_request') {
        return stalePlanResponse();
      }
      throw error;
    }
    // Status is deliberately excluded from plan identity, so this stateless
    // protocol needs an explicit bit to distinguish first acceptance from a
    // later swap under the already-acknowledged partial promise.
    if (request.decision.swap_current !== true) return accepted;
    const baselineRequest = { ...requestWithoutSwapHistory(request), decision: null };
    const partialContext = buildPartialAlternativeContext(assets, baselineRequest);
    let current = accepted;
    if (request.current_plan_id !== accepted.plan.plan_id) {
      const member = await findPartialPlanMembership(assets, partialContext, request.current_plan_id);
      current = member ? makeAlternativePartial(member, accepted) : null;
      if (!current) return stalePlanResponse();
    }
    const alternative = await findBestPartialAlternative(assets, request, current, partialContext);
    return alternative || noAlternativeResponse(current);
  }
  if (request.decision?.action === 'relax_item') return handleExplicitRelaxDecision(assets, request);
  if (!request.current_plan_id) {
    return attachPlanIdentity(planMeal(assets, requestWithoutSwapHistory(request)));
  }
  const fastPartial = capacityPartialContext(assets, requestWithoutSwapHistory(request));
  if (fastPartial) {
    const current = await attachPlanIdentity(fastPartial.current);
    if (current.plan.plan_id === request.current_plan_id) {
      const alternative = await findBestPartialAlternative(assets, request, current, fastPartial);
      return alternative || noAlternativeResponse(current);
    }
    const priorAlternative = await findPartialPlanMembership(assets, fastPartial, request.current_plan_id);
    if (priorAlternative) {
      const alternative = await findBestPartialAlternative(assets, request, priorAlternative, fastPartial);
      return alternative || noAlternativeResponse(priorAlternative);
    }
  }
  const authoritative = await attachPlanIdentity(planMeal(assets, requestWithoutSwapHistory(request)));
  if (authoritative.status === 'needs_user_decision' || authoritative.status === 'partial_accepted') {
    const partialContext = buildPartialAlternativeContext(assets, requestWithoutSwapHistory(request));
    const current = authoritative.plan.plan_id === request.current_plan_id
      ? authoritative
      : await findPartialPlanMembership(assets, partialContext, request.current_plan_id);
    if (current) {
      const alternative = await findBestPartialAlternative(assets, request, current, partialContext);
      return alternative || noAlternativeResponse(current);
    }
  }
  const plans = await identifiedValidPlans(assets, request);
  const current = plans.find(plan => plan.plan.plan_id === request.current_plan_id);
  if (!current) return stalePlanResponse();
  const recent = new Set(request.recent_plan_ids || []);
  const alternatives = plans.filter(candidate => candidate.plan.plan_id !== current.plan.plan_id
      && planStructureKey(candidate) !== planStructureKey(current)
      && preservesPromise(candidate, current))
    .sort((left, right) => {
      const leftCoverage = left.plan?.coverage_ratio || 0;
      const rightCoverage = right.plan?.coverage_ratio || 0;
      if (leftCoverage !== rightCoverage) return rightCoverage - leftCoverage;
      const recentDifference = Number(recent.has(left.plan.plan_id)) - Number(recent.has(right.plan.plan_id));
      if (recentDifference) return recentDifference;
      const levelDifference = alternativeLevel(left, current) - alternativeLevel(right, current);
      if (levelDifference) return levelDifference;
      return planStructureKey(left).localeCompare(planStructureKey(right), 'zh-Hans-CN')
        || left.plan.plan_id.localeCompare(right.plan.plan_id);
    });
  return alternatives[0] || noAlternativeResponse(current);
}

export async function verifyPlanSnapshot(assets = {}, request = {}, snapshot = {}) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)
      || typeof snapshot.plan_id !== 'string'
      || snapshot.planner_version !== PLANNER_VERSION
      || snapshot.template_catalog_version !== assets.templates?.template_catalog_version) {
    return stalePlanResponse();
  }
  if (request.decision?.action === 'accept_partial') {
    let accepted;
    try {
      accepted = await validatedPartialAcceptance(assets, request);
    } catch {
      return stalePlanResponse();
    }
    if (snapshot.plan_id === accepted.plan.plan_id) return accepted;
    const baselineRequest = { ...requestWithoutSwapHistory(request), decision: null };
    const partialContext = buildPartialAlternativeContext(assets, baselineRequest);
    const member = await findPartialPlanMembership(assets, partialContext, snapshot.plan_id);
    return member ? makeAlternativePartial(member, accepted) || stalePlanResponse() : stalePlanResponse();
  }
  const cleanRequest = requestWithoutSwapHistory(request);
  const authoritative = await attachPlanIdentity(planMeal(assets, cleanRequest));
  if (authoritative.plan.plan_id === snapshot.plan_id) return authoritative;
  if (authoritative.status === 'needs_user_decision' || authoritative.status === 'partial_accepted') {
    const partialContext = buildPartialAlternativeContext(assets, cleanRequest);
    const member = await findPartialPlanMembership(assets, partialContext, snapshot.plan_id);
    if (member) return member;
  }
  const plans = await identifiedValidPlans(assets, cleanRequest);
  return plans.find(plan => plan.plan.plan_id === snapshot.plan_id) || stalePlanResponse();
}

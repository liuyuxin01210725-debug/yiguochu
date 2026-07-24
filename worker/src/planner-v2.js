import { preparedRatioCatalogContext } from './ratio-dsl.js';
import { resolveBasicExtraIdentity, taxonomyIdentityIndex } from './taxonomy-identity.js';

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
    for (const name of [item.display_name, ...(item.aliases || [])]) {
      const key = normalizeIngredientTaxonomyKey(name);
      if (key && !index.has(key)) index.set(key, item);
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
  const parsed = rawItems.map(plannerItemInput).map(input => ({
    ...input,
    item: index.get(normalizeIngredientTaxonomyKey(input.raw)) || null,
  }));
  const representativeByCanonical = new Map();
  for (let indexOfItem = 0; indexOfItem < parsed.length; indexOfItem += 1) {
    const entry = parsed[indexOfItem];
    if (!entry.item || entry.role !== 'must_use') continue;
    const canonical = entry.item.canonical_name || entry.item.display_name;
    if (!representativeByCanonical.has(canonical)) representativeByCanonical.set(canonical, indexOfItem);
  }
  for (let indexOfItem = 0; indexOfItem < parsed.length; indexOfItem += 1) {
    const entry = parsed[indexOfItem];
    if (!entry.item) continue;
    const canonical = entry.item.canonical_name || entry.item.display_name;
    if (!representativeByCanonical.has(canonical)) representativeByCanonical.set(canonical, indexOfItem);
  }
  return parsed.map((entry, indexOfItem) => {
    const { raw, role, item } = entry;
    if (!item) {
      return {
        raw,
        canonical: null,
        category: null,
        shape_or_cut: null,
        cook_speed: null,
        moisture_release: null,
        texture_behavior: null,
        cooking_risk: 'unknown',
        recognized: false,
        role,
        duplicate_of: null,
      };
    }
    const canonical = item.canonical_name || item.display_name;
    const representativeIndex = representativeByCanonical.get(canonical);
    const duplicate_of = representativeIndex === indexOfItem ? null : parsed[representativeIndex].raw;
    return {
      raw,
      canonical,
      category: item.category,
      shape_or_cut: taxonomyShapeForInput(item, raw),
      cook_speed: item.cook_speed,
      moisture_release: item.moisture_release,
      texture_behavior: item.texture_behavior.behavior_code,
      cooking_risk: item.cooking_risk.risk_code,
      recognized: true,
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
        return identity ? { name: identity.name, category: identity.category, attributes: {} } : null;
      })()
      : (() => {
        const identity = identities.get(item?.name?.trim?.().toLowerCase().replace(/\s+/g, ''));
        return identity && identity.category === item?.category ? { name: identity.name, category: identity.category, attributes: item.attributes || {} } : null;
      })());
    if (normalized.some(item => !item || typeof item !== 'object' || Array.isArray(item)
      || typeof item.name !== 'string' || !item.name.trim() || typeof item.category !== 'string' || !item.category.trim())) return null;
    slots.set(slotId, normalized.map(item => ({ name: item.name.trim(), category: item.category.trim(), attributes: item.attributes || {} })));
  }
  return slots;
}

function defaultBound(bounds) {
  return bounds?.default;
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
      if (operator === 'per_serving') {
        const items = slots.get(operation.target?.slot_id);
        const grams = defaultBound(operation.grams);
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
        const grams = defaultBound(operation.grams);
        const multiplier = operator === 'scale_by_servings' ? context.servings : 1;
        if (!finiteNonNegativeNumber(grams) || !resolveBasicExtraIdentity(operation.target, validationContext.taxonomy)) {
          return ratioFailure('ratio_rule_invalid', '基础补充规则无效。');
        }
        if (!addAmount(operation.target.name, grams * multiplier, operation.target)) return ratioFailure('ratio_rule_invalid', '基础补充结果无效。');
        trace.push({ operator, name: operation.target.name, grams: roundRatioGrams(grams * multiplier, nearest) });
        continue;
      }
      return ratioFailure('ratio_rule_invalid', '份量规则包含不支持的操作。');
    }
    const template = validationContext.templates?.templates?.find(entry => entry?.template_id === rule.when?.template_id);
    const acceptedCategories = new Map([
      ...(template?.required_slots || []), ...(template?.optional_slots || []),
    ].map(slot => [slot.slot_id, new Set(template?.ingredient_categories?.[slot.slot_id] || [])]));
    for (const [slotId, items] of slots) {
      const accepted = acceptedCategories.get(slotId);
      if (!accepted || items.some(item => !accepted.has(item.category))) return ratioFailure('ratio_context_category_mismatch', '食材类别与槽位不兼容。');
    }
    const optionalSlots = new Set((template?.optional_slots || []).filter(slot => slot?.source_policy?.includes('user')).map(slot => slot.slot_id));
    for (const [slotId, items] of slots) {
      if (!optionalSlots.has(slotId) || !items.length) continue;
      const grams = ratioCatalog.optional_per_serving?.[template.template_id]?.[slotId];
      if (!finiteNonNegativeNumber(grams) || grams <= 0) return ratioFailure('ratio_rule_invalid', '可选食材缺少可执行克数。');
      for (const item of items) if (!addAmount(item.name, grams * context.servings)) return ratioFailure('ratio_rule_invalid', '可选食材克数无效。');
      trace.push({ operator:'per_serving', slot_id:slotId, grams_per_serving:grams });
    }
    for (const item of allSlotItems) {
      if (!amounts.has(item.name) || amounts.get(item.name) <= 0) return ratioFailure('ratio_rule_invalid', '已确定食材缺少可执行克数。');
    }
    const ingredient_amounts = [...amounts.entries()].map(([name, grams]) => ({ name, grams })).sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
    const required_extra_items = [...extras.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
    const retainedLiquidGrams = required_extra_items
      .filter(item => item.category === 'liquid')
      .reduce((sum, item) => sum + item.grams, 0);
    return {
      ok: true,
      code: 'ratio_compiled',
      ingredient_amounts,
      required_extra_items,
      liquid_constraints: retainedLiquidGrams === 0 ? {} : {
        retained_liquid_grams: retainedLiquidGrams,
        liquid_credit_grams: roundRatioGrams(liquidCredit, nearest),
        rounding_grams: nearest,
      },
      ratio_trace: trace,
    };
  } catch {
    return ratioFailure('ratio_rule_invalid', '份量规则无法安全计算。');
  }
}

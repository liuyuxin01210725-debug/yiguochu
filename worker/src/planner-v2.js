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
      display_name: item.display_name,
      category: item.category,
      shape_or_cut: taxonomyShapeForInput(item, raw),
      cook_speed: item.cook_speed,
      moisture_release: item.moisture_release,
      texture_behavior: item.texture_behavior.behavior_code,
      cooking_risk: item.cooking_risk.risk_code,
      required_endpoint_codes: [...(item.cooking_risk.required_endpoint_codes || [])],
      compatible_slot_codes: [...(item.compatible_slot_codes || [])],
      incompatible_slot_codes: [...(item.incompatible_slot_codes || [])],
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

const ACTIVE_TEMPLATE_IDS = new Set([
  'acid-staple-pot', 'savory-mixed-rice-pot', 'cooked-rice-stir-pot', 'broth-noodle-pot',
  'egg-tofu-vegetable-pot', 'mushroom-vegetable-stew-pot', 'beef-staple-pot', 'poultry-staple-pot',
]);
const BASIC_EXTRA_CATEGORIES = new Set(['raw_rice', 'cooked_rice', 'noodle', 'liquid', 'oil', 'seasoning']);
const RAW_RISK_CODES = new Set(['raw_egg', 'raw_poultry', 'raw_pork', 'raw_beef', 'raw_seafood']);
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
      canonical: item.canonical_name || item.display_name,
      display_name: item.display_name,
      category: item.category,
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
      attributes: {
        cook_speed: item.cook_speed,
        moisture_release: item.moisture_release,
        texture_behavior: item.texture_behavior,
        cooking_risk: item.cooking_risk,
      },
    }))])),
  };
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
    const choices = [];
    if (slot.source_policy?.includes('user')) {
      for (const item of users) {
        if (used.has(item)) continue;
        const fit = itemFit(slot, item, template);
        if (fit.ok) choices.push(assignedUserRecord(item));
        else if (fit.reason_code === 'unsupported_shape_or_cut') {
          mostSpecificFailure = rejection('unsupported_shape_or_cut', '这个食材的部位或形态不适合该做法。', {
            item: item.raw, slot_id: slot.slot_id,
          });
        }
      }
    }
    choices.push(...basicSlotChoices(slot, context.taxonomy, dislikes, allergyAliases));
    for (const choice of choices) {
      const nextUsed = new Set(used);
      if (choice.source === 'user') nextUsed.add(users.find(item => item.raw === choice.raw && item.canonical === choice.canonical));
      visitRequired(index + 1, { ...assignment, [slot.slot_id]: [choice] }, nextUsed);
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
      const rule = (context.ratioCatalog?.rules || []).find(candidate => candidate.when?.template_id === template.template_id
        && template.ratio_constraints?.includes(candidate.rule_id)
        && (assignment[candidate.when.slot_id] || []).some(item => item.category === candidate.when.category));
      if (!rule) {
        hardFailure ||= rejection('would_break_ratio', '这组槽位没有可执行的份量比例。');
        continue;
      }
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
  if (!item.recognized) return {
    ...structuredClone(item),
    reason_code: 'unrecognized_ingredient',
    reason: '暂时无法识别这种食材，因此不能承诺已经安排。',
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

export function buildPotCandidates(assets = {}, request = {}) {
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
  const recognizedMust = must.filter(item => item.recognized);
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
    });
    if (!assigned.ok) continue;
    const planned = assignedItems(assigned.slot_assignment).filter(item => item.source === 'user');
    const plannedKeys = new Set(planned.map(item => `${item.role}\u0000${item.canonical}`));
    const plannedMust = must.filter(item => plannedKeys.has(`must_use\u0000${item.canonical}`));
    const plannedPrefer = prefer.filter(item => plannedKeys.has(`prefer_use\u0000${item.canonical}`));
    if (request.mode === 'recommend' && recognizedSubmitted.length && plannedPrefer.length === 0) continue;
    const unplannedMust = must.filter(item => !plannedKeys.has(`must_use\u0000${item.canonical}`))
      .map(item => unusedReason(item, assigned.slot_assignment, template, 'must_use', request.dislikes || [], allergyAliases));
    const unusedPrefer = prefer.filter(item => !plannedKeys.has(`prefer_use\u0000${item.canonical}`))
      .map(item => unusedReason(item, assigned.slot_assignment, template, 'prefer_use', request.dislikes || [], allergyAliases));
    const coverage_ratio = must.length ? plannedMust.length / must.length : 0;
    const promiseItems = request.mode === 'pantry' ? must : prefer;
    const recognizedPromiseItems = promiseItems.filter(item => item.recognized);
    const recognition_ratio = promiseItems.length ? recognizedPromiseItems.length / promiseItems.length : 0;
    const recognized_coverage_ratio = recognizedMust.length ? plannedMust.length / recognizedMust.length : 0;
    candidates.push({
      ...assigned,
      planned_must_use: plannedMust.map(item => ({ ...item })),
      planned_prefer_use: plannedPrefer.map(item => ({ ...item })),
      unplanned_must_use: unplannedMust,
      unused_prefer_use: unusedPrefer,
      coverage_ratio,
      recognition_ratio,
      recognized_coverage_ratio,
      single_pot_eligible: request.mode === 'recommend' ? plannedPrefer.length > 0 : displayFloor(must.length, plannedMust.length),
    });
  }
  return candidates;
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

export function planMeal(assets = {}, request = {}) {
  const normalized_items = normalizePlannerItems([
    ...(request.must_use || []).map(raw => ({ raw, role: 'must_use' })),
    ...(request.prefer_use || []).map(raw => ({ raw, role: 'prefer_use' })),
  ], assets.taxonomy);
  const ranked = rankPotCandidates(buildPotCandidates(assets, request), request);
  const allergyAliases = buildPlannerAllergenAliases(assets.taxonomy, assets.recipes);
  const chosen = ranked.find(candidate => candidate.single_pot_eligible);
  if (!chosen) {
    const explanatory = ranked[0] || null;
    const unique = uniqueSubmittedItems(normalized_items);
    const fallbackMust = unique.filter(item => item.role === 'must_use').map(item => ({
      ...item,
      reason_code: itemMatchesDislikes(item, request.dislikes || [], allergyAliases) ? 'allergen_conflict'
        : item.recognized ? 'no_compatible_slot' : 'unrecognized_ingredient',
      reason: itemMatchesDislikes(item, request.dislikes || [], allergyAliases) ? '这项食材与你设置的忌口冲突。'
        : item.recognized ? '当前启用模板没有能可靠接纳这项食材的槽位。' : '暂时无法识别这种食材，因此不能承诺已经安排。',
    }));
    const fallbackPrefer = unique.filter(item => item.role === 'prefer_use').map(item => ({
      ...item,
      reason_code: itemMatchesDislikes(item, request.dislikes || [], allergyAliases) ? 'allergen_conflict'
        : item.recognized ? 'lower_compatibility' : 'unrecognized_ingredient',
      reason: itemMatchesDislikes(item, request.dislikes || [], allergyAliases) ? '这项食材与你设置的忌口冲突。'
        : item.recognized ? '当前没有足够可靠的组合来使用这项食材。' : '暂时无法识别这种食材。',
    }));
    const promiseItems = unique.filter(item => item.role === (request.mode === 'pantry' ? 'must_use' : 'prefer_use'));
    const recognizedPromiseCount = promiseItems.filter(item => item.recognized).length;
    return {
      schema_version: 2,
      planner_version: PLANNER_VERSION,
      template_catalog_version: assets.templates?.template_catalog_version || null,
      status: 'no_valid_plan',
      generation_allowed: false,
      mode: request.mode,
      intent: request.intent,
      normalized_items,
      commitment: '当前没有达到承诺门槛的可靠单锅方案。',
      plan: {
        pots: [],
        planned_must_use: explanatory?.planned_must_use.map(item => ({ ...item })) || [],
        planned_prefer_use: explanatory?.planned_prefer_use.map(item => ({ ...item })) || [],
        unplanned_must_use: explanatory?.unplanned_must_use.map(item => ({ ...item })) || fallbackMust,
        unused_prefer_use: explanatory?.unused_prefer_use.map(item => ({ ...item })) || fallbackPrefer,
        coverage_ratio: explanatory?.coverage_ratio || 0,
        recognition_ratio: explanatory?.recognition_ratio ?? (promiseItems.length ? recognizedPromiseCount / promiseItems.length : 0),
        recognized_coverage_ratio: explanatory?.recognized_coverage_ratio ?? 0,
      },
    };
  }
  const complete = request.mode === 'pantry' && chosen.coverage_ratio === 1 && chosen.unplanned_must_use.length === 0;
  const status = request.mode === 'recommend' ? 'ready' : complete ? 'complete' : 'needs_user_decision';
  return {
    schema_version: 2,
    planner_version: PLANNER_VERSION,
    template_catalog_version: assets.templates?.template_catalog_version || null,
    status,
    generation_allowed: request.mode === 'recommend' || complete,
    mode: request.mode,
    intent: request.intent,
    normalized_items,
    commitment: request.mode === 'recommend'
      ? '直接推荐会选择较合适的组合，并如实列出这次未使用的食材。'
      : complete ? '完整清库存计划。' : '还有食材没有安排，需要你先决定下一步。',
    plan: {
      plan_kind: 'single_pot',
      planned_must_use: chosen.planned_must_use.map(item => ({ ...item })),
      planned_prefer_use: chosen.planned_prefer_use.map(item => ({ ...item })),
      unplanned_must_use: chosen.unplanned_must_use.map(item => ({ ...item })),
      unused_prefer_use: chosen.unused_prefer_use.map(item => ({ ...item })),
      required_extra_items: chosen.required_extra_items.map(item => ({ ...item })),
      coverage_ratio: chosen.coverage_ratio,
      recognition_ratio: chosen.recognition_ratio,
      recognized_coverage_ratio: chosen.recognized_coverage_ratio,
      rejection_reason: complete || request.mode === 'recommend' ? null : { reason_code: 'incomplete_coverage', message: '仍有清库存食材没有安排。' },
      pots: [chosen],
    },
  };
}

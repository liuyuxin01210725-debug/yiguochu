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

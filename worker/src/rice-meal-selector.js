import {
  buildPlannerAllergenAliases,
  normalizePlannerItems,
  normalizePlannerTaxonomyKey,
} from './planner-v2.js';
import { matchAllergy } from './allergen-semantics.js';

const ACTIVE_VARIANT_STATUSES = new Set(['preview_ready', 'pilot_observed', 'production_approved']);
const BASIC_COVERAGE_IDS = new Set(['raw-rice', 'water', 'cooking-oil', 'salt']);
const GRADE_RANK = Object.freeze({ A: 0, B: 1 });
const IDENTITY_RANK = Object.freeze({
  regional: 0,
  household_reviewed: 1,
  generic: 2,
});
const CONTROLLED_USER_NOTICES = Object.freeze({
  household_test_pending_feedback: 'Preview 家庭测试标准 · 待真实厨房反馈',
  four_serving_cooker_capacity_check: '请先确认普通电饭煲容量，食材和水不得超过最高刻度/说明书上限',
});
const BALANCE_STARCHY_IDS = new Set([
  // Exact current taxonomy identities only: both have controlled balance
  // prompts. Do not invent a sweet-potato ID while taxonomy has none.
  'potato',
  'sweet-corn',
]);
const ADAPTATION_RANK = Object.freeze({
  direct_adaptation: 0,
  process_adaptation: 1,
  style_adaptation: 2,
  not_suitable: 9,
});

function clone(value) {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function asStringList(value, field) {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new TypeError(`${field} must be an array`);
  return value.map(entry => {
    if (typeof entry !== 'string') throw new TypeError(`${field} entries must be strings`);
    return entry.trim();
  }).filter(Boolean);
}

function uniqueStrings(values) {
  const seen = new Set();
  return values.filter(value => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function itemKey(item = {}) {
  if (item.canonical_id) {
    return `ingredient:${item.canonical_id}\u0000${item.state || ''}\u0000${item.shape_or_cut || ''}`;
  }
  if (item.ambiguity_id) return `ambiguity:${item.ambiguity_id}`;
  return `raw:${normalizePlannerTaxonomyKey(item.raw)}`;
}

function deduplicateNormalizedItems(items) {
  const representativeByKey = new Map();
  return items.map(item => {
    const key = itemKey(item);
    const representative = representativeByKey.get(key);
    if (representative) return { ...item, duplicate_of: representative.raw };
    representativeByKey.set(key, item);
    return { ...item, duplicate_of: null };
  });
}

function validateServings(value) {
  const servings = value == null ? 2 : value;
  if (!Number.isInteger(servings) || servings < 1 || servings > 8) {
    throw new TypeError('servings must be an integer from 1 to 8');
  }
  return servings;
}

// This stays intentionally thin: the controlled taxonomy owns all alias,
// state, cut, ambiguity, and semantic-deduplication rules.
export function normalizeRiceMealRequest(request = {}, taxonomy = {}) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    throw new TypeError('rice meal request must be an object');
  }
  const normalizedItems = deduplicateNormalizedItems(normalizePlannerItems(
    asStringList(request.pantry, 'pantry').map(raw => ({ raw, role: 'prefer_use' })),
    taxonomy,
  ));
  const uniqueItems = normalizedItems.filter(item => item.duplicate_of === null);
  const ignoredBasicItems = uniqueItems.filter(item => BASIC_COVERAGE_IDS.has(item.canonical_id));
  const submittedItems = uniqueItems.filter(item => !BASIC_COVERAGE_IDS.has(item.canonical_id));
  const duplicateItems = normalizedItems.filter(item => item.duplicate_of !== null);
  const dislikes = uniqueStrings(asStringList(request.dislikes, 'dislikes'));
  const dislikeFacts = uniqueStrings(dislikes.map(normalizePlannerTaxonomyKey).filter(Boolean))
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'));
  const currentPlanId = typeof request.current_plan_id === 'string' ? request.current_plan_id.trim() || null : null;
  const recentPlanIds = uniqueStrings(asStringList(request.recent_plan_ids, 'recent_plan_ids'));

  return {
    servings: validateServings(request.servings),
    normalized_items: normalizedItems,
    submitted_items: submittedItems,
    ignored_basic_items: ignoredBasicItems,
    duplicate_items: duplicateItems,
    unrecognized_items: submittedItems.filter(item => !item.recognized && !item.ambiguity_id),
    ambiguous_items: submittedItems.filter(item => item.ambiguity_id),
    dislikes,
    dislike_facts: dislikeFacts,
    current_plan_id: currentPlanId,
    recent_plan_ids: recentPlanIds,
  };
}

function taxonomyIndex(taxonomy) {
  return new Map((taxonomy?.items || []).map(item => [item.canonical_id, item]));
}

function nullableSnapshotString(value) {
  if (value == null) return null;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function snapshotFactForItem(item) {
  if (item?.canonical_id) {
    return {
      kind: 'recognized',
      canonical_id: item.canonical_id,
      state: item.state || null,
      shape_or_cut: item.shape_or_cut || null,
    };
  }
  return {
    kind: 'unrecognized',
    raw: normalizePlannerTaxonomyKey(item?.raw),
  };
}

function sortedUniqueFacts(facts) {
  const byJson = new Map();
  for (const fact of facts) byJson.set(canonicalJson(fact), fact);
  return [...byJson.entries()]
    .sort(([left], [right]) => left.localeCompare(right, 'en'))
    .map(([, fact]) => fact);
}

function requestSnapshot(catalog, normalized) {
  return {
    catalog_version: catalog?.catalog_version || null,
    servings: normalized.servings,
    normalized_items: sortedUniqueFacts(normalized.submitted_items.map(snapshotFactForItem)),
    dislikes: [...(normalized.dislike_facts || [])]
      .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN')),
  };
}

function recognizedSnapshotItem(fact, itemsById) {
  if (!isPlainObject(fact) || fact.kind !== 'recognized'
      || typeof fact.canonical_id !== 'string' || !fact.canonical_id.trim()
      || nullableSnapshotString(fact.state) !== fact.state
      || nullableSnapshotString(fact.shape_or_cut) !== fact.shape_or_cut) {
    throw new TypeError('normalizedRequest contains an invalid recognized item');
  }
  const item = itemsById.get(fact.canonical_id);
  if (!item || item.input_scope === 'derived_only'
      || (fact.state != null && !item.states?.includes(fact.state))
      || (fact.state == null && item.states?.length === 1)
      || (fact.shape_or_cut != null && !item.shapes_or_cuts?.includes(fact.shape_or_cut))) {
    throw new TypeError('normalizedRequest recognized item is no longer controlled');
  }
  return {
    raw: item.display_name,
    canonical_id: item.canonical_id,
    canonical: item.canonical_name || item.display_name,
    ratio_rule_policy: item.ratio_rule_policy || 'category_fallback',
    display_name: item.display_name,
    category: item.category,
    state: fact.state,
    shape_or_cut: fact.shape_or_cut,
    cook_speed: item.cook_speed,
    moisture_release: item.moisture_release,
    texture_behavior: item.texture_behavior?.behavior_code || null,
    texture_failure_modes: [...(item.texture_behavior?.failure_mode_codes || [])],
    cooking_risk: item.cooking_risk?.risk_code || 'unknown',
    required_endpoint_codes: [...(item.cooking_risk?.required_endpoint_codes || [])],
    compatible_slot_codes: [...(item.compatible_slot_codes || [])],
    incompatible_slot_codes: [...(item.incompatible_slot_codes || [])],
    recognized: true,
    ambiguity_id: null,
    ambiguity_code: null,
    ambiguity_reason: null,
    eligible_items: [],
    role: 'prefer_use',
    duplicate_of: null,
  };
}

function unrecognizedSnapshotItem(fact, taxonomy) {
  if (!isPlainObject(fact) || fact.kind !== 'unrecognized'
      || typeof fact.raw !== 'string' || !fact.raw
      || normalizePlannerTaxonomyKey(fact.raw) !== fact.raw) {
    throw new TypeError('normalizedRequest contains an invalid unrecognized item');
  }
  // An unknown input is stored as normalized text. It may become recognized by
  // a newer taxonomy, in which case the re-selected candidate will differ and
  // the old token correctly becomes stale.
  return normalizePlannerItems([{ raw: fact.raw, role: 'prefer_use' }], taxonomy)[0];
}

function normalizeRiceMealRequestSnapshot(snapshot = {}, taxonomy = {}) {
  if (!isPlainObject(snapshot) || !Array.isArray(snapshot.normalized_items)
      || !Array.isArray(snapshot.dislikes)
      || typeof snapshot.catalog_version !== 'string' || !snapshot.catalog_version.trim()) {
    throw new TypeError('normalizedRequest snapshot is invalid');
  }
  const servings = validateServings(snapshot.servings);
  const itemsById = taxonomyIndex(taxonomy);
  const facts = snapshot.normalized_items.map(fact => {
    if (fact?.kind === 'recognized') return recognizedSnapshotItem(fact, itemsById);
    if (fact?.kind === 'unrecognized') return unrecognizedSnapshotItem(fact, taxonomy);
    throw new TypeError('normalizedRequest item kind is invalid');
  });
  const sourceFactKeys = snapshot.normalized_items.map(fact => canonicalJson(fact));
  if (new Set(sourceFactKeys).size !== sourceFactKeys.length) {
    throw new TypeError('normalizedRequest items must be unique');
  }
  const normalizedItems = deduplicateNormalizedItems(facts);
  const uniqueItems = normalizedItems.filter(item => item.duplicate_of === null);
  const ignoredBasicItems = uniqueItems.filter(item => BASIC_COVERAGE_IDS.has(item.canonical_id));
  const submittedItems = uniqueItems.filter(item => !BASIC_COVERAGE_IDS.has(item.canonical_id));
  const dislikes = snapshot.dislikes.map(dislike => {
    if (typeof dislike !== 'string' || !dislike || normalizePlannerTaxonomyKey(dislike) !== dislike) {
      throw new TypeError('normalizedRequest dislikes are invalid');
    }
    return dislike;
  });
  if (new Set(dislikes).size !== dislikes.length) throw new TypeError('normalizedRequest dislikes must be unique');
  return {
    servings,
    normalized_items: normalizedItems,
    submitted_items: submittedItems,
    ignored_basic_items: ignoredBasicItems,
    duplicate_items: normalizedItems.filter(item => item.duplicate_of !== null),
    unrecognized_items: submittedItems.filter(item => !item.recognized && !item.ambiguity_id),
    ambiguous_items: submittedItems.filter(item => item.ambiguity_id),
    dislikes: [...dislikes],
    dislike_facts: [...dislikes],
    current_plan_id: null,
    recent_plan_ids: [],
  };
}

function catalogVariants(catalog) {
  return (catalog?.families || []).flatMap(family => (family?.variants || []).map(variant => ({
    family_id: family.family_id,
    variant,
  })));
}

function materialIds(variant) {
  return [variant?.rice?.canonical_ingredient_id, ...(variant?.ingredients || []).map(item => item.canonical_ingredient_id)]
    .filter(Boolean);
}

function approvedSubstitution(variant, targetId, inputId) {
  return (variant.approved_substitutions || []).find(rule => (
    rule?.replaces_canonical_id === targetId
    && (rule.allowed_canonical_ids || []).includes(inputId)
  )) || null;
}

function ingredientMatchKind(input, targetId, targetItem, variant) {
  if (input.canonical_id === targetId) return { kind: 'exact', rank: 0 };
  // A catalog variant is a named, fixed recipe identity rather than a generic
  // template slot.  Broad taxonomy compatibility may help planning elsewhere,
  // but it cannot silently turn chicken breast into a chicken-leg dish (or any
  // other named cut).  Recipe-level replacements must be explicitly reviewed.
  if (targetId.endsWith('-generic')) {
    const genericSlots = (targetItem?.compatible_slot_codes || []).filter(code => code.startsWith('generic_'));
    if (genericSlots.some(slot => input.compatible_slot_codes?.includes(slot)
        && !input.incompatible_slot_codes?.includes(slot))) {
      return { kind: 'generic_slot', rank: 1 };
    }
  }
  if (approvedSubstitution(variant, targetId, input.canonical_id)) return { kind: 'approved_substitution', rank: 2 };
  return null;
}

function compareAssignment(left, right) {
  if (!right) return -1;
  const leftRanks = left.map(entry => entry.match.rank).join(',');
  const rightRanks = right.map(entry => entry.match.rank).join(',');
  if (leftRanks !== rightRanks) return leftRanks.localeCompare(rightRanks, 'en');
  return left.map(entry => itemKey(entry.input)).join(',').localeCompare(
    right.map(entry => itemKey(entry.input)).join(','),
    'zh-Hans-CN',
  );
}

function findMaterialAssignment(variant, submittedItems, itemsById) {
  const targets = (variant.ingredients || []).map(ingredient => ingredient.canonical_ingredient_id);
  if (!targets.length) return null;
  const options = targets.map(targetId => {
    const targetItem = itemsById.get(targetId);
    if (!targetItem) return [];
    return submittedItems.map((input, index) => ({
      input,
      index,
      target_id: targetId,
      match: ingredientMatchKind(input, targetId, targetItem, variant),
    })).filter(entry => entry.match);
  });
  if (options.some(entries => !entries.length)) return null;

  let best = null;
  function visit(targetIndex, usedInputIndices, assignments) {
    if (targetIndex === targets.length) {
      if (compareAssignment(assignments, best) < 0) best = assignments;
      return;
    }
    const ordered = [...options[targetIndex]].sort((left, right) => (
      left.match.rank - right.match.rank
      || itemKey(left.input).localeCompare(itemKey(right.input), 'zh-Hans-CN')
    ));
    for (const option of ordered) {
      if (usedInputIndices.has(option.index)) continue;
      const nextUsed = new Set(usedInputIndices);
      nextUsed.add(option.index);
      visit(targetIndex + 1, nextUsed, [...assignments, option]);
    }
  }
  visit(0, new Set(), []);
  return best;
}

function variantForbiddenCombination(variant, assignments) {
  // A substitution replaces its nominal target. Forbidden-combination checks
  // must therefore inspect the actual assignment only, never the displaced
  // catalog material.
  const present = new Set(assignments.map(entry => entry.input.canonical_id));
  return (variant.forbidden_combinations || []).find(entry => (
    Array.isArray(entry?.canonical_ingredient_ids)
    && entry.canonical_ingredient_ids.every(canonicalId => present.has(canonicalId))
  )) || null;
}

function controlledMidCycleAction(adaptation) {
  const actions = Array.isArray(adaptation?.mid_actions) ? adaptation.mid_actions : [];
  if (actions.length !== 1) return null;
  const action = actions[0];
  if (action?.action_code !== 'add_reserved_leafy_vegetable'
      || action.timing_basis !== 'program_remaining_minutes'
      || action.timing_min !== 10 || action.timing_max !== 10
      || action.max_open_seconds !== 30
      || action.placement !== 'top_no_stir'
      || action.resume_policy !== 'same_program_auto_resume'
      || action.required_post_close_minutes !== 10
      || !Array.isArray(action.ingredient_ids) || action.ingredient_ids.length !== 1) return null;
  return action;
}

function variantAdaptationIssue(variant) {
  const adaptation = variant.cooker_adaptation;
  const controlledMid = controlledMidCycleAction(adaptation);
  if (!adaptation || adaptation.closed_lid_continuation !== true
      || (adaptation.requires_mid_cook_opening === true && !controlledMid)
      || adaptation.completion_status !== 'complete') {
    return 'cooker_adaptation_incomplete';
  }
  if (Array.isArray(variant.exclusion_flags) && variant.exclusion_flags.length) return 'catalog_exclusion_flag';
  return null;
}

function variantRatioAndSafetyIssue(variant, itemsById, ratioFacts) {
  const adaptation = variant.cooker_adaptation;
  if (!ratioFacts) return 'ratio_rule_missing';
  const materials = materialIds(variant);
  if (!materials.length || materials.some(id => !itemsById.has(id))) return 'unknown_material_identity';
  if ([variant.rice, ...(variant.ingredients || [])].some(item => !item?.amount_rule_id)) return 'material_amount_missing';
  const endpointPairs = new Set((variant.safety_endpoints || [])
    .map(endpoint => `${endpoint.canonical_ingredient_id}\u0000${endpoint.endpoint_code}`));
  for (const materialId of materials) {
    const item = itemsById.get(materialId);
    for (const endpointCode of item.cooking_risk?.required_endpoint_codes || []) {
      if (!endpointPairs.has(`${materialId}\u0000${endpointCode}`)) return 'safety_endpoint_missing';
    }
  }
  const startActions = adaptation?.start_actions || [];
  const load = startActions.find(action => action.action_code === 'load_inner_pot');
  const preCook = (adaptation?.pre_actions || [])
    .find(action => [
      'pre_cook_tender_vegetables_outside_cooker',
      'pre_cook_tender_vegetables_drain_and_discard_liquid',
    ].includes(action.action_code));
  const fold = (adaptation?.finish_actions || [])
    .find(action => action.action_code === 'fold_in_pre_cooked_ingredients');
  const controlledMid = controlledMidCycleAction(adaptation);
  const heldIds = new Set([
    ...(preCook?.ingredient_ids || []),
    ...(controlledMid?.ingredient_ids || []),
  ]);
  const hasControlledFinish = heldIds.size > 0
    && fold
    && heldIds.size === new Set(fold.ingredient_ids || []).size
    && [...heldIds].every(id => fold.ingredient_ids.includes(id));
  if ((preCook || fold) && !hasControlledFinish) return 'load_protocol_incomplete';
  if (adaptation?.requires_mid_cook_opening === true && !controlledMid) return 'load_protocol_incomplete';
  const startMaterials = materials.filter(materialId => !heldIds.has(materialId));
  if (!load || !startMaterials.every(materialId => load.ingredient_ids?.includes(materialId))) return 'load_protocol_incomplete';
  if ([...heldIds].some(materialId => load.ingredient_ids?.includes(materialId))) return 'load_protocol_incomplete';
  if ([...heldIds].some(materialId => !(variant.safety_endpoints || [])
    .some(endpoint => endpoint.canonical_ingredient_id === materialId))) return 'safety_endpoint_missing';
  return null;
}

function variantHasAllowedNutrition(variant) {
  const nutrition = variant.nutrition_structure;
  if (!nutrition || !GRADE_RANK.hasOwnProperty(nutrition.grade)) return false;
  const contributorRoles = new Set((nutrition.material_contributors || []).map(row => row.role));
  if (nutrition.grade === 'A') return ['carb', 'protein', 'fiber'].every(role => contributorRoles.has(role));
  return contributorRoles.has('carb') && (contributorRoles.has('protein') || contributorRoles.has('fiber'));
}

function allergyAliases(taxonomy) {
  return buildPlannerAllergenAliases(taxonomy, {});
}

function itemConflictsWithDislikes(item, dislikes, aliases) {
  const names = [item.raw, item.display_name, item.canonical].filter(Boolean);
  return dislikes.some(dislike => names.some(name => matchAllergy(dislike, name, aliases)));
}

function unsafeItemsForRequest(normalized, itemsById, aliases) {
  const unsafe = normalized.submitted_items.filter(item => itemConflictsWithDislikes(item, normalized.dislikes, aliases))
    .map(item => ({
      ...clone(item),
      reason_code: 'allergen_conflict',
      reason: '这项食材与你设置的忌口冲突，不能进入菜饭推荐。',
    }));
  const rice = itemsById.get('raw-rice');
  if (rice && normalized.dislikes.some(dislike => matchAllergy(dislike, rice.display_name, aliases))) {
    unsafe.push({
      raw: rice.display_name,
      canonical_id: rice.canonical_id,
      display_name: rice.display_name,
      recognized: true,
      reason_code: 'allergen_conflict',
      reason: '菜饭默认以大米为主食；该忌口下不能安全生成电饭煲菜饭。',
    });
  }
  return unsafe;
}

const SAFETY_REASONS = Object.freeze({
  forbidden_combination: '该菜饭的实际食材组合被目录明确禁止。',
  cooker_adaptation_incomplete: '该菜饭的电饭煲流程不满足闭盖、完整完成的安全要求。',
  catalog_exclusion_flag: '该菜饭被目录标记为当前不可安全执行。',
  ratio_rule_missing: '该菜饭缺少可执行的受控比例规则。',
  unknown_material_identity: '该菜饭包含无法验证的食材身份。',
  material_amount_missing: '该菜饭缺少受控食材用量规则。',
  safety_endpoint_missing: '该菜饭缺少必需的熟制安全终点。',
  load_protocol_incomplete: '该菜饭缺少将全部食材安全入锅的流程。',
});

function safetyRejectionForMatch(match) {
  const reasonCode = match.safety_issue;
  return {
    reason_code: reasonCode,
    reason: reasonCode === 'forbidden_combination'
      ? match.forbidden?.reason || SAFETY_REASONS.forbidden_combination
      : SAFETY_REASONS[reasonCode] || '该菜饭未通过受控安全检查。',
    ingredient_ids: uniqueStrings(match.assignments.map(entry => entry.input.canonical_id)),
    variant_id: match.variant.variant_id,
  };
}

function safetyRejectionsForRequestItems(unsafeItems) {
  return unsafeItems.map(item => ({
    reason_code: item.reason_code,
    reason: item.reason,
    ingredient_ids: item.canonical_id ? [item.canonical_id] : [],
    variant_id: null,
  }));
}

function safetyUnusedItems(normalized, safetyRejections, allMatchedInputKeys) {
  const rejectionByIngredientId = new Map();
  for (const rejection of safetyRejections) {
    for (const canonicalId of rejection.ingredient_ids) {
      if (!rejectionByIngredientId.has(canonicalId)) rejectionByIngredientId.set(canonicalId, rejection);
    }
  }
  return normalized.submitted_items.map(item => {
    const rejection = rejectionByIngredientId.get(item.canonical_id);
    return rejection
      ? reasonedItem(item, rejection.reason_code, rejection.reason)
      : unplannedReason(item, allMatchedInputKeys);
  });
}

function reasonedItem(item, reasonCode, reason) {
  return { ...clone(item), reason_code: reasonCode, reason };
}

function unplannedReason(item, matchedInputKeys, { needsBalance = false } = {}) {
  if (!item.recognized) {
    if (item.ambiguity_code) return reasonedItem(item, item.ambiguity_code, item.ambiguity_reason || '食材状态需要先确认。');
    return reasonedItem(item, 'unrecognized_ingredient', '暂时无法识别这种食材，因此不能承诺已经安排。');
  }
  if (needsBalance) {
    return reasonedItem(item, 'needs_protein_or_fiber', '这组输入主要是主食类，请补充可用的蛋白质或蔬菜后再推荐。');
  }
  if (matchedInputKeys.has(itemKey(item))) {
    return reasonedItem(item, 'not_selected_for_this_variant', '这道菜饭用不到这项食材；换一种可靠菜饭时可能会用上。');
  }
  return reasonedItem(item, 'not_in_active_catalog', '现有菜饭还没有适合使用这项食材的可靠做法。');
}

function candidateUnusedItems(normalized, usedInputKeys, allMatchedInputKeys) {
  return normalized.submitted_items.filter(item => !usedInputKeys.has(itemKey(item)))
    .map(item => unplannedReason(item, allMatchedInputKeys));
}

function coverageState(coverageCount, submittedCount) {
  if (submittedCount === 0) return { ready: false, status: 'no_reliable_rice_meal' };
  if (submittedCount === 1) return { ready: coverageCount === 1, status: 'no_reliable_rice_meal' };
  if (submittedCount === 2) return coverageCount === 2
    ? { ready: true, status: 'ready' }
    : { ready: false, status: 'no_reliable_rice_meal' };
  if (submittedCount === 3) return coverageCount >= 2
    ? { ready: true, status: 'ready' }
    : { ready: false, status: 'no_reliable_rice_meal' };
  if (submittedCount <= 6) return coverageCount >= Math.ceil(submittedCount * 0.6)
    ? { ready: true, status: 'ready' }
    : { ready: false, status: 'no_reliable_rice_meal' };
  return coverageCount >= 4 && coverageCount <= 5
    ? { ready: true, status: 'ready' }
    : { ready: false, status: 'no_reliable_rice_meal' };
}

function onlyStarchyInput(normalized) {
  return normalized.submitted_items.length > 0
    && normalized.submitted_items.every(item => item.recognized && BALANCE_STARCHY_IDS.has(item.canonical_id));
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

// Synchronous SHA-256 keeps selector output deterministic in both Node tests
// and the Worker runtime without changing the selector into an I/O API.
export function sha256Hex(message) {
  const bytes = message instanceof Uint8Array
    ? message
    : new TextEncoder().encode(String(message));
  const bitLength = bytes.length * 8;
  const totalLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const data = new Uint8Array(totalLength);
  data.set(bytes);
  data[bytes.length] = 0x80;
  const high = Math.floor(bitLength / 0x100000000);
  const low = bitLength >>> 0;
  data[totalLength - 8] = (high >>> 24) & 0xff;
  data[totalLength - 7] = (high >>> 16) & 0xff;
  data[totalLength - 6] = (high >>> 8) & 0xff;
  data[totalLength - 5] = high & 0xff;
  data[totalLength - 4] = (low >>> 24) & 0xff;
  data[totalLength - 3] = (low >>> 16) & 0xff;
  data[totalLength - 2] = (low >>> 8) & 0xff;
  data[totalLength - 1] = low & 0xff;

  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  for (let offset = 0; offset < data.length; offset += 64) {
    const words = new Uint32Array(64);
    for (let index = 0; index < 16; index += 1) {
      const base = offset + index * 4;
      words[index] = ((data[base] << 24) | (data[base + 1] << 16) | (data[base + 2] << 8) | data[base + 3]) >>> 0;
    }
    for (let index = 16; index < 64; index += 1) {
      const left = words[index - 15];
      const right = words[index - 2];
      const sigma0 = ((left >>> 7) | (left << 25)) ^ ((left >>> 18) | (left << 14)) ^ (left >>> 3);
      const sigma1 = ((right >>> 17) | (right << 15)) ^ ((right >>> 19) | (right << 13)) ^ (right >>> 10);
      words[index] = (words[index - 16] + sigma0 + words[index - 7] + sigma1) >>> 0;
    }
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;
    for (let index = 0; index < 64; index += 1) {
      const sigma1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const choice = (e & f) ^ (~e & g);
      const temp1 = (h + sigma1 + choice + constants[index] + words[index]) >>> 0;
      const sigma0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (sigma0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }
  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map(value => value.toString(16).padStart(8, '0')).join('');
}

function assertControlledRatioCatalog(ratioCatalog) {
  if (!isPlainObject(ratioCatalog) || typeof ratioCatalog.ratio_catalog_version !== 'string'
      || !ratioCatalog.ratio_catalog_version.trim() || !Array.isArray(ratioCatalog.rules)) {
    throw new TypeError('ratioCatalog must provide ratio_catalog_version and rules');
  }
}

function ratioFactsForVariant(variant, ratioCatalog) {
  const ratioRuleIds = Array.isArray(variant?.ratio_rule_ids)
    ? [...new Set(variant.ratio_rule_ids.filter(ruleId => typeof ruleId === 'string' && ruleId.trim()))]
    : [];
  if (!ratioRuleIds.length) return null;
  const rulesById = new Map((ratioCatalog.rules || []).map(rule => [rule?.rule_id, rule]));
  const rules = [];
  for (const ruleId of ratioRuleIds.sort((left, right) => left.localeCompare(right, 'en'))) {
    const rule = rulesById.get(ruleId);
    if (!isPlainObject(rule) || rule.execution_mode !== 'executable'
        || rule.when?.recipe_id !== variant.recipe_id
        || !Array.isArray(rule.operations) || !rule.operations.length
        || !isPlainObject(rule.rounding)) {
      return null;
    }
    // Keep only executable, machine-consumed rule facts. Evidence examples and
    // display prose are deliberately excluded from the identity.
    rules.push({
      rule_id: ruleId,
      when: clone(rule.when),
      execution_mode: rule.execution_mode,
      liquid_contract: clone(rule.liquid_contract),
      operations: clone(rule.operations),
      rounding: clone(rule.rounding),
    });
  }
  const facts = {
    ratio_catalog_version: ratioCatalog.ratio_catalog_version,
    rules,
  };
  return {
    ratio_catalog_version: ratioCatalog.ratio_catalog_version,
    ratio_facts_hash: `sha256:${sha256Hex(canonicalJson(facts))}`,
  };
}

function planIdentity({ catalog, variant, normalized, assignments, ratioFacts, planSnapshot }) {
  const adaptation = variant.cooker_adaptation || {};
  const compareSubstitutions = (left, right) => (
    left.target_id.localeCompare(right.target_id, 'zh-Hans-CN')
    || left.input_id.localeCompare(right.input_id, 'zh-Hans-CN')
    || left.kind.localeCompare(right.kind, 'en')
  );
  return {
    catalog_version: catalog.catalog_version,
    variant_id: variant.variant_id,
    servings: normalized.servings,
    normalized_inputs: clone(planSnapshot.normalized_items),
    normalized_dislikes: clone(planSnapshot.dislikes),
    substitutions: assignments.filter(entry => entry.match.kind !== 'exact').map(entry => ({
      target_id: entry.target_id,
      input_id: entry.input.canonical_id,
      kind: entry.match.kind,
    })).sort(compareSubstitutions),
    ratio_rule_ids: [...(variant.ratio_rule_ids || [])].sort(),
    ratio_catalog_version: ratioFacts.ratio_catalog_version,
    ratio_facts_hash: ratioFacts.ratio_facts_hash,
    action_protocol: ['pre_actions', 'start_actions', 'mid_actions', 'finish_actions'].map(phase => ({
      phase,
      actions: [...(adaptation[phase] || [])].sort((left, right) => left.order - right.order).map(action => ({
        order: action.order,
        action_code: action.action_code,
        ingredient_ids: [...(action.ingredient_ids || [])].sort((left, right) => left.localeCompare(right, 'en')),
        ...(phase === 'mid_actions' ? {
          timing_basis: action.timing_basis,
          timing_min: action.timing_min,
          timing_max: action.timing_max,
          max_open_seconds: action.max_open_seconds,
          placement: action.placement,
          resume_policy: action.resume_policy,
          required_post_close_minutes: action.required_post_close_minutes,
        } : {}),
      })),
    })),
  };
}

function basicItems(itemsById) {
  return ['raw-rice', 'water', 'cooking-oil', 'salt'].map(canonicalId => ({
    canonical_id: canonicalId,
    display_name: itemsById.get(canonicalId)?.display_name || canonicalId,
  }));
}

function controlledUserNotices(variant, servings) {
  const statusText = CONTROLLED_USER_NOTICES[variant.preview_notice_code];
  if (!statusText) return [];
  return [
    { code: variant.preview_notice_code, text: statusText },
    ...(servings === 4 ? [{
      code: 'four_serving_cooker_capacity_check',
      text: CONTROLLED_USER_NOTICES.four_serving_cooker_capacity_check,
    }] : []),
  ];
}

function buildCandidate({
  catalog,
  familyId,
  variant,
  normalized,
  assignments,
  ratioFacts,
  allMatchedInputKeys,
  itemsById,
}) {
  const usedInputKeys = new Set(assignments.map(entry => itemKey(entry.input)));
  const adaptation = variant.cooker_adaptation;
  const executionActions = Object.fromEntries(['pre_actions', 'start_actions', 'mid_actions', 'finish_actions'].map(phase => [
    phase,
    clone([...(adaptation[phase] || [])].sort((left, right) => left.order - right.order)),
  ]));
  const planSnapshot = requestSnapshot(catalog, normalized);
  const identity = planIdentity({ catalog, variant, normalized, assignments, ratioFacts, planSnapshot });
  const protein = (variant.nutrition_structure?.material_contributors || []).find(row => row.role === 'protein');
  return {
    plan_id: `sha256:${sha256Hex(canonicalJson(identity))}`,
    catalog_version: catalog.catalog_version,
    ratio_catalog_version: ratioFacts.ratio_catalog_version,
    ratio_facts_hash: ratioFacts.ratio_facts_hash,
    servings: normalized.servings,
    plan_snapshot: planSnapshot,
    family_id: familyId,
    variant_id: variant.variant_id,
    recipe_id: variant.recipe_id,
    display_name: variant.display_name,
    name_label: variant.name_label,
    used_items: assignments.map(entry => clone(entry.input)),
    unused_items: candidateUnusedItems(normalized, usedInputKeys, allMatchedInputKeys),
    coverage_count: assignments.length,
    coverage_total: normalized.submitted_items.length,
    // Kept as a response-compatibility alias while consumers migrate to the
    // explicit coverage contract above. New UI and gates must use coverage_total.
    submitted_count: normalized.submitted_items.length,
    coverage_ratio: normalized.submitted_items.length ? assignments.length / normalized.submitted_items.length : 0,
    nutrition_grade: variant.nutrition_structure.grade,
    nutrition_roles: clone(variant.nutrition_structure.material_contributors || []),
    required_basic_items: basicItems(itemsById),
    selected_ingredient_ids: materialIds(variant),
    selected_input_ids: assignments.map(entry => entry.input.canonical_id),
    substitutions: assignments.filter(entry => entry.match.kind !== 'exact').map(entry => ({
      target_canonical_id: entry.target_id,
      input_canonical_id: entry.input.canonical_id,
      kind: entry.match.kind,
    })),
    ratio_rule_ids: clone(variant.ratio_rule_ids || []),
    execution_actions: executionActions,
    safety_endpoints: clone(variant.safety_endpoints || []),
    cooker_adaptation_level: adaptation.adaptation,
    active_time_minutes: adaptation.active_time_minutes,
    total_time_minutes: adaptation.total_time_minutes,
    extra_major_count: 0,
    identity_level: variant.identity_level,
    protein_variant_id: protein?.canonical_ingredient_id || null,
    user_notices: controlledUserNotices(variant, normalized.servings),
  };
}

function candidateRank(left, right, recentPlanIds) {
  const recent = new Set(recentPlanIds);
  return right.coverage_count - left.coverage_count
    || GRADE_RANK[left.nutrition_grade] - GRADE_RANK[right.nutrition_grade]
    || (IDENTITY_RANK[left.identity_level] ?? 9) - (IDENTITY_RANK[right.identity_level] ?? 9)
    || left.extra_major_count - right.extra_major_count
    || (ADAPTATION_RANK[left.cooker_adaptation_level] ?? 9) - (ADAPTATION_RANK[right.cooker_adaptation_level] ?? 9)
    || left.active_time_minutes - right.active_time_minutes
    || Number(recent.has(left.plan_id)) - Number(recent.has(right.plan_id))
    || left.variant_id.localeCompare(right.variant_id, 'zh-Hans-CN');
}

function candidateIsDifferent(left, right) {
  if (left.family_id !== right.family_id) return true;
  const leftInputs = [...left.selected_input_ids].sort().join('\u0000');
  const rightInputs = [...right.selected_input_ids].sort().join('\u0000');
  if (leftInputs !== rightInputs) return true;
  if (left.protein_variant_id !== right.protein_variant_id) return true;
  return left.cooker_adaptation_level !== right.cooker_adaptation_level;
}

function selectDiverseCandidates(candidates, recentPlanIds) {
  const selected = [];
  for (const candidate of [...candidates].sort((left, right) => candidateRank(left, right, recentPlanIds))) {
    if (selected.every(current => candidateIsDifferent(candidate, current))) selected.push(candidate);
    if (selected.length === 3) break;
  }
  return selected;
}

function resultBase(catalog, normalized, status, extras = {}) {
  return {
    schema_version: 3,
    catalog_version: catalog?.catalog_version || null,
    status,
    candidates: [],
    normalized_request: normalized,
    ...extras,
  };
}

export function selectRiceMealCandidates({
  request = {},
  catalog = {},
  taxonomy = {},
  ratioCatalog,
  normalizedRequest = null,
  recentPlanIds = [],
} = {}) {
  assertControlledRatioCatalog(ratioCatalog);
  const normalized = normalizedRequest == null
    ? normalizeRiceMealRequest(request, taxonomy)
    : normalizeRiceMealRequestSnapshot(normalizedRequest, taxonomy);
  const itemsById = taxonomyIndex(taxonomy);
  const aliases = allergyAliases(taxonomy);
  const unsafeItems = unsafeItemsForRequest(normalized, itemsById, aliases);
  if (unsafeItems.length) {
    return resultBase(catalog, normalized, 'unsafe_recipe', {
      unused_items: unsafeItems,
      unsafe_items: unsafeItems,
      safety_rejections: safetyRejectionsForRequestItems(unsafeItems),
    });
  }

  // Gate order is intentional and mirrors the product contract:
  // identity/form -> dislikes (above) -> variant/substitution -> cooker -> A/B
  // -> coverage -> ratio/capacity/safety -> stable ranking.
  const identityAndNutritionMatches = [];
  const unsafeMatches = [];
  for (const { family_id: familyId, variant } of catalogVariants(catalog)) {
    if (!ACTIVE_VARIANT_STATUSES.has(variant.status)) continue;
    if (Array.isArray(variant.supported_servings)
        && !variant.supported_servings.includes(normalized.servings)) continue;
    const assignments = findMaterialAssignment(variant, normalized.submitted_items, itemsById);
    if (!assignments) continue;
    const forbidden = variantForbiddenCombination(variant, assignments);
    if (forbidden) {
      unsafeMatches.push({ family_id: familyId, variant, assignments, forbidden, safety_issue: 'forbidden_combination' });
      continue;
    }
    const adaptationIssue = variantAdaptationIssue(variant);
    if (adaptationIssue) {
      unsafeMatches.push({ family_id: familyId, variant, assignments, safety_issue: adaptationIssue });
      continue;
    }
    if (!variantHasAllowedNutrition(variant)) continue;
    identityAndNutritionMatches.push({ family_id: familyId, variant, assignments });
  }

  const quality = match => coverageState(match.assignments.length, normalized.submitted_items.length);
  const coverageQualified = identityAndNutritionMatches.filter(match => quality(match).ready);
  const qualified = [];
  for (const match of coverageQualified) {
    const ratioFacts = ratioFactsForVariant(match.variant, ratioCatalog);
    const ratioAndSafetyIssue = variantRatioAndSafetyIssue(match.variant, itemsById, ratioFacts);
    if (ratioAndSafetyIssue) {
      unsafeMatches.push({ ...match, safety_issue: ratioAndSafetyIssue });
      continue;
    }
    qualified.push({ ...match, ratioFacts });
  }
  const allMatchedInputKeys = new Set(identityAndNutritionMatches
    .flatMap(match => match.assignments.map(entry => itemKey(entry.input))));
  const history = uniqueStrings([
    ...normalized.recent_plan_ids,
    ...asStringList(recentPlanIds, 'recentPlanIds'),
  ]);

  if (!qualified.length) {
    if (unsafeMatches.length && (!identityAndNutritionMatches.length || coverageQualified.length)) {
      const safetyRejections = unsafeMatches.map(safetyRejectionForMatch);
      return resultBase(catalog, normalized, 'unsafe_recipe', {
        unused_items: safetyUnusedItems(normalized, safetyRejections, allMatchedInputKeys),
        unsafe_reasons: safetyRejections.map(rejection => rejection.reason_code),
        safety_rejections: safetyRejections,
      });
    }
    const needsBalance = onlyStarchyInput(normalized);
    const partialMatches = !needsBalance && normalized.submitted_items.length === 2
      ? identityAndNutritionMatches.filter(match => match.assignments.length === 1)
      : [];
    const unsafePartialMatches = unsafeMatches.filter(match => match.assignments.length === 1);
    const safePartialMatches = [];
    for (const partialMatch of partialMatches) {
      const ratioFacts = ratioFactsForVariant(partialMatch.variant, ratioCatalog);
      const partialSafetyIssue = variantRatioAndSafetyIssue(partialMatch.variant, itemsById, ratioFacts);
      if (partialSafetyIssue) {
        unsafePartialMatches.push({ ...partialMatch, safety_issue: partialSafetyIssue });
        continue;
      }
      safePartialMatches.push({ ...partialMatch, ratioFacts });
    }
    if (safePartialMatches.length) {
      const diagnosticCandidate = safePartialMatches.map(partialMatch => buildCandidate({
        catalog,
        familyId: partialMatch.family_id,
        variant: partialMatch.variant,
        normalized,
        assignments: partialMatch.assignments,
        ratioFacts: partialMatch.ratioFacts,
        allMatchedInputKeys,
        itemsById,
      })).sort((left, right) => candidateRank(left, right, history))[0];
      const limitedUnusedItems = diagnosticCandidate.unused_items.map(item => reasonedItem(
        item,
        'limited_coverage',
        '当前只能可靠使用 1/2 项食材，不能作为一锅主餐推荐。',
      ));
      const bestAvailableCandidate = {
        ...diagnosticCandidate,
        unused_items: limitedUnusedItems,
        diagnostic: {
          reason_code: 'limited_coverage',
          reason: '当前只能可靠使用 1/2 项食材，不能作为一锅主餐推荐。',
        },
      };
      return resultBase(catalog, normalized, 'no_reliable_rice_meal', {
        unused_items: limitedUnusedItems,
        best_available_candidate: bestAvailableCandidate,
      });
    }
    if (partialMatches.length && unsafePartialMatches.length) {
      const safetyRejections = unsafePartialMatches.map(safetyRejectionForMatch);
      return resultBase(catalog, normalized, 'unsafe_recipe', {
        unused_items: safetyUnusedItems(normalized, safetyRejections, allMatchedInputKeys),
        unsafe_reasons: safetyRejections.map(rejection => rejection.reason_code),
        safety_rejections: safetyRejections,
      });
    }
    return resultBase(catalog, normalized, needsBalance ? 'needs_balance_input' : 'no_reliable_rice_meal', {
      unused_items: normalized.submitted_items.map(item => unplannedReason(item, allMatchedInputKeys, { needsBalance })),
    });
  }

  const candidates = qualified.map(match => buildCandidate({
    catalog,
    familyId: match.family_id,
    variant: match.variant,
    normalized,
    assignments: match.assignments,
    ratioFacts: match.ratioFacts,
    allMatchedInputKeys,
    itemsById,
  }));
  const currentPlanId = normalized.current_plan_id;
  if (currentPlanId) {
    const current = candidates.find(candidate => candidate.plan_id === currentPlanId);
    if (!current) {
      return resultBase(catalog, normalized, 'no_reliable_rice_meal', {
        unused_items: normalized.submitted_items.map(item => unplannedReason(item, allMatchedInputKeys)),
      });
    }
    const alternatives = selectDiverseCandidates(candidates.filter(candidate => (
      candidate.plan_id !== currentPlanId
      && candidate.coverage_count >= current.coverage_count
    )), history);
    if (!alternatives.length) {
      return resultBase(catalog, normalized, 'no_alternative_rice_meal', {
        code: 'no_alternative_plan',
        current_candidate: current,
      });
    }
    return resultBase(catalog, normalized, 'ready', {
      candidates: alternatives,
      current_candidate: current,
    });
  }

  const bestCoverageCount = Math.max(...candidates.map(candidate => candidate.coverage_count));
  const bestCoverageTier = candidates.filter(candidate => candidate.coverage_count === bestCoverageCount);
  return resultBase(catalog, normalized, 'ready', {
    candidates: selectDiverseCandidates(bestCoverageTier, history),
  });
}

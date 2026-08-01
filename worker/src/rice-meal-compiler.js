import { normalizeRatioGrams } from './ratio-dsl.js';
import { normalizePlannerTaxonomyKey } from './planner-v2.js';
import { canonicalJson, selectRiceMealCandidates, sha256Hex } from './rice-meal-selector.js';
import {
  buildIngredientTermUniverse,
  renderAndValidateDeterministicLockedPlan,
} from './generated-plan-contract.js';

const TOKEN_VERSION = 1;
const TOKEN_PREFIX = 'rm1';
const ACTION_PHASES = Object.freeze(['pre_actions', 'start_actions', 'mid_actions', 'finish_actions']);
const BASIC_EXTRA_IDS = new Set(['water', 'cooking-oil', 'salt']);

const HOUSEHOLD_COPY = Object.freeze({
  'home-chicken-leg-potato-rice': Object.freeze({
    recommendation_reason: '鸡腿和土豆同锅焖熟，大米吸收肉香，按顺序完成就能端上桌。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      cut_chicken_leg_to_small_pieces: '将{{i2}}切成小块，方便在电饭煲中均匀熟透。',
      prepare_vegetables: '将{{i3}}切成大小相近的块，洗去表面淀粉。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}放入内胆，加入约量好的{{e1}}并轻轻铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}已经放好，盖好锅盖，启动标准煮饭程序。',
      rest_lid_closed: '程序结束后，让{{i1}}在盖好锅盖的状态下静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透，内部无粉红；{{i3}}熟软。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}轻轻翻松，盛出即可。',
    }),
  }),
  'home-corn-carrot-chicken-leg-rice': Object.freeze({
    recommendation_reason: '鸡腿、玉米和胡萝卜随大米同锅焖熟，食材搭配完整，适合直接作为一顿主餐。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      cut_chicken_leg_to_small_pieces: '将{{i2}}切成小块，方便在电饭煲中均匀熟透。',
      prepare_vegetables: '将{{i3}}洗净；{{i4}}切成大小均匀的小丁。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}放入内胆，加入约量好的{{e1}}并轻轻铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}已经放好，盖好锅盖，启动标准煮饭程序。',
      rest_lid_closed: '程序结束后，让{{i1}}在盖好锅盖的状态下静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透，内部无粉红；{{i4}}熟软。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}、{{i4}}轻轻翻松，盛出即可。',
    }),
  }),
  'home-green-bean-pork-rib-rice': Object.freeze({
    recommendation_reason: '排骨和豆角按熟化顺序处理，再与大米一起焖熟，适合一锅端上桌。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      pre_cook_pork_ribs_outside_cooker: '将{{i2}}在外锅加热至接近熟透，倒去多余血沫后备用。',
      prepare_vegetables: '将{{i3}}修剪两端后切成小段，洗净备用。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}放入内胆，加入{{e1}}并轻轻铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}已经放好，盖好锅盖，启动标准煮饭程序。',
      rest_lid_closed: '程序结束后，让{{i1}}在盖好锅盖的状态下静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透；{{i3}}煮熟软化。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}轻轻翻松，盛出即可。',
    }),
  }),
  'home-mushroom-green-bean-pork-rib-rice': Object.freeze({
    recommendation_reason: '排骨、香菇和豆角按熟化顺序处理，再与大米一起焖熟，能在一锅里兼顾肉、菌菇和蔬菜。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      pre_cook_pork_ribs_outside_cooker: '将{{i2}}在外锅加热至接近熟透，倒去多余血沫后备用。',
      prepare_vegetables: '将{{i3}}切片；{{i4}}修剪两端后切成小段，分别洗净备用。',
      load_inner_pot: '把{{i1}}、{{i2}}、{{i3}}、{{i4}}放入内胆，加入{{e1}}并轻轻铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}、{{i3}}、{{i4}}已经放好，盖好锅盖，启动标准煮饭程序。',
      rest_lid_closed: '程序结束后，让{{i1}}在盖好锅盖的状态下静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透；{{i4}}煮熟软化。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}、{{i4}}轻轻翻松，盛出即可。',
    }),
  }),
  'home-cabbage-tofu-rice': Object.freeze({
    recommendation_reason: '老豆腐随大米焖透，白菜在锅外熟制后再拌入，兼顾清爽口感和完整闭盖程序。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      pre_cook_tender_vegetables_outside_cooker: '将{{i3}}洗净切好，在炒锅中炒至熟软，保持温热待用。',
      load_inner_pot: '把{{i1}}、{{i2}}放入内胆，加入{{e1}}并轻轻铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}已经放好，盖好锅盖，启动标准煮饭程序并保持锅盖关闭。',
      rest_lid_closed: '程序结束后，让{{i1}}在盖好锅盖的状态下静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}中心热透；锅外熟制的{{i3}}已经熟软。',
      fold_in_pre_cooked_ingredients: '把保留的{{i3}}拌入煮好的饭中，轻轻翻匀。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}轻轻翻松，盛出即可。',
    }),
  }),
  'home-broccoli-beef-rice': Object.freeze({
    recommendation_reason: '牛肉随大米完整焖熟，西兰花在锅外熟制后再拌入，兼顾一锅主餐和嫩蔬菜口感。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      prepare_raw_ingredients: '将{{i2}}切成薄而均匀的小片，避免叠成厚块。',
      pre_cook_tender_vegetables_outside_cooker: '将{{i3}}洗净分成小朵，在炒锅中炒至熟嫩，保持温热待用。',
      load_inner_pot: '把{{i1}}、{{i2}}放入内胆，加入{{e1}}并轻轻铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}已经放好，盖好锅盖，启动标准煮饭程序并保持锅盖关闭。',
      rest_lid_closed: '程序结束后，让{{i1}}在盖好锅盖的状态下静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透且无生肉色；锅外熟制的{{i3}}已经熟嫩。',
      fold_in_pre_cooked_ingredients: '把保留的{{i3}}拌入煮好的饭中，轻轻翻匀。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}轻轻翻松，盛出即可。',
    }),
  }),
  'home-greens-minced-pork-rice': Object.freeze({
    recommendation_reason: '猪肉末先炒散熟化后随大米焖煮，青菜在锅外熟制后再拌入，步骤清楚并保持完整闭盖程序。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      brown_ground_pork_outside_cooker: '将{{i2}}放入炒锅中炒散，持续加热至完全变色且没有粉红生肉后备用。',
      pre_cook_tender_vegetables_outside_cooker: '将{{i3}}洗净切好，在炒锅中炒至熟软，保持温热待用。',
      load_inner_pot: '把{{i1}}、{{i2}}放入内胆，加入{{e1}}并轻轻铺平。',
      start_closed_lid_program: '确认{{i1}}、{{i2}}已经放好，盖好锅盖，启动标准煮饭程序并保持锅盖关闭。',
      rest_lid_closed: '程序结束后，让{{i1}}在盖好锅盖的状态下静置片刻。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透且没有粉红生肉；锅外熟制的{{i3}}已经熟软。',
      fold_in_pre_cooked_ingredients: '把保留的{{i3}}拌入煮好的饭中，轻轻翻匀。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}轻轻翻松，盛出即可。',
    }),
  }),
  'shanghai-salted-pork-rice': Object.freeze({
    recommendation_reason: '这种安排兼顾地方风味、清爽口感和完整熟制。',
    steps: Object.freeze({
      rinse_raw_rice: '淘洗{{i1}}后沥干，放在一旁备用。',
      prepare_raw_ingredients: '将{{i2}}切成薄而均匀的小片，先试咸味，不额外加盐。',
      prepare_vegetables: '将{{i3}}洗净切段，充分沥干，单独放在手边备用。',
      load_inner_pot: '把{{i1}}和{{i2}}放入内胆，加入约量好的{{e1}}并轻轻铺平。',
      start_closed_lid_program: '确认{{i1}}和{{i2}}已经放好，盖好锅盖，启动标准煮饭程序；确认机器能显示剩余时间，并允许短暂开盖后自动继续。',
      add_reserved_leafy_vegetable: '煮饭程序剩约10分钟时，开盖把{{i3}}铺在饭面，不翻动米饭；30秒内合盖，让原程序继续。',
      rest_lid_closed: '程序结束后，让{{i1}}继续盖好锅盖焖5分钟。',
      verify_safety_endpoints: '开盖检查：{{i1}}熟软且无硬芯；{{i2}}完全熟透；{{i3}}已经熟软。',
      fluff_and_serve: '将{{i1}}、{{i2}}、{{i3}}轻轻翻匀，盛出即可。',
    }),
  }),
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

function riceMealError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function invalidToken() {
  return riceMealError('invalid_plan_token');
}

function stalePlan() {
  return riceMealError('stale_plan');
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function integerServings(value) {
  return Number.isInteger(value) && value >= 1 && value <= 8 ? value : null;
}

function sortedUniqueStrings(value) {
  if (!Array.isArray(value) || value.some(entry => !nonEmptyString(entry))) return null;
  const trimmed = value.map(entry => entry.trim());
  if (new Set(trimmed).size !== trimmed.length) return null;
  return trimmed.sort((left, right) => left.localeCompare(right, 'en'));
}

function stableRows(value, normalizer) {
  if (!Array.isArray(value)) return null;
  const rows = value.map(normalizer);
  if (rows.some(row => row == null)) return null;
  return rows.sort((left, right) => canonicalJson(left).localeCompare(canonicalJson(right), 'en'));
}

function canonicalActionProtocol(executionActions) {
  if (!isPlainObject(executionActions)) return null;
  const protocol = [];
  for (const phase of ACTION_PHASES) {
    const source = phase === 'mid_actions' && executionActions[phase] === undefined
      ? []
      : executionActions[phase];
    if (!Array.isArray(source)) return null;
    const actions = source.map(action => {
      const ingredientIds = sortedUniqueStrings(action?.ingredient_ids);
      if (!Number.isInteger(action?.order) || action.order < 1
          || !nonEmptyString(action?.action_code) || ingredientIds == null) return null;
      return {
        order: action.order,
        action_code: action.action_code.trim(),
        ingredient_ids: ingredientIds,
        ...(phase === 'mid_actions' ? {
          timing_basis: nonEmptyString(action.timing_basis),
          timing_min: action.timing_min,
          timing_max: action.timing_max,
          max_open_seconds: action.max_open_seconds,
          placement: nonEmptyString(action.placement),
          resume_policy: nonEmptyString(action.resume_policy),
          required_post_close_minutes: action.required_post_close_minutes,
        } : {}),
        ...(phase === 'finish_actions' && action.action_code === 'rest_lid_closed'
          && Number.isInteger(action.rest_minutes) ? { rest_minutes: action.rest_minutes } : {}),
      };
    });
    if (actions.some(action => action == null)) return null;
    if (phase === 'mid_actions' && actions.some(action => (
      !action.timing_basis || !action.placement || !action.resume_policy
      || !Number.isInteger(action.timing_min) || !Number.isInteger(action.timing_max)
      || !Number.isInteger(action.max_open_seconds)
      || !Number.isInteger(action.required_post_close_minutes)
    ))) return null;
    actions.sort((left, right) => left.order - right.order
      || left.action_code.localeCompare(right.action_code, 'en'));
    if (new Set(actions.map(action => action.order)).size !== actions.length) return null;
    protocol.push({ phase, actions });
  }
  return protocol;
}

function canonicalSnapshotItem(row) {
  if (!isPlainObject(row)) return null;
  if (row.kind === 'recognized') {
    const canonicalId = nonEmptyString(row.canonical_id);
    const state = row.state == null ? null : nonEmptyString(row.state);
    const shapeOrCut = row.shape_or_cut == null ? null : nonEmptyString(row.shape_or_cut);
    if (!canonicalId || (row.state != null && !state) || (row.shape_or_cut != null && !shapeOrCut)) return null;
    return {
      kind: 'recognized',
      canonical_id: canonicalId,
      state,
      shape_or_cut: shapeOrCut,
    };
  }
  if (row.kind === 'unrecognized') {
    const raw = nonEmptyString(row.raw);
    if (!raw || normalizePlannerTaxonomyKey(raw) !== raw) return null;
    return { kind: 'unrecognized', raw };
  }
  return null;
}

function canonicalRequestSnapshot(snapshot) {
  if (!isPlainObject(snapshot)) return null;
  const catalogVersion = nonEmptyString(snapshot.catalog_version);
  const servings = integerServings(snapshot.servings);
  const normalizedItems = stableRows(snapshot.normalized_items, canonicalSnapshotItem);
  const dislikes = stableRows(snapshot.dislikes, dislike => {
    const normalized = nonEmptyString(dislike);
    return normalized && normalizePlannerTaxonomyKey(normalized) === normalized ? normalized : null;
  });
  if (!catalogVersion || servings == null || normalizedItems == null || dislikes == null
      || new Set(normalizedItems.map(canonicalJson)).size !== normalizedItems.length
      || new Set(dislikes).size !== dislikes.length) return null;
  return {
    catalog_version: catalogVersion,
    servings,
    normalized_items: normalizedItems,
    dislikes,
  };
}

function canonicalCandidateFacts(candidate) {
  if (!isPlainObject(candidate) || !isPlainObject(candidate.plan_snapshot)) return null;
  const snapshot = candidate.plan_snapshot;
  const requestSnapshot = canonicalRequestSnapshot(snapshot);
  const substitutions = stableRows(candidate.substitutions, row => {
    const target = nonEmptyString(row?.target_canonical_id);
    const input = nonEmptyString(row?.input_canonical_id);
    const kind = nonEmptyString(row?.kind);
    return target && input && kind ? {
      target_canonical_id: target,
      input_canonical_id: input,
      kind,
    } : null;
  });
  const safetyEndpoints = stableRows(candidate.safety_endpoints, row => {
    const canonicalId = nonEmptyString(row?.canonical_ingredient_id);
    const endpointCode = nonEmptyString(row?.endpoint_code);
    if (!canonicalId || !endpointCode) return null;
    return {
      canonical_ingredient_id: canonicalId,
      endpoint_code: endpointCode,
    };
  });
  const fields = [
    candidate.plan_id,
    candidate.catalog_version,
    candidate.family_id,
    candidate.variant_id,
    candidate.recipe_id,
    candidate.ratio_catalog_version,
    candidate.ratio_facts_hash,
  ].map(nonEmptyString);
  const selectedIngredientIds = sortedUniqueStrings(candidate.selected_ingredient_ids);
  const selectedInputIds = sortedUniqueStrings(candidate.selected_input_ids);
  const ratioRuleIds = sortedUniqueStrings(candidate.ratio_rule_ids);
  const actions = canonicalActionProtocol(candidate.execution_actions);
  const servings = integerServings(candidate.servings);
  if (fields.some(value => value == null) || servings == null || requestSnapshot == null
      || !/^sha256:[a-f0-9]{64}$/u.test(fields[6]) || substitutions == null || safetyEndpoints == null
      || selectedIngredientIds == null || selectedInputIds == null || ratioRuleIds == null || actions == null) {
    return null;
  }
  return {
    catalog_version: fields[1],
    plan_id: fields[0],
    family_id: fields[2],
    variant_id: fields[3],
    recipe_id: fields[4],
    servings,
    request: requestSnapshot,
    ratio_catalog_version: fields[5],
    ratio_facts_hash: fields[6],
    selected_ingredient_ids: selectedIngredientIds,
    selected_input_ids: selectedInputIds,
    substitutions,
    ratio_rule_ids: ratioRuleIds,
    action_protocol: actions,
    safety_endpoints: safetyEndpoints,
  };
}

function bytesFromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function concatBytes(...arrays) {
  const length = arrays.reduce((sum, array) => sum + array.length, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
}

function hmacSha256Hex(secret, message) {
  if (!nonEmptyString(secret)) throw invalidToken();
  let key = new TextEncoder().encode(secret);
  if (key.length > 64) key = bytesFromHex(sha256Hex(key));
  const block = new Uint8Array(64);
  block.set(key);
  const inner = new Uint8Array(64);
  const outer = new Uint8Array(64);
  for (let index = 0; index < 64; index += 1) {
    inner[index] = block[index] ^ 0x36;
    outer[index] = block[index] ^ 0x5c;
  }
  const messageBytes = new TextEncoder().encode(message);
  return sha256Hex(concatBytes(outer, bytesFromHex(sha256Hex(concatBytes(inner, messageBytes)))));
}

function base64UrlEncode(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function base64UrlDecode(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/u.test(value)) return null;
  try {
    const padded = value.replaceAll('-', '+').replaceAll('_', '/')
      + '='.repeat((4 - value.length % 4) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function constantTimeEqual(left, right) {
  const leftText = String(left || '');
  const rightText = String(right || '');
  let difference = leftText.length ^ rightText.length;
  const length = Math.max(leftText.length, rightText.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (leftText.charCodeAt(index) || 0) ^ (rightText.charCodeAt(index) || 0);
  }
  return difference === 0;
}

function tokenPayload(candidate) {
  const facts = canonicalCandidateFacts(candidate);
  if (!facts) throw invalidToken();
  return { version: TOKEN_VERSION, candidate: facts };
}

export function buildRiceMealPlanToken(candidate, secret) {
  const payload = tokenPayload(candidate);
  const encoded = base64UrlEncode(canonicalJson(payload));
  return `${TOKEN_PREFIX}.${encoded}.${hmacSha256Hex(secret, encoded)}`;
}

function parsePlanToken(token, secret) {
  if (typeof token !== 'string') throw invalidToken();
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX || !/^[a-f0-9]{64}$/u.test(parts[2])) throw invalidToken();
  if (!constantTimeEqual(parts[2], hmacSha256Hex(secret, parts[1]))) throw invalidToken();
  const decoded = base64UrlDecode(parts[1]);
  if (!decoded) throw invalidToken();
  let payload;
  try {
    payload = JSON.parse(decoded);
  } catch {
    throw invalidToken();
  }
  if (!isPlainObject(payload) || Object.keys(payload).length !== 2
      || payload.version !== TOKEN_VERSION || !isPlainObject(payload.candidate)
      || !Array.isArray(payload.candidate.action_protocol)
      || base64UrlEncode(canonicalJson(payload)) !== parts[1]) {
    throw invalidToken();
  }
  let facts;
  try {
    facts = canonicalCandidateFacts({
      ...payload.candidate,
      plan_snapshot: payload.candidate.request,
      execution_actions: Object.fromEntries(payload.candidate.action_protocol.map(row => [row.phase, row.actions])),
    });
  } catch {
    throw invalidToken();
  }
  if (!facts || canonicalJson(facts) !== canonicalJson(payload.candidate)) throw invalidToken();
  return facts;
}

function assertAssets(assets) {
  if (!isPlainObject(assets) || !isPlainObject(assets.catalog)
      || !isPlainObject(assets.taxonomy) || !isPlainObject(assets.ratios)
      || !isPlainObject(assets.recipes)) {
    throw stalePlan();
  }
}

function recomputeCandidate(facts, assets) {
  assertAssets(assets);
  if (facts.catalog_version !== assets.catalog.catalog_version
      || facts.request.catalog_version !== assets.catalog.catalog_version
      || facts.ratio_catalog_version !== assets.ratios.ratio_catalog_version
      || facts.servings !== facts.request.servings) throw stalePlan();
  let result;
  try {
    result = selectRiceMealCandidates({
      request: {},
      normalizedRequest: facts.request,
      catalog: assets.catalog,
      taxonomy: assets.taxonomy,
      ratioCatalog: assets.ratios,
      recentPlanIds: [],
    });
  } catch {
    throw stalePlan();
  }
  const candidate = (result?.candidates || []).find(row => row.plan_id === facts.plan_id);
  if (!candidate) throw stalePlan();
  const recomputedFacts = canonicalCandidateFacts(candidate);
  if (!recomputedFacts || canonicalJson(recomputedFacts) !== canonicalJson(facts)) throw stalePlan();
  return candidate;
}

export function verifyAndRecomputeRiceMealPlan(envelope, assets, secret) {
  if (!isPlainObject(envelope) || Object.keys(envelope).length !== 1
      || typeof envelope.plan_token !== 'string') throw invalidToken();
  return recomputeCandidate(parsePlanToken(envelope.plan_token, secret), assets);
}

function variantsById(catalog) {
  return new Map((catalog?.families || []).flatMap(family => (family?.variants || []).map(variant => [
    variant.variant_id,
    { family_id: family.family_id, variant },
  ])));
}

function taxonomyById(taxonomy) {
  return new Map((taxonomy?.items || []).map(item => [item.canonical_id, item]));
}

function exactRecipeRule(rule, variant) {
  return rule && rule.execution_mode === 'executable'
    && rule.when?.recipe_id === variant.recipe_id
    && Array.isArray(rule.operations)
    && rule.operations.length > 0;
}

function findBasicTaxonomyItem(target, itemIndex) {
  const matches = [...itemIndex.values()].filter(item => (
    item.display_name === target?.name && item.category === target?.category
  ));
  return matches.length === 1 && BASIC_EXTRA_IDS.has(matches[0].canonical_id) ? matches[0] : null;
}

function ratioFailure() {
  throw stalePlan();
}

function compileExactRatioFacts(variant, candidate, assets, materials) {
  const itemIndex = taxonomyById(assets.taxonomy);
  const ruleById = new Map((assets.ratios.rules || []).map(rule => [rule.rule_id, rule]));
  if (candidate.ratio_catalog_version !== assets.ratios.ratio_catalog_version
      || !/^sha256:[a-f0-9]{64}$/u.test(candidate.ratio_facts_hash || '')
      || !Array.isArray(variant.ratio_rule_ids) || variant.ratio_rule_ids.length !== 1
      || canonicalJson([...variant.ratio_rule_ids].sort()) !== canonicalJson([...candidate.ratio_rule_ids].sort())) {
    ratioFailure();
  }
  const rule = ruleById.get(variant.ratio_rule_ids[0]);
  if (!exactRecipeRule(rule, variant)) ratioFailure();
  const liquidContract = rule.liquid_contract;
  if (!isPlainObject(liquidContract)
      || !['added_water', 'total_free_liquid'].includes(liquidContract.kind)
      || liquidContract.measurement !== 'weigh_before_loading'
      || !Number.isSafeInteger(liquidContract.display_rounding_grams)
      || liquidContract.display_rounding_grams <= 0
      || (liquidContract.kind === 'total_free_liquid'
        && canonicalJson(liquidContract.measured_contributor_ids) !== canonicalJson(['water']))) {
    ratioFailure();
  }
  const nearest = rule.rounding?.grams_to_nearest;
  if (!Number.isSafeInteger(nearest) || nearest <= 0) ratioFailure();
  const materialById = new Map(materials.map(item => [item.canonical_id, item]));
  const rawAmounts = new Map();
  const groupLockedCanonicalIds = new Set();
  const basicTargets = new Map();
  const trace = [];
  let liquidCredit = 0;

  const addRawAmount = (canonicalId, grams, basic = null) => {
    if (!Number.isFinite(grams) || grams <= 0 || rawAmounts.has(canonicalId)) ratioFailure();
    rawAmounts.set(canonicalId, grams);
    if (basic) basicTargets.set(canonicalId, basic);
  };
  for (const operation of rule.operations) {
    if (operation?.operator === 'per_serving') {
      const canonicalId = operation.target?.canonical_id;
      const material = materialById.get(canonicalId);
      const grams = operation.grams?.default;
      if (!material || material.state !== operation.target?.state
          || (operation.target?.shape_or_cut && material.shape_or_cut !== operation.target.shape_or_cut)
          || !Number.isFinite(grams) || grams <= 0
          || operation.grams?.min !== grams || operation.grams?.max !== grams) ratioFailure();
      addRawAmount(canonicalId, grams * candidate.servings);
      trace.push({
        rule_id: rule.rule_id,
        operator: 'per_serving',
        canonical_id: canonicalId,
        grams_per_serving: grams,
      });
      continue;
    }
    if (operation?.operator === 'allocate_group_total_per_serving') {
      const targets = operation.member_targets;
      const gramsPerServing = operation.grams?.default;
      if (!Array.isArray(targets) || targets.length < 2
          || operation.allocation_policy !== 'equal_split_ordered_residual'
          || !Number.isFinite(gramsPerServing) || gramsPerServing <= 0
          || operation.grams?.min !== gramsPerServing || operation.grams?.max !== gramsPerServing) {
        ratioFailure();
      }
      const members = targets.map(target => {
        const material = materialById.get(target?.canonical_id);
        if (!material || material.state !== target?.state
            || (target?.shape_or_cut && material.shape_or_cut !== target.shape_or_cut)) ratioFailure();
        return material;
      });
      if (new Set(members.map(material => material.canonical_id)).size !== members.length) ratioFailure();
      const lockedGroupTotal = normalizeRatioGrams(gramsPerServing * candidate.servings, nearest);
      const totalUnits = lockedGroupTotal / nearest;
      if (!Number.isSafeInteger(totalUnits) || totalUnits < members.length) ratioFailure();
      const baseUnits = Math.floor(totalUnits / members.length);
      const residualUnits = totalUnits % members.length;
      const allocated = members.map((material, index) => {
        const grams = (baseUnits + (index < residualUnits ? 1 : 0)) * nearest;
        addRawAmount(material.canonical_id, grams);
        groupLockedCanonicalIds.add(material.canonical_id);
        return { canonical_id: material.canonical_id, grams };
      });
      trace.push({
        rule_id: rule.rule_id,
        operator: 'allocate_group_total_per_serving',
        member_canonical_ids: members.map(material => material.canonical_id),
        group_total_grams: lockedGroupTotal,
        allocation_policy: operation.allocation_policy,
        amount_provenance: 'planner_allocation_not_source_individual_amounts',
        allocated,
      });
      continue;
    }
    // Every supported recipe operation gets a reviewed compiler branch rather
    // than being inferred from recipe prose.
    if (operation?.operator === 'bounded_sum') ratioFailure();
    if (operation?.operator === 'ratio') {
      const denominator = materialById.get(operation.denominator?.canonical_id);
      const target = findBasicTaxonomyItem(operation.target, itemIndex);
      const multiplier = operation.default;
      if (!denominator || operation.denominator?.state !== denominator.state
          || operation.denominator?.measure !== 'grams' || !target
          || operation.numerator?.resource !== 'retained_liquid_grams'
          || !Number.isFinite(multiplier) || multiplier <= 0
          || operation.min !== multiplier || operation.max !== multiplier
          || !rawAmounts.has(denominator.canonical_id)) {
        ratioFailure();
      }
      addRawAmount(target.canonical_id, rawAmounts.get(denominator.canonical_id) * multiplier - liquidCredit, target);
      trace.push({
        rule_id: rule.rule_id,
        operator: 'ratio',
        numerator: operation.numerator.resource,
        denominator_canonical_id: denominator.canonical_id,
        multiplier,
        liquid_credit_grams: liquidCredit,
      });
      continue;
    }
    if (operation?.operator === 'fixed_addition' || operation?.operator === 'scale_by_servings') {
      const target = findBasicTaxonomyItem(operation.target, itemIndex);
      const grams = operation.grams?.default;
      if (!target || !Number.isFinite(grams) || grams <= 0) ratioFailure();
      const multiplier = operation.operator === 'scale_by_servings' ? candidate.servings : 1;
      addRawAmount(target.canonical_id, grams * multiplier, target);
      trace.push({ rule_id: rule.rule_id, operator: operation.operator, canonical_id: target.canonical_id, grams: grams * multiplier });
      continue;
    }
    ratioFailure();
  }
  if (materials.some(item => !rawAmounts.has(item.canonical_id))) ratioFailure();
  const lockedAmounts = new Map();
  for (const [canonicalId, rawGrams] of rawAmounts) {
    const grams = groupLockedCanonicalIds.has(canonicalId) ? rawGrams : normalizeRatioGrams(rawGrams, nearest);
    if (!Number.isSafeInteger(grams) || grams <= 0 || grams > 5000) ratioFailure();
    lockedAmounts.set(canonicalId, grams);
  }
  const extras = [...basicTargets.values()].map(item => ({
    canonical_id: item.canonical_id,
    raw_name: item.display_name,
    display_name: item.display_name,
    canonical: item.canonical_name || item.display_name,
    category: item.category,
    state: item.states?.[0] || 'basic',
    shape_or_cut: item.shapes_or_cuts?.[0] || null,
    moisture_release: item.moisture_release || null,
    source: 'basic_extra',
    grams: lockedAmounts.get(item.canonical_id),
  }));
  const addedWaterGrams = extras.filter(item => item.canonical_id === 'water')
    .reduce((sum, item) => sum + item.grams, 0);
  if (!Number.isSafeInteger(addedWaterGrams) || addedWaterGrams <= 0) ratioFailure();
  return {
    amounts: lockedAmounts,
    extras,
    ratio_trace: trace,
    liquid_constraints: {
      kind: liquidContract.kind,
      measured_contributor_ids: clone(liquidContract.measured_contributor_ids || []),
      target_total_free_liquid_grams: liquidContract.kind === 'total_free_liquid' ? addedWaterGrams : null,
      added_water_grams: addedWaterGrams,
      display_precision: liquidContract.display_precision,
      display_grams: normalizeRatioGrams(addedWaterGrams, liquidContract.display_rounding_grams),
      retained_liquid_grams: addedWaterGrams,
      liquid_credit_grams: normalizeRatioGrams(liquidCredit, nearest),
      rounding_grams: nearest,
    },
  };
}

function actualInputFor(targetId, candidate, used) {
  const substitution = (candidate.substitutions || []).find(row => row.target_canonical_id === targetId);
  const actualId = substitution?.input_canonical_id || targetId;
  const item = (candidate.used_items || []).find(row => row.canonical_id === actualId && !used.has(row));
  if (!item) ratioFailure();
  used.add(item);
  return item;
}

function materialRows(variant, candidate, taxonomy) {
  const itemIndex = taxonomyById(taxonomy);
  const targets = [variant.rice?.canonical_ingredient_id, ...(variant.ingredients || [])
    .map(item => item.canonical_ingredient_id)];
  if (targets.some(id => !id || !itemIndex.has(id))) ratioFailure();
  const used = new Set();
  return targets.map((canonicalId, index) => {
    const taxonomyItem = itemIndex.get(canonicalId);
    const input = index === 0 ? null : actualInputFor(canonicalId, candidate, used);
    const rawName = input?.raw || taxonomyItem.display_name;
    const state = input?.state || taxonomyItem.states?.[0] || null;
    const shape = input?.shape_or_cut || taxonomyItem.shapes_or_cuts?.[0] || null;
    return {
      canonical_id: canonicalId,
      raw_name: rawName,
      display_name: input?.display_name || taxonomyItem.display_name,
      canonical: input?.canonical || taxonomyItem.canonical_name || taxonomyItem.display_name,
      category: input?.category || taxonomyItem.category,
      state,
      shape_or_cut: shape,
      moisture_release: input?.moisture_release || taxonomyItem.moisture_release || null,
      source: index === 0 ? 'catalog_staple' : 'user',
      requires_explicit_raw_name: Boolean(input?.raw && shape),
    };
  });
}

function refsForIds(ids, refsByCanonical) {
  const refs = ids.map(id => refsByCanonical.get(id));
  if (refs.some(ref => !ref)) ratioFailure();
  return refs;
}

function lockedPlanForCandidate(candidate, assets) {
  const entry = variantsById(assets.catalog).get(candidate.variant_id);
  if (!entry || entry.family_id !== candidate.family_id || entry.variant.recipe_id !== candidate.recipe_id
      || entry.variant.status !== 'preview_ready' || !HOUSEHOLD_COPY[candidate.variant_id]) {
    throw stalePlan();
  }
  const variant = entry.variant;
  if (Array.isArray(variant.supported_servings)
      && !variant.supported_servings.includes(candidate.servings)) ratioFailure();
  const itemIndex = taxonomyById(assets.taxonomy);
  const substitutions = candidate.substitutions || [];
  if (substitutions.some(row => {
    const input = itemIndex.get(row.input_canonical_id);
    return row.kind !== 'generic_slot'
      || row.target_canonical_id !== 'beef-generic'
      || row.input_canonical_id !== 'beef-tenderloin'
      || input?.category !== 'beef'
      || !input.compatible_slot_codes?.includes('generic_beef');
  })) ratioFailure();
  const materials = materialRows(variant, candidate, assets.taxonomy);
  const ratio = compileExactRatioFacts(variant, candidate, assets, materials);
  if (ratio.extras.length !== 1 || ratio.extras[0].canonical_id !== 'water') ratioFailure();
  const allIngredients = [
    ...materials.map((item, index) => ({ ...item, ingredient_ref: `i${index + 1}`, planned_grams: ratio.amounts.get(item.canonical_id) })),
    ...ratio.extras.map((item, index) => ({ ...item, ingredient_ref: `e${index + 1}`, planned_grams: item.grams, requires_explicit_raw_name: false })),
  ];
  if (allIngredients.some(item => !Number.isSafeInteger(item.planned_grams) || item.planned_grams <= 0)) ratioFailure();
  const refsByCanonical = new Map(allIngredients.map(item => [item.canonical_id, item.ingredient_ref]));
  const adaptation = variant.cooker_adaptation;
  const midActions = Array.isArray(adaptation?.mid_actions) ? adaptation.mid_actions : [];
  const controlledMidCycle = adaptation?.requires_mid_cook_opening === true
    && variant.recipe_id === 'shanghai-salted-pork-vegetable-rice'
    && JSON.stringify(variant.supported_servings) === JSON.stringify([3])
    && midActions.length === 1
    && midActions[0]?.action_code === 'add_reserved_leafy_vegetable'
    && midActions[0]?.timing_basis === 'program_remaining_minutes'
    && midActions[0]?.timing_min === 10 && midActions[0]?.timing_max === 10
    && midActions[0]?.max_open_seconds === 30
    && midActions[0]?.placement === 'top_no_stir'
    && midActions[0]?.resume_policy === 'same_program_auto_resume'
    && midActions[0]?.required_post_close_minutes === 10
    && midActions[0]?.ingredient_ids?.length === 1
    && midActions[0]?.ingredient_ids?.[0] === 'small-bok-choy';
  const controlledRest = (adaptation?.finish_actions || [])
    .filter(action => action?.action_code === 'rest_lid_closed');
  if (controlledMidCycle && (controlledRest.length !== 1 || controlledRest[0]?.rest_minutes !== 5)) ratioFailure();
  if (!adaptation || adaptation.closed_lid_continuation !== true
      || (adaptation.requires_mid_cook_opening === true && !controlledMidCycle)
      || adaptation.completion_status !== 'complete') ratioFailure();
  const catalogActions = ACTION_PHASES.flatMap(phase => (adaptation[phase] || [])
    .slice().sort((left, right) => left.order - right.order));
  const candidateActions = candidate.execution_actions;
  if (!candidateActions || canonicalJson(canonicalActionProtocol(candidateActions))
      !== canonicalJson(canonicalActionProtocol(adaptation))) ratioFailure();
  const safetyEndpoints = (variant.safety_endpoints || []).map(row => row.endpoint_code);
  if (!safetyEndpoints.length || canonicalJson(stableRows(candidate.safety_endpoints, row => ({
    canonical_ingredient_id: nonEmptyString(row?.canonical_ingredient_id),
    endpoint_code: nonEmptyString(row?.endpoint_code),
  }))) !== canonicalJson(stableRows(variant.safety_endpoints, row => ({
    canonical_ingredient_id: nonEmptyString(row?.canonical_ingredient_id),
    endpoint_code: nonEmptyString(row?.endpoint_code),
  })))) ratioFailure();
  const safetyRefs = refsForIds(variant.safety_endpoints.map(row => row.canonical_ingredient_id), refsByCanonical);
  const copy = HOUSEHOLD_COPY[variant.variant_id];
  const cookingOrder = catalogActions.map(action => {
    const allowed = refsForIds(action.ingredient_ids || [], refsByCanonical);
    if (action.action_code === 'load_inner_pot') {
      for (const extra of ratio.extras) {
        const ref = refsByCanonical.get(extra.canonical_id);
        if (ref && !allowed.includes(ref)) allowed.push(ref);
      }
    }
    const text = copy.steps[action.action_code];
    if (!text) ratioFailure();
    const requirements = action.action_code === 'verify_safety_endpoints'
      ? { required_safety_endpoints: [...safetyEndpoints], required_safety_ingredient_refs: safetyRefs }
      : { required_safety_endpoints: [], required_safety_ingredient_refs: [] };
    const lockedNumericFacts = action.action_code === 'add_reserved_leafy_vegetable'
      ? [`${action.timing_min}分钟`, `${action.max_open_seconds}秒`]
      : (action.action_code === 'rest_lid_closed' && Number.isInteger(action.rest_minutes)
        ? [`${action.rest_minutes}分钟`]
        : []);
    return {
      action_code: action.action_code,
      allowed_ingredient_refs: allowed,
      locked_numeric_facts: lockedNumericFacts,
      ...requirements,
    };
  });
  return {
    plan_id: candidate.plan_id,
    meals: [{
      meal_sequence: 1,
      servings: candidate.servings,
      template_id: `rice-meal:${variant.variant_id}`,
      plan_source: 'rice_meal_catalog',
      recipe_id: variant.recipe_id,
      variant_id: variant.variant_id,
      identity_level: variant.identity_level,
      locked_ingredients: allIngredients,
      slot_assignment: allIngredients.map(item => ({
        slot_id: item.canonical_id,
        ingredient_refs: [item.ingredient_ref],
      })),
      cooking_order: cookingOrder,
      ratio_constraints: clone(ratio.ratio_trace),
      liquid_constraints: clone(ratio.liquid_constraints),
      time_range: {
        active_minutes: adaptation.active_time_minutes,
        total_minutes: adaptation.total_time_minutes,
      },
      safety_endpoints: [...safetyEndpoints],
      safety_endpoint_requirements: variant.safety_endpoints.map(endpoint => ({
        endpoint_code: endpoint.endpoint_code,
        ingredient_refs: [refsByCanonical.get(endpoint.canonical_ingredient_id)],
      })),
      generation_text_contract: {
        dish_name_options: [variant.display_name],
        dish_name_ingredient_exemptions: variant.variant_id === 'shanghai-salted-pork-rice'
          ? ['上海咸肉']
          : [],
        steps: cookingOrder.map((phase, index) => ({
          order: index + 1,
          allowed_texts: [copy.steps[phase.action_code]],
        })),
        recommendation_reason_options: [copy.recommendation_reason],
      },
    }],
  };
}

export function compileRiceMeal(candidate, assets) {
  const facts = canonicalCandidateFacts(candidate);
  if (!facts) throw invalidToken();
  const recomputed = recomputeCandidate(facts, assets);
  const lockedPlan = lockedPlanForCandidate(recomputed, assets);
  const universe = buildIngredientTermUniverse(assets.taxonomy, assets.recipes);
  const { meals } = renderAndValidateDeterministicLockedPlan(lockedPlan, universe);
  const lockedMeal = lockedPlan.meals[0];
  return clone({
    schema_version: 3,
    catalog_version: assets.catalog.catalog_version,
    status: 'ready',
    generation_allowed: true,
    plan_id: recomputed.plan_id,
    family_id: recomputed.family_id,
    variant_id: recomputed.variant_id,
    recipe_id: recomputed.recipe_id,
    plan: {
      plan_id: recomputed.plan_id,
      catalog_version: assets.catalog.catalog_version,
      family_id: recomputed.family_id,
      variant_id: recomputed.variant_id,
      recipe_id: recomputed.recipe_id,
      servings: recomputed.servings,
      ingredient_amounts: lockedMeal.locked_ingredients.map(item => ({
        canonical_id: item.canonical_id,
        name: item.raw_name,
        grams: item.planned_grams,
      })),
      required_extra_items: lockedMeal.locked_ingredients.filter(item => item.source === 'basic_extra').map(item => ({
        canonical_id: item.canonical_id,
        name: item.raw_name,
        grams: item.planned_grams,
      })),
      ratio_trace: clone(lockedMeal.ratio_constraints),
      liquid_constraints: clone(lockedMeal.liquid_constraints),
      execution_actions: clone(recomputed.execution_actions),
      safety_endpoints: clone(recomputed.safety_endpoints),
      nutrition_inputs: lockedMeal.locked_ingredients.map(item => ({
        name: item.raw_name,
        canonical_id: item.canonical_id,
        state: item.state,
        grams: item.planned_grams,
      })),
    },
    meals: lockedPlan.meals.map((meal, index) => ({
      meal_sequence: meal.meal_sequence,
      servings: meal.servings,
      template_id: meal.template_id,
      plan_source: meal.plan_source,
      recipe_id: meal.recipe_id,
      variant_id: meal.variant_id,
      identity_level: meal.identity_level,
      locked_ingredients: clone(meal.locked_ingredients),
      slot_assignment: clone(meal.slot_assignment),
      ratio_constraints: clone(meal.ratio_constraints),
      liquid_constraints: clone(meal.liquid_constraints),
      time_range: clone(meal.time_range),
      safety_endpoints: clone(meal.safety_endpoints),
      dish_name: meals[index].dish_name,
      steps: meals[index].steps,
      recommendation_reason: meals[index].recommendation_reason,
    })),
  });
}

import { minimumRecommendCoverageCount } from './planner-coverage.js';
import { buildNamedRecipePresentation } from './plan-presentation.js';

const IDENTITY_LEVEL_BY_IMPACT = Object.freeze({
  preserves_identity: 'approved_variant',
  named_variant: 'approved_variant',
  style_adaptation: 'style_adaptation',
});

function submittedItems(normalizedRequest = {}) {
  const items = Array.isArray(normalizedRequest.normalized_items)
    ? normalizedRequest.normalized_items
    : [];
  return items.filter(Boolean);
}

function coverageItemsFor(items) {
  return items.filter(item => item.duplicate_of == null);
}

function itemSatisfiesStateOrCut(item, requirement) {
  return item.canonical_id === requirement.canonical_id
    && (item.state === requirement.value || item.shape_or_cut === requirement.value);
}

function substitutionsForVariant(variant) {
  const replacements = new Map();
  for (const substitution of variant?.substitutions || []) {
    for (const replaced of substitution.replaces_canonical_ids || []) {
      replacements.set(replaced, {
        slot_id: substitution.slot_id,
        allowed: [...(substitution.allowed_canonical_ids || [])],
      });
    }
  }
  return replacements;
}

function identityAttempt(entry, items, variant = null) {
  const byCanonicalId = new Map();
  for (const item of items.filter(candidate => candidate.recognized === true)) {
    if (!byCanonicalId.has(item.canonical_id)) byCanonicalId.set(item.canonical_id, []);
    byCanonicalId.get(item.canonical_id).push(item);
  }
  const forbidden = entry.identity_signature?.forbidden_canonical_ids || [];
  if (forbidden.some(canonicalId => byCanonicalId.has(canonicalId))) return null;

  const replacements = substitutionsForVariant(variant);
  const stateOrCutRequirements = entry.identity_signature?.required_states_or_cuts || [];
  const selected = [];
  const trace = [];
  for (const canonicalId of entry.identity_signature?.required_canonical_ids || []) {
    const replacement = replacements.get(canonicalId);
    const allowedIds = replacement ? replacement.allowed : [canonicalId];
    const requirements = replacement
      ? []
      : stateOrCutRequirements.filter(requirement => requirement.canonical_id === canonicalId);
    const item = allowedIds.flatMap(allowedId => byCanonicalId.get(allowedId) || [])
      .filter(candidate => requirements.every(requirement => itemSatisfiesStateOrCut(candidate, requirement)))
      .sort((left, right) => Number(left.duplicate_of != null) - Number(right.duplicate_of != null)
        || Number(left.role !== 'must_use') - Number(right.role !== 'must_use')
        || String(left.raw || '').localeCompare(String(right.raw || ''), 'zh-Hans-CN'))[0];
    if (!item) return null;
    selected.push(item);
    if (replacement) trace.push(`${canonicalId}->${item.canonical_id}@${replacement.slot_id}`);
    else trace.push(`${canonicalId}=exact`);
  }

  const replacedIds = new Set(replacements.keys());
  for (const requirement of stateOrCutRequirements) {
    if (replacedIds.has(requirement.canonical_id)) continue;
    const matching = selected.find(item => item.canonical_id === requirement.canonical_id);
    if (!matching || !itemSatisfiesStateOrCut(matching, requirement)) return null;
    trace.push(`${requirement.canonical_id}:${requirement.value}`);
  }
  return { selected, trace };
}

function unusedItem(item) {
  return {
    ...structuredClone(item),
    reason_code: item.recognized ? 'not_used_by_named_recipe' : 'unrecognized_ingredient',
    reason: item.recognized
      ? '这项食材不属于这道菜的受控用料。'
      : '暂时无法识别这种食材，因此不能承诺已经安排。',
  };
}

function variantPresentationTitle(entry, variant) {
  if (!variant) return entry.naming.canonical_name;
  return typeof variant.naming?.display_name === 'string' && variant.naming.display_name.trim()
    ? variant.naming.display_name.trim()
    : null;
}

function candidateFor(entry, allItems, attempt, variant = null, runtimeCatalogVersion = null) {
  const requestItems = coverageItemsFor(allItems);
  const representativeByRaw = new Map(requestItems.map(item => [item.raw, item]));
  const selectedGroups = new Map();
  for (const item of attempt.selected) {
    const representative = representativeByRaw.get(item.duplicate_of || item.raw) || item;
    if (selectedGroups.has(representative.raw)) return null;
    selectedGroups.set(representative.raw, {
      ...structuredClone(item),
      role: representative.role,
    });
  }
  const planned = [...selectedGroups.values()];
  if (planned.length < minimumRecommendCoverageCount(requestItems.length)) return null;
  const unused = requestItems.filter(item => !selectedGroups.has(item.raw)).map(unusedItem);
  const unrecognized = requestItems.filter(item => item.recognized !== true).map(item => structuredClone(item));
  const recognized = requestItems.filter(item => item.recognized === true);
  const plannedRecognized = planned.filter(item => item.recognized === true);
  const title = variantPresentationTitle(entry, variant);
  if (!title) return null;
  const presentation = buildNamedRecipePresentation({
    recipeId: entry.recipe_id,
    title,
    variant: Boolean(variant),
  });
  if (!presentation) return null;
  return {
    recipe_runtime_catalog_version: runtimeCatalogVersion,
    plan_source: variant ? 'recipe_variant' : 'named_recipe',
    recipe_id: entry.recipe_id,
    variant_id: variant?.variant_id || null,
    identity_level: variant ? IDENTITY_LEVEL_BY_IMPACT[variant.identity_impact] : 'canonical',
    match_trace: [...attempt.trace],
    presentation,
    normalized_items: allItems.map(item => structuredClone(item)),
    planned_must_use: planned.filter(item => item.role === 'must_use'),
    planned_prefer_use: planned.filter(item => item.role === 'prefer_use'),
    unplanned_must_use: unused.filter(item => item.role === 'must_use'),
    unused_prefer_use: unused.filter(item => item.role === 'prefer_use'),
    unrecognized_items: unrecognized,
    coverage_ratio: requestItems.length ? planned.length / requestItems.length : 0,
    recognition_ratio: requestItems.length ? recognized.length / requestItems.length : 0,
    recognized_coverage_ratio: recognized.length ? plannedRecognized.length / recognized.length : 0,
  };
}

export function matchNamedRecipeCandidates(assets = {}, normalizedRequest = {}) {
  const allItems = submittedItems(normalizedRequest);
  if (!allItems.length) return [];
  const candidates = [];
  for (const entry of assets.recipeRuntime?.entries || []) {
    if (entry.activation_status !== 'preview_enabled') continue;
    const canonical = identityAttempt(entry, allItems);
    if (canonical) {
      const candidate = candidateFor(
        entry,
        allItems,
        canonical,
        null,
        assets.recipeRuntime?.recipe_runtime_catalog_version || null,
      );
      if (candidate) candidates.push(candidate);
    }
    for (const variant of entry.approved_variants || []) {
      if (!IDENTITY_LEVEL_BY_IMPACT[variant.identity_impact]) continue;
      const attempt = identityAttempt(entry, allItems, variant);
      if (attempt) {
        const candidate = candidateFor(
          entry,
          allItems,
          attempt,
          variant,
          assets.recipeRuntime?.recipe_runtime_catalog_version || null,
        );
        if (candidate) candidates.push(candidate);
      }
    }
  }
  return candidates;
}

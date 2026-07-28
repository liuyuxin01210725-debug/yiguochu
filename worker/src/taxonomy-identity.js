export function normalizeTaxonomyIdentity(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
}

const TAXONOMY_IDENTITY_INDEX_CACHE = new WeakMap();

export function taxonomyIdentityIndex(taxonomy = {}) {
  const canCache = taxonomy && typeof taxonomy === 'object' && Object.isFrozen(taxonomy);
  if (canCache && TAXONOMY_IDENTITY_INDEX_CACHE.has(taxonomy)) {
    return TAXONOMY_IDENTITY_INDEX_CACHE.get(taxonomy);
  }
  const byName = new Map();
  for (const item of Array.isArray(taxonomy?.items) ? taxonomy.items : []) {
    for (const name of [item?.display_name, ...(Array.isArray(item?.aliases) ? item.aliases : [])]) {
      const key = normalizeTaxonomyIdentity(name);
      if (key && typeof item?.category === 'string') byName.set(key, {
        name: item.display_name,
        category: item.category,
        canonical_id: item.canonical_id,
        ratio_rule_policy: item.ratio_rule_policy || 'category_fallback',
      });
    }
  }
  if (canCache) TAXONOMY_IDENTITY_INDEX_CACHE.set(taxonomy, byName);
  return byName;
}

export const BASIC_EXTRA_CATEGORIES = new Set(['raw_rice', 'cooked_rice', 'noodle', 'liquid', 'oil', 'seasoning']);

export function resolveBasicExtraIdentity(target, taxonomy) {
  if (!target || typeof target.name !== 'string' || typeof target.category !== 'string') return null;
  const item = taxonomyIdentityIndex(taxonomy).get(normalizeTaxonomyIdentity(target.name));
  if (!item || item.category !== target.category || !BASIC_EXTRA_CATEGORIES.has(item.category)) return null;
  return item;
}

import crypto from 'node:crypto';

export const RUNTIME_AUTHORITY_MODES = Object.freeze(['shadow', 'catalog-enforced']);

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function candidateContractPayload(entry = {}, variant = null, catalogVersion = null) {
  return {
    catalog_version: catalogVersion || entry.recipe_runtime_catalog_version || entry.catalog_version || null,
    recipe_id: entry.recipe_id || null,
    variant_id: variant?.variant_id || null,
    entry,
    variant,
  };
}

export function runtimeCandidateContractHash(entry = {}, variant = null, catalogVersion = null) {
  return crypto.createHash('sha256')
    .update(canonicalJson(candidateContractPayload(entry, variant, catalogVersion)))
    .digest('hex');
}

export function buildRuntimeCandidateAuthority(entry = {}, variant = null, catalogVersion = null) {
  const recipeId = typeof entry?.recipe_id === 'string' ? entry.recipe_id : null;
  const variantId = typeof variant?.variant_id === 'string' ? variant.variant_id : null;
  const resolvedCatalogVersion = catalogVersion || entry?.recipe_runtime_catalog_version || entry?.catalog_version || null;
  return {
    candidate_id: variantId ? (recipeId ? `${recipeId}#${variantId}` : variantId) : recipeId,
    recipe_id: recipeId,
    variant_id: variantId,
    catalog_version: resolvedCatalogVersion,
    contract_hash: runtimeCandidateContractHash(entry, variant, resolvedCatalogVersion),
  };
}

function resolveRuntimeEntry(runtimeCatalogOrEntry, candidate = {}) {
  if (Array.isArray(runtimeCatalogOrEntry?.entries)) {
    const recipeId = candidate?.runtime_candidate_authority?.recipe_id || candidate?.recipe_id;
    return runtimeCatalogOrEntry.entries.find(entry => entry?.recipe_id === recipeId) || null;
  }
  return runtimeCatalogOrEntry && typeof runtimeCatalogOrEntry === 'object'
    ? runtimeCatalogOrEntry
    : null;
}

export function validateRuntimeCandidateAuthority(candidate = {}, runtimeCatalogOrEntry = {}) {
  const errors = [];
  const authority = candidate?.runtime_candidate_authority;
  if (!authority || typeof authority !== 'object' || Array.isArray(authority)) {
    return ['runtime_candidate_authority is required'];
  }
  const entry = resolveRuntimeEntry(runtimeCatalogOrEntry, candidate);
  if (!entry) return ['runtime candidate runtime entry is missing'];
  const expectedCatalogVersion = runtimeCatalogOrEntry?.runtime_catalog_version
    || runtimeCatalogOrEntry?.recipe_runtime_catalog_version
    || entry.recipe_runtime_catalog_version
    || entry.catalog_version
    || null;
  if (typeof authority.recipe_id !== 'string' || authority.recipe_id !== entry.recipe_id) {
    errors.push('runtime_candidate_authority recipe_id does not match runtime entry');
  }
  const variantId = authority.variant_id == null ? null : authority.variant_id;
  if (variantId !== null && typeof variantId !== 'string') errors.push('runtime_candidate_authority variant_id must be a string or null');
  const expectedCandidateId = variantId ? `${entry.recipe_id}#${variantId}` : entry.recipe_id;
  if (authority.candidate_id !== expectedCandidateId) errors.push('runtime_candidate_authority candidate_id does not match recipe/variant');
  if (typeof expectedCatalogVersion !== 'string' || authority.catalog_version !== expectedCatalogVersion) {
    errors.push('runtime_candidate_authority catalog_version does not match runtime catalog');
  }
  if (typeof authority.contract_hash !== 'string' || !/^[a-f0-9]{64}$/u.test(authority.contract_hash)) {
    errors.push('runtime_candidate_authority contract_hash must be a SHA-256 hex digest');
  }
  const variant = variantId == null
    ? null
    : (Array.isArray(entry.approved_variants)
      ? entry.approved_variants.find(item => item?.variant_id === variantId) || null
      : null);
  if (variantId != null && !variant) errors.push('runtime_candidate_authority variant_id is not an approved runtime variant');
  const expectedHash = runtimeCandidateContractHash(entry, variant, expectedCatalogVersion);
  if (authority.contract_hash !== expectedHash) errors.push('runtime_candidate_authority contract_hash does not match runtime contract');
  if (candidate.recipe_id != null && candidate.recipe_id !== authority.recipe_id) errors.push('candidate recipe_id disagrees with runtime_candidate_authority');
  if (candidate.variant_id != null && candidate.variant_id !== authority.variant_id) errors.push('candidate variant_id disagrees with runtime_candidate_authority');
  if (candidate.recipe_runtime_catalog_version != null && candidate.recipe_runtime_catalog_version !== authority.catalog_version) {
    errors.push('candidate recipe_runtime_catalog_version disagrees with runtime_candidate_authority');
  }
  return [...new Set(errors)];
}

export function assertRuntimeCandidateAuthority(candidate = {}, runtimeCatalogOrEntry = {}) {
  const errors = validateRuntimeCandidateAuthority(candidate, runtimeCatalogOrEntry);
  if (errors.length) throw new Error(`runtime_candidate_authority_invalid: ${errors.join('; ')}`);
  return candidate;
}

export function attachRuntimeCandidateAuthority(candidate, entry, variant = null, catalogVersion = null) {
  return {
    ...candidate,
    runtime_candidate_authority: buildRuntimeCandidateAuthority(entry, variant, catalogVersion),
  };
}

function variantCandidateContractPayload(variant = {}, familyId = null, catalogVersion = null) {
  return {
    catalog_version: catalogVersion || null,
    family_id: familyId || null,
    recipe_id: variant?.recipe_id || null,
    variant_id: variant?.variant_id || null,
    variant,
  };
}

export function runtimeVariantCandidateContractHash(variant = {}, familyId = null, catalogVersion = null) {
  return crypto.createHash('sha256').update(canonicalJson(variantCandidateContractPayload(variant, familyId, catalogVersion))).digest('hex');
}

export function buildRuntimeVariantCandidateAuthority(variant = {}, catalogVersion = null, familyId = null) {
  const recipeId = typeof variant?.recipe_id === 'string' ? variant.recipe_id : null;
  const variantId = typeof variant?.variant_id === 'string' ? variant.variant_id : null;
  const candidateId = recipeId && variantId ? `${recipeId}#${variantId}` : variantId || recipeId;
  return {
    candidate_id: candidateId,
    recipe_id: recipeId,
    variant_id: variantId,
    catalog_version: catalogVersion || null,
    contract_hash: runtimeVariantCandidateContractHash(variant, familyId, catalogVersion),
  };
}

export function validateRuntimeVariantCandidateAuthority(candidate = {}, variant = {}, catalogVersion = null, familyId = null) {
  const authority = candidate?.runtime_candidate_authority;
  if (!authority || typeof authority !== 'object' || Array.isArray(authority)) return ['runtime_candidate_authority is required'];
  const expected = buildRuntimeVariantCandidateAuthority(variant, catalogVersion, familyId);
  const errors = [];
  for (const field of ['candidate_id', 'recipe_id', 'variant_id', 'catalog_version']) {
    if (authority[field] !== expected[field]) errors.push(`runtime_candidate_authority ${field} does not match rice runtime variant`);
  }
  if (typeof authority.contract_hash !== 'string' || !/^[a-f0-9]{64}$/u.test(authority.contract_hash)) errors.push('runtime_candidate_authority contract_hash must be a SHA-256 hex digest');
  else if (authority.contract_hash !== expected.contract_hash) errors.push('runtime_candidate_authority contract_hash does not match rice runtime variant');
  if (candidate.variant_id != null && candidate.variant_id !== expected.variant_id) errors.push('candidate variant_id disagrees with runtime_candidate_authority');
  if (candidate.recipe_id !== undefined && candidate.recipe_id !== expected.recipe_id) errors.push('candidate recipe_id disagrees with runtime_candidate_authority');
  if (candidate.catalog_version != null && candidate.catalog_version !== expected.catalog_version) errors.push('candidate catalog_version disagrees with runtime_candidate_authority');
  return [...new Set(errors)];
}

export function normalizeRuntimeAuthority(value = {}) {
  const mode = value?.runtimeAuthorityMode ?? value?.mode ?? 'shadow';
  if (!RUNTIME_AUTHORITY_MODES.includes(mode)) throw new Error(`invalid runtime authority mode: ${mode}`);
  return {
    mode,
    catalog_version: typeof (value?.runtimeCatalogVersion ?? value?.catalog_version) === 'string'
      ? (value.runtimeCatalogVersion ?? value.catalog_version)
      : null,
    source: value?.source ?? 'build_metadata',
  };
}

export function decideRuntimeAuthority(authority, catalogHealth) {
  const normalized = normalizeRuntimeAuthority(authority);
  const eligible = Number(catalogHealth?.plannerRuntimeEligible) || 0;
  if (normalized.mode === 'shadow') {
    return { mode: normalized.mode, authorized: false, code: 'shadow_preview_only', eligible };
  }
  if (!catalogHealth || catalogHealth.status !== 'ok') {
    return { mode: normalized.mode, authorized: false, code: 'runtime_catalog_unavailable', eligible: 0 };
  }
  if (eligible < 1) {
    return { mode: normalized.mode, authorized: false, code: 'runtime_catalog_empty', eligible };
  }
  if ((Number(catalogHealth.productionApproved) || 0) < eligible) {
    return { mode: normalized.mode, authorized: false, code: 'production_approval_required', eligible };
  }
  return { mode: normalized.mode, authorized: true, code: 'catalog_enforced', eligible };
}

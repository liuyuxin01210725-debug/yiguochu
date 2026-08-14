export const RUNTIME_AUTHORITY_MODES = Object.freeze(['shadow', 'catalog-enforced']);

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
  if (normalized.mode === 'shadow') return { mode: normalized.mode, authorized: false, code: 'shadow_preview_only', eligible };
  if (!catalogHealth || catalogHealth.status !== 'ok') return { mode: normalized.mode, authorized: false, code: 'runtime_catalog_unavailable', eligible: 0 };
  if (eligible < 1) return { mode: normalized.mode, authorized: false, code: 'runtime_catalog_empty', eligible };
  if ((Number(catalogHealth.productionApproved) || 0) < eligible) return { mode: normalized.mode, authorized: false, code: 'production_approval_required', eligible };
  return { mode: normalized.mode, authorized: true, code: 'catalog_enforced', eligible };
}

import {
  buildSourceBackedRuntimeCatalog,
  validateSourceBackedRuntimeCatalog,
} from './source-backed-runtime-catalog.mjs';

const RELEASE_LEDGER_VERSION = 'source-backed-release-ledger-v1-20260813-c11';
const DEPRECATED_ALIAS = 'tools/data/source-backed-runtime-catalog.v1.json';

export function buildSourceBackedReleaseLedger(inputs = {}) {
  const runtime = buildSourceBackedRuntimeCatalog(inputs);
  return {
    ...runtime,
    scope: 'source-backed-release-ledger',
    release_ledger_version: RELEASE_LEDGER_VERSION,
    deprecated_alias: DEPRECATED_ALIAS,
  };
}

export function validateSourceBackedReleaseLedger(ledger, inputs = {}) {
  const errors = [];
  if (!ledger || typeof ledger !== 'object' || Array.isArray(ledger)) return ['release ledger must be an object'];
  if (ledger.scope !== 'source-backed-release-ledger') errors.push('release ledger scope is invalid');
  if (ledger.release_ledger_version !== RELEASE_LEDGER_VERSION) errors.push('release ledger version is invalid');
  if (ledger.deprecated_alias !== DEPRECATED_ALIAS) errors.push('release ledger deprecated_alias is invalid');
  const normalized = { ...ledger, scope: 'source-backed-runtime-catalog' };
  delete normalized.release_ledger_version;
  delete normalized.deprecated_alias;
  errors.push(...validateSourceBackedRuntimeCatalog(normalized, inputs));
  const expected = buildSourceBackedReleaseLedger(inputs);
  if (JSON.stringify(ledger) !== JSON.stringify(expected)) errors.push('release ledger does not match deterministic build');
  return [...new Set(errors)];
}

export const sourceBackedReleaseLedgerVersion = RELEASE_LEDGER_VERSION;

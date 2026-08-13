/**
 * Compatibility name for the 923-card source-state projection.
 * This is a research/release-readiness ledger, not the Planner runtime catalog.
 */
export {
  buildSourceBackedRuntimeCatalog as buildSourceBackedReleaseLedger,
  validateSourceBackedRuntimeCatalog as validateSourceBackedReleaseLedger,
  sourceBackedRuntimeCatalogVersion as sourceBackedReleaseLedgerVersion,
} from './source-backed-runtime-catalog.mjs';

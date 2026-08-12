# Task 3 report — catalog to collection mapping

## Result

- All 11 rice-meal catalog variants now declare `collection_candidate_id`.
- Added four non-regional `HOUSEHOLD` planned, household-reviewed candidates: 豆角排骨、香菇豆角排骨、白菜豆腐、西兰花牛肉焖饭.
- Each added candidate has a `catalog_tracking` row and reverse `runtime_mappings` entry. No status changed: 4 remain `runtime_ready`, 7 remain `planned`.
- Corrected two stale tracking material identities so their canonical sets match the catalog: red-date cowpea uses `fresh-cowpea-pod`; broccoli beef uses `beef-generic`.

## Cross-asset gate

- Catalog validation accepts the collection dependency and checks candidate existence, name identity overlap, exact canonical core-material set, reverse mapping, compatible tracking status, and rejection of C/excluded candidates.
- `preview_ready` variants additionally require A/B `runtime_ready` collection candidates.
- Collection validation enforces the reverse candidate ID and canonical core-material set against the catalog. `check-recipes` now supplies the collection to the catalog validator.

## TDD and verification

- RED observed before implementation: new catalog mapping tests failed for missing `collection_candidate_id` and unknown collection candidate; new collection reverse-mapping test also failed before its validator change.
- GREEN verification:
  - `node --test tools/tests/rice-meal-catalog-validator.test.mjs tools/tests/rice-meal-catalog-data.test.mjs tools/tests/rice-meal-collection-validator.test.mjs tools/tests/rice-meal-collection-data.test.mjs` — 69 passing
  - `node --test tools/tests/rice-meal-selector.test.mjs tools/tests/rice-meal-compiler.test.mjs` — 45 passing
  - `node tools/check-recipes.mjs` — passed

## Concerns

- No release/status/recipe-count promotion occurred. The collection now has 41 candidates; generated collection Markdown/CSV were refreshed.

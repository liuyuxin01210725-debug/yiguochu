# Task 2 report — rice meal collection review artifacts

## Delivered

- Added a deterministic renderer with `buildRiceMealCollectionArtifacts(collection)`, producing:
  - `docs/rice-meal-collection.md`: grouped by the declared regional nodes and family, retaining explicit blank-region reasons.
  - `docs/rice-meal-collection.csv`: one row per candidate with all review fields.
- Added `node tools/build-rice-meal-collection.mjs --write|--check`; it validates the fixed source inputs before rendering.
- Added fail-closed generated-artifact comparison to `node tools/check-recipes.mjs`.

## TDD evidence

1. Added `tools/tests/rice-meal-collection-renderer.test.mjs` before the renderer existed.
2. Observed RED: `ERR_MODULE_NOT_FOUND` for `tools/lib/rice-meal-collection-renderer.mjs`.
3. Implemented the smallest renderer/CLI and observed the test pass.

## Verification

- `node --test tools/tests/rice-meal-collection-renderer.test.mjs` — pass.
- `node tools/build-rice-meal-collection.mjs --write` followed by `--check` — pass; artifacts are idempotent.
- Stale probe: appended a temporary CSV line, then `node tools/check-recipes.mjs` failed with `docs/rice-meal-collection.csv is missing or stale`; regenerated immediately.
- `node tools/check-recipes.mjs` — pass after regeneration.
- `git diff --check` — pass.

## Self-review / concerns

- Renderer never changes runtime assets, deployment assets, or source data; it only reads the machine collection and writes review artifacts.
- Stable ordering intentionally follows the declared `region_nodes` order, then ASCII family and candidate IDs. This keeps output insensitive to candidate-array ordering while preserving the source's geographic review order.

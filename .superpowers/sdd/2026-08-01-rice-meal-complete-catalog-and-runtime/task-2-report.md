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

## Review fix round 1

- Moved the three project household-reviewed runtime candidates out of `CN-SH` into the single explicit `HOUSEHOLD` node, displayed as `家常标准（非地域）`. The validator still requires all 34 province-level IDs exactly once, additionally requires exactly this one non-geographic node, and preserves candidate/node bidirectional consistency.
- Corrected `buildRiceMealCollectionArtifacts()` to return the specified `Array<[path, content]>`; consumers retain ordinary pair iteration and tests explicitly check the contract before constructing a `Map` as a lookup convenience.
- Added a CSV escaping regression test with a comma, double quotes, and newline in a real rendered candidate field.

### Review-fix verification

- `node --test tools/tests/rice-meal-collection-data.test.mjs tools/tests/rice-meal-collection-validator.test.mjs tools/tests/rice-meal-collection-renderer.test.mjs` — 17/17 pass.
- `node tools/build-rice-meal-collection.mjs --write` then `--check` — pass.
- `node tools/check-recipes.mjs` — pass.

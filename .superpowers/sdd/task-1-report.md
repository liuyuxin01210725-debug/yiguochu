# Task 1 report: generalize draft mapping validation

## Changed files

- `tools/lib/recipe-draft-release-gate.mjs` — added `validateExpectedDraftMappings(library, candidateLedger, expectedMappings, rejectUnexpectedDrafts = false)` and retained `validateSixDraftReleaseGate()` as its compatibility wrapper. The generic validator detects missing expected drafts, incorrect candidate links, non-`candidate` linked entries, and optionally unexpected drafts.
- `tools/check-recipe-drafts.mjs` — replaced the exact-six count with the expansion guard allowing 6 through 30 drafts while leaving draft-only and production-boundary checks intact.
- `tools/tests/recipe-drafts.test.mjs` — added generic mapping coverage (including an independent wrong-link/non-candidate case) and retained the CLI regression that confirms the present six-draft library succeeds during expansion.

No recipe content, candidate data, production recipe data, runtime files, or files outside the task scope were changed.

## TDD evidence

### RED

After adding the requested generic-validator test, ran:

```text
node --test tools/tests/recipe-drafts.test.mjs
```

Observed the expected import failure because the new function did not yet exist:

```text
SyntaxError: The requested module '../lib/recipe-draft-release-gate.mjs' does not provide an export named 'validateExpectedDraftMappings'
```

Added a second boundary test covering a wrong mapping whose actual linked candidate is not `candidate`. Before removing the legacy early return, it failed as expected because the status error was missing.

### GREEN and verification

```text
node --test tools/tests/recipe-drafts.test.mjs
# 9 passed, 0 failed

node tools/check-recipe-drafts.mjs
# 传统一锅草案 6 道 · 生产可用 0 道
# ✅ 传统一锅草案体检通过

git diff --check
# passed
```

## Commit

- `3217158 refactor: generalize draft mapping validation`

## Self-review

- The six original mappings stay locked through the compatibility wrapper, but new drafts are no longer rejected merely for expanding the pool.
- The checker still requires draft status, preserves production family/recipe counts and approved-only production status, and prevents draft/production ID overlap.
- The generic function builds both required lookup maps and returns errors in stable expected-mapping order, followed by unexpected drafts in input order.
- The code changes only the three files listed above. Existing unrelated worktree edits were left untouched.

## Concerns

- The expansion guard permits the requested numeric range; future data-entry tasks must continue using the draft validator and the existing production-boundary checks before any promotion.

## Review fix: CLI growth-boundary regression

- `tools/check-recipe-drafts.mjs` now accepts `--draft-file`, `--candidate-file`, and `--production-file` inputs, retaining the production files as defaults. This allows the CLI to be exercised against isolated fixtures without mutating recipe data.
- `tools/tests/recipe-drafts.test.mjs` creates and removes a temporary fixture directory. It proves that a complete 7-draft input succeeds, while complete 5-draft and 31-draft inputs exit with the required `6 to 30` growth-guard error. All fixtures retain draft-only status, valid candidate links, and the production 9-family/12-approved-recipe boundary.

Verification after the fix:

```text
node --test tools/tests/recipe-drafts.test.mjs
# 10 passed, 0 failed

node tools/check-recipe-drafts.mjs
# 传统一锅草案 6 道 · 生产可用 0 道
# ✅ 传统一锅草案体检通过

git diff --check
# passed
```

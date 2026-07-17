# Traditional checker baseline fix report

## Scope

Updated only the independent traditional draft/candidate release checks and their focused tests after the production recipe library changed from 9 families / 12 recipes to 15 families / 42 recipes.

## Changes

- `tools/check-recipe-drafts.mjs` now explicitly requires 15 production families and 42 approved production recipes.
- `tools/lib/recipe-candidate-release-gate.mjs` now explicitly requires the same 15/42 production baseline.
- Focused tests now lock the 15/42 counts. Candidate coverage also confirms the 30 promoted recipes retain an explicit `origin_candidate_id` equal to their candidate id.

## Verification

- `node --test tools/tests/recipe-drafts.test.mjs tools/tests/recipe-candidates.test.mjs` — 22 passing, 0 failing.
- `node tools/check-recipe-drafts.mjs` — passed.
- `node tools/check-recipe-candidates.mjs` — passed.
- `git diff --check` — passed.

## Boundary

No user-owned dirty files were modified.

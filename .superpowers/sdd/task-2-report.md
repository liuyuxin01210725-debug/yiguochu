# Task 2 report — low-risk traditional draft expansion

## Scope completed

- Added exactly nine original, `status: "draft"` entries to `tools/data/recipe-drafts.json`:
  - `jinshan-clay-oven-vegetable-rice-draft`
  - `taiwan-cabbage-mushroom-rice-draft`
  - `fujian-gai-cai-minced-pork-rice-draft`
  - `fujian-hyacinth-bean-rice-draft`
  - `xinjiang-vegetable-pilaf-draft`
  - `shaanbei-red-date-cowpea-rice-draft`
  - `shanxi-potato-rice-draft`
  - `shanxi-nitun-millet-rice-draft`
  - `hainan-cai-bao-rice-draft`
- Updated the ledger count and isolation/checker assertions from 6 to 15 in `tools/tests/recipe-drafts.test.mjs`.

## TDD evidence

1. Added the 15-entry assertion before modifying the draft library.
2. Ran `node --test tools/tests/recipe-drafts.test.mjs`; it failed as required with `6 !== 15`.
3. Added the nine structured original trial drafts.
4. Re-ran the test suite and checker successfully.

## Safety and content review

Each added entry has all schema fields, a substitution slot, a ratio rule, high-level technique, structured gates, and concrete trial records. The required gates are explicit: late greens/no pooled liquid; cabbage moisture assessment; cooked pork and post-tasting salt; documented and fully cooked hyacinth beans; cooked chickpeas and vegetable-moisture measurement; fully cooked cowpeas and pitted dates; cooked potato plus scorch prevention; millet/liquid plus potato-doneness records; and verified food-grade edible leaves with a fully cooked filling.

The entries are project-authored trial frameworks. They contain no copied third-party recipe prose, exact public recipe quantities, or timings. No production recipe, runtime, nutrition, worker, proxy, deployment, candidate-ledger, or user-owned dirty file was modified.

## Validation

`node --test tools/tests/recipe-drafts.test.mjs && node tools/check-recipe-drafts.mjs`

Result: 11/11 tests passed; checker reported `传统一锅草案 15 道 · 生产可用 0 道` and passed.

## Remaining concerns

These remain draft-only trial frameworks and require real kitchen testing plus later human review before any promotion; this task did not change the production library.

## Review-fix evidence

- The checker now invokes `validateCurrentDraftReleaseGate`, which locks all 15 current draft ID to candidate ID mappings and requires every linked candidate to remain `status: "candidate"`.
- Regression coverage mutates the newly added `jinshan-clay-oven-vegetable-rice-draft`: both a remap to another valid candidate and a non-`candidate` linked status fail the gate.
- The ledger purpose now states that there are 15 current drafts, all remain draft-only, production-ready count is 0, and real kitchen trials are not complete.
- Re-ran `node --test tools/tests/recipe-drafts.test.mjs && node tools/check-recipe-drafts.mjs`: 11/11 tests passed; checker reported `传统一锅草案 15 道 · 生产可用 0 道` and passed.

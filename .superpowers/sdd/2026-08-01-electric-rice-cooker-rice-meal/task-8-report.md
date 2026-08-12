# Task 8 report — rice-meal Preview release gate

## Scope delivered

- Added `tools/check-rice-meal-preview.mjs` as the aggregate, executable release gate.
- Added `tools/tests/rice-meal-preview-gate.test.mjs` with fixture mutations and a real built-Worker audit.
- Integrated the gate into `tools/check-recipes.mjs`.
- Made `tools/build-dist.mjs` reject `rice-meal-v1` unless metadata is exactly `direct-recommend` + `deterministic`.
- Updated deployment, product-principle and regional-research documentation without modifying recipes, catalog entries, selector scoring, compiler behavior or frontend behavior.

## TDD evidence

### RED 1 — aggregate gate absent

Command:

```bash
node --test --test-concurrency=1 tools/tests/rice-meal-preview-gate.test.mjs
```

Observed: 1 failing test file with `ERR_MODULE_NOT_FOUND` for `tools/check-rice-meal-preview.mjs`. This failed for the intended reason: the planned release gate did not exist.

### GREEN 1

After the minimal gate implementation, the five initial behaviors passed: reviewed catalog facts, C/mechanical-name rejection, ratio/action/lid rejection, active-journey/compile coverage, and built runtime zero-model/zero-budget plus truthful health.

### RED 2 — rice build metadata could drift

Added a build-boundary test that runs the real build script with `productFocus=rice-meal-v1`, `plannerRollout=off`, and `generationMode=llm`.

Observed: 5 passed, 1 failed because the invalid combination still exited 0.

### GREEN 2

After the minimal parse-time guard, the same test file passed 6/6.

## Release facts proven

- catalog `rice-meal-catalog-v1-20260801-r2`;
- recipe library remains 72;
- 3 families / 10 variants / 5 `preview_ready` / 5 `planned`;
- active nutrition grades: A=4, B=1, C=0;
- 18 deterministic journeys;
- all 5 active variants have a first-candidate journey and a passing selector → signed token → recompute → compiler contract;
- fixed natural names, executable ratio references, complete actions and no mid-cycle opening are enforced through the catalog validator plus the aggregate gate;
- the built runtime reports exact metadata and catalog health;
- malformed or mismatched compiled metadata cannot report rice catalog `ok`;
- `/plan-meal` + `/generate-plan` make 0 model calls and 0 budget reads/writes in the built audit;
- catalog, selector, compiler, validator, ratio, taxonomy, recipe and nutrition assets are present and byte-current in the build graph;
- legacy selector/template-planner, noodles, leftover rice, porridge, soup-rice and multi-pot are explicitly excluded from this public product focus.

## Verification evidence

```text
rice-meal-preview-gate.test.mjs: 6/6 passed
check-rice-meal-preview.mjs: ok
check-recipes.mjs: ok
run-rice-meal-journeys.mjs: 18/18 selector passed; compiler 1/1 passed
build-dist.mjs rice-meal-gate: 36 files, exact rice metadata
build-dist.test.mjs + service-worker.test.mjs: 11/11 passed
git diff --check: clean
```

## Honest remaining product evidence gap

The gate proves the current approved contract; it does not prove taste or household usefulness. The three finish-fold variants (白菜豆腐、西兰花牛肉、青菜肉末) are rule-grounded Preview adaptations and have not been kitchen/taste tested.

One current journey is especially important for Task 9: RM-10 accepts 6 submitted ingredients with a best active candidate covering 2/6 and explicitly explains the four unused items. This is honest and satisfies the existing selector contract, but may still feel too weak to a real user. Task 8 did not alter scoring or catalog data; the browser product gate must treat this as a high-priority experience check rather than infer quality from a green automated status.

## Non-actions

- No recipe or catalog expansion.
- No selector/compiler/frontend product behavior change.
- No Preview or production deployment.

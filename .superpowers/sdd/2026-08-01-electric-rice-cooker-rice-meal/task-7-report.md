# Task 7 report — focus frontend on rice meals

## TDD red

Before changing production code, `tools/tests/frontend-rice-meal-flow.test.mjs` was added and the exact Task 7 suite was run:

```text
tests 141
pass 135
fail 6
```

All six new tests failed for the intended missing product behavior: `RICE_MEAL_PRODUCT`, `runRiceMealPlanning`, and `showRiceMealStatus` did not exist. The existing 135 frontend/product tests remained green.

## Implemented

- Added compiled `PRODUCT_FOCUS` frontend metadata with a raw-source, legacy-safe default.
- Added the dedicated rice-meal first screen: servings, side ingredients and dislikes only; rice is explicit as the default staple.
- Added the exact schema-v3 request shape used by Task 6 (`product_focus:"rice_meal"`, `servings`, `pantry`, `dislikes`, controlled `swap`).
- Added dedicated rice views for candidates, result, balance help, no reliable result, no alternative, unsafe and stale states.
- Candidate cards render server-fixed names, exact used/total coverage, concrete unused reasons, A/B roles, preparation and total time, with 1–3 cards and no padding.
- Candidate display makes one `/plan-meal` request; only a user-selected signed `plan_token` is sent to `/generate-plan`.
- Result validation binds plan, variant, recipe and fixed dish name to the selected candidate before rendering quantities, steps, safety copy, source link and nutrition attribution.
- Swap re-runs the planner. No alternative retains the current compiled dish. Compile failure retains the selected candidate and offers a manual retry.
- `file://` remains offline with the `start.command` instruction; localhost calls only `localhost:8765`.
- Legacy UI and request behavior remain behind the compile-time product branch.

## Green verification

```text
node --test tools/tests/frontend-rice-meal-flow.test.mjs \
  tools/tests/frontend-planner-v2-flow.test.mjs \
  tools/tests/frontend-recipe-contract.test.mjs \
  tools/tests/core-product-convergence.test.mjs

tests 141
pass 141
fail 0
```

```text
node --test --test-concurrency=1 tools/tests/build-dist.test.mjs

tests 8
pass 8
fail 0
```

`git diff --check` also passed.

## Remaining boundaries

- No Worker, proxy, catalog, recipe, selector, compiler, deployment or production files were changed by Task 7.
- The catalog currently controls the number and diversity of reliable candidate cards; the frontend does not fabricate extra cards or names.
- Real Chrome/mobile user journeys and Preview deployment remain Tasks 9–10.

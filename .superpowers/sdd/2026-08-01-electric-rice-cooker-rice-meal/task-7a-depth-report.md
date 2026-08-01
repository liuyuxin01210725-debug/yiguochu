# Task 7A report — raise the real rice-meal catalog floor from 2 to 5

## TDD red

The acceptance tests were written before the catalog, validator, selector, compiler, journey, or frontend changes. The focused command was:

```text
node --test --test-concurrency=1 \
  tools/tests/rice-meal-catalog-validator.test.mjs \
  tools/tests/rice-meal-catalog-data.test.mjs \
  tools/tests/rice-meal-catalog-boundary.test.mjs \
  tools/tests/rice-meal-selector.test.mjs \
  tools/tests/rice-meal-compiler.test.mjs \
  tools/tests/frontend-rice-meal-flow.test.mjs
```

Initial result:

```text
tests 89
pass 75
fail 14
```

The 14 failures were the intended missing behavior: the catalog still exposed only 7 variants / 2 preview-ready variants, the three exact executable ratios and controlled process protocols did not exist, arbitrary mid-cook evidence remained blocked with no narrow override, tofu was not accepted as a protein contributor, the new safety endpoints were absent, selector/compiler/journeys did not cover the three dishes, and the five new frontend chips were missing.

## Implemented

- Added exactly three `preview_ready` catalog variants from the existing 72-recipe evidence library:
  - `白菜豆腐焖饭`: per 100 g raw rice, 130 g water, 60 g firm tofu, 50 g cabbage.
  - `西兰花牛肉焖饭`: per 100 g raw rice, 135 g water, 35 g beef, 45 g broccoli.
  - `青菜肉末焖饭`: per 100 g raw rice, 135 g water, 45 g ground pork, 40 g leafy greens.
- Added recipe-bound executable Ratio DSL rules with one exact liquid operation and fixed amounts for every material.
- Added a deliberately narrow process-adaptation validator. Only the three named evidence recipes may use it, and only when one matching tender-vegetable set is cooked outside the cooker, excluded from `load_inner_pot`, held, covered by a safety endpoint, and folded in after one uninterrupted `standard_rice` cycle.
- Restricted finish-only ingredients to the controlled tender-vegetable categories `leafy_vegetable` and `cruciferous_vegetable`. Raw rice and other non-tender materials are rejected even if action names appear structurally correct; raw animal protein, egg, and seafood remain explicitly forbidden.
- Preserved the block on every arbitrary legacy mid-cook-opening recipe. The legacy evidence rows remain excluded; only separately validated catalog adaptations can remove the derived mid-open flag.
- Added deterministic household copy for all three dishes without loosening the generated-plan contract.
- Preserved exact candidate/result identity across compilation and signed-token server recomputation. The only new generic-slot compilation allowance is the existing taxonomy-approved `beef-tenderloin` → `beef-generic` relationship; it cannot authorize brisket, ground beef, or another substitution.
- Added the five active quick chips: `豆腐`, `牛肉`, `西兰花`, `猪肉末`, `青菜`.
- Expanded the hand-authored journey corpus to 18 and made all five active variants execute at least once without DeepSeek.
- Rebuilt planner menu coverage through `node tools/build-planner-menu-coverage.mjs --write` rather than editing generated assets by hand.

Catalog result: **3 families / 10 variants / 5 preview-ready / 5 planned**, with **4 nutrition grade A / 1 grade B** among the preview-ready set. The recipe evidence library remains **72**.

## Green verification

Focused suite:

```text
tests 95
pass 95
fail 0
```

Aggregate recipe gate:

```text
72 recipes
3 families · 10 variants · 5 preview_ready · 5 planned
recipe library, taxonomy, Ratio DSL, runtime, nutrition identity,
regional research, and generated planner coverage gates passed
```

Rice-meal journey gate:

```text
total=18
selector_passed=18
selector_failed=0
compiler_passed=1
compiler_failed=0
```

Worker/build integration:

```text
tests 16
pass 16
fail 0
```

The official builder also succeeded with 36 files:

```text
node tools/build-dist.mjs \
  --out-dir dist/task-7a-verify \
  --build-id rice-meal-depth-test \
  --planner-rollout direct-recommend \
  --generation-mode deterministic \
  --product-focus rice-meal-v1
```

`python3 -m py_compile ai_proxy.py` and `git diff --check` passed.

## Explicit no-kitchen-test boundary

These three variants are **rule-grounded Preview process adaptations**, not completed kitchen taste tests. Their rice, water, and material quantities are exact transcriptions of existing recipe evidence; the changed handling of tender vegetables is machine-validated to preserve a closed cooker cycle. Nothing in this task claims that texture, flavor, or household acceptability has been verified in a real kitchen. Promotion beyond Preview still requires the product's separate human cooking and review evidence.

No recipe was added or edited. No deployment, production change, account, tracking, mode, template, or unrelated product work was performed.

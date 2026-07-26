# Jiangnan M1 Identity and Conditional Ratio Capability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Make six existing Jiangnan rice menus safely plannable through Pantry Planner V2 by adding controlled regional ingredient identities and machine-executable conditional oil/salt rules, while preserving two unresolved menus as explicit gaps.

**Architecture:** The shared taxonomy remains the only pantry identity source for Worker, local proxy bridge, and frontend plan responses. Existing savory-mixed-rice-pot remains the composable capability; no menu-specific template is added. Ratio DSL gains one finite skip_when guard for basic additions so cured, fat-rendering proteins omit automatic oil and salt before the locked plan reaches DeepSeek.

**Tech Stack:** Node.js ESM, JSON catalogs, built-in node:test, existing Planner V2 pure functions, Python local proxy bridge, deterministic coverage report builder.

## Global Constraints

- Keep the recipe library at exactly 72 recipes: 12 approved and 60 auto_approved.
- Add no recipe and no template; keep 10 active and 6 planned templates.
- Restore exactly the six M1 menu cores named in the approved spec; keep cooked duck and glutinous black rice unresolved.
- Template rules + ingredient taxonomy decide compatibility; recipe is evidence only.
- Preserve raw and display_name; canonical equivalence must not erase regional names or cured-meat form.
- DeepSeek must not decide template, slots, ingredients, required extras, ratios, or safety rules.
- Every behavior change follows RED -> GREEN TDD and receives a focused commit.
- Rebuild coverage artifacts deterministically and keep them outside dist.
- Keep Draft PR #1 Draft/Open; do not deploy Preview or production and do not merge.

---

## File Structure

- Modify tools/data/ingredient-taxonomy.v1.json: add five controlled pantry identities and bump taxonomy version.
- Modify worker/src/ingredient-taxonomy-validator.js: lock the new taxonomy version.
- Modify tools/data/meal-templates.v2.json and worker/src/meal-template-validator.js: bind the new taxonomy and bump only catalog metadata.
- Modify worker/src/planner-v2.js: carry taxonomy failure modes into Ratio DSL context and interpret guarded basic additions.
- Modify worker/src/ratio-dsl.js: validate the finite skip_when grammar and bump ratio catalog lock.
- Modify tools/data/ratio-rules.v1.json: guard oil and salt in savory-mixed-rice-liquid-v1.
- Modify tools/tests/ingredient-taxonomy.test.mjs and tools/tests/ratio-dsl.test.mjs: unit contract.
- Modify tools/data/pantry-planner-v2-journeys.json and its runner tests: real journeys.
- Modify tools/tests/planner-v2-parity.test.mjs and tools/tests/worker-generate-plan.test.mjs: runtime and generation boundary.
- Regenerate tools/generated/planner-menu-coverage.v1.json and docs/planner-menu-coverage.md.
- Modify live version assertions and deployment documentation; do not rewrite historical specifications.

## Shared Interfaces

RatioSkipWhen has exactly four keys:

    {
      slot_id: string,
      attribute: 'texture_behavior' | 'texture_failure_modes',
      match: 'equals' | 'contains',
      value: string
    }

Only fixed_addition and scale_by_servings may contain skip_when.

The compiler trace for basic additions is additive:

    {
      operator: 'fixed_addition' | 'scale_by_servings',
      name: string,
      applied: boolean,
      grams?: number,
      skip_reason?: {
        slot_id: string,
        attribute: string,
        matched_items: string[]
      }
    }

The compileRatioPlan return envelope otherwise remains unchanged.

---

### Task 1: Regional ingredient identities and catalog version lock

**Files:**
- Modify: tools/tests/ingredient-taxonomy.test.mjs
- Modify: tools/data/ingredient-taxonomy.v1.json
- Modify: worker/src/ingredient-taxonomy-validator.js
- Modify: tools/data/meal-templates.v2.json
- Modify: worker/src/meal-template-validator.js
- Modify: tools/tests/meal-template-catalog.test.mjs

**Interfaces:**
- Consumes: normalizePlannerItems(rawItems, taxonomy) and canonical_name validation.
- Produces: taxonomy-v1-20260727-r3 and templates-v2-20260727-r4.

- [ ] **Step 1: Write failing identity tests**

Add one table-driven test whose expected rows are:

    [
      ['小白菜','青菜','小白菜','leafy_vegetable','whole','none'],
      ['矮脚黄','青菜','矮脚黄','leafy_vegetable','whole','none'],
      ['咸五花肉','咸肉','咸五花肉','pork','cured_slice','raw_pork'],
      ['腊五花肉','咸肉','腊五花肉','pork','cured_slice','raw_pork'],
      ['平菇','平菇','平菇','mushroom','whole','none']
    ]

Compare each tuple to raw, canonical, display_name, category, shape_or_cut and cooking_risk from normalizePlannerItems. Assert both cured meats include cured_pork and that 包装熟制板鸭（去骨）, 糯米 and 食品级黑米色粉 remain recognized:false.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

    node --test tools/tests/ingredient-taxonomy.test.mjs tools/tests/meal-template-catalog.test.mjs

Expected: FAIL because the five identities and new versions do not exist.

- [ ] **Step 3: Add five exact taxonomy records**

Add small-bok-choy and aijiaohuang-greens as raw, fast, high-moisture leafy vegetables canonicalized to 青菜 but with their own display names.

Add salted-pork-belly and waxed-pork-belly as cured_slice pork canonicalized to 咸肉 with renders_fat_when_heated, salty_when_overseasoned, raw_pork, pork_fully_cooked, protein/cured_pork compatibility and quick_cook_protein incompatibility.

Add oyster-mushroom as a separate raw mushroom identity with display/canonical 平菇, fast cooking, high moisture and watery_when_overloaded. Do not alias it to 香菇.

- [ ] **Step 4: Bump coordinated versions only**

Set:

    taxonomy_version = taxonomy-v1-20260727-r3
    template_catalog_version = templates-v2-20260727-r4
    ingredient_taxonomy_version = taxonomy-v1-20260727-r3

Update validator constants and focused test expectations. Do not change template count, activation, slots, evidence IDs, or ratio references.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

    node --test tools/tests/ingredient-taxonomy.test.mjs tools/tests/meal-template-catalog.test.mjs

Expected: PASS with 10 active and 6 planned templates unchanged.

- [ ] **Step 6: Commit Task 1**

Stage the six files above and commit:

    feat: add controlled Jiangnan ingredient identities

---

### Task 2: Machine-validated conditional oil and salt rules

**Files:**
- Modify: tools/tests/ratio-dsl.test.mjs
- Modify: worker/src/ratio-dsl.js
- Modify: worker/src/planner-v2.js
- Modify: tools/data/ratio-rules.v1.json

**Interfaces:**
- Consumes: Task 1 taxonomy and current compileRatioPlan context.
- Produces: ratio-rules-v1-20260727-r3, skip_when validation, guarded compilation and trace facts.

- [ ] **Step 1: Write failing compiler tests**

For 大米 + 咸五花肉 + 小白菜 at servings 2, pass texture_behavior=renders_fat_when_heated and texture_failure_modes=[salty_when_overseasoned]. Assert the result is ok, required_extra_items contains 水 but contains neither 食用油 nor 盐, and both trace rows have applied:false with matched_items=['咸五花肉'].

For 大米 + 鸡腿肉, assert oil and salt remain present and both trace rows have applied:true.

Repeat the cured context twice and assert deep equality.

- [ ] **Step 2: Write failing validator tests**

Mutate a valid guard four times and assert errors for:
- missing_slot
- attribute=states
- match=regex
- value=invented_value

Also attach skip_when to per_serving, ratio and bounded_sum operations and assert each is rejected as an unknown key.

- [ ] **Step 3: Run ratio tests and verify RED**

Run:

    node --test tools/tests/ratio-dsl.test.mjs

Expected: FAIL because guard validation and trace semantics do not exist.

- [ ] **Step 4: Implement finite guard validation**

In worker/src/ratio-dsl.js:
- allow skip_when only for fixed_addition and scale_by_servings;
- require exactly slot_id, attribute, match, value;
- require a declared user slot;
- allow texture_behavior only with equals and controlled behavior values;
- allow texture_failure_modes only with contains and controlled failure-mode values;
- preserve total validation: malformed nested values return errors, never throw.

- [ ] **Step 5: Carry controlled attributes into compilation**

In normalizePlannerItems return a detached texture_failure_modes array from item.texture_behavior.failure_mode_codes.

In ratioContextFor include that array under attributes.

Add matchSkipWhen(skipWhen, slots). Scalar equals compares texture_behavior; array contains checks texture_failure_modes. Any matching item in the named slot skips the operation.

For skipped additions, add no amount and append applied:false plus skip_reason. For applied additions, preserve current grams and append applied:true.

- [ ] **Step 6: Guard only the existing savory rice oil and salt**

Bump ratio_catalog_version to ratio-rules-v1-20260727-r3.

Oil guard:
- slot protein
- texture_behavior equals renders_fat_when_heated

Salt guard:
- slot protein
- texture_failure_modes contains salty_when_overseasoned

Do not change food grams, water ratio, moisture credit, rounding, or evidence IDs.

- [ ] **Step 7: Run focused tests and verify GREEN**

Run:

    node --test tools/tests/ratio-dsl.test.mjs tools/tests/ingredient-taxonomy.test.mjs

Expected: PASS; fresh protein behavior remains unchanged.

- [ ] **Step 8: Commit Task 2**

Commit:

    feat: condition Jiangnan rice oil and salt rules

---

### Task 3: Planner journeys and protected unresolved boundaries

**Files:**
- Modify: tools/tests/pantry-planner-v2-selection.test.mjs
- Modify: tools/data/pantry-planner-v2-journeys.json
- Modify: tools/tests/pantry-planner-v2-journeys.test.mjs

**Interfaces:**
- Consumes: Tasks 1 and 2.
- Produces: five direct combination assertions and eight named journey records.

- [ ] **Step 1: Write failing direct Planner tests**

For each must_use set below, assert status complete, plan_kind single_pot, template savory-mixed-rice-pot, full planned_must_use and empty unplanned_must_use:

    ['大米','咸五花肉','小白菜']
    ['大米','腊五花肉','矮脚黄']
    ['大米','广式腊肠','矮脚黄']
    ['大米','小白菜']
    ['大米','平菇']

For these sets assert status is not complete, generation_allowed is false and the unresolved raw item remains in unplanned_must_use:

    ['大米','包装熟制板鸭（去骨）','矮脚黄']
    ['糯米','食品级黑米色粉']

Add a high-moisture boundary using 大米 + 咸五花肉 + 小白菜 + 平菇; assert it does not fabricate single-pot complete coverage.

- [ ] **Step 2: Run selection tests and verify RED**

Run:

    node --test tools/tests/pantry-planner-v2-selection.test.mjs

Expected before implementation: FAIL. If Tasks 1-2 make the new assertion pass immediately, temporarily mutate one fixture identity to prove the assertion is live, observe RED, restore, then continue.

- [ ] **Step 3: Add eight named journey corpus cases**

Use existing schema and these IDs:

    jiangnan-shanghai-salted-pork-greens-complete
    jiangnan-suzhou-salted-pork-greens-complete
    jiangnan-nanjing-cured-pork-greens-complete
    jiangnan-nanjing-sausage-greens-complete
    jiangnan-jinshan-greens-complete
    jiangnan-oyster-mushroom-rice-complete
    jiangnan-cooked-duck-remains-unplanned
    jiangnan-glutinous-black-rice-remains-unplanned

Pin complete/single_pot/full coverage for six, and non-complete/generation_allowed:false/exact unplanned raw items for two.

- [ ] **Step 4: Run journey tests and verify GREEN**

Run:

    node tools/run-pantry-planner-v2-journeys.mjs
    node --test tools/tests/pantry-planner-v2-journeys.test.mjs tools/tests/pantry-planner-v2-selection.test.mjs

Expected: all old and eight new journeys PASS. Use the command's actual total in later documentation.

- [ ] **Step 5: Commit Task 3**

Commit:

    test: cover Jiangnan pantry planner journeys

---

### Task 4: Local parity and locked generation boundary

**Files:**
- Modify: tools/tests/planner-v2-parity.test.mjs
- Modify: tools/tests/worker-generate-plan.test.mjs
- Modify only if a failing test proves necessary: worker/src/worker.js

**Interfaces:**
- Consumes: shared built planner assets.
- Produces: proof that Worker, Python bridge and locked DeepSeek input use identical facts.

- [ ] **Step 1: Add cross-runtime parity request**

Add 大米 + 咸五花肉 + 小白菜 to direct Worker, Python --plan-meal and local HTTP parity. Pin:
- status complete
- empty unplanned_must_use
- required extra names exactly [水]
- preserved raw ingredient names

- [ ] **Step 2: Run parity test**

Run:

    node --test tools/tests/planner-v2-parity.test.mjs

A pass after Tasks 1-2 is valid because all runtimes already use the same JS bridge. Do not duplicate identity tables into ai_proxy.py or index.html.

- [ ] **Step 3: Add locked generation test**

Build the locked plan for 大米 + 咸五花肉 + 小白菜. Assert locked_ingredients contains 水 but not 食用油 or 盐. Validate a permitted model output successfully.

Then mutate one controlled model field to introduce a new oil/salt literal and assert validateGeneratedPlan rejects it. Do not relax the finite phrase contract.

- [ ] **Step 4: Run parity, generation and Python syntax checks**

Run:

    node --test tools/tests/planner-v2-parity.test.mjs tools/tests/worker-generate-plan.test.mjs
    python3 -m py_compile ai_proxy.py

Expected: PASS without editing ai_proxy.py.

- [ ] **Step 5: Commit Task 4**

Commit:

    test: lock Jiangnan planner parity and generation

---

### Task 5: Rebuild and gate regional coverage facts

**Files:**
- Modify: tools/tests/planner-menu-coverage-builder.test.mjs
- Regenerate: tools/generated/planner-menu-coverage.v1.json
- Regenerate: docs/planner-menu-coverage.md

**Interfaces:**
- Consumes: Tasks 1-4.
- Produces: deterministic proof of six recoveries and two retained gaps.

- [ ] **Step 1: Write exact audit assertions**

Pin these status pairs:

    shanghai-salted-pork-vegetable-rice -> full_single_pot_evidence_aligned
    nanjing-sausage-greens-rice -> full_single_pot_evidence_aligned
    suzhou-salted-pork-vegetable-rice -> full_single_pot_ingredient_compatible
    nanjing-cured-pork-greens-rice -> full_single_pot_ingredient_compatible
    jinshan-clay-oven-vegetable-rice -> full_single_pot_ingredient_compatible
    banshan-wild-rice -> full_single_pot_ingredient_compatible

For all six assert unclassified_core_items=[] and end_to_end_core_coverage_ratio=1.

Assert nanjing-duck-greens-rice remains taxonomy_gap and she-people-black-rice retains unclassified items and a non-full status.

- [ ] **Step 2: Run audit tests and verify stale-artifact RED**

Run:

    node --test tools/tests/planner-menu-coverage-builder.test.mjs tools/tests/planner-menu-coverage-artifacts.test.mjs

Expected: artifact freshness FAIL until regeneration.

- [ ] **Step 3: Regenerate through the canonical builder**

Run:

    node tools/build-planner-menu-coverage.mjs --write
    node tools/build-planner-menu-coverage.mjs --check

Inspect the Jiangnan section. It must not say that 8/8 traditional dishes were reproduced.

- [ ] **Step 4: Run focused audit tests and verify GREEN**

Run the two audit tests again. Expected: PASS and byte-stable artifacts.

- [ ] **Step 5: Commit Task 5**

Commit:

    docs: record Jiangnan planner capability recovery

---

### Task 6: Live version facts, aggregate gates and Draft PR update

**Files:**
- Modify exact live-version assertions in tools/tests/worker-planner-v2.test.mjs, tools/tests/recipe-library.test.mjs and any current health tests.
- Modify 部署说明.md and CLAUDE.md.
- Test tools/tests/build-dist.test.mjs and all tools/tests/*.test.mjs.

**Interfaces:**
- Consumes: final versions and artifacts.
- Produces: a verified, pushed Draft PR branch with no deployment.

- [ ] **Step 1: Update current live facts only**

Replace current version facts:

    taxonomy-v1-20260727-r2 -> taxonomy-v1-20260727-r3
    templates-v2-20260727-r3 -> templates-v2-20260727-r4
    ratio-rules-v1-20260727-r2 -> ratio-rules-v1-20260727-r3

Do not rewrite historical specs/plans that correctly record older milestones.

- [ ] **Step 2: Run targeted version and build-asset tests**

Run:

    node --test tools/tests/recipe-library.test.mjs tools/tests/worker-planner-v2.test.mjs tools/tests/build-dist.test.mjs

Expected: health reports new versions, 72 recipes, 10 active and 6 planned templates.

- [ ] **Step 3: Run all Node tests**

Run:

    node --test --test-reporter=dot tools/tests/*.test.mjs

Expected: exit 0 with no skipped M1 tests.

- [ ] **Step 4: Run project gates**

Run:

    node tools/check-recipes.mjs
    node tools/run-pantry-planner-v2-journeys.mjs
    python3 -m py_compile ai_proxy.py
    node tools/build-planner-menu-coverage.mjs --check

Expected: all exit 0; recipe count remains 72.

- [ ] **Step 5: Verify canonical build**

Run:

    tmpdir="$(mktemp -d)"
    node tools/build-dist.mjs --out-dir "$tmpdir" --build-id "jiangnan-m1-check"
    node --test tools/tests/build-dist.test.mjs
    rm -rf "$tmpdir"

Expected: canonical planner assets are byte-identical to sources and audit artifacts remain excluded.

- [ ] **Step 6: Inspect scope and commit**

Run git diff --check, git status --short and git diff --stat. Confirm no recipe record, deployment state or unrelated feature changed. Commit live version/docs changes as:

    docs: align Jiangnan planner asset versions

- [ ] **Step 7: Update Draft PR only**

Push codex/targeted-recipe-expansion, verify PR #1 remains isDraft:true and state:OPEN, and do not run Wrangler or merge commands.

---

## Self-Review Record

- Spec coverage: six recovered recipes, two retained gaps, five identities, raw/display preservation, conditional oil/salt, evidence labels, DeepSeek boundary, versions, journeys, coverage artifacts, build and Draft-only rules map to Tasks 1-6.
- Placeholder scan: no TBD, TODO, “similar to”, or open-ended implementation step remains.
- Type consistency: skip_when, slot_id, attribute, match, value, texture_failure_modes, applied and skip_reason use one spelling throughout.
- Scope check: identity and Ratio DSL belong in one capability slice because either alone would be unsafe or ineffective.


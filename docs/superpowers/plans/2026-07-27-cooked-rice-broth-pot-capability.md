# Cooked Rice Broth Pot Capability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate a deterministic cooked-rice-only broth pot that accurately covers egg or chicken, root vegetables and leafy vegetables without adding recipes or delegating ingredient, ratio, order or safety decisions to DeepSeek.

**Architecture:** Extend the finite Ratio DSL with category-specific per-serving amounts and template cooking phases with one exact `{slot_id, category}` condition. Activate the existing `broth-rice-pot`, route it through Planner V2 and the locked generation contract, then promote only the corresponding regional capability record.

**Tech Stack:** Node.js ESM, `node:test`, JSON machine catalogs, Cloudflare Worker modules, Python local proxy, deterministic build scripts.

## Global Constraints

- Do not add or modify recipes; `recipe-library.json` remains 72 recipes.
- `broth-rice-pot` accepts `cooked_rice` only and never `raw_rice`.
- DeepSeek cannot choose or change template, slots, ingredients, quantities, order, basic extras or safety endpoints.
- `/plan-meal` makes zero DeepSeek calls; `/generate-plan` makes at most one and never retries automatically.
- Keep PR #1 Draft; do not deploy Preview or production and do not merge.
- Do not add accounts, profiles, nutrition tracking, runtime multi-agent behavior or front-end features.
- Write each failing test first and verify the expected failure before implementation.
- Raw regional research remains excluded from `dist/`.

---

### Task 1: Add category-specific Ratio DSL quantities

**Files:**
- Modify: `tools/tests/ratio-dsl.test.mjs`
- Modify: `worker/src/ratio-dsl.js`
- Modify: `worker/src/planner-v2.js`

**Interfaces:**
- Consumes: `prepareRatioCatalog(catalog, context)` and `compileRatioPlan(ruleId, context, catalog)`.
- Produces: `per_serving_by_category` with exact `grams_by_category` and category-bearing `ratio_trace`.

- [ ] **Step 1: Write the failing validator/compiler test**

Use a clone of `broth-noodle-liquid-v1` so no production template is activated yet:

```js
test('per_serving_by_category validates exact categories and compiles the locked category', () => {
  const next = structuredClone(rawCatalog);
  const rule = next.rules.find(row => row.rule_id === 'broth-noodle-liquid-v1');
  const protein = rule.operations.find(row => row.target?.slot_id === 'protein');
  protein.operator = 'per_serving_by_category';
  protein.grams_by_category = {
    egg:{min:65,default:65,max:65}, soft_tofu:{min:90,default:90,max:90},
    firm_tofu:{min:90,default:90,max:90}, chicken:{min:90,default:90,max:90},
  };
  delete protein.grams;
  const preparedNext = prepareRatioCatalog(next, validationContext);
  assert.equal(preparedNext.ok, true, preparedNext.errors.join('\n'));
  const result = compileRatioPlan('broth-noodle-liquid-v1', {
    servings:2,
    slots:{staple:[item('面条','noodle')],protein:[item('鸡腿肉','chicken')]},
  }, preparedNext.catalog);
  assert.ok(result.ingredient_amounts.some(row => row.name === '鸡腿肉' && row.grams === 180));
  assert.ok(result.ratio_trace.some(row => row.operator === 'per_serving_by_category'
    && row.category === 'chicken' && row.grams_per_serving === 90));
});
```

Add mutations that remove `egg`, add `beef`, use a negative bound, add an unknown nested key and point at an undeclared slot. Each must return a validator error without throwing.

- [ ] **Step 2: Verify RED**

Run: `node --test tools/tests/ratio-dsl.test.mjs`

Expected: FAIL because the operator is unknown.

- [ ] **Step 3: Implement strict validation**

In `worker/src/ratio-dsl.js`, add the operator to `OPS`. Accept only `operator`, `target`, and `grams_by_category`; call `targetSlot`; require keys to equal the target slot's accepted categories; call `bounds` for every category. Change the one-quantity-per-user-slot invariant to count `per_serving` plus `per_serving_by_category` and require exactly one.

- [ ] **Step 4: Implement deterministic compilation**

In `compileRatioPlan`, before the `per_serving` branch:

```js
if (operator === 'per_serving_by_category') {
  const items = slots.get(operation.target?.slot_id);
  if (!items?.length && optionalSlotIds.has(operation.target?.slot_id)) continue;
  if (!items?.length) return ratioFailure('ratio_context_missing', '缺少按类别计算的食材槽位。');
  for (const item of items) {
    const grams = operation.grams_by_category?.[item.category]?.default;
    if (!finiteNonNegativeNumber(grams) || grams <= 0
      || !addAmount(item.name, grams * context.servings)) {
      return ratioFailure('ratio_rule_invalid', '按类别份量规则无效。');
    }
    trace.push({operator,slot_id:operation.target.slot_id,category:item.category,grams_per_serving:grams});
  }
  continue;
}
```

- [ ] **Step 5: Verify GREEN and commit**

```bash
node --test tools/tests/ratio-dsl.test.mjs
git add worker/src/ratio-dsl.js worker/src/planner-v2.js tools/tests/ratio-dsl.test.mjs
git commit -m "feat: add category-specific ratio quantities"
```

### Task 2: Add exact conditional cooking phases

**Files:**
- Modify: `tools/tests/meal-template-catalog.test.mjs`
- Modify: `tools/tests/pantry-planner-v2-contract.test.mjs`
- Modify: `worker/src/meal-template-validator.js`
- Modify: `worker/src/generated-plan-contract.js`

**Interfaces:**
- Consumes: `cooking_order[]`.
- Produces: optional `when:{slot_id,category}`; only matching phases reach the locked generation contract.

- [ ] **Step 1: Write failing schema and behavior tests**

```js
test('cooking phase accepts only an exact declared slot/category condition', () => {
  const valid = structuredClone(catalog);
  valid.templates.find(row => row.template_id === 'broth-noodle-pot')
    .cooking_order[1].when = {slot_id:'protein',category:'egg'};
  assert.deepEqual(validateMealTemplateCatalog(valid, taxonomy, recipeLibrary), []);
  const invalid = structuredClone(valid);
  invalid.templates.find(row => row.template_id === 'broth-noodle-pot')
    .cooking_order[1].when = {slot_id:'staple',category:'egg',expression:'true'};
  assert.ok(validateMealTemplateCatalog(invalid, taxonomy, recipeLibrary).length > 0);
});
```

In the contract test, construct egg and chicken pots. Egg must retain `gentle_set_protein` and drop `cook_poultry_through`; chicken must do the inverse. Every locked user ingredient ref must appear in at least one retained phase.

- [ ] **Step 2: Verify RED**

Run: `node --test tools/tests/meal-template-catalog.test.mjs tools/tests/pantry-planner-v2-contract.test.mjs`

Expected: FAIL because `when` is unknown and no phase filter exists.

- [ ] **Step 3: Implement the finite schema**

In `meal-template-validator.js`:

```js
const COOKING_ORDER_KEYS = new Set(['phase','action_code','slot_ids','when']);
const COOKING_ORDER_WHEN_KEYS = new Set(['slot_id','category']);
```

Require exact keys, a declared slot, a category accepted by that slot, and `when.slot_id` in the same phase's `slot_ids`. Reject arrays, expressions, scripts and natural-language conditions.

- [ ] **Step 4: Filter phases before contract creation**

In `generated-plan-contract.js`:

```js
function cookingPhaseMatches(phase, slotAssignment) {
  if (!phase.when) return true;
  return (slotAssignment?.[phase.when.slot_id] || [])
    .some(item => item.category === phase.when.category);
}
```

Filter before mapping. Throw `locked_cooking_order_ingredient_missing:<ref>` if filtering leaves a locked user ingredient in no phase. Add finite `add_broth_protein` phrases; choose the chicken or egg phrases only from locked categories.

- [ ] **Step 5: Verify GREEN and commit**

```bash
node --test tools/tests/meal-template-catalog.test.mjs tools/tests/pantry-planner-v2-contract.test.mjs
git add worker/src/meal-template-validator.js worker/src/generated-plan-contract.js tools/tests/meal-template-catalog.test.mjs tools/tests/pantry-planner-v2-contract.test.mjs
git commit -m "feat: support conditional cooking phases"
```

### Task 3: Activate the machine catalogs

**Files:**
- Modify: `tools/data/meal-templates.v2.json`
- Modify: `tools/data/ratio-rules.v1.json`
- Modify: `worker/src/meal-template-validator.js`
- Modify: `worker/src/ratio-dsl.js`
- Modify: `tools/tests/meal-template-catalog.test.mjs`
- Modify: `tools/tests/ratio-dsl.test.mjs`

**Interfaces:**
- Produces: active `broth-rice-pot`, `broth-rice-liquid-v1`, template version `templates-v2-20260727-r3`, ratio version `ratio-rules-v1-20260727-r2`.

- [ ] **Step 1: Write failing catalog tests**

Move `broth-rice-pot` from expected PLANNED to ACTIVE and assert: cooked rice is the only staple category, minimum two user items, protein categories are exactly egg/chicken, root and leafy slots are separate, conditional phases exist, all four safety categories exist, and recipe evidence IDs are unchanged.

Add an exact compile assertion for two servings:

```js
assert.deepEqual(new Map(result.ingredient_amounts.map(row => [row.name,row.grams])),
  new Map([['熟米饭',360],['鸡蛋',130],['白菜',220],['水',650]]));
```

- [ ] **Step 2: Verify RED**

Run: `node --test tools/tests/meal-template-catalog.test.mjs tools/tests/ratio-dsl.test.mjs`

Expected: FAIL because the template is planned and the ratio rule is absent.

- [ ] **Step 3: Update catalogs atomically**

Use the approved slots, 20–40 minute range, `normal/fresh/batch`, conditional egg/chicken order, and these exact defaults:

```json
{"staple":180,"egg":65,"chicken":90,"root_vegetable":80,"leafy_vegetable":110,"water_ratio":1.8,"rounding":5}
```

All bounds equal their default in this first evidence-locked version. Evidence is exactly `cabbage-egg-soup-rice` and `tomato-chicken-leg-soup-rice`.

- [ ] **Step 4: Update strict versions and catalog active allowlists**

Move `broth-rice-pot` to active in `meal-template-validator.js` and `ratio-dsl.js`; update exact catalog version assertions. Do not add it to Planner runtime yet.

- [ ] **Step 5: Verify GREEN and commit**

```bash
node --test tools/tests/meal-template-catalog.test.mjs tools/tests/ratio-dsl.test.mjs
git add tools/data/meal-templates.v2.json tools/data/ratio-rules.v1.json worker/src/meal-template-validator.js worker/src/ratio-dsl.js tools/tests/meal-template-catalog.test.mjs tools/tests/ratio-dsl.test.mjs
git commit -m "feat: define cooked rice broth template"
```

### Task 4: Admit the template to Planner V2

**Files:**
- Modify: `worker/src/planner-v2.js`
- Modify: `tools/tests/pantry-planner-v2-selection.test.mjs`
- Modify: `tools/tests/pantry-planner-v2-multipot.test.mjs`
- Modify: `tools/tests/pantry-planner-v2-identity.test.mjs`
- Modify: `tools/data/pantry-planner-v2-journeys.json`

**Interfaces:**
- Produces: deterministic broth-rice candidates, coverage accounting and plan identities.

- [ ] **Step 1: Write failing real-journey tests**

```js
test('cooked rice egg cabbage is one complete broth pot', () => {
  const result = planMeal(assets, request({must:['熟米饭','鸡蛋','白菜']}));
  assert.equal(result.status, 'complete');
  const pot = result.plan.pots.find(row => row.template_id === 'broth-rice-pot');
  assert.ok(pot);
  assert.deepEqual(new Set(pot.planned_must_use.map(row => row.canonical)),
    new Set(['熟米饭','鸡蛋','白菜']));
});

test('chicken potato broth rice preserves the submitted cut', () => {
  const result = planMeal(assets, request({must:['剩米饭','鸡腿肉','土豆']}));
  const pot = result.plan.pots.find(row => row.template_id === 'broth-rice-pot');
  assert.equal(pot.slot_assignment.protein[0].raw, '鸡腿肉');
  assert.equal(pot.slot_assignment.protein[0].shape_or_cut, 'leg');
});
```

Add negative tests for raw rice, tofu, broccoli, quick intent and two proteins. Add `白菜 + 鸡蛋` with basic-extra cooked rice, recommend-mode honesty, no-alternative-plan, and plan-ID changes between egg/chicken ratio traces.

- [ ] **Step 2: Verify RED**

Run: `node --test tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/pantry-planner-v2-multipot.test.mjs tools/tests/pantry-planner-v2-identity.test.mjs`

Expected: FAIL because Planner runtime excludes the template.

- [ ] **Step 3: Add only the runtime ID**

Add `broth-rice-pot` to `ACTIVE_TEMPLATE_IDS` in `planner-v2.js`. Do not add a score bonus or fallback. Preserve coverage-first ranking and one-user-item-per-pot semantics.

- [ ] **Step 4: Extend the journey corpus**

Add cases for egg/cabbage, chicken/potato, raw-rice rejection, unsupported tofu, recommend honesty and no alternative. Use the existing JSON schema and cost caps.

- [ ] **Step 5: Verify GREEN and commit**

```bash
node --test tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/pantry-planner-v2-multipot.test.mjs tools/tests/pantry-planner-v2-identity.test.mjs tools/tests/pantry-planner-v2-journeys.test.mjs
node tools/run-pantry-planner-v2-journeys.mjs
git add worker/src/planner-v2.js tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/pantry-planner-v2-multipot.test.mjs tools/tests/pantry-planner-v2-identity.test.mjs tools/data/pantry-planner-v2-journeys.json
git commit -m "feat: plan cooked rice broth meals"
```

### Task 5: Lock generation, safety and HTTP parity

**Files:**
- Modify: `tools/tests/pantry-planner-v2-contract.test.mjs`
- Modify: `tools/tests/planner-v2-parity.test.mjs`
- Modify: `tools/tests/worker-planner-v2.test.mjs`
- Modify: `worker/src/generated-plan-contract.js`
- Modify only if proven necessary: `ai_proxy.py`

**Interfaces:**
- Consumes: confirmed broth-rice plan.
- Produces: correct conditional steps, safety phrases and matching Worker/proxy behavior.

- [ ] **Step 1: Write failing end-to-end tests**

Assert egg output contains the egg phase but no chicken phase; chicken output contains the inverse. Forge outputs that add 香菇, change 鸡腿肉 to 鸡胸肉, delete 白菜, change quantities, or omit `heated_through`/protein safety evidence. Require `model_contract_violation`, no displayable meal and no automatic retry in Worker and proxy.

- [ ] **Step 2: Verify RED**

Run: `node --test tools/tests/pantry-planner-v2-contract.test.mjs tools/tests/planner-v2-parity.test.mjs tools/tests/worker-planner-v2.test.mjs`

- [ ] **Step 3: Complete finite generation behavior**

Attach `heated_through`, `egg_fully_set`, `poultry_fully_cooked_no_pink` and `tender` only for categories present in the locked pot. Add the remaining-rice storage premise through a finite allowed text, never free model prose. Ensure resolved phases sent to the model no longer contain `when`.

- [ ] **Step 4: Update health assertions and verify GREEN**

Expect the new catalog versions, `activeTemplates:10`, `plannedTemplates:6`, `baseRecipes:72`. Update `ai_proxy.py` only if parity proves a real drift.

```bash
node --test tools/tests/pantry-planner-v2-contract.test.mjs tools/tests/planner-v2-parity.test.mjs tools/tests/worker-planner-v2.test.mjs
python3 -m py_compile ai_proxy.py
git add worker/src/generated-plan-contract.js tools/tests/pantry-planner-v2-contract.test.mjs tools/tests/planner-v2-parity.test.mjs tools/tests/worker-planner-v2.test.mjs
git commit -m "test: lock broth rice generation contract"
```

### Task 6: Promote the capability ledger and derived atlas

**Files:**
- Modify: `tools/data/regional-menu-mappings.v1.json`
- Modify: `tools/tests/regional-menu-mappings.test.mjs`
- Regenerate: `tools/generated/regional-atlas.v2.json`
- Regenerate: `docs/regional-atlas.md`
- Modify: `AGENTS.md`
- Modify: `部署说明.md`
- Modify: `tools/tests/worker-planner-v2.test.mjs`

**Interfaces:**
- Produces: `cooked-rice-stew` full coverage and current operator documentation.

- [ ] **Step 1: Write the failing ledger test**

```js
const row = mappings.capability_mappings.find(entry => entry.family_id === 'cooked-rice-stew');
assert.equal(row.coverage_level, 'full');
assert.deepEqual(row.runtime_template_ids, ['acid-staple-pot','broth-rice-pot']);
assert.deepEqual(row.candidate_template_ids, []);
assert.equal(row.promotion_status, 'covered_by_active_template');
assert.deepEqual(row.resolved_ratio_rule_ids,
  ['acid-staple-cooked-rice-liquid-v1','broth-rice-liquid-v1']);
assert.deepEqual(row.blocker_codes, []);
```

- [ ] **Step 2: Verify RED, update the one ledger row and regenerate**

```bash
node --test tools/tests/regional-menu-mappings.test.mjs
node tools/build-regional-atlas.mjs --write
```

Review the generated diff: only capability counts and cooked-rice coverage may change.

- [ ] **Step 3: Synchronize exact versions and counts**

Update `AGENTS.md` and `部署说明.md` to the new catalog versions, 10 active + 6 planned templates and the actual journey count. Preserve all Draft/no-deploy wording.

- [ ] **Step 4: Verify GREEN and commit**

```bash
node --test tools/tests/regional-menu-mappings.test.mjs tools/tests/regional-atlas-builder.test.mjs tools/tests/regional-atlas-artifacts.test.mjs tools/tests/worker-planner-v2.test.mjs
node tools/build-regional-atlas.mjs --check
git add tools/data/regional-menu-mappings.v1.json tools/generated/regional-atlas.v2.json docs/regional-atlas.md tools/tests/regional-menu-mappings.test.mjs tools/tests/worker-planner-v2.test.mjs AGENTS.md 部署说明.md
git commit -m "docs: promote cooked rice stew capability"
```

### Task 7: Full verification and Draft PR update

**Files:**
- Modify only when a failing verified gate proves a product defect.

**Interfaces:**
- Produces: auditable completion evidence without deployment or merge.

- [ ] **Step 1: Run all tests and product gates**

```bash
node --test tools/tests/*.test.mjs
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
python3 -m py_compile ai_proxy.py
```

Expected: all pass; 72 recipes, 21 families, 10 active templates, 6 planned templates.

- [ ] **Step 2: Run the canonical build and consistency checks**

Use the exact temporary-output invocation asserted by `tools/tests/build-dist.test.mjs`:

```bash
tmpdir="$(mktemp -d)"
node tools/build-dist.mjs --out-dir "$tmpdir/dist" --build-id "broth-rice-preview-check"
rm -rf "$tmpdir"
git diff --check
```

Confirm raw regional research is absent from the built manifest and recipe count remains 72.

- [ ] **Step 3: Push and verify PR state**

```bash
git push origin codex/targeted-recipe-expansion
gh pr view 1 --json isDraft,state,headRefName,url
```

Expected: `isDraft:true`, `state:"OPEN"`; do not deploy or merge.

## Self-review record

- Spec coverage: Ratio DSL, conditional order, template activation, Planner journeys, generation boundary, stale-plan identity, HTTP parity, regional promotion, build and no-deploy gates are assigned.
- Placeholder scan: no unspecified implementation step remains; every task identifies exact files, interfaces, test behavior and commands.
- Type consistency: `per_serving_by_category`, `grams_by_category`, `when:{slot_id,category}`, `broth-rice-liquid-v1`, `templates-v2-20260727-r3` and `ratio-rules-v1-20260727-r2` are consistent throughout.

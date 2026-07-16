# Rice Allergy Live Gate Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the manually qualified rice-allergy meal return positive rice-free copy and a genuinely single-pot method even when the model echoes negated rice wording or proposes a second vessel.

**Architecture:** Keep the existing finite rice-allergen family and trusted recipe selector. Tighten only the active `rice-allergy-complete-main` path: its prompt uses positive wording and an explicit same-pot sequence; a deterministic post-model repair replaces rice-referencing descriptive copy and rebuilds the two-pot method from the returned ingredient list only when the trusted lentil profile is active and all required safe anchors are present. Strict validation still rejects rice terms in dish names, ingredients, and steps so repair cannot hide an unsafe meal.

**Tech Stack:** Cloudflare Worker JavaScript, Python 3 local proxy, JSON recipe library, Node.js built-in test runner, DeepSeek through an owned local proxy.

## Global Constraints

- Only `lentil-potato-tomato-curry` may use `rice-allergy-complete-main`.
- Do not infer safety from the absence of rice.
- Do not change the finite rice activators or the millet, corn, pepper, vinegar, and wine exclusions.
- Do not remove or rename any ingredient or change any grams or nutrition value during repair.
- Never sanitize a rice term out of `dish_name`, `ingredients`, or `steps`; those fields must retain an `allergen_present:*` flag.
- Descriptive repair is limited to `note`, `taste_preview`, `form`, `why`, and `flavor_tags`.
- One-pot repair runs only for the trusted profile, only when the response is flagged `multi_pot_step`, only when red lentil, potato, tomato, and retained water are all present, and only when no rice term appears in `dish_name`, `ingredients`, or `steps`.
- Worker JavaScript remains authoritative; Python must match byte-for-byte for generated repair copy, steps, and flags.
- Preserve the seven user-owned dirty files and their combined unstaged patch-id `cdcd5686ef54d082cb898bf6367dcf2de8db21e4`.
- Use H/O/A/T temporary-index isolation for `worker/src/worker.js` and `ai_proxy.py`.
- Do not touch the existing service on port 8765.
- Do not deploy or push.

---

### Task 1: Lock strict copy and prompt behavior

**Files:**
- Modify: `tools/tests/worker-recipe.test.mjs`
- Modify: `tools/tests/recipe-parity.test.mjs`
- Modify: `worker/src/worker.js`
- Modify: `ai_proxy.py`

**Interfaces:**
- Produces `riceAllergyCompleteMainActive(selection): boolean`.
- Extends the internal rice matcher with `strictVisible: boolean`.
- Keeps ordinary allergy negation behavior unchanged outside the trusted profile.

- [ ] **Step 1: Add failing Worker tests**

Add tests proving:

```js
test('trusted rice-safe mode treats negated visible rice wording as a validation failure', () => {
  const selection = riceSafeSelection();
  for (const wording of ['无需大米', '无需搭配米饭', '不含白米饭']) {
    const flags = validateGroundedMeal(
      { note: wording, ingredients: [], steps: [] },
      selection,
      { dislikes: ['大米过敏'] },
    );
    assert.ok(flags.some(flag => flag.startsWith('allergen_present:')), wording);
  }
});

test('ordinary rice validation still permits negative safety prose', () => {
  const flags = validateGroundedMeal(
    { note: '无需搭配米饭', ingredients: [], steps: [] },
    riceAllergenSelection(),
    { dislikes: ['大米过敏'] },
  );
  assert.equal(flags.some(flag => flag.startsWith('allergen_present:')), false);
});
```

Update the grounding test so the trusted profile must contain:

```text
红扁豆、土豆和番茄已经组成完整主餐
同一口锅先处理土豆和番茄，再加入红扁豆和水炖熟
用户可见 JSON 字段只使用正向描述
```

and must not contain the old `不得出现大米、米饭` example line.

- [ ] **Step 2: Run Worker tests and verify RED**

Run:

```bash
node --test tools/tests/worker-recipe.test.mjs
```

Expected: the trusted negative-copy test and new grounding expectations fail; the ordinary negation control remains green.

- [ ] **Step 3: Implement minimal Worker strict mode and prompt**

Add:

```js
function riceAllergyCompleteMainActive(selection) {
  return selection?.constraintProfile?.id === RICE_ALLERGY_COMPLETE_MAIN_PROFILE_ID;
}
```

Change `validationRiceAllergenTokenBlocked()` and `validationRiceAllergenMatches()` to accept `strictVisible = false`; strict mode skips only the negation exemption and preserves all false-positive exclusions. `validationRiceAllergenFlags()` passes strict mode only when `riceAllergyCompleteMainActive(selection)` is true.

Replace the trusted profile prompt lines with positive completeness copy, an exact same-pot order, and an instruction not to repeat the user's allergy terms in any visible JSON field.

- [ ] **Step 4: Mirror in Python and add parity**

Add `_rice_allergy_complete_main_active(selection)` and the same `strict_visible=False` matcher parameter. Extend the parity cases with the three negative wordings and prompt equality.

- [ ] **Step 5: Run Task 1 GREEN**

Run:

```bash
node --check worker/src/worker.js
python3 -c "import ast, pathlib; ast.parse(pathlib.Path('ai_proxy.py').read_text(encoding='utf-8'))"
node --test tools/tests/worker-recipe.test.mjs tools/tests/recipe-parity.test.mjs
```

Expected: zero failures and exact Worker/Python prompt and flag parity.

### Task 2: Deterministic trusted one-pot repair

**Files:**
- Modify: `tools/tests/worker-recipe.test.mjs`
- Modify: `tools/tests/recipe-parity.test.mjs`
- Modify: `worker/src/worker.js`
- Modify: `ai_proxy.py`

**Interfaces:**
- Produces `repairRiceAllergyCompleteMain(meal, selection, constraints): number`.
- Returns `0` without mutation when prerequisites fail; returns the number of repaired groups when descriptive copy or steps change.

- [ ] **Step 1: Add failing live-fixture Worker tests**

Use the two preserved live shapes:

```js
{
  ingredients: [
    { name: '红扁豆', grams: 100 },
    { name: '土豆', grams: 300 },
    { name: '番茄', grams: 200 },
    { name: '植物油', grams: 10 },
    { name: '水', grams: 800 },
    { name: '盐', grams: 3 },
    { name: '月桂叶', grams: 1 },
  ],
  steps: [
    '红扁豆放入锅中煮10分钟。',
    '另取一锅加入植物油，煎土豆和番茄。',
    '将红扁豆倒入土豆番茄锅中炖熟。',
  ],
  note: '无需米饭即成完整一餐。',
  why: '无需大米。',
}
```

Assert after repair:

- ingredient objects are byte-equivalent;
- steps are exactly three and use only `同一口锅`;
- every non-seasoning ingredient name appears in steps;
- `note`, `why`, `taste_preview`, `form`, and flavor tags contain no controlled rice form;
- validation flags are empty;
- a fixture with `米饭（即食）` remains unmodified in safety-critical fields and retains allergen flags;
- an ordinary lentil selection without the trusted profile is byte-equivalent.

- [ ] **Step 2: Run Worker tests and verify RED**

Run:

```bash
node --test tools/tests/worker-recipe.test.mjs
```

Expected: failure because `repairRiceAllergyCompleteMain` does not exist and generation still returns `multi_pot_step`.

- [ ] **Step 3: Implement the minimal Worker repair**

Implement these rules:

1. Check the trusted profile and active rice allergy.
2. Strict-scan `dish_name`, ingredient names, and original steps; return `0` if any controlled rice form exists.
3. Replace any strictly matching descriptive field with fixed positive copy:
   - `note`: `红扁豆、土豆和番茄组成完整主餐`
   - `why`: `红扁豆补充蛋白，土豆提供主食感，番茄带来酸甜`
   - `taste_preview`: `番茄酸甜先开胃，土豆绵软，红扁豆炖至细腻，尾段留有温和香料气息。`
   - `form`: `一锅炖`
   - matching flavor tag: `醇厚`
4. If `multi_pot_step` is present and red lentil, potato, tomato, and retained water ingredient rows exist, rebuild exactly three steps from the actual ingredient names:
   - wash and cut the three core ingredients;
   - use the same pot for fat, potato, tomato, and remaining dry aromatics;
   - add lentil, retained water, salt and remaining seasonings to the same pot, simmer until lentil is cooked and potato has no hard center, then remove bay leaf if present.
5. Call this repair before `repairGroundedMealSafety()` in `attachGroundedMetadata()`.

- [ ] **Step 4: Mirror byte-equivalent behavior in Python**

Implement `repair_rice_allergy_complete_main()` with the same category order, punctuation, fixed copy, prerequisites, return value, and call order.

- [ ] **Step 5: Add endpoint and Python parity tests**

Assert one upstream call, unchanged ingredients/nutrition, exact step equality, no visible rice matches, no `multi_pot_step`, and no public constraint-profile fields.

- [ ] **Step 6: Run Task 2 GREEN**

Run:

```bash
node --check worker/src/worker.js
python3 -c "import ast, pathlib; ast.parse(pathlib.Path('ai_proxy.py').read_text(encoding='utf-8'))"
node --test tools/tests/worker-recipe.test.mjs tools/tests/recipe-parity.test.mjs
```

Expected: zero failures.

### Task 3: Protected commit, full verification, and new live gate

**Files:**
- Modify: `.superpowers/sdd/rice-allergy-safe-selection-report.md`
- Create external evidence: `/tmp/yiguochu-rice-safe-live-hardening.XXXXXX/`

**Interfaces:**
- Preserves the user's dirty patch exactly.
- Produces separate code-readiness and product-readiness verdicts.

- [ ] **Step 1: Commit through H/O/A/T**

Snapshot the current dirty Worker and Python files before implementation. Build a task-only patch from snapshot to working tree, apply it to a temporary index rooted at HEAD, include only the two test files and this plan, commit with:

```text
fix: harden rice allergy live output
```

Restore the real index and verify the combined unstaged patch-id remains `cdcd5686ef54d082cb898bf6367dcf2de8db21e4`.

- [ ] **Step 2: Run complete offline verification**

Run syntax checks, food and recipe checks, all four suites, static regression, `git diff --check`, index and patch-id checks. Expected: all tests pass, 100/100 static cases pass, and the same six known gaps remain.

- [ ] **Step 3: Run a fresh bounded live gate**

Use a fresh owned port 8766 or 8767 and a fresh evidence directory. Send request 04 first and prove zero DeepSeek calls. Then send exactly three lexical 01–03 requests, one POST each, no retry.

- [ ] **Step 4: Adjudicate and update report**

Product success requires:

- all three live responses HTTP 200;
- trusted base recipe ID and non-empty pairing basis;
- response/Worker/Python flag equality;
- zero flags;
- zero controlled rice forms in bounded visible fields;
- exactly one cooking vessel;
- corn and millet remain unused;
- request 04 returns 422 without a DeepSeek call.

If any live case fails, do not claim product readiness and do not add unapproved retries.

- [ ] **Step 5: Final verification**

Repeat the complete offline verification, confirm 8765 ownership is unchanged, owned ports are free, production is untouched, and report the actual readiness verdict.

### Task 4: Close defects discovered by the first hardening live gate

**Files:**
- Modify: `tools/tests/worker-recipe.test.mjs`
- Modify: `tools/tests/recipe-parity.test.mjs`
- Modify: `worker/src/worker.js`
- Modify: `ai_proxy.py`

**Live evidence:**
- `/tmp/yiguochu-rice-safe-live-hardening.PQWoyw/02-white-rice-allergy-corn-control.raw.json`
- `/tmp/yiguochu-rice-safe-live-hardening.PQWoyw/03-cooked-rice-allergy-millet-control.raw.json`

**Interfaces:**
- Extends `repairRiceAllergyCompleteMain()` / `repair_rice_allergy_complete_main()`.
- Adds a water row only when a trusted rice-safe response uses retained water with an explicit numeric amount but omits the ingredient row.
- Replaces contradictory multi-vessel wording only in descriptive fields.

- [ ] **Step 1: Add failing live-regression tests**

Add one fixture with `加入红扁豆和800毫升水` but no water ingredient. Assert:

- one `{name: "水", grams: 800}` row is appended;
- every nutrient key on that row is `0`;
- all pre-existing ingredient objects remain byte-equivalent and in the same order;
- `step_ingredient_missing:水` clears;
- no water row is invented when the step has no explicit numeric amount.

Add a fixture whose `why` says `仅用三口锅（实际一口锅）`. Assert it becomes the fixed positive `why` copy while dish name, ingredients, and steps remain unchanged.

- [ ] **Step 2: Run Worker tests and verify RED**

Run:

```bash
node --test tools/tests/worker-recipe.test.mjs
```

Expected: numeric retained water is still missing and contradictory vessel copy is unchanged.

- [ ] **Step 3: Implement minimal authoritative repair**

Within the trusted profile only:

1. Before the one-pot repair prerequisite check, inspect `step_ingredient_missing:水`.
2. If no water ingredient exists, extract the first explicit amount from either `800毫升水`, `800克水`, `水800毫升`, or `水800克`.
3. Accept only `50..3000`, convert millilitres to grams at `1 ml = 1 g`, and append a normalized water row with all 12 nutrient values set to `0`.
4. If the amount is absent or out of bounds, retain the validation flag.
5. Treat `(?:[二两三四五六七八九]|[2-9])(?:口|只|个)?锅|多口锅` as contradictory vessel copy in `note`, `taste_preview`, `form`, `why`, or `flavor_tags`, and replace only the affected descriptive field with the existing fixed positive copy.

- [ ] **Step 4: Mirror exactly in Python and add parity**

Assert exact ingredient append order, grams, nutrient keys, copy, and flags.

- [ ] **Step 5: Commit and rerun a second bounded live gate**

Use H/O/A/T isolation, preserve patch-id `cdcd5686ef54d082cb898bf6367dcf2de8db21e4`, rerun the complete offline gate, then run a fresh 04 + exactly three 01–03 no-retry calls. Do not reuse or overwrite the first hardening evidence directory.

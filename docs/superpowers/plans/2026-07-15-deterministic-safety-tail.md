# Deterministic Recipe Safety Tail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deterministically add a same-pot safe cooking endpoint for already-listed high-risk ingredients that the reviewed validator finds undercooked, without another DeepSeek call or any ingredient, quantity, or nutrition invention.

**Architecture:** Add one small repair helper to each existing generation runtime. The helper reads only `high_risk_not_cooked:<name>` flags, mutates only `meal.steps`, and then lets the same validator produce final flags. Worker behavior is implemented and reviewed first; Python parity follows in a separate commit.

**Tech Stack:** Cloudflare Worker JavaScript, Python 3 local proxy, Node.js built-in test runner, existing recipe validator and regression tools.

## Global Constraints

- `worker/src/worker.js` remains the authoritative generation contract; `ai_proxy.py` must match it.
- One user generation request makes exactly one DeepSeek call.
- The repair may mutate only `meal.steps`.
- Never add or change ingredients, grams, nutrition fields, recipe grounding, source metadata, `prep_minutes`, or user constraints.
- Never repair oil, salt, water, stock, allergen, multi-pot, advance-preparation, or other non-safety findings in this change.
- Repair only an exact listed ingredient that is already positively mentioned in the existing steps and has `high_risk_not_cooked:<name>`.
- Revalidate after repair; never remove or suppress a flag manually.
- Use the existing pot and endpoint wording; do not add a second vessel, appliance, duration, or quantity.
- Preserve all seven user-owned dirty files with H/O/A/T isolation.
- No preview or production deployment during implementation.

---

## File map

- `worker/src/worker.js`: authoritative repair helper, endpoint wording, and generation integration.
- `tools/tests/worker-recipe.test.mjs`: Worker unit/integration tests, idempotence, single-call, and non-safety preservation.
- `ai_proxy.py`: Python-equivalent repair helper and local generation integration.
- `tools/tests/recipe-parity.test.mjs`: Worker/Python repair parity and no-network preparation parity.
- `.superpowers/sdd/live-fix6-safety-tail-*.md`: ignored execution/review evidence only; never staged.

### Task 1: Worker safety-tail helper and integration

**Files:**
- Modify: `worker/src/worker.js:527-576,898-930,1018`
- Test: `tools/tests/worker-recipe.test.mjs:506-590,718-840`

**Interfaces:**
- Consumes: `validateGroundedMeal(meal, selection, constraints)`, `validationIngredientNames(meal)`, `validationSteps(meal)`, `validationStepMentions(step, name, aliases)`, `validationCanonicalIngredient(name, aliases)`, and `validationOrdinaryEggIngredient(name, aliases)`.
- Produces: `repairGroundedMealSafety(meal, selection, constraints = {}) -> number`; it mutates only `meal.steps` and returns the number of repaired ingredients.
- Integration: `attachGroundedMetadata()` calls the helper before assigning final `validation_flags`.

- [ ] **Step 1: Add failing Worker tests for the exact mutation boundary**

Add an import for `repairGroundedMealSafety`, then add this test group:

```js
test('safety tail repairs only mentioned high-risk endpoints and is idempotent', () => {
  const recipe = groundedFixtureRecipe({ core_ingredients: ['鸡胸肉', '大米'] });
  const [selection] = selectRecipeCandidates(
    fixtureLib([recipe], { 鸡胸肉: '鸡肉' }),
    { pantry: ['鸡胸肉', '大米'], dislikes: [] },
  );
  const meal = {
    ingredients: [
      { name: '鸡胸肉', grams: 200, kcal: 120 },
      { name: '大米', grams: 160, kcal: 346 },
    ],
    steps: ['鸡胸肉翻炒至表面变色，加入大米焖至米熟。'],
    prep_minutes: 30,
  };
  const ingredientsBefore = structuredClone(meal.ingredients);
  const first = repairGroundedMealSafety(meal, selection, { dislikes: [] });
  const second = repairGroundedMealSafety(meal, selection, { dislikes: [] });

  assert.equal(first, 1);
  assert.equal(second, 0);
  assert.deepEqual(meal.ingredients, ingredientsBefore);
  assert.equal(meal.prep_minutes, 30);
  assert.equal(meal.steps.length, 2);
  assert.match(meal.steps.at(-1), /原锅.*鸡胸肉.*熟透.*中心不见粉红/);
  assert.equal((meal.steps.join('\n').match(/安全收尾/g) || []).length, 1);
  assert.equal(
    validateGroundedMeal(meal, selection, { dislikes: [] }).includes('high_risk_not_cooked:鸡胸肉'),
    false,
  );
});
```

Add the endpoint and multi-ingredient tests below in the same file:

```js
test('safety tail uses the exact egg and seafood endpoints', () => {
  const endpointCases = [
    { name: '鸡蛋', unsafe: '鸡蛋熟透但蛋黄流心。', endpoint: /原锅.*鸡蛋.*熟透.*蛋白和蛋黄完全凝固.*不得流心/ },
    { name: '虾仁', unsafe: '虾仁翻炒至变色。', endpoint: /原锅.*虾仁.*熟透/ },
  ];
  for (const { name, unsafe, endpoint } of endpointCases) {
    const recipe = groundedFixtureRecipe({ core_ingredients: [name], optional_ingredients: [], substitution_slots: [] });
    const [selection] = selectRecipeCandidates(fixtureLib([recipe]), { pantry: [name], dislikes: [] });
    const meal = { ingredients: [{ name, grams: 120 }], steps: [unsafe] };

    assert.ok(validateGroundedMeal(meal, selection, { dislikes: [] }).includes(`high_risk_not_cooked:${name}`));
    assert.equal(repairGroundedMealSafety(meal, selection, { dislikes: [] }), 1);
    assert.equal(meal.steps.length, 2);
    assert.match(meal.steps.at(-1), endpoint);
    assert.equal(validateGroundedMeal(meal, selection, { dislikes: [] }).includes(`high_risk_not_cooked:${name}`), false);
  }
});

test('safety tail combines multiple high-risk ingredients into one final step', () => {
  const recipe = groundedFixtureRecipe({
    core_ingredients: ['鸡胸肉', '虾仁'],
    optional_ingredients: [],
    substitution_slots: [],
  });
  const [selection] = selectRecipeCandidates(fixtureLib([recipe], { '鸡胸肉': '鸡肉' }), {
    pantry: ['鸡胸肉', '虾仁'], dislikes: [],
  });
  const meal = {
    ingredients: [{ name: '鸡胸肉', grams: 180 }, { name: '虾仁', grams: 120 }],
    steps: ['鸡胸肉和虾仁翻炒至表面变色。'],
  };

  assert.equal(repairGroundedMealSafety(meal, selection, { dislikes: [] }), 2);
  assert.equal(meal.steps.length, 2);
  assert.equal((meal.steps.join('\n').match(/安全收尾/g) || []).length, 1);
  assert.match(meal.steps.at(-1), /鸡胸肉.*中心不见粉红.*虾仁.*熟透/);
  assert.equal(validateGroundedMeal(meal, selection, { dislikes: [] }).some(flag => flag.startsWith('high_risk_not_cooked:')), false);
});
```

- [ ] **Step 2: Add failing Worker tests for non-safety preservation**

Add this complete boundary test:

```js
test('safety tail preserves unrelated validation failures and the four-step cap', () => {
  const recipe = groundedFixtureRecipe({
    core_ingredients: ['鸡胸肉', '大米'],
    optional_ingredients: [],
    substitution_slots: [],
  });
  const [selection] = selectRecipeCandidates(fixtureLib([recipe], { '鸡胸肉': '鸡肉' }), {
    pantry: ['鸡胸肉', '大米'], dislikes: [],
  });

  const oilMeal = {
    ingredients: [{ name: '鸡胸肉', grams: 200 }, { name: '大米', grams: 160 }],
    steps: ['锅中加油，鸡胸肉炒至表面变色，加入大米焖至米熟。'],
  };
  assert.equal(repairGroundedMealSafety(oilMeal, selection, { dislikes: [] }), 1);
  const oilFlags = validateGroundedMeal(oilMeal, selection, { dislikes: [] });
  assert.equal(oilFlags.includes('high_risk_not_cooked:鸡胸肉'), false);
  assert.ok(oilFlags.includes('step_ingredient_missing:烹调油'));

  const absentMeal = {
    ingredients: [{ name: '鸡胸肉', grams: 200 }, { name: '大米', grams: 160 }],
    steps: ['大米焖至米熟。'],
  };
  const absentBefore = structuredClone(absentMeal);
  assert.equal(repairGroundedMealSafety(absentMeal, selection, { dislikes: [] }), 0);
  assert.deepEqual(absentMeal, absentBefore);
  const absentFlags = validateGroundedMeal(absentMeal, selection, { dislikes: [] });
  assert.ok(absentFlags.includes('ingredient_missing_in_steps:鸡胸肉'));
  assert.ok(absentFlags.includes('high_risk_not_cooked:鸡胸肉'));

  const fourStepMeal = {
    ingredients: [{ name: '鸡胸肉', grams: 200 }, { name: '大米', grams: 160 }],
    steps: ['鸡胸肉切块。', '鸡胸肉炒至表面变色。', '加入大米。', '焖至米熟。'],
  };
  assert.equal(repairGroundedMealSafety(fourStepMeal, selection, { dislikes: [] }), 1);
  assert.equal(fourStepMeal.steps.length, 4);
  assert.match(fourStepMeal.steps.at(-1), /焖至米熟。 安全收尾：.*鸡胸肉.*中心不见粉红/);
  assert.equal(validateGroundedMeal(fourStepMeal, selection, { dislikes: [] }).includes('high_risk_not_cooked:鸡胸肉'), false);

  const safeMeal = {
    ingredients: [{ name: '鸡胸肉', grams: 200 }, { name: '大米', grams: 160 }],
    steps: ['鸡胸肉在原锅炒熟且中心不见粉红，加入大米焖熟。'],
  };
  const safeBefore = structuredClone(safeMeal);
  assert.equal(repairGroundedMealSafety(safeMeal, selection, { dislikes: [] }), 0);
  assert.deepEqual(safeMeal, safeBefore);

  const constrainedSelection = {
    ...selection,
    unusedPantry: ['盐'],
  };
  const constrainedMeal = {
    ingredients: [
      { name: '鸡胸肉', grams: 200 },
      { name: '大米', grams: 160 },
      { name: '盐', grams: 2 },
    ],
    steps: ['鸡胸肉炒至表面变色，加入大米和盐焖至米熟。'],
  };
  assert.equal(repairGroundedMealSafety(constrainedMeal, constrainedSelection, { dislikes: ['鸡胸肉过敏'] }), 1);
  const constrainedFlags = validateGroundedMeal(
    constrainedMeal,
    constrainedSelection,
    { dislikes: ['鸡胸肉过敏'] },
  );
  assert.ok(constrainedFlags.includes('allergen_present:鸡胸肉'));
  assert.ok(constrainedFlags.includes('unused_pantry_used:盐'));
  assert.equal(constrainedFlags.includes('high_risk_not_cooked:鸡胸肉'), false);
});
```

- [ ] **Step 3: Run the focused Worker tests and verify RED**

Run:

```bash
node --test tools/tests/worker-recipe.test.mjs
```

Expected: the new tests fail because `repairGroundedMealSafety` is not exported or defined; all pre-existing tests remain green.

- [ ] **Step 4: Implement the minimal Worker helper**

Add the following structure immediately before `attachGroundedMetadata()`:

```js
function groundedSafetyEndpoint(name, aliases) {
  const canonical = validationCanonicalIngredient(name, aliases);
  if (validationOrdinaryEggIngredient(name, aliases)) {
    return `继续在原锅加热${name}至熟透，蛋白和蛋黄完全凝固且不得流心`;
  }
  if (/(?:禽|鸡|鸭|鹅|火鸡|猪)/.test(`${name}${canonical}`)) {
    return `继续在原锅加热${name}至熟透，中心不见粉红`;
  }
  return `继续在原锅加热${name}至熟透`;
}

function repairGroundedMealSafety(meal, selection, constraints = {}) {
  const aliases = selection?.ingredientAliases || {};
  const ingredientNames = validationIngredientNames(meal);
  const steps = validationSteps(meal);
  const prefix = 'high_risk_not_cooked:';
  const names = [...new Set(validateGroundedMeal(meal, selection, constraints)
    .filter(flag => flag.startsWith(prefix))
    .map(flag => flag.slice(prefix.length)))]
    .filter(name => ingredientNames.includes(name))
    .filter(name => steps.some(step => validationStepMentions(step, name, aliases)));

  if (!names.length) return 0;
  const instruction = `安全收尾：${names.map(name => groundedSafetyEndpoint(name, aliases)).join('；')}。`;
  if (!Array.isArray(meal.steps)) meal.steps = [];
  if (meal.steps.length < 4) {
    meal.steps.push(instruction);
  } else {
    const last = meal.steps.length - 1;
    meal.steps[last] = `${String(meal.steps[last] || '').trim()} ${instruction}`.trim();
  }
  return names.length;
}
```

At the beginning of `attachGroundedMetadata()` call:

```js
repairGroundedMealSafety(meal, selection, constraints);
```

Add `repairGroundedMealSafety` to the named exports. Do not add a response field for the repair count.

- [ ] **Step 5: Run focused and complete Worker verification**

Run:

```bash
node --check worker/src/worker.js
node --test tools/tests/worker-recipe.test.mjs
node tools/check-foods.mjs
node tools/check-recipes.mjs
node tools/run-recipe-regression.mjs
```

Expected: Worker syntax passes; every Worker test passes; foods reports 0 errors; recipes reports 9 families / 12 base recipes; static regression reports 100/100 with only the existing six manual gaps.

- [ ] **Step 6: Verify one DeepSeek call and unchanged metadata**

Add this complete mocked-generation test:

```js
test('generation repairs an undercooked endpoint without a second DeepSeek call or metadata drift', async () => {
  const recipe = groundedFixtureRecipe({
    core_ingredients: ['鸡胸肉', '大米'],
    optional_ingredients: [],
    substitution_slots: [],
  });
  const recipeLib = fixtureLib([recipe], { '鸡胸肉': '鸡肉' });
  const modelMeal = generatedMeal({
    ingredients: [
      { name: '鸡胸肉', grams: 200, kcal: 120 },
      { name: '大米', grams: 160, kcal: 346 },
    ],
    steps: ['鸡胸肉翻炒至表面变色，加入大米焖至米熟。'],
  });
  const ingredientsBefore = structuredClone(modelMeal.ingredients);
  const { response, body, upstreamBodies } = await runGenerateRequest({
    recipeLib,
    meal: modelMeal,
    constraints: { pantry: ['鸡胸肉', '大米'], dislikes: [] },
  });

  assert.equal(response.status, 200);
  assert.equal(upstreamBodies.length, 1);
  assert.deepEqual(body.ingredients, ingredientsBefore);
  assert.deepEqual(body.source_refs, recipe.source_refs);
  assert.equal(body.validation_flags.includes('high_risk_not_cooked:鸡胸肉'), false);
  assert.match(body.steps.at(-1), /安全收尾：.*鸡胸肉.*熟透.*中心不见粉红/);
});
```

Expected: one upstream body, unchanged ingredient values, trusted metadata still server-owned, and one repaired endpoint.

- [ ] **Step 7: Commit the isolated Worker task**

Use H/O/A/T isolation because `worker/src/worker.js` is user-dirty. Stage only the Task 1 delta and the Worker test file:

```bash
git diff --cached --check
git diff --cached --name-only
git commit -m "fix: add deterministic recipe safety tail"
```

Expected staged paths: `worker/src/worker.js` and `tools/tests/worker-recipe.test.mjs` only. Request a fresh code review before Task 2.

### Task 2: Python parity and full integration gate

**Files:**
- Modify: `ai_proxy.py:773-850,1026-1075`
- Test: `tools/tests/recipe-parity.test.mjs:24-65,669-840`

**Interfaces:**
- Consumes: Worker `repairGroundedMealSafety(meal, selection, constraints = {}) -> number` from Task 1.
- Produces: Python `repair_grounded_meal_safety(meal, selection, constraints=None) -> int` with identical mutation and count semantics.
- Integration: `attach_grounded_metadata()` invokes the Python helper before final validation flags are assigned.

- [ ] **Step 1: Add the failing Python harness action and parity cases**

Extend `pythonHarness` with:

```python
elif action == 'repair':
    constraints = request.get('constraints', {})
    selection = proxy.select_recipe_candidates(request['library'], constraints)[request.get('selection_index', 0)]
    meal = copy.deepcopy(request['meal'])
    repaired = proxy.repair_grounded_meal_safety(meal, selection, constraints)
    result = {
        'repaired': repaired,
        'meal': meal,
        'flags': proxy.validate_grounded_meal(meal, selection, constraints),
    }
```

Import `repairGroundedMealSafety` from the Worker, then add this complete parity test after the harness:

```js
test('Python safety repair matches Worker across endpoint and boundary cases', () => {
  const cases = [
    { id: 'chicken', ingredients: ['鸡胸肉', '大米'], aliases: { '鸡胸肉': '鸡肉' }, steps: ['鸡胸肉炒至表面变色，加入大米焖至米熟。'] },
    { id: 'egg', ingredients: ['鸡蛋'], aliases: {}, steps: ['鸡蛋熟透但蛋黄流心。'] },
    { id: 'seafood', ingredients: ['虾仁'], aliases: {}, steps: ['虾仁炒至变色。'] },
    { id: 'missing-oil', ingredients: ['鸡胸肉', '大米'], aliases: { '鸡胸肉': '鸡肉' }, steps: ['锅中加油，鸡胸肉炒至表面变色，加入大米。'] },
    { id: 'absent-mention', ingredients: ['鸡胸肉', '大米'], aliases: { '鸡胸肉': '鸡肉' }, steps: ['大米焖至米熟。'] },
    { id: 'multiple', ingredients: ['鸡胸肉', '虾仁'], aliases: { '鸡胸肉': '鸡肉' }, steps: ['鸡胸肉和虾仁炒至表面变色。'] },
    { id: 'four-step', ingredients: ['鸡胸肉', '大米'], aliases: { '鸡胸肉': '鸡肉' }, steps: ['鸡胸肉切块。', '鸡胸肉炒至表面变色。', '加入大米。', '焖至米熟。'] },
  ];

  for (const item of cases) {
    const library = fixtureLib([
      fixtureRecipe(`repair-${item.id}`, `family-${item.id}`, {
        core_ingredients: item.ingredients,
        optional_ingredients: [],
        substitution_slots: [],
      }),
    ], item.aliases);
    const constraints = { pantry: item.ingredients, dislikes: [] };
    const selection = selectRecipeCandidates(library, constraints)[0];
    const meal = {
      ingredients: item.ingredients.map(name => ({ name, grams: 120 })),
      steps: item.steps,
      prep_minutes: 30,
    };
    const jsMeal = structuredClone(meal);
    const jsRepaired = repairGroundedMealSafety(jsMeal, selection, constraints);
    const py = pythonCall('repair', { library, constraints, meal });

    assert.equal(py.repaired, jsRepaired, item.id);
    assert.deepEqual(py.meal.steps, jsMeal.steps, item.id);
    assert.deepEqual(py.meal.ingredients, jsMeal.ingredients, item.id);
    assert.equal(py.meal.prep_minutes, jsMeal.prep_minutes, item.id);
    assert.deepEqual(py.flags, validateGroundedMeal(jsMeal, selection, constraints), item.id);
  }
});
```

- [ ] **Step 2: Run parity tests and verify RED**

Run:

```bash
node --test tools/tests/recipe-parity.test.mjs
```

Expected: the new repair action fails because `repair_grounded_meal_safety` does not exist; existing parity tests stay green.

- [ ] **Step 3: Implement the Python-equivalent helper**

Add the Python equivalents immediately before `attach_grounded_metadata()`:

```python
def _grounded_safety_endpoint(name, aliases):
    canonical = _validation_canonical_ingredient(name, aliases)
    if _validation_ordinary_egg_ingredient(name, aliases):
        return f'继续在原锅加热{name}至熟透，蛋白和蛋黄完全凝固且不得流心'
    if re.search(r'(?:禽|鸡|鸭|鹅|火鸡|猪)', f'{name}{canonical}'):
        return f'继续在原锅加热{name}至熟透，中心不见粉红'
    return f'继续在原锅加热{name}至熟透'


def repair_grounded_meal_safety(meal, selection, constraints=None):
    selection = selection if isinstance(selection, dict) else {}
    constraints = constraints if isinstance(constraints, dict) else {}
    aliases = selection.get('ingredient_aliases') or {}
    ingredient_names = _validation_ingredient_names(meal)
    steps = _validation_steps(meal)
    prefix = 'high_risk_not_cooked:'
    names = []
    for flag in validate_grounded_meal(meal, selection, constraints):
        if not flag.startswith(prefix):
            continue
        name = flag[len(prefix):]
        if (name in ingredient_names
                and any(_validation_step_mentions(step, name, aliases) for step in steps)
                and name not in names):
            names.append(name)
    if not names:
        return 0
    instruction = '安全收尾：' + '；'.join(_grounded_safety_endpoint(name, aliases) for name in names) + '。'
    if not isinstance(meal.get('steps'), list):
        meal['steps'] = []
    if len(meal['steps']) < 4:
        meal['steps'].append(instruction)
    else:
        meal['steps'][-1] = f'{_js_string(meal["steps"][-1]).strip()} {instruction}'.strip()
    return len(names)
```

At the start of `attach_grounded_metadata()` call:

```python
repair_grounded_meal_safety(meal, selection, constraints)
```

- [ ] **Step 4: Run focused parity and no-network preparation tests**

Run:

```bash
python3 -m py_compile ai_proxy.py
node --test tools/tests/recipe-parity.test.mjs tools/tests/worker-recipe.test.mjs
```

Expected: Python compiles; repair count, steps, flags, and untouched ingredients match Worker; preparation still makes no network call.

- [ ] **Step 5: Run all offline gates in combined A**

Run:

```bash
node --check worker/src/worker.js
python3 -m py_compile ai_proxy.py
node tools/check-foods.mjs
node tools/check-recipes.mjs
node --test tools/tests/recipe-library.test.mjs tools/tests/worker-recipe.test.mjs tools/tests/recipe-parity.test.mjs tools/tests/frontend-recipe-contract.test.mjs
node tools/run-recipe-regression.mjs
```

Expected: all commands exit 0; the four Node suites exceed the current 103/103 baseline with every test passing; static regression remains 100/100; the six declared manual gaps remain explicit.

- [ ] **Step 6: Reproduce the gates in isolated committed state T**

Materialize only the Task 2 delta over the latest reviewed Task 1 commit while preserving the original dirty patch separately. Re-run the six commands from Step 5 in T.

Expected: A and T produce the same pass counts, Worker/Python behavior, and static failure-code set. Confirm `H -> T` equals `O -> A`, and the user patch `H -> O` equals `T -> A` by patch-id.

- [ ] **Step 7: Commit the isolated Python parity task**

Stage only:

```text
ai_proxy.py
tools/tests/recipe-parity.test.mjs
```

Then run:

```bash
git diff --cached --check
git commit -m "fix: mirror deterministic safety tail locally"
```

Request a fresh code review covering both Task 1 and Task 2 before any API call.

### Task 3: Targeted live evidence and gate decision

**Files:**
- Modify: `.superpowers/sdd/task-7-report.md` (ignored)
- Modify: `.superpowers/sdd/progress.md` (ignored)
- Create: `/tmp/yiguochu-live6-safety-tail/` runtime evidence only

**Interfaces:**
- Consumes: reviewed Worker/Python repair behavior from Tasks 1-2.
- Produces: six request/raw/meta triplets, machine result, semantic adjudication, and a gate decision. No source commit.

- [ ] **Step 1: Verify local process isolation before starting**

Run:

```bash
ps -p 76839 -o pid=,lstart=,command=
lsof -nP -iTCP:8765 -sTCP:LISTEN
lsof -nP -iTCP:8766 -sTCP:LISTEN || true
lsof -nP -iTCP:8767 -sTCP:LISTEN || true
```

Expected: PID 76839 still owns 8765; 8766 and 8767 are free. Do not stop or signal PID 76839.

- [ ] **Step 2: Start the current proxy only on owned port 8766**

Run:

```bash
PORT=8766 python3 ai_proxy.py
curl -fsS http://127.0.0.1:8766/health
```

Expected health: `status=ok`, provider `deepseek`, model `deepseek-chat`. Do not record the API key.

- [ ] **Step 3: Send exactly six no-retry cases and save raw evidence**

Use the same IDs as the prior targeted run:

```text
adversarial-003-raw-poultry-a
adversarial-006-egg-allergy-b
adversarial-008-peanut-allergy-b
base-008-simple-chicken-biryani-fixed-core-dislike
base-009-jollof-rice-exact-core
base-010-jollof-rice-alias-variant
```

For each case, save `<NN>-<id>.request.json`, `.raw.json`, and `.meta.json` under `/tmp/yiguochu-live6-safety-tail/`. Make one request per ID and never retry a failure.

- [ ] **Step 4: Perform machine and semantic adjudication**

Machine checks:

```text
HTTP 200 and JSON object
trusted base_recipe_id and pairing_basis
array validation_flags
local validator flags equal response flags
no disliked canonical ingredient
```

Semantic checks:

```text
every raw poultry/pork/seafood/ordinary egg has a final achieved endpoint
ordinary egg has fully set white and yolk and is not runny
safety tail stays in the original pot and adds no ingredient or quantity
ingredient rows, grams, and nutrition are unchanged by the repair
missing salt, water, oil, or other unrelated defects remain visible
```

Expected: any true safety-only defect becomes safe deterministically. Unrelated defects may still fail and must not be relabeled as passes.

- [ ] **Step 5: Stop owned processes and preserve the old listener**

Send Ctrl-C only to the owned 8766 session. Re-run the port checks.

Expected: nothing listens on 8766/8767; PID 76839 still listens on 8765.

- [ ] **Step 6: Update ignored reports and decide the next gate**

Record commit SHAs, exact call count, raw hashes, machine score, semantic score, repaired safety endpoints, remaining unrelated failures, and process cleanup in the Task 7 report and progress ledger.

Decision:

- If safety repair introduces a new ingredient, quantity, vessel, nutrition change, or hides another flag, stop and fix before more calls.
- If targeted safety behavior is correct but salt/water consistency remains, diagnose that as a separate single-variable task.
- Run a fresh 30-case gate only after targeted evidence improves without semantic regression.
- Keep mobile, preview, and production blocked until the full machine and semantic gates pass.

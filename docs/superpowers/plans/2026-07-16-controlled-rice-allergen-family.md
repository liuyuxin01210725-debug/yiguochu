# Controlled Rice Allergen Family Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deterministically reject generated recipes that contain controlled rice-food forms anywhere in user-facing recipe content when the user declares a common-rice allergy.

**Architecture:** Extend the existing closed-set validator with one bounded rice-allergen family instead of changing general recipe canonicalization or building a universal allergen ontology. Worker JavaScript remains authoritative; Python mirrors activation, field extraction, matching, exclusions, negation, flag ordering, and malformed-value behavior exactly.

**Tech Stack:** Cloudflare Worker JavaScript, Python 3 local proxy, Node.js built-in test runner, existing frontend validation retry contract, DeepSeek through an owned local test proxy.

## Global Constraints

- Implement `docs/superpowers/specs/2026-07-16-controlled-rice-allergen-family-design.md` exactly.
- Detect only the controlled rice-allergen family in this task; do not generalize to every allergen.
- Scan only `dish_name`, `ingredients[].name`, `steps[]`, `note`, `taste_preview`, `form`, `why`, and `flavor_tags[]`.
- Never scan `unused_pantry`, `used_pantry`, `pairing_basis`, `source_refs`, `safety_checks`, `validation_flags`, usage, intelligence, or diagnostics.
- Never add, delete, replace, or rewrite ingredient rows, grams, nutrition, steps, sources, or trusted metadata.
- Do not use a broad `米` substring test.
- Preserve the deliberate exclusions for millet, corn, Job's tears, sorghum, pepper produce, rice vinegar, rice wine, and generic `饭`.
- Preserve every existing recipe-selection, controlled-consumable, safety-tail, one-pot, nutrition, and source rule.
- `worker/src/worker.js` is authoritative; `ai_proxy.py` must return byte-equivalent flag arrays for the same inputs.
- Preserve the seven user-owned dirty files. At plan start, their combined unstaged patch-id is `cdcd5686ef54d082cb898bf6367dcf2de8db21e4`.
- Use H/O/A/T isolation for commits touching dirty production files. Never stage an overlapping production file in the real index.
- Do not touch the existing service on port 8765. Live work may use only an owned free port.
- Phase A forbids production `main`; do not deploy preview or production in this plan.

---

## File map

- `worker/src/worker.js`: authoritative rice-family activation, field extraction, matcher, and flags.
- `tools/tests/worker-recipe.test.mjs`: Worker unit and generation-integration coverage.
- `ai_proxy.py`: exact Python implementation of the Worker behavior.
- `tools/tests/recipe-parity.test.mjs`: complete Worker/Python flag parity.
- `.superpowers/sdd/controlled-rice-allergen-report.md`: ignored execution and live-gate evidence.
- `/tmp/yiguochu-rice-allergen-live.*`: request, raw response, metadata, adjudication, and SHA-256 evidence.

### Task 1: Worker controlled rice-allergen validation

**Files:**
- Modify: `worker/src/worker.js:239-270,575-655`
- Modify: `tools/tests/worker-recipe.test.mjs:410-470`

**Interfaces:**
- Consumes: `recipeConstraintList(value)`, `validationCanonicalIngredient(name, aliases)`, `validationFormName(value)`, and `validateGroundedMeal(meal, selection, constraints)`.
- Produces internal helpers:
  - `validationRiceAllergenActive(dislikes, aliases): boolean`
  - `validationRiceAllergenFields(meal): Array<{ text: string, display: string }>`
  - `validationRiceAllergenMatches(text): string[]`
  - `validationRiceAllergenFlags(meal, dislikes, aliases): string[]`
- Preserves: the public `validateGroundedMeal()` signature and all response fields.

- [ ] **Step 1: Snapshot the protected original state**

Run:

```bash
SNAPSHOT=$(mktemp -d /tmp/yiguochu-rice-allergen-o.XXXXXX)
mkdir -p "$SNAPSHOT/worker/src" "$SNAPSHOT/tools/tests"
cp worker/src/worker.js "$SNAPSHOT/worker/src/worker.js"
cp tools/tests/worker-recipe.test.mjs "$SNAPSHOT/tools/tests/worker-recipe.test.mjs"
echo "$SNAPSHOT" > /tmp/yiguochu-rice-allergen-snapshot-path
git diff --binary | git patch-id --stable
git diff --cached --name-only
```

Expected:

- patch-id is `cdcd5686ef54d082cb898bf6367dcf2de8db21e4`;
- cached-name output is empty;
- the printed snapshot path is retained for Task 1's H/O/A/T commit.

- [ ] **Step 2: Add the failing preserved-live test**

Add a selection helper and exact live-shape test to `tools/tests/worker-recipe.test.mjs`:

```js
function riceAllergenSelection() {
  return {
    ingredientAliases: { 白米: '大米' },
    usedPantry: [],
    unusedPantry: [],
    recipe: { core_ingredients: [] },
  };
}

test('rice allergy rejects the preserved instant-rice live leak across visible fields', () => {
  const meal = {
    dish_name: '椰香鸡肉咖喱盖浇饭',
    ingredients: [
      { name: '鸡胸肉', grams: 300 },
      { name: '米饭（即食）', grams: 400 },
    ],
    steps: [
      '鸡胸肉炖熟。',
      '将即食米饭加热，盛入碗中，浇上咖喱鸡肉即可。',
    ],
  };
  const flags = validateGroundedMeal(meal, riceAllergenSelection(), { dislikes: ['大米过敏'] });
  assert.deepEqual(flags.filter(flag => flag.startsWith('allergen_present:')), [
    'allergen_present:盖浇饭',
    'allergen_present:米饭（即食）',
    'allergen_present:即食米饭',
  ]);
});
```

- [ ] **Step 3: Add failing field-order and family-form tests**

Add:

```js
test('rice allergy scans only bounded user-facing fields in stable order', () => {
  const meal = {
    dish_name: '鸡肉河粉',
    ingredients: [{ name: '糙米饭', grams: 200 }],
    steps: ['最后加入年糕。'],
    note: '配白粥更顺口。',
    taste_preview: '有米线的滑爽口感。',
    form: '焖饭',
    why: '适合想吃饭团的时候。',
    flavor_tags: ['米香', '紫米感'],
    unused_pantry: ['大米'],
    used_pantry: ['白米'],
    pairing_basis: '舍弃米饭。',
    source_refs: [{ title: 'Rice source', url: 'https://example.test/rice' }],
    safety_checks: ['不使用大米'],
  };
  const flags = validateGroundedMeal(meal, riceAllergenSelection(), { dislikes: ['大米过敏'] });
  assert.deepEqual(flags.filter(flag => flag.startsWith('allergen_present:')), [
    'allergen_present:河粉',
    'allergen_present:糙米饭',
    'allergen_present:年糕',
    'allergen_present:白粥',
    'allergen_present:米线',
    'allergen_present:焖饭',
    'allergen_present:饭团',
    'allergen_present:紫米',
  ]);
});

test('rice allergy recognizes the approved finite rice-food family', () => {
  const names = [
    '大米', '白米', '糙米', '糯米', '粳米', '籼米', '黑米', '紫米', '红米',
    '米饭（即食）', '剩米饭', '白米饭', '白粥', '米粥',
    '糙米粉', '米浆', '米糊', '米线', '河粉', '米皮',
    '年糕', '糍粑', '饭团', '煲仔饭', '炒饭', '咖喱饭',
  ];
  for (const name of names) {
    const flags = validateGroundedMeal(
      { ingredients: [{ name, grams: 10 }], steps: [`加入${name}。`] },
      riceAllergenSelection(),
      { dislikes: ['大米过敏'] },
    );
    assert.ok(flags.some(flag => flag === `allergen_present:${name}`), name);
  }
});
```

For `flavor_tags`, `米香` deliberately produces no match because generic `米` is not a token; `紫米感` produces `紫米`.

- [ ] **Step 4: Add failing false-positive, activation, negation, and malformed tests**

Add:

```js
test('rice allergy excludes unrelated grains condiments pepper produce and metadata', () => {
  const controls = [
    '小米', '小米饭', '玉米', '玉米粒', '玉米粉', '薏米', '高粱米',
    '小米椒', '糯米椒', '米醋', '糯米醋', '米酒', '紫米酒酿', '料酒', '一锅饭',
  ];
  for (const name of controls) {
    const flags = validateGroundedMeal(
      { ingredients: [{ name, grams: 10 }], steps: [`加入${name}。`] },
      riceAllergenSelection(),
      { dislikes: ['大米过敏'] },
    );
    assert.equal(flags.some(flag => flag.startsWith('allergen_present:')), false, name);
  }

  const metadataOnly = validateGroundedMeal({
    dish_name: '椰香鸡肉锅',
    ingredients: [{ name: '鸡胸肉', grams: 300 }],
    steps: ['鸡胸肉炖熟。'],
    unused_pantry: ['大米'],
    used_pantry: ['白米'],
    pairing_basis: '舍弃米饭。',
    source_refs: [{ title: 'Rice source', url: 'https://example.test/rice' }],
    safety_checks: ['不使用大米'],
  }, riceAllergenSelection(), { dislikes: ['大米过敏'] });
  assert.equal(metadataOnly.some(flag => flag.startsWith('allergen_present:')), false);
});

test('rice family activation and negation stay finite', () => {
  for (const dislike of ['大米过敏', '白米过敏', '米饭过敏', '糙米过敏']) {
    const flags = validateGroundedMeal(
      { note: '配白米饭。', ingredients: [], steps: [] },
      riceAllergenSelection(),
      { dislikes: [dislike] },
    );
    assert.ok(flags.includes('allergen_present:白米饭'), dislike);
  }

  const unrelated = validateGroundedMeal(
    { note: '配白米饭。', ingredients: [], steps: [] },
    riceAllergenSelection(),
    { dislikes: ['花生过敏'] },
  );
  assert.equal(unrelated.includes('allergen_present:白米饭'), false);

  for (const wording of ['不含米饭', '不使用白米饭', '无需搭配米饭', '避免加入年糕', '去掉河粉']) {
    const flags = validateGroundedMeal(
      { note: wording, ingredients: [], steps: [] },
      riceAllergenSelection(),
      { dislikes: ['大米过敏'] },
    );
    assert.equal(flags.some(flag => flag.startsWith('allergen_present:')), false, wording);
  }

  assert.doesNotThrow(() => validateGroundedMeal(
    {
      dish_name: null,
      ingredients: [null, 0, { name: null }],
      steps: [null, 0, {}],
      flavor_tags: [null, 0, {}],
    },
    riceAllergenSelection(),
    { dislikes: ['大米过敏'] },
  ));
});
```

- [ ] **Step 5: Add a failing Worker generation-integration test**

Add:

```js
test('generation exposes the preserved rice-allergy leak as a hard validation flag', async () => {
  const recipe = groundedFixtureRecipe({
    core_ingredients: ['鸡肉', '洋葱'],
    optional_ingredients: [],
  });
  const recipeLib = fixtureLib([recipe], { 白米: '大米' });
  const meal = generatedMeal({
    dish_name: '椰香鸡肉咖喱盖浇饭',
    ingredients: [
      { name: '鸡肉', grams: 300 },
      { name: '洋葱', grams: 150 },
      { name: '米饭（即食）', grams: 400 },
    ],
    steps: ['鸡肉和洋葱炖熟。', '将即食米饭加热后配咖喱鸡肉。'],
  });
  const { body } = await runWorkerGeneration({
    recipeLib,
    meal,
    constraints: {
      purpose: 'quick',
      servings: 2,
      pantry: ['鸡肉', '洋葱'],
      dislikes: ['大米过敏'],
    },
  });
  assert.ok(body.validation_flags.includes('allergen_present:盖浇饭'));
  assert.ok(body.validation_flags.includes('allergen_present:米饭（即食）'));
  assert.ok(body.validation_flags.includes('allergen_present:即食米饭'));
});
```

- [ ] **Step 6: Run Worker tests and verify RED**

Run:

```bash
node --test tools/tests/worker-recipe.test.mjs
```

Expected:

- the five new rice-allergen tests fail because only canonical ingredient names are currently checked;
- existing tests remain green;
- the preserved live case has no `allergen_present` flag before implementation.

- [ ] **Step 7: Implement the minimal Worker matcher**

Add constants near the existing validator constants:

```js
const VALIDATION_RICE_ALLERGEN_ACTIVATORS = new Set([
  '大米', '白米', '糙米', '糯米', '粳米', '籼米', '黑米', '紫米', '红米',
  '米饭', '白米饭', '糙米饭', '糯米饭', '黑米饭', '紫米饭',
  '剩米饭', '隔夜米饭', '即食米饭',
]);
const VALIDATION_RICE_ALLERGEN_TOKENS = [
  '隔夜米饭', '即食米饭', '剩余米饭', '糙米饭', '糯米饭', '黑米饭', '紫米饭', '白米饭', '剩米饭',
  '大米粥', '糙米粥', '糙米粉',
  '煲仔饭', '盖浇饭', '咖喱饭', '香料饭', '番茄饭',
  '大米', '白米', '糙米', '糯米', '粳米', '籼米', '黑米', '紫米', '红米',
  '米饭', '白粥', '米粥', '米粉', '米浆', '米糊', '米线', '河粉', '米皮',
  '年糕', '糍粑', '饭团', '焖饭', '炒饭', '烩饭', '泡饭', '汤饭', '菜饭', '丼饭',
].sort((a, b) => b.length - a.length || a.localeCompare(b));
const VALIDATION_RICE_GENERIC_PREFIX_BLOCK_RE = /(?:小|玉|薏|粱)$/;
const VALIDATION_RICE_RAW_TOKEN_SUFFIX_BLOCK_RE = /^(?:椒|醋|酒)/;
const VALIDATION_RICE_ALLERGEN_NEGATION_RE = /(?:不(?:使用|含|要|放|加|配|吃|选|用)|无需(?:使用|加入|搭配)?|避免(?:使用|选择|加入|搭配)?|去掉|排除|无)(?:任何|额外|所有|全部)?$/;
```

Add the bounded helpers:

```js
function validationRiceAllergenActive(dislikes, aliases) {
  return recipeConstraintList(dislikes).some(name => {
    const bare = baseRecipeIngredient(name);
    const canonical = validationCanonicalIngredient(name, aliases);
    return canonical === '大米' || VALIDATION_RICE_ALLERGEN_ACTIVATORS.has(bare);
  });
}

function validationRiceAllergenFields(meal) {
  const fields = [];
  const push = (value, display = '') => {
    if (typeof value !== 'string') return;
    const text = validationFormName(value);
    if (text) fields.push({ text, display: display || '' });
  };
  push(meal?.dish_name);
  if (Array.isArray(meal?.ingredients)) {
    for (const item of meal.ingredients) {
      if (typeof item === 'string') push(item, item.trim());
      else if (item && typeof item === 'object' && typeof item.name === 'string') {
        push(item.name, item.name.trim());
      }
    }
  }
  if (Array.isArray(meal?.steps)) for (const step of meal.steps) push(step);
  push(meal?.note);
  push(meal?.taste_preview);
  push(meal?.form);
  push(meal?.why);
  if (Array.isArray(meal?.flavor_tags)) for (const tag of meal.flavor_tags) push(tag);
  return fields;
}

function validationRiceAllergenTokenBlocked(text, index, token) {
  const prefix = text.slice(Math.max(0, index - 18), index);
  const suffix = text.slice(index + token.length);
  if (VALIDATION_RICE_ALLERGEN_NEGATION_RE.test(prefix)) return true;
  if (['米饭', '米粥', '米粉', '米浆', '米糊', '米线'].includes(token)
    && VALIDATION_RICE_GENERIC_PREFIX_BLOCK_RE.test(prefix)) return true;
  if (['大米', '白米', '糙米', '糯米', '粳米', '籼米', '黑米', '紫米', '红米'].includes(token)
    && VALIDATION_RICE_RAW_TOKEN_SUFFIX_BLOCK_RE.test(suffix)) return true;
  return false;
}

function validationRiceAllergenMatches(text) {
  const matches = [];
  for (let index = 0; index < text.length;) {
    const token = VALIDATION_RICE_ALLERGEN_TOKENS.find(candidate => text.startsWith(candidate, index)
      && !validationRiceAllergenTokenBlocked(text, index, candidate));
    if (!token) {
      index += 1;
      continue;
    }
    matches.push(token);
    index += token.length;
  }
  return matches;
}

function validationRiceAllergenFlags(meal, dislikes, aliases) {
  if (!validationRiceAllergenActive(dislikes, aliases)) return [];
  const flags = [];
  const seen = new Set();
  for (const field of validationRiceAllergenFields(meal)) {
    const matches = validationRiceAllergenMatches(field.text);
    if (!matches.length) continue;
    const displays = field.display ? [field.display] : matches;
    for (const display of displays) {
      const flag = `allergen_present:${display}`;
      if (!seen.has(flag)) {
        seen.add(flag);
        flags.push(flag);
      }
    }
  }
  return flags;
}
```

Integrate at the beginning of `validateGroundedMeal()` after `flags` is created:

```js
const riceAllergenActive = validationRiceAllergenActive(constraints?.dislikes, aliases);
for (const flag of validationRiceAllergenFlags(meal, constraints?.dislikes, aliases)) flags.add(flag);
```

Keep the existing ingredient allergen rule for unrelated allergens, while preventing duplicate direct rice handling:

```js
const canonical = validationCanonicalIngredient(name, aliases);
const directRiceIngredient = riceAllergenActive
  && validationRiceAllergenMatches(validationFormName(name)).length > 0;
if (dislikes.includes(canonical) && !directRiceIngredient) flags.add(`allergen_present:${name}`);
```

- [ ] **Step 8: Run Worker GREEN and offline regression**

Run:

```bash
node --check worker/src/worker.js
node --test tools/tests/worker-recipe.test.mjs
node tools/check-recipes.mjs
node tools/run-recipe-regression.mjs
git diff --check
```

Expected:

- Worker suite: 87/87 or greater, with zero failures;
- recipe check: 9 families and 12 base recipes;
- static regression: `100/100 static cases passed`;
- no whitespace errors.

- [ ] **Step 9: Commit only Task 1 through H/O/A/T isolation**

Run:

```bash
SNAPSHOT=$(cat /tmp/yiguochu-rice-allergen-snapshot-path)
TMP_DIR=$(mktemp -d /tmp/yiguochu-rice-allergen-worker.XXXXXX)
TASK_PATCH="$TMP_DIR/task.patch"
TASK_INDEX="$TMP_DIR/index"
diff -u -L a/worker/src/worker.js -L b/worker/src/worker.js \
  "$SNAPSHOT/worker/src/worker.js" worker/src/worker.js > "$TASK_PATCH" || test $? -eq 1
diff -u -L a/tools/tests/worker-recipe.test.mjs -L b/tools/tests/worker-recipe.test.mjs \
  "$SNAPSHOT/tools/tests/worker-recipe.test.mjs" tools/tests/worker-recipe.test.mjs >> "$TASK_PATCH" || test $? -eq 1
GIT_INDEX_FILE="$TASK_INDEX" git read-tree HEAD
GIT_INDEX_FILE="$TASK_INDEX" git apply --cached "$TASK_PATCH"
GIT_INDEX_FILE="$TASK_INDEX" git diff --cached --check
GIT_INDEX_FILE="$TASK_INDEX" git diff --cached --name-only
GIT_INDEX_FILE="$TASK_INDEX" git commit -m "fix: block controlled rice allergen leaks"
git read-tree HEAD
git diff --binary | git patch-id --stable
```

Expected temporary staged files:

```text
tools/tests/worker-recipe.test.mjs
worker/src/worker.js
```

Expected final unstaged patch-id remains `cdcd5686ef54d082cb898bf6367dcf2de8db21e4`.

### Task 2: Python parity and complete flag ordering

**Files:**
- Modify: `ai_proxy.py:448-590,840-925`
- Modify: `tools/tests/recipe-parity.test.mjs:700-930`

**Interfaces:**
- Consumes the Worker behavior and test matrix from Task 1.
- Produces Python helpers:
  - `_validation_rice_allergen_active(dislikes, aliases) -> bool`
  - `_validation_rice_allergen_fields(meal) -> list[dict]`
  - `_validation_rice_allergen_matches(text) -> list[str]`
  - `_validation_rice_allergen_flags(meal, dislikes, aliases) -> list[str]`
- Preserves `validate_grounded_meal(meal, selection, constraints)` and response normalization.

- [ ] **Step 1: Snapshot Python and parity originals**

Run:

```bash
SNAPSHOT=$(cat /tmp/yiguochu-rice-allergen-snapshot-path)
mkdir -p "$SNAPSHOT/python/tools/tests"
cp ai_proxy.py "$SNAPSHOT/python/ai_proxy.py"
cp tools/tests/recipe-parity.test.mjs "$SNAPSHOT/python/tools/tests/recipe-parity.test.mjs"
git diff --binary | git patch-id --stable
git diff --cached --name-only
```

Expected patch-id remains `cdcd5686ef54d082cb898bf6367dcf2de8db21e4`; the real index is empty.

- [ ] **Step 2: Add failing Worker/Python parity matrices**

Add to `tools/tests/recipe-parity.test.mjs`:

```js
test('Python controlled rice allergen fields exactly match Worker', () => {
  const recipe = groundedRecipe({ core_ingredients: [] });
  const library = fixtureLib([recipe], { 白米: '大米' });
  const constraints = { pantry: [], dislikes: ['大米过敏'] };
  const cases = [
    { dish_name: '鸡肉河粉', ingredients: [], steps: [] },
    { ingredients: [{ name: '米饭（即食）', grams: 100 }], steps: ['加热即食米饭。'] },
    { ingredients: [], steps: ['配白米饭。'] },
    { ingredients: [], steps: [], note: '加入年糕。' },
    { ingredients: [], steps: [], taste_preview: '有米线的滑爽。' },
    { ingredients: [], steps: [], form: '焖饭' },
    { ingredients: [], steps: [], why: '适合想吃饭团时。' },
    { ingredients: [], steps: [], flavor_tags: ['紫米感'] },
    {
      ingredients: [{ name: '玉米粒', grams: 100 }],
      steps: ['加入玉米粒。'],
      unused_pantry: ['大米'],
      pairing_basis: '舍弃米饭。',
      source_refs: [{ title: 'Rice source' }],
    },
    { ingredients: [], steps: [], note: '不含米饭。' },
  ];
  for (const meal of cases) {
    const js = validateGroundedMeal(meal, selectRecipeCandidates(library, constraints)[0], constraints);
    const py = pythonCall('validate', { library, constraints, meal });
    assert.deepEqual(py, js, JSON.stringify(meal));
  }
});

test('Python rice allergen activation and preserved live leak match Worker', () => {
  const recipe = groundedRecipe({ core_ingredients: [] });
  const library = fixtureLib([recipe], { 白米: '大米' });
  const meal = {
    dish_name: '椰香鸡肉咖喱盖浇饭',
    ingredients: [{ name: '米饭（即食）', grams: 400 }],
    steps: ['将即食米饭加热后配咖喱鸡肉。'],
  };
  for (const dislikes of [['大米过敏'], ['白米过敏'], ['米饭过敏'], ['花生过敏']]) {
    const constraints = { pantry: [], dislikes };
    const js = validateGroundedMeal(meal, selectRecipeCandidates(library, constraints)[0], constraints);
    const py = pythonCall('validate', { library, constraints, meal });
    assert.deepEqual(py, js, dislikes[0]);
  }
});
```

- [ ] **Step 3: Run parity test and verify RED**

Run:

```bash
node --test tools/tests/recipe-parity.test.mjs
```

Expected:

- the two new tests fail because Python has no rice-family field scanner;
- existing parity tests pass.

- [ ] **Step 4: Implement the exact Python mirror**

Add Python constants with the exact same values and order as Worker:

```python
_VALIDATION_RICE_ALLERGEN_ACTIVATORS = {
    '大米', '白米', '糙米', '糯米', '粳米', '籼米', '黑米', '紫米', '红米',
    '米饭', '白米饭', '糙米饭', '糯米饭', '黑米饭', '紫米饭',
    '剩米饭', '隔夜米饭', '即食米饭',
}
_VALIDATION_RICE_ALLERGEN_TOKENS = sorted([
    '隔夜米饭', '即食米饭', '剩余米饭', '糙米饭', '糯米饭', '黑米饭', '紫米饭', '白米饭', '剩米饭',
    '大米粥', '糙米粥', '糙米粉',
    '煲仔饭', '盖浇饭', '咖喱饭', '香料饭', '番茄饭',
    '大米', '白米', '糙米', '糯米', '粳米', '籼米', '黑米', '紫米', '红米',
    '米饭', '白粥', '米粥', '米粉', '米浆', '米糊', '米线', '河粉', '米皮',
    '年糕', '糍粑', '饭团', '焖饭', '炒饭', '烩饭', '泡饭', '汤饭', '菜饭', '丼饭',
], key=lambda item: (-len(item), item))
_VALIDATION_RICE_GENERIC_PREFIX_BLOCK_RE = re.compile(r'(?:小|玉|薏|粱)$')
_VALIDATION_RICE_RAW_TOKEN_SUFFIX_BLOCK_RE = re.compile(r'^(?:椒|醋|酒)')
_VALIDATION_RICE_ALLERGEN_NEGATION_RE = re.compile(
    r'(?:不(?:使用|含|要|放|加|配|吃|选|用)|无需(?:使用|加入|搭配)?'
    r'|避免(?:使用|选择|加入|搭配)?|去掉|排除|无)(?:任何|额外|所有|全部)?$'
)
```

Add the exact Python helper equivalents:

```python
def _validation_rice_allergen_active(dislikes, aliases):
    for name in recipe_constraint_list(dislikes):
        bare = base_recipe_ingredient(name)
        canonical = _validation_canonical_ingredient(name, aliases)
        if canonical == '大米' or bare in _VALIDATION_RICE_ALLERGEN_ACTIVATORS:
            return True
    return False


def _validation_rice_allergen_fields(meal):
    meal = meal if isinstance(meal, dict) else {}
    fields = []

    def push(value, display=''):
        if not isinstance(value, str):
            return
        text = _validation_form_name(value)
        if text:
            fields.append({'text': text, 'display': display})

    push(meal.get('dish_name'))
    for item in meal.get('ingredients') if isinstance(meal.get('ingredients'), list) else []:
        if isinstance(item, str):
            push(item, item.strip())
        elif isinstance(item, dict) and isinstance(item.get('name'), str):
            push(item['name'], item['name'].strip())
    for step in meal.get('steps') if isinstance(meal.get('steps'), list) else []:
        push(step)
    push(meal.get('note'))
    push(meal.get('taste_preview'))
    push(meal.get('form'))
    push(meal.get('why'))
    for tag in meal.get('flavor_tags') if isinstance(meal.get('flavor_tags'), list) else []:
        push(tag)
    return fields


def _validation_rice_allergen_token_blocked(text, index, token):
    prefix = text[max(0, index - 18):index]
    suffix = text[index + len(token):]
    if _VALIDATION_RICE_ALLERGEN_NEGATION_RE.search(prefix):
        return True
    if (token in ('米饭', '米粥', '米粉', '米浆', '米糊', '米线')
            and _VALIDATION_RICE_GENERIC_PREFIX_BLOCK_RE.search(prefix)):
        return True
    if (token in ('大米', '白米', '糙米', '糯米', '粳米', '籼米', '黑米', '紫米', '红米')
            and _VALIDATION_RICE_RAW_TOKEN_SUFFIX_BLOCK_RE.search(suffix)):
        return True
    return False


def _validation_rice_allergen_matches(text):
    matches = []
    index = 0
    while index < len(text):
        token = next((
            candidate for candidate in _VALIDATION_RICE_ALLERGEN_TOKENS
            if text.startswith(candidate, index)
            and not _validation_rice_allergen_token_blocked(text, index, candidate)
        ), None)
        if token is None:
            index += 1
            continue
        matches.append(token)
        index += len(token)
    return matches


def _validation_rice_allergen_flags(meal, dislikes, aliases):
    if not _validation_rice_allergen_active(dislikes, aliases):
        return []
    flags = []
    seen = set()
    for field in _validation_rice_allergen_fields(meal):
        matches = _validation_rice_allergen_matches(field['text'])
        if not matches:
            continue
        displays = [field['display']] if field['display'] else matches
        for display in displays:
            flag = f'allergen_present:{display}'
            if flag not in seen:
                seen.add(flag)
                flags.append(flag)
    return flags
```

Mirror the Worker integration in `validate_grounded_meal()` before the ingredient loop and preserve unrelated direct allergens.

- [ ] **Step 5: Run parity GREEN and all offline gates**

Run:

```bash
python3 -c "import ast, pathlib; ast.parse(pathlib.Path('ai_proxy.py').read_text(encoding='utf-8'))"
node --test tools/tests/recipe-parity.test.mjs
node --test tools/tests/recipe-library.test.mjs tools/tests/worker-recipe.test.mjs tools/tests/recipe-parity.test.mjs tools/tests/frontend-recipe-contract.test.mjs
node tools/check-foods.mjs
node tools/check-recipes.mjs
node tools/run-recipe-regression.mjs
git diff --check
```

Expected:

- parity suite has zero failures;
- all four suites: 134/134 or greater, zero failures;
- food check: 0 errors;
- recipe check: 9 families and 12 bases;
- static regression: 100/100 with the same six manual known gaps;
- no whitespace errors.

- [ ] **Step 6: Commit only Task 2 through H/O/A/T isolation**

Run:

```bash
SNAPSHOT=$(cat /tmp/yiguochu-rice-allergen-snapshot-path)
TMP_DIR=$(mktemp -d /tmp/yiguochu-rice-allergen-python.XXXXXX)
TASK_PATCH="$TMP_DIR/task.patch"
TASK_INDEX="$TMP_DIR/index"
diff -u -L a/ai_proxy.py -L b/ai_proxy.py \
  "$SNAPSHOT/python/ai_proxy.py" ai_proxy.py > "$TASK_PATCH" || test $? -eq 1
diff -u -L a/tools/tests/recipe-parity.test.mjs -L b/tools/tests/recipe-parity.test.mjs \
  "$SNAPSHOT/python/tools/tests/recipe-parity.test.mjs" tools/tests/recipe-parity.test.mjs >> "$TASK_PATCH" || test $? -eq 1
GIT_INDEX_FILE="$TASK_INDEX" git read-tree HEAD
GIT_INDEX_FILE="$TASK_INDEX" git apply --cached "$TASK_PATCH"
GIT_INDEX_FILE="$TASK_INDEX" git diff --cached --check
GIT_INDEX_FILE="$TASK_INDEX" git diff --cached --name-only
GIT_INDEX_FILE="$TASK_INDEX" git commit -m "fix: mirror rice allergen validation locally"
git read-tree HEAD
git diff --binary | git patch-id --stable
```

Expected temporary staged files:

```text
ai_proxy.py
tools/tests/recipe-parity.test.mjs
```

Expected original dirty-file patch-id remains unchanged.

### Task 3: Review and minimal no-retry live allergen gate

**Files:**
- Create ignored report: `.superpowers/sdd/controlled-rice-allergen-report.md`
- Create external evidence under a new `/tmp/yiguochu-rice-allergen-live.XXXXXX/`

**Interfaces:**
- Consumes current committed Worker/Python validation and the preserved request from `/tmp/yiguochu-live6-safety-tail/04-base-008-simple-chicken-biryani-fixed-core-dislike.request.json`.
- Produces separate code-readiness and product-readiness verdicts.

- [ ] **Step 1: Run fresh controller-side offline verification**

Run:

```bash
node --check worker/src/worker.js
python3 -c "import ast, pathlib; ast.parse(pathlib.Path('ai_proxy.py').read_text(encoding='utf-8'))"
node tools/check-foods.mjs
node tools/check-recipes.mjs
node --test tools/tests/recipe-library.test.mjs tools/tests/worker-recipe.test.mjs tools/tests/recipe-parity.test.mjs tools/tests/frontend-recipe-contract.test.mjs
node tools/run-recipe-regression.mjs
git diff --check
git status --short
git diff --binary | git patch-id --stable
lsof -nP -iTCP:8765 -sTCP:LISTEN || true
lsof -nP -iTCP:8766 -sTCP:LISTEN || true
lsof -nP -iTCP:8767 -sTCP:LISTEN || true
```

Record exact counts, commit, dirty files, patch-id, and port ownership.

- [ ] **Step 2: Review the cumulative implementation diff**

Review the design commit through current HEAD. Explicitly check:

- no broad `米` substring matching;
- `小米饭`, `玉米粉`, `糯米椒`, and `紫米酒酿` controls;
- longest-token-first ordering;
- ingredient full-name display flags;
- field order and metadata exclusions;
- negation behavior;
- duplicate flags;
- rice plus unrelated allergen behavior;
- Worker/Python exact order;
- no mutation of ingredients, grams, nutrition, steps, or sources.

Any Critical or Important finding requires a new RED/GREEN test cycle and a separate fix commit before live calls.

- [ ] **Step 3: Prepare exactly three bounded live requests**

Create a fresh evidence directory and three request files:

```bash
EVIDENCE=$(mktemp -d /tmp/yiguochu-rice-allergen-live.XXXXXX)
SOURCE=/tmp/yiguochu-live6-safety-tail/04-base-008-simple-chicken-biryani-fixed-core-dislike.request.json
cp "$SOURCE" "$EVIDENCE/01-rice-allergy-preserved.request.json"
jq '.constraints.dislikes=["白米过敏"] | .constraints.pantry=["鸡肉","洋葱","玉米"]' \
  "$SOURCE" > "$EVIDENCE/02-white-rice-allergy-corn-control.request.json"
jq '.constraints.dislikes=["米饭过敏"] | .constraints.pantry=["鸡肉","洋葱","小米"]' \
  "$SOURCE" > "$EVIDENCE/03-cooked-rice-allergy-millet-control.request.json"
echo "$EVIDENCE"
```

These are the only authorized live calls for this task.

- [ ] **Step 4: Start and verify an owned local proxy**

Confirm 8766 is free, then start:

```bash
PORT=8766 python3 ai_proxy.py
```

Health check:

```bash
curl --silent --show-error http://127.0.0.1:8766/health \
  | jq -e '.status == "ok" and .provider == "deepseek" and .model == "deepseek-chat"'
```

Expected: `true`.

- [ ] **Step 5: Run exactly three calls with no client retry**

For each request in lexical order, send one POST and record:

```bash
set -e
index=0
for request in "$EVIDENCE"/*.request.json; do
  index=$((index + 1))
  stem=$(basename "$request" .request.json)
  set +e
  http_status=$(curl --silent --show-error \
    --output "$EVIDENCE/$stem.raw.json" \
    --write-out '%{http_code}' \
    --request POST \
    --header 'Content-Type: application/json' \
    --data-binary @"$request" \
    http://127.0.0.1:8766/generate-meal)
  curl_exit=$?
  set -e
  jq -n \
    --argjson call_index "$index" \
    --arg request_file "$stem.request.json" \
    --arg raw_file "$stem.raw.json" \
    --arg http_status "$http_status" \
    --argjson curl_exit "$curl_exit" \
    '{call_index:$call_index,request_file:$request_file,raw_file:$raw_file,http_status:($http_status|tonumber),curl_exit:$curl_exit,retry:false}' \
    > "$EVIDENCE/$stem.meta.json"
done
test "$index" -eq 3
```

Send Ctrl-C only to the owned 8766 session. Confirm 8766/8767 are free and the existing 8765 owner is unchanged.

- [ ] **Step 6: Adjudicate machine detection and strict semantics**

For each response record:

- HTTP/JSON success;
- trusted base recipe and pairing basis;
- exact response/Worker/Python flag equality;
- every controlled rice token in user-facing fields;
- whether each rice token has a corresponding allergen flag;
- whether corn or millet caused a false rice flag;
- whether the response contains a broader allergen leak or unrelated strict defect.

Code-level success:

- any controlled rice leak is deterministically flagged;
- corn and millet controls do not cause a rice flag;
- Worker/Python/response flags are identical.

Product-level success:

- all three returned meals contain no served rice-family food and no allergen flags.

If code-level detection fails, implementation remains blocked. If code detection passes but generated meals still leak and are flagged, code may be ready while the product live gate remains blocked.

- [ ] **Step 7: Preserve evidence and write the release report**

Run:

```bash
shasum -a 256 "$EVIDENCE"/*.json > "$EVIDENCE/sha256.txt"
```

Write `.superpowers/sdd/controlled-rice-allergen-report.md` with:

- exact call and token counts;
- evidence directory;
- offline verification counts;
- per-case machine and semantic findings;
- code-readiness verdict;
- product-readiness verdict;
- confirmation that production was untouched;
- confirmation that the 30-case, mobile, preview, and production gates remain blocked by any remaining Phase A defects.

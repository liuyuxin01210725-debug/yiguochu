# Rice Allergy Safe Recipe Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure a controlled rice-allergy request can use only a manually qualified complete rice-free base recipe, stops before DeepSeek when none is safe, and never displays an unchecked static fallback dish.

**Architecture:** Add a reviewed `rice-allergy-complete-main` qualification to the recipe library and require it during selection whenever the existing controlled rice-allergen family is active. Carry the trusted qualification into the grounding prompt, mirror the behavior in Python, and add a frontend stop-only failure state that renders no recipe content. The existing rice-family validator remains the final defense.

**Tech Stack:** Cloudflare Worker JavaScript, Python 3 local proxy, single-file PWA JavaScript/HTML, JSON recipe library, Node.js built-in test runner, DeepSeek through an owned local proxy.

## Global Constraints

- Implement `docs/superpowers/specs/2026-07-16-rice-allergy-safe-recipe-selection-design.md` exactly.
- Safety takes priority over pantry usage.
- Only `lentil-potato-tomato-curry` receives the initial `rice-allergy-complete-main` qualification.
- Do not infer qualification from the absence of a rice ingredient.
- Do not invent or authorize a new substitution.
- Do not add a new approved recipe.
- Do not change the controlled rice token family or its existing false-positive exclusions.
- Worker JavaScript remains authoritative; Python must match selection, prompt, error, and flag behavior.
- No-safe-candidate handling must not call DeepSeek or consume the upstream daily generation budget.
- Rice-allergy failures must never render the static emergency dish.
- Preserve all existing nutrition, source, high-risk cooking, ingredient correspondence, one-pot, and Phase A rules.
- Preserve the seven user-owned dirty files. Their combined unstaged patch-id at plan start is `cdcd5686ef54d082cb898bf6367dcf2de8db21e4`.
- Use H/O/A/T temporary-index isolation for commits touching `worker/src/worker.js`, `ai_proxy.py`, or `index.html`.
- Do not touch the existing service on port 8765. Live work may use only an owned free port.
- Do not deploy preview or production.

---

## File map

- `tools/data/recipe-library.json`: adds the reviewed profile and `扁豆` alias.
- `tools/lib/recipe-library-validator.mjs`: validates optional constraint profiles.
- `tools/tests/recipe-library.test.mjs`: locks the qualification, alias, and schema.
- `worker/src/worker.js`: authoritative profile filtering, trusted grounding, no-safe response, and budget ordering.
- `tools/tests/worker-recipe.test.mjs`: Worker selection, prompt, integration, and budget coverage.
- `ai_proxy.py`: exact Python selection, grounding, exception, endpoint, and metadata mirror.
- `tools/tests/recipe-parity.test.mjs`: Worker/Python selection, prompt, response, and endpoint parity.
- `index.html`: bounded frontend rice-allergy activation and stop-only failure screen.
- `tools/tests/frontend-recipe-contract.test.mjs`: frontend error, rendering, and return-to-edit coverage.
- `.superpowers/sdd/rice-allergy-safe-selection-report.md`: ignored execution evidence.
- `/tmp/yiguochu-rice-safe-live.*`: external live request, response, metadata, adjudication, and SHA-256 evidence.

### Task 1: Trusted recipe qualification and schema

**Files:**
- Modify: `tools/data/recipe-library.json`
- Modify: `tools/lib/recipe-library-validator.mjs`
- Modify: `tools/tests/recipe-library.test.mjs`

**Interfaces:**
- Produces recipe metadata:
  - `constraint_profiles?: Array<{ id: string, basis: string }>`
  - recognized ID: `rice-allergy-complete-main`
- Produces alias:
  - `扁豆` → `红扁豆`
- Preserves schema version `1`, recipe IDs, family IDs, source metadata, and the 12-recipe count.

- [ ] **Step 1: Verify the protected workspace baseline**

Run:

```bash
set -e
git status --short
git diff --cached --name-only
git diff --binary | git patch-id --stable
node tools/check-recipes.mjs
node --test tools/tests/recipe-library.test.mjs
```

Expected:

- only the original seven user-owned files are dirty;
- the real index is empty;
- patch-id is `cdcd5686ef54d082cb898bf6367dcf2de8db21e4`;
- the existing recipe checker and recipe-library suite pass.

- [ ] **Step 2: Add failing library identity tests**

Extend the alias expectation in `tools/tests/recipe-library.test.mjs`:

```js
test('canonical ingredient aliases stay stable for later selectors', () => {
  assert.deepEqual(lib.ingredient_aliases, {
    西红柿: '番茄',
    白米: '大米',
    鸡腿肉: '鸡肉',
    鸡胸肉: '鸡肉',
    青椒: '甜椒',
    椰浆: '椰奶',
    扁豆: '红扁豆',
  });
});
```

Add:

```js
const RICE_SAFE_BASIS = '红扁豆提供蛋白，土豆作为主食，番茄作为蔬菜；这道菜无需搭配米饭或其他额外主食即可成餐。';

test('only the lentil curry is approved as a complete rice-allergy main meal', () => {
  const qualified = lib.recipes.filter(recipe => Array.isArray(recipe.constraint_profiles));
  assert.deepEqual(qualified.map(recipe => recipe.id), ['lentil-potato-tomato-curry']);
  assert.deepEqual(qualified[0].constraint_profiles, [{
    id: 'rice-allergy-complete-main',
    basis: RICE_SAFE_BASIS,
  }]);
});
```

- [ ] **Step 3: Add failing constraint-profile schema tests**

Add:

```js
test('validator rejects malformed unknown and duplicate constraint profiles', () => {
  const invalid = structuredClone(lib);
  invalid.recipes[0].constraint_profiles = {};
  invalid.recipes[1].constraint_profiles = [
    null,
    { id: 'unknown-profile', basis: RICE_SAFE_BASIS },
    { id: 'rice-allergy-complete-main', basis: '   ' },
    { id: 'rice-allergy-complete-main', basis: RICE_SAFE_BASIS },
    { id: 'rice-allergy-complete-main', basis: RICE_SAFE_BASIS, extra: true },
  ];

  const errors = validateRecipeLibrary(invalid);
  for (const expected of [
    `${invalid.recipes[0].id} constraint_profiles must be a non-empty array`,
    `${invalid.recipes[1].id} constraint profile at index 0 must be an object`,
    `${invalid.recipes[1].id} constraint profile at index 1 has unknown id unknown-profile`,
    `${invalid.recipes[1].id} constraint profile at index 2 missing basis`,
    `${invalid.recipes[1].id} duplicate constraint profile rice-allergy-complete-main`,
    `${invalid.recipes[1].id} constraint profile at index 4 has unexpected fields`,
  ]) {
    assert.ok(errors.includes(expected), expected);
  }
});
```

- [ ] **Step 4: Run the recipe-library suite and verify RED**

Run:

```bash
node --test tools/tests/recipe-library.test.mjs
```

Expected:

- alias and qualification identity tests fail because the JSON metadata is absent;
- malformed profile tests fail because the validator does not inspect `constraint_profiles`;
- existing library tests remain green.

- [ ] **Step 5: Implement profile validation**

Add near the validator constants in `tools/lib/recipe-library-validator.mjs`:

```js
const CONSTRAINT_PROFILE_IDS = new Set(['rice-allergy-complete-main']);
const CONSTRAINT_PROFILE_FIELDS = new Set(['id', 'basis']);
```

Inside each valid recipe, after the existing array validation:

```js
if (recipe.constraint_profiles !== undefined) {
  if (!Array.isArray(recipe.constraint_profiles) || recipe.constraint_profiles.length === 0) {
    errors.push(`${label} constraint_profiles must be a non-empty array`);
  } else {
    const profileIds = new Set();
    for (const [profileIndex, profile] of recipe.constraint_profiles.entries()) {
      if (!isPlainObject(profile)) {
        errors.push(`${label} constraint profile at index ${profileIndex} must be an object`);
        continue;
      }
      const profileId = isNonEmptyString(profile.id) ? profile.id : '<invalid>';
      if (!CONSTRAINT_PROFILE_IDS.has(profileId)) {
        errors.push(`${label} constraint profile at index ${profileIndex} has unknown id ${profileId}`);
      }
      if (profileIds.has(profileId)) {
        errors.push(`${label} duplicate constraint profile ${profileId}`);
      }
      profileIds.add(profileId);
      if (!isNonEmptyString(profile.basis)) {
        errors.push(`${label} constraint profile at index ${profileIndex} missing basis`);
      }
      if (Object.keys(profile).some(key => !CONSTRAINT_PROFILE_FIELDS.has(key))) {
        errors.push(`${label} constraint profile at index ${profileIndex} has unexpected fields`);
      }
    }
  }
}
```

- [ ] **Step 6: Add the approved alias and profile**

In `tools/data/recipe-library.json`, add:

```json
"扁豆": "红扁豆"
```

to `ingredient_aliases`.

Add to `lentil-potato-tomato-curry`:

```json
"constraint_profiles": [
  {
    "id": "rice-allergy-complete-main",
    "basis": "红扁豆提供蛋白，土豆作为主食，番茄作为蔬菜；这道菜无需搭配米饭或其他额外主食即可成餐。"
  }
],
```

Do not add this field to any other recipe.

- [ ] **Step 7: Run Task 1 GREEN**

Run:

```bash
set -e
node --test tools/tests/recipe-library.test.mjs
node tools/check-recipes.mjs
git diff --check -- \
  tools/data/recipe-library.json \
  tools/lib/recipe-library-validator.mjs \
  tools/tests/recipe-library.test.mjs
```

Expected:

- recipe-library suite passes;
- checker reports 9 families and 12 base recipes;
- no whitespace errors.

- [ ] **Step 8: Commit Task 1**

These files do not overlap the user-owned dirty files, so stage only them:

```bash
set -e
git add \
  tools/data/recipe-library.json \
  tools/lib/recipe-library-validator.mjs \
  tools/tests/recipe-library.test.mjs
git diff --cached --check
git diff --cached --name-only
git commit -m "feat: qualify rice allergy safe base"
git diff --binary | git patch-id --stable
```

Expected staged files are exactly the three listed files. The final unstaged patch-id remains `cdcd5686ef54d082cb898bf6367dcf2de8db21e4`.

### Task 2: Authoritative Worker selection, grounding, and no-safe response

**Files:**
- Modify: `worker/src/worker.js`
- Modify: `tools/tests/worker-recipe.test.mjs`

**Interfaces:**
- Produces internal constant:
  - `RICE_ALLERGY_COMPLETE_MAIN_PROFILE_ID`
- Produces internal helper:
  - `recipeConstraintProfile(recipe, profileId): { id: string, basis: string } | null`
- Extends Worker selection objects with:
  - `constraintProfile: { id: string, basis: string } | null`
- Preserves public selector and generation signatures.
- Produces HTTP `422`, code `no_safe_recipe`, message `暂时没有符合这些过敏或忌口条件的可信无米主餐`.

- [ ] **Step 1: Snapshot the protected Worker state**

Run:

```bash
set -e
SNAPSHOT=$(mktemp -d /tmp/yiguochu-rice-safe-worker-o.XXXXXX)
mkdir -p "$SNAPSHOT/worker/src" "$SNAPSHOT/tools/tests"
cp worker/src/worker.js "$SNAPSHOT/worker/src/worker.js"
cp tools/tests/worker-recipe.test.mjs "$SNAPSHOT/tools/tests/worker-recipe.test.mjs"
printf '%s\n' "$SNAPSHOT" > /tmp/yiguochu-rice-safe-worker-snapshot-path
git diff --cached --name-only
git diff --binary | git patch-id --stable
```

Expected: the real index is empty and the patch-id is unchanged.

- [ ] **Step 2: Add failing Worker selection tests**

Add:

```js
const RICE_SAFE_PROFILE = {
  id: 'rice-allergy-complete-main',
  basis: '红扁豆提供蛋白，土豆作为主食，番茄作为蔬菜；这道菜无需搭配米饭或其他额外主食即可成餐。',
};

test('rice allergy selects only the manually qualified complete main meal', () => {
  for (const dislike of ['大米过敏', '白米过敏', '米饭过敏', '糙米过敏']) {
    const hits = selectRecipeCandidates(lib, {
      pantry: ['鸡肉', '洋葱'],
      purpose: 'quick',
      dislikes: [dislike],
    });
    assert.deepEqual(hits.map(hit => hit.recipe.id), ['lentil-potato-tomato-curry'], dislike);
    assert.deepEqual(hits[0].constraintProfile, RICE_SAFE_PROFILE);
    assert.deepEqual(hits[0].usedPantry, []);
    assert.deepEqual(hits[0].unusedPantry, ['鸡肉', '洋葱']);
  }
});

test('rice allergy uses matching safe-core pantry but never broadens the safe pool', () => {
  const [hit] = selectRecipeCandidates(lib, {
    pantry: ['红扁豆', '土豆', '西红柿', '玉米'],
    purpose: 'pantry',
    dislikes: ['大米过敏'],
  });
  assert.equal(hit.recipe.id, 'lentil-potato-tomato-curry');
  assert.deepEqual(hit.usedPantry, ['红扁豆', '土豆', '西红柿']);
  assert.deepEqual(hit.unusedPantry, ['玉米']);
  assert.deepEqual(hit.constraintProfile, RICE_SAFE_PROFILE);
});

test('rice allergy safe pool closes when a fixed safe core is disliked', () => {
  for (const dislike of ['红扁豆过敏', '扁豆过敏', '土豆过敏', '番茄过敏']) {
    const hits = selectRecipeCandidates(lib, {
      pantry: [],
      dislikes: ['大米过敏', dislike],
    });
    assert.deepEqual(hits, [], dislike);
  }
});

test('unrelated allergy preserves ordinary recipe selection', () => {
  const [hit] = selectRecipeCandidates(lib, {
    pantry: ['鸡腿肉', '大米', '洋葱', '葡萄干'],
    purpose: 'quick',
    dislikes: ['花生过敏'],
  });
  assert.equal(hit.recipe.id, 'simple-chicken-biryani');
  assert.equal(hit.constraintProfile, null);
});

test('ordinary lentil selection does not activate rice-allergy grounding', () => {
  const [hit] = selectRecipeCandidates(lib, {
    pantry: ['红扁豆', '土豆', '番茄'],
    purpose: 'pantry',
    dislikes: [],
  });
  assert.equal(hit.recipe.id, 'lentil-potato-tomato-curry');
  assert.equal(hit.constraintProfile, null);
  assert.doesNotMatch(buildRecipeGrounding(hit), /稻米过敏安全模式/);
});
```

- [ ] **Step 3: Add failing trusted-grounding tests**

Add:

```js
test('rice allergy grounding explains the complete main and forbids extra staples', () => {
  const [selection] = selectRecipeCandidates(lib, {
    pantry: ['鸡肉', '洋葱'],
    dislikes: ['大米过敏'],
  });
  const grounding = buildRecipeGrounding(selection);
  assert.match(grounding, /受控完整主餐资格: rice-allergy-complete-main/);
  assert.match(grounding, /红扁豆提供蛋白，土豆作为主食，番茄作为蔬菜/);
  assert.match(grounding, /不得添加或建议搭配任何额外主食/);
  assert.match(grounding, /不得出现大米、米饭、粥、米粉、米线、河粉、年糕、饭团或任何饭类菜名/);
});
```

- [ ] **Step 4: Add failing no-safe and budget-order tests**

Extend `runGenerateRequest()` with:

```js
  envOverrides = {},
```

and pass:

```js
      ...envOverrides,
```

after the existing test environment fields.

Add:

```js
test('rice allergy with no qualified candidate returns 422 before budget or DeepSeek', async () => {
  let budgetGets = 0;
  let budgetPuts = 0;
  const { response, body, upstreamBodies } = await runGenerateRequest({
    recipeLib: lib,
    constraints: { dislikes: ['大米过敏', '扁豆过敏'] },
    envOverrides: {
      RATE_KV: {
        async get() { budgetGets += 1; return '0'; },
        async put() { budgetPuts += 1; },
      },
    },
  });
  assert.equal(response.status, 422);
  assert.equal(body.code, 'no_safe_recipe');
  assert.equal(body.error, '暂时没有符合这些过敏或忌口条件的可信无米主餐');
  assert.equal(upstreamBodies.length, 0);
  assert.equal(budgetGets, 0);
  assert.equal(budgetPuts, 0);
});
```

Keep the existing unrelated no-candidate case at HTTP `503 recipe_library_unavailable`.

- [ ] **Step 5: Revise the preserved leak integration test to use a qualified safe base**

Replace the old unqualified curry fixture with:

```js
test('a qualified rice-allergy base still flags any model-added rice', async () => {
  const recipe = groundedFixtureRecipe({
    name: '可信扁豆土豆咖喱',
    core_ingredients: ['红扁豆', '土豆', '番茄'],
    optional_ingredients: [],
    substitution_slots: [],
    constraint_profiles: [RICE_SAFE_PROFILE],
  });
  const recipeLib = fixtureLib([recipe], { 扁豆: '红扁豆', 白米: '大米' });
  const meal = generatedMeal({
    dish_name: '扁豆土豆咖喱盖浇饭',
    ingredients: [
      { name: '红扁豆', grams: 160 },
      { name: '土豆', grams: 300 },
      { name: '番茄', grams: 240 },
      { name: '米饭（即食）', grams: 400 },
    ],
    steps: ['红扁豆、土豆和番茄炖熟。', '将即食米饭加热后盛盘。'],
    constraint_profile: { id: 'model-forged-profile', basis: 'forged' },
    constraint_profiles: [{ id: 'model-forged-list', basis: 'forged' }],
  });
  const { response, body } = await runGenerateRequest({
    recipeLib,
    meal,
    constraints: { dislikes: ['大米过敏'] },
  });
  assert.equal(response.status, 200);
  assert.ok(body.validation_flags.includes('allergen_present:盖浇饭'));
  assert.ok(body.validation_flags.includes('allergen_present:米饭（即食）'));
  assert.ok(body.validation_flags.includes('allergen_present:即食米饭'));
  assert.equal(Object.hasOwn(body, 'constraint_profile'), false);
  assert.equal(Object.hasOwn(body, 'constraint_profiles'), false);
});
```

- [ ] **Step 6: Run Worker tests and verify RED**

Run:

```bash
node --test tools/tests/worker-recipe.test.mjs
```

Expected:

- safe profile filtering, grounding, no-safe response, budget ordering, and forged-field removal tests fail;
- unrelated existing tests remain green.

- [ ] **Step 7: Implement authoritative Worker selection**

Add near the selector:

```js
const RICE_ALLERGY_COMPLETE_MAIN_PROFILE_ID = 'rice-allergy-complete-main';

function recipeConstraintProfile(recipe, profileId) {
  if (!Array.isArray(recipe?.constraint_profiles)) return null;
  const profile = recipe.constraint_profiles.find(item => (
    item && typeof item === 'object' && item.id === profileId && typeof item.basis === 'string'
  ));
  return profile ? { id: profile.id, basis: profile.basis.trim() } : null;
}
```

At the beginning of `selectRecipeCandidates()`:

```js
const riceAllergyActive = validationRiceAllergenActive(constraints.dislikes, lib?.ingredient_aliases || {});
```

Inside the recipe loop, before core scoring:

```js
const qualifiedConstraintProfile = recipeConstraintProfile(
  recipe,
  RICE_ALLERGY_COMPLETE_MAIN_PROFILE_ID,
);
if (riceAllergyActive && !qualifiedConstraintProfile) continue;
const constraintProfile = riceAllergyActive ? qualifiedConstraintProfile : null;
```

Add to every candidate:

```js
constraintProfile,
```

For inactive rice allergy, this property is `null`.

- [ ] **Step 8: Add trusted profile grounding**

In `buildRecipeGrounding()`:

```js
const profile = selection?.constraintProfile && typeof selection.constraintProfile === 'object'
  ? selection.constraintProfile
  : null;
const profileLines = profile ? [
  `受控完整主餐资格: ${sanitizePromptText(profile.id, 100)}`,
  `完整性依据: ${sanitizePromptText(profile.basis, 300)}`,
  '稻米过敏安全模式: 严格沿用这张基础菜谱。不得添加或建议搭配任何额外主食，尤其不得出现大米、米饭、粥、米粉、米线、河粉、年糕、饭团或任何饭类菜名。',
] : [];
```

Insert:

```js
...profileLines,
```

after the used/unused pantry lines and before `【输出完整性契约】`.

- [ ] **Step 9: Remove model-forged qualification fields**

At the start of `attachGroundedMetadata()`:

```js
delete meal.constraint_profile;
delete meal.constraint_profiles;
delete meal.active_constraint_profile;
```

Do not expose `selection.constraintProfile` as a public response field.

- [ ] **Step 10: Move budget consumption after deterministic selection**

Restructure `handleGenerate()` in this exact order:

```js
if (!env.DEEPSEEK_API_KEY) return errorResponse('missing_api_key', 'DEEPSEEK_API_KEY 未配置', 500, env, {}, request);
if (!rateOk(request, env)) return errorResponse('rate_limited', '今天生成次数到上限了，明天再来～', 429, env, {}, request);

const req = await request.json().catch(() => ({}));
const targets = req.targets && typeof req.targets === 'object' ? req.targets : {};
const constraints = sanitizeRecipeConstraints(req.constraints);
const mealName = String(req.meal_name || '主餐');
let recipeLib;
try {
  recipeLib = await getRecipeLib(env, request);
} catch (_err) {
  return errorResponse('recipe_library_unavailable', '可信菜谱库暂时不可用', 503, env, {}, request);
}
const [selection] = selectRecipeCandidates(recipeLib, constraints);
if (!selection) {
  if (validationRiceAllergenActive(constraints.dislikes, recipeLib?.ingredient_aliases || {})) {
    return errorResponse(
      'no_safe_recipe',
      '暂时没有符合这些过敏或忌口条件的可信无米主餐',
      422,
      env,
      {},
      request,
    );
  }
  return errorResponse('recipe_library_unavailable', '没有符合本次限制的可信基础菜谱', 503, env, {}, request);
}

const budget = await budgetConsume(env);
if (!budget.ok) return errorResponse('budget_exceeded', '今天大家用得有点多，明天再来～', 429, env, {}, request);
```

The prompt and upstream fetch remain after this block.

- [ ] **Step 11: Run Task 2 GREEN and regressions**

Run:

```bash
set -e
node --check worker/src/worker.js
node --test tools/tests/worker-recipe.test.mjs
node --test tools/tests/recipe-library.test.mjs
node tools/check-recipes.mjs
node tools/run-recipe-regression.mjs
git diff --check -- worker/src/worker.js tools/tests/worker-recipe.test.mjs
```

Expected:

- Worker tests pass with zero failures;
- recipe library passes;
- static regression remains 100/100 with the same six known gaps.

- [ ] **Step 12: Commit Task 2 through H/O/A/T isolation**

Run:

```bash
set -e
SNAPSHOT=$(cat /tmp/yiguochu-rice-safe-worker-snapshot-path)
TMP_DIR=$(mktemp -d /tmp/yiguochu-rice-safe-worker.XXXXXX)
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
GIT_INDEX_FILE="$TASK_INDEX" git commit -m "fix: select only trusted rice safe meals"
git read-tree HEAD
git diff --binary | git patch-id --stable
```

Expected temporary staged files:

```text
tools/tests/worker-recipe.test.mjs
worker/src/worker.js
```

Expected original dirty-file patch-id remains unchanged.

### Task 3: Python selection, prompt, and endpoint parity

**Files:**
- Modify: `ai_proxy.py`
- Modify: `tools/tests/recipe-parity.test.mjs`

**Interfaces:**
- Adds:
  - `RICE_ALLERGY_COMPLETE_MAIN_PROFILE_ID`
  - `recipe_constraint_profile(recipe, profile_id)`
  - `NoSafeRecipe`
- Extends Python selection objects with:
  - `constraint_profile`
- Local HTTP endpoint returns `422 no_safe_recipe`.
- Preserves all ordinary no-candidate behavior as `503 recipe_library_unavailable`.

- [ ] **Step 1: Snapshot Python and parity tests**

Run:

```bash
set -e
SNAPSHOT=$(mktemp -d /tmp/yiguochu-rice-safe-python-o.XXXXXX)
mkdir -p "$SNAPSHOT/tools/tests"
cp ai_proxy.py "$SNAPSHOT/ai_proxy.py"
cp tools/tests/recipe-parity.test.mjs "$SNAPSHOT/tools/tests/recipe-parity.test.mjs"
printf '%s\n' "$SNAPSHOT" > /tmp/yiguochu-rice-safe-python-snapshot-path
git diff --cached --name-only
git diff --binary | git patch-id --stable
```

- [ ] **Step 2: Extend the parity selector view**

In the Python harness selector result, add:

```python
'constraint_profile': item.get('constraint_profile'),
```

In `jsSelectionView()`, add:

```js
constraint_profile: item.constraintProfile,
```

This makes all selector parity tests compare the qualification, including `null`.

- [ ] **Step 3: Add failing Python safe-selection parity tests**

Add:

```js
test('Python rice allergy safe selection exactly matches Worker', () => {
  const cases = [
    { pantry: ['鸡肉', '洋葱'], dislikes: ['大米过敏'] },
    { pantry: ['红扁豆', '土豆', '西红柿', '玉米'], purpose: 'pantry', dislikes: ['白米过敏'] },
    { pantry: ['鸡肉', '洋葱', '小米'], dislikes: ['米饭过敏'] },
    { pantry: [], dislikes: ['大米过敏', '扁豆过敏'] },
    { pantry: ['鸡腿肉', '大米', '洋葱', '葡萄干'], purpose: 'quick', dislikes: ['花生过敏'] },
  ];
  for (const constraints of cases) assertSelectorParity(lib, constraints);
});
```

- [ ] **Step 4: Add failing Python prompt parity coverage**

Add a rice-safe case to the existing no-network prompt test:

```js
test('Python rice-safe grounding and forged-profile removal match Worker', async () => {
  const constraints = {
    purpose: 'quick',
    servings: 2,
    pantry: ['鸡肉', '洋葱'],
    dislikes: ['大米过敏'],
  };
  const meal = generatedMeal({
    dish_name: '扁豆土豆番茄咖喱',
    ingredients: [
      { name: '红扁豆', grams: 160 },
      { name: '土豆', grams: 300 },
      { name: '番茄', grams: 240 },
    ],
    steps: ['红扁豆、土豆和番茄在原锅炖熟。'],
    constraint_profile: { id: 'forged', basis: 'forged' },
    constraint_profiles: [{ id: 'forged', basis: 'forged' }],
  });
  const { response, body, upstreamBodies } = await runWorkerGeneration({
    recipeLib: lib,
    meal,
    constraints,
  });
  assert.equal(response.status, 200);
  const py = pythonCall('prepare', {
    library: lib,
    meal_name: '这次的一锅主餐',
    targets: { kcal: 1200, p: 50, fb: 16 },
    constraints,
    meal,
    usage: { total_tokens: 321 },
  });
  assert.equal(py.prompt, upstreamBodies[0].messages[1].content);
  assert.equal(py.grounding, buildRecipeGrounding(selectRecipeCandidates(lib, constraints)[0]));
  assert.match(py.grounding, /rice-allergy-complete-main/);
  assert.match(py.grounding, /不得添加或建议搭配任何额外主食/);
  assert.equal(Object.hasOwn(py.meal, 'constraint_profile'), false);
  assert.equal(Object.hasOwn(py.meal, 'constraint_profiles'), false);
  assert.deepEqual(py.meal.validation_flags, body.validation_flags);
});
```

- [ ] **Step 5: Add failing local endpoint `422` test**

Add:

```js
test('local rice-allergy no-safe endpoint returns 422 before any DeepSeek call', async t => {
  const port = await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port: openPort } = server.address();
      server.close(error => error ? reject(error) : resolve(openPort));
    });
  });
  const child = spawn('python3', ['ai_proxy.py'], {
    cwd: repoRoot,
    env: cleanPythonEnv({ PORT: String(port), DEEPSEEK_API_KEY: 'test-key' }),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => child.kill('SIGTERM'));
  let stderr = '';
  let ready = false;
  child.stderr.on('data', chunk => { stderr += chunk; });
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const health = await fetch(`http://127.0.0.1:${port}/health`);
      if (health.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  assert.equal(ready, true, stderr);
  assert.equal(child.exitCode, null, stderr);
  const response = await fetch(`http://127.0.0.1:${port}/generate-meal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ constraints: { dislikes: ['大米过敏', '扁豆过敏'] } }),
  });
  const body = await response.json();
  assert.equal(response.status, 422);
  assert.equal(body.code, 'no_safe_recipe');
  assert.equal(body.error, '暂时没有符合这些过敏或忌口条件的可信无米主餐');
  assert.doesNotMatch(stderr, /HTTP|URLError|DeepSeek|Kimi/);
});
```

- [ ] **Step 6: Run parity tests and verify RED**

Run:

```bash
node --test tools/tests/recipe-parity.test.mjs
```

Expected:

- selector qualification, grounding, forged-field removal, and `422` endpoint tests fail;
- existing parity tests remain green.

- [ ] **Step 7: Implement the Python selection mirror**

Add:

```python
RICE_ALLERGY_COMPLETE_MAIN_PROFILE_ID = 'rice-allergy-complete-main'


def recipe_constraint_profile(recipe, profile_id):
    profiles = recipe.get('constraint_profiles') if isinstance(recipe, dict) else None
    if not isinstance(profiles, list):
        return None
    for profile in profiles:
        if (isinstance(profile, dict)
                and profile.get('id') == profile_id
                and isinstance(profile.get('basis'), str)):
            return {
                'id': profile['id'],
                'basis': profile['basis'].strip(),
            }
    return None
```

At the beginning of `select_recipe_candidates()`:

```python
rice_allergy_active = _validation_rice_allergen_active(
    constraints.get('dislikes'),
    library.get('ingredient_aliases') or {},
)
```

Inside the recipe loop:

```python
qualified_constraint_profile = recipe_constraint_profile(
    recipe,
    RICE_ALLERGY_COMPLETE_MAIN_PROFILE_ID,
)
if rice_allergy_active and qualified_constraint_profile is None:
    continue
constraint_profile = qualified_constraint_profile if rice_allergy_active else None
```

Add to candidates:

```python
'constraint_profile': constraint_profile,
```

- [ ] **Step 8: Mirror trusted profile grounding**

In `build_recipe_grounding()`:

```python
profile = selection.get('constraint_profile') if isinstance(selection.get('constraint_profile'), dict) else None
profile_lines = []
if profile:
    profile_lines = [
        f"受控完整主餐资格: {sanitize_prompt_text(profile.get('id'), 100)}",
        f"完整性依据: {sanitize_prompt_text(profile.get('basis'), 300)}",
        '稻米过敏安全模式: 严格沿用这张基础菜谱。不得添加或建议搭配任何额外主食，尤其不得出现大米、米饭、粥、米粉、米线、河粉、年糕、饭团或任何饭类菜名。',
    ]
```

Insert:

```python
*profile_lines,
```

after the pantry lines and before `【输出完整性契约】`.

- [ ] **Step 9: Add the distinct Python safe-stop exception**

Add:

```python
class NoSafeRecipe(RecipeLibraryUnavailable):
    """The trusted library has no reviewed rice-free complete main for these constraints."""
```

In `build_recipe_request()`:

```python
if not selections:
    if _validation_rice_allergen_active(
        constraints.get('dislikes'),
        library.get('ingredient_aliases') or {},
    ):
        raise NoSafeRecipe('暂时没有符合这些过敏或忌口条件的可信无米主餐')
    raise RecipeLibraryUnavailable('没有符合本次限制的可信基础菜谱')
```

At the start of `attach_grounded_metadata()`:

```python
meal.pop('constraint_profile', None)
meal.pop('constraint_profiles', None)
meal.pop('active_constraint_profile', None)
```

In `_handle_generate_meal()`, catch `NoSafeRecipe` before `RecipeLibraryUnavailable`:

```python
        except NoSafeRecipe as e:
            self.send_response(422)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': str(e),
                'code': 'no_safe_recipe',
            }, ensure_ascii=False).encode('utf-8'))
```

- [ ] **Step 10: Run Task 3 GREEN and all parity gates**

Run:

```bash
set -e
python3 -c "import ast, pathlib; ast.parse(pathlib.Path('ai_proxy.py').read_text(encoding='utf-8'))"
node --test tools/tests/recipe-parity.test.mjs
node --test tools/tests/worker-recipe.test.mjs tools/tests/recipe-library.test.mjs
node tools/check-recipes.mjs
git diff --check -- ai_proxy.py tools/tests/recipe-parity.test.mjs
```

Expected: zero failures and no whitespace errors.

- [ ] **Step 11: Commit Task 3 through H/O/A/T isolation**

Run:

```bash
set -e
SNAPSHOT=$(cat /tmp/yiguochu-rice-safe-python-snapshot-path)
TMP_DIR=$(mktemp -d /tmp/yiguochu-rice-safe-python.XXXXXX)
TASK_PATCH="$TMP_DIR/task.patch"
TASK_INDEX="$TMP_DIR/index"
diff -u -L a/ai_proxy.py -L b/ai_proxy.py \
  "$SNAPSHOT/ai_proxy.py" ai_proxy.py > "$TASK_PATCH" || test $? -eq 1
diff -u -L a/tools/tests/recipe-parity.test.mjs -L b/tools/tests/recipe-parity.test.mjs \
  "$SNAPSHOT/tools/tests/recipe-parity.test.mjs" tools/tests/recipe-parity.test.mjs >> "$TASK_PATCH" || test $? -eq 1
GIT_INDEX_FILE="$TASK_INDEX" git read-tree HEAD
GIT_INDEX_FILE="$TASK_INDEX" git apply --cached "$TASK_PATCH"
GIT_INDEX_FILE="$TASK_INDEX" git diff --cached --check
GIT_INDEX_FILE="$TASK_INDEX" git diff --cached --name-only
GIT_INDEX_FILE="$TASK_INDEX" git commit -m "fix: mirror trusted rice safe selection"
git read-tree HEAD
git diff --binary | git patch-id --stable
```

Expected temporary staged files:

```text
ai_proxy.py
tools/tests/recipe-parity.test.mjs
```

Expected original dirty-file patch-id remains unchanged.

### Task 4: Frontend rice-allergy stop-only experience

**Files:**
- Modify: `index.html`
- Modify: `tools/tests/frontend-recipe-contract.test.mjs`

**Interfaces:**
- Adds:
  - `hasControlledRiceAllergyInput(value): boolean`
  - `shouldUseRiceSafeStop(error, dislikes): boolean`
  - `safeStopScreen(): string`
  - `showGenerationFailure(error): void`
  - `openEditableProfile(): void`
- Adds state view:
  - `safe-stop`
- Preserves the existing non-rice fallback screen.

- [ ] **Step 1: Snapshot the protected frontend**

Run:

```bash
set -e
SNAPSHOT=$(mktemp -d /tmp/yiguochu-rice-safe-frontend-o.XXXXXX)
mkdir -p "$SNAPSHOT/tools/tests"
cp index.html "$SNAPSHOT/index.html"
cp tools/tests/frontend-recipe-contract.test.mjs "$SNAPSHOT/tools/tests/frontend-recipe-contract.test.mjs"
printf '%s\n' "$SNAPSHOT" > /tmp/yiguochu-rice-safe-frontend-snapshot-path
git diff --cached --name-only
git diff --binary | git patch-id --stable
```

- [ ] **Step 2: Add failing bounded activation tests**

Add:

```js
test('frontend controlled rice allergy activation stays bounded', () => {
  const { context } = loadFrontend();
  const positives = JSON.parse(evaluate(context, `JSON.stringify([
    hasControlledRiceAllergyInput('大米过敏'),
    hasControlledRiceAllergyInput('白米过敏'),
    hasControlledRiceAllergyInput('米饭过敏'),
    hasControlledRiceAllergyInput('糙米过敏')
  ])`));
  assert.deepEqual(positives, [true, true, true, true]);
  const negatives = JSON.parse(evaluate(context, `JSON.stringify([
    hasControlledRiceAllergyInput('花生过敏'),
    hasControlledRiceAllergyInput('小米过敏'),
    hasControlledRiceAllergyInput('玉米过敏'),
    hasControlledRiceAllergyInput('米醋过敏')
  ])`));
  assert.deepEqual(negatives, [false, false, false, false]);
});
```

- [ ] **Step 3: Add failing stop-screen tests**

Add:

```js
test('rice allergy generation failure renders a stop-only screen with no recipe content', () => {
  const { context, root } = loadFrontend();
  evaluate(context, `(() => {
    state.profile.dislikes = '大米过敏';
    state.dish = DISHES[2];
    state.items = DISHES[2].ingredients.map(item => ({...item}));
    showGenerationFailure({ code:'network', message:'failed' });
  })()`);
  assert.equal(evaluate(context, `state.view`), 'safe-stop');
  assert.match(root.innerHTML, /暂时没有安全的无米方案/);
  assert.match(root.innerHTML, /调整食材或忌口/);
  assert.doesNotMatch(root.innerHTML, /照烧鸡腿杂粮拌饭|应急参考|开始做|需要这些|营养参考/);
});

test('no_safe_recipe is non-retryable and uses one HTTP request', async () => {
  const { context, calls } = loadFrontend([{
    status: 422,
    body: {
      code: 'no_safe_recipe',
      error: '暂时没有符合这些过敏或忌口条件的可信无米主餐',
    },
  }]);
  await assert.rejects(
    evaluate(context, `(() => {
      state.profile.dislikes = '大米过敏';
      return fetchRealDish({});
    })()`),
    error => error?.code === 'no_safe_recipe' && error?.retryable === false,
  );
  assert.equal(calls.length, 1);
});
```

- [ ] **Step 4: Add failing return-to-edit and non-rice fallback tests**

Add:

```js
test('safe stop returns to the editable profile', () => {
  const { context } = loadFrontend();
  const stateView = JSON.parse(evaluate(context, `JSON.stringify((() => {
    state.view = 'safe-stop';
    state.profileEditing = false;
    openEditableProfile();
    return { view:state.view, editing:state.profileEditing };
  })())`));
  assert.deepEqual(stateView, { view: 'profile', editing: true });
});

test('non-rice failures preserve the existing static fallback', () => {
  const { context, root } = loadFrontend();
  evaluate(context, `(() => {
    state.profile.dislikes = '花生过敏';
    showGenerationFailure({ code:'network', message:'failed' });
  })()`);
  assert.equal(evaluate(context, `state.view`), 'fallback');
  assert.match(root.innerHTML, /应急参考 · 未按你的偏好定制/);
});
```

- [ ] **Step 5: Run frontend tests and verify RED**

Run:

```bash
node --test tools/tests/frontend-recipe-contract.test.mjs
```

Expected: the new helper, stop-screen, and return-to-edit tests fail because those units do not exist.

- [ ] **Step 6: Implement bounded frontend activation**

Add near request helpers:

```js
const CONTROLLED_RICE_ALLERGY_INPUTS = new Set([
  '大米', '白米', '糙米', '糯米', '粳米', '籼米', '黑米', '紫米', '红米',
  '米饭', '白米饭', '糙米饭', '糯米饭', '黑米饭', '紫米饭',
  '剩米饭', '隔夜米饭', '即食米饭',
]);
function hasControlledRiceAllergyInput(value) {
  return String(value || '').split(/[,，、\s]+/)
    .map(item => normFoodName(item.replace(/过敏|不吃|忌口|不要/g, '')))
    .filter(Boolean)
    .some(item => CONTROLLED_RICE_ALLERGY_INPUTS.has(item));
}
function shouldUseRiceSafeStop(error, dislikes) {
  return (error && error.code === 'no_safe_recipe') || hasControlledRiceAllergyInput(dislikes);
}
```

- [ ] **Step 7: Add the stop-only screen and editable-profile transition**

Add:

```js
function safeStopScreen() {
  return '<div class="screen fallback-screen"><section class="fallback-banner">'
    + '<div class="fb-banner-row"><span class="fb-banner-icon">'
    + icon('pin',{size:18,sw:1.7,stroke:'#c08a3e'})
    + '</span><div><div class="fb-banner-title">暂时没有安全的无米方案</div>'
    + '<p class="fb-banner-text">为了不把不合适的主食硬塞进菜谱，这次没有展示应急菜谱。可以调整忌口或现有食材后再试。</p>'
    + '</div></div><button class="btn btn-primary" data-act="edit-safe-profile">'
    + icon('edit',{size:18,sw:1.9}) + '<span>调整食材或忌口</span></button>'
    + '</section></div>';
}

function openEditableProfile() {
  state.profileEditing = true;
  state.view = 'profile';
  window.scrollTo(0, 0);
  render();
}
```

Update `render()`:

```js
else if (state.view === 'safe-stop') html = safeStopScreen();
```

before the ordinary fallback branch.

- [ ] **Step 8: Centralize generation failure rendering**

Add:

```js
function showGenerationFailure(err) {
  state.lastGenError = normalizeGenError(err);
  state.notice = '';
  if (shouldUseRiceSafeStop(state.lastGenError, state.profile.dislikes)) {
    state.view = 'safe-stop';
  } else {
    state.dish = DISHES[2];
    state.items = DISHES[2].ingredients.map(x => ({ ...x }));
    state.view = 'fallback';
  }
  window.scrollTo(0, 0);
  render();
}
```

Replace the whole `runGenerate()` catch block after the stale-request guard, including the earlier direct `state.lastGenError` assignment, with:

```js
  } catch (err) {
    if (myId !== genId) return;
    genTimers.push(setTimeout(() => {
      if (myId !== genId) return;
      showGenerationFailure(err);
    }, 400));
  }
```

Do not assign `state.dish` or `state.items` in the rice-safe-stop branch.

Add to the click handler:

```js
else if (act === 'edit-safe-profile') openEditableProfile();
```

- [ ] **Step 9: Run Task 4 GREEN**

Run:

```bash
set -e
node --test tools/tests/frontend-recipe-contract.test.mjs
node --test tools/tests/worker-recipe.test.mjs tools/tests/recipe-parity.test.mjs
git diff --check -- index.html tools/tests/frontend-recipe-contract.test.mjs
```

Expected: zero failures; non-rice fallback tests remain unchanged.

- [ ] **Step 10: Commit Task 4 through H/O/A/T isolation**

Run:

```bash
set -e
SNAPSHOT=$(cat /tmp/yiguochu-rice-safe-frontend-snapshot-path)
TMP_DIR=$(mktemp -d /tmp/yiguochu-rice-safe-frontend.XXXXXX)
TASK_PATCH="$TMP_DIR/task.patch"
TASK_INDEX="$TMP_DIR/index"
diff -u -L a/index.html -L b/index.html \
  "$SNAPSHOT/index.html" index.html > "$TASK_PATCH" || test $? -eq 1
diff -u -L a/tools/tests/frontend-recipe-contract.test.mjs -L b/tools/tests/frontend-recipe-contract.test.mjs \
  "$SNAPSHOT/tools/tests/frontend-recipe-contract.test.mjs" tools/tests/frontend-recipe-contract.test.mjs >> "$TASK_PATCH" || test $? -eq 1
GIT_INDEX_FILE="$TASK_INDEX" git read-tree HEAD
GIT_INDEX_FILE="$TASK_INDEX" git apply --cached "$TASK_PATCH"
GIT_INDEX_FILE="$TASK_INDEX" git diff --cached --check
GIT_INDEX_FILE="$TASK_INDEX" git diff --cached --name-only
GIT_INDEX_FILE="$TASK_INDEX" git commit -m "fix: stop safely on rice allergy failures"
git read-tree HEAD
git diff --binary | git patch-id --stable
```

Expected temporary staged files:

```text
index.html
tools/tests/frontend-recipe-contract.test.mjs
```

Expected original dirty-file patch-id remains unchanged.

### Task 5: Full verification and bounded live release gate

**Files:**
- Create ignored report: `.superpowers/sdd/rice-allergy-safe-selection-report.md`
- Create external evidence: `/tmp/yiguochu-rice-safe-live.XXXXXX/`

**Interfaces:**
- Consumes the committed recipe library, Worker, Python, and frontend behavior.
- Produces separate code-readiness and product-readiness verdicts.

- [ ] **Step 1: Run fresh complete offline verification**

Run:

```bash
set -e
node --check worker/src/worker.js
python3 -c "import ast, pathlib; ast.parse(pathlib.Path('ai_proxy.py').read_text(encoding='utf-8'))"
node tools/check-foods.mjs
node tools/check-recipes.mjs
node --test \
  tools/tests/recipe-library.test.mjs \
  tools/tests/worker-recipe.test.mjs \
  tools/tests/recipe-parity.test.mjs \
  tools/tests/frontend-recipe-contract.test.mjs
node tools/run-recipe-regression.mjs
git diff --check
git status --short
git diff --cached --name-only
git diff --binary | git patch-id --stable
lsof -nP -iTCP:8765 -sTCP:LISTEN || true
lsof -nP -iTCP:8766 -sTCP:LISTEN || true
lsof -nP -iTCP:8767 -sTCP:LISTEN || true
```

Expected:

- all suites pass with zero failures;
- food and recipe checks pass;
- static regression remains 100/100 with the same six known gaps;
- the original patch-id remains unchanged;
- port 8765 still belongs to its existing process;
- the selected owned port is free.

- [ ] **Step 2: Review the cumulative implementation**

Review from the Task 1 commit through current HEAD. Explicitly verify:

- only the lentil curry has the safe profile;
- no runtime “rice-free means safe” inference exists;
- rice allergy requires the profile before scoring;
- `扁豆` blocks `红扁豆`;
- ordinary selection remains unchanged;
- no-safe response occurs before `budgetConsume()` and upstream fetch;
- profile grounding is trusted and model-forged fields are removed;
- Python order and strings exactly match Worker;
- frontend rice activation is bounded and does not include millet, corn, or rice vinegar;
- rice-allergy failures render no dish content;
- no ingredient, grams, nutrition, source, or approved recipe technique is rewritten.

Any Critical or Important finding requires a new RED/GREEN cycle and a separate fix commit before live calls.

- [ ] **Step 3: Prepare the four bounded HTTP requests**

First use `apply_patch` to create these ignored request templates:

`.superpowers/sdd/01-rice-allergy-irrelevant-pantry.request.json`

```json
{"meal_name":"这次的一锅主餐","targets":{"kcal":1200,"p":50,"fb":16},"constraints":{"purpose":"quick","servings":2,"pantry":["鸡肉","洋葱"],"dislikes":["大米过敏"]}}
```

`.superpowers/sdd/02-white-rice-allergy-corn-control.request.json`

```json
{"meal_name":"这次的一锅主餐","targets":{"kcal":1200,"p":50,"fb":16},"constraints":{"purpose":"quick","servings":2,"pantry":["鸡肉","洋葱","玉米"],"dislikes":["白米过敏"]}}
```

`.superpowers/sdd/03-cooked-rice-allergy-millet-control.request.json`

```json
{"meal_name":"这次的一锅主餐","targets":{"kcal":1200,"p":50,"fb":16},"constraints":{"purpose":"quick","servings":2,"pantry":["鸡肉","洋葱","小米"],"dislikes":["米饭过敏"]}}
```

`.superpowers/sdd/04-no-safe-lentil-allergy.request.json`

```json
{"meal_name":"这次的一锅主餐","targets":{"kcal":1200,"p":50,"fb":16},"constraints":{"purpose":"quick","servings":2,"pantry":[],"dislikes":["大米过敏","扁豆过敏"]}}
```

Then copy the exact templates into a fresh external evidence directory:

```bash
set -e
EVIDENCE=$(mktemp -d /tmp/yiguochu-rice-safe-live.XXXXXX)
cp .superpowers/sdd/0[1-4]-*.request.json "$EVIDENCE/"
printf '%s\n' "$EVIDENCE" > /tmp/yiguochu-rice-safe-evidence-path
```

Only the first three requests are authorized to reach DeepSeek. Request 04 must stop locally.

- [ ] **Step 4: Start and verify the owned local proxy**

Confirm port 8766 is free, then start:

```bash
PORT=8766 python3 ai_proxy.py
```

Verify:

```bash
curl --silent --show-error http://127.0.0.1:8766/health \
  | jq -e '.status == "ok" and .provider == "deepseek" and .model == "deepseek-chat"'
```

Expected: `true`.

- [ ] **Step 5: Prove the no-safe request does not call DeepSeek**

Send request 04 first:

```bash
set -e
EVIDENCE=$(cat /tmp/yiguochu-rice-safe-evidence-path)
stem=04-no-safe-lentil-allergy
http_status=$(curl --silent --show-error \
  --output "$EVIDENCE/$stem.raw.json" \
  --write-out '%{http_code}' \
  --request POST \
  --header 'Content-Type: application/json' \
  --data-binary @"$EVIDENCE/$stem.request.json" \
  http://127.0.0.1:8766/generate-meal)
jq -n \
  --arg request_file "$stem.request.json" \
  --arg raw_file "$stem.raw.json" \
  --arg http_status "$http_status" \
  '{call_index:0,request_file:$request_file,raw_file:$raw_file,http_status:($http_status|tonumber),deepseek_call:false,retry:false}' \
  > "$EVIDENCE/$stem.meta.json"
jq -e '.code == "no_safe_recipe"' "$EVIDENCE/$stem.raw.json"
test "$http_status" = "422"
```

Inspect the owned proxy log. There must be no `evt:"gen"` line for request 04.

- [ ] **Step 6: Run exactly three no-retry live calls**

Run each request individually in lexical order, one POST each, with no curl retry:

```bash
set -e
EVIDENCE=$(cat /tmp/yiguochu-rice-safe-evidence-path)
index=0
for request in "$EVIDENCE"/0[1-3]-*.request.json; do
  index=$((index + 1))
  stem=$(basename "$request" .request.json)
  set +e
  http_status=$(curl --silent --show-error \
    --max-time 60 \
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
    '{call_index:$call_index,request_file:$request_file,raw_file:$raw_file,http_status:($http_status|tonumber),curl_exit:$curl_exit,deepseek_call:true,retry:false}' \
    > "$EVIDENCE/$stem.meta.json"
done
test "$index" -eq 3
```

Stop only the owned 8766 session. Confirm ports 8766 and 8767 are free and port 8765 ownership is unchanged.

- [ ] **Step 7: Adjudicate response, Worker, and Python behavior**

For each of the first three cases, record:

- HTTP 200 and valid JSON;
- `base_recipe_id === "lentil-potato-tomato-curry"`;
- non-empty trusted `pairing_basis`;
- exact response/Worker/Python validation flag equality;
- zero controlled rice-food forms in bounded user-facing fields;
- `validation_flags.length === 0`;
- corn and millet remain unused rather than generating a rice flag;
- no model-forged constraint profile field is public.

For request 04, record:

- HTTP 422;
- code `no_safe_recipe`;
- zero DeepSeek calls;
- exact safe-stop message.

Product-level success requires all four cases to pass these conditions.

- [ ] **Step 8: Preserve evidence and write the report**

Run:

```bash
set -e
EVIDENCE=$(cat /tmp/yiguochu-rice-safe-evidence-path)
shasum -a 256 "$EVIDENCE"/*.json > "$EVIDENCE/sha256.txt"
```

Write `.superpowers/sdd/rice-allergy-safe-selection-report.md` with:

- commits;
- offline counts;
- original dirty-file patch-id;
- exact DeepSeek call and token counts;
- per-case selected base, used/unused pantry, rice matches, validation flags, and semantic result;
- no-safe response proof;
- code-readiness verdict;
- product-readiness verdict;
- confirmation that production was untouched;
- confirmation that the six known gaps, 30-case review, mobile review, and user approval still govern the final Phase A release.

- [ ] **Step 9: Final verification before any completion claim**

Run:

```bash
set -e
node --check worker/src/worker.js
python3 -c "import ast, pathlib; ast.parse(pathlib.Path('ai_proxy.py').read_text(encoding='utf-8'))"
node tools/check-foods.mjs
node tools/check-recipes.mjs
node --test \
  tools/tests/recipe-library.test.mjs \
  tools/tests/worker-recipe.test.mjs \
  tools/tests/recipe-parity.test.mjs \
  tools/tests/frontend-recipe-contract.test.mjs
node tools/run-recipe-regression.mjs
git diff --check
git status --short
git diff --cached --name-only
git diff --binary | git patch-id --stable
lsof -nP -iTCP:8765 -sTCP:LISTEN || true
lsof -nP -iTCP:8766 -sTCP:LISTEN || true
lsof -nP -iTCP:8767 -sTCP:LISTEN || true
```

Do not claim product readiness unless the fresh live adjudication is fully clean.

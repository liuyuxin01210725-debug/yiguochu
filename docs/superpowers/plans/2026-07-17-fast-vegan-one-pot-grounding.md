# Fast Vegan One-Pot Grounding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the slow vegan seed with a source-backed 30-minute one-pot meal, make the lentil curry's one-pot adaptation transparent, and tighten retained-liquid grounding without adding DeepSeek calls or server-side quantity rewriting.

**Architecture:** `tools/data/recipe-library.json` remains the trusted recipe source; Worker JavaScript remains authoritative for selection, grounding, validation, and trusted response metadata; Python mirrors it byte-for-byte where parity is required. The frontend only normalizes and renders server-controlled adaptation metadata and aligns ordinary `quick` scoring to 30 minutes.

**Tech Stack:** Cloudflare Worker JavaScript, Python 3 local proxy, single-file PWA, Node.js built-in test runner, generated JSON regression corpus, DeepSeek through an owned local proxy, Cloudflare Pages preview only after a separate deployment approval.

## Global Constraints

- Implement `docs/superpowers/specs/2026-07-17-fast-vegan-one-pot-grounding-design.md` exactly.
- Keep exactly 9 recipe families and 12 `approved` base recipes; do not begin the 150–200 recipe expansion.
- RecipeDB remains research-only and must not enter the production library, runtime bundle, or prompt.
- Remove `mung-bean-brown-rice-curry`; add `soy-lentil-vegetable-stew` with the approved Wikibooks source retrieved on `2026-07-17`.
- Keep `lentil-potato-tomato-curry` and its sole `rice-allergy-complete-main` qualification, but make its production technique one-pot and disclose the adaptation.
- Ordinary `quick` uses a 30-minute threshold in Worker, Python, and frontend scoring; `SWAP_HINT.easier` remains at 25 minutes.
- Never invent authoritative nutrition numbers. New long-tail foods remain `est=true` unless the existing authoritative lookup layers match them.
- Do not add DeepSeek calls, a model retry branch, server-side gram correction, or deterministic recipe-step rewriting for this feature.
- Preserve all existing safety, allergen, source, and nutrition rules.
- Preserve the seven user-owned dirty files and combined unstaged patch-id `cdcd5686ef54d082cb898bf6367dcf2de8db21e4`.
- Use H/O/A/T temporary-index isolation for commits touching `worker/src/worker.js`, `ai_proxy.py`, or `index.html`; never stage those overlapping dirty production files in the real index.
- Do not touch the existing service on port 8765. Local live work may use only an owned free port such as 8766.
- No production deployment. A `recipe-validation` preview requires a separate explicit user approval after offline, six-case, 30-case, and mobile review evidence.

---

## File map

- `tools/data/recipe-library.json`: replace one approved seed and record one adaptation note.
- `tools/lib/recipe-library-validator.mjs`: validate optional `total_time_minutes` and `adaptation_note` fields.
- `tools/tests/recipe-library.test.mjs`: lock source, family, ingredients, vegan boundary, time, and adaptation metadata.
- `worker/src/worker.js`: authoritative grounding, retained-soaking-liquid detection, 30-minute quick prompt, and trusted response metadata.
- `tools/tests/worker-recipe.test.mjs`: Worker RED/GREEN coverage for grounding, validation, prompt, and metadata overwrite.
- `ai_proxy.py`: exact local mirror of Worker prompt, grounding, retained-liquid detection, and metadata attachment.
- `tools/tests/recipe-parity.test.mjs`: Worker/Python parity for all new strings and response fields.
- `index.html`: normalize and render `adaptation_note`; score ordinary quick meals at 30 minutes.
- `tools/tests/frontend-recipe-contract.test.mjs`: frontend sanitization, escaping, display, and quick-threshold coverage.
- `tools/build-recipe-regression.mjs`: replace old recipe references and freeze the new fixed-core-dislike oracle.
- `tools/data/recipe-regression.json`: regenerated 100-case corpus.
- `docs/recipe-validation-review.md`: replace old base and cycle review rows without pre-filling results.
- `/tmp/yiguochu-fast-vegan-*`: external snapshots, live requests, raw responses, metadata, and hashes.

### Task 1: Trusted recipe data and schema

**Files:**
- Modify: `tools/data/recipe-library.json`
- Modify: `tools/lib/recipe-library-validator.mjs`
- Modify: `tools/tests/recipe-library.test.mjs`

**Interfaces:**
- Consumes: `validateRecipeLibrary(lib): string[]` and schema version 1.
- Produces: an approved `soy-lentil-vegetable-stew` recipe with `total_time_minutes: 30`; an optional `adaptation_note: string` on `lentil-potato-tomato-curry`.
- Preserves: 9 families, 12 recipes, all existing family IDs, and the sole rice-allergy profile.

- [ ] **Step 1: Verify the protected baseline**

Run:

```bash
git diff --cached --name-only
git diff --binary | git patch-id --stable
git status --short
```

Expected: real index empty; patch-id `cdcd5686ef54d082cb898bf6367dcf2de8db21e4`; exactly the seven known user-owned files are modified.

- [ ] **Step 2: Write failing schema and identity tests**

In `tools/tests/recipe-library.test.mjs`, replace the old expected identity row and add these tests:

```js
['soy-lentil-vegetable-stew', 'family-legume-vegetable-stew', '大豆扁豆西兰花炖锅',
  'Cookbook:Soy-Lentil-Vegetable Stew',
  'https://en.wikibooks.org/wiki/Cookbook%3ASoy-Lentil-Vegetable_Stew'],

test('fast vegan seed keeps the approved source quantities and animal-free boundary', () => {
  assert.equal(lib.recipes.some(recipe => recipe.id === 'mung-bean-brown-rice-curry'), false);
  const recipe = lib.recipes.find(item => item.id === 'soy-lentil-vegetable-stew');
  assert.ok(recipe);
  assert.equal(recipe.total_time_minutes, 30);
  assert.deepEqual(recipe.core_ingredients, ['红扁豆', '大豆蛋白块', '西兰花', '红洋葱']);
  assert.deepEqual(recipe.substitution_slots, [{
    slot: '坚果或种子',
    replaces: ['花生'],
    allowed: ['葵花籽', '不加坚果或种子'],
  }]);
  assert.match(recipe.ratio_rules.join('；'), /40克.*80克.*250克.*500克/);
  assert.equal(recipe.core_ingredients.includes('花生'), false);
  const animalTerms = ['鸡肉', '鸭肉', '牛肉', '猪肉', '鱼', '虾', '鸡蛋', '牛奶', '奶油', '黄油', '蜂蜜'];
  assert.equal(
    [...recipe.core_ingredients, ...recipe.optional_ingredients]
      .some(name => animalTerms.some(term => name.includes(term))),
    false,
  );
  assert.deepEqual(recipe.source_refs[0], {
    usage: 'approved',
    title: 'Cookbook:Soy-Lentil-Vegetable Stew',
    url: 'https://en.wikibooks.org/wiki/Cookbook%3ASoy-Lentil-Vegetable_Stew',
    license: 'CC BY-SA 4.0',
    attribution: 'Wikibooks contributors, Cookbook:Soy-Lentil-Vegetable Stew',
    retrieved_at: '2026-07-17',
  });
});

test('lentil curry records an explicit one-pot adaptation', () => {
  const recipe = lib.recipes.find(item => item.id === 'lentil-potato-tomato-curry');
  assert.match(recipe.summary, /同一口锅/);
  assert.deepEqual(recipe.technique, [
    '同锅炒香土豆和香料',
    '加入番茄和红扁豆',
    '加入量化水同锅炖熟',
    '取出月桂叶',
  ]);
  assert.match(recipe.adaptation_note, /原始来源使用两个烹饪容器/);
  assert.doesNotMatch(`${recipe.summary}${recipe.technique.join('')}`, /扁豆先煮|土豆煎香/);
});

test('validator bounds optional recipe time and adaptation metadata', () => {
  const invalid = structuredClone(lib);
  invalid.recipes[0].total_time_minutes = 0;
  invalid.recipes[1].total_time_minutes = 61;
  invalid.recipes[2].total_time_minutes = 30.5;
  invalid.recipes[3].adaptation_note = '   ';
  invalid.recipes[4].adaptation_note = '改'.repeat(401);
  invalid.recipes[5].adaptation_note = 42;
  const errors = validateRecipeLibrary(invalid);
  assert.ok(errors.includes(`${invalid.recipes[0].id} total_time_minutes must be an integer from 1 to 60`));
  assert.ok(errors.includes(`${invalid.recipes[1].id} total_time_minutes must be an integer from 1 to 60`));
  assert.ok(errors.includes(`${invalid.recipes[2].id} total_time_minutes must be an integer from 1 to 60`));
  assert.ok(errors.includes(`${invalid.recipes[3].id} adaptation_note must contain 1 to 400 characters`));
  assert.ok(errors.includes(`${invalid.recipes[4].id} adaptation_note must contain 1 to 400 characters`));
  assert.ok(errors.includes(`${invalid.recipes[5].id} adaptation_note must contain 1 to 400 characters`));
});
```

- [ ] **Step 3: Run the tests and verify RED**

Run:

```bash
node --test tools/tests/recipe-library.test.mjs
```

Expected: failures name the missing new recipe and unsupported optional field bounds; existing tests remain green.

- [ ] **Step 4: Add minimal optional-field validation**

Inside the recipe loop in `validateRecipeLibrary()` add:

```js
if (recipe.total_time_minutes !== undefined
  && (!Number.isInteger(recipe.total_time_minutes)
    || recipe.total_time_minutes < 1
    || recipe.total_time_minutes > 60)) {
  errors.push(`${label} total_time_minutes must be an integer from 1 to 60`);
}
if (recipe.adaptation_note !== undefined
  && (typeof recipe.adaptation_note !== 'string'
    || recipe.adaptation_note.trim().length < 1
    || recipe.adaptation_note.trim().length > 400)) {
  errors.push(`${label} adaptation_note must contain 1 to 400 characters`);
}
```

- [ ] **Step 5: Replace the slow seed and rewrite the lentil technique**

Replace the complete `mung-bean-brown-rice-curry` object with:

```json
{
  "id": "soy-lentil-vegetable-stew",
  "family_id": "family-legume-vegetable-stew",
  "status": "approved",
  "name": "大豆扁豆西兰花炖锅",
  "cuisine": "家常纯素炖锅",
  "form": "炖锅",
  "summary": "用同一口锅炒香洋葱和蒜，再加入大豆蛋白块、红扁豆、西兰花与量化沸水，炖成饱腹纯素主餐。",
  "purposes": ["quick", "pantry", "batch"],
  "total_time_minutes": 30,
  "core_ingredients": ["红扁豆", "大豆蛋白块", "西兰花", "红洋葱"],
  "optional_ingredients": ["橄榄油", "蒜", "营养酵母", "花生", "葵花籽", "黑胡椒", "姜黄", "辣椒", "葛缕子", "姜"],
  "substitution_slots": [
    { "slot": "坚果或种子", "replaces": ["花生"], "allowed": ["葵花籽", "不加坚果或种子"] }
  ],
  "discouraged": [
    { "ingredients": ["未泡发的整粒干豆", "大块根茎"], "reason_type": "timing", "reason": "会明显延长这道快速炖锅的熟成时间。" }
  ],
  "technique": ["同锅炒香洋葱与蒜", "加入大豆蛋白块与红扁豆", "加入量化沸水", "同锅炖至扁豆软烂"],
  "ratio_rules": [
    "1大份使用大豆蛋白块40克、红扁豆80克、西兰花250克、沸水500克",
    "所有留在成品中的液体按份数等比例缩放并列入食材表"
  ],
  "safety_rules": ["红扁豆必须煮至软烂无硬芯", "大豆蛋白块必须吸水变软并彻底加热"],
  "source_refs": [
    {
      "usage": "approved",
      "title": "Cookbook:Soy-Lentil-Vegetable Stew",
      "url": "https://en.wikibooks.org/wiki/Cookbook%3ASoy-Lentil-Vegetable_Stew",
      "license": "CC BY-SA 4.0",
      "attribution": "Wikibooks contributors, Cookbook:Soy-Lentil-Vegetable Stew",
      "retrieved_at": "2026-07-17"
    }
  ]
}
```

Update only these fields on `lentil-potato-tomato-curry`:

```json
"summary": "在同一口锅中先炒香土豆和香料，再加入番茄、红扁豆与量化水，炖至扁豆软烂且土豆无硬芯。",
"technique": ["同锅炒香土豆和香料", "加入番茄和红扁豆", "加入量化水同锅炖熟", "取出月桂叶"],
"ratio_rules": ["红扁豆与水体积约为1:4，生成时水必须换算成数字克数", "土豆切小块以便与红扁豆同步熟成"],
"adaptation_note": "原始来源使用两个烹饪容器；一锅出将其改为同一口锅先炒香土豆和香料，再加入番茄、红扁豆与量化水炖熟。"
```

- [ ] **Step 6: Run GREEN and source gates**

Run:

```bash
node --test tools/tests/recipe-library.test.mjs
node tools/check-recipes.mjs
git diff --check -- tools/data/recipe-library.json tools/lib/recipe-library-validator.mjs tools/tests/recipe-library.test.mjs
```

Expected: recipe tests pass; checker reports 9 families and 12 approved recipes; no source or whitespace errors.

- [ ] **Step 7: Commit the non-overlapping Task 1 files**

Run:

```bash
git add tools/data/recipe-library.json tools/lib/recipe-library-validator.mjs tools/tests/recipe-library.test.mjs
git diff --cached --name-only
git diff --cached --check
git commit -m "feat: replace slow vegan recipe seed"
git diff --binary | git patch-id --stable
```

Expected staged names are exactly the three listed files; after commit, the user-owned unstaged patch-id remains unchanged.

### Task 2: Authoritative Worker grounding and validation

**Files:**
- Modify: `worker/src/worker.js` in `buildRecipeGrounding()`, retained-water helpers, `attachGroundedMetadata()`, `buildPrompt()`, and final preflight copy.
- Modify: `tools/tests/worker-recipe.test.mjs`

**Interfaces:**
- Produces trusted top-level `adaptation_note: string` on every grounded response.
- Extends `buildRecipeGrounding(selection): string` with optional time/adaptation lines and exact retained-liquid rules.
- Extends `validationStepUsesRetainedWater(step): boolean` to recognize explicitly retained soaking liquid.
- Preserves public selector and validator signatures and does not modify grams or steps.

- [ ] **Step 1: Snapshot the combined Worker state**

Run:

```bash
SNAPSHOT=$(mktemp -d /tmp/yiguochu-fast-vegan-worker-o.XXXXXX)
mkdir -p "$SNAPSHOT/worker/src" "$SNAPSHOT/tools/tests"
cp worker/src/worker.js "$SNAPSHOT/worker/src/worker.js"
cp tools/tests/worker-recipe.test.mjs "$SNAPSHOT/tools/tests/worker-recipe.test.mjs"
printf '%s\n' "$SNAPSHOT" > /tmp/yiguochu-fast-vegan-worker-snapshot
git diff --cached --name-only
git diff --binary | git patch-id --stable
```

Expected: empty real index and the protected patch-id.

- [ ] **Step 2: Add failing Worker tests**

Add:

```js
test('trusted recipe time adaptation and retained-liquid rules enter grounding', () => {
  const recipe = lib.recipes.find(item => item.id === 'soy-lentil-vegetable-stew');
  const [selection] = selectRecipeCandidates(lib, {
    pantry: [...recipe.core_ingredients], purpose: 'quick', dislikes: [],
  });
  const grounding = buildRecipeGrounding(selection);
  assert.match(grounding, /总时长基准: 30分钟/);
  assert.match(grounding, /40克.*80克.*250克.*500克/);
  assert.match(grounding, /泡发水.*计入总液体克数/);
  assert.match(grounding, /未计量的.*浸泡液.*不得保留/);
});

test('grounded metadata overwrites forged adaptation notes', async () => {
  const note = '原始来源使用两个烹饪容器；一锅出改为同锅先炒后炖。';
  const recipe = groundedFixtureRecipe({ adaptation_note: note, total_time_minutes: 30 });
  const { body } = await runGenerateRequest({
    recipeLib: fixtureLib([recipe]),
    meal: generatedMeal({ adaptation_note: 'model-forged-adaptation' }),
  });
  assert.equal(body.adaptation_note, note);
  assert.equal(JSON.stringify(body).includes('model-forged-adaptation'), false);
  const plain = groundedFixtureRecipe({ adaptation_note: undefined });
  const result = await runGenerateRequest({ recipeLib: fixtureLib([plain]) });
  assert.equal(result.body.adaptation_note, '');
});

test('retained soaking liquid requires a measured water ingredient', () => {
  const selection = correspondenceSelection();
  const missing = validateGroundedMeal({
    ingredients: [{ name: '红扁豆', grams: 80 }],
    steps: ['红扁豆浸泡后，保留泡发水并同锅炖熟。'],
  }, selection, {});
  assert.ok(missing.includes('step_ingredient_missing:水'));
  const measured = validateGroundedMeal({
    ingredients: [{ name: '红扁豆', grams: 80 }, { name: '水', grams: 500 }],
    steps: ['红扁豆浸泡后，将泡发水计入500克水并同锅炖熟。'],
  }, selection, {});
  assert.equal(measured.includes('step_ingredient_missing:水'), false);
  for (const step of ['红扁豆浸泡后倒掉泡发水并沥干。', '无需保留泡发水，倒掉并沥干。']) {
    const flags = validateGroundedMeal({
      ingredients: [{ name: '红扁豆', grams: 80 }], steps: [step],
    }, selection, {});
    assert.equal(flags.includes('step_ingredient_missing:水'), false, step);
  }
});

test('ordinary quick prompt uses an honest thirty-minute threshold', async () => {
  const recipe = groundedFixtureRecipe({ total_time_minutes: 30 });
  const { upstreamBodies } = await runGenerateRequest({
    recipeLib: fixtureLib([recipe]), constraints: { purpose: 'quick' },
  });
  const prompt = upstreamBodies[0].messages[1].content;
  assert.match(prompt, /总时长尽量≤30分钟/);
  assert.doesNotMatch(prompt, /总时长尽量≤25分钟/);
});
```

- [ ] **Step 3: Run Worker tests and verify RED**

Run:

```bash
node --test tools/tests/worker-recipe.test.mjs
```

Expected: the four new behaviors fail before implementation; existing tests pass.

- [ ] **Step 4: Implement grounding lines and trusted metadata**

In `buildRecipeGrounding()` construct and insert:

```js
const timeLines = Number.isInteger(recipe.total_time_minutes)
  ? [`总时长基准: ${recipe.total_time_minutes}分钟`] : [];
const adaptationLines = typeof recipe.adaptation_note === 'string' && recipe.adaptation_note.trim()
  ? [`改编说明: ${sanitizePromptText(recipe.adaptation_note, 400)}`] : [];
```

Place `...timeLines` after the base-recipe line and `...adaptationLines` after safety rules. Replace the retained-water contract with:

```js
'食用油、盐、胡椒和留在成品中的水都必须在 ingredients 有同义 name 和大于0的数字 grams；洗、淘、泡后明确倒掉的水可不列。泡发水、浸泡水或浸泡液若保留进成品，必须计入总液体克数并列入 ingredients；未计量的泡发水或浸泡液不得保留。',
```

Update the existing Worker prompt assertion from `/洗、淘、泡后倒掉的水可不列/` to `/洗、淘、泡后明确倒掉的水可不列/`, and add:

```js
assert.match(prompt, /泡发水、浸泡水或浸泡液若保留进成品/);
assert.match(prompt, /未计量的泡发水或浸泡液不得保留/);
```

In `attachGroundedMetadata()` add the server overwrite before validation:

```js
meal.adaptation_note = typeof recipe.adaptation_note === 'string'
  ? recipe.adaptation_note.trim().slice(0, 400)
  : '';
```

- [ ] **Step 5: Detect explicitly retained soaking liquid**

Add beside the existing water regexes:

```js
const VALIDATION_RETAINED_SOAKING_LIQUID_RE = /(?:保留|留用|留下|不(?:要)?倒掉)(?:[^，,。；;！？!?]{0,20}?)(?:泡发水|浸泡水|泡豆水|泡菇水|浸泡液|泡发液)/g;
```

At the start of each clause in `validationStepUsesRetainedWater()` add:

```js
for (const match of clause.matchAll(new RegExp(VALIDATION_RETAINED_SOAKING_LIQUID_RE.source, 'g'))) {
  if (!validationActionNegated(clause, match.index)) return true;
}
```

Do not change `repairRiceAllergyCompleteMain()` or add a general retained-water repair.

- [ ] **Step 6: Align quick prompt and final preflight**

Change only ordinary quick copy in `buildPrompt()`:

```js
quick: '本次重点是快点吃上: 步骤≤3、食材≤8、总时长尽量≤30分钟, 少切配、少洗锅。',
```

In the final preflight, replace the first retained-water sentence with the following 52-character copy so the existing `FINAL_RECIPE_PREFLIGHT.length <= 500` gate remains true:

```text
留存液体须列入ingredients数字grams；泡发/浸泡液须计入总量，未计量不得保留，倒掉可不列。
```

Apply the same replacement to the `FINAL_RECIPE_PREFLIGHT` fixture in `tools/tests/worker-recipe.test.mjs`, and replace its two old retained-water assertions with:

```js
assert.match(FINAL_RECIPE_PREFLIGHT, /留存液体须列入ingredients数字grams/);
assert.match(FINAL_RECIPE_PREFLIGHT, /泡发\/浸泡液须计入总量/);
assert.match(FINAL_RECIPE_PREFLIGHT, /未计量不得保留/);
```

Leave `SWAP_HINT.easier` and the overall 40/45-minute safety ceiling unchanged.

- [ ] **Step 7: Run Worker GREEN and focused gates**

Run:

```bash
node --check worker/src/worker.js
node --test tools/tests/worker-recipe.test.mjs
node tools/check-recipes.mjs
git diff --check
```

Expected: zero failures; recipe checker still reports 9 families/12 recipes.

- [ ] **Step 8: Commit only Task 2 through H/O/A/T**

Run:

```bash
SNAPSHOT=$(cat /tmp/yiguochu-fast-vegan-worker-snapshot)
TMP_DIR=$(mktemp -d /tmp/yiguochu-fast-vegan-worker-commit.XXXXXX)
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
GIT_INDEX_FILE="$TASK_INDEX" git commit -m "fix: ground trusted one-pot liquid rules"
git read-tree HEAD
git diff --cached --name-only
git diff --binary | git patch-id --stable
```

Expected temporary staged files: `worker/src/worker.js` and `tools/tests/worker-recipe.test.mjs`; real index empty after commit; protected patch-id unchanged.

### Task 3: Python parity

**Files:**
- Modify: `ai_proxy.py` in `build_recipe_grounding()`, retained-water helpers, `build_prompt()`, final preflight, and `attach_grounded_metadata()`.
- Modify: `tools/tests/recipe-parity.test.mjs`

**Interfaces:**
- Consumes the exact Worker strings and behavior from Task 2.
- Produces identical prompt, grounding, `adaptation_note`, retained-water flags, and field ordering for the same input.

- [ ] **Step 1: Snapshot Python and parity tests**

```bash
SNAPSHOT=$(mktemp -d /tmp/yiguochu-fast-vegan-python-o.XXXXXX)
mkdir -p "$SNAPSHOT/tools/tests"
cp ai_proxy.py "$SNAPSHOT/ai_proxy.py"
cp tools/tests/recipe-parity.test.mjs "$SNAPSHOT/tools/tests/recipe-parity.test.mjs"
printf '%s\n' "$SNAPSHOT" > /tmp/yiguochu-fast-vegan-python-snapshot
git diff --cached --name-only
git diff --binary | git patch-id --stable
```

- [ ] **Step 2: Add failing parity coverage**

Extend the no-network preparation test's recipe and forged meal:

```js
const recipe = groundedRecipe({
  total_time_minutes: 30,
  adaptation_note: '原始来源使用两个烹饪容器；一锅出改为同锅先炒后炖。',
});
const meal = generatedMeal({
  adaptation_note: 'model-forged-adaptation',
  steps: ['鸡肉翻炒至表面变色，加入洋葱和大米焖至米熟。'],
  prep_minutes: 30,
});
```

Add `adaptation_note` to the trusted-field equality loop and add assertions:

```js
assert.match(py.grounding, /总时长基准: 30分钟/);
assert.match(py.grounding, /改编说明:/);
assert.match(py.prompt, /总时长尽量≤30分钟/);
assert.match(py.prompt, /泡发水、浸泡水或浸泡液若保留/);
assert.equal(py.meal.adaptation_note, recipe.adaptation_note);
assert.equal(JSON.stringify(py.meal).includes('model-forged-adaptation'), false);
```

Add retained-liquid parity cases:

```js
test('Python retained soaking-liquid detection exactly matches Worker', () => {
  const cases = [
    { ingredients: ['红扁豆'], steps: ['保留泡发水并同锅炖熟。'] },
    { ingredients: ['红扁豆', '水'], steps: ['将泡发水计入500克水并同锅炖熟。'] },
    { ingredients: ['红扁豆'], steps: ['浸泡后倒掉泡发水并沥干。'] },
    { ingredients: ['红扁豆'], steps: ['无需保留泡发水，倒掉并沥干。'] },
  ];
  for (const item of cases) {
    const meal = {
      ingredients: item.ingredients.map(name => ({ name, grams: name === '水' ? 500 : 80 })),
      steps: item.steps,
    };
    const selection = selectRecipeCandidates(lib, { pantry: [], dislikes: [] })[0];
    const js = validateGroundedMeal(meal, selection, {});
    const py = pythonCall('validate', { library: lib, constraints: {}, meal });
    assert.deepEqual(py, js, item.steps[0]);
  }
});
```

- [ ] **Step 3: Run parity tests and verify RED**

```bash
node --test tools/tests/recipe-parity.test.mjs
```

Expected: prompt, grounding, adaptation metadata, and retained-liquid cases fail before the Python mirror is added.

- [ ] **Step 4: Mirror Worker behavior exactly in Python**

In `build_recipe_grounding()` add:

```python
time_lines = (
    [f"总时长基准: {recipe['total_time_minutes']}分钟"]
    if isinstance(recipe.get('total_time_minutes'), int)
    and not isinstance(recipe.get('total_time_minutes'), bool)
    else []
)
adaptation = sanitize_prompt_text(recipe.get('adaptation_note'), 400)
adaptation_lines = [f'改编说明: {adaptation}'] if adaptation else []
```

Insert `*time_lines` after `recipe_line` and `*adaptation_lines` after the safety-rule line. Use the exact retained-liquid contract from Task 2.

Add:

```python
_VALIDATION_RETAINED_SOAKING_LIQUID_RE = re.compile(
    r'(?:保留|留用|留下|不(?:要)?倒掉)(?:[^，,。；;！？!?]{0,20}?)(?:泡发水|浸泡水|泡豆水|泡菇水|浸泡液|泡发液)'
)
```

At the start of each clause in `_validation_step_uses_retained_water()`:

```python
for match in _VALIDATION_RETAINED_SOAKING_LIQUID_RE.finditer(clause):
    if not _validation_action_negated(clause, match.start()):
        return True
```

Change ordinary quick copy to `总时长尽量≤30分钟`, mirror the final preflight text exactly in both `ai_proxy.py` and the `FINAL_RECIPE_PREFLIGHT` fixture in `tools/tests/recipe-parity.test.mjs`, and add before Python validation flags:

```python
adaptation_note = recipe.get('adaptation_note')
meal['adaptation_note'] = (
    adaptation_note.strip()[:400]
    if isinstance(adaptation_note, str)
    else ''
)
```

In the existing no-network parity assertions, replace `/洗、淘、泡后倒掉的水可不列/` with `/洗、淘、泡后明确倒掉的水可不列/` and add exact assertions for `/泡发水、浸泡水或浸泡液若保留进成品/` and `/未计量的泡发水或浸泡液不得保留/`.

- [ ] **Step 5: Run complete parity GREEN**

```bash
python3 -c "import ast, pathlib; ast.parse(pathlib.Path('ai_proxy.py').read_text(encoding='utf-8'))"
node --test tools/tests/recipe-parity.test.mjs
node --test tools/tests/worker-recipe.test.mjs tools/tests/recipe-parity.test.mjs
git diff --check
```

Expected: zero failures; Worker and Python strings and flags are equal.

- [ ] **Step 6: Commit only Task 3 through H/O/A/T**

```bash
SNAPSHOT=$(cat /tmp/yiguochu-fast-vegan-python-snapshot)
TMP_DIR=$(mktemp -d /tmp/yiguochu-fast-vegan-python-commit.XXXXXX)
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
GIT_INDEX_FILE="$TASK_INDEX" git commit -m "fix: mirror one-pot liquid grounding locally"
git read-tree HEAD
git diff --cached --name-only
git diff --binary | git patch-id --stable
```

Expected temporary staged files: `ai_proxy.py` and `tools/tests/recipe-parity.test.mjs`; protected patch-id unchanged.

### Task 4: Frontend adaptation evidence and honest quick scoring

**Files:**
- Modify: `index.html` in `mapDish()`, `recipeBasisBlock()`, and `scoreDish()`.
- Modify: `tools/tests/frontend-recipe-contract.test.mjs`

**Interfaces:**
- Consumes server top-level `adaptation_note`.
- Produces bounded `dish.adaptationNote` and escaped “单锅改编说明” inside the existing evidence block.
- Changes ordinary quick score cutoff from `>25` to `>30`; leaves `SWAP_HINT.easier` at 25.

- [ ] **Step 1: Snapshot frontend and tests**

```bash
SNAPSHOT=$(mktemp -d /tmp/yiguochu-fast-vegan-frontend-o.XXXXXX)
mkdir -p "$SNAPSHOT/tools/tests"
cp index.html "$SNAPSHOT/index.html"
cp tools/tests/frontend-recipe-contract.test.mjs "$SNAPSHOT/tools/tests/frontend-recipe-contract.test.mjs"
printf '%s\n' "$SNAPSHOT" > /tmp/yiguochu-fast-vegan-frontend-snapshot
git diff --cached --name-only
git diff --binary | git patch-id --stable
```

- [ ] **Step 2: Add failing frontend tests**

Add `adaptation_note: ''` to the response fixture and add:

```js
test('frontend bounds and escapes trusted one-pot adaptation evidence', () => {
  const { context } = loadFrontend();
  const input = meal({ adaptation_note: '  <img src=x onerror=alert(1)> 单锅改编  ' });
  const mapped = JSON.parse(evaluate(context,
    `JSON.stringify((() => { const d = mapDish(${JSON.stringify(input)}, {servings:1}); return ({
      adaptationNote:d.adaptationNote, html:recipeBasisBlock(d)
    }); })())`));
  assert.equal(mapped.adaptationNote, '<img src=x onerror=alert(1)> 单锅改编');
  assert.match(mapped.html, /单锅改编说明/);
  assert.match(mapped.html, /&lt;img src=x onerror=alert\(1\)&gt; 单锅改编/);
  assert.doesNotMatch(mapped.html, /<img/);
});

test('frontend limits adaptation notes to four hundred characters', () => {
  const { context } = loadFrontend();
  const note = '改'.repeat(450);
  const length = evaluate(context,
    `mapDish(${JSON.stringify(meal({ adaptation_note: note }))}, {servings:1}).adaptationNote.length`);
  assert.equal(length, 400);
});

test('ordinary quick accepts thirty minutes and rejects thirty-one', () => {
  const { context } = loadFrontend();
  const values = JSON.parse(evaluate(context, `JSON.stringify((() => {
    state.profile = { purpose:'quick', servings:'1', pantry:'', dislikes:'' };
    const base = { name:'炖菜', form:'炖锅', steps:['同锅煮熟'],
      ingredients:[{name:'红扁豆'},{name:'西兰花'}], kcal:650, purpose:'quick',
      _targets:{kcal:650}, validationFlags:[] };
    return [scoreDish({...base, minutes:30}).ok, scoreDish({...base, minutes:31}).ok];
  })())`));
  assert.deepEqual(values, [true, false]);
});
```

- [ ] **Step 3: Run frontend tests and verify RED**

```bash
node --test tools/tests/frontend-recipe-contract.test.mjs
```

Expected: missing `adaptationNote` and 25-minute quick scoring cause the three new tests to fail.

- [ ] **Step 4: Implement bounded mapping, display, and scoring**

In `mapDish()` add:

```js
adaptationNote: boundedText(res.adaptation_note, 400),
```

In `recipeBasisBlock()` add before the source details:

```js
const adaptation = boundedText(d.adaptationNote, 400);
const adaptationLine = adaptation
  ? '<p class="basis-line"><strong>单锅改编说明：</strong>' + esc(adaptation) + '</p>'
  : '';
```

Include `adaptationLine` between `unusedLine` and `<details>`. In `scoreDish()` change:

```js
if (d.purpose === 'quick' && ((d.steps || []).length > 3 || (d.ingredients || []).length > 8 || d.minutes > 30)) fails++;
```

Do not change `SWAP_HINT.easier`.

- [ ] **Step 5: Run frontend GREEN**

```bash
node --test tools/tests/frontend-recipe-contract.test.mjs
git diff --check -- index.html tools/tests/frontend-recipe-contract.test.mjs
```

Expected: all frontend contract tests pass; hostile adaptation text is escaped.

- [ ] **Step 6: Commit only Task 4 through H/O/A/T**

```bash
SNAPSHOT=$(cat /tmp/yiguochu-fast-vegan-frontend-snapshot)
TMP_DIR=$(mktemp -d /tmp/yiguochu-fast-vegan-frontend-commit.XXXXXX)
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
GIT_INDEX_FILE="$TASK_INDEX" git commit -m "feat: show trusted one-pot adaptation"
git read-tree HEAD
git diff --cached --name-only
git diff --binary | git patch-id --stable
```

Expected temporary staged files: `index.html` and the frontend test; protected patch-id unchanged.

### Task 5: Regenerate the 100-case corpus and review sheet

**Files:**
- Modify: `tools/build-recipe-regression.mjs`
- Regenerate: `tools/data/recipe-regression.json`
- Modify: `docs/recipe-validation-review.md`

**Interfaces:**
- Preserves exactly 48 base, 20 adversarial, and 32 cycle cases.
- Preserves exactly six known gaps: four diet and two numeric-ratio.
- Produces new recipe IDs in base 017–020 and cycles 005/017/029.

- [ ] **Step 1: Add the new frozen oracle and adversarial recipe ID**

Replace the old base-020 oracle with:

```js
'base-020-soy-lentil-vegetable-stew-fixed-core-dislike': Object.freeze({
  base_recipe_id: 'soy-lentil-vegetable-stew', disliked_fixed_core: '红扁豆',
  expected_recipe_ids: Object.freeze(['chinese-congee']),
  forbidden_recipe_ids: Object.freeze(['soy-lentil-vegetable-stew']),
}),
```

Replace the vegan adversarial B row with:

```js
['b', 'soy-lentil-vegetable-stew', '牛肉', 'batch', 4],
```

- [ ] **Step 2: Rebuild and verify the corpus**

```bash
node tools/build-recipe-regression.mjs
node tools/run-recipe-regression.mjs
rg -n "mung-bean-brown-rice-curry|绿豆糙米蔬菜咖喱锅" tools/data/recipe-regression.json tools/build-recipe-regression.mjs
```

Expected: builder prints `recipe-regression.json: 100 cases`; runner prints `100/100 static cases passed`; final search has no matches; summary still reports six known gaps.

- [ ] **Step 3: Update only the affected review rows**

Replace:

```markdown
| `base-017-mung-bean-brown-rice-curry-exact-core` | 绿豆糙米蔬菜咖喱锅 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `cycle-005-mung-bean-brown-rice-curry-quick-2` | 绿豆糙米蔬菜咖喱锅 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
```

with:

```markdown
| `base-017-soy-lentil-vegetable-stew-exact-core` | 大豆扁豆西兰花炖锅 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
| `cycle-005-soy-lentil-vegetable-stew-quick-2` | 大豆扁豆西兰花炖锅 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | □通过 / □不通过 | |
```

Keep every checkbox blank; do not pre-approve any human-review result.

- [ ] **Step 4: Run corpus and review consistency checks**

```bash
node tools/check-recipes.mjs
node tools/run-recipe-regression.mjs
test "$(rg -c '^\| `(?:base|adversarial|cycle)-' docs/recipe-validation-review.md)" -eq 30
git diff --check -- tools/build-recipe-regression.mjs tools/data/recipe-regression.json docs/recipe-validation-review.md
```

Expected: 9 families/12 recipes; 100/100 static; exactly 30 blank review rows.

- [ ] **Step 5: Commit Task 5**

```bash
git add tools/build-recipe-regression.mjs tools/data/recipe-regression.json docs/recipe-validation-review.md
git diff --cached --name-only
git diff --cached --check
git commit -m "test: refresh vegan recipe regression corpus"
git diff --binary | git patch-id --stable
```

Expected: only the three non-overlapping files are committed; protected user patch remains unchanged.

### Task 6: Full offline gate, six known gaps, 30-case review, and mobile evidence

**Files:**
- Modify after actual review: `docs/recipe-validation-review.md`
- No tracked production changes unless a failed gate triggers a new RED/GREEN fix commit.
- External evidence: `/tmp/yiguochu-fast-vegan-live.*`

**Interfaces:**
- Consumes committed Tasks 1–5.
- Produces an evidence directory with one request, one response, one metadata record, and SHA-256 hashes per live case.
- Does not deploy.

- [ ] **Step 1: Run the full offline gate**

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
git diff --cached --name-only
git diff --binary | git patch-id --stable
lsof -nP -iTCP:8765 -sTCP:LISTEN || true
lsof -nP -iTCP:8766 -sTCP:LISTEN || true
```

Expected: zero test failures; food check 0 errors; recipe check 9/12; static 100/100 with six known gaps; real index empty; protected patch-id unchanged; existing 8765 PID unchanged; 8766 free.

- [ ] **Step 2: Generate exactly six no-retry request files outside the repo**

Run:

```bash
EVIDENCE=$(mktemp -d /tmp/yiguochu-fast-vegan-live6.XXXXXX)
printf '%s\n' "$EVIDENCE" > /tmp/yiguochu-fast-vegan-live6-path
EVIDENCE="$EVIDENCE" node --input-type=module <<'NODE'
import fs from 'node:fs';
import path from 'node:path';
const corpus = JSON.parse(fs.readFileSync('tools/data/recipe-regression.json', 'utf8'));
const cases = corpus.filter(item => item.known_gap);
if (cases.length !== 6) throw new Error(`expected 6 known gaps, got ${cases.length}`);
for (const item of cases) {
  const request = {
    meal_name: '这次的一锅主餐',
    targets: { kcal: 650 * item.servings, p: 25 * item.servings, fb: 8 * item.servings },
    constraints: {
      purpose: item.purpose,
      servings: item.servings,
      pantry: item.pantry,
      dislikes: item.dislikes,
      ...(item.diet ? { diet: item.diet } : {}),
    },
  };
  fs.writeFileSync(path.join(process.env.EVIDENCE, `${item.id}.request.json`), `${JSON.stringify(request)}\n`);
}
NODE
test "$(find "$EVIDENCE" -name '*.request.json' | wc -l | tr -d ' ')" -eq 6
```

- [ ] **Step 3: Start only the owned 8766 proxy and call each case once**

```bash
set -e
EVIDENCE=$(cat /tmp/yiguochu-fast-vegan-live6-path)
test -z "$(lsof -tiTCP:8766 -sTCP:LISTEN || true)"
PORT=8766 python3 ai_proxy.py > "$EVIDENCE/proxy.log" 2>&1 &
PROXY_PID=$!
printf '%s\n' "$PROXY_PID" > "$EVIDENCE/proxy.pid"
for attempt in 1 2 3 4 5; do
  curl --silent --show-error http://127.0.0.1:8766/health >/dev/null && break
  sleep 1
done
curl --silent --show-error http://127.0.0.1:8766/health \
  | jq -e '.status == "ok" and .provider == "deepseek" and .model == "deepseek-chat"' >/dev/null
index=0
for request in "$EVIDENCE"/*.request.json; do
  index=$((index + 1))
  stem=$(basename "$request" .request.json)
  set +e
  http_status=$(curl --silent --show-error --max-time 120 \
    --output "$EVIDENCE/$stem.raw.json" --write-out '%{http_code}' \
    --request POST --header 'Content-Type: application/json' \
    --data-binary @"$request" http://127.0.0.1:8766/generate-meal)
  curl_exit=$?
  set -e
  jq -n --argjson call_index "$index" --arg http_status "$http_status" \
    --argjson curl_exit "$curl_exit" \
    '{call_index:$call_index,http_status:($http_status|tonumber),curl_exit:$curl_exit,retry:false}' \
    > "$EVIDENCE/$stem.meta.json"
done
test "$index" -eq 6
kill "$PROXY_PID"
wait "$PROXY_PID" 2>/dev/null || true
test -z "$(lsof -tiTCP:8766 -sTCP:LISTEN || true)"
```

There is no `curl --retry`; each request file is posted once. Never kill or restart port 8765.

- [ ] **Step 4: Adjudicate all six before any 30-case call**

For every response require HTTP 200, valid JSON, non-empty `base_recipe_id`, non-empty `pairing_basis`, non-empty approved `source_refs`, and empty `validation_flags`. Manually record:

- both gluten-free cases exclude noodles and other obvious gluten foods;
- both vegan cases exclude the animal pantry item and all other animal-derived foods;
- all six use one cooking vessel;
- the congee and jollof cases use ingredient-table liquid grams consistent with their grounding;
- no unmeasured soaking liquid remains;
- every discarded pantry item is absent from ingredients, steps, and `why`;
- meat, seafood, and egg, if present, have explicit safe cooked endpoints.

If any check fails, stop. Add a focused failing test, implement the smallest fix, commit it with the appropriate H/O/A/T method, rerun the complete offline gate, and create a new evidence directory; never retry a failed model call in place.

- [ ] **Step 5: Run the fixed 30 review cases only after six-case approval**

Create the requests and frozen expectations from the 30 blank review rows:

```bash
EVIDENCE30=$(mktemp -d /tmp/yiguochu-fast-vegan-live30.XXXXXX)
printf '%s\n' "$EVIDENCE30" > /tmp/yiguochu-fast-vegan-live30-path
EVIDENCE30="$EVIDENCE30" node --input-type=module <<'NODE'
import fs from 'node:fs';
import path from 'node:path';
const review = fs.readFileSync('docs/recipe-validation-review.md', 'utf8');
const ids = [...review.matchAll(/^\| `([^`]+)`/gm)].map(match => match[1]);
if (ids.length !== 30 || new Set(ids).size !== 30) throw new Error(`expected 30 unique review IDs, got ${ids.length}`);
const corpus = JSON.parse(fs.readFileSync('tools/data/recipe-regression.json', 'utf8'));
const byId = new Map(corpus.map(item => [item.id, item]));
for (const id of ids) {
  const item = byId.get(id);
  if (!item) throw new Error(`review ID missing from corpus: ${id}`);
  const constraints = {
    purpose: item.purpose,
    servings: item.servings,
    pantry: item.pantry,
    dislikes: item.dislikes,
    ...(item.diet ? { diet: item.diet } : {}),
    ...(item.recent_families ? { recent_families: item.recent_families } : {}),
    ...(item.recent_base_recipes ? { recent_base_recipes: item.recent_base_recipes } : {}),
  };
  const request = {
    meal_name: '这次的一锅主餐',
    targets: { kcal: 650 * item.servings, p: 25 * item.servings, fb: 8 * item.servings },
    constraints,
  };
  const expected = {
    case_id: id,
    expected_recipe_ids: item.expected_recipe_ids,
    forbidden_recipe_ids: item.forbidden_recipe_ids,
    unused_pantry_candidates: item.pantry,
  };
  fs.writeFileSync(path.join(process.env.EVIDENCE30, `${id}.request.json`), `${JSON.stringify(request)}\n`);
  fs.writeFileSync(path.join(process.env.EVIDENCE30, `${id}.expected.json`), `${JSON.stringify(expected)}\n`);
}
NODE
test "$(find "$EVIDENCE30" -name '*.request.json' | wc -l | tr -d ' ')" -eq 30
test "$(find "$EVIDENCE30" -name '*.expected.json' | wc -l | tr -d ' ')" -eq 30
```

Start a fresh owned proxy and post each request exactly once:

```bash
set -e
EVIDENCE30=$(cat /tmp/yiguochu-fast-vegan-live30-path)
test -z "$(lsof -tiTCP:8766 -sTCP:LISTEN || true)"
PORT=8766 python3 ai_proxy.py > "$EVIDENCE30/proxy.log" 2>&1 &
PROXY_PID=$!
printf '%s\n' "$PROXY_PID" > "$EVIDENCE30/proxy.pid"
for attempt in 1 2 3 4 5; do
  curl --silent --show-error http://127.0.0.1:8766/health >/dev/null && break
  sleep 1
done
curl --silent --show-error http://127.0.0.1:8766/health \
  | jq -e '.status == "ok" and .provider == "deepseek" and .model == "deepseek-chat"' >/dev/null
index=0
for request in "$EVIDENCE30"/*.request.json; do
  index=$((index + 1))
  stem=$(basename "$request" .request.json)
  set +e
  http_status=$(curl --silent --show-error --max-time 120 \
    --output "$EVIDENCE30/$stem.raw.json" --write-out '%{http_code}' \
    --request POST --header 'Content-Type: application/json' \
    --data-binary @"$request" http://127.0.0.1:8766/generate-meal)
  curl_exit=$?
  set -e
  jq -n --argjson call_index "$index" --arg http_status "$http_status" \
    --argjson curl_exit "$curl_exit" \
    '{call_index:$call_index,http_status:($http_status|tonumber),curl_exit:$curl_exit,retry:false}' \
    > "$EVIDENCE30/$stem.meta.json"
done
test "$index" -eq 30
kill "$PROXY_PID"
wait "$PROXY_PID" 2>/dev/null || true
test -z "$(lsof -tiTCP:8766 -sTCP:LISTEN || true)"
test "$(find "$EVIDENCE30" -name '*.raw.json' | wc -l | tr -d ' ')" -eq 30
```

Run the frozen structural checks:

```bash
set -e
EVIDENCE30=$(cat /tmp/yiguochu-fast-vegan-live30-path)
for raw in "$EVIDENCE30"/*.raw.json; do
  stem=$(basename "$raw" .raw.json)
  jq -e --slurpfile expected "$EVIDENCE30/$stem.expected.json" '
    (.base_recipe_id as $id | ($expected[0].expected_recipe_ids | index($id)) != null)
    and (.base_recipe_id as $id | ($expected[0].forbidden_recipe_ids | index($id)) == null)
    and ((.pairing_basis // "") | length > 0)
    and ((.source_refs // []) | length > 0)
    and ([.source_refs[] | select(.usage == "approved" and (.url | startswith("https://")))] | length > 0)
    and ((.validation_flags // []) | length == 0)
  ' "$raw" >/dev/null
  jq -e '.http_status == 200 and .curl_exit == 0 and .retry == false' "$EVIDENCE30/$stem.meta.json" >/dev/null
done
```

Manually require for each response:

```text
HTTP 200
base_recipe_id is one of expected_recipe_ids
pairing_basis is non-empty
source_refs contains an approved source
validation_flags is empty
unused_pantry is absent from ingredients, steps, and why
```

Keep `docs/recipe-validation-review.md` blank until actual results are reviewed. Store raw evidence outside the repository and run:

```bash
EVIDENCE30=$(cat /tmp/yiguochu-fast-vegan-live30-path)
shasum -a 256 "$EVIDENCE30"/*.json > "$EVIDENCE30/sha256.txt"
```

- [ ] **Step 6: Perform the mobile evidence check without deployment**

Copy one unedited saved lentil response into an ignored browser fixture, then start a static server on an owned free port:

```bash
set -e
EVIDENCE=$(cat /tmp/yiguochu-fast-vegan-live6-path)
LENTIL_RAW=''
for raw in "$EVIDENCE"/*.raw.json; do
  if jq -e '.base_recipe_id == "lentil-potato-tomato-curry"' "$raw" >/dev/null; then
    LENTIL_RAW="$raw"
    break
  fi
done
test -n "$LENTIL_RAW"
mkdir -p .superpowers/sdd
cp "$LENTIL_RAW" .superpowers/sdd/mobile-response.json
python3 -m http.server 8081 --bind 127.0.0.1 > /tmp/yiguochu-fast-vegan-static.log 2>&1 &
STATIC_PID=$!
printf '%s\n' "$STATIC_PID" > /tmp/yiguochu-fast-vegan-static.pid
```

Using browser automation, set viewport to `390x844`, open `http://127.0.0.1:8081/`, and inject one saved successful `lentil-potato-tomato-curry` response through this exact page-context operation:

```js
(async () => {
  const response = await fetch('/.superpowers/sdd/mobile-response.json').then(value => value.json());
  const dish = mapDish(response, { servings: 2 });
  state.dish = dish;
  state.items = dish.ingredients.map(item => ({ ...item }));
  state.view = 'result';
  render();
  return { baseRecipeId: dish.baseRecipeId, adaptationNote: dish.adaptationNote };
})()
```

Expected returned object: `baseRecipeId` equals `lentil-potato-tomato-curry` and `adaptationNote` is non-empty. Verify at 390 px width:

- “搭配依据”“这次没用”“参考来源”和“单锅改编说明” are visible and readable;
- source link, license, and attribution remain inside the source details;
- adaptation text does not overflow or expose HTML;
- ingredient and step sections remain readable;
- no production URL is opened or changed.

Capture a screenshot in the evidence directory and stop only the owned 8081 server:

```bash
STATIC_PID=$(cat /tmp/yiguochu-fast-vegan-static.pid)
kill "$STATIC_PID"
wait "$STATIC_PID" 2>/dev/null || true
rm -f .superpowers/sdd/mobile-response.json
test -z "$(lsof -tiTCP:8081 -sTCP:LISTEN || true)"
```

- [ ] **Step 7: Final verification and user review gate**

Repeat Step 1. Hash the six-case and 30-case evidence directories. Report exact test counts, call counts, tokens from responses, pass/fail reasons, mobile screenshot, current commits, unchanged 8765 PID, and protected dirty patch-id.

Ask the user to review the 30-case evidence and explicitly approve or reject Phase A preview deployment. Do not treat implementation approval or an execution-mode choice as deployment approval.

- [ ] **Step 8: Record only actually approved human-review results**

If any case or criterion fails, leave that criterion marked as failed, stop deployment, and return to a focused RED/GREEN fix. If all 30 cases and all six columns are reviewed and the user explicitly approves them, change each reviewed cell in `docs/recipe-validation-review.md` from `□通过 / □不通过` to `☑通过 / □不通过` and add this header immediately above the table. Keep the actual evidence SHA-256 output in the execution report rather than copying an unstable temporary path into the tracked document:

```markdown
评审状态：2026-07-17 已完成 30 例逐项人工复核并获用户批准。原始请求与响应保存在本次外部证据目录，完整性以本次 SHA-256 清单为准。
```

Then run and commit only the review record:

```bash
test "$(rg -c '^\| `(?:base|adversarial|cycle)-' docs/recipe-validation-review.md)" -eq 30
test "$(rg -c '☑通过 / □不通过' docs/recipe-validation-review.md)" -eq 180
git diff --check -- docs/recipe-validation-review.md
git add docs/recipe-validation-review.md
git diff --cached --name-only
git commit -m "docs: record phase a recipe review"
git diff --binary | git patch-id --stable
```

Expected: exactly 30 rows × 6 reviewed criteria = 180 approved cells; no result is pre-filled before the actual review; protected patch-id remains unchanged.

### Task 7: Gated `recipe-validation` preview deployment

**Files:**
- Build ignored `dist/`; no tracked file changes.

**Interfaces:**
- Consumes: explicit user deployment approval after Task 6.
- Produces: a non-production `*.yiguochu.pages.dev` preview URL and health/mobile evidence.
- Must never target branch `main`.

- [ ] **Step 1: Confirm the separate deployment approval**

Proceed only if the user explicitly approves preview deployment after reviewing the 30 cases. Otherwise stop with the completed local implementation and evidence.

- [ ] **Step 2: Re-run all deployment prerequisites**

Run the full Task 6 Step 1 gate plus:

```bash
test "$(find "$(cat /tmp/yiguochu-fast-vegan-live6-path)" -name '*.raw.json' | wc -l | tr -d ' ')" -eq 6
test "$(find "$(cat /tmp/yiguochu-fast-vegan-live30-path)" -name '*.raw.json' | wc -l | tr -d ' ')" -eq 30
test "$(rg -c '☑通过 / □不通过' docs/recipe-validation-review.md)" -eq 180
node tools/check-recipes.mjs
```

Expected: all prior evidence still exists and every gate passes.

- [ ] **Step 3: Build ignored `dist/` exactly**

```bash
rm -rf dist
mkdir -p dist
cp index.html manifest.json sw.js icon.svg icon-180.png icon-192.png icon-512.png dist/
cp tools/data/foods-tw.json dist/
cp tools/data/recipe-library.json dist/
cp worker/src/worker.js dist/_worker.js
SWVER="v$(date +%s)" python3 - <<'PY'
import os, re
from pathlib import Path
p = Path('dist/sw.js')
p.write_text(
    re.sub(r'yiguochu-shell-v\w+', 'yiguochu-shell-' + os.environ['SWVER'], p.read_text(encoding='utf-8')),
    encoding='utf-8',
)
PY
node tools/check-recipes.mjs
```

- [ ] **Step 4: Deploy preview only and capture its URL**

```bash
DEPLOY_OUTPUT=$(npx wrangler pages deploy dist \
  --project-name yiguochu \
  --branch recipe-validation \
  --commit-dirty=true \
  --commit-message "recipe validation preview")
printf '%s\n' "$DEPLOY_OUTPUT"
PREVIEW_URL=$(printf '%s\n' "$DEPLOY_OUTPUT" | rg -o 'https://[a-zA-Z0-9.-]+\.yiguochu\.pages\.dev' | tail -1)
test -n "$PREVIEW_URL"
test "$PREVIEW_URL" != "https://yiguochu.pages.dev"
```

- [ ] **Step 5: Verify preview health, CORS, and mobile UI**

```bash
curl --silent --show-error "$PREVIEW_URL/health" \
  | jq -e '.status == "ok" and .recipeLibrary == "ok" and .recipeFamilies == 9 and .baseRecipes == 12'
curl --silent --show-error --dump-header /tmp/yiguochu-preview-headers.txt \
  --header "Origin: $PREVIEW_URL" "$PREVIEW_URL/health" >/dev/null
rg -i -F "access-control-allow-origin: $PREVIEW_URL" /tmp/yiguochu-preview-headers.txt
```

Open the preview at 390x844 and repeat the Task 6 mobile checks. Confirm the URL contains a preview subdomain and never navigate the main production URL.

- [ ] **Step 6: Report preview readiness without promoting production**

Return the preview URL, health result, CORS result, screenshot, exact commit list, live evidence counts, and remaining Phase A status. Do not deploy `--branch main`, promote the preview, start 150–200 recipe expansion, or claim production is updated.

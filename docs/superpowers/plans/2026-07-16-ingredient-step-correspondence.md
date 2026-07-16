# Ingredient-Step Correspondence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deterministically reject generated meals that actively use unlisted cooking oil, salt, pepper, or retained cooking water, while accepting correct aliases and excluding preparation-only water and negated actions.

**Architecture:** Extend the existing closed-set recipe validator instead of adding a general ingredient extractor. Worker JavaScript remains authoritative; Python mirrors the same constants, action detection, flag order, and prompt text. The validator adds flags only and never mutates ingredient rows, grams, nutrition, or cooking steps.

**Tech Stack:** Cloudflare Worker JavaScript, Python 3 local proxy, Node.js built-in test runner, existing recipe validator, DeepSeek through the owned local test proxy.

## Global Constraints

- Implement the approved design in `docs/superpowers/specs/2026-07-16-ingredient-step-correspondence-design.md` exactly.
- `worker/src/worker.js` is authoritative; `ai_proxy.py` must remain behaviorally identical.
- Never add, delete, or rewrite generated ingredient rows, grams, nutrition fields, recipe sources, or approved recipe metadata.
- Detect only cooking oil, salt, pepper, and retained cooking water in this task; do not generalize to every seasoning or sauce.
- Washing, rinsing, soaking-only, blanching-and-discard, and drain-water preparation controls must not require a water row.
- Preserve all existing safety-tail, allergen, one-pot, time, recipe-selection, and nutrition behavior.
- Keep the final preflight at most 500 characters and byte-identical between Worker and Python.
- Preserve the seven user-owned dirty files. At plan start, their combined patch-id is `cdcd5686ef54d082cb898bf6367dcf2de8db21e4`.
- Use H/O/A/T isolation for commits: `H` is committed HEAD, `O` is the original user diff, `A` is the combined working tree, and only task delta `T=A-O` may enter a commit. Never use a plain `git add` on an overlapping dirty production file.
- Do not touch the existing service on port 8765. Live work may use only an owned free port after checking it.
- Phase A forbids production `main`. Do not deploy preview or production during Tasks 1-3.

---

## File map

- `worker/src/worker.js`: authoritative consumable groups, action detection, validator flags, and prompt contract.
- `tools/tests/worker-recipe.test.mjs`: preserved live fixtures, false-positive controls, prompt assertions, and Worker integration coverage.
- `ai_proxy.py`: Python-equivalent groups, action detection, flags, and prompt text.
- `tools/tests/recipe-parity.test.mjs`: exact Worker/Python result and prompt parity.
- `.superpowers/sdd/ingredient-step-correspondence-report.md`: ignored execution evidence and release verdict; never stage it.

### Task 1: Worker controlled-consumable validator

**Files:**
- Modify: `tools/tests/worker-recipe.test.mjs`
- Modify: `worker/src/worker.js:205-223,239-320,527-552,690-718`

**Interfaces:**
- Consumes: `validationFormName()`, `validationActionNegated()`, `validationActiveActionMatches()`, `validationIngredientNames()`, and `validationSteps()`.
- Produces: four deterministic flags in stable order: `step_ingredient_missing:烹调油`, `step_ingredient_missing:盐`, `step_ingredient_missing:胡椒`, `step_ingredient_missing:水`.
- Preserves: the public `validateGroundedMeal(meal, selection, constraints)` signature and every existing response field.

- [ ] **Step 1: Snapshot the protected original state**

Run:

```bash
mkdir -p /tmp/yiguochu-correspondence-o/worker/src /tmp/yiguochu-correspondence-o/tools/tests
cp worker/src/worker.js /tmp/yiguochu-correspondence-o/worker/src/worker.js
cp tools/tests/worker-recipe.test.mjs /tmp/yiguochu-correspondence-o/tools/tests/worker-recipe.test.mjs
git diff --binary | git patch-id --stable
git diff --cached --name-only
```

Expected: patch-id `cdcd5686ef54d082cb898bf6367dcf2de8db21e4`; the cached-name list is empty.

- [ ] **Step 2: Add failing Worker tests for the three preserved live cases**

Add this helper and test to `tools/tests/worker-recipe.test.mjs`:

```js
function correspondenceSelection() {
  return {
    ingredientAliases: {},
    usedPantry: [],
    unusedPantry: [],
    recipe: { core_ingredients: [] },
  };
}

test('validator reproduces the three live consumable correspondence defects exactly', () => {
  const cases = [
    {
      id: 'case-1',
      meal: {
        ingredients: [
          '大米', '鸡腿肉', '洋葱', '葡萄干', '姜', '大蒜', '姜黄粉', '盐',
        ].map(name => ({ name, grams: 10 })),
        steps: [
          '鸡腿肉切块，洋葱切丝，姜蒜切末。锅加油，炒洋葱，加姜蒜、姜黄粉，放入鸡块。',
          '加入大米、葡萄干和850毫升水，焖至米饭熟透，鸡肉熟透无粉红。',
        ],
      },
      expected: [
        'ingredient_missing_in_steps:盐',
        'step_ingredient_missing:烹调油',
        'step_ingredient_missing:水',
      ],
    },
    {
      id: 'case-3',
      meal: {
        ingredients: ['大米', '卷心菜', '高汤', '番茄', '白豆', '洋葱', '橄榄油']
          .map(name => ({ name, grams: 10 })),
        steps: [
          '大米洗净，提前用清水浸泡15分钟；番茄切块，洋葱切丁，卷心菜切丝，白豆沥干。',
          '锅中加橄榄油，炒洋葱，加入番茄、卷心菜、白豆、大米和高汤煮熟。',
          '关火，根据口味加盐和胡椒调味。',
        ],
      },
      expected: ['step_ingredient_missing:盐', 'step_ingredient_missing:胡椒'],
    },
    {
      id: 'case-4',
      meal: {
        ingredients: ['鸡腿肉', '洋葱', '土豆', '椰奶', '玉米粒', '油', '盐']
          .map(name => ({ name, grams: 10 })),
        steps: [
          '鸡腿肉切块；洋葱切丝；土豆切块；玉米粒备用。',
          '锅中加油，炒洋葱和鸡块，加入土豆块和玉米粒。',
          '倒入椰奶和盐，加半杯水（约120ml），焖至鸡肉熟透、中心不见粉红。',
        ],
      },
      expected: ['step_ingredient_missing:水'],
    },
  ];

  for (const { id, meal, expected } of cases) {
    assert.deepEqual(validateGroundedMeal(meal, correspondenceSelection(), {}), expected, id);
  }
});
```

- [ ] **Step 3: Add failing Worker boundary tests**

Add table-driven cases covering exact positive and negative behavior:

```js
test('controlled consumables require rows without matching preparation water or word compounds', () => {
  const cases = [
    { ingredients: ['大米'], step: '锅中倒入橄榄油，加入大米。', present: ['step_ingredient_missing:烹调油'] },
    { ingredients: ['大米', '油'], step: '锅中加油，加入大米。', absent: ['step_ingredient_missing:烹调油'] },
    { ingredients: ['大米'], step: '加入酱油和油菜。', absent: ['step_ingredient_missing:烹调油'] },
    { ingredients: ['大米'], step: '不加油、不放盐，加入大米。', absent: ['step_ingredient_missing:烹调油', 'step_ingredient_missing:盐'] },
    { ingredients: ['大米'], step: '撒少许海盐和黑胡椒调味。', present: ['step_ingredient_missing:盐', 'step_ingredient_missing:胡椒'] },
    { ingredients: ['大米', '食盐', '白胡椒粉'], step: '加入大米、食盐和白胡椒粉调味。', absent: ['step_ingredient_missing:盐', 'step_ingredient_missing:胡椒'] },
    { ingredients: ['大米'], step: '加入大米和2杯清水煮熟。', present: ['step_ingredient_missing:水'] },
    { ingredients: ['大米', '清水'], step: '加入大米和2杯清水煮熟。', absent: ['step_ingredient_missing:水'] },
    { ingredients: ['大米'], step: '大米用清水洗净并浸泡，沥干后入锅。', absent: ['step_ingredient_missing:水'] },
    { ingredients: ['大米'], step: '大米加水焯煮后倒掉水并沥干。', absent: ['step_ingredient_missing:水'] },
  ];

  for (const { ingredients, step, present = [], absent = [] } of cases) {
    const meal = { ingredients: ingredients.map(name => ({ name, grams: 10 })), steps: [step] };
    const flags = validateGroundedMeal(meal, correspondenceSelection(), {});
    for (const flag of present) assert.ok(flags.includes(flag), `${step}: ${flag}`);
    for (const flag of absent) assert.equal(flags.includes(flag), false, `${step}: ${flag}`);
  }
});
```

Add the duplicate and malformed controls:

```js
test('controlled consumable flags are deduplicated and malformed values do not throw', () => {
  const repeated = {
    ingredients: [{ name: '大米', grams: 100 }],
    steps: ['加盐和胡椒调味，加水煮。', '再次加盐、胡椒和水。'],
  };
  const flags = validateGroundedMeal(repeated, correspondenceSelection(), {});
  assert.equal(flags.filter(flag => flag === 'step_ingredient_missing:盐').length, 1);
  assert.equal(flags.filter(flag => flag === 'step_ingredient_missing:胡椒').length, 1);
  assert.equal(flags.filter(flag => flag === 'step_ingredient_missing:水').length, 1);
  assert.doesNotThrow(() => validateGroundedMeal(
    { ingredients: [null, 0, { name: null }], steps: [null, 0, {}] },
    correspondenceSelection(),
    {},
  ));
});
```

- [ ] **Step 4: Run the Worker test and verify RED**

Run:

```bash
node --test tools/tests/worker-recipe.test.mjs
```

Expected: the new live-fixture and controlled-consumable tests fail because water, salt, and pepper reverse checks do not exist and exact ingredient `油` is not accepted. Existing tests remain green.

- [ ] **Step 5: Implement the minimal Worker group detector**

In `worker/src/worker.js`, keep the existing oil-action expressions and add these bounded ingredient groups:

```js
const VALIDATION_SALT_NAMES = new Set(['盐', '食盐', '海盐', '低钠盐']);
const VALIDATION_PEPPER_NAMES = new Set(['胡椒', '胡椒粉', '黑胡椒', '黑胡椒粉', '白胡椒', '白胡椒粉']);
const VALIDATION_WATER_NAMES = new Set(['水', '清水', '饮用水', '凉开水', '温水', '热水']);
const VALIDATION_SALT_TOKEN_SOURCE = '(?:食盐|海盐|低钠盐|盐)(?!水)';
const VALIDATION_PEPPER_TOKEN_SOURCE = '(?:黑胡椒粉|白胡椒粉|胡椒粉|黑胡椒|白胡椒|胡椒)';
const VALIDATION_SEASONING_TOKEN_SOURCE = `(?:${VALIDATION_SALT_TOKEN_SOURCE}|${VALIDATION_PEPPER_TOKEN_SOURCE})`;
const VALIDATION_SEASONING_INPUT_RE = new RegExp(
  `(?:加入?|放入?|撒入?|撒上?|调入?|拌入?|下)(?:根据口味|按口味|少许|适量|一点|些许)?${VALIDATION_SEASONING_TOKEN_SOURCE}`
  + `(?:(?:和|及|、)${VALIDATION_SEASONING_TOKEN_SOURCE})*(?:调味)?`
  + `|(?:用)?(?:少许|适量|一点|些许)?${VALIDATION_SEASONING_TOKEN_SOURCE}`
  + `(?:(?:和|及|、)${VALIDATION_SEASONING_TOKEN_SOURCE})*调味`,
);
const VALIDATION_SALT_TOKEN_RE = new RegExp(VALIDATION_SALT_TOKEN_SOURCE);
const VALIDATION_PEPPER_TOKEN_RE = new RegExp(VALIDATION_PEPPER_TOKEN_SOURCE);
const VALIDATION_RETAINED_WATER_ACTION_RE = /(?:加入?|倒入?|放入?|添入?|注入?|兑入?|补入?|加)(?:[^，,。；;！？!?]{0,32}?)(?:饮用水|凉开水|温水|热水|清水|水)(?!淀粉|果|油|产)/g;
const VALIDATION_WATER_DISCARD_RE = /(?:倒掉|弃去|滤掉|沥干|倒出)/;
```

Add helpers with these exact responsibilities:

```js
function validationIngredientMatchesNames(name, names) {
  const bare = validationFormName(name).replace(/\(.*?\)/g, '');
  return names.has(bare);
}

function validationStepUsesSeasoningGroup(step, tokenRe) {
  const text = validationFormName(step);
  for (const match of text.matchAll(new RegExp(VALIDATION_SEASONING_INPUT_RE.source, 'g'))) {
    if (!validationActionNegated(text, match.index) && tokenRe.test(match[0])) return true;
  }
  return false;
}

function validationStepUsesRetainedWater(step) {
  const text = validationFormName(step);
  const clauses = text.split(/[，,。；;！？!?]+/).filter(Boolean);
  for (const clause of clauses) {
    for (const match of clause.matchAll(new RegExp(VALIDATION_RETAINED_WATER_ACTION_RE.source, 'g'))) {
      if (validationActionNegated(clause, match.index)) continue;
      const waterEnd = match.index + match[0].length;
      if (!VALIDATION_WATER_DISCARD_RE.test(clause.slice(waterEnd))) return true;
    }
  }
  return false;
}
```

Change `validationCookingOilIngredient()` so exact `油` returns true. Replace the oil-only block in `validateGroundedMeal()` with an ordered four-group loop. Use fresh regular expressions inside helpers so global `lastIndex` never leaks between calls.

```js
const consumableGroups = [
  ['step_ingredient_missing:烹调油', validationCookingOilIngredient, validationStepUsesCookingOil],
  [
    'step_ingredient_missing:盐',
    name => validationIngredientMatchesNames(name, VALIDATION_SALT_NAMES),
    step => validationStepUsesSeasoningGroup(step, VALIDATION_SALT_TOKEN_RE),
  ],
  [
    'step_ingredient_missing:胡椒',
    name => validationIngredientMatchesNames(name, VALIDATION_PEPPER_NAMES),
    step => validationStepUsesSeasoningGroup(step, VALIDATION_PEPPER_TOKEN_RE),
  ],
  [
    'step_ingredient_missing:水',
    name => validationIngredientMatchesNames(name, VALIDATION_WATER_NAMES),
    validationStepUsesRetainedWater,
  ],
];
for (const [flag, ingredientMatches, stepUses] of consumableGroups) {
  if (!ingredientNames.some(ingredientMatches) && steps.some(stepUses)) flags.add(flag);
}
```

- [ ] **Step 6: Strengthen the Worker prompt without changing data behavior**

Add this exact sentence to `buildRecipeGrounding()`:

```text
食用油、盐、胡椒和留在成品中的水都必须在 ingredients 有同义 name 和数字 grams；洗、淘、泡后倒掉的水可不列。
```

Replace, rather than append to, the existing 500-character `FINAL_RECIPE_PREFLIGHT` with this exact 481-character version in Worker and the test copy:

```text
【最终提交自检】
1. 双向一致：steps中的投入物都须在ingredients有同义name和数字grams，逐一复查食用油、盐、胡椒和留在成品中的水；洗、淘、泡后倒掉的水可不列。除获准小量香辛料外，每个ingredient须在steps出现。已选库存同时出现在ingredients与steps；未用库存不得出现在ingredients、steps或why。
2. 安全终点：每种生禽肉、猪肉、海鲜、普通鸡蛋都必须在含该ingredient原名的步骤写已达到的熟制终点；“表面变色”、只写时长或仅“米熟”不算。普通鸡蛋须写“鸡蛋熟透，蛋白和蛋黄完全凝固，不得流心”；只写蛋白凝固不算。
3. 一锅限时：全程只用一口烹饪容器；禁止提前、过夜或隐藏预处理。主食必须在steps中完成烹煮，或ingredient名明确写剩饭/即食；所有用时计入prep_minutes，steps≤4且总时长≤40分钟。
4. 过敏复核：重查忌口/过敏；其直接名称和带前后缀形态不得出现在模型JSON任何字段，例如米过敏时不得写“配米饭”。
只返回JSON，禁止JSON外文字。
```

Preserve the `<=500` assertion and assert the prompt contains `留在成品中的水` plus `洗、淘、泡后倒掉的水可不列`.

- [ ] **Step 7: Run Worker GREEN and regression checks**

Run:

```bash
node --check worker/src/worker.js
node --test tools/tests/worker-recipe.test.mjs
node tools/check-recipes.mjs
node tools/run-recipe-regression.mjs
git diff --check
```

Expected: Worker tests pass, recipe check reports 9 families/12 bases, static regression reports `100/100`, and no whitespace errors.

- [ ] **Step 8: Commit only Task 1 through H/O/A/T isolation**

Build a task-only patch from the Step 1 snapshots and apply it to a temporary index based on HEAD:

```bash
TASK_PATCH=/tmp/yiguochu-correspondence-worker.patch
rm -f "$TASK_PATCH"
diff -u -L a/worker/src/worker.js -L b/worker/src/worker.js \
  /tmp/yiguochu-correspondence-o/worker/src/worker.js worker/src/worker.js >> "$TASK_PATCH"; test $? -eq 1
diff -u -L a/tools/tests/worker-recipe.test.mjs -L b/tools/tests/worker-recipe.test.mjs \
  /tmp/yiguochu-correspondence-o/tools/tests/worker-recipe.test.mjs tools/tests/worker-recipe.test.mjs >> "$TASK_PATCH"; test $? -eq 1
TASK_INDEX=$(mktemp)
rm "$TASK_INDEX"
GIT_INDEX_FILE="$TASK_INDEX" git read-tree HEAD
GIT_INDEX_FILE="$TASK_INDEX" git apply --cached "$TASK_PATCH"
GIT_INDEX_FILE="$TASK_INDEX" git diff --cached --check
GIT_INDEX_FILE="$TASK_INDEX" git diff --cached --name-only
```

Expected temporary staged names are exactly:

```text
tools/tests/worker-recipe.test.mjs
worker/src/worker.js
```

Commit through the same temporary index:

```bash
GIT_INDEX_FILE="$TASK_INDEX" git commit -m "fix: validate recipe consumable correspondence"
rm "$TASK_INDEX"
```

After the commit, run `git diff --binary | git patch-id --stable`; expected original patch-id remains `cdcd5686ef54d082cb898bf6367dcf2de8db21e4`.

### Task 2: Python parity and exact prompt parity

**Files:**
- Modify: `tools/tests/recipe-parity.test.mjs`
- Modify: `ai_proxy.py:398-420,448-535,773-810`

**Interfaces:**
- Consumes: the Worker behavior committed in Task 1 and the existing `pythonCall('validate', ...)` harness.
- Produces: exact ordered flag parity for every new case and byte-identical prompt tails.

- [ ] **Step 1: Snapshot the protected Python original state**

Run:

```bash
mkdir -p /tmp/yiguochu-correspondence-o/python/tools/tests
cp ai_proxy.py /tmp/yiguochu-correspondence-o/python/ai_proxy.py
cp tools/tests/recipe-parity.test.mjs /tmp/yiguochu-correspondence-o/python/tools/tests/recipe-parity.test.mjs
```

- [ ] **Step 2: Add failing parity tests before Python production code**

Add a parity matrix containing every new detector boundary:

```js
test('Python consumable correspondence exactly matches Worker', () => {
  const recipe = groundedRecipe({ core_ingredients: ['大米'] });
  const library = fixtureLib([recipe]);
  const constraints = { pantry: ['大米'], dislikes: [] };
  const cases = [
    { ingredients: ['大米'], steps: ['锅中倒入橄榄油，加入大米。'] },
    { ingredients: ['大米', '油'], steps: ['锅中加油，加入大米。'] },
    { ingredients: ['大米'], steps: ['加入酱油和油菜。'] },
    { ingredients: ['大米'], steps: ['不加油、不放盐，加入大米。'] },
    { ingredients: ['大米'], steps: ['撒少许海盐和黑胡椒调味。'] },
    { ingredients: ['大米', '食盐', '白胡椒粉'], steps: ['加入大米、食盐和白胡椒粉调味。'] },
    { ingredients: ['大米'], steps: ['加入大米和2杯清水煮熟。'] },
    { ingredients: ['大米', '清水'], steps: ['加入大米和2杯清水煮熟。'] },
    { ingredients: ['大米'], steps: ['大米用清水洗净并浸泡，沥干后入锅。'] },
    { ingredients: ['大米'], steps: ['大米加水焯煮后倒掉水并沥干。'] },
    { ingredients: ['大米'], steps: ['加盐和胡椒调味，加水煮。', '再次加盐、胡椒和水。'] },
  ];

  for (const item of cases) {
    const meal = {
      ingredients: item.ingredients.map(name => ({ name, grams: 10 })),
      steps: item.steps,
    };
    const js = validateGroundedMeal(meal, selectRecipeCandidates(library, constraints)[0], constraints);
    const py = pythonCall('validate', { library, constraints, meal });
    assert.deepEqual(py, js, item.steps.join(' / '));
  }
});
```

Add the preserved live-fixture parity test with complete arrays:

```js
test('Python matches Worker for the three preserved live correspondence cases', () => {
  const recipe = groundedRecipe({ core_ingredients: ['大米'] });
  const library = fixtureLib([recipe]);
  const constraints = { pantry: ['大米'], dislikes: [] };
  const cases = [
    {
      ingredients: ['大米', '鸡腿肉', '洋葱', '葡萄干', '姜', '大蒜', '姜黄粉', '盐'],
      steps: [
        '鸡腿肉切块，洋葱切丝，姜蒜切末。锅加油，炒洋葱，加姜蒜、姜黄粉，放入鸡块。',
        '加入大米、葡萄干和850毫升水，焖至米饭熟透，鸡肉熟透无粉红。',
      ],
    },
    {
      ingredients: ['大米', '卷心菜', '高汤', '番茄', '白豆', '洋葱', '橄榄油'],
      steps: [
        '大米洗净，提前用清水浸泡15分钟；番茄切块，洋葱切丁，卷心菜切丝，白豆沥干。',
        '锅中加橄榄油，炒洋葱，加入番茄、卷心菜、白豆、大米和高汤煮熟。',
        '关火，根据口味加盐和胡椒调味。',
      ],
    },
    {
      ingredients: ['鸡腿肉', '洋葱', '土豆', '椰奶', '玉米粒', '油', '盐'],
      steps: [
        '鸡腿肉切块；洋葱切丝；土豆切块；玉米粒备用。',
        '锅中加油，炒洋葱和鸡块，加入土豆块和玉米粒。',
        '倒入椰奶和盐，加半杯水（约120ml），焖至鸡肉熟透、中心不见粉红。',
      ],
    },
  ];

  for (const item of cases) {
    const meal = {
      ingredients: item.ingredients.map(name => ({ name, grams: 10 })),
      steps: item.steps,
    };
    const js = validateGroundedMeal(meal, selectRecipeCandidates(library, constraints)[0], constraints);
    const py = pythonCall('validate', { library, constraints, meal });
    assert.deepEqual(py, js, item.steps.join(' / '));
  }
});
```

For every case the decisive assertion is:

```js
const js = validateGroundedMeal(meal, selection, constraints);
const py = pythonCall('validate', { library, constraints, meal });
assert.deepEqual(py, js);
```

Update `FINAL_RECIPE_PREFLIGHT` in the parity test and add exact assertions for `留在成品中的水` and the preparation-water exception.

- [ ] **Step 3: Run parity tests and verify RED**

Run:

```bash
node --test tools/tests/recipe-parity.test.mjs
```

Expected: new cases fail because Python still has only the old oil-only reverse check and old prompt text.

- [ ] **Step 4: Mirror the Worker constants and helpers in Python**

Implement these Python constants and helpers, then accept exact generic `油` in `_validation_cooking_oil_ingredient()`:

```python
_VALIDATION_SALT_NAMES = {'盐', '食盐', '海盐', '低钠盐'}
_VALIDATION_PEPPER_NAMES = {'胡椒', '胡椒粉', '黑胡椒', '黑胡椒粉', '白胡椒', '白胡椒粉'}
_VALIDATION_WATER_NAMES = {'水', '清水', '饮用水', '凉开水', '温水', '热水'}
_VALIDATION_SALT_TOKEN_SOURCE = r'(?:食盐|海盐|低钠盐|盐)(?!水)'
_VALIDATION_PEPPER_TOKEN_SOURCE = r'(?:黑胡椒粉|白胡椒粉|胡椒粉|黑胡椒|白胡椒|胡椒)'
_VALIDATION_SEASONING_TOKEN_SOURCE = (
    rf'(?:{_VALIDATION_SALT_TOKEN_SOURCE}|{_VALIDATION_PEPPER_TOKEN_SOURCE})'
)
_VALIDATION_SEASONING_INPUT_RE = re.compile(
    rf'(?:加入?|放入?|撒入?|撒上?|调入?|拌入?|下)(?:根据口味|按口味|少许|适量|一点|些许)?'
    rf'{_VALIDATION_SEASONING_TOKEN_SOURCE}'
    rf'(?:(?:和|及|、){_VALIDATION_SEASONING_TOKEN_SOURCE})*(?:调味)?'
    rf'|(?:用)?(?:少许|适量|一点|些许)?{_VALIDATION_SEASONING_TOKEN_SOURCE}'
    rf'(?:(?:和|及|、){_VALIDATION_SEASONING_TOKEN_SOURCE})*调味'
)
_VALIDATION_SALT_TOKEN_RE = re.compile(_VALIDATION_SALT_TOKEN_SOURCE)
_VALIDATION_PEPPER_TOKEN_RE = re.compile(_VALIDATION_PEPPER_TOKEN_SOURCE)
_VALIDATION_RETAINED_WATER_ACTION_RE = re.compile(
    r'(?:加入?|倒入?|放入?|添入?|注入?|兑入?|补入?|加)'
    r'(?:[^，,。；;！？!?]{0,32}?)(?:饮用水|凉开水|温水|热水|清水|水)(?!淀粉|果|油|产)'
)
_VALIDATION_WATER_DISCARD_RE = re.compile(r'(?:倒掉|弃去|滤掉|沥干|倒出)')


def _validation_ingredient_matches_names(name, names):
    bare = re.sub(r'\(.*?\)', '', _validation_form_name(name))
    return bare in names


def _validation_step_uses_seasoning_group(step, token_re):
    text = _validation_form_name(step)
    return any(
        not _validation_action_negated(text, match.start()) and token_re.search(match.group(0))
        for match in _VALIDATION_SEASONING_INPUT_RE.finditer(text)
    )


def _validation_step_uses_retained_water(step):
    text = _validation_form_name(step)
    for clause in filter(None, re.split(r'[，,。；;！？!?]+', text)):
        for match in _VALIDATION_RETAINED_WATER_ACTION_RE.finditer(clause):
            if _validation_action_negated(clause, match.start()):
                continue
            if not _VALIDATION_WATER_DISCARD_RE.search(clause[match.end():]):
                return True
    return False
```

Replace the Python oil-only validator block with the exact ordered group loop:

```python
consumable_groups = (
    ('step_ingredient_missing:烹调油', _validation_cooking_oil_ingredient, _validation_step_uses_cooking_oil),
    ('step_ingredient_missing:盐', lambda name: _validation_ingredient_matches_names(name, _VALIDATION_SALT_NAMES), lambda step: _validation_step_uses_seasoning_group(step, _VALIDATION_SALT_TOKEN_RE)),
    ('step_ingredient_missing:胡椒', lambda name: _validation_ingredient_matches_names(name, _VALIDATION_PEPPER_NAMES), lambda step: _validation_step_uses_seasoning_group(step, _VALIDATION_PEPPER_TOKEN_RE)),
    ('step_ingredient_missing:水', lambda name: _validation_ingredient_matches_names(name, _VALIDATION_WATER_NAMES), _validation_step_uses_retained_water),
)
for flag, ingredient_matches, step_uses in consumable_groups:
    if (not any(ingredient_matches(name) for name in ingredient_names)
            and any(step_uses(step) for step in steps)):
        add_flag(flag)
```

Accept exact generic `油`, mirror both prompt locations, and do not change normalization or response mutation.

- [ ] **Step 5: Run parity GREEN and all four suites**

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

Expected: all tests pass; food check reports 0 errors; recipe check reports 9 families/12 bases; static regression reports `100/100` with the same six manual known gaps.

- [ ] **Step 6: Commit only Task 2 through H/O/A/T isolation**

Build the task-only patch from the Python snapshots and apply it to a temporary index based on Task 1 HEAD:

```bash
TASK_PATCH=/tmp/yiguochu-correspondence-python.patch
rm -f "$TASK_PATCH"
diff -u -L a/ai_proxy.py -L b/ai_proxy.py \
  /tmp/yiguochu-correspondence-o/python/ai_proxy.py ai_proxy.py >> "$TASK_PATCH"; test $? -eq 1
diff -u -L a/tools/tests/recipe-parity.test.mjs -L b/tools/tests/recipe-parity.test.mjs \
  /tmp/yiguochu-correspondence-o/python/tools/tests/recipe-parity.test.mjs tools/tests/recipe-parity.test.mjs >> "$TASK_PATCH"; test $? -eq 1
TASK_INDEX=$(mktemp)
rm "$TASK_INDEX"
GIT_INDEX_FILE="$TASK_INDEX" git read-tree HEAD
GIT_INDEX_FILE="$TASK_INDEX" git apply --cached "$TASK_PATCH"
GIT_INDEX_FILE="$TASK_INDEX" git diff --cached --check
GIT_INDEX_FILE="$TASK_INDEX" git diff --cached --name-only
```

Expected temporary staged names are exactly:

```text
ai_proxy.py
tools/tests/recipe-parity.test.mjs
```

Commit through the same temporary index:

```bash
GIT_INDEX_FILE="$TASK_INDEX" git commit -m "fix: mirror consumable validation locally"
rm "$TASK_INDEX"
```

After the commit, verify the seven original dirty files and patch-id `cdcd5686ef54d082cb898bf6367dcf2de8db21e4` remain unchanged.

### Task 3: Offline review and targeted six-case live gate

**Files:**
- Create ignored report: `.superpowers/sdd/ingredient-step-correspondence-report.md`
- Preserve live evidence outside the repository: `/tmp/yiguochu-live6-correspondence/`

**Interfaces:**
- Consumes: current committed Worker/Python parity and the same six request IDs recorded in `.superpowers/sdd/safety-tail-task-3-report.md`.
- Produces: an evidence-backed code verdict and a separate product release verdict.

- [ ] **Step 1: Run fresh controller-side offline verification**

Run the complete offline gate:

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

Record exact counts, current commit, dirty-file list, patch-id, and port ownership in the report.

- [ ] **Step 2: Review the cumulative diff before any live call**

Review the design range through current HEAD for Critical, Important, and Minor findings. Recheck active-action negation, water discard boundaries, exact generic oil, word compounds, duplicate flags, Worker/Python ordering, prompt length, nutrition immutability, and existing safety-tail behavior. Fix any Critical or Important issue with a new RED/GREEN cycle before continuing.

- [ ] **Step 3: Run exactly six no-retry live calls on an owned port**

Only after confirming 8766 is free, start the local proxy in a dedicated owned terminal session:

```bash
PORT=8766 python3 ai_proxy.py
```

Verify the local Python health contract:

```bash
curl --silent --show-error http://127.0.0.1:8766/health \
  | jq -e '.status == "ok" and .provider == "deepseek" and .model == "deepseek-chat"'
```

Then, in a separate shell, run this no-retry capture loop:

```bash
set -e
EVIDENCE=/tmp/yiguochu-live6-correspondence
SOURCE=/tmp/yiguochu-live6-safety-tail
rm -rf "$EVIDENCE"
mkdir -p "$EVIDENCE"
index=0
for request in "$SOURCE"/*.request.json; do
  index=$((index + 1))
  stem=$(basename "$request" .request.json)
  cp "$request" "$EVIDENCE/$stem.request.json"
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
test "$index" -eq 6
shasum -a 256 "$EVIDENCE"/*.json > "$EVIDENCE/sha256.txt"
```

Every meta file must record HTTP 200, curl exit 0, and `retry:false`. Send Ctrl-C only to the owned 8766 session, then confirm 8766/8767 are free and PID 76839 still owns 8765.

- [ ] **Step 4: Score machine and strict semantic behavior separately**

For each response record:

- HTTP/JSON success;
- trusted base recipe ID and pairing basis;
- exact `validation_flags` equality between response, Worker, and Python;
- allergen exclusion;
- explicit high-risk endpoint;
- every listed non-exempt ingredient used;
- no unlisted cooking oil, salt, pepper, or retained water;
- no generic-`油` false positive;
- one cooking vessel and no hidden preparation.

Do not forgive a real semantic defect merely because the validator misses it. Do not call current-HEAD live behavior proven if evidence is incomplete.

- [ ] **Step 5: Apply the conditional gate**

- If any of the six cases has a correspondence false positive, false negative, allergen leak, unsafe endpoint, or other strict semantic defect: mark the product gate BLOCKED; do not run 30 cases, mobile, preview, or production.
- If all six pass: prepare the fresh 30-case command and review sheet, but keep production blocked until 30/30, the six known manual gaps, mobile preview, and explicit user approval are complete.

- [ ] **Step 6: Write the report and hand off the release decision**

The report must state code readiness separately from product readiness, identify every remaining defect by case, disclose API-call count and evidence limitations, and confirm production was untouched.

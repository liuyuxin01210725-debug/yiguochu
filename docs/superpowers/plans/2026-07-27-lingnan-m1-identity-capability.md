# Lingnan M1 Identity Capability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不新增 recipe 或 template 的前提下，让菜心腊肠饭与去皮鸡腿香菇饭进入现有确定性生米焖饭能力，同时继续阻止生菜菜包饭、豆豉排骨煲仔饭和五色糯米饭被伪装成完整普通锅。

**Architecture:** 食材组合能力仍只由 `ingredient-taxonomy.v1.json`、`meal-templates.v2.json` 与 `ratio-rules.v1.json` 决定。新增独立 `choy-sum` identity，并给现有 `chicken-leg` 增加同部位的“去皮鸡腿肉”别名；不改变 `savory-mixed-rice-pot` 的业务字段，仅前移 taxonomy/template 版本闭包。先用 Planner、忌口、生成锁和 Worker/Python parity 的真实行为测试制造红灯，再写最小资产改动，最后登记公共旅程和地域覆盖审计。

**Tech Stack:** JSON 机器资产、Cloudflare Pages Functions ES modules、Node.js 内置 `node:test`、Python 3 本地 bridge、确定性 Markdown/JSON/CSV 构建器。

## Global Constraints

- [ ] 以 `docs/superpowers/specs/2026-07-27-lingnan-m1-identity-capability-design.md` 为唯一产品契约。
- [ ] `tools/data/recipe-library.json` 必须保持 72 道：12 `approved` + 60 `auto_approved`；不得新增、删除或修改 recipe。
- [ ] Template catalog 必须保持 16 个：10 active + 6 planned；不得新增地域固定模板、改变激活状态或修改 template 业务字段。
- [ ] 目标版本固定为 `taxonomy-v1-20260727-r5`、`templates-v2-20260727-r6`、`ratio-rules-v1-20260727-r3`。
- [ ] `生菜`、`豆豉`、`糯米`和四种食品级色粉继续保持未识别或未规划边界；不得归入近似食材。
- [ ] `去皮鸡腿肉` 必须保留 raw 原词、`leg` 部位、`raw_poultry` 风险和 `poultry_fully_cooked` 终点；不得替换成鸡胸、鸡翅或含鸡皮做法。
- [ ] `tools/data/ratio-rules.v1.json` 内容和版本不变；不得加入瓦煲水比、锅巴火力或后下料分钟数。
- [ ] 两道恢复菜单只能标为 `full_single_pot_ingredient_compatible`；不得加入 template evidence IDs，不得把 `claypot-rice` 技法标为完整覆盖。
- [ ] `/plan-meal` 保持 0 次 DeepSeek；`/generate-plan` 每次最多 1 次且不自动重试。
- [ ] 每个生产行为修改先写失败测试并观察预期红灯，再写最小实现并观察绿灯。
- [ ] 不修改前端产品流程，不新增账号、用户画像、营养追踪、云端用户数据或多 Agent 产品能力。
- [ ] 只更新 Draft PR #1；不部署 Preview 或 production，不合并 PR。

---

## File Responsibility Map

- `tools/data/ingredient-taxonomy.v1.json`：菜心身份与去皮鸡腿同部位别名的唯一机器真源。
- `worker/src/ingredient-taxonomy-validator.js`：taxonomy r5 固定版本和有限字段校验。
- `tools/data/meal-templates.v2.json`：只绑定 taxonomy r5 并前移 catalog r6；模板业务内容保持字节级等价。
- `worker/src/meal-template-validator.js`：template r6 / taxonomy r5 版本闭包。
- `tools/tests/ingredient-taxonomy.test.mjs`：菜心独立身份、鸡腿部位、安全终点和保留缺口。
- `tools/tests/meal-template-catalog.test.mjs`：16 个模板、10/6 激活状态和 r6/r5 静态锁。
- `tools/tests/pantry-planner-v2-selection.test.mjs`：两组岭南食材的单锅行为、忌口和三个负边界。
- `tools/tests/worker-generate-plan.test.mjs`：菜心、去皮鸡腿、腊肠和鲜香菇的生成锁及模型越界拒绝。
- `tools/tests/planner-v2-parity.test.mjs`：Worker 与 Python bridge 对鸡腿香菇饭的计划事实一致性。
- `tools/data/pantry-planner-v2-journeys.json`：J85–J92 的公共边界旅程。
- `tools/run-pantry-planner-v2-journeys.mjs`：92 条旅程的稳定 CLI 汇总。
- `tools/tests/pantry-planner-v2-journeys.test.mjs`：旅程数量、分类、成本上限和 runner 覆盖。
- `tools/data/regional-menu-mappings.v1.json`：`raw-rice-braise` 对岭南地域和新 taxonomy identity 的能力引用，不改变 claypot ledger。
- `tools/tests/regional-menu-mappings.test.mjs`：能力账本边界和 evidence 不扩张。
- `tools/tests/planner-menu-coverage-builder.test.mjs`：岭南 2/5 覆盖与三个诚实缺口。
- `tools/generated/planner-menu-coverage.v1.json`、`docs/planner-menu-coverage.md`：新 taxonomy 下的确定性覆盖产物。
- `tools/generated/menu-master.v1.json`、`docs/menu-master.md`、`docs/menu-master.csv`：新资产 hash 下的菜单总账。
- `tools/generated/regional-atlas.v2.json`、`docs/china-one-pot-regional-atlas.md`、`docs/china-one-pot-regional-atlas.csv`：能力映射变化后的地域 atlas 产物。
- `tools/generated/lingnan-hk-macao-one-pot-research.v1.json`、`docs/lingnan-hk-macao-one-pot-research.md`：能力账本变化后的岭南研究产物。
- `CLAUDE.md`、`部署说明.md`、`tools/tests/worker-planner-v2.test.mjs`：版本、模板数量和 92/92 门禁事实。

---

### Task 1: 用红灯锁住岭南身份、规划、忌口、生成和双端行为

**Files:**

- Modify: `tools/tests/ingredient-taxonomy.test.mjs`
- Modify: `tools/tests/meal-template-catalog.test.mjs`
- Modify: `tools/tests/pantry-planner-v2-selection.test.mjs`
- Modify: `tools/tests/worker-generate-plan.test.mjs`
- Modify: `tools/tests/planner-v2-parity.test.mjs`

**Interfaces:**

- Consumes: `normalizePlannerItems(items, taxonomy)`、`planMeal(assets, request)`、`buildLockedPlanContract()`、`validateGeneratedPlan()` 和 `parityCase()`。
- Produces: 在生产资产仍为 r4/r5 时可观察的预期失败，证明后续最小资产改动确实修复目标行为。

- [ ] **Step 1: 写 taxonomy 身份与版本失败测试**

把 taxonomy 版本断言改为 r5，并把 `菜心` 加入首阶段词表。在 `tools/tests/ingredient-taxonomy.test.mjs` 增加：

```js
test('Lingnan M1 preserves choy sum and skinless chicken leg identity boundaries', () => {
  const rows = normalizePlannerItems(
    ['菜心', '青菜', '小白菜', '卷心菜', '芥菜', '去皮鸡腿肉', '鸡腿肉', '鸡胸肉'],
    catalog,
  );
  assert.deepEqual(rows.map(row => [
    row.raw, row.canonical, row.display_name, row.category, row.shape_or_cut,
  ]), [
    ['菜心', '菜心', '菜心', 'leafy_vegetable', 'whole'],
    ['青菜', '青菜', '青菜', 'leafy_vegetable', 'whole'],
    ['小白菜', '青菜', '小白菜', 'leafy_vegetable', 'whole'],
    ['卷心菜', '卷心菜', '卷心菜', 'leafy_vegetable', 'whole'],
    ['芥菜', '芥菜', '芥菜', 'leafy_vegetable', 'whole'],
    ['去皮鸡腿肉', '鸡肉', '鸡腿肉', 'chicken', 'leg'],
    ['鸡腿肉', '鸡肉', '鸡腿肉', 'chicken', 'leg'],
    ['鸡胸肉', '鸡肉', '鸡胸肉', 'chicken', 'breast'],
  ]);
  assert.equal(rows[0].moisture_release, 'high');
  assert.equal(rows[5].cooking_risk, 'raw_poultry');
  assert.deepEqual(rows[5].required_endpoint_codes, ['poultry_fully_cooked']);
  assert.notEqual(rows[0].canonical, rows[1].canonical);
  assert.notEqual(rows[5].shape_or_cut, rows[7].shape_or_cut);
});

test('Lingnan M1 retains lettuce fermented black beans glutinous rice and color gaps', () => {
  const rows = normalizePlannerItems(
    ['生菜', '豆豉', '糯米', '食品级紫薯粉', '食品级甜菜粉', '食品级菠菜粉', '食品级南瓜粉'],
    catalog,
  );
  assert.ok(rows.every(row => row.recognized === false));
});
```

同步静态版本断言：

```js
assert.equal(catalog.taxonomy_version, 'taxonomy-v1-20260727-r5');
assert.equal(templateCatalog.template_catalog_version, 'templates-v2-20260727-r6');
assert.equal(templateCatalog.ingredient_taxonomy_version, 'taxonomy-v1-20260727-r5');
```

- [ ] **Step 2: 写 Planner 正反行为与忌口失败测试**

在 `tools/tests/pantry-planner-v2-selection.test.mjs` 增加：

```js
test('Lingnan M1 menu cores become complete generic rice plans without claiming claypot technique', () => {
  for (const [title, must] of [
    ['广式腊味煲仔饭食材', ['大米', '广式腊肠', '菜心']],
    ['广式香菇滑鸡煲仔饭食材', ['大米', '去皮鸡腿肉', '鲜香菇']],
  ]) {
    const result = planMeal(assets, request({ must }));
    assert.equal(result.status, 'complete', title);
    assert.equal(result.plan.plan_kind, 'single_pot', title);
    const pot = result.plan.pots[0];
    assert.equal(pot.template_id, 'savory-mixed-rice-pot', title);
    assert.deepEqual(new Set(pot.planned_must_use.map(item => item.raw)), new Set(must), title);
    assert.deepEqual(result.plan.unplanned_must_use, [], title);
    assert.equal(pot.coverage_ratio, 1, title);
    assert.doesNotMatch(JSON.stringify(result), /煲仔饭|瓦煲|锅巴/);
  }
});

test('Lingnan cured sausage rice omits preset oil and salt', () => {
  const result = planMeal(assets, request({ must: ['大米', '广式腊肠', '菜心'] }));
  assert.equal(result.status, 'complete');
  assert.deepEqual(result.plan.pots[0].required_extra_items.map(item => item.name), ['水']);
});

test('skinless chicken leg keeps poultry safety and is blocked by chicken dislike', () => {
  const safe = planMeal(assets, request({ must: ['大米', '去皮鸡腿肉', '菜心'] }));
  assert.equal(safe.status, 'complete');
  const leg = safe.normalized_items.find(item => item.raw === '去皮鸡腿肉');
  assert.deepEqual(
    [leg.canonical, leg.shape_or_cut, leg.cooking_risk, leg.required_endpoint_codes],
    ['鸡肉', 'leg', 'raw_poultry', ['poultry_fully_cooked']],
  );
  assert.ok(safe.plan.pots[0].safety_endpoints.some(row => row.endpoint_code === 'poultry_fully_cooked_no_pink'));

  const conflict = planMeal(assets, request({
    must: ['大米', '去皮鸡腿肉', '鲜香菇'],
    dislikes: ['鸡肉'],
  }));
  assert.notEqual(conflict.status, 'complete');
  assert.equal(conflict.generation_allowed, false);
  assert.equal(
    conflict.plan.unplanned_must_use.find(item => item.raw === '去皮鸡腿肉')?.reason_code,
    'allergen_conflict',
  );
});

test('Lingnan unresolved structures never become complete generic raw-rice pots', () => {
  for (const must of [
    ['大米', '生菜', '胡萝卜'],
    ['大米', '猪肋排', '豆豉'],
    ['糯米', '食品级紫薯粉', '食品级甜菜粉', '食品级菠菜粉', '食品级南瓜粉'],
  ]) {
    const result = planMeal(assets, request({ must }));
    assert.notEqual(result.status, 'complete', must.join('+'));
    assert.equal(result.generation_allowed, false, must.join('+'));
  }
  const overloaded = planMeal(assets, request({
    must: ['大米', '广式腊肠', '菜心', '卷心菜'],
  }));
  assert.equal(
    overloaded.status === 'complete' && overloaded.plan.plan_kind === 'single_pot',
    false,
  );
});
```

- [ ] **Step 3: 写生成锁失败测试**

在 `tools/tests/worker-generate-plan.test.mjs` 增加：

```js
test('locked Lingnan generic rice plans reject ingredient and technique substitutions', async () => {
  const cases = [
    {
      must: ['大米', '广式腊肠', '菜心'],
      lockedNames: ['大米', '广式腊肠', '菜心'],
      forbidden: ['小白菜', '腊肉', '锅巴', '瓦煲'],
    },
    {
      must: ['大米', '去皮鸡腿肉', '鲜香菇'],
      lockedNames: ['大米', '去皮鸡腿肉', '鲜香菇'],
      forbidden: ['鸡胸肉', '鸡翅', '鸡皮', '平菇'],
    },
  ];
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  for (const entry of cases) {
    const journey = await preparedJourney(plannerRequest({ must: entry.must }));
    const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
    const names = locked.meals.flatMap(meal => meal.locked_ingredients.map(item => item.raw_name));
    for (const raw of entry.lockedNames) assert.ok(names.includes(raw), raw);
    const valid = validModelOutput(locked);
    assert.equal(workerModule.validateGeneratedPlan(valid, locked, ingredientTermUniverse()).ok, true);
    for (const forbidden of entry.forbidden) {
      const output = structuredClone(valid);
      output.meals[0].steps[0].text += `加入${forbidden}。`;
      assert.equal(
        workerModule.validateGeneratedPlan(output, locked, ingredientTermUniverse()).ok,
        false,
        forbidden,
      );
    }
  }
});
```

- [ ] **Step 4: 写 Worker/Python parity 失败测试**

在 `tools/tests/planner-v2-parity.test.mjs` 增加：

```js
test('Lingnan skinless chicken mushroom rice facts are identical across Worker and Python bridge', async () => {
  const body = await parityCase(
    'Lingnan skinless chicken mushroom rice',
    request({ must: ['大米', '去皮鸡腿肉', '鲜香菇'] }),
    'complete',
  );
  assert.equal(body.plan.plan_kind, 'single_pot');
  assert.deepEqual(body.plan.unplanned_must_use, []);
  assert.deepEqual(
    new Set(body.plan.pots[0].planned_must_use.map(item => item.raw)),
    new Set(['大米', '去皮鸡腿肉', '鲜香菇']),
  );
  const leg = body.normalized_items.find(item => item.raw === '去皮鸡腿肉');
  assert.deepEqual(
    [leg.canonical, leg.shape_or_cut, leg.cooking_risk],
    ['鸡肉', 'leg', 'raw_poultry'],
  );
});
```

- [ ] **Step 5: 运行所有聚焦测试并确认红灯来自缺失能力**

Run:

```sh
node --test \
  tools/tests/ingredient-taxonomy.test.mjs \
  tools/tests/meal-template-catalog.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs \
  tools/tests/worker-generate-plan.test.mjs \
  tools/tests/planner-v2-parity.test.mjs
```

Expected: FAIL；必须明确出现 taxonomy 仍为 r4、template 仍为 r5、`菜心`／`去皮鸡腿肉` 未识别或目标 plan 非 `complete`。若只出现语法、fixture 或超时错误，先修测试再重新观察行为红灯。

- [ ] **Step 6: 提交测试红灯快照**

```sh
git add tools/tests/ingredient-taxonomy.test.mjs tools/tests/meal-template-catalog.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/worker-generate-plan.test.mjs \
  tools/tests/planner-v2-parity.test.mjs
git commit -m "test: define Lingnan planner capability"
```

---

### Task 2: 写入最小 taxonomy 能力并原子同步 r5/r6 版本闭包

**Files:**

- Modify: `tools/data/ingredient-taxonomy.v1.json`
- Modify: `worker/src/ingredient-taxonomy-validator.js`
- Modify: `tools/data/meal-templates.v2.json`
- Modify: `worker/src/meal-template-validator.js`

**Interfaces:**

- Consumes: Task 1 已观察过的失败测试。
- Produces: `choy-sum` 独立 pantry identity、`chicken-leg` 的“去皮鸡腿肉”同部位 alias、taxonomy r5 / template r6 版本闭包；template 业务字段和 Ratio DSL 保持不变。

- [ ] **Step 1: 增加 `choy-sum` 精确 identity**

在 `tools/data/ingredient-taxonomy.v1.json` 增加：

```json
{
  "canonical_id":"choy-sum",
  "display_name":"菜心",
  "aliases":[],
  "input_scope":"pantry_input",
  "default_shape_or_cut":"whole",
  "category":"leafy_vegetable",
  "states":["raw"],
  "shapes_or_cuts":["whole"],
  "cook_speed":"fast",
  "moisture_release":"high",
  "texture_behavior":{
    "behavior_code":"wilts_quickly",
    "best_method_codes":["quick_saute","simmer"],
    "failure_mode_codes":["soft_when_overcooked"]
  },
  "cooking_risk":{"risk_code":"none","required_endpoint_codes":[]},
  "compatible_slot_codes":["vegetable","fast_cooking_vegetable"],
  "incompatible_slot_codes":[]
}
```

不得给它添加“青菜”“小白菜”“广东菜心”或其他别名。

- [ ] **Step 2: 给现有鸡腿 identity 增加同部位别名**

只修改 `chicken-leg.aliases`：

```json
"aliases":["鸡腿","去皮鸡腿肉"]
```

不得改变其 `canonical_name:"鸡肉"`、`shapes_or_cuts:["leg"]`、`risk_code:"raw_poultry"` 或 `required_endpoint_codes:["poultry_fully_cooked"]`。

- [ ] **Step 3: 原子同步版本闭包**

写入：

```json
// ingredient-taxonomy.v1.json
"taxonomy_version":"taxonomy-v1-20260727-r5"

// meal-templates.v2.json
"template_catalog_version":"templates-v2-20260727-r6",
"ingredient_taxonomy_version":"taxonomy-v1-20260727-r5"
```

同步 validator：

```js
// worker/src/ingredient-taxonomy-validator.js
if (data.taxonomy_version !== 'taxonomy-v1-20260727-r5') {
  errors.push('taxonomy_version must be taxonomy-v1-20260727-r5');
}

// worker/src/meal-template-validator.js
const TAXONOMY_VERSION = 'taxonomy-v1-20260727-r5';
if (catalog.template_catalog_version !== 'templates-v2-20260727-r6') {
  errors.push('template_catalog_version must be templates-v2-20260727-r6');
}
```

除顶层两个版本字段外，`meal-templates.v2.json` 的 `templates` 数组必须与 Task 1 前的内容深度相等。

- [ ] **Step 4: 运行聚焦测试并确认全部转绿**

Run:

```sh
node --test \
  tools/tests/ingredient-taxonomy.test.mjs \
  tools/tests/meal-template-catalog.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs \
  tools/tests/worker-generate-plan.test.mjs \
  tools/tests/planner-v2-parity.test.mjs
python3 -m py_compile ai_proxy.py
```

Expected: PASS；两组目标都是 `savory-mixed-rice-pot` 单锅 complete；去皮鸡腿保留原词和安全终点；忌口鸡肉拒绝；三个保留结构不 complete；模型替换项全部拒绝。

- [ ] **Step 5: 运行模板业务字段不变审计**

Run:

```sh
git show HEAD^:tools/data/meal-templates.v2.json > /tmp/lingnan-m1-templates-before.json
node - <<'NODE'
const fs = require('fs');
const before = JSON.parse(fs.readFileSync('/tmp/lingnan-m1-templates-before.json', 'utf8'));
const after = JSON.parse(fs.readFileSync('tools/data/meal-templates.v2.json', 'utf8'));
if (JSON.stringify(before.templates) !== JSON.stringify(after.templates)) {
  throw new Error('template business fields changed');
}
console.log(JSON.stringify({ total:after.templates.length, active:after.templates.filter(x => x.activation_status === 'active').length, planned:after.templates.filter(x => x.activation_status === 'planned').length }));
NODE
```

Expected: `{"total":16,"active":10,"planned":6}`；不得出现 template 业务差异。

- [ ] **Step 6: 提交最小实现**

```sh
git add tools/data/ingredient-taxonomy.v1.json worker/src/ingredient-taxonomy-validator.js \
  tools/data/meal-templates.v2.json worker/src/meal-template-validator.js
git commit -m "feat: add controlled Lingnan ingredient identities"
```

---

### Task 3: 把岭南边界写入 92 条公共旅程

**Files:**

- Modify: `tools/tests/pantry-planner-v2-journeys.test.mjs`
- Modify: `tools/data/pantry-planner-v2-journeys.json`
- Modify: `tools/run-pantry-planner-v2-journeys.mjs`

**Interfaces:**

- Consumes: Task 2 的确定性 Planner 行为。
- Produces: J85–J92、92/92 稳定公共门禁和 `regional_capability:48` 计数；所有新 `/plan-meal` 路径仍为 0 次 DeepSeek。

- [ ] **Step 1: 先扩展 corpus 测试到 92 并确认红灯**

在 `tools/tests/pantry-planner-v2-journeys.test.mjs` 修改：

```js
test('corpus maps spec journeys 1-92 exactly once', () => {
  assert.equal(corpus.journeys.length, 92);
  assert.deepEqual(corpus.journeys.map(entry => entry.spec_number), Array.from({ length:92 }, (_, index) => index + 1));
  assert.equal(new Set(corpus.journeys.map(entry => entry.id)).size, 92);
  assert.deepEqual(
    Object.fromEntries(Object.entries(Object.groupBy(corpus.journeys, entry => entry.category)).map(([key, value]) => [key, value.length])),
    { taxonomy_shape:8, recommend:3, pantry_coverage:8, decision:5, intent_swap:7, model_boundary:7, version_legacy:6, regional_capability:48 },
  );
});
```

把全旅程测试和 CLI 正则同步为 92。运行：

```sh
node --test tools/tests/pantry-planner-v2-journeys.test.mjs
```

Expected: FAIL，实际 corpus 仍为 84 条，runner 仍输出 84/84。

- [ ] **Step 2: 增加 J85–J92 完整机器记录**

所有记录都使用 `category:"regional_capability"`、`plan_deepseek_max:0`、`generate_deepseek_max:0`、`frontend_required:false`、`model_mutation:null`，并补齐 schema v2 的全部 constraints 字段。

```json
{"id":"J85","spec_number":85,"title":"广式腊肠菜心饭进入通用焖饭且不预补油盐","request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"pantry","intent":"normal","servings":2,"must_use":["大米","广式腊肠","菜心"],"prefer_use":[],"dislikes":[],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},"expect":{"status":["complete"],"complete_coverage":1,"required_template_ids":["savory-mixed-rice-pot"],"forbidden_required_extras":["食用油","盐"],"submitted_must_count":3},"plan_deepseek_max":0,"generate_deepseek_max":0,"frontend_required":false,"model_mutation":null}
{"id":"J86","spec_number":86,"title":"去皮鸡腿香菇饭保留原词和腿部形态","request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"pantry","intent":"normal","servings":2,"must_use":["大米","去皮鸡腿肉","鲜香菇"],"prefer_use":[],"dislikes":[],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},"expect":{"status":["complete"],"complete_coverage":1,"normalized":{"raw":"去皮鸡腿肉","canonical":"鸡肉","shape_or_cut":"leg","cooking_risk":"raw_poultry"},"required_template_ids":["savory-mixed-rice-pot"]},"plan_deepseek_max":0,"generate_deepseek_max":0,"frontend_required":false,"model_mutation":null}
{"id":"J87","spec_number":87,"title":"去皮鸡腿菜心饭保留禽肉安全终点","request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"pantry","intent":"normal","servings":2,"must_use":["大米","去皮鸡腿肉","菜心"],"prefer_use":[],"dislikes":[],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},"expect":{"status":["complete"],"complete_coverage":1,"normalized":{"raw":"去皮鸡腿肉","required_endpoint_codes":["poultry_fully_cooked"]},"required_template_ids":["savory-mixed-rice-pot"]},"plan_deepseek_max":0,"generate_deepseek_max":0,"frontend_required":false,"model_mutation":null}
{"id":"J88","spec_number":88,"title":"鸡肉忌口拦截去皮鸡腿","request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"pantry","intent":"normal","servings":2,"must_use":["大米","去皮鸡腿肉","鲜香菇"],"prefer_use":[],"dislikes":["鸡肉"],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},"expect":{"status":["needs_user_decision","no_valid_plan"],"complete_forbidden":true,"generation_allowed":false,"required_unplanned_raw":["去皮鸡腿肉"],"reason_codes":["allergen_conflict"]},"plan_deepseek_max":0,"generate_deepseek_max":0,"frontend_required":false,"model_mutation":null}
{"id":"J89","spec_number":89,"title":"生菜不得同焖后冒充定安菜包饭","request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"pantry","intent":"normal","servings":2,"must_use":["大米","生菜","胡萝卜"],"prefer_use":[],"dislikes":[],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},"expect":{"status":["needs_user_decision","no_valid_plan"],"complete_forbidden":true,"generation_allowed":false,"normalized":{"raw":"生菜","recognized":false},"required_unplanned_raw":["生菜"]},"plan_deepseek_max":0,"generate_deepseek_max":0,"frontend_required":false,"model_mutation":null}
{"id":"J90","spec_number":90,"title":"豆豉排骨组合继续停在完整计划前","request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"pantry","intent":"normal","servings":2,"must_use":["大米","猪肋排","豆豉"],"prefer_use":[],"dislikes":[],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},"expect":{"status":["needs_user_decision","no_valid_plan"],"complete_forbidden":true,"generation_allowed":false,"required_unplanned_raw":["猪肋排","豆豉"],"reason_codes":["unsupported_shape_or_cut","unrecognized_ingredient"]},"plan_deepseek_max":0,"generate_deepseek_max":0,"frontend_required":false,"model_mutation":null}
{"id":"J91","spec_number":91,"title":"五色糯米与色源不得回退普通白米焖饭","request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"pantry","intent":"normal","servings":2,"must_use":["糯米","食品级紫薯粉","食品级甜菜粉","食品级菠菜粉","食品级南瓜粉"],"prefer_use":[],"dislikes":[],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},"expect":{"status":["no_valid_plan"],"complete_forbidden":true,"generation_allowed":false,"required_unplanned_raw":["糯米","食品级紫薯粉","食品级甜菜粉","食品级菠菜粉","食品级南瓜粉"]},"plan_deepseek_max":0,"generate_deepseek_max":0,"frontend_required":false,"model_mutation":null}
{"id":"J92","spec_number":92,"title":"菜心与卷心菜两个高出水叶菜不得伪造完整单锅","request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"pantry","intent":"normal","servings":2,"must_use":["大米","广式腊肠","菜心","卷心菜"],"prefer_use":[],"dislikes":[],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},"expect":{"status":["complete","needs_user_decision"],"single_pot_complete_forbidden":true},"plan_deepseek_max":0,"generate_deepseek_max":0,"frontend_required":false,"model_mutation":null}
```

- [ ] **Step 3: 同步 runner 的严格 corpus 数量和稳定输出**

把 `validateCorpus()` 的长度和连续 spec number 改为 92，并把稳定输出改为：

```js
console.log('92/92 planner v2 journeys passed');
```

不增加 metadata-only expectation key；J85–J92 只使用 `HANDLED_EXPECTATION_KEYS` 已有的机器断言。

- [ ] **Step 4: 运行公共旅程并确认绿灯**

Run:

```sh
node --test tools/tests/pantry-planner-v2-journeys.test.mjs
node tools/run-pantry-planner-v2-journeys.mjs
```

Expected: PASS；CLI 输出 `regional_capability=48` 和 `92/92 planner v2 journeys passed`；所有新 plan 路径的 DeepSeek 上限为 0。

- [ ] **Step 5: 提交公共旅程**

```sh
git add tools/tests/pantry-planner-v2-journeys.test.mjs \
  tools/data/pantry-planner-v2-journeys.json tools/run-pantry-planner-v2-journeys.mjs
git commit -m "test: cover Lingnan planner journeys"
```

---

### Task 4: 更新地域能力账本和岭南覆盖审计，不扩大 claypot evidence

**Files:**

- Modify: `tools/tests/regional-menu-mappings.test.mjs`
- Modify: `tools/data/regional-menu-mappings.v1.json`
- Modify: `tools/tests/planner-menu-coverage-builder.test.mjs`
- Regenerate: `tools/generated/planner-menu-coverage.v1.json`
- Regenerate: `docs/planner-menu-coverage.md`
- Regenerate: `tools/generated/menu-master.v1.json`
- Regenerate: `docs/menu-master.md`
- Regenerate: `docs/menu-master.csv`
- Regenerate: `tools/generated/regional-atlas.v2.json`
- Regenerate: `docs/china-one-pot-regional-atlas.md`
- Regenerate: `docs/china-one-pot-regional-atlas.csv`
- Regenerate: `tools/generated/lingnan-hk-macao-one-pot-research.v1.json`
- Regenerate: `docs/lingnan-hk-macao-one-pot-research.md`

**Interfaces:**

- Consumes: Task 2 的新 taxonomy、Task 3 的稳定 Planner 行为和现有 72 道 recipe。
- Produces: `raw-rice-braise` 的岭南通用食材能力引用、岭南精确 2/5 覆盖事实，以及全部由权威 builder 重建的审计产物。

- [ ] **Step 1: 写 capability ledger 失败测试**

在 `tools/tests/regional-menu-mappings.test.mjs` 对 `raw-rice-braise` 增加：

```js
for (const id of ['choy-sum', 'chicken-leg']) {
  assert.ok(rawRice.taxonomy_item_ids.includes(id), id);
}
assert.ok(rawRice.region_ids.includes('lingnan_hk_macao'));
for (const id of ['cantonese-cured-meat-claypot-rice', 'cantonese-mushroom-chicken-claypot-rice']) {
  assert.equal(rawRice.evidence_recipe_ids.includes(id), false, id);
}
const claypot = byFamily.get('claypot-rice');
assert.notEqual(claypot.coverage_level, 'full');
assert.notEqual(claypot.promotion_status, 'covered_by_active_template');
```

Run:

```sh
node --test tools/tests/regional-menu-mappings.test.mjs
```

Expected: FAIL，`choy-sum`、`chicken-leg` 或岭南 region 尚未写入 raw-rice ledger；claypot 负断言必须保持通过。

- [ ] **Step 2: 只更新通用生米焖饭能力引用**

在 `raw-rice-braise`：

```json
"region_ids":["jiangnan","fujian_taiwan","lingnan_hk_macao","northwest","jinmeng","qinghai_tibet","yunnan_guizhou","sichuan_chongqing"]
```

并向 `taxonomy_item_ids` 增加：

```json
"choy-sum",
"chicken-leg"
```

不得增加 `evidence_recipe_ids`、改变 `coverage_level`、Ratio rule、blocker 或 `claypot-rice` capability row。

- [ ] **Step 3: 写精确覆盖失败测试**

在 `tools/tests/planner-menu-coverage-builder.test.mjs` 增加：

```js
test('Lingnan M1 recovers two generic plans and retains three structural gaps', () => {
  const report = buildRealReport();
  const byRecipeId = new Map(report.recipes.map(row => [row.recipe_id, row]));
  for (const id of [
    'cantonese-cured-meat-claypot-rice',
    'cantonese-mushroom-chicken-claypot-rice',
  ]) {
    assert.equal(byRecipeId.get(id).audit_status, 'full_single_pot_ingredient_compatible', id);
  }
  for (const id of [
    'hainan-cai-bao-rice',
    'cantonese-black-bean-pork-rib-claypot-rice',
    'guangxi-five-color-glutinous-rice',
  ]) {
    assert.ok(
      ['taxonomy_gap', 'planner_gap', 'no_recognized_core'].includes(byRecipeId.get(id).audit_status),
      id,
    );
  }
  const region = report.by_region.find(row => row.region_id === 'lingnan_hk_macao');
  assert.deepEqual([region.recipe_count, region.single_pot_full_count], [5, 2]);
});
```

Run:

```sh
node --test tools/tests/planner-menu-coverage-builder.test.mjs
node --test \
  tools/tests/planner-menu-coverage-artifacts.test.mjs \
  tools/tests/menu-master-artifacts.test.mjs \
  tools/tests/regional-atlas-artifacts.test.mjs \
  tools/tests/lingnan-hk-macao-one-pot-research-artifacts.test.mjs
```

Expected: builder 行为测试 PASS；artifact tests FAIL，明确报告 taxonomy/template hash 或签入产物过期。

- [ ] **Step 4: 只用权威 builder 重建产物**

Run:

```sh
node tools/build-planner-menu-coverage.mjs --write
node tools/build-planner-menu-coverage.mjs --check
node tools/build-menu-master.mjs --write
node tools/build-menu-master.mjs --check
node tools/build-regional-atlas.mjs --write
node tools/build-regional-atlas.mjs --check
node tools/build-lingnan-hk-macao-one-pot-research.mjs --write
node tools/build-lingnan-hk-macao-one-pot-research.mjs --check
```

不得手工编辑任何 generated JSON、Markdown 或 CSV。

- [ ] **Step 5: 运行审计门禁并确认绿灯**

Run:

```sh
node --test \
  tools/tests/regional-menu-mappings.test.mjs \
  tools/tests/planner-menu-coverage-builder.test.mjs \
  tools/tests/planner-menu-coverage-artifacts.test.mjs \
  tools/tests/menu-master-artifacts.test.mjs \
  tools/tests/regional-atlas-artifacts.test.mjs \
  tools/tests/lingnan-hk-macao-one-pot-research-artifacts.test.mjs
node tools/check-recipes.mjs
```

Expected: PASS；72 recipes、10 active + 6 planned；岭南 5 道中 2 道完整单锅、3 道保持缺口；`claypot-rice` 未升级。

- [ ] **Step 6: 提交覆盖事实和生成产物**

```sh
git add tools/tests/regional-menu-mappings.test.mjs tools/data/regional-menu-mappings.v1.json \
  tools/tests/planner-menu-coverage-builder.test.mjs \
  tools/generated/planner-menu-coverage.v1.json docs/planner-menu-coverage.md \
  tools/generated/menu-master.v1.json docs/menu-master.md docs/menu-master.csv \
  tools/generated/regional-atlas.v2.json docs/china-one-pot-regional-atlas.md \
  docs/china-one-pot-regional-atlas.csv \
  tools/generated/lingnan-hk-macao-one-pot-research.v1.json \
  docs/lingnan-hk-macao-one-pot-research.md
git commit -m "docs: record Lingnan planner capability recovery"
```

---

### Task 5: 同步 92 条门禁事实并完成全量验证

**Files:**

- Modify: `CLAUDE.md`
- Modify: `部署说明.md`
- Modify: `tools/tests/worker-planner-v2.test.mjs`
- Verify only: entire repository

**Interfaces:**

- Consumes: Tasks 1–4 的所有提交。
- Produces: `/health`、本地 bridge、部署说明和项目说明对 r6/r5/r3、10/6、72、92/92 的一致事实，以及最终 Draft PR 提交证据。

- [ ] **Step 1: 先写部署事实失败测试**

在 `tools/tests/worker-planner-v2.test.mjs` 把版本和旅程断言改为：

```js
assert.match(deployment, /templates-v2-20260727-r6/);
assert.match(deployment, /taxonomy-v1-20260727-r5/);
assert.match(deployment, /ratio-rules-v1-20260727-r3/);
assert.match(deployment, /10 个 active templates，6 个 planned templates/);
assert.match(deployment, /92\/92/);
```

同步 `/health` 期望的 `templateCatalogVersion` 与 `ingredientTaxonomyVersion`。运行：

```sh
node --test tools/tests/worker-planner-v2.test.mjs
```

Expected: FAIL，说明文档仍为 r5/r4 和 84/84；不得因 Worker 资产加载错误失败。

- [ ] **Step 2: 同步说明文档和运行时事实**

在 `CLAUDE.md` 和 `部署说明.md` 写入：

- `templates-v2-20260727-r6`；
- `taxonomy-v1-20260727-r5`；
- `ratio-rules-v1-20260727-r3`；
- 10 active + 6 planned；
- 72 recipes；
- 92/92 真实旅程。

保留“Planner V2 仍只在 Draft PR、未进行真实 DeepSeek live 验证、未部署 Preview 或 production、自动门禁不等于人工菜谱批准”。

- [ ] **Step 3: 运行版本与构建聚焦测试**

Run:

```sh
node --test tools/tests/worker-planner-v2.test.mjs tools/tests/build-dist.test.mjs
```

Expected: PASS；构建只收集运行时 Planner 资产，不把地域研究和覆盖审计产物打进 production bundle。

- [ ] **Step 4: 提交部署事实**

```sh
git add CLAUDE.md 部署说明.md tools/tests/worker-planner-v2.test.mjs
git commit -m "docs: align Lingnan planner baseline"
```

- [ ] **Step 5: 跑全量 Node 测试和全部硬门禁**

Run:

```sh
node --test --test-reporter=dot tools/tests/*.test.mjs
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
python3 -m py_compile ai_proxy.py
node tools/build-planner-menu-coverage.mjs --check
node tools/build-menu-master.mjs --check
node tools/build-regional-atlas.mjs --check
node tools/build-lingnan-hk-macao-one-pot-research.mjs --check
```

Expected: 全部 exit 0；旅程输出 `92/92 planner v2 journeys passed`；无 stderr 警告或 stale artifact。

- [ ] **Step 6: 做干净构建和范围审计**

Run:

```sh
TMP_DIR="dist/lingnan-m1-check-$$"
node tools/build-dist.mjs --out-dir "$TMP_DIR" --build-id "lingnan-m1-check"
node --test tools/tests/build-dist.test.mjs
git diff --check
node -e "const x=require('./tools/data/recipe-library.json');const a=x.recipes||x;const c=a.reduce((m,r)=>(m[r.status]=(m[r.status]||0)+1,m),{});console.log(JSON.stringify({total:a.length,status:c}))"
node -e "const x=require('./tools/data/meal-templates.v2.json');console.log(JSON.stringify({total:x.templates.length,active:x.templates.filter(t=>t.activation_status==='active'&&t.runtime_eligible).length,planned:x.templates.filter(t=>t.activation_status==='planned').length}))"
git status --short
```

Expected:

```json
{"total":72,"status":{"approved":12,"auto_approved":60}}
{"total":16,"active":10,"planned":6}
```

`git status --short` 必须为空；不得出现 recipe diff、`dist/`、`.env`、密钥或部署产物。

- [ ] **Step 7: 更新并核对 Draft PR**

Run:

```sh
git push origin codex/targeted-recipe-expansion
gh pr view 1 --json number,state,isDraft,headRefName,headRefOid,url
```

Expected: remote head 等于本地 HEAD；PR #1 为 `OPEN`、`isDraft:true`、head 为 `codex/targeted-recipe-expansion`。若 Git HTTPS 仍不可达，使用已验证的 GitHub Git Data API 创建 blob/tree/commit 并做非 force ref 更新；禁止 force push。

- [ ] **Step 8: 明确未执行项**

交付记录必须写明：

- 未部署 Preview；
- 未部署 production；
- 未合并 PR；
- 未调用真实 DeepSeek live；
- 未新增、删除、修改或人工批准 recipe；
- 未新增 template 或扩大 claypot technique evidence；
- 生菜菜包饭、豆豉排骨煲仔饭、五色糯米饭三个缺口仍存在。

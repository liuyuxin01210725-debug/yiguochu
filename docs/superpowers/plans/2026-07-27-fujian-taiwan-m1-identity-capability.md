# Fujian Taiwan M1 Identity Capability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不新增 recipe 或 template 的前提下，让卷心菜／高丽菜香菇饭与芥菜／盖菜猪肉末饭进入现有确定性生米焖饭能力，同时继续阻止模糊扁豆、糯米、荷叶和色源组合。

**Architecture:** 食材组合能力仍由 `ingredient-taxonomy.v1.json` + `meal-templates.v2.json` + `ratio-rules.v1.json` 决定。新增三个 pantry identity，给 `savory-mixed-rice-pot` 的通用猪肉槽增加受控 `ground` 形态；Ratio DSL 数值和模型权限不变。Planner 纯函数先通过真实旅程，再通过 Worker/Python bridge、生成锁和离线覆盖审计证明端到端边界。

**Tech Stack:** JSON 机器资产、Cloudflare Pages Functions ES modules、Node.js 内置 `node:test`、Python 3 本地 bridge、确定性 Markdown/JSON 构建器。

## Global Constraints

- [ ] 以 `docs/superpowers/specs/2026-07-27-fujian-taiwan-m1-identity-capability-design.md` 为唯一产品契约。
- [ ] `tools/data/recipe-library.json` 必须保持 72 道：12 `approved` + 60 `auto_approved`；不得新增、删除或修改 recipe。
- [ ] Template catalog 必须保持 16 个：10 active + 6 planned；不得新增地域固定模板或改变激活状态。
- [ ] 目标版本固定为 `taxonomy-v1-20260727-r4`、`templates-v2-20260727-r5`、`ratio-rules-v1-20260727-r3`。
- [ ] 普通“扁豆”、`糯米`、`泡发糯米`、`食品级干荷叶`、`食品级黑米色粉`继续未识别；不得归入近似食材。
- [ ] `savory-mixed-rice-pot` 只增加猪肉 `ground` 形态；原有槽位数量、顺序、高出水上限、时间、安全终点和 evidence IDs 不变。
- [ ] `tools/data/ratio-rules.v1.json` 内容和版本不变；不得引入台湾来源的状态依赖 0.8 倍水作为通用规则。
- [ ] `/plan-meal` 保持 0 次 DeepSeek；`/generate-plan` 每次最多 1 次且不自动重试。
- [ ] 每个行为修改先写失败测试并观察预期红灯，再写最小实现并观察绿灯。
- [ ] 不修改前端产品流程，不新增账号、用户画像、营养追踪、云端用户数据或多 Agent 产品能力。
- [ ] 只更新 Draft PR #1；不部署 Preview 或 production，不合并 PR。

---

## File Responsibility Map

- `tools/data/ingredient-taxonomy.v1.json`：卷心菜、芥菜、猪肉末的唯一机器身份和烹饪属性真源。
- `worker/src/ingredient-taxonomy-validator.js`：taxonomy 固定版本及有限字段校验；本轮不扩词表。
- `tools/data/meal-templates.v2.json`：绑定 taxonomy r4，并让通用生米焖饭猪肉槽接受 `ground`。
- `worker/src/meal-template-validator.js`：template r5 / taxonomy r4 版本闭包，不改变 schema。
- `tools/tests/ingredient-taxonomy.test.mjs`：三项身份、别名、部位和保留缺口。
- `tools/tests/meal-template-catalog.test.mjs`：模板数量、版本和 ground 形态的静态锁。
- `tools/tests/pantry-planner-v2-selection.test.mjs`：两组菜单核心的纯函数单锅行为及负例。
- `tools/data/pantry-planner-v2-journeys.json`：J77–J84 的公共边界旅程。
- `tools/run-pantry-planner-v2-journeys.mjs`：84 条旅程的机器断言和稳定 CLI 汇总。
- `tools/tests/pantry-planner-v2-journeys.test.mjs`：旅程数量、分类和 runner 覆盖。
- `tools/tests/planner-v2-parity.test.mjs`：Worker 与 Python bridge 对闽台计划的事实一致性。
- `tools/tests/worker-generate-plan.test.mjs`：新食材的 locked plan 和模型越界拒绝。
- `tools/tests/planner-menu-coverage-builder.test.mjs`：2/6 覆盖、四个诚实缺口和 evidence 标签。
- `tools/generated/planner-menu-coverage.v1.json`、`docs/planner-menu-coverage.md`：新 taxonomy 下的确定性覆盖产物。
- `tools/generated/menu-master.v1.json`、`docs/menu-master.md`、`docs/menu-master.csv`：taxonomy hash 变化后的菜单总账产物。
- `CLAUDE.md`、`部署说明.md`、`tools/tests/worker-planner-v2.test.mjs`：版本、模板数量和 84/84 门禁事实。

---

### Task 1: 建立三个受控食材身份并原子同步版本

**Files:**

- Modify: `tools/tests/ingredient-taxonomy.test.mjs`
- Modify: `tools/data/ingredient-taxonomy.v1.json`
- Modify: `worker/src/ingredient-taxonomy-validator.js`
- Modify: `tools/tests/meal-template-catalog.test.mjs`
- Modify: `tools/data/meal-templates.v2.json`
- Modify: `worker/src/meal-template-validator.js`
- Modify: `tools/tests/worker-planner-v2.test.mjs`
- Modify: `CLAUDE.md`
- Modify: `部署说明.md`

**Interfaces:**

- Consumes: `normalizePlannerItems(items, taxonomy)` 和现有 taxonomy validator。
- Produces: `green-cabbage`、`mustard-greens`、`ground-pork` 三个稳定 pantry identity；taxonomy r4 / template r5 版本闭包。

- [ ] **Step 1: 先写身份和版本失败测试**

在 `tools/tests/ingredient-taxonomy.test.mjs` 把版本改为 r4，并增加：

```js
test('Fujian Taiwan M1 identities preserve names cuts and controlled aliases', () => {
  const rows = normalizePlannerItems(
    ['卷心菜', '高丽菜', '白菜', '芥菜', '盖菜', '猪肉末', '猪绞肉', '猪肉片'],
    catalog,
  );
  assert.deepEqual(rows.map(row => [row.raw, row.canonical, row.category, row.shape_or_cut]), [
    ['卷心菜', '卷心菜', 'leafy_vegetable', 'whole'],
    ['高丽菜', '卷心菜', 'leafy_vegetable', 'whole'],
    ['白菜', '白菜', 'leafy_vegetable', 'whole'],
    ['芥菜', '芥菜', 'leafy_vegetable', 'whole'],
    ['盖菜', '芥菜', 'leafy_vegetable', 'whole'],
    ['猪肉末', '猪肉', 'pork', 'ground'],
    ['猪绞肉', '猪肉', 'pork', 'ground'],
    ['猪肉片', '猪肉', 'pork', 'slice'],
  ]);
  assert.equal(rows[1].display_name, '卷心菜');
  assert.equal(rows[6].display_name, '猪肉末');
  assert.deepEqual(rows[5].required_endpoint_codes, ['pork_fully_cooked']);
});

test('Fujian Taiwan M1 retains ambiguous beans glutinous rice leaf and color gaps', () => {
  const rows = normalizePlannerItems(
    ['扁豆', '糯米', '泡发糯米', '食品级干荷叶', '食品级黑米色粉'],
    catalog,
  );
  assert.ok(rows.every(row => row.recognized === false));
});
```

同步静态版本断言：

```js
assert.equal(catalog.taxonomy_version, 'taxonomy-v1-20260727-r4');
assert.equal(templateCatalog.template_catalog_version, 'templates-v2-20260727-r5');
assert.equal(templateCatalog.ingredient_taxonomy_version, 'taxonomy-v1-20260727-r4');
```

- [ ] **Step 2: 运行聚焦测试并确认红灯**

Run:

```sh
node --test \
  tools/tests/ingredient-taxonomy.test.mjs \
  tools/tests/meal-template-catalog.test.mjs \
  tools/tests/worker-planner-v2.test.mjs
```

Expected: FAIL，明确指出 taxonomy 仍为 r3、template 仍为 r4，且三个 identity 未识别；不得只看到语法错误。

- [ ] **Step 3: 写入三个精确 taxonomy row**

在 `tools/data/ingredient-taxonomy.v1.json` 增加：

```json
{"canonical_id":"green-cabbage","display_name":"卷心菜","aliases":["高丽菜"],"input_scope":"pantry_input","category":"leafy_vegetable","states":["raw"],"shapes_or_cuts":["whole","slice"],"cook_speed":"fast","moisture_release":"high","texture_behavior":{"behavior_code":"wilts_quickly","best_method_codes":["simmer","quick_saute"],"failure_mode_codes":["watery_when_overloaded"]},"cooking_risk":{"risk_code":"none","required_endpoint_codes":[]},"compatible_slot_codes":["vegetable","fast_cooking_vegetable"],"incompatible_slot_codes":[]}
```

```json
{"canonical_id":"mustard-greens","display_name":"芥菜","aliases":["盖菜"],"input_scope":"pantry_input","category":"leafy_vegetable","states":["raw"],"shapes_or_cuts":["whole","slice"],"cook_speed":"fast","moisture_release":"high","texture_behavior":{"behavior_code":"wilts_quickly","best_method_codes":["simmer","quick_saute"],"failure_mode_codes":["soft_when_overcooked"]},"cooking_risk":{"risk_code":"none","required_endpoint_codes":[]},"compatible_slot_codes":["vegetable","fast_cooking_vegetable"],"incompatible_slot_codes":[]}
```

```json
{"canonical_id":"ground-pork","display_name":"猪肉末","canonical_name":"猪肉","aliases":["猪绞肉"],"input_scope":"pantry_input","category":"pork","states":["raw"],"shapes_or_cuts":["ground"],"cook_speed":"fast","moisture_release":"low","texture_behavior":{"behavior_code":"crumbles_when_cooked","best_method_codes":["quick_saute","short_simmer"],"failure_mode_codes":["chewy_when_undercooked"]},"cooking_risk":{"risk_code":"raw_pork","required_endpoint_codes":["pork_fully_cooked"]},"compatible_slot_codes":["generic_pork","ground_meat_required"],"incompatible_slot_codes":["rib_required"]}
```

不要给 `green-beans` 添加“扁豆” alias；不要创建 glutinous rice 或 leaf identity。

- [ ] **Step 4: 原子同步版本闭包**

写入：

```json
// ingredient-taxonomy.v1.json
"taxonomy_version":"taxonomy-v1-20260727-r4"

// meal-templates.v2.json
"template_catalog_version":"templates-v2-20260727-r5",
"ingredient_taxonomy_version":"taxonomy-v1-20260727-r4"
```

同步：

```js
// worker/src/ingredient-taxonomy-validator.js
if (data.taxonomy_version !== 'taxonomy-v1-20260727-r4') {
  errors.push('taxonomy_version must be taxonomy-v1-20260727-r4');
}

// worker/src/meal-template-validator.js
const TAXONOMY_VERSION = 'taxonomy-v1-20260727-r4';
if (catalog.template_catalog_version !== 'templates-v2-20260727-r5') {
  errors.push('template_catalog_version must be templates-v2-20260727-r5');
}
```

把 `tools/tests/worker-planner-v2.test.mjs`、`CLAUDE.md`、`部署说明.md` 的三份 Planner 版本同步为 r5/r4/r3；旅程数字在本任务仍写 76/76。

- [ ] **Step 5: 运行聚焦测试并确认绿灯**

Run:

```sh
node --test \
  tools/tests/ingredient-taxonomy.test.mjs \
  tools/tests/meal-template-catalog.test.mjs \
  tools/tests/worker-planner-v2.test.mjs
node tools/check-recipes.mjs
```

Expected: PASS；输出仍为 72 recipes、10 active + 6 planned、ratio DSL r3。

- [ ] **Step 6: 提交**

```sh
git add tools/tests/ingredient-taxonomy.test.mjs tools/data/ingredient-taxonomy.v1.json \
  worker/src/ingredient-taxonomy-validator.js tools/tests/meal-template-catalog.test.mjs \
  tools/data/meal-templates.v2.json worker/src/meal-template-validator.js \
  tools/tests/worker-planner-v2.test.mjs CLAUDE.md 部署说明.md
git commit -m "feat: add controlled Fujian Taiwan ingredient identities"
```

---

### Task 2: 只给通用生米焖饭开放猪肉末形态

**Files:**

- Modify: `tools/tests/meal-template-catalog.test.mjs`
- Modify: `tools/tests/pantry-planner-v2-selection.test.mjs`
- Modify: `tools/tests/worker-generate-plan.test.mjs`
- Modify: `tools/data/meal-templates.v2.json`

**Interfaces:**

- Consumes: Task 1 的 `ground-pork` identity。
- Produces: `savory-mixed-rice-pot` 对 `pork/ground` 的唯一新增兼容；两组目标输入的完整单锅 plan；锁定新食材的生成契约。

- [ ] **Step 1: 写 Planner 与模板失败测试**

在 `tools/tests/meal-template-catalog.test.mjs` 增加：

```js
test('savory mixed rice accepts ground pork without changing regional evidence', () => {
  const template = catalog.templates.find(row => row.template_id === 'savory-mixed-rice-pot');
  const pork = template.shape_or_cut_requirements.find(row => row.slot_id === 'protein' && row.category === 'pork');
  assert.ok(pork.allowed_shapes.includes('ground'));
  assert.ok(pork.forbidden_shapes.includes('rib'));
  assert.equal(template.evidence_recipe_ids.includes('fujian-gai-cai-minced-pork-rice'), false);
});
```

在 `tools/tests/pantry-planner-v2-selection.test.mjs` 增加：

```js
test('Fujian Taiwan M1 menu cores become complete single-pot generic rice plans', () => {
  for (const [title, must] of [
    ['高丽菜香菇炊饭', ['大米', '卷心菜', '鲜香菇']],
    ['福建盖菜肉末咸饭', ['大米', '芥菜', '猪肉末']],
  ]) {
    const result = planMeal(assets, request({ must }));
    assert.equal(result.status, 'complete', title);
    assert.equal(result.plan.plan_kind, 'single_pot', title);
    assert.equal(result.plan.pots[0].template_id, 'savory-mixed-rice-pot', title);
    assert.deepEqual(new Set(result.plan.pots[0].planned_must_use.map(item => item.raw)), new Set(must), title);
    assert.deepEqual(result.plan.unplanned_must_use, [], title);
    assert.equal(result.plan.pots[0].coverage_ratio, 1, title);
  }
});

test('ground pork compatibility never leaks to ribs or ambiguous Fujian staples', () => {
  const ribs = planMeal(assets, request({ must: ['大米', '猪肋排', '芥菜'] }));
  assert.notEqual(ribs.status, 'complete');
  assert.equal(ribs.plan.unplanned_must_use.find(item => item.raw === '猪肋排')?.reason_code, 'unsupported_shape_or_cut');
  for (const must of [
    ['大米', '扁豆'],
    ['泡发糯米', '猪肉末', '鲜香菇'],
    ['糯米', '猪肉末', '食品级干荷叶'],
  ]) assert.notEqual(planMeal(assets, request({ must })).status, 'complete');
});
```

- [ ] **Step 2: 写生成锁失败测试**

在 `tools/tests/worker-generate-plan.test.mjs` 增加：

```js
test('locked Fujian mustard ground pork rice rejects ingredient substitutions', async () => {
  const journey = await preparedJourney(plannerRequest({ must: ['大米', '芥菜', '猪肉末'] }));
  const templates = JSON.parse(SOURCE_ASSETS['/meal-templates.v2.json']);
  const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
  const names = locked.meals.flatMap(meal => meal.locked_ingredients.map(item => item.raw_name));
  assert.ok(names.includes('芥菜'));
  assert.ok(names.includes('猪肉末'));
  const valid = validModelOutput(locked);
  assert.equal(workerModule.validateGeneratedPlan(valid, locked, ingredientTermUniverse()).ok, true);
  for (const forbidden of ['白菜', '猪肉片', '排骨']) {
    const output = structuredClone(valid);
    output.meals[0].steps[0].text += `加入${forbidden}。`;
    assert.equal(workerModule.validateGeneratedPlan(output, locked, ingredientTermUniverse()).ok, false, forbidden);
  }
});
```

- [ ] **Step 3: 运行并确认红灯指向 ground 形态**

Run:

```sh
node --test \
  tools/tests/meal-template-catalog.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs \
  tools/tests/worker-generate-plan.test.mjs
```

Expected: FAIL；卷心菜组合可以先通过，但芥菜猪肉末因 `unsupported_shape_or_cut` 失败，模板静态断言缺少 `ground`，生成旅程无法获得可生成完整 plan。

- [ ] **Step 4: 写最小模板改动**

只在 `savory-mixed-rice-pot.shape_or_cut_requirements` 的 pork row 修改：

```json
{
  "slot_id":"protein",
  "category":"pork",
  "allowed_shapes":["slice","dice","tenderloin","ground","cured_slice","sausage"],
  "forbidden_shapes":["rib"]
}
```

不得修改 template 的 slots、limits、cooking order、ratio constraints、time、supported intents 或 evidence IDs。

- [ ] **Step 5: 运行聚焦测试并确认绿灯**

Run:

```sh
node --test \
  tools/tests/meal-template-catalog.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs \
  tools/tests/worker-generate-plan.test.mjs
```

Expected: PASS；芥菜猪肉末为单锅 complete，猪肋排仍被 `unsupported_shape_or_cut` 拒绝，模型替换项被拒绝。

- [ ] **Step 6: 提交**

```sh
git add tools/tests/meal-template-catalog.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs \
  tools/tests/worker-generate-plan.test.mjs tools/data/meal-templates.v2.json
git commit -m "feat: allow ground pork in generic mixed rice plans"
```

---

### Task 3: 把闽台边界写入 84 条公共旅程并锁定双端 parity

**Files:**

- Modify: `tools/data/pantry-planner-v2-journeys.json`
- Modify: `tools/run-pantry-planner-v2-journeys.mjs`
- Modify: `tools/tests/pantry-planner-v2-journeys.test.mjs`
- Modify: `tools/tests/planner-v2-parity.test.mjs`

**Interfaces:**

- Consumes: Task 1/2 的 Planner 行为。
- Produces: J77–J84、`single_pot_complete_forbidden` runner 断言、84/84 稳定门禁和 Worker/Python bridge 一致性证据。

- [ ] **Step 1: 先扩展 corpus 测试到 84 并确认红灯**

在 `tools/tests/pantry-planner-v2-journeys.test.mjs` 修改：

```js
assert.equal(corpus.journeys.length, 84);
assert.deepEqual(corpus.journeys.map(entry => entry.spec_number), Array.from({ length:84 }, (_, index) => index + 1));
assert.equal(new Set(corpus.journeys.map(entry => entry.id)).size, 84);
assert.deepEqual(categoryCounts, {
  taxonomy_shape:8, recommend:3, pantry_coverage:8, decision:5,
  intent_swap:7, model_boundary:7, version_legacy:6, regional_capability:40,
});
```

把测试标题和 CLI 正则同步为 1–84 / 84/84。运行：

```sh
node --test tools/tests/pantry-planner-v2-journeys.test.mjs
```

Expected: FAIL，实际仍为 76 条。

- [ ] **Step 2: 增加 J77–J84 完整机器记录**

所有记录使用 `category:"regional_capability"`、`plan_deepseek_max:0`、`generate_deepseek_max:0`、`frontend_required:false`、`model_mutation:null`。

关键 expectation：

```json
{"id":"J77","spec_number":77,"title":"台湾卷心菜香菇炊饭完整进入通用生米焖饭","expect":{"status":["complete"],"complete_coverage":1,"required_template_ids":["savory-mixed-rice-pot"],"submitted_must_count":3}}
{"id":"J78","spec_number":78,"title":"高丽菜别名保留原词进入同一受控身份","expect":{"status":["complete"],"complete_coverage":1,"normalized":{"raw":"高丽菜","canonical":"卷心菜","display_name":"卷心菜"},"required_template_ids":["savory-mixed-rice-pot"]}}
{"id":"J79","spec_number":79,"title":"福建芥菜猪肉末饭完整覆盖","expect":{"status":["complete"],"complete_coverage":1,"normalized":{"raw":"猪肉末","canonical":"猪肉","shape_or_cut":"ground"},"required_template_ids":["savory-mixed-rice-pot"]}}
{"id":"J80","spec_number":80,"title":"盖菜猪绞肉别名保留肉末形态","expect":{"status":["complete"],"complete_coverage":1,"normalized":{"raw":"猪绞肉","canonical":"猪肉","shape_or_cut":"ground"},"required_template_ids":["savory-mixed-rice-pot"]}}
{"id":"J81","spec_number":81,"title":"泛称扁豆继续要求明确身份","expect":{"status":["needs_user_decision","no_valid_plan"],"complete_forbidden":true,"generation_allowed":false,"normalized":{"raw":"扁豆","recognized":false},"required_unplanned_raw":["扁豆"]}}
{"id":"J82","spec_number":82,"title":"泡发糯米不得因肉末可识别而回退普通生米锅","expect":{"status":["needs_user_decision","no_valid_plan"],"complete_forbidden":true,"generation_allowed":false,"required_unplanned_raw":["泡发糯米"]}}
{"id":"J83","spec_number":83,"title":"荷叶糯米组合继续停在生成前","expect":{"status":["needs_user_decision","no_valid_plan"],"complete_forbidden":true,"generation_allowed":false,"required_unplanned_raw":["糯米","食品级干荷叶"]}}
{"id":"J84","spec_number":84,"title":"两个高出水叶菜不得伪造完整单锅","expect":{"status":["complete","needs_user_decision"],"single_pot_complete_forbidden":true}}
```

每条记录补齐完整 `request.constraints`。J84 输入固定为 `大米、卷心菜、芥菜、猪肉末`。

- [ ] **Step 3: 给 runner 增加单一新断言键并同步计数**

把 `single_pot_complete_forbidden` 加入 `HANDLED_EXPECTATION_KEYS`，在 `runOne()` 中实现：

```js
if (entry.expect.single_pot_complete_forbidden) {
  assert.equal(
    planned.body.status === 'complete' && planned.body.plan.plan_kind === 'single_pot',
    false,
    `${entry.id} must not fabricate a complete single pot`,
  );
}
```

把 `validateCorpus()` 的长度和 spec number 改为 84，把稳定输出改为：

```js
if (journeys.length === corpus.journeys.length) console.log('84/84 planner v2 journeys passed');
```

- [ ] **Step 4: 增加 Worker/Python parity 测试**

在 `tools/tests/planner-v2-parity.test.mjs` 增加：

```js
test('Fujian mustard ground pork rice facts are identical across Worker and Python bridge', async () => {
  const body = await parityCase(
    'Fujian mustard ground pork rice',
    request({ must: ['大米', '芥菜', '猪肉末'] }),
    'complete',
  );
  assert.equal(body.plan.plan_kind, 'single_pot');
  assert.deepEqual(body.plan.unplanned_must_use, []);
  assert.deepEqual(
    new Set(body.plan.pots[0].planned_must_use.map(item => item.raw)),
    new Set(['大米', '芥菜', '猪肉末']),
  );
  assert.equal(
    body.normalized_items.find(item => item.raw === '猪肉末')?.shape_or_cut,
    'ground',
  );
});
```

- [ ] **Step 5: 运行聚焦门禁并确认绿灯**

Run:

```sh
node --test \
  tools/tests/pantry-planner-v2-journeys.test.mjs \
  tools/tests/planner-v2-parity.test.mjs
node tools/run-pantry-planner-v2-journeys.mjs
python3 -m py_compile ai_proxy.py
```

Expected: PASS；CLI 输出 `regional_capability=40` 和 `84/84 planner v2 journeys passed`；Python bridge 无语法漂移。

- [ ] **Step 6: 提交**

```sh
git add tools/data/pantry-planner-v2-journeys.json \
  tools/run-pantry-planner-v2-journeys.mjs \
  tools/tests/pantry-planner-v2-journeys.test.mjs \
  tools/tests/planner-v2-parity.test.mjs
git commit -m "test: cover Fujian Taiwan planner journeys"
```

---

### Task 4: 更新地域能力账本和覆盖审计，不扩大 evidence 声明

**Files:**

- Modify: `tools/tests/regional-menu-mappings.test.mjs`
- Modify: `tools/data/regional-menu-mappings.v1.json`
- Modify: `tools/tests/planner-menu-coverage-builder.test.mjs`
- Modify: `tools/tests/planner-menu-coverage-artifacts.test.mjs`
- Regenerate: `tools/generated/planner-menu-coverage.v1.json`
- Regenerate: `docs/planner-menu-coverage.md`
- Regenerate: `tools/generated/menu-master.v1.json`
- Regenerate: `docs/menu-master.md`
- Regenerate: `docs/menu-master.csv`

**Interfaces:**

- Consumes: Planner 当前纯函数和新 taxonomy/template hash。
- Produces: raw-rice-braise capability 的新 taxonomy 引用、闽台精确 2/6 覆盖事实、最新菜单总账。

- [ ] **Step 1: 写 capability ledger 失败测试**

在 `tools/tests/regional-menu-mappings.test.mjs` 对 `raw-rice-braise` 增加：

```js
for (const id of ['green-cabbage', 'mustard-greens', 'ground-pork']) {
  assert.ok(rawRice.taxonomy_item_ids.includes(id), id);
}
assert.equal(rawRice.evidence_recipe_ids.includes('fujian-gai-cai-minced-pork-rice'), false);
```

Run:

```sh
node --test tools/tests/regional-menu-mappings.test.mjs
```

Expected: FAIL，三个 taxonomy ID 尚未写入 ledger。

- [ ] **Step 2: 只更新 taxonomy 引用**

在 `raw-rice-braise.taxonomy_item_ids` 增加：

```json
"green-cabbage",
"mustard-greens",
"ground-pork"
```

不得添加新的 `evidence_recipe_ids`，不得改变 `coverage_level`、`promotion_status`、Ratio rule 或 blocker。

- [ ] **Step 3: 写精确覆盖失败测试**

在 `tools/tests/planner-menu-coverage-builder.test.mjs` 增加：

```js
test('Fujian Taiwan M1 recovers two generic plans and retains four honest gaps', () => {
  const report = buildRealReport();
  const byId = new Map(report.recipes.map(row => [row.recipe_id, row]));
  assert.equal(byId.get('taiwan-cabbage-mushroom-rice').audit_status, 'full_single_pot_evidence_aligned');
  assert.equal(byId.get('fujian-gai-cai-minced-pork-rice').audit_status, 'full_single_pot_ingredient_compatible');
  assert.equal(byId.get('fujian-hyacinth-bean-rice').audit_status, 'taxonomy_gap');
  for (const id of ['quanzhou-oil-rice', 'daxi-lotus-leaf-oil-rice', 'she-people-black-rice']) {
    assert.ok(['taxonomy_gap', 'no_recognized_core'].includes(byId.get(id).audit_status), id);
  }
  const region = report.by_region.find(row => row.region_id === 'fujian_taiwan');
  assert.deepEqual(
    [region.recipe_count, region.single_pot_full_count],
    [6, 2],
  );
});
```

先运行行为测试，再运行产物测试：

```sh
node --test tools/tests/planner-menu-coverage-builder.test.mjs
node --test tools/tests/planner-menu-coverage-artifacts.test.mjs tools/tests/menu-master-artifacts.test.mjs
```

Expected: builder 行为断言 PASS；artifact tests FAIL，明确报告 taxonomy hash 或已签入 JSON/Markdown/CSV 过期。

- [ ] **Step 4: 用权威构建器重建产物**

Run:

```sh
node tools/build-planner-menu-coverage.mjs --write
node tools/build-planner-menu-coverage.mjs --check
node tools/build-menu-master.mjs --write
node tools/build-menu-master.mjs --check
```

不得手工编辑 generated JSON、Markdown 或 CSV。

- [ ] **Step 5: 运行审计门禁并确认绿灯**

Run:

```sh
node --test \
  tools/tests/regional-menu-mappings.test.mjs \
  tools/tests/planner-menu-coverage-builder.test.mjs \
  tools/tests/planner-menu-coverage-artifacts.test.mjs \
  tools/tests/menu-master-artifacts.test.mjs
node tools/check-recipes.mjs
```

Expected: PASS；72 recipes、10 active + 6 planned；闽台 6 道中 2 道完整单锅、4 道保持缺口。

- [ ] **Step 6: 提交**

```sh
git add tools/tests/regional-menu-mappings.test.mjs tools/data/regional-menu-mappings.v1.json \
  tools/tests/planner-menu-coverage-builder.test.mjs \
  tools/tests/planner-menu-coverage-artifacts.test.mjs \
  tools/generated/planner-menu-coverage.v1.json docs/planner-menu-coverage.md \
  tools/generated/menu-master.v1.json docs/menu-master.md docs/menu-master.csv
git commit -m "docs: record Fujian Taiwan planner capability recovery"
```

---

### Task 5: 同步 84 条门禁事实并验证构建边界

**Files:**

- Modify: `CLAUDE.md`
- Modify: `部署说明.md`
- Modify: `tools/tests/worker-planner-v2.test.mjs`

**Interfaces:**

- Consumes: Task 1 的版本与 Task 3 的 84 条旅程。
- Produces: `/health`、部署文档和项目说明对 r5/r4/r3、10/6、72、84/84 的一致事实。

- [ ] **Step 1: 先写部署事实失败测试**

在 `tools/tests/worker-planner-v2.test.mjs` 把部署文档断言改为：

```js
assert.match(deployment, /templates-v2-20260727-r5/);
assert.match(deployment, /taxonomy-v1-20260727-r4/);
assert.match(deployment, /ratio-rules-v1-20260727-r3/);
assert.match(deployment, /10 个 active templates，6 个 planned templates/);
assert.match(deployment, /84\/84/);
```

Run:

```sh
node --test tools/tests/worker-planner-v2.test.mjs
```

Expected: FAIL，只缺 `84/84` 文档事实；版本断言已经由 Task 1 通过。

- [ ] **Step 2: 同步两份说明文档**

在 `CLAUDE.md` 和 `部署说明.md` 把真实旅程门禁从 76/76 改为 84/84。保留：

- Planner V2 仍只在 Draft PR；
- 未进行真实 DeepSeek live 验证；
- 未部署 Preview 或 production；
- 自动门禁不等于人工菜谱批准。

- [ ] **Step 3: 运行版本与构建聚焦测试**

Run:

```sh
node --test tools/tests/worker-planner-v2.test.mjs tools/tests/build-dist.test.mjs
```

Expected: PASS；构建仍收集完整 Planner 资产，不包含地域研究和覆盖审计产物。

- [ ] **Step 4: 提交**

```sh
git add CLAUDE.md 部署说明.md tools/tests/worker-planner-v2.test.mjs
git commit -m "docs: align Fujian Taiwan planner baseline"
```

---

### Task 6: 全量验证、差异审计和 Draft PR 更新

**Files:**

- Verify only: entire repository

**Interfaces:**

- Consumes: Tasks 1–5 的所有提交。
- Produces: 可复现的全量通过证据和保持 Draft 的 PR #1；不产生部署。

- [ ] **Step 1: 跑全量 Node 测试**

Run:

```sh
node --test --test-reporter=dot tools/tests/*.test.mjs
```

Expected: exit 0，0 failures。必须记录最终退出码，不能只看点阵输出。

- [ ] **Step 2: 跑所有硬门禁**

Run:

```sh
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
python3 -m py_compile ai_proxy.py
node tools/build-planner-menu-coverage.mjs --check
node tools/build-menu-master.mjs --check
```

Expected:

- 菜谱门禁通过；
- `84/84 planner v2 journeys passed`；
- Python exit 0；
- 两份生成产物新鲜。

- [ ] **Step 3: 做干净构建验证**

Run（目录名只允许位于已 gitignore 的 `dist/` 内）：

```sh
TMP_DIR="dist/fujian-taiwan-m1-check-$$"
node tools/build-dist.mjs --out-dir "$TMP_DIR" --build-id "fujian-taiwan-m1-check"
node --test tools/tests/build-dist.test.mjs
```

Expected: canonical build exit 0；build tests 全部通过；`dist/` 不进入 git status。

- [ ] **Step 4: 审查边界与工作树**

Run:

```sh
git diff --check
git status --short
node -e "const x=require('./tools/data/recipe-library.json');const a=x.recipes||x;const c=a.reduce((m,r)=>(m[r.status]=(m[r.status]||0)+1,m),{});console.log(JSON.stringify({total:a.length,status:c}))"
node -e "const x=require('./tools/data/meal-templates.v2.json');console.log(JSON.stringify({total:x.templates.length,active:x.templates.filter(t=>t.activation_status==='active'&&t.runtime_eligible).length,planned:x.templates.filter(t=>t.activation_status==='planned').length}))"
```

Expected:

```json
{"total":72,"status":{"approved":12,"auto_approved":60}}
{"total":16,"active":10,"planned":6}
```

`git status --short` 必须为空；不得出现 recipe diff、`dist/`、`.env`、密钥或部署产物。

- [ ] **Step 5: 推送并核对 Draft PR**

Run:

```sh
git push origin codex/targeted-recipe-expansion
gh pr view 1 --json number,state,isDraft,headRefName,headRefOid,url
```

Expected: remote head 等于本地 HEAD；PR #1 为 `OPEN`、`isDraft:true`、head 为 `codex/targeted-recipe-expansion`。若 HTTPS/2 传输失败，可用 `git -c http.version=HTTP/1.1 push` 重试；禁止 force push。

- [ ] **Step 6: 明确未执行项**

交付记录必须写明：

- 未部署 Preview；
- 未部署 production；
- 未合并 PR；
- 未调用真实 DeepSeek live；
- 未新增或人工批准 recipe；
- 普通扁豆、糯米、荷叶和色源缺口仍存在。

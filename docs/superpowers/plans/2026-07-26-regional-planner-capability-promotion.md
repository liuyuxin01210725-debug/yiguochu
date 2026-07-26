# Regional Planner Capability Promotion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把已完成的中国地域技法框架转化为可审计的 Planner 能力：激活通用焖面、强化生米菜饭，并建立不参与运行的东北主食同炖模板草案，同时保持 72 道 recipe 不变。

**Architecture:** 地域 atlas 只定义研究范围，`regional-menu-mappings.v1.json` 新增 technique family 到 template 的能力晋升账本；运行时仍只读取 taxonomy、template catalog 和 Ratio DSL。焖面 Ratio DSL、模板约束和 Planner allowlist 必须同时晋升，江南菜饭只强化已有通用模板，东北结构只进入 planned catalog；DeepSeek 继续只表达已锁定 plan。

**Tech Stack:** Cloudflare Pages Functions ES modules、原生 JavaScript、JSON 机器资产、Node.js 内置测试运行器、Python 3 本地代理 bridge、Cloudflare Pages 静态构建。

## Global Constraints

- [ ] 以 [`docs/superpowers/specs/2026-07-26-regional-planner-capability-promotion-design.md`](../specs/2026-07-26-regional-planner-capability-promotion-design.md) 为产品契约。
- [ ] `tools/data/recipe-library.json` 必须保持 72 道：12 `approved` + 60 `auto_approved`；不新增、删除或修改 recipe。
- [ ] 最终 template catalog 必须是 16 个：9 `active` + 7 `planned`；`stew-with-staple-pot` 必须保持 `planned/runtime_eligible:false`。
- [ ] 最终版本固定为 `taxonomy-v1-20260726-r1`、`templates-v2-20260726-r1`、`ratio-rules-v1-20260726-r1`。
- [ ] `braised-noodle-pot` 不支持 `quick`；任何 `quick` 候选的 `time_range.max_minutes` 必须不超过 30。
- [ ] `/plan-meal` 保持 0 次 DeepSeek 调用；`/generate-plan` 每次最多 1 次且不自动重试。
- [ ] 地域研究资产与 capability ledger 不得进入 `dist/`。
- [ ] 每项行为修改先写失败测试、确认红灯，再写最小实现、确认绿灯。
- [ ] 不增加账号、用户画像、营养追踪、云端用户数据、多 Agent 或自然语言自由组合。
- [ ] 只更新 Draft PR #1；不部署 Preview 或 production，不合并 PR。

## File Responsibility Map

- `tools/data/regional-menu-mappings.v1.json`：地域事实及 technique family → template 晋升状态账本。
- `tools/lib/regional-menu-mapping-validator.mjs`：capability mapping schema、状态转换和跨资产引用校验。
- `tools/data/ingredient-taxonomy.v1.json`：咸肉、腊肠及锅边主食形态的受控烹饪语义。
- `tools/data/meal-templates.v2.json`：最终 9 active + 7 planned 通用 template catalog。
- `tools/data/ratio-rules.v1.json`：焖面和菜饭可执行克数、液体与出水修正规则。
- `worker/src/planner-v2.js`：唯一运行时 template allowlist、确定性装槽、排序和 plan 状态。
- `worker/src/meal-template-validator.js`：template ID、版本、action、安全终点及 active/planned 门禁。
- `worker/src/ratio-dsl.js`：Ratio DSL 版本、active rule 闭包与执行语义。
- `worker/src/generated-plan-contract.js`：新 active cooking action 和安全终点的有限表达词表。
- `tools/data/pantry-planner-v2-journeys.json`：新增地域能力的真实公共边界旅程。
- `tools/run-pantry-planner-v2-journeys.mjs`：逐项验证模板命中、覆盖和未规划原因。
- `tools/planner-v2-local-bridge.mjs` / `ai_proxy.py`：继续复用 Worker 实现；本轮只通过 parity 测试证明无漂移。

---

### Task 1: 建立 technique family → template 能力晋升账本

**Files:**

- Modify: `tools/data/regional-menu-mappings.v1.json`
- Modify: `tools/lib/regional-menu-mapping-validator.mjs`
- Modify: `tools/tests/regional-menu-mappings.test.mjs`
- Modify: `tools/build-regional-atlas.mjs`
- Modify: `tools/check-recipes.mjs`
- Modify: `tools/tests/regional-atlas-artifacts.test.mjs`

**Interfaces:**

- Consumes: `regional-atlas.v2.json`, recipe IDs, research candidate IDs, template IDs, taxonomy canonical IDs and Ratio DSL rule IDs。
- Produces: `validateRegionalMenuMappings({ mappings, atlas, recipeLibrary, regionalResearch, templates, taxonomy, ratios }): string[]`，以及结构化 `template_capability_mappings`。

- [ ] **Step 1: 写 capability schema 失败测试**

在 `tools/tests/regional-menu-mappings.test.mjs` 读取三份 Planner 资产，并把它们传入现有 `validate()`：

```js
const templates = read('meal-templates.v2.json');
const taxonomy = read('ingredient-taxonomy.v1.json');
const ratios = read('ratio-rules.v1.json');
const validate = value => validateRegionalMenuMappings({
  mappings:value, atlas, recipeLibrary, regionalResearch,
  templates, taxonomy, ratios,
});

test('capability ledger records one covered, one ratio-blocked, and one taxonomy-blocked technique', () => {
  const byFamily = new Map(mappings.template_capability_mappings.map(row => [row.family_id, row]));
  assert.equal(byFamily.get('raw-rice-braise').promotion_status, 'covered_by_active_template');
  assert.equal(byFamily.get('noodle-braise').promotion_status, 'blocked_by_ratio');
  assert.deepEqual(byFamily.get('noodle-braise').resolved_ratio_rule_ids, []);
  assert.equal(byFamily.get('stew-with-staple').promotion_status, 'blocked_by_taxonomy');
  assert.deepEqual(validate(mappings), []);
});

test('preview candidates fail closed on stale runtime references or unresolved blockers', () => {
  const broken = structuredClone(mappings);
  const row = broken.template_capability_mappings.find(item => item.family_id === 'noodle-braise');
  row.promotion_status = 'preview_candidate';
  row.blocker_codes = [];
  row.resolved_ratio_rule_ids = [...row.required_ratio_rule_ids];
  const message = validate(broken).join('\n');
  assert.match(message, /unknown resolved ratio rule/);
});
```

- [ ] **Step 2: 运行聚焦测试并确认红灯**

Run: `node --test tools/tests/regional-menu-mappings.test.mjs`

Expected: FAIL，指出 `template_capability_mappings` 不存在或根字段不允许。

- [ ] **Step 3: 扩展 validator 的有限 schema**

在 `tools/lib/regional-menu-mapping-validator.mjs` 增加：

```js
const CAPABILITY_STATUSES = new Set([
  'research_only', 'blocked_by_evidence', 'blocked_by_taxonomy',
  'blocked_by_ratio', 'preview_candidate', 'covered_by_active_template',
]);
const CAPABILITY_FIELDS = new Set([
  'family_id', 'template_id', 'region_ids', 'promotion_status',
  'evidence_recipe_ids', 'required_ratio_rule_ids', 'resolved_ratio_rule_ids',
  'taxonomy_item_ids', 'blocker_codes',
]);
```

`validateCapabilityRows()` 必须执行：

```js
if (!CAPABILITY_STATUSES.has(row.promotion_status)) errors.push(`${label}: promotion_status is invalid`);
if (!techniqueIds.has(row.family_id)) errors.push(`${label}: unknown family_id`);
checkStringArray(row.region_ids, `${label}: region_ids`, errors, { nonEmpty:true, allowed:regionIds });
checkStringArray(row.evidence_recipe_ids, `${label}: evidence_recipe_ids`, errors, { nonEmpty:true, allowed:recipeIds });
checkStringArray(row.required_ratio_rule_ids, `${label}: required_ratio_rule_ids`, errors);
checkStringArray(row.resolved_ratio_rule_ids, `${label}: resolved_ratio_rule_ids`, errors, { allowed:ratioIds });
checkStringArray(row.taxonomy_item_ids, `${label}: taxonomy_item_ids`, errors, { allowed:taxonomyIds });
checkStringArray(row.blocker_codes, `${label}: blocker_codes`, errors);
```

状态不变量：

```js
const ready = row.promotion_status === 'preview_candidate'
  || row.promotion_status === 'covered_by_active_template';
if (ready && row.blocker_codes.length) errors.push(`${label}: ready capability cannot retain blockers`);
if (ready && !exactIds(row.required_ratio_rule_ids, row.resolved_ratio_rule_ids)) {
  errors.push(`${label}: ready capability must resolve every required ratio rule`);
}
if (row.promotion_status.startsWith('blocked_') && row.blocker_codes.length === 0) {
  errors.push(`${label}: blocked capability requires blocker_codes`);
}
if (ready && (!template || template.activation_status !== 'active' || !template.runtime_eligible)) {
  errors.push(`${label}: ready capability requires an active runtime template`);
}
```

`blocked_by_taxonomy` 可以指向尚未存在的目标 template；其他 ready 状态必须引用现存 template。根字段 allowlist 加入 `template_capability_mappings`，并要求三个 `family_id` 唯一。

- [ ] **Step 4: 写入当前真实基线的三条 mapping**

在 `tools/data/regional-menu-mappings.v1.json` 增加：

```json
"template_capability_mappings": [
  {
    "family_id":"raw-rice-braise",
    "template_id":"savory-mixed-rice-pot",
    "region_ids":["jiangnan","fujian_taiwan"],
    "promotion_status":"covered_by_active_template",
    "evidence_recipe_ids":["shanghai-salted-pork-vegetable-rice","taiwan-cabbage-mushroom-rice"],
    "required_ratio_rule_ids":["savory-mixed-rice-liquid-v1"],
    "resolved_ratio_rule_ids":["savory-mixed-rice-liquid-v1"],
    "taxonomy_item_ids":["raw-rice","leafy-greens","napa-cabbage","shiitake"],
    "blocker_codes":[]
  },
  {
    "family_id":"noodle-braise",
    "template_id":"braised-noodle-pot",
    "region_ids":["jingjinji","jinmeng","shandong","central_plains"],
    "promotion_status":"blocked_by_ratio",
    "evidence_recipe_ids":["north-china-green-bean-braised-noodles","cabbage-potato-chicken-leg-braised-noodles"],
    "required_ratio_rule_ids":["braised-noodle-liquid-v1"],
    "resolved_ratio_rule_ids":[],
    "taxonomy_item_ids":["noodle","green-beans","potato","napa-cabbage","chicken-generic","pork-generic","firm-tofu","shiitake"],
    "blocker_codes":["ratio_rule_missing:braised-noodle-liquid-v1"]
  },
  {
    "family_id":"stew-with-staple",
    "template_id":"stew-with-staple-pot",
    "region_ids":["northeast"],
    "promotion_status":"blocked_by_taxonomy",
    "evidence_recipe_ids":["green-bean-pork-rib-braised-rice","cabbage-potato-chicken-leg-braised-noodles"],
    "required_ratio_rule_ids":["stew-with-staple-liquid-v1"],
    "resolved_ratio_rule_ids":[],
    "taxonomy_item_ids":["green-beans","potato","chicken-generic","pork-ribs"],
    "blocker_codes":["taxonomy_missing:cornmeal-dough","taxonomy_missing:wheat-dough","ratio_rule_missing:stew-with-staple-liquid-v1"]
  }
]
```

- [ ] **Step 5: 把完整验证上下文接入两个门禁入口**

`tools/build-regional-atlas.mjs` 的固定输入增加 `templates`、`taxonomy`、`ratios`；`tools/check-recipes.mjs` 调用 `validateRegionalMenuMappings()` 时传入已读取的同名变量。`tools/tests/regional-atlas-artifacts.test.mjs` 的临时构建 `DATA_FILES` 同步加入三份 Planner JSON。

- [ ] **Step 6: 运行聚焦测试与 atlas 检查**

Run:

```sh
node --test tools/tests/regional-menu-mappings.test.mjs tools/tests/regional-atlas-artifacts.test.mjs
node tools/build-regional-atlas.mjs --check
node tools/check-recipes.mjs
```

Expected: 全部 PASS；输出仍为 72 production audits、24 research audits；研究映射不进入 `dist/`。

- [ ] **Step 7: 提交**

```sh
git add tools/data/regional-menu-mappings.v1.json tools/lib/regional-menu-mapping-validator.mjs tools/tests/regional-menu-mappings.test.mjs tools/build-regional-atlas.mjs tools/check-recipes.mjs tools/tests/regional-atlas-artifacts.test.mjs
git commit -m "Add regional template capability ledger"
```

### Task 2: 扩充受控食材语义但不激活新能力

**Files:**

- Modify: `tools/data/ingredient-taxonomy.v1.json`
- Modify: `worker/src/ingredient-taxonomy-validator.js`
- Modify: `worker/src/meal-template-validator.js`
- Modify: `tools/data/meal-templates.v2.json`
- Modify: `tools/tests/ingredient-taxonomy.test.mjs`
- Modify: `tools/tests/meal-template-catalog.test.mjs`
- Modify: `tools/tests/worker-planner-v2.test.mjs`

**Interfaces:**

- Consumes: `normalizePlannerItems(rawItems, taxonomy)`。
- Produces: `咸肉`、`腊肠`、`玉米面团`、`小麦面团` 四个稳定 identity；taxonomy version 为 `taxonomy-v1-20260726-r1`。

- [ ] **Step 1: 写 taxonomy 失败测试**

在 `tools/tests/ingredient-taxonomy.test.mjs` 更新版本断言并增加：

```js
test('regional ingredients preserve cured-meat and dough shapes', () => {
  const [salted, sausage, cornDough, wheatDough] = normalizePlannerItems(
    ['咸肉','腊肠','玉米面团','小麦面团'], catalog,
  );
  assert.deepEqual(
    [salted.category, salted.shape_or_cut, salted.cooking_risk],
    ['pork','cured_slice','raw_pork'],
  );
  assert.deepEqual(
    [sausage.category, sausage.shape_or_cut, sausage.cooking_risk],
    ['pork','sausage','raw_pork'],
  );
  assert.deepEqual(
    [cornDough.category, cornDough.shape_or_cut, cornDough.cooking_risk],
    ['cornmeal_dough','dough_piece','raw_dough'],
  );
  assert.deepEqual(
    [wheatDough.category, wheatDough.shape_or_cut, wheatDough.cooking_risk],
    ['wheat_dough','dough_piece','raw_dough'],
  );
});
```

- [ ] **Step 2: 运行并确认红灯**

Run: `node --test tools/tests/ingredient-taxonomy.test.mjs`

Expected: FAIL，指出版本仍旧或四个 identity 未识别。

- [ ] **Step 3: 扩展有限枚举并写四个 machine rows**

在 `worker/src/ingredient-taxonomy-validator.js` 的现有 `new Set([...])` 字面量中逐项加入下表，不引入新的可变枚举或伪代码：

| 现有有限枚举 | 精确新增值 |
|---|---|
| `CATEGORIES` | `cornmeal_dough`, `wheat_dough` |
| `STATES` | `cured`, `prepared` |
| `SHAPES` | `cured_slice`, `sausage`, `dough_piece` |
| `TEXTURE_BEHAVIORS` | `renders_fat_when_heated`, `steams_above_stew` |
| `RISK_CODES` | `raw_dough` |
| `FAILURE_MODE_CODES` | `salty_when_overseasoned`, `dense_when_understeamed` |
| `ENDPOINT_CODES` | `dough_cooked_through` |
| `SLOT_CODES` | `cured_pork`, `edge_steamed_staple` |

在 taxonomy JSON 加入以下四条完整语义记录：

```json
{"canonical_id":"cured-pork","display_name":"咸肉","aliases":["上海咸肉"],"category":"pork","states":["cured"],"shapes_or_cuts":["cured_slice"],"cook_speed":"medium","moisture_release":"low","texture_behavior":{"behavior_code":"renders_fat_when_heated","best_method_codes":["braise","steam"],"failure_mode_codes":["salty_when_overseasoned"]},"cooking_risk":{"risk_code":"raw_pork","required_endpoint_codes":["pork_fully_cooked"]},"compatible_slot_codes":["protein","cured_pork"],"incompatible_slot_codes":["quick_cook_protein"]}
{"canonical_id":"chinese-sausage","display_name":"腊肠","aliases":["广式腊肠"],"category":"pork","states":["cured"],"shapes_or_cuts":["sausage"],"cook_speed":"medium","moisture_release":"low","texture_behavior":{"behavior_code":"renders_fat_when_heated","best_method_codes":["braise","steam"],"failure_mode_codes":["salty_when_overseasoned"]},"cooking_risk":{"risk_code":"raw_pork","required_endpoint_codes":["pork_fully_cooked"]},"compatible_slot_codes":["protein","cured_pork"],"incompatible_slot_codes":["quick_cook_protein"]}
{"canonical_id":"cornmeal-dough","display_name":"玉米面团","aliases":["和好的玉米面"],"category":"cornmeal_dough","states":["prepared"],"shapes_or_cuts":["dough_piece"],"cook_speed":"slow","moisture_release":"low","texture_behavior":{"behavior_code":"steams_above_stew","best_method_codes":["steam"],"failure_mode_codes":["dense_when_understeamed"]},"cooking_risk":{"risk_code":"raw_dough","required_endpoint_codes":["dough_cooked_through"]},"compatible_slot_codes":["staple","edge_steamed_staple"],"incompatible_slot_codes":["liquid"]}
{"canonical_id":"wheat-dough","display_name":"小麦面团","aliases":["和好的面团"],"category":"wheat_dough","states":["prepared"],"shapes_or_cuts":["dough_piece"],"cook_speed":"slow","moisture_release":"low","texture_behavior":{"behavior_code":"steams_above_stew","best_method_codes":["steam"],"failure_mode_codes":["dense_when_understeamed"]},"cooking_risk":{"risk_code":"raw_dough","required_endpoint_codes":["dough_cooked_through"]},"compatible_slot_codes":["staple","edge_steamed_staple"],"incompatible_slot_codes":["liquid"]}
```

版本同时改为 `taxonomy-v1-20260726-r1`，并同步 `meal-templates.v2.json.ingredient_taxonomy_version`、`worker/src/meal-template-validator.js` 的 `TAXONOMY_VERSION` 及三组版本测试。

- [ ] **Step 4: 运行 taxonomy、template 与 health 测试**

Run:

```sh
node --test tools/tests/ingredient-taxonomy.test.mjs tools/tests/meal-template-catalog.test.mjs tools/tests/worker-planner-v2.test.mjs
node tools/check-recipes.mjs
```

Expected: 全部 PASS；template 仍为 8 active + 7 planned，焖面仍未参与 Planner。

- [ ] **Step 5: 提交**

```sh
git add tools/data/ingredient-taxonomy.v1.json worker/src/ingredient-taxonomy-validator.js worker/src/meal-template-validator.js tools/data/meal-templates.v2.json tools/tests/ingredient-taxonomy.test.mjs tools/tests/meal-template-catalog.test.mjs tools/tests/worker-planner-v2.test.mjs
git commit -m "Add controlled regional ingredient semantics"
```

### Task 3: 用一个原子 TDD 变更晋升焖面、强化菜饭并登记东北 planned template

**Files:**

- Modify: `tools/data/meal-templates.v2.json`
- Modify: `tools/data/ratio-rules.v1.json`
- Modify: `tools/data/regional-menu-mappings.v1.json`
- Modify: `worker/src/meal-template-validator.js`
- Modify: `worker/src/ratio-dsl.js`
- Modify: `worker/src/planner-v2.js`
- Modify: `worker/src/generated-plan-contract.js`
- Modify: `tools/tests/meal-template-catalog.test.mjs`
- Modify: `tools/tests/ratio-dsl.test.mjs`
- Modify: `tools/tests/pantry-planner-v2-selection.test.mjs`
- Modify: `tools/tests/pantry-planner-v2-multipot.test.mjs`
- Modify: `tools/tests/worker-generate-plan.test.mjs`
- Modify: `tools/tests/worker-planner-v2.test.mjs`
- Modify: `tools/tests/recipe-library.test.mjs`

**Interfaces:**

- Consumes: `assignItemsToTemplate()`, `buildPotCandidates()`, `planMeal()` 和现有五种 Ratio DSL operator。
- Produces: 16-template catalog、9-template runtime allowlist、`braised-noodle-liquid-v1`、菜饭出水修正和可生成的焖面 locked plan。

- [ ] **Step 1: 先写 catalog、Ratio 和 Planner 红灯测试**

`tools/tests/meal-template-catalog.test.mjs` 把集合改成：

```js
const ACTIVE = new Set([
  'acid-staple-pot','savory-mixed-rice-pot','cooked-rice-stir-pot','broth-noodle-pot',
  'egg-tofu-vegetable-pot','mushroom-vegetable-stew-pot','beef-staple-pot',
  'poultry-staple-pot','braised-noodle-pot',
]);
const PLANNED = new Set([
  'mushroom-aroma-rice-pot','broth-rice-pot','curry-staple-pot','pork-staple-pot',
  'soft-family-rice-pot','quick-breakfast-pot','stew-with-staple-pot',
]);
assert.equal(catalog.templates.length, 16);
assert.equal(catalog.template_catalog_version, 'templates-v2-20260726-r1');
```

`tools/tests/ratio-dsl.test.mjs` 增加：

```js
test('braised noodle rule uses measured 1.8x liquid and credits high-moisture vegetables', () => {
  const result = compileRatioPlan('braised-noodle-liquid-v1', {
    servings:2,
    slots:{
      staple:[item('面条','noodle')],
      vegetable:[item('白菜','leafy_vegetable',{ moisture_release:'high' })],
      protein:[item('鸡腿肉','chicken')],
    },
  }, catalog);
  assert.equal(result.ok, true);
  assert.deepEqual(result.ingredient_amounts, [
    { name:'水', grams:330 }, { name:'白菜', grams:180 },
    { name:'面条', grams:200 }, { name:'鸡腿肉', grams:160 },
  ].sort((a,b) => a.name.localeCompare(b.name,'zh-Hans-CN')));
  assert.equal(result.liquid_constraints.liquid_credit_grams, 30);
});

test('savory rice reduces measured water for one high-moisture vegetable', () => {
  const result = compileRatioPlan('savory-mixed-rice-liquid-v1', {
    servings:2,
    slots:{ staple:[item('大米','raw_rice')], fast_vegetable:[item('白菜','leafy_vegetable',{ moisture_release:'high' })] },
  }, catalog);
  assert.equal(result.ok, true);
  assert.ok(result.required_extra_items.some(item => item.name === '水' && item.grams === 240));
});
```

`tools/tests/pantry-planner-v2-selection.test.mjs` 增加 table-driven 断言：

```js
test('braised noodle covers reliable household combinations without forcing slow cuts', () => {
  for (const pantry of [
    ['面条','豆角','猪肉'],
    ['面条','土豆','豆角'],
    ['面条','白菜','鸡腿'],
    ['面条','香菇','青菜','老豆腐'],
    ['面条','鸡腿','土豆','白菜'],
  ]) {
    const result = planMeal(assets, request({ must:pantry }));
    assert.equal(result.status, 'complete', pantry.join('+'));
    assert.equal(result.plan.coverage_ratio, 1, pantry.join('+'));
    assert.ok(result.plan.pots.some(pot => pot.template_id === 'braised-noodle-pot'), pantry.join('+'));
  }
  for (const raw of ['排骨','牛腩']) {
    const result = planMeal(assets, request({ must:['面条','豆角',raw] }));
    const braised = result.plan.pots.find(pot => pot.template_id === 'braised-noodle-pot');
    assert.equal(braised?.planned_must_use.some(item => item.raw === raw) || false, false, raw);
  }
});

test('quick never selects braised noodle', () => {
  const candidates = buildPotCandidates(assets, request({
    intent:'quick', must:['面条','豆角','猪肉'],
  }));
  assert.ok(candidates.every(candidate => candidate.template_id !== 'braised-noodle-pot'));
  assert.ok(candidates.every(candidate => candidate.time_range.max_minutes <= 30));
});
```

`tools/tests/worker-generate-plan.test.mjs` 在完整步骤测试中加入 `plannerRequest({ must:['面条','豆角','猪肉'] })`，并断言 locked plan 的 template 是 `braised-noodle-pot`，合法模型输出通过，步骤包含“面条无硬芯”“豆角煮熟软化”“猪肉完全熟透”。

- [ ] **Step 2: 运行测试并确认红灯原因完整**

Run:

```sh
node --test tools/tests/meal-template-catalog.test.mjs tools/tests/ratio-dsl.test.mjs tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/worker-generate-plan.test.mjs
```

Expected: FAIL，至少覆盖旧版本、模板数量、缺失 Ratio rule、焖面未在 Planner allowlist、菜饭旧 slot 和生成安全短语缺失。

- [ ] **Step 3: 更新有限 allowlist、版本和 active 闭包**

同步执行：

```js
// worker/src/planner-v2.js
ACTIVE_TEMPLATE_IDS.add('braised-noodle-pot');

// worker/src/meal-template-validator.js
EXPECTED_TEMPLATE_IDS.add('stew-with-staple-pot');
ACTIVE_TEMPLATE_IDS.add('braised-noodle-pot');

// worker/src/ratio-dsl.js
ACTIVE.add('braised-noodle-pot');
```

实际代码仍修改现有 Set 字面量。版本改为：

```text
template_catalog_version = templates-v2-20260726-r1
ratio_catalog_version = ratio-rules-v1-20260726-r1
```

模板 validator 的固定数量改为 16，测试和 `/health` 断言改为 9 active + 7 planned。

- [ ] **Step 4: 完整替换焖面 template 的执行边界**

`braised-noodle-pot` 保持通用结构，关键字段必须是：

```json
{
  "activation_status":"active",
  "runtime_eligible":true,
  "required_slots":[
    {"slot_id":"staple","min_items":1,"max_items":1,"source_policy":["user","basic_extra"],"accepts_categories":["noodle"]},
    {"slot_id":"vegetable","min_items":1,"max_items":2,"source_policy":["user"],"accepts_categories":["leafy_vegetable","pod_vegetable","root_vegetable"]}
  ],
  "optional_slots":[
    {"slot_id":"protein","min_items":0,"max_items":1,"source_policy":["user"],"accepts_categories":["chicken","pork","firm_tofu"]},
    {"slot_id":"mushroom","min_items":0,"max_items":1,"source_policy":["user"],"accepts_categories":["mushroom"]}
  ],
  "shape_or_cut_requirements":[
    {"slot_id":"protein","category":"pork","allowed_shapes":["slice","dice","tenderloin"],"forbidden_shapes":["rib","ground"]},
    {"slot_id":"protein","category":"chicken","allowed_shapes":["breast","leg"],"forbidden_shapes":[]}
  ],
  "cooking_order":[
    {"phase":1,"action_code":"protein_pretreat","slot_ids":["protein"]},
    {"phase":2,"action_code":"simmer_until_tender","slot_ids":["protein","vegetable","mushroom"]},
    {"phase":3,"action_code":"add_staple_and_liquid","slot_ids":["staple"]},
    {"phase":4,"action_code":"reach_safety_endpoints","slot_ids":["staple","protein","vegetable"]}
  ],
  "safety_endpoints":[
    {"applies_to_category":"chicken","endpoint_code":"poultry_fully_cooked_no_pink"},
    {"applies_to_category":"pork","endpoint_code":"pork_fully_cooked"},
    {"applies_to_category":"firm_tofu","endpoint_code":"heated_through"},
    {"applies_to_category":"pod_vegetable","endpoint_code":"bean_fully_cooked"},
    {"applies_to_category":"noodle","endpoint_code":"noodle_tender"}
  ],
  "time_range":{"min_minutes":25,"max_minutes":40},
  "supported_intents":["normal","fresh","batch"]
}
```

- [ ] **Step 5: 新增可执行焖面 Ratio DSL**

在 `ratio-rules.v1.json.rules` 增加：

```json
{
  "rule_id":"braised-noodle-liquid-v1",
  "evidence_recipe_ids":["north-china-green-bean-braised-noodles","cabbage-potato-chicken-leg-braised-noodles"],
  "when":{"template_id":"braised-noodle-pot","slot_id":"staple","category":"noodle"},
  "operations":[
    {"operator":"per_serving","target":{"slot_id":"staple"},"grams":{"min":80,"default":100,"max":120}},
    {"operator":"per_serving","target":{"slot_id":"vegetable"},"grams":{"min":70,"default":90,"max":120}},
    {"operator":"per_serving","target":{"slot_id":"protein"},"grams":{"min":60,"default":80,"max":100}},
    {"operator":"per_serving","target":{"slot_id":"mushroom"},"grams":{"min":60,"default":80,"max":100}},
    {"operator":"bounded_sum","target":{"attribute":"moisture_release","value":"high"},"grams_per_serving":{"min":70,"default":90,"max":120},"liquid_credit_grams_per_serving":{"min":10,"default":15,"max":20}},
    {"operator":"ratio","target":{"name":"水","category":"liquid"},"numerator":{"resource":"retained_liquid_grams"},"denominator":{"slot_id":"staple","measure":"grams"},"min":1.6,"default":1.8,"max":2.0}
  ],
  "rounding":{"grams_to_nearest":5},
  "example_context":{"slot_name":"面条"}
}
```

- [ ] **Step 6: 强化生米菜饭的槽位顺序和出水比例**

把 `savory-mixed-rice-pot` 的 `vegetable` 拆成：

```json
{"slot_id":"slow_vegetable","min_items":0,"max_items":1,"source_policy":["user"],"accepts_categories":["pod_vegetable","root_vegetable"]}
{"slot_id":"fast_vegetable","min_items":0,"max_items":1,"source_policy":["user"],"accepts_categories":["leafy_vegetable","cruciferous_vegetable"]}
```

`protein` slot 的 `accepts_categories` 精确改为 `egg/firm_tofu/beef/chicken`，并新增 `accepts_slot_codes:["generic_pork","cured_pork"]`；`ingredient_categories.protein` 继续列出 `egg/firm_tofu/beef/chicken/pork`。猪肉 shape 只允许 `slice/dice/tenderloin/cured_slice/sausage`，继续禁止 `rib/ground`。`evidence_recipe_ids` 精确改为 `simple-chicken-biryani`、`taiwan-cabbage-mushroom-rice`、`shanghai-salted-pork-vegetable-rice`、`nanjing-sausage-greens-rice`。

烹饪顺序固定为：`cook_aromatics → protein_pretreat → add_slow_cooking_items → add_staple_and_liquid → add_fast_cooking_items → reach_safety_endpoints`。在 template validator 和 `generated-plan-contract.js` 的有限 action 词表加入：

```js
add_slow_cooking_items: [
  '加入{items}，同锅翻拌后先加热至开始变软',
  '将{items}放入锅中翻动，使其先均匀受热',
],
```

菜饭 Ratio DSL 删除原 `target.slot_id:"vegetable"` 的 `per_serving` operation，替换为以下两条；其余 `staple/protein/mushroom/aromatic` operation 保持原值：

```json
{"operator":"per_serving","target":{"slot_id":"slow_vegetable"},"grams":{"min":100,"default":120,"max":140}}
{"operator":"per_serving","target":{"slot_id":"fast_vegetable"},"grams":{"min":100,"default":120,"max":140}}
```

同时把 `ingredient_categories.vegetable` 拆为与两个 slot 一致的 `slow_vegetable` 和 `fast_vegetable` 两个键，并在 `ratio` 前增加：

```json
{"operator":"bounded_sum","target":{"attribute":"moisture_release","value":"high"},"grams_per_serving":{"min":80,"default":100,"max":120},"liquid_credit_grams_per_serving":{"min":10,"default":15,"max":20}}
```

液体 ratio 改为 `min:1.2/default:1.35/max:1.45`，使两人份 200g 生米在一个高出水食材时默认得到 240g 水，而不是在旧 1.2 比例上继续机械扣水。

- [ ] **Step 7: 增加东北 planned template，但不增加 Ratio rule**

catalog 新增下列完整、机器可验证的 `stew-with-staple-pot` 对象：

```json
{
  "template_id":"stew-with-staple-pot",
  "activation_status":"planned",
  "runtime_eligible":false,
  "required_slots":[
    {"slot_id":"protein","min_items":1,"max_items":1,"source_policy":["user"],"accepts_categories":["chicken","pork"]},
    {"slot_id":"vegetable","min_items":1,"max_items":2,"source_policy":["user"],"accepts_categories":["pod_vegetable","root_vegetable"]},
    {"slot_id":"staple","min_items":1,"max_items":1,"source_policy":["user"],"accepts_categories":["cornmeal_dough","wheat_dough"]},
    {"slot_id":"liquid","min_items":1,"max_items":1,"source_policy":["basic_extra"],"accepts_categories":["liquid"]}
  ],
  "optional_slots":[
    {"slot_id":"mushroom","min_items":0,"max_items":1,"source_policy":["user"],"accepts_categories":["mushroom"]}
  ],
  "slot_limits":{"total_user_items_min":3,"total_user_items_max":5,"protein_max":1,"vegetable_max":2,"staple_max":1,"liquid_max":1,"mushroom_max":1},
  "ingredient_categories":{"protein":["chicken","pork"],"vegetable":["pod_vegetable","root_vegetable"],"staple":["cornmeal_dough","wheat_dough"],"liquid":["liquid"],"mushroom":["mushroom"]},
  "compatibility_rules":[
    {"rule_code":"cornmeal_staple_steams_above_stew","when":{"slot_id":"staple","category":"cornmeal_dough"},"requires_cooking_mode":["long_simmer","steam"]},
    {"rule_code":"wheat_staple_steams_above_stew","when":{"slot_id":"staple","category":"wheat_dough"},"requires_cooking_mode":["long_simmer","steam"]}
  ],
  "incompatible_rules":[
    {"rule_code":"stew_with_staple_limits_slow_items","when":{"slot_id":"staple","category":"cornmeal_dough"},"forbids_attribute_count":{"attribute":"cook_speed","value":"slow","greater_than":2}},
    {"rule_code":"stew_with_staple_limits_slow_items_for_wheat","when":{"slot_id":"staple","category":"wheat_dough"},"forbids_attribute_count":{"attribute":"cook_speed","value":"slow","greater_than":2}}
  ],
  "shape_or_cut_requirements":[
    {"slot_id":"protein","category":"pork","allowed_shapes":["slice","dice","tenderloin","rib","cured_slice","sausage"],"forbidden_shapes":["ground"]},
    {"slot_id":"protein","category":"chicken","allowed_shapes":["breast","leg"],"forbidden_shapes":[]}
  ],
  "cooking_order":[
    {"phase":1,"action_code":"protein_pretreat","slot_ids":["protein"]},
    {"phase":2,"action_code":"simmer_until_tender","slot_ids":["protein","vegetable","mushroom"]},
    {"phase":3,"action_code":"add_liquid","slot_ids":["liquid"]},
    {"phase":4,"action_code":"position_staple_above_liquid","slot_ids":["staple"]},
    {"phase":5,"action_code":"steam_staple_with_lid","slot_ids":["staple"]},
    {"phase":6,"action_code":"reach_safety_endpoints","slot_ids":["protein","vegetable","staple"]}
  ],
  "ratio_constraints":["stew-with-staple-liquid-v1"],
  "liquid_constraints":{"allowed_categories":["water","approved_stock"],"max_liquid_types":1,"must_be_measured":true,"retained_in_finished_meal":true},
  "safety_endpoints":[
    {"applies_to_category":"pork","endpoint_code":"pork_fully_cooked"},
    {"applies_to_category":"chicken","endpoint_code":"poultry_fully_cooked_no_pink"},
    {"applies_to_category":"pod_vegetable","endpoint_code":"bean_fully_cooked"},
    {"applies_to_category":"cornmeal_dough","endpoint_code":"dough_cooked_through"},
    {"applies_to_category":"wheat_dough","endpoint_code":"dough_cooked_through"}
  ],
  "time_range":{"min_minutes":45,"max_minutes":90},
  "supported_intents":["normal","batch"],
  "evidence_recipe_ids":["green-bean-pork-rib-braised-rice","cabbage-potato-chicken-leg-braised-noodles"]
}
```

在 template validator 中精确加入 action codes `position_staple_above_liquid`、`steam_staple_with_lid`；加入 `TEMPLATE_ENDPOINT_TO_TAXONOMY_ENDPOINT.dough_cooked_through = 'dough_cooked_through'`，并把 `ENDPOINT_CATEGORIES.dough_cooked_through` 固定为 `cornmeal_dough` 与 `wheat_dough`。两个 action 只被 planned template 引用，因此本轮不加入 `generated-plan-contract.js` 的运行时表达词表。不要向 Ratio catalog 添加 `stew-with-staple-liquid-v1`，从而保持它无法运行。

- [ ] **Step 8: 更新 capability 状态并补生成安全词表**

能力账本转换为：

```text
noodle-braise      -> preview_candidate, resolved=[braised-noodle-liquid-v1], blockers=[]
raw-rice-braise    -> covered_by_active_template, blockers=[]
stew-with-staple   -> blocked_by_ratio, resolved=[], blocker=ratio_rule_missing:stew-with-staple-liquid-v1
```

`generated-plan-contract.js` 增加：

```js
SAFETY_EVIDENCE_RULES.heated_through = /热透/u;
SAFETY_EVIDENCE_RULES.noodle_tender = /无硬芯|熟透/u;
```

`endpointEvidencePhrase()` 对应返回 `{{ref}}完全热透` 和 `{{ref}}熟透且无硬芯`。模型仍只能从有限短语选择，不能自由编比例。

- [ ] **Step 9: 运行聚焦测试直到绿灯**

Run:

```sh
node --test tools/tests/meal-template-catalog.test.mjs tools/tests/ratio-dsl.test.mjs
node --test tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/pantry-planner-v2-multipot.test.mjs
node --test tools/tests/worker-generate-plan.test.mjs tools/tests/worker-planner-v2.test.mjs
node --test tools/tests/regional-menu-mappings.test.mjs tools/tests/recipe-library.test.mjs
node tools/check-recipes.mjs
```

Expected: 全部 PASS；聚合门禁报告 72 recipes、9 active templates、7 planned templates、taxonomy ok、ratio DSL ok。

- [ ] **Step 10: 提交**

```sh
git add tools/data/meal-templates.v2.json tools/data/ratio-rules.v1.json tools/data/regional-menu-mappings.v1.json worker/src/meal-template-validator.js worker/src/ratio-dsl.js worker/src/planner-v2.js worker/src/generated-plan-contract.js tools/tests/meal-template-catalog.test.mjs tools/tests/ratio-dsl.test.mjs tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/pantry-planner-v2-multipot.test.mjs tools/tests/worker-generate-plan.test.mjs tools/tests/worker-planner-v2.test.mjs tools/tests/recipe-library.test.mjs
git commit -m "Promote regional planner techniques"
```

### Task 4: 把 20 个地域能力场景钉在真实公共边界

**Files:**

- Modify: `tools/data/pantry-planner-v2-journeys.json`
- Modify: `tools/run-pantry-planner-v2-journeys.mjs`
- Modify: `tools/tests/pantry-planner-v2-journeys.test.mjs`

**Interfaces:**

- Consumes: `/plan-meal` 的真实 Worker 响应。
- Produces: 64 条连续编号旅程；新增 expectation keys `required_template_ids`、`excluded_template_ids`、`required_unplanned_raw`。

- [ ] **Step 1: 先扩 corpus 并让 runner 因未知 expectation 红灯**

新增 J45–J64，所有条目均为 `plan_deepseek_max:0`、`generate_deepseek_max:0`、`frontend_required:false`、`model_mutation:null`：

| ID | mode + intent | must/prefer 输入 | 关键 expect |
|---|---|---|---|
| J45 | pantry normal | 面条、豆角、猪肉 | complete；`braised-noodle-pot`；3项全覆盖 |
| J46 | pantry normal | 面条、土豆、豆角 | complete；`braised-noodle-pot` |
| J47 | pantry normal | 面条、白菜、鸡腿 | complete；`braised-noodle-pot` |
| J48 | pantry normal | 面条、香菇、青菜、老豆腐 | complete；`braised-noodle-pot`；每锅至少2项 |
| J49 | pantry normal | 面条、鸡腿、土豆、白菜 | complete；`braised-noodle-pot` |
| J50 | recommend normal | 面条、猪里脊、豆角 | ready；`braised-noodle-pot`；计划猪里脊 |
| J51 | pantry normal | 面条、排骨、豆角 | needs_user_decision；排除 `braised-noodle-pot` 中的排骨；排骨保留在 unplanned |
| J52 | pantry normal | 面条、牛腩、白菜 | needs_user_decision；排除 `braised-noodle-pot` 中的牛腩；牛腩保留在 unplanned |
| J53 | pantry normal | 面条、豆角；忌口豆角 | needs_user_decision 或 no_valid_plan；豆角为 `allergen_conflict` |
| J54 | pantry quick | 面条、豆角、猪肉 | needs_user_decision 或 no_valid_plan；排除 `braised-noodle-pot`；每锅<=30分钟 |
| J55 | recommend normal swap | prefer：面条、白菜、鸡肉；`current_plan_id:"$BASE_PLAN_ID"` | ready；plan_id改变且 prefer-use 覆盖不降低 |
| J56 | pantry normal | 面条、豆角、土豆、白菜、鸡腿、老豆腐 | complete；至少2锅；不单项凑锅且食材不跨锅重复 |
| J57 | pantry normal | 大米、青菜、香菇 | complete；`savory-mixed-rice-pot` |
| J58 | pantry normal | 大米、白菜、鸡肉 | complete；生米模板且禽肉终点存在 |
| J59 | recommend normal | 大米、青菜、猪肉、黄瓜 | ready；至少3项规划；unused有原因 |
| J60 | pantry normal | 大米、番茄、白菜、鸡蛋、金针菇 | complete；至少2锅且食材不跨锅重复 |
| J61 | pantry normal | 熟米饭、青菜、香菇 | complete；排除 `savory-mixed-rice-pot`，命中 `cooked-rice-stir-pot` |
| J62 | pantry batch | 大米、青菜、香菇、鸡肉 | complete；每锅份数4；`savory-mixed-rice-pot` |
| J63 | pantry normal | 大米、青菜、咸肉 | complete；咸肉保持 `cured_slice` |
| J64 | pantry normal | 大米、青菜、腊肠 | complete；腊肠保持 `sausage` |

例如 J45：

```json
{"id":"J45","spec_number":45,"title":"豆角猪肉焖面完整覆盖","category":"regional_capability","request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"pantry","intent":"normal","servings":2,"must_use":["面条","豆角","猪肉"],"prefer_use":[],"dislikes":[],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},"expect":{"status":["complete"],"complete_coverage":1,"submitted_must_count":3,"required_template_ids":["braised-noodle-pot"]},"plan_deepseek_max":0,"generate_deepseek_max":0,"frontend_required":false,"model_mutation":null}
```

J51/J52 使用 `required_unplanned_raw`，分别设置 `normalized:{raw:"排骨",shape_or_cut:"rib"}` / `normalized:{raw:"牛腩",shape_or_cut:"brisket"}`，并用现有 `forbidden_template_ids:["braised-noodle-pot"]` 证明该特定慢切不进入焖面；J53 使用现有 `reason_codes:["allergen_conflict"]`；J54/J61 使用 `excluded_template_ids`。J55 必须保留 `$BASE_PLAN_ID` 标记，让 runner 先生成基线再发起换一换。J56/J60 使用 `pot_count_min:2` 与 `no_duplicate_canonical_across_pots:true`；J61 使用 `required_template_ids:["cooked-rice-stir-pot"]`。运行：

`node --test tools/tests/pantry-planner-v2-journeys.test.mjs`

Expected: FAIL，指出 corpus 不再是 44 条以及 expectation key 未处理。

- [ ] **Step 2: 实现三种新 assertion，不改 Planner**

在 `HANDLED_EXPECTATION_KEYS` 加入三项，并在 `runOne()` 中实现：

```js
if (entry.expect.required_template_ids) {
  const actual = new Set(templates(body));
  for (const id of entry.expect.required_template_ids) assert.ok(actual.has(id), `${entry.id} missing template ${id}`);
}
if (entry.expect.excluded_template_ids) {
  const actual = new Set(templates(body));
  for (const id of entry.expect.excluded_template_ids) assert.equal(actual.has(id), false, `${entry.id} unexpectedly used ${id}`);
}
if (entry.expect.required_unplanned_raw) {
  const actual = new Set((body.plan?.unplanned_must_use || []).map(item => item.raw));
  for (const raw of entry.expect.required_unplanned_raw) assert.ok(actual.has(raw), `${entry.id} silently lost ${raw}`);
}
```

把 corpus 固定断言、分类计数和 CLI summary 改成 64；原有 44 条编号与语义不变。

- [ ] **Step 3: 运行旅程并修正真实 Planner 缺陷，而不是放宽 expect**

Run:

```sh
node --test tools/tests/pantry-planner-v2-journeys.test.mjs
node tools/run-pantry-planner-v2-journeys.mjs
```

Expected: `64/64 planner v2 journeys passed`。如果某项失败，只能修 template compatibility、Ratio DSL 或 Planner 的确定性行为；不得把 `complete` 改成低覆盖成功，也不得删除食材断言。

- [ ] **Step 4: 提交**

```sh
git add tools/data/pantry-planner-v2-journeys.json tools/run-pantry-planner-v2-journeys.mjs tools/tests/pantry-planner-v2-journeys.test.mjs
git commit -m "Add regional planner journey gate"
```

### Task 5: 验证 Worker、本地代理和版本失效行为一致

**Files:**

- Modify: `tools/tests/planner-v2-parity.test.mjs`
- Modify: `tools/tests/worker-planner-v2.test.mjs`
- Modify: `tools/tests/worker-generate-plan.test.mjs`

**Interfaces:**

- Consumes: Worker `/plan-meal`、`/generate-plan`，以及 `ai_proxy.py` 通过 `planner-v2-local-bridge.mjs` 暴露的同一接口。
- Produces: 新地域输入的 Worker/Python byte-semantic parity，及旧 catalog plan 的 `stale_plan` 证明。

- [ ] **Step 1: 增加真实 parity cases**

在 `planner-v2-parity.test.mjs` 的已有 Worker/Python case 表加入：

```js
[
  'braised noodle complete',
  request({ must:['面条','豆角','猪肉'] }),
  'complete',
],
[
  'cured meat mixed rice',
  request({ must:['大米','青菜','咸肉'] }),
  'complete',
],
[
  'slow cut remains unplanned',
  request({ must:['面条','白菜','排骨'] }),
  'needs_user_decision',
],
```

并断言 Worker 与 Python 响应 deep-equal，资产 digest 在测试前后不变。

- [ ] **Step 2: 增加 health 与 stale version 断言**

`worker-planner-v2.test.mjs` 断言：

```js
assert.equal(result.body.templateCatalogVersion, 'templates-v2-20260726-r1');
assert.equal(result.body.ingredientTaxonomyVersion, 'taxonomy-v1-20260726-r1');
assert.equal(result.body.activeTemplates, 9);
assert.equal(result.body.plannedTemplates, 7);
```

在生成测试中复制一个合法新 plan，把 envelope 的 `template_catalog_version` 改为 `templates-v2-20260724`，断言 HTTP 409、`status:'stale_plan'`、0 budget read/write、0 upstream call。

- [ ] **Step 3: 运行 Worker/Python/生成边界测试**

Run:

```sh
node --test tools/tests/planner-v2-parity.test.mjs
node --test tools/tests/worker-planner-v2.test.mjs tools/tests/worker-generate-plan.test.mjs
python3 -m py_compile ai_proxy.py
```

Expected: 全部 PASS；无需修改 `ai_proxy.py`，因为它通过 bridge 执行同一 Worker planner。如果 parity 失败，修共享资产或 Worker；不得在 Python 中复制第二套选模板算法。

- [ ] **Step 4: 提交**

```sh
git add tools/tests/planner-v2-parity.test.mjs tools/tests/worker-planner-v2.test.mjs tools/tests/worker-generate-plan.test.mjs
git commit -m "Verify regional planner parity"
```

### Task 6: 更新文档、完成全量门禁并保持 Draft PR

**Files:**

- Modify: `CLAUDE.md`
- Modify: `部署说明.md`
- Modify: `docs/pantry-planner-v2-preview-feedback.md`

**Interfaces:**

- Consumes: 最终版本、health 计数和全部测试结果。
- Produces: 不声称已部署的 Draft 基线说明、确定性构建证据和干净工作树。

- [ ] **Step 1: 先写部署文档一致性失败测试**

在 `tools/tests/worker-planner-v2.test.mjs` 增加文本断言：

```js
const deployment = fs.readFileSync(new URL('../../部署说明.md', import.meta.url), 'utf8');
assert.match(deployment, /templates-v2-20260726-r1/);
assert.match(deployment, /taxonomy-v1-20260726-r1/);
assert.match(deployment, /9 个 active.*7 个 planned/s);
assert.match(deployment, /未部署|不得部署/);
```

Run: `node --test tools/tests/worker-planner-v2.test.mjs`

Expected: FAIL，文档仍引用旧版本和 8 active。

- [ ] **Step 2: 更新三份说明但不写部署成功**

`CLAUDE.md` 与 `部署说明.md` 的预览 health 期望改为：

```text
pantry-planner-v2
templates-v2-20260726-r1
taxonomy-v1-20260726-r1
9 active templates
7 planned templates
72 base recipes
```

`docs/pantry-planner-v2-preview-feedback.md` 保留旧基线为历史记录，并新增“Draft 目标基线”，明确：自动测试不等于真人烹饪验证，当前未部署 Preview，所有反馈栏仍需真实用户填写。

- [ ] **Step 3: 运行全量串行 Node 测试**

Run:

```sh
node --test --test-concurrency=1 tools/tests/*.test.mjs
```

Expected: exit 0；不得用单个聚焦测试替代全量结果。

- [ ] **Step 4: 运行全部产品门禁**

Run:

```sh
node tools/check-foods.mjs
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
node tools/build-regional-atlas.mjs --check
python3 -m py_compile ai_proxy.py
```

Expected: 全部 exit 0；旅程输出 `64/64`；菜谱仍为 72；地域 atlas 仍为 13 regions / 34 provinces / 72 production audits / 24 research audits。

- [ ] **Step 5: 验证两次构建字节一致且研究资产未打包**

Run:

```sh
node tools/build-dist.mjs --out-dir dist/.regional-capability-a --build-id regional-capability-r1
node tools/build-dist.mjs --out-dir dist/.regional-capability-b --build-id regional-capability-r1
diff -qr dist/.regional-capability-a dist/.regional-capability-b
find dist/.regional-capability-a -type f | sort
```

Expected: `diff -qr` 无输出；输出包含 taxonomy/template/ratio/Worker 运行资产，不包含 `regional-atlas`、`regional-menu-mappings` 或地域研究 JSON。

- [ ] **Step 6: 完成范围审计**

Run:

```sh
node --input-type=module - <<'NODE'
import fs from 'node:fs';
const recipes = JSON.parse(fs.readFileSync('tools/data/recipe-library.json','utf8')).recipes;
const templates = JSON.parse(fs.readFileSync('tools/data/meal-templates.v2.json','utf8')).templates;
console.log(JSON.stringify({
  recipes:recipes.length,
  approved:recipes.filter(r => r.status === 'approved').length,
  auto_approved:recipes.filter(r => r.status === 'auto_approved').length,
  active:templates.filter(t => t.activation_status === 'active').length,
  planned:templates.filter(t => t.activation_status === 'planned').length,
}));
NODE
git diff --check
git status --short
```

Expected:

```json
{"recipes":72,"approved":12,"auto_approved":60,"active":9,"planned":7}
```

只允许本计划列出的源文件处于修改状态；`dist/` 必须保持 gitignored。

- [ ] **Step 7: 提交文档与最终验证修正**

```sh
git add CLAUDE.md 部署说明.md docs/pantry-planner-v2-preview-feedback.md tools/tests/worker-planner-v2.test.mjs
git commit -m "Document regional planner preview baseline"
```

- [ ] **Step 8: 推送但保持 Draft**

Run:

```sh
git push origin codex/targeted-recipe-expansion
gh pr view 1 --json isDraft,state,headRefName,headRefOid,url
```

Expected: `isDraft:true`、`state:OPEN`、head branch 为 `codex/targeted-recipe-expansion`。不得运行任何 `wrangler pages deploy`、PR merge 或 production 命令。

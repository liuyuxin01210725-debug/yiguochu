# Qinghai Tibet Soft Millet Pot Capability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不新增 recipe、不改变 Planner V2 产品契约的前提下，用一个受控小米分支激活现有 `soft-family-rice-pot`，让“小米 + 土豆 + 已熟鹰嘴豆”获得可执行、可解释、可校验的家庭单锅计划。

**Architecture:** `ingredient-taxonomy.v1.json` 继续作为食材身份唯一真源，新增小米和鹰嘴豆状态语义；`meal-templates.v2.json` 只激活已有模板并限制槽位；`ratio-rules.v1.json` 用现有六种运算符计算克数和水量。Planner 仍是确定性纯函数，DeepSeek 只从锁定生成合同中选择文字，不参与组合、计量或安全决策。现有 72 道 recipe 只作 evidence，不决定组合空间。

**Tech Stack:** JSON 机器资产、Cloudflare Pages Functions ES modules、Node.js 内置 `node:test`、Python 3 本地 bridge、单文件 PWA、确定性 JSON/Markdown 构建器。

## Global Constraints

- [ ] 以 `docs/superpowers/specs/2026-07-27-qinghai-tibet-soft-millet-pot-capability-design.md` 为唯一产品契约。
- [ ] `tools/data/recipe-library.json` 保持 72 道：12 `approved` + 60 `auto_approved`；不得新增、删除或修改 recipe。
- [ ] Template 总数保持 16；目标状态为 11 active + 5 planned；只激活现有 `soft-family-rice-pot`。
- [ ] Taxonomy 目标版本固定为 `taxonomy-v1-20260727-r9`；template catalog 为 `templates-v2-20260727-r9`；Ratio catalog 为 `ratio-rules-v1-20260727-r5`。
- [ ] 本轮 template 只接受 `raw_millet`、一个根茎蔬菜、可选一个 `cooked_legume` 和可选一个叶菜；不得继续接受普通大米、牛奶、青稞、蕨麻或面团。
- [ ] 泛称“鹰嘴豆”必须返回 `ambiguous_ingredient_state`；不得静默按干豆或熟豆处理。
- [ ] 干鹰嘴豆不得进入本轮 active template；已有有效锅时进入 `needs_user_decision`，单独输入时返回 `no_valid_plan`。
- [ ] `pantry+quick` 不得选择该模板；不放宽 30 分钟门槛。
- [ ] 所有数量、液体、步骤顺序和安全终点由 Planner 锁定；DeepSeek 最多调用一次且不能自动重试。
- [ ] 用户可见内容不得声称“传统青海熬饭”“正宗”“地道复刻”或等价含义。
- [ ] 每个行为修改先写失败测试并观察有效红灯，再写最小实现。
- [ ] 保留既有 J001–J116，新增 J117–J138，目标真实旅程为 138/138。
- [ ] 只更新现有 Draft PR #1；不部署 Preview 或 production，不合并 PR。

---

## File Responsibility Map

- `tools/data/ingredient-taxonomy.v1.json`：小米、干/熟鹰嘴豆和 `chickpea-state` 歧义的唯一机器事实。
- `worker/src/ingredient-taxonomy-validator.js`：taxonomy r9 版本与有限属性词表。
- `tools/data/meal-templates.v2.json`：`soft-family-rice-pot` 的窄槽位、顺序、安全和 evidence。
- `worker/src/meal-template-validator.js`：template r9、11/5 状态、`raw_millet` 及其安全终点的 schema 约束。
- `tools/data/ratio-rules.v1.json`：`soft-family-millet-liquid-v1` 的机器数量与液体规则。
- `worker/src/ratio-dsl.js`：Ratio r5 版本及 active template 覆盖集合。
- `worker/src/planner-v2.js`：既有确定性槽位、ratio 编译、状态、swap 和 plan identity；原则上不改算法，只在红灯证明通用接口缺口时做最小修复。
- `worker/src/generated-plan-contract.js`：锁定烹饪阶段、安全终点和允许文案；不得新增自由 prompt。
- `worker/src/worker.js`、`ai_proxy.py`：HTTP/本地 bridge 复用同一份资产和生成合同。
- `tools/tests/*.test.mjs`：taxonomy、template、Ratio、Planner、identity、生成越界、前端和 parity 的 TDD 证据。
- `tools/data/pantry-planner-v2-journeys.json`、`tools/run-pantry-planner-v2-journeys.mjs`：J117–J138 公共用户旅程。
- `tools/data/regional-menu-mappings.v1.json`、`tools/generated/planner-menu-coverage.v1.json`、`docs/planner-menu-coverage.md`：青藏覆盖账本与确定性产物。
- `CLAUDE.md`、`部署说明.md`：版本、模板计数、旅程计数和 Draft 边界。

---

### Task 1: 用红灯锁住小米与鹰嘴豆的状态身份

**Files:**

- Modify: `tools/tests/ingredient-taxonomy.test.mjs`
- Modify: `tools/tests/pantry-planner-v2-selection.test.mjs`
- Modify: `tools/tests/pantry-planner-v2-identity.test.mjs`

**Interfaces:**

- Consumes: `normalizePlannerItems(rawItems, taxonomy)`、`validateIngredientTaxonomy(data)`、`planMeal(assets, request)`、`computePlanId(plan)`。
- Produces: taxonomy r9、三种 canonical identities、鹰嘴豆歧义和稳定 plan identity 的失败测试。

- [ ] **Step 1: 写 taxonomy r9 与 canonical identity 失败测试**

在 `tools/tests/ingredient-taxonomy.test.mjs` 把版本断言改为 r9，并增加：

```js
test('millet and chickpea states remain explicit and non-interchangeable', () => {
  const rows = normalizePlannerItems(
    ['小米','黄小米','干鹰嘴豆','熟鹰嘴豆','煮熟鹰嘴豆','罐装鹰嘴豆（沥干）','鹰嘴豆'],
    catalog,
  );
  assert.deepEqual(
    rows.slice(0, 6).map(row => [row.canonical_id,row.category,row.state,row.shape_or_cut,row.recognized]),
    [
      ['raw-millet','raw_millet','raw','whole_grain',true],
      ['raw-millet','raw_millet','raw','whole_grain',true],
      ['dry-chickpea-seed','dry_legume','dry','whole_seed',true],
      ['cooked-chickpea-seed','cooked_legume','cooked','whole_seed',true],
      ['cooked-chickpea-seed','cooked_legume','cooked','whole_seed',true],
      ['cooked-chickpea-seed','cooked_legume','cooked','whole_seed',true],
    ],
  );
  assert.equal(rows[6].recognized, false);
  assert.equal(rows[6].ambiguity_id, 'chickpea-state');
  assert.equal(rows[6].ambiguity_code, 'ambiguous_ingredient_state');
  assert.deepEqual(rows[6].eligible_items, ['干鹰嘴豆','熟鹰嘴豆']);
});
```

另加精确属性断言：

```js
const millet = catalog.items.find(row => row.canonical_id === 'raw-millet');
assert.equal(millet.texture_behavior.behavior_code, 'absorbs_liquid_and_thickens');
assert.deepEqual(millet.texture_behavior.best_method_codes, ['soak','simmer']);
assert.deepEqual(millet.cooking_risk.required_endpoint_codes, ['grain_tender_no_hard_center']);
assert.deepEqual(millet.compatible_slot_codes, ['soft_grain_staple']);
```

- [ ] **Step 2: 写 validator 有限词表与歧义负例**

用 `structuredClone(catalog)` 逐项证明以下值被 validator 拒绝：未知 `raw_millet` 替代类别、未知 `whole_grain` 形态、未知 `soak` 方法、未知 `raw_grain` 风险、未知 `grain_tender_no_hard_center` endpoint、未知 `soft_grain_staple` slot code、`eligible_items` 指向不存在 display name、把“鹰嘴豆”同时放进某 identity aliases。

预期错误必须是可定位字符串，不得抛异常。

- [ ] **Step 3: 写 pantry 状态失败测试**

在 `tools/tests/pantry-planner-v2-selection.test.mjs` 增加：

```js
test('generic chickpea blocks completion while preserving a valid millet potato pot', () => {
  const result = planMeal(assets, request({ must:['小米','土豆','鹰嘴豆'] }));
  assert.equal(result.status, 'needs_user_decision');
  assert.equal(result.generation_allowed, false);
  assert.equal(result.plan.pots.length, 1);
  assert.deepEqual(result.plan.pots[0].planned_must_use.map(row => row.raw).sort(), ['土豆','小米']);
  const unresolved = result.plan.unplanned_must_use.find(row => row.raw === '鹰嘴豆');
  assert.equal(unresolved.reason_code, 'ambiguous_ingredient_state');
  assert.deepEqual(unresolved.eligible_items, ['干鹰嘴豆','熟鹰嘴豆']);
});

test('dry chickpea is never placed into the cooked legume slot', () => {
  const result = planMeal(assets, request({ must:['小米','土豆','干鹰嘴豆'] }));
  assert.equal(result.status, 'needs_user_decision');
  assert.equal(result.generation_allowed, false);
  assert.ok(result.plan.pots[0].planned_must_use.every(row => row.raw !== '干鹰嘴豆'));
  assert.equal(result.plan.unplanned_must_use.find(row => row.raw === '干鹰嘴豆').reason_code, 'unsupported_ingredient_state');
});
```

另加“干鹰嘴豆”单独输入返回 `no_valid_plan`，不得创建 pot。

- [ ] **Step 4: 写 plan identity 失败测试**

证明 `raw-millet`、`cooked-chickpea-seed`、`chickpea-state` 的 canonical/ambiguity 字段进入 plan identity；`eligible_items` 调换顺序不改变 ID，删除一个选项必须改变 ID；泛称“鹰嘴豆”重复输入只占一个去重分母。

- [ ] **Step 5: 运行聚焦测试并确认有效红灯**

```sh
node --test tools/tests/ingredient-taxonomy.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs \
  tools/tests/pantry-planner-v2-identity.test.mjs
```

Expected: FAIL，原因必须是 r9 身份、歧义或属性不存在；测试语法错误不算有效红灯。

- [ ] **Step 6: 提交红灯测试**

```sh
git add tools/tests/ingredient-taxonomy.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs \
  tools/tests/pantry-planner-v2-identity.test.mjs
git commit -m "test: define millet and chickpea semantics"
```

---

### Task 2: 实现 taxonomy r9，不复制身份事实

**Files:**

- Modify: `tools/data/ingredient-taxonomy.v1.json`
- Modify: `worker/src/ingredient-taxonomy-validator.js`
- Modify only if a generic gap is proven: `worker/src/planner-v2.js`

**Interfaces:**

- Consumes: Task 1 红灯。
- Produces: `raw-millet`、`dry-chickpea-seed`、`cooked-chickpea-seed`、`chickpea-state` 和 validator r9。

- [ ] **Step 1: 更新 taxonomy 数据**

把 `taxonomy_version` 改为 `taxonomy-v1-20260727-r9`，增加规格中的三个 identity 和一个 ambiguity。关键边界：

```json
{
  "canonical_id": "raw-millet",
  "display_name": "小米",
  "aliases": ["黄小米"],
  "input_scope": "pantry_input",
  "category": "raw_millet",
  "states": ["raw"],
  "shapes_or_cuts": ["whole_grain"],
  "cook_speed": "medium",
  "moisture_release": "low",
  "texture_behavior": {
    "behavior_code": "absorbs_liquid_and_thickens",
    "best_method_codes": ["soak", "simmer"],
    "failure_mode_codes": ["hard_center_when_undercooked", "scorches_without_stirring"]
  },
  "cooking_risk": {
    "risk_code": "raw_grain",
    "required_endpoint_codes": ["grain_tender_no_hard_center"]
  },
  "compatible_slot_codes": ["soft_grain_staple"],
  "incompatible_slot_codes": ["raw_rice_required", "cooked_rice_required", "noodle_required"]
}
```

`dry-chickpea-seed` 只能兼容 `dry_legume_required`；`cooked-chickpea-seed` 兼容 `cooked_legume`。泛称“鹰嘴豆”不得出现在任何 identity 的 display name 或 aliases。

- [ ] **Step 2: 扩展 validator 的有限词表**

只增加规格需要的有限值：

- category: `raw_millet`
- shape: `whole_grain`
- texture: `absorbs_liquid_and_thickens`
- methods: `soak`
- failures: `hard_center_when_undercooked`、`scorches_without_stirring`
- risk: `raw_grain`
- endpoint: `grain_tender_no_hard_center`
- slots: `soft_grain_staple`、`raw_rice_required`、`cooked_rice_required`、`noodle_required`

不要为未来牛奶、青稞、蕨麻或杂粮预留新枚举。

- [ ] **Step 3: 只在红灯证明需要时修通用 Planner**

优先复用 r8 已实现的 `ambiguous_inputs`、dedupe、unplanned 和 plan identity。若 Task 1 仍失败，只修通用的 `dry_legume` unsupported-state reason 映射；禁止增加 `if (name === '鹰嘴豆')` 或第二份 alias 表。

- [ ] **Step 4: 运行聚焦测试**

```sh
node --test tools/tests/ingredient-taxonomy.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs \
  tools/tests/pantry-planner-v2-identity.test.mjs
```

Expected: PASS。

- [ ] **Step 5: 提交 taxonomy 实现**

```sh
git add tools/data/ingredient-taxonomy.v1.json \
  worker/src/ingredient-taxonomy-validator.js \
  worker/src/planner-v2.js
git commit -m "feat: add millet and chickpea state identities"
```

---

### Task 3: 用红灯锁住窄模板与 Ratio DSL r5

**Files:**

- Modify: `tools/tests/meal-template-catalog.test.mjs`
- Modify: `tools/tests/ratio-dsl.test.mjs`
- Modify: `tools/tests/pantry-planner-v2-selection.test.mjs`

**Interfaces:**

- Consumes: taxonomy r9。
- Produces: template r9、Ratio r5、2/3/4 人份机器数量和 quick 排除的失败测试。

- [ ] **Step 1: 写模板状态与槽位失败测试**

在 `tools/tests/meal-template-catalog.test.mjs` 把版本改为 r9，active/planned 数改为 11/5，并精确断言：

```js
const soft = catalog.templates.find(row => row.template_id === 'soft-family-rice-pot');
assert.equal(soft.activation_status, 'active');
assert.equal(soft.runtime_eligible, true);
assert.deepEqual(soft.required_slots.map(row => [row.slot_id,row.accepts_categories]), [
  ['staple',['raw_millet']],
  ['root_vegetable',['root_vegetable']],
]);
assert.deepEqual(soft.optional_slots.map(row => [row.slot_id,row.accepts_categories]), [
  ['cooked_legume',['cooked_legume']],
  ['leafy_vegetable',['leafy_vegetable']],
]);
assert.deepEqual(soft.supported_intents, ['normal','fresh','batch']);
assert.deepEqual(soft.time_range, { min_minutes:35, max_minutes:50 });
assert.deepEqual(soft.ratio_constraints, ['soft-family-millet-liquid-v1']);
assert.deepEqual(soft.evidence_recipe_ids, ['chinese-congee','qinghai-hao-fan']);
```

增加负例：如果 staple 改回 `raw_rice`、允许 `dry_legume`、把 `basic_extra` 放到小米槽、删除 grain endpoint、标记 quick 或接受 5 个用户食材，validator 必须失败。

- [ ] **Step 2: 写 Ratio r5 精确编译失败测试**

在 `tools/tests/ratio-dsl.test.mjs` 把版本和 active set 改到新基线，并增加两人默认量：

```js
const result = compileRatioPlan('soft-family-millet-liquid-v1', {
  servings: 2,
  slots: {
    staple: [{ name:'小米', category:'raw_millet', canonical_id:'raw-millet', attributes:{} }],
    root_vegetable: [{ name:'土豆', category:'root_vegetable', canonical_id:'potato', attributes:{} }],
    cooked_legume: [{ name:'熟鹰嘴豆', category:'cooked_legume', canonical_id:'cooked-chickpea-seed', attributes:{} }],
  },
}, catalog);
assert.equal(result.ok, true);
assert.deepEqual(new Map(result.ingredient_amounts.map(row => [row.name,row.grams])), new Map([
  ['小米',80], ['土豆',180], ['熟鹰嘴豆',176], ['水',664], ['食用油',10], ['盐',3],
]));
```

再断言 3 人和 4 人按 default 线性缩放，叶菜仅在用户提供时量化，`required_extra_items` 只含水/油/盐；`raw_rice` 或错误 canonical ID 不能命中该规则。

- [ ] **Step 3: 写 Planner 完整覆盖与 quick 失败测试**

```js
test('millet potato cooked chickpea produces a complete 3 of 3 pantry pot', () => {
  const result = planMeal(assets, request({ must:['小米','土豆','熟鹰嘴豆'], servings:2 }));
  assert.equal(result.status, 'complete');
  assert.equal(result.generation_allowed, true);
  assert.equal(result.plan.coverage_ratio, 1);
  assert.equal(result.plan.pots.length, 1);
  assert.equal(result.plan.pots[0].template_id, 'soft-family-rice-pot');
  assert.deepEqual(new Set(result.plan.pots[0].planned_must_use.map(row => row.raw)), new Set(['小米','土豆','熟鹰嘴豆']));
});

test('quick never relaxes the soft millet pot beyond 30 minutes', () => {
  const result = planMeal(assets, request({ must:['小米','土豆'], intent:'quick' }));
  assert.equal(result.status, 'no_valid_plan');
  assert.equal(result.generation_allowed, false);
});
```

- [ ] **Step 4: 运行测试并确认有效红灯**

```sh
node --test tools/tests/meal-template-catalog.test.mjs \
  tools/tests/ratio-dsl.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs
```

Expected: FAIL，原因是 soft template 尚未激活、Ratio rule 尚不存在或资产版本仍为 r8/r4。

- [ ] **Step 5: 提交红灯测试**

```sh
git add tools/tests/meal-template-catalog.test.mjs \
  tools/tests/ratio-dsl.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs
git commit -m "test: define soft millet pot planning contract"
```

---

### Task 4: 激活模板并实现机器比例，不修改选菜算法

**Files:**

- Modify: `tools/data/meal-templates.v2.json`
- Modify: `worker/src/meal-template-validator.js`
- Modify: `tools/data/ratio-rules.v1.json`
- Modify: `worker/src/ratio-dsl.js`

**Interfaces:**

- Consumes: Task 3 红灯。
- Produces: `soft-family-rice-pot` active 分支、`soft-family-millet-liquid-v1` 和三份 r9/r5 资产版本。

- [ ] **Step 1: 把现有 soft template 改为窄 active 分支**

按规格完整替换该模板的槽位，不在旧大米模板上叠加条件分支。烹饪顺序固定为：

1. `soak_soft_grain`：小米清洗并浸泡；
2. `add_staple_root_and_liquid`：小米、根茎和定量水同锅；
3. `simmer_soft_grain_and_root`：小火熬煮并防糊底；
4. `add_cooked_legume`：有熟豆时后段加入；
5. `add_leafy_vegetable`：有叶菜时最后加入；
6. `reach_safety_endpoints`：谷物/根茎无硬芯，熟豆热透。

若现有 validator 使用有限 `ACTION_CODES`，只增加这五个小米专用机器 action code；不要把中文自然步骤塞进 template。

安全终点至少包含：

```json
[
  {"applies_to_category":"raw_millet","endpoint_code":"grain_tender_no_hard_center"},
  {"applies_to_category":"root_vegetable","endpoint_code":"tender"},
  {"applies_to_category":"cooked_legume","endpoint_code":"heated_through"}
]
```

- [ ] **Step 2: 升级 template validator**

把 `TAXONOMY_VERSION`、catalog version 和 active set 升到 r9；`BASIC_EXTRA_CATEGORIES` 不加入 `raw_millet`。为 `grain_tender_no_hard_center` 增加 taxonomy endpoint 映射和 `raw_millet` category 限制；`heated_through` 可用于 `cooked_legume`。

- [ ] **Step 3: 写入 Ratio DSL r5**

把 catalog 版本升为 r5，增加 `soft-family-millet-liquid-v1`。所有 user slots 各有一个 `per_serving`；水使用 `ratio`，分母只指向 `staple`；油和盐使用现有 `fixed_addition`/`scale_by_servings`。不新增 operator，不从自然语言读比例，不做蔬菜含水抵扣。

- [ ] **Step 4: 升级 Ratio validator active set**

只更新版本与 active set，让“每个 active template 的每个 user slot 都被量化”继续成立。不要新增小米特判或第七种 operator。

- [ ] **Step 5: 运行聚焦测试**

```sh
node --test tools/tests/meal-template-catalog.test.mjs \
  tools/tests/ratio-dsl.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs
```

Expected: PASS。

- [ ] **Step 6: 独立检查机器资产**

```sh
jq -e '.templates|length==16 and ([.templates[]|select(.activation_status=="active")]|length==11)' tools/data/meal-templates.v2.json
jq -e '.rules[]|select(.rule_id=="soft-family-millet-liquid-v1")' tools/data/ratio-rules.v1.json >/dev/null
jq -e '.recipes|length==72' tools/data/recipe-library.json
```

- [ ] **Step 7: 提交模板和比例实现**

```sh
git add tools/data/meal-templates.v2.json \
  worker/src/meal-template-validator.js \
  tools/data/ratio-rules.v1.json \
  worker/src/ratio-dsl.js
git commit -m "feat: activate deterministic soft millet pot"
```

---

### Task 5: 锁住计划状态、换一换和版本失效行为

**Files:**

- Modify: `tools/tests/pantry-planner-v2-selection.test.mjs`
- Modify: `tools/tests/pantry-planner-v2-identity.test.mjs`
- Modify: `tools/tests/worker-planner-v2.test.mjs`
- Modify only if a generic gap is proven: `worker/src/planner-v2.js`
- Modify only if a generic gap is proven: `worker/src/worker.js`

**Interfaces:**

- Consumes: active soft template and Ratio r5。
- Produces: pantry/recommend、no-alternative、stale-plan 和 HTTP version contract。

- [ ] **Step 1: 写完整状态矩阵测试**

至少覆盖：

- 小米 + 土豆：`complete`，2/2；
- 小米 + 土豆 + 熟鹰嘴豆 + 小白菜：`complete`，4/4；
- 小米 + 牛奶：`no_valid_plan`；
- 小米 + 土豆 + 牛奶：`needs_user_decision`，保留 pot，牛奶在 `unplanned_must_use`；
- recommend 输入小米、土豆、熟鹰嘴豆、牛奶：`ready`，合理使用前三项并解释 `unused_prefer_use` 的牛奶；
- current plan 为唯一 soft plan 时再次 swap：`no_alternative_plan`；
- plan ID 在食材顺序变化时不变，在 servings、ratio version 或 template version变化时改变。

- [ ] **Step 2: 写 HTTP 版本与 stale-plan 失败测试**

在 `tools/tests/worker-planner-v2.test.mjs` 把期望版本升级为 r9/r9/r5，并证明旧 r8/r8/r4 plan token 重算后返回 `stale_plan`，且 `/plan-meal` 全路径 DeepSeek 调用数为 0。

- [ ] **Step 3: 运行测试并确认红灯来源**

```sh
node --test tools/tests/pantry-planner-v2-selection.test.mjs \
  tools/tests/pantry-planner-v2-identity.test.mjs \
  tools/tests/worker-planner-v2.test.mjs
```

如果只有静态版本断言失败，说明通用 Planner 已覆盖本能力；不要为了“有代码改动”而修改算法。若状态矩阵失败，只在通用候选/状态逻辑中做最小修复，禁止小米菜名特判。

- [ ] **Step 4: 实现最小修复并复跑**

Expected: PASS，且 active candidate 的选择依旧来自 template/slots/ratio 数据。

- [ ] **Step 5: 提交状态闭包**

```sh
git add tools/tests/pantry-planner-v2-selection.test.mjs \
  tools/tests/pantry-planner-v2-identity.test.mjs \
  tools/tests/worker-planner-v2.test.mjs \
  worker/src/planner-v2.js worker/src/worker.js
git commit -m "test: lock soft millet planner states"
```

---

### Task 6: 锁住 DeepSeek 只表达计划的边界

**Files:**

- Modify: `tools/tests/worker-generate-plan.test.mjs`
- Modify: `worker/src/generated-plan-contract.js`
- Modify only if required by the shared contract: `worker/src/worker.js`

**Interfaces:**

- Consumes: confirmed, signed/recomputed soft millet plan。
- Produces: deterministic generation skeleton、ingredient/grams/order/endpoint parity 和文化命名边界。

- [ ] **Step 1: 写正常生成合同测试**

从真实 Planner 生成“小米、土豆、熟鹰嘴豆”的锁定计划，再断言 `buildGenerationSkeleton()`：

- ingredient refs 恰好覆盖 Planner 的用户食材和水/油/盐；
- grams 与 `ingredient_amounts` 完全相等；
- action code 顺序与 template 一致；
- `grain_tender_no_hard_center`、`tender`、`heated_through` 各出现在正确阶段；
- 可选熟豆不存在时，熟豆阶段不生成空步骤；
- allowed text 明确“小米浸泡约 30 分钟”“熟鹰嘴豆后加”“小米与土豆无硬芯”“熟豆热透”。

- [ ] **Step 2: 写模型越界失败测试**

对 fake upstream 输出逐项 mutation：新增牛奶、删除熟鹰嘴豆、把小米改成大米、把熟鹰嘴豆写成干鹰嘴豆、修改水量、交换浸泡与加水顺序、删除 grain endpoint、菜名或推荐理由声称“传统青海熬饭/正宗/地道复刻”。每项必须返回 422 `model_contract_violation`，DeepSeek 调用次数保持 1，不自动重试。

- [ ] **Step 3: 运行测试并确认有效红灯**

```sh
node --test tools/tests/worker-generate-plan.test.mjs
```

Expected: FAIL，原因必须是新 action code/endpoint 尚无 generation phrase 或文化边界未校验。

- [ ] **Step 4: 扩展有限生成合同**

在 `worker/src/generated-plan-contract.js` 的有限 phrase/action/endpoint 表中加入小米分支。继续要求模型从 allowed texts 选择，不新增开放式步骤 prompt。文化边界校验应作用于 `dish_name` 和 `recommendation_reason`，使用有限禁用声明集合，不误伤“家庭小米软谷物锅”。

- [ ] **Step 5: 复跑并提交**

```sh
node --test tools/tests/worker-generate-plan.test.mjs
git add tools/tests/worker-generate-plan.test.mjs \
  worker/src/generated-plan-contract.js worker/src/worker.js
git commit -m "feat: lock soft millet generation contract"
```

---

### Task 7: 锁住 Worker、Python 和前端语义一致性

**Files:**

- Modify: `tools/tests/planner-v2-parity.test.mjs`
- Modify: `tools/tests/frontend-recipe-contract.test.mjs`
- Modify only if parity proves a bridge gap: `ai_proxy.py`
- Modify only if UI copy is missing: `index.html`

**Interfaces:**

- Consumes: Worker Planner public response。
- Produces: normal/ambiguity/dry-bean/quick 四类本地桥接 parity 和用户可理解页面文案。

- [ ] **Step 1: 写四组 parity 失败测试**

比较 Worker handler、Python CLI bridge 和 Python localhost HTTP bridge 的规范化语义：

1. 小米、土豆、熟鹰嘴豆 → complete；
2. 小米、土豆、鹰嘴豆 → needs_user_decision；
3. 小米、土豆、干鹰嘴豆 → needs_user_decision 且 pot 保留；
4. pantry+quick 小米、土豆 → no_valid_plan。

比较字段至少包含 status、generation_allowed、normalized_items、planned/unplanned、coverage、template ID、ingredient amounts、required extras、safety endpoints 和三份资产版本；不要只比较 HTTP status。

- [ ] **Step 2: 写前端文案失败测试**

证明 `needs_user_decision` 页面显示服务端返回的 reason、保留已规划锅、提供“放宽一种食材/调整食材/接受部分规划”结构化动作；`no_valid_plan` 明确当前不支持奶粥或干豆泡发；不得显示“全部安排完成”。不新增小米专用客户端规划逻辑。

- [ ] **Step 3: 运行测试**

```sh
node --test tools/tests/planner-v2-parity.test.mjs \
  tools/tests/frontend-recipe-contract.test.mjs
python3 -m py_compile ai_proxy.py
```

如果现有 generic UI 和 Python bridge 已通过，保持实现文件不变；测试覆盖本身即为闭包。若失败，只同步公共响应/资产加载，不在 Python 或前端复制 taxonomy/template/ratio 数据。

- [ ] **Step 4: 提交 parity 与 UI 闭包**

```sh
git add tools/tests/planner-v2-parity.test.mjs \
  tools/tests/frontend-recipe-contract.test.mjs ai_proxy.py index.html
git commit -m "test: lock millet planner cross-runtime parity"
```

---

### Task 8: 增加 J117–J138 真实用户旅程门禁

**Files:**

- Modify: `tools/data/pantry-planner-v2-journeys.json`
- Modify: `tools/run-pantry-planner-v2-journeys.mjs`
- Modify: `tools/tests/pantry-planner-v2-journeys.test.mjs`

**Interfaces:**

- Consumes: public `/plan-meal`、`/generate-plan` 和前端可见边界。
- Produces: 连续 138 条旅程和准确的 public-boundary 断言。

- [ ] **Step 1: 先把 corpus 测试改为 138 条并观察红灯**

保持 J001–J116 字节语义不变，把总数、连续 spec numbers、唯一 ID 和 category 计数升级。新增 22 条放入 `regional_capability`，因此该 category 从 72 变为 94；其余类别不变。

- [ ] **Step 2: 添加 J117–J138**

按规格逐条覆盖：

- J117 3/3 complete；
- J118 2/2 complete；
- J119 3 人份精确克数；
- J120 4 人份精确克数；
- J121 输入顺序不改变 plan ID；
- J122 泛称鹰嘴豆歧义；
- J123 重复泛称只占一个分母；
- J124 干鹰嘴豆不进入 cooked slot；
- J125 小米 + 牛奶 no_valid_plan；
- J126 小米 + 土豆 + 牛奶保留 pot；
- J127 四项 4/4 complete；
- J128 pantry+quick 排除；
- J129 recommend 合理子集并解释 unused；
- J130 swap 无第二结构；
- J131 model 新增牛奶；
- J132 model 删除熟豆；
- J133 model 改水量；
- J134 model 把熟豆写成干豆；
- J135 小米不命中 raw-rice ratio；
- J136 青稞、蕨麻、面团仍不接纳；
- J137 Worker/Python 正常与歧义 parity；
- J138 覆盖审计 `qinghai-hao-fan` 100%、青藏至少 1/4。

每条保持 `plan_deepseek_max:0`；只有 J131–J134 的确认后生成允许 `generate_deepseek_max:1`。未确认、歧义、quick、no-valid、swap-exhausted 均为 0。

- [ ] **Step 3: 只在需要时扩展 runner 的结构化 expectation**

优先复用 `HANDLED_EXPECTATION_KEYS`。若缺少通用断言，只添加 `exact_ingredient_amounts`、`unplanned_reason_code`、`forbidden_template_id` 或等价结构化键；禁止在 runner 中写 `if (journey.id === 'J117')`。

- [ ] **Step 4: 运行并修到全绿**

```sh
node --test tools/tests/pantry-planner-v2-journeys.test.mjs
node tools/run-pantry-planner-v2-journeys.mjs
```

Expected summary: `138/138 planner v2 journeys passed`。

- [ ] **Step 5: 提交旅程门禁**

```sh
git add tools/data/pantry-planner-v2-journeys.json \
  tools/run-pantry-planner-v2-journeys.mjs \
  tools/tests/pantry-planner-v2-journeys.test.mjs
git commit -m "test: add soft millet household journeys"
```

---

### Task 9: 刷新地域覆盖账本，保持传统性边界

**Files:**

- Modify: `tools/data/regional-menu-mappings.v1.json`
- Modify: `tools/tests/planner-menu-coverage-builder.test.mjs`
- Modify: `tools/tests/qinghai-tibet-one-pot-research-builder.test.mjs`
- Modify: `tools/tests/qinghai-tibet-one-pot-research-artifacts.test.mjs`
- Regenerate: `tools/generated/planner-menu-coverage.v1.json`
- Regenerate: `docs/planner-menu-coverage.md`
- Regenerate only if the check reports staleness: `tools/generated/regional-atlas.v2.json`
- Regenerate only if the check reports staleness: `docs/regional-atlas.md`

**Interfaces:**

- Consumes: active template, taxonomy r9, Ratio r5。
- Produces: `qinghai-hao-fan` 3/3 规划覆盖和青藏 1/4 完整覆盖的可审计记录。

- [ ] **Step 1: 写覆盖红灯**

在 coverage builder 测试中断言：

```js
const qinghai = report.menus.find(row => row.recipe_id === 'qinghai-hao-fan');
assert.equal(qinghai.coverage_ratio, 1);
assert.equal(qinghai.coverage_status, 'complete');
assert.equal(qinghai.runtime_template_id, 'soft-family-rice-pot');
assert.deepEqual(new Set(qinghai.covered_core_ingredients), new Set(['小米','土豆','熟鹰嘴豆']));
assert.equal(report.regions.find(row => row.region_id === 'qinghai-tibet').complete_count, 1);
```

并断言 `tibetan-savory-congee`、`tibetan-gutu`、`tibetan-ginseng-fruit-rice` 仍不 complete。

- [ ] **Step 2: 更新 mapping ledger**

只更新 `qinghai-hao-fan` 对应能力：runtime template 指向 `soft-family-rice-pot`，taxonomy gaps 清除小米/熟鹰嘴豆，ratio gap 指向 `soft-family-millet-liquid-v1`。传统性/来源 blocker 不得删除；文字必须明确“食材兼容家庭方案，不声称传统复刻”。

不要改 mapping version，除非现有 validator 的版本策略明确要求内容更新必须 bump；若 bump，必须同步 validator 与所有生成产物测试，不能只改 JSON。

- [ ] **Step 3: 运行 coverage 构建检查并生成**

```sh
node --test tools/tests/planner-menu-coverage-builder.test.mjs \
  tools/tests/qinghai-tibet-one-pot-research-builder.test.mjs \
  tools/tests/qinghai-tibet-one-pot-research-artifacts.test.mjs
node tools/build-planner-menu-coverage.mjs --write
node tools/build-planner-menu-coverage.mjs --check
node tools/build-regional-atlas.mjs --check
```

若最后一条仅报告输入 hash 过期，再运行：

```sh
node tools/build-regional-atlas.mjs --write
node tools/build-regional-atlas.mjs --check
```

- [ ] **Step 4: 审计生成产物**

确认：72 recipe 未变；青藏 complete 仅从 0/4 到 1/4；文档没有“传统青海熬饭已验证”“人工批准”或真人试做声明；research-only 资产仍不进入 dist。

- [ ] **Step 5: 提交覆盖闭包**

```sh
git add tools/data/regional-menu-mappings.v1.json \
  tools/tests/planner-menu-coverage-builder.test.mjs \
  tools/tests/qinghai-tibet-one-pot-research-builder.test.mjs \
  tools/tests/qinghai-tibet-one-pot-research-artifacts.test.mjs \
  tools/generated/planner-menu-coverage.v1.json docs/planner-menu-coverage.md \
  tools/generated/regional-atlas.v2.json docs/regional-atlas.md
git commit -m "docs: record Qinghai Tibet millet coverage"
```

---

### Task 10: 更新 health、部署基线与文档数字

**Files:**

- Modify: `tools/tests/worker-planner-v2.test.mjs`
- Modify: `CLAUDE.md`
- Modify: `部署说明.md`

**Interfaces:**

- Consumes: final asset versions and counts。
- Produces: `/health` 与维护文档的单一可核对基线。

- [ ] **Step 1: 写 health 与文档红灯**

断言 `/health` 报告：

```text
plannerVersion: pantry-planner-v2
templateCatalogVersion: templates-v2-20260727-r9
ingredientTaxonomyVersion: taxonomy-v1-20260727-r9
ratioRulesVersion: ratio-rules-v1-20260727-r5
templateCount: 16
activeTemplateCount: 11
plannedTemplateCount: 5
baseRecipes: 72
```

同时让测试匹配 `CLAUDE.md` 和 `部署说明.md` 的 r9/r9/r5、11/5、138/138。

- [ ] **Step 2: 更新文档，不改部署授权**

把旧版本和数字替换为新基线；明确 Pantry Planner V2 仍在 Draft PR、未完成真实 DeepSeek live 验证、未部署 Preview 或 production。不得把新离线门禁描述为人工厨房认可。

- [ ] **Step 3: 运行聚焦测试**

```sh
node --test tools/tests/worker-planner-v2.test.mjs
```

Expected: PASS。

- [ ] **Step 4: 提交版本闭包**

```sh
git add tools/tests/worker-planner-v2.test.mjs CLAUDE.md 部署说明.md
git commit -m "docs: close soft millet planner baseline"
```

---

### Task 11: 全量验证、独立审计与 Draft PR 更新

**Files:**

- Verify only unless a test exposes a scoped defect.

**Interfaces:**

- Consumes: Tasks 1–10。
- Produces: 可复现验证证据和保持 Draft/Open 的 PR #1。

- [ ] **Step 1: 运行全部 Node 测试**

```sh
node --test tools/tests/*.test.mjs
```

Expected: 全部通过；不得通过删测试、放宽断言或增加隐式重试解决失败。

- [ ] **Step 2: 运行产品门禁**

```sh
node tools/check-foods.mjs
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
python3 -m py_compile ai_proxy.py
```

Expected: foods/recipes 全绿，`138/138 planner v2 journeys passed`，Python 语法通过。

- [ ] **Step 3: 运行 canonical 构建与字节一致性**

```sh
node --test tools/tests/build-dist.test.mjs
node tools/build-dist.mjs --out-dir dist --build-id "draft-pr1-soft-millet-r9"
node --test tools/tests/build-dist.test.mjs
```

不得用手工 `cp`。确认 dist 中 planner assets 与源码字节一致，research-only/coverage 审计资产未进入部署包。

- [ ] **Step 4: 独立数据审计**

```sh
jq -e '.recipes|length==72' tools/data/recipe-library.json
jq -e '.templates|length==16' tools/data/meal-templates.v2.json
jq -e '[.templates[]|select(.activation_status=="active")]|length==11' tools/data/meal-templates.v2.json
jq -e '[.templates[]|select(.activation_status=="planned")]|length==5' tools/data/meal-templates.v2.json
jq -e '.taxonomy_version=="taxonomy-v1-20260727-r9"' tools/data/ingredient-taxonomy.v1.json
jq -e '.template_catalog_version=="templates-v2-20260727-r9"' tools/data/meal-templates.v2.json
jq -e '.ratio_catalog_version=="ratio-rules-v1-20260727-r5"' tools/data/ratio-rules.v1.json
git diff --check origin/codex/targeted-recipe-expansion...HEAD
```

- [ ] **Step 5: 请求代码审查**

使用 `superpowers:requesting-code-review` 审查：Planner 是否仍完全由 template/taxonomy/Ratio 驱动、是否误启用普通大米或干豆、生成合同能否被模型绕过、覆盖文档是否夸大传统性和真人验证。

- [ ] **Step 6: 检查 PR 状态并推送当前分支**

```sh
gh pr view 1 --json number,state,isDraft,headRefName,baseRefName,url
git status --short --branch
git push origin codex/targeted-recipe-expansion
gh pr view 1 --json number,state,isDraft,headRefName,baseRefName,url
```

Expected: PR #1 为 `OPEN`、`isDraft:true`；head 为 `codex/targeted-recipe-expansion`。不运行 Wrangler，不部署，不 merge，不把 Draft 转 Ready。

---

## Final Acceptance Checklist

- [ ] 小米与黄小米命中同一 `raw-millet`，但不冒充 `raw_rice`。
- [ ] 干/熟鹰嘴豆分离，泛称鹰嘴豆必须询问状态。
- [ ] 小米 + 土豆 + 熟鹰嘴豆是 3/3 complete；小米 + 土豆是 2/2 complete。
- [ ] 干豆、牛奶、青稞、蕨麻、面团没有因本轮获得隐式运行能力。
- [ ] `pantry+quick` 不选 35–50 分钟的小米锅。
- [ ] 2 人默认机器量为小米 80g、土豆 180g、熟鹰嘴豆 176g、水 664g、油 10g、盐 3g。
- [ ] DeepSeek 不能改食材、克数、顺序、安全终点或地域声明。
- [ ] `qinghai-hao-fan` 规划覆盖 100%，但文档只称家庭通用方案；青藏其余三道仍未 complete。
- [ ] 72 recipes、16 templates、11 active + 5 planned、138/138 journeys。
- [ ] 全测试、foods/recipes 门禁、Python 语法、canonical build 和字节一致性通过。
- [ ] PR #1 保持 Draft/Open，未部署、未合并。


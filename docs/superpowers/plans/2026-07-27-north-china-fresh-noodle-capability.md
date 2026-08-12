# North China Fresh Noodle Capability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不新增 recipe 或 template 的前提下，把鲜小麦面条与干挂面拆成可追踪的机器身份，并用鲜面专用补液规则让现有北方豆角焖面形成可靠的 3/3 单锅计划。

**Architecture:** `ingredient-taxonomy.v1.json` 新增 `fresh-wheat-noodle`，Planner 响应和内部槽位显式携带 `canonical_id`；Ratio DSL 用可选 `when.canonical_ids` 做精确分流，并用 `liquid_distribution` 锁定 80% 初始液体与 20% 预留液体。`braised-noodle-pot` 仍是通用模板，现有 72 道 recipe 只提供 evidence，不决定组合空间；先用 TDD 锁住身份、比例、失败路径和生成边界，再更新 100 条公共旅程与四地域覆盖审计。

**Tech Stack:** JSON 机器资产、Cloudflare Pages Functions ES modules、Node.js 内置 `node:test`、Python 3 本地 bridge、确定性 Markdown/JSON/CSV 构建器。

## Global Constraints

- [ ] 以 `docs/superpowers/specs/2026-07-27-north-china-fresh-noodle-capability-design.md` 为唯一产品契约。
- [ ] `tools/data/recipe-library.json` 保持 72 道：12 `approved` + 60 `auto_approved`；不得新增、删除或修改 recipe。
- [ ] Template catalog 保持 16 个：10 active + 6 planned；不得新增模板或改变激活状态。
- [ ] 目标版本固定为 `taxonomy-v1-20260727-r6`、`ratio-rules-v1-20260727-r4`、`templates-v2-20260727-r7`。
- [ ] `fresh-wheat-noodle` 与原 `noodle` 必须是两个 canonical identity；raw 原词不得丢失。
- [ ] `fresh-wheat-noodle.ratio_rule_policy` 固定为 `canonical_required`；精确 rule 缺失时不得回退 category 通用规则。
- [ ] “预蒸面”“熟面”“烩面坯”“面片”继续未识别，不得归入鲜面或挂面。
- [ ] 鲜面精确 Ratio rule 的液体/鲜面范围固定为 0.70–1.00，默认 0.85；初始/预留分配固定为 0.8/0.2。
- [ ] 鲜面不得回退通用干面规则；同等精确规则冲突必须返回 `ratio_rule_ambiguous`。
- [ ] 豆角保留 `bean_fully_cooked`，猪肉保留 `pork_fully_cooked`，面条保留 `noodle_tender`。
- [ ] `north-china-green-bean-braised-noodles` 只能恢复为 `full_single_pot_ingredient_compatible`；不得宣称任何单省独占起源。
- [ ] `/plan-meal` 保持 0 次 DeepSeek；`/generate-plan` 每次最多 1 次且不自动重试。
- [ ] 每个生产行为修改必须先写失败测试、观察正确红灯，再写最小实现。
- [ ] 不新增账号、用户画像、营养追踪、云端用户数据、自然语言场景或多 Agent 产品功能。
- [ ] 只更新 Draft PR #1；不部署 Preview 或 production，不合并 PR。

---

## File Responsibility Map

- `tools/data/ingredient-taxonomy.v1.json`：鲜面/干面 identity、aliases 和烹饪属性的唯一机器真源。
- `worker/src/ingredient-taxonomy-validator.js`：taxonomy r6、受控字段和方法词表校验。
- `worker/src/planner-v2.js`：`canonical_id` 传播、精确 Ratio rule 选择、比例编译和结构化失败。
- `worker/src/ratio-dsl.js`：Ratio r4 的 `canonical_ids`、`liquid_distribution`、唯一性与完整性校验。
- `tools/data/ratio-rules.v1.json`：鲜面 0.85 默认补液和 0.8/0.2 分段规则。
- `tools/data/meal-templates.v2.json`：`braised-noodle-pot` 引用鲜面精确 rule，并绑定 taxonomy r6 / catalog r7。
- `worker/src/meal-template-validator.js`：template r7、taxonomy r6 和 Ratio r4 的版本闭包。
- `worker/src/generated-plan-contract.js`：把预留液体变成受控步骤，并锁入 plan contract。
- `tools/tests/ingredient-taxonomy.test.mjs`：鲜面/挂面独立身份、alias、去重和保留缺口。
- `tools/tests/ratio-dsl.test.mjs`：精确 rule、补液数值、分段、歧义和禁止回退。
- `tools/tests/pantry-planner-v2-selection.test.mjs`：pantry/recommend/quick/忌口的真实规划行为。
- `tools/tests/worker-generate-plan.test.mjs`：鲜面、食材、液体和安全边界的模型越界拒绝。
- `tools/tests/planner-v2-parity.test.mjs`：Worker 与 Python bridge 的 `canonical_id`、ratio 和 liquid facts 一致性。
- `tools/data/pantry-planner-v2-journeys.json`、`tools/run-pantry-planner-v2-journeys.mjs`、`tools/tests/pantry-planner-v2-journeys.test.mjs`：J93–J100 与 100/100 公共门禁。
- `tools/data/regional-menu-mappings.v1.json`、`tools/tests/regional-menu-mappings.test.mjs`：鲜面/干面已分流、预蒸面未覆盖的能力边界。
- `tools/tests/planner-menu-coverage-builder.test.mjs`：北方豆角焖面从 taxonomy gap 恢复为完整食材兼容。
- `tools/generated/planner-menu-coverage.v1.json`、`docs/planner-menu-coverage.md`：确定性覆盖产物。
- `tools/generated/menu-master.v1.json`、`docs/menu-master.md`、`docs/menu-master.csv`：新资产 hash 下的菜单总账。
- `tools/generated/regional-atlas.v2.json`、`docs/china-one-pot-regional-atlas.md`、`docs/china-one-pot-regional-atlas.csv`：四地域映射产物。
- `tools/generated/central-plains-noodle-research.v1.json`、`docs/central-plains-noodle-research.md`：中原面食研究的派生产物。
- `tools/generated/jingjinji-jinmeng-one-pot-research.v1.json`、`docs/jingjinji-jinmeng-one-pot-research.md`：京津冀晋蒙研究的派生产物。
- `tools/generated/shandong-one-pot-research.v1.json`、`docs/shandong-one-pot-research.md`：山东研究的派生产物。
- `CLAUDE.md`、`部署说明.md`、`tools/tests/worker-planner-v2.test.mjs`：版本、模板/菜谱数量和 100/100 门禁事实。

---

### Task 1: 用红灯锁住鲜面身份、Ratio 分流和完整单锅行为

**Files:**

- Modify: `tools/tests/ingredient-taxonomy.test.mjs`
- Modify: `tools/tests/ratio-dsl.test.mjs`
- Modify: `tools/tests/pantry-planner-v2-selection.test.mjs`
- Modify: `tools/tests/meal-template-catalog.test.mjs`

**Interfaces:**

- Consumes: `normalizePlannerItems(items, taxonomy)`、`validateRatioDslCatalog()`、`prepareRatioCatalog()`、`compileRatioPlan()`、`planMeal()`。
- Produces: 能因缺少 `fresh-wheat-noodle`、Ratio r4、精确 rule 和 liquid split 而稳定失败的行为测试。

- [ ] **Step 1: 写 taxonomy r6 与身份失败测试**

把版本断言改为 r6，并加入：

```js
test('fresh wheat noodles and dried noodles keep independent canonical identities', () => {
  const rows = normalizePlannerItems(
    ['鲜小麦面条', '鲜面条', '鲜面', '生鲜面', '面条', '挂面', '干面条', '预蒸面'],
    catalog,
  );
  for (const row of rows.slice(0, 4)) {
    assert.equal(row.canonical_id, 'fresh-wheat-noodle');
    assert.equal(row.canonical, '鲜小麦面条');
    assert.equal(row.category, 'noodle');
  }
  for (const row of rows.slice(4, 7)) {
    assert.equal(row.canonical_id, 'noodle');
    assert.equal(row.category, 'noodle');
  }
  assert.deepEqual(rows.map(row => row.raw),
    ['鲜小麦面条', '鲜面条', '鲜面', '生鲜面', '面条', '挂面', '干面条', '预蒸面']);
  assert.equal(rows[7].recognized, false);
});

test('fresh and dried noodle identities do not deduplicate each other', () => {
  const [fresh, freshAlias, dried] = normalizePlannerItems(
    ['鲜小麦面条', '鲜面条', '挂面'], catalog,
  );
  assert.equal(fresh.duplicate_of, null);
  assert.equal(freshAlias.duplicate_of, '鲜小麦面条');
  assert.equal(dried.duplicate_of, null);
});
```

- [ ] **Step 2: 写 Ratio r4 严格 schema 与编译失败测试**

把版本断言改为 r4，并加入：

```js
test('fresh noodle ratio is canonical-scoped and locks staged liquid', () => {
  const rule = rawCatalog.rules.find(row => row.rule_id === 'braised-fresh-wheat-noodle-liquid-v1');
  assert.deepEqual(rule.when.canonical_ids, ['fresh-wheat-noodle']);
  assert.deepEqual(rule.liquid_distribution, {
    initial_fraction: 0.8,
    reserve_fraction: 0.2,
    reserve_action_code: 'add_reserved_liquid_if_needed',
  });
  const result = compileRatioPlan(rule.rule_id, {
    servings: 2,
    slots: {
      staple: [{ name:'鲜小麦面条', category:'noodle', canonical_id:'fresh-wheat-noodle', attributes:{} }],
      vegetable: [{ name:'豆角', category:'pod_vegetable', canonical_id:'green-beans', attributes:{ moisture_release:'low' } }],
      protein: [{ name:'猪肉末', category:'pork', canonical_id:'ground-pork', attributes:{} }],
    },
  }, catalog);
  assert.equal(result.ok, true);
  assert.deepEqual(result.ingredient_amounts, [
    { name:'豆角', grams:180 },
    { name:'水', grams:170 },
    { name:'鲜小麦面条', grams:200 },
    { name:'猪肉末', grams:160 },
  ]);
  assert.deepEqual(result.liquid_constraints, {
    retained_liquid_grams:170,
    liquid_credit_grams:0,
    rounding_grams:5,
    initial_liquid_grams:135,
    reserve_liquid_grams:35,
    reserve_action_code:'add_reserved_liquid_if_needed',
  });
});

test('ratio validator rejects unknown canonical scope and invalid liquid split', () => {
  const unknown = structuredClone(rawCatalog);
  unknown.rules.find(row => row.rule_id === 'braised-fresh-wheat-noodle-liquid-v1')
    .when.canonical_ids = ['invented-noodle'];
  assert.match(validateRatioDslCatalog(unknown, templates, taxonomy, recipes).join('\n'), /known canonical identities/);

  const split = structuredClone(rawCatalog);
  split.rules.find(row => row.rule_id === 'braised-fresh-wheat-noodle-liquid-v1')
    .liquid_distribution.reserve_fraction = 0.3;
  assert.match(validateRatioDslCatalog(split, templates, taxonomy, recipes).join('\n'), /sum to 1/);
});
```

- [ ] **Step 3: 写 Planner 正反行为失败测试**

在 `tools/tests/pantry-planner-v2-selection.test.mjs` 增加：

```js
test('fresh wheat noodles green beans and ground pork form a complete fresh-noodle braise', () => {
  const result = planMeal(assets, request({ must:['鲜小麦面条','豆角','猪肉末'] }));
  assert.equal(result.status, 'complete');
  assert.equal(result.plan.plan_kind, 'single_pot');
  const pot = result.plan.pots[0];
  assert.equal(pot.template_id, 'braised-noodle-pot');
  assert.deepEqual(new Set(pot.planned_must_use.map(item => item.raw)),
    new Set(['鲜小麦面条','豆角','猪肉末']));
  assert.deepEqual(result.plan.unplanned_must_use, []);
  assert.equal(pot.coverage_ratio, 1);
  assert.equal(pot.ratio_trace[0].rule_id, 'braised-fresh-wheat-noodle-liquid-v1');
  assert.equal(pot.liquid_constraints.retained_liquid_grams, 170);
  assert.equal(pot.liquid_constraints.reserve_liquid_grams, 35);
  assert.ok(pot.safety_endpoints.some(row => row.endpoint_code === 'bean_fully_cooked'));
  assert.ok(pot.safety_endpoints.some(row => row.endpoint_code === 'pork_fully_cooked'));
  assert.ok(pot.safety_endpoints.some(row => row.endpoint_code === 'noodle_tender'));
});

test('fresh noodles cannot fall through to dried noodle ratio and presteamed noodles stay unplanned', () => {
  const withoutExact = structuredClone(assets);
  withoutExact.ratios.rules = withoutExact.ratios.rules
    .filter(row => row.rule_id !== 'braised-fresh-wheat-noodle-liquid-v1');
  withoutExact.templates.templates.find(row => row.template_id === 'braised-noodle-pot')
    .ratio_constraints = ['braised-noodle-liquid-v1'];
  const fresh = planMeal(withoutExact, request({ must:['鲜小麦面条','豆角'] }));
  assert.notEqual(fresh.status, 'complete');

  const presteamed = planMeal(assets, request({ must:['预蒸面','豆角','猪肉末'] }));
  assert.notEqual(presteamed.status, 'complete');
  assert.equal(presteamed.generation_allowed, false);
  assert.equal(presteamed.normalized_items.find(item => item.raw === '预蒸面').recognized, false);
});
```

- [ ] **Step 4: 同步 template r7 静态失败断言**

```js
assert.equal(templateCatalog.template_catalog_version, 'templates-v2-20260727-r7');
assert.equal(templateCatalog.ingredient_taxonomy_version, 'taxonomy-v1-20260727-r6');
const braised = templateCatalog.templates.find(row => row.template_id === 'braised-noodle-pot');
assert.deepEqual(new Set(braised.ratio_constraints), new Set([
  'braised-noodle-liquid-v1',
  'braised-fresh-wheat-noodle-liquid-v1',
]));
```

- [ ] **Step 5: 运行聚焦测试，确认红灯来自缺失能力**

Run:

```sh
node --test \
  tools/tests/ingredient-taxonomy.test.mjs \
  tools/tests/ratio-dsl.test.mjs \
  tools/tests/meal-template-catalog.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs
```

Expected: FAIL，明确出现 r5/r3/r6 旧版本、鲜面没有独立 identity、鲜面 rule 不存在或三项计划非 complete。语法、fixture 或超时错误不算有效红灯。

- [ ] **Step 6: 提交红灯测试**

```sh
git add tools/tests/ingredient-taxonomy.test.mjs tools/tests/ratio-dsl.test.mjs \
  tools/tests/meal-template-catalog.test.mjs tools/tests/pantry-planner-v2-selection.test.mjs
git commit -m "test: define fresh noodle planner capability"
```

---

### Task 2: 建立鲜面 identity 并让 canonical_id 贯穿 Planner

**Files:**

- Modify: `tools/data/ingredient-taxonomy.v1.json`
- Modify: `worker/src/ingredient-taxonomy-validator.js`
- Modify: `worker/src/planner-v2.js`
- Modify: `tools/tests/planner-v2-parity.test.mjs`

**Interfaces:**

- Consumes: Task 1 的 taxonomy 红灯。
- Produces: `normalizePlannerItems()` 每个识别项都携带 `canonical_id:string` 和受控 `ratio_rule_policy`；未知项为 `canonical_id:null`；Worker/Python bridge 输出一致。

- [ ] **Step 1: 写入 `fresh-wheat-noodle`，收窄原 `noodle`**

在 taxonomy 中新增规格里的完整 `fresh-wheat-noodle` 对象。把原 `noodle.aliases` 改为：

```json
"aliases":["挂面","干面条"]
```

鲜面对象必须包含：

```json
"ratio_rule_policy":"canonical_required"
```

在 `worker/src/ingredient-taxonomy-validator.js` 增加有限词表：

```js
const RATIO_RULE_POLICIES = new Set(['category_fallback','canonical_required']);
```

字段缺省按 `category_fallback`；字段存在时必须命中有限词表。当前 catalog 中只有 `fresh-wheat-noodle` 可以声明 `canonical_required`，用测试锁定数量为 1。

把 taxonomy 顶层版本改为：

```json
"taxonomy_version":"taxonomy-v1-20260727-r6"
```

同步 `worker/src/ingredient-taxonomy-validator.js` 的固定版本为 r6。只把设计中已使用的 `braise`、`steam` 保留在现有受控方法集合内，不开放自由文本属性。

- [ ] **Step 2: 在归一化结果中加入 canonical_id**

修改 `normalizePlannerItems()` 的未知分支和识别分支：

```js
// unknown
canonical_id: null,
ratio_rule_policy: null,

// recognized
canonical_id: item.canonical_id,
canonical: item.canonical_name || item.display_name,
ratio_rule_policy: item.ratio_rule_policy || 'category_fallback',
```

修改 `basicSlotChoices()`：

```js
canonical_id: item.canonical_id,
ratio_rule_policy: item.ratio_rule_policy || 'category_fallback',
```

修改 `identityIngredient()` 与 plan identity payload：

```js
canonical_id: identityText(item.canonical_id),
ratio_rule_policy: identityText(item.ratio_rule_policy),
```

这样 catalog 版本变化和鲜面/挂面 identity 都进入规范化 plan hash；不得仅在响应显示字段里补 canonical_id 而让 plan ID 继续碰撞。

- [ ] **Step 3: 把 canonical_id 传入 Ratio context**

修改 `ratioContextFor()`：

```js
items.map(item => ({
  name: item.display_name,
  category: item.category,
  canonical_id: item.canonical_id,
  ratio_rule_policy: item.ratio_rule_policy,
  attributes: {
    cook_speed: item.cook_speed,
    moisture_release: item.moisture_release,
    texture_behavior: item.texture_behavior,
    texture_failure_modes: [...(item.texture_failure_modes || [])],
    cooking_risk: item.cooking_risk,
  },
}))
```

修改 `ratioSlots()`，只接受 taxonomy 中存在的 canonical_id，并保留受控 `ratio_rule_policy`；缺失或伪造 identity 时返回 `ratio_context_identity_mismatch`，不能只凭 name/category 编译精确规则。

- [ ] **Step 4: 增加 Worker/Python parity 测试**

```js
test('fresh noodle identity is identical across Worker and Python bridge', async () => {
  const body = await parityCase(
    'fresh noodle braise',
    request({ must:['鲜小麦面条','豆角','猪肉末'] }),
    'complete',
  );
  const noodle = body.normalized_items.find(item => item.raw === '鲜小麦面条');
  assert.deepEqual(
    [noodle.canonical_id, noodle.canonical, noodle.category],
    ['fresh-wheat-noodle', '鲜小麦面条', 'noodle'],
  );
});
```

- [ ] **Step 5: 运行 identity 与 parity 测试**

Run:

```sh
node --test tools/tests/ingredient-taxonomy.test.mjs tools/tests/planner-v2-parity.test.mjs
python3 -m py_compile ai_proxy.py
```

Expected: taxonomy 测试 PASS；parity 可以继续因 Ratio rule 尚未实现而 FAIL，但失败中不得再出现鲜面未识别或 canonical_id 漂移。

- [ ] **Step 6: 提交 identity 层**

```sh
git add tools/data/ingredient-taxonomy.v1.json worker/src/ingredient-taxonomy-validator.js \
  worker/src/planner-v2.js tools/tests/planner-v2-parity.test.mjs
git commit -m "feat: separate fresh and dried noodle identities"
```

---

### Task 3: 实现 canonical-aware Ratio DSL、分段补液和生成锁

**Files:**

- Modify: `worker/src/ratio-dsl.js`
- Modify: `worker/src/planner-v2.js`
- Modify: `tools/data/ratio-rules.v1.json`
- Modify: `tools/data/meal-templates.v2.json`
- Modify: `worker/src/meal-template-validator.js`
- Modify: `worker/src/generated-plan-contract.js`
- Modify: `tools/tests/ratio-dsl.test.mjs`
- Modify: `tools/tests/worker-generate-plan.test.mjs`

**Interfaces:**

- Consumes: Task 2 的 `canonical_id`。
- Produces: `selectRatioRule(template, assignment, catalog)`、`ratio_rule_policy` 强制执行、Ratio r4、template r7、鲜面补液与预留液体 locked contract。

- [ ] **Step 1: 扩展 Ratio schema validator**

在 `worker/src/ratio-dsl.js`：

```js
const LIQUID_ACTIONS = new Set(['add_reserved_liquid_if_needed']);

function validateCanonicalScope(value, taxonomyIds, label, errors) {
  if (value == null) return;
  if (!Array.isArray(value) || value.length === 0
      || value.some(id => typeof id !== 'string' || !taxonomyIds.has(id))
      || new Set(value).size !== value.length) {
    errors.push(`${label} must contain unique known canonical identities`);
  }
}

function validateLiquidDistribution(value, label, errors) {
  if (value == null) return;
  if (!exactObject(value,
      new Set(['initial_fraction','reserve_fraction','reserve_action_code']), label, errors)) return;
  const { initial_fraction:initial, reserve_fraction:reserve } = value;
  if (!number(initial) || !number(reserve) || initial > 1 || reserve > 1
      || Math.abs(initial + reserve - 1) > Number.EPSILON * 8) {
    errors.push(`${label} fractions must be between 0 and 1 and sum to 1`);
  }
  if (!LIQUID_ACTIONS.has(value.reserve_action_code)) {
    errors.push(`${label}.reserve_action_code is invalid`);
  }
}
```

允许 rule keys 增加 `liquid_distribution`，允许 `when` keys 增加 `canonical_ids`，并校验所有 canonical ID 的 category 与 `when.category` 相同。固定版本改为 r4。

- [ ] **Step 2: 实现唯一、确定的 Ratio rule 选择**

在 `worker/src/planner-v2.js` 增加并导出：

```js
export function selectRatioRule(template, assignment, ratioCatalog) {
  const candidates = (ratioCatalog?.rules || []).filter(rule => {
    if (rule.when?.template_id !== template.template_id
        || !template.ratio_constraints?.includes(rule.rule_id)) return false;
    const items = (assignment[rule.when.slot_id] || [])
      .filter(item => item.category === rule.when.category);
    if (!items.length) return false;
    if (!rule.when.canonical_ids?.length) return true;
    return items.every(item => rule.when.canonical_ids.includes(item.canonical_id));
  });
  const exact = candidates.filter(rule => rule.when.canonical_ids?.length);
  const matchingItems = candidates.flatMap(rule => assignment[rule.when.slot_id] || []);
  if (!exact.length && matchingItems.some(item => item.ratio_rule_policy === 'canonical_required')) {
    return { ok:false, code:'ratio_rule_not_found', rule:null };
  }
  const best = exact.length ? exact : candidates.filter(rule => !rule.when.canonical_ids?.length);
  if (best.length === 0) return { ok:false, code:'ratio_rule_not_found', rule:null };
  if (best.length > 1) return { ok:false, code:'ratio_rule_ambiguous', rule:null };
  return { ok:true, code:'ratio_rule_selected', rule:best[0] };
}
```

用它替换 `buildTemplateCandidate()` 中当前 `.find(...)`。错误映射：

```js
hardFailure ||= rejection('would_break_ratio', '这组槽位没有唯一可执行的份量比例。', {
  ratio_code: selected.code,
});
```

不得按数组顺序选第一条。

- [ ] **Step 3: 编译分段补液**

`ratioSlots()` 保留 `canonical_id`。`compileRatioPlan()` 在总液体完成后计算：

```js
const distribution = rule.liquid_distribution;
const initialLiquidGrams = distribution
  ? roundRatioGrams(retainedLiquidGrams * distribution.initial_fraction, nearest)
  : null;
const reserveLiquidGrams = distribution
  ? retainedLiquidGrams - initialLiquidGrams
  : null;

liquid_constraints: retainedLiquidGrams === 0 ? {} : {
  retained_liquid_grams: retainedLiquidGrams,
  liquid_credit_grams: roundRatioGrams(liquidCredit, nearest),
  rounding_grams: nearest,
  ...(distribution ? {
    initial_liquid_grams: initialLiquidGrams,
    reserve_liquid_grams: reserveLiquidGrams,
    reserve_action_code: distribution.reserve_action_code,
  } : {}),
},
```

在执行 operations 前增加 identity guard：

```js
const scopedItems = slots.get(rule.when.slot_id) || [];
if (rule.when.canonical_ids?.length
    && scopedItems.some(item => !rule.when.canonical_ids.includes(item.canonical_id))) {
  return ratioFailure('ratio_context_identity_mismatch', '食材身份与这条份量规则不匹配。');
}
```

编译成功前只给现有第一条 trace 增加 `rule_id`，不插入新 operator，避免破坏所有既有 operator 顺序契约：

```js
if (trace[0]) trace[0] = { ...trace[0], rule_id:rule.rule_id };
```

这样 journey 和覆盖审计可以证明实际选择，而不是根据水量猜测。

- [ ] **Step 4: 写入鲜面 rule，并收窄原 rule evidence**

`braised-noodle-pot.ratio_constraints` 改为：

```json
["braised-noodle-liquid-v1","braised-fresh-wheat-noodle-liquid-v1"]
```

原 `braised-noodle-liquid-v1` 保留 category 通用干面分支，evidence 只保留 `cabbage-potato-chicken-leg-braised-noodles`。新增：

```json
{
  "rule_id":"braised-fresh-wheat-noodle-liquid-v1",
  "evidence_recipe_ids":["north-china-green-bean-braised-noodles"],
  "when":{"template_id":"braised-noodle-pot","slot_id":"staple","category":"noodle","canonical_ids":["fresh-wheat-noodle"]},
  "operations":[
    {"operator":"per_serving","target":{"slot_id":"staple"},"grams":{"min":85,"default":100,"max":110}},
    {"operator":"per_serving","target":{"slot_id":"vegetable"},"grams":{"min":70,"default":90,"max":120}},
    {"operator":"per_serving","target":{"slot_id":"protein"},"grams":{"min":60,"default":80,"max":100}},
    {"operator":"per_serving","target":{"slot_id":"mushroom"},"grams":{"min":60,"default":80,"max":100}},
    {"operator":"bounded_sum","target":{"attribute":"moisture_release","value":"high"},"grams_per_serving":{"min":70,"default":90,"max":120},"liquid_credit_grams_per_serving":{"min":10,"default":15,"max":20}},
    {"operator":"ratio","target":{"name":"水","category":"liquid"},"numerator":{"resource":"retained_liquid_grams"},"denominator":{"slot_id":"staple","measure":"grams"},"min":0.7,"default":0.85,"max":1.0}
  ],
  "liquid_distribution":{"initial_fraction":0.8,"reserve_fraction":0.2,"reserve_action_code":"add_reserved_liquid_if_needed"},
  "rounding":{"grams_to_nearest":5},
  "example_context":{"slot_name":"鲜小麦面条"}
}
```

同步版本：Ratio r4、template r7、taxonomy binding r6，以及两个 validator 的固定字符串。

- [ ] **Step 5: 把预留液体锁进生成步骤**

在 `ACTION_TEXT_TEMPLATES` 增加：

```js
add_reserved_liquid_if_needed: [
  '检查锅底；只有出现偏干迹象时，才加入计划预留的{grams}克{items}',
  '如锅底水分不足，仅补入已锁定的{grams}克{items}，不得再额外加水',
],
```

`buildLockedMeal()` 在 `add_staple_and_liquid` 后动态插入一个只引用 liquid ingredient 的 phase；`controlledStepTexts()` 只对该 action 用 `phase.locked_liquid_grams` 替换 `{grams}`。如果 `reserve_liquid_grams<=0`，不插入该 phase。

在 `tools/tests/worker-generate-plan.test.mjs` 增加：

```js
test('fresh noodle locked plan preserves identity and exact reserved liquid', async () => {
  const journey = await preparedJourney(plannerRequest({ must:['鲜小麦面条','豆角','猪肉末'] }));
  const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
  const meal = locked.meals[0];
  assert.equal(meal.liquid_constraints.reserve_liquid_grams, 35);
  const reserveIndex = meal.cooking_order.findIndex(row => row.action_code === 'add_reserved_liquid_if_needed');
  const reserve = meal.cooking_order[reserveIndex];
  assert.equal(reserve.locked_liquid_grams, 35);
  assert.ok(meal.generation_text_contract.steps
    [reserveIndex].allowed_texts.every(text => /35克/.test(text)));
});
```

再对合法输出分别追加“换成挂面”“再加100克水”“省略豆角”并断言 `validateGeneratedPlan(...).ok === false`。

- [ ] **Step 6: 运行聚焦测试并提交 Ratio/生成实现**

Run:

```sh
node --test \
  tools/tests/ratio-dsl.test.mjs \
  tools/tests/meal-template-catalog.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs \
  tools/tests/worker-generate-plan.test.mjs \
  tools/tests/planner-v2-parity.test.mjs
python3 -m py_compile ai_proxy.py
```

Expected: PASS；两人份默认鲜面 200g、水 170g、初始 135g、预留 35g；鲜面不会命中干面规则；模型越界全部被拒绝。

```sh
git add worker/src/ratio-dsl.js worker/src/planner-v2.js worker/src/generated-plan-contract.js \
  worker/src/meal-template-validator.js tools/data/ratio-rules.v1.json \
  tools/data/meal-templates.v2.json tools/tests/ratio-dsl.test.mjs \
  tools/tests/worker-generate-plan.test.mjs
git commit -m "feat: add canonical fresh noodle ratio planning"
```

---

### Task 4: 把鲜面能力写入 100 条公共旅程和地域覆盖账本

**Files:**

- Modify: `tools/data/pantry-planner-v2-journeys.json`
- Modify: `tools/run-pantry-planner-v2-journeys.mjs`
- Modify: `tools/tests/pantry-planner-v2-journeys.test.mjs`
- Modify: `tools/data/regional-menu-mappings.v1.json`
- Modify: `tools/tests/regional-menu-mappings.test.mjs`
- Modify: `tools/tests/planner-menu-coverage-builder.test.mjs`
- Regenerate: `tools/generated/planner-menu-coverage.v1.json`
- Regenerate: `docs/planner-menu-coverage.md`
- Regenerate: `tools/generated/menu-master.v1.json`
- Regenerate: `docs/menu-master.md`
- Regenerate: `docs/menu-master.csv`
- Regenerate: `tools/generated/regional-atlas.v2.json`
- Regenerate: `docs/china-one-pot-regional-atlas.md`
- Regenerate: `docs/china-one-pot-regional-atlas.csv`
- Regenerate: `tools/generated/central-plains-noodle-research.v1.json`
- Regenerate: `docs/central-plains-noodle-research.md`
- Regenerate: `tools/generated/jingjinji-jinmeng-one-pot-research.v1.json`
- Regenerate: `docs/jingjinji-jinmeng-one-pot-research.md`
- Regenerate: `tools/generated/shandong-one-pot-research.v1.json`
- Regenerate: `docs/shandong-one-pot-research.md`

**Interfaces:**

- Consumes: Task 3 的确定性 plan、ratio trace 和版本闭包。
- Produces: J93–J100、100/100 门禁、四地域同一 production recipe 的真实覆盖恢复和不扩张地域声明。

- [ ] **Step 1: 先把 corpus 断言扩为 100 并观察红灯**

```js
test('corpus maps spec journeys 1-100 exactly once', () => {
  assert.equal(corpus.journeys.length, 100);
  assert.deepEqual(corpus.journeys.map(entry => entry.spec_number),
    Array.from({ length:100 }, (_, index) => index + 1));
  assert.equal(new Set(corpus.journeys.map(entry => entry.id)).size, 100);
  assert.deepEqual(
    Object.fromEntries(Object.entries(Object.groupBy(corpus.journeys, entry => entry.category))
      .map(([key, value]) => [key, value.length])),
    { taxonomy_shape:8, recommend:3, pantry_coverage:8, decision:5,
      intent_swap:7, model_boundary:7, version_legacy:6, regional_capability:56 },
  );
});
```

Run: `node --test tools/tests/pantry-planner-v2-journeys.test.mjs`

Expected: FAIL，实际仍为 92。

- [ ] **Step 2: 增加 J93–J100**

把以下八条完整记录追加到 `journeys`；不得省略任何成本或前端字段：

```json
[
{"id":"J93","spec_number":93,"title":"鲜小麦面条豆角猪肉末完整鲜面焖锅","category":"regional_capability","request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"pantry","intent":"normal","servings":2,"must_use":["鲜小麦面条","豆角","猪肉末"],"prefer_use":[],"dislikes":[],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},"expect":{"status":["complete"],"complete_coverage":1,"submitted_must_count":3,"required_template_ids":["braised-noodle-pot"],"required_ratio_rule_ids":["braised-fresh-wheat-noodle-liquid-v1"],"ratio_trace_required":true},"plan_deepseek_max":0,"generate_deepseek_max":0,"frontend_required":false,"model_mutation":null},
{"id":"J94","spec_number":94,"title":"鲜面条别名进入同一鲜面规则","category":"regional_capability","request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"pantry","intent":"normal","servings":2,"must_use":["鲜面条","豆角","猪肉末"],"prefer_use":[],"dislikes":[],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},"expect":{"status":["complete"],"complete_coverage":1,"normalized":{"raw":"鲜面条","canonical":"鲜小麦面条","canonical_id":"fresh-wheat-noodle"},"required_template_ids":["braised-noodle-pot"],"required_ratio_rule_ids":["braised-fresh-wheat-noodle-liquid-v1"],"ratio_trace_required":true},"plan_deepseek_max":0,"generate_deepseek_max":0,"frontend_required":false,"model_mutation":null},
{"id":"J95","spec_number":95,"title":"鲜面豆角老豆腐完整覆盖","category":"regional_capability","request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"pantry","intent":"normal","servings":2,"must_use":["鲜面","豆角","老豆腐"],"prefer_use":[],"dislikes":[],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},"expect":{"status":["complete"],"complete_coverage":1,"required_template_ids":["braised-noodle-pot"],"required_ratio_rule_ids":["braised-fresh-wheat-noodle-liquid-v1"],"ratio_trace_required":true},"plan_deepseek_max":0,"generate_deepseek_max":0,"frontend_required":false,"model_mutation":null},
{"id":"J96","spec_number":96,"title":"预蒸面保持未识别并暂停生成","category":"regional_capability","request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"pantry","intent":"normal","servings":2,"must_use":["预蒸面","豆角","猪肉末"],"prefer_use":[],"dislikes":[],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},"expect":{"status":["needs_user_decision","no_valid_plan"],"complete_forbidden":true,"generation_allowed":false,"normalized":{"raw":"预蒸面","recognized":false},"required_unplanned_raw":["预蒸面"]},"plan_deepseek_max":0,"generate_deepseek_max":0,"frontend_required":false,"model_mutation":null},
{"id":"J97","spec_number":97,"title":"quick不选择四十分钟鲜面焖锅","category":"regional_capability","request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"recommend","intent":"quick","servings":2,"must_use":[],"prefer_use":["鲜小麦面条","豆角","猪肉末"],"dislikes":[],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},"expect":{"status":["ready","no_valid_plan"],"excluded_template_ids":["braised-noodle-pot"],"max_minutes_per_pot":30},"plan_deepseek_max":0,"generate_deepseek_max":0,"frontend_required":false,"model_mutation":null},
{"id":"J98","spec_number":98,"title":"面条忌口拦截鲜面焖锅","category":"regional_capability","request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"pantry","intent":"normal","servings":2,"must_use":["鲜小麦面条","豆角","猪肉末"],"prefer_use":[],"dislikes":["面条"],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},"expect":{"status":["needs_user_decision","no_valid_plan"],"complete_forbidden":true,"generation_allowed":false,"required_unplanned_raw":["鲜小麦面条"],"reason_codes":["allergen_conflict"]},"plan_deepseek_max":0,"generate_deepseek_max":0,"frontend_required":false,"model_mutation":null},
{"id":"J99","spec_number":99,"title":"recommend选择合理鲜面组合并解释未使用牛腩","category":"regional_capability","request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"recommend","intent":"normal","servings":2,"must_use":[],"prefer_use":["鲜小麦面条","豆角","猪肉末","牛腩"],"dislikes":[],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},"expect":{"status":["ready"],"required_template_ids":["braised-noodle-pot"],"required_ratio_rule_ids":["braised-fresh-wheat-noodle-liquid-v1"],"planned_prefer_min":3,"unused_reason_required":true},"plan_deepseek_max":0,"generate_deepseek_max":0,"frontend_required":false,"model_mutation":null},
{"id":"J100","spec_number":100,"title":"鲜面豆角猪肉菌菇四项保持单锅边界","category":"regional_capability","request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"pantry","intent":"normal","servings":2,"must_use":["鲜小麦面条","豆角","猪肉末","鲜香菇"],"prefer_use":[],"dislikes":[],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},"expect":{"status":["complete"],"complete_coverage":1,"submitted_must_count":4,"required_template_ids":["braised-noodle-pot"],"required_ratio_rule_ids":["braised-fresh-wheat-noodle-liquid-v1"],"ratio_trace_required":true},"plan_deepseek_max":0,"generate_deepseek_max":0,"frontend_required":false,"model_mutation":null}
]
```

- [ ] **Step 3: 给 runner 增加真实 Ratio rule 断言**

把 `required_ratio_rule_ids` 加入 `HANDLED_EXPECTATION_KEYS`，并实现：

```js
if (entry.expect.required_ratio_rule_ids) {
  const selected = new Set((body.plan?.pots || []).flatMap(pot =>
    (pot.ratio_trace || []).map(row => row.rule_id).filter(Boolean)));
  for (const id of entry.expect.required_ratio_rule_ids) {
    assert.ok(selected.has(id), `${entry.id} missing ratio rule ${id}`);
  }
}
```

更新严格长度、连续编号和稳定输出为：

```js
console.log('100/100 planner v2 journeys passed');
```

- [ ] **Step 4: 更新能力账本与覆盖测试**

`noodle-braise`：

```json
"covered_staple_states":["dry_raw_noodle","fresh_raw_noodle"],
"uncovered_staple_states":["presteamed_noodle"],
"coverage_boundary_codes":["fresh_dry_ratio_split","presteamed_noodle_uncovered"],
"required_ratio_rule_ids":["braised-noodle-liquid-v1","braised-fresh-wheat-noodle-liquid-v1"],
"resolved_ratio_rule_ids":["braised-noodle-liquid-v1","braised-fresh-wheat-noodle-liquid-v1"],
"taxonomy_item_ids":["noodle","fresh-wheat-noodle","green-beans","potato","napa-cabbage","chicken-generic","pork-generic"]
```

同步 validator 的有限词表，不允许自由文本 boundary code。覆盖测试改为：

```js
const noodles = byId(report, 'north-china-green-bean-braised-noodles');
assert.equal(noodles.audit_status, 'full_single_pot_ingredient_compatible');
assert.deepEqual(noodles.unclassified_core_items, []);
assert.equal(noodles.raw_core_scenario.end_to_end_core_coverage_ratio, 1);
assert.equal(noodles.raw_core_scenario.plan_kind, 'single_pot');
assert.ok(noodles.raw_core_scenario.selected_template_ids.includes('braised-noodle-pot'));
```

地域映射继续精确为 `jingjinji`、`jinmeng`、`shandong`、`central_plains`，`province_codes:[]`，不得增加省份独占声明。

- [ ] **Step 5: 重建权威产物并跑聚焦门禁**

只执行项目已有 builder，不手工编辑 generated JSON/Markdown/CSV：

```sh
node tools/build-planner-menu-coverage.mjs --write
node tools/build-planner-menu-coverage.mjs --check
node tools/build-menu-master.mjs --write
node tools/build-menu-master.mjs --check
node tools/build-regional-atlas.mjs --write
node tools/build-regional-atlas.mjs --check
node tools/build-central-plains-noodle-research.mjs --write
node tools/build-central-plains-noodle-research.mjs --check
node tools/build-jingjinji-jinmeng-one-pot-research.mjs --write
node tools/build-jingjinji-jinmeng-one-pot-research.mjs --check
node tools/build-shandong-one-pot-research.mjs --write
node tools/build-shandong-one-pot-research.mjs --check
node --test \
  tools/tests/pantry-planner-v2-journeys.test.mjs \
  tools/tests/regional-menu-mappings.test.mjs \
  tools/tests/planner-menu-coverage-builder.test.mjs \
  tools/tests/planner-menu-coverage-artifacts.test.mjs \
  tools/tests/menu-master-artifacts.test.mjs \
  tools/tests/regional-atlas-artifacts.test.mjs \
  tools/tests/central-plains-noodle-research-artifacts.test.mjs \
  tools/tests/jingjinji-jinmeng-one-pot-research-artifacts.test.mjs \
  tools/tests/shandong-one-pot-research-artifacts.test.mjs
node tools/run-pantry-planner-v2-journeys.mjs
```

Expected: `regional_capability=56`、`100/100 planner v2 journeys passed`；菜谱 72、模板 16；北方豆角焖面完整食材兼容；预蒸面仍未覆盖。

- [ ] **Step 6: 提交旅程和覆盖产物**

```sh
git add tools/data/pantry-planner-v2-journeys.json tools/run-pantry-planner-v2-journeys.mjs \
  tools/tests/pantry-planner-v2-journeys.test.mjs tools/data/regional-menu-mappings.v1.json \
  tools/tests/regional-menu-mappings.test.mjs tools/tests/planner-menu-coverage-builder.test.mjs \
  tools/generated/planner-menu-coverage.v1.json docs/planner-menu-coverage.md \
  tools/generated/menu-master.v1.json docs/menu-master.md docs/menu-master.csv \
  tools/generated/regional-atlas.v2.json docs/china-one-pot-regional-atlas.md \
  docs/china-one-pot-regional-atlas.csv \
  tools/generated/central-plains-noodle-research.v1.json docs/central-plains-noodle-research.md \
  tools/generated/jingjinji-jinmeng-one-pot-research.v1.json docs/jingjinji-jinmeng-one-pot-research.md \
  tools/generated/shandong-one-pot-research.v1.json docs/shandong-one-pot-research.md
git commit -m "test: cover fresh noodle regional journeys"
```

提交前运行 `git diff --cached --name-only`；输出只能包含本 Task 的明确文件，不得包含其他地域研究、recipe 数据、`dist/` 或用户无关改动。

---

### Task 5: 同步版本文档并完成全量验证

**Files:**

- Modify: `CLAUDE.md`
- Modify: `部署说明.md`
- Modify: `tools/tests/worker-planner-v2.test.mjs`

**Interfaces:**

- Consumes: Task 1–4 的 r6/r4/r7 资产和 100 条旅程。
- Produces: Draft PR #1 中可复现、未部署的完整变更集。

- [ ] **Step 1: 写版本与数量失败测试**

在现有 Worker health/asset 测试中断言：

```js
assert.equal(body.ingredientTaxonomyVersion, 'taxonomy-v1-20260727-r6');
assert.equal(body.ratioCatalogVersion, 'ratio-rules-v1-20260727-r4');
assert.equal(body.templateCatalogVersion, 'templates-v2-20260727-r7');
assert.equal(body.baseRecipes, 72);
assert.equal(body.activeTemplates, 10);
assert.equal(body.plannedTemplates, 6);
```

先运行 `node --test tools/tests/worker-planner-v2.test.mjs`，确认旧文档/fixture 断言产生红灯，再同步事实。

- [ ] **Step 2: 同步长期文档事实**

`CLAUDE.md` 和 `部署说明.md` 只更新：

- taxonomy r6；
- Ratio r4；
- template r7；
- 100/100 journeys；
- 10 active + 6 planned、72 recipes 保持不变；
- Pantry Planner V2 仍只在 Draft PR，未部署、未做真实 DeepSeek live 验证。

不得改写 Phase A 发布授权或 production 命令边界。

- [ ] **Step 3: 运行全量 Node 测试**

Run:

```sh
node --test tools/tests/*.test.mjs
```

Expected: exit 0，0 failures。记录实际 test 数，不根据旧会话猜数字。

- [ ] **Step 4: 运行所有项目门禁**

Run:

```sh
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
python3 -m py_compile ai_proxy.py
node tools/build-dist.mjs --out-dir /tmp/yiguochu-fresh-noodle-dist --build-id "fresh-noodle-review"
node --test tools/tests/build-dist.test.mjs
```

Expected:

- 菜谱、候选、晋升、taxonomy、template、Ratio、evidence 检查全部通过；
- `100/100 planner v2 journeys passed`；
- Python 语法通过；
- dist 由统一脚本生成；
- 构建一致性测试全部通过；
- 不调用真实 DeepSeek。

- [ ] **Step 5: 检查范围与工作树**

Run:

```sh
git diff --check
git status --short
git diff --stat HEAD^..
node - <<'NODE'
const fs = require('fs');
const recipes = JSON.parse(fs.readFileSync('tools/data/recipe-library.json','utf8')).recipes;
const templates = JSON.parse(fs.readFileSync('tools/data/meal-templates.v2.json','utf8')).templates;
console.log(JSON.stringify({
  recipes:recipes.length,
  approved:recipes.filter(x => x.status === 'approved').length,
  autoApproved:recipes.filter(x => x.status === 'auto_approved').length,
  templates:templates.length,
  active:templates.filter(x => x.activation_status === 'active').length,
  planned:templates.filter(x => x.activation_status === 'planned').length,
}));
NODE
```

Expected: `72/12/60` recipes，`16/10/6` templates；没有新 recipe/template，没有部署产物或 `.wrangler` 文件。

- [ ] **Step 6: 提交最终版本同步**

```sh
git add CLAUDE.md 部署说明.md tools/tests/worker-planner-v2.test.mjs
git commit -m "docs: align fresh noodle planner baseline"
```

- [ ] **Step 7: 只更新 Draft PR #1**

确认 PR 仍为 Draft，推送当前 `codex/targeted-recipe-expansion` 分支；不调用 Wrangler、不合并 PR。PR 描述追加：

- 鲜面/干面 identity 分离；
- 鲜面 0.70–1.00、默认 0.85 的 Preview 校准范围；
- 80/20 分段补液；
- 北方豆角焖面四地域覆盖恢复；
- 100/100 journey 和全量门禁结果；
- 明示未部署、未 live DeepSeek、未人工厨房批准。

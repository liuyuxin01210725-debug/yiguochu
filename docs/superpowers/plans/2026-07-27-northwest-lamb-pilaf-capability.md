# Northwest Lamb Pilaf Capability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不新增 recipe 或 template 的前提下，让明确的羊腿肉身份进入现有咸香生米饭锅，并可靠生成羊腿肉、洋葱、胡萝卜、大米 4/4 单锅计划。

**Architecture:** `ingredient-taxonomy.v1.json` 是羊腿肉身份、部位和生肉风险的唯一机器真源；`savory-mixed-rice-pot` 只接纳 `lamb/leg`，继续复用现有 `savory-mixed-rice-liquid-v1`。Planner 决定槽位、克数和安全端点，DeepSeek 只从锁定短语中表达计划；三端忌口表、Worker/Python parity、公共旅程与地域覆盖账本共同锁住边界。

**Tech Stack:** JSON 机器资产、Cloudflare Pages Functions ES modules、Node.js 内置 `node:test`、Python 3 本地 bridge、确定性 Markdown/JSON/CSV 构建器。

## Global Constraints

- [ ] 以 `docs/superpowers/specs/2026-07-27-northwest-lamb-pilaf-capability-design.md` 为唯一产品契约。
- [ ] `tools/data/recipe-library.json` 保持 72 道：12 `approved` + 60 `auto_approved`；不得新增、删除或修改 recipe。
- [ ] Template catalog 保持 16 个：10 active + 6 planned；不得新增模板或改变激活状态。
- [ ] 目标版本固定为 `taxonomy-v1-20260727-r7` 与 `templates-v2-20260727-r8`；Ratio catalog 保持 `ratio-rules-v1-20260727-r4`。
- [ ] 只识别“羊腿肉”“去骨羊腿肉”；泛称“羊肉”及羊肩肉、羊排、羊腩、羊肉末继续不得规划。
- [ ] `savory-mixed-rice-pot` 的羊肉槽只允许 category `lamb` + shape `leg`。
- [ ] 羊腿肉必须携带 `raw_lamb` 与 `lamb_fully_cooked`；模型不得换部位、加葡萄干或省略熟制事实。
- [ ] `/plan-meal` 保持 0 次 DeepSeek；`/generate-plan` 每次最多 1 次且失败不自动重试。
- [ ] 每个生产行为修改必须先写失败测试、观察正确红灯，再写最小实现。
- [ ] 只更新 Draft PR #1；不部署 Preview 或 production，不合并 PR。

---

## File Responsibility Map

- `tools/data/ingredient-taxonomy.v1.json`：羊腿肉身份、别名、leg 部位、raw_lamb 风险的唯一机器数据。
- `worker/src/ingredient-taxonomy-validator.js`：taxonomy r7、lamb 类别、风险、端点和 slot code 有限词表。
- `tools/data/meal-templates.v2.json`：现有咸香饭锅的 lamb/leg 接纳、安全端点和 evidence 绑定。
- `worker/src/meal-template-validator.js`：template r8、taxonomy r7 与 lamb 端点一致性。
- `worker/src/planner-v2.js`：raw_lamb 参与安全约束；不改变选择、多锅和 Ratio 算法。
- `index.html`、`worker/src/allergen-semantics.js`、`ai_proxy.py`：三端相同的羊肉忌口组。
- `worker/src/generated-plan-contract.js`：羊肉熟制受控短语与证据校验。
- `tools/tests/ingredient-taxonomy.test.mjs`、`meal-template-catalog.test.mjs`、`pantry-planner-v2-selection.test.mjs`：身份、模板、4/4 规划及反例。
- `tools/tests/allergen-matching.test.mjs`、`allergen-groups-parity.test.mjs`：羊肉忌口行为与三端 parity。
- `tools/tests/worker-generate-plan.test.mjs`：锁定食材、部位、新增主料和熟制证据合同。
- `tools/tests/planner-v2-parity.test.mjs`：Worker 与 Python bridge 的完整羊腿肉计划一致性。
- `tools/data/pantry-planner-v2-journeys.json`、`tools/run-pantry-planner-v2-journeys.mjs`：J101–J108 公共旅程。
- `tools/tests/planner-menu-coverage-builder.test.mjs`、`tools/generated/planner-menu-coverage.v1.json`、`docs/planner-menu-coverage.md`：新疆羊肉抓饭恢复及西北 2/3 账本。
- `tools/generated/menu-master.v1.json`、`docs/menu-master.md`、`docs/menu-master.csv`、`tools/generated/regional-atlas.v2.json`、`docs/china-one-pot-regional-atlas.md`、`docs/china-one-pot-regional-atlas.csv`：新资产 hash 下的确定性派生产物。
- `CLAUDE.md`、`部署说明.md`、`tools/tests/worker-planner-v2.test.mjs`：版本和 108/108 门禁事实。

---

### Task 1: 用红灯锁住羊腿肉身份、忌口与模板边界

**Files:**

- Modify: `tools/tests/ingredient-taxonomy.test.mjs`
- Modify: `tools/tests/allergen-matching.test.mjs`
- Modify: `tools/tests/allergen-groups-parity.test.mjs`
- Modify: `tools/tests/meal-template-catalog.test.mjs`

**Interfaces:**

- Consumes: `normalizePlannerItems()`、`matchAllergy()`、`validateIngredientTaxonomy()`、`validateMealTemplateCatalog()`。
- Produces: 会因缺失 lamb identity、羊肉忌口组和模板限制而失败的测试。

- [ ] **Step 1: 写 taxonomy r7 与身份失败测试**

```js
test('lamb leg identity is narrow and keeps generic and other cuts unresolved', () => {
  const rows = normalizePlannerItems(
    ['羊腿肉', '去骨羊腿肉', '羊肉', '羊肩肉', '羊排', '羊腩', '羊肉末'], catalog,
  );
  for (const row of rows.slice(0, 2)) {
    assert.deepEqual(
      [row.canonical_id, row.canonical, row.category, row.shape_or_cut, row.cooking_risk],
      ['lamb-leg', '羊肉', 'lamb', 'leg', 'raw_lamb'],
    );
    assert.deepEqual(row.required_endpoint_codes, ['lamb_fully_cooked']);
  }
  assert.deepEqual(rows.slice(2).map(row => row.recognized), [false, false, false, false, false]);
});
```

把 catalog 版本断言改成 `taxonomy-v1-20260727-r7`，并在首批词汇表中加入“羊腿肉”。

- [ ] **Step 2: 写羊肉忌口失败测试**

```js
test('dislike 羊肉 blocks only the controlled lamb-leg family', () => {
  const { context } = loadFrontend();
  assert.deepEqual(matchAll(context, [
    ['羊肉', '羊腿肉'], ['羊肉', '去骨羊腿肉'],
    ['羊腿肉', '去骨羊腿肉'], ['羊腿肉', '牛肉'], ['羊肉', '鸡腿肉'],
  ]), [true, true, true, false, false]);
});
```

在 parity cases 中加入同一组正反例，并把期望表增加：

```js
'羊肉': ['羊腿肉','去骨羊腿肉']
```

- [ ] **Step 3: 写 template r8 失败断言**

```js
const mixed = catalog.templates.find(row => row.template_id === 'savory-mixed-rice-pot');
assert.ok(mixed.optional_slots.find(row => row.slot_id === 'protein').accepts_categories.includes('lamb'));
assert.ok(mixed.ingredient_categories.protein.includes('lamb'));
assert.deepEqual(
  mixed.shape_or_cut_requirements.find(row => row.category === 'lamb'),
  { slot_id:'protein', category:'lamb', allowed_shapes:['leg'], forbidden_shapes:[] },
);
assert.ok(mixed.safety_endpoints.some(row =>
  row.applies_to_category === 'lamb' && row.endpoint_code === 'lamb_fully_cooked'));
assert.ok(mixed.evidence_recipe_ids.includes('xinjiang-lamb-pilaf'));
```

把版本断言改成 template r8 / taxonomy r7，并增加负例：把 lamb allowed shape 改为 ground 时 validator 必须拒绝 taxonomy 未声明的组合。

- [ ] **Step 4: 运行聚焦测试并确认有效红灯**

```sh
node --test tools/tests/ingredient-taxonomy.test.mjs \
  tools/tests/allergen-matching.test.mjs \
  tools/tests/allergen-groups-parity.test.mjs \
  tools/tests/meal-template-catalog.test.mjs
```

Expected: FAIL，明确来自旧版本、羊腿肉未识别、羊肉组缺失或模板不接受 lamb；语法和 fixture 错误不算有效红灯。

- [ ] **Step 5: 提交红灯测试**

```sh
git add tools/tests/ingredient-taxonomy.test.mjs tools/tests/allergen-matching.test.mjs \
  tools/tests/allergen-groups-parity.test.mjs tools/tests/meal-template-catalog.test.mjs
git commit -m "test: define lamb leg planner boundary"
```

---

### Task 2: 实现羊腿肉机器身份和受控模板接纳

**Files:**

- Modify: `tools/data/ingredient-taxonomy.v1.json`
- Modify: `worker/src/ingredient-taxonomy-validator.js`
- Modify: `tools/data/meal-templates.v2.json`
- Modify: `worker/src/meal-template-validator.js`
- Modify: `worker/src/planner-v2.js`
- Modify: `index.html`
- Modify: `worker/src/allergen-semantics.js`
- Modify: `ai_proxy.py`
- Modify: `tools/tests/pantry-planner-v2-selection.test.mjs`

**Interfaces:**

- Consumes: Task 1 红灯。
- Produces: `normalizePlannerItems()` 的 lamb-leg identity，`savory-mixed-rice-pot` 的 lamb/leg 选择能力，以及三端同义忌口行为。

- [ ] **Step 1: 先写 Planner 4/4 和反例失败测试**

```js
test('lamb leg onion carrot and rice form one complete savory rice pot', () => {
  const result = planMeal(assets, request({ must:['羊腿肉','洋葱','胡萝卜','大米'] }));
  assert.equal(result.status, 'complete');
  assert.equal(result.plan.coverage_ratio, 1);
  assert.deepEqual(result.plan.unplanned_must_use, []);
  const pot = result.plan.pots[0];
  assert.equal(pot.template_id, 'savory-mixed-rice-pot');
  assert.deepEqual(new Set(pot.planned_must_use.map(item => item.raw)),
    new Set(['羊腿肉','洋葱','胡萝卜','大米']));
  assert.equal(pot.ratio_trace[0].rule_id, 'savory-mixed-rice-liquid-v1');
  assert.ok(pot.safety_endpoints.some(row => row.endpoint_code === 'lamb_fully_cooked'));
});

test('generic and unsupported lamb cuts never enter the lamb-leg slot', () => {
  for (const raw of ['羊肉','羊肩肉','羊排','羊腩','羊肉末']) {
    const result = planMeal(assets, request({ must:[raw,'洋葱','胡萝卜','大米'] }));
    assert.notEqual(result.status, 'complete', raw);
    assert.ok(result.plan.unplanned_must_use.some(item => item.raw === raw), raw);
  }
});
```

再增加 quick 排除、羊肉忌口暂停与 2 人份 `200/200/240/80/270/10/3` 克数断言。

- [ ] **Step 2: 实现 taxonomy r7**

在 taxonomy 中加入设计规格第 5 节的完整 `lamb-leg` 对象，并把顶层版本递增为 r7。Validator 有限词表加入：

```js
CATEGORIES.add('lamb');
RISK_CODES.add('raw_lamb');
ENDPOINT_CODES.add('lamb_fully_cooked');
SLOT_CODES.add('generic_lamb');
```

实际代码继续使用静态 `new Set([...])`，不得运行时修改集合。

- [ ] **Step 3: 实现 template r8**

只修改 `savory-mixed-rice-pot`：protein 的 `accepts_categories` 和 `ingredient_categories.protein` 增加 `lamb`；增加 lamb/leg shape rule、lamb endpoint 和 `xinjiang-lamb-pilaf` evidence。Catalog 版本改 r8、taxonomy 绑定改 r7。Validator 同步版本，并增加：

```js
raw_lamb
lamb_fully_cooked -> lamb_fully_cooked
lamb_fully_cooked -> category lamb
```

- [ ] **Step 4: 让 Planner 执行 raw_lamb 端点要求**

把 `RAW_RISK_CODES` 改为：

```js
new Set(['raw_egg','raw_poultry','raw_pork','raw_beef','raw_lamb','raw_seafood','raw_dough'])
```

不增加羊肉专用选择分支；现有 taxonomy + template 的通用槽位算法必须直接得出结果。

- [ ] **Step 5: 同步三端忌口组**

在 `index.html`、`worker/src/allergen-semantics.js`、`ai_proxy.py` 的相同位置增加：

```js
'羊肉': ['羊腿肉','去骨羊腿肉']
```

Python 使用等价字典语法。不得把泛称“羊肉”加入 taxonomy alias。

- [ ] **Step 6: 运行聚焦测试**

```sh
node --test tools/tests/ingredient-taxonomy.test.mjs \
  tools/tests/allergen-matching.test.mjs \
  tools/tests/allergen-groups-parity.test.mjs \
  tools/tests/meal-template-catalog.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs
python3 -m py_compile ai_proxy.py
```

Expected: 全部 PASS。

- [ ] **Step 7: 提交身份与规划层**

```sh
git add tools/data/ingredient-taxonomy.v1.json worker/src/ingredient-taxonomy-validator.js \
  tools/data/meal-templates.v2.json worker/src/meal-template-validator.js worker/src/planner-v2.js \
  index.html worker/src/allergen-semantics.js ai_proxy.py \
  tools/tests/pantry-planner-v2-selection.test.mjs
git commit -m "feat: add narrow lamb leg planning"
```

---

### Task 3: 锁住羊肉生成合同与 Worker/Python parity

**Files:**

- Modify: `tools/tests/worker-generate-plan.test.mjs`
- Modify: `tools/tests/planner-v2-parity.test.mjs`
- Modify: `worker/src/generated-plan-contract.js`

**Interfaces:**

- Consumes: Task 2 完整 Planner plan。
- Produces: 可表达且不可越界的羊腿肉 locked plan；Worker/Python bridge 字节级结构一致。

- [ ] **Step 1: 写生成合同失败测试**

```js
test('locked lamb-leg rice plan preserves cut extras and completed endpoint', async () => {
  const journey = await preparedJourney(plannerRequest({ must:['羊腿肉','洋葱','胡萝卜','大米'] }));
  const locked = workerModule.buildLockedPlanContract(journey.planned, templates);
  assert.ok(locked.meals[0].locked_ingredients.some(item => item.raw_name === '羊腿肉'));
  assert.ok(locked.meals[0].safety_endpoints.includes('lamb_fully_cooked'));
  const valid = validModelOutput(locked);
  assert.equal(workerModule.validateGeneratedPlan(valid, locked, ingredientTermUniverse()).ok, true);
  for (const forbidden of ['羊肩肉','羊排','羊腩','羊肉末','葡萄干']) {
    const output = structuredClone(valid);
    output.meals[0].steps[0].text += `加入${forbidden}。`;
    assert.equal(workerModule.validateGeneratedPlan(output, locked, ingredientTermUniverse()).ok, false);
  }
});
```

再写一条把 endpoint 清空或只写“表面变色”的失败断言。

- [ ] **Step 2: 写 Worker/Python parity 失败测试**

```js
test('Xinjiang lamb leg rice facts are identical across Worker and Python bridge', async () => {
  const body = await parityCase(
    'Xinjiang lamb leg rice', request({ must:['羊腿肉','洋葱','胡萝卜','大米'] }), 'complete',
  );
  assert.equal(body.plan.plan_kind, 'single_pot');
  assert.deepEqual(body.plan.unplanned_must_use, []);
  assert.equal(body.plan.pots[0].template_id, 'savory-mixed-rice-pot');
  const lamb = body.normalized_items.find(item => item.raw === '羊腿肉');
  assert.deepEqual([lamb.canonical_id,lamb.canonical,lamb.shape_or_cut,lamb.cooking_risk],
    ['lamb-leg','羊肉','leg','raw_lamb']);
});
```

- [ ] **Step 3: 确认红灯后实现受控羊肉熟制表达**

在 `SAFETY_EVIDENCE_RULES` 增加：

```js
lamb_fully_cooked: /完全熟透/u
```

在 `endpointEvidencePhrase()` 把 `lamb_fully_cooked` 与 beef/pork 同组，生成“{{ref}}完全熟透”。在 `protein_pretreat` 的切片受控短语中把 category `lamb` 与 beef/pork 同组，但始终用 ref 渲染原词“羊腿肉”。

- [ ] **Step 4: 运行合同与 parity 测试**

```sh
node --test tools/tests/worker-generate-plan.test.mjs tools/tests/planner-v2-parity.test.mjs
python3 -m py_compile ai_proxy.py
```

Expected: 全部 PASS，fake upstream 每次至多一次。

- [ ] **Step 5: 提交生成边界**

```sh
git add tools/tests/worker-generate-plan.test.mjs tools/tests/planner-v2-parity.test.mjs \
  worker/src/generated-plan-contract.js
git commit -m "feat: lock lamb generation safety"
```

---

### Task 4: 增加 8 条公共旅程并恢复西北账本

**Files:**

- Modify: `tools/data/pantry-planner-v2-journeys.json`
- Modify: `tools/run-pantry-planner-v2-journeys.mjs`
- Modify: `tools/tests/pantry-planner-v2-journeys.test.mjs`
- Modify: `tools/tests/planner-menu-coverage-builder.test.mjs`
- Regenerate: `tools/generated/planner-menu-coverage.v1.json`
- Regenerate: `docs/planner-menu-coverage.md`
- Regenerate: `tools/generated/menu-master.v1.json`
- Regenerate: `docs/menu-master.md`
- Regenerate: `docs/menu-master.csv`
- Regenerate: `tools/generated/regional-atlas.v2.json`
- Regenerate: `docs/china-one-pot-regional-atlas.md`
- Regenerate: `docs/china-one-pot-regional-atlas.csv`
- Regenerate: existing deterministic regional research artifacts whose source hash changes

**Interfaces:**

- Consumes: Planner、忌口、生成合同和地域映射。
- Produces: J101–J108 的 108/108 门禁，以及 `xinjiang-lamb-pilaf` 和 Northwest 2/3 的确定性账本证据。

- [ ] **Step 1: 先写账本恢复失败测试**

```js
const lamb = byId(report, 'xinjiang-lamb-pilaf');
assert.equal(lamb.audit_status, 'full_single_pot_evidence_aligned');
assert.deepEqual(lamb.unclassified_core_items, []);
assert.equal(lamb.raw_core_scenario.end_to_end_core_coverage_ratio, 1);
assert.equal(lamb.raw_core_scenario.plan_kind, 'single_pot');
assert.ok(lamb.raw_core_scenario.selected_template_ids.includes('savory-mixed-rice-pot'));
const northwest = report.by_region.find(row => row.region_id === 'northwest');
assert.deepEqual([northwest.recipe_count, northwest.single_pot_full_count], [3, 2]);
```

运行该单测，确认因羊腿肉当前 gap 或旧派生产物而 FAIL。

- [ ] **Step 2: 写 J101–J108 数据**

按规格第 12 节分别加入：4/4 complete、去骨别名、泛称羊肉、羊肩肉、羊肉忌口、quick 排除、recommend + 西兰花 unused、模型新增葡萄干。J101 的手算期望必须包含 `required_template_ids:["savory-mixed-rice-pot"]`、`required_ratio_rule_ids:["savory-mixed-rice-liquid-v1"]`、`complete_coverage:1`；J108 使用 `model_mutation:"add_raisin"` 并期待 422 `model_contract_violation`。

- [ ] **Step 3: 先运行旅程并确认新增 mutation/expectation 红灯**

```sh
node tools/run-pantry-planner-v2-journeys.mjs
```

Expected: 在 runner 尚不认识 `add_raisin` 或新旅程行为不满足时 FAIL。

- [ ] **Step 4: 最小扩展 runner 并更新公共计数**

在 `mutateOutput()` 增加：

```js
if (mutation === 'add_raisin') first.dish_name += '葡萄干';
```

把旅程测试的预期数量从 100 改为 108；不得放宽全局断言。

- [ ] **Step 5: 运行确定性构建器**

```sh
node tools/build-planner-menu-coverage.mjs
node tools/build-menu-master.mjs
node tools/build-regional-atlas.mjs
node tools/build-northwest-one-pot-research.mjs
```

只运行上述现有确定性生成器，不手改生成产物；生成后以各自 artifact test 判断哪些文件应产生差异。

- [ ] **Step 6: 运行旅程与账本聚焦测试**

```sh
node tools/run-pantry-planner-v2-journeys.mjs
node --test tools/tests/pantry-planner-v2-journeys.test.mjs \
  tools/tests/planner-menu-coverage-builder.test.mjs \
  tools/tests/planner-menu-coverage-artifacts.test.mjs \
  tools/tests/menu-master-artifacts.test.mjs \
  tools/tests/regional-atlas-artifacts.test.mjs
```

Expected: 108/108，所有派生产物一致。

- [ ] **Step 7: 提交旅程与账本**

```sh
git add tools/data/pantry-planner-v2-journeys.json tools/run-pantry-planner-v2-journeys.mjs \
  tools/tests/pantry-planner-v2-journeys.test.mjs tools/tests/planner-menu-coverage-builder.test.mjs \
  tools/generated docs
git commit -m "test: cover northwest lamb journeys"
```

---

### Task 5: 同步版本闭包并执行最终门禁

**Files:**

- Modify: `CLAUDE.md`
- Modify: `部署说明.md`
- Modify: `tools/tests/worker-planner-v2.test.mjs`
- Modify: any existing version-closure test that still names r6/r7 or 100 journeys

**Interfaces:**

- Consumes: Tasks 1–4 的可运行资产。
- Produces: taxonomy r7 / template r8 / Ratio r4 / 108 journeys 的完整构建与文档闭包。

- [ ] **Step 1: 写版本闭包失败测试**

把 health、部署文档和构建断言改为：

```js
assert.equal(result.body.templateCatalogVersion, 'templates-v2-20260727-r8');
assert.equal(result.body.ingredientTaxonomyVersion, 'taxonomy-v1-20260727-r7');
assert.equal(result.body.ratioRulesVersion, 'ratio-rules-v1-20260727-r4');
```

并断言公开旅程文本为 108/108。先运行 `worker-planner-v2.test.mjs`，确认旧版本事实导致红灯。

- [ ] **Step 2: 同步文档与所有固定版本**

只更新版本闭包、10 active + 6 planned、72 recipe 与 108/108；不得更改部署许可，继续写明只允许 Draft PR、未部署 Preview/production。

- [ ] **Step 3: 运行新功能聚焦门禁**

```sh
node --test tools/tests/ingredient-taxonomy.test.mjs \
  tools/tests/meal-template-catalog.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs \
  tools/tests/allergen-matching.test.mjs \
  tools/tests/allergen-groups-parity.test.mjs \
  tools/tests/worker-generate-plan.test.mjs \
  tools/tests/planner-v2-parity.test.mjs \
  tools/tests/pantry-planner-v2-journeys.test.mjs \
  tools/tests/planner-menu-coverage-builder.test.mjs \
  tools/tests/worker-planner-v2.test.mjs
```

- [ ] **Step 4: 运行完整验收门禁**

```sh
node --test tools/tests/*.test.mjs
node tools/check-foods.mjs
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
python3 -m py_compile ai_proxy.py
node --test tools/tests/build-dist.test.mjs
git diff --check
```

再用 `jq` 独立核对 72 recipes、16 templates、10 active + 6 planned、taxonomy r7、template r8、Ratio r4 和 108 journeys。

- [ ] **Step 5: 提交版本闭包**

```sh
git add CLAUDE.md 部署说明.md tools/tests/worker-planner-v2.test.mjs
git commit -m "docs: align lamb planner baseline"
```

- [ ] **Step 6: 更新远端 Draft PR**

网络可用时：

```sh
git push origin codex/targeted-recipe-expansion
gh pr view 1 --json state,isDraft,headRefOid,url
```

必须确认 PR #1 仍为 `OPEN` + `isDraft:true`，不运行 Wrangler，不合并。

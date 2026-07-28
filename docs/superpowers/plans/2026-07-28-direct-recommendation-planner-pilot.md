# Direct Recommendation Planner Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Preview 的第一轮 Pilot 默认路径切换为确定性「直接推荐」Planner，在 2 秒内给出 1–3 个诚实、高覆盖候选，并保证 DeepSeek 只能表达已锁定的食材、克数、比例和安全要求。

**Architecture:** `/plan-meal` 使用 taxonomy、template 和 Ratio DSL 生成可复现候选包，候选阶段不调用 DeepSeek；用户选择 `plan_id` 后，`/generate-plan` 服务端重算候选成员并建立 locked plan，DeepSeek 只选择受控菜名和步骤文本。旧 selector 仅用于影子对照，Preview 通过构建标志启用 V2，production 默认关闭。

**Tech Stack:** 单文件原生 HTML/JavaScript 前端、Cloudflare Pages Worker、Node.js `node:test`、Python 本地代理、JSON taxonomy/template/Ratio DSL 资产、Cloudflare Pages Preview。

## Global Constraints

- 第一轮 Pilot 只开放「直接推荐」；不开放残缺的「帮我清库存」。
- Pilot 前 recipe 总数保持 72，不新增 recipe 或 template。
- `/plan-meal` 的 DeepSeek 调用次数必须为 0；`/generate-plan` 每次用户明确操作最多调用 1 次，失败不自动重试。
- 正常候选必须达到覆盖门槛；不得为凑三张卡展示低覆盖方案。
- `required_extra_items` 只能包含基础主食、液体、油脂和基础调味。
- 模型不能新增、删除、替换食材，不能修改克数、比例、生熟状态、部位或安全终点。
- 不新增账号、用户画像、营养追踪、行为遥测、多 Agent 产品能力或有状态多锅。
- 不部署 production，不合并 Draft PR；Preview 只有通过本计划门禁后才可发给 Pilot 用户。
- 每个任务先写失败测试，再做最小实现，再提交独立 commit。

---

## 五项评审问题的实施决定

### 1. 覆盖门槛取整

新增纯函数：

```js
export function minimumRecommendCoverageCount(totalSubmitted) {
  if (totalSubmitted <= 0) return 0;
  if (totalSubmitted <= 2) return totalSubmitted;
  if (totalSubmitted === 3) return 2;
  return Math.ceil(totalSubmitted * 0.6);
}
```

边界固定为：`0→0, 1→1, 2→2, 3→2, 4→3, 5→3, 6→4, 7→5, 8→5, 9→6, 20→12`。`N≥4` 一律向上取整，不允许使用四舍五入或向下取整。

### 2. 克数零漂移的规范化精度

Ratio DSL 是唯一克数来源。每条规则先按自身 `rounding.grams_to_nearest` 计算，再写入 plan；当前合法粒度仅为 1g 或 5g，因此进入 plan、plan hash 和 locked contract 的克数必须是非负整数。

```js
export function normalizeRatioGrams(value, nearest) {
  if (!Number.isFinite(value) || !Number.isInteger(nearest) || nearest < 1) {
    throw new Error('invalid_ratio_grams');
  }
  return Math.round(value / nearest) * nearest;
}
```

例：133.3g 在 1g 规则下锁定为 133g，在 5g 规则下锁定为 135g。DeepSeek 输出 schema 不接收独立克数字段；步骤出现数字时只能命中 locked contract 中已经写好的整数文本。因此“零漂移”比较的是规范化后的 locked integer，不比较规范化前的浮点中间值。

### 3. 换一换历史软降权

- `current_plan_id`：仅本次换一换硬排除；
- `recent_plan_ids`：7 天窗口、最多 20 个，`swapped` 和 `started` 都进入；
- 软惩罚幅度：二元 `recent_penalty = 1`，未出现为 0；
- 排序位置：先比较安全、承诺等级、覆盖数、额外补充数；再比较 `recent_penalty`；最后比较模板差异等级和稳定 key；
- 最近计划不得因历史而永久排除；所有非最近候选用完后，允许返回满足同等承诺的最近候选；
- 同一 `plan_id` 在 localStorage 中只保留最新一条，不累计多次惩罚。

### 4. P95 测量方法

使用同一 Preview 构建做两组测量：

1. API 门：预热 5 次后，顺序执行 100 次 `/plan-meal`，并发为 1；从请求发出到 JSON 完整解析计时；P95 使用排序后第 95 个样本；记录 HTTP 状态、Content-Type、`buildId` 和 `plannerRollout`。
2. 真人浏览器门：使用手机视口的真实 Chrome，跑 30 条点击旅程；从点击「开始」到候选卡 DOM 可见计时；由复测者在普通 Wi-Fi 上执行并保存截图/结果。每条旅程先确认页面构建号与 `/health` 一致。

两组 P95 都必须 `< 2000ms`；任一 `bad_json`、5xx、按钮无反馈或构建号不一致均阻断 Pilot。

### 5. Preview 环境开关

使用构建标志，不使用公开 URL 参数作为 Preview 开关：

```text
node tools/build-dist.mjs \
  --out-dir dist \
  --build-id direct-recommend-<git-sha> \
  --planner-rollout direct-recommend
```

- `--planner-rollout` 只接受 `off|direct-recommend`，默认 `off`；
- production 没有显式参数时保持旧路径；
- localhost 继续允许 `?planner_v2=1` 做开发调试；
- 构建生成 `build-meta.json`，并把 build ID/rollout 注入 `index.html`；
- 页面暴露只读 `window.__YIGUOCHU_BUILD_META__ = { buildId, plannerRollout }`，供真实浏览器脚本核验；
- `/health` 返回同一 `buildId` 和 `plannerRollout`，供复测者确认没有测到旧构建。

---

### Task 1: 固化 recommend 覆盖门槛与覆盖字段语义

**Files:**
- Modify: `worker/src/planner-v2.js`
- Modify: `tools/tests/pantry-planner-v2-selection.test.mjs`
- Modify: `tools/tests/pantry-planner-v2-contract.test.mjs`

**Interfaces:**
- Produces: `minimumRecommendCoverageCount(totalSubmitted: number): number`
- Produces: `coverageFieldsFor(promiseItems, plannedItems): { coverage_ratio, recognition_ratio, recognized_coverage_ratio }`
- Contract: 单锅 recommend 的顶层和锅级覆盖率使用同一 original submitted denominator。

- [ ] **Step 1: 写覆盖门槛失败测试**

在 `pantry-planner-v2-selection.test.mjs` 导入 `minimumRecommendCoverageCount` 并增加：

```js
test('recommend coverage thresholds always round 60 percent upward', () => {
  const cases = new Map([[0,0],[1,1],[2,2],[3,2],[4,3],[5,3],[6,4],[7,5],[8,5],[9,6],[20,12]]);
  for (const [submitted, expected] of cases) {
    assert.equal(minimumRecommendCoverageCount(submitted), expected, String(submitted));
  }
});
```

- [ ] **Step 2: 写 recommend 覆盖字段失败测试**

增加三条断言：

```js
test('recommend single pot uses the original submitted denominator at both levels', () => {
  const result = planMeal(assets, request({
    mode:'recommend', prefer:['番茄','鸡蛋','西兰花','神秘叶子'],
  }));
  assert.equal(result.plan.coverage_ratio, result.plan.pots[0].coverage_ratio);
  assert.equal(result.plan.recognition_ratio, 3 / 4);
  assert.equal(result.plan.coverage_ratio, result.plan.planned_prefer_use.length / 4);
  assert.equal(result.plan.recognized_coverage_ratio, result.plan.planned_prefer_use.length / 3);
  assert.notEqual(result.plan.pots[0].coverage_ratio, 0);
});
```

再用 5 项输入验证 2/5 候选 `single_pot_eligible === false`，3/5 才为 true；用 7 项输入验证至少 5 项才为 true。

- [ ] **Step 3: 运行测试并确认失败**

Run:

```bash
node --test tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/pantry-planner-v2-contract.test.mjs
```

Expected: FAIL，原因包括函数未导出、recommend pot 覆盖率仍按 must-use 计算或低覆盖候选仍 eligible。

- [ ] **Step 4: 实现单一覆盖语义**

在 `planner-v2.js` 中：

```js
export function minimumRecommendCoverageCount(totalSubmitted) {
  if (totalSubmitted <= 0) return 0;
  if (totalSubmitted <= 2) return totalSubmitted;
  if (totalSubmitted === 3) return 2;
  return Math.ceil(totalSubmitted * 0.6);
}
```

`buildPotCandidatesInternal()` 对 recommend 使用 `prefer` 作为 promise items，计算三种覆盖字段，并令：

```js
function coverageFieldsFor(promiseItems, plannedItems) {
  const plannedKeys = new Set(plannedItems.map(item => item.canonical || `raw:${item.raw}`));
  const recognized = promiseItems.filter(item => item.recognized);
  const plannedRecognized = recognized.filter(item =>
    plannedKeys.has(item.canonical || `raw:${item.raw}`));
  return {
    coverage_ratio: promiseItems.length ? plannedItems.length / promiseItems.length : 0,
    recognition_ratio: promiseItems.length ? recognized.length / promiseItems.length : 0,
    recognized_coverage_ratio: recognized.length ? plannedRecognized.length / recognized.length : 0,
  };
}

const eligibleCount = request.mode === 'recommend'
  ? plannedPrefer.length
  : plannedMust.length;
const submittedCount = request.mode === 'recommend' ? prefer.length : must.length;
const single_pot_eligible = request.mode === 'recommend'
  ? eligibleCount >= minimumRecommendCoverageCount(submittedCount)
  : displayFloor(submittedCount, eligibleCount);
```

`decoratePots()` 接收完整 promise items，并把每锅覆盖字段显式写入；单锅响应由同一 helper 生成顶层和锅级字段，禁止前端重算。

- [ ] **Step 5: 运行测试并确认通过**

Run: `node --test tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/pantry-planner-v2-contract.test.mjs`

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add worker/src/planner-v2.js tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/pantry-planner-v2-contract.test.mjs
git commit -m "fix: unify direct recommendation coverage semantics"
```

### Task 2: 补齐虾仁、玉米身份与模板兼容规则

**Files:**
- Modify: `tools/data/ingredient-taxonomy.v1.json`
- Modify: `tools/data/meal-templates.v2.json`
- Modify: `worker/src/ingredient-taxonomy-validator.js`
- Modify: `worker/src/meal-template-validator.js`
- Modify: `worker/src/generated-plan-contract.js`
- Modify: `tools/tests/ingredient-taxonomy.test.mjs`
- Modify: `tools/tests/meal-template-catalog.test.mjs`
- Modify: `tools/tests/pantry-planner-v2-selection.test.mjs`
- Modify: `tools/tests/worker-generate-plan.test.mjs`
- Regenerate: `tools/generated/planner-menu-coverage.v1.json`
- Regenerate: `docs/planner-menu-coverage.md`
- Modify: `CLAUDE.md`
- Modify: `部署说明.md`

**Interfaces:**
- Produces taxonomy version: `taxonomy-v1-20260728-r10`
- Produces template catalog version: `templates-v2-20260728-r10`
- Adds categories: `seafood`, `starchy_vegetable`
- Adds safety endpoint: `seafood_fully_cooked`

- [ ] **Step 1: 写 taxonomy 和安全失败测试**

在 `ingredient-taxonomy.test.mjs` 断言：

```js
for (const raw of ['虾仁','鲜虾仁','冷冻虾仁','玉米','玉米粒','甜玉米']) {
  const [item] = normalizePlannerItems([{ raw, role:'prefer_use' }], taxonomy);
  assert.equal(item.recognized, true, raw);
}
assert.equal(byDisplay.get('虾仁').cooking_risk.risk_code, 'raw_seafood');
assert.deepEqual(byDisplay.get('虾仁').cooking_risk.required_endpoint_codes, ['seafood_fully_cooked']);
assert.equal(byDisplay.get('玉米').category, 'starchy_vegetable');
```

在 `worker-generate-plan.test.mjs` 增加模型步骤未完成 `seafood_fully_cooked` 时被拒绝、完成“虾仁完全熟透”时通过的用例。

- [ ] **Step 2: 写真实组合失败测试**

在 `pantry-planner-v2-selection.test.mjs` 增加：

```js
test('shrimp and corn are recognized and never silently dropped', () => {
  const result = planMeal(assets, request({ mode:'recommend', prefer:['虾仁','玉米'] }));
  assert.deepEqual(result.normalized_items.map(item => item.recognized), [true, true]);
  assert.ok(result.plan.planned_prefer_use.length + result.plan.unused_prefer_use.length === 2);
  assert.ok(result.plan.unused_prefer_use.every(item => item.reason_code && item.reason));
});
```

- [ ] **Step 3: 运行测试并确认失败**

Run:

```bash
node --test tools/tests/ingredient-taxonomy.test.mjs tools/tests/meal-template-catalog.test.mjs tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/worker-generate-plan.test.mjs
```

Expected: FAIL，虾仁/玉米未识别或安全 endpoint/schema 不接受。

- [ ] **Step 4: 增加受控身份和兼容字段**

`ingredient-taxonomy.v1.json` 增加两个 pantry identities：

```json
{
  "canonical_id":"shrimp",
  "display_name":"虾仁",
  "aliases":["鲜虾仁","冷冻虾仁"],
  "input_scope":"pantry_input",
  "category":"seafood",
  "states":["raw"],
  "shapes_or_cuts":["whole"],
  "default_shape_or_cut":"whole",
  "cook_speed":"fast",
  "moisture_release":"low",
  "texture_behavior":{"behavior_code":"tender_when_quick_cooked","best_method_codes":["quick_saute","short_simmer"],"failure_mode_codes":["rubbery_when_overcooked"]},
  "cooking_risk":{"risk_code":"raw_seafood","required_endpoint_codes":["seafood_fully_cooked"]},
  "compatible_slot_codes":["protein","quick_cook_protein"],
  "incompatible_slot_codes":["long_braise"]
}
```

```json
{
  "canonical_id":"sweet-corn",
  "display_name":"玉米",
  "aliases":["玉米粒","甜玉米"],
  "input_scope":"pantry_input",
  "category":"starchy_vegetable",
  "states":["raw"],
  "shapes_or_cuts":["whole_seed"],
  "default_shape_or_cut":"whole_seed",
  "cook_speed":"medium",
  "moisture_release":"medium",
  "texture_behavior":{"behavior_code":"softens_with_simmering","best_method_codes":["simmer","braise"],"failure_mode_codes":["firm_when_undercooked"]},
  "cooking_risk":{"risk_code":"none","required_endpoint_codes":["tender"]},
  "compatible_slot_codes":["vegetable"],
  "incompatible_slot_codes":[]
}
```

扩展 validator 枚举；只在能保持对应 cooking order、ratio 和 safety 的现有 active template vegetable/protein 槽中加入新类别，不新增 template。虾仁只进入 quick-cook protein 可承接的槽；玉米进入 vegetable 槽。每个接受 seafood 的 template 必须声明 `seafood_fully_cooked`。

- [ ] **Step 5: 更新受控生成安全短语**

在 `generated-plan-contract.js` 增加：

```js
if (endpoint === 'seafood_fully_cooked') return `${ingredients}完全熟透`;
```

并把该 endpoint 加入模板 validator 的合法集合。模型仍只能选包含该事实的 allowed text。

- [ ] **Step 6: 升级版本并重建覆盖资产**

版本更新为 r10，只修改当前权威数据、validator、当前说明和当前测试；不回写历史 specs/plans。

Run:

```bash
node tools/build-planner-menu-coverage.mjs
node tools/check-recipes.mjs
```

Expected: 覆盖资产重建成功，72 道 recipe 数不变，template 数不变。

- [ ] **Step 7: 运行测试并确认通过**

Run:

```bash
node --test tools/tests/ingredient-taxonomy.test.mjs tools/tests/meal-template-catalog.test.mjs tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/worker-generate-plan.test.mjs
```

Expected: PASS。

- [ ] **Step 8: 提交**

```bash
git add tools/data/ingredient-taxonomy.v1.json tools/data/meal-templates.v2.json worker/src/ingredient-taxonomy-validator.js worker/src/meal-template-validator.js worker/src/generated-plan-contract.js tools/tests/ingredient-taxonomy.test.mjs tools/tests/meal-template-catalog.test.mjs tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/worker-generate-plan.test.mjs tools/generated/planner-menu-coverage.v1.json docs/planner-menu-coverage.md CLAUDE.md 部署说明.md
git commit -m "feat: recognize shrimp and corn in planner"
```

### Task 3: 返回 1–3 个有效候选并支持按 plan_id 权威重算

**Files:**
- Modify: `worker/src/planner-v2.js`
- Modify: `worker/src/worker.js`
- Modify: `tools/planner-v2-local-bridge.mjs`
- Modify: `ai_proxy.py`
- Modify: `tools/tests/pantry-planner-v2-selection.test.mjs`
- Modify: `tools/tests/worker-planner-v2.test.mjs`
- Modify: `tools/tests/worker-generate-plan.test.mjs`
- Modify: `tools/tests/planner-v2-parity.test.mjs`

**Interfaces:**
- Produces: `planMealCandidateBundle(assets, request, { limit = 3 })`
- Produces: `resolveAuthoritativePlanById(assets, request, planId)`
- Response adds: `candidate_plans: PlannerResult[]`, `preferred_plan_id: string|null`
- Candidate objects do not recursively contain `candidate_plans`.

- [ ] **Step 1: 写候选数量、门槛和差异失败测试**

在 `pantry-planner-v2-selection.test.mjs` 增加：

```js
test('initial recommend returns one to three valid non-filler candidates', async () => {
  const bundle = await planMealCandidateBundle(assets, request({
    mode:'recommend', prefer:['番茄','鸡蛋','豆腐','西兰花','熟米饭'],
  }));
  assert.ok(bundle.candidate_plans.length >= 1 && bundle.candidate_plans.length <= 3);
  const best = bundle.candidate_plans[0].plan.planned_prefer_use.length;
  assert.ok(bundle.candidate_plans.every(candidate =>
    candidate.plan.planned_prefer_use.length >= minimumRecommendCoverageCount(5)));
  assert.ok(bundle.candidate_plans.slice(1).every(candidate =>
    candidate.plan.planned_prefer_use.length >= best - 1));
  assert.equal(new Set(bundle.candidate_plans.map(candidate => candidate.plan.plan_id)).size,
    bundle.candidate_plans.length);
});
```

另加“只有一个可靠计划时数组长度为 1，不复制凑三张”和“5 项仅 2/5 时返回 `no_valid_plan` 且候选为空”。
该 `no_valid_plan` 响应不得带 `legacy_fallback:true` 或 `plan_source:'legacy_recipe_selector'`。

- [ ] **Step 2: 写生成 candidate 2 的权威校验失败测试**

在 `worker-generate-plan.test.mjs`：先取候选包第二个 `plan_id`，再用原始 `plan_request` 调 `/generate-plan`；期望 200。伪造不属于候选包的 plan ID 期望 409 `stale_plan`。

- [ ] **Step 3: 运行测试并确认失败**

Run:

```bash
node --test tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/worker-planner-v2.test.mjs tools/tests/worker-generate-plan.test.mjs tools/tests/planner-v2-parity.test.mjs
```

Expected: FAIL，候选 bundle/helper 尚不存在，生成接口只能重算第一计划。

- [ ] **Step 4: 实现候选枚举与筛选**

复用现有 `identifiedValidPlans()`，不新增第二套 planner。新增公开 helper：

```js
export async function planMealCandidateBundle(assets, request, { limit = 3 } = {}) {
  const plans = await identifiedValidPlans(assets, requestWithoutSwapHistory(request));
  const eligible = plans.filter(plan => isNormalRecommendCandidate(plan));
  const selected = selectDiverseCandidates(eligible, request, limit);
  if (!selected.length) return { ...await attachPlanIdentity(planMeal(assets, request)), candidate_plans:[], preferred_plan_id:null };
  return { ...structuredClone(selected[0]), candidate_plans:selected.map(structuredClone), preferred_plan_id:selected[0].plan.plan_id };
}
```

`selectDiverseCandidates()` 依次选择：最高覆盖；之后只选与已选计划在 template/assignment/主食或烹饪结构上不同、覆盖最多低 1 项的计划。允许补充项必须通过白名单 category 校验。

若没有达标计划，构造诚实的 `no_valid_plan` 响应并保留 `normalized_items`、`unused_prefer_use` 和结构化原因。Preview rollout 下不得调用 `legacyRecipeFallbackResponse()`；该 helper 只保留给旧协议和影子对照。

- [ ] **Step 5: 实现按 plan_id 重算**

```js
export async function resolveAuthoritativePlanById(assets, request, planId) {
  const bundle = await planMealCandidateBundle(assets, request, { limit: 3 });
  return bundle.candidate_plans.find(candidate => candidate.plan.plan_id === planId) || null;
}
```

`handleGeneratePlan()` 用该 helper 选择计划，不信任客户端 plan 内容；只信任 request + `plan_id`。`/plan-meal` 初始 recommend 返回 bundle；含 `current_plan_id` 的换一换请求仍返回单一 alternative/no-alternative 结果。

- [ ] **Step 6: 同步本地 bridge/proxy 与 Worker**

`planner-v2-local-bridge.mjs` 和 `ai_proxy.py` 返回与 Worker 相同的 bundle；proxy 仍不自行实现 planner 规则。运行 Python 语法检查。

Run: `python3 -m py_compile ai_proxy.py`

Expected: exit 0。

- [ ] **Step 7: 运行测试并确认通过**

Run:

```bash
node --test tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/worker-planner-v2.test.mjs tools/tests/worker-generate-plan.test.mjs tools/tests/planner-v2-parity.test.mjs
```

Expected: PASS，Worker/Python bundle 字节语义一致。

- [ ] **Step 8: 提交**

```bash
git add worker/src/planner-v2.js worker/src/worker.js tools/planner-v2-local-bridge.mjs ai_proxy.py tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/worker-planner-v2.test.mjs tools/tests/worker-generate-plan.test.mjs tools/tests/planner-v2-parity.test.mjs
git commit -m "feat: return authoritative planner candidate bundles"
```

### Task 4: 锁定 Ratio DSL 整数克数与生成零漂移

**Files:**
- Modify: `worker/src/ratio-dsl.js`
- Modify: `worker/src/planner-v2.js`
- Modify: `worker/src/generated-plan-contract.js`
- Modify: `tools/tests/ratio-dsl.test.mjs`
- Modify: `tools/tests/worker-generate-plan.test.mjs`

**Interfaces:**
- Produces: `normalizeRatioGrams(value: number, nearest: number): number`
- Invariant: `ingredient_amounts[].grams`、`required_extra_items[].grams` 和 `locked_ingredients[].planned_grams` 均为非负整数。

- [ ] **Step 1: 写取整边界失败测试**

在 `ratio-dsl.test.mjs` 增加：

```js
test('ratio grams normalize once before plan identity and locking', () => {
  assert.equal(normalizeRatioGrams(133.3, 1), 133);
  assert.equal(normalizeRatioGrams(133.3, 5), 135);
  assert.throws(() => normalizeRatioGrams(10, 0), /invalid_ratio_grams/);
});
```

为所有真实 ratio rules 运行一次 compile，断言所有输出克数 `Number.isInteger(grams)`。

- [ ] **Step 2: 写模型越权失败测试**

在 `worker-generate-plan.test.mjs` 增加：

- 模型 schema 增加任意 `grams` 字段 → `malformed_model_json`；
- 模型步骤写入不同克数 → `numeric_claim_outside_locked_contract`；
- 预留水步骤使用 locked integer → 通过；
- candidate 2 生成后的 `meals[].locked_ingredients[].planned_grams` 与 authoritative plan 完全一致。

- [ ] **Step 3: 运行测试并确认失败**

Run: `node --test tools/tests/ratio-dsl.test.mjs tools/tests/worker-generate-plan.test.mjs`

Expected: FAIL，规范化 helper/integer invariant 尚未显式锁定。

- [ ] **Step 4: 实现单次整数规范化**

将 `roundRatioGrams()` 收敛到导出的 `normalizeRatioGrams()`；Ratio DSL 输出后立即验证整数。`canonicalPlanIdentityPayload()` 和 `buildLockedPlanContract()` 只消费已规范化 plan 值，不再执行第二种取整。

在 `buildLockedPlanContract()` 增加：

```js
if (!Number.isInteger(exact.grams) || exact.grams < 0) {
  throw new Error('locked_ingredient_amount_invalid');
}
```

前端只展示 `planned_grams`，不解析模型文本获得克数。

- [ ] **Step 5: 运行测试并确认通过**

Run: `node --test tools/tests/ratio-dsl.test.mjs tools/tests/worker-generate-plan.test.mjs`

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add worker/src/ratio-dsl.js worker/src/planner-v2.js worker/src/generated-plan-contract.js tools/tests/ratio-dsl.test.mjs tools/tests/worker-generate-plan.test.mjs
git commit -m "fix: lock normalized planner gram amounts"
```

### Task 5: 将换一换改为当前硬排除、7 天历史软降权

**Files:**
- Modify: `worker/src/planner-v2.js`
- Modify: `index.html`
- Modify: `tools/tests/pantry-planner-v2-selection.test.mjs`
- Modify: `tools/tests/frontend-recipe-contract.test.mjs`

**Interfaces:**
- Produces: `recentPlanPenalty(planId, recentPlanIds): 0|1`
- Preserves: `SWAP_HISTORY_TTL = 7 days`, maximum 20 entries, kinds `swapped|started`。

- [ ] **Step 1: 写软降权失败测试**

在 selection test 构造三个同等承诺计划，验证：

```js
assert.equal(recentPlanPenalty('new-plan', ['old-plan']), 0);
assert.equal(recentPlanPenalty('old-plan', ['old-plan']), 1);
```

并验证：

- 当前 plan 永不作为本次 alternative 返回；
- 同覆盖下优先非最近计划；
- 所有 alternative 都在 recent list 时仍返回最佳最近计划，而不是 `no_alternative_plan`；
- 较高覆盖 recent 计划不能被较低覆盖 non-recent 计划击败。

- [ ] **Step 2: 写浏览器历史窗口失败测试**

在 frontend contract test 中用共享 localStorage 验证：8 天前记录被删；7 天内 `started` 和 `swapped` 都发送；相同 plan ID 只发送一次最新记录；最多发送 20 个。

- [ ] **Step 3: 运行测试并确认失败**

Run: `node --test tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/frontend-recipe-contract.test.mjs`

Expected: FAIL，helper/全最近回用语义尚未完整锁定。

- [ ] **Step 4: 实现统一 comparator**

```js
export function recentPlanPenalty(planId, recentPlanIds = []) {
  return new Set(recentPlanIds).has(planId) ? 1 : 0;
}
```

初始候选和换一换共用排序字段：硬约束 → 承诺/覆盖 → required extras → recent penalty → alternative level → stable key。删除任何把 recent ID 当永久排除集合的 filter。

- [ ] **Step 5: 运行测试并确认通过**

Run: `node --test tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/frontend-recipe-contract.test.mjs`

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add worker/src/planner-v2.js index.html tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/frontend-recipe-contract.test.mjs
git commit -m "fix: make planner history a soft cooldown"
```

### Task 6: 增加可验证的 Preview 构建开关和构建元数据

**Files:**
- Modify: `tools/build-dist.mjs`
- Modify: `index.html`
- Modify: `worker/src/worker.js`
- Modify: `tools/tests/build-dist.test.mjs`
- Modify: `tools/tests/worker-planner-v2.test.mjs`
- Modify: `部署说明.md`

**Interfaces:**
- CLI: `--planner-rollout off|direct-recommend`
- Generated: `dist/build-meta.json` with `{ buildId, plannerRollout }`
- Health adds: `buildId`, `plannerRollout`
- Frontend: `plannerDirectRecommendEnabled()`

- [ ] **Step 1: 写构建参数失败测试**

扩展 `build-dist.test.mjs`：

```js
const meta = JSON.parse(fs.readFileSync(path.join(outputDir, 'build-meta.json'), 'utf8'));
assert.deepEqual(meta, { buildId:'canonical-test', plannerRollout:'direct-recommend' });
assert.doesNotMatch(builtIndex, /__YIGUOCHU_(BUILD_ID|PLANNER_ROLLOUT)__/);
assert.match(builtIndex, /const PLANNER_ROLLOUT = 'direct-recommend';/);
```

另断言无 `--planner-rollout` 时为 `off`，非法值构建退出非零。

- [ ] **Step 2: 写 health 失败测试**

在 Worker test 的 ASSETS fixture 提供 `/build-meta.json`，断言 `/health` 返回相同 build ID 和 rollout；资产缺失时返回 `null` 和 `off`，不能谎报启用。

- [ ] **Step 3: 运行测试并确认失败**

Run: `node --test tools/tests/build-dist.test.mjs tools/tests/worker-planner-v2.test.mjs`

Expected: FAIL，CLI 参数、meta 资产和 health 字段尚不存在。

- [ ] **Step 4: 实现构建注入**

`parseArgs()` 增加 `plannerRollout:'off'`；只接受 `off` 或 `direct-recommend`。构建时替换：

```js
const BUILD_ID = '__YIGUOCHU_BUILD_ID__';
const PLANNER_ROLLOUT = '__YIGUOCHU_PLANNER_ROLLOUT__';
```

写入 `build-meta.json`，加入构建文件计数。`plannerDirectRecommendEnabled()` 为：构建值启用，或 localhost 明确 query 启用；file/production 默认 false。

在前端初始化时写入：

```js
window.__YIGUOCHU_BUILD_META__ = Object.freeze({
  buildId: BUILD_ID,
  plannerRollout: PLANNER_ROLLOUT,
});
```

真实浏览器脚本同时比较该对象与 `/health`，任一不一致即拒绝继续。

- [ ] **Step 5: 实现 health 构建核验**

Worker 从同源 ASSETS 读取 `/build-meta.json`，只接受受控 rollout 值；`/health` 返回元数据。读取失败不影响健康检查其他字段，但 rollout 必须报告 `off`。

- [ ] **Step 6: 运行测试并确认通过**

Run: `node --test tools/tests/build-dist.test.mjs tools/tests/worker-planner-v2.test.mjs`

Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add tools/build-dist.mjs index.html worker/src/worker.js tools/tests/build-dist.test.mjs tools/tests/worker-planner-v2.test.mjs 部署说明.md
git commit -m "feat: add verifiable planner preview rollout"
```

### Task 7: 接通「直接推荐」候选页并隐藏清库存

**Files:**
- Modify: `index.html`
- Modify: `tools/tests/frontend-recipe-contract.test.mjs`
- Modify: `tools/tests/core-product-convergence.test.mjs`

**Interfaces:**
- State adds: `planCandidates: PlannerResult[]`
- View adds: `v2-candidates`
- UI actions: `choose-plan`, `request-plan-swap`, `edit-safe-profile`
- Default Preview flow: `/plan-meal` → candidate selection → `/generate-plan`

- [ ] **Step 1: 写默认路径零 LLM 候选失败测试**

在 frontend contract test 中启用 `PLANNER_ROLLOUT='direct-recommend'` 的构建 fixture，点击主按钮后断言：

```js
assert.deepEqual(calls.map(call => new URL(call.url, location.origin).pathname), ['/plan-meal']);
assert.equal(evaluate(context, 'state.view'), 'v2-candidates');
assert.equal(root.innerHTML.match(/data-act="choose-plan"/g).length, 2);
```

只有点击第二张候选后才出现 `/generate-plan`，envelope 中是第二张 `plan_id`。

- [ ] **Step 2: 写候选诚实展示失败测试**

构造 3/5 计划，断言页面同时显示：

- 「用上 3/5」；
- 三个 used item；
- 两个 unused item 和原因；
- allowed required extras；
- 不显示任何 unused 食材在候选标题中；
- `candidate_plans=[]` 时显示“当前还没有足够可靠的一锅组合”和「修改食材」，不显示空卡。

- [ ] **Step 3: 写清库存隐藏失败测试**

Preview rollout 开启时不提供可点击 pantry 模式。若旧 localStorage 保存 `mode:'pantry'`，初始化迁移为 recommend，并展示一次非交互说明「清库存正在做，先来解决今晚吃什么」。不得发送 must_use。

- [ ] **Step 4: 运行测试并确认失败**

Run: `node --test tools/tests/frontend-recipe-contract.test.mjs tools/tests/core-product-convergence.test.mjs`

Expected: FAIL，默认 Preview 仍走 legacy 或 Planner 自动生成，没有候选 view。

- [ ] **Step 5: 实现候选页状态机**

`runPrimaryFlow()` 在 rollout 开启时调用：

```js
return runPlannerFlow({ autoGenerate:false, showCandidates:true });
```

`runPlannerFlow()` 将 `candidate_plans` 存入 `state.planCandidates`，进入 `v2-candidates`。`plannerCandidatesScreen()` 只渲染服务端已经过门槛的 1–3 张卡；每张显示 coverage、used、unused、extras、时间和确定性结构标签。

候选标题由前端受控映射生成，不显示内部 `template_id`，也不引入未使用食材：

```js
const PLAN_FORM_LABELS = Object.freeze({
  'acid-staple-pot':'酸香主食锅',
  'savory-mixed-rice-pot':'家常焖饭锅',
  'cooked-rice-stir-pot':'熟饭快炒锅',
  'broth-noodle-pot':'汤面锅',
  'egg-tofu-vegetable-pot':'蛋豆腐蔬菜锅',
  'mushroom-vegetable-stew-pot':'菌菇蔬菜锅',
  'beef-staple-pot':'牛肉主食锅',
  'poultry-staple-pot':'鸡肉主食锅',
  'mushroom-aroma-rice-pot':'菌菇香饭锅',
  'broth-rice-pot':'汤饭锅',
  'braised-noodle-pot':'焖面锅',
});
function candidateHeading(candidate) {
  const used = planItems(candidate.plan.planned_prefer_use);
  const ingredients = used.slice(0, 3).join('、');
  const suffix = used.length > 3 ? `等${used.length}种食材` : '';
  return `${ingredients}${suffix} · ${PLAN_FORM_LABELS[candidate.plan.pots[0].template_id]}`;
}
```

任何 active template 缺少受控 label 都使前端契约测试失败，禁止退回显示 template ID。

`choose-plan` 按 plan ID 从 `state.planCandidates` 取完整 plan，设置 `displayedPlan` 后调用一次 `generateDisplayedPlan()`。

- [ ] **Step 6: 保留失败和换一换出口**

- 候选失败页保持稳定，不被动画计时器覆盖；
- 生成失败保留选中的 plan 和手动重试入口；
- `no_alternative_plan` 保留当前成品和修改食材入口；
- 页面不显示未贯通的“用剩余食材再来一锅”。

- [ ] **Step 7: 运行测试并确认通过**

Run: `node --test tools/tests/frontend-recipe-contract.test.mjs tools/tests/core-product-convergence.test.mjs`

Expected: PASS。

- [ ] **Step 8: 提交**

```bash
git add index.html tools/tests/frontend-recipe-contract.test.mjs tools/tests/core-product-convergence.test.mjs
git commit -m "feat: make planner candidates the preview primary flow"
```

### Task 8: 建立 30 条影子对照和性能门

**Files:**
- Create: `tools/data/direct-recommend-shadow-v1.json`
- Create: `tools/run-direct-recommend-shadow.mjs`
- Create: `tools/run-direct-recommend-preview-gate.mjs`
- Create: `tools/tests/direct-recommend-shadow.test.mjs`
- Modify: `docs/pantry-planner-v2-preview-feedback.md`
- Modify: `部署说明.md`

**Interfaces:**
- `node tools/run-direct-recommend-shadow.mjs`
- `node tools/run-direct-recommend-preview-gate.mjs --url <preview-url> --build-id <id> --samples 100`
- Outputs JSON summary with recognition, coverage, extra major items, state changes, safety, error counts and latency percentiles.

- [ ] **Step 1: 写 corpus schema 失败测试**

Corpus 固定包含以下 30 条：

1. 空食材 normal；
2. 鸡蛋；
3. 螺丝钉；
4. 鸡腿、土豆；
5. 虾仁、玉米；
6. 面条、猪里脊、白菜、香菇、胡萝卜；
7. 大米、牛里脊、番茄、鸡蛋、西兰花；
8. 番茄、金针菇、鸡蛋、西兰花；
9. 豆腐、青菜；
10. 剩米饭、鸡蛋；
11. 大米、虾仁、白菜、玉米、番茄；
12. 鸡胸肉、土豆、洋葱、胡萝卜、西兰花、玉米、豆腐、鸡蛋；
13. 番茄、鸡蛋、豆腐、青菜、剩米饭；
14. 牛里脊、豆腐、番茄、鸡蛋、青菜；
15. 鸡腿、大米、胡萝卜、香菇、土豆；
16. 虾仁、白菜、玉米、大米；
17. 番茄、鸡蛋，忌口鸡蛋；
18. 大米、鸡肉，忌口大米；
19. 鸡腿、土豆，intent quick；
20. 豆腐、青菜、金针菇，intent fresh；
21. 大米、鸡胸肉、洋葱，intent batch；
22. 牛腩、熟米饭；
23. 牛肉末、面条；
24. 大米、剩米饭、鸡蛋；
25. 神秘叶子、番茄；
26. 番茄、鸡蛋、豆腐、西兰花、白菜、香菇、胡萝卜；
27. 鸡蛋、西红柿、土豆、鸡胸肉、西兰花、豆腐、胡萝卜、洋葱、虾仁、香菇、白菜、青椒、茄子、菠菜、玉米、金针菇、大米、面条、剩米饭、牛里脊（20 种去重输入）；
28. 豆腐、老豆腐、青菜；
29. 豆腐、青菜：选择首计划后换一换，验证可返回第二套同等承诺计划；
30. 番茄、大米：选择唯一可靠计划后换一换，验证 `no_alternative_plan`。

测试断言 ID 唯一、总数 30、每条含 mode/intent/servings/prefer_use/dislikes 和预期门槛字段。

- [ ] **Step 2: 写 shadow 评分失败测试**

脚本必须输出：

```js
{
  journey_id,
  build_source,
  recognized_count,
  submitted_count,
  best_used_count,
  coverage_ratio,
  extra_major_items,
  state_transitions,
  safety_failures,
  candidate_count,
  legacy_best_used_count,
  review_required
}
```

测试用 fixture 验证旧路径通过额外鸡肉刷高覆盖时 `review_required=true`，不能直接判 V2 落后。

- [ ] **Step 3: 写 Preview gate 统计失败测试**

用本地 HTTP fixture 返回 100 个延迟样本，断言 P95 取排序后第 95 个（1-based）；任何非 JSON Content-Type、JSON 解析失败、5xx 或 `/health` 构建号不一致使进程退出 1。

- [ ] **Step 4: 运行测试并确认失败**

Run: `node --test tools/tests/direct-recommend-shadow.test.mjs`

Expected: FAIL，corpus 和脚本尚不存在。

- [ ] **Step 5: 实现纯确定性 shadow runner**

V2 直接导入 planner；legacy 复用 Worker 已有 `selectRecipeCandidates`，不得复制算法。两边使用同一输入。报告写 stdout JSON，不发送 DeepSeek 请求。

通过条件：V2 正常候选达到门槛、额外主要食材为 0、生熟/部位错误为 0、安全错误为 0；综合有效覆盖不劣于 legacy，争议项进入人工列表而非自动伪判。

- [ ] **Step 6: 实现 Preview API 性能门**

脚本先请求 `/health` 核对 `buildId`、`plannerRollout:'direct-recommend'`；预热 5 次；顺序运行 100 次；用 `performance.now()` 计时到 `response.json()` 完成；输出 p50/p95/max、bad_json、5xx、non_json 和 build metadata。

- [ ] **Step 7: 运行测试与本地脚本**

Run:

```bash
node --test tools/tests/direct-recommend-shadow.test.mjs
node tools/run-direct-recommend-shadow.mjs
```

Expected: test PASS；30 条 shadow 全部有结果，硬门槛为 0 失败。

- [ ] **Step 8: 提交**

```bash
git add tools/data/direct-recommend-shadow-v1.json tools/run-direct-recommend-shadow.mjs tools/run-direct-recommend-preview-gate.mjs tools/tests/direct-recommend-shadow.test.mjs docs/pantry-planner-v2-preview-feedback.md 部署说明.md
git commit -m "test: add direct recommendation preview gates"
```

### Task 9: 全量验证、Preview 构建与 Pilot 安全门

**Files:**
- Modify: `docs/pantry-planner-v2-preview-feedback.md`
- Modify: `docs/first-customers-pilot.md`
- Modify: `部署说明.md`

**Interfaces:**
- Produces a Preview build ID tied to exact commit SHA。
- Does not deploy production or merge the Draft PR。

- [ ] **Step 1: 运行全部自动测试**

Run:

```bash
node --test tools/tests/*.test.mjs
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
node tools/run-direct-recommend-shadow.mjs
python3 -m py_compile ai_proxy.py
```

Expected: 全部 exit 0；recipe 总数 72；无 validator、planner journey 或 parity 失败。

- [ ] **Step 2: 运行构建一致性检查**

Run:

```bash
node --test tools/tests/build-dist.test.mjs
BUILD_ID="direct-recommend-$(git rev-parse --short HEAD)"
node tools/build-dist.mjs --out-dir dist --build-id "$BUILD_ID" --planner-rollout direct-recommend
```

Expected: `dist/build-meta.json` 的 build ID 与 HEAD 一致，rollout 为 `direct-recommend`；源依赖图、72 道 recipe 和 Planner 资产全部进入 dist。

- [ ] **Step 3: 完成 DeepSeek key 轮换门**

由密钥持有人在 DeepSeek 控制台撤销可能暴露的旧 key，创建新 key；更新本地 `.env` 和 Cloudflare Preview Secret。执行人员不得读取、回显、提交或把 key 写进命令历史/日志。用一次不打印请求头的 Preview generation smoke 确认新 key 生效，旧 key 已失效。

Expected: 旧 key 无效；新 key 仅存在本地 ignored `.env` 与 Cloudflare secret；git diff 不含任何 secret。

- [ ] **Step 4: 提交验证文档更新**

在 feedback/pilot 文档记录精确 build ID、自动测试结果、shadow 结果、key rotation 完成状态和待执行浏览器旅程，不写 secret 值。

Pilot 记录模板必须保留两条判定：D2 原话问题“你有没有想过一次把冰箱里的东西都用完？当时怎么办的？”；`≥3/5` 第二天愿意再用为通过，`1–2/5` 逐条复盘，`0/5` 回到首屏和核心承诺。点击次数不得替代“是否真正做完一顿饭”。

```bash
git add docs/pantry-planner-v2-preview-feedback.md docs/first-customers-pilot.md 部署说明.md
git commit -m "docs: record direct recommendation pilot gates"
```

- [ ] **Step 5: 代码审阅通过后只部署 Preview**

Run:

```bash
npx wrangler pages deploy dist \
  --project-name yiguochu \
  --branch recipe-validation \
  --commit-dirty=true \
  --commit-message "direct recommendation preview"
```

Expected: 返回非 production Preview URL；不使用 `--branch main`。

- [ ] **Step 6: 核对线上构建标识**

Run:

```bash
curl -sS "$PREVIEW_URL/health"
node tools/run-direct-recommend-preview-gate.mjs \
  --url "$PREVIEW_URL" \
  --build-id "$BUILD_ID" \
  --samples 100
```

Expected: health 中 build ID、rollout、Planner 版本、72 道 recipe 和资产状态均匹配；100 次请求 `bad_json=0`、`5xx=0`、P95<2000ms。

- [ ] **Step 7: 运行 30 条真人浏览器点击门**

复测者使用真实 Chrome 手机视口逐条点击 Task 8 corpus：填写/选择食材 → 点击开始 → 等候候选 → 检查 coverage/used/unused/extras → 选择候选 → 等候成品 → 换一换。每条记录截图、候选出现耗时、生成结果、按钮反馈和 build ID。

Expected: 30/30 完成；候选 P95<2000ms；bad_json=0；5xx=0；模型越界=0；标题矛盾=0；按钮无反馈=0。

- [ ] **Step 8: 更新最终 Preview 记录并停在 Pilot 发放门**

将浏览器结果写入 `docs/pantry-planner-v2-preview-feedback.md`。只有全部门槛通过才标记“可发 5 人链接”；否则记录失败旅程并停止，不部署 production、不合并 PR。

```bash
git add docs/pantry-planner-v2-preview-feedback.md
git commit -m "docs: record direct recommendation browser gate"
```

---

## 实施完成定义

实施只有同时满足以下条件才算完成：

- Preview 默认用户走确定性直接推荐候选页；
- 清库存未作为可用功能开放；
- 首页常用食材 100% 识别，虾仁和玉米有受控语义；
- 候选覆盖门槛按向上取整执行；
- 顶层和锅级覆盖字段一致；
- 候选 1–3 张且不凑数；
- 候选阶段 0 次 DeepSeek；
- 任意被选 candidate plan ID 都能由服务端重算验证；
- 换一换遵守当前硬排除、7 天软降权；
- locked grams 为 Ratio DSL 规范化整数，模型漂移为 0；
- 30 条 shadow、100 次 Preview API 和 30 条真人浏览器旅程全部通过；
- DeepSeek key 已轮换且未进入代码/日志；
- production 未动，Draft PR 未合并；
- Pilot 链接仍由人工在所有门槛通过后发放。

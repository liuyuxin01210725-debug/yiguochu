# Recipe-Grounded Hybrid Recommendation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让一锅出的候选与成品能够真正执行已有可信菜谱的菜名、食材身份、专属技法和比例，同时保留受控自定义方案处理长尾组合，并诚实满足用户食材覆盖承诺。

**Architecture:** 新增独立的 recipe runtime catalog，将“生产菜谱存在”与“已具备运行时菜式身份”分开；服务端先生成 named recipe 候选，再生成 custom template 候选，经过统一安全与最低覆盖硬门后按菜式身份仲裁。生成阶段按 `plan_source` 分流到 recipe-specific compiler 或现有 generic compiler，前端只显示服务端签发的 presentation，不再拼接菜名。

**Tech Stack:** 原生 HTML/JavaScript、Cloudflare Pages Worker、Node.js `node:test`、JSON 机器资产、现有 ingredient taxonomy / Ratio DSL / Planner V2、本地 Python bridge、真实 Chrome 手机视口。

## Global Constraints

- 不新增 recipe；生产菜谱总数保持 72。
- 首批只处理现有 6 道：中国菜饭/焖面运行时试点：`shanghai-salted-pork-vegetable-rice`、`xinjiang-lamb-pilaf`、`north-china-green-bean-braised-noodles`、`cantonese-cured-meat-claypot-rice`、`quanzhou-oil-rice`、`taiwan-cabbage-mushroom-rice`。
- `auto_approved` 不等于人工批准；runtime catalog 使用独立的 `planned|preview_enabled` 状态，页面不得宣称“人工批准、标准、正宗或官方做法”。
- 只有独立菜式身份依据、机器身份、专属技法、Ratio DSL 唯一默认值、受控调味、安全、来源声明和至少一次真实家庭试做记录均完整的条目才可 `preview_enabled`；缺一项 fail closed。
- 先执行安全、味觉兼容与最低覆盖硬门；通过后按 canonical named > approved variant > style adaptation > custom 排序，再比较实际覆盖数。
- 直接推荐最低覆盖固定为：1→1、2→2、3→2、4→3、5→4、6→4；7–10 项不强塞一锅。
- 每项用户输入必须显示为已用、未用或未识别；没有数量输入不得宣称“用完库存”。
- DeepSeek 不决定菜式身份、食材、替换、技法、调味、比例或安全；Preview 的确定性路径保持 0 次模型调用。
- 不增加账号、用户画像、营养追踪、行为遥测、多 Agent 产品能力或 production 部署。
- 每个任务先写失败测试并确认红灯，再做最小实现、确认绿灯、独立提交。

---

## File Structure

- `tools/data/recipe-runtime.v1.json`：首批 recipe 的机器身份、activation、专属执行图和 ratio 引用。
- `worker/src/recipe-runtime-validator.js`：runtime catalog 的 schema、跨资产引用和 fail-closed 校验。
- `tools/lib/recipe-runtime-validator.mjs`：工具层对权威 validator 的薄导出。
- `worker/src/recipe-runtime-matcher.js`：纯函数 named/variant 匹配，不负责 HTTP 或 UI。
- `worker/src/recipe-runtime-compiler.js`：把已匹配 named candidate 编译成 locked recipe meal。
- `worker/src/planner-v2.js`：统一覆盖门、hybrid 仲裁、plan identity 与 swap 差异。
- `worker/src/generated-plan-contract.js`：named/custom 双编译入口和统一越界校验。
- `worker/src/worker.js`：资产加载、HTTP 重算、health 元数据。
- `index.html`：只消费服务端 presentation；不再自行生成菜名。

---

### Task 1: 建立独立的 Recipe Runtime Catalog 与门禁

**Files:**
- Create: `tools/data/recipe-runtime.v1.json`
- Create: `worker/src/recipe-runtime-validator.js`
- Create: `tools/lib/recipe-runtime-validator.mjs`
- Create: `tools/tests/recipe-runtime-validator.test.mjs`
- Modify: `tools/check-recipes.mjs`

**Interfaces:**
- Produces: `validateRecipeRuntimeCatalog(catalog, { recipes, taxonomy, templates, ratios }): string[]`
- Produces: `assertRecipeRuntimeCatalog(...)`
- Catalog version: `recipe-runtime-v1-20260730-r1`
- Activation states: `planned|preview_enabled`

- [ ] **Step 1: 写 catalog schema 与引用完整性的失败测试**

测试必须覆盖：6 个现有 recipe ID 全部存在且不重复；canonical ids、template ids、ratio ids、safety endpoints 都能反查权威资产；canonical 名称必须有项目自身页面以外的 HTTPS 身份依据；`preview_enabled` 缺少唯一比例默认值或结构化家庭试做记录时失败；`auto_approved` 不会自动改变 runtime activation；未知字段、未知 recipe、未知 ratio 和自由文本替换都失败。

- [ ] **Step 2: 运行测试确认红灯**

Run:

```bash
node --test tools/tests/recipe-runtime-validator.test.mjs
```

Expected: FAIL，原因是 catalog 与 validator 尚不存在。

- [ ] **Step 3: 写最小 validator 与 planned catalog**

每条 entry 至少包含：

```json
{
  "recipe_id": "...",
  "activation_status": "planned",
  "identity_level": "canonical",
  "identity_evidence": [],
  "identity_signature": {
    "required_canonical_ids": [],
    "required_states_or_cuts": [],
    "forbidden_canonical_ids": []
  },
  "approved_variants": [],
  "template_id": "...",
  "slot_assignment": {},
  "ratio_rule_ids": [],
  "technique_graph": [],
  "seasoning_actions": [],
  "safety_endpoints": [],
  "naming": {},
  "source_claims": [],
  "household_trial": null
}
```

先把 6 条身份数据写成 `planned`；禁止为了让校验通过虚构未有依据的数值。

- [ ] **Step 4: 将 runtime validator 接入聚合门禁**

`tools/check-recipes.mjs` 必须读取 catalog，并把 runtime 错误加入现有 `errors`。输出摘要须区分 `planned` 与 `preview_enabled` 数量。

- [ ] **Step 5: 运行定向测试与菜谱门禁**

Run:

```bash
node --test tools/tests/recipe-runtime-validator.test.mjs
node tools/check-recipes.mjs
```

Expected: PASS；72 recipes 不变，runtime 6 planned、0 preview-enabled。

- [ ] **Step 6: 提交**

```bash
git add tools/data/recipe-runtime.v1.json worker/src/recipe-runtime-validator.js tools/lib/recipe-runtime-validator.mjs tools/tests/recipe-runtime-validator.test.mjs tools/check-recipes.mjs
git commit -m "feat: add recipe runtime identity catalog"
```

### Task 2: 让 Ratio DSL 支持 Recipe-Specific Machine Rules

**Files:**
- Modify: `tools/data/ratio-rules.v1.json`
- Modify: `worker/src/ratio-dsl.js`
- Modify: `tools/tests/ratio-dsl.test.mjs`
- Modify: `tools/data/recipe-runtime.v1.json`
- Modify: `tools/tests/recipe-runtime-validator.test.mjs`

**Interfaces:**
- Extends `when` with exactly one scope: template scope or `recipe_id` scope。
- `compileRatioPlan(ruleId, context, ratioCatalog)` remains the single grams/liquid calculator.
- Recipe rules may reference canonical ingredients directly; natural-language `recipe.ratio_rules` never enters arithmetic.

- [ ] **Step 1: 写 recipe-scoped Ratio DSL 失败测试**

覆盖：template 与 recipe scope 互斥；recipe ID 必须存在；required ingredient 每项有唯一 quantity operation；raw/cooked/soaked state 不可混用；液体、油、盐仍受基础补充白名单限制；小数只经过现有 `normalizeRatioGrams()` 一次。

- [ ] **Step 2: 运行测试确认红灯**

Run: `node --test tools/tests/ratio-dsl.test.mjs tools/tests/recipe-runtime-validator.test.mjs`

Expected: FAIL，现有 validator 不接受 `when.recipe_id`。

- [ ] **Step 3: 实现 recipe scope 与机器规则**

只把现有生产 recipe 已明确的范围转换成不可执行的 `bounds_only` 机器记录：上海咸肉菜饭 125–140g/100g 生米；新疆抓饭 135–150g/100g 生米且液体资源为熟制余液；台湾炊饭的基础版与番茄虾仁版；泉州浥饭 90–110g/100g 泡发糯米。范围本身不得擅自取中点作为 `default`；只有真实试做确认唯一默认值并记录依据后，规则才能成为 executable。没有明确数字的广式煲仔饭与豆角焖面继续 `planned`，不得借通用 template 数值伪装专属比例。

- [ ] **Step 4: 让 runtime catalog 引用 recipe rule IDs**

有完整且 executable 机器规则的 entry 才能继续进入后续 matcher 候选；planned 条目仍可被 shadow 诊断，但不得公开 canonical presentation。测试 fixture 可以提供明确的校准默认值来验证 matcher/compiler，权威生产 catalog 不得借 fixture 值提前激活。

- [ ] **Step 5: 运行 ratio 与聚合门禁**

Run:

```bash
node --test tools/tests/ratio-dsl.test.mjs tools/tests/recipe-runtime-validator.test.mjs
node tools/check-recipes.mjs
```

Expected: PASS；自然语言比例不参与计算。

- [ ] **Step 6: 提交**

```bash
git add tools/data/ratio-rules.v1.json worker/src/ratio-dsl.js tools/tests/ratio-dsl.test.mjs tools/data/recipe-runtime.v1.json tools/tests/recipe-runtime-validator.test.mjs
git commit -m "feat: add recipe scoped ratio contracts"
```

### Task 3: 实现 Pure Named Recipe Matcher 与 Hybrid 仲裁

**Files:**
- Create: `worker/src/recipe-runtime-matcher.js`
- Create: `tools/tests/recipe-runtime-matcher.test.mjs`
- Modify: `worker/src/planner-v2.js`
- Modify: `tools/tests/pantry-planner-v2-selection.test.mjs`
- Modify: `tools/tests/pantry-planner-v2-identity.test.mjs`

**Interfaces:**
- Produces: `matchNamedRecipeCandidates(assets, normalizedRequest): NamedCandidate[]`
- Named candidate fields: `plan_source, recipe_id, variant_id, identity_level, match_trace, presentation, normalized_items, planned_prefer_use, unused_prefer_use, unrecognized_items, coverage_ratio`.
- Coverage denominator: all de-duplicated submitted items, including unrecognized items.
- `plan_id` payload adds `recipe_runtime_catalog_version, plan_source, recipe_id, variant_id, identity_level`.

- [ ] **Step 1: 写身份匹配失败测试**

必须使用独立 fixture 覆盖：fixture 中的上海完整核心命中正式名称；菜心只命中 approved variant；缺咸肉或叶菜不能挂上海菜饭名；fixture 中的新疆完整核心命中，缺洋葱/胡萝卜降 custom；牛里脊不能填牛腩；猪肉末 shape 保留 ground。权威 catalog 仍为 `planned` 时只能记录 shadow miss，不作为 named candidate。

- [ ] **Step 2: 写排序与 plan identity 失败测试**

覆盖：named 3/4 在通过最低门后排在 custom 4/4 前；named 不能使 2 项输入的 1/2 获得豁免；recipe/variant 改变会改变 plan ID；相同 recipe/assignment 稳定复现同一 ID；custom 保持 `identity_level:"custom"`。

- [ ] **Step 3: 运行定向测试确认红灯**

Run:

```bash
node --test tools/tests/recipe-runtime-matcher.test.mjs tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/pantry-planner-v2-identity.test.mjs
```

- [ ] **Step 4: 实现 matcher、覆盖硬门与 hybrid 排序**

Matcher 只消费服务端资产；客户端提交的 `recipe_id` 一律忽略。`selectDiverseCandidates()` 先过滤安全和最低覆盖，再比较 identity、实际覆盖、额外主料、intent、负担、历史和稳定 key。不同候选必须在 recipe identity、template、关键技法或食材集合上有真实差异。

- [ ] **Step 5: 运行定向测试与现有 planner journeys**

Run:

```bash
node --test tools/tests/recipe-runtime-matcher.test.mjs tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/pantry-planner-v2-identity.test.mjs
node tools/run-pantry-planner-v2-journeys.mjs
```

- [ ] **Step 6: 提交**

```bash
git add worker/src/recipe-runtime-matcher.js worker/src/planner-v2.js tools/tests/recipe-runtime-matcher.test.mjs tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/pantry-planner-v2-identity.test.mjs
git commit -m "feat: rank named recipes with planner candidates"
```

### Task 4: 建立 Recipe-Specific Locked Compiler

**Files:**
- Create: `worker/src/recipe-runtime-compiler.js`
- Create: `tools/tests/recipe-runtime-compiler.test.mjs`
- Modify: `worker/src/generated-plan-contract.js`
- Modify: `tools/tests/worker-generate-plan.test.mjs`

**Interfaces:**
- Produces: `buildLockedRecipeMeal(plannerResult, runtimeEntry, ratioCatalog)`.
- `buildLockedPlanContract(plannerResult, templateCatalog, recipeRuntimeCatalog, ratioCatalog)` dispatches named/custom compilers.
- Locked/generated meal carries `plan_source, recipe_id, variant_id, identity_level, presentation`.

- [ ] **Step 1: 写专属做法与负向失败测试**

覆盖：上海咸肉与米先起香、叶菜后放、尝味后才补盐；新疆严格为羊肉→洋葱胡萝卜→量熟制余液→加米；台湾基础版与番茄虾仁版执行不同液体合同；猪肉末任何路径都不能生成“切片/切薄片”；named 缺执行图、ratio 或安全终点必须 fail closed；custom 不得使用地域、正宗、传统、经典词。

- [ ] **Step 2: 运行测试确认红灯**

Run: `node --test tools/tests/recipe-runtime-compiler.test.mjs tools/tests/worker-generate-plan.test.mjs`

- [ ] **Step 3: 实现 named/custom 双编译**

Named 菜名只来自 runtime entry 的 canonical/approved variant naming；步骤只来自 `technique_graph`、受控 `seasoning_actions` 与 locked ratio facts。`seasoning_actions` 只接受 validator 白名单中的 `taste_before_salt|add_locked_salt|add_locked_oil|omit_extra_salt`，所有克数仍来自 Ratio DSL。Custom 保留 template compiler，但 `protein_pretreat` 必须按 `shape_or_cut` 分流：ground 只写“炒散/拨散”，slice 才允许“切片”，whole/leg/breast 使用各自受控语句。

- [ ] **Step 4: 继续使用统一越界校验**

食材集合、克数、顺序、安全终点、菜名和 identity 均逐项对账。任何 compiler 输出越界都返回现有确定性错误，不自动重试、不回退成 generic 还保留原菜名。

- [ ] **Step 5: 运行生成契约测试**

Run:

```bash
node --test tools/tests/recipe-runtime-compiler.test.mjs tools/tests/worker-generate-plan.test.mjs
```

- [ ] **Step 6: 提交**

```bash
git add worker/src/recipe-runtime-compiler.js worker/src/generated-plan-contract.js tools/tests/recipe-runtime-compiler.test.mjs tools/tests/worker-generate-plan.test.mjs
git commit -m "feat: compile recipe specific deterministic meals"
```

### Task 5: 接通 Worker、Build、Local Bridge 与 Health

**Files:**
- Modify: `worker/src/worker.js`
- Modify: `tools/build-dist.mjs`
- Modify: `tools/planner-v2-local-bridge.mjs`
- Modify: `tools/tests/worker-planner-v2.test.mjs`
- Modify: `tools/tests/build-dist.test.mjs`
- Modify: `tools/tests/planner-v2-parity.test.mjs`

**Interfaces:**
- Planner assets add `recipeRuntime` and expose `recipeRuntimeCatalogVersion`.
- `/plan-meal` signs server-derived recipe identity into candidate/plan ID.
- `/generate-plan` recomputes membership by plan ID and never trusts client recipe fields.
- `/health` reports runtime catalog status and preview-enabled count.

- [ ] **Step 1: 写 HTTP、build 与 parity 失败测试**

覆盖：runtime asset 缺失/非法时 health unavailable 且 planning fail closed；named candidate 通过 `/plan-meal` 出现；伪造 recipe ID 或 stale plan ID 在 `/generate-plan` 返回 409；build 输出和 embedded worker 字节/版本一致；本地 bridge 与 Worker 对同一请求得到相同 identity、title、plan ID。

- [ ] **Step 2: 运行测试确认红灯**

Run:

```bash
node --test tools/tests/worker-planner-v2.test.mjs tools/tests/build-dist.test.mjs tools/tests/planner-v2-parity.test.mjs
```

- [ ] **Step 3: 接入权威资产与服务器重算**

更新 `PLANNER_ASSET_PATHS`、compiled assets、validator preparation、generation contract 参数和 health。不得给 Python 单独复制业务规则；本地代理继续通过 Node bridge 复用生产模块。

- [ ] **Step 4: 运行 HTTP、build 与 Python 语法检查**

Run:

```bash
node --test tools/tests/worker-planner-v2.test.mjs tools/tests/build-dist.test.mjs tools/tests/planner-v2-parity.test.mjs
python3 -m py_compile ai_proxy.py
```

- [ ] **Step 5: 提交**

```bash
git add worker/src/worker.js tools/build-dist.mjs tools/planner-v2-local-bridge.mjs tools/tests/worker-planner-v2.test.mjs tools/tests/build-dist.test.mjs tools/tests/planner-v2-parity.test.mjs
git commit -m "feat: serve recipe grounded planner assets"
```

### Task 6: 前端只显示服务端签发的真实名称与身份

**Files:**
- Modify: `index.html`
- Modify: `tools/tests/frontend-recipe-contract.test.mjs`
- Modify: `tools/tests/frontend-planner-v2-flow.test.mjs`

**Interfaces:**
- Server presentation: `{ badge, title, subtitle, source_label, canonical_path }`.
- Frontend never derives identity or dish title from `template_id`.

- [ ] **Step 1: 写候选卡与成品一致性失败测试**

覆盖：canonical badge 显示“依据菜谱”及真实标题，不出现“人工批准/标准/正宗”暗示；variant 明示替换版；custom 显示“自定义方案”且不含地域/正宗/传统/经典；named 3/4 与 custom 4/4 都显示精确覆盖；选卡后成品 title/badge/recipe ID 与卡片一致；presentation 缺失或非法时该卡不可点击，不能重新拼接名称。

- [ ] **Step 2: 写换一换与错误页回归测试**

换一换必须得到真正不同 plan；无替代保留当前菜；生成失败保留 plan；错误页不被动画覆盖；2 项输入不展示 1/2；未识别食材必须单独列在 `unrecognized_items`，覆盖分母包含全部去重输入；7–10 项直接停止候选并保留输入，引导用户删减到本顿优先的 3–5 项。

- [ ] **Step 3: 运行测试确认红灯**

Run:

```bash
node --test tools/tests/frontend-recipe-contract.test.mjs tools/tests/frontend-planner-v2-flow.test.mjs
```

- [ ] **Step 4: 删除前端菜名拼接职责**

停用 `candidateHeading()`、`PLAN_FORM_LABELS` 和 `candidateFormLabel()` 作为 title 来源；候选页和成品页只消费经过服务端校验的 presentation。Custom 标题仍由服务端受控命名器生成，只取 1–2 个决定性食材与真实技法名称。

- [ ] **Step 5: 运行前端定向测试**

Run:

```bash
node --test tools/tests/frontend-recipe-contract.test.mjs tools/tests/frontend-planner-v2-flow.test.mjs
```

- [ ] **Step 6: 提交**

```bash
git add index.html tools/tests/frontend-recipe-contract.test.mjs tools/tests/frontend-planner-v2-flow.test.mjs
git commit -m "feat: present named recipes without synthetic titles"
```

### Task 7: 完成首批身份审计、旅程门与本地真浏览器验证

**Files:**
- Modify: `tools/data/recipe-runtime.v1.json`
- Create: `docs/recipe-runtime-preview-review.md`
- Create: `tools/tests/recipe-runtime-journeys.test.mjs`
- Modify: `tools/data/pantry-planner-v2-journeys.json`
- Modify: `tools/run-pantry-planner-v2-journeys.mjs`
- Modify: `docs/pantry-planner-v2-preview-feedback.md`

**Interfaces:**
- Promotion gate: `planned -> preview_enabled` only when independent identity evidence, ratio default, technique, controlled seasoning, safety, source, deterministic journey and a structured household trial all pass.
- Browser evidence stays outside `dist`; no production deploy.

- [ ] **Step 1: 写首批 6 道身份审核表**

逐条记录 exact name claim、项目自身页面以外的身份依据、required core、allowed variants、machine ratio bounds、经试做确认的唯一默认值、technique order、seasoning、safety、source scope、家庭试做结果与未解决项。没有真实试做记录时全部保持 `planned`；广式煲仔饭和豆角焖面若仍无专属 numeric ratio，也必须留在 `planned`，不能为了数量放行。

- [ ] **Step 2: 写真实旅程失败测试**

至少覆盖：上海完整/缺核心/菜心版；新疆完整/缺洋葱/缺胡萝卜；台湾基础/番茄虾仁版；泉州泡发糯米 shape；豆角焖面猪肉末 custom 不切片；named 3/4 vs custom 4/4；2/2 覆盖；过敏；换一换；卡片到成品一致；全旅程 0 DeepSeek。

- [ ] **Step 3: 运行测试并按审核结果激活**

只把通过所有门且已有结构化家庭试做记录的 entry 改为 `preview_enabled`。本轮没有试做记录时，使用专门 fixture 验证完整 named 链路，但权威 catalog 继续保持 `planned`；保留基础设施并记录具体激活条件，绝不伪造试做。

- [ ] **Step 4: 跑完整静态、菜谱、Python 与构建门**

Run:

```bash
node --test --test-concurrency=1 tools/tests/*.test.mjs
node tools/check-recipes.mjs
node tools/check-foods.mjs
node tools/run-pantry-planner-v2-journeys.mjs
python3 -m py_compile ai_proxy.py
node tools/build-dist.mjs --out-dir dist/recipe-grounded-test --build-id recipe-grounded-test --planner-rollout direct-recommend --generation-mode deterministic
```

Expected: 0 failures；build 仍为 72 recipes；health/runtime versions 一致。

- [ ] **Step 5: 启动本地真实浏览器并多轮点击**

使用 `start.command` 启动 localhost，Chrome 手机视口至少跑 30 条点击旅程；保存候选耗时、选卡、生成、换一换、used/unused、标题/步骤和截图。重点人工阅读：真实名称是否准确、custom 是否诚实、步骤是否可执行、猪肉末是否仍出现形态错误。

- [ ] **Step 6: 更新反馈文档并提交**

```bash
git add tools/data/recipe-runtime.v1.json docs/recipe-runtime-preview-review.md tools/tests/recipe-runtime-journeys.test.mjs tools/data/pantry-planner-v2-journeys.json tools/run-pantry-planner-v2-journeys.mjs docs/pantry-planner-v2-preview-feedback.md
git commit -m "test: gate recipe grounded recommendation journeys"
```

---

## Completion Gate

实施完成不等于 production 上线。只有以下全部满足才可讨论 Preview 部署：

- 72 recipes，不新增 recipe；
- 至少 3 道 runtime identity 在独立身份审核和真实家庭试做后 `preview_enabled`；没有达到时只算代码基础设施完成，不讨论 Preview 部署；
- named recipe 标题、步骤、ratio、调味和 safety 全部来自专属合同；
- custom 不使用地域/正宗/传统/经典身份词；
- 2 项输入不展示 1/2，其他输入达到规格覆盖门槛；
- 卡片、plan ID、生成成品 identity 完全一致；
- 全程 0 DeepSeek；
- 全量 tests、`check-recipes`、`check-foods`、planner journeys、Python syntax、build consistency 全绿；
- 30 条真实 Chrome 手机点击旅程完成并人工读过步骤；
- 不部署 production，不合并 Draft PR。

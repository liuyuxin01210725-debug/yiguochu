# Middle Yangtze Main-Meal Research Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为长江中游（湖北、湖南、江西）建立首个可校验的地域主餐研究覆盖层，在当前 0 道 production mapping、0 条 research candidate mapping 的真实空白上，形成可继续扩展的地域线索、技法边界、安全边界和家庭旅程，而不是为补数字直接增加固定菜谱。

**Architecture:** 新增独立的 `middle_yangtze` 研究覆盖层，只读现有 72 道 recipe、24 条 regional research ledger、全国地域地图和 regional mapping。覆盖层记录三省 gap audit、8 条 concrete research leads、11 条固定来源、8 种家族、食材加工形态、2 类安全边界和 15 条家庭旅程；纯函数 validator、builder、renderer 与固定输入 CLI 生成机器快照和人工评审文档。研究资产不进入 `dist`，不被 Planner、Worker、前端、本地代理或 DeepSeek 读取。

**Tech Stack:** Node.js ESM、`node:test`、JSON 源账本、确定性 JSON/Markdown renderer、现有 recipe/candidate/atlas/mapping 数据、政府与权威媒体来源。

## Global Constraints

- 只研究 `region_id: "middle_yangtze"` 与 `CN-HB`、`CN-HN`、`CN-JX` 三个省级节点。
- 现有生产 recipe 保持 72 道（12 `approved` + 60 `auto_approved`）；现有 24 条 regional research ledger 不变。
- 本轮 0 production、0 candidate 是需要如实保留的基线，不用虚构映射填空。
- 不修改 `index.html`、`worker/src/`、`ai_proxy.py`、Planner、template、ingredient taxonomy、Ratio DSL、营养库或 DeepSeek 契约。
- recipe 仍只提供技法、安全、比例和来源 evidence；template rules + taxonomy 才决定未来组合能力。本研究层本轮两者都不改。
- 武汉三鲜豆皮是绿豆米浆蛋皮、熟糯米与荤素馅料组成的多阶段结构，不得压成“普通一锅焖饭”。
- 恩施豆皮、江西米粉等必须区分 ready/semi-finished staple 与从米浸泡、磨浆、成型的原料制造流程；产品只能在用户已有合格成品时研究家庭适配。
- 沔阳三蒸中的米粉裹蒸不能自动算作足量主食；未验证 staple sufficiency 前不得称完整主餐。
- 湖南社饭的地域结构可支持研究，但现有政府页面的比例文字自相矛盾，不转写为 Ratio DSL。
- 永州灰粽含草木灰碱水与约 10 小时煮制，是节令/工艺型线索，不进入 quick 或首轮家庭模板。
- 南昌炒米粉和南丰米粉碗可以作为 ready rice noodle 家族研究；干米粉必须另有浸泡/预煮阶段。
- 南昌瓦罐汤配米粉是两容器组合，不得误写成同锅主餐。
- 湿米粉安全不能只靠“彻底加热”：已产生的米酵菌酸耐热，必须同时约束正规来源、保质期、冷藏和异常丢弃。
- 动物性食材、水产品须烧熟煮透并生熟分开；安全来源不自动提供本项目具体分钟、克数或液体比例。
- 来源只存元数据和简短事实摘要，不复制完整步骤、长段原文或图片。
- 构建与检查调用 DeepSeek 0 次，不自动抓取网页。
- 不部署 Preview，不部署 production，不合并 Draft PR #1。

## File Map

- `tools/data/middle-yangtze-main-meal-research.v1.json` — 三省 gap audit、8 条 lead、10 条来源、8 种家族、边界和 15 条旅程的唯一源账本。
- `tools/lib/middle-yangtze-main-meal-research-validator.mjs` — schema、地域外键、来源反向证明、形态与安全反误导规则。
- `tools/lib/middle-yangtze-main-meal-research-builder.mjs` — 只读合并现有四类账本并生成研究报告。
- `tools/lib/middle-yangtze-main-meal-research-renderer.mjs` — 确定性 JSON/Markdown 输出。
- `tools/build-middle-yangtze-main-meal-research.mjs` — 固定输入 `--write|--check` CLI。
- `tools/generated/middle-yangtze-main-meal-research.v1.json` — 机器审计快照。
- `docs/middle-yangtze-main-meal-research.md` — 长江中游研究报告。
- `docs/middle-yangtze-main-meal-journey-review.md` — 15 条家庭旅程人工评审表，初始全部 `pending`。
- `tools/tests/middle-yangtze-main-meal-research-data.test.mjs` — 真实账本与证据边界测试。
- `tools/tests/middle-yangtze-main-meal-research-builder.test.mjs` — 报告、家族、覆盖与阻塞项测试。
- `tools/tests/middle-yangtze-main-meal-research-artifacts.test.mjs` — renderer、CLI freshness、总门禁与 `dist` 隔离测试。
- `tools/check-recipes.mjs` — 加入长江中游研究覆盖层与产物 freshness 检查。
- `tools/tests/recipe-library.test.mjs` — 总门禁临时沙箱复制新增研究数据。
- `部署说明.md` — 加入长江中游研究检查命令与非运行时边界。

## Stable Interfaces

```js
validateMiddleYangtzeMainMealResearch(inputs): string[]
buildMiddleYangtzeMainMealResearchReport(inputs): MiddleYangtzeMainMealResearchReport
validateMiddleYangtzeMainMealResearchReport(report): string[]
formatMiddleYangtzeMainMealResearchSummary(report): string
buildMiddleYangtzeMainMealResearchArtifacts(report): Map<string, string>
```

固定产物路径：

```js
new Map([
  ['tools/generated/middle-yangtze-main-meal-research.v1.json', jsonText],
  ['docs/middle-yangtze-main-meal-research.md', markdownText],
  ['docs/middle-yangtze-main-meal-journey-review.md', reviewMarkdown],
])
```

---

### Task 1: 建立三省空白、八条线索与证据边界账本

**Files:**
- Create: `tools/data/middle-yangtze-main-meal-research.v1.json`
- Create: `tools/lib/middle-yangtze-main-meal-research-validator.mjs`
- Create: `tools/tests/middle-yangtze-main-meal-research-data.test.mjs`

- [ ] **Step 1: 先写失败测试**

失败测试必须直接锁定：

- 三省 audit 恰为 `CN-HB`、`CN-HN`、`CN-JX`，每省当前 production/candidate 均为空；
- 8 条 lead 不得带 `production_recipe_id` 或 `candidate_id`；
- 武汉豆皮保持多阶段，恩施豆皮只接受 ready staple，沔阳三蒸保持 staple sufficiency 未证明；
- 湖南社饭比例冲突不得机器化，灰粽不得进入 quick；
- 江西炒米粉要求 ready/cooked noodle，瓦罐汤配米粉保持 two-vessel；
- 湿米粉安全同时包含采购/冷藏/时限/异常丢弃，不能只写烧熟；
- 15 条旅程全部 `pending`，错误根与 malformed nested row 不抛异常。

Run:

```bash
node --test tools/tests/middle-yangtze-main-meal-research-data.test.mjs
```

Expected: FAIL because the data and validator modules do not exist.

- [ ] **Step 2: 实现严格 validator 与固定数据**

来源包固定为 11 条：

1. 湖北文旅/湖北方志武汉三鲜豆皮；
2. 湖北文旅转载新华网恩施豆皮；
3. 湖北文旅沔阳三蒸技法；
4. 湖北文旅仙桃鳝鱼米粉；
5. 湖南省政府社饭；
6. 湖南省政府永州灰粽；
7. 大江网“粉江西”南昌炒米粉；
8. 大江网南丰水粉；
9. 大江网瓦罐汤与米粉的两容器组合边界；
10. 市场监管总局湿米粉/酵米面安全；
11. 市场监管总局肉禽蛋水产品熟透原则。

八条 lead 固定为：

- `hubei-wuhan-three-delicacy-doupi`
- `hubei-enshi-ready-doupi-bowl`
- `hubei-mianyang-mixed-grain-powder-steam`
- `hubei-xiantao-eel-rice-noodle-bowl`
- `hunan-xiangxi-shefan`
- `hunan-yongzhou-grey-zongzi`
- `jiangxi-nanchang-stir-fried-rice-noodle`
- `jiangxi-nanfeng-rice-noodle-bowl`

所有 `supported` claim 必须由 `source_refs[].proves` 精确反向证明；来源必须 HTTPS，项目 canonical URL 不能作地域证据。

- [ ] **Step 3: 运行专项测试并确认通过**

```bash
node --test tools/tests/middle-yangtze-main-meal-research-data.test.mjs
```

---

### Task 2: 构建报告、产品去向和 15 条家庭旅程

**Files:**
- Create: `tools/lib/middle-yangtze-main-meal-research-builder.mjs`
- Create: `tools/tests/middle-yangtze-main-meal-research-builder.test.mjs`

- [ ] **Step 1: 先写失败测试**

报告必须包含 3 个 province gap audit、8 条 lead、11 条来源、8 种独立 family 和 15 条 journey；`production_recipe_changes` 与 `regional_candidate_changes` 均为 0。

固定家族：

- `filled-glutinous-rice-crepe`
- `ready-rice-bean-sheet-bowl`
- `grain-powder-mixed-steam`
- `long-broth-eel-rice-noodle`
- `cured-meat-herb-glutinous-rice`
- `alkaline-ash-water-wrapped-rice`
- `ready-rice-noodle-stir-fry`
- `ready-rice-noodle-broth-or-stir`

固定阻塞项：

- `zero_production_mapping`
- `zero_candidate_mapping`
- `source_ratio_conflict_unresolved`
- `staple_sufficiency_unresolved`
- `safety_endpoint_incomplete`
- `human_journey_review_incomplete`

Run:

```bash
node --test tools/tests/middle-yangtze-main-meal-research-builder.test.mjs
```

Expected: FAIL before builder exists.

- [ ] **Step 2: 实现 builder、report validator 与 summary**

15 条 journey 至少覆盖：

- 湖北：现成恩施豆皮、从原米制作豆皮、武汉豆皮多阶段、米粉裹蒸是否足量主食、鳝鱼长汤安全；
- 湖南：完整社饭结构、缺蒿草时不能冒名、家庭腊味饭与社饭分离、灰粽长工序、quick 冲突；
- 江西：现成米粉炒制、干米粉预处理、汤粉独立家族、瓦罐汤配米粉两容器、米粉肉不自动算完整主食。

- [ ] **Step 3: 运行专项测试并确认通过**

```bash
node --test tools/tests/middle-yangtze-main-meal-research-builder.test.mjs
```

---

### Task 3: 生成确定性产物并接入总门禁

**Files:**
- Create: `tools/lib/middle-yangtze-main-meal-research-renderer.mjs`
- Create: `tools/build-middle-yangtze-main-meal-research.mjs`
- Create: `tools/tests/middle-yangtze-main-meal-research-artifacts.test.mjs`
- Generate: `tools/generated/middle-yangtze-main-meal-research.v1.json`
- Generate: `docs/middle-yangtze-main-meal-research.md`
- Generate: `docs/middle-yangtze-main-meal-journey-review.md`
- Modify: `tools/check-recipes.mjs`
- Modify: `tools/tests/recipe-library.test.mjs`
- Modify: `部署说明.md`

- [ ] **Step 1: 先写 renderer、CLI freshness、aggregate gate 和 dist 隔离失败测试**

```bash
node --test tools/tests/middle-yangtze-main-meal-research-artifacts.test.mjs
```

Expected: FAIL because renderer/CLI/artifacts/gate wiring do not exist.

- [ ] **Step 2: 实现 renderer 与 CLI，生成三个产物**

```bash
node tools/build-middle-yangtze-main-meal-research.mjs --write
node tools/build-middle-yangtze-main-meal-research.mjs --check
```

- [ ] **Step 3: 将 freshness 接入聚合门禁与临时沙箱测试**

`tools/check-recipes.mjs` 必须读入、校验、构建并逐字比对三个产物；`tools/tests/recipe-library.test.mjs` 的 sandbox 必须复制新数据文件，避免门禁测试假绿。

- [ ] **Step 4: 验证研究资产不进入运行包**

```bash
node tools/build-dist.mjs --out-dir dist/middle-yangtze-isolation --build-id middle-yangtze-isolation
```

产物中不得出现 `middle-yangtze-main-meal-research`。

---

### Task 4: 全量验证并更新 Draft PR

- [ ] **Step 1: 专项与聚合验证**

```bash
node --test tools/tests/middle-yangtze-main-meal-research-*.test.mjs
node tools/build-middle-yangtze-main-meal-research.mjs --check
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
python3 -m py_compile ai_proxy.py
```

- [ ] **Step 2: 全部测试串行运行**

```bash
node --test --test-concurrency=1 tools/tests/*.test.mjs
```

- [ ] **Step 3: 构建一致性与保护面审计**

```bash
node tools/build-dist.mjs --out-dir dist/middle-yangtze-build-a --build-id middle-yangtze-verification
node tools/build-dist.mjs --out-dir dist/middle-yangtze-build-b --build-id middle-yangtze-verification
diff -qr dist/middle-yangtze-build-a dist/middle-yangtze-build-b
git diff --name-only HEAD
```

变更中不得出现生产菜谱库、前端、Worker、代理、Planner、template、taxonomy 或 Ratio DSL。

- [ ] **Step 4: commit、push，确认 PR #1 仍为 Draft/open**

不合并、不部署。

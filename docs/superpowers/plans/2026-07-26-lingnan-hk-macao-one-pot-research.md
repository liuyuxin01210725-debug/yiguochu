# 岭南、香港与澳门一锅主餐研究层实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为全国地域菜单框架补齐广东、广西、海南、香港和澳门独立证据层，逐条审计现有 5 道生产映射、建立 5 条具体研究线索，并生成可复核报告与 15 条家庭旅程；不增加或修改生产菜谱。

**Architecture:** 以固定 JSON 作为研究事实源，validator 反向核对 recipe library、地域地图和映射；builder 只派生报告，renderer 只生成 JSON、Markdown 与人工评审表，CLI 提供 `--write|--check`。研究资产保持在 `tools/data`、`tools/generated` 和 `docs`，由 `tools/check-recipes.mjs` 检查新鲜度，并明确排除在 `dist` 外。

**Tech Stack:** Node.js ESM、`node:test`、JSON、Markdown、现有 `tools/build-dist.mjs` 与 `tools/check-recipes.mjs`。

## Global Constraints

- 生产菜谱总数保持 72，道地域研究候选保持 24；本轮研究线索不得写入生产库或候选账本。
- 不修改 `index.html`、`ai_proxy.py`、`worker/src`、Planner、taxonomy、templates、Ratio DSL 或现有菜谱内容。
- 广东与香港共享广式煲仔饭工艺家族；香港在地消费场景不等于香港独创，澳门存在煲仔饭也不自动形成澳门独立家族。
- 真瓦煲/砂锅、部分熟米后加具名浇头、低火收水与锅巴是煲仔饭身份边界；普通锅或电饭煲只能称广式风味焖饭，不承诺锅巴。
- 腊味、香菇滑鸡、豆豉排骨是具名分支，不得抽象成可任意互换的自由蛋白槽。
- 广西五色糯米饭的传统结构是天然植物汁分色浸米后蒸制；项目食品粉版本只能称家庭适配，且“广西传统菠萝饭”保持未证实。
- 定安菜包饭是熟饭与熟馅炒制后用生菜包裹的多阶段结构；海南椰丝饭只证明主食结构；海南鸡饭的鸡与饭分别熟制。
- 澳门葡式海鲜饭只作研究线索；不得据此把葡国鸡、焗猪扒饭或普通澳门菜单强写成同锅米饭家族。
- 外部资料只证明其直接陈述；不据此编造克数、液体比例、分钟数、锅具等价或替换关系。
- 不部署 Preview 或 production；现有 PR #1 保持 Draft。

---

### Task 1: 锁定岭南、港澳研究数据契约

**Files:**
- Create: `tools/tests/lingnan-hk-macao-one-pot-research-data.test.mjs`
- Create: `tools/data/lingnan-hk-macao-one-pot-research.v1.json`
- Create: `tools/lib/lingnan-hk-macao-one-pot-research-validator.mjs`

**Interfaces:**
- Consumes: `recipe-library.json`、`regional-menu-research.v1.json`、`regional-atlas.v2.json`、`regional-menu-mappings.v1.json`。
- Produces: `validateLingnanHkMacaoOnePotResearch(inputs): string[]`。

- [x] **Step 1: 写失败测试**

  测试锁定 `CN-GD`/`CN-GX`/`CN-HI`/`CN-HK`/`CN-MO`、5 道生产审计、0 条候选审计、5 条具体研究线索、来源正反向证明、5 个工艺家族、15 条待人工旅程及上述边界。

- [x] **Step 2: 验证 RED**

  Run: `node --test tools/tests/lingnan-hk-macao-one-pot-research-data.test.mjs`

  Expected: FAIL because the validator module and assessment JSON do not exist.

- [x] **Step 3: 写最小数据与 validator**

  validator 从现有账本派生并核对 5/0 基线，检查 HTTPS 来源、`proves`/`does_not_prove`/`contradicts` 方向索引、生产 ID、地域映射和人工状态；来源允许明确标记 `published_at: "undated"`，不得伪造发布日期。

- [x] **Step 4: 验证 GREEN**

  Run: `node --test tools/tests/lingnan-hk-macao-one-pot-research-data.test.mjs`

### Task 2: 派生报告与完成状态

**Files:**
- Create: `tools/tests/lingnan-hk-macao-one-pot-research-builder.test.mjs`
- Create: `tools/lib/lingnan-hk-macao-one-pot-research-builder.mjs`

**Interfaces:**
- Consumes: Task 1 的固定输入与 validator。
- Produces: `buildLingnanHkMacaoOnePotResearchReport(inputs)`、`validateLingnanHkMacaoOnePotResearchReport(report)`、`formatLingnanHkMacaoOnePotResearchSummary(report)`。

- [x] **Step 1: 写失败测试**

  用手工字面量断言 5 个 production audits、0 个 candidates、5 个 leads、固定来源数和 15 个 journeys；断言 claim matrix 把地域身份、传统结构、家庭适配和项目可执行参数分开。

- [x] **Step 2: 验证 RED**

  Run: `node --test tools/tests/lingnan-hk-macao-one-pot-research-builder.test.mjs`

- [x] **Step 3: 实现纯派生 builder**

  报告只从固定输入派生地域覆盖、来源等级、claim matrix、ingredient shape matrix、产品去向、完成阻塞项和汇总，不读取网络，不调用模型。

- [x] **Step 4: 验证 GREEN**

  Run: `node --test tools/tests/lingnan-hk-macao-one-pot-research-builder.test.mjs`

### Task 3: 生成研究产物并接入聚合门禁

**Files:**
- Create: `tools/tests/lingnan-hk-macao-one-pot-research-artifacts.test.mjs`
- Create: `tools/lib/lingnan-hk-macao-one-pot-research-renderer.mjs`
- Create: `tools/build-lingnan-hk-macao-one-pot-research.mjs`
- Create: `tools/generated/lingnan-hk-macao-one-pot-research.v1.json`
- Create: `docs/lingnan-hk-macao-one-pot-research.md`
- Create: `docs/lingnan-hk-macao-one-pot-journey-review.md`
- Modify: `tools/check-recipes.mjs`

**Interfaces:**
- Consumes: Task 2 report。
- Produces: `buildLingnanHkMacaoOnePotResearchArtifacts(report): Map<string,string>` 与可重复的 `--write|--check` CLI。

- [x] **Step 1: 写失败测试**

  断言三份产物路径、确定性渲染、15 个“待人工评审”、过期文件 fail-closed、聚合门禁包含岭南港澳摘要、`build-dist` 不包含任何本轮研究资产。

- [x] **Step 2: 验证 RED**

  Run: `node --test tools/tests/lingnan-hk-macao-one-pot-research-artifacts.test.mjs`

- [x] **Step 3: 实现 renderer、CLI 与聚合门禁**

  文档必须明确：煲仔饭锅具/具名分支边界、广西天然染色与食品粉差异、广西菠萝饭证据缺口、海南三条工艺线差异，以及澳门葡式海鲜饭仍为研究线索。

- [x] **Step 4: 生成并验证 GREEN**

  Run: `node tools/build-lingnan-hk-macao-one-pot-research.mjs --write && node --test tools/tests/lingnan-hk-macao-one-pot-research-*.test.mjs`

### Task 4: 全量验证与 Draft PR 收尾

**Files:**
- Modify: existing Draft PR #1 body only after local verification.

- [x] **Step 1: 运行全量门禁**

```bash
node --test --test-concurrency=1 tools/tests/*.test.mjs
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
python3 -m py_compile ai_proxy.py
```

- [x] **Step 2: 验证两次确定性构建**

  使用相同 ASCII build ID 两次运行 `node tools/build-dist.mjs --out-dir ...`，并以 `diff -qr` 验证字节一致；两份构建都不得包含岭南港澳研究资产。

- [x] **Step 3: 检查范围并提交**

```bash
git diff --check
git diff -- index.html ai_proxy.py worker/src tools/data/recipe-library.json tools/data/regional-menu-research.v1.json tools/data/regional-atlas.v2.json tools/data/regional-menu-mappings.v1.json tools/data/ingredient-taxonomy.v1.json tools/data/meal-templates.v2.json tools/data/ratio-rules.v1.json
git add docs tools
git commit -m "Add Lingnan Hong Kong Macao research layer"
```

- [ ] **Step 4: 推送并更新 Draft PR #1**

  只更新 `codex/targeted-recipe-expansion` 与现有 Draft PR；不得合并或部署。

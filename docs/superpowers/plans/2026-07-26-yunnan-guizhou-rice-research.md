# 云贵铜锅饭、菠萝饭与社饭研究层实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为全国地域菜单框架补齐云贵独立证据层，逐条审计现有 2 道生产映射和 4 条研究候选，并生成可复核报告与 12 条家庭旅程；不增加或修改生产菜谱。

**Architecture:** 以固定 JSON 作为研究事实源，validator 反向核对 recipe library、候选账本、地域地图和映射；builder 只派生报告，renderer 只生成 JSON/Markdown/人工评审表，CLI 提供 `--write|--check`。研究资产保持在 `tools/data`、`tools/generated` 和 `docs`，并由 `tools/check-recipes.mjs` 检查新鲜度，明确排除在 `dist` 外。

**Tech Stack:** Node.js ESM、`node:test`、JSON、Markdown、现有 `tools/build-dist.mjs` 与 `tools/check-recipes.mjs`。

## Global Constraints

- 生产菜谱总数保持 72，道地域研究候选保持 24。
- 不修改 `index.html`、`ai_proxy.py`、`worker/src`、Planner、taxonomy、templates 或 Ratio DSL。
- 不把项目 canonical URL 当作外部地域证据。
- 外部资料只证明其直接陈述；不据此编造克数、液体比例、分钟数或锅具等价。
- 铜锅不等于普通锅或电饭煲；半熟沥米不等于生米直接焖或熟剩饭。
- “云南盛产菌菇”不等于任意野生菌可替换；来源不明或不熟悉的野生菌不得进入家庭方案。
- 菠萝容器不等于芒果替换已经成立；侗家社饭传统结构不等于现有家庭适配版逐字复刻。
- 不部署 Preview 或 production；现有 PR #1 保持 Draft。

---

### Task 1: 锁定云贵研究数据契约

**Files:**
- Create: `tools/tests/yunnan-guizhou-rice-research-data.test.mjs`
- Create: `tools/data/yunnan-guizhou-rice-research.v1.json`
- Create: `tools/lib/yunnan-guizhou-rice-research-validator.mjs`

**Interfaces:**
- Consumes: `recipe-library.json`、`regional-menu-research.v1.json`、`regional-atlas.v2.json`、`regional-menu-mappings.v1.json`。
- Produces: `validateYunnanGuizhouRiceResearch(inputs): string[]`。

- [x] **Step 1: 写失败测试**

  测试必须锁定：`CN-YN`/`CN-GZ`、2 道生产审计、4 条候选、3 条技法线索、固定来源反向证明、半熟米边界、铜锅边界、菠萝与芒果非等价、野生菌禁用泛化、12 条待人工旅程。

- [x] **Step 2: 验证 RED**

  Run: `node --test tools/tests/yunnan-guizhou-rice-research-data.test.mjs`

  Expected: FAIL because the validator module and assessment JSON do not exist.

- [x] **Step 3: 写最小数据与 validator**

  validator 必须从现有账本派生并核对 2/4 基线，检查 HTTPS 来源、`proves`/`does_not_prove` 反向索引、生产 ID、候选 ID、地域映射和所有人工状态，不允许报告自行声明新增 recipe/candidate。

- [x] **Step 4: 验证 GREEN**

  Run: `node --test tools/tests/yunnan-guizhou-rice-research-data.test.mjs`

  Expected: all tests pass.

### Task 2: 派生报告与完成状态

**Files:**
- Create: `tools/tests/yunnan-guizhou-rice-research-builder.test.mjs`
- Create: `tools/lib/yunnan-guizhou-rice-research-builder.mjs`

**Interfaces:**
- Consumes: Task 1 的固定输入与 validator。
- Produces: `buildYunnanGuizhouRiceResearchReport(inputs)`、`validateYunnanGuizhouRiceResearchReport(report)`、`formatYunnanGuizhouRiceResearchSummary(report)`。

- [x] **Step 1: 写失败测试**

  用手工字面量断言 2 个 production audits、4 个 candidates、3 个 leads、固定来源数、12 个 journeys；断言 claim matrix 把“地域存在”和“项目可执行等价”分开，且未决 Ratio/器具/野生菌/人工评审使状态保持 `research_in_progress`。

- [x] **Step 2: 验证 RED**

  Run: `node --test tools/tests/yunnan-guizhou-rice-research-builder.test.mjs`

  Expected: FAIL because the builder module does not exist.

- [x] **Step 3: 实现纯派生 builder**

  报告只从固定输入派生地域覆盖、来源等级、claim matrix、ingredient shape matrix、产品去向、完成阻塞项和汇总，不读取网络，不调用模型。

- [x] **Step 4: 验证 GREEN**

  Run: `node --test tools/tests/yunnan-guizhou-rice-research-builder.test.mjs`

  Expected: all tests pass.

### Task 3: 生成研究产物并接入聚合门禁

**Files:**
- Create: `tools/tests/yunnan-guizhou-rice-research-artifacts.test.mjs`
- Create: `tools/lib/yunnan-guizhou-rice-research-renderer.mjs`
- Create: `tools/build-yunnan-guizhou-rice-research.mjs`
- Create: `tools/generated/yunnan-guizhou-rice-research.v1.json`
- Create: `docs/yunnan-guizhou-rice-research.md`
- Create: `docs/yunnan-guizhou-rice-journey-review.md`
- Modify: `tools/check-recipes.mjs`

**Interfaces:**
- Consumes: Task 2 report。
- Produces: `buildYunnanGuizhouRiceResearchArtifacts(report): Map<string,string>` 与可重复的 `--write|--check` CLI。

- [x] **Step 1: 写失败测试**

  断言三份产物路径、确定性渲染、12 个“待人工评审”、过期文件 fail-closed、聚合门禁包含云贵摘要、`build-dist` 不包含任何云贵研究资产。

- [x] **Step 2: 验证 RED**

  Run: `node --test tools/tests/yunnan-guizhou-rice-research-artifacts.test.mjs`

  Expected: FAIL because renderer/CLI/artifacts and aggregate gate are absent.

- [x] **Step 3: 实现 renderer、CLI 与聚合门禁**

  研究文档必须明确：铜锅器具不自动等价、半熟米不等于生米、紫米是变体而非唯一形态、贵州社饭的传统证据不替当前家庭版背书、野生菌必须明确品种与正规来源。

- [x] **Step 4: 生成并验证 GREEN**

  Run: `node tools/build-yunnan-guizhou-rice-research.mjs --write && node --test tools/tests/yunnan-guizhou-rice-research-*.test.mjs`

  Expected: all tests pass.

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

  使用相同 ASCII build ID 两次运行 `node tools/build-dist.mjs --out-dir ...`，并以 `diff -qr` 验证字节一致。

- [ ] **Step 3: 检查范围并提交**

```bash
git diff --check
git status --short
git diff -- index.html ai_proxy.py worker/src tools/data/recipe-library.json tools/data/regional-menu-research.v1.json tools/data/regional-atlas.v2.json tools/data/regional-menu-mappings.v1.json tools/data/ingredient-taxonomy.v1.json tools/data/meal-templates.v2.json tools/data/ratio-rules.v1.json
git add docs tools
git commit -m "Add Yunnan Guizhou regional research layer"
```

- [ ] **Step 4: 推送并更新 Draft PR #1**

  只更新 `codex/targeted-recipe-expansion` 与现有 Draft PR；不得合并或部署。

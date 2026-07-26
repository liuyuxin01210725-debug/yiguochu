# 青藏一锅主餐研究层实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为全国地域菜单框架最后补齐青海、西藏独立证据层，审计现有 4 道生产映射、建立 5 条具体研究线索，并生成可复核报告与 12 条家庭旅程；不增加或修改生产菜谱。

**Architecture:** 以 `tools/data/qinghai-tibet-one-pot-research.v1.json` 作为研究事实源，validator 反向核对 recipe library、地域地图与映射；builder 只派生报告，renderer 只生成 JSON、Markdown 与人工评审表，CLI 提供 `--write|--check`。研究资产保持在 `tools/data`、`tools/generated` 和 `docs`，由 `tools/check-recipes.mjs` 检查新鲜度，并明确排除在 `dist` 外。

**Tech Stack:** Node.js ESM、`node:test`、JSON、Markdown、现有 `tools/build-dist.mjs` 与 `tools/check-recipes.mjs`。

## Global Constraints

- 生产菜谱总数保持 72，道地域研究候选保持 24；本轮研究线索不得写入生产库或候选账本。
- 不修改 `index.html`、`ai_proxy.py`、`worker/src`、`tools/data/recipe-library.json`、`tools/data/regional-menu-research.v1.json`、`tools/data/regional-atlas.v2.json`、`tools/data/regional-menu-mappings.v1.json`、Planner、taxonomy、templates 或 Ratio DSL。
- 青海与西藏各自证据只证明本节点事实；相似的青稞、面食、肉汤结构不得互相证明地域身份、配方或替换。
- `qinghai-hao-fan` 只能作为项目原创“风味家庭适配版”；现有外部来源仅支持青海语境中的熬饭名称及肉汤、肉块、蔬菜烩菜轮廓，不支持小米、土豆、熟鹰嘴豆为传统结构，也不支持现有 `grain-porridge` 映射是传统技法分类。
- 尕面片保留手揪小片、入沸水及汤／炒／拌分支边界；不同分支不能变成自由替换槽，羊肉版本不得省略肉类熟制。
- 青稞麦仁肉汤属于长时熬煮线，不得压缩成 quick 或 30–45 分钟方案，不得把牛羊肉写成自由互换槽。
- `tibetan-savory-congee` 的现有旧来源本轮不可复核，只能保留为待证菜名线索；大米加牛奶不构成传统藏式咸稀饭事实。
- `tibetan-gutu` 必须保持藏历新年前夜、团聚与象征物的节庆边界；任何硬币、羊毛、木炭、纸条等非食品不得进入生成食材或家庭做法。
- `tibetan-ginseng-fruit-rice` 只可锚定藏历新年中人参果、米饭、酥油、白糖组合；不支持山南专属、日常高频、同锅焖煮、红枣／葡萄干替换或项目比例。蕨麻必须有明确食品级身份与来源。
- 帕图只锚定面疙瘩、萝卜、牦牛肉丁同锅熬成稠汤／粥状及晚餐语境；普通牛肉、鸡肉或其他蛋白不是传统等价替换。
- 图吧类必须区分青稞整粒与糌粑炒制粉；藏面只保留茶馆早餐与城市餐饮普及证据，不推断家庭一锅配方。
- 外部资料只证明其直接陈述；不据此编造克数、液体比例、分钟数、锅具等价、营养功效或替换关系。
- 所有来源必须至少连接一条机器可验证的 `proves`、`does_not_prove` 或 `contradicts` 证据边；空来源不得计数。
- 不合并 PR，不部署 Preview 或 production；现有 PR #1 保持 Draft。

---

### Task 1: 锁定青藏研究数据契约

**Files:**
- Create: `tools/tests/qinghai-tibet-one-pot-research-data.test.mjs`
- Create: `tools/data/qinghai-tibet-one-pot-research.v1.json`
- Create: `tools/lib/qinghai-tibet-one-pot-research-validator.mjs`

**Interfaces:**
- Consumes: `recipe-library.json`、`regional-menu-research.v1.json`、`regional-atlas.v2.json`、`regional-menu-mappings.v1.json`。
- Produces: `validateQinghaiTibetOnePotResearch(inputs): string[]`。

- [ ] **Step 1: 写失败测试**

  测试锁定 `CN-QH`/`CN-XZ`、4 道生产审计、0 条候选审计、5 条具体研究线索、6 个不能混写的工艺家族、11 条闭合来源、12 条待人工旅程及全部适配／安全边界；同时锁定来源到 claim 的双向证据边、固定地域归属、审计状态与语义指纹。

- [ ] **Step 2: 验证 RED**

  Run: `node --test tools/tests/qinghai-tibet-one-pot-research-data.test.mjs`

  Expected: FAIL because the validator module and assessment JSON do not exist.

- [ ] **Step 3: 写最小数据与 validator**

  4 道生产审计固定为 `qinghai-hao-fan`、`tibetan-savory-congee`、`tibetan-gutu`、`tibetan-ginseng-fruit-rice`；5 条线索固定为青海尕面片、青稞麦仁肉汤，以及西藏帕图、图吧青稞稠食、拉萨藏面。validator 必须核对 4/0 基线、HTTPS 来源、日期或 `undated` 说明、claim 方向反向索引、来源语义身份、province ownership、mapping scope、固定审计状态、家族／边界／旅程语义指纹，且拒绝无证据边来源。

- [ ] **Step 4: 验证 GREEN**

  Run: `node --test tools/tests/qinghai-tibet-one-pot-research-data.test.mjs`

  Expected: PASS.

- [ ] **Step 5: 提交 Task 1**

  Run: `git add tools/tests/qinghai-tibet-one-pot-research-data.test.mjs tools/data/qinghai-tibet-one-pot-research.v1.json tools/lib/qinghai-tibet-one-pot-research-validator.mjs && git commit -m "Add Qinghai Tibet research data contract"`

### Task 2: 派生报告与完成状态

**Files:**
- Create: `tools/tests/qinghai-tibet-one-pot-research-builder.test.mjs`
- Create: `tools/lib/qinghai-tibet-one-pot-research-builder.mjs`

**Interfaces:**
- Consumes: Task 1 的固定输入与 validator。
- Produces: `buildQinghaiTibetOnePotResearchReport(inputs)`、`validateQinghaiTibetOnePotResearchReport(report)`、`formatQinghaiTibetOnePotResearchSummary(report)`。

- [ ] **Step 1: 写失败测试**

  用字面量断言 4 个 production audits、0 个 candidates、5 个 leads、11 个闭合 sources、6 个 families 与 12 个 journeys；断言 claim matrix 把名称／地域、食材形态、节庆语境、家庭适配、Ratio DSL 与安全终点分开，并断言报告源数据指纹与固定派生视图。

- [ ] **Step 2: 验证 RED**

  Run: `node --test tools/tests/qinghai-tibet-one-pot-research-builder.test.mjs`

  Expected: FAIL because the builder module does not exist.

- [ ] **Step 3: 实现纯派生 builder**

  报告只从固定输入派生节点覆盖、来源等级、claim matrix、ingredient shape matrix、产品去向、完成阻塞项和汇总；不读取网络、不调用模型、不改写输入事实。`completion.status` 必须保持 `research_in_progress`，至少包含 production evidence、ratio、household adaptation、safety endpoint 与真人旅程五类阻塞项。

- [ ] **Step 4: 验证 GREEN**

  Run: `node --test tools/tests/qinghai-tibet-one-pot-research-builder.test.mjs`

  Expected: PASS.

- [ ] **Step 5: 提交 Task 2**

  Run: `git add tools/tests/qinghai-tibet-one-pot-research-builder.test.mjs tools/lib/qinghai-tibet-one-pot-research-builder.mjs && git commit -m "Build Qinghai Tibet research report"`

### Task 3: 生成研究产物并接入聚合门禁

**Files:**
- Create: `tools/tests/qinghai-tibet-one-pot-research-artifacts.test.mjs`
- Create: `tools/lib/qinghai-tibet-one-pot-research-renderer.mjs`
- Create: `tools/build-qinghai-tibet-one-pot-research.mjs`
- Create: `tools/generated/qinghai-tibet-one-pot-research.v1.json`
- Create: `docs/qinghai-tibet-one-pot-research.md`
- Create: `docs/qinghai-tibet-one-pot-journey-review.md`
- Modify: `tools/check-recipes.mjs`

**Interfaces:**
- Consumes: Task 2 report。
- Produces: `buildQinghaiTibetOnePotResearchArtifacts(report): Map<string,string>` 与可重复的 `--write|--check` CLI。

- [ ] **Step 1: 写失败测试**

  断言三份产物路径、确定性渲染、12 个“待人工评审”、过期文件 fail-closed、聚合门禁包含青藏摘要、`build-dist` 不包含任何本轮研究资产；并断言报告明确写出熬饭来源纠偏、古突非食品象征物禁入、人参果饭节庆边界、帕图优先研究及图吧／藏面待证状态。

- [ ] **Step 2: 验证 RED**

  Run: `node --test tools/tests/qinghai-tibet-one-pot-research-artifacts.test.mjs`

  Expected: FAIL because the renderer and CLI do not exist.

- [ ] **Step 3: 实现 renderer、CLI 与聚合门禁**

  生成 `tools/generated/qinghai-tibet-one-pot-research.v1.json`、`docs/qinghai-tibet-one-pot-research.md`、`docs/qinghai-tibet-one-pot-journey-review.md`；`--check` 对缺失或过期内容失败。`tools/check-recipes.mjs` 仅在既有门禁绿色后调用本 CLI，失败时输出明确青藏研究产物错误，成功时打印摘要。

- [ ] **Step 4: 生成并验证 GREEN**

  Run: `node tools/build-qinghai-tibet-one-pot-research.mjs --write && node --test tools/tests/qinghai-tibet-one-pot-research-*.test.mjs`

  Expected: PASS.

- [ ] **Step 5: 提交 Task 3**

  Run: `git add tools/tests/qinghai-tibet-one-pot-research-artifacts.test.mjs tools/lib/qinghai-tibet-one-pot-research-renderer.mjs tools/build-qinghai-tibet-one-pot-research.mjs tools/generated/qinghai-tibet-one-pot-research.v1.json docs/qinghai-tibet-one-pot-research.md docs/qinghai-tibet-one-pot-journey-review.md tools/check-recipes.mjs && git commit -m "Add Qinghai Tibet research artifacts gate"`

### Task 4: 全量验证与 Draft PR 收尾

**Files:**
- Modify: existing Draft PR #1 body only after local verification.

**Interfaces:**
- Consumes: Tasks 1–3 的提交。
- Produces: 可追踪的全量验证记录与更新后的 Draft PR #1；不产生部署。

- [ ] **Step 1: 运行全量门禁**

  Run:

  ```bash
  node --test --test-concurrency=1 --test-reporter=dot tools/tests/*.test.mjs
  node tools/check-recipes.mjs
  node tools/run-pantry-planner-v2-journeys.mjs
  python3 -m py_compile ai_proxy.py
  ```

  Expected: all commands exit 0; planner reports 44/44.

- [ ] **Step 2: 验证两次确定性构建**

  使用相同 ASCII build ID 两次运行 `node tools/build-dist.mjs --out-dir <temp-dir> --build-id "qinghai-tibet-verify"`，以 `diff -qr` 验证字节一致；两份构建均不得包含 `qinghai-tibet-one-pot-research` 或 `qinghai-tibet-one-pot-journey-review`。

- [ ] **Step 3: 检查范围**

  Run:

  ```bash
  git diff --check 9501989d964b9daafdb46b4103baf25e7cfbddf8..HEAD
  git diff --exit-code 9501989d964b9daafdb46b4103baf25e7cfbddf8..HEAD -- index.html ai_proxy.py worker/src tools/data/recipe-library.json tools/data/regional-menu-research.v1.json tools/data/regional-atlas.v2.json tools/data/regional-menu-mappings.v1.json tools/data/ingredient-taxonomy.v1.json tools/data/meal-templates.v2.json tools/data/ratio-rules.v1.json
  ```

  Expected: no whitespace errors and no protected-file diff.

- [ ] **Step 4: 推送并更新 Draft PR #1**

  推送现有 `codex/targeted-recipe-expansion` 分支，更新 PR #1 正文，确认 PR 仍为 Draft、未合并且没有 Preview/production 部署。


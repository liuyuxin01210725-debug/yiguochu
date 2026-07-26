# 西北一锅主餐研究层实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为全国地域菜单框架补齐陕西、甘肃、宁夏和新疆独立证据层，逐条审计现有 3 道生产映射、建立 8 条具体研究线索，并生成可复核报告与 16 条家庭旅程；不增加或修改生产菜谱。

**Architecture:** 以固定 JSON 作为研究事实源，validator 反向核对 recipe library、地域地图和映射；builder 只派生报告，renderer 只生成 JSON、Markdown 与人工评审表，CLI 提供 `--write|--check`。研究资产保持在 `tools/data`、`tools/generated` 和 `docs`，由 `tools/check-recipes.mjs` 检查新鲜度，并明确排除在 `dist` 外。

**Tech Stack:** Node.js ESM、`node:test`、JSON、Markdown、现有 `tools/build-dist.mjs` 与 `tools/check-recipes.mjs`。

## Global Constraints

- 生产菜谱总数保持 72，道地域研究候选保持 24；本轮研究线索不得写入生产库或候选账本。
- 不修改 `index.html`、`ai_proxy.py`、`worker/src`、Planner、taxonomy、templates、Ratio DSL 或现有菜谱内容。
- 西北不是一个可自由互换的“羊肉、面、米”大槽位；陕西、甘肃、宁夏、新疆的同名或近似食物只由本省证据证明，不能互相替代地域身份。
- 陕北现有红枣豇豆焖饭只可锚定米脂/榆林腊八软米、红枣、豇豆结构；普通白米、小米替换、去核、豆类商品形态和项目液体比例都属于待验证家庭适配。
- 新疆羊肉抓饭可锚定羊肉、胡萝卜、洋葱/皮芽子、大米及分阶段加水焖米结构；羊腿与羊肩等价、任意肉类槽、任意水果/坚果槽和项目比例均未被传统来源证明。现有素抓饭仅能称抓饭风味家庭素食适配，不能冒充已核验传统固定配方。
- 甘肃与宁夏面片/搓面/生汆面必须保留面形、汤底、肉类熟制和区域分支；“名称存在”不等于单锅、家电等价或自由替换。
- 陕西与甘肃搅团依赖滚水下粉、持续搅拌和稠度观察；不得包装成低干预一键锅饭，也不得把两地原料体系合并成一个传统标准。
- 宁夏肉粘饭保留肉菜先炒后与米同蒸、半固体黏饭结构；烩小吃因夹板、丸子和油炸预制负担只作边界线索，不进入快速家庭主餐家族。
- “糁饭/馓饭/熬饭”名称和本体争议保持待证，不得据字源创建生产家族；八宝茶是饮品，不计入主餐家族。
- 外部资料只证明其直接陈述；不据此编造克数、液体比例、分钟数、锅具等价或替换关系。
- 不部署 Preview 或 production；现有 PR #1 保持 Draft。

---

### Task 1: 锁定西北研究数据契约

**Files:**
- Create: `tools/tests/northwest-one-pot-research-data.test.mjs`
- Create: `tools/data/northwest-one-pot-research.v1.json`
- Create: `tools/lib/northwest-one-pot-research-validator.mjs`

**Interfaces:**
- Consumes: `recipe-library.json`、`regional-menu-research.v1.json`、`regional-atlas.v2.json`、`regional-menu-mappings.v1.json`。
- Produces: `validateNorthwestOnePotResearch(inputs): string[]`。

- [x] **Step 1: 写失败测试**

  测试锁定 `CN-SN`/`CN-GS`/`CN-NX`/`CN-XJ`、3 道生产审计、0 条候选审计、每省 2 条的 8 条具体研究线索、来源正反向证明、5 个工艺家族、16 条待人工旅程及上述边界。

- [x] **Step 2: 验证 RED**

  Run: `node --test tools/tests/northwest-one-pot-research-data.test.mjs`

  Expected: FAIL because the validator module and assessment JSON do not exist.

- [x] **Step 3: 写最小数据与 validator**

  validator 从现有账本派生并核对 3/0 基线，检查 HTTPS 来源、`proves`/`does_not_prove`/`contradicts` 方向索引、生产 ID、地域映射和人工状态；来源允许明确标记 `published_at: "undated"`，不得伪造发布日期。8 条线索固定为：陕西西府搅团与华阴麻食泡，甘肃河沿/揪面片与会宁搅团，宁夏生汆揪面与肉粘饭，新疆吐鲁番汤饭技艺与家常揪片子汤饭。较弱的腊汁肉揪面片、兰州烩面片、宁夏烩小吃、喀什鸽子汤面只保留在边界或后续问题中，不另计 lead。

- [x] **Step 4: 验证 GREEN**

  Run: `node --test tools/tests/northwest-one-pot-research-data.test.mjs`

### Task 2: 派生报告与完成状态

**Files:**
- Create: `tools/tests/northwest-one-pot-research-builder.test.mjs`
- Create: `tools/lib/northwest-one-pot-research-builder.mjs`

**Interfaces:**
- Consumes: Task 1 的固定输入与 validator。
- Produces: `buildNorthwestOnePotResearchReport(inputs)`、`validateNorthwestOnePotResearchReport(report)`、`formatNorthwestOnePotResearchSummary(report)`。

- [x] **Step 1: 写失败测试**

  用手工字面量断言 3 个 production audits、0 个 candidates、8 个 leads、固定来源数和 16 个 journeys；断言 claim matrix 把地域身份、食材/形态、家庭适配、机器比例和安全终点分开。

- [x] **Step 2: 验证 RED**

  Run: `node --test tools/tests/northwest-one-pot-research-builder.test.mjs`

- [x] **Step 3: 实现纯派生 builder**

  报告只从固定输入派生地域覆盖、来源等级、claim matrix、ingredient shape matrix、产品去向、完成阻塞项和汇总，不读取网络，不调用模型。

- [x] **Step 4: 验证 GREEN**

  Run: `node --test tools/tests/northwest-one-pot-research-builder.test.mjs`

### Task 3: 生成研究产物并接入聚合门禁

**Files:**
- Create: `tools/tests/northwest-one-pot-research-artifacts.test.mjs`
- Create: `tools/lib/northwest-one-pot-research-renderer.mjs`
- Create: `tools/build-northwest-one-pot-research.mjs`
- Create: `tools/generated/northwest-one-pot-research.v1.json`
- Create: `docs/northwest-one-pot-research.md`
- Create: `docs/northwest-one-pot-journey-review.md`
- Modify: `tools/check-recipes.mjs`

**Interfaces:**
- Consumes: Task 2 report。
- Produces: `buildNorthwestOnePotResearchArtifacts(report): Map<string,string>` 与可重复的 `--write|--check` CLI。

- [x] **Step 1: 写失败测试**

  断言三份产物路径、确定性渲染、16 个“待人工评审”、过期文件 fail-closed、聚合门禁包含西北摘要、`build-dist` 不包含任何本轮研究资产。

- [x] **Step 2: 验证 RED**

  Run: `node --test tools/tests/northwest-one-pot-research-artifacts.test.mjs`

- [x] **Step 3: 实现 renderer、CLI 与聚合门禁**

  文档必须明确：陕北腊八软粮与项目白米适配的差异、新疆羊肉/素抓饭证据强弱差异、甘宁新三地面片/汤饭不互相证明、搅团持续搅拌负担、肉粘饭先炒后蒸结构，以及烩小吃、馓饭/糁饭和八宝茶排除边界。

- [x] **Step 4: 生成并验证 GREEN**

  Run: `node tools/build-northwest-one-pot-research.mjs --write && node --test tools/tests/northwest-one-pot-research-*.test.mjs`

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

  使用相同 ASCII build ID 两次运行 `node tools/build-dist.mjs --out-dir ...`，并以 `diff -qr` 验证字节一致；两份构建都不得包含西北研究资产。

- [x] **Step 3: 检查范围并提交**

```bash
git diff --check
git diff -- index.html ai_proxy.py worker/src tools/data/recipe-library.json tools/data/regional-menu-research.v1.json tools/data/regional-atlas.v2.json tools/data/regional-menu-mappings.v1.json tools/data/ingredient-taxonomy.v1.json tools/data/meal-templates.v2.json tools/data/ratio-rules.v1.json
git add docs tools
git commit -m "Add Northwest one-pot research layer"
```

- [x] **Step 4: 推送并更新 Draft PR #1**

  只更新 `codex/targeted-recipe-expansion` 与现有 Draft PR；不得合并或部署。

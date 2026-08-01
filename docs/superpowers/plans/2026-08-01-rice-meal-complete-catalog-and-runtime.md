# Rice Meal Complete Catalog and Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把全国真实菜饭调研、现有 72 道 evidence、器具配方证据和运行目录合并为一套可校验的总框架，并把 Preview 从 4 道扩展为至少 8 道真实命名、A/B 营养结构、普通家庭可执行的电饭煲菜饭。

**Architecture:** 新增非运行时权威资产 `rice-meal-collection.v1.json`，记录地域节点、真实候选、核心食材、营养结构、器具流程、数量/液体证据、阻断项和运行映射；由 validator 和 renderer 生成一张人类可读的菜单总表。`rice-meal-catalog.v1.json` 继续是唯一运行时目录，任何 Preview variant 必须回指总目录，并拥有完整 Ratio DSL、动作和安全终点。前端和 Worker 不直接读取调研候选，也不让模型自由组合或机械命名。

**Tech Stack:** JSON 机器资产、Node.js `node:test`、原生 JavaScript、Cloudflare Pages Worker、现有 taxonomy / Ratio DSL / rice-meal compiler、真实 Chrome 手机视口。

## Global Constraints

- 产品只做米饭类菜饭：生米或明确泡发米为主，配菜与米在同一成饭流程中完成；不启用面、粥、汤饭、熟饭炒烩、甜饭或纯碳水 C 级条目。
- 菜名必须来自可靠身份来源，或明确标为项目审核的自然家常名；禁止“食材名 + 主食锅/饭锅”等机械名称。
- A 级为米 + 实质蛋白 + 实质蔬菜/菌菇/豆类；B 级至少两类；C 级不进入普通候选。
- 地域来源只证明身份、组合和高层技法；没有同源精确米量、有效液体、份数与器具证据时，必须保留 blocker，不得冒充可执行配方。
- 运行目录可使用项目原创家庭标准，但必须显式标识其液体语义、预处理和待试做状态，不冒充地域原方或厂商跨机型结论。
- 生产 recipe 总数保持 72；不新增账号、画像、营养追踪、多锅规划、产品内多 Agent 或 production 部署。
- 新路径全程 DeepSeek 调用为 0。
- 每项行为先写失败测试并观察红灯，再做最小实现、观察绿灯、提交；每个任务完成后独立审查。
- Preview 只部署 `recipe-validation`，不得部署或提升 `main`。

## Task 1: 建立全国菜饭收集总目录与 Fail-Closed Validator

**Files:**
- Create: `tools/data/rice-meal-collection.v1.json`
- Create: `tools/lib/rice-meal-collection-validator.mjs`
- Create: `tools/tests/rice-meal-collection-validator.test.mjs`
- Create: `tools/tests/rice-meal-collection-data.test.mjs`
- Modify: `tools/check-recipes.mjs`

**Interfaces:**
- `validateRiceMealCollection(collection, { taxonomy, catalog }): string[]`
- `assertRiceMealCollection(...)`
- Collection states: `identity_only|research_candidate|planned|runtime_ready|excluded`
- Adaptation levels: `E1|E2|E3|E4|excluded`

- [ ] 写失败测试：重复候选、无 HTTPS 身份来源、空核心食材、非法营养分级、C 级 runtime、缺 blocker 的不可执行条目、地域节点既无候选又无 gap、runtime 映射不存在或反向不一致均失败。
- [ ] 运行测试确认因模块和数据缺失而红。
- [ ] 录入三路调研得到的 37 个真实候选、8 个高质量排除边界、明确空白地域，以及现有 11 个 catalog variant 的追踪记录；每项包含名称、地域、family、核心食材、米态、营养角色、传统器具/步骤、证据 URL、数量液体完备度、适配级别、blocker 和状态。
- [ ] 接入 `check-recipes.mjs`，输出候选数、runtime_ready 数、planned 数、显式空白地域数。
- [ ] 运行定点测试和聚合门禁，提交。

## Task 2: 从机器总目录生成“所有菜单与食材构成”审阅表

**Files:**
- Create: `tools/lib/rice-meal-collection-renderer.mjs`
- Create: `tools/build-rice-meal-collection.mjs`
- Create: `tools/tests/rice-meal-collection-renderer.test.mjs`
- Create: `docs/rice-meal-collection.md`
- Create: `docs/rice-meal-collection.csv`
- Modify: `tools/check-recipes.mjs`

**Interfaces:**
- `buildRiceMealCollectionArtifacts(collection): Array<[path, content]>`
- Markdown 按地域 family 展示；CSV 每候选一行。

- [ ] 写失败测试，断言输出逐项显示菜名、地域、核心食材、A/B/C、米态、器具、证据状态、液体/用量完备度、阻断项与运行状态；显式空白地域必须可见。
- [ ] 确认红灯后实现稳定排序 renderer 与 CLI。
- [ ] 生成两个审阅文件，并让 `check-recipes.mjs` 对过期产物 fail-closed。
- [ ] 运行测试、门禁与构建器幂等检查，提交。

## Task 3: 让运行目录逐条回指总目录并完成可执行性审计

**Files:**
- Modify: `tools/data/rice-meal-catalog.v1.json`
- Modify: `worker/src/rice-meal-catalog-validator.js`
- Modify: `tools/tests/rice-meal-catalog-validator.test.mjs`
- Modify: `tools/tests/rice-meal-catalog-data.test.mjs`

**Interfaces:**
- Every variant adds `collection_candidate_id`.
- A `preview_ready` variant must map to a collection item whose status is `runtime_ready`, nutrition grade is A/B, and core material identities match.

- [ ] 写失败测试，覆盖无映射、错误映射、名称身份冲突、核心食材不一致、C 级或 excluded 候选被运行目录激活。
- [ ] 确认红灯后修改 validator、11 个现有 variant 与 collection 双向映射。
- [ ] 运行 catalog、collection、selector、compiler 测试与聚合门禁，提交。

## Task 4: 关闭四道家常菜饭的液体歧义并扩到 8 道 Preview

**Files:**
- Modify: `tools/data/ratio-rules.v1.json`
- Modify: `tools/data/rice-meal-catalog.v1.json`
- Modify: `tools/data/rice-meal-collection.v1.json`
- Modify: `worker/src/rice-meal-catalog-validator.js`
- Modify: `worker/src/rice-meal-compiler.js`
- Modify: `tools/tests/ratio-dsl.test.mjs`
- Modify: `tools/tests/rice-meal-catalog-data.test.mjs`
- Modify: `tools/tests/rice-meal-compiler.test.mjs`

**Activation batch:** `白菜豆腐焖饭`、`西兰花牛肉焖饭`、`豆角排骨焖饭`、`香菇豆角排骨焖饭`。

- [ ] 先写失败测试：四条都必须使用明确 `added_water` 项目家庭标准；锅外预处理产生的汁液不计入；预煮排骨、白菜/西兰花/豆角/香菇必须按协议沥干；页面不得把来源写成地域原方；最厚排骨、牛肉、豆角和米芯安全终点完整。
- [ ] 确认红灯后最小修改 Ratio DSL、动作协议与受控文案，保留“Preview 待家庭试做”边界。
- [ ] 把四条状态从 `planned` 晋升 `preview_ready`，更新 collection 为 `runtime_ready`；总 Preview 恰为 8，不为数量继续放宽其他候选。
- [ ] 运行 Ratio、catalog、compiler、营养和聚合门禁，提交。

## Task 5: 用真实覆盖旅程验证 8 道候选的选择质量

**Files:**
- Modify: `tools/data/rice-meal-journeys.v1.json`
- Modify: `tools/tests/rice-meal-selector.test.mjs`
- Modify: `tools/tests/worker-rice-meal.test.mjs`
- Modify: `tools/tests/frontend-rice-meal-flow.test.mjs`

- [ ] 先写失败旅程：白菜+豆腐、西兰花+牛里脊、豆角+排骨、香菇+豆角+排骨必须命中对应自然菜名并使用 2/2 或 3/3；4–6 项至少 60%；不能因为覆盖而把豆腐塞进排骨饭或把牛里脊替成牛腩；大米不计覆盖。
- [ ] 增加候选差异测试：相同输入的三卡按覆盖优先，不够三卡不凑数；换一换只能切到不同有效菜饭，否则给明确无替代状态。
- [ ] 确认红灯后仅修 selector/前端必要逻辑，不增加自由组合模板。
- [ ] 运行旅程、Worker、前端与全量测试，提交。

## Task 6: 构建、真实浏览器多旅程和 Preview 交付

**Files:**
- Modify: `docs/rice-meal-regional-research.md`
- Modify: `docs/pantry-planner-v2-preview-feedback.md`
- Modify: `docs/first-customers-pilot.md`

- [ ] 运行 `node tools/check-foods.mjs`、`node tools/check-recipes.mjs`、所有 Node 测试、Python 语法检查和 `tools/build-dist.mjs` 构建一致性检查。
- [ ] 用 `productFocus=rice-meal-v1`、`generationMode=deterministic` 构建 Preview；确认全旅程零 DeepSeek。
- [ ] 至少 3 个真实 Chrome 手机视口并行角色，逐项点击输入、生成、选择、换一道、修改食材和返回；重点跑 1/2/3/4/6 项覆盖、四道新增菜、忌口、份数和无替代路径，记录截图、耗时与错误。
- [ ] 发现问题则先补失败测试再修，重复浏览器旅程直到无阻断。
- [ ] 更新审阅记录与 Draft PR；仅部署 `recipe-validation` Preview，禁止 production。


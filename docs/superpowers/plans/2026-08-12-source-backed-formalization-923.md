# 923 条来源菜谱正式化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将当前 923 条来源执行卡逐条推进到正式运行库规则，只有完成来源合同、taxonomy、Ratio DSL、营养、安全、器具、厨房观察和旅程回归的条目才允许正式激活。

**Architecture:** 保留现有 72 道生产基础库作为已验证基线，同时为来源卡建立逐条正式化候选层。每个批次先更新来源卡的结构化证据，再生成 recipe-runtime / rice-meal candidate 所需的 taxonomy、ratio、safety、journey 证据；未闭合条目留在可见研究卡层，不伪造成生产菜谱。批次生成物由现有 deterministic builders 重建，生产激活由现有 release gates 控制。

**Tech Stack:** Node.js ESM、JSON catalogs、worker deterministic planner/compiler、Node test runner、现有 `check-recipes.mjs` 与 Planner journey gates。

## Global Constraints

- 不能把来源估算值标为来源事实；每个估算字段必须逐字段标记 `estimated`。
- 不能把普通锅、砂锅、蒸笼、烤箱、压力锅或熟饭二次烹调改写成普通电饭煲参数。
- 禽肉、猪肉、牛羊肉、鱼贝、蛋和豆类必须挂接匹配的权威安全终点；不确定状态保持阻断。
- 不伪造厨房观察、真实旅程、过敏和替换回归记录。
- 每个批次必须 TDD：先写失败测试，再写最小实现，最后跑专项、目录门禁、Planner 旅程和全量测试。
- Phase A 只能部署 `recipe-validation` 预览，不得部署 production `main`。

---

### Task 1: 首批 5 条来源合同的 taxonomy 与 Ratio DSL 闭合

**Files:**
- Modify: `tools/data/ingredient-taxonomy.v1.json`
- Modify: `tools/data/ratio-rules.v1.json`
- Modify: `tools/lib/source-backed-formal-candidate-review.mjs`
- Modify: `tools/data/source-backed-one-pot-recipes.v1.json`
- Create: `tools/tests/source-backed-formalization-batch-r343.test.mjs`
- Create: `docs/source-backed-one-pot-formalization-batch-r343.md`

**Candidates:** `tatung-beef-burdock-takikomi-rice`, `tiger-pork-bamboo-rice`, `tatung-pork-daikon-rice`, `tatung-wakayama-ginger-rice`, `sichuan-rice-cooker-pork-ribs-rice`。

- [ ] 写断言：五条候选的来源合同、核心 taxonomy 映射、recipe-scoped bounds/executable ratio rule、原器具边界和安全状态必须符合来源；不允许跨机型外推。
- [ ] 运行专项测试确认在当前基线下因条目/规则缺失而失败。
- [ ] 只添加可由同一来源确认的 taxonomy alias、source-scoped ratio evidence 和 claim scopes。
- [ ] 运行专项测试、catalog validator、`check-recipes.mjs`、`git diff --check`。

### Task 2: 首批候选的运行时编译候选与安全/营养/替换审查

**Files:**
- Modify: `tools/data/recipe-runtime.v1.json`
- Modify: `tools/data/rice-meal-catalog.v1.json`
- Modify: `tools/data/rice-meal-journeys.v1.json`
- Modify: `tools/data/ratio-rules.v1.json`
- Create: `tools/tests/source-backed-formal-runtime-batch-r343.test.mjs`

- [ ] 为首批候选生成 `planned` 或 `calibration_preview` 运行时记录；只有器具边界和安全端点闭合者才进入受控预览。
- [ ] 为每条候选补齐最小营养角色、过敏标签、禁配和显式替换槽；查不到营养值则保留估算标记，不写权威数值。
- [ ] 为每条候选生成失败旅程、禁配旅程和安全旅程测试，保持未观察状态，不伪造厨房结果。
- [ ] 运行 runtime/compiler/Planner journey 套件。

### Task 3: 按优先级分批处理剩余条目

- [ ] P0：来源合同完整且同一机型流程明确的条目。
- [ ] P1：来源片段完整、缺少一个可回到原文闭合字段的条目。
- [ ] P2：有研究起步卡但需要补原文或公共安全证据的条目。
- [ ] P3：身份、器具边界或安全阻断条目；只能补证，不能激活。
- [ ] 每个批次不超过 5–10 条，避免把不同器具和不同安全假设混成一个规则。

### Task 4: 厨房观察与正式激活

- [ ] 为每条候选记录实际称量、实际液体/水位、机型/程序、开始结束时间、质地和安全终点。
- [ ] 记录 Planner 旅程、过敏、禁忌、替换和失败回归。
- [ ] 只有观察记录和所有门禁通过的候选，才从 `calibration_preview` 迁移到正式 runtime；不得以测试通过替代厨房观察。
- [ ] 每批完成后运行 `node tools/check-recipes.mjs`、`node tools/run-pantry-planner-v2-journeys.mjs`、全量 `node --test --test-concurrency=1 tools/tests/*.test.mjs`。

### Task 5: 最终 923 条完成审计

- [ ] 生成 923 条逐条 ledger，明确 `formal_active`、`preview_only`、`research_only` 或 `blocked`。
- [ ] 审计每条的来源、数量、液体、步骤、时间、taxonomy、ratio、营养、安全、器具、厨房和旅程证据。
- [ ] 只有 ledger、运行时目录、UI 展示和全量测试一致时，才报告完成；否则继续保持目标未完成。


# Northeast Stew Numeric Evidence Acquisition Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans task by task, with test-driven-development and verification-before-completion.

**Goal:** 把东北排骨油豆角炖锅与锅边纯玉米饼的公开数值证据整理为机器可审计的研究账本，并生成 2/3/4 人份实厨校准的未来记录结构；证据或安全终点不足时必须确定性保持 `blocked` 且禁止执行。

**Architecture:** 新增独立的 tools-only 数值证据账本，不改生产 Ratio DSL、模板、Planner 或菜谱。严格 validator 区分 `qualified_same_state`、`calibration_start_only` 与 `boundary_only`，禁止跨来源拼接默认值；确定性 builder/renderer 生成审计报告与空白校准记录表；`check-recipes` 校验源账本和生成物新鲜度，`build-dist` 测试锁定研究资产不进入发布包。

**Tech Stack:** JSON、Node.js ESM、`node:test`、确定性 Markdown/JSON 构建、现有聚合门禁。

## Global constraints

- 菜谱保持 72 道；模板保持 9 active + 7 planned。
- `stew-with-staple-pot` 保持 `planned`、`runtime_eligible:false`。
- 不改 `tools/data/ratio-rules.v1.json`、`worker/src/planner-v2.js`、`index.html`、`ai_proxy.py`。
- 论文的 120% 含水率只标为 `calibration_start_only`，不是锅边饼生产默认值。
- 油煎玉米饼、混粉贴饼、普通排骨豆角页面只标 `boundary_only`。
- 两条目标机器规则的 `qualified_source_ids` 在本轮必须为空；`decision_status` 必须保持 `blocked`。
- 2/3/4 人份实厨校准不得由代码或 AI 填写；本轮只生成空白记录表，不提供可执行配方。
- 排骨与豆角的安全熟制终点仍为 `unresearched`；获批前记录表状态必须为 `blocked_by_safety_endpoints`，不得开始真人校准。
- 不部署 Preview/production，不合并 Draft PR #1。

## Task 1: 先写证据门失败测试

**Files:**

- Create: `tools/tests/northeast-stew-numeric-evidence.test.mjs`
- Modify: `tools/tests/build-dist.test.mjs`

测试必须先因缺少账本、validator、builder 或生成物而失败，并覆盖：

1. 证据候选必须逐项记录原料状态、混粉、发酵、成熟方式、数值与不能证明的边界。
2. 只有 `qualified_same_state` 才能进入 `qualified_source_ids`；独立性按 `independence_group` 计算。
3. 少于两条独立同状态来源时，规则只能 `blocked`，不得出现生产默认值。
4. 不能把不同来源的和面水、炖锅总水、液位与时间拼成一个默认规则。
5. 2/3/4 人份校准行必须存在且保持空白 `pending`。
6. 研究账本、审计报告、校准表不得进入 `dist/`。

## Task 2: 最小实现研究账本、validator 与确定性生成物

**Files:**

- Create: `tools/data/northeast-stew-numeric-evidence.v1.json`
- Create: `tools/lib/northeast-stew-numeric-evidence-validator.mjs`
- Create: `tools/lib/northeast-stew-numeric-evidence-builder.mjs`
- Create: `tools/lib/northeast-stew-numeric-evidence-renderer.mjs`
- Create: `tools/build-northeast-stew-numeric-evidence.mjs`
- Create: `tools/generated/northeast-stew-numeric-evidence.v1.json`
- Create: `docs/northeast-stew-numeric-evidence.md`
- Create: `docs/northeast-stew-calibration-runbook.md`

账本只录入可直接核对的来源事实。目标规则固定为：

- `cornmeal-flour-to-dough-v1`：论文为 `calibration_start_only`；其他相邻配方为 `boundary_only`；合格同状态来源为 0。
- `stew-with-corn-cake-liquid-v1`：三个直接食谱页均为 `boundary_only`；合格同状态来源为 0。

生成报告必须明确：公开证据只用于界定后续记录字段与证据缺口；安全终点获批前不得执行实厨校准，不能解除 M2 阻塞，也不能转写为生产参数。

## Task 3: 接入聚合门禁并完整验证

**Files:**

- Modify: `tools/check-recipes.mjs`
- Modify: `tools/tests/northeast-stew-numeric-evidence.test.mjs`
- Modify: `tools/tests/build-dist.test.mjs`

验证：

```sh
node --test tools/tests/northeast-stew-numeric-evidence.test.mjs
node tools/build-northeast-stew-numeric-evidence.mjs --check
node tools/check-recipes.mjs
node --test tools/tests/*.test.mjs
python3 -m py_compile ai_proxy.py
node tools/build-dist.mjs --out-dir dist/.northeast-evidence-check --build-id northeast-evidence-check
find dist/.northeast-evidence-check -type f
```

最终还要核对：72 recipes、9 active + 7 planned、生产 Ratio DSL 字节未改、`dist` 不含任何东北证据或校准文件。完成后只更新 Draft PR，不部署、不合并。

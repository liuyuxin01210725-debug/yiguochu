# 一锅出项目完整技术总纲与 Codex 分阶段执行计划 v2.0（权威规格）

> 本文件是权威规格，不是状态摘要。当前进度写入 `docs/superpowers/progress/2026-08-13-yiguochu-program-status.md`；纠偏任务写入 `docs/superpowers/reviews/2026-08-13-pr2-correction-plan.md`。任何 agent 不得用压缩摘要覆盖本文件。

## 0. 目标与系统边界

“一锅出”是按需打开的家常一锅主餐 PWA。它必须让用户选择做饭目的、份数、现有食材和忌口，得到可解释、可执行、可反馈的一锅/一碗方案；不把研究资料库冒充成生产菜谱，不做每日打卡、长期饮食追踪或无边界的 Planner V3。

系统分层必须永久可区分：

```text
source card / research
  → source-backed release ledger
  → formal Planner recipe library
  → generated runtime-one-pot catalog
  → kitchen observation
  → independent promotion gate
  → production approval
```

来源卡可查看、来源执行卡可阅读、Preview 可试用，都不等于正式 Planner、真实厨房通过或 production approved。

## 1. 全局红线

- 来源事实、研究估算、厨房观察逐字段分离；来源未写出的量、液体、时间、安全、器具边界保留 null/blocked。
- 普通锅、砂锅、蒸笼、烤箱、压力锅、熟饭二次烹不得伪装为普通电饭煲合同。
- 肉、禽、鱼贝、蛋、豆类必须有匹配安全终点；食材状态不明时 fail closed。
- 营养数字只来自权威库；未命中必须标估算，不能把 AI 数字写成权威值。
- 研究卡不因步骤完整自动晋升。状态按证据推进，不能跳过 formal、kitchen、journey 和独立 promotion。
- 每个代码批次采用 TDD：RED → 最小 GREEN → 专项/门禁/回归。
- Phase A 只能部署 `recipe-validation` Preview，禁止 production `main`。
- `index.html`、`worker/src/worker.js`、Planner 合同是共享真源；不得由并行 agent 同时编辑同一份运行代码。

## 2. 权威数据与生成物

### 2.1 权威输入

- `tools/data/recipe-library.json`：正式 Planner 基础库，当前 72 条。
- `tools/data/recipe-runtime.v1.json`：正式运行合同。
- `tools/data/recipe-action-profiles.v1.json`：动作合同。
- `tools/data/ratio-rules.v1.json`、`ingredient-taxonomy.v1.json`、`meal-templates.v2.json`：Planner 约束。
- `tools/data/source-backed-one-pot-recipes.v1.json`：923 条来源卡真源。
- `tools/data/source-backed-execution-library.v1.json`、formalization/review/staging/ratio evidence：研究与审核真源。
- `tools/data/kitchen-observations.v1.json`：真实厨房观察私有 ledger，当前必须为空。

### 2.2 派生资产命名

- `source-backed-release-ledger.v1.json`：923 条研究发布状态投影，只用于研究/审核。
- `generated/runtime-one-pot-catalog.v1.json`：正式 Planner 可消费的运行目录，当前 72 条；默认运行包只携带它。
- `source-backed-formalization-matrix.v1.json`：923 行正式化管理矩阵。
- `runtime-coverage-matrix.v1.json`：真实用户场景矩阵，不以来源卡总数作为覆盖成功。
- `kitchen-observations.v1.json`：真实观察记录，不进入公开运行包。

所有派生 JSON 必须由确定性 builder 生成并由 validator 重建比较；手工改生成物一律失败。

## 3. 阶段与门

### Phase 0：真实基线、产品路径、发布边界

M0 数据基线、产品合同、发布与真实旅程审计已完成并落盘。数字应保持一致：923 来源卡；72 正式 Planner；厨房观察 0；新来源卡 production approved 0。Phase 0 只在三份审计、UI/Worker/测试边界一致时通过。

### Phase 1：运行目录、覆盖、正式化、厨房门

#### M1.1 Runtime Catalog

- 完整 923 条投影是 release ledger，不是 runtime catalog。
- 运行目录只含正式 72 条，必须绑定身份、来源摘要、用量、液体、步骤、时间、器具、安全、营养、替换、ratio、taxonomy、appliance、厨房/旅程状态和内容 hash。
- Planner、Worker、正式前端路径只消费 `generated/runtime-one-pot-catalog.v1.json` 或其同源正式合同。

#### M1.2 Coverage

- 保留 923 行 formalization matrix，显示 source/execution/formal/kitchen/journey 状态、优先级、阻断码和下一动作。
- 另建 scenario runtime coverage matrix，以用户输入场景为主键，记录候选、真实 recipe/template、使用/未使用、数量/液体/安全和 reason code。
- Journey evidence 只能通过结构化 recipe ID 字段完整匹配；不能 JSON.stringify 全文 includes。
- 所有缺失 Join fail closed：缺 source/execution 为 invalid，缺 formal review 为 incomplete，缺 staging/kitchen/journey 为 pending；不得因 undefined 被标 complete/unblocked。

#### M1.3 Formalization

- Tiger 批次 01 的五条候选只完成审计/TDD 边界测试，不等于正式化完成。
- P0 同机型同来源合同完整；P1 只缺可回原文闭合字段；P2 需要公共安全/营养/器具证据；P3 身份或器具阻断。
- 单批 5–10 条，必须有审计文档、RED/GREEN、source provenance、ratio 编译状态和不晋升断言。

#### M1.4 Kitchen Gate

- `kitchen-observation.v1` 必须同时记录 source contract 与 observed values：称量、液体/水位、器具/程序、时间线、步骤偏差、安全终点、口感、份量、反馈、真实旅程和证据锚点。
- Validator 需执行 Schema parity、时间顺序/时长一致、单位转换、安全数值比较、证据 ref 解析、runtime/execution ref 解析和 kitchen_observed readiness。
- 空 ledger 不得产生 promotion；独立 Promotion Gate 还必须有正式评审和明确 reviewer 时间。
- household ID、用户 quote、照片和本地原始证据必须留在私有 ledger，不能进公开 runtime artifact。

### Phase 1 Gate

以下全部满足前，Phase 1 不通过：

1. runtime catalog 与 release ledger 正确分离并被 Planner/Worker 使用；
2. formalization matrix 与 scenario matrix 均可确定性重建；
3. 所有 Join fail closed，结构化 journey 证据无全文误判；
4. artifact scope 和 CI 生效；
5. kitchen schema/validator/promotion gate 通过；
6. 至少有真实厨房观察和真实用户旅程证据；
7. full suite 干净退出且 CI required check 可见；
8. 用户明确批准后才可进入下一阶段。

当前判定：Phase 1 未通过。原因至少包括厨房观察 0、runtime/catalog 边界尚未完全接入、scenario matrix/CI 尚未完成。

### Phase 2：输入、数量、器具、安全、营养、Cook Mode

Phase 1 通过且用户批准后，才实现 raw input/canonical identity/ambiguity、available/planned quantity、份数/液体/容量、真实器具和 Cook Mode。不得在 Phase 1 未通过时批量扩充 923 条或启动 Planner V3。

### Phase 3：Planner V3

独立 Preview 路径，复用 taxonomy、units、正式 runtime catalog、execution 和 safety 模块；必须 100% must_include、数量/液体/步骤/安全编译、Reconciliation Gate、30 条场景和人工评审通过，不能替换现有生产 Planner。

### Phase 4：推荐、Hybrid、换一换

四条产品路径各有承诺：给我一道只从正式 Runtime Recipe；按我的食材做一锅必须 100% 必用或明确拒绝；今天吃什么允许取舍但展示未使用与原因；清库存需要数量分配和连续库存状态。换一换必须排除当前 Plan ID 并返回不同 recipe/template/合法槽位，否则结构化返回 `no_alternative_plan`。

### Phase 5：浏览器、厨房 Pilot、发布

覆盖首页、路径选择、候选、详情、Cook Mode、完成、反馈、离线恢复和错误路径；进行 5 人厨房 Pilot；Preview 只部署 `recipe-validation`，production 另行获得明确批准。

## 4. 构建与发布

`tools/build-dist.mjs` 必须支持 `--artifact-scope runtime|research|calibration`，默认 runtime：

- runtime：正式 Planner/Runtime catalog、必要 taxonomy/ratio/action/safety/nutrition、公开来源摘要、前端和 Worker；不含内部 ledger/review/matrix/厨房原始证据。
- research：可含 923 来源资料库和内部研究索引，但无 Planner 权限。
- calibration：受保护 Preview 校准资产，不能作为 production。

发布前运行 `node tools/check-recipes.mjs`、`node tools/run-pantry-planner-v2-journeys.mjs`、JSON/catalog validator、专项测试、full suite、`git diff --check`。`.github/workflows/ci.yml` 必须执行同样的关键门禁并以真实退出码结束。

## 5. Git/PR 策略

- PR #1：`codex/targeted-recipe-expansion` → `main`。
- PR #2：`codex/m1-runtime-coverage-20260813` → `codex/targeted-recipe-expansion`，保持 Draft。
- PR #1 合并后再 retarget/rebase PR #2 到 main；本轮不合并、不部署 production。
- 不 stage `.superpowers/research/` 或无关 UI/runtime 用户改动。
- 不能用空提交声称发生修复；每个修复必须有 diff、测试和可追溯提交。

## 6. 附录 A：禁止事项

- 禁止把 923 条来源记录称为 923 条正式可执行菜谱。
- 禁止为了填满字段用 AI 猜数量、液体、时间、温度或器具适配。
- 禁止以浏览器 200、curl 200 或静态测试替代真实厨房观察。
- 禁止把 `preview_only`、`research_only`、`identity_verified` 或 `recipe_fact_checked` 当成 production approved。
- 禁止在 Phase 1 未通过前继续大规模添加菜谱、开始 Planner V3 或部署 production。

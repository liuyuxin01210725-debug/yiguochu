# PR #2 审查与纠偏执行计划（C0–C10）

## 目的

保留 PR #2 已完成的来源审计、formalization 初版和厨房观察契约，但纠正命名、构建边界、Join 语义和发布门。此计划不扩张菜谱数量，不开始 Phase 2，不把研究资料自动晋升为 Planner 或 production。

## C0：规格与状态分离

- `docs/superpowers/plans/2026-08-13-yiguochu-master-program.md` 是唯一权威技术总纲。
- 当前压缩版只作为 `docs/superpowers/progress/2026-08-13-yiguochu-program-status.md` 状态快照。
- 在总纲中明确 M1.1/M1.2 部分完成、M1.3 仅候选审计、M1.4 仅契约、Phase 1 未通过、Phase 2 禁止。

## C1：来源投影改名

- 现有 923 条 source-state projection 保留，但正式名称改为 `source-backed-release-ledger.v1.json`。
- 它只能表达来源/执行/正式化/厨房/旅程状态，不能被 Planner 直接消费。
- 旧路径保留兼容别名，并标记 deprecated alias。

## C2：真实 Runtime Catalog

- 新建 `generated/runtime-one-pot-catalog.v1.json`，只从正式 recipe library（当前 72 条）和完整运行合同构建。
- 每条必须绑定 recipe identity、source summary、quantity/liquid/steps/time、equipment、safety、nutrition、substitution、ratio、taxonomy、appliance、kitchen/journey 状态和内容哈希。
- 只有真实 Runtime Catalog 可被 Planner/Worker 正式运行路径消费；空厨房账本不得产生 production approval。

## C3：正式化矩阵与场景矩阵拆分

- 当前 923 行资产改称 `source-backed-formalization-matrix.v1.json`。
- 新建 `runtime-coverage-matrix.v1.json`，以真实用户场景为主键，记录输入食材、份数、候选、命中 recipe/template、使用/未使用原因、数量/液体/安全状态和 reason code。

## C4：Journey 精确关联

- 禁止对整个 journey 做 `JSON.stringify().includes(recipe_id)`。
- 只允许 `selected_recipe_id`、`candidate_recipe_ids`、`runtime_recipe_refs`、`evidence_recipe_ids` 等结构化字段做完整 ID 匹配。
- 子串、调试文本、错误信息和备注不构成 journey evidence。

## C5：所有 Join fail closed

- 缺 source row：invalid。
- 缺 execution row：invalid。
- 缺 formalization row：invalid。
- 缺 formal review row：incomplete。
- 缺 staging row：pending。
- 缺 kitchen/journey evidence：不能 complete、unblocked 或 production-ready。

## C6：Kitchen Gate 与 Promotion Gate

- JSON Schema 与手写 validator 顶层/关键字段保持 parity。
- 校验时间顺序、程序时长与时间戳、单位转换和安全最低终点。
- 所有 evidence ref、runtime ref、execution ref 必须可解析；测试夹具只能明确标注 test scope。
- `kitchen_observed` 要求 reviewer 时间、步骤完成、份量完成、安全通过。
- `tools/data/kitchen-observations.v1.json` 保持空数组。
- 独立 Promotion Gate 同时要求正式评审和厨房观察；任何单条观察不得自行授予 production。
- household ID、用户 quote、照片路径和原始厨房记录不得进入公开 runtime artifact。

## C7：Artifact Scope 与 CI

- `build-dist.mjs` 支持 `--artifact-scope runtime|research|calibration`，默认 runtime。
- runtime 不复制 formal review、研究执行库、原始厨房证据、Coverage Matrix 等内部资产。
- research 仅供资料库/研究预览；calibration 只供受保护 Preview，均无 Planner production 权限。
- `.github/workflows/ci.yml` 运行 check-recipes、关键专项、全量 Node tests，并以真实退出码作为结果。

## C8：PR 叠加关系

- PR #2 保持 Draft。
- base=`codex/targeted-recipe-expansion`，head=`codex/m1-runtime-coverage-20260813`。
- PR #1 合并后再 retarget/rebase 到 main；本轮不合并、不部署 production。

## C9：验证与提交

- 每一批先 RED，再 GREEN；运行 JSON parse、node --check、专项、check-recipes、catalog --check、git diff --check。
- 全量测试必须有干净退出；如果 runner 保留 open handle，不得宣称全量通过。
- 不 stage `.superpowers/research/`，不回滚用户已有 runtime/UI 改动。

## C10：Phase 1 复审

- 只有 C0–C9 的证据都存在，且 Runtime/Worker/Planner/前端/测试使用一致目录，才可重新评估 Phase 1。
- 在真实厨房观察仍为 0、Promotion Gate 未通过时，Phase 1 不通过，Phase 2 继续禁止。

## 不可违反的红线

- 来源卡可查看 ≠ 正式 Planner 可运行 ≠ 厨房通过 ≠ production approved。
- 缺数量、液体、时间、安全或器具边界时保留 null/blocked，不用 AI 猜填。
- 普通锅、蒸笼、烤箱、压力锅、熟饭二次烹不能伪装成普通电饭煲合同。
- Phase A 只能部署 recipe-validation Preview，禁止部署 production main。

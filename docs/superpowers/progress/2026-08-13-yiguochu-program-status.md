# 一锅出项目阶段进度快照（2026-08-13）

> 本文件是状态快照，不是权威技术规格。权威规则以 `docs/superpowers/plans/2026-08-13-yiguochu-master-program.md` 为准。

## 已完成或已落地

- M0 数据、产品路径、发布边界审计文档已落盘。
- 来源目录当前为 923 条；研究执行库、formalization ledger、Preview manifest 和正式 72 条 Planner 基线均可确定性重建。
- 现有 923 条来源投影、Coverage Matrix、formalization 与 kitchen observation 初版契约已有测试。
- Tiger 五条候选仍被锁在 preview candidate；Ratio 不可执行，厨房/旅程门待完成，不进入正式 72 条。
- Kitchen Observation v1 已有结构校验器；真实厨房观察数量仍为 0。
- 当前正式 Planner 基线仍为 72 条（12 approved + 60 auto_approved）；不能把 923 条来源卡称为正式运行菜谱。

## 当前真实数字

| 资产 | 当前状态 |
| --- | --- |
| source catalog | 923 |
| source-backed execution cards | 923 |
| source projection | 34 preview / 888 research-only / 1 blocked |
| formal Planner library | 72 |
| kitchen observations | 0 |
| production-approved new source cards | 0 |

## 尚未通过的门

- M1.1 还没有把来源状态投影与真正 Planner runtime catalog 分离。
- M1.2 现有矩阵是 923 条来源正式化矩阵，不是真实用户场景覆盖矩阵。
- Journey evidence 仍需改成结构化 recipe ID 精确关联；所有缺失 join 必须 fail closed。
- Kitchen Observation 还需语义时间、安全、证据、引用和独立 Promotion Gate。
- 默认构建还需拆分 runtime/research/calibration artifact scope。
- CI 还需把 check-recipes、专项测试和全量测试作为可见检查；全量 runner 仍需确认干净退出。

## 当前决策

- Phase 1 Gate：未通过。
- Phase 2：禁止开始。
- 不新增公开 Planner 菜谱，不批量晋升研究卡。
- PR #2：保持 Draft，并叠加到 `codex/targeted-recipe-expansion`。

## 本轮 C0–C10

1. 恢复完整权威总纲和 correction plan。
2. 将 923 条来源投影明确命名为 release ledger。
3. 生成只覆盖正式 72 条的真实 runtime catalog。
4. 拆分 formalization matrix 与 scenario runtime coverage matrix。
5. 修复结构化 journey join 与 fail-closed 规则。
6. 完成 Kitchen Observation 语义门、空 ledger、独立 Promotion Gate。
7. 增加 artifact scopes 与 GitHub Actions。
8. 修正 stacked Draft PR 基线和提交记录。
9. 重新跑验证，诚实记录 full-suite 的退出状态。
10. 重新判断 Phase 1；未满足条件时继续保持禁止 Phase 2。

# 一锅出项目阶段进度快照（2026-08-13）

> 本文件是状态快照，不是权威技术规格。权威规则以 `docs/superpowers/plans/2026-08-13-yiguochu-master-program.md` 为准。

## 状态词义

- **implemented**：代码、数据或合同已经落盘。
- **verified**：对应专项门禁在当前工作区通过。
- **partially implemented**：结构已落盘，但仍有真实环境、厨房或发布条件未满足。
- **blocked**：存在明确阻断，不得用默认值或研究摘要绕过。

## 已完成或已落地

- M0 数据、产品路径、发布边界审计文档已落盘。
- 来源目录当前为 923 条；研究执行库、formalization ledger、Preview manifest 和正式 72 条 Planner 基线均可确定性重建。
- 现有 923 条来源投影、Coverage Matrix、formalization 与 kitchen observation 初版契约已有测试。
- Tiger 五条候选仍被锁在 preview candidate；Ratio 不可执行，厨房/旅程门待完成，不进入正式 72 条。
- Kitchen Observation v1 已有结构校验器；真实厨房观察数量仍为 0。
- 当前正式 Planner 基线仍为 72 条（12 approved + 60 auto_approved）；不能把 923 条来源卡称为正式运行菜谱。
- Runtime/Research/Calibration artifact scope 已实现并通过构建专项：默认 runtime 不携带 source browser、923 卡 shelf、research ledgers 或 Coverage Matrix。
- Runtime eligibility 已改为完整合同门；当前 72 条 runtime 索引中真正 `planner_runtime_eligible` 为 0，原因会逐条写入 `eligibility_reasons`，不再按 status 伪装为可执行。
- Release Ledger 已成为 923 条研究投影的权威生成物；旧 `source-backed-runtime-catalog.v1.json` 仅保留弃用别名清单。
- Runtime Coverage Matrix 已加入 variant 精确 Join，并对未知 ID 输出 `unknown_candidate_id` / `candidate_join_invalid`；当前 101 场景、59 个有效结构化候选 Join、1 个未知 variant Join，仍是场景登记/合同矩阵，不是已执行的 Planner 结果。
- Kitchen Trial Catalog 已实现：34 条 Preview Candidate 已进入严格试做合同审计，但当前 0 条 `trial_eligible`；全部因缺结构化设备合同（及个别安全合同）阻断，不授予 Planner 或生产权限。
- C29 已实现并验证：Runtime 生产/预览页面按显式布尔条件分流；预览页明确“尚未 Production Approved”；runtime、research、calibration 三种构建均不携带私有 kitchen observation ledger。
- C30 已实现并验证：命名菜谱与 rice-meal variant 均携带 recipe/variant/catalog-version/contract-hash authority；换一换、恢复、重试和缓存返回前做 fail-closed 校验。
- C31 已实现并验证：Trial contract hash 写入 Observation 引用并在引用、Promotion Gate 中核对；严格 eligibility 当前为 0/34。
- C32 已实现并验证：Catalog-enforced eligible=0 时 101 场景统一 dry-run blocked（`runtime_catalog_empty` / `no_candidate`）；Shadow 结果明确 `observed=0`、不计入正式通过。
- C33 已实现并验证：Runtime eligibility 还要求结构化 safety/equipment/quantity/liquid/time/step/action-profile/source 合同；自由文本不能使菜谱进入 Eligible。
- C34 尚未开始真实试做：没有设备清单，也没有任何真实厨房观察；不得创建占位观察记录。

## 当前真实数字

| 资产 | 当前状态 |
| --- | --- |
| source catalog | 923 |
| source-backed execution cards | 923 |
| source projection / release ledger | 34 preview / 888 research-only / 1 blocked |
| formal Planner library | 72 |
| runtime catalog entries | 72 |
| runtime planner-eligible | 0 |
| kitchen trial candidates | 34 total / 0 trial-eligible |
| runtime coverage scenarios | 101（59 valid structured candidate joins; 1 unknown variant join） |
| kitchen observations | 0 |
| production-approved new source cards | 0 |

## 尚未通过的门

- **部分完成：M1.1**。923 条投影与 72 条 runtime 索引已分离；但 72 条当前没有完整 runtime/action/Ratio DSL 合同，因此真正可消费数量为 0，不能推进 Phase 1 Gate。
- **部分完成：M1.2**。923 行 formalization matrix 与 101 行 scenario coverage matrix 均可确定性重建；矩阵尚未调用真实 Planner 产生 observed quantity/liquid/safety 结果。
- **已实现、待真实证据：M1.3**。34 条 Trial Candidate 已通过 hash/引用契约；严格结构化设备合同缺失，0/34 可试做；尚无厨房观察或正式评审。
- **已实现、阻断发布：M1.4**。Kitchen Observation/Promotion Gate、安全 required endpoint、空 ledger、Trial ref 已通过专项；真实厨房观察仍为 0。
- **已实现、阻断真实试做：C29–C33**。Runtime 分包、候选 authority、Trial hash、Coverage dry-run、结构化合同门均已通过专项；C34 需要真实设备 manifest 和 3–5 次实际试做，当前不具备。
- **已验证：artifact scope**。runtime/research 构建专项通过；研究 shelf 测试也显式使用 research scope，不再依赖共享 dist 状态。
- **已验证：Release Gate**。CI 已移除 `--test-force-exit`；当前工作区完整 suite 自然退出 `2868/2868`，0 fail/cancel/skip，exit code 0（约 537 秒）。

## 当前决策

- Phase 1 Gate：未通过。
- Phase 2：禁止开始。
- 不新增公开 Planner 菜谱，不批量晋升研究卡。
- PR #2：保持 Draft，并叠加到 `codex/targeted-recipe-expansion`。

## 本轮 C0–C20 收口状态

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
11. **implemented / verified**：默认 runtime 构建与 research/calibration 构建隔离。
12. **implemented / verified**：Runtime eligibility 按 runtime/action/ratio/taxonomy/safety 合同计算，当前 0 条 eligible。
13. **implemented / verified**：Kitchen Trial Catalog 解开 Preview → 厨房观察 → Promotion 的循环依赖。
14. **implemented / verified**：Required safety endpoint 不能用 `not_applicable` 绕过；无风险菜谱可用空数组。
15. **implemented / verified**：Coverage Matrix 纳入 variant_ids，未知 Join fail closed。
16. **implemented / verified**：Release Ledger 接入 `check-recipes`，旧 runtime 文件降为 alias manifest。
17. **verified**：CI release gate 改为 natural exit；完整本地 suite 2868/2868 自然退出且 exit code 0。
18. **implemented**：状态文档改为 implemented/verified/partially implemented/blocked。
19. **blocked**：真实厨房观察、真实旅程与独立 Promotion 尚为 0。
20. **blocked**：Phase 1 Gate 未通过，不启动 Phase 2/Planner V3，不部署 production。
21. **implemented / verified**：C29 Runtime production/preview 分流与三 scope 私有 ledger 排除。
22. **implemented / verified**：C30 candidate-level authority 覆盖命名候选、rice variants、swap/restore/retry/cache。
23. **implemented / verified**：C31 Trial Contract Hash 与严格 0/34 eligibility。
24. **implemented / verified**：C32 Catalog-enforced/Shadow 双结果 dry-run，observed 永远为 0。
25. **implemented / verified**：C33 结构化安全、设备、数量、液体、时间、步骤和 action profile 合同。
26. **blocked**：C34 真实厨房 Pilot，等待真实设备 manifest；不伪造 observation。

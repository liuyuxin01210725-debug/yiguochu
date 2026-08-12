# r294：首批 5 条来源固定批次正式化推进

本批不新增菜名，也不把估算值或跨机型换算写成 Planner 默认值。对以下 5 条来源合同完整的卡片，新增 `source_bounded_non_executable` 状态：逐字段锁定同一来源的份数、食材、液体/水位、步骤、时长和器具边界，但只允许原文固定批次，不能按份数缩放，也不能跨器具转换。

| recipe_id | 名称 | 来源合同 | 当前进度 | 仍未上线原因 |
|---|---|---|---|---|
| `tatung-beef-burdock-takikomi-rice` | 牛肉とごぼうの炊き込みご飯 | 2 人、米 2 合、だし 2 杯、大同电锅流程 | source-bounded | 尚无厨房观察与真实旅程 |
| `tiger-pork-bamboo-rice` | 豚肉とたけのこごはん | 6 人、米 3 杯、600mL 高汤、Tiger 炊込み程序 | source-bounded | 机型边界与厨房观察仍待记录 |
| `tatung-pork-daikon-rice` | 豚バラ大根ご飯 | 2 人、大同内锅米水位线 2 刻度略下 | source-bounded | 水位不可外推，尚无厨房观察与旅程 |
| `tatung-wakayama-ginger-rice` | しょうが飯 | 3 人、大同内锅米水位线 2 刻度略下 | source-bounded | 水位不可外推，尚无厨房观察与旅程 |
| `sichuan-rice-cooker-pork-ribs-rice` | 排骨焖饭 | 3 人、米 1 US cup、300g 排骨、300mL 水 | source-bounded | 先焯/煎再入电饭煲，尚无厨房观察与旅程 |

本批的安全边界仍保留现有 FoodSafety.gov 端点；`source_bounded_non_executable` 明确不是正式 Planner 菜谱。正式激活前仍需：

1. 按原机型实际称量并记录水位/液体、程序、起止时间、质地和安全终点；
2. 编译为可审计的运行时规则，不把固定批次除以人数当成来源事实；
3. 完成 Planner 旅程、禁配、过敏和失败回归；
4. 通过 `node tools/check-recipes.mjs` 与全量测试。

验证：`source-backed-formalization-batch-r294.test.mjs` 2/2；正式比例证据、正式候选审查相关测试 7/7。当前总目录仍 923 条，正式 Planner 仍 72 条；本批是 5 条的来源固定批次正式化推进，不是生产激活。

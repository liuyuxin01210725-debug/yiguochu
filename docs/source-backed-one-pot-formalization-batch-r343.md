# r343：四条来源校准预览卡

本批把四张已有来源执行卡接入 `rice-meal-catalog.v1.json` 的 `calibration_preview` 层，**没有增加正式 Planner 菜谱，也没有把项目校准数值写成来源事实**。

| 校准变体 | 一手来源 | 项目两人校准起点 | 器具边界 | 当前状态 |
|---|---|---|---|---|
| `source-tatung-beef-burdock-rice` | 大同官方账号的牛肉牛蒡炊饭 | 生米100g/人、牛肉100g/人、牛蒡75g/人、称重液体1.2倍 | 仅大同电锅；来源内锅だし与外锅水分开 | calibration_preview |
| `source-tiger-pork-bamboo-rice` | Tiger 官方豚肉竹笋炊饭 | 生米100g/人、猪五花50g/人、竹笋75g/人、称重液体1.33倍 | 仅 Tiger 炊込み·火力强程序 | calibration_preview |
| `source-tatung-pork-daikon-rice` | 大同官方猪肉萝卜饭 | 生米100g/人、猪五花50g/人、白萝卜60g/人、胡萝卜15g/人、油炸豆腐10g/人、称重液体1.2倍 | 来源是大同内锅米水位线2刻度略下；项目液体比仅为校准起点 | calibration_preview |
| `source-tatung-wakayama-ginger-rice` | 大同官方しょうが飯 | 生米100g/人、鸡胸肉50g/人、生姜60g/人、胡萝卜15g/人、油炸豆腐10g/人、称重液体1.2倍 | 来源是大同水位线；项目不外推到普通电饭煲 | calibration_preview |

本批新增的 Ratio DSL 是变体范围专用的 `executable` 校准规则，仅供 `rice_catalog_scope=calibration` 编译。它们把来源固定批量、项目两人起步量和器具限制分开记录；不代表任意份数、任意品牌或已完成厨房验证。

每条都加入了 `calibration_ready` collection candidate/tracking、反向映射和 `RM-343` 至 `RM-346` 的选择器旅程 fixture。阻塞项仍是“内部校准合同尚未完成实厨试做”：目前没有实际称量、开始/结束时间、米饭质地、温度记录，也没有真实用户旅程审阅，因此不得迁移到正式 72 道 Planner 库。

专项测试：`tools/tests/source-backed-formalization-batch-r343.test.mjs`。


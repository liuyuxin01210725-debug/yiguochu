# r296：第三批 5 条来源固定批次正式化推进

本批把 5 条来源字段完整的电饭锅/压力锅卡片推进为 `source_bounded_non_executable`。字段仍只来自各自来源；固定批次不按人数缩放，机型和程序不跨设备转换。

| recipe_id | 名称 | 原器具边界 |
|---|---|---|
| `taiwan-tatung-cabbage-rice` | 大同電鍋高麗菜飯 | 仅大同电锅内外锅流程 |
| `zojirushi-pork-vegetable-rice-el-ns23` | 豚肉と野菜のおかずごはん | 仅象印 EL-NS23 |
| `tatung-hainan-chicken-rice` | 海南鶏飯シンガポールチキンライス | 仅大同电锅来源流程 |
| `tatung-pork-jowl-sesame-rice` | 豚トロとごま油炊き込みご飯 | 仅大同电锅来源流程 |
| `tiger-chinese-sticky-rice` | 炊込み中華おこわ | 仅 Tiger 炊込み程序 |

这些条目仍保留 `ratio_dsl`、`cooker_boundary`、`kitchen_observed` 和 `journey_coverage` 阻塞；本批不改变正式 Planner 的 72 道生产基线。

验证：r296 专项 2/2，r294–r296 与正式证据/候选审查组合测试通过；重建 formal review、staging、ledger、execution library 和 catalog artifacts。

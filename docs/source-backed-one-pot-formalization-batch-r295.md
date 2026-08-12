# r295：第二批 5 条来源固定批次正式化推进

本批继续沿用“来源固定批次、不可缩放、不可跨器具转换”的保守规则，不新增菜名、不把研究估算写成来源事实，也不伪造厨房观察。

| recipe_id | 名称 | 来源边界 |
|---|---|---|
| `philips-cantonese-cured-rice` | 广东腊味饭 | Philips 多功能锅无水/密封/米饭模式；腊味状态与机型边界保留 |
| `shanghai-salted-pork-vegetable-rice` | 上海咸肉菜饭 | 砂锅/陶锅原方，青菜另锅炒后中途加入；不外推电饭煲 |
| `toshiba-mixed-chicken-bamboo-rice-rc-dr18t` | 东芝什锦饭 | 仅 RC-DR18T White/Mixed 模式与白米水位 3 |
| `panasonic-nf-pc400-takikomi-rice` | 炊き込みごはん | 仅 Panasonic NF-PC400 压力锅自动调理 17 |
| `panasonic-khao-man-gai-nf-ac1000` | カオマンガイ | 仅 Panasonic NF-AC1000 中压 8 分钟流程 |

五条均已从 `candidate_evidence_only` 推进为 `source_bounded_non_executable`：固定批次字段已与同一来源快照逐项对齐，但仍保留 `ratio_dsl`、`cooker_boundary`、`kitchen_observed` 和 `journey_coverage` 正式阻塞。当前正式 Planner 仍为 72 道；这 5 道已经可以在来源执行资料库中按原器具查看完整起步卡，但不能被当成通用电饭煲配方或任意份数配方。

验证：r295 专项 2/2，r294/r295 与正式证据/候选审查组合 9/9；随后重建正式化审查、staging、ledger、execution library 与 catalog artifacts。

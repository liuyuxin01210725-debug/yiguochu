# r293：Tiger 同源液体与程序时间闭合

基线：`source-backed-one-pot-v1-20260810-global-r292` / 923 条；本批仍为 923 条，不新增 canonical、不晋升 `executable`。

## 本批回填

| recipe_id | 原文事实 | 回填 | 保留边界 |
| --- | --- | --- | --- |
| `r60-tiger-takeout-vegetable-fried-rice` | Tiger USA 原页的 4 份配方在生米、蔬菜和调味料中加入 1.75 cups 鸡汤，随后运行 Mixed 程序 | `liquid_contract.added_stock = 1.75 cups` | 鸡蛋和豌豆在程序后加入；仍是 Tiger 原机型流程，不外推普通电饭煲 |
| `tiger-edamame-carrot-rice-soup` | Tiger USA 原页明确 Slow Cook 70 分钟，结束后拌入毛豆、菠菜并静置 10 分钟 | `time_contract = 70 分钟` | 70 分钟是来源程序时长；后置拌料/静置不与其相加，也不把它改写为普通炊饭 |

## 明确不回填

`tiger-spinach-chickpea-curry-rice` 的 60 分钟对应慢煮主菜且米饭另配；`tiger-usa-asparagus-mushroom-risotto` 的准备/烹调时间分列；Instant Pot 快速鸡饭给出范围。它们继续只在研究卡中显示原文时间线索和估算起步值，不压成单值合同。

## 验证

- 专项测试：`tools/tests/source-backed-one-pot-batch-r293-tiger-gaps.test.mjs`（2/2）
- 目录总数保持 923，recipe status 不变
- 未修改 runtime、UI、Planner 或部署配置

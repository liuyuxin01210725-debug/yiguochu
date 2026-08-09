# r234 安全字段批次：东芝中式糯米饭

基线：`source-backed-one-pot-v1-20260808-global-r233`，923 条。

本批不新增 canonical 菜谱，只为 1 条已有 `recipe_fact_checked` 记录补上同源可追溯的猪肉安全端点。原始食材数量、压力锅程序和非普通电饭煲边界均保持不变。

| recipe_id | 官方来源事实 | 回填 | 保留边界 |
| --- | --- | --- | --- |
| `toshiba-chinese-sticky-rice-rcp30r` | 东芝官方原页给 4 人份、糯米 310g、猪肉原文“1大匙”、液体 270mL；猪肉与配料处理后放在米上，以 RCP-30R 1.4 气压程序炊煮。 | `pork_fully_cooked` 74°C，来源 `S-SAFETY-TEMPERATURES-1`。 | 仅限东芝 RCP-30R 压力锅来源程序；不把 1.4 气压或约 3 分钟程序当作温度证明，也不外推成普通电饭煲合同。 |

东芝来源：<https://www.toshiba-lifestyle.com/jp/pressure-cookers/recipes/24041566/>。

FoodSafety 来源：<https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures>。

TDD：先在 r233 基线确认版本断言失败，再写入字段；专项测试 2/2 通过。目录构建、catalog validator、`check-recipes`、source-backed 全套测试均通过；未晋升 `executable`，未改运行时代码或 UI。

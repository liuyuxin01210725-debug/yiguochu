# r235 安全字段批次：Tefal 羊肉抓饭

基线：`source-backed-one-pot-v1-20260808-global-r234`，923 条。

本批不新增 canonical 菜谱，只为 1 条已有 `recipe_fact_checked` 记录补上同源可追溯的羊肉安全端点。来源明确给出羊腿牛排形态，因此不与于田等部位不明的羊肉记录拼接。

| recipe_id | 官方来源事实 | 回填 | 保留边界 |
| --- | --- | --- | --- |
| `tefal-pilaf-with-lamb-r200302` | Tefal 官方页给 4 人份、去骨瘦羊腿牛排 450g（切小块）；先在 Cook4me 的 CRUST/FRY 程序中加盖煎炒 10–15 分钟，再进入 PILAF/RISOTTO 程序。 | `lamb_fully_cooked` 63°C 并静置 3 分钟，来源 `S-SAFETY-TEMPERATURES-1`。 | 仅限 Tefal Cook4me 多功能/压力锅程序；保留羊肉先封边、后铺米和中途铺鹰嘴豆/葡萄干的阶段顺序，不把封边或程序时长当作温度证明，不外推普通电饭煲。 |

Tefal 来源：<https://www.tefal.com/recipe/Pilaf-with-lamb/r/200302>。

FoodSafety 来源：<https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures>。

TDD：先在 r234 基线确认版本断言失败，再写入字段；专项测试 2/2、source-backed 全套 634/634 通过。目录构建、catalog validator、`check-recipes`、`git diff --check` 均通过；未晋升 `executable`，未改运行时代码或 UI。

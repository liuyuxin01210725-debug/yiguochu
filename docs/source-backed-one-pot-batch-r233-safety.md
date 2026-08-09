# r233 安全字段批次：鍋寶 / SHARP 原料端点

基线：`source-backed-one-pot-v1-20260808-global-r232`，923 条。

本批不新增 canonical 菜谱，只为 3 条已有 `recipe_fact_checked` 记录补上同源可追溯的原料安全端点。三条均保留原厂商器具、分层或程序后投料边界，不晋升 `executable`，也不把厂商流程外推成普通电饭煲配方。

| recipe_id | 官方来源事实 | 回填 | 保留边界 |
| --- | --- | --- | --- |
| `r58-sharp-matsusaka-pork-mushroom-rice` | SHARP Taiwan 原页给 4 人份、松阪猪 100g；猪肉切片放水波炉上层，米饭在下层，完成后再焖 10 分钟。 | `pork_fully_cooked` 74°C，来源 `S-SAFETY-TEMPERATURES-1`。 | 仅限 SHARP Healsio 水波炉上下层容器流程，不改写成普通电饭煲单锅。 |
| `r58-cookpot-salmon-milk-brown-rice-risotto` | 鍋寶原页给 2 人份、鲑鱼 200g；炖饭程序结束后才加入鲑鱼和青江菜，再焖 5 分钟。 | `seafood_fully_cooked` 63°C，来源 `S-SAFETY-TEMPERATURES-1`。 | 保留 IH 炖饭程序后投料；页面液体加入时点歧义仍不消除。 |
| `r58-cookpot-corn-rice-beef-meatballs` | 鍋寶原页给 4 人份、绞牛肉 300g；牛肉丸在蒸盘上层、玉米饭在下层，跳起后焖 15 分钟。 | `beef_fully_cooked` 71°C，来源 `S-SAFETY-TEMPERATURES-1`。 | 这是分離式電鍋“一锅二菜”上下层蒸制，不是把牛肉丸混入米饭。 |

FoodSafety 来源：<https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures>。

TDD：先在 r232 基线确认版本断言失败，再写入字段；专项测试 2/2 通过。目录构建、catalog validator、`check-recipes`、source-backed 全套及全量串行测试均通过。

# r236 固定批次字段闭合：MAFF 三条熟饭/浇汁边界

基线：`source-backed-one-pot-v1-20260808-global-r235`，923 条；本批不新增 canonical，只回填同一 MAFF 原页明确的 servings 与数值食材量。

| recipe_id | 同源可证明字段 | 保留边界 |
| --- | --- | --- |
| `maff-fukushima-harako-meshi` | 4 人份；米 3 杯、鲑鱼子 1 杯、酒 1/3 杯、酱油 1/2 杯。 | 鲑鱼子腌渍后铺在炊好米饭上，仍是熟饭后处理；不补生米液体、总时长或鱼子安全终点。 |
| `maff-hiroshima-uomeshi` | 4 人份；白身鱼 120g、虾 40g、熟饭 300g、浇汁 400g 等原页定量。 | 鱼、虾、蔬菜、蛋丝分段处理后铺熟饭并浇汁；不改写成生米同锅海鲜饭，不把浇汁量当米水。 |
| `maff-tokyo-fukagawa-meshi` | 1 人份；蛤蜊 100g、味噌 50g、熟饭 1 膳分。 | MAFF 当前页面的该版本是味噌汤煮蛤蜊后连汁浇熟饭；不补生米米水比例或普通电饭煲适配。 |

来源：

- [MAFF 福岛 はらこ飯](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/30_12_fukushima.html)
- [MAFF 广岛 魚飯](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/42_24_hiroshima.html)
- [MAFF 东京 深川めし／深川丼](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/34_1_tokyo.html)

TDD：先在 r235 基线确认版本断言失败，再写入三条 fixed batch；专项 2/2、source-backed 聚焦套件 644/644 通过。目录构建、catalog validator、`check-recipes`、快照和 `git diff --check` 均通过。三条仍为 `recipe_fact_checked`，未晋升 `executable`，未改运行时代码或 UI。

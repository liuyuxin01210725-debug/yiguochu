# r237 官方固定批次回填

- 目录版本：`source-backed-one-pot-v1-20260808-global-r237`
- 目录总数：923（无新增 canonical）
- 本批：5 条既有记录补回来源明确的固定份量/原料量；不补液体合同、总时长或安全终点，不晋升 `executable`。

## 回填条目

1. `panasonic-my-chicken-pumpkin-lotus-mixed-rice`：Panasonic Malaysia 原页明确 4 份、糙米 3 杯、大麦 90g、水 100mL、鲣鱼高汤 3 杯、鸡腿丁 200g、南瓜 50g、莲藕 100g。导语和编号步骤对鸡腿投料时点不一致，因此仅回填数量，液体/流程/安全继续留空，保留 Panasonic Brown Rice 机型边界。
2. `r100-macau-tomato-chicken-rice`：澳门体育局原页明确 4 人份及鸡腿肉、洋葱、番茄、鸡蛋、白饭、油、汁料的定量。该方是熟饭、炒蛋、炒鸡肉与另煮茄汁后组合，保留熟饭二次烹边界。
3. `r100-hk-corn-pumpkin-chicken-ball-rice`：香港卫生署 EatSmart 原页明确 1 人份及南瓜、鸡球、粟米、青椒、白饭等定量；鸡球汆熟、南瓜酱另煮后配熟饭，不外推电饭煲。
4. `r100-hk-scallop-egg-braised-rice`：香港卫生署 EatSmart 原页明确 2 人份、米 70g、蛋 2 只、瑶柱 15g、芥兰 20g、高汤 300g；米饭另煮、蛋白/瑶柱/菜片烩汁淋饭。
5. `r100-hk-garlic-wild-mushroom-stonepot-rice`：香港卫生署 EatSmart 原页明确 1 人份、熟白饭 1 碗、彩椒 100g、洋葱 20g、杂菜 150g、杂菌 100g 等；石锅盛饭、蔬菜另行汆烫炒熟后铺面。

## 证据与验证

- [Panasonic Malaysia Mixed Rice with pumpkin and lotus roots](https://www.panasonic.com/my/consumer/kitchen-appliances-learn/healthy-everyday-recipes/recipe-top-page/mixed-rice-with-pumpkin-and-lotus-roots.html)
- [澳门体育局 茄汁鸡丝饭](https://sportnutrition.sport.gov.mo/zh/show/pastanrice/id/77)
- [香港卫生署 粟米南瓜鸡球饭](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=753)
- [香港卫生署 菜片瑶柱鸳鸯蛋烩饭](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=750)
- [香港卫生署 蒜蓉野菌杂菜石头窝饭](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=754)

TDD 专项：`tools/tests/source-backed-one-pot-batch-r237-public-fixed.test.mjs`（2/2）。目录构建、目录校验、`check-recipes`、全量测试和 `git diff --check` 在提交前完成。

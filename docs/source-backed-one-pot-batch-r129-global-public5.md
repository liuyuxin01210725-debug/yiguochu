# r129 全球公共机构主餐候选批次

日期：2026-08-08
目录版本：`source-backed-one-pot-v1-20260808-global-r129`
范围：从 `r129-public5` intake 中只整合证据完整、确属主餐的 3 条普通锅候选。

## 状态与边界

本批新增 3 条，全部保持 `recipe_fact_checked`，不晋升 `executable` 或 `preview_ready`。Michigan One Pot Beans and Rice 与 Rice University Middle Eastern Rice 因来源定位偏配菜，没有进入本批；TAMU Skillet Chops and Rice 虽有完整事实，但猪排取出/回锅且米量原文有“1 1/12 cups”排版歧义，留在 intake，未强行入库。

| recipe_id | 菜名 | 来源/可证明事实 | 器具与关键缺口 |
| --- | --- | --- | --- |
| `sdsu-easy-red-beans-rice` | Easy One-Pot Red Beans & Rice | [South Dakota State University Extension 原页](https://extension.sdstate.edu/one-pot-meals)；4 份，安杜伊香肠、糙米、芸豆、番茄、洋葱、西芹、青椒；同一煎锅煎料后加入 2 杯水和米，盖锅煮 45 分钟、离火加青椒焖 10 分钟；营养每 2 杯 515 kcal、蛋白 21g、纤维 13g。 | 普通煎锅分阶段；来源未给香肠温度终点，不外推电饭煲。与现有豆饭家族需后续 canonical 合并审查。 |
| `illinois-texas-hash` | Texas Hash | [University of Illinois Extension 原页](https://eat-move-save.extension.illinois.edu/eat/recipes/texas-hash)；5 份，瘦牛肉末或火鸡肉末 16oz、米 1 杯、番茄洋葱青椒罐头、水 2 杯；肉炒至 160°F 后同锅加入米和液体，盖锅小火约 20 分钟。 | 普通煎锅；来源允许牛/火鸡二选一，保留受控变体；米和肉的步骤不能改成电饭煲全投料。 |
| `va-pork-rice-skillet` | Pork and Rice Skillet | [VA Nutrition and Food Services PDF](https://www.nutrition.va.gov/docs/Recipes/MainDishes/Pork-And-Rice-Skillet.pdf)；4 份，猪排肉 1lb、糙米 1 杯、豌豆胡萝卜、低钠鸡汤 2 杯，酸奶/奶酪后拌；同一 skillet 总时长 1 小时 15 分。 | 普通煎锅；官方 PDF 只写猪肉 fully cooked，没有数值温度；PDF 需完成本地归档后再考虑 executable。 |

## 验证记录

- TDD：`tools/tests/source-backed-one-pot-batch-r129-global-public5.test.mjs`，锁定版本、条目数量、来源 URL、器具边界、主餐候选和安全缺口。
- 3 条来源均直接打开，登记 `access_status: opened`、`evidence_tier`、定位和实际 claim scopes；未使用搜索摘要替代原文。
- 本批未增加账号、Planner、运行时代码或 UI，不部署 production。
- 下一步仍需来源归档、安全合同审查、canonical 去重及厨房验证；`recipe_fact_checked` 不等于可对公众承诺。

# r128 全球公共机构一锅米饭资产批次

日期：2026-08-08
目录版本：`source-backed-one-pot-v1-20260808-global-r128`
范围：从 r127-public4 intake 中整合 5 条具名米饭主餐候选。

## 状态与边界

本批 5 条全部保持 `recipe_fact_checked`，不晋升 `executable` 或 `preview_ready`。它们是来源资产，不是已经通过本项目厨房验证的用户做法。电压力锅、普通锅、慢炖锅和重锅来源保持原器具边界，不把它们转换为普通电饭煲参数；来源没有给出的份数、时间、液体量和安全终点保持缺失。

| recipe_id | 菜名 | 来源/可证明事实 | 器具与关键缺口 |
| --- | --- | --- | --- |
| `tamu-turkey-burrito-bowl` | Turkey Burrito Bowl | [Texas A&M AgriLife Extension 原页](https://dinnertonight.tamu.edu/recipe/turkey-burrito-bowl/)；10 份，火鸡肉末、长粒白米、黑豆、青辣椒、番茄、牛肉汤、玉米等定量；电压力锅 Sauté、高压 8 分钟、快速泄压，页面称全程约 20 分钟。 | 明确是电压力锅/多功能压力锅，不是普通电饭煲；页面未给禽肉安全温度，保留空安全端点。 |
| `purdue-one-pot-lentil-dish` | One-pot Lentil Dish | [Purdue Extension 原页](https://www.purdue.edu/indianasefrnetwork/Home/MDDetail/131)；扁豆、糙米、胡萝卜、羽衣甘蓝和 3 杯水全部入大锅，煮沸后加盖小火约 20–30 分钟；页面标注 30–40 分钟省时菜。 | 普通大锅；来源未给固定份数，时间保留约 30–40 分钟边界，不外推电饭煲。 |
| `uconn-crock-pot-enchilada-rice` | Crock Pot Enchilada Rice | [University of Connecticut 原页](https://huskynutritionsport.education.uconn.edu/recipes/crock-pot-enchilada-rice/)；6 份，糙米、番茄、辣酱、青辣椒、玉米、黑豆、奶油奶酪；慢炖锅低档 7–8 小时/高档 3–4 小时，末段高档 15–30 分钟。 | 明确慢炖锅；液体写“蔬菜汤半杯或更多”，不建立固定液体合同，不外推电饭煲。 |
| `unh-spanish-rice` | Spanish Rice | [University of New Hampshire Extension 原页](https://extension.unh.edu/recipe/spanish-rice)；6 份，米、罐装猪肉、番茄、洋葱、西芹、青椒和 1 杯水；同一带盖锅炒米后加料，盖锅小火约 45 分钟；每份给出蛋白和纤维。 | 普通带盖锅；页面未提供猪肉安全终点，不外推电饭煲。 |
| `illinois-governors-mansion-chicken-manoomin` | Chicken & Rice（Wild Rice/Manoomin） | [Illinois Governor’s Mansion 原页](https://governorsmansion.illinois.gov/all-recipes/recipe.chicken-and-rice.html)；具名并称 hearty one-pot meal，鸡腿、胡萝卜、西芹、洋葱、蒜、2 夸脱鸡汤、野米和欧芹/羽衣甘蓝；重锅先煎鸡并取出，再炒菜、回锅鸡肉和香草后煮米。 | 同一重锅但有取出/回锅的分阶段流程；未给份数、总时长和禽肉安全温度，不外推电饭煲。 |

## 验证记录

- 5 个来源均为官方政府/大学 Extension 直达页，登记 `access_status: opened`、`evidence_tier` 和可复核定位；未用搜索摘要代替原文。
- 目录从 r126 的 890 条 bump 到 r128 的 895 条；新增 5 条 `recipe_fact_checked`，0 条 `executable`，`recipe_id` 保持唯一。
- 专项测试：`tools/tests/source-backed-one-pot-batch-r128-global-public4.test.mjs`。
- 本批只修改来源目录、批次文档与专项测试，不修改运行时、Planner、前端或 UI，不部署 production。

## 下一步

先做来源许可/归档与安全合同审查，再决定是否进入后续 executable 事实矩阵。五条都不能据此自动转成电饭煲做法；尤其 TAMU 仅证明电压力锅参数，Illinois 仅证明重锅分阶段流程。

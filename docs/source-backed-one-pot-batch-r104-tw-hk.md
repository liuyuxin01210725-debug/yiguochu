# 来源菜饭入库批次 r104：香港官方 EatSmart

研究日期：2026-08-07  
目录版本：`source-backed-one-pot-v1-20260807-national-r104`

## 本批变更

- 基线：r103，813 条。
- 新增：6 条，全部来自香港卫生署 EatSmart 官方直页。
- 结果：r104，819 条。
- 新增条目状态：6 条 `recipe_fact_checked`；0 条 `executable`；0 条公开轮替状态。
- 版本只在主 JSON 中 bump；没有修改运行时代码、旧 Planner、前端或部署配置。

## 新增条目

| recipe_id | 具名菜 | 来源 | 份数 | 实际记录的边界 |
|---|---|---|---:|---|
| `r104-hk-tomato-wintermelon-soup-rice` | 西紅柿瓜湯西施飯 | [EatSmart 1265](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=1265) | 1 | 汤、炒、蒸、装配的分阶段流程；不证明普通电饭煲全程一锅。 |
| `r104-hk-pumpkin-shrimp-golden-rice` | 南瓜蝦仁黃金飯 | [EatSmart 1262](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=1262) | 2 | 南瓜蒸、米饭煮、虾炒后拌合；虾类安全终点未闭合。 |
| `r104-hk-tomato-egg-beef-soup-rice` | 番茄蛋鮮牛肉湯泡飯 | [EatSmart 1248](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=1248) | 1 | 熟饭浇汤，登记为熟饭二次烹，不改写为生米同锅。 |
| `r104-hk-mushroom-italian-rice-ricotta` | 蘑菇意大利飯配軟芝士 | [EatSmart 982](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=982) | 1 | 高汤煮米、另锅煎菜、再合煮；不是一键电饭煲方案。 |
| `r104-hk-tomato-garden-vegetable-pao-rice` | 番茄湯田園雜菜泡飯 | [EatSmart 590](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=590) | 4 | 长时间煲汤后浇熟饭；鸡肉终点待补。 |
| `r104-hk-carrot-seafood-rice` | 胡蘿蔔海鮮飯 | [EatSmart 176](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=176) | 4 | 双锅预炒后饭锅收尾；多种海鲜安全终点待补。 |

## 入库纪律

每条记录均保留：

- 官方直达 URL、`opened` 状态、`evidence_tier: 1` 和证据定位；
- 来源实际给出的份数、食材量和步骤；未给出的字段保持 `null`；
- `cooker_adaptation.status: not_adapted`，不把炒锅、蒸锅、汤锅或熟饭流程推导成普通电饭煲参数；
- 虾、牛肉、鸡肉、海鲜等安全终点缺失时，停留在 `recipe_fact_checked`，不晋升 `executable`。

本批没有新增 `direct_one_pot` 条目：六条均含前处理、分阶段、双锅或熟饭二次烹边界。它们是有来源的研究资产，不是对用户承诺的电饭煲一键做法。

## 验证

```text
node --test tools/tests/source-backed-one-pot-batch-r104-tw-hk.test.mjs
3/3 passed
JSON.parse(source-backed-one-pot-recipes.v1.json) -> r104 / 819
git diff --check -> passed
```

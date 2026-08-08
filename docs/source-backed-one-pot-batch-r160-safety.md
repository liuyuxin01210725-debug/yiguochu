# r160 安全小批（既有条目安全终点闭合）

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260808-global-r159` / 923 条
当前状态：10 条既有条目已由单一写入线整合；不新增 canonical，不晋升 executable。

## 已回填（10 条，不新增 canonical）

| recipe_id | 原料状态与官方页面 | 计划安全端点 | 说明 |
|---|---|---|---|
| `r60-tiger-garlic-shrimp-herbed-rice` | Tiger [Garlic Shrimp with Herbed Rice](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/garlic-shrimp-with-herbed-rice/)：5/8 lb 去壳虾，去肠线后放 Tacook 盘，未标预熟 | `shellfish_fully_cooked`；虾肉呈珍珠白或白色且不透明 | 不添加温度数值；不改变 Tacook/内锅边界，不补水量或时长 |
| `r60-tiger-taiwan-minced-pork-rice` | Tiger [Taiwan Minced Pork](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/taiwan-minced-pork/)：1/2 lb 猪绞肉，调味后放 Tacook 盘，未标预熟 | `pork_fully_cooked`；74°C | 使用项目现行猪肉受控终点；不把 Synchro-Cooking 程序当作温度证据 |
| `r60-tiger-salmon-rice` | Tiger [Salmon Rice](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/salmon-rice/)：2 条 6–8 oz 去骨三文鱼，直接铺在米上以 Plain 程序烹调，未标预熟 | `seafood_fully_cooked`；63°C | 只对应鱼类；保留 2 杯水位、Plain 程序和出锅拆鱼流程 |
| `r60-tiger-chicken-brown-rice-soup` | Tiger [Chicken and Brown Rice Soup](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/chicken-and-brown-rice-soup/)：1.5 lb 去骨鸡胸/鸡腿，与米、蔬菜、鸡汤同锅，Slow Cook 120 分钟后检查熟度，未标预熟 | `poultry_fully_cooked`；74°C | 保留 5.5-cup、120 分钟和必要时延长边界；不以“熟透检查”替代温度端点 |
| `taiwan-pork-rib-claypot-rice` | 台湾农业部[排骨煲仔饭](https://kids.moa.gov.tw/theme_data.php?id=282&theme=kids_cooking)：排骨腌制后与米、汤水、蔬菜在砂锅分段焖煮 | `pork_fully_cooked`；74°C | 保留砂锅与分段流程；不改写为电饭煲参数 |
| `panasonic-taiwan-mushroom-chicken-bamboo-rice` | Panasonic [野菇鸡肉竹笋什锦饭](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/3797)：鸡腿肉腌味后与米、蔬菜按 SR-PAA100 混合饭程序炊煮 | `poultry_fully_cooked`；74°C | 保留 SR-PAA100 机型边界，不外推通用时长 |
| `panasonic-taiwan-shiitake-bamboo-chicken-rice` | Panasonic [香菇竹笋鸡肉炊饭](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/3842)：鸡腿先炒至变色，再与米和香菇水入锅 | `poultry_fully_cooked`；74°C | 保留“先炒后入锅”连续流程，不省略预处理 |
| `hk-tomato-mushroom-chicken-rice` | 香港食环署[番茄杂菇鸡腿肉饭图卡](https://www.fehd.gov.hk/english/pleasant_environment/tidy_market/images/ahtak_recipe/202012_w1a.jpg)：腌鸡腿与米、番茄、杂菇入电饭煲 | `poultry_fully_cooked`；74°C | 保留图卡米水、静置 3 分钟和电饭煲边界 |
| `hk-pumpkin-shiitake-pork-rice` | 香港食环署[南瓜冬菇猪肉炖饭图卡](https://www.fehd.gov.hk/english/pleasant_environment/tidy_market/images/ahtak_recipe/202012_w2b.jpg)：猪肉碎腌味后与米、南瓜、冬菇入电饭煲 | `pork_fully_cooked`；74°C | 按混合米饭猪肉终点处理，不套用整块猪肉规则 |
| `hk-sakura-shrimp-chicken-quinoa-rice` | 香港食环署[樱花虾冬菇鸡肉藜麦饭图卡](https://www.fehd.gov.hk/english/pleasant_environment/tidy_market/images/ahtak_recipe/202012_w3a.jpg)：鸡肉腌味后与藜麦、冬菇、樱花虾入电饭煲 | `poultry_fully_cooked`；74°C | 仅补鸡肉终点；樱花虾状态不明，不添加 shellfish endpoint |

十条新增 source ref 均使用现有 `S-SAFETY-TEMPERATURES-1`，scope 仅为 `safety`，并补齐 `opened`、`evidence_tier: 1` 与物种匹配的 `evidence_locator`。十条保持 `recipe_fact_checked`，不得晋升 `executable`。

## 明确不整合

`r60-tiger-szechuan-pork-tacook-rice` 暂不回填。Tiger 官方页面的食材栏写 Szechuan Pork，但 Directions 文本混入 Basic Congee（鸡汤、芹菜、姜、Porridge 70 分钟），与食材和标题冲突；待后续页面/版本证据修复后再审。

## 验证结果

- RED/GREEN 专项：`tools/tests/source-backed-one-pot-batch-r160-safety.test.mjs`
- 目录版本：`source-backed-one-pot-v1-20260808-global-r160`，总数仍为 923
- 10 条均为 `recipe_fact_checked`，安全覆盖增加 10 条；无新 canonical、无 executable 晋升
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`、`node tools/check-source-backed-one-pot-catalog.mjs`、`node tools/check-recipes.mjs`、`git diff --check` 均应通过
- 不改运行时、UI、Planner 或部署。

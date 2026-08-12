# r159 厂商来源合同字段回填批次

> 批次日期：2026-08-08
> 目录版本：`source-backed-one-pot-v1-20260808-global-r158` → `source-backed-one-pot-v1-20260808-global-r159`
> 目录数量：923 → 923（不新增 canonical）
> 变更范围：只回填已有 `recipe_fact_checked` 条目的同源字段；不改运行时代码、UI、Planner、生成模式或部署包。

## 批次原则

本批四条记录均来自已直接打开的 Tiger Corporation 官方原页，保持各自型号和同步烹调边界。没有拼接近名页面、不同机型、不同器具或普通电饭煲参数。

- 只将官方原页明确的固定份数和数值食材量写入 `fixed_batch`；`as needed`、`for flavor` 和装饰项不被编成数字。
- Takikomi 页的 Ultra 水位线以 Tiger 5.5/10-cup 型号范围写入 `liquid_contract`；不外推到普通电饭煲。
- Basic Congee 只回填官方明确的 0.5 Soft Porridge 水位线和 Porridge 70 分钟程序。页面标题提到 chicken，但食材栏没有鸡肉用量，故不写 `fixed_batch`，也不添加鸡肉安全终点。
- Taiwan Minced Pork 和 Garlic Shrimp 的米与主料在 Tacook 上层盘／内锅同步完成，不改写为同一内锅混合；二者没有固定水量或菜品总时长，继续保持相应字段 `null`。
- Garlic Shrimp 的生虾安全终点留待独立安全批次，避免把本批合同字段回填与安全证据混为一谈。

## 回填清单

| recipe_id | 本批回填 | 保留的缺口与边界 | 官方来源 |
| --- | --- | --- | --- |
| `tiger-takikomi-gohan` | `fixed_batch.servings=4`；同一原页有数值的米、鸡腿肉、油豆腐、根茎、魔芋、干香菇、荷兰豆和调味量；`liquid_contract` 为 Tiger 5.5-cup／10-cup 的 Ultra 水位 3／6 | 无该菜绑定的分钟总时长；魔芋和香菇需预处理，荷兰豆先煮并在出锅后加入；不提供普通电饭煲转换参数 | [Tiger Takikomi Gohan](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/takikomi-gohan-japanese-mixed-rice/)（`S-TIGER-TAKIKOMI-GOHAN-1`） |
| `r60-tiger-basic-chicken-congee` | `liquid_contract`：0.5 Soft Porridge 水位；`time_contract.total_minutes=70` | 页面没有鸡肉实际用量，`fixed_batch` 继续 `null`；10 分钟 preparation 不被改写成总时长；只适用于 Tiger 型号 | [Tiger Basic Congee](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/basic-congee-porridge/)（`S-TIGER-BASIC-CONGEE-R60`） |
| `r60-tiger-taiwan-minced-pork-rice` | `fixed_batch.servings=2`；米、猪绞肉、香菇、炸葱及原页有数值的酱油／老抽／绍兴酒／玉米淀粉／糖／五香粉 | 原页只写米加水，水量和总时长缺失；Tacook 上层盘同步，不外推普通电饭煲；生猪肉 74°C 安全终点另批处理 | [Tiger Taiwan Minced Pork](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/taiwan-minced-pork/)（`S-TIGER-TAIWAN-MINCED-PORK-R60`） |
| `r60-tiger-garlic-shrimp-herbed-rice` | `fixed_batch.servings=2`；米、虾、蒜、橄榄油、柠檬汁和特级初榨橄榄油等有数值项目 | 米内锅水量、程序分钟缺失；虾在 Tacook 上层盘，香草和盐/胡椒按原页口味或装饰处理；生虾安全 endpoint 另批处理 | [Tiger Garlic Shrimp with Herbed Rice](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/garlic-shrimp-with-herbed-rice/)（`S-TIGER-GARLIC-SHRIMP-HERBED-RICE-R60`） |

## 状态与安全

- 四条仍为 `recipe_fact_checked`，没有晋升 `executable`、`preview_ready` 或任何公开承诺状态。
- `safety_endpoints` 本批不新增；生猪肉和生虾的 endpoint 需要分别绑定已有 FoodSafety.gov 证据，并在独立安全 TDD 中处理。
- 目录总数仍为 923；本批没有新增 canonical、没有扩展来源 scope、没有重建运行包。

## 验证

- 先写并确认失败的 `tools/tests/source-backed-one-pot-batch-r159-manufacturer.test.mjs`，再回填目录；测试覆盖四条字段、版本号、来源 ID、型号水位线、缺口和状态边界。
- 目录 JSON 可解析。
- `node --test tools/tests/source-backed-one-pot-batch-r159-manufacturer.test.mjs`：4/4 通过。
- `node tools/build-source-backed-one-pot-catalog.mjs --check`：通过。
- `node tools/check-source-backed-one-pot-catalog.mjs`：通过。

# r192 鱼/禽安全缺口审计

基线：`source-backed-one-pot-v1-20260808-global-r191` / 923 条。

本批只处理两条已有 `recipe_fact_checked` 条目。两条来源均已给出原料投料状态和器具流程；本批只补 FoodSafety.gov 安全终点，不新增 canonical。

| recipe_id | 直达来源与已核实事实 | 本批处理 | 保留边界 |
| --- | --- | --- | --- |
| `maff-salmon-green-onion-takikomi` | MAFF 直页的鲑鱼葱炊饭；来源记录鲑鱼先撒盐并轻烤，再与葱、调味液和米在普通锅中煮熟，出锅拌匀。 | 挂 `seafood_fully_cooked`，鱼类最低中心温度 63°C；安全来源挂 `S-SAFETY-TEMPERATURES-1`。 | 来源是普通锅/燃气锅，保持 `not_adapted`；不把轻烤、煮熟文字转换成电饭煲合同。 |
| `zojirushi-nonokomeshi-el-mb30` | 象印官方页面的鸟取县 `ののこ飯`；鸡肉与根菜装入豆腐皮饭袋，和白米、昆布、液体一起进入自动压力 IH 锅，使用 27 分钟程序，静置10–15分钟。 | 挂 `poultry_fully_cooked`，禽肉最低中心温度 74°C；安全来源挂 `S-SAFETY-TEMPERATURES-1`。 | 27分钟、450mL和压力 IH 只对来源机型成立，保持 `source_limited`，不外推普通电饭煲或 executable。 |

## 安全来源

FoodSafety.gov [Cook to a Safe Minimum Internal Temperature](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures) 给出鱼类 145°F / 63°C、禽肉 165°F / 74°C。本批只将终点映射到来源明确的鲑鱼/鸡肉，不声称原方页面本身提供这些温度。

## 未处理

已熟鱼、熟蟹或另锅/熟饭二次烹条目不重复添加；仍有状态冲突、来源不可读或仅身份档案的高风险条目继续保持空端点。

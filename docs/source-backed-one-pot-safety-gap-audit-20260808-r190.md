# r190 鱼/禽安全缺口审计

基线：`source-backed-one-pot-v1-20260808-global-r189` / 923 条。

本批只处理两条已有 `recipe_fact_checked` 条目。两条原方均保留电锅/电子锅和缺失总时长边界；本批只挂独立的 FoodSafety.gov 安全终点，不新增 canonical。

| recipe_id | 直达来源与已核实事实 | 本批处理 | 保留边界 |
| --- | --- | --- | --- |
| `ntuh-salmon-mixed-mushroom-rice` | [台大医院营养室电子锅料理 PDF](https://epaper.ntuh.gov.tw/health/201908/PDF/%E5%81%A5%E5%BA%B7%E7%87%9F%E9%A4%8A%E8%A3%9C%E7%B5%A6%E7%AB%99.pdf)；正文给2人份、鲑鱼块、0.8杯水，鲑鱼与米菜同按煮饭键，完成后取出再摆回。 | 挂 `seafood_fully_cooked`，鱼类最低中心温度 63°C；安全来源独立挂 `S-SAFETY-TEMPERATURES-1`。 | `source_limited` 不变；不补总时长，不把“煮好后取出摆回”改写为其它程序。 |
| `taiwan-pine-nut-chicken-wild-mushroom-rice` | [台湾农业部儿童食谱入口](https://kids.moa.gov.tw/theme_data.php?id=79&theme=kids_cooking)；页面列米3杯、鸡腿、蔬菜和电锅约70分钟，鸡腿先腌/煎上色后铺入电锅，完成后确认熟透并拌松子；页面注明外部作者来源。 | 挂 `poultry_fully_cooked`，禽肉最低中心温度 74°C；安全来源独立挂 `S-SAFETY-TEMPERATURES-1`。 | `source_limited` 不变；保留外部作者署名、电锅3杯水和约70分钟边界，不宣称农业部原创或厨房验证。 |

## 安全来源

FoodSafety.gov [Cook to a Safe Minimum Internal Temperature](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures) 给出鱼类 145°F / 63°C、禽肉 165°F / 74°C。本批只将这些受控终点映射到来源明确的鱼块/鸡腿，不声称原方页面直接提供对应温度。

## 未处理

状态不明的混合海鲜、章鱼、黄鱼和旧页面连接中断的鲤鱼条目继续保持空端点；不以鱼名或“充分熟透”泛化出贝类端点。

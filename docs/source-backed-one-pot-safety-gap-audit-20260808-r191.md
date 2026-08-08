# r191 甲壳类安全缺口审计

基线：`source-backed-one-pot-v1-20260808-global-r190` / 923 条。

本批只处理 Philips 香港官方膏蟹粥。原页面已给出膏蟹入锅时点，但没有安全终点；不新增 canonical，不把压力锅改写为电饭煲。

| recipe_id | 直达来源与已核实事实 | 本批处理 | 保留边界 |
| --- | --- | --- | --- |
| `philips-crab-congee-all-in-one-cooker` | [Philips Hong Kong「膏蟹粥」](https://www.philips.com.hk/c-e/ho/philips-chef/recipe-overview-page/main-courses/crab-congee.html)；官方页列4–6人、膏蟹500g、米1杯、瑶柱20g、姜5g、水1000g；先以压力煮汤/小扁豆程序20分钟，剩5分钟泄压后加入膏蟹继续完成。 | 挂 `shellfish_fully_cooked` 视觉终点：蟹肉呈珍珠白或白色且不透明；安全来源挂 `S-SAFETY-TEMPERATURES-1`。 | `not_adapted` 和中途投蟹边界保持；不填74°C、不宣称电饭煲等价、不晋升 executable。 |

## 安全来源

FoodSafety.gov [Cook to a Safe Minimum Internal Temperature](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures) 的甲壳类图表给出虾、龙虾、蟹和扇贝应达到“肉质呈珍珠白或白色且不透明”。本批只补视觉终点，不从压力程序剩余分钟数倒推蟹肉温度。

## 未处理

出锅拌入熟蟹肉、另锅海鲜和物种/生熟状态不明的混合海鲜继续保持空端点；不把“煮熟”文字泛化成温度或跨器具合同。

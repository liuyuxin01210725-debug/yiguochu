# r200 医疗／营养机构禽肉安全缺口审计

> 基线：`source-backed-one-pot-v1-20260808-global-r199`，923 条；本轮只回填既有条目，不新增 canonical、不晋升 executable。

本轮复核五条已有官方或专业机构食谱。各原页都直接给出鸡肉／火鸡及煎、焖或烤的处理流程，但没有本项目独立的数值禽肉终点；因此统一挂既有 [FoodSafety.gov Safe Minimum Internal Temperatures](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures) 禽肉 74°C，且不改原份数、液体、总时长和器具边界。

| recipe_id | 直接来源事实 | 保留边界 |
| --- | --- | --- |
| `cleveland-clinic-chicken-brown-rice-casserole` | [Cleveland Clinic](https://health.clevelandclinic.org/one-pot-chicken-brown-rice-casserole-recipe?slug=one-pot-chicken-brown-rice-casserole-recipe%2F)：鸡腿与未煮糙米、蔬菜高汤同入带盖汤锅，低火约35分钟 | `poultry_fully_cooked` 74°C；额外补液仍是来源开放边界 |
| `bmc-chicken-carrots-brown-rice` | [Boston Medical Center Teaching Kitchen](https://www.bmc.org/recipes/one-pot-chicken-carrots-and-rice)：鸡腿与洋葱、胡萝卜同煎，再加糙米和肉汤焖煮 | `poultry_fully_cooked` 74°C；来源4–6人范围保持 null |
| `kidney-care-chicken-tikka-pulao` | [Kidney Care UK Kidney Kitchen](https://kidneycareuk.org/get-support/healthy-diet-support/kidney-kitchen/recipe-index/chicken-tikka-pulao/)：鸡胸和咖喱酱先炒上色，再与米、850ml鸡汤和蔬菜低火完成 | `poultry_fully_cooked` 74°C；普通带盖锅与40分钟合同保留 |
| `firststeps-turkey-vegetable-pilaf` | [First Steps Nutrition Trust 食谱册](https://www.firststepsnutrition.org/s/Eating-Well-Recipe-Book-for-web-10-Apr-2022-for-web.pdf) 第51页：火鸡胸先煎，加入米、蔬菜和400ml水后盖锅小火约15分钟 | `poultry_fully_cooked` 74°C；15分钟仍是焖煮段，不推算总时长 |
| `healthvermont-one-pot-chicken-brown-rice` | [Vermont Department of Health / WIC](https://www.healthvermont.gov/sites/default/files/documents/2016/12/cyf_WIC_EatWell_more_brown-rice_recipes.pdf) 第3页：鸡腿铺在糙米上，400°F覆盖烤45–50分钟后揭盖再烤15–20分钟 | `poultry_fully_cooked` 74°C；烤箱温度与阶段不外推电饭煲 |

五条均追加 `S-SAFETY-TEMPERATURES-1`，来源 `claim_scopes` 仅为 `safety`；没有把“熟透”“煮至完成”或程序分钟数冒充温度证据。

# r232 厂商鸡肉米饭安全终点闭合批次

基线为 r231/923。本批不新增 canonical、不晋升 executable，只为 4 条已有厂商 `recipe_fact_checked` 记录补入官方流程与独立食品安全来源能够支持的禽肉终点。

| recipe_id | 厂商原页事实 | 保留边界 | 回填 |
| --- | --- | --- | --- |
| `zojirushi-chicken-dry-curry` | Zojirushi 原页给出 4–5 份、150g 去骨去皮鸡腿、3 杯茉莉米、鸡汤与 JASMINE 水位 3；鸡肉和蔬菜铺在米面上同锅烹调。 | 仅限 NL-GAC10/18 页面程序/水位，不外推跨型号时间或通用水量。 | `poultry_fully_cooked`，74°C |
| `tefal-chicken-rice-olives-one-pot-pan` | Tefal 原页给出 4 份、300g 鸡胸、250g 巴斯马蒂米、500mL 水/鸡汤；鸡肉切块后在 One Pot 平底锅煎 3 分钟，再与米和汤液连续完成。 | 保留 One Pot 平底锅和先煎流程，不改写成电饭煲程序。 | `poultry_fully_cooked`，74°C |
| `tefal-italian-sundried-tomato-chicken-rice-r942720` | Tefal 原页给出 4 份、4 块鸡腿排、4 根鸡腿棒、1 杯米、1.5 杯鸡汤；鸡肉先煎，再转 200°C 烤箱约 40 分钟并上火收尾。 | 保留一体锅→烤箱两阶段，不外推普通电饭煲。 | `poultry_fully_cooked`，74°C |
| `tefal-spanish-style-chicken-legs-r106521` | Tefal 原页给出 2 份、3 只鸡腿、100g 米、300mL 鸡汤和蔬菜；鸡米在蒸饭碗底层，蔬菜在上层蒸篮，同一蒸锅连续蒸约 50 分钟。 | 保留双层蒸锅边界；不是单内锅电饭煲，也不把标题宣称为地域传统。 | `poultry_fully_cooked`，74°C |

四条终点统一引用 [FoodSafety.gov 安全最低内部温度表](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures) 的禽肉 165°F/74°C。该来源只支持禽肉安全终点，不补写来源未证明的时间、水量或器具等价关系。

## 验证

先在 r231 基线上运行专项测试，版本断言按预期失败；写入 4 条 endpoint 后 `source-backed-one-pot-batch-r232-safety.test.mjs` 通过 2/2。随后重建 source-backed artifacts，并运行目录 validator、聚合菜谱门禁和 `git diff --check`。

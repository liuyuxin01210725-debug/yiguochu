# r247 安全端点回填批次

基线：`source-backed-one-pot-v1-20260808-global-r246` / 923 条
本批：`source-backed-one-pot-v1-20260808-global-r247` / 923 条

本批不新增 canonical 菜谱，只为 3 条已有 Panasonic `recipe_fact_checked` 记录补挂 FoodSafety.gov 禽肉端点。三张原页都把鸡肉写成洗净/切块或腌制后，直接随米进入 Panasonic 内锅烹调；本批不改原有液体、程序、37 分钟或机型边界。

共享安全来源：`S-SAFETY-TEMPERATURES-1`，FoodSafety.gov “Cook to a Safe Minimum Internal Temperature”，opened，tier 1，retrieved 2026-08-10；禽肉最低中心温度 74°C。

| recipe_id | 回填 endpoint | 原始流程边界 |
| --- | --- | --- |
| `r59-panasonic-taiwan-tomato-spiced-chicken-rice` | `poultry_fully_cooked` / 74°C | 鸡腿肉切块、略腌后与米、番茄和 115g 鸡高汤同锅；白米/快速/炊饭约 37 分钟原合同不变。 |
| `panasonic-taiwan-mushroom-vegetable-oil-shallot-rice` | `poultry_fully_cooked` / 74°C | 去骨仿鸡腿肉洗净切条后与米、菌菇、蔬菜和 350g 鸡高汤同锅；SR-PAA100 程序和无总时长边界不变。 |
| `r97-panasonic-taiwan-green-sauce-chicken-risotto` | `poultry_fully_cooked` / 74°C | 鸡胸洗净切一口块后与米、300mL 鸡高汤和蔬菜同锅，完成后拌入青酱；份数和总时长仍缺。 |

保守边界：FoodSafety.gov 端点是成品安全要求，不把 Panasonic 页面改写为通用电饭煲合同，也不凭安全端点补份数、液体或总时长；三条仍为 `recipe_fact_checked`、非 `executable`。

验证：专项测试先在 r246 基线下失败，再在回填后通过；后续运行 catalog validator、`check-recipes`、生成物检查和 `git diff --check`。

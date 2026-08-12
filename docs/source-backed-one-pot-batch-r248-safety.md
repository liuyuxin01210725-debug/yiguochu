# r248 安全端点回填批次

基线：`source-backed-one-pot-v1-20260808-global-r247` / 923 条
本批：`source-backed-one-pot-v1-20260808-global-r248` / 923 条

本批不新增 canonical 菜谱，只为 2 条已有 Panasonic `recipe_fact_checked` 记录补挂 FoodSafety.gov 禽肉端点。两张原页都明确鸡胸/鸡腿进入 Panasonic 设备的烹调流程；本批保留蒸盘、南瓜蒸烤、蔬菜汆烫、成饭拌料等原始边界。

共享安全来源：`S-SAFETY-TEMPERATURES-1`，FoodSafety.gov “Cook to a Safe Minimum Internal Temperature”，opened，tier 1，retrieved 2026-08-10；禽肉最低中心温度 74°C。

| recipe_id | 回填 endpoint | 原始流程边界 |
| --- | --- | --- |
| `r59-panasonic-taiwan-tomato-chicken-cheese-risotto` | `poultry_fully_cooked` / 74°C | 鸡胸约 300–350g 放上层蒸盘，白米程序完成后移入米饭搅散并保温融化芝士；不改写为内锅生鸡肉同煮。 |
| `r97-panasonic-taiwan-cinderella-pumpkin-risotto` | `poultry_fully_cooked` / 74°C | 鸡腿约 200g 切小块、盐腌后铺在米面进入约 48 分钟白米程序；南瓜蒸烤和四季豆/胡萝卜汆烫仍是原方前处理。 |

保守边界：FoodSafety.gov 端点是成品安全要求，不证明 Panasonic 页面给出了温度，也不补缺失的份数或通用时间；两条仍为 `recipe_fact_checked`、非 `executable`。

验证：专项测试先在 r247 基线下失败，再在回填后通过；后续运行 catalog validator、`check-recipes`、生成物检查和 `git diff --check`。

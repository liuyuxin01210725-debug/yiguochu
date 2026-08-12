# r249 安全端点回填批次

基线：`source-backed-one-pot-v1-20260808-global-r248` / 923 条
本批：`source-backed-one-pot-v1-20260808-global-r249` / 923 条

本批不新增 canonical 菜谱，只为 2 条已有、已有固定批次和液体合同的官方鸡饭记录补挂 FoodSafety.gov 禽肉端点。

共享安全来源：`S-SAFETY-TEMPERATURES-1`，FoodSafety.gov “Cook to a Safe Minimum Internal Temperature”，opened，tier 1，retrieved 2026-08-10；禽肉最低中心温度 74°C。

| recipe_id | 回填 endpoint | 原始流程边界 |
| --- | --- | --- |
| `saito-wakeshiko-torimeshi` | `poultry_fully_cooked` / 74°C | 西都市官方 PDF：1 人份、精米 1 合、鸡腿 100g、牛蒡 100g、鸡汤 200mL；鸡腿切块后与米、牛蒡同入电饭煲。 |
| `r99-taiwan-golden-wild-mushroom-quinoa-chicken-rice` | `poultry_fully_cooked` / 74°C | 台湾农业部官方 PDF 第 180–181 页：2 人份、鸡胸 70g、米/藜麦/南瓜/三种菇、电锅和 2 米杯水；鸡胸与米同锅煮熟。 |

保守边界：FoodSafety.gov 端点是成品安全要求，不补来源没有给出的总时长或跨机型合同；两条仍为 `recipe_fact_checked`、非 `executable`。

验证：专项测试先在 r248 基线下失败，再在回填后通过；后续运行 catalog validator、`check-recipes`、生成物检查和 `git diff --check`。

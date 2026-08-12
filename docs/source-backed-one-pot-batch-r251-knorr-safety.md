# r251 安全端点回填批次

基线：`source-backed-one-pot-v1-20260808-global-r250` / 923 条
本批：`source-backed-one-pot-v1-20260808-global-r251` / 923 条

本批不新增 canonical 菜谱，只为 1 条已有、且官方原文明确为碎牛肉后投并继续焗制的记录补挂现有 FoodSafety.gov 牛肉端点。

共享安全来源：`S-SAFETY-TEMPERATURES-1`，FoodSafety.gov “Cook to a Safe Minimum Internal Temperature”，opened，tier 1，retrieved 2026-08-10；绞肉最低中心温度 71°C。

| recipe_id | 回填 endpoint | 原始流程边界 |
| --- | --- | --- |
| `knorr-electric-rice-cooker-egg-mushroom-beef-rice` | `beef_fully_cooked` / 71°C | Knorr 香港官方食谱：碎牛肉与冬菇在跳掣前约 5 分钟铺到饭面，跳掣后再加入鸡蛋并焗约 10 分钟；保留后投牛肉、窝蛋后置和电饭煲边界。鸡蛋没有独立 endpoint，继续保持该缺口。 |

保守边界：安全端点只表达碎牛肉的最低安全要求，不补来源未给出的米水、总时长或鸡蛋安全合同；记录仍为 `recipe_fact_checked`、非 `executable`。

验证：专项测试先在 r250 基线下失败，再在回填后通过；随后运行 catalog validator、`check-recipes`、生成物检查和 `git diff --check`。

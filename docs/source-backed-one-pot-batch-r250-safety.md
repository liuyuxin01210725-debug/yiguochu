# r250 安全端点回填批次

基线：`source-backed-one-pot-v1-20260808-global-r249` / 923 条
本批：`source-backed-one-pot-v1-20260808-global-r250` / 923 条

本批不新增 canonical 菜谱，只为 3 条已有、且官方原文明确了禽/鱼处理流程的记录补挂现有 FoodSafety.gov 安全端点。

共享安全来源：`S-SAFETY-TEMPERATURES-1`，FoodSafety.gov “Cook to a Safe Minimum Internal Temperature”，opened，tier 1，retrieved 2026-08-10。

| recipe_id | 回填 endpoint | 原始流程边界 |
| --- | --- | --- |
| `sg-healthhub-chicken-briyani` | `poultry_fully_cooked` / 74°C | Singapore Health Promotion Board：鸡肉先炒并煮至约八成熟，米另锅半熟，再分层收尾；保留普通锅/rice cooker pot 的阶段边界，不改成直接一锅电饭煲程序。 |
| `taiwan-sesame-oil-chicken-glutinous-rice-cake` | `poultry_fully_cooked` / 74°C | 台湾官方 PDF：鸡腿肉与配料先炒至熟，再入电锅蒸、拌匀并复蒸；保留炒锅、第一次蒸和复蒸的连续流程。 |
| `maff-salmon-corn-japanese-paella` | `seafood_fully_cooked` / 63°C | MAFF：鲑鱼先在平底锅煎，再与米、玉米和水加盖焖；保留炉灶平底锅边界，不外推电饭煲参数。 |

保守边界：安全端点只表达食材最低安全要求，不补来源未给出的份数、液体、总时长或跨器具转换合同；3 条仍为 `recipe_fact_checked`、非 `executable`。

验证：专项测试先在 r249 基线下失败，再在回填后通过；随后运行 catalog validator、`check-recipes`、生成物检查和 `git diff --check`。

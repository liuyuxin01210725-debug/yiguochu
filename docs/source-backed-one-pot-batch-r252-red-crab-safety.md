# r252 安全端点回填批次

基线：`source-backed-one-pot-v1-20260808-global-r251` / 923 条
本批：`source-backed-one-pot-v1-20260808-global-r252` / 923 条

本批不新增 canonical 菜谱，只为 1 条已有、且官方原文明确螃蟹先蒸并在米糕上继续蒸的记录补挂现有 FoodSafety.gov 甲壳类视觉端点。

共享安全来源：`S-SAFETY-TEMPERATURES-1`，FoodSafety.gov “Cook to a Safe Minimum Internal Temperature”，opened，tier 1，retrieved 2026-08-10；图表要求蟹肉达到珍珠白或白色且不透明。

| recipe_id | 回填 endpoint | 原始流程边界 |
| --- | --- | --- |
| `r58-taiwan-red-crab-glutinous-rice` | `shellfish_fully_cooked` / 肉质呈珍珠白或白色且不透明 | 台湾农业部农粮署《紅蟳米糕》：螃蟹先蒸 7–8 分钟，米糕入电锅后再把蒸过的螃蟹放上继续蒸；保留炒料、分段蒸锅/电锅和未给成品份数、总时长的边界。 |

保守边界：端点只表达最终蟹肉外观检查，不把 7–8 分钟推导成通用总时长，也不把分段蒸制改写成单一电饭煲执行合同；记录仍为 `recipe_fact_checked`、非 `executable`。

验证：专项测试先在 r251 基线下因版本/端点缺失失败，回填后 2/2 通过；随后运行 source-backed 测试、catalog validator、`check-recipes`、生成物检查和 `git diff --check`。

# r245 安全端点回填批次

基线：`source-backed-one-pot-v1-20260808-global-r244` / 923 条
本批：`source-backed-one-pot-v1-20260808-global-r245` / 923 条

本批不新增 canonical 菜谱，只为 5 条已有 `recipe_fact_checked` 记录补挂同一份 FoodSafety.gov 安全来源。每条 endpoint 只覆盖来源明确的生鲜蛋白；没有把普通锅、Tacook、粥程序或明火饭锅改写成通用电饭煲合同，也没有为熄火后加入的鸡蛋虚构 endpoint。

共享安全来源：`S-SAFETY-TEMPERATURES-1`，FoodSafety.gov “Cook to a Safe Minimum Internal Temperature”，opened，tier 1，retrieved 2026-08-10。

| recipe_id | 回填 endpoint | 原始流程边界 |
| --- | --- | --- |
| `huixian-ground-pot-chicken-rice` | `poultry_fully_cooked` / 74°C | 辉县地锅鸡米饭原文写鸡肉切块后直接炒、煮，再与生米同锅焖；原方的“约”“适量”仍不转成固定合同。 |
| `r59-tiger-usa-garlic-salmon-garden-rice` | `seafood_fully_cooked` / 63°C | 三文鱼放入 Tiger Tacook 盘，与内锅米饭 Synchro-Cooking；页面未给通用米水量/总时长。 |
| `tiger-bang-bang-chicken-rice` | `poultry_fully_cooked` / 74°C | 调味鸡腿在 Tacook 盘与米饭同步烹调；黄瓜、生菜、番茄和酱汁仍是出锅组合，不冒充内锅同煮。 |
| `r98-zojirushi-china-chestnut-chicken-congee` | `poultry_fully_cooked` / 74°C | 腌过的鸡胸铺在米上使用象印稠粥程序；总时长仍为 null，保持机型边界。 |
| `towngas-nest-egg-minced-beef-rice` | `beef_fully_cooked` / 71°C | 原方明确牛肉末在水收干后铺米焖煮；鸡蛋在熄火后加入，未新增鸡蛋安全终点。 |

验证：r245 专项测试先在 r244 基线下失败，再在回填后通过；后续门禁需确认 JSON、source-backed artifacts、历史快照与全量测试均为绿。

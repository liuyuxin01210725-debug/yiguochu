# r261 安全端点小批

日期：2026-08-10  
基线：`source-backed-one-pot-v1-20260808-global-r260` / 923 条  
结果：3 条已有官方同锅条目补入受控安全终点；不新增 canonical、不改变数量/液体/时间合同、不晋升 `executable`。

## 已回填

| recipe_id | 原始来源与流程边界 | 新端点 |
| --- | --- | --- |
| `midea-beef-pumpkin-rice` | 美的官方试用报告：牛肉切丁腌制后先在菜饭程序中翻炒，再继续加入米和南瓜炊煮；水量仍只写“平时煮饭水量” | `beef_fully_cooked`，71°C |
| `panasonic-taiwan-golden-snapper-rice` | Panasonic 官方页：鲷鱼处理后置于米面，按白米程序炊煮，出锅去骨拌回；保留电饭锅与3杯高汤边界 | `seafood_fully_cooked`，63°C |
| `iris-rc-pga-chicken-rice` | Iris RC-PGA50 官方页：鸡腿肉铺在白米水位2的米面，自动调理9约75分钟；保留机型边界 | `poultry_fully_cooked`，74°C |

三条均使用现有 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov，opened，tier 1，`claim_scopes: ["safety"]`）。安全来源只证明相应物种的最低终点，不替代官方配方对机型、液体或程序的证明。

## 边界

- 本批只写 `safety_endpoints`、安全来源和 evidence note；所有原有 `fixed_batch`、`liquid_contract`、`time_contract` 和 `cooker_adaptation` 保持不变。
- 三条继续保持 `recipe_fact_checked`，不转为 `executable`；不会把 71°C/63°C/74°C 反推成通用锅具或时长。
- 来源不稳定、熟肉/混合海鲜状态不明或仅有阶段时间的条目继续保留空安全数组。

## 验证

- RED/GREEN 专项：`tools/tests/source-backed-one-pot-batch-r261-safety.test.mjs`
- 目录版本：`source-backed-one-pot-v1-20260808-global-r261`，总数仍 923
- 预期：安全覆盖增加 3 条；无新 canonical、无 executable 晋升
- 需通过目录重建/门禁、`check-recipes.mjs` 与 `git diff --check`

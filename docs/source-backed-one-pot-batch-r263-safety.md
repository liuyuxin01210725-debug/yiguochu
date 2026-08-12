# r263 安全端点小批

日期：2026-08-10  
基线：`source-backed-one-pot-v1-20260808-global-r262` / 923 条  
结果：1 条已有官方同锅条目补入受控鱼类安全终点；不新增 canonical、不改变数量/液体/时间合同、不晋升 `executable`。

## 已回填

| recipe_id | 原始来源与流程边界 | 新端点 |
| --- | --- | --- |
| `maff-tokushima-ayuro-sui` | 日本农林水产省 MAFF 直页：德岛平锅米粥，米和蔬菜先煮，米菜变软后再放入整条香鱼；保留平锅、鱼后置和去骨边界 | `seafood_fully_cooked`，63°C |

本条使用现有 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov，opened，tier 1，`claim_scopes: ["safety"]`）。安全来源只证明鱼类最低终点，不替代 MAFF 原方对平锅、液体范围或后置投料的证明。

## 边界

- 本批只写 `safety_endpoints` 和安全来源；原有 `fixed_batch`、`liquid_contract`、`time_contract`、平锅器具及后置鱼类流程保持不变。
- 条目继续保持 `recipe_fact_checked`，不转为 `executable`；不会把 63°C 反推成电饭煲程序或时间。
- MAFF 来源给水量 7–9 杯范围，且鱼类在米菜软后才加入；本批不压缩这些范围或阶段。

## 验证

- RED/GREEN 专项：`tools/tests/source-backed-one-pot-batch-r263-safety.test.mjs`
- 目录版本：`source-backed-one-pot-v1-20260808-global-r263`，总数仍 923
- 预期：安全覆盖增加 1 条；无新 canonical、无 executable 晋升

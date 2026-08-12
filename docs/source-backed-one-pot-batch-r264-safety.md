# r264 安全端点小批

日期：2026-08-10  
基线：`source-backed-one-pot-v1-20260808-global-r263` / 923 条  
结果：1 条已有官方同锅条目补入受控贝类视觉终点；不新增 canonical、不改变数量/液体/时间合同、不晋升 `executable`。

## 已回填

| recipe_id | 原始来源与流程边界 | 新端点 |
| --- | --- | --- |
| `tatung-fresh-vegetable-clam-rice` | 大同官网：先用水和姜煮鲜蚬、取蚬汤并取出蚬肉，再与米和蔬菜入大同电锅；保留蚬汤对象不明、外锅水与内锅液体分层边界 | `shellfish_fully_cooked`，肉质呈珍珠白或白色且不透明 |

本条使用现有 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov，opened，tier 1，`claim_scopes: ["safety"]`）。安全来源只证明贝类视觉熟度，不替代大同原方对 800cc 蚬汤或“1:1:1”比例对象的证明。

## 边界

- 本批只写 `safety_endpoints` 和安全来源；原有 `fixed_batch`、`liquid_contract`、`time_contract`、大同电锅器具及先煮蚬汤流程保持不变。
- 条目继续保持 `recipe_fact_checked`，不转为 `executable`；不把视觉终点转成虚构温度或普通电饭煲程序。

## 验证

- RED/GREEN 专项：`tools/tests/source-backed-one-pot-batch-r264-safety.test.mjs`
- 目录版本：`source-backed-one-pot-v1-20260808-global-r264`，总数仍 923
- 预期：安全覆盖增加 1 条；无新 canonical、无 executable 晋升

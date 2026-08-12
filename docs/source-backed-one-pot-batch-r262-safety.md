# r262 安全端点小批

日期：2026-08-10  
基线：`source-backed-one-pot-v1-20260808-global-r261` / 923 条  
结果：2 条已有官方同锅条目补入受控禽肉安全终点；不新增 canonical、不改变数量/液体/时间合同、不晋升 `executable`。

## 已回填

| recipe_id | 原始来源与流程边界 | 新端点 |
| --- | --- | --- |
| `taiwan-sesame-chicken-mushroom-vegetable-rice` | 台湾农业部官方食农教育 PDF：鸡腿切块先在炒锅炒至上色，再移入电锅与米、双菇和高丽菜完成；保留预炒后移锅边界 | `poultry_fully_cooked`，74°C |
| `tefal-homechef-paella` | Tefal HOME CHEF 官方食谱册：同一内锅将 8 块鸡肉煎至金黄后取出，加入米和海鲜，鸡块回锅并运行 Rice 程序；仅补禽肉端点，海鲜状态不作推导 | `poultry_fully_cooked`，74°C |

两条均使用现有 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov，opened，tier 1，`claim_scopes: ["safety"]`）。安全来源只证明禽肉最低终点，不替代原配方对机型、液体或程序的证明。

## 边界

- 本批只写 `safety_endpoints`、安全来源和 evidence note；所有原有 `fixed_batch`、`liquid_contract`、`time_contract` 与 `cooker_adaptation` 保持不变。
- 两条继续保持 `recipe_fact_checked`，不转为 `executable`；不会把 74°C 反推成普通电饭煲程序或时间。
- Tefal 原页同时列虾、海螯虾和黑青口，但物种状态与统一终点表达不足，本批不追加海鲜端点。

## 验证

- RED/GREEN 专项：`tools/tests/source-backed-one-pot-batch-r262-safety.test.mjs`
- 目录版本：`source-backed-one-pot-v1-20260808-global-r262`，总数仍 923
- 预期：安全覆盖增加 2 条；无新 canonical、无 executable 晋升
- 需通过目录重建/门禁、`check-recipes.mjs` 与 `git diff --check`

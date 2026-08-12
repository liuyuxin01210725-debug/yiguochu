# r260 安全端点小批

日期：2026-08-10  
基线：`source-backed-one-pot-v1-20260808-global-r259` / 923 条  
结果：3 条已有官方同锅条目补入受控安全终点；不新增 canonical、不改变合同字段、不晋升 `executable`。

## 已回填

| recipe_id | 原始来源与同锅边界 | 新端点 |
| --- | --- | --- |
| `iris-pc-mb3-takikomi-rice` | Iris PC-MB3-H 官方页将鸡胸与米、根菜放入内锅，水至2合线后密封炊煮；不外推普通电饭煲 | `poultry_fully_cooked`，74°C |
| `cookpot-three-cup-chicken-rice` | 锅宝官方页先在电子锅加热模式爆香鸡腿，再加入白米和鸡高汤切换米饭模式；保留页面香菇字段冲突 | `poultry_fully_cooked`，74°C |
| `panasonic-taiwan-salmon-daikon-golden-rice` | Panasonic SR-PAA100 官方页将切丁鲑鱼与米、萝卜放入内锅，白米程序完成；鸡蛋为完成后加热流程 | `seafood_fully_cooked`，63°C |

三条均继续使用现有 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov，opened，tier 1，`claim_scopes: ["safety"]`）。安全来源只证明相应物种的最低终点，不替代厂商页对机型、米水、程序或预处理的证明。

## 明确边界

- 本批只补 `safety_endpoints` 与对应安全来源/evidence note；`fixed_batch`、`liquid_contract`、`time_contract` 和 `cooker_adaptation` 原样保留。
- 三条仍为 `recipe_fact_checked`，不是可直接轮替的 `executable`；不把 74°C/63°C 反推成通用程序时长。
- Philips 豆浆鸡肉粥、混合海鲜及流程状态不明的条目继续留空，避免把“鸡肉/海鲜”名称误当作生鲜状态证明。

## 验证

- RED/GREEN 专项：`tools/tests/source-backed-one-pot-batch-r260-safety.test.mjs`
- 目录版本：`source-backed-one-pot-v1-20260808-global-r260`，总数仍 923
- 预期：安全覆盖增加 3 条；无新 canonical、无 executable 晋升
- 需通过 `build-source-backed-one-pot-catalog.mjs --check`、`check-source-backed-one-pot-catalog.mjs`、`check-recipes.mjs` 与 `git diff --check`

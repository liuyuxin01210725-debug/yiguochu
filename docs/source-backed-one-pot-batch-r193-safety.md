# r193 MAFF 鱼饭安全终点小批

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260808-global-r192` / 923 条
当前：`source-backed-one-pot-v1-20260808-global-r193` / 923 条

本批只闭合两条既有 `recipe_fact_checked` 条目的鱼类安全终点，不新增 canonical、不晋升 `executable`，不修改液体、时间或器具合同。

## 已回填

| recipe_id | 来源与流程 | endpoint | 边界 |
| --- | --- | --- | --- |
| `maff-tokushima-tai-meshi` | MAFF 德岛鲷饭原页：鲷清理、撒盐并烤至上色，再放在米上炊煮，出锅去骨拌回。 | `seafood_fully_cooked` / 63°C | 保留先烤后炊和传统来源器具；不把炊饭/焖制时间当成温度证明。 |
| `maff-tochigi-ayu-meshi` | MAFF 栃木香鱼饭原页：香鱼去内脏后先烤，再与调味米入电饭煲炊煮，完成后去骨拌回。 | `seafood_fully_cooked` / 63°C | 保留先烤、来源电饭煲和去骨流程；不外推其他机型时间。 |

两条均新增同一 `S-SAFETY-TEMPERATURES-1` source ref，scope 仅为 `safety`，并保留原 MAFF source ref 的 identity/ingredients/process/appliance 作用域。两条仍是研究层条目，安全覆盖由 150 增至 152，目录总数保持 923。

## 不整合

`maff-aichi-tako-meshi` 的生章鱼、`maff-shimane-sazae-meshi` 的蝾螺和 `maff-ibaraki-hamaguri-gohan` 的蛤蜊仍需分别确认头足类/贝类适用终点，不在本批用相邻菜或泛化海鲜规则代替。

## 验证

- RED/GREEN 专项：`tools/tests/source-backed-one-pot-batch-r193-safety.test.mjs`
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`
- `node tools/check-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-recipes.mjs`
- `git diff --check`

未修改 runtime、UI、Planner 或部署配置。

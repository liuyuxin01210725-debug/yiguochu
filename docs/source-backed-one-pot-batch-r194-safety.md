# r194 MAFF 蝾螺／鸡肉饭安全终点小批

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260808-global-r193` / 923 条
当前：`source-backed-one-pot-v1-20260808-global-r194` / 923 条

本批只闭合两条已有 `recipe_fact_checked` 条目的安全字段，不新增 canonical、不晋升 `executable`，不修改液体、时间和原始器具边界。

## 已回填

- `maff-shimane-sazae-meshi`：蝾螺先煮取汁后与米炊煮，挂 `shellfish_fully_cooked` 视觉终点“肉质呈珍珠白或白色且不透明”。
- `maff-nagasaki-torimeshi`：鸡肉先炒并焖至来源明确的“完全熟透”后拌饭，挂 `poultry_fully_cooked` 74°C。

两条均追加 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov，`scope=safety`、`opened`、`evidence_tier=1`），原 MAFF 来源仍分别承担身份、食材和流程事实。安全覆盖由 152 增至 154，目录总数保持 923。

## 保持阻塞

`maff-aichi-tako-meshi`、`maff-yamaguchi-uni-meshi` 等头足类／海胆条目不在本批套用鱼类或贝类 endpoint；`maff-ibaraki-hamaguri-gohan` 继续留待单独核实蛤蜊状态与视觉终点。

## 验证

- RED/GREEN 专项：`tools/tests/source-backed-one-pot-batch-r194-safety.test.mjs`
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`
- `node tools/check-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-recipes.mjs`
- `git diff --check`

未修改 runtime、UI、Planner 或部署配置。

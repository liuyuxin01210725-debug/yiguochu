# r196 石川县蝾螺饭安全终点小批

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260808-global-r194` / 923 条
当前：`source-backed-one-pot-v1-20260808-global-r196` / 923 条

本批只闭合一条已有 `recipe_fact_checked` 条目的贝类安全字段，不新增 canonical、不晋升 `executable`，不修改液体、时间或原始器具边界。r195 保留的蛤蜊、章鱼和海胆阻塞项仍不整合。

## 已回填

| recipe_id | 来源与流程 | endpoint | 边界 |
| --- | --- | --- | --- |
| `maff-ishikawa-sazae-meshi` | MAFF 石川县能登原页：蝾螺去壳、去内脏并清洗，按来源处理后与米炊煮；原页保留先处理/分阶段的传统流程。 | `shellfish_fully_cooked` / 肉质呈珍珠白或白色且不透明 | 复用 FoodSafety.gov 贝类视觉终点；不把米饭焖制时间当成安全温度证明，也不改写来源器具。 |

新增 `S-SAFETY-TEMPERATURES-1` source ref（scope 仅为 `safety`、`opened`、`evidence_tier=1`），原 MAFF source ref 继续承担身份、食材、数量、液体与流程事实。安全覆盖由 154 增至 155，目录总数保持 923。

## 保持阻塞

`maff-ibaraki-hamaguri-gohan` 的蛤蜊肉、`maff-aichi-tako-meshi` 的生章鱼和 `maff-yamaguchi-uni-meshi` 的生海胆仍没有可无损映射的项目安全终点；`hk-golden-seafood-congee` 的混合海鲜也不套用单一 endpoint。

## 验证

- RED/GREEN 专项：`tools/tests/source-backed-one-pot-batch-r196-safety.test.mjs`
- source-backed 全套：547/547
- 全量串行：2419/2419
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`
- `node tools/check-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-recipes.mjs`
- `git diff --check`

未修改 runtime、UI、Planner 或部署配置。

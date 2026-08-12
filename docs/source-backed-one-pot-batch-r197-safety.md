# r197 海鲜安全契约批次

基线目录 `source-backed-one-pot-v1-20260808-global-r196`（923 条）升级为
`source-backed-one-pot-v1-20260808-global-r197`（923 条）。本批不新增 canonical，
不晋升 executable，只为 7 条既有 `recipe_fact_checked` 记录补上可追溯的安全终点。

## 回填范围

- `hk-golden-seafood-congee`
- `maff-aichi-tako-meshi`
- `maff-okayama-tako-meshi`
- `jp-mie-tako-meshi`
- `maff-yamaguchi-uni-meshi`
- `tiger-uni-rice`

上述 6 条均保留原菜谱的物种、投料阶段和器具边界，挂同一条 CDC 一般海鲜
内部温度终点 `seafood_fully_cooked`（63°C）。CDC 原文同时提醒生/半生鱼或鱿鱼
存在风险，且 FDA 对一般海鲜建议至少 145°F（约 63°C）：
<https://www.cdc.gov/anisakiasis/about/index.html>。

`maff-ibaraki-hamaguri-gohan` 保留“蛤蜊先处理、饭熟后再焖入”的 MAFF 分段流程，
挂去壳蛤蜊的视觉终点 `shellfish_fully_cooked`：

- Virginia Department of Health：去壳蛤蜊至少煮/焖 3 分钟，或煮至边缘卷曲。
  <https://www.vdh.virginia.gov/epidemiology/epidemiology/epidemiology-fact-sheets/risks-of-eating-raw-oysters-and-clams/>
- Florida Department of Agriculture and Consumer Services：蛤蜊肉充分熟制时应饱满且不透明。
  <https://www.fdacs.gov/Consumer-Resources/Buy-Fresh-From-Florida/Seafood-Products/Clams>

## 证据与边界

安全公共来源均以 `source_kind=government_food_safety_guidance`、
`access_status=opened`、`evidence_tier=1`、`claim_scopes=["safety"]` 写入对应条目的
`source_refs`。温度/视觉终点是安全契约，不反向改写原菜谱的时间、液体、程序或
电饭煲适配；未明确生鲜状态、预煮状态或物种的其他条目继续保留空安全数组。

## 验证

- `tools/tests/source-backed-one-pot-batch-r197-safety.test.mjs`：2/2
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`
- `node tools/check-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-recipes.mjs`
- `node --test --test-concurrency=1 tools/tests/source-backed*.test.mjs`：549/549
- `node --test --test-concurrency=1 tools/tests/*.test.mjs`：2421/2421

未修改 runtime、UI、Planner 或部署配置。

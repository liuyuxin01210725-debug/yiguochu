# r197 海鲜安全缺口审计：章鱼、海胆、混合海鲜与蛤蜊肉

日期：2026-08-08
基线：`source-backed-one-pot-v1-20260808-global-r196` / 923 条

本轮只审查既有 `recipe_fact_checked` 条目的安全字段，不新增 canonical、不晋升 `executable`，不修改液体、时间或原始器具边界。采用的直接公共安全来源：

- [CDC About Anisakiasis](https://www.cdc.gov/anisakiasis/about/index.html)：正文第 66–70 行把“seafood in general”对应到至少 145°F（约 63°C），并明确生/半生鱼或鱿鱼风险。
- [Virginia Department of Health: Risks of Eating Raw Oysters and Clams](https://www.vdh.virginia.gov/epidemiology/epidemiology/epidemiology-fact-sheets/risks-of-eating-raw-oysters-and-clams/)：正文第 51–63 行给出带壳与去壳蛤蜊的熟制判断；去壳蛤蜊至少煮/焖 3 分钟或至边缘卷曲。
- [Florida Department of Agriculture and Consumer Services: Clams](https://www.fdacs.gov/Consumer-Resources/Buy-Fresh-From-Florida/Seafood-Products/Clams)：正文第 31–32、70–100 行说明去壳蛤蜊保存/处理，并以肉质饱满、不透明作为熟制外观。

## 可无损闭合

| recipe_id | 原菜谱事实 | 回填 | 边界 |
| --- | --- | --- | --- |
| `hk-golden-seafood-congee` | 花蛤、虾、鱿鱼、带子同锅分阶段加入，原页要求煮至海鲜熟透。 | `seafood_fully_cooked` / 63°C，复用 CDC“seafood in general”安全终点。 | 不把“煮至熟透”改写为来源提供的温度；端点是项目安全检查，原普通锅流程保持不变。 |
| `maff-aichi-tako-meshi` | 生章鱼与米同锅炊煮。 | `seafood_fully_cooked` / 63°C。 | CDC 来源覆盖一般海鲜；不把炊饭程序分钟数当成安全证明。 |
| `maff-okayama-tako-meshi` | 章鱼去黏膜、切块后与米同炊。 | `seafood_fully_cooked` / 63°C。 | 保留 MAFF 原页的同锅器具与处理步骤。 |
| `jp-mie-tako-meshi` | 生章鱼盐揉、腌制后与米同炊，原页另要求确认全熟。 | `seafood_fully_cooked` / 63°C。 | 安全源承担公共终点，MAFF 来源承担菜谱流程。 |
| `maff-yamaguchi-uni-meshi` | 生海胆在临近沸腾时加入米中继续炊煮。 | `seafood_fully_cooked` / 63°C。 | 不声称原页已经验证温度；用户需按端点确认海胆达到安全熟制。 |
| `tiger-uni-rice` | 部分生海胆同米炊煮，余量在饭熟后加入并短暂焖拌。 | `seafood_fully_cooked` / 63°C。 | 保留后加海胆阶段，不把短暂焖制时间当作温度证明。 |
| `maff-ibaraki-hamaguri-gohan` | 蛤蜊肉先处理并分离汤汁，米炊好后再加入配料焖约 10 分钟。 | `shellfish_fully_cooked` / 去壳蛤蜊边缘卷曲、肉质饱满且不透明。 | 使用 VDH + FDACS 两个直接安全来源；不把来源 10 分钟焖制视为自动保证。 |

## 仍不回填

本轮没有把其他海鲜、熟章鱼或干制海产条目套入端点；若原料状态已经是熟制，或页面未明确生鲜状态，则继续保持原安全数组和器具边界。

## 验证计划

- RED/GREEN 专项：`tools/tests/source-backed-one-pot-batch-r197-safety.test.mjs`
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`
- `node tools/check-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-recipes.mjs`
- `git diff --check`

未修改 runtime、UI、Planner 或部署配置。

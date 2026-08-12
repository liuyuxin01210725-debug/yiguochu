# r214：TEFAL602 官方食谱固定批量回填

- 基线：`source-backed-one-pot-v1-20260808-global-r213`，923 条
- 本批版本：`source-backed-one-pot-v1-20260808-global-r214`，923 条
- 新增 canonical：0
- 新增 executable：0
- 变更范围：3 条既有 `recipe_fact_checked` 的同源 4 人份 `fixed_batch`

## 回填条目

### `tefal-602-chicken-pea-risotto` / Chicken & Pea Risotto

TEFAL602 官方食谱 PDF 明确 4 人份：Arborio 米 300g、鸡高汤 650mL、熟鸡肉 250g、豌豆 75g；原方还要求平底锅预处理，并在约 20 分钟后加入熟鸡肉和豌豆。回填上述固定批次；熟鸡肉不替换为生鸡肉，PDF归档、其他型号适配和 executable 边界保持未闭合。

来源：[Tefal「Chicken & Pea Risotto」](https://www.tefal.com/medias/?context=bWFzdGVyfENTUyBSRUNJUEUgQk9PS3wxNDcxMTM4fGFwcGxpY2F0aW9uL3BkZnxDU1MgUkVDSVBFIEJPT0svaDZkL2g5NC85ODI1ODkyMzAyODc4LnBkZnxjY2M0NzU4NDA0ZTY2Zjk4MDVlNGY4OWQyNzg3NTg2Y2QyN2M1OGU3YzFkZjkxYjA0MTlhYWY2ODQ4YjM3)

### `tefal-602-smoked-haddock-kedgeree` / Smoked Haddock Kedgeree

同一 TEFAL602 官方食谱 PDF 明确 4 人份：印度香米 250g、烟熏黑线鳕 300g、高汤 400mL；鸡蛋另行煮熟后搭配。回填米、鱼和高汤定量；保留鱼类安全终点、PDF归档和另锅鸡蛋边界，不把烟熏鱼或鸡蛋步骤合并成新合同。

来源：[Tefal「Smoked Haddock Kedgeree」](https://www.tefal.com/medias/?context=bWFzdGVyfENTUyBSRUNJUEUgQk9PS3wxNDcxMTM4fGFwcGxpY2F0aW9uL3BkZnxDU1MgUkVDSVBFIEJPT0svaDZkL2g5NC85ODI1ODkyMzAyODc4LnBkZnxjY2M0NzU4NDA0ZTY2Zjk4MDVlNGY4OWQyNzg3NTg2Y2QyN2M1OGU3YzFkZjkxYjA0MTlhYWY2ODQ4YjM3)

### `tefal-602-seafood-paella` / Seafood Paella

同一 TEFAL602 官方食谱 PDF 明确 4 人份：Paella 米 300g、鱼高汤 500mL、海鲜混合 250g、豌豆 75g；约 28 分钟后再分阶段加入海鲜、番茄和欧芹并继续加热约 5 分钟。回填固定批次，保留分阶段海鲜投料与安全终点缺口，不把其他 Tefal 版本拼接进来。

来源：[Tefal「Seafood Paella」](https://www.tefal.com/medias/?context=bWFzdGVyfENTUyBSRUNJUEUgQk9PS3wxNDcxMTM4fGFwcGxpY2F0aW9uL3BkZnxDU1MgUkVDSVBFIEJPT0svaDZkL2g5NC85ODI1ODkyMzAyODc4LnBkZnxjY2M0NzU4NDA0ZTY2Zjk4MDVlNGY4OWQyN2M1OGU3YzFkZjkxYjA0MTlhYWY2ODQ4YjM3)

## 验证

- r214 专项测试：3/3
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`：通过
- `node tools/check-source-backed-one-pot-catalog.mjs --check`：通过
- `node tools/check-recipes.mjs`：通过
- `git diff --check`：通过
- source-backed + frontend 聚焦测试：597/597
- 全量 `node --test --test-concurrency=1 tools/tests/*.test.mjs`：2468/2468
- 三条仍是来源/事实层记录，不晋升 executable；熟鸡肉后加、另锅鸡蛋和分阶段海鲜流程均保留。

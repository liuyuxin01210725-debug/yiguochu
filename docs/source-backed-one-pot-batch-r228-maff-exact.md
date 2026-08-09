# r228 MAFF exact fixed-batch closure

基线：`source-backed-one-pot-v1-20260808-global-r227` / 923 条。版本升至 r228；不新增 canonical，不晋升 executable。

本批只回填同一官方来源明确给出的固定份数和配料量。没有来源单值证据的液体、总时长、器具适配和安全终点继续保留 `null`/原值。

## 1. 鮭とねぎの炊き込みご飯

- `recipe_id`: `maff-salmon-green-onion-takikomi`
- 原始来源：[農林水産省近畿農政局 PDF](https://www.maff.go.jp/kinki/syouhi/seikatu/syokuiku/attach/pdf/251114-25.pdf)，PDF 第 2 页。
- 同一页明确 2 人份：米 1 合、鲑鱼 1 切、葱 1/2 本；酒/酱油/味醂各 2 小匙、出汁素 1/2 小匙、水 180mL。
- 回填：`fixed_batch.servings=2`，上述定量食材及 `liquid_contract.added_water=180mL`。
- 边界：鲑鱼先撒盐静置并轻烤，再与米、葱、调味料用普通锅/燃气锅煮；未推导电饭煲，未把来源未给出的总时长写入。

## 2. とふめし

- `recipe_id`: `maff-tofumeshi`
- 原始来源：[農林水産省「とふめし 兵庫県」](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/40_12_hyogo.html)。
- 官方正文明确 4 人份：米 2 合、木棉豆腐 200g、牛蒡 80g、胡萝卜 30g、油炸豆腐 20g、鲭鱼水煮罐 80g、油 1 小匙、酱油 2 大匙、酒 1 小匙。
- 回填：`fixed_batch.servings=4` 及上述定量食材。
- 边界：米先炊，豆腐/蔬菜/鲭鱼另锅处理，铺到熟饭上蒸 15–20 分钟后拌匀；这是熟饭二次烹/多阶段版本，未写成生米一键电饭煲。液体和整道总时长仍为空。

## 验证

- `node --test tools/tests/source-backed-one-pot-batch-r228-maff-exact.test.mjs`：2/2
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`
- `node tools/check-source-backed-one-pot-catalog.mjs --check`
- `node tools/check-recipes.mjs`
- `git diff --check`

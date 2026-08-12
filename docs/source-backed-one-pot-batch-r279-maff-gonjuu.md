# r279 MAFF ごんじゅう fixed batch

基线：`source-backed-one-pot-v1-20260808-global-r278` / 923 条。  
本批：`source-backed-one-pot-v1-20260808-global-r279` / 923 条。

本批不新增 canonical、不新增生产菜谱，只把农林水产省原页已经明确的 20 个饭团批次和材料量写回既有 `maff-chiba-gonjuu`。这是熟饭二次拌料/饭团流程，仍不是生米一锅电饭煲合同。

## 同源原页事实

MAFF [ごんじゅう 千葉県](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/gonjuu_chiba.html) 原页明确：材料为米 5 合、猪五花肉 400g、油豆腐皮 5 枚、柴鱼片 50g、砂糖轻 3 大匙、酱油 150cc、味醂 50cc、酒 100cc、水 250cc，成品为 20 个饭团。步骤是先炊米，柴鱼片干炒，油豆腐皮焯水切碎，猪肉切丁；具材在锅中煮熟后连煮汁拌入熟饭，最后握成饭团。

## 回填范围

- `fixed_batch.servings=20`，并逐项写入原页给出的数量；每项均挂 `S-MAFF-CHIBA-GONJUU-1` 的 `quantity` 事实。
- `liquid_contract` 继续为 `null`：250cc 是具材调味煮制用水，不是生米炊饭的统一内锅液体合同。
- `time_contract` 继续为 `null`：原页没有整道总时长。
- `cooking_sequence` 保留“米先炊—具材煮熟—熟饭拌料—握饭团”的 staged/cooked-rice 边界。
- 条目仍为 `recipe_fact_checked`，不晋升 `executable`，不进入生产 72 道基础菜谱。

## 验证

- TDD：`tools/tests/source-backed-one-pot-batch-r279-maff-gonjuu.test.mjs` 先在 r278 基线下因版本和 fixed batch 缺失失败，回填后再通过。
- 批次收尾运行目录 validator、生成物检查、`node tools/check-recipes.mjs` 和全量测试。

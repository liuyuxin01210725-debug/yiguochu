# r226 MAFF fixed-batch closures

本批基于 `source-backed-one-pot-v1-20260808-global-r225`，目录总数仍为 923；按同一日本农林水产省原页回填 4 条既有记录的固定批次/前段液体字段。不新增 canonical，也不晋升 executable。

## maff-ishikawa-mitama — みたま

- 来源：[みたま 石川县｜日本农林水产省](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/mitama_ishikawa.html)
- 原页材料：4 人份；糯米 5 杯、黑豆 1 杯、盐 1 小匙、水 3–3.5 杯。
- 回填：固定批次 4 人，水保留在固定材料中并注明为浸豆用水；不建立 `liquid_contract`。
- 边界：黑豆与糯米分锅浸泡/蒸制，保留蒸制器具，不外推电饭煲水位。

## maff-tokushima-irimeshi — いり飯

- 来源：[いり饭／いりこ饭 德岛县｜日本农林水产省](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/44_10_tokushima.html)
- 原页材料：约 4 人份；米 300g（2 合）、炊饭水 450mL、煮干 20g、竹轮 30g、牛蒡 60g、魔芋 60g、胡萝卜 30g、鲜香菇 20g、油揚げ 15g、青葱 2–3 根，另有浸泡/煮汁调味量。
- 回填：固定批次 4 人；`liquid_contract` 仅登记米的前段炊饭水 450mL。
- 边界：米先煮熟，具材另锅收汁后拌入熟饭；不改写为生米电饭煲方案。

## maff-kochi-koshimeshi — こうし飯

- 来源：[こうし饭 高知县｜日本农林水产省](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/koshimeshi_kochi.html)
- 原页材料：10 人份（5 合米）；岩海苔 1–2 枚、米 750g、腌萝卜 1/3 根、吻仔鱼 100g、淡口酱油 2 大匙、砂糖 1 大匙。
- 回填：固定批次 10 人；未把熟饭冷却/拌合过程推成液体合同。
- 边界：米先煮熟后冷却，再拌入鱼、腌萝卜和海苔，属于熟饭拌料资产。

## maff-saga-kuri-okowa — 栗おこわ

- 来源：[栗御饭 佐贺县｜日本农林水产省](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/45_17_saga.html)
- 原页材料：4 人份；糯米 400g、栗 300g、小豆 80g，盐为“少々”。
- 回填：固定批次 4 人及三项有数值材料；盐保持来源的非数值表达。
- 边界：糯米浸泡、小豆预煮后与栗混合蒸制；未补液体、蒸制总时间或电饭煲适配。

验证：r226 专项测试先红后绿；目录构建、目录门禁、菜谱门禁和 `git diff --check` 在批次收尾时运行。

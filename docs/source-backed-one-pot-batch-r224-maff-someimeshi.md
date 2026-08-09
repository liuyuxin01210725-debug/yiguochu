# r224 MAFF someimeshi fixed batch

本批基于 `source-backed-one-pot-v1-20260808-global-r223`，目录总数仍为 923；回填一条日本农林水产省原页已给出完整材料批次的染饭记录，不新增 canonical，也不晋升 executable。

## maff-shizuoka-someimeshi

- 来源：[染飯 静岡県｜日本农林水产省](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/36_7_shizuoka.html)
- 证据：原页材料为 5 人份：米1合、糯米1合、栀子1–2个、水1杯（栀子浸出）、A水1杯、盐2/3小匙、酒1大匙、A煎茶1小匙，另有芝麻适量。
- 回填：固定批次 5 人；保留栀子范围为 `1 至 2 个`；两次各1杯水合并记录为 2 cup added water。芝麻“适量”不写成数值。
- 保留缺口：来源给出浸泡/焖置步骤，但没有整道总时长；该条是染色风味米饭，营养角色单一，不晋升均衡主餐或 executable。
- 状态：`recipe_fact_checked`，`cooker_adaptation.status=source_limited`。

验证：r224 专项测试通过；生成目录门禁、菜谱门禁和 `git diff --check` 在批次收尾时运行。

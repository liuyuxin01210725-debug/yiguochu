# r221 MAFF fixed-batch closure

基线：`source-backed-one-pot-v1-20260808-global-r220` / 923 条。

本批不新增 canonical、不新增 executable，仅把同一日本农林水产省原页已经给出的固定批次写回两条既有 `recipe_fact_checked` 记录。芋头炊饭的出汁换算为 1 又 1/5 杯（1.2 cup）；奈良色饭原页同时出现 900mL 出汁和步骤中的 500mL 混合液，因此不建立液体合同。两条都保留来源器具、预处理和未闭合安全/时长边界。

| recipe_id | 回填字段 | 原页与证据定位 | 未回填项 |
| --- | --- | --- | --- |
| `maff-satoimo-rice` | 2 人；米 180g、芋头 100g、油炸豆腐约 20g、淡口酱油 1 小匙、酒 1 小匙强、盐 1/5 小匙；出汁 1.2 cup | [MAFF 里芋の炊き込みご飯](https://www.maff.go.jp/j/syokuiku/minna_navi/recipe/season4.html)，正文第 286–374 行 | 总时长与芋头/油炸豆腐安全终点未给，不晋升 executable |
| `maff-irogohan-nara` | 6 人；米 3 杯、胡萝卜/香菇/牛蒡/油炸豆腐各 60g、蒟蒻 100g、鸡肉 200g、酱油 60mL、酒 40mL、出汁昆布 15g、花柴鱼片 25g | [MAFF 色ご飯（奈良）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/irogohan_nara.html)，正文第 267–357 行 | 出汁量前后冲突（900mL vs 步骤 500mL）；鸡肉安全终点与总时长仍为空 |

专项测试：`tools/tests/source-backed-one-pot-batch-r221-maff-fixed.test.mjs`。

# r223 MAFF toridose fixed batch

本批基于 `source-backed-one-pot-v1-20260808-global-r222`，目录总数仍为 923；回填一条原文定量完整的熟饭杂炊边界资产，不新增 canonical，也不晋升 executable。

## maff-chiba-toridose

- 来源：[鶏雑炊（とりどせ）｜日本农林水产省](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/toridose_chiba.html)
- 证据：原页给出 10 人份熟饭 10 碗、鸡肉 500g、牛蒡 300g、水 2L；先煮配料和鸡肉团，最后加入熟饭并煮沸。
- 回填：`fixed_batch.servings=10`；熟饭 10 碗、鸡肉 500g、牛蒡 300g、水或出汁 2L；液体合同记录 2L added water。
- 边界：这是熟饭输入的二次烹/杂炊，不是生米同锅电饭煲配方；香菇、味噌等来源未给定量，未补猜；总时长与鸡肉安全终点仍为空。
- 状态：`recipe_fact_checked`，非 `executable`。

验证：r223 专项测试通过；生成目录门禁、菜谱门禁和 `git diff --check` 在批次收尾时运行。

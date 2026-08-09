# r225 MAFF ikameshi fixed batch

本批基于 `source-backed-one-pot-v1-20260808-global-r224`，目录总数仍为 923；回填一条日本农林水产省原页已经给出批次与关键食材的北海道いかめし记录。不新增 canonical，也不晋升 executable。

## maff-hokkaido-ikameshi

- 来源：[いかめし 北海道｜日本农林水产省](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/ikameshi_hokkaido.html)
- 证据：同一 MAFF 原页给出 4 人份、鱿鱼 4–8 杯、糯米 1 杯；糯米浸泡后混合鱿鱼足，装入鱿鱼体时不得过量，再放入出汁锅中煮约 30 分钟并调味。
- 回填：`fixed_batch.servings=4`；鱿鱼保留来源范围 `4 至8杯`，糯米为 `1杯`，两项均挂同一来源证据。
- 保留缺口：出汁与调味液没有数值，故 `liquid_contract=null`；原页只给阶段煮制约 30 分钟而非整道总时长，故 `time_contract=null`。不把范围压成单值，也不外推普通电饭煲水位或安全终点。
- 状态：`recipe_fact_checked`，`cooker_adaptation.status=not_adapted`，无 `executable` 字段；保留鱿鱼装填上限与锅煮边界。

验证：r225 专项测试通过；目录构建/目录门禁、菜谱门禁、全量测试和 `git diff --check` 在批次收尾时运行。

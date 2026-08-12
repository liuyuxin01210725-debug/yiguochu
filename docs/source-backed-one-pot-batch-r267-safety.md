# r267 安全补证：三条 MAFF 海鲜饭

基线为 `source-backed-one-pot-v1-20260808-global-r265` / 923 条。本批没有新增 canonical，也没有晋升 executable；只为 3 条已经在目录中的 `recipe_fact_checked` 记录补上可由原文流程直接对应的安全终点。

## 直接来源事实

| recipe_id | 官方原文事实 | 安全字段 | 边界 |
| --- | --- | --- | --- |
| `maff-fukushima-hokki-meshi` | [MAFF 福岛ほっきめし](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/30_5_fukushima.html)（浏览器直读）：4 人、米 3 杯、北寄贝 4–8 个；先将贝与水/调味料煮熟，取出贝肉并保留贝汁，米用贝汁炊煮，焖时回锅。 | `shellfish_fully_cooked`，贝肉呈珍珠白或白色且不透明；引用 `S-SAFETY-TEMPERATURES-1`。 | 保留先煮—炊饭—回锅的 staged 流程，不改写为生贝从头与米同煮，不把时长当作安全证明。 |
| `maff-tottori-igai-meshi` | [MAFF 鸟取いがい飯](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/igai_meshi_tottori.html)（浏览器直读）：6 人、米 3 杯、贻贝肉 100g；先煮贝肉取汁，再与米和调味料同锅炊煮。 | `shellfish_fully_cooked`，贝肉呈珍珠白或白色且不透明；引用 `S-SAFETY-TEMPERATURES-1`。 | 不将可选根菜变体硬加进主料；保留来源的先煮贝肉边界。 |
| `maff-ehime-taimeshi` | [MAFF 爱媛鯛めし](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/taimeshi_ehime.html)（浏览器直读）：东予炊込み型 4 人、米 2 杯、鲷鱼 200–300g；鱼整条置于米面炊煮，出锅去骨拌饭。 | `seafood_fully_cooked`，最低核心温度 63°C；引用 `S-SAFETY-SEAFOOD-GENERAL-CDC-1`。 | 只记录东予熟鱼炊饭型；南予生鱼拌饭是独立变体，不外推电饭煲或总时长。 |

## 验证

- TDD：先在 r265 基线运行 `node --test tools/tests/source-backed-one-pot-batch-r267-safety.test.mjs`，版本断言失败；写入后 2/2 通过。
- 目标条目仍为 `recipe_fact_checked`，均保持 `cooker_adaptation.status=not_adapted`、非 executable。
- 本批只补 safety endpoint/source ref；`fixed_batch`、`liquid_contract`、`time_contract` 未跨来源推导。


# r219：三条 MAFF 熟饭/分段地方饭固定批次闭合

基线：`source-backed-one-pot-v1-20260808-global-r218` / 923 条

本批不新增 canonical，也不晋升 executable；只把三个已有 `recipe_fact_checked` 条目的同源数量合同写回目录。三条原方都不是“生米+主料一次入电饭煲”：岛根 `うずめ飯` 是出汁具材覆熟饭，广岛 `うずみ` 是多段预处理后覆熟饭，德岛 `包飯` 是荞麦米预煮、熟饭与杂炊收汁。`cooker_adaptation.status` 均保持 `not_adapted`。

## 写回条目

| recipe_id | 官方来源与定位 | 写回字段 | 保留边界 |
| --- | --- | --- | --- |
| `maff-shimane-uzume-meshi` | [MAFF うずめ飯](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/uzumemeshi_shimane.html)，正文 321–359 行 | 4 人；米 1.5 合、里芋 8 个、牛蒡 100g、胡萝卜 60g、香菇 4 枚、鸡肉 32g、厚揚げ 1 枚、味醂/酱油各 2 小匙；出汁 600cc | 具材另锅煮，熟饭覆在上方；600cc 是具材出汁，不改写成米水合同 |
| `maff-hiroshima-uzume` | [MAFF うずみ](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/42_2_hiroshima.html)，正文 309–392 行 | 4 人；鲷 4 切（每切 30g）、虾 8 尾、芋头 2 个、胡萝卜半根、干香菇 1 枚、厚揚げ 200g、熟饭 4 膳及各段调味/出汁用量 | 鲷烤制、虾焯煮、根菜/香菇分段处理，最后覆饭淋汁；多液体不压成单一 `liquid_contract` |
| `maff-tokushima-houhan` | [MAFF 包飯](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/44_25_tokushima.html)，正文 308–368 行 | 4 人；荞麦米 150g、熟饭 150g、鸡腿肉 100g、胡萝卜 80g、牛蒡 100g、魔芋 100g、竹轮 60g、葱 20g、盐 5g、浓口酱油 54g；煮干出汁 800g | 荞麦米先煮并沥出，蔬菜/鸡肉入出汁煮，最后加入荞麦米和熟饭收汁；不转换为生米焖饭 |

## 验证

- r219 TDD 专项：`tools/tests/source-backed-one-pot-batch-r219-maff-fixed.test.mjs`，2/2 通过。
- `node tools/build-source-backed-one-pot-catalog.mjs --write --check`、`node tools/check-source-backed-one-pot-catalog.mjs --check`、`node tools/check-recipes.mjs`、`git diff --check` 均通过。
- 目录仍为 923 条；本批固定批次 +3，货架由 A36/B302/C585 变为 A36/B305/C582，轮替池由 312 变为 315。

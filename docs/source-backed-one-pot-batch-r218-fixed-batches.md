# r218：三条同源固定批次闭合

基线：`source-backed-one-pot-v1-20260808-global-r217`，923 条。

本批不新增 canonical 菜谱，不晋升 executable；只把三条已有来源资产的固定份数与原文定量写回主目录。所有数值均来自同一官方原页，不跨菜名、跨机型或跨版本拼接。

| recipe_id | 直接来源 | 本批闭合 | 保留缺口/边界 |
| --- | --- | --- | --- |
| `maff-hiroshima-anagomeshi` | [MAFF：あなご飯（广岛）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/42_30_hiroshima.html)，正文 303–343 行 | 4 人份；米 480g、昆布 10cm 角、穴子 4 尾、甘醋姜 40g 与调味料；补齐米饭炊煮→穴子烧制→切片铺饭流程 | 原文是分段铺饭，未给可归一的液体对象、总时长或温度终点；保持 `not_adapted`，不当作生鱼同锅电饭煲方 |
| `maff-kagoshima-keihan` | [MAFF：鶏飯（鹿儿岛）](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/keihan_kagoshima.html)，正文 321–404 行 | 4 人份；米、米饭用水、鸡骨、鸡汤用水、鸡胸肉、香菇、鸡蛋、四季豆、葱、木瓜味噌渍及有明确量的调味料 | 白饭、鸡汤、配料分段准备；存在多个液体对象，`liquid_contract` 保持 `null`，不改写为一锅焖饭 |
| `philips-soy-milk-chicken-congee` | [Philips Taiwan：豆漿雞肉粥](https://www.philips.com.tw/c-e/ho/recipe-overview-page/main-courses/soy-milk-chicken-rice.html)，正文 354–377 行 | 1 人份；鸡里肌 2 条、豆浆 1 杯、米 1 杯、水 5 杯；保留 35 分钟煮粥合同 | 豆浆和水是两个液体对象，不能压成单一 `liquid_contract`；鸡肉仍按“条”计，未补独立温度终点或普通电饭煲适配 |

## 证据纪律

- 三条均保持 `recipe_fact_checked`；r218 没有新增 `executable`。
- `fixed_batch.ingredients[*].source_ids` 全部只指向对应原页 source ID。
- 不把 MAFF 的熟饭/烧制/汤泡饭流程包装成严格生米一锅出；不把 Philips 的多功能烹煮锅参数外推为普通电饭煲。
- 少々/适量等非数值材料没有被伪造为克数；液体对象无法单值化的条目继续保留 `null`。


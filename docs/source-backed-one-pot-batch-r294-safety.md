# r294 source-backed safety batch

基线为 r293/923；本批没有新增 canonical 菜谱，只闭合 4 条来源已经明确写出猪肉先煎/先煮/先炒熟的安全终点。

| recipe_id | 原始流程边界 | 回填终点 |
| --- | --- | --- |
| `cookpot-taro-chestnut-pork-rice` | 锅宝 IH 99°C 定温煎梅花肉后再进入标准米饭程序 | `pork_fully_cooked`, 74°C |
| `maff-okinawa-yafara-jushi` | 猪三层肉整块煮熟、切条后加入高汤杂炊 | `pork_fully_cooked`, 74°C |
| `maff-chiba-gonjuu` | 猪五花与调味料先煮熟收味，再拌入已煮好的米饭 | `pork_fully_cooked`, 74°C |
| `tiger-chinese-sticky-rice-post-fry` | 猪肉及配料先在平底锅炒熟，再进入 Tiger おこわ 程序 | `pork_fully_cooked`, 74°C |

终点均引用 FoodSafety.gov 的 `S-SAFETY-TEMPERATURES-1`。本批不改变原器具、预处理、熟饭二次烹或分段投料边界，也不把这些条目晋升为普通电饭煲 executable；份数、液体、时间和机型缺口仍按各自原始来源保留。

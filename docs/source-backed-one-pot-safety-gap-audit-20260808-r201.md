# r201 公共机构禽肉安全缺口审计

基线：`source-backed-one-pot-v1-20260808-global-r200` / 923 条。只复核已有
`recipe_fact_checked` 条目，不新增 canonical、不晋升 executable、不改原方的器具和分阶段边界。

## 可无损闭合的五条

| recipe_id | 直接来源事实 | 回填 | 边界 |
| --- | --- | --- | --- |
| `instant-pot-chicken-satay-rice` | [Instant Pot Chicken Satay Rice](https://instantpot.com/blogs/recipes/chicken-satay-rice)：鸡胸切条后在 Sauté 中煎熟取出，米和汤料按压力锅流程完成后回锅。 | `poultry_fully_cooked` / 74°C | 保留 Instant Pot 的 Sauté、压力与回锅；不把“煎至熟透”当作数值终点。 |
| `osu-cheesy-chicken-rice-vegetable-skillet` | [Ohio State University Cheesy Chicken, Rice, & Vegetable Skillet](https://u.osu.edu/simplesuppers/recipes/cheesy-chicken-rice-vegetable-skillet/)：鸡肉先在煎锅烹调约10分钟，再加入糙米、蔬菜和水焖熟。 | `poultry_fully_cooked` / 74°C | 保留普通煎锅和先鸡后米流程，不外推电饭煲。 |
| `cu-caribbean-jerk-chicken-rice` | [University of Colorado System cookbook](https://www.cu.edu/doc/ssc-cookbookpdf) 第25页：鸡腿先煎后取出，米饭煮制时回锅并转烤箱完成。 | `poultry_fully_cooked` / 74°C | 保留 skillet/铸铁锅/荷兰锅及烤箱、取出/回锅边界。 |
| `cdph-calfresh-chicken-rice` | [California Department of Public Health Chicken and Rice](https://calfreshhealthyliving.cdph.ca.gov/en/recipes/Pages/Chicken-and-Rice.aspx)：鸡胸先炒熟取出，米和蔬菜煮好后摆回。 | `poultry_fully_cooked` / 74°C | 保留普通煎锅的分阶段流程，不把熟鸡回摆改写成同锅投料。 |
| `wisconsin-polk-arroz-con-pollo` | [University of Wisconsin–Madison Polk County Extension PDF](https://polk.extension.wisc.edu/files/2012/10/Compiled-Book-Draft-2.pdf) 第92页：切块整鸡先煎，再加汤焖，随后加米继续煮。 | `poultry_fully_cooked` / 74°C | 保留大煎锅、先鸡后米和豌豆末段投料；不外推电饭煲。 |

五条均复用 `S-SAFETY-TEMPERATURES-1`（FoodSafety.gov，tier 1，`claim_scopes: ["safety"]`）。该公共来源只负责禽肉 74°C 终点，原菜谱来源继续负责食材、步骤、液体、时间和器具事实。

## 明确不扩大范围

本批不处理 r160/r195 已记录的来源映射冲突、混合海鲜物种/状态不明、于田羊肉形态不明或 Tiger Szechuan Pork 页面正文冲突项；这些条目继续保留原安全缺口。

## 验证

先以专项 TDD 锁定五条 endpoint 和原器具边界，再运行目录构建、目录/菜谱门禁、source-backed 测试及全量串行测试。

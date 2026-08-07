# 全球公共机构一锅米饭来源搜集 Intake（r129-public）

**研究日期**：2026-08-08
**去重基线**：主目录 `source-backed-one-pot-v1-20260808-global-r128`（895 条）；并对照已提交的 r119–r128 intake。
**本批性质**：只写研究 intake，不修改主 JSON、CSV、运行时代码或 UI；不晋升 `executable`，不部署。
**来源范围**：美国大学 Extension、州/联邦公共机构、退伍军人事务部营养服务及大学官方食育页面。所有器具、熟态和阶段边界按原文记录，不把普通锅、平底锅或熟饭二次烹改写成电饭煲一锅。

## 判定口径

- `direct_one_pot`：来源明确在同一锅/同一炊具中完成生米（或米类）与主要配料；普通锅、平底锅、慢炖锅、电压力锅分别记录，不能互相推导。
- `staged_or_extra_pan`：同一锅内有取出/回锅、或需要另锅/先后器具；可作为一锅饭家族研究材料，但不称为全投料直达。
- `cooked_rice_second_cook`：以熟饭为起点再炒/拌/回锅；不进入当前生米轮替，单独留给未来“熟饭二次烹”。
- `archive_or_blocked`：原页无法直接打开、只有索引/摘要或关键字段不能复核；搜索摘要不作为入库事实。

所有份数、数量、液体、时间、步骤和器具均按来源原文记录；`null` 代表来源未证明，禁止跨来源补猜。营养结构只作碳水/蛋白/蔬菜或纤维事实提示，不把配菜包装成完整主餐。

## 新候选清单

| # | 建议 ID / 具名菜 | 地区 / 机构 | 直达来源与定位 | 来源实际证明 | 器具与边界 | 缺口 / 建议状态 |
|---:|---|---|---|---|---|---|
| 1 | `sdsu-easy-red-beans-rice` / Easy One-Pot Red Beans & Rice | 美国；South Dakota State University Extension | [SDSU One Pot Meals 原页](https://extension.sdstate.edu/one-pot-meals)，HTML 行 80–154 | 4 份；安杜伊香肠 ½ lb、洋葱、西芹、蒜、番茄罐头（含汁）、芸豆、调味料、未煮糙米 1 杯、青椒；同锅先煎香肠/葱蒜芹菜 4–6 分钟，再加入番茄、芸豆、2 杯水、调味料和米；盖锅煮约 45 分钟，离火加青椒并焖 10 分钟。每 2 杯 515 kcal、蛋白 21g、膳食纤维 13g。 | `direct_one_pot`；同一有盖煎锅分阶段完成，末步离火加入青椒；不是电饭煲。 | 来源没有香肠安全终点温度；“约 45 分钟”与离火 10 分钟应保留为来源时间范围。与现有 `qld-one-pot-beans-rice`/`zojirushi-new-orleans-red-beans-rice` 同家族，正式入库前做 canonical 合并。`recipe_fact_checked` 候选。 |
| 2 | `umich-one-pot-beans-rice` / One Pot Beans and Rice | 美国；University of Michigan Nutrition/Food Lab | [Michigan 原页](https://hr.umich.edu/node/158768)，HTML 行 10–65 | 6 份（每份 1 杯）；橄榄油、洋葱、墨西哥辣椒、蒜、孜然、长粒米 1 杯、低钠蔬菜汤 2 杯、盐、黑豆 15.5oz、香菜和青柠；同一带盖大锅依次炒香、加入汤/盐/豆/米，小火焖 15–20 分钟后静置。每份 232.6 kcal、蛋白 6.8g、纤维 6.7g。 | `direct_one_pot`；普通有盖 saucepan；页面定位为 side dish，非完整主餐承诺。 | 豆类提供蛋白但没有动物蛋白/大量蔬菜；正式入库需与 QLD 豆饭做来源版本合并，避免同名重复。`recipe_fact_checked` 候选/配菜警告。 |
| 3 | `illinois-texas-hash` / Texas Hash | 美国；University of Illinois Extension | [Illinois Extension 原页](https://eat-move-save.extension.illinois.edu/eat/recipes/texas-hash)，HTML 行 44–93 | 5 份；瘦牛肉或火鸡肉 16oz、番茄洋葱青椒罐头 14.5oz、水 2 杯、未煮米 1 杯、辣椒粉 1 大匙、胡椒；大煎锅先把肉炒至内部 160°F 并沥油，再加番茄、水、米和调味料，盖锅小火约 20 分钟至米软。每份 330 kcal、蛋白 21g、纤维 3g。 | `direct_one_pot`；普通大煎锅，生肉与生米同锅分阶段；明确有 160°F 肉类安全终点。 | 页面允许牛肉/火鸡二选一，正式结构化时需保留 protein variant，不把两者并成一种食材；另有“Texas Hash with Brown Rice”变体页面，先做 canonical/版本审查。`recipe_fact_checked` 候选。 |
| 4 | `va-pork-rice-skillet` / Pork and Rice Skillet | 美国；U.S. Department of Veterans Affairs Nutrition and Food Services | [VA PDF 原页](https://www.nutrition.va.gov/docs/Recipes/MainDishes/Pork-And-Rice-Skillet.pdf)，PDF 第 1 页（行 0–37） | 4 份；猪排肉 1 lb、洋葱、蒜、糙米 1 杯、意式香草、冷冻豌豆胡萝卜 16oz、低钠鸡汤 2 杯、无脂酸奶 ½ 杯、切达 ½ 杯；同一 skillet 先炒猪肉/葱蒜 5–7 分钟，再加入米、蔬菜、鸡汤煮沸，盖锅小火 30–45 分钟至米软、猪肉熟，最后拌入酸奶和奶酪。总时长 1 小时 15 分、营养 580 kcal/份、蛋白 49g、纤维 6g。 | `direct_one_pot`；同一带盖 skillet，无取出/回锅；普通锅，不外推电饭煲。 | PDF 未给猪肉具体温度，只写“fully cooked”；正式晋升前需本地 PDF 归档和安全合同定位。奶制品在关火后的拌入顺序须保留。`recipe_fact_checked` 候选。 |
| 5 | `tamu-skillet-chops-rice` / Skillet Chops and Rice | 美国；Texas A&M AgriLife Extension Dinner Tonight | [TAMU 原页](https://dinnertonight.tamu.edu/recipe/skillet-chops-rice/)，HTML 行 27–32、52–63、93–117 | 4 份；4 块 4oz、½ 英寸厚猪排；页面原文米量呈现为“1 1/12 cups”（疑似排版/单位错误，必须原样保留）；水 ⅔ 杯、洋葱 ½ 杯、胡椒、意式炖番茄 14.5oz、无盐番茄酱 8oz；猪排每面煎 2 分钟后**取出**，同一锅加入米/水/洋葱/番茄酱料煮沸，再把猪排放回米上，盖锅 5–10 分钟至液体吸收且猪肉达 160°F。页面给 prep 10 分钟、cook 15 分钟及 360 kcal/份、蛋白 32g。 | `staged_or_extra_pan`；同一 skillet 但明确取出/回锅；普通锅，不是全投料直达。 | 米量字段有原文排版歧义，不能自行改成 1½ 杯；猪肉 160°F 终点明确。正式入库需人工确认计量显示和 PDF/页面归档。`recipe_fact_checked` 候选但带“量待核”警告。 |
| 6 | `rice-university-middle-eastern-rice` / Middle Eastern Rice | 美国；Rice University “Wiess Cooks!” | [Rice University 原页](https://wiesscooks.rice.edu/vegetables/middle-eastern-orzo-and-rice/)，HTML 行 7–16 | 4 份（每份 ½ 杯，合计约 2 杯熟饭）；生米 ½ 杯、orzo/碎面 ½ 杯、黄油 2 大匙、鸡汤或蔬菜汤 2 杯；同一不粘锅把米和 orzo 在黄油中炒香，加汤煮沸，盖锅小火 20 分钟，离火焖 5 分钟。 | `direct_one_pot`；普通 skillet；来源是米饭配方/配菜，既没有肉也没有蔬菜，不能包装成完整主餐。 | 学校页面未给完整营养表和蛋白质结构；仅作为米饭技法/液体合同候选，需和现有相近“米饭基底”条目去重。`recipe_fact_checked`/配菜警告。 |
| 7 | `tennessee-chicken-rice-skillet` / Chicken and Rice Skillet | 美国；University of Tennessee Extension Healthy Families | [UT Extension 原页](https://www.healthyfamilies.tennessee.edu/recipes/chicken-rice-skillet/)，HTML 行 82–110、145–149 | 6 份（每份 ¾ 杯）；植物油 2 大匙、西芹 ¾ 杯、鸡胸肉 1 lb、**熟糙米 2 杯**、番茄青辣椒罐头 10oz、橄榄 ¼ 杯、低脂马苏里拉 1 杯；同一 skillet 炒芹菜和鸡肉约 15 分钟至熟，加入熟米和番茄加热，再加入橄榄和奶酪。页面另有禽肉卫生提示。 | `cooked_rice_second_cook`；平底锅，明确以熟糙米为输入，不是生米电饭煲菜饭。 | 页面未给禽肉中心温度；“鸡肉已熟”必须保留为原文边界，不能自行补温度。适合未来“剩饭二次烹”目录，不进入当前生米轮替。 |
| 8 | `ndsu-ranchero-beef-rice-skillet` / Ranchero Beef and Rice Skillet | 美国；North Dakota State University Extension | [NDSU PDF 原页](https://www.ndsu.edu/agriculture/sites/default/files/2022-09/fn711.pdf)，PDF 第 2 页（行 148–174） | 4 份；瘦牛绞肉 1 lb、甜椒、蒜、辣椒粉、盐、**熟米 3 杯**、冷冻豌豆 1 杯、莎莎酱 ¾ 杯；同一 skillet 将牛肉/椒/蒜炒 8–10 分钟至无粉红，再加入熟米加热 2 分钟，拌入豌豆和莎莎加热。每份 350 kcal、蛋白 28g、纤维 3g；PDF 还附 Creative Commons 说明。 | `cooked_rice_second_cook`；平底锅，熟饭起步；不能改写成生米同锅。 | 熟米状态和 20 分钟总流程明确，但没有生米液体合同；正式入库应归入未来熟饭品类。 |

## 去重、排除与边界记录

1. **豆饭家族去重**：SDSU、Michigan 两条均为 beans and rice 家族；当前目录已有 `qld-one-pot-beans-rice` 与 `zojirushi-new-orleans-red-beans-rice`。本 intake 保留两条官方来源版本，正式入库前需按地区、蛋白来源和锅具事实做 canonical 合并，不应机械增加同名条目。
2. **Texas Hash 变体**：Illinois 原页为生米、牛/火鸡肉的一锅煎锅版本；同站另有 brown-rice 变体线索。本批只登记当前直接打开版本，不能拼接两页的米量或流程。
3. **熟饭二次烹明确隔离**：UT Chicken and Rice Skillet、NDSU Ranchero Beef and Rice Skillet 都以熟米为前提，分别保留 cooked-rice 边界，不进入当前生米轮替。它们不是生米菜饭的替代做法。
4. **阶段流程不伪装直投**：TAMU Skillet Chops and Rice 有“猪排取出—米饭烹煮—猪排回锅”，因此标 `staged_or_extra_pan`；不能因为只用了一个 skillet 就写成全投料一锅。
5. **普通锅参数不转换**：SDSU/Michigan/Illinois/VA/Rice/UT/NDSU 的水量、时间和锅具不外推到电饭煲。只有来源明确写电饭煲/压力锅，才可在对应器具分区呈现；本批没有新增普通电饭煲直达主餐。
6. **配菜与主餐分层**：Michigan One Pot Beans and Rice、Rice University Middle Eastern Rice 以及同类米饭基底虽然有明确做法，但来源本身偏配菜或米饭底，不能因含米就宣称完整主餐；营养结构和页面文案必须保守。
7. **资料层不等于厨房批准**：本批所有条目均未晋升 `executable` 或 `kitchen_observed`。安全温度、份量、PDF 归档、来源许可和真实厨房结果仍按既有签署管线处理。

## 本批结论

- 共登记 **8 条独立候选记录**：`direct_one_pot` 5 条（SDSU、Michigan、Illinois、VA、Rice）、`staged_or_extra_pan` 1 条（TAMU）、`cooked_rice_second_cook` 2 条（UT、NDSU）。
- 最值得进入下一轮事实矩阵的是：SDSU Easy One-Pot Red Beans & Rice（米+豆/肉+蔬菜、液体和时间完整）、Illinois Texas Hash（生肉 160°F 终点且 20 分钟）、VA Pork and Rice Skillet（4 份、米/蔬菜/猪肉结构完整）和 TAMU Skillet Chops and Rice（虽然有取出回锅，但猪肉安全终点明确）。
- Michigan beans and rice、Rice Middle Eastern Rice 的结构更偏配菜，建议保留为技法/米饭基底研究，不优先进入主餐轮替。
- UT/NDSU 两条熟饭二次烹候选字段完整，暂不并入生米菜饭，未来单独开启“熟饭二次烹”品类时再处理。
- 本批未修改主 JSON、CSV、运行时代码或 UI，未部署；仅新增本 intake 文档。下一步应由人工做 canonical 合并、来源归档及安全合同审查，再决定是否进入 r130 事实矩阵。

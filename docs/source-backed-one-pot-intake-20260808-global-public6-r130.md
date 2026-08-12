# 全球公共机构一锅米饭来源搜集 Intake（r130-global-public）

**研究日期**：2026-08-08
**去重基线**：主目录 `source-backed-one-pot-v1-20260808-global-r128`（895 条）；逐项对照 r119–r129 intake。
**本批性质**：只写研究 intake，不修改主 JSON、CSV、运行时代码或 UI；不晋升 `executable`，不部署。
**来源范围**：美国联邦公共卫生/营养机构、大学 Extension/医学中心、大学官方食育资料及州政府关联机构。所有器具、熟态和阶段边界均按原文记录，不将普通锅、熟饭或电饭煲参数互相外推。

## 判定口径

- `direct_one_pot`：原文在同一锅/同一炊具中完成生米和主要配料；普通锅、平底锅、电饭煲分别记录。
- `staged_or_extra_pan`：同锅但有取出/回锅，或需要分阶段处理；不能伪装成全投料直达。
- `cooked_rice_second_cook`：从熟饭开始二次加热/翻炒，单独留给未来熟饭品类，不进入当前生米轮替。
- `archive_or_blocked`：原文可访问但字段错位、关键数字无法可靠复核，或只有索引/摘要；只记研究线索，不把不确定数字写入主目录。

所有份数、数量、液体、时间、步骤和器具均按来源原文记录；`null` 代表来源未证明，禁止跨来源补猜。营养结构只作碳水/蛋白/蔬菜或纤维事实提示，不把配菜包装成完整主餐。

## 新候选清单

| # | 建议 ID / 具名菜 | 地区 / 机构 | 直达来源与定位 | 来源实际证明 | 器具与边界 | 缺口 / 建议状态 |
|---:|---|---|---|---|---|---|
| 1 | `asmi-pink-salmon-rice-bowls` / Pink Salmon Rice Bowls (One-Pot Rice Cooker Meal) | 美国阿拉斯加；Alaska Seafood Marketing Institute（州渔猎部门页面亦推荐） | [ASMI 原页](https://www.alaskaseafood.org/recipe/pink-salmon-rice-bowls-one-pot-rice-cooker-meal/)，HTML 行 76–129 | 2 份；米 1 杯、水 1¼ 杯、蚝油 2 大匙、泰式甜辣酱 2 大匙、麻油 2 茶匙、蒜、葱头、6oz 粉红鲑鱼、南瓜 ⅓ 杯、羽衣甘蓝 ¼ 杯、蟹味菇/小蘑菇 ¼ 杯，可选鸡蛋 2 个；准备 10 分钟、烹调 30 分钟、总时长 40 分钟。米与调味液先入电饭煲，鱼和蔬菜分层，按 steam/white rice 程序；结束后可加蛋再蒸 7–10 分钟。 | `direct_one_pot`；明确 rice cooker，且有中途开盖加蛋的阶段；不是普通锅参数。具备米+鱼+蔬菜/菌菇的完整结构。 | 鱼类安全终点未在页面给出；电饭煲程序只证明“steam/white rice”按钮，不推导其他机型时长。海鲜/蚝油过敏需单独标签。`recipe_fact_checked` 候选，优先进入电饭煲候选池。 |
| 2 | `nih-medlineplus-chicken-rice` / Chicken and Rice | 美国；MedlinePlus / National Heart, Lung, and Blood Institute（HHS/NLM） | [MedlinePlus 原页](https://medlineplus.gov/recipes/chicken-and-rice/)，HTML 行 38–77、81–105 | 6 份；鸡块 6 块、油 2 茶匙、水 4 杯、番茄/青红椒/芹菜/胡萝卜/玉米/洋葱/香菜/蒜、米 2 杯、豌豆、橄榄、葡萄干；prep 15 分钟、cook 1小时15分、total 1小时30分。先在大锅煎鸡，加入水和蔬菜煮 20–30 分钟；**取出鸡肉**后入米/豌豆/橄榄煮约 20 分钟，再放回鸡肉和葡萄干煮 8 分钟。营养 448 kcal/份。 | `staged_or_extra_pan`；同一大锅但明确取出/回锅，不能称直投；原文为单锅主餐。 | 原文没有禽肉中心温度，只有“鸡肉煮熟”；需补安全合同/档案后再晋升。水量、时间和分阶段步骤完整，适合作为真实主餐研究。`recipe_fact_checked` 候选。 |
| 3 | `urochester-smoky-hoppin-john` / Smoky Hoppin’ John | 美国；University of Rochester Medical Center — Cooking for Wellness | [URMC 原页](https://www.urmc.rochester.edu/news/publications/cooking-for-wellness/smoky-hoppin-john)，HTML 行 23–72 | 4 份；橄榄油 1 大匙、洋葱 1½ 杯、青椒、西芹、蒜、即食糙米 ½ 杯、蔬菜高汤 1 杯、番茄罐头 14oz、调味料、熟黑眼豆 2 杯；同一不粘锅炒蔬菜 5 分钟，加入蒜和米，加入汤/番茄和调味煮沸，盖锅小火 12 分钟，再加熟豆关火焖 5 分钟。原文明确称 plant-based one-pot entrée，并说明 Hoppin’ John 的文化背景。 | `direct_one_pot`；普通不粘 skillet，同锅完成生米与熟豆分阶段；豆类为已煮熟态，不把干豆安全时间推入本配方。 | 使用即食糙米，比例不能套到普通生糙米；未给营养表和食品安全温度。来源还列出 myrecipes.com，需明确 URMC 页面作为事实记录来源，不拼接外部版本。`recipe_fact_checked` 候选。 |
| 4 | `psu-leftover-rice-bean-greens-skillet` / Skillet Meals（Leftover Rice, Beans & Greens） | 美国；Penn State Extension | [Penn State 原页](https://extension.psu.edu/creative-ways-to-use-leftover-fruits-and-vegetables)，HTML 行 1108–1167 | 4 份（每份约 1½ 杯）；炖番茄 2×15oz、冷冻菠菜 10oz（可用芥蓝/羽衣甘蓝，另列西兰花替换）、**熟糙米** 1 杯、白豆 15oz、调味料；中号 saucepan/电煎锅加热番茄，加入蔬菜至软，再加入熟饭、豆和调味，最终加热到 165°F。页面称 hearty one-pot dish，营养每份 260 kcal、蛋白 13g、纤维 12g。 | `cooked_rice_second_cook`；熟饭回锅，锅具为普通 saucepan 或 electric skillet；不进入生米电饭煲轮替。 | 这是“剩饭/熟豆/剩菜”清库存候选，核心是熟饭安全 165°F；来源允许多种叶菜替换，正式结构化需保持 substitution 边界。`recipe_fact_checked` 候选，未来熟饭品类。 |
| 5 | `usu-salsa-verde-chicken-rice` / Salsa Verde Chicken | 美国；Utah State University Campus Recreation / dietetics cookbook | [USU Cooking on a Budget PDF](https://www.usu.edu/campusrec/files/Cooking-on-a-Budget-Cookbook.pdf)，PDF 第 29 页（行 793–822） | 4 份、总时长 30 分钟；油 2 大匙、洋葱、蒜、去骨鸡腿 1½ lb、花椰菜约 2 杯、孜然、长粒白米 1 杯、salsa verde 1 杯、鸡汤 1½ 杯、盐胡椒、香菜；锅中先炒洋葱蒜 3–5 分钟，加入鸡肉煎 5–7 分钟，再入孜然/米/花椰菜，加入鸡汤和 salsa，沸腾后盖锅中低火 20 分钟。 | `direct_one_pot`；普通高边重锅/有盖锅，同锅生鸡、生米、蔬菜分阶段完成；不是电饭煲。页面称 one-pan chicken dinner，并明确“蛋白、碳水、蔬菜和脂肪”结构。 | PDF 是大学学生营养项目编写、由注册营养师监督；来源页同时列出外部参考链接，身份/许可仍需审查。原文未给禽肉中心温度，不能自行补。`recipe_fact_checked` 候选。 |
| 6 | `usu-one-pot-spinach-rice-blocked` / One-Pot Spinach Rice | 美国；Utah State University Campus Recreation | [USU Cooking on a Budget PDF](https://www.usu.edu/campusrec/files/Cooking-on-a-Budget-Cookbook.pdf)，PDF 第 30 页（行 823–851） | 页面标题和步骤声称为一锅菠菜米饭：炒蒜葱，加入番茄、菠菜、豆、米和水/高汤，盖锅小火 18–20 分钟，3 份、约 30 分钟，且文字称含 greens、beans、carbohydrates；但 PDF 抽取的“Ingredients”区重复了上一页 Salsa Verde Chicken 的鸡肉/花椰菜/酱料字段，和本页步骤不一致。 | 暂标 `archive_or_blocked`；不能据错位抽取补出真实食材、液体或比例。 | 需人工截图/原始 PDF 视觉核对或作者版来源后再决定是否保留；不进入主 JSON，不作为事实候选。该条保留是为了记录“找到但证据未闭合”，不是凑数。 |

## 去重、排除与边界记录

1. **Pink Salmon Rice Bowls 是本批唯一明确普通电饭煲主餐强候选**：来源给出米、水、鱼、南瓜、叶菜、菌菇、时间和按钮；仍需鱼类安全终点与机型边界审查，不能把“white rice/steam”泛化为所有电饭煲。
2. **MedlinePlus Chicken and Rice 不称直投**：来源虽然称 single pot，但鸡肉明确先取出再回锅，故标 `staged_or_extra_pan`；不得把步骤压缩成“全部放入后按煮饭”。
3. **熟饭二次烹隔离**：Penn State Skillet Meals 明确以 cooked brown rice 起步；它是未来“剩饭清库存”品类，不是生米菜饭候选。
4. **即食米/熟豆边界**：URMC Hoppin’ John 使用 instant brown rice 和 cooked black-eyed peas；即食米液体/时间不能移植给普通生米，熟豆也不能被误写成干豆同锅。
5. **USU Salsa Verde Chicken 的器具与来源层级**：它是大学官方 PDF 的普通锅版本，不能转换为电饭煲；因页面同时列出外部参考，正式入库前应保留“大学编写/外部参考”双层来源说明。
6. **阻塞条目不升格**：USU One-Pot Spinach Rice 的 PDF 文本抽取发生字段错位，本批不使用搜索摘要或邻页内容补齐；待视觉复核前保持 `archive_or_blocked`。
7. 本批没有把熟饭、普通锅和电饭煲的水量/时间互相推导，也没有修改主 JSON、CSV、运行时代码或 UI，未部署。

## 本批结论

- 共登记 **6 条研究记录**：`direct_one_pot` 3 条（ASMI、URMC、USU Salsa Verde Chicken）、`staged_or_extra_pan` 1 条（MedlinePlus）、`cooked_rice_second_cook` 1 条（Penn State）、`archive_or_blocked` 1 条（USU Spinach Rice）。
- 最值得进入下一轮事实矩阵的是 ASMI Pink Salmon Rice Bowls（电饭煲、海鲜+蔬菜）、MedlinePlus Chicken and Rice（官方主餐、阶段流程完整）、URMC Smoky Hoppin’ John（豆类+即食米）和 USU Salsa Verde Chicken（鸡肉+米+花椰菜、30 分钟）。
- 本批仅新增本 intake 文档；下一步再进行 canonical 合并、来源归档、安全合同和许可审查，不自动入库或晋升。

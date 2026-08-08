# 全球公共机构一锅米饭来源搜集 Intake（r132-global-public7）

**研究日期**：2026-08-08
**去重基线**：主目录 `source-backed-one-pot-v1-20260808-global-r131`（902 条）；逐项对照 r119–r131 intake、主目录名称/别名与来源 URL。
**本批性质**：只写研究 intake，不修改主 JSON、CSV、运行时代码或 UI；不晋升 `executable`，不部署。
**来源范围**：美国大学 Extension、大学医学/营养教育、公共机构和官方食育页面。普通锅、平底锅、慢炖锅、电压力锅、电饭煲及熟饭二次烹分别记录，不把器具或生熟状态互相外推。

## 判定口径

- `direct_one_pot`：原文在同一锅/同一炊具中完成生米与主要配料；普通锅、平底锅、压力锅分别记录，不能改写成电饭煲。
- `staged_or_extra_pan`：同锅但有取出/回锅、先煎后焖，或使用两个锅；它仍可作为一锅主餐研究，但不伪装成全投料直达。
- `cooked_rice_second_cook`：从熟饭/即食米开始二次加热或翻炒，单独留给未来“剩饭”品类，不进入当前生米轮替。
- `archive_or_blocked`：官方索引或 PDF 存在候选，但关键页面被 403/超大 PDF/图片或正文缺字段阻塞；只记线索，不把索引摘录数字当作已核实事实。

所有份数、数量、液体、时间、步骤和器具均按来源原文记录；`null` 代表来源未证明，禁止跨来源补猜。相同菜名的不同国家/机构版本不合并，正式入库前须做 canonical 评审。

## 新候选清单

| # | 建议 ID / 具名菜 | 地区 / 机构 | 直达来源与定位 | 来源实际证明 | 器具与边界 | 缺口 / 建议状态 |
|---:|---|---|---|---|---|---|
| 1 | `unl-chicken-rice` / Chicken & Rice | 美国；University of Nebraska–Lincoln Food | [UNL 原页](https://food.unl.edu/recipe/chicken-rice/)（HTML recipe 区） | 8 份；油 2 大匙、洋葱 1 杯、Roma 番茄 2 个、鸡胸肉 1 磅、葛缕子 ½ 大匙、盐、可选高汤块、水 2½ 杯、浸泡 1 小时并沥干的 Basmati 米 1 杯、熟斑豆 ⅔ 杯、Russet 土豆 1 个。大锅先炒洋葱/番茄/鸡肉/香料，再加水、米、熟豆和土豆；煮沸后中低火盖锅约 45 分钟。另有压力锅 8–10 分钟提示。 | `direct_one_pot`（普通大锅）；同锅完成生鸡、生米和蔬菜/豆类，压力锅提示作为独立器具事实。不是电饭煲。 | 来源未给禽肉中心温度，也未明确总准备时间；浸米和熟豆状态不可改成普通生米/干豆。建议 `recipe_fact_checked` 候选，器具分层保留。 |
| 2 | `osu-cheesy-chicken-rice-vegetable-skillet` / Cheesy Chicken, Rice, & Vegetable Skillet | 美国；Ohio State University Simple Suppers | [OSU 原页](https://u.osu.edu/simplesuppers/recipes/cheesy-chicken-rice-vegetable-skillet/)（Ingredients/Directions） | 鸡肉约 10 oz（页面另以 1 杯说明）、西兰花 ⅔ 杯、胡萝卜 ⅔ 杯、洋葱 ⅔ 杯、未煮糙米 ⅔ 杯、低脂切达 ⅔ 杯、油 2 大匙、水 1⅓ 杯、鸡汤块 1–2 块及调味。鸡肉先在平底锅约 10 分钟，再加米略炒，加入蔬菜、液体，沸腾后盖锅小火 15–18 分钟，最后加芝士融化。 | `direct_one_pot`；同一 skillet 依次投料完成生米、鸡肉和蔬菜；无电饭煲参数。 | 未给固定份数、总时长和禽肉中心温度；鸡肉“约 10 oz/1 杯”需保留原文两个表述，不自行换算。`recipe_fact_checked` 候选。 |
| 3 | `illinois-extension-arroz-con-pollo` / Arroz con Pollo (Chicken with Rice) | 美国；University of Illinois Extension | [Illinois Extension 原页](https://extension.illinois.edu/diabetes/recipes/arroz-con-pollo-chicken-rice)（recipe 区） | 9 个一杯份；鸡胸 4 半约 1.2 磅、盐、冷冻青椒 1 杯、蒜、长粒白米 1 杯、鸡汤 14.5 oz、白葡萄酒 ½ 杯、炖番茄 14.5 oz、洋葱 1 杯。鸡肉先煎后取出；同锅炒椒/洋葱/蒜，炒米，加入液体和番茄盖锅约 20 分钟，再把鸡肉放回 5 分钟。 | `staged_or_extra_pan`；同一锅但明确取出/回锅，不压缩为全投料。普通锅，不是电饭煲。 | 禽肉安全只由步骤语句表达，未给中心温度；与目录中其他 Arroz con Pollo 同名，正式入库需保留该机构版本而非合并。`recipe_fact_checked` 候选。 |
| 4 | `baylor-chicken-rice-skillet` / Chicken and Rice Skillet | 美国；Baylor College of Medicine | [Baylor 原页](https://blogs.bcm.edu/2013/03/29/chicken-and-rice-skillet-recipe/)（recipe 区） | 鸡胸 1 磅、菜籽油 1 大匙、洋葱 ½ 杯、西兰花 2 杯、低钠鸡汤 1¼ 杯、即食米 1½ 杯、切达 1 杯。锅中鸡肉与洋葱略煎约 2 分钟，加入西兰花和高汤煮沸，拌入即食米，关火盖锅 5 分钟，最后融化芝士。 | `direct_one_pot`；单一 skillet，按顺序加入即食米；属于即食米主餐，不得把时间/液体套到普通生米。 | 未给固定份数/总时长，禽肉终点只写烹熟；即食米状态是硬边界。`recipe_fact_checked` 候选，未来快手/熟态分区。 |
| 5 | `utsa-los-barrios-arroz-con-pollo-2002` / Arroz con Pollo 2002 (Chicken with Rice) | 美国得州；UTSA Special Collections / Los Barrios Family Cookbook | [UTSA 原页](https://lacocina.utsa.edu/los-barrios-family-cookbook-2002-arroz-con-pollo-chicken-with-rice/)（HTML recipe 区） | 书籍来源为 Los Barrios Family Cookbook (2002)。页面列 1 只 2½–3 lb 鸡切 8–10 块、白米 2 杯、洋葱、青椒、番茄、蒜、油 ¾ 杯；鸡肉在重锅/荷兰锅约 25–30 分钟，**同时**另一个大锅炒米和蔬菜，加入 4 杯水后把鸡肉放回，盖锅焖约 15 分钟。页面的 servings 字段为 0。 | `staged_or_extra_pan`；来源明确写“重锅/荷兰锅 + 另一个大锅”，不是单锅直达，更不是电饭煲。 | 份数无效（页面显示 0），禽肉安全终点未给；只能作为具名版本研究记录，不能把“one-pot”宣传语覆盖实际两锅流程。`recipe_fact_checked` 待人工 canonical/份数复核。 |
| 6 | `cu-caribbean-jerk-chicken-rice` / One Pot Caribbean Jerk Chicken & Rice | 美国；University of Colorado System cookbook | [CU System cookbook PDF](https://www.cu.edu/doc/ssc-cookbookpdf)，PDF p.25 | 6 份；鸡腿约 2–3 lb、Jerk 调味、油 4 大匙、洋葱/百里香/蒜/香叶、未煮长粒米 2 杯、椰奶 13.5 oz、红腰豆 15.5 oz、鸡汤或水 2 杯等。鸡腿先在 skillet/荷兰锅每面约 3 分钟后取出；同锅炒香料，加入米/豆/液体，再把鸡肉放回，沸腾后进烤箱未盖约 30–35 分钟。prep 15、total 45 分钟。 | `staged_or_extra_pan`；同一锅但先取出/回锅并转烤箱；不是电饭煲。 | 未给禽肉中心温度；烤箱/铸铁锅/荷兰锅边界不可改写成电饭煲程序。来源为大学系统 cookbook，正式入库需做许可与页面归档。`recipe_fact_checked` 候选。 |
| 7 | `ncsu-leftover-rice-chicken-stir-fry` / Simple Stir-Fry（鸡肉/剩饭版） | 美国；N.C. Cooperative Extension | [N.C. Extension PDF](https://www.ces.ncsu.edu/wp-content/uploads/2017/06/Spring-2017.pdf?fwd=no)，PDF p.3 | 2 份、每份约 2½ 杯；prep 15、cook 10、total 25 分钟。鸡胸 1 杯、蔬菜 2 杯、熟糙米 2 杯、蒜/姜/葱、低钠酱油；鸡肉在 wok 中约 5–6 分钟后取出，炒香料和蔬菜，再加入熟米与鸡肉翻炒约 2 分钟。原文允许鸡肉换蛋或虾。 | `cooked_rice_second_cook` + `staged_or_extra_pan`；熟饭 wok 翻炒，鸡肉取出/回锅；未来剩饭品类，不进入生米轮替。 | 原文是可控变体清单，不应把“鸡/蛋/虾”并成同一食材；熟米与生米边界、油量分配和替换槽位需单独结构化。`recipe_fact_checked` 候选，未来熟饭分区。 |
| 8 | `nih-wiki-fast-rice` / Wiki (Fast) Rice | 美国；NIH/NHLBI Deliciously Healthy Family Meals | [NHLBI 原页](https://www.nhlbi.nih.gov/health/heart-healthy-living/healthy-foods/healthy-eating-recipes/wiki-fast-rice)（HTML recipe 区） | 4 份；熟糙米 2 杯、熟混合蔬菜 2 杯、水荸荠 ½ 杯、蒜/姜/葱、低钠酱油 1 大匙、芝麻油 1 茶匙；wok 或 sauté pan 中依次炒香料、水荸荠、蔬菜和熟饭，合计约 10 分钟准备/15 分钟烹调。页面说明使用冷藏剩饭。 | `cooked_rice_second_cook`；普通 wok/炒锅，明确从熟饭开始；不进入生米电饭煲轮替。 | 无生米液体合同、无生肉安全端点；适合未来“剩饭一锅”档案。`recipe_fact_checked` 候选。 |
| 9 | `osu-burrito-bowl-cooked-rice` / Burrito Bowl | 美国；Ohio State University Simple Suppers | [OSU 原页](https://u.osu.edu/simplesuppers/recipes/burrito-bowl/)（Ingredients/Directions） | prepared brown instant rice 1¼ 杯（页面同时给 ⅝ 杯未煮量）、番茄青辣椒罐头、黑豆、玉米、熟鸡丁 2½ 杯、芝士等；页面要求先煮米，鸡肉在另一锅加热至 165°F 约 15 分钟，再将豆/蔬菜和熟米合并。 | `cooked_rice_second_cook` + `extra_pan_or_steam`；熟米与另锅鸡肉，不能写成一锅生米。 | 页面存在 prepared/uncooked 两个米态表述，正式结构化必须保留状态而非选一个；适合作为未来熟饭/便当研究，不进入当前生米轮替。 |
| 10 | `uconn-chicken-soup-cooked-rice` / Chicken Soup（brown rice 选项） | 美国；University of Connecticut Husky Nutrition & Sport（注明来源 Washington State University） | [UConn 原页](https://huskynutritionsport.education.uconn.edu/recipes/chicken-soup/)（HTML lines 172–213） | 3 份；油 2 茶匙、洋葱 ½ 个、胡萝卜 3 根、蒜、液体 2 杯、番茄罐头 15 oz、熟鸡肉 1 杯、熟全麦面/糙米 1 杯、羽衣甘蓝 1 杯；同一 saucepan 先炒蔬菜，加入液体/番茄/熟鸡/熟米（或熟面）煮 5–10 分钟。 | `cooked_rice_second_cook`；熟鸡和熟米/面回锅汤，不是生米菜饭。页面称 one-pot，但原料已经熟态。 | 来源实际证明的是“剩余熟食汤”，不证明生米比例、安全或电饭煲程序；应放未来熟饭/清库存档案。 |
| 11 | `kstate-mamas-chicken-rice` / Mama’s Chicken and Rice | 美国；Kansas State University Research & Extension | [K-State Kids’ Cookbook PDF](https://extension.k-state.edu/humannutrition/nutrition-topics/eatingwell-budget/meals-documents/kidscookbookupdated32014.pdf)（PDF 索引可见，正文约 17MB 无法直接打开） | 官方搜索索引显示具名条目及“4 servings”；但当前环境无法打开完整 PDF，未把搜索摘要中的量/步骤当成已核实事实。 | `archive_or_blocked`；器具、米态和步骤待直接打开后判定。 | 必须取得可打开 PDF 或本地凭证页后，才能记录份数/液体/流程；不进入主 JSON。 |
| 12 | `va-chicken-cauliflower-enchilada-skillet` / Chicken Cauliflower Enchilada Skillet | 美国；U.S. Department of Veterans Affairs Nutrition/One Pot Meals cookbook | [VA One Pot Meals PDF](https://www.nutrition.va.gov/docs/Cookbooks/OnePotMealsCookbookNOV2022.pdf)（当前直达 PDF 超时） | 搜索索引显示具名 skillet 条目；因 PDF 当前无法打开，未核实 servings、米态、液体或安全步骤，不把索引摘要数字写入事实记录。 | `archive_or_blocked`；待官方 PDF 可读/归档后再判定是否普通锅或其他器具。 | 只能保留发现线索，不能据摘要建立合同或晋升。 |
| 13 | `ucf-southwest-chicken-rice-skillet` / Southwest Chicken & Rice Skillet | 美国；University of Central Florida Wellness & Health Promotion | [UCF 菜单页](https://whps.sdes.ucf.edu/main-dishes/)；条目链接目前只返回图片 [recipe image](https://whps.sdes.ucf.edu/wp-content/uploads/sites/40/2018/11/Southwest-Chicken-Rice-Skillet-01.jpg) | 菜单页只证明存在具名条目，图像文字无法在当前抓取链路可靠读取；未核实份数、食材、液体、流程。 | `archive_or_blocked`；不把图片标题推成普通锅或电饭煲。 | 需取得可读原图/OCR并人工逐项复核，当前不入库。 |
| 14 | `tamu-skillet-chicken-rice-casserole` / Skillet Chicken and Rice Casserole | 美国；Texas A&M AgriLife Extension Dinner Tonight | [TAMU 原页](https://dinnertonight.tamu.edu/recipe/skillet-chicken-and-rice-casserole/)（当前访问返回 403） | 搜索索引能确认具名 one-pot/one-pan recipe，当前无法直接核实完整材料、步骤、米态和安全合同。 | `archive_or_blocked`；不要因索引中出现 nutrition 字段就写入主目录。 | 待页面恢复或取得官方可归档文件后再核对；与已收录的 TAMU `Skillet Chops and Rice` 不是同一 URL/条目。 |
| 15 | `usc-spanish-chicken-sausage-shrimp-rice` / One-Pot Spanish Chicken Sausage and Shrimp with Rice | 美国；University of Southern California WorkWell EatWell Cookbook | [USC EatWell Cookbook PDF](https://workwell.usc.edu/wp-content/uploads/2025/09/EatWellCookbookFinal-compressed.pdf)（当前 PDF 超过抓取大小限制） | 搜索索引只确认具名一锅米饭条目及“使用 instant/quick-cooking brown rice”的边界；未直接核实份数、液体、完整流程。 | `archive_or_blocked`；不能将 instant rice 或鸡肠/虾的安全要求从索引推导。 | 需下载官方 PDF、记录页码和哈希后再进入事实矩阵；当前不入 JSON。 |

## 去重、排除与边界记录

1. 本批没有重复 r130 已记录的 ASMI Pink Salmon Rice Bowls、MedlinePlus Chicken and Rice、URMC Smoky Hoppin’ John、USU Salsa Verde Chicken、Penn State 熟饭 Skillet Meals 或 USU Spinach Rice；这些名称/URL 均只作为排除对照，不在本批再次登记。
2. `Arroz con Pollo` 是跨地区复用名：Illinois Extension、UTSA 与已有秘鲁/阿根廷等版本不能按同名合并。UTSA 还明确使用两个锅，不能因页面宣传语写“one-pot”而改变器具事实。
3. `direct_one_pot` 只说明原文同锅完成，不说明可用电饭煲；本批真正的普通锅/skillet/荷兰锅候选不得自动迁移到电饭煲。CU 条目还包含烤箱阶段，单独保留。
4. `cooked_rice_second_cook` 包括 N.C. Simple Stir-Fry、NHLBI Wiki Rice、OSU Burrito Bowl 和 UConn Chicken Soup；它们用于未来剩饭/熟态清库存研究，不进入当前生米菜饭轮替。
5. K-State、VA、UCF、TAMU、USC 五条仅是官方线索或受阻档案。搜索摘要、PDF 目录或图片标题不能替代直接打开的来源，当前不记录具体克数、液体、时间或安全数字。
6. 普通锅中的鸡肉步骤若只有“煮熟/不再粉红”而无中心温度，保留安全合同缺口；不使用别的菜或食品安全网页跨来源填补。

## 本批结论

- 共登记 **15 条去重研究记录**：`direct_one_pot` 3 条（UNL、OSU Cheesy Chicken、Baylor）、`staged_or_extra_pan` 3 条（Illinois、UTSA、CU）、`cooked_rice_second_cook` 4 条（NCSU、NHLBI、OSU Burrito、UConn）、`archive_or_blocked` 5 条（K-State、VA、UCF、TAMU、USC）。分类按器具/熟态事实，不把普通锅或熟饭包装成电饭煲。
- 当前最值得进入下一轮事实矩阵的是：UNL Chicken & Rice（8 份、米/液体/流程完整）、OSU Cheesy Chicken Rice Vegetable Skillet（米/液体/蔬菜完整）、Illinois Extension Arroz con Pollo（9 份且有阶段流程）和 CU Caribbean Jerk Chicken & Rice（6 份、米/豆/椰奶结构完整）。它们仍缺不同程度的安全或来源许可核验，**均不晋升 executable**。
- 本批只新增本 intake 文档；没有修改主 JSON、CSV、运行时代码或 UI，未部署。下一步如要入库，应先由人工审查者打开原文、做 canonical 去重、补来源定位/许可及安全合同，再单独建批次测试。

# 来源菜饭搜集 intake · 台湾／香港官方批次 r120

> 研究日期：2026-08-08
> 去重快照：`source-backed-one-pot-v1-20260807-national-r118`、867 条；本轮不把 r119 intake 中的候选重复计入。
> 本轮只写研究 intake，不晋升 `executable`，不修改主 JSON、CSV、运行时代码、UI 或部署产物。
> 本轮记录 **16 条目录快照未命中的官方候选**。其中 10 条有食材和流程，6 条只有身份／技法线索，均保留边界，不凑 executable 数量。

## 分类口径

- `direct_one_pot`：原文明确生米／米粥和主要配料同锅完成；只记录原文器具，不把普通锅推导成电饭煲。
- `cooked_rice_second_cook`：先有熟饭，再炒、浇汁、拌合或装配；保留为未来熟饭二次烹品类。
- `extra_pan_or_steam`：出现炒锅、烤箱、蒸笼、焯水、另锅或成型装配；不得伪装成单锅电饭煲。
- `archive`：官方确实记录具名饭／粥／米食，但缺份数、克数、液体、完整步骤或属于点心／饭团／餐厅介绍；只作档案。

## 候选清单（已按 r118 精确去重）

| intake_id | 具名菜 | 官方直达来源与定位 | 来源实际证明的食材／流程 | 器具与边界 | 当前判断与缺口 |
|---|---|---|---|---|---|
| TW-R120-01 | 米香漢堡 | [台湾农粮署北区分署电子书8](https://ebook.afa.gov.tw/tefd/ebook8/ebook8-1.html)，行 156–168 | 蓬莱米半杯、黑芝麻、牛蒡丝 50g、里肌肉丝 100g、洋葱 50g；米加半杯水入电锅蒸熟，米饼平底锅煎，牛蒡和肉另锅炒熟夹入 | `extra_pan_or_steam`；电锅米饭 + 平底锅 + 模具 | 具名和定量完整，但不是一锅主餐；缺总时长和肉类安全终点 |
| TW-R120-02 | 金黃團員飯 | [台湾农粮署北区分署电子书8](https://ebook.afa.gov.tw/tefd/ebook8/ebook8-1.html)，行 234–245 | 椰乳、夏威夷豆、丁香、香茅、黄姜粉、蒜、米 1kg；香料和米同煮成金黄饭，另配蛋卷皮、花生、炸鸡腿、牛肉丸等 | `extra_pan_or_steam` + `archive`；米饭与多种另制配菜分开 | 真实具名米饭；缺份数、液体精确量和配菜做法，不能作为单锅轮替 |
| TW-R120-03 | 檸檬飯 | [台湾农粮署北区分署电子书8](https://ebook.afa.gov.tw/tefd/ebook8/ebook8-1.html)，行 252–261 | 黄姜粉、椰粉、椰乳、柠檬叶、柠檬、米 1kg；白米与香料、椰乳、柠檬汁放电锅煮饭，鸡腿另煎煮熟后与蛋、腰果摆盘 | `extra_pan_or_steam`；电锅米饭 + 另锅鸡腿 | 电锅饭参数线索完整；缺水量、份数和鸡肉安全终点，不得合并成一锅鸡饭 |
| TW-R120-04 | 火腿起士飯球 | [台湾农粮署北区分署电子书8](https://ebook.afa.gov.tw/tefd/ebook8/ebook8-1.html)，行 94–108 | 热白饭 2 碗、火腿 2 片、起士丝 60g、蛋液、面粉、面包粉；白饭拌火腿，包起士后裹粉，油炸至金黄 | `cooked_rice_second_cook` + `extra_pan_or_steam`；熟饭成型、油炸 | 米食具名和量明确；属于饭球点心，非电饭煲主餐 |
| TW-R120-05 | 什錦壽司 | [台湾农粮署北区分署电子书8](https://ebook.afa.gov.tw/tefd/ebook8/ebook8-1.html)，行 199–209 | 鲑鱼、花枝、甜虾、鲔鱼、干贝约 15g/片；白饭拌醋糖盐，卷寿司或握寿司装配 | `cooked_rice_second_cook` + `archive`；熟饭与生／熟海鲜分开装配 | 具名米食，但不属于一锅主餐；海鲜状态和安全需单独核验 |
| TW-R120-06 | 蕃茄蛋燴飯 | [台湾农粮署北区分署电子书9](https://ebook.afa.gov.tw/tefd/ebook9/ebook9-1.html)，行 116–127 | 饭半碗、番茄 50g、蛋半个、葱花 5g、高汤 4 大匙；番茄炒蛋后加高汤、太白粉水勾芡，淋在饭上 | `cooked_rice_second_cook` + `extra_pan_or_topping` | 具名、用量和流程清楚；熟饭浇汁，缺总时长和蛋类安全终点 |
| TW-R120-07 | 蔬菜雞絨粥 | [台湾农粮署北区分署电子书9](https://ebook.afa.gov.tw/tefd/ebook9/ebook9-1.html)，行 179–190 | 稀饭 125g、去骨鸡胸 17.5g、菠菜 20g；鸡肉剁碎后炒，加入熬好的稀饭，再拌菠菜调味 | `cooked_rice_second_cook` + `extra_pan_or_steam`；已有稀饭再加入鸡肉和菜 | 具名粥饭、结构清楚；缺稀饭原始米水和总时间，鸡肉需安全终点 |
| TW-R120-08 | 糙米稀飯 | [台湾农粮署北区分署电子书9](https://ebook.afa.gov.tw/tefd/ebook9/ebook9-1.html)，行 396–409 | 糙米 60g；洗净煮成稀饭，配花生小银鱼和豌豆荚等另制配菜 | `direct_one_pot`（仅稀饭本体）+ `extra_pan_or_steam`；普通锅，配菜另锅 | 只有米粥本体能确认；缺水量、时间、份数，不能作为完整菜饭主餐 |
| TW-R120-09 | 廣東裹蒸粽 | [台湾农粮署北区分署电子书9](https://ebook.afa.gov.tw/tefd/ebook9/ebook9-1.html)，行 609–619 | 糯米 80g、绿豆仁、烧鸭肉、红枣、赤肉、叉烧、花生、莲子；馅料炒香后用竹叶和荷叶包裹，蒸约 1–2 小时 | `extra_pan_or_steam` + `archive`；炒馅、包裹、蒸笼 | 具名米食和时间清楚；粽类复杂、非电饭煲一锅主餐 |
| TW-R120-10 | 嫩肉燴飯 | [台湾农粮署北区分署电子书9](https://ebook.afa.gov.tw/tefd/ebook9/ebook9-1.html)，行 661–671 | 米饭 1 碗、嫩猪肉 50g、绿竹笋 50g、胡萝卜 20g、高汤 4 大匙；猪肉先处理，竹笋煮熟，炒香后加高汤勾芡淋饭 | `cooked_rice_second_cook` + `extra_pan_or_topping` | 量和流程完整；熟饭浇汁，需猪肉终点和总时长 |
| TW-R120-11 | 牛奶泡飯 | [台湾农粮署北区分署电子书9](https://ebook.afa.gov.tw/tefd/ebook9/ebook9-1.html)，行 2–12 | 米饭 1/4 碗、热牛奶 1 杯；热牛奶直接倒入熟饭 | `cooked_rice_second_cook` + `archive`；幼儿早餐／泡饭 | 官方具名且流程明确，但不是菜饭主餐，缺营养与份数边界 |
| HK-R120-12 | 330夏威夷暖蓋飯 | [香港卫生署 EatSmart](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=1359)，行 9–23 | 十谷米饭底，配车厘茄、火龙果、牛油果、枝豆、有机藜麦、自制有机豆腐；十谷米先浸泡，车厘茄和豆腐烤热 | `extra_pan_or_steam` + `archive`；餐厅成品介绍，无克数/液体/时间 | 真实餐厅菜名和营养结构线索；不提供可执行合同，不进轮替 |
| HK-R120-13 | 粟米肉粒飯 | [香港卫生署 EatSmart](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=977)，行 44–55；营养页 [content_id=877](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=877) | 官方介绍北角潮州餐厅的粟米肉粒饭，另给约 770g 餐盘的营养比较（每 100g 约 120kcal、蛋白质 5.2g）；未给家庭份量、液体或步骤 | `archive`；餐厅身份/营养记录，不等同家庭食谱 | 具名且有官方身份，缺完整食材和流程，不入 B 架 |
| HK-R120-14 | 香草白汁龍脷飯 | [香港卫生署 EatSmart](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=233)，页面正文与图注 | 官方介绍以橄榄油、脱脂奶、甜椒制作白汁龙脷饭或意粉，强调鱼、蔬菜和较低饱和脂肪；没有家庭配方克数和烹调步骤 | `archive`；餐厅健康菜示例 | 仅身份与营养方向，不能补写成米饭做法 |
| HK-R120-15 | 豉汁白鱔飯 | [香港卫生署 EatSmart《营厨》第十五期 PDF](https://restaurant.eatsmart.gov.hk/files/pdf/cooksmart15_text_PDF.pdf)，PDF 搜索定位“煲仔飯”段 | 官方期刊列为香港煲仔饭具名变体，英文摘要对应 white eel in black bean sauce；当前可确认菜名和传统煲仔饭语境 | `archive`；PDF 原文的定量、米水和时间尚未归档核对 | 具名来源真实，但不能从摘要补合同；需下载归档及页码定位 |
| HK-R120-16 | 蝦醬脆片飯 | [香港卫生署 EatSmart《营厨》第十五期 PDF](https://restaurant.eatsmart.gov.hk/files/pdf/cooksmart15_text_PDF.pdf)，PDF 搜索定位“煲仔飯”段 | 官方期刊列为香港煲仔饭具名变体，英文摘要对应 sliced pork in shrimp paste；当前可确认菜名和地域语境 | `archive`；需原 PDF 页码、份数、食材量、器具和安全合同 | 只留档案，不进入轮替；不得按“虾酱”自行推导食材或做法 |

## 去重与证据边界

1. 上表 16 个名称与 r118 的 `name`、`canonical_name`、`aliases` 精确去重后均未命中；`米香漢堡`、`檸檬飯`等虽为米饭主餐，但原文有另锅馅料或配菜，不得归为纯电饭煲一锅。
2. `蕃茄蛋燴飯`、`嫩肉燴飯`属于熟饭浇汁；`蔬菜雞絨粥`先有稀饭再拌鸡肉；这些候选不得被前端误标为生米一锅。
3. `330夏威夷暖蓋飯`、`粟米肉粒飯`、`香草白汁龍脷飯`、`豉汁白鱔飯`、`蝦醬脆片飯`来自香港卫生署官方资料，但部分仅提供餐厅身份或期刊摘要，不具备可执行四合同，暂留 `archive`。
4. 所有肉、禽、鱼、虾、贝、蛋条目仍需独立安全终点；来源写“熟”不自动等于项目温度合同。
5. 本文不改变 `catalog_version`，不修改主 JSON、CSV、运行时代码、UI 或部署；后续若要入库，必须单独建立批次测试、来源归档、版本 bump 与人工审查记录。

## 候选价值排序

- **优先继续核实**：`蕃茄蛋燴飯`、`嫩肉燴飯`、`蔬菜雞絨粥`——官方页面直接给出用量和流程，但都是熟饭／熟粥二次烹。
- **需器具实测后再考虑**：`米香漢堡`、`檸檬飯`——明确使用电锅煮米，但鸡肉／馅料另锅，不能许诺“一锅完成”。
- **仅作内容档案**：`330夏威夷暖蓋飯`、`粟米肉粒飯`、`香草白汁龍脷飯`、`豉汁白鱔飯`、`蝦醬脆片飯`；证据不足时不应为了凑轮替数量而补写做法。

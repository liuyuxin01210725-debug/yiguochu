# 全球公共机构一锅米饭来源搜集 Intake（r126-public3）

**研究日期**：2026-08-08
**去重基线**：主目录 `source-backed-one-pot-v1-20260808-global-r125`（884 条）；同时对照 r119–r125 intake。
**本批性质**：只写研究 intake，不修改主 JSON、CSV、运行时代码或 UI；不晋升 `executable`，不部署。
**来源范围**：日本农林水产省、澳大利亚州政府卫生系统、美国大学/Cooperative Extension、美国州公共教育及公共大学食育资料。候选必须保留真实具名和原器具边界；来源不完整时只进档案，不把推断写成配方。

## 判定口径

- `direct_one_pot`：来源明确在同一锅/同一普通炊具内完成生米和主要配料。只记录原器具事实，普通锅/平底锅不推导为电饭煲。
- `staged_or_extra_pan`：有预炒、预煮、另锅、填馅、烤箱、压力锅或中途取出再放回等阶段；可以是“一锅饭家族”研究候选，但不能伪装成直接投料。
- `cooked_rice_second_cook`：以熟饭、微波饭或剩饭为起点，再炒/拌/回锅/烘烤；不进入当前生米轮替，留给未来“剩饭二次烹”品类。
- `archive`：页面只证明身份、页面/PDF 暂时无法直接复核关键字段，或来源是索引/搜索摘录；不得用其数字建立合同。

所有份数、数量、液体、时间、步骤和器具均按来源原文记录；`null` 代表来源未证明，不能跨来源补猜。`direct_one_pot` 不等于电饭煲适配，适配仍需独立实做证据。

## 候选清单

| # | 建议 ID / 具名菜 | 地区 / 机构 | 直达来源与定位 | 来源实际证明 | 器具与边界 | 缺口 / 建议状态 |
|---:|---|---|---|---|---|---|
| 1 | `maff-tamba-azuki-manganji-paella` / 丹波大納言小豆と万願寺甘とうのパエリア | 日本；农林水产省 | [MAFF 原页](https://www.maff.go.jp/j/seisan/ryutu/engei/IYFV2021/IYFV2021_menu/96.html)，HTML 行 257–295 | 页面标题、40–50 分钟、2 人份；万願寺甘とう 350g、洋葱 50g、番茄 200g、虾 200g、鲑 200g、小豆 130g、米 150g、水 600ml 等；同页给预煮小豆、深锅炒香、煮海鲜后取出、米与小豆高/低火炊煮、烤椒装饰流程。 | `staged_or_extra_pan`；普通深锅/平底锅，海鲜和辣椒有取出、另行烤制，不能转成电饭煲直投。 | 需要鱼虾安全终点；不应把“40–50 分钟”拆成可执行分段。`recipe_fact_checked` 候选，B 否。 |
| 2 | `maff-tomato-curry-takikomi` / たき込みトマトカレーに追いトマトのトッピング | 日本；农林水产省 | [MAFF 原页](https://www.maff.go.jp/j/seisan/ryutu/engei/IYFV2021/IYFV2021_menu/2_133.html)，HTML 行 257–306 | 2 人份；米 1 合、磨碎番茄约 100g、鸡肉末 60g、香肠 20g、洋葱/蒜、咖喱/孜然、白酒、水约一合水位、青椒、樱桃番茄等；页面明确先炒肉和香料，再把米/番茄/水放炊饭器，另做追い番茄。 | `staged_or_extra_pan`；炊饭器主体 + 平底锅炒料/追い番茄 + 微波青椒，不能称全程一锅。 | 肉类安全终点和炊饭器型号未给；按原文保留“早炊可”，不转成分钟。`recipe_fact_checked` 候选，B 否。 |
| 3 | `maff-gutazawa-takikomi` / 具沢山炊き込みご飯 | 日本；农林水产省近畿农政局 | [MAFF PDF](https://www.maff.go.jp/kinki/syouhi/seikatu/syokuiku/attach/pdf/241015-50.pdf)，PDF p.1，行 1–56 | 2 人份表头；昆布 10g、柴鱼 15g、水 800cc、出汁 150cc、酒/酱油/味醂、胡萝卜、金针菇、油炸豆腐、鸡肉、鸡蛋、海苔；先在锅中取出昆布柴鱼出汁，再以每一合米加冷却出汁和配料炊煮，鸡蛋另煮 8 分钟、最后放入并裹海苔。 | `staged_or_extra_pan`；出汁和鸡蛋分开，原文未指定电饭煲型号。 | 米量与总时长未闭合；鸡蛋/鸡肉安全终点未给。`recipe_fact_checked` 候选，B 否。 |
| 4 | `maff-carrot-rice-cheese-onigiri` / にんじんご飯でチーズおにぎり | 日本；农林水产省 | [MAFF 原页](https://www.maff.go.jp/j/pr/aff/1912/spe2_02.html)，HTML 行 333–379 | 2 个饭团；米 1 合、胡萝卜 50g、盐 1/4 小匙、婴儿芝士 2 个份、大叶 2 枚；胡萝卜与盐进炊饭器按刻度炊熟，出锅与芝士拌匀后捏饭团。 | `cooked_rice_second_cook`；生米炊饭后另拌芝士/成型，不是完整一锅主餐。 | 只有碳水+少量乳制品，缺蔬菜/蛋白完整餐结构；保留为具名档案，不进当前轮替。 |
| 5 | `nsw-sausage-pilaf` / Sausage pilaf | 澳大利亚；NSW Government Sydney Local Health District | [Yhunger 原页](https://slhd.health.nsw.gov.au/yhunger/recipes-tips/rice/sausage-pilaf)，HTML 行 30–59 | 明确 2/4/6 人份；准备 5 分钟、烹调 40 分钟；香肠、洋葱、彩椒、米、番茄罐头、鸡汤按人数列量；同一大锅先煎香肠再加入米/番茄/高汤，盖锅焖并静置 15 分钟。 | `direct_one_pot`；普通带盖大锅，来源未写电饭煲。 | 香肠熟制终点未写；4 人份时间是基准，2/6 人须按页面提示调整。`recipe_fact_checked` 候选，B 普通锅。 |
| 6 | `nsw-oven-baked-biryani` / Oven Baked Biryani | 澳大利亚；NSW Government Sydney Local Health District | [Yhunger 原页](https://slhd.health.nsw.gov.au/yhunger/recipes-tips/soups-stews/oven-baked-biranyi)，HTML 行 30–68 | 2/4/6 人份；准备 10、烹调 40 分钟；洋葱、咖喱酱、印度香米、鸡汤、鸡腿肉、混合蔬菜按人数列量；同一耐热器皿先在炉上炒洋葱和鸡肉，再加米/汤/菜，盖上烤 40 分钟。 | `staged_or_extra_pan`；炉灶 + 带盖烤箱耐热锅，不是电饭煲。 | 禽肉安全只写“鸡肉熟”，没有温度端点；可作为焖饭家族事实候选，B 否。 |
| 7 | `nsw-dolma-meat` / Dolma with meat（Iranian stuffed capsicums） | 澳大利亚；NSW Government Sydney Local Health District | [Yhunger 原页](https://slhd.health.nsw.gov.au/yhunger/recipes-tips/salads-vegetables/dolma-with-meat)，HTML 行 30–76 | 2/4/6 人份；米、黄豆瓣、肉末、番茄、水、香草和青椒均列量；先炒肉/洋葱/香草，把米豆混入后填入青椒，置番茄水中，炉灶 45–55 分钟或烤箱 40–45 分钟。 | `staged_or_extra_pan`；填馅 + 多锅/烤箱，不能伪装成米饭锅直投。 | 肉类终点未给；属于带米主餐，但器具和步骤明显不同，建议档案/研究候选。 |
| 8 | `nsw-dolma-vegetarian` / Dolma vegetarian style | 澳大利亚；NSW Government Sydney Local Health District | [Yhunger 原页](https://slhd.health.nsw.gov.au/yhunger/recipes-tips/salads-vegetables/dolma-vegetarian)，HTML 行 30–70 | 2/4/6 人份；青椒、黄豆瓣、米、香草、番茄、柠檬和水均列量；炒洋葱蒜，混合豆米香草后填椒，番茄水中炉灶 40–60 分钟或烤箱 50–70 分钟。 | `staged_or_extra_pan`；填馅、分锅或烤箱，不是电饭煲直投。 | 缺安全/成品中心温度；保留为地域/技法档案。 |
| 9 | `colorado-yakhni-pulao` / Yakhni Pulao | 美国；University of Colorado Boulder | [CU Boulder 原页](https://www.colorado.edu/orientation/2024/04/05/yakhni-pulao)，HTML 行 29–62 | 4 人份、份量 1000g；印度香米 2 杯、羊/山羊肉 500g、酸奶 3 大匙、油/酥油 4 大匙、香料；先在压力锅/Instant Pot/大锅以肉、姜蒜和 4 杯水煮肉取汤，再同锅或另锅炒香料洋葱、加肉/酸奶/米/肉汤，吸收后焖 15 分钟。 | `staged_or_extra_pan`；压力锅或大锅取汤、可同锅续作，但不是电饭煲参数。 | 肉类安全终点和总时长未给；来源称北巴基斯坦家庭传统，保留为具名抓饭候选。 |
| 10 | `tamu-rice-pilaf` / Rice Pilaf | 美国；Texas A&M AgriLife Extension Dinner Tonight | [官方 One Pot Meals 页面](https://dinnertonight.tamu.edu/course/one-pot-meals/)，Rice Pilaf 条目（页面索引/正文字段） | 页面正文列 8 份、每份 1 杯；糙长米 1.5 杯、洋葱 1/2 杯、蒜 2 瓣、无盐鸡汤 3.5 杯、冷冻混合蔬菜 1.5 杯、山核桃 1/2 杯；先炒米/洋葱/蒜，再加汤菜煮沸，盖锅小火 30 分钟、离火焖 15 分钟。 | `direct_one_pot`；小炖锅/普通带盖锅；官方页面把它称为 one-pot，但也说明更适合作为鸡/鱼配菜，不能宣传为独立全营养主餐。 | 页面当前抓取有动态区块，需入库前保存正文定位；本身无肉/豆蛋白，营养结构需标注。 |
| 11 | `tamu-one-pan-tex-mex-beef-rice` / One Pan Tex Mex Beef and Rice | 美国；Texas A&M AgriLife Extension Dinner Tonight | [官方 One Pot Meals 页面](https://dinnertonight.tamu.edu/course/one-pot-meals/)，条目正文 | 6 份、每份约 1.5 杯；瘦牛肉 1 磅、黑豆 15oz、**熟米饭** 1 杯、莎莎酱 1 杯、低脂切达 1/2 杯；同一平底锅炒牛肉后加豆/熟饭/莎莎加热，最后放奶酪。 | `cooked_rice_second_cook`；明确以熟饭为输入，不进入生米轮替。 | 牛肉温度仅在页面条目另处出现，需锁定对应行；属于未来熟饭二次烹候选。 |
| 12 | `usu-brown-rice-spanish-rice` / Brown Rice Spanish Rice | 美国；Utah State University Extension | [USU Create Better Health](https://extension.usu.edu/createbetterhealth/blog/BrownRiceSpanishRice)（当前直接抓取返回错误） | 搜索定位显示：糙米 2 杯、番茄罐头、盐、蒜、水 3 杯；页面描述 rice cooker/pressure pot 可把全部材料同锅烹调，炉灶版约 40–50 分钟。 | 理论上 `direct_one_pot`（含 rice cooker 路径），但本轮原页无法打开，暂列 `archive`；不把搜索摘要数字当合同。 | 需下载/归档可复核页面后再确认份量、水量和步骤；未进入轮替。 |
| 13 | `uab-one-pot-red-beans-rice` / One-Pot Red Beans & Rice | 美国；University of Alabama at Birmingham | [UAB PDF](https://www.uab.edu/humanresources/home/images/EmployeeWellness/Recipes/WellnessRecipe_Feb2019.pdf)，PDF p.1，行 2–44 | 4 份、每份 2 杯；安杜伊香肠 1/2 磅、洋葱、蒜、西芹、肾豆罐头、番茄罐头、糙米 1 杯、水 2 杯和香料；同锅煎香肠/蔬菜，加番茄/豆/水/米，煮沸后盖锅小火 45 分钟，关火加青椒焖 10 分钟。 | `direct_one_pot`；普通带盖锅，同锅分阶段。 | 香肠/罐头的安全与钠需提醒；来源未给肉类温度。营养信息含蛋白 21g/份，可作高覆盖候选。 |
| 14 | `montana-butternut-rice-pilaf` / Butternut Rice Pilaf | 美国；Montana Farm to School / Public Health–Seattle & King County 资助材料 | [官方 PDF](https://www.montana.edu/mtfarmtoschool/documents/f2s-month-page/ButternutRicePilaf_WAF2S.pdf)，PDF p.1，行 1–31 | 25/50/100 份批量表；25 份南瓜 2lb、四季豆 1/2lb、糙米/印度香米 2 杯、肉汤溶液 32oz（页面同时显示量勺）、咖喱粉 1.5 大匙、罗勒；同一锅南瓜/米/汤/咖喱煮沸后小火 25 分钟，加四季豆再煮 5 分钟；准备约 60 分钟。 | `direct_one_pot`；普通 saucepan；官方明确称 one-pot wonder，不外推电饭煲。 | 25 份批量不适合直接家庭份量；营养仅谷物+蔬菜（每份蛋白 2g），应标“缺蛋白”，不作完整主餐承诺。 |
| 15 | `pace-west-african-rice-bean` / West African Style Rice and Bean | 美国；Pace University Teaching Kitchen | [Pace 原页](https://www.pace.edu/college-health-professions/life-chp/nutrition-and-dietetics-teaching-kitchen-pace-university-1-0)，HTML 行 823–853 | 4–6 份；罐装黑豆/肾豆 2 杯、长粒米 1 杯、番茄/番茄膏、洋葱蒜姜、甜椒、蔬菜高汤 2 杯、菠菜和香料；先炒香料番茄，再**加入已煮熟米饭和熟豆**，加汤煮 3–4 分钟，离火拌菠菜。 | `cooked_rice_second_cook`；页面虽称 one-pot plant-forward staple，但实际流程以熟饭为起点，不进入生米轮替。 | 仅 4–6 份、步骤完整；熟饭来源和汤量需单独记录，未来可作为剩饭/豆类主餐。 |
| 16 | `ncsu-unstuffed-peppers` / Unstuffed Peppers | 美国；N.C. Cooperative Extension（Lenoir County） | [N.C. Extension 原页](https://lenoir.ces.ncsu.edu/news/one-bowl-wonders/)，HTML 行 97–119 | 4 份；瘦牛肉 1lb、青椒 2、洋葱、蒜、番茄膏、未煮长粒米 1/2 杯、番茄罐头 15oz、水 1/2 杯、芝士；同一大锅炒肉和蔬菜，加米/番茄/水，沸腾后盖锅小火 20–25 分钟，焖 5–10 分钟。 | `direct_one_pot`；普通大锅；来源没有电饭煲转换。 | 牛肉熟度只以“变褐”描述，缺温度端点；营养每份给蛋白 31g、纤维 3g，值得后续事实矩阵。 |
| 17 | `berkeley-one-pot-burrito-bowls` / One Pot Burrito Bowls | 美国；UC Berkeley University Health Services | [UC Berkeley 食谱 PDF](https://uhs.berkeley.edu/sites/default/files/recipes-quickandeasymeals2025.pdf)（当前 URL 404，旧快照曾列该条） | 旧 PDF 快照显示 4 份、约 45 分钟；黑豆、玉米、彩椒、莎莎、青辣椒、塔可调味、茉莉米 1 杯和水/高汤 1 杯；锅内加料、米需浸没，炉灶焖 16–20 分钟，亦列 Instant Pot 10 分钟。 | 暂列 `archive`；来源可能是 `direct_one_pot`/压力锅双路径，但当前官方文件不可直接读取，不能把旧快照当现行合同。 | 需找新 PDF/官方页面、归档并复核许可与步骤；不入主目录。 |
| 18 | `nsw-vegetable-chicken-congee` / Vegetable and chicken congee | 澳大利亚；NSW Government | [NSW Government 原页](https://www.nsw.gov.au/health-and-wellbeing/healthy-living/healthy-eating/healthy-recipes/vegetable-and-chicken-congee)（本轮请求超时） | 搜索/页面标题确认具名鸡肉蔬菜粥，页面说明可用剩饭，并将蛋单独煮熟后加入；可用鸡肉、鱼或豆腐替换。 | 主边界 `archive`（疑似 `cooked_rice_second_cook`）；从剩饭起步且有单独蛋处理，不能当生米电饭煲一锅。 | 待页面恢复后核实份数、米/水、时间和安全；仅作为未来熟饭粥类候选。 |
| 19 | `tamu-southwest-beef-skillet` / Southwest Beef Skillet | 美国；Texas A&M AgriLife Extension Dinner Tonight | [官方 one-pot 标签页](https://dinnertonight.tamu.edu/tag/one-pot/)，条目正文（当前通过索引可见） | 6 份；瘦牛肉、洋葱、甜椒、玉米、黑豆、番茄辣椒罐头、微波糙米 8.8oz、塔可调味、低脂芝士；先炒牛肉/蔬菜，再拌入罐头与**熟微波米饭**，小火加热 10–15 分钟，最后铺芝士。 | `cooked_rice_second_cook`；熟饭/微波饭，不进入生米轮替。 | 页面温度写 150°F，需与项目安全口径复核；保留为未来熟饭一锅候选。 |

## 去重与排除

1. 本批按 r125/884 主目录和 r119–r125 intake 做了名称、别名、地区及 URL 去重；`Rice Pilaf` 虽与目录中的两个复合名称包含相同词，仍先作为不同来源的通用具名候选登记，正式入库前需由人工决定是否合并。
2. r125-public2 已有的 `One Pot Beans and Rice`、`One-Pot Chicken Lentil Rice`、`Salmon Mornay Rice Bake` 等不在本批重复登记；日本 MAFF 既有玉米/里芋/ホタテ/五目等版本也未重复，只保留本批不同具名版本。
3. `cooked_rice_second_cook`（Tex-Mex Beef、West African Rice & Bean、Southwest Beef Skillet、鸡肉蔬菜粥等）不进入当前生米轮替；若以后开放“熟饭二次烹”，应建立独立目录与安全合同。
4. 搜索摘录、404 或超时页面（USU Brown Rice Spanish Rice、UC Berkeley Burrito Bowls、NSW Congee）只作发现/档案，不把摘要数字写入 JSON；恢复后必须直接打开、记录页码/行号并按当前 validator 复核。
5. 普通锅、平底锅、压力锅和烤箱的水量/时间均不转换为电饭煲参数。只有来源明确写出电饭煲的条目才可以进入“电饭煲候选”，仍需独立厨房验证。

## 本批结论

- 共登记 **19 条**未在 r125/884 主目录中发现的具名候选：按每条一个主边界计，**5 条 `direct_one_pot`、7 条 `staged_or_extra_pan`、4 条 `cooked_rice_second_cook`、3 条 `archive`**。带 `archive` 的条目不使用搜索摘要建立合同。
- 最值得下一步建立事实矩阵的是：NSW Sausage pilaf、UAB One-Pot Red Beans & Rice、N.C. Extension Unstuffed Peppers、Montana Butternut Rice Pilaf、Colorado Yakhni Pulao；它们均有固定份量或液体/流程，但仍需安全合同和器具边界审查。
- 本批没有任何条目晋升 `executable`，没有修改主 JSON、CSV、运行时代码或 UI，也没有部署。下一步应先做名称合并审查和 PDF/动态页面归档，再决定是否进入主目录。

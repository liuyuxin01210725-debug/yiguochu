# 一锅出公开来源搜集（r138，intake-only）

日期：2026-08-08

主目录去重基线：`source-backed-one-pot-v1-20260808-global-r137`（916 条）

去重范围：主目录 r137，以及 r119–r137 的港台、澳门、东亚、厂商、区域和 global-public intake。以下记录只写研究 intake，不修改主 JSON、CSV、运行时代码、UI、构建产物或部署包。

## 本轮结论

本轮核对了香港 StartSmart/食物安全中心/衞生署公开资料、台湾农业及食农教育页面，以及美国大学 Extension、澳洲州政府卫生部门、澳洲地方政府等公共机构原页。新增候选按器具和米态分成几类，不能因为都含“饭”字就放进同一个电饭煲轮替池：

- **3 条生米同锅或同锅分阶段**：香港粟米瘦肉粥（电饭煲、后段投料）、伊利诺伊大学 Chicken with Vegetables and Rice（普通锅、鸡肉先取出再回锅）、昆士兰 Metro South One-Pot Chicken Lentil Rice（普通锅、鸡肉先煎后回锅）。
- **2 条明确使用电饭煲但属于主食/配菜或变体，需谨慎**：台东小米飯、红藜飯/薑黃飯。它们的米量和水量较完整，但没有肉/豆类等主要蛋白，不直接当营养完整主餐。
- **4 条熟饭二次烹、另锅或公共资料边界**：香港粟米肉粒三色飯、番茄肉碎蛋飯、金色意大利燴飯、意式香草鮮蝦青豆野米飯；它们必须保留熟饭/另锅流程，不能改写为生米电饭煲菜饭。
- **3 条需要归档或进一步补证**：香港 15 种野菜咖喱飯、台湾红枣小米粥、墨尔本市 One-Pot Tofu Biryani。页面/文件能证明菜名和部分流程，但器具转换、份量或字段仍不闭合。
- **已有目录的强化来源**：香港菜心瑤柱飯、台湾五谷杂粮飯、竹筍炊飯、鯛魚毛豆炊飯、客家创意地瓜飯、小米炊飯、昆士兰 One Pot Beans and Rice 等均已存在，记录在去重区，不重复创建 canonical。

所有候选保持研究状态（`discovered` 或 `recipe_fact_checked_candidate`），不晋升 `executable`。普通锅、炒锅、蒸锅、慢炖锅和烤箱事实不推导成电饭煲参数；缺失字段保留 `null`，不以常识补写。

## A. 新候选（未占用当前目录 canonical）

下表中的“来源证明”只列直接页面/文件明确写出的事实；“缺口”是入库前仍需补齐的证据，不是可直接照做承诺。

| # | intake id / 具名菜 | 直达来源 | 分类与器具边界 | 来源明确证明的事实 | 当前缺口与处理 |
|---:|---|---|---|---|---|
| 1 | `hk-startsmart-corn-lean-pork-congee` / 粟米瘦肉粥 | [香港 StartSmart 原页](https://www.startsmart.gov.hk/tc/photogalleryDetail.aspx?RecipeID=5)，页面标题、食材和方法段（直接打开） | `direct_one_pot`；电饭煲；粥类，后段投料 | 水 3.6 L、米 375 g、瘦肉 350 g、玉米粒 250 g、盐 1 茶匙；页面写 83 份、准备 10 分钟、烹调 30 分钟；电饭煲烧水后下米，米开花时加入肉丁和玉米，煮熟后调味。 | 83 份明显是学校批量配方，家庭份数需保持来源值或另找家庭版；安全终点和米/肉形态定位尚不完整。候选状态 `recipe_fact_checked_candidate`，不升 executable。 |
| 2 | `hk-startsmart-corn-pork-three-color-rice` / 粟米肉粒三色飯 | [香港 StartSmart 原页](https://www.startsmart.gov.hk/en/photogalleryDetail.aspx?RecipeID=16) | `cooked_rice_second_cook`；炒锅 + 熟三色饭；非生米同锅 | 2 份；玉米 1 根、瘦猪肩 150 g、西兰花 1 棵、胡萝卜 1 根、三色米 1 杯、油 3 茶匙；蔬菜汆烫、猪肉腌制后煎熟，再炒蔬菜并回锅猪肉，配三色饭；准备/烹调各 30 分钟。 | 原文是“配以三色飯”的熟饭搭配，不应伪装成电饭煲菜饭；分类 `cooked_rice_second_cook`，仅进入未来熟饭分区。 |
| 3 | `hk-startsmart-tomato-minced-pork-egg-rice` / 番茄肉碎蛋飯 | [香港 StartSmart 原页](https://www.startsmart.gov.hk/en/photogalleryDetail.aspx?RecipeID=109) | `cooked_rice_second_cook`；炒锅 + 熟白饭 | 约 20 份；番茄 3 斤、瘦肉碎 10 两、鸡蛋 5 个、熟白饭 15 碗、粟米油 4 汤匙、盐；肉炒至七成熟、蛋炒至半熟，番茄煮软后回放肉蛋，最后加入熟饭煮透；准备/烹调约 20 分钟。 | 大批量学校配方，熟饭输入和另锅工序明确；不进当前生米轮替。 |
| 4 | `hk-cfs-fifteen-vegetable-curry-rice` / 15 种野菜咖喱飯 | [香港食物安全中心原页](https://www.cfs.gov.hk/tc_chi/multimedia/multimedia_pub/multimedia_pub_fsb_201703.html) | `extra_pan_or_steam`；米饭可用电饭煲，咖喱汁另锅；公共食安资料 | 先制咖喱汁；南瓜、番薯、粟米和珍珠米放电饭煲制成蔬菜饭；页面要求成品保持至少 60°C，再配咖喱汁。 | 没有固定份数、克数、米水量和总时长；咖喱汁与米饭分锅，不能列作“一锅同时完成”。状态 `identity_verified_candidate`/archive。 |
| 5 | `hk-cfs-golden-pumpkin-shrimp-risotto` / 黃金意大利燴飯 | [香港食物安全中心食谱 PDF](https://www.cfs.gov.hk/english/whatsnew/whatsnew_act/files/recipes_s6.pdf)，PDF p.3–4 | `extra_pan_or_steam`；电饭煲半熟米 + 炒锅/汤锅多阶段 | 约 3 份；意大利/珍珠米 150 g、水 500 ml、虾 5 只、虾壳、南瓜泥 250 g、洋葱、鲜蘑菇、彩椒、黄油、奶油和油；米在电饭煲煮至半熟后，另锅煎虾/蔬菜并用虾壳水和南瓜泥分次烩米，最后加入虾、彩椒和奶油。 | 这是分次加汤的烩饭，页面没有电饭煲完成程序；食材和液体字段相对完整，但不当作电饭煲直达菜饭。 |
| 6 | `hk-eatsmart-shrimp-pea-wild-rice` / 意式香草鮮蝦青豆野米飯 | [香港 EatSmart 原页](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=237) | `cooked_rice_second_cook`；炒锅；熟/半熟米二次烹 | 1 份；野米 60 g、白米 20 g、橄榄油 2 茶匙、高汤 4 汤匙、虾 30 g、青豆 3/4 杯、紫罗勒；先把米煮至七成，再在锅中与虾和青豆炒/焖。 | 来源明确为熟/半熟米二次加工，不进入生米电饭煲轮替；海鲜安全终点和米态细节需再核。 |
| 7 | `tw-ttdares-millet-rice` / 小米飯 | [台东县农业改良场原页](https://www.ttdares.gov.tw/ws.php?id=4128) | `direct_one_pot`；电子锅；纯谷物饭 | 台东 32 号白米 3 杯、小米 1/2 杯；小米浸泡 2 小时，白米按约 1:1 水浸泡 30 分钟，电子锅煮熟后焖 15–20 分钟再拌匀。 | 只有米和小米，蛋白质为 0，作为谷物/配菜档案，不承诺营养完整主餐；器具和米水事实可进一步结构化。 |
| 8 | `tw-ttdares-red-quinoa-rice` / 紅藜飯 | [台东县农业改良场原页](https://www.ttdares.gov.tw/ws.php?id=3307) | `direct_one_pot`；电子锅；谷物饭变体 | 白米 2 杯（约 300 g）、红藜 20 g、水 2 杯；洗净浸泡约 30 分钟后电子锅煮熟、拌匀。 | 无份数、蛋白/蔬菜和安全合同；纯谷物档案/变体，不能将其包装成完整主餐。 |
| 9 | `tw-ttdares-turmeric-rice` / 薑黃飯 | [台东县农业改良场原页](https://www.ttdares.gov.tw/ws.php?id=3307) | `direct_one_pot`；电子锅；谷物饭变体 | 白米 2 杯、姜黄粉 2 g、水 2 杯；混合、浸泡约 30 分钟后电子锅煮熟。 | 同一来源的另一具名变体；没有蛋白/蔬菜和份数，归谷物档案，不作为完整主餐。 |
| 10 | `tw-fae-japanese-bamboo-rice` / 日式竹筍炊飯 | [台湾农业部食农教育教学计划 PDF](https://fae.moa.gov.tw/files/TeachingPlan/872/A01_1.pdf)（原始 PDF，文本提取需人工页图复核） | `direct_one_pot`；电饭锅，末段拌入枝豆；台湾食农教学 | 白米 5 杯、鲜竹笋 2 个、胡萝卜、鸿喜菇、枝豆、盐、日式酱油 1/2 杯、味醂；原料铺在米上，用米饭程序煮，煮好后拌入枝豆。 | 与现有竹笋炊饭家族相近但非同一来源版本；需人工核对 PDF 页码/许可与份数、液体对象，先做 canonical review，避免重复合并。 |
| 11 | `tw-fae-red-date-millet-porridge` / 紅棗小米粥 | [台湾农业部/食农教育 PDF](https://fae.moa.gov.tw/files/topics/4237/A02_1.pdf)（PDF 原件；部分字段来自原页索引） | `direct_one_pot` 候选；粥/电锅边界待核 | 原页索引明确菜名“红枣小米粥”，海报标示约 2.5 小时等时长信息；推定为米/小米与红枣同煮，但未把推定写成事实。 | 当前文本提取不足，米量、水量、份数、投料顺序需逐页归档核验；状态 `discovered`，不进轮替。 |
| 12 | `global-illinois-chicken-vegetables-rice` / Chicken with Vegetables and Rice | [University of Illinois Extension 原页](https://extension.illinois.edu/diabetes/recipes/chicken-vegatables-and-rice) | `direct_one_pot`；普通锅/大锅，分阶段取出回锅 | 6 份；鸡肉、油 2 茶匙、水 4 杯、番茄、青椒、红椒、西芹、胡萝卜、玉米、洋葱、蒜、米 2 杯、豌豆、橄榄、葡萄干等；鸡肉先煎并取出，蔬菜和水煮 20–30 分钟，加入米/豌豆/橄榄煮约 20 分钟，再放回鸡肉和葡萄干焖 8 分钟。 | 普通锅分阶段；鸡肉安全终点未在该页明确，需另找安全来源；不能推导电饭煲参数。候选状态 `recipe_fact_checked_candidate`。 |
| 13 | `global-qld-chicken-lentil-rice` / One-Pot Chicken Lentil Rice | [Queensland Metro South Health 食谱 PDF](https://www.metrosouth.health.qld.gov.au/__data/assets/pdf_file/0039/476877/healthy-new-communites-complete-cookbook.pdf) | `direct_one_pot`；普通锅，鸡肉先煎后回锅 | 4 份；印度香米 1.5 杯、鸡腿 4 块/约 500 g、洋葱、蒜、罐装扁豆、姜黄、孜然、水 2.5 杯、汤粉；鸡肉煎上色后取出，炒洋葱和香料，米炒约 2 分钟，加入扁豆/水/高汤，煮开后回放鸡肉，小火约 15 分钟；准备 5 分钟、烹调 40 分钟。 | 公共卫生 PDF 未给禽肉中心温度；原器具是普通锅，不外推电饭煲；需补来源 locator/安全合同后再评估。 |
| 14 | `global-melton-tofu-biryani` / One-Pot Tofu Biryani | [Melton 市政府儿童家庭食谱 PDF](https://www.melton.vic.gov.au/files/assets/public/v/1/services/people/children/from-starting-solids-to-cooking-for-the-whole-family/cook-book-multiple-languages/english-intro-to-solids-cookbook-nov-2025.pdf) | `extra_pan_or_steam`；普通锅，腌制、汆米、分层蒸焖 | 4–5 份；酸奶 1 杯、硬豆腐 400 g、印度香米 2 杯、洋葱 3 个、菠菜 1/2 杯、水 1/2 杯、油和香料；豆腐腌制，米先沸煮约 8 分钟并沥干，洋葱取出、豆腐煎香，加入酸奶/水后分层铺菠菜、洋葱和米，盖锅蒸焖约 20 分钟。 | 来源是市政府家庭食谱，具名和流程完整但不是电饭煲同锅；需保存“先汆米、后分层蒸”的边界，不能简化成一键焖饭。 |
| 15 | `global-qld-sierra-leone-bulgur` / Sierra Leone Bulgar One-Pot Dish | [Queensland Metro South Health 食谱 PDF](https://www.metrosouth.health.qld.gov.au/__data/assets/pdf_file/0039/476877/healthy-new-communites-complete-cookbook.pdf) | `archive`；bulgur 谷物，普通锅或电饭煲；非米饭 | 6 份；bulgur 1.5 杯、鸡肉约 500 g、番茄膏、蔬菜、水 3 杯；鸡肉先煮/焯，之后用鸡汤与 bulgur 同锅煮，页面写普通锅或电饭煲可用。 | 不是米饭，保留作国际一锅谷物档案；不纳入“菜饭/米饭”主目录，也不借此扩大电饭煲米饭定义。 |

## B. 已有目录的强化来源与去重结果

以下页面是真实具名来源，但对应 canonical 已在 r137 或更早目录中，r138 不重复创建：

| 来源 | 已有 canonical / 处理 | 事实价值与边界 |
|---|---|---|
| 香港衞生署 PDF [菜心瑤柱飯](https://www.chp.gov.hk/files/her/exn_nutp_043b.pdf)，PDF p.3–4 | `hk-choy-sum-scallop-rice` | 4–6 份、菜心 600 g、白米 2 小杯、瑤柱 2 粒；瑤柱浸泡后与浸泡水入电饭煲，菜心半熟后拌入再焗 10 分钟。作为现有条目的补强来源，仍是分阶段流程。 |
| 台湾农业部 [五穀雜糧飯](https://kmweb.moa.gov.tw/subject/subject.php?id=18623) | `taiwan-five-grain-rice` | 各谷物 30–60 g、水 240 cc，浸泡后电锅煮；纯谷物/配菜边界不变。 |
| 台湾农业部 [竹筍炊飯](https://fae.moa.gov.tw/theme_data.php?id=4767&sub_theme=knowledge&theme=topics) | `taiwan-bamboo-shoot-rice` | 竹笋、香菇/虾先处理，再以米和竹笋水同煮；页面没有完整定量，不能覆盖现有条目的缺口。 |
| 台湾农业部/健保相关 [鯛魚毛豆炊飯](https://fae.moa.gov.tw/files/topics/1383/A02_1.pdf) | `taiwan-tilapia-edamame-rice` | 糙米/白米各 40 g、鲷鱼 35 g、毛豆 50 g 等；鱼需先煎，之后同锅入电子锅。 |
| 台湾农业部 [客家創意地瓜飯](https://fae.moa.gov.tw/map/food_item.php?id=169&type=AS07) | `hakka-creative-sweet-potato-rice` | 米 2 杯、热水 2 杯、地瓜/四季豆/鸡腿/杏鲍菇；煮饭后另炒四季豆再拌入，不能隐藏 extra-pan 步骤。 |
| 台湾农业部儿童页面 [小米炊飯](https://kids.moa.gov.tw/theme_data.php?id=250&theme=kids_cooking) | `taiwan-millet-root-vegetable-rice` | 小米、白米、根茎/红枣/枸杞同煮，已有 canonical；营养仍需区分纯谷物版本。 |
| Queensland Health [One Pot Beans and Rice](https://hw.qld.gov.au/healthy-recipes/one-pot-beans-and-rice-recipe/) | `qld-one-pot-beans-rice` | 已在目录；不能因同一公共站点而另建重复条目。 |

## C. 其他边界记录（不作为新米饭 canonical）

1. 香港食物安全中心的“15 种野菜咖喱飯”页面是米饭电饭煲 + 另锅咖喱汁，属于 `extra_pan_or_steam`；不能把咖喱汁所需食材宣称为同一锅完成。
2. 香港 CFS 的 Golden Italian Risotto、EatSmart 的虾仁青豆野米飯均是先煮/半煮米后另锅烩炒；它们可进入未来“熟饭/烩饭”分区，但不应提升当前生米轮替数量。
3. 台东小米飯、红藜飯、薑黃飯是可核查的电锅谷物饭，但缺乏蛋白/蔬菜，作为配菜或谷物档案更诚实；不能用“电饭煲”标签掩盖营养不完整。
4. Melton One-Pot Tofu Biryani 的“one-pot”是分阶段腌制、汆米、煎豆腐、分层蒸焖；其名称可保留，器具边界不能改写。
5. QLD Sierra Leone Bulgar One-Pot Dish 是 bulgur，不是米饭；保留国际一锅谷物研究线，但不应进入米饭轮替池。

## D. 入库前建议（本轮不执行）

优先级按“家庭主餐价值 × 字段完整度 × 与现有目录差异”排序：

1. `hk-startsmart-corn-lean-pork-congee`：唯一一条本轮明确写电饭煲、米/肉/玉米同锅的公共机构粥类；先解决学校批量份数和安全定位。
2. `global-qld-chicken-lentil-rice` 与 `global-illinois-chicken-vegetables-rice`：有米量、液体、主蛋白和分阶段流程；保留普通锅，不推导电饭煲。
3. `tw-fae-japanese-bamboo-rice`：与已有竹笋家族相近，先做 canonical review，核对 PDF 原页和是否重复后再决定是否入库。
4. `hk-cfs-golden-pumpkin-shrimp-risotto`、`global-melton-tofu-biryani`：字段丰富但多锅/分层边界明显，应放在独立家族而非当前电饭煲直达池。
5. `tw-ttdares-millet-rice`、`tw-ttdares-red-quinoa-rice`、`tw-ttdares-turmeric-rice`：可作为谷物/配菜展示，不应以营养完整主餐名义公开。

本轮不改目录状态、不新增 recipe、不调用运行时、不部署；进入主 JSON 前仍需 TDD、来源定位/许可核对、营养与安全合同审查，以及人工决定是否保留“普通锅/熟饭/另锅”分区。

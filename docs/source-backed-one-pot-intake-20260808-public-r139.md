# 一锅出公开来源搜集（r139，intake-only）

日期：2026-08-08

主目录去重基线：`source-backed-one-pot-v1-20260808-global-r137`（916 条）

去重范围：主目录 r137、r138 public intake，以及 r119–r137 的港台、澳门、厂商、区域和 global-public intake。本文件只记录研究结果，不修改主 JSON、CSV、运行时代码、UI、构建产物或部署包。

## 本轮结论

本轮新增核对重点是新加坡卫生部 HealthHub/Health Promotion Board、澳大利亚新州政府和美国 NIH/NHLBI 等公共机构的具名米饭主餐。它们的边界差异很大：

- **1 条普通锅生米同锅主餐**：NIH Jumpin’ Jambalaya；鸡肉、火鸡香肠、蔬菜和糙米在同一锅中分阶段完成。
- **2 条电饭煲/电锅主体但带前置或后置步骤**：HealthHub Nasi Kuning、HealthHub Chicken Briyani。它们真实写了电饭煲，但不能删除先炒、半熟米或后拌步骤。
- **3 条电饭煲米饭/粥且有蛋白或蔬菜**：HealthHub Brown Rice Chicken Congee、HealthHub Brown Chicken Rice、HealthHub Chicken Rice；其中后两条鸡肉另锅处理，不能包装成全程单锅。
- **3 条普通锅/电饭锅边界明确的本地米饭**：HealthHub Bubur Lambuk、Chinese Rice Porridge、Claypot Vegetable Brown Rice；前者有煎蛋另锅，后两者有器具或投料边界。
- **2 条熟饭二次烹**：HealthHub Nasi Ulam Istimewa、NSW 15-minute Chicken and Egg Fried Rice；不能加入生米电饭煲轮替池。
- **1 条公共机构炒饭资料**：VA/Nutrition.gov Pork and Vegetable Fried Rice；使用熟米和炒锅，先进入未来熟饭区。

这些候选都不晋升 `executable`。普通锅、炒锅、另锅、半熟米、熟鸡或烤箱参数不推导成通用电饭煲合同；没有来源写出的克数、液体、时间和安全终点保持缺省。

## A. 新候选（直达来源未在当前目录占用）

| # | intake id / 具名菜 | 直达公共来源 | 分类与器具边界 | 来源实际证明的事实 | 缺口与处理 |
|---:|---|---|---|---|---|
| 1 | `sg-healthhub-nasi-kuning` / Nasi Kuning | [Singapore HealthHub 原页](https://www.healthhub.sg/well-being-and-lifestyle/food-diet-and-nutrition/nasi-kuning)，HTML L185–245 | `extra_pan_or_steam`；先炒米的 non-stick wok，再 rice cooker；后段拌入鱼和蔬菜 | 准备 5 分钟、烹调 30 分钟；白米 180g、糙米 140g、油、姜黄/芫荽、蒜、斑斓叶、低脂淡奶 1/2 杯、水 500ml、罐头吞拿鱼 200g、番茄、青豆等；米先在炒锅与香料炒，转入电饭煲后加液体煮熟，趁热拌入吞拿鱼/番茄/青豆；每份营养蛋白 20.1g、纤维 3g。 | 不是“所有材料一键入锅”：炒锅预处理和后拌是合同的一部分；没有固定份数，蛋白安全和罐头开封后的时序需补。状态 `recipe_fact_checked_candidate`。 |
| 2 | `sg-healthhub-claypot-vegetable-brown-rice` / Claypot Vegetable Brown Rice | [Singapore HealthHub 原页](https://www.healthhub.sg/well-being-and-lifestyle/food-diet-and-nutrition/claypot-vegetable-brown-rice)，HTML L155–199 | `extra_pan_or_steam`；炒锅炒蒜，rice cooker 完成；无肉谷物饭 | 糙米 2 杯、南瓜 200g、胡萝卜 1 根、长豆 3 条、鲜蘑菇 3 个、蒜 1 茶匙、蔬菜高汤 3 杯、油 1 汤匙、素蚝油；蒜先用炒锅炒香，再把食材和调味放电饭煲，加高汤煮熟；HealthHub 说明由 HPB 提供。 | 没有份数、总时间和蛋白质主料；来源称 claypot rice 但写的是 rice cooker，需保留该器具事实，不把“电饭煲”改成砂锅。营养定位偏碳水+纤维，先做配菜/无肉主餐审查。 |
| 3 | `sg-healthhub-nasi-ulam-istimewa` / Nasi Ulam Istimewa | [Singapore HealthHub 原页](https://www.healthhub.sg/well-being-and-lifestyle/food-diet-and-nutrition/nasi-ulam-istimewa)，HTML L156–230 | `cooked_rice_second_cook`；rice cooker 米饭 + 另锅炒 belacan/制作芒果 sambal | 4 份；准备 10 分钟、烹调 20 分钟；糙米 2 杯、水 3 杯、油和盐；米入电饭煲煮熟；香草、长豆和另行制作的芒果参巴含虾酱、辣椒、青芒果、青柠。 | 米饭本体几乎没有蛋白，参巴另锅且不等同米饭主锅；归档到熟饭/地方饭分区，不进入生米直达轮替。 |
| 4 | `sg-healthhub-bubur-lambuk` / Bubur Lambuk | [Singapore HealthHub 原页](https://www.healthhub.sg/programmes/korangok/resources/bubur-lambuk)，HTML L225–286 | `direct_one_pot` + `extra_pan_or_steam`；普通锅煮粥，煎蛋另锅 | 200g 瘦牛肉碎、三色全谷米 200g、水 1500ml、玉米 150g、青豆 150g、椰奶 200g、香料；先炒香料泥和牛肉，加入米/水小火 40 分钟，加入玉米/青豆/椰奶再煮 30 分钟；另锅做鸡蛋薄饼作为配料。 | 粥本体可作为普通锅候选，但煎蛋并非同锅；页面未给总份数和牛肉安全终点，状态 `recipe_fact_checked_candidate`。 |
| 5 | `sg-healthhub-chinese-rice-porridge` / Chinese Rice Porridge | [Singapore HealthHub/Tan Tock Seng Hospital 原页](https://www.healthhub.sg/health-conditions/malnutrition)，HTML L290–336 | `direct_one_pot`；深汤锅/普通锅；临出锅加蛋 | 2 份；白米 1 杯、水 6 杯、鸡蛋 2 个或豆腐 1 块、每份芝麻油 2 茶匙、炸葱 1 汤匙；米水烧开后中火 20–30 分钟，盖锅留缝小火煮至米粒破裂成糊，临出锅加入鸡蛋并拌油/炸葱。 | 页面允许鸡蛋或豆腐两种分支，未给总时长、米态细节和安全终点；仍是清淡粥主餐候选，不推导电饭煲程序。 |
| 6 | `sg-healthhub-brown-rice-chicken-congee` / Brown Rice Chicken Congee | [Health Promotion Board Asian Recipe PDF](https://ch-api.healthhub.sg/api/public/content/6f3ac74473de451faa5ed46fdb084ce5?v=57588ce9)，PDF p.17，L669–700 | `direct_one_pot`；rice cooker/电锅，分阶段投料 | 4 份；糙米 180g、鸡腿/鸡棒 150g、胡萝卜 50g、白菜 50g、鸿喜菇 50g、水 10 杯、姜蒜和葱；米、蒜、姜和水先在电饭煲煮软，加入鸡肉煮 30 分钟，再加入胡萝卜和蘑菇煮 1 小时，最后拌白菜并将鸡肉拆丝回粥，再煮 15–20 分钟；每份蛋白 10.6g、纤维 1.6g。 | 来源给出完整投料时机但未给电饭煲型号、程序或准备时间；禽肉无数值安全终点；保持普通电锅事实，不推广为任意型号的精确程序。 |
| 7 | `sg-healthhub-brown-chicken-rice` / Brown Chicken Rice | [HPB Healthier Meals in Childcare Centres PDF](https://www.healthhub.sg/sites/assets/Assets/PDFs/HPB/Healthier%20Meals%20in%20Childcare%20Centres%20Programme/Brown%20Chicken%20Rice.pdf)，PDF p.1，L0–49 | `extra_pan_or_steam`；炒锅煮鸡汤 + 深锅汆鸡 + rice cooker；儿童批量配方 | 15 名儿童；准备 15 分钟、烹调 30 分钟；米饭部分：糙米 400g、白米 400g、鸡汤 900ml、姜蒜和斑斓叶；鸡肉部分：整鸡 1.4kg、3–4L 水、姜、葱、岩糖；蔬菜 1kg 小白菜。米饭先在锅中炒姜蒜、加鸡汤后转入电饭煲；鸡另锅低火汆 45 分钟，冷水浸泡后切件，与米饭和蔬菜分开供应。 | 不是单锅菜饭，且“烹调 30 分钟”与鸡肉 45 分钟细节存在批量时序差异；不能把鸡肉改写成米面同锅。保留为官方家常鸡饭边界记录。 |
| 8 | `sg-healthhub-chicken-rice` / Chicken Rice | [HealthHub PDF](https://ch-api.healthhub.sg/api/public/content/ff84a64fcba9401fb157e6a6516f7088?v=f30c5a70)，PDF p.1，L0–46 | `extra_pan_or_steam`；鸡另锅煮，米 rice cooker 完成 | 4 份、准备 10 分钟、烹调 50 分钟；鸡胸 500g、水 1500ml、姜；白米 1.5 杯、糙米 1 杯、油、蒜、斑斓叶、鸡肉调味粉；鸡煮约 20 分钟后取出冷水浸泡，取 750ml 鸡汤与调味料入电饭煲煮米，另配叶菜。 | 来源明确说明鸡肉和米分锅，不能归为“电饭煲一锅出”；页面未给禽肉中心温度，叶菜为配菜。可作为新加坡鸡饭档案/熟饭分区来源。 |
| 9 | `sg-healthhub-chicken-briyani` / Chicken Briyani | [HealthHub 官方 PDF](https://ch-api.healthhub.sg/api/public/content/dcd55c4444624855949b0b1cfaa4e86c?v=5eb0cb6f)，PDF p.1–2，L0–55 | `extra_pan_or_steam`；炒锅 + 另锅汆米 + 新锅/电饭煲收尾 | 4 份；准备 40 分钟、烹调 60 分钟；鸡肉腌制后与香料炒，加入酸奶和淡奶煮至约八成熟，取出鸡肉并收浓肉汁；另一锅用水/鸡汤、姜、丁香、小豆蔻把 basmati 米煮至半熟；新锅或电饭煲分层放鸡、肉汁和半熟米，炉上小火约 10 分钟或用 rice cooking mode 收干。 | 关键是“半熟米+分层+鸡肉先煮”的 staged 流程，不能压成生米一锅；页面未列完整香料克重，缺安全温度，先作来源候选。 |
| 10 | `au-nsw-chicken-egg-fried-rice` / 15-minute Chicken and Egg Fried Rice | [NSW Government 原页](https://www.nsw.gov.au/health-and-wellbeing/healthy-living/healthy-eating/healthy-recipes/15-minute-chicken-and-egg-fried-rice)，HTML L105–170 | `cooked_rice_second_cook`；米先另煮，炒锅二次烹 | 4 份、准备 15 分钟；米 1¼ 杯、熟鸡 400g、鸡蛋 2 个、油 4 茶匙、混合蔬菜 2.5 杯、姜和生抽；米先按包装在锅或微波炉煮熟，鸡肉与蛋分别取出/炒熟，蔬菜炒 5 分钟，加入熟米/鸡/葱/酱油，最后回拌炒蛋 2–3 分钟。 | 明确是熟米和熟鸡输入，不能进入生米电饭煲轮替；可作为未来“剩饭/快手炒饭”官方候选。 |
| 11 | `us-nih-jumpin-jambalaya` / Jumpin’ Jambalaya | [NIH/NHLBI 原页与 PDF](https://www.nhlbi.nih.gov/resources/jumpin-jambalaya-recipe)、[PDF](https://www.nhlbi.nih.gov/sites/default/files/publications/Recipe-Jambalaya.pdf)，PDF p.1–2，L50–97 | `direct_one_pot`；普通有盖锅，分阶段同锅 | 9 份、准备 15 分钟、烹调 1 小时 15 分钟；鸡胸肉 1 lb、低脂火鸡 kielbasa 14 oz、芹菜、洋葱、蒜、青葱、青椒、番茄罐头、糙米 1.5 杯、水 4 杯、鸡汤块等；鸡和香肠先煎后取出，蔬菜炒 10 分钟，肉回锅后加糙米/水/调味，沸腾后盖锅小火约 50 分钟；营养每份蛋白 22g、纤维 5g。 | 这是普通锅 Jambalaya，且当前目录已有 Tiger/Illinois/Jambalaya 家族；先做 canonical review，不直接当新轮替条目。鸡肉/香肠安全终点尚需独立合同。 |
| 12 | `us-va-pork-vegetable-fried-rice` / Pork and Vegetable Fried Rice | [美国退伍军人事务部 One-Pot Meals Cookbook（GovInfo PDF）](https://www.govinfo.gov/content/pkg/GOVPUB-VA-PURL-gpo151894/pdf/GOVPUB-VA-PURL-gpo151894.pdf)，PDF p.41，搜索原文定位 | `cooked_rice_second_cook`；炒锅/炒锅，熟糙米输入 | 5 份、准备 20 分钟、烹调 15 分钟；熟糙米 8.8 oz、猪里脊 1/2 lb、鸡蛋 2 个、豌豆荚、芦笋、彩椒、葱蒜姜、低钠酱油和米醋；蛋、猪肉和蔬菜分批炒后加入熟米，最后回拌。 | PDF 页面可直接下载但文本定位需归档复核；熟饭二次烹、不是生米电饭煲；猪肉安全终点不在本页。状态 `archive_candidate`。 |

## B. 去重与边界记录

1. `Easy One-Pot Red Beans & Rice`（UAB）、SDSU、EatRight 和 QLD 豆饭家族已在 r126/r129/r134 或主目录出现，本轮不重复创建；仅将 NIH Jambalaya 标为新的公共机构版本，且要求 canonical review。
2. HealthHub 的 Nasi Kuning、Nasi Ulam、Chicken Rice 与目录中的厂商海南鸡饭/虎牌粥不是同一 URL 或同一器具版本；但它们有“另锅鸡肉”“后拌配料”“先炒再入电饭煲”的边界，入库时必须分别记录，不能合并成一个万能“鸡饭模板”。
3. 熟米或预熟鸡：NSW 炒饭、VA 炒饭、HealthHub Nasi Ulam 和 Brown Chicken Rice/Chicken Rice 都不应被表面“饭”字带入生米直达轮替池。
4. 纯谷物/配菜风险：Claypot Vegetable Brown Rice、Nasi Ulam 的来源缺主蛋白；公开时应标配菜/无肉主餐研究，不得把“米+蔬菜”宣称为营养完整主餐。
5. 普通锅与电饭煲不等价：NHLBI Jambalaya、Bubur Lambuk、Chinese Rice Porridge 只能证明普通锅粥/饭事实；Nasi Kuning、Chicken Briyani、Brown Chicken Congee 等才分别证明电饭煲步骤，且仍保留前置/后置阶段。

## C. 后续建议（本轮不执行）

按“具名识别度 × 事实完整度 × 家庭主餐价值”排序：

1. **优先核对**：HealthHub Nasi Kuning、HealthHub Chicken Briyani、HealthHub Brown Rice Chicken Congee、NHLBI Jumpin’ Jambalaya。它们均有核心食材、液体或程序事实，但需保持 staged 边界并补安全/许可定位。
2. **普通锅主餐**：Bubur Lambuk 和 NIH Jambalaya 可进入普通锅一锅主餐研究线；不应被误标为电饭煲。
3. **归档分区**：Chinese Rice Porridge、NSW Chicken and Egg Fried Rice、VA Pork and Vegetable Fried Rice、Nasi Ulam、Brown Chicken Rice/Chicken Rice 先放熟饭/粥/鸡饭资料分区。
4. **不直接上轮替**：Claypot Vegetable Brown Rice 的营养角色偏配菜；无肉、无份数、无安全合同的谷物饭先保留档案状态。

本 intake 不改目录状态、不新增 recipe、不调用运行时、不部署；任何后续入库必须另写 TDD、做 URL/许可/字段核验并经过现有目录门禁。

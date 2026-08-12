# 厂商官方米饭／粥主餐 intake：r123 国际厂商线

日期：2026-08-08
去重基线：`source-backed-one-pot-v1-20260807-national-r118`（主目录 867 条），并逐条对照 `r119`–`r122` 厂商 intake。
范围：Aroma、Instant Pot、Hamilton Beach、Philips、Tefal、Cuckoo 等厂商的官方食谱页／说明书；本文件只记录研究候选，不修改主 JSON、CSV、运行时代码、UI 或部署产物。
访问方式：已直接打开下列厂商原页或官方 PDF；搜索摘要只用于定位，不能单独支撑入库。
状态：全部 `intake_only`，没有晋升 `executable`，没有厨房验证，也不把厂商配方宣称为地方传统身份。

## 分类和保守口径

- `direct_one_pot`：官方页面明确把生米（或米类）和主要配料放入同一内锅／同一压力锅完成；只证明原厂器具和原程序，不推导普通电饭煲。
- `direct_one_pot_after_prep`：主流程同锅，但页面明确要求先煮豆、腌肉、浸米或其他前处理；前处理不能省略，不能与同名版本拼接。
- `manufacturer_variant`：真实的厂商版本，但目录已有相同菜名／技法家族；作为来源补证或独立机型变体候选，不重复制造新的传统身份。
- `boundary_steam_or_pan`：米在内锅、蛋白／蔬菜在蒸篮或平底锅完成；不进入严格“一锅米饭”轮替。
- `boundary_served_over_rice`：页面明确主菜另锅完成后盖在米饭上；只作为边界资料。
- `grain_or_low_balance`：是真实一锅谷物／粥或配饭，但蛋白、蔬菜不足；必须在营养分层中标明，不能默认为均衡主餐。
- 量、时间、温度或型号缺失时写 `null/待补`；绝不从其他品牌、其他版本推算。

## A. 可优先做来源闭合的同锅候选（15 条）

这些条目在当前 867 条目录和 r119–r122 intake 中未找到同名精确条目；其中带 `manufacturer_variant` 的 Jambalaya 仅是已有通用身份的厂商新证据，不应另造传统菜名。

### 1. One Pot Chicken and Brown Rice Dinner（Instant Pot）

- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/one-pot-chicken-and-brown-rice-dinner)；页面 `Course: Dinner/Main Dishes`、`Yield: 6–8 servings`、`Prep 5 min / Cook 45 min`，技术为 `Pressure Cook, Sauté`。
- 原文事实：橄榄油、洋葱 1 个、胡萝卜 2 根、西芹 2 茎、鸡汤 2½ 杯、未煮糙米 2 杯、百里香、蘑菇 8 oz、去骨鸡肉 2 lb、奶油鸡汤 10 oz。
- 流程：内锅 Sauté 炒蔬菜 3–4 分钟；加鸡汤刮底；米、香草、蘑菇、鸡肉入锅，奶油汤铺顶不搅；Manual 30 分钟，NPR 10 分钟；取出鸡肉切碎再放回。
- 边界／缺口：只证明 Instant Pot Manual/Pressure Cook；鸡肉取出再放回仍属同锅连续流程，安全终点需独立来源；页面称“one-pot weeknight meal”，不是传统地域身份。

### 2. Quick Chicken Steamed Rice（Instant Pot）

- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/quick-chicken-steamed-rice)；`Yield: 6 servings`、总时长 15–30 分钟，Pressure Cook + Sauté。
- 原文事实：鸡胸肉 1 lb（切 1/2 英寸块）、鸡汤 2 杯、长粒白米 1 杯、低钠酱油 1/4 杯、胡萝卜 1/2 杯、西兰花 1 杯、椰子油和葱。
- 流程：鸡肉 Sauté 7 分钟，页面明确要求内部温度至少 165°F；加鸡汤、米、酱油和蔬菜，Pressure Cook 3 分钟，NPR 10 分钟。
- 边界／缺口：页面说明这是“一次完成、类似炒饭但质地更软”的改良，不应标成炒饭身份；鸡肉温度可直接作为安全线索，但仍需本项目安全合同单独引用。

### 3. Easy Chicken and Rice（Instant Pot）

- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/easy-chicken-and-rice)；4 人份，Prep 10 分钟、Cook 25 分钟，6-quart Instant Pot，Pressure Cook。
- 原文事实：去骨鸡肉 1¼ lb、长粒白米 3/4 杯、鸡汤 1⅓ 杯、奶油鸡汤 1 罐、切达奶酪 1/2 杯、西兰花 3 杯。
- 流程：按页面顺序将鸡肉、米、1/4 杯奶酪、鸡汤和奶油汤分层，不搅；High Pressure 6 分钟（约 10 分钟升压）后快速排压；再加入西兰花和剩余奶酪，合盖静置 10 分钟。
- 边界／缺口：西兰花是压力结束后加入，不得写成全程生米同锅；奶油汤和奶酪带乳制品/钠风险；“一锅”只指同一 Instant Pot 内锅。

### 4. Chicken Rice Soup（Instant Pot）

- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/chicken-rice-soup)；4 人份，Prep 10、Cook 20 分钟，页面称 30 分钟内完成。
- 原文事实：去骨鸡胸 1/2 lb、胡萝卜 1 根、西芹 1 茎、长粒白米 1/2 杯、鸡汤 4 杯；页面说明五项主要材料直接入 Instant Pot。
- 流程：鸡、蔬菜、米和鸡汤同锅 High Pressure 5 分钟（约 15 分钟升压），快速排压；取出鸡肉撕碎后放回。
- 边界／缺口：属于汤饭／粥汤类而非干饭；鸡汤品牌和盐度未统一；鸡肉熟制终点仍需独立引用。

### 5. Chicken Satay Rice（Instant Pot）

- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/chicken-satay-rice)；4 人份，总时长 25 分钟，Pressure Cook。
- 原文事实：番茄 1½ 杯、鸡汤 2 杯、花生酱 2 汤匙、鸡胸 1 lb/500g、洋葱、孜然、芫荽籽、巴斯马蒂米 1⅓ 杯、冷冻四季豆 150g；另有花生和香菜装饰。
- 流程：番茄＋鸡汤＋花生酱先调匀；内锅 Sauté 将鸡肉煎至金黄并取出，再炒洋葱与香料；随后按原页加入液体、米和蔬菜完成压力烹调。
- 边界／缺口：含花生，必须列过敏标签；鸡肉先取出再回锅的精确压力时间需从页面后半段逐行归档，不可借其他鸡饭版本补齐；厂商国际菜名不等于东南亚传统证明。

### 6. Chicken Enchilada Rice（Instant Pot）

- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/chicken-enchilada-rice)；4 人份，总时长 60 分钟，Rice Cook + Sauté。
- 原文事实：鸡胸 1½ lb、米 3 杯、鸡汤 1½ 杯、墨西哥辣酱 1 杯、黑豆和玉米各 12 oz、洋葱、蒜、红绿椒、墨西哥调味料、奶酪。
- 流程：内锅 Sauté 炒洋葱蒜约 5 分钟、鸡条 5–7 分钟、彩椒 2–3 分钟；加入米、豆、玉米、辣酱和鸡汤，按页面 Rice Cook/后续压力步骤完成。
- 边界／缺口：页面将 Rice Cook 与 Sauté 同列，具体压力阶段要以原页完整步骤归档；豆、玉米和奶酪形成完整主餐结构，但辣酱/奶酪钠与过敏需单独记录。

### 7. Spanish Chicken and Rice（Instant Pot）

- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/spanish-chicken-and-rice)；6 人份，Prep 7、Cook 30、Total 37 分钟。
- 原文事实：鸡腿 2 lb、kielbasa 香肠 12 oz、转化长粒米 2 杯、鸡汤 3 杯、洋葱蒜、红椒、胡萝卜、豌豆 1/2 杯，可选藏红花。
- 流程：Sauté 香肠约 6 分钟取出；鸡肉分批约 8 分钟取出；炒香洋葱蒜后加米、蔬菜、鸡汤和调味料，肉回锅；High Pressure 7 分钟，排压后加豌豆静置。
- 边界／缺口：肉先取出、最后按页面“鸡肉盖在米饭上”食用，归为 `direct_one_pot_after_prep`；含香肠/鸡肉双重安全与钠风险；不宣称西班牙传统身份。

### 8. Jambalaya with Chicken & Shrimp（Instant Pot，厂商变体）

- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/jambalaya-with-chicken-shrimp)；6 人份，总时长 35 分钟，Instant Pot + Sauté。
- 原文事实：鸡腿 12 oz、糙米 1⅓ 杯、鸡汤 2 杯＋水 1½ 杯、虾 8 oz、洋葱/青椒/西芹、番茄、夏南瓜、Cajun 调味料。
- 流程：页面明确含鸡肉与米的压力段，虾和夏南瓜在压力结束后再加入短煮，避免过熟。
- 去重／边界：主目录已有通用 `Jambalaya`（Tiger）身份，本条只能作为 Instant Pot 机型变体/来源补证，不另建新的地域身份；虾为后加，安全终点不能省略。

### 9. Jambalaya（Instant Pot，Time’s recipe 变体）

- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/jambalaya)；8 人份，Prep 15、Cook 18 分钟；水 2½ 杯、糙米 1¼ 杯、鸡胸 1 lb、andouille 香肠 1½ 杯、虾 1 lb、洋葱/红绿椒/西芹/番茄。
- 流程：香肠、鸡肉等先按页面处理后压力烹；虾和番茄按页面后续阶段加入并短煮。
- 去重／边界：canonical name 与目录 `tiger-jambalaya-rice-cooker` 重合，不能作为新增条目；只保留为 Instant Pot 的独立参数版本，待将来同名版本来源并列时使用。

### 10. 30-Minute Hot and Spicy Jambalaya（Aroma）

- 直达来源：[Aroma 官方原页](https://www.aromaco.com/recipes/30-minute-hot-and-spicy-jambalaya/)；Aroma 20-Cup Digital Rice & Grain Multicooker ARC-150SB；8 人份，Prep/Cook 均标 30 分钟。
- 原文事实：辣熏香肠 1 lb、虾 1 lb、**已煮熟并撕碎的鸡肉** 2 杯、米 3 杯、鸡汤 3½ 杯、青辣椒 1 杯、Creole 调味料 4 汤匙。
- 流程：所有材料同入内锅，选择 WHITE RICE，等待整周期完成。
- 去重／边界：已有 Jambalaya 身份，本条是 Aroma 厂商版；鸡肉不是生肉，不能把“已煮熟”改写成生鸡一锅；机型和 White Rice 程序不可外推。

### 11. Aroma’s Favorite Green Chili Chicken & Rice（Aroma）

- 直达来源：[Aroma SRC-1020 官方说明书 PDF](https://www.aromaco.com/wp-content/uploads/2021/08/SRC-1020_manual.pdf)，食谱页 23–24。
- 原文事实：4 人份；米 4 杯、鸡汤 7 杯、洋葱干、盐、罐装鸡胸 2×10 oz、带汁绿辣椒 2×4 oz。
- 流程：全部放入内锅，选择 Cook/White Rice 类程序，直到完成后搅匀。
- 边界／缺口：蛋白是罐装熟鸡，不是生鸡安全合同；说明书型号为 SRC-1020，米／汤杯制式不可推广到普通电饭煲；需补确切程序名称和完成时间后再闭合。

### 12. Classic Mushroom Pilaf（Aroma）

- 直达来源：[Aroma NRC-687SD-1SG 官方食谱 PDF](https://www.aromaco.com/wp-content/uploads/2021/08/NRC-687SD-1SGRecipe-Book.pdf)，p.29。
- 原文事实：4 人份；巴斯马蒂／长粒米 1 杯、黄油或酥油 2 汤匙、洋葱、蘑菇 5 个、蒜、豆蔻、蔬菜高汤 1⅓ 杯、豌豆 1/2 杯；米需浸泡约 30 分钟。
- 流程：Aroma Sauté-Then-Simmer 先炒洋葱 3–4 分钟、蘑菇 5–6 分钟，再加蒜和米，加入高汤和盐；盖盖 Simmer 15–25 分钟，保温焖 5 分钟。
- 边界／缺口：页面称其为 side dish，蛋白不足；豌豆可同煮或另煮后加入，两个分支必须分开记录；不把它当均衡肉类主餐。

### 13. Sauté-Then-Simmer Risotto（Aroma）

- 直达来源：[Aroma NRC-687SD-1SG 官方食谱 PDF](https://www.aromaco.com/wp-content/uploads/2021/08/NRC-687SD-1SGRecipe-Book.pdf)，p.23（原文行 602–620）。
- 原文事实：4–6 人份；Arborio 米 1 杯、洋葱 1/4 杯、蒜、橄榄油、味美思 1/4 杯、鸡汤 4 杯、奶油 1 杯、黄油 3 汤匙、帕玛森 1/3 杯。
- 流程：Sauté-Then-Simmer 炒葱蒜和米，加入味美思至吸收，再加鸡汤和奶油；自动转 Simmer；保温后开盖拌黄油和奶酪。
- 边界／缺口：鸡汤导致并非素食；开盖后拌入的奶酪需保留为后处理；液体、时长和型号只适用于 Aroma NRC-687SD-1SG。

### 14. Sauté-Then-Simmer Spanish Rice（Aroma）

- 直达来源：[Aroma NRC-687SD-1SG 官方食谱 PDF](https://www.aromaco.com/wp-content/uploads/2021/08/NRC-687SD-1SGRecipe-Book.pdf)，p.24（原文行 629–646）。
- 原文事实：4–6 人份；中／长粒白米 2 杯、橄榄油 2 汤匙、洋葱、黄油 2 汤匙、鸡汤或蔬菜高汤 2½ 杯、番茄膏、牛至、盐。
- 流程：Sauté-Then-Simmer 炒米、油、洋葱约 5 分钟；加入其余材料后自动 Simmer，完成后转保温。
- 边界／缺口：无主要蛋白，营养结构偏碳水；鸡汤/蔬菜高汤两种版本不能混成一条安全/营养合同；不宣称西班牙传统来源。

### 15. Rice Soup (Congee)（Aroma）

- 直达来源：[Aroma NRC-687SD-1SG 官方食谱 PDF](https://www.aromaco.com/wp-content/uploads/2021/08/NRC-687SD-1SGRecipe-Book.pdf)，p.21，食谱标题可见于原文；完整基础配方需继续逐页归档。
- 原文可核字段：Aroma NRC-687SD-1SG 食谱书列有 Rice Soup (Congee)，为 rice cooker 内锅粥／汤类章节；页面允许按口感补水或调味。
- 边界／缺口：本次 PDF 文本抽取将 p.21 的配方数字分散到前后段，无法在本 intake 中可靠重建米量、水量、份数和时间；不得使用其他品牌粥的数字补齐。先列 `archive/intake`，不进入可照做货架。

## B. 其他真实厂商候选和边界记录

### 16. Tex-Mex Rice（Hamilton Beach）

- 直达来源：[Hamilton Beach Digital Simplicity Rice Cooker/Food Steamer 官方手册 PDF](https://useandcares.hamiltonbeach.com/files/840181300.pdf)，p.12。
- 原文事实：6 人份；水 3 杯、长粒白米 3 杯、玉米 4 穗、莎莎 24 oz、墨西哥辣椒 2 个、香菜 1/4 杯、孜然 1/8 茶匙；水与香草辣椒打匀后全部同锅，选 WHITE RICE。
- 边界／缺口：没有主要蛋白，作为素食配饭／轻主餐候选；手册未给具体型号和总分钟数，只能写程序名和 6 份事实；不把莎莎里的豆或肉另行推断。

### 17. Steamed Salmon with Brown Rice（Hamilton Beach）

- 直达来源：同一 [Hamilton Beach 官方手册 PDF](https://useandcares.hamiltonbeach.com/files/840181300.pdf)，p.13。
- 原文事实：两片 3–4 oz 三文鱼；糙米按 Whole Grain 水位线，约 30–35 分钟后将三文鱼放入蒸篮再蒸 8–10 分钟。
- 边界：米在内锅、鱼在蒸篮，属于 `boundary_steam_or_pan`，且米的杯数/液体不是固定数；不能伪装为同锅鱼饭，也不能拿普通水位线推导毫升。

### 18. Steamed Shrimp with Vegetables（Hamilton Beach）

- 直达来源：同一 [Hamilton Beach 官方手册 PDF](https://useandcares.hamiltonbeach.com/files/840181300.pdf)，p.13。
- 原文事实：冻虾 1 lb、荷兰豆 1 杯、甜椒 3/4–1 杯、洋葱 1/2–3/4 杯、菠萝 1 杯、照烧汁 12 oz；白米按水位线，约 15 分钟后放蒸篮，继续约 10 分钟。
- 边界：蒸篮与内锅分层，米量/液体缺失，归 `boundary_steam_or_pan`；虾需海鲜安全终点，不能进入严格一锅米饭轮替。

### 19. Asparagus & Lemon Rice with Peppered Prawns（Tefal TEFAL602）

- 直达来源：[Tefal TEFAL602 官方 8-in-1 Rice Cooker 食谱 PDF](https://www.tefal.com/medias/?context=bWFzdGVyfENTUyBSRUNJUEUgQk9PS3wxNDcxMTM4fGFwcGxpY2F0aW9uL3BkZnxDU1MgUkVDSVBFIEJPT0svaDZkL2g5NC85ODI1ODkyMzAyODc4LnBkZnxiZGUzMzAwMzU1YjdkYTA0OWU0ZTQwNTkxY2VlMDQ1MTFkMWQ3YzM1MmIxODc1MDgzNjcwMjViYWE4NTNhOTUz)，p.5。
- 原文事实：4 人份，准备 10 分钟，Quick Rice 约 24 分钟＋保温/完成约 4 分钟；茉莉米 300g、鸡汤 450ml＋鱼汤 200ml、芦笋 125g、虾 200g、黄油、柠檬和蒜。
- 边界：米与液体在内锅；芦笋在蒸篮；虾需另用平底锅每面约 3 分钟，属于 `boundary_steam_or_pan`，不能写成严格一锅虾饭；鱼汤和虾过敏需单列。目录已有 Tefal 海鲜饭/烩饭，故不重复新增身份。

### 20. Cashew Fruited Rice（Tefal TEFAL602）

- 直达来源：同一 [Tefal TEFAL602 官方食谱 PDF](https://www.tefal.com/medias/?context=bWFzdGVyfENTUyBSRUNJUEUgQk9PS3wxNDcxMTM4fGFwcGxpY2F0aW9uL3BkZnxDU1MgUkVDSVBFIEJPT0svaDZkL2g5NC85ODI1ODkyMzAyODc4LnBkZnxiZGUzMzAwMzU1YjdkYTA0OWU0ZTQwNTkxY2VlMDQ1MTFkMWQ3YzM1MmIxODc1MDgzNjcwMjViYWE4NTNhOTUz)，p.7。
- 原文事实：4 人主餐／6 人配菜；糙米 250g、水 600ml、洋葱、油、姜、肉桂、杏干 100g、蔓越莓 50g、腰果 75g、香菜；米在内锅完成。
- 边界：洋葱需先用平底锅炒，腰果需另烤，归 `direct_one_pot_after_prep`；无主要蛋白且页面同时给“主餐／配菜”两种份数，不能作为均衡主餐默认轮替。

### 21. ข้าวไก่อบธัญพืช（Philips，多谷鸡肉饭）

- 直达来源：[Philips 官方 HD4777/HD4775 食谱 PDF](https://www.documents.philips.com/assets/20210504/2b225944d7cb481abeffad1e01377c70.pdf)，食谱 p.5。
- 原文事实：棕米 2 杯、鸡里脊 200g、波特贝罗蘑菇 100g、胡萝卜 100g、白／红豆各 60g（需浸泡）、豌豆 60g、银杏 60g、油 3 汤匙、蒜、调味汁和水 2¼ 杯；棕米浸泡 20 分钟，Brown 程序约 1 小时。
- 边界：`direct_one_pot_after_prep`；豆类浸泡是必要前处理，机型为 Philips HD4777/HD4775，不能把 Brown 1 小时外推为普通电饭煲时间；蛋白/蔬菜/豆类结构适合后续营养审查。

### 22. โจ๊กข้าวกล้องปลาแซลมอน（Philips 棕米三文鱼粥）

- 直达来源：同一 [Philips 官方 PDF](https://www.documents.philips.com/assets/20210504/2b225944d7cb481abeffad1e01377c70.pdf)，食谱 p.7。
- 原文事实：即食干磨棕米粥 40g、三文鱼 150g、鸡汤 500g，另有酱油／蚝油／糖／芝麻油等；Porridge 程序约 15 分钟，三文鱼随后加入约 5 分钟，另配温泉蛋和香草。
- 边界：使用即食粥米基底，不是生米一锅；三文鱼是中途投料，归 `grain_or_low_balance + mid_cook_addition`；机型和程序只能按 PDF 记载，不可改成普通米饭程序。

### 23. ข้าวไก่อบธัญพืช 的“Tom Yum Quinoa Salmon”相邻条目（Philips）

- 直达来源：同一 [Philips 官方 PDF](https://www.documents.philips.com/assets/20210504/2b225944d7cb481abeffad1e01377c70.pdf)，食谱 p.4。
- 原文事实：藜麦 1 杯、水 1 杯、三文鱼 150g、香茅／南姜／柠檬叶／辣椒酱／鱼露／淡奶和蘑菇；Brown 程序约 40 分钟，温泉蛋出锅后另加。
- 边界：这是藜麦而非米饭；只保留作为“谷物一锅”边界档案，不进入本项目米饭轮替，也不把温泉蛋算入锅内食材。

### 24. 완두콩밥（Cuckoo 豌豆饭）

- 直达来源：[Cuckoo 韩国官方电饭煲说明书 PDF](https://www.cuckoo.co.kr/upload_cuckoo/_bo_rep/manual/rt10_383-574c%20rev.0_%EC%B5%9C%EC%A2%85.pdf)。
- 原文事实：说明书食谱页列出米约 3 杯（约 450g）、豌豆约 1/2 杯（约 75g）与白米程序/水位线。
- 边界／缺口：当前可检索文本未稳定给出型号专用水量、时间和完整营养配方；没有主要蛋白，先标 `grain_or_low_balance`，待 PDF 页码和原图归档后再判断是否入主目录。

### 25. 보리밥（Cuckoo 大麦饭）

- 直达来源：同一 [Cuckoo 官方说明书 PDF](https://www.cuckoo.co.kr/upload_cuckoo/_bo_rep/manual/rt10_383-574c%20rev.0_%EC%B5%9C%EC%A2%85.pdf)。
- 原文事实：食谱页列米约 2 杯（300g）、大麦约 1 杯（150g），按混合谷物／白米程序和水位线烹调。
- 边界／缺口：蛋白／蔬菜不足，且精确水量、时间与型号需从 PDF 图页复核；不把大麦饭宣称为肉菜主餐。

### 26. 오곡밥（Cuckoo 五谷饭）

- 直达来源：同一 [Cuckoo 官方说明书 PDF](https://www.cuckoo.co.kr/upload_cuckoo/_bo_rep/manual/rt10_383-574c%20rev.0_%EC%B5%9C%EC%A2%85.pdf)。
- 原文事实：食谱页列白米、糯米、小米／高粱、红豆等五谷组合，合计约 630g，并指定对应水位线／混合谷物程序。
- 边界／缺口：红豆和杂粮的浸泡与水量对象仍需页图核验；属于谷物配饭，不能默认视为蛋白＋蔬菜均衡主餐；同名来源仅作 Cuckoo 机型档案候选。

## 去重与分流结论

1. 本轮记录 **26 条**：A 组 15 条优先闭合候选，B 组 11 条边界／低平衡／厂商变体。所有候选均为当前目录中未见同名精确条目；但 Jambalaya、Risotto、Paella 等家族已有条目，后续只能以厂商版本或来源补证处理，不得再造“新传统身份”。
2. 目录已有或 r119–r122 已有近名的项目已明确排除：Tefal Seafood Paella、Tefal Chicken & Pea Risotto、Philips Chicken & Chinese Sausage Claypot Rice、Tiger Jambalaya、Instant Pot Tuscan/Coconut/Spinach-Chickpea 等不重复。
3. `direct_one_pot` 只描述原厂器具上的连续流程，不代表能在普通电饭煲复现；Instant Pot 压力锅、Aroma Sauté-Then-Simmer、Philips Brown/Porridge、Cuckoo 水位线必须保留机型边界。
4. 含鸡、猪、虾、三文鱼或罐装肉的条目不能仅凭“煮熟/完成”升为安全合同；后续必须逐条补安全终点、可定位来源和营养身份。含花生、奶油、鱼汤、蚝油、奶酪的条目需追加过敏/钠风险。
5. 16–18、19、22–26 条不应直接放进当前“严格一锅米饭轮替”：它们分别需要蒸篮／平底锅、出锅后拌、即食粥基底或仅有谷物身份。保留它们的价值是划清边界，而不是凑轮替数量。

## 本轮结论与下一步

- **新增 intake：26 条；其中 15 条值得进入后续来源闭合队列，0 条可直接晋升 executable。**
- 下一步优先从 1–7、11–14、21 中各选少量，先复核完整原页／PDF 页码，再建立独立 source_refs、液体/时间/安全合同；不把普通锅或压力锅参数推导成电饭煲参数。
- 本文件不改变 `catalog_version`，不修改主 JSON、CSV、运行时代码、UI、构建产物或部署；不会影响当前轮替页面。

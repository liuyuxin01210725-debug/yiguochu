# 厂商官方米饭／粥主餐 intake：r119

日期：2026-08-08
去重基线：`source-backed-one-pot-v1-20260807-national-r118`（867 条）
范围：仅记录厂商或厂商官方合作页面发现的候选，不修改主目录；状态均为 `intake_only`，不代表已通过合同门禁或厨房验证。

## 记录规则

- `direct_one_pot`：页面把生米／米类与主要配料放入同一内锅完成；若有中途开盖或另锅预处理，单独写明。
- `served_over_rice`：页面只在内锅做配菜，米饭另行准备；不计入当前一锅米饭轮替候选，只作为边界记录。
- `grain_one_pot`：一锅完成燕麦、粥或其他谷物主餐；不把它宣称为米饭。
- 厂商页面只证明该页面所示机型、程序和参数，不外推到普通电饭煲，也不把“ご当地”标签当作传统来源的独立证明。
- 页面给出的缺失量、缺失时间、机型限制和中途投料要求保持缺省，不用其他条目补齐。

## 高证据候选（入库前仍需按 recipe_id／别名／机型版本复核去重）

### 1. 料理家监修·比里亚尼风炊饭（Panasonic）

- 边界：`direct_one_pot`，另需先在碗中腌鸡、浸米、泡藏红花；所有主料随后同入 NF-AC1000/NF-AC700 内锅，完成后焖 15 分钟。
- 直达来源：[Panasonic Cooking 1555](https://panasonic.jp/cooking/recipe/autocooker/1555.html)
- 原文事实：约 55 分钟；2 合；鸡手羽元 350g、白米 300g、番茄 100g、鸡汤/水 280mL，另有酸奶、香料、黄油；步骤含腌制 30 分钟至半日、米浸泡 30 分钟、藏红花热水静置约 10 分钟，完成后不打开盖焖 15 分钟。
- 器具/程序：Panasonic Bistro NF-AC1000 或 NF-AC700，须从 Kitchen Pocket 发送菜单；不能外推普通电饭煲。
- 缺口：原文的“约55分钟”包含前处理边界需在结构化时拆开；配套酸奶酱和装饰不是锅内主料；安全合同需单独核鸡肉终点；目录已有“ビリヤニ风炊饭”近名，可能只保留为 Panasonic 机型变体。

### 2. 埼玉味噌猪丼（Panasonic）

- 边界：`served_over_rice`，肉在内锅完成，米饭和葱另备；不应伪装为一锅米饭。
- 直达来源：[Panasonic Cooking 1545](https://panasonic.jp/cooking/recipe/autocooker/1545.html)
- 原文事实：约 10 分钟；2 人；猪里脊/猪排肉 300g，味噌、酱油、酒、味醂等腌料；内锅无水烹调，完成后盖在两人份米饭上。
- 器具/程序：NF-AC1000/NF-AC700，羽根＋无水/自动菜单；米饭不在该页面锅内完成。
- 缺口：不进入当前一锅米饭候选；若保留作资料条目，须明确为“饭上浇头”。

### 3. 广岛牡蛎柠檬海鲜饭（Panasonic）

- 边界：`direct_one_pot`；牡蛎和虾与生米同锅，出锅取出海鲜拌饭后再摆回。
- 直达来源：[Panasonic Cooking 1525](https://panasonic.jp/cooking/recipe/autocooker/1525.html)
- 原文事实：约 55 分钟；3 合；白米 450g；水 170mL＋温水 300mL（合计 470mL，另含高汤、盐、藏红花），牡蛎 100g＋200g、虾 6 尾、彩椒各半个；米与液体及配料同入内锅。
- 器具/程序：NF-AC1000；Kitchen Pocket 菜单；来源明确是“广岛当地”厂商页面，但不替代传统来源。
- 缺口：海鲜分两批用量与“取出再放回”的顺序需保留；牡蛎/虾安全终点需独立来源。

### 4. 奈良当地茶粥（Panasonic）

- 边界：`direct_one_pot`，米、焙茶和水同锅；成品为茶粥，不宣称完整蛋白主餐。
- 直达来源：[Panasonic Cooking 1504](https://panasonic.jp/cooking/recipe/autocooker/1504.html)
- 原文事实：约 30 分钟；1 次约 4–5 人；白米 75g、焙茶 3–6g、水 1L、盐 5g；米洗净后与茶包、水、盐入内锅。
- 器具/程序：NF-AC1000/NF-AC700；需把茶叶装入茶包；出锅可配腌菜。
- 缺口：仅碳水＋液体，蛋白和膳食纤维不足；不进入“均衡主餐”默认轮替，可作为粥类资料。

### 5. 佐贺当地西西里饭（Panasonic）

- 边界：`served_over_rice`，内锅只做味噌牛肉，米饭和生菜、黄瓜、番茄另备。
- 直达来源：[Panasonic Cooking 1484](https://panasonic.jp/cooking/recipe/autocooker/1484.html)
- 原文事实：约 20 分钟；4 人；牛薄切肉 400g，洋葱 190g，味噌/酱油/酒等；肉在内锅完成后盖到 4 盘米饭上。
- 器具/程序：NF-AC1000/NF-AC700；羽根与自动菜单。
- 缺口：不属于严格一锅米饭；可保留为“米饭浇头/当地名物”边界，不进入一锅轮替。

### 6. 冷冻海鲜西班牙饭风（Panasonic）

- 边界：`direct_one_pot`；冷冻海鲜不解冻直接铺在米上；出锅拌匀。
- 直达来源：[Panasonic Cooking 1472](https://panasonic.jp/cooking/recipe/autocooker/1472.html)
- 原文事实：约 55 分钟；3 合；白米 450g、水 200mL、温水 300mL与高汤/盐/藏红花、冷冻海鲜混合物 200g、洋葱 100g、彩椒、四季豆；同锅完成。
- 器具/程序：NF-AC1000；Kitchen Pocket；只适用于页面所示自动锅。
- 缺口：冷冻海鲜品牌/组成不固定；海鲜安全终点需单独记录；页面将其称为“风”，不代表传统西班牙菜。

### 7. 宫城油麸丼（Panasonic）

- 边界：`served_over_rice` + `mid_cook_addition`；油麸、洋葱、调味液同锅，结束前约 3 分钟开盖加蛋，再盖上加热；米饭另盛。
- 直达来源：[Panasonic Cooking 1467](https://panasonic.jp/cooking/recipe/autocooker/1467.html)
- 原文事实：约 15 分钟；2 人；洋葱 190g、油麸 12 片、だし汁 200mL、鸡蛋 2 个；步骤明确结束前约 3 分钟投蛋。
- 器具/程序：NF-AC1000/NF-AC700；需中途人工操作。
- 缺口：米饭不在内锅内完成；卵凝固程度和安全提示需保留；不进入严格一锅米饭轮替。

### 8. 燕麦芝士烩饭（Panasonic）

- 边界：`grain_one_pot` + `mid_cook_addition`，不是米饭；燕麦、菌菇、培根先锅内煮，约结束前 3 分钟加芝士和豆乳。
- 直达来源：[Panasonic Cooking 1458](https://panasonic.jp/cooking/recipe/autocooker/1458.html)
- 原文事实：约 15 分钟；4 人；燕麦 120g、水 400mL、舞茸/培根，结束前加入高汤粉、芝士 80g、豆乳 200mL。
- 器具/程序：NF-AC1000；中途需开盖并再次 START。
- 缺口：仅作为谷物一锅候选资料；页面允许以熟饭替代燕麦，但那是另一个熟饭二次烹边界，不与生米饭混写。

### 9. 燕麦番茄烩饭（Panasonic）

- 边界：`grain_one_pot`；燕麦、金枪鱼、番茄罐头和水同锅；不能称为米饭。
- 直达来源：[Panasonic Cooking 1459](https://panasonic.jp/cooking/recipe/autocooker/1459.html)
- 原文事实：约 15 分钟；4 人；燕麦 120g、金枪鱼 2 罐（140g）、番茄罐头 400g、水 500mL；调味后同锅加热。
- 器具/程序：NF-AC1000；滚筒/羽根自动菜单。
- 缺口：营养与黏度随燕麦形态变化；页面允许熟饭替代，需分支记录；不进入米饭轮替。

### 10. 海鲜什锦布丁饭式 Pilaf（Panasonic）

- 边界：`direct_one_pot`；生米、冷冻海鲜、冷冻蔬菜、洋葱和液体同锅。
- 直达来源：[Panasonic Cooking 1454](https://panasonic.jp/cooking/recipe/autocooker/1454.html)
- 原文事实：约 55 分钟；3 合；白米 450g、水 600mL、洋葱 150g、海鲜混合物 150g、冷冻蔬菜 150g、黄油 36g、调味粉；入锅顺序为米水后依次加配料。
- 器具/程序：NF-AC1000/NF-AC700；Kitchen Pocket；冷冻食材可直接使用。
- 缺口：页面标题仅为“ピラフ”，不是地域传统名；海鲜安全终点与混合物成分需补。

### 11. 兵库当地章鱼饭（Panasonic）

- 边界：`direct_one_pot`；熟章鱼、米、调味液同锅，完成后拌松。
- 直达来源：[Panasonic Cooking 1436](https://panasonic.jp/cooking/recipe/autocooker/1436.html)
- 原文事实：约 50 分钟；2 合；白米 300g、熟章鱼 200g、姜；水 420mL并加入淡口酱油、酒、味醂和日式高汤粉。
- 器具/程序：NF-AC1000/NF-AC700；Kitchen Pocket；可按页面增减水约 30mL。
- 缺口：章鱼为熟制原料，仍需确认加热充分；当前目录已有同名/近名条目，本条只应作为 Panasonic 机型来源补证，不应重复新增。

### 12. 东京深川饭（Panasonic）

- 边界：`direct_one_pot`；蛤蜊罐头与米、菌菇、油豆腐、液体同锅。
- 直达来源：[Panasonic Cooking 1342](https://panasonic.jp/cooking/recipe/autocooker/1342.html)
- 原文事实：约 50 分钟；2 合；白米 300g，蛤蜊煮汁与水合计 380mL，蛤蜊肉 260g、白葱、舞茸、油豆腐；先分离蛤蜊肉和煮汁再入锅。
- 器具/程序：NF-AC1000/NF-AC700；Kitchen Pocket；出锅加姜和三叶。
- 缺口：页面是厂商“东京当地”适配，不替代传统来源；贝类安全、罐头盐度需补；目录已有“东京ご当地 深川めし”，应作为来源/机型补证而非重复新增。

### 13. 牛丼（Panasonic）

- 边界：`served_over_rice`；牛肉和洋葱在内锅完成，米饭另备。
- 直达来源：[Panasonic Cooking 1244](https://panasonic.jp/cooking/recipe/autocooker/1244.html)
- 原文事实：约 15 分钟；4 人；洋葱 200g、牛腹薄片 400g、だし汁 150mL、酱油/砂糖/味醂/酒；盛在 4 人份米饭上。
- 器具/程序：NF-AC1000/NF-AC700；羽根与自动菜单。
- 缺口：不属于严格一锅米饭；只作“饭上浇头”资料，不能进入同锅轮替。

### 14. 豚丼（Panasonic）

- 边界：`served_over_rice`；页面明确是牛丼的变体，猪肉和洋葱同锅，米饭另备。
- 直达来源：[Panasonic Cooking 1248](https://panasonic.jp/cooking/recipe/autocooker/1248.html)
- 原文事实：约 15 分钟；4 人；洋葱 200g、猪五花薄片 400g、水 100mL、酱油/糖/味醂/蒜；盛到 4 人份米饭上。
- 器具/程序：NF-AC1000/NF-AC700；羽根与自动菜单；官方声明为牛丼改编。
- 缺口：不进入一锅米饭候选；来源没有独立地域身份。

### 15. 照烧鸡丼（Panasonic）

- 边界：`served_over_rice` + `mid_cook_addition`；鸡肉先烹，结束前约 2 分钟开盖加入照烧汁；米饭另备。
- 直达来源：[Panasonic Cooking 1246](https://panasonic.jp/cooking/recipe/autocooker/1246.html)
- 原文事实：约 15 分钟；3 人；鸡腿肉 450g、蜂蜜/酱油/味醂/姜；成品盛在 3 人份米饭上，结束前加入 A 并再次 START。
- 器具/程序：NF-AC1000/NF-AC700；要求中途开盖，页面提醒油飞溅及肉块尺寸。
- 缺口：鸡肉安全终点需要补；不属于严格一锅米饭。

### 16. 蒜香黄油鸡丼（Panasonic）

- 边界：`served_over_rice` + `mid_cook_addition`；鸡肉先锅内煮，结束前约 2 分钟加葱、蒜、酱油、黄油；米饭另备。
- 直达来源：[Panasonic Cooking 1249](https://panasonic.jp/cooking/recipe/autocooker/1249.html)
- 原文事实：约 15 分钟；3 人；鸡腿肉 450g；葱 2 根、蒜、酱油、黄油；盛在 3 人份米饭上。
- 器具/程序：NF-AC1000/NF-AC700；页面说明该条为照烧鸡丼的改编。
- 缺口：不进入严格一锅米饭；鸡肉安全终点需补。

### 17. 赤饭（Panasonic NF-AC1000）

- 边界：`direct_one_pot`，但红豆必须先用小锅预煮；煮汁冷却后与糯米、红豆一同进压力锅。
- 直达来源：[Panasonic Cooking 1243](https://panasonic.jp/cooking/recipe/autocooker/1243.html)
- 原文事实：约 35 分钟（不含小锅预煮）；3 合；小豆/ささげ 50g、糯米 450g、小豆煮汁 450mL、盐；内锅压力烹调。
- 器具/程序：NF-AC1000，需 Kitchen Pocket；页面注明压力烹调、不可保温。
- 缺口：预煮和冷却是必要前处理；豆类营养安全及时间需独立记录；当前目录已有多个赤饭变体，入库前须按版本去重。

### 18. Taco Rice（Panasonic）

- 边界：`served_over_rice`；肉馅在内锅完成后盖在米饭上，生菜、番茄、莎莎另配。
- 直达来源：[Panasonic Cooking 1245](https://panasonic.jp/cooking/recipe/autocooker/1245.html)
- 原文事实：约 15 分钟；4 人；牛猪混合肉 400g、洋葱、番茄酱、伍斯特酱、咖喱粉等；盛到 4 人份米饭上。
- 器具/程序：NF-AC1000/NF-AC700；羽根自动菜单。
- 缺口：不是同锅米饭；只作国际米饭浇头边界，不进入默认轮替。

### 19. Gapao Rice（Panasonic）

- 边界：`served_over_rice` + `mid_cook_addition`；猪肉馅同锅后加入罗勒和鱼露，再盖到米饭上，煎蛋另做。
- 直达来源：[Panasonic Cooking 1247](https://panasonic.jp/cooking/recipe/autocooker/1247.html)
- 原文事实：约 20 分钟；4 人；猪绞肉 400g、洋葱 90g、彩椒 100g；结束后加罗勒 20 片、鱼露；米饭和煎蛋另备。
- 器具/程序：NF-AC1000/NF-AC700；结束后人工拌料。
- 缺口：不属于一锅米饭；鱼露为调味品，不作海鲜主料；不进入米饭轮替。

### 20. 中华粥（Panasonic）

- 边界：`direct_one_pot` 的基础粥；可在完成后加干贝/鸡肉等并延长 5–10 分钟，不能把后加料版本与基础版混写。
- 直达来源：[Panasonic Cooking 1097](https://panasonic.jp/cooking/recipe/autocooker/1097.html)
- 原文事实：约 3 小时；1 次约 4–5 人；白米 115g、水 1600mL、麻油和中式高汤粉；米水先同锅，完成后可加扇贝罐头等并延长 5–10 分钟。
- 器具/程序：NF-AC1000/NF-AC700；需 Kitchen Pocket；页面允许长粒米或日本米。
- 缺口：基础版本蛋白不足；加料版本是明确的后处理分支；不把预约、干货泡发和自制高汤混入基础合同。

### 21. 酒店新大谷监修中式海鲜粥（Panasonic）

- 边界：`direct_one_pot`，但鸡肉必须先煮熟；米、干贝、干虾和汤同锅，出锅再加配料。
- 直达来源：[Panasonic Cooking 1193](https://panasonic.jp/cooking/recipe/autocooker/1193.html)
- 原文事实：约 3 小时；1 次约 4–5 人；米 115g、鸡腿肉 100g、干贝 8g、干虾 15g、水 1600mL；鸡肉预煮后与干货、汤同锅。
- 器具/程序：NF-AC1000；预约时水量改为 1500mL，鸡肉和干货改为完成后加入并延长 5–10 分钟。
- 缺口：前煮鸡肉和预约分支必须分版本；海鲜干货浸泡、鸡肉安全终点需独立来源。

### 22. 咖喱鸡饭风（Khao Man Gai，Panasonic）

- 边界：`direct_one_pot`；米、水、调味料、葱姜与鸡腿同锅，压力烹调；酱汁和装饰另做。
- 直达来源：[Panasonic Cooking 1118](https://panasonic.jp/cooking/recipe/autocooker/1118.html)
- 原文事实：约 40 分钟；4 人；白米 300g、水 360mL、鸡腿肉 400g、葱姜、高汤粉、鱼露；压力中压、混ぜない、8 分钟；米需先浸泡 30 分钟。
- 器具/程序：NF-AC1000；压力调理，不能外推普通电饭煲。
- 缺口：鸡肉安全终点需补；来源为厂商国际菜式，不宣称中国地域传统；成品酱汁和生熟配料需分开记录。

## 去重与分流结论

1. 本轮已直接打开并记录 22 条官方页面；按 r118 目录精确名称/别名检查，完全未收录的候选包括：埼玉味噌猪丼、佐贺西西里饭、宫城油麸丼、燕麦芝士烩饭、燕麦番茄烩饭、冷冻海鲜西班牙饭风、牛丼（Panasonic 版）、豚丼、照烧鸡丼、蒜香黄油鸡丼、Taco Rice、Gapao Rice、中華がゆ、中式海鲜粥，以及若干 Panasonic 机型独立版本。
2. 严格 `direct_one_pot` 且值得后续入主目录复核的优先候选：比里亚尼风炊饭、广岛牡蛎柠檬海鲜饭、冷冻海鲜西班牙饭风、海鲜什锦 Pilaf、兵库章鱼饭、东京深川饭、赤饭、中华粥、中式海鲜粥、Khao Man Gai。
3. `served_over_rice` 条目不能为满足数量进入一锅米饭轮替；它们仅保留为边界资料，避免把“饭上浇头”误称为一锅饭。
4. 本 intake 不修改主 JSON、CSV、运行时代码、UI、Planner，不晋升任何状态；后续若入库，应逐条建立 source_refs 和安全合同，并先去重现有近名机型版本。

## Tiger Corporation USA 补充候选

### 23. Corn Rice（Tiger）

- 边界：`direct_one_pot`；短粒米、玉米、清酒、盐同锅，Plain 程序完成，出锅加黄油。
- 直达来源：[Tiger Corn Rice](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/corn-rice/)
- 原文事实：3–4 份；日本短粒米 2 杯、罐装玉米 8.75oz、料理酒 2 tbsp、盐 1 tsp、黄油 2 tbsp；水加至 Plain 白米 2 杯水位线；煮好后开盖加黄油。
- 器具/程序：Tiger rice cooker，Plain 功能；页面没有具体型号和总烹调分钟数。
- 缺口：蛋白质不足，页面明确可冷/热食用，作为配饭/轻主餐候选；不外推其他品牌水位。

### 24. Cabbage and Mushroom Rice（Tiger）

- 边界：`direct_one_pot`；干香菇先泡出汤，米、香菇、卷心菜、胡萝卜、葱和调味液同锅。
- 直达来源：[Tiger Cabbage and Mushroom Rice](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/cabbage-and-mushroom-rice/)
- 原文事实：短粒米 1 杯、干香菇 5 朵（以 1.5 杯水浸泡）、胡萝卜 1 根、葱、卷心菜 1 杯、蚝油/酱油/植物油；加香菇浸泡水至 Plain 1 杯水位线，Plain 程序。
- 器具/程序：Tiger rice cooker，Plain 功能；页面未给总时间和具体型号。
- 缺口：蛋白质只有调味品来源，营养结构偏 C+F；蚝油过敏标签与香菇泡发时间需记录。

### 25. Jambalaya（Tiger）

- 边界：`direct_one_pot` 主体 + `end_addition`；米、鸡腿、香肠、洋葱和调味料同锅，虾在最后另行短时加入防过熟。
- 直达来源：[Tiger Jambalaya](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/jambalaya/)
- 原文事实：4 份；适用于 5.5 杯锅（10 杯锅配方加倍）；长粒米 3 杯、香肠 1/2 杯、鸡腿 2/3 杯、洋葱 1/2 杯、番茄膏和香料；页面说明虾在最后单独即时烹调。
- 器具/程序：Tiger multicooker/rice cooker；原页明确不是传统电饭锅普通模式的泛化。
- 缺口：页面检索摘要未显示完整总时间与虾的克数，需直接打开 recipe tab 补齐；鸡肉、虾和香肠安全终点必须独立记录；不宣称新奥尔良传统原方。

### 26. Autumn Rice Pilaf with Chicken Mushroom Green Bean Casserole（Tiger）

- 边界：`direct_one_pot` 或同步烹调需进一步核页；候选名显示米饭、鸡肉、菌菇和四季豆组合，属于主餐方向。
- 直达来源：[Tiger rice-cooker recipe index](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/)
- 原文事实：官方索引把该条标为 Rice Cooker / Main Dish / Synchro Cooking；未在索引摘要中给出固定批量、液体或步骤。
- 器具/程序：Tiger，可能涉及 Synchro Cooking；必须打开具体详情页后再判断是同锅还是 Tacook/另锅。
- 缺口：当前只有索引证据，不进入主目录；需要详情页 URL、配方量、液体、总时间与器具边界。

### 27. Asparagus and Mushroom Risotto（Tiger）

- 边界：`grain_one_pot` 候选；官方索引标为 Rice Cooker / Main Dish / Slow Cook，但可能是电饭锅慢炖而非生米炊饭。
- 直达来源：[Tiger rice-cooker recipe index](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/)
- 原文事实：官方索引列出名称与 Slow Cook 标签，未在索引摘要中给批量、液体、步骤。
- 器具/程序：Tiger multicooker Slow Cook；需详情页确认是否米、熟饭或其他谷物。
- 缺口：详情页和固定合同未打开前只作研究线索，不进入主目录；不把 risotto 直接归入中国菜饭。

### 28. Rice Cooker Tofu Red Curry（Tiger，边界记录）

- 边界：`non_rice_one_pot`；豆腐、红咖喱、蔬菜高汤和椰奶同锅慢炖，但不含米饭。
- 直达来源：[Tiger Rice Cooker Tofu Red Curry](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/rice-cooker-tofu-red-curry/)
- 原文事实：3–4 份；备料 15 分钟、烹调 45 分钟；蔬菜油、蒜、红咖喱酱、蔬菜高汤、鱼露、糖、笋、彩椒、硬豆腐、椰奶；同锅 Slow Cook。
- 器具/程序：Tiger multifunctional rice cooker，Slow Cook。
- 缺口：没有米，严格排除出一锅米饭池；保留用于证明“电饭锅一锅主餐”边界，不得伪装成菜饭。

# 厂商官方米饭／粥主餐 intake · r132

**研究日期**：2026-08-08
**去重基线**：主目录 `source-backed-one-pot-v1-20260808-global-r131`，902 条；并逐 URL 对照 r119–r131 厂商 intake。
**本文件性质**：独立研究 intake，仅记录官方原页已打开的事实和边界；不修改主 JSON、CSV、运行时代码、UI、构建产物或部署状态，不晋升 `recipe_fact_checked` / `executable`。

## 口径与去重

- `direct_one_pot`：官方明确把生米（或粥米）与主要配料在同一内锅完成主要烹调。
- `direct_one_pot + staged_topping`：米饭在内锅完成，少量已熟或预处理配料在出锅时拌入；不能描述成“所有食材一次投放”。
- `staged/extra_pan`：米饭在电饭煲、主要蛋白或配菜在平底锅／微波炉／其他锅完成；这是厂商的真实流程，但不是纯一锅直投。
- `cooked_rice_second_cook`：以熟饭为起点再炒、拌或浇汁；不进入当前生米菜饭轮替，可作为未来熟饭品类素材。
- 厂商页面只证明其页面写明的机型、程序、水位、数量和步骤；不把厂商改编配方宣称为原产地传统菜，也不把 Zojirushi 机型参数外推为普通电饭煲参数。
- URL 与当前 r131 主目录均未发现精确重复；同一页面不同份量规格只记录一条，避免厂商变体膨胀。

## 已逐页打开、可进入后续事实矩阵的条目

### 1. Rice and Beans with Bacon and Collard Greens

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/rice-and-beans-with-bacon-and-collard-greens)
- **页面字段**：2–3 份和 4–6 份两档；前者长粒白米 1 杯、低钠鸡汤 8 oz、泡过夜的混合干豆 1/4 杯、熟培根 1 条、红葱头 1/2 Tbsp、百里香、月桂叶；出锅另拌番茄 1/2 杯、熟羽衣甘蓝 1/4 杯（可用菠菜）。大份量为米 2 杯、鸡汤 16 oz、豆 1/2 杯、熟培根 2 条、番茄 1 杯、叶菜 1/2 杯。
- **流程**：米、鸡汤、香料、红葱头入内锅；月桂叶、泡好的豆和已熟培根放在米上且低于液面；`MIXED` 程序完成后弃月桂叶，再拌番茄和熟叶菜。
- **边界**：`direct_one_pot + staged_topping`。米、豆和培根在内锅，但豆需过夜浸泡、培根先熟；叶菜和番茄不在锅内煮。页面为 Zojirushi 指定机型，不能外推普通锅水位。
- **营养/安全缺口**：有碳水、豆类蛋白和叶菜；干豆预处理时长、培根/熟豆安全边界和叶菜加热条件仍需项目独立核验。候选状态 `intake_only`。

### 2. Halal Style Chicken and Rice

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/halal-style-chicken-and-rice)
- **页面字段**：4 份。鸡腿肉 2 lb；茉莉米 2 杯；水至 `JASMINE` 水位 2 或 2.5 杯；腌料含柠檬汁、牛至、蒜、橄榄油等；另有黄油、鸡汤块、姜黄、孜然、酸奶蛋黄酱酱汁、生菜和番茄。
- **流程**：鸡腿腌至少 30 分钟；米以 `JASMINE` 或 `WHITE RICE` 程序煮；鸡腿在大平底锅煎约 4 分钟后翻面再煮约 6 分钟，切块后再次连腌汁加热；米出锅后在另一个大锅以黄油、姜黄、孜然和鸡汤块拌匀，鸡肉最后盖在米上。
- **边界**：`staged/extra_pan`，不是电饭煲一锅饭；原页只证明 Zojirushi 指定型号的米水和程序，鸡肉依赖平底锅。可作为“饭+另锅蛋白”档案，不可包装成单锅菜饭。
- **安全缺口**：页面只写鸡肉 cooked through，项目需另引禽肉安全终点；腌汁与熟鸡接触的二次加热需保留原步骤。

### 3. Italian Sausage and Peppers Over Tomato Rice

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/italian-sausage-and-peppers-over-tomato-rice)
- **页面字段**：2–3 份和 4–6 份两档。小份长粒白米 1 杯、番茄汁 5 oz、水 3 oz、盐；另锅甜意式香肠 1/2 lb、洋葱、红/黄/青椒、橄榄油、牛至、红酒醋，可选凤尾鱼和欧芹。大份按米 2 杯、番茄汁 10 oz、水 6 oz、香肠 1 lb 等比例给出。
- **流程**：米加番茄汁和水，以 `MIXED` 程序煮；香肠在炒锅煎上色后取出切段；同锅炒洋葱和甜椒约 10 分钟，加入调味及香肠；米熟后拌欧芹，最后把香肠甜椒浇在米上。
- **边界**：`staged/extra_pan`；米锅和炒锅是两个连续部分，不能将香肠、甜椒写入电饭煲内锅。页面为 Zojirushi 指定型号，水量与 `MIXED` 程序不外推。
- **营养/安全缺口**：蛋白来自香肠，蔬菜来自甜椒；加工肉安全与钠含量未由页面完整说明。可进入厂商适配档案，不作为纯一锅轮替候选。

### 4. Portabella Mushroom Rice with Beef and Broccoli

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/portabella-mushroom-rice-with-beef-and-broccoli)
- **页面字段**：2–3 份：茉莉米 1.5 杯、牛肉汤 12 oz、酱油 1/2 Tbsp、蒜、黑胡椒、蘑菇 1/2 杯；另有薄切牛肉 1/3 lb、酱油、油和预熟西兰花 1.5 杯。4–6 份为米 3 杯、牛肉汤 24 oz、牛肉 3/4 lb、西兰花 3 杯等。
- **流程**：米、汤、酱油、蒜和蘑菇在内锅，以 `MIXED` 程序煮；牛肉另腌后在重炒锅约 1 分钟煎熟；西兰花在微波炉约 40 秒加热；米熟后把牛肉和西兰花折入米中。
- **边界**：`staged/extra_pan`；牛肉与西兰花都不在米锅中生熟同煮，西兰花先熟、牛肉另锅；页面机型边界必须保留。不可改写为牛里脊直接投入的电饭煲菜谱。
- **安全缺口**：牛肉熟度/中心温度页面未给，西兰花微波加热也需保持原始流程；后续只能补项目独立安全说明。

### 5. Jasmine Rice with Tofu, Broccoli and Edamame

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/jasmine-rice-with-tofu-broccoli-and-i-edamame-i-)
- **页面字段**：4 份。茉莉米 2 杯，水至 `JASMINE` 水位 2 或 2.5 杯，盐；另有硬豆腐 12 oz、熟西兰花 1 杯、熟毛豆 1/2 杯、小番茄 1 杯、酱油 4 Tbsp、米醋 2 tsp。
- **流程**：米按 `JASMINE` 或 `WHITE RICE` 煮；豆腐在酱油/米醋中腌；西兰花和毛豆在微波炉加热；米出锅并冷却到不烫后，与蔬菜、番茄、酱汁和豆腐拌匀。
- **边界**：`cooked_rice_second_cook` / 冷拌组合，不是生米一锅菜饭。豆腐、蔬菜和毛豆没有进入米锅，不能用作“豆腐饭一锅出”证据。
- **营养/安全缺口**：有豆制品、毛豆、蔬菜，但米饭先冷却再拌的食品安全过程需另行注明；只作为未来熟饭/便当品类素材。

### 6. Tuna Seafood Pilaf

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/tuna-seafood-pilaf)
- **页面字段**：4 份。罐装金枪鱼 10 oz、黄油 3 Tbsp、洋葱 1/2 个、沙拉虾 8 oz、蘑菇 8 个、彩椒 1/4 杯、**熟米饭 3 杯**、盐、胡椒和欧芹。
- **流程**：大炒锅融化黄油炒洋葱 2 分钟；加虾、金枪鱼、蘑菇和彩椒约 1 分钟；加入熟米饭再炒 1 分钟，拌欧芹后关火。
- **边界**：`cooked_rice_second_cook`，从熟饭开始，完全依赖炒锅，不是电饭煲生米主餐。不要把该页面标题的 “pilaf” 当作米锅程序。
- **安全缺口**：虾为 salad-style shrimp、金枪鱼为罐装；具体开封/冷藏和海鲜过敏边界仍需项目安全页。未来可纳入“剩饭轮替”而不是当前生米池。

### 7. Jambalaya

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/jambalaya)
- **页面字段**：5/10 杯机型 4–6 份：长粒米 3 杯、低钠鸡汤 8 oz、番茄 4 oz、洋葱、盐、百里香、辣椒碎；另锅虾 8 oz、烟熏香肠 6 oz、橄榄油和蒜。3 杯机型 2–3 份：米 1.5 杯、鸡汤 4 oz、番茄 2 oz、虾 4 oz、香肠 3 oz 等。
- **流程**：米、鸡汤、调味、番茄和洋葱以 `MIXED` 程序煮；米锅倒计时开始时，虾和香肠在炒锅中与油蒜炒熟；米完成后倒入炒锅与虾、香肠拌匀。
- **边界**：`staged/extra_pan`；原页明确分别处理海鲜和香肠，且按 3/5/10 杯机型分档。不能把炒锅步骤省略成生虾直接入普通电饭煲。
- **安全缺口**：虾和加工肉安全终点未在页面给出；不晋升 executable。

### 8. Asparagus Rice with Seared Scallops

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/asparagus-rice-with-seared-scallops)
- **页面字段**：4–6 份。长粒米 1 杯，水至 `LONG GRAIN WHITE` 水位 1 或 1.25 杯；芦笋 12 oz、黄油 2 Tbsp、蒜、葱、盐；大扇贝 1/2 lb、油 2 tsp。芦笋焯水需 2 qt 水及冰水。
- **流程**：米以 `LONG GRAIN WHITE` 或 `MIXED` 煮；芦笋分段焯水、冰镇后与黄油打成泥，芦笋尖单独留作装饰；扇贝在 6–8 英寸炒锅中煎；米熟后拌芦笋泥，最后放扇贝和芦笋尖。
- **边界**：`staged/extra_pan`；焯水、搅拌机和炒锅均为额外器具，不能叫一锅直达。Zojirushi 米水水位只适用于指定机型。
- **安全缺口**：扇贝熟制终点未给；芦笋焯水和冰镇流程需原样保留。

### 9. Eastern Mediterranean Vegetables and Brown Rice

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/eastern-mediterranean-vegetables-and-brown-rice)
- **页面字段**：2–3 份和 4–6 份。小份短粒糙米 1.5 杯、蔬菜高汤 12 oz、蒜、芹菜籽、盐，水至 `BROWN RICE` 水位 1.5；另有熟菠菜、熟洋蓟、油浸番茄、烤开心果、橄榄油、红酒醋、欧芹和 ricotta salata。大份按米 3 杯、汤 24 oz 等比例。
- **流程**：糙米和高汤按 `BROWN` 程序煮；菠菜、洋蓟、番茄、开心果在微波炉加热；另混合油醋和奶酪，米熟后拌入蔬菜和调味。
- **边界**：`staged/extra_pan` / `cooked_topping`，没有独立主要蛋白，页面称可作 meal 或 side；不进入主餐轮替，不把奶酪当成肉类蛋白。

### 10. Gumbo Bowl

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/gumbo-bowl)
- **页面字段**：4 份。烟熏 Andouille 香肠 8 oz、虾 12 oz、秋葵、洋葱、西芹、青椒、蒜、面粉、油、Creole 调味、伍斯特酱、虾/鸡汤 4 杯；**熟长粒米 4 杯**。
- **流程**：香肠先在炒锅煎；另锅以油和面粉制 roux，再炒蔬菜和秋葵，加入高汤煮 30 分钟，最后加入虾约 4 分钟；每碗盛 1 杯熟饭后浇 gumbo。
- **边界**：`cooked_rice_second_cook` / `extra_pan`；米饭不是该页面炊煮对象，属于熟饭浇汁组合，不进入当前生米菜饭轮替。
- **安全缺口**：虾终点和熟饭保温/复热条件需独立说明；页面不证明电饭煲适配。

## 其他已从官方索引定位、但本轮不展开字段的新增 URL

以下 URL 均未在 r131 主目录中发现精确匹配，先保留为待逐页核验，不把标题当作完整做法：

- [Beef Katsu-Don](https://www.zojirushi.com/app/recipe/beef-katsu-don-beef-cutlet-bowl)：预计熟饭浇汁/另锅炸制，先标 `staged`。
- [Classic Katsu-Don](https://www.zojirushi.com/app/recipe/classic-katsu-don-pork-cutlet-bowl)：同上，先标 `staged`，不得作为米锅方案。
- [Loco Moco](https://www.zojirushi.com/app/recipe/loco-moco)：预计米饭与汉堡排、蛋另锅，待核。
- [Chicken Vindaloo](https://www.zojirushi.com/app/recipe/chicken-vindaloo-indian-chicken-curry)：需核对是否同锅米饭，避免把配饭当菜饭。
- [Taco Rice Bowl](https://www.zojirushi.com/app/recipe/taco-rice-bowl)：需核对熟饭与肉酱是否分锅，先标 `staged`。
- [Shiitake-Gohan](https://www.zojirushi.com/app/recipe/-i-shiitake-gohan-i-i-shiitake-i-mushroom-rice-)：具名炊饭候选，需逐页核对米量、液体和机型；避免与目录已有香菇炊饭近重复。
- [Takikomi-Gohan](https://www.zojirushi.com/app/recipe/-i-takikomi-gohan-i-mixed-rice-)：具名混合饭候选，需逐页核对是否已被其他来源以同一机型收录。
- [Jasmine Rice with Tofu, Broccoli and Edamame](https://www.zojirushi.com/app/recipe/jasmine-rice-with-tofu-broccoli-and-i-edamame-i-)：本轮已打开，列入上表 cooked-rice 边界，不作为新 direct 候选。
- [Salsa Verde Style Brown Rice](https://www.zojirushi.com/app/recipe/salsa-verde-style-brown-rice)：本轮已打开，主要为熟菠菜酱拌糙米且缺主要蛋白，列为边界，不进入主餐池。

## 本轮结论

- 共逐页打开并记录 10 条；其中 1 条为 `direct_one_pot + staged_topping`（Rice and Beans with Bacon and Collard Greens），其余为 `staged/extra_pan` 或 `cooked_rice_second_cook`。
- 这批新增页面的价值主要是**补齐真实器具边界**，而不是制造更多可轮替的一锅饭：Zojirushi 官方食谱大量采用“电饭煲煮饭 + 炒锅蛋白/熟菜”的结构，不能偷改为一锅。
- 未逐页候选仅作线索，不进入主 JSON；如下一轮要入库，先分别核查 URL 是否被其他来源同名菜覆盖，再补 `quantity/liquid/process/appliance/time/safety` 范围。
- 当前工作区只增加本 intake 文档；`git diff --check` 应作为提交前唯一检查，不进行主目录版本 bump。

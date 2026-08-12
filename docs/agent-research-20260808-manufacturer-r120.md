# 厂商官方米饭／粥主餐 intake：r120

日期：2026-08-08
去重基线：`source-backed-one-pot-v1-20260807-national-r118`（867 条）
范围：仅记录可直接打开的厂商官方页面；本文件是 intake，不修改主目录，不代表合同闭合、厨房验证或可直接轮替。

## 记录边界

- `direct_one_pot`：官方页面明确把生米（或米类）与主料放入同一内锅完成；若必须另锅预处理、开盖投料或出锅拌入，均单独标出。
- `cooked_rice_second_cook`：米饭先在电饭煲完成，随后用平底锅、烤箱或其他器具处理；不伪装成电饭煲一锅饭。
- `served_over_rice`：米饭与主菜分开完成，最后盖饭；不进入严格一锅米饭轮替。
- `post_cook_mix`：米饭完成后才加入海藻、蔬菜、香料等；需保留投料时机，不能把它写成生米同锅。
- 厂商页面只证明该页面所示的配方、程序和器具范围，不证明地方传统身份，也不能把厂商机型参数外推到普通电饭煲。
- 本轮逐条和主目录的 `recipe_id`、`canonical_name`、别名做了精确去重；已有近名条目不重复新增，必要时只作为“来源补证候选”。

## 可进入后续合同复核的候选

### 1. Sweet Rice Cooked with Adzuki Beans（Zojirushi）

- 边界：`direct_one_pot_after_prep`；糯米和煮豆汤、红豆最后同入内锅，但红豆必须先在小锅煮软，不能省略前处理。
- 直达来源：[Zojirushi Sweet Rice Cooked with Adzuki Beans](https://www.zojirushi.com/app/recipe/sweet-rice-cooked-with-adzuki-beans)
- 原文事实：4–5 份；糯米 3 杯（rice measuring cup）、红豆 1.5 oz、水、盐芝麻；红豆先加 2 杯水煮 2 分钟，再加 3 杯水煮约 20 分钟至可压碎，保留煮汁；米浸泡/沥水至少 30 分钟；内锅加煮汁并补水到 “SWEET RICE” 水位 3，放红豆，选 “SWEET”。
- 器具边界：页面只证明 Zojirushi 带 “SWEET” 档且有对应水位线的机型；不外推普通电饭煲。
- 缺口：与目录已有赤饭/甘纳豆赤饭存在同身份风险，若入库应作为 Zojirushi 厂商版本或来源补证，不另造地域身份；前处理耗时和豆类安全需单列。

### 2. Green Tea Rice（Zojirushi）

- 边界：`post_cook_mix`，不是完整蛋白主餐；米饭在内锅煮，茶叶、盐、糖、芝麻在出锅后拌入。
- 直达来源：[Zojirushi Green Tea Rice](https://www.zojirushi.com/app/recipe/green-tea-rice)
- 原文事实：4 份；短/中粒白米或糙米 2 杯；水到 “WHITE RICE” 或 “BROWN RICE” 水位 2；另用绿茶叶 1 Tbsp、冷水 1.5 杯浸泡约 1 小时后过滤，盐 1/2 tsp、糖 1/2 tsp、烤芝麻 1 Tbsp；米煮好后拌入过滤后的茶叶和调味料。
- 器具边界：白米可用 “HARDER/REGULAR/WHITE RICE”，糙米用 “BROWN”；水位随机型刻度，不得换算为通用毫升值。
- 缺口：营养结构偏碳水＋少量种子，不应进入均衡主餐默认轮替；可作为“茶香米饭”资料条目。

### 3. Halal Style Chicken and Rice（Zojirushi）

- 边界：`served_over_rice`；米饭在电饭煲完成，鸡腿需另用平底锅煎熟，酱汁和生菜番茄另做，最后盖在米饭上。
- 直达来源：[Zojirushi Halal Style Chicken and Rice](https://www.zojirushi.com/app/recipe/halal-style-chicken-and-rice)
- 原文事实：4 份；茉莉白米 2 杯，水到 “JASMINE” 水位 2 或 2.5 杯，盐/黑胡椒；鸡腿约 2 lb，先腌至少 30 分钟至 4 小时，再平底锅一面约 4 分钟、翻面约 6 分钟至熟；另有酸奶蛋黄酱、番茄、生菜。
- 器具边界：米饭用 Zojirushi “JASMINE/WHITE RICE” 档；鸡肉明确是另锅加热，不能标 direct_one_pot。
- 缺口：不进入一锅米饭轮替；可保留为“米饭主餐但非一锅”对照案例，鸡肉终点需引用独立安全来源。

### 4. Rice with Sausage, Onion, Ketchup and Sunny-Side-Up Egg（Zojirushi）

- 边界：`cooked_rice_second_cook`；米先煮熟，冷却后与香肠、洋葱、冷冻蔬菜在炒锅中炒拌，另煎太阳蛋。
- 直达来源：[Zojirushi Rice with Sausage, Onion, Ketchup and Sunny-Side-Up Egg](https://www.zojirushi.com/app/recipe/rice-with-sausage-onion-ketchup-and-sunny-side-up-egg)
- 原文事实：4–6 份；白米或糙米 3 杯，水到对应水位；另用油 2 Tbsp、洋葱 1 杯、鸡汤 1/2 杯、香肠 10 oz、冷冻蔬菜 1 杯、番茄酱 1/4 杯、鸡蛋 4–6 个；米煮好后用冷水冲凉并静置约 20 分钟，炒锅炒洋葱和香肠，加入鸡汤/伍斯特酱/番茄酱，再拌米和蔬菜，最后另锅煎蛋。
- 器具边界：电饭煲只负责米饭；炒锅和煎锅是必需器具。
- 缺口：不进入严格一锅饭；若未来开启“熟饭二次烹”品类，可作为具名条目候选。

### 5. Artichoke Mixed Brown Rice（Zojirushi）

- 边界：`cooked_rice_second_cook`；糙米先在电饭煲煮，洋葱与洋蓟在炒锅炒后拌入。
- 直达来源：[Zojirushi Artichoke Mixed Brown Rice](https://www.zojirushi.com/app/recipe/artichoke-mixed-brown-rice)
- 原文事实：4–6 份；糙米 2 杯，水到 “BROWN RICE” 水位 2 或 3 杯；另用橄榄油 2 Tbsp、洋葱半个、洋蓟罐头 2×14 oz、盐、胡椒、柠檬皮和莳萝；若用剩饭可跳过电饭煲步骤；米将熟时炒洋葱约 5 分钟、洋蓟再炒约 3 分钟，拌入米饭加热。
- 器具边界：电饭煲＋炒锅；不是同锅主料。
- 缺口：页面明确允许剩饭分支，须与生米版分开记录；不进入当前生米一锅轮替。

### 6. Japanese Style Curry Doria（Zojirushi）

- 边界：`cooked_rice_second_cook` + `another_appliance`；熟米先经炒锅加黄油，再入 9×13 英寸烤盘，浇白酱和咖喱，烤箱 400°F 约 15 分钟。
- 直达来源：[Zojirushi Japanese Style Curry Doria](https://www.zojirushi.com/app/recipe/japanese-style-curry-doria)
- 原文事实：4 份；熟米 3 杯、黄油 2 Tbsp、盐 1/4 tsp；白酱用黄油 4 Tbsp、面粉 4 Tbsp、牛奶 2 杯、鸡汤粉等；咖喱 1.5–2 杯，马苏里拉 1 杯；米先在炒锅炒 1 分钟，白酱另锅煮约 1 分钟，烤盘烤至奶酪融化、咖喱冒泡。
- 器具边界：炒锅＋酱锅＋烤箱＋烤盘，不能称为电饭煲一锅。
- 缺口：属于熟饭二次烹/焗饭候选；不进入当前轮替。

### 7. Portabella Mushroom Rice with Beef and Broccoli（Zojirushi）

- 边界：`served_over_rice`；米和蘑菇在内锅，牛肉需另锅煎，西兰花预先煮熟，最后盖在米饭上。
- 直达来源：[Zojirushi Portabella Mushroom Rice with Beef and Broccoli](https://www.zojirushi.com/app/recipe/portabella-mushroom-rice-with-beef-and-broccoli)
- 原文事实：2–3 份或 4–6 份；小份 1.5 杯茉莉米、牛肉汤 12 oz、酱油 1/2 Tbsp、蒜、黑胡椒、婴儿波特贝罗蘑菇 1/2 杯；牛肉 1/3 lb 另腌后煎，西兰花 1.5 杯预煮；大份按页面加倍（3 杯米、24 oz 汤、3/4 lb 牛肉、3 杯西兰花）。
- 器具边界：电饭煲煮米/蘑菇，煎锅煎牛肉，微波或预煮西兰花；不外推同锅。
- 缺口：牛肉熟度与西兰花预煮终点需独立记录；只能作为“饭上组合”边界。

### 8. Chili Cheese Rice and Hot Dogs（Zojirushi）

- 边界：`served_over_rice`；米饭用牛肉汤在电饭煲煮，辣豆酱、洋葱、热狗和奶酪均另锅/另步骤完成。
- 直达来源：[Zojirushi Chili Cheese Rice and Hot Dogs](https://www.zojirushi.com/app/recipe/chili-cheese-rice-and-hot-dogs)
- 原文事实：2–3 份或 4–6 份；小份 1 杯长粒米、牛肉汤 4 oz＋水 4 oz；另用辣豆酱 1/2 杯、红腰豆 1/2 杯、洋葱、热狗 2–3 根、切达奶酪；米选 “MIXED”，辣豆酱和豆另锅小火约 10 分钟，洋葱另炒，热狗按喜好煮/微波/烤，最后装盘组合。
- 器具边界：至少电饭煲＋酱锅＋洋葱锅/热狗器具；不能作为一锅主餐。
- 缺口：热狗和奶酪钠含量及安全提示需独立评估；资料价值高于轮替价值。

### 9. Italian Sausage and Peppers Over Tomato Rice（Zojirushi）

- 边界：`served_over_rice`；米饭用番茄汁在电饭煲煮，香肠和甜椒在炒锅另做，最后盖饭。
- 直达来源：[Zojirushi Italian Sausage and Peppers Over Tomato Rice](https://www.zojirushi.com/app/recipe/italian-sausage-and-peppers-over-tomato-rice)
- 原文事实：2–3 份或 4–6 份；小份 1 杯长粒米、番茄汁 5 oz、水 3 oz、盐；另用香肠 1/2 lb、洋葱、红/黄/绿甜椒、橄榄油、牛至、红酒醋，凤尾鱼和欧芹可选；大份为 2 杯米、番茄汁 10 oz、水 6 oz、香肠 1 lb。页面标题明确 “Over Tomato Rice”。
- 器具边界：电饭煲＋炒锅，米饭与主料不同锅。
- 缺口：香肠/凤尾鱼是高盐或过敏风险项；不进入严格一锅饭。

### 10. Puttanesca Rice Salad（Zojirushi）

- 边界：`cooked_rice_second_cook`；米先煮熟并冷却约 30 分钟，再拌番茄、酸豆、凤尾鱼、橄榄、叶菜和油醋汁。
- 直达来源：[Zojirushi Puttanesca Rice Salad](https://www.zojirushi.com/app/recipe/puttanesca-rice-salad)
- 原文事实：4–6 份；长粒米 1 杯，水到 “LONG GRAIN WHITE” 水位 1 或 1.25 杯；冷却后拌日晒番茄、酸豆、凤尾鱼、黑/绿橄榄、菠菜/芝麻菜、橄榄油，临吃前加柠檬汁；页面另要求冷藏 20–30 分钟。
- 器具边界：电饭煲只煮米，后续为冷拌；不属于热的一锅主餐。
- 缺口：凤尾鱼/酸豆过敏与钠风险需单列；只作为熟饭二次烹/沙拉资料。

### 11. Wakame-Gohan（Seaweed Mixed Rice）（Zojirushi）

- 边界：`post_cook_mix`；米饭先煮好，裙带菜、味醂、芝麻油、芝麻和细香葱在出锅后拌入，再焖 5 分钟。
- 直达来源：[Zojirushi Wakame-Gohan](https://www.zojirushi.com/app/recipe/-i-wakame-gohan-i-seaweed-mixed-rice--i-wakame-gohan-i-seaweed-mixed-rice-1)
- 原文事实：2 份；短/中粒白米 1 杯，水到 “WHITE RICE” 水位 1；裙带菜干品 2 Tbsp、盐 1/2 tsp、味醂 2 tsp、细香葱 1 Tbsp、芝麻油 1 tsp、芝麻 2 tsp；米完成后拌入全部材料并合盖静置 5 分钟。
- 器具边界：页面只证明 Zojirushi “WHITE RICE” 水位/程序；配料不在生米阶段同煮。
- 缺口：蛋白不足，不作为均衡主餐默认轮替；页面 URL 当前可能出现站内 404，需保留搜索结果和浏览器原文存证后再入库。

### 12. Rice Croquette（Zojirushi）

- 边界：`cooked_rice_second_cook` + `deep_fry`；米饭先煮，另锅做味噌牛肉馅，混合后冷冻成形，再裹粉油炸。
- 直达来源：[Zojirushi Rice Croquette](https://www.zojirushi.com/app/recipe/rice-croquette)
- 原文事实：约 40 个饭团/10 份；米 3 杯，水到 “WHITE RICE/BROWN RICE” 水位；另有牛肉馅 1/2 lb、洋葱、味噌/味醂/清酒/酱油/糖、面粉、面包糠、鸡蛋 5 个及炸油；页面要求冷冻过夜后再快速油炸。
- 器具边界：电饭煲＋炒锅＋冷冻＋油炸，明显不是一锅米饭。
- 缺口：属于点心/聚会食物，明确排除当前主餐轮替；仅作边界档案。

### 13. Sushi Rice（Zojirushi）

- 边界：`plain_rice_archive` + `post_cook_mix`；电饭煲只煮白米，米醋/糖/盐在出锅后拌匀并扇凉。
- 直达来源：[Zojirushi Sushi Rice](https://www.zojirushi.com/app/recipe/sushi-rice)
- 原文事实：4–6 份；短/中粒白米 3 杯，水到 “SUSHI RICE” 水位 3；另用米醋 4 Tbsp、糖 3 Tbsp、盐 1 tsp；米煮好后移到浅盘，趁热拌醋液并扇至体温。
- 器具边界：页面只证明 Zojirushi Sushi 档和水位线；不含主料，不作为主餐。
- 缺口：纯基础米饭档案，不进入轮替。

### 14. Baked Rice Casserole with Artichokes and Mushrooms（Zojirushi）

- 边界：`cooked_rice_second_cook` + `another_appliance`；米在电饭煲煮，蘑菇和洋蓟在炒锅煎，之后与蘑菇汤、帕玛森奶酪组合并入烤箱。
- 直达来源：[Zojirushi Baked Rice Casserole with Artichokes and Mushrooms](https://www.zojirushi.com/app/recipe/baked-rice-casserole-with-artichokes-and-mushrooms)
- 原文事实：3–4 份或 6–8 份；小份米 1.5 杯、水到长粒白米水位 1.5 或 1.75 杯；大份米 3 杯、水到水位 3 或 3.75 杯；另用蘑菇、洋蓟、蘑菇汤、伍斯特酱、帕玛森和欧芹；步骤包含炒锅煎香、烤箱预热 425°F 和烘烤。
- 器具边界：电饭煲＋炒锅＋烤箱；不进入一锅饭轮替。
- 缺口：仅作为“熟饭焗饭”候选，不能把烤箱参数外推成电饭煲流程。

## 本轮明确排除或仅作来源补证

- `New Orleans Style Red Beans and Rice`、`Pad Thai Shrimp Mixed Rice`、`Rice and Beans with Bacon and Collard Greens`、`Jambalaya`：主目录已有同名条目，本轮不重复。
- `Takikomi-Gohan`、`Shiitake-Gohan`、`Paella`、`Chesapeake Crab Carrot Rice`：主目录已有同名/同身份条目，本轮不重复；厂商页可作为后续来源补证，但不新增身份。
- `Keihan`：主目录已有鹿儿岛“鶏飯”身份，厂商页不另造一条；且原页需多锅煮鸡、煮香菇、做蛋皮并以汤浇饭，属于 `served_over_rice`。
- `Buddha Bowl`、`Teriyaki Chicken Bowl`、`Portabella Mushroom Rice with Beef and Broccoli`：米饭与主料分开处理，统一标 `served_over_rice`，不能为了增加轮替数量冒充 direct_one_pot；`Halal Style Chicken and Rice` 已列为第 3 条候选，但同样只可作非一锅边界资料。
- `Sushi Rice`、`Green Tea Rice`、`Wakame-Gohan`：主料不足或出锅后拌入，只作基础米饭/后拌资料；不进入均衡主餐默认轮替。

## 入库建议

本 intake 共记录 **14 条当前主目录未以同名收录的官方候选/边界条目**；其中没有一条可在不做身份与合同审查的情况下直接晋升。下一步优先复核 `Sweet Rice Cooked with Adzuki Beans`（厂商赤饭版本）以及 `Wakame-Gohan`（先确认 URL 可复核）；其余条目按边界分类留档，等待“熟饭二次烹/饭上组合”是否成为独立产品品类后再决策。

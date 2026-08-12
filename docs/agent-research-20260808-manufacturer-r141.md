# 厂商官方米饭／粥主餐 intake · r141

**研究日期**：2026-08-08
**去重基线**：主目录 `source-backed-one-pot-v1-20260808-global-r140`（920 条）；同时逐名对照 `r138`、`r139` 厂商 intake 和 `r140` 批次文档。本文所有链接均为厂商或厂商所属官方站点，并在本轮通过浏览器直接打开核对。
**文件性质**：独立研究 intake；不修改主 JSON、CSV、运行时代码、UI、构建产物或部署状态；不晋升 `recipe_fact_checked` / `executable`。

## 判定口径

- `direct_one_pot`：生米（或生粥米）与主要食材在同一电饭煲内锅完成主要烹调；厂商写明的型号、水位和程序原样保留。
- `direct_one_pot + staged_topping`：主体在内锅完成，少量浸泡、出锅拌入或最后加料仍是原方的一部分，不能把它改写成“所有食材一次投放”。
- `staged/extra_pan`：米饭和主要蛋白／配菜在不同锅、平底锅、微波炉或搅拌机完成；记录真实边界，不进入当前严格直投轮替。
- `cooked_rice_second_cook`：以熟米饭为起点再炒、拌或浇汁；属于未来熟饭品类，不冒充生米菜饭。
- 厂商页面只证明页面实际写明的数量、液体、程序、机型和步骤；不把厂商配方宣称为原产地传统菜，也不把专用水位外推到普通电饭煲。

## 本轮新增强候选（4 条，建议保留为 `intake_only`）

这些页面在 r140 主目录、r138–r140 intake 中均未发现精确 URL 或同名记录。它们是真实具名米饭／粥页面，但其中几条营养结构不完整，故不把“有米”误说成完整主餐。

### 1. Yellow Curry Rice（Panasonic Australia）

- **官方原页**：<https://www.panasonic.com/au/consumer/household/kitchen-appliances/article/recipe-top-page/yellow-curry-rice.html>
- **官方范围**：Panasonic SR-HL151KST 1.5 L 感应电饭煲；页面分类为 Dinner / Rice Cooker；页面作者为 `@Not_A_Chef_Diary`，不宣称地方传统身份。
- **可核对字段**：2 杯 basmati 或 long-grain 米；3 杯水；5 汤匙橄榄油；洋葱、蒜、咖喱粉、盐；1 杯冷冻豌豆／胡萝卜／玉米；2 块鸡汤块。页面写明淘洗米，内锅先炒香料，再将米炒 3–4 分钟，加入蔬菜和 3 杯水，选择 long-grain 程序，出锅松饭。
- **边界**：`direct_one_pot`（原页的主流程在同一内锅）；页面另写“搭配已煮熟的蛋白质食用”，基础配方没有肉、蛋、豆类等独立蛋白。
- **缺口**：份数、总时长、内锅容量以外的兼容机型未给；不建立安全终点或普通电饭煲换算。营养边界明确标记为“米＋蔬菜，蛋白质需另配”，不能渲染为完整均衡套餐。

### 2. Pumpkin and Mushroom Risotto（Panasonic Australia）

- **官方原页**：<https://www.panasonic.com/au/consumer/household/kitchen-appliances/article/recipe-top-page/pumpkin-mushroom-risotto.html>
- **官方范围**：Panasonic Rice Cooker 页面；原页未给具体型号，不外推到其他机型。
- **可核对字段**：切碎韭葱 2 杯、丁切 butternut pumpkin 2 杯、切片蘑菇 1 杯、Arborio 米 2 杯、蔬菜高汤 4 杯、少量白葡萄酒、黄油 20 g；烹后拌入帕玛森 1 杯和 feta 1 杯。
- **流程**：除奶酪外按页面顺序放入内锅，选择 porridge 程序；完成后拌入两种奶酪并以细香葱装饰。
- **边界**：`direct_one_pot + staged_topping`；主体米、南瓜、蘑菇同锅，奶酪是出锅后加入。无肉／鱼／豆类蛋白，营养边界为“碳水＋蔬菜＋乳制品”，不标成完整蛋白主餐。
- **缺口**：份数、总时长、型号、水位线、安全终点未给；保留 `null`，不从别的 risotto 版本拼接。

### 3. Rice Cooker Mushroom Risotto（Panasonic Australia）

- **官方原页**：<https://www.panasonic.com/au/consumer/household/kitchen-appliances/article/recipe-top-page/rice-cooker-mushroom-risotto.html>
- **官方范围**：Panasonic CN188WST Rice Cooker；型号和程序边界只适用于页面所述设备。
- **可核对字段**：Arborio 米 0.5 杯、蔬菜高汤 1.5 杯、蘑菇 1 杯、洋葱 0.5 个、蒜 1 瓣、新鲜百里香 3 枝、橄榄油 1 汤匙、帕玛森 1 汤匙（另有装饰用奶酪和欧芹）。
- **流程**：内锅加热油，蘑菇／洋葱／蒜／百里香炒 2–3 分钟；加米炒约 1 分钟；加入高汤后关盖约 25 分钟；保温后拌帕玛森。页面另写一部分蘑菇需平底锅煎作装饰。
- **边界**：`direct_one_pot + staged_topping/extra_pan`；主体是一锅米饭，但装饰蘑菇使用额外平底锅，不能删掉这一边界。无主要蛋白，标记为素食 risotto。
- **缺口**：份数、正式程序名、最终安全终点未给；不把 25 分钟外推成所有电饭煲通用时间。

### 4. Vegan Mushroom Congee（Panasonic Australia）

- **官方原页**：<https://www.panasonic.com/au/consumer/household/kitchen-appliances/article/recipe-top-page/vegan-mushroom-congee.html>
- **官方范围**：Panasonic SR-HL151KST 感应电饭煲；作者 Chef Shellie Froidevaux；页面分类为 Vegan / Dinner / Rice Cooker。
- **可核对字段**：茉莉米 1 个量杯、干香菇 6 朵、姜约 5 cm、蒜 1 瓣、盐 1 茶匙；香菇以沸水浸泡 30 分钟，保留浸泡水；浸泡水加清水到 congee 刻度 “1”；选择 congee/soup 约 50 分钟，配菜另作上桌调味。
- **边界**：`direct_one_pot + staged_soak`；米、香菇、姜、蒜在内锅煮，香菇先浸泡是原方必要步骤。无肉、蛋、豆类蛋白，不能宣称均衡主餐。
- **缺口**：份数、普通电饭煲替代刻度、营养和安全终点未给；不把“50 分钟”外推到非该机型设备。

## 新发现但属于边界的官方页面（2 条，不进严格直投轮替）

### 5. はもごはん（Tiger Japan）

- **官方原页**：<https://www.tiger-corporation.com/en/jpn/feature/recipe/post17/>
- **页面事实**：6 份；约 60 分钟；生米 3 杯；烤鱧（海鳗）150 g；姜 5 g；高汤 600 mL；酱油、清酒、盐；出锅配紫苏／三叶／芝麻。页面列出 Tiger 多个 `JRT/JPH/JRX` 系列机型和 `炊込み`／白米程序选项。
- **流程与边界**：洗米后将调味和高汤加到白米 3 刻度，鱼和姜放在米面同锅炊煮，出锅再拌香草；可视作 `direct_one_pot + staged_topping`。鱼类安全终点未由本页提供，且专用刻度不能外推普通电饭煲。
- **状态建议**：`intake_only`；海鲜过敏和鱼类熟制合同尚未闭合，不晋升。

### 6. ひつまぶし風うな玉ごはん（Tiger Japan）

- **官方原页**：<https://www.tiger-corporation.com/en/jpn/feature/recipe/post18/>
- **页面事实**：4 份；约 60 分钟；米 3 杯；鳗鱼蒲烧 2 条；鸡蛋 2 个；鳗鱼酱；高汤 800 mL（用于茶泡饭式浇汁）；Tiger 炊込み／白米程序。
- **流程与边界**：米先按白米刻度煮；完成后加入蛋液焖约 30 秒，再加入鳗鱼焖约 2 分钟；高汤作为后续浇汁食用。属于 `direct_one_pot + post_cook_precooked_protein`，鳗鱼是预熟产品，不能改写成生鱼同锅，也不能省略出锅后加料和另备高汤。
- **状态建议**：`intake_only`；加工鳗鱼标签、鸡蛋终点和高汤边界需要另行闭合，不晋升。

## 已核查但明确排除的页面（防止重复和边界漂移）

以下为本轮打开或复核的官方页，因与严格“生米＋主料同锅”不符，只作为未来品类／排除证据，不计入强候选：

| 官方页面 | 排除原因 |
|---|---|
| [Zojirushi Asparagus Rice with Seared Scallops](https://www.zojirushi.com/app/recipe/asparagus-rice-with-seared-scallops) | 米在内锅；芦笋需另行焯、扇贝需平底锅煎；`staged/extra_pan`，且无单锅蛋白安全终点。 |
| [Zojirushi Chili Cheese Rice and Hot Dogs](https://www.zojirushi.com/app/recipe/chili-cheese-rice-and-hot-dogs) | 米、辣椒豆、洋葱、热狗分别处理，属于 `staged/extra_pan`；同页已在 r139 intake 留档，本轮不重复计入。 |
| [Zojirushi Japanese Dry Curry](https://www.zojirushi.com/app/recipe/japanese-dry-curry) | 米饭与咖喱分锅，`served-over-rice`，不是内锅菜饭。 |
| [Zojirushi Salmon Chazuke](https://www.zojirushi.com/app/recipe/salmon-i-chazuke-i-green-tea-rice-soup-) | 使用熟米饭、另烤三文鱼、另备热茶，`cooked_rice_second_cook`。 |
| [Zojirushi Taco Rice Bowl](https://www.zojirushi.com/app/recipe/taco-rice-bowl) | 4 杯熟饭配另锅炒牛肉和冷配菜，属于熟饭二次组合。 |
| [Zojirushi Vegetable Chuka-Don](https://www.zojirushi.com/app/recipe/vegetable-chuka-don) | 熟饭浇另锅蔬菜芡汁，无主要蛋白。 |
| [Tiger Tomato Curry](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/tomato-curry/) | 页面主体是 slow-cook 咖喱；配料表未列生米，正文另处又出现加米描述，存在范围矛盾，不能据此建立米饭合同。 |
| [Tiger Rice Cooker Sinigang](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/rice-cooker-sinigang-filipino-sour-soup/) | 主体是汤，明确配米饭食用；米不是内锅烹调对象。 |
| [Panasonic One Pot Butter Chicken](https://www.panasonic.com/au/consumer/household/kitchen-appliances/article/recipe-top-page/one-pot-butter-chicken.html) | 一锅完成的是鸡肉咖喱，配料和步骤无米，配 naan；不是米饭主餐。 |
| [Tiger 麦とろごはん](https://www.tiger-corporation.com/en/jpn/feature/recipe/post20/) | 熟麦饭加生鱼／山药浇头，需另行腌制、擦泥，`cooked_rice_second_cook/staged_topping`。 |

## r141 收口结论

- 本轮记录 **6 条新增官方页面**：4 条直接同锅候选、2 条明确有边界的 Tiger 日本菜；另列 9 条排除页用于防止把分锅／熟饭／非米饭方案误收为一锅菜饭。
- 6 条全部保持 `intake_only`，不写入主目录；其中 4 条 Panasonic 候选缺份数、时长或蛋白结构，2 条 Tiger 候选缺项目独立安全合同。缺口不补猜，不把厂商型号参数外推普通电饭煲。
- **本轮没有可直接晋升的条目**。如后续需要增加主目录，应先按来源矩阵拆分 identity／ingredients／process／quantity／liquid／time／safety，再由人工审查决定是否写入 `recipe_fact_checked`。
- 本轮未修改主 JSON、运行时代码、UI、CSV、生成 artifacts 或部署；只新增本 intake 文档。

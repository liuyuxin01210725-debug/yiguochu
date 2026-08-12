# 厂商官方米饭／粥主餐 intake · r138

**研究日期**：2026-08-08
**去重基线**：主目录 `source-backed-one-pot-v1-20260808-global-r137`（916 条）；并逐 URL 对照 r134–r137 厂商 intake。
**本文件性质**：独立研究 intake，仅记录已通过浏览器直接打开的官方原页事实和边界；不修改主 JSON、CSV、运行时代码、UI、构建产物或部署状态，不晋升 `recipe_fact_checked` / `executable`。

## 口径与去重

- `direct_one_pot`：官方明确把生米（或粥米）和主要配料在同一内锅完成主要烹调。
- `direct_one_pot + staged_topping`：主料在内锅完成，少量已熟或出锅后配料再拌入；不能描述成“所有食材一次投放”。
- `staged/extra_pan`：米饭在电饭煲，主要蛋白／配菜在平底锅、微波炉或另一只锅完成；这是厂商的真实流程，但不是纯一锅直投。
- `cooked_rice_second_cook`：以熟米饭为起点再炒、拌或浇汁；不进入当前生米菜饭轮替，可作为未来熟饭品类素材。
- 厂商页面只证明其写明的型号、程序、水位、数量和步骤；不把厂商改编配方宣称为原产地传统菜，也不把 Zojirushi 的水位外推到普通电饭煲。
- 同一页面的大小份量只记一条，不把不同型号／份量拼成新的版本。以下 URL 在当前 r137 主目录中未发现精确 URL 重复；最终 canonical 名称仍需进入主目录前再核对别名。

## 已逐页打开、可进入后续事实矩阵的候选

### 1. Tofu Jasmine Fragrant Rice

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/tofu-jasmine-fragrant-rice)
- **已见字段**：4–6 份；茉莉米 3 rice cups；水至 `JASMINE` level 3 或 3¾ rice cups；盐 1 tsp。另有硬豆腐 1 lb（切块）、无麸质酱油 ¼ cup、香菜 ¾ cup、烤无盐花生 ¾ cup，可选青柠。
- **流程事实**：先煮米；米煮时把豆腐在酱油中腌；米完成后把豆腐、酱油、香菜和花生折拌入米饭。
- **边界**：`direct_one_pot + staged_topping`（豆腐需另行腌制，配料出锅后拌入，未在米锅中同煮）。只证明 Zojirushi `JASMINE` 水位，不证明普通电饭煲参数。
- **缺口**：腌制时长、豆腐是否需要进一步加热、食品安全终点页面未给；状态 `intake_only`，不进当前直投轮替。

### 2. Italian Sausage and Peppers Over Tomato Rice

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/italian-sausage-and-peppers-over-tomato-rice)
- **已见字段**：2–3 份：长粒白米 1 cup、番茄汁 5 oz、水 3 oz、盐 ¼ tsp；另锅甜意式香肠 ½ lb、洋葱、红／黄／青椒、油、牛至、红酒醋，可选凤尾鱼和欧芹。4–6 份：米 2 cups、番茄汁 10 oz、水 6 oz、香肠 1 lb 等。
- **流程事实**：米加番茄汁和水，以 `MIXED` 程序煮；香肠在炒锅煎上色后切段，同锅炒洋葱和甜椒约 10 分钟，再将香肠甜椒浇在米上。
- **边界**：`staged/extra_pan`；页面明确是“over tomato rice”，不能把香肠、甜椒改写成电饭煲内锅一次投放。
- **缺口**：加工肉安全／钠信息未闭合；机型与 `MIXED` 水位限制保留，状态 `intake_only`。

### 3. Portabella Mushroom Rice with Beef and Broccoli

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/portabella-mushroom-rice-with-beef-and-broccoli)
- **已见字段**：2–3 份：茉莉米 1½ cups、牛肉汤 12 oz、酱油 ½ Tbsp、蒜 ½ 瓣、胡椒、baby portabella ½ cup；另有薄切牛肉 ⅓ lb、酱油、橄榄油、胡椒和预熟西兰花 1½ cups。4–6 份：米 3 cups、汤 24 oz、牛肉 ¾ lb、西兰花 3 cups 等。
- **流程事实**：米、汤、调味和蘑菇在 `MIXED` 内锅煮；牛肉在重炒锅煎熟；西兰花微波加热；米熟后折拌牛肉和西兰花。
- **边界**：`staged/extra_pan` + 微波；不可写成“牛肉和西兰花生投进电饭煲”。
- **缺口**：牛肉中心温度及西兰花保温条件未给，状态 `intake_only`。

### 4. Summer Curry with Brown Rice

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/summer-curry-with-brown-rice)
- **已见字段**：4–6 份；短／中粒糙米 2 cups，水至 `BROWN` level 2；另锅黄油、洋葱、蒜、姜、绞猪肉 ½ lb、西葫芦、甜椒、土豆、玉米淀粉、蔬菜汤 2×14 oz、月桂叶、番茄酱、伍斯特酱、牛奶、苹果、豌豆等。
- **流程事实**：糙米在 `BROWN` 程序煮；咖喱在平底锅／锅中炒香后加汤炖约 20 分钟，再煮约 5 分钟，最后浇在米饭上。
- **边界**：`staged/extra_pan`／served-over-rice；不是一锅电饭煲菜饭。土豆与糙米的器具、水位不外推。
- **缺口**：咖喱锅的最终温度与猪肉安全终点页面未给，状态 `intake_only`。

### 5. Thai Green Chicken Curry

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/thai-green-chicken-curry)
- **已见字段**：4–6 份；茉莉米 2 cups，水至 `JASMINE` level 2 或 2½ cups；咖喱另有鸡胸 1 lb、椰奶 14 oz、鸡汤 1 cup、茄子、竹笋、鱼露、糖、香草和绿咖喱酱。
- **流程事实**：米饭单独煮；咖喱酱在锅中处理，加入椰奶／高汤，鸡肉在酱汁中小火煮约 10 分钟，完成后与米饭一起食用。
- **边界**：`staged/extra_pan`／served-over-rice；鱼露不是鱼肉，不能把该页面变成海鲜菜；只证明指定 Zojirushi 米饭程序。
- **缺口**：鸡肉安全终点和咖喱酱加工温度未给，状态 `intake_only`。

### 6. Halal Style Chicken and Rice

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/halal-style-chicken-and-rice)
- **已见字段**：4 份；鸡腿肉 2 lb；茉莉米 2 cups；水至 `JASMINE` level 2 或 2½ cups；鸡肉腌料含柠檬汁、牛至、蒜、油等；另有黄油、鸡汤块、姜黄、孜然及酸奶酱汁、生菜、番茄。
- **流程事实**：鸡腿腌至少 30 分钟；米用 `JASMINE` 或 `WHITE RICE`；鸡腿在大平底锅煎约 4 分钟、翻面再约 6 分钟，切块后连腌汁再次加热；米出锅后另锅拌香料，最后盖上鸡肉。
- **边界**：`staged/extra_pan`；不属于电饭煲一锅饭，不能省略鸡肉另锅步骤。
- **缺口**：页面仅写 cooked through，项目独立禽肉安全终点未接入；状态 `intake_only`。

### 7. Jambalaya

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/jambalaya)
- **已见字段**：5／10 cup 机型 4–6 份：长粒米 3 cups、低钠鸡汤 8 oz、番茄 4 oz、洋葱、盐、百里香、辣椒碎；另锅虾 8 oz、烟熏香肠 6 oz、油和蒜。3 cup 机型 2–3 份按半量。
- **流程事实**：米、鸡汤、调味、番茄和洋葱用 `MIXED` 煮；米锅倒计时开始时，虾和香肠在炒锅与油蒜炒熟；米完成后与虾、香肠拌匀。
- **边界**：`staged/extra_pan`；海鲜和香肠明确另锅，不能改成生虾直接入普通电饭煲。
- **缺口**：虾及加工肉安全终点未给，状态 `intake_only`。

### 8. Tuna Seafood Pilaf

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/tuna-seafood-pilaf)
- **已见字段**：4 份；罐装金枪鱼 10 oz、黄油 3 Tbsp、洋葱 ½ 个、沙拉虾 8 oz、蘑菇 8 个、彩椒 ¼ cup、熟米饭 3 cups、盐、胡椒、欧芹。
- **流程事实**：炒锅融化黄油炒洋葱约 2 分钟；加入虾、金枪鱼、蘑菇和彩椒约 1 分钟；加入熟米饭再炒约 1 分钟，拌欧芹后关火。
- **边界**：`cooked_rice_second_cook`；从熟饭开始且全程炒锅，不是生米电饭煲主餐。
- **缺口**：罐装鱼虾开封／冷藏与过敏边界未给；仅作为未来熟饭品类素材。

### 9. Rice with Sausage, Onion, Ketchup and Sunny-Side-Up Egg

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/rice-with-sausage-onion-ketchup-and-sunny-side-up-egg)
- **已见字段**：4–6 份；白米或糙米 3 cups，水至对应水位 3；另有油、洋葱、鸡汤 ½ cup、盐、伍斯特酱、甜香肠 10 oz、冷冻杂蔬 1 cup、番茄酱 ¼ cup、鸡蛋 4–6 个。
- **流程事实**：米先煮好后冷却／冲洗；炒锅炒洋葱、香肠、酱汁、熟饭和杂蔬；另一只锅煎太阳蛋，最后盖在饭上。
- **边界**：`cooked_rice_second_cook`／extra_pan；不能当作生米一锅投料。
- **缺口**：鸡蛋熟度、安全终点和冷却时间未给，状态 `intake_only`。

### 10. Chicken Vindaloo

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/chicken-vindaloo-indian-chicken-curry)
- **已见字段**：4–6 份；米锅 2 cups basmati、3 cups 水；另有鸡腿肉 1½ lb、醋／香料腌料、酥油、芥末籽、洋葱、土豆、番茄、咖喱酱及额外 ½ cup 水。
- **流程事实**：鸡肉先腌；米饭单独煮；咖喱酱和蔬菜在锅中炒／炖约 30 分钟，鸡肉在咖喱中熟制，最后将咖喱浇在米上。
- **边界**：`staged/extra_pan`／served-over-rice；不是一锅电饭煲做法。
- **缺口**：鸡肉终点仅以 cooked through 表述，状态 `intake_only`。

### 11. Japanese Beef Curry

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/japanese-beef-curry)
- **已见字段**：4–6 份；白米 2 cups，水至白米水位 2；另有牛肉 12 oz、洋葱、胡萝卜、4 cups 高汤、番茄膏、调味料、土豆及黄油／面粉／咖喱粉制成的咖喱 roux。
- **流程事实**：米单独煮；牛肉、蔬菜和汤在另一锅炖煮，另锅完成 roux，最后咖喱浇在米上。
- **边界**：`staged/extra_pan`／served-over-rice；页面的白米水位不能证明咖喱可内锅完成。
- **缺口**：牛肉安全终点、炖煮温度未给，状态 `intake_only`。

### 12. Jasmine Rice with Tofu, Broccoli and Edamame

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/jasmine-rice-with-tofu-broccoli-and-i-edamame-i-)
- **已见字段**：4 份；茉莉米 2 cups，水至 `JASMINE` level 2 或 2½ cups，盐；另有硬豆腐 12 oz、熟西兰花 1 cup、熟毛豆 ½ cup、小番茄 1 cup、酱油 4 Tbsp、米醋 2 tsp。
- **流程事实**：米饭煮好；豆腐在酱油／米醋中腌；西兰花和毛豆微波加热；米出锅冷却后与蔬菜、番茄、酱汁和豆腐拌匀。
- **边界**：`cooked_rice_second_cook`／冷拌组合；豆腐和蔬菜不在米锅中同煮，不作为豆腐一锅饭证据。
- **缺口**：熟饭冷却及冷拌的食品安全窗口未给，状态 `intake_only`。

### 13. Eastern Mediterranean Vegetables and Brown Rice

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/eastern-mediterranean-vegetables-and-brown-rice)
- **已见字段**：2–3 份／4–6 份；短／中粒糙米 1½／3 cups、蔬菜高汤 12／24 oz、蒜、芹菜籽、盐，水至 `BROWN RICE` 水位；另有熟菠菜、熟洋蓟、油浸番茄、开心果、油醋、欧芹和 ricotta salata。
- **流程事实**：糙米按 `BROWN` 煮；蔬菜在微波炉加热，油醋和奶酪另调；米熟后拌入。
- **边界**：`staged/extra_pan`／cooked topping；页面可作 meal 或 side，但无独立主要蛋白，不进入当前主餐轮替。
- **缺口**：营养完整性和加热安全未闭合，状态 `intake_only`。

### 14. Gumbo Bowl

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/gumbo-bowl)
- **已见字段**：4 份；烟熏 Andouille 香肠 8 oz、虾 12 oz、秋葵、洋葱、西芹、青椒、蒜、面粉、油、Creole 调味、伍斯特酱、虾／鸡汤 4 cups；熟长粒米 4 cups。
- **流程事实**：香肠先炒；另锅以油和面粉制 roux，炒蔬菜和秋葵，加高汤煮约 30 分钟，最后加虾约 4 分钟；每碗盛熟饭后浇 gumbo。
- **边界**：`cooked_rice_second_cook`／extra_pan；米饭不是页面中的烹调对象，不进入当前生米轮替，也不证明电饭煲适配。
- **缺口**：虾熟制终点、熟饭保温／复热条件未给，状态 `intake_only`。

## 仅作线索、未纳入本批事实矩阵的官方页面

以下页面已从官方索引定位，但本轮未把标题当成完整做法，也未作为强候选计数：

- [Beef Katsu-Don](https://www.zojirushi.com/app/recipe/beef-katsu-don-beef-cutlet-bowl)：预计熟饭浇汁／另锅炸制，待核。
- [Classic Katsu-Don](https://www.zojirushi.com/app/recipe/classic-katsu-don-pork-cutlet-bowl)：预计熟饭浇汁／另锅炸制，待核。
- [Loco Moco](https://www.zojirushi.com/app/recipe/loco-moco)：米饭与汉堡排、鸡蛋疑为分锅，待核。
- [Shiitake-Gohan](https://www.zojirushi.com/app/recipe/-i-shiitake-gohan-i-i-shiitake-i-mushroom-rice-)：具名炊饭候选，需再次核对米量、液体和目录近重复。
- [Takikomi-Gohan](https://www.zojirushi.com/app/recipe/-i-takikomi-gohan-i-mixed-rice-)：具名混合饭候选，需确认与已有香菇／混合炊饭是否同一 canonical。
- [An Easy Cheesey Chicken](https://www.aromaco.com/wp-content/uploads/2021/12/ARC-5000SB-recipes.pdf)：Aroma ARC-5000SB 官方食谱 PDF p.3；页面描述鸡胸、带汁番茄、未煮长粒米、鸡汤和马苏里拉，使用 `Saute-Then-Simmer`，但本轮尚未完整复核每项克数，暂不计入强候选。

## 本轮结论与后续边界

- 共逐页打开并记录 **14 条** Zojirushi 官方页面；其中没有新增的“纯生米＋主要蛋白一次直投”强候选。`Tofu Jasmine Fragrant Rice` 可归为 `direct_one_pot + staged_topping`，其余为 `staged/extra_pan`、`cooked_rice_second_cook` 或出锅浇汁。
- 这些页面的主要价值是把“厂商也经常采用煮饭＋另锅蛋白／熟菜”的事实记录下来，不能为了提高轮替数量把另锅流程删掉或改写成电饭煲菜饭。
- 进入主目录前仍需：再次对照 canonical／alias；建立各事实域的 source scope 和定位；补项目独立安全终点；确认是否属于产品的“米饭主餐”而不是配饭／熟饭二次烹。
- 本轮没有改主 JSON、运行时代码、UI、Planner、CSV 或生成 artifacts；仅新增本 intake 文件。提交前运行 `git diff --check`。

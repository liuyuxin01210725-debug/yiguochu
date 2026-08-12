# 厂商官方米饭／粥主餐 intake · r139

**研究日期**：2026-08-08
**去重基线**：主目录 `source-backed-one-pot-v1-20260808-global-r137`（916 条）；同时对照 `r138` 厂商 intake。以下页面均通过 Zojirushi 官方菜谱页在浏览器中直接打开，当前主目录未发现精确 URL 重复。
**本文件性质**：独立研究 intake；不修改主 JSON、CSV、运行时代码、UI、构建产物或部署状态，不晋升 `recipe_fact_checked` / `executable`。

## 判定口径

- `direct_one_pot`：生米和主要配料在同一内锅完成主要烹调。
- `direct_one_pot + staged_topping`：米饭在内锅完成，出锅再加入已熟或预处理配料；不能写成“全部食材一次投放”。
- `staged/extra_pan`：米饭与主要配菜、蛋白在不同锅／微波炉／搅拌机完成；记录真实边界，但不进入当前严格一锅轮替。
- `cooked_rice_second_cook`：从熟饭开始再炒、拌或浇汁，属于未来熟饭品类，不是当前生米菜饭。
- 厂商页面只证明页面写明的 Zojirushi 型号、水位、程序、数量和步骤；不将其参数外推到普通电饭煲，也不宣称厂商改编配方是原产地传统菜。

## 本轮直接核验的新页面

### 1. Artichoke Mixed Brown Rice

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/artichoke-mixed-brown-rice)
- **页面事实**：4–6 份；内锅短／中粒糙米 2 rice cups，水至 `BROWN RICE` level 2 或 3 rice cups；另有橄榄油 2 Tbsp、洋葱半个、罐装洋蓟心 2×14 oz、盐、胡椒、柠檬皮屑、莳萝。
- **流程**：糙米先用 `BROWN` 煮；倒计时阶段用大炒锅炒洋葱约 5 分钟，再加洋蓟炒约 3 分钟；米熟后加入炒锅，混合盐、胡椒、柠檬皮屑和莳萝。
- **边界**：`staged/extra_pan`，页面明确“可用剩余糙米，跳过煮饭步骤”；不是生米与主料同锅。无独立蛋白，不能进入营养型主餐轮替。
- **缺口**：油和蔬菜的加热终点、米饭保温窗口未给；状态 `intake_only`。

### 2. Buttered Lobster Rice

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/buttered-lobster-rice)
- **页面事实**：2–3 份：长粒白米 1 cup、水 1¼ cups、盐 ¼ tsp、融化黄油 ½ Tbsp、卡宴 ⅛ tsp；另有已熟龙虾肉 6–8 oz、黄油、半个柠檬汁、欧芹。4–6 份按米 3 cups、水 3¾ cups、龙虾 12–16 oz 给出。
- **流程**：米以 `MIXED` 煮；龙虾需已熟，或原料为生龙虾时先在盐水中煮 15 分钟；米将完成时另锅做柠檬黄油；米熟后拌黄油和欧芹，龙虾微波 30 秒后裹柠檬黄油，最后放在饭上。
- **边界**：`staged/extra_pan`／熟海鲜 topping；不能将生龙虾直接投进米锅，也不能删掉加热／另锅步骤。
- **缺口**：龙虾中心温度、微波功率和海鲜过敏提示未由页面闭合；状态 `intake_only`。

### 3. Cauliflower Creamed Rice with Seared Salmon

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/cauliflower-creamed-rice-with-seared-salmon)
- **页面事实**：4–6 份；长粒白米 2 cups，水至 `LONG GRAIN WHITE` level 2 或 2½ cups，盐 ½ tsp；另有一整颗菜花、蒜、红葱头、黄油、百里香、胡椒、三文鱼 1 lb、柠檬皮屑和煎鱼油。
- **流程**：米用 `LONG GRAIN WHITE` 或 `MIXED` 煮；菜花、葱头和蒜在大锅煮软后用搅拌机打成泥；米熟后拌入菜花泥；三文鱼在炒锅每面约 1 分钟煎熟，最后与米饭分盘。
- **边界**：`staged/extra_pan`，需要大锅、搅拌机、炒锅；页面定位是米饭配煎鱼，不是一锅电饭煲主餐。
- **缺口**：三文鱼安全终点未写数字；状态 `intake_only`。

### 4. Green Tea Rice

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/green-tea-rice)
- **页面事实**：4 份；白米或糙米 2 cups，水至相应 `WHITE RICE`／`BROWN RICE` 水位；另有绿茶叶 1 Tbsp、冷水 1½ cups、盐、糖、烤芝麻。
- **流程**：绿茶叶冷水浸泡约 1 小时并过滤；米按白米或糙米程序煮；出锅拌入茶叶、盐、糖和芝麻。
- **边界**：`direct_one_pot + staged_topping`，主料只有米和茶叶，没有蛋白或蔬菜，不满足当前营养型主餐准入；仅可作为具名基础米饭档案。
- **缺口**：无主餐蛋白，且茶叶用量为汤匙而非克重；状态 `intake_only`。

### 5. Vegetable Brown Rice Zosui (Japanese Rice Soup)

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/vegetable-brown-rice-i-zosui-i-japanese-rice-soup-)
- **页面事实**：3–4 份；糙米 1 cup，水至 `BROWN RICE` level 1；另有鸡汤 3 cups、白菜、竹笋、彩虹瑞士甜菜、葱、酱油、味醂、鸡蛋。
- **流程**：糙米先在电饭煲用 `BROWN` 煮；米将完成时，把鸡汤和蔬菜放入大陶锅或荷兰锅煮沸，再加入熟糙米炖 3 分钟；加叶菜和调味，最后倒入蛋液焖 2 分钟。
- **边界**：`cooked_rice_second_cook`／`staged/extra_pan`；这是熟饭入汤锅的粥饭，不是生米一锅出。页面只证明另一只锅的流程。
- **缺口**：鸡汤与鸡蛋的安全终点未给；状态 `intake_only`。

### 6. Tropical Fried Rice

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/tropical-fried-rice)
- **页面事实**：4–6 份；茉莉米 2 cups，水至 `JASMINE` level 2 或 2½ cups；另有油、蒜、洋葱、胡萝卜、火腿 ½ cup、鲜虾约 12 oz、盐、酱油、蚝油、咖喱粉、葡萄干、菠萝和葱。
- **流程**：米先用 `JASMINE`／`WHITE RICE` 煮；炒锅炒蒜、洋葱、胡萝卜约 2 分钟，加火腿和虾再约 2 分钟；加入熟米、调味、葡萄干和菠萝翻炒，最后拌葱。
- **边界**：`cooked_rice_second_cook`／extra_pan；不进入当前生米轮替。虾和火腿均不是内锅同煮主料。
- **缺口**：虾安全终点仅写“heated through”，未给中心温度；状态 `intake_only`。

### 7. Vegetable Chuka-Don

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/vegetable-chuka-don)
- **页面事实**：4 份；熟短／中粒白米 5 cups（或熟糙米）；蔬菜包括大白菜、胡萝卜、香菇、葱、竹笋、荷兰豆、豆芽；另有蔬菜高汤 1⅔ cups、酱油、味醂、盐、糖、玉米淀粉和油。
- **流程**：蔬菜切配后在炒锅炒约 3 分钟；加入调味和高汤煮 2 分钟；加豆芽和荷兰豆，调淀粉水勾芡；盛熟饭后浇蔬菜。
- **边界**：`cooked_rice_second_cook`／extra_pan；从熟饭开始，且蔬菜全在炒锅完成，不是一锅米饭。
- **缺口**：无主要蛋白，页面也将其定位为浇饭蔬菜；状态 `intake_only`。

### 8. Chili Cheese Rice and Hot Dogs

- **官方原页**：[Zojirushi](https://www.zojirushi.com/app/recipe/chili-cheese-rice-and-hot-dogs)
- **页面事实**：2–3 份：长粒白米 1 cup、低钠牛肉汤 4 oz、水 4 oz；另有辣椒酱、罐装红腰豆、洋葱、热狗、切达奶酪、葱和香菜。4–6 份按米 2 cups、汤／水各 8 oz 等比例给出。
- **流程**：米加牛肉汤和水用 `MIXED` 煮；辣椒酱和红腰豆另锅加热约 10 分钟；洋葱另锅炒软；热狗另行煮／微波／烤；米熟后拌入辣椒酱，最后放洋葱、奶酪和热狗。
- **边界**：`staged/extra_pan`，另锅与熟配料占主要内容，不能改写成内锅一锅菜饭。
- **缺口**：热狗加热终点、豆类保温和钠信息未闭合；状态 `intake_only`。

## 本轮结论

- 本轮直接打开并记录 **8 条** 当前目录未发现精确 URL 重复的 Zojirushi 官方页面。
- 其中没有新增“生米＋主要蛋白＋蔬菜在同一内锅一次完成”的强候选；`Green Tea Rice` 属于无蛋白基础米饭，`Artichoke Mixed Brown Rice`、`Buttered Lobster Rice`、`Cauliflower Creamed Rice with Seared Salmon`、`Chili Cheese Rice and Hot Dogs` 都明确依赖另锅或出锅 topping；`Zosui` 和 `Tropical Fried Rice` 属于熟饭二次烹。
- 因此本轮**不建议把任何条目直接放入当前生米菜饭轮替**。它们可作为官方事实档案或未来“熟饭／另锅”品类候选，需后续重新定义品类边界后再入主目录。
- 本轮未修改主 JSON、运行时代码、UI、CSV 或生成 artifacts；提交前已运行 `git diff --check`。

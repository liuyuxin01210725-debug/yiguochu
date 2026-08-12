# 厂商官方米饭／粥主餐 intake：r126 Instant Pot 线

日期：2026-08-08
去重基线：`source-backed-one-pot-v1-20260808-global-r125`（主目录 884 条）
范围：Instant Pot 官方 Recipes 页面；本文件只记录研究候选，不修改主 JSON、CSV、运行时代码、UI 或部署产物。
访问方式：通过浏览器直接打开官方原页，逐页读取 `Yield/Prep/Cook/Ingredients/Instructions/Notes`；搜索结果只用于定位，不能单独支撑候选。
状态：全部 `intake_only`，没有晋升 `recipe_fact_checked`、`executable` 或 `kitchen_observed`。

## 口径

- `direct_one_pot`：官方把生米和主要配料放入同一 Instant Pot 内锅完成主要烹调；出锅后少量拌入调味不改变主体同锅事实。
- `direct_one_pot_after_prep`：同一内锅完成，但有明确的先炒、浸泡或压力后投料；前处理和后加边界必须原样保留。
- `internal_steam_bowl`：米和主料在内锅，另一主料在同一锅内的蒸架/独立碗中完成；这是同一机器的多容器流程，不等同于全料同锅。
- `dual_pot`：Instant Pot Dual Action 的主锅和副锅分别完成，不能当作单锅轮替。
- `rice_pan_in_pot`：米在锅内独立小锅/蒸架，主菜在底锅，属于“饭上组合”边界。
- `cooked_rice_second_cook`：米先煮熟，再用空气炸锅、另锅或其他设备完成；不进入当前生米一锅轮替。
- 厂商页面只证明其页面所写的配方、程序、器具和数量；不把 Instant Pot 压力锅参数外推为普通电饭煲，也不把厂商菜名宣称为地域传统身份。
- 营养结构只做研究标记：`balanced_candidate`、`low_balance` 或 `boundary`。汤、芝士、酱料不能被自动算作蛋白质或蔬菜。

## A. 可进入后续合同复核的同锅候选（13 条）

以下条目在 r125 主目录中没有精确同名条目；也未在既有厂商 intake 中发现相同标题。所有数量、程序和时间均为官方页面原文范围，缺失项保持缺失。

### 1. Miso Butter Carrot Risotto

- provisional_id：`instant-pot-miso-butter-carrot-risotto`
- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/miso-butter-carrot-risotto)
- 证据范围：`identity, ingredients, quantity, liquid, process, appliance, time`
- 页面字段：2–3 servings；Prep 15 min；Cook 20 min；Instant Pot RIO 4QT Mini Multi-Cooker；Pressure Cook + Sauté。
- 食材/液体：三色胡萝卜 2 cups、橙色胡萝卜碎 1 cup、无盐黄油共 6 Tbsp、白味噌 2 Tbsp、姜、葱、洋葱、Arborio 米 1 cup、低钠蔬菜或鸡汤 2¾ cups、帕玛森 ¼ cup、芝麻和香菜。
- 流程：Sauté 将三色胡萝卜和姜炒 2–4 分钟后盛出；再炒洋葱、姜、味噌和胡萝卜碎，加入米和汤；High Pressure 6 分钟，立即排压；开盖拌帕玛森，最后铺回炒好的胡萝卜。
- 边界：同一 4QT 机器，但有“先炒后盛出、压力后拌入”两个明确阶段；页面把它称为 risotto，不证明地域传统。
- 营养/缺口：`low_balance`（主要为米、胡萝卜和奶酪，页面未提供独立主要蛋白）；需补项目安全与营养审查，不能默认作为均衡主餐。
- 轮替资格：`research_only`，不进入当前轮替。

### 2. One-Pot Tom Yum Rice with Steamed Broccoli

- provisional_id：`instant-pot-one-pot-tom-yum-rice-steamed-broccoli`
- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/one-pot-tom-yum-rice-with-steamed-broccoli)
- 证据范围：`identity, ingredients, quantity, liquid, process, appliance, time`
- 页面字段：2 servings；Prep 10 分钟，另加腌制 30 分钟；Cook 18 分钟；页面注明配方在 3QT Duo Mini 制作；Rice 低压 8 分钟，或无 Rice 模式时 High Pressure 5 分钟，之后自然排压 10 分钟。
- 食材/液体：米 ¾ cup；虾或鸡腿肉 ½ lb；豆芽 1 cup；豆腐泡 6 个；白玉菇 1 cup（可选）；西兰花 1 cup；Tom Yum 酱 2 Tbsp；水 ⅔ cup；虾/鸡肉各自独立腌料。
- 流程：米、豆芽、豆腐泡、蘑菇和汤底进内锅；蒸架上放耐压小碗，西兰花在小碗中蒸；同一压力锅完成后取出蒸碗，拌松米饭。
- 边界：`internal_steam_bowl`，西兰花不是与米直接同锅；虾和鸡腿是二选一，不得合并成一个变体；3QT Duo Mini 的容量和程序不可外推。
- 安全：虾/鸡肉分别需要项目独立安全终点；官方页面的清洗和腌制不等于项目安全签署。
- 轮替资格：`research_only`，待安全和多容器边界复核。

### 3. Cajun Sausage & Rice

- provisional_id：`instant-pot-cajun-sausage-rice`
- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/cajun-sausage-rice)
- 证据范围：`identity, ingredients, quantity, liquid, process, appliance, time`
- 页面字段：4 servings；Prep 10 分钟；Cook 15 分钟；Instant Pot Pro Max；Sauté + High Pressure 10 分钟，自然排压 5 分钟；官方称为 one-pot wonder。
- 食材/液体：橄榄油 1 Tbsp；红椒、青椒各 1 个；芹菜 ½ cup；洋葱 ½ 个；Cajun 香肠 12–20 oz；Cajun 调味料 3 tsp、蒜、盐、百里香、烟熏红椒、牛至、酱油；鸡汤 1 cup；水 ½ cup；长粒白米或茉莉米 1½ cups。
- 流程：同一内锅 Sauté 炒蔬菜、香肠和调味料 3–5 分钟；以酱油、鸡汤和水脱底；加入米，High Pressure 10 分钟，自然排压 5 分钟后翻松。
- 边界：强 `direct_one_pot` 候选，但香肠是已加工肉，肉类安全/钠含量需独立审查；Pro Max 程序不可外推普通电饭煲。
- 营养：`balanced_candidate`（米、加工肉、椒/芹菜/洋葱），不把香肠安全当作项目已签署终点。
- 轮替资格：`research_only`。

### 4. Silky Rice Porridge

- provisional_id：`instant-pot-silky-rice-porridge`
- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/chinese-porridge)
- 证据范围：`identity, ingredients, quantity, liquid, process, appliance, time`
- 页面字段：4 servings；Prep 5 分钟；Cook 40 分钟；3QT Duo Mini；Porridge 高压 25 分钟，自然排压 15 分钟。
- 食材/液体：茉莉米 1 cup；总液体 6 cups（页面写 water + 一罐低钠鸡汤）；姜片 3 片；干贝 ¼ cup；盐和白胡椒按口味。
- 流程：米浸泡 30 分钟；米、鸡汤/水、姜和干贝放入内锅；Porridge 高压 25 分钟，自然排压 15 分钟；出锅取姜片并调味。
- 边界：`direct_one_pot` 粥类，不能把“可选 toppings”扩成新的主要食材；页面只证明 3QT Duo Mini，6QT/8QT 只提示需调整量，不提供可直接迁移的数值。
- 营养/缺口：`low_balance`（米和少量干贝，缺蔬菜）；鸡汤品牌和盐度不统一，项目营养与安全合同待补。
- 轮替资格：`research_only`。

### 5. French Onion Risotto

- provisional_id：`instant-pot-french-onion-risotto`
- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/french-onion-risotto)
- 证据范围：`identity, ingredients, quantity, liquid, process, appliance, time`
- 页面字段：4 servings；Prep 10 分钟；Cook 50 分钟；Sauté + High Pressure。
- 食材/液体：洋葱 3 个；百里香 10 枝；黄油 4 Tbsp；盐 2 tsp；水 ½ cup；Arborio 米 1 cup；牛肉高汤 3 cups；帕玛森 1 cup；Gruyère 作为出锅配料。
- 流程：Sauté 洋葱和百里香；加水后 High Pressure 5 分钟；排压后再 Sauté 约 15–20 分钟至焦糖化，取出洋葱；清空内锅，加入黄油、米、高汤 High Pressure 5 分钟；自然排压 10 分钟，拌入芝士和洋葱。
- 边界：`direct_one_pot_after_prep`，仍是同一台锅但明确“清空内锅后第二阶段”；不应宣传为全部材料一次装锅即成。
- 营养/缺口：`low_balance`（以米、洋葱、奶酪为主，牛肉高汤不计作蛋白）；需补钠/乳制品边界。
- 轮替资格：`research_only`。

### 6. Shrimp and Pea Risotto

- provisional_id：`instant-pot-shrimp-pea-risotto`
- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/shrimp-and-pea-risotto)
- 证据范围：`identity, ingredients, quantity, liquid, process, appliance, time`
- 页面字段：1 serving；Prep 5 分钟；Cook 40 分钟；Sauté + High Pressure 35 分钟，之后 Sauté 收汁。
- 食材/液体：橄榄油 2 tsp；蒜 1 瓣；洋葱 ¼ cup；糙米 ¼ cup；柠檬汁 1 Tbsp；鸡汤 1 cup；冷冻豌豆 ½ cup；冷冻熟虾 ½ cup；黑胡椒、莳萝和欧芹。
- 流程：Sauté 炒蒜洋葱和米，加入柠檬汁与鸡汤；High Pressure 35 分钟并排压；转 Sauté 加豌豆 2 分钟，再加熟虾 2 分钟。
- 边界：`direct_one_pot_after_prep`；虾明确为熟虾，不能改成生虾安全合同；一人份、糙米和 35 分钟压力程序不可外推。
- 营养：`balanced_candidate`（糙米、熟虾、豌豆），但熟虾来源状态和项目食品安全仍待核验。
- 轮替资格：`research_only`。

### 7. Asiago Shrimp Risotto

- provisional_id：`instant-pot-asiago-shrimp-risotto`
- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/asiago-shrimp-risotto)
- 证据范围：`identity, ingredients, quantity, liquid, process, appliance, time`
- 页面字段：4 servings；Prep 5 分钟；Cook 25 分钟；Pressure Cook 12 分钟；随后 Sauté 3–5 分钟。
- 食材/液体：黄油 3 Tbsp；洋葱、蒜；Arborio 米 1½ cups；白葡萄酒 2 Tbsp；鸡汤 4 cups（压力段先用 3 cups，余下 1 cup 后加）；中虾 1 lb；Asiago ¾ cup；欧芹和龙蒿。
- 流程：同一锅 Sauté 炒葱蒜和米，脱底后加 3 cups 鸡汤；压力 12 分钟，排压；转 Sauté 加剩余鸡汤和虾，虾变不透明后拌芝士和香草。
- 边界：`direct_one_pot_after_prep`，虾是压力后投料；不能把页面 3–5 分钟改写成统一压力时间。
- 安全：虾需项目海鲜熟制终点；鸡汤和奶酪带过敏/钠边界。
- 轮替资格：`research_only`。

### 8. Curried Rice with Shrimp

- provisional_id：`instant-pot-curried-rice-with-shrimp`
- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/curried-rice-with-shrimp)
- 证据范围：`identity, ingredients, quantity, liquid, process, appliance, time`
- 页面字段：4 servings；Prep 5 分钟；Cook 20 分钟；Sauté + High Pressure 10 分钟，先自然排压 5 分钟。
- 食材/液体：橄榄油 1 Tbsp；洋葱 1 个；胡萝卜 1 cup；蒜；咖喱粉 2 tsp；长粒白米 1 cup；水 1½ cups；中虾 1½ lb；罗勒、盐和胡椒。
- 流程：同一锅 Sauté 炒胡萝卜洋葱，再加蒜和咖喱；加入米、水、调味和冷冻虾，High Pressure 10 分钟；自然排压 5 分钟后拌罗勒。
- 边界：`direct_one_pot`，虾从冷冻状态入锅；页面未提供虾的中心温度，必须补项目海鲜安全终点，不能仅依赖“10 分钟”。
- 营养：`balanced_candidate`（米、虾、胡萝卜/洋葱）；高虾用量和过敏风险需独立审查。
- 轮替资格：`research_only`。

### 9. Greek Rice

- provisional_id：`instant-pot-greek-rice`
- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/greek-rice)
- 证据范围：`identity, ingredients, quantity, liquid, process, appliance, time`
- 页面字段：6–8 servings；Prep 12 分钟；Cook 10 分钟；Sauté 后 High Pressure 4 分钟，自然排压 10 分钟。
- 食材/液体：长粒米 1¾ cups；黄油 2 Tbsp；蔬菜或鸡汤 1¾ cups；Greek seasoning、牛至和盐；卡拉马塔橄榄 1 cup；烤红椒 ¾ cup；羊奶酪和欧芹。
- 流程：Sauté 将米炒至金黄；加汤和调味，High Pressure 4 分钟；自然排压 10 分钟后拌橄榄、红椒和芝士。
- 边界：`direct_one_pot_after_prep`；页面标题与字段来自 Instant Pot 官方食谱，但作者栏目将其作为配菜，不能默认宣传为完整主餐。
- 营养/缺口：`low_balance`（无主要蛋白）；蔬菜和奶酪的数量部分为出锅拌入，需独立标记。
- 轮替资格：`research_only`。

### 10. Winter Squash Risotto

- provisional_id：`instant-pot-winter-squash-risotto`
- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/winter-squash-risotto)
- 证据范围：`identity, ingredients, quantity, liquid, process, appliance, time`
- 页面字段：4–6 servings；Prep 10 分钟；Cook 15 分钟；Sauté + High Pressure 6 分钟，之后 Sauté 约 3 分钟收稠。
- 食材/液体：黄油 2 Tbsp；橄榄油 1 Tbsp；洋葱或红葱头；Arborio 米 1½ cups；白葡萄酒 ¼ cup；蔬菜或鸡汤 4 cups；冬南瓜丁 2 cups；帕玛森或 Romano ½ cup。
- 流程：Sauté 炒葱和米，加入酒至挥发；加入汤和南瓜，High Pressure 6 分钟；排压后 Sauté 收稠并拌芝士。
- 边界：`direct_one_pot_after_prep`；页面提供蔬菜汤/鸡汤二选一，不把两版拼成一条营养合同。
- 营养/缺口：`low_balance`（没有主要蛋白）；奶酪和高汤的钠/乳制品边界需独立标记。
- 轮替资格：`research_only`。

### 11. South Indian Rice and Lentils

- provisional_id：`instant-pot-south-indian-rice-lentils`
- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/south-indian-rice-and-lentils)
- 证据范围：`identity, ingredients, quantity, liquid, process, appliance, time`
- 页面字段：4 servings；Prep 10 分钟；Cook 40 分钟；Rice 低压 12 分钟，自然排压 10 分钟。
- 食材/液体：短粒白米 1 cup；酥油 4 Tbsp；生腰果 2 Tbsp；姜、孜然、黑胡椒、咖喱叶；绿豆 ½ cup；盐 2 tsp；hing ⅛ tsp；水 4½ cups。
- 流程：Sauté 先将腰果取出；在锅底做姜、香料和咖喱叶 tadka 并取出；绿豆略炒后加入米、水和盐；Rice 低压 12 分钟，自然排压 10 分钟；出锅拌回腰果和 tadka。
- 边界：`direct_one_pot_after_prep`；有明确出锅后拌入的香料和腰果，不能把“配椰子 chutney 或 sambar”算入锅内。
- 营养：`balanced_candidate`（米＋豆类蛋白/纤维），但页面称早餐/午晚餐均可，地域身份只记录厂商页面标题/说明，不宣称具体地方标准。
- 轮替资格：`research_only`。

### 12. Valencia-Style Paella

- provisional_id：`instant-pot-valencia-style-paella`
- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/valencia-style-paella)
- 证据范围：`identity, ingredients, quantity, liquid, process, appliance, time`
- 页面字段：6 servings；Prep 15 分钟；Cook 40 分钟；Sauté + High Pressure 4 分钟，关机后焖 10 分钟。
- 食材/液体：橄榄油 2 Tbsp；腊肠或 chorizo 12 oz；去骨鸡腿 1 lb；袋装藏红花黄米 16 oz（或页面给出的自制替代配方）；无盐鸡汤 2 cups；水 2 cups；烤红椒 16 oz；冷冻豌豆 1 cup。
- 流程：Sauté 煎香肠并取出；鸡腿分批煎至表面变白并取出；同锅炒米，加入汤水、红椒和豌豆，再放回鸡肉、香肠和汁液；High Pressure 4 分钟，焖 10 分钟；页面要求鸡肉刺入时汁液清澈，不足时再加 1 分钟压力。
- 边界：`direct_one_pot_after_prep`；肉先煎后回锅；“Valencia-style”是官方菜名/风格描述，不证明西班牙传统原方；袋装调味米和自制白米版本必须分开。
- 营养/安全：`balanced_candidate`（米、鸡肉/香肠、豌豆/红椒），鸡肉和加工肉安全终点需项目独立来源。
- 轮替资格：`research_only`。

### 13. Minty Pea Risotto

- provisional_id：`instant-pot-minty-pea-risotto`
- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/minty-pea-risotto)
- 证据范围：`identity, ingredients, quantity, liquid, process, appliance, time`
- 页面字段：4 servings；Prep 5 分钟；Cook 21 分钟；Pressure Cook 10 分钟，自然排压 10 分钟，之后加豌豆加热 3 分钟。
- 食材/液体：无盐黄油 4 Tbsp；红葱头 2 个；蒜；Arborio 米 1½ cups；鸡汤 4 cups；盐、胡椒、青柠皮、鲜薄荷 ¾ cup、豌豆 1 cup。
- 流程：Sauté 炒红葱头、蒜和米；先加 1 cup 汤至吸收，再加余下 3 cups；压力 10 分钟，自然排压 10 分钟；拌入青柠皮、薄荷和豌豆，Sauté 加热 3 分钟。
- 边界：`direct_one_pot_after_prep`；官方正文明确把它称为配菜并建议搭配羊排、虾或鱼，不能把这些外加主料伪装成锅内食材。
- 营养/缺口：`low_balance`；豌豆只提供有限蛋白/纤维，鸡汤也不计作肉类蛋白。
- 轮替资格：`research_only`。

## B. 需要明确标为边界、不可进入当前“一锅米饭”轮替的厂商候选（5 条）

### 14. Beef Pilaf（Instant Pot Dual Action）

- provisional_id：`instant-pot-dual-action-beef-pilaf`
- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/beef-pilaf)
- 证据范围：`identity, ingredients, quantity, liquid, process, appliance, time`
- 页面字段：4–6 servings；Prep 20 分钟；Cook 45 分钟；Dual Action Main Pot + Side Pot；主锅 Pressure Cook 35 分钟，副锅 White Rice；主锅自然排压 10 分钟。
- 食材/液体：牛肩肉 1½ lb、胡萝卜 2 根、洋葱、孜然、蒜头、葡萄干、牛肉锅水 ¾ cup；副锅藏红花热水 3 Tbsp、巴斯马蒂米 2 cups、水 2½ cups、鹰嘴豆 15 oz、黄油和油。
- 边界：`dual_pot`；牛肉在主锅、米在副锅，Serve Together 只是同步完成，不是一锅主餐；保留为“多锅器具”档案，不进入当前轮替。

### 15. Butter Chicken and Rice（Instant Pot）

- provisional_id：`instant-pot-butter-chicken-and-rice`
- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/butter-chicken-and-rice)
- 证据范围：`identity, ingredients, quantity, liquid, process, appliance, time`
- 页面字段：4 servings；Prep 5 分钟；Cook 20 分钟；主锅 Pressure Cook 10 分钟＋自然排压 10 分钟；米使用锅内独立、容量至少 7 cup 的 cooking pan。
- 食材/液体：鸡腿 1 lb；长粒白米 2 cups；水 2½ cups；番茄、蒜、姜、黄油、奶油、garam masala 和香菜。
- 边界：`rice_pan_in_pot`；米在内锅上方独立小锅，鸡肉酱在底锅，成品是“鸡肉酱盖饭”；不是同锅米饭，不能伪装成一锅轮替。

### 16. Mongolian Beef and Rice（Instant Pot）

- provisional_id：`instant-pot-mongolian-beef-and-rice`
- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/mongolian-beef-and-rice)
- 证据范围：`identity, ingredients, quantity, liquid, process, appliance, time`
- 页面字段：4–6 servings；Prep 5 分钟；Cook 35 分钟；牛肉酱主锅 Pressure Cook 10 分钟后收汁；米放至少 7 cup 的独立 cooking pan，置于高 trivet 上。
- 食材/液体：侧腹牛排 1–1½ lb；水 1 cup（酱汁）＋水 2¼ cups（米锅）；酱油、红糖、蒜、姜、辣椒；长粒白米 2 cups；玉米淀粉和葱。
- 边界：`rice_pan_in_pot`；页面明确“米锅底部不得接触酱汁”，米和牛肉不是同一锅食材；不进入严格一锅轮替。

### 17. Red Beans and Rice（Instant Pot）

- provisional_id：`instant-pot-red-beans-and-rice`
- 直达来源：[Instant Pot 官方原页](https://instantpot.com/blogs/recipes/red-beans-and-rice)
- 证据范围：`identity, ingredients, quantity, liquid, process, appliance, time`
- 页面字段：8–10 servings；Prep 15 分钟；Cook 90 分钟；干红腰豆和蔬菜/鸡肉香肠在 Instant Pot 分两段压力烹调；成品配 8 cups **熟米饭**。
- 食材/液体：干红腰豆 1 lb、洋葱、甜椒、西芹、蒜、鸡汤 4 cups、水 3 cups、鸡肉 Andouille 12–16 oz、黄油和辣酱；熟米饭 8 cups。
- 边界：`cooked_rice_second_cook`／`served_over_rice`；米饭不是本页压力锅流程产物，不能从其他来源借生米比例；只作未来“熟饭二次烹”品类边界档案。

## 去重、排除与下一步

- 本轮 17 条均未在 r125 主目录找到精确 `canonical_name` 或相同 `recipe_id`；同名/近名检索同时保留了原始英文标题，未强行翻译为地方传统身份。
- 没有把 `One-Pot Butter Chicken`（无米）、`Spicy Shrimp Crispy Rice`（需空气炸锅和冷藏成型）、`Kimchi Fried Rice`（先煮米再空气炸）、`Butterfly Pea Flower Rice`（页面未能稳定打开）列入本轮主候选；它们属于非米饭主餐或熟饭二次烹边界。
- A 组 13 条中，真正具备家庭主餐结构且优先级较高的是：Cajun Sausage & Rice、One-Pot Tom Yum Rice（须接受蒸碗边界）、Curried Rice with Shrimp、Valencia-Style Paella、South Indian Rice and Lentils、Shrimp and Pea Risotto、Asiago Shrimp Risotto；其余明确标为 `low_balance` 或需安全补证。
- B 组 4 条只作边界资料，不得进入当前单锅轮替。
- 所有条目仍是 `intake_only`；下一步若要入主目录，须逐条建立来源记录、核对模型/容量、补独立安全终点并经目录 validator，不得直接晋升或部署。

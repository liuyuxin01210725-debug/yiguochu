# 公开机构一锅米饭来源搜集 Intake（r141）

**研究日期**：2026-08-08
**去重基线**：主目录 `source-backed-one-pot-v1-20260808-global-r140`（920 条）；同时核对 r138–r140 以及此前港台、厂商、区域和 global-public intake。
**本批性质**：研究 intake；只写本文件，不修改主 JSON、CSV、运行时代码、UI、构建产物或部署包；不晋升 `executable`。
**来源范围**：加拿大卫生部、澳大利亚新州政府/地方卫生区、香港食物环境卫生署 EatSmart 等公共机构。所有器具、米态、投料时机和另锅步骤按原文保留，不把普通锅、微波炉、烤箱或炒锅等价推导为电饭煲。

## 判定口径

- `direct_one_pot`：原文明确在同一容器内完成生米（或谷物）与主要配料；器具仍按来源原样记录。
- `extra_pan_or_steam`：需要预炒、另锅、蒸制、烤箱或分组件，不能删掉这些步骤后宣称“电饭煲一锅出”。
- `cooked_rice_second_cook`：来源要求先得到熟饭，再炒、拌或浇汤；登记为未来“熟饭二次烹”/资料分区，不进入当前生米轮替池。
- `archive`：来源只证明身份或字段不足以建立可试做合同；保留原文边界，不用跨来源补猜。

所有份数、重量、体积、时间和温度只按来源实际写明的事实记录。`null` 代表来源未证明。`B 试做架`不表示电饭煲可做、也不表示厨房已验证。

## 本轮新候选（相对 r140/920 未占用）

| # | 建议 ID / 具名菜 | 地域与一手来源 | 来源实际证明 | 边界与缺口 | 建议状态 |
|---:|---|---|---|---|---|
| 1 | `au-cclhd-microwave-risotto` / Microwave Risotto | 澳大利亚新州 Central Coast Local Health District，[Back to Basics PDF](https://www.cclhd.health.nsw.gov.au/wp-content/uploads/Back-to-Basics.pdf)，p.27（PDF 行 1064–1089） | 4 份；准备约 30 分钟；Arborio 米 1 cup、低盐鸡汤 2½ cups、混合蔬菜 3 cups、帕玛森或 tasty cheese ⅓ cup。米、汤、蔬菜放入同一微波安全容器，覆盖后高火 10 分钟，搅拌再高火 10 分钟或至熟，静置 5 分钟后拌入芝士；可在最后 5 分钟加入已熟鸡肉或罐装三文鱼/吞拿鱼。 | `direct_one_pot`，但器具是微波炉容器，不是电饭煲；可选蛋白是熟食/罐头，不能改写成生肉同锅；来源未给安全温度。默认营养为碳水+蔬菜纤维，蛋白需选配。 | `recipe_fact_checked` 候选；B（微波炉） |
| 2 | `ca-health-multigrain-congee` / Multigrain congee with shiitake, ginger and scallion | 加拿大卫生部 Canada’s Food Guide，[官方原页](https://www.canada.ca/en/health-canada/services/food-guide/eating-support/kitchen/recipes/multigrain-congee-shiitake-ginger-scallion.html)，HTML 行 24–60 | 4 份；准备 15 分钟、烹调 75 分钟；干香菇 6 朵、小麦粒 ¼ cup、白米 ⅓ cup、黑米/全谷米 2 tbsp、小米或高粱 ¼ cup、冷水共 1¾ L（7 cups）、葱、姜、芝麻油和低钠酱油。香菇浸泡 12 小时；大锅将香菇、浸泡液、谷物和水煮沸，小火加盖 1 小时 15 分钟、每 15 分钟搅拌；原页另称可用电饭煲或慢炖锅且无需搅拌。 | `direct_one_pot`（原合同是大锅）；“可用电饭煲”只有泛化提示，没有型号、程序或水位参数，标 `source_limited`，不得推导任意机器设置。无固定蛋白；原页仅建议把带骨鸡腿/鸡棒在粥中炖煮，属于可选提示而非本配方已锁食材。 | `recipe_fact_checked` 候选；B（普通锅；电饭煲线索） |
| 3 | `ca-health-chicken-fried-rice` / Chicken fried rice | 加拿大卫生部 Canada’s Food Guide，[官方原页](https://www.canada.ca/en/health-canada/services/food-guide/eating-support/kitchen/recipes/chicken-fried-rice.html)，HTML 行 24–63 | 6 份；准备 20 分钟、烹调 10 分钟；植物油 2 tbsp、鸡蛋 2 个、已熟鸡胸 1½ cups、蒜 4 瓣、姜 1½ tbsp、洋葱、上海青 3 棵、冷藏或室温熟糙米 4 cups、低钠酱油 2½ tbsp、芝麻油、葱。鸡蛋先炒出备用，鸡肉加热后取出，再炒香料和上海青，加入熟饭和调味，最后回锅鸡蛋和鸡肉。 | `cooked_rice_second_cook`，器具为炒锅/高边煎锅；原文明确使用熟饭和熟鸡，不能放入生米电饭煲轮替；无生肉安全终点（鸡肉来源已熟）。未来熟饭二次烹候选。 | `recipe_fact_checked` 候选；archive（熟饭区） |
| 4 | `ca-health-mujadarrah` / Mujadarrah（扁豆、洋葱和米饭） | 加拿大卫生部 Canada’s Food Guide，[官方原页](https://www.canada.ca/en/health-canada/services/food-guide/eating-support/kitchen/recipes/mujadarrah-lentils-onions-rice.html)，HTML 行 24–56 | 6 份；准备 5 分钟、烹调 20 分钟；橄榄油 2 tbsp、洋葱 3 个、孜然 1 tsp、熟糙米或野米 2¼ cups、罐装扁豆 540 mL。洋葱约 15 分钟炒至深褐，取出一半作装饰，加孜然；熟饭拌入 3 分钟，再拌入扁豆 2 分钟。原页另给干米/干扁豆须按包装分别煮熟后再加入。 | `cooked_rice_second_cook`，炒锅完成；页面“干米/扁豆”路径仍是分别煮，不得伪装生米同锅；没有电饭煲程序，默认无肉但扁豆提供植物蛋白。 | `recipe_fact_checked` 候选；archive（熟饭区） |
| 5 | `ca-health-fried-wild-rice` / Fried wild rice | 加拿大卫生部 Canada’s Food Guide，[官方原页](https://www.canada.ca/en/health-canada/services/food-guide/eating-support/kitchen/recipes/fried-wild-rice.html)，HTML 行 24–59 | 4 份；准备 15 分钟、烹调 40 分钟；野米 1 cup、煮米水 1 L、葵花油、野姜、野蒜、ramps ¼ cup、玉米 1 cup、蔓越莓干 ⅓ cup、酱油。野米在锅中以 1 L 水煮约 40 分钟后沥干冲凉；另用大煎锅炒香料、玉米和蔓越莓，再拌入熟野米和酱油。原页建议在第 4 步拌入已熟鸡蛋或硬豆腐作为蛋白。 | `cooked_rice_second_cook` + `extra_pan_or_steam`；另锅煮米、炒锅二次烹，不是生米一锅；蛋白只是可选，默认组合偏碳水+纤维；没有电饭煲事实。 | `recipe_fact_checked` 候选；archive（熟饭区） |
| 6 | `hk-eatsmart-fresh-tomato-beef-soup-rice` / 鮮茄牛肉湯飯 | 香港食物环境卫生署 EatSmart，[官方原页](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=1244)，HTML 行 5–52 | 1 人份；番茄 6 oz、牛肉 3 oz、粟米粒 1 oz、白飯 9 oz；番茄清湯另用番茄 6 oz、糖 1 tsp、水 12 oz。番茄和糖沸水煮 5 分钟；牛肉切片腌 15 分钟；番茄和粟米汆水；番茄、粟米和牛肉入清汤煮沸 3 分钟，最后将汤料倒入碗中与白饭同食。 | `cooked_rice_second_cook` / 汤锅浇饭；白饭已是熟态，绝不是生米电饭煲一锅。来源明确数量和步骤，但牛肉安全终点未写；米饭和汤分开，不能宣传“所有材料同锅”。 | `recipe_fact_checked` 候选；archive（汤饭/熟饭区） |
| 7 | `au-slhd-oven-baked-biryani` / Oven baked biryani（焗烤印度香饭） | 澳大利亚 Sydney Local Health District，[官方原页](https://slhd.health.nsw.gov.au/yhunger/recipes-tips/soups-stews/oven-baked-biranyi)，HTML 行 30–67 | 按 2/4/6 人份给量；以 4 份为例准备 10 分钟、烹调 40 分钟；油 1 tbsp、黄油 1 tbsp、洋葱 2 个、咖喱酱 ½ cup（140g）、印度香米 1 cup、低盐鸡汤 2 cups、鸡腿肉 500g、混合蔬菜 2 cups。炉灶上先将洋葱焦糖化，加入鸡肉和咖喱酱约 2 分钟；撒米、加高汤和蔬菜后盖住，在 180°C 烤 40 分钟，中途 20 分钟搅拌，至米软且鸡肉熟。 | `extra_pan_or_steam`（炉灶预炒 + 烤箱）；原文器具是带盖烤盘/烤箱，且注明改编自 Taste.com.au，不得转换为电饭煲；鸡肉“熟”是原文终点但无温度值；可作为完整字段的普通家庭烤饭候选。 | `recipe_fact_checked` 候选；archive（烤箱区） |

## 既有候选的直接复核升级（不计入本轮新增）

以下页面在此前 intake 中已登记，但此前访问受阻或只有搜索入口。本轮重新直接打开后，只更新“证据可访问性/定位”建议，不新建条目、不重复计数：

| 既有 ID | 直接来源与本轮确认 | 当前边界 |
|---|---|---|
| `nsw-vegetable-chicken-congee` / Vegetable and chicken congee | [NSW Government 原页](https://www.nsw.gov.au/health-and-wellbeing/healthy-living/healthy-eating/healthy-recipes/vegetable-and-chicken-congee) 已直接打开：2 份，预熟米 1 cup、熟鸡 ¾ cup、库存液体 2–3 cups、冷冻蔬菜 1 cup、鸡蛋 2 个；米和鸡肉在汤锅分阶段加热，鸡蛋另锅煮 8 分钟后加面。 | `cooked_rice_second_cook` + `extra_pan_or_steam`；不能升级为生米一锅或电饭煲做法。建议把旧 `page_open_blocked` 更新为 `opened`，保留预熟/另锅边界。 |
| `nsw-curried-vegetable-rice` / Quick curried vegetable rice | [NSW Government 原页](https://www.nsw.gov.au/health-and-wellbeing/healthy-living/healthy-eating/healthy-recipes/quick-curried-vegetable-rice) 已直接打开：4–6 份，米 1 cup、低盐蔬菜高汤 2 cups、胡萝卜、冷冻豌豆等；洋葱蒜炒香后加入胡萝卜、咖喱粉和米，再加高汤/豌豆盖锅焖 12–15 分钟，静置 8 分钟。 | `direct_one_pot` 普通锅，但官方标签是素食配菜、未含固定蛋白；营养定位为碳水+纤维，不能把它作为完整肉类主餐。建议从 `page_open_blocked` 更新为直接打开，状态仍不进生米电饭煲轮替。 |

## 去重与边界审计

1. MAFF 的 `かき飯`、`かきまでご飯`、`はらこ飯`、`鶏飯`、`たけのこご飯`、青森 `ごまご飯` 等本轮再次直接打开，但主目录已有对应条目；本文件只记为证据复核，不重复新增。
2. 新加坡 HealthHub 的 Nasi Kuning、Nasi Ulam、Chicken Briyani、Brown Rice Chicken Congee 等已在 r140 主目录；其预炒、半熟米、后拌或另锅边界继续有效，不因本轮复核重复计数。
3. `Chicken fried rice`、`Mujadarrah`、`Fried wild rice` 均以熟米为输入；“米饭”名称不能让它们进入生米轮替。未来若开启熟饭二次烹品类，仍需另建合同和安全边界。
4. `Microwave Risotto` 只有一个微波安全容器，但这只证明微波炉流程；`Multigrain congee` 原页虽写“可用电饭煲或慢炖锅”，没有型号/程序/水位合同，不能自行补为电饭煲标准做法。
5. `Oven baked biryani` 明确是烤箱+炉灶预处理；来源还声明改编自 Taste.com.au，入库时应分别记公共卫生页面的事实范围与第三方原始来源，不把改编页面当传统身份唯一证据。
6. 本批所有安全温度、机型参数、固定电饭煲程序和未写出的份数均保持 `null`；没有任何条目可晋升 `executable`。

## 本批结论

- **新增候选 7 条**：2 条普通/单容器主餐（微波烩饭、杂粮香菇粥），5 条熟饭二次烹/汤饭/烤箱边界候选；其中 4 条有完整核心数量与流程，仍未经过厨房验证。
- **既有候选证据升级 2 条**：NSW 蔬菜鸡肉粥、NSW 快手咖喱蔬菜饭从“页面受阻/摘要”变为直接原页可核查，但不改变其器具和米态边界。
- **本轮不改主目录、不新增 recipe、不调用运行时、不部署**。下一步若要入库，必须另写 TDD、确认许可与 canonical 去重、补来源定位，并经过现有 catalog/check-recipes 门禁；任何普通锅/微波炉/烤箱事实都不能被翻译成电饭煲合同。

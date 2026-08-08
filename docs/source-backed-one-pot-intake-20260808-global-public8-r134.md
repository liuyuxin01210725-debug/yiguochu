# 全球公共机构一锅米饭来源搜集 Intake（r134 · global-public8）

**研究日期**：2026-08-08
**去重基线**：主目录 `source-backed-one-pot-v1-20260808-global-r133`（906 条）；逐项对照 r119–r133 intake、主目录名称/别名和来源 URL。
**本批性质**：只写研究 intake，不修改主 JSON、CSV、运行时代码或 UI；不晋升 `executable`，不部署。
**来源范围**：公共医疗/营养机构、大学 Extension/医学中心、大学食育项目和专业营养组织的直达原页或 PDF。机构性质在表中明确，不把专业组织或医疗机构误称政府。

## 判定口径

- `direct_one_pot`：来源在同一锅/同一炊具中完成生米和主要配料；普通锅、平底锅、电饭煲、压力锅分别记录，不能把普通锅改写成电饭煲。
- `staged_or_extra_pan`：同锅但有取出/回锅、先煎后焖、或需要转移到另一器具；即使来源宣传“one-pot”，也保留真实阶段。
- `cooked_rice_second_cook`：从熟饭/即食米开始二次加热、焗烤或翻炒，单独留给未来熟饭品类，不进入当前生米轮替。
- `archive_or_blocked`：只能确认身份、或页面/PDF/图片关键事实不能直接核验；不把搜索摘要或邻页内容当成事实数字。

所有份数、数量、液体、时间、步骤和器具均按来源原文记录；来源未证明的字段保持缺失，不跨来源补猜。相同菜名或同一菜系的不同机构版本不自动合并，先做 canonical 审查。

## 新候选清单

| # | 建议 ID / 具名菜 | 地区 / 机构 | 直达来源与定位 | 来源实际证明 | 器具与边界 | 缺口 / 建议状态 |
|---:|---|---|---|---|---|---|
| 1 | `eatright-new-orleans-red-beans-rice-variant` / Easy One-Pot Red Beans and Rice | 美国；Academy of Nutrition and Dietetics（EatRight，注册营养师撰写/审阅） | [EatRight 原页](https://www.eatright.org/recipes/snacks-and-sides/easy-one-pot-red-beans-and-rice-recipe)，HTML lines 24–65 | 文章称为新奥尔良菜的一锅版本；½ lb 安杜伊香肠、洋葱、蒜、西芹、14½ oz 番茄、15 oz 红腰豆、1 cup 生糙米、青椒；2 cups 水；香肠与芳香料煎 4–6 分钟后加番茄/豆/水/米，煮沸后盖锅小火 45 分钟，关火加青椒焖 10 分钟。 | `direct_one_pot`，普通锅；同一锅完成生米和配料。 | 与目录已有象印 New Orleans Style Red Beans and Rice 属同一菜系/具名家族，不能直接当全新 canonical；作为独立来源变体保留，待 canonical 比较后决定是否合并。来源是专业营养组织，不是政府；状态 `recipe_fact_checked` 候选/`canonical_review_only`。 |
| 2 | `cleveland-clinic-chicken-brown-rice-casserole` / One-Pot Chicken and Brown Rice Casserole | 美国；Cleveland Clinic（非营利学术医疗中心） | [Cleveland Clinic 原页](https://health.clevelandclinic.org/one-pot-chicken-brown-rice-casserole-recipe?slug=one-pot-chicken-brown-rice-casserole-recipe%2F)，HTML lines 18–67 | 2 份；油、洋葱、蒜、西芹、红椒、菌菇、番茄、½ cup 未煮糙米、8 oz 鸡腿肉、2 cups 蔬菜高汤、姜黄、1 cup 冷冻四季豆。带盖汤锅中除四季豆外先煮沸，低火加盖约 35 分钟，再加四季豆焖 8–10 分钟；页面给营养值。 | `direct_one_pot`，普通汤锅；四季豆为后段投料，仍是同锅流程，不是电饭煲参数。 | 未给禽肉中心温度；高汤额外 ¼–½ cup 是“如需要”的条件量，不能固定化。可登记 `recipe_fact_checked`，安全合同仍缺。 |
| 3 | `bmc-chicken-carrots-brown-rice` / One-Pot Chicken, Carrots, and Rice | 美国；Boston Medical Center Teaching Kitchen | [BMC 原页](https://www.bmc.org/recipes/one-pot-chicken-carrots-and-rice)，HTML lines 157–205 | 页面给 4–6 人、总 60 分钟（准备 10、烹调 40）；洋葱 1 个、胡萝卜 4 根、蒜、油、无骨鸡腿 1 lb、干糙米 1 cup、肉汤 4 cups、草本和叶菜。先在煎锅炒洋葱/胡萝卜 5 分钟，加入鸡和蒜至上色，再加米和汤煮沸，转中低火加盖 30 分钟。沙拉是另列可选配菜，不并入主餐。 | `direct_one_pot`，单一煎锅；同锅完成生米、鸡肉、蔬菜。 | 页面 servings 文本同时出现“4–6 people”和营养区“5 servings”，应原样保留为范围，不擅自选一个；未给鸡肉中心温度。`recipe_fact_checked` 候选。 |
| 4 | `uci-chimichurri-chicken-cauliflower-rice` / One-Pot Chimichurri Chicken and Rice | 美国；UCI Health（大学医疗系统） | [UCI Health 原页](https://www.ucihealth.org/blog/2024/01/easy-one-pot-meals)，HTML lines 323–374 | 4 份；8 个带骨去皮鸡腿、洋葱、蒜、红椒、12 oz 花椰菜米、1 cup 长粒白米、1½ cups 鸡/蔬菜高汤、½ cup 冷冻豌豆；另有 chimichurri 调味汁。鸡腿每面煎 4–5 分钟后取出，同锅炒芳香料/红椒，加入花椰菜米、生米和高汤，鸡腿回锅后沸腾、加盖小火 20 分钟，最后加入豌豆和酱汁。 | `staged_or_extra_pan`；一只带盖煎锅/铸铁锅，但有取出/回锅，chimichurri 还需单独碗中静置至少 30 分钟；不改写成一次投料或电饭煲。 | 未给禽肉中心温度；鸡腿数量与米量比例是来源特定合同。状态 `recipe_fact_checked` 候选，需记录阶段和器具。 |
| 5 | `kidney-care-chicken-tikka-pulao` / Chicken tikka pulao | 英国；Kidney Care UK Kidney Kitchen（肾脏营养慈善机构，营养师审核） | [Kidney Care UK 原页](https://kidneycareuk.org/get-support/healthy-diet-support/kidney-kitchen/recipe-index/chicken-tikka-pulao/)，HTML lines 215–232、254–303 | 4 份、准备 5 分钟、烹调 40 分钟；巴斯马蒂米 300g、黄油 25g、洋葱、月桂叶、肉桂、姜黄、鸡胸 375–400g、tikka 咖喱酱 4 tbsp、低盐鸡汤 850ml、冷冻豌豆 200g、四季豆 200g、香菜。锅中炒洋葱/香料 10 分钟，鸡肉上色后加米和高汤，盖锅煮沸后低火，加入豌豆/四季豆，约 30 分钟煮熟。 | `direct_one_pot`，普通带盖锅；先炒再同锅焖，非电饭煲。来源明确称 South Asian one-pot rice dish。 | 未给鸡肉中心温度；页面含肾病营养用途与储存警告，不能把低钾/低盐标签外推为普遍健康结论。`recipe_fact_checked` 候选。 |
| 6 | `dartmouth-southwestern-chicken-casserole` / Southwestern Chicken Casserole | 美国；Dartmouth-Hitchcock / Dartmouth Health PDF（医院公共营养资料） | [Dartmouth PDF](https://www.dartmouth-hitchcock.org/sites/default/files/2026-02/southwestern-chicken-casserole.pdf)，PDF p.1 lines 0–49 | 6–8 份，份量 324g/1½ cup；油、孜然、辣椒粉、洋葱、红椒、墨西哥辣椒、短粒糙米 2 cups、低钠鸡汤 2 cups、黑豆 15 oz、番茄 14.5 oz、鸡胸约 1 lb、奶酪和香菜。荷兰锅/可入烤箱带盖锅先炒香料/蔬菜和米，加入豆、番茄、鸡汤，鸡肉置于上层，煮沸后 350°F 烤 40 分钟，视液体情况可再烤 10 分钟，出炉加奶酪静置。 | `staged_or_extra_pan`；同一荷兰锅但明确炉灶→烤箱阶段，不能外推电饭煲；来源还给普通汤锅用湿毛巾帮助蒸汽的提示，属于额外器具建议。 | 未给禽肉中心温度；烤箱温度和液体检查是硬边界，不能改写为电饭煲时间。`recipe_fact_checked` 候选。 |
| 7 | `incredible-egg-rice-bean-baked-eggs` / One-Pot Rice & Bean Baked Eggs | 美国；Incredible Egg / American Egg Board 公共营养资料 PDF | [Heart Health Handbook PDF](https://www.incredibleegg.org/wp-content/uploads/2024/02/Heart-Health-Handbook-CPEU.pdf)，PDF pp.13–14 lines 684–747 | 4 份；准备 15、烹调 20、总 35 分钟；洋葱、墨西哥辣椒、蒜、香料、黑豆 1 cup、玉米 ½ cup、番茄罐头 14 oz、**熟长粒糙米 2 cups**、4 个鸡蛋、香草、酸奶油和青柠。烤箱煎锅中炒香料和蔬菜，加入豆/玉米/番茄和熟米，挖 4 个坑放蛋，400°F 烤 10–12 分钟；页面注明 USDA 建议蛋黄和蛋白凝固。 | `cooked_rice_second_cook` + `staged_or_extra_pan`；熟米二次烹并转烤箱，非生米一锅，保留为未来熟饭/烤饭资料。 | 不得把熟米量改成生米；蛋熟度和烤箱温度必须保持。状态 `recipe_fact_checked` 但不进入当前生米轮替。 |
| 8 | `firststeps-jerk-chicken-rice-beans` / Jerk chicken with rice and beans | 英国；First Steps Nutrition Trust（公共婴幼儿/家庭营养公益机构） | [Eating Well Recipe Book PDF](https://www.firststepsnutrition.org/s/Eating-Well-Recipe-Book-for-web-10-Apr-2022-for-web.pdf)，PDF p.49 lines 1451–1502 | 4 个成人份；鸡胸约 200g、jerk 调味、油、洋葱、青椒、红腰豆罐头 410g（沥干 240g）、白米 200g、水 400ml。鸡肉腌 1 小时；大锅炒洋葱/青椒 2–3 分钟，鸡肉 2–3 分钟，加入豆、米和水煮沸，盖锅小火约 20 分钟至米吸干水、鸡肉和蔬菜熟。 | `direct_one_pot`，普通带盖锅；前置腌制是准备阶段，不是另锅；来源另有婴幼儿分开处理提示，不能删掉。 | 未给鸡肉中心温度；生米、罐装熟豆状态必须保留。`recipe_fact_checked` 候选，家庭营养来源。 |
| 9 | `firststeps-turkey-vegetable-pilaf` / Turkey and vegetable pilaf | 英国；First Steps Nutrition Trust | [Eating Well Recipe Book PDF](https://www.firststepsnutrition.org/s/Eating-Well-Recipe-Book-for-web-10-Apr-2022-for-web.pdf)，PDF p.51 lines 1503–1559 | 4 个成人份；油、蒜、干香草、bouillon、火鸡胸 200g、青椒、番茄、冷冻甜玉米 150g、白米 200g、水 400ml。大锅中先将火鸡和香料略煎至上色，加入蔬菜和米炒 1 分钟，倒水煮沸后盖锅小火约 15 分钟。 | `direct_one_pot`，普通带盖锅；同锅完成生火鸡、生米和蔬菜。来源给出“可替换肉/鱼/豆类”的建议，但不是本条固定合同。 | 未给火鸡安全中心温度；替换提示需单独结构化，不能把所有肉/鱼自动等价。`recipe_fact_checked` 候选。 |
| 10 | `firststeps-vegetable-biryani` / Vegetable biryani | 英国；First Steps Nutrition Trust | [Eating Well Recipe Book PDF](https://www.firststepsnutrition.org/s/Eating-Well-Recipe-Book-for-web-10-Apr-2022-for-web.pdf)，PDF p.53 lines 1560–1615 | 4 个成人份；油、咖喱粉、bouillon、洋葱、胡萝卜、土豆、冷冻豌豆 100g、花椰菜、罐装鹰嘴豆（沥干 240g）、白米 200g、水 400ml。大锅炒油/咖喱粉/洋葱，加入根茎、豆、米翻 1 分钟，加水盖锅小火约 20 分钟至米和蔬菜熟。 | `direct_one_pot`，普通带盖锅；同锅完成生米、蔬菜和熟豆。 | 未给营养分布或独立安全端点；土豆/花椰菜切块大小影响时间，不能擅自转换电饭煲程序。`recipe_fact_checked` 候选。 |
| 11 | `umich-one-pot-beans-rice` / One Pot Beans and Rice | 美国；University of Michigan MHealthy（大学员工健康项目） | [University of Michigan 原页](https://hr.umich.edu/node/158768)，HTML lines 8–65 | 页面给 6 份、1 cup 长粒米、2 cups 低钠蔬菜高汤、15.5 oz 黑豆、洋葱、墨西哥辣椒、蒜、孜然、香菜和青柠；带盖大汤锅中炒芳香料和米，加入高汤/豆后低火 15–20 分钟并焖几分钟。营养区给每杯热量、纤维和蛋白。 | `direct_one_pot`，普通汤锅；来源页面把它标为 Lunch/Side Dish/Plant-Based Protein，不能直接宣传为完整主餐。 | 作为“主餐/配菜边界”研究记录；未给额外蛋白，营养结构偏碳水+豆类蛋白。建议 `recipe_fact_checked` 候选但 `side_dish_review`。 |
| 12 | `illinois-extension-one-pot-jambalaya` / One-Pot Jambalaya | 美国；University of Illinois Extension | [Illinois Extension 原页](https://extension.illinois.edu/blogs/live-well-eat-well/2015-02-19-recipe-rescue-jambalaya)，HTML lines 77–142 | 12 份；香肠 ½ lb、鸡汤 2 cups、洋葱 2 个、青椒 2 个、蒜、调味番茄 28 oz、碎番茄 28 oz、干糙米 2 cups、熟鸡胸 3 cups、虾 1 lb。大锅煎香肠后取出，原锅炒洋葱/青椒/蒜，加番茄/高汤/米焖约 45–60 分钟，回锅香肠和鸡肉，最后加入虾再焖 5–10 分钟。 | `staged_or_extra_pan`；同一 stock pot 但明确取出香肠、鸡肉为熟态、虾后段投料；不是一次投料，也不是电饭煲。 | 页面同时记录原方与营养改良版，不能混拼；熟鸡和生虾安全边界、许可/归属需进一步审查。`recipe_fact_checked` 候选，先做版本 canonical 审查。 |

## 去重、排除与边界记录

1. EatRight 版本与目录已有 Zojirushi New Orleans Style Red Beans and Rice 是同一具名家族；本条只作为新来源变体，不建议未经 canonical 审查新增为第二条同名菜。
2. 本批没有重复 r130–r133 已纳入的 ASMI Pink Salmon Rice Bowls、MedlinePlus Chicken and Rice、URMC Smoky Hoppin’ John、USU Salsa Verde Chicken、UNL Chicken & Rice、OSU Cheesy Chicken Rice Vegetable Skillet、Illinois Arroz con Pollo、CU Caribbean Jerk Chicken & Rice；本批所有 URL 均未出现在主目录或这些 intake 的同一条记录中（同名跨机构仍需人工 canonical 判断）。
3. University of Michigan 页面把 Beans and Rice 标为 Side Dish；它可证明同锅米豆流程和营养结构，但不能因为有 6 份就自动作为完整主餐发布。
4. Incredible Egg 条目和 First Steps 的 Egg-fried rice（同一 PDF p.47）都以熟饭/另锅为前提；本批只收更完整、具名的 Rice & Bean Baked Eggs，保留在未来熟饭/烤饭分区，不进入当前生米轮替。
5. 普通锅、荷兰锅、煎锅和烤箱流程均不外推电饭煲。Dartmouth 的 350°F 烤箱阶段、UCI 的鸡腿取出/回锅、Illinois Jambalaya 的熟鸡/后段虾必须在任何后续结构化记录中保留。
6. 鸡/火鸡菜谱只要来源未给中心温度，就保持安全合同缺失；不从其他条目或食品安全网页跨来源补齐。来源给出的“煮熟/蛋白凝固”仍仅作为原文步骤事实。
7. First Steps Nutrition Trust 是公益营养机构而非政府；其 PDF 同一章节说明以 200g 干米为基础，并逐条给出 4 个成人份；若后续引用其替换建议，必须拆成显式 substitution，不得自由组合。

## 本批结论

- 共登记 **12 条去重研究记录**：`direct_one_pot` 6 条（EatRight 变体、Cleveland Clinic、BMC、Kidney Care UK、First Steps Jerk、First Steps Turkey、First Steps Vegetable Biryani、University of Michigan；其中 EatRight 需 canonical review，Michigan 标 side-dish），`staged_or_extra_pan` 3 条（UCI、Dartmouth、Illinois Jambalaya），`cooked_rice_second_cook` 1 条（Incredible Egg），其余均未将熟饭或另锅伪装成生米直达。
- **最值得下一轮事实矩阵**：Cleveland Clinic Chicken and Brown Rice Casserole（2 份、米/高汤/蔬菜/时间完整）、BMC Chicken, Carrots, and Rice（4–6 份、米/汤/流程/总时间）、Kidney Care UK Chicken Tikka Pulao（4 份、850ml 高汤、完整流程）、First Steps Turkey Pilaf（4 份、200g 米+400ml 水+15 分钟）、First Steps Vegetable Biryani（4 份、豆类/蔬菜/米/液体完整）。
- 这些条目仍处于研究候选层：下一步应做来源许可与归档、canonical 去重、安全合同审查，再决定是否进入主 JSON；本批没有修改主 JSON、CSV、运行时代码或 UI，未部署。

# 全球公共机构一锅米饭来源搜集 Intake（r127-public）

**研究日期**：2026-08-08
**去重基线**：主目录 `source-backed-one-pot-v1-20260808-global-r126`（890 条）；并逐项对照 r119–r126 intake。
**本批性质**：只写研究 intake，不修改主 JSON、CSV、运行时代码或 UI；不晋升 `executable`，不部署。
**来源范围**：中国大陆、台湾、香港、日本、韩国以外的政府机构、大学 Extension、公共卫生/营养机构及大学官方食育页面。所有候选均保留原始器具边界，不把普通锅、慢炖锅或熟饭回锅改写成电饭煲一锅。

## 判定口径

- `direct_one_pot`：来源明确在同一锅/同一炊具中完成生米（或米类）与主要配料；普通锅、平底锅、慢炖锅和压力锅分别记录，不能互相推导。
- `staged_or_extra_pan`：同一锅内有取出/回锅、预炒或另锅，或需要烤箱/填馅；可作为一锅饭家族研究材料，但不是“全投料直达”。
- `cooked_rice_second_cook`：以熟饭为起点再炒/拌/回锅；不进入当前生米轮替，单独留给未来“熟饭二次烹”。
- `archive`：原页无法直接打开、只有索引/摘要或关键字段仍不能复核；本批没有把搜索摘要数字写入候选事实。

所有份数、数量、液体、时间、步骤和器具均按来源原文记录；`null` 代表来源未证明，禁止跨来源补猜。营养结构只做“碳水/蛋白/蔬菜或纤维”事实提示，不把侧菜包装成完整主餐。

## 新候选清单

| # | 建议 ID / 具名菜 | 地区 / 机构 | 直达来源与定位 | 来源实际证明 | 器具与边界 | 缺口 / 建议状态 |
|---:|---|---|---|---|---|---|
| 1 | `usda-brown-rice-pilaf` / Brown Rice Pilaf | 美国；USDA Food and Nutrition Service SNAP-Ed | [USDA 原页](https://snaped.fns.usda.gov/node/1862)，HTML 行 85–107 | 4 份；糙米 1½ 杯、水 3 杯、杏仁 ¼ 杯、干欧芹 1 茶匙、蒜粉 ½ 茶匙、黑胡椒 ¼ 茶匙；原文要求全部放入 rice cooker，水吸收约 30 分钟后松饭。 | `direct_one_pot`；明确 rice cooker；没有把炉灶水量外推到电饭煲。 | 主要是米+坚果，页面定位为配鱼/鸡的配菜，蛋白与蔬菜不足；可作“米饭基底”资料，不宜单独宣称完整主餐。`recipe_fact_checked` 候选。 |
| 2 | `unh-spanish-rice` / Spanish Rice | 美国；University of New Hampshire Extension | [UNH Extension 原页](https://extension.unh.edu/recipe/spanish-rice)，HTML 行 70–121 | 6 份；米 ¾ 杯、黄油 1 大匙、罐装猪肉 ½ 罐、洋葱 ¾ 杯、西芹 ¼ 杯、青椒 ½ 杯、番茄罐头 28oz、水 1 杯及调味料；先在黄油中炒米，再加入肉/菜，最后加番茄、水和调味料，盖锅小火 45 分钟。每份给出蛋白 16g、纤维 3g。 | `direct_one_pot`；普通锅/带盖锅，同一锅分阶段；没有电饭煲参数。 | 来源自称可作 burrito/fajita 配菜，虽分类为 Entrée，产品展示需保留“完整度有限”提示；猪肉安全终点未给。`recipe_fact_checked` 候选。 |
| 3 | `sdsu-sunshine-rice` / Sunshine Rice | 美国；South Dakota State University Extension | [SDSU Extension PDF](https://extension.sdstate.edu/sites/default/files/2021-03/MC-02078.pdf)，PDF p.4，行 112–135 | 4 份；油 1½ 大匙、西芹 1¼ 杯、洋葱 1½ 杯、水 1 杯、橙汁 ½ 杯、柠檬汁 2 大匙、辣酱、长粒白米 1 杯、杏仁 ¼ 杯；中号锅炒蔬菜约 10 分钟，加液体煮沸，放米，盖锅焖至米软、液体吸收，拌杏仁。 | `direct_one_pot`；普通 saucepan；来源明确写“Only one pot”，但建议作为鱼类配菜。 | 没有肉/豆/蛋，主要是碳水+少量坚果；不做完整营养主餐承诺。`recipe_fact_checked` 候选。 |
| 4 | `illinois-governors-mansion-chicken-manoomin` / Chicken & Rice（Wild Rice/Manoomin） | 美国；Illinois Governor’s Mansion 官方食谱 | [Illinois Governor’s Mansion 原页](https://governorsmansion.illinois.gov/all-recipes/recipe.chicken-and-rice.html)，HTML 行 34–97 | 具名为 Chicken & Rice，明确称 hearty one-pot meal；鸡腿 2 只、胡萝卜 3 根、西芹 4 肋、洋葱、蒜、香草、鸡汤 2 qt、野米/Manoomin ½ 杯、欧芹或羽衣甘蓝；先在重锅煎鸡并取出，再炒蔬菜，回锅鸡肉和香草，加入高汤与米煮至米软。 | `staged_or_extra_pan`；同一重锅但有“取出/回锅”步骤；普通锅，不是电饭煲。 | 未给份数、总时长和禽肉温度；页面允许用兔肉替换，但本批不扩展替换。`recipe_fact_checked` 候选，待安全/份量闭合。 |
| 5 | `iastate-brown-rice-risotto` / Brown Rice Risotto | 美国；Iowa State University Extension Spend Smart Eat Smart | [Iowa State Extension 原页](https://spendsmart.extension.iastate.edu/recipe/brown-rice-risotto/)，HTML 行 99–132 | 4 份；油½大匙、洋葱½杯、蒜、胡椒、鸡汤¾杯、水¼杯、即食糙米¾杯、冷冻豌豆¾杯、柠檬汁、黄油、帕玛森；同一 saucepan 先炒香，加入汤/水/米煮 5 分钟，再加豌豆煮 5 分钟，加入调味和奶酪继续 4–5 分钟至浓稠；来源提示第三步可加入已全熟鸡/鱼/火腿/虾做一锅主餐。 | `direct_one_pot`（基础版本）；普通 saucepan；蛋白是后加的“全熟”选项，不把生肉当作同锅生投。 | 使用即食糙米，和生米焖饭不是同一比例；总时长需按步骤相加而非自行写单一值。基础版蛋白较低，加入熟蛋白才是主餐。`recipe_fact_checked` 候选。 |
| 6 | `uconn-crock-pot-enchilada-rice` / Crock Pot Enchilada Rice | 美国；University of Connecticut Husky Nutrition & Sport | [UConn 原页](https://huskynutritionsport.education.uconn.edu/recipes/crock-pot-enchilada-rice/)，HTML 行 172–213 | 6 份；番茄罐头 15oz、辣酱 10oz、青辣椒 4oz、蔬菜汤½杯、玉米 1 杯、黑豆 1 杯、奶油奶酪 4oz、未煮糙米 2 杯；全部放入慢炖锅，低档 7–8 小时或高档 3–4 小时，最后再高档 15–30 分钟使奶酪融合。营养列蛋白 10g、纤维 7g。 | `direct_one_pot`；明确 slow cooker/crock pot；不是电饭煲。 | “或更多汤”表示液体有开放边界，不能在结构化合同中擅自补固定值；慢炖时间范围保留。`recipe_fact_checked` 候选，另器具展示。 |
| 7 | `purdue-one-pot-lentil-brown-rice` / One-pot Lentil Dish | 美国；Purdue Extension / Indiana Emergency Food Resource Network | [Purdue Extension 原页](https://www.purdue.edu/indianasefrnetwork/Home/MDDetail/131)，HTML 行 29–49 | 页面标为 30–40 分钟省时菜；未煮扁豆 1 杯、糙米½杯、胡萝卜 2 杯、羽衣甘蓝 1 磅、水 3 杯、低钠洋葱汤料、罗勒、油；全部放大锅煮沸，转小火加盖，约 20–30 分钟至米软。 | `direct_one_pot`；普通大锅；同锅含碳水、豆类蛋白和大量叶菜，营养结构最接近本工具的完整一锅目标。 | 来源未给固定份数；罐装胡萝卜需最后加入的变体边界要保留；汤料钠含量需另查。`recipe_fact_checked` 候选。 |
| 8 | `wsu-asian-fried-rice` / Asian Fried Rice | 美国；Washington State University Extension / USDA SNAP-Ed | [WSU Extension PDF](https://wpcdn.web.wsu.edu/wp-snaped/uploads/sites/2/2018/12/asian-fried-rice.pdf)，PDF p.1 行 1–63 | 4 份；油 2 大匙、鸡蛋 2 个、冷冻豌豆胡萝卜 1 杯、**熟**糙米 4 杯、酱油 2 大匙、葱 2 根；平底锅炒蛋，加入熟饭、蔬菜和酱油，加热约 2 分钟。每份 340 kcal、蛋白 10g、纤维 5g。 | `cooked_rice_second_cook`；平底锅，明确以 cooked brown rice 为输入；不进入当前生米轮替。 | 这是结构完整、时间清楚的熟饭二次烹候选，后续应和“生米菜饭”分目录，不得被改写为生米炒饭。 |
| 9 | `ucr-pineapple-ham-fried-rice` / Pineapple Fried Rice | 美国；University of California Riverside Healthy Campus | [UCR 官方健康食谱 PDF](https://healthycampus.ucr.edu/sites/g/files/rcwecm2766/files/2019-08/hc_ucr-healthy-cookbook.pdf)，PDF p.71（抓取行 2718–2751） | 8 份（每份 1 杯）；糙米 4 杯先用 rice cooker（或其他方法）煮熟，再拌菠萝罐头、火腿片、蘑菇、洋葱和彩椒，按口味加酱油和酸甜酱；每份给 187 kcal、蛋白 5.4g、纤维 3.3g。 | `cooked_rice_second_cook`；先煮饭、后拌熟料，不是电饭煲同锅主餐。 | 两种酱料用量随手感，没有固定合同；页面明确标为 side，不能承诺完整主餐。 |
| 10 | `tamu-turkey-burrito-bowl` / Turkey Burrito Bowl | 美国；Texas A&M AgriLife Extension Dinner Tonight | [TAMU Extension 原页](https://dinnertonight.tamu.edu/recipe/turkey-burrito-bowl/)，HTML 行 28–32、51–112 | 10 份（每份 1 杯）；生火鸡肉 1 磅、长粒白米 1 杯、黑豆罐头 15oz、青辣椒 4oz、番茄罐头 15oz、低钠牛肉汤 2 杯、冷冻玉米 1½ 杯、洋葱/蒜/香料，另有奶酪和生菜；电压力锅先用 Sauté 炒火鸡/洋葱/蒜，加入米、豆、辣椒、番茄、汤和玉米，高压 8 分钟后快速泄压，页面称全程约 20 分钟。每份给蛋白 21g、纤维 5g。 | `direct_one_pot`；明确 electric pressure cooker / multi-function cooker；不是普通电饭煲，不能把高压 8 分钟改写成普通焖饭时间。 | 页面未给禽肉中心温度；压力锅放气和熟度仍需厨房验证。营养结构完整，是本批最贴近“米+蛋白+蔬菜/豆类”的候选。`recipe_fact_checked` 候选。 |
| 11 | `alabama-public-health-rice-pilaf` / Rice Pilaf | 美国；Alabama Department of Public Health | [Alabama Public Health cookbook PDF](https://www.alabamapublichealth.gov/npa/assets/cookbook.pdf)，PDF p.33，行 715–740 | 6 份；人造黄油 2 大匙、洋葱½杯、西芹¼杯、青/红椒½杯、鸡汤 2 杯、未煮长粒米 1 杯、鲜蘑菇½杯、欧芹和胡椒；先在小煎锅炒蔬菜 3 分钟，再把高汤和米放 saucepan，加入炒料和蘑菇，盖锅小火 30–40 分钟至液体吸收。 | `staged_or_extra_pan`；明确两个锅（小煎锅 + saucepan），不能标“单锅直投”。 | 配方没有肉/豆/蛋，属于配菜；普通锅参数，不外推电饭煲。`recipe_fact_checked` 候选但不进入主餐轮替。 |

## 去重、排除与边界记录

1. 本批按 r126 主目录和 r119–r126 intake 做了名称、别名、来源 URL 与家族去重。`Jambalaya` 已在主目录有 `tiger-jambalaya-rice-cooker`，Illinois Extension 的 [Recipe Rescue: Jambalaya](https://extension.illinois.edu/blogs/live-well-eat-well/2015-02-19-recipe-rescue-jambalaya) 虽提供一套不同的普通锅用量（12 份、棕米、香肠、熟鸡和虾），本批不把它冒充新 canonical；可作为同名来源变体审查。
2. `USDA Brown Rice Pilaf` 与 N.C. Extension/USDA 的杏仁米饭类页面可能是同一公共配方家族；本批保留 USDA 直接原页作为唯一强证版本，正式入库前仍要做 canonical 合并。
3. `cooked_rice_second_cook`（WSU Asian Fried Rice、UCR Pineapple Fried Rice）不进入当前生米轮替；它们的熟饭前置、平底锅回锅步骤和生米/电饭煲基础页都要分开记录。
4. `staged_or_extra_pan`（Illinois Chicken & Rice、Alabama Rice Pilaf）不因“只用一口锅/先后阶段”而改称直投；尤其鸡肉取出/回锅、先煎蔬菜再入 saucepan 均是合同事实。
5. 普通锅、慢炖锅、平底锅的水量和时间不转换为电饭煲程序。只有来源明确写出电饭煲且事实字段可直接核对时，才可进入“电饭煲候选”；本批只有 USDA Brown Rice Pilaf 明确 rice cooker，且它本身是配菜，不能代表完整主餐。
6. 资料层不等于厨房批准：本批没有任何条目晋升 `executable` 或 `kitchen_observed`，所有安全温度、份量和电饭煲适配缺口继续保留。

## 本批结论

- 共登记 **11 条独立候选记录**（其中 9 条可作为新 canonical/来源版本候选，2 条是熟饭二次烹）。按主边界计：`direct_one_pot` 7 条、`staged_or_extra_pan` 2 条、`cooked_rice_second_cook` 2 条。
- 最值得进入下一轮事实矩阵的是：TAMU Turkey Burrito Bowl（生火鸡+米+豆+玉米，电压力锅合同较完整）、Purdue One-pot Lentil Dish（碳水+豆类蛋白+叶菜，普通锅）、UConn Crock Pot Enchilada Rice（份数/时间/营养完整，慢炖锅）、UNH Spanish Rice（肉+蔬菜+米，45 分钟）和 Illinois Governor’s Mansion Chicken & Rice（野米主餐但需补份数/禽肉安全）。
- USDA Brown Rice Pilaf 的 rice-cooker 事实最完整，但营养结构偏配菜；不应因为“电饭煲”标签就绕过营养完整性门槛。
- 本批未修改主 JSON、CSV、运行时代码或 UI，未部署；下一步应先做名称合并、来源许可/归档与安全合同审查，再决定是否进入 r128 事实矩阵。

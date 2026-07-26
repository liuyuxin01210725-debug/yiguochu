<!-- Generated file: edit tools/data/northwest-one-pot-research.v1.json and rebuild. -->

# 西北一锅主餐研究覆盖层

> 这是研究覆盖层，不是生产菜谱。本轮没有增加或修改生产 recipe、候选、Planner、Ratio DSL 或运行时代码。

- 地域：西北（CN-SN、CN-GS、CN-NX、CN-XJ）
- 生产菜谱审计：3
- 现有候选审计：0
- 独立研究线索：8
- 来源：20（A 级 16，B 级 3，C 级 1）
- 家庭旅程：16（已人工评审 0）
- 当前状态：research_in_progress
- 阻塞项：production_evidence_gaps、ratio_dsl_unresolved、household_vessel_adaptation_unresolved、safety_endpoint_incomplete、human_journey_review_incomplete

核心纠偏：陕北腊八软粮使用的软米、软谷米或软黄米不自动等于项目中的普通白米；普通白米只能诚实标为家庭适配，不能宣称传统等价。新疆羊肉抓饭有分阶段羊肉、胡萝卜、洋葱与生米结构的证据，而素抓饭只证实存在分支，不证明当前鹰嘴豆家庭配方或自由替换槽。甘肃、宁夏与新疆的面片／汤饭均只保留各自来源直接支持的身份和结构，彼此不互相证明精确配方、地域身份或单锅等价。

工艺与排除边界：搅团需要持续手工搅拌，不能改写成无人看管电器；宁夏肉粘饭是肉菜先炒、再与米同蒸，不能泛化为任意肉饭焖煮。烩小吃因预制组件与低摩擦家庭锅边界不清而排除；馓饭／糁饭的命名争议不新建熬饭家族；八宝茶不是本轮一锅主餐对象，和烩小吃一并保持排除。

## 1. 四个节点的真实覆盖

| 节点 | 生产 | 候选 | 研究线索 | 地图问题 |
| --- | --- | --- | --- | --- |
| 陕西（CN-SN） | shaanbei-red-date-cowpea-rice | — | huayin-mashi-pao、xifu-jiaotuan-seasoned-bowl | 整理陕西陕北豆饭、杂粮焖饭和面片锅的地域技法。 |
| 甘肃（CN-GS） | — | — | gansu-heyan-jiumianpian-broth、huaining-mixed-grain-jiaotuan | 核实甘肃面片、熬饭和杂粮饭的一锅主餐原型。 |
| 宁夏（CN-NX） | — | — | ningxia-rouzhanfan-steamed-rice、ningxia-shengcuan-jiumian-bowl | 核实宁夏羊肉饭、回族主食锅与杂粮同锅结构。 |
| 新疆（CN-XJ） | xinjiang-lamb-pilaf、xinjiang-vegetable-pilaf | — | turpan-soup-rice-technique、xinjiang-household-jupianzi-soup | 整理新疆抓饭中羊肉与素抓饭的共享比例、技法和替换边界。 |

## 2. 三道生产菜谱证据审计

| 菜谱 | 状态 | 核心食材 | 证据结论 | 禁止主张 | 决策 |
| --- | --- | --- | --- | --- | --- |
| 陕北红枣豇豆焖饭（shaanbei-red-date-cowpea-rice） | auto_approved / needs_manual_review | 大米、去核红枣、豇豆 | soft_grain_date_bean_identity：supported<br>ordinary_rice_adaptation：not_proven<br>project_ratio_time_vessel：not_proven | ordinary_rice_as_traditional_equivalence、pitted_date_as_source_fact、source_as_ratio_dsl | 传统身份可审计，项目替换和数值待人工复核。 |
| 新疆羊肉抓饭（xinjiang-lamb-pilaf） | auto_approved / needs_manual_review | 羊腿肉、洋葱、胡萝卜、大米 | staged_lamb_carrot_onion_rice_structure：supported<br>named_lamb_cut_and_fruit_slots：not_proven<br>project_ratio_time_safety：not_proven | lamb_shoulder_as_source_fact、free_fruit_nut_slot、source_as_ratio_dsl | 可保留阶段结构，不能把具名分支抽象为自由槽。 |
| 新疆素抓饭（xinjiang-vegetable-pilaf） | auto_approved / needs_more_evidence | 大米、洋葱、胡萝卜 | vegetarian_pilaf_existence：supported<br>current_formula_equivalence：not_proven | household_formula_as_traditional_formula、free_carrot_color_slot | 只能诚实标注为素抓饭风格家庭适配。 |

## 3. 候选账本基线

当前西北节点没有既有候选可审计；“0 candidates”是基线事实，不以虚构候选补齐。

## 4. 八条独立研究线索

| 线索 | 家族与餐型 | 关键形态 | 证据结论 | 禁止捷径 |
| --- | --- | --- | --- | --- |
| 甘肃河沿揪面片汤（gansu-heyan-jiumianpian-broth，CN-GS） | noodle-piece-broth-main-bowl / noodle_pieces_in_saozi_broth | hand_pulled_noodle_piece、saozi_broth | heyan_ich_identity：supported<br>noodle_piece_broth_structure：supported<br>heyan_exact_recipe：not_proven<br>single_pot_equivalence：not_proven | ich_listing_as_recipe、single_pot_equivalence |
| 甘肃会宁杂粮搅团（huaining-mixed-grain-jiaotuan，CN-GS） | stirred-grain-thick-main-bowl / mixed_grain_flour_manually_stirred_thick_bowl | mixed_grain_flour、stirred_thick_mass | manual_stirred_grain_structure：supported<br>unattended_appliance_equivalence：not_proven | unattended_appliance_equivalence |
| 陕西华阴麻食泡（huayin-mashi-pao，CN-SN） | noodle-piece-broth-main-bowl / mashi_pao_local_presence_broth_process_unresolved | mashi_body_unresolved、tofu、vermicelli、guokui_piece | huayin_local_presence：supported<br>cross_locality_shape_not_proven：not_proven<br>single_pot_equivalence：not_proven | cross_locality_shape_equivalence、single_pot_equivalence |
| 宁夏肉粘饭炒后同蒸（ningxia-rouzhanfan-steamed-rice，CN-NX） | pre-saute-meat-vegetable-steamed-rice / meat_vegetable_pre_saute_then_steam_with_rice | beef_or_lamb、onion、carrot、rice | pre_saute_then_steam_structure：supported<br>any_meat_rice_braise_equivalence：not_proven | any_meat_rice_braise_equivalence |
| 宁夏生汆揪面主食碗（ningxia-shengcuan-jiumian-bowl，CN-NX） | noodle-piece-broth-main-bowl / poached_lamb_meatball_and_noodle_pieces_in_broth | lamb_meatball、hand_pulled_noodle_piece、broth、spinach | shengcuan_meatball_noodle_piece_structure：supported<br>all_noodle_piece_branches_one_recipe：not_proven<br>meat_under_cooking：not_proven | branch_collapse、undercooked_meat |
| 新疆吐鲁番汤饭技艺（turpan-soup-rice-technique，CN-XJ） | noodle-piece-broth-main-bowl / turpan_soup_rice_ich_identity_recipe_unresolved | soup_rice_technique_unresolved | turpan_ich_identity：supported<br>protection_unit：supported<br>recipe_formula：not_proven | ich_listing_as_recipe |
| 陕西西府搅团配调味汤（xifu-jiaotuan-seasoned-bowl，CN-SN） | stirred-grain-thick-main-bowl / flour_stirred_into_boiling_water_then_seasoned_bowl | grain_flour、thick_stirred_mass、separate_seasoning_soup | stirred_thick_mass_and_separate_seasoning：supported<br>single_vessel_complete_meal：not_proven<br>project_ratio_safety：not_proven | unattended_appliance_equivalence、single_vessel_equivalence |
| 新疆家常揪片子汤饭（xinjiang-household-jupianzi-soup，CN-XJ） | noodle-piece-broth-main-bowl / dough_pieces_in_lamb_vegetable_soup | dough_piece、lamb、vegetable、soup | household_soup_noodle_piece_description：supported<br>exclusive_regional_identity：not_proven<br>project_ratio_safety：not_proven | exclusive_identity_claim、source_as_ratio_dsl |

## 5. 五个不能混写的家族

| 家族 | 结构 | 证据状态 |
| --- | --- | --- |
| 节令软谷物红枣豆类焖饭（festive-soft-grain-date-bean-braise） | soft_grain_date_bean_braise | supported_with_boundaries |
| 生米分阶段抓饭（staged-pilaf-raw-rice） | saute_base_then_raw_rice_braise | supported_with_boundaries |
| 面片汤主食碗（noodle-piece-broth-main-bowl） | dough_or_noodle_pieces_in_broth | supported_with_boundaries |
| 搅制杂粮稠主食碗（stirred-grain-thick-main-bowl） | grain_flour_stirred_into_thick_mass | supported_with_boundaries |
| 肉菜预炒后同蒸饭（pre-saute-meat-vegetable-steamed-rice） | pre_saute_then_steam_rice | supported_with_boundaries |

## 6. Claim 与食材形态矩阵

| 对象 | claim | 结论 | 来源 | 理由 |
| --- | --- | --- | --- | --- |
| concrete_research_lead:gansu-heyan-jiumianpian-broth | heyan_exact_recipe | not_proven | gs-kangle-noodle-2017、gs-linxia-ich-2024 | 非遗名录和相邻结构不等于河沿精确配方。 |
| concrete_research_lead:gansu-heyan-jiumianpian-broth | heyan_ich_identity | supported | gs-linxia-ich-2024 | 河沿面片烹制技艺有非遗名录身份。 |
| concrete_research_lead:gansu-heyan-jiumianpian-broth | noodle_piece_broth_structure | supported | gs-kangle-noodle-2017 | 康乐资料支持面片汤的相近家常结构。 |
| concrete_research_lead:gansu-heyan-jiumianpian-broth | single_pot_equivalence | not_proven | gs-kangle-noodle-2017 | 资料不证明本项目单锅适配。 |
| concrete_research_lead:huaining-mixed-grain-jiaotuan | manual_stirred_grain_structure | supported | gs-huining-jiaotuan-2025 | 来源支持杂粮粉锅中搅制及多分支。 |
| concrete_research_lead:huaining-mixed-grain-jiaotuan | unattended_appliance_equivalence | not_proven | gs-huining-jiaotuan-2025 | 手工搅制不证明无人看管电器等价。 |
| concrete_research_lead:huayin-mashi-pao | cross_locality_shape_not_proven | not_proven | sn-huayin-mashi-undated、sn-lantian-mashi-2012 | 蓝田形态不能直接迁移到华阴。 |
| concrete_research_lead:huayin-mashi-pao | huayin_local_presence | supported | sn-huayin-mashi-undated | 来源支持华阴在地风味和可见配料。 |
| concrete_research_lead:huayin-mashi-pao | single_pot_equivalence | not_proven | sn-huayin-mashi-undated | 展示配料不证明单锅过程。 |
| concrete_research_lead:ningxia-rouzhanfan-steamed-rice | any_meat_rice_braise_equivalence | not_proven | nx-rouzhanfan-2022 | 此结构不等于任意肉饭焖煮均可称肉粘饭。 |
| concrete_research_lead:ningxia-rouzhanfan-steamed-rice | pre_saute_then_steam_structure | supported | nx-rouzhanfan-2022 | 来源支持炒后同蒸的肉粘饭结构。 |
| concrete_research_lead:ningxia-shengcuan-jiumian-bowl | all_noodle_piece_branches_one_recipe | not_proven | nx-shengcuan-2025 | 多个面片分支不能合成一个固定配方。 |
| concrete_research_lead:ningxia-shengcuan-jiumian-bowl | meat_under_cooking | not_proven | nx-shengcuan-2025、nx-lamb-safety-2025 | 来源不允许借汆制主张羊肉未熟。 |
| concrete_research_lead:ningxia-shengcuan-jiumian-bowl | shengcuan_meatball_noodle_piece_structure | supported | nx-shengcuan-2025 | 来源直接支持汆羊肉丸、揪面片和汤菜结构。 |
| concrete_research_lead:turpan-soup-rice-technique | protection_unit | supported | xj-turpan-protection-2025 | 通知支持保护单位信息。 |
| concrete_research_lead:turpan-soup-rice-technique | recipe_formula | not_proven | xj-turpan-ich-2025、xj-turpan-protection-2025 | 名录和保护单位不提供配方。 |
| concrete_research_lead:turpan-soup-rice-technique | turpan_ich_identity | supported | xj-turpan-ich-2025 | 来源支持汤饭制作技艺非遗身份。 |
| concrete_research_lead:xifu-jiaotuan-seasoned-bowl | project_ratio_safety | not_proven | sn-xifu-jiaotuan-2025 | 没有项目比例与安全终点。 |
| concrete_research_lead:xifu-jiaotuan-seasoned-bowl | single_vessel_complete_meal | not_proven | sn-xifu-jiaotuan-2025 | 分开调味汤不证明完整单锅主餐。 |
| concrete_research_lead:xifu-jiaotuan-seasoned-bowl | stirred_thick_mass_and_separate_seasoning | supported | sn-xifu-jiaotuan-2025 | 来源直接支持搅制稠团与另行调味汤。 |
| concrete_research_lead:xinjiang-household-jupianzi-soup | exclusive_regional_identity | not_proven | xj-jupianzi-household-2025 | 描述不构成排他地域身份。 |
| concrete_research_lead:xinjiang-household-jupianzi-soup | household_soup_noodle_piece_description | supported | xj-jupianzi-household-2025 | 来源描述家常面片入羊肉蔬菜汤。 |
| concrete_research_lead:xinjiang-household-jupianzi-soup | project_ratio_safety | not_proven | xj-jupianzi-household-2025 | 无项目比例或安全终点。 |
| production_recipe:shaanbei-red-date-cowpea-rice | ordinary_rice_adaptation | not_proven | sn-mizhi-laba-2017、sn-shaanxi-daily-laba-2020、sn-samr-broomcorn-millet-undated | 普通大米不能被写成传统软谷物等价。 |
| production_recipe:shaanbei-red-date-cowpea-rice | project_ratio_time_vessel | not_proven | sn-mizhi-laba-2017、sn-shaanxi-daily-laba-2020、sn-cdc-bean-safety-2018 | 来源不证明项目液体、分钟或家用锅具。 |
| production_recipe:shaanbei-red-date-cowpea-rice | soft_grain_date_bean_identity | supported | sn-mizhi-laba-2017、sn-shaanxi-daily-laba-2020 | 地方志材料支持传统身份与核心组合。 |
| production_recipe:xinjiang-lamb-pilaf | named_lamb_cut_and_fruit_slots | not_proven | xj-pilaf-gov-undated、xj-tourism-flavor-2019 | 具名分支不等于自由替换槽。 |
| production_recipe:xinjiang-lamb-pilaf | project_ratio_time_safety | not_proven | xj-pilaf-gov-undated | 来源不提供项目比例、时间或熟制终点。 |
| production_recipe:xinjiang-lamb-pilaf | staged_lamb_carrot_onion_rice_structure | supported | xj-pilaf-gov-undated、xj-tourism-flavor-2019 | 官方资料支持分阶段抓饭结构。 |
| production_recipe:xinjiang-vegetable-pilaf | current_formula_equivalence | not_proven | xj-ts-pilaf-2025 | 现有洋葱、胡萝卜、鹰嘴豆配方是家庭适配，不是已证传统公式。 |
| production_recipe:xinjiang-vegetable-pilaf | vegetarian_pilaf_existence | supported | xj-ts-pilaf-2025 | 来源支持素抓饭分支存在。 |

| 形态 | 生产 | 候选 | 线索 | 来源层 |
| --- | --- | --- | --- | --- |
| beef_or_lamb | — | — | ningxia-rouzhanfan-steamed-rice | concrete_research_lead |
| broth | — | — | ningxia-shengcuan-jiumian-bowl | concrete_research_lead |
| carrot | xinjiang-lamb-pilaf | — | ningxia-rouzhanfan-steamed-rice | concrete_research_lead、production_recipe |
| cowpea | shaanbei-red-date-cowpea-rice | — | — | production_recipe |
| date | shaanbei-red-date-cowpea-rice | — | — | production_recipe |
| dough_piece | — | — | xinjiang-household-jupianzi-soup | concrete_research_lead |
| grain_flour | — | — | xifu-jiaotuan-seasoned-bowl | concrete_research_lead |
| guokui_piece | — | — | huayin-mashi-pao | concrete_research_lead |
| hand_pulled_noodle_piece | — | — | gansu-heyan-jiumianpian-broth、ningxia-shengcuan-jiumian-bowl | concrete_research_lead |
| lamb | xinjiang-lamb-pilaf | — | xinjiang-household-jupianzi-soup | concrete_research_lead、production_recipe |
| lamb_meatball | — | — | ningxia-shengcuan-jiumian-bowl | concrete_research_lead |
| mashi_body_unresolved | — | — | huayin-mashi-pao | concrete_research_lead |
| mixed_grain_flour | — | — | huaining-mixed-grain-jiaotuan | concrete_research_lead |
| onion | xinjiang-lamb-pilaf | — | ningxia-rouzhanfan-steamed-rice | concrete_research_lead、production_recipe |
| raw_rice | xinjiang-lamb-pilaf、xinjiang-vegetable-pilaf | — | — | production_recipe |
| rice | — | — | ningxia-rouzhanfan-steamed-rice | concrete_research_lead |
| saozi_broth | — | — | gansu-heyan-jiumianpian-broth | concrete_research_lead |
| separate_seasoning_soup | — | — | xifu-jiaotuan-seasoned-bowl | concrete_research_lead |
| soft_grain | shaanbei-red-date-cowpea-rice | — | — | production_recipe |
| soup | — | — | xinjiang-household-jupianzi-soup | concrete_research_lead |
| soup_rice_technique_unresolved | — | — | turpan-soup-rice-technique | concrete_research_lead |
| spinach | — | — | ningxia-shengcuan-jiumian-bowl | concrete_research_lead |
| stirred_thick_mass | — | — | huaining-mixed-grain-jiaotuan | concrete_research_lead |
| thick_stirred_mass | — | — | xifu-jiaotuan-seasoned-bowl | concrete_research_lead |
| tofu | — | — | huayin-mashi-pao | concrete_research_lead |
| vegetable | — | — | xinjiang-household-jupianzi-soup | concrete_research_lead |
| vegetable_pilaf_style | xinjiang-vegetable-pilaf | — | — | production_recipe |
| vermicelli | — | — | huayin-mashi-pao | concrete_research_lead |

## 7. 固定来源证据包

| 来源 | 等级 | 直接证明 | 不证明 |
| --- | --- | --- | --- |
| [米脂饮食文化](https://dfz.shaanxi.gov.cn/zslm/sxsq/msfq/201704/t20170421_2620781.html)（陕西省地方志办公室，2017-04-21） | A | production:shaanbei-red-date-cowpea-rice:soft_grain_date_bean_identity | production:shaanbei-red-date-cowpea-rice:ordinary_rice_adaptation、production:shaanbei-red-date-cowpea-rice:project_ratio_time_vessel |
| [腊八饭里的陕西年味](https://dfz.shaanxi.gov.cn/zslm/zjyd/fzsy/202001/t20200106_2623780.html)（陕西省地方志办公室（转载陕西日报），2020-01-06） | A | production:shaanbei-red-date-cowpea-rice:soft_grain_date_bean_identity | production:shaanbei-red-date-cowpea-rice:ordinary_rice_adaptation、production:shaanbei-red-date-cowpea-rice:project_ratio_time_vessel |
| [黍米](https://std.samr.gov.cn/gb/search/gbDetailed?id=8DD7C7A454B45AF7E05397BE0A0A58C1)（国家标准信息公共服务平台，undated） | A | — | production:shaanbei-red-date-cowpea-rice:ordinary_rice_adaptation |
| [搅团](https://dfz.shaanxi.gov.cn/zslm/sxsq/sxms/202505/t20250522_3521494.html)（陕西省地方志办公室，2025-05-22） | A | lead:xifu-jiaotuan-seasoned-bowl:stirred_thick_mass_and_separate_seasoning | lead:xifu-jiaotuan-seasoned-bowl:single_vessel_complete_meal、lead:xifu-jiaotuan-seasoned-bowl:project_ratio_safety |
| [华山简介](https://weinan.qinfeng.gov.cn/info/1095/36343.htm)（中共渭南市纪委监委网站，undated） | B | lead:huayin-mashi-pao:huayin_local_presence | lead:huayin-mashi-pao:cross_locality_shape_not_proven、lead:huayin-mashi-pao:single_pot_equivalence |
| [蓝田方言](https://dfz.shaanxi.gov.cn/zslm/sxsq/msfq/201210/t20121029_2620433.html)（陕西省地方志办公室，2012-10-29） | A | — | lead:huayin-mashi-pao:cross_locality_shape_not_proven |
| [豆类蔬菜中哪些豆豆易中毒](https://niohp.chinacdc.cn/kpdw/zdkz/201806/t20180601_172888.htm)（中国疾控中心职业卫生与中毒控制所，2018-06-01） | A | safety:fresh_bean_cook_through:principle | production:shaanbei-red-date-cowpea-rice:project_ratio_time_vessel |
| [康乐传统美食](https://www.gskanglexian.gov.cn/klx/klly/tsms/KLCTMS/art/2022/art_015d1891273e4070a60b68001ef2109a.html)（康乐县人民政府，2017-12-10） | A | lead:gansu-heyan-jiumianpian-broth:noodle_piece_broth_structure | lead:gansu-heyan-jiumianpian-broth:heyan_exact_recipe、lead:gansu-heyan-jiumianpian-broth:single_pot_equivalence |
| [临夏州公布第六批州级非物质文化遗产代表性项目名录](https://xgs.newgscloud.com/pages/2024/08/02/97af560785214aca940ee806f0509fbb.html)（新甘肃/甘肃日报，2024-08-02） | A | lead:gansu-heyan-jiumianpian-broth:heyan_ich_identity | lead:gansu-heyan-jiumianpian-broth:heyan_exact_recipe |
| [这碗会宁搅团，藏着黄土高原千年的饮食记忆](https://www.huining.gov.cn/xxgk/xzxxgk/gcyz/fdzdgknr/cwgk/xcsq/cwgk/art/2025/art_13edb2bf82d54c5185daca9c3fe0b60c.html)（会宁县融媒体中心/会宁电视台，2025-12-11） | A | lead:huaining-mixed-grain-jiaotuan:manual_stirred_grain_structure | lead:huaining-mixed-grain-jiaotuan:unattended_appliance_equivalence |
| [“糁饭”还是“馓饭”？看天水学者怎么辩！](https://gansu.gscn.com.cn/system/2019/03/15/012129101.shtml)（中国甘肃网，2019-03-15） | C | boundary:sanfan_dispute_not_family:naming_dispute | — |
| [宁夏的生汆面，有一些专属浪漫。](https://nynct.nx.gov.cn/rdzt/ppny/202504/t20250423_4889376.html)（宁夏回族自治区农业宣传教育展览中心，2025-04-23） | A | lead:ningxia-shengcuan-jiumian-bowl:shengcuan_meatball_noodle_piece_structure | lead:ningxia-shengcuan-jiumian-bowl:all_noodle_piece_branches_one_recipe、lead:ningxia-shengcuan-jiumian-bowl:meat_under_cooking |
| [不尝一次宁夏大米，难以给胃一个交代！](https://nynct.nx.gov.cn/rdzt/ppny/202211/t20221103_3829781.html)（宁夏农业农村厅农宣中心，2022-11-03） | A | lead:ningxia-rouzhanfan-steamed-rice:pre_saute_then_steam_structure | lead:ningxia-rouzhanfan-steamed-rice:any_meat_rice_braise_equivalence |
| [食品安全消费提示](https://www.xiongan.gov.cn/20250429/7cbd00ffe7bd45668510b7f9fecbdd5d/c.html)（雄安新区综合执法局，2025-04-29） | A | safety:animal_food_cook_through_and_separate:principle | lead:ningxia-shengcuan-jiumian-bowl:meat_under_cooking |
| [新疆抓饭](https://www.xinjiang.gov.cn/xinjiang/tsxj/201111/358fd2c0b97841bba6513661c11d770c.shtml)（新疆维吾尔自治区人民政府，undated） | A | production:xinjiang-lamb-pilaf:staged_lamb_carrot_onion_rice_structure | production:xinjiang-lamb-pilaf:named_lamb_cut_and_fruit_slots、production:xinjiang-lamb-pilaf:project_ratio_time_safety |
| [新疆味道](https://wlt.xinjiang.gov.cn/wlt/wlgl/201911/d45cbf5fae3241bfa10544b276418ba7.shtml)（新疆维吾尔自治区文化和旅游厅（转载新疆日报），2019-11-08） | A | production:xinjiang-lamb-pilaf:staged_lamb_carrot_onion_rice_structure | production:xinjiang-lamb-pilaf:named_lamb_cut_and_fruit_slots |
| [“新”上好物｜抓饭：粒粒飘香](https://www.ts.cn/xwzx/shxw/202409/t20240923_23975204.shtml)（天山网，2025-01-12） | B | production:xinjiang-vegetable-pilaf:vegetarian_pilaf_existence | production:xinjiang-vegetable-pilaf:current_formula_equivalence |
| [第六批自治区级非遗代表性项目名录](https://www.xinjiang.gov.cn/xinjiang/zfgbml/202512/6e77e41eec4e487da460e81d7017c9f0.shtml)（新疆维吾尔自治区人民政府，2025-11-15） | A | lead:turpan-soup-rice-technique:turpan_ich_identity | lead:turpan-soup-rice-technique:recipe_formula |
| [保护单位通知](https://wlt.xinjiang.gov.cn/wlt/tzgg/202510/48022b058ad94f8da334a2c6ffaa0c79.shtml)（新疆维吾尔自治区文化和旅游厅，2025-10-14） | A | lead:turpan-soup-rice-technique:protection_unit | lead:turpan-soup-rice-technique:recipe_formula |
| [从新疆美食探源到味觉文化基因认同](https://www.ts.cn/xwzx/whxw/202512/t20251202_31829236.shtml)（天山网/新疆日报，2025-12-02） | B | lead:xinjiang-household-jupianzi-soup:household_soup_noodle_piece_description | lead:xinjiang-household-jupianzi-soup:exclusive_regional_identity、lead:xinjiang-household-jupianzi-soup:project_ratio_safety |

## 8. 家庭适配与安全边界

本轮只记录具名工艺、食材形态和熟制原则，不编造克数、液体、火力、分钟数或电器程序。面片／汤饭、搅团、抓饭和肉粘饭均不得越界改写为已验证的家庭单锅方案。

| 边界 | 状态 | 说明 |
| --- | --- | --- |
| soft_grain_not_ordinary_rice | not_proven | 软米、软谷米、软黄米不自动等于普通大米。 |
| jiaotuan_not_unattended_appliance | not_proven | 手工持续搅制不能写成无人看管电器等价。 |
| huayin_cross_locality_and_single_pot_unproven | not_proven | 蓝田麻食子形态不证明华阴麻食泡，展示配料不证明单锅。 |
| heyan_ich_not_recipe | not_proven | 河沿非遗名录不构成可执行配方。 |
| sanfan_dispute_not_family | not_proven | 糁饭或馓饭的命名争议不新建熬饭家族。 |
| shengcuan_branches_not_one_recipe | not_proven | 生汆面的多种面片分支不合并为一个固定公式。 |
| rouzhanfan_not_any_meat_rice_braise | not_proven | 肉粘饭炒后同蒸不等于任意肉饭焖煮。 |
| pilaf_named_branches_not_free_slots | not_proven | 抓饭具名羊肉、果干和素食分支不产生自由替换槽。 |
| turpan_ich_not_recipe | not_proven | 吐鲁番汤饭非遗身份与保护单位不提供配方。 |
| fresh_bean_cook_through | principle_only | 不从来源发明分钟数。；控制：易中毒鲜豆类充分熟制 |
| animal_food_cook_through_and_separate | principle_only | 不从来源发明统一温度或分钟。；控制：牛羊肉彻底熟制、防止生熟交叉污染 |

## 9. 产品去向决策

| 类型 | 对象 | 状态 | 允许方向 | 未决边界 |
| --- | --- | --- | --- | --- |
| concrete_research_lead | gansu-heyan-jiumianpian-broth | research_only | new_family_research、research_only | 身份和同类结构分开记录。 |
| concrete_research_lead | huaining-mixed-grain-jiaotuan | research_only | new_family_research、research_only | 工艺负担必须显式保留。 |
| concrete_research_lead | huayin-mashi-pao | research_only | new_family_research、research_only | 固定为跨地形态未证、单锅未证的研究线索。 |
| concrete_research_lead | ningxia-rouzhanfan-steamed-rice | research_only | new_family_research、research_only | 保留先炒后蒸结构。 |
| concrete_research_lead | ningxia-shengcuan-jiumian-bowl | research_only | new_family_research、research_only | 先核实熟制和分支，不能直接上线。 |
| concrete_research_lead | turpan-soup-rice-technique | research_only | research_only | 严格研究专用。 |
| concrete_research_lead | xifu-jiaotuan-seasoned-bowl | research_only | new_family_research、research_only | 保留技法线索，不升为生产菜谱。 |
| concrete_research_lead | xinjiang-household-jupianzi-soup | research_only | new_family_research、research_only | 家常描述不等于独立标准。 |
| production_recipe | shaanbei-red-date-cowpea-rice | needs_manual_review | recipe_evidence、research_only | 传统身份可审计，项目替换和数值待人工复核。 |
| production_recipe | xinjiang-lamb-pilaf | needs_manual_review | recipe_evidence、template_evidence、ratio_rule | 可保留阶段结构，不能把具名分支抽象为自由槽。 |
| production_recipe | xinjiang-vegetable-pilaf | needs_more_evidence | recipe_evidence、research_only | 只能诚实标注为素抓饭风格家庭适配。 |

## 10. 16 条家庭食材旅程

| ID | 节点 | 模式/意图 | 输入 | 允许家族 | 结构 | 研究结论 | 禁止主张 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sn-01 | CN-SN | research/identity | 软谷物、红枣、豇豆 | festive-soft-grain-date-bean-braise | 核对软谷物和豆类状态 | human_review_required | ordinary_rice_as_traditional_equivalence |
| sn-02 | CN-SN | research/adaptation | 普通大米、红枣、豇豆 | festive-soft-grain-date-bean-braise | 普通米家庭适配 | adaptation_not_traditional_equivalence | ordinary_rice_as_traditional_equivalence |
| sn-03 | CN-SN | research/technique | 面粉、调味汤 | stirred-grain-thick-main-bowl | 手工搅团 | human_review_required | unattended_appliance_equivalence |
| sn-04 | CN-SN | research/boundary | 麻食、豆腐、粉条 | noodle-piece-broth-main-bowl | 华阴麻食泡边界 | research_only | cross_locality_shape_equivalence、single_pot_equivalence |
| gs-01 | CN-GS | research/identity | 面片、臊子汤 | noodle-piece-broth-main-bowl | 河沿身份与配方分离 | research_only | ich_listing_as_recipe |
| gs-02 | CN-GS | research/structure | 面片、肉丁、土豆、豆腐 | noodle-piece-broth-main-bowl | 家常面片汤 | human_review_required | single_pot_equivalence |
| gs-03 | CN-GS | research/technique | 杂粮粉 | stirred-grain-thick-main-bowl | 会宁手工搅团 | human_review_required | unattended_appliance_equivalence |
| gs-04 | CN-GS | research/exclusion | 糁饭 | — | 命名争议排除 | research_only | new_ao_fan_family |
| nx-01 | CN-NX | research/safety | 羊肉丸、揪面片 | noodle-piece-broth-main-bowl | 生汆肉丸熟透 | human_review_required | undercooked_meat |
| nx-02 | CN-NX | research/boundary | 生汆面 | noodle-piece-broth-main-bowl | 面片分支不合并 | research_only | branch_collapse |
| nx-03 | CN-NX | research/structure | 牛羊肉、洋葱、胡萝卜、米 | pre-saute-meat-vegetable-steamed-rice | 先炒后蒸 | human_review_required | any_meat_rice_braise_equivalence |
| nx-04 | CN-NX | research/exclusion | 烩小吃、茶 | — | 预制组件与茶排除 | research_only | hui_xiaochi_as_low_friction_home_pot |
| xj-01 | CN-XJ | research/structure | 羊肉、胡萝卜、洋葱、生米 | staged-pilaf-raw-rice | 抓饭分阶段 | human_review_required | source_as_ratio_dsl |
| xj-02 | CN-XJ | research/boundary | 羊肉、果干 | staged-pilaf-raw-rice | 具名肉切与果干分支 | research_only | free_fruit_nut_slot |
| xj-03 | CN-XJ | research/adaptation | 米、洋葱、胡萝卜、鹰嘴豆 | staged-pilaf-raw-rice | 素抓饭风格适配 | adaptation_not_traditional_equivalence | household_formula_as_traditional_formula |
| xj-04 | CN-XJ | research/boundary | 汤饭、揪片子 | noodle-piece-broth-main-bowl | 吐鲁番与家常揪片子研究边界 | research_only | ich_listing_as_recipe、exclusive_identity_claim |

## 11. 完成状态

当前为 `research_in_progress`，阻塞项：production_evidence_gaps、ratio_dsl_unresolved、household_vessel_adaptation_unresolved、safety_endpoint_incomplete、human_journey_review_incomplete。来源只证明其直接陈述；它不自动成为项目 Ratio DSL、普通锅适配、完整主餐承诺或真人厨房验证。

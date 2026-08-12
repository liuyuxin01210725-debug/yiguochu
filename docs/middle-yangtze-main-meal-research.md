<!-- Generated file: do not edit directly. -->

# 长江中游（湖北、湖南、江西）家庭主餐结构研究审计

来源：`tools/data/middle-yangtze-main-meal-research.v1.json`、现有 72 道 recipe、24 条 regional research ledger、全国地域地图与 regional mapping。
由 `node tools/build-middle-yangtze-main-meal-research.mjs --write` 确定性生成。

> **边界：这是研究覆盖层，不是生产菜谱。** 本轮不新增 recipe，不修改 Planner、template、taxonomy、Ratio DSL 或运行时代码。

## 摘要与核心纠偏

- 地域：长江中游（CN-HB、CN-HN、CN-JX）
- 省级空白审计：3
- 当前生产映射：0
- 当前候选映射：0
- 具体研究线索：8
- 来源：11（A 级 8，B 级 3）
- 家庭旅程：15（已人工评审 0）
- 当前状态：research_in_progress
- 阻塞项：zero_production_mapping、zero_candidate_mapping、source_ratio_conflict_unresolved、staple_sufficiency_unresolved、safety_endpoint_incomplete、human_journey_review_incomplete

关键纠偏：现成恩施豆皮、南昌米粉与南丰水粉不能从原米在同一顿饭中现场制造；社饭来源比例文字矛盾，禁止直接写入 Ratio DSL；瓦罐汤配米粉是两容器一顿饭；湿米粉若已产生米酵菌酸，加热不能消除。

## 1. 三省真实空白

| 省份 | 生产映射 | 候选映射 | 本轮线索 | 地图研究问题 | 空白说明 |
| --- | --- | --- | ---: | --- | --- |
| 湖北（CN-HB） | — | — | 4 | 核实湖北豆丝、汤饭与腊味米饭同锅类主餐的地方原型。 | 湖北豆皮、米粉和蒸菜有明确技法线索，但当前生产库与候选账本均无省级映射。 |
| 湖南（CN-HN） | — | — | 2 | 核实湖南社饭、腊味饭和家庭焖饭的地域技法与变种。 | 湖南社饭与灰粽有地域证据，但当前没有可执行比例或适合首轮生产的候选。 |
| 江西（CN-JX） | — | — | 2 | 核实江西米粉、汤饭、腊味或豆类同锅主餐的家庭原型。 | 江西米粉主餐线索丰富，但现成、干制、汤粉、炒粉和两容器搭配尚未机器区分。 |

## 2. 八种不能混写的食物家族

| 家族 | 结构 | 证据状态 |
| --- | --- | --- |
| 糯米馅豆米蛋皮（filled-glutinous-rice-crepe） | multi_stage_filled_crepe | regional_structure_supported |
| 成品豆皮汤炒主餐（ready-rice-bean-sheet-bowl） | ready_staple_bowl | regional_structure_supported |
| 米粉裹料混合蒸（grain-powder-mixed-steam） | multi_item_steam | staple_sufficiency_unresolved |
| 鳝鱼骨汤米粉（long-broth-eel-rice-noodle） | long_broth_bowl | household_adaptation_unresolved |
| 蒿香腊味糯米饭（cured-meat-herb-glutinous-rice） | pretreated_ingredients_braised_rice | ratio_conflict_unresolved |
| 灰水包裹糯米（alkaline-ash-water-wrapped-rice） | wrapped_long_boiled_rice | content_only |
| 成品米粉快炒（ready-rice-noodle-stir-fry） | single_wok_ready_staple | regional_structure_supported |
| 成品水粉汤炒（ready-rice-noodle-broth-or-stir） | ready_staple_broth_or_stir | regional_structure_supported |

## 3. 八条具体研究线索

| 地域线索 | 家族/餐型 | 关键形态 | claim 结论 | 禁止捷径 | 去向 |
| --- | --- | --- | --- | --- | --- |
| 恩施成品豆皮汤炒主餐（hubei-enshi-ready-doupi-bowl，CN-HB） | ready-rice-bean-sheet-bowl / ready_staple_bowl | ready_rice_bean_sheet、broth_or_stir_fry、optional_cured_meat_or_pickled_vegetable | regional_structure: supported；ready_staple_route: supported；raw_rice_same_meal_equivalence: not_proven | raw_rice_to_ready_doupi_same_meal、generic_tofu_substitution | taxonomy_rule、new_family_research |
| 沔阳米粉混合蒸制（hubei-mianyang-mixed-grain-powder-steam，CN-HB） | grain-powder-mixed-steam / multi_item_steam | grain_powder_coating、vegetable_or_animal_item、steamer_vessel | regional_structure: supported；mixed_steam_technique: supported；staple_sufficiency: not_proven | grain_coating_as_complete_staple、all_steam_methods_as_same_process | template_evidence、research_only |
| 武汉三鲜豆皮多阶段主食（hubei-wuhan-three-delicacy-doupi，CN-HB） | filled-glutinous-rice-crepe / multi_stage_filled_crepe | mung_bean_rice_egg_crepe、presteamed_glutinous_rice、braised_pork_dice、shrimp_piece、mushroom_piece | regional_structure: supported；single_pot_household_equivalence: not_proven | collapse_to_one_pot_rice、raw_filling_without_cookthrough | recipe_evidence、content_only、research_only |
| 仙桃鳝鱼浓汤米粉（hubei-xiantao-eel-rice-noodle-bowl，CN-HB） | long-broth-eel-rice-noodle / long_broth_bowl | eel_bone_broth、pork_bone_broth、ready_rice_noodle | regional_structure: supported；quick_household_equivalence: not_proven | raw_rice_to_noodle_same_meal、quick_clear_broth_as_identity_equivalent、undercooked_eel | content_only、research_only |
| 湘西蒿香腊味社饭（hunan-xiangxi-shefan，CN-HN） | cured-meat-herb-glutinous-rice / pretreated_ingredients_braised_rice | processed_artemisia、diced_cured_meat、non_glutinous_rice、glutinous_rice | regional_structure: supported；herb_cured_meat_rice_identity: supported；executable_ratio: not_proven | source_ratio_to_ratio_dsl、generic_cured_rice_same_identity、omit_herb_keep_regional_name | recipe_evidence、ratio_rule、research_only |
| 永州草木灰碱水灰粽（hunan-yongzhou-grey-zongzi，CN-HN） | alkaline-ash-water-wrapped-rice / wrapped_long_boiled_rice | ash_alkaline_water、soaked_glutinous_rice、red_bean_peanut、wrapped_pork_filling | regional_structure: supported；long_process_identity: supported；quick_household_equivalence: contradicted | quick_mode、unverified_alkaline_water、ordinary_rice_bowl_same_identity | content_only、research_only |
| 南昌成品米粉快炒主餐（jiangxi-nanchang-stir-fried-rice-noodle，CN-JX） | ready-rice-noodle-stir-fry / single_wok_ready_staple | ready_or_precooked_rice_noodle、meat_or_egg、greens、bean_sprout_optional | regional_structure: supported；ready_noodle_meal_route: supported | dry_noodle_without_pretreatment、spoiled_wet_noodle_reheated、generic_all_rice_noodles_same_hydration | new_family_research、taxonomy_rule、ratio_rule |
| 南丰成品水粉汤炒主餐（jiangxi-nanfeng-rice-noodle-bowl，CN-JX） | ready-rice-noodle-broth-or-stir / ready_staple_broth_or_stir | ready_or_precooked_rice_noodle、broth_or_stir_fry、meat_and_egg_optional | regional_structure: supported；ready_noodle_meal_route: supported | dry_noodle_without_pretreatment、raw_rice_to_noodle_same_meal、spoiled_wet_noodle_reheated | new_family_research、taxonomy_rule、ratio_rule |

## 4. 食材与加工形态矩阵

| 形态 | 线索 | 省份 | 家族 |
| --- | --- | --- | --- |
| ash_alkaline_water | hunan-yongzhou-grey-zongzi | CN-HN | alkaline-ash-water-wrapped-rice |
| bean_sprout_optional | jiangxi-nanchang-stir-fried-rice-noodle | CN-JX | ready-rice-noodle-stir-fry |
| braised_pork_dice | hubei-wuhan-three-delicacy-doupi | CN-HB | filled-glutinous-rice-crepe |
| broth_or_stir_fry | hubei-enshi-ready-doupi-bowl、jiangxi-nanfeng-rice-noodle-bowl | CN-HB、CN-JX | ready-rice-bean-sheet-bowl、ready-rice-noodle-broth-or-stir |
| diced_cured_meat | hunan-xiangxi-shefan | CN-HN | cured-meat-herb-glutinous-rice |
| eel_bone_broth | hubei-xiantao-eel-rice-noodle-bowl | CN-HB | long-broth-eel-rice-noodle |
| glutinous_rice | hunan-xiangxi-shefan | CN-HN | cured-meat-herb-glutinous-rice |
| grain_powder_coating | hubei-mianyang-mixed-grain-powder-steam | CN-HB | grain-powder-mixed-steam |
| greens | jiangxi-nanchang-stir-fried-rice-noodle | CN-JX | ready-rice-noodle-stir-fry |
| meat_and_egg_optional | jiangxi-nanfeng-rice-noodle-bowl | CN-JX | ready-rice-noodle-broth-or-stir |
| meat_or_egg | jiangxi-nanchang-stir-fried-rice-noodle | CN-JX | ready-rice-noodle-stir-fry |
| mung_bean_rice_egg_crepe | hubei-wuhan-three-delicacy-doupi | CN-HB | filled-glutinous-rice-crepe |
| mushroom_piece | hubei-wuhan-three-delicacy-doupi | CN-HB | filled-glutinous-rice-crepe |
| non_glutinous_rice | hunan-xiangxi-shefan | CN-HN | cured-meat-herb-glutinous-rice |
| optional_cured_meat_or_pickled_vegetable | hubei-enshi-ready-doupi-bowl | CN-HB | ready-rice-bean-sheet-bowl |
| pork_bone_broth | hubei-xiantao-eel-rice-noodle-bowl | CN-HB | long-broth-eel-rice-noodle |
| presteamed_glutinous_rice | hubei-wuhan-three-delicacy-doupi | CN-HB | filled-glutinous-rice-crepe |
| processed_artemisia | hunan-xiangxi-shefan | CN-HN | cured-meat-herb-glutinous-rice |
| ready_or_precooked_rice_noodle | jiangxi-nanchang-stir-fried-rice-noodle、jiangxi-nanfeng-rice-noodle-bowl | CN-JX | ready-rice-noodle-broth-or-stir、ready-rice-noodle-stir-fry |
| ready_rice_bean_sheet | hubei-enshi-ready-doupi-bowl | CN-HB | ready-rice-bean-sheet-bowl |
| ready_rice_noodle | hubei-xiantao-eel-rice-noodle-bowl | CN-HB | long-broth-eel-rice-noodle |
| red_bean_peanut | hunan-yongzhou-grey-zongzi | CN-HN | alkaline-ash-water-wrapped-rice |
| shrimp_piece | hubei-wuhan-three-delicacy-doupi | CN-HB | filled-glutinous-rice-crepe |
| soaked_glutinous_rice | hunan-yongzhou-grey-zongzi | CN-HN | alkaline-ash-water-wrapped-rice |
| steamer_vessel | hubei-mianyang-mixed-grain-powder-steam | CN-HB | grain-powder-mixed-steam |
| vegetable_or_animal_item | hubei-mianyang-mixed-grain-powder-steam | CN-HB | grain-powder-mixed-steam |
| wrapped_pork_filling | hunan-yongzhou-grey-zongzi | CN-HN | alkaline-ash-water-wrapped-rice |

## 5. 固定来源证据包

| 来源 | 等级 | 直接证明 | 不证明 |
| --- | --- | --- | --- |
| [武汉豆皮大王——老通城](https://wlt.hubei.gov.cn/bmdt/ztzl/zshb/201912/t20191226_1799476.shtml)（湖北省文化和旅游厅（来源：湖北方志），2013-05-22） | A | lead:hubei-wuhan-three-delicacy-doupi:regional_structure | lead:hubei-wuhan-three-delicacy-doupi:single_pot_household_equivalence、lead:hubei-wuhan-three-delicacy-doupi:production_ratio_safety |
| [千城百县看中国｜湖北恩施：一方豆皮 一城乡愁](https://wlt.hubei.gov.cn/bmdt/szyw/es/202605/t20260528_5945855.shtml)（湖北省文化和旅游厅（来源：新华网），2026-05-28） | A | lead:hubei-enshi-ready-doupi-bowl:regional_structure、lead:hubei-enshi-ready-doupi-bowl:ready_staple_route | lead:hubei-enshi-ready-doupi-bowl:raw_rice_same_meal_equivalence、lead:hubei-enshi-ready-doupi-bowl:production_ratio_safety |
| [这道菜传承600年魅力日盛见证非遗文化生命力](https://wlt.hubei.gov.cn/bmdt/mtjj/202208/t20220825_4279643.shtml)（湖北省文化和旅游厅（来源：长江网），2022-08-25） | A | lead:hubei-mianyang-mixed-grain-powder-steam:regional_structure、lead:hubei-mianyang-mixed-grain-powder-steam:mixed_steam_technique | lead:hubei-mianyang-mixed-grain-powder-steam:staple_sufficiency、lead:hubei-mianyang-mixed-grain-powder-steam:single_pot_equivalence |
| [仙桃鳝鱼米粉](https://wlt.hubei.gov.cn/bmdt/ztzl/zshb/201912/t20191226_1799584.shtml)（湖北省文化和旅游厅（来源：湖北省人民政府网站），2016-04-19） | A | lead:hubei-xiantao-eel-rice-noodle-bowl:regional_structure | lead:hubei-xiantao-eel-rice-noodle-bowl:quick_household_equivalence、lead:hubei-xiantao-eel-rice-noodle-bowl:raw_rice_same_meal_equivalence |
| [地方名小吃：社饭](https://www.hunan.gov.cn/hnszf/jxxx/hxwh/cwd/201711/t20171111_4685412.html)（湖南省人民政府门户网站，2017-11-11） | A | lead:hunan-xiangxi-shefan:regional_structure、lead:hunan-xiangxi-shefan:herb_cured_meat_rice_identity | lead:hunan-xiangxi-shefan:executable_ratio、lead:hunan-xiangxi-shefan:generic_cured_rice_same_identity |
| [永州灰粽为何能长年香飘市场](https://www.hunan.gov.cn/hnyw/szdt/202106/t20210616_19518985.html)（湖南省人民政府门户网站，2021-06-16） | A | lead:hunan-yongzhou-grey-zongzi:regional_structure、lead:hunan-yongzhou-grey-zongzi:long_process_identity、lead:hunan-yongzhou-grey-zongzi:not_quick | lead:hunan-yongzhou-grey-zongzi:quick_household_equivalence、lead:hunan-yongzhou-grey-zongzi:production_ratio_safety |
| [粉江西（南昌炒粉部分）](https://nc.jxnews.com.cn/system/2022/02/11/019533259.shtml)（江西日报 / 大江网，2022-02-11） | B | lead:jiangxi-nanchang-stir-fried-rice-noodle:regional_structure、lead:jiangxi-nanchang-stir-fried-rice-noodle:ready_noodle_meal_route | lead:jiangxi-nanchang-stir-fried-rice-noodle:dry_noodle_without_pretreatment、lead:jiangxi-nanchang-stir-fried-rice-noodle:production_ratio_safety |
| [粉江西（南丰水粉部分）](https://nc.jxnews.com.cn/system/2022/02/11/019533259_03.shtml)（江西日报 / 大江网，2022-02-11） | B | lead:jiangxi-nanfeng-rice-noodle-bowl:regional_structure、lead:jiangxi-nanfeng-rice-noodle-bowl:ready_noodle_meal_route | lead:jiangxi-nanfeng-rice-noodle-bowl:dry_noodle_without_pretreatment、lead:jiangxi-nanfeng-rice-noodle-bowl:production_ratio_safety |
| [一罐煨汤天下奇鲜](https://nc.jxnews.com.cn/system/2024/08/27/020613311.shtml)（大江网-江南都市报，2024-08-27） | B | boundary:claypot-soup-plus-noodle-is-two-vessel:meal_structure | boundary:claypot-soup-plus-noodle-is-two-vessel:same_pot_equivalence |
| [关于酵米面等食物中毒的风险解析](https://www.samr.gov.cn/xw/zj/art/2023/art_7587ef80ec2f4e8bab850b7e3d69ec30.html)（国家市场监督管理总局，2020-12-05） | A | safety:wet-rice-noodle-source-storage-discard:principle | safety:wet-rice-noodle-source-storage-discard:project_storage_hours、safety:wet-rice-noodle-source-storage-discard:heat_destroys_toxin |
| [校园食品安全消费提示](https://www.samr.gov.cn/spcjs/yjjl/art/2020/art_d3005aa05c2340c1af29738386ed39cf.html)（国家市场监督管理总局，2020-09-10） | A | safety:animal-and-aquatic-cook-through:principle | safety:animal-and-aquatic-cook-through:project_minutes_ratio |

## 6. 家庭适配与安全边界

安全来源只支持来源、储存、丢弃、熟透和防交叉污染等原则；本轮不编造项目克数、时长或液体比例。

| 边界 | 状态 | 说明 |
| --- | --- | --- |
| ready-staple-not-raw-grain-manufacture | checked | 成品豆皮和米粉只能在用户已有合格成品时进入家庭规划，不能从原米同餐制造。 |
| grain-coating-not-complete-staple | open | 粉蒸用米粉是裹料还是足量主食必须另行计算。 |
| shefan-ratio-conflict-not-dsl | checked | 政府页面比例文字冲突，禁止转写 Ratio DSL。 |
| grey-zongzi-not-quick | checked | 草木灰碱水与长时间煮制不进入 quick。 |
| claypot-soup-plus-noodle-is-two-vessel | checked | 瓦罐汤配米粉是两容器一顿饭，不得宣称同锅。 |
| wet-rice-noodle-source-storage-discard | principle_only | 湿米粉若已产生米酵菌酸，加热不能破坏米酵菌酸；不得以煮熟替代来源、储存和丢弃判断。；控制：正规来源、按标签冷藏、保质期内尽快食用、异常或过期立即丢弃 |
| animal-and-aquatic-cook-through | principle_only | 肉、禽、蛋和水产品必须烧熟煮透；本轮不编造项目分钟、克数或液体比例。；控制：生熟分开、动物性食材烧熟煮透、避免交叉污染 |

## 7. 产品去向决策

| 类型 | 对象 | 省份 | 状态 | 允许方向 | 未决问题 |
| --- | --- | --- | --- | --- | --- |
| concrete_research_lead | hubei-enshi-ready-doupi-bowl | CN-HB | research_only | taxonomy_rule、new_family_research | 商品规格；复水比例；湿制或干制安全 |
| concrete_research_lead | hubei-mianyang-mixed-grain-powder-steam | CN-HB | research_only | template_evidence、research_only | 主食补足；不同食材分时熟制；家庭蒸具容量 |
| concrete_research_lead | hubei-wuhan-three-delicacy-doupi | CN-HB | research_only | recipe_evidence、content_only、research_only | 家庭锅具；步骤简化边界；比例与熟制终点 |
| concrete_research_lead | hubei-xiantao-eel-rice-noodle-bowl | CN-HB | research_only | content_only、research_only | 家庭高汤降摩擦；鳝鱼处理安全；成品米粉规格 |
| concrete_research_lead | hunan-xiangxi-shefan | CN-HN | research_only | recipe_evidence、ratio_rule、research_only | 可信比例；蒿菜识别与可得性；腊味盐脂控制 |
| concrete_research_lead | hunan-yongzhou-grey-zongzi | CN-HN | research_only | content_only、research_only | 家庭碱水安全；规格化来源；是否仅做内容 |
| concrete_research_lead | jiangxi-nanchang-stir-fried-rice-noodle | CN-JX | research_only | new_family_research、taxonomy_rule、ratio_rule | 干湿规格；防粘与油量；湿粉储存安全 |
| concrete_research_lead | jiangxi-nanfeng-rice-noodle-bowl | CN-JX | research_only | new_family_research、taxonomy_rule、ratio_rule | 商品规格；汤炒分型；液体与复热安全 |

## 8. 15 条家庭食材旅程

| ID | 省份 | 模式/意图 | 输入 | 允许家族 | 结构 | 研究结论 | 禁止主张 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| my-j01 | CN-HB | pantry/normal | 成品恩施豆皮、腊肉、酸菜 | ready-rice-bean-sheet-bowl | ready_staple_bowl | 可进入家族研究 | 从大米现场做豆皮 | 用户已有成品豆皮时可研究汤煮或炒制。 |
| my-j02 | CN-HB | pantry/normal | 大米、绿豆、腊肉 | — | unresolved | 缺少成品制造阶段 | 同餐制成恩施豆皮 | 缺少浸泡、磨浆、烙制和干燥后的成品豆皮。 |
| my-j03 | CN-HB | recommend/normal | 熟糯米、鸡蛋、猪肉丁、香菇、虾仁 | filled-glutinous-rice-crepe | multi_stage_filled_crepe | 仅多阶段研究 | 一锅焖饭 | 结构接近武汉三鲜豆皮，但仍是多阶段研究。 |
| my-j04 | CN-HB | pantry/normal | 猪肉、鲶鱼、芋头、蒸肉米粉 | grain-powder-mixed-steam | multi_item_steam | 主食充足性未解决 | 完整主食已满足 | 可研究组合蒸，但裹粉是否满足主食量仍未证明。 |
| my-j05 | CN-HB | recommend/quick | 鳝鱼、干米粉 | — | unresolved | 与快手意图冲突 | 仙桃鳝鱼米粉快手等价 | 传统线索依赖长汤与米粉处理，不能强行 quick。 |
| my-j06 | CN-HN | pantry/normal | 蒿菜、腊肉、粘米、糯米、葱 | cured-meat-herb-glutinous-rice | pretreated_ingredients_braised_rice | 比例未解决 | 比例已经机器验证 | 社饭身份结构成立，但比例来源冲突。 |
| my-j07 | CN-HN | pantry/normal | 腊肉、粘米、糯米 | — | generic_cured_rice | 缺少地域身份要素 | 湘西社饭 | 缺少蒿菜时只能研究普通腊味饭，不保留社饭地域名。 |
| my-j08 | CN-HN | recommend/normal | 腊肉、大米、青菜 | — | generic_cured_rice | 仅普通家庭适配 | 社饭 | 可作为家庭腊味饭方向，但不是社饭证据。 |
| my-j09 | CN-HN | recommend/batch | 草木灰碱水、糯米、红豆、花生、五花肉、粽叶 | alkaline-ash-water-wrapped-rice | wrapped_long_boiled_rice | 仅内容与高摩擦研究 | 普通一锅饭 | 地域结构成立但工序和安全门槛高，只保留研究与内容。 |
| my-j10 | CN-HN | recommend/quick | 糯米、红豆、花生、五花肉 | — | unresolved | 与快手意图冲突 | 快手灰粽 | 长时间碱水包煮结构与 quick 冲突。 |
| my-j11 | CN-JX | pantry/quick | 可直接炒米粉、猪肉丝、青菜、豆芽 | ready-rice-noodle-stir-fry | single_wok_ready_staple | 可进入家族研究 | 所有米粉规格通用 | 成品或已预处理米粉可研究单锅快炒。 |
| my-j12 | CN-JX | pantry/quick | 干米粉、鸡蛋、青菜 | ready-rice-noodle-stir-fry | pretreatment_then_wok | 需要预处理 | 干粉直接下锅快炒 | 干米粉必须按包装完成浸泡或预煮后再炒。 |
| my-j13 | CN-JX | recommend/normal | 成品南丰水粉、鸡蛋、猪肉、青菜 | ready-rice-noodle-broth-or-stir | ready_staple_broth_or_stir | 可进入家族研究 | 从大米现场制粉 | 符合成品水粉的汤或炒主餐路线。 |
| my-j14 | CN-JX | recommend/normal | 瓦罐汤、米粉 | — | two_vessel_meal | 仅用于边界解释 | 同锅完成 | 一汤一粉是两容器搭配，不伪装成同锅。 |
| my-j15 | CN-JX | pantry/normal | 猪肉、蒸肉米粉 | — | unresolved | 主食充足性未解决 | 完整主食已满足 | 裹肉米粉不能自动视为足量主食。 |

## 9. 完成状态

当前为 `research_in_progress`，阻塞项：zero_production_mapping、zero_candidate_mapping、source_ratio_conflict_unresolved、staple_sufficiency_unresolved、safety_endpoint_incomplete、human_journey_review_incomplete。这些未完成前，不将研究线索称为已批准菜谱，也不进入运行时。

<!-- Generated file: edit tools/data/qinghai-tibet-one-pot-research.v1.json and rebuild. -->

# 青藏一锅主餐研究覆盖层

> 这是研究覆盖层，不是生产菜谱。本轮没有增加或修改 72 道生产 recipe、24 条地域候选、Planner、Ratio DSL 或运行时代码。

- 地域：青藏（CN-QH、CN-XZ）
- 生产菜谱审计：4
- 现有候选审计：0
- 独立研究线索：5
- 来源：11（A 级 11，B 级 0，C 级 0）
- 家庭旅程：12（已人工评审 0）
- 当前状态：research_in_progress
- 阻塞项：production_evidence_gaps、ratio_dsl_unresolved、household_vessel_adaptation_unresolved、safety_endpoint_incomplete、human_journey_review_incomplete

## 五项机器可验证的关键边界

### hao-fan-evidence-correction（evidence_correction）

青海熬饭现有条目是项目原创的风味家庭适配版；直接来源只支持肉汤中加入白萝卜、洋芋、粉条的熬饭，不证明项目的小米、土豆、熟鹰嘴豆、Ratio DSL 或传统复刻。

- 对象：production_recipe:qinghai-hao-fan
- 来源：qh-science-hao-fan-2022
- Claim：production:qinghai-hao-fan:regional_name_context、production:qinghai-hao-fan:hao_fan_broth_root_vegetable_structure、production:qinghai-hao-fan:project_ingredient_equivalence、production:qinghai-hao-fan:project_ratio_dsl_equivalence、production:qinghai-hao-fan:traditional_recipe_equivalence
- 适配边界：qinghai-hao-fan-not-traditional-replica
- 禁止生成项：—

### gutu-non-food-symbols-forbidden（festival_safety_boundary）

古突必须保留藏历新年前夜与团聚的节庆语境；来源记录辣椒、羊毛、豌豆等寓意馅料，但硬币、羊毛、木炭、纸条等非食品象征物不得进入生成食材或家庭做法。

- 对象：production_recipe:tibetan-gutu
- 来源：xz-gov-new-year-customs-2025
- Claim：production:tibetan-gutu:new_year_eve_context、production:tibetan-gutu:symbolic_filling_context、production:tibetan-gutu:production_ingredient_safety_equivalence、production:tibetan-gutu:traditional_recipe_equivalence
- 适配边界：tibetan-gutu-not-traditional-replica
- 禁止生成项：硬币、羊毛、木炭、纸条

### ginseng-fruit-rice-new-year-boundary（festival_context_boundary）

人参果饭必须保留藏历新年节庆边界；来源只支持人参果、米饭、酥油、白糖的新年组合，不证明日常高频、同锅焖煮、项目比例或替换关系，蕨麻必须先确认食品级身份与来源。

- 对象：production_recipe:tibetan-ginseng-fruit-rice
- 来源：xz-gov-new-year-customs-2025
- Claim：production:tibetan-ginseng-fruit-rice:new_year_ginseng_fruit_rice_combination、production:tibetan-ginseng-fruit-rice:daily_same_pot_ratio_equivalence、production:tibetan-ginseng-fruit-rice:traditional_recipe_equivalence
- 适配边界：tibetan-ginseng-fruit-rice-not-traditional-replica
- 禁止生成项：—

### patu-highest-research-priority（research_priority）

帕图是本轮最高优先级研究线索，只保留面疙瘩、汤、萝卜等来源直接支持的结构，不把普通牛肉、鸡肉或其他蛋白写成传统等价替换。

- 对象：concrete_research_lead:tibetan-patu-one-pot
- 来源：xz-shannan-batu-2026、xz-gov-patu-2025
- Claim：lead:tibetan-patu-one-pot:broth_and_noodle_lump_structure、lead:tibetan-patu-one-pot:tibetan_patu_identity、lead:tibetan-patu-one-pot:single_pot_equivalence
- 适配边界：patu-not-free-noodle-equivalence
- 禁止生成项：—

### tuba-and-tibetan-noodle-pending（evidence_pending）

土巴仍待证其稠度、术语与家庭操作；藏面仍待证面条配方、汤底与单锅完整主餐边界，两者都不能直接进入生产或候选账本。

- 对象：concrete_research_lead:tibetan-tuba-barley-thick-bowl、concrete_research_lead:lhasa-tibetan-noodle-breakfast
- 来源：xz-tibetology-tuba-2022、xz-gov-lhasa-noodle-2024、xz-tourism-lhasa-noodle-2023
- Claim：lead:tibetan-tuba-barley-thick-bowl:unattended_appliance_equivalence、lead:lhasa-tibetan-noodle-breakfast:single_pot_complete_meal_equivalence、lead:lhasa-tibetan-noodle-breakfast:project_ratio_time_safety
- 适配边界：tuba-manual-thickening-not-unattended-appliance、lhasa-noodle-breakfast-not-single-pot-proven
- 禁止生成项：—


## 1. 两个节点的真实覆盖

| 节点 | 生产 | 候选 | 研究线索 | 地图问题 |
| --- | --- | --- | --- | --- |
| 青海（CN-QH） | qinghai-hao-fan | — | qinghai-barley-wheatberry-meat-soup、qinghai-ga-mianpian-broth | 整理青海熬饭、面片与青稞杂粮主餐的技法和家庭适配。 |
| 西藏（CN-XZ） | tibetan-ginseng-fruit-rice、tibetan-gutu、tibetan-savory-congee | — | lhasa-tibetan-noodle-breakfast、tibetan-patu-one-pot、tibetan-tuba-barley-thick-bowl | 整理西藏咸稀饭、古突、人参果饭和青稞主餐的技法边界。 |

## 2. 四道生产菜谱证据审计

| 菜谱 | 状态 | 核心食材 | 证据结论 | 禁止主张 | 决策 |
| --- | --- | --- | --- | --- | --- |
| 青海熬饭风味家庭适配版（qinghai-hao-fan） | auto_approved / needs_more_evidence | 小米、土豆、熟鹰嘴豆 | regional_name_context：supported<br>hao_fan_broth_root_vegetable_structure：supported<br>project_ingredient_equivalence：not_proven<br>project_ratio_dsl_equivalence：not_proven<br>traditional_recipe_equivalence：not_proven | traditional_replica、project_ingredient_equivalence、source_as_ratio_dsl | 固定为家庭适配审计，不上调为传统复刻。 |
| 西藏人参果饭（tibetan-ginseng-fruit-rice） | auto_approved / needs_manual_review | 食品级蕨麻、大米 | new_year_ginseng_fruit_rice_combination：supported<br>daily_same_pot_ratio_equivalence：not_proven<br>traditional_recipe_equivalence：not_proven | traditional_replica、daily_high_frequency、same_pot_braise_equivalence、source_as_ratio_dsl | 保留藏历新年节庆与食品级蕨麻边界。 |
| 古突风味家庭适配版（tibetan-gutu） | auto_approved / needs_more_evidence | 小麦面团、小白菜、水 | new_year_eve_context：supported<br>symbolic_filling_context：supported<br>production_ingredient_safety_equivalence：not_proven<br>traditional_recipe_equivalence：not_proven | traditional_replica、non_food_symbol_as_ingredient、patu_as_gutu_equivalence | 古突节庆身份独立记录，非食品象征物禁止进入生成食材。 |
| 藏式咸稀饭风味家庭适配版（tibetan-savory-congee） | auto_approved / needs_manual_review | 大米、牛奶 | barley_grain_porridge_context：supported<br>traditional_recipe_equivalence：not_proven | traditional_replica、free_grain_slot | 保留地域粥食背景与审计边界。 |

## 3. 候选账本基线

当前青藏节点没有既有候选可审计；“0 candidates”是基线事实，不以虚构候选补齐。

## 4. 五条独立研究线索

| 线索 | 家族与餐型 | 关键形态 | 证据结论 | 禁止捷径 |
| --- | --- | --- | --- | --- |
| 拉萨藏面早餐（lhasa-tibetan-noodle-breakfast，CN-XZ） | lhasa-noodle-breakfast-main-bowl / tibetan_noodles_with_beef_broth_in_breakfast_set | tibetan_noodle、beef_broth、beef_piece | lhasa_breakfast_noodle_and_beef_broth_identity：supported<br>breakfast_context：supported<br>single_pot_complete_meal_equivalence：not_proven<br>project_ratio_time_safety：not_proven | single_pot_equivalence、free_breakfast_set |
| 青海青稞麦仁肉汤（qinghai-barley-wheatberry-meat-soup，CN-QH） | qinghai-barley-wheatberry-meat-soup / barley_wheatberry_and_meat_long_simmer_soup | barley、wheatberry、beef_or_mutton | barley_wheatberry_meat_long_simmer_structure：supported<br>free_grain_or_meat_slot：not_proven | free_grain_slot、free_meat_slot |
| 青海尕面片汤（qinghai-ga-mianpian-broth，CN-QH） | qinghai-noodle-piece-broth-main-bowl / hand_formed_noodle_pieces_in_savory_broth | noodle_piece、savory_broth | qinghai_household_noodle_identity：supported<br>project_single_pot_equivalence：not_proven | single_pot_equivalence |
| 西藏帕图一锅线索（tibetan-patu-one-pot，CN-XZ） | tibetan-patu-one-pot-main-bowl / broth_with_named_noodle_lumps_and_mixed_ingredients | noodle_lump、bone_broth、radish | broth_and_noodle_lump_structure：supported<br>tibetan_patu_identity：supported<br>single_pot_equivalence：not_proven<br>project_ratio_time_vessel_equivalence：not_proven | free_noodle_equivalence、single_pot_equivalence |
| 西藏土巴青稞稠食（tibetan-tuba-barley-thick-bowl，CN-XZ） | tibetan-tuba-barley-thick-main-bowl / barley_based_thick_bowl_with_meat_and_noodle_pieces | tsampa、meat_dice、noodle_piece、dairy_curd | barley_thick_bowl_structure：supported<br>unattended_appliance_equivalence：not_proven | unattended_appliance_equivalence、free_barley_slot |

## 5. 六个不能混写的家族

| 家族 | 结构 | 证据状态 |
| --- | --- | --- |
| 青海谷物粥饭主碗（qinghai-grain-porridge-main-bowl） | grain_porridge_with_named_adaptation_boundaries | research_only |
| 青海面片汤主碗（qinghai-noodle-piece-broth-main-bowl） | hand_formed_noodle_pieces_in_savory_broth | research_only |
| 青海青稞麦仁肉汤（qinghai-barley-wheatberry-meat-soup） | barley_wheatberry_and_meat_long_simmer_soup | research_only |
| 西藏帕图主碗（tibetan-patu-one-pot-main-bowl） | broth_with_named_noodle_lumps_and_mixed_ingredients | research_only |
| 西藏土巴青稞稠食主碗（tibetan-tuba-barley-thick-main-bowl） | barley_based_thick_bowl_with_meat_and_noodle_pieces | research_only |
| 拉萨藏面早餐主碗（lhasa-noodle-breakfast-main-bowl） | tibetan_noodles_with_beef_broth_in_breakfast_set | research_only |

## 6. Claim 与食材形态矩阵

| 对象 | claim | 结论 | 来源 | 理由 |
| --- | --- | --- | --- | --- |
| concrete_research_lead:lhasa-tibetan-noodle-breakfast | breakfast_context | supported | xz-tourism-lhasa-noodle-2023 | 文旅材料支持拉萨早餐语境。 |
| concrete_research_lead:lhasa-tibetan-noodle-breakfast | lhasa_breakfast_noodle_and_beef_broth_identity | supported | xz-gov-lhasa-noodle-2024 | 自治区材料支持藏面与牛肉汤组合。 |
| concrete_research_lead:lhasa-tibetan-noodle-breakfast | project_ratio_time_safety | not_proven | xz-tourism-lhasa-noodle-2023 | 文旅介绍不提供项目比例、时间或熟制终点。 |
| concrete_research_lead:lhasa-tibetan-noodle-breakfast | single_pot_complete_meal_equivalence | not_proven | xz-gov-lhasa-noodle-2024 | 早餐组合不证明单锅完整主餐。 |
| concrete_research_lead:qinghai-barley-wheatberry-meat-soup | barley_wheatberry_meat_long_simmer_structure | supported | qh-gonghe-barley-wheatberry-2023 | 官方材料支持青稞、麦仁与牛羊肉熬煮组合。 |
| concrete_research_lead:qinghai-barley-wheatberry-meat-soup | free_grain_or_meat_slot | not_proven | qh-gonghe-barley-wheatberry-2023 | 具名主料不能抽象为自由替换槽。 |
| concrete_research_lead:qinghai-ga-mianpian-broth | project_single_pot_equivalence | not_proven | qh-geermu-ga-mianpian-2023 | 没有项目锅具和一锅过程证据。 |
| concrete_research_lead:qinghai-ga-mianpian-broth | qinghai_household_noodle_identity | supported | qh-geermu-ga-mianpian-2023 | 官方地方材料支持家常面食身份。 |
| concrete_research_lead:tibetan-patu-one-pot | broth_and_noodle_lump_structure | supported | xz-shannan-batu-2026 | 地方文旅材料支持汤与面疙瘩组合。 |
| concrete_research_lead:tibetan-patu-one-pot | project_ratio_time_vessel_equivalence | not_proven | xz-shannan-batu-2026、cn-animal-food-safety-2025 | 公开制作说明和通用安全原则不构成项目参数。 |
| concrete_research_lead:tibetan-patu-one-pot | single_pot_equivalence | not_proven | xz-gov-patu-2025 | 身份材料不证明项目单锅等价。 |
| concrete_research_lead:tibetan-patu-one-pot | tibetan_patu_identity | supported | xz-gov-patu-2025 | 自治区材料支持帕图面食身份。 |
| concrete_research_lead:tibetan-tuba-barley-thick-bowl | barley_thick_bowl_structure | supported | xz-tibetology-tuba-2022 | 研究机构材料支持土巴的稠粥类结构。 |
| concrete_research_lead:tibetan-tuba-barley-thick-bowl | unattended_appliance_equivalence | not_proven | xz-tibetology-tuba-2022 | 手工食物描述不证明无人看管设备等价。 |
| production_recipe:qinghai-hao-fan | hao_fan_broth_root_vegetable_structure | supported | qh-science-hao-fan-2022 | 来源直接描述肉汤中加入白萝卜、洋芋和粉条。 |
| production_recipe:qinghai-hao-fan | project_ingredient_equivalence | not_proven | qh-science-hao-fan-2022 | 来源不证明项目小米、土豆和熟鹰嘴豆组合。 |
| production_recipe:qinghai-hao-fan | project_ratio_dsl_equivalence | not_proven | qh-science-hao-fan-2022 | 来源不提供项目 Ratio DSL。 |
| production_recipe:qinghai-hao-fan | regional_name_context | supported | qh-science-hao-fan-2022 | 来源直接点名土族熬饭。 |
| production_recipe:qinghai-hao-fan | traditional_recipe_equivalence | not_proven | qh-science-hao-fan-2022 | 具名熬饭轮廓不证明当前项目配方是传统复刻。 |
| production_recipe:tibetan-ginseng-fruit-rice | daily_same_pot_ratio_equivalence | not_proven | xz-gov-new-year-customs-2025 | 来源不证明日常高频、同锅焖煮、项目比例或替换关系。 |
| production_recipe:tibetan-ginseng-fruit-rice | new_year_ginseng_fruit_rice_combination | supported | xz-gov-new-year-customs-2025 | 来源直接支持人参果、米饭、酥油和白糖的新年组合。 |
| production_recipe:tibetan-ginseng-fruit-rice | traditional_recipe_equivalence | not_proven | xz-gov-new-year-customs-2025 | 节庆组合不证明当前项目步骤与比例是传统复刻。 |
| production_recipe:tibetan-gutu | new_year_eve_context | supported | xz-gov-new-year-customs-2025 | 来源直接支持藏历新年前夜吃古突的节庆语境。 |
| production_recipe:tibetan-gutu | production_ingredient_safety_equivalence | not_proven | xz-gov-new-year-customs-2025 | 节庆寓意不授权把羊毛等非食品象征物写入生成食材。 |
| production_recipe:tibetan-gutu | symbolic_filling_context | supported | xz-gov-new-year-customs-2025 | 来源记录辣椒、羊毛和豌豆等寓意馅料。 |
| production_recipe:tibetan-gutu | traditional_recipe_equivalence | not_proven | xz-gov-new-year-customs-2025 | 节庆习俗材料不证明当前家庭适配配方是传统复刻。 |
| production_recipe:tibetan-savory-congee | barley_grain_porridge_context | supported | xz-gov-porridge-2025 | 来源只支持青稞粒粥食背景。 |
| production_recipe:tibetan-savory-congee | traditional_recipe_equivalence | not_proven | xz-gov-porridge-2025 | 背景材料不证明现有配方。 |

| 形态 | 生产 | 候选 | 线索 | 来源层 |
| --- | --- | --- | --- | --- |
| barley | tibetan-savory-congee | — | qinghai-barley-wheatberry-meat-soup | concrete_research_lead、production_recipe |
| beef_broth | — | — | lhasa-tibetan-noodle-breakfast | concrete_research_lead |
| beef_or_mutton | — | — | qinghai-barley-wheatberry-meat-soup | concrete_research_lead |
| beef_piece | — | — | lhasa-tibetan-noodle-breakfast | concrete_research_lead |
| bone_broth | — | — | tibetan-patu-one-pot | concrete_research_lead |
| cooked_chickpea | qinghai-hao-fan | — | — | production_recipe |
| dairy_curd | — | — | tibetan-tuba-barley-thick-bowl | concrete_research_lead |
| ginseng_fruit | tibetan-ginseng-fruit-rice | — | — | production_recipe |
| meat_dice | — | — | tibetan-tuba-barley-thick-bowl | concrete_research_lead |
| millet | qinghai-hao-fan | — | — | production_recipe |
| noodle_lump | — | — | tibetan-patu-one-pot | concrete_research_lead |
| noodle_piece | — | — | qinghai-ga-mianpian-broth、tibetan-tuba-barley-thick-bowl | concrete_research_lead |
| noodle_soup | tibetan-gutu | — | — | production_recipe |
| potato | qinghai-hao-fan | — | — | production_recipe |
| radish | — | — | tibetan-patu-one-pot | concrete_research_lead |
| rice | tibetan-ginseng-fruit-rice | — | — | production_recipe |
| savory_broth | — | — | qinghai-ga-mianpian-broth | concrete_research_lead |
| savory_porridge | tibetan-savory-congee | — | — | production_recipe |
| tibetan_noodle | — | — | lhasa-tibetan-noodle-breakfast | concrete_research_lead |
| tsampa | — | — | tibetan-tuba-barley-thick-bowl | concrete_research_lead |
| wheatberry | — | — | qinghai-barley-wheatberry-meat-soup | concrete_research_lead |

## 7. 固定来源证据包

| 来源 | 等级 | 直接证明 | 不证明 | 反证 |
| --- | --- | --- | --- | --- |
| [尕面片](https://www.geermu.gov.cn/details?id=bb5cf28b7bd0297e017c2f524d0e0367)（格尔木市人民政府，2023-08-18） | A | lead:qinghai-ga-mianpian-broth:qinghai_household_noodle_identity | lead:qinghai-ga-mianpian-broth:project_single_pot_equivalence | — |
| [“共和滋味”亮相，十五道精品菜肴，总有一道打动你的胃！](https://www.gonghe.gov.cn/xwdt/tpxw/content_48610099)（共和县人民政府，2023-08-18） | A | lead:qinghai-barley-wheatberry-meat-soup:barley_wheatberry_meat_long_simmer_structure | lead:qinghai-barley-wheatberry-meat-soup:free_grain_or_meat_slot | — |
| [面疙瘩（吧图）](https://www.shannan.gov.cn/zjsn/snly/tsms/202603/t20260310_165467.html)（山南市文旅局，2026-03-10） | A | lead:tibetan-patu-one-pot:broth_and_noodle_lump_structure | lead:tibetan-patu-one-pot:project_ratio_time_vessel_equivalence | — |
| [人间烟火气](https://www.xizang.gov.cn/xwzx_406/bmkx/202506/t20250611_483433.html)（西藏自治区人民政府，2025-06-11） | A | lead:tibetan-patu-one-pot:tibetan_patu_identity | lead:tibetan-patu-one-pot:single_pot_equivalence | — |
| [藏族饮食文化 ｜饭食的类别与制作](https://www.tibetology.ac.cn/2022-02/12/content_41875089.htm)（中国藏学研究中心，2022-02-12） | A | lead:tibetan-tuba-barley-thick-bowl:barley_thick_bowl_structure | lead:tibetan-tuba-barley-thick-bowl:unattended_appliance_equivalence | — |
| [一起探索拉萨的美食世界](https://www.xizang.gov.cn/xwzx_406/dsdt/202411/t20241120_448021.html)（西藏自治区人民政府，2024-11-20） | A | lead:lhasa-tibetan-noodle-breakfast:lhasa_breakfast_noodle_and_beef_broth_identity | lead:lhasa-tibetan-noodle-breakfast:single_pot_complete_meal_equivalence | — |
| [快收藏！“吃在拉萨”攻略来啦~](https://wlt.xizang.gov.cn/xccx/lytg/202312/t20231222_395019.html)（西藏自治区文化和旅游厅，2023-12-22） | A | lead:lhasa-tibetan-noodle-breakfast:breakfast_context | lead:lhasa-tibetan-noodle-breakfast:project_ratio_time_safety | — |
| [舌尖上的雪域探寻三餐四季的味觉记忆](https://www.xizang.gov.cn/xwzx_406/bmkx/202505/t20250528_481144.html)（西藏自治区人民政府，2025-05-28） | A | production:tibetan-savory-congee:barley_grain_porridge_context | production:tibetan-savory-congee:traditional_recipe_equivalence | — |
| [藏历新年民俗文化漫谈](https://www.xizang.gov.cn/xwzx_406/bmkx/202503/t20250317_467534.html)（西藏自治区人民政府，2025-03-17） | A | production:tibetan-gutu:new_year_eve_context、production:tibetan-gutu:symbolic_filling_context、production:tibetan-ginseng-fruit-rice:new_year_ginseng_fruit_rice_combination | production:tibetan-gutu:production_ingredient_safety_equivalence、production:tibetan-gutu:traditional_recipe_equivalence、production:tibetan-ginseng-fruit-rice:daily_same_pot_ratio_equivalence、production:tibetan-ginseng-fruit-rice:traditional_recipe_equivalence | — |
| [食品安全消费提示](https://www.xiongan.gov.cn/20250429/7cbd00ffe7bd45668510b7f9fecbdd5d/c.html)（雄安新区综合执法局，2025-04-29） | A | safety:animal-food-cook-through-and-separate:principle | lead:tibetan-patu-one-pot:project_ratio_time_vessel_equivalence | — |
| [“花儿之乡”的土族土菜](https://digitalpaper.stdaily.com/http_www.kjrb.com/kjwzb/html/2022-07/22/content_538997.htm?div=0)（科普时报，2022-07-22） | A | production:qinghai-hao-fan:regional_name_context、production:qinghai-hao-fan:hao_fan_broth_root_vegetable_structure | production:qinghai-hao-fan:project_ingredient_equivalence、production:qinghai-hao-fan:project_ratio_dsl_equivalence、production:qinghai-hao-fan:traditional_recipe_equivalence | — |

## 8. 家庭适配与安全边界

本轮只记录具名工艺、食材形态和通用熟制原则，不编造克数、液体、火力、分钟数、锅具等价或自由替换关系。青稞整粒、糌粑炒制粉、面片、面疙瘩和藏面必须保持各自身份。

| 边界 | 状态 | 说明 |
| --- | --- | --- |
| qinghai-hao-fan-not-traditional-replica | not_proven | 直接来源支持肉汤、白萝卜、洋芋和粉条的熬饭轮廓；现有小米、土豆、熟鹰嘴豆条目只能称项目原创风味家庭适配，不得称传统复刻。 |
| tibetan-savory-congee-not-traditional-replica | not_proven | 藏式咸稀饭的地域谷物背景不等于传统成品配方。 |
| tibetan-gutu-not-traditional-replica | not_proven | 古突保留新年前夜和寓意馅料语境；非食品象征物禁止进入生成食材，节庆习俗不得改写成日常传统复刻。 |
| tibetan-ginseng-fruit-rice-not-traditional-replica | not_proven | 人参果、米饭、酥油、白糖的新年组合不证明日常高频、同锅焖煮、项目比例或替换关系。 |
| ga-mianpian-not-production-recipe | not_proven | 尕面片仅为研究线索，不得直接升格为生产菜谱。 |
| barley-wheatberry-meat-soup-not-free-grain-slot | not_proven | 青稞、麦仁与牛羊肉不能混写为自由谷物或肉类槽。 |
| patu-not-free-noodle-equivalence | not_proven | 帕图不得混写为任意面条或古突等价物。 |
| tuba-manual-thickening-not-unattended-appliance | not_proven | 土巴稠食描述不证明无人看管设备或普通粥等价。 |
| lhasa-noodle-breakfast-not-single-pot-proven | not_proven | 拉萨藏面早餐组合不证明单锅完整主餐。 |
| animal-food-cook-through-and-separate | principle_only | 通用熟制原则，不能替代本地工艺或项目时间。；控制：cook_through、prevent_cross_contamination |

## 9. 产品去向决策

| 类型 | 对象 | 状态 | 允许方向 | 未决边界 |
| --- | --- | --- | --- | --- |
| concrete_research_lead | lhasa-tibetan-noodle-breakfast | research_only | new_family_research、research_only | 保留早餐组合语境，不写成一锅复刻。 |
| concrete_research_lead | qinghai-barley-wheatberry-meat-soup | research_only | new_family_research、research_only | 保留明确主料与长熬结构。 |
| concrete_research_lead | qinghai-ga-mianpian-broth | research_only | new_family_research、research_only | 仅留作青海面片汤研究线索。 |
| concrete_research_lead | tibetan-patu-one-pot | research_only | new_family_research、research_only | 独立记录帕图，不与古突混写。 |
| concrete_research_lead | tibetan-tuba-barley-thick-bowl | research_only | new_family_research、research_only | 土巴独立于普通粥饭与任意稠食。 |
| production_recipe | qinghai-hao-fan | needs_more_evidence | recipe_evidence、research_only | 固定为家庭适配审计，不上调为传统复刻。 |
| production_recipe | tibetan-ginseng-fruit-rice | needs_manual_review | recipe_evidence、research_only | 保留藏历新年节庆与食品级蕨麻边界。 |
| production_recipe | tibetan-gutu | needs_more_evidence | recipe_evidence、research_only | 古突节庆身份独立记录，非食品象征物禁止进入生成食材。 |
| production_recipe | tibetan-savory-congee | needs_manual_review | recipe_evidence、research_only | 保留地域粥食背景与审计边界。 |

## 10. 12 条家庭食材旅程

| ID | 节点 | 类型 | 输入 | 研究对象 | 禁止主张 | 人工状态 |
| --- | --- | --- | --- | --- | --- | --- |
| qh-01 | CN-QH | family_research | 面粉、牛肉 | 研究家族：qinghai-noodle-piece-broth-main-bowl | traditional_replica | 待人工评审 |
| qh-02 | CN-QH | family_research | 青稞、麦仁、羊肉 | 研究家族：qinghai-barley-wheatberry-meat-soup | free_grain_slot | 待人工评审 |
| qh-03 | CN-QH | family_research | 小米、土豆、鹰嘴豆 | 研究家族：qinghai-grain-porridge-main-bowl | traditional_replica | 待人工评审 |
| qh-04 | CN-QH | family_research | 面粉、萝卜 | 研究家族：qinghai-noodle-piece-broth-main-bowl | single_pot_equivalence | 待人工评审 |
| qh-05 | CN-QH | family_research | 青稞、麦仁、牛肉 | 研究家族：qinghai-barley-wheatberry-meat-soup | free_meat_slot | 待人工评审 |
| qh-06 | CN-QH | family_research | 小米、土豆 | 研究家族：qinghai-grain-porridge-main-bowl | source_as_ratio_dsl | 待人工评审 |
| xz-01 | CN-XZ | family_research | 面粉、牛骨、白萝卜 | 研究家族：tibetan-patu-one-pot-main-bowl | free_noodle_equivalence | 待人工评审 |
| xz-02 | CN-XZ | family_research | 糌粑、肉丁、面块 | 研究家族：tibetan-tuba-barley-thick-main-bowl | unattended_appliance_equivalence | 待人工评审 |
| xz-03 | CN-XZ | family_research | 藏面、牛肉汤 | 研究家族：lhasa-noodle-breakfast-main-bowl | single_pot_complete_meal_equivalence | 待人工评审 |
| xz-04 | CN-XZ | production_audit | 青稞、咸味粥 | 生产审计：tibetan-savory-congee | traditional_replica | 待人工评审 |
| xz-05 | CN-XZ | family_research | 面粉、骨汤 | 研究家族：tibetan-patu-one-pot-main-bowl | project_ratio_time_vessel_equivalence | 待人工评审 |
| xz-06 | CN-XZ | family_research | 糌粑、奶渣、萝卜 | 研究家族：tibetan-tuba-barley-thick-main-bowl | free_barley_slot | 待人工评审 |

## 11. 完成状态

当前为 `research_in_progress`，阻塞项：production_evidence_gaps、ratio_dsl_unresolved、household_vessel_adaptation_unresolved、safety_endpoint_incomplete、human_journey_review_incomplete。来源只证明其直接陈述；它不自动成为项目 Ratio DSL、普通锅适配、完整主餐承诺或真人厨房验证。

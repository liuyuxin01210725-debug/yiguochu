<!-- Generated file: edit tools/data/yunnan-guizhou-rice-research.v1.json and rebuild. -->

# 云贵铜锅洋芋饭、菠萝糯米饭与社饭研究覆盖层

> 这是研究覆盖层，不是生产菜谱。本轮没有增加或修改 72 道生产菜谱，也没有把 3 条研究线索写入候选账本、Planner 或部署包。

- 地域：云贵（CN-YN、CN-GZ）
- 生产菜谱审计：2
- 现有候选审计：4
- 独立研究线索：3
- 来源：9（A 级 7，B 级 2）
- 家庭旅程：12（已人工评审 0）
- 当前状态：research_in_progress
- 阻塞项：production_evidence_gaps、candidate_specificity_gaps、rice_state_ratio_unresolved、household_vessel_adaptation_unresolved、safety_endpoint_incomplete、human_journey_review_incomplete

核心纠偏：江川铜锅洋芋饭与贵州侗家社饭都存在半熟或预处理米状态，半熟米不等于生米直接焖，也不等于熟剩饭。铜锅身份成立不等于普通锅或电饭煲已经验证等价。傣族菠萝糯米饭中的菠萝兼具果肉、酸甜、出水与容器作用，菠萝不等于芒果。云南菌类背景不得泛化为未知野生菌通用槽位。

## 1. 云南与贵州的真实覆盖

| 节点 | 生产 | 候选 | 研究线索 | 地图问题 |
| --- | --- | --- | --- | --- |
| 云南（CN-YN） | dai-pineapple-purple-rice | yunnan-copper-pot-potato-rice-home、yunnan-corn-chicken-rice、yunnan-ham-flavor-rice-pot、yunnan-mushroom-potato-rice | yunnan-dai-pineapple-glutinous-rice、yunnan-jiangchuan-copper-pot-potato-rice | 整理云南铜锅洋芋饭、菌菇饭、菠萝饭与器具替代边界。 |
| 贵州（CN-GZ） | guizhou-dong-community-rice | — | guizhou-dong-shefan-parboiled-rice | 核实贵州社饭、糯米饭与洋芋或腊味同锅主餐的地方结构。 |

## 2. 两道生产菜谱证据审计

| 菜谱 | 状态 | 核心食材 | 证据结论 | 禁止主张 | 决策 |
| --- | --- | --- | --- | --- | --- |
| 傣族菠萝紫米饭（dai-pineapple-purple-rice） | auto_approved / needs_manual_review | 紫米、菠萝 | dai_pineapple_rice_identity：supported<br>pineapple_glutinous_structure：supported<br>purple_glutinous_rice_variant：supported<br>mango_substitution_equivalence：not_proven<br>project_ratio_safety：not_proven | pineapple_vessel_as_generic_fruit_slot、mango_as_proven_equivalent、published_ratio_claim、internal_canonical_as_external_evidence | 地域与紫米变体有依据；芒果替换和液体比例仍需人工复核。 |
| 侗家社饭风味家庭适配版（guizhou-dong-community-rice） | auto_approved / needs_manual_review | 大米、腊五花肉、姜、小白菜 | dong_shefan_identity：supported<br>parboiled_glutinous_structure：supported<br>raw_rice_braise_as_traditional_process：not_proven<br>project_ratio_safety：not_proven | family_adaptation_as_traditional_replica、raw_rice_braise_as_traditional_process、ordinary_leafy_green_as_wormwood_equivalent、internal_canonical_as_external_evidence | 可保留明确标注的家庭适配版，但传统身份、米状态与现有 Ratio DSL 必须分开。 |

## 3. 四条旧候选逐条审计

| 候选 | 假设食材 | 证据结论 | 禁止主张 | 允许去向 |
| --- | --- | --- | --- | --- |
| 铜锅洋芋饭家庭版（yunnan-copper-pot-potato-rice-home） | 土豆、大米 | jiangchuan_copper_pot_potato_rice_identity：supported<br>parboiled_rice_process：supported<br>household_vessel_equivalence：not_proven<br>project_ratio_safety：not_proven | copper_pot_equals_electric_cooker、parboiled_rice_as_raw_rice、published_ratio_claim | candidate_evidence、template_evidence、ratio_rule |
| 玉米鸡肉饭（yunnan-corn-chicken-rice） | 玉米、鸡肉、大米 | yunnan_fixed_corn_chicken_rice_identity：not_proven<br>copper_pot_family_equivalence：not_proven<br>project_ratio_safety：not_proven | yunnan_identity_from_ingredient_list、cornmeal_as_corn_kernel_equivalence、copper_pot_family_by_default、published_ratio_claim | research_only、ratio_rule |
| 火腿风味可替换饭锅（yunnan-ham-flavor-rice-pot） | 火腿风味位、蔬菜、大米 | generic_ham_flavor_slot_identity：not_proven<br>free_ham_substitution_allowed：contradicted<br>project_ratio_safety：not_proven | abstract_flavor_as_ingredient、free_cured_meat_substitution、published_ratio_claim | research_only、substitution_rule、ratio_rule |
| 菌菇洋芋饭（yunnan-mushroom-potato-rice） | 菌菇、土豆、大米 | fixed_mushroom_potato_core：not_proven<br>free_wild_mushroom_substitution：contradicted<br>project_ratio_safety：not_proven | generic_wild_mushroom_slot、mixed_wild_mushrooms、regional_abundance_as_recipe_evidence、published_ratio_claim | research_only、candidate_evidence、ratio_rule |

## 4. 三条独立研究线索

| 线索 | 家族与餐型 | 关键形态 | 证据结论 | 禁止捷径 |
| --- | --- | --- | --- | --- |
| 贵州侗家社饭半熟米家族（guizhou-dong-shefan-parboiled-rice，CN-GZ） | parboiled-glutinous-shefan / parboiled_glutinous_or_mixed_rice_with_cooked_fillings_then_steamed_or_braised | parboiled_drained_rice、glutinous_rice、cured_meat_dice、processed_wormwood、peanut、dried_tofu_dice | regional_structure：supported<br>parboiled_rice_state：supported<br>project_ratio_safety：not_proven | raw_rice_braise_equivalence、ordinary_leafy_green_as_wormwood_equivalent、family_adaptation_as_traditional_replica |
| 云南傣族菠萝糯米饭家族（yunnan-dai-pineapple-glutinous-rice，CN-YN） | pineapple-vessel-glutinous-rice / cooked_glutinous_rice_mixed_with_pineapple_then_steamed_in_pineapple_vessel | glutinous_rice、purple_glutinous_rice、pineapple_dice、hollowed_pineapple_vessel | regional_structure：supported<br>pineapple_vessel_structure：supported<br>glutinous_rice_state：supported<br>project_ratio_safety：not_proven | pineapple_vessel_as_generic_fruit_slot、mango_as_proven_equivalent、raw_rice_braise_equivalence |
| 云南江川铜锅洋芋饭技法家族（yunnan-jiangchuan-copper-pot-potato-rice，CN-YN） | parboiled-copper-pot-potato-rice / parboiled_rice_over_fried_potato_then_copper_pot_finished | parboiled_drained_rice、fried_potato_chunks、copper_pot | regional_structure：supported<br>parboiled_rice_state：supported<br>project_ratio_safety：not_proven | raw_rice_braise_equivalence、cooked_leftover_rice_equivalence、copper_pot_equals_electric_cooker |

## 5. 三个不能混写的家族

| 家族 | 结构 | 证据状态 |
| --- | --- | --- |
| 半熟米铜锅洋芋饭（parboiled-copper-pot-potato-rice） | 半熟沥米铺于煎炒洋芋上，以铜锅继续焖熟 | regional_structure_supported_ratio_unresolved |
| 菠萝容器糯米饭（pineapple-vessel-glutinous-rice） | 熟或预熟糯米与菠萝丁混合后装入菠萝容器蒸制 | regional_structure_supported_ratio_unresolved |
| 半熟糯米社饭（parboiled-glutinous-shefan） | 半熟糯米或粳糯混合米与已处理菜肉混合后蒸或焖熟 | regional_structure_supported_ratio_unresolved |

## 6. Claim 与食材形态矩阵

| 对象 | claim | 结论 | 来源 | 理由 |
| --- | --- | --- | --- | --- |
| production_recipe:dai-pineapple-purple-rice | dai_pineapple_rice_identity | supported | yn-dai-food-culture-2021 | 云南省社科院文章支持傣族菠萝饭的云南民族饮食身份。 |
| production_recipe:dai-pineapple-purple-rice | mango_substitution_equivalence | not_proven | yn-dai-food-culture-2021、yn-dai-pineapple-structure-2023 | 两份来源均未把芒果证明为菠萝容器和酸甜结构的等价替换。 |
| production_recipe:dai-pineapple-purple-rice | pineapple_glutinous_structure | supported | yn-dai-pineapple-structure-2023 | 报道支持糯米与菠萝丁共同蒸制及菠萝容器结构。 |
| production_recipe:dai-pineapple-purple-rice | project_ratio_safety | not_proven | yn-dai-pineapple-structure-2023 | 来源不提供项目现有紫米预处理、菠萝出水和液体 DSL。 |
| production_recipe:dai-pineapple-purple-rice | purple_glutinous_rice_variant | supported | yn-dai-pineapple-structure-2023 | 来源明确把紫米列为白糯米之外的可见变体。 |
| production_recipe:guizhou-dong-community-rice | dong_shefan_identity | supported | gz-dong-shefestival-2019、gz-tongren-shefan-2025 | 贵州人大与铜仁政府页面共同支持贵州侗家及黔东地区社饭身份。 |
| production_recipe:guizhou-dong-community-rice | parboiled_glutinous_structure | supported | gz-dong-shefestival-2019、gz-tongren-shefan-2025 | 两份来源都记录半熟米与糯米、熟配料继续蒸或焖的结构。 |
| production_recipe:guizhou-dong-community-rice | project_ratio_safety | not_proven | gz-dong-shefestival-2019、gz-tongren-shefan-2025、cq-cured-meat-safety-2026 | 传统描述和通用腊味安全原则不能证明项目当前生米液体比例。 |
| production_recipe:guizhou-dong-community-rice | raw_rice_braise_as_traditional_process | not_proven | gz-dong-shefestival-2019、gz-tongren-shefan-2025 | 公开资料记录半熟沥米或预浸糯米等不同在地做法，不能据此把项目当前生米直接同焖定义为统一传统过程。 |
| concrete_research_lead:guizhou-dong-shefan-parboiled-rice | parboiled_rice_state | supported | gz-dong-shefestival-2019 | 来源明确糯米煮至半熟并滤去米汤后继续蒸熟。 |
| concrete_research_lead:guizhou-dong-shefan-parboiled-rice | project_ratio_safety | not_proven | gz-dong-shefestival-2019、gz-tongren-shefan-2025、cq-cured-meat-safety-2026 | 不同在地米配比并存，且没有项目锅径、液体与熟制 DSL。 |
| concrete_research_lead:guizhou-dong-shefan-parboiled-rice | regional_structure | supported | gz-dong-shefestival-2019、gz-tongren-shefan-2025 | 贵州官方页面共同支持社饭的节俗与半熟米、蒿菜、腊肉等结构。 |
| research_candidate:yunnan-copper-pot-potato-rice-home | household_vessel_equivalence | not_proven | yn-jiangchuan-copper-pot-process-2023 | 铜锅实地过程不能证明普通锅或电饭煲自动保留锅巴、受热和水分边界。 |
| research_candidate:yunnan-copper-pot-potato-rice-home | jiangchuan_copper_pot_potato_rice_identity | supported | yn-jiangchuan-copper-pot-process-2023 | 三联在玉溪江川实地报道支持铜锅洋芋饭地域身份。 |
| research_candidate:yunnan-copper-pot-potato-rice-home | parboiled_rice_process | supported | yn-jiangchuan-copper-pot-process-2023 | 来源明确记录米先煮半熟再铺于洋芋上继续焖熟。 |
| research_candidate:yunnan-copper-pot-potato-rice-home | project_ratio_safety | not_proven | yn-jiangchuan-copper-pot-process-2023、samr-potato-safety-2022 | 来源没有半熟度、锅径、加水量、火力和时间的机器规则。 |
| research_candidate:yunnan-corn-chicken-rice | copper_pot_family_equivalence | not_proven | yn-jiangchuan-copper-pot-process-2023 | 江川洋芋饭技法不证明玉米鸡肉可无条件进入同一铜锅家族。 |
| research_candidate:yunnan-corn-chicken-rice | project_ratio_safety | not_proven | nhc-poultry-safety-2013 | 禽肉熟透原则不能替代玉米形态、鸡肉部位和米液体比例。 |
| research_candidate:yunnan-corn-chicken-rice | yunnan_fixed_corn_chicken_rice_identity | not_proven | yn-dai-food-culture-2021、nhc-poultry-safety-2013 | 云南民族饮食概览与禽肉安全资料均不能证明玉米、鸡肉和大米构成固定云南饭锅。 |
| concrete_research_lead:yunnan-dai-pineapple-glutinous-rice | glutinous_rice_state | supported | yn-dai-pineapple-structure-2023 | 糯米是来源明确的主食状态，白糯米与紫米均可见。 |
| concrete_research_lead:yunnan-dai-pineapple-glutinous-rice | pineapple_vessel_structure | supported | yn-dai-pineapple-structure-2023 | 来源支持糯米与菠萝丁混合并装入菠萝容器蒸制。 |
| concrete_research_lead:yunnan-dai-pineapple-glutinous-rice | project_ratio_safety | not_proven | yn-dai-pineapple-structure-2023 | 没有紫米浸泡、菠萝出水、甜度和二次蒸制的机器规则。 |
| concrete_research_lead:yunnan-dai-pineapple-glutinous-rice | regional_structure | supported | yn-dai-food-culture-2021 | 云南省社科院支持傣族菠萝饭的地域民族饮食身份。 |
| research_candidate:yunnan-ham-flavor-rice-pot | free_ham_substitution_allowed | contradicted | cq-cured-meat-safety-2026 | 腌腊制品必须有明确名称、标签、来源和熟制要求，不能以风味位自由替换。 |
| research_candidate:yunnan-ham-flavor-rice-pot | generic_ham_flavor_slot_identity | not_proven | yn-jiangchuan-copper-pot-process-2023、cq-cured-meat-safety-2026 | 铜锅洋芋饭报道和腊味安全提示都不能证明抽象“火腿风味位”是地方菜身份。 |
| research_candidate:yunnan-ham-flavor-rice-pot | project_ratio_safety | not_proven | cq-cured-meat-safety-2026 | 高盐和熟透原则不提供具体火腿品种、克数与米液体比例。 |
| concrete_research_lead:yunnan-jiangchuan-copper-pot-potato-rice | parboiled_rice_state | supported | yn-jiangchuan-copper-pot-process-2023 | 米先煮至半熟是公开记录的关键状态。 |
| concrete_research_lead:yunnan-jiangchuan-copper-pot-potato-rice | project_ratio_safety | not_proven | yn-jiangchuan-copper-pot-process-2023、samr-potato-safety-2022 | 没有机器可执行的半熟度、保留水、锅径和火力规则。 |
| concrete_research_lead:yunnan-jiangchuan-copper-pot-potato-rice | regional_structure | supported | yn-jiangchuan-copper-pot-process-2023 | 实地报道支持江川铜锅、洋芋块、半熟米继续焖熟的结构。 |
| research_candidate:yunnan-mushroom-potato-rice | fixed_mushroom_potato_core | not_proven | yn-wild-mushroom-safety-2024 | 云南菌类饮食背景和安全资料都不能证明菌菇、洋芋、大米为固定地域核心。 |
| research_candidate:yunnan-mushroom-potato-rice | free_wild_mushroom_substitution | contradicted | yn-wild-mushroom-safety-2024 | 疾控明确要求不使用不熟悉野生菌、不得混杂加工，不能保留泛化菌菇槽。 |
| research_candidate:yunnan-mushroom-potato-rice | project_ratio_safety | not_proven | yn-wild-mushroom-safety-2024、samr-potato-safety-2022 | 安全原则不提供菌种、出水、米状态和液体比例。 |

| 形态 | 生产 | 候选 | 线索 | 来源层 |
| --- | --- | --- | --- | --- |
| copper_pot | — | yunnan-copper-pot-potato-rice-home | yunnan-jiangchuan-copper-pot-potato-rice | concrete_research_lead、research_candidate |
| corn_form_unresolved | — | yunnan-corn-chicken-rice | — | research_candidate |
| cured_meat_dice | guizhou-dong-community-rice | — | guizhou-dong-shefan-parboiled-rice | concrete_research_lead、production_recipe |
| dried_tofu_dice | guizhou-dong-community-rice | — | guizhou-dong-shefan-parboiled-rice | concrete_research_lead、production_recipe |
| fried_potato_chunks | — | yunnan-copper-pot-potato-rice-home | yunnan-jiangchuan-copper-pot-potato-rice | concrete_research_lead、research_candidate |
| glutinous_rice | dai-pineapple-purple-rice、guizhou-dong-community-rice | — | guizhou-dong-shefan-parboiled-rice、yunnan-dai-pineapple-glutinous-rice | concrete_research_lead、production_recipe |
| hollowed_pineapple_vessel | dai-pineapple-purple-rice | — | yunnan-dai-pineapple-glutinous-rice | concrete_research_lead、production_recipe |
| identified_mushroom | — | yunnan-mushroom-potato-rice | — | research_candidate |
| named_cured_ham_required | — | yunnan-ham-flavor-rice-pot | — | research_candidate |
| parboiled_drained_rice | guizhou-dong-community-rice | yunnan-copper-pot-potato-rice-home | guizhou-dong-shefan-parboiled-rice、yunnan-jiangchuan-copper-pot-potato-rice | concrete_research_lead、production_recipe、research_candidate |
| peanut | guizhou-dong-community-rice | — | guizhou-dong-shefan-parboiled-rice | concrete_research_lead、production_recipe |
| pineapple_dice | dai-pineapple-purple-rice | — | yunnan-dai-pineapple-glutinous-rice | concrete_research_lead、production_recipe |
| potato_chunks | — | yunnan-mushroom-potato-rice | — | research_candidate |
| processed_wormwood | guizhou-dong-community-rice | — | guizhou-dong-shefan-parboiled-rice | concrete_research_lead、production_recipe |
| purple_glutinous_rice | dai-pineapple-purple-rice | — | yunnan-dai-pineapple-glutinous-rice | concrete_research_lead、production_recipe |
| raw_chicken_pieces | — | yunnan-corn-chicken-rice | — | research_candidate |
| rice_state_unresolved | — | yunnan-corn-chicken-rice、yunnan-ham-flavor-rice-pot、yunnan-mushroom-potato-rice | — | research_candidate |
| vegetable_unspecified | — | yunnan-ham-flavor-rice-pot | — | research_candidate |

## 7. 固定来源证据包

| 来源 | 等级 | 直接证明 | 不证明 |
| --- | --- | --- | --- |
| [来这座云南小城，吃一顿最佳清凉组合](https://www.lifeweek.com.cn/h5/article/detail.do?artId=210143)（三联生活周刊，2023-08-03） | B | candidate:yunnan-copper-pot-potato-rice-home:jiangchuan_copper_pot_potato_rice_identity、candidate:yunnan-copper-pot-potato-rice-home:parboiled_rice_process、lead:yunnan-jiangchuan-copper-pot-potato-rice:regional_structure、lead:yunnan-jiangchuan-copper-pot-potato-rice:parboiled_rice_state | candidate:yunnan-copper-pot-potato-rice-home:household_vessel_equivalence、candidate:yunnan-copper-pot-potato-rice-home:project_ratio_safety、candidate:yunnan-corn-chicken-rice:copper_pot_family_equivalence、lead:yunnan-jiangchuan-copper-pot-potato-rice:project_ratio_safety、candidate:yunnan-ham-flavor-rice-pot:generic_ham_flavor_slot_identity |
| [传承云南民族饮食生态文化 做生物多样性保护的践行者](https://www.sky.yn.gov.cn/xsyj/zgsd/5730563027381222154)（云南省社会科学院，2021-10-15） | A | production:dai-pineapple-purple-rice:dai_pineapple_rice_identity、lead:yunnan-dai-pineapple-glutinous-rice:regional_structure | production:dai-pineapple-purple-rice:purple_glutinous_rice_variant、production:dai-pineapple-purple-rice:mango_substitution_equivalence、production:dai-pineapple-purple-rice:project_ratio_safety、candidate:yunnan-corn-chicken-rice:yunnan_fixed_corn_chicken_rice_identity |
| [美丽德宏专栏：吃在德宏｜当水果遇上米饭是一种怎样的体验？](https://www.mmgpmedia.com/static/content/HQ/2023-06-09/1116754450494013440.html)（云南广播电视台国际频道（来源标注云南省文化和旅游厅、芒市文旅），2023-06-09） | B | production:dai-pineapple-purple-rice:purple_glutinous_rice_variant、production:dai-pineapple-purple-rice:pineapple_glutinous_structure、lead:yunnan-dai-pineapple-glutinous-rice:pineapple_vessel_structure、lead:yunnan-dai-pineapple-glutinous-rice:glutinous_rice_state | production:dai-pineapple-purple-rice:mango_substitution_equivalence、production:dai-pineapple-purple-rice:project_ratio_safety、lead:yunnan-dai-pineapple-glutinous-rice:project_ratio_safety |
| [侗族社节](https://www.gzrd.gov.cn/gzwh/201912/t20191220_77669989.html?isMobile=true)（贵州省人大常委会网站（来源：黔东南新闻网），2019-12-20） | A | production:guizhou-dong-community-rice:dong_shefan_identity、production:guizhou-dong-community-rice:parboiled_glutinous_structure、lead:guizhou-dong-shefan-parboiled-rice:regional_structure、lead:guizhou-dong-shefan-parboiled-rice:parboiled_rice_state | production:guizhou-dong-community-rice:raw_rice_braise_as_traditional_process、production:guizhou-dong-community-rice:project_ratio_safety、lead:guizhou-dong-shefan-parboiled-rice:project_ratio_safety |
| [网络中国节·清明丨清明时节 社饭飘香](https://www.tongren.gov.cn/2025/0405/333568.shtml)（铜仁市人民政府网站（来源：铜仁市融媒体中心），2025-04-05） | A | production:guizhou-dong-community-rice:dong_shefan_identity、production:guizhou-dong-community-rice:parboiled_glutinous_structure、lead:guizhou-dong-shefan-parboiled-rice:regional_structure | production:guizhou-dong-community-rice:raw_rice_braise_as_traditional_process、production:guizhou-dong-community-rice:project_ratio_safety、lead:guizhou-dong-shefan-parboiled-rice:project_ratio_safety |
| [如何预防野生菌中毒？](https://ynsjkj.yn.gov.cn/html/2024/jikongkepu_0715/176.html)（云南省疾病预防控制局（文章来源：元江县疾控中心），2024-07-15） | A | safety:identified-mushroom-only-and-cook-through:principle | candidate:yunnan-mushroom-potato-rice:fixed_mushroom_potato_core、candidate:yunnan-mushroom-potato-rice:project_ratio_safety |
| [发芽的马铃薯还能吃吗？](https://www.samr.gov.cn/spcjs/yjjl/art/2022/art_d958ba4998c94acda15b72b195c62e4d.html)（国家市场监督管理总局，2022-05-05） | A | safety:potato-sprout-green-control:principle | candidate:yunnan-copper-pot-potato-rice-home:project_ratio_safety、candidate:yunnan-mushroom-potato-rice:project_ratio_safety、lead:yunnan-jiangchuan-copper-pot-potato-rice:project_ratio_safety |
| [腊肉、香肠的消费提示](https://scjgj.cq.gov.cn/bkzs/xfts/202602/t20260213_15442166.html)（重庆市市场监督管理局，2026-02-13） | A | safety:cured-meat-cook-through-and-salt:principle | candidate:yunnan-ham-flavor-rice-pot:generic_ham_flavor_slot_identity、candidate:yunnan-ham-flavor-rice-pot:project_ratio_safety、production:guizhou-dong-community-rice:project_ratio_safety、lead:guizhou-dong-shefan-parboiled-rice:project_ratio_safety |
| [国家食品安全风险评估中心提示H7N9禽流感病毒的食品安全预防措施](https://www.nhc.gov.cn/wjw/zsdw/201304/fa27a4afecb740a3b51df0e9f33c839b.shtml)（中华人民共和国国家卫生健康委员会，2013-04-07） | A | safety:poultry-cook-through:principle | candidate:yunnan-corn-chicken-rice:yunnan_fixed_corn_chicken_rice_identity、candidate:yunnan-corn-chicken-rice:project_ratio_safety |

## 8. 家庭适配与安全边界

本轮只记录米状态、锅具、水分、食品身份和熟制原则，不编造克数、液体、火力、分钟数或电饭煲程序。野生菌不得由地域标签泛化为可食用槽位。

| 边界 | 状态 | 说明 |
| --- | --- | --- |
| parboiled-rice-not-raw-or-leftover | supported_boundary | 半熟沥米保留内部水分并需继续熟化，不得套用生米液体或熟剩饭翻炒规则。 |
| copper-pot-not-electric-cooker | unresolved | 铜锅受热、锅巴和水分蒸发是身份变量；普通锅或电饭煲等价尚未验证。 |
| pineapple-vessel-not-generic-fruit-slot | supported_boundary | 菠萝同时提供果肉、酸甜、出水与容器；芒果不能静默替代。 |
| identified-mushroom-not-generic-wild-slot | supported_boundary | 菌菇候选必须明确食品名称和正规来源；不得将未知野生菌纳入泛化槽位。 |
| potato-sprout-green-control | principle_only | 大面积发芽或变绿土豆丢弃，使用者必须彻底熟透。；控制：检查芽与绿色面积、去皮切块、彻底熟透 |
| identified-mushroom-only-and-cook-through | principle_only | 只使用明确可食用且来源可靠的单一菌种，并彻底高温熟透。；控制：不使用不熟悉野生菌、不混杂未知菌种、明确食品身份与来源、彻底熟透 |
| cured-meat-cook-through-and-salt | principle_only | 腊味须标签和来源清晰、彻底熟透，并控制额外盐与摄入量。；控制：核验标签与来源、生熟分开、彻底熟透、尝味后再补盐 |
| poultry-cook-through | principle_only | 禽肉必须烧熟煮透并避免生熟交叉污染。；控制：生熟分开、禽肉中心熟透、不得端出淡红或流血水禽肉 |

## 9. 产品去向决策

| 类型 | 对象 | 状态 | 允许方向 | 未决边界 |
| --- | --- | --- | --- | --- |
| production_recipe | dai-pineapple-purple-rice | needs_manual_review | recipe_evidence、template_evidence、ratio_rule | 地域与紫米变体有依据；芒果替换和液体比例仍需人工复核。 |
| production_recipe | guizhou-dong-community-rice | needs_manual_review | recipe_evidence、new_family_research、ratio_rule | 可保留明确标注的家庭适配版，但传统身份、米状态与现有 Ratio DSL 必须分开。 |
| concrete_research_lead | guizhou-dong-shefan-parboiled-rice | research_only | recipe_evidence、new_family_research、template_evidence、ratio_rule | 先把传统半熟米家族与当前家庭适配版分开，避免用家庭版反向定义传统。 |
| research_candidate | yunnan-copper-pot-potato-rice-home | needs_more_evidence | candidate_evidence、template_evidence、ratio_rule | 优先研究铜锅洋芋饭家族；普通锅具适配和 Ratio DSL 完成前不晋升。 |
| research_candidate | yunnan-corn-chicken-rice | needs_more_evidence | research_only、ratio_rule | 现阶段缺少地域结构证据，不能仅凭云南常见食材晋升。 |
| concrete_research_lead | yunnan-dai-pineapple-glutinous-rice | research_only | recipe_evidence、template_evidence、ratio_rule | 用于校准现有菠萝紫米饭，而不是建立任意水果替换模板。 |
| research_candidate | yunnan-ham-flavor-rice-pot | needs_more_evidence | research_only、substitution_rule、ratio_rule | 必须先落到具体火腿食品身份和显式替换规则，抽象风味位不能进入生产。 |
| concrete_research_lead | yunnan-jiangchuan-copper-pot-potato-rice | research_only | candidate_evidence、new_family_research、template_evidence、ratio_rule | 先建立技法家族，再判断家庭锅具适配；不以固定菜名数量替代组合能力。 |
| research_candidate | yunnan-mushroom-potato-rice | needs_more_evidence | research_only、candidate_evidence、ratio_rule | 只保留为明确品种、正规来源菌菇的研究题目；不得使用野生菌泛化。 |

## 10. 12 条家庭食材旅程

| ID | 节点 | 模式/意图 | 输入 | 允许家族 | 结构 | 研究结论 | 禁止主张 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| YG-01 | CN-YN | recommend/normal | 大米、土豆 | parboiled-copper-pot-potato-rice | 识别为江川铜锅洋芋饭研究结构，但不承诺普通锅等价。 | research_only_until_vessel_and_ratio_validation | copper_pot_equals_electric_cooker、raw_rice_braise_equivalence |
| YG-02 | CN-YN | pantry/normal | 大米、土豆、普通电饭煲 | parboiled-copper-pot-potato-rice | 器具适配未验证，暂停宣称完整家庭版。 | needs_more_evidence | copper_pot_equals_electric_cooker、published_ratio_claim |
| YG-03 | CN-YN | recommend/quick | 剩米饭、土豆 | — | 剩米饭不进入半熟米铜锅洋芋饭家族。 | reject_family_equivalence | cooked_leftover_rice_equivalence |
| YG-04 | CN-YN | recommend/normal | 糯米、菠萝 | pineapple-vessel-glutinous-rice | 优先糯米与菠萝，不强制紫米。 | regional_structure_supported_ratio_pending | published_ratio_claim |
| YG-05 | CN-YN | recommend/fresh | 紫糯米、菠萝 | pineapple-vessel-glutinous-rice | 紫米作为已见变体进入菠萝糯米饭。 | production_audit_candidate_for_human_review | published_ratio_claim |
| YG-06 | CN-YN | pantry/normal | 紫糯米、芒果 | — | 芒果不能替代菠萝容器和出水结构。 | no_proven_regional_equivalence | mango_as_proven_equivalent、pineapple_vessel_as_generic_fruit_slot |
| YG-07 | CN-GZ | recommend/batch | 糯米、大米、腊肉、蒿菜 | parboiled-glutinous-shefan | 米先预处理至半熟，配料先处理，再蒸或焖熟。 | regional_structure_supported_ratio_pending | raw_rice_braise_equivalence |
| YG-08 | CN-GZ | recommend/normal | 大米、腊五花肉、小白菜 | parboiled-glutinous-shefan | 只可解释为家庭适配版，不得称传统社饭复刻。 | production_audit_needs_manual_review | family_adaptation_as_traditional_replica、ordinary_leafy_green_as_wormwood_equivalent |
| YG-09 | CN-YN | recommend/normal | 大米、土豆、香菇 | — | 可作为家庭组合研究，但未证明为固定云南菌菇洋芋饭。 | candidate_specificity_gap | regional_abundance_as_recipe_evidence |
| YG-10 | CN-YN | pantry/normal | 大米、土豆、未知野生菌 | — | 未知野生菌不得规划。 | safety_rejection | generic_wild_mushroom_slot、mixed_wild_mushrooms |
| YG-11 | CN-YN | recommend/normal | 大米、玉米粒、鸡腿肉 | — | 不能仅凭三种食材命名为云南玉米鸡肉饭或套铜锅家族。 | regional_identity_not_proven | yunnan_identity_from_ingredient_list、copper_pot_family_by_default |
| YG-12 | CN-YN | recommend/normal | 大米、任意火腿风味食材、青菜 | — | 抽象火腿风味位必须退回具体食品身份和显式替换。 | ingredient_identity_required | abstract_flavor_as_ingredient、free_cured_meat_substitution |

## 11. 完成状态

当前为 `research_in_progress`，阻塞项：production_evidence_gaps、candidate_specificity_gaps、rice_state_ratio_unresolved、household_vessel_adaptation_unresolved、safety_endpoint_incomplete、human_journey_review_incomplete。来源证明地域家族，不等于项目 Ratio DSL、家庭器具适配或人工厨房验证已经完成。

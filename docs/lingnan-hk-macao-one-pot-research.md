<!-- Generated file: edit tools/data/lingnan-hk-macao-one-pot-research.v1.json and rebuild. -->

# 岭南、香港与澳门一锅主餐研究覆盖层

> 这是研究覆盖层，不是生产菜谱。本轮没有增加或修改 72 道生产菜谱，也没有把 5 条研究线索写入候选账本、Planner 或部署包。

- 地域：岭南与港澳（CN-GD、CN-GX、CN-HI、CN-HK、CN-MO）
- 生产菜谱审计：5
- 现有候选审计：0
- 独立研究线索：5
- 来源：12（A 级 9，B 级 2，C 级 1）
- 家庭旅程：15（已人工评审 0）
- 当前状态：research_in_progress
- 阻塞项：production_evidence_gaps、ratio_dsl_unresolved、household_vessel_adaptation_unresolved、meal_sufficiency_unresolved、safety_endpoint_incomplete、human_journey_review_incomplete

核心纠偏：广式煲仔饭的瓦煲、米饭部分熟后加具名浇头、低火收水与锅巴共同构成工艺边界；普通锅或电饭煲只能称“广式风味焖饭”，不能承诺瓦煲锅巴复刻。腊味、香菇滑鸡、豆豉排骨是具名分支，不是任意互换的蛋白槽。香港当前有煲仔饭消费场景，不等于香港独创。广西五色糯米饭的天然植物染色浸米与食品粉家庭适配必须分开；本轮“广西传统菠萝饭”未证实。海南有三条不能混写的线：定安菜包饭是熟饭、熟馅、出锅后生菜包裹的多阶段结构；椰丝饭只证实主食结构，存在完整主餐蛋白与配菜不足的风险；海南鸡饭是鸡饭分熟，白切鸡另烫、饭以鸡汤或鸡油另煮或拌熟饭，不证明生鸡生米全程同锅。澳门葡式海鲜饭仍是菜单研究线索，未证实单锅过程。

## 1. 五个节点的真实覆盖

| 节点 | 生产 | 候选 | 研究线索 | 地图问题 |
| --- | --- | --- | --- | --- |
| 广东（CN-GD） | cantonese-black-bean-pork-rib-claypot-rice、cantonese-cured-meat-claypot-rice、cantonese-mushroom-chicken-claypot-rice | — | cantonese-claypot-rice-technique | 整理广东煲仔饭、砂锅饭与腊味鸡肉排骨变种的共享技法。 |
| 广西（CN-GX） | guangxi-five-color-glutinous-rice | — | guangxi-natural-dye-five-color-glutinous-rice | 核实广西糯米饭、菠萝饭与壮族家庭主餐的地域和技法边界。 |
| 海南（CN-HI） | hainan-cai-bao-rice | — | hainan-coconut-shredded-rice、hainan-dingan-cai-bao-finished-rice | 核实海南菜包饭、椰香饭与家庭一锅适配的主食结构。 |
| 香港（CN-HK） | — | — | — | 核实香港煲仔饭及家庭砂锅主餐的地方变种与来源。 |
| 澳门（CN-MO） | — | — | macao-portuguese-style-seafood-rice | 核实澳门砂锅饭和葡式影响下可归入家庭一锅主餐的地方原型。 |

## 2. 五道生产菜谱证据审计

| 菜谱 | 状态 | 核心食材 | 证据结论 | 禁止主张 | 决策 |
| --- | --- | --- | --- | --- | --- |
| 广式豆豉排骨煲仔饭（cantonese-black-bean-pork-rib-claypot-rice） | auto_approved / needs_manual_review | 大米、猪肋排、豆豉 | guangzhou_claypot_identity：supported<br>named_branch_identity：supported<br>ordinary_pot_equivalence：not_proven<br>project_ratio_safety：not_proven | claypot_equals_ordinary_covered_pot、pork_rib_as_free_protein_slot、published_ratio_claim | 豆豉排骨是具名分支，不能以泛猪肉或普通锅替换后仍宣称原型。 |
| 广式腊味煲仔饭（cantonese-cured-meat-claypot-rice） | auto_approved / needs_manual_review | 大米、广式腊肠、菜心 | guangzhou_claypot_identity：supported<br>named_branch_identity：supported<br>ordinary_pot_equivalence：not_proven<br>project_ratio_safety：not_proven | claypot_equals_ordinary_covered_pot、named_topping_as_free_slot、published_ratio_claim | 可保留广式风味审计，但不得把普通锅家庭适配称为瓦煲复刻。 |
| 广式香菇滑鸡煲仔饭（cantonese-mushroom-chicken-claypot-rice） | auto_approved / needs_manual_review | 大米、去皮鸡腿肉、鲜香菇 | guangzhou_claypot_identity：supported<br>named_branch_identity：supported<br>ordinary_pot_equivalence：not_proven<br>project_ratio_safety：not_proven | claypot_equals_ordinary_covered_pot、chicken_cut_as_free_substitution、published_ratio_claim | 具名香菇滑鸡分支可以审计，部位、锅具和比例仍需独立验证。 |
| 广西壮族五色糯米饭（guangxi-five-color-glutinous-rice） | auto_approved / needs_manual_review | 糯米、食品级紫薯粉、食品级甜菜粉、食品级菠菜粉、食品级南瓜粉 | guangxi_natural_dye_structure：supported<br>food_powder_as_traditional_equivalence：not_proven<br>guangxi_pineapple_rice_regional_identity：not_proven<br>project_ratio_safety：not_proven | food_powders_as_traditional_natural_dyes、guangxi_traditional_pineapple_rice_claim、published_ratio_claim | 保留家庭食品粉适配的诚实标注，但不得回写为传统天然染色复刻。 |
| 海南定安菜包饭（hainan-cai-bao-rice） | auto_approved / needs_manual_review | 大米、生菜、胡萝卜 | dingan_cai_bao_identity：supported<br>finished_rice_and_cooked_filling_structure：supported<br>single_vessel_one_pot_equivalence：not_proven<br>project_fixed_ingredient_core：not_proven | raw_rice_all_ingredients_single_vessel、lettuce_as_cooked_pot_ingredient、one_field_example_as_fixed_recipe | 菜包饭应保留多阶段结构；当前项目轻量版本不得冒充完整传统配方。 |

## 3. 候选账本基线

当前岭南、香港与澳门节点没有既有候选可审计；“0 candidates”是基线事实，不以虚构候选补齐。

## 4. 五条独立研究线索

| 线索 | 家族与餐型 | 关键形态 | 证据结论 | 禁止捷径 |
| --- | --- | --- | --- | --- |
| 广式煲仔饭具名浇头工艺（cantonese-claypot-rice-technique，CN-GD） | raw-rice-claypot-late-named-topping / raw_rice_in_claypot_then_late_named_topping_low_heat_finish | raw_rice、claypot、named_late_topping、low_heat_finish、pot_crust | cantonese_claypot_rice_identity：supported<br>late_named_topping_structure：supported<br>hong_kong_current_presence：supported<br>hong_kong_exclusive_origin：not_proven<br>household_vessel_equivalence：not_proven<br>named_toppings_as_free_protein_slot：not_proven<br>project_ratio_safety：not_proven | claypot_equals_ordinary_covered_pot、hong_kong_exclusive_origin、named_toppings_as_free_protein_slot、published_ratio_claim |
| 广西天然植物染色五色糯米饭（guangxi-natural-dye-five-color-glutinous-rice，CN-GX） | natural-dye-steamed-glutinous-rice / separately_natural_dye_soaked_glutinous_rice_then_steam | glutinous_rice、natural_plant_dye_liquids、separately_colored_rice | natural_dye_steamed_structure：supported<br>food_powder_as_traditional_equivalence：not_proven<br>guangxi_pineapple_rice_regional_identity：not_proven<br>project_ratio_safety：not_proven | food_powders_as_traditional_natural_dyes、guangxi_traditional_pineapple_rice_claim、free_colorant_substitution、published_ratio_claim |
| 海南椰丝饭主食结构（hainan-coconut-shredded-rice，CN-HI） | coconut-shredded-rice-staple / raw_rice_and_fresh_coconut_shred_simmered_as_staple | raw_rice、fresh_coconut_shred、cooking_oil、water | coconut_rice_structure：supported<br>complete_main_meal_sufficiency：not_proven<br>coconut_milk_equivalence：not_proven<br>project_ratio_safety：not_proven | coconut_milk_equals_fresh_coconut_shred、automatic_protein_slot、complete_one_pot_main_meal_claim |
| 海南定安菜包饭熟饭熟馅包裹结构（hainan-dingan-cai-bao-finished-rice，CN-HI） | finished-rice-cooked-filling-lettuce-wrap / cooked_rice_stir_fry_then_fresh_lettuce_wrap_after_heat | cooked_rice、cooked_filling、fresh_lettuce_leaf、sauce_final | dingan_cai_bao_identity：supported<br>finished_rice_and_cooked_filling_structure：supported<br>single_vessel_one_pot_equivalence：not_proven<br>fixed_ingredient_core：not_proven<br>project_ratio_safety：not_proven | raw_rice_all_ingredients_single_vessel、lettuce_as_cooked_pot_ingredient、one_field_example_as_fixed_recipe |
| 澳门葡式海鲜饭菜单线索（macao-portuguese-style-seafood-rice，CN-MO） | macao-portuguese-style-seafood-rice-unresolved / portuguese_style_seafood_rice_menu_presence_process_unresolved | seafood_form_unresolved、rice_state_unresolved、portuguese_style_seasoning_unresolved | macao_portuguese_style_seafood_rice_presence：supported<br>single_pot_process：not_proven<br>portuguese_chicken_as_rice_pot：not_proven<br>project_ratio_safety：not_proven | menu_presence_as_one_pot_process、portuguese_chicken_as_seafood_rice_equivalent、generic_macao_menu_as_family_evidence |

## 5. 五个不能混写的家族

| 家族 | 结构 | 证据状态 |
| --- | --- | --- |
| 广式瓦煲晚加具名浇头饭（raw-rice-claypot-late-named-topping） | raw_rice_then_late_named_topping_low_heat_finish | supported_with_boundaries |
| 天然染色分批蒸糯米（natural-dye-steamed-glutinous-rice） | natural_dye_soak_then_steam | supported_with_boundaries |
| 熟饭熟馅生菜包裹（finished-rice-cooked-filling-lettuce-wrap） | stir_fry_finished_rice_then_wrap_after_heat | supported_with_boundaries |
| 椰丝焖饭主食（coconut-shredded-rice-staple） | raw_rice_coconut_shred_staple | supported_as_staple_only |
| 澳门葡式海鲜饭待核工艺（macao-portuguese-style-seafood-rice-unresolved） | menu_presence_process_unresolved | research_only |

## 6. Claim 与食材形态矩阵

| 对象 | claim | 结论 | 来源 | 理由 |
| --- | --- | --- | --- | --- |
| concrete_research_lead:cantonese-claypot-rice-technique | cantonese_claypot_rice_identity | supported | gd-cantonese-standard-undated、gd-xiguan-draft-claypot-rice-undated | 正式标准身份线索与政府托管工艺稿分别支持类别身份。 |
| concrete_research_lead:cantonese-claypot-rice-technique | hong_kong_current_presence | supported | hk-tourism-claypot-food-map-undated | 香港旅游发展局指南支持香港当前煲仔饭消费与变体。 |
| concrete_research_lead:cantonese-claypot-rice-technique | hong_kong_exclusive_origin | not_proven | hk-tourism-claypot-food-map-undated | 在地消费不等于香港独创或排他来源。 |
| concrete_research_lead:cantonese-claypot-rice-technique | household_vessel_equivalence | not_proven | gd-cantonese-standard-undated、gd-xiguan-draft-claypot-rice-undated、hk-tourism-claypot-food-map-undated | 现有资料不能证明普通带盖锅、电饭煲可保留瓦煲受热和锅巴。 |
| concrete_research_lead:cantonese-claypot-rice-technique | late_named_topping_structure | supported | gd-xiguan-draft-claypot-rice-undated | 征求意见稿明确饭七成熟加腊味、香菇滑鸡或豆豉排骨等具名浇头。 |
| concrete_research_lead:cantonese-claypot-rice-technique | named_toppings_as_free_protein_slot | not_proven | gd-xiguan-draft-claypot-rice-undated | 具名分支不能抽象为任意蛋白槽。 |
| concrete_research_lead:cantonese-claypot-rice-technique | project_ratio_safety | not_proven | gd-cantonese-standard-undated、gd-xiguan-draft-claypot-rice-undated、hk-tourism-claypot-food-map-undated | 资料没有项目锅径、火力、米水和时间 DSL。 |
| concrete_research_lead:guangxi-natural-dye-five-color-glutinous-rice | food_powder_as_traditional_equivalence | not_proven | gx-foreign-affairs-five-color-rice-2021 | 传统天然汁浸米不能证明食品粉适配为传统等价。 |
| concrete_research_lead:guangxi-natural-dye-five-color-glutinous-rice | guangxi_pineapple_rice_regional_identity | not_proven | gx-foreign-affairs-five-color-rice-2021 | 本轮广西来源未支持该地域归属。 |
| concrete_research_lead:guangxi-natural-dye-five-color-glutinous-rice | natural_dye_steamed_structure | supported | gx-foreign-affairs-five-color-rice-2021、gx-baise-tax-five-color-rice-2024 | 广西官方资料支持天然植物汁分色浸米和蒸制。 |
| concrete_research_lead:guangxi-natural-dye-five-color-glutinous-rice | project_ratio_safety | not_proven | gx-foreign-affairs-five-color-rice-2021、gx-baise-tax-five-color-rice-2024 | 无机器可执行的染液、浸泡和蒸制比例。 |
| concrete_research_lead:hainan-coconut-shredded-rice | coconut_milk_equivalence | not_proven | hi-gov-coconut-shredded-rice-2024 | 椰肉刨丝不证明可用椰浆或椰奶无条件替代。 |
| concrete_research_lead:hainan-coconut-shredded-rice | coconut_rice_structure | supported | hi-gov-coconut-shredded-rice-2024 | 海南政府转载资料支持椰丝、大米、油和水焖熟结构。 |
| concrete_research_lead:hainan-coconut-shredded-rice | complete_main_meal_sufficiency | not_proven | hi-gov-coconut-shredded-rice-2024 | 主食结构不自动证明其为含蛋白的完整一餐。 |
| concrete_research_lead:hainan-coconut-shredded-rice | project_ratio_safety | not_proven | hi-gov-coconut-shredded-rice-2024 | 资料无可执行液体、油脂和熟制 DSL。 |
| concrete_research_lead:hainan-dingan-cai-bao-finished-rice | dingan_cai_bao_identity | supported | hi-agri-dingan-ich-2024 | 海南农业农村厅资料支持定安菜包饭技艺身份。 |
| concrete_research_lead:hainan-dingan-cai-bao-finished-rice | finished_rice_and_cooked_filling_structure | supported | hi-gov-dingan-cai-bao-2026 | 现场结构为熟饭熟馅炒制后，再用生菜和酱汁包裹。 |
| concrete_research_lead:hainan-dingan-cai-bao-finished-rice | fixed_ingredient_core | not_proven | hi-agri-dingan-ich-2024、hi-gov-dingan-cai-bao-2026 | 非遗身份与一次现场展示不等于永久固定食材表。 |
| concrete_research_lead:hainan-dingan-cai-bao-finished-rice | project_ratio_safety | not_proven | hi-agri-dingan-ich-2024、hi-gov-dingan-cai-bao-2026 | 资料无适用于项目的肉、海味和熟饭处理比例。 |
| concrete_research_lead:hainan-dingan-cai-bao-finished-rice | single_vessel_one_pot_equivalence | not_proven | hi-gov-dingan-cai-bao-2026 | 菜叶包裹发生在出锅后，不证明全部原料一锅焖熟。 |
| concrete_research_lead:macao-portuguese-style-seafood-rice | macao_portuguese_style_seafood_rice_presence | supported | mo-tourism-portuguese-seafood-rice-undated | 澳门旅游推广资料提供在地菜单线索。 |
| concrete_research_lead:macao-portuguese-style-seafood-rice | portuguese_chicken_as_rice_pot | not_proven | mo-tourism-portuguese-seafood-rice-undated | 该线索不能把葡国鸡或焗猪扒饭重写成海鲜饭锅。 |
| concrete_research_lead:macao-portuguese-style-seafood-rice | project_ratio_safety | not_proven | mo-tourism-portuguese-seafood-rice-undated | 没有米、水、海鲜形态与熟制终点的机器规则。 |
| concrete_research_lead:macao-portuguese-style-seafood-rice | single_pot_process | not_proven | mo-tourism-portuguese-seafood-rice-undated | 菜单线索不写明完整烹饪过程。 |
| production_recipe:cantonese-black-bean-pork-rib-claypot-rice | guangzhou_claypot_identity | supported | gd-xiguan-draft-claypot-rice-undated | 来源支持广州煲仔饭类别身份。 |
| production_recipe:cantonese-black-bean-pork-rib-claypot-rice | named_branch_identity | supported | gd-xiguan-draft-claypot-rice-undated | 来源明确列豆豉排骨为具名种类。 |
| production_recipe:cantonese-black-bean-pork-rib-claypot-rice | ordinary_pot_equivalence | not_proven | gd-xiguan-draft-claypot-rice-undated | 瓦煲过程不能自动成为普通锅等价做法。 |
| production_recipe:cantonese-black-bean-pork-rib-claypot-rice | project_ratio_safety | not_proven | gd-xiguan-draft-claypot-rice-undated、zs-market-food-safety-2026 | 排骨熟透原则不能证明项目比例与时间。 |
| production_recipe:cantonese-cured-meat-claypot-rice | guangzhou_claypot_identity | supported | gd-xiguan-draft-claypot-rice-undated | 广东政府托管征求意见稿将煲仔饭列为广州特色名菜。 |
| production_recipe:cantonese-cured-meat-claypot-rice | named_branch_identity | supported | gd-xiguan-draft-claypot-rice-undated | 来源明确列出腊味作为具名种类。 |
| production_recipe:cantonese-cured-meat-claypot-rice | ordinary_pot_equivalence | not_proven | gd-xiguan-draft-claypot-rice-undated | 瓦煲和锅巴过程不证明普通带盖锅或电饭煲等价。 |
| production_recipe:cantonese-cured-meat-claypot-rice | project_ratio_safety | not_proven | gd-xiguan-draft-claypot-rice-undated、cq-cured-meat-safety-2026 | 传统描述和腊味安全原则都不提供项目机器比例。 |
| production_recipe:cantonese-mushroom-chicken-claypot-rice | guangzhou_claypot_identity | supported | gd-xiguan-draft-claypot-rice-undated | 来源支持广州煲仔饭的类别身份。 |
| production_recipe:cantonese-mushroom-chicken-claypot-rice | named_branch_identity | supported | gd-xiguan-draft-claypot-rice-undated | 来源明确列香菇滑鸡为具名种类。 |
| production_recipe:cantonese-mushroom-chicken-claypot-rice | ordinary_pot_equivalence | not_proven | gd-xiguan-draft-claypot-rice-undated | 瓦煲熟制过程不能直接迁移到普通锅。 |
| production_recipe:cantonese-mushroom-chicken-claypot-rice | project_ratio_safety | not_proven | gd-xiguan-draft-claypot-rice-undated、zs-market-food-safety-2026 | 鸡肉熟透原则不构成生米液体或时间规则。 |
| production_recipe:guangxi-five-color-glutinous-rice | food_powder_as_traditional_equivalence | not_proven | gx-foreign-affairs-five-color-rice-2021、gx-baise-tax-five-color-rice-2024 | 天然植物浸米不证明食品粉版本为传统等价。 |
| production_recipe:guangxi-five-color-glutinous-rice | guangxi_natural_dye_structure | supported | gx-foreign-affairs-five-color-rice-2021、gx-baise-tax-five-color-rice-2024 | 两份广西官方资料共同支持天然植物汁分色浸泡糯米再蒸制。 |
| production_recipe:guangxi-five-color-glutinous-rice | guangxi_pineapple_rice_regional_identity | not_proven | gx-foreign-affairs-five-color-rice-2021 | 本轮广西资料不支持把菠萝饭写为广西传统家族。 |
| production_recipe:guangxi-five-color-glutinous-rice | project_ratio_safety | not_proven | gx-foreign-affairs-five-color-rice-2021、gx-baise-tax-five-color-rice-2024 | 来源不提供项目可执行的浸泡和蒸制机器比例。 |
| production_recipe:hainan-cai-bao-rice | dingan_cai_bao_identity | supported | hi-agri-dingan-ich-2024 | 海南省农业农村厅资料支持定安菜包饭烹制技艺的非遗身份。 |
| production_recipe:hainan-cai-bao-rice | finished_rice_and_cooked_filling_structure | supported | hi-gov-dingan-cai-bao-2026 | 来源记录炒熟米饭和熟馅，出锅后再用生菜与酱汁包裹。 |
| production_recipe:hainan-cai-bao-rice | project_fixed_ingredient_core | not_proven | hi-agri-dingan-ich-2024、hi-gov-dingan-cai-bao-2026、zs-market-food-safety-2026 | 非遗身份、一次现场配料和通用安全原则都不能证明项目固定核心或比例。 |
| production_recipe:hainan-cai-bao-rice | single_vessel_one_pot_equivalence | not_proven | hi-gov-dingan-cai-bao-2026 | 出锅包裹结构不能写成全部原料单锅焖熟。 |

| 形态 | 生产 | 候选 | 线索 | 来源层 |
| --- | --- | --- | --- | --- |
| chicken_pieces | cantonese-mushroom-chicken-claypot-rice | — | — | production_recipe |
| claypot | cantonese-black-bean-pork-rib-claypot-rice、cantonese-cured-meat-claypot-rice、cantonese-mushroom-chicken-claypot-rice | — | cantonese-claypot-rice-technique | concrete_research_lead、production_recipe |
| cooked_filling | hainan-cai-bao-rice | — | hainan-dingan-cai-bao-finished-rice | concrete_research_lead、production_recipe |
| cooked_rice | hainan-cai-bao-rice | — | hainan-dingan-cai-bao-finished-rice | concrete_research_lead、production_recipe |
| cooking_oil | — | — | hainan-coconut-shredded-rice | concrete_research_lead |
| fermented_black_beans | cantonese-black-bean-pork-rib-claypot-rice | — | — | production_recipe |
| fresh_coconut_shred | — | — | hainan-coconut-shredded-rice | concrete_research_lead |
| fresh_lettuce_leaf | hainan-cai-bao-rice | — | hainan-dingan-cai-bao-finished-rice | concrete_research_lead、production_recipe |
| glutinous_rice | guangxi-five-color-glutinous-rice | — | guangxi-natural-dye-five-color-glutinous-rice | concrete_research_lead、production_recipe |
| late_topping | cantonese-black-bean-pork-rib-claypot-rice、cantonese-cured-meat-claypot-rice、cantonese-mushroom-chicken-claypot-rice | — | — | production_recipe |
| low_heat_finish | — | — | cantonese-claypot-rice-technique | concrete_research_lead |
| mushroom | cantonese-mushroom-chicken-claypot-rice | — | — | production_recipe |
| named_cured_meat | cantonese-cured-meat-claypot-rice | — | — | production_recipe |
| named_late_topping | — | — | cantonese-claypot-rice-technique | concrete_research_lead |
| natural_plant_dye_liquids | guangxi-five-color-glutinous-rice | — | guangxi-natural-dye-five-color-glutinous-rice | concrete_research_lead、production_recipe |
| pork_rib_pieces | cantonese-black-bean-pork-rib-claypot-rice | — | — | production_recipe |
| portuguese_style_seasoning_unresolved | — | — | macao-portuguese-style-seafood-rice | concrete_research_lead |
| pot_crust | — | — | cantonese-claypot-rice-technique | concrete_research_lead |
| raw_rice | cantonese-black-bean-pork-rib-claypot-rice、cantonese-cured-meat-claypot-rice、cantonese-mushroom-chicken-claypot-rice | — | cantonese-claypot-rice-technique、hainan-coconut-shredded-rice | concrete_research_lead、production_recipe |
| rice_state_unresolved | — | — | macao-portuguese-style-seafood-rice | concrete_research_lead |
| sauce_final | hainan-cai-bao-rice | — | hainan-dingan-cai-bao-finished-rice | concrete_research_lead、production_recipe |
| seafood_form_unresolved | — | — | macao-portuguese-style-seafood-rice | concrete_research_lead |
| separately_colored_rice | guangxi-five-color-glutinous-rice | — | guangxi-natural-dye-five-color-glutinous-rice | concrete_research_lead、production_recipe |
| water | — | — | hainan-coconut-shredded-rice | concrete_research_lead |

## 7. 固定来源证据包

| 来源 | 等级 | 直接证明 | 不证明 |
| --- | --- | --- | --- |
| [粤菜餐厅西关风情特色服务规范（DB44/T 2423-2023）](https://std.samr.gov.cn/db/search/stdDBDetailed?id=FCE664C973E2154EE05397BE0A0A886A)（国家标准信息公共服务平台，undated） | A | lead:cantonese-claypot-rice-technique:cantonese_claypot_rice_identity | lead:cantonese-claypot-rice-technique:late_named_topping_structure、lead:cantonese-claypot-rice-technique:household_vessel_equivalence、lead:cantonese-claypot-rice-technique:project_ratio_safety |
| [粤菜餐厅西关风情特色服务规范（征求意见稿）](https://com.gd.gov.cn/attachment/0/496/496120/3989095.pdf)（广东省市场监督管理局，undated） | B | production:cantonese-cured-meat-claypot-rice:guangzhou_claypot_identity、production:cantonese-cured-meat-claypot-rice:named_branch_identity、production:cantonese-mushroom-chicken-claypot-rice:guangzhou_claypot_identity、production:cantonese-mushroom-chicken-claypot-rice:named_branch_identity、production:cantonese-black-bean-pork-rib-claypot-rice:guangzhou_claypot_identity、production:cantonese-black-bean-pork-rib-claypot-rice:named_branch_identity、lead:cantonese-claypot-rice-technique:cantonese_claypot_rice_identity、lead:cantonese-claypot-rice-technique:late_named_topping_structure | production:cantonese-cured-meat-claypot-rice:ordinary_pot_equivalence、production:cantonese-cured-meat-claypot-rice:project_ratio_safety、production:cantonese-mushroom-chicken-claypot-rice:ordinary_pot_equivalence、production:cantonese-mushroom-chicken-claypot-rice:project_ratio_safety、production:cantonese-black-bean-pork-rib-claypot-rice:ordinary_pot_equivalence、production:cantonese-black-bean-pork-rib-claypot-rice:project_ratio_safety、lead:cantonese-claypot-rice-technique:household_vessel_equivalence、lead:cantonese-claypot-rice-technique:named_toppings_as_free_protein_slot、lead:cantonese-claypot-rice-technique:project_ratio_safety |
| [香港美食地图：煲仔饭](https://www.discoverhongkong.com/content/dam/dhk/intl/plan/traveller-info/e-guidebooks/foodmap-tc.pdf)（香港旅游发展局，undated） | B | lead:cantonese-claypot-rice-technique:hong_kong_current_presence | lead:cantonese-claypot-rice-technique:hong_kong_exclusive_origin、lead:cantonese-claypot-rice-technique:household_vessel_equivalence、lead:cantonese-claypot-rice-technique:project_ratio_safety |
| [壮族五色糯米饭](https://wsb.gxzf.gov.cn/xwyw_48149/dfws_48154/t8584005.shtml)（广西壮族自治区人民政府外事办公室，2021-05-12） | A | production:guangxi-five-color-glutinous-rice:guangxi_natural_dye_structure、lead:guangxi-natural-dye-five-color-glutinous-rice:natural_dye_steamed_structure | production:guangxi-five-color-glutinous-rice:food_powder_as_traditional_equivalence、production:guangxi-five-color-glutinous-rice:guangxi_pineapple_rice_regional_identity、production:guangxi-five-color-glutinous-rice:project_ratio_safety、lead:guangxi-natural-dye-five-color-glutinous-rice:food_powder_as_traditional_equivalence、lead:guangxi-natural-dye-five-color-glutinous-rice:guangxi_pineapple_rice_regional_identity、lead:guangxi-natural-dye-five-color-glutinous-rice:project_ratio_safety |
| [壮乡五色糯米饭飘香](https://znhd.guangxi.chinatax.gov.cn/baise/gzdt_15440/gzdt_15441/202404/t20240418_400522.html)（国家税务总局百色市税务局，2024-04-18） | A | production:guangxi-five-color-glutinous-rice:guangxi_natural_dye_structure、lead:guangxi-natural-dye-five-color-glutinous-rice:natural_dye_steamed_structure | production:guangxi-five-color-glutinous-rice:food_powder_as_traditional_equivalence、production:guangxi-five-color-glutinous-rice:project_ratio_safety、lead:guangxi-natural-dye-five-color-glutinous-rice:project_ratio_safety |
| [定安三项非遗项目入选省级非遗项目](https://agri.hainan.gov.cn/hnsnyt/zt/xczx/xczxdt/202406/t20240614_3680040.html)（海南省农业农村厅，2024-01-02） | A | production:hainan-cai-bao-rice:dingan_cai_bao_identity、lead:hainan-dingan-cai-bao-finished-rice:dingan_cai_bao_identity | production:hainan-cai-bao-rice:project_fixed_ingredient_core、lead:hainan-dingan-cai-bao-finished-rice:fixed_ingredient_core、lead:hainan-dingan-cai-bao-finished-rice:project_ratio_safety |
| [深耕本地特色，定安推动非遗美食香飘出圈](https://www.hainan.gov.cn/hainan/sxian/202602/ef2d17adfde24348a7eb4974317058e1.shtml)（海南省人民政府网（来源：海南日报），2026-02-08） | A | production:hainan-cai-bao-rice:finished_rice_and_cooked_filling_structure、lead:hainan-dingan-cai-bao-finished-rice:finished_rice_and_cooked_filling_structure | production:hainan-cai-bao-rice:single_vessel_one_pot_equivalence、production:hainan-cai-bao-rice:project_fixed_ingredient_core、lead:hainan-dingan-cai-bao-finished-rice:single_vessel_one_pot_equivalence、lead:hainan-dingan-cai-bao-finished-rice:fixed_ingredient_core、lead:hainan-dingan-cai-bao-finished-rice:project_ratio_safety |
| [寻找老味道](https://www.hainan.gov.cn/hainan/c100643b/202403/679d437de85c40408aee7f67fa1d563e.shtml?ddtab=true)（海南省人民政府网（来源：海南日报），2024-03-25） | A | lead:hainan-coconut-shredded-rice:coconut_rice_structure | lead:hainan-coconut-shredded-rice:complete_main_meal_sufficiency、lead:hainan-coconut-shredded-rice:coconut_milk_equivalence、lead:hainan-coconut-shredded-rice:project_ratio_safety |
| [海南鸡饭](https://www.hainan.gov.cn/hainan/mstc/200606/d1b3748845a84b30b4d9153fdb646140.shtml)（海南省人民政府网，2006-06-01） | A | boundary:hainan-chicken-rice-separate-cook:separate_chicken_and_rice_structure | boundary:hainan-chicken-rice-separate-cook:single_pot_raw_chicken_rice_equivalence、boundary:hainan-chicken-rice-separate-cook:project_ratio_safety |
| [Macanese & Portuguese Dishes](https://www.macaotourism.gov.mo/en/dining/taste-of-macao/macanese-and-portuguese-dishes)（澳门特别行政区政府旅游局，undated） | C | lead:macao-portuguese-style-seafood-rice:macao_portuguese_style_seafood_rice_presence | lead:macao-portuguese-style-seafood-rice:single_pot_process、lead:macao-portuguese-style-seafood-rice:portuguese_chicken_as_rice_pot、lead:macao-portuguese-style-seafood-rice:project_ratio_safety |
| [腊肉、香肠的消费提示](https://scjgj.cq.gov.cn/bkzs/xfts/202602/t20260213_15442166.html)（重庆市市场监督管理局，2026-02-13） | A | safety:cured-meat-cook-through-and-salt:principle | production:cantonese-cured-meat-claypot-rice:project_ratio_safety |
| [食品安全消费提示](https://www.zs.gov.cn/zszjj/gkmlpt/content/2/2589/post_2589753.html)（中山市市场监督管理局，2026-01-17） | A | safety:raw-animal-food-cook-through-and-separate:principle、safety:lettuce-wash-and-raw-cooked-separation:principle | production:cantonese-mushroom-chicken-claypot-rice:project_ratio_safety、production:cantonese-black-bean-pork-rib-claypot-rice:project_ratio_safety、production:hainan-cai-bao-rice:project_fixed_ingredient_core |

## 8. 家庭适配与安全边界

本轮只记录具名工艺、食材形态和熟制原则，不编造克数、液体、火力、分钟数或电饭煲程序。广州瓦煲、广西天然植物染色、海南出锅包裹和澳门菜单线索都不得越界改写成已验证的家庭单锅方案。

| 边界 | 状态 | 说明 |
| --- | --- | --- |
| claypot-not-generic-covered-pot | not_proven | 普通锅或电饭煲可称广式风味焖饭，不得承诺瓦煲锅巴复刻。 |
| named-claypot-branches-not-free-slots | supported_with_boundaries | 腊味、香菇滑鸡和豆豉排骨是具名分支，不是任意蛋白槽。 |
| natural-dyes-not-food-powder-equivalence | not_proven | 食品粉版本是家庭适配，不得称传统天然染色。 |
| guangxi-pineapple-rice-unproven | not_proven | 本轮无可靠来源支持广西传统菠萝饭归属。 |
| dingan-cai-bao-not-raw-rice-one-pot | not_proven | 菜包饭为熟饭熟馅出锅后包生菜的多阶段结构。 |
| hainan-chicken-rice-separate-cook | not_proven | 海南鸡饭的白切鸡另烫，饭用鸡汤、鸡油另煮或拌熟饭；不证明生鸡生米全程同锅，也不提供项目机器比例。 |
| macao-menu-not-process | not_proven | 澳门葡式海鲜饭菜单线索不等于单锅工艺，也不能把葡国鸡归入。 |
| cured-meat-cook-through-and-salt | principle_only | 公开来源只支持原则，不导出分钟、克数或温度。；控制：use_labeled_cured_meat、cook_through、separate_raw_and_cooked_tools、disclose_high_salt |
| raw-animal-food-cook-through-and-separate | principle_only | 不以通用原则替代鸡肉、排骨或海鲜的项目终点。；控制：cook_meat_egg_and_seafood_through、separate_raw_and_cooked |
| lettuce-wash-and-raw-cooked-separation | principle_only | 菜叶是出锅后生食包裹，不得默认为锅内已熟。；控制：wash_fresh_lettuce、keep_wrapper_after_heat、separate_raw_and_cooked |

## 9. 产品去向决策

| 类型 | 对象 | 状态 | 允许方向 | 未决边界 |
| --- | --- | --- | --- | --- |
| concrete_research_lead | cantonese-claypot-rice-technique | research_only | template_evidence、new_family_research、ratio_rule | 用于定义边界，不新增生产菜谱，也不把香港消费线索改写为独创结论。 |
| concrete_research_lead | guangxi-natural-dye-five-color-glutinous-rice | research_only | template_evidence、ratio_rule、research_only | 保留传统结构和家庭适配的明确差异，不以地域标签替代工艺核验。 |
| concrete_research_lead | hainan-coconut-shredded-rice | research_only | template_evidence、research_only、ratio_rule | 只保留海南风味主食组件，不能单独承诺一锅完成完整主餐。 |
| concrete_research_lead | hainan-dingan-cai-bao-finished-rice | research_only | template_evidence、research_only | 适合作为多阶段熟饭结构证据，不直接升为单锅主餐。 |
| concrete_research_lead | macao-portuguese-style-seafood-rice | research_only | research_only、new_family_research | 澳门线索保持研究状态，绝不以菜单名补写同锅过程。 |
| production_recipe | cantonese-black-bean-pork-rib-claypot-rice | needs_manual_review | recipe_evidence、template_evidence、ratio_rule | 豆豉排骨是具名分支，不能以泛猪肉或普通锅替换后仍宣称原型。 |
| production_recipe | cantonese-cured-meat-claypot-rice | needs_manual_review | recipe_evidence、template_evidence、ratio_rule | 可保留广式风味审计，但不得把普通锅家庭适配称为瓦煲复刻。 |
| production_recipe | cantonese-mushroom-chicken-claypot-rice | needs_manual_review | recipe_evidence、template_evidence、ratio_rule | 具名香菇滑鸡分支可以审计，部位、锅具和比例仍需独立验证。 |
| production_recipe | guangxi-five-color-glutinous-rice | needs_manual_review | recipe_evidence、template_evidence、ratio_rule | 保留家庭食品粉适配的诚实标注，但不得回写为传统天然染色复刻。 |
| production_recipe | hainan-cai-bao-rice | needs_manual_review | recipe_evidence、template_evidence、research_only | 菜包饭应保留多阶段结构；当前项目轻量版本不得冒充完整传统配方。 |

## 10. 15 条家庭食材旅程

| ID | 节点 | 模式/意图 | 输入 | 允许家族 | 结构 | 研究结论 | 禁止主张 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| gd-01 | CN-GD | recommend/normal | 大米、腊肠 | raw-rice-claypot-late-named-topping | named_cured_meat_branch_or_explicit_style_adaptation | manual_review_needed | ordinary_pot_as_claypot_replica |
| gd-02 | CN-GD | pantry/fresh | 大米、鸡腿、香菇 | raw-rice-claypot-late-named-topping | named_mushroom_chicken_branch_or_no_claim | manual_review_needed | chicken_cut_free_substitution |
| gd-03 | CN-GD | recommend/quick | 剩米饭、排骨、豆豉 | — | do_not_claim_raw_rice_claypot_process | research_boundary | leftover_rice_as_claypot_equivalent |
| gx-01 | CN-GX | recommend/batch | 糯米、天然植物染液 | natural-dye-steamed-glutinous-rice | separate_color_batches_then_steam | manual_review_needed | invented_dye_ratio |
| gx-02 | CN-GX | recommend/quick | 糯米、紫薯粉、菠菜粉 | — | family_adaptation_label_required | research_boundary | food_powders_as_traditional_natural_dyes |
| gx-03 | CN-GX | pantry/fresh | 菠萝、糯米 | — | no_guangxi_traditional_pineapple_claim | research_boundary | guangxi_traditional_pineapple_rice_claim |
| hi-01 | CN-HI | recommend/quick | 剩米饭、生菜、韭菜 | finished-rice-cooked-filling-lettuce-wrap | finished_rice_stir_fry_then_fresh_wrap | manual_review_needed | raw_rice_all_in_one_pot |
| hi-02 | CN-HI | pantry/normal | 生米、生菜、虾米 | — | needs_multi_stage_or_user_decision | research_boundary | lettuce_cooked_with_raw_rice |
| hi-03 | CN-HI | recommend/batch | 大米、新鲜椰丝 | coconut-shredded-rice-staple | coconut_rice_staple_only | manual_review_needed | complete_main_meal_claim |
| hk-01 | CN-HK | recommend/normal | 大米、腊味 | raw-rice-claypot-late-named-topping | hong_kong_consumption_not_exclusive_origin | manual_review_needed | hong_kong_exclusive_origin |
| hk-02 | CN-HK | pantry/quick | 剩米饭、腊肠 | — | do_not_claim_claypot_crust | research_boundary | leftover_rice_claypot_crust |
| hk-03 | CN-HK | recommend/fresh | 大米、鳝鱼、鸡肉 | raw-rice-claypot-late-named-topping | named_variant_requires_separate_evidence | manual_review_needed | free_protein_slot |
| mo-01 | CN-MO | recommend/normal | 米饭、虾、番茄 | macao-portuguese-style-seafood-rice-unresolved | menu_presence_only_no_process | research_boundary | single_pot_process_claim |
| mo-02 | CN-MO | pantry/fresh | 鸡肉、土豆、椰奶 | — | do_not_rewrite_portuguese_chicken_as_rice_pot | research_boundary | portuguese_chicken_as_seafood_rice |
| mo-03 | CN-MO | recommend/quick | 米饭、海鲜 | — | no_ratio_or_safety_generation | research_boundary | invented_seafood_ratio |

## 11. 完成状态

当前为 `research_in_progress`，阻塞项：production_evidence_gaps、ratio_dsl_unresolved、household_vessel_adaptation_unresolved、meal_sufficiency_unresolved、safety_endpoint_incomplete、human_journey_review_incomplete。来源只证明其直接陈述；它不自动成为项目 Ratio DSL、普通锅适配、完整主餐承诺或真人厨房验证。

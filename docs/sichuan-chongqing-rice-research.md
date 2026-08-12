<!-- Generated file: edit tools/data/sichuan-chongqing-rice-research.v1.json and rebuild. -->

# 川渝孔干饭、洋芋饭与社饭研究覆盖层

> 这是研究覆盖层，不是生产菜谱。本轮没有增加或修改 72 道生产菜谱，也没有把 3 条新增线索写入候选账本、Planner 或部署包。

- 地域：川渝（CN-SC、CN-CQ）
- 生产菜谱审计：0
- 现有候选审计：4
- 新增研究线索：3
- 来源：9（A 级 8，B 级 1）
- 家庭旅程：12（已人工评审 0）
- 当前状态：research_in_progress
- 阻塞项：candidate_specificity_gaps、rice_state_ratio_unresolved、household_appliance_adaptation_unresolved、safety_endpoint_incomplete、human_journey_review_incomplete

核心纠偏：四川孔／箜干饭中的米先煮至半熟并沥水，再铺到菜料上文火完成；半熟沥米不等于生米直接焖，也不等于熟剩饭炒饭。豌豆、四季豆、洋芋是并列可选菜料，不等于固定共现。玉米粉“金裹银”不等于玉米粒加土豆。重庆柴火洋芋饭的柴火与大铁锅身份成立，但柴火做法不等于电饭煲适配已经验证。

## 1. 两个节点的真实覆盖

| 节点 | 生产 | 候选 | 研究线索 | 地图问题 |
| --- | --- | --- | --- | --- |
| 四川（CN-SC） | — | sichuan-bean-potato-rice、sichuan-corn-potato-rice、sichuan-salted-pork-potato-rice | sichuan-golden-wrapped-silver-rice、sichuan-kong-dry-rice | 整理四川箜饭、洋芋饭、腊肉饭与家庭锅具适配的结构。 |
| 重庆（CN-CQ） | — | chongqing-firewood-potato-rice-home | chongqing-youzhou-shefan | 核实重庆柴火洋芋饭及普通锅电饭锅适配时保留的核心身份。 |

## 2. 四条旧候选逐条审计

| 候选 | 假设食材 | 证据结论 | 禁止主张 | 允许去向 |
| --- | --- | --- | --- | --- |
| 柴火洋芋饭家庭版（chongqing-firewood-potato-rice-home） | 土豆、大米 | chongqing_potato_rice_identity：supported<br>firewood_vessel_identity：supported<br>household_appliance_equivalence：not_proven<br>project_ratio_safety：not_proven | firewood_equals_electric_cooker、optional_garnish_as_fixed_core、published_ratio_claim | candidate_evidence、template_evidence、ratio_rule |
| 豆类洋芋饭（sichuan-bean-potato-rice） | 豆类、土豆、大米 | kong_family_parallel_vegetables：supported<br>contemporary_bean_potato_innovation：supported<br>fixed_bean_potato_core：not_proven<br>project_ratio_safety：not_proven | parallel_examples_as_required_combination、all_beans_interchangeable、contemporary_innovation_as_ancient_tradition | candidate_evidence、ratio_rule |
| 玉米洋芋饭（sichuan-corn-potato-rice） | 玉米、土豆、大米 | cornmeal_variant_identity：supported<br>fixed_corn_potato_core：not_proven<br>project_ratio_safety：not_proven | parallel_examples_as_required_combination、cornmeal_as_corn_kernel_equivalence、raw_rice_braise_equivalence | new_family_research、ratio_rule |
| 腊肉洋芋饭（sichuan-salted-pork-potato-rice） | 腊肉、土豆、大米 | cured_meat_as_optional_garnish：supported<br>sichuan_fixed_cured_pork_core：not_proven<br>project_ratio_safety：not_proven | optional_garnish_as_fixed_core、chongqing_evidence_as_sichuan_origin、published_ratio_claim | research_only、ratio_rule |

## 3. 三条独立研究线索

| 线索 | 家族与餐型 | 关键形态 | 证据结论 | 禁止捷径 |
| --- | --- | --- | --- | --- |
| 重庆酉州社饭家族（chongqing-youzhou-shefan，CN-CQ） | parboiled-rice-seasonal-shefan / parboiled_rice_mixed_with_cooked_fillings | parboiled_drained_rice、cured_pork_dice、dried_tofu_dice、wild_green_chopped、optional_sweet_potato_cake_dice | official_current_presence：supported<br>regional_structure：supported<br>ingredient_identity：supported<br>single_vessel_equivalence：not_proven<br>project_ratio_safety：not_proven | single_vessel_claim、generic_leafy_green_equivalence、published_ratio_claim |
| 四川金裹银孔饭家族（sichuan-golden-wrapped-silver-rice，CN-SC） | cornmeal-parboiled-rice-kong / cornmeal_with_parboiled_rice_gently_finished | cornmeal、parboiled_drained_rice | regional_structure：supported<br>project_ratio_safety：not_proven | cornmeal_as_corn_kernel_equivalence、silent_potato_addition、published_ratio_claim |
| 四川孔／箜干饭技法家族（sichuan-kong-dry-rice，CN-SC） | parboiled-rice-vegetable-kong / parboiled_rice_over_sauteed_fillings_then_gently_finished | parboiled_drained_rice、sauteed_named_vegetable、optional_pork_or_cured_meat_unproven | regional_structure：supported<br>parboiled_rice_state：supported<br>project_ratio_safety：not_proven | raw_rice_braise_equivalence、cooked_leftover_rice_equivalence、parallel_examples_as_required_combination |

## 4. 四个不能混写的家族

| 家族 | 结构 | 证据状态 |
| --- | --- | --- |
| 半熟沥米菜料孔饭（parboiled-rice-vegetable-kong） | parboiled_rice_over_sauteed_fillings_then_gently_finished | research_supported |
| 生米洋芋柴火饭（raw-rice-potato-firewood） | fried_potato_and_raw_rice_firewood_finished | research_supported |
| 玉米粉金裹银孔饭（cornmeal-parboiled-rice-kong） | cornmeal_with_parboiled_rice_gently_finished | research_supported |
| 半熟米腊味野菜社饭（parboiled-rice-seasonal-shefan） | parboiled_rice_mixed_with_cooked_fillings | research_supported |

## 5. Claim 与食材形态矩阵

| 对象 | claim | 结论 | 来源 | 理由 |
| --- | --- | --- | --- | --- |
| research_candidate:chongqing-firewood-potato-rice-home | chongqing_potato_rice_identity | supported | cq-qianjiang-potato-rice-2026、cq-wanzhou-potato-rice-2024 | 重庆黔江和万州官方页面共同支持洋芋饭的在地身份。 |
| research_candidate:chongqing-firewood-potato-rice-home | firewood_vessel_identity | supported | cq-qianjiang-potato-rice-2026 | 来源明确把柴火灶和大铁锅写入高层技法身份。 |
| research_candidate:chongqing-firewood-potato-rice-home | household_appliance_equivalence | not_proven | cq-qianjiang-potato-rice-2026、cq-wanzhou-potato-rice-2024 | 柴火慢炖和村居大铁锅资料不能证明普通锅或电饭煲自动等价。 |
| research_candidate:chongqing-firewood-potato-rice-home | project_ratio_safety | not_proven | cq-qianjiang-potato-rice-2026 | 来源没有项目可执行的生米液体比例、土豆块尺寸和时间。 |
| research_candidate:sichuan-bean-potato-rice | contemporary_bean_potato_innovation | supported | cq-wuxi-potato-innovation-2022 | 重庆巫溪报道记录豌豆疙瘩洋芋饭为厨艺比赛评出的新菜品。 |
| research_candidate:sichuan-bean-potato-rice | fixed_bean_potato_core | not_proven | sc-kong-rice-2021、cq-wuxi-potato-innovation-2022 | 并列菜料和重庆当代创新都不能证明四川豆类洋芋饭固定传统核心。 |
| research_candidate:sichuan-bean-potato-rice | kong_family_parallel_vegetables | supported | sc-kong-rice-2021 | 资料支持豌豆、四季豆、洋芋作为孔干饭并列常见菜料。 |
| research_candidate:sichuan-bean-potato-rice | project_ratio_safety | not_proven | dgamr-green-bean-safety-2022 | 四季豆安全原则不能替代米水、豆种、加入顺序和熟制时间规则。 |
| research_candidate:sichuan-corn-potato-rice | cornmeal_variant_identity | supported | sc-kong-rice-2021 | 四川孔干饭资料支持玉米粉与米同孔的金裹银家族。 |
| research_candidate:sichuan-corn-potato-rice | fixed_corn_potato_core | not_proven | sc-kong-rice-2021 | 来源把玉米粉作为替代菜料的另一结构，没有证明玉米与洋芋固定共现。 |
| research_candidate:sichuan-corn-potato-rice | project_ratio_safety | not_proven | sc-kong-rice-2021 | 来源没有玉米粉、半熟米与保留水分的机器比例。 |
| research_candidate:sichuan-salted-pork-potato-rice | cured_meat_as_optional_garnish | supported | cq-qianjiang-potato-rice-2026 | 黔江资料明确把腊肉或腊肠列为洋芋饭可选点缀。 |
| research_candidate:sichuan-salted-pork-potato-rice | project_ratio_safety | not_proven | cq-cured-meat-safety-2026 | 通用腊味安全原则不提供本候选克数、盐量或同锅熟制规则。 |
| research_candidate:sichuan-salted-pork-potato-rice | sichuan_fixed_cured_pork_core | not_proven | cq-qianjiang-potato-rice-2026 | 重庆可选点缀不能证明四川腊肉洋芋饭的固定传统核心。 |
| research_lead:chongqing-youzhou-shefan | ingredient_identity | supported | cq-youyang-shefan-2025 | 来源直接列出贡米、腊肉、豆腐干和多种野菜。 |
| research_lead:chongqing-youzhou-shefan | official_current_presence | supported | cq-yuwei-360-2025 | 重庆官方美食名单记录酉州社饭。 |
| research_lead:chongqing-youzhou-shefan | project_ratio_safety | not_proven | cq-youyang-shefan-2025、cq-cured-meat-safety-2026 | 地方做法和通用腊味安全原则不足以形成项目 Ratio DSL。 |
| research_lead:chongqing-youzhou-shefan | regional_structure | supported | cq-youyang-shefan-2025 | 酉阳县政府资料提供半熟再蒸大米与腊肉、豆干、野菜的结构。 |
| research_lead:chongqing-youzhou-shefan | single_vessel_equivalence | not_proven | cq-youyang-shefan-2025 | 来源含煮、捞、蒸、炒或拌等多步，不证明严格一锅单容器。 |
| research_lead:sichuan-golden-wrapped-silver-rice | project_ratio_safety | not_proven | sc-kong-rice-2021 | 来源没有玉米粉与半熟米的可执行比例和液体约束。 |
| research_lead:sichuan-golden-wrapped-silver-rice | regional_structure | supported | sc-kong-rice-2021 | 资料明确记录部分地区以玉米粉与大米同孔并称金裹银。 |
| research_lead:sichuan-kong-dry-rice | parboiled_rice_state | supported | sc-kong-rice-2021 | 来源明确米先煮至半熟并沥出。 |
| research_lead:sichuan-kong-dry-rice | project_ratio_safety | not_proven | sc-kong-rice-2021 | 没有半熟程度、保留液体、锅径和家庭火力的机器规则。 |
| research_lead:sichuan-kong-dry-rice | regional_structure | supported | sc-kong-rice-2021 | 专家采访支持四川家庭孔干饭的半熟沥米、菜料翻炒、铺饭文火孔熟结构。 |

| 形态 | 候选 | 线索 | 来源层 |
| --- | --- | --- | --- |
| bean_species_unresolved | sichuan-bean-potato-rice | — | research_candidate |
| cornmeal | sichuan-corn-potato-rice | sichuan-golden-wrapped-silver-rice | research_candidate、research_lead |
| cured_pork_dice | sichuan-salted-pork-potato-rice | chongqing-youzhou-shefan | research_candidate、research_lead |
| dried_tofu_dice | — | chongqing-youzhou-shefan | research_lead |
| fried_potato_chunks | chongqing-firewood-potato-rice-home | — | research_candidate |
| optional_cured_meat_or_vegetable | chongqing-firewood-potato-rice-home | — | research_candidate |
| optional_pork_or_cured_meat_unproven | — | sichuan-kong-dry-rice | research_lead |
| optional_potato | sichuan-bean-potato-rice | — | research_candidate |
| optional_sweet_potato_cake_dice | — | chongqing-youzhou-shefan | research_lead |
| parboiled_drained_rice | sichuan-bean-potato-rice、sichuan-corn-potato-rice | chongqing-youzhou-shefan、sichuan-golden-wrapped-silver-rice、sichuan-kong-dry-rice | research_candidate、research_lead |
| potato_chunks | sichuan-salted-pork-potato-rice | — | research_candidate |
| raw_rice | chongqing-firewood-potato-rice-home、sichuan-salted-pork-potato-rice | — | research_candidate |
| sauteed_named_vegetable | — | sichuan-kong-dry-rice | research_lead |
| unproven_potato | sichuan-corn-potato-rice | — | research_candidate |
| wild_green_chopped | — | chongqing-youzhou-shefan | research_lead |

## 6. 固定来源证据包

| 来源 | 等级 | 直接证明 | 不证明 |
| --- | --- | --- | --- |
| [古蜀先民‘菜篮子’里都有啥？](https://www.hljzx.gov.cn/contents/68/7320.html)（黑龙江省政协（转载人民政协网，原作者为成都日报记者），2021-06-16） | B | candidate:sichuan-bean-potato-rice:kong_family_parallel_vegetables、candidate:sichuan-corn-potato-rice:cornmeal_variant_identity、lead:sichuan-kong-dry-rice:regional_structure、lead:sichuan-kong-dry-rice:parboiled_rice_state、lead:sichuan-golden-wrapped-silver-rice:regional_structure | candidate:sichuan-bean-potato-rice:fixed_bean_potato_core、candidate:sichuan-corn-potato-rice:fixed_corn_potato_core、lead:sichuan-kong-dry-rice:project_ratio_safety、lead:sichuan-golden-wrapped-silver-rice:project_ratio_safety |
| [柴火洋芋饭](https://www.qianjiang.gov.cn/bmjd/xzfgzbm/qwhlyw/zwgk_49175/gkml/cyqj/czqj/202506/t20250612_14708703.html)（重庆市黔江区文化和旅游发展委员会，2026-06-12） | A | candidate:chongqing-firewood-potato-rice-home:chongqing_potato_rice_identity、candidate:chongqing-firewood-potato-rice-home:firewood_vessel_identity、candidate:sichuan-salted-pork-potato-rice:cured_meat_as_optional_garnish | candidate:chongqing-firewood-potato-rice-home:household_appliance_equivalence、candidate:sichuan-salted-pork-potato-rice:sichuan_fixed_cured_pork_core、candidate:chongqing-firewood-potato-rice-home:project_ratio_safety |
| [万州罗田洋芋饭烹饪大比拼](https://www.wz.gov.cn/zwxx_266/jdtp/202406/t20240617_13297911.html)（重庆市万州区人民政府（来源：万州时报），2024-06-17） | A | candidate:chongqing-firewood-potato-rice-home:chongqing_potato_rice_identity | candidate:chongqing-firewood-potato-rice-home:household_appliance_equivalence、candidate:chongqing-firewood-potato-rice-home:project_ratio_safety |
| [2025年重庆美食‘渝味360碗’评选结果公告](https://whlyw.cq.gov.cn/zwxx_221/bmdt/tzgg/202505/P020250530603313691848.pdf)（重庆市文化和旅游发展委员会，2025-05-30） | A | lead:chongqing-youzhou-shefan:official_current_presence | lead:chongqing-youzhou-shefan:project_ratio_safety、candidate:chongqing-firewood-potato-rice-home:project_ratio_safety |
| [典籍里的酉阳美食](https://youyang.gov.cn/sy_236/yyyw/202506/t20250610_14698997.html)（重庆市酉阳土家族苗族自治县人民政府，2025-06-09） | A | lead:chongqing-youzhou-shefan:regional_structure、lead:chongqing-youzhou-shefan:ingredient_identity | lead:chongqing-youzhou-shefan:single_vessel_equivalence、lead:chongqing-youzhou-shefan:project_ratio_safety |
| [巫溪土豆变身的秘密](https://nyncw.cq.gov.cn/zwxx_161/mtbb/202208/t20220825_11037466.html)（重庆市农业农村委员会（来源：华龙网），2022-08-25） | A | candidate:sichuan-bean-potato-rice:contemporary_bean_potato_innovation | candidate:sichuan-bean-potato-rice:fixed_bean_potato_core |
| [发芽的马铃薯还能吃吗？](https://www.samr.gov.cn/spcjs/yjjl/art/2022/art_d958ba4998c94acda15b72b195c62e4d.html)（国家市场监督管理总局，2022-05-05） | A | safety:potato-sprout-green-control:principle | safety:potato-sprout-green-control:project_time_quantity |
| [谨防食用四季豆中毒 烹饪四季豆要煮熟煮透](https://dgamr.dg.gov.cn/zdlyxxgk/spypaq/spypaqxfjs/content/post_3708691.html)（东莞市市场监督管理局，2022-01-14） | A | safety:green-bean-cook-through:principle | safety:green-bean-cook-through:project_time_quantity |
| [腊肉、香肠的消费提示](https://scjgj.cq.gov.cn/bkzs/xfts/202602/t20260213_15442166.html)（重庆市市场监督管理局，2026-02-13） | A | safety:cured-meat-cook-through-and-salt:principle | safety:cured-meat-cook-through-and-salt:project_time_quantity |

## 7. 家庭适配与安全边界

本轮只记录发芽变绿土豆、四季豆熟透、腊味熟透与高盐控制原则，不编造克数、液体、火力、分钟数或电饭煲程序。

| 边界 | 状态 | 说明 |
| --- | --- | --- |
| parboiled-not-raw-or-leftover | checked | 半熟沥米不能静默改成生米焖饭或熟剩饭炒饭。 |
| parallel-vegetables-not-fixed-combination | checked | 豌豆、四季豆、洋芋是并列常见菜料，不代表必须共现。 |
| cornmeal-not-corn-kernel | checked | 金裹银的玉米粉不能被玉米粒替代后仍宣称同一身份。 |
| firewood-not-electric-cooker | needs_more_evidence | 柴火锅的热源和锅底特征不能无证据映射成电饭煲。 |
| optional-cured-meat-not-fixed-core | checked | 可选腊肉或腊肠不能变成固定传统核心。 |
| ratio-dsl-not-published | unresearched | 米状态、液体、锅径、火力和食材含水尚未转成机器规则。 |
| potato-sprout-green-control | principle_only | 只记录采购与熟透原则，不编造本项目分钟数。；控制：大面积发芽或变绿土豆直接丢弃、土豆彻底烧熟炖透 |
| green-bean-cook-through | principle_only | 来源提供感官终点原则，但不等于本项目火力和分钟数。；控制：明确豆种、四季豆受热均匀并彻底煮熟煮透、不得以仍有生绿色或豆腥味作为完成状态 |
| cured-meat-cook-through-and-salt | principle_only | 来源支持熟透与高盐原则，不提供本项目克数和时间。；控制：腊味彻底炒熟煮透、按高盐食材控制用量与额外盐、异常气味或状态不得使用 |

## 8. 产品去向决策

| 类型 | 对象 | 状态 | 允许方向 | 未决边界 |
| --- | --- | --- | --- | --- |
| research_candidate | chongqing-firewood-potato-rice-home | needs_more_evidence | candidate_evidence、template_evidence、ratio_rule | 保留重庆洋芋饭家族；家庭锅具适配和 Ratio DSL 未解决前不晋升。 |
| concrete_research_lead | chongqing-youzhou-shefan | research_only | new_family_research、template_evidence、ratio_rule | 地域结构清楚但多流程，先判断是否符合一锅出低摩擦目标。 |
| research_candidate | sichuan-bean-potato-rice | needs_more_evidence | candidate_evidence、ratio_rule | 可研究豌豆或四季豆孔饭，但必须先拆豆种并拒绝固定豆薯传统叙述。 |
| research_candidate | sichuan-corn-potato-rice | needs_more_evidence | new_family_research、ratio_rule | 把金裹银拆为独立研究线索；当前玉米洋芋候选不能据此晋升。 |
| concrete_research_lead | sichuan-golden-wrapped-silver-rice | research_only | new_family_research、ratio_rule | 作为独立谷物家族研究，不用于给玉米洋芋候选背书。 |
| concrete_research_lead | sichuan-kong-dry-rice | research_only | new_family_research、template_evidence、ratio_rule | 这是比固定菜名更有组合价值的川味技法家族，但 Ratio DSL 前只研究不生产。 |
| research_candidate | sichuan-salted-pork-potato-rice | needs_more_evidence | research_only、ratio_rule | 保留为待核四川候选，不借重庆可选配料伪造四川定式。 |

## 9. 12 条家庭食材旅程

| ID | 节点 | 模式/意图 | 输入 | 允许家族 | 结构 | 研究结论 | 禁止主张 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sc-cq-j01 | CN-SC | pantry/normal | 大米、土豆 | parboiled-rice-vegetable-kong | parboiled_rice_state_required | family_supported_ratio_unresolved | 生米直接焖即传统孔饭 |
| sc-cq-j02 | CN-SC | pantry/normal | 大米、四季豆 | parboiled-rice-vegetable-kong | parboiled_rice_with_named_bean | family_supported_safety_required | 任意豆类都等价、四季豆无需熟透 |
| sc-cq-j03 | CN-SC | pantry/normal | 大米、豌豆、土豆 | parboiled-rice-vegetable-kong | optional_fillings_not_fixed_tradition | combination_requires_household_test | 豆类洋芋饭是固定四川传统 |
| sc-cq-j04 | CN-SC | recommend/normal | 大米、玉米粉 | cornmeal-parboiled-rice-kong | cornmeal_with_parboiled_rice | regional_family_ratio_unresolved | 玉米粒等于玉米粉、自动加入土豆 |
| sc-cq-j05 | CN-SC | recommend/quick | 剩米饭、土豆 | — | generic_leftover_rice_route | not_kong_family | 四川孔干饭 |
| sc-cq-j06 | CN-SC | pantry/normal | 大米、腊肉、土豆 | — | candidate_only | sichuan_fixed_core_unproven | 已证四川腊肉洋芋饭 |
| sc-cq-j07 | CN-CQ | pantry/normal | 大米、土豆 | raw-rice-potato-firewood | fried_potato_with_raw_rice | regional_family_supported | 电饭煲比例已验证 |
| sc-cq-j08 | CN-CQ | pantry/normal | 大米、土豆、腊肉 | raw-rice-potato-firewood | potato_rice_with_optional_cured_meat | optional_variant_safety_required | 腊肉是固定核心、无需额外盐控制 |
| sc-cq-j09 | CN-CQ | recommend/quick | 大米、土豆、电饭煲 | raw-rice-potato-firewood | appliance_adaptation_pending | household_appliance_unresolved | 柴火做法与电饭煲完全等价 |
| sc-cq-j10 | CN-CQ | pantry/batch | 大米、腊肉、豆腐干、荠菜、野葱 | parboiled-rice-seasonal-shefan | parboiled_rice_mixed_with_cooked_fillings | regional_family_supported_ratio_unresolved | 严格单容器一锅、任意青菜都等价 |
| sc-cq-j11 | CN-CQ | pantry/normal | 大米、发芽土豆 | — | unsafe_input_rejection | potato_rejected | 削掉芽即可安全使用 |
| sc-cq-j12 | CN-CQ | recommend/normal | 大米、豌豆疙瘩、土豆 | — | contemporary_innovation_only | not_traditional_core | 千年传统豆类洋芋饭 |

## 10. 完成状态

当前为 `research_in_progress`，阻塞项：candidate_specificity_gaps、rice_state_ratio_unresolved、household_appliance_adaptation_unresolved、safety_endpoint_incomplete、human_journey_review_incomplete。来源证明地域家族，不等于项目 Ratio DSL、家庭器具适配或人工厨房验证已经完成。

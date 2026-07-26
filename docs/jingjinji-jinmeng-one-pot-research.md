<!-- Generated file: do not edit directly. -->

# 京津冀—晋蒙菜粮同锅研究审计

来源：固定地域地图、现有 72 道 recipe、24 条 regional research ledger 与 `tools/data/jingjinji-jinmeng-one-pot-research.v1.json`。
由 `node tools/build-jingjinji-jinmeng-one-pot-research.mjs --write` 确定性生成。

> **边界：这是研究覆盖层，不是生产菜谱。** 本轮只审计现有 3 道生产映射、4 条候选并补 4 条研究线索；不新增 recipe，不修改 Planner、template、taxonomy、Ratio DSL 或运行时代码。

## 摘要与核心纠偏

- 地域：京津冀、晋蒙（CN-BJ、CN-TJ、CN-HE、CN-SX、CN-NM）
- 生产审计：3
- 候选审计：4
- 新研究线索：4
- 来源：9（A 7，B 2）
- 家庭旅程：15（已人工评审 0）
- 当前状态：research_in_progress
- 阻塞项：exact_recipe_equivalence_unresolved、staple_shape_boundary_unresolved、ratio_rule_unresolved、safety_endpoint_incomplete、human_journey_review_incomplete

核心纠偏：熟饼丝不能按生面条处理；粘卷子的生面卷也不是现成面条；天津贴饽饽与蒸卷子仍不能自动视为同一形态或已证明同锅。焖面证据明确跨华北存在，因此不能包装成任何单省独占。

## 1. 五个节点的真实覆盖

| 节点 | 生产映射 | 研究线索 | 地图问题 | 缺口 |
| --- | --- | ---: | --- | --- |
| 北京（CN-BJ） | — | 1 | 核实北京家庭菜粮同锅、大锅菜与焖面类主餐的可追溯原型。 | 平谷粘卷子结构已核实，但尚无生产映射，面卷比例与家庭锅具边界未机器化。 |
| 河北（CN-HE） | — | 1 | 核实河北焖面、饼卷菜锅及豆角肉类同锅主餐的地域结构。 | 巨鹿焖饼结构已核实，但熟饼丝路线尚未进入候选，不能借用生面焖面比例。 |
| 内蒙古（CN-NM） | — | 1 | 核实内蒙古羊肉饭锅、杂粮饭及焖面类家庭一锅结构。 | 西部焖面结构有两条地方资料，仍缺主食含水状态、肉类终点和家庭锅具比例。 |
| 山西（CN-SX） | shanxi-potato-rice、shanxi-nitun-millet-rice | 0 | 整理山西焖面、烀面、土豆饭与小米饭的技法和地域变种边界。 | 两道生产条目存在，但外部资料只支持地域名称或资源语境，不支持项目精确比例。 |
| 天津（CN-TJ） | — | 1 | 核实天津米饭、面食与蔬菜肉类同锅完成的家庭主餐原型。 | 蒸卷子熬鱼和贴饽饽熬鱼只核实菜单存在，是否同锅、主食形态与鱼类安全流程仍待研究。 |

## 2. 现有生产与候选审计

| 类型 | 对象 | 家族 | claim | 禁止主张 |
| --- | --- | --- | --- | --- |
| 生产 | 北方豆角焖面（north-china-green-bean-braised-noodles） | noodle-braise | cross_northern_identity: supported；province_exclusive_identity: not_proven | cross_regional_as_province_exclusive、source_minutes_as_ratio_dsl |
| 生产 | 山西泥屯小米饭（shanxi-nitun-millet-rice） | raw-rice-braise | regional_name_presence: supported；millet_region_context: supported；exact_project_equivalence: not_proven | regional_name_as_exact_project_formula、millet_context_as_ratio_dsl |
| 生产 | 山西岚县土豆饭（shanxi-potato-rice） | raw-rice-braise | shanxi_potato_context: supported；exact_project_equivalence: not_proven | potato_context_as_exact_lanxian_formula、external_source_as_project_ratio |
| 候选 | 卷心菜猪肉焖面（north-cabbage-pork-braised-noodles） | noodle-braise | cross_regional_family: supported；fixed_traditional_core: not_proven | optional_ingredient_as_fixed_regional_core、cross_region_as_single_origin |
| 候选 | 菌菇时蔬焖面（north-mushroom-vegetable-braised-noodles） | noodle-braise | cross_regional_family: supported；fixed_traditional_core: not_proven | optional_ingredient_as_fixed_regional_core、vegetarian_variant_as_traditional_default |
| 候选 | 豆角猪肉焖面（north-pork-bean-braised-noodles） | noodle-braise | cross_regional_family: supported；fixed_traditional_core: not_proven | optional_ingredient_as_fixed_regional_core、cross_region_as_single_origin |
| 候选 | 土豆豆角焖面（north-potato-bean-braised-noodles） | noodle-braise | cross_regional_family: supported；fixed_traditional_core: not_proven | optional_ingredient_as_fixed_regional_core、local_listing_as_universal_core |

## 3. 四条研究线索与主食形态

| 线索 | 地域 | 餐型 | 主食/食材形态 | claim | 禁止捷径 |
| --- | --- | --- | --- | --- | --- |
| 北京平谷豆角粘卷子（beijing-pinggu-sticky-roll） | CN-BJ | stew_base_with_raw_dough_roll | raw_wheat_dough_roll、green_bean_piece、meat_stew_piece | regional_structure: supported；project_ratio_safety: not_proven | sticky_roll_as_ready_noodle、source_minutes_as_ratio_dsl |
| 河北巨鹿焖饼（hebei-julu-braised-pancake） | CN-HE | cooked_pancake_shreds_over_sauteed_vegetables | cooked_wheat_pancake_shreds、vegetable_shreds、meat_slice | regional_structure: supported；cooked_pancake_shape: supported；raw_noodle_equivalence: contradicted；project_ratio_safety: not_proven | cooked_pancake_as_raw_noodle、source_spoon_as_ratio_dsl |
| 内蒙古西部肉豆角土豆焖面（inner-mongolia-western-braised-noodle） | CN-NM | fresh_noodle_over_meat_vegetable_braise | fresh_wheat_noodle、green_bean_piece、potato_chunk、meat_slice | regional_structure: supported；dalate_combination: supported；project_ratio_safety: not_proven | fresh_noodle_equals_dry_noodle、regional_structure_as_exclusive_origin、source_minutes_as_ratio_dsl |
| 天津蒸卷子/贴饽饽熬鱼路线（tianjin-fish-staple-pot） | CN-TJ | fish_stew_with_staple_shape_unresolved | fish_piece、cornmeal_cake_or_steamed_roll_unresolved | local_menu_presence: supported；single_pot_process: not_proven；staple_shape_equivalence: not_proven | menu_presence_as_single_pot_proof、corn_cake_equals_wheat_roll、source_as_project_ratio |

## 4. 六种不可混写的家族

| 家族 | 结构 | 证据状态 |
| --- | --- | --- |
| 鲜面焖面（fresh-noodle-braise） | fresh_noodle_over_savory_braise | regional_family_supported |
| 粘卷子菜锅（stew-with-dough-roll） | raw_dough_roll_over_stew | beijing_structure_supported |
| 鱼与主食组合锅（fish-with-staple-pot） | fish_stew_with_staple_shape_unresolved | menu_presence_only |
| 熟饼丝焖饼（cooked-pancake-braise） | cooked_pancake_shreds_over_vegetables | hebei_structure_supported |
| 生米土豆饭（raw-rice-potato） | raw_rice_with_potato | project_recipe_external_equivalence_unresolved |
| 小米土豆饭（raw-millet-potato） | raw_millet_with_potato | regional_name_supported_project_equivalence_unresolved |

## 5. Claim 与形态矩阵

| 对象 | claim | 结论 | 来源 | 理由 |
| --- | --- | --- | --- | --- |
| production_recipe:north-china-green-bean-braised-noodles | cross_northern_identity | supported | wulate-braised-noodle-2018 | 政府地方资料明确列出跨多个北方地域的焖面家族。 |
| production_recipe:north-china-green-bean-braised-noodles | province_exclusive_identity | not_proven | wulate-braised-noodle-2018 | 来源恰好说明跨地域，不能锁定京津冀、山西或内蒙古任何单省独占。 |
| production_recipe:shanxi-nitun-millet-rice | exact_project_equivalence | not_proven | mct-shanxi-food-route-2025、gov-shanxi-millet-2017 | 名称与资源不能证明项目的小米、土豆及液体比例。 |
| production_recipe:shanxi-nitun-millet-rice | millet_region_context | supported | gov-shanxi-millet-2017 | 中国政府网支持山西小米资源语境。 |
| production_recipe:shanxi-nitun-millet-rice | regional_name_presence | supported | mct-shanxi-food-route-2025 | 文旅部资料直接列出泥屯小米饭。 |
| production_recipe:shanxi-potato-rice | exact_project_equivalence | not_proven | mct-shanxi-food-route-2025 | 土豆宴线索不等于岚县大米土豆饭的项目配方。 |
| production_recipe:shanxi-potato-rice | shanxi_potato_context | supported | mct-shanxi-food-route-2025 | 官方资料支持山西土豆宴语境。 |
| research_candidate:north-cabbage-pork-braised-noodles | cross_regional_family | supported | wulate-braised-noodle-2018 | 来源支持卷心菜可进入焖面家族。 |
| research_candidate:north-cabbage-pork-braised-noodles | fixed_traditional_core | not_proven | wulate-braised-noodle-2018 | 可选卷心菜不能升级为固定传统核心。 |
| research_candidate:north-mushroom-vegetable-braised-noodles | cross_regional_family | supported | wulate-braised-noodle-2018 | 来源支持菌菇、蔬菜可进入焖面家族。 |
| research_candidate:north-mushroom-vegetable-braised-noodles | fixed_traditional_core | not_proven | wulate-braised-noodle-2018 | 可选食材不能被写成固定地域核心。 |
| research_candidate:north-pork-bean-braised-noodles | cross_regional_family | supported | wulate-braised-noodle-2018 | 来源支持猪肉、豆角和面条的跨北方焖面家族。 |
| research_candidate:north-pork-bean-braised-noodles | fixed_traditional_core | not_proven | wulate-braised-noodle-2018 | 跨地域存在不等于每地固定同一核心。 |
| research_candidate:north-potato-bean-braised-noodles | cross_regional_family | supported | wulate-braised-noodle-2018 | 来源列出土豆、豆角可进入焖面家族。 |
| research_candidate:north-potato-bean-braised-noodles | fixed_traditional_core | not_proven | wulate-braised-noodle-2018、ordos-dalate-braised-noodle-2024 | 可加入与地方菜单并不证明跨华北固定核心。 |
| research_lead:beijing-pinggu-sticky-roll | project_ratio_safety | not_proven | beijing-pinggu-sticky-roll-2019 | 来源未给机器面团比例、液体约束或家庭安全终点。 |
| research_lead:beijing-pinggu-sticky-roll | regional_structure | supported | beijing-pinggu-sticky-roll-2019 | 北京旅游资料直接记录平谷菜与面卷同锅家常结构。 |
| research_lead:hebei-julu-braised-pancake | cooked_pancake_shape | supported | hebei-julu-braised-pancake-2025 | 来源明确使用烙饼丝。 |
| research_lead:hebei-julu-braised-pancake | project_ratio_safety | not_proven | hebei-julu-braised-pancake-2025 | 地方描述中的一饭勺和分钟数不能直接成为跨锅具机器比例。 |
| research_lead:hebei-julu-braised-pancake | raw_noodle_equivalence | contradicted | hebei-julu-braised-pancake-2025 | 熟烙饼丝与生面条的含水和熟制状态不同。 |
| research_lead:hebei-julu-braised-pancake | regional_structure | supported | hebei-julu-braised-pancake-2025 | 县政府资料明确当地家常焖饼的熟饼丝、肉片与蔬菜结构。 |
| research_lead:inner-mongolia-western-braised-noodle | dalate_combination | supported | ordos-dalate-braised-noodle-2024 | 达拉特资料复核肉、土豆、豆角与面条同焖。 |
| research_lead:inner-mongolia-western-braised-noodle | project_ratio_safety | not_proven | wulate-braised-noodle-2018、ordos-dalate-braised-noodle-2024 | 地方资料不提供可跨锅具执行的机器比例。 |
| research_lead:inner-mongolia-western-braised-noodle | regional_structure | supported | wulate-braised-noodle-2018 | 乌拉特中旗政府资料支持内蒙古西部焖面家常结构。 |
| research_lead:tianjin-fish-staple-pot | local_menu_presence | supported | tianjin-jizhou-roll-fish-2024 | 天津文旅资料在当地农家饭中直接列出两种名称。 |
| research_lead:tianjin-fish-staple-pot | single_pot_process | not_proven | tianjin-jizhou-roll-fish-2024 | 并列菜单没有说明主食是否与鱼同锅。 |
| research_lead:tianjin-fish-staple-pot | staple_shape_equivalence | not_proven | tianjin-jizhou-roll-fish-2024 | 贴饽饽和蒸卷子形态不能自动等价。 |

| 形态 | 关联对象 |
| --- | --- |
| cooked_wheat_pancake_shreds | research_lead:hebei-julu-braised-pancake |
| cornmeal_cake_or_steamed_roll_unresolved | research_lead:tianjin-fish-staple-pot |
| fish_piece | research_lead:tianjin-fish-staple-pot |
| fresh_wheat_noodle | production_recipe:north-china-green-bean-braised-noodles、research_lead:inner-mongolia-western-braised-noodle |
| green_bean_piece | production_recipe:north-china-green-bean-braised-noodles、research_lead:beijing-pinggu-sticky-roll、research_lead:inner-mongolia-western-braised-noodle |
| meat_slice | research_lead:hebei-julu-braised-pancake、research_lead:inner-mongolia-western-braised-noodle |
| meat_stew_piece | research_lead:beijing-pinggu-sticky-roll |
| pork_slice | production_recipe:north-china-green-bean-braised-noodles |
| potato_chunk | research_lead:inner-mongolia-western-braised-noodle |
| potato_even_chunk | production_recipe:shanxi-nitun-millet-rice、production_recipe:shanxi-potato-rice |
| raw_millet | production_recipe:shanxi-nitun-millet-rice |
| raw_rice | production_recipe:shanxi-potato-rice |
| raw_wheat_dough_roll | research_lead:beijing-pinggu-sticky-roll |
| vegetable_shreds | research_lead:hebei-julu-braised-pancake |

## 6. 固定来源证据包

| 来源 | 等级 | 直接证明 | 不证明 |
| --- | --- | --- | --- |
| [平谷特色美食豆角粘卷子](https://www.visitbeijing.com.cn/article/47QmeqUNmDQ)（北京旅游网，2019-06-29） | B | lead:beijing-pinggu-sticky-roll:regional_structure | lead:beijing-pinggu-sticky-roll:project_ratio_safety、lead:beijing-pinggu-sticky-roll:national_exclusivity |
| [金融助“文旅” 老村披“金衣”](https://whly.tj.gov.cn/tjswlzxw/sy1/rmzx/202405/t20240509_6620054.html)（天津市文化和旅游局（文章来源：天津日报），2024-05-09） | A | lead:tianjin-fish-staple-pot:local_menu_presence | lead:tianjin-fish-staple-pot:single_pot_process、lead:tianjin-fish-staple-pot:staple_shape_equivalence、lead:tianjin-fish-staple-pot:project_ratio_safety |
| [新华社关注巨鹿美食](https://www.julu.gov.cn/content/54702.html)（巨鹿县人民政府，2025-03-04） | A | lead:hebei-julu-braised-pancake:regional_structure、lead:hebei-julu-braised-pancake:cooked_pancake_shape、lead:hebei-julu-braised-pancake:raw_noodle_difference | lead:hebei-julu-braised-pancake:project_ratio_safety、lead:hebei-julu-braised-pancake:raw_noodle_equivalence |
| [山西：非遗美食从灶台跃入文旅场景](https://www.mct.gov.cn/gtb/index.jsp?url=https%3A%2F%2Fwww.mct.gov.cn%2Fwhzx%2Fqgwhxxlb%2Fsx%2F202503%2Ft20250313_958804.htm)（中华人民共和国文化和旅游部（来源：山西日报），2025-03-13） | A | recipe:shanxi-nitun-millet-rice:regional_name_presence、recipe:shanxi-potato-rice:shanxi_potato_context | recipe:shanxi-nitun-millet-rice:exact_project_equivalence、recipe:shanxi-potato-rice:exact_project_equivalence、recipe:shanxi-potato-rice:lanxian_specific_formula |
| [山西将打造“山西小米”区域公共品牌](https://www.gov.cn/xinwen/2017-09/09/content_5223894.htm)（中国政府网（来源：新华社），2017-09-09） | A | recipe:shanxi-nitun-millet-rice:millet_region_context | recipe:shanxi-nitun-millet-rice:exact_project_equivalence、recipe:shanxi-nitun-millet-rice:project_ratio_equivalence |
| [乌拉特中旗美食资料：焖面](https://www.wltzq.gov.cn/zjwzq/yxwltzq/ms/201812/t20181204_674031.html?slh=true)（乌拉特中旗人民政府，2018-12-04） | A | recipe:north-china-green-bean-braised-noodles:cross_northern_identity、candidate:north-pork-bean-braised-noodles:cross_regional_family、candidate:north-potato-bean-braised-noodles:cross_regional_family、candidate:north-cabbage-pork-braised-noodles:cross_regional_family、candidate:north-mushroom-vegetable-braised-noodles:cross_regional_family、lead:inner-mongolia-western-braised-noodle:regional_structure | recipe:north-china-green-bean-braised-noodles:province_exclusive_identity、candidate:north-pork-bean-braised-noodles:fixed_traditional_core、candidate:north-potato-bean-braised-noodles:fixed_traditional_core、candidate:north-cabbage-pork-braised-noodles:fixed_traditional_core、candidate:north-mushroom-vegetable-braised-noodles:fixed_traditional_core |
| [歌游内蒙古：达拉特美食攻略](https://ordos.nmgqq.com.cn/qingzhuzhonghuarenmingongheguochengli75zhounian/2024-10-14/8886.html)（鄂尔多斯市档案史志馆（来源：达拉特文化旅游微信公众号），2024-10-01） | B | lead:inner-mongolia-western-braised-noodle:dalate_combination | lead:inner-mongolia-western-braised-noodle:project_ratio_safety、lead:inner-mongolia-western-braised-noodle:inner_mongolia_exclusivity |
| [关于食用扁豆的风险提示](https://www.samr.gov.cn/zt/ndzt/2021n/splyyxkpzpzbpt/azspplhfcjpljqt/sg/art/2023/art_a0990c36d3bf4859a1158c3d68f9d482.html)（国家市场监督管理总局，2021-10-19） | A | safety:bean-cook-through:principle | safety:bean-cook-through:project_minutes |
| [卫生部关于预防群体性食物中毒事故的公告](https://www.nhc.gov.cn/bgt/s10789/201007/0c2a5587e4724d11be89895b55e77768.shtml)（中华人民共和国国家卫生健康委员会（原卫生部），页面 URL 仅标示 2010 年 7 月，未核得具体发布日期） | A | safety:animal-fish-cook-through:principle | safety:animal-fish-cook-through:project_minutes |

## 7. 适配与安全边界

所有地方来源只提供身份和高层技法证据；豆角、肉类、鱼类安全采用国家原则，但不由此发明统一分钟、温度、克数或液体量。

| 边界 | 状态 | 说明 |
| --- | --- | --- |
| staple-state-separation | required | 熟饼丝、生面条、生面卷、玉米面饽饽、生米和小米必须保持独立含水与熟制状态。 |
| cross-region-not-exclusive | required | 焖面跨华北存在，不得把共同结构写成北京、河北、山西或内蒙古任何单地独占。 |
| menu-presence-not-process | required | 天津并列菜单只证明名称存在，不证明同锅步骤。 |
| source-quantity-not-ratio-dsl | required | 地方描述的一饭勺或分钟数不直接进入机器 Ratio DSL。 |
| project-recipe-not-external-original | required | 山西两道 auto_approved 为项目标准版，外部地域资料不等于精确项目配方。 |
| bean-cook-through | principle_only | 只锁定烧熟煮透原则，项目时间需按食材规格和锅具另行验证。；控制：豆角充分熟透、不得追求鲜绿脆嫩缩短熟制 |
| animal-fish-cook-through | principle_only | 只锁定彻底加热原则，不从地域资料发明统一分钟。；控制：肉类和鱼类彻底加热、避免生熟交叉污染 |

## 8. 产品去向

| 类型 | 对象 | 状态 | 允许去向 | 未决边界 |
| --- | --- | --- | --- | --- |
| production_recipe | north-china-green-bean-braised-noodles | audited_existing_recipe | recipe_evidence、template_evidence、research_only | cross_regional_as_province_exclusive；source_minutes_as_ratio_dsl |
| production_recipe | shanxi-nitun-millet-rice | audited_existing_recipe | recipe_evidence、research_only | regional_name_as_exact_project_formula；millet_context_as_ratio_dsl |
| production_recipe | shanxi-potato-rice | audited_existing_recipe | recipe_evidence、research_only | potato_context_as_exact_lanxian_formula；external_source_as_project_ratio |
| research_candidate | north-cabbage-pork-braised-noodles | audited_existing_candidate | candidate_evidence、research_only | optional_ingredient_as_fixed_regional_core；cross_region_as_single_origin |
| research_candidate | north-mushroom-vegetable-braised-noodles | audited_existing_candidate | candidate_evidence、research_only | optional_ingredient_as_fixed_regional_core；vegetarian_variant_as_traditional_default |
| research_candidate | north-pork-bean-braised-noodles | audited_existing_candidate | candidate_evidence、research_only | optional_ingredient_as_fixed_regional_core；cross_region_as_single_origin |
| research_candidate | north-potato-bean-braised-noodles | audited_existing_candidate | candidate_evidence、research_only | optional_ingredient_as_fixed_regional_core；local_listing_as_universal_core |
| concrete_research_lead | beijing-pinggu-sticky-roll | research_only | template_evidence、ratio_rule、research_only | 面团含水率；锅内蒸汽余量；肉类和豆角熟透终点 |
| concrete_research_lead | hebei-julu-braised-pancake | research_only | template_evidence、ratio_rule、research_only | 熟饼含水状态；饼菜重量比；不同锅径液体边界 |
| concrete_research_lead | inner-mongolia-western-braised-noodle | research_only | template_evidence、ratio_rule、research_only | 鲜面初始含水；液面高度；土豆块规格；肉类豆角终点 |
| concrete_research_lead | tianjin-fish-staple-pot | research_only | new_family_research、research_only | 是否同锅；主食原料与形态；鱼类安全终点；家庭比例 |

## 9. 15 条家庭食材旅程

| ID | 节点 | 模式/意图 | 输入 | 允许家族 | 预期结构 | 研究结论 | 禁止主张 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| nc-j01 | CN-BJ | pantry/normal | 豆角、猪肉、面粉 | stew-with-dough-roll | 底菜与生面卷同锅 | regional_family_route | 等同焖面 |
| nc-j02 | CN-BJ | recommend/quick | 豆角、面粉 | stew-with-dough-roll | 面卷路线待比例 | ratio_research_only | 30分钟内已验证 |
| nc-j03 | CN-BJ | pantry/batch | 土豆、豆角、面条 | fresh-noodle-braise | 跨华北焖面 | cross_regional_route | 北京独有 |
| nc-j04 | CN-TJ | recommend/normal | 鱼、玉米面 | fish-with-staple-pot | 鱼与饽饽路线待同锅核实 | needs_process_evidence | 已证明同锅 |
| nc-j05 | CN-TJ | pantry/normal | 鱼、面粉 | fish-with-staple-pot | 鱼与蒸卷子路线待形态核实 | needs_staple_identity | 面粉自动等于蒸卷子 |
| nc-j06 | CN-TJ | recommend/fresh | 鱼、玉米面、豆角 | fish-with-staple-pot | 不强塞豆角 | honest_unused | 全部传统同锅 |
| nc-j07 | CN-HE | pantry/quick | 熟烙饼、白菜、猪肉 | cooked-pancake-braise | 熟饼丝后段焖 | regional_family_route | 按生面吸水 |
| nc-j08 | CN-HE | pantry/normal | 生面条、白菜、猪肉 | fresh-noodle-braise | 生面焖面而非焖饼 | shape_specific_route | 巨鹿焖饼 |
| nc-j09 | CN-HE | recommend/normal | 熟烙饼、豆芽 | cooked-pancake-braise | 熟饼丝与蔬菜 | ratio_research_only | 一饭勺适配所有锅 |
| nc-j10 | CN-SX | pantry/batch | 大米、土豆 | raw-rice-potato | 生米土豆饭 | project_recipe_route | 外部官方精确配方 |
| nc-j11 | CN-SX | pantry/batch | 小米、土豆 | raw-millet-potato | 小米土豆干饭 | project_recipe_route | 山西小米品牌证明项目比例 |
| nc-j12 | CN-SX | recommend/quick | 小米、土豆、豆角 | raw-millet-potato、fresh-noodle-braise | 不强行把豆角塞入小米饭 | honest_unused | 三项固定传统组合 |
| nc-j13 | CN-NM | pantry/normal | 鲜面条、豆角、土豆、猪肉 | fresh-noodle-braise | 内蒙古西部焖面 | regional_family_route | 内蒙古独有 |
| nc-j14 | CN-NM | pantry/normal | 干面条、豆角、猪肉 | fresh-noodle-braise | 干面含水待另建规则 | needs_staple_identity | 干面等同鲜面 |
| nc-j15 | CN-NM | recommend/quick | 面条、菌菇、青菜 | fresh-noodle-braise | 素焖面仅家族适配 | family_adaptation_only | 固定传统核心 |

## 10. 完成状态

当前为 `research_in_progress`，阻塞项：exact_recipe_equivalence_unresolved、staple_shape_boundary_unresolved、ratio_rule_unresolved、safety_endpoint_incomplete、human_journey_review_incomplete。完成来源与人工旅程前，不把任何研究线索称为已批准菜谱。

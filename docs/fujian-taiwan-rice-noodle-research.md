<!-- Generated file: do not edit directly. -->

# 闽台咸饭、油饭、炊饭与卤面研究审计

来源：`tools/data/fujian-taiwan-rice-noodle-research.v1.json`、现有 72 道 recipe、24 条 regional research ledger、全国地域地图与 regional mapping。
由 `node tools/build-fujian-taiwan-rice-noodle-research.mjs --write` 确定性生成。

> **边界：这是研究覆盖层，不是生产菜谱。** 本轮审计现有 6 道映射、补 3 条研究线索；不新增 recipe，不修改 Planner、template、taxonomy、Ratio DSL 或运行时代码。

## 摘要与核心纠偏

- 地域：闽台（CN-FJ、CN-TW）
- 生产菜谱审计：6（省级 5，跨地域 1）
- 当前候选映射：0
- 具体研究线索：3
- 来源：11（A 级 10，B 级 1）
- 家庭旅程：12（已人工评审 0）
- 当前状态：research_in_progress
- 阻塞项：exact_recipe_equivalence_unresolved、ratio_state_mismatch_unresolved、ingredient_identity_unresolved、new_family_ratio_unresolved、safety_endpoint_incomplete、human_journey_review_incomplete

核心纠偏：官方高丽菜饭的 0.8 倍水依赖浸泡沥干米、焯水沥干菜等状态，不能直接等同项目的总保留液体比例；泉州官方是大米、三层肉、豆干与海味的浥饭家族，不等于项目糯米、肉末、无海味版本；学生餐菜单能证明名称存在，但不能证明地域传统；大溪店家荷叶油饭历史存在，不等于项目配方已经获证。

## 1. 两个地域节点与真实覆盖

| 节点 | 生产映射 | 候选映射 | 本轮线索 | 地图研究问题 | 缺口 |
| --- | --- | --- | ---: | --- | --- |
| 福建（CN-FJ） | quanzhou-oil-rice、fujian-gai-cai-minced-pork-rice、fujian-hyacinth-bean-rice | — | 2 | 整理福建咸饭、油饭、扁豆饭和卤面的一锅技法与变种。 | 三道生产映射已经覆盖咸饭与油饭名称，但外部证据对具体米种、海味、省级传统身份和机器比例的支持程度不同；莆田卤面仍仅为研究线索。 |
| 台湾（CN-TW） | taiwan-cabbage-mushroom-rice、daxi-lotus-leaf-oil-rice | — | 1 | 整理台湾炊饭、油饭、客家糯米饭与家庭电饭锅适配边界。 | 高丽菜饭和大溪油饭有官方家族或历史证据，但项目核心与比例并非来源逐字等价；客家菜饭当前只有活动食谱线索。 |

畲族乌饭保留为跨闽浙等地的跨地域生产映射，不把它虚算成福建或台湾单省覆盖。

## 2. 六道现有生产菜谱逐条审计

| 菜谱 | 映射 | atlas 家族 | claim 结论 | 禁止主张 | 允许去向 |
| --- | --- | --- | --- | --- | --- |
| 大溪荷叶油饭（daxi-lotus-leaf-oil-rice，auto_approved） | province_specific / CN-TW | vessel-adapted-rice | lotus_leaf_history: supported；daxi_oil_rice_presence: supported；exact_project_formula: not_proven；taiwan_hakka_identity: not_proven | business_history_equals_exact_project_formula、daxi_location_equals_hakka_identity | recipe_evidence、content_only、research_only |
| 福建盖菜肉末咸饭（fujian-gai-cai-minced-pork-rice，auto_approved） | province_specific / CN-FJ | raw-rice-braise | official_menu_presence: supported；regional_traditional_identity: not_proven；exact_project_method: not_proven | official_menu_presence_equals_traditional_identity、menu_weight_equals_ratio_dsl | recipe_evidence、research_only |
| 福建扁豆饭（fujian-hyacinth-bean-rice，auto_approved） | province_specific / CN-FJ | raw-rice-braise | official_menu_presence: supported；regional_traditional_identity: not_proven；bean_species_identity: not_proven | generic_biandou_is_hyacinth_bean、menu_presence_equals_regional_tradition | recipe_evidence、taxonomy_rule、research_only |
| 泉州浥饭（油饭）（quanzhou-oil-rice，auto_approved） | province_specific / CN-FJ | glutinous-mixed-rice | regional_family: supported；exact_project_equivalence: not_proven；glutinous_staple_equivalence: not_proven | seafood_free_project_is_exact_traditional_yifan、generic_rice_means_glutinous_rice | recipe_evidence、taxonomy_rule、research_only |
| 畲族乌饭风味家庭适配版（she-people-black-rice，auto_approved） | cross_regional_chinese / 跨地域 | glutinous-mixed-rice | cultural_identity: supported；project_color_powder_equivalence: not_proven；province_specific_identity: not_proven | project_color_powder_is_traditional_leaf_juice、cross_regional_recipe_is_province_specific | recipe_evidence、content_only、research_only |
| 高丽菜香菇炊饭（taiwan-cabbage-mushroom-rice，auto_approved） | province_specific / CN-TW | raw-rice-braise | regional_family: supported；project_core_equivalence: not_proven；project_ratio_equivalence: not_proven | official_recipe_equals_project_recipe、official_0_8_ratio_equals_project_retained_liquid_ratio | recipe_evidence、ratio_rule、research_only |

## 3. 三条新增研究线索

| 线索 | 家族/餐型 | 关键形态 | claim 结论 | 禁止捷径 | 去向 |
| --- | --- | --- | --- | --- | --- |
| 莆田海味卤面主餐（fujian-putian-lor-noodle，CN-FJ） | thick-broth-lor-noodle / single_pot_broth_noodle | ready_wheat_noodle、shellfish_piece、thick_broth、egg_or_mushroom_topping | regional_structure: supported；broth_noodle_route: supported；dry_noodle_hydration_rule: not_proven | dry_noodle_without_hydration_rule、clear_soup_noodle_as_lor_noodle、unreviewed_allergen_mix | new_family_research、taxonomy_rule、ratio_rule、research_only |
| 泉州海味三层肉浥饭（quanzhou-seafood-pork-savory-rice，CN-FJ） | seafood-pork-savory-rice / raw_rice_savory_braise | raw_non_glutinous_rice、pork_belly_dice、dried_shellfish_piece、dried_mushroom_piece、tofu_dice | regional_structure: supported；production_ratio_safety: not_proven | omit_all_seafood_keep_exact_identity、unreviewed_allergen_mix、source_to_ratio_dsl | recipe_evidence、template_evidence、ratio_rule、research_only |
| 台湾客家电锅菜饭结构（taiwan-hakka-vegetable-rice，CN-TW） | rice-cooker-hakka-vegetable-rice / pretreated_mixed_rice | raw_rice、precooked_green_bean、fried_tofu_dice、precooked_bamboo_shoot、mixed_after_rice_cooks | contest_recipe_structure: supported；rice_cooker_route: supported；canonical_hakka_tradition: not_proven | contest_recipe_as_canonical_hakka_tradition、raw_green_bean_without_cookthrough、all_items_raw_in_one_pot | template_evidence、taxonomy_rule、research_only |

## 4. 七种不能混写的家族

| 家族 | 结构 | 证据状态 |
| --- | --- | --- |
| 生米菜饭炊饭（raw-rice-vegetable-braise） | raw_rice_braise | mixed_exactness |
| 糯米油饭（glutinous-oil-rice） | glutinous_mixed_rice | project_adaptation_only |
| 海味猪肉咸饭（seafood-pork-savory-rice） | raw_rice_savory_braise | regional_structure_supported |
| 叶包糯米油饭（leaf-wrapped-glutinous-rice） | wrapped_glutinous_rice | history_supported_formula_unresolved |
| 浓卤汤面（thick-broth-lor-noodle） | single_pot_broth_noodle | regional_structure_supported |
| 电锅客家菜饭（rice-cooker-hakka-vegetable-rice） | pretreated_mixed_rice | contest_structure_only |
| 植物色源礼俗糯米饭（ritual-colored-glutinous-rice） | colored_glutinous_rice | traditional_source_differs_from_project |

## 5. Claim 与食材形态矩阵

| 对象 | claim | 结论 | 来源 | 理由 |
| --- | --- | --- | --- | --- |
| production_recipe:daxi-lotus-leaf-oil-rice | daxi_oil_rice_presence | supported | daxi-oil-rice-2008 | 来源支持大溪油饭的地方经营历史。 |
| production_recipe:daxi-lotus-leaf-oil-rice | exact_project_formula | not_proven | daxi-oil-rice-2008 | 店家历史没有给出项目版糯米、肉末、荷叶的可执行配方。 |
| production_recipe:daxi-lotus-leaf-oil-rice | lotus_leaf_history | supported | daxi-oil-rice-2008 | 桃园官方旅游资料记录店家早期售卖荷叶包油饭。 |
| production_recipe:daxi-lotus-leaf-oil-rice | taiwan_hakka_identity | not_proven | daxi-oil-rice-2008 | 该来源未把此结构界定为台湾客家传统。 |
| production_recipe:fujian-gai-cai-minced-pork-rice | exact_project_method | not_proven | fj-school-menu-2025 | 来源不提供足以验证项目液体比例与完整做法的技法证据。 |
| production_recipe:fujian-gai-cai-minced-pork-rice | official_menu_presence | supported | fj-school-menu-2025 | 福建官方带量食谱中出现盖菜肉末咸饭。 |
| production_recipe:fujian-gai-cai-minced-pork-rice | regional_traditional_identity | not_proven | fj-school-menu-2025 | 学生餐菜单不是地域传统身份研究。 |
| production_recipe:fujian-hyacinth-bean-rice | bean_species_identity | not_proven | fj-school-menu-2025、samr-bean-2021 | 扁豆泛称不能自动鉴定为项目英文ID所暗示的具体豆种。 |
| production_recipe:fujian-hyacinth-bean-rice | official_menu_presence | supported | fj-school-menu-2025 | 福建官方带量食谱中出现扁豆饭。 |
| production_recipe:fujian-hyacinth-bean-rice | regional_traditional_identity | not_proven | fj-school-menu-2025 | 菜单存在不等于福建传统菜身份已经核实。 |
| production_recipe:quanzhou-oil-rice | exact_project_equivalence | not_proven | quanzhou-yifan-2024 | 来源为大米、三层肉、豆干和海味，项目为泡发糯米、肉末、鲜香菇且首轮排除海味。 |
| production_recipe:quanzhou-oil-rice | glutinous_staple_equivalence | not_proven | quanzhou-yifan-2024 | 本来源明确写大米，不能反向证明项目糯米版本。 |
| production_recipe:quanzhou-oil-rice | regional_family | supported | quanzhou-yifan-2024 | 泉州官方资料支持浥饭/油饭的地域家族。 |
| production_recipe:she-people-black-rice | cultural_identity | supported | gz-she-black-rice-2026 | 官方非遗资料支持畲族乌饭与乌稔树叶汁浸米蒸煮的文化结构。 |
| production_recipe:she-people-black-rice | project_color_powder_equivalence | not_proven | gz-she-black-rice-2026 | 项目食品级黑米色粉是家庭适配，不等于传统叶汁。 |
| production_recipe:she-people-black-rice | province_specific_identity | not_proven | gz-she-black-rice-2026 | 现有映射明确跨闽浙等地，不锁定福建或台湾单省。 |
| production_recipe:taiwan-cabbage-mushroom-rice | project_core_equivalence | not_proven | tw-afa-cabbage-rice | 项目版以鲜香菇为核心并把虾仁放入替换位，和官方虾米结构不同。 |
| production_recipe:taiwan-cabbage-mushroom-rice | project_ratio_equivalence | not_proven | tw-afa-cabbage-rice | 官方0.8倍水以浸泡沥干和焯菜为前提，不能直接等同项目的总保留液体比例。 |
| production_recipe:taiwan-cabbage-mushroom-rice | regional_family | supported | tw-afa-cabbage-rice | 官方食谱支持米、叶菜、虾米、香菇经预处理后电锅炊饭的家族。 |
| research_lead:fujian-putian-lor-noodle | broth_noodle_route | supported | fj-putian-lor-noodle-2025 | 它是带汤卤的面条主餐，不是干拌或炒面。 |
| research_lead:fujian-putian-lor-noodle | dry_noodle_hydration_rule | not_proven | fj-putian-lor-noodle-2025 | 来源未给面条规格与吸水规则。 |
| research_lead:fujian-putian-lor-noodle | regional_structure | supported | fj-putian-lor-noodle-2025 | 官方报道支持干贝、海蛎等与面条同锅熬煮的卤面结构。 |
| research_lead:quanzhou-seafood-pork-savory-rice | production_ratio_safety | not_proven | quanzhou-yifan-2024 | 来源没有机器液体比例或家庭锅具终点。 |
| research_lead:quanzhou-seafood-pork-savory-rice | regional_structure | supported | quanzhou-yifan-2024 | 官方资料提供大米、猪肉、豆干、菌菇和多种海味同锅结构。 |
| research_lead:taiwan-hakka-vegetable-rice | canonical_hakka_tradition | not_proven | tw-hakka-vegetable-rice-2020 | 社区组参赛食谱不能单独定义所有客家菜饭的传统标准。 |
| research_lead:taiwan-hakka-vegetable-rice | contest_recipe_structure | supported | tw-hakka-vegetable-rice-2020 | 官方活动食谱支持饭、豆类、豆干、竹笋等分开预处理后混合的结构。 |
| research_lead:taiwan-hakka-vegetable-rice | rice_cooker_route | supported | tw-hakka-vegetable-rice-2020 | 食谱明确使用电锅煮饭。 |

| 形态 | 线索 | 省份 | 家族 |
| --- | --- | --- | --- |
| dried_mushroom_piece | quanzhou-seafood-pork-savory-rice | CN-FJ | seafood-pork-savory-rice |
| dried_shellfish_piece | quanzhou-seafood-pork-savory-rice | CN-FJ | seafood-pork-savory-rice |
| egg_or_mushroom_topping | fujian-putian-lor-noodle | CN-FJ | thick-broth-lor-noodle |
| fried_tofu_dice | taiwan-hakka-vegetable-rice | CN-TW | rice-cooker-hakka-vegetable-rice |
| mixed_after_rice_cooks | taiwan-hakka-vegetable-rice | CN-TW | rice-cooker-hakka-vegetable-rice |
| pork_belly_dice | quanzhou-seafood-pork-savory-rice | CN-FJ | seafood-pork-savory-rice |
| precooked_bamboo_shoot | taiwan-hakka-vegetable-rice | CN-TW | rice-cooker-hakka-vegetable-rice |
| precooked_green_bean | taiwan-hakka-vegetable-rice | CN-TW | rice-cooker-hakka-vegetable-rice |
| raw_non_glutinous_rice | quanzhou-seafood-pork-savory-rice | CN-FJ | seafood-pork-savory-rice |
| raw_rice | taiwan-hakka-vegetable-rice | CN-TW | rice-cooker-hakka-vegetable-rice |
| ready_wheat_noodle | fujian-putian-lor-noodle | CN-FJ | thick-broth-lor-noodle |
| shellfish_piece | fujian-putian-lor-noodle | CN-FJ | thick-broth-lor-noodle |
| thick_broth | fujian-putian-lor-noodle | CN-FJ | thick-broth-lor-noodle |
| tofu_dice | quanzhou-seafood-pork-savory-rice | CN-FJ | seafood-pork-savory-rice |

## 6. 固定来源证据包

| 来源 | 等级 | 直接证明 | 不证明 |
| --- | --- | --- | --- |
| [农粮署北区分署电子书：高丽菜饭](https://ebook.afa.gov.tw/tefd/ebook5/ebook5-1.html)（台湾农业部农粮署北区分署，页面未标示发布日期） | A | recipe:taiwan-cabbage-mushroom-rice:regional_family | recipe:taiwan-cabbage-mushroom-rice:project_core_equivalence、recipe:taiwan-cabbage-mushroom-rice:project_ratio_equivalence |
| [泉州人的一生，离不开“吃桌”！](https://www.quanzhou.gov.cn/gastronomy/ch/msdh/xwqz/202411/t20241122_3107926.htm)（泉州市人民政府世界美食之都专题，2024-08-30） | A | recipe:quanzhou-oil-rice:regional_family、lead:quanzhou-seafood-pork-savory-rice:regional_structure | recipe:quanzhou-oil-rice:exact_project_equivalence、recipe:quanzhou-oil-rice:glutinous_staple_equivalence、lead:quanzhou-seafood-pork-savory-rice:production_ratio_safety |
| [福建省学生餐带量食谱参考附件](https://wjw.fujian.gov.cn/xxgk/zfxxgkzl/zfxxgkml/qtzdxx/202509/P020250918623795675713.pdf)（福建省卫生健康委员会，2025-09-18） | A | recipe:fujian-gai-cai-minced-pork-rice:official_menu_presence、recipe:fujian-hyacinth-bean-rice:official_menu_presence | recipe:fujian-gai-cai-minced-pork-rice:regional_traditional_identity、recipe:fujian-gai-cai-minced-pork-rice:exact_project_method、recipe:fujian-hyacinth-bean-rice:regional_traditional_identity、recipe:fujian-hyacinth-bean-rice:bean_species_identity |
| [游记百年油饭](https://travel.tycg.gov.tw/zh-cn/consume/detail/446)（桃园观光导览网（资料来源：桃园市政府经济发展局），2008-10-23） | A | recipe:daxi-lotus-leaf-oil-rice:lotus_leaf_history、recipe:daxi-lotus-leaf-oil-rice:daxi_oil_rice_presence | recipe:daxi-lotus-leaf-oil-rice:exact_project_formula、recipe:daxi-lotus-leaf-oil-rice:taiwan_hakka_identity、recipe:daxi-lotus-leaf-oil-rice:production_ratio_safety |
| [百舟竞渡木兰溪](https://www.fujian.gov.cn/zwgk/ztzl/sxzygwzxsgzx/flsxkmh/202510/t20251003_7018241.htm)（福建省人民政府门户网站（来源：福建日报），2025-10-03） | A | lead:fujian-putian-lor-noodle:regional_structure、lead:fujian-putian-lor-noodle:broth_noodle_route | lead:fujian-putian-lor-noodle:dry_noodle_hydration_rule、lead:fujian-putian-lor-noodle:production_ratio_safety |
| [客家菜饭（社区组料理食谱）](https://meethakka.tycg.gov.tw/upload/cont_att/70fdadfd-8578-4660-9500-2df3e77d5df0.pdf)（桃园市政府客家事务局，文件页面未提供可核验的精确发布日期） | B | lead:taiwan-hakka-vegetable-rice:contest_recipe_structure、lead:taiwan-hakka-vegetable-rice:rice_cooker_route | lead:taiwan-hakka-vegetable-rice:canonical_hakka_tradition、lead:taiwan-hakka-vegetable-rice:production_ratio_safety |
| [正果镇畲族乌饭制作技艺成功入选市级非遗名录](https://mzzjj.gz.gov.cn/xwdt/gqdt/content/post_10848697.html)（广州市民族宗教事务局，2026-06-09） | A | recipe:she-people-black-rice:cultural_identity | recipe:she-people-black-rice:project_color_powder_equivalence、recipe:she-people-black-rice:province_specific_identity、recipe:she-people-black-rice:production_ratio_safety |
| [关于食用扁豆的风险提示](https://www.samr.gov.cn/zt/ndzt/2021n/splyyxkpzpzbpt/azspplhfcjpljqt/sg/art/2023/art_a0990c36d3bf4859a1158c3d68f9d482.html)（国家市场监督管理总局，2021-10-19） | A | safety:bean-identity-and-cook-through:principle | recipe:fujian-hyacinth-bean-rice:bean_species_identity、safety:bean-identity-and-cook-through:project_minutes |
| [食用剩饭剩菜消费提示](https://www.samr.gov.cn/zt/ndzt/2021n/splyyxkpzpzbpt/azspsxhf/tssp/tsrqrsgd/art/2023/art_1ddba433c5f640c8bd4bc259e46706b5.html)（国家市场监督管理总局，2021-10-15） | A | safety:leftover-rice-storage-and-reheat:principle | safety:leftover-rice-storage-and-reheat:project_storage_hours |
| [《食品安全国家标准 预包装食品标签通则》（GB 7718-2025）问答](https://www.nhc.gov.cn/sps/c100087/202509/bc824a504ec34c27883da73f14c20d44.shtml)（国家卫生健康委员会，页面 URL 仅标示 2025 年 9 月，未核得具体发布日期） | A | safety:seafood-allergen-disclosure:principle | safety:seafood-allergen-disclosure:user_is_not_allergic |
| [卫生部关于预防群体性食物中毒事故的公告](https://www.nhc.gov.cn/bgt/s10789/201007/0c2a5587e4724d11be89895b55e77768.shtml)（中华人民共和国国家卫生健康委员会（原卫生部），页面 URL 仅标示 2010 年 7 月，未核得具体发布日期） | A | safety:animal-and-seafood-cook-through:principle | safety:animal-and-seafood-cook-through:project_minutes |

## 7. 家庭适配与安全边界

安全来源只支持食材身份、熟透、过敏原提示、冷藏复热和防交叉污染等原则；本轮不编造项目克数、时长、中心温度或液体比例。

| 边界 | 状态 | 说明 |
| --- | --- | --- |
| official-ratio-state-mismatch | checked | 浸泡沥干米、焯水沥干菜的0.8倍加水，不能直接等同项目按总保留液体记录的区间。 |
| quanzhou-family-not-project-equivalence | checked | 泉州浥饭家族成立，但大米海味三层肉结构不等于项目糯米肉末无海味版本。 |
| official-menu-not-traditional-identity | checked | 学生餐带量食谱只能证明菜单存在，不能证明地域传承、具体豆种或完整技法。 |
| daxi-history-not-formula | checked | 荷叶包油饭的店家历史存在，不等于项目配方、比例或台湾客家身份已经证实。 |
| cross-regional-she-rice-not-province-node | checked | 畲族乌饭继续保留跨地域映射，不计为福建或台湾单省节点的独立生产覆盖。 |
| bean-identity-and-cook-through | principle_only | 不同豆类风险不同；先确认豆种，再按来源原则烧熟煮透，本轮不发明统一分钟数。；控制：记录商品名或豆种、不明豆类不得替代、充分熟透、无生绿色和豆腥味 |
| animal-and-seafood-cook-through | principle_only | 采用彻底加热和防交叉污染原则，不把来源扩写成项目分钟数或中心温度。；控制：肉类彻底加热、蛋类彻底加热、水产品彻底加热、生熟分开避免交叉污染 |
| seafood-allergen-disclosure | principle_only | 甲壳类、鱼类等致敏物质需要清楚提示；研究层不推断用户无过敏。；控制：虾米、蚵干、干贝分别显式列出、不得以海味统称隐藏、命中忌口时排除对应计划 |
| leftover-rice-storage-and-reheat | principle_only | 只采用冷藏、感官检查、丢弃和彻底复热原则，不将来源时长写成所有家庭场景的统一规则。；控制：按条件冷藏、食用前检查色泽气味和黏滑、异常立即丢弃、再次食用彻底加热 |

## 8. 产品去向决策

| 类型 | 对象 | 省份 | 状态 | 允许方向 | 未决边界 |
| --- | --- | --- | --- | --- | --- |
| production_recipe | daxi-lotus-leaf-oil-rice | CN-TW | audited_existing_recipe | recipe_evidence、content_only、research_only | business_history_equals_exact_project_formula；daxi_location_equals_hakka_identity |
| production_recipe | fujian-gai-cai-minced-pork-rice | CN-FJ | audited_existing_recipe | recipe_evidence、research_only | official_menu_presence_equals_traditional_identity；menu_weight_equals_ratio_dsl |
| production_recipe | fujian-hyacinth-bean-rice | CN-FJ | audited_existing_recipe | recipe_evidence、taxonomy_rule、research_only | generic_biandou_is_hyacinth_bean；menu_presence_equals_regional_tradition |
| production_recipe | quanzhou-oil-rice | CN-FJ | audited_existing_recipe | recipe_evidence、taxonomy_rule、research_only | seafood_free_project_is_exact_traditional_yifan；generic_rice_means_glutinous_rice |
| production_recipe | she-people-black-rice | 跨地域 | audited_existing_recipe | recipe_evidence、content_only、research_only | project_color_powder_is_traditional_leaf_juice；cross_regional_recipe_is_province_specific |
| production_recipe | taiwan-cabbage-mushroom-rice | CN-TW | audited_existing_recipe | recipe_evidence、ratio_rule、research_only | official_recipe_equals_project_recipe；official_0_8_ratio_equals_project_retained_liquid_ratio |
| concrete_research_lead | fujian-putian-lor-noodle | CN-FJ | research_only | new_family_research、taxonomy_rule、ratio_rule、research_only | 鲜面与干面分型；液体和淀粉约束；无海鲜替代后的命名；家庭时长 |
| concrete_research_lead | quanzhou-seafood-pork-savory-rice | CN-FJ | research_only | recipe_evidence、template_evidence、ratio_rule、research_only | 家庭液体比例；海味盐度；过敏原分支；猪肉与海味熟制顺序 |
| concrete_research_lead | taiwan-hakka-vegetable-rice | CN-TW | research_only | template_evidence、taxonomy_rule、research_only | 家庭简化是否仍保留结构；豆类熟制终点；配料数量上限；机器比例 |

## 9. 12 条家庭食材旅程

| ID | 节点 | 模式/意图 | 输入 | 允许家族 | 结构 | 研究结论 | 禁止主张 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ft-j01 | CN-FJ | recommend/normal | 大米、三层肉、香菇、豆干、干贝、蚵干 | seafood-pork-savory-rice | raw_rice_savory_braise | 可进入家族研究 | 已是项目泉州油饭同款、无需过敏原提示 | 地域结构成立，但比例和海味安全仍需研究。 |
| ft-j02 | CN-FJ | recommend/normal | 泡发糯米、猪肉末、鲜香菇 | glutinous-oil-rice | glutinous_mixed_rice | 仅项目家庭适配 | 官方泉州浥饭逐项等同、来源证明无海味传统 | 可解释为项目家庭适配，不能冒充官方来源的精确复刻。 |
| ft-j03 | CN-FJ | pantry/normal | 大米、芥菜、猪肉末 | raw-rice-vegetable-braise | raw_rice_braise | 仅证明菜单存在 | 福建传统已核实、菜单克数就是液体比例 | 官方菜单支持名称存在，但传统身份和做法仍需证据。 |
| ft-j04 | CN-FJ | pantry/normal | 大米、扁豆 | — | identity_gate | 需先确认食材身份 | 扁豆一定是hyacinth bean、未确认豆种直接规划 | 泛称扁豆必须先确认商品或豆种。 |
| ft-j05 | CN-FJ | recommend/normal | 鲜面条、干贝、海蛎、香菇、鸡蛋 | thick-broth-lor-noodle | single_pot_broth_noodle | 可进入家族研究 | 已有机器液体比例、海味无需逐项提示 | 符合莆田卤面研究结构，但尚未成为生产模板。 |
| ft-j06 | CN-FJ | recommend/quick | 干面条、干贝、海蛎 | — | hydration_gate | 需要规格与预处理 | 任意干面可直接下锅、自动沿用鲜面时长 | 缺少干面规格和吸水规则，不能假装与鲜面等价。 |
| ft-j07 | CN-TW | recommend/normal | 大米、高丽菜、虾米、干香菇 | raw-rice-vegetable-braise | pretreated_rice_cooker_braise | 官方家族结构成立 | 项目鲜菇版完全等同、忽略虾米过敏原 | 官方高丽菜饭家族可用，但需保留虾米、泡发、焯菜等状态。 |
| ft-j08 | CN-TW | recommend/normal | 大米、卷心菜、鲜香菇 | raw-rice-vegetable-braise | project_adapted_braise | 仅项目家庭适配 | 官方食谱逐项相同、官方配方没有海味 | 项目可保留家庭适配身份，不反向改写官方来源。 |
| ft-j09 | CN-TW | pantry/normal | 浸泡沥干大米、焯水沥干高丽菜、虾米、干香菇 | raw-rice-vegetable-braise | measured_state_required | 仅比例研究 | 0.8倍水等于项目总液体比例、不记录蔬菜与泡发水 | 来源比例依赖预处理状态，需状态一致后才能进入机器规则。 |
| ft-j10 | CN-TW | recommend/normal | 糯米、猪肉末、食品级干荷叶 | leaf-wrapped-glutinous-rice | wrapped_glutinous_rice | 历史成立、配方未解决 | 官方项目配方已核实、大溪即台湾客家传统 | 店家历史支持荷叶包油饭存在，不支持项目公式与族群身份。 |
| ft-j11 | CN-TW | recommend/normal | 大米、四季豆、豆干、毛豆、竹笋 | rice-cooker-hakka-vegetable-rice | pretreated_mixed_rice | 仅活动食谱结构 | 参赛食谱就是客家唯一传统、四季豆可不熟透 | 可研究电锅饭与分项预处理结构，不能升级为通用传统标准。 |
| ft-j12 | CN-TW | recommend/normal | 糯米、食品级黑米色粉 | ritual-colored-glutinous-rice | project_colored_rice_adaptation | 仅跨地域家庭适配 | 色粉就是乌稔树叶汁、这是台湾省级代表菜 | 保留畲族跨地域与家庭适配标识，不归入台湾单省传统。 |

## 10. 完成状态

当前为 `research_in_progress`，阻塞项：exact_recipe_equivalence_unresolved、ratio_state_mismatch_unresolved、ingredient_identity_unresolved、new_family_ratio_unresolved、safety_endpoint_incomplete、human_journey_review_incomplete。这些未完成前，不把研究线索称为已批准菜谱，也不把外部家族证据冒充项目精确配方。

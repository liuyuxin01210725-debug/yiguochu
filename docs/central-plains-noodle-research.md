<!-- Generated file: do not edit directly. -->

# 中原（河南）家庭主餐结构研究审计

来源：`tools/data/central-plains-noodle-research.v1.json`、现有 72 道 recipe、24 条 regional research ledger、全国地域地图与 regional mapping。
由 `node tools/build-central-plains-noodle-research.mjs --write` 确定性生成。

> **边界：这是研究覆盖层，不是生产菜谱。** 本轮不新增 recipe，不修改 Planner、template、taxonomy、Ratio DSL 或运行时代码。

## 摘要与核心纠偏

- 地域：中原（CN-HA）
- 生产条目审计：1
- 研究候选：4
- 具体研究线索：3
- 来源：8（A 级 6，B 级 2）
- 家庭旅程：12（已人工评审 0）
- 当前状态：research_in_progress
- 阻塞项：province_specific_identity_gaps、candidate_core_evidence_gaps、vessel_process_equivalence_incomplete、ratio_moisture_evidence_incomplete、safety_endpoint_incomplete、human_journey_review_incomplete

关键纠偏：北方豆角焖面保持跨地域身份，河南当前有卤面不等于河南起源；芹菜猪肉、卷心菜菌菇的固定地域核心仍未证明；发酵酸浆不能用普通豆浆静默替代。

## 1. 生产条目审计

| 条目 | 核心食材 | 地域决定 | claim 结论 | 去向 |
| --- | --- | --- | --- | --- |
| 北方豆角焖面（north-china-green-bean-braised-noodles） | 鲜小麦面条、豆角、猪肉末 | cross_regional_chinese | henan_current_presence: supported；cross_northern_identity: supported；henan_specific_origin: not_proven | recipe_evidence、template_evidence |

## 2. 四条候选审计

| 候选 | 原假设 | 食物形态 | claim 结论 | 去向 |
| --- | --- | --- | --- | --- |
| 豆角猪肉蒸面（henan-bean-pork-steamed-noodles） | 豆角、猪肉、面条 | fresh_noodle、presteamed_noodle、bean_segment、pork_piece、steamed_then_mixed_and_resteamed | yujin_steamed_lumian_family: supported；bean_pork_pairing: supported；henan_exclusive_identity: not_proven；executable_ratio: not_proven | template_evidence、ratio_rule、research_only |
| 卷心菜菌菇蒸面（henan-cabbage-mushroom-steamed-noodles） | 卷心菜、菌菇、面条 | fresh_noodle、presteamed_noodle、cabbage_shred、mushroom_piece、braised_optional_ingredient | family_optional_ingredients: supported；fixed_regional_core: not_proven；steam_braise_equivalence: not_proven | taxonomy_rule、research_only |
| 芹菜猪肉蒸面（henan-celery-pork-steamed-noodles） | 芹菜、猪肉、面条 | fresh_noodle、presteamed_noodle、celery_segment、pork_piece、celery_as_adaptation_slot | family_substitution_possible: supported；fixed_regional_core: not_proven；pork_pairing: not_proven | taxonomy_rule、research_only |
| 家庭单锅蒸焖面（henan-home-one-pot-steamed-braised-noodles） | 面条、耐蒸蔬菜、可选蛋白 | fresh_noodle、presteamed_noodle、durable_vegetable_slot、optional_protein_slot、steamer_multistage、single_vessel_adaptation、braise_not_identical_to_steam | traditional_multistage_process: supported；traditional_single_pot_identity: not_proven；vessel_process_equivalence: not_proven | new_family_research、ratio_rule、research_only |

## 3. 五种不能混写的家族

| 家族 | 结构 | 证据状态 |
| --- | --- | --- |
| 北方鲜面焖制（noodle-braise） | same_pot | production_supported |
| 蒸卤面多阶段结构（noodle-steam-braise） | multi_stage_vessel | regional_structure_supported |
| 高汤扯面主餐（broth-pulled-noodle） | broth_bowl | regional_structure_supported |
| 发酵酸浆面条（fermented-sour-noodle-bowl） | fermented_broth_bowl | regional_structure_supported |
| 杂粮蔬菜稠锅（grain-vegetable-thick-bowl） | thick_grain_bowl | regional_structure_supported |

## 4. 食材与加工形态矩阵

| 形态 | 生产条目 | 研究候选 | 具体线索 |
| --- | --- | --- | --- |
| bean_segment | — | henan-bean-pork-steamed-noodles | — |
| braise_not_identical_to_steam | — | henan-home-one-pot-steamed-braised-noodles | — |
| braised_optional_ingredient | — | henan-cabbage-mushroom-steamed-noodles | — |
| broth | — | — | henan-huimian-broth-pulled-noodle |
| cabbage_shred | — | henan-cabbage-mushroom-steamed-noodles | — |
| celery_as_adaptation_slot | — | henan-celery-pork-steamed-noodles | — |
| celery_segment | — | henan-celery-pork-steamed-noodles | — |
| durable_vegetable_slot | — | henan-home-one-pot-steamed-braised-noodles | — |
| fermented_sour_liquid | — | — | henan-luoyang-fermented-sour-noodle-bowl |
| fresh_noodle | — | henan-bean-pork-steamed-noodles、henan-cabbage-mushroom-steamed-noodles、henan-celery-pork-steamed-noodles、henan-home-one-pot-steamed-braised-noodles | henan-luoyang-fermented-sour-noodle-bowl |
| fresh_noodle_staple | north-china-green-bean-braised-noodles | — | — |
| ground_pork_protein | north-china-green-bean-braised-noodles | — | — |
| ground_roasted_grain_powder | — | — | henan-wugang-mohu-grain-vegetable-bowl |
| long_cook_vegetable | north-china-green-bean-braised-noodles | — | — |
| mushroom_piece | — | henan-cabbage-mushroom-steamed-noodles | — |
| optional_protein_slot | — | henan-home-one-pot-steamed-braised-noodles | — |
| pork_piece | — | henan-bean-pork-steamed-noodles、henan-celery-pork-steamed-noodles | — |
| presteamed_noodle | — | henan-bean-pork-steamed-noodles、henan-cabbage-mushroom-steamed-noodles、henan-celery-pork-steamed-noodles、henan-home-one-pot-steamed-braised-noodles | — |
| pulled_noodle | — | — | henan-huimian-broth-pulled-noodle |
| rehydrated_dried_vegetable | — | — | henan-wugang-mohu-grain-vegetable-bowl |
| single_vessel_adaptation | — | henan-home-one-pot-steamed-braised-noodles | — |
| steamed_then_mixed_and_resteamed | — | henan-bean-pork-steamed-noodles | — |
| steamer_multistage | — | henan-home-one-pot-steamed-braised-noodles | — |

## 5. 固定来源证据包

| 来源 | 等级 | 直接证明 | 不证明 |
| --- | --- | --- | --- |
| [乌拉特中旗美食资料：焖面](https://www.wltzq.gov.cn/zjwzq/yxwltzq/ms/201812/t20181204_674031.html?slh=true)（乌拉特中旗人民政府，2018-12-04） | A | production:north-china-green-bean-braised-noodles:cross_northern_identity、candidate:henan-cabbage-mushroom-steamed-noodles:family_optional_ingredients | production:north-china-green-bean-braised-noodles:henan_specific_origin、candidate:henan-cabbage-mushroom-steamed-noodles:fixed_regional_core、candidate:henan-celery-pork-steamed-noodles:fixed_regional_core |
| [彩色的芸豆（泥土芬芳）](https://country.people.com.cn/n1/2018/1015/c419842-30340356.html)（人民日报，2018-10-15） | B | candidate:henan-bean-pork-steamed-noodles:yujin_steamed_lumian_family、candidate:henan-bean-pork-steamed-noodles:bean_pork_pairing、candidate:henan-celery-pork-steamed-noodles:family_substitution_possible、candidate:henan-home-one-pot-steamed-braised-noodles:traditional_multistage_process | candidate:henan-bean-pork-steamed-noodles:henan_exclusive_identity、candidate:henan-celery-pork-steamed-noodles:fixed_regional_core、candidate:henan-home-one-pot-steamed-braised-noodles:traditional_single_pot_identity、candidate:henan-home-one-pot-steamed-braised-noodles:vessel_process_equivalence |
| [河南党建引领高效能治理观察](https://www.henan.gov.cn/2025/03-11/3134974.html)（河南省人民政府门户网站，2025-03-11） | A | production:north-china-green-bean-braised-noodles:henan_current_presence | production:north-china-green-bean-braised-noodles:henan_specific_origin、candidate:henan-bean-pork-steamed-noodles:bean_pork_pairing |
| [河南烩面](https://english.scio.gov.cn/featured/chinakeywords/2025-06/11/content_117925432.htm)（国务院新闻办公室网站，2025-06-11） | A | lead:henan-huimian-broth-pulled-noodle:regional_structure | lead:henan-huimian-broth-pulled-noodle:quick_household_equivalence、lead:henan-huimian-broth-pulled-noodle:production_ratio_safety |
| [洛阳，还得是洛阳](https://hct.henan.gov.cn/2025/05-21/3160322.html)（河南省文化和旅游厅，2025-05-21） | A | lead:henan-luoyang-fermented-sour-noodle-bowl:regional_structure | lead:henan-luoyang-fermented-sour-noodle-bowl:ordinary_soymilk_substitution、lead:henan-luoyang-fermented-sour-noodle-bowl:production_ratio_safety |
| [舞钢沫糊：就是这个味儿解馋](https://henan.people.com.cn/n2/2024/0415/c378397-40810569.html)（人民网河南频道，2024-04-15） | B | lead:henan-wugang-mohu-grain-vegetable-bowl:regional_structure | lead:henan-wugang-mohu-grain-vegetable-bowl:ordinary_porridge_equivalence、lead:henan-wugang-mohu-grain-vegetable-bowl:production_ratio_safety |
| [关于食用扁豆的风险提示](https://www.samr.gov.cn/zt/ndzt/2021n/splyyxkpzpzbpt/azspplhfcjpljqt/sg/art/2023/art_a0990c36d3bf4859a1158c3d68f9d482.html)（国家市场监督管理总局，2021-10-19） | A | safety:bean-cook-through:principle | safety:bean-cook-through:project_minutes_ratio |
| [国家卫生健康委员会2024年6月21日新闻发布会文字实录](https://www.nhc.gov.cn/xcs/c100122/202406/03d4253c5a8e4b9cad4c695ddc7d2e25.shtml)（国家卫生健康委员会，2024-06-21） | A | safety:pork-cook-through-cross-contamination:principle | safety:pork-cook-through-cross-contamination:project_minutes_ratio |

## 6. 家庭适配与安全边界

安全来源只支持豆角和猪肉熟透、生熟分开等原则，本轮不编造项目克数、时长或液体比例。

| 边界 | 状态 | 说明 |
| --- | --- | --- |
| cross-regional-not-henan-origin | checked | 跨北方焖面不因河南当代出现而变成河南起源。 |
| steam-braise-not-generic-braise | checked | 先蒸、拌菜汁、复蒸不能与锅内直接焖面混为同一流程。 |
| single-pot-adaptation-not-traditional-equivalence | open | 一口锅简化尚未通过面条含水、粘连和口感验证。 |
| pulled-noodle-broth-not-steamed-noodle | checked | 烩面的面体与高汤结构独立于蒸卤面。 |
| fermented-sour-liquid-not-ordinary-soymilk | checked | 浆面条的发酵酸浆不能由普通豆浆静默替换。 |
| ground-grain-thick-bowl-not-porridge | checked | 沫糊的炒熟磨粉与干菜结构不能改写成普通杂粮粥。 |
| bean-cook-through | principle_only | 豆角必须充分熟透、失去生绿色和豆腥味；本轮不转写项目分钟与比例。 |
| pork-cook-through-cross-contamination | principle_only | 猪肉必须烧熟煮透并生熟分开；本轮不伪造项目时长或液体量。 |

## 7. 三条独立研究线索

| 线索 | 家族 | 已知结构 | 未决问题 | 产品去向 |
| --- | --- | --- | --- | --- |
| 河南烩面高汤扯面家族（henan-huimian-broth-pulled-noodle） | broth-pulled-noodle | 高筋面或扯面、肉骨高汤、肉与蔬菜配料、汤面主餐 | 家庭高汤降摩擦路线、面体形态兼容、液体比例、肉类熟制终点 | new_family_research |
| 洛阳浆面条发酵酸汤家族（henan-luoyang-fermented-sour-noodle-bowl） | fermented-sour-noodle-bowl | 发酵豆浆酸浆、面条、黄豆或青豆、芹菜粒、韭黄酱 | 酸浆可得性、发酵原料安全、家庭液体比例、不可替代项 | new_family_research |
| 舞钢沫糊杂粮蔬菜稠锅家族（henan-wugang-mohu-grain-vegetable-bowl） | grain-vegetable-thick-bowl | 炒熟杂粮磨粉、泡发干菜、慢熬稠糊、豆腐丝粉条肉末可选 | 杂粮粉配比、家庭研磨替代、干菜复水、一顿主餐份量 | new_family_research |

## 8. 产品去向决策

| 类型 | 对象 | 状态 | 允许方向 | 分数 | 理由 |
| --- | --- | --- | --- | ---: | --- |
| research_candidate | henan-bean-pork-steamed-noodles | needs_more_evidence | template_evidence、ratio_rule、research_only | 13 | 四候选中证据最强，但先补面条状态、含水与熟制验证，不创建 recipe。 |
| research_candidate | henan-cabbage-mushroom-steamed-noodles | needs_more_evidence | taxonomy_rule、research_only | 6 | 只作为卷心菜和菌菇槽位研究，不创建固定河南菜谱。 |
| research_candidate | henan-celery-pork-steamed-noodles | needs_more_evidence | taxonomy_rule、research_only | 6 | 保留为蔬菜槽位适配问题，不把它固化成河南地域菜名。 |
| research_candidate | henan-home-one-pot-steamed-braised-noodles | needs_more_evidence | new_family_research、ratio_rule、research_only | 7 | 把单锅化明确标成产品适配研究，未验证前不宣称传统等价。 |
| concrete_research_lead | henan-huimian-broth-pulled-noodle | research_only | new_family_research | 10 | 地域身份清晰但工序重，单独研究家庭适配，不并入蒸卤面。 |
| concrete_research_lead | henan-luoyang-fermented-sour-noodle-bowl | research_only | new_family_research | 8 | 结构清楚但关键酸浆不属于基础补充项，先研究可得性与安全。 |
| concrete_research_lead | henan-wugang-mohu-grain-vegetable-bowl | research_only | new_family_research | 11 | 地域与结构具体，先研究机器可执行比例和现代家庭操作，不降格成普通粥。 |
| production_recipe | north-china-green-bean-braised-noodles | needs_more_evidence | recipe_evidence、template_evidence | 12 | 保留跨地域生产条目，不改成河南地方菜，也不把卤面当代存在误写成起源证据。 |

## 9. 12 条家庭食材旅程

| ID | 模式/意图 | 输入 | 允许家族 | 禁止主张 | 研究结论 | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| cp-journey-01 | pantry/normal | 鲜面条、豆角、猪肉 | noodle-braise、noodle-steam-braise | 河南独有、传统固定克数 | 仅研究路线 | 可走跨北方焖面或蒸卤面研究，但不能声明河南独有。 |
| cp-journey-02 | pantry/normal | 预蒸面条、豆角、猪肉 | noodle-steam-braise | 比例已验证 | 仅研究路线 | 最接近蒸卤面结构，但菜汁量和复蒸含水仍待验证。 |
| cp-journey-03 | pantry/normal | 面条、芹菜、猪肉 | noodle-steam-braise | 河南固定组合 | 仅家庭适配研究 | 可以研究家庭变体，但没有地域固定核心证据。 |
| cp-journey-04 | pantry/normal | 面条、卷心菜、菌菇 | noodle-braise | 河南传统蒸面 | 仅家庭适配研究 | 跨地域资料仅支持可选食材，不支持河南固定组合。 |
| cp-journey-05 | pantry/normal | 鲜面条、豆角、土豆 | noodle-braise | 河南蒸卤面 | 家族路线有据 | 可走北方焖面家族，不自动进入河南蒸卤面。 |
| cp-journey-06 | recommend/normal | 普通鲜面、羊肉、清水 | — | 河南烩面 | 不足以使用地域菜名 | 缺少扯面形态和高汤结构，不能称为河南烩面。 |
| cp-journey-07 | recommend/normal | 宽扯面、羊肉高汤、海带、千张 | broth-pulled-noodle | 蒸卤面 | 独立新家族研究 | 符合河南烩面高汤扯面结构，必须保持独立家族。 |
| cp-journey-08 | pantry/normal | 面条、发酵酸浆、黄豆、青豆、芹菜 | fermented-sour-noodle-bowl | 普通豆浆等价 | 独立新家族研究 | 符合洛阳浆面条的关键酸浆与配料结构。 |
| cp-journey-09 | pantry/normal | 面条、普通豆浆、芹菜 | — | 洛阳浆面条 | 替换不兼容 | 普通豆浆不能静默替代发酵酸浆。 |
| cp-journey-10 | pantry/batch | 炒熟杂粮粉、泡发干菜、豆腐丝 | grain-vegetable-thick-bowl | 普通杂粮粥 | 独立新家族研究 | 符合舞钢沫糊的杂粮粉与干菜稠熬结构。 |
| cp-journey-11 | pantry/normal | 鲜面、豆角、猪肉、只用一口锅 | noodle-steam-braise | 传统等价 | 仅家庭适配研究 | 一口锅限制只能进入产品适配研究，不能宣称传统流程等价。 |
| cp-journey-12 | pantry/quick | 鲜面、未熟豆角、生猪肉 | — | 缩短熟制、鲜绿脆嫩 | 安全约束冲突 | quick 不能覆盖豆角和猪肉的熟透要求，应暂停而不是强行出方案。 |

## 10. 完成状态

当前为 `research_in_progress`，阻塞项：province_specific_identity_gaps、candidate_core_evidence_gaps、vessel_process_equivalence_incomplete、ratio_moisture_evidence_incomplete、safety_endpoint_incomplete、human_journey_review_incomplete。这些未完成前，不将研究线索称为已批准菜谱。

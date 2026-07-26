<!-- Generated file: do not edit directly. -->

# 山东家庭主餐结构研究审计

来源：`tools/data/shandong-one-pot-research.v1.json`、现有 72 道 recipe、24 条 regional research ledger、全国地域地图与 regional mapping。
由 `node tools/build-shandong-one-pot-research.mjs --write` 确定性生成。

> **边界：这是研究资料，不是生产菜谱批准。** 本轮不新增 recipe，不修改 Planner、template、taxonomy、Ratio DSL 或运行时代码。

## 摘要与核心纠偏

- 地域：山东（CN-SD）
- 生产条目审计：1
- 研究候选：4
- 具体研究线索：2
- 来源：9（A 级 9）
- 家庭旅程：12（已人工评审 0）
- 当前状态：research_in_progress
- 阻塞项：regional_identity_gaps、candidate_specificity_gaps、ratio_evidence_incomplete、safety_endpoint_incomplete、human_journey_review_incomplete

关键纠偏：豆角焖面保持跨北方身份，山东当代出现不等于山东起源；白菜豆腐大锅的粉条固定核心仍未证明；馒头必须诚实标为锅外现成主食。

## 1. 生产条目审计

| 条目 | 核心食材 | 地域决定 | claim 结论 | 去向 |
| --- | --- | --- | --- | --- |
| 北方豆角焖面（north-china-green-bean-braised-noodles） | 鲜小麦面条、豆角、猪肉末 | cross_regional_chinese | shandong_current_presence: supported；cross_northern_identity: supported；shandong_specific_origin: not_proven | recipe_evidence、template_evidence |

## 2. 四条候选审计

| 候选 | 原假设 | 食物形态 | claim 结论 | 去向 |
| --- | --- | --- | --- | --- |
| 白菜豆腐粉条大锅主餐（shandong-cabbage-tofu-vermicelli-pot） | 白菜、豆腐、粉条 | cabbage、tofu、pork_belly、unproven_vermicelli、ready_bun_outside_pot | cabbage_tofu_large_pot: supported；cabbage_tofu_regional_pair: supported；vermicelli_as_fixed_core: not_proven；complete_same_pot_main_meal: not_proven；ready_staple_outside_pot: supported | template_evidence、new_family_research |
| 胶东海鲜主食锅（shandong-seafood-staple-pot） | 海鲜、蔬菜、待核实主食 | identified_shellfish_or_shrimp、dough_drop、sweet_potato_noodle | concrete_dough_drop_family: supported；sweet_potato_noodle_name: supported；generic_seafood_interchangeability: not_proven；production_ratio_safety: not_proven | new_family_research |
| 鲁西南家常大锅路线（shandong-southwest-family-pot） | 白菜、豆腐、猪肉或粉条、待核实主食 | cabbage、tofu、pork_or_vermicelli、staple_unspecified | regional_identity: not_proven；defined_staple_form: not_proven | research_only |
| 蔬菜与玉米面主食同锅（shandong-vegetable-cornmeal-one-pot） | 耐煮蔬菜、玉米面主食 | vegetable_unspecified、cornmeal_form_unspecified、ready_pancake、cornmeal_batter、pot-edge-cake | ready_pancake_meal_route: supported；defined_food_form: not_proven；same_pot_identity: not_proven | research_only |

## 3. 五种家庭主餐结构

| 家族 | 结构 | 证据状态 |
| --- | --- | --- |
| 豆角鲜面焖制（noodle-braise） | same_pot | production_supported |
| 谷物豆制复合饭（grain-soy-composite-bowl） | layered_bowl | research_supported |
| 明确海鲜与面食汤锅（seafood-noodle-broth） | same_pot | research_supported |
| 大锅菜加现成主食（pot-plus-ready-staple） | pot_plus_ready_staple | research_supported |
| 现成煎饼卷另制菜（multi-process-pancake-meal） | multi_process | research_supported |

## 4. 食材与主食形态矩阵

| 形态 | 生产条目 | 研究候选 |
| --- | --- | --- |
| cabbage | — | shandong-cabbage-tofu-vermicelli-pot、shandong-southwest-family-pot |
| cornmeal_batter | — | shandong-vegetable-cornmeal-one-pot |
| cornmeal_form_unspecified | — | shandong-vegetable-cornmeal-one-pot |
| dough_drop | — | shandong-seafood-staple-pot |
| fresh_noodle_staple | north-china-green-bean-braised-noodles | — |
| ground_pork_protein | north-china-green-bean-braised-noodles | — |
| identified_shellfish_or_shrimp | — | shandong-seafood-staple-pot |
| long_cook_vegetable | north-china-green-bean-braised-noodles | — |
| pork_belly | — | shandong-cabbage-tofu-vermicelli-pot |
| pork_or_vermicelli | — | shandong-southwest-family-pot |
| pot-edge-cake | — | shandong-vegetable-cornmeal-one-pot |
| ready_bun_outside_pot | — | shandong-cabbage-tofu-vermicelli-pot |
| ready_pancake | — | shandong-vegetable-cornmeal-one-pot |
| staple_unspecified | — | shandong-southwest-family-pot |
| sweet_potato_noodle | — | shandong-seafood-staple-pot |
| tofu | — | shandong-cabbage-tofu-vermicelli-pot、shandong-southwest-family-pot |
| unproven_vermicelli | — | shandong-cabbage-tofu-vermicelli-pot |
| vegetable_unspecified | — | shandong-vegetable-cornmeal-one-pot |

## 5. 固定来源证据包

| 来源 | 等级 | 直接证明 | 不证明 |
| --- | --- | --- | --- |
| [淄博东东峪村大锅菜](https://www.sdxc.gov.cn/zbsh/shjj/202505/t20250512_15921133.htm)（山东宣传网，2025-05-12） | A | candidate:shandong-cabbage-tofu-vermicelli-pot:cabbage_tofu_large_pot、candidate:shandong-cabbage-tofu-vermicelli-pot:ready_staple_outside_pot | candidate:shandong-cabbage-tofu-vermicelli-pot:vermicelli_as_fixed_core、candidate:shandong-cabbage-tofu-vermicelli-pot:complete_same_pot_main_meal、candidate:shandong-southwest-family-pot:regional_identity |
| [泰山白菜与豆腐的地方饮食组合](https://www.sdxc.gov.cn/whql/xcwhzx/202412/t20241211_15233745.htm)（山东宣传网，2024-12-11） | A | candidate:shandong-cabbage-tofu-vermicelli-pot:cabbage_tofu_regional_pair | candidate:shandong-cabbage-tofu-vermicelli-pot:vermicelli_as_fixed_core、candidate:shandong-cabbage-tofu-vermicelli-pot:complete_same_pot_main_meal |
| [牟平宁海脑饭](https://www.yantai.gov.cn/art/2018/6/19/art_11748_1167698.html)（烟台市人民政府，2018-06-19） | A | lead:shandong-ninghai-naofan:regional_structure | lead:shandong-ninghai-naofan:production_ratio_safety |
| [青岛海鲜疙瘩汤地方饮食资料](https://www.qingdao.gov.cn/zwgk/xxgk/whly/gkml/gzxx/202512/t20251231_10428786.shtml)（青岛市人民政府，2025-12-31） | A | candidate:shandong-seafood-staple-pot:concrete_dough_drop_family、lead:shandong-haixian-dough-drop-soup:regional_structure | candidate:shandong-seafood-staple-pot:generic_seafood_interchangeability、lead:shandong-haixian-dough-drop-soup:production_ratio_safety |
| [威海海鲜地瓜面条](https://www.weihai.gov.cn/art/2023/9/28/art_145736_3999489.html)（威海市人民政府，2023-09-28） | A | candidate:shandong-seafood-staple-pot:sweet_potato_noodle_name | candidate:shandong-seafood-staple-pot:generic_seafood_interchangeability、candidate:shandong-seafood-staple-pot:production_ratio_safety |
| [山东煎饼文化资料](https://www.sdxc.gov.cn/sy/xcdt/202502/t20250204_15476717.htm)（山东宣传网，2025-02-04） | A | candidate:shandong-vegetable-cornmeal-one-pot:ready_pancake_meal_route | candidate:shandong-vegetable-cornmeal-one-pot:defined_food_form |
| [山东预制菜资料中的猪肉豆角焖面](https://xm.shandong.gov.cn/art/2022/6/21/art_24615_10306323.html)（山东省畜牧兽医局，2022-06-21） | A | production:north-china-green-bean-braised-noodles:shandong_current_presence | production:north-china-green-bean-braised-noodles:shandong_specific_origin |
| [乌拉特中旗美食资料](https://www.wltzq.gov.cn/zjwzq/yxwltzq/ms/201812/t20181204_674031.html)（乌拉特中旗人民政府，2018-12-04） | A | production:north-china-green-bean-braised-noodles:cross_northern_identity | production:north-china-green-bean-braised-noodles:shandong_specific_origin |
| [夏季食品安全消费提示](https://www.yantai.gov.cn/art/2024/6/20/art_67000_3200902.html)（烟台市人民政府，2024-06-20） | A | safety:bean-cook-through:endpoint_principle、safety:seafood-cook-through-cross-contamination:endpoint_principle | safety:bean-cook-through:project_time_quantity、safety:seafood-cook-through-cross-contamination:project_time_quantity |

## 6. 家庭适配与安全边界

安全来源只支持熟透与交叉污染原则，本轮不编造项目克数、时长或温度。

| 边界 | 状态 | 说明 |
| --- | --- | --- |
| cross-northern-not-shandong-origin | checked | 跨北方焖面不因山东当代出现而变成山东起源。 |
| vermicelli-not-silent-core | checked | 白菜豆腐大锅证据不自动加入粉条。 |
| ready-staple-outside-pot | checked | 馒头必须标为锅外现成主食。 |
| generic-seafood-to-identified-form | needs_more_evidence | 必须识别海鲜和主食形态。 |
| ready-pancake-not-cornmeal-batter | checked | 现成煎饼不等于玉米面糊或锅边饼。 |
| home-pot-capacity-and-safety | unresearched | 家庭容量、比例与分锅尚未建立。 |
| bean-cook-through | principle_only | 豆角必须烧熟煮透；本轮不转写为项目时长或克数。 |
| seafood-cook-through-cross-contamination | principle_only | 海鲜必须烧熟煮透并避免生熟交叉污染；具体海鲜仍需分型。 |

## 7. 两条具体研究线索

| 线索 | 已知结构 | 未决问题 | 产品去向 |
| --- | --- | --- | --- |
| 胶东海鲜疙瘩汤家族（shandong-haixian-dough-drop-soup） | 明确海鲜种类、面疙瘩主食、汤煮 | 家庭面水比、海鲜分型、加入顺序、熟制终点 | new_family_research |
| 宁海脑饭家族（shandong-ninghai-naofan） | 小米糊、豆浆或豆腐脑、粉条、花生、蔬菜 | 家庭器具、液体与小米比例、豆腐脑状态、快手化边界 | new_family_research |

## 8. 产品去向决策

| 类型 | 对象 | 状态 | 允许方向 | 分数 | 理由 |
| --- | --- | --- | --- | ---: | --- |
| production_recipe | north-china-green-bean-braised-noodles | needs_more_evidence | recipe_evidence、template_evidence | 11 | 保留现有跨地域生产条目，不改名为山东豆角焖面，也不用当代商品资料给传统起源背书。 |
| research_candidate | shandong-cabbage-tofu-vermicelli-pot | needs_more_evidence | template_evidence、new_family_research | 11 | 保留大锅菜和锅外现成主食路线，删除对粉条固定核心和同锅主食的暗示。 |
| concrete_research_lead | shandong-haixian-dough-drop-soup | research_only | new_family_research | 13 | 比泛称胶东海鲜主食锅更具体，先研究结构，不创建生产菜谱。 |
| concrete_research_lead | shandong-ninghai-naofan | research_only | new_family_research | 14 | 有明确地方名称和复合主餐结构，先做家族研究，不创建生产菜谱。 |
| research_candidate | shandong-seafood-staple-pot | needs_more_evidence | new_family_research | 12 | 把模糊海鲜锅拆成海鲜疙瘩汤和海鲜地瓜面两条具体路线。 |
| research_candidate | shandong-southwest-family-pot | needs_more_evidence | research_only | 0 | 没有鲁西南直接证据，不借用山东其他地区资料伪造地域身份。 |
| research_candidate | shandong-vegetable-cornmeal-one-pot | needs_more_evidence | research_only | 6 | 先拆清玉米面食物形态；当前模糊候选不进入生产或 Planner。 |

## 9. 12 条家庭食材旅程

| ID | 模式/意图 | 输入 | 预期使用 | 未规划 | 结构 | 研究结论 | 说明 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| sd-j01 | pantry/normal | 鲜面、豆角、猪肉末 | 鲜面、豆角、猪肉末 | — | noodle-braise | 家族路线有据 | 可走跨北方豆角焖面，但不得展示为山东传统。 |
| sd-j02 | pantry/normal | 鲜面、豆角、土豆 | 鲜面、豆角 | 土豆 | noodle-braise | 需更多证据 | 组合可能合理，但山东特定身份、土豆兼容和比例未证明。 |
| sd-j03 | recommend/normal | 白菜、豆腐、五花肉 | 白菜、豆腐、五花肉 | — | pot-plus-ready-staple | 需更多证据 | 大锅菜组合有据，但没有现成主食时不能称完整同锅主餐。 |
| sd-j04 | pantry/normal | 白菜、豆腐、粉条 | 白菜、豆腐 | 粉条 | pot-plus-ready-staple | 不能并入该家族 | 白菜豆腐来源不能自动证明粉条是固定核心。 |
| sd-j05 | pantry/normal | 白菜、豆腐、五花肉、现成馒头 | 白菜、豆腐、五花肉、现成馒头 | — | pot-plus-ready-staple | 家族路线有据 | 可解释为主锅加现成馒头的完整一顿饭，不能写成全部同锅。 |
| sd-j06 | pantry/normal | 小米、无糖豆浆、粉条、小菜心 | 小米、无糖豆浆、粉条、小菜心 | — | grain-soy-composite-bowl | 仅研究线索 | 宁海脑饭家族有据，家庭比例与豆腐脑状态仍待研究。 |
| sd-j07 | pantry/normal | 虾仁、蛤蜊、面粉 | 虾仁、蛤蜊、面粉 | — | seafood-noodle-broth | 仅研究线索 | 海鲜疙瘩汤家族有据，海鲜安全和面疙瘩比例待研究。 |
| sd-j08 | pantry/normal | 海鲜、地瓜面条 | 地瓜面条 | 海鲜 | seafood-noodle-broth | 需更多证据 | 名称有据，但泛称海鲜必须先识别具体种类。 |
| sd-j09 | recommend/normal | 耐煮蔬菜、玉米面 | — | 耐煮蔬菜、玉米面 | unresolved-cornmeal-form | 不能并入该家族 | 不能把煎饼、玉米糊或锅边饼任意当成同一方案。 |
| sd-j10 | recommend/quick | 现成山东煎饼、炒蔬菜 | 现成山东煎饼、炒蔬菜 | — | multi-process-pancake-meal | 仅研究线索 | 可作为低摩擦完整餐研究，但不是同锅生成。 |
| sd-j11 | pantry/normal | 白菜、豆腐、粉条、猪肉 | — | 白菜、豆腐、粉条、猪肉 | unproven-southwest-pot | 不能并入该家族 | 缺少鲁西南直接证据，不得伪造地域身份或完整方案。 |
| sd-j12 | pantry/normal | 未知贝类、豆角、鲜面 | 豆角、鲜面 | 未知贝类 | noodle-braise | 安全或识别不完整 | 贝类未识别且豆角需熟透，保留未规划并停止成功结论。 |

## 10. 完成状态

当前为 `research_in_progress`，阻塞项：regional_identity_gaps、candidate_specificity_gaps、ratio_evidence_incomplete、safety_endpoint_incomplete、human_journey_review_incomplete。这些未完成前，不将研究线索称为已批准菜谱。

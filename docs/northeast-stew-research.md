<!-- Generated file: do not edit directly. -->

# 东北铁锅炖与锅边主食研究审计

来源：`tools/data/northeast-stew-research.v1.json`、全国地域地图与地域研究账本。
由 `node tools/build-northeast-stew-research.mjs --write` 确定性生成。

> **边界：这是研究资料，不是生产菜谱批准。** 本页记录 M1 的证据与校准准备。结构依据不等于数值比例依据；两条机器规则仍被阻塞，真实 Planner 不会选择该模板。

## 摘要

- 地域：东北（CN-LN、CN-JL、CN-HL）
- 研究家族：stew-with-staple
- 原型候选：4
- 固定来源：7（A 级 6，B 级 1）
- 家庭旅程：10（已人工评审 0）
- 机器规则候选：2（active 0）
- 厨房校准：3（passed 0）
- 能力契约旅程：22（M1 均未激活）
- 当前状态：research_in_progress
- 阻塞项：prototype_evidence_incomplete、ratio_evidence_incomplete、safety_evidence_incomplete、human_journey_review_incomplete、machine_rule_candidates_blocked、calibration_2_3_4_servings_incomplete
- 生产菜谱变更：0
- 生产 Ratio DSL 变更：0
- 运行时模板变更：0

关键证据边界：鸡肉、蘑菇、土豆、玉米面饼四项固定组合仍未证明；粘卷子已由北京平谷资料核实，但东北关联仍未核实，不能据此判断东北存在或不存在。

## 1. 地域与家族概览

| 省级节点 | 研究问题 |
| --- | --- |
| 辽宁（CN-LN） | 核实辽宁铁锅炖、沿海鱼锅与锅边主食中适合家庭一锅主餐的结构。 |
| 吉林（CN-JL） | 核实吉林鸡肉菌菇炖锅、豆角锅与面团主食同锅的地方变种。 |
| 黑龙江（CN-HL） | 核实黑龙江铁锅炖中排骨或鸡肉、土豆、豆角与锅边饼花卷的稳定结构。 |

## 2. 四条原型候选

| 原型 | 状态 | 东北身份 | 固定组合 | 产品去向 | 决策理由 |
| --- | --- | --- | --- | --- | --- |
| 鸡肉蘑菇土豆配锅边饼（northeast-chicken-mushroom-potato-corn-cake） | needs_more_evidence | 有直接证据 | 未证明 | template_evidence | 继续研究兼容性和家庭比例；不创建声称传统固定组合的 recipe。 |
| 鱼豆腐蔬菜锅配玉米饼（northeast-fish-tofu-vegetable-corn-cake） | needs_more_evidence | 有直接证据 | 未证明 | template_evidence、taxonomy_rule | 拆开鱼锅事实与豆腐可选槽位假设；安全和兼容性完成前不进入产品。 |
| 排骨豆角配锅边饼（northeast-ribs-beans-corn-cake） | fact_checked | 有直接证据 | 有直接证据 | template_evidence、recipe_evidence | 保留为最优先家族证据；没有比例和安全证据前不进入生产。 |
| 排骨豆角粘卷子（northeast-ribs-beans-sticky-rolls） | needs_more_evidence | 未证明 | 有直接证据 | content_only | 东北轮不把北京事实改写成东北事实；保留跨地域研究价值并等待东北补证。 |

## 3. 变体关系

| 原型 | 家族锚点 | 固定组合状态 | 说明 |
| --- | --- | --- | --- |
| northeast-chicken-mushroom-potato-corn-cake | northeast-iron-pot-stew-with-staple | not_proven | 作为家族适配假设保留，不建立固定传统菜名。 |
| northeast-fish-tofu-vegetable-corn-cake | northeast-iron-pot-stew-with-staple | not_proven | 鱼加锅边玉米饼可继续研究；豆腐只能作为未来受控可选槽位假设。 |
| northeast-ribs-beans-corn-cake | northeast-iron-pot-stew-with-staple | supported | 黑龙江事实入口最完整，但家庭份量、液体与安全仍待验证。 |
| northeast-ribs-beans-sticky-rolls | cross-regional-stew-with-staple | supported_outside_current_region | 北京平谷已核实；东北关联继续补证，不能做排他判断。 |

## 4. 食材覆盖矩阵

| 食材或槽位 | 原型 | 角色 | 证据状态 |
| --- | --- | --- | --- |
| 豆腐 | northeast-fish-tofu-vegetable-corn-cake | optional_slot_hypothesis | not_proven |
| 豆角 | northeast-ribs-beans-sticky-rolls | stew_vegetable | supported_in_beijing |
| 鸡肉 | northeast-chicken-mushroom-potato-corn-cake | protein | supported |
| 蘑菇 | northeast-chicken-mushroom-potato-corn-cake | stew_vegetable | supported |
| 耐炖蔬菜 | northeast-fish-tofu-vegetable-corn-cake | optional_slot_hypothesis | not_proven |
| 排骨 | northeast-ribs-beans-corn-cake、northeast-ribs-beans-sticky-rolls | protein、protein_variant | supported、supported_in_beijing |
| 土豆 | northeast-chicken-mushroom-potato-corn-cake | stew_vegetable | supported |
| 小麦面团 | northeast-ribs-beans-sticky-rolls | sticky_roll_staple | supported_in_beijing |
| 油豆角 | northeast-ribs-beans-corn-cake | stew_vegetable | supported |
| 鱼 | northeast-fish-tofu-vegetable-corn-cake | protein | supported |
| 玉米面饼 | northeast-chicken-mushroom-potato-corn-cake、northeast-fish-tofu-vegetable-corn-cake、northeast-ribs-beans-corn-cake | staple | family_supported、supported |

## 5. 固定来源证据包

| 来源 | 等级 | 直接证明 | 不证明 |
| --- | --- | --- | --- |
| [冰城铁锅炖，缘何连年火出圈？](https://www.hlj.gov.cn/hlj/tsms/202501/c00_31797990.shtml)（黑龙江省人民政府（来源：哈尔滨日报），2025-01-02） | A | chicken-potato-corn:northeast_identity、stew-family:corn-cake-and-flower-roll-forms | chicken-potato-mushroom-corn-cake:exact_combination、fish-tofu-vegetable-corn-cake:exact_combination、sticky-roll:northeast_identity |
| [秋天的第一个目的地——黑龙江](https://wlt.hlj.gov.cn/wlt/c114254/202508/c00_31863513.shtml)（黑龙江省文化和旅游厅（来源：省非遗中心），2025-08-07） | A | ribs-beans-corn-cake:northeast_identity、ribs-beans-corn-cake:exact_combination、ribs-beans-corn-cake:family_compatibility、chicken-potato-mushroom-corn-cake:family_compatibility、fish-tofu-vegetable-corn-cake:northeast_identity、fish-tofu-vegetable-corn-cake:fish_corn_cake_family | chicken-potato-mushroom-corn-cake:exact_combination、fish-tofu-vegetable-corn-cake:tofu_as_traditional_core、fish-tofu-vegetable-corn-cake:exact_combination、sticky-roll:northeast_identity |
| [桦甸市旅游线路（0569-0590）](https://whhlyt.jl.gov.cn/ztzl/jlslyxlhxj/gdxl/jls/hds/202507/t20250704_9273173.html)（吉林省文化和旅游厅，2025-07-04） | A | chicken-potato-mushroom-corn-cake:northeast_identity、chicken-potato-mushroom-corn-cake:family_compatibility、fish-tofu-vegetable-corn-cake:northeast_identity | chicken-potato-mushroom-corn-cake:exact_combination、fish-tofu-vegetable-corn-cake:fish_corn_cake_family、fish-tofu-vegetable-corn-cake:tofu_as_traditional_core、sticky-roll:northeast_identity |
| [梨树县旅游线路（0686—0704）](https://whhlyt.jl.gov.cn/ztzl/jlslyxlhxj/gdxl/sps/lsx/202507/t20250708_9275953.html)（吉林省文化和旅游厅，2025-07-08） | A | fish-tofu-vegetable-corn-cake:northeast_identity | fish-tofu-vegetable-corn-cake:fish_corn_cake_family、fish-tofu-vegetable-corn-cake:tofu_as_traditional_core、chicken-potato-mushroom-corn-cake:exact_combination、sticky-roll:northeast_identity |
| [游“醉”美边境 赏多彩白山](https://www.jl.gov.cn/yaowen/202409/t20240920_3299348.html)（吉林省人民政府，2024-09-20） | A | chicken-potato-mushroom-corn-cake:northeast_identity、chicken-potato-mushroom-corn-cake:family_compatibility、ribs-beans-corn-cake:northeast_identity、fish-tofu-vegetable-corn-cake:northeast_identity | chicken-potato-mushroom-corn-cake:exact_combination、ribs-beans-corn-cake:exact_combination、fish-tofu-vegetable-corn-cake:fish_corn_cake_family、fish-tofu-vegetable-corn-cake:tofu_as_traditional_core、sticky-roll:northeast_identity |
| [一口“回暖”，这些美食不简单](https://whly.ln.gov.cn/whly/tpxw/2025110716014218277/index.shtml)（辽宁省文化和旅游厅，2025-11-07） | A | fish-tofu-vegetable-corn-cake:northeast_identity | fish-tofu-vegetable-corn-cake:fish_corn_cake_family、fish-tofu-vegetable-corn-cake:tofu_as_traditional_core、fish-tofu-vegetable-corn-cake:exact_combination、sticky-roll:northeast_identity |
| [平谷特色美食豆角粘卷子](https://www.visitbeijing.com.cn/article/47QmeqUNmDQ)（北京旅游网，2019-06-29） | B | sticky-roll:beijing_identity、sticky-roll:exact_combination、sticky-roll:family_compatibility | sticky-roll:northeast_identity |

## 6. 家庭适配边界

比例、克数、时间和安全终点在取得可执行证据前保持 `unresearched`，不交给模型猜。

| 对象 | 边界类型 | 状态 | 说明 |
| --- | --- | --- | --- |
| 玉米面饼 | ratio_and_shape | unresearched | 锅边贴制形态已核实，家庭克数和含水未核实。 |
| 小花卷 | ratio_and_shape | unresearched | 锅边烀制形态已核实，面团比例和家庭蒸汽空间未核实。 |
| 粘卷子 | ratio_and_shape | unresearched | 北京平谷菜面同锅形态已核实，东北关联与家庭比例未核实。 |
| 鸡肉 | safety_endpoint | unresearched | 必须独立建立禽肉熟制终点。 |
| 排骨 | safety_endpoint | unresearched | 必须独立建立排骨时间与熟制终点。 |
| 鱼 | safety_endpoint | unresearched | 必须独立建立鱼类种类、形态和熟制终点。 |
| 豆角 | safety_endpoint | unresearched | 必须独立建立充分熟制规则。 |

## 7. 产品去向决策

| 原型 | 状态 | 允许沉淀方向 | 总分 | 决策理由 |
| --- | --- | --- | ---: | --- |
| northeast-chicken-mushroom-potato-corn-cake | needs_more_evidence | template_evidence | 58 | 继续研究兼容性和家庭比例；不创建声称传统固定组合的 recipe。 |
| northeast-fish-tofu-vegetable-corn-cake | needs_more_evidence | template_evidence、taxonomy_rule | 42 | 拆开鱼锅事实与豆腐可选槽位假设；安全和兼容性完成前不进入产品。 |
| northeast-ribs-beans-corn-cake | fact_checked | template_evidence、recipe_evidence | 65 | 保留为最优先家族证据；没有比例和安全证据前不进入生产。 |
| northeast-ribs-beans-sticky-rolls | needs_more_evidence | content_only | 35 | 东北轮不把北京事实改写成东北事实；保留跨地域研究价值并等待东北补证。 |

## 8. 机器规则候选（仍被阻塞）

现有来源只支持家族结构。`supporting_source_ids` 不是克数、含水或时间的依据；生产 Ratio DSL 没有接入这些候选。

| 规则 | 类型 | 激活状态 | 结构来源 | 数值依据 | 校准状态 | 阻塞原因 |
| --- | --- | --- | --- | --- | --- | --- |
| cornmeal-flour-to-dough-v1 | preparation | blocked | hlj-culture-autumn-pot-2025 | 缺失 | required | numeric_evidence_missing、calibration_2_3_4_servings_missing |
| stew-with-corn-cake-liquid-v1 | stew_liquid | blocked | hlj-gov-iron-pot-2025、hlj-culture-autumn-pot-2025 | 缺失 | required | numeric_evidence_missing、calibration_2_3_4_servings_missing、stew_liquid_phase_split_unverified |

## 9. 2/3/4 人份厨房校准

下表是待真人执行的空记录。自动测试不得填写操作者、克数、水量、时间或验收结论。

| 份数 | 状态 | 操作者 | 玉米面形态 | 测量值 | 验收结果 |
| ---: | --- | --- | --- | --- | --- |
| 2 人份 | 待校准 | 未填写 | 未填写 | 全部留空 | 全部留空 |
| 3 人份 | 待校准 | 未填写 | 未填写 | 全部留空 | 全部留空 |
| 4 人份 | 待校准 | 未填写 | 未填写 | 全部留空 | 全部留空 |

## 10. 能力契约旅程（M1 未激活）

这些是 M2 获得单独批准后才运行的验收合同，不表示当前 Planner 已经输出相应计划。

| 旅程 | 模式/意图/份数 | 输入 | M1 预期 | M2 目标 | 预期模板 | 断言 |
| --- | --- | --- | --- | --- | --- | --- |
| ne-cap-j01 | pantry/normal/2 | 排骨、油豆角、玉米面 | template_not_runtime_eligible | complete | stew-with-staple-pot | original_cornmeal_retained、preparation_required、two_phase_water_required、regional_family_wording_allowed |
| ne-cap-j02 | pantry/normal/3 | 排骨、油豆角、玉米面 | template_not_runtime_eligible | complete | stew-with-staple-pot | three_serving_calibration_required、stable_ratio_scaling |
| ne-cap-j03 | pantry/batch/4 | 排骨、油豆角、玉米面 | template_not_runtime_eligible | complete | stew-with-staple-pot | four_serving_calibration_required、stable_ratio_scaling |
| ne-cap-j04 | recommend/normal/2 | 排骨、油豆角、玉米面 | template_not_runtime_eligible | ready | stew-with-staple-pot | recommend_not_full_coverage_promise、regional_family_basis_explained |
| ne-cap-j05 | pantry/normal/2 | 鸡腿、土豆、玉米面 | template_not_runtime_eligible | complete | stew-with-staple-pot | household_adaptation_name_only、no_fixed_traditional_name_claim |
| ne-cap-j06 | pantry/normal/2 | 排骨、普通豆角、玉米面 | template_not_runtime_eligible | complete | stew-with-staple-pot | generic_beans_not_oil_beans、no_fixed_oil_beans_claim |
| ne-cap-j07 | pantry/normal/2 | 排骨、豆角、和好的玉米面团 | template_not_runtime_eligible | complete | stew-with-staple-pot | prepared_dough_identity_preserved、preparation_not_repeated |
| ne-cap-j08 | pantry/normal/2 | 排骨、豆角、现成玉米饼 | template_not_runtime_eligible | complete | stew-with-staple-pot | ready_cake_identity_preserved、ready_cake_not_raw_dough |
| ne-cap-j09 | pantry/normal/2 | 排骨、豆角、玉米粒 | template_not_runtime_eligible | unsupported_staple_state | 无 | corn_kernel_not_cornmeal |
| ne-cap-j10 | pantry/normal/2 | 排骨、豆角、小麦面粉 | template_not_runtime_eligible | unsupported_staple_state | 无 | wheat_flour_remains_unplanned |
| ne-cap-j11 | pantry/quick/2 | 排骨、豆角、玉米面 | template_not_runtime_eligible | time_constraint | stew-with-staple-pot | no_false_thirty_minute_plan |
| ne-cap-j12 | pantry/normal/1 | 排骨、豆角、玉米面 | template_not_runtime_eligible | unsupported_servings | stew-with-staple-pot | one_serving_not_calibrated |
| ne-cap-j13 | pantry/normal/5 | 排骨、豆角、玉米面 | template_not_runtime_eligible | unsupported_servings | stew-with-staple-pot | five_servings_requires_explicit_split |
| ne-cap-j14 | pantry/normal/2 | 排骨、鸡腿、豆角、玉米面 | template_not_runtime_eligible | incompatible_combination | stew-with-staple-pot | protein_max_one、no_forced_double_protein |
| ne-cap-j15 | pantry/normal/2 | 鱼、豆腐、白菜、玉米面 | template_not_runtime_eligible | incompatible_combination | 无 | fish_branch_not_first_stage、tofu_not_traditional_core |
| ne-cap-j16 | pantry/normal/2 | 排骨、豆角、玉米面 | template_not_runtime_eligible | allergen_conflict | stew-with-staple-pot | pork_allergy_blocks_plan |
| ne-cap-j17 | pantry/normal/2 | 排骨、油豆角、玉米面 | template_not_runtime_eligible | complete | stew-with-staple-pot | same_input_same_plan、same_input_same_plan_id |
| ne-cap-j18 | pantry/normal/2 | 排骨、油豆角、玉米面 | template_not_runtime_eligible | stale_plan | stew-with-staple-pot | preparation_version_in_plan_identity、old_token_rejected |
| ne-cap-j19 | pantry/normal/2 | 排骨、油豆角、玉米面 | template_not_runtime_eligible | no_alternative_plan | stew-with-staple-pot | swap_replans_without_deepseek、no_equal_commitment_alternative |
| ne-cap-j20 | pantry/normal/2 | 排骨、油豆角、玉米面 | template_not_runtime_eligible | model_contract_violation | stew-with-staple-pot | model_violation_added_wheat_flour_or_egg |
| ne-cap-j21 | pantry/normal/2 | 排骨、油豆角、玉米面 | template_not_runtime_eligible | model_contract_violation | stew-with-staple-pot | model_violation_modified_preparation_or_stew_water |
| ne-cap-j22 | pantry/normal/2 | 排骨、油豆角、玉米面 | template_not_runtime_eligible | model_contract_violation | stew-with-staple-pot | model_violation_changed_cornmeal_to_corn_kernel |

## 家庭旅程研究结论

| 旅程 | 输入 | 预期使用 | 预期未规划 | 研究结论 | 说明 |
| --- | --- | --- | --- | --- | --- |
| ne-j01 | 鸡腿肉、榛蘑、土豆、玉米面 | 鸡腿肉、榛蘑、土豆、玉米面 | 无 | 需要更多证据 | 鸡肉蘑菇土豆炖菜和锅边玉米饼分别有据，但四项固定组合、鸡腿部位和家庭比例仍需核实。 |
| ne-j02 | 鸡胸肉、香菇、土豆、玉米面 | 鸡胸肉、香菇、土豆、玉米面 | 无 | 需要更多证据 | 鸡胸肉和香菇属于家庭适配替换假设，必须建立部位、菌菇和火候兼容规则，不能冒充地方原做法。 |
| ne-j03 | 排骨、油豆角、玉米面 | 排骨、油豆角、玉米面 | 无 | 家族路径有据 | 黑龙江官方来源直接支持排骨油豆角铁锅炖和锅边玉米面饼的家族结构，仍需补家庭比例和安全终点。 |
| ne-j04 | 排骨、普通豆角、玉米面 | 排骨、普通豆角、玉米面 | 无 | 需要更多证据 | 油豆角替换为普通豆角需要明确 taxonomy、含水和充分熟制兼容规则，不能仅凭同属豆角自动放行。 |
| ne-j05 | 排骨、豆角、面粉 | 排骨、豆角、面粉 | 无 | 需要更多证据 | 北京平谷粘卷子结构已核实，但东北关联仍未核实；北京事实可在京津冀轮复用，不能证明东北存在或不存在。 |
| ne-j06 | 鲤鱼、白菜、玉米面 | 鲤鱼、白菜、玉米面 | 无 | 需要更多证据 | 鱼锅和锅边玉米饼家族有据，但白菜作为同锅蔬菜以及家庭鱼类火候仍需独立核实。 |
| ne-j07 | 鲤鱼、豆腐、白菜、玉米面 | 鲤鱼、玉米面 | 豆腐、白菜 | 需要更多证据 | 当前证据只支持鱼锅与锅边玉米饼家族；豆腐和白菜保留为未证实可选槽位，不静默当作传统核心。 |
| ne-j08 | 鸡肉、蘑菇、土豆 | 无 | 鸡肉、蘑菇、土豆 | 不适合本家族 | 缺少本家族必须的锅边主食；普通鸡肉蘑菇土豆炖菜不能冒充 stew-with-staple 完整一锅主餐。 |
| ne-j09 | 排骨、豆角、玉米面 | 无 | 排骨、豆角、玉米面 | 不适合本家族 | 尚无三十分钟内完成排骨、豆角和锅边饼的比例与安全证据，不对 quick 意图做虚假承诺。 |
| ne-j10 | 鸡肉、排骨、鱼、豆角、土豆、白菜、蘑菇、豆腐、玉米面 | 无 | 鸡肉、排骨、鱼、豆角、土豆、白菜、蘑菇、豆腐、玉米面 | 不适合本家族 | 多个蛋白和全部蔬菜不能被强塞进一锅；未来应由确定性 Planner 分锅，本研究家族不输出伪完整计划。 |

<!-- Generated file: do not edit directly. -->

# 东北铁锅炖与锅边主食研究审计

来源：`tools/data/northeast-stew-research.v1.json`、全国地域地图与地域研究账本。
由 `node tools/build-northeast-stew-research.mjs --write` 确定性生成。

> **边界：这是研究资料，不是生产菜谱批准。** 本轮没有新增或修改生产 recipe、template、taxonomy、Ratio DSL 或运行时代码；`fact_checked` 也不等于人工试做通过。

## 摘要

- 地域：东北（CN-LN、CN-JL、CN-HL）
- 研究家族：stew-with-staple
- 原型候选：4
- 固定来源：7（A 级 6，B 级 1）
- 家庭旅程：10（已人工评审 0）
- 当前状态：research_in_progress
- 阻塞项：prototype_evidence_incomplete、ratio_evidence_incomplete、safety_evidence_incomplete、human_journey_review_incomplete
- 生产菜谱变更：0

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

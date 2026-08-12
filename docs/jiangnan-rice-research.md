<!-- Generated file: do not edit directly. -->

# 江南菜饭与锅巴饭研究审计

来源：`tools/data/jiangnan-rice-research.v1.json`、现有 72 道 recipe、candidate ledger、全国地域地图与 regional mapping。
由 `node tools/build-jiangnan-rice-research.mjs --write` 确定性生成。

> **边界：这是研究资料，不是生产菜谱批准。** 本轮没有新增或修改生产 recipe、template、taxonomy、Ratio DSL 或运行时代码；地域事实有据也不等于生产克数、米水比、安全终点或家庭锅适配已经验证。

## 摘要

- 地域：江南（CN-SH、CN-JS、CN-ZJ、CN-AH）
- 现有生产条目审计：8
- 固定来源：8（A 级 7，B 级 1）
- 安徽当前 0 道生产菜谱，2 条研究线索
- 家庭旅程：12（已人工评审 0）
- 当前状态：research_in_progress
- 阻塞项：production_claim_gaps、ratio_evidence_incomplete、safety_evidence_incomplete、anhui_leads_not_promoted、human_journey_review_incomplete
- 生产菜谱变更：0

关键纠偏：南京资料使用糯米，生产版普通大米的传统等价性未证明；半山烧野米饭民俗有据，但生产版平菇核心组合未证明；畲族乌饭使用乌稔叶汁，食品级黑米色粉只是项目家庭适配。

## 1. 四省框架

| 省级节点 | 研究问题 | 生产条目 | 研究线索 |
| --- | --- | ---: | ---: |
| 上海（CN-SH） | 整理上海咸肉菜饭、土灶菜饭与家庭锅适配的共享结构。 | 2 | 0 |
| 江苏（CN-JS） | 整理苏州与南京菜饭、咸肉香肠和鸭肉变种的同构关系。 | 4 | 0 |
| 浙江（CN-ZJ） | 核实浙江菜饭、豆饭、乌饭和器具适配类主餐的来源与结构。 | 1 | 0 |
| 安徽（CN-AH） | 核实安徽菜饭、锅巴饭和咸肉蔬菜同锅主餐的地域原型。 | 0 | 2 |

## 2. 现有 8 道生产条目审计

| 生产条目 | 生产核心食材 | 地域范围 | 审计状态 | claim 结论 | 产品去向 |
| --- | --- | --- | --- | --- | --- |
| 半山野米饭风味平菇焖饭（banshan-wild-rice） | 大米、平菇 | CN-ZJ | needs_more_evidence | cultural_identity：有直接证据（国家非遗网站直接记录半山立夏烧野米饭习俗。）<br>production_core_combination：未证明（来源提到米、鸡蛋、韭菜等户外合做，不支持生产版大米加平菇作为传统核心组合。）<br>home_vessel_equivalence：未证明（户外搭灶明火的民俗结构不能自动等价为家庭焖饭。）<br>production_ratio_safety：未证明（民俗资料不提供平菇焖饭的机器比例和安全终点。） | content_only、research_only |
| 金山土灶菜饭（jinshan-clay-oven-vegetable-rice） | 大米、小白菜 | CN-SH | needs_more_evidence | regional_identity：有直接证据（上海官方页面记录金山村落的土灶菜饭。）<br>vessel_identity：有直接证据（土灶是来源中明确出现的地方烹饪环境。）<br>home_vessel_equivalence：未证明（土灶事实不能证明普通锅或电饭锅在火力、锅巴和液体上等价。）<br>production_ratio_safety：未证明（来源没有给出可机器执行的家庭锅比例和安全终点。） | template_evidence、content_only |
| 南京矮脚黄腊肉菜饭（nanjing-cured-pork-greens-rice） | 大米、腊五花肉、矮脚黄 | CN-JS | needs_more_evidence | regional_variant：有直接证据（文化资料支持南京矮脚黄菜饭的地方身份。）<br>protein_variant：有直接证据（来源明确列出咸肉片作为菜饭配料。）<br>production_staple_equivalence：未证明（来源描述糯米，不能据此证明生产版普通大米与糯米传统等价。）<br>production_ratio_safety：未证明（文化资料不提供生产克数、液体比例或腊肉熟制安全终点。） | template_evidence、content_only |
| 南京矮脚黄板鸭菜饭（nanjing-duck-greens-rice） | 大米、包装熟制板鸭（去骨）、矮脚黄 | CN-JS | needs_more_evidence | regional_variant：有直接证据（文化资料支持南京矮脚黄菜饭的地方身份。）<br>protein_variant：有直接证据（来源明确列出板鸭丁作为菜饭配料。）<br>production_staple_equivalence：未证明（来源描述糯米，不能据此证明生产版普通大米与糯米传统等价。）<br>production_ratio_safety：未证明（文化资料不证明生产版包装熟制去骨板鸭的复热、去骨与盐度规则。） | template_evidence、taxonomy_rule、content_only |
| 南京矮脚黄香肠菜饭（nanjing-sausage-greens-rice） | 大米、广式腊肠、矮脚黄 | CN-JS | needs_more_evidence | regional_variant：有直接证据（文化资料支持南京矮脚黄菜饭的地方身份。）<br>protein_variant：有直接证据（来源明确列出香肠片作为菜饭配料。）<br>production_staple_equivalence：未证明（来源描述糯米，不能据此证明生产版普通大米与糯米传统等价。）<br>production_ratio_safety：未证明（文化资料不提供生产克数、液体比例或香肠熟制安全终点。） | template_evidence、content_only |
| 上海奉贤咸肉菜饭（shanghai-salted-pork-vegetable-rice） | 大米、咸五花肉、小白菜 | CN-SH | evidence_checked | regional_identity：有直接证据（奉贤政府页面直接记录当地村民制作咸肉菜饭。）<br>core_combination：有直接证据（来源直接出现咸肉、青菜和大米同锅。）<br>production_ratio_safety：未证明（文化报道不提供可机器执行的米水比、安全终点或家庭锅校准。） | recipe_evidence、template_evidence |
| 畲族乌饭风味家庭适配版（she-people-black-rice） | 糯米、食品级黑米色粉 | cross_regional_chinese | needs_more_evidence | cultural_identity：有直接证据（民族宗教部门资料直接记录畲族三月三乌饭及乌稔叶汁浸染糯米。）<br>traditional_color_source_equivalence：未证明（生产版食品级黑米色粉不是来源中的乌稔叶汁，不能称为传统色源等价。）<br>production_ratio_safety：未证明（文化资料不能替代色粉用量、过敏原与糯米熟制的机器规则。） | taxonomy_rule、content_only |
| 苏州青菜咸肉饭（suzhou-salted-pork-vegetable-rice） | 大米、咸五花肉、小白菜 | CN-JS | evidence_checked | regional_identity：有直接证据（苏州市政府页面明确记录吴江香青菜咸肉饭。）<br>core_combination：有直接证据（来源直接支持香青菜与咸肉饭的组合。）<br>production_ratio_safety：未证明（来源不提供生产条目的普通小白菜等价性、米水比或熟制终点。） | recipe_evidence、template_evidence |

## 3. 家族与变体关系

| 条目 | 家族锚点 | 变体轴 | 边界说明 |
| --- | --- | --- | --- |
| banshan-wild-rice | outdoor-seasonal-rice | mushroom home adaptation | 民俗名称有据，平菇家庭焖饭不是来源支持的传统变体。 |
| jinshan-clay-oven-vegetable-rice | plain-greens-rice | wood-fired clay stove | 土灶身份有据，家庭锅适配不能冒充传统等价。 |
| nanjing-cured-pork-greens-rice | nanjing-seasonal-greens-rice | cured pork | 肉类变体有据，普通大米替代糯米的传统等价性未证明。 |
| nanjing-duck-greens-rice | nanjing-seasonal-greens-rice | cooked duck | 板鸭丁变体有据，普通大米和包装熟制去骨产品是生产适配。 |
| nanjing-sausage-greens-rice | nanjing-seasonal-greens-rice | sausage | 香肠变体有据，普通大米替代糯米的传统等价性未证明。 |
| shanghai-salted-pork-vegetable-rice | greens-salted-meat-rice | Shanghai-Fengxian salted pork | 核心组合有据，小白菜的具体叶菜身份与生产比例属于项目标准。 |
| she-people-black-rice | ritual-colored-glutinous-rice | food-grade powder adaptation | 文化身份有据，生产色源明确标为家庭适配而非复刻。 |
| suzhou-salted-pork-vegetable-rice | greens-salted-meat-rice | Suzhou-Wujiang fragrant greens | 香青菜咸肉饭有据，生产条目用小白菜属于受控家庭改造。 |

## 4. 食材覆盖矩阵

| 食材或形态 | 生产条目 | 角色 | 证据状态 |
| --- | --- | --- | --- |
| 矮脚黄 | nanjing-cured-pork-greens-rice、nanjing-duck-greens-rice、nanjing-sausage-greens-rice | regional_leafy_green | supported |
| 板鸭丁 | nanjing-duck-greens-rice | regional_cooked_duck | supported |
| 包装熟制板鸭（去骨） | nanjing-duck-greens-rice | production_cooked_duck | project_adaptation |
| 大米 | jinshan-clay-oven-vegetable-rice、shanghai-salted-pork-vegetable-rice、suzhou-salted-pork-vegetable-rice | plain_rice_staple | family_supported、supported |
| 鸡蛋 | banshan-wild-rice | documented_gathered_ingredient | supported |
| 韭菜 | banshan-wild-rice | documented_gathered_ingredient | supported |
| 腊肉 | nanjing-cured-pork-greens-rice | cured_pork | supported |
| 米 | banshan-wild-rice | cultural_staple | supported |
| 糯米 | nanjing-cured-pork-greens-rice、nanjing-duck-greens-rice、nanjing-sausage-greens-rice、she-people-black-rice | glutinous_rice_staple、source_staple | supported |
| 平菇 | banshan-wild-rice | production_mushroom | not_proven |
| 普通大米 | nanjing-cured-pork-greens-rice、nanjing-duck-greens-rice、nanjing-sausage-greens-rice | production_plain_rice | not_proven |
| 青菜 | shanghai-salted-pork-vegetable-rice | leafy_green | supported |
| 时令青菜 | jinshan-clay-oven-vegetable-rice | leafy_green | family_supported |
| 食品级黑米色粉 | she-people-black-rice | production_color_source | project_adaptation |
| 乌稔树嫩叶汁 | she-people-black-rice | traditional_color_source | supported |
| 吴江香青菜 | suzhou-salted-pork-vegetable-rice | regional_leafy_green | supported |
| 咸肉 | shanghai-salted-pork-vegetable-rice、suzhou-salted-pork-vegetable-rice | salted_pork | supported |
| 香肠 | nanjing-sausage-greens-rice | sausage | supported |
| 小白菜 | jinshan-clay-oven-vegetable-rice、shanghai-salted-pork-vegetable-rice、suzhou-salted-pork-vegetable-rice | production_leafy_green | project_adaptation |

## 5. 固定来源证据包

| 来源 | 等级 | 直接证明 | 不证明 |
| --- | --- | --- | --- |
| [大雪节气村民做咸肉菜饭，青菜甜糯咸肉清香](https://www.fengxian.gov.cn/ymsmkfxjson/20221209/33096.html)（上海市奉贤区人民政府，2022-12-09） | A | shanghai-salted-pork-vegetable-rice:regional_identity、shanghai-salted-pork-vegetable-rice:core_combination | shanghai-salted-pork-vegetable-rice:production_ratio_safety、shanghai-salted-pork-vegetable-rice:home_vessel_equivalence |
| [吴江香青菜入选国家地理标志产品](https://www.suzhou.gov.cn/szsrmzf/szyw/202508/71a0b390ad12488b90e3761b40359c73.shtml)（苏州市人民政府（来源：苏州日报），2025-08-02） | A | suzhou-salted-pork-vegetable-rice:regional_identity、suzhou-salted-pork-vegetable-rice:core_combination | suzhou-salted-pork-vegetable-rice:production_ratio_safety、suzhou-salted-pork-vegetable-rice:common-greens-equivalence |
| [南京小寒食俗：菜饭](https://www.zjskw.gov.cn/art/2024/8/15/art_1229556995_60165.html)（浙江省社会科学界联合会，2024-08-15） | B | nanjing-cured-pork-greens-rice:regional_variant、nanjing-cured-pork-greens-rice:protein_variant、nanjing-sausage-greens-rice:regional_variant、nanjing-sausage-greens-rice:protein_variant、nanjing-duck-greens-rice:regional_variant、nanjing-duck-greens-rice:protein_variant | nanjing-cured-pork-greens-rice:production_staple_equivalence、nanjing-sausage-greens-rice:production_staple_equivalence、nanjing-duck-greens-rice:production_staple_equivalence、nanjing-cured-pork-greens-rice:production_ratio_safety、nanjing-sausage-greens-rice:production_ratio_safety、nanjing-duck-greens-rice:production_ratio_safety |
| [最美网红村踏青攻略来了](https://mzj.sh.gov.cn/lnb-xw/20250403/72b3908562e14a8f89db37ea83d53ecd.html)（上海市民政局，2025-04-03） | A | jinshan-clay-oven-vegetable-rice:regional_identity、jinshan-clay-oven-vegetable-rice:vessel_identity | jinshan-clay-oven-vegetable-rice:home_vessel_equivalence、jinshan-clay-oven-vegetable-rice:production_ratio_safety |
| [正果镇畲族乌饭制作技艺成功入选市级非遗名录](https://mzzjj.gz.gov.cn/xwdt/gqdt/content/post_10848697.html)（广州市民族宗教事务局，2026-06-09） | A | she-people-black-rice:cultural_identity | she-people-black-rice:traditional_color_source_equivalence、she-people-black-rice:production_ratio_safety |
| [拱墅区举办第六届半山立夏节](https://www.ihchina.cn/solarzx_details/18383.html)（中国非物质文化遗产网·中国非物质文化遗产数字博物馆，2017-05-05） | A | banshan-wild-rice:cultural_identity | banshan-wild-rice:production_core_combination、banshan-wild-rice:home_vessel_equivalence、banshan-wild-rice:production_ratio_safety |
| [新徽菜·名徽厨——东至五大名菜之一东至农家锅巴饭](https://czsrsj.chizhou.gov.cn/Content/show/608587.html)（池州市人力资源和社会保障局（来源：东至县人社局），2022-11-22） | A | anhui-dongzhi-farm-pot-crust-rice:regional_identity | anhui-dongzhi-farm-pot-crust-rice:planner_compatibility、anhui-dongzhi-farm-pot-crust-rice:production_ratio_safety |
| [关于霍邱县第五批县级非物质文化遗产名录的解读](https://www.huoqiu.gov.cn/public/6600541/37942838.html)（霍邱县人民政府（发布机构：霍邱县文旅体育局），2025-06-24） | A | anhui-mugwort-pot-crust:regional_identity | anhui-mugwort-pot-crust:ingredient_identity_safety、anhui-mugwort-pot-crust:planner_compatibility、anhui-mugwort-pot-crust:production_ratio_safety |

## 6. 家庭适配边界

本轮不编造克数、时间、温度或安全终点；`unresearched` 项不能交给模型自由推断。

| 对象 | 边界类型 | 状态 | 说明 |
| --- | --- | --- | --- |
| 糯米改普通大米 | adaptation_equivalence | not_proven | 南京来源写糯米，生产条目使用普通大米。 |
| 地域青菜改常见叶菜 | adaptation_equivalence | needs_compatibility_review | 吴江香青菜、矮脚黄与小白菜不可只凭类别视为同一地域身份。 |
| 土灶改普通家庭锅 | adaptation_equivalence | not_proven | 火力、锅巴和液体蒸发不同。 |
| 户外明火改家庭锅 | adaptation_equivalence | not_proven | 半山民俗的搭灶合做不能自动变成平菇焖饭。 |
| 乌稔叶汁改食品级黑米色粉 | adaptation_equivalence | project_adaptation | 必须明确标为家庭适配，不得声称复刻传统色源。 |
| 普通生米菜饭比例 | ratio_and_liquid | unresearched | 需按叶菜含水、器具和蛋白析出独立建立 Ratio DSL。 |
| 糯米浸泡与熟制比例 | ratio_and_liquid | unresearched | 不得借用普通米比例。 |
| 剩米饭含水路径 | ratio_and_liquid | unresearched | 属于独立熟饭技法，不进入生米菜饭。 |
| 咸肉熟制与盐度 | safety_endpoint | unresearched | 需要独立熟制和盐度规则。 |
| 腊肉熟制与盐度 | safety_endpoint | unresearched | 不能与鲜肉或香肠共用一个模糊终点。 |
| 香肠熟制与脂肪析出 | safety_endpoint | unresearched | 需按具体熟制状态建立规则。 |
| 熟制板鸭复热与去骨 | safety_endpoint | unresearched | 需要来源、去骨和彻底复热证据。 |
| 植物色源与蒿子身份 | safety_endpoint | unresearched | 未知植物不得进入生产食材。 |

## 7. 安徽研究线索

> 安徽两项都有官方地方事实，但仍是研究线索，不是新 recipe，也不是 Planner 已支持的方案。

| 线索 | 已知结构 | 未决问题 | 状态 | 产品去向 |
| --- | --- | --- | --- | --- |
| 东至农家锅巴饭（anhui-dongzhi-farm-pot-crust-rice） | 香米、红心芋、粉蒸肉、锅巴 | 生肉与米同锅的熟制终点如何机器化、红心芋与粉蒸肉的家庭份量边界、锅巴目标在普通电饭锅中是否可复现 | discovery_only | research_only |
| 霍邱蒿子锅巴（anhui-mugwort-pot-crust） | 蒿子、大米、菜干饭、锅巴 | 蒿子具体植物身份与食品安全边界、家庭购买来源与可识别 taxonomy、它更适合主餐、节俗内容还是锅巴小吃 | needs_source_review | research_only |

## 8. 产品去向决策

| 类型 | 对象 | 状态 | 允许沉淀方向 | 总分 | 决策理由 |
| --- | --- | --- | --- | ---: | --- |
| province_research_lead | anhui-dongzhi-farm-pot-crust-rice | discovery_only | research_only | 11 | 地域和高层结构有据，但需先解决生肉熟制、锅巴器具与比例，不能直接创建生产菜谱。 |
| province_research_lead | anhui-mugwort-pot-crust | needs_source_review | research_only | 6 | 地方事实成立，但植物身份和产品形态尚未满足家庭规划器要求。 |
| production_recipe | banshan-wild-rice | needs_more_evidence | content_only、research_only | 5 | 保留半山立夏文化线索；生产版平菇组合需要重新评价，不用于扩展组合能力。 |
| production_recipe | jinshan-clay-oven-vegetable-rice | needs_more_evidence | template_evidence、content_only | 11 | 保留土灶菜饭文化与技法线索，普通家庭锅比例另行研究。 |
| production_recipe | nanjing-cured-pork-greens-rice | needs_more_evidence | template_evidence、content_only | 12 | 保留南京变体证据，生产版主食形态与比例需另行核实。 |
| production_recipe | nanjing-duck-greens-rice | needs_more_evidence | template_evidence、taxonomy_rule、content_only | 10 | 可支持南京板鸭变体，但生产食材形态和安全边界不能由文化来源代替。 |
| production_recipe | nanjing-sausage-greens-rice | needs_more_evidence | template_evidence、content_only | 12 | 保留南京香肠变体证据，主食形态与生产比例需另行核实。 |
| production_recipe | shanghai-salted-pork-vegetable-rice | evidence_checked | recipe_evidence、template_evidence | 15 | 可作为江南咸肉菜饭家族证据，但不能用文化来源给生产比例背书。 |
| production_recipe | she-people-black-rice | needs_more_evidence | taxonomy_rule、content_only | 6 | 适合作为文化与色源安全边界，不作为通用可组合食材模板。 |
| production_recipe | suzhou-salted-pork-vegetable-rice | evidence_checked | recipe_evidence、template_evidence | 15 | 可支持苏州家族身份，但不把吴江香青菜与所有青菜视为地域等价。 |

## 9. 家庭旅程研究结论

| 旅程 | 模式/意图 | 输入 | 预期使用 | 预期未规划 | 研究结论 | 说明 |
| --- | --- | --- | --- | --- | --- | --- |
| jn-j01 | pantry/normal | 大米、小白菜、咸肉 | 大米、小白菜、咸肉 | 无 | 家族路径有据 | 奉贤咸肉菜饭家族可覆盖三项，但小白菜具体地域身份和生产比例仍属于家庭适配。 |
| jn-j02 | pantry/normal | 大米、吴江香青菜、咸肉 | 大米、吴江香青菜、咸肉 | 无 | 家族路径有据 | 苏州官方资料直接支持香青菜咸肉饭身份。 |
| jn-j03 | pantry/normal | 大米、矮脚黄、腊肉 | 大米、矮脚黄、腊肉 | 无 | 需要更多证据 | 南京腊肉变体有据，但来源写糯米，普通大米主食等价性未证明。 |
| jn-j04 | pantry/normal | 大米、矮脚黄、香肠 | 大米、矮脚黄、香肠 | 无 | 需要更多证据 | 南京香肠变体有据，但普通大米与生产比例尚未被来源证明。 |
| jn-j05 | pantry/normal | 大米、矮脚黄、包装熟制板鸭 | 大米、矮脚黄、包装熟制板鸭 | 无 | 需要更多证据 | 板鸭变体有据，但包装熟制去骨状态、普通大米与复热安全属于生产适配。 |
| jn-j06 | pantry/fresh | 大米、青菜 | 大米、青菜 | 无 | 家族路径有据 | 金山土灶菜饭支持无肉菜饭家族，但普通家庭锅适配仍需验证。 |
| jn-j07 | pantry/normal | 剩米饭、青菜、咸肉 | 无 | 剩米饭、青菜、咸肉 | 不适合本家族 | 剩米饭不能套用生米菜饭的吸水与焖制结构，应进入独立熟饭家族。 |
| jn-j08 | pantry/normal | 大米、鲜猪肉、青菜 | 大米、青菜 | 鲜猪肉 | 不适合本家族 | 鲜猪肉不是咸肉、腊肉或香肠，不能借江南咸肉菜饭名称强行吸收。 |
| jn-j09 | recommend/batch | 糯米、食品级黑米色粉 | 糯米、食品级黑米色粉 | 无 | 需要更多证据 | 只可称畲族乌饭风味家庭适配版，黑米色粉不等同乌稔叶汁。 |
| jn-j10 | pantry/normal | 大米、平菇 | 大米、平菇 | 无 | 需要更多证据 | 可作为普通平菇焖饭研究，但半山民俗来源不证明平菇是传统核心。 |
| jn-j11 | recommend/quick | 大米、小白菜、咸肉 | 无 | 大米、小白菜、咸肉 | 需要更多证据 | 没有可执行时间证据前，研究层不能承诺该生米菜饭在30分钟内完成。 |
| jn-j12 | recommend/normal | 香米、红心芋、猪前腿肉 | 无 | 香米、红心芋、猪前腿肉 | 仅研究线索 | 东至农家锅巴饭有地域来源，但生肉熟制、份量和锅巴器具尚未成为 Planner 规则。 |

<!-- Generated file: do not edit directly. -->

# 全国咸味菜饭/焖饭：菜单与食材构成审阅表

范围：全国咸味菜饭/焖饭研究总目录；只记录身份、证据与适配边界，不激活运行时配方。

由 `node tools/build-rice-meal-collection.mjs --write` 从 `tools/data/rice-meal-collection.v1.json` 确定性生成。此表用于研究与运行边界审阅，不代表菜谱已人工批准或生产部署。

## 上海（CN-SH）

### jiangnan-vegetable-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 上海奉贤咸肉菜饭 | 米、青菜、咸肉/香肠 | A | raw-rice | 土灶或锅中米、菜和咸肉同煮成饭 | identity、quantity、liquid、appliance、safety、nutrition | complete | 无 | runtime_ready |

## 江苏（CN-JS）

### jiangnan-vegetable-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 南京矮脚黄板鸭菜饭 | 糯米、矮脚黄、板鸭丁、姜 | C | glutinous-rice | 文化来源记录板鸭丁、矮脚黄与糯米一起煮，同文又有青菜米饭翻炒的概括，未形成唯一可执行流程 | identity、safety | identity_only | 板鸭丁的生熟状态未定：咸板鸭为生制品须合法熟制，盐水鸭才是熟制即食；不得自动归一为熟板鸭；缺数量、有效液体、份数、器具与唯一工艺 | identity_only |
| 吴江香青菜咸肉饭 | 米、吴江香青菜、咸肉 | A | rice-state-unverified | 来源只证明吴江香青菜与咸肉饭的地域身份，不证明配米蒸煮流程 | identity | identity_only | 来源未给投料数量、米的生熟/浸泡状态、有效液体和完整工艺；不得用邻近地区菜饭流程补写 | identity_only |

## 浙江（CN-ZJ）

### jiangnan-mustard-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 温州芥菜饭 | 糯米、芥菜、猪肉末 | A | glutinous-rice | 传统资料支持浸泡糯米先蒸熟，芥菜与肉等配料炒香后再合并炒拌，不是生米一键闭盖流程 | identity | identity_only | 一手来源未给精确数量、有效液体、份数与熟制终点；传统“蒸米+炒配料+合并炒拌”不能静默改成一只电饭煲一键版；须家庭实验并明标改编 | research_candidate |

### seasonal-mixed-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 半山立夏野米饭 | 米、鸡蛋、韭菜 | C | raw-rice | 立夏民俗用铁锅和砖灶烧制野米饭 | identity | identity_only | 无数量和电饭煲适配 | research_candidate |

## 安徽（CN-AH）

### pot-crust-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 东至农家锅巴饭 | 香米、猪肉、芋头 | A | raw-rice | 电饭煲提及，后段成锅巴 | identity、quantity | partial | 水量“1.5瓶”含义不明；生肉后加安全未闭合 | research_candidate |

## 福建（CN-FJ）

### minnan-crab-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 泉州红蟳饭（红膏蟳饭） | 大米/糯米、红膏蟳（雌性青蟹）、五花肉、干香菇、干贝/虾仁干 | A | mixed-rice | 泉州官方资料记录活蟹处理与先煎、香菇干贝五花肉炒香、与米合并高压或蒸制的分支流程 | identity | identity_only | 未取得团体标准正文；页面无精确食材克数、有效液体、份数、时间和家庭设备档位；活蟹处理、蟹壳锐物、甲壳/贝类过敏、死蟹禁用、冷链和蟹肉完全熟制均未形成可机器验证终点；不得用虾仁替换红膏蟳后仍使用红蟳饭的地域真名 | research_candidate |

### minnan-oil-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 泉州海味三层肉浥饭（油饭） | 米、五花肉、豆干、香菇、蚝/干贝 | A | raw-rice | 官方原型是生大米、三层肉、豆干、香菇与海味在柴火锅中同煮 | identity | identity_only | 来源无数量、有效液体、份数、家庭器具参数及海鲜熟制/过敏边界；官方原型的生大米+三层肉+豆干+海味与当前映射的泡发糯米+肉末+香菇不等价；未闭合前不得冒充地域原方 | planned |

### minnan-salted-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 福建盖菜肉末咸饭 | 稻米、盖菜、洋葱、瘦猪肉 | A | raw-rice | 官方学生带量表只证明每名9至11岁学生的食材可食部克数，不提供烹调工艺 | identity、quantity、nutrition | partial | 来源给出稻米105g、盖菜115g、洋葱30g、瘦猪肉25g/名9至11岁学生，但无有效液体、烹调流程、家庭器具和成人份校准 | research_candidate |

## 台湾（CN-TW）

### taiwan-mixed-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 高丽菜饭 | 米、高丽菜、虾米、香菇 | B | raw-rice | 来源为电锅炊饭：高丽菜、虾米、香菇等与米按固定批量处理，水为米体积量0.8倍 | identity、quantity、liquid、appliance | complete | 内部校准合同尚未完成实厨试做，不得标为正式可见目录 | calibration_ready |
| 南瓜饭 | 米、南瓜、猪绞肉、虾米、香菇 | A | raw-rice | 来源按厂家量杯取米、水为米体积量0.8倍；首次完成后静置15分钟并再启动一次开关 | identity、quantity、liquid、appliance | complete | 内部校准合同尚未完成实厨试做，不得标为正式可见目录 | calibration_ready |

## 广东（CN-GD）

### cantonese-claypot-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 豉汁排骨饭 | 米、排骨、豆豉 | B | raw-rice | 番禺官方资料将豉汁排骨饭列为煲仔饭分支，水将收干时加腌肉再小火焖熟 | identity | identity_only | 豆豉与复合酱汁克数、有效液体、两人份和普通电饭煲程序未闭合；带骨排骨最厚肉处的熟制终点和高钠边界未闭合；松下花菇排骨焖饭只是型号专属近邻证据，不是豉汁排骨饭，不得直接搬用参数 | research_candidate |
| 广州腊味煲仔饭 | 米、腊肉/腊肠 | B | raw-rice | 砂锅后加腊味并取锅巴 | identity | identity_only | 砂锅后加与通用电饭煲不等价 | research_candidate |
| 冬菇滑鸡饭 | 米、鸡肉、香菇 | A | raw-rice | 番禺官方资料记录浸米入砂锅，水将收干时加入预先腌制的鸡肉与冬菇，再转小火焖熟 | identity | identity_only | 来源无统一两人份克数、有效液体、普通电饭煲程序和鸡肉74摄氏度中心终点；厂商鸡肉+香菇饭的近邻参数来自不同型号与不同菜名，不得混拼成冬菇滑鸡饭的权威配方；普通电饭煲版不得承诺传统砂锅锅巴 | research_candidate |

### manufacturer-mixed-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 香芋鸡煲仔饭（松下机型配方） | 米、鸡肉、芋头、虾米、香菇、木耳 | A | raw-rice | 指定压力IH机型水位线3烹调 | identity、quantity、appliance | partial | 来源限定松下压力IH机型、煲仔饭专用程序和短粒米水位线3，未给通用新增水克数；芋头需先油炸，不属于原料直接入锅的简化流程；不能宣称跨型号、跨品牌或普通白米程序等价 | planned |

## 海南（CN-HI）

显式空白地域：定安菜包饭为熟饭翻炒包裹，排除原米菜饭候选。

## 新疆（CN-XJ）

### xinjiang-pilaf

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 新疆羊肉抓饭（波劳） | 米、羊肉、胡萝卜、洋葱 | A | raw-rice | 羊肉胡萝卜炒香后与米焖熟 | identity、appliance | partial | 电饭煲来源的1:2未说明分子、分母、质量/体积与米的生熟状态，禁止自动解读为米水比；来源未给大米实际克数、份数、羊肉块尺寸和可机器验证熟制终点；不得把压力锅或其他来源的液体数字合并成普通电饭煲通用公式 | planned |
| 新疆碎肉抓饭 | 米、羊肉、胡萝卜、鹰嘴豆 | A | raw-rice | 碎肉、菜、豆与米配餐 | identity、quantity、nutrition | partial | 无液体和工艺 | research_candidate |

## 陕西（CN-SN）

### household-reviewed-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 陕北红枣豇豆焖饭 | 米、豇豆、红枣 | A | raw-rice | 项目家庭审核，未进入 Preview | identity | partial | 仍待液体复核 | planned |

### northwest-meat-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 米脂羊肉丁丁饭 | 小米、羊肉、羊肉汤 | C | rice-state-unverified | 羊肉汤与小米同锅煮制 | identity | identity_only | 来源未给固定数量、液体或份数，约一个时辰未给起算点，且尚未建立现代电饭煲适配 | research_candidate |

## 宁夏（CN-NX）

### northwest-meat-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 宁夏肉粘饭 | 米、牛/羊肉、洋葱、胡萝卜 | A | raw-rice | 炒肉菜后与米蒸焖 | identity | identity_only | 无数量与液体 | research_candidate |

## 四川（CN-SC）

### sichuan-kong-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 四川四季豆孔干饭 | 米、四季豆 | B | parboiled-drained-rice | 米先煮至半熟后沥米汤，四季豆略炒，再铺上沥干的米加盖小火回焖 | identity、safety | identity_only | 半熟预煮终点、沥米汤量、是否回加液体、回焖时间与程序都无精确参数；半熟沥汤是孔干饭身份技法，不得静默改成生米一键焖饭；四季豆必须充分熟制；访谈的“略炒+回焖”没有提供可机器验证的时间/熟度终点 | research_candidate |
| 四川豌豆孔干饭 | 米、豌豆 | B | parboiled-drained-rice | 米先煮至半熟后沥米汤，豌豆略炒，再铺上沥干的米加盖小火回焖 | identity | identity_only | 半熟预煮终点、沥米汤量、是否回加液体、回焖时间与程序都无精确参数；半熟沥汤是孔干饭身份技法，不得静默改成生米一键焖饭；来源为转载，仍需独立一手复核 | research_candidate |

## 重庆（CN-CQ）

### sichuan-kong-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 綦江洋芋腊肉箜饭 | 米、土豆、腊肉 | C | rice-state-unverified | 重庆市人民政府地方特色美食名单点名，未提供箜饭制作流程 | identity | identity_only | 来源只在地方特色美食名单中点名，缺米态、数量、液体、顺序、时间、器具和安全终点 | identity_only |

### wuling-she-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 酉州社饭 | 米、腊肉、豆干、野菜 | A | parboiled-rice | 米预煮、野菜和腊味多阶段合制 | identity | identity_only | 野菜控制和多阶段工艺 | research_candidate |

## 云南（CN-YN）

### yunnan-potato-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 施甸蚕豆火腿焖饭 | 米、火腿、蚕豆 | C | raw-rice | 焖饭身份记录 | identity | identity_only | 无工艺、数量和液体 | identity_only |
| 施甸豌豆洋芋火腿焖饭 | 米、土豆、火腿、鲜豌豆 | A | raw-rice | 施甸县官方资料记录火腿切丁煎出油，与新鲜豌豆、洋芋丁和大米混合，放入罗锅以柴火慢焖 | identity | identity_only | 官方来源只给真实菜名、核心组合和高层流程，无大米、洋芋、火腿、豌豆克数，无份数与有效液体；火腿出油量、盐度、柴火强弱、时间、完成判据和电饭煲程序均未闭合；任何两人份参数都只能作为项目试验假设 | research_candidate |
| 腾冲北海铜锅洋芋饭 | 米、土豆、绿豆、腊肉 | C | raw-rice | 铜锅焖制 | identity、appliance | identity_only | 来源未给数量、液体或安全终点，仅支持铜锅传统流程，尚未建立电饭煲适配 | research_candidate |

## 贵州（CN-GZ）

### wuling-she-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 贵州侗家甑蒸社饭 | 糯米/粳米、艾草、腊肉、花生、豆干 | A | mixed-rice | 甑蒸两条工艺分支 | identity | identity_only | 双工艺且无总克数液体 | research_candidate |
| 铜仁万山社饭 | 鲜米、糯米、菜/豆、花生、腊肉 | A | mixed-rice | 预煮、热泡、低焖 | identity | identity_only | 无总数量液体，多阶段 | research_candidate |

## 河南（CN-HA）

### ground-pot-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 辉县地锅鸡米饭 | 生米、鸡肉、干豆角、香菇 | A | raw-rice | 地锅鸡与米饭 | identity | identity_only | 无克数、液体和份数 | research_candidate |

## 湖南（CN-HN）

### bamboo-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 涟源腊肉红枣竹筒饭 | 米、腊肉、红枣 | B | raw-rice | 火烤竹筒 | identity | identity_only | 火烤器具身份且无数量液体 | research_candidate |
| 湘江源瑶家竹筒饭 | 糯米、茶豆、猪肉末 | A | glutinous-rice | 竹筒火烤 | identity、quantity | partial | 需食品安全竹筒与首煮液体 | research_candidate |

### wuling-she-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 麻阳社饭 | 粳米/糯米、艾草、腊肉、野葱、蒜苗 | A | mixed-rice | 预煮沥米或甑蒸 | identity | identity_only | 无总克数液体 | research_candidate |
| 湘西社饭 | 糯米/粳米、野菜、腊肉、葱蒜 | A | mixed-rice | 社饭多阶段蒸焖 | identity | identity_only | 比例文字冲突且无可执行比 | research_candidate |

## 湖北（CN-HB）

### middle-yangtze-cured-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 宜昌腊肉焖饭 | 米、腊肉 | B | rice-state-unverified | 焖饭名称身份记录 | identity | identity_only | 仅有名称，缺工艺、数量和液体 | identity_only |

## 河北（CN-HE）

显式空白地域：涉县条目为小米焖饭，不属于本轮米饭菜饭范围。

## 香港（CN-HK）

显式空白地域：本轮未找到符合咸味干饭完整主餐边界的可靠候选。

## 澳门（CN-MO）

显式空白地域：本轮未找到符合咸味干饭完整主餐边界的可靠候选。

## 天津（CN-TJ）

### zeng-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 宁河甑乡肉焖儿 | 米、猪肉 | B | raw-rice | 通风陶甑蒸制 | identity | identity_only | 无数量液体，甑器具身份 | research_candidate |

## 广西（CN-GX）

显式空白地域：本轮未找到具可靠第一方证据、符合咸味干饭完整主餐边界的候选；五色糯米饭为营养 C/礼俗饭。

## 甘肃（CN-GS）

显式空白地域：本轮无符合边界的可靠咸味干饭完整主餐。

## 青海（CN-QH）

显式空白地域：本轮无符合边界的可靠咸味干饭完整主餐。

## 西藏（CN-XZ）

显式空白地域：本轮无符合边界的可靠咸味干饭完整主餐。

## 辽宁（CN-LN）

显式空白地域：本轮无符合边界的可靠候选。

## 吉林（CN-JL）

显式空白地域：本轮无符合边界的可靠候选。

## 黑龙江（CN-HL）

显式空白地域：本轮无符合边界的可靠候选。

## 北京（CN-BJ）

显式空白地域：本轮无符合边界的可靠候选。

## 山西（CN-SX）

显式空白地域：本轮无符合边界的可靠候选。

## 内蒙古（CN-NM）

显式空白地域：本轮无符合边界的可靠候选。

## 山东（CN-SD）

显式空白地域：本轮无符合边界的可靠候选。

## 江西（CN-JX）

显式空白地域：本轮无符合边界的可靠候选。

## 家常标准（非地域）（HOUSEHOLD）

### household-reviewed-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 西兰花牛肉焖饭 | 米、西兰花、牛肉 | A | raw-rice | 一锅出项目 Preview 家庭测试标准，待真实厨房反馈 | identity、quantity、liquid、appliance、safety、nutrition | complete | 无 | runtime_ready |
| 白菜豆腐焖饭 | 米、白菜、豆腐 | A | raw-rice | 一锅出项目 Preview 家庭测试标准，待真实厨房反馈 | identity、quantity、liquid、appliance、safety、nutrition | complete | 无 | runtime_ready |
| 鸡腿土豆焖饭 | 米、鸡腿、土豆 | B | raw-rice | 项目家庭标准闭盖烹调 | identity、quantity、liquid、appliance、safety、nutrition | complete | 无 | runtime_ready |
| 玉米胡萝卜鸡腿焖饭 | 米、鸡腿、胡萝卜、玉米 | A | raw-rice | 项目家庭标准闭盖烹调 | identity、quantity、liquid、appliance、safety、nutrition | complete | 无 | runtime_ready |
| 豆角排骨焖饭 | 米、豆角、排骨 | A | raw-rice | 一锅出项目 Preview 家庭测试标准，待真实厨房反馈 | identity、quantity、liquid、appliance、safety、nutrition | complete | 无 | runtime_ready |
| 肉糜青菜饭 | 米、肉糜、青菜 | A | raw-rice | 项目家庭标准闭盖烹调 | identity、quantity、liquid、appliance、safety、nutrition | complete | 无 | runtime_ready |
| 香菇豆角排骨焖饭 | 米、香菇、豆角、排骨 | A | raw-rice | 一锅出项目 Preview 家庭测试标准，待真实厨房反馈 | identity、quantity、liquid、appliance、safety、nutrition | complete | 无 | runtime_ready |

### manufacturer-mixed-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 咖喱鸡肉饭 | 大米、鸡胸肉、胡萝卜、土豆、洋葱 | A | raw-rice | Joyoung America的咖喱鸡肉饭提供真实菜名、组合和电饭煲流程；项目另建两人校准合同。 | identity、quantity、liquid、appliance | complete | 内部校准合同尚未完成实厨试做，不得标为正式可见目录 | calibration_ready |
| 懒人焖饭（腊肠什锦版） | 大米、腊肠、青豌豆、香菇、玉米、胡萝卜 | B | raw-rice | Joyoung America的懒人焖饭提供真实菜名、组合和电饭煲流程；项目另建两人校准合同。 | identity、quantity、liquid、appliance | complete | 内部校准合同尚未完成实厨试做，不得标为正式可见目录 | calibration_ready |
| 鲜香菇饭 | 大米、鸡胸肉、香菇、芹菜 | B | raw-rice | 松下家电（中国）有限公司的鲜香菇饭提供真实菜名、组合和电饭煲流程；项目另建两人校准合同。 | identity、quantity、liquid、appliance | complete | 内部校准合同尚未完成实厨试做，不得标为正式可见目录 | calibration_ready |
| 什锦鸡饭 | 大米、鸡胸肉、油炸豆腐、牛蒡、胡萝卜、香菇 | A | raw-rice | 松下家电（中国）有限公司的什锦鸡饭提供真实菜名、组合和电饭煲流程；项目另建两人校准合同。 | identity、quantity、liquid、appliance | complete | 内部校准合同尚未完成实厨试做，不得标为正式可见目录 | calibration_ready |
| 鲜蔬竹笋饭 | 大米、猪肉末、竹笋、洋葱、胡萝卜、干木耳 | B | raw-rice | 上海象印家用电器有限公司的鲜蔬竹笋饭提供真实菜名、组合和电饭煲流程；项目另建两人校准合同。 | identity、quantity、liquid、appliance | complete | 内部校准合同尚未完成实厨试做，不得标为正式可见目录 | calibration_ready |
| 牛肉什锦饭 | 米、牛肉末、胡萝卜泥、洋葱 | A | raw-rice | 象印官方固定4至5人批量：3厂家杯米，先拌盐并补水至白米3水位线，牛肉末、胡萝卜泥、洋葱与黄油分层铺放不搅拌，使用什锦饭程序 | identity、quantity、appliance | complete | 内部校准合同尚未完成实厨试做，不得标为正式可见目录 | calibration_ready |
| 番茄海鲜饭 | 米、鱿鱼圈、虾仁、番茄、洋葱、混合蔬菜 | C | raw-rice | 页面只能证明菜名、4至5人批量和配料表；所示步骤转为糙米粥水位线、红枣与枸杞流程，与番茄海鲜饭矛盾，不可执行 | identity、quantity | partial | 页面步骤明显串页/损坏，与菜名和配料表矛盾；加液、水位线、程序和操作顺序全部 fail-closed；固定批量中的海鲜与蔬菜份量按本项目每份门槛不足，且白砂糖65g需额外营养/口味审查，只记C级证据原型；鱿鱼和虾仁的入锅时机、熟制终点、甲壳/软体过敏防线均未闭合 | research_candidate |

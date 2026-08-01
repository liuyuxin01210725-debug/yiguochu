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
| 南京矮脚黄板鸭菜饭 | 糯米、矮脚黄、熟板鸭、姜 | A | glutinous-rice | 糯米、菜和熟鸭焖制 | identity | identity_only | 无数量、液体和器具证据 | identity_only |
| 吴江香青菜咸肉饭 | 米、吴江青菜、咸肉 | A | raw-rice | 菜与咸肉配米蒸煮 | identity | identity_only | 无工艺数量 | identity_only |

## 浙江（CN-ZJ）

### seasonal-mixed-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 半山立夏野米饭 | 米、鸡蛋、韭菜 | B | raw-rice | 民俗铁锅炒煮 | identity | identity_only | 无数量和电饭煲适配 | research_candidate |

## 安徽（CN-AH）

### pot-crust-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 东至农家锅巴饭 | 香米、猪肉、芋头 | A | raw-rice | 电饭煲提及，后段成锅巴 | identity、quantity | partial | 水量“1.5瓶”含义不明；生肉后加安全未闭合 | research_candidate |

## 福建（CN-FJ）

### minnan-oil-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 泉州海味三层肉浥饭（油饭） | 米、五花肉、豆干、香菇、蚝/干贝 | A | raw-rice | 油葱、海味和肉同焖 | identity | identity_only | 无数量液体；海鲜过敏和盐分边界 | planned |

### minnan-salted-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 福建盖菜肉末咸饭 | 米、盖菜、洋葱、瘦猪肉 | A | raw-rice | 学校供餐配料比例，工艺未给 | identity、quantity、nutrition | partial | 无液体与器具工艺 | research_candidate |

## 台湾（CN-TW）

### taiwan-mixed-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 台湾高丽菜饭 | 米、高丽菜、虾米、香菇 | B | raw-rice | 电饭煲炊饭 | identity、quantity、liquid、appliance | partial | 量杯标准化和焯沥高丽菜水分契约未闭合 | planned |
| 台湾南瓜饭 | 米、南瓜、猪绞肉、虾米、香菇 | A | raw-rice | 电饭煲一次烹调，水为米量0.8倍 | identity、quantity、liquid、appliance | partial | 量杯标准化与二次烹调能力未闭合 | planned |

## 广东（CN-GD）

### cantonese-claypot-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 广州豆豉排骨煲仔饭 | 米、排骨、豆豉 | B | raw-rice | 砂锅后加排骨 | identity | identity_only | 后加排骨、盐分和液体未闭合 | research_candidate |
| 广州腊味煲仔饭 | 米、腊肉/腊肠 | B | raw-rice | 砂锅后加腊味并取锅巴 | identity | identity_only | 砂锅后加与通用电饭煲不等价 | research_candidate |
| 广州香菇滑鸡煲仔饭 | 米、鸡肉、香菇 | A | raw-rice | 煲仔饭后加生鸡肉 | identity | identity_only | 后加生鸡肉安全和器具等价未闭合 | research_candidate |

### manufacturer-mixed-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 香芋鸡煲仔饭（松下机型配方） | 米、鸡肉、芋头、虾米、香菇、木耳 | A | raw-rice | 指定压力IH机型水位线3烹调 | identity、quantity、appliance | partial | 仅命名机型适用 | planned |

## 海南（CN-HI）

显式空白地域：定安菜包饭为熟饭翻炒包裹，排除原米菜饭候选。

## 新疆（CN-XJ）

### xinjiang-pilaf

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 新疆羊肉抓饭（波劳） | 米、羊肉、胡萝卜、洋葱 | A | raw-rice | 羊肉胡萝卜炒香后与米焖熟 | identity、appliance | partial | 普通电饭煲的数量、液体闭合缺失 | planned |
| 新疆碎肉抓饭 | 米、羊肉、胡萝卜、鹰嘴豆 | A | raw-rice | 碎肉、菜、豆与米配餐 | identity、quantity、nutrition | partial | 无液体和工艺 | research_candidate |

## 陕西（CN-SN）

### household-reviewed-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 陕北红枣豇豆焖饭 | 米、豇豆、红枣 | A | raw-rice | 项目家庭审核，未进入 Preview | identity | partial | 仍待液体复核 | planned |

### northwest-meat-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 米脂羊肉丁丁饭 | 羊肉、米、黄花菜/金针菇 | B | raw-rice | 羊肉丁与米煮制 | identity | identity_only | 无数量、液体和份数 | research_candidate |

## 宁夏（CN-NX）

### northwest-meat-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 宁夏肉粘饭 | 米、牛/羊肉、洋葱、胡萝卜 | A | raw-rice | 炒肉菜后与米蒸焖 | identity | identity_only | 无数量与液体 | research_candidate |

## 四川（CN-SC）

### sichuan-kong-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 四川四季豆孔干饭 | 米、四季豆 | B | parboiled-drained-rice | 米先煮沥，再与四季豆焖干 | identity | identity_only | 预煮沥米与四季豆全熟终点；来源当前无法独立复核 | research_candidate |
| 四川豌豆孔干饭 | 米、豌豆 | B | parboiled-drained-rice | 米先煮沥，再与豌豆焖干 | identity | identity_only | 需预煮沥米协议；来源当前无法独立复核 | research_candidate |

## 重庆（CN-CQ）

### sichuan-kong-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 綦江洋芋腊肉箜饭 | 米、土豆、腊肉 | B | rice-state-unverified | 箜饭身份记录 | identity | identity_only | 无数量、液体和米态 | identity_only |

### wuling-she-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 酉州社饭 | 米、腊肉、豆干、野菜 | A | parboiled-rice | 米预煮、野菜和腊味多阶段合制 | identity | identity_only | 野菜控制和多阶段工艺 | research_candidate |

## 云南（CN-YN）

### yunnan-potato-rice

| 菜名 | 核心食材 | A/B/C | 米态 | 器具/步骤 | 证据状态 | 液体/用量完备度 | 阻断项 | 运行状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 施甸蚕豆火腿焖饭 | 米、火腿、蚕豆 | A | raw-rice | 焖饭身份记录 | identity | identity_only | 无工艺、数量和液体 | identity_only |
| 施甸豌豆洋芋火腿焖饭 | 米、土豆、火腿、鲜豌豆 | A | raw-rice | 米、洋芋、火腿、豆同焖 | identity | identity_only | 无数量和液体 | research_candidate |
| 腾冲北海铜锅洋芋饭 | 米、土豆、四季豆、腌肉 | A | raw-rice | 铜锅焖制 | identity | identity_only | 无数量液体且铜锅身份损失 | research_candidate |

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
| 鸡腿土豆焖饭 | 米、鸡腿、土豆 | B | raw-rice | 项目家庭标准闭盖烹调 | identity、quantity、liquid、appliance、safety、nutrition | complete | 无 | runtime_ready |
| 玉米胡萝卜鸡腿焖饭 | 米、鸡腿、胡萝卜、玉米 | A | raw-rice | 项目家庭标准闭盖烹调 | identity、quantity、liquid、appliance、safety、nutrition | complete | 无 | runtime_ready |
| 肉糜青菜饭 | 米、肉糜、青菜 | A | raw-rice | 项目家庭标准闭盖烹调 | identity、quantity、liquid、appliance、safety、nutrition | complete | 无 | runtime_ready |

<!-- Generated file: do not edit directly. -->

# 中国一锅主餐全国地域地图

来源：`tools/data/regional-atlas.v2.json`、`tools/data/regional-menu-mappings.v1.json`、`tools/data/recipe-library.json`、`tools/data/regional-menu-research.v1.json`。
由 `node tools/build-regional-atlas.mjs --write` 确定性生成。

> **边界：地域地图完成不等于地方菜谱均已验证。** `skeleton_only` 和 `discovery_only` 只表示研究位置，不代表事实核实、人工批准或生产可用。

## 摘要

- 地域板块：13
- 省级节点：34
- 技法家族：12
- 生产菜单审计：72
- 研究候选审计：24
- 生产地域范围：省级 28；跨地域 2；全国性家常 31；中国地图外 11
- 当前空白省级节点：15
- Planner 能力：full 2；partial 3；none 7

## 13 个地域板块

| 地域 | 省级节点 | 生产菜单 | 研究候选 | 覆盖状态 |
| --- | --- | ---: | ---: | --- |
| 东北（northeast） | CN-LN、CN-JL、CN-HL | 0 | 4 | research_only |
| 京津冀（jingjinji） | CN-BJ、CN-TJ、CN-HE | 1 | 4 | production_and_research |
| 晋蒙（jinmeng） | CN-SX、CN-NM | 3 | 4 | production_and_research |
| 山东（shandong） | CN-SD | 1 | 4 | production_and_research |
| 中原（central_plains） | CN-HA | 1 | 4 | production_and_research |
| 长江中游（middle_yangtze） | CN-HB、CN-HN、CN-JX | 0 | 0 | skeleton_only |
| 江南（jiangnan） | CN-SH、CN-JS、CN-ZJ、CN-AH | 8 | 0 | production_only |
| 闽台（fujian_taiwan） | CN-FJ、CN-TW | 6 | 0 | production_only |
| 岭南与港澳（lingnan_hk_macao） | CN-GD、CN-GX、CN-HI、CN-HK、CN-MO | 5 | 0 | production_only |
| 川渝（sichuan_chongqing） | CN-SC、CN-CQ | 0 | 4 | research_only |
| 云贵（yunnan_guizhou） | CN-YN、CN-GZ | 2 | 4 | production_and_research |
| 西北（northwest） | CN-SN、CN-GS、CN-NX、CN-XJ | 3 | 0 | production_only |
| 青藏（qinghai_tibet） | CN-QH、CN-XZ | 4 | 0 | production_only |

## 34 个省级节点

| 节点 | 地域 | 生产菜单 | 研究候选 | 状态 | 研究问题或暂缓理由 |
| --- | --- | ---: | ---: | --- | --- |
| 辽宁（CN-LN） | northeast | 0 | 0 | skeleton_only | 核实辽宁铁锅炖、沿海鱼锅与锅边主食中适合家庭一锅主餐的结构。 |
| 吉林（CN-JL） | northeast | 0 | 0 | skeleton_only | 核实吉林鸡肉菌菇炖锅、豆角锅与面团主食同锅的地方变种。 |
| 黑龙江（CN-HL） | northeast | 0 | 0 | skeleton_only | 核实黑龙江铁锅炖中排骨或鸡肉、土豆、豆角与锅边饼花卷的稳定结构。 |
| 北京（CN-BJ） | jingjinji | 0 | 0 | skeleton_only | 核实北京家庭菜粮同锅、大锅菜与焖面类主餐的可追溯原型。 |
| 天津（CN-TJ） | jingjinji | 0 | 0 | skeleton_only | 核实天津米饭、面食与蔬菜肉类同锅完成的家庭主餐原型。 |
| 河北（CN-HE） | jingjinji | 0 | 0 | skeleton_only | 核实河北焖面、饼卷菜锅及豆角肉类同锅主餐的地域结构。 |
| 山西（CN-SX） | jinmeng | 2 | 0 | production_only | 整理山西焖面、烀面、土豆饭与小米饭的技法和地域变种边界。 |
| 内蒙古（CN-NM） | jinmeng | 0 | 0 | skeleton_only | 核实内蒙古羊肉饭锅、杂粮饭及焖面类家庭一锅结构。 |
| 山东（CN-SD） | shandong | 0 | 4 | research_only | 核实山东白菜豆腐粉条、大锅菜、玉米面主食与胶东海鲜锅的主餐结构。 |
| 河南（CN-HA） | central_plains | 0 | 4 | research_only | 核实河南蒸面、卤面和烩面家庭单锅适配的面条含水与熟制边界。 |
| 湖北（CN-HB） | middle_yangtze | 0 | 0 | skeleton_only | 核实湖北豆丝、汤饭与腊味米饭同锅类主餐的地方原型。 |
| 湖南（CN-HN） | middle_yangtze | 0 | 0 | skeleton_only | 核实湖南社饭、腊味饭和家庭焖饭的地域技法与变种。 |
| 江西（CN-JX） | middle_yangtze | 0 | 0 | skeleton_only | 核实江西米粉、汤饭、腊味或豆类同锅主餐的家庭原型。 |
| 上海（CN-SH） | jiangnan | 2 | 0 | production_only | 整理上海咸肉菜饭、土灶菜饭与家庭锅适配的共享结构。 |
| 江苏（CN-JS） | jiangnan | 4 | 0 | production_only | 整理苏州与南京菜饭、咸肉香肠和鸭肉变种的同构关系。 |
| 浙江（CN-ZJ） | jiangnan | 1 | 0 | production_only | 核实浙江菜饭、豆饭、乌饭和器具适配类主餐的来源与结构。 |
| 安徽（CN-AH） | jiangnan | 0 | 0 | skeleton_only | 核实安徽菜饭、锅巴饭和咸肉蔬菜同锅主餐的地域原型。 |
| 福建（CN-FJ） | fujian_taiwan | 3 | 0 | production_only | 整理福建咸饭、油饭、扁豆饭和卤面的一锅技法与变种。 |
| 台湾（CN-TW） | fujian_taiwan | 2 | 0 | production_only | 整理台湾炊饭、油饭、客家糯米饭与家庭电饭锅适配边界。 |
| 广东（CN-GD） | lingnan_hk_macao | 3 | 0 | production_only | 整理广东煲仔饭、砂锅饭与腊味鸡肉排骨变种的共享技法。 |
| 广西（CN-GX） | lingnan_hk_macao | 1 | 0 | production_only | 核实广西糯米饭、菠萝饭与壮族家庭主餐的地域和技法边界。 |
| 海南（CN-HI） | lingnan_hk_macao | 1 | 0 | production_only | 核实海南菜包饭、椰香饭与家庭一锅适配的主食结构。 |
| 香港（CN-HK） | lingnan_hk_macao | 0 | 0 | skeleton_only | 核实香港煲仔饭及家庭砂锅主餐的地方变种与来源。 |
| 澳门（CN-MO） | lingnan_hk_macao | 0 | 0 | skeleton_only | 核实澳门砂锅饭和葡式影响下可归入家庭一锅主餐的地方原型。 |
| 四川（CN-SC） | sichuan_chongqing | 0 | 3 | research_only | 整理四川箜饭、洋芋饭、腊肉饭与家庭锅具适配的结构。 |
| 重庆（CN-CQ） | sichuan_chongqing | 0 | 1 | research_only | 核实重庆柴火洋芋饭及普通锅电饭锅适配时保留的核心身份。 |
| 云南（CN-YN） | yunnan_guizhou | 1 | 4 | production_and_research | 整理云南铜锅洋芋饭、菌菇饭、菠萝饭与器具替代边界。 |
| 贵州（CN-GZ） | yunnan_guizhou | 1 | 0 | production_only | 核实贵州社饭、糯米饭与洋芋或腊味同锅主餐的地方结构。 |
| 陕西（CN-SN） | northwest | 1 | 0 | production_only | 整理陕西陕北豆饭、杂粮焖饭和面片锅的地域技法。 |
| 甘肃（CN-GS） | northwest | 0 | 0 | skeleton_only | 核实甘肃面片、熬饭和杂粮饭的一锅主餐原型。 |
| 宁夏（CN-NX） | northwest | 0 | 0 | skeleton_only | 核实宁夏羊肉饭、回族主食锅与杂粮同锅结构。 |
| 新疆（CN-XJ） | northwest | 2 | 0 | production_only | 整理新疆抓饭中羊肉与素抓饭的共享比例、技法和替换边界。 |
| 青海（CN-QH） | qinghai_tibet | 1 | 0 | production_only | 整理青海熬饭、面片与青稞杂粮主餐的技法和家庭适配。 |
| 西藏（CN-XZ） | qinghai_tibet | 3 | 0 | production_only | 整理西藏咸稀饭、古突、人参果饭和青稞主餐的技法边界。 |

## 12 个技法家族

| 技法 | 主食状态 | 生产菜单 | 研究候选 | 状态 | 研究问题 |
| --- | --- | ---: | ---: | --- | --- |
| 生米菜肉同焖（raw-rice-braise） | 生米 | 27 | 8 | production_and_research | 建立生米、液体、含水蔬菜与蛋白同锅的可执行比例边界。 |
| 熟饭翻炒（cooked-rice-stir） | 剩米饭 | 5 | 0 | production_only | 建立剩米饭含水、打散与快速熟制配料的容量边界。 |
| 熟饭烩煮或汤饭（cooked-rice-stew） | 剩米饭 | 10 | 0 | production_only | 建立熟饭吸液与汤饭、烩饭浓度的机器规则。 |
| 生谷物加液体熬煮（grain-porridge） | 生米、小米、青稞、杂粮 | 3 | 0 | production_only | 区分谷物种类、浸泡状态与粥稀饭液体比例。 |
| 面菜同焖（noodle-braise） | 生面、半熟面 | 2 | 5 | production_and_research | 建立面条含水、铺面顺序和底菜液体的边界。 |
| 面菜蒸焖（noodle-steam-braise） | 生面、鲜面 | 0 | 4 | research_only | 建立蒸面回拌、二次蒸焖与单锅家庭化的结构。 |
| 汤面面片粉丝一锅（noodle-broth） | 面条、面片、米粉、粉丝 | 4 | 0 | production_only | 区分面、米粉和粉丝的入锅时间、吸液与耐煮性。 |
| 炖菜带锅边主食（stew-with-staple） | 玉米面团、小麦面团 | 0 | 5 | research_only | 建立炖菜液位、蒸汽空间、锅边饼花卷和粘卷子的分离规则。 |
| 煲仔或砂锅主食（claypot-rice） | 生米 | 3 | 0 | production_only | 建立砂锅受热、锅巴、加盖与肉类熟制的家庭边界。 |
| 糯米与杂粮同锅（glutinous-mixed-rice） | 糯米、混合米 | 5 | 0 | production_only | 建立浸泡、糯米吸水和杂粮混合比例。 |
| 特殊器具家庭化（vessel-adapted-rice） | 生米、糯米、杂粮 | 4 | 5 | production_and_research | 核实铜锅、叶包和果壳等器具变化后仍保留的核心身份。 |
| 大锅菜配吸汁主食（family-pot-with-absorbent-staple） | 粉条、粉丝、可验证主食 | 1 | 4 | production_and_research | 建立耐炖蔬菜、豆腐肉类和吸汁主食的先后与液体边界。 |

## Planner 能力覆盖矩阵

> 该矩阵是研究与运行能力审计，不等于菜谱批准或部署状态。

| 技法 | coverage | runtime templates | candidate templates | promotion status | 未覆盖主食状态 | blockers | 能力边界 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 生米菜肉同焖（raw-rice-braise） | full | savory-mixed-rice-pot | 无 | covered_by_active_template | 无 | 无 | 现有生米焖饭模板已覆盖受控生米、耐焖蔬菜与有限蛋白组合，不借模板名称伪造地域菜身份。 |
| 熟饭翻炒（cooked-rice-stir） | full | cooked-rice-stir-pot | 无 | covered_by_active_template | 无 | 无 | 熟饭翻炒按全国性家庭结构覆盖，不绑定不存在的单一地域。 |
| 熟饭烩煮或汤饭（cooked-rice-stew） | partial | acid-staple-pot | broth-rice-pot | blocked_by_ratio | 无 | ratio_rule_missing:broth-rice-liquid-v1 | 当前只覆盖有酸味底的熟饭烩煮，一般汤饭仍缺独立液体规则。 |
| 生谷物加液体熬煮（grain-porridge） | none | 无 | soft-family-rice-pot | blocked_by_ratio | 生米、小米、青稞、杂粮 | ratio_rule_missing:soft-family-rice-liquid-v1、taxonomy_missing:millet、taxonomy_missing:highland_barley、taxonomy_missing:mixed_grain | 粥类证据存在，但谷物身份、浸泡和逐类液体比例尚未形成可执行能力。 |
| 面菜同焖（noodle-braise） | partial | braised-noodle-pot | 无 | preview_candidate | 半熟面 | 无 | 当前可预览能力只覆盖生面焖制，半熟面不被静默并入同一吸液规则。 |
| 面菜蒸焖（noodle-steam-braise） | none | 无 | 无 | blocked_by_taxonomy | 生面、鲜面 | taxonomy_missing:steamed_noodle_state、template_missing:noodle-steam-braise | 河南蒸面研究题目已归位，但回拌与二次蒸焖所需面条状态仍未受控。 |
| 汤面面片粉丝一锅（noodle-broth） | partial | broth-noodle-pot | 无 | blocked_by_taxonomy | 面片、米粉、粉丝 | taxonomy_missing:noodle_sheet、taxonomy_missing:rice_noodle、taxonomy_missing:vermicelli | 运行时只覆盖普通面条，面片、米粉和粉丝需要独立吸液与入锅规则。 |
| 炖菜带锅边主食（stew-with-staple） | none | 无 | stew-with-staple-pot | blocked_by_ratio | 玉米面团、小麦面团 | ratio_rule_missing:stew-with-staple-liquid-v1 | 同锅炖菜带锅边主食的结构有据，但家庭液体、面团含水与蒸汽空间仍未机器化。 |
| 煲仔或砂锅主食（claypot-rice） | none | 无 | 无 | blocked_by_evidence | 生米 | evidence_missing:household_heat_boundary、evidence_missing:crust_safety_boundary | 已有煲仔饭 evidence，但普通家庭锅具下的受热、锅巴与肉类熟制边界尚未独立验证。 |
| 糯米与杂粮同锅（glutinous-mixed-rice） | none | 无 | 无 | blocked_by_ratio | 糯米、混合米 | ratio_rule_missing:glutinous-mixed-rice-liquid-v1、taxonomy_missing:glutinous_rice、taxonomy_missing:mixed_rice | 糯米与混合米已有菜谱证据，但原料身份、浸泡和吸水比例尚未形成 Planner 能力。 |
| 特殊器具家庭化（vessel-adapted-rice） | none | 无 | 无 | research_only | 生米、糯米、杂粮 | research_scope_unresolved:vessel_identity | 特殊器具家庭化后应保留的核心身份尚未收敛，因此只保留研究位置。 |
| 大锅菜配吸汁主食（family-pot-with-absorbent-staple） | none | 无 | 无 | blocked_by_taxonomy | 粉条、粉丝、可验证主食 | taxonomy_missing:vermicelli、taxonomy_missing:glass_noodle | 粉条和粉丝尚未具备受控吸液与耐煮语义，现有固定菜谱不能代替模板能力。 |

## 72 道生产菜单地域范围审计

`national_household` 表示全国性家常结构；`outside_cn_atlas` 表示菜单保留在产品库，但不伪造中国地域出处。

| 菜单 | 原菜系 | regional_scope | 地域 | 省级节点 | 主技法 | 来源数 |
| --- | --- | --- | --- | --- | --- | ---: |
| 半山野米饭风味平菇焖饭（banshan-wild-rice） | 杭州菜 | province_specific | jiangnan | CN-ZJ | raw-rice-braise | 1 |
| 基础意式烩饭（basic-risotto） | 意大利风味 | outside_cn_atlas | 无 | 无 | 不适用 | 1 |
| 西兰花牛肉焖饭（broccoli-beef-braised-rice） | 中式家常 | national_household | 无 | 无 | raw-rice-braise | 1 |
| 西兰花牛肉炒饭（broccoli-beef-fried-rice） | 中式家常 | national_household | 无 | 无 | cooked-rice-stir | 1 |
| 西兰花牛肉汤面（broccoli-beef-soup-noodles） | 中式家常 | national_household | 无 | 无 | noodle-broth | 1 |
| 青菜鸡蛋汤饭（cabbage-egg-soup-rice） | 中式家常 | national_household | 无 | 无 | cooked-rice-stew | 1 |
| 白菜土豆鸡腿焖面（cabbage-potato-chicken-leg-braised-noodles） | 中式家常 | national_household | 无 | 无 | noodle-braise | 1 |
| 白菜土豆排骨汤饭（cabbage-potato-pork-rib-soup-rice） | 中式家常 | national_household | 无 | 无 | cooked-rice-stew | 1 |
| 白菜豆腐焖饭（cabbage-tofu-braised-rice） | 中式家常 | national_household | 无 | 无 | raw-rice-braise | 1 |
| 广式豆豉排骨煲仔饭（cantonese-black-bean-pork-rib-claypot-rice） | 粤菜 | province_specific | lingnan_hk_macao | CN-GD | claypot-rice | 1 |
| 广式腊味煲仔饭（cantonese-cured-meat-claypot-rice） | 粤菜 | province_specific | lingnan_hk_macao | CN-GD | claypot-rice | 1 |
| 广式香菇滑鸡煲仔饭（cantonese-mushroom-chicken-claypot-rice） | 粤菜 | province_specific | lingnan_hk_macao | CN-GD | claypot-rice | 1 |
| 鸡肉黑眼豆番茄饭锅（chicken-black-eyed-pea-stew） | 香辣炖锅风味 | outside_cn_atlas | 无 | 无 | 不适用 | 1 |
| 鸡腿香菇土豆烩饭（chicken-leg-mushroom-stewed-rice） | 中式家常 | national_household | 无 | 无 | cooked-rice-stew | 1 |
| 鸡腿土豆焖饭（chicken-leg-potato-braised-rice） | 中式家常 | national_household | 无 | 无 | raw-rice-braise | 1 |
| 中式基础粥（chinese-congee） | 中式 | national_household | 无 | 无 | grain-porridge | 1 |
| 玉米土豆鸡腿饭锅（corn-carrot-chicken-leg-covered-rice） | 中式家常 | national_household | 无 | 无 | raw-rice-braise | 1 |
| 克里奥尔番茄鸡肉什锦饭（creole-jambalaya） | 美国路易斯安那风味 | outside_cn_atlas | 无 | 无 | 不适用 | 1 |
| 傣族菠萝紫米饭（dai-pineapple-purple-rice） | 傣族饮食 | province_specific | yunnan_guizhou | CN-YN | vessel-adapted-rice | 1 |
| 大溪荷叶油饭（daxi-lotus-leaf-oil-rice） | 台湾客家 | province_specific | fujian_taiwan | CN-TW | vessel-adapted-rice | 1 |
| 福建盖菜肉末咸饭（fujian-gai-cai-minced-pork-rice） | 闽菜 | province_specific | fujian_taiwan | CN-FJ | raw-rice-braise | 1 |
| 福建扁豆饭（fujian-hyacinth-bean-rice） | 闽菜 | province_specific | fujian_taiwan | CN-FJ | raw-rice-braise | 1 |
| 豆角排骨焖饭（green-bean-pork-rib-braised-rice） | 中式家常 | national_household | 无 | 无 | raw-rice-braise | 1 |
| 青菜鸡腿汤面（greens-chicken-leg-soup-noodles） | 中式家常 | national_household | 无 | 无 | noodle-broth | 1 |
| 青菜鸡蛋焖剩饭（greens-egg-braised-leftover-rice） | 中式家常 | national_household | 无 | 无 | cooked-rice-stew | 1 |
| 青菜肉末焖饭（greens-minced-pork-braised-rice） | 中式家常 | national_household | 无 | 无 | raw-rice-braise | 1 |
| 青菜香肠炒饭（greens-sausage-fried-rice） | 中式家常 | national_household | 无 | 无 | cooked-rice-stir | 1 |
| 青菜豆腐炒饭（greens-tofu-fried-rice） | 中式家常 | national_household | 无 | 无 | cooked-rice-stir | 1 |
| 青菜豆腐汤面（greens-tofu-soup-noodles） | 中式家常 | national_household | 无 | 无 | noodle-broth | 1 |
| 青菜豆腐粉丝煲（greens-tofu-vermicelli-pot） | 中式家常 | national_household | 无 | 无 | family-pot-with-absorbent-staple | 1 |
| 广西壮族五色糯米饭（guangxi-five-color-glutinous-rice） | 壮族饮食 | province_specific | lingnan_hk_macao | CN-GX | glutinous-mixed-rice | 1 |
| 侗家社饭风味家庭适配版（guizhou-dong-community-rice） | 侗族饮食 | province_specific | yunnan_guizhou | CN-GZ | raw-rice-braise | 1 |
| 海南定安菜包饭（hainan-cai-bao-rice） | 海南菜 | province_specific | lingnan_hk_macao | CN-HI | vessel-adapted-rice | 1 |
| 家常鸡蛋炒剩饭（home-egg-fried-leftover-rice） | 中式家常 | national_household | 无 | 无 | cooked-rice-stir | 1 |
| 金山土灶菜饭（jinshan-clay-oven-vegetable-rice） | 上海本帮 | province_specific | jiangnan | CN-SH | raw-rice-braise | 1 |
| 西非番茄香料饭（jollof-rice） | 西非风味 | outside_cn_atlas | 无 | 无 | 不适用 | 1 |
| 印尼椰香鸡肉咖喱（kari-ayam-coconut-chicken） | 印尼风味 | outside_cn_atlas | 无 | 无 | 不适用 | 1 |
| 扁豆土豆番茄咖喱（lentil-potato-tomato-curry） | 印度风味 | outside_cn_atlas | 无 | 无 | 不适用 | 1 |
| 香菇鸡蛋焖剩饭（mushroom-egg-covered-leftover-rice） | 中式家常 | national_household | 无 | 无 | cooked-rice-stew | 1 |
| 香菇豆角排骨焖饭（mushroom-green-bean-pork-rib-braised-rice） | 中式家常 | national_household | 无 | 无 | raw-rice-braise | 1 |
| 香菇青菜豆腐饭锅（mushroom-greens-tofu-covered-rice） | 中式家常 | national_household | 无 | 无 | raw-rice-braise | 1 |
| 南京矮脚黄腊肉菜饭（nanjing-cured-pork-greens-rice） | 南京菜 | province_specific | jiangnan | CN-JS | raw-rice-braise | 1 |
| 南京矮脚黄板鸭菜饭（nanjing-duck-greens-rice） | 南京菜 | province_specific | jiangnan | CN-JS | raw-rice-braise | 1 |
| 南京矮脚黄香肠菜饭（nanjing-sausage-greens-rice） | 南京菜 | province_specific | jiangnan | CN-JS | raw-rice-braise | 1 |
| 北方豆角焖面（north-china-green-bean-braised-noodles） | 北方家常 | cross_regional_chinese | jingjinji、jinmeng、shandong、central_plains | 无 | noodle-braise | 1 |
| 土豆西兰花牛肉饭锅（potato-broccoli-beef-covered-rice） | 中式家常 | national_household | 无 | 无 | raw-rice-braise | 1 |
| 土豆排骨烩饭（potato-pork-rib-stewed-rice） | 中式家常 | national_household | 无 | 无 | cooked-rice-stew | 1 |
| 青海熬饭风味家庭适配版（qinghai-hao-fan） | 河湟饮食 | province_specific | qinghai_tibet | CN-QH | grain-porridge | 1 |
| 泉州浥饭（油饭）（quanzhou-oil-rice） | 闽南 | province_specific | fujian_taiwan | CN-FJ | glutinous-mixed-rice | 1 |
| 米粒卷心菜杂蔬汤（rice-cabbage-minestrone） | 意大利风味 | outside_cn_atlas | 无 | 无 | 不适用 | 1 |
| 陕北红枣豇豆焖饭（shaanbei-red-date-cowpea-rice） | 陕北菜 | province_specific | northwest | CN-SN | raw-rice-braise | 1 |
| 番茄甜椒炖蛋（shakshuka-tomato-egg） | 中东风味 | outside_cn_atlas | 无 | 无 | 不适用 | 1 |
| 上海奉贤咸肉菜饭（shanghai-salted-pork-vegetable-rice） | 上海本帮 | province_specific | jiangnan | CN-SH | raw-rice-braise | 1 |
| 山西泥屯小米饭（shanxi-nitun-millet-rice） | 晋菜 | province_specific | jinmeng | CN-SX | raw-rice-braise | 1 |
| 山西岚县土豆饭（shanxi-potato-rice） | 晋菜 | province_specific | jinmeng | CN-SX | raw-rice-braise | 1 |
| 畲族乌饭风味家庭适配版（she-people-black-rice） | 畲族饮食 | cross_regional_chinese | jiangnan、fujian_taiwan | 无 | glutinous-mixed-rice | 1 |
| 虾仁鸡蛋炒剩饭（shrimp-egg-fried-leftover-rice） | 中式家常 | national_household | 无 | 无 | cooked-rice-stir | 1 |
| 简化一锅鸡肉香料饭（simple-chicken-biryani） | 南亚风味 | outside_cn_atlas | 无 | 无 | 不适用 | 1 |
| 大豆扁豆西兰花炖锅（soy-lentil-vegetable-stew） | 家常纯素炖锅 | outside_cn_atlas | 无 | 无 | 不适用 | 1 |
| 苏州青菜咸肉饭（suzhou-salted-pork-vegetable-rice） | 苏帮 | province_specific | jiangnan | CN-JS | raw-rice-braise | 1 |
| 高丽菜香菇炊饭（taiwan-cabbage-mushroom-rice） | 台湾家常 | province_specific | fujian_taiwan | CN-TW | raw-rice-braise | 1 |
| 德州风味牛肉辣炖锅（texas-beef-chili） | 美国德州风味 | outside_cn_atlas | 无 | 无 | 不适用 | 1 |
| 西藏人参果饭（tibetan-ginseng-fruit-rice） | 藏族饮食 | province_specific | qinghai_tibet | CN-XZ | raw-rice-braise | 1 |
| 古突风味家庭适配版（tibetan-gutu） | 藏族饮食 | province_specific | qinghai_tibet | CN-XZ | noodle-broth | 1 |
| 藏式咸稀饭风味家庭适配版（tibetan-savory-congee） | 藏族饮食 | province_specific | qinghai_tibet | CN-XZ | grain-porridge | 1 |
| 番茄西兰花牛肉烩饭（tomato-broccoli-beef-stewed-rice） | 中式家常 | national_household | 无 | 无 | cooked-rice-stew | 1 |
| 番茄鸡腿土豆汤饭（tomato-chicken-leg-soup-rice） | 中式家常 | national_household | 无 | 无 | cooked-rice-stew | 1 |
| 番茄鸡蛋烩剩饭（tomato-egg-stewed-leftover-rice） | 中式家常 | national_household | 无 | 无 | cooked-rice-stew | 1 |
| 番茄土豆排骨饭锅（tomato-potato-pork-rib-covered-rice） | 中式家常 | national_household | 无 | 无 | raw-rice-braise | 1 |
| 番茄青菜豆腐烩饭（tomato-tofu-stewed-rice） | 中式家常 | national_household | 无 | 无 | cooked-rice-stew | 1 |
| 新疆羊肉抓饭（xinjiang-lamb-pilaf） | 新疆菜 | province_specific | northwest | CN-XJ | raw-rice-braise | 1 |
| 新疆素抓饭（xinjiang-vegetable-pilaf） | 新疆菜 | province_specific | northwest | CN-XJ | raw-rice-braise | 1 |

## 24 条地域研究候选

以下条目仍是研究候选。`discovery_only` 不等于 `fact_checked`，也不等于生产菜谱。

| 研究题目 | source_confidence | 地域范围 | 地域 | 省级节点 | 主技法 | pantry 缺口 |
| --- | --- | --- | --- | --- | --- | --- |
| 柴火洋芋饭家庭版（chongqing-firewood-potato-rice-home） | discovery_only | province_specific | sichuan_chongqing | CN-CQ | raw-rice-braise | 土豆 |
| 豆角猪肉蒸面（henan-bean-pork-steamed-noodles） | discovery_only | province_specific | central_plains | CN-HA | noodle-steam-braise | 豆角、猪肉 |
| 卷心菜菌菇蒸面（henan-cabbage-mushroom-steamed-noodles） | discovery_only | province_specific | central_plains | CN-HA | noodle-steam-braise | 卷心菜、菌菇 |
| 芹菜猪肉蒸面（henan-celery-pork-steamed-noodles） | discovery_only | province_specific | central_plains | CN-HA | noodle-steam-braise | 芹菜、猪肉 |
| 家庭单锅蒸焖面（henan-home-one-pot-steamed-braised-noodles） | discovery_only | province_specific | central_plains | CN-HA | noodle-steam-braise | 耐蒸蔬菜、可选蛋白 |
| 卷心菜猪肉焖面（north-cabbage-pork-braised-noodles） | discovery_only | cross_regional_chinese | jingjinji、jinmeng | 无 | noodle-braise | 卷心菜、猪肉 |
| 菌菇时蔬焖面（north-mushroom-vegetable-braised-noodles） | discovery_only | cross_regional_chinese | jingjinji、jinmeng | 无 | noodle-braise | 菌菇、时蔬 |
| 豆角猪肉焖面（north-pork-bean-braised-noodles） | discovery_only | cross_regional_chinese | jingjinji、jinmeng | 无 | noodle-braise | 猪肉、豆角 |
| 土豆豆角焖面（north-potato-bean-braised-noodles） | discovery_only | cross_regional_chinese | jingjinji、jinmeng | 无 | noodle-braise | 土豆、豆角 |
| 鸡肉蘑菇土豆配锅边饼（northeast-chicken-mushroom-potato-corn-cake） | discovery_only | cross_regional_chinese | northeast | 无 | stew-with-staple | 鸡肉、蘑菇、土豆 |
| 鱼豆腐蔬菜锅配玉米饼（northeast-fish-tofu-vegetable-corn-cake） | discovery_only | cross_regional_chinese | northeast | 无 | stew-with-staple | 鱼、豆腐、耐炖蔬菜 |
| 排骨豆角配锅边饼（northeast-ribs-beans-corn-cake） | discovery_only | cross_regional_chinese | northeast | 无 | stew-with-staple | 排骨、豆角 |
| 排骨豆角粘卷子（northeast-ribs-beans-sticky-rolls） | discovery_only | cross_regional_chinese | northeast | 无 | stew-with-staple | 排骨、豆角 |
| 白菜豆腐粉条大锅主餐（shandong-cabbage-tofu-vermicelli-pot） | discovery_only | province_specific | shandong | CN-SD | family-pot-with-absorbent-staple | 白菜、豆腐 |
| 胶东海鲜主食锅（shandong-seafood-staple-pot） | discovery_only | province_specific | shandong | CN-SD | family-pot-with-absorbent-staple | 海鲜、蔬菜 |
| 鲁西南家常大锅路线（shandong-southwest-family-pot） | discovery_only | province_specific | shandong | CN-SD | family-pot-with-absorbent-staple | 白菜、豆腐、猪肉或粉条 |
| 蔬菜与玉米面主食同锅（shandong-vegetable-cornmeal-one-pot） | discovery_only | province_specific | shandong | CN-SD | family-pot-with-absorbent-staple | 耐煮蔬菜 |
| 豆类洋芋饭（sichuan-bean-potato-rice） | discovery_only | province_specific | sichuan_chongqing | CN-SC | raw-rice-braise | 豆类、土豆 |
| 玉米洋芋饭（sichuan-corn-potato-rice） | discovery_only | province_specific | sichuan_chongqing | CN-SC | raw-rice-braise | 玉米、土豆 |
| 腊肉洋芋饭（sichuan-salted-pork-potato-rice） | discovery_only | province_specific | sichuan_chongqing | CN-SC | raw-rice-braise | 腊肉、土豆 |
| 铜锅洋芋饭家庭版（yunnan-copper-pot-potato-rice-home） | discovery_only | province_specific | yunnan_guizhou | CN-YN | vessel-adapted-rice | 土豆 |
| 玉米鸡肉饭（yunnan-corn-chicken-rice） | discovery_only | province_specific | yunnan_guizhou | CN-YN | vessel-adapted-rice | 玉米、鸡肉 |
| 火腿风味可替换饭锅（yunnan-ham-flavor-rice-pot） | discovery_only | province_specific | yunnan_guizhou | CN-YN | vessel-adapted-rice | 火腿风味位、蔬菜 |
| 菌菇洋芋饭（yunnan-mushroom-potato-rice） | discovery_only | province_specific | yunnan_guizhou | CN-YN | vessel-adapted-rice | 菌菇、土豆 |

## Pantry 食材缺口（研究原词）

该表只统计研究账本中的原词，不做同义词合并，也不修改 ingredient taxonomy。

| 食材原词 | 候选数 | 研究候选 IDs |
| --- | ---: | --- |
| 土豆 | 8 | chongqing-firewood-potato-rice-home、north-potato-bean-braised-noodles、northeast-chicken-mushroom-potato-corn-cake、sichuan-bean-potato-rice、sichuan-corn-potato-rice、sichuan-salted-pork-potato-rice、yunnan-copper-pot-potato-rice-home、yunnan-mushroom-potato-rice |
| 豆角 | 5 | henan-bean-pork-steamed-noodles、north-pork-bean-braised-noodles、north-potato-bean-braised-noodles、northeast-ribs-beans-corn-cake、northeast-ribs-beans-sticky-rolls |
| 猪肉 | 4 | henan-bean-pork-steamed-noodles、henan-celery-pork-steamed-noodles、north-cabbage-pork-braised-noodles、north-pork-bean-braised-noodles |
| 豆腐 | 3 | northeast-fish-tofu-vegetable-corn-cake、shandong-cabbage-tofu-vermicelli-pot、shandong-southwest-family-pot |
| 菌菇 | 3 | henan-cabbage-mushroom-steamed-noodles、north-mushroom-vegetable-braised-noodles、yunnan-mushroom-potato-rice |
| 白菜 | 2 | shandong-cabbage-tofu-vermicelli-pot、shandong-southwest-family-pot |
| 鸡肉 | 2 | northeast-chicken-mushroom-potato-corn-cake、yunnan-corn-chicken-rice |
| 卷心菜 | 2 | henan-cabbage-mushroom-steamed-noodles、north-cabbage-pork-braised-noodles |
| 排骨 | 2 | northeast-ribs-beans-corn-cake、northeast-ribs-beans-sticky-rolls |
| 蔬菜 | 2 | shandong-seafood-staple-pot、yunnan-ham-flavor-rice-pot |
| 玉米 | 2 | sichuan-corn-potato-rice、yunnan-corn-chicken-rice |
| 豆类 | 1 | sichuan-bean-potato-rice |
| 海鲜 | 1 | shandong-seafood-staple-pot |
| 火腿风味位 | 1 | yunnan-ham-flavor-rice-pot |
| 可选蛋白 | 1 | henan-home-one-pot-steamed-braised-noodles |
| 腊肉 | 1 | sichuan-salted-pork-potato-rice |
| 蘑菇 | 1 | northeast-chicken-mushroom-potato-corn-cake |
| 耐炖蔬菜 | 1 | northeast-fish-tofu-vegetable-corn-cake |
| 耐蒸蔬菜 | 1 | henan-home-one-pot-steamed-braised-noodles |
| 耐煮蔬菜 | 1 | shandong-vegetable-cornmeal-one-pot |
| 芹菜 | 1 | henan-celery-pork-steamed-noodles |
| 时蔬 | 1 | north-mushroom-vegetable-braised-noodles |
| 鱼 | 1 | northeast-fish-tofu-vegetable-corn-cake |
| 猪肉或粉条 | 1 | shandong-southwest-family-pot |

## 来源状态

- 生产菜单有来源记录：72
- 生产菜单无来源记录：0
- 研究候选 discovery_only：24
- 研究候选 fact_checked：0
- 研究候选其他状态：0

## 民族与文化研究覆盖层

覆盖层只指向研究节点，不复制菜谱原型，也不声称穷尽分布。

| 覆盖层 | 研究省级节点 | 状态 | 研究问题 |
| --- | --- | --- | --- |
| 蒙古族饮食研究层（mongol） | CN-NM、CN-LN、CN-JL | skeleton_only | 核实蒙古族羊肉、奶食与杂粮主餐中适合家庭一锅结构的地域差异。 |
| 回族饮食研究层（hui） | CN-NX、CN-GS、CN-QH、CN-XJ | skeleton_only | 核实回族羊肉饭、面食锅和杂粮主餐的清真边界及地域变种。 |
| 藏族饮食研究层（tibetan） | CN-XZ、CN-QH、CN-SC、CN-GS、CN-YN | skeleton_only | 核实藏族青稞、谷物粥饭与面食汤的跨地域变种。 |
| 维吾尔族饮食研究层（uyghur） | CN-XJ | skeleton_only | 核实抓饭及羊肉蔬菜同锅结构的地方变种和家庭比例。 |
| 壮族饮食研究层（zhuang） | CN-GX、CN-YN | skeleton_only | 核实壮族糯米、五色饭和菠萝饭的地域与家庭适配边界。 |
| 苗族饮食研究层（miao） | CN-GZ、CN-HN、CN-YN、CN-GX、CN-HB | skeleton_only | 核实苗族糯米、酸味和腊味主餐中可归入一锅结构的原型。 |
| 侗族饮食研究层（dong） | CN-GZ、CN-HN、CN-GX | skeleton_only | 核实侗家社饭、糯米主餐和地域配料变种。 |
| 傣族饮食研究层（dai） | CN-YN | skeleton_only | 核实傣族菠萝饭、竹筒或叶包主食的器具与家庭适配。 |
| 畲族饮食研究层（she） | CN-FJ、CN-ZJ、CN-JX、CN-AH、CN-GD | skeleton_only | 核实畲族乌饭的跨省地域、着色原料与家庭版身份边界。 |
| 客家饮食研究层（hakka） | CN-GD、CN-FJ、CN-JX、CN-TW、CN-HK | skeleton_only | 核实客家油饭、咸饭与叶包糯米主餐的跨地域变种。 |

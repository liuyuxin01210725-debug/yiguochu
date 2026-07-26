<!-- Generated file: do not edit directly. -->

# 菜单与 Planner 实际覆盖审计

> Planner 覆盖审计不等于菜谱复刻、口味验证或人工试做批准。

本报告把现有 72 道 recipe 的原始核心食材，原样送入当前 Planner V2 的确定性纯函数。它只回答当前 taxonomy、template 与 Ratio DSL 能否识别和规划这些食材；不会用菜名猜食材，也不会把模板兼容写成地方菜复刻。

- Planner：`pantry-planner-v2`
- Template catalog：`templates-v2-20260727-r3`
- Taxonomy：`taxonomy-v1-20260727-r2`
- Ratio catalog：`ratio-rules-v1-20260727-r2`
- 菜单：72（approved：12；auto_approved：60）
- 模型与网络调用：0

## 审计状态

| 状态 | 数量 |
| --- | ---: |
| full_single_pot_evidence_aligned | 6 |
| full_single_pot_ingredient_compatible | 17 |
| full_multi_pot | 1 |
| taxonomy_gap | 38 |
| planner_gap | 5 |
| no_recognized_core | 5 |
| invalid_source_record | 0 |

## 优先级

| 优先级 | 数量 |
| --- | ---: |
| P0 | 5 |
| P1 | 43 |
| P2 | 1 |
| P3 | 17 |
| covered | 6 |

### P0/P1/P2 机器事实

| 优先级 | 菜单 | 技法家族 | 原始核心食材 | 主状态 | gap codes | 已识别能力状态 | 实际端到端状态 | 锅数 |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: |
| P1 | 西非番茄香料饭 | 无中国地域技法映射 | 大米、番茄、甜椒、洋葱 | taxonomy_gap | taxonomy_gap | complete | needs_user_decision | 2 |
| P1 | 克里奥尔番茄鸡肉什锦饭 | 无中国地域技法映射 | 大米、番茄、鸡肉、芹菜 | taxonomy_gap | taxonomy_gap | complete | needs_user_decision | 2 |
| P1 | 大豆扁豆西兰花炖锅 | 无中国地域技法映射 | 红扁豆、大豆蛋白块、西兰花、红洋葱 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P1 | 鸡肉黑眼豆番茄饭锅 | 无中国地域技法映射 | 黑眼豆（罐头沥干）、大米、鸡肉、番茄、洋葱 | taxonomy_gap | taxonomy_gap | complete | needs_user_decision | 2 |
| P1 | 扁豆土豆番茄咖喱 | 无中国地域技法映射 | 红扁豆、土豆、番茄 | taxonomy_gap | taxonomy_gap | complete | needs_user_decision | 1 |
| P1 | 番茄甜椒炖蛋 | 无中国地域技法映射 | 鸡蛋、番茄、甜椒 | taxonomy_gap | taxonomy_gap | complete | needs_user_decision | 1 |
| P0 | 德州风味牛肉辣炖锅 | 无中国地域技法映射 | 牛肉（粗绞）、干辣椒 | no_recognized_core | no_recognized_core、taxonomy_gap、planner_gap | no_valid_plan | no_valid_plan | 0 |
| P1 | 印尼椰香鸡肉咖喱 | 无中国地域技法映射 | 鸡肉、椰奶、红葱头 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P1 | 基础意式烩饭 | 无中国地域技法映射 | 意式烩饭米、洋葱、高汤、黄油 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P1 | 米粒卷心菜杂蔬汤 | 无中国地域技法映射 | 大米、卷心菜、高汤 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P1 | 上海奉贤咸肉菜饭 | raw-rice-braise | 大米、咸五花肉、小白菜 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P1 | 苏州青菜咸肉饭 | raw-rice-braise | 大米、咸五花肉、小白菜 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P1 | 南京矮脚黄腊肉菜饭 | raw-rice-braise | 大米、腊五花肉、矮脚黄 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P1 | 南京矮脚黄香肠菜饭 | raw-rice-braise | 大米、广式腊肠、矮脚黄 | taxonomy_gap | taxonomy_gap | complete | needs_user_decision | 1 |
| P1 | 南京矮脚黄板鸭菜饭 | raw-rice-braise | 大米、包装熟制板鸭（去骨）、矮脚黄 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P1 | 金山土灶菜饭 | raw-rice-braise | 大米、小白菜 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P1 | 高丽菜香菇炊饭 | raw-rice-braise | 大米、卷心菜、鲜香菇 | taxonomy_gap | taxonomy_gap | complete | needs_user_decision | 1 |
| P1 | 泉州浥饭（油饭） | glutinous-mixed-rice | 泡发糯米、猪肉末、鲜香菇 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P1 | 福建盖菜肉末咸饭 | raw-rice-braise | 大米、芥菜、猪肉末 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P1 | 福建扁豆饭 | raw-rice-braise | 大米、扁豆 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P1 | 海南定安菜包饭 | vessel-adapted-rice | 大米、生菜、胡萝卜 | taxonomy_gap | taxonomy_gap | complete | needs_user_decision | 1 |
| P0 | 大溪荷叶油饭 | vessel-adapted-rice | 糯米、猪肉末、食品级干荷叶 | no_recognized_core | no_recognized_core、taxonomy_gap、planner_gap | no_valid_plan | no_valid_plan | 0 |
| P1 | 广式腊味煲仔饭 | claypot-rice | 大米、广式腊肠、菜心 | taxonomy_gap | taxonomy_gap | complete | needs_user_decision | 1 |
| P1 | 广式香菇滑鸡煲仔饭 | claypot-rice | 大米、去皮鸡腿肉、鲜香菇 | taxonomy_gap | taxonomy_gap | complete | needs_user_decision | 1 |
| P1 | 广式豆豉排骨煲仔饭 | claypot-rice | 大米、猪肋排、豆豉 | taxonomy_gap | taxonomy_gap、planner_gap | no_valid_plan | no_valid_plan | 0 |
| P1 | 新疆羊肉抓饭 | raw-rice-braise | 羊腿肉、洋葱、胡萝卜、大米 | taxonomy_gap | taxonomy_gap | complete | needs_user_decision | 1 |
| P1 | 陕北红枣豇豆焖饭 | raw-rice-braise | 大米、去核红枣、豇豆 | taxonomy_gap | taxonomy_gap | complete | needs_user_decision | 1 |
| P1 | 青海熬饭风味家庭适配版 | grain-porridge | 小米、土豆、熟鹰嘴豆 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P1 | 山西泥屯小米饭 | raw-rice-braise | 小米、土豆 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P1 | 藏式咸稀饭风味家庭适配版 | grain-porridge | 大米、牛奶 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P1 | 古突风味家庭适配版 | noodle-broth | 小麦面团、小白菜、水 | taxonomy_gap | taxonomy_gap、planner_gap | no_valid_plan | no_valid_plan | 0 |
| P1 | 西藏人参果饭 | raw-rice-braise | 食品级蕨麻、大米 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P0 | 广西壮族五色糯米饭 | glutinous-mixed-rice | 糯米、食品级紫薯粉、食品级甜菜粉、食品级菠菜粉、食品级南瓜粉 | no_recognized_core | no_recognized_core、taxonomy_gap、planner_gap | no_valid_plan | no_valid_plan | 0 |
| P0 | 畲族乌饭风味家庭适配版 | glutinous-mixed-rice | 糯米、食品级黑米色粉 | no_recognized_core | no_recognized_core、taxonomy_gap、planner_gap | no_valid_plan | no_valid_plan | 0 |
| P1 | 半山野米饭风味平菇焖饭 | raw-rice-braise | 大米、平菇 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P0 | 傣族菠萝紫米饭 | vessel-adapted-rice | 紫米、菠萝 | no_recognized_core | no_recognized_core、taxonomy_gap、planner_gap | no_valid_plan | no_valid_plan | 0 |
| P1 | 侗家社饭风味家庭适配版 | raw-rice-braise | 大米、腊五花肉、姜、小白菜 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P1 | 北方豆角焖面 | noodle-braise | 鲜小麦面条、豆角、猪肉末 | taxonomy_gap | taxonomy_gap | complete | no_valid_plan | 0 |
| P1 | 虾仁鸡蛋炒剩饭 | cooked-rice-stir | 熟米饭、虾仁、鸡蛋 | taxonomy_gap | taxonomy_gap | complete | needs_user_decision | 1 |
| P2 | 番茄鸡腿土豆汤饭 | cooked-rice-stew | 熟米饭、鸡腿肉、番茄 | full_multi_pot | 无 | complete | complete | 2 |
| P1 | 玉米土豆鸡腿饭锅 | raw-rice-braise | 大米、鸡腿肉、玉米、胡萝卜 | taxonomy_gap | taxonomy_gap | complete | needs_user_decision | 1 |
| P1 | 青菜香肠炒饭 | cooked-rice-stir | 熟米饭、青菜、香肠 | taxonomy_gap | taxonomy_gap | complete | needs_user_decision | 1 |
| P1 | 青菜肉末焖饭 | raw-rice-braise | 大米、青菜、猪肉末 | taxonomy_gap | taxonomy_gap | complete | needs_user_decision | 1 |
| P1 | 青菜豆腐粉丝煲 | family-pot-with-absorbent-staple | 粉丝、青菜、老豆腐 | taxonomy_gap | taxonomy_gap | complete | needs_user_decision | 1 |
| P1 | 豆角排骨焖饭 | raw-rice-braise | 大米、猪肋排、豆角 | planner_gap | planner_gap | needs_user_decision | needs_user_decision | 1 |
| P1 | 土豆排骨烩饭 | cooked-rice-stew | 熟米饭、猪肋排、土豆 | planner_gap | planner_gap | needs_user_decision | needs_user_decision | 1 |
| P1 | 番茄土豆排骨饭锅 | raw-rice-braise | 大米、猪肋排、番茄、土豆 | planner_gap | planner_gap | needs_user_decision | needs_user_decision | 1 |
| P1 | 香菇豆角排骨焖饭 | raw-rice-braise | 大米、猪肋排、鲜香菇、豆角 | planner_gap | planner_gap | needs_user_decision | needs_user_decision | 1 |
| P1 | 白菜土豆排骨汤饭 | cooked-rice-stew | 熟米饭、猪肋排、白菜、土豆 | planner_gap | planner_gap | needs_user_decision | needs_user_decision | 1 |

本节只陈列缺口，不自动给出“应激活哪个模板”的结论。

## 未识别核心食材

| 原词 | 涉及菜单数 | 菜单 ID |
| --- | ---: | --- |
| 小白菜 | 5 | guizhou-dong-community-rice、jinshan-clay-oven-vegetable-rice、shanghai-salted-pork-vegetable-rice、suzhou-salted-pork-vegetable-rice、tibetan-gutu |
| 猪肉末 | 5 | daxi-lotus-leaf-oil-rice、fujian-gai-cai-minced-pork-rice、greens-minced-pork-braised-rice、north-china-green-bean-braised-noodles、quanzhou-oil-rice |
| 矮脚黄 | 3 | nanjing-cured-pork-greens-rice、nanjing-duck-greens-rice、nanjing-sausage-greens-rice |
| 糯米 | 3 | daxi-lotus-leaf-oil-rice、guangxi-five-color-glutinous-rice、she-people-black-rice |
| 高汤 | 2 | basic-risotto、rice-cabbage-minestrone |
| 红扁豆 | 2 | lentil-potato-tomato-curry、soy-lentil-vegetable-stew |
| 卷心菜 | 2 | rice-cabbage-minestrone、taiwan-cabbage-mushroom-rice |
| 腊五花肉 | 2 | guizhou-dong-community-rice、nanjing-cured-pork-greens-rice |
| 甜椒 | 2 | jollof-rice、shakshuka-tomato-egg |
| 咸五花肉 | 2 | shanghai-salted-pork-vegetable-rice、suzhou-salted-pork-vegetable-rice |
| 小米 | 2 | qinghai-hao-fan、shanxi-nitun-millet-rice |
| 包装熟制板鸭（去骨） | 1 | nanjing-duck-greens-rice |
| 扁豆 | 1 | fujian-hyacinth-bean-rice |
| 菠萝 | 1 | dai-pineapple-purple-rice |
| 菜心 | 1 | cantonese-cured-meat-claypot-rice |
| 大豆蛋白块 | 1 | soy-lentil-vegetable-stew |
| 豆豉 | 1 | cantonese-black-bean-pork-rib-claypot-rice |
| 粉丝 | 1 | greens-tofu-vermicelli-pot |
| 干辣椒 | 1 | texas-beef-chili |
| 黑眼豆（罐头沥干） | 1 | chicken-black-eyed-pea-stew |
| 红葱头 | 1 | kari-ayam-coconut-chicken |
| 红洋葱 | 1 | soy-lentil-vegetable-stew |
| 黄油 | 1 | basic-risotto |
| 姜 | 1 | guizhou-dong-community-rice |
| 芥菜 | 1 | fujian-gai-cai-minced-pork-rice |
| 牛奶 | 1 | tibetan-savory-congee |
| 牛肉（粗绞） | 1 | texas-beef-chili |
| 泡发糯米 | 1 | quanzhou-oil-rice |
| 平菇 | 1 | banshan-wild-rice |
| 芹菜 | 1 | creole-jambalaya |
| 去核红枣 | 1 | shaanbei-red-date-cowpea-rice |
| 去皮鸡腿肉 | 1 | cantonese-mushroom-chicken-claypot-rice |
| 生菜 | 1 | hainan-cai-bao-rice |
| 食品级菠菜粉 | 1 | guangxi-five-color-glutinous-rice |
| 食品级干荷叶 | 1 | daxi-lotus-leaf-oil-rice |
| 食品级黑米色粉 | 1 | she-people-black-rice |
| 食品级蕨麻 | 1 | tibetan-ginseng-fruit-rice |
| 食品级南瓜粉 | 1 | guangxi-five-color-glutinous-rice |
| 食品级甜菜粉 | 1 | guangxi-five-color-glutinous-rice |
| 食品级紫薯粉 | 1 | guangxi-five-color-glutinous-rice |
| 熟鹰嘴豆 | 1 | qinghai-hao-fan |
| 虾仁 | 1 | shrimp-egg-fried-leftover-rice |
| 鲜小麦面条 | 1 | north-china-green-bean-braised-noodles |
| 香肠 | 1 | greens-sausage-fried-rice |
| 羊腿肉 | 1 | xinjiang-lamb-pilaf |
| 椰奶 | 1 | kari-ayam-coconut-chicken |
| 意式烩饭米 | 1 | basic-risotto |
| 玉米 | 1 | corn-carrot-chicken-leg-covered-rice |
| 紫米 | 1 | dai-pineapple-purple-rice |

## Active template 实际命中

| Template | 被最终计划选中的菜单数 | 直接 evidence 对齐数 |
| --- | ---: | ---: |
| `acid-staple-pot` | 10 | 3 |
| `savory-mixed-rice-pot` | 20 | 3 |
| `cooked-rice-stir-pot` | 4 | 0 |
| `broth-noodle-pot` | 2 | 0 |
| `egg-tofu-vegetable-pot` | 0 | 0 |
| `mushroom-vegetable-stew-pot` | 0 | 0 |
| `beef-staple-pot` | 2 | 1 |
| `poultry-staple-pot` | 1 | 0 |
| `broth-rice-pot` | 7 | 1 |
| `braised-noodle-pot` | 4 | 1 |

## 技法家族覆盖

| 技法家族 | 菜单数 | 单锅完整覆盖 | taxonomy gap | Planner gap |
| --- | ---: | ---: | ---: | ---: |
| `claypot-rice` | 3 | 0 | 3 | 1 |
| `cooked-rice-stew` | 10 | 7 | 0 | 2 |
| `cooked-rice-stir` | 5 | 3 | 2 | 0 |
| `family-pot-with-absorbent-staple` | 1 | 0 | 1 | 0 |
| `glutinous-mixed-rice` | 3 | 0 | 3 | 2 |
| `grain-porridge` | 3 | 1 | 2 | 0 |
| `noodle-braise` | 2 | 1 | 1 | 0 |
| `noodle-broth` | 4 | 3 | 1 | 1 |
| `noodle-steam-braise` | 0 | 0 | 0 | 0 |
| `raw-rice-braise` | 27 | 7 | 17 | 3 |
| `stew-with-staple` | 0 | 0 | 0 | 0 |
| `vessel-adapted-rice` | 3 | 0 | 3 | 2 |

## 地域覆盖

| 地域 | 菜单数 | 单锅完整覆盖 | taxonomy gap | Planner gap |
| --- | ---: | ---: | ---: | ---: |
| `central_plains` | 1 | 0 | 1 | 0 |
| `fujian_taiwan` | 6 | 0 | 6 | 2 |
| `jiangnan` | 8 | 0 | 8 | 1 |
| `jingjinji` | 1 | 0 | 1 | 0 |
| `jinmeng` | 3 | 1 | 2 | 0 |
| `lingnan_hk_macao` | 5 | 0 | 5 | 2 |
| `northwest` | 3 | 1 | 2 | 0 |
| `qinghai_tibet` | 4 | 0 | 4 | 1 |
| `shandong` | 1 | 0 | 1 | 0 |
| `yunnan_guizhou` | 2 | 0 | 2 | 1 |

## 72 道菜单逐项结果

| 菜单 | 原始核心食材 | 身份识别 | 已识别食材覆盖 | 端到端覆盖 | 计划 | Template | Evidence | 优先级 |
| --- | --- | ---: | ---: | ---: | --- | --- | --- | --- |
| 中式基础粥 | 大米、水 | 100% | 100% | 100% | single_pot / complete | savory-mixed-rice-pot | 仅食材兼容或未规划 | P3 |
| 简化一锅鸡肉香料饭 | 大米、鸡肉、洋葱 | 100% | 100% | 100% | single_pot / complete | savory-mixed-rice-pot | 直接对齐 | covered |
| 西非番茄香料饭 | 大米、番茄、甜椒、洋葱 | 75% | 100% | 75% | multi_pot / needs_user_decision | acid-staple-pot、cooked-rice-stir-pot | 直接对齐 | P1 |
| 克里奥尔番茄鸡肉什锦饭 | 大米、番茄、鸡肉、芹菜 | 75% | 100% | 75% | multi_pot / needs_user_decision | acid-staple-pot、broth-noodle-pot | 仅食材兼容或未规划 | P1 |
| 大豆扁豆西兰花炖锅 | 红扁豆、大豆蛋白块、西兰花、红洋葱 | 25% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 鸡肉黑眼豆番茄饭锅 | 黑眼豆（罐头沥干）、大米、鸡肉、番茄、洋葱 | 80% | 100% | 80% | multi_pot / needs_user_decision | acid-staple-pot、cooked-rice-stir-pot | 仅食材兼容或未规划 | P1 |
| 扁豆土豆番茄咖喱 | 红扁豆、土豆、番茄 | 66.7% | 100% | 66.7% | single_pot / needs_user_decision | acid-staple-pot | 仅食材兼容或未规划 | P1 |
| 番茄甜椒炖蛋 | 鸡蛋、番茄、甜椒 | 66.7% | 100% | 66.7% | single_pot / needs_user_decision | acid-staple-pot | 仅食材兼容或未规划 | P1 |
| 德州风味牛肉辣炖锅 | 牛肉（粗绞）、干辣椒 | 0% | 不适用 | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P0 |
| 印尼椰香鸡肉咖喱 | 鸡肉、椰奶、红葱头 | 33.3% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 基础意式烩饭 | 意式烩饭米、洋葱、高汤、黄油 | 25% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 米粒卷心菜杂蔬汤 | 大米、卷心菜、高汤 | 33.3% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 上海奉贤咸肉菜饭 | 大米、咸五花肉、小白菜 | 33.3% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 苏州青菜咸肉饭 | 大米、咸五花肉、小白菜 | 33.3% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 南京矮脚黄腊肉菜饭 | 大米、腊五花肉、矮脚黄 | 33.3% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 南京矮脚黄香肠菜饭 | 大米、广式腊肠、矮脚黄 | 66.7% | 100% | 66.7% | single_pot / needs_user_decision | savory-mixed-rice-pot | 直接对齐 | P1 |
| 南京矮脚黄板鸭菜饭 | 大米、包装熟制板鸭（去骨）、矮脚黄 | 33.3% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 金山土灶菜饭 | 大米、小白菜 | 50% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 高丽菜香菇炊饭 | 大米、卷心菜、鲜香菇 | 66.7% | 100% | 66.7% | single_pot / needs_user_decision | savory-mixed-rice-pot | 直接对齐 | P1 |
| 泉州浥饭（油饭） | 泡发糯米、猪肉末、鲜香菇 | 33.3% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 福建盖菜肉末咸饭 | 大米、芥菜、猪肉末 | 33.3% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 福建扁豆饭 | 大米、扁豆 | 50% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 海南定安菜包饭 | 大米、生菜、胡萝卜 | 66.7% | 100% | 66.7% | single_pot / needs_user_decision | savory-mixed-rice-pot | 仅食材兼容或未规划 | P1 |
| 大溪荷叶油饭 | 糯米、猪肉末、食品级干荷叶 | 0% | 不适用 | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P0 |
| 广式腊味煲仔饭 | 大米、广式腊肠、菜心 | 66.7% | 100% | 66.7% | single_pot / needs_user_decision | savory-mixed-rice-pot | 仅食材兼容或未规划 | P1 |
| 广式香菇滑鸡煲仔饭 | 大米、去皮鸡腿肉、鲜香菇 | 66.7% | 100% | 66.7% | single_pot / needs_user_decision | savory-mixed-rice-pot | 仅食材兼容或未规划 | P1 |
| 广式豆豉排骨煲仔饭 | 大米、猪肋排、豆豉 | 66.7% | 0% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 新疆羊肉抓饭 | 羊腿肉、洋葱、胡萝卜、大米 | 75% | 100% | 75% | single_pot / needs_user_decision | savory-mixed-rice-pot | 仅食材兼容或未规划 | P1 |
| 新疆素抓饭 | 大米、洋葱、胡萝卜 | 100% | 100% | 100% | single_pot / complete | savory-mixed-rice-pot | 仅食材兼容或未规划 | P3 |
| 陕北红枣豇豆焖饭 | 大米、去核红枣、豇豆 | 66.7% | 100% | 66.7% | single_pot / needs_user_decision | savory-mixed-rice-pot | 仅食材兼容或未规划 | P1 |
| 青海熬饭风味家庭适配版 | 小米、土豆、熟鹰嘴豆 | 33.3% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 山西岚县土豆饭 | 大米、土豆 | 100% | 100% | 100% | single_pot / complete | savory-mixed-rice-pot | 仅食材兼容或未规划 | P3 |
| 山西泥屯小米饭 | 小米、土豆 | 50% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 藏式咸稀饭风味家庭适配版 | 大米、牛奶 | 50% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 古突风味家庭适配版 | 小麦面团、小白菜、水 | 50% | 0% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 西藏人参果饭 | 食品级蕨麻、大米 | 50% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 广西壮族五色糯米饭 | 糯米、食品级紫薯粉、食品级甜菜粉、食品级菠菜粉、食品级南瓜粉 | 0% | 不适用 | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P0 |
| 畲族乌饭风味家庭适配版 | 糯米、食品级黑米色粉 | 0% | 不适用 | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P0 |
| 半山野米饭风味平菇焖饭 | 大米、平菇 | 50% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 傣族菠萝紫米饭 | 紫米、菠萝 | 0% | 不适用 | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P0 |
| 侗家社饭风味家庭适配版 | 大米、腊五花肉、姜、小白菜 | 25% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 北方豆角焖面 | 鲜小麦面条、豆角、猪肉末 | 33.3% | 100% | 0% | none / no_valid_plan | 无 | 仅食材兼容或未规划 | P1 |
| 家常鸡蛋炒剩饭 | 熟米饭、鸡蛋 | 100% | 100% | 100% | single_pot / complete | broth-rice-pot | 仅食材兼容或未规划 | P3 |
| 番茄鸡蛋烩剩饭 | 熟米饭、番茄、鸡蛋 | 100% | 100% | 100% | single_pot / complete | acid-staple-pot | 直接对齐 | covered |
| 青菜鸡蛋焖剩饭 | 熟米饭、青菜、鸡蛋 | 100% | 100% | 100% | single_pot / complete | broth-rice-pot | 仅食材兼容或未规划 | P3 |
| 香菇鸡蛋焖剩饭 | 熟米饭、鲜香菇、鸡蛋 | 100% | 100% | 100% | single_pot / complete | cooked-rice-stir-pot | 仅食材兼容或未规划 | P3 |
| 虾仁鸡蛋炒剩饭 | 熟米饭、虾仁、鸡蛋 | 66.7% | 100% | 66.7% | single_pot / needs_user_decision | broth-rice-pot | 仅食材兼容或未规划 | P1 |
| 西兰花牛肉炒饭 | 熟米饭、西兰花、牛肉 | 100% | 100% | 100% | single_pot / complete | beef-staple-pot | 仅食材兼容或未规划 | P3 |
| 西兰花牛肉焖饭 | 大米、西兰花、牛肉 | 100% | 100% | 100% | single_pot / complete | savory-mixed-rice-pot | 仅食材兼容或未规划 | P3 |
| 番茄西兰花牛肉烩饭 | 熟米饭、番茄、西兰花、牛肉 | 100% | 100% | 100% | single_pot / complete | acid-staple-pot | 仅食材兼容或未规划 | P3 |
| 西兰花牛肉汤面 | 面条、西兰花、牛肉 | 100% | 100% | 100% | single_pot / complete | beef-staple-pot | 直接对齐 | covered |
| 土豆西兰花牛肉饭锅 | 大米、土豆、西兰花、牛肉 | 100% | 100% | 100% | single_pot / complete | savory-mixed-rice-pot | 仅食材兼容或未规划 | P3 |
| 青菜豆腐炒饭 | 熟米饭、老豆腐、青菜 | 100% | 100% | 100% | single_pot / complete | cooked-rice-stir-pot | 仅食材兼容或未规划 | P3 |
| 白菜豆腐焖饭 | 大米、老豆腐、白菜 | 100% | 100% | 100% | single_pot / complete | savory-mixed-rice-pot | 仅食材兼容或未规划 | P3 |
| 番茄青菜豆腐烩饭 | 熟米饭、番茄、老豆腐 | 100% | 100% | 100% | single_pot / complete | acid-staple-pot | 直接对齐 | covered |
| 青菜豆腐汤面 | 面条、老豆腐、青菜 | 100% | 100% | 100% | single_pot / complete | braised-noodle-pot | 仅食材兼容或未规划 | P3 |
| 香菇青菜豆腐饭锅 | 大米、鲜香菇、老豆腐、青菜 | 100% | 100% | 100% | single_pot / complete | savory-mixed-rice-pot | 仅食材兼容或未规划 | P3 |
| 鸡腿土豆焖饭 | 大米、鸡腿肉、土豆 | 100% | 100% | 100% | single_pot / complete | savory-mixed-rice-pot | 仅食材兼容或未规划 | P3 |
| 鸡腿香菇土豆烩饭 | 熟米饭、鸡腿肉、鲜香菇 | 100% | 100% | 100% | single_pot / complete | poultry-staple-pot | 仅食材兼容或未规划 | P3 |
| 番茄鸡腿土豆汤饭 | 熟米饭、鸡腿肉、番茄 | 100% | 100% | 100% | multi_pot / complete | acid-staple-pot、broth-noodle-pot | 仅食材兼容或未规划 | P2 |
| 玉米土豆鸡腿饭锅 | 大米、鸡腿肉、玉米、胡萝卜 | 75% | 100% | 75% | single_pot / needs_user_decision | savory-mixed-rice-pot | 仅食材兼容或未规划 | P1 |
| 白菜土豆鸡腿焖面 | 面条、鸡腿肉、白菜、土豆 | 100% | 100% | 100% | single_pot / complete | braised-noodle-pot | 直接对齐 | covered |
| 青菜香肠炒饭 | 熟米饭、青菜、香肠 | 66.7% | 100% | 66.7% | single_pot / needs_user_decision | broth-rice-pot | 仅食材兼容或未规划 | P1 |
| 青菜肉末焖饭 | 大米、青菜、猪肉末 | 66.7% | 100% | 66.7% | single_pot / needs_user_decision | savory-mixed-rice-pot | 仅食材兼容或未规划 | P1 |
| 青菜鸡蛋汤饭 | 熟米饭、白菜、鸡蛋 | 100% | 100% | 100% | single_pot / complete | broth-rice-pot | 直接对齐 | covered |
| 青菜豆腐粉丝煲 | 粉丝、青菜、老豆腐 | 66.7% | 100% | 66.7% | single_pot / needs_user_decision | braised-noodle-pot | 仅食材兼容或未规划 | P1 |
| 青菜鸡腿汤面 | 面条、青菜、鸡腿肉 | 100% | 100% | 100% | single_pot / complete | braised-noodle-pot | 仅食材兼容或未规划 | P3 |
| 豆角排骨焖饭 | 大米、猪肋排、豆角 | 100% | 66.7% | 66.7% | single_pot / needs_user_decision | savory-mixed-rice-pot | 仅食材兼容或未规划 | P1 |
| 土豆排骨烩饭 | 熟米饭、猪肋排、土豆 | 100% | 66.7% | 66.7% | single_pot / needs_user_decision | broth-rice-pot | 仅食材兼容或未规划 | P1 |
| 番茄土豆排骨饭锅 | 大米、猪肋排、番茄、土豆 | 100% | 75% | 75% | single_pot / needs_user_decision | acid-staple-pot | 仅食材兼容或未规划 | P1 |
| 香菇豆角排骨焖饭 | 大米、猪肋排、鲜香菇、豆角 | 100% | 75% | 75% | single_pot / needs_user_decision | savory-mixed-rice-pot | 仅食材兼容或未规划 | P1 |
| 白菜土豆排骨汤饭 | 熟米饭、猪肋排、白菜、土豆 | 100% | 75% | 75% | single_pot / needs_user_decision | broth-rice-pot | 仅食材兼容或未规划 | P1 |

## 输入指纹

- `tools/data/ingredient-taxonomy.v1.json`：`af525ac1ea12ba8bd5b59290d8b4017a8942804e8224151ffc87d1ebdb680a63`
- `tools/data/meal-templates.v2.json`：`d2a743bc88e614bd4f0d5d7614f610a4314e2abefe88c57a11ad31312c5bda04`
- `tools/data/menu-master-baseline.v1.json`：`68e339839c474ea4dde588913f7a2277c9578043e3fc800306e83b75ec914eab`
- `tools/data/ratio-rules.v1.json`：`4631b22be7377fc6d46ac1d4150d82245d85bc6122a387e48c003c29f7ae8224`
- `tools/data/recipe-library.json`：`69d40f12c3db12fb0d03af20665c33352f4c20b9ad53ad542a4b91c2aec1658e`
- `tools/data/regional-menu-mappings.v1.json`：`2a9d061f8d2a546749d40f0b93a9792e37f260f10213b9e9800acbe238aeed41`

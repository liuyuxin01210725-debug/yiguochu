# 中国大陆地域一锅米饭候选搜集批次 r113

日期：2026-08-07  
目录基线：`source-backed-one-pot-v1-20260807-national-r112`（849 条；先按 `recipe_id`、`canonical_name` 与近名检索去重）  
范围：本批只做中国大陆具名的菜饭、焖饭、炊饭、抓饭、蒸饭及边界档案搜集；不修改主 JSON、CSV、运行时代码、构建产物或部署。

## 证据与分层口径

- 只有来源原文明确写到的事实才记录；名录、活动报道和搜索摘要只证明身份，不补写数量、液体、时间或步骤。
- `recipe_fact_checked` 在本 intake 中仅表示“身份和部分食材/工艺事实已找到”，不表示合同闭合、厨房验证或可对外承诺。
- `direct_one_pot` 只描述来源所写的原器具流程。土灶、瓦煲、砂锅、铜锅、竹筒等不能推导电饭煲水量、程序、防糊或投料时机；先炒、先蒸、预制阴米、米团糍再加工的条目标为 `staged_or_secondary`。
- `source_access`：`opened` 为本轮能直接打开并阅读的原文；`search_extract_only` 或 `timeout_pending` 只能停在研究层，必须补直达核验后才能进入结构化目录。
- “后续结构化”表示值得下一轮整理成事实字段；“身份档案”表示目前只有菜名/名录身份，不能写成做法。**本批所有条目 B 架均为“否”**，因为尚未闭合安全、用量、液体和器具合同。

## 候选清单（23 条；含近名证据升级项，均不在本批直接入库）

| # | 建议 recipe_id | canonical_name | 地域/家族 | 直达来源（发布方） | source_access | 来源实际证明的事实 | 一锅/器具边界 | 缺口与目录关系 | 建议状态 | 后续路径 | B架 |
|---:|---|---|---|---|---|---|---|---|---|---|:---:|
| 1 | `cn-xj-yutian-pilaf` | 于田抓饭 | 新疆和田于田/抓饭 | [于田县人民政府·抓饭](https://www.xjyt.gov.cn/changyou/chi/2021-06-07/251.html) | `opened` | 原文列大米、羊肉 200g、胡萝卜 2 根、洋葱 1 个、葡萄干、油 50g 及调味；米浸泡 30 分钟，肉和蔬菜先炒，加水煮约 10 分钟，再把料、汤、葡萄干移入电饭锅，铺米焖约 20 分钟后拌匀。 | `staged_or_secondary`；明确存在炒料后转电饭锅的连续流程；“1:2”比例对象不清，不能当液体合同。 | 与目录泛称“手抓饭”近名，建议作为于田地域证据升级而非立即新增配方；缺安全终点、液体对象和米量。 | `recipe_fact_checked` | **结构化优先**（先补比例/安全，再判断是否拆出地域变体） | 否 |
| 2 | `cn-xj-karamay-pilaf` | 克拉玛依抓饭 | 新疆克拉玛依/抓饭 | [上海市合作交流办公室·克拉玛依抓饭](https://hzjl.sh.gov.cn/n1308/20250207/e9892da3af324a398bd570fc1bd089c4.html) | `opened` | 官方报道写米饭、胡萝卜和羊肉共同焖制，米粒分明、肉嫩、胡萝卜软，作为当地抓饭风味介绍。 | `direct_one_pot` 只到身份和核心组合层；未给家庭锅具参数，不能外推电饭煲。 | 没有克重、液体、时长、步骤和安全；与于田/伊犁抓饭分地域记录，不拼成一套配方。 | `recipe_fact_checked` | 结构化候选（需另找完整原方） | 否 |
| 3 | `cn-gd-zhongshan-huangpu-cured-steamed-rice` | 黄圃腊味蒸饭 | 广东中山黄圃/腊味蒸饭 | [中山市黄圃镇人民政府·黄圃腊味蒸饭](https://www.zs.gov.cn/zshpz/gkmlpt/content/2/2552/post_2552596.html) | `opened` | 官方页面报道酒楼推出“黄圃腊味蒸饭”，并介绍黄圃腊味的地方产业/非遗背景。 | 由“蒸饭”名称可确认米饭蒸制语境，但原文未给流程或器具。 | 与目录已有“黄圃腊味煲仔饭”存在近名关系；不另造配方，先作为地域/名称证据。 | `identity_verified` | **身份档案**；若找到独立原方再评估合并 | 否 |
| 4 | `cn-gd-xinhui-cured-duck-leg-stewed-rice` | 新会腊鸭腿焖饭 | 广东江门新会/腊鸭饭 | [新会区文化广电旅游体育局·菜单报道](https://www.xinhui.gov.cn/gzjg/qzfgzbm/jmsxhqwhgdlytyj/tpxw/content/post_3021301.html) | `search_extract_only`（直达页本轮安全拦截） | 官方搜索结果显示该页菜单中出现“腊鸭腿焖饭”。 | 目前只证明具名，不证明一锅流程或器具。 | 需直接打开原文；无配料、数量、液体、时间和安全。 | `identity_verified` | **身份档案**，待直达核验 | 否 |
| 5 | `cn-jiangsu-suzhou-water-chestnut-steamed-rice` | 荸荠蒸饭 | 江苏苏州/时令蒸饭 | [苏州市地方志办公室·苏州旧俗](https://dfzb.suzhou.gov.cn/dfzb/szdq/201702/5b6e5313d2c84492b9d74e9b310c684c.shtml) | `opened` | 地方志写苏州旧俗：将去皮荸荠埋入一锅白米饭同蒸，称“挖元宝”。 | `direct_one_pot`；同锅蒸制，但属于时令习俗、无蛋白的简单饭食，不是完整菜饭。 | 缺荸荠/米量、时间、液体和安全；不应为了营养硬加肉菜。 | `recipe_fact_checked` | **结构化候选**（作为边界/时令饭，不进入主餐 B 架） | 否 |
| 6 | `cn-hunan-phoenix-miao-herb-she-rice` | 凤凰蒿香苗家社饭 | 湖南湘西凤凰/苗家社饭 | [湖南省人民政府·凤凰社饭](https://www.hunan.gov.cn/hnszf/jxxx/hxwh/cwd/201711/t20171111_4685412.html) | `opened` | 官方文写采制蒿菜，和腊肉、葱蒜丁炒香；三分之一粘米先煮到半熟，再加三分之二糯米，拌入菜肉，覆盖焖/蒸约 30 分钟。 | `staged_or_secondary`；有预炒和粘米/糯米混合的多阶段流程，原文未证明电饭煲。 | 缺克重、液体、火力与安全；与目录“湘西社饭”近名，应先作为来源证据升级，不拼版本。 | `recipe_fact_checked` | **结构化优先**（补合同后评估地域别名） | 否 |
| 7 | `cn-shaanxi-northern-jujube-stewed-rice` | 陕北枣焖饭 | 陕西陕北/枣饭 | [陕西省地方志办公室·陕北枣食](https://dfz.shaanxi.gov.cn/zslm/sxsq/msfq/201112/t20111216_2620139.html) | `opened` | 地方志在陕北枣食中列出“枣焖饭”这一具名饭食。 | 只有名称和“焖饭”身份，未证明具体锅具/流程。 | 缺食材构成、数量、液体、时间、安全；不借用其他枣饭的做法。 | `identity_verified` | **身份档案** | 否 |
| 8 | `cn-shaanxi-shenmu-hehe-laba-rice` | 合河村腊八饭 | 陕西榆林神木合河村/腊八饭 | [陕西省地方志办公室·腊八习俗](https://dfz.shaanxi.gov.cn/zslm/zjyd/fzsy/202001/t20200106_2623780.html) | `search_extract_only`（直达页超时） | 官方搜索摘录提到黍、糯米、红枣浸泡后蒸一小时以上，并同时记载榆林腊八焖饭的米、枣、豆类组合。 | 现有摘录可见蒸/焖语境，但不能把两个地域版本拼成一锅。 | 需打开原文并区分“合河村腊八饭”和“榆林腊八焖饭”；无完整量化/安全。 | `identity_verified` | **身份档案**，待原文核验 | 否 |
| 9 | `cn-gd-dongguan-baisha-duck-spleen-glutinous-rice` | 鸭脾糯米饭 | 广东东莞白沙/油鸭衍生饭 | [东莞市南城街道·白沙油鸭](https://www.dg.gov.cn/nancheng/nczwz/ncdafzgwz/pzwh/ftms/content/post_2395840.html) | `opened` | 官方档案说明白沙油鸭及其传统食品，并列出“鸭脾糯米饭”。 | 仅身份，未证明是否同锅蒸或另锅配饭。 | 无配料、数量、流程、器具和安全；不得按“油鸭”自行补写腊味饭。 | `identity_verified` | **身份档案** | 否 |
| 10 | `cn-ningxia-yanchi-yellow-millet-sticky-rice` | 盐池黄米粘饭 | 宁夏吴忠盐池/黄米饭 | [吴忠市人民政府·地方特色饮食](https://www.wuzhong.gov.cn/sywz/cxwz/202302/t20230221_3968499.html) | `search_extract_only`（页面返回方法不允许） | 官方搜索摘录把“黄米粘饭”列为盐池地方食物。 | 只证明名称，不证明锅具或流程。 | 无原文步骤、数量、液体、时间、安全。 | `identity_verified` | **身份档案** | 否 |
| 11 | `cn-ningxia-tongxin-two-grain-rice` | 同心二米饭 | 宁夏吴忠同心/杂粮饭 | [吴忠市人民政府·地方特色饮食](https://www.wuzhong.gov.cn/sywz/cxwz/202302/t20230221_3968499.html) | `search_extract_only` | 同一官方页面搜索摘录列“二米饭”为同心地方饮食。 | 只证明具名，不可从名称推断是哪两种米或水量。 | 需直达核验；无食材、比例、流程、器具和安全。 | `identity_verified` | **身份档案** | 否 |
| 12 | `cn-gansu-zhangjiachuan-eight-treasure-rice` | 张家川八宝米 | 甘肃天水张家川/八宝米 | [天水市文化和旅游局·张家川八宝米](https://www.tianshui.gov.cn/wlj/info/2732/246562.htm) | `search_extract_only` | 官方资料列糯米、葡萄干、莲子、枣、花生、枸杞、百合等，并写蜂蜜/红糖处理米与果料蒸制 30 分钟后扣碗成型。 | `staged_or_secondary`；甜味/礼俗米食，非家庭主餐；不是电饭煲合同。 | 缺可复核页码、克重、液体和安全；与八宝饭类不要混成咸饭。 | `recipe_fact_checked` | **身份/文化档案**，不进 B 架 | 否 |
| 13 | `cn-zhejiang-taizhou-minced-pork-chui-rice` | 肉沫炊饭 | 浙江台州/炊饭 | [台州市文化和广电旅游体育局·地方饮食资料 PDF](https://zjjcmspublic.oss-cn-hangzhou-zwynet-d01-a.internet.cloud.zj.gov.cn/jcms_files/jcms1/web3453/site/attach/0/f522467c888c43018000b805c5e1211f.pdf) | `search_extract_only` | 官方 PDF 搜索结果列出台州地方食物“肉沫炊饭”。 | 只证明具名，未证明肉沫与米是否同锅、使用何器具。 | 需归档并核对 PDF 页码；无食材量、液体、流程、时间、安全。 | `identity_verified` | **身份档案** | 否 |
| 14 | `cn-zhejiang-yueqing-red-rice-chui-rice` | 赤米香炊饭 | 浙江温州乐清/赤米饭 | [乐清市教育局·赤米香炊饭 PDF](https://zjjcmspublic.oss-cn-hangzhou-zwynet-d01-a.internet.cloud.zj.gov.cn/jcms_files/jcms1/web2544/site/attach/0/fb0efc0d205a4fb9927f985386de45f5.pdf) | `search_extract_only` | 官方教育 PDF 题名/材料中出现“赤米香炊饭”。 | 可能是研究题名，不能仅凭标题写成成熟菜谱。 | 需直接打开确认语境；无配料、比例、工艺和器具。 | `identity_verified` | **身份档案**，待确认是否为菜谱而非论文标题 | 否 |
| 15 | `cn-tibet-zayu-chawalong-deng-hand-grab-rice` | 察瓦龙僜人手抓饭 | 西藏林芝察隅察瓦龙/僜人饭食 | [西藏自治区党委·察瓦龙僜人手抓饭非遗线索](https://www.xzdw.gov.cn/xwzx/qnyw/202301/t20230110_311485.html) | `search_extract_only` | 官方报道/名录摘要列“察瓦龙乡僜人手抓饭”为市级非遗项目线索。 | 仅身份；不从“手抓饭”泛称推断羊肉、米量或锅具。 | 与目录已有“察隅僜人手抓饭”近名，需核定乡域差异后再决定合并。 | `identity_verified` | **身份档案/去重待审** | 否 |
| 16 | `cn-gd-meizhou-dabu-eight-treasure-glutinous-rice` | 大埔八宝糯米饭 | 广东梅州大埔/八宝糯米饭 | [大埔县人民政府·地方饮食](https://www.dabu.gov.cn/zjdp/whts/yss/content/mpost_2567004.html) | `search_extract_only` | 官方页面目录将“八宝糯米饭”列为大埔传统饮食；正文其他段落并未给它完整做法。 | 只证明身份，不能把同页其他米食步骤套入。 | 需打开全文并找到对应做法；无数量、液体、时间、安全。 | `identity_verified` | **身份档案** | 否 |
| 17 | `cn-hebei-shexian-millet-braised-rice-mct` | 涉县小米焖饭（武安专题页） | 河北邯郸涉县/小米焖饭 | [文化和旅游部·河北乡村线路美食](https://zhuanti.mct.gov.cn/rxhmxjgn2022/hebei/detail/2790.html) | `opened` | 文化和旅游部正文明确区分：“武安三道饭”是蒸馍、米饭、烧麦组成的宴席总称，并非一道一锅饭；同页另列涉县小米焖饭两种做法：时菜（白菜或茄子）炒后加小米、盐、水同焖，或纯小米焖饭配炒胡萝卜条/土豆丝/野韭花/酸菜。 | `direct_one_pot` 仅适用于同页的涉县小米焖饭；来源未给电饭煲参数。武安三道饭必须作为宴席档案排除，不得改名冒充焖饭。 | 目录已有“涉县小米焖饭”近/同名条目；本条是官方正文证据升级候选，不新增第二套配方；缺克重、米水比例、时间和安全。 | `recipe_fact_checked` | **证据升级/身份去重**，不单列“武安三道饭” | 否 |
| 18 | `cn-shanghai-putuo-yeshu-vegetable-rice` | 爷叔菜饭 | 上海普陀/菜饭餐馆名 | [上海市普陀区政府·爷叔菜饭](https://www.shpt.gov.cn/zrzjd-jiedaozhen/sqdt-zrzjd/20260507/969770.html) | `search_extract_only` | 官方街道信息把“爷叔菜饭·猪爪汤”列作本地餐饮推荐，证明名称使用。 | 可能是店名/套餐，不证明一锅制作。 | 需找到菜品原方或非遗/地方志来源；无食材、流程、器具、量、时间、安全。 | `identity_verified` | **身份档案**，不进入结构化候选 | 否 |
| 19 | `cn-gd-taishan-cured-kohlrabi-rice` | 腊肉菜果饭 | 广东江门台山/菜果饭 | [台山市地方资料 PDF](https://www.cnts.gov.cn/attachment/cmsfile/415c38ff84494b9eb9b75460bd050c2a/02ec5ccd051eb04a5f0a2f80b735263d6fe4.pdf) | `search_extract_only` | 官方资料摘要提到菜果切粒，与腊肉、虾仁等制作“腊肉菜果饭”。 | 若原文确认同锅，可作为菜果饭变体；当前不能推断电饭煲参数。 | 目录已有“台山菜果饭”，本条先作为来源/变体证据，不能无独立结构就拆条。 | `recipe_fact_checked` | **结构化优先（先补 PDF 直读并做近名裁决）** | 否 |
| 20 | `cn-gd-kaiping-chikan-ribs-cured-kohlrabi-rice` | 赤坎排骨腊味菜果饭 | 广东江门开平赤坎/煲仔饭变体 | [开平市政府·赤坎煲仔饭及变体](https://www.kaiping.gov.cn/kpswhgdlytyj/kpwhg/fwzwhyc/fyxm/content/post_2533528.html) | `search_extract_only` | 官方页面摘要列赤坎煲仔饭的排骨、腊味、菜果、麦豆、秋鱼等组合，并出现“排骨腊味菜果饭”等名称。 | 目前只证明变体名/家族，不证明每个组合的独立流程；原器具需直读。 | 目录已有“赤坎煲仔饭”家族，先作为变体候选，不把多个口味拼为一锅合同。 | `identity_verified` | **身份档案/变体待审** | 否 |
| 21 | `cn-yunnan-yuxi-jiangchuan-huanggang-glutinous-rice` | 黄钢蒸制糯米饭 | 云南玉溪江川/糯米饭 | [玉溪市人民政府·江川传统米食](https://www.yuxi.gov.cn/yxs/xqjcq/20250707/1610927.html) | `search_extract_only` | 官方页面资料中出现“黄钢蒸制糯米饭”项目/技艺名称。 | 仅身份，未证明材料和蒸制步骤。 | 需原文打开、核对是否具名饭食而非技艺标题；不补水量和锅具。 | `identity_verified` | **身份档案** | 否 |
| 22 | `cn-xj-zhaosu-pilaf` | 昭苏抓饭 | 新疆伊犁昭苏/抓饭 | [昭苏县人民政府·地方美食](https://www.zhaosu.gov.cn/zsx/c113806/202407/65c1d049a82141afb1113413485b3a38.shtml) | `search_extract_only` | 官方页面摘要在地方节庆/饮食语境提到昭苏抓饭，确认地域与具名。 | 只证明身份，不证明抓饭具体肉类、米量或器具。 | 需直达核验；与于田、克拉玛依、现有“手抓饭”分地域处理，不能套用比例。 | `identity_verified` | **身份档案** | 否 |
| 23 | `cn-gd-dongguan-baisha-oil-duck-rice` | 白沙油鸭腊味饭 | 广东东莞白沙/油鸭饭食 | [东莞市南城街道·白沙油鸭](https://www.dg.gov.cn/nancheng/nczwz/ncdafzgwz/pzwh/ftms/content/post_2395840.html) | `opened` | 同一官方档案列白沙油鸭及其衍生米食，能证明地方名称与食材文化关系。 | 未说明腊味与米是否同锅，不能据“腊味饭”推导做法。 | 与“鸭脾糯米饭”属于同一油鸭文化线，先保留两个名称的去重关系；无合同事实。 | `identity_verified` | **身份档案/去重待审** | 否 |

## 本批后续处理

1. **优先结构化的 4 条**：于田抓饭、凤凰蒿香苗家社饭、腊肉菜果饭、克拉玛依抓饭。它们有较明确的地域身份和部分食材/工艺线索，但下一步仍需逐条补齐来源直读、用量/液体/时间/安全及器具边界，不能直接进入 B 架。涉县小米焖饭本轮已确认是主目录近/同名证据升级，不再当作新候选。
2. **只做身份档案的 19 条**：黄圃腊味蒸饭、新会腊鸭腿焖饭、荸荠蒸饭、枣焖饭、合河村腊八饭、鸭脾糯米饭、盐池黄米粘饭、同心二米饭、张家川八宝米、肉沫炊饭、赤米香炊饭、察瓦龙僜人手抓饭、大埔八宝糯米饭、爷叔菜饭、赤坎排骨腊味菜果饭、黄钢蒸制糯米饭、昭苏抓饭、白沙油鸭腊味饭、涉县小米焖饭（证据升级）。身份档案不等于可照做；其中甜饭、时令饭、餐馆名和预加工/变体线索尤其不得自由补全。
3. 近名项（于田/凤凰/黄圃/台山/赤坎/察瓦龙/白沙）先作为证据升级和去重候选，不自动拆成新菜单。若未来独立来源证明核心结构、地域称谓或工艺确实不同，再由人工审查决定是否单列。
4. 本批没有任何条目获得电饭煲水量、程序、防糊或投料时机合同；没有条目进入 B 试做架，没有 recipe 状态晋升，没有 DeepSeek 调用，没有部署。

## 去重与停搜说明

本批按 r112 主目录的 `recipe_id`、`canonical_name` 和常见近名检索；出现“已有泛称/家族”的条目已在表内标明 `near_existing` 或 `variant`，不将搜集数量当作已确认新菜单数。后续若继续扩展，应优先补齐上述 5 条结构化候选的直接证据，而不是继续堆叠只有名录身份的条目。

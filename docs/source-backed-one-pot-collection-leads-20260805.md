# 一锅出搜集期：下一批直接来源线索

## r57 已登记（2026-08-05）

本批三条并行来源线完成去重和直接页面核对，登记 **25 条真实具名候选**。目录由 r56 的 375 条更新为 r57 的 400 条：`executable=12`、`recipe_fact_checked=374`、`identity_verified=14`、`kitchen_observed=0`。没有修改运行时，也没有部署。

| 方向 | 已登记条目 | 直接来源与边界 |
| --- | --- | --- |
| Panasonic / Tiger | `panasonic-taiwan-ginseng-chicken-rice`、`panasonic-taiwan-five-color-rice`、`panasonic-taiwan-chicken-curry-rice`、`panasonic-taiwan-beef-brisket-radish-rice`、`panasonic-taiwan-mushroom-risotto`、`panasonic-taiwan-pumpkin-mushroom-chicken-brown-rice`、`tiger-takikomi-gohan`、`tiger-cabbage-mushroom-rice`、`tiger-sweet-potato-bacon-kombu-rice` | [Panasonic 人蔘雞肉飯](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/5099)、[Panasonic 五色炊飯](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/5269)、[Panasonic 雞腿咖哩飯](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/3511)、[Panasonic 蘿蔔牛腩飯](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/3510)、[Panasonic 南瓜野菇雞肉糙米飯](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/3551)、[Tiger Takikomi Gohan](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/takikomi-gohan-japanese-mixed-rice/)。厂商型号、水位、预处理和出锅后加料均按原页保留，不推导通用电饭煲参数。 |
| 香港/台湾官方机构 | `startsmart-seasonal-pork-congee`、`startsmart-tomato-chicken-congee`、`startsmart-quinoa-millet-corn-pork-congee`、`taiwan-bamboo-shoot-rice`、`taiwan-milkfish-congee` | [StartSmart 时菜肉碎粥](https://www.startsmart.gov.hk/tc/photogalleryDetail.aspx?RecipeID=91)、[番茄雞肉粥](https://www.startsmart.gov.hk/tc/photogalleryDetail.aspx?RecipeID=51)、[三色藜麥粥](https://www.startsmart.gov.hk/tc/photogalleryDetail.aspx?RecipeID=60)、[台湾竹筍炊飯](https://fae.moa.gov.tw/theme_data.php?id=4767&sub_theme=knowledge&theme=topics)、[虱目魚粥](https://fae.moa.gov.tw/theme_data.php?id=2944&sub_theme=recipe&theme=topics)。机构大批量、先炒或先熬汤边界保留，缺家庭合同的字段保持 null。 |
| 中国地域官方来源 | `hechuan-yinmi-black-chicken-congee`、`pingchuan-sanfan`、`huaihua-haocai-rice`、`jinning-huanglaitou-braised-rice`、`qingyang-yellow-millet-braised-rice`、`weihui-dashan-millet-braised-rice`、`honghe-hani-five-color-rice`、`lianping-neiguan-braised-chicken-rice`、`lianping-neiguan-braised-duck-rice`、`xuyi-salted-pork-rice-cracker`、`shenmu-gua-braised-rice` | [合川阴米乌鸡粥](https://www.hc.gov.cn/bmjd/bm_100475/whlyw/zwxx_101408/dt_101410/202602/t20260204_15378363.html)、[平川糁饭](https://www.bypc.gov.cn/mlpc/lypc/czpc/art/2023/art_f4a5ceda8fdb4f6aa438a032ef11e6d4.html)、[文化和旅游部地方线路](https://zhuanti.mct.gov.cn/xcss2024_xcygj/yunnan/detail_g7yU_1058/7526.html)。两条有流程的候选停在 `recipe_fact_checked`；9 条只有具名/技艺的候选停在 `identity_verified`，PDF未直读的不升级。 |

### r57 研究边界

- 这批搜集的是可追溯的真实名称和原文事实，不是用户可见菜单，也不是自由组合模板；没有任何新条目晋升 `executable` 或 `kitchen_observed`。
- 营养角色单独记录：香菇饭、高丽菜香菇饭和平川糁饭的蛋白角色缺失，保留为碳水/纤维或碳水研究候选；不因数量扩张而声称均衡。
- 熟饭二次烹饪、视频未直读、PDF未归档的候选不混入本批；下一轮优先补证或保持身份状态。

## r56 已登记（2026-08-05）

本批三路并行研究后，主线逐条打开来源、去重并登记 **17 条 `recipe_fact_checked`**；没有晋升 `executable`，没有新增 `kitchen_observed`，没有修改运行时或部署。目录由 r55 的 358 条更新为 r56 的 375 条：`executable=12`、`recipe_fact_checked=358`、`identity_verified=5`、`kitchen_observed=0`。

| 方向 | 已登记条目 | 直接来源与边界 |
| --- | --- | --- |
| Panasonic Taiwan | `panasonic-taiwan-taiyu-scallop-quinoa-rice`、`panasonic-taiwan-salmon-mushroom-rice`、`panasonic-taiwan-sakura-shrimp-cabbage-rice`、`panasonic-taiwan-truffle-seafood-risotto`、`panasonic-taiwan-golden-snapper-rice`、`panasonic-taiwan-mushroom-chicken-bamboo-rice`、`panasonic-taiwan-shiitake-bamboo-chicken-rice` | [Panasonic 鲷鱼干贝藜麦炊饭](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/3904)、[鲑鱼菇菇炊饭](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/4032)、[樱虾玉菜煲仔饭](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/4003)、[松露海鲜炖饭](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/5098)。另三条使用同一官方食谱站的直接页面（3797、3842、140）；全部保留机型、程序、预炒或炊后拌合边界，不外推通用电饭煲参数。 |
| 香港官方机构 | `fehd-healthy-mixed-bean-porridge`、`fehd-cheese-asparagus-seafood-rice`、`startsmart-corn-lean-pork-porridge`、`had-vegetable-pulao`、`startsmart-three-bean-egg-tofu-red-rice` | [食环署健康杂豆粥](https://www.fehd.gov.hk/english/pleasant_environment/tidy_market/images/ahtak_recipe/202012_w2a.jpg)、[食环署芝士芦笋海鲜焗饭](https://www.fehd.gov.hk/english/pleasant_environment/tidy_market/images/ahtak_recipe/202012_w4a.jpg)、[卫生署粟米瘦肉粥](https://www.startsmart.gov.hk/tc/photogalleryDetail.aspx?RecipeID=5)、[民政事务总署 Home Recipe PDF](https://www.had.gov.hk/rru/tc_chi/programmes/files/Home_Recipe.pdf)。机构份量、粥档、焗饭、分段投料和海鲜/豆类安全边界保持原样。 |
| 地方政府/民族事务 | `dongtai-salted-pork-daylily-rice`、`she-black-rice`、`qianjiang-junmi-tea` | [东台咸肉黄花头焖饭](https://www.dongtai.gov.cn/art/2026/1/9/art_7763_4394356.html)、[广州市民族事务局畲族乌饭](https://mzzjj.gz.gov.cn/xwdt/gqdt/content/post_10848697.html)、[潜江市政府焌米茶](https://www.hbqj.gov.cn/zjqj/lyqj/msfq/202109/t20210906_3742111.html)。地方名称和技法有直接页面，但没有补写数量、液体、器具或发酵安全合同。 |
| 台湾农业部 | `taiwan-sweet-potato-salted-rice`、`taiwan-pork-rib-claypot-rice` | [地瓜咸饭](https://kids.moa.gov.tw/theme_data.php?id=230&theme=kids_cooking)、[排骨煲仔饭](https://kids.moa.gov.tw/theme_data.php?id=282&theme=kids_cooking)。两条均保留带盖锅/砂锅原器具，不借用其他来源推导电饭煲参数。 |

### r56 研究边界

- 本批只增加来源型研究资产，不新增运行时固定菜谱，也不让用户直接看到未签署条目。
- Panasonic 的官方型号边界、香港机构大批量/分段流程、地方饭的原器具与缺口均写入目录；任何 `recipe_fact_checked` 仍须经过 validator、人工签署和厨房实做才能进入下一状态。
- 发现的具名条目不等于“已经能做”：缺少固定液体、时间、安全或器具转换的事实继续保持 `null`，不拼接不同版本。

## r47 已登记与排除记录（2026-08-07）

本轮三路 Agent 分别检索厂商官方食谱、农林水产省地方料理库和地域来源；主线复核页面、去重并登记 23 条 `recipe_fact_checked`。状态分布由 279 条变为 302 条：`executable=12`、`recipe_fact_checked=285`、`identity_verified=5`、`kitchen_observed=0`。本轮没有运行时改动、没有新菜谱生成、没有部署。

### 已登记（23 条）

| 方向 | 已登记条目 | 直接来源与边界 |
| --- | --- | --- |
| Panasonic / Toshiba / Tiger / 象印 | `panasonic-tako-meshi-sr-x910e`、`panasonic-sekihan-nf-ac1000`、`toshiba-sakuraebi-rice`、`toshiba-sekihan-rcp30r`、`toshiba-kuri-okowa`、`tiger-beef-matsutake-rice`、`tiger-steamed-abalone-rice`、`tiger-uni-rice`、`zojirushi-brown-rice-ih-pot` | [Panasonic 炊饭器食谱列表](https://panasonic.jp/cooking/recipe/suihan.html)、[Toshiba 电气压力锅食谱](https://www.toshiba-lifestyle.com/jp/pressure-cookers/recipes/)、[Tiger 官方食谱](https://www.tiger-corporation.com/ja/jpn/feature/recipe/)、[象印玄米炊饭](https://www.zojirushi.co.jp/recipe/ihnabe/syousai/007.html)。各条绑定机型/锅具；压力、水位、先蒸/先煮和熟后回拌均不跨器具推导。 |
| 日本农林水产省：鸟取/爱媛/广岛/香川/冈山/爱知/岛根/山梨/栃木/德岛 | `maff-tottori-dondoroke-meshi`、`maff-tottori-itadaki`、`maff-tottori-igai-meshi`、`maff-ehime-shoyu-meshi`、`maff-hiroshima-tai-meshi`、`maff-kagawa-iriko-meshi`、`maff-okayama-tako-meshi`、`maff-tottori-daisen-okowa`、`maff-okayama-hiruzen-okowa`、`maff-aichi-hebo-meshi`、`maff-shimane-kujira-gohan`、`maff-yamanashi-sanma-meshi`、`maff-tochigi-ayu-meshi`、`maff-tokushima-tai-meshi` | [MAFF 地域料理检索](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/)。页面直接支持具名、地域、核心食材和流程；鱼、贝、蜂蛹、鲸皮等安全或可得性缺口保持显式，蒸锅おこわ不转换成电饭煲合同。 |

### 本轮明确不收录

- Panasonic 近期列表中的北海道玉米、山形芋煮、茨城番薯、神奈川しらす、长野鲑鱼、兵库黑枝豆、长崎ゆで干し大根等已存在于 r46 或更早目录，未重复建 ID。
- Tiger ひつまぶし風うな玉ごはん、Panasonic 味噌豚丼/シシリアンライス/油麩丼/塔可饭/ガパオ等需要另煮米饭或另做浇头，暂不纳入严格生米一锅主线。
- 和歌山かきまでご飯、香港菜心瑤柱飯等是熟饭与另锅配料的组合，登记为边界线索，不宣称一锅出。

### 纪律

- 本轮 23 条全部为搜集期 `recipe_fact_checked`，不是人工批准、不是 executable、不是厨房验证。
- 来源页面只证明实际写明的身份、食材、用量、液体、流程、器具或时间；缺口保持 null，不把不同来源拼成第三套配方。
- 下一轮继续遵守“20–30 条封顶、当天落账、版本必 bump、连续两批新增合格候选低于 10 条即停搜集”的退出条件。

## r46 已登记与排除记录（2026-08-06）

本轮三路 Agent 先各自提交“候选名—直接来源—事实范围—缺口”，主线去重后将 22 条直接来源候选登记为 `recipe_fact_checked`。没有条目晋升 `executable`，没有新增 `kitchen_observed`，也没有修改运行时。

### 已登记（22 条）

| 方向 | 已登记条目 | 直接来源与边界 |
| --- | --- | --- |
| 日本农林水产省 | かき飯、あめのいおご飯、ほっきめし、三重たこ飯、爱媛たこ飯、番茄鲑鱼炊饭、クファジューシー、ホタテと大根の炊き込みごはん | [MAFF 地域料理检索](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/)及对应直页；均保留原料、锅具和预处理，海鲜/猪肉温度端点未补 |
| 鍋寶官方 | 日式竹筍油豆包炊飯、牛肉野菇炊飯、芋香栗子炊飯、五目炊飯、鹹魚雞粒煲仔飯、三杯雞炊飯 | [鍋寶官方食譜](https://www.cookpot.com.tw/cookbook/)；水量、IH/外锅、先炒/分层流程按页面记录，三杯鸡页面的香菇清单矛盾原样保留 |
| Tiger 官方 | 豚肉とたけのこごはん、豚キムチ玄米ごはん、ほたて貝柱とえんどう豆の炊込みごはん、ステーキときのこの麦バターライス | [Tiger 官方食谱](https://www.tiger-corporation.com/ja/jpn/feature/recipe/)；猪肉/扇贝/牛排的安全或另锅步骤没有被改写成通用电饭煲合同 |
| Toshiba 官方 | たっぷりきのこの炊込みご飯、シーフードパエリア風炊込みご飯、石焼ビビンバ風炊込みご飯 | [Toshiba RCP-30R 食谱](https://www.toshiba-lifestyle.com/jp/pressure-cookers/recipes/)；压力、白米刻度和总时长仅限 RCP-30R，不外推毫升或其他机型 |
| 新疆地域政府 | 伊犁手抓饭 | [伊犁州政府原页](https://www.xjyl.gov.cn/xjylz/c112874/201811/7095a8856ee44c7eb86791f76602e0ed.shtml)；具名、羊肉/胡萝卜/洋葱/大米和分段焖煮有来源，克重、液体对象和电饭煲参数缺失 |

### 本轮明确不收录的候选

- 已存在的 NTUH 低钠西班牙炖饭、香港 FEHD 番茄杂菇鸡腿饭/南瓜冬菇猪肉炖饭、海南黎家竹筒饭、城口腊肉饭和 Panasonic 深川饭：保留既有身份，不重复建 ID。
- 澳门葡式海鲜饭：澳门旅游局页面只有身份和餐厅叙述，没有克重、人数、器具、时间或安全合同，记为 `discovery_only`。
- 傈僳族拌饭、册亨布依族手抓饭、广水拐子饭：米饭与肉菜分开或属于熟饭拼盘，暂不冒充生米一锅主餐。
- 湘西苗族南瓜饭、象印泡菜牛肉饭：分别缺现代器具/安全或固定液体边界，进入下一轮线索，不用推断填补。

本轮之后目录状态为 `279` 条：`executable=12`、`recipe_fact_checked=262`、`identity_verified=5`、`kitchen_observed=0`。下轮仍按“来源直接打开、状态如实、当天落账”的节奏推进；搜集数量不替代合同闭合和厨房验证。

日期：2026-08-05  
状态：研究线索台账；其中标记“r41/r42/r43/r44/r45 已登记”的候选已进入对应目录版本，其余仍不得公开、晋升或部署

本轮 r45 已登记：牡蠣とねぎの炊き込みご飯、炊込みシーフードピラフ、チキンのクリームピラフ、芋香珍穀飯、鮮魚野菇炊飯、紅鳳菜雞肉炊飯、高纖南瓜飯、普羅旺斯野菇雞起司燉飯、南瓜香菇鸡腿焖饭、小米杂粮饭、三色藜麦饭、牛蒡炊飯、五穀雜糧飯、塔城風乾肉抓飯、廬陵鼎罐飯、石柱土家洋芋飯。前 13 条为 `recipe_fact_checked`，后 3 条为 `identity_verified`；没有新增 `executable`，也没有新增 `kitchen_observed`。Panasonic、九阳条目保持型号/程序边界，地域身份条目不补写电饭煲合同。

本轮 r44 已登记：麻油雞丁糯米糕、鯛魚毛豆炊飯、雜糧干貝海鮮蒸臺灣藜飯、鮮筍五行炊飯、茶油綠竹筍炊飯、松子雞肉野菇炊飯、鮪魚菇菇洋蔥紅藜麥炊飯、炙燒黃金菇菇雞炊飯、牛肉南瓜焖饭、CUCKOO 鲍鱼锅饭、Instant Pot 椰香鸡肉饭、Instant Pot 托斯卡纳鸡肉饭、Instant Pot 茄子饭、Instant Pot 菠菜鹰嘴豆饭、彭水鼎罐饭、永春排骨咸饭（身份登记）、菇菌雜蔬釜飯、菜心瑤柱飯。登记不等于 executable；其中永春排骨咸饭仅有非遗身份，彭水鼎罐饭和香港釜饭保留原器具边界。

本轮 r41 已登记：糙米鮭魚炊飯、十香飯、蔬菜雞肉飯、番紅花海鮮飯、三菇飯、客家菜飯、廣島蠔雜菇煲仔飯、Panasonic 三条机型配方、玉屏农家社饭、臘味煲飯、福州糟鴨飯、香港卫生署三条、澳门体育局两条、大同牛油果鸡肉炊饭。登记不等于 executable；缺口仍按目录字段保留。

本轮 r42 已登记：Tiger 泡菜饭、毛豆油豆腐饭、海鲜焖饭、当归麻油鸡饭、高堂焖、鲜虾荷叶饭、马帮锣锅饭、饭蒸腊味。登记不等于 executable；其中高堂焖、荷叶饭、锣锅饭和饭蒸腊味明确保留非电饭煲或熟饭边界。

本轮 r43 已登记：三文魚青毛豆藜麥飯、番茄雜菇雞腿肉飯、南瓜冬菇豬肉燉飯、櫻花蝦冬菇雞肉藜麥飯、Hijiki Brown Rice、Bibimbap Style Rice、Vegetarian Mixed Brown Rice、春湖魚飯、鍋巴魚飯、黃魚飯。登记不等于 executable；香港图卡条目缺总时长/安全终点，鱼饭条目保留原器具与独立预处理边界。

以下候选由官方/机构来源研究线复核到直接打开的页面。它们先进入下一批追溯清单，尚未写入 `source-backed-one-pot-recipes.v1.json`，因为仍有器具、时间、安全或重复身份需要整合者逐条审查。

| 候选名称 | 直接来源 | 已证明的事实范围 | 当前缺口与边界 |
| --- | --- | --- | --- |
| 糙米鮭魚炊飯 | [台湾国民健康署 PDF](https://health99.hpa.gov.tw/storage/pdf/materials/22309.pdf) | 1 杯糙米、鲑鱼 100g、高丽菜、玉米笋、浸泡 2 小时、食材入电锅、煮熟后拌鱼并焖 10 分钟 | 内锅水量、总时长、鱼类安全终点未给；需与既有“鲑鱼什锦菇饭”区分身份 |
| 十香飯 | [台湾农粮署北区分署电子书](https://ebook.afa.gov.tw/tefd/ebook8/ebook8-1.html) | 米饭 300g、水 336g、腊肉/腊肠/豆干/香菇/虾米等十香配料、爆香后入饭锅蒸熟并焖 | **r41 已登记**；饭锅型号、总时长和安全终点未给，米饭/生米状态仍保留歧义，不能把饭锅事实改写成普通电饭煲合同 |
| 蔬菜雞肉飯 | [台湾农粮署北区分署电子书](https://ebook.afa.gov.tw/tefd/ebook8/ebook8-1.html) | 洋葱、番茄、鸡肉、鸡高汤、洋菇、米等用量；炒香后加入生米和鸡块煮熟；来源注明可用电锅 | **r41 已登记**；总时长、内锅程序、禽肉安全终点未给；不能先晋升 executable |
| 番紅花海鮮飯 | [台湾农粮署北区分署电子书](https://ebook.afa.gov.tw/tefd/ebook8/ebook8-1.html) | 米、水、透抽、贻贝、虾、干贝、青豆/胡萝卜/洋葱等结构；生米与配料处理后煮熟；来源注明可用电锅 | **r41 已登记**；“鸡高汤适量”与列明水量的关系需回看原文；电锅程序、时间和海鲜安全终点未闭合 |
| 三菇飯 | [台湾农粮署北区分署电子书](https://ebook.afa.gov.tw/tefd/ebook8/ebook8-1.html) | 蓬莱米、香菇、洋菇、金针菇、调味；菇类炒香后与米和水入电锅 | **r41 已登记**；没有蛋白质来源、总时长和安全终点；作为碳水+膳食纤维的素食候选，不能宣传为完整蛋白餐 |
| 四季米香粥 | [台湾农粮署北区分署电子书](https://ebook.afa.gov.tw/tefd/ebook8/ebook8-1.html) | 米、四季豆、瘦肉、葱和 3 杯水；先炒配料后加米水，小火约 20 分钟 | 普通锅而非电饭煲；若保留，须在目录中标为“同理念、非电饭煲边界”，不得偷换器具 |

## 整合规则

- 这些来源只证明表中列出的事实，不证明项目 Ratio DSL、跨机型参数或厨房成功。
- 不把不同来源的米水、时间、器具或安全事实拼成第三套配方。
- 候选先去重，再以 `identity_verified` / `recipe_fact_checked` 登记；任何 `executable` 晋升仍需完整合同、validator 通过和独立签署。
- 若连续两批新增合格候选少于 10 条，按搜集期规范停止放量，转入事实闭合与厨房验证。

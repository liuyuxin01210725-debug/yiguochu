# 一锅出来源型菜谱推进记录（2026-08-04）

## r51 搜集期第十二批（2026-08-05）

本批把两条高产来源线并行推进：日本农林水产省《うちの郷土料理》地域饭页面，以及象印官方 IH 锅食谱页。经逐页打开、去重和边界复核，新增 **12 条 `recipe_fact_checked`**；不晋升 `executable`，不修改前端、Worker、Planner、模板或 DeepSeek，不部署。目录版本由 `source-backed-one-pot-v1-20260807-national-r50` bump 为 `source-backed-one-pot-v1-20260807-national-r51`，条目从 328 增至 340：

- `executable`：12 → 12；
- `recipe_fact_checked`：311 → 323；
- `identity_verified`：5 → 5；
- `kitchen_observed`：0 保持不变。

### 完整新增清单（12 条，全部 `recipe_fact_checked`）

1. `maff-aichi-tako-meshi` — 爱知 `たこ飯（たこめし）`；
2. `maff-hiroshima-mihara-tako-meshi` — 广岛三原 `たこめし`；
3. `maff-saga-tsugani-meshi` — 佐贺 `つがにめし`；
4. `maff-hyogo-tako-meshi` — 兵库 `たこめし`；
5. `maff-miyazaki-torimeshi` — 宫崎 `とりめし`；
6. `maff-okayama-todomese` — 冈山 `とどめせ`；
7. `maff-shiga-shoimeshi` — 滋贺 `しょいめし`；
8. `zojirushi-endo-gohan` — 象印 `えんどうご飯`；
9. `zojirushi-corn-risotto` — 象印 `コーンリゾット`；
10. `zojirushi-turkish-risotto` — 象印 `トルコ風リゾット`；
11. `zojirushi-seafood-paella` — 象印 `海のパエリア`；
12. `zojirushi-stamina-rice` — 象印 `スタミナご飯`。

### 本批来源与边界

- 爱知、广岛三原、佐贺、兵库、宫崎、冈山、滋贺七条均来自农林水产省直接打开的地域料理页面，保留原名、地域、核心食材和原始流程；爱知/广岛/兵库的章鱼饭因原料形态和地域不同分列，不合并为“章鱼饭模板”。
- 佐贺 `つがにめし` 保留传统釜和河蟹流程，但活淡水蟹的寄生虫与充分加热终点未闭合，明确不进入默认家庭展示或 `executable`。
- 宫崎 `とりめし`、冈山 `とどめせ` 保留先炒/先煮具材后入釜、炊后醋拌或再加配料的连续流程；不为“看起来一锅”删除中间步骤。滋贺 `しょいめし` 虽来源直接写炊饭器，时间和安全终点仍缺省。
- 象印五条严格绑定官方 IH 锅/保温锅来源：不把 IH 火力、水量或保温时间外推成普通电饭煲参数。`スタミナご飯` 的鸡蛋是锅外蛋皮，`コーンリゾット` 与 `トルコ風リゾット` 的蛋白角色偏弱，均只记录真实身份与边界，不宣称完整均衡主餐。
- 十二条都保持 `recipe_fact_checked`，未完成安全终点、厨房验证或人工签署，不能对外宣称已批准、已适配或可直接上线。

### 本批验证纪律

- 先新增 r51 失败测试，锁定版本、340 条总数、12 个 recipe ID、来源直接打开和全部非 executable；实现后目录专项测试 **208/208** 通过。
- 佐贺来源的传统釜 appliance scope、象印条目的 `JP-NATIONAL` 区域字段均由 validator 实测锁定；历史批次计数同步到 r51。
- 后续必须通过 `node tools/build-source-backed-one-pot-catalog.mjs --write`、`--check`、`node tools/check-source-backed-one-pot-catalog.mjs`、`node tools/check-recipes.mjs`、全量 Node 测试、Python 语法检查和 `git diff --check`；本批只涉及研究目录、测试和文档，不调用 DeepSeek、不改运行时、不部署 production，PR 继续保持 Draft。

## r50 搜集期第十一批（2026-08-05）

本批继续核验日本农林水产省《うちの郷土料理》饭料理页面，新增 **6 条 `recipe_fact_checked`**；不晋升 `executable`，不修改前端、Worker、Planner、模板或 DeepSeek，不部署。目录版本由 `source-backed-one-pot-v1-20260807-national-r49` bump 为 `source-backed-one-pot-v1-20260807-national-r50`，条目从 322 增至 328：

- `executable`：12 → 12；
- `recipe_fact_checked`：305 → 311；
- `identity_verified`：5 → 5；
- `kitchen_observed`：0 保持不变。

### 完整新增清单（6 条，全部 `recipe_fact_checked`）

1. `maff-kanagawa-ume-gohan` — 神奈川小田原 `梅ごはん`；
2. `maff-kagoshima-karaimo-gohan` — 鹿儿岛 `からいもごはん`；
3. `maff-aomori-goma-gohan` — 青森津轻 `ごまご飯`；
4. `maff-chiba-gonjuu` — 千叶馆山 `ごんじゅう`；
5. `maff-nagasaki-torimeshi` — 长崎谏早 `鶏飯（といめし）`；
6. `maff-kagoshima-keihan` — 鹿儿岛奄美 `鶏飯（けいはん）`。

### 本批来源与边界

- 六条均来自农林水产省直接打开的地域料理页面，保留原名、传承地域、核心食材和来源流程；`梅ごはん` 的 5–6 人范围不压成单一份数，`からいもごはん` 保留米与红薯同炊，`ごまご飯` 保留津轻蒸笼分两段蒸制。
- `ごんじゅう`、长崎 `鶏飯` 都是先炊饭、另锅处理具材再拌合的真实地方饭，不改写成生米一锅焖饭；鹿儿岛奄美 `鶏飯` 明确是白饭、鸡汤和配料组合的汤泡饭，收录用于地域目录但标记为严格一锅出之外的分段候选。
- `からいもごはん` 和 `ごまご飯` 的营养结构偏碳水/膳食纤维或脂肪，目录记录真实身份但不宣称完整均衡主餐；六条都未完成安全终点、厨房验证或普通电饭煲转换。

### 本批验证纪律

- 先新增 r50 失败测试，锁定版本、328 条总数、6 个 recipe ID、来源直接打开和全部非 executable；实现后目录专项测试 **207/207** 通过。
- 后续必须通过目录构建、聚合菜谱门禁、全量 Node 测试、Python 语法检查和 `git diff --check`；本批只涉及研究目录、测试和文档，不调用 DeepSeek、不改运行时、不部署 production，PR 继续保持 Draft。

## r49 搜集期第十批（2026-08-05）

本批继续按“真实具名、直接打开来源、状态不越级、器具边界不偷换”执行。检索日本农林水产省《うちの郷土料理》饭料理条目，去重后新增 **8 条 `recipe_fact_checked`**；不新增 `identity_verified`，不晋升 `executable`，不修改前端、Worker、Planner、模板或 DeepSeek，不部署。目录版本由 `source-backed-one-pot-v1-20260807-national-r48` bump 为 `source-backed-one-pot-v1-20260807-national-r49`，条目从 314 增至 322：

- `executable`：12 → 12；
- `recipe_fact_checked`：297 → 305；
- `identity_verified`：5 → 5；
- `kitchen_observed`：0 保持不变。

### 完整新增清单（8 条，全部 `recipe_fact_checked`）

1. `maff-okinawa-yafara-jushi` — 冲绳 `ヤファラジューシー`；
2. `maff-miyagi-harako-meshi` — 宫城亘理 `はらこ飯`；
3. `maff-yamaguchi-uni-meshi` — 山口萩 `うに飯`；
4. `maff-wakayama-kakimade-gohan` — 和歌山日高 `かきまでご飯`；
5. `maff-chiba-takatsu-torimeshi` — 千叶八千代 `高津のとり飯`；
6. `maff-kyoto-kuri-gohan` — 京都丹波 `栗ごはん`；
7. `maff-shimane-sazae-meshi` — 岛根隐岐 `さざえ飯`；
8. `maff-tokushima-chagome` — 德岛 `茶ごめ`。

### 本批来源与边界

- 八条均来自农林水产省直接打开的地域料理页面，保留页面原名、地域、核心食材和原始流程。没有把“鲑鱼亲子饭”“蝾螺饭”等同名不同地域版本合并。
- `ヤファラジューシー` 明确是高汤杂炊型软饭，不改称普通焖饭；`はらこ飯` 明确是鲑鱼、鲑鱼籽分段处理、用煮汁炊饭后装配；`かきまでご飯` 明确是先炊饭、另锅煮具、最后拌合；这些连续流程均原样保留。
- `うに飯` 的水量在来源中只写“少量/少于普通饭”，因此不建立液体合同；`さざえ飯` 的煮汁与水也没有固定数值，不补写推测量。
- `栗ごはん` 与 `茶ごめ` 属于季节/节庆或甜味米饭，结构化记录营养角色但不宣称为完整均衡主餐；搜集目录不因营养结构偏窄而抹除真实身份。
- 这 8 条都只作研究候选，未完成安全终点和厨房验证，不能对外宣称已批准、已适配或可直接上线。

### 本批验证纪律

- 先新增 r49 失败测试，锁定版本、322 条总数、8 个 recipe ID、来源直接打开和全部非 executable；实现后目录专项测试 **206/206** 通过。
- `node tools/build-source-backed-one-pot-catalog.mjs --write`、`--check`、`node tools/check-source-backed-one-pot-catalog.mjs` 均需通过；本批只涉及研究目录、测试和文档，不调用 DeepSeek、不改运行时、不部署 production，PR 继续保持 Draft。

## r48 搜集期第九批（2026-08-07）

本批按“尽可能搜集真实具名菜饭、证据门槛不降、器具边界不偷换”执行。三路并行检索后，主线只吸收直接打开的日本农林水产省地域料理页面、东芝与 Tiger 官方食谱；重复候选不再登记。新增 **12 条 `recipe_fact_checked`**，不新增 `identity_verified`，不晋升 `executable`，不修改前端、Worker、Planner、模板或 DeepSeek，不部署。目录版本由 `source-backed-one-pot-v1-20260807-national-r47` bump 为 `source-backed-one-pot-v1-20260807-national-r48`，条目从 302 增至 314：

- `executable`：12 → 12；
- `recipe_fact_checked`：285 → 297；
- `identity_verified`：5 → 5；
- `kitchen_observed`：0 保持不变。

### 完整新增清单（12 条，全部 `recipe_fact_checked`）

1. `maff-ibaraki-hamaguri-gohan` — 茨城 `はまぐりごはん`；
2. `maff-oita-amimeshi` — 大分 `あみめし`；
3. `maff-ishikawa-sazae-meshi` — 石川能登 `さざえめし`；
4. `maff-fukuoka-kashiwa-meshi` — 福冈 `かしわめし`；
5. `maff-kumamoto-tako-meshi` — 熊本天草 `たこ飯`；
6. `maff-hyogo-tofumeshi` — 兵库丹波 `とふめし`；
7. `maff-niigata-shoyu-okowa` — 新潟长冈 `しょうゆおこわ`；
8. `maff-hyogo-tanba-black-bean-rice` — 兵库丹波 `丹波黒豆ごはん`；
9. `maff-miyagi-bamboo-shoot-rice` — 宫城 `たけのこご飯`；
10. `maff-hokkaido-bibai-torimeshi` — 北海道 `美唄のとりめし`；
11. `toshiba-chinese-sticky-rice-rcp30r` — 东芝 RCP-30R `中華風おこわ`；
12. `tiger-oyster-mushroom-rice` — Tiger `カキときのこのごはん`。

### 本批来源与边界

- 农林水产省页面直接证明地域身份、核心食材和原方流程；蛤蜊饭保留“先处理、分离汤汁、饭熟后再焖”，大分干虾饭保留“将熟时后加”，章鱼饭保留来源并列的同炊/后拌变体，不把不同版本合并成一个新配方。
- 福冈鸡肉饭、兵库 `とふめし`、新潟酱油糯米饭明确存在“先炊饭/另锅处理/再拌或再蒸”的连续流程，目录如实记录，不为了“看起来一锅”抹掉器具转换。
- 东芝 RCP-30R 与 Tiger 条目严格绑定厂商机型/程序。Tiger 的牡蛎先煮、以汤汁配白米水位线、饭后再加入牡蛎和银杏；这些都不是普通电饭煲的通用参数，保持 `source_limited`，不外推。
- 现有四条鸟取/冈山记录同步纠正官方数量：`いただき` 改为米300g、油豆腐6个、牛蒡40g、胡萝卜40g、干香菇3枚；`いがい飯` 补入来源明确的3杯液体；`大山おこわ` 补齐竹笋150g、胡萝卜150g、香菇6枚、蒟蒻200g、牛蒡100g、四季豆100g、鱼竹轮100g；`蒜山おこわ` 补齐合数/根菜/蕗等来源金额。未据此晋升任何状态。
- 搜集期仍不补鱼贝禽安全终点、跨器具水量或缺失总时长；营养结构只用于研究筛选，不代替厨房实做和人工签署。

### 去重与暂不收录

- 鸟取、冈山、香川、德岛等 Agent 返回的地域条目大多已在 r47；本批只吸收当前目录缺失且来源能直接打开的条目。
- Toshiba `ひつまぶし風うな玉ごはん` 需要熟饭、另做鳗鱼和蛋后组合，登记为后续“熟饭二次烹饪”线索，不伪装成生米一锅饭。
- 所有新增条目保持 `recipe_fact_checked`；`executable=12`、`kitchen_observed=0` 不因搜集放量改变。

### 本批验证纪律

- 先新增 r48 失败测试，锁定版本、314 条总数、12 个 recipe ID、状态和来源直接打开；实现后专项测试 **205/205** 通过。
- `node tools/build-source-backed-one-pot-catalog.mjs --write`、`--check`、`node tools/check-source-backed-one-pot-catalog.mjs` 均通过；随后还要跑聚合菜谱门禁、全量 Node 测试、Python 语法检查和 `git diff --check`。
- 本批只涉及研究目录、测试、进度文档和派生目录；不调用 DeepSeek、不改运行时、不部署 production，PR 继续保持 Draft。

## r47 搜集期第八批（2026-08-07）

本批按“放量搜集、证据门槛不降、真实具名优先”执行。三路 Agent 分别检索厂商官方食谱、农林水产省地方料理库和日本/中国地域来源；主线逐条打开、去重并结构化。新增 **23 条 `recipe_fact_checked`**，不新增 `identity_verified`，不晋升 `executable`，不修改前端、Worker、Planner、模板或 DeepSeek，不部署 production。目录版本由 `source-backed-one-pot-v1-20260806-national-r46` bump 为 `source-backed-one-pot-v1-20260807-national-r47`，条目从 279 增至 302：

- `executable`：12 → 12；
- `recipe_fact_checked`：262 → 285；
- `identity_verified`：5 → 5；
- `kitchen_observed`：0 保持不变。

### 完整新增清单（23 条，全部 `recipe_fact_checked`）

1. `panasonic-tako-meshi-sr-x910e` — Panasonic SR-X910E たこめし；
2. `zojirushi-brown-rice-ih-pot` — 象印 IH 锅玄米炊饭；
3. `toshiba-sakuraebi-rice` — 东芝 RCP-30R 桜えびご飯；
4. `toshiba-sekihan-rcp30r` — 东芝 RCP-30R 赤飯；
5. `toshiba-kuri-okowa` — 东芝 RCP-30R 栗おこわ；
6. `panasonic-sekihan-nf-ac1000` — Panasonic NF-AC1000 赤飯机型变体；
7. `tiger-beef-matsutake-rice` — Tiger 牛肉松茸ごはん；
8. `tiger-steamed-abalone-rice` — Tiger 蒸しあわびの炊込みごはん；
9. `tiger-uni-rice` — Tiger うにごはん；
10. `maff-tottori-dondoroke-meshi` — 鸟取 どんどろけ飯；
11. `maff-tottori-itadaki` — 鸟取 いただき（ののこ饭）；
12. `maff-tottori-igai-meshi` — 鸟取 いがい飯；
13. `maff-ehime-shoyu-meshi` — 爱媛 しょうゆめし；
14. `maff-hiroshima-tai-meshi` — 广岛瀬户内 鯛めし；
15. `maff-kagawa-iriko-meshi` — 香川 いりこ飯；
16. `maff-okayama-tako-meshi` — 冈山仓敷 たこめし；
17. `maff-tottori-daisen-okowa` — 鸟取 大山おこわ；
18. `maff-okayama-hiruzen-okowa` — 冈山蒜山おこわ；
19. `maff-aichi-hebo-meshi` — 爱知 へぼ飯；
20. `maff-shimane-kujira-gohan` — 岛根 くじらご飯；
21. `maff-yamanashi-sanma-meshi` — 山梨 さんまめし；
22. `maff-tochigi-ayu-meshi` — 栃木 鮎めし；
23. `maff-tokushima-tai-meshi` — 德岛鸣门 鯛めし。

### 本批来源与边界

- 农林水产省页面直接证明地域身份、核心食材和原方流程；鸟取豆腐饭、いただき、冈山章鱼饭、广岛/德岛鲷饭等保留页面写明的先处理、同锅炊煮和出锅回拌步骤，不把不同地域的同名菜合并。
- Toshiba、Panasonic、Tiger、象印条目严格绑定官方机型或器具。压力锅水位、IH锅火力和 Tiger 水位线不转换为普通电饭煲的通用克数或程序；赤饭的豆类先煮、鲍鱼先蒸、牛肉先煮等连续步骤均保留。
- 大山おこわ、蒜山おこわ是传统蒸锅多阶段流程，列入研究目录但明确 `not_adapted`，不冒充电饭煲菜饭。
- へぼ飯、くじらご飯、海胆饭、鲍鱼饭等是真实具名但食材特殊或营养结构偏窄，目录只作研究候选并写明家庭可得性/营养提示；没有因此删掉真实身份，也没有把它们标成均衡主餐。
- 缺失的总时长、液体对象、鱼/禽/贝安全终点保持缺省；搜集层不以常识补齐，也不晋升 executable。

### 去重与暂不收录

- Panasonic 北海道玉米、山形芋煮、茨城番薯、神奈川しらす、长野鲑鱼、兵库黑枝豆、长崎ゆで干し大根等页面已在 r46 或更早目录中，未因同一官方列表重复登记。
- Tiger ひつまぶし風うな玉ごはん以及 Panasonic 丼类页面包含另煮米饭/另做浇头，不满足本批严格的生米同锅边界，留作线索而不入库。
- 和歌山かきまでご飯、香港菜心瑤柱飯属于熟饭与另锅配料组合，作为边界线索记录，不伪装成一锅主餐。

### 本批验证纪律

- 先新增 r47 失败测试，锁定版本、23 个 recipe ID、状态和来源；实现后目录数据专项测试 `204/204` 通过。
- 派生文档由 `node tools/build-source-backed-one-pot-catalog.mjs --write` 生成；随后跑 `--check`、`node tools/check-source-backed-one-pot-catalog.mjs`、`node tools/check-recipes.mjs`、全量 Node 测试、Python 语法检查和 `git diff --check`。
- 本批只涉及研究目录、研究文档、派生目录和测试；不调用 DeepSeek、不改运行时、不部署 production，PR 继续保持 Draft。

## r46 搜集期第七批（2026-08-06）

本批按“尽可能搜集真实具名一锅饭、搜集期放量但晋升门槛不降”执行。三个独立 Agent 分别检索日本农林水产省、厂商官方食谱和新疆地域政府来源；主线逐条打开、去重并结构化。新增 22 条 `recipe_fact_checked`，不新增 `identity_verified`，不晋升 `executable`，不修改前端、Worker、Planner、模板或 DeepSeek，不部署 production。目录版本由 `source-backed-one-pot-v1-20260805-national-r45` bump 为 `source-backed-one-pot-v1-20260806-national-r46`，条目从 257 增至 279：

- `executable`：12 → 12；
- `recipe_fact_checked`：240 → 262；
- `identity_verified`：5 → 5；
- `kitchen_observed`：0 保持不变。

### 完整新增清单（22 条，全部 `recipe_fact_checked`）

1. `jp-hiroshima-kakimeshi` — かき飯（日本农林水产省，广岛）；
2. `jp-shiga-amenoio-gohan` — あめのいおご飯（日本农林水产省，滋贺）；
3. `jp-miyagi-hokki-meshi` — ほっきめし（日本农林水产省，宫城）；
4. `jp-mie-tako-meshi` — たこ飯（三重伊势志摩）；
5. `jp-ehime-tako-meshi` — たこ飯（爱媛中予/今治）；
6. `jp-tomato-salmon-takikomi-gohan` — トマトと鮭の炊き込みごはん（熊本）；
7. `jp-okinawa-kufa-jushi` — クファジューシー（冲绳）；
8. `jp-hotate-daikon-takikomi-gohan` — ホタテと大根の炊き込みごはん（日本农林水产省）；
9. `cookpot-japanese-bamboo-tofu-skin-rice` — 日式竹筍油豆包炊飯（鍋寶）；
10. `cookpot-beef-wild-mushroom-rice` — 牛肉野菇炊飯（鍋寶）；
11. `cookpot-taro-chestnut-pork-rice` — 芋香栗子炊飯（鍋寶）；
12. `cookpot-gomoku-mixed-rice` — 五目炊飯（鍋寶）；
13. `cookpot-salted-mackerel-chicken-claypot-rice` — 鹹魚雞粒煲仔飯（鍋寶）；
14. `cookpot-three-cup-chicken-rice` — 三杯雞炊飯（鍋寶）；
15. `tiger-pork-bamboo-rice` — 豚肉とたけのこごはん（Tiger）；
16. `tiger-pork-kimchi-brown-rice` — 豚キムチ玄米ごはん（Tiger）；
17. `tiger-scallop-pea-rice` — ほたて貝柱とえんどう豆の炊込みごはん（Tiger）；
18. `tiger-steak-mushroom-barley-rice` — ステーキときのこの麦バターライス（Tiger）；
19. `toshiba-mixed-mushroom-ume-rice` — たっぷりきのこの炊込みご飯（Toshiba RCP-30R）；
20. `toshiba-seafood-paella-rice` — シーフードパエリア風炊込みご飯（Toshiba RCP-30R）；
21. `toshiba-bibimbap-mixed-rice` — 石焼ビビンバ風炊込みご飯（Toshiba RCP-30R）；
22. `ili-pilaf` — 伊犁手抓饭（伊犁哈萨克自治州人民政府）。

### 本批来源与边界

- 日本农林水产省条目均保留具名地域身份、来源原料和原器具流程；牡蛎、章鱼、扇贝、鱼类只记录来源写明的预处理，不自行添加温度或跨器具换算。三重与爱媛同名 `たこ飯` 因地域和配方不同分列，未合并。
- 鍋寶、Tiger、Toshiba 条目全部锁定官方产品/机型边界。水位线和压力程序不转换成普通电饭煲的毫升或通用时间；需要先炒、分层蒸煮或熟后回拌的菜，明确写进步骤，不包装成“所有材料一开始同锅”。
- `tiger-pork-kimchi-brown-rice` 的泡菜和豆芽配菜保留“熟后拌/另做配菜”边界；`tiger-steak-mushroom-barley-rice` 保留牛排另煎，不把配菜伪装成饭锅食材。
- `ili-pilaf` 只记录伊犁州政府页面明确的羊肉、胡萝卜、洋葱、油脂、大米和分段焖煮流程；“传说”不当作历史证据，固定克重、液体对象和电饭煲参数保持缺口。
- 研究目录不等于可展示菜谱：本批 22 条全部保持 `recipe_fact_checked`，均未厨房验证，不能宣称已批准、已适配或已保证安全。

### 去重与暂不收录

- 台湾 NTUH 低钠西班牙炖饭、香港 FEHD 番茄杂菇鸡腿饭/南瓜冬菇猪肉炖饭、海南黎家竹筒饭、城口腊肉饭和 Panasonic 深川饭均已在现有目录中，未因换来源或换译名重复登记。
- 爱媛/三重以外的同名抓饭、熟米拼盘、拐子饭和傈僳族手抓饭要么不是生米同锅，要么只开放身份标准，没有被强行纳入本批。
- 象印泡菜牛肉饭、澳门葡式海鲜饭和湘西苗族南瓜饭保留为下一轮线索：目前缺型号/液体/安全或完整流程事实，不用搜索摘要填空。

### 本批验证纪律

- 先新增 r46 失败测试，锁定版本、22 个 recipe ID、状态和来源直接打开；实现后目录数据专项测试 `204/204` 通过。
- 派生文档由 `node tools/build-source-backed-one-pot-catalog.mjs --write` 生成；随后必须跑 `--check`、`node tools/check-source-backed-one-pot-catalog.mjs`、`node tools/check-recipes.mjs`、全量 Node 测试、Python 语法检查和 `git diff --check`。
- 本批只涉及研究目录、研究文档、派生目录和测试；不调用 DeepSeek、不改运行时、不部署 production，PR 继续保持 Draft。

## r45 搜集期第六批（2026-08-05）

本批按“搜集放量、晋升门槛不降”执行，由 Panasonic Foodable、台湾机构/医院、九阳官方说明书和大陆地域来源并行检索，再由主线去重与结构化。新增 16 条具名来源型条目；不修改前端、Worker、Planner、模板或 DeepSeek，不晋升 `executable`，不部署。目录版本由 `source-backed-one-pot-v1-20260805-national-r44` bump 为 `source-backed-one-pot-v1-20260805-national-r45`，条目从 241 增至 257：

- `executable`：12 → 12；
- `recipe_fact_checked`：227 → 240；
- `identity_verified`：2 → 5；
- `kitchen_observed`：0 保持不变。

### 完整新增清单（16 条；13 条 `recipe_fact_checked`，3 条 `identity_verified`）

1. `panasonic-oyster-negi-takikomi-rice` — 牡蠣とねぎの炊き込みご飯（Panasonic Foodable）；
2. `panasonic-tokyo-seafood-pilaf` — 炊込みシーフードピラフ（Panasonic Foodable）；
3. `panasonic-chicken-cream-pilaf` — チキンのクリームピラフ（Panasonic Foodable）；
4. `taiwan-taro-multigrain-rice` — 芋香珍穀飯（台湾国民健康署）；
5. `taiwan-fresh-fish-wild-mushroom-rice` — 鮮魚野菇炊飯（台湾机构来源）；
6. `taiwan-red-amaranth-chicken-rice` — 紅鳳菜雞肉炊飯（台湾农业部知识入口）；
7. `taiwan-high-fiber-pumpkin-rice` — 高纖南瓜飯（台湾农业部农粮署）；
8. `taiwan-provencal-mushroom-chicken-risotto` — 普羅旺斯野菇雞起司燉飯（世新大学教育手册）；
9. `joyoung-pumpkin-shiitake-chicken-rice` — 南瓜香菇鸡腿焖饭（九阳 JRC-4TD01）；
10. `joyoung-millet-corn-multigrain-rice` — 小米杂粮饭（九阳 JRC-4IHN42）；
11. `joyoung-three-color-quinoa-rice` — 三色藜麦饭（九阳 JRC-4IHN42）；
12. `taiwan-burdock-rice` — 牛蒡炊飯（南投县政府卫生局）；
13. `taiwan-five-grain-rice` — 五穀雜糧飯（台湾农业部知识入口）；
14. `tacheng-air-dried-meat-pilaf` — 塔城風乾肉抓飯（塔城地区行政公署，身份登记）；
15. `luling-dingpot-rice` — 廬陵鼎罐飯（国家标准信息公共服务平台，身份登记）；
16. `shizhu-tujia-potato-rice` — 石柱土家洋芋飯（重庆市规划和自然资源局，身份登记）。

### 本批证据与边界

- Panasonic 三条是 Foodable 的指定机型配方，保留机型、程序、水位/高汤和前处理边界；牡蛎条目另记录来源明确的水位标记，不把厂商参数外推为通用电饭煲合同，也没有补写来源未给出的时间或安全温度。
- 台湾机构条目补充芋头珍谷饭、鱼菇炊饭、红凤菜鸡肉炊饭、高纤南瓜饭、普罗旺斯野菇鸡起司炖饭、牛蒡炊饭和五谷杂粮饭。纯谷物/蔬菜条目只标碳水与膳食纤维，不宣传为完整蛋白餐；缺水量、时长或安全终点的字段保持缺省。
- 九阳三条严格绑定 JRC-4TD01/JRC-4IHN42 说明书。南瓜香菇鸡腿焖饭保留“先机内翻炒、再焖饭”，两条杂粮饭保留原机型杂粮程序和原始克数，不为其他型号推导参数。
- 塔城风干肉抓饭、庐陵鼎罐饭、石柱土家洋芋饭只登记来源直接证明的地域身份与核心组合；固定份量、液体、总时长、安全终点和现代电饭煲适配均保持空白，不把身份条目伪装成可执行配方。
- 本批的营养结构字段用于研究筛选，不替代厨房验证；洋芋饭明确记录为碳水/蔬菜结构，不宣称均衡蛋白主餐。

### 去重、跳过与后续线索

- 已与现有 `macau-tomato-corn-rice`、`macau-scallop-mushroom-vegetable-rice`、`taichung-encounter-happiness-taro-rice`、`chaoshan-ke-rice`、`yuping-dong-she-rice` 等具名条目去重，没有因为换语言或换器具重复登记。
- 美的牛肉南瓜焖饭、厂商腊味饭等已存在或与现有身份重复的线索跳过；纯碳水候选和“剩饭一锅”继续只登记为后续研究线，不混入本批生米主线。
- 台湾农业部芝麻鸡 PDF 因直接内容仍需复核，保留为中等优先研究线索，不以搜索摘录补入目录。

### 本批验证纪律

- 先新增失败测试，锁定 r45 版本、状态分布和 16 个 recipe ID；实现后目录专项测试 `203/203` 通过。
- `node tools/build-source-backed-one-pot-catalog.mjs --write`、`node tools/check-source-backed-one-pot-catalog.mjs`、`node tools/build-source-backed-one-pot-catalog.mjs --check` 均通过，派生目录同步为 257 条。
- 本批只涉及研究目录、测试和派生文档；不调用 DeepSeek、不改运行时、不部署 production，PR 继续保持 Draft。`executable=12`、`kitchen_observed=0` 不因搜集放量改变。

## r44 搜集期第五批（2026-08-05）

本批按“搜集放量、晋升门槛不降”执行，由港台机构、厂商和大陆地域三路 Agent 并行检索，再由主线去重与结构化。新增 18 条具名来源型条目；不修改前端、Worker、Planner、模板或 DeepSeek，不晋升 `executable`，不部署。目录版本由 `source-backed-one-pot-v1-20260805-national-r43` bump 为 `source-backed-one-pot-v1-20260805-national-r44`，条目从 223 增至 241：

- `executable`：12 → 12；
- `recipe_fact_checked`：210 → 227；
- `identity_verified`：1 → 2；
- `kitchen_observed`：0 保持不变。

### 完整新增清单（18 条；17 条 recipe_fact_checked，1 条 identity_verified）

1. `taiwan-sesame-oil-chicken-glutinous-rice-cake` — 麻油雞丁糯米糕（台湾国民健康署/农业部官方 PDF）；
2. `taiwan-tilapia-edamame-rice` — 鯛魚毛豆炊飯（台湾农业部/国民健康署官方）；
3. `taiwan-multigrain-scallop-seafood-quinoa-rice` — 雜糧干貝海鮮蒸臺灣藜飯（台湾国民健康署官方 PDF）；
4. `taiwan-five-elements-bamboo-shoot-rice` — 鮮筍五行炊飯（台湾国民健康署/内湖健康服务中心官方 PDF）；
5. `taiwan-tea-oil-bamboo-shoot-chicken-rice` — 茶油綠竹筍炊飯（台北市文山区公所官方 PDF）；
6. `taiwan-pine-nut-chicken-wild-mushroom-rice` — 松子雞肉野菇炊飯（台湾农业部官方入口，页面标注外部作者）；
7. `taiwan-tuna-mushroom-quinoa-rice` — 鮪魚菇菇洋蔥紅藜麥炊飯（台湾国民健康署官方 PDF）；
8. `taiwan-golden-mushroom-chicken-rice` — 炙燒黃金菇菇雞炊飯（台湾国民健康署官方竞赛 PDF）；
9. `midea-beef-pumpkin-rice` — 牛肉南瓜焖饭（美的官方试用报告）；
10. `cuckoo-abalone-pot-rice` — Abalone Pot Rice with the CR-0675F（CUCKOO America 官方）；
11. `instant-pot-coconut-chicken-pineapple-rice` — Coconut Chicken and Rice with Pineapple Salsa（Instant Pot 官方）；
12. `instant-pot-tuscan-chicken-rice` — Tuscan Chicken and Rice（Instant Pot 官方，页面署名 Chop Secrets）；
13. `instant-pot-eggplant-rice` — Eggplant Rice（Instant Pot 官方，页面署名 Subhadra Burugula）；
14. `instant-pot-spinach-chickpea-rice` — Dump & Done Spinach Rice & Chickpeas（Instant Pot 官方，页面署名 Vegan Richa）；
15. `pengshui-dingpot-rice` — 彭水鼎罐饭（彭水县政府非遗名录 + 地方工艺报道）；
16. `yongchun-pork-rib-salted-rice` — 永春排骨咸饭（永春县政府非遗名录，身份登记）；
17. `hk-mushroom-mixed-vegetable-kamameshi` — 菇菌雜蔬釜飯（香港卫生署 EatSmart）；
18. `hk-choy-sum-scallop-rice` — 菜心瑤柱飯（香港卫生署官方 PDF）。

### 本批证据与边界

- 台湾 8 条补充了麻油糯米糕、鱼饭、藜饭、竹笋炊饭和菇鸡炊饭等低重复具名资产；缺水量、时间、温度或前炒/后烤边界的字段保持缺省，没有把“外锅水”偷换成内锅液体。
- 美的、CUCKOO 和 Instant Pot 记录的是指定厂商/机型事实。CUCKOO 页面同时出现罐装与鲜鲍鱼描述，Instant Pot 条目保留压力锅与 Sauté 边界，不外推普通电饭煲。
- 彭水鼎罐饭保留铁质鼎罐/火塘和地方工艺，水米约 3:1 只留为待核线索；永春排骨咸饭目前只有县政府非遗身份，未把民间配料线索写进结构化字段。
- 香港菇菌杂蔬釜饭需要自制素上汤、汆烫和前炒，菜心瑶柱饭是电饭煲煮饭后拌入菜心；两条都没有被改写成模板组合或可直接执行的跨器具配方。
- 本批不新增 `executable`，不新增 `kitchen_observed`；研究目录的数量增长不改变公开、签署和厨房实做门槛。

### 本批排除与后续线索

- 温岭炒炊饭属于熟糯米二次烹调，登记为“剩饭一锅”候选，不进入当前生米主线。
- 鲜筍五行炊飯、松子鸡肉野菇炊饭等虽有官方页面，仍缺完整水量/安全或来源原创性，保持 `recipe_fact_checked`。
- Instant Pot Chipotle Chicken and Rice、Russell Hobbs 鲑鱼饭与若干 Philips/Cuckoo 腊味饭因家族重复或安全/形态缺口留在研究线，不为数量重复入库。
- 彭水馇菜饭、台山黄鳝饭、麻涌龙船饭等仍只具身份或搜索摘录证据，未越级。

### 本批验证纪律

- 先新增失败测试，锁定 r44 版本、状态分布和 18 个 recipe ID；实现后目录专项测试 `202/202` 通过。
- `node tools/build-source-backed-one-pot-catalog.mjs --write`、`node tools/check-source-backed-one-pot-catalog.mjs`、`node tools/build-source-backed-one-pot-catalog.mjs --check` 和 `node tools/check-recipes.mjs` 全部通过；来源目录版本为 r44。
- 本批只涉及研究目录、测试和派生文档；不改运行时、不调用 DeepSeek、不部署 production，PR 继续保持 Draft。

## r43 搜集期第四批（2026-08-05）

本批继续由香港机构、厂商和大陆地域三路 Agent 并行检索，新增 10 条具名、来源直达、低重复的研究条目；不修改前端、Worker、Planner、模板或 DeepSeek，不晋升 `executable`，不部署。目录版本由 `source-backed-one-pot-v1-20260805-national-r42` bump 为 `source-backed-one-pot-v1-20260805-national-r43`，条目从 213 增至 223：

- `executable`：12 → 12；
- `recipe_fact_checked`：200 → 210；
- `identity_verified`：1 → 1；
- `kitchen_observed`：0 保持不变。

### 完整新增清单（10 条，全部 `recipe_fact_checked`）

1. `hk-salmon-edamame-quinoa-rice` — 三文魚青毛豆藜麥飯（香港食物環境衛生署）；
2. `hk-tomato-mushroom-chicken-rice` — 番茄雜菇雞腿肉飯（香港食物環境衛生署）；
3. `hk-pumpkin-shiitake-pork-rice` — 南瓜冬菇豬肉燉飯（香港食物環境衛生署）；
4. `hk-sakura-shrimp-chicken-quinoa-rice` — 櫻花蝦冬菇雞肉藜麥飯（香港食物環境衛生署）；
5. `tiger-hijiki-brown-rice` — Hijiki Brown Rice（Tiger Corporation）；
6. `tiger-bibimbap-style-rice` — Bibimbap Style Rice（Tiger Corporation）；
7. `toshiba-vegetarian-mixed-brown-rice` — Vegetarian Mixed Brown Rice（Toshiba Lifestyle Hong Kong）；
8. `yangxin-spring-lake-fish-rice` — 春湖魚飯（阳新县人民政府）；
9. `huarong-guoba-fish-rice` — 鍋巴魚飯（华容县人民政府）；
10. `taizhou-yellowfish-rice` — 黃魚飯（中国新闻网转载台州发布）。

### 本批证据与边界

- 香港四条保留图卡中的生米/藜麦、电饭煲投料顺序和水量；总时长、禽肉/鱼类安全终点缺失处保持空白。
- Tiger 两条保留 Brown/Plain 程序边界；Toshiba 条目保留电压力锅和先炒后压的设备边界，不外推普通电饭煲。
- 春湖鱼饭是鲜鱼去骨后以鱼汤焖米；锅巴鱼饭需要鱼的独立预处理并让鱼不进入最终饭体；黄鱼饭只由来源支持柴灶鱼米同锅历史。三条都没有被伪装成可执行电饭煲配方。
- 本批未重复登记已存在的石扇鱼焖饭、台大鲑鱼什锦菇饭和野菇炊饭；也未把缺完整做法或自由替换的厂商线索纳入目录。

### 本批验证纪律

- 先新增失败测试，锁定 r43 版本、状态分布和 10 个 recipe ID；实现后目录专项测试 `210/210` 通过。
- 目录构建、来源目录检查、聚合菜谱门禁和 Python 语法检查均通过；全量 Node 测试单线程退出码为 0。
- 本批只涉及研究目录、测试和文档；不调用 DeepSeek、不部署 production，PR 继续保持 Draft。

## 当前结论（r43）

搜集层已从 213 条扩到 223 条，研究池继续增加真实地域和厂商饭类；`executable=12`、`kitchen_observed=0` 没有改变。数量仍不等于可公开，下一步依旧是来源闭合、独立签署和厨房实做。

## r42 搜集期第三批（2026-08-05）

本批继续由厂商、机构和大陆地域三路 Agent 并行检索，主线只吸收具名、低重复、来源直达的研究条目；不修改前端、Worker、Planner、模板或 DeepSeek，不晋升 `executable`，不部署。目录版本由 `source-backed-one-pot-v1-20260805-national-r41` bump 为 `source-backed-one-pot-v1-20260805-national-r42`，条目从 205 增至 213：

- `executable`：12 → 12；
- `recipe_fact_checked`：192 → 200；
- `identity_verified`：1 → 1；
- `kitchen_observed`：0 保持不变。

### 完整新增清单（8 条，全部 `recipe_fact_checked`）

1. `tiger-kimchi-rice` — Kimchi Rice（Tiger Corporation）；
2. `tiger-edamame-fried-tofu-rice` — Edamame and Fried Tofu Rice（Tiger Corporation）；
3. `tiger-seafood-pilaf` — Seafood Pilaf（Tiger Corporation）；
4. `taiwan-angelica-sesame-chicken-rice` — 當歸麻油雞飯（台湾农业部农业知识入口网）；
5. `raoping-gaotang-pork-rice` — 高堂焖（饶平县人民政府）；
6. `guangzhou-shrimp-lotus-leaf-rice` — 鮮蝦荷葉飯（广州市人民政府文化广电旅游局）；
7. `yunnan-mabang-luoguo-rice` — 马帮锣锅饭（中央广播电视总台、云南网）；
8. `hubei-steamed-cured-meat-rice` — 饭蒸腊味（湖北省文化和旅游厅）。

### 本批证据与边界

- Tiger 三条保留厂商原名、机型/Plain 程序和“同锅”范围；毛豆油豆腐饭明确记录毛豆另煮后拌入，海鲜焖饭保留来源的开放海鲜集合，不把它扩写成自由替换规则。
- 当归麻油鸡饭保留先炒鸡块/香菇、米酒浸泡和电锅煮熟流程；“白米或红糯米”是来源分支，不合并成一套固定配方。
- 高堂焖是地方政府记录的猪肉煎炒后拌米饭，鲜虾荷叶饭是荷叶包裹煮/蒸，马帮锣锅饭是铜锣锅火塘慢烤，饭蒸腊味是熟米饭与腊味同蒸；四条均保留原器具和米态，不伪装成电饭煲生米焖饭。
- 缺固定克重、液体、时间、安全终点或家庭适配的字段保持 `null`；没有将不同来源拼成第三套比例，也没有因为营养角色缺失而删除真实菜名。

### 本批排除与后续线索

- Zojirushi 官方 app 菜页自动抓取返回 403，New Orleans 红豆饭、鸡肉干咖喱、蟹肉胡萝卜饭等暂留“官方受限来源”线索，待人工打开/归档后再登记。
- Tefal 双层蒸篮、Tiger Tacook 双腔、AFA 新疆抓饭/海南鸡饭等存在另锅或双腔流程，先放 evidence-only，不把器具边界偷换成严格一锅。
- 客家創意地瓜飯、三菇飯、番紅花海鮮飯、蔬菜雞肉飯等已在 r41 或更早目录中，本批没有重复建 ID。

### 本批验证纪律

- 先新增失败测试，锁定 r42 版本、状态分布和 8 个 recipe ID；实现后专项测试 `200/200` 通过。
- 目录构建脚本已生成 CSV/Markdown/gaps 派生产物；随后仍需跑聚合菜谱门禁和全量回归。
- 本批只涉及研究目录、测试和文档；不改运行时、不调用 DeepSeek、不部署 production，PR 继续保持 Draft。

## 当前结论（r42）

搜集层已从 205 条扩到 213 条，新增资产仍处于研究状态；`executable=12`、`kitchen_observed=0` 没有改变。数量增加不等于可以公开，后续继续按“来源闭合 → 独立签署 → 厨房实做”推进。

## r41 搜集期第二批（2026-08-05）

本批由厂商、卫生/农业机构和地域文化三路 Agent 并行检索，再由主线逐条去重和结构化。只扩大来源型研究目录，不修改前端、Worker、Planner、模板或 DeepSeek；不晋升 `executable`，不部署。目录版本由 `source-backed-one-pot-v1-20260805-national-r40` bump 为 `source-backed-one-pot-v1-20260805-national-r41`，条目从 186 增至 205：

- `executable`：12 → 12；
- `recipe_fact_checked`：173 → 192；
- `identity_verified`：1 → 1；
- `kitchen_observed`：0 保持不变。

### 完整新增清单（19 条，全部 `recipe_fact_checked`）

1. `taiwan-brown-rice-salmon-rice` — 糙米鮭魚炊飯（台湾国民健康署/内湖健康服务中心）；
2. `taiwan-ten-fragrant-rice` — 十香飯（台湾农粮署北区分署）；
3. `taiwan-vegetable-chicken-rice` — 蔬菜雞肉飯（台湾农粮署北区分署）；
4. `taiwan-saffron-seafood-rice` — 番紅花海鮮飯（台湾农粮署北区分署）；
5. `taiwan-three-mushroom-rice` — 三菇飯（台湾农粮署北区分署）；
6. `hakka-electric-cooker-rice` — 客家菜飯（桃园市政府客家事务局）；
7. `hk-hiroshima-oyster-mushroom-claypot-rice` — 廣島蠔雜菇煲仔飯（香港食物环境卫生署）；
8. `panasonic-one-pot-chicken-rice` — One Pot Chicken Rice（Panasonic Australia，SR-HL151）；
9. `panasonic-chicken-vegetable-rice` — Chicken Vegetable Rice（Panasonic Australia，SR-DF181WST）；
10. `panasonic-claypot-style-chicken-rice` — Claypot Style Chicken Rice（Panasonic Malaysia）；
11. `yuping-farmer-she-rice` — 玉屏农家社饭（铜仁市人民政府门户网站）；
12. `taiwan-cured-pot-rice` — 臘味煲飯（台湾农粮署北区分署）；
13. `taiwan-fuzhou-drunk-duck-rice` — 福州糟鴨飯（台湾农粮署北区分署）；
14. `hk-pumpkin-taro-chicken-claypot-rice` — 南瓜芋頭雞粒煲仔飯（香港卫生署有营食谱）；
15. `hk-yam-longan-chicken-claypot-rice` — 淮山圓肉雞柳煲仔飯（香港卫生署有营食谱）；
16. `hk-taro-shrimp-multigrain-steamed-rice` — 芋頭鮮蝦五穀蒸飯（香港卫生署有营食谱）；
17. `macau-scallop-mushroom-vegetable-rice` — 帶子磨菇菜飯（澳门特别行政区政府体育局）；
18. `macau-tomato-corn-rice` — 蕃茄粟米飯（澳门特别行政区政府体育局）；
19. `tatung-avocado-chicken-rice` — アボカド鶏肉炊き込みご飯（大同电锅日本官方）。

### 本批证据与边界

- 19 条均保留来源中的真实菜名、器具和高层流程；没有把食材自由组合成新菜名，也没有把近似家族误报成相同传统菜。
- 19 条均有直接打开的 HTTPS 来源与定位，状态全部停在 `recipe_fact_checked`。缺固定份数、总时间、液体对象或安全终点的字段保持 `null`，不以常识补齐。
- 台湾“十香飯”原文同时出现“米飯”措辞与生米浸泡/煮制步骤，米的生熟状态未消歧；番紅花海鮮飯同时列出水量和“鸡高汤适量”，不取平均、不拼第三套液体合同。
- 砂锅/瓦煲/蒸锅条目（香港三条、福州糟鸭、玉屏社饭等）只记录原器具事实；Panasonic 和大同条目保留机型、水位线与程序边界，不外推成普通电饭煲规则。
- 三菇飯明确标为碳水+膳食纤维结构，不宣称含完整蛋白；澳门番茄粟米饭同样不宣称完整蛋白餐。这是营养边界，不是排除真实菜名的理由。

### 去重与未入库候选

- 既有 `taiwan-pumpkin-rice` 已覆盖《南瓜飯》，本批不重复新增；既有 `ntuh-low-sodium-spanish-paella-rice` 和 `tatung-cajun-chicken-rice` 也只作为候选来源复核，不重复建条目。
- Zojirushi/Tiger/Toshiba/Panasonic 的“五目/炊込み”高度同家族，本批不继续堆叠同名 canonical；保留为后续交叉证据候选。
- 石扇鱼焖饭、华容锅巴鱼饭、赤坎煲仔饭、台山油饭、磐安竹筒饭、印江社饭、黔江土家社饭等大陆地域候选已核到官方身份/工艺来源，但克数、液体、器具或安全边界仍缺，记录在研究报告，不为了数量越过本批结构化边界。
- 泉州萝卜饭、深沪壶仔饭与现有研究目录重复；九阳“懒人焖饭”与现有腊肠什锦版重复，均不重复入库。

### 本批验证与提交纪律

- 先新增失败测试，锁定 r41 版本、状态分布和 19 个 recipe ID；目录数据专项测试 `199/199` 通过。
- `node tools/check-source-backed-one-pot-catalog.mjs` 与 `node tools/build-source-backed-one-pot-catalog.mjs --check` 作为本批验收门；所有来源仍遵循 scope 只声明实际支撑事实的规则。
- 本批只涉及研究目录、测试和文档；不改运行时、不调用 DeepSeek、不部署 production，PR 继续保持 Draft。
- 本批应在当天拆分为 `data:`、`docs:`、`test:` 提交；下一轮报告必须继续列出版本、状态分布和完整新增/晋升清单。

## 当前结论（r41）

搜集层已从 186 条扩到 205 条，研究池更丰富，但 `executable=12`、`kitchen_observed=0` 的事实没有改变。研究池不是公开菜单，后续仍按“来源闭合 → 独立签署 → 厨房实做”逐级推进；任何条目都不能因为数量增加而绕过证据门槛。

## r40 搜集期首批（2026-08-05）

本批按《搜集期执行规范》只扩大研究目录，不修改前端、Worker、Planner、模板或 DeepSeek，不晋升 `executable`，不部署。目录版本由 `source-backed-one-pot-v1-20260805-national-r39` bump 为 `source-backed-one-pot-v1-20260805-national-r40`，条目从 176 增至 186：

- `executable`：12 → 12；
- `recipe_fact_checked`：163 → 173；
- `identity_verified`：1 → 1；
- `kitchen_observed`：0 保持不变。

### 完整新增清单（10 条，全部 `recipe_fact_checked`）

1. `tiger-chicken-bamboo-rice` — 鶏肉たけのこごはん（Tiger 日本官方，JP）；
2. `tiger-whitefish-mixed-rice` — 白身魚の炊込みごはん（Tiger 日本官方，JP）；
3. `tiger-chinese-sticky-rice` — 炊込み中華おこわ（Tiger 日本官方，JP）；
4. `tiger-shirasu-tomato-multigrain-rice` — 釜揚げしらすとトマトの雑穀ごはん（Tiger 日本官方，JP）；
5. `tiger-mackerel-aromatic-barley-rice` — さばの香味麦炊込みごはん（Tiger 日本官方，JP）；
6. `tiger-hamo-rice` — はもごはん（Tiger 日本官方，JP）；
7. `tiger-duck-matsutake-rice` — 鴨ロースと松茸の炊込みごはん（Tiger 日本官方，JP）；
8. `ntuh-salmon-mixed-mushroom-rice` — 鮭魚什錦菇飯（台大医院营养室官方 PDF，TW）；
9. `ntuh-wild-mushroom-rice` — 野菇炊飯（台大医院官方 PDF，TW）；
10. `sichuan-rice-cooker-pork-ribs-rice` — 排骨焖饭（Woks of Love 原创页面，CN-SC）。

### 本批证据与边界

- 10 条均有直接打开的 HTTPS 来源、来源定位和明确 `evidence_tier`；7 条来自厂商官方食谱页（tier 3）、2 条来自医院官方食谱 PDF（tier 4）、1 条来自可信原创菜谱页（tier 5）。
- 10 条均记录真实来源名称、核心食材和高层流程；没有把菜名按食材自由拼接，也没有把不同版本的米水、时间或器具参数合并。
- `tiger-whitefish-mixed-rice`、`tiger-chinese-sticky-rice`、`tiger-duck-matsutake-rice` 与排骨焖饭均明确保留预煎、预炒、预煮或出锅加料等连续流程；这些条目不是“全程一只锅”的假承诺。
- 两条台大医院来源没有给完整总分钟数或鱼类安全终点，因此对应字段保持缺省；没有用常识补齐。
- 排骨焖饭来源明确是四川家庭背景和标准电饭煲，但仍需独立的安全/厨房复核；未把原创作者的“高成功率”当成项目验证。
- 本批没有条目进入 `executable`，也没有新增 recipe 的公开状态。研究目录不等于可直接给用户照做的菜单。

### 去重与未入库候选

本批另外核验到但未入库的候选包括：`小米炊飯`（与既有小米根茎饭家族重复风险）、新疆抓饭/手抓饭（既有 `yutian-electric-cooker-lamb-pilaf` 的官方区域补证）、客家創意地瓜飯（已有同名条目）、三菇飯、十香飯、糙米鮭魚炊飯、蔬菜雞肉飯、番紅花海鮮飯，以及畲族乌饭、东安乌米饭等身份线索。它们分别进入下一批追溯或缺口清单，没有为了凑数量降级来源门槛。

### 本批验证与提交纪律

- 先新增失败测试，锁定 10 个 recipe ID、名称、状态和直接来源；实现后目录数据专项测试 `198/198` 通过；
- `node tools/build-source-backed-one-pot-catalog.mjs --write` 后 `node tools/check-source-backed-one-pot-catalog.mjs` 通过，生成的 Markdown/CSV 与 r40 一致；
- 本批仅涉及研究规范、目录数据、生成产物与数据测试；不改运行时、不部署 production，PR 继续保持 Draft；
- 本批工作区应在当日以单独 `data:`/`docs:`/`test:` 提交落账，后续报告继续列出完整新增/晋升清单。

## 当前结论

本轮继续做的是“真实菜名与真实来源的菜谱目录”，不是运行时自由组合，也不是用估算参数把研究条目伪装成可执行配方。

当前结构化目录版本为 `source-backed-one-pot-v1-20260805-national-r40`，共 186 条：

- `executable`：12 条（均仅内部审查用，未公开、未部署、未完成厨房验证）；
- `recipe_fact_checked`：173 条（身份和部分事实已核对，仍有一个或多个执行合同缺口）；
- `identity_verified`：1 条（只有身份来源，尚不能写成做法）。

目录与生成产物见：[source-backed-one-pot-recipes.v1.json](/Users/liuyuxin/Documents/一锅出/.worktrees/source-backed-one-pot-catalog/tools/data/source-backed-one-pot-recipes.v1.json:1)。

## r39 两道签署菜谱晋升记录（2026-08-05）

本轮没有新增条目、没有修改运行时，也没有部署。独立审查者已对 `de3615f` / r38 的来源范围、WOL 单一版本合同、两个 PDF 归档和真实 validator 晋升探针完成复核，并于 2026-08-05 明确签署两道菜准入。目录据此做唯一允许的状态变更：`executable=10`、`recipe_fact_checked=165`、`identity_verified=1` → `executable=12`、`recipe_fact_checked=163`、`identity_verified=1`。

- 腊味煲仔饭（`cantonese-cured-meat-claypot-rice`）：`recipe_fact_checked` → `executable`；独立审查者于 2026-08-05 签署通过。固定份量、液体、流程和总时间继续只采用 WOL 单一完整版本，其他地域、政府与厂商来源只按各自事实范围保留。
- 冬菇滑鸡饭（`cantonese-mushroom-chicken-claypot-rice`）：`recipe_fact_checked` → `executable`；独立审查者于 2026-08-05 签署通过。固定合同继续只采用 WOL 单一完整版本，Tefal、香港中华煤气和 TAFT 版本不与其拼接。
- `kitchen_observed=0` 保持不变；`executable` 只表示纸面执行合同与准入审查闭合，不表示已经做过、可以公开或可以部署。
- 手抓饭（`yutian-electric-cooker-lamb-pilaf`）因米量和“1:2”液体对象仍不明确，保持 `recipe_fact_checked`，不跨来源拼接。
- 咖喱鸡肉饭（`joyoung-curry-chicken-rice-jrc-4hp82`）因中英文程序事实冲突，保持 `recipe_fact_checked`，不选择任一版本强行闭合。

r38→r39 新增条目：0；晋升条目：2；完整晋升清单即上述腊味煲仔饭与冬菇滑鸡饭。

## r38 两道准入候选的来源卫生修复（2026-08-05）

本轮没有新增条目、没有晋升、没有修改运行时，也没有部署。`executable=10`、`recipe_fact_checked=165`、`identity_verified=1` 保持不变；腊味煲仔饭和冬菇滑鸡饭仍等待独立审查者明确签署。

- 两道菜中未实际支撑固定合同的广东身份来源，`claim_scopes` 已收窄到本条目实际使用的 `identity` / `ingredients`；所有来源均补齐显式 `evidence_tier`。WOL 仍是固定份量、液体、流程与总时间的唯一合同来源，没有跨版本拼接。
- 香港赛马会《臘味煲仔飯（四位用）》原始 PDF 已归档为 `docs/source-archives/hkjc-home-cooking-claypot-rice.pdf`，凭证页为第 1 页，SHA-256 为 `8a6ee548f61c509dfcbd046a5d034a7aee62c45e8ff265c6ba767c4df552c504`。
- Tefal 旧链接在本轮复核时返回 HTTP 404，因此没有把缓存文本冒充原文件。改用可直接下载的 Tefal 官方资产库 2020 版并归档为 `docs/source-archives/tefal-rice-cooker-recipe-book-2020.pdf`；该版本第 5 页（印刷第 4/5 页）明确是 4 人份、3 杯米、250 克鸡肉、6 至 8 只冬菇和 3 杯水位，SHA-256 为 `2d12043f40d8d423a04092b6b3b22ba34d690bad31503a23eacb433862cd4ca7`。它作为独立厂商版本保留，不替换或改写 WOL 合同。
- 新增测试会把两道菜的克隆临时标为 `executable`，并用仓库根目录校验全部来源分级、合同来源定位、PDF 文件存在与 SHA-256；真实条目仍保持 `recipe_fact_checked`，只证明“送审材料已具备”，不代替人工签署。

r37→r38 新增条目：0；晋升条目：0；状态分布变化：0。

## r37 第一组合同闭合记录（2026-08-05）

本轮只推进第一组剩余三道，没有新增条目、没有修改运行时，也没有把“合同闭合”等同于人工签署：

- [The Woks of Life：Hong Kong Clay Pot Rice](https://thewoksoflife.com/hong-kong-style-clay-pot-rice/) 提供同一完整版本中的 2 人份、1 杯长粒米、1 杯水、腊肉、1 至 2 条广式腊肠、调味、75 分钟总时长和砂锅流程。`cantonese-cured-meat-claypot-rice` 的固定批量、液体、流程和时间合同现全部只取自该版本，不与农粮署、香港赛马会或其他版本拼接。状态仍为 `recipe_fact_checked`，等待独立人工准入；没有厨房观察，不公开、不部署。
- [The Woks of Life：Chicken and Mushroom Clay Pot Rice](https://thewoksoflife.com/chicken-mushroom-clay-pot-rice/) 提供同一完整版本中的 2 人份、1 杯茉莉香米、1 杯低钠鸡高汤或水、去骨去皮鸡腿肉、冬菇等配料、190 分钟总时长和砂锅流程。`cantonese-mushroom-chicken-claypot-rice` 的固定批量、液体、流程和时间合同现全部只取自该版本，不与台湾农业部、香港中华煤气或 Tefal 版本拼接；74°C 安全终点仍由 FoodSafety.gov 独立支持。状态仍为 `recipe_fact_checked`，等待独立人工准入；没有厨房观察，不公开、不部署。
- `yutian-electric-cooker-lamb-pilaf` 本轮没有找到足以闭合同一家庭版本的新来源。于田来源仍是“大米适量”，且“1:2”对象不明确；其他搜索结果不能同时证明固定份数、米量、液体对象和完整时间，因此保持 `fixed_batch=null`、`liquid_contract=null`、`time_contract=null`，没有跨来源拼接或晋升。

r36→r37 状态分布不变：`executable=10`、`recipe_fact_checked=165`、`identity_verified=1`。本轮只新增两条来源并重建两道菜的结构化合同；人工签署与 `kitchen_observed` 仍是后续独立关口。

## 报告与准入纪律

从本记录起，每轮研究报告必须同时列出：

1. `catalog_version` 的前后变化；
2. 各状态数量的前后变化；
3. 全部新增条目与全部晋升条目，不得只挑部分菜谱举例。

validator 通过只是 `executable` 的送审资格，不是人工签署。任何条目晋升 `executable` 前，必须由独立审查者逐条核对来源与合同并明确签署；没有签署不得改状态。

本轮对 r1→r36 的10条 `executable` 做了追溯准入：9条厂商原方签署通过；上海咸肉菜饭原先附“需证明4人份”的条件，2026-08-05 已在 The Woks of Life 页面复核到 Recipe JSON-LD `recipeYield=["4"]`，页面菜谱卡同时显示 `Serves: 4`，条件解除并完成签署。所有10条仍只属内部 `executable`，没有厨房验证、公开或部署。

## 本轮已完成

### 1. 上海咸肉菜饭进入内部 executable

上海奉贤政府来源负责地域身份与家族流程；The Woks of Life 的独立砂锅版本提供 4 人份、米水比例、食材用量和约 1 小时的完整合同；FoodSafety.gov 提供混合主餐 74°C 安全终点。三者只按事实范围记账，不把砂锅参数改写成电饭煲参数。来源矩阵已同步更新为“内部 executable、仍需人工与厨房验证”。

来源：

- [上海市奉贤区人民政府：大雪节气村民做咸肉菜饭](https://www.fengxian.gov.cn/ymsmkfxjson/20221209/33096.html)
- [The Woks of Life：Shanghai Cai Fan](https://thewoksoflife.com/shanghai-cai-fan-rice-salted-pork-greens/)
- [FoodSafety.gov：安全最低中心温度](https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures)

### 2. 南瓜饭和香菇筍仔飯补齐直接来源定位

- [台湾农粮署：南瓜饭](https://ebook.afa.gov.tw/tefd/ebook5/ebook5-1.html) 已标为直接打开、一级来源并定位到米量、配料、米水比和电锅流程；来源没有成品份数和电锅自动总时长，因此仍是 `recipe_fact_checked`。
- [台湾农业部农业儿童网：香菇筍仔飯](https://kids.moa.gov.tw/theme_data.php?theme=kids_cooking&id=272) 已标为直接打开、一级来源并定位到食材、1 杯水和 30 分钟制作时间；来源没有固定成品份数，因此不补写 `fixed_batch`。

### 3. 高丽菜饭补入独立的台大医院电锅变体

[台大医院健康电子报](https://epaper.ntuh.gov.tw/health/201804/health_1.html) 直接写明 2 人份、米 120g、猪肉丝 120g、高丽菜 1/4 颗、外锅 1 杯水、跳起后焖 10–15 分钟。它与原目录中的中央健保署 3 人份版本是两套不同合同：本轮只把台大版本作为独立变体来源，不混入 3 人份的米水和用量，也不借 10–15 分钟冒充完整自动行程时间。

### 4. 新发现但暂不合并的独立版本

- [香港赛马会家庭食谱：腊味煲仔饭（四位用）](https://member.hkjc.com/member/image/2020/11/Home_cooking_recipe_Claypot.pdf) 直接给出 4 人、480g 米、440g 水和腊味入锅流程，但没有完整总时长；它是独立瓦煲版本，不能与台湾农粮署 3 杯米版本拼成一套。
- [台湾农业部产销履历：香菇滑鸡饭](https://taft.moa.gov.tw/cp-1050-1589-8c557-1.html) 直接给出 1.5 杯米、鸡腿、香菇、约 2.5 杯水、腌 20 分钟和焖 20 几分钟，并明确注明原作者授权边界；没有固定成品份数和完整总时长，所以仍只作研究证据。
- [爱料理：筍仔飯／竹筍鹹飯](https://icook.tw/recipes/478589) 给出 3 人份、2 米杯米、3 米杯水、外锅 1 杯水和至少焖半小时，但猪肉写“适量”；这是另一套家庭电锅版本，不能覆盖农业儿童网的 1 杯水炉上版本。

这些来源已经记录为下一轮候选证据，但尚未写入结构化合同，避免把不同版本的批量、水量和流程混合。

### 5. 本轮直接来源核验（r3）

本轮把几条原先只能作为研究线索的来源改为“直接打开并定位”，但只补来源元数据和边界说明，不把它们错误晋升为可执行配方：

- [象印：牛肉什锦饭](https://www.zojirushi-china.com/activity/recipe/rice-cooker/niuroushenjinfan/)：官方页面直接给出 4–5 人份、3 杯米、牛肉糜/胡萝卜泥/洋葱/黄油用量、白米 3 水位线和什锦饭程序；份数是范围且没有完整程序总时长，继续保留 `recipe_fact_checked`。
- [香港赛马会：腊味煲仔饭](https://member.hkjc.com/member/image/2020/11/Home_cooking_recipe_Claypot.pdf)：直接记录“四位用”、480g 米、440g 水和腊味用量，作为独立瓦煲版本，未与台湾农粮署合同混合。
- [香港中华煤气：北菇滑鸡饭](https://www.towngasappliance.com/newsletter/ricecooking/c03.php) 与 [Tefal 电饭煲食谱 PDF](https://www.tefal.com.sg/medias/Tefal-Recipe-Book-Rice-Cooker.pdf)：分别记录明火 35 分钟版本和 X4 电饭煲版本；两套器具、批量和时间不拼接，冬菇滑鸡饭仍缺统一固定批量与完整总时长。
- [锅宝：豉汁排骨煲仔饭](https://www.cookpot.com.tw/cookbook/1252.html)：直接记录 3 杯米、3.6 杯水、600g 排骨、IH 煲仔饭倒数 30 分钟投料；页面有 4–5 人份元数据但没有完整程序总时长，继续保留研究状态且限定锅型。

这批来源都已写入 `source_refs` 的 `access_status: "opened"`、`evidence_tier` 和 `evidence_locator`；它们解决的是“来源能否直接复核”，没有解决固定份量、完整总时长或跨器具适配，因此不能据此宣称“全部做好”。

### 6. 新增一条完整但机型限定的执行记录

[Philips Taiwan：廣東臘味飯](https://www.philips.com.tw/c-e/ho/recipe-overview-page/main-courses/hong-kong-style-meat-meal.html) 直接给出 4 人份、2 杯白米、腊肠/肝肠各 1 条、2 杯水、45 分钟以及无水烹调与密封烹调步骤。它满足固定份量、液体、流程、时间和腊味加热安全合同，因此新增为 `philips-cantonese-cured-rice`，状态为内部 `executable`；这是 Philips 多功能烹煮锅版本，不把 45 分钟推导为普通电饭煲时间，也未宣称完成厨房验证或公开上线。

### 7. 新增一条东芝说明书中的完整什锦饭合同

[Toshiba RC-DR18T 中文说明书](https://www.toshiba-lifestyle.com/content/dam/toshiba-aem/hk/category-page/rice-cooker/ih-rice-cooker/rc-dr18t/download-cn/RC-DR18T%E8%AA%AA%E6%98%8E%E6%9B%B8%20%E4%B8%AD%E6%96%87%E7%89%88.pdf) 直接给出菜名“什锦饭”、4人份、3杯大米、鸡脯肉/水煮竹笋/干香菇/胡萝卜/油炸豆腐的用量、白米水位刻度3和完整6步流程；同一说明书的 Mixed 煲仔饭时间表给出3杯约45分钟。原始PDF已归档到 `docs/source-archives/toshiba-rc-dr18t-manual-cn.pdf`，SHA-256 为 `84ec30a526aceb545912b1fafb9f10008ae67196667f53459dade4cc39411832`，凭证页为PDF第14、19页。

本条登记为 `东芝什锦饭`，明确限定在说明书覆盖的东芝 RC-DR18T 1.0L/1.8L 机型和 White／Mixed 煲仔饭模式；不把“什锦饭”改写成地域传统菜，也不把水位或45分钟外推到其他电饭煲。鸡肉安全终点由 FoodSafety.gov 单独支持，大豆标签来自油炸豆腐和酱油。它是内部 `executable` 合同，尚未厨房验证、公开或部署。

### 8. 下一批厂商凭证完成归档，但未越过缺口门

本轮继续补的是可复核证据，不是把缺失合同用估算填满：

- [象印：鲜蔬竹笋饭](https://www.zojirushi-china.com/activity/recipe/rice-cooker/xianshuzhusunfan/) 已从页面直接打开并记录 HTML 第266至299行；页面明确 4~5 人份、食材用量、白米3水位线、什锦饭程序和结束拌饭流程。因为份数是范围、没有完整程序总时长，仍保持 `recipe_fact_checked`。
- [象印 NL-ERH10C/NL-ERH18C 说明书](https://www.zojirushi-china.com/media/6749/nl-erh-ccn20250317_a.pdf) 已归档到 `docs/source-archives/zojirushi-nl-erh-2025-manual.pdf`，SHA-256 为 `66d5d2a4f4458a1932e6fa185a4e9d15917874ab5098ba21257b5ded67d45cbc`；第5页给出什锦饭程序的型号相关时间范围，第8页给出肉糜青菜饭 4~5 人份、3杯米、90克猪肉糜、90克青菜和白米3水位线。份数和时间均为范围/型号相关，不能压成一个固定合同。
- [九阳 JRC-4HP82 说明书](https://myjoyoung.com/wp-content/uploads/2025/09/Rice-Cooker-JRC-4HP82.pdf) 已归档到 `docs/source-archives/joyoung-jrc-4hp82-manual.pdf`，SHA-256 为 `aa465f6e6541de37290f2ac8eafb779c8172ed1dcfc22602db075f43f9ae8066`，保留英文 Slow cook 与中文 White rice（柴火饭）冲突，不选择任一程序。

这三条记录的 `source_refs` 已补齐 `access_status`、`evidence_tier`、页码/行号定位和本地归档清单；它们仍不是公开菜谱，也没有改写 `fixed_batch` 或 `time_contract`。

### 9. 松下什锦鸡饭补齐原说明书凭证，但仍不压缩时间范围

[松下 SR-DF151 说明书](https://home.panasonic.cn/support/attachments/auld/manual/SR-DF151.pdf) 已归档到 `docs/source-archives/panasonic-sr-df151-manual.pdf`，SHA-256 为 `4ed858b83402a4356918fba88f436fd7b25072534554c157071d9d18ddc0cdb5`。PDF 第9页给出什锦鸡饭的3杯米、4杯水、鸡肉80克、牛蒡35克、香菇2个、油炸豆腐2块、胡萝卜40克和“精煮”程序；第6页给出精煮约38分钟的参考时间，但同页明确什锦饭时间会随食材变化。

因此本轮只补 `access_status`、`evidence_tier`、PDF页码定位和本地归档，不把38分钟改写成该菜固定总时长，也不凭3杯米推成成品份数；`panasonic-mixed-chicken-rice-sr-df151` 继续保持 `recipe_fact_checked`。

### 10. 松下鲜香菇饭补齐 SR-AFG 说明书凭证，但保留机型边界

[松下 SR-AFG 说明书](https://home.panasonic.cn/support/attachments/auld/manual/SR-AFG.pdf) 已归档到 `docs/source-archives/panasonic-sr-afg-manual.pdf`，SHA-256 为 `a4fb565038134dbab2a6e518da825ad2a95d17491cb63d9a661df8ca932a9e2c`。PDF 第23页给出鲜香菇饭的1杯米、4朵鲜香菇、20克鸡肉丝、15克芹菜、1杯水、煲仔饭程序，以及完成后拌入芹菜并余温焖5分钟；第8页给出煲仔饭约37分钟参考值，同时注明什锦饭/糯米饭时间会随食材变化。

因此本轮只补直接打开状态、证据分级、页码定位和本地归档，不把37分钟改写成该菜固定总时长，也不凭1杯米推成成品份数；`panasonic-fresh-shiitake-rice-sr-afg` 继续保持 `recipe_fact_checked`，且不得替换为普通白米程序或其他机型参数。

### 11. 高丽菜饭补齐健保署原始 PDF 凭证，但仍不虚构自动行程

[全民健康保险双月刊第80期](https://media.nhi.gov.tw/md/dl-52195-25353cf985624e8aaa641aea6f390005-3.pdf) 已通过浏览器直接打开并归档到 `docs/source-archives/nhi-bimonthly-80-cabbage-rice.pdf`，SHA-256 为 `377f001a2198c023f4cc35ef9471975b8724b8f94af2c56f413d4a382a34fbaa`。PDF第39页（印刷第37页）直接给出高丽菜饭3人份、白米1.5杯、五花肉200克、高丽菜半颗、香菇4朵、胡萝卜1/4条、虾米2大匙；米与1.5杯水拌炒后入电锅，外锅加1杯水，跳起后焖10分钟。

这次把原先的 `search_extract_opened` 改为 `opened`，补上证据等级、页码定位和本地归档。10分钟是跳起后的额外焖饭时间，不是完整自动蒸煮行程，因此 `time_contract` 继续为空；3人份合同仍只采用这一来源，不与台大医院2人份版本拼接。

### 12. 南瓜饭补入农粮署儿童网独立版本，但不混合合同

[台湾农业部农粮署儿童网：南瓜饭](https://kids.moa.gov.tw/theme_data.php?theme=kids_cooking&id=66) 已直接打开并定位到正文第623至653行。该版本写明南瓜600克、白米4杯、约60分钟，炒米后加入5杯水、南瓜与鸡粉，电锅外锅加1米杯水。

它与北区分署电子书的2杯米、0.8倍米水、75克绞肉版本是两套独立来源合同。本轮只登记儿童网版本的来源事实，不把5杯水或约60分钟写入当前 `liquid_contract`/`time_contract`，也不补写来源未给出的成品份数；目录继续保持 `recipe_fact_checked`，避免跨版本拼接。

### 13. 大同电锅高丽菜饭进入内部 executable

[大同电锅官方账号：高丽菜饭](https://recipe.rakuten.co.jp/recipe/1290044668/) 直接给出一套独立的2人份电锅合同：高丽菜1/4颗、猪肉丝50克、干香菇3朵、红葱头3片、干虾10克、白米2合、内锅2杯水、外锅1杯水，页面标示约1小时，开关跳起后再焖10分钟。步骤也明确写出泡米、腌肉、炒料、入内锅和外锅加水顺序。

本轮新增 `taiwan-tatung-cabbage-rice`，保留官方账号的名称和大同电锅机型边界，不与既有健保署3人份、台大医院2人份或农粮署1/3杯水版本拼接。原页对食用油和白胡椒只写未定量描述，目录不擅自补数；猪肉和虾米安全终点由 FoodSafety.gov 单独支持。该条已进入内部 `executable`，仍需厨房验证，未公开、未部署。

### 14. 象印 EL-NS23 豚肉と野菜のおかずごはん进入内部 executable

[象印官方食谱：豚肉と野菜のおかずごはん](https://www.zojirushi.co.jp/recipe/list/1776.html) 直接给出 EL-NS23 电气料理锅的约1小时、4人份、米2杯、猪肉300克、水260mL、卷心菜、青椒和红甜椒用量，以及汆烫、腌肉、装锅、选择自动菜单和出锅拌饭的完整步骤。

本轮新增 `zojirushi-pork-vegetable-rice-el-ns23`。保留官方日文菜名和 EL-NS23 电气料理锅边界，不把它改名成地域菜，也不把260mL或约1小时外推成普通电饭煲参数。来源只把“胡椒少许”作为步骤中的未定量调味，不把它伪装成固定克数；猪肉安全终点由 FoodSafety.gov 单独支持。该条已进入内部 `executable`，仍需厨房验证，未公开、未部署。

### 15. Panasonic NF-PC400 炊き込みごはん进入内部 executable

[Panasonic Cooking 官方食谱：炊き込みごはん](https://panasonic.jp/cooking/recipe/cook/0657.html) 直接给出 NF-PC400 电气压力锅的约1小时总调理时间、4人份、白米3杯、牛蒡、蒟蒻、干香菇、油豆腐、鸡腿肉和胡萝卜的定量；页面还明确水位线3、自动调理17（20分钟）、开盖前确认压力释放和出锅拌饭步骤。

本轮新增 `panasonic-nf-pc400-takikomi-rice`，保留来源原菜名“炊き込みごはん”和 Panasonic NF-PC400 电气压力锅边界，不把压力锅的水位线、程序或约1小时外推为普通电饭煲参数；鸡肉安全终点由 FoodSafety.gov 单独支持。该条已进入内部 `executable`，仍需厨房验证，未公开、未部署。

### 16. Panasonic NF-AC1000 官方地域米饭页面补入研究目录

本轮从 Panasonic Cooking 的 NF-AC1000/NF-AC700 官方页面补入三道有真实名称的地域或家常米饭，不把它们改写成“食材拼接锅”：

- [兵库ご当地 たこめし](https://panasonic.jp/cooking/recipe/autocooker/1436.html)：页面给出约50分钟、2合分、白米300g、熟章鱼200g、姜、水420mL、调味料和 NF-AC1000/NF-AC700 的装锅流程；
- [东京ご当地 深川めし](https://panasonic.jp/cooking/recipe/autocooker/1342.html)：页面给出约50分钟、2合分、蛤蜊罐头260g、蛤汁与水合计380mL、白葱/真姬菇/油豆腐及装锅流程；
- [五目ごはん](https://panasonic.jp/cooking/recipe/autocooker/1263.html)：页面给出约55分钟、3合分、白米450g、水610mL、鸡肉50g、牛蒡/蒟蒻/干香菇/油豆腐/胡萝卜及装锅流程。

三条都已直接打开并记录正文行号、来源等级和完整液体/时间/流程事实；但“2合分/3合分”是米量批次，不等于成品人数，因此都登记为 `recipe_fact_checked`，`fixed_batch` 保持为空，不能把来源批次擅自换算成 servings，也不能把 NF-AC1000 的水量、程序和约50–55分钟外推给普通电饭煲。章鱼、蛤蜊和鸡肉分别保留独立安全终点；三条均未公开、未部署。

### 17. 同一 Panasonic 来源继续补入三道有明确名称的米饭

同一官方来源还闭合了三道真实名称、但仍受 NF-AC1000/NF-AC700 机型和米量批次限制的菜：

- [广岛ご当地 牡蛎柠檬海鲜饭](https://panasonic.jp/cooking/recipe/autocooker/1525.html)：3合分、白米450g、A组170mL水与碎牡蛎/柠檬皮，B组300mL温水和调味料，整只牡蛎200g、虾6只、红黄椒各70g，约55分钟；
- [ピラフ](https://panasonic.jp/cooking/recipe/autocooker/1454.html)：3合分、白米450g、水600mL、洋葱150g、海鲜混合150g、什锦蔬菜150g和黄油36g，约55分钟；
- [比里亚尼风炊饭](https://panasonic.jp/cooking/recipe/autocooker/1555.html)：2合分、鸡翅根350g、白米300g、水280mL、番茄100g、酸奶和香料，含腌制、完成后焖15分钟流程，约55分钟。

这些页面都直接打开并记录了来源行号、机型、液体、流程和时间；由于页面只写“2合分/3合分”而没有成品人数，三条仍保持 `recipe_fact_checked`，不把米量换算成 servings，也不把自动锅参数外推为普通电饭煲通用做法。牡蛎/虾和鸡翅根分别挂独立安全终点；均未公开、未部署。

### 18. Panasonic NF-AC1000 海南鸡饭进入内部 executable

[Panasonic Cooking：カオマンガイ](https://panasonic.jp/cooking/recipe/autocooker/1118.html) 是一条合同已闭合的真正一锅饭：官方页面给出 NF-AC1000、4 人份、白米300g、水360mL、鸡腿肉400g、约40分钟，以及中压8分钟和减压后开盖的完整流程。

本轮新增 `panasonic-khao-man-gai-nf-ac1000`，保留“カオマンガイ”这一真实菜名和压力锅机型边界，不把压力锅参数外推为普通电饭煲；鸡肉安全终点由 FoodSafety.gov 单独支持。它进入内部 `executable`，仍未完成厨房验证、公开或部署。

### 19. Panasonic SR-V10BB 补入五道有真实地域名称的炊饭

Panasonic 官方炊饭器页面直接给出五道带地域名称或地域身份的米饭，页面注明使用 SR-V10BB；五条均保留该机型的水位线和炊込み程序。SR-V10BB 官方规格页给出炊込み程序约 55–65 分钟，但这是机型程序范围，不是每道菜的独立总时间，因此不压缩成单一 `total_minutes`：

- [山形县 芋煮炊饭](https://panasonic.jp/cooking/recipe/suihan/1399.html)：4人份、牛肉/里芋/舞茸/牛蒡、白米2合、水位线2；
- [岛根县猪肉柚子醋炊饭](https://panasonic.jp/cooking/recipe/suihan/1403.html)：6人份、猪肉/根菜/真姬菇、白米3合、水位线3；
- [爱媛鲷鱼饭](https://panasonic.jp/cooking/recipe/suihan/1396.html)：4人份、鲷鱼240g/韭菜/生姜、白米2合、水位线2；
- [长崎煮干萝卜炊饭](https://panasonic.jp/cooking/recipe/suihan/1401.html)：6人份、鸡腿肉/萝卜干/油豆腐/香菇、白米3合、水位线3；
- [冲绳ジューシー](https://panasonic.jp/cooking/recipe/suihan/1398.html)：4人份、猪五花/胡萝卜/水煮羊栖菜、白米2合、水位线2。

五条均记录为 `recipe_fact_checked`：页面给出了份数、定量、装锅步骤和 SR-V10BB 水位线，规格页只给出炊込み程序范围，所以不晋升 `executable`；鱼、禽、猪、牛的安全端点各自独立记录。它们是真实菜名和来源条目，不是按用户食材自由拼出的名称，也未公开或部署。

相关来源：[SR-V10BB 规格页](https://panasonic.jp/suihan/products/SR-V10BB/spec.html)。

### 20. Panasonic 再补五道有真实地域名称的炊饭，并保留页面自身机型事实

本轮继续从 Panasonic Cooking 的公开地域菜单中补入五道真实名称；页面直接给出份数、定量、米水位线与炊込み步骤，但没有每道菜独立的总调理分钟数，因此五条均保持 `recipe_fact_checked`。重要的是，不能因为 Panasonic 的菜单列表统一列在 SR-V10BB 下，就覆盖菜谱页自身写出的机型：本批严格按每个菜谱页逐条记录，SR-X910E 与 SR-V10BB 的规格范围也分开保留。

- [北海道 炊込みコーンバターごはん](https://panasonic.jp/cooking/recipe/suihan/1405.html)：SR-X910E、4人份、白米2合、玉米300g、黄油10g、水位线2；规格页只给炊込み约52–65分钟。
- [茨城县 さつまいもごはん](https://panasonic.jp/cooking/recipe/suihan/1397.html)：SR-V10BB、6人份、白米3合、红薯300g、水位线3；规格页只给炊込み约55–65分钟。
- [神奈川县 湘南産しらすと油揚げの梅茶漬け炊込みごはん](https://panasonic.jp/cooking/recipe/suihan/1400.html)：SR-X910E、6人份、白米3合、釜揚げしらす200g、油揚げ60g、水位线3。
- [长野县 信州産サーモンとなめ茸の炊込みごはん](https://panasonic.jp/cooking/recipe/suihan/1402.html)：SR-X910E、6人份、白米3合、信州三文鱼160g、滑子菇120g、盐昆布20g、水位线3，并保留去骨后拌回步骤与鱼类安全终点。
- [兵库县 丹波の黒枝豆ごはん](https://panasonic.jp/cooking/recipe/suihan/1404.html)：SR-X910E、6人份、白米3合、带荚黑枝豆240g，先微波预处理后按水位线3炊込み。

这五条只记录来源写明的名称、批量、器具、水位和步骤；不把 52–65 或 55–65 分钟范围压成固定 `total_minutes`，也不把机型参数外推为普通电饭煲通用合同。

### 21. Panasonic 再补两道有真实名称的米饭，并保留收尾步骤边界

本轮继续使用 Panasonic Cooking 的公开页面，补入两道有原始名称、明确机型和可核验流程的米饭。两条都记录为 `recipe_fact_checked`，不把机型炊込み程序范围冒充成菜谱固定总时长：

- [アジア風炊込みごはん](https://panasonic.jp/cooking/recipe/suihan/1357.html)：SR-X910E、4人份、白米3合、鸡肉450g；米加酒盐至白米水位线3，鸡肉铺在米面上，另做酱汁，结束后切肉并与番茄、黄瓜、生菜拌食。鸡肉安全终点独立记录；页面未给该菜的独立总时长。
- [ピラフ（SR-X910E炊飯器版）](https://panasonic.jp/cooking/recipe/suihan/1359.html)：页面原标题为“ピラフ”，目录用“SR-X910E炊飯器版”作为内部规范名以避免与既有 NF-AC1000 版本重复；4人份、白米3合、虾250g及洋葱/胡萝卜/青椒，结束后再加入水煮蘑菇、玉米和黄油拌匀。页面明确水位线3和结束后加料步骤，虾类安全终点独立记录；页面未给该菜的独立总时长。

这两条都保留 SR-X910E 菜谱页自身的机型事实，并只使用该机型规格页的 52–65 分钟范围作为器具背景，不外推到其他电饭煲，也不把范围写进 `time_contract`。

### 22. Panasonic 再补两道茅乃舎监修だし炊きごはん

Panasonic 官方页面还记录了两道由茅乃舎监修的电饭煲米饭。它们都明确写出 4 人份、白米 2 合、对应一袋高汤和 SR-V10BA / SR-V18BA 的白米水位线 2，并给出从装锅到炊込み结束的完整步骤；页面没有该菜独立的总调理分钟数，因此仍保持 `recipe_fact_checked`：

- [茅乃舎だし だし炊きごはん](https://panasonic.jp/cooking/recipe/suihan/0966.html)：白米2合、茅乃舎だし1袋、水位线2；
- [野菜だし だし炊きごはん](https://panasonic.jp/cooking/recipe/suihan/0968.html)：白米2合、野菜だし1袋、水位线2。

这两条是厂商/品牌监修的具名来源型米饭，不是按用户食材自由组合；营养结构按来源实际内容记录为碳水型（C），不把“蔬菜だし”误写成一份蔬菜膳食纤维来源，也不外推到其他电饭煲。

### 23. Panasonic 再补一条冷冻海鲜一锅饭

[冷凍シーフードのパエリア風ごはん](https://panasonic.jp/cooking/recipe/autocooker/1472.html) 是 Panasonic NF-AC1000 的闭盖米饭流程：页面给出约55分钟、3合分、白米450g、200mL水与300mL温水/调味料、冷冻海鲜混合物和蔬菜的定量，以及装锅、启动、完成后拌松的步骤。由于来源写的是“3合分”而不是成品人数，目录保留 `fixed_batch=null`；液体合同记录总量500mL，时间合同记录约55分钟，海鲜安全终点独立挂接，不把 NF-AC1000 参数外推为普通电饭煲通用做法。

### 24. 象印官方页面补入三道具名米饭，保留合同缺口

本轮继续使用象印官方菜谱页，新增三道有真实名称、直接可复核的米饭条目；只登记来源写明的事实，不把范围或缺失字段压成“完整配方”：

- [えびめし](https://www.zojirushi.co.jp/recipe/list/1779.html)：岡山名物，EL-NS23，约1小时、4人份、米2杯、虾160g、洋葱100g、鸡蛋4个，白米水位2；来源合同完整，已进入内部 `executable`，但仍需厨房验证，未公开、未部署。
- [五目ご飯](https://www.zojirushi.co.jp/recipe/list/1775.html)：EL-NS23，约1小时、4–5人份、米3杯、鸡肉/牛蒡/胡萝卜/香菇/油豆腐等，白米水位3；因为来源给的是4–5人范围，`fixed_batch` 保持为空，继续为 `recipe_fact_checked`。
- [焼きさばめし](https://www.zojirushi.co.jp/recipe/list/1013.html)：EP-FA10 土锅风锅具，4人份、米2合、盐鲭300g、だし汁320mL，沸腾后7分钟、WARM15分钟、余热10分钟；来源没有总时长合同，且器具是土锅风锅具，不外推成电饭煲配方，继续为 `recipe_fact_checked`。

这三条保留官方菜名与机型边界，没有按用户食材自由拼出新菜名，也没有把“约1小时”或阶段步骤推导成其他条目的通用时间。

### 25. 飞利浦说明书补入鸡肉腊肠煲仔饭

[Philips HD4775 / HD4777 说明书（PDF第54页）](https://www.documents.philips.com/assets/20210504/2b225944d7cb481abeffad1e01377c70.pdf) 直接给出真实菜名“鸡肉腊肠煲仔饭”、3杯米、300克鸡肉片、200克腊肠、约2.5厘米厚姜片、油、盐和糖，以及米饭煮好后听到哔声再把鸡肉和腊肠铺入锅内、煲仔饭流程结束后撒洋葱的分段投料流程。说明书正文同时明确 HD4775/HD4777 型号和不超过3杯米水位线，因此目录记录机型范围与水位线3。

来源没有成品份数，也没有把该菜单的45至60分钟机型参考范围绑定为这道菜的独立总时长，所以本条状态为 `recipe_fact_checked`，不建立 `fixed_batch` 或 `time_contract`，不外推到其他电饭煲，也不把分段投料改写成“全程不需要开盖”。

### 26. 台湾农业部农业儿童网补入小米炊飯

[台湾农业部农业儿童网：小米炊飯](https://kids.moa.gov.tw/theme_data.php?id=250&theme=kids_cooking) 直接记录具名“小米炊飯”：小米、白米、莲藕、山药、红枣、枸杞和番薯全部入锅；总米量2杯时，来源给出约2.5～3杯过滤水，电饭锅外锅加1杯水，跳起后焖15分钟，制作时间标为30分钟。

本轮新增 `taiwan-millet-root-vegetable-rice`。来源没有固定份数，也没有唯一的内锅液体量，因此保留 `fixed_batch=null` 与 `liquid_contract=null`，不把范围压成一个数字。该条只标注碳水和膳食纤维角色，不把它宣称成含肉类蛋白的均衡餐；状态为 `recipe_fact_checked`，未公开、未部署。

### 27. 台大医院补入低鈉西班牙燉飯

[国立台湾大学医院健康管理中心：低鈉西班牙燉飯（PDF）](https://health.ntuh.gov.tw/health/NTUH_e_Net/NTUH_e_Net_no156/%E4%BD%8E%E9%88%89%E8%A5%BF%E7%8F%AD%E7%89%99%E7%87%89%E9%A3%AF.pdf) 直接给出2人份、鸡里肌肉90克、白米120克、鲜奶100毫升、番茄、洋菇、鸿喜菇、起司等食材和每人营养分析；步骤明确用电饭锅外锅1杯水，跳起后焖10～15分钟，加起司再焖5～10分钟。

本轮新增 `ntuh-low-sodium-spanish-paella-rice`。来源给出的是分段时间和外锅水，不是完整总时长，也不是单一内锅液体合同，所以 `time_contract` 与 `liquid_contract` 均保持为空；保留鸡肉74°C安全终点和乳制品标签，营养角色记录为碳水、蛋白质、膳食纤维。该条状态为 `recipe_fact_checked`，未公开、未部署。

### 28. 台湾农业部农业儿童网补入薑黃雞腿燉飯

[台湾农业部农业儿童网：薑黃雞腿燉飯](https://kids.moa.gov.tw/theme_data.php?id=297&theme=kids_cooking) 直接记录具名薑黃雞腿燉飯，并明确把整锅炖饭放入大同电锅；来源列出鸡腿、洋葱、蒜末、红萝卜、姜黄粉、青椒、米1/2杯、高汤1/2杯和椰浆2大匙，记载不到半小时煮好。

本轮新增 `taiwan-turmeric-chicken-risotto`。来源没有固定成品份数、唯一内锅液体量或精确总时长，因此不建立 `fixed_batch`、`liquid_contract` 或 `time_contract`；鸡肉安全端点单独挂接，状态为 `recipe_fact_checked`，未公开、未部署。

### 29. 台湾农业部农业儿童网补入瓠瓜香菇飯

[台湾农业部农业儿童网：瓠瓜香菇飯](https://kids.moa.gov.tw/theme_data.php?id=50&theme=kids_cooking) 直接记录具名瓠瓜香菇飯，给出瓠瓜、乾香菇、胡萝卜、米3杯、水3杯和电饭锅做法；该配方主要提供碳水与膳食纤维，不把它宣称成含肉类蛋白的均衡餐。

本轮新增 `taiwan-bottle-gourd-mushroom-rice`。来源给出固定水量，因此保留 `liquid_contract`；没有固定成品份数或总时长，状态为 `recipe_fact_checked`，未公开、未部署。

### 30. 飞利浦官方补入鮭魚五目炊飯

[Philips Taiwan：鮭魚五目炊飯](https://www.philips.com.tw/c-e/ho/recipe-overview-page/main-courses/steamed-salmon-rice.html) 直接给出具名米饭主餐、4至5人份、料理时间40分钟、无刺鲑鱼150克、白米2杯、干香菇、鸿喜菇、胡萝卜、牛蒡、蒟蒻和260毫升日式高汤或水；流程明确为所有材料进入飞利浦多功能烹煮锅，选择米饭模式，完成后拌匀。

本轮新增 `philips-salmon-gomoku-rice`。由于来源给出的是4至5人范围，目录保留 `fixed_batch=null`，不把它压成4人或5人的伪精确合同；40分钟和260毫升仅绑定该来源的飞利浦机型与米饭模式。鲑鱼安全端点单独挂接，营养结构记为碳水、蛋白质和膳食纤维；状态为 `recipe_fact_checked`，未公开、未部署。

### 31. 飞利浦官方补入雞汁野菜炊飯

[Philips Taiwan：雞汁野菜炊飯](https://www.philips.com.tw/c-e/ho/recipe-overview-page/main-courses/takikomi-gohan.html) 直接给出具名米饭主餐、1人份、越光米300克、带皮鸡腿肉200克、高丽菜和胡萝卜各200克、舞菇50克、去壳栗子8颗、腊肉20克、鸡汤320克，以及先煎鸡腿、炒香配料、再以密封烹调米饭模式完成的分段流程。

本轮新增 `philips-chicken-vegetable-takikomi-rice`。来源没有完整总料理时间，因此保留 `time_contract=null`，不把煎鸡皮约10分钟或机型程序推成总时长；320克鸡汤作为来源限定的液体事实保留。鸡肉与腊肉安全端点分别独立挂接，营养结构记录为碳水、蛋白质和膳食纤维；状态为 `recipe_fact_checked`，未公开、未部署。

### 32. 象印官方补入菌菇糙米饭

[上海象印家用电器有限公司：菌菇糙米饭](https://www.zojirushi-china.com/activity/recipe/rice-cooker/jungucaomifan/) 直接给出具名咸味糙米饭、适用带“糙米饭”菜单的象印电饭煲、4至5人份、糙米3杯、杏鲍菇75克、蟹味菇75克、鸡蛋1个、葱花5克，以及按糙米水位线3炊煮、另锅摊蛋饼切蛋丝、出锅后拌盐葱花蛋丝的流程。

本轮新增 `zojirushi-mushroom-brown-rice`。由于来源给出的是4至5人范围而非固定人数，保留 `fixed_batch=null`；水位线3只绑定具备对应糙米菜单与刻度的象印电饭煲，不外推到普通白米程序。蛋丝需要另锅完成，因此不把它改写成全程闭盖一锅；来源没有总调理分钟数，`time_contract`保持为空。营养结构记录为碳水、蛋白质和膳食纤维；状态为 `recipe_fact_checked`，未公开、未部署。

### 33. 台山政务来源补入台山鲫鱼饭

[广东省人民政府侨务办公室：台山鲫鱼饭](https://www.qb.gd.gov.cn/ztzl/2021ycsf/xwdt/content/post_987729.html) 的官方页面记录台山鲫鱼饭的电饭煲流程：米饭煮至差不多熟时开盖，铺入腌制好的鲫鱼，再合盖煮几分钟。当前页面抓取不稳定，本轮按官方搜索摘录记录 `search_extract_opened`，没有把摘录当成完整执行来源。

本轮新增 `taishan-crucian-carp-rice`。只保留具名身份、大米与鲫鱼、中途投料和电饭煲事实；米量、鱼量、液体、完整总时长和具体熟度均保持为空，鱼类安全终点另挂 FoodSafety.gov 通用依据。状态为 `recipe_fact_checked`，未公开、未部署；待来源页面可直接打开后再考虑补齐定位，绝不以搜索摘录晋升 executable。

### 34. 广东省中医药局补入南瓜鸡肉焖饭

[广东省中医药局：秋天常吃南瓜，对身体有这些好处](https://szyyj.gd.gov.cn/zyyfw/ysbj/content/post_4254486.html) 的食疗方直接列出“南瓜鸡肉焖饭”：鸡腿3个、南瓜250克、香菇50克、洋葱40克、大米250克；记录鸡肉腌制15分钟、各配料先炒，再把米与配料放入电饭煲，米面水高约0.5厘米，按煮饭键完成。

本轮新增 `guangdong-pumpkin-chicken-braised-rice`。来源给出了具名菜、主要用量和电饭煲流程，但水是相对高度而非固定液体，且没有固定成品份数、机型或完整总时长，因此保留 `recipe_fact_checked`；鸡肉安全终点单独挂接 FoodSafety.gov，未公开、未部署。

### 35. 台湾农业部食农平台补入客家創意地瓜飯

[台湾农业部食农教育资讯整合平台：客家創意地瓜飯](https://fae.moa.gov.tw/map/food_item.php?id=148&type=AS07) 直接刊载具名“客家創意地瓜飯”，并注明食谱与照片来源为新竹县竹东地区农会。页面给出米2杯、四季豆150克、地瓜、义式鸡腿肉、杏鲍菇、葱、蒜和2杯热水；流程明确区分电锅/电子锅煮饭，以及四季豆另行汆烫、蒜葱爆香拌炒后再拌入饭中。

本轮新增 `hakka-creative-sweet-potato-rice`。保留 2 杯热水这一来源事实，但没有把米量换算成成品份数；来源也没有总料理时间，因此 `fixed_batch` 与 `time_contract` 均为空。四季豆的后处理不被改写成全程闭盖一锅，鸡腿肉另挂 74°C 安全终点；状态为 `recipe_fact_checked`，未公开、未部署。

### 36. 台湾农业部食农平台补入遇見幸福芋頭飯

[台湾农业部食农教育资讯整合平台：遇見幸福芋頭飯](https://fae.moa.gov.tw/map/food_item.php?id=102&type=AS07) 直接刊载具名“遇見幸福芋頭飯”，并注明食谱与照片来源为台中市农会。页面给出大甲芋头约150克、台梗9号米1.5杯、绞肉或猪肉丁、香菇、虾米；步骤明确米先浸泡30分钟，炒香菇和虾米并把肉炒至半熟，再将炒料与芋头铺入电锅，煮好后焖15分钟，并注明备料约2至3人份。

本轮新增 `taichung-encounter-happiness-taro-rice`。由于来源给的是2至3人份范围而非固定人数，`fixed_batch` 保持为空；来源把水量交给“依照一般煮饭方式”，所以不建立 `liquid_contract`，也不把焖15分钟和备料时间拼成总料理时间。芋头必须彻底加热，猪肉安全终点单独挂接；状态为 `recipe_fact_checked`，未公开、未部署。

### 37. 吉林龙井补入朝鲜族江米鸡饭

[吉林省文化和旅游厅：龙井市旅游线路](https://whhlyt.jl.gov.cn/ztzl/jlslyxlhxj/gdxl/jls/ybz/ljs/202506/t20250625_9264390.html) 将“江米鸡饭”列为当地朝鲜族民俗美食，并记录童子鸡腹中的糯米吸收鸡汤、鸡肉炖至骨肉分离。

本轮新增 `longjing-jiangmi-chicken`。只保留来源明确的真实名称、童子鸡与糯米组合和炖煮结果；来源没有固定重量、份数、液体、完整时间或现代电饭煲适配，因此不建立相应合同，也不把它改写成普通电饭煲菜谱。状态 `recipe_fact_checked`，未公开、未部署。

### 38. 大同电锅官方账号补入五道具名炊饭

本轮先写失败测试，再把同一官方账号的五道真实菜名和来源边界录入目录；不按用户食材自由拼接，也不把日本电锅参数外推为普通电饭煲通用规则：

- [牛肉とごぼうの炊き込みご飯](https://recipe.rakuten.co.jp/recipe/1290042027/)：2人份、米2合、牛肉薄切り200克、牛蒡半根、2杯だし、约30分钟，含先炒牛肉、入大同电锅、跳起后焖10分钟流程。本条固定合同已闭合，进入内部 `executable`。
- [黄金炊き込みご飯](https://recipe.rakuten.co.jp/recipe/1290044957/)：2至3人份范围、白米与玄米混合、鸡腿肉、栗子、胡萝卜、香菇、1.8计量杯水、约1小时；因份数是范围，保持 `recipe_fact_checked`。
- [カオ・モック・ガイ](https://recipe.rakuten.co.jp/recipe/1290043946/)：2至3人份范围、鸡翅根、咖喱粉、300ml水，并使用蒸皿分层；保留泰式原名和大同电锅边界，保持 `recipe_fact_checked`。
- [牡蠣と山菜の炊き込みご飯](https://recipe.rakuten.co.jp/recipe/1290042335/)：4人份、牡蛎、山菜、油豆腐和300mlだし；牡蛎先蒸并保留释出的牡蛎汤，液体总量随食材变化，因此不建立单一液体合同，保持 `recipe_fact_checked`。
- [鶏とキャベツの麻油炊き込みご飯](https://recipe.rakuten.co.jp/recipe/1290045243/)：3人份、鸡腿肉、卷心菜、香菇、真姬菇、米1.5合和约1小时；液体由香菇泡发液、料理酒与炒料产生液体共同构成，不编造固定水量，保持 `recipe_fact_checked`。

五条均保留官方菜名、食材和大同电锅连续流程；来源全部直接打开、证据等级为3，并单独挂接 FoodSafety.gov 熟制终点。它们尚未完成厨房观察、未公开、未部署。

### 39. 大同电锅官方账号再补两道具名炊饭

本轮继续先写失败测试，再录入同一官方账号直接刊载的两道真实菜名；它们都保留原名、批量和分阶段器具边界，没有把动态汤汁或机型刻度压成通用比例：

- [海南鶏飯シンガポールチキンライス](https://recipe.rakuten.co.jp/recipe/1290042347/)：4人份、鸡腿肉2块、米2合、蒜、生姜、白葱、清酒1大匙、芝麻油1小匙、约30分钟。来源明确先用大同电锅蒸鸡、保存鸡汤，再把米饭补水至内锅水位线2；这是同一器具的分阶段流程，液体合同保持为空，水位线只作为机型适配事实记录。
- [パエリア風魚介の炊き込みご飯](https://recipe.rakuten.co.jp/recipe/1290042658/)：4人份、米3合、红虾、鱿鱼、贻贝、蛤蜊、小番茄、蘑菇、甜椒和洋葱，约30分钟。来源明确先蒸贝类取汤、内锅水位线2至3、外锅1.5杯，跳起后把虾和贝类回锅；液体随贝类汤汁变化，因此不建立固定液体合同，也不把“パエリア風”改写成西班牙传统原方。

两条均为 `recipe_fact_checked`，来源直接打开、证据等级为3，安全终点分别挂接禽肉和贝类熟制依据；尚未完成厨房观察、未公开、未部署。

### 40. 大同电锅官方账号补入筒仔米糕与卡津鸡饭

- [筒仔米糕（ドンズーミーガオ）](https://recipe.rakuten.co.jp/recipe/1290042144/)：4人份、猪绞肉300至400克、肉燥用水300至400毫升、糯米2合、糯米用水1.5杯、约30分钟。来源明确先做肉燥，再以不锈钢杯和蒸板分阶段完成筒仔米糕；两段用水不合并成一个通用液体合同。
- [ケイジャンチキンライス](https://recipe.rakuten.co.jp/recipe/1290042664/)：3至4人份范围、鸡腿肉约300克、米2合、酸奶、卡津香料、姜黄粉和黄油，约30分钟。来源明确以大同电锅内锅水位线和铝箔托盘分层完成；保留机型水位线，不把它改写成固定毫升水或路易斯安那传统原方。

两条均为 `recipe_fact_checked`，来源直接打开、证据等级为3，分别挂接猪肉与禽肉安全终点；尚未完成厨房观察、未公开、未部署。

### 41. 大同电锅官方账号补入豚トロ与芝麻油炊饭

[大同電鍋官方账号：豚トロとごま油炊き込みご飯](https://recipe.rakuten.co.jp/recipe/1290045148/) 直接给出具名菜、2人份、泰国香米约180毫升、猪颈肉200克、干香菇3片、干虾1大匙、酱油、芝麻油、生姜、料理酒和约1小时流程。步骤明确：香菇泡发并保留泡发液，干虾与生姜先以芝麻油炒香，再炒香菇与猪颈肉，加入米和酱油翻炒后转入大同电锅内锅，加入泡发液与料理酒，外锅加1杯水，跳起后拌匀。

本轮新增 `tatung-pork-jowl-sesame-rice`。内锅液体由香菇泡发液和料理酒共同构成，来源没有可脱离该流程的单一固定总量，因此 `liquid_contract` 保持为空；保留2人份、约1小时、先炒再炊饭和大同电锅边界，猪肉安全终点单独挂接 FoodSafety.gov。状态为 `recipe_fact_checked`，未完成厨房观察、未公开、未部署。

### 42. 大同日本官方页面补入ナシゴレン风炊饭

[大同电锅日本官方：ナシゴレン風炊き込みご飯](https://dennabe-official.tatung.co.jp/recipe/view/2018) 保留了真实的“风味改编”菜名，而不是把它改写成印度尼西亚传统原方。官方页面给出 3 人份、米 2 合、鸡胸肉 100 克、冷冻海鲜综合 150 克，以及洋葱、红黄甜椒、青豆、蒜、生姜和酱油、鱼露、番茄酱、蚝油、甜辣酱、参巴酱等调味料，调理时间 60 分钟。流程明确米先沥水 30 分钟，内锅加调味料并加水至米水位线 2 刻度略下，铺入鸡肉和海鲜等配料，外锅加 1.5 杯水，开关跳起后拌匀并焖 5 分钟；鸡肉和海鲜的熟制终点单独记录。

本轮新增 `tatung-nasi-goreng-style-rice`，状态为 `executable`（仅内部研究记录）。液体合同是大同电锅机型限定的内锅水位线，不外推到其他电饭煲；同时保留“ナシゴレン風”的来源边界，不把电锅改编菜名冒充传统原名。该条尚未完成厨房观察、未公开、未部署。

### 43. 大同官网再补三道具名炊饭，但保留“份数范围”边界

本轮只纳入同一官方厂商页面直接写明的三道真实菜名，不把“2–3人份”压成一个虚构的固定成品份数：

- [芋头香菇素油饭](https://www.tatung.com.cn/ElectronicRecipes/info_itemid_225.html)：页面写明长糯米、芋头、小香菇、杏鲍菇和豆皮，香菇泡发液 0.9 米杯，外锅 1 杯水，约 30 分钟，并明确先炒后入大同电锅；豆皮等“适量”不擅自换算成克数。
- [萝卜豆皮炊饭](https://www.tatung.com.cn/ElectronicRecipes/info_itemid_167.html)：页面写明白米、白萝卜、豆皮、柴鱼高汤，内锅高汤 2 杯、外锅 1 杯水，米先浸泡 30 分钟、跳起后焖 10 分钟，约 60 分钟；保留大同电锅的内外锅分工。
- [咸小卷玉米炊饭](https://www.tatung.com.cn/ElectronicRecipes/info_itemid_29.html)：页面写明咸小卷、白米、内锅水 1.2 杯、玉米和小黄瓜，外锅 1 杯水，跳起后焖 5 分钟，约 40 分钟；海鲜熟制终点单独记录，不把小黄瓜或玉米改成自由替换槽位。

三条均为 `recipe_fact_checked`：来源直接打开、证据等级为 3，已有液体与时间事实，但页面的成品人数是范围，暂不建立 `fixed_batch`，也未完成厨房观察、未公开、未部署。

### 并行研究记录（2026-08-05）

本轮启用三个独立研究 Agent，结果先落到报告，不直接越过目录门：

- [厂商官方炊饭研究](./agent-research-20260805-manufacturer.md)：补充大同、象印等官方页面候选；除本轮三条已纳入条目外，其余仍缺固定批量、完整时间或安全/器具边界。
- [地域官方来源研究](./agent-research-20260805-regional-official.md)：青木瓜焖饭、台山黄鳝饭、麻涌龙船饭等候选；仅青木瓜焖饭的来源链较完整，其余保持研究状态。
- [地域文化来源研究](./agent-research-20260805-cultural.md)：湛江蛤蒌饭、陆川古城腊鸭糯米饭等候选；其中部分需要炒锅预处理或非电饭煲器具，不能直接改写成电饭煲菜饭。
- [目录缺口审计](./agent-research-20260805-catalog-gap-audit.md)：从现有 176 条中挑出 8 条最接近 `executable` 的记录，逐条列出缺失合同；同时标出了长野鲑鱼饭的器具型号与安全定位错配，下一轮先修证据一致性，不直接晋升。
- [大陆地域具名菜研究](./agent-research-20260805-mainland-named-rice.md)：潮州饶平高堂焖、泉州石狮香油饭、施甸铜锅焖饭均有直接地域来源；三条先进入 `recipe_fact_checked` 研究候选，不因缺重量、液体、时间或安全终点而越级。
- [厂商合同补充研究](./agent-research-20260805-manufacturer-contracts.md)：Tiger 与 Panasonic 官方页面再发现 5 条具名米饭；均有不同程度的批量、液体或程序事实，但仍保留 `research_only`，不把机型参数外推到普通电饭煲。

这些报告保留了原名、来源、器具和缺口；下一批只从报告中挑选合同缺口最小者，不以候选数量代替证据闭合。

## 仍未闭合的第一批缺口

进入 `executable` 必须同时具备：固定份量、液体合同、关键流程、完整总时间、安全终点；合同来源还必须全部显式分级、直接打开并带定位，PDF 还要有本地凭证页和 SHA-256。任何一项缺失都保持研究状态。

1. **上海咸肉菜饭**：砂锅合同已闭合，但尚未完成厨房验证；电饭煲版本没有来源，不能从砂锅参数推导。
2. **高丽菜饭**：现有 3 人份健保署 PDF 已直接打开并完成本地凭证归档，台大医院 2 人份变体也已直接打开，但两套不能混拼；自动蒸煮总时长仍缺。
3. **腊味煲仔饭**：WOL 完整单一版本已经闭合 2 人份、1 杯米、1 杯水、75 分钟和砂锅流程；仍需独立人工准入，准入后还需厨房观察，不能仅凭 validator 晋升或公开。
4. **手抓饭**：于田电饭锅版给出羊肉、胡萝卜、洋葱和分段时间，但大米为“适量”，液体“1:2”对象不清；其他炉上版本不能直接覆盖它。
5. **咖喱鸡肉饭**：九阳说明书双语页的程序写法冲突；尚缺固定成品份数、完整时间。PDF 食谱页已完成项目内本地归档，但在官方裁决或厨房验证前不选择任一程序。
6. **冬菇滑鸡饭**：WOL 完整单一版本已经闭合 2 人份、1 杯米、1 杯高汤或水、190 分钟和砂锅流程；仍需独立人工准入，准入后还需厨房观察，不能仅凭 validator 晋升或公开。

## 下一批工作顺序

1. 高丽菜饭 PDF 的直接打开与本地凭证归档已完成；下一步只补完整自动蒸煮总时长的独立证据，不把跳起后的额外焖饭时间冒充完整行程；
2. 九阳 JRC-4HP82 食谱页已完成本地归档；保留中英文程序冲突，下一步只做官方裁决或厨房验证，不擅自选定程序；
3. 为手抓饭选定一个明确器具版本，寻找同时写明份数、米量、液体对象和完整时间的同一来源；
4. 腊味煲仔饭和冬菇滑鸡饭提交独立人工准入；签署前保持 `recipe_fact_checked`，签署后才可进入 `executable`，随后仍需真实厨房观察；
5. 对其余条目按“缺口最小且来源可直接打开”排序推进，不按省份数量凑齐，不复制原文，不自由组合。

时间盒到期时只能缩小进入厨房验证的批次，不能降低来源门槛、把“适量”换算成估值，也不能把原器具参数推导成电饭煲参数。

## r1→r36 完整变更台账

### 版本与状态

- 版本：`source-backed-one-pot-v1-20260804-national-r1` → `source-backed-one-pot-v1-20260804-national-r36`；
- 总数：119 → 176（新增57条）；
- `executable`：0 → 10；
- `recipe_fact_checked`：118 → 165；
- `identity_verified`：1 → 1。

### 全部新增条目（57）

新增即进入内部 `executable` 的9条：

1. `philips-cantonese-cured-rice` — 广东腊味饭；
2. `toshiba-mixed-chicken-bamboo-rice-rc-dr18t` — 东芝什锦饭；
3. `taiwan-tatung-cabbage-rice` — 大同電鍋高麗菜飯；
4. `zojirushi-pork-vegetable-rice-el-ns23` — 豚肉と野菜のおかずごはん；
5. `panasonic-nf-pc400-takikomi-rice` — 炊き込みごはん；
6. `panasonic-khao-man-gai-nf-ac1000` — カオマンガイ；
7. `zojirushi-okayama-ebimeshi-el-ns23` — えびめし；
8. `tatung-beef-burdock-takikomi-rice` — 牛肉とごぼうの炊き込みご飯；
9. `tatung-nasi-goreng-style-rice` — ナシゴレン風炊き込みご飯。

新增并保持 `recipe_fact_checked` 的48条：

1. `panasonic-hyogo-tako-meshi` — 兵庫ご当地 たこめし；
2. `panasonic-tokyo-fukagawa-meshi` — 東京ご当地 深川めし；
3. `panasonic-gomoku-rice-nf-ac1000` — 五目ごはん；
4. `panasonic-hiroshima-oyster-lemon-paella` — 広島ご当地 かきとレモンのパエリア；
5. `panasonic-pilaf-nf-ac1000` — ピラフ；
6. `panasonic-biryani-style-takikomi-rice` — ビリヤニ風炊き込みごはん；
7. `panasonic-yamagata-imoni-takikomi-rice` — 〖山形県ご当地メニュー〗いも煮炊込みごはん；
8. `panasonic-shimane-pork-ponzu-takikomi-rice` — 〖島根県ご当地メニュー〗島根県産豚肉とポン酢のさっぱり炊込み；
9. `panasonic-ehime-tai-meshi` — 〖愛媛県ご当地メニュー〗鯛めし；
10. `panasonic-nagasaki-yudeboshi-daikon-rice` — 〖長崎県ご当地メニュー〗ゆで干し大根の炊込みごはん；
11. `panasonic-okinawa-jyushi` — 〖沖縄県ご当地メニュー〗ジューシー；
12. `panasonic-hokkaido-corn-butter-rice` — 〖北海道ご当地メニュー〗炊込みコーンバターごはん；
13. `panasonic-ibaraki-sweet-potato-rice` — 〖茨城県ご当地メニュー〗さつまいもごはん；
14. `panasonic-kanagawa-shirasu-ume-rice` — 〖神奈川県ご当地メニュー〗湘南産しらすと油揚げの梅茶漬け炊込みごはん；
15. `panasonic-nagano-salmon-nameko-rice` — 〖長野県ご当地メニュー〗信州産サーモンとなめ茸の炊込みごはん；
16. `panasonic-hyogo-black-edamame-rice` — 〖兵庫県ご当地メニュー〗丹波の黒枝豆ごはん；
17. `panasonic-asian-style-takikomi-rice` — アジア風炊込みごはん；
18. `panasonic-pilaf-rice-sr-x910e` — ピラフ（SR-X910E炊飯器版）；
19. `panasonic-kanoya-dashi-rice-sr-v10ba` — 〖茅乃舎監修〗茅乃舎だし だし炊きごはん；
20. `panasonic-vegetable-dashi-rice-sr-v10ba` — 〖茅乃舎監修〗野菜だし だし炊きごはん；
21. `panasonic-frozen-seafood-paella-rice` — 〖料理家 ぐっち夫婦監修〗冷凍シーフードのパエリア風ごはん；
22. `zojirushi-gomoku-rice-el-ns23` — 五目ご飯；
23. `zojirushi-yakisaba-meshi-ep-fa10` — 焼きさばめし；
24. `philips-chicken-lap-cheong-claypot-rice` — 鸡肉腊肠煲仔饭；
25. `taiwan-millet-root-vegetable-rice` — 小米炊飯；
26. `ntuh-low-sodium-spanish-paella-rice` — 低鈉西班牙燉飯；
27. `taiwan-turmeric-chicken-risotto` — 薑黃雞腿燉飯；
28. `taiwan-bottle-gourd-mushroom-rice` — 瓠瓜香菇飯；
29. `philips-salmon-gomoku-rice` — 鮭魚五目炊飯；
30. `philips-chicken-vegetable-takikomi-rice` — 雞汁野菜炊飯；
31. `zojirushi-mushroom-brown-rice` — 菌菇糙米饭；
32. `taishan-crucian-carp-rice` — 台山鲫鱼饭；
33. `guangdong-pumpkin-chicken-braised-rice` — 南瓜鸡肉焖饭；
34. `hakka-creative-sweet-potato-rice` — 客家創意地瓜飯；
35. `taichung-encounter-happiness-taro-rice` — 遇見幸福芋頭飯；
36. `longjing-jiangmi-chicken` — 江米鸡饭；
37. `tatung-golden-takikomi-rice` — 黄金炊き込みご飯；
38. `tatung-khao-mok-gai` — カオ・モック・ガイ；
39. `tatung-oyster-mountain-vegetable-rice` — 牡蠣と山菜の炊き込みご飯；
40. `tatung-chicken-cabbage-sesame-rice` — 鶏とキャベツの麻油炊き込みご飯；
41. `tatung-hainan-chicken-rice` — 海南鶏飯シンガポールチキンライス；
42. `tatung-paella-style-seafood-rice` — パエリア風魚介の炊き込みご飯；
43. `tatung-tongzai-rice-cake` — 筒仔米糕（ドンズーミーガオ）；
44. `tatung-cajun-chicken-rice` — ケイジャンチキンライス；
45. `tatung-pork-jowl-sesame-rice` — 豚トロとごま油炊き込みご飯；
46. `tatung-taro-shiitake-vegetarian-oil-rice` — 芋头香菇素油饭；
47. `tatung-daikon-tofu-skin-rice` — 萝卜豆皮炊饭；
48. `tatung-salted-squid-corn-rice` — 咸小卷玉米炊饭。

### 全部状态晋升（1）

- `shanghai-salted-pork-vegetable-rice` — 上海咸肉菜饭：`recipe_fact_checked` → `executable`。4人份证据已由页面 Recipe JSON-LD `recipeYield=["4"]` 与菜谱卡 `Serves: 4` 双重复核，追溯准入条件解除。

因此 r36 的10条 `executable` 等于“9条新增即进入 + 1条既有晋升”，没有未列出的晋升。

## 验证结果

- `node tools/build-source-backed-one-pot-catalog.mjs --check`：通过；
- `node tools/check-source-backed-one-pot-catalog.mjs`：通过；
- 目录数据专项测试：`195/195` 通过；目录测试合计：`361/361` 通过；构建、渲染和综合目录门禁继续通过；
- 全量 Node 测试（单线程，避免计时类假红）：`2129/2129` 通过；
- 版本 `r37` 现有状态分布：`executable=10`、`recipe_fact_checked=165`、`identity_verified=1`；
- 本轮没有修改 worker、前端、Planner，没有新增运行时功能，没有部署 production，PR 继续保持 Draft。

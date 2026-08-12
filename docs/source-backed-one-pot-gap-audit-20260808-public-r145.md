# r145 既有条目缺口审计（日本 / 台湾 / 澳门公共来源）

日期：2026-08-08  
基线：`source-backed-one-pot-v1-20260808-global-r144`，923 条  
范围：只复核已有 `recipe_fact_checked` 条目；不新增 canonical、不改主 JSON、不晋升 `executable`。  
核验方式：对每条的 `source_refs[].url` 直接打开原页面，核对页面标题、份数/合、食材量、液体、制作步骤和总时长。页面明确写出的事实才记为“已核实”；没有总时长、份数或可表达的范围，继续保留 `null`。

## 结论

- 本轮逐页复核 15 条，均能在当前记录的直接来源中找到对应的具名菜和核心步骤，没有发现近名拼接或器具等价推导。
- 可考虑下一批回填的只有两类：
  - `taiwan-pumpkin-rice` 的官方农业部页面明确给出约 60 分钟，可补 `time_contract`；
  - `panasonic-oyster-negi-takikomi-rice` 的官方页面给出白米/无洗米炊込み 54–60 分钟，但当前 schema 只有单一 `total_minutes`，不能把范围取中值，因此暂不写入。
- 其余条目的缺口是来源本身没有固定份数、总时长或可安全表达的单值；继续保留 `null` 比“从水位线/焖 5 分钟推总时长”更诚实。
- 本轮没有修改 `tools/data/source-backed-one-pot-recipes.v1.json`、运行时代码或 UI。

## 逐条原文核验

| recipe_id | 直接来源与原文核实 | 当前缺口 / 可否回填 | 器具边界与结论 |
|---|---|---|---|
| `panasonic-hyogo-tako-meshi` | [Panasonic 兵库 たこめし](https://panasonic.jp/cooking/recipe/autocooker/1436.html)：页面标题为兵库地方たこめし；总调理约 50 分钟；材料为 2 合、白米 300g、熟章鱼 200g、A 水 420mL 及调味料；步骤明确米与 A 入锅后铺章鱼、自动锅完成。 | `fixed_batch` 仍为空：页面写“2合分”而非人数，不能把合数换算成人数。液体 420mL、时间 50 分钟已在目录。 | 仅 Panasonic NF-AC1000/NF-AC700 自动锅；不外推普通电饭煲。 |
| `panasonic-tokyo-fukagawa-meshi` | [Panasonic 东京 深川めし](https://panasonic.jp/cooking/recipe/autocooker/1342.html)：页面给 2 合、白米 300g；蛤蜊煮汁与水合计 380mL；蛤蜊罐头 2 罐（260g）及葱、真姬菇、油豆腐；总调理约 50 分钟；按页面顺序装入自动锅。 | `fixed_batch` 仍为空：2 合不是 servings。 | 仅 NF-AC1000/NF-AC700；蛤蜊为罐装熟制来源，不推导普通电饭煲。 |
| `panasonic-gomoku-rice-nf-ac1000` | [Panasonic 五目ごはん](https://panasonic.jp/cooking/recipe/autocooker/1263.html)：总调理约 55 分钟；3 合分，白米 450g，常温水 610mL，鸡肉 50g、牛蒡、蒟蒻、干香菇、油豆腐、胡萝卜等量及装锅步骤均在正文。 | `fixed_batch` 仍为空：页面只写 3 合分，没有人数。 | 仅 NF-AC1000/NF-AC700 自动锅；不把设备程序外推。 |
| `panasonic-hiroshima-oyster-lemon-paella` | [Panasonic 广岛牡蛎柠檬海鲜饭](https://panasonic.jp/cooking/recipe/autocooker/1525.html)：约 55 分钟；3 合分、白米 450g；A 水 170mL（含碎牡蛎/柠檬皮）、B 温水 300mL 与调味料，牡蛎、虾、椒定量和闭盖流程均在正文。 | `fixed_batch` 仍为空：3 合不是 servings。分层液体已按来源记录为总 470mL，不拆成推导比例。 | 仅 NF-AC1000/NF-AC700；不外推普通锅。 |
| `panasonic-pilaf-nf-ac1000` | [Panasonic 海鲜蔬菜抓饭](https://panasonic.jp/cooking/recipe/autocooker/1454.html)：约 55 分钟；3 合分、白米 450g、水 600mL、洋葱 150g、海鲜混合 150g、什锦蔬菜 150g、黄油 36g；米、液体和配料同锅流程明确。 | `fixed_batch` 仍为空：来源没有人数。 | NF-AC1000/NF-AC700 自动锅版本；不把“抓饭”当新疆器具或普通电饭煲等价。 |
| `panasonic-biryani-style-takikomi-rice` | [Panasonic 比里亚尼风炊込み饭](https://panasonic.jp/cooking/recipe/autocooker/1555.html)：调理约 55 分钟；2 合分，鸡翅根 7 本/350g、白米 300g、水 280mL；腌制、浸米、分层入锅、完成后不开盖蒸 15 分钟的步骤可直接读到。 | `fixed_batch` 仍为空：2 合不等于人数；时间和水量已闭合。 | 仅 NF-AC1000/NF-AC700 自动锅；不能命名为传统 biryani 的同器具版本。 |
| `panasonic-oyster-negi-takikomi-rice` | [Panasonic 牡蛎与葱炊込み饭](https://foodable.jpn.panasonic.com/recipes/group-detail/905959)：4 人分、白米 2 合、牡蛎 6 个/120g、葱 1/4 根；水到银シャリ水位线 2；页面明确白米/无洗米炊込み程序 54–60 分钟及完整投料顺序。 | 当前 `time_contract=null`。54–60 分是范围，不能取 57 分写入单值 DSL；应保持 null，或以后扩展可表达范围的字段后再补。`safety_endpoints` 仍缺官方牡蛎温度终点。 | Panasonic SR-VSX101/VSX181 下载课程；水位线与时长不外推其他型号。 |
| `panasonic-tokyo-seafood-pilaf` | [Panasonic 东京洋食海鲜焗饭](https://foodable.jpn.panasonic.com/recipes/group-detail/619)：6 人分、白米 3 杯、白酒 1.5 小匙、汤约 600mL、海鲜混合 150g，按页面洗米、加液体到电饭煲水位线 3、上铺配料、炊込み完成。 | 页面未给总调理分钟数，只给程序“炊込み”；`time_contract` 保持 null。未给海鲜温度终点，安全仍缺。 | Panasonic 指定电饭煲/水位线；不可由水位线推导普通锅时间。 |
| `panasonic-chicken-cream-pilaf` | [Panasonic 鸡肉奶油焗饭](https://foodable.jpn.panasonic.com/recipes/group-detail/607)：4 人分、白米 2 杯、鸡腿肉 80g、胡萝卜 30g、玉米 30g、汤约 400mL；饭熟后加鲜奶油 50mL、黄油 20g，焖 5 分钟。 | 页面没有总调理分钟数，只有完成后焖 5 分钟，不能把 5 分钟当全程时间；`time_contract` 保持 null。鸡肉安全温度也未在该页给出。 | Panasonic 指定电饭煲炊込み；奶油和黄油是出锅后加入，不应误写成全程同锅液体。 |
| `jp-hiroshima-kakimeshi` | [日本农林水产省 广岛 かき飯](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/42_28_hiroshima.html)：4 人分；米 480g（3 杯）、牡蛎 300g、牛蒡/胡萝卜/油豆腐、出汁 3 杯；牡蛎先煮取汁，米与出汁入电饭煲，煮好后牡蛎焖 10 分钟。 | 原页没有从开火到完成的总分钟数；“牡蛎焖 10 分钟”不能冒充总时长，`time_contract` 保持 null；未给牡蛎温度终点。 | 原页明确电饭煲；先煮牡蛎再焖属于分阶段流程，不删减为“全部生料同锅”。 |
| `jp-shiga-amenoio-gohan` | [日本农林水产省 滋贺 あめのいおご飯](https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/amenoio_gohan_shiga.html)：4 人分；琵琶鳟 160g、米 2 合/290g、昆布水 2 杯、酱油 35mL、蔬菜定量；鱼先处理并取汁，米与昆布汁等入锅，熟后拆骨拌葱。 | 原页没有总调理时间，也没有鱼类中心温度；`time_contract`、鱼安全终点保持 null。 | 传统地方菜的电饭煲流程；鱼汁与昆布水是来源事实，不能与其他鱼饭版本拼接。 |
| `macau-tomato-corn-rice` | [澳门体育局 蕃茄粟米飯](https://sportnutrition.sport.gov.mo/zh/show/pastanrice/id/106)：6 人份；白米 2 杯、番茄 1 个、玉米 1/2 杯、洋葱、鸡汤 2-3/4 杯；先炒蒜/洋葱/番茄，白米洗净入电饭煲，近熟时加入玉米。 | 页面没有总调理分钟数；“近熟时”是投料节点而非总时长，`time_contract` 保持 null。 | 明确电饭煲但含前置炒香与中途投料，保留 staged 边界。 |
| `taiwan-pumpkin-rice` | [台湾农业部农业儿童网 南瓜飯](https://kids.moa.gov.tw/theme_data.php?theme=kids_cooking&id=66)：材料明确南瓜 600g、白米 4 杯、爆香料；“制作时间约 60 分钟”；炒米/爆香料后入电锅，加 5 杯水、南瓜、鸡粉，外锅 1 米杯水。 | 当前 `fixed_batch=null`（没有 servings）；当前 `time_contract=null`，但原页直接写“约 60 分钟”，可在下一数据批次补 `total_minutes:60`，并保留“约”说明。 | 台湾电锅流程；5 杯为内锅液体、外锅 1 米杯是程序水，不能合并成单一米水比例。 |
| `taiwan-mushroom-bamboo-shoot-rice` | [台湾农业部农业儿童网 香菇筍仔飯](https://kids.moa.gov.tw/theme_data.php?theme=kids_cooking&id=272)：制作时间 30 分钟；米/糙米各 1/2 杯、竹笋 50g、香菇 3 朵、猪肉丝 50g、金钩虾 10g、水 1 杯；炒料与米后加盖中火煮至米熟。 | 当前 `fixed_batch=null`，原页没有 servings；时间与液体已在目录。 | 原页是炉上有盖锅，不是电锅；不因为同为一锅饭而推导电饭煲参数。 |

## 建议的下一批

1. **可直接准备回填**：`taiwan-pumpkin-rice.time_contract.total_minutes=60`，source_id 使用现有 `S-TW-MOA-KIDS-PUMPKIN-RICE-1`；需在测试中保留“约 60 分钟”来源说明。
2. **暂不回填**：`panasonic-oyster-negi-takikomi-rice` 的 54–60 分钟；应等 Ratio/时间合同支持范围后再记录，不能中值化。
3. 其他 13 条当前缺口均为“来源没有固定 servings 或总时长”，不应从 2 合/3 合、水位线、焖 5 分钟、炊込み程序名称推导。

## 证据边界

- Panasonic NF-AC1000/NF-AC700 与 SR-VSX101/VSX181 是不同设备族；本审计只确认原页面所写的机型和程序。
- MAFF 页面中的“先煮/取汁/熟后焖”属于分阶段流程；没有把它们改写成完全生料同锅。
- 澳门页面的“近熟时加玉米”保留为中途投料；没有静默删除这个步骤。
- 本文是缺口审计，不是 `executable` 签署，也不代表已完成厨房验证。

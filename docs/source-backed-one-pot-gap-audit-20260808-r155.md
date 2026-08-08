# 既有菜谱合同缺口审计（r155：港台／澳门／公共官方来源）

> 审计日期：2026-08-08
> 目录基线：`source-backed-one-pot-v1-20260808-global-r154`（923 条；安全终点覆盖 108/923）
> 本轮性质：只复核已经存在的 `recipe_fact_checked` 条目；不新增 canonical，不修改主 JSON、CSV、运行时代码或 UI。
> 结论：**3 个字段值得送 TDD，其余条目继续保留缺口。**

## 审计口径

本轮只做合同字段的同源回填审查，优先检查 `fixed_batch`、`liquid_contract`、`time_contract`。每个拟回填字段必须由该条目自己的官方来源直接证明；不把近名菜、同名的另一版本、另一器具或一般烹饪常识拼进来。

- 来源只证明原文明确写出的事实。普通锅、砂锅、蒸笼、烤箱、电锅和指定型号电饭煲保持原器具边界，不相互推导。
- 份数范围（例如“2–3 人”“4–6 人”）不得压成单一 `servings`；“一锅”也不等于固定份数。
- 休息、焖、复热或某一个步骤的分钟数不得冒充全菜 `time_contract`。只有来源明确绑定到该菜的总制作时间，才可回填总时长。
- 米水比例、浸泡水、汤包和外锅水如果不能在现有字段中无损表达，就保持 `liquid_contract: null`；不能取范围中值，也不能把外锅水当内锅液体。
- 这是一份送审清单，不是晋升报告。即使 TDD 通过，也仍须经过既有 validator 和人工签署，不能直接变成 `executable`。

## 可送下一批 TDD 的字段

| recipe_id | 官方来源与已核实事实 | 当前缺口 | r155 判定 |
|---|---|---|---|
| `taiwan-bottle-gourd-mushroom-rice` | [台湾农业部农业儿童网·瓠瓜香菇飯](https://kids.moa.gov.tw/theme_data.php?id=50&theme=kids_cooking)，正文定位记载瓠瓜、干香菇、胡萝卜、米 3 杯、水 3 杯；并明确“制作时间约 1 小时”。 | `fixed_batch` 仍无来源份数；`liquid_contract` 已有 3 杯水；安全终点没有新增依据。 | **可送 TDD：补 `time_contract.total_minutes=60`。** 时间与同一来源绑定，不能借其他电锅程序补份数。 |
| `taiwan-pork-rib-claypot-rice` | [台湾农业部儿童食农教育资讯网·排骨煲仔飯](https://kids.moa.gov.tw/theme_data.php?id=282&theme=kids_cooking)，正文定位记载排骨 300g、白米/糙米各半杯、鲜菇鸡汤半包加水 2 杯、白菜和鸿喜菇；步骤为腌排骨后在砂锅分段焖煮，制作时间 30 分钟。 | `fixed_batch` 无来源份数；液体由“半包汤”与 2 杯水组成，当前单值字段不能无损表示；安全终点仍空。 | **可送 TDD：补 `time_contract.total_minutes=30`。** 液体保持 null，不把半包高汤擅自换算成杯或克，也不外推电饭煲。 |
| `taiwan-ten-fragrant-rice` | [台湾农粮署北区分署电子书·十香飯](https://ebook.afa.gov.tw/tefd/ebook8/ebook8-1.html)，目标食谱段明确白米 300g、水 336g，以及腊肉、腊肠、豆干、香菇、虾米等十香配料；流程为配料处理后与米水入饭锅蒸熟。 | `fixed_batch`、`time_contract` 均无固定证明；现有来源备注仍需保留“米饭”与生米浸泡/煮制措辞的状态歧义。 | **可送 TDD：候选补 `liquid_contract` 的原文 336g。** 测试必须锁定该来源段落的 300g/336g 对，不得抽象成跨配方 Ratio DSL；若状态歧义无法在 schema 中诚实表达，则宁可保持 null。 |

上述 3 项之外，本轮没有把任何字段直接写回主目录；它们只是下一批 TDD 的最小候选。

## 已核实但暂不具备回填条件的条目

| recipe_id | 直达来源与核实事实 | 不能回填的原因 | 处理 |
|---|---|---|---|
| `macau-tomato-corn-rice` | [澳门体育局·蕃茄粟米飯](https://sportnutrition.sport.gov.mo/zh/show/pastanrice/id/106)：官方页给 6 人、白米 2 杯、番茄、玉米、鸡汤 2¾ 杯，明确爆香后入电饭煲、近熟时加玉米。 | 没有绑定整道菜的总制作时间。 | 保留现有 batch/liquid，time 继续 null。 |
| `taiwan-turmeric-chicken-risotto` | [台湾农业部·薑黃雞腿燉飯](https://kids.moa.gov.tw/theme_data.php?id=297&theme=kids_cooking)：米 1/2 杯、内锅高汤 1/2 杯、椰浆 2 大匙、外锅水 1 杯，制作约 30 分钟。 | 已有 time；内锅多种液体与外锅水是分层事实，不能压成一个液体值；没有固定份数。 | 不新增字段；保留 `liquid_contract: null`。 |
| `taichung-encounter-happiness-taro-rice` | [台中市农会／台湾农业部食农平台·遇見幸福芋頭飯](https://fae.moa.gov.tw/map/food_item.php?id=102&type=AS07)：米 1.5 杯、芋头约 150g、绞肉或猪肉丁、香菇、虾米，备料约 2–3 人份，电锅煮好后焖 15 分钟。 | 2–3 是范围，不可压成单值；“按一般煮饭”没有明确液体；15 分钟是焖制而非总时长。 | 不回填 batch/liquid/time。 |
| `taiwan-mushroom-bamboo-shoot-rice` | [台湾农业部·香菇筍仔飯](https://kids.moa.gov.tw/theme_data.php?theme=kids_cooking&id=272)：白米/糙米各半杯、竹笋 50g、猪肉丝 50g、金钩虾 10g、水 1 杯、制作 30 分钟；炉上有盖锅。 | 份数没有来源；液体和时间已经记录，器具明确为普通锅。 | 不回填 batch，不推导电饭煲。 |
| `taiwan-tongzai-rice-cake` | [台湾农业部·筒仔米糕](https://kids.moa.gov.tw/theme_data.php?theme=kids_cooking&id=288)：糯米半杯、猪绞肉 50g、金钩虾 10g、香菇等；先蒸约 15 分钟、装筒后再蒸约 5 分钟，页面另写制作时间 30 分钟。 | 没有份数或液体；步骤分钟与页面总时长存在口径冲突，不建立 time contract；本质是二次蒸制。 | 保持缺口与 `not_adapted`。 |
| `taiwan-pumpkin-rice` | [台湾农粮署儿童网·南瓜饭](https://kids.moa.gov.tw/theme_data.php?theme=kids_cooking&id=66)：同一版本写南瓜 600g、白米 4 杯、约 60 分钟，并区分内锅水与外锅水。 | 现有目录已有另一来源的时间/液体合同；本轮不把同名不同版本拼接或覆盖。 | 保持现有合同与版本分离。 |
| `taiwan-sweet-potato-salted-rice` | [台湾农业部·地瓜鹹飯](https://kids.moa.gov.tw/theme_data.php?id=230&theme=kids_cooking)：米水 1:1，另加半米杯，香菇/萝卜干先炒后带盖锅焖约 15 分钟。 | 复合液体不能用当前单值字段无损表达；无份数，15 分钟也非明确总时长。 | 不回填。 |
| `hk-yam-longan-chicken-claypot-rice` | [香港卫生署有营食谱·淮山圓肉雞柳煲仔飯](https://restaurant.eatsmart.gov.hk/b5/content.aspx?content_id=756)：2 人、米 1 碗、水 1½ 碗、鸡柳、淮山，浸米 1 小时，慢火约 10 分钟至熟透。 | batch/liquid/time 已完整；页面没有温度型安全终点，且“鸡柳”未明确生鲜状态。 | 合同不变；安全另走安全缺口审计。 |
| `hk-choy-sum-scallop-rice` | [香港卫生署 PDF·菜心瑤柱飯](https://www.chp.gov.hk/files/her/exn_nutp_043b.pdf)，第 6 页给 4–6 人、菜心 600g、白米 2 小杯、干瑶柱 2 粒；瑶柱水入电饭煲，菜心炒后拌入并焗 10 分钟。 | 份数是范围；液体只有“适量”；10 分钟是拌入后的焗制步骤，不是总时长。 | 不回填。 |
| `hk-hiroshima-oyster-mushroom-claypot-rice` | [香港食环署食谱卡](https://www.fehd.gov.hk/english/pleasant_environment/tidy_market/images/ahtak_recipe/202010_w4a.jpg)：米 1 杯、水 200ml、广岛蚝 6–8 只、杂菌；蚝先煮 2–3 分钟，米煮 13–15 分钟，最后合并 2 分钟、焖 5 分钟。 | 无固定份数，也没有整道菜总时长；流程为先煮蚝再入锅，不能把步骤相加当合同。 | 不回填。 |
| `hk-tomato-mushroom-chicken-rice` | [香港食环署食谱卡](https://www.fehd.gov.hk/english/pleasant_environment/tidy_market/images/ahtak_recipe/202012_w1a.jpg)：米 1 碗、水 0.8 杯、番茄、杂菌、去皮鸡腿；腌 10 分钟后入电饭煲，完成焖 3 分钟。 | 未给 servings 或总制作时间；腌制/焖制分钟不能冒充总时长。 | 不回填。 |
| `hk-salmon-edamame-quinoa-rice` | [香港食环署食谱卡](https://www.fehd.gov.hk/english/pleasant_environment/tidy_market/images/ahtak_recipe/202012_w1b.jpg)：三文鱼、毛豆、藜麦、米和水 2 杯；藜麦浸 10 分钟，入电饭煲后焖 3 分钟。 | 没有份数与总时长；鱼的原料状态和安全终点也未由卡片明确。 | 不回填，安全另审。 |
| `hk-pumpkin-shiitake-pork-rice` | [香港食环署食谱卡](https://www.fehd.gov.hk/english/pleasant_environment/tidy_market/images/ahtak_recipe/202012_w2b.jpg)：米 1 杯、水 0.8 杯、瘦肉末 120g、南瓜、干香菇；肉腌 15 分钟，电饭煲完成后焖 3 分钟。 | 无 servings 与总时长；腌制/焖制分钟不能当整道菜时间。 | 不回填。 |
| `hk-sakura-shrimp-chicken-quinoa-rice` | [香港食环署食谱卡](https://www.fehd.gov.hk/english/pleasant_environment/tidy_market/images/ahtak_recipe/202012_w3a.jpg)：樱花虾、干香菇、鸡扒 120g、藜麦、米和水 2 杯；鸡肉腌 20 分钟，电饭煲完成后焖 3 分钟。 | 无 servings 与总时长；海鲜/鸡肉状态不足以在本轮合同审计中补安全字段。 | 不回填。 |
| `taiwan-red-date-rice` | [台湾农业部·红枣饭](https://kids.moa.gov.tw/theme_data.php?theme=kids_cooking&id=200)：米 3 杯、干枣约 30 颗，先以泡枣水再补水，浸泡约 15–20 分钟后煮熟。 | 水量对象和总时间都不精确；浸泡时间不是总制作时间。 | 不回填。 |
| `taiwan-angelica-sesame-chicken-rice` | [台湾农业部知识农场·当归麻油鸡饭](https://kmweb.moa.gov.tw/subject/subject.php?id=34867)：当归、鸡块、米或红糯米，电锅流程。 | 没有固定用量、份数、液体或总时长。 | 仅保留身份与流程档案。 |

## r155 后续建议

1. 先为前三条各写独立失败测试：测试应断言来源 ID、字段对象和器具边界，而不是只断言数字出现；再由主线决定是否入 r155/r156 JSON。
2. `taiwan-ten-fragrant-rice` 若状态歧义无法在当前 schema 中表达，测试应允许保持 `liquid_contract: null`，不能为了增加“闭合数”绕开 `cooker_adaptation` 的 source-limited 说明。
3. 不要把本轮已核实的澳门、香港卡片和台湾农粮署条目批量晋升 `executable`；它们大多仍缺固定份数、总时间或可无损表达的液体合同。
4. 本轮不改变 `catalog_version`，不重建 artifacts，不改运行时；主目录安全覆盖仍为 108/923。

## 变更证明

- 本文件只记录 r155 缺口审计与候选，不会被目录渲染器视为闭合合同。
- 未修改 `tools/data/source-backed-one-pot-recipes.v1.json`、CSV、生成 artifacts、runtime 或 UI。
- 收尾前运行 `git diff --check`。

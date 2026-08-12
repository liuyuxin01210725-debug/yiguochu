# 既有菜谱合同缺口审计（r157：港台／台湾同源回填复核）

> 审计日期：2026-08-08
> 目录基线：`source-backed-one-pot-v1-20260808-global-r156`（923 条；安全终点覆盖 114/923）
> 本轮性质：只复核已有 `recipe_fact_checked` 条目；不新增 canonical，不修改主 JSON、CSV、运行时代码或 UI。
> 结果：**本轮没有新的、可以无损写回的合同字段；0 条进入 TDD 回填批次。**

## 审计口径

本轮只检查既有来源是否直接补足 `fixed_batch`、`liquid_contract` 或 `time_contract`。来源只证明原文明确写出的事实；不同版本、不同器具和不同米态不拼接。普通锅、砂锅、蒸笼、烤箱、电锅和指定型号电饭煲保持原器具边界。

- “2–3 人”“4–6 人”只能记录为范围，不能压成一个 `servings`。
- 浸泡、焖、复热、某一步蒸煮或“近熟时加入”不能冒充整道菜的总时长。
- 外锅水、泡香菇水、汤包和“水适量”如果不能由当前字段无损表达，保持 `liquid_contract: null`；不能取范围中值。
- 先炒、汆烫、另锅煮料、回锅或蒸筒二次蒸制必须记录为 staged/extra-pan 边界，不能改写成单器具直达电饭煲。

## 本轮用浏览器直接打开核对的来源

以下页面通过 web-access CDP 直接打开并读取正文；目录中的来源定位与页面事实一致，但没有产生新的可写回合同字段。

| recipe_id | 直接来源与可证明事实 | 当前缺口 | r157 判定 |
|---|---|---|---|
| `taiwan-mushroom-bamboo-shoot-rice` | [台湾农业部·香菇筍仔飯](https://kids.moa.gov.tw/theme_data.php?theme=kids_cooking&id=272)：白米/糙米各半杯、竹笋 50g、猪肉丝 50g、金钩虾 10g、水 1 杯；先炒配料和米，再以有盖锅煮，页面写制作时间 30 分钟。 | 没有固定份数；器具是普通锅，不能借电锅比例补份数。 | 液体与时间已经在目录；`fixed_batch` 继续 null，不回填。 |
| `taiwan-tongzai-rice-cake` | [台湾农业部·筒仔米糕](https://kids.moa.gov.tw/theme_data.php?theme=kids_cooking&id=288)：长糯米半杯、猪绞肉 50g、金钩虾 10g、香菇等；先蒸约 15 分钟，装筒后再蒸约 5 分钟，页面另写制作时间 30 分钟。 | 无份数、无可复用内锅液体；步骤时间与页面总时长口径不同，且属于蒸筒二次蒸制。 | 保持 `fixed_batch/liquid_contract/time_contract` 缺口，不把 30 分钟写成总时长。 |
| `taiwan-yam-rice` | [台湾农业部·山藥飯](https://kmweb.moa.gov.tw/subject/subject.php?id=33811)：白米 1 杯、山药 200g、干香菇 50g、绞肉 50g，米浸泡 20 分钟；山药过油、香菇和肉炒熟后入电锅，加 1 杯水煮熟。 | 没有固定份数或整道总时长；过油和炒料属于入锅前阶段。 | 液体已记录；不补 `fixed_batch/time_contract`，不宣称单器具全流程。 |
| `r106-tw-taro-salted-congee` | [台湾农业部·芋頭鹹粥](https://kids.moa.gov.tw/theme_data.php?id=203&theme=kids_cooking)：米 1 杯、芋头 250g、芋莖 4 支、猪肉丝 150g、鸡蛋 1 个、清水 1500cc；米和芋头先煮，小火约 10 分钟，再依次加入芋莖、猪肉和蛋。 | 页面没有份数和总制作时间；10 分钟只是中途小火阶段，不能冒充整道时长。 | 液体已记录；`fixed_batch/time_contract` 继续 null。 |
| `macau-tomato-corn-rice` | [澳门体育局·蕃茄粟米飯](https://sportnutrition.sport.gov.mo/zh/show/pastanrice/id/106)：6 人份、白米 2 杯、番茄 1 个、玉米半杯、鸡汤 2¾ 杯；爆香后入电饭煲，近熟时加入玉米。 | 来源没有整道总时长；“近熟时”不是分钟合同。 | `fixed_batch/liquid_contract` 已闭合；`time_contract` 保持 null。 |
| `macau-scallop-mushroom-vegetable-rice` | [澳门体育局·帶子磨菇菜飯](https://sportnutrition.sport.gov.mo/zh/show/pastanrice/id/30)：3 人份、白米 1 杯、蘑菇/白菜/鲜带子各 100g、清鸡汤 300mL；一半鸡汤先煮菜和菇，另一半用于煮饭，饭滚后合入带子和蔬菜。 | 没有总制作时间；两段汤锅流程不能合并成单一“电饭煲时长”。 | `fixed_batch/liquid_contract` 已闭合；`time_contract` 保持 null。 |
| `taiwan-shiitake-tea-oil-vegetable-rice` | [农粮署食米教育·香菇茶油菜飯](https://www.riceeducation.com.tw/fr/teachcreative/c/128)：白米 3 杯；正文同时写约 3 杯水、以 1.5 杯香菇水替代 1.5 杯泡米水；电子锅跳起前 5 分钟放菜，跳起后焖 5 分钟。 | 没有固定份数或总制作时间；液体是替换/分层关系，不能压成一个普通“加水”值。 | 保持 `fixed_batch/liquid_contract/time_contract` 缺口，避免把香菇水替换误写成通用水量。 |
| `taiwan-tea-oil-vegetable-health-rice` | 同上官方页面的茶油蔬食養生飯：米 2 米杯、南瓜/地瓜/菇/青豆/木耳/白花椰菜等，内锅 2 米杯水、外锅 1 米杯水，跳起后焖 10 分钟。 | 没有固定份数或总制作时间；内锅水和外锅水是不同层级。 | 不回填；保持 staged liquid 边界。 |
| `taiwan-sweet-potato-salted-rice` | [台湾农业部·地瓜鹹飯](https://kids.moa.gov.tw/theme_data.php?id=230&theme=kids_cooking)：白米与水 1:1，另加半量米杯；香菇和菜圃先炒，带盖锅中火转小火约 15 分钟。 | 无固定份数；复合水量不能用当前单值合同无损表达；15 分钟是炉上阶段而非总时长。 | 不回填，且保持普通锅边界。 |

## 同一来源已登记、但本轮仍不能闭合的条目

| recipe_id | 来源与已登记事实 | 未闭合原因 | 处理 |
|---|---|---|---|
| `taiwan-cabbage-rice` | [农粮署／健保署高麗菜飯版本](https://media.nhi.gov.tw/md/dl-52195-25353cf985624e8aaa641aea6f390005-3.pdf)：3 人份、米 1.5 杯、炒料后与 1.5 杯水入电锅，外锅另加 1 杯水并焖 10 分钟。 | 10 分钟是跳起后的焖制；没有整道总时长。不同 2 人版也不能拼成同一合同。 | 不回填 `time_contract`。 |
| `hakka-creative-sweet-potato-rice` | [台湾农业部食农平台·客家創意地瓜飯](https://fae.moa.gov.tw/map/food_item.php?id=148&type=AS07)：米 2 杯、鸡腿肉、地瓜、四季豆和菇类，加 2 杯热水入电锅；四季豆另汆烫炒后拌入。 | 没有固定份数或整道总时长；存在另锅阶段。 | 保持 `fixed_batch/time_contract` 缺口，不改写为单锅。 |
| `taichung-encounter-happiness-taro-rice` | [台湾农业部食农平台·遇見幸福芋頭飯](https://fae.moa.gov.tw/map/food_item.php?id=102&type=AS07)：米 1.5 杯、芋头约 150g、肉类/香菇/虾米，备料约 2–3 人份，电锅煮后焖 15 分钟。 | 2–3 人是范围；没有明确内锅水量；15 分钟是焖制，不是总时长。 | 不回填三项合同。 |
| `hk-hiroshima-oyster-mushroom-claypot-rice` | [香港食环署食谱卡](https://www.fehd.gov.hk/english/pleasant_environment/tidy_market/images/ahtak_recipe/202010_w4a.jpg)：米 1 杯、水 200mL、广岛蚝 6–8 只、杂菇；蚝先煮、米另煮，最后回锅焖。 | 无固定份数和总时长；另锅/回锅步骤不能相加或改写为电饭煲直达。 | 不回填 `fixed_batch/time_contract`。 |
| `hk-salmon-edamame-quinoa-rice` | [香港食环署食谱卡](https://www.fehd.gov.hk/english/pleasant_environment/tidy_market/images/ahtak_recipe/202012_w1b.jpg)：三文鱼、毛豆、藜麦、米和水 2 杯，按电饭煲流程，出锅后静置。 | 无固定份数和总制作时间；鱼的原料状态未由卡片充分说明。 | 不回填，安全另走审计。 |
| `hk-pumpkin-shiitake-pork-rice` | [香港食环署食谱卡](https://www.fehd.gov.hk/english/pleasant_environment/tidy_market/images/ahtak_recipe/202012_w2b.jpg)：米 1 杯、水 0.8 杯、猪肉末 120g、南瓜、冬菇入电饭煲，完成后静置。 | 无固定份数和总制作时间；腌制/静置分钟不能替代总时长。 | 不回填。 |

## r157 结论

- 本轮复核 15 个既有港台／台湾条目，**0 个新字段进入 TDD**；r156 已完成的三项回填不重复改动。
- 发现的可用数字都属于已有合同、步骤阶段或边界说明：没有一项能在当前 schema 下新增且不引入版本拼接、器具推导、范围压单值或米水层级混淆。
- 下一批若要继续提高闭合率，应先决定是否扩展机器字段来表达“内锅液体／外锅水／泡液替换”和多阶段总时长；在 schema 不变前，不应为了增加闭合数强行回填。

本文件仅为 r157 缺口审计，不改变目录版本，不重建生产运行包，不部署。

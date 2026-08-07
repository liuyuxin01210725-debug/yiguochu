# 厂商官方米饭主餐候选 intake r3（2026-08-07）

> 本文件是独立候选 intake，不是生产目录晋升文件。本轮只记录厂商官方页面能直接证明的事实，不修改 `tools/data/source-backed-one-pot-recipes.v1.json`，不改变状态、不部署。
>
> 去重基线：开始核对时工作区目录为 `source-backed-one-pot-v1-20260807-national-r103`（813 条）。共享工作区随后有 r104 写入进行中，故本文件将页面 5286/5287 标为“已被并发批次收录、此处不重复列入”。最终入库前必须以当时目录重新按 URL 和规范化菜名去重。

## 收录口径

- 来源必须是厂商/品牌官方页面；厂商页面可以证明该厂商版本的食材、液体、水位、程序和步骤，但不能单独证明地域传统身份。
- `strong_candidate` 表示可以作为“一个电饭煲/电锅完成的米饭或粥主餐”继续走目录结构化流程；`boundary_candidate` 表示页面真实存在且值得保留，但需要明确器具或流程边界，不能把它包装成简单一锅直达。
- 本轮已发现的页面中，步骤明确需要外锅、平底锅、食物处理机、熟饭组装或电饭煲专用蒸盘的，均保留缺口，不拼接成新的简化做法。
- 下面的“字段证据”只复述页面明确写出的内容；页面未给份数/时间/水量时保持缺口。

## 候选记录（20 条：18 条当前未收录 + 2 条并发批次已收录）

### A. 可直接进入下一轮结构化审查的候选

| 状态 | 官方菜名 | 官方来源（直达） | 页面直接证明的字段 | 器具/流程边界 | 尚缺字段或审查项 |
|---|---|---|---|---|---|
| strong_candidate | Healthy Vegetable Fried Rice (Brown Rice)（健康蔬菜糙米炒饭） | [Tiger 官方](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/healthy-vegetable-fried-rice-brown-rice/) | 2 杯生糙米、2 杯水；胡萝卜、芹菜、洋葱、蒜、酱油、麻油、豌豆、菠菜、2 个鸡蛋；Brown 程序；完成后拌入菠菜/炒蛋/豌豆并焖约 15 分钟（页面正文行 62–96） | Tiger 多功能电饭煲 Brown；菠菜/炒蛋/豌豆不是生米同锅全程，炒蛋需另碗完成 | 份数未见；“炒饭”实为先煮糙米再拌，需按产品当前“熟饭二次烹”边界单独标注，不得伪称生米一锅炒 |
| strong_candidate | Bacon and Parmesan Risotto（培根帕玛森起司燉饭） | [Tiger 官方](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/bacon-and-parmesan-risotto/) | 3 杯机版本；1 杯白米、培根 1 块（1.8 oz）、洋葱、姜、白酒 3⅓ tbsp、高汤粉 2 tsp、起司；水加到 Risotto 刻度 1；Risotto 程序；出锅拌帕玛森（正文行 69–109） | Tiger JAJ 小型电饭煲 Risotto 程序，主过程同锅，出锅才加起司 | 未给份数/总时长；页面步骤第 107–108 行“Place 1 on 2”需回看原图或厂商上下文；高汤粉/培根的安全与营养身份需单独核对 |
| strong_candidate | Asparagus and Mushroom Risotto（芦笋蘑菇燉饭） | [Tiger 官方](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/asparagus-and-mushroom-risotto/) | 5.5 杯机；3–4 份；准备 20 分钟、慢煮 75 分钟；1½ 杯糙米、4 杯蔬菜高汤、芦笋 1 lb、蘑菇 2 oz、洋葱、帕玛森、黄油；Slow Cook 后拌黄油并撒起司 | Tiger 多功能电饭煲 Slow Cook；页面明确全部主料可同锅，出锅拌黄油/起司 | 需确认目录是否已被并发批次收录；高汤、帕玛森盐量未细化；“risotto”与本项目米饭主餐范围需保留原名，不翻成自创地域菜 |
| strong_candidate | Corn Shumai (Steamed Dumplings) + Chinese Style Mixed Rice（玉米烧卖＋中式什锦饭） | [Tiger 官方](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/corn-shumai-steamed-dumplings-chinese-style-mixed-rice/) | 5.5 杯机；3 杯白米、3 杯中式鸡汤、猪肉、牛蒡、胡萝卜、姜、香菇、麻油、酒、酱油等；Tacook 蒸盘另有猪肉烧卖、玉米、娃娃玉米；Synchro-Cooking 同时完成；正文行 62–132 | 这是同一台 Tiger 的“米饭＋上层烧卖”双层一锅设备方案，不是单一锅内混合菜饭 | 份数/总时长未给；必须作为“两品同步”边界，不能在普通电饭煲上推导；猪肉熟制终点需补安全证据 |
| strong_candidate | 皮蛋瘦肉粥（Panasonic 版） | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/216) | 白米 1 杯（180 mL）、鸡蛋 1–2 个、猪肉丝适量、皮蛋 2–3 个；稀饭水位线；先煮粥，开盖加入肉丝/蛋液/皮蛋，再蒸气保温 5–7 分钟（正文行 411–477） | Panasonic IH 电饭煲 SR-HB184/SR-HB104；明确中途开盖投料，必须按连续流程呈现 | 猪肉“适量”无克数；水位未转成可跨机型克数；需保留生肉中途投料及再加热安全终点 |
| strong_candidate | 金沙皮蛋香菇粥 | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/5156) | 约 2 人份；白米 1 量杯、咸蛋 1、皮蛋 1、干香菇 3 朵、高丽菜约 150 g、芹菜、盐胡椒；香菇热水泡 10 分钟，香菇水入锅，稀饭水位线 1（正文行 415–487） | Panasonic 可变压力 IH 电饭煲 SR-PAA100；同锅稀饭，干香菇需预泡 | 总时长未给；页面授权来自外部作者，需按项目来源许可字段记录；香菇水实际液体量未给，不能推算 |
| strong_candidate | 皮蛋瘦肉粥（象印版） | [象印台湾官方](https://www.zojirushi.com.tw/recipe/rice-cookers/446/csr) | 白米 1 杯、皮蛋 2、猪肉丝 200 g、姜丝、葱花、鸡粉；肉丝盐/太白粉腌料；加水至稀饭水位 1.5；白米→稀饭程序；完成后加调味、皮蛋、葱花（正文行 176–227） | 象印压力 IH 电子锅；明确压力锅注意事项，皮蛋/肉在完成后或余温阶段加入 | 总时长未给；肉丝在粥完成后用余温加热，需补一手安全终点或改为持续加热；与 Panasonic 版是独立厂商版本，不混合 |

### B. 真实官方页面，但暂不作为“普通电饭煲直达”承诺

| 状态 | 官方菜名 | 官方来源（直达） | 页面直接证明的字段 | 明确边界 | 尚缺字段或后续动作 |
|---|---|---|---|---|---|
| boundary_candidate | Sushi Cake（寿司蛋糕） | [Tiger 官方](https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/sushi-cake/) | 3 杯熟日本米、米醋 40 ml、糖盐；三文鱼 4–6 oz、熟虾 6、鱼子、黄瓜、紫苏、海苔；熟饭拌醋后用模具分层、翻模装饰（正文行 62–103） | 电饭煲只负责煮饭，核心是熟饭冷却/模具组装和生食海鲜；不是一锅出主餐 | 不提供煮饭水量/份数；生食安全与冷链必须另证；先放“熟饭组合候选”档案，不进入普通轮替 |
| boundary_candidate | 午仔魚一夜干絲瓜炊飯 | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/5287) | 桃園 3 号米 300 g、水 300 g、午仔鱼一夜干 240–300 g、丝瓜 200 g、姜丝盐；鱼和丝瓜铺在米上，白米标准程序，出锅拌匀 | **此页面已被当前并发 r104 批次收录，r3 不重复写入**；保留作已见证据 | 份数/总时长未给；鱼需去头去刺，需安全终点；入库时保留 Panasonic 页面授权/版本说明 |
| boundary_candidate | 炙燒鮪魚芝麻醬與毛豆白飯 | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/5286) | 台南 16 号米 300 g、水 330 g、鲔鱼 400 g、毛豆 80 g、韭菜 30 g；米、毛豆、韭菜同锅，白米标准；熟后把炙烧鲔鱼切片拌胡麻酱铺上 | **已被当前并发 r104 批次收录，r3 不重复写入**；页面明确生鱼片后置 | 生鱼片安全/冷链、份数和时间缺口；不能把“鱼片后置”改写为整锅焖鱼 |
| boundary_candidate | 培根奶油義大利燉飯 | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/155) | 6 人份、约 35 分钟；泰国米 130 g、水 700 g、高汤块、奶油、培根、洋葱、蘑菇、奶油、蛋黄、起司；蒸气微波炉 200℃ 10 分钟预炒后转入电子锅，快速程序，出锅拌蛋黄/起司（正文行 401–490） | 需要 NN-BS1000/NN-C236 蒸气微波炉预处理，非单电饭煲一锅 | 需把“外部预处理＋电饭煲”标为连续流程；蛋黄余温安全；油脂与面粉量极高，营养/适配需复核 |
| boundary_candidate | 西班牙海鮮燉飯 | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/5168) | 淡菜 6、虾 6、鱿鱼 1、鸡腿 2、意大利米 2 杯、椒/洋葱/番茄、高汤 350 g、白酒 25 g；食物处理机打蔬菜，平底锅煎鸡/炒米后入锅，剩 15 分钟开盖放海鲜，结束焖 10 分钟（正文行 411–510） | 明确依赖食物处理机＋平底锅，且中途开盖投料；SR-PAA100 只是电饭煲主体 | 不能宣称“全程一锅”；海鲜和鸡肉熟制证据、总时长缺口；保留为器具适配研究项 |
| boundary_candidate | 南瓜糙米燉飯 | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/3810) | 糙米 1 杯、南瓜 150 g、鸡高汤 600 ml、水 400 ml、洋葱、杏鲍菇、奶油、帕玛森；南瓜 170℃ 烤 10 分钟、洋葱炒软后入锅，糙米稀饭程序，出锅拌奶油，蘑菇另炒（正文行 411–496） | 外部烤箱/炒锅预处理及出锅另炒，不是直接一锅 | 时间未给；不能从页面推导无预处理替代方案；保留原结构 |
| boundary_candidate | 红豆糙米粥 | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/3812) | 糙米 1 量杯、红豆 ¼ 量杯；红豆先煮并保留煮汁，糙米稀饭约 120 分钟，最后拌入预煮红豆（正文行 411–449） | 红豆必须另锅预煮，电饭煲仅完成糙米稀饭 | 预煮红豆时间/水量未给；不能包装成一锅直接投入；可作为“分段一锅”档案 |
| boundary_candidate | 臘味飯 | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/128) | 2 人份；熟白饭 280 g、火腿 50 g、腊肠 60 g、香菇、青江菜及酱油/麻油；白饭蒸气保温，腊味香菇用蒸气微波 4 分钟后拌入（正文行 411–488） | 熟饭二次烹、微波炉投料，明确不是生米一锅 | 需单列“熟饭二次烹”品类；腊味热透/钠含量提示；不与生米焖饭混合同名 |
| boundary_candidate | 蔬果無水咖哩 | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/5264) | 米 1.5 杯；洋葱、番茄罐头、苹果、胡萝卜、鸡腿、咖喱块；无水程序 25 分钟煮咖喱，白米另煮，花椰菜和溏心蛋另锅处理后组装（正文行 411–500） | 至少两锅/多个器具步骤；不是一锅饭 | 作为“咖喱饭组合”事实记录，不进电饭煲一锅直达；来源授权为外部作者，需单独记录 |
| boundary_candidate | 雞腿肉咖哩飯（象印版） | [象印台湾官方](https://www.zojirushi.com.tw/recipe/rice-cookers/442/csr) | 白米 2 杯；马铃薯 270 g、胡萝卜 170 g、洋葱 280 g、鸡腿 450 g、水 700 ml、咖喱块、奶油/鲜奶油；白饭用压力 IH，咖喱在象印铁板万能锅另煮（正文行 176–227） | 官方明确使用两台设备，白饭和咖喱分开；不应改写成“锅内焖饭” | 份数/总时长未给；后续若上架必须显示“双锅咖喱饭”，不跨器具推导 |
| boundary_candidate | 綜合野餐飯糰 | [象印台湾官方](https://www.zojirushi.com.tw/recipe/rice-cookers/587/%E7%B6%9C%E5%90%88%E9%87%8E%E9%A4%90%E9%A3%AF%E7%B3%B0) | 页面条目为熟饭饭团/野餐组合候选，需从官方页面重新核对完整材料和步骤 | 电饭煲只煮白饭，之后冷却、拌料、成型；不属于一锅主餐 | 当前抓取页未稳定返回正文，暂不写入目录；需 CDP/原始 HTML 复核后再决定 |
| boundary_candidate | 北部粽 | [象印台湾官方](https://www.zojirushi.com.tw/recipe/rice-cookers/468/csr) | 象印食谱页面的北部粽候选；需重新从官方正文提取米、馅料、蒸煮程序 | 粽子通常涉及浸泡、包裹、蒸煮等多阶段，不能假设电饭煲单锅完成 | 当前抓取未取得可引用的完整正文，留作官方页面发现线索，不进入 r3 强候选 |
| boundary_candidate | 夏季彩虹藜麥雞丁 | [Panasonic Cooking Taiwan](https://pstw.panasonic.com.tw/PanasonicCookingTW/Recipe/Detail/5282) | 鸡胸 250 g、熟藜麦 100 g、毛豆、彩椒、玉米笋；蒸气低温蒸 15–20 分钟后拌橄榄油/麻油（官方页面） | 主食是熟藜麦且使用蒸气烘烤炉，不是米饭/电饭煲 | 不纳入米饭主餐目录；可登记为后续“其他谷物一锅”边界，不与米饭统计混算 |

## 复核与去重记录

1. 本轮通过官方直达页面核对了 Tiger、Panasonic Cooking Taiwan、ZOJIRUSHI Taiwan；没有用聚合站或二次转载替代厂商页面。
2. 5286（鲔鱼毛豆白饭）和 5287（午仔鱼丝瓜炊饭）在本 intake 开始后被并发 r104 批次写入当前目录，因此不重复建议入库；应在 r105 实际入库前再次以 URL/规范化菜名去重。
3. Tiger 的玉米饭、鸡肉蘑菇饭、海南鸡饭、卷心菜蘑菇饭、秋季鸡肉什锦饭等已在 r103 或更早目录，故没有把它们重复列为 r3 候选。
4. 本文未把 Tiger 的汤、咖喱、炖菜、意大利面或甜点当作米饭主餐强候选；它们即使能用电饭煲，也不符合“米饭/菜饭主餐”本轮收录目标。
5. 任何条目进入 `recipe_fact_checked` 前仍需按目录规则逐字段设置 `source_refs[].scope`、`access_status` 和 `evidence_locator`；未给份数、总时长或安全终点的字段必须保持 `null`，不能由厂商页面之外的版本补齐。

## 下一步建议（不在本 intake 执行）

- 优先审查 A 组 7 条：先核查当前 r104 是否已收录页面 5286/5287 的同名项，再将其余 Tiger 3 条和 Panasonic/象印 3 条逐条结构化。
- 玉米烧卖＋什锦饭需要独立的“双层同步”字段，不能当成一锅混合饭；皮蛋瘦肉粥两厂商版本应保持独立，不取平均水位。
- 对所有边界候选先决定是否设立“熟饭二次烹/双锅/外部预处理”子类别；在类别决策前，不要把这些候选推到可轮替池。

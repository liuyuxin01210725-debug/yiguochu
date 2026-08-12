# r306 区域研究卡补全：庐陵鼎罐饭、塔城抓饭、诺鲁孜饭

基线：`source-backed-one-pot-v1-20260810-global-r293` / 923 条。

本批不是新增 canonical，也不把研究稿晋升为 executable；目标是把已有身份卡补成能读懂、能开始试做的研究稿，并把来源缺口说清楚。

| recipe_id | 本批闭合内容 | 仍保留的边界 |
| --- | --- | --- |
| `luling-dingpot-rice` | 公开标准全文镜像给出 600g 井岗软粘米、400g 水、腊肉/香肠/萝卜干及调味料量；补入浸泡、肉类预蒸、鼎罐大中小文火流程。600g 批次按研究起步折算 4 份。 | 标准全文镜像不是官方原页；仍保留鼎罐/灶火器具，不外推电饭煲。 |
| `tacheng-air-dried-meat-pilaf` | 塔城地区行政公署原文补出羊肉切块煸炒、胡萝卜洋葱同炒、泡米加羊油/植物油焖煮、撒葡萄干。 | 米、油、液体、时长和安全终点未给，研究稿仍用估算起步量。 |
| `kashgar-nowruz-rice` | 喀什经济开发区政府原文列出七种谷物、七种蔬菜、七种畜禽肉和干果；卡片现在展示四个来源类别。 | 没有固定配方、份量、液体、步骤、器具和时间；不得把类别清单当成家庭原方。 |
| `nujiang-lisu-hand-grab-rice` | 中国国家地理原文补出苞谷面掺大米煮熟、另锅煮肉、熟肉剁碎后在竹编簸箕中拌核桃粉/辣椒/蒜粉/盐的流程。 | 这是多锅拌饭，不是生米电饭煲一锅；来源没有固定用量、液体、时间或安全终点。 |
| `r97-kaiping-crucian-carp-baked-rice` | 开平市政府原文明确腌制鲫鱼盖在米饭上焗制，记录鱼香与米香混合的核心步骤。 | 鱼/米重量、腌料、锅具、液体、时长和安全终点未给；保留研究卡，不转成电饭煲方。 |

数据变更：`tools/data/source-backed-one-pot-recipes.v1.json`。

验证：专项测试 `tools/tests/source-backed-one-pot-research-card-batch-r306-regional-methods.test.mjs` 3/3 通过；随后应运行 catalog/check-recipes 与全量测试。

# r290 液体合同补全（5 条既有记录）

基线为 `source-backed-one-pot-v1-20260808-global-r288` / 923 条；本批版本为 `source-backed-one-pot-v1-20260810-global-r290`，总数仍为 923。没有新增 canonical，也没有把研究记录晋升为生产菜单。

本批只回填来源原文已经给出、且能无损表达的液体字段：

| recipe_id | 回填内容 | 来源边界 |
| --- | --- | --- |
| `tatung-oyster-mountain-vegetable-rice` | 基础高汤 300mL | 牡蛎先蒸产生的汤汁另行保留，未把动态汤量假装成固定总液体 |
| `zojirushi-seafood-paella` | 海鲜蒸汁 720mL | 海鲜先蒸、分离蒸汁、炒米、海鲜回锅；保留象印 IH 锅分段流程 |
| `taiwan-tea-oil-vegetable-health-rice` | 内锅水 2 米杯 | 外锅另加 1 米杯只写入单位边界，不与内锅水相加 |
| `panasonic-taiwan-mushroom-chicken-bamboo-rice` | 腌汁 0.5 杯 + 清水 2 杯 = 2.5 杯 | 仍保留 Panasonic SR-PAA100、鸡肉与蔬菜同锅及禽肉终点边界 |
| `philips-soy-milk-chicken-congee` | 豆浆 1 杯 + 水 5 杯 = 6 杯 | 以 `components` 保留两种液体对象，仍限 Philips 密封煮粥锅具 |

“基础高汤”“海鲜蒸汁”“内锅/外锅”和“豆浆/水”均是来源原文的对象区分；本批没有按普通电饭煲、米种或份数跨器具换算，也没有补写来源未给出的总时长或安全终点。

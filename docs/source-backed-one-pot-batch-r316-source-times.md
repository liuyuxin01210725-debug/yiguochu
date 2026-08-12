# r316 官方单值烹煮时间补齐

基线为 `source-backed-one-pot-v1-20260810-global-r293`、923 条。本批不新增 canonical，也不改变正式 72 道基础菜谱；只把 7 张已经具备来源食材、液体和步骤的卡，补回原文明确的单值烹煮时间。

| recipe_id | 原文时间 | 处理 |
| --- | --- | --- |
| `startsmart-corn-lean-pork-porridge` | 烹煮约 30 分钟 | `time_contract=30`，保留 83 人份机构锅边界 |
| `maff-hokkaido-ikameshi` | 出汁锅煮约 30 分钟 | `time_contract=30`，保留鱿鱼装填和锅煮边界 |
| `instant-pot-one-pot-chicken-brown-rice` | 烹调 45 分钟 | `time_contract=45`，不把压力锅换算成普通电饭煲 |
| `instant-pot-easy-chicken-rice` | 烹调 25 分钟 | `time_contract=25`，保留 High Pressure 和后加西兰花 |
| `instant-pot-chicken-rice-soup` | 烹调 20 分钟 | `time_contract=20`，保留撕鸡回锅阶段 |
| `tefal-602-chicken-pea-risotto` | 烹调约 28 分钟 | `time_contract=28`，保留熟鸡肉预处理和中途加豌豆 |
| `tefal-602-smoked-haddock-kedgeree` | 准备/烹调约 28 分钟 | `time_contract=28`，保留烟熏鱼与另锅鸡蛋边界 |

没有把范围压成单值：Instant Pot Quick Chicken 的 15–30 分钟、MAFF 三重县茶粥的 15–20 分钟、UConn 慢炖饭的 3–4/7–8 小时仍保留 `time_contract=null`，研究卡显示原文范围或估算起步值。

所有新时间字段都绑定原条目的官方 `source_id`，通过 source-backed catalog validator；没有跨菜、跨机型或跨阶段借用时间。

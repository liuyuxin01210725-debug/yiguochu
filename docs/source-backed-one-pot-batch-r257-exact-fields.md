# r257：同源液体与时间字段闭合

本批基线为 `source-backed-one-pot-v1-20260808-global-r256`，目录仍为 923 条；没有新增 canonical、没有改变 status，也没有把任何记录提升为 `executable`。

本批只写回一手来源已经明确、且 DSL 可以无损表达的字段：

- `fehd-cheese-asparagus-seafood-rice`：香港食环署图卡明确糙米/藜麦 1 杯、水 0.8 杯，回填 `added_water`；份数、海鲜熟制终点和总时长仍为空。
- `panasonic-taiwan-mushroom-risotto`：Panasonic 台湾原页明确同锅约 56 分钟，补 `time_contract.total_minutes=56`，并给对应来源增加 `time` claim scope；液体 3 杯保持原值。
- `panasonic-taiwan-chestnut-rice-steam-oven`：Panasonic NU-SC300B 原页明确水 200cc、健康蒸 120℃ 20 分钟，回填液体和时间；继续保留 `source_limited` 蒸烤炉边界，不外推普通电饭煲。

所有字段均保留原 source_id；不从外锅水、浸泡液、准备时间或分段时长推导新的通用合同。

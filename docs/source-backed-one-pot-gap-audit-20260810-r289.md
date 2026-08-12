# r289 缺口审计：923 条 source-backed 一锅饭资产

基线：`source-backed-one-pot-v1-20260808-global-r288`，923 条。本文是字段审计，不是目录版本 bump；没有把无法由同一来源证明的值写回 JSON。

## 当前可核对计数

| 项目 | 数量 |
| --- | ---: |
| `executable` | 36 |
| `recipe_fact_checked` | 782 |
| `identity_verified` | 99 |
| `discovered` | 6 |
| 同时具备 fixed batch、liquid、time、cooking sequence、safety 的记录 | 69 |
| 缺 `fixed_batch` | 546 |
| 缺 `liquid_contract` | 486 |
| 缺 `time_contract` | 704 |
| 缺 `cooking_sequence` | 97 |
| 缺 `safety_endpoints` | 610 |

这些是字段缺口计数，不代表 610 条都需要安全温度：纯素/甜点/档案、熟饭二次烹、另锅或已明确熟制的食材也会保留空安全数组。

## 本轮复核的可闭合性结论

### 未写回的候选

- `nanjing-aijiaohuang-duck-rice`：来源只写鸭饭组合，鸭肉生熟状态和步骤不够明确，不能直接挂禽肉终点。
- `maff-chiba-gonjuu`：核心是熟饭/配料分段，不能按生米同锅安全合同处理。
- `panasonic-brown-rice-soybean-rice-nf-pc400`：黄豆为干货，来源没有可映射的动物性熟制终点。
- `yutian-electric-cooker-lamb-pilaf`：来源写“羊肉切小块”，但 FoodSafety 只分别给整块羊肉与绞肉分类，不能把小块肉擅自归入其中之一。
- `philips-soy-milk-chicken-congee`：豆浆与水是两个液体对象，不能把 1 杯豆浆和 5 杯水压成一个无来源的单值合同。
- `zojirushi-seafood-paella`：蒸汁、水/高汤/藏红花液体分层，且海鲜先蒸后回锅；不能拼成普通电饭煲单锅参数。
- `panasonic-taiwan-mushroom-chicken-bamboo-rice`：腌汁与内锅水是不同阶段液体，保留 `liquid_contract=null`。
- `toshiba-hk-chicken-scallop-porridge-pc48drshk`：来源水量与机型水位线存在冲突，不能选一边。
- `startsmart-corn-lean-pork-porridge`：备料约 10 分钟、烹煮约 30 分钟，不等于来源明确的整道总时长。

### 明确不是“漏填”的情况

- `3–4`、`4–5`、`5–6` 等份数范围不能压成固定批量。
- “准备/煎炒/焖制/静置”中的单阶段时长不能相加成总时长，除非原文明确给出 total/cooking time。
- “水位线”“米量倍数”“内锅水+外锅水”“高汤+浸泡汁”属于不同合同类型，不能跨机型或跨来源换算。
- 传统砂锅、甑、竹筒、蒸笼、压力锅、Tacook、熟饭再烹等器具边界不能自动改写成普通电饭煲。
- 来源只给菜名或活动菜单的 `discovered` 条目不能凭菜名生成配料、液体、时间和安全步骤。

## 下一步可执行证据

1. 重新打开原始页面，取得上述阻塞条目的食材状态、部位或明确总时长；
2. 若产品确实需要同时表达“内锅液体 + 外锅水 + 腌汁/浸泡汁”，先扩展 DSL，再回填数据；
3. 对仍只有传统器具或身份档案的条目，补充一手的固定批量和流程，而不是迁移器具；
4. 每次只在同一来源无损证明时写 JSON，并运行批次测试、catalog validator、`check-recipes` 与全量回归。

本审计不新增 canonical、不新增 executable，也不改变生产端 72 道基础菜单的上线口径。

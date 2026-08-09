# Source-backed one-pot batch r204 — executable contract promotion

本批基线为 `source-backed-one-pot-v1-20260808-global-r203`（923 条）。没有新增 canonical；只把 7 条已有 `recipe_fact_checked` 资产提升为内部 `executable`，因为它们已经同时具备来源可追溯的固定批次、液体/水位、步骤、总时长、风险匹配安全端点和过敏标签。

## 晋升清单

| recipe_id | 名称 | 原器具边界 | 主要安全合同 |
| --- | --- | --- | --- |
| `tatung-paella-style-seafood-rice` | パエリア風魚介の炊き込みご飯 | 大同电锅；贝类先蒸取汁、跳起后回锅；不外推普通电饭煲 | shellfish visual endpoint |
| `tiger-chinese-sticky-rice` | 炊込み中華おこわ | Tiger おこわ；浸泡与先炒保留 | pork 74°C |
| `hk-taro-shrimp-multigrain-steamed-rice` | 芋頭鮮蝦五穀蒸飯 | 香港瓦煲；米芋先煮、后投鲜虾；不外推电饭煲 | seafood 74°C |
| `r61-tiger-easy-khao-man-gai` | 簡単カオマンガイ | Tiger COK-A220/COK-N220 压力程序；保留泄压 | poultry 74°C |
| `tiger-usa-century-egg-fish-porridge` | Century Eggs and Fish Fillet Porridge | Tiger 5.5/10 杯粥程序；0.5 水位线、70 分钟 | fish 63°C |
| `instant-pot-chicken-satay-rice` | Chicken Satay Rice | Instant Pot Sauté/压力锅；鸡肉先煎取出后回锅 | poultry 74°C |
| `tamu-turkey-burrito-bowl` | Turkey Burrito Bowl | Texas A&M 电压力锅 Sauté/高压/快速泄压 | poultry 74°C |

`executable` 仅表示本目录的字段和证据合同已闭合，不等于厨房实测、人工批准或生产发布；仍保留每条来源的机型、预处理和分阶段说明。未改运行时代码、Planner、生产菜单或部署目标。

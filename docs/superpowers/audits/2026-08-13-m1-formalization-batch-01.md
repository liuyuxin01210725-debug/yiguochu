# M1.3 正式化批次 01：Tiger 炊込み来源簇审计

日期：2026-08-13  
范围：只读审计，不修改来源目录、执行库、正式 Planner、Worker、UI 或任何主 JSON。  
矩阵版本：`source-backed-coverage-matrix-v1-20260813-m1`  
候选上限：5 条；本批实际选择 5 条。

## 1. 选择口径

本批选择同一发布方/同一器具语义来源簇：Tiger Corporation 的官方炊込み（混合饭/麦饭）页面。五条都满足：

- Coverage Matrix 优先级为 P0；
- `execution.status=source_complete`、`execution.unblocked=true`；
- `formal.status=preview_candidate`，不是 safety-blocked；
- 有 recipe-scoped `source-evidence-*` Ratio 证据，但仍是 `source_bounded_non_executable`；
- 固定批次、液体、步骤和时间均保留各自官方来源事实，不跨菜借量、不把 Tiger 参数外推到普通电饭煲。

“同一来源簇”只表示同一发布方、相近器具/程序语义和可共用的审计流程；每条菜仍以独立 `source_id`、独立证据和独立厨房记录闭合，不能把一条菜的观察结果复制给另一条。

## 2. 批次总表

| recipe_id | 菜名 | 来源/执行现状 | 可闭合字段 | 当前正式化缺口 | 厨房门 | 旅程门 |
| --- | --- | --- | --- | --- | --- | --- |
| `tiger-chicken-bamboo-rice` | 鶏肉たけのこごはん | `executable` / `source_complete` | 6 人；米 3 杯；熟去皮竹笋 80g；鸡胸 100g；油豆腐皮 0.5 枚；高汤 600mL；60 分钟；4 步 | Ratio 仍不可执行；Tiger 器具边界；未进正式 72；矩阵仍列 taxonomy blocker（review 字段实际为 closed） | `pending`，无厨房证据 | 有 1 条 shadow：`rice_meal:RM-359-source-tiger-chicken-bamboo-rice`，不是人工旅程通过 |
| `tiger-pork-bamboo-rice` | 豚肉とたけのこごはん | `executable` / `source_complete` | 6 人；米 3 杯；竹笋 90g；猪五花 120g；高汤 600mL；60 分钟；3 步 | Ratio 仍不可执行；多型号/猪肉安全与器具边界未闭合；未进正式 72；矩阵仍列 taxonomy blocker（review 字段实际为 closed） | `pending`，无厨房证据 | 有 1 条 shadow：`rice_meal:RM-344-source-tiger-pork-bamboo-rice`，不是人工旅程通过 |
| `tiger-whitefish-mixed-rice` | 白身魚の炊込みごはん | `executable` / `source_complete` | 6 人；米 3 杯；白身鱼 200g；胡萝卜/牛蒡/金针菇各 30g；昆布 10g；高汤 600mL；60 分钟；3 步 | 白身鱼 taxonomy 未闭合；Ratio、器具边界、厨房和旅程未闭合；未进正式 72 | `pending`，无厨房证据 | `pending`，无证据 |
| `tiger-shirasu-tomato-multigrain-rice` | 釜揚げしらすとトマトの雑穀ごはん | `recipe_fact_checked` / `source_complete` | 4 人；米 2 杯；杂粮 25g；釜揚げしらす 60g；小番茄 8 个；高汤 400mL；50 分钟；4 步 | 杂粮、釜揚げしらす taxonomy 未闭合；Ratio、器具边界、厨房和旅程未闭合；未进正式 72 | `pending`，无厨房证据 | `pending`，无证据 |
| `tiger-mackerel-aromatic-barley-rice` | さばの香味麦炊込みごはん | `recipe_fact_checked` / `source_complete` | 3 人；米 1 杯；三成麦 1 麦饭量杯；盐烤鲭鱼 70g；高汤 300mL；55 分钟；4 步 | 三成麦、盐烤鲭鱼 taxonomy 未闭合；Ratio、器具边界、厨房和旅程未闭合；未进正式 72 | `pending`，无厨房证据 | `pending`，无证据 |

共同状态：五条均 `formal_planner_status=not_in_formal_72`，`ratio_status=source_bounded`，Ratio `compiled_rule_ids=[]`；因此本批是正式化候选包，不是上线包。

## 3. 逐条字段核对

### 3.1 `tiger-chicken-bamboo-rice`

- **来源**：Tiger 官方《鶏肉たけのこごはん》，`S-TIGER-CHICKEN-BAMBOO-RICE-1`，<https://www.tiger-corporation.com/ja/jpn/feature/recipe/post26/>；另有 `S-SAFETY-TEMPERATURES-1` 作为禽肉终点参考。来源定位记录了标题、60 分钟、6 人份、3 杯米、竹笋 80g、鸡胸 100g、油豆腐皮和高汤 600mL。
- **可闭合**：来源身份、固定批次、液体合同、4 步顺序和 60 分钟均有原始来源；taxonomy review 为 `closed`；营养 `closed`（A，碳水/蛋白/纤维）；安全 `closed`（`poultry_fully_cooked`）。
- **不可闭合**：Ratio 只有 `source-tiger-chicken-bamboo-rice-calibration-v1` 与 `source-evidence-tiger-chicken-bamboo-rice-v1` 候选，均不可缩放/不可跨器具；器具仍 `source_limited`，不能把白米 3 刻度和 600mL 当成普通电饭煲通用参数；厨房观察为空；旅程只有 shadow 引用；未进入正式 72。
- **特别核对**：Coverage Matrix 的 `formal.blocker_codes` 仍包含 `taxonomy_mapping`，但 formal candidate review 的 taxonomy 状态为 `closed`。M1.3 TDD 必须把这两个投影的语义差异锁死，不能借此直接晋升。

### 3.2 `tiger-pork-bamboo-rice`

- **来源**：Tiger 官方《豚肉とたけのこごはん》，`S-TIGER-PORK-BAMBOO-1`，<https://www.tiger-corporation.com/ja/jpn/feature/recipe/post61/>；另有 `S-SAFETY-TEMPERATURES-1`。来源定位记录 6 人份、米 3 杯、竹笋 90g、猪五花 120g、高汤 600mL、60 分钟及炊込み·火力强程序。
- **可闭合**：来源身份、固定批次、液体、3 步顺序和 60 分钟；taxonomy review `closed`；营养 `closed`（B，碳水/蛋白/纤维）；安全 `closed`（`pork_fully_cooked`）。
- **不可闭合**：Ratio 只有固定批次来源证据，未编译成可缩放规则；Tiger 多型号边界、猪肉终点和型号用量差异仍需同器具观察；厨房为空；旅程只有 shadow 引用；未进入正式 72。
- **特别核对**：与上一条相同，矩阵 blocker 仍包含 `taxonomy_mapping`，而 review taxonomy 已 `closed`；不得把矩阵列出的“可排队”误读为正式化通过。

### 3.3 `tiger-whitefish-mixed-rice`

- **来源**：Tiger 官方《白身魚の炊込みごはん》，`S-TIGER-WHITEFISH-MIXED-RICE-1`，<https://www.tiger-corporation.com/ja/jpn/feature/recipe/post62/>；`S-SAFETY-TEMPERATURES-1` 提供鱼类 63°C 参考。来源给出 6 人份、米 3 杯、白身鱼 200g、三种配菜各 30g、昆布 10g、高汤 600mL 和 60 分钟。
- **可闭合**：来源身份、固定批次、液体、3 步顺序、60 分钟；营养 `closed`（A）；安全 `closed`（`seafood_fully_cooked`）；Ratio candidate 已绑定该 recipe/source。
- **不可闭合**：taxonomy 缺 `白身鱼`；来源明确先在平底锅煎鱼，再进 Tiger 炊込み，属于两阶段，不能宣称严格单器具；Ratio 仍 `source_bounded_non_executable`；厨房、旅程和正式 72 均未闭合。

### 3.4 `tiger-shirasu-tomato-multigrain-rice`

- **来源**：Tiger 官方《釜揚げしらすとトマトの雑穀ごはん》，`S-TIGER-SHIRASU-TOMATO-RICE-1`，<https://www.tiger-corporation.com/ja/jpn/feature/recipe/post52/>。来源定位记录 4 人份、米 2 杯、杂粮 25g、釜揚げしらす 60g、小番茄、高汤 400mL 和 50 分钟。
- **可闭合**：来源身份、固定批次、液体、4 步顺序和 50 分钟；营养 `closed`（A）；无需要额外添加的生肉/生海鲜安全终点（机器资料为 `not_applicable`）。
- **不可闭合**：taxonomy 缺 `杂粮`、`釜揚げしらす`；只能保留 Tiger 对应机型杂粮炊込み程序，牛油果和罗勒是出锅收尾，不能提前并入主锅合同；Ratio 未编译；厨房、旅程和正式 72 均未闭合。

### 3.5 `tiger-mackerel-aromatic-barley-rice`

- **来源**：Tiger 官方《さばの香味麦炊込みごはん》，`S-TIGER-MACKEREL-BARLEY-RICE-1`，<https://www.tiger-corporation.com/ja/jpn/feature/recipe/post_525/>。来源定位记录 3 人份、米 1 杯、三成麦 1 麦饭量杯、盐烤鲭鱼 70g、高汤 300mL、麦饭水位和 55 分钟。
- **可闭合**：来源身份、固定批次、液体、4 步顺序和 55 分钟；营养 `closed`（B）；鱼已是来源规定的盐烤熟鱼，不能替换为生鲭鱼；Ratio candidate 已绑定该 recipe/source。
- **不可闭合**：taxonomy 缺 `三成麦`、`盐烤鲭鱼`；必须保留 Tiger 三成麦程序和熟鱼状态；Ratio 未编译；厨房、旅程和正式 72 均未闭合。

## 4. 可共用的厨房试做包（不等于已观察）

五条可以共用同一份记录模板，但不能共用结果：

1. **称量**：严格按各自固定批次记录米、主料、配料和调味；不做按份缩放。
2. **液体**：记录来源高汤/水的实际 mL，以及 Tiger 对应白米/麦饭水位刻度；不得换算为其它机型。
3. **器具/程序**：记录具体 Tiger 型号、炊込み或麦饭程序；白身鱼条目额外记录平底锅预煎阶段。
4. **过程**：记录开机、完成、翻松、静置的时间；不得把页面总时长改写为统一程序时长。
5. **成品/安全**：记录米粒状态、液体残留、主料熟度、拆骨/出锅收尾；需要时记录禽肉/猪肉/鱼类安全终点。
6. **旅程回归**：每条建立独立的 must-use、忌口/过敏、未使用食材和失败路径；shadow evidence 只能作为待核线索。

## 5. 下一步 TDD 验收（只写验收，不在本批执行晋升）

建议新增独立专项测试（例如 `tools/tests/source-backed-formalization-batch-01.test.mjs`），固定以下断言：

- **候选选择**：恰好 5 条、recipe_id 与本文件一致、均 P0、均非 safety-blocked、均 `source_complete` 且 `unblocked`。
- **来源合同**：每条 source ID、HTTPS URL、固定批次、液体、步骤和时间均来自同一条 recipe-scoped source evidence；测试失败时禁止从邻近菜借量。
- **Ratio 边界**：每条存在对应 `source-evidence-*` 证据，但 `compile_status` 必须仍为 `source_bounded_non_executable`，`compiled_rule_ids` 必须为空；不得把 fixed batch 当成 per-serving 规则。
- **taxonomy/营养/安全**：锁定两条 taxonomy closed（鸡竹笋、猪竹笋）与三条 taxonomy partial 的现状；锁定白身鱼/杂粮/釜揚げしらす/三成麦/盐烤鲭鱼不得被静默替换或新造营养行。
- **器具边界**：Tiger 刻度/程序不能外推普通电饭煲；白身鱼必须保留平底锅预煎前置；麦饭必须保留熟盐烤鲭鱼状态。
- **晋升闸门**：五条在 kitchen evidence 为空或 journey 仅 shadow 时，测试必须拒绝 `formal_ready`、`production_approved` 和加入正式 Planner；不得修改 72 道正式库。
- **投影一致性**：复核 Coverage Matrix 与 formal candidate review 的 taxonomy 投影差异（鸡竹笋、猪竹笋）。在差异未解释前，测试应保守地保持阻断，不将 blocker 删除作为“修复”。

## 6. 批次结论

这 5 条是适合先做的小批次：来源合同完整、同一发布方/器具语义、Ratio 证据可追踪，且不会要求跨来源拼接。当前可交付的是“可审计的正式化试做包”，不是 5 道正式上线菜谱。完成厨房记录、独立旅程回归、Ratio 编译和投影一致性测试后，才可重新计算是否进入正式 Planner；在此之前保持 `preview_candidate`。

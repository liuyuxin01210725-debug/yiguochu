# M1.2 · Source-backed Runtime Coverage Matrix

## 目的

`source-backed-coverage-matrix.v1.json` 是 M1.2 的只读覆盖投影。它把当前项目的研究层、执行层、正式化队列、厨房门和真实旅程证据合并到一张按 `recipe_id` 对齐的矩阵，回答两个问题：

1. 923 条 source recipe 当前应该按什么优先级处理；
2. 每条卡在 source、execution、formal、kitchen、journey 哪一层还有缺口。

它不是新的菜谱真源，不会把 source card 晋升为 Runtime Recipe，也不改变 `recipe-library.json`、taxonomy、Ratio DSL、Worker 或 UI 的状态。

## 生成

```bash
node tools/build-source-backed-coverage-matrix.mjs
node --test tools/tests/source-backed-coverage-matrix.test.mjs
node -e "JSON.parse(require('fs').readFileSync('tools/data/source-backed-coverage-matrix.v1.json')); console.log('JSON parse ok')"
git diff --check
```

构建器只读取已有资产：

- `source-backed-one-pot-recipes.v1.json`：923 条来源记录；
- `source-backed-execution-library.v1.json`：923 张执行卡；
- `source-backed-formalization-ledger.v1.json`：正式化队列和执行就绪度；
- `source-backed-formal-candidate-review.v1.json`：taxonomy、Ratio、营养、安全和器具门；
- `source-backed-formal-staging.v1.json`：厨房与旅程晋升门；
- `recipe-library.json`：当前 72 道正式基础菜谱；
- `recipe-runtime-journeys.v1.json`、`rice-meal-journeys.v1.json`：旅程证据；
- `direct-recommend-shadow-v1.json`：30 条直接推荐 shadow case；
- `source-backed-formal-ratio-evidence.v1.json`：132 条来源比例证据。

## 优先级定义

优先级来自执行卡状态，和是否可以上线是两回事：

| 优先级 | 数量 | 含义 | 下一步 |
| --- | ---: | --- | --- |
| P0 | 138 | 来源定量、液体、步骤和时间已闭合的 `source_complete` 卡 | 先做同一器具厨房试做，再补 Planner 映射和旅程回归 |
| P1 | 738 | 有完整研究执行卡，但仍有来源字段、器具或事实缺口 | 先补原始来源合同，再做厨房试做 |
| P2 | 36 | 主要依靠估算或混合 provenance 的草稿 | 禁止把估算升格为来源事实，先回源核验 |
| P3 | 11 | 只有身份或不完整起步卡 | 先确认是否值得继续研究 |

河豚卡仍保留在 P2，但额外标记 `safety_blocked: true`、`kitchen.status: blocked` 和 `journey.status: blocked`；安全阻断不是普通排队优先级，禁止家庭执行。

## 当前基线（构建版本 `source-backed-coverage-matrix-v1-20260813-m1`）

- Source：923 条；`executable` 36、`recipe_fact_checked` 788、`identity_verified` 93、`discovered` 6。
- Execution：`source_complete` 138、`source_partial_with_draft` 738、`draft_estimated` 36、`identity_only_draft` 11。
- Formal：34 条进入 `preview_candidate`，889 条仍被正式化门禁阻断。
- Kitchen：922 条待厨房观察，1 条安全阻断。
- Journey：922 条待真实旅程回归，1 条安全阻断；目前有 16 条 source recipe 被现有旅程资产引用，共 25 个引用。
- 现有正式基础库仍是 72 道：12 道 `approved`、60 道 `auto_approved`。其中 4 个 recipe id 与 source catalog 有历史重叠，但矩阵明确标记为 `library_overlap_not_promoted`，不视为 923 条 source card 已上线。

## 四条产品路径

矩阵同时输出 `product_paths`，避免把不同承诺混成一个覆盖率：

| 路径 | 当前状态 | 当前证据 | 主要缺口 |
| --- | --- | --- | --- |
| 给我一道 | `partial` | 72 道正式基础库（12 approved + 60 auto_approved） | Runtime 激活、Ratio、厨房观察和旅程门仍需闭合；source card 不自动进入 |
| 按我的食材做一锅 | `not_covered` | 54 条 rice-meal journeys 主要是边界/校准证据 | 没有独立的 100% must-use Runtime 合同；数量分配和拒绝/取舍路径待实现 |
| 今天吃什么 | `partial` | 30 条 direct-recommend shadow、54 条 rice-meal journeys、17 条 runtime journeys | 仍需接入统一 Runtime Catalog，并补齐厨房和旅程覆盖 |
| 清库存 | `not_covered` | 当前无严格多顿清库存证据 | 数量分配、连续库存状态和完整库存合同尚未实现 |

## 单条记录字段

每条 `records[]` 至少包含：

- `priority`：P0–P3；
- `safety_blocked`：是否被安全原因硬阻断；
- `source`：来源状态、合同是否闭合、来源数、器具边界；
- `execution`：执行卡状态、运行范围、就绪度、食材/步骤数；
- `formal`：正式化状态、是否与 72 道历史库重叠、taxonomy/Ratio/营养/安全/器具门状态；
- `kitchen`：厨房观察状态和证据；
- `journey`：旅程状态和已引用的 shadow evidence；
- `gap_codes`：去重排序后的缺口码；
- `next_action`：来自正式化账本的下一动作。

`gap_codes` 是排队和审计字段，不是上线许可。至少要同时满足来源、执行、正式化、Ratio、器具、营养、安全、厨房和旅程合同，才可能进入正式晋升评审。

## 解释边界

这张表不回答“这 923 道是否已经全部上线”。它明确显示：923 条 source card 可以有执行字段，但绝大多数仍然缺少正式 Planner 映射、同器具厨房观察或真实旅程回归；72 道正式基础库也不等于 923 条 source card 的批量晋升。后续 M1 工作应按 P0 → P1 顺序选择小批次做实厨和门禁，而不是按卡片数量直接改状态。


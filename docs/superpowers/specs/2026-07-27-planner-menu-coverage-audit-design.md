# 菜单总账与 Planner 能力覆盖审计设计

日期：2026-07-27

状态：设计待用户审阅

适用范围：Draft PR #1 后续工作。本设计只建立离线审计产物，不授权修改 recipe、template、taxonomy、Ratio DSL、Planner 选择逻辑、Worker 生成行为或前端产品流程，不部署 Preview 或 production，不合并 PR。

相关规格：

- `docs/superpowers/specs/2026-07-25-menu-master-and-selection-framework-design.md`
- `docs/superpowers/specs/2026-07-25-china-one-pot-regional-atlas-design.md`
- `docs/superpowers/specs/2026-07-23-pantry-planner-v2-design.md`

## 1. 问题和结论

项目已经有三组分开正确的资产：

1. `recipe-library.json` 中 72 道 recipe，提供技法、比例、安全和来源 evidence；
2. `meal-templates.v2.json` + ingredient taxonomy + Ratio DSL，决定用户食材能否被组合成 plan；
3. 全国地域 atlas 和 capability ledger，记录 13 个地域、34 个省级节点、12 个技法家族的证据边界。

当前缺的是它们之间的可验证连接：

> 某道已存在的菜单有这些核心食材，当用户真的输入这些食材时，当前 Planner 能否识别、单锅覆盖并给出有 evidence 的可执行计划？

本设计新增一个确定性离线审计。它不是新推荐器，也不是让 72 道 recipe 重新成为组合上限；它只把现有真源与现有运行能力做对拍，用实际缺口决定下一条地域能力。

## 2. 范围与非目标

### 2.1 本轮涵盖

- 对 72/72 道 production recipe 生成一条审计记录；
- 原样保留 recipe 核心食材名称与顺序；
- 用当前 Planner 权威归一化层识别食材，不新建第二套 alias；
- 对每道菜分别测量食材身份覆盖、Planner 覆盖、单锅性、比例可执行性和 evidence 对齐；
- 按地域、技法家族、template 和未识别食材汇总缺口；
- 生成机器 JSON 和可读 Markdown，并接入新鲜度门禁。

### 2.2 明确不做

- 不新增、删除或修改 recipe，菜谱总数保持 72；
- 不新增或激活 template，保持 10 active + 6 planned；
- 不添加 taxonomy 食材、alias 或 Ratio DSL 规则；
- 不修改 Planner 打分、覆盖门槛、换一换或多锅算法；
- 不把“食材可被某 template 覆盖”写成“已复刻该地方菜”；
- 不调用 DeepSeek，不联网，不消耗生成预算；
- 不建设账号、用户画像、营养追踪、云端用户数据或多 Agent 产品功能；
- 不把审计原始数据放入 `dist/`。

## 3. 权威输入与派生输出

### 3.1 只读输入

| 输入 | 职责 |
|---|---|
| `tools/data/recipe-library.json` | 72 道菜单的核心食材、技法和 evidence |
| `tools/data/ingredient-taxonomy.v1.json` | 食材 identity、部位、生熟、切形和烹饪属性 |
| `tools/data/meal-templates.v2.json` | template 槽位、兼容、排斥、时间和 evidence recipe IDs |
| `tools/data/ratio-rules.v1.json` | 可执行的份量和液体规则 |
| `tools/data/regional-menu-mappings.v1.json` | recipe 的地域范围和 technique family |
| `tools/data/menu-master-baseline.v1.json` | 锁定 72 道 production ID/状态集合 |

审计必须直接调用 `worker/src/planner-v2.js` 的纯函数；不复制 Planner 内部白名单、食材语义或排序逻辑。

### 3.2 新增派生产物

```text
tools/lib/planner-menu-coverage-builder.mjs
tools/lib/planner-menu-coverage-renderer.mjs
tools/build-planner-menu-coverage.mjs
tools/generated/planner-menu-coverage.v1.json
docs/planner-menu-coverage.md
```

源数据不重复维护。JSON 和 Markdown 都由同一个纯 builder 产物生成，`--write` 只用于有意重建，`--check` 只比较已签入产物是否新鲜。

JSON 顶层必须包含 `schema_version`、`planner_version`、`template_catalog_version`、`taxonomy_version`、`ratio_catalog_version`、各只读输入的 SHA-256，以及稳定的 `summary` 与 `recipes`。不写生成时间戳、机器路径或 git commit，避免同一输入在不同机器上产生无意义差异。

## 4. 食材审计语义

### 4.1 不伪造“用户会选的食材”

每道 recipe 的 `core_ingredients` 先原样保留为 `raw_core_items`，然后通过当前 taxonomy 归一化。

归一后分为：

- `planner_eligible_items`：已识别且属于 `pantry_input`，但 category 不是 `liquid | oil | seasoning`；
- `recognized_basic_items`：已识别的液体、油脂和基础调味，只记录，不冒充用户清库食材；
- `unclassified_core_items`：当前 taxonomy 无法识别或无法确定用户输入身份的核心项。

未识别的“姜”和未识别的“糯米”都必须如实进入 `unclassified_core_items`。审计不用词表猜前者是调味、后者是主食；它们会在汇总中分别显示出现频次，供下一轮人工判断。

### 4.2 三个不可混用的比例

1. `identity_recognition_ratio`
   - 分子：已识别的非基础核心项；
   - 分母：非基础核心项 + 未分类核心项；
   - 用于回答 taxonomy 是否认得菜单中的食材。
2. `recognized_planner_coverage_ratio`
   - 分子：被选中 plan 安排的已识别用户食材；
   - 分母：全部去重 `planner_eligible_items`；
   - 用于回答 template + Ratio DSL 能否覆盖已识别部分。
3. `end_to_end_core_coverage_ratio`
   - 分子：被安排的已识别用户食材；
   - 分母：非基础核心项 + 未分类核心项；
   - 用于回答从菜单原始名称到 plan 的整体覆盖。

比例计数以用户承诺身份去重：已识别项按 Planner 的 canonical identity 去重，未识别项按 trim 后原词去重；同义词不得重复抬高分母或分子。`raw_core_items` 仍保持源顺序和原始重复，不因统计去重而改写。分母为 0 时返回 `null`，不伪造 0% 或 100%。

## 5. 确定性审计流程

每道 recipe 执行两个相互独立的场景，两者都是 `mode:"pantry"` + `intent:"normal"` + `servings:2`：

### 5.1 端到端原始核心场景

- `must_use` 为所有非基础 `raw_core_items`，包括当前未识别项；
- 直接调用 `planMeal`；
- 记录 `status`、`plan_kind`、已安排、未安排、reason codes 和锅数；
- 这个场景回答“用户照着菜单核心名称输入时，产品实际会发生什么”。

### 5.2 已识别能力隔离场景

- `must_use` 只传入去重的 `planner_eligible_items.raw`；
- 同时调用 `buildPotCandidates` 和 `planMeal`；
- 记录所有实际运行候选 template IDs、最大单锅覆盖、最终单锅/多锅结构和比例编译结果；
- 这个场景回答“不考虑 taxonomy 还不认得的词，现有 template 组合能力到哪里”。

两个场景都不调 HTTP、`fetch`、DeepSeek、KV 或随机数。

## 6. 单菜审计记录 Schema

```json
{
  "recipe_id": "cabbage-egg-soup-rice",
  "recipe_name": "青菜鸡蛋汤饭",
  "recipe_status": "auto_approved",
  "regional_scope": "national_household",
  "region_ids": [],
  "technique_family_id": "cooked-rice-stew",
  "raw_core_items": ["熟米饭", "白菜", "鸡蛋"],
  "planner_eligible_items": [
    {"raw":"熟米饭","canonical":"熟米饭","category":"cooked_rice","shape_or_cut":"whole","recognized":true,"duplicate_of":null},
    {"raw":"白菜","canonical":"白菜","category":"leafy_vegetable","shape_or_cut":null,"recognized":true,"duplicate_of":null},
    {"raw":"鸡蛋","canonical":"鸡蛋","category":"egg","shape_or_cut":"whole","recognized":true,"duplicate_of":null}
  ],
  "recognized_basic_items": [],
  "unclassified_core_items": [],
  "identity_recognition_ratio": 1,
  "recognized_only_scenario": {
    "status": "complete",
    "plan_kind": "single_pot",
    "candidate_template_ids": ["broth-rice-pot"],
    "selected_template_ids": ["broth-rice-pot"],
    "planned_raw_items": ["熟米饭", "白菜", "鸡蛋"],
    "unplanned_raw_items": [],
    "reason_codes": [],
    "recognized_planner_coverage_ratio": 1
  },
  "raw_core_scenario": {
    "status": "complete",
    "plan_kind": "single_pot",
    "planned_raw_items": ["熟米饭", "白菜", "鸡蛋"],
    "unplanned_items": [],
    "end_to_end_core_coverage_ratio": 1
  },
  "evidence_alignment": {
    "direct_template_evidence": true,
    "evidence_template_ids": ["broth-rice-pot"],
    "ingredient_compatible_only_template_ids": []
  },
  "audit_status": "full_single_pot_evidence_aligned",
  "priority_band": "covered"
}
```

`planner_eligible_items` 完整保留 `raw`、`canonical`、`category`、`shape_or_cut`、`recognized` 和 `duplicate_of`，不只存字符串。

## 7. Evidence 对齐边界

对最终选中的每个 pot：

- 若其 template 的 `evidence_recipe_ids` 直接包含当前 `recipe_id`，记为 `direct_template_evidence`；
- 若 template 能覆盖食材，但没有直接引用该 recipe，记为 `ingredient_compatible_only`；
- 多锅计划不能冒充对一道 recipe 的直接复现，即使所有食材都被用上。

本审计绝不使用 recipe 菜名、`cuisine` 或地域标签推导兼容性。组合能力只由 template rules + taxonomy + Ratio DSL 决定；recipe 只用于 evidence 对齐。

## 8. 状态和优先级不使用猜测分数

### 8.1 `audit_status`

- `full_single_pot_evidence_aligned`：端到端全覆盖、单锅，且选中 template 直接引用该 recipe；
- `full_single_pot_ingredient_compatible`：端到端全覆盖、单锅，但只能证明食材兼容；
- `full_multi_pot`：食材只能被拆成多顿主餐；
- `taxonomy_gap`：存在 `unclassified_core_items`；
- `planner_gap`：已识别核心食材无法完整规划；
- `no_recognized_core`：没有任何可进入 Planner 的已识别非基础核心项；
- `invalid_source_record`：recipe 或地域映射结构不可审计。

同时存在 taxonomy 和 Planner 缺口时，主状态优先记为 `taxonomy_gap`，但 `gap_codes` 必须保留全部结构化事实。

主状态采用唯一优先顺序：`invalid_source_record` → `no_recognized_core` → `taxonomy_gap` → `planner_gap` → `full_multi_pot` → `full_single_pot_evidence_aligned` → `full_single_pot_ingredient_compatible`。前四类未消除时不得落入任何 `full_*` 状态；`gap_codes` 继续保留所有非主状态事实。

### 8.2 `priority_band`

- `P0`：`invalid_source_record` 或 `no_recognized_core`；
- `P1`：`taxonomy_gap` 或 `planner_gap`；
- `P2`：`full_multi_pot`，即一道菜的核心食材在产品里被拆成多顿；
- `P3`：`full_single_pot_ingredient_compatible`，能做但 evidence 链未直接对齐；
- `covered`：`full_single_pot_evidence_aligned`。

不使用人工权重的综合分。报告只按事实状态、频次和稳定字段排序，避免让一个看似精确的分数掩盖未完成的 evidence 判断。

## 9. 报告汇总

JSON 和 Markdown 必须同时展示：

- 72 道菜的 `audit_status` / `priority_band` 数量；
- 每个地域和 technique family 的单锅全覆盖数、taxonomy gap 数、Planner gap 数；
- 每个 active template 被命中的 recipe 数与直接 evidence 对齐数；
- `unclassified_core_items` 按出现 recipe 数降序，同数按中文名称稳定排序；
- 未被任何运行 template 使用的 active template（若有）；
- 下一轮优先级只列机器事实：P0、P1、P2 记录及其 gap codes，不自动下“应激活某 template”的产品结论。

Markdown 页首必须显示：

> Planner 覆盖审计不等于菜谱复刻、口味验证或人工试做批准。

## 10. 校验与门禁

### 10.1 Schema 与纯函数校验

Validator 必须拒绝：

- recipe 记录数不是 72，或 ID/状态集合与现有 menu master baseline 不一致；
- 丢失、重复或未知 recipe ID；
- 未知 template、taxonomy identity、ratio rule 或 technique family 引用；
- 比例分母、分子或状态与实际列表不一致；
- 单锅/多锅状态与 `plan_kind` 矛盾；
- evidence template 没有真实引用当前 recipe ID；
- 记录中出现生成步骤、模型菜名、用户画像或运行时网络数据。

### 10.2 真实回归锚点

实施时至少锁定以下当前事实：

1. `cabbage-egg-soup-rice`：熟米饭 + 鸡蛋 + 白菜可被 `broth-rice-pot` 单锅全覆盖，且为直接 evidence；
2. `tomato-chicken-leg-soup-rice`：只按源记录中的熟米饭、鸡腿肉、番茄审计；菜名虽含“土豆”，也不得从菜名擅自补进核心食材；
3. `green-bean-pork-rib-braised-rice`：猪肋排不得为了全覆盖而进入仅允许快熟猪肉的泛化槽位；
4. `north-china-green-bean-braised-noodles`：原始核心名称无法识别时必须显示 taxonomy gap，不得只因菜名是焖面就宣称已覆盖；
5. 糯米、青稞、粉丝、面片、普通锅对瓦煲的等价关系都不得由报告猜测补全；
6. 72 道 recipe 顺序、原始核心食材和审计结果在相同输入下字节稳定。

### 10.3 集成门禁

- `node tools/build-planner-menu-coverage.mjs --check` 加入 `node tools/check-recipes.mjs`；
- 派生 JSON/Markdown 失时时聚合门禁失败；
- `tools/build-dist.mjs` 的发布清单必须继续排除审计源文件和派生产物；
- 门禁通过只证明审计一致，不表示菜谱已试做、地域能力已批准或 production 可部署。

## 11. 错误处理和失败原则

- 任一权威输入缺失、JSON 无效、ID 集合损坏或共享结构 validator 失败，builder 立即非 0 退出，不生成部分成功文件；
- `invalid_source_record` 只承载通过基础结构校验后仍无法建立单菜审计语义的记录级问题，例如缺少唯一地域/技法映射；它不是吞掉 JSON/schema 错误的降级出口；
- Planner 纯函数抛错时，报告不把它降级成 `no_valid_plan`，而是整体失败，避免隐藏代码回归；
- 输出不包含时间戳、随机 ID 或环境绝对路径，保证可复现。

## 12. 实施顺序

用户审批本规格后，实施计划必须按以下顺序执行：

1. 先用 TDD 建立单 recipe 食材归一、两场景覆盖和 evidence 对齐纯函数；
2. 再对 72 道真实 recipe 生成整体报告并校验状态汇总；
3. 再生成 Markdown，检查用词没有把“兼容”写成“复刻”；
4. 最后接入 `check-recipes` 和发布包排除测试；
5. 依据报告中的 P0/P1/P2 实际频次，另起一个设计轮次选下一条地域能力，不在本实现中顺手改 Planner。

## 13. 验收标准

- 生成且校验 72/72 道 production recipe 审计记录；
- 菜谱数仍为 72，template 仍为 10 active + 6 planned；
- 每道菜原始核心食材可回溯，未识别项不被静默删除；
- 三种覆盖比例分母与产品承诺分开；
- 一道 recipe 被多锅覆盖时不冒充单锅复刻；
- evidence alignment 只根据 template 的 `evidence_recipe_ids`；
- 全流程 0 次 DeepSeek、0 次网络、0 次生成预算；
- JSON 和 Markdown 字节可复现，`--check` 可拦截过期产物；
- 全量测试、`check-recipes`、68/68 Planner 真实旅程、Python 语法和规范构建继续通过；
- PR #1 保持 Draft/Open，不部署、不合并。

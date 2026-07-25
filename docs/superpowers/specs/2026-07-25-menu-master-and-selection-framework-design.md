# 菜单总账、候选排序与逐菜单验证框架设计

日期：2026-07-25

状态：设计已确认，待用户审阅正式规格

适用范围：Draft PR #1 后续工作；本规格不授权新增生产 recipe、改变 Planner 核心逻辑、部署 Preview、部署 production 或合并 PR。

相关规格：

- `docs/superpowers/specs/2026-07-23-pantry-planner-v2-design.md`
- `docs/superpowers/specs/2026-07-25-china-one-pot-regional-atlas-design.md`

## 1. 问题与目标

此前菜单、地域候选、模板、食材 taxonomy 和用户旅程分别存在于不同文件中。即使每个文件单独正确，也很难回答一个基础问题：

> 用户选了这些食材，为什么系统给出这三道，而不是另外三道？

结果是产品修改容易落入“看到一个问题，改一个分支”的模式，用户无法系统审阅全部菜单和每道菜的食材承诺，工程也难以判断一次调整会影响哪些菜单。

本规格建立两个长期资产：

1. **菜单总账（Menu Master）**：可审阅的菜单与食材构成总览；
2. **菜单测试矩阵（Menu Verification Matrix）**：把每道菜单与真实用户输入、组合边界、选择排序和生成闭环对应起来。

目标是让后续所有产品改动都能回答：

- 改的是哪一类菜单；
- 解决哪一种用户食材输入；
- 影响哪些已有菜单；
- 用什么测试证明没有让其他菜单倒退。

## 2. 范围与非目标

### 2.1 本规格涵盖

- 完整列出当前 72 道生产 recipe；
- 逐道列出可从现有结构化数据可靠提取的食材构成与执行边界；
- 单独列出约 24 个“地域研究题目”，不将它们冒充为可用菜单；
- 定义“直接推荐”和“帮我清库存”如何从总账、Planner 和模板中得到可解释候选；
- 定义三方案的差异、诚实覆盖和无替代路径；
- 定义逐菜单静态检查和用户旅程测试的边界。

### 2.2 明确不做

- 不把历史 `recipe-candidates.json` 与 `coverage-recipe-candidates.json` 的 60 条记录重复算作新菜单；
- 不因为建立总账而新增 recipe、template 或食材 taxonomy；
- 不把地域研究题目直接提供给用户；
- 不在用户请求时联网抓取菜谱；
- 不新增账号、用户画像、营养追踪、云端用户数据或多 Agent；
- 不改变 DeepSeek 的权限边界；
- 不部署 Preview 或 production。

## 3. 菜单资产的唯一边界

### 3.1 已上线菜单：72 道 production recipe

`tools/data/recipe-library.json` 是唯一生产菜单事实来源。

当前库共有 72 道 recipe。每道 recipe 的现有结构化字段至少包含：

- `id`、`name`、`status`；
- `cuisine`、`family_id`、`form`、`summary`；
- `core_ingredients`、`optional_ingredients`；
- `generation_optional_ingredients`、`generation_liquid_ingredients`；
- `substitution_slots`、`discouraged`；
- `technique`、`ratio_rules`、`safety_rules`；
- `protein_class`、`light_level`、`total_time_minutes`、`purposes`；
- `source_refs`。

菜单总账只能忠实提取和派生这些已存在、可验证的信息。缺失的信息必须显示 `待核实`，不得用常识或模型猜测补全。

### 3.2 地域研究候选：约 24 个研究题目

“中国一锅主餐地域地图”中的首批约 24 个题目，是研究队列，不是生产菜单：

- 它们没有自动进入 `recipe-library.json`；
- 它们没有自动进入用户候选；
- 它们必须标记来源状态、家庭适配假设、比例与安全待验证项；
- 其最终去向可能是 recipe evidence、template evidence、taxonomy 规则、内容素材或淘汰。

### 3.3 历史候选不重复展示

`recipe-candidates.json` 与 `coverage-recipe-candidates.json` 记录的是历史候选与晋升过程，许多条目已对应当前 auto-approved recipe。它们保留为审计资料，但不作为菜单总账中的额外菜单行，避免把同一道菜重复计数。

## 4. 菜单总账结构

### 4.1 单一真源与可读视图

为避免新的手工维护孤岛，采用“源数据不重复、视图自动生成”的结构：

```text
recipe-library.json（72道生产菜单，唯一生产真源）
          +
regional-atlas research ledger（研究候选，非生产）
          ↓
build-menu-master.mjs（只读取、不修改源数据）
          ↓
menu-master.json（机器审计快照）
menu-master.md（人可读菜单总表）
menu-master.csv（可排序筛选表）
```

构建器不得改变 `recipe-library.json`、不得复制完整来源做法、不得把候选提升为生产菜单。

生产 recipe 继续以 `recipe-library.json` 为准；菜单总账只是可审阅的派生视图。

### 4.2 生产菜单字段

菜单总账中，每道生产菜单固定展示：

| 分组 | 字段 | 说明 |
|---|---|---|
| 身份 | 菜名、ID、状态 | `approved` 和 `auto_approved` 必须区分显示 |
| 地域 | 菜系、技法家族、形态 | 例如上海本帮、`family-rice-vegetable`、菜饭 |
| 核心构成 | 主食、核心食材 | `core_ingredients` 按主食/蛋白/蔬菜/液体/调味重新分栏显示；无法可靠分类则保留原始分组 |
| 弹性构成 | 可选食材、可生成食材、液体 | 必须区别普通可选、生成时可选和液体 |
| 替换边界 | 显式替换、禁止或不建议组合 | 只显示 `substitution_slots` 与 `discouraged` 的原始语义 |
| 执行 | 技法、时间、适用目的 | 显示 `technique`、`total_time_minutes`、`purposes` |
| 安全 | 比例规则、熟制与风险规则 | 原样引用结构化 `ratio_rules` 与 `safety_rules`，不自动改写为权威事实 |
| 依据 | 来源状态、来源链接数 | 仅显示元信息与链接，不复制外部内容 |
| 审计 | 资料完整度、测试状态 | `complete | missing_fields | pending_test | verified` 等派生状态 |

### 4.3 食材角色

总账需要把“食材出现过”与“用户选它就一定能用”分开。每个食材最多拥有下列一种主要角色：

- `staple`：主食，如生米、熟米饭、面条、糯米；
- `core`：缺失后菜品身份或安全结构不成立；
- `optional`：有则可用，无则菜品仍成立；
- `liquid`：水、汤等配比主体；
- `seasoning`：基础调味；
- `explicit_substitution`：只能在已声明替换位中使用；
- `discouraged`：不应加入或需要额外处理；
- `unknown_role`：现有数据不足，必须待核实。

上述角色是总账审计标签，不改变现有 recipe 字段，也不授予模型自由替换权。

### 4.4 研究候选字段

地域研究候选另表展示：

- 地域路径、城市或民族地区；
- 地方原型和别名；
- 预期主食、蛋白、蔬菜和味型构成；
- 天然一锅或家庭一锅适配；
- 家庭化改造假设；
- 来源状态与链接；
- 需要补的 Ratio DSL、安全或食材兼容验证；
- 预期解决的 pantry 缺口；
- 当前状态：`research_queue | verified_identity | structured | preview_only | rejected`；
- `product_destination`：`recipe_evidence | template_evidence | taxonomy_rule | content_only | rejected`。

## 5. 用户食材到候选菜单的运行边界

### 5.1 不在运行时联网抓菜谱

用户点击生成时不搜索互联网。运行时只使用：

- 已审核的 production recipe；
- 已启用的 template catalog；
- ingredient taxonomy；
- Ratio DSL；
- 已由服务端确定的安全与兼容规则。

外部网络搜索只属于离线研究工作流：发现地方原型 → 核实事实与许可 → 结构化 → 测试 → 才可能成为生产资产。

### 5.2 规划与菜单依据的分工

```text
用户原始食材
→ identity normalization（名称、部位、生熟、形态）
→ mode + intent
→ template planner（确定候选 plan 和槽位）
→ recipe / menu master（提供技法、安全、比例、地域 grounding）
→ coverage + compatibility + safety 校验
→ 排列 1–3 个真实不同的计划
→ 用户选择
→ DeepSeek 单次表达
→ 服务端越界校验
```

Template + taxonomy 决定“能不能组合”；recipe / menu master 决定“为什么这样组合有依据，以及要遵守什么做法边界”。

DeepSeek 不得决定 template、槽位、使用或丢弃哪些主要食材、替换关系、required extra items、比例或安全规则。

## 6. 候选排序与三方案规则

### 6.1 直接推荐

`recommend` 模式的食材是 `prefer_use`。

基本承诺：

- 输入至少有一项可识别食材时，每张候选卡原则上至少使用一项；
- 不承诺全部使用；
- 必须显示 `planned_prefer_use` 与 `unused_prefer_use`；
- 未使用的原因只能来自结构化理由，例如不兼容、超过槽位上限、与主食形态不符、为保持单锅时间而未选用；
- 不得把可选食材的存在宣传为“已经全部用上”。

三张卡并非按菜名随机抽取，而是尽量分别承担：

| 卡片角色 | 目标 | 最低要求 |
|---|---|---|
| 最稳妥 | 味型、技法和熟制最可靠 | 至少使用 1 项用户食材 |
| 多用几样 | 尽量提高合理覆盖 | 覆盖数严格高于或等于最稳妥卡；若相同需有更清楚的食材解释 |
| 换种做法 | 在可靠范围内提供不同模板、主食形态、槽位组合或味型 | 不能只是相同核心食材换菜名 |

这不是强制凑满三张卡的规则。只有两套可靠 plan 就显示两张；只有一套就显示一张并说明“当前组合只有一个可靠的一锅方案”。

### 6.2 帮我清库存

`pantry` 模式的食材是 `must_use`。

基本承诺：

- 单锅优先；
- 单锅不合理时，规划最多两锅并以“第一锅、第二锅”的连续主餐计划展示；
- 第三锅不是默认结果，只有用户明确允许并且仍可解释时才出现；
- 只有全部去重 `must_use` 都进入 `planned_must_use` 时，状态才是 `complete`；
- 未识别、不兼容或容量超出的食材进入 `unplanned_must_use`，含 `reason_code` 和用户可理解原因；
- `unplanned_must_use` 非空时为 `needs_user_decision`，暂停 DeepSeek；
- 用户可明确放宽某一食材、调整食材或接受部分规划；接受后状态为 `partial_accepted`，页面仍必须显示未处理食材。

清库存卡代表“整套处理计划”，而不一定是一道菜。不得先展示一张低覆盖菜单，再用没有承接能力的“剩下食材再来一锅”掩盖问题。

### 6.3 候选去重与换一换

每个 plan 必须有规范化 `plan_id`。同一次换一换时：

- 当前 `plan_id` 硬排除；
- 更早历史计划仅软降权；
- 新旧 plan 至少有一项不同：`template_id`、slot assignment、单锅/多锅结构或锅序；
- 只改菜名、文案或步骤的“新方案”无效；
- 无同等可靠替代时返回 `no_alternative_plan`，不显示通用生成失败页。

## 7. 每张卡必须解释的内容

无论 `recommend` 或 `pantry`，卡片必须返回：

```json
{
  "planned_must_use": [],
  "planned_prefer_use": ["鸡腿", "土豆"],
  "unplanned_must_use": [],
  "unused_prefer_use": [
    {
      "item": "西兰花",
      "reason_code": "slot_limit",
      "reason": "这锅已安排两种蔬菜，再加入会影响熟制和口感。"
    }
  ],
  "required_extra_items": ["大米", "水", "食用油", "盐"],
  "coverage_ratio": 0.67,
  "recognition_ratio": 1,
  "template_id": "poultry-staple-pot",
  "plan_status": "ready"
}
```

其中：

- `coverage_ratio` 的分母随 mode 变化：pantry 为全部去重 `must_use`；recommend 为全部去重 `prefer_use`；
- `recognition_ratio` 单独显示识别成功比例，避免把“未识别”静默算作未使用；
- `required_extra_items` 第一阶段只允许基础主食、液体、油脂和基础调味；
- `planned_*` 表示已进入实际计划，`unused_*` 表示仅在 recommend 中未选用，二者不得混用。

## 8. 菜单测试矩阵

测试矩阵不以“函数是否返回”为终点，而是逐菜单建立可追溯验证。

### 8.1 静态菜单检查

每道 production recipe 至少检查：

- 在总账中恰好出现一次；
- `core_ingredients`、可选食材、液体、替换位与不建议项不丢失；
- `status`、来源元数据、时间、目的和安全规则可见；
- 生米、熟饭、面条、糯米等主食状态没有被混淆；
- 所有缺失信息显式为待核实，而非被伪造补齐。

### 8.2 单菜单正向旅程

每道菜单至少有一个真实的正向输入：

- 用户提供核心食材时能够找到该菜单或其对应有效 plan；
- 结果准确列出使用了哪些用户食材；
- 若有主食等基础补充，明确列在 `required_extra_items`；
- 所用时间、意图与 recipe 限制一致；
- 选中后模型生成不增加、删除或替换主要食材。

### 8.3 单菜单反向旅程

每道菜单至少有一个边界输入，验证：

- 不兼容或不建议食材不会被强行加入；
- 部位、形态或生熟不符时不会错误匹配；
- 忌口与熟制安全不会泄漏；
- 没有第二个有效计划时返回明确状态，而不是通用失败；
- 未使用食材有原因，不伪称已经清库存。

### 8.4 跨菜单排序旅程

每个高频食材组合都至少验证：

- 直接推荐三张卡不围绕同一种蛋白换名字；
- 多用几样卡的覆盖承诺可由字段复算；
- 换种做法卡在有效 plan 结构上真实不同；
- pantry 输入多于一种时不会返回只使用一种食材的伪清库存方案；
- 多锅计划每一锅都是独立主餐，食材不会跨锅重复消费。

### 8.5 结果记录

每条测试记录至少包含：

- 测试 ID；
- 菜单 ID 或 family ID；
- 原始用户输入；
- mode、intent、份数；
- 预期 `planned_*`、`unused_*`、`unplanned_*`；
- 预期 plan 状态与替代状态；
- 实际 planner 输出摘要；
- 人工家庭合理性结论；
- 测试状态：`pending | pass | fail | needs_review`。

点击数、停留时间、换菜次数不视为“用户实际做饭成功”。只有用户明确确认已做、可完成或不合理的反馈，才能作为菜单质量结论。

## 9. 实施分层

### 阶段 0：建立观察面，不改行为

- 新增总账构建器与派生的 Markdown/CSV/JSON 视图；
- 抽取当前 72 道菜单；
- 建立研究候选的独立空表；
- 添加完整性检查；
- 不改变 Worker、前端、Planner、DeepSeek 或生产 recipe。

### 阶段 1：建立逐菜单测试基线

- 为 72 道菜单生成静态测试矩阵；
- 优先人工填写高频家族的正反向输入；
- 跑出现有行为，记录真实缺口；
- 不为了通过测试而提前修改排序逻辑。

### 阶段 2：按缺口做最小修改

每一轮只选择一个明确问题，例如：

- 某类用户食材无法匹配；
- 三方案同质化；
- 某菜单漏报未使用食材；
- 某个菜单的形态或安全规则被违反。

每次修改必须先关联菜单 ID、用户输入和回归测试；禁止无对应测试的散点修补。

### 阶段 3：地域扩展

仅在阶段 0–2 已建立稳定观察面后，按“中国一锅主餐地域地图”研究和接入一个家族。继续维持约 70% 用户食材覆盖、30% 地域代表性的排序原则。

## 10. 验收标准

本框架完成后，应能做到：

- 用户和开发者都可查看完整 72 道菜单及其食材构成；
- 生产菜单、研究候选和历史候选不会混为一个数字；
- 任意生成结果可追溯到用户食材、模板、菜单依据和覆盖字段；
- 直接推荐不再承诺全部使用，却诚实说明使用与未使用；
- 清库存不再用低覆盖单菜伪装成功；
- 三方案有可解释的不同价值，而不是相同食材换名称；
- “换一换”能解释无替代候选；
- 每次后续修改都能定位到菜单和测试记录；
- 总账构建与测试检查不修改生产菜谱库。

## 11. 下一步

用户审阅并确认本规格后，先编写阶段 0 的详细实施计划，再开始：

1. 确定总账派生文件的精确路径与构建命令；
2. 以 TDD 为每项完整性检查写失败测试；
3. 导出并审阅 72 道菜单总表；
4. 建立研究候选空表和菜单测试矩阵；
5. 在不改变运行时行为的前提下提交阶段 0。

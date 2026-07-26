# 北方鲜面焖面食材身份与规划能力设计

日期：2026-07-27

状态：设计已获用户确认；计划自审补充 `canonical_required` 的机器执行边界

适用范围：Draft PR #1 后续工作。本设计只修复鲜小麦面条的受控身份和鲜面焖面 Ratio DSL，使现有北方豆角焖面能被 Pantry Planner V2 诚实承接；不新增 recipe，不新增 template，不部署 Preview 或 production，不合并 PR。

相关文档：

- `docs/superpowers/specs/2026-07-23-pantry-planner-v2-design.md`
- `docs/superpowers/specs/2026-07-26-regional-planner-capability-promotion-design.md`
- `docs/superpowers/specs/2026-07-27-planner-menu-coverage-audit-design.md`
- `docs/central-plains-noodle-research.md`
- `docs/jingjinji-jinmeng-one-pot-research.md`
- `docs/shandong-one-pot-research.md`
- `docs/planner-menu-coverage.md`

## 1. 当前事实与问题

现有生产菜单 `north-china-green-bean-braised-noodles` 的核心食材是：

- 鲜小麦面条；
- 豆角；
- 猪肉末。

当前 Planner 能识别豆角和猪肉末，却不能识别“鲜小麦面条”，因此覆盖审计把这道菜标为 `taxonomy_gap`。它同时映射到 `jingjinji`、`jinmeng`、`shandong` 和 `central_plains`，但不得据此宣称任何单省独占起源。

这不是只补一个别名的问题。当前 taxonomy 的单一 `noodle` identity 同时把“挂面”和“鲜面条”列为 alias；Ratio DSL 又只按 `category:"noodle"` 选择规则。结果是：

1. 鲜面和干挂面虽然初始含水、所需补液和熟制时间不同，却可能进入同一份量规则；
2. 研究账本明确禁止 `fresh_noodle_equals_dry_noodle`，运行时语义却仍然把两者压平；
3. 只把“鲜小麦面条”追加到旧 aliases，能让覆盖报告变绿，却不能证明这锅面做得出来。

本设计采用“鲜面独立 identity + state-aware Ratio DSL 分支”。恢复的是家庭鲜面焖面能力，不是把所有北方面食一次性纳入 Planner。

## 2. 方案取舍

### 2.1 采用：鲜面最小独立分支

- 建立 `fresh-wheat-noodle` pantry identity；
- 原 `noodle` 收窄为干面/挂面身份；
- `braised-noodle-pot` 同时保留干面和鲜面两条受控入口，但两者必须选择不同 Ratio DSL；
- 只恢复现有北方豆角焖面的三项核心覆盖；
- 不扩预蒸面、烩面、面片、面疙瘩或熟面。

这条路径既消除当前语义错误，也避免一次重构整个面食体系。

### 2.2 不采用：只补“鲜小麦面条”别名

改动虽小，却会继续让鲜面继承挂面吸水规则。它只能修复报表，不能修复产品能力，因此拒绝。

### 2.3 不采用：一次拆分所有面条形态

鲜面、干面、预蒸面、熟面、手揪面片和面团块的烹饪属性确实不同，但本轮只有鲜面焖面具备现有生产 recipe、template 和跨地域研究证据。其余形态继续进入后续地域切片，不在本轮提前建设完整面食知识图谱。

## 3. 成功边界与非目标

### 3.1 成功条件

完成后必须同时成立：

1. 输入“鲜小麦面条”“鲜面条”“鲜面”或“生鲜面”时，Planner 返回同一个鲜面 canonical identity，并保留原始名称；
2. 输入“挂面”“干面条”时，仍返回干面 identity，不得进入鲜面比例；
3. 输入“鲜小麦面条、豆角、猪肉末”，`mode:pantry` 能形成覆盖 3/3 的单锅完整计划；
4. 该计划使用鲜面专用 Ratio DSL，而不是当前通用 `braised-noodle-liquid-v1`；
5. 豆角和猪肉的既有安全终点、面条熟而不糊的质量终点全部保留；
6. `north-china-green-bean-braised-noodles` 从 `taxonomy_gap` 恢复为 `full_single_pot_ingredient_compatible`；
7. 四个地域节点的同一生产菜单覆盖同步恢复，但地域身份仍为 `cross_regional_chinese`；
8. recipe 总数保持 72，template 总数保持 16；
9. `/plan-meal` 仍为 0 次 DeepSeek 调用；
10. 不部署、不合并 Draft PR #1。

### 3.2 本轮不做

- 不新增固定菜谱、菜名变种或地域独占声明；
- 不新增 template；
- 不把河南蒸卤面、预蒸面、烩面、面片或挂面焖法并入鲜面分支；
- 不修改 recommend/pantry 成功标准、多锅上限、换一换或历史策略；
- 不把公开菜谱原文、图片或完整步骤复制进生产数据；
- 不增加账号、用户画像、营养追踪、自然语言场景或多 Agent 产品能力；
- 不调用真实 DeepSeek 做本轮 Planner 验收。

## 4. 食材身份设计

### 4.1 新增 `fresh-wheat-noodle`

机器语义目标如下：

```json
{
  "canonical_id": "fresh-wheat-noodle",
  "display_name": "鲜小麦面条",
  "aliases": ["鲜面条", "鲜面", "生鲜面"],
  "input_scope": "pantry_input",
  "category": "noodle",
  "ratio_rule_policy": "canonical_required",
  "states": ["raw"],
  "shapes_or_cuts": ["whole"],
  "cook_speed": "fast",
  "moisture_release": "low",
  "texture_behavior": {
    "behavior_code": "absorbs_liquid",
    "best_method_codes": ["braise", "steam", "simmer"],
    "failure_mode_codes": ["soft_when_overcooked", "clumps_when_hydration_is_wrong"]
  },
  "cooking_risk": {
    "risk_code": "none",
    "required_endpoint_codes": ["noodle_tender"]
  },
  "compatible_slot_codes": ["staple", "noodle"],
  "incompatible_slot_codes": []
}
```

`canonical` 或 `canonical_id` 必须保留鲜面身份，不能为了维持旧响应而静默退化成普通“面条”。`normalized_items.raw` 始终保留用户原词。

`ratio_rule_policy:"canonical_required"` 是受控机器字段：它表示该 identity 不能使用只按 category 匹配的通用 Ratio rule。第一阶段仅 `fresh-wheat-noodle` 使用该值；其余 identity 缺省为 `category_fallback`。该字段必须进入 validator、Planner assignment 和规范化 plan identity，不能成为只写在 JSON 里却不执行的说明。

### 4.2 收窄原 `noodle`

原 `noodle` 保留为干制小麦面条的通用 pantry identity：

- `display_name` 保持“面条”，避免破坏旧请求；
- aliases 至少包含“挂面”“干面条”；
- 删除“鲜面条”；
- 不把“预蒸面”“熟面”“烩面坯”“面片”追加为 alias；
- 原有 category 仍为 `noodle`，但 Ratio DSL 必须依据 canonical identity 继续分流，不能只看 category。

### 4.3 去重与忌口

- “鲜小麦面条”和“鲜面条”去重为同一 must-use identity；
- “鲜小麦面条”和“挂面”是两个不同 identity，用户同时提交时不得互相吞掉；
- “面条”忌口继续覆盖干面和鲜面两个受控 identity；
- 精确写“挂面”时不应无条件禁止鲜面，精确写“鲜面”时也不应无条件禁止挂面；
- Worker、`ai_proxy.py` 和前端 pantry identity 必须使用同一资产与同一归一化结果，增加 parity 锁定。

## 5. Template 与 Ratio DSL 设计

### 5.1 Template 不变为固定菜谱

不新增“豆角焖面模板”。现有 `braised-noodle-pot` 继续是通用可组合结构：

- required：一种面条主食 + 一至两种耐焖蔬菜；
- optional：至多一种快熟猪肉、鸡肉或老豆腐；至多一种菌菇；
- 鲜面、干面都可进入 `staple`，但必须分别命中自己的 Ratio DSL；
- 排骨、牛腩、牛肉末等不兼容形态仍被拒绝；
- quick intent 仍不支持最大 40 分钟的焖面结构。

Recipe 只提供技法、安全、比例校准和来源 evidence，不决定组合能力。组合能力仍由 template rules + ingredient taxonomy 决定。

### 5.2 Ratio 选择必须加入 canonical 条件

现有 rule 选择只看：

```json
{"template_id":"braised-noodle-pot","slot_id":"staple","category":"noodle"}
```

本轮把 Ratio DSL 的 `when` 扩展为可选 `canonical_ids`，并由 validator 限定其必须引用 taxonomy 中真实存在的 identity：

```json
{
  "template_id": "braised-noodle-pot",
  "slot_id": "staple",
  "category": "noodle",
  "canonical_ids": ["fresh-wheat-noodle"]
}
```

选择顺序固定为：

1. template、slot、category 和 canonical identity 全部命中的精确规则；
2. 没有精确规则时，才允许 category 通用规则；
3. assignment 中任一食材声明 `ratio_rule_policy:"canonical_required"` 时，如果没有精确规则必须返回 `ratio_rule_not_found`，禁止回退 category 通用规则；
4. 多条同等精确规则同时命中时，返回 `ratio_rule_ambiguous`，不得按数组顺序猜测。

这使未来可以继续拆分预蒸面或熟面，而无需新建固定菜谱。

### 5.3 鲜面补液范围

新增 `braised-fresh-wheat-noodle-liquid-v1`，只适用于 `fresh-wheat-noodle`。第一版机器范围为：

- 鲜面：每人 85–110 克，默认 100 克；
- 耐焖蔬菜：每人 70–120 克，默认 90 克；
- 可选蛋白质：每人 60–100 克，默认 80 克；
- 可选菌菇：每人 60–100 克，默认 80 克；
- 鲜面补液：鲜面重量的 0.70–1.00 倍，默认 0.85 倍；
- 每个高出水食材按现有 bounded-sum 机制抵扣每人 10–20 克，默认 15 克；
- 结果向 5 克取整，补液不得为负数。

设计依据只用于比例校准，不复制来源步骤：

- DayDayCook 的公开配方确认手擀面、豆角、猪肉和分次回添汤汁的同锅结构，但没有给出精确总水量；
- Omnivore's Cookbook 的公开配方同时给出 340 克鲜小麦面、240 毫升汤和 450 克豆角，液体/鲜面约 0.71，并明确鲜面与干面要采用不同预处理；
- 一份公开家庭手擀面做法给出约 600 克鲜面团对应约 550 毫升初始水，液体/鲜面约 0.92，并通过预留汤汁分段回添校正锅具差异。

因此第一版采用 0.70–1.00 的保守区间和 0.85 默认值，而不是沿用当前通用规则的 1.80。上述来源是设计校准线索，不转为 `approved` recipe 来源，也不用于宣称传统标准配方。

### 5.4 分段补液必须机器锁定

鲜面规则增加机器可验证的液体分段字段：

```json
{
  "liquid_distribution": {
    "initial_fraction": 0.8,
    "reserve_fraction": 0.2,
    "reserve_action_code": "add_reserved_liquid_if_needed"
  }
}
```

约束：

- 两个 fraction 必须为 0–1 的有限数且合计为 1；
- compiler 输出初始液体克数和预留液体克数，二者合计必须等于总补液；
- `add_reserved_liquid_if_needed` 只能加入 Planner 已锁定的预留量，不能由 DeepSeek决定额外加水；
- 如果模型写出超过锁定预留量的补液，按现有模型越界契约拒绝；
- 干面规则本轮不强制采用相同分段字段。

## 6. Planner 数据流与错误行为

### 6.1 正常路径

```text
原始输入
  → taxonomy 精确识别 fresh-wheat-noodle
  → braised-noodle-pot 槽位分配
  → canonical-aware rule 选择
  → 鲜面克数、总补液、初始液体与预留液体编译
  → 安全/兼容校验
  → locked plan
  → 用户确认后才进入 DeepSeek 表达
```

`/plan-meal` 不调用 DeepSeek，也不读取生成预算。

### 6.2 结构化失败

- 鲜面没有精确 Ratio DSL：`would_break_ratio`，内部 `ratio_rule_not_found`；
- 同时命中多条精确规则：`would_break_ratio`，内部 `ratio_rule_ambiguous`；
- 分段比例非法或总和不为 1：catalog 门禁失败，不允许启动 Worker；
- 用户输入预蒸面、熟面或其他未建模面食：保留 `recognized:false`，pantry 返回 `needs_user_decision`；
- 只有豆角或肉能规划、鲜面未规划时，不得返回 pantry `complete`；
- 任何失败都不得回退 legacy recipe selector，不调用 DeepSeek。

### 6.3 DeepSeek 边界

模型不能：

- 把鲜小麦面条改成挂面、预蒸面、熟面或其他主食；
- 删除豆角、猪肉末或 Planner 锁定的其他用户食材；
- 改写鲜面、蛋白质或蔬菜克数；
- 自行改变总液体、初始液体或预留液体；
- 在没有计划的情况下增加番茄、土豆、香菇等主要食材；
- 省略豆角、猪肉或面条安全终点。

生成接口仍最多调用 DeepSeek 1 次，失败不自动重试。模型越界返回现有 `model_contract_violation`。

## 7. 地域与覆盖语义

`north-china-green-bean-braised-noodles` 继续保持：

- `regional_scope:"cross_regional_chinese"`；
- region IDs：`jingjinji`、`jinmeng`、`shandong`、`central_plains`；
- primary family：`noodle-braise`；
- 不写成河南、山东、山西、内蒙古或京津冀任何一地独占起源。

覆盖恢复后：

- 该 production recipe 的 audit 状态变为 `full_single_pot_ingredient_compatible`；
- `noodle-braise` capability 可以继续保留 `preview_candidate`；
- `covered_staple_states` 明确包含 `fresh_raw_noodle` 和当前已支持的 dry/raw branch；
- `uncovered_staple_states` 继续包含 `presteamed_noodle`；
- `raw_noodle_only` 边界必须改成能准确表达“鲜面与干面已分流、预蒸面未覆盖”的机器状态，不得继续用含糊文字掩盖。

恢复同一 production recipe 在四个地域节点的覆盖，不等于新增四道菜，也不增加任何地域 recipe 数量。

## 8. 版本与迁移

实现时必须递增：

- `taxonomy_version`：`taxonomy-v1-20260727-r5` → `taxonomy-v1-20260727-r6`；
- `ratio_catalog_version`：`ratio-rules-v1-20260727-r3` → `ratio-rules-v1-20260727-r4`；
- `template_catalog_version`：`templates-v2-20260727-r6` → `templates-v2-20260727-r7`，因为 template catalog 绑定新的 taxonomy 和 Ratio DSL 行为。

`schema_version:2` 和 `planner_version:"pantry-planner-v2"` 保持不变。版本事实同步到 Worker validator、健康检查、本地代理、测试、构建资产说明和部署文档。

旧计划在新 catalog 下必须返回 `stale_plan`，不得使用新鲜面规则静默重新解释旧 plan token。

旧输入兼容策略：

- “面条”继续映射干面通用 identity；
- “挂面”继续可用；
- 旧的“鲜面条”从原 identity 无损迁移到 `fresh-wheat-noodle`；
- 旧 plan ID 因 canonical identity 或 ratio 变化自然失效；
- recommend 必要时仍可使用现有显式 legacy fallback，但 pantry 不得回退残缺固定 recipe。

## 9. TDD 与真实旅程

所有实现先写失败测试，再修改生产代码。至少覆盖：

### 9.1 Identity 与 parity

1. “鲜小麦面条”识别为 `fresh-wheat-noodle`；
2. “鲜面条”“鲜面”“生鲜面”识别为同一 identity；
3. raw 原词完整保留；
4. “挂面”“干面条”仍识别为干面 identity；
5. 鲜面与挂面同时输入时不去重成一项；
6. 预蒸面不被鲜面 alias 吞并；
7. Worker、本地代理和前端 pantry identity 对上述输入结果一致；
8. “面条”忌口覆盖鲜面和挂面，精确形态忌口不无条件扩大。

### 9.2 Ratio DSL

9. 鲜面规则只能命中 `fresh-wheat-noodle`；
10. 挂面不能命中鲜面规则；
11. 两人份 200 克鲜面默认总补液为 170 克，再应用高出水抵扣；
12. 初始液体与预留液体合计等于最终总补液；
13. 0.8/0.2 分段非法时 validator 失败；
14. 多条精确规则冲突返回 `ratio_rule_ambiguous`；
15. 鲜面精确规则缺失时不回退通用干面规则；
16. 所有锁定食材仍有确定克数，required extras 仍只允许基础液体、油脂与调味。

### 9.3 Planner 旅程

17. pantry：鲜小麦面条 + 豆角 + 猪肉末，单锅 3/3 complete；
18. pantry：鲜面条 + 豆角 + 老豆腐，单锅完整覆盖；
19. recommend：鲜面 + 豆角 + 猪肉末 + 不兼容食材，选择合理组合并解释 unused；
20. pantry：预蒸面 + 豆角 + 猪肉，返回 `needs_user_decision`；
21. pantry：鲜面 + 豆角，仍满足至少两项且保留豆角熟制终点；
22. quick：不选择最大时间 40 分钟的焖面 template；
23. swap：有第二个同等承诺 plan 时改变真实 plan；没有时返回 `no_alternative_plan`；
24. `/plan-meal` 全程 0 次 DeepSeek、0 次生成预算读取。

### 9.4 生成契约与覆盖

25. 模型把鲜面改成挂面时返回 `model_contract_violation`；
26. 模型增加未计划主要食材时拒绝；
27. 模型改变水量或超出预留液体时拒绝；
28. 现有北方豆角焖面变为 `full_single_pot_ingredient_compatible`；
29. 四个地域节点映射保持跨地域，不生成省份独占声明；
30. recipe=72、template=16、active/planned 数量保持当前基线。

## 10. 验收与交付边界

实现完成后必须运行：

1. 新增 identity、Ratio DSL、Planner、parity、覆盖与旅程测试；
2. 现有全部 Node 测试；
3. `node tools/check-recipes.mjs`；
4. `node tools/run-pantry-planner-v2-journeys.mjs`；
5. Python 语法检查；
6. 地域覆盖、菜单总表、regional atlas 与相关研究文档一致性检查；
7. `node tools/build-dist.mjs` 与构建字节一致性检查。

自动测试通过只证明确定性契约成立，不宣称真实厨房口感已经被人工试做批准。Ratio DSL 在 Draft PR 中必须保留设计校准来源和 `auto_approved`/Preview 边界；不得把它描述为行业标准比例或传统正宗配方。

交付只更新 Draft PR #1：不部署 Preview，不部署 production，不合并 PR，不调用真实 DeepSeek。

## 11. 设计校准来源

以下来源只用于核对鲜面/干面差异、家常焖面结构和数量级，不复制原文步骤、图片或完整配方，也不改变现有 recipe 授权状态：

- [DayDayCook：豆角焖面](https://www.daydaycook.com/zh-Hans/recipe/steamed-noodles-with-bean-string)：支持手擀面、豆角、猪肉、分次加入汤汁和收汁结构；未提供精确总水量。
- [Omnivore's Cookbook：Green Bean Noodles](https://omnivorescookbook.com/green-bean-noodles/)：明确区分鲜面和干面预处理，并给出鲜面、汤和豆角的可核算数量级。
- [下厨房公开家庭做法：山西豆角焖面](https://m.xiachufang.com/recipe/106716465/)：提供手擀鲜面团与初始用水的数量级，并明确保留汤汁分段回添；仅作公开家庭经验校准，不作为权威或传统标准来源。

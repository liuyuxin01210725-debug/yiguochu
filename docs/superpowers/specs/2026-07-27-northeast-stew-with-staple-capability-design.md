# 东北炖菜带锅边玉米主食能力设计

日期：2026-07-27

状态：设计已确认，待实现计划

适用范围：Draft PR #1；本规格不授权部署 Preview、production 或合并 PR

## 1. 决策摘要

下一项地域能力选择 `stew-with-staple`，但第一轮只建设“炖菜 + 锅边玉米主食”窄分支，不同时支持小麦花卷、粘卷子、鱼锅或豆腐变体。

实现必须先补齐一条真实家庭链路：

```text
用户的玉米面粉
  ↓ 受控食材识别
机器计算和面用水
  ↓ 确定性 preparation
已和好的玉米面团
  ↓ 受控槽位分配
炖菜 + 锅边玉米饼计划
  ↓ 用户确认
DeepSeek 只负责把锁定步骤说成人话
```

`stew-with-staple-pot` 在数值证据、模板级厨房校准和真实旅程全部完成前继续保持 `planned`、`runtime_eligible:false` 和 `blocked_by_ratio`。本设计阶段不修改 recipe、template、taxonomy、Ratio DSL、Planner、Worker、前端或部署状态。

## 2. 为什么选这条路线

地域能力账本已经覆盖 12/12 个技法家族。`stew-with-staple` 直接对应用户优先提出的东北一锅出，也是当前区别于普通焖饭、汤面和炒饭的代表性结构。

现有证据足以支持：

- 东北铁锅炖家族存在锅边玉米饼或小花卷；
- 黑龙江资料直接支持排骨、油豆角和锅边玉米面饼的家族结构；
- 鸡肉、土豆、菌菇、鱼等分别存在于东北铁锅炖资料中。

现有证据不支持：

- 把鸡肉、蘑菇、土豆和玉米饼写成固定传统组合；
- 把鱼、豆腐、白菜和玉米饼写成固定传统组合；
- 把北京平谷粘卷子的事实改写成东北事实；
- 把玉米面条研究中的含水率直接当成锅边玉米饼比例；
- 在没有家庭锅具校准的情况下给出确定的炖锅液位、和面水量或蒸制时间。

因此，本轮解决的是“怎样把已确认的地域技法变成可执行的确定性能力”，不是继续堆地域菜名。

## 3. 方案比较

### 3.1 采用：原始玉米面到锅边饼的完整窄链路

用户输入“玉米面”时，系统识别为原始玉米面粉，显式执行和面 preparation，再把生成的玉米面团分配给锅边主食槽位。炖锅水和和面水分别计算、分别展示，但汇总到同一个基础补充项“水”。

优点：符合家庭输入习惯，计划可解释，比例可审计，也不会把原料状态偷换掉。

### 3.2 不采用：只接受“和好的玉米面团”

这条路线实现最少，但把系统内部数据状态转嫁给用户。普通用户家里有的是玉米面，不会自然选择“已和好的玉米面团”。它会产生技术上能匹配、产品上几乎无人可用的假能力。

### 3.3 不采用：玉米饼、花卷和粘卷子一次上线

三类主食的原料、成团、醒发、锅内位置、吸水和蒸制终点不同。一次泛化会迫使一个 Ratio DSL 规则承担互相冲突的物理过程，也会把东北与北京的地域事实混在一起。

## 4. 第一阶段产品承诺

### 4.1 支持范围

第一阶段只允许：

- 主食原料：原始玉米面粉，或用户明确声明的已和好玉米面团；
- 蛋白：排骨；鸡腿只作为通过独立兼容和安全校验后的家庭适配分支；
- 蔬菜：油豆角或通过独立兼容校验的普通豆角；土豆可作为第二耐炖蔬菜；
- intent：`normal`、`batch`；
- 份数：只在完成厨房校准的 2、3、4 人份范围内；
- 设备假设：有盖深锅，且锅壁能够在炖煮液面上方保留贴饼和蒸汽空间。

只有“排骨 + 油豆角 + 玉米面主食”可以引用已核实的东北家族依据。其他通过兼容校验的组合只能显示普通名称，例如“家常炖菜配锅边玉米饼”，不得伪装成固定东北名菜。

### 4.2 明确不支持

第一阶段不允许：

- 小麦面粉、小麦面团、花卷或粘卷子进入玉米分支；
- 现成玉米饼被当作原始玉米面或生面团；
- 玉米粒、甜玉米或玉米段被当作玉米面粉；
- 鱼、豆腐、白菜进入本轮 template；
- 两种蛋白被强塞进一锅；
- `quick` intent；
- 未校准的 1 人份或 5–8 人份；
- DeepSeek自行决定和面、替换主食、改变水量或添加主要食材。

这些限制是第一阶段的真实能力边界，不是永久否定。后续分支必须独立完成证据、比例和安全审查。

## 5. 食材状态与 taxonomy 契约

### 5.1 四种状态必须分开

taxonomy 至少区分：

| canonical id | 用户可见名称 | category | state | 说明 |
| --- | --- | --- | --- | --- |
| `cornmeal-flour` | 玉米面 | `cornmeal_flour` | `raw` | 原始粉状主食原料，保留粗细属性，可进入 preparation |
| `cornmeal-dough` | 和好的玉米面团 | `cornmeal_dough` | `prepared` | 已完成受控和面，可进入锅边主食槽位 |
| `pot-edge-corn-cake` | 锅边玉米饼 | `cornmeal_cake` | `derived_plan_output` | Planner 的计划产物，不作为普通 pantry alias |
| `ready-corn-cake` | 现成玉米饼 | `ready_staple` | `cooked` | 不能被重新当作生面团贴在锅边蒸制 |

`玉米面`、`玉米粉`只归一到 `cornmeal-flour`；`和好的玉米面`、`玉米面团`只归一到 `cornmeal-dough`。不得使用双向模糊 alias 把四种状态折叠。

### 5.2 原始名称必须保留

`normalized_items` 继续返回 `raw`、`canonical`、`category`、`shape/cut`、`recognized`。原始玉米面经过 preparation 后：

- `planned_must_use` 或 `planned_prefer_use` 仍记录用户提交的 `cornmeal-flour`；
- `slot_assignment.staple` 记录派生的 `cornmeal-dough`；
- 派生项必须带 `source:"derived"` 和 `derived_from:["cornmeal-flour"]`；
- 不能因为中间形态变化而把用户的玉米面显示为“未使用”。

### 5.3 玉米面粗细与豆角品种不静默折叠

`cornmeal-flour` 必须保留 `shape_or_cut`，至少允许 `fine`、`coarse`、`unspecified`。数值校准只对实际测试过的粗细生效；如果 M2 只完成细玉米面校准，粗玉米面必须返回 `unsupported_shape_or_cut`。普通“玉米面”是否可采用默认粒度，取决于校准是否覆盖至少两个常见市售样本；未覆盖时必须让用户确认，不得暗中假设。

油豆角和普通豆角也必须是不同 canonical identity。两者可以共享“豆角必须彻底熟制”的安全端点，但不能通过 alias 自动继承相同含水、炖煮时间或地域表述。第一阶段地域锚点只认油豆角；普通豆角只能作为独立通过兼容测试后的家庭适配。

## 6. 机器可执行 preparation 与 Ratio DSL

### 6.1 不依赖自然语言比例

M1 不向生产 `ratio-rules.v1.json` 写入缺数值的占位规则。来源、候选范围和厨房校准结果先写入研究侧 `northeast-stew-research.v1.json`，继续由发布包隔离测试证明其不进入 `dist/`。

M2 获得激活审查批准后，`ratio-rules.v1.json` 才增加受控 `preparation_rules`，并提升 catalog version。它不是自然语言提示词库，机器 schema 为：

```ts
type PreparationRule = {
  rule_id: 'cornmeal-flour-to-dough-v1';
  activation_status: 'active';
  when: {
    input_canonical_id: 'cornmeal-flour';
    input_category: 'cornmeal_flour';
  };
  produces: {
    canonical_id: 'cornmeal-dough';
    category: 'cornmeal_dough';
    state: 'prepared';
  };
  operations: [
    { operator: 'per_serving'; target: { canonical_id: 'cornmeal-flour' }; grams: Bounds },
    { operator: 'ratio'; target: { name: '水'; category: 'liquid'; phase: 'prepare_staple' }; denominator: { canonical_id: 'cornmeal-flour'; measure: 'grams' }; bounds: Bounds }
  ];
  required_basic_extras: ['水'];
  evidence_source_ids: string[];
  calibration_record_ids: string[];
  rounding: { grams_to_nearest: number };
};
```

`Bounds` 的 `min/default/max` 必须全部为有限正数，并满足 `min <= default <= max`。该类型只定义字段职责，不授权填写任何克数；数值必须经过第 10 节证据与校准门后才能进入生产机器目录。校验器必须拒绝 `planned`、空数组证据、零值、字符串占位或缺少校准记录的 preparation rule。

### 6.2 两条比例必须独立

第一阶段需要两个不同规则：

1. `cornmeal-flour-to-dough-v1`
   - 决定每份玉米面粉克数；
   - 决定和面用水；
   - 输出可进入 staple 槽位的 `cornmeal-dough`；
   - 不计算炖锅汤液。

2. `stew-with-corn-cake-liquid-v1`
   - 决定排骨、豆角、可选土豆和派生面团的克数；
   - 决定炖锅保留液体；
   - 声明液面不得浸没锅边饼；
   - 声明贴饼时必须仍有连续蒸汽来源；
   - 不重新计算和面用水。

不得把两种水混成一个无法解释的 `retained_liquid_grams`。计划必须同时返回：

```ts
type StewWithCornCakeLiquidConstraints = {
  total_water_grams: number;
  phase_allocations: [
    { phase: 'prepare_staple'; name: '水'; grams: number },
    { phase: 'stew_liquid'; name: '水'; grams: number }
  ];
  staple_position: 'above_stew_liquid';
  steam_required: true;
};
```

三个克数字段必须是有限正数，并满足两个阶段水量之和等于总水量。校验器必须拒绝 0、未校准值或总量不守恒的规则进入 runtime-eligible template。

### 6.3 required extras 保持原边界

水仍属于允许的基础液体。`required_extra_items` 对用户展示水的合计克数，`phase_allocations` 解释每一阶段怎么分配。不得通过 preparation 自动补玉米面、小麦粉、鸡蛋、牛奶或其他主要食材。

### 6.4 规则引用原子迁移

当前能力账本和 planned template 引用旧占位 ID `stew-with-staple-liquid-v1`。M1 保持该现状并继续阻塞；不得把尚未进入生产 catalog 的候选规则写入 `resolved_ratio_rule_ids`。

M2 只有在两条规则同时具备数值证据和校准记录时，才原子迁移为：

```text
required_ratio_rule_ids:
  cornmeal-flour-to-dough-v1
  stew-with-corn-cake-liquid-v1

resolved_ratio_rule_ids:
  cornmeal-flour-to-dough-v1
  stew-with-corn-cake-liquid-v1
```

template、能力账本、Ratio DSL catalog、plan identity 和测试必须在同一提交中切换，禁止出现一条规则已解析、另一条仍缺失的半激活状态。

## 7. Plan schema 与 plan_id

每个 pot 增加结构化 `preparations`：

```ts
type CornmealPreparation = {
  preparation_rule_id: 'cornmeal-flour-to-dough-v1';
  input_items: ['cornmeal-flour'];
  output_item: 'cornmeal-dough';
  required_extra_items: [{ name: '水'; category: 'liquid'; grams: number }];
  ratio_trace: RatioTraceEntry[];
};
```

规范化 `plan_id` 必须加入：

- `preparations`；
- preparation rule ID；
- 输入与派生 canonical ID；
- 两阶段水量分配；
- Ratio DSL catalog version。

菜名、推荐理由和自然语言步骤仍不得进入 `plan_id`。同一锁定计划由 DeepSeek重新表达时 ID 不变；任何和面比例、炖锅液体或派生食材变化都必须产生新 ID，并使旧 `plan_token` 进入 `stale_plan`。

## 8. Template 边界

`stew-with-staple-pot` 不拆成“排骨豆角贴饼模板”等固定菜名模板。它仍是通用技法结构，但第一阶段只打开 cornmeal branch：

```text
required:
  protein: 1
  long_cook_vegetable: 1..2
  staple: cornmeal_dough 1
  stew_liquid: water 1

optional:
  mushroom: 0..1（第一阶段关闭）

order:
  1. protein pretreat
  2. protein + long-cook vegetables braise
  3. prepare cornmeal dough
  4. verify liquid and steam space
  5. position dough above liquid
  6. covered steam
  7. reach all safety endpoints
```

模板在第一阶段必须新增或明确：

- `supported_servings:[2,3,4]`；
- `equipment_assumption`：有盖深锅及液面上方贴饼空间；
- `supported_staple_branches:["cornmeal"]`；
- `unsupported_staple_branches:["wheat_dough","sticky_roll","flower_roll"]`；
- `supported_intents:["normal","batch"]`；
- 排骨、豆角和生面团各自的安全终点；
- 普通豆角替代油豆角时不得继承“传统固定组合”表述。

## 9. Planner、DeepSeek 与模型越界校验

Planner 决定：

- 原始玉米面是否可识别；
- preparation rule；
- 派生面团；
- slot assignment；
- 每项克数；
- 和面水和炖锅水；
- 锅内顺序、位置和安全终点；
- 地域名是否允许显示。

DeepSeek只允许输出：

- 用户可见菜名；
- 已锁定阶段的自然语言步骤；
- 推荐理由。

生成后服务端必须验证：

- 原始用户食材集合未变；
- 派生食材只来自已签名 preparation；
- 基础补充项未超出 Planner 锁定集合；
- 两阶段水量均未改变；
- 没有把排骨改成肉片、玉米面改成玉米粒、豆角改成白菜；
- 步骤顺序保留先炖、检查液位、贴饼、加盖蒸熟和安全终点；
- 模型不得声称未获证据支持的固定东北菜名。

任何越界返回 `model_contract_violation`；不自动重试，不产生第二次 DeepSeek 调用。

## 10. 证据与厨房校准门

### 10.1 三类证据分开

1. 地域和家族证据
   - 使用现有东北研究账本中的政府、文旅和地方资料；
   - 只证明地域存在、家族结构和已明确的食材组合。

2. 数值比例证据
   - 至少两份彼此独立、包含可换算克数的来源；
   - 必须说明玉米粉类型、是否混入小麦粉、冷水或热水、是否发酵；
   - 与本模板原料状态不同的研究只能作为边界证据，不能直接提供默认值；
   - 来源冲突超出拟定安全范围时继续保持 `blocked_by_ratio`。

3. 模板级厨房校准
   - 只校准一条物理模板，不逐道试吃所有组合；
   - 对 2、3、4 人份各完成一次；
   - 记录锅口径、锅深、玉米面品牌/粗细、和面水、炖锅水、时间和结果；
   - 校准结论必须是结构化数据，不只写“好吃”或“没问题”。

### 10.2 校准通过标准

每个已支持份数必须同时满足：

- 面团能成形并贴附，不流淌、不大面积脱落；
- 饼体中心无生粉、无明显夹生硬芯；
- 饼体不被炖液浸没或煮散；
- 锅底无焦糊，炖锅仍有可食用汤汁；
- 排骨达到既定熟制终点；
- 豆角彻底熟制；
- 2、3、4 人份按规则缩放后结果一致；
- 操作者能按页面说明完成，不需要理解内部 DSL。

任何一项失败都不得通过扩大 min/max 范围来掩盖，必须修正规则或缩小支持范围。

## 11. 状态迁移

不为本分支新增 promotion enum。过程状态由独立的证据和校准记录表达，地域能力账本继续只使用现有状态：

```text
blocked_by_ratio
  ↓ 数值来源通过，但仍保留 blocked_by_ratio
calibration_status: required
  ↓ 2/3/4 人份模板校准通过
preview_candidate
  ↓ 自动门禁 + Preview 真人理解验证 + 用户另行批准
covered_by_active_template
```

`preview_candidate` 不等于 production 批准。只有用户另行批准，才允许把 template 改为 `active/runtime_eligible:true`，并同步变更为 `covered_by_active_template`。本轮不新增 `active` template，也不改变 9 active + 7 planned 基线。

地域能力账本在数值规则真正存在前继续：

- `coverage_level:"none"`；
- `promotion_status:"blocked_by_ratio"`；
- `resolved_ratio_rule_ids:[]`；
- `blocker_codes:["ratio_rule_missing:stew-with-staple-liquid-v1"]`。

完成 cornmeal branch 的 Preview 校准后，才可提议改为：

- `coverage_level:"partial"`；
- covered：玉米面团；
- uncovered：小麦面团；
- boundary：`cornmeal_branch_only`。

实施分成两个明确里程碑：

- M1 证据与校准准备：补 taxonomy 状态、preparation schema、校验器、隔离测试夹具，以及研究账本中的结构化来源与校准记录；不向生产 ratio catalog 写占位数值，真实 template 保持 planned，不进入运行候选。
- M2 激活审查：只有数值证据和真实校准记录完整后，才填入生产数值、运行 22 条旅程并提交单独的激活审批。M1 完成不能自动进入 M2。

## 12. 用户可见结果与错误路径

成功计划必须解释：

- “你的玉米面会先和成面团，再贴到炖锅液面上方”；
- 玉米面、排骨、豆角分别用了多少；
- 水的总量以及“和面用水 / 炖锅用水”的拆分；
- 为什么不能用于 quick；
- 如果显示地域依据，明确是“东北铁锅炖家族结构”，不是虚构固定菜名。

失败不得走通用生成错误页。规划阶段使用结构化原因：

| reason code | 用户文案 |
| --- | --- |
| `unsupported_staple_state` | 这次的主食形态不适合锅边玉米饼方案。 |
| `preparation_ratio_unavailable` | 玉米面和面比例还没有通过可靠校准。 |
| `unsupported_servings` | 这项做法目前只验证了 2–4 人份。 |
| `equipment_assumption_required` | 这项做法需要有盖深锅和锅边蒸制空间。 |
| `no_alternative_plan` | 当前组合只有一个达到同等承诺的可靠方案。 |

pantry 模式不能因这项模板不可用而静默丢弃玉米面；必须把它保留在 `unplanned_must_use` 并说明原因。recommend 模式可以选择其他合理组合，但必须把未使用玉米面列入 `unused_prefer_use`。

## 13. 真实用户旅程与契约测试

完整路线必须覆盖以下 22 条真实旅程，不以单个函数测试代替。M1 使用隔离的候选资产夹具验证规划契约，同时断言真实 catalog 仍不选择该 template；M2 获得单独批准后，才把相同旅程转为真实 catalog 与 Worker 端到端门禁：

1. pantry/normal：排骨 + 油豆角 + 玉米面，2 人份，完整计划。
2. pantry/normal：同组合，3 人份，比例稳定缩放。
3. pantry/batch：同组合，4 人份，比例稳定缩放。
4. recommend/normal：同组合，返回合理计划并解释地域家族依据。
5. pantry/normal：鸡腿 + 土豆 + 玉米面，只能使用普通家庭适配名称。
6. pantry/normal：排骨 + 普通豆角 + 玉米面，不得声称油豆角固定组合。
7. pantry/normal：排骨 + 豆角 + 已和好玉米面团，不重复执行和面 preparation。
8. pantry/normal：排骨 + 豆角 + 现成玉米饼，不得当作生面团。
9. pantry/normal：排骨 + 豆角 + 玉米粒，不得命中玉米面分支。
10. pantry/normal：排骨 + 豆角 + 小麦面粉，保持 unplanned。
11. pantry/quick：排骨 + 豆角 + 玉米面，不产生虚假 30 分钟计划。
12. pantry/normal：同组合，1 人份，返回 `unsupported_servings`。
13. pantry/normal：同组合，5 人份，返回 `unsupported_servings` 或明确分锅，不静默缩放。
14. pantry/normal：排骨 + 鸡腿 + 豆角 + 玉米面，不把两种蛋白塞进一锅。
15. pantry/normal：鱼 + 豆腐 + 白菜 + 玉米面，第一阶段不进入本模板。
16. pantry/normal：排骨 + 豆角 + 玉米面且忌口猪肉，返回忌口冲突。
17. 同一输入两次规划，得到相同 plan 和 plan_id。
18. preparation 比例版本变化，旧 plan_token 返回 `stale_plan`。
19. 换一换没有同等承诺的第二个计划，返回 `no_alternative_plan`。
20. DeepSeek新增小麦粉或鸡蛋，返回 `model_contract_violation`。
21. DeepSeek修改和面水或炖锅水，返回 `model_contract_violation`。
22. DeepSeek把玉米面改成玉米粒，返回 `model_contract_violation`。

另外增加不变量测试：

- `planned_must_use` 中的原始玉米面不会因派生面团而丢失；
- preparation 水量 + stew 水量 = required extra 中水的总量；
- 每个派生食材都有且只有一个 `derived_from`；
- `plan_id` 包含 preparation，但不包含菜名或自然语言步骤；
- 未激活 template 永远不进入运行候选；
- Worker、`ai_proxy.py` 与前端 identity/parity 对同一食材状态解释一致。

## 14. 成本与调用次数

- `/plan-meal`：0 次 DeepSeek；
- 换一换：0 次 DeepSeek；
- preparation 与 Ratio DSL：纯确定性计算；
- `/generate-plan`：用户确认锁定计划后最多 1 次 DeepSeek；
- 任何模型越界：不自动重试；
- 证据不足、比例未校准或 unsupported 状态：不调用 DeepSeek。

## 15. 非目标

本阶段不做：

- 新增固定 recipe；
- 新增第二个地域 template；
- 激活 `stew-with-staple-pot`；
- 支持花卷、粘卷子、鱼锅或豆腐锅；
- 建设完整食物知识图谱；
- 增加账号、用户画像、营养追踪、云端用户数据或多 Agent；
- 复制第三方菜谱步骤或图片；
- 部署 Preview、production 或合并 PR。

## 16. 完成定义

本设计进入实现计划前必须满足：

- 原始玉米面、面团、派生锅边饼和现成饼的语义不再混淆；
- preparation 与炖锅比例是两条独立机器规则；
- 两阶段水量进入 plan identity 和模型越界校验；
- 地域事实、数值证据和厨房校准三层分开；
- 第一阶段支持、拒绝和用户文案均无歧义；
- 22 条真实旅程、成本边界和不部署限制写明；
- 全文没有任何未经证据支持的生产克数。

# 中国地域技法向 Planner 能力晋升设计

日期：2026-07-26

状态：设计已确认，待实施计划

适用范围：Draft PR #1；本规格不授权部署 Preview、production 或合并 PR

## 1. 背景

中国地域一锅主餐框架已经覆盖 13 个地域组、34 个省级节点与 12 个技法家族。现有运行资产仍是 72 道 recipe、8 个 active template 和 7 个 planned template。地域研究层已经能够回答“哪些地区存在什么一锅技法”，但尚未稳定回答“用户这次提交的食材如何进入一个可执行的计划”。

用户已经暴露出两个直接问题：

- 输入多种食材后，候选方案可能只使用一项，缺少清库存价值；
- 三个候选可能围绕同一种蛋白重复，地域菜数量增加却没有转化成组合能力。

本阶段不继续堆固定 recipe，而是建立一条可审计的晋升路径：把成熟的地域技法证据转化为通用、确定性、机器可验证的 Planner template 能力。

## 2. 目标

本阶段必须实现以下产品与工程目标：

1. 地域研究、地域映射和运行时 template 保持分层，研究资料不能直接进入生成请求。
2. 地域菜只有在带来不同的烹饪顺序、比例、安全边界或槽位兼容性时，才可形成新 template。
3. 只是肉类、蔬菜或调味变化的地域菜复用已有通用 template，不退化成数百个固定菜谱或地域模板。
4. 第一批优先解决真实高频食材覆盖，激活华北焖面能力、强化江南菜饭能力，并为东北主食同炖建立未激活的结构草案。
5. 所有比例由 Ratio DSL 执行，所有组合由 template rules 与 ingredient taxonomy 决定，DeepSeek 只负责表达已锁定的计划。
6. Planner 候选的差异必须来自 template、槽位分配或单锅/多锅结构，不得只换菜名和文案。

## 3. 非目标

本阶段不做：

- 增加现有 72 道 recipe；
- 批量导入地域菜谱原文或图片；
- 为每个城市或菜名建立一个 template；
- 建设完整食物知识图谱；
- 增加账号、用户画像、营养追踪、云端用户数据或多 Agent；
- 改变 DeepSeek 的职责边界；
- 大规模重写前端；
- 部署 production 或合并 Draft PR。

## 4. 方案选择

### 4.1 采用：用户缺口优先

第一批按真实家庭输入价值排序：

1. 华北焖面：承接面条、猪肉、鸡肉、豆角、土豆、白菜、菌菇和豆腐；
2. 江南菜饭：强化生米、叶菜、菌菇与常见蛋白的同锅能力；
3. 东北主食同炖：先机器化结构，不立即参与运行。

该顺序直接改善“多选食材却只使用一项”和“三个方案都围绕鸡肉”的体验。

### 4.2 未采用：只按证据成熟度排序

只晋升资料最完整的少数地域技法，风险较低，但与用户当前覆盖缺口可能没有关系，短期产品改善不足。

### 4.3 未采用：按地域地图顺序推进

逐省、逐地域完成看起来更整齐，但会把人力投入到低频组合，并再次把“地域研究完成度”误当成“用户问题解决度”。

## 5. 权责与数据分层

```text
regional-atlas.v2.json
全国地域、行政节点与技法家族总框架
        ↓
regional-menu-mappings.v1.json
recipe / research candidate / technique family / template 的审计映射
        ↓
meal-templates.v2.json + ingredient-taxonomy.v1.json + ratio-rules.v1.json
运行时确定性规划资产
        ↓
Planner V2
        ↓
锁定 plan
        ↓
DeepSeek 只生成菜名、步骤和推荐理由
```

职责边界：

- `regional-atlas.v2.json` 决定研究范围，不参与运行时选菜；
- `regional-menu-mappings.v1.json` 记录地域事实、技法归属和晋升状态，默认不进入生产构建；
- template rules + taxonomy 决定食材组合、槽位与烹饪结构；
- Ratio DSL 决定克数、液体与份数；
- 72 道 recipe 只提供技法、安全、比例和来源 evidence，不决定组合空间；
- DeepSeek 不得增加、删除、替换或重新分配 Planner 锁定的食材。

## 6. 地域技法晋升规则

### 6.1 新 template 判定

只有满足以下至少一项，才允许新建 template：

- 烹饪顺序与现有 template 不同；
- 主食吸水、补液或锅内位置规则不同；
- 对食材形态或熟制速度有不同的机器约束；
- 存在现有 template 无法表达的安全终点；
- 单锅容量、槽位或分锅策略实质不同。

仅菜名、地域、调味、蛋白或蔬菜变化，不构成新 template。

### 6.2 五道晋升门

#### 技法证据门

晋升项必须明确主食形态、食材进入顺序、液体与火候逻辑、不可替换项，以及家庭锅具适配后仍保留的技法身份。`evidence_recipe_ids` 必须引用现有 recipe ID，地域研究记录只能补充研究依据，不能代替 recipe evidence。

#### 食材语义门

所有可进入槽位的食材必须在 taxonomy 中具备 canonical identity、category、shape/cut、cook speed、moisture release、texture behavior、cooking risk 及 slot compatibility。通用快熟肉片不得无条件替换牛腩、肉末、排骨等特殊形态。

#### Ratio DSL 门

每个 runtime-eligible template 的每种主食形态必须命中机器可执行 ratio rule。自然语言比例不参与计算。规则必须覆盖每份主食、蛋白和蔬菜克数、液体、出水修正、基础补充项、份数缩放及取整。

#### 安全与兼容门

模板必须声明肉禽、水产、鸡蛋、豆角等适用的安全终点，并拒绝与时间、形态或锅内流程不兼容的食材。忌口过滤在槽位分配前执行，required extra 仍只允许基础主食、液体、油脂和基础调味。

#### 真实旅程门

每个准备激活的 template 至少有 12 组确定性真实家庭输入，覆盖正常组合、较多食材、反例、支持与不支持的 intent、忌口、换一换、无替代计划及分锅。自动测试通过只允许进入 Preview；production 仍需真人理解测试和实际烹饪反馈。

## 7. 晋升状态与映射契约

`regional-menu-mappings.v1.json` 增加顶层数组 `template_capability_mappings`。每项结构如下：

```json
{
  "family_id": "noodle-braise",
  "template_id": "braised-noodle-pot",
  "region_ids": ["jingjinji", "jinmeng", "shandong", "central_plains"],
  "promotion_status": "blocked_by_ratio",
  "evidence_recipe_ids": [
    "north-china-green-bean-braised-noodles",
    "cabbage-potato-chicken-leg-braised-noodles"
  ],
  "required_ratio_rule_ids": ["braised-noodle-liquid-v1"],
  "resolved_ratio_rule_ids": [],
  "taxonomy_item_ids": ["noodle", "green-beans", "potato", "napa-cabbage", "chicken-generic", "pork-generic", "firm-tofu", "shiitake"],
  "blocker_codes": ["ratio_rule_missing:braised-noodle-liquid-v1"]
}
```

`promotion_status` 只允许：

- `research_only`：只有研究假设；
- `blocked_by_evidence`：技法或地域依据不足；
- `blocked_by_taxonomy`：缺少受控食材语义；
- `blocked_by_ratio`：没有完整的 Ratio DSL；
- `preview_candidate`：所有自动门禁满足，可在 Draft PR/Preview 中验证；
- `covered_by_active_template`：该技法已由现有 active template 表达，无需新增模板。

约束：

- `preview_candidate` 和 `covered_by_active_template` 的 `blocker_codes` 必须为空；
- `preview_candidate` 的 `required_ratio_rule_ids` 与 `resolved_ratio_rule_ids` 必须集合相等，并且必须引用存在的 template、ratio rule、taxonomy item 和 recipe evidence；
- `blocked_*` 必须至少有一个对应 blocker；
- `blocked_by_ratio` 可以声明尚未落地的 `required_ratio_rule_ids`，但不得把它们写入 `resolved_ratio_rule_ids`；
- 新的运行时 template catalog 版本必须递增，使旧 `plan_id` 正确进入 `stale_plan`；
- research-only 文件继续由构建一致性测试证明未进入 `dist/`。

## 8. 第一批能力

### 8.1 `braised-noodle-pot`

当前 template 已声明 `braised-noodle-liquid-v1`，但该规则尚不存在于 Ratio DSL 目录，因此当前状态必须视为 `blocked_by_ratio`。实现阶段先建立并验证这条规则，解除 blocker 后，才可从 `planned/runtime_eligible:false` 晋升为 Draft PR 中的 `active/runtime_eligible:true`。它仍是通用焖面结构，不直接显示为某个省份的固定菜名。

槽位边界：

- required：面条、至少一种耐焖蔬菜；
- optional：最多一种鸡肉、快熟猪肉或老豆腐；最多一种菌菇；
- 允许的蔬菜包括豆角、土豆、白菜和适合焖制的叶菜；
- 排骨、牛腩、牛肉末等特殊或慢熟形态不能进入该模板；
- quick intent 不支持该模板，因为最大时间超过 30 分钟；
- 新增的 `braised-noodle-liquid-v1` 必须为所有锁定食材给出可执行克数和液体量。

预期激活后运行模板为 9 个，仍属于小批量验证范围。

### 8.2 `savory-mixed-rice-pot`

保持 active，不增加新 template。使用江南菜饭研究成果强化：

- 高出水蔬菜数量限制；
- 叶菜、菌菇和蛋白的加入阶段；
- 生米液体比例与蔬菜出水修正；
- 咸肉、香肠、鸡肉等不同形态的兼容边界。

只有食材、技法和比例都满足具体地域结构时，表达层才可使用地域菜名；否则显示“家常焖饭”等普通名称，避免伪造地域身份。

### 8.3 `stew-with-staple-pot`

建立通用结构草案，但保持 `planned/runtime_eligible:false`。它用于承接东北肉菜炖锅与锅内玉米主食、面卷等结构。只有完成以下工作后才能进入下一轮激活审查：

- 玉米主食或面卷的 taxonomy 形态；
- 锅内摆放、蒸汽和吸水 Ratio DSL；
- 排骨、鸡肉、鱼等不同安全终点；
- 主食不浸没、肉类熟透和豆角彻底熟制的流程约束；
- 至少 12 组确定性旅程。

## 9. Planner 行为与排序

本阶段沿用 Pantry Planner V2 的成功承诺：

- `recommend` 可以部分覆盖，但必须列出 `unused_prefer_use` 和原因；
- `pantry` 只有 `unplanned_must_use=[]` 才能返回完整成功；
- 一锅不能合理覆盖时尝试两锅；第三锅仍是特殊路径；
- 当前 plan 只在本次 swap 中硬排除，更早历史只软降权；
- swap 必须重新运行 Planner，不调用 DeepSeek；
- 没有同等承诺的第二个 plan 时返回 `no_alternative_plan`。

候选排序依次比较：

1. 是否满足安全与 template compatibility；
2. pantry 的 must-use 完整覆盖或 recommend 的有效 prefer-use 覆盖；
3. 覆盖项数量与 coverage ratio；
4. intent 时间约束；
5. required extra 数量；
6. 与当前 plan 的结构差异；
7. 更早历史的软降权。

不得为了多样性把较高覆盖的安全方案降到只使用一项的方案之后。三个候选如果都只围绕同一种蛋白，只有在输入中确实不存在其他可靠结构时才允许展示；此时前端必须诚实说明候选受限，而不是伪造差异。

## 10. 真实旅程测试矩阵

### 10.1 焖面核心旅程

| 编号 | mode + intent | 输入 | 必须验证 |
|---|---|---|---|
| N1 | pantry + normal | 面条、豆角、猪肉 | 单锅覆盖 3/3 |
| N2 | pantry + normal | 面条、土豆、豆角 | 单锅覆盖 3/3 |
| N3 | pantry + normal | 面条、白菜、鸡腿 | 单锅覆盖 3/3 |
| N4 | pantry + normal | 面条、香菇、青菜、老豆腐 | 不得只使用一种；优先覆盖 4/4 |
| N5 | pantry + normal | 面条、鸡腿、土豆、白菜 | 不得只使用鸡腿 |
| N6 | recommend + normal | 面条、猪里脊、豆角 | 猪里脊按快熟猪肉进入 protein slot |
| N7 | pantry + normal | 面条、排骨、豆角 | 排骨不得进入快焖结构；未规划项必须解释 |
| N8 | pantry + normal | 面条、牛腩、白菜 | 牛腩不得被当作通用牛肉片 |
| N9 | pantry + normal | 面条、豆角；忌口豆角 | 不得生成含豆角计划 |
| N10 | pantry + quick | 面条、豆角、猪肉 | 不得选择 max time > 30 的焖面模板 |
| N11 | recommend + normal | 面条、白菜、鸡肉 | swap 产生不同有效 plan；没有时返回 `no_alternative_plan` |
| N12 | pantry + normal | 面条、豆角、土豆、白菜、鸡腿、豆腐 | 完整单锅不合理时输出有序多锅或 `needs_user_decision` |

### 10.2 江南菜饭与比例旅程

| 编号 | mode + intent | 输入 | 必须验证 |
|---|---|---|---|
| R1 | pantry + normal | 大米、青菜、香菇 | 生米焖饭覆盖 3/3，液体可执行 |
| R2 | pantry + normal | 大米、白菜、鸡肉 | 覆盖 3/3，禽肉有安全终点 |
| R3 | recommend + normal | 大米、青菜、猪肉 | 允许选最合理组合并解释 unused |
| R4 | pantry + normal | 大米、番茄、白菜、金针菇 | 高出水组合不得盲目全部同锅 |
| R5 | pantry + normal | 熟米饭、青菜、香菇 | 不得命中生米 Ratio DSL |
| R6 | pantry + batch | 大米、青菜、香菇、鸡肉 | 份数缩放、液体和锅容量均有效 |

### 10.3 候选与失败路径

| 编号 | 场景 | 必须验证 |
|---|---|---|
| P1 | 同一输入产生多个候选 | 候选至少在 template、slot assignment 或 pot structure 上不同 |
| P2 | 存在高覆盖和低覆盖候选 | 高覆盖安全候选排在前面 |
| P3 | 只有一个可靠计划 | 返回 `no_alternative_plan`，不显示通用生成失败页 |
| P4 | pantry 有无法识别食材 | 进入 `unplanned_must_use`，状态为 `needs_user_decision` |
| P5 | 接受部分规划 | 保留未处理食材并标记 `partial_accepted` |
| P6 | catalog 版本变化 | 旧计划进入 `stale_plan`，不调用 DeepSeek |

## 11. 验证与发布门禁

实现阶段必须先写失败测试，再修改数据或 Planner。验证顺序：

1. template capability mapping schema 与引用完整性；
2. template catalog、taxonomy、Ratio DSL validator；
3. Planner 纯函数旅程；
4. Worker 与 `ai_proxy.py` parity；
5. `/plan-meal` 保持 0 次 DeepSeek 调用；
6. `/generate-plan` 最多 1 次调用且模型越界被拒绝；
7. 全部现有 Node 测试；
8. `node tools/check-recipes.mjs`；
9. `node tools/run-pantry-planner-v2-journeys.mjs`；
10. Python 语法检查；
11. 两次确定性构建字节一致，并证明地域研究资产未进入 `dist/`。

完成上述自动门禁后也只能更新 Draft PR。Preview 部署需要用户另行授权；production、PR 合并和 recipe 扩充均不在本规格授权范围内。

## 12. 实施拆分

实施计划应按以下顺序拆分，避免同时改动多个不稳定层：

1. 为 capability mapping 写 schema 和失败测试；
2. 写焖面真实旅程失败测试；
3. 补齐焖面 template、Ratio DSL 与必要 taxonomy；
4. 在 Planner active allowlist 中启用焖面并通过纯函数测试；
5. 写江南菜饭水分、形态和生熟主食回归测试；
6. 强化既有菜饭模板，不增加 recipe；
7. 增加东北 `stew-with-staple-pot` planned 草案及验证器测试，但不运行；
8. 运行全量门禁、构建一致性和代码审查；
9. 只更新 Draft PR，等待 Preview 授权与真人验证。

## 13. 完成定义

本阶段完成必须同时满足：

- 72 道 recipe 数量未变化；
- `braised-noodle-pot` 在 Draft PR 中通过全部自动门禁并可被 Planner 确定性选择；
- `savory-mixed-rice-pot` 的水分、形态和生熟主食边界有回归测试；
- `stew-with-staple-pot` 只作为机器可验证的 planned 草案存在；
- 地域技法到 template 的晋升状态可由结构化映射审计；
- 所有核心旅程都检查覆盖内容而不只检查 HTTP 成功；
- Planner 不依赖 DeepSeek 选模板或分配食材；
- 没有 production 部署、PR 合并或未经授权的 recipe 扩充。

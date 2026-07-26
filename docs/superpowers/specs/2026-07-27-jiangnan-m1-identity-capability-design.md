# 江南菜饭 M1 食材身份与条件比例能力设计

日期：2026-07-27

状态：设计已获用户继续执行确认，待按 TDD 实现

适用范围：Draft PR #1 后续工作。本设计恢复江南菜饭菜单与 Pantry Planner V2 之间的受控连接；不新增 recipe，不新增 template，不部署 Preview 或 production，不合并 PR。

相关文档：

- `docs/jiangnan-rice-research.md`
- `docs/superpowers/specs/2026-07-23-pantry-planner-v2-design.md`
- `docs/superpowers/specs/2026-07-27-planner-menu-coverage-audit-design.md`
- `docs/planner-menu-coverage.md`

## 1. 问题与设计结论

当前菜单覆盖审计显示，江南地域映射中的 8 道生产菜单全部存在 taxonomy gap：

| 菜单 | 当前主要缺口 |
|---|---|
| 上海咸肉菜饭 | 咸五花肉、小白菜未识别 |
| 苏州青菜咸肉饭 | 咸五花肉、小白菜未识别 |
| 南京矮脚黄腊肉菜饭 | 腊五花肉、矮脚黄未识别 |
| 南京矮脚黄香肠菜饭 | 矮脚黄未识别 |
| 南京矮脚黄板鸭菜饭 | 熟制板鸭、矮脚黄未识别，且复热边界不足 |
| 金山菜饭 | 小白菜未识别 |
| 畲族乌饭家庭适配版 | 糯米、食品级色粉均未识别，比例边界不足 |
| 平菇焖饭 | 平菇未识别 |

这不是简单的 alias 缺失。现有 `savory-mixed-rice-liquid-v1` 会给所有家常焖饭固定增加食用油和盐，而咸肉、腊肉、腊肠的 recipe evidence 明确要求先观察出油、先尝味，再决定是否补油盐。若只补 alias，Planner 会从“不能规划”变成“能规划但油盐逻辑错误”。

因此 M1 采用三项联合修复：

1. 建立保留地域原名的受控食材 identity；
2. 复用现有通用 `savory-mixed-rice-pot`，不为每道地方菜建立固定模板；
3. 给 Ratio DSL 的基础补充操作增加机器可验证的条件跳过语义，使腌制高盐高脂食材不会被自动补油补盐。

## 2. 范围与非目标

### 2.1 M1 恢复范围

M1 目标是让以下 6 道现有菜单的核心食材能够被当前 Planner 完整放进一个有效锅：

1. `shanghai-salted-pork-vegetable-rice`
2. `suzhou-salted-pork-vegetable-rice`
3. `nanjing-cured-pork-greens-rice`
4. `nanjing-sausage-greens-rice`
5. `jinshan-clay-oven-vegetable-rice`
6. `banshan-wild-rice`

其中 `banshan-wild-rice` 只恢复为“大米 + 平菇”的通用家庭菌菇焖饭能力。产品和审计不得声称 template 复刻了传统“半山野米饭”组合。

### 2.2 明确保留的缺口

M1 不恢复以下 2 道：

- `nanjing-duck-greens-rice`：保留 `包装熟制板鸭（去骨）` 为未识别食材。进入 Planner 前仍需独立确定熟制产品来源、去骨检查、复热终点、附带油脂和盐度处理规则。
- `she-people-black-rice`：保留 `糯米` 与 `食品级黑米色粉` 为未识别食材。不得套用普通精白米水比；不得把项目色粉适配写成传统乌稔叶汁的等价替代。

### 2.3 本轮不做

- recipe 总数保持 72，不新增、删除或改写 recipe；
- template 总数和激活状态不变，不新建“上海咸肉饭模板”等固定菜模板；
- 不修改 recommend/pantry 成功标准、覆盖门槛、多锅上限或换一换策略；
- 不让 DeepSeek决定食材、油盐、液体或安全规则；
- 不把地域文化资料当作已验证的数值比例；
- 不建立完整食物知识图谱；
- 不新增账号、用户画像、营养追踪、云端用户数据或多 Agent 产品能力；
- 不部署，不合并 Draft PR #1。

## 3. 食材身份设计

### 3.1 新增的受控 identity

新增 5 个 pantry identity；每个都保留用户原词与展示身份，同时只在明确兼容的层级复用现有通用能力。

| canonical_id | display_name | canonical_name | category | state | shape | 作用 |
|---|---|---|---|---|---|---|
| `small-bok-choy` | 小白菜 | 青菜 | `leafy_vegetable` | `raw` | `whole` | 允许进入后段叶菜槽 |
| `aijiaohuang-greens` | 矮脚黄 | 青菜 | `leafy_vegetable` | `raw` | `whole` | 保留南京地域叶菜名，复用叶菜熟制节奏 |
| `salted-pork-belly` | 咸五花肉 | 咸肉 | `pork` | `cured` | `cured_slice` | 保留五花部位与腌制状态 |
| `waxed-pork-belly` | 腊五花肉 | 咸肉 | `pork` | `cured` | `cured_slice` | 保留腊制身份，不退化成普通猪肉 |
| `oyster-mushroom` | 平菇 | 无 | `mushroom` | `raw` | `whole` | 独立食用菌身份，不改名为香菇 |

`canonical_name` 只表示规划承诺层级的等价身份，不覆盖 `raw` 和 `display_name`。例如用户输入“矮脚黄”时：

```json
{
  "raw": "矮脚黄",
  "canonical": "青菜",
  "display_name": "矮脚黄",
  "category": "leafy_vegetable",
  "shape_or_cut": "whole",
  "recognized": true
}
```

Planner 去重和覆盖按 `canonical` 计算；槽位、Plan 展示和 DeepSeek输入必须继续携带 `raw` / `display_name`，不得把菜名中的矮脚黄写成普通青菜。

### 3.2 烹饪属性

小白菜和矮脚黄继承叶菜的受控属性：

- `cook_speed: fast`
- `moisture_release: high`
- `texture_behavior.behavior_code: wilts_quickly`
- `best_method_codes: [quick_saute, simmer]`
- `failure_mode_codes: [soft_when_overcooked]`
- `compatible_slot_codes: [vegetable, fast_cooking_vegetable]`

咸五花肉和腊五花肉必须保留：

- `states: [cured]`
- `shape_or_cut: cured_slice`
- `cook_speed: medium`
- `moisture_release: low`
- `texture_behavior.behavior_code: renders_fat_when_heated`
- `failure_mode_codes: [salty_when_overseasoned]`
- `cooking_risk: raw_pork`
- `required_endpoint_codes: [pork_fully_cooked]`
- `compatible_slot_codes: [protein, cured_pork]`
- `incompatible_slot_codes: [quick_cook_protein]`

平菇使用普通市售食用菌边界：

- 不允许野采或身份不明菌菇；
- `category: mushroom`；
- 进入 `mushroom` 槽；
- 必须完全熟制；
- 不与香菇合并 canonical identity。

### 3.3 不允许的归一化

- 咸五花肉、腊五花肉不得归为普通猪肉片；
- 矮脚黄不得改写成上海青或其他具体地方品种；
- 平菇不得改写成香菇；
- 包装熟制板鸭不得归入生鸡肉或普通禽肉；
- 糯米不得归入普通大米；
- 食品级黑米色粉不得归入调味料后静默使用。

## 4. Template 复用边界

M1 只复用 `savory-mixed-rice-pot`：

- 大米进入 `staple`；
- 咸五花肉、腊五花肉、广式腊肠进入 `protein`；
- 小白菜、矮脚黄进入 `fast_vegetable`；
- 平菇进入 `mushroom`；
- 原有 `protein_max:1`、高出水食材上限、后段加叶菜、猪肉熟制终点保持不变。

Template 决定组合能力；recipe 只提供技法、安全、比例和来源 evidence。M1 不根据菜名反推 template，也不先选 recipe 再套 template。

### 4.1 Evidence 标签

恢复后预期审计标签：

| recipe | 预期状态 | 原因 |
|---|---|---|
| 上海咸肉菜饭 | `full_single_pot_evidence_aligned` | template 已直接引用该 recipe |
| 南京香肠菜饭 | `full_single_pot_evidence_aligned` | template 已直接引用该 recipe |
| 苏州青菜咸肉饭 | `full_single_pot_ingredient_compatible` | 能组合，但 template 未直接引用其数值 evidence |
| 南京腊肉菜饭 | `full_single_pot_ingredient_compatible` | 能组合，但比例仍是通用家庭规则 |
| 金山菜饭 | `full_single_pot_ingredient_compatible` | 通用叶菜焖饭能力，不冒充土灶复刻 |
| 平菇焖饭 | `full_single_pot_ingredient_compatible` | 通用菌菇焖饭能力，不冒充传统地域组合 |
| 南京板鸭菜饭 | `taxonomy_gap` | 熟制板鸭边界未建立 |
| 畲族乌饭 | `no_recognized_core` 或保持当前真实缺口 | 糯米与色源均不强行识别 |

不得为了让报告变绿，把后四道 recipe 随意追加到 template 的 `evidence_recipe_ids`。

## 5. Ratio DSL 条件基础补充

### 5.1 当前缺口

`savory-mixed-rice-liquid-v1` 当前包含：

```json
{"operator":"fixed_addition","target":{"name":"食用油","category":"oil"},"grams":{"min":8,"default":10,"max":12}}
{"operator":"scale_by_servings","target":{"name":"盐","category":"seasoning"},"grams":{"min":1,"default":1.5,"max":2}}
```

这会对腊肠、咸肉和腊肉无条件补油盐，与现有 recipe 安全规则冲突。

### 5.2 语法扩展

只为 `fixed_addition` 和 `scale_by_servings` 增加可选的 `skip_when`；不引入表达式字符串、不执行自然语言、不允许任意代码。

```json
{
  "operator": "fixed_addition",
  "target": {"name":"食用油","category":"oil"},
  "grams": {"min":8,"default":10,"max":12},
  "skip_when": {
    "slot_id": "protein",
    "attribute": "texture_behavior",
    "match": "equals",
    "value": "renders_fat_when_heated"
  }
}
```

```json
{
  "operator": "scale_by_servings",
  "target": {"name":"盐","category":"seasoning"},
  "grams": {"min":1,"default":1.5,"max":2},
  "skip_when": {
    "slot_id": "protein",
    "attribute": "texture_failure_modes",
    "match": "contains",
    "value": "salty_when_overseasoned"
  }
}
```

受控字段：

- `slot_id` 必须是当前 template 声明的用户槽位；
- `attribute` 只允许 `texture_behavior | texture_failure_modes`；
- `match` 只允许 `equals | contains`；
- `value` 必须来自 taxonomy validator 的受控词表；
- `equals` 只能匹配标量；`contains` 只能匹配受控字符串数组；
- 任一目标槽食材满足条件时，该基础补充操作跳过；
- 其他食材继续使用原有固定油盐逻辑。

这是向后兼容的受控语法扩展，但 catalog 版本必须从当前 `ratio-rules-v1-20260727-r2` 升级到新的明确版本；template catalog 的引用和全部版本锁定测试同步更新。文件仍保持单一 Ratio DSL 真源，不复制第二套江南比例文件。

### 5.3 编译结果与追踪

被跳过的操作：

- 不得出现在 `required_extra_items`；
- 不得出现在 `ingredient_amounts`；
- 必须写入 `ratio_trace`，例如：

```json
{
  "operator":"scale_by_servings",
  "name":"盐",
  "applied":false,
  "skip_reason":{
    "slot_id":"protein",
    "attribute":"texture_failure_modes",
    "matched_items":["咸五花肉"]
  }
}
```

未被跳过的操作写 `applied:true`。这样调试和前端解释都能区分“遗漏了盐”和“因腌制食材有意不预加盐”。

### 5.4 DeepSeek 边界

`/generate-plan` 接收到的确定计划必须包含编译后的食材克数、允许基础补充项和安全约束。DeepSeek：

- 不得把被 Planner 跳过的食用油或盐重新写成必需食材；
- 可以把确定性约束表述为“先观察出油”“尝味后再决定是否少量补盐”；
- 不得给出新的固定油盐克数；
- 不得替换咸五花肉、腊五花肉、矮脚黄、小白菜或平菇；
- 模型越界时仍由现有生成结果校验拒绝，不自动重试。

M1 不要求调用 DeepSeek 做 Planner 验收；先证明纯函数 plan 和 Ratio DSL 正确。

## 6. 版本与可复现性

以下资产变更必须协同版本化：

- `ingredient-taxonomy.v1.json` 的 `taxonomy_version`；
- `meal-templates.v2.json` 的 `ingredient_taxonomy_version` 与 `template_catalog_version`；
- `ratio-rules.v1.json` 的 `ratio_catalog_version`；
- Worker、proxy、构建依赖图与测试中的版本锁；
- Planner 菜单覆盖报告中的输入 hash 和版本字段。

不改变 Planner 请求的 `schema_version:2`。已有 plan token 若携带旧 catalog 版本，必须按现有逻辑返回 `stale_plan`，不得用新 taxonomy/ratio 静默生成旧计划。

## 7. TDD 验收场景

### 7.1 Identity parity

Worker、`ai_proxy.py` 与前端 pantry identity 对以下输入保持同一受控语义：

1. 小白菜 → canonical 青菜，display 小白菜，叶菜槽；
2. 矮脚黄 → canonical 青菜，display 矮脚黄，叶菜槽；
3. 咸五花肉 → canonical 咸肉，display 咸五花肉，`cured_slice`；
4. 腊五花肉 → canonical 咸肉，display 腊五花肉，`cured_slice`；
5. 平菇 → canonical 平菇，display 平菇，菌菇槽；
6. 包装熟制板鸭（去骨）仍未识别；
7. 糯米仍未识别；
8. 食品级黑米色粉仍未识别。

### 7.2 Planner 真实旅程

每个场景使用 `mode:pantry`、`intent:normal`、`servings:2`：

1. 大米 + 咸五花肉 + 小白菜：单锅 complete，三项全部覆盖；
2. 大米 + 腊五花肉 + 矮脚黄：单锅 complete，三项全部覆盖；
3. 大米 + 广式腊肠 + 矮脚黄：单锅 complete，三项全部覆盖；
4. 大米 + 小白菜：单锅 complete，两项全部覆盖；
5. 大米 + 平菇：单锅 complete，两项全部覆盖；
6. 大米 + 包装熟制板鸭（去骨） + 矮脚黄：不得 complete，板鸭进入 `unplanned_must_use`；
7. 糯米 + 食品级黑米色粉：不得 complete，不得回退普通大米焖饭；
8. 大米 + 咸五花肉 + 小白菜 + 平菇：因两个高出水项超过现有单锅约束，不得伪造单锅全覆盖；按当前 Planner 真实返回多锅或 `needs_user_decision`。

### 7.3 Ratio DSL

1. 大米 + 鸡肉 + 小白菜：保留食用油与盐的基础补充；
2. 大米 + 咸五花肉 + 小白菜：食用油、盐均被机器条件跳过；
3. 大米 + 腊五花肉 + 矮脚黄：食用油、盐均被机器条件跳过；
4. 大米 + 广式腊肠 + 矮脚黄：食用油、盐均被机器条件跳过；
5. 跳过记录包含 `applied:false` 和匹配食材；
6. 未知 attribute、match、value 或 slot 必须被 catalog validator 拒绝；
7. 条件不得影响水量、米量、叶菜量或猪肉熟制终点；
8. 同一 context 重复编译必须字节级稳定。

### 7.4 覆盖审计

重建 `tools/generated/planner-menu-coverage.v1.json` 和 `docs/planner-menu-coverage.md` 后必须断言：

- 72 道 recipe 数量和状态分布不变；
- 上述 6 道不再是 taxonomy gap；
- 上海咸肉菜饭和南京香肠菜饭为直接 evidence 对齐；
- 苏州、南京腊肉、金山、平菇焖饭只为 ingredient compatible；
- 南京板鸭和畲族乌饭仍保留真实缺口；
- 江南汇总不出现“8/8 已复刻”一类错误表述。

## 8. 门禁与完成标准

M1 完成必须同时满足：

1. 先写失败测试，再实现每项行为；
2. taxonomy、template、Ratio DSL validator 全绿；
3. Worker、proxy、前端 pantry identity parity 测试全绿；
4. Planner 真实旅程全绿；
5. 6 道目标菜单的覆盖审计达到本规格预期；
6. 2 道保留缺口没有被 alias、legacy selector 或模型静默绕过；
7. `node tools/check-recipes.mjs` 通过；
8. `node tools/run-pantry-planner-v2-journeys.mjs` 通过；
9. 现有全部 Node 测试通过；
10. `python3 -m py_compile ai_proxy.py` 通过；
11. `node tools/build-dist.mjs` 与构建一致性检查通过；
12. recipe 总数仍为 72，Draft PR #1 仍为 Draft/Open；
13. 不部署 Preview 或 production，不合并。

完成 M1 只表示“Planner 能安全理解这 6 道菜单的核心组合”，不表示真人厨房已经验证口味，也不授权把 `auto_approved` 宣称为人工批准。

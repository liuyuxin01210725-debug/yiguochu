# 陕北红枣豇豆焖饭食材语义 M1 设计

## 1. 背景

全国地域框架已经覆盖 13 个地域块、34 个省级节点和 12 个技法家族。西北现有 3 道生产菜谱；新疆羊肉抓饭能力完成后，2/3 已能被 Planner 完整单锅规划，剩余缺口是 `shaanbei-red-date-cowpea-rice`。

当前覆盖报告把这道菜计算为 66.7%，但其中一个命中是错误的：taxonomy 把裸词“豇豆”作为 `green-beans` 的 alias，得到的是生鲜豆荚、`pod_vegetable` 和中速焖煮语义；陕北研究资料只证明软米或软黄米、红枣、豇豆同锅慢焖的地域结构，没有证明这里的“豇豆”就是生鲜长豆角，也没有证明普通白米、明确豆类商品状态或项目数值。

项目自己的原型还要求记录豇豆品种、红枣去核检查、主粮、液体和实际重量；对应人工旅程仍为 pending。因此本轮不能通过增加一个红枣 alias，把错误的 2/3 变成表面上的 3/3。

## 2. 证据边界

本轮可确认：

1. 米脂及榆林资料支持软米／软黄米、红枣、豇豆的节令焖饭结构；
2. 红枣与豇豆是地域食材组合的一部分；
3. 项目现有条目是普通大米家庭适配版，不得宣称与传统软谷物等价；
4. 项目现有自然语言比例和安全要求可以继续作为待校准记录，但不能自动变成已验证 Ratio DSL。

本轮不能确认：

- 裸词“豇豆”指鲜豆荚、干豆粒还是已经煮熟的豆粒；
- 传统“软米”“软谷米”“软黄米”可统一映射为普通大米或小米；
- 去核是来源事实还是项目物理安全适配；
- 2、3、4 人份红枣、豆类、主粮和液体的可执行克数；
- 豆粒是否需要浸泡、预煮，或浸泡液是否进入总液体；
- 当前 45 分钟家庭流程能否从干豆粒开始完成。

## 3. 方案比较

### 方案 A：只增加红枣 alias

优点是改动最小，覆盖数字会立即提高。缺点是继续把“豇豆”错当生鲜豆角，并让没有机器比例的组合进入生成。拒绝。

### 方案 B：开放通用干果和豆类槽

优点是组合空间最大。缺点是会把红枣、葡萄干、桂圆以及鲜豆荚、干豆粒、熟豆粒混成自由替换，违反受控 taxonomy、Ratio DSL 和显式 substitution 边界。拒绝。

### 方案 C：先做语义纠偏 M1，再以校准门禁进入 M2

先把鲜豆荚、干豆粒、熟豆粒、去核红枣和歧义输入变成机器可解释事实；不改变 template 和 Ratio DSL，不让本轮资产进入生产组合。覆盖账本必须诚实暴露缺口。待 2、3、4 人份真实校准完成后，再单独设计 M2 的可执行槽位和比例。

采用方案 C。

## 4. 成功条件

M1 完成后必须同时成立：

1. “豇豆”不再静默归入生鲜豆角；
2. “鲜豇豆／长豇豆／豇豆角”归入独立的鲜豆荚 identity；
3. “干豇豆”与“熟豇豆”是两个独立状态，不互相 alias；
4. 裸词“豇豆”保留 raw，`recognized:false`，并返回结构化歧义原因和三个可理解的改写选项；
5. “去核红枣／去核大枣”归入同一明确去核 identity；
6. 裸词“红枣／大枣”不得被当作已经去核，返回结构化去核状态歧义；
7. pantry 中任何歧义 must-use 都进入 `unplanned_must_use` 并阻止 `complete`；
8. M1 不修改任何 active template、Ratio rule 或 recipe；
9. `shaanbei-red-date-cowpea-rice` 不得因错误 alias 被标记为完整覆盖，Planner 覆盖不得高于 1/3；
10. 西北完整单锅覆盖继续保持 2/3，不用虚假 3/3 代替真实能力；
11. `/plan-meal` 保持 0 次 DeepSeek，歧义状态下 generation 不允许；
12. 菜谱保持 72 道，template 保持 16 个（10 active + 6 planned）。

## 5. 机器食材身份

### 5.1 鲜豇豆豆荚

新增 `fresh-cowpea-pod`：

```json
{
  "canonical_id": "fresh-cowpea-pod",
  "display_name": "鲜豇豆",
  "aliases": ["长豇豆", "豇豆角"],
  "input_scope": "pantry_input",
  "category": "pod_vegetable",
  "states": ["raw"],
  "shapes_or_cuts": ["whole", "slice"],
  "cook_speed": "medium",
  "moisture_release": "medium",
  "texture_behavior": {
    "behavior_code": "softens_with_simmering",
    "best_method_codes": ["simmer", "braise"],
    "failure_mode_codes": ["firm_when_undercooked"]
  },
  "cooking_risk": {
    "risk_code": "none",
    "required_endpoint_codes": ["bean_fully_cooked"]
  },
  "compatible_slot_codes": ["vegetable"],
  "incompatible_slot_codes": ["dry_legume_required", "cooked_legume_required"]
}
```

现有 `green-beans` 只保留“四季豆”“普通豆角”等自身别名，删除“豇豆”。豆角和鲜豇豆可以共享 `pod_vegetable` 分类和熟透终点，但 canonical identity 不合并。

### 5.2 干豇豆豆粒

新增 `dry-cowpea-seed`：

```json
{
  "canonical_id": "dry-cowpea-seed",
  "display_name": "干豇豆",
  "aliases": ["干豇豆米"],
  "input_scope": "pantry_input",
  "category": "dry_legume",
  "states": ["dry"],
  "shapes_or_cuts": ["whole_seed"],
  "cook_speed": "slow",
  "moisture_release": "low",
  "texture_behavior": {
    "behavior_code": "absorbs_liquid",
    "best_method_codes": ["hydrate", "long_simmer"],
    "failure_mode_codes": ["firm_when_undercooked"]
  },
  "cooking_risk": {
    "risk_code": "raw_legume",
    "required_endpoint_codes": ["legume_fully_cooked"]
  },
  "compatible_slot_codes": ["legume_preparation_input"],
  "incompatible_slot_codes": ["vegetable", "cooked_legume_required"]
}
```

M1 不增加对应 Ratio rule，也没有 active template 接受 `dry_legume` 或 `legume_preparation_input`，因此它只能被识别和解释，不能进入运行时组合。M2 只有在专用 Ratio DSL 同时落地时，才可以给该 identity 增加 `canonical_required`。

### 5.3 熟豇豆豆粒

新增 `cooked-cowpea-seed`：

```json
{
  "canonical_id": "cooked-cowpea-seed",
  "display_name": "熟豇豆",
  "aliases": ["煮熟豇豆"],
  "input_scope": "pantry_input",
  "category": "cooked_legume",
  "states": ["cooked"],
  "shapes_or_cuts": ["whole_seed"],
  "cook_speed": "fast",
  "moisture_release": "medium",
  "texture_behavior": {
    "behavior_code": "reheats_without_breaking",
    "best_method_codes": ["short_simmer"],
    "failure_mode_codes": ["mushy_when_overmixed"]
  },
  "cooking_risk": {
    "risk_code": "none",
    "required_endpoint_codes": ["heated_through"]
  },
  "compatible_slot_codes": ["cooked_legume"],
  "incompatible_slot_codes": ["vegetable", "dry_legume_required"]
}
```

“熟豇豆”只表示用户明确提交的已熟豆粒；Planner 不得把干豇豆自动改成熟豇豆，也不得假定用户已提前处理。

### 5.4 去核红枣

新增 `pitted-dried-jujube`：

```json
{
  "canonical_id": "pitted-dried-jujube",
  "display_name": "去核红枣",
  "aliases": ["去核大枣"],
  "input_scope": "pantry_input",
  "category": "dried_fruit",
  "states": ["dry"],
  "shapes_or_cuts": ["pitted"],
  "cook_speed": "medium",
  "moisture_release": "low",
  "texture_behavior": {
    "behavior_code": "absorbs_liquid",
    "best_method_codes": ["simmer", "braise"],
    "failure_mode_codes": ["tough_when_undercooked"]
  },
  "cooking_risk": {
    "risk_code": "pit_hazard",
    "required_endpoint_codes": ["pit_absent_verified"]
  },
  "compatible_slot_codes": ["dried_fruit_accent"],
  "incompatible_slot_codes": []
}
```

M1 只建立明确去核状态，不把普通“红枣”“大枣”当作去核，也不开放任何 active template 的干果槽。

## 6. 歧义输入结构

taxonomy 顶层新增机器可验证的 `ambiguous_inputs`，不在 Worker、Python 和前端各维护一张散表：

```json
[
  {
    "input": "豇豆",
    "reason_code": "ambiguous_ingredient_state",
    "reason": "“豇豆”可能指鲜豆荚、干豆粒或熟豆粒，请写得更具体。",
    "eligible_items": ["鲜豇豆", "干豇豆", "熟豇豆"]
  },
  {
    "input": "红枣",
    "aliases": ["大枣"],
    "reason_code": "ambiguous_ingredient_state",
    "reason": "红枣是否去核会影响物理安全，请确认后改写为“去核红枣”。",
    "eligible_items": ["去核红枣"]
  }
]
```

Validator 必须保证：

- ambiguity 输入及 alias 与所有 canonical display name／alias 不冲突；
- `eligible_items` 全部精确指向 taxonomy 中可输入的 display name；
- reason code 只能是有限词表中的 `ambiguous_ingredient_state`；
- reason 是有界非空文字，不能包含步骤、克数或模型提示词；
- 同一规范化输入只能出现一次。

## 7. Planner 响应与用户文案

`normalizePlannerItems()` 命中歧义表时返回：

```json
{
  "raw": "豇豆",
  "canonical_id": null,
  "canonical": null,
  "category": null,
  "shape_or_cut": null,
  "recognized": false,
  "ambiguity_code": "ambiguous_ingredient_state",
  "eligible_items": ["鲜豇豆", "干豇豆", "熟豇豆"]
}
```

`unplanned_must_use` 或 `unused_prefer_use` 使用：

```json
{
  "reason_code": "ambiguous_ingredient_state",
  "reason": "“豇豆”可能指鲜豆荚、干豆粒或熟豆粒，请写得更具体。",
  "eligible_items": ["鲜豇豆", "干豇豆", "熟豇豆"]
}
```

pantry 模式出现该原因时：

- 状态为 `needs_user_decision` 或 `no_valid_plan`，不得为 `complete`；
- 已确定 pots 可以保留；
- `generation_allowed:false`；
- 页面显示“需要确认食材状态”，不能显示“系统失败”或“全部安排完成”；
- 用户通过现有“调整食材”返回输入页，原输入保留；M1 不新增选择器或账号状态。

recommend 模式仍可使用其他合理食材，但必须把歧义项放入 `unused_prefer_use` 并显示原因，不得承诺已经使用。

## 8. Recipe、Template 与 Ratio 边界

M1 不修改 `tools/data/recipe-library.json`。现有 72 道 recipe 继续作为技法、安全、比例和来源 evidence，不负责组合能力。

M1 不修改 `meal-templates.v2.json`：

- 不增加“红枣豇豆饭模板”；
- 不向 `savory-mixed-rice-pot` 开放 `dried_fruit`、`dry_legume` 或 `cooked_legume`；
- template 仍为 16 个，10 active + 6 planned；
- template catalog 版本保持 r8。

M1 不修改 `ratio-rules.v1.json`：

- 不让干豇豆借用蔬菜克数；
- 不让去核红枣借用慢蔬菜克数；
- 不从自然语言“130 至 155 克液体”推导可执行规则；
- Ratio catalog 保持 r4。

M2 只有在以下证据齐全后才能另行设计：豆类商品状态固定；2、3、4 人份主粮、豆类、红枣与液体重量完整；是否浸泡及浸泡液去留明确；时间可在当前产品边界内完成；口感和安全结果通过人工记录。

## 9. 覆盖账本语义

覆盖构建器必须从 taxonomy 与 Planner 实际结果派生，不可为地域目标写特例。

实施 M1 后，`shaanbei-red-date-cowpea-rice` 的原始 core 仍是“大米、去核红枣、豇豆”：

- 大米可规划；
- 去核红枣可识别但当前无兼容 active slot；
- 豇豆为状态歧义，不可识别为单一 canonical identity；
- Planner coverage 不得高于 1/3；
- 状态继续是缺口，不得标 `covered`；
- 西北完整单锅覆盖保持 2/3。

菜单总表中“待核实角色”应转移到真正的歧义“豇豆”，而不是继续把“去核红枣”当作完全未知。派生资料只能通过现有构建脚本生成，不手改。

## 10. 版本与迁移

M1 将 taxonomy 从 `taxonomy-v1-20260727-r7` 原子递增到 `taxonomy-v1-20260727-r8`，因为 canonical identity、有限词表和顶层 ambiguity schema 都发生变化。

Template catalog 保持 `templates-v2-20260727-r8`，Ratio catalog 保持 `ratio-rules-v1-20260727-r4`。

旧 plan token 因 taxonomy 版本变化自然进入 `stale_plan`。不得把旧计划中的“豇豆=豆角”静默迁移到新计划。Worker health、Python bridge、构建依赖、部署说明和版本测试必须同步 r8。

前端 `RECIPE_MATCH_NORMALIZATION` 不新增“豇豆”或“红枣”映射。Planner V2 的食材解释以服务端返回的 taxonomy 事实为准；前端只展示结构化原因，不自行猜测。

## 11. 真实旅程

公共 Planner V2 旅程从 108 条增加到 116 条，新增 8 条 `regional_capability`：

1. “鲜豇豆”识别为 `fresh-cowpea-pod`，不等于 `green-beans`；
2. “长豇豆”命中鲜豆荚 identity，同时“豆角”仍命中原 identity；
3. “干豇豆”与“熟豇豆”具有不同 state、cook speed 和 canonical ID；
4. 裸词“豇豆”返回 `ambiguous_ingredient_state` 和三个改写选项；
5. “去核红枣”携带 pitted shape、物理风险和检查终点；
6. 裸词“红枣／大枣”返回去核状态歧义，不得静默命中去核 identity；
7. pantry 输入大米、去核红枣、豇豆，保留已规划 pot，暂停生成并诚实显示未规划原因；
8. recommend 输入大米、去核红枣、豇豆、鸡腿肉，允许选择合理组合，但必须解释红枣和豇豆未使用，且 Planner 和模型调用上限为 0。

另需增加：

- taxonomy validator 正反例；
- Worker/Python byte-semantic parity；
- 前端 `needs_user_decision` 文案与原输入保留测试；
- 覆盖报告中陕北不得超过 1/3、西北保持 2/3；
- 旧 taxonomy token 返回 `stale_plan`；
- 原有豆角、四季豆旅程不回归。

## 12. 成本控制

- `/plan-meal`：0 次 DeepSeek；
- 歧义、无兼容槽、needs_user_decision 和 stale_plan：0 次；
- M1 不新增可生成计划，因此不会增加 DeepSeek 成本；
- 测试只使用本地 Worker/Python bridge，不调用真实模型。

## 13. 非目标

本轮不做：

- 不新增、删除或修改 recipe；
- 不新增或激活 template；
- 不修改 Ratio DSL 数值或操作；
- 不把普通大米宣称为陕北传统软米；
- 不增加自由干果、坚果或豆类替换槽；
- 不自动浸泡、预煮或改写用户食材状态；
- 不增加账号、用户画像、营养追踪、自然语言场景或多 Agent 产品能力；
- 不进行真实 DeepSeek live；
- 不部署 Preview 或 production，不合并 Draft PR #1。

## 14. 验收门禁

实现完成前必须同时通过：

1. 先红后绿的 taxonomy、Planner、Worker/Python parity、前端和覆盖账本测试；
2. 116/116 公共用户旅程；
3. 全部 Node 测试；
4. `node tools/check-foods.mjs`；
5. `node tools/check-recipes.mjs`；
6. `python3 -m py_compile ai_proxy.py`；
7. canonical dist 构建与依赖隔离检查；
8. 菜谱仍为 72 道，template 仍为 16 个（10 active + 6 planned），Ratio rule 数量不变；
9. 覆盖账本不再把“豇豆”错误计为生鲜豆角命中；
10. Draft PR #1 保持 Draft、未合并、未部署；
11. 不声称 M1 已恢复陕北红枣豇豆饭运行能力、人工试吃或人工批准。

## 15. M2 入口

M1 通过后不自动进入 M2。只有结构化校准记录证明一个明确家庭版本可执行，才设计以下内容：

1. 选定普通大米家庭适配或独立软黄米 identity，展示名明确标“家庭适配”；
2. 固定使用干豇豆还是熟豇豆，不接受裸词；
3. 为红枣、豆类、主粮和液体建立 canonical-scoped Ratio DSL；
4. 决定使用现有 composable template 的受控槽，或证明需要一个跨地域可复用的“谷物＋熟豆＋果干”结构；
5. 通过 2、3、4 人份真实厨房记录后，才恢复该组合的完整规划。

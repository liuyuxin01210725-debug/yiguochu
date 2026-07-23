# Pantry Planner V2 产品契约与确定性规划器设计

日期：2026-07-23

状态：设计已确认，待实施计划

适用范围：Draft PR #1；本规格本身不授权部署 Preview、production 或合并 PR

## 1. 背景与目标

当前产品把“直接推荐”和“清库存”压在同一个菜谱选择模型里。固定菜谱可以提供可信技法和安全边界，但无法覆盖家庭冰箱中不断变化的组合。结果是：用户提交多种食材后，系统可能只使用一项；“换一换”可能只是换文案，或者因为历史硬排除而耗尽候选。

V2 的目标是建立明确的产品承诺：

- `recommend` 模式帮助用户决定吃什么，输入食材是 `prefer_use`，允许部分使用，但必须诚实解释使用和未使用项。
- `pantry` 模式帮助用户清库存，输入食材是 `must_use`；只有完整计划覆盖全部去重输入时才算成功。
- 规划由确定性 template rules 与受控 ingredient taxonomy 完成。
- DeepSeek 不再决定基础组合，只负责把已经锁定的计划表达成菜名、自然步骤和推荐理由。
- 现有 72 道 recipe 继续作为技法、安全、比例和来源证据，不再作为用户组合空间的唯一上限。

## 2. 非目标

本阶段不做：

- 新增固定 recipe；
- 大规模扩充菜谱库；
- 完整食物知识图谱；
- 账号、云端用户数据、用户画像；
- 营养追踪或长期饮食记录；
- 多 Agent 规划；
- 自动联网抓取模板或食材关系；
- 让 LLM 自由决定食材组合、替换、克数或安全规则。

## 3. 核心术语与权责

### 3.1 Recipe

`recipe` 是现有 72 道可信菜谱：

- 提供技法证据；
- 提供熟制与食品安全证据；
- 提供液体、比例和时间依据；
- 提供可追溯来源；
- 在渐进迁移期间可作为 `recommend` 的明确 legacy fallback。

Recipe evidence **不决定组合能力**。某道 recipe 没有出现一个组合，不代表 planner 不能用 template 与 taxonomy 规划该组合。

### 3.2 Template

`template` 是不直接展示给用户的可组合规划结构：

- 定义 required/optional slots；
- 定义食材类别、烹饪属性和形态如何进入槽位；
- 定义兼容、不兼容、烹饪顺序、液体、比例、时间与安全边界；
- 通过 `evidence_recipe_ids` 引用 recipe evidence；
- 不包含固定成品菜名或完整自然语言步骤。

禁止把模板设计成“番茄牛肉饭模板”“番茄鸡蛋饭模板”。允许的结构是 `acid-staple-pot`、`broth-noodle-pot`、`poultry-staple-pot` 等。

### 3.3 Ingredient taxonomy

Taxonomy 是第一阶段约 60 种家庭高频食材及常见别名的受控表。它不是知识图谱，也不替代营养数据库。它承担：

- canonical identity；
- category；
- raw/prepared state；
- shape/cut；
- cook speed；
- moisture release；
- texture behavior；
- cooking risk；
- template slot compatibility。

最终组合能力由 **template rules + ingredient taxonomy** 决定。Recipe 只提供证据。

## 4. 系统分层

```text
原始请求
→ V1/V2 请求适配
→ 食材身份、角色与烹饪属性归一化
→ Template 候选与槽位绑定
→ 单锅/多锅确定性规划
→ 覆盖与安全校验
→ 返回可解释 plan
→ 用户确认或做出决策
→ /generate-plan 服务端重算并核对 plan
→ 单次 DeepSeek 表达
→ 模型越界校验
→ 服务端合并锁定食材、权威营养与自然语言步骤
```

边界：

- Worker 是线上 planner 权威实现。
- `ai_proxy.py` 镜像同一算法，并由 parity 测试锁定。
- 前端提交原始输入、展示状态和操作，不自行决定覆盖或模板绑定。
- Template catalog 与 taxonomy 是共享机器数据。
- `/plan-meal` 永远不调用 DeepSeek。
- `/generate-plan` 不信任前端传回的裸 `plan_id`，必须重算。

## 5. V2 请求契约

### 5.1 `/plan-meal`

```json
{
  "schema_version": 2,
  "planner_version": "pantry-planner-v2",
  "constraints": {
    "mode": "pantry",
    "intent": "quick",
    "servings": 2,
    "must_use": ["番茄", "金针菇", "鸡蛋", "西兰花"],
    "prefer_use": [],
    "dislikes": [],
    "recent_plan_ids": [],
    "current_plan_id": null,
    "decision": null
  }
}
```

枚举：

- `mode`: `recommend | pantry`
- `intent`: `normal | quick | fresh | batch`

两层正交，必须支持 `pantry+quick`、`pantry+batch`、`recommend+fresh` 等组合。

角色规则：

- `recommend` 主要使用 `prefer_use`。
- `pantry` 主要使用 `must_use`。
- 同一 canonical item 同时出现在两者时，`must_use` 优先。
- “放宽一种食材”把用户明确指定的 item 从 `must_use` 移入 `prefer_use`，mode 仍为 `pantry`。
- `current_plan_id` 只在本次换一换中硬排除。
- `recent_plan_ids` 只做软降权。

结构化 decision：

```json
{
  "action": "relax_item",
  "item": "西兰花"
}
```

```json
{
  "action": "accept_partial",
  "plan_id": "pln_v2_xxx",
  "acknowledged_unplanned": ["西兰花"]
}
```

```json
{
  "action": "allow_third_pot",
  "plan_id": "pln_v2_xxx"
}
```

### 5.2 `/generate-plan`

```json
{
  "schema_version": 2,
  "planner_version": "pantry-planner-v2",
  "template_catalog_version": "templates-2026-01",
  "plan_id": "pln_v2_xxx",
  "plan_request": {
    "constraints": {
      "mode": "pantry",
      "intent": "quick",
      "servings": 2,
      "must_use": ["番茄", "金针菇", "鸡蛋", "西兰花"],
      "prefer_use": [],
      "dislikes": [],
      "decision": null
    }
  }
}
```

服务端必须用 `plan_request` 重跑 planner，再核对版本、状态与 `plan_id`。`plan_id` 是一致性标识，不是授权凭证。

## 6. 归一化输出

每个原始输入都进入 `normalized_items`：

```json
{
  "raw": "牛里脊肉",
  "canonical": "牛肉",
  "category": "beef",
  "shape_or_cut": "tenderloin",
  "cook_speed": "fast",
  "moisture_release": "low",
  "texture_behavior": "tender_when_quick_cooked",
  "cooking_risk": "raw_beef",
  "recognized": true,
  "role": "must_use",
  "duplicate_of": null
}
```

未识别项：

```json
{
  "raw": "未知食材",
  "canonical": null,
  "category": null,
  "shape_or_cut": null,
  "cook_speed": null,
  "moisture_release": null,
  "texture_behavior": null,
  "cooking_risk": "unknown",
  "recognized": false,
  "role": "must_use",
  "duplicate_of": null
}
```

去重后的 item 用于覆盖分母和分配；原始条目全部保留用于解释和排查。没有数量输入时，一个去重食材只能分配到一个 pot。

## 7. Ingredient taxonomy 机器结构

```json
{
  "taxonomy_version": "taxonomy-2026-01",
  "items": [
    {
      "canonical_id": "beef-generic",
      "display_name": "牛肉",
      "aliases": ["牛肉片", "牛柳", "牛里脊", "牛里脊肉"],
      "category": "beef",
      "states": ["raw"],
      "shapes_or_cuts": ["slice", "dice", "tenderloin"],
      "cook_speed": "fast",
      "moisture_release": "low",
      "texture_behavior": {
        "behavior_code": "tender_when_quick_cooked",
        "best_method_codes": ["quick_saute", "short_simmer"],
        "failure_mode_codes": ["tough_when_overcooked"]
      },
      "cooking_risk": {
        "risk_code": "raw_beef",
        "required_endpoint_codes": ["beef_fully_cooked"]
      },
      "compatible_slot_codes": ["generic_beef", "quick_cook_protein"],
      "incompatible_slot_codes": ["brisket_required", "ground_meat_required"]
    }
  ]
}
```

受控枚举第一阶段包括：

- `cook_speed`: `no_cook | fast | medium | slow`
- `moisture_release`: `low | medium | high`
- shape/cut：`whole | slice | dice | shred | ground | tenderloin | breast | leg | rib | brisket`
- texture behavior codes：软嫩、耐炖、易碎、吸水、出水、久煮变柴、久煮软化等有限枚举；
- cooking risk codes：`none | raw_egg | raw_poultry | raw_pork | raw_beef | raw_seafood | unknown`。

Template 匹配不能只看“蛋白/蔬菜”。例如：

- 牛里脊与牛腩 category 相同，但 cook speed、shape/cut、texture behavior 不同；
- 嫩豆腐与老豆腐 category 相近，但 texture behavior 与可用烹饪阶段不同；
- 番茄和高含水叶菜都会出水，但 moisture release 对焖饭比例的影响不同；
- 鸡腿和鸡胸都属于 poultry，但适合的时间与口感边界不同。

## 8. Template catalog Schema

```json
{
  "schema_version": 1,
  "template_catalog_version": "templates-2026-01",
  "ingredient_taxonomy_version": "taxonomy-2026-01",
  "templates": [
    {
      "template_id": "acid-staple-pot",
      "activation_status": "active",
      "required_slots": [
        {
          "slot_id": "acid_base",
          "min_items": 1,
          "max_items": 1,
          "source_policy": ["user"],
          "accepts_categories": ["acid_vegetable"]
        },
        {
          "slot_id": "staple",
          "min_items": 1,
          "max_items": 1,
          "source_policy": ["user", "basic_extra"],
          "accepts_categories": ["raw_rice", "cooked_rice", "noodle"]
        }
      ],
      "optional_slots": [
        {
          "slot_id": "protein",
          "min_items": 0,
          "max_items": 1,
          "source_policy": ["user"],
          "accepts_slot_codes": ["quick_cook_protein", "egg", "firm_tofu", "soft_tofu"]
        },
        {
          "slot_id": "vegetable",
          "min_items": 0,
          "max_items": 2,
          "source_policy": ["user"],
          "accepts_categories": ["leafy_vegetable", "cruciferous_vegetable", "root_vegetable"]
        },
        {
          "slot_id": "mushroom",
          "min_items": 0,
          "max_items": 1,
          "source_policy": ["user"],
          "accepts_categories": ["mushroom"]
        }
      ],
      "slot_limits": {
        "total_user_items_min": 1,
        "total_user_items_max": 5,
        "protein_max": 1,
        "vegetable_max": 2,
        "mushroom_max": 1
      },
      "ingredient_categories": {
        "acid_base": ["acid_vegetable"],
        "staple": ["raw_rice", "cooked_rice", "noodle"],
        "protein": ["egg", "firm_tofu", "soft_tofu", "beef", "chicken", "pork"],
        "vegetable": ["leafy_vegetable", "cruciferous_vegetable", "root_vegetable"],
        "mushroom": ["mushroom"]
      },
      "compatibility_rules": [
        {
          "rule_code": "raw_rice_requires_braise_or_simmer",
          "when": {"slot_id": "staple", "category": "raw_rice"},
          "requires_cooking_mode": ["braise", "simmer"]
        }
      ],
      "incompatible_rules": [
        {
          "rule_code": "excess_moisture_with_raw_rice",
          "when": {"slot_id": "staple", "category": "raw_rice"},
          "forbids_attribute_count": {
            "attribute": "moisture_release",
            "value": "high",
            "greater_than": 1
          }
        }
      ],
      "shape_or_cut_requirements": [
        {
          "slot_id": "protein",
          "category": "beef",
          "allowed_shapes": ["slice", "dice", "tenderloin"],
          "forbidden_shapes": ["brisket", "ground"]
        }
      ],
      "cooking_order": [
        {"phase": 1, "action_code": "protein_pretreat", "slot_ids": ["protein"]},
        {"phase": 2, "action_code": "acid_base_cookdown", "slot_ids": ["acid_base"]},
        {"phase": 3, "action_code": "add_staple_and_liquid", "slot_ids": ["staple"]},
        {"phase": 4, "action_code": "add_fast_cooking_items", "slot_ids": ["vegetable", "mushroom"]},
        {"phase": 5, "action_code": "reach_safety_endpoints", "slot_ids": ["protein"]}
      ],
      "ratio_constraints": ["acid-staple-raw-rice-liquid-v1"],
      "liquid_constraints": {
        "allowed_categories": ["water", "approved_stock"],
        "max_liquid_types": 1,
        "must_be_measured": true,
        "retained_in_finished_meal": true
      },
      "safety_endpoints": [
        {"applies_to_category": "chicken", "endpoint_code": "poultry_fully_cooked_no_pink"},
        {"applies_to_category": "egg", "endpoint_code": "egg_fully_set"}
      ],
      "time_range": {"min_minutes": 20, "max_minutes": 45},
      "supported_intents": ["normal", "fresh", "batch"],
      "evidence_recipe_ids": ["jollof-rice", "tomato-egg-stewed-leftover-rice", "tomato-tofu-stewed-rice"]
    }
  ]
}
```

Validator 必须拒绝：

- 未知 category、attribute、slot、rule operator 或 endpoint；
- `min_items > max_items`；
- required slot 无接受类别；
- 非基础类别使用 `basic_extra`；
- active quick template 的最大时间超过 30 分钟；
- 比例上下限颠倒或单位不兼容；
- evidence recipe ID 不存在；
- 模板包含成品菜名、完整自然语言步骤或可执行表达式；
- shape/cut 与 taxonomy 冲突；
- active template 缺少必要 Ratio DSL 覆盖。

逻辑条件只允许有限枚举：`requires`、`requires_any`、`forbids`、`forbids_attribute_count`、`allowed_shapes`、`forbidden_shapes`。

## 9. Ratio DSL

### 9.1 目的

Planner 负责克数、液体量和比例，就不能继续让 LLM 解释 recipe 中的自然语言 `ratio_rules`。Ratio DSL 是模板激活的前置条件。

现有 recipe 自然语言比例继续作为 evidence 保留，但不是可执行规则。每条 active template 所需比例必须经过人工转写和复核后进入 DSL。

### 9.2 允许的操作符

- `per_serving`：按份数计算某槽位克数；
- `ratio`：两个资源之间的数值比例；
- `bounded_sum`：某类别总量上下限；
- `fixed_addition`：基础调味或油脂的固定范围；
- `scale_by_servings`：经审核的基准量随份数线性缩放。

禁止任意字符串表达式、`eval`、动态脚本或交给 LLM 解释。

### 9.3 示例

```json
{
  "ratio_dsl_version": 1,
  "rules": [
    {
      "rule_id": "acid-staple-raw-rice-liquid-v1",
      "evidence_recipe_ids": ["jollof-rice", "tomato-tofu-stewed-rice"],
      "when": {
        "template_id": "acid-staple-pot",
        "slot_id": "staple",
        "category": "raw_rice"
      },
      "operations": [
        {
          "operator": "per_serving",
          "target": {"slot_id": "staple"},
          "grams": {"min": 80, "default": 100, "max": 120}
        },
        {
          "operator": "ratio",
          "numerator": {"resource": "retained_liquid_grams"},
          "denominator": {"slot_id": "staple", "measure": "grams"},
          "min": 1.0,
          "default": 1.2,
          "max": 1.4
        },
        {
          "operator": "bounded_sum",
          "target": {"attribute": "moisture_release", "value": "high"},
          "grams_per_serving": {"min": 80, "default": 120, "max": 160}
        }
      ],
      "rounding": {"grams_to_nearest": 5}
    }
  ]
}
```

### 9.4 执行与校验

Planner 先计算食材槽位克数，再计算食材自身出水对保留液体的调整，最后生成锁定的液体量。调整顺序也是 DSL 版本的一部分。

每条 rule 必须：

- 指向已存在 template、slot、category 和 evidence recipe；
- 有统一单位；
- 有 `min <= default <= max`；
- 对 active template 的 required staple 和 retained liquid 提供完整覆盖；
- 产出确定性结果；
- 经过 fixture 测试锁定边界值。

模板若缺少所需 Ratio DSL，只能保持 `planned`，不得设为 `active`。

## 10. 首批模板与启用节奏

规格保留 15 个规划模板，但第一阶段只启用 8 个。

### 10.1 第一批 active 8 个

| template_id | 家庭场景 | 主要 evidence recipes |
|---|---|---|
| `acid-staple-pot` | 酸味底与米饭、剩饭或面组合 | `jollof-rice`、`tomato-tofu-stewed-rice` |
| `savory-mixed-rice-pot` | 家常蛋白、蔬菜、米同锅焖 | `simple-chicken-biryani`、`taiwan-cabbage-mushroom-rice` |
| `cooked-rice-stir-pot` | 剩米饭炒饭或烩饭 | `home-egg-fried-leftover-rice`、`broccoli-beef-fried-rice` |
| `broth-noodle-pot` | 蔬菜、蛋白、面条汤锅 | `greens-chicken-leg-soup-noodles`、`greens-tofu-soup-noodles` |
| `egg-tofu-vegetable-pot` | 鸡蛋或豆腐与蔬菜的软嫩锅 | `shakshuka-tomato-egg`、`greens-tofu-vermicelli-pot` |
| `mushroom-vegetable-stew-pot` | 菌菇与多蔬菜炖煮 | `soy-lentil-vegetable-stew`、`mushroom-greens-tofu-covered-rice` |
| `beef-staple-pot` | 牛肉部位与主食结构 | `broccoli-beef-braised-rice`、`broccoli-beef-soup-noodles` |
| `poultry-staple-pot` | 鸡胸、鸡腿等禽肉结构 | `simple-chicken-biryani`、`chicken-leg-potato-braised-rice` |

### 10.2 后续 planned 7 个

- `mushroom-aroma-rice-pot`
- `broth-rice-pot`
- `braised-noodle-pot`
- `curry-staple-pot`
- `pork-staple-pot`
- `soft-family-rice-pot`
- `quick-breakfast-pot`

这 7 个保留 schema 和证据规划，但第一阶段不参加候选生成。只有真实旅程暴露覆盖缺口、Ratio DSL 完成且安全校验通过后，才逐个启用。

## 11. Plan 响应契约

```json
{
  "schema_version": 2,
  "planner_version": "pantry-planner-v2",
  "template_catalog_version": "templates-2026-01",
  "status": "needs_user_decision",
  "generation_allowed": false,
  "mode": "pantry",
  "intent": "quick",
  "normalized_items": [],
  "plan": {
    "plan_id": "pln_v2_xxx",
    "plan_kind": "multi_pot",
    "planned_must_use": ["番茄", "金针菇", "鸡蛋", "西兰花"],
    "planned_prefer_use": [],
    "unplanned_must_use": [
      {
        "raw": "未知食材",
        "canonical": null,
        "reason_code": "unrecognized_ingredient",
        "reason": "暂时无法识别这种食材，因此不能承诺已经安排。"
      }
    ],
    "unused_prefer_use": [],
    "required_extra_items": ["大米", "面条", "水", "食用油", "盐"],
    "coverage_ratio": 0.8,
    "recognition_ratio": 0.8,
    "recognized_coverage_ratio": 1,
    "rejection_reason": {
      "reason_code": "unrecognized_ingredient",
      "message": "存在暂时无法识别的清库存食材。"
    },
    "pots": [
      {
        "meal_sequence": 1,
        "label": "第一锅",
        "servings": 2,
        "template_id": "savory-mixed-rice-pot",
        "planned_must_use": ["鸡蛋", "西兰花"],
        "planned_prefer_use": [],
        "required_extra_items": ["大米", "水", "食用油", "盐"],
        "remaining_must_use_after": ["番茄", "金针菇"]
      },
      {
        "meal_sequence": 2,
        "label": "第二锅",
        "servings": 2,
        "template_id": "acid-staple-pot",
        "planned_must_use": ["番茄", "金针菇"],
        "planned_prefer_use": [],
        "required_extra_items": ["面条", "水", "盐"],
        "remaining_must_use_after": []
      }
    ]
  },
  "unplanned": [
    {
      "raw": "未知食材",
      "canonical": null,
      "reason_code": "unrecognized_ingredient",
      "reason": "暂时无法识别这种食材，因此不能承诺已经安排。"
    }
  ],
  "actions": [
    {
      "action": "relax_item",
      "label": "放宽一种食材",
      "eligible_items": ["未知食材"],
      "requires_acknowledgement": true,
      "unplanned_items": ["未知食材"]
    },
    {
      "action": "edit_ingredients",
      "label": "调整食材",
      "eligible_items": [],
      "requires_acknowledgement": false,
      "unplanned_items": ["未知食材"]
    },
    {
      "action": "accept_partial",
      "label": "接受部分规划",
      "eligible_items": [],
      "requires_acknowledgement": true,
      "unplanned_items": ["未知食材"]
    }
  ]
}
```

`required_extra_items` 在 template planner 第一阶段只能包含：

- 基础主食；
- 液体；
- 油脂；
- 基础调味。

它不能包含豆腐、鸡蛋、肉类、菌菇或蔬菜等新的主要食材，也不能计入 pantry 覆盖率。

## 12. 覆盖率

```text
coverage_ratio
= 已规划 must_use 数量 ÷ 用户提交的全部去重 must_use 数量

recognition_ratio
= 已识别 must_use 数量 ÷ 用户提交的全部去重 must_use 数量

recognized_coverage_ratio
= 已规划且已识别 must_use 数量 ÷ 已识别 must_use 数量
```

分母为零时返回 `0`。未识别食材仍计入 `coverage_ratio` 分母、进入 `unplanned` 并阻止 `complete`。

Pantry 单锅候选门槛：

| must_use 数量 | 单锅候选最低覆盖 | pantry 完整成功 |
|---:|---:|---:|
| 1 | 1/1 | 1/1 |
| 2 | 2/2 | 2/2 |
| 3 | 至少 2/3 | 最终仍须 3/3 |
| 4–6 | 至少 60% | 最终仍须 100% |
| 7 以上 | 不作为最终单锅展示 | 进入多锅规划 |

Recommend 有输入时原则上至少使用一项可识别 `prefer_use`，优先提高覆盖，但不承诺全部使用。每个 unused prefer item 必须有结构化原因，例如：

- `lower_compatibility`
- `would_break_ratio`
- `exceeds_slot_limit`
- `time_constraint`
- `texture_conflict`

## 13. 单锅与多锅规划算法

不建设完整数学优化器。第一版使用有界枚举：

1. 生成通过 category、烹饪属性、shape/cut、安全、时间和 Ratio DSL 的候选 pot。
2. 按 must-use 覆盖、安全余量、时间余量、required extras 数量排序。
3. 先尝试 1 锅完整覆盖。
4. 再尝试 2 锅组合完整覆盖。
5. 默认 UI 最多展示 2 锅。
6. 仅在 1/2 锅无法完整覆盖时检查 3 锅是否可行。
7. 如果只有 3 锅能完整覆盖，返回 `needs_user_decision`、`generation_allowed:false` 和结构化 `allow_third_pot` 动作；默认不直接给用户三个任务。
8. 用户明确接受第三锅后重新规划，才返回含 3 锅的 `complete`。
9. 3 锅仍无法覆盖时返回 `plan_capacity_exceeded`。

在用户确认前，第三锅不进入 `plan.pots`；响应只通过 `allow_third_pot` action 告知 `potential_full_coverage:true` 与 `additional_meals:1`。这样页面默认仍只展示最多两顿任务。用户确认后，重新规划响应才把第三锅加入 `pots`。

```json
{
  "action": "allow_third_pot",
  "label": "需要第三锅才能全部安排",
  "eligible_items": [],
  "requires_acknowledgement": true,
  "unplanned_items": ["第三锅待安排的食材"],
  "potential_full_coverage": true,
  "additional_meals": 1
}
```

多锅规则：

- 最多 3 锅；
- 每锅是一顿独立主餐；
- 每锅单独返回 `servings` 与 `meal_sequence`；
- 无数量输入时，同一去重食材只能属于一锅；
- 某一锅可以只承担一个 must-use，但只能作为完整多锅计划的一部分，不能作为低覆盖单锅备选；
- `quick` 要求每一锅均不超过 30 分钟；
- 完整覆盖优先于锅数、历史和多样性。

排序采用分层比较，不用一个权重总分越过硬约束。

Pantry 排序：完整覆盖 → unplanned 更少 → coverage 更高 → 锅更少 → required extras 更少 → intent 更匹配 → 安全/时间余量 → 历史软降权 → 稳定 plan ID。

Recommend 排序：至少使用一项 → prefer 覆盖更多 → 组合/口感更合理 → required extras 更少 → intent 匹配 → unused 原因更弱 → 历史软降权 → 稳定 plan ID。

## 14. 状态机

```text
planning
├ ready
├ complete
├ needs_user_decision
│  ├ relax_item → planning
│  ├ edit_ingredients → 输入页
│  ├ accept_partial → partial_accepted
│  └ allow_third_pot → planning
├ partial_accepted
├ no_alternative_plan
├ no_valid_plan
└ stale_plan
```

| 状态 | generation_allowed | 页面承诺 |
|---|---:|---|
| `ready` | true | 直接推荐方案 |
| `complete` | true | 完整清库存计划 |
| `needs_user_decision` | false | 还有食材没有安排 |
| `partial_accepted` | true | 部分处理方案 |
| `no_alternative_plan` | false | 当前组合只有一个可靠的一锅方案 |
| `no_valid_plan` | false | 当前条件下没有可靠计划 |
| `stale_plan` | false | 计划规则已变化，需要重新规划 |

只有 `unplanned=[]` 且 pantry `coverage_ratio=1` 时才能返回 `complete`。

`needs_user_decision` 必须保留已确定的 pots，只暂停生成，不调用 DeepSeek。

`partial_accepted` 必须继续展示未处理食材，不显示“全部安排完成”，也不计为 pantry 完整成功。

结构化 action：

```json
{
  "action": "accept_partial",
  "label": "接受部分规划",
  "eligible_items": [],
  "requires_acknowledgement": true,
  "unplanned_items": ["西兰花"]
}
```

未规划 reason codes：

- `unrecognized_ingredient`
- `no_compatible_slot`
- `incompatible_combination`
- `unsupported_shape_or_cut`
- `allergen_conflict`
- `safety_constraint`
- `time_constraint`
- `plan_capacity_exceeded`
- `third_pot_required`

## 15. Plan ID

格式：

```text
pln_v2_<base64url-sha256>
```

Hash 只包含：

- `planner_version`
- `template_catalog_version`
- `template_id`
- `normalized_items`
- `slot_assignment`
- `pots`
- `required_extra_items`
- `mode`
- `intent`

Pot 按 `meal_sequence` 排序；slot 按 `slot_id` 排序；同槽食材按 canonical identity 排序；required extras 按 category 与 canonical 排序；JSON 键顺序固定。Servings、比例、液体与安全约束作为 pot 的规范化内容参与 hash。

不包含菜名、推荐文案、步骤或 UI 文案。相同计划重新生成不同文字时 plan ID 不变；模板、分锅、槽位或食材变化时 plan ID 必须变化。

## 16. 换一换

换一换只运行 planner，不调用 DeepSeek。

优先级：

1. 同食材、不同 template；
2. 同 template、不同 slot assignment、单/多锅结构或 pot 顺序；
3. 无同等承诺方案时返回 `no_alternative_plan`，等待用户主动放宽。

不同 plan 至少满足一项：

- template ID 不同；
- slot assignment 不同；
- 单锅/多锅结构不同；
- pot 顺序不同。

只改变菜名、描述或步骤不算不同计划。

当前 `plan_id` 在本次 swap 硬排除；更早 `recent_plan_ids` 最多 20 项、保留 7 天，只按时间和距离软降权，不能令候选失去资格。

承诺边界：

- pantry complete 只能换成另一个 100% 覆盖 plan；
- partial accepted 不能新增未处理食材；
- recommend 仍须使用至少一项可识别输入并诚实展示 unused。

无第二计划时返回：

```json
{
  "status": "no_alternative_plan",
  "code": "no_alternative_plan",
  "generation_allowed": false,
  "message": "当前组合只有一个可靠的一锅方案",
  "actions": [
    {
      "action": "relax_item",
      "label": "放宽一种食材",
      "eligible_items": ["西兰花"],
      "requires_acknowledgement": true,
      "unplanned_items": []
    },
    {
      "action": "force_multi_pot",
      "label": "分成两锅",
      "eligible_items": [],
      "requires_acknowledgement": false,
      "unplanned_items": []
    },
    {
      "action": "edit_ingredients",
      "label": "返回修改食材",
      "eligible_items": [],
      "requires_acknowledgement": false,
      "unplanned_items": []
    }
  ]
}
```

前端保留原 plan 和原输入，不显示通用失败页。

## 17. DeepSeek 输入输出边界

### 17.1 Planner 锁定的输入

```json
{
  "plan_id": "pln_v2_xxx",
  "mode": "pantry",
  "intent": "quick",
  "meals": [
    {
      "meal_sequence": 1,
      "servings": 2,
      "template_id": "acid-staple-pot",
      "locked_ingredients": [
        {
          "ingredient_ref": "i1",
          "raw_name": "番茄",
          "canonical": "番茄",
          "slot_id": "acid_base",
          "planned_grams": 240
        },
        {
          "ingredient_ref": "i2",
          "raw_name": "牛里脊",
          "canonical": "牛肉",
          "shape_or_cut": "tenderloin",
          "slot_id": "protein",
          "planned_grams": 220
        },
        {
          "ingredient_ref": "e1",
          "raw_name": "大米",
          "canonical": "大米",
          "slot_id": "staple",
          "planned_grams": 200,
          "source": "basic_extra"
        }
      ],
      "cooking_order": [],
      "ratio_constraints": [],
      "liquid_constraints": {},
      "safety_endpoints": []
    }
  ]
}
```

DeepSeek 不能决定 template、slots、must-use 使用/删除、替换、required extras、克数、液体、时间或安全规则。

### 17.2 模型允许输出

```json
{
  "plan_id": "pln_v2_xxx",
  "meals": [
    {
      "meal_sequence": 1,
      "dish_name": "番茄牛里脊焖饭",
      "ingredient_refs": ["i1", "i2", "e1"],
      "steps": [
        {
          "order": 1,
          "text": "牛里脊切片，番茄切块。",
          "ingredient_refs": ["i1", "i2"],
          "completed_safety_endpoints": []
        }
      ],
      "recommendation_reason": "番茄提供酸甜底味，牛里脊适合短时间加热。"
    }
  ]
}
```

最终食材行、克数、营养和 plan metadata 全部由服务端提供；模型只提供菜名、步骤、理由和核验 refs。

## 18. 模型越界校验

服务端检查：

1. plan ID 完全一致；
2. meal 数量与顺序一致；
3. 每锅 ingredient refs 集合完全相同；
4. 不缺少 planned ingredient；
5. 不新增主要食材或未规划调味；
6. 每个食材在步骤中出现；
7. 原始部位和形态保留；
8. cooking order 关键阶段不颠倒；
9. 液体种类与数值不越界；
10. 时间不超过 template 与 intent；
11. 高风险食材达到安全终点；
12. 不新增第二口锅或跨 meal 混料。

模型把牛里脊换成牛腩、金针菇换成香菇、鸡腿换成鸡胸，均为越界。

越界返回 `model_contract_violation`，不自动重试。只有用户主动重新生成才产生下一次 DeepSeek 调用。

## 19. Stale plan

以下情况返回 `stale_plan`：

- template catalog 版本变化；
- planner 版本变化；
- 用户重新打开保存的旧 plan；
- `/generate-plan` 重算得到不同 plan；
- 输入、份数、intent、忌口或角色变化。

`stale_plan` 不调用 DeepSeek，只提供结构化 `replan` action。

## 20. 旧协议兼容

| 旧 purpose | 新 mode | 新 intent |
|---|---|---|
| `pantry` | `pantry` | `normal` |
| `quick` | `recommend` | `quick` |
| `fresh` | `recommend` | `fresh` |
| `batch` | `recommend` | `batch` |
| 缺失或未知 | `recommend` | `normal` |

旧 `pantry` 字段：

- 旧 purpose 为 pantry 时转入 `must_use`；
- 其他 purpose 转入 `prefer_use`。

迁移：

1. 新前端只调用 `/plan-meal` 与 `/generate-plan`。
2. `/generate-meal` 暂时作为 V1 兼容入口。
3. V1 请求先映射为 V2 再运行 planner。
4. V1 pantry 不完整时返回决策状态，不调用 DeepSeek，也不回退残缺固定菜谱。
5. V1 recommend 必要时可以明确调用 legacy recipe selector。
6. Legacy 响应必须标记 `plan_source:"legacy_recipe_selector"`、`legacy_fallback:true` 与原因。

第一阶段 recommend 没有输入或没有任何可识别 prefer item 时可以走 legacy fallback。Template planner 不为了填满槽位而擅自新增非基础主料。

## 21. 成本与调用次数

`/plan-meal`：

- 0 次 DeepSeek；
- 不扣 DeepSeek 预算；
- 换一换也是 0 次；
- 使用有界候选、最多两锅默认展示和三锅硬上限。

`/generate-plan`：

- 整个单锅或多锅 plan 最多 1 次 DeepSeek；
- 三锅也放在一次结构化请求中；
- 调用前完成重规划、版本、状态与 plan ID 校验；
- 无效、stale、needs decision 或 no alternative 请求不扣生成预算；
- 失败不自动重试；
- 用户主动重新生成才产生下一次调用。

保留请求大小、食材数量、上游超时、每日预算熔断、明确错误码和错误脱敏。Planner endpoint 只需独立的轻量 CPU 频率限制，不使用 DeepSeek 预算计数。

## 22. 真实用户旅程测试

测试通过真实 HTTP 契约与前端状态，不只调用内部函数。

### 22.1 食材与模板

1. Pantry：牛里脊、番茄、鸡蛋。牛里脊识别为 beef+tenderloin，可入通用牛肉槽，不得进入牛腩或肉末槽。
2. Pantry：番茄、金针菇、鸡蛋、西兰花。不得返回只使用一种的计划；complete 必须 4/4。
3. Pantry：豆腐、金针菇、白菜。豆腐进入老豆腐结构，不得列为 unused。
4. Pantry：嫩豆腐、番茄、鸡蛋。嫩豆腐保持易碎/软嫩属性，步骤不得套老豆腐煎制定型。
5. Pantry：牛肉末、番茄、大米。牛肉末只进入 ground-meat 兼容结构。
6. Pantry：排骨、豆角、大米。排骨识别为 rib，不得进入 quick 短炒。
7. Pantry：鸡腿、土豆、白菜、面条。鸡腿不得替换成鸡胸。
8. Pantry：番茄与两种高出水蔬菜、生大米。Planner 必须考虑 moisture release，不能沿用固定米水比。

### 22.2 Recommend 主动取舍

9. Recommend：番茄、金针菇、鸡蛋、西兰花、黄瓜。系统选择最合理的兼容组合，不要求全部使用；返回 planned prefer 与 unused prefer，并逐项解释 `texture_conflict`、`would_break_ratio` 或 `exceeds_slot_limit`，页面不得承诺“全部用上”。
10. Recommend：只有番茄。至少使用番茄，可补基础主食、液体、油脂或调味，不得擅自补肉、鸡蛋或豆腐。
11. Recommend：无输入。允许明确 legacy fallback，并标记来源，不伪装成 template plan。

### 22.3 覆盖与多锅

12. Pantry 两种食材。单锅必须 2/2，否则进入多锅或 decision。
13. Pantry 三种食材、最佳单锅只能覆盖两种。不得宣称 complete，继续寻找第二锅。
14. Pantry 六种食材。低于 60% 的单锅候选不得展示；多锅只有 100% 才 complete。
15. 14 种可识别食材。默认先尝试两锅；若需第三锅，先返回 `third_pot_required`，不直接展示三个任务。
16. 用户接受第三锅。重新规划后最多三锅、每锅独立主餐、食材不跨锅重复。
17. 20 种混杂食材超过三锅容量。返回 `plan_capacity_exceeded`，保留已规划 pots，不调用 DeepSeek。
18. 输入豆腐、老豆腐、北豆腐。覆盖分母按 semantic identity 去重，raw 全部保留。
19. 同一食材同时位于 must 与 prefer。Must 优先且不重复计数。

### 22.4 决策状态

20. Pantry 包含未知食材。未知项进入 unplanned，recognition ratio 下降并阻止 complete。
21. 用户放宽未知食材。该项从 must 移入 prefer，重新规划并继续显示 unused/recognition。
22. 用户接受部分规划。状态变为 partial accepted，未处理项继续展示，不出现“全部安排完成”。
23. 用户调整食材。返回输入页并保留原输入、mode、intent、忌口和份数。
24. Pantry 出现过敏冲突。返回结构化安全原因，不得用替换或 required extras 绕过。

### 22.5 Intent 与换一换

25. Pantry+quick 多锅。每锅都不超过 30 分钟。
26. Pantry+batch。每锅单独返回 servings 与 meal sequence，食材仍只能分配一次。
27. 第一次 swap 存在不同 template。返回不同 plan ID，覆盖承诺不下降，DeepSeek 调用为 0。
28. 同 template 但不同合法 slot assignment。作为 Level 2 alternative 返回。
29. 只有一个可靠 plan。返回 no alternative plan 和结构化操作，不显示通用失败页。
30. 当前 plan 与历史同时存在。当前硬排除，更早历史只软降权，不导致候选耗尽。
31. 仅改变菜名或步骤。Plan ID 不变，不算换一换成功。

### 22.6 Planner/模型边界

32. `/plan-meal` 的 ready、complete、needs decision、swap 全部验证 DeepSeek 调用为 0。
33. `/generate-plan` 中模型新增香菇。返回 model contract violation，最终食材不得出现香菇。
34. 模型把牛里脊改成牛腩。返回 shape/cut violation，不重试。
35. 模型删除金针菇或步骤不提及。返回 missing planned ingredient。
36. 模型颠倒鸡肉熟制顺序。返回 cooking order/safety endpoint violation。
37. 模型修改液体比例。返回 ratio violation。
38. 三锅 plan 生成。整个请求最多一次 DeepSeek；失败不自动重试。

### 22.7 版本与旧协议

39. Catalog 版本更新后提交旧 plan。返回 stale plan，DeepSeek 为 0。
40. 同一有效 plan 主动重写文案。Plan ID、食材、槽位、比例和安全要求不变。
41. V1 purpose pantry 映射为 pantry+normal；残缺覆盖不得 legacy 回退。
42. V1 purpose quick 映射为 recommend+quick。
43. Recommend 无模板命中。可明确 legacy fallback，必须标记。
44. Pantry 无 template 完整覆盖。返回 needs decision 或 no valid plan，不允许残缺 legacy fallback。

## 23. 第一阶段验收闸门

开始实现后，第一阶段只有满足以下条件才可进入 Preview 评估；本规格不授权部署：

- 8 个 active template 通过机器 schema；
- 其余 7 个保持 planned，不进入候选；
- 高频 taxonomy 的 category 与五类烹饪属性通过校验；
- 每个 active template 所需 Ratio DSL 完整并有 evidence recipe；
- Worker/Python planner parity 全部通过；
- 44 条旅程通过；
- `/plan-meal` 全路径 0 次 DeepSeek；
- `/generate-plan` 每次最多 1 次，失败不自动重试；
- pantry complete 的 coverage ratio 必须为 1 且 unplanned 为空；
- recipe 总数保持 72；
- 不新增账号、画像、营养追踪、多 Agent 或其他功能；
- PR 保持 Draft；
- 不部署 production。

## 24. 实施顺序建议

本节仅锁定未来实施顺序，不属于本次设计文档提交之外的代码授权：

1. V2 schema、状态和 legacy adapter 测试；
2. taxonomy 数据与 validator；
3. Ratio DSL、validator 与 quantity compiler；
4. 第一批 8 个 template；
5. 确定性单锅/两锅/三锅 planner；
6. swap 与 plan ID；
7. `/plan-meal`；
8. `/generate-plan` 重算与 DeepSeek 锁定契约；
9. 模型越界校验；
10. 前端 mode/intent、plan、decision、no-alternative 和 stale 状态；
11. Worker/Python parity、真实旅程和完整回归。

在本规格获得书面确认并形成独立实施计划前，不进入上述实现。

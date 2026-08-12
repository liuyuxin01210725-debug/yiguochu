# Pantry Planner V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用确定性约束规划器取代“固定菜谱即组合上限”，让“直接推荐”诚实选择合理组合，让“帮我清库存”只在全部必用食材被规划后才宣称完成，并把 DeepSeek 限定为已确认计划的自然语言表达层。

**Architecture:** 新增一个 Worker 可直接导入的纯 JavaScript 规划模块、三份机器数据（食材 taxonomy、template catalog 与 Ratio DSL）和对应离线校验器。`/plan-meal` 只做归一化、模板装槽、Ratio DSL 计算、单锅/多锅排序与状态决策；`/generate-plan` 用原始请求重算计划、核对 SHA-256 `plan_id` 后至多调用一次 DeepSeek。Python 本地代理镜像同一契约，前端先规划、后生成，并明确呈现完整、待决定、部分接受、无替代和过期计划状态。

**Tech Stack:** Cloudflare Pages Functions / ES modules、原生浏览器 JavaScript、Python 3 标准库、JSON 机器数据、Node.js 内置测试运行器、Web Crypto / `hashlib.sha256`。

## Global Constraints

- [ ] 实施时以 [`docs/superpowers/specs/2026-07-23-pantry-planner-v2-design.md`](../specs/2026-07-23-pantry-planner-v2-design.md) 为唯一产品契约；本计划只规定落地顺序。
- [ ] 不修改 `tools/data/recipe-library.json`，菜谱总数保持 72；recipe 只提供技法、安全、比例和来源证据。
- [ ] 第一阶段 catalog 保留 15 个 template，但只有指定的 8 个 `active`；其余 7 个必须是 `planned`，不能进入候选。
- [ ] 不增加账号、用户画像、营养追踪、云端用户数据、多 Agent、自然语言场景或新菜谱。
- [ ] `plan-meal` 的所有路径均为 0 次 DeepSeek 调用；`generate-plan` 每次请求最多 1 次，不自动重试。
- [ ] pantry 不能静默回退到残缺 legacy recipe；recommend 的 legacy fallback 必须显式标记。
- [ ] 每个行为修改必须先写失败测试、确认红灯，再写最小实现、确认绿灯。
- [ ] 每个任务只提交本任务列出的文件；不得部署 Preview 或 production，不得合并 Draft PR #1。

---

## Task 1: 建立 V2 请求契约和 V1 兼容适配器

**Files:**

- Create: `worker/src/planner-v2.js`
- Create: `tools/tests/pantry-planner-v2-contract.test.mjs`
- Modify: `worker/src/worker.js`

- [ ] **Step 1: 写请求契约失败测试**

在 `tools/tests/pantry-planner-v2-contract.test.mjs` 中直接导入纯函数，锁定正交的 `mode` / `intent`、去重食材和 V1 映射：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePlannerRequest,
  plannerRequestFromLegacy,
} from '../../worker/src/planner-v2.js';

test('V2 keeps mode and intent orthogonal', () => {
  const request = normalizePlannerRequest({
    schema_version: 2,
    planner_version: 'pantry-planner-v2',
    constraints: {
      mode: 'pantry',
      intent: 'quick',
      servings: 2,
      must_use: ['番茄', '番茄', '鸡蛋'],
      prefer_use: ['青菜'],
    },
  });
  assert.equal(request.mode, 'pantry');
  assert.equal(request.intent, 'quick');
  assert.deepEqual(request.must_use, ['番茄', '鸡蛋']);
  assert.deepEqual(request.prefer_use, ['青菜']);
});

test('legacy purpose maps without changing its old meaning', () => {
  assert.deepEqual(
    plannerRequestFromLegacy({ purpose: 'pantry', pantry: ['豆腐'] }),
    { mode: 'pantry', intent: 'normal', must_use: ['豆腐'], prefer_use: [] },
  );
  assert.deepEqual(
    plannerRequestFromLegacy({ purpose: 'quick', pantry: ['豆腐'] }),
    { mode: 'recommend', intent: 'quick', must_use: [], prefer_use: ['豆腐'] },
  );
});
```

- [ ] **Step 2: 运行测试并确认红灯**

Run: `node --test tools/tests/pantry-planner-v2-contract.test.mjs`

Expected: FAIL，提示 `worker/src/planner-v2.js` 或导出函数不存在。

- [ ] **Step 3: 实现最小请求归一化层**

在 `worker/src/planner-v2.js` 导出以下稳定接口：

```js
export const PLANNER_SCHEMA_VERSION = 2;
export const PLANNER_VERSION = 'pantry-planner-v2';
export const PLANNER_MODES = new Set(['recommend', 'pantry']);
export const PLANNER_INTENTS = new Set(['normal', 'quick', 'fresh', 'batch']);

export function plannerRequestFromLegacy(constraints = {}) {
  const purpose = String(constraints.purpose || 'quick');
  const pantry = Array.isArray(constraints.pantry) ? constraints.pantry : [];
  if (purpose === 'pantry') {
    return { mode: 'pantry', intent: 'normal', must_use: pantry, prefer_use: [] };
  }
  return {
    mode: 'recommend',
    intent: PLANNER_INTENTS.has(purpose) ? purpose : 'normal',
    must_use: [],
    prefer_use: pantry,
  };
}
```

`normalizePlannerRequest()` 必须限制每类最多 20 项、份数 1–8、历史最多 20 项，并保留 `current_plan_id`、`recent_plan_ids` 和结构化 `decision`；第三锅只能通过 `decision.action === 'allow_third_pot'` 开启。非法 `mode` / `intent` 返回带 `code: invalid_planner_request` 的受控异常，不得静默猜测。

- [ ] **Step 4: 给 Worker 暴露纯函数但不改现有路由**

在 `worker/src/worker.js` 顶部导入并在文件末尾 re-export：

```js
import {
  normalizePlannerRequest,
  plannerRequestFromLegacy,
} from './planner-v2.js';
```

这一步不增加 `/plan-meal`，确保 legacy `/generate-meal` 尚未改变。

- [ ] **Step 5: 运行聚焦测试和既有 Worker 测试**

Run:

```sh
node --test tools/tests/pantry-planner-v2-contract.test.mjs
node --test tools/tests/worker-recipe.test.mjs
```

Expected: 两组全部 PASS，既有 `/generate-meal` 行为不变。

- [ ] **Step 6: 提交**

```sh
git add worker/src/planner-v2.js worker/src/worker.js tools/tests/pantry-planner-v2-contract.test.mjs
git commit -m "Add planner v2 request contract"
```

## Task 2: 建立受控食材 taxonomy 和机器校验

**Files:**

- Create: `tools/data/ingredient-taxonomy.v1.json`
- Create: `tools/lib/ingredient-taxonomy-validator.mjs`
- Create: `tools/tests/ingredient-taxonomy.test.mjs`
- Modify: `worker/src/planner-v2.js`

- [ ] **Step 1: 写 taxonomy schema 与语义失败测试**

测试至少锁定：版本、`canonical_id` 唯一、alias 唯一、五类烹饪属性齐全，以及牛里脊保留部位但归到牛肉类别。

```js
test('taxonomy carries culinary behavior, not category alone', () => {
  const beef = catalog.items.find(item => item.canonical_id === 'beef-generic');
  assert.equal(beef.category, 'beef');
  assert.ok(beef.shapes_or_cuts.includes('tenderloin'));
  assert.equal(beef.cook_speed, 'fast');
  assert.equal(beef.moisture_release, 'low');
  assert.equal(beef.texture_behavior.behavior_code, 'tender_when_quick_cooked');
  assert.equal(beef.cooking_risk.risk_code, 'raw_beef');
});
```

另锁定：`牛里脊肉/牛柳/牛肉片 → canonical 牛肉 + 对应 shape_or_cut`、`鸡胸/鸡腿 → chicken category 但保留 breast/leg`、`嫩豆腐/南豆腐`、`老豆腐/北豆腐/豆腐` 的受控语义；牛里脊不得获得 `brisket` 或 `ground` 形态。

- [ ] **Step 2: 运行并确认红灯**

Run: `node --test tools/tests/ingredient-taxonomy.test.mjs`

Expected: FAIL，数据文件和 validator 不存在。

- [ ] **Step 3: 写第一阶段 taxonomy 数据**

`tools/data/ingredient-taxonomy.v1.json` 顶层必须是：

```json
{
  "taxonomy_version": "taxonomy-v1-20260724",
  "items": []
}
```

首批必须覆盖模板测试需要的高频 canonical：`大米、熟米饭、面条、番茄、鸡蛋、嫩豆腐、老豆腐、牛肉、牛里脊、牛肉末、鸡肉、鸡胸肉、鸡腿肉、猪肉、排骨、白菜、西兰花、青菜、豆角、黄瓜、洋葱、胡萝卜、土豆、金针菇、香菇、水、食用油、盐、酱油`。每条都提供：

```json
{
  "canonical_id": "enoki-mushroom",
  "display_name": "金针菇",
  "aliases": ["金菇"],
  "category": "mushroom",
  "states": ["raw"],
  "shapes_or_cuts": ["whole"],
  "cook_speed": "fast",
  "moisture_release": "medium",
  "texture_behavior": {
    "behavior_code": "softens_with_simmering",
    "best_method_codes": ["simmer"],
    "failure_mode_codes": ["soft_when_overcooked"]
  },
  "cooking_risk": {
    "risk_code": "none",
    "required_endpoint_codes": []
  },
  "compatible_slot_codes": ["mushroom", "fast_cooking_vegetable"],
  "incompatible_slot_codes": []
}
```

类别与属性使用受控枚举；未知输入不得模糊猜类别，而是 `recognized:false`。

- [ ] **Step 4: 实现 validator 和归一化输出**

`validateIngredientTaxonomy(data)` 返回字符串错误数组；`assertIngredientTaxonomy(data)` 在错误非空时抛错。`normalizePlannerItems(rawItems, taxonomy)` 返回：

```js
{
  raw: '牛里脊肉',
  canonical: '牛肉',
  category: 'beef',
  shape_or_cut: 'tenderloin',
  cook_speed: 'fast',
  moisture_release: 'low',
  texture_behavior: 'tender_when_quick_cooked',
  cooking_risk: 'raw_beef',
  recognized: true,
  role: 'must_use',
  duplicate_of: null,
}
```

去重使用 canonical，但 `raw` 保留首次用户输入，便于解释。

- [ ] **Step 5: 运行测试**

Run:

```sh
node --test tools/tests/ingredient-taxonomy.test.mjs tools/tests/pantry-planner-v2-contract.test.mjs
```

Expected: PASS；未知食材测试返回 `recognized:false`，未被丢弃。

- [ ] **Step 6: 提交**

```sh
git add tools/data/ingredient-taxonomy.v1.json tools/lib/ingredient-taxonomy-validator.mjs tools/tests/ingredient-taxonomy.test.mjs worker/src/planner-v2.js
git commit -m "Add planner ingredient taxonomy"
```

## Task 3: 建立 template catalog 与 8 active / 7 planned 闸门

**Files:**

- Create: `tools/data/meal-templates.v2.json`
- Create: `tools/lib/meal-template-validator.mjs`
- Create: `tools/tests/meal-template-catalog.test.mjs`

- [ ] **Step 1: 写 catalog 失败测试**

测试断言 15 个 template ID 精确存在，active 集合精确为：

```js
const ACTIVE = new Set([
  'acid-staple-pot',
  'savory-mixed-rice-pot',
  'cooked-rice-stir-pot',
  'broth-noodle-pot',
  'egg-tofu-vegetable-pot',
  'mushroom-vegetable-stew-pot',
  'beef-staple-pot',
  'poultry-staple-pot',
]);
```

每个 active template 必须具备 `required_slots`、`optional_slots`、`slot_limits`、`ingredient_categories`、`compatibility_rules`、`incompatible_rules`、`shape_or_cut_requirements`、`cooking_order`、`ratio_constraints`、`liquid_constraints`、`safety_endpoints`、`time_range`、`supported_intents`、`evidence_recipe_ids`。`evidence_recipe_ids` 必须存在于现有 72 道 recipe 中；测试只读库，不写库。

- [ ] **Step 2: 运行并确认红灯**

Run: `node --test tools/tests/meal-template-catalog.test.mjs`

Expected: FAIL，catalog/validator 不存在。

- [ ] **Step 3: 写机器 template catalog**

顶层固定：

```json
{
  "schema_version": 1,
  "template_catalog_version": "templates-v2-20260724",
  "ingredient_taxonomy_version": "taxonomy-v1-20260724",
  "templates": []
}
```

Template 是槽位结构，不得使用“番茄牛肉饭模板”这种固定菜名。以 `acid-staple-pot` 为基准形态：

```json
{
  "template_id": "acid-staple-pot",
  "activation_status": "active",
  "required_slots": [
    {"slot_id": "acid_base", "min_items": 1, "max_items": 1, "source_policy": ["user"], "accepts_categories": ["acid_vegetable"]},
    {"slot_id": "staple", "min_items": 1, "max_items": 1, "source_policy": ["user", "basic_extra"], "accepts_categories": ["raw_rice", "cooked_rice", "noodle"]}
  ],
  "optional_slots": [
    {"slot_id": "protein", "min_items": 0, "max_items": 1, "source_policy": ["user"], "accepts_slot_codes": ["quick_cook_protein", "egg", "firm_tofu", "soft_tofu"]},
    {"slot_id": "vegetable", "min_items": 0, "max_items": 2, "source_policy": ["user"], "accepts_categories": ["leafy_vegetable", "cruciferous_vegetable", "root_vegetable"]},
    {"slot_id": "mushroom", "min_items": 0, "max_items": 1, "source_policy": ["user"], "accepts_categories": ["mushroom"]}
  ],
  "slot_limits": {"total_user_items_min": 1, "total_user_items_max": 5, "protein_max": 1, "vegetable_max": 2, "mushroom_max": 1},
  "ingredient_categories": {
    "acid_base": ["acid_vegetable"],
    "staple": ["raw_rice", "cooked_rice", "noodle"],
    "protein": ["egg", "firm_tofu", "soft_tofu", "beef", "chicken", "pork"],
    "vegetable": ["leafy_vegetable", "cruciferous_vegetable", "root_vegetable"],
    "mushroom": ["mushroom"]
  },
  "compatibility_rules": [{"rule_code": "raw_rice_requires_braise_or_simmer", "when": {"slot_id": "staple", "category": "raw_rice"}, "requires_cooking_mode": ["braise", "simmer"]}],
  "incompatible_rules": [{"rule_code": "excess_moisture_with_raw_rice", "when": {"slot_id": "staple", "category": "raw_rice"}, "forbids_attribute_count": {"attribute": "moisture_release", "value": "high", "greater_than": 1}}],
  "shape_or_cut_requirements": [{"slot_id": "protein", "category": "beef", "allowed_shapes": ["slice", "dice", "tenderloin"], "forbidden_shapes": ["brisket", "ground"]}],
  "cooking_order": [{"phase": 1, "action_code": "protein_pretreat", "slot_ids": ["protein"]}, {"phase": 2, "action_code": "acid_base_cookdown", "slot_ids": ["acid_base"]}, {"phase": 3, "action_code": "add_staple_and_liquid", "slot_ids": ["staple"]}, {"phase": 4, "action_code": "add_fast_cooking_items", "slot_ids": ["vegetable", "mushroom"]}, {"phase": 5, "action_code": "reach_safety_endpoints", "slot_ids": ["protein"]}],
  "ratio_constraints": ["acid-staple-raw-rice-liquid-v1"],
  "liquid_constraints": {"allowed_categories": ["water", "approved_stock"], "max_liquid_types": 1, "must_be_measured": true, "retained_in_finished_meal": true},
  "safety_endpoints": [{"applies_to_category": "chicken", "endpoint_code": "poultry_fully_cooked_no_pink"}, {"applies_to_category": "egg", "endpoint_code": "egg_fully_set"}],
  "time_range": {"min_minutes": 20, "max_minutes": 45},
  "supported_intents": ["normal", "fresh", "batch"],
  "evidence_recipe_ids": ["jollof-rice", "tomato-egg-stewed-leftover-rice", "tomato-tofu-stewed-rice"]
}
```

其余 7 个 active 按规格槽位建模。以下 7 个 planned 也必须 schema 完整，但 `activation_status:"planned"` 且不得进入运行候选：`mushroom-aroma-rice-pot`、`broth-rice-pot`、`braised-noodle-pot`、`curry-staple-pot`、`pork-staple-pot`、`soft-family-rice-pot`、`quick-breakfast-pot`。

- [ ] **Step 4: 实现 catalog validator**

Validator 必须拒绝：未知 taxonomy category、重复 template ID、active 缺 Ratio DSL 引用、slot limit 小于 required 数量、声明支持 quick 的模板 `time_range.max_minutes > 30`、空 evidence、未知 recipe ID、planned template 被标为 runtime eligible。

- [ ] **Step 5: 运行 catalog 与 recipe 不变测试**

Run:

```sh
node --test tools/tests/meal-template-catalog.test.mjs tools/tests/recipe-library.test.mjs
node -e "const x=require('./tools/data/recipe-library.json'); if(x.recipes.length!==72) process.exit(1); console.log('72 recipes unchanged')"
```

Expected: PASS，输出 `72 recipes unchanged`。

- [ ] **Step 6: 提交**

```sh
git add tools/data/meal-templates.v2.json tools/lib/meal-template-validator.mjs tools/tests/meal-template-catalog.test.mjs
git commit -m "Add planner template catalog"
```

## Task 4: 实现 Ratio DSL validator 与确定性克数编译器

**Files:**

- Create: `tools/data/ratio-rules.v1.json`
- Create: `tools/lib/ratio-dsl-validator.mjs`
- Create: `tools/tests/ratio-dsl.test.mjs`
- Modify: `tools/lib/meal-template-validator.mjs`
- Modify: `worker/src/planner-v2.js`

- [ ] **Step 1: 写 Ratio DSL 红灯测试**

锁定五个允许操作符：`per_serving`、`ratio`、`bounded_sum`、`fixed_addition`、`scale_by_servings`。至少验证：两份生米、番茄释水修正、quick 上下界、负数和未知操作符被拒绝。

```js
test('rice and liquid are compiled without model interpretation', () => {
  const result = compileRatios('acid-staple-raw-rice-liquid-v1', {
    servings: 2,
    slots: { staple: ['大米'], acid_base: ['番茄'] },
    attributes: { 番茄: { moisture_release: 'high' } },
  });
  assert.deepEqual(result.ingredients, [
    { name: '大米', grams: 200 },
    { name: '番茄', grams: 300 },
    { name: '水', grams: 160 },
  ]);
});
```

- [ ] **Step 2: 运行并确认红灯**

Run: `node --test tools/tests/ratio-dsl.test.mjs`

Expected: FAIL，DSL 文件和编译器不存在。

- [ ] **Step 3: 写受控 Ratio DSL 数据**

`tools/data/ratio-rules.v1.json` 包含 8 个 active template 所需规则。每条规则只允许数字、受控 slot 引用和上面五个操作符，例如：

```json
{
  "ratio_dsl_version": 1,
  "rules": [
    {
      "rule_id": "acid-staple-raw-rice-liquid-v1",
      "evidence_recipe_ids": ["jollof-rice", "tomato-tofu-stewed-rice"],
      "when": {"template_id": "acid-staple-pot", "slot_id": "staple", "category": "raw_rice"},
      "operations": [
        {"operator": "per_serving", "target": {"slot_id": "staple"}, "grams": {"min": 80, "default": 100, "max": 120}},
        {"operator": "ratio", "numerator": {"resource": "retained_liquid_grams"}, "denominator": {"slot_id": "staple", "measure": "grams"}, "min": 1.0, "default": 1.2, "max": 1.4},
        {"operator": "bounded_sum", "target": {"attribute": "moisture_release", "value": "high"}, "grams_per_serving": {"min": 80, "default": 120, "max": 160}}
      ],
      "rounding": {"grams_to_nearest": 5}
    }
  ]
}
```

所有 required extra 只能是基础主食、液体、油脂或基础调味；validator 遇到豆腐、肉、蔬菜等主要食材作为 extra 必须失败。

- [ ] **Step 4: 实现纯函数编译器**

在 `planner-v2.js` 导出 `compileRatioPlan(ruleId, context, ratioCatalog)`。输出稳定排序的 `ingredient_amounts`、`required_extra_items`、`liquid_constraints` 和 `ratio_trace`；不得调用 LLM，不得解析现有 recipe 的自然语言 `ratio_rules`。

- [ ] **Step 5: 运行测试**

Run:

```sh
node --test tools/tests/ratio-dsl.test.mjs tools/tests/meal-template-catalog.test.mjs
```

Expected: PASS；所有 8 个 active template 都能解析其 Ratio DSL。

- [ ] **Step 6: 提交**

```sh
git add tools/data/ratio-rules.v1.json tools/lib/ratio-dsl-validator.mjs tools/lib/meal-template-validator.mjs tools/tests/ratio-dsl.test.mjs worker/src/planner-v2.js
git commit -m "Add executable planner ratio rules"
```

## Task 5: 实现装槽、单锅候选与覆盖率排序

**Files:**

- Create: `tools/tests/pantry-planner-v2-selection.test.mjs`
- Modify: `worker/src/planner-v2.js`

- [ ] **Step 1: 写单锅真实组合失败测试**

覆盖以下不变量：

```js
test('pantry never returns a one-of-four pot', async () => {
  const result = await planMeal(fixtureAssets, normalizePlannerRequest({
    schema_version: 2,
    planner_version: 'pantry-planner-v2',
    constraints: { mode: 'pantry', intent: 'normal', servings: 2, must_use: ['番茄', '金针菇', '鸡蛋', '西兰花'], prefer_use: [] },
  }));
  assert.ok(result.plan.pots.every(pot => pot.planned_must_use.length >= 2));
});

test('recommend chooses a coherent subset and explains unused items', async () => {
  const result = await planMeal(fixtureAssets, normalizePlannerRequest({
    schema_version: 2,
    planner_version: 'pantry-planner-v2',
    constraints: { mode: 'recommend', intent: 'normal', servings: 2, must_use: [], prefer_use: ['牛里脊', '番茄', '鸡蛋', '西兰花'] },
  }));
  assert.ok(result.plan.planned_prefer_use.length >= 1);
  assert.ok(result.plan.unused_prefer_use.every(item => item.reason_code));
});
```

另加牛里脊进入通用 beef slot、不得进入 `braise-cut` / `minced`；豆腐 raw/canonical 必须正确计入 used。

- [ ] **Step 2: 运行并确认红灯**

Run: `node --test tools/tests/pantry-planner-v2-selection.test.mjs`

Expected: FAIL，`planMeal` / 装槽函数不存在。

- [ ] **Step 3: 实现候选 pot 生成**

在 `planner-v2.js` 导出三个纯函数接口：`assignItemsToTemplate(template, normalizedItems, context)` 返回单个 template 的完整装槽结果或结构化拒绝原因；`buildPotCandidates(assets, request)` 只汇集 `active` template 的有效装槽结果；`rankPotCandidates(candidates, request)` 返回不修改输入数组的稳定排序副本。三个函数都不得读取全局状态或调用网络。

装槽顺序固定为 required slots、限制性更强的 optional slots、普通 optional slots。每个输入项在同一 pot 最多分配一次；shape/cut、烹饪风险、不兼容组合、intent、time range、Ratio DSL 任一不满足都生成结构化 `rejection_reason`，不能靠扣分蒙混过关。

排序键固定为：

1. pantry 的 `planned_must_use` 数量，recommend 的合理性得分；
2. 安全端点完整；
3. intent 匹配，quick 每锅硬限制 `<=30` 分钟；
4. `required_extra_items` 数量更少；
5. template ID 和 slot assignment 的稳定字典序。

- [ ] **Step 4: 实现三类覆盖率**

顶层和每锅都返回：

```js
coverage_ratio = plannedMustUseCount / deduplicatedSubmittedMustUseCount;
recognition_ratio = recognizedSubmittedCount / deduplicatedSubmittedCount;
recognized_coverage_ratio = plannedRecognizedMustUseCount / recognizedMustUseCount;
```

分母为 0 时按规格返回 0；未识别 must-use 进入 `unplanned_must_use`，禁止 complete。

- [ ] **Step 5: 运行测试**

Run:

```sh
node --test tools/tests/pantry-planner-v2-selection.test.mjs tools/tests/ingredient-taxonomy.test.mjs tools/tests/ratio-dsl.test.mjs
```

Expected: PASS；2 种输入只接受 2/2，3 种至少 2/3，4–6 种单锅低于 60% 时不作为完整单锅。

- [ ] **Step 6: 提交**

```sh
git add worker/src/planner-v2.js tools/tests/pantry-planner-v2-selection.test.mjs
git commit -m "Implement deterministic pot selection"
```

## Task 6: 实现最多三锅的有界规划与决策状态

**Files:**

- Create: `tools/tests/pantry-planner-v2-multipot.test.mjs`
- Modify: `worker/src/planner-v2.js`

- [ ] **Step 1: 写多锅、未规划和用户决策失败测试**

锁定：默认最多展示 2 锅；第三锅需 `allow_third_pot:true`；没有数量时一个 canonical 食材只能分配给一锅；每锅都是独立主餐并有 `servings` / `meal_sequence`。

```js
assert.deepEqual(result.plan.pots.map(pot => pot.meal_sequence), [1, 2]);
assert.ok(result.plan.pots.every(pot => pot.servings === 2));
assert.equal(result.status, 'needs_user_decision');
assert.equal(result.generation_allowed, false);
assert.ok(result.plan.pots.length > 0);
assert.ok(result.plan.unplanned_must_use.length > 0);
```

用户动作必须是结构化对象，精确包含 `action`、`eligible_items`、`requires_acknowledgement`、`unplanned_items`。

- [ ] **Step 2: 运行并确认红灯**

Run: `node --test tools/tests/pantry-planner-v2-multipot.test.mjs`

Expected: FAIL，多锅枚举和状态机未实现。

- [ ] **Step 3: 实现有界组合搜索**

算法只能：生成候选 pot → 按 Task 5 排序 → 尝试 1 锅 → 2 锅 → 用户允许时 3 锅 → 找到第一个完整覆盖。禁止引入通用数学优化器。

状态规则：

```js
if (mode === 'pantry' && unplannedMustUse.length === 0) status = 'complete';
else if (mode === 'pantry' && pots.length > 0) status = 'needs_user_decision';
else if (mode === 'recommend' && plannedPreferUse.length > 0) status = 'ready';
else status = 'no_valid_plan';
```

超过三锅能力返回 `reason_code:'plan_capacity_exceeded'`，保留已规划 pots，不调用 DeepSeek。

- [ ] **Step 4: 实现三种用户动作**

- `relax_item`: 只允许用户从 `eligible_items` 明确选一项，从 must_use 降为 prefer_use 后重规划。
- `edit_ingredients`: 返回输入页并保留原输入，不改变规划数据。
- `accept_partial`: 请求必须带原 `plan_id`，且 `acknowledged_unplanned` 与服务端当前未规划项完全一致；状态变为 `partial_accepted`、`generation_allowed:true`，仍完整返回 `unplanned_must_use`，文案契约不得含“全部安排完成”。
- `force_multi_pot`: 只用于无同等单锅替代时，明确要求 planner 尝试两锅结构；不得降低 pantry 覆盖承诺。

- [ ] **Step 5: 运行测试**

Run:

```sh
node --test tools/tests/pantry-planner-v2-multipot.test.mjs tools/tests/pantry-planner-v2-selection.test.mjs
```

Expected: PASS；`needs_user_decision` 保留 pots 且 generation 禁止。

- [ ] **Step 6: 提交**

```sh
git add worker/src/planner-v2.js tools/tests/pantry-planner-v2-multipot.test.mjs
git commit -m "Add bounded multi-pot planning"
```

## Task 7: 实现规范化 SHA-256 plan ID、换一换与 stale plan

**Files:**

- Create: `tools/tests/pantry-planner-v2-identity.test.mjs`
- Modify: `worker/src/planner-v2.js`

- [ ] **Step 1: 写身份与换一换失败测试**

测试要求模型菜名、推荐理由和步骤变化不改变 plan ID；template、slot、锅顺序或模式变化必须改变。换一换不得调用 DeepSeek。

```js
test('plan id ignores generated prose', async () => {
  const a = await computePlanId({ ...lockedPlan, generated: { dish_name: '甲' } });
  const b = await computePlanId({ ...lockedPlan, generated: { dish_name: '乙' } });
  assert.equal(a, b);
});
```

另锁定：`current_plan_id` 本次硬排除；7 天内旧 `recent_plan_ids` 只软降权；只有同等承诺且结构不同才算替代；无替代返回 `no_alternative_plan`。

- [ ] **Step 2: 运行并确认红灯**

Run: `node --test tools/tests/pantry-planner-v2-identity.test.mjs`

Expected: FAIL，hash/swap 尚未实现。

- [ ] **Step 3: 实现 canonical JSON 与 plan ID**

`computePlanId()` 只序列化：

```js
{
  planner_version,
  template_catalog_version,
  template_id,
  normalized_items,
  slot_assignment,
  pots,
  required_extra_items,
  mode,
  intent,
}
```

对象 key 递归排序；pot 按 `meal_sequence`、slot 按 `slot_id`、同槽食材按 canonical identity、required extras 按 category+canonical 排序。使用 `crypto.subtle.digest('SHA-256', bytes)` 后按无 padding 的 base64url 编码，返回 `pln_v2_${base64url}`。禁止包含菜名、文案、步骤、时间戳或随机数。

- [ ] **Step 4: 实现 swap 层级与 stale 判定**

Level 1 不同 template；Level 2 同 template 不同 slot assignment；Level 3 只能由用户主动放宽食材触发。不同 plan 至少满足 template、slot、单/多锅结构、锅顺序之一不同。Catalog/taxonomy/planner 版本不匹配，或服务端重算 ID 不同，返回 `stale_plan` + `replan` action，0 DeepSeek。

- [ ] **Step 5: 运行测试**

Run:

```sh
node --test tools/tests/pantry-planner-v2-identity.test.mjs tools/tests/pantry-planner-v2-multipot.test.mjs
```

Expected: PASS；无替代不会落入通用失败。

- [ ] **Step 6: 提交**

```sh
git add worker/src/planner-v2.js tools/tests/pantry-planner-v2-identity.test.mjs
git commit -m "Add planner identity and swap semantics"
```

## Task 8: 接入 `/plan-meal`，并证明零 DeepSeek、零生成预算

**Files:**

- Create: `tools/tests/worker-planner-v2.test.mjs`
- Modify: `worker/src/worker.js`
- Modify: `tools/build-dist.mjs`
- Modify: `tools/tests/build-dist.test.mjs`

- [ ] **Step 1: 写 endpoint 红灯测试**

复用 `worker.fetch` 测试夹具，为 ASSETS 提供 taxonomy、template、ratio、recipe 四份数据。用会抛错的 `globalThis.fetch` 证明规划不会碰 DeepSeek，并用会记录 put 的 KV 证明不消耗生成预算。

```js
assert.equal(response.status, 200);
assert.equal(body.schema_version, 2);
assert.equal(upstreamCalls, 0);
assert.equal(kvWrites, 0);
```

覆盖 `ready`、`complete`、`needs_user_decision`、`no_alternative_plan`、`no_valid_plan` 和非法 JSON 400。

- [ ] **Step 2: 运行并确认红灯**

Run: `node --test tools/tests/worker-planner-v2.test.mjs`

Expected: FAIL，`/plan-meal` 返回 404。

- [ ] **Step 3: 实现 planner assets loader 与 endpoint**

Worker 新增缓存加载：

```js
getPlannerAsset(env, request, '/ingredient-taxonomy.v1.json');
getPlannerAsset(env, request, '/meal-templates.v2.json');
getPlannerAsset(env, request, '/ratio-rules.v1.json');
getRecipeLib(env, request);
```

`POST /plan-meal` 顺序：读取/限制 body → normalize request → load+validate assets → `planMeal()` → JSON 返回。不得执行 `rateOk()` 的生成计数、`budgetConsume()` 或上游 fetch；可以保留独立的轻量 CPU 防滥用计数。

- [ ] **Step 4: 把三份机器数据纳入唯一构建流程**

在 `GENERATED_ASSETS` 增加：

```js
['tools/data/ingredient-taxonomy.v1.json', 'ingredient-taxonomy.v1.json'],
['tools/data/meal-templates.v2.json', 'meal-templates.v2.json'],
['tools/data/ratio-rules.v1.json', 'ratio-rules.v1.json'],
['worker/src/planner-v2.js', 'planner-v2.js'],
```

`build-dist.test.mjs` 校验四个文件逐字节一致，且 `_worker.js` 的相对 import 在构建目录可解析。

- [ ] **Step 5: 运行测试与构建检查**

Run:

```sh
node --test tools/tests/worker-planner-v2.test.mjs tools/tests/build-dist.test.mjs
node tools/build-dist.mjs --out-dir dist/planner-v2-test --build-id planner-v2-test
```

Expected: PASS；构建 JSON 的文件数同步增加，测试构建目录包含三份数据和 `planner-v2.js`。

- [ ] **Step 6: 提交**

```sh
git add worker/src/worker.js tools/build-dist.mjs tools/tests/worker-planner-v2.test.mjs tools/tests/build-dist.test.mjs
git commit -m "Add deterministic plan meal endpoint"
```

## Task 9: 接入 `/generate-plan` 与模型越界硬校验

**Files:**

- Create: `tools/tests/worker-generate-plan.test.mjs`
- Modify: `worker/src/worker.js`
- Modify: `worker/src/planner-v2.js`

- [ ] **Step 1: 写生成契约红灯测试**

覆盖：服务端重算；catalog 过期；ID 不一致；模型新增牛腩、把金针菇换香菇、漏掉 planner 食材、改克数、改安全端点；多锅仍只有一次上游调用；失败不重试。

```js
assert.equal(upstreamBodies.length, 1);
assert.equal(body.code, 'model_contract_violation');
assert.equal(response.status, 422);
```

`stale_plan` 必须在预算扣账前返回，upstream 与 KV write 都为 0。

- [ ] **Step 2: 运行并确认红灯**

Run: `node --test tools/tests/worker-generate-plan.test.mjs`

Expected: FAIL，`/generate-plan` 404。

- [ ] **Step 3: 实现服务端重算与单次生成**

请求只接受：

```json
{
  "schema_version": 2,
  "planner_version": "pantry-planner-v2",
  "template_catalog_version": "templates-v2-20260724",
  "plan_id": "pln_v2_T3uGMdXfW4pmX98Oyyekimu4qQLrIgFloAbqdbgupJw",
  "plan_request": {
    "schema_version": 2,
    "planner_version": "pantry-planner-v2",
    "constraints": {
      "mode": "pantry",
      "intent": "quick",
      "servings": 2,
      "must_use": ["番茄", "鸡蛋", "金针菇"],
      "prefer_use": [],
      "dislikes": [],
      "decision": null
    }
  }
}
```

服务端用 `plan_request` 重跑 planner，核对版本、可生成状态、`plan_id`。确认后才执行生成限流与预算扣账，并把整个单锅/多锅 locked plan 作为一次 DeepSeek 请求。

- [ ] **Step 4: 缩小 DeepSeek 输入输出**

输入只含 `plan_id`、template ID、每锅 slots、确定食材与克数、ratio/liquid/time/safety 约束。模型只允许输出：

```json
{
  "plan_id": "pln_v2_T3uGMdXfW4pmX98Oyyekimu4qQLrIgFloAbqdbgupJw",
  "meals": [
    {
      "meal_sequence": 1,
      "dish_name": "番茄鸡蛋金针菇焖饭",
      "ingredient_refs": ["i1", "i2", "i3", "e1", "e2", "e3"],
      "steps": [
        {"order": 1, "text": "番茄切块，金针菇去根洗净；鸡蛋打散。", "ingredient_refs": ["i1", "i2", "i3"], "completed_safety_endpoints": []},
        {"order": 2, "text": "加入食用油炒熟鸡蛋，再加入番茄和金针菇。", "ingredient_refs": ["i1", "i2", "i3", "e3"], "completed_safety_endpoints": ["egg_fully_set"]},
        {"order": 3, "text": "加入大米和规划量的水焖熟。", "ingredient_refs": ["e1", "e2"], "completed_safety_endpoints": []}
      ],
      "recommendation_reason": "这套做法按计划用上三种现有食材，并在一锅内完成主食和熟制。"
    }
  ]
}
```

不得再让模型返回或决定 template、slot assignment、ingredients/grams、required extras 或安全规则。

- [ ] **Step 5: 实现模型边界 validator**

`validateGeneratedPlan(modelOutput, lockedPlan, taxonomy)` 必须核对：plan ID、meal 数量/顺序、每锅 ingredient refs 集合完全相等、步骤引用不越界、必需食材没有遗漏、原始部位/形态没有替换、cooking order、液体/时间与安全终点都未越界。任何越界返回 `model_contract_violation`，不 repair、不自动重试。

- [ ] **Step 6: 运行测试**

Run:

```sh
node --test tools/tests/worker-generate-plan.test.mjs tools/tests/worker-planner-v2.test.mjs tools/tests/worker-recipe.test.mjs
```

Expected: PASS；旧 `/generate-meal` 仍绿，V2 每次最多一次上游调用。

- [ ] **Step 7: 提交**

```sh
git add worker/src/worker.js worker/src/planner-v2.js tools/tests/worker-generate-plan.test.mjs
git commit -m "Lock generation to confirmed plans"
```

## Task 10: 镜像 Python 本地代理并建立跨端 parity

**Files:**

- Modify: `ai_proxy.py`
- Create: `tools/tests/planner-v2-parity.test.mjs`
- Modify: `tools/tests/proxy-security.test.mjs`

- [ ] **Step 1: 写 Python/Worker parity 红灯测试**

通过 Python CLI `--plan-meal '<json>'` 与 JS `planMeal()` 对拍规范化 items、状态、pots、覆盖率、plan ID。至少覆盖 12 组，包括牛里脊、豆腐 alias、unknown、quick、多锅、partial accepted、swap 和 stale。

- [ ] **Step 2: 运行并确认红灯**

Run: `node --test tools/tests/planner-v2-parity.test.mjs`

Expected: FAIL，Python CLI/函数不存在。

- [ ] **Step 3: 在 Python 中镜像确定性规划契约**

新增与 JS 同名语义的 snake_case 函数：`normalize_planner_request`、`normalize_planner_items`、`compile_ratio_plan`、`build_pot_candidates`、`plan_meal`、`compute_plan_id`、`validate_generated_plan`。读取同一三份 JSON 数据，不能另建 Python 专属事实表。

Python `compute_plan_id` 使用：

```python
encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode('utf-8')
digest = hashlib.sha256(encoded).digest()
return 'pln_v2_' + base64.urlsafe_b64encode(digest).rstrip(b'=').decode('ascii')
```

- [ ] **Step 4: 增加本地 `/plan-meal` 与 `/generate-plan`**

`Handler.do_POST` 分流三个 endpoint。`/plan-meal` 不先执行 `_rate_ok`；`/generate-plan` 重算通过后才限流并调用模型一次。非法 JSON、stale、needs decision、model violation 的 status/code 与 Worker 逐字一致。

- [ ] **Step 5: 运行 parity、安全与语法检查**

Run:

```sh
python3 -m py_compile ai_proxy.py
node --test tools/tests/planner-v2-parity.test.mjs tools/tests/proxy-security.test.mjs tools/tests/recipe-parity.test.mjs
```

Expected: PASS；所有 parity 子进程使用不少于 15 秒超时，避免 1.5 秒假红。

- [ ] **Step 6: 提交**

```sh
git add ai_proxy.py tools/tests/planner-v2-parity.test.mjs tools/tests/proxy-security.test.mjs
git commit -m "Mirror planner v2 in local proxy"
```

## Task 11: 前端接入两层模式、规划状态与明确操作路径

**Files:**

- Modify: `index.html`
- Modify: `tools/tests/frontend-recipe-contract.test.mjs`

- [ ] **Step 1: 写前端状态和文案红灯测试**

测试锁定用户名称只显示“直接推荐 / 帮我清库存”，intent 单独显示“正常做 / 快点吃上 / 清爽些 / 多做一些”。请求体必须是 `schema_version:2`，不再把 `purpose` 同时承担两层语义。

另锁定页面文案：

- recommend：`这次优先用了…`、`这次没有使用…`，不得承诺全部用掉；
- complete：`完整清库存计划`；
- needs decision：`还有食材没有安排`，显示已确定 pots，但不显示具体步骤；
- partial accepted：`部分处理方案`，始终显示未处理食材；
- no alternative：`当前组合只有一个可靠的一锅方案`，提供放宽一种食材、分成两锅、返回修改食材；
- stale：`这份计划已经更新，请重新规划`。

- [ ] **Step 2: 运行并确认红灯**

Run: `node --test tools/tests/frontend-recipe-contract.test.mjs`

Expected: FAIL，当前仍用 `purpose` 和 `/generate-meal`。

- [ ] **Step 3: 改 profile 与本机存储兼容**

`DEFAULT_PROFILE` 改为：

```js
{ mode:'recommend', intent:'quick', servings:'2', pantry:'', dislikes:'' }
```

读取旧 profile 时按 Task 1 规则迁移；不删除旧本地数据。前端只把 pantry 文本映射到 `must_use` 或 `prefer_use`，不能两边同时发送。

- [ ] **Step 4: 拆分 plan 与 generate 请求**

新增 `fetchPlan()` 和 `generateConfirmedPlan()`：

- 初次点击：`/plan-meal`；ready/complete 可立即进入 `/generate-plan`，总共一次 DeepSeek。
- needs decision：停止，不调用 `/generate-plan`。
- 换一换：只请求 `/plan-meal` 并展示新 plan preview；用户点击“生成这套做法”后才调用 `/generate-plan`。
- `no_alternative_plan` 走专属页面，不走通用失败。

- [ ] **Step 5: 实现结构化 decision actions**

“放宽一种食材”只能从服务端 `eligible_items` 选择；“分成两锅”重规划并带显式 action；“接受部分规划”先展示确认文案，发送完整 `acknowledged_unplanned`；“调整食材”保留原输入返回 profile。第三锅必须先显示额外负担提示并由用户确认。

- [ ] **Step 6: 保留历史但改为 plan 级语义**

`swapHistory` 的 `kind:swapped|started` 保留；新增 `planId` 与 `ts`。当前 plan 只在这次 swap 作为 `current_plan_id`；更早 7 天历史作为 `recent_plan_ids`，不能继续把全部 history 作为永久硬排除。

- [ ] **Step 7: 运行前端与本地入口测试**

Run:

```sh
node --test tools/tests/frontend-recipe-contract.test.mjs tools/tests/core-product-convergence.test.mjs tools/tests/service-worker.test.mjs
```

Expected: PASS；`file://` 仍只提示双击 `start.command`，localhost 只请求 8765，Preview/production 同源逻辑不变。

- [ ] **Step 8: 提交**

```sh
git add index.html tools/tests/frontend-recipe-contract.test.mjs
git commit -m "Connect frontend to planner v2"
```

## Task 12: 固化 44 条真实用户旅程和成本不变量

**Files:**

- Create: `tools/data/pantry-planner-v2-journeys.json`
- Create: `tools/tests/pantry-planner-v2-journeys.test.mjs`
- Create: `tools/run-pantry-planner-v2-journeys.mjs`

- [ ] **Step 1: 把规格 44 条旅程写成机器 corpus**

每条包含完整请求、期望状态、覆盖下限、锅数上限、未规划 reason、允许 template/slot 条件、DeepSeek 调用上限。Corpus 必须包含规格第 22 节全部场景，不能用单元函数测试替代。

```json
{
  "id": "J02-four-item-pantry",
  "request": {
    "schema_version": 2,
    "planner_version": "pantry-planner-v2",
    "constraints": {
      "mode": "pantry",
      "intent": "normal",
      "servings": 2,
      "must_use": ["番茄", "金针菇", "鸡蛋", "西兰花"],
      "prefer_use": [],
      "dislikes": []
    }
  },
  "expect": {
    "status": ["complete", "needs_user_decision"],
    "minimum_items_per_pot": 2,
    "single_item_solution_forbidden": true,
    "plan_deepseek_calls": 0
  }
}
```

- [ ] **Step 2: 写 runner 红灯测试**

Runner 必须对 44 条 corpus 全部通过 `worker.fetch(new Request('/plan-meal'))` 调真实 HTTP 契约，而不是直接测 helper。涉及生成边界的旅程继续请求 `/generate-plan`；涉及页面承诺与用户动作的旅程使用与 `frontend-recipe-contract.test.mjs` 相同的 VM/DOM 夹具驱动 `index.html` 状态和点击事件，验证用户实际看到的文案与下一请求。Helper 单元测试只能作为补充，不能替代这三层旅程。

- [ ] **Step 3: 运行并确认红灯**

Run: `node --test tools/tests/pantry-planner-v2-journeys.test.mjs`

Expected: FAIL，corpus/runner 尚不存在或部分旅程未满足。

- [ ] **Step 4: 补齐 runner 的所有断言**

必须至少对以下类型分别计数并输出：taxonomy/shape、recommend 取舍、pantry 覆盖、多锅、decision、intent/swap、模型越界、版本/旧协议。最终输出固定为 `44/44 planner v2 journeys passed`。

- [ ] **Step 5: 运行完整旅程**

Run:

```sh
node --test tools/tests/pantry-planner-v2-journeys.test.mjs
node tools/run-pantry-planner-v2-journeys.mjs
```

Expected: PASS，并输出 `44/44 planner v2 journeys passed`；所有 `/plan-meal` 路径调用数为 0，所有 `/generate-plan` 路径为 0 或 1 且无自动重试。

- [ ] **Step 6: 提交**

```sh
git add tools/data/pantry-planner-v2-journeys.json tools/tests/pantry-planner-v2-journeys.test.mjs tools/run-pantry-planner-v2-journeys.mjs
git commit -m "Add planner v2 journey gate"
```

## Task 13: 把新数据闸门纳入总检查、健康检查和部署文档

**Files:**

- Modify: `tools/check-recipes.mjs`
- Modify: `tools/tests/recipe-library.test.mjs`
- Modify: `worker/src/worker.js`
- Modify: `部署说明.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: 写总闸门和 health 红灯测试**

测试要求 `check-recipes` 同时验证 taxonomy、Ratio DSL、templates 与 evidence recipe IDs；`/health` 返回：

```json
{
  "plannerVersion": "pantry-planner-v2",
  "templateCatalogVersion": "templates-v2-20260724",
  "ingredientTaxonomyVersion": "taxonomy-v1-20260724",
  "activeTemplates": 8,
  "plannedTemplates": 7,
  "baseRecipes": 72
}
```

- [ ] **Step 2: 运行并确认红灯**

Run:

```sh
node --test tools/tests/recipe-library.test.mjs tools/tests/worker-planner-v2.test.mjs
```

Expected: FAIL，现有总闸门与 health 未报告 planner 数据。

- [ ] **Step 3: 集成离线 validator**

`tools/check-recipes.mjs` 在既有菜谱检查之后读取三份新数据并运行三个 validator；任一错误 exit 1。成功摘要必须同时报告 `72 recipes / 8 active templates / 7 planned templates / taxonomy ok / ratio DSL ok`。

- [ ] **Step 4: 更新文档但明确不部署**

`部署说明.md` 和 `CLAUDE.md` 只更新未来构建/检查步骤：统一使用 `node tools/build-dist.mjs`，列出三个 planner 资产和新 gate；不得写入本次已部署或可直接 production 的表述。保留 Phase A Preview 限制。

- [ ] **Step 5: 运行聚焦检查**

Run:

```sh
node tools/check-recipes.mjs
node --test tools/tests/recipe-library.test.mjs tools/tests/worker-planner-v2.test.mjs
```

Expected: PASS，72 道 recipe 数量不变，8/7 template 状态精确。

- [ ] **Step 6: 提交**

```sh
git add tools/check-recipes.mjs tools/tests/recipe-library.test.mjs worker/src/worker.js 部署说明.md CLAUDE.md
git commit -m "Integrate planner v2 validation gates"
```

## Task 14: 全量回归、构建一致性与 Draft PR 收口

**Files:**

- Modify only if a failing test reveals an in-scope V2 defect; do not change recipes.

- [ ] **Step 1: 先确认菜谱库没有被修改**

Run:

```sh
git diff --exit-code f694c5b -- tools/data/recipe-library.json
node -e "const x=require('./tools/data/recipe-library.json'); if(x.recipes.length!==72) throw new Error('recipe count drift'); console.log('72 recipes unchanged')"
```

Expected: 无 diff，输出 `72 recipes unchanged`。

- [ ] **Step 2: 运行全部 Node 测试**

Run: `node --test tools/tests/*.test.mjs`

Expected: 0 failures；总数高于实施前 427，新增 V2 测试全部计入。

- [ ] **Step 3: 运行所有离线数据与回归门禁**

Run:

```sh
node tools/check-foods.mjs
node tools/check-recipes.mjs
node tools/run-recipe-regression.mjs
node tools/run-coverage-recipe-regression.mjs
node tools/run-pantry-planner-v2-journeys.mjs
```

Expected: foods 0 errors；recipes/planner gate 全绿；原回归 `100/100 static cases passed`；覆盖回归保持既有全绿；V2 输出 `44/44 planner v2 journeys passed`。

- [ ] **Step 4: 运行语法与构建一致性检查**

Run:

```sh
node --check worker/src/worker.js
node --check worker/src/planner-v2.js
python3 -m py_compile ai_proxy.py
node --test tools/tests/build-dist.test.mjs
node tools/build-dist.mjs --out-dir dist/planner-v2-final --build-id planner-v2-final
git diff --check
```

Expected: 全部 exit 0；构建测试证明源文件与 dist 资产一致，只有 build ID 注入是受控差异。

- [ ] **Step 5: 做负向成本审计**

Run:

```sh
node --test --test-name-pattern="zero DeepSeek|no retry|stale|needs_user_decision|no_alternative" tools/tests/worker-planner-v2.test.mjs tools/tests/worker-generate-plan.test.mjs tools/tests/pantry-planner-v2-journeys.test.mjs
```

Expected: PASS；无失败路径意外调用 DeepSeek 或消耗生成预算。

- [ ] **Step 6: 更新 Draft PR，不部署、不合并**

```sh
git status --short
git push origin codex/targeted-recipe-expansion
gh pr view 1 --json isDraft,state,headRefName,url
```

Expected: 工作树干净；PR #1 `isDraft:true`、`state:OPEN`、head 为当前分支。禁止运行 Wrangler、禁止 merge。

## Final Acceptance Checklist

- [ ] `mode` 与 `intent` 正交，V1 映射通过。
- [ ] taxonomy 同时承载 category、cook speed、moisture、shape/cut、texture、risk。
- [ ] 15 个模板均机器可验，只有 8 个 active。
- [ ] Ratio DSL 决定克数与液体，LLM 不解释比例。
- [ ] recommend 诚实展示 planned/unused，pantry 仅在全部 must-use 覆盖时 complete。
- [ ] 未识别 must-use 进入 unplanned 并阻止 complete。
- [ ] needs decision 保留 pots，0 DeepSeek；partial accepted 保留未处理食材。
- [ ] 默认最多两锅，第三锅需确认，绝对上限三锅。
- [ ] swap 生成不同有效 plan，不能只换文案；无替代有专属路径。
- [ ] `plan_id` 只由规范化计划事实 SHA-256 得出。
- [ ] `/plan-meal` 0 DeepSeek；`/generate-plan` 最多一次且不重试。
- [ ] 模型不能新增、删除、替换或改克数；越界硬失败。
- [ ] Worker、Python、本地页面 parity 通过。
- [ ] 44/44 真实旅程、全部既有测试、100/100 回归、构建一致性全绿。
- [ ] recipe 库仍为 72 道，无新功能、无部署、Draft PR 未合并。

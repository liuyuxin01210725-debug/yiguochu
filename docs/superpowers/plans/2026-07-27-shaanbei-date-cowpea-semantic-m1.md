# Shaanbei Date Cowpea Ingredient Semantics M1 Implementation Plan

> **For implementation:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This run uses inline execution; do not create subagents unless the user later explicitly requests them.

**Goal:** 纠正 Planner 把裸词“豇豆”当作生鲜豆角的错误，在不新增 recipe、template 或 Ratio DSL 的前提下，建立鲜豆荚、干豆粒、熟豆粒、去核红枣和歧义输入的可解释机器语义。

**Architecture:** `ingredient-taxonomy.v1.json` 继续作为食材身份的唯一机器真源，并新增受 validator 约束的 `ambiguous_inputs`。Planner 只依据 taxonomy 做精确识别，把歧义项保留为 `recognized:false` 并返回结构化解释；前端只展示服务端事实。现有 recipe 仍只作 evidence，template 与 Ratio DSL 不因 M1 扩大运行时组合面。

**Tech Stack:** JSON 机器资产、Cloudflare Pages Functions ES modules、Node.js 内置 `node:test`、Python 3 本地 bridge、单文件移动端前端、确定性 Markdown/JSON/CSV 构建器。

## Global Constraints

- [ ] 以 `docs/superpowers/specs/2026-07-27-shaanbei-date-cowpea-semantic-m1-design.md` 为唯一产品契约。
- [ ] `tools/data/recipe-library.json` 保持 72 道：12 `approved` + 60 `auto_approved`；不得新增、删除或修改 recipe。
- [ ] Template catalog 保持 `templates-v2-20260727-r8`、16 个模板、10 active + 6 planned；不得修改模板资产。
- [ ] Ratio catalog 保持 `ratio-rules-v1-20260727-r4` 且规则数量不变；不得修改 Ratio DSL 资产。
- [ ] Taxonomy 目标版本固定为 `taxonomy-v1-20260727-r8`。
- [ ] “豆角”与“鲜豇豆”同属 `pod_vegetable`，但 canonical identity 不合并。
- [ ] 裸词“豇豆”“红枣”“大枣”不得静默映射到某个确定状态。
- [ ] 歧义 must-use 必须阻止 pantry `complete` 和 DeepSeek 生成；recommend 必须诚实显示 unused 原因。
- [ ] `plan_id` 必须纳入 `ambiguity_id`、`ambiguity_code` 和排序去重后的 `eligible_items`；同一歧义组的 aliases 只能占一个覆盖分母。
- [ ] 公共旅程目标固定为 116/116，新增 J109–J116。
- [ ] 每个行为修改先写失败测试并观察有效红灯，再写最小实现。
- [ ] 只更新 Draft PR #1；不部署 Preview 或 production，不合并 PR。

---

## File Responsibility Map

- `tools/data/ingredient-taxonomy.v1.json`：四个新 canonical identity、`ambiguous_inputs` 和 taxonomy r8 的唯一机器数据。
- `worker/src/ingredient-taxonomy-validator.js`：taxonomy r8、新有限词表、root schema 和 ambiguity 引用完整性。
- `worker/src/planner-v2.js`：ambiguity 索引、normalized item 字段、unplanned 原因、plan identity 和 pantry/recommend 行为。
- `tools/tests/ingredient-taxonomy.test.mjs`：身份拆分、歧义表、validator 正反例。
- `tools/tests/pantry-planner-v2-selection.test.mjs`：pantry/recommend 覆盖、生成暂停和旧豆角语义不回归。
- `tools/tests/pantry-planner-v2-identity.test.mjs`：ambiguity 字段参与 `plan_id`。
- `tools/tests/frontend-recipe-contract.test.mjs`：needs-user-decision 文案、原输入和 pots 保留。
- `tools/tests/planner-v2-parity.test.mjs`：Worker、Python CLI 和本地 HTTP bridge 的 byte-semantic parity。
- `tools/data/pantry-planner-v2-journeys.json`、`tools/run-pantry-planner-v2-journeys.mjs`：J109–J116 公共旅程和 116 条门禁。
- `tools/tests/planner-menu-coverage-builder.test.mjs`：陕北不超过 1/3、西北保持 2/3。
- `tools/generated/planner-menu-coverage.v1.json`、`docs/planner-menu-coverage.md`：taxonomy r8 下的确定性覆盖产物。
- `tools/generated/menu-master.v1.json`、`docs/menu-master.md`、`docs/menu-master.csv`：待核实角色与 taxonomy hash 的确定性产物。
- `CLAUDE.md`、`部署说明.md`、`tools/tests/worker-planner-v2.test.mjs`：r8、116/116 与 Draft 边界闭包。

---

### Task 1: 用红灯锁住四种身份和两种歧义

**Files:**

- Modify: `tools/tests/ingredient-taxonomy.test.mjs`
- Modify: `tools/tests/pantry-planner-v2-selection.test.mjs`
- Modify: `tools/tests/pantry-planner-v2-identity.test.mjs`

**Interfaces:**

- Consumes: `normalizePlannerItems(rawItems, taxonomy)`、`validateIngredientTaxonomy(data)`、`planMeal(assets, request)`、`computePlanId(plan)`。
- Produces: taxonomy r8、identity split、ambiguity response 和 plan-id 语义的有效失败测试。

- [ ] **Step 1: 写 taxonomy r8 和 identity split 失败测试**

在 `tools/tests/ingredient-taxonomy.test.mjs` 把版本断言改为 r8，并增加：

```js
test('cowpea pod dry seed cooked seed and generic term never collapse', () => {
  const rows = normalizePlannerItems(
    ['鲜豇豆','长豇豆','豆角','干豇豆','熟豇豆','豇豆'], catalog,
  );
  assert.deepEqual(
    rows.slice(0, 5).map(row => [row.canonical_id, row.category, row.recognized]),
    [
      ['fresh-cowpea-pod','pod_vegetable',true],
      ['fresh-cowpea-pod','pod_vegetable',true],
      ['green-beans','pod_vegetable',true],
      ['dry-cowpea-seed','dry_legume',true],
      ['cooked-cowpea-seed','cooked_legume',true],
    ],
  );
  assert.equal(rows[5].recognized, false);
  assert.equal(rows[5].ambiguity_id, 'cowpea-state');
  assert.equal(rows[5].ambiguity_code, 'ambiguous_ingredient_state');
  assert.deepEqual(rows[5].eligible_items, ['鲜豇豆','干豇豆','熟豇豆']);
});

test('pitted jujube is explicit while red date and jujube remain ambiguous', () => {
  const [pitted, alias, redDate, jujube] = normalizePlannerItems(
    ['去核红枣','去核大枣','红枣','大枣'], catalog,
  );
  for (const row of [pitted, alias]) {
    assert.deepEqual(
      [row.canonical_id,row.category,row.shape_or_cut,row.cooking_risk],
      ['pitted-dried-jujube','dried_fruit','pitted','pit_hazard'],
    );
    assert.deepEqual(row.required_endpoint_codes, ['pit_absent_verified']);
  }
  for (const row of [redDate, jujube]) {
    assert.equal(row.recognized, false);
    assert.equal(row.ambiguity_id, 'jujube-pit-state');
    assert.equal(row.ambiguity_code, 'ambiguous_ingredient_state');
    assert.deepEqual(row.eligible_items, ['去核红枣']);
  }
});

test('ambiguity aliases deduplicate without inflating the pantry denominator', () => {
  const [first, alias] = normalizePlannerItems(['红枣','大枣'], catalog);
  assert.equal(first.duplicate_of, null);
  assert.equal(alias.duplicate_of, '红枣');
});
```

- [ ] **Step 2: 写 ambiguity schema 失败测试**

```js
test('ambiguity schema is finite referenced and collision free', () => {
  assert.deepEqual(validateIngredientTaxonomy(catalog), []);

  const unknownTarget = structuredClone(catalog);
  unknownTarget.ambiguous_inputs[0].eligible_items = ['不存在的食材'];
  assert.match(validateIngredientTaxonomy(unknownTarget).join('\n'), /eligible_items.*existing display_name/);

  const aliasCollision = structuredClone(catalog);
  aliasCollision.items.find(item => item.canonical_id === 'green-beans').aliases.push('豇豆');
  assert.match(validateIngredientTaxonomy(aliasCollision).join('\n'), /ambiguity.*conflict/);

  const unknownRoot = structuredClone(catalog);
  unknownRoot.extra_prompt = 'guess';
  assert.match(validateIngredientTaxonomy(unknownRoot).join('\n'), /unknown taxonomy field: extra_prompt/);
});
```

再加负例：重复规范化 ambiguity、非法 reason code、空 reason、空 eligible list、eligible target 指向 alias 而非 display name，全部必须返回字符串错误而不是抛异常。

- [ ] **Step 3: 写 pantry/recommend 行为失败测试**

在 `tools/tests/pantry-planner-v2-selection.test.mjs` 增加：

```js
test('ambiguous cowpea blocks pantry completion without hiding the existing pot', () => {
  const result = planMeal(assets, request({ must:['大米','去核红枣','豇豆'] }));
  assert.equal(result.status, 'needs_user_decision');
  assert.equal(result.generation_allowed, false);
  assert.ok(result.plan.pots.length >= 1);
  assert.ok(result.plan.coverage_ratio <= 1 / 3);
  const row = result.plan.unplanned_must_use.find(item => item.raw === '豇豆');
  assert.equal(row.reason_code, 'ambiguous_ingredient_state');
  assert.deepEqual(row.eligible_items, ['鲜豇豆','干豇豆','熟豇豆']);
});

test('recommend may use a coherent subset but explains both unresolved ingredients', () => {
  const result = planMeal(assets, request({
    mode:'recommend', must:[], prefer:['大米','去核红枣','豇豆','鸡腿肉'],
  }));
  assert.equal(result.status, 'ready');
  assert.ok(result.plan.planned_prefer_use.some(item => item.raw === '大米'));
  for (const raw of ['去核红枣','豇豆']) {
    const row = result.plan.unused_prefer_use.find(item => item.raw === raw);
    assert.ok(row?.reason_code && row?.reason, raw);
  }
});
```

- [ ] **Step 4: 写 plan identity 失败测试**

在 `tools/tests/pantry-planner-v2-identity.test.mjs` 的 identity facts 表加入：

```js
ambiguity_code: plan => {
  plan.normalized_items[0].ambiguity_code = 'ambiguous_ingredient_state';
},
ambiguity_id: plan => {
  plan.normalized_items[0].ambiguity_id = 'cowpea-state';
},
ambiguity_options: plan => {
  plan.normalized_items[0].eligible_items = ['鲜豇豆','干豇豆','熟豇豆'];
},
```

另加断言：只调换 `eligible_items` 顺序不改变 ID，删除一个选项必须改变 ID。

- [ ] **Step 5: 运行聚焦测试并确认有效红灯**

```sh
node --test tools/tests/ingredient-taxonomy.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs \
  tools/tests/pantry-planner-v2-identity.test.mjs
```

Expected: FAIL，原因必须是旧 taxonomy 版本、缺少 identities／ambiguity schema、豇豆仍命中 `green-beans` 或 ambiguity 未进入 plan identity；测试语法错误不算有效红灯。

- [ ] **Step 6: 提交红灯测试**

```sh
git add tools/tests/ingredient-taxonomy.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs \
  tools/tests/pantry-planner-v2-identity.test.mjs
git commit -m "test: define cowpea and jujube semantics"
```

---

### Task 2: 实现 taxonomy r8 与 Planner 歧义语义

**Files:**

- Modify: `tools/data/ingredient-taxonomy.v1.json`
- Modify: `worker/src/ingredient-taxonomy-validator.js`
- Modify: `worker/src/planner-v2.js`

**Interfaces:**

- Consumes: Task 1 红灯。
- Produces: `ambiguous_inputs` 机器 schema、四个 canonical identities、`normalizePlannerItems()` 歧义字段、结构化 unplanned 原因和稳定 plan ID。

- [ ] **Step 1: 更新 taxonomy r8 机器数据**

把 `taxonomy_version` 改为 `taxonomy-v1-20260727-r8`；从 `green-beans.aliases` 删除“豇豆”，保持：

```json
"aliases": ["四季豆", "普通豆角"]
```

四个 identity 必须精确按下表落地；不得增加“豇豆”“红枣”“大枣” canonical alias，也不得为它们增加 `canonical_required`：

| canonical_id | display / aliases | category / state / shape | cook / moisture | texture behavior | best methods | failure modes | risk / endpoints | compatible / incompatible |
|---|---|---|---|---|---|---|---|---|
| `fresh-cowpea-pod` | 鲜豇豆 / 长豇豆、豇豆角 | `pod_vegetable` / `raw` / `whole,slice` | `medium` / `medium` | `softens_with_simmering` | `simmer,braise` | `firm_when_undercooked` | `none` / `bean_fully_cooked` | `vegetable` / `dry_legume_required,cooked_legume_required` |
| `dry-cowpea-seed` | 干豇豆 / 干豇豆米 | `dry_legume` / `dry` / `whole_seed` | `slow` / `low` | `absorbs_liquid` | `hydrate,long_simmer` | `firm_when_undercooked` | `raw_legume` / `legume_fully_cooked` | `legume_preparation_input` / `vegetable,cooked_legume_required` |
| `cooked-cowpea-seed` | 熟豇豆 / 煮熟豇豆 | `cooked_legume` / `cooked` / `whole_seed` | `fast` / `medium` | `reheats_without_breaking` | `short_simmer` | `mushy_when_overmixed` | `none` / `heated_through` | `cooked_legume` / `vegetable,dry_legume_required` |
| `pitted-dried-jujube` | 去核红枣 / 去核大枣 | `dried_fruit` / `dry` / `pitted` | `medium` / `low` | `absorbs_liquid` | `simmer,braise` | `tough_when_undercooked` | `pit_hazard` / `pit_absent_verified` | `dried_fruit_accent` / 空数组 |

两个 `ambiguous_inputs` 必须精确为：

| ambiguity_id | input / aliases | reason_code | reason | eligible_items |
|---|---|---|---|---|
| `cowpea-state` | 豇豆 / 空数组 | `ambiguous_ingredient_state` | `“豇豆”可能指鲜豆荚、干豆粒或熟豆粒，请写得更具体。` | 鲜豇豆、干豇豆、熟豇豆 |
| `jujube-pit-state` | 红枣 / 大枣 | `ambiguous_ingredient_state` | `红枣是否去核会影响物理安全，请确认后改写为“去核红枣”。` | 去核红枣 |

- [ ] **Step 2: 扩展 validator 有限词表**

在 `worker/src/ingredient-taxonomy-validator.js` 增加：

```js
CATEGORIES: 'dry_legume', 'cooked_legume', 'dried_fruit'
STATES: 'dry'
SHAPES: 'whole_seed', 'pitted'
RISK_CODES: 'raw_legume', 'pit_hazard'
ENDPOINT_CODES: 'legume_fully_cooked', 'pit_absent_verified'
SLOT_CODES: 'dry_legume_required', 'cooked_legume_required',
            'legume_preparation_input', 'cooked_legume', 'dried_fruit_accent'
```

版本断言改为 r8。不得放宽其他有限词表。

- [ ] **Step 3: 实现 root 和 ambiguity 验证**

增加总函数而不是把判断散在 Planner：

```js
function validateAmbiguousInputs(data, displayEntries, aliasEntries, errors) {
  const rows = data.ambiguous_inputs;
  if (!Array.isArray(rows) || rows.length === 0) {
    errors.push('ambiguous_inputs must be a non-empty array');
    return;
  }
  const seen = new Set();
  const seenIds = new Set();
  for (const [index, row] of rows.entries()) {
    const label = `ambiguous_inputs[${index}]`;
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      errors.push(`${label} must be an object`);
      continue;
    }
    const allowed = new Set(['ambiguity_id','input','aliases','reason_code','reason','eligible_items']);
    for (const key of Object.keys(row)) if (!allowed.has(key)) errors.push(`${label}.${key} is unknown`);
    const aliases = row.aliases == null ? [] : row.aliases;
    if (typeof row.ambiguity_id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.ambiguity_id)
      || seenIds.has(row.ambiguity_id)) errors.push(`${label}.ambiguity_id must be unique kebab-case`);
    else seenIds.add(row.ambiguity_id);
    if (typeof row.input !== 'string' || !row.input.trim()) errors.push(`${label}.input must be non-empty`);
    if (!Array.isArray(aliases) || !aliases.every(value => typeof value === 'string' && value.trim())) {
      errors.push(`${label}.aliases must be a string array`);
    }
    if (row.reason_code !== 'ambiguous_ingredient_state') errors.push(`${label}.reason_code is invalid`);
    if (typeof row.reason !== 'string' || !row.reason.trim() || row.reason.length > 160) {
      errors.push(`${label}.reason must be 1-160 characters`);
    }
    if (!Array.isArray(row.eligible_items) || row.eligible_items.length === 0
      || !row.eligible_items.every(value => typeof value === 'string' && value.trim())) {
      errors.push(`${label}.eligible_items must be a non-empty string array`);
    } else {
      for (const target of row.eligible_items) {
        if (!displayEntries.has(normalizeIngredientTaxonomyKey(target))) {
          errors.push(`${label}.eligible_items must name an existing display_name`);
        }
      }
    }
    for (const input of [row.input, ...(Array.isArray(aliases) ? aliases : [])]) {
      if (typeof input !== 'string' || !input.trim()) continue;
      const key = normalizeIngredientTaxonomyKey(input);
      if (seen.has(key)) errors.push(`duplicate normalized ambiguity input: ${key}`);
      seen.add(key);
      if (displayEntries.has(key) || aliasEntries.has(key)) errors.push(`ambiguity input conflicts with canonical identity: ${key}`);
    }
  }
}
```

实际实现必须写出完整键集合和所有规格约束；不能保留注释占位。Root 只允许 `taxonomy_version`、`items`、`ambiguous_inputs`。

- [ ] **Step 4: 在 Planner 中建立 ambiguity 索引**

```js
function taxonomyAmbiguityIndex(taxonomy = {}) {
  const index = new Map();
  for (const row of taxonomy.ambiguous_inputs || []) {
    for (const input of [row.input, ...(row.aliases || [])]) {
      index.set(normalizeIngredientTaxonomyKey(input), row);
    }
  }
  return index;
}
```

`normalizePlannerItems()` 同时查询 identity index 和 ambiguity index。Identity 精确命中优先；validator 已保证二者无冲突。未识别且命中 ambiguity 时返回：

```js
{
  raw,
  canonical_id:null,
  canonical:null,
  ratio_rule_policy:null,
  category:null,
  shape_or_cut:null,
  cook_speed:null,
  moisture_release:null,
  texture_behavior:null,
  cooking_risk:'unknown',
  recognized:false,
  ambiguity_code:ambiguity.reason_code,
  ambiguity_id:ambiguity.ambiguity_id,
  ambiguity_reason:ambiguity.reason,
  eligible_items:[...ambiguity.eligible_items],
  role,
  duplicate_of:null,
}
```

普通未知项使用 `ambiguity_id:null`、`ambiguity_code:null`、`ambiguity_reason:null`、`eligible_items:[]`；已识别项也显式返回这四个空值，保证响应 shape 稳定。

代表项去重键使用 `item.canonical_name || item.display_name`；未识别歧义项使用 `ambiguity:${ambiguity.ambiguity_id}`。因此 ambiguity aliases 与 canonical aliases 一样，第一项为代表项，后续项设置 `duplicate_of`。

- [ ] **Step 5: 让结构化原因优先于普通未知原因**

在 `unusedReason()` 和 `fallbackUnplannedReason()` 的 `!item.recognized` 分支前增加：

```js
if (item.ambiguity_code === 'ambiguous_ingredient_state') return {
  ...structuredClone(item),
  reason_code:item.ambiguity_code,
  reason:item.ambiguity_reason,
  eligible_items:[...item.eligible_items],
};
```

`UNPLANNED_REASON_PRIORITY` 把 `ambiguous_ingredient_state` 放在 `unrecognized_ingredient` 前；`reasonForUnplanned()` 的 specific set 也加入它，避免容量原因覆盖真实歧义。

- [ ] **Step 6: 把 ambiguity 纳入 plan identity**

`identityIngredient()` 增加：

```js
ambiguity_code: identityText(item.ambiguity_code),
ambiguity_id: identityText(item.ambiguity_id),
eligible_items: identityStringArray(item.eligible_items),
```

不把用户文案 `ambiguity_reason` 放进 ID；机器 reason code 和选项决定计划身份，文案可独立校正。

- [ ] **Step 7: 运行 Task 1 聚焦测试**

```sh
node --test tools/tests/ingredient-taxonomy.test.mjs \
  tools/tests/pantry-planner-v2-selection.test.mjs \
  tools/tests/pantry-planner-v2-identity.test.mjs
```

Expected: 全部 PASS。

- [ ] **Step 8: 提交 taxonomy 与 Planner**

```sh
git add tools/data/ingredient-taxonomy.v1.json \
  worker/src/ingredient-taxonomy-validator.js worker/src/planner-v2.js
git commit -m "feat: distinguish cowpea and jujube states"
```

---

### Task 3: 锁住前端解释和 Worker/Python parity

**Files:**

- Modify: `tools/tests/frontend-recipe-contract.test.mjs`
- Modify: `tools/tests/planner-v2-parity.test.mjs`
- Modify only if the red test proves copy is insufficient: `index.html`

**Interfaces:**

- Consumes: Task 2 的 normalized ambiguity response。
- Produces: 移动端可理解的 needs-user-decision 页面、原输入保留、Worker/Python/HTTP 一致和 health r8。

- [ ] **Step 1: 写前端失败测试**

在 `tools/tests/frontend-recipe-contract.test.mjs` 复用 `plannerResult()` 和 `loadFrontend()`：

```js
test('ingredient ambiguity reads as a quality guard and preserves the raw input', async () => {
  const planned = plannerResult({
    status:'needs_user_decision', generation_allowed:false, mode:'pantry',
    commitment:'需要先确认食材状态，系统才能保证这锅做得合理。',
    normalized_items:[
      {raw:'大米',canonical:'大米',recognized:true,role:'must_use'},
      {raw:'豇豆',canonical:null,recognized:false,role:'must_use',
       ambiguity_code:'ambiguous_ingredient_state',eligible_items:['鲜豇豆','干豇豆','熟豇豆']},
    ],
    plan:{
      unplanned_must_use:[{raw:'豇豆',canonical:null,reason_code:'ambiguous_ingredient_state',
        reason:'“豇豆”可能指鲜豆荚、干豆粒或熟豆粒，请写得更具体。',
        eligible_items:['鲜豇豆','干豇豆','熟豇豆']}],
      coverage_ratio:0.5,
    },
  });
  const { context, calls, root } = loadFrontend([{body:planned}]);
  await evaluate(context, `runPlannerFlow({ autoGenerate:true })`);
  assert.equal(calls.length, 1);
  assert.match(root.innerHTML, /需要先确认食材状态/);
  assert.match(root.innerHTML, /豇豆.*鲜豆荚.*干豆粒.*熟豆粒/);
  assert.doesNotMatch(root.innerHTML, /生成失败|全部安排完成/);
  assert.equal(evaluate(context, 'state.profile.pantry.includes("豇豆")'), true);
});
```

- [ ] **Step 2: 运行前端测试观察红灯**

```sh
node --test tools/tests/frontend-recipe-contract.test.mjs
```

Expected: 若现有 renderer 已完整展示结构化 reason，则测试直接 PASS，不为制造红灯改代码；此时测试本身记录已有正确行为。若失败，只允许因缺少明确质量保护文案或原输入丢失。

- [ ] **Step 3: 仅在需要时补最小前端文案**

若 Step 2 证明通用 commitment 不足，在 `plannerDecisionHtml()` 的标题选择中增加：

```js
const hasAmbiguousIngredient = unplanned.some(item => item.reason_code === 'ambiguous_ingredient_state');
const heading = hasAmbiguousIngredient ? '需要确认一种食材' : '还差一个决定';
```

继续使用现有 escaped `item.reason`；不新增自由 HTML、不让前端重算 taxonomy、不自动替换用户输入。

- [ ] **Step 4: 写 Worker/Python parity 失败测试**

在 `tools/tests/planner-v2-parity.test.mjs` 增加：

```js
test('cowpea ambiguity and explicit states are identical across Worker and Python bridge', async () => {
  for (const must of [
    ['大米','去核红枣','豇豆'],
    ['大米','去核红枣','干豇豆'],
    ['大米','去核红枣','熟豇豆'],
  ]) {
    const req = request({must});
    const workerResult = await workerPlan(req);
    const pythonResult = pythonPlan(req);
    assert.equal(workerResult.status, 200);
    assert.deepEqual(pythonResult, workerResult.body);
  }
});
```

再增加本地 HTTP `/plan-meal` 断言：歧义请求 0 rate write、0 upstream call、`generation_allowed:false`。

- [ ] **Step 5: 运行前端与 parity 测试**

```sh
node --test tools/tests/frontend-recipe-contract.test.mjs \
  tools/tests/planner-v2-parity.test.mjs
python3 -m py_compile ai_proxy.py
```

Expected: 全部 PASS。`worker-planner-v2.test.mjs` 可以只保留预期的部署文档版本红灯到 Task 5。

- [ ] **Step 6: 提交体验与 parity**

```sh
git add tools/tests/frontend-recipe-contract.test.mjs \
  tools/tests/planner-v2-parity.test.mjs index.html
git commit -m "test: lock ambiguous pantry explanations"
```

如果 `index.html` 没有变化，不得为了匹配命令而触碰它，提交时从 `git add` 列表删除。

---

### Task 4: 增加 J109–J116 并纠正覆盖账本

**Files:**

- Modify: `tools/tests/pantry-planner-v2-journeys.test.mjs`
- Modify: `tools/data/pantry-planner-v2-journeys.json`
- Modify: `tools/run-pantry-planner-v2-journeys.mjs`
- Modify: `tools/tests/planner-menu-coverage-builder.test.mjs`
- Regenerate: `tools/generated/planner-menu-coverage.v1.json`
- Regenerate: `docs/planner-menu-coverage.md`
- Regenerate: `tools/generated/menu-master.v1.json`
- Regenerate: `docs/menu-master.md`
- Regenerate: `docs/menu-master.csv`

**Interfaces:**

- Consumes: Task 2/3 的 r8 runtime facts。
- Produces: 116 条公共旅程与诚实的陕北／西北覆盖派生产物。

- [ ] **Step 1: 先写 116 条门禁红灯**

把 `tools/tests/pantry-planner-v2-journeys.test.mjs` 的 corpus、passed 和 CLI 断言改为 116；`regional_capability` 从 64 改为 72：

```js
assert.equal(corpus.journeys.length, 116);
assert.deepEqual(corpus.journeys.map(entry => entry.spec_number),
  Array.from({length:116}, (_, index) => index + 1));
assert.equal(new Set(corpus.journeys.map(entry => entry.id)).size, 116);
assert.equal(result.passed, 116);
assert.match(result.stdout, /116\/116 planner v2 journeys passed/);
```

- [ ] **Step 2: 运行并观察 corpus 数量红灯**

```sh
node --test tools/tests/pantry-planner-v2-journeys.test.mjs
```

Expected: FAIL，实际仍为 108。

- [ ] **Step 3: 添加 J109–J116**

按下表精确添加，不得把 identity 旅程改成新组合能力。每条必须包含完整 V2 request、`plan_deepseek_max:0`、`generate_deepseek_max:0`、`frontend_required` 和 `model_mutation:null`：

| ID | mode / input | status | 必锁事实 | 前端 |
|---|---|---|---|---|
| J109 | recommend / `prefer_use:["鲜豇豆"]` | `ready` | normalized 为 `fresh-cowpea-pod` / `pod_vegetable` / `raw` / `bean_fully_cooked`，不得为 `green-beans` | false |
| J110 | recommend / `prefer_use:["长豇豆","豆角"]` | `ready` | 长豇豆为 `fresh-cowpea-pod`；豆角为 `green-beans`；两者不得去重成一项 | false |
| J111 | pantry / `must_use:["干豇豆","熟豇豆"]` | `no_valid_plan` 或 `needs_user_decision` | 两者 canonical ID、state、cook speed 不同；均进 unplanned；`complete_forbidden:true`；`generation_allowed:false` | false |
| J112 | pantry / `must_use:["大米","去核红枣","豇豆"]` | `needs_user_decision` | 豇豆为 `cowpea-state`，三个 eligible items，进 unplanned，保留已确定 pot，`complete_forbidden:true`，`generation_allowed:false` | false |
| J113 | pantry / `must_use:["去核红枣"]` | `no_valid_plan` 或 `needs_user_decision` | normalized 为 `pitted-dried-jujube` / `pitted` / `pit_hazard` / `pit_absent_verified`，因无 active slot 进 unplanned | false |
| J114 | pantry / `must_use:["红枣","大枣"]` | `no_valid_plan` 或 `needs_user_decision` | 两个 raw 共享 `jujube-pit-state`，第二项 `duplicate_of:"红枣"`，语义分母为 1 | false |
| J115 | pantry / `must_use:["大米","红枣"]` | `needs_user_decision` | 红枣进 unplanned，`generation_allowed:false`，页面显示“需要确认食材状态”，不显示生成失败或全部完成 | true |
| J116 | recommend / `prefer_use:["大米","去核红枣","豇豆","鸡腿肉"]` | `ready` | 大米和鸡腿肉可进合理 pot；去核红枣与豇豆必须在 `unused_prefer_use` 中有结构化原因 | false |

J109–J116 的 request 共用 `schema_version:2`、`planner_version:"pantry-planner-v2"`、`intent:"normal"`、`servings:2`、`dislikes:[]`、`current_plan_id:null`、`recent_plan_ids:[]`、`decision:null`。表中 pantry 输入放入 `must_use`，recommend 输入放入 `prefer_use`，另一数组为空。

J112 的完整记录形状为：

```json
{
  "id":"J112",
  "spec_number":112,
  "title":"裸词豇豆保留状态歧义",
  "category":"regional_capability",
  "request":{"schema_version":2,"planner_version":"pantry-planner-v2","constraints":{"mode":"pantry","intent":"normal","servings":2,"must_use":["大米","去核红枣","豇豆"],"prefer_use":[],"dislikes":[],"current_plan_id":null,"recent_plan_ids":[],"decision":null}},
  "expect":{"status":["needs_user_decision"],"complete_forbidden":true,"generation_allowed":false,"normalized":{"raw":"豇豆","recognized":false,"ambiguity_code":"ambiguous_ingredient_state","eligible_items":["鲜豇豆","干豇豆","熟豇豆"]},"required_unplanned_raw":["豇豆"],"reason_codes":["ambiguous_ingredient_state"]},
  "plan_deepseek_max":0,
  "generate_deepseek_max":0,
  "frontend_required":false,
  "model_mutation":null
}
```

J115 使用已有 `visible_copy`、`generic_failure_forbidden` 和 `frontend_required:true`；J116 使用 `unused_reason_required:true`。不为这些旅程新增 metadata-only assertion key。

- [ ] **Step 4: 更新 runner 固定数量和摘要**

`validateCorpus()` 改为 116，摘要改为：

```js
console.log('116/116 planner v2 journeys passed');
```

不新增 metadata-only expectation；优先复用已有 `normalized`、`reason_codes`、`required_unplanned_raw`、`visible_copy`、`unused_reason_required` 等 assertion keys。

- [ ] **Step 5: 运行 116 条旅程**

```sh
node tools/run-pantry-planner-v2-journeys.mjs
node --test tools/tests/pantry-planner-v2-journeys.test.mjs
```

Expected: `116/116 planner v2 journeys passed`，测试全部 PASS。

- [ ] **Step 6: 先写覆盖账本红灯**

在 `tools/tests/planner-menu-coverage-builder.test.mjs` 增加：

```js
test('Shaanbei cowpea ambiguity is no longer counted as a fresh green-bean hit', () => {
  const report = buildRealReport();
  const shaanbei = byId(report, 'shaanbei-red-date-cowpea-rice');
  assert.equal(shaanbei.raw_core_scenario.status, 'needs_user_decision');
  assert.ok(shaanbei.raw_core_scenario.end_to_end_core_coverage_ratio <= 1 / 3);
  assert.ok(shaanbei.unclassified_core_items.some(row =>
    row.raw === '豇豆' && row.ambiguity_code === 'ambiguous_ingredient_state'));
  assert.equal(shaanbei.audit_status === 'full_single_pot_evidence_aligned', false);

  const northwest = report.by_region.find(row => row.region_id === 'northwest');
  assert.equal(northwest.recipe_count, 3);
  assert.equal(northwest.single_pot_full_count, 2);
});
```

先运行并确认旧报告逻辑或 fixture 假设失败，再只修 builder 对 ambiguity 字段的保留；不得写 recipe-ID 特例。

- [ ] **Step 7: 生成确定性派生产物**

```sh
node tools/build-menu-master.mjs --write
node tools/build-regional-atlas.mjs --write
node tools/build-planner-menu-coverage.mjs --write
```

若 regional atlas 内容未变化，Git 不应产生无意义 diff。不得手改生成 JSON、Markdown 或 CSV。

- [ ] **Step 8: 验证所有派生产物**

```sh
node --test tools/tests/planner-menu-coverage-builder.test.mjs \
  tools/tests/planner-menu-coverage-artifacts.test.mjs \
  tools/tests/menu-master-artifacts.test.mjs \
  tools/tests/regional-atlas-artifacts.test.mjs
node tools/build-menu-master.mjs --check
node tools/build-regional-atlas.mjs --check
node tools/build-planner-menu-coverage.mjs --check
```

Expected: 全部 PASS；菜单仍 72，西北完整单锅仍 2/3，陕北条目不得显示 covered。

- [ ] **Step 9: 提交旅程与覆盖闭环**

```sh
git add tools/tests/pantry-planner-v2-journeys.test.mjs \
  tools/data/pantry-planner-v2-journeys.json tools/run-pantry-planner-v2-journeys.mjs \
  tools/tests/planner-menu-coverage-builder.test.mjs \
  tools/generated/planner-menu-coverage.v1.json docs/planner-menu-coverage.md \
  tools/generated/menu-master.v1.json docs/menu-master.md docs/menu-master.csv
git commit -m "test: cover Shaanbei ingredient ambiguity"
```

---

### Task 5: 关闭版本、文档和全量门禁

**Files:**

- Modify: `CLAUDE.md`
- Modify: `部署说明.md`
- Modify: `tools/tests/worker-planner-v2.test.mjs`
- Modify only when deterministic builders require it: checked-in generated artifacts from Task 4

**Interfaces:**

- Consumes: Task 1–4 的 taxonomy r8、116 journeys 和生成产物。
- Produces: 当前 Draft PR 的可审计版本闭包和完整验证证据。

- [ ] **Step 1: 先写 health 与部署版本红灯**

把 `tools/tests/worker-planner-v2.test.mjs` 的当前版本与部署文档断言改为 taxonomy r8 和 116/116：

```js
assert.equal(result.body.templateCatalogVersion, 'templates-v2-20260727-r8');
assert.equal(result.body.ingredientTaxonomyVersion, 'taxonomy-v1-20260727-r8');
assert.equal(result.body.ratioRulesVersion, 'ratio-rules-v1-20260727-r4');
assert.match(deployment, /taxonomy-v1-20260727-r8/);
assert.match(deployment, /116\/116/);
```

运行：

```sh
node --test tools/tests/worker-planner-v2.test.mjs
```

Expected: health 资产断言 PASS，部署文档仍为 r7／108 的断言 FAIL。

- [ ] **Step 2: 更新唯一当前基线文档**

把 `CLAUDE.md` 与 `部署说明.md` 中当前 Draft 元数据改为：

```text
pantry-planner-v2
templates-v2-20260727-r8
taxonomy-v1-20260727-r8
ratio-rules-v1-20260727-r4
10 active templates
6 planned templates
72 evidence recipes
116/116 planner journeys
```

不得修改历史 specs/plans 中记录的旧基线，不得把 100/100 静态菜谱回归改成 116/116。

- [ ] **Step 3: 闭合 health 和部署文档测试**

`tools/tests/worker-planner-v2.test.mjs` 最终必须包含：

```js
assert.equal(result.body.templateCatalogVersion, 'templates-v2-20260727-r8');
assert.equal(result.body.ingredientTaxonomyVersion, 'taxonomy-v1-20260727-r8');
assert.equal(result.body.ratioRulesVersion, 'ratio-rules-v1-20260727-r4');
assert.equal(result.body.activeTemplates, 10);
assert.equal(result.body.plannedTemplates, 6);
assert.equal(result.body.baseRecipes, 72);
```

部署文档测试匹配 r8 和 116/116，并继续匹配“未部署／不得部署”。

运行：

```sh
node --test tools/tests/worker-planner-v2.test.mjs
```

Expected: 全部 PASS。

- [ ] **Step 4: 搜索陈旧当前口径**

```sh
rg -n 'taxonomy-v1-20260727-r7|108/108|108 planner|108 journeys|108条|108 条' . \
  --glob '!docs/superpowers/**' --glob '!tools/generated/**' \
  --glob '!node_modules/**' --glob '!dist/**'
```

只修当前权威代码、测试和部署文档；历史设计、实施计划和生成审计快照按其语境保留。

- [ ] **Step 5: 运行全部测试**

```sh
node --test tools/tests/*.test.mjs
```

Expected: 0 fail。记录完整测试数，不用局部测试推断全绿。

- [ ] **Step 6: 运行所有发布前门禁**

```sh
node tools/check-foods.mjs
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
python3 -m py_compile ai_proxy.py
node --test tools/tests/build-dist.test.mjs
git diff --check
```

Expected: 营养体检 0 错误；菜谱库 72；116/116 journeys；Python 和 build tests PASS；无 whitespace error。

- [ ] **Step 7: 独立审计不可变量**

```sh
jq '{recipes:(.recipes|length),approved:([.recipes[]|select(.status=="approved")]|length),auto_approved:([.recipes[]|select(.status=="auto_approved")]|length),families:(.families|length)}' tools/data/recipe-library.json
jq '{taxonomy_version,items:(.items|length),ambiguities:(.ambiguous_inputs|length)}' tools/data/ingredient-taxonomy.v1.json
jq '{template_catalog_version,active:([.templates[]|select(.activation_status=="active")]|length),planned:([.templates[]|select(.activation_status=="planned")]|length),total:(.templates|length)}' tools/data/meal-templates.v2.json
jq '{ratio_catalog_version,rules:(.rules|length)}' tools/data/ratio-rules.v1.json
jq '{journeys:(.journeys|length),last:.journeys[-1].id}' tools/data/pantry-planner-v2-journeys.json
```

Expected: 72 / 12 / 60 / 21；taxonomy r8 且 2 ambiguities；template r8 / 10 / 6 / 16；Ratio r4 且数量与 M1 前相同；116 / J116。

- [ ] **Step 8: 提交版本闭包**

```sh
git add CLAUDE.md 部署说明.md tools/tests/worker-planner-v2.test.mjs
git diff --cached --check
git commit -m "docs: close Shaanbei semantic baseline"
```

- [ ] **Step 9: 更新 Draft PR，不部署**

```sh
git push origin codex/targeted-recipe-expansion
gh pr view 1 --json url,isDraft,state,headRefName,headRefOid
```

Expected: PR #1 为 OPEN、`isDraft:true`、head branch 为 `codex/targeted-recipe-expansion`。若网络不可达，保留本地提交并如实报告，不重复强推，不调用 Wrangler，不合并 PR。

---

## Completion Audit

完成声明必须逐项提供证据：

1. taxonomy 中四个新 identity 和两个 ambiguity rows 的实际 JSON；
2. 裸词“豇豆”不再出现在 `green-beans.aliases`；
3. pantry/recommend 的结构化响应、generation_allowed 和成本上限测试；
4. plan ID 对 ambiguity 机器字段敏感、对 eligible 顺序不敏感；
5. Worker/Python/HTTP parity；
6. J109–J116 及 116/116 CLI；
7. 陕北覆盖不高于 1/3、西北完整单锅保持 2/3；
8. recipe/template/Ratio 数量与版本不可变量；
9. 全部 Node、食品、菜谱、Python 和 dist 门禁；
10. Draft PR 未合并、未部署；若远端网络不可用，明确区分“本地完成”和“PR 已更新”。

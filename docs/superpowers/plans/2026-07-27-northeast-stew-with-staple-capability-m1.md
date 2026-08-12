# Northeast Stew With Staple Capability M1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `stew-with-staple` 的锅边玉米主食窄分支建立可验证的食材状态、preparation 候选契约、证据/校准空表和 22 条分阶段旅程，同时确保真实 Planner 仍不能选择该能力。

**Architecture:** 生产 taxonomy 只补身份与形态，不补猜测比例；东北研究账本记录候选 preparation、候选炖锅比例、证据缺口和 2/3/4 人份校准槽位；一个 tools-only 的严格 validator 验证未来机器规则形状，但候选数据不进入生产 Ratio DSL。真实 template 继续 `planned/runtime_eligible:false`，生产 `ratio-rules.v1.json` 不变，运行时 Planner、DeepSeek 和页面行为不变。

**Tech Stack:** JSON 机器资产、Node.js ESM、内置 `node:test`、确定性 Markdown/JSON 构建器、Cloudflare Worker 共享 validator、GitHub Draft PR。

## Global Constraints

- [ ] 以 [`docs/superpowers/specs/2026-07-27-northeast-stew-with-staple-capability-design.md`](../specs/2026-07-27-northeast-stew-with-staple-capability-design.md) 为产品契约。
- [ ] M1 不修改 `tools/data/recipe-library.json`；菜谱保持 72 道（12 `approved` + 60 `auto_approved`）。
- [ ] M1 不向 `tools/data/ratio-rules.v1.json` 添加 preparation rule、炖锅液体 rule 或任何未经证据支持的克数。
- [ ] `stew-with-staple-pot` 保持 `planned`、`runtime_eligible:false`；模板总数保持 16，运行基线保持 9 active + 7 planned。
- [ ] `stew-with-staple` 能力账本保持 `coverage_level:"none"`、`promotion_status:"blocked_by_ratio"`、`resolved_ratio_rule_ids:[]`。
- [ ] M1 不修改 `worker/src/planner-v2.js` 的候选生成、装槽、排序、换一换、plan identity 或 HTTP 响应。
- [ ] M1 不接 DeepSeek，不修改 `ai_proxy.py`、`index.html` 或生成 prompt。
- [ ] 研究账本和校准记录不得进入 `dist/`；test-only 合成数值不得进入任何生产 JSON 或生成请求。
- [ ] 所有新行为先写失败测试、运行并观察预期红灯，再做最小实现。
- [ ] 不部署 Preview 或 production，不合并 PR，Draft PR #1 保持 Draft。
- [ ] M1 完成后必须停下；M2 的真实比例、Planner 接线和 template 激活需要新的明确批准。

---

## File Responsibility Map

- `tools/data/ingredient-taxonomy.v1.json`：生产可识别的原始粉、已和面团、派生锅边饼、现成饼与油豆角身份。
- `worker/src/ingredient-taxonomy-validator.js`：taxonomy 有限词表、`input_scope` 和派生身份不变量。
- `worker/src/planner-v2.js`：本轮只读取 `input_scope`，确保 `derived_only` 身份不能由 pantry 文本直接伪造；不接 preparation。
- `worker/src/meal-template-validator.js`：只同步 taxonomy 版本；不放宽 template 激活门。
- `tools/data/meal-templates.v2.json`：只同步 taxonomy 版本和 catalog 版本；16 个模板的业务字段不变。
- `tools/lib/ingredient-taxonomy-validator.mjs`：继续复用 Worker validator，无第二套 taxonomy 语义。
- `tools/lib/preparation-rule-validator.mjs`：tools-only 的 M1 候选状态 validator，以及未来可执行 preparation 机器 schema validator。
- `tools/data/northeast-stew-research.v1.json`：东北证据、两条候选机器规则、2/3/4 人份待校准记录与 22 条分阶段旅程的唯一源账本。
- `tools/lib/northeast-stew-research-validator.mjs`：研究账本严格 schema、引用、阻塞状态和旅程完整性校验。
- `tools/lib/northeast-stew-research-builder.mjs`：把已验证源账本整理成确定性审计 report。
- `tools/lib/northeast-stew-research-renderer.mjs`：生成研究 Markdown、JSON 和人工校准/旅程表，不自行推导结论。
- `tools/generated/northeast-stew-research.v1.json`、`docs/northeast-stew-research.md`、`docs/northeast-stew-journey-review.md`：确定性生成物，禁止手改。
- `tools/tests/fixtures/northeast-stew-m1/preparation-rule.synthetic.json`：只用于证明未来 active schema 可机器验证的合成数值，不是产品默认值。
- `tools/tests/ingredient-taxonomy.test.mjs`：四态身份、粗细、油豆角和 derived-only 输入边界。
- `tools/tests/preparation-rule-candidate.test.mjs`：候选规则证据门、校准门与 synthetic active schema。
- `tools/tests/northeast-stew-research-data.test.mjs`：源账本及 22 条旅程契约。
- `tools/tests/northeast-stew-research-artifacts.test.mjs`：生成物新鲜度、审计文案与发布包隔离。
- `tools/tests/meal-template-catalog.test.mjs`、`tools/tests/worker-planner-v2.test.mjs`：版本同步及 9/7 运行基线负向锁定。
- `部署说明.md`：只同步本地资产版本与 M1 未激活说明；不增加部署授权。

---

### Task 1: 把玉米面四态与油豆角写入受控 taxonomy

**Files:**

- Modify: `tools/tests/ingredient-taxonomy.test.mjs`
- Modify: `worker/src/ingredient-taxonomy-validator.js`
- Modify: `worker/src/planner-v2.js`
- Modify: `tools/data/ingredient-taxonomy.v1.json`
- Modify: `tools/tests/meal-template-catalog.test.mjs`
- Modify: `worker/src/meal-template-validator.js`
- Modify: `tools/data/meal-templates.v2.json`
- Modify: `tools/tests/worker-planner-v2.test.mjs`
- Modify: `部署说明.md`

**Interfaces:**

- `validateIngredientTaxonomy(data): string[]` 仍是 taxonomy 的唯一权威校验入口。
- `normalizePlannerItems(rawItems, taxonomy)` 必须识别 pantry 输入身份，但不得识别 `input_scope:"derived_only"` 的计划产物。
- 新版本固定为 `taxonomy-v1-20260727-r2`；仅因 taxonomy 绑定变化，template catalog 固定升级为 `templates-v2-20260727-r2`。

- [ ] **Step 1: 先写四态身份与油豆角的失败测试**

在 `tools/tests/ingredient-taxonomy.test.mjs` 先改版本断言，并增加：

```js
test('cornmeal identities preserve raw prepared derived and ready states', () => {
  const byId = new Map(catalog.items.map(item => [item.canonical_id, item]));
  assert.equal(catalog.taxonomy_version, 'taxonomy-v1-20260727-r2');
  assert.deepEqual(
    ['cornmeal-flour', 'cornmeal-dough', 'pot-edge-corn-cake', 'ready-corn-cake']
      .map(id => [id, byId.get(id)?.states, byId.get(id)?.input_scope]),
    [
      ['cornmeal-flour', ['raw'], 'pantry_input'],
      ['cornmeal-dough', ['prepared'], 'pantry_input'],
      ['pot-edge-corn-cake', ['derived_plan_output'], 'derived_only'],
      ['ready-corn-cake', ['cooked'], 'pantry_input'],
    ],
  );
});

test('cornmeal aliases preserve coarseness and never collapse cooked or derived forms', () => {
  const [fine, coarse, unspecified, dough, ready, forgedDerived] = normalizePlannerItems(
    ['细玉米面', '粗玉米面', '玉米面', '玉米面团', '现成玉米饼', '锅边玉米饼'],
    catalog,
  );
  assert.deepEqual([fine.canonical, fine.shape_or_cut], ['玉米面', 'fine']);
  assert.deepEqual([coarse.canonical, coarse.shape_or_cut], ['玉米面', 'coarse']);
  assert.deepEqual([unspecified.canonical, unspecified.shape_or_cut], ['玉米面', 'unspecified']);
  assert.deepEqual([dough.category, dough.shape_or_cut], ['cornmeal_dough', 'dough_piece']);
  assert.deepEqual([ready.category, ready.cooking_risk], ['ready_staple', 'none']);
  assert.equal(forgedDerived.recognized, false);
});

test('oil beans remain distinct from generic green beans', () => {
  const [oilBeans, generic] = normalizePlannerItems(['油豆角', '普通豆角'], catalog);
  assert.equal(oilBeans.display_name, '油豆角');
  assert.equal(oilBeans.canonical, '油豆角');
  assert.equal(generic.display_name, '豆角');
  assert.equal(generic.canonical, '豆角');
  assert.notEqual(oilBeans.canonical, generic.canonical);
  assert.deepEqual(oilBeans.required_endpoint_codes, ['bean_fully_cooked']);
  assert.deepEqual(generic.required_endpoint_codes, ['bean_fully_cooked']);
});
```

再增加 validator 负例：

```js
test('derived-only identities cannot advertise pantry aliases or the wrong state', () => {
  const aliasLeak = structuredClone(catalog);
  aliasLeak.items.find(item => item.canonical_id === 'pot-edge-corn-cake').aliases = ['贴饼子'];
  assert.match(validateIngredientTaxonomy(aliasLeak).join('\n'), /derived_only identities must not define aliases/);

  const wrongState = structuredClone(catalog);
  wrongState.items.find(item => item.canonical_id === 'pot-edge-corn-cake').states = ['cooked'];
  assert.match(validateIngredientTaxonomy(wrongState).join('\n'), /derived_only identity must use derived_plan_output/);
});
```

Run:

```sh
node --test tools/tests/ingredient-taxonomy.test.mjs
```

Expected: FAIL on missing identities, old version and unsupported finite vocabularies.

- [ ] **Step 2: 扩展 taxonomy validator 的有限词表与派生边界**

在 `worker/src/ingredient-taxonomy-validator.js`：

```js
const CATEGORIES = new Set([
  // existing values...
  'cornmeal_flour', 'cornmeal_dough', 'cornmeal_cake', 'ready_staple',
]);
const STATES = new Set(['raw', 'cooked', 'basic', 'cured', 'prepared', 'derived_plan_output']);
const SHAPES = new Set([
  // existing values...
  'fine', 'coarse', 'unspecified', 'cake',
]);
const INPUT_SCOPES = new Set(['pantry_input', 'derived_only']);
```

所有 item 必须显式含 `input_scope`。增加不变量：

```js
if (!INPUT_SCOPES.has(item.input_scope)) errors.push(`${label}.input_scope is invalid`);
if (item.input_scope === 'derived_only') {
  if (item.states.length !== 1 || item.states[0] !== 'derived_plan_output') {
    errors.push(`${label}: derived_only identity must use derived_plan_output`);
  }
  if (item.aliases.length) errors.push(`${label}: derived_only identities must not define aliases`);
}
if (item.states.includes('derived_plan_output') && item.input_scope !== 'derived_only') {
  errors.push(`${label}: derived_plan_output must be derived_only`);
}
```

`taxonomy_version` 期望改为 `taxonomy-v1-20260727-r2`。不要增加模糊匹配或 category 推断。

- [ ] **Step 3: 让 pantry identity index 排除派生计划产物**

在 `worker/src/planner-v2.js` 的 `taxonomyItemIndex()` 中只索引 pantry 输入：

```js
for (const item of taxonomy?.items || []) {
  if (item.input_scope === 'derived_only') continue;
  for (const name of [item.display_name, ...(item.aliases || [])]) {
    // existing exact-key indexing
  }
}
```

这一步只阻止用户文本伪造成 Planner 派生项，不执行任何 preparation，也不改变候选排序。

- [ ] **Step 4: 写入精确 taxonomy 数据**

给所有现有 item 加 `"input_scope":"pantry_input"`，并把当前 `cornmeal-dough` 改为：

```json
{
  "canonical_id":"cornmeal-dough",
  "display_name":"和好的玉米面团",
  "aliases":["玉米面团","和好的玉米面"],
  "input_scope":"pantry_input",
  "category":"cornmeal_dough",
  "states":["prepared"],
  "shapes_or_cuts":["dough_piece"],
  "cook_speed":"slow",
  "moisture_release":"low",
  "texture_behavior":{"behavior_code":"steams_above_stew","best_method_codes":["steam"],"failure_mode_codes":["dense_when_understeamed"]},
  "cooking_risk":{"risk_code":"raw_dough","required_endpoint_codes":["dough_cooked_through"]},
  "compatible_slot_codes":["staple","edge_steamed_staple"],
  "incompatible_slot_codes":["liquid"]
}
```

新增四行中的另外三行：

```json
{"canonical_id":"cornmeal-flour","display_name":"玉米面","aliases":["玉米粉","细玉米面","粗玉米面"],"alias_shape_or_cut":{"细玉米面":"fine","粗玉米面":"coarse"},"default_shape_or_cut":"unspecified","input_scope":"pantry_input","category":"cornmeal_flour","states":["raw"],"shapes_or_cuts":["fine","coarse","unspecified"],"cook_speed":"slow","moisture_release":"low","texture_behavior":{"behavior_code":"forms_dough_with_water","best_method_codes":["hydrate"],"failure_mode_codes":["clumps_when_hydration_is_wrong"]},"cooking_risk":{"risk_code":"raw_flour","required_endpoint_codes":["dough_cooked_through"]},"compatible_slot_codes":["staple_preparation_input"],"incompatible_slot_codes":["edge_steamed_staple","ready_staple"]},
{"canonical_id":"pot-edge-corn-cake","display_name":"锅边玉米饼","aliases":[],"input_scope":"derived_only","category":"cornmeal_cake","states":["derived_plan_output"],"shapes_or_cuts":["cake"],"cook_speed":"slow","moisture_release":"low","texture_behavior":{"behavior_code":"steams_above_stew","best_method_codes":["steam"],"failure_mode_codes":["dense_when_understeamed"]},"cooking_risk":{"risk_code":"raw_dough","required_endpoint_codes":["dough_cooked_through"]},"compatible_slot_codes":["derived_staple","edge_steamed_staple"],"incompatible_slot_codes":["staple_preparation_input","ready_staple"]},
{"canonical_id":"ready-corn-cake","display_name":"现成玉米饼","aliases":["熟玉米饼","买来的玉米饼"],"input_scope":"pantry_input","category":"ready_staple","states":["cooked"],"shapes_or_cuts":["cake"],"cook_speed":"fast","moisture_release":"low","texture_behavior":{"behavior_code":"reheats_without_breaking","best_method_codes":["steam"],"failure_mode_codes":["dry_when_overcooked"]},"cooking_risk":{"risk_code":"none","required_endpoint_codes":["heated_through"]},"compatible_slot_codes":["staple","ready_staple"],"incompatible_slot_codes":["edge_steamed_staple","staple_preparation_input"]}
```

有限词表同步增加 `forms_dough_with_water`、`hydrate`、`clumps_when_hydration_is_wrong`、`raw_flour`、`staple_preparation_input`、`derived_staple` 和 `ready_staple`；`raw_flour` 必须像其他非 `none` 风险一样要求非空熟制终点。

把 `green-beans.aliases` 精确改为 `["四季豆","豇豆","普通豆角"]`，并新增：

```json
{"canonical_id":"oil-beans","display_name":"油豆角","aliases":[],"input_scope":"pantry_input","category":"pod_vegetable","states":["raw"],"shapes_or_cuts":["whole","slice"],"cook_speed":"medium","moisture_release":"medium","texture_behavior":{"behavior_code":"softens_with_simmering","best_method_codes":["simmer","braise"],"failure_mode_codes":["firm_when_undercooked"]},"cooking_risk":{"risk_code":"none","required_endpoint_codes":["bean_fully_cooked"]},"compatible_slot_codes":["vegetable"],"incompatible_slot_codes":[]}
```

- [ ] **Step 5: 原子同步 template 绑定版本，不改变模板业务内容**

在 `tools/data/meal-templates.v2.json`：

```json
"template_catalog_version":"templates-v2-20260727-r2",
"ingredient_taxonomy_version":"taxonomy-v1-20260727-r2"
```

同步：

- `worker/src/meal-template-validator.js` 的 `TAXONOMY_VERSION` 与 catalog version；
- `tools/tests/meal-template-catalog.test.mjs` 的版本断言；
- `tools/tests/worker-planner-v2.test.mjs` 的 `/health` 版本断言；
- `部署说明.md` 的 Planner 资产版本。

不得改动任何模板的 `activation_status`、`runtime_eligible`、slot、ratio、时间或 evidence。

- [ ] **Step 6: 运行聚焦测试并提交**

Run:

```sh
node --test \
  tools/tests/ingredient-taxonomy.test.mjs \
  tools/tests/meal-template-catalog.test.mjs \
  tools/tests/worker-planner-v2.test.mjs
node tools/check-recipes.mjs
```

Expected: PASS；`/health` 仍报告 9 active、7 planned、72 recipes；`stew-with-staple-pot` 仍不可运行。

Commit:

```sh
git add tools/data/ingredient-taxonomy.v1.json worker/src/ingredient-taxonomy-validator.js \
  worker/src/planner-v2.js tools/tests/ingredient-taxonomy.test.mjs \
  tools/data/meal-templates.v2.json worker/src/meal-template-validator.js \
  tools/tests/meal-template-catalog.test.mjs tools/tests/worker-planner-v2.test.mjs 部署说明.md
git commit -m "Model cornmeal preparation identities"
```

---

### Task 2: 建立 tools-only 的 preparation 候选规则与校准门

**Files:**

- Create: `tools/lib/preparation-rule-validator.mjs`
- Create: `tools/tests/fixtures/northeast-stew-m1/preparation-rule.synthetic.json`
- Create: `tools/tests/preparation-rule-candidate.test.mjs`

**Interfaces:**

```ts
validatePreparationRuleCandidate(candidate, context): string[]
assertPreparationRuleCandidate(candidate, context): candidate
validatePreparationRuleDefinition(rule, context): string[]
assertPreparationRuleDefinition(rule, context): rule

type CandidateContext = {
  taxonomyIds: Set<string>;
  sourceIds: Set<string>;
};
```

候选规则不是生产 Ratio DSL。它只表达“规则准备到什么程度”和“为什么不能激活”。`validatePreparationRuleDefinition()` 则验证正式规格第 6.1 节定义的未来可执行结构；M1 只用隔离 fixture 调它，生产 catalog 不引用该 fixture。

- [ ] **Step 1: 先写 candidate schema 的失败测试**

测试固定两个候选 ID：

```js
const CANDIDATE_IDS = new Set([
  'cornmeal-flour-to-dough-v1',
  'stew-with-corn-cake-liquid-v1',
]);

test('blocked candidates carry exact identities without production numbers', () => {
  for (const candidate of assessment.machine_rule_candidates) {
    assert.deepEqual(validatePreparationRuleCandidate(candidate, context), []);
    assert.equal(candidate.activation_status, 'blocked');
    assert.deepEqual(candidate.numeric_evidence_source_ids, []);
    assert.equal(JSON.stringify(candidate).match(/"(?:grams|minutes|temperature_c)"/g), null);
  }
  assert.deepEqual(new Set(assessment.machine_rule_candidates.map(row => row.rule_id)), CANDIDATE_IDS);
});
```

增加负例并锁定错误：未知 taxonomy ID、虚构 source ID、blocked 没 blocker、候选携带克数、`numeric_evidence_source_ids` 少于两条却标 `evidence_ready`、2/3/4 校准不完整却标 `calibrated`、preparation 输出等于输入、required extra 不是水。

Run:

```sh
node --test tools/tests/preparation-rule-candidate.test.mjs
```

Expected: FAIL because module and fixture do not exist.

- [ ] **Step 2: 实现严格有限 schema**

候选根字段只允许：

```js
const CANDIDATE_FIELDS = new Set([
  'rule_id', 'rule_kind', 'activation_status', 'when', 'produces',
  'required_basic_extras', 'supporting_source_ids', 'numeric_evidence_source_ids',
  'calibration_case_ids', 'evidence_status', 'calibration_status', 'blocker_codes',
]);
const RULE_KINDS = new Set(['preparation', 'stew_liquid']);
const ACTIVATION = new Set(['blocked', 'active']);
const EVIDENCE = new Set(['missing', 'evidence_ready']);
const CALIBRATION = new Set(['required', 'calibrated']);
```

`when` 与 `produces` 分支固定：

```js
if (candidate.rule_kind === 'preparation') {
  // when: input_canonical_id + allowed_shape_or_cut
  // produces: canonical_id + state
  // output must differ from input and exist in taxonomy
}
if (candidate.rule_kind === 'stew_liquid') {
  // when: template_id + staple_canonical_id
  // produces: phase_allocations exactly ['prepare_staple','stew_liquid']
}
```

门禁：

```js
if (candidate.activation_status === 'blocked' && candidate.blocker_codes.length === 0) {
  errors.push(`${label}: blocked candidate requires blocker_codes`);
}
if (candidate.evidence_status === 'evidence_ready' && candidate.numeric_evidence_source_ids.length < 2) {
  errors.push(`${label}: evidence_ready requires two independent numeric sources`);
}
if (candidate.calibration_status === 'calibrated'
    && !exactSet(candidate.calibration_case_ids, ['ne-cal-2','ne-cal-3','ne-cal-4'])) {
  errors.push(`${label}: calibrated requires 2 3 and 4 serving records`);
}
if (candidate.activation_status === 'active'
    && (candidate.evidence_status !== 'evidence_ready' || candidate.calibration_status !== 'calibrated')) {
  errors.push(`${label}: active candidate requires evidence and calibration`);
}
```

递归拒绝 `grams`、`minutes`、`temperature_c`、`min`、`default`、`max` 等生产数值字段出现在 candidate 对象。

同一模块的 `validatePreparationRuleDefinition()` 使用另一套严格字段：

```js
const DEFINITION_FIELDS = new Set([
  'rule_id', 'activation_status', 'when', 'produces', 'operations',
  'required_basic_extras', 'evidence_source_ids', 'calibration_record_ids', 'rounding',
]);
const OPERATOR_FIELDS = new Map([
  ['per_serving', new Set(['operator', 'target', 'grams'])],
  ['ratio', new Set(['operator', 'target', 'denominator', 'bounds'])],
]);
```

可执行 definition 必须满足：

- `activation_status` 只能是 `active`；
- `when.input_canonical_id === 'cornmeal-flour'`；
- `produces.canonical_id === 'cornmeal-dough'` 且 state 为 `prepared`；
- operations 恰好一条 `per_serving` 原料规则和一条以原料克数为分母的 `ratio` 水规则；
- 两个 `Bounds` 均为有限正数且 `min <= default <= max`；
- `required_basic_extras` 恰好为 `["水"]`；
- `evidence_source_ids` 至少两条且全部存在；
- `calibration_record_ids` 恰好为 `ne-cal-2/3/4`；
- `rounding.grams_to_nearest` 为正整数。

- [ ] **Step 3: 增加隔离 synthetic active schema fixture**

`tools/tests/fixtures/northeast-stew-m1/preparation-rule.synthetic.json` 必须是完整机器 rule，并显式带 test-only envelope：

```json
{
  "fixture_scope":"synthetic_test_only",
  "rule":{
    "rule_id":"cornmeal-flour-to-dough-v1",
    "activation_status":"active",
    "when":{"input_canonical_id":"cornmeal-flour","input_category":"cornmeal_flour"},
    "produces":{"canonical_id":"cornmeal-dough","category":"cornmeal_dough","state":"prepared"},
    "operations":[
      {"operator":"per_serving","target":{"canonical_id":"cornmeal-flour"},"grams":{"min":1,"default":2,"max":3}},
      {"operator":"ratio","target":{"name":"水","category":"liquid","phase":"prepare_staple"},"denominator":{"canonical_id":"cornmeal-flour","measure":"grams"},"bounds":{"min":0.1,"default":0.2,"max":0.3}}
    ],
    "required_basic_extras":["水"],
    "evidence_source_ids":["synthetic-source-a","synthetic-source-b"],
    "calibration_record_ids":["ne-cal-2","ne-cal-3","ne-cal-4"],
    "rounding":{"grams_to_nearest":1}
  }
}
```

`1/2/3` 与 `0.1/0.2/0.3` 明确不是产品建议，只为验证数值 schema。测试把 synthetic source/calibration ID 作为 context 传入并断言 definition PASS；再逐项破坏 bounds、证据数、校准集合、operation 顺序和 water target，确认 fail closed。测试还必须同时断言：

```js
assert.equal(JSON.stringify(productionRatios).includes('cornmeal-flour-to-dough-v1'), false);
assert.equal(JSON.stringify(productionRatios).includes('stew-with-corn-cake-liquid-v1'), false);
```

- [ ] **Step 4: 运行并提交**

Run:

```sh
node --test tools/tests/preparation-rule-candidate.test.mjs
```

Expected: PASS；production Ratio DSL 仍无两条候选规则。

Commit:

```sh
git add tools/lib/preparation-rule-validator.mjs \
  tools/tests/fixtures/northeast-stew-m1/preparation-rule.synthetic.json \
  tools/tests/preparation-rule-candidate.test.mjs
git commit -m "Add blocked preparation evidence gate"
```

---

### Task 3: 把两条候选规则、校准空表和 22 条旅程写入东北源账本

**Files:**

- Modify: `tools/tests/northeast-stew-research-data.test.mjs`
- Modify: `tools/lib/northeast-stew-research-validator.mjs`
- Modify: `tools/data/northeast-stew-research.v1.json`
- Modify: `tools/build-northeast-stew-research.mjs`
- Modify: `tools/check-recipes.mjs`
- Modify: `tools/tests/northeast-stew-research-artifacts.test.mjs`

**Interfaces:**

- `validateNortheastStewResearch(inputs): string[]` 必须在研究事实、candidate gate、calibration gate 与 journey stage 任一不一致时 fail closed。
- `assessment_version` 固定升级为 `northeast-stew-research-v1-20260727-m1`；`schema_version` 升级为 `2`。

- [ ] **Step 1: 先写 M1 研究账本失败测试**

新增：

```js
test('M1 records two blocked machine-rule candidates and no production numbers', () => {
  assert.equal(assessment.schema_version, 2);
  assert.equal(assessment.assessment_version, 'northeast-stew-research-v1-20260727-m1');
  assert.deepEqual(
    assessment.machine_rule_candidates.map(row => row.rule_id).sort(),
    ['cornmeal-flour-to-dough-v1', 'stew-with-corn-cake-liquid-v1'],
  );
  assert.ok(assessment.machine_rule_candidates.every(row => row.activation_status === 'blocked'));
  assert.doesNotMatch(JSON.stringify(assessment.machine_rule_candidates), /"(?:grams|minutes|temperature_c)"/);
});

test('calibration ledger reserves exactly 2 3 and 4 servings without fabricating results', () => {
  assert.deepEqual(assessment.calibration_cases.map(row => row.servings), [2, 3, 4]);
  for (const row of assessment.calibration_cases) {
    assert.equal(row.status, 'pending');
    assert.ok(Object.values(row.measurements).every(value => value === null));
    assert.ok(Object.values(row.acceptance_checks).every(value => value === null));
  }
});

test('twenty two staged journeys keep M1 blocked and M2 expectations explicit', () => {
  assert.equal(assessment.capability_journey_cases.length, 22);
  assert.deepEqual(
    assessment.capability_journey_cases.map(row => row.journey_id),
    Array.from({ length:22 }, (_, index) => `ne-cap-j${String(index + 1).padStart(2, '0')}`),
  );
  assert.ok(assessment.capability_journey_cases.every(row => row.m1_runtime_expectation === 'template_not_runtime_eligible'));
});
```

负例必须覆盖：candidate 引用未知 source/taxonomy、待校准记录填了结果但状态仍 pending、校准缺 3 人份、旅程缺号、M1 旅程声称 complete、M2 正例缺预期 used items、model 越界旅程缺 `model_contract_violation`。

Run:

```sh
node --test tools/tests/northeast-stew-research-data.test.mjs
```

Expected: FAIL on missing schema fields and old 10-journey-only contract.

- [ ] **Step 2: 扩展 research validator 的严格 schema**

根字段增加：

```js
'machine_rule_candidates', 'calibration_cases', 'capability_journey_cases'
```

调用 Task 2 的 validator：

```js
for (const candidate of asArray(assessment.machine_rule_candidates)) {
  errors.push(...validatePreparationRuleCandidate(candidate, {
    taxonomyIds,
    sourceIds: new Set(sourceById.keys()),
  }));
}
```

`validateNortheastStewResearch()` 增加 `taxonomy` 输入，并从实际 taxonomy 构造 `taxonomyIds`。`tools/build-northeast-stew-research.mjs`、`tools/check-recipes.mjs` 和测试固定输入都必须传入同一份 `ingredient-taxonomy.v1.json`；`tools/tests/northeast-stew-research-artifacts.test.mjs` 的临时 `DATA_FILES` 同步加入该文件。

校准记录字段固定为：

```js
const CALIBRATION_FIELDS = new Set([
  'calibration_id', 'servings', 'status', 'operator', 'performed_at',
  'cornmeal_shape_or_cut', 'equipment', 'measurements', 'acceptance_checks', 'notes',
]);
```

pending 记录必须满足：operator/performed_at/cornmeal_shape_or_cut/notes 为 `null` 或空串；equipment 与 measurements 的每个值为 null；acceptance_checks 的七个布尔项全部为 null。只允许 ID `ne-cal-2/3/4` 与 servings `2/3/4` 一一对应。

22 条 capability journey 只允许 `m1_runtime_expectation:"template_not_runtime_eligible"`。`m2_expected_outcome` 的有限词表为：

```js
const M2_OUTCOMES = new Set([
  'complete', 'ready', 'unsupported_staple_state', 'unsupported_servings',
  'time_constraint', 'incompatible_combination', 'allergen_conflict',
  'stale_plan', 'no_alternative_plan', 'model_contract_violation',
]);
```

- [ ] **Step 3: 写入两条 blocked candidate**

`cornmeal-flour-to-dough-v1`：

```json
{
  "rule_id":"cornmeal-flour-to-dough-v1",
  "rule_kind":"preparation",
  "activation_status":"blocked",
  "when":{"input_canonical_id":"cornmeal-flour","allowed_shape_or_cut":["fine","coarse","unspecified"]},
  "produces":{"canonical_id":"cornmeal-dough","state":"prepared"},
  "required_basic_extras":["水"],
  "supporting_source_ids":["hlj-culture-autumn-pot-2025"],
  "numeric_evidence_source_ids":[],
  "calibration_case_ids":["ne-cal-2","ne-cal-3","ne-cal-4"],
  "evidence_status":"missing",
  "calibration_status":"required",
  "blocker_codes":["numeric_evidence_missing","calibration_2_3_4_servings_missing"]
}
```

`stew-with-corn-cake-liquid-v1`：

```json
{
  "rule_id":"stew-with-corn-cake-liquid-v1",
  "rule_kind":"stew_liquid",
  "activation_status":"blocked",
  "when":{"template_id":"stew-with-staple-pot","staple_canonical_id":"cornmeal-dough"},
  "produces":{"phase_allocations":["prepare_staple","stew_liquid"],"staple_position":"above_stew_liquid","steam_required":true},
  "required_basic_extras":["水"],
  "supporting_source_ids":["hlj-gov-iron-pot-2025","hlj-culture-autumn-pot-2025"],
  "numeric_evidence_source_ids":[],
  "calibration_case_ids":["ne-cal-2","ne-cal-3","ne-cal-4"],
  "evidence_status":"missing",
  "calibration_status":"required",
  "blocker_codes":["numeric_evidence_missing","calibration_2_3_4_servings_missing","stew_liquid_phase_split_unverified"]
}
```

`supporting_source_ids` 只证明结构，不得被 renderer 写成数值依据。

- [ ] **Step 4: 写入三条空校准记录**

每条记录使用同一结构，只有 ID 和 servings 不同：

```json
{
  "calibration_id":"ne-cal-2",
  "servings":2,
  "status":"pending",
  "operator":null,
  "performed_at":null,
  "cornmeal_shape_or_cut":null,
  "equipment":{"pot_diameter_cm":null,"pot_depth_cm":null,"lid_fit_confirmed":null},
  "measurements":{"cornmeal_grams":null,"preparation_water_grams":null,"stew_water_grams":null,"steam_minutes":null},
  "acceptance_checks":{"dough_holds_shape":null,"center_cooked_through":null,"cake_above_liquid":null,"cake_holds_together":null,"pot_not_scorched":null,"pork_endpoint_reached":null,"beans_endpoint_reached":null},
  "notes":""
}
```

这不是让自动测试填写厨房结果。任何非 pending 记录必须由真人完成并单独审批。

- [ ] **Step 5: 把正式规格的 22 条旅程逐条写入源账本**

ID 与规格第 13 节顺序一一对应。每条至少包含：

```json
{
  "journey_id":"ne-cap-j01",
  "mode":"pantry",
  "intent":"normal",
  "servings":2,
  "raw_items":["排骨","油豆角","玉米面"],
  "dislikes":[],
  "m1_runtime_expectation":"template_not_runtime_eligible",
  "m2_expected_outcome":"complete",
  "expected_template_id":"stew-with-staple-pot",
  "expected_used_items":["排骨","油豆角","玉米面"],
  "expected_unplanned_items":[],
  "expected_reason_code":null,
  "assertion_codes":["original_cornmeal_retained","preparation_required","two_phase_water_required","regional_family_wording_allowed"]
}
```

22 条必须完整覆盖规格原顺序，不能写“同上”或省略反例。journey 20–22 的 `m2_expected_outcome` 均为 `model_contract_violation`，分别用 assertion code 锁定新增主食、改水量和玉米面变玉米粒。

- [ ] **Step 6: 运行聚焦测试并提交**

Run:

```sh
node --test \
  tools/tests/preparation-rule-candidate.test.mjs \
  tools/tests/northeast-stew-research-data.test.mjs
node tools/check-recipes.mjs
```

Expected: research source tests PASS；aggregate gate 只可能因生成物尚未刷新而 FAIL。

Commit:

```sh
git add tools/data/northeast-stew-research.v1.json \
  tools/lib/northeast-stew-research-validator.mjs \
  tools/tests/northeast-stew-research-data.test.mjs \
  tools/build-northeast-stew-research.mjs tools/check-recipes.mjs
git commit -m "Stage northeast cornmeal calibration contract"
```

---

### Task 4: 把 M1 证据门和校准空表呈现在确定性审计中

**Files:**

- Modify: `tools/tests/northeast-stew-research-artifacts.test.mjs`
- Modify: `tools/lib/northeast-stew-research-builder.mjs`
- Modify: `tools/lib/northeast-stew-research-renderer.mjs`
- Regenerate: `tools/generated/northeast-stew-research.v1.json`
- Regenerate: `docs/northeast-stew-research.md`
- Regenerate: `docs/northeast-stew-journey-review.md`

**Interfaces:**

- report 增加 `machine_rule_readiness`、`calibration_readiness`、`capability_journey_cases`。
- `completion_status` 继续为 `research_in_progress`；M1 不得使 `ratio_ready_form_count` 或 active template count 增长。

- [ ] **Step 1: 先写生成审计失败测试**

```js
test('M1 audit exposes blockers without claiming runnable ratios', () => {
  const report = fixedReport();
  assert.equal(report.machine_rule_readiness.length, 2);
  assert.equal(report.calibration_readiness.length, 3);
  assert.equal(report.capability_journey_cases.length, 22);
  assert.equal(report.completion_status.status, 'research_in_progress');
  assert.ok(report.machine_rule_readiness.every(row => row.activation_status === 'blocked'));
});

test('markdown distinguishes structural evidence from numeric evidence', () => {
  const markdown = renderNortheastStewResearchMarkdown(fixedReport());
  assert.match(markdown, /结构依据不等于数值比例依据/);
  assert.match(markdown, /cornmeal-flour-to-dough-v1/);
  assert.match(markdown, /2 人份.*待校准/);
  assert.doesNotMatch(markdown, /已可运行|比例已批准|完整清库存计划/);
});
```

原有 “10 条家庭食材旅程” 表保留为地域事实评审；新增 22 条表单独标题为“能力契约旅程（M1 未激活）”，不得混成已经跑通的用户旅程。

Run:

```sh
node --test tools/tests/northeast-stew-research-artifacts.test.mjs
```

Expected: FAIL on missing report fields and stale renderer output.

- [ ] **Step 2: 扩展 builder，并让 completion blockers 来自数据事实**

`completionFacts()` 增加：

```js
const machineRulesReady = machineRules.filter(row => row.activation_status === 'active').length;
const calibrationReady = calibrationCases.filter(row => row.status === 'passed').length;
if (machineRulesReady !== 2) blockingGaps.push('machine_rule_candidates_blocked');
if (calibrationReady !== 3) blockingGaps.push('calibration_2_3_4_servings_incomplete');
```

report 的 readiness 行只复制 validator 已确认字段，不根据文案猜状态。summary 增加：

```js
machine_rule_candidate_count: 2,
machine_rule_active_count: 0,
calibration_case_count: 3,
calibration_passed_count: 0,
capability_journey_count: 22,
production_recipe_changes: 0,
production_ratio_rule_changes: 0,
runtime_template_changes: 0,
```

- [ ] **Step 3: 扩展 renderer**

新增三段：

1. “机器规则候选”：显示结构依据、数值依据状态、校准状态和 blockers。
2. “2/3/4 人份厨房校准”：显示 pending 空表，不能自动填结论。
3. “22 条能力契约旅程”：并排显示 M1 预期阻塞与 M2 将来验收结果。

顶端边界文案改为：

```text
本页记录 M1 的证据与校准准备。结构依据不等于数值比例依据；两条机器规则仍被阻塞，真实 Planner 不会选择该模板。
```

- [ ] **Step 4: 生成并验证固定产物**

Run:

```sh
node tools/build-northeast-stew-research.mjs --write
node tools/build-northeast-stew-research.mjs --check
node --test tools/tests/northeast-stew-research-artifacts.test.mjs
node tools/check-recipes.mjs
```

Expected: PASS；summary 显示 2 blocked machine rules、0 active、3 pending calibrations、22 staged capability journeys、`research_in_progress`。

- [ ] **Step 5: 提交确定性审计**

```sh
git add tools/lib/northeast-stew-research-builder.mjs \
  tools/lib/northeast-stew-research-renderer.mjs \
  tools/tests/northeast-stew-research-artifacts.test.mjs \
  tools/generated/northeast-stew-research.v1.json \
  docs/northeast-stew-research.md docs/northeast-stew-journey-review.md
git commit -m "Render northeast capability readiness audit"
```

---

### Task 5: 锁死 M1 与真实运行时的隔离

**Files:**

- Modify: `tools/tests/meal-template-catalog.test.mjs`
- Modify: `tools/tests/worker-planner-v2.test.mjs`
- Modify: `tools/tests/northeast-stew-research-artifacts.test.mjs`
- Modify: `tools/tests/build-dist.test.mjs`
- Modify: `tools/tests/regional-menu-mappings.test.mjs`
- Modify: `tools/tests/regional-atlas-artifacts.test.mjs`

**Interfaces:**

- 真实 `/plan-meal` 对东北组合不能返回 `stew-with-staple-pot`。
- 真实 catalog、Ratio DSL、capability ledger 与 `dist/` 都不得暗示 M1 已激活。

- [ ] **Step 1: 写真实 Planner 负向旅程**

在 `tools/tests/worker-planner-v2.test.mjs`：

```js
test('M1 cornmeal identities do not activate the blocked stew template', async () => {
  const result = await postPlan(plannerBody({
    mode: 'pantry', intent: 'normal', servings: 2,
    must: ['排骨', '油豆角', '玉米面'],
  }));
  assert.notEqual(result.body.status, 'complete');
  assert.equal(result.body.generation_allowed, false);
  assert.ok(result.body.plan.unplanned_must_use.some(item => item.raw === '玉米面'));
  assert.equal(result.body.plan.pots.some(pot => pot.template_id === 'stew-with-staple-pot'), false);
  assertZeroGenerationWork(result);
});
```

在 `tools/tests/meal-template-catalog.test.mjs` 明确断言：

```js
const stew = catalog.templates.find(row => row.template_id === 'stew-with-staple-pot');
assert.equal(stew.activation_status, 'planned');
assert.equal(stew.runtime_eligible, false);
assert.equal(getRuntimeEligibleTemplates(catalog).includes(stew), false);
```

- [ ] **Step 2: 锁定 Ratio DSL 与 capability ledger 没有被偷晋升**

在 `tools/tests/regional-menu-mappings.test.mjs`：

```js
const stew = mappings.template_capability_mappings.find(row => row.family_id === 'stew-with-staple');
assert.equal(stew.coverage_level, 'none');
assert.equal(stew.promotion_status, 'blocked_by_ratio');
assert.deepEqual(stew.resolved_ratio_rule_ids, []);
assert.equal(ratios.rules.some(row => [
  'cornmeal-flour-to-dough-v1',
  'stew-with-corn-cake-liquid-v1',
].includes(row.rule_id)), false);
```

`regional-menu-mappings.v1.json` 本轮不改；测试只证明它没有随 taxonomy 变化被误晋升。

- [ ] **Step 3: 强化发布包隔离测试**

`tools/tests/northeast-stew-research-artifacts.test.mjs` 与 `tools/tests/build-dist.test.mjs` 构建临时 dist 后，递归断言以下均不存在：

```js
const forbidden = [
  'northeast-stew-research',
  'northeast-stew-journey-review',
  'preparation-rule.synthetic',
  'ne-cal-2',
  'synthetic-source-a',
];
```

同时读取 dist 内 `ratio-rules.v1.json`，断言两条 candidate rule ID 都不存在；读取 dist 内 template catalog，断言仍为 9 active + 7 planned。

- [ ] **Step 4: 运行聚焦隔离门禁并提交**

Run:

```sh
node --test \
  tools/tests/meal-template-catalog.test.mjs \
  tools/tests/worker-planner-v2.test.mjs \
  tools/tests/regional-menu-mappings.test.mjs \
  tools/tests/regional-atlas-artifacts.test.mjs \
  tools/tests/northeast-stew-research-artifacts.test.mjs \
  tools/tests/build-dist.test.mjs
```

Expected: PASS；真实 Planner 不调用 DeepSeek，也不返回虚假完整计划；dist 无研究和 synthetic 数据。

Commit:

```sh
git add tools/tests/meal-template-catalog.test.mjs \
  tools/tests/worker-planner-v2.test.mjs \
  tools/tests/regional-menu-mappings.test.mjs \
  tools/tests/regional-atlas-artifacts.test.mjs \
  tools/tests/northeast-stew-research-artifacts.test.mjs \
  tools/tests/build-dist.test.mjs
git commit -m "Lock northeast M1 out of runtime"
```

---

### Task 6: 全量验证、审查边界并更新 Draft PR

**Files:**

- Verify only unless a test exposes an in-scope defect.
- Do not modify recipe, Ratio DSL production rules, template activation or deployment configuration.

- [ ] **Step 1: 运行全部 Node 测试**

Run:

```sh
node --test tools/tests/*.test.mjs
```

Expected: 全部 PASS，无 skipped/only 测试。

- [ ] **Step 2: 运行全部项目门禁**

Run:

```sh
node tools/check-foods.mjs
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
python3 -m py_compile ai_proxy.py
```

Expected:

- 菜谱仍为 72；
- Planner journeys 保持全绿；
- 东北 M1 audit 为 `research_in_progress`；
- 真实 Ratio DSL 不含两条 candidate rule；
- Python 语法检查通过。

- [ ] **Step 3: 构建并做字节一致性/隔离检查**

Run:

```sh
node tools/build-dist.mjs --out-dir dist/.m1-verification --build-id "northeast-m1-verification"
node --test tools/tests/build-dist.test.mjs tools/tests/northeast-stew-research-artifacts.test.mjs
```

Expected: canonical runtime assets 字节一致；research/calibration/synthetic fixture 均不在 dist。

- [ ] **Step 4: 做变更面审计**

Run:

```sh
git diff --stat origin/codex/targeted-recipe-expansion...HEAD
git diff --name-only origin/codex/targeted-recipe-expansion...HEAD
git status --short
```

逐项确认：

- `tools/data/recipe-library.json` 未改；
- `tools/data/ratio-rules.v1.json` 未改；
- `stew-with-staple-pot` 仍 planned/ineligible；
- `worker/src/planner-v2.js` 只包含 derived-only 输入隔离，没有 preparation 执行路径；
- 无 `wrangler pages deploy`、无 production 变更、无 PR merge。

- [ ] **Step 5: 请求代码审查并只修 M1 范围内问题**

使用 `superpowers:requesting-code-review`，重点审查：

1. taxonomy 四态是否仍有 alias 泄漏；
2. synthetic 数值是否可能进入 dist；
3. 研究结构证据是否被误称为比例证据；
4. 9/7 template 基线和 blocked capability 是否仍被锁定；
5. 22 条旅程是否逐条覆盖正式规格，而非复制同一断言。

- [ ] **Step 6: 提交最终审查修正并推送 Draft PR**

若审查无代码修正，不制造空提交。若有范围内修正，只能从下列 M1 文件中选择实际改动项暂存：

```sh
git add tools/data/ingredient-taxonomy.v1.json tools/data/meal-templates.v2.json \
  worker/src/ingredient-taxonomy-validator.js worker/src/meal-template-validator.js worker/src/planner-v2.js \
  tools/lib/preparation-rule-validator.mjs tools/data/northeast-stew-research.v1.json \
  tools/lib/northeast-stew-research-validator.mjs tools/lib/northeast-stew-research-builder.mjs \
  tools/lib/northeast-stew-research-renderer.mjs tools/build-northeast-stew-research.mjs tools/check-recipes.mjs \
  tools/tests/ingredient-taxonomy.test.mjs tools/tests/meal-template-catalog.test.mjs \
  tools/tests/worker-planner-v2.test.mjs tools/tests/preparation-rule-candidate.test.mjs \
  tools/tests/northeast-stew-research-data.test.mjs tools/tests/northeast-stew-research-artifacts.test.mjs \
  tools/tests/regional-menu-mappings.test.mjs tools/tests/regional-atlas-artifacts.test.mjs \
  tools/tests/build-dist.test.mjs tools/tests/fixtures/northeast-stew-m1/preparation-rule.synthetic.json \
  tools/generated/northeast-stew-research.v1.json docs/northeast-stew-research.md \
  docs/northeast-stew-journey-review.md 部署说明.md
git commit -m "Harden northeast M1 evidence boundary"
```

然后推送当前分支，确认 PR #1 仍为 Draft。不得部署或合并。

---

## M1 Stop Gate

完成本计划只代表“下一步可以收集数值证据并做 2/3/4 人份厨房校准”，不代表 Planner 已支持东北锅边玉米饼。

只有以下事实全部真实存在，才可以另写 M2 计划：

- 两份独立且可换算的数值来源；
- 玉米面粗细、冷热水、是否混粉等原料状态一致；
- `ne-cal-2`、`ne-cal-3`、`ne-cal-4` 均由真人完成并通过七项 acceptance checks；
- 用户明确批准进入 M2；
- M2 在同一提交中原子加入两条生产规则、template 引用、capability partial coverage、plan preparations 与模型越界校验；
- M2 仍先 Preview，不能直接 production。

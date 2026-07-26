# Shandong One-Pot Research Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 审计山东地域层现有 1 道跨地域生产菜谱与 4 条研究候选，识别真正符合家庭一顿主餐目标的山东大锅、谷物饭和胶东海鲜面食结构，同时阻止把“北方常见”误写成“山东传统”。

**Architecture:** 新增独立的山东研究覆盖层，只读 recipe library、candidate ledger、全国地域地图与 regional mapping。覆盖层分别记录 production audit、candidate audit、concrete research leads、来源证据、家族模型、安全边界和 12 条家庭旅程；纯函数 validator、builder、renderer 与固定输入 CLI 生成机器快照和人工评审文档。研究资产不进入 `dist`，不被 Planner、Worker、前端、本地代理或 DeepSeek 读取。

**Tech Stack:** Node.js ESM、`node:test`、JSON 源账本、确定性 JSON/Markdown renderer、现有 recipe/candidate/atlas/mapping 数据、山东省及地市政府/宣传文化来源。

## Global Constraints

- 只研究 `region_id: "shandong"` 与 `CN-SD` 节点。
- 现有生产 recipe 保持 72 道（12 `approved` + 60 `auto_approved`）；不得新增、删除、改名或改状态。
- 现有 24 条 `regional-menu-research.v1.json` discovery ledger 不变；具体化的新线索只进入本研究覆盖层。
- 不修改 `index.html`、`worker/src/`、`ai_proxy.py`、Planner、template、ingredient taxonomy、Ratio DSL、营养库或 DeepSeek 契约。
- “北方常见”“山东市场有售”“山东人会吃”都不等于“起源于山东”或“山东独有”；豆角焖面保持跨地域身份。
- 山东官方页面提到猪肉豆角焖面，只能证明当代产品/消费场景，不能证明地方起源、传统固定配方、克数或安全终点。
- 大锅菜与另购馒头可以作为符合产品第一性原理的“主锅 + 现成主食”完整一顿饭路线，但不能伪装成全部同锅。
- 白菜、豆腐、五花肉的大锅菜证据不能自动证明粉条是固定核心；泰山白菜豆腐证据也不能自动证明大锅菜或主食身份。
- 宁海脑饭、海鲜疙瘩汤、海鲜地瓜面条是不同主食与技法家族，不得被压成一个模糊“胶东海鲜主食锅”。
- 山东煎饼的地域与主食身份有据，但摊煎饼、卷菜不是同锅流程；若使用现成煎饼，可作为低摩擦完整餐研究路线，不自动进入 Planner。
- 玉米面煎饼、锅边玉米饼、玉米面糊和面疙瘩是不同形态，不得互相替换。
- 鲁西南大锅路线若找不到直接证据，必须保留 `not_proven`，不得用淄博、泰山或胶东事实替它背书。
- 豆角必须烧熟煮透；海鲜必须烧熟煮透并防止交叉污染。安全来源只支持终点原则，不提供本项目克数与时间。
- 来源只存元数据和简短事实摘要，不复制完整步骤、长段原文或图片。
- 构建与检查调用 DeepSeek 0 次，不自动抓取网页。
- 不部署 Preview，不部署 production，不合并 Draft PR #1。

---

## File Map

- `tools/data/shandong-one-pot-research.v1.json` — production/candidate 审计、9 条固定来源、2 条具体研究线索、家族模型、12 条家庭旅程和产品去向的唯一源账本。
- `tools/lib/shandong-one-pot-research-validator.mjs` — schema、外键、来源范围、跨地域身份与反误导规则。
- `tools/lib/shandong-one-pot-research-builder.mjs` — 只读合并现有四类账本并生成研究报告。
- `tools/lib/shandong-one-pot-research-renderer.mjs` — 确定性 JSON/Markdown 输出。
- `tools/build-shandong-one-pot-research.mjs` — 固定输入 `--write|--check` CLI。
- `tools/generated/shandong-one-pot-research.v1.json` — 机器审计快照。
- `docs/shandong-one-pot-research.md` — 山东研究报告。
- `docs/shandong-one-pot-journey-review.md` — 12 条家庭旅程人工评审表，初始全部 `pending`。
- `tools/tests/shandong-one-pot-research-data.test.mjs` — 真实账本与关键证据边界测试。
- `tools/tests/shandong-one-pot-research-builder.test.mjs` — 报告、家族、覆盖与产品去向测试。
- `tools/tests/shandong-one-pot-research-artifacts.test.mjs` — renderer、CLI freshness、总门禁与 `dist` 隔离测试。
- `tools/check-recipes.mjs` — 加入山东研究覆盖层与产物 freshness 检查。
- `tools/tests/recipe-library.test.mjs` — 总门禁临时沙箱复制新增研究数据。
- `部署说明.md` — 加入山东研究检查命令与非运行时边界。

## Stable Interfaces

```js
validateShandongOnePotResearch({
  assessment,
  recipeLibrary,
  regionalResearch,
  regionalAtlas,
  regionalMappings,
}): string[]

buildShandongOnePotResearchReport(inputs): ShandongOnePotResearchReport
validateShandongOnePotResearchReport(report): string[]
formatShandongOnePotResearchSummary(report): string
buildShandongOnePotResearchArtifacts(report): Map<string, string>
```

`buildShandongOnePotResearchArtifacts()` 固定返回：

```js
new Map([
  ['tools/generated/shandong-one-pot-research.v1.json', jsonText],
  ['docs/shandong-one-pot-research.md', markdownText],
  ['docs/shandong-one-pot-journey-review.md', reviewMarkdown],
])
```

---

### Task 1: 建立生产条目、四候选与来源边界账本

**Files:**
- Create: `tools/data/shandong-one-pot-research.v1.json`
- Create: `tools/lib/shandong-one-pot-research-validator.mjs`
- Create: `tools/tests/shandong-one-pot-research-data.test.mjs`

**Interfaces:**
- Consumes: 72 道 recipe、24 条 regional research、全国 atlas 与 regional mapping。
- Produces: `validateShandongOnePotResearch(inputs): string[]`。

- [x] **Step 1: 写外键、地域身份、组合边界与安全边界的失败测试**

```js
const PRODUCTION_IDS = ['north-china-green-bean-braised-noodles'];
const CANDIDATE_IDS = [
  'shandong-cabbage-tofu-vermicelli-pot',
  'shandong-seafood-staple-pot',
  'shandong-southwest-family-pot',
  'shandong-vegetable-cornmeal-one-pot',
];

test('assessment audits exactly one production recipe and four Shandong candidates', () => {
  assert.deepEqual(assessment.production_recipe_audits.map(row => row.recipe_id), PRODUCTION_IDS);
  assert.deepEqual(assessment.candidate_audits.map(row => row.candidate_id).sort(), CANDIDATE_IDS.sort());
  assert.deepEqual(validateShandongOnePotResearch(inputs), []);
});

test('Shandong consumption evidence never turns northern braised noodles into a Shandong-specific tradition', () => {
  const row = assessment.production_recipe_audits[0];
  assert.equal(row.claims.shandong_current_presence.verdict, 'supported');
  assert.equal(row.claims.shandong_specific_origin.verdict, 'not_proven');
  assert.equal(row.regional_scope_decision, 'cross_regional_chinese');
});

test('large-pot evidence does not silently add vermicelli or claim a same-pot staple', () => {
  const row = assessment.candidate_audits.find(item => item.candidate_id === 'shandong-cabbage-tofu-vermicelli-pot');
  assert.equal(row.claims.cabbage_tofu_large_pot.verdict, 'supported');
  assert.equal(row.claims.vermicelli_as_fixed_core.verdict, 'not_proven');
  assert.equal(row.claims.complete_same_pot_main_meal.verdict, 'not_proven');
});

test('generic seafood-pot hypothesis is refined into concrete noodle families', () => {
  assert.deepEqual(assessment.concrete_research_leads.map(row => row.lead_id).sort(), [
    'shandong-haixian-dough-drop-soup',
    'shandong-ninghai-naofan',
  ]);
  assert.ok(assessment.concrete_research_leads.every(row => row.production_recipe_id === null));
});
```

- [x] **Step 2: 运行测试并确认先红**

Run:

```bash
node --test tools/tests/shandong-one-pot-research-data.test.mjs
```

Expected: FAIL because the data and validator modules do not exist.

- [x] **Step 3: 实现严格 validator**

`validateShandongOnePotResearch()` 固定校验：

```js
const EXPECTED_PRODUCTION_IDS = new Set(['north-china-green-bean-braised-noodles']);
const EXPECTED_CANDIDATE_IDS = new Set([
  'shandong-cabbage-tofu-vermicelli-pot',
  'shandong-vegetable-cornmeal-one-pot',
  'shandong-seafood-staple-pot',
  'shandong-southwest-family-pot',
]);
const VERDICTS = new Set(['supported', 'not_proven', 'contradicted']);
const AUDIT_STATES = new Set(['evidence_checked', 'needs_more_evidence', 'rejected']);
const DESTINATIONS = new Set([
  'recipe_evidence', 'template_evidence', 'taxonomy_rule', 'ratio_rule',
  'content_only', 'research_only', 'new_family_research', 'rejected',
]);
```

并执行以下行为：

- 顶层版本必须为 `shandong-one-pot-research-v1-20260726`，地域必须是 `shandong`，省级节点必须恰好为 `CN-SD`；
- production recipe 必须存在、仍为 `auto_approved`，mapping 必须包含 `shandong` 但 `province_codes` 为空；
- 四条 candidate 必须存在于 regional research ledger，mapping 必须为 `CN-SD`；
- 每个 claim 必须有 `verdict/evidence_source_ids/reason`；`supported` 必须由来源 `proves` 精确反向引用；
- 项目 canonical URL 不得作为山东地域来源；来源必须为 HTTPS、日期有效且不晚于 2026-07-26；
- `shandong_specific_origin` 必须是 `not_proven`，production 条目必须保持 `cross_regional_chinese`；
- 大锅菜条目的 `vermicelli_as_fixed_core` 与 `complete_same_pot_main_meal` 必须保持 `not_proven`；
- 鲁西南候选不得借淄博、泰山或胶东来源变成 `supported`；
- 玉米面候选必须区分 `ready_pancake`、`cornmeal_batter`、`pot-edge-cake` 三种形态；
- 海鲜候选必须拆成 `dough_drop`、`sweet_potato_noodle` 等具体主食形态；
- 豆角和海鲜安全规则必须引用安全来源，但不得生成本项目克数、时间或温度；
- concrete lead 的 `production_recipe_id` 必须为 `null`，只可进入 `research_only` 或 `new_family_research`；
- `human_review.status` 初始只能为 `pending`，三个人工判断字段必须为 `null`；
- malformed root、未知 ID、重复 ID、错误外键和 malformed nested row 返回字符串错误，不抛异常。

- [x] **Step 4: 写入 9 条固定来源与谨慎结论**

| source_id | 等级 | 允许证明 |
| --- | --- | --- |
| `sd-zibo-large-pot-2025` | A | 淄博东东峪大锅菜使用白菜、豆腐、五花肉；馒头另购另食 |
| `sd-taishan-cabbage-tofu-2024` | A | 泰山白菜与豆腐的地域组合；不证明粉条或大锅主餐 |
| `yt-ninghai-naofan-2018` | A | 小米、豆浆/豆腐脑、粉条与蔬菜的宁海脑饭结构 |
| `qd-seafood-dough-soup-2025` | A | 青岛海鲜与面疙瘩同煮的主食汤结构 |
| `wh-seafood-sweet-potato-noodle-2023` | A | 威海海鲜地瓜面条的地方产品名称；不证明完整步骤与比例 |
| `sd-pancake-culture-2025` | A | 山东煎饼主食身份、通常卷入另制菜；不证明同锅 |
| `sd-pork-bean-noodle-product-2022` | A | 山东当代市场存在猪肉豆角焖面；不证明山东起源 |
| `nm-west-braised-noodle-2018` | A | 晋北至内蒙古西部焖面地域线索；不证明山东独有 |
| `yt-food-safety-2024` | A | 豆角、海鲜烧熟煮透与交叉污染边界 |

结论必须明确：

- 北方豆角焖面保持跨地域；山东当代产品存在不能把它改名为山东地方菜；
- 白菜豆腐五花肉大锅菜有山东事实，但粉条固定核心与同锅主食未证明；现成馒头可以作为完整餐补充，但必须显式写为锅外主食；
- 宁海脑饭与海鲜疙瘩汤是更具体、更符合主餐目标的山东研究路线；
- 海鲜地瓜面条只有名称级证据，主食形态、海鲜种类和安全仍待细化；
- 蔬菜玉米面同锅和鲁西南大锅路线当前过于模糊，保留研究或拒绝，不创建 recipe。

- [x] **Step 5: 运行专项测试并确认通过**

```bash
node --test tools/tests/shandong-one-pot-research-data.test.mjs
```

Expected: all tests PASS.

---

### Task 2: 构建山东研究报告与 12 条家庭旅程

**Files:**
- Create: `tools/lib/shandong-one-pot-research-builder.mjs`
- Create: `tools/tests/shandong-one-pot-research-builder.test.mjs`

**Interfaces:**
- Consumes: Task 1 的已校验 inputs。
- Produces: report builder、report validator 与 summary formatter。

- [x] **Step 1: 写完整报告、产品去向和旅程结论的失败测试**

```js
test('report contains the complete Shandong audit package', () => {
  const report = buildShandongOnePotResearchReport(inputs);
  assert.deepEqual(validateShandongOnePotResearchReport(report), []);
  assert.equal(report.production_recipe_audits.length, 1);
  assert.equal(report.candidate_audits.length, 4);
  assert.equal(report.concrete_research_leads.length, 2);
  assert.equal(report.source_evidence.length, 9);
  assert.equal(report.household_journeys.length, 12);
});

test('report separates same-pot, pot-plus-ready-staple, and multi-process routes', () => {
  const ids = new Set(report.family_model.map(row => row.family_id));
  assert.ok(ids.has('noodle-braise'));
  assert.ok(ids.has('grain-soy-composite-bowl'));
  assert.ok(ids.has('seafood-noodle-broth'));
  assert.ok(ids.has('pot-plus-ready-staple'));
  assert.ok(ids.has('multi-process-pancake-meal'));
});

test('initial round remains research_in_progress with exact blockers', () => {
  assert.equal(report.completion.status, 'research_in_progress');
  assert.deepEqual(report.completion.blockers, [
    'regional_identity_gaps',
    'candidate_specificity_gaps',
    'ratio_evidence_incomplete',
    'safety_endpoint_incomplete',
    'human_journey_review_incomplete',
  ]);
});
```

- [x] **Step 2: 运行测试并确认先红**

```bash
node --test tools/tests/shandong-one-pot-research-builder.test.mjs
```

Expected: FAIL because the builder does not exist.

- [x] **Step 3: 实现 builder 与 report validator**

报告固定生成：

- `region_overview`：山东生产 1、研究候选 4、具体研究线索 2；
- `production_recipe_audits` 与 `candidate_audits`：保留 claim 级 verdict；
- `family_model`：至少区分焖面、谷物豆制复合饭、海鲜汤面、大锅菜加现成主食、煎饼卷菜多流程；
- `ingredient_shape_matrix`：鲜面/面疙瘩/地瓜面/粉条/煎饼/玉米面团分别建行；
- `adaptation_boundaries`：跨地域到山东、粉条补入、馒头锅外补充、海鲜泛称具体化、现成煎饼、家庭锅容量与安全；
- `product_decisions`：优先具体路线，模糊候选不因来源数量自动晋升；
- `completion`：固定 `research_in_progress` 与五项 blocker；
- `summary`：所有计数从 report 数组推导，不信任源账本手填汇总。

- [x] **Step 4: 固定 12 条真实家庭旅程**

| ID | 输入 | 关键预期 |
| --- | --- | --- |
| `sd-j01` | 鲜面、豆角、猪肉末 | 可走跨北方焖面；不得显示“山东传统” |
| `sd-j02` | 鲜面、豆角、土豆 | 组合可能合理，但山东特定身份与比例未证明 |
| `sd-j03` | 白菜、豆腐、五花肉 | 大锅菜组合有据；缺主食时不能称完整同锅主餐 |
| `sd-j04` | 白菜、豆腐、粉条 | 不能用白菜豆腐来源自动证明粉条固定核心 |
| `sd-j05` | 白菜、豆腐、五花肉、现成馒头 | 可解释为主锅加现成主食的完整一顿饭 |
| `sd-j06` | 小米、无糖豆浆、粉条、小菜心 | 宁海脑饭家族有据，家庭比例与豆腐脑状态待研究 |
| `sd-j07` | 虾仁、蛤蜊、面粉 | 海鲜疙瘩汤家族有据，海鲜安全与面疙瘩比例待研究 |
| `sd-j08` | 海鲜、地瓜面条 | 名称有据，泛称海鲜不能直接放行 |
| `sd-j09` | 耐煮蔬菜、玉米面 | 不得把煎饼、玉米糊或锅边饼任意当成同一方案 |
| `sd-j10` | 现成山东煎饼、炒蔬菜 | 可作为低摩擦完整餐研究，但不是同锅生成 |
| `sd-j11` | 白菜、豆腐、粉条、猪肉 | 鲁西南标签缺乏直接证据，不得伪造地域身份 |
| `sd-j12` | 未知贝类、豆角、鲜面 | 安全与识别不完整时保留 unplanned，不生成成功结论 |

每条 `human_review` 固定：

```json
{
  "status": "pending",
  "reviewer": null,
  "reviewed_at": null,
  "household_intuition": null,
  "operability": null,
  "taste_judgement": null,
  "notes": "",
  "conclusion": null
}
```

- [x] **Step 5: 运行专项测试并确认通过**

```bash
node --test tools/tests/shandong-one-pot-research-builder.test.mjs
```

Expected: all tests PASS.

---

### Task 3: 生成审计产物并接入聚合门禁

**Files:**
- Create: `tools/lib/shandong-one-pot-research-renderer.mjs`
- Create: `tools/build-shandong-one-pot-research.mjs`
- Create: `tools/generated/shandong-one-pot-research.v1.json`
- Create: `docs/shandong-one-pot-research.md`
- Create: `docs/shandong-one-pot-journey-review.md`
- Create: `tools/tests/shandong-one-pot-research-artifacts.test.mjs`
- Modify: `tools/check-recipes.mjs`
- Modify: `tools/tests/recipe-library.test.mjs`
- Modify: `部署说明.md`

**Interfaces:**
- Consumes: Task 2 report。
- Produces: 三份确定性产物与总门禁 freshness 结果。

- [x] **Step 1: 写 renderer、CLI、总门禁和 dist 隔离的失败测试**

```js
test('renderers are deterministic and preserve production versus research boundaries', () => {
  assert.equal(renderShandongOnePotResearchJson(report), renderShandongOnePotResearchJson(report));
  assert.match(renderShandongOnePotResearchMarkdown(report), /不是生产菜谱批准/);
  assert.match(renderShandongOnePotJourneyReviewMarkdown(report), /待人工评审/);
});

test('aggregate recipe gate includes Shandong research freshness', () => {
  const result = spawnSync(process.execPath, ['tools/check-recipes.mjs'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1 Shandong production audit · 4 candidates · 12 journeys · Shandong research ok/);
});

test('distribution build excludes Shandong research assets', () => {
  assert.equal(fs.existsSync(path.join(dist, 'shandong-one-pot-research.v1.json')), false);
});
```

- [x] **Step 2: 运行测试并确认先红**

```bash
node --test tools/tests/shandong-one-pot-research-artifacts.test.mjs
```

Expected: FAIL because renderer/CLI/artifacts do not exist.

- [x] **Step 3: 实现 renderer 与 CLI**

Markdown 报告固定章节：

1. 山东范围与核心纠偏；
2. 生产条目审计；
3. 四候选审计；
4. 五种家庭主餐结构；
5. 食材与主食形态矩阵；
6. 固定来源证据包；
7. 家庭适配和安全边界；
8. 两条具体研究线索；
9. 产品去向决策；
10. 12 条家庭旅程；
11. 完成状态与 blocker。

CLI 参数只接受 `--write`、`--check`，无参数或多参数失败退出；`--check` 对三份产物逐字比对。

- [x] **Step 4: 生成产物并确认专项测试通过**

```bash
node tools/build-shandong-one-pot-research.mjs --write
node --test tools/tests/shandong-one-pot-research-artifacts.test.mjs
```

Expected: all tests PASS.

- [x] **Step 5: 接入总门禁与部署说明**

`tools/check-recipes.mjs` 在 recipe、atlas、Northeast、Jiangnan 输入均有效时构建山东报告，执行 report validator，并逐字校验三份产物；成功输出：

```text
1 Shandong production audit · 4 candidates · 12 journeys · Shandong research ok
```

`tools/tests/recipe-library.test.mjs` 的 `CHECKER_DATA_FILES` 加入 `shandong-one-pot-research.v1.json`，临时沙箱继续复制完整 `lib/generated/docs`。

`部署说明.md` 加入：

```bash
node tools/build-shandong-one-pot-research.mjs --check
```

并明确山东研究资产不进入 `dist`，不改变运行时，也不表示菜谱或候选获批。

- [x] **Step 6: 运行完整验证**

```bash
node --test --test-force-exit --test-concurrency=1 tools/tests/*.test.mjs
node tools/check-recipes.mjs
node tools/build-shandong-one-pot-research.mjs --check
node tools/run-pantry-planner-v2-journeys.mjs
python3 -m py_compile ai_proxy.py
git diff --check
```

再用同一 ASCII build ID 连续运行两次 `tools/build-dist.mjs` 并 `diff -qr`；两份构建必须相同，且不得包含山东研究数据、生成 JSON 或 Markdown。

- [ ] **Step 7: 审计边界并更新现有 Draft PR**

确认以下路径 diff 为空：

```text
index.html
ai_proxy.py
worker/src/
tools/data/recipe-library.json
tools/data/regional-menu-research.v1.json
tools/data/regional-atlas.v2.json
tools/data/regional-menu-mappings.v1.json
tools/data/meal-templates.v2.json
tools/data/ingredient-taxonomy.v1.json
tools/data/ratio-rules.v1.json
```

提交并推送 `codex/targeted-recipe-expansion`，保持 PR #1 为 Draft；不 merge、不部署。

---

## Plan Self-Review

- Spec coverage: 覆盖全国框架后的逐地域下钻、用户点名的山东焖面、山东四候选、家庭适配、真实旅程、来源、机器门禁和非运行时边界。
- Placeholder scan: 无 `TODO/TBD/类似 Task N/稍后实现`。
- Type consistency: validator、builder、renderer、CLI 与三份产物名称在全部任务中一致。
- Product fidelity: 以“是否形成低摩擦的一顿主餐”为标准，不把锅具字面当唯一判断；同时诚实标注锅外现成主食与多流程路线。
- Safety: 豆角与海鲜安全证据独立，研究层不编造时间、温度或克数。

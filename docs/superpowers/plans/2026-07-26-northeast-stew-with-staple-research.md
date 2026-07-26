# Northeast Stew-with-Staple Research Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把东北首轮四个 `stew-with-staple` 研究题目从宽泛的 `discovery_only` 假设推进为可机器审计的事实结论、同构变种关系、家庭适配边界和产品去向，同时诚实驳回或降级证据不支持的地域与食材主张。

**Architecture:** 保留现有 72 道 recipe、24 条发现层候选和全国地域地图不变，新增一份东北专属的“研究评估覆盖层”。覆盖层以现有四个 `atlas_id` 为外键，保存 claim 级来源证据、反证、家族模型、食材矩阵、十条家庭旅程和产品去向；纯函数 validator、builder、renderer 和固定输入 CLI 生成机器 JSON 与人工 Markdown。总门禁只检查结构和产物新鲜度，研究资产不进入 `dist`，不被 Planner、Worker、前端或 DeepSeek 读取。

**Tech Stack:** Node.js ESM、`node:test`、JSON 源账本、确定性 JSON/Markdown renderer、现有全国地域地图与研究候选账本、公开政府与文旅来源。

## Global Constraints

- 只研究 `region_id: "northeast"`、`family_id: "stew-with-staple"` 和现有四个东北 `atlas_id`。
- 不新增、删除或修改生产 recipe；数量保持 72（12 `approved` + 60 `auto_approved`）。
- 不新增或删除研究候选；`tools/data/regional-menu-research.v1.json` 保持 24 条 discovery ledger。
- 不修改 template、ingredient taxonomy、Ratio DSL、Planner、Worker、`ai_proxy.py`、前端或 DeepSeek 契约。
- 研究评估覆盖层可以纠正 discovery 假设，但不能反向改写历史发现账本。
- 来源内容只保存元数据和简短事实摘要；不复制完整步骤、长段原文或图片。
- `fact_checked` 只证明来源明确支持的地域、名称、核心食材或高层技法；不同来源里的食材不得静默拼成一个“传统固定组合”。
- 黑龙江铁锅炖、吉林鸡菌菇或鱼锅、辽宁铁锅炖鱼和北京平谷粘卷子必须保持各自证据范围。
- 粘卷子已有北京平谷直接来源时，不得继续无依据宣称东北关联已核实；北京证据同样不能被误用为“东北不存在粘卷子”的证明。
- 鱼、鸡肉、排骨和豆角保留独立安全分支；本计划不编造温度、时间或克数。
- 玉米面饼、小花卷和粘卷子保持三种独立形态；没有机器比例证据时标 `unresearched`，不得借用其他面团比例。
- 每条家庭旅程只评估研究家族的可解释适配，不宣称 Planner 已支持。
- 构建和检查调用 DeepSeek 0 次，不做自动网络抓取；来源 URL 由人工核实后写入固定账本。
- 不部署 Preview，不部署 production，不合并 Draft PR #1。

---

## File Map

- `tools/data/northeast-stew-research.v1.json` — 四个原型、七条来源、claim 结论、家族模型、食材覆盖矩阵、十条旅程和产品去向的唯一源账本。
- `tools/lib/northeast-stew-research-validator.mjs` — 严格 schema、外键、来源范围、结论状态、形态分离和反误导规则。
- `tools/lib/northeast-stew-research-builder.mjs` — 将评估覆盖层与现有研究候选及全国地域目录只读合并，生成审计报告。
- `tools/lib/northeast-stew-research-renderer.mjs` — 确定性 JSON/Markdown 输出。
- `tools/build-northeast-stew-research.mjs` — 固定输入 `--write|--check` CLI。
- `tools/generated/northeast-stew-research.v1.json` — 机器审计快照，生成文件。
- `docs/northeast-stew-research.md` — 七项标准交付物的人类可读报告，生成文件。
- `docs/northeast-stew-journey-review.md` — 十条旅程的人工厨房评审表，初始全部 `pending`。
- `tools/tests/northeast-stew-research-data.test.mjs` — 真实账本与关键事实边界测试。
- `tools/tests/northeast-stew-research-builder.test.mjs` — 合并、变种、覆盖矩阵和产品去向测试。
- `tools/tests/northeast-stew-research-artifacts.test.mjs` — renderer、CLI freshness、总门禁和 `dist` 隔离测试。
- `tools/check-recipes.mjs` — 加入东北研究覆盖层和生成物 freshness 检查。
- `部署说明.md` — 记录东北研究检查命令与审计资产不进运行时的边界。

## Stable Interfaces

```js
validateNortheastStewResearch({
  assessment,
  regionalAtlas,
  regionalResearch,
}): string[]

buildNortheastStewResearchReport({
  assessment,
  regionalAtlas,
  regionalResearch,
}): NortheastStewResearchReport

validateNortheastStewResearchReport(report): string[]

formatNortheastStewResearchSummary(report): string

buildNortheastStewResearchArtifacts(report): Map<string, string>
```

`buildNortheastStewResearchArtifacts()` 固定返回：

```js
new Map([
  ['tools/generated/northeast-stew-research.v1.json', jsonText],
  ['docs/northeast-stew-research.md', markdownText],
  ['docs/northeast-stew-journey-review.md', reviewMarkdown],
])
```

---

### Task 1: 建立东北 claim 级研究覆盖层

**Files:**
- Create: `tools/data/northeast-stew-research.v1.json`
- Create: `tools/lib/northeast-stew-research-validator.mjs`
- Create: `tools/tests/northeast-stew-research-data.test.mjs`

**Interfaces:**
- Consumes: `tools/data/regional-atlas.v2.json` 与 `tools/data/regional-menu-research.v1.json`。
- Produces: `validateNortheastStewResearch({ assessment, regionalAtlas, regionalResearch }): string[]` 和后续 builder 使用的固定评估 schema。

- [ ] **Step 1: 写四个外键与来源范围的失败测试**

创建测试，加载三份真实 JSON 并锁定四个现有东北 ID：

```js
const EXPECTED_IDS = [
  'northeast-chicken-mushroom-potato-corn-cake',
  'northeast-fish-tofu-vegetable-corn-cake',
  'northeast-ribs-beans-corn-cake',
  'northeast-ribs-beans-sticky-rolls',
];

test('assessment covers exactly the four existing northeast candidates', () => {
  assert.deepEqual(
    assessment.prototypes.map(row => row.atlas_id).sort(),
    EXPECTED_IDS,
  );
  assert.deepEqual(validateNortheastStewResearch({
    assessment, regionalAtlas, regionalResearch,
  }), []);
});

test('claim evidence cannot merge separate source facts into a traditional fixed combination', () => {
  const chicken = assessment.prototypes.find(row => row.atlas_id.includes('chicken'));
  assert.equal(chicken.claims.exact_combination.verdict, 'not_proven');
  assert.equal(chicken.claims.family_compatibility.verdict, 'supported');
});

test('sticky rolls keep verified Beijing geography separate from an unproven northeast link', () => {
  const sticky = assessment.prototypes.find(row => row.atlas_id.endsWith('sticky-rolls'));
  assert.equal(sticky.claims.northeast_identity.verdict, 'not_proven');
  assert.deepEqual(sticky.verified_geography.province_codes, ['CN-BJ']);
});

test('fish plus tofu remains unproven even when fish plus corn cake is supported', () => {
  const fish = assessment.prototypes.find(row => row.atlas_id.includes('fish-tofu'));
  assert.equal(fish.claims.fish_corn_cake_family.verdict, 'supported');
  assert.equal(fish.claims.tofu_as_traditional_core.verdict, 'not_proven');
});
```

- [ ] **Step 2: 运行测试并确认先红**

Run:

```bash
node --test tools/tests/northeast-stew-research-data.test.mjs
```

Expected: FAIL with missing `northeast-stew-research.v1.json` or missing validator module.

- [ ] **Step 3: 实现严格 validator**

`validateNortheastStewResearch()` 必须：

```js
const EXPECTED_ATLAS_IDS = new Set([
  'northeast-chicken-mushroom-potato-corn-cake',
  'northeast-fish-tofu-vegetable-corn-cake',
  'northeast-ribs-beans-corn-cake',
  'northeast-ribs-beans-sticky-rolls',
]);
const VERDICTS = new Set(['supported', 'not_proven', 'contradicted']);
const STATES = new Set(['fact_checked', 'needs_more_evidence', 'rejected']);
const DESTINATIONS = new Set([
  'recipe_evidence', 'template_evidence', 'taxonomy_rule',
  'ratio_rule', 'content_only', 'rejected',
]);
const SOURCE_GRADES = new Set(['A', 'B', 'C']);
```

并执行以下固定规则：

- 顶层 `schema_version === 1`、`assessment_version === "northeast-stew-research-v1-20260726"`；
- `region_id === "northeast"`、`family_id === "stew-with-staple"`；
- `province_codes` 恰好是 `CN-LN`、`CN-JL`、`CN-HL`；
- 四个 `atlas_id` 与 discovery ledger 精确一致且不得与生产 recipe 混用；
- 每个 claim 必须包含 `verdict`、非空 `evidence_source_ids`、`reason`；`not_proven` 可使用证明邻近事实的来源，但 reason 必须说明缺少哪条直接联系；
- `contradicted` 必须引用直接否定该 claim 的来源；证明另一地域也有同类做法，只能形成 `not_proven`，不能当作排他性反证；
- 来源必须为 HTTPS，含 `source_id/title/url/publisher/published_at/retrieved_at/source_grade/evidence_summary/proves/does_not_prove`；日期必须是真实日历日期且不晚于 2026-07-26；
- `source_grade: C` 不能单独支持 `fact_checked`；
- `corn_dough_cake`、`wheat_flower_roll`、`sticky_roll` 必须是三个独立 staple form；
- `chicken`、`pork_ribs`、`fish`、`green_beans` 必须是四个独立 safety branch，且未研究状态不得带具体时间、温度或克数；
- `priority.product_score + priority.regional_score - priority.risk_penalty === priority.total_score`；
- 未知字段、重复 ID、空数组、错误外键和 malformed nested object 都返回字符串错误，不能抛 `TypeError`。

- [ ] **Step 4: 写入七条固定来源及四个谨慎结论**

在源账本中只写简短事实摘要，不复制做法。首批来源固定为：

| source_id | 等级 | URL | 只允许证明 |
|---|---|---|---|
| `hlj-gov-iron-pot-2025` | A | `https://www.hlj.gov.cn/hlj/tsms/202501/c00_31797990.shtml` | 哈尔滨/东北铁锅炖；排骨或鸡块、土豆、玉米段；锅边玉米饼和小花卷 |
| `hlj-culture-autumn-pot-2025` | A | `https://wlt.hlj.gov.cn/wlt/c114254/202508/c00_31863513.shtml` | 黑龙江铁锅炖家族；江鱼、鸡+榛蘑、排骨+油豆角三类炖菜；锅边玉米面饼 |
| `jilin-huadian-routes-2025` | A | `https://whhlyt.jl.gov.cn/ztzl/jlslyxlhxj/gdxl/jls/hds/202507/t20250704_9273173.html` | 吉林桦甸灶台鱼、鸡+榛蘑、公吉小笨鸡+土豆+蘑菇；不证明它们与锅边饼同锅 |
| `jilin-lishu-routes-2025` | A | `https://whhlyt.jl.gov.cn/ztzl/jlslyxlhxj/gdxl/sps/lsx/202507/t20250708_9275953.html` | 吉林梨树铁锅炖江鱼、笨鸡、大鹅、大骨家族；不证明具体锅边主食 |
| `jilin-baishan-food-2024` | A | `https://www.jl.gov.cn/yaowen/202409/t20240920_3299348.html` | 吉林白山铁锅炖鲤鱼、小鸡炖蘑菇、排骨炖豆角；不证明三者与锅边主食同锅 |
| `liaoning-autumn-food-2025` | A | `https://whly.ln.gov.cn/whly/tpxw/2025110716014218277/index.shtml` | 辽宁铁锅炖鱼及铁锅炖鸡鹅鱼家族；不证明锅边主食或豆腐 |
| `beijing-pinggu-sticky-roll-2019` | B | `https://www.visitbeijing.com.cn/article/47QmeqUNmDQ` | 北京平谷豆角粘卷子的明确地域、菜饭同锅结构；不证明也不否定东北存在同类做法 |

四个原型的固定研究结论：

1. `ribs-beans-corn-cake`：黑龙江家族级组合直接受到 A 级来源支持，`research_state: fact_checked`，产品去向为 `template_evidence` 与 `recipe_evidence`，比例与安全仍未完成；
2. `chicken-mushroom-potato-corn-cake`：鸡+蘑菇+土豆与鸡/玉米饼分别受支持，但“四项固定传统组合”没有单一来源直接证明；`research_state: needs_more_evidence`，只作为 `template_evidence`；
3. `fish-tofu-vegetable-corn-cake`：鱼+玉米饼家族受到支持，豆腐作为传统核心未获支持；`research_state: needs_more_evidence`，建议把豆腐降为未来受控可选槽位研究，不得宣称传统核心；
4. `ribs-beans-sticky-rolls`：现有直接来源只核实北京平谷；东北地域 claim 为 `not_proven`，`research_state: needs_more_evidence`，当前东北轮产品去向为 `content_only`，并在京津冀轮复用已核实的北京证据。不得从北京证据反推东北不存在同类做法。

- [ ] **Step 5: 运行测试并确认通过**

Run:

```bash
node --test tools/tests/northeast-stew-research-data.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 6: 提交**

```bash
git add tools/data/northeast-stew-research.v1.json tools/lib/northeast-stew-research-validator.mjs tools/tests/northeast-stew-research-data.test.mjs
git commit -m "data: assess northeast stew evidence"
```

---

### Task 2: 构建七项地域研究交付物

**Files:**
- Create: `tools/lib/northeast-stew-research-builder.mjs`
- Create: `tools/tests/northeast-stew-research-builder.test.mjs`

**Interfaces:**
- Consumes: Task 1 通过校验的 assessment、全国 atlas 和 24 条 discovery ledger。
- Produces: `buildNortheastStewResearchReport(...)`、`validateNortheastStewResearchReport(report)`、`formatNortheastStewResearchSummary(report)`。

- [ ] **Step 1: 写报告结构的失败测试**

```js
const assessment = JSON.parse(fs.readFileSync(new URL('../data/northeast-stew-research.v1.json', import.meta.url), 'utf8'));
const regionalAtlas = JSON.parse(fs.readFileSync(new URL('../data/regional-atlas.v2.json', import.meta.url), 'utf8'));
const regionalResearch = JSON.parse(fs.readFileSync(new URL('../data/regional-menu-research.v1.json', import.meta.url), 'utf8'));
const inputs = { assessment, regionalAtlas, regionalResearch };

test('report contains all seven required regional deliverables', () => {
  const report = buildNortheastStewResearchReport(inputs);
  assert.deepEqual(validateNortheastStewResearchReport(report), []);
  assert.equal(report.region_overview.region_id, 'northeast');
  assert.equal(report.prototype_candidates.length, 4);
  assert.ok(report.variant_relationships.length >= 4);
  assert.ok(report.ingredient_coverage_matrix.length >= 8);
  assert.equal(report.source_evidence_pack.length, 7);
  assert.ok(report.home_adaptation_boundaries.length >= 6);
  assert.equal(report.product_destination_decisions.length, 4);
});

test('report separates supported family facts from unproven exact combinations', () => {
  const report = buildNortheastStewResearchReport(inputs);
  const chicken = report.prototype_candidates.find(row => row.atlas_id.includes('chicken'));
  assert.equal(chicken.exact_combination_status, 'not_proven');
  assert.equal(chicken.family_compatibility_status, 'supported');
});

test('report keeps three staple forms and four safety branches separate', () => {
  const report = buildNortheastStewResearchReport(inputs);
  assert.deepEqual(report.family_model.staple_forms.map(row => row.form_id).sort(), [
    'corn_dough_cake', 'sticky_roll', 'wheat_flower_roll',
  ]);
  assert.deepEqual(report.family_model.safety_branches.map(row => row.branch_id).sort(), [
    'chicken', 'fish', 'green_beans', 'pork_ribs',
  ]);
});
```

- [ ] **Step 2: 运行测试并确认先红**

Run:

```bash
node --test tools/tests/northeast-stew-research-builder.test.mjs
```

Expected: FAIL with missing builder module.

- [ ] **Step 3: 实现纯函数 builder 和报告 validator**

报告顶层固定为：

```js
{
  schema_version: 1,
  assessment_version,
  region_overview,
  prototype_candidates,
  variant_relationships,
  ingredient_coverage_matrix,
  source_evidence_pack,
  home_adaptation_boundaries,
  product_destination_decisions,
  family_model,
  journey_cases,
  completion_status,
  summary,
}
```

构建器必须从源账本推导，而不是手写计数：

- `fact_checked_count`；
- `needs_more_evidence_count`；
- `rejected_count`；
- `source_count_by_grade`；
- `journey_count` 与 `journey_reviewed_count`；
- `ratio_ready_form_count` 与 `safety_ready_branch_count`；
- `completion_status`。

`completion_status` 固定规则：只有四个原型均获得 `fact_checked` 或 `rejected` 的研究结论并具有产品去向、三个 staple form 均有机器比例证据、四个安全分支均完成、十条旅程全部有人工结论时才为 `regional_round_complete`；否则必须为 `research_in_progress` 并列出 `blocking_gaps`。本轮初始报告必须诚实得到 `research_in_progress`。

- [ ] **Step 4: 增加反误导和总函数测试**

```js
test('initial northeast round remains in progress instead of claiming completion', () => {
  const report = buildNortheastStewResearchReport(inputs);
  assert.equal(report.completion_status.status, 'research_in_progress');
  assert.ok(report.completion_status.blocking_gaps.includes('prototype_evidence_incomplete'));
  assert.ok(report.completion_status.blocking_gaps.includes('ratio_evidence_incomplete'));
  assert.ok(report.completion_status.blocking_gaps.includes('safety_evidence_incomplete'));
  assert.ok(report.completion_status.blocking_gaps.includes('human_journey_review_incomplete'));
});

test('builder and validator are total for malformed nested inputs', () => {
  assert.doesNotThrow(() => buildNortheastStewResearchReport({
    assessment: { prototypes: [null] },
    regionalAtlas: null,
    regionalResearch: { entries: [null] },
  }));
  assert.ok(validateNortheastStewResearchReport(null).length > 0);
});
```

- [ ] **Step 5: 运行 builder 测试并确认通过**

Run:

```bash
node --test tools/tests/northeast-stew-research-builder.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 6: 提交**

```bash
git add tools/lib/northeast-stew-research-builder.mjs tools/tests/northeast-stew-research-builder.test.mjs
git commit -m "feat: build northeast stew research report"
```

---

### Task 3: 建立十条真实家庭食材旅程与人工评审门槛

**Files:**
- Modify: `tools/data/northeast-stew-research.v1.json`
- Modify: `tools/tests/northeast-stew-research-data.test.mjs`
- Modify: `tools/tests/northeast-stew-research-builder.test.mjs`

**Interfaces:**
- Consumes: Task 1 的 family facts 与 Task 2 的 report schema。
- Produces: 恰好十条 `journey_cases` 及 `manual_review` 状态，供 renderer 和 completion gate 使用。

- [ ] **Step 1: 写十条旅程完整性失败测试**

```js
test('ten household journeys cover positive negative and boundary cases', () => {
  assert.equal(assessment.journey_cases.length, 10);
  assert.equal(new Set(assessment.journey_cases.map(row => row.journey_id)).size, 10);
  assert.ok(assessment.journey_cases.some(row => row.expected_research_outcome === 'supported_family_route'));
  assert.ok(assessment.journey_cases.some(row => row.expected_research_outcome === 'needs_more_evidence'));
  assert.ok(assessment.journey_cases.some(row => row.journey_id === 'ne-j05' && row.expected_research_outcome === 'needs_more_evidence'));
  assert.ok(assessment.journey_cases.some(row => row.expected_research_outcome === 'unsupported_for_family'));
  assert.ok(assessment.journey_cases.every(row => row.human_review.status === 'pending'));
});
```

- [ ] **Step 2: 运行测试并确认先红**

Run:

```bash
node --test tools/tests/northeast-stew-research-data.test.mjs
```

Expected: FAIL because `journey_cases` is missing or not exactly 10.

- [ ] **Step 3: 写入十条固定旅程**

| journey_id | 输入 | 研究层期望 |
|---|---|---|
| `ne-j01` | 鸡腿肉、榛蘑、土豆、玉米面 | `needs_more_evidence`：炖菜与锅边饼分别有据，但四项固定组合不能冒充传统事实 |
| `ne-j02` | 鸡胸肉、香菇、土豆、玉米面 | `needs_more_evidence`：部位与菌菇替换均需 compatibility，不把它写成地方原做法 |
| `ne-j03` | 排骨、油豆角、玉米面 | `supported_family_route`：黑龙江来源直接支持该家族结构 |
| `ne-j04` | 排骨、普通豆角、玉米面 | `needs_more_evidence`：油豆角到普通豆角需明确 taxonomy/compatibility 决策 |
| `ne-j05` | 排骨、豆角、面粉 | `needs_more_evidence`：北京平谷已核实，东北关联仍未核实；留待东北补证并在京津冀轮复用北京事实 |
| `ne-j06` | 鲤鱼、白菜、玉米面 | `needs_more_evidence`：鱼锅与锅边饼家族有据，白菜组合需另证 |
| `ne-j07` | 鲤鱼、豆腐、白菜、玉米面 | `needs_more_evidence`：豆腐不能被冒充为传统核心 |
| `ne-j08` | 鸡肉、蘑菇、土豆 | `unsupported_for_family`：缺少本家族必须的锅边主食，不以普通炖菜冒充完整一锅主餐 |
| `ne-j09` | 排骨、豆角、玉米面；intent=quick | `unsupported_for_family`：未建立 30 分钟内完成证据，不承诺 quick |
| `ne-j10` | 鸡肉、排骨、鱼、豆角、土豆、白菜、蘑菇、豆腐、玉米面 | `unsupported_for_family`：不把多个蛋白强塞进一锅，未来应由 Planner 分锅 |

每条记录必须包含 `mode`、`intent`、`raw_items`、`expected_used_items`、`expected_unplanned_items`、`expected_research_outcome`、`explanation`、`human_review.status/reviewer/reviewed_at/notes`。初始人工字段固定为 `status: "pending"`，其余为 `null` 或空字符串；不得自动填“通过”。

- [ ] **Step 4: 运行数据与 builder 测试**

Run:

```bash
node --test tools/tests/northeast-stew-research-data.test.mjs tools/tests/northeast-stew-research-builder.test.mjs
```

Expected: all tests PASS and report remains `research_in_progress`.

- [ ] **Step 5: 提交**

```bash
git add tools/data/northeast-stew-research.v1.json tools/tests/northeast-stew-research-data.test.mjs tools/tests/northeast-stew-research-builder.test.mjs
git commit -m "data: add northeast household journeys"
```

---

### Task 4: 生成研究报告和人工评审表

**Files:**
- Create: `tools/lib/northeast-stew-research-renderer.mjs`
- Create: `tools/build-northeast-stew-research.mjs`
- Create: `tools/generated/northeast-stew-research.v1.json`
- Create: `docs/northeast-stew-research.md`
- Create: `docs/northeast-stew-journey-review.md`
- Create: `tools/tests/northeast-stew-research-artifacts.test.mjs`

**Interfaces:**
- Consumes: Task 2 的 validated report。
- Produces: `buildNortheastStewResearchArtifacts(report)` 和固定输入 `--write|--check` CLI。

- [ ] **Step 1: 写 deterministic renderer 与 stale artifact 失败测试**

```js
const report = buildNortheastStewResearchReport({
  assessment,
  regionalAtlas,
  regionalResearch,
});

test('renderers are deterministic and state research boundaries', () => {
  assert.equal(renderNortheastStewResearchJson(report), renderNortheastStewResearchJson(report));
  const markdown = renderNortheastStewResearchMarkdown(report);
  assert.match(markdown, /研究完成不等于生产菜谱已批准/);
  assert.match(markdown, /粘卷子.*北京平谷.*东北关联.*未核实/);
  assert.match(markdown, /四项固定组合.*未证明/);
  assert.match(markdown, /research_in_progress/);
});

test('checked-in northeast research artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /4 prototypes/);
  assert.match(result.stdout, /7 sources/);
  assert.match(result.stdout, /10 journeys/);
});
```

- [ ] **Step 2: 运行测试并确认先红**

Run:

```bash
node --test tools/tests/northeast-stew-research-artifacts.test.mjs
```

Expected: FAIL with missing renderer or build CLI.

- [ ] **Step 3: 实现 renderer 与 CLI**

`docs/northeast-stew-research.md` 必须依次输出七项标准交付物：

1. 地域概览；
2. 四个原型候选表；
3. 变种关系；
4. 食材覆盖矩阵；
5. 七条来源证据包；
6. 家庭适配边界；
7. 四个产品去向结论。

其后输出 family model、十条旅程和 blocking gaps。报告首页必须写：

> 地域研究完成不等于生产菜谱已批准；当前来源只支持逐条列出的事实范围。未经证明的精确组合、家庭比例和安全终点不得进入生产。

`docs/northeast-stew-journey-review.md` 必须保留十行 `pending` 表格，列出输入、研究期望、家庭直觉、可操作性、味型判断、评审人、日期和结论；不得从静态期望自动生成真人结论。

CLI 只接受 `--write` 或 `--check`，固定读取四份源文件，不接受任意路径。`--write` 写三个固定产物；`--check` 字节比较并在 stale 时提示：

```text
run node tools/build-northeast-stew-research.mjs --write intentionally
```

- [ ] **Step 4: 生成产物并运行 freshness 测试**

Run:

```bash
node tools/build-northeast-stew-research.mjs --write
node --test tools/tests/northeast-stew-research-artifacts.test.mjs
node tools/build-northeast-stew-research.mjs --check
```

Expected: all tests PASS; CLI prints `4 prototypes · 7 sources · 10 journeys · research_in_progress`.

- [ ] **Step 5: 提交**

```bash
git add tools/lib/northeast-stew-research-renderer.mjs tools/build-northeast-stew-research.mjs tools/generated/northeast-stew-research.v1.json docs/northeast-stew-research.md docs/northeast-stew-journey-review.md tools/tests/northeast-stew-research-artifacts.test.mjs
git commit -m "docs: publish northeast stew research audit"
```

---

### Task 5: 接入总门禁并证明不影响运行时

**Files:**
- Modify: `tools/check-recipes.mjs`
- Modify: `tools/tests/northeast-stew-research-artifacts.test.mjs`
- Modify: `部署说明.md`

**Interfaces:**
- Consumes: Tasks 1–4 的 validator、builder 和 artifact map。
- Produces: 聚合门禁成功行 `4 northeast prototypes · 7 sources · 10 journeys · northeast research ok`。

- [ ] **Step 1: 写聚合门禁与 dist 隔离失败测试**

```js
test('aggregate recipe gate includes northeast research integrity', () => {
  const result = spawnSync(process.execPath, [CHECK_RECIPES], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /northeast research ok/);
  assert.match(result.stdout, /4 northeast prototypes/);
  assert.match(result.stdout, /10 journeys/);
});

test('distribution excludes northeast research sources and generated artifacts', () => {
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  const output = fs.mkdtempSync(path.join(ROOT, 'dist', '.northeast-research-isolation-'));
  try {
    const result = spawnSync(process.execPath, [
      BUILD_DIST, '--out-dir', output, '--build-id', 'northeast-research-isolation-test',
    ], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const files = [];
    const visit = directory => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(fullPath);
        else files.push(path.relative(output, fullPath));
      }
    };
    visit(output);
    assert.equal(files.some(name => /northeast-stew-research|northeast-stew-journey/.test(name)), false);
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: 运行测试并确认 aggregate success line 先红**

Run:

```bash
node --test tools/tests/northeast-stew-research-artifacts.test.mjs
```

Expected: FAIL because `tools/check-recipes.mjs` does not yet print `northeast research ok`.

- [ ] **Step 3: 接入只读 validator、report 和 freshness gate**

`tools/check-recipes.mjs` 必须：

- 读取 `tools/data/northeast-stew-research.v1.json`；
- 先运行 `validateNortheastStewResearch()`；
- 只有 assessment、atlas、regional research 和 recipe library 均合法时才构建报告；
- 运行 `validateNortheastStewResearchReport()`；
- 字节比较三个生成产物；
- stale 时失败并提示显式 `--write intentionally`；
- 成功时打印固定摘要；
- 不向 Planner 或 dist 注册任何新资产。

- [ ] **Step 4: 更新部署文档**

在部署前命令加入：

```bash
node tools/build-northeast-stew-research.mjs --check
```

在有意更新研究结论时加入：

```bash
node tools/build-northeast-stew-research.mjs --write
```

文档必须明确：东北研究覆盖层、生成报告和人工评审表均为审计资产，不进入 `dist`，不代表新增 recipe、人工试做通过或生产授权。

- [ ] **Step 5: 运行聚焦门禁**

Run:

```bash
node --test tools/tests/northeast-stew-research-artifacts.test.mjs
node tools/build-northeast-stew-research.mjs --check
node tools/check-recipes.mjs
git diff --check
```

Expected: all commands exit 0 and aggregate output includes `northeast research ok`.

- [ ] **Step 6: 提交**

```bash
git add tools/check-recipes.mjs tools/tests/northeast-stew-research-artifacts.test.mjs 部署说明.md
git commit -m "chore: gate northeast research freshness"
```

---

### Task 6: 全量验证、来源复核和 Draft PR 更新

**Files:**
- No product source changes expected.
- Update only the existing Draft PR #1 description after all checks pass.

**Interfaces:**
- Consumes: Tasks 1–5 的完整提交。
- Produces: 一个仍为 Draft、未部署、可审阅的东北研究阶段检查点。

- [ ] **Step 1: 逐 URL 复核来源元数据和范围**

重新打开七条 URL，核对 title、publisher、published_at、HTTPS 直达性和账本中的 `evidence_summary/proves/does_not_prove`。若页面失效，记录 `source_unavailable` 并使 validator/报告失败；不得以搜索摘要替代原页面。

- [ ] **Step 2: 运行全量 Node 测试**

Run:

```bash
node --test tools/tests/*.test.mjs
```

Expected: 0 failures.

- [ ] **Step 3: 运行全部独立门禁**

Run:

```bash
node tools/build-menu-master.mjs --check
node tools/build-regional-atlas.mjs --check
node tools/build-northeast-stew-research.mjs --check
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
python3 -m py_compile ai_proxy.py
```

Expected: menu master、regional atlas、northeast research、recipe gate 全部通过；Planner V2 为 `44/44`。

- [ ] **Step 4: 构建隔离发布包**

Run:

```bash
node tools/build-dist.mjs --out-dir dist/northeast-research-check --build-id northeast-research-phase-one
find dist/northeast-research-check -type f -print | rg 'northeast-stew-research|northeast-stew-journey|regional-atlas|regional-menu-mappings'
```

Expected: build succeeds; final `rg` exits 1 because no research/atlas audit asset enters `dist`.

- [ ] **Step 5: 审计 Git 边界**

Run:

```bash
git diff --name-only 7a388b65a2830af75536cb8c61506569aefd5514..HEAD -- index.html ai_proxy.py worker/src tools/data/recipe-library.json tools/data/regional-menu-research.v1.json tools/data/ingredient-taxonomy.v1.json tools/data/meal-templates.v2.json tools/data/ratio-rules.v1.json
git diff --check 7a388b65a2830af75536cb8c61506569aefd5514..HEAD
git status --short
```

Expected: 第一条无输出；diff check 退出 0；工作树干净。

- [ ] **Step 6: 更新现有 Draft PR #1**

PR 说明必须列出：

- 4 个原型的事实结论；
- 粘卷子当前只有北京平谷关联得到核实，东北关联仍待补证；
- 鱼+豆腐传统核心仍未证明；
- 7 条来源和 10 条旅程；
- 当前状态仍是 `research_in_progress`；
- 未增加 recipe/template，未修改运行时，未部署。

推送后验证：

```bash
gh pr view 1 --json isDraft,state,headRefOid,url
```

Expected: `isDraft: true`、`state: OPEN`，remote head 与本地 HEAD 一致。

---

## Plan Self-Review

- Spec coverage: 七项地域交付物、四个原型、一个技法家族、三省节点、来源分级、同构变种、三种主食形态、四个安全分支、十条旅程、产品去向和不进运行时均有对应任务。
- Scope boundary: 不新增 recipe/template，不修改 Planner 或生成链路，不把 research 结论伪装成人工厨房验证。
- Evidence boundary: 每条来源的允许证明范围已固定；“不同来源拼成传统固定组合”和“把北京平谷证据误写成东北已核实或东北不存在”都有反回归测试。
- Type consistency: validator、builder、renderer、CLI 和总门禁使用同一组稳定函数名与三个固定产物路径。
- Placeholder scan: 文档没有未决标记、占位 SHA 或未定义 helper；边界审计固定使用本轮真实起点 `7a388b65a2830af75536cb8c61506569aefd5514`。

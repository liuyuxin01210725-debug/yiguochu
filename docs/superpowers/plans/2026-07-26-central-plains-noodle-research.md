# Central Plains Noodle Research Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 审计中原地域层现有 1 道跨地域生产菜谱与 4 条河南研究候选，区分北方焖面、河南蒸卤面、河南烩面、洛阳浆面条与舞钢沫糊的真实技法边界，形成可继续逐地域扩展但不污染运行时的证据覆盖层。

**Architecture:** 新增独立的中原面食研究覆盖层，只读 recipe library、candidate ledger、全国地域地图与 regional mapping。覆盖层记录 production audit、candidate audit、concrete research leads、来源证据、家族模型、食材形态、安全边界和 12 条家庭旅程；纯函数 validator、builder、renderer 与固定输入 CLI 生成机器快照和人工评审文档。研究资产不进入 `dist`，不被 Planner、Worker、前端、本地代理或 DeepSeek 读取。

**Tech Stack:** Node.js ESM、`node:test`、JSON 源账本、确定性 JSON/Markdown renderer、现有 recipe/candidate/atlas/mapping 数据、中央及地方政府和权威媒体来源。

## Global Constraints

- 只研究 `region_id: "central_plains"` 与 `CN-HA` 节点。
- 现有生产 recipe 保持 72 道（12 `approved` + 60 `auto_approved`）；不得新增、删除、改名或改状态。
- 现有 24 条 `regional-menu-research.v1.json` discovery ledger 不变；具体化的新线索只进入本研究覆盖层。
- 不修改 `index.html`、`worker/src/`、`ai_proxy.py`、Planner、template、ingredient taxonomy、Ratio DSL、营养库或 DeepSeek 契约。
- `north-china-green-bean-braised-noodles` 保持跨地域中国北方面食身份；河南当代有卤面、焖面消费场景不等于该 recipe 起源于河南。
- “焖面”“蒸面”“卤面”“炉面”在地方语境中可能交叠，但本项目不得因此抹去锅内焖、笼屉蒸、先蒸后拌再复蒸等流程差异。
- 豆角猪肉是四条候选中证据最强的组合，但现有证据支持的是豫晋交界长期流行和芸豆/猪肉做法，不足以声明河南全省独有或固定配方。
- 芹菜猪肉、卷心菜菌菇只能保留为家庭变体研究；跨地域资料列出芹菜、卷心菜或菌菇可用，不等于它们是河南蒸面固定核心。
- “家庭单锅蒸焖面”是产品适配假设，不是传统名称；未验证单锅含水、面条形态与分阶段流程前不得称为传统等价做法。
- 河南烩面是高汤、拉制/扯制面条和配菜形成的汤面家族，不得与蒸卤面合并，也不得用普通鲜面直接冒充。
- 洛阳浆面条依赖发酵酸浆；普通豆浆、清水或番茄酸味不得无条件替代发酵酸浆。
- 舞钢沫糊是炒熟杂粮磨粉后与干菜熬制的稠糊家族；不得降格为普通杂粮粥或面糊。
- 豆角必须熟透；猪肉等动物性食材必须烧熟煮透并生熟分开。安全来源只支持终点原则，不自动提供本项目具体时间、克数或液体比例。
- 来源只存元数据和简短事实摘要，不复制完整步骤、长段原文或图片。
- 构建与检查调用 DeepSeek 0 次，不自动抓取网页。
- 不部署 Preview，不部署 production，不合并 Draft PR #1。

---

## File Map

- `tools/data/central-plains-noodle-research.v1.json` — 1 道 production、4 条 candidate、8 条固定来源、3 条具体研究线索、家族模型、12 条旅程和产品去向的唯一源账本。
- `tools/lib/central-plains-noodle-research-validator.mjs` — schema、外键、来源反向证明、地域与技法反误导规则。
- `tools/lib/central-plains-noodle-research-builder.mjs` — 只读合并现有四类账本并生成研究报告。
- `tools/lib/central-plains-noodle-research-renderer.mjs` — 确定性 JSON/Markdown 输出。
- `tools/build-central-plains-noodle-research.mjs` — 固定输入 `--write|--check` CLI。
- `tools/generated/central-plains-noodle-research.v1.json` — 机器审计快照。
- `docs/central-plains-noodle-research.md` — 中原研究报告。
- `docs/central-plains-noodle-journey-review.md` — 12 条家庭旅程人工评审表，初始全部 `pending`。
- `tools/tests/central-plains-noodle-research-data.test.mjs` — 真实账本与关键证据边界测试。
- `tools/tests/central-plains-noodle-research-builder.test.mjs` — 报告、家族、覆盖与产品去向测试。
- `tools/tests/central-plains-noodle-research-artifacts.test.mjs` — renderer、CLI freshness、总门禁与 `dist` 隔离测试。
- `tools/check-recipes.mjs` — 加入中原研究覆盖层与产物 freshness 检查。
- `tools/tests/recipe-library.test.mjs` — 总门禁临时沙箱复制新增研究数据。
- `部署说明.md` — 加入中原研究检查命令与非运行时边界。

## Stable Interfaces

```js
validateCentralPlainsNoodleResearch({
  assessment,
  recipeLibrary,
  regionalResearch,
  regionalAtlas,
  regionalMappings,
}): string[]

buildCentralPlainsNoodleResearchReport(inputs): CentralPlainsNoodleResearchReport
validateCentralPlainsNoodleResearchReport(report): string[]
formatCentralPlainsNoodleResearchSummary(report): string
buildCentralPlainsNoodleResearchArtifacts(report): Map<string, string>
```

`buildCentralPlainsNoodleResearchArtifacts()` 固定返回：

```js
new Map([
  ['tools/generated/central-plains-noodle-research.v1.json', jsonText],
  ['docs/central-plains-noodle-research.md', markdownText],
  ['docs/central-plains-noodle-journey-review.md', reviewMarkdown],
])
```

---

### Task 1: 建立生产条目、四候选与证据边界账本

**Files:**
- Create: `tools/data/central-plains-noodle-research.v1.json`
- Create: `tools/lib/central-plains-noodle-research-validator.mjs`
- Create: `tools/tests/central-plains-noodle-research-data.test.mjs`

**Interfaces:**
- Consumes: 72 道 recipe、24 条 regional research、全国 atlas 与 regional mapping。
- Produces: `validateCentralPlainsNoodleResearch(inputs): string[]`。

- [ ] **Step 1: 写外键、地域身份、技法边界与安全边界的失败测试**

```js
const PRODUCTION_IDS = ['north-china-green-bean-braised-noodles'];
const CANDIDATE_IDS = [
  'henan-bean-pork-steamed-noodles',
  'henan-cabbage-mushroom-steamed-noodles',
  'henan-celery-pork-steamed-noodles',
  'henan-home-one-pot-steamed-braised-noodles',
];

test('assessment audits exactly one production recipe and four Central Plains candidates', () => {
  assert.deepEqual(assessment.production_recipe_audits.map(row => row.recipe_id), PRODUCTION_IDS);
  assert.deepEqual(assessment.candidate_audits.map(row => row.candidate_id).sort(), CANDIDATE_IDS.sort());
  assert.deepEqual(validateCentralPlainsNoodleResearch(inputs), []);
});

test('current Henan presence never turns northern braised noodles into a Henan-specific tradition', () => {
  const row = assessment.production_recipe_audits[0];
  assert.equal(row.claims.henan_current_presence.verdict, 'supported');
  assert.equal(row.claims.henan_specific_origin.verdict, 'not_proven');
  assert.equal(row.regional_scope_decision, 'cross_regional_chinese');
});

test('only bean and pork has evidence for the fixed steamed-noodle pairing', () => {
  const bean = assessment.candidate_audits.find(row => row.candidate_id === 'henan-bean-pork-steamed-noodles');
  assert.equal(bean.claims.bean_pork_pairing.verdict, 'supported');
  for (const id of ['henan-celery-pork-steamed-noodles', 'henan-cabbage-mushroom-steamed-noodles']) {
    const row = assessment.candidate_audits.find(item => item.candidate_id === id);
    assert.equal(row.claims.fixed_regional_core.verdict, 'not_proven');
  }
});

test('single-pot route remains an adaptation rather than a traditional identity claim', () => {
  const row = assessment.candidate_audits.find(item => item.candidate_id === 'henan-home-one-pot-steamed-braised-noodles');
  assert.equal(row.claims.traditional_single_pot_identity.verdict, 'not_proven');
  assert.equal(row.claims.vessel_process_equivalence.verdict, 'not_proven');
});

test('concrete research leads keep three distinct Central Plains families', () => {
  assert.deepEqual(assessment.concrete_research_leads.map(row => row.lead_id).sort(), [
    'henan-huimian-broth-pulled-noodle',
    'henan-luoyang-fermented-sour-noodle-bowl',
    'henan-wugang-mohu-grain-vegetable-bowl',
  ]);
  assert.ok(assessment.concrete_research_leads.every(row => row.production_recipe_id === null));
});
```

- [ ] **Step 2: 运行测试并确认先红**

Run:

```bash
node --test tools/tests/central-plains-noodle-research-data.test.mjs
```

Expected: FAIL because the data and validator modules do not exist.

- [ ] **Step 3: 实现严格 validator**

`validateCentralPlainsNoodleResearch()` 固定校验：

```js
const EXPECTED_PRODUCTION_IDS = new Set(['north-china-green-bean-braised-noodles']);
const EXPECTED_CANDIDATE_IDS = new Set([
  'henan-bean-pork-steamed-noodles',
  'henan-celery-pork-steamed-noodles',
  'henan-cabbage-mushroom-steamed-noodles',
  'henan-home-one-pot-steamed-braised-noodles',
]);
const EXPECTED_LEAD_IDS = new Set([
  'henan-huimian-broth-pulled-noodle',
  'henan-luoyang-fermented-sour-noodle-bowl',
  'henan-wugang-mohu-grain-vegetable-bowl',
]);
const VERDICTS = new Set(['supported', 'not_proven', 'contradicted']);
const AUDIT_STATES = new Set(['evidence_checked', 'needs_more_evidence', 'rejected']);
const DESTINATIONS = new Set([
  'recipe_evidence', 'template_evidence', 'taxonomy_rule', 'ratio_rule',
  'content_only', 'research_only', 'new_family_research', 'rejected',
]);
```

并执行以下行为：

- 顶层版本必须为 `central-plains-noodle-research-v1-20260726`，地域必须是 `central_plains`，省级节点必须恰好为 `CN-HA`；
- production recipe 必须存在、仍为 `auto_approved`，mapping 必须包含 `central_plains` 且 `province_codes` 为空；
- 四条 candidate 必须存在于 regional research ledger，mapping 必须恰好为 `CN-HA`；
- 每个 claim 必须有 `verdict/evidence_source_ids/reason`；`supported` 必须由来源 `proves` 精确反向引用；
- 来源必须为 HTTPS，`retrieved_at` 不晚于 `2026-07-26`，项目 canonical URL 不得作为地域事实来源；
- production 的 `henan_specific_origin` 必须为 `not_proven`，且保持 `cross_regional_chinese`；
- 豆角猪肉候选可支持 `bean_pork_pairing`，但 `henan_exclusive_identity` 必须 `not_proven`；
- 芹菜猪肉与卷心菜菌菇候选的 `fixed_regional_core` 必须 `not_proven`；
- 家庭单锅候选的 `traditional_single_pot_identity` 与 `vessel_process_equivalence` 必须 `not_proven`；
- 所有候选必须显式区分 `fresh_noodle`、`presteamed_noodle` 或 `pulled_noodle` 等形态，不能用“面条”覆盖全部加工状态；
- 烩面、浆面条、沫糊 concrete lead 的 `production_recipe_id` 必须为 `null`，并分别保持独立 family；
- 豆角与猪肉安全边界必须引用安全来源，且不能从来源推导本项目未验证的时间、液体或克数；
- `human_review.status` 初始只能为 `pending`，三个人工判断字段必须为 `null`；
- malformed root、未知 ID、重复 ID、错误外键和 malformed nested row 返回字符串错误，不抛异常。

- [ ] **Step 4: 写入 8 条固定来源与谨慎结论**

| source_id | 等级 | 允许证明 |
| --- | --- | --- |
| `nm-braised-noodle-2018` | A | 焖面在山西、河南、河北、内蒙古等多地存在；豆角、猪肉是常见结构，卷心菜、菌菇等只能证明可选性 |
| `rmrb-yujin-bean-lumian-2018` | B | 卤面/炉面在豫晋交界长期流行；芸豆猪肉先炒、面先蒸、混合复蒸的高层流程 |
| `henan-current-lumian-2025` | A | 河南当代社区餐饮中存在卤面；不证明起源、固定配方或技法细节 |
| `scio-henan-huimian-2025` | A | 河南烩面是高汤、肉、菜、面一体的河南特色汤面，面体与蒸卤面不同 |
| `henan-culture-luoyang-jiangmian-2025` | A | 洛阳浆面条以发酵豆浆酸浆煮面，配黄豆、青豆、芹菜粒与韭黄酱 |
| `henan-wugang-mohu-2024` | B | 舞钢沫糊以炒熟杂粮磨粉、干菜和可选豆腐丝/粉条/肉末慢熬成稠糊 |
| `samr-bean-safety-2021` | A | 扁豆、四季豆等豆类必须充分熟透，不能追求鲜绿脆嫩而缩短加热 |
| `nhc-home-food-safety-2024` | A | 肉类与菜豆烧熟煮透、生熟分开和避免交叉污染的原则 |

结论必须明确：

- 北方豆角焖面保持跨地域，河南当代有卤面不能把它改成河南独有 recipe；
- 豆角猪肉蒸卤面有家庭与地域边界证据，但仍缺可执行 Ratio DSL 与家庭锅具验证；
- 芹菜猪肉、卷心菜菌菇只能作为槽位/家庭变体线索，不创建固定地域 recipe；
- 传统蒸卤面含先蒸、拌菜汁、复蒸等多阶段结构，单锅简化必须单独验证；
- 烩面、浆面条、沫糊各自形成独立 research lead，不能被旧四条蒸面候选吸收；
- 本轮只建立研究覆盖层，不改 recipe、template 或 Planner。

- [ ] **Step 5: 运行专项测试并确认通过**

```bash
node --test tools/tests/central-plains-noodle-research-data.test.mjs
```

Expected: all tests PASS.

---

### Task 2: 构建中原研究报告与 12 条家庭旅程

**Files:**
- Create: `tools/lib/central-plains-noodle-research-builder.mjs`
- Create: `tools/tests/central-plains-noodle-research-builder.test.mjs`

**Interfaces:**
- Consumes: Task 1 的已校验 inputs。
- Produces: report builder、report validator 与 summary formatter。

- [ ] **Step 1: 写完整报告、产品去向和旅程结论的失败测试**

```js
test('report contains the complete Central Plains audit package', () => {
  const report = buildCentralPlainsNoodleResearchReport(inputs);
  assert.deepEqual(validateCentralPlainsNoodleResearchReport(report), []);
  assert.equal(report.production_recipe_audits.length, 1);
  assert.equal(report.candidate_audits.length, 4);
  assert.equal(report.concrete_research_leads.length, 3);
  assert.equal(report.source_evidence.length, 8);
  assert.equal(report.household_journeys.length, 12);
});

test('report separates five cooking families', () => {
  const ids = new Set(report.family_model.map(row => row.family_id));
  for (const id of [
    'noodle-braise', 'noodle-steam-braise', 'broth-pulled-noodle',
    'fermented-sour-noodle-bowl', 'grain-vegetable-thick-bowl',
  ]) assert.ok(ids.has(id));
});

test('initial round remains research_in_progress with exact blockers', () => {
  assert.equal(report.completion.status, 'research_in_progress');
  assert.deepEqual(report.completion.blockers, [
    'province_specific_identity_gaps',
    'candidate_core_evidence_gaps',
    'vessel_process_equivalence_incomplete',
    'ratio_moisture_evidence_incomplete',
    'safety_endpoint_incomplete',
    'human_journey_review_incomplete',
  ]);
});
```

- [ ] **Step 2: 运行测试并确认先红**

```bash
node --test tools/tests/central-plains-noodle-research-builder.test.mjs
```

Expected: FAIL because the builder does not exist.

- [ ] **Step 3: 实现 builder 与 report validator**

Builder 必须：

- 先调用 `validateCentralPlainsNoodleResearch()`，输入无效时抛出带全部错误的 `Error`；
- 把 recipe 名称、状态、family、core ingredients 和 mapping 追加到 production audit；
- 把 candidate 原名称、`ingredient_hypothesis`、状态和 mapping 追加到 candidate audit；
- 生成 `ingredient_shape_matrix`，明确 fresh/presteamed/pulled noodle、fermented sour liquid、ground grain powder 等形态；
- 生成 `product_decisions`，但不改变任何生产数据；
- `completion.status` 初始为 `research_in_progress`；
- `summary.production_recipe_changes` 固定为 `0`；
- malformed report 返回错误数组，不抛异常。

- [ ] **Step 4: 固定 12 条真实家庭旅程**

| journey_id | 输入 | 必须观察的结论 |
| --- | --- | --- |
| `cp-journey-01` | 鲜面条、豆角、猪肉 | 可进入跨地域焖面或蒸卤面研究，不可声明河南独有 |
| `cp-journey-02` | 预蒸面条、豆角、猪肉 | 最接近河南蒸卤面，但 Ratio DSL 和复蒸水分仍待验证 |
| `cp-journey-03` | 面条、芹菜、猪肉 | 家庭变体可研究，固定地域核心不成立 |
| `cp-journey-04` | 面条、卷心菜、菌菇 | 跨地域可选食材，不得标河南传统固定组合 |
| `cp-journey-05` | 鲜面条、豆角、土豆 | 可走北方焖面，不自动进入河南蒸卤面 |
| `cp-journey-06` | 普通鲜面、羊肉、清水 | 不满足河南烩面的面体与高汤结构 |
| `cp-journey-07` | 宽扯面、羊肉高汤、海带、千张 | 属烩面 research lead，不与蒸卤面合并 |
| `cp-journey-08` | 面条、发酵酸浆、黄豆、青豆、芹菜 | 属洛阳浆面条 research lead |
| `cp-journey-09` | 面条、普通豆浆、芹菜 | 普通豆浆不能静默替代发酵酸浆 |
| `cp-journey-10` | 炒熟杂粮粉、泡发干菜、豆腐丝 | 属舞钢沫糊 research lead，不是普通粥 |
| `cp-journey-11` | 鲜面、豆角、猪肉，只允许一口锅 | 只能标家庭适配研究，不得宣称传统等价 |
| `cp-journey-12` | 鲜面、未熟豆角、生猪肉，quick | 快手意图不能覆盖熟透安全要求，应暂停或拒绝 |

每条 journey 固定返回：

```json
{
  "journey_id": "cp-journey-01",
  "mode": "pantry",
  "intent": "normal",
  "input_items": ["鲜面条", "豆角", "猪肉"],
  "expected_family_ids": ["noodle-braise", "noodle-steam-braise"],
  "forbidden_claims": ["河南独有", "传统固定克数"],
  "expected_outcome": "research_route_only",
  "reason": "……",
  "human_review": {
    "status": "pending",
    "family_fit": null,
    "household_feasibility": null,
    "identity_preserved": null,
    "notes": ""
  }
}
```

- [ ] **Step 5: 运行专项测试并确认通过**

```bash
node --test tools/tests/central-plains-noodle-research-builder.test.mjs
```

Expected: all tests PASS.

---

### Task 3: 生成可复现机器快照、研究报告和人工评审表

**Files:**
- Create: `tools/lib/central-plains-noodle-research-renderer.mjs`
- Create: `tools/build-central-plains-noodle-research.mjs`
- Create: `tools/tests/central-plains-noodle-research-artifacts.test.mjs`
- Create: `tools/generated/central-plains-noodle-research.v1.json`
- Create: `docs/central-plains-noodle-research.md`
- Create: `docs/central-plains-noodle-journey-review.md`

- [ ] **Step 1: 写 renderer、CLI 与 freshness 的失败测试**

测试必须证明：

- renderer 固定返回 3 个精确路径；
- JSON 末尾有换行，重复构建字节一致；
- Markdown 明示 “研究覆盖层，不是生产菜谱”；
- 人工评审表包含 12 条 journey 且全部 `pending`；
- `node tools/build-central-plains-noodle-research.mjs --check` 在未生成/篡改产物时非零退出；
- `--write` 生成产物后 `--check` 通过；
- 未知参数和同时传 `--write --check` 非零退出。

- [ ] **Step 2: 运行测试并确认先红**

```bash
node --test tools/tests/central-plains-noodle-research-artifacts.test.mjs
```

Expected: FAIL because renderer and CLI do not exist.

- [ ] **Step 3: 实现 renderer 与固定输入 CLI**

CLI 固定读取：

```text
tools/data/central-plains-noodle-research.v1.json
tools/data/recipe-library.json
tools/data/regional-menu-research.v1.json
tools/data/regional-atlas.v2.json
tools/data/regional-menu-mappings.v1.json
```

行为：

- `--write`：原子覆盖 3 个产物；
- `--check`：只比较内存期望值与磁盘现状，不写文件；
- 两者都不传：只打印 `formatCentralPlainsNoodleResearchSummary(report)`；
- 不能联网，不能调用 DeepSeek，不能读取 `dist`；
- Markdown 展示证据能证明/不能证明、候选去向、家族边界、安全边界、12 条旅程和未完成 blocker。

- [ ] **Step 4: 生成并检查产物**

```bash
node tools/build-central-plains-noodle-research.mjs --write
node tools/build-central-plains-noodle-research.mjs --check
```

Expected: `1 Central Plains production audit · 4 candidates · 12 journeys · Central Plains research ok`。

- [ ] **Step 5: 运行专项测试并确认通过**

```bash
node --test tools/tests/central-plains-noodle-research-artifacts.test.mjs
```

Expected: all tests PASS.

---

### Task 4: 接入现有总门禁并证明研究资产不进入运行时

**Files:**
- Modify: `tools/check-recipes.mjs`
- Modify: `tools/tests/recipe-library.test.mjs`
- Modify: `部署说明.md`
- Test: `tools/tests/central-plains-noodle-research-artifacts.test.mjs`

- [ ] **Step 1: 先写总门禁和 dist 隔离的失败测试**

测试必须证明：

- `check-recipes.mjs` 在源账本无效或产物陈旧时失败；
- 临时沙箱包含中原数据和生成产物，不能从真实仓库偷读；
- `build-dist.mjs` 的 manifest 与输出目录都不包含 `central-plains-noodle-research`；
- `index.html`、Worker dependency graph、`ai_proxy.py` 与 Planner 资产不引用中原研究文件；
- `部署说明.md` 说明检查命令与 “研究资产不进入 dist/不改变生产菜谱” 边界。

- [ ] **Step 2: 运行失败测试并确认 RED**

```bash
node --test tools/tests/central-plains-noodle-research-artifacts.test.mjs
```

Expected: FAIL because the aggregate gate and documentation do not know this research layer.

- [ ] **Step 3: 实现总门禁接线**

`tools/check-recipes.mjs`：

- 读取并解析中原源账本；
- 运行 source validator；
- 构建 report 并运行 report validator；
- 构建 3 个期望产物并逐字节核对；
- 成功日志追加 `1 Central Plains production audit · 4 candidates · 12 journeys · Central Plains research ok`。

`tools/tests/recipe-library.test.mjs`：

- 在总门禁成功/失败的临时 fixture 中复制或篡改中原数据；
- 不允许测试依赖真实工作树文件。

`部署说明.md`：

- 部署前命令加入 `node tools/build-central-plains-noodle-research.mjs --check`；
- 明示这些文件只供研究审计，不能打包、不能改变 72 道生产菜谱。

- [ ] **Step 4: 运行总门禁和专项测试**

```bash
node --test tools/tests/central-plains-noodle-research-*.test.mjs tools/tests/recipe-library.test.mjs
node tools/build-central-plains-noodle-research.mjs --check
node tools/check-recipes.mjs
```

Expected: all PASS.

---

### Task 5: 全量回归、保护面审计与 Draft PR 更新

**Files:**
- Verify only; do not change production runtime files.

- [ ] **Step 1: 运行全部 Node 测试**

```bash
node --test tools/tests/*.test.mjs worker/src/*.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 2: 运行菜谱/食材/地域/Planner 门禁**

```bash
node tools/check-recipes.mjs
node tools/check-foods.mjs
node tools/build-menu-master.mjs --check
node tools/build-regional-atlas.mjs --check
node tools/build-northeast-stew-research.mjs --check
node tools/build-jiangnan-rice-research.mjs --check
node tools/build-shandong-one-pot-research.mjs --check
node tools/build-central-plains-noodle-research.mjs --check
node tools/run-pantry-planner-v2-journeys.mjs
```

Expected: 全部 PASS；recipes 仍为 72，regional research 仍为 24。

- [ ] **Step 3: 运行 Python 语法与构建一致性检查**

```bash
python3 -m py_compile ai_proxy.py
tmpdir="$(mktemp -d)"
node tools/build-dist.mjs --out-dir "$tmpdir/dist-a" --build-id "central-plains-research-check"
node tools/build-dist.mjs --out-dir "$tmpdir/dist-b" --build-id "central-plains-research-check"
diff -qr "$tmpdir/dist-a" "$tmpdir/dist-b"
find "$tmpdir/dist-a" -type f | grep -E 'central-plains-noodle-research|journey-review' && exit 1 || true
rm -rf "$tmpdir"
```

Expected: syntax PASS, two builds byte-identical, no research asset in dist.

- [ ] **Step 4: 审计保护面与数量不变量**

```bash
git diff --name-only HEAD -- index.html worker/src ai_proxy.py tools/data/recipe-library.json tools/data/regional-menu-research.v1.json tools/data/regional-atlas.v2.json tools/data/regional-menu-mappings.v1.json tools/data/ingredient-taxonomy.v1.json tools/data/meal-templates.v2.json tools/data/ratio-rules.v1.json
node - <<'NODE'
const fs = require('node:fs');
const recipes = JSON.parse(fs.readFileSync('tools/data/recipe-library.json', 'utf8')).recipes;
const research = JSON.parse(fs.readFileSync('tools/data/regional-menu-research.v1.json', 'utf8')).entries;
console.log({
  recipes: recipes.length,
  approved: recipes.filter(row => row.status === 'approved').length,
  autoApproved: recipes.filter(row => row.status === 'auto_approved').length,
  regionalResearch: research.length,
});
NODE
```

Expected: protected diff is empty; `{ recipes: 72, approved: 12, autoApproved: 60, regionalResearch: 24 }`。

- [ ] **Step 5: 审查差异、提交并推送到现有 Draft PR #1**

```bash
git diff --check
git status --short
git diff --stat
git add docs/superpowers/plans/2026-07-26-central-plains-noodle-research.md \
  tools/data/central-plains-noodle-research.v1.json \
  tools/lib/central-plains-noodle-research-validator.mjs \
  tools/lib/central-plains-noodle-research-builder.mjs \
  tools/lib/central-plains-noodle-research-renderer.mjs \
  tools/build-central-plains-noodle-research.mjs \
  tools/tests/central-plains-noodle-research-data.test.mjs \
  tools/tests/central-plains-noodle-research-builder.test.mjs \
  tools/tests/central-plains-noodle-research-artifacts.test.mjs \
  tools/generated/central-plains-noodle-research.v1.json \
  docs/central-plains-noodle-research.md \
  docs/central-plains-noodle-journey-review.md \
  tools/check-recipes.mjs tools/tests/recipe-library.test.mjs 部署说明.md
git commit -m "docs: audit Central Plains noodle families"
git push origin codex/targeted-recipe-expansion
gh pr view 1 --json number,state,isDraft,url,headRefName
```

Expected: commit and push succeed; PR #1 remains OPEN and Draft. Do not merge and do not deploy.

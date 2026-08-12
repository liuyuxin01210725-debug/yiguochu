# Jiangnan Vegetable-Rice Research Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 审计现有 8 道江南生产条目的地域事实、核心食材、家庭改造和证据缺口，并补齐安徽研究空白，而不新增菜谱、不改变运行时选菜能力。

**Architecture:** 新增独立的江南研究覆盖层，以现有 8 个 production recipe ID 为外键，读取但不修改 recipe library、candidate ledger、全国地域地图和地域映射。覆盖层把 `recipe_audits` 与 `province_research_leads` 分开：前者只判断现有生产条目的地域与组合证据，后者只记录安徽等空白线索；纯函数 validator、builder、renderer 和固定输入 CLI 生成机器审计快照、人工报告和 12 条家庭旅程评审表。研究资产不进入 `dist`，也不被 Planner、Worker、前端或 DeepSeek 读取。

**Tech Stack:** Node.js ESM、`node:test`、JSON 源账本、确定性 JSON/Markdown renderer、现有 recipe/candidate/atlas/mapping 数据、政府及公共文化来源。

## Global Constraints

- 只研究 `region_id: "jiangnan"` 及 `CN-SH`、`CN-JS`、`CN-ZJ`、`CN-AH` 四个节点。
- 现有生产 recipe 保持 72 道（12 `approved` + 60 `auto_approved`）；不得新增、删除、改名或改状态。
- 现有 24 条 `regional-menu-research.v1.json` discovery ledger 不变；安徽线索只写入本研究覆盖层。
- 不修改 `index.html`、`worker/src/`、`ai_proxy.py`、Planner、template、ingredient taxonomy、Ratio DSL、营养库或 DeepSeek 契约。
- `recipe` 仍只是生产条目；研究证据不能自动把 `auto_approved` 提升成人工批准。
- 项目自身 canonical URL 只能证明项目写了什么，不能反向证明地方传统。
- `fact_checked` 只证明来源直接支持的地域身份、核心食材或高层技法；不证明克数、米水比、营养、安全终点或家庭锅适配。
- 南京来源若记录糯米，不得静默推导生产条目的普通大米同样是传统固定原料。
- 土灶、柴火、户外明火和普通电饭锅是不同器具环境；来源里的土灶事实不能自动证明电饭锅适配。
- 咸肉、腊肉、香肠、板鸭和鲜肉是不同蛋白形态，不得互相无条件替换。
- 矮脚黄、吴江香青菜、小白菜、菜心是不同叶菜身份；家族兼容不等于地方身份等价。
- 畲族乌饭的传统植物色源与项目使用的食品级黑米色粉必须分开；半山烧野米饭的民俗事实与项目平菇焖饭必须分开。
- 安徽东至农家锅巴饭与蒿子锅巴只作为研究线索，不创建 recipe，不宣称已经适合 Planner。
- 来源只存元数据和简短事实摘要，不复制完整步骤、长段原文或图片。
- 构建和检查调用 DeepSeek 0 次，不自动抓取网页。
- 不部署 Preview，不部署 production，不合并 Draft PR #1。

---

## File Map

- `tools/data/jiangnan-rice-research.v1.json` — 8 条生产审计、8 条来源、2 条安徽研究线索、家族模型、12 条家庭旅程和产品去向的唯一源账本。
- `tools/lib/jiangnan-rice-research-validator.mjs` — 严格 schema、外键、来源范围、生产/研究分离和反误导规则。
- `tools/lib/jiangnan-rice-research-builder.mjs` — 只读合并 recipe、candidate、atlas、mapping 与本研究覆盖层，生成审计报告。
- `tools/lib/jiangnan-rice-research-renderer.mjs` — 确定性 JSON/Markdown 输出。
- `tools/build-jiangnan-rice-research.mjs` — 固定输入 `--write|--check` CLI。
- `tools/generated/jiangnan-rice-research.v1.json` — 机器审计快照，生成文件。
- `docs/jiangnan-rice-research.md` — 江南区域研究报告，生成文件。
- `docs/jiangnan-rice-journey-review.md` — 12 条家庭旅程人工评审表，初始全部 `pending`。
- `tools/tests/jiangnan-rice-research-data.test.mjs` — 真实账本与关键证据边界测试。
- `tools/tests/jiangnan-rice-research-builder.test.mjs` — 合并、家族、覆盖矩阵、安徽空白和产品去向测试。
- `tools/tests/jiangnan-rice-research-artifacts.test.mjs` — renderer、CLI freshness、总门禁和 `dist` 隔离测试。
- `tools/check-recipes.mjs` — 加入江南研究覆盖层和生成物 freshness 检查。
- `部署说明.md` — 记录江南研究检查命令与不进入运行时的边界。

## Stable Interfaces

```js
validateJiangnanRiceResearch({
  assessment,
  recipeLibrary,
  recipeCandidates,
  regionalAtlas,
  regionalMappings,
}): string[]

buildJiangnanRiceResearchReport({
  assessment,
  recipeLibrary,
  recipeCandidates,
  regionalAtlas,
  regionalMappings,
}): JiangnanRiceResearchReport

validateJiangnanRiceResearchReport(report): string[]
formatJiangnanRiceResearchSummary(report): string
buildJiangnanRiceResearchArtifacts(report): Map<string, string>
```

`buildJiangnanRiceResearchArtifacts()` 固定返回：

```js
new Map([
  ['tools/generated/jiangnan-rice-research.v1.json', jsonText],
  ['docs/jiangnan-rice-research.md', markdownText],
  ['docs/jiangnan-rice-journey-review.md', reviewMarkdown],
])
```

---

### Task 1: 建立 8 道生产条目的 claim 级审计账本

**Files:**
- Create: `tools/data/jiangnan-rice-research.v1.json`
- Create: `tools/lib/jiangnan-rice-research-validator.mjs`
- Create: `tools/tests/jiangnan-rice-research-data.test.mjs`

**Interfaces:**
- Consumes: 72 道 recipe、30 条 candidate、全国 atlas 和 regional mapping。
- Produces: `validateJiangnanRiceResearch(inputs): string[]` 及后续 builder 使用的固定 schema。

- [ ] **Step 1: 写外键、证据边界和安徽分层的失败测试**

```js
const EXPECTED_RECIPE_IDS = [
  'banshan-wild-rice',
  'jinshan-clay-oven-vegetable-rice',
  'nanjing-cured-pork-greens-rice',
  'nanjing-duck-greens-rice',
  'nanjing-sausage-greens-rice',
  'shanghai-salted-pork-vegetable-rice',
  'she-people-black-rice',
  'suzhou-salted-pork-vegetable-rice',
];

test('assessment audits exactly the eight existing Jiangnan recipes', () => {
  assert.deepEqual(assessment.recipe_audits.map(row => row.recipe_id).sort(), EXPECTED_RECIPE_IDS);
  assert.deepEqual(validateJiangnanRiceResearch(inputs), []);
});

test('Nanjing cultural evidence does not turn glutinous rice into plain rice evidence', () => {
  for (const row of assessment.recipe_audits.filter(row => row.recipe_id.startsWith('nanjing-'))) {
    assert.equal(row.claims.regional_variant.verdict, 'supported');
    assert.equal(row.claims.production_staple_equivalence.verdict, 'not_proven');
  }
});

test('Banshan cultural identity and the project mushroom adaptation stay separate', () => {
  const row = assessment.recipe_audits.find(item => item.recipe_id === 'banshan-wild-rice');
  assert.equal(row.claims.cultural_identity.verdict, 'supported');
  assert.equal(row.claims.production_core_combination.verdict, 'not_proven');
});

test('Anhui gap is represented by research leads rather than fake production recipes', () => {
  assert.deepEqual(assessment.province_research_leads.map(row => row.lead_id).sort(), [
    'anhui-dongzhi-farm-pot-crust-rice',
    'anhui-mugwort-pot-crust',
  ]);
  assert.ok(assessment.province_research_leads.every(row => row.production_recipe_id === null));
});
```

- [ ] **Step 2: 运行测试并确认先红**

Run:

```bash
node --test tools/tests/jiangnan-rice-research-data.test.mjs
```

Expected: FAIL because the Jiangnan data and validator modules do not exist.

- [ ] **Step 3: 实现严格 validator**

`validateJiangnanRiceResearch()` 固定校验：

```js
const EXPECTED_RECIPE_IDS = new Set([
  'shanghai-salted-pork-vegetable-rice',
  'suzhou-salted-pork-vegetable-rice',
  'nanjing-cured-pork-greens-rice',
  'nanjing-sausage-greens-rice',
  'nanjing-duck-greens-rice',
  'jinshan-clay-oven-vegetable-rice',
  'she-people-black-rice',
  'banshan-wild-rice',
]);
const VERDICTS = new Set(['supported', 'not_proven', 'contradicted']);
const AUDIT_STATES = new Set(['evidence_checked', 'needs_more_evidence', 'rejected']);
const DESTINATIONS = new Set([
  'recipe_evidence', 'template_evidence', 'taxonomy_rule',
  'ratio_rule', 'content_only', 'research_only', 'rejected',
]);
const LEAD_STATES = new Set(['discovery_only', 'needs_source_review', 'not_product_fit']);
const SOURCE_GRADES = new Set(['A', 'B', 'C']);
```

并执行以下行为：

- 顶层版本必须为 `jiangnan-rice-research-v1-20260726`，地域必须是 `jiangnan`，省级节点必须恰好为 `CN-SH/CN-JS/CN-ZJ/CN-AH`；
- 8 个 `recipe_id` 必须存在于 recipe library，状态仍是 `auto_approved`，且在 mapping 中属于江南；
- 每个 audit 的 `candidate_id` 必须存在于 candidate ledger，并与 recipe 的 `origin_candidate_id` 一致；
- 每个 claim 必须包含 `verdict/evidence_source_ids/reason`；`supported` 必须至少有一条来源的 `proves` 精确包含 `recipe_id:claim_id`；
- 项目 canonical URL 不得出现在地域研究来源包中；
- 来源必须为 HTTPS，包含 `source_id/title/url/publisher/published_at/retrieved_at/source_grade/evidence_summary/proves/does_not_prove`，日期有效且不晚于 2026-07-26；
- `source_grade: C` 不得单独支持 `evidence_checked`；
- 三条南京 audit 的 `production_staple_equivalence` 必须保持 `not_proven`；
- 畲族条目的 `traditional_color_source_equivalence` 与半山条目的 `production_core_combination` 必须保持 `not_proven`；
- 安徽 lead 必须 `production_recipe_id: null`，只能进入 `research_only`，不得出现克数、时间、温度或安全结论；
- family model 必须区分 `plain_rice`、`glutinous_rice`、`cooked_rice` 三种主食状态，区分 `salted_pork/cured_pork/sausage/cooked_duck/fresh_meat` 五种蛋白形态；
- 土灶到普通锅、野外明火到家庭锅、植物染色到食品级色粉必须是三个独立 adaptation boundary；
- 优先级总分必须满足 `product_score + regional_score - risk_penalty === total_score`；
- malformed root、未知 ID、重复 ID、错误外键和 malformed nested row 返回字符串错误，不抛异常。

- [ ] **Step 4: 写入 8 条固定来源与谨慎结论**

来源包固定包含以下 8 条，只保存短摘要：

| source_id | 等级 | 允许证明 |
| --- | --- | --- |
| `sh-fengxian-salted-rice-2022` | A | 奉贤咸肉、青菜、大米同锅及高层焖制事实 |
| `suzhou-wujiang-greens-rice-2025` | A | 吴江香青菜可制作香青菜咸肉饭 |
| `nanjing-seasonal-rice-2024` | B | 南京矮脚黄与咸肉、香肠、板鸭丁的菜饭变体；来源写糯米 |
| `sh-jinshan-clay-stove-rice-2025` | A | 金山乡村土灶菜饭存在；不证明普通锅比例 |
| `gz-she-black-rice-2026` | A | 畲族乌饭文化身份；不证明黑米色粉等同传统色源 |
| `ihchina-banshan-wild-rice-2026` | A | 半山烧野米饭民俗名称与户外结构；不证明平菇焖饭 |
| `ah-dongzhi-pot-crust-rice-2022` | A | 东至农家锅巴饭的地方身份 |
| `ah-huoqiu-mugwort-pot-crust-2025` | A | 蒿子与大米同锅形成蒿子锅巴的地方线索 |

审计结论：

- 上海奉贤与苏州：地域和核心组合有据；生产克数、米水比和安全规则仍是项目标准，不由地域来源背书；
- 南京三变体：肉类变体与矮脚黄有据，但来源写糯米，生产版大米等价性未证明；
- 金山：土灶菜饭身份有据，普通家庭锅适配未证明；
- 畲族乌饭：文化身份有据，食品级黑米色粉是项目改造，不是传统色源复刻；
- 半山野米饭：地方民俗有据，平菇焖饭是项目自由改造，不得宣称传统核心组合；
- 安徽两条只保留为 `research_only` lead。

- [ ] **Step 5: 运行专项测试并确认通过**

```bash
node --test tools/tests/jiangnan-rice-research-data.test.mjs
```

Expected: all tests PASS.

---

### Task 2: 构建江南研究报告与 12 条家庭旅程

**Files:**
- Create: `tools/lib/jiangnan-rice-research-builder.mjs`
- Create: `tools/tests/jiangnan-rice-research-builder.test.mjs`

**Interfaces:**
- Consumes: Task 1 的已校验 inputs。
- Produces: `buildJiangnanRiceResearchReport()`、`validateJiangnanRiceResearchReport()`、`formatJiangnanRiceResearchSummary()`。

- [ ] **Step 1: 写七项交付物、覆盖矩阵和完成状态的失败测试**

```js
test('report contains the complete Jiangnan audit package', () => {
  const report = buildJiangnanRiceResearchReport(inputs);
  assert.deepEqual(validateJiangnanRiceResearchReport(report), []);
  assert.equal(report.region_overview.region_id, 'jiangnan');
  assert.equal(report.recipe_audits.length, 8);
  assert.equal(report.variant_relationships.length, 8);
  assert.ok(report.ingredient_coverage_matrix.length >= 12);
  assert.equal(report.source_evidence_pack.length, 8);
  assert.ok(report.home_adaptation_boundaries.length >= 8);
  assert.equal(report.product_destination_decisions.length, 10);
  assert.equal(report.province_research_leads.length, 2);
});

test('report makes the Anhui production gap explicit', () => {
  const report = buildJiangnanRiceResearchReport(inputs);
  const anhui = report.region_overview.provinces.find(row => row.atlas_code === 'CN-AH');
  assert.equal(anhui.production_recipe_count, 0);
  assert.equal(anhui.research_lead_count, 2);
});

test('initial round remains research_in_progress', () => {
  const report = buildJiangnanRiceResearchReport(inputs);
  assert.equal(report.completion_status.status, 'research_in_progress');
  assert.deepEqual(report.completion_status.blocking_gaps, [
    'production_claim_gaps',
    'ratio_evidence_incomplete',
    'safety_evidence_incomplete',
    'anhui_leads_not_promoted',
    'human_journey_review_incomplete',
  ]);
});
```

- [ ] **Step 2: 运行测试并确认先红**

```bash
node --test tools/tests/jiangnan-rice-research-builder.test.mjs
```

Expected: FAIL because the builder module does not exist.

- [ ] **Step 3: 实现确定性 builder 与 12 条旅程**

Builder 必须从真实输入派生：

```js
const report = {
  schema_version: 1,
  assessment_version,
  region_overview,
  recipe_audits,
  variant_relationships,
  ingredient_coverage_matrix,
  source_evidence_pack,
  home_adaptation_boundaries,
  product_destination_decisions,
  province_research_leads,
  family_model,
  journey_cases,
  completion_status,
  summary,
};
```

12 条真实旅程固定覆盖：

1. 大米＋小白菜＋咸肉；
2. 大米＋吴江香青菜＋咸肉；
3. 大米＋矮脚黄＋腊肉；
4. 大米＋矮脚黄＋香肠；
5. 大米＋矮脚黄＋包装熟制板鸭；
6. 大米＋青菜、没有肉；
7. 剩米饭＋青菜＋咸肉，必须拒绝套用生米菜饭比例；
8. 大米＋鲜猪肉＋青菜，不得命名为咸肉或腊肉菜饭；
9. 糯米＋食品级黑米色粉，只能描述为家庭适配版；
10. 大米＋平菇，不得把半山民俗当成平菇组合证据；
11. `quick` 下的咸肉菜饭，未有可执行时间证据时不能宣称 30 分钟内；
12. 安徽锅巴饭或蒿子锅巴输入，只能返回研究线索，不宣称 Planner 已支持。

每条 journey 保存 `mode/intent/raw_items/expected_used_items/expected_unplanned_items/expected_research_outcome/explanation/human_review`，`human_review.status` 初始为 `pending`，其余人工字段为 `null`。

完成状态只在以下全部成立时才允许 `regional_round_complete`：8 条生产审计没有 `not_proven` 关键 claim、所有 ratio/safety branch 为 `machine_ready`、2 条安徽 lead 有明确产品去向且不再是 discovery、12 条旅程全部完成人工评审。当前固定输出必须是 `research_in_progress`。

- [ ] **Step 4: 运行 builder 测试并确认通过**

```bash
node --test tools/tests/jiangnan-rice-research-builder.test.mjs
```

Expected: all tests PASS.

---

### Task 3: 生成确定性机器快照与人工报告

**Files:**
- Create: `tools/lib/jiangnan-rice-research-renderer.mjs`
- Create: `tools/build-jiangnan-rice-research.mjs`
- Create: `tools/tests/jiangnan-rice-research-artifacts.test.mjs`
- Generate: `tools/generated/jiangnan-rice-research.v1.json`
- Generate: `docs/jiangnan-rice-research.md`
- Generate: `docs/jiangnan-rice-journey-review.md`

**Interfaces:**
- Consumes: Task 2 的 report。
- Produces: 三个固定路径的字节稳定产物和 `--write|--check` CLI。

- [ ] **Step 1: 写 renderer、CLI stale check 和 dist 隔离的失败测试**

```js
test('renderers preserve production versus research boundaries', () => {
  const markdown = renderJiangnanRiceResearchMarkdown(fixedReport());
  assert.match(markdown, /研究资料，不是生产菜谱批准/);
  assert.match(markdown, /糯米.*普通大米.*未证明/);
  assert.match(markdown, /半山.*平菇.*未证明/);
  assert.match(markdown, /安徽.*研究线索/);
});

test('checked-in Jiangnan artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /8 recipe audits/);
  assert.match(result.stdout, /8 sources/);
  assert.match(result.stdout, /12 journeys/);
});

test('distribution build excludes Jiangnan research assets', () => {
  // Build into a temporary dist directory and assert that no basename or path
  // contains "jiangnan-rice-research".
});
```

- [ ] **Step 2: 运行测试并确认先红**

```bash
node --test tools/tests/jiangnan-rice-research-artifacts.test.mjs
```

Expected: FAIL because renderer and build CLI do not exist.

- [ ] **Step 3: 实现 renderer 与固定输入 CLI**

`buildJiangnanRiceResearchArtifacts(report)` 返回固定 Map；Markdown 必须包含：

- 四省地域概览和各省 production/research 数量；
- 8 道 recipe 的 claim 审计表；
- 家族与变体关系；
- 食材覆盖矩阵；
- 8 条来源及 `proves/does_not_prove`；
- 家庭适配边界；
- 安徽两条 research-only 线索；
- 产品去向与阻塞项；
- 12 条旅程和独立人工评审表。

CLI 只接受一个参数：

```text
node tools/build-jiangnan-rice-research.mjs --write
node tools/build-jiangnan-rice-research.mjs --check
```

`--check` 对缺失或字节不一致的任一产物 fail closed；错误调用退出 2；输入或报告校验失败退出 1。

- [ ] **Step 4: 生成产物并运行 artifacts 测试**

```bash
node tools/build-jiangnan-rice-research.mjs --write
node --test tools/tests/jiangnan-rice-research-artifacts.test.mjs
```

Expected: all tests PASS.

---

### Task 4: 接入现有总门禁并完成全量验证

**Files:**
- Modify: `tools/check-recipes.mjs`
- Modify: `部署说明.md`
- Modify: `tools/tests/jiangnan-rice-research-artifacts.test.mjs`

**Interfaces:**
- Consumes: Task 3 的 source validator、report validator 和 artifact map。
- Produces: 聚合门禁中的 `jiangnan research ok` 摘要与部署前固定检查命令。

- [ ] **Step 1: 写聚合门禁的失败测试**

```js
test('aggregate recipe gate includes Jiangnan research freshness', () => {
  const result = spawnSync(process.execPath, [CHECK_RECIPES], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /8 Jiangnan recipe audits/);
  assert.match(result.stdout, /8 sources/);
  assert.match(result.stdout, /12 journeys/);
  assert.match(result.stdout, /Jiangnan research ok/);
});
```

- [ ] **Step 2: 运行单测并确认先红**

```bash
node --test tools/tests/jiangnan-rice-research-artifacts.test.mjs
```

Expected: FAIL because `tools/check-recipes.mjs` does not yet run the Jiangnan gate.

- [ ] **Step 3: 最小接入总门禁并更新部署说明**

`tools/check-recipes.mjs` 读取五份固定输入，依次执行 source validation、report build、report validation 和 artifact freshness；任一步失败都计入现有 `errors`。成功时只增加一行：

```text
8 Jiangnan recipe audits · 8 sources · 12 journeys · Jiangnan research ok
```

`部署说明.md` 增加：

```bash
node tools/build-jiangnan-rice-research.mjs --check
```

并明确研究资产不进入运行包、不代表新菜谱或人工批准。

- [ ] **Step 4: 运行专项与全量门禁**

```bash
node --test tools/tests/jiangnan-rice-research-*.test.mjs
node tools/build-jiangnan-rice-research.mjs --check
node tools/check-recipes.mjs
node --test tools/tests/*.test.mjs worker/test/*.test.mjs
python3 -m py_compile ai_proxy.py
node tools/build-dist.mjs --out-dir dist --build-id "jiangnan-research-check"
node tools/check-dist-consistency.mjs dist
git diff --check
```

Expected: all commands exit 0; recipe count remains 72; no Jiangnan research source/generated file exists under `dist`.

- [ ] **Step 5: 审计范围并提交 Draft PR 分支**

```bash
git diff --stat
git diff -- tools/data/recipe-library.json index.html worker/src ai_proxy.py tools/data/meal-templates.v2.json tools/data/ingredient-taxonomy.v1.json tools/data/ratio-rules.v1.json
git add docs tools 部署说明.md
git commit -m "research: audit Jiangnan vegetable rice family"
git push origin codex/targeted-recipe-expansion
```

Expected: protected runtime diff is empty; push updates Draft PR #1 without merge or deployment.

---

## Self-Review

- Spec coverage: 8 道现有生产审计、安徽空白、事实/家庭改造分层、12 条旅程、机器产物、人工评审、总门禁、dist 隔离和 Draft PR 更新均有对应 task。
- Placeholder scan: no `TBD`/`TODO`/“类似上一任务”；所有命令、接口、ID、数量和完成门槛均固定。
- Type consistency: validator/builder/renderer/CLI 的输入字段统一为 `assessment/recipeLibrary/recipeCandidates/regionalAtlas/regionalMappings`；产物路径在接口与测试中一致。
- Scope audit: 不改 72 道 recipe、不改 24 条 discovery ledger、不改运行时、不部署、不合并。

# Regional Capability Ledger Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把全国地域地图的 12 个技法家族全部纳入机器可验证的能力台账，并在确定性地域审计中诚实展示完整、部分和未覆盖状态。

**Architecture:** `regional-menu-mappings.v1.json` 仍是唯一源账本，但 capability 记录迁移为多模板、覆盖边界和地域范围显式结构；validator 动态以 atlas 12 个家族为全集并 fail closed。Regional atlas builder 把已校验台账合并进 report，再由 renderer 生成 JSON 与 Markdown 审计；运行时 Planner、template catalog、taxonomy、Ratio DSL 和 72 道 recipe 均不改变。

**Tech Stack:** Node.js ESM、内置 `node:test`、JSON 数据资产、确定性 Markdown/JSON 构建器、GitHub Draft PR。

## Global Constraints

- 只修改地域能力审计层，不修改 Planner、Worker、`ai_proxy.py`、前端或 DeepSeek 行为。
- 菜谱保持 72 道：12 `approved` + 60 `auto_approved`；不得新增、删除或改状态。
- 模板保持 9 active + 7 planned；不得新增或激活模板。
- 不修改 ingredient taxonomy 或 Ratio DSL catalog。
- `stew-with-staple` 必须继续为 `blocked_by_ratio`，不得补写猜测比例。
- capability 覆盖必须为 atlas 的 12/12，且每个家族只出现一次。
- 地域研究、capability ledger 和生成审计不得进入 `dist/`。
- Draft PR 保持 Draft；不部署 Preview 或 production，不合并 PR。
- 每项行为修改先写失败测试并观察正确失败，再写最小实现。

---

## File Responsibility Map

- `tools/data/regional-menu-mappings.v1.json`：72 条生产映射、24 条研究映射与 12 条 capability 源账本。
- `tools/lib/regional-menu-mapping-validator.mjs`：严格验证 capability 字段、引用、覆盖分区和状态关系。
- `tools/tests/regional-menu-mappings.test.mjs`：源账本正反例契约测试。
- `tools/lib/regional-atlas-builder.mjs`：把已验证 capability 行合并进确定性 report。
- `tools/lib/regional-atlas-renderer.mjs`：只从 report 生成 Markdown/JSON，不自行推断能力。
- `tools/tests/regional-atlas-builder.test.mjs`：report 结构、计数、顺序与 total-function 测试。
- `tools/tests/regional-atlas-artifacts.test.mjs`：生成物新鲜度、Markdown 呈现和发布包隔离。
- `tools/generated/regional-atlas.v2.json`、`docs/regional-atlas.md`：由构建器生成的审计产物，禁止手改。
- `部署说明.md`：记录 Draft 的能力台账版本和“不改变运行时”边界。

---

### Task 1: 将 capability 源账本迁移为 12 家族严格契约

**Files:**
- Modify: `tools/tests/regional-menu-mappings.test.mjs`
- Modify: `tools/lib/regional-menu-mapping-validator.mjs`
- Modify: `tools/data/regional-menu-mappings.v1.json`

**Interfaces:**
- Consumes: `atlas.technique_families`、recipe/research/template/taxonomy/ratio ID 集合。
- Produces: `validateRegionalMenuMappings(inputs): string[]`；合法账本必须返回 `[]`，任意缺失、伪造或虚假 ready 状态返回稳定错误。

- [ ] **Step 1: 先把真实账本测试改为 12/12，并观察现状失败**

将原先 `byFamily.size === 3` 的测试替换为：

```js
test('capability ledger covers every atlas technique family exactly once', () => {
  const expected = atlas.technique_families.map(row => row.family_id).sort();
  const actual = mappings.template_capability_mappings.map(row => row.family_id).sort();
  assert.equal(mappings.mapping_version, 'regional-menu-mappings-v1-20260726-r2');
  assert.deepEqual(actual, expected);
  assert.equal(actual.length, 12);
  assert.deepEqual(validate(mappings), []);
});

test('capability ledger distinguishes full partial and no coverage', () => {
  const byFamily = new Map(mappings.template_capability_mappings.map(row => [row.family_id, row]));
  assert.equal(byFamily.get('raw-rice-braise').coverage_level, 'full');
  assert.equal(byFamily.get('cooked-rice-stew').coverage_level, 'partial');
  assert.deepEqual(byFamily.get('cooked-rice-stew').coverage_boundary_codes, ['requires_acid_base']);
  assert.equal(byFamily.get('stew-with-staple').coverage_level, 'none');
  assert.equal(byFamily.get('stew-with-staple').promotion_status, 'blocked_by_ratio');
});
```

Run:

```sh
node --test tools/tests/regional-menu-mappings.test.mjs
```

Expected: FAIL because current mapping version is old and only 3 capability rows exist.

- [ ] **Step 2: 先增加非法覆盖与引用的失败测试**

增加独立测试，每个测试只破坏一个不变量：

```js
test('capability coverage partitions the atlas staple states without overlap', () => {
  const broken = structuredClone(mappings);
  const row = broken.template_capability_mappings.find(item => item.family_id === 'noodle-broth');
  row.covered_staple_states.push('米粉');
  assert.match(validate(broken).join('\n'), /covered and uncovered staple states must be disjoint/);
});

test('national household capabilities cannot acquire fake regions', () => {
  const broken = structuredClone(mappings);
  const row = broken.template_capability_mappings.find(item => item.family_id === 'cooked-rice-stir');
  row.region_ids = ['jiangnan'];
  assert.match(validate(broken).join('\n'), /national_household must not bind regions/);
});

test('no coverage cannot carry a runtime template', () => {
  const broken = structuredClone(mappings);
  const row = broken.template_capability_mappings.find(item => item.family_id === 'stew-with-staple');
  row.runtime_template_ids = ['savory-mixed-rice-pot'];
  assert.match(validate(broken).join('\n'), /none coverage cannot have runtime templates/);
});

test('capability references fail closed across every controlled catalog', () => {
  const mutations = [
    ['runtime_template_ids', 'invented-template', /unknown runtime template/],
    ['candidate_template_ids', 'invented-template', /unknown candidate template/],
    ['evidence_recipe_ids', 'invented-recipe', /unknown value invented-recipe/],
    ['evidence_research_ids', 'invented-research', /unknown value invented-research/],
    ['taxonomy_item_ids', 'invented-ingredient', /unknown value invented-ingredient/],
    ['resolved_ratio_rule_ids', 'invented-ratio-v1', /unknown resolved ratio rule/],
  ];
  for (const [field, value, expected] of mutations) {
    const broken = structuredClone(mappings);
    broken.template_capability_mappings[0][field].push(value);
    assert.match(validate(broken).join('\n'), expected);
  }
});
```

同时增加：重复 family、未知 boundary code、`partial` 没有 gap、`full` 保留 gap、inactive template 写进 runtime、ready 状态携带 blocker、blocked/research-only 无 blocker、resolved ratio 超出 required、完全没有 recipe/research evidence 的反例。

Run: `node --test tools/tests/regional-menu-mappings.test.mjs`

Expected: FAIL on the new contract assertions, not on syntax errors.

- [ ] **Step 3: 实现新的 capability validator**

在 validator 中替换旧单模板字段和 3 家族硬编码：

```js
const CAPABILITY_SCOPES = new Set(['regional', 'national_household', 'mixed']);
const COVERAGE_LEVELS = new Set(['full', 'partial', 'none']);
const COVERAGE_BOUNDARY_CODES = new Set([
  'requires_acid_base', 'raw_noodle_only', 'plain_noodle_only',
]);
const CAPABILITY_FIELDS = new Set([
  'family_id', 'regional_scope', 'region_ids', 'coverage_level',
  'runtime_template_ids', 'candidate_template_ids',
  'covered_staple_states', 'uncovered_staple_states', 'coverage_boundary_codes',
  'promotion_status', 'evidence_recipe_ids', 'evidence_research_ids',
  'required_ratio_rule_ids', 'resolved_ratio_rule_ids',
  'taxonomy_item_ids', 'blocker_codes', 'scope_note',
]);
```

把 `validateCapabilityRows()` 参数改为接收 `techniques: Map<string, Technique>` 与 `researchIds`。对每行：

```js
const family = techniques.get(row.family_id);
const covered = checkStringArray(row.covered_staple_states, `${label}: covered_staple_states`, errors);
const uncovered = checkStringArray(row.uncovered_staple_states, `${label}: uncovered_staple_states`, errors);
const boundaries = checkStringArray(row.coverage_boundary_codes, `${label}: coverage_boundary_codes`, errors, { allowed: COVERAGE_BOUNDARY_CODES });
const expectedStates = new Set(asArray(family?.staple_states));
if (covered.some(value => uncovered.includes(value))) errors.push(`${label}: covered and uncovered staple states must be disjoint`);
if (!exactIds([...covered, ...uncovered], expectedStates)) errors.push(`${label}: staple state partition must match atlas family`);
```

覆盖关系按规格实现：

```js
if (row.coverage_level === 'full' && (!covered.length || uncovered.length || boundaries.length)) errors.push(`${label}: full coverage cannot retain gaps`);
if (row.coverage_level === 'partial' && (!covered.length || (!uncovered.length && !boundaries.length))) errors.push(`${label}: partial coverage requires an uncovered state or boundary`);
if (row.coverage_level === 'none' && (covered.length || boundaries.length || runtimeIds.length || !exactIds(uncovered, expectedStates))) errors.push(`${label}: none coverage cannot have runtime templates or covered states`);
```

`runtime_template_ids` 必须存在、active、runtime eligible；`candidate_template_ids` 只要求存在，且两数组互斥。地域范围规则为：

```js
if (row.regional_scope === 'national_household' && regions.length) errors.push(`${label}: national_household must not bind regions`);
if (['regional','mixed'].includes(row.regional_scope) && !regions.length) errors.push(`${label}: ${row.regional_scope} requires regions`);
```

ready、blocker、ratio 和合并 evidence 规则逐条按规格实现。最后把硬编码 `REQUIRED_CAPABILITY_FAMILIES` 删除，直接比较 `familyIds` 与 `techniques.keys()`。

同时把 root `mapping_version` 期望改为 `regional-menu-mappings-v1-20260726-r2`。

- [ ] **Step 4: 用精确矩阵替换 3 条 capability 数据**

12 行必须按以下矩阵写入；`scope_note` 逐行用中文解释同一行的边界，不增加做法或比例：

| family | scope / regions | coverage | runtime / candidate | status | evidence | ratios required → resolved | taxonomy | blockers |
|---|---|---|---|---|---|---|---|---|
| raw-rice-braise | mixed / jiangnan,fujian_taiwan,northwest,jinmeng,qinghai_tibet,yunnan_guizhou,sichuan_chongqing | full；生米 / 无；boundary 无 | savory-mixed-rice-pot / 无 | covered_by_active_template | recipes: shanghai-salted-pork-vegetable-rice,taiwan-cabbage-mushroom-rice；research: chongqing-firewood-potato-rice-home | savory-mixed-rice-liquid-v1 → 同 | raw-rice,leafy-greens,napa-cabbage,shiitake | 无 |
| cooked-rice-stir | national_household / 无 | full；剩米饭 / 无；boundary 无 | cooked-rice-stir-pot / 无 | covered_by_active_template | recipes: home-egg-fried-leftover-rice,broccoli-beef-fried-rice | cooked-rice-stir-portion-v1 → 同 | cooked-rice,egg,beef-generic | 无 |
| cooked-rice-stew | national_household / 无 | partial；剩米饭 / 无；requires_acid_base | acid-staple-pot / broth-rice-pot | blocked_by_ratio | recipes: tomato-egg-stewed-leftover-rice,cabbage-egg-soup-rice | acid-staple-cooked-rice-liquid-v1,broth-rice-liquid-v1 → acid-staple-cooked-rice-liquid-v1 | cooked-rice,tomato,egg,napa-cabbage | ratio_rule_missing:broth-rice-liquid-v1 |
| grain-porridge | mixed / qinghai_tibet | none；无 / 生米,小米,青稞,杂粮；boundary 无 | 无 / soft-family-rice-pot | blocked_by_ratio | recipes: chinese-congee,qinghai-hao-fan,tibetan-savory-congee | soft-family-rice-liquid-v1 → 无 | raw-rice | ratio_rule_missing:soft-family-rice-liquid-v1,taxonomy_missing:millet,taxonomy_missing:highland_barley,taxonomy_missing:mixed_grain |
| noodle-braise | mixed / jingjinji,jinmeng,shandong,central_plains | partial；生面 / 半熟面；raw_noodle_only | braised-noodle-pot / 无 | preview_candidate | recipes: north-china-green-bean-braised-noodles,cabbage-potato-chicken-leg-braised-noodles；research: north-pork-bean-braised-noodles | braised-noodle-liquid-v1 → 同 | noodle,green-beans,potato,napa-cabbage,chicken-generic,pork-generic | 无 |
| noodle-steam-braise | regional / central_plains | none；无 / 生面,鲜面；boundary 无 | 无 / 无 | blocked_by_taxonomy | research: henan-bean-pork-steamed-noodles,henan-celery-pork-steamed-noodles,henan-cabbage-mushroom-steamed-noodles | 无 → 无 | noodle | taxonomy_missing:steamed_noodle_state,template_missing:noodle-steam-braise |
| noodle-broth | mixed / qinghai_tibet | partial；面条 / 面片,米粉,粉丝；plain_noodle_only | broth-noodle-pot / 无 | blocked_by_taxonomy | recipes: broccoli-beef-soup-noodles,tibetan-gutu | broth-noodle-liquid-v1 → 同 | noodle | taxonomy_missing:noodle_sheet,taxonomy_missing:rice_noodle,taxonomy_missing:vermicelli |
| stew-with-staple | regional / northeast,shandong | none；无 / 玉米面团,小麦面团；boundary 无 | 无 / stew-with-staple-pot | blocked_by_ratio | research: northeast-ribs-beans-corn-cake,northeast-ribs-beans-sticky-rolls | stew-with-staple-liquid-v1 → 无 | cornmeal-dough,wheat-dough,pork-ribs,chicken-leg,green-beans,potato | ratio_rule_missing:stew-with-staple-liquid-v1 |
| claypot-rice | regional / lingnan_hk_macao | none；无 / 生米；boundary 无 | 无 / 无 | blocked_by_evidence | recipes: cantonese-cured-meat-claypot-rice,cantonese-mushroom-chicken-claypot-rice,cantonese-black-bean-pork-rib-claypot-rice | 无 → 无 | raw-rice,cured-pork,chinese-sausage,chicken-leg,pork-ribs | evidence_missing:household_heat_boundary,evidence_missing:crust_safety_boundary |
| glutinous-mixed-rice | regional / fujian_taiwan,lingnan_hk_macao,jiangnan,yunnan_guizhou | none；无 / 糯米,混合米；boundary 无 | 无 / 无 | blocked_by_ratio | recipes: quanzhou-oil-rice,guangxi-five-color-glutinous-rice,guizhou-dong-community-rice | glutinous-mixed-rice-liquid-v1 → 无 | 无 | ratio_rule_missing:glutinous-mixed-rice-liquid-v1,taxonomy_missing:glutinous_rice,taxonomy_missing:mixed_rice |
| vessel-adapted-rice | regional / jiangnan,lingnan_hk_macao,fujian_taiwan,yunnan_guizhou,sichuan_chongqing | none；无 / 生米,糯米,杂粮；boundary 无 | 无 / 无 | research_only | recipes: jinshan-clay-oven-vegetable-rice,hainan-cai-bao-rice,daxi-lotus-leaf-oil-rice,dai-pineapple-purple-rice；research: yunnan-copper-pot-potato-rice-home | 无 → 无 | raw-rice | research_scope_unresolved:vessel_identity |
| family-pot-with-absorbent-staple | mixed / shandong | none；无 / 粉条,粉丝,可验证主食；boundary 无 | 无 / 无 | blocked_by_taxonomy | recipes: greens-tofu-vermicelli-pot；research: shandong-cabbage-tofu-vermicelli-pot,shandong-southwest-family-pot | 无 → 无 | firm-tofu,leafy-greens | taxonomy_missing:vermicelli,taxonomy_missing:glass_noodle |

Run:

```sh
node --test tools/tests/regional-menu-mappings.test.mjs
node tools/build-regional-atlas.mjs --check
```

Expected: mapping tests PASS；atlas check FAIL only because generated artifacts have not yet been refreshed.

- [ ] **Step 5: 提交源账本与 validator**

```sh
git add tools/data/regional-menu-mappings.v1.json tools/lib/regional-menu-mapping-validator.mjs tools/tests/regional-menu-mappings.test.mjs
git commit -m "Complete regional capability ledger"
```

---

### Task 2: 把 capability 台账加入确定性地域 report

**Files:**
- Modify: `tools/tests/regional-atlas-builder.test.mjs`
- Modify: `tools/lib/regional-atlas-builder.mjs`

**Interfaces:**
- Consumes: 已通过 validator 的 `mappings.template_capability_mappings`。
- Produces: `report.capability_coverage`（atlas 顺序的 12 行）以及 summary 的 full/partial/none 计数。

- [ ] **Step 1: 先写 report 失败测试**

把真实 inputs 补齐 templates/taxonomy/ratios 不需要，因为 builder 只消费已校验 mappings；新增：

```js
test('report exposes all 12 planner capability rows in atlas order', () => {
  const report = buildRegionalAtlasReport(inputs);
  assert.equal(report.capability_coverage.length, 12);
  assert.deepEqual(
    report.capability_coverage.map(row => row.family_id),
    inputs.atlas.technique_families.map(row => row.family_id),
  );
  assert.equal(report.summary.capability_full_count, 2);
  assert.equal(report.summary.capability_partial_count, 3);
  assert.equal(report.summary.capability_none_count, 7);
  const stew = report.capability_coverage.find(row => row.family_id === 'stew-with-staple');
  assert.equal(stew.promotion_status, 'blocked_by_ratio');
  assert.deepEqual(stew.runtime_template_ids, []);
});
```

在 malformed/validator 测试中删除一条 capability，断言 report validator 报 `capability_coverage must contain exactly 12 items`。

Run: `node --test tools/tests/regional-atlas-builder.test.mjs`

Expected: FAIL because report has no `capability_coverage` or summary counts.

- [ ] **Step 2: 构建 capability report，不重复推导状态**

在 `buildRegionalAtlasReport()` 内建立 `capabilityByFamily`，按 `techniqueCoverage` 顺序输出：

```js
const capabilityByFamily = new Map(asArray(safeMappings.template_capability_mappings)
  .filter(isObject).map(row => [row.family_id, row]));
const capabilityCoverage = techniqueCoverage.map(family => ({
  family_id: family.family_id,
  name: family.name,
  ...clone(asObject(capabilityByFamily.get(family.family_id))),
}));
```

展开时必须让固定的 `family_id`/`name` 最终取 atlas 值，不能让 mapping 覆盖它们：

```js
const capabilityCoverage = techniqueCoverage.map(family => {
  const source = clone(asObject(capabilityByFamily.get(family.family_id)));
  return { ...source, family_id: family.family_id, name: family.name };
});
```

把 `capability_coverage` 加入 report 根；summary 加：

```js
capability_full_count: capabilityCoverage.filter(row => row.coverage_level === 'full').length,
capability_partial_count: capabilityCoverage.filter(row => row.coverage_level === 'partial').length,
capability_none_count: capabilityCoverage.filter(row => row.coverage_level === 'none').length,
```

`validateRegionalAtlasReport()` 把新数组加入类型检查，强制 12 行、family 唯一，并重算三个 summary 值；不要在 builder 中重新判断模板是否可用。

- [ ] **Step 3: 运行 builder 测试到绿灯**

Run: `node --test tools/tests/regional-atlas-builder.test.mjs`

Expected: PASS，summary 2 full / 3 partial / 7 none。

- [ ] **Step 4: 提交 report 层**

```sh
git add tools/lib/regional-atlas-builder.mjs tools/tests/regional-atlas-builder.test.mjs
git commit -m "Report regional planner capability coverage"
```

---

### Task 3: 生成可读能力矩阵并锁定发布包隔离

**Files:**
- Modify: `tools/tests/regional-atlas-artifacts.test.mjs`
- Modify: `tools/lib/regional-atlas-renderer.mjs`
- Regenerate: `tools/generated/regional-atlas.v2.json`
- Regenerate: `docs/regional-atlas.md`
- Modify: `部署说明.md`

**Interfaces:**
- Consumes: `report.capability_coverage`。
- Produces: Markdown 的“Planner 能力覆盖矩阵”及包含同一 12 行数据的生成 JSON；`--check` 验证两者新鲜。

- [ ] **Step 1: 先写 renderer 与隔离失败测试**

给 artifacts test 的 `sample.summary` 加入：

```js
capability_full_count: 0,
capability_partial_count: 0,
capability_none_count: 1,
```

并在 `sample` 根加入一条完整的阻塞记录：

```js
capability_coverage: [{
  family_id: 'stew-with-staple',
  name: '炖菜带锅边主食',
  regional_scope: 'regional',
  region_ids: ['r1'],
  coverage_level: 'none',
  runtime_template_ids: [],
  candidate_template_ids: ['stew-with-staple-pot'],
  covered_staple_states: [],
  uncovered_staple_states: ['玉米面团', '小麦面团'],
  coverage_boundary_codes: [],
  promotion_status: 'blocked_by_ratio',
  evidence_recipe_ids: [],
  evidence_research_ids: ['research-1'],
  required_ratio_rule_ids: ['stew-with-staple-liquid-v1'],
  resolved_ratio_rule_ids: [],
  taxonomy_item_ids: ['cornmeal-dough', 'wheat-dough'],
  blocker_codes: ['ratio_rule_missing:stew-with-staple-liquid-v1'],
  scope_note: '家庭液体与蒸汽比例未完成。',
}],
```

然后新增：

```js
test('markdown renders the planner capability matrix without promoting blocked families', () => {
  const markdown = renderRegionalAtlasMarkdown(sample);
  assert.match(markdown, /## Planner 能力覆盖矩阵/);
  assert.match(markdown, /stew-with-staple/);
  assert.match(markdown, /blocked_by_ratio/);
  assert.match(markdown, /ratio_rule_missing:stew-with-staple-liquid-v1/);
});
```

在真实临时构建断言：

```js
assert.match(fs.readFileSync(markdown, 'utf8'), /Planner 能力覆盖矩阵/);
const jsonArtifact = path.join(tempRoot, 'tools', 'generated', 'regional-atlas.v2.json');
const generated = JSON.parse(fs.readFileSync(jsonArtifact, 'utf8'));
assert.equal(generated.capability_coverage.length, 12);
```

在已有 distribution isolation 测试中，把 `regional-menu-mappings-v1-20260726-r2`、`plain_noodle_only` 和 `research_scope_unresolved:vessel_identity` 作为 sentinel，断言构建的 22 个文件内容均不包含它们。

Run: `node --test tools/tests/regional-atlas-artifacts.test.mjs`

Expected: FAIL because renderer and generated artifacts do not contain capability coverage.

- [ ] **Step 2: 在 renderer 生成固定矩阵**

读取：

```js
const capabilities = asArray(report?.capability_coverage);
```

在“12 个技法家族”之后生成：

```js
'## Planner 能力覆盖矩阵',
'',
'> 该矩阵是研究与运行能力审计，不等于菜谱批准或部署状态。',
'',
'| 技法 | coverage | runtime templates | candidate templates | promotion status | 未覆盖主食状态 | blockers | 能力边界 |',
'| --- | --- | --- | --- | --- | --- | --- | --- |',
...capabilities.map(row => tableRow([
  `${row.name}（${row.family_id}）`, row.coverage_level,
  list(row.runtime_template_ids), list(row.candidate_template_ids),
  row.promotion_status, list(row.uncovered_staple_states),
  list(row.blocker_codes), row.scope_note,
])),
''
```

摘要增加 `Planner 能力：full 2；partial 3；none 7`，所有数值来自 report summary。

- [ ] **Step 3: 有意重建并验证新鲜度**

Run:

```sh
node tools/build-regional-atlas.mjs --write
node tools/build-regional-atlas.mjs --check
node --test tools/tests/regional-atlas-artifacts.test.mjs
```

Expected: 两个构建命令 exit 0；artifacts tests PASS；生成 Markdown 有 12 行 capability。

- [ ] **Step 4: 更新部署说明但不宣称运行能力增加**

在地域审计段加入：

```md
地域能力账本版本为 `regional-menu-mappings-v1-20260726-r2`，覆盖 atlas 12/12 个技法家族；它只记录 full/partial/none、候选模板和 blocker，不改变 9 active + 7 planned 的运行时模板，也不进入 `dist/`。
```

不得修改 Preview/production 状态，不得加入部署成功文案。

- [ ] **Step 5: 提交生成审计**

```sh
git add tools/lib/regional-atlas-renderer.mjs tools/tests/regional-atlas-artifacts.test.mjs tools/generated/regional-atlas.v2.json docs/regional-atlas.md 部署说明.md
git commit -m "Render complete regional capability matrix"
```

---

### Task 4: 全量门禁、确定性构建和 Draft PR 交付

**Files:**
- Verify only; no production behavior files should change.

**Interfaces:**
- Consumes: Tasks 1–3 的完整分支。
- Produces: 可复现验证证据、干净工作树和仍为 Draft 的 PR #1。

- [ ] **Step 1: 串行运行全量 Node 测试**

Run:

```sh
node --test --test-concurrency=1 --test-reporter=dot tools/tests/*.test.mjs
```

Expected: exit 0；不得用聚焦测试替代。

- [ ] **Step 2: 运行全部产品门禁**

Run:

```sh
node tools/check-foods.mjs
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
node tools/build-regional-atlas.mjs --check
python3 -m py_compile ai_proxy.py
```

Expected:

- FOODS 161 条，0 错误；
- 72 recipes、12 approved、60 auto_approved；
- 9 active templates、7 planned templates；
- 64/64 Planner V2 journeys；
- 13 regions、34 provinces、12 technique families；
- Python syntax exit 0。

- [ ] **Step 3: 双构建证明确定性和研究资产隔离**

Run:

```sh
node tools/build-dist.mjs --out-dir dist/.capability-ledger-a --build-id capability-ledger-r2
node tools/build-dist.mjs --out-dir dist/.capability-ledger-b --build-id capability-ledger-r2
diff -qr dist/.capability-ledger-a dist/.capability-ledger-b
```

随后用 Node 检查两个目录各为 22 个文件，且文件名和内容均不包含 `regional-atlas`、`regional-menu-mappings`、`regional-menu-mappings-v1-20260726-r2`、`plain_noodle_only` 或 `research_scope_unresolved:vessel_identity`。

Expected: diff 无输出、隔离断言 exit 0。

- [ ] **Step 4: 最终范围审计**

Run:

```sh
git diff --check
git status --short
```

用 Node 读取源资产并断言：

```js
{
  recipes: 72,
  approved: 12,
  auto_approved: 60,
  active_templates: 9,
  planned_templates: 7,
  capability_families: 12,
  capability_full: 2,
  capability_partial: 3,
  capability_none: 7
}
```

Expected: 只有计划内提交，工作树最终干净。

- [ ] **Step 5: 推送并核对 Draft PR**

Run:

```sh
git push origin codex/targeted-recipe-expansion
gh pr view 1 --json isDraft,state,headRefName,headRefOid,url
```

Expected: `state:"OPEN"`、`isDraft:true`、head branch 为 `codex/targeted-recipe-expansion`。不运行任何 `wrangler pages deploy` 命令。

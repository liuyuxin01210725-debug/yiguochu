# National Regional Menu Atlas Phase Zero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可机器校验、可人工审阅的中国一锅主餐全国地域骨架，完整审计现有 72 道生产菜单和 24 个研究候选，但不改变任何线上推荐或生成行为。

**Architecture:** 新增独立的地域目录与映射账本，分别保存 13 个地域板块、34 个省级节点、12 个技法家族，以及 72/24 条来源对象的地域范围审计。纯函数构建器将这些源数据与现有 recipe/research ledger 合并成 JSON 和 Markdown 审计报告；固定输入 CLI 与 `check-recipes` 只读 freshness gate 防止报告漂移。该层不进入 `dist/`，不被 Planner、Worker、前端或 DeepSeek 读取。

**Tech Stack:** Node.js ESM、`node:test`、JSON 源资产、确定性 JSON/Markdown renderer、现有 `tools/check-recipes.mjs` 聚合门禁。

## Global Constraints

- 现有生产 recipe 保持恰好 72 道：12 道 `approved`，60 道 `auto_approved`。
- 现有 `tools/data/regional-menu-research.v1.json` 保持恰好 24 条，内容、状态和数量不在本计划中扩充。
- 地域骨架包含恰好 13 个地域板块、34 个省级节点和 12 个技法家族。
- 72 道生产菜单全部获得 `regional_scope` 审计记录，但不得把全国性家常菜或域外菜单伪造为某省地方菜。
- `regional_scope` 只允许 `province_specific | cross_regional_chinese | national_household | outside_cn_atlas`。
- `national_household` 与 `outside_cn_atlas` 的 `region_ids` 和 `province_codes` 必须为空。
- `outside_cn_atlas` 可以不绑定中国技法家族，但必须保留 `legacy_family_id` 和非空 `mapping_note`。
- recipe evidence 不决定组合能力；本计划不修改 template、ingredient taxonomy 或 Ratio DSL。
- 不修改 `tools/data/recipe-library.json`、Planner、Worker、`ai_proxy.py`、前端、DeepSeek prompt 或生成契约。
- 不新增 recipe、template、账号、用户画像、营养追踪或多 Agent 运行时。
- 地图构建、验证和报告生成调用 DeepSeek 0 次，失败不自动重试。
- 生成的地域地图资产不得复制进 `dist/`，不得用于运行时选菜。
- 不部署 Preview，不部署 production，不合并 Draft PR #1。

---

## File Map

- `tools/data/regional-atlas.v2.json` — 13 个地域板块、34 个省级骨架、12 个技法家族及文化覆盖层的唯一源目录。
- `tools/data/regional-menu-mappings.v1.json` — 对 72 道生产菜单和 24 个研究候选的显式地域范围及技法映射。
- `tools/lib/regional-atlas-validator.mjs` — 地域目录 schema、计数、归属、覆盖层和状态校验。
- `tools/lib/regional-menu-mapping-validator.mjs` — 映射账本 schema、全量集合一致性和禁止伪造地域的校验。
- `tools/lib/regional-atlas-builder.mjs` — 只读合并目录、菜单、研究候选和映射，生成覆盖与空白审计模型。
- `tools/lib/regional-atlas-renderer.mjs` — 确定性 JSON/Markdown 输出。
- `tools/build-regional-atlas.mjs` — 固定输入 `--write|--check` CLI。
- `tools/generated/regional-atlas.v2.json` — 机器审计快照，生成文件。
- `docs/regional-atlas.md` — 人工审阅报告，生成文件。
- `tools/tests/regional-atlas-catalog.test.mjs` — 全国目录真实数据与 validator 测试。
- `tools/tests/regional-menu-mappings.test.mjs` — 72/24 映射完整性和语义边界测试。
- `tools/tests/regional-atlas-builder.test.mjs` — 构建、汇总、空白识别与无伪归属测试。
- `tools/tests/regional-atlas-artifacts.test.mjs` — renderer、CLI freshness、聚合门禁与 `dist` 隔离测试。
- `tools/check-recipes.mjs` — 加入地域目录、映射和生成物 freshness 的只读聚合检查。

## Stable Interfaces

```js
validateRegionalAtlas(catalog): string[]

validateRegionalMenuMappings({
  mappings,
  atlas,
  recipeLibrary,
  regionalResearch,
}): string[]

buildRegionalAtlasReport({
  atlas,
  mappings,
  recipeLibrary,
  regionalResearch,
}): RegionalAtlasReport

validateRegionalAtlasReport(report): string[]

formatRegionalAtlasSummary(report): string

buildRegionalAtlasArtifacts(report): Map<string, string>
```

`buildRegionalAtlasArtifacts()` 固定返回：

```js
new Map([
  ['tools/generated/regional-atlas.v2.json', jsonText],
  ['docs/regional-atlas.md', markdownText],
])
```

---

### Task 1: 建立全国地域与技法目录

**Files:**
- Create: `tools/data/regional-atlas.v2.json`
- Create: `tools/lib/regional-atlas-validator.mjs`
- Create: `tools/tests/regional-atlas-catalog.test.mjs`

**Interfaces:**
- Consumes: 无；只使用内建 `Set`、数组和普通对象。
- Produces: `validateRegionalAtlas(catalog): string[]`；后续所有映射与报告任务均以通过校验的 catalog 为权威目录。

- [ ] **Step 1: 先写会失败的真实目录测试**

创建 `tools/tests/regional-atlas-catalog.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateRegionalAtlas } from '../lib/regional-atlas-validator.mjs';

const atlas = JSON.parse(fs.readFileSync(
  new URL('../data/regional-atlas.v2.json', import.meta.url),
  'utf8',
));

test('national atlas contains the exact phase-zero skeleton', () => {
  assert.equal(atlas.regions.length, 13);
  assert.equal(atlas.province_nodes.length, 34);
  assert.equal(atlas.technique_families.length, 12);
  assert.deepEqual(validateRegionalAtlas(atlas), []);
});

test('every province belongs to exactly one region and blanks remain explicit', () => {
  assert.equal(new Set(atlas.province_nodes.map(row => row.atlas_code)).size, 34);
  for (const row of atlas.province_nodes) {
    assert.ok(row.status === 'skeleton_only');
    assert.ok(row.research_question || row.defer_reason);
  }
});

test('culture overlays reference province nodes instead of duplicating prototypes', () => {
  const provinceCodes = new Set(atlas.province_nodes.map(row => row.atlas_code));
  for (const overlay of atlas.cultural_overlays) {
    assert.ok(overlay.target_province_codes.every(code => provinceCodes.has(code)));
    assert.equal('prototype_name' in overlay, false);
  }
});

test('catalog rejects duplicate provinces, unknown parents and recipe fields', () => {
  const broken = structuredClone(atlas);
  broken.province_nodes[1].atlas_code = broken.province_nodes[0].atlas_code;
  broken.province_nodes[2].region_id = 'missing-region';
  broken.province_nodes[3].ratio_rules = ['不应出现在骨架层'];
  const message = validateRegionalAtlas(broken).join('\n');
  assert.match(message, /province atlas_code must be unique/);
  assert.match(message, /unknown region_id missing-region/);
  assert.match(message, /ratio_rules is not allowed/);
});
```

- [ ] **Step 2: 运行测试，确认先红**

Run:

```bash
node --test tools/tests/regional-atlas-catalog.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `regional-atlas-validator.mjs` or missing `regional-atlas.v2.json`.

- [ ] **Step 3: 实现严格 catalog validator**

创建 `tools/lib/regional-atlas-validator.mjs`，实现以下固定规则：

```js
const REGION_COUNT = 13;
const PROVINCE_COUNT = 34;
const TECHNIQUE_COUNT = 12;
const PROVINCE_STATUSES = new Set(['skeleton_only']);
const FORBIDDEN_NODE_FIELDS = new Set([
  'ratio_rules', 'safety_rules', 'nutrition', 'steps',
  'generation_optional_ingredients', 'substitution_slots',
]);

export function validateRegionalAtlas(catalog) {
  const errors = [];
  // Fail closed for null/non-object inputs.
  // Require schema_version === 2 and
  // catalog_version === 'regional-atlas-v2-20260726'.
  // Require regions/province_nodes/technique_families/cultural_overlays arrays.
  // Enforce exact counts, unique IDs, known parent references and allowed fields.
  // Require each province to have exactly one of research_question/defer_reason.
  // Require overlay targets to reference known province atlas_code values.
  return errors;
}
```

校验错误必须包含具体 `region_id`、`atlas_code`、`family_id` 或 `overlay_id`，不能以未捕获 `TypeError` 退出。

- [ ] **Step 4: 写入完整 13/34/12 目录**

创建 `tools/data/regional-atlas.v2.json`，顶层结构固定为：

```json
{
  "schema_version": 2,
  "catalog_version": "regional-atlas-v2-20260726",
  "regions": [],
  "province_nodes": [],
  "technique_families": [],
  "cultural_overlays": []
}
```

`regions` 与省级内部代码必须完整按下表录入；`atlas_code` 是项目内部稳定代码，不声明为 ISO 编码：

| region_id | province atlas_code 与名称 |
|---|---|
| `northeast` | `CN-LN` 辽宁、`CN-JL` 吉林、`CN-HL` 黑龙江 |
| `jingjinji` | `CN-BJ` 北京、`CN-TJ` 天津、`CN-HE` 河北 |
| `jinmeng` | `CN-SX` 山西、`CN-NM` 内蒙古 |
| `shandong` | `CN-SD` 山东 |
| `central_plains` | `CN-HA` 河南 |
| `middle_yangtze` | `CN-HB` 湖北、`CN-HN` 湖南、`CN-JX` 江西 |
| `jiangnan` | `CN-SH` 上海、`CN-JS` 江苏、`CN-ZJ` 浙江、`CN-AH` 安徽 |
| `fujian_taiwan` | `CN-FJ` 福建、`CN-TW` 台湾 |
| `lingnan_hk_macao` | `CN-GD` 广东、`CN-GX` 广西、`CN-HI` 海南、`CN-HK` 香港、`CN-MO` 澳门 |
| `sichuan_chongqing` | `CN-SC` 四川、`CN-CQ` 重庆 |
| `yunnan_guizhou` | `CN-YN` 云南、`CN-GZ` 贵州 |
| `northwest` | `CN-SN` 陕西、`CN-GS` 甘肃、`CN-NX` 宁夏、`CN-XJ` 新疆 |
| `qinghai_tibet` | `CN-QH` 青海、`CN-XZ` 西藏 |

12 个 `technique_families[].family_id` 必须是：

```js
[
  'raw-rice-braise',
  'cooked-rice-stir',
  'cooked-rice-stew',
  'grain-porridge',
  'noodle-braise',
  'noodle-steam-braise',
  'noodle-broth',
  'stew-with-staple',
  'claypot-rice',
  'glutinous-mixed-rice',
  'vessel-adapted-rice',
  'family-pot-with-absorbent-staple'
]
```

每个技法家族至少带 `name`、`staple_states`、`research_question`。文化覆盖层首批只建立蒙古族、回族、藏族、维吾尔族、壮族、苗族、侗族、傣族、畲族、客家十个 `skeleton_only` 研究标签；`target_province_codes` 只是后续研究范围，不声称完整人口分布，也不包含原型或菜谱字段。

- [ ] **Step 5: 运行目录测试并确认通过**

Run:

```bash
node --test tools/tests/regional-atlas-catalog.test.mjs
```

Expected: all tests PASS; output confirms 13 regions, 34 provinces and 12 techniques.

- [ ] **Step 6: 提交目录层**

```bash
git add tools/data/regional-atlas.v2.json tools/lib/regional-atlas-validator.mjs tools/tests/regional-atlas-catalog.test.mjs
git commit -m "data: add national regional atlas catalog"
```

---

### Task 2: 建立 72/24 映射账本并禁止伪造地域归属

**Files:**
- Create: `tools/data/regional-menu-mappings.v1.json`
- Create: `tools/lib/regional-menu-mapping-validator.mjs`
- Create: `tools/tests/regional-menu-mappings.test.mjs`

**Interfaces:**
- Consumes: `regional-atlas.v2.json`、`recipe-library.json`、`regional-menu-research.v1.json`。
- Produces: `validateRegionalMenuMappings({ mappings, atlas, recipeLibrary, regionalResearch }): string[]`，以及两组与源 ID 集合完全一致的显式 mapping arrays。

- [ ] **Step 1: 写映射集合与语义边界的失败测试**

创建 `tools/tests/regional-menu-mappings.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateRegionalMenuMappings } from '../lib/regional-menu-mapping-validator.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const atlas = read('regional-atlas.v2.json');
const mappings = read('regional-menu-mappings.v1.json');
const recipeLibrary = read('recipe-library.json');
const regionalResearch = read('regional-menu-research.v1.json');

test('mapping ledger covers the exact 72 production and 24 research IDs', () => {
  assert.equal(mappings.production_recipe_mappings.length, 72);
  assert.equal(mappings.research_candidate_mappings.length, 24);
  assert.deepEqual(validateRegionalMenuMappings({ mappings, atlas, recipeLibrary, regionalResearch }), []);
});

test('national and outside-China menus cannot acquire fake provinces', () => {
  const broken = structuredClone(mappings);
  const row = broken.production_recipe_mappings.find(item => item.source_id === 'basic-risotto');
  row.province_codes = ['CN-ZJ'];
  row.region_ids = ['jiangnan'];
  const message = validateRegionalMenuMappings({
    mappings: broken,
    atlas,
    recipeLibrary,
    regionalResearch,
  }).join('\n');
  assert.match(message, /outside_cn_atlas must not bind Chinese regions or provinces/);
});

test('known regional recipes retain explicit locality while home recipes remain national', () => {
  const byId = new Map(mappings.production_recipe_mappings.map(row => [row.source_id, row]));
  assert.deepEqual(byId.get('shanghai-salted-pork-vegetable-rice').province_codes, ['CN-SH']);
  assert.equal(byId.get('home-egg-fried-leftover-rice').regional_scope, 'national_household');
  assert.deepEqual(byId.get('home-egg-fried-leftover-rice').province_codes, []);
  assert.equal(byId.get('basic-risotto').regional_scope, 'outside_cn_atlas');
});

test('porridge receives its own technique and research legacy families use an explicit crosswalk', () => {
  const production = new Map(mappings.production_recipe_mappings.map(row => [row.source_id, row]));
  const research = new Map(mappings.research_candidate_mappings.map(row => [row.source_id, row]));
  assert.equal(production.get('chinese-congee').primary_family_id, 'grain-porridge');
  assert.equal(research.get('henan-bean-pork-steamed-noodles').primary_family_id, 'noodle-steam-braise');
  assert.equal(research.get('chongqing-firewood-potato-rice-home').primary_family_id, 'raw-rice-braise');
});
```

- [ ] **Step 2: 运行测试并确认先红**

Run:

```bash
node --test tools/tests/regional-menu-mappings.test.mjs
```

Expected: FAIL because the mapping validator and ledger do not exist.

- [ ] **Step 3: 实现映射 validator**

创建 `tools/lib/regional-menu-mapping-validator.mjs`。记录字段固定为：

```js
{
  source_type,
  source_id,
  regional_scope,
  region_ids,
  province_codes,
  primary_family_id,
  secondary_family_ids,
  legacy_family_id,
  mapping_basis,
  mapping_note,
}
```

validator 必须执行：

1. `schema_version === 1`，`mapping_version === 'regional-menu-mappings-v1-20260726'`；
2. production mapping ID 集合与 72 个 `recipe.id` 完全相等；
3. research mapping ID 集合与 24 个 `atlas_id` 完全相等；
4. 两组内分别无重复，禁止未知 ID；
5. `region_ids`、`province_codes`、`secondary_family_ids`、`mapping_basis` 必须为数组；
6. 所有地域、行政区和技法 ID 必须存在于 catalog；
7. 省级节点的父 `region_id` 必须出现在同一 mapping 的 `region_ids`；
8. `province_specific` 至少一个省级代码；
9. `cross_regional_chinese` 至少一个地域，但允许省级粒度为空；
10. `national_household` 和 `outside_cn_atlas` 不得绑定任何中国地域或省份；
11. `outside_cn_atlas` 必须有非空 `legacy_family_id`、非空 `mapping_note`，`primary_family_id` 必须为 `null`；
12. 其他 scope 必须有 catalog 中的 `primary_family_id`；
13. production array 中 `source_type` 必须为 `production_recipe`，research array 中必须为 `research_candidate`；
14. `mapping_basis` 只允许 `cuisine | name | recipe_evidence | research_hypothesis | family_crosswalk | manual_review`；
15. 不允许 recipe 步骤、比例、安全、营养或生成字段进入 mapping ledger；
16. null、数组错型和对象缺失返回结构化 errors，不抛 `TypeError`。

- [ ] **Step 4: 写入显式映射账本**

创建 `tools/data/regional-menu-mappings.v1.json`：

```json
{
  "schema_version": 1,
  "mapping_version": "regional-menu-mappings-v1-20260726",
  "production_recipe_mappings": [],
  "research_candidate_mappings": []
}
```

生产菜单按以下确定规则逐条显式记录，不能在 builder 中临时猜测：

- 11 个域外 ID 固定为 `outside_cn_atlas`：`simple-chicken-biryani`、`jollof-rice`、`creole-jambalaya`、`soy-lentil-vegetable-stew`、`chicken-black-eyed-pea-stew`、`lentil-potato-tomato-curry`、`shakshuka-tomato-egg`、`texas-beef-chili`、`kari-ayam-coconut-chicken`、`basic-risotto`、`rice-cabbage-minestrone`。
- `chinese-congee` 和全部 `cuisine: "中式家常"` 的 30 道菜单固定为 `national_household`。
- `north-china-green-bean-braised-noodles` 为 `cross_regional_chinese`，地域范围是 `jingjinji`、`jinmeng`、`shandong`、`central_plains`，不绑定具体省份。
- 上海本帮→`CN-SH`；苏帮、南京菜→`CN-JS`；台湾家常、台湾客家→`CN-TW`；闽菜、闽南→`CN-FJ`；海南菜→`CN-HI`；粤菜→`CN-GD`；新疆菜→`CN-XJ`；陕北菜→`CN-SN`；河湟饮食→`CN-QH`；晋菜→`CN-SX`；藏族饮食→`CN-XZ`；壮族饮食→`CN-GX`；杭州菜→`CN-ZJ`；傣族饮食→`CN-YN`；侗族饮食且 ID 为 `guizhou-dong-community-rice`→`CN-GZ`。
- `she-people-black-rice` 不凭民族名称猜单一省份，标 `cross_regional_chinese`，地域为 `jiangnan` 与 `fujian_taiwan`，具体省份留空并在 `mapping_note` 解释待来源细化。

技法优先由主食状态与做法共同判断：炒剩饭→`cooked-rice-stir`；烩剩饭/汤饭→`cooked-rice-stew`；粥/稀饭→`grain-porridge`；焖面→`noodle-braise`；汤面、面食汤、面片→`noodle-broth`；煲仔/砂锅加盖饭→`claypot-rice`；糯米主餐→`glutinous-mixed-rice`；叶包、铜锅、菠萝等器具身份→`vessel-adapted-rice`；粉丝煲→`family-pot-with-absorbent-staple`；其余生米饭锅→`raw-rice-braise`。不得只看中文 `form` 就把剩米饭误判为生米焖饭。

24 个 research mapping 采用显式 crosswalk：

```js
{
  'stew-with-staple': 'stew-with-staple',
  'noodle-braise': 'noodle-braise',
  'vegetable-staple-family-pot': 'family-pot-with-absorbent-staple',
  'potato-rice-pot': 'raw-rice-braise',
  'vessel-adapted-rice': 'vessel-adapted-rice',
  'steamed-noodle-home-pot': 'noodle-steam-braise',
}
```

其中 `shandong-vegetable-cornmeal-one-pot` 若主食结构尚未核实，仍映射到山东地域，但 `mapping_basis` 必须包含 `research_hypothesis`，`mapping_note` 明确技法只是待核实分类；不得借映射将其状态升级为事实。

- [ ] **Step 5: 运行映射测试并确认通过**

Run:

```bash
node --test tools/tests/regional-atlas-catalog.test.mjs tools/tests/regional-menu-mappings.test.mjs
```

Expected: all tests PASS; exact production/research coverage is 72/24.

- [ ] **Step 6: 提交映射层**

```bash
git add tools/data/regional-menu-mappings.v1.json tools/lib/regional-menu-mapping-validator.mjs tools/tests/regional-menu-mappings.test.mjs
git commit -m "data: map menus into national regional atlas"
```

---

### Task 3: 构建确定性地域覆盖与空白审计模型

**Files:**
- Create: `tools/lib/regional-atlas-builder.mjs`
- Create: `tools/tests/regional-atlas-builder.test.mjs`

**Interfaces:**
- Consumes: 四个已通过 validator 的源对象。
- Produces: `buildRegionalAtlasReport()`、`validateRegionalAtlasReport()`、`formatRegionalAtlasSummary()`。

- [ ] **Step 1: 写构建器的失败测试**

创建 `tools/tests/regional-atlas-builder.test.mjs`，至少包含：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildRegionalAtlasReport,
  formatRegionalAtlasSummary,
  validateRegionalAtlasReport,
} from '../lib/regional-atlas-builder.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const inputs = {
  atlas: read('regional-atlas.v2.json'),
  mappings: read('regional-menu-mappings.v1.json'),
  recipeLibrary: read('recipe-library.json'),
  regionalResearch: read('regional-menu-research.v1.json'),
};

test('real report audits 34 provinces, 72 recipes and 24 candidates', () => {
  const report = buildRegionalAtlasReport(inputs);
  assert.deepEqual(validateRegionalAtlasReport(report), []);
  assert.equal(report.summary.region_count, 13);
  assert.equal(report.summary.province_count, 34);
  assert.equal(report.summary.technique_family_count, 12);
  assert.equal(report.summary.production_audit_count, 72);
  assert.equal(report.summary.research_audit_count, 24);
});

test('outside and national menus stay visible without fake geography', () => {
  const report = buildRegionalAtlasReport(inputs);
  const risotto = report.production_audit.find(row => row.source_id === 'basic-risotto');
  const friedRice = report.production_audit.find(row => row.source_id === 'home-egg-fried-leftover-rice');
  assert.equal(risotto.regional_scope, 'outside_cn_atlas');
  assert.deepEqual(risotto.region_ids, []);
  assert.equal(friedRice.regional_scope, 'national_household');
  assert.deepEqual(friedRice.province_codes, []);
});

test('blank provinces remain explicit instead of disappearing', () => {
  const report = buildRegionalAtlasReport(inputs);
  assert.equal(report.province_coverage.length, 34);
  for (const row of report.province_coverage) {
    if (row.production_recipe_ids.length === 0 && row.research_candidate_ids.length === 0) {
      assert.ok(row.research_question || row.defer_reason);
      assert.equal(row.coverage_status, 'skeleton_only');
    }
  }
});

test('summary text is derived from the report', () => {
  const report = buildRegionalAtlasReport(inputs);
  assert.equal(
    formatRegionalAtlasSummary(report),
    '13 regions · 34 provinces · 12 technique families · 72 production audits · 24 research audits',
  );
});
```

- [ ] **Step 2: 运行测试并确认先红**

Run:

```bash
node --test tools/tests/regional-atlas-builder.test.mjs
```

Expected: FAIL with missing `regional-atlas-builder.mjs`.

- [ ] **Step 3: 实现纯函数 report builder**

`buildRegionalAtlasReport()` 返回稳定字段：

```js
{
  schema_version: 2,
  atlas_version,
  mapping_version,
  summary,
  regions,
  province_coverage,
  technique_coverage,
  cultural_overlays,
  production_audit,
  research_audit,
  pantry_gap_coverage,
  source_status,
}
```

实现规则：

1. 遍历 catalog 的 13/34/12，而不是只遍历有菜单的节点；
2. production/research audit 通过 `source_id` join，找不到源对象时返回 validation error；
3. `province_coverage` 对每省返回 production IDs、research IDs、覆盖状态和原始研究问题/暂缓理由；
4. `technique_coverage` 对 12 家族返回 production/research IDs，空家族仍保留；
5. `pantry_gap_coverage` 只聚合研究账本现有 `pantry_gap_items` 原词，不做同义词推断，不修改 taxonomy；
6. `source_status` 分别统计 production `source_refs` 与 research `source_confidence`，不把 `discovery_only` 描述成已核实；
7. 所有数组按 catalog 顺序或 `source_id` 稳定排序，输出不得依赖文件系统时间；
8. `validateRegionalAtlasReport()` 重新计算 summary，检查 34/72/24 集合无丢失、无重复；
9. 对 malformed nested values 使用空数组/空对象防护并返回结构化错误。

- [ ] **Step 4: 运行构建器测试并确认通过**

Run:

```bash
node --test tools/tests/regional-atlas-builder.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 5: 提交构建器**

```bash
git add tools/lib/regional-atlas-builder.mjs tools/tests/regional-atlas-builder.test.mjs
git commit -m "feat: build regional atlas audit model"
```

---

### Task 4: 生成可审阅报告并建立独立 freshness CLI

**Files:**
- Create: `tools/lib/regional-atlas-renderer.mjs`
- Create: `tools/build-regional-atlas.mjs`
- Create: `tools/generated/regional-atlas.v2.json`
- Create: `docs/regional-atlas.md`
- Create: `tools/tests/regional-atlas-artifacts.test.mjs`

**Interfaces:**
- Consumes: Task 3 的 report 与 stable interfaces。
- Produces: `renderRegionalAtlasJson()`、`renderRegionalAtlasMarkdown()`、`buildRegionalAtlasArtifacts()`；CLI `node tools/build-regional-atlas.mjs --write|--check`。

- [ ] **Step 1: 写 renderer 与 CLI 的失败测试**

创建 `tools/tests/regional-atlas-artifacts.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  renderRegionalAtlasJson,
  renderRegionalAtlasMarkdown,
} from '../lib/regional-atlas-renderer.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUILD = fileURLToPath(new URL('../build-regional-atlas.mjs', import.meta.url));

test('renderers are deterministic and state the audit boundary', () => {
  const sample = {
    schema_version: 2,
    summary: { region_count: 1, province_count: 1, technique_family_count: 1, production_audit_count: 1, research_audit_count: 0 },
    regions: [{ region_id: 'r1', name: '测试地域' }],
    province_coverage: [], technique_coverage: [], cultural_overlays: [],
    production_audit: [], research_audit: [], pantry_gap_coverage: [], source_status: {},
  };
  assert.equal(renderRegionalAtlasJson(sample), renderRegionalAtlasJson(sample));
  assert.match(renderRegionalAtlasMarkdown(sample), /地域地图完成不等于地方菜谱均已验证/);
  assert.match(renderRegionalAtlasMarkdown(sample), /测试地域/);
});

test('checked-in regional atlas artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /13 regions/);
  assert.match(result.stdout, /72 production audits/);
  assert.match(result.stdout, /24 research audits/);
});
```

另加一个临时目录测试：复制 CLI、`tools/lib/` 和四个固定输入 JSON，先 `--write`，删除临时 `docs/regional-atlas.md`，再运行 `--check`；断言退出码为 1 且 stderr 包含 `Missing or stale: docs/regional-atlas.md`。临时目录必须在 `finally` 删除。

- [ ] **Step 2: 运行测试并确认先红**

Run:

```bash
node --test tools/tests/regional-atlas-artifacts.test.mjs
```

Expected: FAIL because renderer/CLI/generated artifacts do not exist.

- [ ] **Step 3: 实现 renderer**

`renderRegionalAtlasMarkdown(report)` 固定输出：

1. generated-file 警告与四个来源文件；
2. “地域地图完成不等于地方菜谱均已验证”的醒目边界；
3. 13 地域总览；
4. 34 省级覆盖表，显示生产数、研究数、`skeleton_only` 和问题；
5. 12 技法覆盖表；
6. 72 道生产菜单地域范围审计表，明确 `outside_cn_atlas` 与 `national_household`；
7. 24 条研究候选表，保留 `discovery_only`；
8. pantry gap 原词聚合；
9. 来源状态汇总；
10. 文化覆盖层研究标签。

不输出推荐排序，不输出“已验证地域菜”之类超出状态的文案。

- [ ] **Step 4: 实现固定输入 CLI**

`tools/build-regional-atlas.mjs` 只读：

```js
[
  'tools/data/regional-atlas.v2.json',
  'tools/data/regional-menu-mappings.v1.json',
  'tools/data/recipe-library.json',
  'tools/data/regional-menu-research.v1.json',
]
```

CLI 必须先运行两个 source validator，再运行 report validator。`--write` 只写固定两个 artifact；`--check` 不写文件，只逐字节比较并 fail closed。非法参数退出 2，输入/验证/freshness 错误退出 1。

- [ ] **Step 5: 首次生成并验证 artifacts**

Run:

```bash
node tools/build-regional-atlas.mjs --write
node tools/build-regional-atlas.mjs --check
node --test tools/tests/regional-atlas-artifacts.test.mjs tools/tests/regional-atlas-builder.test.mjs
```

Expected: summary is exactly `13 regions · 34 provinces · 12 technique families · 72 production audits · 24 research audits`; tests PASS.

- [ ] **Step 6: 提交报告链路**

```bash
git add tools/lib/regional-atlas-renderer.mjs tools/build-regional-atlas.mjs tools/generated/regional-atlas.v2.json docs/regional-atlas.md tools/tests/regional-atlas-artifacts.test.mjs
git commit -m "feat: generate reviewable regional atlas"
```

---

### Task 5: 接入聚合门禁但保持运行时隔离

**Files:**
- Modify: `tools/check-recipes.mjs`
- Modify: `tools/tests/regional-atlas-artifacts.test.mjs`
- Modify: `部署说明.md`

**Interfaces:**
- Consumes: `validateRegionalAtlas()`、`validateRegionalMenuMappings()`、`buildRegionalAtlasReport()`、`validateRegionalAtlasReport()`、`buildRegionalAtlasArtifacts()`。
- Produces: `check-recipes` 成功摘要新增 `regional atlas ok`；任何源错误或 stale artifact 令聚合门禁退出 1。

- [ ] **Step 1: 先写聚合门禁与隔离失败测试**

向 `tools/tests/regional-atlas-artifacts.test.mjs` 添加：

```js
test('aggregate recipe gate includes regional atlas integrity', () => {
  const checker = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [checker], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /regional atlas ok/);
  assert.match(result.stdout, /34 provinces/);
  assert.match(result.stdout, /72 production audits/);
  assert.match(result.stdout, /24 research audits/);
});
```

再添加 build isolation test：在临时目录运行 `tools/build-dist.mjs` 后递归列出文件，断言不包含：

```js
[
  'regional-atlas.v2.json',
  'regional-menu-mappings.v1.json',
  'regional-atlas.md',
]
```

- [ ] **Step 2: 运行新增测试并确认先红**

Run:

```bash
node --test tools/tests/regional-atlas-artifacts.test.mjs
```

Expected: FAIL because `check-recipes.mjs` does not print `regional atlas ok`.

- [ ] **Step 3: 在 `check-recipes` 中接入只读校验**

修改 `tools/check-recipes.mjs`：

1. 读取两份新增 source data；
2. 运行 catalog validator 与 mapping validator；
3. 只有 source validation 全绿时构建 report；
4. 运行 report validator；
5. 对两个固定 artifact 做字节级 freshness 比较；
6. stale 时输出 `run node tools/build-regional-atlas.mjs --write intentionally`；
7. 聚合 `errors`，绝不在检查命令中自动写文件；
8. 全绿时打印 `13 regions · 34 provinces · 12 technique families · 72 production audits · 24 research audits · regional atlas ok`。

不得更改现有菜谱、Planner、menu-master 和 Ratio DSL 校验顺序或成功条件。

- [ ] **Step 4: 更新部署前检查说明**

在 `部署说明.md` 的数据变更/部署前门禁部分加入：

```bash
node tools/build-regional-atlas.mjs --check
node tools/check-recipes.mjs
```

明确：需要有意更新审计报告时先运行 `node tools/build-regional-atlas.mjs --write`；地域资产不进入 `dist/`，不改变线上推荐。

- [ ] **Step 5: 运行聚合与隔离测试**

Run:

```bash
node --test tools/tests/regional-atlas-artifacts.test.mjs
node tools/build-regional-atlas.mjs --check
node tools/check-recipes.mjs
```

Expected: all exit 0; both `menu master ok` and `regional atlas ok` appear.

- [ ] **Step 6: 提交聚合门禁**

```bash
git add tools/check-recipes.mjs tools/tests/regional-atlas-artifacts.test.mjs 部署说明.md
git commit -m "chore: gate regional atlas freshness"
```

---

### Task 6: 全量验证、边界审计与 Draft PR 交付

**Files:**
- Verify only: all files changed since the plan execution baseline.
- Do not modify: `tools/data/recipe-library.json`, `tools/data/regional-menu-research.v1.json`, `tools/data/ingredient-taxonomy.v1.json`, `tools/data/meal-templates.v2.json`, `tools/data/ratio-rules.v1.json`, `worker/`, `index.html`, `ai_proxy.py`.

**Interfaces:**
- Consumes: all Task 1–5 outputs.
- Produces: verified phase-zero commit series on the existing Draft PR branch; no deployment.

- [ ] **Step 1: 运行 focused tests**

```bash
node --test \
  tools/tests/regional-atlas-catalog.test.mjs \
  tools/tests/regional-menu-mappings.test.mjs \
  tools/tests/regional-atlas-builder.test.mjs \
  tools/tests/regional-atlas-artifacts.test.mjs
node tools/build-regional-atlas.mjs --check
```

Expected: all tests PASS and freshness exits 0.

- [ ] **Step 2: 运行现有完整测试和数据门禁**

```bash
node --test tools/tests/*.test.mjs
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
python3 -m py_compile ai_proxy.py
```

Expected: all existing tests and gates PASS; recipe summary remains 72 = 12 approved + 60 auto_approved; planner journeys remain unchanged.

- [ ] **Step 3: 验证 build 与地域资产隔离**

```bash
OUT="$(mktemp -d)/dist"
node tools/build-dist.mjs --out-dir "$OUT" --build-id regional-atlas-phase-zero
find "$OUT" -type f | sort
if find "$OUT" -type f | rg 'regional-atlas|regional-menu-mappings'; then
  echo 'regional audit asset leaked into dist' >&2
  exit 1
fi
```

Expected: build exits 0; final guard finds no regional audit asset.

- [ ] **Step 4: 做逐项结构审计**

Run a read-only Node audit that asserts:

```js
assert.equal(atlas.regions.length, 13);
assert.equal(atlas.province_nodes.length, 34);
assert.equal(atlas.technique_families.length, 12);
assert.equal(new Set(atlas.province_nodes.map(row => row.atlas_code)).size, 34);
assert.equal(mappings.production_recipe_mappings.length, 72);
assert.equal(mappings.research_candidate_mappings.length, 24);
assert.equal(recipeLibrary.recipes.length, 72);
assert.equal(regionalResearch.entries.length, 24);
```

另外断言所有 `national_household` / `outside_cn_atlas` 的地域数组为空，所有 `province_specific` 的省份与 region parent 一致。

- [ ] **Step 5: 审计变更范围**

```bash
git diff --name-only 0af6c57bf7dae5c88413c25f107570a89545a0c8..HEAD
git diff --check 0af6c57bf7dae5c88413c25f107570a89545a0c8..HEAD
git status --short
```

Expected: only本计划 File Map 中的审计资产、测试、生成报告、`tools/check-recipes.mjs` 和 `部署说明.md` 发生变化；工作区干净；无 runtime、recipe、template、taxonomy、Ratio DSL 或部署产物。

- [ ] **Step 6: 推送现有 Draft PR 分支**

```bash
git push -u origin codex/targeted-recipe-expansion
gh pr view 1 --json isDraft,state,url,headRefOid
```

Expected: PR #1 remains `OPEN` and `isDraft: true`; do not merge and do not deploy.

- [ ] **Step 7: 人工交付审阅入口**

向用户提供：

- `docs/regional-atlas.md`：全国地域与技法覆盖审阅；
- `tools/generated/regional-atlas.v2.json`：机器审计；
- 34 个省级节点的空白清单；
- 72 个生产菜单的 `regional_scope` 分布；
- 24 个研究候选的地域归位；
- 说明下一阶段仍只为“东北 + `stew-with-staple` + 最多 4 个原型”单独写研究计划，不自动新增 recipe。

---

## Completion Gate

第0轮只有在以下证据全部存在时才算完成：

1. 13/34/12 精确机器校验通过；
2. 72/24 source ID 集合逐一对应，无遗漏、重复或未知 ID；
3. 11 个域外菜单和所有全国性家常菜单没有伪造中国省份；
4. 34 个省级节点即使无候选也可见，并有研究问题或暂缓理由；
5. 四类报告均存在：地域覆盖、技法覆盖、pantry gap、来源状态；
6. `build-regional-atlas --check` 和 `check-recipes` 均 fail closed；
7. 全量测试、Planner journeys、Python 语法与 build isolation 通过；
8. recipe、research candidate、template、taxonomy、Ratio DSL、Planner、Worker、前端和 DeepSeek 契约均未改变；
9. Draft PR #1 保持 Draft，且无 Preview/production 部署。

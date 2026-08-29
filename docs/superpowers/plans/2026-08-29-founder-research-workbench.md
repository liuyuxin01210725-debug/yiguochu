# 一锅出创业研发工作台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建成只在 research/calibration 构建出现的本机创业研发工作台，让原创概念或 923 条来源菜谱能够经历计划、实厨记录、复盘、版本比较和事实约束内容输出。

**Architecture:** `/lab/` 是独立的移动优先静态应用，纯领域规则集中在可被浏览器和 Node 同时导入的 ESM，IndexedDB 通过 repository 接口隔离。工作台只读既有来源、执行、安全和营养资产；私有项目与尝试只写本机数据库，并以带版本和摘要的 JSON 导入导出。构建脚本只在 `research`/`calibration` scope 复制工作台，默认 `runtime` fail closed。

**Tech Stack:** 原生 HTML/CSS/ES modules、IndexedDB、Node.js 25 `node:test`、现有 `tools/build-dist.mjs`、无新增 npm 依赖。

**Spec:** `docs/superpowers/specs/2026-08-29-founder-research-workbench-design.md`

## Global Constraints

- `/lab/` 只进入 `research` 和 `calibration` 构建，默认 `runtime` 构建必须不存在工作台、研发 schema 和私有数据。
- 来源事实、研发计划、厨房实测分别存储，禁止互相覆盖。
- 原创项目固定使用 `origin_type: "original_concept"`，不得获得传统菜、官方配方或来源已核身份。
- 营养优先级保持“台湾食药署库 → 前端权威库 → 未命中标估算”；AI 数值不能成为权威值。
- 设备或必要安全终点缺失时可以保存草稿，但不能完成 attempt 或进入 `content_ready`。
- 内容卡只引用已记录事实；首版不调用 LLM，不自动发布。
- 私有记录只能存在于浏览器 IndexedDB 和用户主动下载的文件，不能写入 `dist/`、Git 或 Worker 日志。
- 旧 `yiguochu-source-recipe-trials` 迁移必须幂等且保留无法解析的原文；旧 key 在成功导出前不删除。
- 实现遵循 RED → 最小 GREEN → 专项回归 → 小提交；不得改动或提交 `.superpowers/research/`。

## File Map

- Create `lab/index.html`: 工作台语义壳、页面区域和无脚本提示。
- Create `lab/styles.css`: 移动优先视觉、厨房大按钮、四层事实对照和错误状态。
- Create `lab/app.js`: 页面状态、路由、事件处理和 repository/data adapter 编排。
- Create `lab/views.js`: 纯 DOM 渲染和表单读取，不直接访问存储或网络。
- Create `lab/domain.js`: 项目/attempt 状态机、不变量、差异、研发结论卡和内容卡。
- Create `lab/data.js`: 研究资产加载、来源快照、候选过滤与可解释排序。
- Create `lab/nutrition.js`: 台湾库/本地权威库精确匹配、计划/实测营养汇总和估算标识。
- Create `lab/storage.js`: IndexedDB repository、乐观并发、迁移、导出、导入预览与应用。
- Create `tools/build-founder-workbench-foods.mjs`: 从 `index.html` 权威 `FOODS`/`FOOD_ALIAS` 确定性生成工作台本地营养镜像。
- Create `tools/data/founder-workbench-local-foods.v1.json`: 由 builder 生成、与前端本地库保持同源的只读资产。
- Create `tools/data/founder-research-workbench.schema.v1.json`: 导出包和核心记录结构契约。
- Create `tools/lib/founder-research-workbench.mjs`: Node 侧 schema/领域验证入口，复用 `lab/domain.js`。
- Create `tools/tests/founder-research-workbench-domain.test.mjs`: 状态、身份、安全和内容事实约束。
- Create `tools/tests/founder-research-workbench-data.test.mjs`: 来源快照、候选过滤、设备阻断和原创种子。
- Create `tools/tests/founder-research-workbench-nutrition.test.mjs`: 两层权威查表、生熟边界、按克重汇总和估算标识。
- Create `tools/tests/founder-research-workbench-storage.test.mjs`: repository、迁移、摘要、冲突和导入导出。
- Create `tools/tests/founder-research-workbench-page.test.mjs`: 静态页面、表单、可访问文案与模块边界。
- Create `tools/tests/founder-research-workbench-browser.test.mjs`: Chrome 中的 IndexedDB/刷新恢复/移动视口旅程。
- Modify `tools/build-dist.mjs`: scope 限制、`/lab/` 复制、shell 注入和 schema 复制。
- Modify `sw.js`: `/lab/` 离线导航回退；源文件 fallback 仍保持 runtime-only。
- Modify `tools/tests/build-dist.test.mjs`: 三 scope 分包断言。
- Modify `tools/tests/service-worker.test.mjs`: research shell 与 `/lab/` 离线回退断言。
- Modify `tools/check-recipes.mjs`: 校验工作台 schema 文件和共享 validator 可导入，不读取私有实例。
- Modify `source-recipes.html`: research 页面增加“加入研发工作台”入口，不改变来源只读语义。
- Modify `docs/PRODUCT_PRINCIPLES.md`: 记录“现阶段内部研发与内容工具”的当前交付边界。

---

### Task 1: 领域模型、原创身份和状态门

**Files:**
- Create: `lab/domain.js`
- Create: `tools/data/founder-research-workbench.schema.v1.json`
- Create: `tools/lib/founder-research-workbench.mjs`
- Create: `tools/tests/founder-research-workbench-domain.test.mjs`

**Interfaces:**
- Produces: `createOriginalProject(input, deps)`, `createSourceProject(input, deps)`, `createAttempt(project, plan, deps)`, `startAttempt(attempt, at)`, `recordAttemptStep(attempt, stepId, patch, at)`, `reviewAttempt(attempt, review, requirements, at)`, `transitionProject(project, targetStage, evidence)`, `validateProject(project)`, `validateAttempt(attempt)`, `validateWorkbenchExport(value)`.
- Types: `deps = { now: () => string, id: (prefix: string) => string }`; all functions return new plain objects and never mutate their input.

- [ ] **Step 1: Write failing identity and lifecycle tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createOriginalProject, createSourceProject, createAttempt,
  startAttempt, reviewAttempt, transitionProject, validateProject,
} from '../../lab/domain.js';

const deps = { now: () => '2026-08-29T01:00:00.000Z', id: prefix => `${prefix}-001` };

test('original concepts never receive source authority', () => {
  const project = createOriginalProject({ name: '大番茄饭', hypothesis: '整颗番茄形成视觉记忆点' }, deps);
  assert.equal(project.origin_type, 'original_concept');
  assert.equal(project.source_snapshot, null);
  assert.equal(project.stage, 'candidate');
  assert.deepEqual(project.authority_claims, []);
});

test('source adaptations preserve an immutable source snapshot', () => {
  const source = { recipe_id: 'taiwan-tomato-rice', catalog_version: 'catalog-v1', canonical_name: '番茄炊饭', shelf: 'B' };
  const project = createSourceProject({ source, hypothesis: '调整为家庭电饭煲批次' }, deps);
  assert.equal(project.origin_type, 'source_adaptation');
  assert.deepEqual(project.source_snapshot, source);
  assert.notEqual(project.source_snapshot, source);
});

test('missing equipment and required safety endpoints keep an attempt incomplete', () => {
  const project = createOriginalProject({ name: '鸡肉饭', hypothesis: '验证投料顺序' }, deps);
  const attempt = startAttempt(createAttempt(project, {
    servings: 2, ingredients: [{ id: 'chicken', name: '鸡腿肉', planned_amount: { value: 200, unit: 'g' } }],
    liquid: { value: 180, unit: 'ml' }, equipment: null,
    steps: [{ id: 's1', instruction: '加入鸡腿肉' }], required_safety_endpoint_codes: ['poultry_fully_cooked'],
  }, deps), deps.now());
  assert.throws(() => reviewAttempt(attempt, { yield: { value: 2, unit: '份' }, safety_observations: [] }, {
    required_safety_endpoint_codes: ['poultry_fully_cooked'],
  }, deps.now()), /equipment_missing|safety_endpoint_missing/u);
});

test('project cannot skip from candidate to content_ready', () => {
  const project = createOriginalProject({ name: '大番茄饭', hypothesis: '测试' }, deps);
  assert.throws(() => transitionProject(project, 'content_ready', {}), /invalid_project_transition/u);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tools/tests/founder-research-workbench-domain.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `lab/domain.js`.

- [ ] **Step 3: Implement immutable factories and explicit transitions**

```js
export const PROJECT_STAGES = Object.freeze(['candidate', 'planned', 'cooking', 'reviewed', 'content_ready', 'pilot_candidate', 'paused']);
export const ATTEMPT_STAGES = Object.freeze(['planned', 'cooking', 'reviewed', 'incomplete']);
const NEXT = new Map([
  ['candidate', new Set(['planned', 'paused'])],
  ['planned', new Set(['cooking', 'paused'])],
  ['cooking', new Set(['reviewed', 'paused'])],
  ['reviewed', new Set(['planned', 'content_ready', 'paused'])],
  ['content_ready', new Set(['planned', 'pilot_candidate', 'paused'])],
  ['pilot_candidate', new Set(['planned', 'paused'])],
  ['paused', new Set(['candidate', 'planned', 'reviewed', 'content_ready'])],
]);

export function createOriginalProject(input, deps) {
  return Object.freeze({
    schema_version: 'founder-research-project.v1', project_id: deps.id('project'), revision: 0,
    name: String(input.name).trim(), hypothesis: String(input.hypothesis).trim(),
    origin_type: 'original_concept', source_snapshot: null, authority_claims: [],
    protein_class: input.protein_class || 'unclassified', stage: 'candidate', attempt_ids: [],
    created_at: deps.now(), updated_at: deps.now(),
  });
}

export function transitionProject(project, targetStage, evidence) {
  if (!NEXT.get(project.stage)?.has(targetStage)) throw new Error('invalid_project_transition');
  if (targetStage === 'content_ready' && evidence?.attempt?.stage !== 'reviewed') throw new Error('reviewed_attempt_required');
  return Object.freeze({ ...project, stage: targetStage, revision: project.revision + 1, updated_at: evidence.at });
}
```

`createSourceProject` must clone only explicit source fields; `reviewAttempt` must collect all blockers and throw an error whose message contains stable reason codes. The JSON schema must set `additionalProperties: false` for export envelope, project, attempt, source snapshot, amount and safety observation objects.

- [ ] **Step 4: Add schema parity and non-mutation assertions**

```js
test('factories do not mutate caller objects and validator rejects extra fields', () => {
  const input = { name: '大番茄饭', hypothesis: '测试' };
  const project = createOriginalProject(input, deps);
  assert.deepEqual(input, { name: '大番茄饭', hypothesis: '测试' });
  assert.deepEqual(validateProject({ ...project, fabricated: true }), ['project.fabricated is not allowed']);
});
```

- [ ] **Step 5: Run focused tests and commit**

Run: `node --test tools/tests/founder-research-workbench-domain.test.mjs`

Expected: PASS.

```bash
git add lab/domain.js tools/data/founder-research-workbench.schema.v1.json tools/lib/founder-research-workbench.mjs tools/tests/founder-research-workbench-domain.test.mjs
git commit -m "feat: add founder workbench domain contract"
```

### Task 2: 来源适配、候选解释和大番茄饭种子

**Files:**
- Create: `lab/data.js`
- Create: `tools/tests/founder-research-workbench-data.test.mjs`
- Modify: `lab/domain.js`
- Modify: `tools/tests/founder-research-workbench-domain.test.mjs`

**Interfaces:**
- Consumes: Task 1 `createOriginalProject`, `createSourceProject`.
- Produces: `loadResearchAssets(fetchImpl)`, `sourceProjectInput(record, executionEntry, reviewEntry)`, `compareSourceSnapshot(snapshot, currentRecord)`, `rankCandidates(records, context)`, `bigTomatoSeed(deps)`.
- `loadResearchAssets` returns `{ shelf, executionsById, reviewsById, trialsById }`; failed mandatory fetches throw `research_asset_unavailable:<asset>`.

- [ ] **Step 1: Write failing data adapter tests**

```js
import { bigTomatoSeed, compareSourceSnapshot, rankCandidates, sourceProjectInput } from '../../lab/data.js';

test('big tomato seed contains a question but no fabricated cooking contract', () => {
  const seed = bigTomatoSeed({ now: () => '2026-08-29T01:00:00.000Z', id: p => `${p}-tomato` });
  assert.equal(seed.name, '大番茄饭');
  assert.match(seed.hypothesis, /整颗番茄/u);
  assert.equal(seed.origin_type, 'original_concept');
  assert.equal('ingredients' in seed, false);
  assert.equal('liquid' in seed, false);
  assert.equal('nutrition' in seed, false);
});

test('candidate ranking explains source completeness and blocks equipment mismatch', () => {
  const records = [
    { recipe_id: 'a', canonical_name: '鸡肉饭', shelf: 'A', core_ingredients: ['鸡肉'], equipment_contract: { model: 'RC-A' } },
    { recipe_id: 'b', canonical_name: '豆腐饭', shelf: 'B', core_ingredients: ['豆腐'], equipment_contract: null },
  ];
  const ranked = rankCandidates(records, { equipment: [{ model: 'RC-B' }], protein_class: 'poultry', query: '' });
  assert.equal(ranked[0].recipe_id, 'a');
  assert.equal(ranked[0].blocked, true);
  assert.ok(ranked[0].reasons.includes('equipment_mismatch'));
  assert.ok(ranked[0].reasons.includes('source_contract_complete'));
});

test('source updates are compared with the saved snapshot instead of rewriting history', () => {
  const snapshot = { recipe_id: 'a', catalog_version: 'v1', canonical_name: '番茄饭', shelf: 'B', core_ingredients: ['大米', '番茄'] };
  const current = { ...snapshot, catalog_version: 'v2', shelf: 'A', core_ingredients: ['大米', '番茄', '鸡蛋'] };
  assert.deepEqual(compareSourceSnapshot(snapshot, current), {
    status: 'changed', from_version: 'v1', to_version: 'v2',
    changed_fields: ['shelf', 'core_ingredients'],
  });
  assert.equal(snapshot.catalog_version, 'v1');
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tools/tests/founder-research-workbench-data.test.mjs`

Expected: FAIL with missing exports from `lab/data.js`.

- [ ] **Step 3: Implement fail-closed asset joins and reason-based ranking**

```js
const ASSETS = Object.freeze({
  shelf: '/source-backed-one-pot-shelf.v1.json',
  executions: '/source-backed-execution-library.v1.json',
  reviews: '/source-backed-formal-candidate-review.v1.json',
  trials: '/kitchen-trial-catalog.v1.json',
});

export async function loadResearchAssets(fetchImpl = fetch) {
  const loaded = {};
  for (const [name, url] of Object.entries(ASSETS)) {
    const response = await fetchImpl(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`research_asset_unavailable:${name}`);
    loaded[name] = await response.json();
  }
  return {
    shelf: loaded.shelf,
    executionsById: new Map(loaded.executions.entries.map(row => [row.recipe_id, row])),
    reviewsById: new Map(loaded.reviews.records.map(row => [row.recipe_id, row])),
    trialsById: new Map(loaded.trials.entries.map(row => [row.candidate_id, row])),
  };
}
```

Ranking order must be deterministic: exact query match, requested protein class, unblocked equipment match, shelf A/B/C, then canonical name and recipe ID. The returned score is internal only; UI receives `reasons` and `blocked`, never a health or business-success score.

When a saved source no longer exists, `compareSourceSnapshot` returns `{ status: 'detached', from_version, to_version: null, changed_fields: [] }`; the project stays readable and cannot silently bind to another recipe ID.

- [ ] **Step 4: Run both focused suites and commit**

Run: `node --test tools/tests/founder-research-workbench-domain.test.mjs tools/tests/founder-research-workbench-data.test.mjs`

Expected: PASS.

```bash
git add lab/domain.js lab/data.js tools/tests/founder-research-workbench-domain.test.mjs tools/tests/founder-research-workbench-data.test.mjs
git commit -m "feat: connect founder workbench research candidates"
```

### Task 3: IndexedDB repository、迁移和可校验备份

**Files:**
- Create: `lab/storage.js`
- Create: `tools/tests/founder-research-workbench-storage.test.mjs`
- Modify: `lab/domain.js`
- Modify: `tools/lib/founder-research-workbench.mjs`

**Interfaces:**
- Consumes: `validateProject`, `validateAttempt`, `validateWorkbenchExport`.
- Produces: `createWorkbenchRepository({ indexedDB, localStorage, crypto, now })` with methods `listProjects()`, `getProject(id)`, `saveProject(project, expectedRevision)`, `listAttempts(projectId)`, `getAttempt(id)`, `saveAttempt(attempt, expectedRevision)`, `getSettings()`, `saveSettings(settings, expectedRevision)`, `migrateLegacyRecords()`, `exportAll()`, `previewImport(envelope)`, `applyImport(preview, choices)`.
- Produces for tests: `createMemoryWorkbenchRepository(deps)` implementing the same interface.

- [ ] **Step 1: Write failing repository and migration tests**

```js
import { createMemoryWorkbenchRepository } from '../../lab/storage.js';
import { createOriginalProject } from '../../lab/domain.js';

const deps = { now: () => '2026-08-29T01:00:00.000Z', id: prefix => `${prefix}-storage` };
function makeProject() {
  return createOriginalProject({ name: '大番茄饭', hypothesis: '验证整颗番茄的操作和口感' }, deps);
}
function memoryLocalStorage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
  };
}

test('save uses optimistic revision checks', async () => {
  const repo = createMemoryWorkbenchRepository({ now: () => '2026-08-29T01:00:00.000Z' });
  const project = makeProject();
  await repo.saveProject(project, null);
  await assert.rejects(repo.saveProject({ ...project, revision: 1 }, 9), /revision_conflict/u);
});

test('legacy migration is idempotent and preserves raw text', async () => {
  const localStorage = memoryLocalStorage({
    'yiguochu-source-recipe-trials': JSON.stringify({ 'recipe-a': { water: '半杯左右', notes: '有点糊底' } }),
  });
  const repo = createMemoryWorkbenchRepository({ localStorage, now: () => '2026-08-29T01:00:00.000Z' });
  assert.equal((await repo.migrateLegacyRecords()).created_projects, 1);
  assert.equal((await repo.migrateLegacyRecords()).created_projects, 0);
  const [attempt] = await repo.listAttempts((await repo.listProjects())[0].project_id);
  assert.equal(attempt.legacy_import.raw.water, '半杯左右');
  assert.equal(localStorage.getItem('yiguochu-source-recipe-trials') !== null, true);
});

test('export import round trip verifies digest and surfaces conflicts', async () => {
  const repo = createMemoryWorkbenchRepository({ now: () => '2026-08-29T01:00:00.000Z' });
  await repo.saveProject(makeProject(), null);
  const envelope = await repo.exportAll();
  assert.match(envelope.digest, /^[a-f0-9]{64}$/u);
  const preview = await repo.previewImport(envelope);
  assert.equal(preview.valid, true);
  assert.equal(preview.counts.projects, 1);
  await assert.rejects(repo.previewImport({ ...envelope, digest: '0'.repeat(64) }), /digest_mismatch/u);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tools/tests/founder-research-workbench-storage.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `lab/storage.js`.

- [ ] **Step 3: Implement one repository contract over memory and IndexedDB**

```js
const DB_NAME = 'yiguochu-founder-workbench';
const DB_VERSION = 1;
const STORES = Object.freeze(['projects', 'attempts', 'settings', 'migrations']);

export function createWorkbenchRepository(deps) {
  return repositoryFromAdapter(indexedDbAdapter(deps.indexedDB, DB_NAME, DB_VERSION, STORES), deps);
}

async function checkedSave(adapter, store, value, expectedRevision) {
  const current = await adapter.get(store, value[store === 'projects' ? 'project_id' : 'attempt_id']);
  const actual = current?.revision ?? null;
  if (actual !== expectedRevision) throw new Error(`revision_conflict:${store}`);
  await adapter.put(store, { ...value, revision: (actual ?? -1) + 1 });
}
```

`exportAll` must canonicalize the envelope without `digest`, compute SHA-256 through `crypto.subtle.digest`, then return lowercase hex. `previewImport` must validate schema before calculating `{ adds, conflicts, unchanged }`. `applyImport` must require an explicit choice for every conflict: `keep_local` or `use_imported`.

- [ ] **Step 4: Add a source-level IndexedDB contract test**

```js
test('browser repository creates all v1 stores and never falls back to localStorage for new data', () => {
  const source = fs.readFileSync(new URL('../../lab/storage.js', import.meta.url), 'utf8');
  for (const name of ['projects', 'attempts', 'settings', 'migrations']) assert.match(source, new RegExp(`['"]${name}['"]`));
  assert.doesNotMatch(source, /localStorage\.setItem\([^)]*(?:project|attempt)/u);
});
```

- [ ] **Step 5: Run focused tests and commit**

Run: `node --test tools/tests/founder-research-workbench-domain.test.mjs tools/tests/founder-research-workbench-storage.test.mjs`

Expected: PASS.

```bash
git add lab/domain.js lab/storage.js tools/lib/founder-research-workbench.mjs tools/tests/founder-research-workbench-storage.test.mjs
git commit -m "feat: persist founder research attempts locally"
```

### Task 4: 工作台壳、今日主任务和项目创建

**Files:**
- Create: `lab/index.html`
- Create: `lab/styles.css`
- Create: `lab/views.js`
- Create: `lab/app.js`
- Create: `tools/tests/founder-research-workbench-page.test.mjs`

**Interfaces:**
- Consumes: repository methods, `loadResearchAssets`, `bigTomatoSeed`, `rankCandidates`, project factories.
- Produces: hash routes `#/home`, `#/new`, `#/project/<project_id>`, `#/attempt/<attempt_id>`; `renderHome`, `renderCandidatePicker`, `renderProject`, `renderNotice` from `views.js`.

- [ ] **Step 1: Write failing shell and content tests**

```js
test('workbench shell is mobile first and exposes one primary daily action', () => {
  const html = fs.readFileSync(new URL('../../lab/index.html', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../../lab/styles.css', import.meta.url), 'utf8');
  assert.match(html, /一锅出研发工作台/u);
  assert.match(html, /id="app"/u);
  assert.match(html, /type="module" src="\.\/app\.js"/u);
  assert.match(css, /@media\s*\(max-width:\s*560px\)/u);
});

test('home copy focuses on one dish and does not claim a public product', () => {
  const views = fs.readFileSync(new URL('../../lab/views.js', import.meta.url), 'utf8');
  assert.match(views, /继续今天的试做|选择一道开始研发/u);
  assert.match(views, /内部研发/u);
  assert.doesNotMatch(views, /立即下单|会员|营养达标/u);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tools/tests/founder-research-workbench-page.test.mjs`

Expected: FAIL because `lab/index.html` does not exist.

- [ ] **Step 3: Build semantic shell and render-only views**

```html
<main>
  <header class="lab-header">
    <p class="eyebrow">一锅出 · 内部研发</p>
    <h1>研发工作台</h1>
    <p>每天把一道想法做成可复盘的证据。</p>
  </header>
  <section id="app" aria-live="polite"></section>
</main>
<script type="module" src="./app.js"></script>
```

`app.js` must initialize in this order: open repository → migrate legacy records → render local home → load research assets in background → refresh candidate availability. Asset failure must not hide local projects.

- [ ] **Step 4: Implement project creation journeys**

`#/new` must provide two explicit buttons: “从来源菜谱开始” and “建立原创实验”. The original form requires name and hypothesis; the source form requires a joined source record and displays source layer, blockers and equipment reason before creation. Seed “大番茄饭” appears as a one-click draft but uses the same original form and remains editable.

```js
async function createOriginalFromForm(form) {
  const input = Object.fromEntries(new FormData(form));
  const project = createOriginalProject({ name: input.name, hypothesis: input.hypothesis, protein_class: input.protein_class }, deps);
  await repository.saveProject(project, null);
  location.hash = `#/project/${encodeURIComponent(project.project_id)}`;
}
```

- [ ] **Step 5: Run page and domain tests and commit**

Run: `node --test tools/tests/founder-research-workbench-page.test.mjs tools/tests/founder-research-workbench-domain.test.mjs tools/tests/founder-research-workbench-data.test.mjs`

Expected: PASS.

```bash
git add lab/index.html lab/styles.css lab/views.js lab/app.js tools/tests/founder-research-workbench-page.test.mjs
git commit -m "feat: add founder workbench daily flow"
```

### Task 5: 计划试做和厨房执行界面

**Files:**
- Modify: `lab/app.js`
- Modify: `lab/views.js`
- Modify: `lab/styles.css`
- Modify: `lab/domain.js`
- Modify: `tools/tests/founder-research-workbench-domain.test.mjs`
- Modify: `tools/tests/founder-research-workbench-page.test.mjs`

**Interfaces:**
- Consumes: `createAttempt`, `startAttempt`, `recordAttemptStep`, repository save methods.
- Produces: `renderAttemptPlan(project, draft)`, `renderCookingAttempt(attempt)`, `readAttemptPlan(form)`, `readStepPatch(form)`.

- [ ] **Step 1: Add failing plan-versus-actual tests**

```js
import { createOriginalProject, createAttempt, startAttempt } from '../../lab/domain.js';

function makeCookingAttempt({ planned_amount }) {
  const deps = { now: () => '2026-08-29T01:00:00.000Z', id: prefix => `${prefix}-cooking` };
  const project = createOriginalProject({ name: '鸡肉饭', hypothesis: '验证实际称量偏差' }, deps);
  const planned = createAttempt(project, {
    servings: 2,
    ingredients: [{ id: 'chicken', name: '鸡腿肉', state: 'raw', planned_amount }],
    liquid: { value: 180, unit: 'ml' },
    equipment: { id: 'eq-1', brand: '测试', model: 'RC-A', capacity: { value: 3, unit: 'L' }, program: '标准煮' },
    steps: [{ id: 's1', instruction: '加入鸡腿肉' }],
    required_safety_endpoint_codes: ['poultry_fully_cooked'],
  }, deps);
  return startAttempt(planned, deps.now());
}

test('recording an actual amount never overwrites the planned amount', () => {
  const attempt = makeCookingAttempt({ planned_amount: { value: 200, unit: 'g' } });
  const next = recordAttemptStep(attempt, 's1', {
    actual_ingredients: [{ ingredient_id: 'chicken', actual_amount: { value: 185, unit: 'g' }, deviation_reason: '修去多余脂肪' }],
  }, '2026-08-29T01:10:00.000Z');
  assert.deepEqual(next.plan.ingredients[0].planned_amount, { value: 200, unit: 'g' });
  assert.deepEqual(next.execution.steps.s1.actual_ingredients[0].actual_amount, { value: 185, unit: 'g' });
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tools/tests/founder-research-workbench-domain.test.mjs`

Expected: FAIL because `recordAttemptStep` does not yet preserve the execution patch shape.

- [ ] **Step 3: Implement structured planning form**

The form must capture servings, ingredient rows, liquid amount/waterline, equipment brand/model/capacity/program, ordered steps, observation questions and required safety endpoint codes. Source-adaptation values display provenance beside each field; editing creates a `planned` value without changing `source_snapshot`.

```js
export function readAttemptPlan(form) {
  return {
    servings: Number(form.elements.servings.value),
    ingredients: readRepeatableRows(form, 'ingredient').map(row => ({
      id: row.id, name: row.name, state: row.state,
      planned_amount: { value: Number(row.value), unit: row.unit }, provenance: row.provenance,
    })),
    liquid: readLiquid(form), equipment: readEquipment(form),
    steps: readRepeatableRows(form, 'step'),
    observation_questions: readLines(form.elements.observation_questions.value),
    required_safety_endpoint_codes: readCheckedValues(form, 'safety_endpoint'),
  };
}
```

- [ ] **Step 4: Implement resumable kitchen mode**

Kitchen mode shows one column, at least 48px controls, planned and actual values side by side, start/end timestamps and deviation reason. Every step action saves the attempt with its current revision; a revision conflict displays a blocking notice and reload choice instead of overwriting.

- [ ] **Step 5: Add page assertions and run focused suites**

```js
test('kitchen view exposes actual amount, timing, deviation and safety controls', () => {
  const source = fs.readFileSync(new URL('../../lab/views.js', import.meta.url), 'utf8');
  for (const copy of ['实际加入量', '偏差原因', '开始时间', '完成时间', '安全终点']) assert.match(source, new RegExp(copy));
});
```

Run: `node --test tools/tests/founder-research-workbench-domain.test.mjs tools/tests/founder-research-workbench-page.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lab/app.js lab/views.js lab/styles.css lab/domain.js tools/tests/founder-research-workbench-domain.test.mjs tools/tests/founder-research-workbench-page.test.mjs
git commit -m "feat: record planned and actual kitchen trials"
```

### Task 6: 两层权威营养与按实测克重汇总

**Files:**
- Create: `lab/nutrition.js`
- Create: `tools/build-founder-workbench-foods.mjs`
- Create: `tools/data/founder-workbench-local-foods.v1.json`
- Create: `tools/tests/founder-research-workbench-nutrition.test.mjs`
- Modify: `lab/data.js`
- Modify: `lab/domain.js`

**Interfaces:**
- Consumes: `/foods-tw.json`, generated local foods asset, attempt plan/execution ingredients.
- Produces: `normalizeFoodName(value)`, `createNutritionLookup({ twFoods, localFoods, aliases, seasonings })`, `calculateAttemptNutrition(attempt, lookup)`, builder `buildLocalFoodsAsset(indexSource)`.
- Lookup result shape: `{ matched: boolean, authority: 'tw'|'local'|'seasoning_zero'|'estimated', authority_code: string|null, food_name: string, per_100g: object|null }`.

- [ ] **Step 1: Write failing authority, state and weight tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createNutritionLookup, calculateAttemptNutrition } from '../../lab/nutrition.js';

function makeAttempt(actualIngredients) {
  return {
    attempt_id: 'attempt-nutrition',
    plan: { ingredients: actualIngredients.map(item => ({ name: item.name, planned_amount: item.actual_amount })) },
    execution: { ingredients: actualIngredients },
  };
}
function lookupFixture() {
  return createNutritionLookup({
    twFoods: [{ n: '番茄', code: 'E1500101', kcal: 18, p: 0.9, fb: 1.2 }],
    localFoods: [{ id: 'g-17', name: '大米（生）', kcal: 346, p: 7.1, fb: 0.7 }],
    aliases: { 大米: 'g-17' }, seasonings: ['姜'],
  });
}

test('Taiwan exact match wins over local fallback and keeps the authority code', () => {
  const lookup = createNutritionLookup({
    twFoods: [{ n: '马铃薯', code: 'B0700201', kcal: 77, p: 2.6 }],
    localFoods: [{ id: 's-13', name: '马铃薯', kcal: 87, p: 1.9 }], aliases: {}, seasonings: [],
  });
  assert.deepEqual(lookup('马铃薯'), {
    matched: true, authority: 'tw', authority_code: 'B0700201', food_name: '马铃薯',
    per_100g: { kcal: 77, p: 2.6 },
  });
});

test('raw rice never falls through to cooked rice', () => {
  const lookup = createNutritionLookup({
    twFoods: [], localFoods: [
      { id: 'g-1', name: '米饭（熟）', kcal: 130 },
      { id: 'g-17', name: '大米（生）', kcal: 346 },
    ], aliases: { 大米: 'g-17', 米饭: 'g-1' }, seasonings: [],
  });
  assert.equal(lookup('大米').per_100g.kcal, 346);
  assert.equal(lookup('米饭').per_100g.kcal, 130);
});

test('actual nutrition is hidden until every used ingredient has an actual gram weight', () => {
  const result = calculateAttemptNutrition(makeAttempt([
    { name: '大米', used: true, actual_amount: { value: 150, unit: 'g' } },
    { name: '番茄', used: true, actual_amount: null },
  ]), lookupFixture());
  assert.equal(result.actual.complete, false);
  assert.equal(result.actual.totals, null);
  assert.equal(result.actual.missing_amounts[0], '番茄');
});

test('unmatched ingredients remain estimated instead of receiving authority', () => {
  const item = lookupFixture()('自制神秘酱');
  assert.equal(item.matched, false);
  assert.equal(item.authority, 'estimated');
  assert.equal(item.per_100g, null);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tools/tests/founder-research-workbench-nutrition.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `lab/nutrition.js`.

- [ ] **Step 3: Build the local fallback asset from the existing authority source**

`buildLocalFoodsAsset` must locate the exact `const FOODS = [...]` and `const FOOD_ALIAS = {...}` ranges between their existing stable markers, evaluate only those object/array expressions in an empty `vm` context with a 100ms timeout, and return:

```js
{
  schema_version: 'founder-workbench-local-foods.v1',
  source: 'index.html#FOODS+FOOD_ALIAS',
  foods: parsedFoods,
  aliases: parsedAliases,
  seasonings: parsedSeasonings,
}
```

The builder CLI writes canonical pretty JSON plus newline. The test must rebuild in memory and deep-equal the checked-in file, so any future `FOODS` change fails until the mirror is regenerated.

- [ ] **Step 4: Implement exact two-layer lookup and totals**

```js
export function createNutritionLookup({ twFoods, localFoods, aliases, seasonings }) {
  const tw = exactIndex(twFoods.flatMap(food => [[food.n, food], ...splitAliases(food.a).map(name => [name, food])]));
  const localById = new Map(localFoods.map(food => [food.id, food]));
  return rawName => {
    const name = normalizeFoodName(rawName);
    if (seasonings.includes(name)) return zeroSeasoning(name);
    const twFood = uniqueExactOrBaseMatch(tw, name);
    if (twFood) return authorityResult('tw', twFood.code, twFood.n, twFood);
    const localFood = localAliasOrUniqueMatch(name, localFoods, localById, aliases);
    if (localFood) return authorityResult('local', localFood.id, localFood.name, localFood);
    return { matched: false, authority: 'estimated', authority_code: null, food_name: rawName, per_100g: null };
  };
}
```

Only `g` is accepted for numeric formula totals in v1. Count, ml and waterline remain visible but do not enter nutrition totals. Plan and actual totals are calculated separately. Unknown nutrition never contributes zero; it increments `estimated_items` and makes the total explicitly partial.

- [ ] **Step 5: Load nutrition assets and attach snapshots to reviewed attempts**

`loadResearchAssets` must also load `foods-tw.json` and `founder-workbench-local-foods.v1.json`. `reviewAttempt` stores a nutrition snapshot with item authority, code, grams, per-100g values, totals, missing amounts and calculation timestamp. Reopening a historical attempt uses its snapshot; recalculation is an explicit action that creates a new snapshot revision.

- [ ] **Step 6: Run builder, nutrition and existing food gates**

Run:

```bash
node tools/build-founder-workbench-foods.mjs
node --test tools/tests/founder-research-workbench-nutrition.test.mjs tools/tests/core-ingredient-nutrition-audit.test.mjs tools/tests/allergen-groups-parity.test.mjs
node tools/check-foods.mjs
```

Expected: all commands exit 0; generated local asset is current; no existing food authority or alias regression.

- [ ] **Step 7: Commit**

```bash
git add lab/nutrition.js lab/data.js lab/domain.js tools/build-founder-workbench-foods.mjs tools/data/founder-workbench-local-foods.v1.json tools/tests/founder-research-workbench-nutrition.test.mjs
git commit -m "feat: calculate authority-backed trial nutrition"
```

### Task 7: 复盘、版本比较和事实约束内容卡

**Files:**
- Modify: `lab/domain.js`
- Modify: `lab/app.js`
- Modify: `lab/views.js`
- Modify: `lab/styles.css`
- Modify: `tools/tests/founder-research-workbench-domain.test.mjs`
- Modify: `tools/tests/founder-research-workbench-page.test.mjs`

**Interfaces:**
- Produces: `diffAttempts(previous, current)`, `generateResearchConclusion(project, attempt, previousAttempt)`, `generateContentCard(project, attempt)`, `renderReviewForm`, `renderAttemptComparison`, `renderOutputCards`.

- [ ] **Step 1: Write failing hallucination and comparison tests**

```js
import { createOriginalProject } from '../../lab/domain.js';

const cardDeps = { now: () => '2026-08-29T01:00:00.000Z', id: prefix => `${prefix}-card` };
function makeProject() {
  return createOriginalProject({ name: '大番茄饭', hypothesis: '验证内容记忆点' }, cardDeps);
}
function makeReviewedAttempt(overrides = {}) {
  const base = {
    attempt_id: 'attempt-card', sequence: 1, stage: 'reviewed',
    plan: { liquid: { value: 180, unit: 'ml' } },
    review: {
      yield: { value: 2, unit: '份' }, texture: '粒粒分明', taste: null,
      family_feedback: { observed: false, text: '' }, willing_to_repeat: true,
      disposition: 'revise_and_retry',
    },
    nutrition_snapshot: { estimated_items: 0, totals: { kcal: 420 } },
  };
  return {
    ...base, ...overrides,
    plan: { ...base.plan, ...(overrides.plan || {}) },
    review: { ...base.review, ...(overrides.review || {}) },
  };
}

test('content card omits unobserved taste and family feedback', () => {
  const card = generateContentCard(makeProject(), makeReviewedAttempt({
    review: { texture: '米饭略软', taste: null, family_feedback: { observed: false, text: '' }, willing_to_repeat: true },
  }));
  assert.match(card.markdown, /米饭略软/u);
  assert.doesNotMatch(card.markdown, /女儿喜欢|味道很好/u);
  assert.match(card.markdown, /尚未记录家庭反馈/u);
  assert.match(card.markdown, /营养.*权威|营养.*估算/u);
});

test('attempt diff reports changed liquid without rewriting history', () => {
  const before = makeReviewedAttempt({ plan: { liquid: { value: 200, unit: 'ml' } } });
  const after = makeReviewedAttempt({ plan: { liquid: { value: 170, unit: 'ml' } } });
  const diff = diffAttempts(before, after);
  assert.deepEqual(diff.changed.liquid, { from: { value: 200, unit: 'ml' }, to: { value: 170, unit: 'ml' } });
  assert.equal(before.plan.liquid.value, 200);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tools/tests/founder-research-workbench-domain.test.mjs`

Expected: FAIL with missing `generateContentCard` and `diffAttempts`.

- [ ] **Step 3: Implement required review and deterministic cards**

Review requires yield, dry/wet, soft/hard, scorch, excess liquid, doneness, taste coordination, convenience, family feedback observation state, willingness to repeat and disposition. `generateContentCard` must build sections from a list of `(condition, line)` tuples rather than interpolate fallback praise.

```js
const lines = [
  [`# ${project.name}｜第 ${attempt.sequence} 次试做`, true],
  [`- 实际成品：${formatAmount(attempt.review.yield)}`, Boolean(attempt.review.yield)],
  [`- 质地：${attempt.review.texture}`, Boolean(attempt.review.texture)],
  [`- 家庭反馈：${attempt.review.family_feedback.text}`, attempt.review.family_feedback.observed && Boolean(attempt.review.family_feedback.text)],
  ['- 家庭反馈：尚未记录', !attempt.review.family_feedback.observed],
];
return { markdown: lines.filter(([, include]) => include).map(([line]) => line).join('\n') };
```

The “不能夸大” section must always include: not a production-approved recipe, unverified items, no unproven health-effect claims, and nutrition estimate count.

- [ ] **Step 4: Implement review and comparison UI**

After a valid review, save the reviewed attempt, advance project to `reviewed`, render the conclusion/content cards and provide “复制 Markdown”. Creating another attempt copies the prior plan as editable `planned` data and increments `sequence`; it never mutates the previous attempt. Only a `content_ready` project with at least one reviewed attempt may be manually marked `pilot_candidate`; the button copy is “标为试吃候选（不等于可售）”, and the resulting view repeats that it does not grant Planner or production authority.

- [ ] **Step 5: Run focused tests and commit**

Run: `node --test tools/tests/founder-research-workbench-domain.test.mjs tools/tests/founder-research-workbench-page.test.mjs`

Expected: PASS.

```bash
git add lab/domain.js lab/app.js lab/views.js lab/styles.css tools/tests/founder-research-workbench-domain.test.mjs tools/tests/founder-research-workbench-page.test.mjs
git commit -m "feat: turn kitchen evidence into research outputs"
```

### Task 8: 导入导出、错误恢复和本机设备设置

**Files:**
- Modify: `lab/app.js`
- Modify: `lab/views.js`
- Modify: `lab/styles.css`
- Modify: `lab/storage.js`
- Modify: `tools/tests/founder-research-workbench-storage.test.mjs`
- Modify: `tools/tests/founder-research-workbench-page.test.mjs`

**Interfaces:**
- Consumes: repository `exportAll`, `previewImport`, `applyImport`, settings methods.
- Produces routes `#/settings` and `#/data`; UI actions `download-backup`, `preview-import`, `apply-import`, `save-equipment`.

- [ ] **Step 1: Add failing conflict and no-false-save tests**

```js
test('apply import refuses unresolved conflicts', async () => {
  const preview = { valid: true, conflicts: [{ type: 'project', id: 'project-1' }], adds: [], unchanged: [] };
  await assert.rejects(repo.applyImport(preview, {}), /import_choice_required:project:project-1/u);
});

test('page never claims saved when IndexedDB initialization fails', () => {
  const app = fs.readFileSync(new URL('../../lab/app.js', import.meta.url), 'utf8');
  assert.match(app, /storage_unavailable/u);
  assert.match(app, /只读|临时模式/u);
  assert.doesNotMatch(app, /catch\s*\([^)]*\)\s*\{\s*renderNotice\(['"]已保存/u);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tools/tests/founder-research-workbench-storage.test.mjs tools/tests/founder-research-workbench-page.test.mjs`

Expected: FAIL on unresolved conflict or missing recovery copy.

- [ ] **Step 3: Implement equipment settings and explicit degraded mode**

Equipment records require stable ID, brand, model, capacity value/unit, vessel type and programs. No default equipment is invented. When IndexedDB open fails, local research assets remain browseable but all mutation buttons are disabled and the header says “本机存储不可用，本页未保存任何修改”.

- [ ] **Step 4: Implement backup download and two-phase import**

```js
async function downloadBackup() {
  const envelope = await repository.exportAll();
  const blob = new Blob([`${JSON.stringify(envelope, null, 2)}\n`], { type: 'application/json' });
  downloadBlob(blob, `yiguochu-research-${envelope.exported_at.slice(0, 10)}.json`);
}
```

Import UI first displays version, digest result, counts, additions, unchanged rows and each conflict. “写入本机” remains disabled until every conflict has `keep_local` or `use_imported` selected. A failed import must leave repository counts byte-for-byte unchanged.

- [ ] **Step 5: Run focused tests and commit**

Run: `node --test tools/tests/founder-research-workbench-storage.test.mjs tools/tests/founder-research-workbench-page.test.mjs`

Expected: PASS.

```bash
git add lab/app.js lab/views.js lab/styles.css lab/storage.js tools/tests/founder-research-workbench-storage.test.mjs tools/tests/founder-research-workbench-page.test.mjs
git commit -m "feat: back up and recover founder research data"
```

### Task 9: Research/calibration 构建与离线边界

**Files:**
- Modify: `tools/build-dist.mjs`
- Modify: `sw.js`
- Modify: `tools/tests/build-dist.test.mjs`
- Modify: `tools/tests/service-worker.test.mjs`
- Modify: `tools/check-recipes.mjs`
- Create: `tools/tests/founder-research-workbench-build.test.mjs`
- Modify: `source-recipes.html`

**Interfaces:**
- Consumes: all `lab/` files and workbench schema.
- Produces: `/lab/index.html`, `/lab/styles.css`, `/lab/app.js`, `/lab/views.js`, `/lab/domain.js`, `/lab/data.js`, `/lab/storage.js` only for research/calibration builds.

- [ ] **Step 1: Write failing three-scope build tests**

```js
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const outputs = [];
after(() => outputs.forEach(output => fs.rmSync(output, { recursive: true, force: true })));
function buildScope(scope) {
  const output = fs.mkdtempSync(path.join(ROOT, 'dist', `.founder-${scope}-`));
  outputs.push(output);
  const result = spawnSync(process.execPath, [
    path.join(ROOT, 'tools/build-dist.mjs'), '--out-dir', output,
    '--build-id', `founder-${scope}-test`, '--artifact-scope', scope,
  ], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return output;
}

test('workbench is shipped only in research and calibration scopes', () => {
  for (const scope of ['research', 'calibration']) {
    const output = buildScope(scope);
    for (const asset of ['lab/index.html', 'lab/app.js', 'lab/domain.js', 'founder-research-workbench.schema.v1.json']) {
      assert.equal(fs.existsSync(path.join(output, asset)), true, `${scope}:${asset}`);
    }
  }
  const runtime = buildScope('runtime');
  for (const asset of ['lab/index.html', 'lab/app.js', 'founder-research-workbench.schema.v1.json']) {
    assert.equal(fs.existsSync(path.join(runtime, asset)), false, `runtime:${asset}`);
  }
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tools/tests/founder-research-workbench-build.test.mjs`

Expected: FAIL because research builds do not yet contain `lab/index.html`.

- [ ] **Step 3: Add scope-aware copies and shell entries**

```js
const RESEARCH_LAB_ASSETS = [
  'lab/index.html', 'lab/styles.css', 'lab/app.js', 'lab/views.js',
  'lab/domain.js', 'lab/data.js', 'lab/nutrition.js', 'lab/storage.js',
];

if (includeResearch) {
  for (const asset of RESEARCH_LAB_ASSETS) copy(asset, path.join(outputDir, asset));
  copy('tools/data/founder-research-workbench.schema.v1.json', path.join(outputDir, 'founder-research-workbench.schema.v1.json'));
  copy('tools/data/founder-workbench-local-foods.v1.json', path.join(outputDir, 'founder-workbench-local-foods.v1.json'));
}
```

Add `./lab/`, `./lab/index.html`, CSS and JS modules to `shellEntries(true)` only. Keep raw `sw.js` fallback shell runtime-only.

- [ ] **Step 4: Add `/lab/` service-worker navigation fallback tests**

Research injected shell must cache `lab/index.html`; a cached `/lab/` navigation returns it without waiting for a stalled network. Runtime injected shell must not include any `lab/` path.

- [ ] **Step 5: Wire validator and source-page entry**

`tools/check-recipes.mjs` imports the shared workbench validator and validates the checked-in JSON schema shape only; it must not require a private observation file. `source-recipes.html` adds “加入研发工作台” linking to `/lab/#/new?recipe_id=<id>` and labels it internal research.

- [ ] **Step 6: Run build, service worker and recipe gates**

Run: `node --test tools/tests/founder-research-workbench-build.test.mjs tools/tests/build-dist.test.mjs tools/tests/service-worker.test.mjs tools/tests/source-backed-shelf-page.test.mjs`

Expected: PASS.

Run: `node tools/check-recipes.mjs`

Expected: exit 0 with existing recipe counts unchanged.

- [ ] **Step 7: Commit**

```bash
git add tools/build-dist.mjs sw.js tools/check-recipes.mjs source-recipes.html tools/tests/build-dist.test.mjs tools/tests/service-worker.test.mjs tools/tests/source-backed-shelf-page.test.mjs tools/tests/founder-research-workbench-build.test.mjs
git commit -m "feat: ship founder workbench in research builds"
```

### Task 10: 真实浏览器旅程和移动端可用性

**Files:**
- Create: `tools/tests/fixtures/founder-workbench-browser-smoke.html`
- Create: `tools/tests/founder-research-workbench-browser.test.mjs`
- Modify: `lab/app.js`
- Modify: `lab/styles.css`
- Modify: `lab/views.js`

**Interfaces:**
- Browser fixture imports production `lab/domain.js` and `lab/storage.js`; it exposes final JSON in `<pre id="result" data-status="pass">`.
- Browser test serves repository files on `127.0.0.1`, starts installed Chrome headless with an isolated profile, uses `--dump-dom`, and asserts fixture plus built workbench rendering.

- [ ] **Step 1: Write the failing Chrome smoke test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const CHROME = process.env.YIGUOCHU_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
function makeProfile() { return fs.mkdtempSync(path.join(os.tmpdir(), 'yiguochu-founder-chrome-')); }
function dumpDom(url, profileDir, windowSize = '1280,900') {
  const result = spawnSync(CHROME, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profileDir}`, `--window-size=${windowSize}`,
    '--virtual-time-budget=4000', '--dump-dom', url,
  ], { cwd: ROOT, encoding: 'utf8', timeout: 20000 });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}
function serveRoot() {
  return new Promise(resolve => {
    const server = http.createServer((request, response) => {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      const target = path.resolve(ROOT, `.${pathname}`);
      if (!target.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
        response.writeHead(404).end('not found'); return;
      }
      response.writeHead(200, { 'content-type': target.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8' });
      response.end(fs.readFileSync(target));
    });
    server.listen(0, '127.0.0.1', () => resolve({
      url: `http://127.0.0.1:${server.address().port}`,
      close: () => new Promise(done => server.close(done)),
    }));
  });
}

test('browser persists a full original-project journey and restores it', async t => {
  if (!fs.existsSync(CHROME)) return t.skip('Google Chrome is not installed');
  const { url, close } = await serveRoot();
  t.after(close);
  const dom = await dumpDom(`${url}/tools/tests/fixtures/founder-workbench-browser-smoke.html`, makeProfile());
  assert.match(dom, /data-status="pass"/u);
  const result = JSON.parse(dom.match(/<pre[^>]*id="result"[^>]*>([^<]+)<\/pre>/u)[1]);
  assert.equal(result.project_name, '大番茄饭');
  assert.equal(result.attempts, 2);
  assert.equal(result.restored_after_reopen, true);
  assert.equal(result.export_digest_valid, true);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tools/tests/founder-research-workbench-browser.test.mjs`

Expected: FAIL because the browser fixture does not exist.

- [ ] **Step 3: Implement the fixture journey using public interfaces**

The fixture must create the original seed, save it, create/execute/review attempt 1, create attempt 2 from attempt 1, close and reopen the IndexedDB connection, verify both attempts, export, validate digest, then mark `data-status="pass"`. It must not call private storage helpers.

- [ ] **Step 4: Add rendered page and mobile geometry checks**

Add a local-only `?browser-smoke=empty` mode guarded by `location.hostname === '127.0.0.1'` that renders the actual home with deterministic in-memory data and writes measured `document.documentElement.scrollWidth`/`clientWidth` plus primary button bounding rectangle to `#smoke-result`. Assert no horizontal overflow at `--window-size=390,844` and primary controls are at least 44px high.

- [ ] **Step 5: Run browser and all workbench tests**

Run: `node --test tools/tests/founder-research-workbench-*.test.mjs`

Expected: PASS; Chrome tests may skip only when the fixed Chrome binary is absent.

- [ ] **Step 6: Commit**

```bash
git add tools/tests/fixtures/founder-workbench-browser-smoke.html tools/tests/founder-research-workbench-browser.test.mjs lab/app.js lab/styles.css lab/views.js
git commit -m "test: verify founder workbench in a real browser"
```

### Task 11: 产品边界文档、完整回归和人工验收

**Files:**
- Modify: `docs/PRODUCT_PRINCIPLES.md`
- Modify: `docs/superpowers/progress/2026-08-13-yiguochu-program-status.md`
- Modify: `部署说明.md`

**Interfaces:**
- Consumes: completed workbench and build/test commands.
- Produces: current product boundary, preview command and evidence-backed completion record.

- [ ] **Step 1: Update product principle without rewriting historical numbers**

Add a dated section stating:

```markdown
## 2026-08-29 当前内部工具：创业研发工作台

现阶段“一锅出”新增的产品交付物是创始人自用的研发与内容工作台。它只在 research/calibration Preview 中出现；923 条来源记录继续是事实底座，工作台的本机试做不能自动授予 Planner、厨房验证或 production 权限。默认 runtime 产品边界和菜谱闸门保持不变。
```

- [ ] **Step 2: Document exact build and local verification commands**

```bash
node tools/build-dist.mjs --out-dir dist/research --build-id founder-lab-local --artifact-scope research
python3 -m http.server 8080 --directory dist/research
```

Document `/lab/` as the internal entry and state that deployment remains `recipe-validation` Preview only; do not add a `main` deployment command.

- [ ] **Step 3: Run the workbench, build and product gates**

Run:

```bash
node --test tools/tests/founder-research-workbench-*.test.mjs
node --test tools/tests/build-dist.test.mjs tools/tests/service-worker.test.mjs tools/tests/source-backed-shelf-page.test.mjs tools/tests/source-execution-cook-mode.test.mjs
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
git diff --check
```

Expected: every command exits 0; recipe counts remain 923 source records and 72 formal Planner records; no test claims runtime eligibility or kitchen observation that is not present.

- [ ] **Step 4: Build all scopes and audit artifacts**

```bash
node tools/build-dist.mjs --out-dir dist/runtime-audit --build-id founder-runtime-audit --artifact-scope runtime
node tools/build-dist.mjs --out-dir dist/research-audit --build-id founder-research-audit --artifact-scope research
node tools/build-dist.mjs --out-dir dist/calibration-audit --build-id founder-calibration-audit --artifact-scope calibration
test ! -e dist/runtime-audit/lab/index.html
test -e dist/research-audit/lab/index.html
test -e dist/calibration-audit/lab/index.html
```

Expected: all commands exit 0.

- [ ] **Step 5: Perform manual mobile acceptance**

Open the research build at `/lab/` and verify these exact journeys without devtools edits:

1. Create the seeded “大番茄饭” original project and confirm there are no prefilled grams, liquid or nutrition results.
2. Add equipment, complete a planned attempt, record actual deviations, review it and copy both Markdown cards.
3. Create attempt 2, compare changes, refresh and confirm both attempts remain.
4. Create a source adaptation from `/source-recipes/` and confirm source/planned/actual values are separately labeled.
5. Export, use a clean browser profile, import, inspect conflict preview and restore the project.
6. At 390×844, confirm no horizontal scrolling and the active cooking controls remain reachable.

- [ ] **Step 6: Commit documentation and verified status**

```bash
git add docs/PRODUCT_PRINCIPLES.md docs/superpowers/progress/2026-08-13-yiguochu-program-status.md 部署说明.md
git commit -m "docs: hand off founder research workbench"
```

- [ ] **Step 7: Final completion audit**

Compare all 12 acceptance items in `docs/superpowers/specs/2026-08-29-founder-research-workbench-design.md` against current files, test output, three built artifact trees and the manual mobile journey. Record any unmet item as incomplete and continue implementation; do not describe the feature as complete until all 12 have direct evidence.

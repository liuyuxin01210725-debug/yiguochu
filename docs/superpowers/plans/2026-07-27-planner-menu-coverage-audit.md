# Planner Menu Coverage Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic, offline audit that measures how the current Planner V2 handles the exact core ingredients of all 72 production recipes, without changing product behavior or shipping audit assets.

**Architecture:** A pure builder reads the six existing source catalogs, normalizes each recipe through the exported Planner taxonomy function, runs raw-core and recognized-only pantry scenarios through the exported Planner functions, and emits a validated report. A separate renderer creates canonical JSON and Markdown; a small CLI owns fixed-path loading and freshness checks. The aggregate recipe gate verifies the artifacts, while distribution tests prove they remain excluded from `dist/`.

**Tech Stack:** Node.js ESM, built-in `node:test`, existing Planner V2 pure functions, SHA-256 from `node:crypto`, existing JSON catalogs and repository build gates.

## Global Constraints

- Keep the production recipe library at exactly 72 recipes: 12 `approved` and 60 `auto_approved`.
- Keep the template catalog at exactly 10 active and 6 planned templates; do not modify template, taxonomy, Ratio DSL, Planner, Worker, proxy, or frontend behavior.
- The audit must call `normalizePlannerItems`, `buildPotCandidates`, and `planMeal` from `worker/src/planner-v2.js`; it must not duplicate Planner semantics.
- Recipe is evidence only. Template rules + ingredient taxonomy + Ratio DSL decide planning compatibility.
- Run every scenario as `mode:'pantry'`, `intent:'normal'`, `servings:2`; make zero HTTP, DeepSeek, KV, random, or clock-dependent calls.
- Preserve raw `core_ingredients` exactly; unknown identities must remain visible.
- Do not include the audit source or generated artifacts in `dist/`.
- Keep PR #1 Draft/Open; do not deploy Preview or production and do not merge.

---

## File Structure

- Create `tools/lib/planner-menu-coverage-builder.mjs`: pure normalization, scenario execution, status derivation, aggregation, and report validation.
- Create `tools/lib/planner-menu-coverage-renderer.mjs`: deterministic JSON and Markdown rendering only.
- Create `tools/build-planner-menu-coverage.mjs`: fixed-source loading, source validation, SHA-256 calculation, `--write|--check`, and concise summary.
- Create `tools/tests/planner-menu-coverage-builder.test.mjs`: unit and real-library behavioral tests.
- Create `tools/tests/planner-menu-coverage-artifacts.test.mjs`: renderer, CLI freshness, gate integration, and distribution exclusion tests.
- Create `tools/generated/planner-menu-coverage.v1.json`: generated machine report.
- Create `docs/planner-menu-coverage.md`: generated human report.
- Modify `tools/check-recipes.mjs`: include coverage audit input validation and artifact freshness.
- Modify `tools/tests/build-dist.test.mjs`: explicitly reject audit artifacts and sentinels from canonical builds.

## Shared Interfaces

```js
// tools/lib/planner-menu-coverage-builder.mjs
export function buildPlannerMenuCoverage(inputs)
// inputs: { recipeLibrary, taxonomy, templates, ratios, mappings, baseline, sourceHashes }
// returns: PlannerMenuCoverageReport

export function buildRecipeCoverageEntry(recipe, context)
// context: { plannerAssets, mappingByRecipeId }
// returns: PlannerMenuCoverageRecipeEntry

export function validatePlannerMenuCoverage(report, inputs)
// returns: string[]

export function formatPlannerMenuCoverageSummary(report)
// returns: string

// tools/lib/planner-menu-coverage-renderer.mjs
export function renderPlannerMenuCoverageJson(report)
export function renderPlannerMenuCoverageMarkdown(report)
export function buildPlannerMenuCoverageArtifacts(report)
// returns Map<string,string>

// tools/build-planner-menu-coverage.mjs
export function buildPlannerMenuCoverageFromFixedInputs()
// returns { report, artifacts }
```

The normalized Planner request passed to `buildPotCandidates` and `planMeal` is:

```js
{
  mode: 'pantry', intent: 'normal', servings: 2,
  must_use: rawItems, prefer_use: [], dislikes: [],
  current_plan_id: null, recent_plan_ids: [], decision: null,
}
```

---

### Task 1: Pure per-recipe audit semantics

**Files:**
- Create: `tools/lib/planner-menu-coverage-builder.mjs`
- Create: `tools/tests/planner-menu-coverage-builder.test.mjs`

**Interfaces:**
- Consumes: existing `normalizePlannerItems(rawItems, taxonomy)`, `buildPotCandidates(assets, request)`, and `planMeal(assets, request)`.
- Produces: `buildRecipeCoverageEntry(recipe, context)` and `validatePlannerMenuCoverage(report, inputs)` for later tasks.

- [ ] **Step 1: Write failing tests for ingredient partitioning and de-duplicated ratios**

```js
test('keeps source order while partitioning planner, basic, and unknown identities', () => {
  const entry = buildRecipeCoverageEntry({
    id:'sample', name:'样例', status:'auto_approved',
    core_ingredients:['牛里脊', '水', '陌生菜', '牛肉片'],
  }, fixtureContext());
  assert.deepEqual(entry.raw_core_items, ['牛里脊', '水', '陌生菜', '牛肉片']);
  assert.deepEqual(entry.recognized_basic_items.map(row => row.raw), ['水']);
  assert.deepEqual(entry.unclassified_core_items.map(row => row.raw), ['陌生菜']);
  assert.equal(entry.planner_eligible_items.filter(row => row.duplicate_of === null).length, 1);
  assert.equal(entry.identity_recognition_ratio, 1 / 2);
});
```

Use a minimal fixture taxonomy containing beef aliases, water, raw rice, egg, and cabbage, plus one valid active template and Ratio DSL rule.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tools/tests/planner-menu-coverage-builder.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `planner-menu-coverage-builder.mjs`.

- [ ] **Step 3: Implement controlled partition helpers**

Implement these private helpers in the builder:

```js
const BASIC_CATEGORIES = new Set(['liquid', 'oil', 'seasoning']);
const uniquePromiseItems = items => items.filter(item => item.duplicate_of === null);
const ratioOrNull = (numerator, denominator) => denominator === 0 ? null : numerator / denominator;

function partitionCoreItems(rawCoreItems, taxonomy) {
  const normalized = normalizePlannerItems(
    rawCoreItems.map(raw => ({ raw, role:'must_use' })), taxonomy,
  );
  return {
    normalized,
    plannerEligible: normalized.filter(row => row.recognized && !BASIC_CATEGORIES.has(row.category)),
    basics: normalized.filter(row => row.recognized && BASIC_CATEGORIES.has(row.category)),
    unknown: normalized.filter(row => !row.recognized),
  };
}
```

Preserve all normalized fields in output rows. Use only representative rows (`duplicate_of === null`) for ratio denominators and planner requests.

- [ ] **Step 4: Add failing tests for the two independent Planner scenarios**

```js
test('raw scenario keeps unknown items while recognized scenario isolates template capacity', () => {
  const entry = buildRecipeCoverageEntry(sampleWith(['熟米饭','白菜','鸡蛋','陌生菜']), realContext());
  assert.deepEqual(entry.raw_core_scenario.submitted_raw_items, ['熟米饭','白菜','鸡蛋','陌生菜']);
  assert.deepEqual(entry.recognized_only_scenario.submitted_raw_items, ['熟米饭','白菜','鸡蛋']);
  assert.equal(entry.raw_core_scenario.status, 'needs_user_decision');
  assert.equal(entry.recognized_only_scenario.status, 'complete');
});
```

- [ ] **Step 5: Run the scenario tests and verify RED**

Run: `node --test tools/tests/planner-menu-coverage-builder.test.mjs`

Expected: FAIL because scenario fields and status derivation are absent.

- [ ] **Step 6: Implement scenario execution, evidence alignment, and status precedence**

Add private functions:

```js
function runCoverageScenario(plannerAssets, rawItems) { /* calls both exported Planner functions */ }
function evidenceAlignment(selectedTemplateIds, recipeId, templates) { /* direct IDs only */ }
function deriveAuditStatus(entry) { /* exact spec precedence */ }
```

`runCoverageScenario` records candidate template IDs, selected template IDs, planned/unplanned items, reason codes, pot count, `plan_kind`, and compiled ratio plans from the returned pots. Status precedence must be:

```text
invalid_source_record > no_recognized_core > taxonomy_gap > planner_gap >
full_multi_pot > full_single_pot_evidence_aligned >
full_single_pot_ingredient_compatible
```

Multi-pot never counts as recipe reproduction. Direct evidence is true only when every selected pot template that claims alignment actually lists the current recipe ID; an ingredient-compatible template remains separately labeled.

- [ ] **Step 7: Run Task 1 tests and verify GREEN**

Run: `node --test tools/tests/planner-menu-coverage-builder.test.mjs`

Expected: PASS for partitioning, deduplication, scenarios, evidence, and status precedence.

- [ ] **Step 8: Commit Task 1**

```bash
git add tools/lib/planner-menu-coverage-builder.mjs tools/tests/planner-menu-coverage-builder.test.mjs
git commit -m "test: define planner menu coverage semantics"
```

---

### Task 2: Build and validate the complete 72-recipe report

**Files:**
- Modify: `tools/lib/planner-menu-coverage-builder.mjs`
- Modify: `tools/tests/planner-menu-coverage-builder.test.mjs`

**Interfaces:**
- Consumes: `buildRecipeCoverageEntry` from Task 1 and the six validated source catalogs.
- Produces: `buildPlannerMenuCoverage`, `validatePlannerMenuCoverage`, and `formatPlannerMenuCoverageSummary`.

- [ ] **Step 1: Write failing real-library anchor tests**

```js
test('audits exactly the locked 72 recipes and preserves current safety boundaries', () => {
  const report = buildRealReport();
  assert.equal(report.recipes.length, 72);
  assert.equal(new Set(report.recipes.map(row => row.recipe_id)).size, 72);
  const soupRice = byId(report, 'cabbage-egg-soup-rice');
  assert.deepEqual(soupRice.raw_core_items, ['熟米饭','白菜','鸡蛋']);
  assert.equal(soupRice.recognized_only_scenario.selected_template_ids.includes('broth-rice-pot'), true);
  assert.equal(soupRice.evidence_alignment.direct_template_evidence, true);

  const tomatoChicken = byId(report, 'tomato-chicken-leg-soup-rice');
  assert.deepEqual(tomatoChicken.raw_core_items, ['熟米饭','鸡腿肉','番茄']);
  assert.equal(tomatoChicken.raw_core_items.includes('土豆'), false);

  const ribs = byId(report, 'green-bean-pork-rib-braised-rice');
  assert.equal(ribs.planner_eligible_items.find(row => row.raw === '猪肋排').shape_or_cut, 'rib');
  assert.equal(ribs.recognized_only_scenario.selected_template_ids.includes('savory-mixed-rice-pot'), false);

  const noodles = byId(report, 'north-china-green-bean-braised-noodles');
  assert.equal(noodles.audit_status, 'taxonomy_gap');
  assert.equal(noodles.unclassified_core_items.some(row => row.raw === '鲜小麦面条'), true);
});
```

- [ ] **Step 2: Run anchors and verify RED**

Run: `node --test tools/tests/planner-menu-coverage-builder.test.mjs`

Expected: FAIL because report-level building and summaries do not exist.

- [ ] **Step 3: Implement report metadata, stable hashes, aggregates, and validation**

Return this top-level shape:

```js
{
  schema_version: 1,
  planner_version: PLANNER_VERSION,
  template_catalog_version: templates.template_catalog_version,
  taxonomy_version: taxonomy.taxonomy_version,
  ratio_catalog_version: ratios.ratio_catalog_version,
  source_hashes: Object.fromEntries(Object.entries(sourceHashes).sort()),
  summary: {
    recipe_count, approved_count, auto_approved_count,
    status_counts, priority_counts,
  },
  by_region, by_technique_family, by_template, unclassified_items,
  recipes,
}
```

Use recipe-library order for `recipes`; use explicit stable sorts for every aggregate. Validator recomputes counts and ratios, verifies the baseline ID/status order, rejects unknown mappings/templates, and verifies direct evidence against the template catalog.

- [ ] **Step 4: Add mutation tests for every fatal invariant**

Tests must mutate a valid report and assert structured errors for:

```text
71 recipes; duplicate recipe ID; changed baseline status; unknown template;
wrong ratio; single_pot with 2 pots; fake direct evidence; unknown technique family;
generated steps/model dish name/network data fields.
```

- [ ] **Step 5: Run Task 2 tests and verify GREEN**

Run: `node --test tools/tests/planner-menu-coverage-builder.test.mjs`

Expected: PASS, including the four real recipe anchors and byte-stable repeated builds.

- [ ] **Step 6: Commit Task 2**

```bash
git add tools/lib/planner-menu-coverage-builder.mjs tools/tests/planner-menu-coverage-builder.test.mjs
git commit -m "feat: audit planner coverage for production menus"
```

---

### Task 3: Deterministic renderer, CLI, and checked-in artifacts

**Files:**
- Create: `tools/lib/planner-menu-coverage-renderer.mjs`
- Create: `tools/build-planner-menu-coverage.mjs`
- Create: `tools/tests/planner-menu-coverage-artifacts.test.mjs`
- Create: `tools/generated/planner-menu-coverage.v1.json`
- Create: `docs/planner-menu-coverage.md`

**Interfaces:**
- Consumes: `buildPlannerMenuCoverage`, `validatePlannerMenuCoverage`, and summary formatter.
- Produces: deterministic artifacts and `buildPlannerMenuCoverageFromFixedInputs()`.

- [ ] **Step 1: Write failing renderer and CLI contract tests**

```js
test('markdown states the evidence boundary and lists P0-P2 facts', () => {
  const markdown = renderPlannerMenuCoverageMarkdown(sampleReport);
  assert.match(markdown, /Planner 覆盖审计不等于菜谱复刻、口味验证或人工试做批准/);
  assert.match(markdown, /P0\/P1\/P2/);
  assert.doesNotMatch(markdown, /建议激活/);
});

test('CLI only accepts --write or --check', () => {
  const result = spawnSync(process.execPath, [BUILD], { encoding:'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /--write\|--check/);
});
```

- [ ] **Step 2: Run artifact tests and verify RED**

Run: `node --test tools/tests/planner-menu-coverage-artifacts.test.mjs`

Expected: FAIL with missing renderer/CLI modules.

- [ ] **Step 3: Implement deterministic rendering and fixed-input CLI**

`buildPlannerMenuCoverageArtifacts(report)` returns exactly:

```js
new Map([
  ['tools/generated/planner-menu-coverage.v1.json', `${JSON.stringify(report, null, 2)}\n`],
  ['docs/planner-menu-coverage.md', renderPlannerMenuCoverageMarkdown(report)],
]);
```

The CLI validates every source using existing validators before building. Compute each source hash with:

```js
createHash('sha256').update(rawUtf8).digest('hex')
```

`--write` creates both files; `--check` byte-compares both files and exits 1 with `Missing or stale: <path>` for drift. No timestamp, absolute path, commit ID, or random value enters output.

- [ ] **Step 4: Run the generator intentionally and inspect the actual report**

Run: `node tools/build-planner-menu-coverage.mjs --write`

Expected: success summary mentioning `72 recipes`, followed by two new generated files. Inspect every P0/P1/P2 row for coherent raw ingredients, reason codes, and selected templates before accepting the snapshot.

- [ ] **Step 5: Add and run freshness/determinism tests**

Tests run `--check`, build twice in memory, and assert byte equality. They also create a temporary repository copy, mutate one source recipe core ingredient, and assert `--check` fails without rewriting checked-in artifacts.

Run: `node --test tools/tests/planner-menu-coverage-artifacts.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```bash
git add tools/lib/planner-menu-coverage-renderer.mjs tools/build-planner-menu-coverage.mjs \
  tools/tests/planner-menu-coverage-artifacts.test.mjs \
  tools/generated/planner-menu-coverage.v1.json docs/planner-menu-coverage.md
git commit -m "docs: generate planner menu coverage report"
```

---

### Task 4: Aggregate gate and canonical-build exclusion

**Files:**
- Modify: `tools/check-recipes.mjs`
- Modify: `tools/tests/planner-menu-coverage-artifacts.test.mjs`
- Modify: `tools/tests/build-dist.test.mjs`

**Interfaces:**
- Consumes: fixed-input builder and artifact map from Task 3.
- Produces: aggregate gate output `planner menu coverage ok: ...` and an explicit no-leak invariant.

- [ ] **Step 1: Write failing aggregate gate test**

```js
test('aggregate recipe gate verifies planner menu coverage freshness', () => {
  const result = spawnSync(process.execPath, [CHECK_RECIPES], { cwd:ROOT, encoding:'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /planner menu coverage ok/);
  assert.match(result.stdout, /72 recipes/);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test --test-name-pattern='aggregate recipe gate' tools/tests/planner-menu-coverage-artifacts.test.mjs`

Expected: FAIL because `check-recipes.mjs` does not report the audit.

- [ ] **Step 3: Integrate builder validation and artifact freshness into `check-recipes.mjs`**

Import builder/renderer functions, reuse the already-loaded recipe/taxonomy/template/ratio/mapping/baseline objects, compute canonical report, validate it, byte-compare both artifacts, and append errors to the existing aggregate `errors` array. Emit the success line only when source validation and audit validation both pass.

- [ ] **Step 4: Write the failing build-exclusion test**

Extend the existing research-only leakage test with these forbidden basenames/sentinels:

```js
'planner-menu-coverage.v1.json',
'planner-menu-coverage.md',
'planner-menu-coverage-builder',
'Planner 覆盖审计不等于菜谱复刻'
```

- [ ] **Step 5: Run focused gate and build tests**

Run:

```bash
node --test tools/tests/planner-menu-coverage-artifacts.test.mjs
node --test --test-name-pattern='distribution build|excludes' tools/tests/build-dist.test.mjs
```

Expected: PASS without changing `tools/build-dist.mjs` or its 22-file canonical manifest. If the exclusion test fails, remove the leak source instead of adding audit files to the allowlist.

- [ ] **Step 6: Commit Task 4**

```bash
git add tools/check-recipes.mjs tools/tests/planner-menu-coverage-artifacts.test.mjs tools/tests/build-dist.test.mjs
git commit -m "test: gate planner menu coverage artifacts"
```

---

### Task 5: Full verification and Draft PR handoff

**Files:**
- Modify only if verification exposes a defect in Task 1-4 files.

**Interfaces:**
- Consumes: all audit implementation and existing project gates.
- Produces: verified Draft PR changes; no deploy and no merge.

- [ ] **Step 1: Run all Node tests**

Run: `node --test tools/tests/*.test.mjs`

Expected: exit 0 with no skipped audit test.

- [ ] **Step 2: Run authoritative repository gates**

Run:

```bash
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
python3 -m py_compile ai_proxy.py
```

Expected: recipe gate exit 0 including `planner menu coverage ok`; Planner journeys `68/68`; Python syntax exit 0.

- [ ] **Step 3: Run canonical build and verify byte scope**

Run:

```bash
rm -rf dist/coverage-audit-final
node tools/build-dist.mjs --out-dir dist/coverage-audit-final --build-id coverage-audit-final
find dist/coverage-audit-final -type f | sort
```

Expected: build reports 22 files; no planner coverage source, JSON, Markdown, or sentinel is present.

- [ ] **Step 4: Run final repository checks**

Run:

```bash
git diff --check
git status --short
gh pr view 1 --json state,isDraft,headRefName,url
```

Expected: no whitespace errors; only intended files changed; PR #1 remains `OPEN`, `isDraft:true`, on `codex/targeted-recipe-expansion`.

- [ ] **Step 5: Commit any verification-only correction, then push**

```bash
git add <only-the-corrected-audit-files>
git commit -m "fix: harden planner menu coverage audit"
git push origin codex/targeted-recipe-expansion
```

Skip the correction commit when no correction was needed; push the completed Task 1-4 commits. Do not run Wrangler, do not deploy, do not merge, and do not mark the PR Ready.

- [ ] **Step 6: Use the generated facts for the next design decision**

Read P0/P1/P2 rows from `docs/planner-menu-coverage.md`, group by repeated taxonomy identity, technique family, and missing single-pot capability, and present the highest-frequency evidence to the user. Do not modify Planner assets in this task; the next regional capability requires a separate approved design.

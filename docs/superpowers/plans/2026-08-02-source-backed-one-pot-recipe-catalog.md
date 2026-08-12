# Source-Backed One-Pot Recipe Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single, machine-validated catalog of real, source-backed savory rice one-pot recipes, audit every current rice-meal entry, and generate a human-reviewable master table before any new user interface work.

**Architecture:** A new hand-reviewed JSON catalog is the only authority for source-backed recipe identity and executable facts. A focused validator rejects self-citations, unsupported names, incomplete claim scopes, and premature public status; a deterministic renderer produces Markdown/CSV review artifacts. Existing planner, selector, template, DeepSeek, and public-page code remain frozen during this plan.

**Tech Stack:** Node.js ESM, JSON data assets, `node:test`, existing taxonomy/Ratio DSL assets, deterministic Markdown/CSV generation, Git.

## Global Constraints

- First-stage scope is savory rice main meals only; exclude noodles, ordinary stews, porridge, soup rice, cooked-rice stir-fries, assembled rice dishes, and sweets.
- A public recipe name must be supported by an independent external source; `yiguochu.pages.dev`, repository documents, and project-generated pages cannot support identity.
- Social media, RecipeDB, aggregators, and search-result snippets are discovery inputs only, never the sole executable source.
- Extract facts and high-level technique only; do not copy complete third-party steps, images, video, or page layout.
- Do not invent a regional name, mechanically concatenate ingredient names, or add a major ingredient merely to improve nutrition grade.
- Each source must declare exact claim scopes from `identity`, `ingredients`, `quantity`, `liquid`, `process`, `appliance`, `time`, and `safety`.
- A recipe may be public only when fixed batch, liquid, process, time, safety, allergens, and A/B nutrition structure are complete and machine-valid.
- All networking must use the `web-access` skill and prioritize first-party sources.
- This plan changes content assets and validation only. It does not modify `index.html`, Worker routes, Planner, templates, DeepSeek behavior, recipe count, production deployment, or public UI.
- Do not modify or stage `.superpowers/research/`.
- Every production change follows red-green-refactor TDD and ends in its own commit.
- Keep Draft PR #1 open and Draft. Do not deploy Preview or production during this catalog phase.

---

## File Map

**Create**

- `tools/data/source-backed-one-pot-recipes.v1.json` — authoritative candidate and executable-recipe catalog.
- `tools/data/source-backed-catalog-migration.v1.json` — disposition of every current rice-meal variant, including excluded project-original combinations.
- `tools/lib/source-backed-one-pot-catalog-validator.mjs` — pure schema, provenance, status, and claim-scope validator.
- `tools/lib/source-backed-one-pot-catalog-renderer.mjs` — pure Markdown/CSV artifact renderer.
- `tools/check-source-backed-one-pot-catalog.mjs` — CLI validation and artifact-freshness gate.
- `tools/build-source-backed-one-pot-catalog.mjs` — deterministic artifact writer/checker.
- `tools/tests/source-backed-one-pot-catalog-validator.test.mjs` — validator behavior tests.
- `tools/tests/source-backed-one-pot-catalog-data.test.mjs` — real-data and migration-accounting tests.
- `tools/tests/source-backed-one-pot-catalog-renderer.test.mjs` — generated artifact tests.
- `tools/tests/source-backed-one-pot-catalog-gate.test.mjs` — aggregate-gate integration tests.
- `docs/source-backed-one-pot-recipes.md` — human-readable master catalog.
- `docs/source-backed-one-pot-recipes.csv` — spreadsheet-friendly master catalog.
- `docs/source-backed-one-pot-recipe-gaps.md` — deterministic missing-fact and regional-blank report.

**Modify**

- `tools/check-recipes.mjs` — invoke the new catalog validator and freshness gate.
- `docs/rice-meal-regional-research.md` — point readers to the new catalog as the current source-backed authority and label older runtime counts as historical.
- `docs/PRODUCT_PRINCIPLES.md` — replace the ingredient-selection product boundary with catalog-first freeze language.

**Read but do not modify in this plan**

- `tools/data/rice-meal-catalog.v1.json`
- `tools/data/rice-meal-collection.v1.json`
- `tools/data/rice-cooker-source-evidence.v1.json`
- `tools/data/ingredient-taxonomy.v1.json`
- `tools/data/ratio-rules.v1.json`
- `index.html`
- `worker/src/worker.js`

---

### Task 1: Add the provenance-first catalog validator

**Files:**
- Create: `tools/lib/source-backed-one-pot-catalog-validator.mjs`
- Create: `tools/tests/source-backed-one-pot-catalog-validator.test.mjs`

**Interfaces:**
- Produces: `validateSourceBackedOnePotCatalog(catalog, options?) => string[]`
- Produces: `PUBLIC_SOURCE_BACKED_STATUSES: ReadonlySet<string>` containing `preview_ready`, `kitchen_observed`, `production_approved`
- Consumes later: Tasks 2, 3, 6, and 7 import the validator directly.

- [ ] **Step 1: Write a failing minimal-valid-catalog test**

Create a fixture factory in the test file. The valid fixture must contain one `identity_verified` Shanghai recipe with a non-project HTTPS government source, explicit `claim_scopes`, A nutrition structure, and no executable batch.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSourceBackedOnePotCatalog,
} from '../lib/source-backed-one-pot-catalog-validator.mjs';

const validCatalog = () => ({
  schema_version: 1,
  catalog_version: 'source-backed-one-pot-v1-test',
  scope: 'savory-rice-main-meal',
  reviewed_regions: ['CN-SH'],
  regional_blanks: [],
  recipes: [{
    recipe_id: 'shanghai-salted-pork-rice',
    canonical_name: '上海咸肉菜饭',
    aliases: [],
    region_codes: ['CN-SH'],
    cuisine_family: 'jiangnan-vegetable-rice',
    identity_status: 'verified',
    traditional_vessels: ['铁锅'],
    core_ingredients: ['米', '青菜', '咸肉'],
    fixed_batch: null,
    liquid_contract: null,
    cooking_sequence: [],
    time_contract: null,
    safety_endpoints: [],
    allergen_labels: [],
    nutrition_structure: { grade: 'A', roles: ['carbohydrate', 'protein', 'fiber'] },
    cooker_adaptation: { status: 'not_assessed', notes: '' },
    source_refs: [{
      source_id: 'shanghai-fengxian-salted-pork-rice',
      title: '大雪节气村民做咸肉菜饭',
      publisher: '上海市奉贤区人民政府',
      url: 'https://www.fengxian.gov.cn/example.html',
      retrieved_at: '2026-08-02',
      source_kind: 'government',
      claim_scopes: ['identity', 'ingredients', 'process'],
      attribution: '上海市奉贤区人民政府',
      license: 'facts-only-review',
    }],
    status: 'identity_verified',
    evidence_notes: '来源只支持身份、核心食材和高层流程。',
  }],
});

test('accepts an identity-verified recipe without pretending it is executable', () => {
  assert.deepEqual(validateSourceBackedOnePotCatalog(validCatalog()), []);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --test tools/tests/source-backed-one-pot-catalog-validator.test.mjs
```

Expected: FAIL because `source-backed-one-pot-catalog-validator.mjs` does not exist.

- [ ] **Step 3: Implement root, recipe, and source schema validation**

Implement exact allowed values:

```js
const STATUSES = new Set([
  'discovered',
  'identity_verified',
  'recipe_fact_checked',
  'executable',
  'preview_ready',
  'kitchen_observed',
  'production_approved',
]);
const CLAIM_SCOPES = new Set([
  'identity', 'ingredients', 'quantity', 'liquid',
  'process', 'appliance', 'time', 'safety',
]);
export const PUBLIC_SOURCE_BACKED_STATUSES = new Set([
  'preview_ready', 'kitchen_observed', 'production_approved',
]);
```

The validator must return errors rather than throw. Validate unique kebab-case `recipe_id`, unique `canonical_name + region_codes`, HTTPS sources, nonempty publisher/title/retrieval/license/attribution, valid claim scopes, and root `scope === 'savory-rice-main-meal'`.

- [ ] **Step 4: Add failing provenance and status tests**

Add separate tests asserting rejection of:

```js
test('rejects project self-citations', () => { /* yiguochu.pages.dev source */ });
test('rejects a public recipe without identity support', () => { /* preview_ready + no identity claim */ });
test('rejects a public recipe without fixed batch and liquid contract', () => { /* preview_ready + null contracts */ });
test('rejects unsupported claim scopes', () => { /* claim_scopes:['taste_is_good'] */ });
test('rejects C-grade public recommendations', () => { /* preview_ready + grade C */ });
test('rejects an invented adaptation presented as the canonical regional name', () => {
  /* cooker_adaptation.status:'adapted', adapted_name equals canonical_name */
});
```

For each test, name the production change that would make it fail: removing the matching validator branch.

- [ ] **Step 5: Run the expanded test and verify RED**

Run the same `node --test` command. Expected: the new rejection tests fail because the branches are absent.

- [ ] **Step 6: Implement provenance and promotion gates**

For `preview_ready` or higher require:

```js
const requiredExecutableScopes = ['identity', 'ingredients', 'quantity', 'liquid', 'process', 'time'];
const requiredExecutableFields = [
  'fixed_batch', 'liquid_contract', 'cooking_sequence',
  'time_contract', 'safety_endpoints', 'allergen_labels',
];
```

Require `appliance` scope when the user-facing version claims an electric cooker or named appliance. Require `safety` scope for raw poultry, raw pork, raw beef, raw lamb, seafood, eggs, beans, wild mushrooms, and live shellfish; a general food-safety endpoint may come from an authoritative safety source rather than the identity source.

- [ ] **Step 7: Run validator tests and verify GREEN**

Run:

```bash
node --test tools/tests/source-backed-one-pot-catalog-validator.test.mjs
```

Expected: all tests PASS with no warnings.

- [ ] **Step 8: Commit Task 1**

```bash
git add tools/lib/source-backed-one-pot-catalog-validator.mjs tools/tests/source-backed-one-pot-catalog-validator.test.mjs
git commit -m "feat: validate source-backed one-pot catalog"
```

---

### Task 2: Audit and classify every current rice-meal variant

**Files:**
- Create: `tools/data/source-backed-catalog-migration.v1.json`
- Create: `tools/data/source-backed-one-pot-recipes.v1.json`
- Create: `tools/tests/source-backed-one-pot-catalog-data.test.mjs`

**Interfaces:**
- Consumes: `validateSourceBackedOnePotCatalog()` from Task 1.
- Produces: `validateSourceBackedCatalogMigration(migration, legacyVariants) => string[]` from `tools/lib/source-backed-one-pot-catalog-validator.mjs`.
- Produces: `source-backed-one-pot-recipes.v1.json` as the only new source-backed recipe authority.
- Produces: migration rows shaped as `{ legacy_variant_id, legacy_display_name, disposition, target_recipe_id, reason }`.

- [ ] **Step 1: Write failing migration-accounting tests**

The test must read the existing `rice-meal-catalog.v1.json`, flatten all variants, and require exactly one migration row per legacy variant.

```js
test('accounts for every current rice-meal variant exactly once', () => {
  const legacyIds = flattenLegacyVariants().map(row => row.variant_id).sort();
  const migratedIds = migration.items.map(row => row.legacy_variant_id).sort();
  assert.deepEqual(migratedIds, legacyIds);
  assert.equal(new Set(migratedIds).size, migratedIds.length);
});

test('does not promote project-original combinations into the source-backed catalog', () => {
  const excluded = new Map(migration.items.map(row => [row.legacy_variant_id, row]));
  for (const id of [
    'home-broccoli-beef-rice',
    'home-cabbage-tofu-rice',
    'home-chicken-leg-potato-rice',
    'home-corn-carrot-chicken-leg-rice',
    'home-green-bean-pork-rib-rice',
    'home-mushroom-green-bean-pork-rib-rice',
  ]) {
    assert.equal(excluded.get(id)?.disposition, 'project_original_excluded');
    assert.equal(excluded.get(id)?.target_recipe_id, null);
  }
});

test('migration validator rejects missing and duplicate legacy variant rows', () => {
  const errors = validateSourceBackedCatalogMigration({
    schema_version: 1,
    migration_version: 'source-backed-migration-v1-test',
    items: [
      { legacy_variant_id: 'a', legacy_display_name: 'A', disposition: 'scope_excluded', target_recipe_id: null, reason: 'outside scope' },
      { legacy_variant_id: 'a', legacy_display_name: 'A', disposition: 'scope_excluded', target_recipe_id: null, reason: 'duplicate' },
    ],
  }, [{ variant_id: 'a' }, { variant_id: 'b' }]);
  assert.ok(errors.some(error => error.includes('duplicate legacy variant a')));
  assert.ok(errors.some(error => error.includes('missing legacy variant b')));
});
```

- [ ] **Step 2: Run the data test and verify RED**

Run:

```bash
node --test tools/tests/source-backed-one-pot-catalog-data.test.mjs
```

Expected: FAIL because both JSON files are missing.

- [ ] **Step 3: Create the migration ledger**

First implement `validateSourceBackedCatalogMigration()` in the Task 1 validator module. It must validate the exact six dispositions below, require one row per supplied legacy variant, reject duplicates and unknown legacy IDs, require nonempty reasons, require `target_recipe_id` for the three migrated dispositions and `duplicate_alias`, and require `target_recipe_id: null` for `project_original_excluded` and `scope_excluded`.

Classify every current variant into exactly one disposition:

- `source_backed_migrated` — independent external identity source exists; create `target_recipe_id`.
- `source_backed_research_only` — source exists but executable facts are incomplete; create `target_recipe_id` with non-public status.
- `manufacturer_recipe_migrated` — official manufacturer recipe/manual supports the formal recipe name and batch.
- `project_original_excluded` — project-created household combination or project self-citation; no target recipe.
- `scope_excluded` — not a savory rice main meal under this spec.
- `duplicate_alias` — same real recipe as another row; point to its target recipe.

Every `reason` must name the evidence boundary, not merely say “insufficient”.

- [ ] **Step 4: Create the initial source-backed catalog**

Migrate only facts already supported by current independent sources. Start every migrated row at its honest status; do not preserve `preview_ready` automatically. In particular:

- `上海咸肉菜饭` may migrate as source-backed identity, but only reaches executable if all fixed-batch facts are externally supported and claim-scoped.
- `高丽菜饭` and `南瓜饭` may migrate from the Taiwan agricultural source with exact supported scopes.
- official manufacturer recipes may migrate under their official displayed recipe names, with manufacturer/model limitations preserved.
- the six named project-original combinations remain only in the migration ledger and do not appear in `recipes`.

- [ ] **Step 5: Run data and validator tests and verify GREEN**

Run:

```bash
node --test \
  tools/tests/source-backed-one-pot-catalog-validator.test.mjs \
  tools/tests/source-backed-one-pot-catalog-data.test.mjs
```

Expected: PASS; the validator reports zero errors and every legacy variant is accounted for.

- [ ] **Step 6: Commit Task 2**

```bash
git add \
  tools/data/source-backed-catalog-migration.v1.json \
  tools/data/source-backed-one-pot-recipes.v1.json \
  tools/tests/source-backed-one-pot-catalog-data.test.mjs
git commit -m "data: audit existing one-pot recipe provenance"
```

---

### Task 3: Generate the master recipe, source, and gap tables

**Files:**
- Create: `tools/lib/source-backed-one-pot-catalog-renderer.mjs`
- Create: `tools/build-source-backed-one-pot-catalog.mjs`
- Create: `tools/check-source-backed-one-pot-catalog.mjs`
- Create: `tools/tests/source-backed-one-pot-catalog-renderer.test.mjs`
- Create: `docs/source-backed-one-pot-recipes.md`
- Create: `docs/source-backed-one-pot-recipes.csv`
- Create: `docs/source-backed-one-pot-recipe-gaps.md`

**Interfaces:**
- Produces: `buildSourceBackedOnePotArtifacts(catalog, migration) => Map<string,string>`.
- Produces: CLI modes `node tools/build-source-backed-one-pot-catalog.mjs --write|--check`.
- Produces: `node tools/check-source-backed-one-pot-catalog.mjs` exit 0 on valid/fresh assets, exit 1 otherwise.

- [ ] **Step 1: Write failing renderer tests**

Assert that Markdown contains visible columns for name, region, family, status, ingredients, supported claims, gaps, and direct source links. Assert CSV properly quotes commas and line breaks. Assert the gap report groups rows by missing claim scope and lists reviewed regional blanks.

```js
test('renders source scope and executable gaps without hiding them', () => {
  const artifacts = buildSourceBackedOnePotArtifacts(catalog, migration);
  const markdown = artifacts.get('docs/source-backed-one-pot-recipes.md');
  assert.match(markdown, /上海咸肉菜饭/u);
  assert.match(markdown, /identity.*ingredients.*process/u);
  assert.match(markdown, /缺 quantity、liquid、time/u);
  assert.match(markdown, /https:\/\//u);
});
```

- [ ] **Step 2: Run renderer tests and verify RED**

Run:

```bash
node --test tools/tests/source-backed-one-pot-catalog-renderer.test.mjs
```

Expected: FAIL because the renderer module does not exist.

- [ ] **Step 3: Implement deterministic rendering**

Sort recipes by `cuisine_family`, `region_codes.join(',')`, then `canonical_name`. Derive gaps from status requirements rather than hand-writing prose. Markdown source links must use source titles; CSV must include raw URL and semicolon-separated claim scopes.

The gap report must include these deterministic sections:

```text
1. Missing identity
2. Missing ingredients
3. Missing quantity
4. Missing liquid
5. Missing process
6. Missing appliance
7. Missing time
8. Missing safety
9. Regional blanks
10. Excluded project-original combinations
```

- [ ] **Step 4: Implement writer/checker CLIs**

Follow `tools/build-rice-meal-collection.mjs` conventions exactly: accept only one argument, write UTF-8 on `--write`, byte-compare on `--check`, and print stale paths before exit 1.

- [ ] **Step 5: Generate artifacts and verify GREEN**

Run:

```bash
node tools/build-source-backed-one-pot-catalog.mjs --write
node --test tools/tests/source-backed-one-pot-catalog-renderer.test.mjs
node tools/build-source-backed-one-pot-catalog.mjs --check
node tools/check-source-backed-one-pot-catalog.mjs
```

Expected: all commands exit 0; generated artifacts are byte-stable on a second `--write`.

- [ ] **Step 6: Commit Task 3**

```bash
git add \
  tools/lib/source-backed-one-pot-catalog-renderer.mjs \
  tools/build-source-backed-one-pot-catalog.mjs \
  tools/check-source-backed-one-pot-catalog.mjs \
  tools/tests/source-backed-one-pot-catalog-renderer.test.mjs \
  docs/source-backed-one-pot-recipes.md \
  docs/source-backed-one-pot-recipes.csv \
  docs/source-backed-one-pot-recipe-gaps.md
git commit -m "feat: render source-backed one-pot catalog"
```

---

### Task 4: Complete the eastern and southeastern regional source pass

**Files:**
- Modify: `tools/data/source-backed-one-pot-recipes.v1.json`
- Modify: `docs/source-backed-one-pot-recipes.md` (generated)
- Modify: `docs/source-backed-one-pot-recipes.csv` (generated)
- Modify: `docs/source-backed-one-pot-recipe-gaps.md` (generated)
- Test: `tools/tests/source-backed-one-pot-catalog-data.test.mjs`

**Interfaces:**
- Consumes: validator and artifact builder from Tasks 1–3.
- Produces: reviewed regions and candidates for Jiangnan, Minnan, Taiwan, and Lingnan families.

- [ ] **Step 1: Write failing regional-coverage tests**

Require the reviewed-region ledger to cover the named areas and require either at least one source-backed candidate or an explicit regional blank reason for each.

```js
test('records an evidence result or explicit blank for every eastern research node', () => {
  for (const code of ['CN-SH', 'CN-JS', 'CN-ZJ', 'CN-FJ', 'CN-GD', 'TW']) {
    assert.ok(hasRecipeFor(code) || hasRegionalBlankFor(code), code);
  }
});
```

- [ ] **Step 2: Run the data test and verify RED**

Run the single data test. Expected: FAIL listing regions not yet marked reviewed.

- [ ] **Step 3: Perform first-party source research**

Load and follow `web-access`. Start from the existing direct-source seeds in `docs/rice-meal-regional-research.md`, then verify the live original page or official document. Cover these families:

- 江南：上海咸肉菜饭、上海蚕豆菜饭、吴江香青菜咸肉饭、南京矮脚黄菜饭、温州芥菜饭；
- 闽南：泉州萝卜饭、闽南咸饭/芥菜饭、芋头饭、壶仔饭、红蟳饭；
- 台湾：高丽菜饭、香菇笋仔饭、油饭、筒仔米糕；
- 岭南：腊味煲仔饭、冬菇滑鸡饭、豉汁排骨饭、蛤蒌饭、鸭仔饭。

For every candidate, open the original source and record only supported claim scopes. If a page is unavailable, preserve its candidate row as `discovered` and write an explicit access/evidence gap; do not promote from a search snippet.

- [ ] **Step 4: Normalize facts without inventing a household recipe**

Use the exact source-backed canonical name. Populate only source-supported ingredients and sequence facts. Keep traditional vessel and cooker adaptation separate. Mark aliases and shared family relations without creating extra recipes for minor ingredient substitutions.

- [ ] **Step 5: Rebuild and verify the eastern pass**

Run:

```bash
node tools/build-source-backed-one-pot-catalog.mjs --write
node tools/check-source-backed-one-pot-catalog.mjs
node --test tools/tests/source-backed-one-pot-catalog-data.test.mjs
```

Expected: PASS; every named research node has a candidate or explicit blank, and no incomplete row is public.

- [ ] **Step 6: Commit Task 4**

```bash
git add tools/data/source-backed-one-pot-recipes.v1.json docs/source-backed-one-pot-recipes.md docs/source-backed-one-pot-recipes.csv docs/source-backed-one-pot-recipe-gaps.md tools/tests/source-backed-one-pot-catalog-data.test.mjs
git commit -m "data: add eastern source-backed rice meals"
```

---

### Task 5: Complete the northwest, southwest, northern, and remaining-region pass

**Files:**
- Modify: `tools/data/source-backed-one-pot-recipes.v1.json`
- Modify: generated catalog artifacts
- Test: `tools/tests/source-backed-one-pot-catalog-data.test.mjs`

**Interfaces:**
- Produces: a nationwide reviewed-region ledger in which every province-level research node has recipes or an explicit blank.

- [ ] **Step 1: Write the failing national-coverage test**

Define the exact reviewed nodes in the test:

```js
const REQUIRED_REGION_CODES = [
  'CN-BJ','CN-TJ','CN-HE','CN-SX','CN-NM','CN-LN','CN-JL','CN-HL',
  'CN-SH','CN-JS','CN-ZJ','CN-AH','CN-FJ','CN-JX','CN-SD','CN-HA',
  'CN-HB','CN-HN','CN-GD','CN-GX','CN-HI','CN-CQ','CN-SC','CN-GZ',
  'CN-YN','CN-XZ','CN-SN','CN-GS','CN-QH','CN-NX','CN-XJ','TW',
  'HK','MO',
];
```

Each code must occur in `reviewed_regions`; each must also have at least one recipe or one `regional_blanks` entry with `reason` and `searched_at`.

- [ ] **Step 2: Run and verify RED**

Run the data test. Expected: FAIL listing every uncovered region code.

- [ ] **Step 3: Research priority families with first-party sources**

Use existing research documents only as discovery maps; reopen original sources. Cover at minimum:

- 新疆羊肉抓饭 and source-backed variants;
- 宁夏肉粘饭;
- 云南豌豆洋芋火腿焖饭 and related 罗锅/铜锅 rice meals;
- 川渝孔饭/箜饭 and nutritionally qualified 洋芋饭 variants;
- 陕北红枣豇豆焖饭 and other northwest rice one-pot candidates;
- Shandong, Northeast, Central Plains, Middle Yangtze, Beijing-Tianjin-Hebei, Inner Mongolia, Qinghai-Tibet, Guangxi, Hainan, Hong Kong, and Macao research nodes.

Do not force one recipe per region. An evidence-backed blank is a successful research result.

- [ ] **Step 4: Add official manufacturer recipes as a separate family**

Review official Joyoung, Panasonic, Zojirushi, and other manufacturer documents already cited in the repository. Manufacturer recipes use region code `[]`, `cuisine_family: 'manufacturer-rice-cooker-recipes'`, and retain model/program/waterline scope. Do not convert waterline facts into generic milliliters.

- [ ] **Step 5: Rebuild and verify the national pass**

Run:

```bash
node tools/build-source-backed-one-pot-catalog.mjs --write
node tools/check-source-backed-one-pot-catalog.mjs
node --test tools/tests/source-backed-one-pot-catalog-data.test.mjs
```

Expected: PASS; every required region is reviewed and every public recipe remains externally sourced and executable.

- [ ] **Step 6: Commit Task 5**

```bash
git add tools/data/source-backed-one-pot-recipes.v1.json docs/source-backed-one-pot-recipes.md docs/source-backed-one-pot-recipes.csv docs/source-backed-one-pot-recipe-gaps.md tools/tests/source-backed-one-pot-catalog-data.test.mjs
git commit -m "data: complete national one-pot rice source pass"
```

---

### Task 6: Close executable contracts without promoting incomplete recipes

**Files:**
- Modify: `tools/data/source-backed-one-pot-recipes.v1.json`
- Modify: `tools/lib/source-backed-one-pot-catalog-validator.mjs`
- Modify: `tools/tests/source-backed-one-pot-catalog-validator.test.mjs`
- Modify: `tools/tests/source-backed-one-pot-catalog-data.test.mjs`
- Modify: generated catalog artifacts

**Interfaces:**
- Produces: an honest `preview_ready` subset whose fixed batches can later drive the one-button page.

- [ ] **Step 1: Write failing executable-contract tests**

Add tests for exact semantics:

```js
test('requires a single fixed serving batch for preview-ready recipes', () => {});
test('requires numeric liquid semantics or a model-scoped waterline', () => {});
test('does not treat source identity as quantity evidence', () => {});
test('requires safety evidence for raw animal protein and beans', () => {});
test('keeps adaptation facts separate from traditional recipe facts', () => {});
test('does not promote a recipe whose only external source proves its name', () => {});
```

- [ ] **Step 2: Run validator tests and verify RED**

Expected: the new semantic tests fail at the missing branches.

- [ ] **Step 3: Implement fixed-batch and claim-scope cross-validation**

Validate that every ingredient amount, liquid value, time value, appliance program, and safety endpoint cites one or more `source_id` values whose declared `claim_scopes` support that fact. The validator must reject unknown source IDs and facts supported only by a weaker claim.

- [ ] **Step 4: Review each candidate for honest status**

For each `recipe_fact_checked` row:

1. Close a fixed batch only when external sources provide exact quantities or an explicitly scoped manufacturer batch.
2. Preserve source measurement units; normalize units only when conversion is exact and recorded.
3. Do not infer ambiguous ratios such as an unlabeled `1:2`.
4. Do not generalize manufacturer waterlines across models.
5. Attach independent authoritative safety endpoints when the recipe source does not state them.
6. Keep rows below `executable` when any contract remains open.

- [ ] **Step 5: Produce and inspect the public-candidate subset**

Run the builder and inspect the `preview_ready` section of `docs/source-backed-one-pot-recipes.md`. Manually verify every displayed name against its identity source and every public source URL against the source claim table.

- [ ] **Step 6: Run focused tests and commit**

```bash
node --test \
  tools/tests/source-backed-one-pot-catalog-validator.test.mjs \
  tools/tests/source-backed-one-pot-catalog-data.test.mjs \
  tools/tests/source-backed-one-pot-catalog-renderer.test.mjs
node tools/check-source-backed-one-pot-catalog.mjs
git add tools/data/source-backed-one-pot-recipes.v1.json tools/lib/source-backed-one-pot-catalog-validator.mjs tools/tests/source-backed-one-pot-catalog-validator.test.mjs tools/tests/source-backed-one-pot-catalog-data.test.mjs docs/source-backed-one-pot-recipes.md docs/source-backed-one-pot-recipes.csv docs/source-backed-one-pot-recipe-gaps.md
git commit -m "feat: close source-backed recipe contracts"
```

Expected: all focused checks PASS; incomplete recipes remain visible only in the research/gap sections.

---

### Task 7: Integrate the catalog gate and hand the catalog to the user for review

**Files:**
- Modify: `tools/check-recipes.mjs`
- Modify: `docs/rice-meal-regional-research.md`
- Modify: `docs/PRODUCT_PRINCIPLES.md`
- Create: `tools/tests/source-backed-one-pot-catalog-gate.test.mjs`
- Test: `tools/tests/source-backed-one-pot-catalog-data.test.mjs`
- Test: existing full suite under `tools/tests/*.test.mjs`

**Interfaces:**
- Produces: `node tools/check-recipes.mjs` failure when the source-backed catalog or generated artifacts are invalid/stale.
- Produces: a user review checkpoint; no public UI implementation begins in this task.

- [ ] **Step 1: Write a failing aggregate-gate test**

Create `tools/tests/source-backed-one-pot-catalog-gate.test.mjs` and import the wished-for helper before it exists:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  validateSourceBackedCatalogFiles,
} from '../check-source-backed-one-pot-catalog.mjs';

const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));

test('reports self-citations and stale generated artifacts together', () => {
  const catalog = readJson('source-backed-one-pot-recipes.v1.json');
  catalog.recipes[0].source_refs[0].url = 'https://yiguochu.pages.dev/recipes.html?id=self';
  const errors = validateSourceBackedCatalogFiles({
    catalog,
    migration: readJson('source-backed-catalog-migration.v1.json'),
    artifactContents: new Map([['docs/source-backed-one-pot-recipes.md', 'stale']]),
  });
  assert.ok(errors.some(error => error.includes('project self-citation')));
  assert.ok(errors.some(error => error.includes('stale')));
});
```

Run `node --test tools/tests/source-backed-one-pot-catalog-gate.test.mjs` and verify it fails because the helper export does not exist.

- [ ] **Step 2: Implement aggregate integration**

`tools/check-recipes.mjs` must:

1. read both new JSON files;
2. call `validateSourceBackedOnePotCatalog`;
3. byte-compare all generated artifacts;
4. print source-backed catalog counts by status;
5. exit nonzero on any error.

Implement the helper with this exact interface:

```js
export function validateSourceBackedCatalogFiles({
  catalog,
  migration,
  artifactContents,
}) {
  const legacyCatalog = readJson('tools/data/rice-meal-catalog.v1.json');
  const legacyVariants = legacyCatalog.families.flatMap(family => family.variants || []);
  const catalogErrors = validateSourceBackedOnePotCatalog(catalog);
  const migrationErrors = validateSourceBackedCatalogMigration(migration, legacyVariants);
  const expectedArtifacts = buildSourceBackedOnePotArtifacts(catalog, migration);
  const artifactErrors = compareArtifacts(expectedArtifacts, artifactContents);
  return [...catalogErrors, ...migrationErrors, ...artifactErrors];
}
```

In this module define `readJson(relativePath) => object` using the repository root and `compareArtifacts(expectedArtifacts, artifactContents) => string[]` using exact string equality for every expected path. The helper must convert malformed arguments into returned validation errors rather than throw.

Do not change the existing 72-recipe checks or rice-meal Preview checks in this plan.

- [ ] **Step 3: Update product and research documentation**

`docs/PRODUCT_PRINCIPLES.md` must state that the current phase collects source-backed recipes only and that ingredient selection, Planner, and AI generation are frozen. `docs/rice-meal-regional-research.md` must link to the new master catalog and clearly label older Preview/runtime counts as historical rather than the current product promise.

- [ ] **Step 4: Run focused and aggregate checks**

```bash
node tools/build-source-backed-one-pot-catalog.mjs --check
node tools/check-source-backed-one-pot-catalog.mjs
node tools/check-recipes.mjs
```

Expected: all exit 0 and report identical catalog/version counts.

- [ ] **Step 5: Run the complete existing verification suite**

```bash
node --test --test-concurrency=1 tools/tests/*.test.mjs
node tools/check-foods.mjs
node tools/run-recipe-regression.mjs
node tools/run-pantry-planner-v2-journeys.mjs
node tools/run-rice-meal-journeys.mjs
python3 -m py_compile ai_proxy.py
node tools/build-dist.mjs --out-dir /tmp/yiguochu-source-backed-catalog-dist --build-id "source-backed-catalog-review"
node tools/build-dist.mjs --out-dir /tmp/yiguochu-source-backed-catalog-dist-2 --build-id "source-backed-catalog-review"
diff -qr /tmp/yiguochu-source-backed-catalog-dist /tmp/yiguochu-source-backed-catalog-dist-2
```

Expected: every command exits 0; both builds are byte-identical. No deployment follows.

- [ ] **Step 6: Verify Git boundaries**

```bash
git status --short
git diff --check
git diff --name-only origin/codex/targeted-recipe-expansion...HEAD
```

Confirm `.superpowers/research/` remains untracked and unstaged, no `index.html` or Worker route changed in this catalog phase, and no production deployment occurred.

- [ ] **Step 7: Commit Task 7**

```bash
git add tools/check-recipes.mjs tools/check-source-backed-one-pot-catalog.mjs docs/PRODUCT_PRINCIPLES.md docs/rice-meal-regional-research.md tools/tests/source-backed-one-pot-catalog-gate.test.mjs
git commit -m "chore: gate source-backed one-pot catalog"
```

- [ ] **Step 8: Stop for user catalog review**

Give the user clickable links to:

- `docs/source-backed-one-pot-recipes.md`
- `docs/source-backed-one-pot-recipe-gaps.md`
- `docs/source-backed-one-pot-recipes.csv`

Report exact totals for discovered, identity-verified, executable, preview-ready, excluded project-original, and regional blanks. Do not write the one-button UI implementation plan until the user has reviewed and approved this catalog.

---

## Completion Definition

This plan is complete only when:

1. every current rice-meal variant has an explicit migration disposition;
2. project-original free combinations do not appear in the source-backed recipe list;
3. every province-level research node is recorded as reviewed with a recipe or explicit blank;
4. every public candidate has independent external identity evidence and a fully cross-referenced executable contract;
5. Markdown, CSV, and gap artifacts are deterministic and current;
6. the new gate is part of `tools/check-recipes.mjs`;
7. the complete existing test suite remains green;
8. the user receives the catalog for review before any public-page work begins.

# Menu Master Phase Zero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic, reviewable master catalog for the existing 72 production recipes plus a separate 24-item regional research queue, without changing runtime recommendation behavior.

**Architecture:** Keep `tools/data/recipe-library.json` as the sole production recipe source. Add a separate non-production regional research ledger and an initially empty verification-case ledger, then use pure JavaScript builders to derive JSON, Markdown, and CSV views. Add freshness and integrity checks to the existing aggregate recipe gate so generated views cannot silently drift from source data.

**Tech Stack:** Node.js ESM, `node:test`, JSON source assets, deterministic Markdown/CSV renderers, existing `tools/check-recipes.mjs` gate.

## Global Constraints

- Current production recipe count remains exactly 72: 12 `approved` plus 60 `auto_approved`.
- Historical candidate files are audit history and must not be counted as additional menu rows.
- The 24 regional entries remain `research_queue` records and must never enter runtime selection or `dist/`.
- `tools/data/recipe-library.json` remains the only production recipe source of truth.
- Missing ingredient roles or claims must be emitted as `unknown_role` or `pending_review`; no model or heuristic may invent facts.
- Stage zero must not modify Worker, frontend, Planner V2, templates, taxonomy, Ratio DSL, DeepSeek prompts, or production recipes.
- No runtime web search, account, user profile, nutrition tracking, cloud user data, multi-Agent feature, Preview deployment, production deployment, or PR merge.
- All changes use TDD: add the failing test, run it and observe failure, implement the minimum, then run the same test and observe success.
- Generated artifacts must be deterministic and checked for freshness by `node tools/build-menu-master.mjs --check`.

---

## File Structure

**Create:**

- `tools/lib/menu-master-builder.mjs` — pure production-menu normalization and aggregate master construction.
- `tools/lib/regional-menu-research-validator.mjs` — schema and boundary validation for non-production research entries.
- `tools/lib/menu-verification-validator.mjs` — schema validation for future per-menu positive and negative cases.
- `tools/lib/menu-master-renderer.mjs` — deterministic JSON, Markdown, and CSV rendering.
- `tools/build-menu-master.mjs` — fixed-input CLI supporting `--write` and `--check`.
- `tools/data/regional-menu-research.v1.json` — 24 non-production research records.
- `tools/data/menu-verification-cases.v1.json` — empty, versioned source ledger for later verified journeys.
- `tools/generated/menu-master.v1.json` — generated machine-readable snapshot.
- `docs/menu-master.md` — generated human-readable inventory.
- `docs/menu-master.csv` — generated sortable inventory.
- `tools/tests/menu-master-builder.test.mjs` — unit and real-library coverage tests.
- `tools/tests/regional-menu-research.test.mjs` — research-ledger validation tests.
- `tools/tests/menu-verification-matrix.test.mjs` — verification-ledger and pending-matrix tests.
- `tools/tests/menu-master-artifacts.test.mjs` — deterministic rendering and freshness tests.

**Modify:**

- `tools/check-recipes.mjs` — append research, verification, master integrity, and freshness errors to the existing aggregate gate.
- `部署说明.md` — document `--write` for intentional regeneration and `--check` before any later Preview build.

The generated master assets are audit artifacts only and must not be added to `tools/build-dist.mjs`.

---

### Task 1: Pure production-menu master builder

**Files:**

- Create: `tools/lib/menu-master-builder.mjs`
- Create: `tools/tests/menu-master-builder.test.mjs`

**Interfaces:**

- Consumes: `recipeLibrary: { schema_version: number, families: object[], recipes: object[] }`, `taxonomy: { taxonomy_version: string, items: object[] }`, `regionalResearch: { schema_version: 1, entries: object[] }`, `verificationCases: { schema_version: 1, entries: object[] }`.
- Produces: `buildProductionMenuEntry(recipe, index, taxonomyIndex) -> ProductionMenuEntry`.
- Produces: `buildMenuMaster({ recipeLibrary, taxonomy, regionalResearch, verificationCases }) -> MenuMaster`.
- Produces: `validateMenuMaster(master) -> string[]`.
- `MenuMaster.production_menus` preserves recipe-library order and contains exactly one row per recipe.
- `MenuMaster.research_candidates` is separate and never included in `production_count`.

- [ ] **Step 1: Write failing unit tests for faithful extraction**

Create `tools/tests/menu-master-builder.test.mjs` with a minimal recipe fixture and assertions that distinguish core, staple, optional, generation optional, liquid, substitution, and discouraged data:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildMenuMaster,
  buildProductionMenuEntry,
  validateMenuMaster,
} from '../lib/menu-master-builder.mjs';

const taxonomy = {
  taxonomy_version: 'test-taxonomy',
  items: [{
    canonical_id: 'raw-rice',
    display_name: '大米',
    aliases: ['白米'],
    category: 'raw_rice',
    compatible_slot_codes: ['staple', 'raw_rice'],
  }],
};

const recipe = {
  id: 'test-rice-pot',
  family_id: 'family-test',
  status: 'auto_approved',
  name: '测试饭锅',
  cuisine: '测试地域',
  form: '焖饭',
  summary: '测试摘要',
  purposes: ['pantry'],
  protein_class: ['牛'],
  light_level: '适中',
  total_time_minutes: 30,
  core_ingredients: ['大米', '牛肉'],
  optional_ingredients: ['胡萝卜', '水'],
  generation_optional_ingredients: ['胡萝卜'],
  generation_liquid_ingredients: ['水'],
  substitution_slots: [{ slot: '肉类', replaces: ['牛肉'], allowed: ['鸡肉'] }],
  discouraged: [{ ingredients: ['牛腩'], reason_type: 'shape', reason: '时间不足。' }],
  technique: ['同锅焖制'],
  ratio_rules: ['大米与水按规则计算'],
  safety_rules: ['肉类完全熟透'],
  source_refs: [{ usage: 'approved', title: '测试来源', url: 'https://example.test/recipe' }],
};

test('production menu extraction preserves every declared ingredient boundary', () => {
  const entry = buildProductionMenuEntry(recipe, 0, new Map(taxonomy.items.map(item => [item.display_name, item])));
  assert.equal(entry.library_index, 1);
  assert.deepEqual(entry.ingredients.staples, ['大米']);
  assert.deepEqual(entry.ingredients.core, ['牛肉']);
  assert.deepEqual(entry.ingredients.optional, ['胡萝卜', '水']);
  assert.deepEqual(entry.ingredients.generation_optional, ['胡萝卜']);
  assert.deepEqual(entry.ingredients.liquids, ['水']);
  assert.deepEqual(entry.ingredients.substitutions, recipe.substitution_slots);
  assert.deepEqual(entry.ingredients.discouraged, recipe.discouraged);
});

test('missing source fields remain pending instead of being invented', () => {
  const entry = buildProductionMenuEntry({ ...recipe, source_refs: [] }, 0, new Map());
  assert.equal(entry.audit.source_status, 'pending_review');
  assert.ok(entry.audit.missing_fields.includes('source_refs'));
});

test('production and research counts remain separate', () => {
  const master = buildMenuMaster({
    recipeLibrary: { schema_version: 1, families: [{ id: 'family-test' }], recipes: [recipe] },
    taxonomy,
    regionalResearch: { schema_version: 1, entries: [{ atlas_id: 'research-only' }] },
    verificationCases: { schema_version: 1, entries: [] },
  });
  assert.equal(master.summary.production_count, 1);
  assert.equal(master.summary.research_count, 1);
  assert.deepEqual(validateMenuMaster(master), []);
});
```

- [ ] **Step 2: Run the unit test and verify the module is missing**

Run:

```bash
node --test tools/tests/menu-master-builder.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `menu-master-builder.mjs`.

- [ ] **Step 3: Implement the minimum pure builder**

Create `tools/lib/menu-master-builder.mjs` with these exact behaviors:

```js
const REQUIRED_RECIPE_FIELDS = [
  'id', 'family_id', 'status', 'name', 'cuisine', 'form',
  'core_ingredients', 'optional_ingredients',
  'generation_optional_ingredients', 'generation_liquid_ingredients',
  'substitution_slots', 'discouraged', 'technique', 'ratio_rules',
  'safety_rules', 'source_refs', 'total_time_minutes', 'purposes',
];

const ARRAY_RECIPE_FIELDS = new Set([
  'core_ingredients', 'optional_ingredients',
  'generation_optional_ingredients', 'generation_liquid_ingredients',
  'substitution_slots', 'discouraged', 'technique', 'ratio_rules',
  'safety_rules', 'source_refs', 'purposes',
]);

export function buildTaxonomyIndex(taxonomy) {
  const index = new Map();
  for (const item of taxonomy?.items || []) {
    index.set(item.display_name, item);
    for (const alias of item.aliases || []) index.set(alias, item);
  }
  return index;
}

function isStaple(name, taxonomyIndex) {
  const item = taxonomyIndex.get(name);
  return Array.isArray(item?.compatible_slot_codes)
    && item.compatible_slot_codes.includes('staple');
}

export function buildProductionMenuEntry(recipe, index, taxonomyIndex) {
  const missingFields = REQUIRED_RECIPE_FIELDS.filter(field => {
    const value = recipe[field];
    if (value === undefined || value === null) return true;
    if (ARRAY_RECIPE_FIELDS.has(field) && !Array.isArray(value)) return true;
    if (field === 'core_ingredients' && value.length === 0) return true;
    if (field === 'source_refs' && value.length === 0) return true;
    return false;
  });
  const staples = recipe.core_ingredients.filter(name => isStaple(name, taxonomyIndex));
  const core = recipe.core_ingredients.filter(name => !staples.includes(name));
  return {
    library_index: index + 1,
    id: recipe.id,
    name: recipe.name,
    status: recipe.status,
    identity: {
      family_id: recipe.family_id,
      cuisine: recipe.cuisine,
      form: recipe.form,
      summary: recipe.summary || '',
      adaptation_note: recipe.adaptation_note || '',
    },
    ingredients: {
      staples,
      core,
      optional: [...recipe.optional_ingredients],
      generation_optional: [...recipe.generation_optional_ingredients],
      liquids: [...recipe.generation_liquid_ingredients],
      substitutions: structuredClone(recipe.substitution_slots),
      discouraged: structuredClone(recipe.discouraged),
    },
    execution: {
      technique: [...recipe.technique],
      ratio_rules: [...recipe.ratio_rules],
      safety_rules: [...recipe.safety_rules],
      total_time_minutes: recipe.total_time_minutes,
      purposes: [...recipe.purposes],
      protein_class: [...(recipe.protein_class || [])],
      light_level: recipe.light_level || 'unknown',
    },
    evidence: {
      source_count: recipe.source_refs.length,
      source_refs: structuredClone(recipe.source_refs),
    },
    audit: {
      source_status: recipe.source_refs.length ? 'present' : 'pending_review',
      missing_fields: missingFields,
      static_status: missingFields.length ? 'missing_fields' : 'complete',
      verification_status: 'pending',
    },
  };
}
```

Implement `buildMenuMaster` so it builds the taxonomy index once, maps every recipe exactly once, copies research records into a separate array, and computes `approved_count`, `auto_approved_count`, `production_count`, `research_count`, and `verification_case_count`. Implement `validateMenuMaster` to reject duplicate production IDs, duplicate library indexes, mismatched summary counts, and overlap between production IDs and `atlas_id` values.

- [ ] **Step 4: Run the unit test and verify it passes**

Run:

```bash
node --test tools/tests/menu-master-builder.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 5: Add a real-library integration test**

Append a test that reads `recipe-library.json`, `ingredient-taxonomy.v1.json`, and empty research/case fixtures inline, then asserts:

```js
test('current production library produces exactly 72 unique menu rows', () => {
  const library = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  const realTaxonomy = JSON.parse(fs.readFileSync(new URL('../data/ingredient-taxonomy.v1.json', import.meta.url), 'utf8'));
  const master = buildMenuMaster({
    recipeLibrary: library,
    taxonomy: realTaxonomy,
    regionalResearch: { schema_version: 1, entries: [] },
    verificationCases: { schema_version: 1, entries: [] },
  });
  assert.equal(master.summary.production_count, 72);
  assert.equal(master.summary.approved_count, 12);
  assert.equal(master.summary.auto_approved_count, 60);
  assert.equal(new Set(master.production_menus.map(menu => menu.id)).size, 72);
  assert.deepEqual(validateMenuMaster(master), []);
});
```

- [ ] **Step 6: Run the focused test again**

Run:

```bash
node --test tools/tests/menu-master-builder.test.mjs
```

Expected: all tests PASS, including the 72-row integration case.

- [ ] **Step 7: Commit Task 1**

```bash
git add tools/lib/menu-master-builder.mjs tools/tests/menu-master-builder.test.mjs
git commit -m "feat: build production menu master"
```

---

### Task 2: Separate 24-item regional research ledger

**Files:**

- Create: `tools/data/regional-menu-research.v1.json`
- Create: `tools/lib/regional-menu-research-validator.mjs`
- Create: `tools/tests/regional-menu-research.test.mjs`

**Interfaces:**

- Consumes: `RegionalResearchCatalog` with `schema_version: 1`, `catalog_version: "regional-menu-research-v1-20260725"`, and `entries`.
- Produces: `validateRegionalMenuResearch(catalog, productionRecipeIds = new Set()) -> string[]`.
- Every entry remains non-production with `status: "research_queue"`, `source_confidence: "discovery_only"`, and `product_destination: "undecided"`.

- [ ] **Step 1: Write the failing validator tests**

Create `tools/tests/regional-menu-research.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateRegionalMenuResearch } from '../lib/regional-menu-research-validator.mjs';

const library = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
const research = JSON.parse(fs.readFileSync(new URL('../data/regional-menu-research.v1.json', import.meta.url), 'utf8'));

test('regional research ledger contains 24 non-production entries', () => {
  assert.equal(research.entries.length, 24);
  assert.deepEqual(
    validateRegionalMenuResearch(research, new Set(library.recipes.map(recipe => recipe.id))),
    [],
  );
  assert.ok(research.entries.every(entry => entry.status === 'research_queue'));
  assert.ok(research.entries.every(entry => entry.source_confidence === 'discovery_only'));
  assert.ok(research.entries.every(entry => entry.product_destination === 'undecided'));
});

test('research entries cannot masquerade as production recipes', () => {
  const broken = structuredClone(research);
  broken.entries[0].atlas_id = library.recipes[0].id;
  assert.match(
    validateRegionalMenuResearch(broken, new Set(library.recipes.map(recipe => recipe.id))).join('\n'),
    /overlaps production recipe/,
  );
});

test('unverified research requires explicit hypotheses and questions', () => {
  const broken = structuredClone(research);
  broken.entries[0].ingredient_hypothesis = [];
  broken.entries[0].research_questions = [];
  const message = validateRegionalMenuResearch(broken).join('\n');
  assert.match(message, /ingredient_hypothesis/);
  assert.match(message, /research_questions/);
});
```

- [ ] **Step 2: Run the test and verify missing files fail**

Run:

```bash
node --test tools/tests/regional-menu-research.test.mjs
```

Expected: FAIL with missing module or missing JSON file.

- [ ] **Step 3: Implement the research validator**

Create `tools/lib/regional-menu-research-validator.mjs`. Validate exact catalog version, 24 unique `atlas_id` values, required arrays and strings, `inclusion_class` limited to `natural_one_pot | family_adaptation_hypothesis`, non-production status fields, no production-ID overlap, and no recipe-only fields such as `ratio_rules`, `safety_rules`, or `generation_optional_ingredients`.

Use this required field list:

```js
const REQUIRED_FIELDS = [
  'atlas_id', 'region_group', 'prototype_name', 'family_id',
  'inclusion_class', 'ingredient_hypothesis', 'adaptation_hypothesis',
  'pantry_gap_items', 'research_questions', 'source_refs',
  'source_confidence', 'product_destination', 'status',
];
```

Return stable messages prefixed with the entry ID, for example `northeast-ribs-beans-corn-cake: ingredient_hypothesis must be non-empty`.

- [ ] **Step 4: Create the exact 24-entry research catalog**

Create `tools/data/regional-menu-research.v1.json` with these IDs, names, and ingredient hypotheses:

| atlas_id | prototype_name | ingredient_hypothesis |
|---|---|---|
| northeast-ribs-beans-corn-cake | 排骨豆角配锅边饼 | 排骨、豆角、玉米面主食 |
| northeast-chicken-mushroom-potato-corn-cake | 鸡肉蘑菇土豆配锅边饼 | 鸡肉、蘑菇、土豆、玉米面主食 |
| northeast-fish-tofu-vegetable-corn-cake | 鱼豆腐蔬菜锅配玉米饼 | 鱼、豆腐、耐炖蔬菜、玉米面主食 |
| northeast-ribs-beans-sticky-rolls | 排骨豆角粘卷子 | 排骨、豆角、小麦面团 |
| north-pork-bean-braised-noodles | 豆角猪肉焖面 | 猪肉、豆角、面条 |
| north-potato-bean-braised-noodles | 土豆豆角焖面 | 土豆、豆角、面条 |
| north-cabbage-pork-braised-noodles | 卷心菜猪肉焖面 | 卷心菜、猪肉、面条 |
| north-mushroom-vegetable-braised-noodles | 菌菇时蔬焖面 | 菌菇、时蔬、面条 |
| shandong-cabbage-tofu-vermicelli-pot | 白菜豆腐粉条大锅主餐 | 白菜、豆腐、粉条 |
| shandong-vegetable-cornmeal-one-pot | 蔬菜与玉米面主食同锅 | 耐煮蔬菜、玉米面主食 |
| shandong-seafood-staple-pot | 胶东海鲜主食锅 | 海鲜、蔬菜、待核实主食 |
| shandong-southwest-family-pot | 鲁西南家常大锅路线 | 白菜、豆腐、猪肉或粉条、待核实主食 |
| chongqing-firewood-potato-rice-home | 柴火洋芋饭家庭版 | 土豆、大米 |
| sichuan-salted-pork-potato-rice | 腊肉洋芋饭 | 腊肉、土豆、大米 |
| sichuan-corn-potato-rice | 玉米洋芋饭 | 玉米、土豆、大米 |
| sichuan-bean-potato-rice | 豆类洋芋饭 | 豆类、土豆、大米 |
| yunnan-copper-pot-potato-rice-home | 铜锅洋芋饭家庭版 | 土豆、大米 |
| yunnan-mushroom-potato-rice | 菌菇洋芋饭 | 菌菇、土豆、大米 |
| yunnan-corn-chicken-rice | 玉米鸡肉饭 | 玉米、鸡肉、大米 |
| yunnan-ham-flavor-rice-pot | 火腿风味可替换饭锅 | 火腿风味位、蔬菜、大米 |
| henan-bean-pork-steamed-noodles | 豆角猪肉蒸面 | 豆角、猪肉、面条 |
| henan-celery-pork-steamed-noodles | 芹菜猪肉蒸面 | 芹菜、猪肉、面条 |
| henan-cabbage-mushroom-steamed-noodles | 卷心菜菌菇蒸面 | 卷心菜、菌菇、面条 |
| henan-home-one-pot-steamed-braised-noodles | 家庭单锅蒸焖面 | 面条、耐蒸蔬菜、可选蛋白 |

Assign the exact family metadata by row range:

| Rows | region_group | family_id | adaptation_hypothesis |
|---|---|---|---|
| 1–4 | 东北 | stew-with-staple | 将柴火大铁锅缩为家庭锅具和2–4人份，保留炖菜与锅边主食同锅的结构 |
| 5–8 | 华北 | noodle-braise | 在一口锅中完成底菜、液体和铺面焖熟，核实生面与熟面的时间差异 |
| 9–12 | 山东 | vegetable-staple-family-pot | 先核实地方原型和主食形态，再判断能否形成家庭菜粮同锅方案 |
| 13–16 | 川渝 | potato-rice-pot | 将柴火做法改为普通锅或电饭煲，保留洋芋与大米共同形成主餐的结构 |
| 17–20 | 云南 | vessel-adapted-rice | 将铜锅改为普通锅或电饭煲，先验证锅具变化是否仍能保留核心口感 |
| 21–24 | 河南 | steamed-noodle-home-pot | 将传统蒸制流程收敛为家庭单锅分阶段完成，先验证面条含水和熟制边界 |

Every entry must use these five explicit `research_questions`, replacing `{prototype_name}` and `{region_group}` with that row’s values:

```json
[
  "核实{prototype_name}与{region_group}的名称和地域关联。",
  "核实当前ingredient_hypothesis中的食材是否属于该原型的常见核心构成。",
  "确认家庭锅具和2–4人份改造是否仍保留原型身份。",
  "建立可执行的主食、液体和食材比例规则。",
  "建立肉类、禽类、鱼类、蛋类或面饭的适用熟制安全终点。"
]
```

Set `pantry_gap_items` to the hypothesis items except the staple, dough, noodle, or liquid item. If the hypothesis contains a category such as `海鲜` or `耐蒸蔬菜`, preserve the category verbatim and do not invent a specific ingredient.

For all 24 entries:

- Set `status` to `research_queue`.
- Set `source_confidence` to `discovery_only`.
- Set `product_destination` to `undecided`.
- Use `inclusion_class: "natural_one_pot"` only where the cited identity already establishes one-pot cooking; otherwise use `family_adaptation_hypothesis`.
- Keep `source_refs` empty when a source does not directly prove that exact prototype.
- Add concrete `research_questions` covering identity/region, ingredient pattern, household adaptation, ratio, and safety.
- Do not add quantities, nutrition, final safety claims, or production recipe fields.

- [ ] **Step 5: Run the research tests**

Run:

```bash
node --test tools/tests/regional-menu-research.test.mjs
```

Expected: all tests PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add tools/data/regional-menu-research.v1.json tools/lib/regional-menu-research-validator.mjs tools/tests/regional-menu-research.test.mjs
git commit -m "data: add regional menu research queue"
```

---

### Task 3: Versioned verification ledger and 72-row pending matrix

**Files:**

- Create: `tools/data/menu-verification-cases.v1.json`
- Create: `tools/lib/menu-verification-validator.mjs`
- Create: `tools/tests/menu-verification-matrix.test.mjs`
- Modify: `tools/lib/menu-master-builder.mjs`

**Interfaces:**

- Consumes: `MenuVerificationCatalog` with `schema_version: 1`, `catalog_version: "menu-verification-v1-20260725"`, `entries: MenuVerificationCase[]`.
- Produces: `validateMenuVerificationCases(catalog, recipeIds, familyIds) -> string[]`.
- Produces: `summarizeVerificationForMenu(menuId, cases) -> { positive_case_count, negative_case_count, cross_menu_case_count, case_ids, status }`.
- Status is `pending` when a menu has no cases, `in_progress` when only one side exists, and `covered` only when both positive and negative cases exist.

- [ ] **Step 1: Write failing tests for the empty baseline and invalid references**

Create `tools/tests/menu-verification-matrix.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateMenuVerificationCases } from '../lib/menu-verification-validator.mjs';
import { buildMenuMaster } from '../lib/menu-master-builder.mjs';

const library = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
const taxonomy = JSON.parse(fs.readFileSync(new URL('../data/ingredient-taxonomy.v1.json', import.meta.url), 'utf8'));
const research = JSON.parse(fs.readFileSync(new URL('../data/regional-menu-research.v1.json', import.meta.url), 'utf8'));
const verification = JSON.parse(fs.readFileSync(new URL('../data/menu-verification-cases.v1.json', import.meta.url), 'utf8'));

test('stage-zero verification ledger is valid and intentionally empty', () => {
  assert.equal(verification.entries.length, 0);
  assert.deepEqual(validateMenuVerificationCases(
    verification,
    new Set(library.recipes.map(recipe => recipe.id)),
    new Set(library.families.map(family => family.id)),
  ), []);
});

test('all 72 production menus appear as pending in the derived matrix', () => {
  const master = buildMenuMaster({
    recipeLibrary: library,
    taxonomy,
    regionalResearch: research,
    verificationCases: verification,
  });
  assert.equal(master.production_menus.length, 72);
  assert.ok(master.production_menus.every(menu => menu.audit.verification_status === 'pending'));
});

test('verification cases reject unknown recipe references', () => {
  const broken = {
    ...verification,
    entries: [{
      case_id: 'unknown-recipe-positive',
      case_type: 'positive',
      recipe_ids: ['missing-recipe'],
      family_ids: [],
      input: { mode: 'recommend', intent: 'normal', servings: 2, items: ['番茄'] },
      expected: { planned_items: ['番茄'], plan_status: 'ready' },
      status: 'pending',
    }],
  };
  assert.match(
    validateMenuVerificationCases(broken, new Set(), new Set()).join('\n'),
    /unknown recipe_id missing-recipe/,
  );
});
```

- [ ] **Step 2: Run the focused test and verify missing files fail**

Run:

```bash
node --test tools/tests/menu-verification-matrix.test.mjs
```

Expected: FAIL with missing module or missing JSON file.

- [ ] **Step 3: Create the empty source ledger and validator**

Create `tools/data/menu-verification-cases.v1.json`:

```json
{
  "schema_version": 1,
  "catalog_version": "menu-verification-v1-20260725",
  "purpose": "逐菜单记录真实正向、反向和跨菜单用户旅程；空表表示尚未验证，不表示通过。",
  "entries": []
}
```

Create `tools/lib/menu-verification-validator.mjs` with required case types `positive | negative | cross_menu`, required statuses `pending | pass | fail | needs_review`, unique `case_id`, known recipe/family references, mode `recommend | pantry`, intent `normal | quick | fresh | batch`, servings 1–8, non-empty input items, and structured expected plan status.

- [ ] **Step 4: Add per-menu verification summaries to the master builder**

Add this interface to `tools/lib/menu-master-builder.mjs`:

```js
export function summarizeVerificationForMenu(menuId, cases) {
  const owned = cases.filter(entry => entry.recipe_ids.includes(menuId));
  const positive = owned.filter(entry => entry.case_type === 'positive').length;
  const negative = owned.filter(entry => entry.case_type === 'negative').length;
  const crossMenu = owned.filter(entry => entry.case_type === 'cross_menu').length;
  return {
    positive_case_count: positive,
    negative_case_count: negative,
    cross_menu_case_count: crossMenu,
    case_ids: owned.map(entry => entry.case_id).sort(),
    status: positive && negative ? 'covered' : owned.length ? 'in_progress' : 'pending',
  };
}
```

Attach the result to each menu’s `audit.verification` and copy `audit.verification.status` to `audit.verification_status` for the Markdown/CSV summary.

- [ ] **Step 5: Run the verification-matrix and builder tests**

Run:

```bash
node --test tools/tests/menu-verification-matrix.test.mjs tools/tests/menu-master-builder.test.mjs
```

Expected: all tests PASS and all 72 current menus are explicitly `pending`, not implicitly approved.

- [ ] **Step 6: Commit Task 3**

```bash
git add tools/data/menu-verification-cases.v1.json tools/lib/menu-verification-validator.mjs tools/lib/menu-master-builder.mjs tools/tests/menu-verification-matrix.test.mjs tools/tests/menu-master-builder.test.mjs
git commit -m "test: add menu verification baseline"
```

---

### Task 4: Deterministic JSON, Markdown, and CSV artifacts

**Files:**

- Create: `tools/lib/menu-master-renderer.mjs`
- Create: `tools/build-menu-master.mjs`
- Create: `tools/generated/menu-master.v1.json`
- Create: `docs/menu-master.md`
- Create: `docs/menu-master.csv`
- Create: `tools/tests/menu-master-artifacts.test.mjs`

**Interfaces:**

- Produces: `renderMenuMasterJson(master) -> string` with two-space indentation and one trailing newline.
- Produces: `renderMenuMasterMarkdown(master) -> string`.
- Produces: `renderMenuMasterCsv(master) -> string` with RFC 4180 quoting, UTF-8 BOM omitted, and one row per production menu.
- Produces: `buildMenuMasterArtifacts(inputs) -> Map<relativePath, string>`.
- CLI: `node tools/build-menu-master.mjs --write` writes the three fixed artifacts.
- CLI: `node tools/build-menu-master.mjs --check` performs no writes and exits 1 if any artifact is absent or stale.

- [ ] **Step 1: Write failing renderer and freshness tests**

Create `tools/tests/menu-master-artifacts.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  renderMenuMasterCsv,
  renderMenuMasterJson,
  renderMenuMasterMarkdown,
} from '../lib/menu-master-renderer.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const BUILD = fileURLToPath(new URL('../build-menu-master.mjs', import.meta.url));

const sample = {
  schema_version: 1,
  summary: { production_count: 1, research_count: 0, approved_count: 1, auto_approved_count: 0 },
  production_menus: [{
    library_index: 1,
    id: 'sample', name: '含逗号,菜单', status: 'approved',
    identity: { cuisine: '中式', family_id: 'family-test', form: '焖饭' },
    ingredients: { staples: ['大米'], core: ['鸡肉'], optional: ['胡萝卜'], generation_optional: [], liquids: ['水'], substitutions: [], discouraged: [] },
    execution: { total_time_minutes: 30, purposes: ['quick'], technique: [], ratio_rules: [], safety_rules: [] },
    evidence: { source_count: 1, source_refs: [] },
    audit: { static_status: 'complete', verification_status: 'pending', missing_fields: [] },
  }],
  research_candidates: [],
};

test('renderers are deterministic and CSV quotes commas', () => {
  assert.equal(renderMenuMasterJson(sample), renderMenuMasterJson(sample));
  assert.match(renderMenuMasterMarkdown(sample), /含逗号,菜单/);
  assert.match(renderMenuMasterMarkdown(sample), /鸡肉/);
  assert.match(renderMenuMasterCsv(sample), /"含逗号,菜单"/);
});

test('checked-in menu master artifacts are fresh', () => {
  const result = spawnSync(process.execPath, [BUILD, '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /72 production menus/);
  assert.match(result.stdout, /24 research candidates/);
});
```

- [ ] **Step 2: Run the artifact test and verify missing modules fail**

Run:

```bash
node --test tools/tests/menu-master-artifacts.test.mjs
```

Expected: FAIL with missing renderer or build script.

- [ ] **Step 3: Implement deterministic renderers**

Create `tools/lib/menu-master-renderer.mjs`.

The Markdown output must include:

1. Generated-file warning and source paths;
2. Counts for 72 production, 12 approved, 60 auto-approved, 24 research;
3. A production overview table with index, name, cuisine, form, staples, core, optional, time, status, and verification status;
4. A detail section for every production recipe containing all ingredient arrays, substitutions, discouraged rules, techniques, ratios, safety rules, and source links;
5. A separate regional research table containing hypotheses, research questions, and non-production status;
6. A verification summary showing all 72 current menus as pending until cases are added.

The CSV columns must be exactly:

```js
const CSV_COLUMNS = [
  'library_index', 'id', 'name', 'status', 'cuisine', 'family_id', 'form',
  'staples', 'core_ingredients', 'optional_ingredients',
  'generation_optional_ingredients', 'liquid_ingredients',
  'substitution_slots', 'discouraged', 'technique', 'ratio_rules',
  'safety_rules', 'total_time_minutes', 'purposes', 'source_count',
  'static_status', 'verification_status', 'missing_fields',
];
```

Join list fields with `｜` before CSV escaping. Implement CSV escaping as:

```js
function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
```

- [ ] **Step 4: Implement the fixed-input build CLI**

Create `tools/build-menu-master.mjs`. It must:

- accept exactly one argument: `--write` or `--check`;
- read `recipe-library.json`, `ingredient-taxonomy.v1.json`, `regional-menu-research.v1.json`, and `menu-verification-cases.v1.json`;
- run all three validators before rendering;
- map outputs to `tools/generated/menu-master.v1.json`, `docs/menu-master.md`, and `docs/menu-master.csv`;
- create only the parent directories of those exact paths;
- on `--write`, write UTF-8 files;
- on `--check`, compare byte-for-byte and report each missing or stale relative path;
- print `72 production menus · 24 research candidates · 72 pending verification menus` on success.

Do not add an arbitrary `--out-dir` option; fixed paths prevent accidental writes outside the repository and make freshness checking unambiguous.

- [ ] **Step 5: Generate the three review artifacts**

Run:

```bash
node tools/build-menu-master.mjs --write
```

Expected: exit 0 and the summary `72 production menus · 24 research candidates · 72 pending verification menus`.

- [ ] **Step 6: Run focused artifact and data tests**

Run:

```bash
node --test tools/tests/menu-master-artifacts.test.mjs tools/tests/menu-master-builder.test.mjs tools/tests/regional-menu-research.test.mjs tools/tests/menu-verification-matrix.test.mjs
node tools/build-menu-master.mjs --check
```

Expected: all tests PASS and freshness check exits 0.

- [ ] **Step 7: Commit Task 4**

```bash
git add tools/lib/menu-master-renderer.mjs tools/build-menu-master.mjs tools/generated/menu-master.v1.json docs/menu-master.md docs/menu-master.csv tools/tests/menu-master-artifacts.test.mjs
git commit -m "feat: generate reviewable menu master"
```

---

### Task 5: Aggregate gate and operating documentation

**Files:**

- Modify: `tools/check-recipes.mjs`
- Modify: `部署说明.md`
- Modify: `tools/tests/menu-master-artifacts.test.mjs`

**Interfaces:**

- `tools/check-recipes.mjs` remains the canonical aggregate gate and now includes regional research validation, verification-case validation, menu-master validation, and generated-artifact freshness.
- `node tools/build-menu-master.mjs --check` remains a separately runnable focused gate.

- [ ] **Step 1: Add a failing aggregate-gate assertion**

Append to `tools/tests/menu-master-artifacts.test.mjs`:

```js
test('aggregate recipe gate includes menu master integrity', () => {
  const checker = fileURLToPath(new URL('../check-recipes.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [checker], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /menu master ok/);
  assert.match(result.stdout, /72 production menus/);
  assert.match(result.stdout, /24 research candidates/);
});
```

- [ ] **Step 2: Run the focused test and verify the new assertion fails**

Run:

```bash
node --test tools/tests/menu-master-artifacts.test.mjs
```

Expected: FAIL because `check-recipes.mjs` does not yet print `menu master ok`.

- [ ] **Step 3: Extend the aggregate recipe checker**

Modify `tools/check-recipes.mjs` to:

- load the two new source ledgers;
- call `validateRegionalMenuResearch`, `validateMenuVerificationCases`, `buildMenuMaster`, and `validateMenuMaster`;
- build expected artifact strings in memory and compare them with the three checked-in files;
- append all errors to the existing `errors` array;
- print `72 production menus · 24 research candidates · menu master ok` only when all menu-master checks pass;
- keep the existing recipe, promotion, taxonomy, template, Ratio DSL, family, and status checks unchanged.

Do not make the aggregate gate write files. Stale artifacts must fail closed and instruct the developer to run `node tools/build-menu-master.mjs --write` intentionally.

- [ ] **Step 4: Update operating documentation**

In `部署说明.md`, add this sequence before `tools/build-dist.mjs`:

```bash
node tools/build-menu-master.mjs --check
node tools/check-recipes.mjs
node tools/run-pantry-planner-v2-journeys.mjs
```

Document that intentional recipe/research/case changes require:

```bash
node tools/build-menu-master.mjs --write
```

Also state that menu-master artifacts are review documents and are not copied into `dist/` or used by runtime selection.

- [ ] **Step 5: Run the focused gate tests**

Run:

```bash
node --test tools/tests/menu-master-artifacts.test.mjs tools/tests/recipe-library.test.mjs
node tools/build-menu-master.mjs --check
node tools/check-recipes.mjs
```

Expected: all tests PASS; both commands exit 0; output includes `menu master ok`.

- [ ] **Step 6: Commit Task 5**

```bash
git add tools/check-recipes.mjs 部署说明.md tools/tests/menu-master-artifacts.test.mjs
git commit -m "chore: gate menu master freshness"
```

---

### Task 6: Full regression verification and handoff

**Files:**

- Verify only; do not add behavior changes.

**Interfaces:**

- Produces: fresh evidence that stage zero did not change runtime behavior or deployment assets.

- [ ] **Step 1: Run the entire Node test suite**

Run:

```bash
node --test tools/tests/*.test.mjs
```

Expected: exit 0 with zero failed tests.

- [ ] **Step 2: Run all canonical data and journey gates**

Run:

```bash
node tools/build-menu-master.mjs --check
node tools/check-recipes.mjs
node tools/check-foods.mjs
node tools/run-pantry-planner-v2-journeys.mjs
node tools/run-recipe-regression.mjs
node tools/run-coverage-recipe-regression.mjs
```

Expected: every command exits 0. Record exact journey and regression counts from fresh output rather than copying historical counts into the handoff.

- [ ] **Step 3: Run Python syntax checks**

Run:

```bash
python3 -m py_compile ai_proxy.py
```

Expected: exit 0 with no output.

- [ ] **Step 4: Verify the normal distribution build is unchanged in scope**

Run:

```bash
node tools/build-dist.mjs --out-dir dist/menu-master-verification --build-id menu-master-phase-zero
node --test tools/tests/build-dist.test.mjs
```

Expected: build exits 0; build-dist tests PASS; no menu-master or research file appears in `dist/menu-master-verification`.

- [ ] **Step 5: Inspect the final change boundary**

Run:

```bash
git status --short
git diff --stat HEAD~5..HEAD
git diff --name-only HEAD~5..HEAD
```

Expected: changes are limited to the stage-zero files listed in this plan; no Worker, frontend, Planner, template, taxonomy, Ratio DSL, production recipe, or deployment output file changed.

- [ ] **Step 6: Review the generated menu inventory with the user**

Provide clickable links to:

- `docs/menu-master.md` for full human review;
- `docs/menu-master.csv` for sorting/filtering;
- `tools/generated/menu-master.v1.json` for machine audit.

Report separately:

- 72 production menus;
- 24 non-production research candidates;
- 72 menus with pending verification cases at stage zero;
- any real source-field gaps found during extraction.

Do not call the 72 menus “tested” merely because they were exported. The next plan begins only after the user reviews the total menu and ingredient composition.

## Deferred Work

This plan intentionally defers the following into separate, reviewable plans:

- adding positive and negative journeys for all 72 menus;
- changing candidate ranking or the three-card UI;
- changing pantry multi-pot behavior;
- adding or promoting regional recipes;
- changing templates, taxonomy, Ratio DSL, Worker, frontend, or DeepSeek generation;
- Preview or production deployment.

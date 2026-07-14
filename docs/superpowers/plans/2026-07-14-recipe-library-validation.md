# Recipe Library Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and validate the first 12 source-audited base recipes end to end, so DeepSeek adapts a matched recipe instead of freely combining every pantry ingredient.

**Architecture:** Store the audited recipe families and base recipes in one JSON asset. The Cloudflare Worker and local Python proxy load that asset, deterministically rank base recipes, send one compact grounding packet to DeepSeek, attach trusted source metadata after generation, and mark rule violations for the existing quality retry. The frontend displays the pairing basis and unused pantry items; this phase stays on local/preview environments and does not publish the 12-recipe library as the Xiaohongshu launch version.

**Tech Stack:** Vanilla JavaScript PWA, Cloudflare Pages Worker, Node.js 22+ built-in test runner, Python 3 standard library, DeepSeek chat-completions API, JSON assets.

## Global Constraints

- Phase A contains exactly 12 audited base recipes across 9 recipe families.
- The 12-recipe build is for local and preview validation only; do not deploy it to the production main branch URL.
- RecipeDB remains research-only and must not appear in `recipe-library.json` as an `approved` production source.
- Every production recipe source must have `usage: "approved"`, a direct HTTPS URL, a license, an attribution label, and a retrieval date.
- Do not copy third-party prose. Store structured ingredients, allowed substitutions, techniques, safety rules, and original Chinese summary text.
- Do not add a vector database or a model fine-tuning step.
- Recipe retrieval and deterministic validation must not add a DeepSeek call. Keep the current one quality retry only when the first generated result fails.
- Pantry ingredients are preferred, not mandatory. Incompatible ingredients must be omitted and explained.
- Allergens and dislikes are hard exclusions.
- Every non-seasoning ingredient must appear in the cooking steps; poultry, pork, seafood, and eggs need an explicit cooking action.
- Nutrition continues to use Taiwan FDA authority data, then local `FOODS`, then visibly marked AI estimates.
- Keep `worker/src/worker.js` and `ai_proxy.py` behavior aligned.
- Use only standard-library Node.js and Python code; do not add package dependencies.
- Stage and commit only the files named by each task; preserve all unrelated user-owned working-tree changes.

---

## File Map

**Create**

- `tools/data/recipe-library.json` — approved source audit, aliases, 9 families, and 12 base recipes.
- `tools/lib/recipe-library-validator.mjs` — schema and license validator used by tests and the CLI checker.
- `tools/check-recipes.mjs` — one-command offline gate for recipe data and contract drift.
- `tools/tests/recipe-library.test.mjs` — schema and seed-content tests.
- `tools/tests/worker-recipe.test.mjs` — Worker selection, grounding, and safety tests.
- `tools/tests/recipe-parity.test.mjs` — JavaScript/Python selector parity tests.
- `tools/tests/frontend-recipe-contract.test.mjs` — frontend contract and copy guard tests.
- `tools/build-recipe-regression.mjs` — deterministic generator for exactly 100 Phase A cases.
- `tools/data/recipe-regression.json` — committed Phase A regression corpus.
- `tools/run-recipe-regression.mjs` — static selection checks and optional local API checks.
- `docs/recipe-validation-review.md` — 30-case human review sheet.

**Modify**

- `worker/src/worker.js` — asset loading, candidate ranking, grounded prompt, trusted metadata, validation flags, health count.
- `ai_proxy.py` — identical local loading/ranking/grounding and a no-API parity CLI.
- `index.html` — map the trusted recipe fields, show the basis block, update pantry copy, reject unsafe second results.
- `CLAUDE.md` — recipe-source red lines and required check commands.
- `部署说明.md` — copy the recipe asset into `dist/` and verify the library count.

---

### Task 1: Add the audited recipe-library contract and 12 seed recipes

**Files:**

- Create: `tools/lib/recipe-library-validator.mjs`
- Create: `tools/data/recipe-library.json`
- Create: `tools/tests/recipe-library.test.mjs`
- Create: `tools/check-recipes.mjs`

**Interfaces:**

- Produces: `validateRecipeLibrary(lib: object): string[]`
- Produces: JSON root `{ schema_version, ingredient_aliases, families, recipes }`
- Later tasks consume exact family IDs, recipe IDs, aliases, source metadata, and substitution lists from this file.

- [ ] **Step 1: Write the failing schema test**

```js
// tools/tests/recipe-library.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateRecipeLibrary } from '../lib/recipe-library-validator.mjs';

const lib = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));

test('Phase A library has 9 families and 12 approved recipes', () => {
  assert.deepEqual(validateRecipeLibrary(lib), []);
  assert.equal(lib.families.length, 9);
  assert.equal(lib.recipes.length, 12);
  assert.ok(lib.recipes.every(r => r.status === 'approved'));
});

test('RecipeDB is never an approved production source', () => {
  const sources = lib.recipes.flatMap(r => r.source_refs);
  assert.equal(sources.some(s => /recipedb/i.test(s.url) && s.usage === 'approved'), false);
});
```

- [ ] **Step 2: Run the test and verify the missing files fail**

Run: `node --test tools/tests/recipe-library.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `recipe-library-validator.mjs` or `ENOENT` for `recipe-library.json`.

- [ ] **Step 3: Implement the validator**

```js
// tools/lib/recipe-library-validator.mjs
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REASON_TYPES = new Set(['taste', 'texture_water', 'timing', 'safety']);

export function validateRecipeLibrary(lib) {
  const errors = [];
  if (lib?.schema_version !== 1) errors.push('schema_version must be 1');
  if (!lib?.ingredient_aliases || typeof lib.ingredient_aliases !== 'object') errors.push('ingredient_aliases must be an object');
  if (!Array.isArray(lib?.families)) errors.push('families must be an array');
  if (!Array.isArray(lib?.recipes)) errors.push('recipes must be an array');
  if (errors.length) return errors;

  const familyIds = new Set();
  for (const family of lib.families) {
    if (!ID_RE.test(family.id || '')) errors.push(`invalid family id: ${family.id || '<empty>'}`);
    if (familyIds.has(family.id)) errors.push(`duplicate family id: ${family.id}`);
    familyIds.add(family.id);
    for (const key of ['name', 'form']) if (!String(family[key] || '').trim()) errors.push(`${family.id} missing ${key}`);
  }

  const recipeIds = new Set();
  for (const recipe of lib.recipes) {
    if (!ID_RE.test(recipe.id || '')) errors.push(`invalid recipe id: ${recipe.id || '<empty>'}`);
    if (recipeIds.has(recipe.id)) errors.push(`duplicate recipe id: ${recipe.id}`);
    recipeIds.add(recipe.id);
    if (!familyIds.has(recipe.family_id)) errors.push(`${recipe.id} missing family ${recipe.family_id}`);
    if (recipe.status !== 'approved') errors.push(`${recipe.id} status must be approved`);
    for (const key of ['name', 'cuisine', 'form']) if (!String(recipe[key] || '').trim()) errors.push(`${recipe.id} missing ${key}`);
    for (const key of ['purposes', 'core_ingredients', 'optional_ingredients', 'substitution_slots', 'technique', 'safety_rules', 'source_refs']) {
      if (!Array.isArray(recipe[key]) || recipe[key].length === 0) errors.push(`${recipe.id} ${key} must be non-empty`);
    }
    for (const item of recipe.discouraged || []) {
      if (!REASON_TYPES.has(item.reason_type)) errors.push(`${recipe.id} invalid reason_type ${item.reason_type}`);
      if (!Array.isArray(item.ingredients) || !item.ingredients.length || !String(item.reason || '').trim()) errors.push(`${recipe.id} invalid discouraged rule`);
    }
    for (const source of recipe.source_refs || []) {
      if (source.usage !== 'approved') errors.push(`${recipe.id} source usage must be approved`);
      if (!/^https:\/\//.test(source.url || '')) errors.push(`${recipe.id} source URL must be HTTPS`);
      for (const key of ['title', 'license', 'attribution', 'retrieved_at']) if (!String(source[key] || '').trim()) errors.push(`${recipe.id} source missing ${key}`);
      if (/recipedb/i.test(source.url || '')) errors.push(`${recipe.id} RecipeDB cannot be approved`);
    }
  }
  return errors;
}
```

- [ ] **Step 4: Create the JSON root and exact Phase A seed list**

Use `schema_version: 1`. Canonical ingredient names are simplified Chinese. Put aliases such as `西红柿 → 番茄`, `白米 → 大米`, `鸡腿肉 → 鸡肉`, `鸡胸肉 → 鸡肉`, `青椒 → 甜椒`, and `椰浆 → 椰奶` in `ingredient_aliases`.

Create these 9 family IDs:

```json
[
  "family-rice-porridge",
  "family-spiced-rice",
  "family-tomato-rice",
  "family-rice-legume-pot",
  "family-legume-vegetable-stew",
  "family-tomato-egg-pot",
  "family-coconut-curry",
  "family-risotto",
  "family-minestrone"
]
```

Create these 12 recipe records with the listed source URL and license `CC BY-SA 4.0`. Each record must include Chinese `core_ingredients`, `optional_ingredients`, explicit `substitution_slots`, `discouraged`, `technique`, `ratio_rules`, `safety_rules`, and an attribution formed from `Wikibooks contributors, ` plus the exact English Cookbook page title in the table URL. For example, the first attribution is `Wikibooks contributors, Cookbook:Chinese Rice Porridge (Congee)`.

| Recipe ID | Family | Chinese name | Source URL |
|---|---|---|---|
| `chinese-congee` | `family-rice-porridge` | 中式基础粥 | `https://en.wikibooks.org/wiki/Cookbook:Chinese_Rice_Porridge_(Congee)` |
| `simple-chicken-biryani` | `family-spiced-rice` | 简化一锅鸡肉香料饭 | `https://en.wikibooks.org/wiki/Cookbook:Simple_Biryani` |
| `jollof-rice` | `family-tomato-rice` | 西非番茄香料饭 | `https://en.wikibooks.org/wiki/Cookbook:Jollof_Rice` |
| `creole-jambalaya` | `family-tomato-rice` | 克里奥尔番茄鸡肉什锦饭 | `https://en.wikibooks.org/wiki/Cookbook:Jambalaya_I` |
| `mung-bean-brown-rice-curry` | `family-rice-legume-pot` | 绿豆糙米蔬菜咖喱锅 | `https://en.wikibooks.org/wiki/Cookbook:Mung_Bean_and_Brown_Rice_Curry` |
| `chicken-black-eyed-pea-stew` | `family-rice-legume-pot` | 鸡肉黑眼豆番茄饭锅 | `https://en.wikibooks.org/wiki/Cookbook:Chicken_and_Black-eyed_Pea_Stew` |
| `lentil-potato-tomato-curry` | `family-legume-vegetable-stew` | 扁豆土豆番茄咖喱 | `https://en.wikibooks.org/wiki/Cookbook:Lentil,_Potato,_and_Tomato_Curry` |
| `shakshuka-tomato-egg` | `family-tomato-egg-pot` | 番茄甜椒炖蛋 | `https://en.wikibooks.org/wiki/Cookbook:Shakshuka_I` |
| `texas-beef-chili` | `family-legume-vegetable-stew` | 德州风味牛肉辣炖锅 | `https://en.wikibooks.org/wiki/Cookbook:Original_Texas-Style_Chili` |
| `kari-ayam-coconut-chicken` | `family-coconut-curry` | 印尼椰香鸡肉咖喱 | `https://en.wikibooks.org/wiki/Cookbook:Kari_Ayam_(Indonesian_Chicken_Curry)` |
| `basic-risotto` | `family-risotto` | 基础意式烩饭 | `https://en.wikibooks.org/wiki/Cookbook:Risotto_(Basic)` |
| `rice-cabbage-minestrone` | `family-minestrone` | 米粒卷心菜杂蔬汤 | `https://en.wikibooks.org/wiki/Cookbook:Rice_and_Cabbage_Minestrone` |

Do not copy source instructions. Express each technique in short original Chinese action labels, and retain the source URL for attribution.

- [ ] **Step 5: Add the offline checker wrapper**

```js
// tools/check-recipes.mjs
#!/usr/bin/env node
import fs from 'node:fs';
import { validateRecipeLibrary } from './lib/recipe-library-validator.mjs';

const file = new URL('./data/recipe-library.json', import.meta.url);
const lib = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = validateRecipeLibrary(lib);
for (const error of errors) console.error(`❌ ${error}`);
console.log(`菜谱家族 ${lib.families.length} 个 · 基础菜谱 ${lib.recipes.length} 道`);
console.log(errors.length ? `❌ 菜谱库体检不通过: ${errors.length} 项` : '✅ 菜谱库体检通过');
process.exit(errors.length ? 1 : 0);
```

- [ ] **Step 6: Run the data tests**

Run: `node tools/check-recipes.mjs && node --test tools/tests/recipe-library.test.mjs`

Expected: both commands exit 0; output includes `菜谱家族 9 个 · 基础菜谱 12 道`.

- [ ] **Step 7: Commit the data contract**

```bash
git add tools/data/recipe-library.json tools/lib/recipe-library-validator.mjs tools/check-recipes.mjs tools/tests/recipe-library.test.mjs
git commit -m "feat: add audited recipe library seeds"
```

---

### Task 2: Add deterministic recipe selection to the Worker

**Files:**

- Modify: `worker/src/worker.js:1-75,180-245,330-385`
- Create: `tools/tests/worker-recipe.test.mjs`

**Interfaces:**

- Consumes: `tools/data/recipe-library.json` through `env.ASSETS.fetch('/recipe-library.json')`.
- Produces: `canonicalRecipeIngredient(name, aliases): string`
- Produces: `selectRecipeCandidates(lib, constraints): Array<{ recipe, family, score, usedPantry, unusedPantry }>`
- Produces: `getRecipeLib(env, request): Promise<object>`

- [ ] **Step 1: Write failing selector tests**

```js
// tools/tests/worker-recipe.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { selectRecipeCandidates } from '../../worker/src/worker.js';

const lib = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));

test('chicken rice onion raisins selects simple biryani', () => {
  const [hit] = selectRecipeCandidates(lib, { pantry: ['鸡腿肉', '大米', '洋葱', '葡萄干'], purpose: 'quick', dislikes: [] });
  assert.equal(hit.recipe.id, 'simple-chicken-biryani');
});

test('lentil potato tomato selects the grounded lentil curry', () => {
  const [hit] = selectRecipeCandidates(lib, { pantry: ['红扁豆', '土豆', '西红柿'], purpose: 'pantry', dislikes: [] });
  assert.equal(hit.recipe.id, 'lentil-potato-tomato-curry');
});

test('disliked fixed core ingredient excludes a recipe', () => {
  const hits = selectRecipeCandidates(lib, { pantry: ['鸡蛋', '番茄', '甜椒'], purpose: 'quick', dislikes: ['鸡蛋过敏'] });
  assert.equal(hits.some(x => x.recipe.id === 'shakshuka-tomato-egg'), false);
});
```

- [ ] **Step 2: Run tests and verify the missing export fails**

Run: `node --test tools/tests/worker-recipe.test.mjs`

Expected: FAIL because `selectRecipeCandidates` is not exported.

- [ ] **Step 3: Implement cached asset loading and canonicalization**

Add `RECIPE_CACHE`, `getRecipeLib`, and this canonicalizer near the Taiwan-library loader:

```js
let RECIPE_CACHE = null;

function canonicalRecipeIngredient(name, aliases = {}) {
  const norm = String(name || '').toLowerCase()
    .replace(/过敏|不吃|忌口|不要/g, '')
    .replace(/（/g, '(').replace(/）/g, ')')
    .replace(/\(.*?\)/g, '').replace(/[\s_-]+/g, '')
    .replace(/丁$|片$|块$|丝$|末$|粒$/g, '');
  return aliases[norm] || norm;
}

async function getRecipeLib(env, request) {
  if (RECIPE_CACHE) return RECIPE_CACHE;
  if (!env.ASSETS) throw new Error('recipe_library_unavailable');
  const url = new URL('/recipe-library.json', request.url);
  const response = await env.ASSETS.fetch(new Request(url.toString()));
  if (!response?.ok) throw new Error('recipe_library_unavailable');
  const lib = await response.json();
  if (!Array.isArray(lib.recipes) || !lib.recipes.length) throw new Error('recipe_library_empty');
  RECIPE_CACHE = lib;
  return RECIPE_CACHE;
}
```

- [ ] **Step 4: Implement deterministic scoring and diverse top-three selection**

Use exact weights: fixed-core pantry hit `+12`, allowed substitution or optional hit `+5`, purpose match `+3`, discouraged hit `-8`, recent family `-20`, recent base recipe `-100`. Reject a recipe when a disliked ingredient is in fixed core and no allowed slot can replace it. Sort by score descending then recipe ID ascending. Select at most one candidate per family on the first pass, then fill from remaining candidates.

Export the pure functions before the default export:

```js
export { canonicalRecipeIngredient, selectRecipeCandidates };
```

- [ ] **Step 5: Make `/health` report the loaded recipe count**

In the health route, load the library and include `recipeFamilies` and `baseRecipes`. If loading fails, report both as `0` and `recipeLibrary: "unavailable"`; do not claim healthy recipe grounding.

- [ ] **Step 6: Run selector and syntax tests**

Run: `node --check worker/src/worker.js && node --test tools/tests/worker-recipe.test.mjs`

Expected: PASS; all three selector tests succeed.

- [ ] **Step 7: Commit Worker selection**

```bash
git add worker/src/worker.js tools/tests/worker-recipe.test.mjs
git commit -m "feat: select grounded base recipes"
```

---

### Task 3: Ground the Worker prompt and validate generated meals

**Files:**

- Modify: `worker/src/worker.js:53-116,188-290,330-370`
- Modify: `tools/tests/worker-recipe.test.mjs`

**Interfaces:**

- Consumes: first item returned by `selectRecipeCandidates`.
- Produces: `buildRecipeGrounding(selection): string`
- Produces: `validateGroundedMeal(meal, selection, constraints): string[]`
- Adds response fields: `family_id`, `base_recipe_id`, `basis_level`, `pairing_basis`, `used_pantry`, `unused_pantry`, `source_refs`, `safety_checks`, `validation_flags`.

- [ ] **Step 1: Add failing grounding and safety tests**

```js
import { buildRecipeGrounding, validateGroundedMeal } from '../../worker/src/worker.js';

test('grounding names the selected base recipe and allowed substitutions', () => {
  const [selection] = selectRecipeCandidates(lib, { pantry: ['鸡肉', '大米', '洋葱'], purpose: 'quick', dislikes: [] });
  const text = buildRecipeGrounding(selection);
  assert.match(text, new RegExp(selection.recipe.id));
  assert.match(text, /只允许以下替换/);
  assert.match(text, /不合适的库存食材不要使用/);
});

test('validator catches listed shrimp that is never cooked', () => {
  const [selection] = selectRecipeCandidates(lib, { pantry: ['虾仁', '大米', '番茄'], purpose: 'quick', dislikes: [] });
  const flags = validateGroundedMeal({
    dish_name: '番茄虾仁饭',
    ingredients: [{ name: '虾仁' }, { name: '大米' }, { name: '番茄' }],
    steps: ['大米和番茄煮熟后盛出。'],
  }, selection, { dislikes: [] });
  assert.ok(flags.some(x => x.startsWith('ingredient_missing_in_steps:虾仁')));
  assert.ok(flags.some(x => x.startsWith('high_risk_not_cooked:虾仁')));
});
```

- [ ] **Step 2: Run the targeted tests and verify they fail**

Run: `node --test --test-name-pattern='grounding|validator' tools/tests/worker-recipe.test.mjs`

Expected: FAIL because the new functions are not exported.

- [ ] **Step 3: Add a compact trusted grounding block to `RECIPE_TEMPLATE`**

Add `{recipe_grounding}` before the JSON contract. The grounding text must include the chosen family and base recipe IDs, core ingredients, allowed substitution slots, discouraged ingredients with reasons, required techniques, ratio rules, safety rules, `usedPantry`, and `unusedPantry`. Add this hard instruction:

```text
你必须以这张基础菜谱为底稿，只能在允许替换列表内改动。库存食材不合适时必须舍弃，不得为了全用而改变菜谱结构。来源字段由服务器添加，你不要编造来源。
```

Remove the current swap sentence that says `仍要保留并用上家里的食材`.

- [ ] **Step 4: Implement deterministic meal validation**

`validateGroundedMeal` must return machine-readable flags for:

```text
allergen_present:<name>
ingredient_missing_in_steps:<name>
used_pantry_missing:<name>
unused_pantry_used:<name>
high_risk_not_cooked:<name>
base_recipe_anchor_missing
multi_pot_step
```

Treat `姜、葱、蒜、醋、料酒、香料` as seasoning exemptions. Use `禽|鸡|鸭|猪|虾|蟹|贝|鱼|蛋` as the high-risk matcher and `熟|煮沸|煮熟|煎熟|炒熟|焖熟|炖熟|蒸熟|烧开` as cooking evidence. A base recipe needs at least two canonical anchor hits across fixed core and used pantry, unless it has only one anchor.

Export `buildRecipeGrounding` and `validateGroundedMeal` beside the Task 2 named exports so Node tests use the exact Worker implementation.

- [ ] **Step 5: Attach trusted evidence after normalization**

After `normalizeMeal` and before nutrition enrichment, overwrite all grounding metadata from the selected server-side record. Do not trust model-provided IDs or sources. Generate `pairing_basis` deterministically from the selected Chinese recipe name and `usedPantry`. Set `basis_level` to `classic` when all used pantry items are fixed core; otherwise set `adapted`.

- [ ] **Step 6: Wire selection into `handleGenerate`**

Load the library before calling DeepSeek. If no library or candidate exists, return `recipe_library_unavailable` with status 503 so the frontend uses its labeled emergency fallback. Pass the grounding string into `buildPrompt`. Log `base`, `family`, and validation flag count without logging raw pantry or dislikes.

- [ ] **Step 7: Run Worker tests**

Run: `node --check worker/src/worker.js && node --test tools/tests/worker-recipe.test.mjs`

Expected: PASS; unsafe shrimp fixture yields both expected flags and the prompt no longer contains the forced-use sentence.

- [ ] **Step 8: Commit Worker grounding**

```bash
git add worker/src/worker.js tools/tests/worker-recipe.test.mjs
git commit -m "feat: ground and validate generated meals"
```

---

### Task 4: Mirror recipe selection in the local Python proxy

**Files:**

- Modify: `ai_proxy.py:1-220,520-580`
- Create: `tools/tests/recipe-parity.test.mjs`

**Interfaces:**

- Consumes: `tools/data/recipe-library.json`.
- Produces CLI such as `python3 ai_proxy.py --recipe-match '{"pantry":["鸡肉","大米"],"purpose":"quick","dislikes":[]}'`, returning `{ base_recipe_id, family_id, used_pantry, unused_pantry }`.
- Local `/generate-meal` returns the same trusted metadata field names as the Worker.

- [ ] **Step 1: Write a failing JavaScript/Python parity test**

```js
// tools/tests/recipe-parity.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { selectRecipeCandidates } from '../../worker/src/worker.js';

const lib = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
const cases = [
  { pantry: ['鸡腿肉', '大米', '洋葱', '葡萄干'], purpose: 'quick', dislikes: [] },
  { pantry: ['红扁豆', '土豆', '西红柿'], purpose: 'pantry', dislikes: [] },
  { pantry: ['鸡蛋', '番茄', '甜椒'], purpose: 'quick', dislikes: [] },
];

test('Python selector matches Worker selector', () => {
  for (const constraints of cases) {
    const js = selectRecipeCandidates(lib, constraints)[0];
    const py = spawnSync('python3', ['ai_proxy.py', '--recipe-match', JSON.stringify(constraints)], { encoding: 'utf8' });
    assert.equal(py.status, 0, py.stderr);
    const value = JSON.parse(py.stdout);
    assert.equal(value.base_recipe_id, js.recipe.id);
    assert.equal(value.family_id, js.family.id);
  }
});
```

- [ ] **Step 2: Run the parity test and verify the CLI fails**

Run: `node --test tools/tests/recipe-parity.test.mjs`

Expected: FAIL because `ai_proxy.py` starts the server or does not recognize `--recipe-match`.

- [ ] **Step 3: Move API-key failure to API-use time**

Do not exit while importing or using the parity CLI. Keep the existing clear error when `call_recipe` or `main()` starts without a key.

- [ ] **Step 4: Implement Python canonicalization and exact scoring weights**

Load the JSON once from `SCRIPT_DIR / 'tools' / 'data' / 'recipe-library.json'`. Implement the same alias normalization, fixed-core rejection, weights, tie-break by recipe ID, and diverse-family top-three selection as Task 2. The CLI prints only JSON and exits before starting the HTTP server.

- [ ] **Step 5: Ground the local prompt and attach trusted metadata**

Replace the local `RECIPE_SYSTEM` and `RECIPE_TEMPLATE` text with the Worker contract from Task 3, add the same grounding block, remove forced pantry use, and attach `family_id`, `base_recipe_id`, `basis_level`, `pairing_basis`, `used_pantry`, `unused_pantry`, `source_refs`, `safety_checks`, and `validation_flags` after parsing the model result.

- [ ] **Step 6: Run syntax and parity tests**

Run: `python3 -m py_compile ai_proxy.py && node --test tools/tests/recipe-parity.test.mjs`

Expected: PASS for all three parity fixtures.

- [ ] **Step 7: Commit local parity**

```bash
git add ai_proxy.py tools/tests/recipe-parity.test.mjs
git commit -m "feat: mirror recipe grounding locally"
```

---

### Task 5: Show pairing evidence and reject unsafe results in the PWA

**Files:**

- Modify: `index.html:1-280,685-770,835-970`
- Create: `tools/tests/frontend-recipe-contract.test.mjs`

**Interfaces:**

- Consumes Worker/local-proxy trusted metadata fields from Task 3 and Task 4.
- Produces dish properties `familyId`, `baseRecipeId`, `basisLevel`, `pairingBasis`, `usedPantry`, `unusedPantry`, `sourceRefs`, `validationFlags`.
- Produces `recipeBasisBlock(d): string`.

- [ ] **Step 1: Write failing frontend contract guards**

```js
// tools/tests/frontend-recipe-contract.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

test('frontend maps and renders trusted recipe evidence', () => {
  for (const token of ['base_recipe_id', 'pairing_basis', 'unused_pantry', 'validation_flags', 'recipeBasisBlock']) {
    assert.match(html, new RegExp(token));
  }
});

test('swap copy no longer promises every pantry item is used', () => {
  assert.doesNotMatch(html, /换菜会一直带着家里的食材/);
  assert.match(html, /会优先使用，搭不上的会说明/);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --test tools/tests/frontend-recipe-contract.test.mjs`

Expected: FAIL because trusted recipe fields and `recipeBasisBlock` are absent.

- [ ] **Step 3: Extend `mapDish` without changing nutrition precedence**

Keep `auth:'tw' → local FOODS → AI estimate` exactly as-is. Add the trusted metadata properties to the returned dish, normalizing arrays and limiting source records to HTTPS URLs.

- [ ] **Step 4: Add the compact evidence block**

Render after `whyFits(d)` and before ingredients. Default view shows:

```text
搭配依据：参考「简化一锅鸡肉香料饭」的成熟结构。鸡肉、大米和洋葱适合按先炒香、再焖熟的顺序处理。
这次没用：白菜 — 容易增加出水量，会改变香料饭的米水比例。
```

Use a `<details>` element for source title, direct URL, license, and attribution. Escape text with existing `esc()`. Add `safeHttpUrl(value)` that returns only `https://` URLs before using an `href`.

- [ ] **Step 5: Fix pantry copy and request metadata**

Change both “换一换” and profile helper copy to `会优先使用，搭不上的会说明`. Send `swap_intent`, `recent_base_recipes`, and `recent_families` with the request so the selector can avoid structural repeats.

- [ ] **Step 6: Make validation flags a hard client-side quality failure**

In `scoreDish`, add all `validationFlags.length` to failures. After the second generated result, if neither candidate is `ok`, throw `genError('unsafe_recipe', 'recipe validation failed', false)` so the labeled fallback appears instead of the “less bad” unsafe recipe. Add a specific fallback message: `这版做法没有通过食材和熟制检查，下面先给一个应急参考。`

- [ ] **Step 7: Run frontend and existing food checks**

Run: `node --test tools/tests/frontend-recipe-contract.test.mjs && node tools/check-foods.mjs`

Expected: PASS; nutrition food checks still report 0 errors.

- [ ] **Step 8: Commit the PWA trust block**

```bash
git add index.html tools/tests/frontend-recipe-contract.test.mjs
git commit -m "feat: show trusted recipe basis"
```

---

### Task 6: Build the 100-case regression gate and 30-case review sheet

**Files:**

- Create: `tools/build-recipe-regression.mjs`
- Create: `tools/data/recipe-regression.json`
- Create: `tools/run-recipe-regression.mjs`
- Create: `docs/recipe-validation-review.md`

**Interfaces:**

- Consumes: `recipe-library.json` and exported Worker selector/validator functions.
- Produces: exactly 100 deterministic cases with `id`, `purpose`, `servings`, `pantry`, `dislikes`, `expected_recipe_ids`, and `forbidden_recipe_ids`.
- Optional live mode consumes `--base http://localhost:8765 --limit 30`.

- [ ] **Step 1: Create the deterministic corpus builder**

For each of 12 recipes generate four cases: exact core, alias variant, one discouraged pantry item, and one fixed-core dislike. That creates 48 cases. Add 20 explicit adversarial cases covering shrimp not cooked, raw poultry, egg allergy, peanut allergy, gluten-free noodles, vegan restrictions, leaf-vegetable water release, rice/water mismatch, forced all-pantry use, and repeated swap. Fill the remaining 32 by cycling the 12 recipes across `quick`, `pantry`, `fresh`, `batch` and servings `1`, `2`, `4`. Sort by ID, assert length is exactly 100, and write formatted JSON.

- [ ] **Step 2: Generate and inspect the committed corpus**

Run: `node tools/build-recipe-regression.mjs`

Expected: output `recipe-regression.json: 100 cases` and a file containing exactly 100 objects.

- [ ] **Step 3: Implement static regression mode**

For each case, run `selectRecipeCandidates`; fail when there is no candidate, an expected list is present but none match, a forbidden recipe is returned, or a disliked fixed core survives. Print totals by family and failure code. Exit non-zero on any failure.

- [ ] **Step 4: Implement optional local API mode**

When `--base http://localhost:8765` is supplied, POST cases sequentially to `http://localhost:8765/generate-meal`, stop at `--limit`, and verify non-empty `base_recipe_id`, `pairing_basis`, no validation flags, no disliked ingredient, and every non-seasoning ingredient appears in steps. Do not default to the production URL.

- [ ] **Step 5: Create the 30-case human-review sheet**

List cases 1–30 with columns: `case_id`, `基础菜谱`, `像真实菜`, `味型协调`, `一锅可完成`, `步骤能照做`, `熟制安全`, `换菜真的不同`, `问题与修改`. Leave rating cells as `□通过 / □不通过`; this is an intentional review form, not an unspecified implementation placeholder.

- [ ] **Step 6: Run the offline regression gate**

Run: `node tools/run-recipe-regression.mjs`

Expected: `100/100 static cases passed`, with all 9 families represented.

- [ ] **Step 7: Commit the regression assets**

```bash
git add tools/build-recipe-regression.mjs tools/data/recipe-regression.json tools/run-recipe-regression.mjs docs/recipe-validation-review.md
git commit -m "test: add recipe grounding regression gate"
```

---

### Task 7: Update deployment instructions and complete Phase A verification

**Files:**

- Modify: `CLAUDE.md`
- Modify: `部署说明.md`
- Verify only: `worker/src/worker.js`, `ai_proxy.py`, `index.html`, `tools/data/recipe-library.json`

**Interfaces:**

- Deployment build must copy `tools/data/recipe-library.json` to `dist/recipe-library.json`.
- `/health` must report `recipeFamilies: 9`, `baseRecipes: 12`, and `recipeLibrary: "ok"` in preview.

- [ ] **Step 1: Add recipe-source red lines to project instructions**

Document that RecipeDB is research-only, GitHub code licenses do not license scraped recipes, every base recipe needs approved source metadata, substitutions must be explicit, and `node tools/check-recipes.mjs` is mandatory before commit or deployment.

- [ ] **Step 2: Update the build command**

Add this line beside the Taiwan nutrition asset copy:

```bash
cp tools/data/recipe-library.json dist/
```

State clearly that Phase A may be deployed only to a preview branch, not the production `main` branch.

- [ ] **Step 3: Run all offline gates**

Run:

```bash
node --check worker/src/worker.js
python3 -m py_compile ai_proxy.py
node tools/check-foods.mjs
node tools/check-recipes.mjs
node --test tools/tests/recipe-library.test.mjs tools/tests/worker-recipe.test.mjs tools/tests/recipe-parity.test.mjs tools/tests/frontend-recipe-contract.test.mjs
node tools/run-recipe-regression.mjs
```

Expected: every command exits 0; food check reports 0 errors; recipe check reports 9 families and 12 recipes; static regression reports 100/100.

- [ ] **Step 4: Build the ignored preview directory**

Run:

```bash
rm -rf dist
mkdir -p dist
cp index.html manifest.json sw.js icon.svg icon-180.png icon-192.png icon-512.png dist/
cp tools/data/foods-tw.json dist/
cp tools/data/recipe-library.json dist/
cp worker/src/worker.js dist/_worker.js
```

Expected: `dist/recipe-library.json` exists and `dist/` remains ignored by Git.

- [ ] **Step 5: Run a local 30-case live smoke test**

Start `python3 ai_proxy.py` in one terminal session. In another run:

```bash
node tools/run-recipe-regression.mjs --base http://localhost:8765 --limit 30
```

Expected: 30 responses contain base recipe IDs, pairing basis, and zero validation flags. Any failure must be recorded in `docs/recipe-validation-review.md` and fixed before preview deployment.

- [ ] **Step 6: Verify the mobile user journey locally**

Serve the frontend on `http://localhost:8081`. Test at a mobile viewport:

1. Enter `鸡肉、大米、洋葱、葡萄干`; verify the result is grounded in the biryani family.
2. Add `白菜`; verify it may appear under “这次没用” with a concrete reason instead of being forced into the recipe.
3. Tap “换一换”; verify the next accepted result has a different `base_recipe_id` or family.
4. Enter `鸡蛋过敏`; verify no egg recipe is displayed.
5. Confirm source details show title, HTTPS link, attribution, and license.

- [ ] **Step 7: Create a preview deployment only after local gates pass**

Use an ASCII commit message and a non-main preview branch:

```bash
npx wrangler pages deploy dist --project-name yiguochu --branch recipe-validation --commit-dirty=true --commit-message "recipe validation preview" | tee /tmp/yiguochu-recipe-preview.log
```

Expected: Wrangler prints a preview URL under `*.yiguochu.pages.dev`; do not promote it to production.

- [ ] **Step 8: Verify preview health and browser CORS**

Run:

```bash
PREVIEW_URL="$(rg -o 'https://[A-Za-z0-9.-]+\.pages\.dev' /tmp/yiguochu-recipe-preview.log | tail -1)"
test -n "$PREVIEW_URL"
curl -sS "$PREVIEW_URL/health"
curl -i -sS -H "Origin: $PREVIEW_URL" "$PREVIEW_URL/health"
```

Expected health fields are `recipeLibrary:"ok"`, `recipeFamilies:9`, and `baseRecipes:12`; the CORS response must reflect `$PREVIEW_URL`.

- [ ] **Step 9: Commit documentation only; never commit `dist/`**

```bash
git add CLAUDE.md 部署说明.md
git commit -m "docs: add recipe library validation workflow"
```

---

## Phase A Exit Gate

Do not begin the 150–200 recipe expansion until all of these are true:

- 12/12 base recipes pass source and schema checks.
- 100/100 static regression cases pass.
- 30/30 local live cases return trusted IDs and no validation flags.
- 0 allergen leaks.
- 0 listed-but-unused non-seasoning ingredients.
- 0 poultry, pork, seafood, or egg items without explicit cooking evidence.
- The mobile flow clearly shows pairing basis, unused pantry items, and source attribution.
- “换一换” produces a genuinely different accepted base recipe or family.
- The user reviews the 30-case sheet and approves moving to the separate 150–200 recipe expansion plan.

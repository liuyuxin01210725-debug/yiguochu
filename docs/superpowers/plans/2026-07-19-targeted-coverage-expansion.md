# 一锅出定向覆盖扩库 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在不修改选菜权重的前提下，新增 30 道 `auto_approved` 一锅主餐，使七个固定食材旅程各有至少 5 道全量命中候选、至少覆盖 4 个烹饪 family，并保持来源、营养、忌口与熟制红线。

**Architecture:** 沿用现有 candidate → draft → promotion → production 四层数据流，新增一套与原 30 道传统菜完全隔离的覆盖扩库清单。现有候选/草稿 schema 校验器继续复用；新 promotion gate 固定 30 个身份映射，并额外校验覆盖深度、family 分散度、来源边界和生产状态。30 道生产条目先在临时批次文件中逐组通过测试，全部完成后一次性并入正式运行库并删除临时文件，避免中间提交形成半批次可发布状态。Worker 与 Python 不改评分算法，只同步新增的安全 alias；前端仍从同一正式生产库读取。

**Tech Stack:** JSON 数据文件、Node.js ESM、`node:test`、Cloudflare Pages Worker、Python 3 本地代理、单文件 PWA。

## Global Constraints

- 只进入 Phase A `recipe-validation` 预览；本计划不部署 production `main`。
- 保留原 42 道、原 30 条传统菜 promotion identity 和原 100 例回归，不改写它们来制造通过。
- 新增后精确计数为 21 families、72 recipes、12 `approved`、60 `auto_approved`。
- HowToCook 仅作菜名、常见搭配和高层技法的事实线索。仓库根许可证为 Unlicense，但项目仍不得把第三方文字、图片、精确用量、步骤或营养数据复制进生产库。
- 每道菜独立记录至少一个 HTTPS 直达来源；组合菜若单一来源不能支持完整组合，使用多条 `basis_refs` 分别支持搭配和技法。
- 不新增营养数字。确需新增本地 `FOODS` 条目时，必须另走《加新食材 SOP》，并记录台湾食药署 code 或其他权威 ID。
- 剩米饭只映射为妥善冷藏的 `熟米饭`，绝不映射成生 `大米`；生产安全文案必须要求充分复热。
- 不调整 `PANTRY_WEIGHT`、family penalty、swap intent、seed jitter、短名单宽度或历史排除规则。
- 工作树已有大量用户改动。每次只 path-specific stage 本任务文件，不暂存、不改写、不回滚无关文件。

---

## Fixed Identities

新 family 固定为：

```js
const COVERAGE_FAMILIES = [
  ['family-home-fried-rice', '家常炒饭', '炒饭'],
  ['family-home-braised-rice', '家常焖饭', '焖饭'],
  ['family-home-stewed-rice', '汤汁烩饭', '烩饭'],
  ['family-home-soup-staple', '一锅汤主食', '汤饭/汤面'],
  ['family-home-covered-pot', '加盖饭锅', '饭锅'],
  ['family-home-vermicelli-pot', '一锅粉丝煲', '粉丝煲'],
];
```

`白菜土豆鸡腿焖面` 复用现有 `family-northern-braised-noodles`。30 个生产 ID 与 family 映射固定为：

```js
export const COVERAGE_PROMOTION_MATRIX = new Map([
  ['home-egg-fried-leftover-rice', 'family-home-fried-rice'],
  ['tomato-egg-stewed-leftover-rice', 'family-home-stewed-rice'],
  ['greens-egg-braised-leftover-rice', 'family-home-braised-rice'],
  ['mushroom-egg-covered-leftover-rice', 'family-home-covered-pot'],
  ['shrimp-egg-fried-leftover-rice', 'family-home-fried-rice'],

  ['broccoli-beef-fried-rice', 'family-home-fried-rice'],
  ['broccoli-beef-braised-rice', 'family-home-braised-rice'],
  ['tomato-broccoli-beef-stewed-rice', 'family-home-stewed-rice'],
  ['broccoli-beef-soup-noodles', 'family-home-soup-staple'],
  ['potato-broccoli-beef-covered-rice', 'family-home-covered-pot'],

  ['greens-tofu-fried-rice', 'family-home-fried-rice'],
  ['cabbage-tofu-braised-rice', 'family-home-braised-rice'],
  ['tomato-tofu-stewed-rice', 'family-home-stewed-rice'],
  ['greens-tofu-soup-noodles', 'family-home-soup-staple'],
  ['mushroom-greens-tofu-covered-rice', 'family-home-covered-pot'],

  ['chicken-leg-potato-braised-rice', 'family-home-braised-rice'],
  ['chicken-leg-mushroom-stewed-rice', 'family-home-stewed-rice'],
  ['tomato-chicken-leg-soup-rice', 'family-home-soup-staple'],
  ['corn-carrot-chicken-leg-covered-rice', 'family-home-covered-pot'],
  ['cabbage-potato-chicken-leg-braised-noodles', 'family-northern-braised-noodles'],

  ['greens-sausage-fried-rice', 'family-home-fried-rice'],
  ['greens-minced-pork-braised-rice', 'family-home-braised-rice'],
  ['cabbage-egg-soup-rice', 'family-home-soup-staple'],
  ['greens-tofu-vermicelli-pot', 'family-home-vermicelli-pot'],
  ['greens-chicken-leg-soup-noodles', 'family-home-soup-staple'],

  ['green-bean-pork-rib-braised-rice', 'family-home-braised-rice'],
  ['potato-pork-rib-stewed-rice', 'family-home-stewed-rice'],
  ['tomato-potato-pork-rib-covered-rice', 'family-home-covered-pot'],
  ['mushroom-green-bean-pork-rib-braised-rice', 'family-home-braised-rice'],
  ['cabbage-potato-pork-rib-soup-rice', 'family-home-soup-staple'],
]);
```

每条 `draft_id` 固定为 `${recipe_id}-draft`，每条 `candidate_id` 固定等于 `recipe_id`。

固定旅程：

```js
export const COVERAGE_JOURNEYS = [
  { id: 'leftover-rice-egg', pantry: ['剩米饭', '鸡蛋'], minRecipes: 5, minFamilies: 4 },
  { id: 'broccoli-beef', pantry: ['西兰花', '牛肉'], minRecipes: 5, minFamilies: 4 },
  { id: 'tofu-greens', pantry: ['豆腐', '青菜'], minRecipes: 5, minFamilies: 4 },
  { id: 'chicken-leg-potato', pantry: ['鸡腿肉', '土豆'], minRecipes: 5, minFamilies: 4 },
  { id: 'leafy-greens', pantry: ['青菜'], minRecipes: 5, minFamilies: 4 },
  { id: 'ribs-potato', pantry: ['排骨', '土豆'], minRecipes: 5, minFamilies: 4 },
  { id: 'ribs-green-bean', pantry: ['排骨', '豆角'], minRecipes: 5, minFamilies: 4 },
];
```

---

### Task 1: Lock the new batch contract with failing tests

**Files:**

- Create: `tools/tests/coverage-recipe-promotion.test.mjs`
- Create: `tools/lib/coverage-recipe-promotion-gate.mjs`

- [ ] **Step 1: Write the failing matrix/count test first**

The test must import `COVERAGE_PROMOTION_MATRIX`, assert the exact 30 IDs above, and assert each mapping contains:

```js
{
  candidate_id: recipeId,
  draft_id: `${recipeId}-draft`,
  family_id: expectedFamilyId,
}
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
node --test tools/tests/coverage-recipe-promotion.test.mjs
```

Expected: FAIL because `tools/lib/coverage-recipe-promotion-gate.mjs` or the fixed matrix does not exist.

- [ ] **Step 3: Implement the fixed matrix and exported journeys**

Export:

```js
export const COVERAGE_PROMOTION_MATRIX = new Map(/* exact matrix above */);
export const COVERAGE_JOURNEYS = [/* exact journeys above */];
export function validateCoverageRecipePromotion(input) { /* returns string[] */ }
```

Initial validator responsibilities:

- exactly 30 promotion records;
- no duplicate `recipe_id`, `draft_id`, or `candidate_id`;
- manifest mapping equals the fixed matrix;
- `canonical_path === /recipes.html?id=${recipe_id}`;
- linked candidate exists with `status: "candidate"`;
- linked draft exists and references the candidate;
- linked production recipe exists with `status: "auto_approved"`;
- production `origin_candidate_id`, `family_id`, `cuisine`, `purposes`, and `total_time_minutes` equal manifest values;
- canonical source is the project-owned recipe page with complete metadata;
- no identity placeholders and no production ingredients outside draft semantics;
- every target group has five mapped recipes and at least four family IDs.

Reuse small pure helpers from `traditional-recipe-promotion-gate.mjs` only after exporting them without changing traditional-gate behavior; otherwise copy the minimal generic helpers into the new module and keep target-specific matrices separate.

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run:

```bash
node --test tools/tests/coverage-recipe-promotion.test.mjs
```

Expected: matrix/unit-fixture tests pass; file-backed tests added in later tasks may still be absent.

- [ ] **Step 5: Commit only this contract**

```bash
git add tools/lib/coverage-recipe-promotion-gate.mjs tools/tests/coverage-recipe-promotion.test.mjs
git commit -m "test: lock targeted recipe expansion contract"
```

---

### Task 2: Build the 30-entry factual source ledger

**Files:**

- Create: `tools/data/coverage-recipe-candidates.json`
- Create: `tools/check-coverage-recipe-candidates.mjs`
- Modify: `tools/tests/coverage-recipe-promotion.test.mjs`

- [ ] **Step 1: Add file-backed tests before the ledger**

Tests must assert:

- `validateRecipeCandidateLedger(ledger)` returns `[]`;
- exactly 30 entries and exact ID order from `COVERAGE_PROMOTION_MATRIX`;
- every entry is `candidate`, not `approved`;
- every entry has at least one HTTPS `basis_refs` item;
- `rights_note` is exactly `事实溯源；不复制页面文字、图片或完整菜谱。`;
- `excluded_scope` includes all four of `exact_quantities`, `step_text`, `nutrition`, `safety`;
- no source URL is `yiguochu.pages.dev`, RecipeDB, a search-results URL, or a generic site home page;
- no claim contains exact quantities, nutrition values, or ordered step prose.

- [ ] **Step 2: Run and confirm RED**

```bash
node --test tools/tests/coverage-recipe-promotion.test.mjs
```

Expected: FAIL because `coverage-recipe-candidates.json` is missing.

- [ ] **Step 3: Research and record primary facts**

Use official/source-direct pages. Start with the official HowToCook repository and its root `LICENSE`, then use direct recipe files or government/public cultural sources. The confirmed repository facts are:

- official project: `https://github.com/Anduin2017/HowToCook`;
- root license: `https://github.com/Anduin2017/HowToCook/blob/master/LICENSE`;
- relevant direct entries visible from the official index include 蛋炒饭、包菜炒鸡蛋粉丝、炒青菜、蒜蓉西兰花、西红柿豆腐汤羹、葱烧鸡腿、香菇滑鸡、土豆炖排骨、豆角焖面、西红柿鸡蛋挂面、咸肉菜饭。

For composed variants, do not claim the whole new dish is traditional. Use `region: "中国家庭"`, `cuisine: "中式家常"`, and `traditional_basis` such as “以已公开的 A 搭配事实与 B 一锅技法为基础的项目原创适配方向”。 Add two refs where pairing and one-pot form come from different pages.

- [ ] **Step 4: Create the checker**

`tools/check-coverage-recipe-candidates.mjs` must load the new ledger, call `validateRecipeCandidateLedger`, assert exact 30/0-production semantics, and print:

```text
覆盖扩库候选 30 道 · 生产可用 0 道
✅ 覆盖扩库候选册体检通过
```

- [ ] **Step 5: Run focused validation**

```bash
node tools/check-coverage-recipe-candidates.mjs
node --test tools/tests/coverage-recipe-promotion.test.mjs
```

Expected: both pass; no production library changes yet.

- [ ] **Step 6: Commit the source ledger**

```bash
git add tools/data/coverage-recipe-candidates.json tools/check-coverage-recipe-candidates.mjs tools/tests/coverage-recipe-promotion.test.mjs
git commit -m "data: add targeted recipe source ledger"
```

---

### Task 3: Author the 30 original one-pot drafts

**Files:**

- Create: `tools/data/coverage-recipe-drafts.json`
- Create: `tools/check-coverage-recipe-drafts.mjs`
- Modify: `tools/tests/coverage-recipe-promotion.test.mjs`

- [ ] **Step 1: Add failing draft-contract tests**

Assert:

- `validateRecipeDraftLibrary(drafts, candidates)` returns `[]`;
- exactly 30 drafts, one for every matrix entry;
- each draft ID is `${candidate_id}-draft`;
- each draft has 1–4 steps in `technique_outline`;
- each draft contains an explicit usable carb/liquid rule in `draft_ratio_rules`;
- all chicken leg, beef, rib and shrimp drafts have an ingredient-specific `food_safety` gate;
- egg drafts require full coagulation or full reheating as appropriate;
- green-bean drafts require full cooking;
- all leftover-rice drafts state refrigerated cooked rice and thorough reheating;
- no draft text claims to reproduce a regional authentic product.

- [ ] **Step 2: Run and confirm RED**

```bash
node --test tools/tests/coverage-recipe-promotion.test.mjs
```

Expected: FAIL because `coverage-recipe-drafts.json` is missing.

- [ ] **Step 3: Write all 30 project-original drafts**

Use `serving_range: [2, 4]`. Keep `adaptation_summary`, ratios, step language, safety language and trial requirements original. All recipes must remain a one-pot process; “先盛出、后回锅” is allowed, a second pot is not.

For all five rib drafts, include this structured slot:

```json
{
  "slot": "耐煮蔬菜",
  "replaces": ["土豆"],
  "allowed": ["豆角"]
}
```

For recipes whose base uses 豆角, reverse `replaces` and `allowed`. Draft semantics must therefore authorize both fixed rib journeys without fuzzy aliasing.

- [ ] **Step 4: Create and run the draft checker**

The checker loads the coverage candidate/draft files, calls `validateRecipeDraftLibrary`, asserts exact 30, and prints:

```text
覆盖扩库草案 30 道 · 生产可用 0 道
✅ 覆盖扩库草案体检通过
```

Run:

```bash
node tools/check-coverage-recipe-drafts.mjs
node --test tools/tests/coverage-recipe-promotion.test.mjs
```

Expected: pass.

- [ ] **Step 5: Commit the drafts**

```bash
git add tools/data/coverage-recipe-drafts.json tools/check-coverage-recipe-drafts.mjs tools/tests/coverage-recipe-promotion.test.mjs
git commit -m "data: add targeted one-pot recipe drafts"
```

---

### Task 4: Add the promotion manifest and six real form families

**Files:**

- Create: `tools/data/coverage-recipe-promotions.json`
- Create: `tools/data/coverage-recipe-production.json`（临时批次文件，Task 11 合并后删除）
- Create: `tools/check-coverage-recipe-promotion.mjs`
- Modify: `tools/tests/coverage-recipe-promotion.test.mjs`

- [ ] **Step 1: Add failing manifest/staging-family tests**

Assert exact 30 manifest rows, exact mapping/order, exact `canonical_path`, and the six new families. The temporary production batch has this shape:

```json
{
  "schema_version": 1,
  "families": [],
  "recipes": []
}
```

At this task it contains all six families and zero recipes. The focused test checks only the six family IDs; the all-30 file-backed gate test is deliberately added at Task 10, so `node --test tools/tests/*.test.mjs` remains green between groups.

- [ ] **Step 2: Run and confirm RED**

```bash
node --test tools/tests/coverage-recipe-promotion.test.mjs
```

Expected: FAIL on missing manifest and staging file.

- [ ] **Step 3: Add manifest records**

Each record has exactly:

```json
{
  "recipe_id": "home-egg-fried-leftover-rice",
  "draft_id": "home-egg-fried-leftover-rice-draft",
  "candidate_id": "home-egg-fried-leftover-rice",
  "family_id": "family-home-fried-rice",
  "cuisine": "中式家常",
  "purposes": ["pantry", "quick", "comfort"],
  "total_time_minutes": 20,
  "canonical_path": "/recipes.html?id=home-egg-fried-leftover-rice",
  "identity_resolution": "项目原创的一锅家常适配；只使用明确命名的常见食品级食材。"
}
```

Times vary by real process: leftover rice 15–30 minutes; tofu/leafy recipes 20–35; chicken/beef 30–45; rib recipes 45–60. Do not use a time shorter than the food-safety process.

- [ ] **Step 4: Add six family objects to the temporary production batch**

Write the exact six family IDs from `Fixed Identities`; do not yet modify `tools/data/recipe-library.json` and do not repurpose or rename any original family.

- [ ] **Step 5: Create the checker**

`tools/check-coverage-recipe-promotion.mjs` loads candidates, drafts, promotions, the temporary production batch and the current production aliases, builds an in-memory merged library, calls `validateCoverageRecipePromotion`, and exits nonzero until all 30 staged production recipes exist. That standalone checker RED state is expected through Tasks 5–9; it is not called by the all-tests command until Task 10.

- [ ] **Step 6: Run focused checks**

```bash
node --test tools/tests/coverage-recipe-promotion.test.mjs
node tools/check-coverage-recipe-promotion.mjs
```

Expected: unit/family tests pass; standalone checker fails only with deterministic “production recipe … is missing” errors for the 30 not-yet-added recipes.

- [ ] **Step 7: Commit manifest and families**

```bash
git add tools/data/coverage-recipe-promotions.json tools/data/coverage-recipe-production.json tools/check-coverage-recipe-promotion.mjs tools/tests/coverage-recipe-promotion.test.mjs
git commit -m "data: add targeted promotion manifest and families"
```

---

### Task 5: Add five leftover-rice and egg recipes

**Files:**

- Modify: `tools/data/coverage-recipe-production.json`
- Modify: `tools/data/recipe-library.json`（仅加入生熟安全 alias，不加入新菜谱）
- Modify: `worker/src/worker.js`
- Modify: `ai_proxy.py`
- Modify: `tools/tests/worker-recipe.test.mjs`
- Modify: `tools/tests/recipe-parity.test.mjs`
- Modify: `tools/tests/coverage-recipe-promotion.test.mjs`

- [ ] **Step 1: Add failing alias and group tests**

Test `剩米饭` and `隔夜米饭` normalize to `熟米饭`, while `大米` remains `大米`. Test the five staged group recipe IDs在“当前正式库 + 临时批次”组成的内存库中全量覆盖 `['剩米饭', '鸡蛋']`，并跨至少四个 families。

- [ ] **Step 2: Run and confirm RED**

```bash
node --test tools/tests/worker-recipe.test.mjs tools/tests/recipe-parity.test.mjs tools/tests/coverage-recipe-promotion.test.mjs
```

Expected: alias and five-staged-recipe tests fail.

- [ ] **Step 3: Add safe cooked-rice aliases in all selection runtimes**

Add only recipe-selection aliases, mirrored in JSON/Worker/Python:

```json
"剩米饭": "熟米饭",
"隔夜米饭": "熟米饭"
```

Do not add `熟米饭 → 大米` or any nutrition alias that collapses cooked and raw states.

- [ ] **Step 4: Add the five production-form recipes to the temporary batch**

Use the exact first five IDs. Every recipe must include `熟米饭` and `鸡蛋` in approved core/slot semantics, explicit egg endpoint, cooked-rice refrigeration/reheat rule, 1–4 technique steps, canonical project source, `protein_class: ["蛋"]`, and truthful `unused_pantry` behavior.

- [ ] **Step 5: Run focused tests**

```bash
node --test tools/tests/worker-recipe.test.mjs tools/tests/recipe-parity.test.mjs tools/tests/coverage-recipe-promotion.test.mjs
python3 -m py_compile ai_proxy.py
```

Expected: focused tests and the complete project test suite pass; the standalone 30-production promotion checker still reports 25 missing recipes.

- [ ] **Step 6: Commit only this group**

```bash
git add tools/data/coverage-recipe-production.json tools/data/recipe-library.json worker/src/worker.js ai_proxy.py tools/tests/worker-recipe.test.mjs tools/tests/recipe-parity.test.mjs tools/tests/coverage-recipe-promotion.test.mjs
git commit -m "feat: add leftover rice egg recipes"
```

---

### Task 6: Add five broccoli and beef recipes

**Files:**

- Modify: `tools/data/coverage-recipe-production.json`
- Modify: `tools/tests/coverage-recipe-promotion.test.mjs`
- Modify: `tools/tests/worker-recipe.test.mjs`

- [ ] **Step 1: Add failing real-selector coverage test**

For `['西兰花', '牛肉']`, use the in-memory merged library and assert theoretical maximum coverage is 2, five distinct selected recipe IDs are available as `recent_base_recipes` grows, and at least four family IDs appear.

- [ ] **Step 2: Run and confirm RED**

```bash
node --test tools/tests/coverage-recipe-promotion.test.mjs tools/tests/worker-recipe.test.mjs
```

Expected: fewer than five full-coverage candidates.

- [ ] **Step 3: Add exact recipes 6–10**

Every entry must include 西兰花 and 牛肉 in core/authorized slot semantics, `protein_class: ["牛"]`, explicit beef full-cook endpoint, and a step order that does not overcook broccoli. No recipe may win by using only one of the two pantry items.

- [ ] **Step 4: Run and commit**

```bash
node --test tools/tests/coverage-recipe-promotion.test.mjs tools/tests/worker-recipe.test.mjs
git add tools/data/coverage-recipe-production.json tools/tests/coverage-recipe-promotion.test.mjs tools/tests/worker-recipe.test.mjs
git commit -m "feat: add broccoli beef recipes"
```

Expected: group tests pass; batch checker reports 20 missing recipes.

---

### Task 7: Add five tofu and greens recipes

**Files:**

- Modify: `tools/data/coverage-recipe-production.json`
- Modify: `tools/tests/coverage-recipe-promotion.test.mjs`
- Modify: `tools/tests/worker-recipe.test.mjs`

- [ ] **Step 1: Add failing `豆腐+青菜` journey test**

The test must use the public input names, verify aliases/slots resolve without fuzzy substring expansion, and require five full-coverage results over at least four families.

- [ ] **Step 2: Run RED, add recipes 11–15, run GREEN**

```bash
node --test tools/tests/coverage-recipe-promotion.test.mjs tools/tests/worker-recipe.test.mjs
```

Production entries must use `老豆腐` where the existing exact alias maps `豆腐 → 老豆腐`; leafy options belong in explicit slots. Keep `protein_class: ["豆类"]` and never `['无']`.

- [ ] **Step 3: Commit**

```bash
git add tools/data/coverage-recipe-production.json tools/tests/coverage-recipe-promotion.test.mjs tools/tests/worker-recipe.test.mjs
git commit -m "feat: add tofu greens recipes"
```

Expected: batch checker reports 15 missing recipes.

---

### Task 8: Add five chicken-leg and common-vegetable recipes

**Files:**

- Modify: `tools/data/coverage-recipe-production.json`
- Modify: `tools/tests/coverage-recipe-promotion.test.mjs`
- Modify: `tools/tests/worker-recipe.test.mjs`

- [ ] **Step 1: Add failing `鸡腿肉+土豆` journey and safety tests**

Require five full-coverage candidates, at least four families, `protein_class: ["鸡"]`, and an ingredient-specific chicken endpoint in every recipe.

- [ ] **Step 2: Run RED, add recipes 16–20, run GREEN**

```bash
node --test tools/tests/coverage-recipe-promotion.test.mjs tools/tests/worker-recipe.test.mjs
```

All five must authorize 土豆 so the fixed journey reaches five; recipes whose visible title uses another vegetable must provide a truthful structured potato slot, not a broad optional list. The braised-noodle recipe reuses `family-northern-braised-noodles`.

- [ ] **Step 3: Commit**

```bash
git add tools/data/coverage-recipe-production.json tools/tests/coverage-recipe-promotion.test.mjs tools/tests/worker-recipe.test.mjs
git commit -m "feat: add chicken leg vegetable recipes"
```

Expected: batch checker reports 10 missing recipes.

---

### Task 9: Add five household leafy-green recipes

**Files:**

- Modify: `tools/data/coverage-recipe-production.json`
- Modify: `tools/tests/coverage-recipe-promotion.test.mjs`
- Modify: `tools/tests/worker-recipe.test.mjs`

- [ ] **Step 1: Add failing generic-green journey test**

For pantry `['青菜']`, require five distinct candidates and at least four families. Assert no recipe claims an unused named leaf was supplied by the user.

- [ ] **Step 2: Run RED, add recipes 21–25, run GREEN**

```bash
node --test tools/tests/coverage-recipe-promotion.test.mjs tools/tests/worker-recipe.test.mjs
```

Each recipe must expose an explicit `叶菜` substitution slot whose allowed list contains `青菜` plus only reviewed common leaves. The sausage, minced-pork and chicken recipes must carry correct `protein_class`; tofu is `豆类`; egg is `蛋`.

- [ ] **Step 3: Commit**

```bash
git add tools/data/coverage-recipe-production.json tools/tests/coverage-recipe-promotion.test.mjs tools/tests/worker-recipe.test.mjs
git commit -m "feat: add household leafy green recipes"
```

Expected: batch checker reports five missing recipes.

---

### Task 10: Add five rib recipes with symmetric potato/green-bean slots

**Files:**

- Modify: `tools/data/coverage-recipe-production.json`
- Modify: `tools/tests/coverage-recipe-promotion.test.mjs`
- Modify: `tools/tests/worker-recipe.test.mjs`

- [ ] **Step 1: Add two failing rib journey tests**

Run the real selector separately for `['排骨', '土豆']` and `['排骨', '豆角']`. Each journey must produce five full-coverage candidates, at least four families, and no `validation_flags` in deterministic base-recipe validation.

- [ ] **Step 2: Run and confirm RED**

```bash
node --test tools/tests/coverage-recipe-promotion.test.mjs tools/tests/worker-recipe.test.mjs
```

- [ ] **Step 3: Add recipes 26–30**

Every recipe uses `猪肋排`, `protein_class: ["猪"]`, a rib full-cook endpoint, and a structured `耐煮蔬菜` slot authorizing both 土豆 and 豆角. Every recipe’s safety rules must state 豆角彻底熟透 whenever the slot permits 豆角.

- [ ] **Step 4: Add the all-30 file-backed gate test and run the complete batch gate**

Only now add the test asserting `validateCoverageRecipePromotion` returns `[]` for the real candidate, draft, manifest and staged-production files. Before this task, unit fixtures and completed-group tests remain green without pretending the incomplete batch is releasable.

```bash
node tools/check-coverage-recipe-promotion.mjs
node --test tools/tests/coverage-recipe-promotion.test.mjs tools/tests/worker-recipe.test.mjs
```

Expected:

```text
覆盖扩库晋升 30/30 · 目标旅程 7/7
✅ 覆盖扩库晋升闸门通过
```

- [ ] **Step 5: Commit**

```bash
git add tools/data/coverage-recipe-production.json tools/tests/coverage-recipe-promotion.test.mjs tools/tests/worker-recipe.test.mjs
git commit -m "feat: add potato green bean rib recipes"
```

---

### Task 11: Make the main gates understand 72 recipes without weakening the old batch

**Files:**

- Modify: `tools/check-recipes.mjs`
- Modify: `tools/check-recipe-drafts.mjs`
- Modify: `tools/lib/recipe-candidate-release-gate.mjs`
- Modify: `tools/lib/recipe-draft-release-gate.mjs`
- Modify: `tools/lib/recipe-library-validator.mjs`
- Modify: `tools/tests/recipe-candidates.test.mjs`
- Modify: `tools/tests/recipe-drafts.test.mjs`
- Modify: `tools/tests/recipe-library.test.mjs`
- Modify: `tools/tests/traditional-recipe-promotion.test.mjs`
- Modify: `tools/tests/frontend-recipe-contract.test.mjs`
- Modify: `tools/tests/recipes-canonical-page.test.mjs`
- Modify: `tools/tests/build-dist.test.mjs`
- Modify: `tools/data/recipe-library.json`
- Delete: `tools/data/coverage-recipe-production.json`
- Modify: `CLAUDE.md`
- Modify: `部署说明.md`
- Modify: `docs/recipe-validation-review.md`

- [ ] **Step 1: Add failing final-count, atomic-merge and old-batch isolation tests**

Assert:

- production totals are exactly 21/72/12/60;
- original traditional candidate/draft/promotion files remain exactly 30 and byte-identical to the pre-expansion baseline except already-existing user edits;
- `PROMOTION_MATRIX` remains 30 and only maps the original traditional batch;
- `COVERAGE_PROMOTION_MATRIX` remains 30 and only maps the new batch;
- no candidate ID appears in both matrices;
- all 60 `auto_approved` entries are owned by exactly one promotion gate;
- all 12 `approved` fixtures remain unchanged.
- no temporary production batch file remains after the merge.

- [ ] **Step 2: Run and confirm RED on hard-coded 42/15 assertions**

```bash
node --test tools/tests/recipe-candidates.test.mjs tools/tests/recipe-drafts.test.mjs tools/tests/recipe-library.test.mjs tools/tests/traditional-recipe-promotion.test.mjs
```

Expected: failures point only to obsolete global production counts.

- [ ] **Step 3: Atomically merge the batch, then separate batch invariants from global totals**

Append the six staged families and 30 staged recipes to `tools/data/recipe-library.json`, then delete `tools/data/coverage-recipe-production.json`. Keep all old ledgers at exactly 30. Change only global production expectations to 72 recipes, 21 families, 12 `approved`, 60 `auto_approved`. Update the coverage checker/gate to read the merged production library. Integrate `validateCoverageRecipePromotion` into `tools/check-recipes.mjs` so the mandatory pre-deploy command fails if the new batch drifts.

- [ ] **Step 4: Update truthful docs/UI contracts**

Update counts and language to say:

```text
72 道基础菜谱：12 道人工批准，60 道自动闸门通过、待人工评审。
```

Do not claim 60 human approvals or 60 real-world trial cooks. Add 30 new review rows to `docs/recipe-validation-review.md` with status “待人工评审”; do not pre-check any manual-review box.

- [ ] **Step 5: Run all structural gates**

```bash
node tools/check-recipe-candidates.mjs
node tools/check-recipe-drafts.mjs
node tools/check-traditional-recipe-promotion.mjs
node tools/check-coverage-recipe-candidates.mjs
node tools/check-coverage-recipe-drafts.mjs
node tools/check-coverage-recipe-promotion.mjs
node tools/check-recipes.mjs
```

Expected: seven commands exit 0; old traditional counts remain 30 and new coverage counts report 30.

- [ ] **Step 6: Commit gate integration**

```bash
git add tools/check-recipes.mjs tools/check-recipe-drafts.mjs tools/check-coverage-recipe-promotion.mjs tools/lib/recipe-candidate-release-gate.mjs tools/lib/recipe-draft-release-gate.mjs tools/lib/recipe-library-validator.mjs tools/data/recipe-library.json tools/data/coverage-recipe-production.json tools/tests/recipe-candidates.test.mjs tools/tests/recipe-drafts.test.mjs tools/tests/recipe-library.test.mjs tools/tests/traditional-recipe-promotion.test.mjs tools/tests/frontend-recipe-contract.test.mjs tools/tests/recipes-canonical-page.test.mjs tools/tests/build-dist.test.mjs CLAUDE.md 部署说明.md docs/recipe-validation-review.md
git commit -m "chore: integrate targeted recipe release gates"
```

---

### Task 12: Add end-to-end coverage journeys and complete verification

**Files:**

- Create: `tools/data/coverage-recipe-regression.json`
- Create: `tools/run-coverage-recipe-regression.mjs`
- Create: `tools/tests/coverage-recipe-regression.test.mjs`
- Modify: `tools/tests/recipe-parity.test.mjs`
- Modify: `tools/tests/build-dist.test.mjs`

- [ ] **Step 1: Add a failing seven-journey regression test**

The runner must use the actual production library and actual selector behavior. For every journey:

1. calculate the theoretical maximum pantry coverage across safe eligible recipes;
2. generate/select five times while appending each selected recipe to `recent_base_recipes`;
3. assert five distinct recipe IDs;
4. assert every selection equals theoretical maximum coverage;
5. assert at least four distinct family IDs;
6. assert `unused_pantry` is exactly the set difference between submitted pantry and selected `usedPantry`;
7. assert zero hard safety flags.

- [ ] **Step 2: Run focused regression**

```bash
node --test tools/tests/coverage-recipe-regression.test.mjs tools/tests/recipe-parity.test.mjs
node tools/run-coverage-recipe-regression.mjs
```

Expected:

```text
覆盖旅程 7/7 · 五连换 35/35 · 食材覆盖不退步 35/35
```

- [ ] **Step 3: Verify Worker/Python parity**

For all seven journeys and at least two history sequences, assert Worker and Python return the same ordered candidate IDs and coverage counts. Keep the Python subprocess timeout at 15000 ms or more; never reintroduce 1500 ms.

- [ ] **Step 4: Run the entire suite**

```bash
node --test tools/tests/*.test.mjs
node tools/check-foods.mjs
node tools/check-recipe-candidates.mjs
node tools/check-recipe-drafts.mjs
node tools/check-traditional-recipe-promotion.mjs
node tools/check-coverage-recipe-candidates.mjs
node tools/check-coverage-recipe-drafts.mjs
node tools/check-coverage-recipe-promotion.mjs
node tools/check-recipes.mjs
node tools/run-recipe-regression.mjs
node tools/run-coverage-recipe-regression.mjs
python3 -m py_compile ai_proxy.py
```

Expected: zero failures; original static regression remains 100/100; new coverage regression is 7/7 and 35/35.

- [ ] **Step 5: Build and compare deployable assets**

```bash
node tools/build-dist.mjs --build-id coverage-preview-20260719
cmp index.html dist/index.html || true
cmp recipes.html dist/recipes.html
cmp tools/data/recipe-library.json dist/recipe-library.json
cmp worker/src/worker.js dist/_worker.js
```

Expected: `recipes.html`, library, and Worker compare byte-identical. `index.html` differs only because build ID injection is expected; `node --test tools/tests/build-dist.test.mjs` must prove that difference is controlled.

- [ ] **Step 6: Manual local smoke without spending API budget**

Use fixture/stub responses to walk:

- first load;
- two-item pantry submission;
- five consecutive “换一换” actions;
- “开始做” history write;
- next-session exclusion;
- allergy input that conflicts with a core ingredient;
- exhausted-history clear-and-restart path.

Record results in a new dated section of `docs/recipe-validation-review.md`; do not mark live DeepSeek or real cooking as passed.

- [ ] **Step 7: Final commit**

```bash
git add tools/data/coverage-recipe-regression.json tools/run-coverage-recipe-regression.mjs tools/tests/coverage-recipe-regression.test.mjs tools/tests/recipe-parity.test.mjs tools/tests/build-dist.test.mjs docs/recipe-validation-review.md
git commit -m "test: verify targeted recipe coverage journeys"
```

Stop here. Preview deployment is a separate authorized action and must use the non-`main` `recipe-validation` branch with an ASCII Wrangler commit message.

---

## Final Acceptance Checklist

- [ ] 30/30 candidates have direct HTTPS source evidence and facts-only rights boundaries.
- [ ] 30/30 drafts are original, one-pot, 1–4 steps, with ratios and food-safety gates.
- [ ] 30/30 promotions map exactly candidate → draft → production.
- [ ] Production total is 72; statuses are exactly 12 `approved` + 60 `auto_approved`.
- [ ] Seven fixed journeys each have ≥5 full-coverage recipes and ≥4 families.
- [ ] Five-swap test yields 35/35 distinct within each journey history window.
- [ ] No selected recipe sacrifices pantry coverage for jitter or family diversity.
- [ ] Allergen matching covers core, optional, generation-optional and substitution ingredients.
- [ ] Cooked rice never aliases to raw rice; meat/egg/green-bean endpoints are explicit.
- [ ] Original 100/100 regression remains green.
- [ ] Worker/Python selector parity remains green.
- [ ] `node tools/check-recipes.mjs` enforces both old and new promotion batches.
- [ ] Build artifacts match canonical source inputs.
- [ ] No production `main` deployment performed.

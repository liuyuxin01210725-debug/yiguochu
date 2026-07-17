# Traditional Recipe Promotion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** 将 30 道成熟地方一锅菜转为可在正式库中稳定选择的项目原创标准配方，并保持来源、食材边界和运行时安全可验证。

**Architecture:** 新增一份传统菜晋升清单，明确每个候选、草案和正式配方的三方映射、家族、项目原创来源页与身份敏感适配。跨库晋升闸门从候选册、草案册和正式库同时读取数据；正式库保持运行时唯一数据源。静态 recipes.html 只读展示对应正式条目，作为项目原创 canonical 来源页。

**Tech Stack:** Node.js 内置 node:test、ESM、JSON、单文件 HTML、Cloudflare Pages 静态资源与现有 Worker/Python 代理。

## Global Constraints

- 只处理现有 30 道传统候选；不得开始 150–200 道扩展。
- 传统事实来源仅用于菜名、地域、常见食材与高层技法；不得复制第三方菜谱表达、图片、精确克数、时长或步骤。
- 真人试做不是成熟菜逐道晋升的统一前置条件；上线后反馈用于优化，不得伪称已经完成项目试吃。
- 无法确认食材身份、替换后改变核心技法或缺少适用熟制规则的条目不得晋升。
- 新增正式菜谱均为 approved；approved 表示结构、来源和安全规则审核通过。
- 营养数值只走现有权威查表机制；不得新增 AI 编造营养值。
- 不修改 RecipeDB 使用边界；不得把 RecipeDB 放进正式运行包或来源。
- 不触碰用户现有未提交的 CLAUDE.md、ai_proxy.py、index.html、sw.js、tools/check-foods.mjs、worker/src/worker.js、部署说明.md。
- 正式库最终为 15 个家族、42 道 approved 菜谱；草案仍为 30 道、生产可用 0 道。
- 部署前仍必须通过既有静态、live smoke、移动端和来源闸门；任一闸门失败不得部署。

---

## Fixed promotion matrix

| 正式 recipe ID | 草案 ID | 家族 ID |
| --- | --- | --- |
| shanghai-salted-pork-vegetable-rice | shanghai-salted-pork-vegetable-rice-draft | family-jiangnan-vegetable-rice |
| suzhou-salted-pork-vegetable-rice | suzhou-salted-pork-vegetable-rice-draft | family-jiangnan-vegetable-rice |
| nanjing-cured-pork-greens-rice | nanjing-cured-pork-greens-rice-draft | family-jiangnan-vegetable-rice |
| nanjing-sausage-greens-rice | nanjing-sausage-greens-rice-draft | family-jiangnan-vegetable-rice |
| nanjing-duck-greens-rice | nanjing-duck-greens-rice-draft | family-jiangnan-vegetable-rice |
| jinshan-clay-oven-vegetable-rice | jinshan-clay-oven-vegetable-rice-draft | family-jiangnan-vegetable-rice |
| taiwan-cabbage-mushroom-rice | taiwan-cabbage-mushroom-rice-draft | family-southern-savory-rice |
| quanzhou-oil-rice | quanzhou-oil-rice-draft | family-southern-savory-rice |
| fujian-gai-cai-minced-pork-rice | fujian-gai-cai-minced-pork-rice-draft | family-southern-savory-rice |
| fujian-hyacinth-bean-rice | fujian-hyacinth-bean-rice-draft | family-southern-savory-rice |
| hainan-cai-bao-rice | hainan-cai-bao-rice-draft | family-southern-savory-rice |
| daxi-lotus-leaf-oil-rice | daxi-lotus-leaf-oil-rice-draft | family-southern-savory-rice |
| cantonese-cured-meat-claypot-rice | cantonese-cured-meat-claypot-rice-draft | family-covered-pot-rice |
| cantonese-mushroom-chicken-claypot-rice | cantonese-mushroom-chicken-claypot-rice-draft | family-covered-pot-rice |
| cantonese-black-bean-pork-rib-claypot-rice | cantonese-black-bean-pork-rib-claypot-rice-draft | family-covered-pot-rice |
| xinjiang-lamb-pilaf | xinjiang-lamb-pilaf-draft | family-northwest-grain-rice |
| xinjiang-vegetable-pilaf | xinjiang-vegetable-pilaf-draft | family-northwest-grain-rice |
| shaanbei-red-date-cowpea-rice | shaanbei-red-date-cowpea-rice-draft | family-northwest-grain-rice |
| qinghai-hao-fan | qinghai-hao-fan-draft | family-northwest-grain-rice |
| shanxi-potato-rice | shanxi-potato-rice-draft | family-northwest-grain-rice |
| shanxi-nitun-millet-rice | shanxi-nitun-millet-rice-draft | family-northwest-grain-rice |
| tibetan-savory-congee | tibetan-savory-congee-draft | family-regional-grain-specialties |
| tibetan-gutu | tibetan-gutu-draft | family-regional-grain-specialties |
| tibetan-ginseng-fruit-rice | tibetan-ginseng-fruit-rice-draft | family-regional-grain-specialties |
| guangxi-five-color-glutinous-rice | guangxi-five-color-glutinous-rice-draft | family-regional-grain-specialties |
| she-people-black-rice | she-people-black-rice-draft | family-regional-grain-specialties |
| banshan-wild-rice | banshan-wild-rice-draft | family-regional-grain-specialties |
| dai-pineapple-purple-rice | dai-pineapple-purple-rice-draft | family-regional-grain-specialties |
| guizhou-dong-community-rice | guizhou-dong-community-rice-draft | family-regional-grain-specialties |
| north-china-green-bean-braised-noodles | north-china-green-bean-braised-noodles-draft | family-northern-braised-noodles |

### Task 1: Add promotion manifest and cross-library gate

**Files:**
- Create: tools/data/traditional-recipe-promotions.json
- Create: tools/lib/traditional-recipe-promotion-gate.mjs
- Create: tools/check-traditional-recipe-promotion.mjs
- Create: tools/tests/traditional-recipe-promotion.test.mjs

**Interfaces:**
- traditional-recipe-promotions.json has schema_version 1 and promotions, exactly 30 objects with recipe_id, draft_id, candidate_id, family_id, cuisine, purposes, total_time_minutes, canonical_path and identity_resolution.
- validateTraditionalRecipePromotion({ candidates, drafts, production, promotions }) returns string[].
- The gate requires all 30 matrix pairs, candidate status candidate, draft status draft, production status approved, origin_candidate_id exact match, first-party canonical source and no identity placeholder.

- [ ] **Step 1: Write failing gate tests**

Use a complete fixture with one mapping and assert failures for a mismatched origin candidate, a non-candidate ledger entry, an identity placeholder and a canonical URL outside the project domain.

```js
assert.deepEqual(validateTraditionalRecipePromotion(bad), [
  'demo-rice origin_candidate_id must equal demo-candidate',
  'demo-rice contains identity placeholder 经核验野菜',
  'demo-rice canonical source must use https://yiguochu.pages.dev/recipes.html?id=demo-rice',
]);
```

- [ ] **Step 2: Run red test**

Run: node --test tools/tests/traditional-recipe-promotion.test.mjs
Expected: FAIL because the gate module does not exist.

- [ ] **Step 3: Implement manifest and gate**

Create the 30 manifest rows from the Fixed promotion matrix. Use these six new families exactly: family-jiangnan-vegetable-rice, family-southern-savory-rice, family-covered-pot-rice, family-northwest-grain-rice, family-regional-grain-specialties, family-northern-braised-noodles.

The gate must reject a count other than 30, duplicate values in recipe_id/draft_id/candidate_id, any matrix mismatch, non-approved production recipe, missing first-party source reference, and strings matching 经核验、身份不明、未知野菜、地方植物 in core ingredients, generation boundaries or substitutions.

- [ ] **Step 4: Run green checks**

Run:
```bash
node --test tools/tests/traditional-recipe-promotion.test.mjs
node tools/check-traditional-recipe-promotion.mjs
```
Expected: unit tests pass; checker initially reports missing production mappings until Task 3.

- [ ] **Step 5: Commit**

```bash
git add tools/data/traditional-recipe-promotions.json tools/lib/traditional-recipe-promotion-gate.mjs tools/check-traditional-recipe-promotion.mjs tools/tests/traditional-recipe-promotion.test.mjs
git commit -m "feat: add traditional recipe promotion gate"
```

### Task 2: Add the read-only canonical recipe page

**Files:**
- Create: recipes.html
- Create: tools/tests/recipes-canonical-page.test.mjs

**Interfaces:**
- recipes.html accepts a query parameter id, fetches /recipe-library.json, renders only the matching approved recipe, its project attribution, technique, ratio rules, safety rules and cultural origin candidate ID.
- Unknown, missing or non-approved IDs render a readable unavailable state and do not render another recipe.

- [ ] **Step 1: Write a failing structural test**

```js
const html = fs.readFileSync(new URL('../../recipes.html', import.meta.url), 'utf8');
assert.match(html, /URLSearchParams/);
assert.match(html, /recipe-library.json/);
assert.match(html, /origin_candidate_id/);
assert.match(html, /一锅出项目/);
```

- [ ] **Step 2: Run red test**

Run: node --test tools/tests/recipes-canonical-page.test.mjs
Expected: FAIL because recipes.html is absent.

- [ ] **Step 3: Implement page**

Use a small dependency-free page. It must set textContent rather than injecting recipe strings as HTML; find one recipe by exact id and status approved; display name, cuisine, form, core ingredients, technique, ratio rules, safety rules, origin candidate ID and source attribution. It must render “未找到可公开的菜谱” for all invalid states.

- [ ] **Step 4: Run green test and commit**

```bash
node --test tools/tests/recipes-canonical-page.test.mjs
git add recipes.html tools/tests/recipes-canonical-page.test.mjs
git commit -m "feat: add canonical recipe pages"
```

### Task 3: Promote the 30 standards into the formal library

**Files:**
- Modify: tools/data/recipe-library.json
- Modify: tools/lib/recipe-library-validator.mjs
- Modify: tools/tests/recipe-library.test.mjs
- Modify: tools/tests/traditional-recipe-promotion.test.mjs

**Interfaces:**
- Add origin_candidate_id as an optional-but-required-for-promoted-recipe non-empty ID field.
- Each new recipe has one first-party approved source: title “一锅出原创标准配方：<name>”, URL https://yiguochu.pages.dev/recipes.html?id=<id>, license “一锅出项目原创标准配方，保留所有权利”, attribution “一锅出项目”, retrieved_at “2026-07-17”.
- Existing 12 external CC BY-SA sources remain unchanged.
- Final family count is 15 and recipe count is 42.

- [ ] **Step 1: Write failing production-count and source tests**

```js
assert.equal(lib.families.length, 15);
assert.equal(lib.recipes.length, 42);
const promoted = lib.recipes.filter(recipe => recipe.origin_candidate_id);
assert.equal(promoted.length, 30);
assert.ok(promoted.every(recipe => recipe.source_refs[0].url === `https://yiguochu.pages.dev/recipes.html?id=${recipe.id}`));
```

- [ ] **Step 2: Run red test**

Run: node --test tools/tests/recipe-library.test.mjs
Expected: FAIL with 9 families and 12 recipes.

- [ ] **Step 3: Add six families and 30 entries**

Build each entry from its corresponding draft and manifest:
- core_ingredients, optional_ingredients, substitution_slots, technique, ratio_rules and safety_rules must be concrete standardization of the project draft;
- purposes must be manifest-declared from quick, pantry, fresh or batch;
- high-risk meat, beans and identity-sensitive recipes must retain applicable safety rules;
- all substitutions must be explicit;
- replace identity-sensitive placeholders with named food-grade or common market ingredients and disclose adaptation in adaptation_note;
- do not add exact third-party recipe amounts or copied instructions.

Update the library validator to require origin_candidate_id when a source uses the project canonical domain, and to reject the four identity placeholders in promoted recipe boundaries.

- [ ] **Step 4: Run formal-library checks**

```bash
node --test tools/tests/recipe-library.test.mjs
node tools/check-recipes.mjs
node tools/check-traditional-recipe-promotion.mjs
```
Expected: library 15/42; promotion checker 30 mappings accepted.

- [ ] **Step 5: Commit**

```bash
git add tools/data/recipe-library.json tools/lib/recipe-library-validator.mjs tools/tests/recipe-library.test.mjs tools/tests/traditional-recipe-promotion.test.mjs
git commit -m "feat: promote thirty traditional recipes"
```

### Task 4: Preserve worker and Python runtime behavior

**Files:**
- Modify: tools/tests/worker-recipe.test.mjs
- Modify: tools/tests/recipe-parity.test.mjs
- Modify: tools/tests/frontend-recipe-contract.test.mjs

**Interfaces:**
- Existing selection and validation APIs remain unchanged.
- New promoted recipes must appear only as trusted approved base recipe IDs with source_refs, pairing basis and no validation flags for their matching allowed pantry.

- [ ] **Step 1: Write failing parity cases**

Add one normal allowed request for shanghai-salted-pork-vegetable-rice and one identity-sensitive request for she-people-black-rice. The normal response must have a trusted recipe ID, first-party source reference and zero validation flags. The identity-sensitive request must reject unknown plant-color wording and retain the explicit approved ingredient boundary.

- [ ] **Step 2: Run red tests**

Run:
```bash
node --test tools/tests/worker-recipe.test.mjs
node --test tools/tests/recipe-parity.test.mjs
```
Expected: new fixtures cannot select the promoted IDs before Task 3 data and compatibility assertions are complete.

- [ ] **Step 3: Update fixtures only**

Do not modify worker/src/worker.js or ai_proxy.py unless a parity failure proves the existing selector cannot honor an approved boundary. If such a failure occurs, stop and report the exact divergence because both files are user-modified.

- [ ] **Step 4: Run focused suite and commit**

```bash
node --test tools/tests/worker-recipe.test.mjs
node --test tools/tests/recipe-parity.test.mjs
node --test tools/tests/frontend-recipe-contract.test.mjs
git add tools/tests/worker-recipe.test.mjs tools/tests/recipe-parity.test.mjs tools/tests/frontend-recipe-contract.test.mjs
git commit -m "test: cover promoted traditional recipe runtime"
```

### Task 5: Full verification and preview readiness

**Files:**
- Modify: docs/传统一锅草案说明.md
- Create: docs/成熟地方菜上线规则.md

- [ ] **Step 1: Write failing policy-document assertion**

```js
assert.match(policy, /不要求逐道真人试做/);
assert.match(policy, /传统事实可追溯/);
assert.match(policy, /项目原创标准配方/);
assert.match(policy, /身份不明/);
```

- [ ] **Step 2: Run red test**

Run: node --test tools/tests/traditional-recipe-promotion.test.mjs
Expected: FAIL because the policy document is absent.

- [ ] **Step 3: Document the live policy**

Create 成熟地方菜上线规则.md with the approved decision, source distinction, standardization rules, excluded identity-sensitive inputs and post-launch feedback rule. Update 传统一锅草案说明.md to say that draft-only applies only before a promotion gate passes; do not state that all 30 drafts are production-ready or already tested.

- [ ] **Step 4: Run verification**

```bash
node --test tools/tests/traditional-recipe-promotion.test.mjs
node --test tools/tests/recipe-library.test.mjs
node --test tools/tests/worker-recipe.test.mjs
node --test tools/tests/recipe-parity.test.mjs
node --test tools/tests/frontend-recipe-contract.test.mjs
node tools/check-recipe-drafts.mjs
node tools/check-recipe-candidates.mjs
node tools/check-recipes.mjs
node tools/check-traditional-recipe-promotion.mjs
git diff --check
```

Expected: drafts 30/0; candidates 30/0; production library 15/42; promotion checker accepts 30; all listed tests pass.

- [ ] **Step 5: Build and preview checklist**

Copy recipes.html with the existing static assets when assembling dist. Run the existing live smoke and mobile checks. Only if they are all clean and the Phase A conditions remain satisfied may the production deployment command be considered; otherwise deploy only recipe-validation preview and report the failed gate.

- [ ] **Step 6: Commit**

```bash
git add docs/传统一锅草案说明.md docs/成熟地方菜上线规则.md tools/tests/traditional-recipe-promotion.test.mjs
git commit -m "docs: define mature traditional recipe promotion"
```


# Six Traditional One-Pot Drafts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a validated, runtime-isolated six-recipe draft library for trial-ready original Chinese one-pot meal formulations.

**Architecture:** `recipe-drafts.json` is a private editorial/trial dataset, separate from both cultural candidates and `recipe-library.json`. Its validator confirms a draft is linked to one of the six approved candidate IDs, has original formulation boundaries and trial/safety gates, and never becomes selectable by the worker or local proxy.

**Tech Stack:** Node.js ESM, `node:test`, JSON data, existing `tools/check-*.mjs` patterns.

## Global Constraints

- Do not modify `tools/data/recipe-library.json`, `worker/src/worker.js`, `ai_proxy.py`, `index.html`, `sw.js`, or any user-dirty file.
- The draft library is not a runtime source. Every entry uses `status: "draft"`; no draft may use `approved`.
- These are project-authored trial formulas, not copied source recipes. Candidate references only prove cultural facts.
- Do not put nutrition values or health claims in drafts.
- A draft must contain explicit substitution boundaries, safety/quality gates, and trial requirements.
- First batch is exactly six IDs: `shanghai-salted-pork-vegetable-rice-draft`, `nanjing-sausage-greens-rice-draft`, `quanzhou-oil-rice-draft`, `north-china-green-bean-braised-noodles-draft`, `xinjiang-lamb-pilaf-draft`, `guizhou-dong-community-rice-draft`.
- Production baseline remains 9 families and 12 approved recipes.

---

### Task 1: Add a standalone draft-library validator

**Files:**
- Create: `tools/lib/recipe-draft-validator.mjs`
- Create: `tools/tests/recipe-drafts.test.mjs`

**Interfaces:**
- Exports `validateRecipeDraftLibrary(library, candidateLedger): string[]`.
- A valid root is `{ schema_version: 1, purpose: string, drafts: Draft[] }`.
- Each `Draft` has: `id`, `candidate_id`, `status`, `name`, `region`, `form`, `adaptation_summary`, `serving_range`, `core_ingredients`, `optional_ingredients`, `substitution_slots`, `draft_ratio_rules`, `technique_outline`, `safety_and_quality_gates`, and `trial_requirements`.

- [ ] **Step 1: Write the failing validator test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRecipeDraftLibrary } from '../lib/recipe-draft-validator.mjs';

const candidateLedger = { entries: [{ id: 'candidate-a' }] };
const validDraftLibrary = {
  schema_version: 1, purpose: '原创试做草案，不进入运行时。',
  drafts: [{
    id: 'sample-draft', candidate_id: 'candidate-a', status: 'draft', name: '示例饭', region: '示例地区', form: '焖饭',
    adaptation_summary: '以家庭一锅完成为目标的原创试做底稿。', serving_range: [2, 4],
    core_ingredients: ['大米', '青菜'], optional_ingredients: ['葱'],
    substitution_slots: [{ slot: '叶菜', replaces: ['青菜'], allowed: ['小白菜'] }],
    draft_ratio_rules: ['每100克大米配120至140克总液体。'], technique_outline: ['炒香配料', '同锅焖熟'],
    safety_and_quality_gates: [{ type: 'texture', requirement: '叶菜后段加入，避免出水过多。' }],
    trial_requirements: ['记录锅具、份数、实际用量、总时长、米粒状态和修订原因。'],
  }],
};

test('draft library accepts an original trial draft linked to a candidate', () => {
  assert.deepEqual(validateRecipeDraftLibrary(validDraftLibrary, candidateLedger), []);
});

test('draft library rejects production status and a missing safety gate', () => {
  const invalid = structuredClone(validDraftLibrary);
  invalid.drafts[0].status = 'approved';
  invalid.drafts[0].safety_and_quality_gates = [];
  assert.deepEqual(validateRecipeDraftLibrary(invalid, candidateLedger), [
    'sample-draft status must be draft',
    'sample-draft safety_and_quality_gates must be non-empty',
  ]);
});
```

- [ ] **Step 2: Run the test and observe the missing module failure**

Run: `node --test tools/tests/recipe-drafts.test.mjs`  
Expected: `ERR_MODULE_NOT_FOUND` for `recipe-draft-validator.mjs`.

- [ ] **Step 3: Implement the validator**

Implement the exported function with deterministic errors. Require non-empty strings and arrays, unique draft/candidate IDs, `status === 'draft'`, candidate ID membership in `candidateLedger.entries`, integer serving range `[min,max]` where `1 <= min <= max <= 6`, non-empty slots with `slot/replaces/allowed`, and safety objects with `type/requirement`.

- [ ] **Step 4: Run focused test**

Run: `node --test tools/tests/recipe-drafts.test.mjs`  
Expected: 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add tools/lib/recipe-draft-validator.mjs tools/tests/recipe-drafts.test.mjs
git commit -m "feat: validate traditional recipe drafts"
```

### Task 2: Add six original trial drafts and a release checker

**Files:**
- Create: `tools/data/recipe-drafts.json`
- Create: `tools/check-recipe-drafts.mjs`
- Modify: `tools/tests/recipe-drafts.test.mjs`

**Interfaces:**
- `node tools/check-recipe-drafts.mjs` loads the draft library, candidate ledger, and production library.
- It prints `传统一锅草案 6 道 · 生产可用 0 道` and exits 0 only when six valid `draft` entries exist and production remains 9 / 12.

- [ ] **Step 1: Write failing integration tests**

```js
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

test('six traditional drafts are isolated from candidates and production', () => {
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  const candidates = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const production = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateRecipeDraftLibrary(drafts, candidates), []);
  assert.equal(drafts.drafts.length, 6);
  assert.ok(drafts.drafts.every(draft => draft.status === 'draft'));
  assert.equal(production.families.length, 9);
  assert.equal(production.recipes.length, 12);
  assert.ok(drafts.drafts.every(draft => !production.recipes.some(recipe => recipe.id === draft.id)));
});

test('draft checker reports six drafts and zero production entries', () => {
  const run = spawnSync('node', ['tools/check-recipe-drafts.mjs'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /传统一锅草案 6 道 · 生产可用 0 道/);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tools/tests/recipe-drafts.test.mjs`  
Expected: both integration tests fail with missing `recipe-drafts.json` / checker.

- [ ] **Step 3: Create exactly these six draft records**

Each record uses the candidate ID in the left column and an original, non-source-derived ratio framework in the right column.

| Draft ID | Candidate ID | Original trial framework |
| --- | --- | --- |
| `shanghai-salted-pork-vegetable-rice-draft` | `shanghai-salted-pork-vegetable-rice` | polished rice; limited salted pork; leafy greens added late; 100g rice to 125–140g total usable liquid; salt withheld until salted pork is tasted |
| `nanjing-sausage-greens-rice-draft` | `nanjing-sausage-greens-rice` | polished rice; sliced sausage; greens late; 100g rice to 125–140g liquid; no extra oil unless sausage is very lean |
| `quanzhou-oil-rice-draft` | `quanzhou-oil-rice` | soaked glutinous rice; pork and mushroom as default; dried seafood excluded from first trial; 100g soaked rice to 90–110g stock/water; avoid calling it a replica |
| `north-china-green-bean-braised-noodles-draft` | `north-china-green-bean-braised-noodles` | pork or firm tofu; trimmed green beans; fresh wheat noodles; measured braising liquid; beans and protein fully cooked before noodles steam; pan-bottom moisture check |
| `xinjiang-lamb-pilaf-draft` | `xinjiang-lamb-pilaf` | lamb cubes, onion, carrot, rice; 100g rice to 135–150g usable braising liquid after lamb is cooked; fruit/nuts optional only after allergen review; wording is “inspired by Xinjiang pilaf” |
| `guizhou-dong-community-rice-draft` | `guizhou-dong-community-rice` | rice, cured pork, aromatics, leafy herb slot; use ordinary leafy greens in first trial unless a verified edible local herb is supplied; 100g rice to 125–140g liquid; label as regional-flavor adaptation |

For every record: `serving_range: [2,4]`; complete all required fields; use only original summaries; use the existing `candidate_id` as the sole cultural-basis link; no nutrition fields.

- [ ] **Step 4: Create checker**

The checker reads the three JSON files and uses `validateRecipeDraftLibrary`. It adds errors if draft count is not 6, any draft status is not `draft`, production families are not 9, production recipes are not 12, or any production recipe is non-approved. It prints the required count line and `✅ 传统一锅草案体检通过` on success.

- [ ] **Step 5: Verify integration and production isolation**

Run:

```bash
node --test tools/tests/recipe-drafts.test.mjs
node tools/check-recipe-drafts.mjs
node tools/check-recipe-candidates.mjs
node tools/check-recipes.mjs
```

Expected: 4 draft tests pass; draft checker reports 6 / 0; candidate checker remains 30 / 0; production checker remains 9 / 12.

- [ ] **Step 6: Commit**

```bash
git add tools/data/recipe-drafts.json tools/check-recipe-drafts.mjs tools/tests/recipe-drafts.test.mjs
git commit -m "feat: add six traditional one-pot drafts"
```

### Task 3: Document trial promotion and run full verification

**Files:**
- Create: `docs/传统一锅草案说明.md`
- Modify: `tools/tests/recipe-drafts.test.mjs`

- [ ] **Step 1: Write failing documentation test**

```js
test('draft documentation keeps the production promotion boundary explicit', () => {
  const doc = fs.readFileSync(new URL('../../docs/传统一锅草案说明.md', import.meta.url), 'utf8');
  assert.match(doc, /不进入运行时/);
  assert.match(doc, /原创标准配方/);
  assert.match(doc, /真实试做/);
  assert.match(doc, /node tools\/check-recipe-drafts\.mjs/);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tools/tests/recipe-drafts.test.mjs`  
Expected: failure with `ENOENT` for `docs/传统一锅草案说明.md`.

- [ ] **Step 3: Write the contributor document**

Document: draft runtime isolation; the six-draft scope; original-formula versus cultural-fact boundary; trial logs required for each risk level; promotion conditions including canonical first-party page and existing Phase A gate; and these exact commands:

```bash
node tools/check-recipe-drafts.mjs
node tools/check-recipe-candidates.mjs
node tools/check-recipes.mjs
```

- [ ] **Step 4: Run full verification**

Run:

```bash
node --test tools/tests/recipe-drafts.test.mjs
node tools/check-recipe-drafts.mjs
node tools/check-recipe-candidates.mjs
node tools/check-recipes.mjs
node --test tools/tests/recipe-library.test.mjs tools/tests/worker-recipe.test.mjs tools/tests/recipe-parity.test.mjs
git diff --check
```

Expected: 5 draft tests pass; checks show 6 / 0, 30 / 0, and 9 / 12; all existing production tests pass.

- [ ] **Step 5: Commit**

```bash
git add docs/传统一锅草案说明.md tools/tests/recipe-drafts.test.mjs
git commit -m "docs: define traditional draft trial gates"
```

## Plan self-review

- Spec coverage: Task 1 provides an isolated schema; Task 2 creates exactly the approved six original drafts and a checker; Task 3 documents promotion and verifies production remains untouched.
- Placeholder scan: no TBD/TODO or unspecified source is present.
- Type consistency: all tasks use `validateRecipeDraftLibrary(library, candidateLedger)`, `tools/data/recipe-drafts.json`, and the same `draft` status.

# 30 道传统一锅原创草案扩展 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 30 个已研究的地域候选各自扩展为不进入运行时的原创试做草案，并让自动闸门严格锁定全部映射。

**Architecture:** `recipe-candidates.json` 继续保存传统事实与来源线索；`recipe-drafts.json` 保存项目原创试做配方。草案校验器检查字段结构；发布闸门检查固定的“草案 ID → 候选 ID”一对一映射；检查脚本守住“30 草案、0 草案生产可用、正式库 9/12 不变”。

**Tech Stack:** Node.js 内置 `node:test`、ESM、JSON 数据文件。

## Global Constraints

- 只能修改草案层、校验层和说明文档；不得改动 `tools/data/recipe-library.json`、前端、worker、本地代理或部署配置。
- 所有新增条目必须为 `status: "draft"`，不得进入运行时、不得宣称已上线或生产可用。
- 不复制、改写或拼接第三方菜谱的食材表、精确克数、时长、步骤顺序、图片或完整做法；只使用现有候选册的文化事实确定原创试做方向。
- 不增加或伪造营养数值；营养数据红线不在本次范围。
- 正式库必须始终保持 9 个家族、12 道 `approved` 菜谱；草案 ID 不得与正式菜谱 ID 重叠。
- 每道草案都需包含风险门槛和真实试做记录要求；high 条目必须覆盖原料身份、熟制、过敏原、盐分/保存或名称不明地方食材中的适用风险。

---

## Fixed mapping table

发布闸门以本表作为唯一映射清单：每行必须有同名的 `-draft` 草案，且 `candidate_id` 精确等于右列。

| Draft ID | Candidate ID | Risk |
| --- | --- | --- |
| `shanghai-salted-pork-vegetable-rice-draft` | `shanghai-salted-pork-vegetable-rice` | moderate |
| `suzhou-salted-pork-vegetable-rice-draft` | `suzhou-salted-pork-vegetable-rice` | moderate |
| `nanjing-cured-pork-greens-rice-draft` | `nanjing-cured-pork-greens-rice` | moderate |
| `nanjing-sausage-greens-rice-draft` | `nanjing-sausage-greens-rice` | moderate |
| `nanjing-duck-greens-rice-draft` | `nanjing-duck-greens-rice` | moderate |
| `jinshan-clay-oven-vegetable-rice-draft` | `jinshan-clay-oven-vegetable-rice` | low |
| `taiwan-cabbage-mushroom-rice-draft` | `taiwan-cabbage-mushroom-rice` | low |
| `quanzhou-oil-rice-draft` | `quanzhou-oil-rice` | moderate |
| `fujian-gai-cai-minced-pork-rice-draft` | `fujian-gai-cai-minced-pork-rice` | low |
| `fujian-hyacinth-bean-rice-draft` | `fujian-hyacinth-bean-rice` | low |
| `cantonese-cured-meat-claypot-rice-draft` | `cantonese-cured-meat-claypot-rice` | moderate |
| `cantonese-mushroom-chicken-claypot-rice-draft` | `cantonese-mushroom-chicken-claypot-rice` | high |
| `cantonese-black-bean-pork-rib-claypot-rice-draft` | `cantonese-black-bean-pork-rib-claypot-rice` | high |
| `xinjiang-lamb-pilaf-draft` | `xinjiang-lamb-pilaf` | high |
| `xinjiang-vegetable-pilaf-draft` | `xinjiang-vegetable-pilaf` | low |
| `guizhou-dong-community-rice-draft` | `guizhou-dong-community-rice` | high |
| `shaanbei-red-date-cowpea-rice-draft` | `shaanbei-red-date-cowpea-rice` | low |
| `north-china-green-bean-braised-noodles-draft` | `north-china-green-bean-braised-noodles` | low |
| `qinghai-hao-fan-draft` | `qinghai-hao-fan` | high |
| `shanxi-potato-rice-draft` | `shanxi-potato-rice` | low |
| `shanxi-nitun-millet-rice-draft` | `shanxi-nitun-millet-rice` | low |
| `tibetan-savory-congee-draft` | `tibetan-savory-congee` | high |
| `tibetan-gutu-draft` | `tibetan-gutu` | high |
| `tibetan-ginseng-fruit-rice-draft` | `tibetan-ginseng-fruit-rice` | high |
| `guangxi-five-color-glutinous-rice-draft` | `guangxi-five-color-glutinous-rice` | moderate |
| `she-people-black-rice-draft` | `she-people-black-rice` | high |
| `banshan-wild-rice-draft` | `banshan-wild-rice` | high |
| `hainan-cai-bao-rice-draft` | `hainan-cai-bao-rice` | low |
| `dai-pineapple-purple-rice-draft` | `dai-pineapple-purple-rice` | moderate |
| `daxi-lotus-leaf-oil-rice-draft` | `daxi-lotus-leaf-oil-rice` | moderate |

### Task 1: Generalize fixed mapping validation

**Files:**
- Modify: `tools/lib/recipe-draft-release-gate.mjs`
- Modify: `tools/tests/recipe-drafts.test.mjs`

**Interfaces:**
- Produce `validateExpectedDraftMappings(library, candidateLedger, expectedMappings, rejectUnexpectedDrafts = false): string[]`.
- Retain `validateSixDraftReleaseGate(library, candidateLedger)` as a wrapper until all 30 data entries are added.

- [ ] **Step 1: Write the failing generic-validator test**

```js
test('expected mapping validator rejects a missing and an extra draft', () => {
  const library = { drafts: [{ id: 'a-draft', candidate_id: 'a' }, { id: 'extra-draft', candidate_id: 'b' }] };
  const candidates = { entries: [{ id: 'a', status: 'candidate' }, { id: 'b', status: 'candidate' }] };
  assert.deepEqual(validateExpectedDraftMappings(library, candidates, new Map([['a-draft', 'a'], ['missing-draft', 'b']]), true), [
    'expected draft missing-draft is missing',
    'unexpected draft extra-draft is present',
  ]);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tools/tests/recipe-drafts.test.mjs`  
Expected: import failure because `validateExpectedDraftMappings` does not exist.

- [ ] **Step 3: Implement the generic function**

Create maps from `library.drafts` and `candidateLedger.entries`; for every expected pair, report missing drafts, wrong candidate IDs, and non-`candidate` linked status. Only when `rejectUnexpectedDrafts` is `true`, report each actual ID absent from the expected map as `unexpected draft <id> is present`. Make the existing six-draft function delegate with `false`, so the six verified originals remain locked while the draft pool grows.

- [ ] **Step 4: Run and commit**

Run: `node --test tools/tests/recipe-drafts.test.mjs`  
Expected: PASS.

```bash
git add tools/lib/recipe-draft-release-gate.mjs tools/tests/recipe-drafts.test.mjs
git commit -m "refactor: generalize draft mapping validation"
```

### Task 2: Add the nine remaining low-risk original drafts

**Files:**
- Modify: `tools/data/recipe-drafts.json`
- Modify: `tools/tests/recipe-drafts.test.mjs`

**Interfaces:**
- Produce exactly these added IDs: `jinshan-clay-oven-vegetable-rice-draft`, `taiwan-cabbage-mushroom-rice-draft`, `fujian-gai-cai-minced-pork-rice-draft`, `fujian-hyacinth-bean-rice-draft`, `xinjiang-vegetable-pilaf-draft`, `shaanbei-red-date-cowpea-rice-draft`, `shanxi-potato-rice-draft`, `shanxi-nitun-millet-rice-draft`, `hainan-cai-bao-rice-draft`.

- [ ] **Step 1: Write failing count test**

```js
test('draft ledger contains 15 entries after low-risk expansion', () => {
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  assert.equal(drafts.drafts.length, 15);
  assert.ok(drafts.drafts.slice(6).every(draft => draft.status === 'draft'));
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tools/tests/recipe-drafts.test.mjs`  
Expected: FAIL with `6 !== 15`.

- [ ] **Step 3: Add original entries with this exact safety matrix**

| Candidate | Core direction | Required gate |
| --- | --- | --- |
| jinshan | rice, leafy green, optional fresh mushroom | greens join late; no pooling liquid |
| taiwan cabbage mushroom | rice, cabbage, fresh mushroom, optional tofu | fix liquid only after cabbage moisture is assessed |
| fujian gai cai pork | rice, mustard green, minced pork or tofu | pork fully cooked; taste preserved greens before salt |
| fujian hyacinth bean | rice, hyacinth bean, mushroom optional | bean variety documented and beans fully cooked |
| xinjiang vegetable pilaf | rice, onion, carrot, chickpea optional | fully cooked chickpeas; measure vegetable moisture |
| shaanbei red-date cowpea | rice, red date, cowpea | cowpeas fully cooked; dates pitted |
| shanxi potato | grain/rice, potato, leafy green optional | potato cooked through; prevent sticking/scorching |
| shanxi millet | millet, potato, bean/leafy green optional | record millet/liquid and potato doneness |
| hainan cai bao | rice, verified food-grade leaf wrapper, vegetable filling | verify leaf identity/edibility; filling cooked through |

Every entry must have all schema fields, an explicit substitution slot, at least one ratio rule, high-level technique only, structured gates, and concrete trial-record requirements. Do not include copied recipe prose or public recipe quantities/timings. In the existing isolation test, replace the six-draft count assertion with 15 and retain the assertions that every entry remains `draft`, remains outside production, and preserves production count 9/12.

- [ ] **Step 4: Run structural checks and commit**

Run: `node --test tools/tests/recipe-drafts.test.mjs && node tools/check-recipe-drafts.mjs`  
Expected: schema test passes; checker may still reject the old six-count until Task 4.

```bash
git add tools/data/recipe-drafts.json tools/tests/recipe-drafts.test.mjs
git commit -m "feat: add low-risk traditional recipe drafts"
```

### Task 3: Add the seven remaining moderate-risk original drafts

**Files:**
- Modify: `tools/data/recipe-drafts.json`
- Modify: `tools/tests/recipe-drafts.test.mjs`

**Interfaces:**
- Produce these added IDs: `suzhou-salted-pork-vegetable-rice-draft`, `nanjing-cured-pork-greens-rice-draft`, `nanjing-duck-greens-rice-draft`, `cantonese-cured-meat-claypot-rice-draft`, `guangxi-five-color-glutinous-rice-draft`, `dai-pineapple-purple-rice-draft`, `daxi-lotus-leaf-oil-rice-draft`.

- [ ] **Step 1: Write failing count test**

```js
test('draft ledger contains 22 entries after moderate-risk expansion', () => {
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  assert.equal(drafts.drafts.length, 22);
  assert.ok(drafts.drafts.some(draft => draft.id === 'daxi-lotus-leaf-oil-rice-draft'));
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tools/tests/recipe-drafts.test.mjs`  
Expected: FAIL with `15 !== 22`.

- [ ] **Step 3: Add original entries with these non-negotiable gates**

| Candidate | Required gate |
| --- | --- |
| suzhou salted pork | fully cook cured pork; salt only after tasting |
| nanjing cured pork | fully cook meat; control leafy-green moisture |
| nanjing duck greens | document cooked-safe duck edible portion; reheat thoroughly |
| cantonese cured meat | heat cured meat through; use normal lidded pot, no claimed claypot replica |
| guangxi five-color glutinous | every colour source must be food-grade and identified; no decorative dye |
| dai pineapple purple rice | add pineapple late; declare coconut allergen if used |
| daxi lotus-leaf oil rice | food-grade clean lotus leaf; pork cooked through; leaf is aroma wrapper only |

All seven entries must have the complete schema and trial records for salt, fat, moisture, plant identity, and cooked-duck provenance where applicable. Update the isolation-test count from 15 to 22 while retaining the same production-boundary assertions.

- [ ] **Step 4: Run structural checks and commit**

Run: `node --test tools/tests/recipe-drafts.test.mjs && node tools/check-recipe-drafts.mjs`  
Expected: schema test passes; old count gate may still reject before Task 4.

```bash
git add tools/data/recipe-drafts.json tools/tests/recipe-drafts.test.mjs
git commit -m "feat: add moderate-risk traditional recipe drafts"
```

### Task 4: Add eight high-risk originals and activate the 30-entry gate

**Files:**
- Modify: `tools/data/recipe-drafts.json`
- Modify: `tools/lib/recipe-draft-release-gate.mjs`
- Modify: `tools/check-recipe-drafts.mjs`
- Modify: `tools/tests/recipe-drafts.test.mjs`

**Interfaces:**
- Replace the temporary wrapper with `validateThirtyDraftReleaseGate(library, candidateLedger): string[]`.
- Checker requires exactly 30 and prints `传统一锅草案 30 道 · 生产可用 0 道`.

- [ ] **Step 1: Write failing final-gate test**

```js
test('thirty-draft release gate accepts the complete fixed mapping', () => {
  const drafts = JSON.parse(fs.readFileSync(new URL('../data/recipe-drafts.json', import.meta.url), 'utf8'));
  const candidates = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  assert.equal(drafts.drafts.length, 30);
  assert.deepEqual(validateThirtyDraftReleaseGate(drafts, candidates), []);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tools/tests/recipe-drafts.test.mjs`  
Expected: FAIL because 22 entries exist and the final export does not exist.

- [ ] **Step 3: Add eight original high-risk entries using this evidence matrix**

| Candidate | Required high-risk evidence |
| --- | --- |
| cantonese mushroom chicken | chicken cut/edible portion and cooked-center proof; mushroom moisture trial |
| cantonese black-bean rib | bone safety, pork cooked-center proof, fermented-bean salt control |
| qinghai hao fan | ingredient identity/edibility; potato cooked through; no unverified regional plant |
| tibetan savory congee | dairy allergen scope; simmered outcome and storage boundary |
| tibetan gutu | no ritual-replica claim; dough cooked through; allergen and storage records |
| tibetan ginseng-fruit rice | exact food-grade 蕨麻 identity before use; no medicine claim |
| she black rice | botanical identity, food-grade proof and soaking/rinsing record |
| banshan wild rice | wild ingredient identity/edibility and cook-through proof; named safe substitute allowed for first trial |

Each entry must use `status: "draft"`, have at least three structured gates, and require trial records for source identity, raw state, cooked state, allergens and storage whenever applicable. Update the isolation-test count from 22 to 30 and replace the legacy six-draft gate import/test with the final 30-draft gate.

- [ ] **Step 4: Activate final mapping and count gate**

Define the complete 30-pair map from the Fixed mapping table. Implement:

```js
export function validateThirtyDraftReleaseGate(library, candidateLedger) {
  return validateExpectedDraftMappings(library, candidateLedger, EXPECTED_THIRTY_CANDIDATE_IDS, true);
}
```

In `tools/check-recipe-drafts.mjs`, import this final gate, append its errors, and require `draftEntries.length === 30`.

- [ ] **Step 5: Run full verification and commit**

```bash
node --test tools/tests/recipe-drafts.test.mjs
node tools/check-recipe-drafts.mjs
node tools/check-recipe-candidates.mjs
node tools/check-recipes.mjs
git add tools/data/recipe-drafts.json tools/lib/recipe-draft-release-gate.mjs tools/check-recipe-drafts.mjs tools/tests/recipe-drafts.test.mjs
git commit -m "feat: expand traditional recipe drafts to thirty"
```

Expected: all commands pass; draft check prints 30/0, candidates 30/0, production 9/12.

### Task 5: Update operating documentation and verify the boundary

**Files:**
- Modify: `docs/传统一锅草案说明.md`
- Modify: `tools/tests/recipe-drafts.test.mjs`

- [ ] **Step 1: Add failing documentation test**

```js
test('draft documentation states the thirty-draft production boundary', () => {
  const doc = fs.readFileSync(new URL('../../docs/传统一锅草案说明.md', import.meta.url), 'utf8');
  assert.match(doc, /30 道草案/);
  assert.match(doc, /不进入运行时/);
  assert.match(doc, /生产可用 0 道/);
  assert.match(doc, /high/);
});
```

- [ ] **Step 2: Run and verify failure**

Run: `node --test tools/tests/recipe-drafts.test.mjs`  
Expected: FAIL because the document says six drafts.

- [ ] **Step 3: Update only the operational facts**

The opening must state exactly:

```md
`tools/data/recipe-drafts.json` 是编辑、试做和人工审核使用的原创草案库。当前共有 30 道草案，全部为 `draft`，生产可用 0 道。

草案不进入运行时；前端、worker 与本地代理均不得加载草案库。
```

Keep the originality, trial, risk-tier, promotion and three-command boundaries. Do not describe any trial as completed.

- [ ] **Step 4: Run final regression and commit**

```bash
node --test tools/tests/recipe-drafts.test.mjs
node tools/check-recipe-drafts.mjs
node tools/check-recipe-candidates.mjs
node tools/check-recipes.mjs
git diff --check
git add docs/传统一锅草案说明.md tools/tests/recipe-drafts.test.mjs
git commit -m "docs: explain thirty traditional recipe drafts"
```

Expected: every command exits 0; no staged or unstaged change touches `CLAUDE.md`, `ai_proxy.py`, `index.html`, `sw.js`, `tools/check-foods.mjs`, `worker/src/worker.js`, or `部署说明.md`.

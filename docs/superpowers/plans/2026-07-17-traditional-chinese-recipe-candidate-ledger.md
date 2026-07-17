# Traditional Chinese Recipe Candidate Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a machine-checked, production-isolated research ledger for the first 30 traditional Chinese one-pot meal candidates.

**Architecture:** The new JSON ledger is deliberately separate from `tools/data/recipe-library.json`, so only existing approved recipes can be selected by `worker/src/worker.js` or `ai_proxy.py`. A narrow validator verifies provenance metadata, candidate status, and promotion gates; a command and Node tests make the separation a release-time check.

**Tech Stack:** Node.js ESM, `node:test`, JSON data files, existing `tools/check-*.mjs` convention.

## Global Constraints

- Do not modify `tools/data/recipe-library.json`, `worker/src/worker.js`, `ai_proxy.py`, `index.html`, or any of the user's pre-existing dirty files.
- Candidate ledger is research-only; `status` may only be `candidate` or `research_hold`, never `approved`.
- Candidate metadata may state only dish name, region, core ingredient pattern, high-level technique pattern, and risk; it may not contain copied source recipe text, exact source quantities, source step text, source photos, or nutrition claims.
- Every candidate has at least one HTTPS `basis_refs` entry and non-empty promotion requirements containing `原创标准配方` and `安全与适配审核`.
- `basis_refs` supports cultural facts only and must include the literal rights note: `事实溯源；不复制页面文字、图片或完整菜谱。`.
- Production selection remains exactly 9 families and 12 approved recipes.
- Tests use `node --test`; no new package dependency.

---

### Task 1: Add the candidate-ledger validator and unit tests

**Files:**
- Create: `tools/lib/recipe-candidate-validator.mjs`
- Create: `tools/tests/recipe-candidates.test.mjs`

**Interfaces:**
- Produces `validateRecipeCandidateLedger(ledger): string[]`.
- Consumes a plain JSON object with `schema_version: 1`, non-empty `purpose`, and `entries`.
- An entry must have `id`, `status`, `name`, `region`, `cuisine`, `form`, `traditional_basis`, `ingredient_pattern`, `technique_pattern`, `risk_level`, `promotion_requirements`, and `basis_refs`.

- [ ] **Step 1: Write the failing validator test**

Create `tools/tests/recipe-candidates.test.mjs` with this minimal test before the validator exists:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRecipeCandidateLedger } from '../lib/recipe-candidate-validator.mjs';

const validLedger = {
  schema_version: 1,
  purpose: '研究传统一锅主食，不进入生产生成库。',
  entries: [{
    id: 'sample-rice', status: 'candidate', name: '示例菜饭', region: '示例地区',
    cuisine: '示例菜系', form: '菜饭', traditional_basis: '米与蔬菜同锅焖制。',
    ingredient_pattern: ['大米', '青菜'], technique_pattern: ['炒香', '加盖焖熟'],
    risk_level: 'low', promotion_requirements: ['原创标准配方', '安全与适配审核'],
    basis_refs: [{
      kind: 'cultural_fact', relationship: 'ingredient_pattern', claim: '存在米与青菜同锅焖制的菜饭方向。',
      source_type: 'government_culture', title: '示例资料', publisher: '示例机构',
      url: 'https://example.test/rice', retrieved_at: '2026-07-17',
      rights_note: '事实溯源；不复制页面文字、图片或完整菜谱。',
      evidence_scope: ['dish_name', 'region', 'high_level_technique'],
      excluded_scope: ['exact_quantities', 'step_text', 'nutrition', 'safety'],
    }],
  }],
};

test('candidate ledger accepts a factual research candidate', () => {
  assert.deepEqual(validateRecipeCandidateLedger(validLedger), []);
});

test('candidate ledger rejects approved status and copied-source metadata gaps', () => {
  const invalid = structuredClone(validLedger);
  invalid.entries[0].status = 'approved';
  invalid.entries[0].basis_refs[0].rights_note = '';
  assert.deepEqual(validateRecipeCandidateLedger(invalid), [
    'sample-rice status must be candidate or research_hold',
    'sample-rice basis ref 0 missing rights_note',
  ]);
});
```

- [ ] **Step 2: Run the test to verify it fails because the module is missing**

Run: `node --test tools/tests/recipe-candidates.test.mjs`  
Expected: failure with `ERR_MODULE_NOT_FOUND` for `recipe-candidate-validator.mjs`.

- [ ] **Step 3: Implement the minimal validator**

Create `tools/lib/recipe-candidate-validator.mjs` with the exact public export and validations below. Use `new URL()` to check HTTPS and collect errors in deterministic entry/field order.

```js
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUSES = new Set(['candidate', 'research_hold']);
const RISK_LEVELS = new Set(['low', 'moderate', 'high']);
const RIGHTS_NOTE = '事实溯源；不复制页面文字、图片或完整菜谱。';

function nonEmpty(value) { return typeof value === 'string' && value.trim().length > 0; }
function https(value) {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}
function strings(value) { return Array.isArray(value) && value.length > 0 && value.every(nonEmpty); }

export function validateRecipeCandidateLedger(ledger) {
  const errors = [];
  if (ledger?.schema_version !== 1) errors.push('schema_version must be 1');
  if (!nonEmpty(ledger?.purpose)) errors.push('purpose must be non-empty');
  if (!Array.isArray(ledger?.entries) || ledger.entries.length === 0) {
    errors.push('entries must be non-empty');
    return errors;
  }
  const ids = new Set();
  for (const [index, entry] of ledger.entries.entries()) {
    const label = nonEmpty(entry?.id) ? entry.id : `entry ${index}`;
    if (!ID_RE.test(entry?.id || '')) errors.push(`${label} has invalid id`);
    if (ids.has(entry?.id)) errors.push(`${label} duplicates id`);
    ids.add(entry?.id);
    if (!STATUSES.has(entry?.status)) errors.push(`${label} status must be candidate or research_hold`);
    for (const key of ['name', 'region', 'cuisine', 'form', 'traditional_basis']) {
      if (!nonEmpty(entry?.[key])) errors.push(`${label} missing ${key}`);
    }
    for (const key of ['ingredient_pattern', 'technique_pattern', 'promotion_requirements']) {
      if (!strings(entry?.[key])) errors.push(`${label} ${key} must be non-empty strings`);
    }
    for (const gate of ['原创标准配方', '安全与适配审核']) {
      if (!entry?.promotion_requirements?.includes(gate)) errors.push(`${label} missing promotion requirement ${gate}`);
    }
    if (!RISK_LEVELS.has(entry?.risk_level)) errors.push(`${label} risk_level must be low, moderate, or high`);
    if (!Array.isArray(entry?.basis_refs) || entry.basis_refs.length === 0) {
      errors.push(`${label} basis_refs must be non-empty`);
      continue;
    }
    for (const [refIndex, ref] of entry.basis_refs.entries()) {
      const prefix = `${label} basis ref ${refIndex}`;
      for (const key of ['kind', 'relationship', 'claim', 'source_type', 'title', 'publisher', 'retrieved_at']) {
        if (!nonEmpty(ref?.[key])) errors.push(`${prefix} missing ${key}`);
      }
      if (!https(ref?.url)) errors.push(`${prefix} URL must be HTTPS`);
      if (!nonEmpty(ref?.rights_note)) errors.push(`${prefix} missing rights_note`);
      else if (ref.rights_note !== RIGHTS_NOTE) errors.push(`${prefix} rights_note must state facts-only use`);
      for (const key of ['evidence_scope', 'excluded_scope']) {
        if (!strings(ref?.[key])) errors.push(`${prefix} ${key} must be non-empty strings`);
      }
    }
  }
  return errors;
}
```

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `node --test tools/tests/recipe-candidates.test.mjs`  
Expected: 2 passing tests.

- [ ] **Step 5: Commit the validator task**

```bash
git add tools/lib/recipe-candidate-validator.mjs tools/tests/recipe-candidates.test.mjs
git commit -m "feat: validate traditional recipe candidates"
```

### Task 2: Add the 30-item factual candidate ledger and checker

**Files:**
- Create: `tools/data/recipe-candidates.json`
- Create: `tools/check-recipe-candidates.mjs`
- Modify: `tools/tests/recipe-candidates.test.mjs`

**Interfaces:**
- `tools/data/recipe-candidates.json` conforms to `validateRecipeCandidateLedger`.
- `node tools/check-recipe-candidates.mjs` prints `传统菜候选 30 道 · 生产可用 0 道` then `✅ 传统菜候选册体检通过` and exits 0.

- [ ] **Step 1: Write failing integration tests**

Append these tests to `tools/tests/recipe-candidates.test.mjs` before creating the data file and checker:

```js
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

test('research ledger has exactly 30 non-production candidates and leaves the Phase A library untouched', () => {
  const ledger = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const production = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateRecipeCandidateLedger(ledger), []);
  assert.equal(ledger.entries.length, 30);
  assert.ok(ledger.entries.every(entry => entry.status !== 'approved'));
  assert.equal(production.families.length, 9);
  assert.equal(production.recipes.length, 12);
  assert.ok(production.recipes.every(recipe => !ledger.entries.some(entry => entry.id === recipe.id)));
});

test('candidate checker reports the candidate and production counts', () => {
  const run = spawnSync('node', ['tools/check-recipe-candidates.mjs'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /传统菜候选 30 道 · 生产可用 0 道/);
  assert.match(run.stdout, /✅ 传统菜候选册体检通过/);
});
```

- [ ] **Step 2: Run the integration tests to verify they fail for the missing ledger**

Run: `node --test tools/tests/recipe-candidates.test.mjs`  
Expected: the two new tests fail with `ENOENT` for `recipe-candidates.json`.

- [ ] **Step 3: Create the candidate ledger**

Create `tools/data/recipe-candidates.json` with `schema_version: 1`, the purpose `研究传统中国一锅主食的文化事实；不进入生产生成库。`, and exactly these 30 IDs and names. All records use status `candidate`, the two required promotion requirements, the facts-only rights note, a non-empty ingredient and technique pattern, and the cited HTTPS basis URL.

| ID | Name | Region | Basis URL |
|---|---|---|---|
| `shanghai-salted-pork-vegetable-rice` | 上海奉贤咸肉菜饭 | 上海奉贤 | `https://www.fengxian.gov.cn/ymsmkfxjson/20221209/33096.html` |
| `suzhou-salted-pork-vegetable-rice` | 苏州青菜咸肉饭 | 江苏苏州 | `https://www.daj.suzhou.gov.cn/detail/141139.html` |
| `nanjing-cured-pork-greens-rice` | 南京矮脚黄腊肉菜饭 | 江苏南京 | `https://www.zjskw.gov.cn/art/2024/8/15/art_1229556995_60165.html` |
| `nanjing-sausage-greens-rice` | 南京矮脚黄香肠菜饭 | 江苏南京 | `https://www.zjskw.gov.cn/art/2024/8/15/art_1229556995_60165.html` |
| `nanjing-duck-greens-rice` | 南京矮脚黄板鸭菜饭 | 江苏南京 | `https://www.zjskw.gov.cn/art/2024/8/15/art_1229556995_60165.html` |
| `jinshan-clay-oven-vegetable-rice` | 金山土灶菜饭 | 上海金山 | `https://english.shanghai.gov.cn/en-SpecialtyFood/20260605/d87d0b3266f84ba6a539226a97335.html` |
| `taiwan-cabbage-mushroom-rice` | 高丽菜香菇炊饭 | 台湾 | `https://zh.wikibooks.org/wiki/食譜/高麗菜炊飯` |
| `quanzhou-oil-rice` | 泉州浥饭（油饭） | 福建泉州 | `https://www.quanzhou.gov.cn/gastronomy/ch/msdh/xwqz/202411/t20241122_3107926.htm` |
| `fujian-gai-cai-minced-pork-rice` | 福建盖菜肉末咸饭 | 福建 | `https://wjw.fujian.gov.cn/xxgk/zfxxgkzl/zfxxgkml/qtzdxx/202509/P020250918623795675713.pdf` |
| `fujian-hyacinth-bean-rice` | 福建扁豆饭 | 福建 | `https://wjw.fujian.gov.cn/xxgk/zfxxgkzl/zfxxgkml/qtzdxx/202509/P020250918623795675713.pdf` |
| `cantonese-cured-meat-claypot-rice` | 广式腊味煲仔饭 | 广东 | `https://com.gd.gov.cn/attachment/0/496/496120/3989095.pdf` |
| `cantonese-mushroom-chicken-claypot-rice` | 广式香菇滑鸡煲仔饭 | 广东 | `https://com.gd.gov.cn/attachment/0/496/496120/3989095.pdf` |
| `cantonese-black-bean-pork-rib-claypot-rice` | 广式豆豉排骨煲仔饭 | 广东 | `https://com.gd.gov.cn/attachment/0/496/496120/3989095.pdf` |
| `xinjiang-lamb-pilaf` | 新疆羊肉抓饭 | 新疆 | `https://www.xinjiang.gov.cn/xinjiang/tsxj/201111/358fd2c0b97841bba6513661c11d770c.shtml` |
| `xinjiang-vegetable-pilaf` | 新疆素抓饭 | 新疆伊宁 | `https://www.yining.gov.cn/yining/tsms/201603/cefe55071af74c2397bd3e86775d76d4.shtml` |
| `guizhou-dong-community-rice` | 贵州侗家社饭 | 贵州玉屏 | `https://www.yp.gov.cn/contents/2022/03/22/receive-de0c1f7d-4e4b-4389-b557-653484c3248e.html` |
| `shaanbei-red-date-cowpea-rice` | 陕北红枣豇豆焖饭 | 陕西米脂 | `https://dfz.shaanxi.gov.cn/zslm/sxsq/msfq/201704/t20170421_2620781.html` |
| `north-china-green-bean-braised-noodles` | 北方豆角焖面 | 晋北—内蒙古西部 | `https://www.wltzq.gov.cn/zjwzq/yxwltzq/ms/201812/t20181204_674031.html` |
| `qinghai-hao-fan` | 青海熬饭 | 青海河湟 | `https://www.huangyuan.gov.cn/index.php?c=show&id=1835&s=special` |
| `shanxi-potato-rice` | 山西岚县土豆饭 | 山西岚县 | `https://www.sxgp.gov.cn/xwzx_358/szfwj_1327/202305/P020230522324003109029.pdf` |
| `shanxi-nitun-millet-rice` | 山西泥屯小米饭 | 山西太原 | `https://www.mct.gov.cn/whzx/qgwhxxlb/sx/202503/t20250313_958804.htm` |
| `tibetan-savory-congee` | 藏式咸稀饭 | 西藏 | `https://www.npc.gov.cn/WZWSREL3pncmR3L25wYy96dC9xdC94emRidGNmbWovMjAwOS0wMy8xOC8xOC9jb250ZW50XzE0OTM5MDguaHRt` |
| `tibetan-gutu` | 藏历年古突 | 西藏 | `https://wlt.xizang.gov.cn/xwzx_69/xydt/202203/t20220302_286683.html` |
| `tibetan-ginseng-fruit-rice` | 西藏人参果饭 | 西藏山南 | `https://www.xizang.gov.cn/xwzx_406/bmkx/202503/t20250317_467534.html` |
| `guangxi-five-color-glutinous-rice` | 广西壮族五色糯米饭 | 广西隆林 | `https://www.longlin.gov.cn/index.php?c=show&id=72858` |
| `she-people-black-rice` | 畲族乌饭 | 华南畲族地区 | `https://mzzjj.gz.gov.cn/xwdt/gqdt/content/post_10848697.html` |
| `banshan-wild-rice` | 半山烧野米饭 | 浙江杭州 | `https://www.ihchina.cn/solarzx_details/18383.html` |
| `hainan-cai-bao-rice` | 海南定安菜包饭 | 海南定安 | `https://ipr.mofcom.gov.cn/article/gnxw/zfbm/zfbmdf/hainan/202409/1988236.html` |
| `dai-pineapple-purple-rice` | 傣族菠萝紫米饭 | 云南傣族地区 | `https://www.neac.gov.cn/seac/ztzl/daiz/fsxg.shtml` |
| `daxi-lotus-leaf-oil-rice` | 大溪荷叶油饭 | 台湾桃园 | `https://travel.tycg.gov.tw/zh-cn/consume/detail/446` |

For every entry, use only a short original `traditional_basis`, not a paraphrase of whole source passages. Use `high` risk for seafood, bone-in meat, raw poultry, or opaque traditional ingredients; use `moderate` for cured meat, eggs, high-fat holiday rice, or unverified grain substitutions; otherwise use `low`.

- [ ] **Step 4: Create the checker**

Create `tools/check-recipe-candidates.mjs`:

```js
#!/usr/bin/env node
import fs from 'node:fs';
import { validateRecipeCandidateLedger } from './lib/recipe-candidate-validator.mjs';

const file = new URL('./data/recipe-candidates.json', import.meta.url);
const ledger = JSON.parse(fs.readFileSync(file, 'utf8'));
const errors = validateRecipeCandidateLedger(ledger);
const total = Array.isArray(ledger?.entries) ? ledger.entries.length : 0;
const production = Array.isArray(ledger?.entries)
  ? ledger.entries.filter(entry => entry?.status === 'approved').length
  : 0;
for (const error of errors) console.error(`❌ ${error}`);
console.log(`传统菜候选 ${total} 道 · 生产可用 ${production} 道`);
console.log(errors.length ? `❌ 传统菜候选册体检不通过: ${errors.length} 项` : '✅ 传统菜候选册体检通过');
process.exit(errors.length ? 1 : 0);
```

- [ ] **Step 5: Run the ledger tests and checker**

Run:

```bash
node --test tools/tests/recipe-candidates.test.mjs
node tools/check-recipe-candidates.mjs
node tools/check-recipes.mjs
```

Expected: all candidate tests pass; the candidate checker reports 30 / 0; production checker still reports 9 families / 12 approved recipes.

- [ ] **Step 6: Commit the candidate ledger task**

```bash
git add tools/data/recipe-candidates.json tools/check-recipe-candidates.mjs tools/tests/recipe-candidates.test.mjs
git commit -m "feat: add traditional Chinese recipe candidates"
```

### Task 3: Document promotion gates and verify the complete change

**Files:**
- Create: `docs/传统菜谱候选册说明.md`
- Test: `tools/tests/recipe-candidates.test.mjs`

**Interfaces:**
- Documentation points contributors to `tools/data/recipe-candidates.json` and `node tools/check-recipe-candidates.mjs`.

- [ ] **Step 1: Write a failing documentation-contract test**

Append this test:

```js
test('candidate ledger documentation preserves the facts-versus-expression boundary', () => {
  const doc = fs.readFileSync(new URL('../../docs/传统菜谱候选册说明.md', import.meta.url), 'utf8');
  assert.match(doc, /传统事实/);
  assert.match(doc, /不复制/);
  assert.match(doc, /原创标准配方/);
  assert.match(doc, /node tools\/check-recipe-candidates\.mjs/);
});
```

- [ ] **Step 2: Run the test to verify it fails for the missing documentation**

Run: `node --test tools/tests/recipe-candidates.test.mjs`  
Expected: failure with `ENOENT` for `docs/传统菜谱候选册说明.md`.

- [ ] **Step 3: Write the contributor document**

Create `docs/传统菜谱候选册说明.md` with the following sections:

1. “这是什么”：research-only candidate ledger, not a runtime source.
2. “传统事实与受保护表达”：names, region, broad patterns are factual research; do not copy prose, pictures, source ingredient tables, quantities, timing, or recipe steps.
3. “何时能变成生产菜谱”：project-authored standard recipe, explicit substitutions, food-safety/one-pot review, first-party canonical source page, then existing recipe checker/regression and human review.
4. “怎么检查”：the exact command `node tools/check-recipe-candidates.mjs`, followed by `node tools/check-recipes.mjs` before any promotion.
5. “风险分层”：low / moderate / high and the required additional scrutiny for poultry, egg, seafood, bones, unknown local ingredient names, and cured meats.

- [ ] **Step 4: Run the focused and full verification set**

Run:

```bash
node --test tools/tests/recipe-candidates.test.mjs
node tools/check-recipe-candidates.mjs
node tools/check-recipes.mjs
node --test tools/tests/recipe-library.test.mjs tools/tests/worker-recipe.test.mjs tools/tests/recipe-parity.test.mjs
```

Expected: all commands exit 0, candidate checker reports 30 / 0, and production tests retain the 9-family / 12-recipe baseline.

- [ ] **Step 5: Commit the documentation task**

```bash
git add docs/传统菜谱候选册说明.md tools/tests/recipe-candidates.test.mjs
git commit -m "docs: define traditional recipe promotion gates"
```

### Task 4: Harden the candidate-content and release-count gates

**Files:**
- Create: `tools/lib/recipe-candidate-release-gate.mjs`
- Modify: `tools/lib/recipe-candidate-validator.mjs`
- Modify: `tools/check-recipe-candidates.mjs`
- Modify: `tools/tests/recipe-candidates.test.mjs`

**Interfaces:**
- `validateRecipeCandidateLedger(ledger): string[]` rejects anything other than cultural-fact metadata and rejects fields outside the declared schema.
- `validateRecipeCandidateReleaseGate(ledger, production): string[]` adds the exact first-batch gate: 30 ledger entries, zero `approved` entries, 9 production families, 12 production recipes, and only `approved` production recipes.
- `node tools/check-recipe-candidates.mjs` calls the release gate and exits non-zero for any of those conditions.

- [x] **Step 1: Write failing hard-boundary tests**

Append these tests before implementation:

```js
import { validateRecipeCandidateReleaseGate } from '../lib/recipe-candidate-release-gate.mjs';

test('candidate ledger rejects non-factual kinds, unknown fields, and quantified content', () => {
  const invalid = structuredClone(validLedger);
  invalid.entries[0].basis_refs[0].kind = 'recipe_copy';
  invalid.entries[0].basis_refs[0].nutrition = '每份 500 千卡';
  invalid.entries[0].ingredient_pattern = ['大米 200 克'];
  invalid.entries[0].steps = ['先炒后焖'];
  const errors = validateRecipeCandidateLedger(invalid);
  assert.ok(errors.includes('sample-rice ingredient_pattern must not contain quantities or nutrition claims'));
  assert.ok(errors.includes('sample-rice has unexpected field steps'));
  assert.ok(errors.includes('sample-rice basis ref 0 kind must be cultural_fact'));
  assert.ok(errors.includes('sample-rice basis ref 0 has unexpected field nutrition'));
});

test('candidate release gate locks the first batch and production baseline', () => {
  const ledger = JSON.parse(fs.readFileSync(new URL('../data/recipe-candidates.json', import.meta.url), 'utf8'));
  const production = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateRecipeCandidateReleaseGate(ledger, production), []);
  const shortLedger = structuredClone(ledger);
  shortLedger.entries.pop();
  assert.ok(validateRecipeCandidateReleaseGate(shortLedger, production).includes('candidate ledger must contain exactly 30 entries'));
  const incompleteProduction = structuredClone(production);
  incompleteProduction.recipes.pop();
  assert.ok(validateRecipeCandidateReleaseGate(ledger, incompleteProduction).includes('production library must contain exactly 12 recipes'));
});
```

- [x] **Step 2: Run the focused test to verify the missing module and assertions fail**

Run: `node --test tools/tests/recipe-candidates.test.mjs`
Expected: `ERR_MODULE_NOT_FOUND` for `recipe-candidate-release-gate.mjs`.

- [x] **Step 3: Implement strict schema validation and the release gate**

In `tools/lib/recipe-candidate-validator.mjs`, add exact field allowlists:

```js
const ROOT_FIELDS = new Set(['schema_version', 'purpose', 'entries']);
const ENTRY_FIELDS = new Set([
  'id', 'status', 'name', 'region', 'cuisine', 'form', 'traditional_basis',
  'ingredient_pattern', 'technique_pattern', 'risk_level', 'promotion_requirements', 'basis_refs',
]);
const REF_FIELDS = new Set([
  'kind', 'relationship', 'claim', 'source_type', 'title', 'publisher', 'url',
  'retrieved_at', 'rights_note', 'evidence_scope', 'excluded_scope',
]);
const EVIDENCE_SCOPES = new Set(['dish_name', 'region', 'ingredient_pattern', 'high_level_technique', 'cultural_context']);
const EXCLUDED_SCOPES = new Set(['exact_quantities', 'step_text', 'nutrition', 'safety']);
const PROHIBITED_CONTENT_RE = /(?:\d+\s*(?:克|g|毫升|ml|分钟|分|千卡|kcal|卡路里)|营养|热量|蛋白质|脂肪|碳水)/i;
```

For every object, append `${label} has unexpected field ${key}` for non-allowlisted keys. Require `ref.kind === 'cultural_fact'`; require every scope value to be in its corresponding set; and for each `traditional_basis`, `ingredient_pattern` and `technique_pattern` string that matches `PROHIBITED_CONTENT_RE`, append `${label} ${field} must not contain quantities or nutrition claims`. Keep the current required-field errors and their deterministic order.

Create `tools/lib/recipe-candidate-release-gate.mjs`:

```js
import { validateRecipeCandidateLedger } from './recipe-candidate-validator.mjs';

export function validateRecipeCandidateReleaseGate(ledger, production) {
  const errors = [...validateRecipeCandidateLedger(ledger)];
  const entries = Array.isArray(ledger?.entries) ? ledger.entries : [];
  if (entries.length !== 30) errors.push('candidate ledger must contain exactly 30 entries');
  if (entries.filter(entry => entry?.status === 'approved').length !== 0) {
    errors.push('candidate ledger must contain zero approved entries');
  }
  const families = Array.isArray(production?.families) ? production.families : [];
  const recipes = Array.isArray(production?.recipes) ? production.recipes : [];
  if (families.length !== 9) errors.push('production library must contain exactly 9 families');
  if (recipes.length !== 12) errors.push('production library must contain exactly 12 recipes');
  if (recipes.some(recipe => recipe?.status !== 'approved')) {
    errors.push('production library recipes must all be approved');
  }
  return errors;
}
```

Update `tools/check-recipe-candidates.mjs` to read both JSON files, call `validateRecipeCandidateReleaseGate(ledger, productionLibrary)`, and retain its current success output. It must use the actual count only for the printed line; exit status comes from release-gate errors.

- [x] **Step 4: Run focused tests and both checkers**

Run:

```bash
node --test tools/tests/recipe-candidates.test.mjs
node tools/check-recipe-candidates.mjs
node tools/check-recipes.mjs
```

Expected: 7 candidate tests pass; candidate checker reports 30 / 0 and exits 0; production checker reports 9 families / 12 recipes and exits 0.

- [x] **Step 5: Commit the hardened gates**

```bash
git add tools/lib/recipe-candidate-validator.mjs tools/lib/recipe-candidate-release-gate.mjs tools/check-recipe-candidates.mjs tools/tests/recipe-candidates.test.mjs docs/superpowers/plans/2026-07-17-traditional-chinese-recipe-candidate-ledger.md
git commit -m "fix: harden traditional recipe candidate gates"
```

## Plan self-review

- Spec coverage: Task 1 makes factual provenance machine-checkable; Task 2 adds exactly 30 non-production Chinese candidates and preserves 9 / 12 production state; Task 3 documents the copyright, provenance and safety promotion boundary; Task 4 makes cultural-fact-only fields and the 30 / 0 / 9 / 12 release counts independently enforceable from the CLI.
- Placeholder scan: no TBD/TODO or unspecified code paths remain.
- Type consistency: all tasks use the exported `validateRecipeCandidateLedger(ledger)` function, the same ledger filename, the same facts-only rights note, and the same two required promotion gates.

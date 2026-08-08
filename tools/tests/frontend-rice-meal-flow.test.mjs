import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const OUTPUT = fs.mkdtempSync(path.join(ROOT, 'dist', '.frontend-rice-meal-'));
const build = spawnSync(process.execPath, [
  path.join(ROOT, 'tools', 'build-dist.mjs'),
  '--out-dir', OUTPUT,
  '--build-id', 'frontend-rice-meal-test',
  '--planner-rollout', 'direct-recommend',
  '--generation-mode', 'deterministic',
  '--product-focus', 'rice-meal-v1',
], { cwd: ROOT, encoding:'utf8' });
assert.equal(build.status, 0, `${build.stdout}\n${build.stderr}`);

const shelf = JSON.parse(fs.readFileSync(path.join(OUTPUT, 'source-backed-one-pot-shelf.v1.json'), 'utf8'));
const sourceRecords = Array.isArray(shelf.records) ? shelf.records : [];
test.after(() => fs.rmSync(OUTPUT, { recursive:true, force:true }));

function loadRiceFrontend(responses = [{ body:shelf }], locationOverrides = {}, htmlPath = path.join(OUTPUT, 'index.html')) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map(match => match[1])
    .filter(script => !script.includes('serviceWorker'));
  const root = { innerHTML:'', addEventListener() {} };
  const location = {
    protocol:'https:', hostname:'recipe-validation.yiguochu.pages.dev',
    origin:'https://recipe-validation.yiguochu.pages.dev', search:'',
    ...locationOverrides,
  };
  const calls = [];
  let responseIndex = 0;
  const context = vm.createContext({
    console, URL, Date, Math, JSON, Set, Map, Promise, Error, RegExp, String, Number,
    Boolean, Array, Object, AbortController, structuredClone, setTimeout, clearTimeout, location,
    window:{ location, scrollTo() {} },
    localStorage:{ getItem() { return null; }, setItem() {} },
    alert() {},
    document:{
      getElementById(id) { return id === 'root' ? root : null; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
    },
    fetch:async (url) => {
      calls.push({ url:String(url) });
      const next = responses[responseIndex++];
      if (next instanceof Error) throw next;
      if (!next) throw new Error('unexpected fetch');
      const status = next.status || 200;
      return {
        ok:status >= 200 && status < 300,
        status,
        url:String(url),
        headers:{ get() { return 'application/json'; } },
        async json() { return structuredClone(next.body); },
      };
    },
  });
  scripts.forEach((script, index) => vm.runInContext(script, context, { filename:`rice-index-${index}.js` }));
  return { context, root, calls };
}

function evaluate(context, source) { return vm.runInContext(source, context); }
function tick() { return new Promise(resolve => setTimeout(resolve, 0)); }

test('rice product opens directly on a real source-backed recipe', async () => {
  const { context, root, calls } = loadRiceFrontend();
  await tick();

  assert.equal(evaluate(context, 'RICE_MEAL_PRODUCT'), true);
  assert.equal(evaluate(context, 'state.view'), 'source-rotation');
  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0].url, 'https://recipe-validation.yiguochu.pages.dev').pathname, '/source-backed-one-pot-shelf.v1.json');
  assert.match(root.innerHTML, /一锅出菜饭 · 自由轮替/u);
  assert.match(root.innerHTML, /今天做哪一道/u);
  assert.match(root.innerHTML, /<h2>[^<]+<\/h2>/u);
  assert.doesNotMatch(root.innerHTML, /来源目录原名保留/u);
  assert.match(root.innerHTML, /去资料库记录这道菜/u);
  assert.match(root.innerHTML, /来源记录的步骤/u);
  assert.equal((root.innerHTML.match(/data-act="rotate-source-recipe"/g) || []).length, 1);
  assert.doesNotMatch(root.innerHTML, /data-act="choose-rice-meal"|data-act="choose-plan"|data-pantry-chip=/u);
  assert.doesNotMatch(root.innerHTML, /番茄大米酸香主食锅|鸡腿土豆焖饭/u);
});

test('the first screen has one rotation action and never calls the planner or DeepSeek', async () => {
  const { context, root, calls } = loadRiceFrontend();
  await tick();
  const actionValues = [...root.innerHTML.matchAll(/data-act="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(actionValues, ['rotate-source-recipe']);
  assert.equal(evaluate(context, 'state.sourceRotationRecords.length'), 282);
  assert.doesNotMatch(root.innerHTML, /data-act="choose-rice-meal"|data-act="choose-plan"|候选方案|生成菜谱|plan-meal|generate-plan|DeepSeek/u);
  assert.equal(calls.some(call => /plan-meal|generate-plan/.test(call.url)), false);
});

test('clicking 换一道 rotates to another real recipe without another network call', async () => {
  const { context, root, calls } = loadRiceFrontend();
  await tick();
  const first = evaluate(context, 'state.sourceRotationCurrent.canonical_name');
  evaluate(context, 'rotateSourceRecipe()');
  const second = evaluate(context, 'state.sourceRotationCurrent.canonical_name');
  assert.notEqual(second, first);
  assert.match(root.innerHTML, new RegExp(second.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u'));
  assert.match(root.innerHTML, /第 2 \/ 282 道可轮替菜饭/u);
  assert.equal(calls.length, 1);
});

test('rotation wraps to the first recipe after the last real recipe', async () => {
  const { context, root } = loadRiceFrontend();
  await tick();
  const first = evaluate(context, 'state.sourceRotationCurrent.canonical_name');
  evaluate(context, 'state.sourceRotationIndex = state.sourceRotationRecords.length - 1; state.sourceRotationCurrent = state.sourceRotationRecords[state.sourceRotationIndex]; rotateSourceRecipe()');
  assert.equal(evaluate(context, 'state.sourceRotationIndex'), 0);
  assert.equal(evaluate(context, 'state.sourceRotationCurrent.canonical_name'), first);
  assert.match(root.innerHTML, /已经轮过一遍，从第一道重新开始/u);
});

test('file mode never calls a remote API and gives the local start command instruction', async () => {
  const { context, root, calls } = loadRiceFrontend([], { protocol:'file:', hostname:'', origin:'null' });
  await tick();
  assert.equal(calls.length, 0);
  assert.equal(evaluate(context, 'state.view'), 'source-rotation');
  assert.match(root.innerHTML, /请双击 start\.command 启动本地版本。/u);
});

test('opening the unbuilt source index never falls back to the legacy ingredient form', async () => {
  const { context, root, calls } = loadRiceFrontend([], { protocol:'file:', hostname:'', origin:'null' }, path.join(ROOT, 'index.html'));
  await tick();
  assert.equal(evaluate(context, 'RICE_MEAL_PRODUCT'), true);
  assert.equal(evaluate(context, 'state.view'), 'source-rotation');
  assert.equal(calls.length, 0);
  assert.doesNotMatch(root.innerHTML, /家里的食材|给我一锅|这次怎么做/u);
  assert.match(root.innerHTML, /请双击 start\.command 启动本地版本。/u);
});

test('a catalog load error stays on an explicit source-catalog error page', async () => {
  const { context, root } = loadRiceFrontend([{ status:503, body:{ error:'unavailable' } }]);
  await tick();
  assert.equal(evaluate(context, 'state.view'), 'source-rotation');
  assert.match(root.innerHTML, /菜饭目录暂时打不开/u);
  assert.match(root.innerHTML, /来源菜饭目录没有加载成功/u);
});

test('source-only links are filtered to HTTPS while the original title remains visible', async () => {
  const custom = {
    ...shelf,
    records:[{
      ...sourceRecords[0],
      canonical_name:'上海咸肉菜饭',
      source_refs:[
        { title:'安全来源', url:'https://example.com/real' },
        { title:'不安全来源', url:'javascript:alert(1)' },
      ],
    }],
  };
  const { root } = loadRiceFrontend([{ body:custom }]);
  await tick();
  assert.match(root.innerHTML, /上海咸肉菜饭/u);
  assert.match(root.innerHTML, /https:\/\/example\.com\/real/u);
  assert.doesNotMatch(root.innerHTML, /href="javascript:|查看事实来源：不安全来源/u);
});

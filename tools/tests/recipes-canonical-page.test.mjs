import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../../recipes.html', import.meta.url), 'utf8');
const library = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
const executionLibrary = JSON.parse(fs.readFileSync(new URL('../data/source-backed-execution-library.v1.json', import.meta.url), 'utf8'));
const formalCandidateReview = JSON.parse(fs.readFileSync(new URL('../data/source-backed-formal-candidate-review.v1.json', import.meta.url), 'utf8'));

test('canonical recipe page loads the approved recipe library by query id', () => {
  assert.match(html, /URLSearchParams/);
  assert.match(html, /recipe-library\.json/);
  assert.match(html, /recipe\.id\s*===\s*recipeId/);
  assert.match(html, /recipe\.status\s*===\s*['"]approved['"]/);
});

test('canonical recipe page links to the extensionless source catalog route', () => {
  assert.match(html, /href="\/source-recipes\//u);
  assert.doesNotMatch(html, /href="\/source-recipes\.html"/u);
  assert.match(html, /cook\/?\?id=/u);
});

test('canonical recipe page renders the required provenance fields safely', () => {
  assert.match(html, /origin_candidate_id/);
  assert.match(html, /一锅出项目/);
  assert.match(html, /textContent/);
  assert.match(html, /未找到可公开的菜谱/);
});

test('canonical recipe page visibly renders the updated project household contract', async () => {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      id, hidden:false, textContent:'', children:[],
      replaceChildren() { this.children = []; },
      append(child) { this.children.push(child); },
    });
    return elements.get(id);
  };
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gu)].at(-1)[1];
  vm.runInNewContext(script, {
    URLSearchParams,
    window:{ location:{ search:'?id=cabbage-tofu-braised-rice' } },
    document:{
      getElementById:element,
      createElement() { return { textContent:'', children:[], append(child) { this.children.push(child); } }; },
    },
    fetch:async () => ({ ok:true, json:async () => structuredClone(library) }),
    console,
  });
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(element('recipe').hidden, false);
  assert.equal(element('unavailable').hidden, true);
  assert.match(element('summary').textContent, /白菜.*锅外.*成饭后.*拌入/u);
  assert.match(element('technique').children.map(item => item.textContent).join(' '), /沥干.*弃置.*焖菜水/u);
  assert.match(element('ratios').children.map(item => item.textContent).join(' '), /每100克大米另加约130克清水/u);
  assert.match(element('ratios').children.map(item => item.textContent).join(' '), /每份使用1克盐/u);
});

test('canonical recipe page falls back to the full source execution card for a non-Planner recipe id', async () => {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      id, hidden: false, textContent: '', children: [],
      replaceChildren() { this.children = []; },
      append(child) { this.children.push(child); },
    });
    return elements.get(id);
  };
  const sourceId = 'huairou-lianqiaofan';
  const sourceEntry = executionLibrary.entries.find(entry => entry.recipe_id === sourceId);
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gu)].at(-1)[1];
  vm.runInNewContext(script, {
    URLSearchParams,
    window: { location: { search: `?id=${sourceId}` } },
    document: {
      getElementById: element,
      createElement() { return { textContent: '', children: [], append(child) { this.children.push(child); } }; },
    },
    fetch: async url => {
      if (String(url).includes('recipe-library.json')) return { ok: true, json: async () => structuredClone(library) };
      if (String(url).includes('source-backed-execution-library.v1.json')) return { ok: true, json: async () => structuredClone(executionLibrary) };
      if (String(url).includes('source-backed-formal-candidate-review.v1.json')) return { ok: true, json: async () => structuredClone(formalCandidateReview) };
      throw new Error(`unexpected asset ${url}`);
    },
    console,
  });
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(element('recipe').hidden, true);
  assert.equal(element('sourceExecution').hidden, false);
  assert.equal(element('unavailable').hidden, true);
  assert.match(element('sourceName').textContent, /怀柔敛巧饭/u);
  assert.match(element('sourceMethodStatus').textContent, /研究来源/u);
  assert.equal(element('sourceMethodSteps').children.length, sourceEntry.execution_card.steps.length);
  assert.ok(element('sourceMethodIngredients').children.length > 0);
  assert.match(element('sourceMethodBoundary').textContent, /正式化阻塞/u);
  assert.ok(element('sourceFormalReview').children.length > 0);
  assert.match(element('sourceFormalReview').children.map(item => item.textContent).join(' '), /taxonomy/u);
});

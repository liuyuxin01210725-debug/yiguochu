import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const mainScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(mainScript, 'index.html must contain the main inline script');

function meal(overrides = {}) {
  return {
    dish_name: '测试焖锅',
    form: '一锅炖',
    flavor_tags: ['家常'],
    prep_minutes: 20,
    difficulty: 1,
    taste_preview: '家常炖菜',
    why: '适合这次做饭',
    has_fish: false,
    veg_count: 2,
    ingredients: ['测试主料', '测试主食', '测试蔬菜'].map(name => ({
      name, grams: 100, kcal: 260, p: 12, fb: 3, mg: 1, k: 1, ca: 1,
      fe: 1, zn: 1, na: 1, vc: 1, vd: 0, w3: 0,
    })),
    steps: ['处理食材。', '入锅加热。', '煮熟后出锅。'],
    family_id: 'family-stew',
    base_recipe_id: 'trusted-stew',
    basis_level: 'classic',
    pairing_basis: '以「可靠焖锅」的基础结构制作。',
    used_pantry: ['测试主料'],
    unused_pantry: [],
    source_refs: [{
      title: 'Trusted recipe',
      url: 'https://example.com/recipe',
      license: 'CC BY 4.0',
      attribution: 'Example authors',
    }],
    validation_flags: [],
    ...overrides,
  };
}

function loadFrontend(responses = []) {
  const root = { innerHTML: '', addEventListener() {} };
  const calls = [];
  let responseIndex = 0;
  const location = { protocol: 'https:', hostname: 'app.test', origin: 'https://app.test' };
  const window = { YIGUOCHU_PROXY: 'https://api.test', scrollTo() {}, location };
  const context = vm.createContext({
    console,
    URL,
    Date,
    Math,
    JSON,
    Set,
    Map,
    Promise,
    Error,
    RegExp,
    String,
    Number,
    Boolean,
    Array,
    Object,
    AbortController,
    structuredClone,
    setTimeout,
    clearTimeout,
    location,
    window,
    alert() {},
    localStorage: { getItem() { return null; }, setItem() {} },
    document: {
      getElementById(id) { return id === 'root' ? root : null; },
      querySelector() { return null; },
    },
    fetch: async (url, init) => {
      calls.push({ url, init });
      const next = responses[responseIndex++];
      if (next instanceof Error) throw next;
      if (!next) throw new Error('unexpected fetch');
      const status = next.status || 200;
      return {
        ok: status >= 200 && status < 300,
        status,
        async json() { return structuredClone(next.body); },
      };
    },
  });
  vm.runInContext(mainScript, context, { filename: 'index-inline.js' });
  return { context, calls, root };
}

function evaluate(context, source) {
  return vm.runInContext(source, context);
}

test('frontend maps and renders trusted recipe evidence', () => {
  for (const token of ['base_recipe_id', 'pairing_basis', 'unused_pantry', 'validation_flags', 'recipeBasisBlock']) {
    assert.match(html, new RegExp(token));
  }
});

test('swap copy no longer promises every pantry item is used', () => {
  assert.doesNotMatch(html, /换菜会一直带着家里的食材|换菜时一直带着/);
  assert.equal((html.match(/会优先使用，搭不上的会说明/g) || []).length, 2);
});

test('safeHttpUrl accepts direct HTTPS and rejects unsafe URL forms', () => {
  const { context } = loadFrontend();
  const values = JSON.parse(evaluate(context, `JSON.stringify([
    safeHttpUrl('https://example.com/path?q=1#part'),
    safeHttpUrl('http://example.com'),
    safeHttpUrl('//example.com/path'),
    safeHttpUrl('javascript:alert(1)'),
    safeHttpUrl('data:text/html,bad'),
    safeHttpUrl('https://user:pass@example.com/path'),
    safeHttpUrl('https://example.com\\\\@evil.test/path'),
    safeHttpUrl('\\nhttps://example.com/path'),
    safeHttpUrl('https://example.com/path\\r'),
    safeHttpUrl('https://example.com/\\u0000path'),
    safeHttpUrl('https://example.com/\\tpath')
  ])`));
  assert.equal(values[0], 'https://example.com/path?q=1#part');
  assert.deepEqual(values.slice(1), ['', '', '', '', '', '', '', '', '', '']);
});

test('mapDish strictly normalizes trusted metadata and bounds source records', () => {
  const { context } = loadFrontend();
  const sources = Array.from({ length: 7 }, (_, index) => ({
    title: index === 0 ? '  Trusted title  ' : `Source ${index}`,
    url: index === 1 ? 'http://unsafe.test/source' : `https://example.com/source-${index}`,
    license: 'CC BY 4.0',
    attribution: 'Example attribution',
  }));
  const input = meal({
    family_id: '  family-one  ',
    base_recipe_id: '  base-one  ',
    basis_level: 'forged-level',
    pairing_basis: '  以可靠基础做法组合。  ',
    used_pantry: ['  鸡蛋  ', 42, '', '鸡蛋', '<b>白菜</b>'],
    unused_pantry: ['黄瓜', null],
    source_refs: sources,
    validation_flags: ['unsafe-step', 7, '', 'unsafe-step'],
  });
  const mapped = JSON.parse(evaluate(context,
    `JSON.stringify((() => { const d = mapDish(${JSON.stringify(input)}, { servings: 1 }); return ({
      familyId:d.familyId, baseRecipeId:d.baseRecipeId, basisLevel:d.basisLevel,
      pairingBasis:d.pairingBasis, usedPantry:d.usedPantry, unusedPantry:d.unusedPantry,
      sourceRefs:d.sourceRefs, validationFlags:d.validationFlags
    }); })())`));
  assert.equal(mapped.familyId, 'family-one');
  assert.equal(mapped.baseRecipeId, 'base-one');
  assert.equal(mapped.basisLevel, '');
  assert.equal(mapped.pairingBasis, '以可靠基础做法组合。');
  assert.deepEqual(mapped.usedPantry, ['鸡蛋', '<b>白菜</b>']);
  assert.deepEqual(mapped.unusedPantry, ['黄瓜']);
  assert.ok(mapped.sourceRefs.length <= 3);
  assert.ok(mapped.sourceRefs.every(source => source.url.startsWith('https://')));
  assert.deepEqual(mapped.validationFlags, ['unsafe-step']);
});

test('recipe evidence escapes text and href and uses source details', () => {
  const { context } = loadFrontend();
  const dish = {
    familyId: 'family',
    baseRecipeId: 'base',
    basisLevel: 'adapted',
    pairingBasis: '<img src=x onerror=alert(1)>',
    usedPantry: ['<b>鸡蛋</b>'],
    unusedPantry: ['白菜', '<script>土豆</script>'],
    sourceRefs: [{
      title: '<img src=x onerror=alert(2)>',
      url: 'https://example.com/source?a=1&b=2',
      license: '<b>CC BY</b>',
      attribution: '<i>Author</i>',
    }],
  };
  const rendered = evaluate(context, `recipeBasisBlock(${JSON.stringify(dish)})`);
  assert.match(rendered, /<details/);
  assert.match(rendered, /搭配依据/);
  assert.match(rendered, /这次没用/);
  assert.match(rendered, /白菜、&lt;script&gt;土豆&lt;\/script&gt;。/);
  assert.match(rendered, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(rendered, /href="https:\/\/example\.com\/source\?a=1&amp;b=2"/);
  assert.doesNotMatch(rendered, /<img|<script>|<b>CC BY|<i>Author/);
  assert.doesNotMatch(rendered, /它不适合这道基础做法|为了清库存硬加进去/);
});

test('evidence is hidden without trusted metadata and on emergency fallback', () => {
  const { context } = loadFrontend();
  assert.equal(evaluate(context, `recipeBasisBlock({ pairingBasis:'untrusted', sourceRefs:[] })`), '');
  const trusted = meal();
  const rendered = evaluate(context, `(() => {
    const d = mapDish(${JSON.stringify(trusted)}, { servings:1 });
    state.dish = d; state.items = d.ingredients.map(x => ({...x}));
    return resultScreen(true);
  })()`);
  assert.match(rendered, /应急参考 · 未按你的偏好定制/);
  assert.doesNotMatch(rendered, /recipe-basis|>搭配依据：/);
});

test('validation flags are a hard score failure', () => {
  const { context } = loadFrontend();
  const score = JSON.parse(evaluate(context, `JSON.stringify((() => {
    state.profile = { purpose:'fresh', servings:'1', pantry:'', dislikes:'' };
    return scoreDish({ name:'炖菜', form:'炖锅', steps:['煮熟'], minutes:20,
      ingredients:[{name:'食材'}], kcal:700, purpose:'fresh', _targets:{kcal:650},
      validationFlags:['high_risk_not_cooked'] });
  })())`));
  assert.equal(score.ok, false);
});

test('two unsafe generations throw unsafe_recipe after exactly two requests', async () => {
  const { context, calls } = loadFrontend([
    { body: meal({ base_recipe_id: 'unsafe-one', validation_flags: ['flag-one'] }) },
    { body: meal({ base_recipe_id: 'unsafe-two', validation_flags: ['flag-two'] }) },
  ]);
  await assert.rejects(
    evaluate(context, `fetchRealDish({})`),
    error => error?.code === 'unsafe_recipe',
  );
  assert.equal(calls.length, 2);
});

test('an unsafe first generation returns a safe second generation', async () => {
  const { context, calls } = loadFrontend([
    { body: meal({ base_recipe_id: 'unsafe-one', validation_flags: ['flag-one'] }) },
    { body: meal({ base_recipe_id: 'safe-two', validation_flags: [] }) },
  ]);
  const result = await evaluate(context, `fetchRealDish({})`);
  assert.equal(result.baseRecipeId, 'safe-two');
  assert.equal(calls.length, 2);
});

test('a safe first generation returns immediately after one request', async () => {
  const { context, calls } = loadFrontend([{ body: meal({ base_recipe_id: 'safe-one' }) }]);
  const result = await evaluate(context, `fetchRealDish({})`);
  assert.equal(result.baseRecipeId, 'safe-one');
  assert.equal(calls.length, 1);
});

test('generation request includes bounded recent recipe metadata and swap intent', async () => {
  const { context, calls } = loadFrontend([{ body: meal() }]);
  await evaluate(context, `(() => {
    state.dish = { name:'  上一道菜  ', baseRecipeId:'  base-old  ', familyId:'  family-old  ' };
    return fetchRealDish({ swap:'flavor' });
  })()`);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.constraints.swap_intent, 'flavor');
  assert.deepEqual(body.constraints.recent_dishes, ['上一道菜']);
  assert.deepEqual(body.constraints.recent_base_recipes, ['base-old']);
  assert.deepEqual(body.constraints.recent_families, ['family-old']);
});

test('unsafe_recipe maps to the explicit emergency reference message', () => {
  const { context } = loadFrontend();
  const copy = JSON.parse(evaluate(context, `JSON.stringify(fallbackCopy({ code:'unsafe_recipe' }))`));
  assert.equal(copy.text, '这版做法没有通过食材和熟制检查，下面先给一个应急参考。');
});

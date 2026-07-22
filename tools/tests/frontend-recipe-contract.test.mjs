import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const appScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(match => match[1])
  .filter(script => !script.includes('serviceWorker'));
assert.ok(appScripts.length >= 2, 'index.html must contain the main and safety scripts');

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
    adaptation_note: '',
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

function loadFrontend(responses = [], options = {}) {
  const root = { innerHTML: '', addEventListener() {} };
  const calls = [];
  let responseIndex = 0;
  const location = {
    protocol: 'https:', hostname: 'app.test', origin: 'https://app.test',
    ...(options.location || {}),
  };
  const window = { scrollTo() {}, location };
  if (options.proxy !== null) window.YIGUOCHU_PROXY = options.proxy || 'https://api.test';
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
    localStorage: options.storage || { getItem() { return null; }, setItem() {} },
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
  for (const [index, script] of appScripts.entries()) {
    vm.runInContext(script, context, { filename: `index-inline-${index + 1}.js` });
  }
  return { context, calls, root };
}

function evaluate(context, source) {
  return vm.runInContext(source, context);
}

// 可共享的 localStorage stub: 同一个实例传给多次 loadFrontend, 即模拟"同一浏览器跨会话"
function sharedStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
  };
}

test('frontend maps and renders trusted recipe evidence', () => {
  for (const token of ['base_recipe_id', 'pairing_basis', 'unused_pantry', 'validation_flags', 'recipeBasisBlock']) {
    assert.match(html, new RegExp(token));
  }
});

test('preview uses only its same-origin generation endpoint', () => {
  const { context } = loadFrontend([], {
    proxy: null,
    location: {
      protocol: 'https:',
      hostname: 'recipe-validation.yiguochu.pages.dev',
      origin: 'https://recipe-validation.yiguochu.pages.dev',
    },
  });
  assert.deepEqual(
    JSON.parse(evaluate(context, `JSON.stringify(apiCandidates('/generate-meal'))`)),
    ['/generate-meal'],
  );
});

test('swap copy no longer promises every pantry item is used', () => {
  assert.doesNotMatch(html, /换菜会一直带着家里的食材|换菜时一直带着/);
  assert.equal((html.match(/会优先使用，搭不上的会说明/g) || []).length, 1);
  assert.match(html, /1–6 种会作为本锅必用食材；超过 6 种会先分组，再由你选择这一锅/);
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

test('frontend preserves trusted evidence for the promoted traditional recipes', () => {
  const { context } = loadFrontend();
  const promoted = [
    {
      base_recipe_id: 'shanghai-salted-pork-vegetable-rice',
      pairing_basis: '以「上海奉贤咸肉菜饭」为基础，使用大米、咸五花肉、小白菜。',
      source_refs: [{
        title: '一锅出原创标准配方：上海奉贤咸肉菜饭',
        url: 'https://yiguochu.pages.dev/recipes.html?id=shanghai-salted-pork-vegetable-rice',
        license: '一锅出项目原创标准配方，保留所有权利',
        attribution: '一锅出项目',
      }],
    },
    {
      base_recipe_id: 'she-people-black-rice',
      pairing_basis: '以「畲族乌饭风味家庭适配版」为基础，使用糯米、食品级黑米色粉。',
      source_refs: [{
        title: '一锅出原创标准配方：畲族乌饭风味家庭适配版',
        url: 'https://yiguochu.pages.dev/recipes.html?id=she-people-black-rice',
        license: '一锅出项目原创标准配方，保留所有权利',
        attribution: '一锅出项目',
      }],
    },
  ];
  for (const fixture of promoted) {
    const mapped = JSON.parse(evaluate(context,
      `JSON.stringify(mapDish(${JSON.stringify(meal({ ...fixture, validation_flags: [] }))}, { servings: 1 }))`));
    assert.equal(mapped.baseRecipeId, fixture.base_recipe_id);
    assert.equal(mapped.pairingBasis, fixture.pairing_basis);
    assert.deepEqual(mapped.validationFlags, []);
    assert.equal(mapped.sourceRefs.length, 1);
    assert.equal(mapped.sourceRefs[0].url, fixture.source_refs[0].url);
    assert.equal(mapped.sourceRefs[0].title, fixture.source_refs[0].title);
    const rendered = evaluate(context, `recipeBasisBlock(${JSON.stringify(mapped)})`);
    assert.match(rendered, new RegExp(fixture.base_recipe_id));
  }
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

test('evidence is hidden without trusted metadata', () => {
  const { context } = loadFrontend();
  assert.equal(evaluate(context, `recipeBasisBlock({ pairingBasis:'untrusted', sourceRefs:[] })`), '');
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

test('an undersized empty-pantry meal is classified as portion_too_small instead of unsafe_recipe', async () => {
  const tooSmall = meal({
    base_recipe_id: 'greens-tofu-vermicelli-pot',
    ingredients: ['粉丝', '青菜', '老豆腐'].map(name => ({
      name, grams: 100, kcal: 200, p: 8, fb: 2, mg: 1, k: 1, ca: 1,
      fe: 1, zn: 1, na: 1, vc: 1, vd: 0, w3: 0,
    })),
  });
  const { context } = loadFrontend([{ body: tooSmall }]);
  await assert.rejects(
    evaluate(context, `(() => {
      state.profile = { purpose:'quick', servings:'2', pantry:'', dislikes:'' };
      return fetchRealDish({});
    })()`),
    error => error?.code === 'portion_too_small',
  );
});

test('pantry grouping response keeps the structured plan and renders choices', async () => {
  const pantryPlan = {
    original: ['鸡蛋','西红柿','土豆','鸡胸肉','西兰花','豆腐','胡萝卜'],
    groups: [
      { recipe_id:'a', recipe_name:'番茄鸡蛋焖饭', cuisine:'中式家常', items:['鸡蛋','西红柿','土豆'], leftovers:['鸡胸肉','西兰花','豆腐','胡萝卜'], coverage:3, total:7 },
      { recipe_id:'b', recipe_name:'西兰花鸡肉饭锅', cuisine:'中式家常', items:['鸡胸肉','西兰花','胡萝卜'], leftovers:['鸡蛋','西红柿','土豆','豆腐'], coverage:3, total:7 },
    ],
    unplanned: ['豆腐'],
  };
  const { context, root } = loadFrontend([{ status:409, body:{
    code:'pantry_needs_grouping',
    error:'这些食材需要先分组',
    pantry_plan: pantryPlan,
  } }]);
  await assert.rejects(
    evaluate(context, `fetchRealDish({})`),
    error => error?.code === 'pantry_needs_grouping' && error?.pantryPlan?.groups?.length === 2,
  );
  evaluate(context, `showGenerationFailure(Object.assign(new Error('plan'), {
    code:'pantry_needs_grouping', pantryPlan:${JSON.stringify(pantryPlan)}, retryable:false
  }))`);
  assert.equal(evaluate(context, `state.view`), 'pantry-plan');
  assert.match(root.innerHTML, /先选这一锅用什么/);
  assert.match(root.innerHTML, /本锅使用 3\/7 种/);
  assert.match(root.innerHTML, /番茄鸡蛋焖饭/);
  assert.match(root.innerHTML, /西兰花鸡肉饭锅/);
  assert.match(root.innerHTML, /data-act="choose-pantry-group"/);
});

test('more than twenty pantry items are blocked locally without silently truncating or calling the API', async () => {
  const pantry = Array.from({ length:21 }, (_, index) => `食材${index + 1}`).join(',');
  const { context, calls, root } = loadFrontend();
  await evaluate(context, `(async () => {
    state.profile.pantry = ${JSON.stringify(pantry)};
    await runGenerate({ profile:state.profile });
  })()`);
  assert.equal(calls.length, 0);
  assert.equal(evaluate(context, `state.view`), 'gen-failed');
  assert.match(root.innerHTML, /一次最多填写 20 种/);
  assert.equal(evaluate(context, `state.profile.pantry.split(',').length`), 21);
});

test('choosing a pantry group sends only that group while preserving the original coverage denominator', async () => {
  const plan = {
    original:['鸡蛋','西红柿','土豆','豆腐','白菜','玉米','香菇'],
    groups:[{ recipe_id:'a', recipe_name:'白菜豆腐饭', cuisine:'中式家常', items:['豆腐','白菜','玉米','香菇'], leftovers:['鸡蛋','西红柿','土豆'], coverage:4, total:7 }],
    unplanned:[],
  };
  const responseMeal = meal({
    used_pantry:['豆腐','白菜','玉米','香菇'],
    ingredients:['豆腐','白菜','玉米','香菇','大米'].map(name => ({
      name, grams:100, kcal:260, p:12, fb:3, mg:1, k:1, ca:1,
      fe:1, zn:1, na:1, vc:1, vd:0, w3:0,
    })),
  });
  const { context, calls } = loadFrontend([{ body:responseMeal }]);
  const dish = JSON.parse(await evaluate(context, `(async () => {
    state.profile.pantry = '鸡蛋, 西红柿, 土豆, 豆腐, 白菜, 玉米, 香菇';
    return JSON.stringify(await fetchRealDish({
      pantryOverride:['豆腐','白菜','玉米','香菇'],
      pantryOriginal:${JSON.stringify(plan.original)},
      selectedBaseRecipeId:'a'
    }));
  })()`));
  const requestBody = JSON.parse(calls[0].init.body);
  assert.deepEqual(requestBody.constraints.pantry, ['豆腐','白菜','玉米','香菇']);
  assert.equal(requestBody.constraints.selected_base_recipe_id, 'a');
  assert.match(html, /selectedBaseRecipeId:group\.recipeId/);
  assert.equal(evaluate(context, `state.profile.pantry`), '鸡蛋, 西红柿, 土豆, 豆腐, 白菜, 玉米, 香菇');
  assert.deepEqual(dish.pantryContext.original, plan.original);
  assert.deepEqual(dish.pantryContext.remaining, ['鸡蛋','西红柿','土豆']);
});

test('use leftovers starts the next plan with exactly the remaining foods', async () => {
  const remaining = ['鸡蛋','土豆','鸡胸肉','西兰花','胡萝卜','洋葱','虾仁','青椒','茄子'];
  const { context, calls } = loadFrontend([{ status:409, body:{
    code:'pantry_needs_grouping', error:'需要分组',
    pantry_plan:{ original:remaining, groups:[{
      recipe_id:'next', recipe_name:'下一锅', items:['鸡胸肉','胡萝卜','洋葱'],
      leftovers:remaining.filter(item => !['鸡胸肉','胡萝卜','洋葱'].includes(item)), coverage:3, total:9,
    }], unplanned:[] },
  } }]);
  await evaluate(context, `(async () => {
    state.dish = { pantryContext:{ remaining:${JSON.stringify(remaining)} } };
    generateFromPantryLeftovers();
    await new Promise(resolve => setTimeout(resolve, 0));
  })()`);
  assert.equal(evaluate(context, `state.profile.pantry`), remaining.join(', '));
  assert.deepEqual(JSON.parse(calls[0].init.body).constraints.pantry, remaining);
});

test('editing a generated dish refreshes used and remaining pantry coverage', () => {
  const { context } = loadFrontend();
  const coverage = JSON.parse(evaluate(context, `JSON.stringify((() => {
    state.dish = {
      ingredients:[{name:'豆腐', grams:100, nut:{kcal:80}}, {name:'白菜', grams:100, nut:{kcal:20}}],
      usedPantry:['豆腐','白菜'],
      pantryContext:{original:['豆腐','白菜'], remaining:[]}
    };
    state.items = [{name:'豆腐', grams:100, nut:{kcal:80}}];
    syncDishFromItems();
    return {used:state.dish.usedPantry, remaining:state.dish.pantryContext.remaining};
  })())`));
  assert.deepEqual(coverage, { used:['豆腐'], remaining:['白菜'] });
});

test('frontend counts a canonical food name and its alias only once', () => {
  const { context } = loadFrontend();
  assert.deepEqual(
    JSON.parse(evaluate(context, `JSON.stringify(uniquePantryItems(['番茄','西红柿','鸡蛋']))`)),
    ['番茄','鸡蛋'],
  );
});

test('an unsafe generation throws unsafe_recipe after exactly one request', async () => {
  const { context, calls } = loadFrontend([
    { body: meal({ base_recipe_id: 'unsafe-one', validation_flags: ['flag-one'] }) },
  ]);
  await assert.rejects(
    evaluate(context, `fetchRealDish({})`),
    error => error?.code === 'unsafe_recipe',
  );
  assert.equal(calls.length, 1);
});

test('a network failure is not retried implicitly', async () => {
  const { context, calls } = loadFrontend([new Error('connection reset')]);
  await assert.rejects(
    evaluate(context, `fetchRealDish({})`),
    error => error?.code === 'network',
  );
  assert.equal(calls.length, 1);
});

test('frontend bounds and escapes trusted one-pot adaptation evidence', () => {
  const { context } = loadFrontend();
  const input = meal({ adaptation_note: '  <img src=x onerror=alert(1)> 单锅改编  ' });
  const mapped = JSON.parse(evaluate(context,
    `JSON.stringify((() => { const d = mapDish(${JSON.stringify(input)}, {servings:1}); return ({
      adaptationNote:d.adaptationNote, html:recipeBasisBlock(d)
    }); })())`));
  assert.equal(mapped.adaptationNote, '<img src=x onerror=alert(1)> 单锅改编');
  assert.match(mapped.html, /单锅改编说明/);
  assert.match(mapped.html, /&lt;img src=x onerror=alert\(1\)&gt; 单锅改编/);
  assert.doesNotMatch(mapped.html, /<img/);
});

test('frontend limits adaptation notes to four hundred characters', () => {
  const { context } = loadFrontend();
  const note = '改'.repeat(450);
  const length = evaluate(context,
    `mapDish(${JSON.stringify(meal({ adaptation_note: note }))}, {servings:1}).adaptationNote.length`);
  assert.equal(length, 400);
});

test('ordinary quick accepts thirty minutes and rejects thirty-one', () => {
  const { context } = loadFrontend();
  const values = JSON.parse(evaluate(context, `JSON.stringify((() => {
    state.profile = { purpose:'quick', servings:'1', pantry:'', dislikes:'' };
    const base = { name:'炖菜', form:'炖锅', steps:['同锅煮熟'],
      ingredients:[{name:'红扁豆'},{name:'西兰花'}], kcal:650, purpose:'quick',
      _targets:{kcal:650}, validationFlags:[] };
    return [scoreDish({...base, minutes:30}).ok, scoreDish({...base, minutes:31}).ok];
  })())`));
  assert.deepEqual(values, [true, false]);
});

test('a trusted pantry match may trade speed for using the supplied foods without becoming unsafe', () => {
  const { context } = loadFrontend();
  const values = JSON.parse(evaluate(context, `JSON.stringify((() => {
    state.profile = { purpose:'quick', servings:'2', pantry:'豆腐, 白菜, 金针菇', dislikes:'' };
    const base = { name:'白菜豆腐菌菇炊饭', form:'炊饭', steps:['同锅焖熟'], minutes:35,
      ingredients:[{name:'豆腐'},{name:'白菜'},{name:'金针菇'},{name:'大米'}], kcal:1200,
      purpose:'quick', _targets:{kcal:1200}, validationFlags:[],
      baseRecipeId:'taiwan-cabbage-mushroom-rice', usedPantry:['豆腐','白菜','金针菇'] };
    return [scoreDish(base).ok, scoreDish({...base, minutes:41}).ok];
  })())`));
  assert.deepEqual(values, [true, false]);
});

test('a trusted pantry quick recipe may use the backend-safe four steps and nine ingredient rows', () => {
  const { context } = loadFrontend();
  const accepted = JSON.parse(evaluate(context, `JSON.stringify((() => {
    state.profile = { purpose:'quick', servings:'2', pantry:'鸡肉, 大米, 洋葱, 葡萄干, 白菜', dislikes:'' };
    return scoreDish({
      name:'简化鸡肉香料焖饭', form:'焖饭', minutes:30, purpose:'quick',
      steps:['炒香洋葱。','鸡肉煎至变色。','加米和高汤同锅焖熟。','确认鸡肉中心不见粉红。'],
      ingredients:['大米','鸡肉','洋葱','葡萄干','黄油','姜黄','咖喱酱','鸡高汤','盐'].map(name => ({ name })),
      kcal:1300, _targets:{kcal:1300}, validationFlags:[],
      baseRecipeId:'simple-chicken-biryani', usedPantry:['鸡肉','大米','洋葱','葡萄干'],
    }).ok;
  })())`));
  assert.equal(accepted, true);
});

test('frontend trusts the grounded pantry match when a returned ingredient uses an approved alias', () => {
  const { context } = loadFrontend();
  const score = JSON.parse(evaluate(context, `JSON.stringify((() => {
    state.profile = { purpose:'fresh', servings:'2', pantry:'西红柿', dislikes:'' };
    return scoreDish({ name:'番茄炖蛋', form:'炖锅', steps:['同锅煮熟'], minutes:25,
      ingredients:[{name:'番茄'},{name:'鸡蛋'}], kcal:1200, purpose:'fresh',
      _targets:{kcal:1200}, validationFlags:[], baseRecipeId:'shakshuka-tomato-egg',
      usedPantry:['西红柿'], unusedPantry:[] });
  })())`));
  assert.equal(score.ok, true);
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

test('swap request accumulates swap history so backend avoids all seen dishes', async () => {
  const { context, calls } = loadFrontend([{ body: meal() }]);
  await evaluate(context, `(() => {
    state.dish = { name:'菜B', baseRecipeId:'base-b', familyId:'family-b' };
    state.swapHistory = [{ name:'菜A', base:'base-a', fam:'family-a' }];
    return fetchRealDish({ swap:'any' });
  })()`);
  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(body.constraints.recent_dishes, ['菜A', '菜B']);
  assert.deepEqual(body.constraints.recent_base_recipes, ['base-a', 'base-b']);
  assert.deepEqual(body.constraints.recent_families, ['family-a', 'family-b']);
});

test('updateSwapHistory accumulates on swap, dedupes, and keeps history on fresh generation', () => {
  const { context } = loadFrontend();
  const result = JSON.parse(evaluate(context, `(() => {
    state.dish = { name:'菜A', baseRecipeId:'base-a', familyId:'family-a' };
    updateSwapHistory(true);
    state.dish = { name:'菜B', baseRecipeId:'base-b', familyId:'family-b' };
    updateSwapHistory(true);
    updateSwapHistory(true); // 同一道重复换不重复记
    const afterSwaps = JSON.parse(JSON.stringify(state.swapHistory));
    updateSwapHistory(false); // 全新生成不再清空(F-A): 跨会话冷却, 上次吃过的继续避开
    return JSON.stringify({ afterSwaps: afterSwaps, afterFresh: state.swapHistory });
  })()`));
  assert.deepEqual(result.afterSwaps.map(h => ({ name: h.name, base: h.base, fam: h.fam })), [
    { name:'菜A', base:'base-a', fam:'family-a' },
    { name:'菜B', base:'base-b', fam:'family-b' },
  ]);
  assert.ok(result.afterSwaps.every(h => typeof h.ts === 'number'), 'swap history entries carry a timestamp');
  assert.deepEqual(result.afterFresh, result.afterSwaps);
});

test('start-cooking records the dish as eaten so cross-session avoidance covers cooked dishes', () => {
  // codex 指正: 历史不能只记「换掉的」, 「开始做」的菜必须同样进 swapHistory(否则跨会话避开空转)
  assert.match(html, /act === 'start-cooking'\) \{\s*updateSwapHistory\(true\)/);
});

test('swap history persists timestamped entries through STORE', () => {
  const storage = sharedStorage();
  const { context } = loadFrontend([], { storage });
  evaluate(context, `(() => {
    state.dish = { name:'菜A', baseRecipeId:'base-a', familyId:'family-a' };
    updateSwapHistory(true);
  })()`);
  const stored = JSON.parse(evaluate(context, `JSON.stringify(STORE.getSwapHistory())`));
  assert.equal(stored.length, 1);
  assert.deepEqual(
    { name: stored[0].name, base: stored[0].base, fam: stored[0].fam },
    { name:'菜A', base:'base-a', fam:'family-a' },
  );
  assert.equal(typeof stored[0].ts, 'number');
  assert.deepEqual(JSON.parse(storage.getItem('yiguochu_v1')).swapHistory, stored);
});

test('swap history reload drops entries older than seven days and caps at twenty', () => {
  const storage = sharedStorage();
  const now = Date.now();
  const seeded = [
    { name:'过期菜', base:'base-expired', fam:'family-expired', ts: now - 8 * 24 * 3600 * 1000 },
    ...Array.from({ length: 25 }, (_, i) => ({ name:`菜${i + 1}`, base:`base-${i + 1}`, fam:`family-${i + 1}`, ts: now - (25 - i) * 1000 })),
  ];
  storage.setItem('yiguochu_v1', JSON.stringify({ swapHistory: seeded }));
  const { context } = loadFrontend([], { storage });
  const restored = JSON.parse(evaluate(context, `JSON.stringify(state.swapHistory)`));
  assert.equal(restored.length, 20);
  assert.equal(restored[0].name, '菜6'); // 25 条新鲜条目只留最近 20 条
  assert.ok(!restored.some(h => h.name === '过期菜'), 'entries older than seven days are dropped');
  assert.ok(restored.every(h => typeof h.ts === 'number'));
});

test('swap history survives a frontend reload through shared localStorage', () => {
  const storage = sharedStorage();
  const first = loadFrontend([], { storage });
  evaluate(first.context, `(() => {
    state.dish = { name:'菜A', baseRecipeId:'base-a', familyId:'family-a' };
    updateSwapHistory(true);
    state.dish = { name:'菜B', baseRecipeId:'base-b', familyId:'family-b' };
    updateSwapHistory(true);
  })()`);
  const second = loadFrontend([], { storage }); // 重新加载前端但共享同一 localStorage = 跨"会话"
  const restored = JSON.parse(evaluate(second.context, `JSON.stringify(state.swapHistory)`));
  assert.deepEqual(restored.map(h => h.name), ['菜A', '菜B']);
  assert.ok(restored.every(h => typeof h.ts === 'number'));
});

test('frontend controlled rice allergy activation stays bounded', () => {
  const { context } = loadFrontend();
  const positives = JSON.parse(evaluate(context, `JSON.stringify([
    hasControlledRiceAllergyInput('大米过敏'),
    hasControlledRiceAllergyInput('白米过敏'),
    hasControlledRiceAllergyInput('米饭过敏'),
    hasControlledRiceAllergyInput('糙米过敏')
  ])`));
  assert.deepEqual(positives, [true, true, true, true]);
  const negatives = JSON.parse(evaluate(context, `JSON.stringify([
    hasControlledRiceAllergyInput('花生过敏'),
    hasControlledRiceAllergyInput('小米过敏'),
    hasControlledRiceAllergyInput('玉米过敏'),
    hasControlledRiceAllergyInput('米醋过敏')
  ])`));
  assert.deepEqual(negatives, [false, false, false, false]);
});

test('no_safe_recipe with rice allergy renders the rice stop screen with retry', () => {
  const { context, root } = loadFrontend();
  evaluate(context, `(() => {
    state.profile.dislikes = '大米过敏';
    showGenerationFailure({ code:'no_safe_recipe', message:'no safe recipe' });
  })()`);
  assert.equal(evaluate(context, `state.view`), 'safe-stop');
  assert.match(root.innerHTML, /暂时没有安全的无米方案/);
  assert.match(root.innerHTML, /重新生成/);
  assert.match(root.innerHTML, /调整食材或忌口/);
  assert.doesNotMatch(root.innerHTML, /照烧鸡腿杂粮拌饭|应急参考|开始做|需要这些|营养参考/);
});

test('no_safe_recipe without rice allergy uses the generic stop copy', () => {
  const { context, root } = loadFrontend();
  evaluate(context, `(() => {
    state.profile.dislikes = '海鲜过敏';
    showGenerationFailure({ code:'no_safe_recipe', message:'no safe recipe' });
  })()`);
  assert.equal(evaluate(context, `state.view`), 'safe-stop');
  assert.match(root.innerHTML, /暂时没有安全的一锅方案/);
  assert.match(root.innerHTML, /重新生成/);
  assert.doesNotMatch(root.innerHTML, /暂时没有安全的无米方案|应急参考|开始做|营养参考/);
});

test('no_safe_recipe is non-retryable and uses one HTTP request', async () => {
  const { context, calls } = loadFrontend([{
    status: 422,
    body: {
      code: 'no_safe_recipe',
      error: '暂时没有符合这些过敏或忌口条件的可信无米主餐',
    },
  }]);
  await assert.rejects(
    evaluate(context, `(() => {
      state.profile.dislikes = '大米过敏';
      return fetchRealDish({});
    })()`),
    error => error?.code === 'no_safe_recipe' && error?.retryable === false,
  );
  assert.equal(calls.length, 1);
});

test('no compatible pantry recipe is non-retryable and uses one HTTP request', async () => {
  const { context, calls } = loadFrontend([{
    status: 422,
    body: {
      code: 'no_compatible_pantry_recipe',
      error: '当前可信菜谱还搭不上这些食材',
    },
  }]);
  await assert.rejects(
    evaluate(context, `fetchRealDish({})`),
    error => error?.code === 'no_compatible_pantry_recipe' && error?.retryable === false,
  );
  assert.equal(calls.length, 1);
});

test('unmatched pantry failure keeps inputs and never renders an unrelated emergency recipe', () => {
  const { context, root } = loadFrontend();
  evaluate(context, `(() => {
    state.profile.pantry = '豆腐, 白菜, 金针菇';
    showGenerationFailure({ code:'no_compatible_pantry_recipe', message:'no match' });
  })()`);
  assert.equal(evaluate(context, `state.view`), 'pantry-stop');
  assert.match(root.innerHTML, /暂时没有搭配稳妥的菜谱/);
  assert.match(root.innerHTML, /豆腐.*白菜.*金针菇/);
  assert.match(root.innerHTML, /调整现有食材/);
  assert.doesNotMatch(root.innerHTML, /照烧鸡腿杂粮拌饭|应急参考|开始做|营养参考/);
  assert.doesNotMatch(root.innerHTML, /清掉记录继续换/); // 无换一换历史(初始生成)的 422 不走枯竭屏
});

test('no_compatible_pantry_recipe with swap history shows the swap exhaustion screen', () => {
  const { context, root } = loadFrontend();
  evaluate(context, `(() => {
    state.profile.pantry = '豆腐, 白菜, 金针菇';
    state.swapHistory = [{ name:'菜A', base:'base-a', fam:'family-a', ts: Date.now() }];
    showGenerationFailure({ code:'no_compatible_pantry_recipe', message:'no match' });
  })()`);
  assert.equal(evaluate(context, `state.view`), 'pantry-stop');
  assert.match(root.innerHTML, /能搭的菜都换过一遍了/);
  assert.match(root.innerHTML, /data-act="clear-swap-history"/);
  assert.match(root.innerHTML, /清掉记录继续换/);
  assert.match(root.innerHTML, /data-act="edit-safe-profile"/);
  assert.doesNotMatch(root.innerHTML, /暂时没有搭配稳妥的菜谱/);
});

test('clear-swap-history empties memory and storage, then regenerates with the last swap intent', async () => {
  const storage = sharedStorage();
  const { context, calls } = loadFrontend([{ body: meal() }], { storage });
  await evaluate(context, `(async () => {
    state.dish = { name:'当前菜', baseRecipeId:'base-cur', familyId:'family-cur' };
    state.swapHistory = [
      { name:'菜A', base:'base-a', fam:'family-a', ts: Date.now() },
      { name:'菜B', base:'base-b', fam:'family-b', ts: Date.now() },
    ];
    state.lastSwapIntent = 'flavor';
    clearSwapHistoryAndRetry();
    await new Promise(resolve => setTimeout(resolve, 0));
  })()`);
  assert.equal(calls.length, 1);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.constraints.swap_intent, 'flavor');
  // 旧记录已清; runGenerate 按普通换一换把当前菜重新记入(本就是要换掉它), 所以只剩当前菜
  assert.deepEqual(body.constraints.recent_dishes, ['当前菜']);
  assert.deepEqual(body.constraints.recent_base_recipes, ['base-cur']);
  assert.deepEqual(body.constraints.recent_families, ['family-cur']);
  const restored = JSON.parse(evaluate(context, `JSON.stringify(state.swapHistory)`));
  assert.deepEqual(restored.map(h => h.name), ['当前菜']);
  const persisted = JSON.parse(storage.getItem('yiguochu_v1')).swapHistory;
  assert.deepEqual(persisted, restored);
});

test('unsafe pantry generation keeps inputs and never renders an unrelated emergency recipe', () => {
  const { context, root } = loadFrontend();
  evaluate(context, `(() => {
    state.profile.pantry = '鸡蛋, 西红柿, 土豆';
    showGenerationFailure({ code:'unsafe_recipe', message:'validation failed' });
  })()`);
  assert.equal(evaluate(context, `state.view`), 'pantry-stop');
  assert.match(root.innerHTML, /这次菜谱没有通过检查/);
  assert.match(root.innerHTML, /鸡蛋.*西红柿.*土豆/);
  assert.match(root.innerHTML, /重新生成/);
  assert.match(root.innerHTML, /调整现有食材/);
  assert.doesNotMatch(root.innerHTML, /照烧鸡腿杂粮拌饭|应急参考|开始做|营养参考/);
});

test('safe stop returns to the editable profile', () => {
  const { context } = loadFrontend();
  const stateView = JSON.parse(evaluate(context, `JSON.stringify((() => {
    state.view = 'safe-stop';
    state.profileEditing = false;
    openEditableProfile();
    return { view:state.view, editing:state.profileEditing };
  })())`));
  assert.deepEqual(stateView, { view: 'profile', editing: true });
});

test('non-stop failures render a reason-only failure screen with retry and edit actions', () => {
  const { context, root } = loadFrontend();
  evaluate(context, `(() => {
    state.profile.dislikes = '大米过敏';
    showGenerationFailure({ code:'network', message:'failed' });
  })()`);
  // 即使忌口有米, 网络错误也不再误进停止页(F3), 一律走失败屏(F2)
  assert.equal(evaluate(context, `state.view`), 'gen-failed');
  assert.match(root.innerHTML, /这次网络没接上/);
  assert.match(root.innerHTML, /重新生成/);
  assert.match(root.innerHTML, /修改食材忌口/);
  assert.doesNotMatch(root.innerHTML, /照烧鸡腿杂粮拌饭|应急参考|开始做|需要这些|营养参考|暂时没有安全的无米方案/);
});

test('failure screen copy maps error codes to plain-language reasons', () => {
  const { context } = loadFrontend();
  const copies = JSON.parse(evaluate(context,
    `JSON.stringify(['timeout','budget_unavailable','budget_exceeded','rate_limited','http_500'].map(code => genFailureCopy({ code })))`));
  assert.match(copies[0].text, /等太久了，可能是网络或服务器忙/);
  assert.match(copies[1].text, /服务暂时不可用，请稍后再试/);
  assert.match(copies[2].text, /每日总量保护上限/);
  assert.match(copies[3].text, /每日保护额度/);
  assert.match(copies[4].text, /生成失败了，再试一次？/);
  assert.ok(copies.every(copy => !/应急/.test(copy.text)), 'failure copy must not promise an emergency recipe');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const appScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(match => match[1])
  .filter(script => !script.includes('serviceWorker'));
assert.ok(appScripts.length >= 2, 'index.html must contain the main and safety scripts');

test('browser generation timeout stays above the DeepSeek V4 worker timeout', () => {
  assert.match(html, /const GENERATION_REQUEST_TIMEOUT_MS = 55000;/);
  assert.match(html, /setTimeout\(\(\) => ctrl\.abort\(\), GENERATION_REQUEST_TIMEOUT_MS\)/);
});

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

function customPresentation(title = '番茄焖饭') {
  return {
    badge: '自定义方案',
    title,
    subtitle: '按本次选中的食材与受控家常技法组合。',
    source_label: null,
    canonical_path: null,
  };
}

function canonicalPresentation(recipeId, title) {
  return {
    badge: '依据菜谱',
    title,
    subtitle: '按已核验菜谱的用料、比例与熟制顺序呈现。',
    source_label: '查看一锅出标准配方',
    canonical_path: `/recipes.html?id=${recipeId}`,
  };
}

function variantPresentation(recipeId, title) {
  return {
    badge: '菜谱替换版',
    title,
    subtitle: '采用已复核的食材替换，并以菜谱替换版呈现。',
    source_label: '查看一锅出标准配方',
    canonical_path: `/recipes.html?id=${recipeId}`,
  };
}

function plannerResult(overrides = {}) {
  const plan = {
    plan_id: 'pln_v2_test-plan',
    plan_kind: 'single_pot',
    planned_must_use: [],
    planned_prefer_use: [{ raw:'番茄', canonical:'番茄', recognized:true, role:'prefer_use' }],
    unplanned_must_use: [],
    unused_prefer_use: [{ raw:'西兰花', canonical:'西兰花', recognized:true, role:'prefer_use', reason_code:'not_selected' }],
    required_extra_items: [{ name:'大米', grams:160 }],
    coverage_ratio: 0.5,
    recognition_ratio: 1,
    recognized_coverage_ratio: 0.5,
    rejection_reason: null,
    pots: [{
      meal_sequence:1, label:'第一锅', servings:2, template_id:'acid-staple-pot',
      planned_must_use: [],
      planned_prefer_use: [{ raw:'番茄', canonical:'番茄', recognized:true, role:'prefer_use' }],
      slot_assignment:{ acid_base:['番茄'], staple:['大米'] },
      required_extra_items:[{ name:'大米', grams:160 }],
      time_range:{ min_minutes:25, max_minutes:30 },
    }],
    ...(overrides.plan || {}),
  };
  return {
    schema_version:2,
    planner_version:'pantry-planner-v2',
    template_catalog_version:'templates-v2-20260724',
    status:'ready', generation_allowed:true, mode:'recommend', intent:'quick',
    recipe_runtime_catalog_version:null,
    plan_source:'custom_template', recipe_id:null, variant_id:null, identity_level:'custom',
    presentation:customPresentation(),
    normalized_items:[
      { raw:'番茄', canonical:'番茄', recognized:true, role:'prefer_use' },
      { raw:'西兰花', canonical:'西兰花', recognized:true, role:'prefer_use' },
    ],
    commitment:'直接推荐会选择较合适的组合，并如实列出这次未使用的食材。',
    plan,
    unplanned:[], actions:[],
    ...overrides,
    plan,
  };
}

function generatedResult(planned = plannerResult()) {
  return {
    ...structuredClone(planned),
    plan_id:planned.plan.plan_id,
    meals:[{
      meal_sequence:1, servings:2, template_id:'acid-staple-pot',
      plan_source:planned.plan_source,
      recipe_id:planned.recipe_id,
      variant_id:planned.variant_id,
      identity_level:planned.identity_level,
      presentation:structuredClone(planned.presentation),
      locked_ingredients:[
        { ref:'i1', raw_name:'番茄', planned_grams:200 },
        { ref:'e1', raw_name:'大米', planned_grams:160 },
      ],
      dish_name:planned.presentation.title,
      steps:[{ phase:'同锅焖煮', text:'番茄和大米同锅焖熟。' }],
      recommendation_reason:'优先使用番茄，西兰花留到下一顿。',
    }],
  };
}

function plannerCandidate({
  id, templateId, used, unused = [], extras = [{ name:'水', category:'liquid', grams:160 }],
  minutes = 30, identity = {}, presentation = customPresentation(),
}) {
  return plannerResult({
    ...identity,
    presentation,
    normalized_items: [...used, ...unused].map(raw => ({
      raw, canonical:raw, recognized:true, role:'prefer_use',
    })),
    plan: {
      plan_id:id,
      planned_prefer_use:used.map(raw => ({ raw, canonical:raw, recognized:true, role:'prefer_use' })),
      unused_prefer_use:unused.map(raw => ({
        raw, canonical:raw, recognized:true, role:'prefer_use',
        reason_code:'not_selected', reason:'这套组合里先不用，避免为了凑数影响做法。',
      })),
      required_extra_items:extras,
      coverage_ratio:used.length / (used.length + unused.length),
      recognition_ratio:1,
      recognized_coverage_ratio:used.length / (used.length + unused.length),
      pots:[{
        meal_sequence:1, label:'第一锅', servings:2, template_id:templateId,
        planned_must_use:[],
        planned_prefer_use:used.map(raw => ({ raw, canonical:raw, recognized:true, role:'prefer_use' })),
        slot_assignment:{},
        required_extra_items:extras,
        time_range:{ min_minutes:Math.max(5, minutes - 10), max_minutes:minutes },
      }],
    },
  });
}

function plannerBundle(candidates) {
  if (!candidates.length) {
    return plannerResult({
      status:'no_valid_plan',
      generation_allowed:false,
      plan:{
        plan_id:'pln_v2_no-candidates',
        planned_prefer_use:[],
        unused_prefer_use:[],
        required_extra_items:[],
        coverage_ratio:0,
        recognition_ratio:0,
        recognized_coverage_ratio:0,
        pots:[],
      },
      candidate_plans:[],
      preferred_plan_id:null,
    });
  }
  return {
    ...structuredClone(candidates[0]),
    candidate_plans:structuredClone(candidates),
    preferred_plan_id:candidates[0].plan.plan_id,
  };
}

function loadFrontend(responses = [], options = {}) {
  const listeners = new Map();
  const listenerGroups = new Map();
  const root = {
    innerHTML: '',
    addEventListener(type, handler) {
      listeners.set(type, handler);
      const group = listenerGroups.get(type) || [];
      group.push(handler);
      listenerGroups.set(type, group);
    },
  };
  const calls = [];
  let responseIndex = 0;
  const location = {
    protocol: 'https:', hostname: 'app.test', origin: 'https://app.test',
    ...(options.location || {}),
  };
  const window = { scrollTo() {}, location };
  if (options.proxy !== null) window.YIGUOCHU_PROXY = options.proxy || 'https://api.test';
  const context = vm.createContext({
    console: options.console || console,
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
      querySelectorAll() { return []; },
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
        url: next.url || String(url),
        headers: { get(name) { return String(name).toLowerCase() === 'content-type' ? (next.contentType || 'application/json') : null; } },
        async json() {
          if (next.jsonError) throw next.jsonError;
          return structuredClone(next.body);
        },
      };
    },
  });
  const buildId = options.buildId || 'frontend-test';
  const plannerRollout = options.plannerRollout || 'off';
  const generationMode = options.generationMode || 'llm';
  for (const [index, script] of appScripts.entries()) {
    const builtScript = script
      .replaceAll('__YIGUOCHU_BUILD_ID__', buildId)
      .replaceAll('__YIGUOCHU_PLANNER_ROLLOUT__', plannerRollout)
      .replaceAll('__YIGUOCHU_GENERATION_MODE__', generationMode);
    vm.runInContext(builtScript, context, { filename: `index-inline-${index + 1}.js` });
  }
  return { context, calls, root, listeners, listenerGroups };
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

test('localhost uses only the local proxy endpoint', () => {
  const { context } = loadFrontend([], {
    proxy: null,
    location: {
      protocol: 'http:', hostname: 'localhost', origin: 'http://localhost:8081',
    },
  });
  assert.deepEqual(
    JSON.parse(evaluate(context, `JSON.stringify(apiCandidates('/generate-meal'))`)),
    ['http://localhost:8765/generate-meal'],
  );
});

test('file protocol never exposes a production generation endpoint', () => {
  const { context } = loadFrontend([], {
    proxy: 'https://yiguochu.pages.dev',
    location: {
      protocol: 'file:', hostname: '', origin: 'null',
    },
  });
  assert.deepEqual(
    JSON.parse(evaluate(context, `JSON.stringify(apiCandidates('/generate-meal'))`)),
    [],
  );
});

test('file protocol generation asks the user to start the local version without fetching', async () => {
  const { context, calls, root } = loadFrontend([], {
    proxy: null,
    location: {
      protocol: 'file:', hostname: '', origin: 'null',
    },
  });
  await evaluate(context, `runGenerate({ profile:state.profile })`);
  assert.equal(calls.length, 0);
  assert.equal(evaluate(context, `state.view`), 'gen-failed');
  assert.match(root.innerHTML, /请双击 start\.command 启动本地版本。/);
});

test('file protocol planner flow also stays offline and shows the local startup instruction', async () => {
  const { context, calls, root } = loadFrontend([], {
    proxy:null, location:{ protocol:'file:', hostname:'', origin:'null' },
  });
  await evaluate(context, `runPlannerFlow({ autoGenerate:true })`);
  assert.equal(calls.length, 0);
  assert.equal(evaluate(context, 'state.view'), 'gen-failed');
  assert.match(root.innerHTML, /请双击 start\.command 启动本地版本。/);
});

test('production uses only its same-origin generation endpoint', () => {
  const { context } = loadFrontend([], {
    proxy: null,
    location: {
      protocol: 'https:',
      hostname: 'yiguochu.pages.dev',
      origin: 'https://yiguochu.pages.dev',
    },
  });
  assert.deepEqual(
    JSON.parse(evaluate(context, `JSON.stringify(apiCandidates('/generate-meal'))`)),
    ['/generate-meal'],
  );
});

test('public profile keeps only the simple direct-recommendation controls', () => {
  const { context, root } = loadFrontend();
  assert.deepEqual(
    JSON.parse(evaluate(context, 'JSON.stringify(DEFAULT_PROFILE)')),
    { mode:'recommend', intent:'normal', servings:'2', pantry:'', dislikes:'' },
  );
  assert.doesNotMatch(root.innerHTML, /这次需要哪种帮助|帮我清库存|清爽些/);
  assert.doesNotMatch(root.innerHTML, /data-del-myfood/);
  for (const label of ['正常做', '快点吃上', '多做一些']) assert.match(root.innerHTML, new RegExp(label));
  assert.doesNotMatch(root.innerHTML, /食材可不填/);
  assert.match(root.innerHTML, /至少填一种/);
  assert.match(root.innerHTML, /不会为了用完而硬凑/);
});

test('public profile migrates unsupported legacy default chips without deleting real custom choices', () => {
  const { context, root } = loadFrontend();
  evaluate(context, `(() => {
    state.profile = {
      mode:'recommend', intent:'normal', servings:'2', pantry:'', dislikes:'',
      myFoods:['鸡蛋','青椒','茄子','菠菜','香菜'],
    };
    state.profileEditing = true;
    state.view = 'profile';
    render();
  })()`);
  for (const unsupported of ['青椒', '茄子', '菠菜']) {
    assert.doesNotMatch(root.innerHTML, new RegExp('data-pantry-chip="' + unsupported + '"'));
  }
  assert.match(root.innerHTML, /data-pantry-chip="鸡蛋"/);
  assert.match(root.innerHTML, /data-pantry-chip="香菜"/);
});

test('empty direct recommendation stays on the input page with a clear local prompt', async () => {
  const { context, calls, root } = loadFrontend([], {
    plannerRollout:'direct-recommend',
    proxy:null,
  });
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'', dislikes:'' };
    await runPrimaryFlow();
  })()`);
  assert.equal(calls.length, 0);
  assert.equal(evaluate(context, 'state.view'), 'profile');
  assert.match(root.innerHTML, /先选或填写至少一种家里的食材/);
});

test('localhost planner lab keeps the orthogonal mode and intent controls', () => {
  const { root } = loadFrontend([], {
    proxy:null,
    location:{
      protocol:'http:', hostname:'localhost', origin:'http://localhost:8081',
      search:'?planner_v2=1',
    },
  });
  assert.match(root.innerHTML, /这次需要哪种帮助/);
  assert.match(root.innerHTML, /直接推荐/);
  assert.match(root.innerHTML, /帮我清库存/);
  for (const label of ['正常做', '快点吃上', '清爽些', '多做一些']) assert.match(root.innerHTML, new RegExp(label));
});

test('legacy purpose profiles migrate without deleting unrelated saved data', () => {
  for (const [purpose, mode, intent] of [
    ['pantry', 'pantry', 'normal'], ['quick', 'recommend', 'quick'],
    ['fresh', 'recommend', 'fresh'], ['batch', 'recommend', 'batch'],
  ]) {
    const storage = sharedStorage();
    storage.setItem('yiguochu_v1', JSON.stringify({
      profile:{ purpose, servings:'4', pantry:'番茄', dislikes:'花生' },
      choices:[{ keep:true }], custom_key:'keep-me',
    }));
    const { context } = loadFrontend([], {
      storage,
      proxy:null,
      location:{
        protocol:'http:', hostname:'localhost', origin:'http://localhost:8081',
        search:'?planner_v2=1',
      },
    });
    assert.deepEqual(JSON.parse(evaluate(context, `JSON.stringify({mode:state.profile.mode,intent:state.profile.intent,servings:state.profile.servings})`)),
      { mode, intent, servings:'4' });
    const persisted = JSON.parse(storage.getItem('yiguochu_v1'));
    assert.deepEqual(persisted.choices, [{ keep:true }]);
    assert.equal(persisted.custom_key, 'keep-me');
  }
});

test('public startup neutralizes hidden planner modes and unsupported fresh intent', () => {
  for (const [profile, expectedIntent] of [
    [{ mode:'pantry', intent:'normal', servings:'2', pantry:'番茄', dislikes:'' }, 'normal'],
    [{ mode:'recommend', intent:'fresh', servings:'2', pantry:'番茄', dislikes:'' }, 'normal'],
    [{ purpose:'pantry', servings:'2', pantry:'番茄', dislikes:'' }, 'normal'],
    [{ purpose:'batch', servings:'2', pantry:'番茄', dislikes:'' }, 'batch'],
  ]) {
    const storage = sharedStorage();
    storage.setItem('yiguochu_v1', JSON.stringify({ profile }));
    const { context } = loadFrontend([], { storage });
    assert.deepEqual(
      JSON.parse(evaluate(context, 'JSON.stringify({ mode:state.profile.mode, intent:state.profile.intent })')),
      { mode:'recommend', intent:expectedIntent },
    );
  }
});

test('legacy profiles with a missing or unknown purpose migrate to normal intent', () => {
  for (const profile of [
    { servings:'2', pantry:'番茄', dislikes:'' },
    { purpose:'mystery', servings:'2', pantry:'番茄', dislikes:'' },
  ]) {
    const storage = sharedStorage();
    storage.setItem('yiguochu_v1', JSON.stringify({ profile, choices:[{ keep:true }] }));
    const { context } = loadFrontend([], { storage });
    assert.deepEqual(
      JSON.parse(evaluate(context, 'JSON.stringify({ mode:state.profile.mode, intent:state.profile.intent })')),
      { mode:'recommend', intent:'normal' },
    );
    assert.deepEqual(JSON.parse(storage.getItem('yiguochu_v1')).choices, [{ keep:true }]);
  }
});

test('planner request maps pantry text to exactly one promise role and carries the V2 envelope', () => {
  const { context } = loadFrontend();
  const requests = JSON.parse(evaluate(context, `JSON.stringify((() => {
    state.profile = { mode:'pantry', intent:'quick', servings:'2', pantry:'番茄, 鸡蛋', dislikes:'花生' };
    const pantry = buildPlanRequest();
    state.profile.mode = 'recommend';
    const recommend = buildPlanRequest();
    return { pantry, recommend };
  })())`));
  assert.equal(requests.pantry.schema_version, 2);
  assert.equal(requests.pantry.planner_version, 'pantry-planner-v2');
  assert.deepEqual(requests.pantry.constraints.must_use, ['番茄', '鸡蛋']);
  assert.deepEqual(requests.pantry.constraints.prefer_use, []);
  assert.deepEqual(requests.recommend.constraints.must_use, []);
  assert.deepEqual(requests.recommend.constraints.prefer_use, ['番茄', '鸡蛋']);
  assert.equal(requests.pantry.constraints.intent, 'quick');
});

test('initial ready plan generates once with the exact immutable plan request snapshot', async () => {
  const planned = plannerResult();
  const generated = generatedResult(planned);
  const { context, calls } = loadFrontend([{ body:planned }, { body:generated }]);
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'quick', servings:'2', pantry:'番茄, 西兰花', dislikes:'' };
    await runPlannerFlow({ autoGenerate:true });
  })()`);
  assert.deepEqual(calls.map(call => new URL(call.url, 'https://app.test').pathname), ['/plan-meal', '/generate-plan']);
  const plannedBody = JSON.parse(calls[0].init.body);
  const generatedBody = JSON.parse(calls[1].init.body);
  assert.deepEqual(generatedBody.plan_request, plannedBody);
  assert.equal(generatedBody.plan_id, planned.plan.plan_id);
  assert.equal(evaluate(context, 'state.view'), 'v2-result');
});

test('public primary flow uses one legacy generation call with empty or populated pantry', async t => {
  for (const pantry of ['', '测试主料']) {
    await t.test(pantry ? 'populated pantry' : 'empty pantry', async () => {
      const { context, calls } = loadFrontend([{ body:meal({
        used_pantry: pantry ? ['测试主料'] : [],
        unused_pantry: [],
      }) }]);
      await evaluate(context, `(async () => {
        state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:${JSON.stringify(pantry)}, dislikes:'' };
        await runPrimaryFlow();
      })()`);
      assert.deepEqual(
        calls.map(call => new URL(call.url, 'https://app.test').pathname),
        ['/generate-meal'],
      );
      assert.equal(evaluate(context, 'state.view'), 'result');
    });
  }
});

test('direct-recommend rollout stops at deterministic candidates and generates only the chosen plan', async () => {
  const first = plannerCandidate({
    id:'pln_v2_first',
    templateId:'acid-staple-pot',
    used:['番茄','鸡蛋','西兰花','土豆'],
    unused:['玉米'],
  });
  const second = plannerCandidate({
    id:'pln_v2_second',
    templateId:'egg-tofu-vegetable-pot',
    used:['番茄','鸡蛋','西兰花','土豆'],
    unused:['玉米'],
  });
  const generated = generatedResult(second);
  const { context, calls, root } = loadFrontend([
    { body:plannerBundle([first, second]) },
    { body:generated },
  ], { plannerRollout:'direct-recommend', generationMode:'deterministic', proxy:null });

  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'番茄, 鸡蛋, 西兰花, 土豆, 玉米', dislikes:'' };
    await runPrimaryFlow();
  })()`);
  assert.deepEqual(
    calls.map(call => new URL(call.url, 'https://app.test').pathname),
    ['/plan-meal'],
  );
  assert.equal(evaluate(context, 'state.view'), 'v2-candidates');
  assert.equal((root.innerHTML.match(/data-act="choose-plan"/g) || []).length, 2);

  await evaluate(context, `choosePlan('pln_v2_second')`);
  assert.deepEqual(
    calls.map(call => new URL(call.url, 'https://app.test').pathname),
    ['/plan-meal', '/generate-plan'],
  );
  const envelope = JSON.parse(calls[1].init.body);
  assert.equal(envelope.plan_id, 'pln_v2_second');
  assert.equal(evaluate(context, 'state.view'), 'v2-result');
  assert.deepEqual(
    JSON.parse(evaluate(context, 'JSON.stringify(window.__YIGUOCHU_BUILD_META__)')),
    { buildId:'frontend-test', plannerRollout:'direct-recommend', generationMode:'deterministic' },
  );
  assert.doesNotMatch(root.innerHTML, /发送给 AI|调用 AI/u);
  assert.match(root.innerHTML, /受控|确定性/u);
});

test('candidate cards render only server-signed canonical and custom presentation with exact coverage', async () => {
  const recipeId = 'shanghai-salted-pork-vegetable-rice';
  const named = plannerCandidate({
    id:'pln_v2_named_3_of_4', templateId:'savory-mixed-rice-pot',
    used:['大米','咸五花肉','小白菜'], unused:['香菇'],
    identity:{
      recipe_runtime_catalog_version:'recipe-runtime-v1-test',
      plan_source:'named_recipe', recipe_id:recipeId, variant_id:null, identity_level:'canonical',
    },
    presentation:canonicalPresentation(recipeId, '上海奉贤咸肉菜饭'),
  });
  const custom = plannerCandidate({
    id:'pln_v2_custom_4_of_4', templateId:'savory-mixed-rice-pot',
    used:['番茄','鸡蛋','西兰花','土豆'],
    presentation:customPresentation('番茄、鸡蛋焖饭'),
  });
  const { context, root } = loadFrontend([
    { body:plannerBundle([named, custom]) },
  ], { plannerRollout:'direct-recommend', proxy:null });

  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'大米, 咸五花肉, 小白菜, 香菇', dislikes:'' };
    await runPrimaryFlow();
  })()`);

  assert.equal((root.innerHTML.match(/data-act="choose-plan"/g) || []).length, 2);
  assert.match(root.innerHTML, /依据菜谱/);
  assert.match(root.innerHTML, /上海奉贤咸肉菜饭/);
  assert.match(root.innerHTML, /用上 3\/4/);
  assert.match(root.innerHTML, /href="\/recipes\.html\?id=shanghai-salted-pork-vegetable-rice"/);
  assert.match(root.innerHTML, />查看一锅出标准配方<\/a>/);
  assert.match(root.innerHTML, /自定义方案/);
  assert.match(root.innerHTML, /番茄、鸡蛋焖饭/);
  assert.match(root.innerHTML, /用上 4\/4/);
  assert.doesNotMatch(root.innerHTML, /人工批准|正宗/u);
  assert.doesNotMatch(root.innerHTML, /savory-mixed-rice-pot|酸香主食锅|家常主食锅/u);
});

test('approved variant card shows the reviewed replacement name instead of the canonical title', async () => {
  const recipeId = 'shanghai-salted-pork-vegetable-rice';
  const variant = plannerCandidate({
    id:'pln_v2_variant', templateId:'savory-mixed-rice-pot', used:['大米','咸五花肉','菜心'],
    identity:{
      recipe_runtime_catalog_version:'recipe-runtime-v1-test',
      plan_source:'recipe_variant', recipe_id:recipeId,
      variant_id:'shanghai-choy-sum-variant', identity_level:'approved_variant',
    },
    presentation:variantPresentation(recipeId, '上海奉贤咸肉菜饭（菜心版）'),
  });
  const { context, root } = loadFrontend([{ body:plannerBundle([variant]) }], {
    plannerRollout:'direct-recommend', proxy:null,
  });
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'大米, 咸五花肉, 菜心', dislikes:'' };
    await runPrimaryFlow();
  })()`);

  assert.match(root.innerHTML, /菜谱替换版/);
  assert.match(root.innerHTML, /上海奉贤咸肉菜饭（菜心版）/);
  assert.match(root.innerHTML, /已复核的食材替换/);
  assert.doesNotMatch(root.innerHTML, /pantry-plan-name">大米、咸五花肉、菜心/u);
});

test('missing unknown unsafe and below-floor presentations fail closed before cards become clickable', async () => {
  const missing = plannerCandidate({
    id:'pln_v2_missing_presentation', templateId:'acid-staple-pot', used:['番茄','鸡蛋'],
    presentation:null,
  });
  const unknown = plannerCandidate({
    id:'pln_v2_unknown_field', templateId:'acid-staple-pot', used:['番茄','鸡蛋'],
    presentation:{ ...customPresentation('番茄鸡蛋焖饭'), engineering_label:'acid-staple-pot' },
  });
  const unsafe = plannerCandidate({
    id:'pln_v2_unsafe_title', templateId:'acid-staple-pot', used:['番茄','鸡蛋'],
    presentation:customPresentation('正宗地域经典番茄鸡蛋饭'),
  });
  const oneOfTwo = plannerCandidate({
    id:'pln_v2_one_of_two', templateId:'acid-staple-pot', used:['番茄'], unused:['鸡蛋'],
    presentation:customPresentation('番茄焖饭'),
  });
  const { context, calls, root } = loadFrontend([
    { body:plannerBundle([missing, unknown, unsafe, oneOfTwo]) },
  ], { plannerRollout:'direct-recommend', proxy:null });
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'番茄, 鸡蛋', dislikes:'' };
    await runPrimaryFlow();
    await choosePlan('pln_v2_missing_presentation');
  })()`);

  assert.equal(calls.length, 1);
  assert.equal(evaluate(context, 'state.planCandidates.length'), 0);
  assert.doesNotMatch(root.innerHTML, /data-act="choose-plan"/);
  assert.doesNotMatch(root.innerHTML, /可靠的一锅方案/);
});

test('chosen server candidate and generated result retain exact identity and presentation', async () => {
  const recipeId = 'shanghai-salted-pork-vegetable-rice';
  const chosen = plannerCandidate({
    id:'pln_v2_exact_identity', templateId:'savory-mixed-rice-pot', used:['大米','咸五花肉','小白菜'],
    identity:{
      recipe_runtime_catalog_version:'recipe-runtime-v1-test',
      plan_source:'named_recipe', recipe_id:recipeId, variant_id:null, identity_level:'canonical',
    },
    presentation:canonicalPresentation(recipeId, '上海奉贤咸肉菜饭'),
  });
  const generated = generatedResult(chosen);
  const { context, root } = loadFrontend([
    { body:plannerBundle([chosen]) }, { body:generated },
  ], { plannerRollout:'direct-recommend', generationMode:'deterministic', proxy:null });
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'大米, 咸五花肉, 小白菜', dislikes:'' };
    await runPrimaryFlow();
    await choosePlan('pln_v2_exact_identity');
  })()`);

  assert.equal(evaluate(context, 'state.view'), 'v2-result');
  assert.equal(evaluate(context, 'state.displayedPlan.plan.plan_id'), 'pln_v2_exact_identity');
  assert.equal(evaluate(context, 'state.displayedPlan.plan_source'), 'named_recipe');
  assert.equal(evaluate(context, 'state.displayedPlan.recipe_id'), recipeId);
  assert.equal(evaluate(context, 'state.displayedPlan.variant_id'), null);
  assert.equal(evaluate(context, 'state.displayedPlan.identity_level'), 'canonical');
  assert.equal(evaluate(context, 'state.generatedPlan.presentation.title'), '上海奉贤咸肉菜饭');
  assert.match(root.innerHTML, /依据菜谱/);
  assert.match(root.innerHTML, /上海奉贤咸肉菜饭/);
});

test('generated identity mismatch fails deterministically while retaining the selected plan', async () => {
  const chosen = plannerCandidate({
    id:'pln_v2_selected_before_mismatch', templateId:'acid-staple-pot', used:['番茄','鸡蛋'],
    presentation:customPresentation('番茄、鸡蛋焖饭'),
  });
  const mismatched = generatedResult(chosen);
  mismatched.plan_source = 'named_recipe';
  mismatched.recipe_id = 'foreign-recipe';
  mismatched.identity_level = 'canonical';
  mismatched.presentation = canonicalPresentation('foreign-recipe', '外部菜名');
  const { context, calls, root } = loadFrontend([
    { body:plannerBundle([chosen]) }, { body:mismatched },
  ], { plannerRollout:'direct-recommend', generationMode:'deterministic', proxy:null });
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'番茄, 鸡蛋', dislikes:'' };
    await runPrimaryFlow();
    await choosePlan('pln_v2_selected_before_mismatch');
  })()`);

  assert.equal(calls.length, 2);
  assert.equal(evaluate(context, 'state.view'), 'gen-failed');
  assert.equal(evaluate(context, 'state.lastGenError.code'), 'plan_identity_mismatch');
  assert.equal(evaluate(context, 'state.displayedPlan.plan.plan_id'), 'pln_v2_selected_before_mismatch');
  assert.match(root.innerHTML, /这套组合还在/);
  assert.doesNotMatch(root.innerHTML, /外部菜名/);
});

test('multi-pot custom generation accepts each strictly validated per-pot server title', () => {
  const planned = plannerResult({ plan:{
    plan_id:'pln_v2_multi_presentations', plan_kind:'multi_pot',
    pots:[
      plannerResult().plan.pots[0],
      { ...plannerResult().plan.pots[0], meal_sequence:2, template_id:'stew-pot' },
    ],
  } });
  const generated = generatedResult(planned);
  generated.meals.push({
    ...structuredClone(generated.meals[0]),
    meal_sequence:2,
    template_id:'stew-pot',
    presentation:customPresentation('菌菇、土豆炖锅'),
    dish_name:'菌菇、土豆炖锅',
  });
  const { context } = loadFrontend();

  assert.equal(
    evaluate(context, `generatedMatchesSelectedPlan(${JSON.stringify(generated)}, ${JSON.stringify(planned)})`),
    true,
  );
});

test('public direct recommendation stops seven through ten inputs before planning and retains exact text', async () => {
  for (const count of [7, 10]) {
    const pantry = Array.from({ length:count }, (_, index) => `食材${index + 1}`).join(', ');
    const { context, calls, root } = loadFrontend([], {
      plannerRollout:'direct-recommend', generationMode:'deterministic', proxy:null,
    });
    await evaluate(context, `(async () => {
      state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:${JSON.stringify(pantry)}, dislikes:'' };
      await runPrimaryFlow();
    })()`);
    assert.equal(calls.length, 0, `${count} inputs must not call planner or generation`);
    assert.equal(evaluate(context, 'state.view'), 'profile');
    assert.equal(evaluate(context, 'state.profile.pantry'), pantry);
    assert.match(root.innerHTML, /本顿优先的 3–5 项/);
  }
});

test('public direct recommendation keeps six and eleven outside the seven-through-ten local stop', async () => {
  for (const count of [6, 11]) {
    const pantry = Array.from({ length:count }, (_, index) => `食材${index + 1}`).join(', ');
    const { context, calls, root } = loadFrontend([
      { body:plannerBundle([]) },
    ], { plannerRollout:'direct-recommend', generationMode:'deterministic', proxy:null });
    await evaluate(context, `(async () => {
      state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:${JSON.stringify(pantry)}, dislikes:'' };
      await runPrimaryFlow();
    })()`);
    assert.deepEqual(
      calls.map(call => new URL(call.url, 'https://app.test').pathname),
      ['/plan-meal'],
      `${count} inputs must continue to the server planner`,
    );
    assert.equal(evaluate(context, 'state.profile.pantry'), pantry);
    assert.doesNotMatch(root.innerHTML, /本顿优先的 3–5 项/);
  }
});

test('candidate cards explain coverage, unused reasons and basic extras without title leakage', async () => {
  const candidate = plannerCandidate({
    id:'pln_v2_honest',
    templateId:'savory-mixed-rice-pot',
    used:['番茄','鸡蛋','西兰花','土豆'],
    unused:['玉米'],
    extras:[
      { name:'大米', category:'staple', grams:200 },
      { name:'水', category:'liquid', grams:260 },
    ],
    minutes:35,
  });
  const { context, root } = loadFrontend([
    { body:plannerBundle([candidate]) },
  ], { plannerRollout:'direct-recommend', proxy:null });
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'番茄, 鸡蛋, 西兰花, 土豆, 玉米', dislikes:'' };
    await runPrimaryFlow();
  })()`);
  assert.match(root.innerHTML, /用上 4\/5/);
  for (const item of ['番茄','鸡蛋','西兰花','土豆','玉米','大米','水']) {
    assert.match(root.innerHTML, new RegExp(item));
  }
  assert.match(root.innerHTML, /避免为了凑数影响做法/);
  assert.equal(evaluate(context, `state.planCandidates[0].presentation.title.includes('玉米')`), false);
  assert.equal(evaluate(context, `state.planCandidates[0].presentation.title.includes('savory-mixed-rice-pot')`), false);
});

test('chosen plan survives a generation error and offers a manual retry without replanning', async () => {
  const candidate = plannerCandidate({
    id:'pln_v2_retry-choice',
    templateId:'acid-staple-pot',
    used:['番茄','鸡蛋'],
  });
  const { context, calls, root } = loadFrontend([
    { body:plannerBundle([candidate]) },
    { jsonError:new SyntaxError('bad json'), contentType:'text/html', status:200 },
  ], { plannerRollout:'direct-recommend', proxy:null });
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'番茄, 鸡蛋', dislikes:'' };
    await runPrimaryFlow();
    await choosePlan('pln_v2_retry-choice');
  })()`);
  assert.deepEqual(
    calls.map(call => new URL(call.url, 'https://app.test').pathname),
    ['/plan-meal', '/generate-plan'],
  );
  assert.equal(evaluate(context, 'state.view'), 'gen-failed');
  assert.equal(evaluate(context, 'state.displayedPlan.plan.plan_id'), 'pln_v2_retry-choice');
  assert.match(root.innerHTML, /这套组合还在/);
  assert.match(root.innerHTML, /data-act="retry-generate-plan"/);
});

test('empty planner candidate bundle shows an honest edit path without blank cards', async () => {
  const { context, root } = loadFrontend([
    { body:plannerBundle([]) },
  ], { plannerRollout:'direct-recommend', proxy:null });
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'未知食材A, 未知食材B', dislikes:'' };
    await runPrimaryFlow();
  })()`);
  assert.equal(evaluate(context, 'state.view'), 'v2-candidates');
  assert.match(root.innerHTML, /当前还没有足够可靠的一锅组合/);
  assert.match(root.innerHTML, /data-act="edit-safe-profile"/);
  assert.doesNotMatch(root.innerHTML, /data-act="choose-plan"/);
});

test('empty direct-recommend candidates explain unrecognized and recognized-but-unarranged inputs', async () => {
  const blocked = plannerBundle([]);
  blocked.normalized_items = [
    { raw:'神秘叶子', canonical:null, recognized:false, role:'prefer_use' },
    { raw:'番茄', canonical:'番茄', recognized:true, role:'prefer_use' },
  ];
  blocked.plan.unused_prefer_use = [
    {
      raw:'神秘叶子', canonical:null, recognized:false, role:'prefer_use',
      reason_code:'unrecognized_ingredient', reason:'暂时无法识别这种食材。',
    },
    {
      raw:'番茄', canonical:'番茄', recognized:true, role:'prefer_use',
      reason_code:'lower_compatibility', reason:'当前没有足够可靠的组合来使用。',
    },
  ];
  const { context, root } = loadFrontend([
    { body:blocked },
  ], { plannerRollout:'direct-recommend', proxy:null });
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'神秘叶子, 番茄', dislikes:'' };
    await runPrimaryFlow();
  })()`);
  assert.equal(evaluate(context, 'state.view'), 'v2-candidates');
  assert.match(root.innerHTML, /神秘叶子/);
  assert.match(root.innerHTML, /暂时无法识别这种食材/);
  assert.match(root.innerHTML, /番茄/);
  assert.match(root.innerHTML, /当前没有足够可靠的组合来使用/);
  assert.match(root.innerHTML, /data-act="edit-safe-profile"/);
  assert.doesNotMatch(root.innerHTML, /data-act="choose-plan"/);
});

test('empty candidates caused by a dislike explain the protection instead of looking like a generic failure', async () => {
  const blocked = plannerBundle([]);
  blocked.normalized_items = [
    { raw:'番茄', canonical:'番茄', recognized:true, role:'prefer_use' },
    { raw:'鸡蛋', canonical:'鸡蛋', recognized:true, role:'prefer_use' },
  ];
  blocked.plan.unused_prefer_use = [{
    raw:'鸡蛋', canonical:'鸡蛋', recognized:true, role:'prefer_use',
    reason_code:'allergen_conflict', reason:'与你设置的忌口冲突。',
  }];
  const { context, root } = loadFrontend([
    { body:blocked },
  ], { plannerRollout:'direct-recommend', proxy:null });
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'番茄, 鸡蛋', dislikes:'鸡蛋' };
    await runPrimaryFlow();
  })()`);
  assert.equal(evaluate(context, 'state.view'), 'v2-candidates');
  assert.match(root.innerHTML, /已按忌口拦下/);
  assert.match(root.innerHTML, /鸡蛋/);
  assert.doesNotMatch(root.innerHTML, /生成失败/);
});

test('direct-recommend rollout neutralizes a saved pantry promise and never sends must_use', async () => {
  const storage = sharedStorage();
  storage.setItem('yiguochu_v1', JSON.stringify({
    profile:{ mode:'pantry', intent:'normal', servings:'2', pantry:'番茄, 鸡蛋', dislikes:'' },
  }));
  const candidate = plannerCandidate({
    id:'pln_v2_saved-pantry',
    templateId:'acid-staple-pot',
    used:['番茄','鸡蛋'],
  });
  const { context, calls, root } = loadFrontend([
    { body:plannerBundle([candidate]) },
  ], { plannerRollout:'direct-recommend', proxy:null, storage });
  assert.equal(evaluate(context, 'state.profile.mode'), 'recommend');
  assert.match(root.innerHTML, /清库存正在做，先来解决今晚吃什么/);
  assert.doesNotMatch(root.innerHTML, /data-val="pantry"/);

  await evaluate(context, 'runPrimaryFlow()');
  const request = JSON.parse(calls[0].init.body);
  assert.deepEqual(request.constraints.must_use, []);
  assert.deepEqual(request.constraints.prefer_use, ['番茄', '鸡蛋']);
});

test('localhost planner lab primary flow still uses plan then generate', async () => {
  const planned = plannerResult();
  const generated = generatedResult(planned);
  const { context, calls } = loadFrontend([{ body:planned }, { body:generated }], {
    proxy:null,
    location:{
      protocol:'http:', hostname:'localhost', origin:'http://localhost:8081',
      search:'?planner_v2=1',
    },
  });
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'quick', servings:'2', pantry:'番茄, 西兰花', dislikes:'' };
    await runPrimaryFlow();
  })()`);
  assert.deepEqual(
    calls.map(call => new URL(call.url, 'http://localhost:8081').pathname),
    ['/plan-meal', '/generate-plan'],
  );
});

test('public cooking intent is forwarded to the trusted recipe generator', async () => {
  const { context, calls } = loadFrontend([{ body:meal() }]);
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'batch', servings:'2', pantry:'', dislikes:'' };
    await runPrimaryFlow();
  })()`);
  assert.equal(JSON.parse(calls[0].init.body).constraints.purpose, 'batch');
  assert.equal(evaluate(context, 'state.dish.purpose'), 'batch');
});

test('empty direct recommendation uses the explicitly marked legacy recipe fallback', async () => {
  const fallback = plannerResult({
    generation_allowed:false,
    plan_source:'legacy_recipe_selector',
    legacy_fallback:true,
    fallback_reason:'recommend_no_submitted_ingredients',
    plan:{
      plan_id:'pln_v2_legacy-fallback', plan_kind:'legacy_fallback',
      fallback_kind:'legacy_recipe_selector', planned_prefer_use:[], unused_prefer_use:[],
      required_extra_items:[], pots:[], coverage_ratio:0, recognition_ratio:0,
      recognized_coverage_ratio:0,
    },
  });
  const { context, calls } = loadFrontend([{ body:fallback }, { body:meal() }]);
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'', dislikes:'' };
    await runPlannerFlow({ autoGenerate:true });
  })()`);
  assert.deepEqual(calls.map(call => new URL(call.url, 'https://app.test').pathname), ['/plan-meal', '/generate-meal']);
  assert.equal(evaluate(context, 'state.view'), 'result');
  assert.equal(evaluate(context, 'state.dish.baseRecipeId'), 'trusted-stew');
});

test('paid generation shows the step-safety stage instead of leaving the quantity stage stale', async () => {
  const planned = plannerResult();
  const generated = generatedResult(planned);
  const { context, root } = loadFrontend([{ body:generated }]);
  evaluate(context, `setDisplayedPlan(${JSON.stringify(planned)}, buildPlanRequest(), true)`);
  const pending = evaluate(context, 'generateDisplayedPlan()');
  assert.equal(evaluate(context, 'state.view'), 'generating');
  assert.equal(evaluate(context, 'state.genStage'), 2);
  assert.match(root.innerHTML, /gen-stage active[^>]*>[\s\S]*检查步骤安全/);
  await pending;
});

test('concurrent generate clicks share one paid request', async () => {
  const planned = plannerResult();
  const generated = generatedResult(planned);
  const { context, calls } = loadFrontend([{ body:generated }]);
  evaluate(context, `setDisplayedPlan(${JSON.stringify(planned)}, buildPlanRequest(), true)`);
  await evaluate(context, 'Promise.all([generateDisplayedPlan(), generateDisplayedPlan()])');
  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0].url, 'https://app.test').pathname, '/generate-plan');
  assert.equal(evaluate(context, 'state.view'), 'v2-result');
});

test('needs_user_decision retains pots and never calls generation', async () => {
  const planned = plannerResult({
    status:'needs_user_decision', generation_allowed:false, mode:'pantry',
    commitment:'还有食材没有安排，需要你先决定下一步。',
    plan:{
      planned_must_use:[{raw:'番茄',canonical:'番茄'}], planned_prefer_use:[],
      unplanned_must_use:[{raw:'神秘叶子',canonical:null,reason_code:'unrecognized_ingredient',reason:'暂时无法识别'}],
      unused_prefer_use:[], coverage_ratio:0.5,
    },
    actions:[
      { action:'relax_item', label:'放宽一种食材', eligible_items:['神秘叶子'], requires_acknowledgement:true, unplanned_items:['神秘叶子'] },
      { action:'edit_ingredients', label:'调整食材', eligible_items:[], requires_acknowledgement:false, unplanned_items:['神秘叶子'] },
      { action:'accept_partial', label:'接受部分规划', eligible_items:[], requires_acknowledgement:true, unplanned_items:['神秘叶子'] },
    ],
  });
  const { context, calls, root } = loadFrontend([{ body:planned }]);
  await evaluate(context, `runPlannerFlow({ autoGenerate:true })`);
  assert.equal(calls.length, 1);
  assert.equal(evaluate(context, 'state.view'), 'v2-plan');
  assert.match(root.innerHTML, /还有食材没有安排/);
  assert.match(root.innerHTML, /一锅方案/);
  assert.match(root.innerHTML, /最多 30 分钟/);
  assert.match(root.innerHTML, /神秘叶子/);
  assert.doesNotMatch(root.innerHTML, /按这几步做/);
});

test('ingredient ambiguity reads as a quality guard and preserves the raw input', async () => {
  const planned = plannerResult({
    status:'needs_user_decision', generation_allowed:false, mode:'pantry',
    commitment:'还有食材没有安排，需要你先决定下一步。',
    normalized_items:[
      {raw:'大米',canonical:'大米',recognized:true,role:'must_use'},
      {raw:'豇豆',canonical:null,recognized:false,role:'must_use',
       ambiguity_id:'cowpea-state',ambiguity_code:'ambiguous_ingredient_state',
       eligible_items:['鲜豇豆','干豇豆','熟豇豆']},
    ],
    plan:{
      planned_must_use:[{raw:'大米',canonical:'大米'}], planned_prefer_use:[],
      unplanned_must_use:[{raw:'豇豆',canonical:null,ambiguity_id:'cowpea-state',
        reason_code:'ambiguous_ingredient_state',
        reason:'“豇豆”可能指鲜豆荚、干豆粒或熟豆粒，请写得更具体。',
        eligible_items:['鲜豇豆','干豇豆','熟豇豆']}],
      unused_prefer_use:[], coverage_ratio:0.5,
    },
  });
  const { context, calls, root } = loadFrontend([{body:planned}]);
  evaluate(context, `state.profile = { mode:'pantry', intent:'normal', servings:'2', pantry:'大米,豇豆', dislikes:'' }`);
  await evaluate(context, `runPlannerFlow({ autoGenerate:true })`);
  assert.equal(calls.length, 1);
  assert.match(root.innerHTML, /fb-banner-title">需要确认食材状态/);
  assert.match(root.innerHTML, /豇豆.*鲜豆荚.*干豆粒.*熟豆粒/);
  assert.doesNotMatch(root.innerHTML, /生成失败|全部安排完成/);
  assert.equal(evaluate(context, 'state.profile.pantry.includes("豇豆")'), true);
});

test('chickpea ambiguity asks for dry or cooked state without treating planning as a failure', async () => {
  const planned = plannerResult({
    status:'needs_user_decision', generation_allowed:false, mode:'pantry',
    commitment:'还有食材没有安排，需要你先决定下一步。',
    normalized_items:[
      {raw:'小米',canonical:'小米',recognized:true,role:'must_use',state:'raw'},
      {raw:'鹰嘴豆',canonical:null,recognized:false,role:'must_use',state:null,
       ambiguity_id:'chickpea-state',ambiguity_code:'ambiguous_ingredient_state',
       ambiguity_reason:'“鹰嘴豆”可能是干豆或已经煮熟的豆，请改写为“干鹰嘴豆”或“熟鹰嘴豆”。',
       eligible_items:['干鹰嘴豆','熟鹰嘴豆']},
    ],
    plan:{
      planned_must_use:[{raw:'小米',canonical:'小米'}], planned_prefer_use:[],
      unplanned_must_use:[{raw:'鹰嘴豆',canonical:null,ambiguity_id:'chickpea-state',
        reason_code:'ambiguous_ingredient_state',
        reason:'“鹰嘴豆”可能是干豆或已经煮熟的豆，请改写为“干鹰嘴豆”或“熟鹰嘴豆”。',
        eligible_items:['干鹰嘴豆','熟鹰嘴豆']}],
      unused_prefer_use:[], coverage_ratio:0.5,
    },
  });
  const { context, calls, root } = loadFrontend([{body:planned}]);
  evaluate(context, `state.profile = { mode:'pantry', intent:'normal', servings:'2', pantry:'小米,鹰嘴豆', dislikes:'' }`);
  await evaluate(context, `runPlannerFlow({ autoGenerate:true })`);
  assert.equal(calls.length, 1);
  assert.match(root.innerHTML, /fb-banner-title">需要确认食材状态/);
  assert.match(root.innerHTML, /鹰嘴豆.*干豆.*煮熟/);
  assert.doesNotMatch(root.innerHTML, /生成失败|全部安排完成/);
  assert.equal(evaluate(context, 'state.profile.pantry.includes("鹰嘴豆")'), true);
});

test('swap only replans, preview generation reuses its exact request, and history does not pre-record the preview', async () => {
  const first = plannerResult();
  const alternative = plannerResult({
    presentation:customPresentation('番茄、西兰花家常焖饭'),
    plan:{ plan_id:'pln_v2_alternative', pots:[{ ...plannerResult().plan.pots[0], template_id:'savory-mixed-rice-pot' }] },
  });
  const generated = generatedResult(alternative);
  const { context, calls, root } = loadFrontend([{ body:alternative }, { body:generated }]);
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'quick', servings:'2', pantry:'番茄, 西兰花', dislikes:'' };
    const initialRequest = buildPlanRequest();
    setDisplayedPlan(${JSON.stringify(first)}, initialRequest, false);
    await requestAlternativePlan();
  })()`);
  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0].url, 'https://app.test').pathname, '/plan-meal');
  assert.equal(evaluate(context, 'state.view'), 'v2-plan-preview');
  assert.match(root.innerHTML, /生成这套做法/);
  assert.match(root.innerHTML, /自定义方案/);
  assert.match(root.innerHTML, /番茄、西兰花家常焖饭/);
  assert.match(root.innerHTML, /按本次选中的食材与受控家常技法组合/);
  assert.match(root.innerHTML, /一锅方案/);
  assert.doesNotMatch(root.innerHTML, /第一锅/);
  assert.equal(evaluate(context, `state.swapHistory.some(h => h.planId === 'pln_v2_alternative')`), false);
  const exactAlternativeRequest = JSON.parse(calls[0].init.body);
  await evaluate(context, `generateDisplayedPlan()`);
  assert.deepEqual(JSON.parse(calls[1].init.body).plan_request, exactAlternativeRequest);
});

test('an invalid swap presentation keeps the current reliable plan and fails closed', async () => {
  const current = plannerResult({
    presentation:customPresentation('番茄、鸡蛋焖饭'),
  });
  const invalid = plannerResult({
    presentation:{ ...customPresentation('番茄、西兰花焖饭'), title:'番茄、西兰花配方' },
    plan:{ plan_id:'pln_v2_invalid_swap', pots:[{ ...plannerResult().plan.pots[0], template_id:'savory-mixed-rice-pot' }] },
  });
  const { context, root } = loadFrontend([{ body:invalid }], {
    plannerRollout:'direct-recommend', generationMode:'deterministic', proxy:null,
  });
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'番茄, 鸡蛋', dislikes:'' };
    setDisplayedPlan(${JSON.stringify(current)}, buildPlanRequest(), false);
    await requestAlternativePlan();
  })()`);
  assert.equal(evaluate(context, 'state.view'), 'gen-failed');
  assert.equal(evaluate(context, 'state.lastGenError.code'), 'plan_identity_mismatch');
  assert.equal(evaluate(context, 'state.displayedPlan.plan.plan_id'), current.plan.plan_id);
  assert.match(root.innerHTML, /这套组合还在/);
  assert.doesNotMatch(root.innerHTML, /番茄、西兰花配方/);
});

test('no_alternative_plan has its dedicated path and retains the clean current generation snapshot', async () => {
  const current = plannerResult();
  const noAlternative = plannerResult({
    status:'no_alternative_plan', code:'no_alternative_plan', generation_allowed:false,
    message:'当前组合只有一个可靠的一锅方案',
    actions:[
      { action:'relax_item', label:'放宽一种食材', eligible_items:['番茄'], requires_acknowledgement:true, unplanned_items:[] },
      { action:'edit_ingredients', label:'返回修改食材', eligible_items:[], requires_acknowledgement:false, unplanned_items:[] },
    ],
  });
  const { context, root } = loadFrontend([{ body:noAlternative }]);
  evaluate(context, `setDisplayedPlan(${JSON.stringify(current)}, buildPlanRequest(), false)`);
  await evaluate(context, `requestAlternativePlan()`);
  assert.equal(evaluate(context, 'state.view'), 'v2-no-alternative');
  assert.match(root.innerHTML, /当前组合只有一个可靠的一锅方案/);
  assert.match(root.innerHTML, /放宽一种食材/);
  assert.doesNotMatch(root.innerHTML, /分成两锅/);
  assert.match(root.innerHTML, /返回修改食材/);
  assert.equal(evaluate(context, `state.displayedPlan.plan.plan_id`), current.plan.plan_id);
  assert.equal(evaluate(context, `state.planRequestSnapshot.constraints.current_plan_id`), null);
});

test('no-alternative restores the already-generated current result without another request', async () => {
  const current = plannerResult();
  const generated = generatedResult(current);
  const noAlternative = plannerResult({
    status:'no_alternative_plan', code:'no_alternative_plan', generation_allowed:false,
    actions:[
      { action:'relax_item', label:'放宽一种食材', eligible_items:['番茄'], requires_acknowledgement:true, unplanned_items:[] },
      { action:'edit_ingredients', label:'返回修改食材', eligible_items:[], requires_acknowledgement:false, unplanned_items:[] },
    ],
  });
  const { context, calls, root } = loadFrontend([{ body:noAlternative }]);
  evaluate(context, `showGeneratedPlan(${JSON.stringify(generated)}, ${JSON.stringify(current)}, buildPlanRequest())`);
  await evaluate(context, 'requestAlternativePlan()');
  assert.equal(evaluate(context, 'state.view'), 'v2-no-alternative');
  assert.match(root.innerHTML, /data-act="continue-current-plan"/);
  const before = calls.length;
  evaluate(context, 'continueCurrentPlan()');
  assert.equal(calls.length, before);
  assert.equal(evaluate(context, 'state.view'), 'v2-result');
  assert.match(root.innerHTML, /番茄焖饭/);
});

test('delegated continue-current-plan click restores the generated result without navigating or fetching', async () => {
  const current = plannerResult();
  const generated = generatedResult(current);
  const noAlternative = plannerResult({
    status:'no_alternative_plan', code:'no_alternative_plan', generation_allowed:false,
    actions:[{ action:'edit_ingredients', label:'返回修改食材', eligible_items:[], requires_acknowledgement:false, unplanned_items:[] }],
  });
  const { context, calls, root, listenerGroups } = loadFrontend([{ body:noAlternative }]);
  evaluate(context, `showGeneratedPlan(${JSON.stringify(generated)}, ${JSON.stringify(current)}, buildPlanRequest())`);
  await evaluate(context, 'requestAlternativePlan()');
  const before = calls.length;
  const target = { dataset:{ act:'continue-current-plan' } };
  const event = { target:{ closest() { return target; } } };
  for (const handler of listenerGroups.get('click') || []) handler(event);
  assert.equal(calls.length, before);
  assert.equal(evaluate(context, 'state.view'), 'v2-result');
  assert.equal(evaluate(context, 'state.displayedPlan.plan.plan_id'), current.plan.plan_id);
  assert.equal(evaluate(context, 'state.generatedPlan.meals.length'), 1);
  assert.match(root.innerHTML, /番茄焖饭/);
});

test('no-alternative restores an ungenerated current plan with its clean generation snapshot', async () => {
  const current = plannerResult();
  const noAlternative = plannerResult({
    status:'no_alternative_plan', code:'no_alternative_plan', generation_allowed:false,
    actions:[{ action:'edit_ingredients', label:'返回修改食材', eligible_items:[], requires_acknowledgement:false, unplanned_items:[] }],
  });
  const { context, calls, root } = loadFrontend([{ body:noAlternative }]);
  evaluate(context, `setDisplayedPlan(${JSON.stringify(current)}, buildPlanRequest(), true)`);
  const cleanSnapshot = evaluate(context, 'JSON.stringify(state.planRequestSnapshot)');
  await evaluate(context, 'requestAlternativePlan()');
  evaluate(context, 'continueCurrentPlan()');
  assert.equal(calls.length, 1);
  assert.equal(evaluate(context, 'state.view'), 'v2-plan-preview');
  assert.equal(evaluate(context, 'JSON.stringify(state.planRequestSnapshot)'), cleanSnapshot);
  assert.match(root.innerHTML, /生成这套做法/);
});

test('V2 generated multi-meal result is ordered, records started plan history, and never shows fabricated nutrition', () => {
  const planned = plannerResult({ plan:{
    plan_id:'pln_v2_two', plan_kind:'multi_pot',
    pots:[plannerResult().plan.pots[0], { ...plannerResult().plan.pots[0], meal_sequence:2, label:'第二锅', template_id:'broth-noodle-pot' }],
  } });
  const generated = generatedResult(planned);
  generated.meals.push({
    ...generated.meals[0],
    meal_sequence:2,
    dish_name:'菌菇、土豆汤面',
    template_id:'broth-noodle-pot',
    presentation:customPresentation('菌菇、土豆汤面'),
  });
  const { context, root } = loadFrontend();
  evaluate(context, `showGeneratedPlan(${JSON.stringify(generated)}, ${JSON.stringify(planned)}, buildPlanRequest())`);
  assert.match(root.innerHTML, /第一锅/);
  assert.match(root.innerHTML, /第二锅/);
  assert.ok(root.innerHTML.indexOf('第一锅') < root.innerHTML.indexOf('第二锅'));
  assert.equal((root.innerHTML.match(/番茄焖饭/g) || []).length, 1);
  assert.equal((root.innerHTML.match(/菌菇、土豆汤面/g) || []).length, 1);
  assert.equal((root.innerHTML.match(/自定义方案/g) || []).length, 2);
  assert.equal((root.innerHTML.match(/按本次选中的食材与受控家常技法组合。/g) || []).length, 2);
  assert.doesNotMatch(root.innerHTML, /kcal|营养参考|蛋白 \/ 份/);
  assert.match(root.innerHTML, /data-act="edit-safe-profile"/);
  evaluate(context, `recordDisplayedPlanHistory('started')`);
  const history = JSON.parse(evaluate(context, 'JSON.stringify(state.swapHistory)'));
  assert.equal(history.at(-1).planId, 'pln_v2_two');
  assert.equal(history.at(-1).kind, 'started');
});

test('single-pot generated result is labeled as one-pot plan instead of a misleading first pot', () => {
  const planned = plannerResult();
  const generated = generatedResult(planned);
  const { context, root } = loadFrontend();
  evaluate(context, `showGeneratedPlan(${JSON.stringify(generated)}, ${JSON.stringify(planned)}, buildPlanRequest())`);
  assert.match(root.innerHTML, /一锅方案 · 自定义方案/);
  assert.doesNotMatch(root.innerHTML, /第一锅 · 自定义方案/);
});

test('stale_plan has dedicated copy and an explicit replan path', async () => {
  const stale = { status:'stale_plan', code:'stale_plan', generation_allowed:false, message:'计划规则或输入已经变化，请重新规划。', actions:[{ action:'replan', label:'重新规划' }] };
  const { context, root, calls } = loadFrontend([{ body:stale }]);
  await evaluate(context, `runPlannerFlow({ autoGenerate:true })`);
  assert.equal(calls.length, 1);
  assert.equal(evaluate(context, 'state.view'), 'v2-plan');
  assert.match(root.innerHTML, /这份计划已经更新，请重新规划/);
  assert.match(root.innerHTML, /data-act="replan-v2"/);
  assert.doesNotMatch(root.innerHTML, /这次优先用了|这次没有使用|已经安排/);
});

test('a stale generation response returns to the dedicated replan state instead of generic failure', async () => {
  const planned = plannerResult();
  const stale = { status:'stale_plan', code:'stale_plan', generation_allowed:false, message:'计划规则或输入已经变化，请重新规划。', actions:[{ action:'replan', label:'重新规划' }] };
  const { context, root, calls } = loadFrontend([{ status:409, body:stale }]);
  evaluate(context, `setDisplayedPlan(${JSON.stringify(planned)}, buildPlanRequest(), false)`);
  await evaluate(context, `generateDisplayedPlan()`);
  assert.equal(calls.length, 1);
  assert.equal(evaluate(context, 'state.view'), 'v2-plan');
  assert.match(root.innerHTML, /这份计划已经更新，请重新规划/);
  assert.doesNotMatch(root.innerHTML, /这次没生成出来/);
});

test('accept_partial sends the exact plan id and full acknowledgement and keeps unplanned visible', async () => {
  const current = plannerResult({
    status:'needs_user_decision', generation_allowed:false, mode:'pantry',
    plan:{ unplanned_must_use:[
      {raw:'神秘叶子',canonical:null,reason_code:'unrecognized_ingredient'},
      {raw:'牛肉末',canonical:'牛肉',reason_code:'unsupported_shape_or_cut'},
    ] },
  });
  current.actions = [{ action:'accept_partial', label:'接受部分规划', eligible_items:[], requires_acknowledgement:true, unplanned_items:['神秘叶子','牛肉末'] }];
  const accepted = plannerResult({
    status:'partial_accepted', generation_allowed:false, mode:'pantry',
    commitment:'部分处理方案：仍会显示未处理食材。',
    plan:{ plan_id:current.plan.plan_id, unplanned_must_use:current.plan.unplanned_must_use },
  });
  const { context, calls, root } = loadFrontend([{ body:accepted }]);
  evaluate(context, `setDisplayedPlan(${JSON.stringify(current)}, buildPlanRequest(), false)`);
  await evaluate(context, `applyPlanDecision('accept_partial')`);
  const request = JSON.parse(calls[0].init.body);
  assert.deepEqual(request.constraints.decision, {
    action:'accept_partial', plan_id:current.plan.plan_id,
    acknowledged_unplanned:['神秘叶子','牛肉末'],
  });
  assert.match(root.innerHTML, /部分处理方案/);
  assert.match(root.innerHTML, /尚未处理/);
  assert.match(root.innerHTML, /神秘叶子/);
  assert.match(root.innerHTML, /牛肉末/);
  assert.doesNotMatch(root.innerHTML, /全部安排完成/);
});

test('relax_item is restricted to server eligible_items', async () => {
  const current = plannerResult({ status:'needs_user_decision', generation_allowed:false, mode:'pantry' });
  current.actions = [{ action:'relax_item', label:'放宽一种食材', eligible_items:['神秘叶子'], requires_acknowledgement:true, unplanned_items:['神秘叶子'] }];
  current.plan.unplanned_must_use = [{raw:'神秘叶子',canonical:null}];
  const relaxed = plannerResult({ status:'needs_user_decision', generation_allowed:false, mode:'pantry' });
  const { context, calls, root } = loadFrontend([{ body:relaxed }]);
  evaluate(context, `setDisplayedPlan(${JSON.stringify(current)}, buildPlanRequest(), false)`);
  assert.match(root.innerHTML, /data-item="神秘叶子"/);
  await evaluate(context, `applyPlanDecision('relax_item', '番茄')`);
  assert.equal(calls.length, 0);
  await evaluate(context, `applyPlanDecision('relax_item', '神秘叶子')`);
  assert.equal(JSON.parse(calls[0].init.body).constraints.decision.item, '神秘叶子');
});

test('force_multi_pot sends an explicit deterministic planner decision', async () => {
  const current = plannerResult({ status:'no_alternative_plan', generation_allowed:false, mode:'pantry' });
  current.actions = [{ action:'force_multi_pot', label:'分成两锅', eligible_items:[], requires_acknowledgement:false, unplanned_items:[] }];
  const replanned = plannerResult({ status:'needs_user_decision', generation_allowed:false, mode:'pantry' });
  const { context, calls } = loadFrontend([{ body:replanned }]);
  evaluate(context, `setDisplayedPlan(${JSON.stringify(current)}, buildPlanRequest(), false)`);
  await evaluate(context, `applyPlanDecision('force_multi_pot')`);
  const request = JSON.parse(calls[0].init.body);
  assert.equal(request.constraints.current_plan_id, null);
  assert.deepEqual(request.constraints.decision, { action:'force_multi_pot', plan_id:current.plan.plan_id });
});

test('force_multi_pot does not buy duplicate wording when the planner returns the unchanged current plan', async () => {
  const current = plannerResult({ status:'complete', generation_allowed:true, mode:'pantry' });
  const noAlternative = plannerResult({
    status:'no_alternative_plan', code:'no_alternative_plan', generation_allowed:false, mode:'pantry',
    plan:current.plan,
    actions:[{ action:'force_multi_pot', label:'分成两锅', eligible_items:[], requires_acknowledgement:false, unplanned_items:[] }],
  });
  const unchanged = plannerResult({ status:'complete', generation_allowed:true, mode:'pantry', plan:current.plan });
  const { context, calls, root } = loadFrontend([{ body:unchanged }]);
  evaluate(context, `setDisplayedPlan(${JSON.stringify(current)}, buildPlanRequest(), false)`);
  evaluate(context, `state.noAlternativeResult=${JSON.stringify(noAlternative)}; state.view='v2-no-alternative'; render()`);
  await evaluate(context, `applyPlanDecision('force_multi_pot')`);
  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0].url, 'https://app.test').pathname, '/plan-meal');
  assert.equal(evaluate(context, 'state.view'), 'v2-no-alternative');
  assert.match(root.innerHTML, /当前组合只有一个可靠的一锅方案/);
});

test('third pot route states its burden and sends acknowledgement for the exact current plan', async () => {
  const current = plannerResult({ status:'needs_user_decision', generation_allowed:false, mode:'pantry' });
  current.actions = [{
    action:'allow_third_pot', label:'需要第三锅才能全部安排', eligible_items:[],
    requires_acknowledgement:true, unplanned_items:['鸡蛋'], additional_meals:1,
  }];
  const replanned = plannerResult({ status:'needs_user_decision', generation_allowed:false, mode:'pantry' });
  const { context, calls, root } = loadFrontend([{ body:replanned }]);
  evaluate(context, `setDisplayedPlan(${JSON.stringify(current)}, buildPlanRequest(), false)`);
  assert.match(root.innerHTML, /确认增加第三锅并继续/);
  await evaluate(context, `applyPlanDecision('allow_third_pot')`);
  assert.equal(JSON.parse(calls[0].init.body).constraints.current_plan_id, null);
  assert.deepEqual(JSON.parse(calls[0].init.body).constraints.decision, {
    action:'allow_third_pot', plan_id:current.plan.plan_id,
  });
});

test('swap copy no longer promises every pantry item is used', () => {
  assert.doesNotMatch(html, /换菜会一直带着家里的食材|换菜时一直带着/);
  assert.equal((html.match(/会优先使用，搭不上的会说明/g) || []).length, 1);
  assert.match(html, /直接推荐会挑合理组合；帮我清库存会完整安排，安排不了时先请你决定/);
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

test('recipe evidence distinguishes project canonical recipes from external sources', () => {
  const { context } = loadFrontend();
  const canonical = evaluate(context, `recipeBasisBlock(${JSON.stringify({
    baseRecipeId: 'local-recipe',
    pairingBasis: '项目标准配方。',
    sourceRefs: [{
      title: '一锅出原创标准配方',
      url: 'https://yiguochu.pages.dev/recipes.html?id=local-recipe',
      license: '保留所有权利',
      attribution: '一锅出项目',
    }],
  })})`);
  const external = evaluate(context, `recipeBasisBlock(${JSON.stringify({
    baseRecipeId: 'external-recipe',
    pairingBasis: '外部资料依据。',
    sourceRefs: [{
      title: 'External source',
      url: 'https://example.com/recipe',
      license: 'CC BY 4.0',
      attribution: 'Example',
    }],
  })})`);
  assert.match(canonical, />查看一锅出标准配方<\/a>/);
  assert.doesNotMatch(canonical, />查看事实来源<\/a>/);
  assert.match(external, />查看事实来源<\/a>/);
  assert.doesNotMatch(external, />查看一锅出标准配方<\/a>/);
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

test('a first-generation portion rejection is session-only and the next request excludes that recipe', async () => {
  const tooSmall = meal({
    base_recipe_id: 'undersized-first-candidate',
    ingredients: ['测试主料', '测试主食', '测试蔬菜'].map(name => ({
      name, grams: 100, kcal: 200, p: 8, fb: 2, mg: 1, k: 1, ca: 1,
      fe: 1, zn: 1, na: 1, vc: 1, vd: 0, w3: 0,
    })),
  });
  const accepted = meal({ base_recipe_id:'next-complete-candidate' });
  const storage = sharedStorage();
  const { context, calls } = loadFrontend([{ body:tooSmall }, { body:accepted }], { storage });

  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'', dislikes:'' };
    await generateLegacyRecipeFallback();
    await generateLegacyRecipeFallback();
  })()`);

  assert.equal(calls.length, 2, 'the user-triggered retry makes exactly one new paid request');
  const secondBody = JSON.parse(calls[1].init.body);
  assert.deepEqual(secondBody.constraints.recent_base_recipes, ['undersized-first-candidate']);
  assert.equal(evaluate(context, 'state.dish.baseRecipeId'), 'next-complete-candidate');
  assert.deepEqual(JSON.parse(evaluate(context, 'JSON.stringify(state.swapHistory)')), []);
  assert.deepEqual(JSON.parse(storage.getItem('yiguochu_v1') || '{}').swapHistory || [], []);
});

test('a grounded two-serving soup rice near the main-meal reference is not discarded at first generation', async () => {
  const groundedSoupRice = meal({
    dish_name: '白菜鸡蛋汤饭',
    form: '汤饭',
    prep_minutes: 15,
    base_recipe_id: 'cabbage-egg-soup-rice',
    used_pantry: ['白菜'],
    ingredients: [
      { name:'熟米饭', grams:400, kcal:116, p:2.6, fb:0.3, mg:13, k:30, ca:5, fe:0.3, zn:0.5, na:1, vc:0, vd:0, w3:0, auth:'tw' },
      { name:'白菜', grams:240, kcal:14, p:1.2, fb:1.4, mg:18, k:256, ca:122, fe:1.5, zn:0.3, na:51, vc:24.2, vd:0, w3:0, auth:'tw', authCode:'E3200602' },
      { name:'鸡蛋', grams:140, kcal:144, p:13.3, fb:0, mg:10, k:154, ca:56, fe:2, zn:1.1, na:131, vc:0, vd:2, w3:0.1, auth:'tw' },
      { name:'水', grams:720, kcal:0, p:0, fb:0, mg:0, k:0, ca:0, fe:0, zn:0, na:0, vc:0, vd:0, w3:0 },
      { name:'盐', grams:3, kcal:0, p:0, fb:0, mg:0, k:0, ca:0, fe:0, zn:0, na:0, vc:0, vd:0, w3:0 },
    ],
  });
  const { context, calls } = loadFrontend([{ body: groundedSoupRice }]);
  const dish = JSON.parse(await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'quick', servings:'2', pantry:'白菜', dislikes:'' };
    return JSON.stringify(await fetchRealDish({ selectedBaseRecipeId:'cabbage-egg-soup-rice' }));
  })()`));

  assert.equal(calls.length, 1);
  assert.equal(dish.baseRecipeId, 'cabbage-egg-soup-rice');
  assert.ok(dish.kcal >= 650 && dish.kcal < 715, `expected the live boundary case, got ${dish.kcal} kcal`);
});

test('an undersized swap candidate keeps the current dish and reopens swap choices', async () => {
  const tooSmall = meal({
    base_recipe_id: 'undersized-swap-candidate',
    ingredients: ['测试主料', '测试主食', '测试蔬菜'].map(name => ({
      name, grams: 100, kcal: 200, p: 8, fb: 2, mg: 1, k: 1, ca: 1,
      fe: 1, zn: 1, na: 1, vc: 1, vd: 0, w3: 0,
    })),
  });
  const { context, calls, root } = loadFrontend([{ body: tooSmall }]);
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'quick', servings:'2', pantry:'', dislikes:'' };
    const current = mapDish(${JSON.stringify(meal({ base_recipe_id:'current-reliable-dish' }))}, computeTargets(state.profile));
    state.dish = current;
    state.items = current.ingredients.map(item => ({ ...item }));
    state.view = 'result';
    await runGenerate({ swap:'any' });
    await new Promise(resolve => setTimeout(resolve, 450));
  })()`);

  assert.equal(calls.length, 1, 'a rejected swap must not trigger an implicit paid retry');
  assert.equal(evaluate(context, 'state.view'), 'result');
  assert.equal(evaluate(context, 'state.dish.baseRecipeId'), 'current-reliable-dish');
  assert.equal(evaluate(context, 'state.swapOpen'), true);
  assert.deepEqual(
    JSON.parse(evaluate(context, 'JSON.stringify(state.swapHistory.map(entry => entry.base))')),
    ['current-reliable-dish'],
    'the persistent seven-day history keeps only the dish the user actually saw',
  );
  assert.deepEqual(
    JSON.parse(evaluate(context, 'JSON.stringify(state.sessionRejectedBaseRecipes)')),
    ['undersized-swap-candidate'],
    'the drifting portion rejection is excluded only for this browser session',
  );
  assert.match(evaluate(context, 'state.notice'), /份量不足.*保留当前/);
  assert.match(root.innerHTML, /换个口味|换个菜系|随便换一个/);
  assert.doesNotMatch(root.innerHTML, /这锅份量偏少|换一道更完整的/);
});

test('a failed swap keeps the current dish visible and offers another user-triggered swap', async () => {
  const { context, calls, root } = loadFrontend([{
    status:503,
    body:{ code:'upstream_error', error:'generation unavailable' },
  }]);
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'', dislikes:'' };
    const current = mapDish(${JSON.stringify(meal({ base_recipe_id:'current-still-reliable' }))}, computeTargets(state.profile));
    state.dish = current;
    state.items = current.ingredients.map(item => ({ ...item }));
    state.view = 'result';
    await runGenerate({ swap:'any' });
    await new Promise(resolve => setTimeout(resolve, 500));
  })()`);

  assert.equal(calls.length, 1, 'swap failure must not trigger an implicit paid retry');
  assert.equal(evaluate(context, 'state.view'), 'result');
  assert.equal(evaluate(context, 'state.dish.baseRecipeId'), 'current-still-reliable');
  assert.equal(evaluate(context, 'state.swapOpen'), true);
  assert.match(evaluate(context, 'state.notice'), /服务现在有点忙.*稍后再换/);
  assert.match(root.innerHTML, /换个口味|换个菜系|随便换一个/);
  assert.doesNotMatch(root.innerHTML, /这次没生成出来/);
});

test('a malformed generation response logs non-sensitive boundary diagnostics and is not overwritten by old animation timers', async () => {
  const warnings = [];
  const testConsole = Object.assign({}, console, { warn(value) { warnings.push(String(value)); } });
  const { context, calls, root } = loadFrontend([{
    status:502,
    contentType:'text/html; charset=UTF-8',
    url:'https://api.test/generate-meal',
    jsonError:new SyntaxError('Unexpected token <'),
  }], { console:testConsole });

  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'', dislikes:'' };
    const current = mapDish(${JSON.stringify(meal({ base_recipe_id:'existing-before-error' }))}, computeTargets(state.profile));
    state.dish = current;
    state.items = current.ingredients.map(item => ({ ...item }));
    await runGenerate({});
    await new Promise(resolve => setTimeout(resolve, 2700));
  })()`);

  assert.equal(calls.length, 1, 'bad JSON must not trigger an implicit retry');
  assert.equal(evaluate(context, 'state.view'), 'gen-failed');
  assert.equal(evaluate(context, 'state.lastGenError.code'), 'service_unavailable');
  assert.match(root.innerHTML, /服务现在有点忙/);
  assert.match(root.innerHTML, /稍后再试/);
  assert.doesNotMatch(root.innerHTML, /生成失败了，再试一次/);
  assert.doesNotMatch(root.innerHTML, /选基础菜|检查步骤安全/);
  assert.equal(warnings.length, 1);
  const diagnostic = JSON.parse(warnings[0]);
  assert.deepEqual(
    { evt:diagnostic.evt, code:diagnostic.code, endpoint:diagnostic.endpoint, status:diagnostic.status, content_type:diagnostic.content_type },
    { evt:'client_generate_error', code:'bad_json', endpoint:'https://api.test/generate-meal', status:502, content_type:'text/html; charset=UTF-8' },
  );
  assert.match(diagnostic.at, /^\d{4}-\d{2}-\d{2}T/);
});

test('a no-compatible swap ends with one reliable-plan explanation instead of inviting paid retries', async () => {
  const { context, calls, root } = loadFrontend([{
    status:422,
    body:{ code:'no_compatible_pantry_recipe', error:'当前可信菜谱还搭不上这些食材' },
  }]);
  await evaluate(context, `(async () => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'西红柿,虾仁,白菜,玉米', dislikes:'' };
    const current = mapDish(${JSON.stringify(meal({
      base_recipe_id:'only-reliable-plan',
      used_pantry:['西红柿','虾仁','白菜','玉米'],
      unused_pantry:[],
    }))}, computeTargets(state.profile));
    state.dish = current;
    state.items = current.ingredients.map(item => ({ ...item }));
    state.view = 'result';
    await runGenerate({ swap:'any' });
    await new Promise(resolve => setTimeout(resolve, 500));
  })()`);

  assert.equal(calls.length, 1);
  assert.equal(evaluate(context, 'state.view'), 'result');
  assert.equal(evaluate(context, 'state.noAlternativeSwap'), true);
  assert.match(root.innerHTML, /当前组合只有一个可靠的一锅方案/);
  assert.match(root.innerHTML, /修改食材/);
  assert.doesNotMatch(root.innerHTML, /可以再试一次|换个口味|随便换一个/);
});

test('pantry result explanation never calls required extras existing home ingredients', () => {
  const { context } = loadFrontend();
  const rendered = evaluate(context, `whyFits({
    why:'用家里现成的白菜和鸡蛋。',
    usedPantry:['白菜'],
    pantryContext:{ original:['虾仁','白菜','玉米'], remaining:['虾仁','玉米'] }
  })`);
  assert.match(rendered, /本锅用上你选择的：白菜/);
  assert.match(rendered, /虾仁、玉米暂时没有使用/);
  assert.doesNotMatch(rendered, /家里现成的白菜和鸡蛋/);
});

test('typing pantry updates state immediately and keeps chip visuals synchronized before collapse', () => {
  const { context, listeners } = loadFrontend();
  const handler = listeners.get('input');
  assert.equal(typeof handler, 'function');
  handler({ target:{ id:'pf-pantry', value:'鸡胸肉, 西红柿, 豆腐' } });
  assert.equal(evaluate(context, 'state.profile.pantry'), '鸡胸肉, 西红柿, 豆腐');
  assert.deepEqual(
    JSON.parse(evaluate(context, 'JSON.stringify([...pantrySelectionSet(state.profile.pantry)])')),
    ['鸡胸肉','西红柿','豆腐'],
  );
});

test('start cooking enters a visible cooking state and targets a stable steps anchor', async () => {
  const { context, root } = loadFrontend();
  evaluate(context, `(() => {
    state.profile = { mode:'recommend', intent:'normal', servings:'2', pantry:'', dislikes:'' };
    const current = mapDish(${JSON.stringify(meal())}, computeTargets(state.profile));
    showResult(current);
    beginCooking();
  })()`);
  assert.match(evaluate(context, 'state.notice'), /从第 1 步开始/);
  assert.match(root.innerHTML, /id="cooking-steps"/);
  assert.match(root.innerHTML, /从第 1 步开始/);
});

test('large pantry grouping renders an ordered multi-pot sequence instead of parallel choices', async () => {
  const pantryPlan = {
    kind: 'sequence',
    original: ['鸡蛋','西红柿','土豆','鸡胸肉','西兰花','豆腐','胡萝卜'],
    groups: [
      { order:1, recipe_id:'a', recipe_name:'番茄鸡蛋焖饭', cuisine:'中式家常', used_items:['鸡蛋','西红柿','土豆'], unused_items:['鸡胸肉','西兰花','豆腐','胡萝卜'], required_extra_items:['大米'], coverage:3, total:7 },
      { order:2, recipe_id:'b', recipe_name:'西兰花鸡肉饭锅', cuisine:'中式家常', used_items:['鸡胸肉','西兰花','胡萝卜'], unused_items:['豆腐'], required_extra_items:['大米'], coverage:3, total:7 },
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
  assert.match(root.innerHTML, /按顺序分成几锅/);
  assert.match(root.innerHTML, /第一锅/);
  assert.match(root.innerHTML, /第二锅/);
  assert.match(root.innerHTML, /番茄鸡蛋焖饭/);
  assert.match(root.innerHTML, /西兰花鸡肉饭锅/);
  assert.equal((root.innerHTML.match(/data-act="choose-pantry-group"/g) || []).length, 1);
  assert.match(root.innerHTML, /先做第一锅/);
});

test('small pantry plan renders independent alternatives with used unused and required extras', () => {
  const pantryPlan = {
    kind:'alternatives',
    original:['牛里脊','豆腐','西红柿'],
    groups:[
      { recipe_id:'a', recipe_name:'牛肉豆腐饭', used_items:['牛里脊','豆腐'], unused_items:['西红柿'], required_extra_items:['大米'], coverage:2, total:3 },
      { recipe_id:'b', recipe_name:'番茄豆腐饭', used_items:['豆腐','西红柿'], unused_items:['牛里脊'], required_extra_items:['大米'], coverage:2, total:3 },
    ],
    unplanned:[],
  };
  const { context, root } = loadFrontend();
  evaluate(context, `state.pantryPlan=${JSON.stringify(pantryPlan)}; state.view='pantry-plan'; render()`);
  assert.match(root.innerHTML, /选一个本锅方案/);
  assert.equal((root.innerHTML.match(/data-act="choose-pantry-group"/g) || []).length, 2);
  assert.match(root.innerHTML, /优先方案/);
  assert.match(root.innerHTML, /同等覆盖/);
  assert.match(root.innerHTML, /用上：<\/strong>牛里脊、豆腐/);
  assert.match(root.innerHTML, /本锅不用：<\/strong>西红柿/);
  assert.match(root.innerHTML, /还需准备：<\/strong>大米/);
  assert.doesNotMatch(root.innerHTML, /豆腐.*未使用/);
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
    kind:'alternatives',
    original:['鸡蛋','西红柿','土豆','豆腐','白菜','玉米','香菇'],
    groups:[{ recipe_id:'a', recipe_name:'白菜豆腐饭', cuisine:'中式家常', used_items:['豆腐','白菜','玉米','香菇'], unused_items:['鸡蛋','西红柿','土豆'], required_extra_items:['大米'], coverage:4, total:7 }],
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

test('result does not offer an unverified leftovers action', () => {
  const { context } = loadFrontend();
  const rendered = evaluate(context, `pantryCoverageBlock({
    usedPantry:['鸡肉'],
    pantryContext:{ original:['鸡肉','西兰花','土豆'], remaining:['西兰花','土豆'] }
  })`);
  assert.doesNotMatch(rendered, /use-pantry-leftovers|用剩下的.*再来一锅/);
});

test('legacy swap keeps the chosen pantry subset instead of reopening the same three cards', () => {
  const { context } = loadFrontend();
  const options = JSON.parse(evaluate(context, `(() => {
    state.profile.pantry = '鸡肉, 西兰花, 土豆';
    state.dish = { pantryContext:{
      original:['鸡肉','西兰花','土豆'], requested:['鸡肉','西兰花'], remaining:['土豆']
    }};
    return JSON.stringify(legacySwapOptions('cuisine'));
  })()`));
  assert.deepEqual(options, {
    swap:'cuisine', pantryOverride:['鸡肉','西兰花'], pantryOriginal:['鸡肉','西兰花','土豆'],
  });
});

test('legacy swap discards stale subgroup context after the user edits pantry', () => {
  const { context } = loadFrontend();
  const options = JSON.parse(evaluate(context, `(() => {
    state.profile.pantry = '鸡蛋, 番茄';
    state.dish = { pantryContext:{
      original:['鸡肉','西兰花','土豆'], requested:['鸡肉','西兰花'], remaining:['土豆']
    }};
    return JSON.stringify(legacySwapOptions('cuisine'));
  })()`));
  assert.deepEqual(options, { swap:'cuisine' });
});

test('quick pantry alternatives explain and execute the normal-time relaxation', async () => {
  const plan = {
    kind:'alternatives', original:['鸡胸肉','西兰花'],
    groups:[{ recipe_id:'a', recipe_name:'鸡肉饭', used_items:['鸡胸肉'], unused_items:['西兰花'], required_extra_items:['大米'], coverage:1, total:2 }],
    unplanned:['西兰花'],
  };
  const { context, calls, root } = loadFrontend([{ body:meal({ used_pantry:['鸡胸肉'] }) }]);
  await evaluate(context, `(async () => {
    state.profile.intent='quick'; state.profile.pantry='鸡胸肉, 西兰花';
    state.pantryPlan=${JSON.stringify(plan)}; state.view='pantry-plan'; render();
    if (!document.getElementById('root').innerHTML.includes('放宽到正常时长')) throw new Error('missing action');
    await relaxPantryTime();
  })()`);
  assert.equal(evaluate(context, `state.profile.intent`), 'normal');
  assert.equal(calls.length, 1);
  assert.equal(JSON.parse(calls[0].init.body).constraints.purpose, 'normal');
  assert.doesNotMatch(root.innerHTML, /放宽到正常时长/);
});

test('quick pantry alternatives hide time relaxation after every submitted item is covered', () => {
  const plan = {
    kind:'alternatives', original:['鸡胸肉','西红柿'],
    groups:[{ recipe_id:'a', recipe_name:'番茄鸡肉饭', used_items:['鸡胸肉','西红柿'], unused_items:[], required_extra_items:['大米'], coverage:2, total:2 }],
    unplanned:[],
  };
  const { context, root } = loadFrontend();
  evaluate(context, `state.profile.intent='quick'; state.pantryPlan=${JSON.stringify(plan)}; state.view='pantry-plan'; render()`);
  assert.doesNotMatch(root.innerHTML, /放宽到正常时长/);
});

test('generated ingredient rows are read-only and keep the whole-pot serving summary', () => {
  const { context } = loadFrontend();
  const rendered = evaluate(context, `(() => {
    state.dish = { servings:2 };
    state.items = [{name:'豆腐', grams:100, est:false}, {name:'白菜', grams:120, est:false}];
    return ingredients();
  })()`);
  assert.match(rendered, /整锅约 2 份/);
  assert.doesNotMatch(rendered, /data-bump|data-delta|data-del|toggle-edit/);
});

test('frontend counts a canonical food name and its alias only once', () => {
  const { context } = loadFrontend();
  assert.deepEqual(
    JSON.parse(evaluate(context, `JSON.stringify(uniquePantryItems(['番茄','西红柿','鸡蛋']))`)),
    ['番茄','鸡蛋'],
  );
});

test('frontend pantry identity uses the controlled recipe matching semantics', () => {
  const { context } = loadFrontend();
  const identities = JSON.parse(evaluate(context, `JSON.stringify([
    pantryIdentity('牛里脊'), pantryIdentity('牛里脊肉'), pantryIdentity('牛柳'), pantryIdentity('牛肉片'),
    pantryIdentity('鸡胸'), pantryIdentity('鸡胸肉'), pantryIdentity('鸡腿'), pantryIdentity('鸡腿肉'),
    pantryIdentity('猪里脊'), pantryIdentity('猪里脊肉'), pantryIdentity('猪肉片'),
    pantryIdentity('嫩豆腐'), pantryIdentity('南豆腐'), pantryIdentity('老豆腐'), pantryIdentity('北豆腐'), pantryIdentity('豆腐')
  ])`));
  assert.deepEqual(identities, [
    '牛肉','牛肉','牛肉','牛肉',
    '鸡肉','鸡肉','鸡肉','鸡肉',
    '猪肉','猪肉','猪肉',
    '嫩豆腐','嫩豆腐','老豆腐','老豆腐','老豆腐',
  ]);
  assert.deepEqual(
    JSON.parse(evaluate(context, `JSON.stringify(uniquePantryItems(['牛里脊','牛肉片','豆腐','北豆腐']))`)),
    ['牛里脊','豆腐'],
  );
});

test('frontend keeps dry vermicelli in the approved pantry identity and authoritative nutrition chain', () => {
  const { context } = loadFrontend();
  assert.equal(evaluate(context, `pantryIdentity('干粉丝')`), evaluate(context, `pantryIdentity('粉丝')`));
  assert.deepEqual(
    JSON.parse(evaluate(context, `JSON.stringify((() => { const food=lookupFoodNutrition('干粉丝'); return {name:food?.name,kcal:food?.kcal}; })())`)),
    { name:'粉丝（干）', kcal:351 },
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

test('frontend keeps trusted adaptation metadata bounded but does not expose engineering notes to users', () => {
  const { context } = loadFrontend();
  const input = meal({ adaptation_note: '  <img src=x onerror=alert(1)> 单锅改编  ' });
  const mapped = JSON.parse(evaluate(context,
    `JSON.stringify((() => { const d = mapDish(${JSON.stringify(input)}, {servings:1}); return ({
      adaptationNote:d.adaptationNote, html:recipeBasisBlock(d)
    }); })())`));
  assert.equal(mapped.adaptationNote, '<img src=x onerror=alert(1)> 单锅改编');
  assert.doesNotMatch(mapped.html, /单锅改编说明/);
  assert.doesNotMatch(mapped.html, /单锅改编/);
  assert.doesNotMatch(mapped.html, /<img/);
});

test('portion failure copy speaks to cooks without leaking internal validation language', () => {
  const { context } = loadFrontend();
  const copy = JSON.parse(evaluate(context, `JSON.stringify(genFailureCopy({ code:'portion_too_small' }))`));
  assert.match(copy.text, /不够一顿主餐/);
  assert.doesNotMatch(copy.text, /食品安全问题|拦下|阈值|生产版/);
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

test('a trusted pantry match cannot relax quick beyond thirty minutes', () => {
  const { context } = loadFrontend();
  const values = JSON.parse(evaluate(context, `JSON.stringify((() => {
    state.profile = { purpose:'quick', servings:'2', pantry:'豆腐, 白菜, 金针菇', dislikes:'' };
    const base = { name:'白菜豆腐菌菇炊饭', form:'炊饭', steps:['同锅焖熟'], minutes:35,
      ingredients:[{name:'豆腐'},{name:'白菜'},{name:'金针菇'},{name:'大米'}], kcal:1200,
      purpose:'quick', _targets:{kcal:1200}, validationFlags:[],
      baseRecipeId:'taiwan-cabbage-mushroom-rice', usedPantry:['豆腐','白菜','金针菇'] };
    return [scoreDish(base).ok, scoreDish({...base, minutes:30}).ok];
  })())`));
  assert.deepEqual(values, [false, true]);
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

test('updateSwapHistory records swapped kind, dedupes, and keeps history on fresh generation', () => {
  const { context } = loadFrontend();
  const result = JSON.parse(evaluate(context, `(() => {
    state.dish = { name:'菜A', baseRecipeId:'base-a', familyId:'family-a' };
    updateSwapHistory('swapped');
    state.dish = { name:'菜B', baseRecipeId:'base-b', familyId:'family-b' };
    updateSwapHistory('swapped');
    updateSwapHistory('swapped'); // 同一道重复换不重复记
    const afterSwaps = JSON.parse(JSON.stringify(state.swapHistory));
    updateSwapHistory(); // 全新生成不再清空(F-A): 跨会话冷却, 上次吃过的继续避开
    return JSON.stringify({ afterSwaps: afterSwaps, afterFresh: state.swapHistory });
  })()`));
  assert.deepEqual(result.afterSwaps.map(h => ({ name: h.name, base: h.base, fam: h.fam })), [
    { name:'菜A', base:'base-a', fam:'family-a' },
    { name:'菜B', base:'base-b', fam:'family-b' },
  ]);
  assert.ok(result.afterSwaps.every(h => typeof h.ts === 'number'), 'swap history entries carry a timestamp');
  assert.ok(result.afterSwaps.every(h => h.kind === 'swapped'), 'swap history entries carry swapped kind');
  assert.deepEqual(result.afterFresh, result.afterSwaps);
});

test('start-cooking records the dish as eaten so cross-session avoidance covers cooked dishes', () => {
  // codex 指正: 历史不能只记「换掉的」, 「开始做」的菜必须同样进 swapHistory(否则跨会话避开空转)
  assert.match(html, /act === 'start-cooking'\) beginCooking\(\)/);
  assert.match(html, /function beginCooking\(\)[\s\S]*?updateSwapHistory\('started'\)/);
});

test('started and swapped history entries both remain in the seven-day cooldown request', async () => {
  const { context, calls } = loadFrontend([{ body: meal() }]);
  await evaluate(context, `(() => {
    state.swapHistory = [
      { name:'换掉的菜', base:'base-swapped', fam:'family-a', kind:'swapped', ts:Date.now() },
      { name:'做过的菜', base:'base-started', fam:'family-b', kind:'started', ts:Date.now() },
    ];
    return fetchRealDish({});
  })()`);
  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(body.constraints.recent_dishes, ['换掉的菜', '做过的菜']);
  assert.deepEqual(body.constraints.recent_base_recipes, ['base-swapped', 'base-started']);
});

test('swap history persists timestamped entries through STORE', () => {
  const storage = sharedStorage();
  const { context } = loadFrontend([], { storage });
  evaluate(context, `(() => {
    state.dish = { name:'菜A', baseRecipeId:'base-a', familyId:'family-a' };
    updateSwapHistory('swapped');
  })()`);
  const stored = JSON.parse(evaluate(context, `JSON.stringify(STORE.getSwapHistory())`));
  assert.equal(stored.length, 1);
  assert.deepEqual(
    { name: stored[0].name, base: stored[0].base, fam: stored[0].fam },
    { name:'菜A', base:'base-a', fam:'family-a' },
  );
  assert.equal(typeof stored[0].ts, 'number');
  assert.equal(stored[0].kind, 'swapped');
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

test('V2 cooldown sends both history kinds once per plan using the latest seven-day record', () => {
  const storage = sharedStorage();
  const now = Date.now();
  storage.setItem('yiguochu_v1', JSON.stringify({ swapHistory: [
    { planId:'expired', kind:'started', ts:now - 8 * 24 * 3600 * 1000 },
    { planId:'duplicate', kind:'swapped', ts:now - 3000 },
    { planId:'started-plan', kind:'started', ts:now - 2000 },
    { planId:'duplicate', kind:'started', ts:now - 1000 },
    { planId:'swapped-plan', kind:'swapped', ts:now - 500 },
  ] }));
  const { context } = loadFrontend([], { storage });
  const result = JSON.parse(evaluate(context, `JSON.stringify({
    ids: recentPlanIds(),
    history: state.swapHistory,
  })`));
  assert.deepEqual(result.ids, ['started-plan', 'duplicate', 'swapped-plan']);
  assert.equal(result.history.find(entry => entry.planId === 'duplicate').kind, 'started');
  assert.equal(result.history.filter(entry => entry.planId === 'duplicate').length, 1);
  assert.equal(result.history.some(entry => entry.planId === 'expired'), false);

  evaluate(context, `state.swapHistory = Array.from({ length:25 }, (_, index) => ({
    planId:'plan-' + index,
    kind:index % 2 ? 'started' : 'swapped',
    ts:Date.now() - index,
  }))`);
  assert.equal(JSON.parse(evaluate(context, 'JSON.stringify(recentPlanIds())')).length, 20);
});

test('swap history survives a frontend reload through shared localStorage', () => {
  const storage = sharedStorage();
  const first = loadFrontend([], { storage });
  evaluate(first.context, `(() => {
    state.dish = { name:'菜A', baseRecipeId:'base-a', familyId:'family-a' };
    updateSwapHistory('swapped');
    state.dish = { name:'菜B', baseRecipeId:'base-b', familyId:'family-b' };
    updateSwapHistory('swapped');
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

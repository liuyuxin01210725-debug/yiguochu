import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
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

test.after(() => fs.rmSync(OUTPUT, { recursive:true, force:true }));

function candidate(overrides = {}) {
  return {
    plan_id:'sha256:rice-plan-1',
    plan_token:'rm1.test.signature',
    display_name:'鸡腿土豆焖饭',
    name_label:'家庭鸡腿焖饭',
    recipe_id:'chicken-leg-potato-braised-rice',
    variant_id:'home-chicken-leg-potato-rice',
    servings:2,
    used_items:[
      { raw:'鸡腿', canonical_id:'chicken-leg', display_name:'鸡腿肉' },
      { raw:'土豆', canonical_id:'potato', display_name:'土豆' },
    ],
    unused_items:[{
      raw:'胡萝卜', canonical_id:'carrot', reason_code:'not_selected',
      reason:'这套菜饭的受控搭配暂不使用胡萝卜。',
    }],
    coverage_count:2,
    submitted_count:3,
    coverage_ratio:2 / 3,
    nutrition_grade:'B',
    nutrition_roles:[
      { role:'carb', canonical_ingredient_id:'raw-rice' },
      { role:'protein', canonical_ingredient_id:'chicken-leg' },
    ],
    required_basic_items:[
      { canonical_id:'raw-rice', display_name:'大米' },
      { canonical_id:'water', display_name:'水' },
    ],
    execution_actions:{
      pre_actions:[{ order:1, action_code:'prepare_vegetables', ingredient_ids:['potato'] }],
      start_actions:[{ order:1, action_code:'start_closed_lid_program', ingredient_ids:['raw-rice','chicken-leg','potato'] }],
      finish_actions:[{ order:1, action_code:'fluff_and_serve', ingredient_ids:['raw-rice','chicken-leg','potato'] }],
    },
    safety_endpoints:[
      { canonical_ingredient_id:'chicken-leg', endpoint_code:'poultry_fully_cooked' },
    ],
    active_time_minutes:12,
    total_time_minutes:45,
    ...overrides,
  };
}

function readySelection(candidates = [candidate()]) {
  return {
    schema_version:3,
    product_focus:'rice_meal',
    catalog_version:'rice-meal-catalog-v1-test',
    status:'ready',
    candidates,
    normalized_request:{
      servings:2,
      submitted_items:[{ raw:'鸡腿' }, { raw:'土豆' }, { raw:'胡萝卜' }],
      unrecognized_items:[],
      dislikes:[],
    },
  };
}

function compiledResult(overrides = {}) {
  return {
    schema_version:3,
    product_focus:'rice_meal',
    status:'ready',
    generation_allowed:true,
    plan_id:'sha256:rice-plan-1',
    family_id:'home-braised-rice',
    variant_id:'home-chicken-leg-potato-rice',
    recipe_id:'chicken-leg-potato-braised-rice',
    plan:{
      plan_id:'sha256:rice-plan-1',
      servings:2,
      ingredient_amounts:[
        { canonical_id:'raw-rice', name:'大米', grams:200 },
        { canonical_id:'chicken-leg', name:'鸡腿', grams:120, auth:'tw', authCode:'E1000101' },
        { canonical_id:'potato', name:'土豆', grams:100, auth:'tw', authCode:'B0700201' },
        { canonical_id:'water', name:'水', grams:280 },
      ],
      required_extra_items:[{ canonical_id:'water', name:'水', grams:280 }],
      safety_endpoints:[{ canonical_ingredient_id:'chicken-leg', endpoint_code:'poultry_fully_cooked' }],
      nutrition_inputs:[
        { canonical_id:'raw-rice', name:'大米', grams:200, auth:'tw', authCode:'A0100101' },
        { canonical_id:'chicken-leg', name:'鸡腿', grams:120, auth:'tw', authCode:'E1000101' },
        { canonical_id:'potato', name:'土豆', grams:100, auth:'tw', authCode:'B0700201' },
        { canonical_id:'water', name:'水', grams:280 },
      ],
    },
    meals:[{
      meal_sequence:1,
      servings:2,
      recipe_id:'chicken-leg-potato-braised-rice',
      variant_id:'home-chicken-leg-potato-rice',
      dish_name:'鸡腿土豆焖饭',
      time_range:{ active_minutes:12, total_minutes:45 },
      locked_ingredients:[
        { ingredient_ref:'i1', canonical_id:'raw-rice', raw_name:'大米', planned_grams:200 },
        { ingredient_ref:'i2', canonical_id:'chicken-leg', raw_name:'鸡腿', planned_grams:120, auth:'tw', authCode:'E1000101' },
        { ingredient_ref:'i3', canonical_id:'potato', raw_name:'土豆', planned_grams:100, auth:'tw', authCode:'B0700201' },
        { ingredient_ref:'e1', canonical_id:'water', raw_name:'水', planned_grams:280 },
      ],
      safety_endpoints:['rice_tender','poultry_fully_cooked','tender'],
      steps:[
        { action_code:'rinse_raw_rice', text:'淘洗大米后沥干。' },
        { action_code:'start_closed_lid_program', text:'全部入锅，启动标准煮饭程序。' },
        { action_code:'verify_safety_endpoints', text:'开盖确认鸡腿完全熟透，内部无粉红。' },
      ],
      recommendation_reason:'鸡腿和土豆同锅焖熟，大米吸收肉香。',
    }],
    ...overrides,
  };
}

const TEST_NOTICE = 'Preview 家庭测试标准 · 待真实厨房反馈';
const FOUR_SERVING_CAPACITY_NOTICE = '请先确认普通电饭煲容量，食材和水不得超过最高刻度/说明书上限';

function loadRiceFrontend(responses = [], locationOverrides = {}) {
  const html = fs.readFileSync(path.join(OUTPUT, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map(match => match[1])
    .filter(script => !script.includes('serviceWorker'));
  const root = {
    innerHTML:'',
    addEventListener() {},
  };
  const location = {
    protocol:'https:', hostname:'recipe-validation.yiguochu.pages.dev',
    origin:'https://recipe-validation.yiguochu.pages.dev', search:'',
    ...locationOverrides,
  };
  const calls = [];
  let responseIndex = 0;
  const context = vm.createContext({
    console, URL, Date, Math, JSON, Set, Map, Promise, Error, RegExp, String, Number, Boolean, Array, Object,
    AbortController, structuredClone, setTimeout, clearTimeout, location,
    window:{ location, scrollTo() {} },
    localStorage:{ getItem() { return null; }, setItem() {} },
    alert() {},
    document:{
      getElementById(id) { return id === 'root' ? root : null; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
    },
    fetch:async (url, init) => {
      calls.push({ url:String(url), init });
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

test('rice build first screen is only servings, side ingredients and dislikes with rice provided', () => {
  const { context, root } = loadRiceFrontend();

  assert.equal(evaluate(context, 'RICE_MEAL_PRODUCT'), true);
  assert.deepEqual(JSON.parse(evaluate(context, 'JSON.stringify(DEFAULT_PROFILE)')), {
    servings:'2', pantry:'', dislikes:'',
  });
  assert.equal(evaluate(context, 'window.__YIGUOCHU_BUILD_META__.productFocus'), 'rice-meal-v1');
  assert.match(root.innerHTML, /家里默认有米，选你想用的配菜/);
  assert.match(root.innerHTML, /推荐菜饭/);
  assert.match(root.innerHTML, /这一锅做几份|做几份/);
  assert.match(root.innerHTML, />3 份</);
  assert.match(root.innerHTML, />4 份</);
  for (const food of ['豆腐', '牛肉', '西兰花', '猪肉末', '青菜', '玉米', '胡萝卜', '香菇']) {
    assert.match(root.innerHTML, new RegExp(`data-pantry-chip="${food}"`, 'u'), `${food} must be a first-screen quick chip`);
  }
  assert.doesNotMatch(root.innerHTML, /3–4 份/);
  assert.doesNotMatch(root.innerHTML, /这次怎么做|快点吃上|帮我清库存|面条|剩米饭|粥|汤饭|分成两锅|再来一锅/);
});

test('rice planner request uses the only schema-v3 HTTP shape and candidate cards stay truthful', async () => {
  const { context, root, calls } = loadRiceFrontend([{ body:readySelection() }]);
  evaluate(context, `state.profile={servings:'2', pantry:'鸡腿, 土豆, 胡萝卜', dislikes:''}`);

  await evaluate(context, 'runRiceMealPlanning()');

  assert.equal(evaluate(context, 'state.view'), 'rice-meal-candidates');
  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0].url, 'https://recipe-validation.yiguochu.pages.dev').pathname, '/plan-meal');
  assert.deepEqual(JSON.parse(calls[0].init.body), {
    schema_version:3,
    product_focus:'rice_meal',
    servings:2,
    pantry:['鸡腿','土豆','胡萝卜'],
    dislikes:[],
  });
  assert.match(root.innerHTML, /鸡腿土豆焖饭/);
  assert.match(root.innerHTML, /用上 2\/3/);
  assert.match(root.innerHTML, /胡萝卜[（(]这套菜饭的受控搭配暂不使用胡萝卜/);
  assert.match(root.innerHTML, /营养 B|营养搭配 B/);
  assert.match(root.innerHTML, /碳水|主食/);
  assert.match(root.innerHTML, /蛋白质/);
  assert.match(root.innerHTML, /处理食材|12 分钟/);
  assert.match(root.innerHTML, /全程 45 分钟/);
});

test('candidate and result DOM show controlled household test notices without leaking review notes', async () => {
  const testCandidate = candidate({
    variant_id:'home-cabbage-tofu-rice',
    recipe_id:'cabbage-tofu-braised-rice',
    display_name:'白菜豆腐焖饭',
    servings:4,
    user_notices:[
      { code:'household_test_pending_feedback', text:TEST_NOTICE },
      { code:'four_serving_cooker_capacity_check', text:FOUR_SERVING_CAPACITY_NOTICE },
    ],
  });
  const testResult = compiledResult({
    variant_id:testCandidate.variant_id,
    recipe_id:testCandidate.recipe_id,
    user_notices:structuredClone(testCandidate.user_notices),
    meals:[{
      ...compiledResult().meals[0],
      variant_id:testCandidate.variant_id,
      recipe_id:testCandidate.recipe_id,
      dish_name:testCandidate.display_name,
      user_notices:structuredClone(testCandidate.user_notices),
    }],
  });
  const { context, root } = loadRiceFrontend([
    { body:readySelection([testCandidate]) },
    { body:testResult },
  ]);
  evaluate(context, `state.profile={servings:'4', pantry:'豆腐, 白菜', dislikes:''}`);
  await evaluate(context, 'runRiceMealPlanning()');
  assert.match(root.innerHTML, new RegExp(TEST_NOTICE, 'u'));
  assert.match(root.innerHTML, new RegExp(FOUR_SERVING_CAPACITY_NOTICE, 'u'));
  assert.doesNotMatch(root.innerHTML, /recipe-library\.json|不宣称地域原方|人工批准/u);

  await evaluate(context, `chooseRiceMealPlan('sha256:rice-plan-1')`);
  assert.match(root.innerHTML, new RegExp(TEST_NOTICE, 'u'));
  assert.match(root.innerHTML, new RegExp(FOUR_SERVING_CAPACITY_NOTICE, 'u'));
});

test('mature candidate and result DOM do not show household test notices', async () => {
  const mature = candidate({ user_notices:[] });
  const result = compiledResult({
    user_notices:[],
    meals:[{ ...compiledResult().meals[0], user_notices:[] }],
  });
  const { context, root } = loadRiceFrontend([{ body:readySelection([mature]) }, { body:result }]);
  evaluate(context, `state.profile={servings:'2', pantry:'鸡腿, 土豆', dislikes:''}`);
  await evaluate(context, 'runRiceMealPlanning()');
  assert.doesNotMatch(root.innerHTML, /Preview 家庭测试标准|最高刻度/u);
  await evaluate(context, `chooseRiceMealPlan('sha256:rice-plan-1')`);
  assert.doesNotMatch(root.innerHTML, /Preview 家庭测试标准|最高刻度/u);
});

test('three-person selection reaches the planner request without falling back to two servings', async () => {
  const { context, calls } = loadRiceFrontend([{ body:readySelection() }]);
  evaluate(context, `state.profile={servings:'3', pantry:'鸡腿, 土豆', dislikes:''}`);
  await evaluate(context, 'runRiceMealPlanning()');
  assert.equal(JSON.parse(calls[0].init.body).servings, 3);
});

test('choosing a signed rice candidate is the only action that compiles its result', async () => {
  const { context, root, calls } = loadRiceFrontend([
    { body:readySelection() },
    { body:compiledResult() },
  ]);
  evaluate(context, `state.profile={servings:'2', pantry:'鸡腿, 土豆, 胡萝卜', dislikes:''}`);
  await evaluate(context, 'runRiceMealPlanning()');
  assert.equal(calls.length, 1, 'showing candidates must not compile or call a model');

  await evaluate(context, `chooseRiceMealPlan('sha256:rice-plan-1')`);

  assert.equal(calls.length, 2);
  assert.equal(new URL(calls[1].url, 'https://recipe-validation.yiguochu.pages.dev').pathname, '/generate-plan');
  assert.deepEqual(JSON.parse(calls[1].init.body), { plan_token:'rm1.test.signature' });
  assert.equal(evaluate(context, 'state.view'), 'rice-meal-result');
  assert.match(root.innerHTML, /鸡腿土豆焖饭/);
  assert.match(root.innerHTML, /大米[\s\S]*?200 g/);
  assert.match(root.innerHTML, /鸡腿[\s\S]*?120 g/);
  assert.match(root.innerHTML, /鸡腿完全熟透/);
  assert.match(root.innerHTML, /开始做/);
  assert.match(root.innerHTML, /换一换/);
  assert.match(root.innerHTML, /台湾卫生福利部食品药物管理署/);
});

test('rice result uses the local authority fallback before showing an estimate badge', async () => {
  const localFallback = compiledResult();
  localFallback.plan.nutrition_inputs = localFallback.plan.nutrition_inputs.map(item => ({
    ...item,
    auth: undefined,
    authCode: undefined,
  }));
  const { context, root } = loadRiceFrontend([
    { body:readySelection() },
    { body:localFallback },
  ]);
  evaluate(context, `state.profile={servings:'2', pantry:'鸡腿, 土豆', dislikes:''}`);
  await evaluate(context, 'runRiceMealPlanning()');
  await evaluate(context, `chooseRiceMealPlan('sha256:rice-plan-1')`);

  assert.doesNotMatch(root.innerHTML, /大米<span class="est-tag"/u);
  assert.doesNotMatch(root.innerHTML, /土豆<span class="est-tag"/u);
  assert.doesNotMatch(root.innerHTML, /水<span class="est-tag"/u);
});

test('rice result labels total free liquid as approximate instead of exact added water', async () => {
  const result = compiledResult();
  result.plan.liquid_constraints = {
    kind: 'total_free_liquid',
    measured_contributor_ids: ['water'],
    target_total_free_liquid_grams: 280,
    added_water_grams: 280,
    display_precision: 'approximate',
    display_grams: 280,
  };
  result.meals[0].liquid_constraints = structuredClone(result.plan.liquid_constraints);
  const { context, root } = loadRiceFrontend([{ body:readySelection() }, { body:result }]);
  evaluate(context, `state.profile={servings:'2', pantry:'鸡腿, 土豆', dislikes:''}`);
  await evaluate(context, 'runRiceMealPlanning()');
  await evaluate(context, `chooseRiceMealPlan('sha256:rice-plan-1')`);
  assert.match(root.innerHTML, /清水（本锅约总液体）/u);
  assert.match(root.innerHTML, /约 280 g/u);
});

test('rice statuses use dedicated pages and always provide a return-to-edit path', () => {
  const cases = [
    ['needs_balance_input', 'needs-balance', /再加一样蛋白质或蔬菜/],
    ['no_reliable_rice_meal', 'no-reliable', /暂时没有可靠的菜饭方案/],
    ['unsafe_recipe', 'unsafe', /为了避开不适合的食材/],
    ['stale_plan', 'stale', /这份菜饭计划已经变化/],
  ];
  for (const [status, view, message] of cases) {
    const { context, root } = loadRiceFrontend();
    evaluate(context, `showRiceMealStatus(${JSON.stringify({ schema_version:3, status, unused_items:[] })})`);
    assert.equal(evaluate(context, 'state.view'), view);
    assert.match(root.innerHTML, message);
    assert.match(root.innerHTML, /data-act="edit-safe-profile"/);
  }
});

test('rice swap replans, no alternative keeps the current result, and compile failure keeps the selected plan', async () => {
  const noAlternative = {
    schema_version:3, product_focus:'rice_meal', status:'no_alternative_rice_meal',
    candidates:[], current_candidate:candidate(),
  };
  const { context, root, calls } = loadRiceFrontend([
    { body:readySelection() },
    { body:compiledResult() },
    { body:noAlternative },
  ]);
  evaluate(context, `state.profile={servings:'2', pantry:'鸡腿, 土豆, 胡萝卜', dislikes:''}`);
  await evaluate(context, 'runRiceMealPlanning()');
  await evaluate(context, `chooseRiceMealPlan('sha256:rice-plan-1')`);
  await evaluate(context, 'requestRiceMealSwap()');

  assert.equal(evaluate(context, 'state.view'), 'no-alternative');
  assert.match(root.innerHTML, /当前这道菜饭仍然保留/);
  assert.match(root.innerHTML, /鸡腿土豆焖饭/);
  const swapBody = JSON.parse(calls[2].init.body);
  assert.equal(swapBody.swap.current_plan_id, 'sha256:rice-plan-1');

  const failure = loadRiceFrontend([
    { body:readySelection() },
    { status:503, body:{ code:'rice_meal_assets_unavailable', error:'暂时不可用' } },
  ]);
  evaluate(failure.context, `state.profile={servings:'2', pantry:'鸡腿, 土豆', dislikes:''}`);
  await evaluate(failure.context, 'runRiceMealPlanning()');
  await evaluate(failure.context, `chooseRiceMealPlan('sha256:rice-plan-1')`);
  assert.equal(evaluate(failure.context, 'state.view'), 'gen-failed');
  assert.equal(evaluate(failure.context, 'state.riceSelectedCandidate.plan_id'), 'sha256:rice-plan-1');
  assert.match(failure.root.innerHTML, /已选的菜饭还在/);
});

test('rice file mode stays offline and localhost only calls localhost:8765', async () => {
  const file = loadRiceFrontend([], { protocol:'file:', hostname:'', origin:'null' });
  evaluate(file.context, `state.profile={servings:'2', pantry:'鸡腿, 土豆', dislikes:''}`);
  await evaluate(file.context, 'runRiceMealPlanning()');
  assert.equal(file.calls.length, 0);
  assert.match(file.root.innerHTML, /请双击 start\.command 启动本地版本。/);

  const local = loadRiceFrontend([{ body:readySelection() }], {
    protocol:'http:', hostname:'localhost', origin:'http://localhost:8081',
  });
  evaluate(local.context, `state.profile={servings:'2', pantry:'鸡腿, 土豆', dislikes:''}`);
  await evaluate(local.context, 'runRiceMealPlanning()');
  assert.equal(local.calls.length, 1);
  assert.equal(local.calls[0].url, 'http://localhost:8765/plan-meal');
});

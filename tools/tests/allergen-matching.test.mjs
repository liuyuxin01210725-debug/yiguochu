import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// 与 frontend-recipe-contract.test.mjs 同一方式: 从 index.html 文本提取内联脚本, 在 vm 里求值真实前端函数
const html = fs.readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const appScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(match => match[1])
  .filter(script => !script.includes('serviceWorker'));
assert.ok(appScripts.length >= 2, 'index.html must contain the main and safety scripts');

function loadFrontend() {
  const root = { innerHTML: '', addEventListener() {} };
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
    fetch: async () => { throw new Error('unexpected fetch'); },
  });
  for (const [index, script] of appScripts.entries()) {
    vm.runInContext(script, context, { filename: `index-inline-${index + 1}.js` });
  }
  return { context, root };
}

function evaluate(context, source) {
  return vm.runInContext(source, context);
}

function matchAll(context, pairs) {
  return JSON.parse(evaluate(context,
    `JSON.stringify(${JSON.stringify(pairs)}.map(([d, i]) => matchAllergy(d, i)))`));
}

test('ALLERGEN_GROUPS is the parity-locked table verbatim', () => {
  const { context } = loadFrontend();
  const groups = JSON.parse(evaluate(context, `JSON.stringify(ALLERGEN_GROUPS)`));
  assert.deepEqual(groups, {
    '海鲜': ['鱼','鲈鱼','鳕鱼','三文鱼','金枪鱼','带鱼','黄花鱼','鲫鱼','鲤鱼','草鱼','鱼头','鱼片','虾','虾仁','虾皮','虾米','海米','蟹','螃蟹','蛤蜊','扇贝','干贝','瑶柱','牡蛎','生蚝','鲍鱼','蛏子','鱿鱼','章鱼','墨鱼','海参','海螺','贝类'],
    '蛋': ['鸡蛋','鸭蛋','鹌鹑蛋','皮蛋','咸蛋','咸鸭蛋','蛋白','蛋黄','蛋液'],
    '奶': ['牛奶','羊奶','奶粉','奶酪','芝士','黄油','奶油','淡奶油','酸奶','炼乳'],
    '花生': ['花生','花生米','花生酱'],
    '坚果': ['核桃','杏仁','腰果','开心果','榛子','松子','碧根果','夏威夷果','巴旦木','板栗','芝麻','芝麻酱'],
    '大豆': ['大豆','黄豆','豆腐','嫩豆腐','老豆腐','油炸豆腐','炸豆腐','豆浆','豆皮','腐竹','酱油','豆豉','味噌'],
    '鸡肉': ['鸡肉','鸡腿','鸡腿肉','鸡胸','鸡胸肉','鸡翅','鸡爪','鸡柳','土鸡','乌鸡','三黄鸡','鸡胗','鸡肝','鸡汤'],
    '牛肉': ['牛肉','牛里脊','牛腩','牛腱','肥牛','牛肉片','牛肉末','牛排','牛仔骨'],
    '猪肉': ['猪肉','猪里脊','五花肉','猪排','排骨','猪蹄','猪肝','猪腰','腊肉','腊肠','培根','火腿'],
    '羊肉': ['羊腿肉','去骨羊腿肉'],
  });
});

test('dislike 大豆 blocks controlled soy foods without misclassifying green peas', () => {
  const { context } = loadFrontend();
  const values = matchAll(context, [
    ['大豆', '油炸豆腐'], ['大豆', '嫩豆腐'], ['大豆', '豆浆'], ['大豆', '酱油'],
    ['大豆', '青豆'], ['大豆', '青豌豆'], ['大豆', '鸡蛋'],
  ]);
  assert.deepEqual(values, [true, true, true, true, false, false, false]);
});

test('dislike 牛肉 blocks beef cuts but not pork or chicken', () => {
  const { context } = loadFrontend();
  const values = matchAll(context, [
    ['牛肉', '牛里脊'], ['牛肉', '牛腩'], ['牛肉', '肥牛'],
    ['牛肉', '猪里脊'], ['牛肉', '鸡腿肉'], ['牛肉', '鸡蛋'],
  ]);
  assert.deepEqual(values, [true, true, true, false, false, false]);
});

test('dislike 羊肉 blocks only the controlled lamb-leg family', () => {
  const { context } = loadFrontend();
  const values = matchAll(context, [
    ['羊肉', '羊腿肉'], ['羊肉', '去骨羊腿肉'],
    ['羊腿肉', '去骨羊腿肉'], ['羊腿肉', '牛肉'], ['羊肉', '鸡腿肉'],
  ]);
  assert.deepEqual(values, [true, true, true, false, false]);
});

test('alias resolution never narrows allergy protection (豆腐干/干香菇 still hit)', () => {
  const { context } = loadFrontend();
  const values = matchAll(context, [
    ['豆腐', '豆腐干'], ['豆腐', '冻豆腐'], ['豆腐', '油豆腐'],
    ['香菇', '干香菇'], ['香菇', '香菇酱'],
    ['豆腐', '鸡蛋'], ['豆腐', '牛肉'],
  ]);
  assert.deepEqual(values, [true, true, true, true, true, false, false]);
});

test('dislike 海鲜 blocks seafood members but not chicken or egg', () => {
  const { context } = loadFrontend();
  const values = matchAll(context, [
    ['海鲜', '虾仁'], ['海鲜', '虾米'], ['海鲜', '带鱼'], ['海鲜', '蛤蜊'], ['海鲜', '鱿鱼'],
    ['海鲜', '鸡肉'], ['海鲜', '鸡蛋'],
  ]);
  assert.deepEqual(values, [true, true, true, true, true, false, false]);
});

test('dislike 鸡肉 blocks chicken cuts but not egg or beef', () => {
  const { context } = loadFrontend();
  const values = matchAll(context, [
    ['鸡肉', '鸡腿肉'], ['鸡肉', '鸡胸肉'], ['鸡肉', '鸡翅'],
    ['鸡肉', '鸡蛋'], ['鸡肉', '牛肉'],
  ]);
  assert.deepEqual(values, [true, true, true, false, false]);
});

test('dislike 蛋/奶/花生/坚果 expand to their group members', () => {
  const { context } = loadFrontend();
  const values = matchAll(context, [
    ['蛋', '鸡蛋'], ['蛋', '鸭蛋'], ['蛋', '皮蛋'],
    ['奶', '牛奶'], ['奶', '奶酪'], ['奶', '黄油'],
    ['花生', '花生酱'],
    ['坚果', '腰果'], ['坚果', '芝麻'],
  ]);
  assert.deepEqual(values, [true, true, true, true, true, true, true, true, true]);
});

test('dairy category does not block coconut milk', () => {
  const { context } = loadFrontend();
  const values = matchAll(context, [
    ['奶', '椰奶'], ['奶', '椰浆'], ['奶', '牛奶'], ['奶', '奶油'],
  ]);
  assert.deepEqual(values, [false, false, true, true]);
});

test('a group member dislike does not expand to the rest of the group', () => {
  const { context } = loadFrontend();
  const values = matchAll(context, [
    ['虾仁', '虾仁(鲜)'], ['虾仁', '基围虾仁'], ['虾仁', '虾'],
    ['虾仁', '带鱼'], ['虾仁', '蛤蜊'],
  ]);
  assert.deepEqual(values, [true, true, true, false, false]);
});

test('plain bidirectional substring behavior does not regress', () => {
  const { context } = loadFrontend();
  const values = matchAll(context, [
    ['牛肉', '牛肉片'],   // i.includes(d)
    ['牛肉片', '牛肉'],   // d.includes(i)
    ['鸡蛋', '鸡蛋羹'],
    ['牛肉', '猪肉'],
  ]);
  assert.deepEqual(values, [true, true, true, false]);
});

test('empty terms never match', () => {
  const { context } = loadFrontend();
  const values = matchAll(context, [['', '虾仁'], ['海鲜', ''], ['', '']]);
  assert.deepEqual(values, [false, false, false]);
});

function scoreOkWith(context, dislikes, ingredientNames) {
  return JSON.parse(evaluate(context, `JSON.stringify((() => {
    state.profile = { purpose:'quick', servings:'1', pantry:'', dislikes:${JSON.stringify(dislikes)} };
    return scoreDish({ name:'炖菜', form:'炖锅', steps:['同锅煮熟'], minutes:20,
      ingredients:${JSON.stringify(ingredientNames)}.map(name => ({ name })), kcal:650,
      purpose:'quick', _targets:{kcal:650}, validationFlags:[] }).ok;
  })())`));
}

test('scoreDish rejects dishes whose ingredients hit the allergy groups', () => {
  const { context } = loadFrontend();
  assert.equal(scoreOkWith(context, '海鲜过敏', ['红扁豆', '虾仁']), false);
  assert.equal(scoreOkWith(context, '海鲜', ['红扁豆', '西兰花']), true);
  assert.equal(scoreOkWith(context, '鸡肉', ['鸡腿肉', '西兰花']), false); // 原漏检: 鸡腿肉不含子串"鸡肉"
  assert.equal(scoreOkWith(context, '鸡肉', ['鸡蛋', '西兰花']), true);
});

test('scoreDish keeps the single-term substring behavior', () => {
  const { context } = loadFrontend();
  assert.equal(scoreOkWith(context, '牛肉', ['牛肉片', '西兰花']), false);
  assert.equal(scoreOkWith(context, '牛肉', ['鸡胸肉', '西兰花']), true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateRecipeLibrary } from '../lib/recipe-library-validator.mjs';
import { PROMOTION_MATRIX } from '../lib/traditional-recipe-promotion-gate.mjs';
import { COVERAGE_PROMOTION_MATRIX } from '../lib/coverage-recipe-promotion-gate.mjs';

const lib = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));
const originalApprovedRecipes = JSON.parse(
  fs.readFileSync(new URL('./fixtures/original-approved-recipes.json', import.meta.url), 'utf8'),
);

const EXPECTED_FAMILY_IDS = [
  'family-rice-porridge',
  'family-spiced-rice',
  'family-tomato-rice',
  'family-rice-legume-pot',
  'family-legume-vegetable-stew',
  'family-tomato-egg-pot',
  'family-coconut-curry',
  'family-risotto',
  'family-minestrone',
];

const EXPECTED_RECIPES = [
  ['chinese-congee', 'family-rice-porridge', '中式基础粥', 'Cookbook:Chinese Rice Porridge (Congee)', 'https://en.wikibooks.org/wiki/Cookbook:Chinese_Rice_Porridge_(Congee)'],
  ['simple-chicken-biryani', 'family-spiced-rice', '简化一锅鸡肉香料饭', 'Cookbook:Simple Biryani', 'https://en.wikibooks.org/wiki/Cookbook:Simple_Biryani'],
  ['jollof-rice', 'family-tomato-rice', '西非番茄香料饭', 'Cookbook:Jollof Rice', 'https://en.wikibooks.org/wiki/Cookbook:Jollof_Rice'],
  ['creole-jambalaya', 'family-tomato-rice', '克里奥尔番茄鸡肉什锦饭', 'Cookbook:Jambalaya I', 'https://en.wikibooks.org/wiki/Cookbook:Jambalaya_I'],
  ['soy-lentil-vegetable-stew', 'family-legume-vegetable-stew', '大豆扁豆西兰花炖锅', 'Cookbook:Soy-Lentil-Vegetable Stew', 'https://en.wikibooks.org/wiki/Cookbook%3ASoy-Lentil-Vegetable_Stew'],
  ['chicken-black-eyed-pea-stew', 'family-rice-legume-pot', '鸡肉黑眼豆番茄饭锅', 'Cookbook:Chicken and Black-eyed Pea Stew', 'https://en.wikibooks.org/wiki/Cookbook:Chicken_and_Black-eyed_Pea_Stew'],
  ['lentil-potato-tomato-curry', 'family-legume-vegetable-stew', '扁豆土豆番茄咖喱', 'Cookbook:Lentil, Potato, and Tomato Curry', 'https://en.wikibooks.org/wiki/Cookbook:Lentil,_Potato,_and_Tomato_Curry'],
  ['shakshuka-tomato-egg', 'family-tomato-egg-pot', '番茄甜椒炖蛋', 'Cookbook:Shakshuka I', 'https://en.wikibooks.org/wiki/Cookbook:Shakshuka_I'],
  ['texas-beef-chili', 'family-legume-vegetable-stew', '德州风味牛肉辣炖锅', 'Cookbook:Original Texas-Style Chili', 'https://en.wikibooks.org/wiki/Cookbook:Original_Texas-Style_Chili'],
  ['kari-ayam-coconut-chicken', 'family-coconut-curry', '印尼椰香鸡肉咖喱', 'Cookbook:Kari Ayam (Indonesian Chicken Curry)', 'https://en.wikibooks.org/wiki/Cookbook:Kari_Ayam_(Indonesian_Chicken_Curry)'],
  ['basic-risotto', 'family-risotto', '基础意式烩饭', 'Cookbook:Risotto (Basic)', 'https://en.wikibooks.org/wiki/Cookbook:Risotto_(Basic)'],
  ['rice-cabbage-minestrone', 'family-minestrone', '米粒卷心菜杂蔬汤', 'Cookbook:Rice and Cabbage Minestrone', 'https://en.wikibooks.org/wiki/Cookbook:Rice_and_Cabbage_Minestrone'],
];

const RICE_SAFE_BASIS = '红扁豆提供蛋白，土豆作为主食，番茄作为蔬菜；这道菜无需搭配米饭或其他额外主食即可成餐。';

const CHECKER_DATA_FILES = [
  'recipe-library.json',
  'coverage-recipe-candidates.json',
  'coverage-recipe-drafts.json',
  'coverage-recipe-promotions.json',
  'ingredient-taxonomy.v1.json',
  'meal-templates.v2.json',
  'ratio-rules.v1.json',
  'regional-menu-research.v1.json',
  'menu-verification-cases.v1.json',
  'menu-master-baseline.v1.json',
];

function runCheckerWithAssetMutation(mutate) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'planner-gate-'));
  const tempTools = path.join(tempRoot, 'tools');
  fs.mkdirSync(path.join(tempTools, 'data'), { recursive: true });
  fs.copyFileSync(new URL('../check-recipes.mjs', import.meta.url), path.join(tempTools, 'check-recipes.mjs'));
  fs.cpSync(new URL('../lib/', import.meta.url), path.join(tempTools, 'lib'), { recursive: true });
  fs.cpSync(new URL('../../worker/src/', import.meta.url), path.join(tempRoot, 'worker', 'src'), { recursive: true });
  fs.cpSync(new URL('../generated/', import.meta.url), path.join(tempTools, 'generated'), { recursive: true });
  fs.cpSync(new URL('../../docs/', import.meta.url), path.join(tempRoot, 'docs'), { recursive: true });
  for (const name of CHECKER_DATA_FILES) {
    fs.copyFileSync(new URL(`../data/${name}`, import.meta.url), path.join(tempTools, 'data', name));
  }
  mutate(path.join(tempTools, 'data'));
  const result = spawnSync(process.execPath, [path.join(tempTools, 'check-recipes.mjs')], { encoding: 'utf8' });
  fs.rmSync(tempRoot, { recursive: true, force: true });
  return result;
}

test('formal library has 21 families and 72 recipes split into 12 approved plus 60 auto_approved', () => {
  assert.deepEqual(validateRecipeLibrary(lib), []);
  assert.equal(lib.families.length, 21);
  assert.equal(lib.recipes.length, 72);
  assert.equal(lib.recipes.filter(recipe => recipe.status === 'approved').length, 12);
  assert.equal(lib.recipes.filter(recipe => recipe.status === 'auto_approved').length, 60);
  assert.ok(lib.recipes.every(recipe => (
    recipe.origin_candidate_id ? recipe.status === 'auto_approved' : recipe.status === 'approved'
  )));
});

test('aggregate recipe checker reports the validated planner catalog summary', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../check-recipes.mjs', import.meta.url))], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /72 recipes/);
  assert.match(result.stdout, /8 active templates/);
  assert.match(result.stdout, /7 planned templates/);
  assert.match(result.stdout, /taxonomy ok/);
  assert.match(result.stdout, /ratio DSL ok/);
});

test('aggregate recipe checker fails closed on malformed planner assets and evidence references', async t => {
  const cases = [
    ['taxonomy', 'ingredient-taxonomy.v1.json', data => { data.taxonomy_version = 'taxonomy-broken'; }],
    ['template', 'meal-templates.v2.json', data => { data.templates[0].activation_status = 'planned'; }],
    ['ratio DSL', 'ratio-rules.v1.json', data => { data.ratio_catalog_version = 'ratio-broken'; }],
    ['recipe evidence', 'meal-templates.v2.json', data => { data.templates[0].evidence_recipe_ids[0] = 'missing-recipe'; }],
  ];
  for (const [name, file, mutate] of cases) {
    await t.test(name, () => {
      const result = runCheckerWithAssetMutation(dataDirectory => {
        const assetPath = path.join(dataDirectory, file);
        const data = JSON.parse(fs.readFileSync(assetPath, 'utf8'));
        mutate(data);
        fs.writeFileSync(assetPath, JSON.stringify(data));
      });
      assert.equal(result.status, 1, `${name} unexpectedly passed:\n${result.stdout}\n${result.stderr}`);
      assert.match(result.stderr, /❌/);
    });
  }
});

test('aggregate recipe checker withholds menu master success when taxonomy validation fails', () => {
  const result = runCheckerWithAssetMutation(dataDirectory => {
    const taxonomyPath = path.join(dataDirectory, 'ingredient-taxonomy.v1.json');
    const taxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));
    taxonomy.taxonomy_version = 'taxonomy-broken';
    fs.writeFileSync(taxonomyPath, JSON.stringify(taxonomy));
  });
  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.doesNotMatch(result.stdout, /menu master ok/);
});

test('aggregate recipe checker rejects a deleted Phase Zero baseline recipe before it can pass', () => {
  const result = runCheckerWithAssetMutation(dataDirectory => {
    const recipePath = path.join(dataDirectory, 'recipe-library.json');
    const library = JSON.parse(fs.readFileSync(recipePath, 'utf8'));
    library.recipes.pop();
    fs.writeFileSync(recipePath, JSON.stringify(library));
  });
  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /versioned Phase Zero baseline/);
  assert.doesNotMatch(result.stdout, /menu master ok/);
});

test('aggregate recipe checker reports null research and verification entries without rendering derived artifacts', () => {
  const result = runCheckerWithAssetMutation(dataDirectory => {
    for (const name of ['regional-menu-research.v1.json', 'menu-verification-cases.v1.json']) {
      const file = path.join(dataDirectory, name);
      const ledger = JSON.parse(fs.readFileSync(file, 'utf8'));
      ledger.entries = [null];
      fs.writeFileSync(file, JSON.stringify(ledger));
    }
  });
  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /entry must be an object/);
  assert.match(result.stderr, /verification entry 0 must be an object/);
  assert.doesNotMatch(result.stderr, /TypeError|missing or stale/);
});

test('aggregate recipe checker lets the source validator report a null recipe entry', () => {
  const result = runCheckerWithAssetMutation(dataDirectory => {
    const file = path.join(dataDirectory, 'recipe-library.json');
    const library = JSON.parse(fs.readFileSync(file, 'utf8'));
    library.recipes = [null];
    fs.writeFileSync(file, JSON.stringify(library));
  });
  assert.equal(result.status, 1, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stderr, /recipe at index 0 must be an object/);
  assert.doesNotMatch(result.stderr, /TypeError/);
});

test('Phase A family and recipe identities stay exact at the head of the formal library', () => {
  assert.deepEqual(lib.families.slice(0, 9).map(family => family.id), EXPECTED_FAMILY_IDS);
  assert.deepEqual(
    lib.recipes.slice(0, 12).map(recipe => {
      const source = recipe.source_refs[0];
      return [recipe.id, recipe.family_id, recipe.name, source.title, source.url];
    }),
    EXPECTED_RECIPES,
  );
});

test('the original twelve approved recipe objects remain byte-for-byte equivalent to the frozen fixture', () => {
  assert.deepEqual(lib.recipes.slice(0, 12), originalApprovedRecipes);
});

test('the original thirty promoted recipes remain isolated and canonically sourced', () => {
  const promoted = lib.recipes.filter(recipe => PROMOTION_MATRIX.has(recipe.id));
  assert.equal(promoted.length, 30);
  for (const recipe of promoted) {
    assert.equal(recipe.status, 'auto_approved', `${recipe.id} must stay auto_approved until human review`);
    const [source] = recipe.source_refs;
    assert.deepEqual(source, {
      usage: 'approved',
      title: `一锅出原创标准配方：${recipe.name}`,
      url: `https://yiguochu.pages.dev/recipes.html?id=${recipe.id}`,
      license: '一锅出项目原创标准配方，保留所有权利',
      attribution: '一锅出项目',
      retrieved_at: '2026-07-17',
    });
  }
});

test('both promotion batches own exactly the sixty auto-approved recipes', () => {
  assert.equal(PROMOTION_MATRIX.size, 30);
  assert.equal(COVERAGE_PROMOTION_MATRIX.size, 30);
  const traditionalIds = new Set(PROMOTION_MATRIX.keys());
  const coverageIds = new Set(COVERAGE_PROMOTION_MATRIX.keys());
  assert.deepEqual([...traditionalIds].filter(id => coverageIds.has(id)), []);
  const owned = new Set([...traditionalIds, ...coverageIds]);
  const autoApproved = lib.recipes
    .filter(recipe => recipe.status === 'auto_approved')
    .map(recipe => recipe.id);
  assert.equal(owned.size, 60);
  assert.deepEqual(new Set(autoApproved), owned);
  assert.equal(
    fs.existsSync(new URL('../data/coverage-recipe-production.json', import.meta.url)),
    false,
    'temporary coverage production file must be removed after atomic merge',
  );
});

test('identity-sensitive regional adaptations keep names, ingredients and finished-product claims truthful', () => {
  const fiveColor = lib.recipes.find(recipe => recipe.id === 'guangxi-five-color-glutinous-rice');
  assert.deepEqual(fiveColor.core_ingredients, [
    '糯米',
    '食品级紫薯粉',
    '食品级甜菜粉',
    '食品级菠菜粉',
    '食品级南瓜粉',
  ]);
  assert.match(fiveColor.summary, /原色糯米.*四种明确命名/);
  assert.deepEqual(fiveColor.substitution_slots, [{
    slot: '着色方案',
    replaces: ['食品级紫薯粉', '食品级甜菜粉', '食品级菠菜粉', '食品级南瓜粉'],
    allowed: ['不加着色粉，改做原味糯米饭'],
  }]);

  const gutu = lib.recipes.find(recipe => recipe.id === 'tibetan-gutu');
  assert.equal(gutu.name, '古突风味家庭适配版');
  assert.match(gutu.summary, /不作为传统古突成品/);
  assert.equal(gutu.source_refs[0].title, '一锅出原创标准配方：古突风味家庭适配版');

  const sheBlackRice = lib.recipes.find(recipe => recipe.id === 'she-people-black-rice');
  assert.equal(sheBlackRice.origin_candidate_id, 'she-people-black-rice');
  assert.equal(sheBlackRice.name, '畲族乌饭风味家庭适配版');
  assert.match(sheBlackRice.summary, /食品级黑米色粉.*不声称复刻传统成品/);
  assert.match(sheBlackRice.adaptation_note, /畲族乌饭风味家庭适配版.*不声称复刻传统色源或传统成品/);
  assert.equal(sheBlackRice.source_refs[0].title, '一锅出原创标准配方：畲族乌饭风味家庭适配版');

  const banshan = lib.recipes.find(recipe => recipe.id === 'banshan-wild-rice');
  assert.equal(banshan.name, '半山野米饭风味平菇焖饭');
  assert.deepEqual(banshan.core_ingredients, ['大米', '平菇']);
  assert.deepEqual(banshan.substitution_slots, [{
    slot: '食用菌',
    replaces: ['平菇'],
    allowed: ['鲜香菇'],
  }]);
  assert.match(banshan.adaptation_note, /不声称是传统成品/);
  assert.doesNotMatch(
    [...banshan.technique, ...banshan.ratio_rules, ...banshan.safety_rules].join('。'),
    /使用野生食材|野生食材必须记录/,
  );
});

test('every approved recipe locks generation extras to at most four reviewed ingredients', () => {
  for (const recipe of lib.recipes) {
    assert.ok(Array.isArray(recipe.generation_optional_ingredients), `${recipe.id} missing generation optional lock`);
    assert.ok(recipe.generation_optional_ingredients.length > 0, `${recipe.id} generation optional lock is empty`);
    assert.ok(recipe.generation_optional_ingredients.length <= 4, `${recipe.id} generation optional lock exceeds four`);
    const approved = new Set([
      ...recipe.optional_ingredients,
      ...recipe.substitution_slots.flatMap(slot => slot.allowed),
    ]);
    for (const name of recipe.generation_optional_ingredients) {
      assert.ok(approved.has(name), `${recipe.id} generation optional is outside approved boundary: ${name}`);
    }
    assert.ok(Array.isArray(recipe.generation_liquid_ingredients), `${recipe.id} missing generation liquid lock`);
    assert.ok(recipe.generation_liquid_ingredients.length <= 1, `${recipe.id} generation liquid lock exceeds one`);
    const generatedBoundary = new Set(['水', ...recipe.core_ingredients, ...recipe.generation_optional_ingredients]);
    for (const name of recipe.generation_liquid_ingredients) {
      assert.ok(generatedBoundary.has(name), `${recipe.id} generation liquid is outside generation boundary: ${name}`);
    }
  }
});

test('fast vegan seed keeps the approved source quantities and animal-free boundary', () => {
  assert.equal(lib.recipes.some(recipe => recipe.id === 'mung-bean-brown-rice-curry'), false);
  const recipe = lib.recipes.find(item => item.id === 'soy-lentil-vegetable-stew');
  assert.ok(recipe);
  assert.equal(recipe.total_time_minutes, 30);
  assert.deepEqual(recipe.core_ingredients, ['红扁豆', '大豆蛋白块', '西兰花', '红洋葱']);
  assert.deepEqual(recipe.substitution_slots, [{
    slot: '坚果或种子',
    replaces: ['花生'],
    allowed: ['葵花籽', '不加坚果或种子'],
  }]);
  assert.match(recipe.ratio_rules.join('；'), /40克.*80克.*250克.*500克/);
  assert.equal(recipe.core_ingredients.includes('花生'), false);
  const animalTerms = ['鸡肉', '鸭肉', '牛肉', '猪肉', '鱼', '虾', '鸡蛋', '牛奶', '奶油', '黄油', '蜂蜜'];
  assert.equal(
    [...recipe.core_ingredients, ...recipe.optional_ingredients]
      .some(name => animalTerms.some(term => name.includes(term))),
    false,
  );
  assert.deepEqual(recipe.source_refs[0], {
    usage: 'approved',
    title: 'Cookbook:Soy-Lentil-Vegetable Stew',
    url: 'https://en.wikibooks.org/wiki/Cookbook%3ASoy-Lentil-Vegetable_Stew',
    license: 'CC BY-SA 4.0',
    attribution: 'Wikibooks contributors, Cookbook:Soy-Lentil-Vegetable Stew',
    retrieved_at: '2026-07-17',
  });
});

test('lentil curry records an explicit one-pot adaptation', () => {
  const recipe = lib.recipes.find(item => item.id === 'lentil-potato-tomato-curry');
  assert.match(recipe.summary, /同一口锅/);
  assert.deepEqual(recipe.technique, [
    '同锅炒香土豆和香料',
    '加入番茄和红扁豆',
    '加入量化水同锅炖熟',
    '取出月桂叶',
  ]);
  assert.match(recipe.adaptation_note, /原始来源使用两个烹饪容器/);
  assert.doesNotMatch(`${recipe.summary}${recipe.technique.join('')}`, /扁豆先煮|土豆煎香/);
});

test('rice recipes convert source ratios into explicit per-serving generation grams', () => {
  const biryani = lib.recipes.find(item => item.id === 'simple-chicken-biryani');
  assert.match(biryani.ratio_rules.join('。'), /原始300克:600克:850毫升/);
  assert.match(biryani.ratio_rules.join('。'), /每1份.*大米100克.*鸡肉200克.*鸡高汤280克/);
  const jollof = lib.recipes.find(item => item.id === 'jollof-rice');
  assert.match(jollof.ratio_rules.join('。'), /体积约1:1/);
  assert.match(jollof.ratio_rules.join('。'), /每1份.*大米100克.*鸡高汤130克/);
  const risotto = lib.recipes.find(item => item.id === 'basic-risotto');
  assert.match(risotto.ratio_rules.join('。'), /原始.*400克.*1升/);
  assert.match(risotto.ratio_rules.join('。'), /每1份.*意式烩饭米100克.*高汤250克/);
  assert.match(risotto.adaptation_note, /不得把1升原量直接套到2份/);
});

test('rice cabbage minestrone records its raw-rice one-pot adaptation', () => {
  const recipe = lib.recipes.find(item => item.id === 'rice-cabbage-minestrone');
  assert.match(recipe.adaptation_note, /原始来源使用熟米入汤/);
  assert.match(recipe.adaptation_note, /少量生米与高汤同煮/);
  assert.match(recipe.adaptation_note, /米粒半熟后再加卷心菜/);
  assert.match(recipe.adaptation_note, /不得使用电饭锅、盛出米饭或另起锅/);
});

test('soy stew and congee record deterministic production adaptations', () => {
  const soy = lib.recipes.find(item => item.id === 'soy-lentil-vegetable-stew');
  assert.match(soy.adaptation_note, /只选橄榄油、蒜、姜黄、黑胡椒四项/);
  assert.match(soy.adaptation_note, /另列有数字克数的水和盐/);
  assert.match(soy.adaptation_note, /大豆蛋白块不得单独提前泡发或沥干/);
  assert.match(soy.adaptation_note, /西兰花.*最后5分钟/);
  const congee = lib.recipes.find(item => item.id === 'chinese-congee');
  assert.deepEqual(congee.substitution_slots, [{ slot: '煮粥液体', replaces: ['水'], allowed: ['鸡高汤'] }]);
  assert.match(congee.adaptation_note, /用户已选水时锁定为水/);
  assert.match(congee.adaptation_note, /只选酱油、芝麻油、葱、姜四项可选配料/);
});

test('black-eyed pea production base locks a source-supported cooked state and non-conflicting omissions', () => {
  const stew = lib.recipes.find(item => item.id === 'chicken-black-eyed-pea-stew');
  assert.ok(stew.core_ingredients.includes('黑眼豆（罐头沥干）'));
  assert.match(stew.adaptation_note, /罐头沥干或已煮熟/);
  assert.match(stew.adaptation_note, /不得另行预煮/);
  assert.deepEqual(stew.substitution_slots[0], {
    slot: '鸡肉替代',
    replaces: ['鸡肉'],
    allowed: ['不放鸡肉'],
  });
  const risotto = lib.recipes.find(item => item.id === 'basic-risotto');
  assert.deepEqual(risotto.substitution_slots.find(slot => slot.slot === '白葡萄酒'), {
    slot: '白葡萄酒',
    replaces: ['白葡萄酒'],
    allowed: ['不放白葡萄酒'],
  });
  assert.ok(stew.discouraged.some(rule => rule.ingredients.includes('大量叶菜')));
});

test('Texas chili and kari ayam lock every retained liquid into the production contract', () => {
  const chili = lib.recipes.find(item => item.id === 'texas-beef-chili');
  assert.equal(chili.total_time_minutes, 40);
  assert.ok(chili.core_ingredients.includes('牛肉（粗绞）'));
  assert.ok(chili.core_ingredients.includes('干辣椒'));
  assert.deepEqual(chili.generation_liquid_ingredients, ['水']);
  assert.ok(chili.generation_optional_ingredients.includes('植物油'));
  assert.ok(chili.generation_optional_ingredients.includes('玉米粉'));
  assert.match(chili.adaptation_note, /原始来源.*30分钟.*1小时.*30分钟/);
  assert.match(chili.adaptation_note, /粗绞牛肉/);
  assert.match(chili.adaptation_note, /每1份.*干辣椒3克/);
  assert.match(chili.adaptation_note, /每1份.*水50克.*留出10克.*玉米粉浆/);
  assert.match(chili.adaptation_note, /1份水50克.*留10克.*2份水100克.*留20克.*4份水200克.*留40克/);
  assert.match(chili.adaptation_note, /炒散.*5分钟.*快炖20分钟.*收稠5分钟/);
  assert.match(chili.adaptation_note, /总时长不得超过40分钟/);
  assert.match(chili.ratio_rules.join('。'), /每1份.*粗绞牛肉200克.*玉米粉5克.*水50克/);
  assert.match(chili.ratio_rules.join('。'), /4份.*水200克.*留40克/);
  const kari = lib.recipes.find(item => item.id === 'kari-ayam-coconut-chicken');
  assert.deepEqual(kari.generation_liquid_ingredients, ['椰奶']);
  assert.match(kari.adaptation_note, /部分椰奶/);
  assert.match(kari.adaptation_note, /不得加水/);
});

test('shakshuka production ratio keeps egg grams and nest count aligned', () => {
  const recipe = lib.recipes.find(item => item.id === 'shakshuka-tomato-egg');
  assert.match(recipe.adaptation_note, /每1份3个中等鸡蛋/);
  assert.match(recipe.adaptation_note, /每个鸡蛋单独挖窝/);
  assert.match(recipe.adaptation_note, /鸡蛋.*熟透.*蛋白和蛋黄完全凝固.*不得流心/);
  assert.match(recipe.safety_rules.join('。'), /蛋白和蛋黄完全凝固.*不得流心/);
  assert.match(recipe.ratio_rules.join('。'), /去壳约150克/);
});

test('validator bounds required recipe time and adaptation metadata', () => {
  const invalid = structuredClone(lib);
  invalid.recipes[0].total_time_minutes = 4;
  invalid.recipes[1].total_time_minutes = 121;
  invalid.recipes[2].total_time_minutes = 30.5;
  delete invalid.recipes[3].total_time_minutes;
  invalid.recipes[4].adaptation_note = '   ';
  invalid.recipes[5].adaptation_note = '改'.repeat(401);
  invalid.recipes[6].adaptation_note = 42;
  const errors = validateRecipeLibrary(invalid);
  assert.ok(errors.includes(`${invalid.recipes[0].id} total_time_minutes must be an integer from 5 to 120`));
  assert.ok(errors.includes(`${invalid.recipes[1].id} total_time_minutes must be an integer from 5 to 120`));
  assert.ok(errors.includes(`${invalid.recipes[2].id} total_time_minutes must be an integer from 5 to 120`));
  assert.ok(errors.includes(`${invalid.recipes[3].id} missing total_time_minutes`));
  assert.ok(errors.includes(`${invalid.recipes[4].id} adaptation_note must contain 1 to 400 characters`));
  assert.ok(errors.includes(`${invalid.recipes[5].id} adaptation_note must contain 1 to 400 characters`));
  assert.ok(errors.includes(`${invalid.recipes[6].id} adaptation_note must contain 1 to 400 characters`));
});

test('validator requires protein_class and light_level inside their controlled vocabularies', () => {
  const invalid = structuredClone(lib);
  delete invalid.recipes[0].protein_class;
  invalid.recipes[1].protein_class = [];
  invalid.recipes[2].protein_class = ['火星蛋白'];
  invalid.recipes[3].protein_class = ['鸡', 42];
  delete invalid.recipes[4].light_level;
  invalid.recipes[5].light_level = '超辣';
  const errors = validateRecipeLibrary(invalid);
  assert.ok(errors.includes(`${invalid.recipes[0].id} protein_class must be a non-empty array`));
  assert.ok(errors.includes(`${invalid.recipes[1].id} protein_class must be a non-empty array`));
  assert.ok(errors.includes(`${invalid.recipes[2].id} protein_class value must be one of 鸡/鸭/牛/猪/羊/鱼/虾/蟹/贝/蛋/豆类/豆制品/无: 火星蛋白`));
  assert.ok(errors.includes(`${invalid.recipes[3].id} protein_class value must be one of 鸡/鸭/牛/猪/羊/鱼/虾/蟹/贝/蛋/豆类/豆制品/无: 42`));
  assert.ok(errors.includes(`${invalid.recipes[4].id} light_level must be one of 清淡/一般/浓重`));
  assert.ok(errors.includes(`${invalid.recipes[5].id} light_level must be one of 清淡/一般/浓重`));
});

test('validator cross-checks protein_class against fixed core ingredients', () => {
  const invalid = structuredClone(lib);
  const duck = invalid.recipes.find(recipe => recipe.id === 'nanjing-duck-greens-rice');
  const lentil = invalid.recipes.find(recipe => recipe.id === 'lentil-potato-tomato-curry');
  const congee = invalid.recipes.find(recipe => recipe.id === 'chinese-congee');
  duck.protein_class = ['鸡'];
  lentil.protein_class = ['无'];
  congee.protein_class = ['豆类'];

  const errors = validateRecipeLibrary(invalid);
  assert.ok(errors.includes(`${duck.id} protein_class must match core ingredients: expected 鸭, got 鸡`));
  assert.ok(errors.includes(`${lentil.id} protein_class must match core ingredients: expected 豆类, got 无`));
  assert.ok(errors.includes(`${congee.id} protein_class must match core ingredients: expected 无, got 豆类`));
});

test('every formal recipe carries controlled protein_class and light_level annotations', () => {
  const proteinClasses = new Set(['鸡', '鸭', '牛', '猪', '羊', '鱼', '虾', '蟹', '贝', '蛋', '豆类', '豆制品', '无']);
  const lightLevels = new Set(['清淡', '一般', '浓重']);
  for (const recipe of lib.recipes) {
    assert.ok(Array.isArray(recipe.protein_class) && recipe.protein_class.length > 0, `${recipe.id} missing protein_class`);
    assert.ok(recipe.protein_class.every(value => proteinClasses.has(value)), `${recipe.id} protein_class outside vocabulary`);
    assert.ok(lightLevels.has(recipe.light_level), `${recipe.id} light_level outside vocabulary`);
    assert.ok(Number.isInteger(recipe.total_time_minutes), `${recipe.id} missing total_time_minutes`);
  }
  // 关键区分：鸡蛋归「蛋」不得污染「鸡」；番茄甜椒炖蛋不含鸡肉。
  const shakshuka = lib.recipes.find(recipe => recipe.id === 'shakshuka-tomato-egg');
  assert.deepEqual(shakshuka.protein_class, ['蛋']);
  const congee = lib.recipes.find(recipe => recipe.id === 'chinese-congee');
  assert.deepEqual(congee.protein_class, ['无']);
});

test('formal protein classes distinguish duck and legumes from chicken or no protein', () => {
  const classes = id => lib.recipes.find(recipe => recipe.id === id).protein_class;

  assert.deepEqual(classes('nanjing-duck-greens-rice'), ['鸭']);
  assert.deepEqual(classes('lentil-potato-tomato-curry'), ['豆类']);
  assert.deepEqual(classes('fujian-hyacinth-bean-rice'), ['豆类']);
  assert.deepEqual(classes('shaanbei-red-date-cowpea-rice'), ['豆类']);
  assert.deepEqual(classes('qinghai-hao-fan'), ['豆类']);
  assert.deepEqual(classes('soy-lentil-vegetable-stew'), ['豆类', '豆制品']);
  assert.deepEqual(classes('chicken-black-eyed-pea-stew'), ['鸡', '豆类']);
});

test('validator rejects generation optional locks outside the reviewed boundary', () => {
  const invalid = structuredClone(lib);
  invalid.recipes[0].generation_optional_ingredients = ['酱油', '芝麻油', '白胡椒', '葱', '姜'];
  invalid.recipes[1].generation_optional_ingredients = ['未审批配料'];
  invalid.recipes[2].generation_liquid_ingredients = ['鸡高汤', '水'];
  invalid.recipes[3].generation_liquid_ingredients = ['未审批高汤'];
  const errors = validateRecipeLibrary(invalid);
  assert.ok(errors.includes(`${invalid.recipes[0].id} generation_optional_ingredients must contain 1 to 4 items`));
  assert.ok(errors.includes(`${invalid.recipes[1].id} generation optional ingredient is not approved: 未审批配料`));
  assert.ok(errors.includes(`${invalid.recipes[2].id} generation_liquid_ingredients must contain at most 1 item`));
  assert.ok(errors.includes(`${invalid.recipes[3].id} generation liquid ingredient is not in the generation boundary: 未审批高汤`));
});

test('validator requires candidate provenance for canonical project sources and blocks identity placeholders', () => {
  const missingOrigin = structuredClone(lib);
  missingOrigin.recipes[0].source_refs[0] = {
    usage: 'approved',
    title: '一锅出原创标准配方：测试',
    url: 'https://yiguochu.pages.dev/recipes.html?id=chinese-congee',
    license: '一锅出项目原创标准配方，保留所有权利',
    attribution: '一锅出项目',
    retrieved_at: '2026-07-17',
  };
  assert.ok(validateRecipeLibrary(missingOrigin).includes(
    'chinese-congee canonical project source requires origin_candidate_id',
  ));

  const placeholder = structuredClone(missingOrigin);
  placeholder.recipes[0].origin_candidate_id = 'demo-candidate';
  placeholder.recipes[0].core_ingredients = ['大米', '地方植物'];
  assert.ok(validateRecipeLibrary(placeholder).includes(
    'chinese-congee promoted recipe contains identity placeholder 地方植物',
  ));
});

test('canonical ingredient aliases stay stable for later selectors', () => {
  assert.deepEqual(lib.ingredient_aliases, {
    西红柿: '番茄',
    白米: '大米',
    鸡腿肉: '鸡肉',
    鸡胸肉: '鸡肉',
    青椒: '甜椒',
    椰浆: '椰奶',
    扁豆: '红扁豆',
    '黑眼豆（罐头沥干）': '黑眼豆',
    '牛肉（粗绞）': '牛肉',
    粗绞牛肉: '牛肉',
    干辣椒: '辣椒',
    豆腐: '老豆腐',
    高丽菜: '卷心菜',
    香菇: '鲜香菇',
    剩米饭: '熟米饭',
    隔夜米饭: '熟米饭',
    排骨: '猪肋排',
  });
});

test('validator rejects a substitution alternative that duplicates another fixed core ingredient', () => {
  const invalid = structuredClone(lib);
  invalid.recipes[0].substitution_slots[0] = {
    slot: '冲突替换',
    replaces: ['水'],
    allowed: ['大米'],
  };
  const errors = validateRecipeLibrary(invalid);
  assert.ok(errors.includes(`${invalid.recipes[0].id} substitution slot at index 0 allowed ingredient duplicates another core ingredient: 大米`));
});

test('only the lentil curry is approved as a complete rice-allergy main meal', () => {
  const qualified = lib.recipes.filter(recipe => Array.isArray(recipe.constraint_profiles));
  assert.deepEqual(qualified.map(recipe => recipe.id), ['lentil-potato-tomato-curry']);
  assert.deepEqual(qualified[0].constraint_profiles, [{
    id: 'rice-allergy-complete-main',
    basis: RICE_SAFE_BASIS,
  }]);
});

test('every formal recipe carries explicit adaptation, cooking, safety, and source metadata', () => {
  for (const recipe of lib.recipes) {
    for (const key of ['core_ingredients', 'optional_ingredients', 'substitution_slots', 'discouraged', 'technique', 'ratio_rules', 'safety_rules']) {
      assert.ok(Array.isArray(recipe[key]) && recipe[key].length > 0, `${recipe.id} missing ${key}`);
    }
    for (const slot of recipe.substitution_slots) {
      assert.ok(String(slot.slot || '').trim(), `${recipe.id} substitution slot missing label`);
      assert.ok(Array.isArray(slot.replaces) && slot.replaces.length > 0, `${recipe.id} substitution slot missing replaces`);
      assert.ok(Array.isArray(slot.allowed) && slot.allowed.length > 0, `${recipe.id} substitution slot missing allowed`);
    }
    const [source] = recipe.source_refs;
    assert.equal(recipe.source_refs.length, 1);
    assert.equal(source.usage, 'approved');
    if (recipe.origin_candidate_id) {
      assert.equal(source.license, '一锅出项目原创标准配方，保留所有权利');
      assert.equal(source.attribution, '一锅出项目');
    } else {
      assert.equal(source.license, 'CC BY-SA 4.0');
      assert.equal(source.attribution, `Wikibooks contributors, ${source.title}`);
    }
    assert.match(source.retrieved_at, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test('RecipeDB is never an approved production source', () => {
  const sources = lib.recipes.flatMap(recipe => recipe.source_refs);
  assert.equal(sources.some(source => /recipedb/i.test(source.url) && source.usage === 'approved'), false);
});

test('validator reports malformed roots instead of throwing', () => {
  assert.deepEqual(validateRecipeLibrary(null), [
    'schema_version must be 1',
    'ingredient_aliases must be an object',
    'families must be an array',
    'recipes must be an array',
  ]);
});

test('validator rejects invalid identities, references, rules, and source metadata', () => {
  const invalid = structuredClone(lib);
  invalid.families[0].id = 'Family Bad';
  invalid.families[1].id = invalid.families[2].id;
  invalid.recipes[0].id = 'Recipe Bad';
  invalid.recipes[1].id = invalid.recipes[2].id;
  invalid.recipes[3].family_id = 'family-missing';
  invalid.recipes[4].status = 'draft';
  invalid.recipes[5].technique = [];
  invalid.recipes[6].discouraged[0].reason_type = 'unknown';
  invalid.recipes[7].source_refs[0] = {
    usage: 'research',
    url: 'http://recipedb.example/recipe',
    title: '',
    license: '',
    attribution: '',
    retrieved_at: '',
  };

  const errors = validateRecipeLibrary(invalid);
  for (const expected of [
    'invalid family id: Family Bad',
    `duplicate family id: ${invalid.families[2].id}`,
    'invalid recipe id: Recipe Bad',
    `duplicate recipe id: ${invalid.recipes[2].id}`,
    `${invalid.recipes[3].id} missing family family-missing`,
    `${invalid.recipes[4].id} status must be approved (human-approved) or auto_approved (auto-gate passed, pending human review)`,
    `${invalid.recipes[5].id} technique must be non-empty`,
    `${invalid.recipes[6].id} invalid reason_type unknown`,
    `${invalid.recipes[7].id} source usage must be approved`,
    `${invalid.recipes[7].id} source URL must be HTTPS`,
    `${invalid.recipes[7].id} source missing title`,
    `${invalid.recipes[7].id} source missing license`,
    `${invalid.recipes[7].id} source missing attribution`,
    `${invalid.recipes[7].id} source retrieved_at must be a valid ISO YYYY-MM-DD date`,
    `${invalid.recipes[7].id} RecipeDB cannot be approved`,
  ]) {
    assert.ok(errors.includes(expected), `missing validation error: ${expected}`);
  }
});

test('validator rejects missing ratio rules, discouraged rules, and malformed substitution slots', () => {
  const invalid = structuredClone(lib);
  invalid.recipes[0].ratio_rules = [];
  invalid.recipes[1].discouraged = [];
  invalid.recipes[2].substitution_slots[0] = { slot: '', replaces: [], allowed: [] };

  const errors = validateRecipeLibrary(invalid);
  assert.ok(errors.includes(`${invalid.recipes[0].id} ratio_rules must be non-empty`));
  assert.ok(errors.includes(`${invalid.recipes[1].id} discouraged must be non-empty`));
  assert.ok(errors.includes(`${invalid.recipes[2].id} invalid substitution slot`));
});

test('validator rejects malformed unknown and duplicate constraint profiles', () => {
  const invalid = structuredClone(lib);
  invalid.recipes[0].constraint_profiles = {};
  invalid.recipes[1].constraint_profiles = [
    null,
    { id: 'unknown-profile', basis: RICE_SAFE_BASIS },
    { id: 'rice-allergy-complete-main', basis: '   ' },
    { id: 'rice-allergy-complete-main', basis: RICE_SAFE_BASIS },
    { id: 'rice-allergy-complete-main', basis: RICE_SAFE_BASIS, extra: true },
  ];

  const errors = validateRecipeLibrary(invalid);
  for (const expected of [
    `${invalid.recipes[0].id} constraint_profiles must be a non-empty array`,
    `${invalid.recipes[1].id} constraint profile at index 0 must be an object`,
    `${invalid.recipes[1].id} constraint profile at index 1 has unknown id unknown-profile`,
    `${invalid.recipes[1].id} constraint profile at index 2 missing basis`,
    `${invalid.recipes[1].id} duplicate constraint profile rice-allergy-complete-main`,
    `${invalid.recipes[1].id} constraint profile at index 4 has unexpected fields`,
  ]) {
    assert.ok(errors.includes(expected), expected);
  }
});

test('validator returns errors for malformed nested containers and objects without throwing', () => {
  const invalid = structuredClone(lib);
  invalid.families = [null, []];
  invalid.recipes[0].substitution_slots = {};
  invalid.recipes[1].source_refs = [null];
  invalid.recipes[2].discouraged = [null];
  invalid.recipes[3].source_refs = {};
  invalid.recipes[4].discouraged = {};
  invalid.recipes.push(null);

  let errors;
  assert.doesNotThrow(() => {
    errors = validateRecipeLibrary(invalid);
  });
  assert.ok(Array.isArray(errors));
  for (const expected of [
    'family at index 0 must be an object',
    'family at index 1 must be an object',
    `${invalid.recipes[0].id} substitution_slots must be non-empty`,
    `${invalid.recipes[1].id} source at index 0 must be an object`,
    `${invalid.recipes[2].id} discouraged rule at index 0 must be an object`,
    `${invalid.recipes[3].id} source_refs must be non-empty`,
    `${invalid.recipes[4].id} discouraged must be non-empty`,
    `recipe at index ${invalid.recipes.length - 1} must be an object`,
  ]) {
    assert.ok(errors.includes(expected), `missing validation error: ${expected}`);
  }
});

test('validator rejects non-string elements in every recipe string array', () => {
  const invalid = structuredClone(lib);
  const mutations = [
    ['purposes', [null]],
    ['core_ingredients', [{}]],
    ['optional_ingredients', ['  ']],
    ['technique', [42]],
    ['ratio_rules', [null]],
    ['safety_rules', [{}]],
  ];
  mutations.forEach(([field, value], index) => {
    invalid.recipes[index][field] = value;
  });

  const errors = validateRecipeLibrary(invalid);
  mutations.forEach(([field], index) => {
    const expected = `${invalid.recipes[index].id} ${field} must contain non-empty strings`;
    assert.ok(errors.includes(expected), `missing validation error: ${expected}`);
  });
});

test('validator deeply validates substitution and discouraged rule elements', () => {
  const invalid = structuredClone(lib);
  invalid.recipes[0].substitution_slots = [
    null,
    { slot: {}, replaces: [null], allowed: [{}] },
  ];
  invalid.recipes[1].discouraged = [
    null,
    { ingredients: [null], reason_type: 'taste', reason: {} },
  ];

  const errors = validateRecipeLibrary(invalid);
  for (const expected of [
    `${invalid.recipes[0].id} substitution slot at index 0 must be an object`,
    `${invalid.recipes[0].id} substitution slot at index 1 missing slot`,
    `${invalid.recipes[0].id} substitution slot at index 1 replaces must contain non-empty strings`,
    `${invalid.recipes[0].id} substitution slot at index 1 allowed must contain non-empty strings`,
    `${invalid.recipes[1].id} discouraged rule at index 0 must be an object`,
    `${invalid.recipes[1].id} discouraged rule at index 1 ingredients must contain non-empty strings`,
    `${invalid.recipes[1].id} discouraged rule at index 1 missing reason`,
  ]) {
    assert.ok(errors.includes(expected), `missing validation error: ${expected}`);
  }
});

test('validator parses HTTPS URLs and validates source strings and real calendar dates', () => {
  const invalid = structuredClone(lib);
  const base = invalid.recipes[0].source_refs[0];
  invalid.recipes[0].source_refs = [
    null,
    { ...base, url: 'https://' },
    { ...base, url: 'http://example.com/recipe' },
    { ...base, title: {} },
    { ...base, license: [] },
    { ...base, attribution: 42 },
    { ...base, retrieved_at: '2026-02-30' },
    { ...base, retrieved_at: '2026/07/14' },
    { ...base, retrieved_at: 20260714 },
  ];

  const errors = validateRecipeLibrary(invalid);
  assert.ok(errors.includes(`${invalid.recipes[0].id} source at index 0 must be an object`));
  assert.equal(errors.filter(error => error === `${invalid.recipes[0].id} source URL must be HTTPS`).length, 2);
  assert.ok(errors.includes(`${invalid.recipes[0].id} source missing title`));
  assert.ok(errors.includes(`${invalid.recipes[0].id} source missing license`));
  assert.ok(errors.includes(`${invalid.recipes[0].id} source missing attribution`));
  assert.equal(
    errors.filter(error => error === `${invalid.recipes[0].id} source retrieved_at must be a valid ISO YYYY-MM-DD date`).length,
    3,
  );

  const validLeapDay = structuredClone(lib);
  validLeapDay.recipes[0].source_refs[0].retrieved_at = '2024-02-29';
  assert.deepEqual(validateRecipeLibrary(validLeapDay), []);
});

test('validator splits source provenance strictness between approved and auto_approved', () => {
  const promotedIndex = lib.recipes.findIndex(recipe => recipe.status === 'auto_approved');
  assert.ok(promotedIndex > -1);
  const promotedId = lib.recipes[promotedIndex].id;

  // auto_approved：放宽为 url/title/license/attribution 至少一项非空，不要求五要素齐全。
  const relaxed = structuredClone(lib);
  relaxed.recipes[promotedIndex].source_refs = [{ usage: 'approved', url: 'https://yiguochu.pages.dev/recipes.html?id=demo' }];
  assert.deepEqual(validateRecipeLibrary(relaxed), []);

  const relaxedTitleOnly = structuredClone(lib);
  relaxedTitleOnly.recipes[promotedIndex].source_refs = [{ usage: 'approved', title: '仅标题' }];
  assert.deepEqual(validateRecipeLibrary(relaxedTitleOnly), []);

  const relaxedEmpty = structuredClone(lib);
  relaxedEmpty.recipes[promotedIndex].source_refs = [{ usage: 'approved' }];
  assert.ok(validateRecipeLibrary(relaxedEmpty).includes(
    `${promotedId} auto_approved source must keep at least one of url/title/license/attribution non-empty (full five-element provenance is required only for approved)`,
  ));

  const relaxedHttp = structuredClone(lib);
  relaxedHttp.recipes[promotedIndex].source_refs = [{ usage: 'approved', url: 'http://example.com/recipe' }];
  assert.ok(validateRecipeLibrary(relaxedHttp).includes(`${promotedId} source URL must be HTTPS`));

  // approved：同一残缺来源仍要求五要素齐全。
  const strict = structuredClone(lib);
  strict.recipes[0].source_refs = [{ usage: 'approved', url: 'https://en.wikibooks.org/wiki/Cookbook:Chinese_Rice_Porridge_(Congee)' }];
  const strictErrors = validateRecipeLibrary(strict);
  for (const expected of [
    `${strict.recipes[0].id} source missing title`,
    `${strict.recipes[0].id} source missing license`,
    `${strict.recipes[0].id} source missing attribution`,
    `${strict.recipes[0].id} source retrieved_at must be a valid ISO YYYY-MM-DD date`,
  ]) {
    assert.ok(strictErrors.includes(expected), `missing validation error: ${expected}`);
  }
});

test('offline checker reports zero counts for malformed root containers without crashing', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'recipe-checker-'));
  const tempTools = path.join(tempRoot, 'tools');
  fs.mkdirSync(path.join(tempTools, 'data'), { recursive: true });
  fs.copyFileSync(new URL('../check-recipes.mjs', import.meta.url), path.join(tempTools, 'check-recipes.mjs'));
  fs.cpSync(new URL('../lib/', import.meta.url), path.join(tempTools, 'lib'), { recursive: true });
  fs.cpSync(new URL('../../worker/src/', import.meta.url), path.join(tempRoot, 'worker', 'src'), { recursive: true });
  for (const name of [
    'coverage-recipe-candidates.json',
    'coverage-recipe-drafts.json',
    'coverage-recipe-promotions.json',
    'ingredient-taxonomy.v1.json',
    'meal-templates.v2.json',
    'ratio-rules.v1.json',
  ]) {
    fs.copyFileSync(new URL(`../data/${name}`, import.meta.url), path.join(tempTools, 'data', name));
  }
  fs.writeFileSync(
    path.join(tempTools, 'data', 'recipe-library.json'),
    JSON.stringify({ schema_version: 1, ingredient_aliases: {}, families: null, recipes: {} }),
  );

  try {
    const result = spawnSync(process.execPath, [path.join(tempTools, 'check-recipes.mjs')], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /families must be an array/);
    assert.match(result.stderr, /recipes must be an array/);
    assert.doesNotMatch(result.stderr, /TypeError/);
    assert.match(result.stdout, /菜谱家族 0 个 · 基础菜谱 0 道/);
    assert.match(result.stdout, /菜谱库体检不通过/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

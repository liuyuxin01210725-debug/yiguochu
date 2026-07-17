import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateRecipeLibrary } from '../lib/recipe-library-validator.mjs';

const lib = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));

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

test('Phase A library has 9 families and 12 approved recipes', () => {
  assert.deepEqual(validateRecipeLibrary(lib), []);
  assert.equal(lib.families.length, 9);
  assert.equal(lib.recipes.length, 12);
  assert.ok(lib.recipes.every(recipe => recipe.status === 'approved'));
});

test('Phase A family and recipe identities stay exact', () => {
  assert.deepEqual(lib.families.map(family => family.id), EXPECTED_FAMILY_IDS);
  assert.deepEqual(
    lib.recipes.map(recipe => {
      const source = recipe.source_refs[0];
      return [recipe.id, recipe.family_id, recipe.name, source.title, source.url];
    }),
    EXPECTED_RECIPES,
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
});

test('rice cabbage minestrone records its raw-rice one-pot adaptation', () => {
  const recipe = lib.recipes.find(item => item.id === 'rice-cabbage-minestrone');
  assert.match(recipe.adaptation_note, /原始来源使用熟米入汤/);
  assert.match(recipe.adaptation_note, /少量生米与高汤同煮/);
  assert.match(recipe.adaptation_note, /不得使用电饭锅、盛出米饭或另起锅/);
});

test('soy stew and congee record deterministic production adaptations', () => {
  const soy = lib.recipes.find(item => item.id === 'soy-lentil-vegetable-stew');
  assert.match(soy.adaptation_note, /只选橄榄油、蒜、姜黄、黑胡椒四项/);
  assert.match(soy.adaptation_note, /另列有数字克数的水和盐/);
  assert.match(soy.adaptation_note, /大豆蛋白块不得单独提前泡发或沥干/);
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
  assert.deepEqual(chili.generation_liquid_ingredients, ['水']);
  assert.ok(chili.generation_optional_ingredients.includes('玉米粉'));
  assert.match(chili.adaptation_note, /水.*数字克数/);
  const kari = lib.recipes.find(item => item.id === 'kari-ayam-coconut-chicken');
  assert.deepEqual(kari.generation_liquid_ingredients, ['椰奶']);
  assert.match(kari.adaptation_note, /部分椰奶/);
  assert.match(kari.adaptation_note, /不得加水/);
});

test('validator bounds optional recipe time and adaptation metadata', () => {
  const invalid = structuredClone(lib);
  invalid.recipes[0].total_time_minutes = 0;
  invalid.recipes[1].total_time_minutes = 61;
  invalid.recipes[2].total_time_minutes = 30.5;
  invalid.recipes[3].adaptation_note = '   ';
  invalid.recipes[4].adaptation_note = '改'.repeat(401);
  invalid.recipes[5].adaptation_note = 42;
  const errors = validateRecipeLibrary(invalid);
  assert.ok(errors.includes(`${invalid.recipes[0].id} total_time_minutes must be an integer from 1 to 60`));
  assert.ok(errors.includes(`${invalid.recipes[1].id} total_time_minutes must be an integer from 1 to 60`));
  assert.ok(errors.includes(`${invalid.recipes[2].id} total_time_minutes must be an integer from 1 to 60`));
  assert.ok(errors.includes(`${invalid.recipes[3].id} adaptation_note must contain 1 to 400 characters`));
  assert.ok(errors.includes(`${invalid.recipes[4].id} adaptation_note must contain 1 to 400 characters`));
  assert.ok(errors.includes(`${invalid.recipes[5].id} adaptation_note must contain 1 to 400 characters`));
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

test('every seed carries explicit adaptation, cooking, safety, and source metadata', () => {
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
    assert.equal(source.license, 'CC BY-SA 4.0');
    assert.equal(source.attribution, `Wikibooks contributors, ${source.title}`);
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
    `${invalid.recipes[4].id} status must be approved`,
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

test('offline checker reports zero counts for malformed root containers without crashing', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'recipe-checker-'));
  const tempTools = path.join(tempRoot, 'tools');
  fs.mkdirSync(path.join(tempTools, 'lib'), { recursive: true });
  fs.mkdirSync(path.join(tempTools, 'data'), { recursive: true });
  fs.copyFileSync(new URL('../check-recipes.mjs', import.meta.url), path.join(tempTools, 'check-recipes.mjs'));
  fs.copyFileSync(new URL('../lib/recipe-library-validator.mjs', import.meta.url), path.join(tempTools, 'lib', 'recipe-library-validator.mjs'));
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

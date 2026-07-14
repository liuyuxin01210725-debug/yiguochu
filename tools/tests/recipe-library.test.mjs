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
  ['mung-bean-brown-rice-curry', 'family-rice-legume-pot', '绿豆糙米蔬菜咖喱锅', 'Cookbook:Mung Bean and Brown Rice Curry', 'https://en.wikibooks.org/wiki/Cookbook:Mung_Bean_and_Brown_Rice_Curry'],
  ['chicken-black-eyed-pea-stew', 'family-rice-legume-pot', '鸡肉黑眼豆番茄饭锅', 'Cookbook:Chicken and Black-eyed Pea Stew', 'https://en.wikibooks.org/wiki/Cookbook:Chicken_and_Black-eyed_Pea_Stew'],
  ['lentil-potato-tomato-curry', 'family-legume-vegetable-stew', '扁豆土豆番茄咖喱', 'Cookbook:Lentil, Potato, and Tomato Curry', 'https://en.wikibooks.org/wiki/Cookbook:Lentil,_Potato,_and_Tomato_Curry'],
  ['shakshuka-tomato-egg', 'family-tomato-egg-pot', '番茄甜椒炖蛋', 'Cookbook:Shakshuka I', 'https://en.wikibooks.org/wiki/Cookbook:Shakshuka_I'],
  ['texas-beef-chili', 'family-legume-vegetable-stew', '德州风味牛肉辣炖锅', 'Cookbook:Original Texas-Style Chili', 'https://en.wikibooks.org/wiki/Cookbook:Original_Texas-Style_Chili'],
  ['kari-ayam-coconut-chicken', 'family-coconut-curry', '印尼椰香鸡肉咖喱', 'Cookbook:Kari Ayam (Indonesian Chicken Curry)', 'https://en.wikibooks.org/wiki/Cookbook:Kari_Ayam_(Indonesian_Chicken_Curry)'],
  ['basic-risotto', 'family-risotto', '基础意式烩饭', 'Cookbook:Risotto (Basic)', 'https://en.wikibooks.org/wiki/Cookbook:Risotto_(Basic)'],
  ['rice-cabbage-minestrone', 'family-minestrone', '米粒卷心菜杂蔬汤', 'Cookbook:Rice and Cabbage Minestrone', 'https://en.wikibooks.org/wiki/Cookbook:Rice_and_Cabbage_Minestrone'],
];

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

test('canonical ingredient aliases stay stable for later selectors', () => {
  assert.deepEqual(lib.ingredient_aliases, {
    西红柿: '番茄',
    白米: '大米',
    鸡腿肉: '鸡肉',
    鸡胸肉: '鸡肉',
    青椒: '甜椒',
    椰浆: '椰奶',
  });
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

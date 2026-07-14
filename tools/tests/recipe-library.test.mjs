import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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
    `${invalid.recipes[7].id} source missing retrieved_at`,
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

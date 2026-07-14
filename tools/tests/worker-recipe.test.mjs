import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  canonicalRecipeIngredient,
  selectRecipeCandidates,
} from '../../worker/src/worker.js';

const lib = JSON.parse(fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'));

function fixtureRecipe(id, familyId, overrides = {}) {
  return {
    id,
    family_id: familyId,
    purposes: [],
    core_ingredients: [],
    optional_ingredients: [],
    substitution_slots: [],
    discouraged: [],
    ...overrides,
  };
}

function fixtureLib(recipes, aliases = {}) {
  return {
    ingredient_aliases: aliases,
    families: [...new Set(recipes.map(recipe => recipe.family_id))]
      .map(id => ({ id, name: id, form: '一锅' })),
    recipes,
  };
}

function scoreFor(recipeOverrides = {}, constraints = {}) {
  const recipe = fixtureRecipe('score-target', 'family-score', recipeOverrides);
  return selectRecipeCandidates(fixtureLib([recipe]), { dislikes: [], ...constraints })[0].score;
}

test('canonicalizer applies aliases after removing preference and cut-form noise', () => {
  assert.equal(canonicalRecipeIngredient(' 鸡腿肉（切丁）过敏 ', lib.ingredient_aliases), '鸡肉');
  assert.equal(canonicalRecipeIngredient('西红柿块忌口', lib.ingredient_aliases), '番茄');
});

test('canonicalizer follows alias chains so a terminal core dislike is excluded', () => {
  const aliases = { '鸡腿肉': '鸡肉', '鸡肉': '禽肉' };
  const recipes = [fixtureRecipe('poultry-pot', 'family-a', { core_ingredients: ['禽肉'] })];
  const hits = selectRecipeCandidates(fixtureLib(recipes, aliases), {
    pantry: ['鸡腿肉'],
    dislikes: ['鸡腿肉过敏'],
  });
  assert.equal(canonicalRecipeIngredient('鸡腿肉', aliases), '禽肉');
  assert.deepEqual(hits, []);
});

test('canonicalizer normalizes alias keys and values before resolving', () => {
  const aliases = { ' 鸡腿肉（切丁） ': ' 禽肉（鲜） ' };
  assert.equal(canonicalRecipeIngredient('鸡腿肉丁', aliases), '禽肉');
});

test('canonicalizer resolves alias cycles to one stable representative', () => {
  const aliases = { '甲': '乙', '乙': '甲' };
  const fromA = canonicalRecipeIngredient('甲', aliases);
  const fromB = canonicalRecipeIngredient('乙', aliases);
  assert.equal(fromA, fromB);
  assert.equal(canonicalRecipeIngredient('甲', aliases), fromA);
});

test('chicken rice onion raisins selects simple biryani', () => {
  const [hit] = selectRecipeCandidates(lib, {
    pantry: ['鸡腿肉', '大米', '洋葱', '葡萄干'],
    purpose: 'quick',
    dislikes: [],
  });
  assert.equal(hit.recipe.id, 'simple-chicken-biryani');
  assert.deepEqual(hit.usedPantry, ['鸡腿肉', '大米', '洋葱', '葡萄干']);
  assert.deepEqual(hit.unusedPantry, []);
});

test('lentil potato tomato selects the grounded lentil curry through an alias', () => {
  const [hit] = selectRecipeCandidates(lib, {
    pantry: ['红扁豆', '土豆', '西红柿'],
    purpose: 'pantry',
    dislikes: [],
  });
  assert.equal(hit.recipe.id, 'lentil-potato-tomato-curry');
});

test('disliked fixed core ingredient without a real replacement excludes a recipe', () => {
  const hits = selectRecipeCandidates(lib, {
    pantry: ['鸡蛋', '番茄', '甜椒'],
    purpose: 'quick',
    dislikes: ['鸡蛋过敏'],
  });
  assert.equal(hits.some(x => x.recipe.id === 'shakshuka-tomato-egg'), false);
});

test('a safe allowed slot can replace a disliked fixed core ingredient', () => {
  const hits = selectRecipeCandidates(lib, {
    pantry: ['椰浆', '红葱头', '鱼肉'],
    purpose: 'fresh',
    dislikes: ['鸡肉不吃'],
  });
  assert.equal(hits.some(x => x.recipe.id === 'kari-ayam-coconut-chicken'), true);
});

test('an allowed alias of the same disliked core is not a safe replacement', () => {
  const hits = selectRecipeCandidates(lib, {
    pantry: ['大米', '洋葱'],
    purpose: 'quick',
    dislikes: ['鸡肉过敏'],
  });
  assert.equal(hits.some(x => x.recipe.id === 'simple-chicken-biryani'), false);
});

test('scoring uses every specified weight exactly once per matching pantry item', () => {
  const recipes = [fixtureRecipe('weighted', 'family-a', {
    purposes: ['pantry'],
    core_ingredients: ['主料'],
    optional_ingredients: ['可选'],
    substitution_slots: [{ replaces: ['旧料'], allowed: ['替代'] }],
    discouraged: [{ ingredients: ['冲突'] }],
  })];
  const [hit] = selectRecipeCandidates(fixtureLib(recipes), {
    pantry: ['主料', '可选', '替代', '冲突', '无关'],
    purpose: 'pantry',
    dislikes: [],
    recent_families: ['family-a'],
    recent_base_recipes: ['weighted'],
  });
  assert.equal(hit.score, -103); // 12 + 5 + 5 - 8 + 3 - 20 - 100
  assert.deepEqual(hit.usedPantry, ['主料', '可选', '替代']);
  assert.deepEqual(hit.unusedPantry, ['冲突', '无关']);
});

test('fixed-core pantry hit contributes exactly +12', () => {
  const base = scoreFor({ core_ingredients: ['主料'] });
  const hit = scoreFor({ core_ingredients: ['主料'] }, { pantry: ['主料'] });
  assert.equal(hit - base, 12);
});

test('optional and allowed pantry hits each contribute exactly +5', () => {
  const base = scoreFor({
    optional_ingredients: ['可选'],
    substitution_slots: [{ replaces: ['旧料'], allowed: ['替代'] }],
  });
  const optional = scoreFor({
    optional_ingredients: ['可选'],
    substitution_slots: [{ replaces: ['旧料'], allowed: ['替代'] }],
  }, { pantry: ['可选'] });
  const allowed = scoreFor({
    optional_ingredients: ['可选'],
    substitution_slots: [{ replaces: ['旧料'], allowed: ['替代'] }],
  }, { pantry: ['替代'] });
  assert.equal(optional - base, 5);
  assert.equal(allowed - base, 5);
});

test('purpose match contributes exactly +3', () => {
  const base = scoreFor({ purposes: ['pantry'] }, { purpose: 'quick' });
  const hit = scoreFor({ purposes: ['pantry'] }, { purpose: 'pantry' });
  assert.equal(hit - base, 3);
});

test('discouraged pantry hit contributes exactly -8', () => {
  const recipe = { discouraged: [{ ingredients: ['冲突'] }] };
  const base = scoreFor(recipe);
  const hit = scoreFor(recipe, { pantry: ['冲突'] });
  assert.equal(hit - base, -8);
});

test('recent family contributes exactly -20', () => {
  const base = scoreFor();
  const hit = scoreFor({}, { recent_families: ['family-score'] });
  assert.equal(hit - base, -20);
});

test('recent base recipe contributes exactly -100', () => {
  const base = scoreFor();
  const hit = scoreFor({}, { recent_base_recipes: ['score-target'] });
  assert.equal(hit - base, -100);
});

test('a disliked optional pantry item stays unused without excluding the recipe', () => {
  const recipes = [fixtureRecipe('optional', 'family-a', {
    core_ingredients: ['主料'],
    optional_ingredients: ['花生'],
  })];
  const [hit] = selectRecipeCandidates(fixtureLib(recipes), {
    pantry: ['主料', '花生'],
    dislikes: ['花生过敏'],
  });
  assert.equal(hit.recipe.id, 'optional');
  assert.deepEqual(hit.usedPantry, ['主料']);
  assert.deepEqual(hit.unusedPantry, ['花生']);
});

test('recent family penalty changes the winner', () => {
  const recipes = [
    fixtureRecipe('alpha', 'family-a', { core_ingredients: ['大米', '番茄'] }),
    fixtureRecipe('beta', 'family-b', { core_ingredients: ['大米'] }),
  ];
  const [hit] = selectRecipeCandidates(fixtureLib(recipes), {
    pantry: ['大米', '番茄'],
    dislikes: [],
    recent_families: ['family-a'],
  });
  assert.equal(hit.recipe.id, 'beta');
});

test('recent base recipe penalty changes the winner', () => {
  const recipes = [
    fixtureRecipe('alpha', 'family-a', { core_ingredients: ['大米', '番茄'] }),
    fixtureRecipe('beta', 'family-b', { core_ingredients: ['大米'] }),
  ];
  const [hit] = selectRecipeCandidates(fixtureLib(recipes), {
    pantry: ['大米', '番茄'],
    dislikes: [],
    recent_base_recipes: ['alpha'],
  });
  assert.equal(hit.recipe.id, 'beta');
});

test('equal scores use recipe ID ascending as a stable tie-break', () => {
  const recipes = [
    fixtureRecipe('zulu', 'family-z'),
    fixtureRecipe('alpha', 'family-a'),
  ];
  const [hit] = selectRecipeCandidates(fixtureLib(recipes), { dislikes: [] });
  assert.equal(hit.recipe.id, 'alpha');
});

test('top three prefer distinct families before a higher-scored family duplicate', () => {
  const recipes = [
    fixtureRecipe('a-one', 'family-a', { core_ingredients: ['a', 'b', 'c'] }),
    fixtureRecipe('a-two', 'family-a', { core_ingredients: ['a', 'b'] }),
    fixtureRecipe('b-one', 'family-b', { core_ingredients: ['a'] }),
    fixtureRecipe('c-one', 'family-c'),
  ];
  const hits = selectRecipeCandidates(fixtureLib(recipes), {
    pantry: ['a', 'b', 'c'],
    dislikes: [],
  });
  assert.deepEqual(hits.map(hit => hit.recipe.id), ['a-one', 'b-one', 'c-one']);
});

test('top three fill from remaining candidates when fewer than three families exist', () => {
  const recipes = [
    fixtureRecipe('a-one', 'family-a', { core_ingredients: ['a', 'b'] }),
    fixtureRecipe('a-two', 'family-a', { core_ingredients: ['a'] }),
    fixtureRecipe('b-one', 'family-b'),
  ];
  const hits = selectRecipeCandidates(fixtureLib(recipes), {
    pantry: ['a', 'b'],
    dislikes: [],
  });
  assert.deepEqual(hits.map(hit => hit.recipe.id), ['a-one', 'b-one', 'a-two']);
});

test('top three never returns the same recipe ID twice across families', () => {
  const recipes = [
    fixtureRecipe('duplicate', 'family-a', { core_ingredients: ['a', 'b'] }),
    fixtureRecipe('duplicate', 'family-b', { core_ingredients: ['a'] }),
    fixtureRecipe('unique', 'family-c'),
  ];
  const hits = selectRecipeCandidates(fixtureLib(recipes), {
    pantry: ['a', 'b'],
    dislikes: [],
  });
  assert.deepEqual(hits.map(hit => hit.recipe.id), ['duplicate', 'unique']);
});

test('health cache is isolated per assets binding in one module instance', async () => {
  const { default: worker } = await import('../../worker/src/worker.js?health-binding-isolation');
  let okFetches = 0;
  let missingFetches = 0;
  const okEnv = {
    ASSETS: {
      async fetch() {
        okFetches++;
        return Response.json(lib);
      },
    },
  };
  const missingEnv = {
    ASSETS: {
      async fetch() {
        missingFetches++;
        return new Response('missing', { status: 404 });
      },
    },
  };
  const okResponse = await worker.fetch(new Request('https://example.test/health'), okEnv);
  const missingResponse = await worker.fetch(new Request('https://example.test/health'), missingEnv);
  const okBody = await okResponse.json();
  const missingBody = await missingResponse.json();
  assert.equal(okBody.recipeLibrary, 'ok');
  assert.equal(okBody.recipeFamilies, 9);
  assert.equal(okBody.baseRecipes, 12);
  assert.equal(missingBody.recipeLibrary, 'unavailable');
  assert.equal(missingBody.recipeFamilies, 0);
  assert.equal(missingBody.baseRecipes, 0);
  assert.equal(okFetches, 1);
  assert.equal(missingFetches, 1);
});

test('health reuses the recipe cache for the same assets binding', async () => {
  const { default: worker } = await import('../../worker/src/worker.js?health-binding-reuse');
  const requests = [];
  const assets = {
    async fetch(request) {
      requests.push(request.url);
      return Response.json(lib);
    },
  };
  const env = { ASSETS: assets };
  const first = await worker.fetch(new Request('https://one.example/health'), env);
  const second = await worker.fetch(new Request('https://two.example/health'), env);
  assert.equal((await first.json()).recipeLibrary, 'ok');
  assert.equal((await second.json()).recipeLibrary, 'ok');
  assert.deepEqual(requests, ['https://one.example/recipe-library.json']);
});

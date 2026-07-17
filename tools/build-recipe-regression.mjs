import fs from 'node:fs';
import {
  buildRecipeGrounding,
  canonicalRecipeIngredient,
  selectRecipeCandidates,
  validateGroundedMeal,
} from '../worker/src/worker.js';

const LIBRARY_URL = new URL('./data/recipe-library.json', import.meta.url);
const OUTPUT_URL = new URL('./data/recipe-regression.json', import.meta.url);
const PURPOSES = ['quick', 'pantry', 'fresh', 'batch'];
const SERVINGS = [1, 2, 4];
const REQUIRED_FIELDS = [
  'id',
  'purpose',
  'servings',
  'pantry',
  'dislikes',
  'expected_recipe_ids',
  'forbidden_recipe_ids',
];
const ALLOWED_DIETS = new Set(['omnivore', 'ovoLacto', 'vegan', 'glutenFree']);
const FROZEN_ORACLES = Object.freeze({
  'base-004-chinese-congee-fixed-core-dislike': Object.freeze({
    base_recipe_id: 'chinese-congee', disliked_fixed_core: '大米',
    expected_recipe_ids: Object.freeze(['lentil-potato-tomato-curry']),
    forbidden_recipe_ids: Object.freeze(['chinese-congee']),
  }),
  'base-008-simple-chicken-biryani-fixed-core-dislike': Object.freeze({
    base_recipe_id: 'simple-chicken-biryani', disliked_fixed_core: '大米',
    expected_recipe_ids: Object.freeze(['lentil-potato-tomato-curry']),
    forbidden_recipe_ids: Object.freeze(['simple-chicken-biryani']),
  }),
  'base-012-jollof-rice-fixed-core-dislike': Object.freeze({
    base_recipe_id: 'jollof-rice', disliked_fixed_core: '大米',
    expected_recipe_ids: Object.freeze(['lentil-potato-tomato-curry']),
    forbidden_recipe_ids: Object.freeze(['jollof-rice']),
  }),
  'base-016-creole-jambalaya-fixed-core-dislike': Object.freeze({
    base_recipe_id: 'creole-jambalaya', disliked_fixed_core: '大米',
    expected_recipe_ids: Object.freeze(['lentil-potato-tomato-curry']),
    forbidden_recipe_ids: Object.freeze(['creole-jambalaya']),
  }),
  'base-020-soy-lentil-vegetable-stew-fixed-core-dislike': Object.freeze({
    base_recipe_id: 'soy-lentil-vegetable-stew', disliked_fixed_core: '红扁豆',
    expected_recipe_ids: Object.freeze(['chinese-congee']),
    forbidden_recipe_ids: Object.freeze(['soy-lentil-vegetable-stew']),
  }),
  'base-024-chicken-black-eyed-pea-stew-fixed-core-dislike': Object.freeze({
    base_recipe_id: 'chicken-black-eyed-pea-stew', disliked_fixed_core: '黑眼豆',
    expected_recipe_ids: Object.freeze(['creole-jambalaya']),
    forbidden_recipe_ids: Object.freeze(['chicken-black-eyed-pea-stew']),
  }),
  'base-028-lentil-potato-tomato-curry-fixed-core-dislike': Object.freeze({
    base_recipe_id: 'lentil-potato-tomato-curry', disliked_fixed_core: '红扁豆',
    expected_recipe_ids: Object.freeze(['chicken-black-eyed-pea-stew']),
    forbidden_recipe_ids: Object.freeze(['lentil-potato-tomato-curry']),
  }),
  'base-032-shakshuka-tomato-egg-fixed-core-dislike': Object.freeze({
    base_recipe_id: 'shakshuka-tomato-egg', disliked_fixed_core: '鸡蛋',
    expected_recipe_ids: Object.freeze(['jollof-rice']),
    forbidden_recipe_ids: Object.freeze(['shakshuka-tomato-egg']),
  }),
  'base-036-texas-beef-chili-fixed-core-dislike': Object.freeze({
    base_recipe_id: 'texas-beef-chili', disliked_fixed_core: '辣椒',
    expected_recipe_ids: Object.freeze(['chicken-black-eyed-pea-stew']),
    forbidden_recipe_ids: Object.freeze(['texas-beef-chili']),
  }),
  'base-040-kari-ayam-coconut-chicken-fixed-core-dislike': Object.freeze({
    base_recipe_id: 'kari-ayam-coconut-chicken', disliked_fixed_core: '椰奶',
    expected_recipe_ids: Object.freeze(['chicken-black-eyed-pea-stew']),
    forbidden_recipe_ids: Object.freeze(['kari-ayam-coconut-chicken']),
  }),
  'base-044-basic-risotto-fixed-core-dislike': Object.freeze({
    base_recipe_id: 'basic-risotto', disliked_fixed_core: '洋葱',
    expected_recipe_ids: Object.freeze(['rice-cabbage-minestrone']),
    forbidden_recipe_ids: Object.freeze(['basic-risotto']),
  }),
  'base-048-rice-cabbage-minestrone-fixed-core-dislike': Object.freeze({
    base_recipe_id: 'rice-cabbage-minestrone', disliked_fixed_core: '大米',
    expected_recipe_ids: Object.freeze(['lentil-potato-tomato-curry']),
    forbidden_recipe_ids: Object.freeze(['rice-cabbage-minestrone']),
  }),
  'adversarial-019-repeated-swap-a': Object.freeze({
    base_recipe_id: 'simple-chicken-biryani',
    expected_recipe_ids: Object.freeze(['chicken-black-eyed-pea-stew']),
    forbidden_recipe_ids: Object.freeze(['simple-chicken-biryani']),
  }),
  'adversarial-020-repeated-swap-b': Object.freeze({
    base_recipe_id: 'lentil-potato-tomato-curry',
    expected_recipe_ids: Object.freeze(['creole-jambalaya']),
    forbidden_recipe_ids: Object.freeze(['lentil-potato-tomato-curry']),
  }),
});
const usedFrozenOracleIds = new Set();

const library = JSON.parse(fs.readFileSync(LIBRARY_URL, 'utf8'));
const recipeById = new Map(library.recipes.map(recipe => [recipe.id, recipe]));

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(items) {
  return [...new Set(items)];
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function recipe(id) {
  const value = recipeById.get(id);
  invariant(value, `unknown recipe: ${id}`);
  return value;
}

function constraintsFor(testCase) {
  return {
    purpose: testCase.purpose,
    servings: testCase.servings,
    pantry: testCase.pantry,
    dislikes: testCase.dislikes,
    ...(testCase.diet ? { diet: testCase.diet } : {}),
    ...(testCase.recent_families ? { recent_families: testCase.recent_families } : {}),
    ...(testCase.recent_base_recipes ? { recent_base_recipes: testCase.recent_base_recipes } : {}),
  };
}

function matchesFlag(flags, expected) {
  return flags.includes(expected);
}

function select(testCase) {
  return selectRecipeCandidates(library, constraintsFor(testCase));
}

function canonical(name) {
  return canonicalRecipeIngredient(name, library.ingredient_aliases);
}

function frozenOracle(caseId, baseRecipeId) {
  const oracle = FROZEN_ORACLES[caseId];
  invariant(oracle, `${caseId} missing frozen oracle`);
  invariant(oracle.base_recipe_id === baseRecipeId, `${caseId} frozen base recipe drift`);
  usedFrozenOracleIds.add(caseId);
  return oracle;
}

function assertFrozenOracle(caseId, candidates, oracle) {
  const actualIds = candidates.map(candidate => candidate.recipe.id);
  invariant(actualIds.length > 0, `${caseId} frozen oracle has no candidates`);
  invariant(
    actualIds[0] === oracle.expected_recipe_ids[0],
    `${caseId} frozen oracle drift: expected first ${oracle.expected_recipe_ids[0]}, got ${actualIds.join(',')}`,
  );
  invariant(
    oracle.expected_recipe_ids.every(id => actualIds.includes(id)),
    `${caseId} frozen expected missing: ${oracle.expected_recipe_ids.join(',')}; got ${actualIds.join(',')}`,
  );
  invariant(
    oracle.forbidden_recipe_ids.every(id => !actualIds.includes(id)),
    `${caseId} frozen forbidden returned: ${actualIds.join(',')}`,
  );
}

function aliasVariant(coreIngredients) {
  const aliases = Object.entries(library.ingredient_aliases)
    .sort(([left], [right]) => compareText(left, right));
  let changed = false;
  const pantry = coreIngredients.map((name, index) => {
    const alias = aliases.find(([candidate]) => (
      canonical(candidate) === canonical(name) && canonical(candidate) !== String(candidate).trim().toLowerCase()
    ));
    if (alias) {
      changed = true;
      return alias[0];
    }
    if (!changed && index === coreIngredients.length - 1) {
      changed = true;
      return `${name}（家中现有）`;
    }
    return name;
  });
  invariant(changed, `could not make an alias variant for ${coreIngredients.join(',')}`);
  return pantry;
}

function findDiscouragedPantry(baseRecipe, purpose, servings) {
  const discouraged = baseRecipe.discouraged.flatMap(rule => rule.ingredients);
  for (const item of discouraged) {
    const pantry = [...baseRecipe.core_ingredients, item];
    const candidates = select({ purpose, servings, pantry, dislikes: [] });
    if (candidates.some(candidate => candidate.recipe.id === baseRecipe.id)) return pantry;
  }
  throw new Error(`${baseRecipe.id} has no discouraged pantry case that preserves the base recipe`);
}

function baseCase(baseRecipe, recipeIndex, variantIndex, variant, overrides) {
  return {
    id: `base-${String(recipeIndex * 4 + variantIndex + 1).padStart(3, '0')}-${baseRecipe.id}-${variant}`,
    purpose: baseRecipe.purposes[variantIndex % baseRecipe.purposes.length],
    servings: SERVINGS[(recipeIndex + variantIndex) % SERVINGS.length],
    pantry: [...baseRecipe.core_ingredients],
    dislikes: [],
    expected_recipe_ids: [baseRecipe.id],
    forbidden_recipe_ids: [],
    case_group: 'base',
    base_variant: variant,
    base_recipe_id: baseRecipe.id,
    family_id: baseRecipe.family_id,
    ...overrides,
  };
}

function buildBaseCases() {
  const cases = [];
  for (const [recipeIndex, baseRecipe] of library.recipes.entries()) {
    cases.push(baseCase(baseRecipe, recipeIndex, 0, 'exact-core', {}));
    cases.push(baseCase(baseRecipe, recipeIndex, 1, 'alias-variant', {
      pantry: aliasVariant(baseRecipe.core_ingredients),
    }));
    const discouragedSeed = baseCase(baseRecipe, recipeIndex, 2, 'discouraged-pantry', {});
    cases.push({
      ...discouragedSeed,
      pantry: findDiscouragedPantry(baseRecipe, discouragedSeed.purpose, discouragedSeed.servings),
    });

    const seed = baseCase(baseRecipe, recipeIndex, 3, 'fixed-core-dislike', {});
    const oracle = frozenOracle(seed.id, baseRecipe.id);
    invariant(baseRecipe.core_ingredients.includes(oracle.disliked_fixed_core), `${seed.id} frozen disliked core is not a core ingredient`);
    const testCase = {
      ...seed,
      pantry: baseRecipe.core_ingredients.filter(item => item !== oracle.disliked_fixed_core),
      dislikes: [`${oracle.disliked_fixed_core}过敏`],
      expected_recipe_ids: [...oracle.expected_recipe_ids],
      forbidden_recipe_ids: [...oracle.forbidden_recipe_ids],
      disliked_fixed_core: oracle.disliked_fixed_core,
    };
    assertFrozenOracle(seed.id, select(testCase), oracle);
    cases.push(testCase);
  }
  return cases;
}

function allCookedFixture(names, extraSteps = []) {
  const ingredients = unique(names);
  return {
    dish_name: '回归闸门对抗菜例',
    ingredients: ingredients.map(name => ({ name, grams: 100 })),
    steps: [
      ...ingredients.map(name => `${name}煮熟。`),
      ...extraSteps,
    ],
  };
}

function ordinaryAdversarial({
  number,
  kind,
  suffix,
  baseRecipeId,
  purpose,
  servings,
  pantry,
  dislikes = [],
  diet,
  mealFixture,
  expectedFlags,
  forbiddenFlags,
  expectedGroundingTokens = [],
  expectedDiscouraged,
  knownGap,
  manualReviewRequired = [],
}) {
  const baseRecipe = recipe(baseRecipeId);
  const testCase = {
    id: `adversarial-${String(number).padStart(3, '0')}-${kind.replaceAll('_', '-')}-${suffix}`,
    purpose,
    servings,
    pantry,
    dislikes,
    expected_recipe_ids: [baseRecipe.id],
    forbidden_recipe_ids: [],
    case_group: 'adversarial',
    adversarial_kind: kind,
    base_recipe_id: baseRecipe.id,
    family_id: baseRecipe.family_id,
    validation_recipe_id: baseRecipe.id,
    meal_fixture: mealFixture,
    expected_validation_flags: expectedFlags,
    forbidden_validation_flags: forbiddenFlags,
    ...(expectedGroundingTokens.length ? { expected_grounding_tokens: expectedGroundingTokens } : {}),
    ...(expectedDiscouraged ? { expected_discouraged: expectedDiscouraged } : {}),
    ...(knownGap ? { known_gap: knownGap } : {}),
    ...(manualReviewRequired.length ? { manual_review_required: manualReviewRequired } : {}),
    ...(diet ? { diet } : {}),
  };
  const validationSelection = select(testCase).find(item => item.recipe.id === baseRecipe.id);
  invariant(validationSelection, `${testCase.id} does not select ${baseRecipe.id}`);
  const actualFlags = validateGroundedMeal(mealFixture, validationSelection, constraintsFor(testCase));
  for (const flag of expectedFlags) {
    invariant(matchesFlag(actualFlags, flag), `${testCase.id} fixture missing ${flag}; got ${actualFlags.join(', ')}`);
  }
  for (const flag of forbiddenFlags) {
    invariant(!matchesFlag(actualFlags, flag), `${testCase.id} fixture unexpectedly has ${flag}`);
  }
  const grounding = buildRecipeGrounding(validationSelection);
  for (const token of expectedGroundingTokens) {
    invariant(grounding.includes(token), `${testCase.id} grounding missing ${token}`);
  }
  if (expectedDiscouraged) {
    const rule = (validationSelection.recipe.discouraged || []).find(item => (
      item.reason_type === expectedDiscouraged.reason_type
      && (item.ingredients || []).includes(expectedDiscouraged.ingredient)
      && item.reason === expectedDiscouraged.reason
    ));
    invariant(rule, `${testCase.id} missing frozen discouraged rule`);
    invariant(validationSelection.unusedPantry.includes(expectedDiscouraged.ingredient), `${testCase.id} discouraged ingredient is not unused pantry`);
    const fixtureNames = testCase.meal_fixture.ingredients.map(item => String(item?.name || item || '').trim());
    invariant(fixtureNames.includes(expectedDiscouraged.ingredient), `${testCase.id} fixture does not use its discouraged ingredient`);
    invariant(expectedFlags.includes(`unused_pantry_used:${expectedDiscouraged.ingredient}`), `${testCase.id} does not expect the discouraged-use flag`);
  }
  return testCase;
}

function repeatedSwapAdversarial(number, suffix, baseRecipeId, purpose, servings) {
  const repeated = recipe(baseRecipeId);
  const caseId = `adversarial-${String(number).padStart(3, '0')}-repeated-swap-${suffix}`;
  const oracle = frozenOracle(caseId, baseRecipeId);
  const seed = {
    purpose,
    servings,
    pantry: [...repeated.core_ingredients],
    dislikes: [],
    recent_base_recipes: [repeated.id],
  };
  const candidates = select(seed);
  assertFrozenOracle(caseId, candidates, oracle);
  const replacement = candidates.find(candidate => candidate.recipe.id === oracle.expected_recipe_ids[0]);
  invariant(replacement, `${caseId} frozen validation recipe is unavailable`);
  const fixtureNames = unique([
    ...replacement.recipe.core_ingredients,
    ...replacement.usedPantry,
  ]);
  const mealFixture = allCookedFixture(fixtureNames, ['另起一锅烧开清水。']);
  const testCase = {
    id: caseId,
    ...seed,
    expected_recipe_ids: [...oracle.expected_recipe_ids],
    forbidden_recipe_ids: [...oracle.forbidden_recipe_ids],
    case_group: 'adversarial',
    adversarial_kind: 'repeated_swap',
    base_recipe_id: repeated.id,
    family_id: replacement.recipe.family_id,
    validation_recipe_id: replacement.recipe.id,
    meal_fixture: mealFixture,
    expected_validation_flags: ['multi_pot_step'],
    forbidden_validation_flags: ['base_recipe_anchor_missing'],
  };
  const actualFlags = validateGroundedMeal(mealFixture, replacement, constraintsFor(testCase));
  invariant(actualFlags.includes('multi_pot_step'), `${testCase.id} fixture missing multi_pot_step`);
  invariant(!actualFlags.includes('base_recipe_anchor_missing'), `${testCase.id} fixture lost replacement anchors`);
  return testCase;
}

function buildAdversarialCases() {
  const cases = [];
  let number = 1;
  const add = value => {
    cases.push(value);
    number += 1;
  };

  add(ordinaryAdversarial({
    number, kind: 'shrimp_not_cooked', suffix: 'a', baseRecipeId: 'kari-ayam-coconut-chicken',
    purpose: 'fresh', servings: 1, pantry: ['虾仁', '椰奶', '红葱头'],
    mealFixture: {
      dish_name: '未熟虾仁椰奶锅',
      ingredients: ['虾仁', '椰奶', '红葱头'].map(name => ({ name, grams: 100 })),
      steps: ['虾仁洗净备用。', '椰奶和红葱头煮熟，出锅后加入虾仁。'],
    },
    expectedFlags: ['high_risk_not_cooked:虾仁'],
    forbiddenFlags: ['ingredient_missing_in_steps:虾仁', 'multi_pot_step'],
  }));
  add(ordinaryAdversarial({
    number, kind: 'shrimp_not_cooked', suffix: 'b', baseRecipeId: 'chinese-congee',
    purpose: 'quick', servings: 2, pantry: ['大米', '水', '虾仁'],
    mealFixture: {
      dish_name: '关火加虾粥',
      ingredients: ['大米', '水', '虾仁'].map(name => ({ name, grams: 100 })),
      steps: ['大米和水煮熟。', '虾仁放一旁，关火后最后拌入。'],
    },
    expectedFlags: ['high_risk_not_cooked:虾仁', 'unused_pantry_used:虾仁'],
    forbiddenFlags: ['ingredient_missing_in_steps:虾仁', 'multi_pot_step'],
  }));

  add(ordinaryAdversarial({
    number, kind: 'raw_poultry', suffix: 'a', baseRecipeId: 'simple-chicken-biryani',
    purpose: 'quick', servings: 4, pantry: ['大米', '鸡肉', '洋葱'],
    mealFixture: {
      dish_name: '未熟鸡肉焖饭',
      ingredients: ['大米', '鸡肉', '洋葱'].map(name => ({ name, grams: 100 })),
      steps: ['鸡肉切块备用。', '大米和洋葱煮熟，出锅后加入鸡肉。'],
    },
    expectedFlags: ['high_risk_not_cooked:鸡肉'],
    forbiddenFlags: ['ingredient_missing_in_steps:鸡肉', 'multi_pot_step'],
  }));
  add(ordinaryAdversarial({
    number, kind: 'raw_poultry', suffix: 'b', baseRecipeId: 'creole-jambalaya',
    purpose: 'batch', servings: 1, pantry: ['大米', '番茄', '火鸡肉', '芹菜'],
    mealFixture: {
      dish_name: '未熟火鸡什锦饭',
      ingredients: ['大米', '番茄', '火鸡肉', '芹菜'].map(name => ({ name, grams: 100 })),
      steps: ['火鸡肉备用。', '大米、番茄和芹菜煮熟，装盘后加入火鸡肉。'],
    },
    expectedFlags: ['high_risk_not_cooked:火鸡肉'],
    forbiddenFlags: ['ingredient_missing_in_steps:火鸡肉', 'multi_pot_step'],
  }));

  for (const [suffix, baseRecipeId, purpose, servings] of [
    ['a', 'chinese-congee', 'pantry', 2],
    ['b', 'jollof-rice', 'fresh', 4],
  ]) {
    const baseRecipe = recipe(baseRecipeId);
    add(ordinaryAdversarial({
      number, kind: 'egg_allergy', suffix, baseRecipeId, purpose, servings,
      pantry: [...baseRecipe.core_ingredients, '鸡蛋'], dislikes: ['鸡蛋过敏'],
      mealFixture: allCookedFixture([...baseRecipe.core_ingredients, '鸡蛋']),
      expectedFlags: ['allergen_present:鸡蛋'],
      forbiddenFlags: ['high_risk_not_cooked:鸡蛋', 'ingredient_missing_in_steps:鸡蛋'],
    }));
  }

  for (const [suffix, baseRecipeId, purpose, servings] of [
    ['a', 'lentil-potato-tomato-curry', 'pantry', 1],
    ['b', 'rice-cabbage-minestrone', 'quick', 2],
  ]) {
    const baseRecipe = recipe(baseRecipeId);
    add(ordinaryAdversarial({
      number, kind: 'peanut_allergy', suffix, baseRecipeId, purpose, servings,
      pantry: [...baseRecipe.core_ingredients, '花生'], dislikes: ['花生过敏'],
      mealFixture: allCookedFixture([...baseRecipe.core_ingredients, '花生']),
      expectedFlags: ['allergen_present:花生'],
      forbiddenFlags: ['ingredient_missing_in_steps:花生', 'multi_pot_step'],
    }));
  }

  for (const [suffix, baseRecipeId, purpose, servings] of [
    ['a', 'rice-cabbage-minestrone', 'pantry', 4],
    ['b', 'simple-chicken-biryani', 'fresh', 1],
  ]) {
    const baseRecipe = recipe(baseRecipeId);
    add(ordinaryAdversarial({
      number, kind: 'gluten_free_noodles', suffix, baseRecipeId, purpose, servings,
      pantry: [...baseRecipe.core_ingredients, '面条'], diet: 'glutenFree',
      mealFixture: allCookedFixture([...baseRecipe.core_ingredients, '面条']),
      expectedFlags: ['unused_pantry_used:面条'],
      forbiddenFlags: ['allergen_present:面条', 'ingredient_missing_in_steps:面条', 'multi_pot_step'],
      expectedGroundingTokens: ['舍弃库存', '面条'],
      knownGap: {
        code: 'diet_constraint_not_validated',
        scope: 'glutenFree',
        note: 'Worker selector/validator has no deterministic gluten-free violation flag; this fixture only proves unused-pantry grounding.',
      },
      manualReviewRequired: ['diet_compliance'],
    }));
  }

  for (const [suffix, baseRecipeId, animal, purpose, servings] of [
    ['a', 'lentil-potato-tomato-curry', '鸡肉', 'fresh', 2],
    ['b', 'soy-lentil-vegetable-stew', '牛肉', 'batch', 4],
  ]) {
    const baseRecipe = recipe(baseRecipeId);
    add(ordinaryAdversarial({
      number, kind: 'vegan_restrictions', suffix, baseRecipeId, purpose, servings,
      pantry: [...baseRecipe.core_ingredients, animal], diet: 'vegan',
      mealFixture: allCookedFixture([...baseRecipe.core_ingredients, animal]),
      expectedFlags: [`unused_pantry_used:${animal}`],
      forbiddenFlags: [`allergen_present:${animal}`, `high_risk_not_cooked:${animal}`, `ingredient_missing_in_steps:${animal}`],
      expectedGroundingTokens: ['舍弃库存', animal],
      knownGap: {
        code: 'diet_constraint_not_validated',
        scope: 'vegan',
        note: 'Worker selector/validator has no deterministic vegan violation flag; this fixture only proves unused-pantry grounding.',
      },
      manualReviewRequired: ['diet_compliance'],
    }));
  }

  for (const [suffix, baseRecipeId, leaf, reason, purpose, servings] of [
    ['a', 'simple-chicken-biryani', '大量叶菜', '额外出水会破坏焖饭的吸水比例。', 'quick', 1],
    ['b', 'shakshuka-tomato-egg', '大量高含水叶菜', '额外水分会让番茄酱底过稀，鸡蛋难以定型。', 'fresh', 2],
  ]) {
    const baseRecipe = recipe(baseRecipeId);
    add(ordinaryAdversarial({
      number, kind: 'leaf_vegetable_water_release', suffix, baseRecipeId, purpose, servings,
      pantry: [...baseRecipe.core_ingredients, leaf],
      mealFixture: allCookedFixture([...baseRecipe.core_ingredients, leaf]),
      expectedFlags: [`unused_pantry_used:${leaf}`],
      forbiddenFlags: [`ingredient_missing_in_steps:${leaf}`, 'multi_pot_step'],
      expectedGroundingTokens: [leaf, reason],
      expectedDiscouraged: { ingredient: leaf, reason_type: 'texture_water', reason },
    }));
  }

  add(ordinaryAdversarial({
    number, kind: 'rice_water_mismatch', suffix: 'a', baseRecipeId: 'chinese-congee',
    purpose: 'batch', servings: 4, pantry: ['大米', '水'],
    mealFixture: allCookedFixture(['大米']),
    expectedFlags: ['used_pantry_missing:水', 'base_recipe_anchor_missing'],
    forbiddenFlags: ['multi_pot_step'],
    expectedGroundingTokens: ['比例规则', '1:11'],
    knownGap: {
      code: 'numeric_ratio_not_validated',
      scope: 'rice_water_ratio',
      note: 'Grounding carries the ratio rule, but arbitrary ingredient gram ratios still require human review.',
    },
    manualReviewRequired: ['numeric_ratio'],
  }));
  add(ordinaryAdversarial({
    number, kind: 'rice_water_mismatch', suffix: 'b', baseRecipeId: 'jollof-rice',
    purpose: 'pantry', servings: 1, pantry: ['大米', '番茄', '甜椒', '洋葱'],
    mealFixture: allCookedFixture(['番茄', '甜椒', '洋葱']),
    expectedFlags: ['used_pantry_missing:大米'],
    forbiddenFlags: ['multi_pot_step'],
    expectedGroundingTokens: ['比例规则', '1:1'],
    knownGap: {
      code: 'numeric_ratio_not_validated',
      scope: 'rice_water_ratio',
      note: 'Grounding carries the ratio rule, but arbitrary ingredient gram ratios still require human review.',
    },
    manualReviewRequired: ['numeric_ratio'],
  }));

  for (const [suffix, baseRecipeId, extra, purpose, servings] of [
    ['a', 'jollof-rice', '黄瓜', 'fresh', 2],
    ['b', 'basic-risotto', '未焯水的大块土豆', 'pantry', 4],
  ]) {
    const baseRecipe = recipe(baseRecipeId);
    add(ordinaryAdversarial({
      number, kind: 'forced_all_pantry_use', suffix, baseRecipeId, purpose, servings,
      pantry: [...baseRecipe.core_ingredients, extra],
      mealFixture: allCookedFixture([...baseRecipe.core_ingredients, extra]),
      expectedFlags: [`unused_pantry_used:${extra}`],
      forbiddenFlags: [`ingredient_missing_in_steps:${extra}`, 'multi_pot_step'],
    }));
  }

  add(repeatedSwapAdversarial(number, 'a', 'simple-chicken-biryani', 'quick', 1));
  add(repeatedSwapAdversarial(number, 'b', 'lentil-potato-tomato-curry', 'batch', 2));

  invariant(number === 21, `adversarial numbering ended at ${number}`);
  return cases;
}

function buildCycleCases() {
  return Array.from({ length: 32 }, (_, index) => {
    const baseRecipe = library.recipes[index % library.recipes.length];
    const purpose = PURPOSES[index % PURPOSES.length];
    const servings = SERVINGS[index % SERVINGS.length];
    return {
      id: `cycle-${String(index + 1).padStart(3, '0')}-${baseRecipe.id}-${purpose}-${servings}`,
      purpose,
      servings,
      pantry: [...baseRecipe.core_ingredients],
      dislikes: [],
      expected_recipe_ids: [baseRecipe.id],
      forbidden_recipe_ids: [],
      case_group: 'cycle',
      base_recipe_id: baseRecipe.id,
      family_id: baseRecipe.family_id,
    };
  });
}

function assertCorpus(cases) {
  invariant(cases.length === 100, `expected 100 cases, got ${cases.length}`);
  invariant(new Set(cases.map(testCase => testCase.id)).size === 100, 'case IDs must be unique');
  invariant(cases.every((testCase, index) => index === 0 || cases[index - 1].id < testCase.id), 'cases must be sorted by ID');
  invariant(cases.filter(testCase => testCase.case_group === 'base').length === 48, 'expected 48 base cases');
  invariant(cases.filter(testCase => testCase.case_group === 'adversarial').length === 20, 'expected 20 adversarial cases');
  invariant(cases.filter(testCase => testCase.case_group === 'cycle').length === 32, 'expected 32 cycle cases');

  for (const testCase of cases) {
    for (const field of REQUIRED_FIELDS) invariant(Object.hasOwn(testCase, field), `${testCase.id} missing ${field}`);
    invariant(PURPOSES.includes(testCase.purpose), `${testCase.id} has invalid purpose`);
    invariant(SERVINGS.includes(testCase.servings), `${testCase.id} has invalid servings`);
    invariant(!testCase.diet || ALLOWED_DIETS.has(testCase.diet), `${testCase.id} has invalid diet`);
    for (const field of ['pantry', 'dislikes', 'expected_recipe_ids', 'forbidden_recipe_ids']) {
      invariant(Array.isArray(testCase[field]) && testCase[field].every(item => typeof item === 'string' && item), `${testCase.id} has invalid ${field}`);
    }
    invariant(testCase.expected_recipe_ids.length > 0, `${testCase.id} must have an expected recipe`);
    const candidates = select(testCase);
    const candidateIds = candidates.map(item => item.recipe.id);
    invariant(candidateIds.length > 0, `${testCase.id} has no candidates`);
    invariant(testCase.expected_recipe_ids.some(id => candidateIds.includes(id)), `${testCase.id} expected ${testCase.expected_recipe_ids.join(',')} but got ${candidateIds.join(',')}`);
    invariant(!testCase.forbidden_recipe_ids.some(id => candidateIds.includes(id)), `${testCase.id} returned forbidden ${candidateIds.join(',')}`);
    if (testCase.known_gap) {
      invariant(typeof testCase.known_gap.code === 'string' && testCase.known_gap.code, `${testCase.id} has invalid known_gap.code`);
      invariant(typeof testCase.known_gap.scope === 'string' && testCase.known_gap.scope, `${testCase.id} has invalid known_gap.scope`);
      invariant(typeof testCase.known_gap.note === 'string' && testCase.known_gap.note, `${testCase.id} has invalid known_gap.note`);
      invariant(Array.isArray(testCase.manual_review_required) && testCase.manual_review_required.length > 0, `${testCase.id} known gap needs manual review`);
    }
  }

  for (const baseRecipe of library.recipes) {
    const ownCases = cases.filter(testCase => testCase.case_group === 'base' && testCase.base_recipe_id === baseRecipe.id);
    invariant(ownCases.length === 4, `${baseRecipe.id} must have four base cases`);
    invariant(new Set(ownCases.map(testCase => testCase.base_variant)).size === 4, `${baseRecipe.id} base variants must be unique`);
  }

  const adversarialKinds = cases
    .filter(testCase => testCase.case_group === 'adversarial')
    .map(testCase => testCase.adversarial_kind);
  const expectedKinds = [
    'shrimp_not_cooked', 'raw_poultry', 'egg_allergy', 'peanut_allergy',
    'gluten_free_noodles', 'vegan_restrictions', 'leaf_vegetable_water_release',
    'rice_water_mismatch', 'forced_all_pantry_use', 'repeated_swap',
  ];
  for (const kind of expectedKinds) {
    invariant(adversarialKinds.filter(value => value === kind).length === 2, `${kind} must have two cases`);
  }

  const dietGapCases = cases.filter(testCase => ['gluten_free_noodles', 'vegan_restrictions'].includes(testCase.adversarial_kind));
  invariant(dietGapCases.length === 4, 'expected four diet known-gap cases');
  for (const testCase of dietGapCases) {
    invariant(testCase.known_gap?.code === 'diet_constraint_not_validated', `${testCase.id} missing diet known gap`);
    invariant(testCase.manual_review_required.includes('diet_compliance'), `${testCase.id} missing diet manual review`);
    invariant(!testCase.expected_validation_flags.some(flag => flag.startsWith('allergen_present:')), `${testCase.id} must not claim allergen flag as diet coverage`);
  }
  const ratioGapCases = cases.filter(testCase => testCase.adversarial_kind === 'rice_water_mismatch');
  for (const testCase of ratioGapCases) {
    invariant(testCase.known_gap?.code === 'numeric_ratio_not_validated', `${testCase.id} missing numeric ratio known gap`);
    invariant(testCase.manual_review_required.includes('numeric_ratio'), `${testCase.id} missing numeric ratio manual review`);
  }

  const frozenIds = Object.keys(FROZEN_ORACLES);
  invariant(frozenIds.length === 14, `expected 14 frozen oracles, got ${frozenIds.length}`);
  invariant(frozenIds.every(id => usedFrozenOracleIds.has(id)), 'every frozen oracle must be consumed');
  invariant(usedFrozenOracleIds.size === frozenIds.length, 'builder consumed an unexpected frozen oracle');

  const representedFamilies = new Set(cases.map(testCase => testCase.family_id));
  invariant(library.families.every(family => representedFamilies.has(family.id)), 'all nine families must be represented');
}

const cases = [
  ...buildBaseCases(),
  ...buildAdversarialCases(),
  ...buildCycleCases(),
].sort((left, right) => compareText(left.id, right.id));

assertCorpus(cases);
fs.writeFileSync(OUTPUT_URL, `${JSON.stringify(cases, null, 2)}\n`, 'utf8');
console.log('recipe-regression.json: 100 cases');

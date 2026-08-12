const CANONICAL_BASE = 'https://yiguochu.pages.dev/recipes.html?id=';
const IDENTITY_PLACEHOLDER = /经核验|身份不明|未知野菜|地方植物/u;

const GROUP_IDS = [
  ['leftover-rice-egg', [
    'home-egg-fried-leftover-rice',
    'tomato-egg-stewed-leftover-rice',
    'greens-egg-braised-leftover-rice',
    'mushroom-egg-covered-leftover-rice',
    'shrimp-egg-fried-leftover-rice',
  ]],
  ['broccoli-beef', [
    'broccoli-beef-fried-rice',
    'broccoli-beef-braised-rice',
    'tomato-broccoli-beef-stewed-rice',
    'broccoli-beef-soup-noodles',
    'potato-broccoli-beef-covered-rice',
  ]],
  ['tofu-greens', [
    'greens-tofu-fried-rice',
    'cabbage-tofu-braised-rice',
    'tomato-tofu-stewed-rice',
    'greens-tofu-soup-noodles',
    'mushroom-greens-tofu-covered-rice',
  ]],
  ['chicken-leg-vegetables', [
    'chicken-leg-potato-braised-rice',
    'chicken-leg-mushroom-stewed-rice',
    'tomato-chicken-leg-soup-rice',
    'corn-carrot-chicken-leg-covered-rice',
    'cabbage-potato-chicken-leg-braised-noodles',
  ]],
  ['household-leafy-greens', [
    'greens-sausage-fried-rice',
    'greens-minced-pork-braised-rice',
    'cabbage-egg-soup-rice',
    'greens-tofu-vermicelli-pot',
    'greens-chicken-leg-soup-noodles',
  ]],
  ['potato-green-bean-ribs', [
    'green-bean-pork-rib-braised-rice',
    'potato-pork-rib-stewed-rice',
    'tomato-potato-pork-rib-covered-rice',
    'mushroom-green-bean-pork-rib-braised-rice',
    'cabbage-potato-pork-rib-soup-rice',
  ]],
];

const FAMILY_BY_RECIPE = new Map([
  ['home-egg-fried-leftover-rice', 'family-home-fried-rice'],
  ['tomato-egg-stewed-leftover-rice', 'family-home-stewed-rice'],
  ['greens-egg-braised-leftover-rice', 'family-home-braised-rice'],
  ['mushroom-egg-covered-leftover-rice', 'family-home-covered-pot'],
  ['shrimp-egg-fried-leftover-rice', 'family-home-fried-rice'],
  ['broccoli-beef-fried-rice', 'family-home-fried-rice'],
  ['broccoli-beef-braised-rice', 'family-home-braised-rice'],
  ['tomato-broccoli-beef-stewed-rice', 'family-home-stewed-rice'],
  ['broccoli-beef-soup-noodles', 'family-home-soup-staple'],
  ['potato-broccoli-beef-covered-rice', 'family-home-covered-pot'],
  ['greens-tofu-fried-rice', 'family-home-fried-rice'],
  ['cabbage-tofu-braised-rice', 'family-home-braised-rice'],
  ['tomato-tofu-stewed-rice', 'family-home-stewed-rice'],
  ['greens-tofu-soup-noodles', 'family-home-soup-staple'],
  ['mushroom-greens-tofu-covered-rice', 'family-home-covered-pot'],
  ['chicken-leg-potato-braised-rice', 'family-home-braised-rice'],
  ['chicken-leg-mushroom-stewed-rice', 'family-home-stewed-rice'],
  ['tomato-chicken-leg-soup-rice', 'family-home-soup-staple'],
  ['corn-carrot-chicken-leg-covered-rice', 'family-home-covered-pot'],
  ['cabbage-potato-chicken-leg-braised-noodles', 'family-northern-braised-noodles'],
  ['greens-sausage-fried-rice', 'family-home-fried-rice'],
  ['greens-minced-pork-braised-rice', 'family-home-braised-rice'],
  ['cabbage-egg-soup-rice', 'family-home-soup-staple'],
  ['greens-tofu-vermicelli-pot', 'family-home-vermicelli-pot'],
  ['greens-chicken-leg-soup-noodles', 'family-home-soup-staple'],
  ['green-bean-pork-rib-braised-rice', 'family-home-braised-rice'],
  ['potato-pork-rib-stewed-rice', 'family-home-stewed-rice'],
  ['tomato-potato-pork-rib-covered-rice', 'family-home-covered-pot'],
  ['mushroom-green-bean-pork-rib-braised-rice', 'family-home-braised-rice'],
  ['cabbage-potato-pork-rib-soup-rice', 'family-home-soup-staple'],
]);

export const COVERAGE_PROMOTION_MATRIX = new Map(
  [...FAMILY_BY_RECIPE].map(([recipeId, familyId]) => [recipeId, {
    candidate_id: recipeId,
    draft_id: `${recipeId}-draft`,
    family_id: familyId,
  }]),
);

export const COVERAGE_GROUPS = GROUP_IDS.map(([id, recipeIds]) => ({
  id,
  recipe_ids: [...recipeIds],
  min_recipes: 5,
  min_families: 4,
}));

export const COVERAGE_JOURNEYS = [
  { id: 'leftover-rice-egg', pantry: ['剩米饭', '鸡蛋'], minRecipes: 5, minFamilies: 4 },
  { id: 'broccoli-beef', pantry: ['西兰花', '牛肉'], minRecipes: 5, minFamilies: 4 },
  { id: 'tofu-greens', pantry: ['豆腐', '青菜'], minRecipes: 5, minFamilies: 4 },
  { id: 'chicken-leg-potato', pantry: ['鸡腿肉', '土豆'], minRecipes: 5, minFamilies: 4 },
  { id: 'leafy-greens', pantry: ['青菜'], minRecipes: 5, minFamilies: 4 },
  { id: 'ribs-potato', pantry: ['排骨', '土豆'], minRecipes: 5, minFamilies: 4 },
  { id: 'ribs-green-bean', pantry: ['排骨', '豆角'], minRecipes: 5, minFamilies: 4 },
];

function asArray(value, field) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.[field])) return value[field];
  return [];
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function duplicateErrors(items, field, label) {
  const seen = new Set();
  const errors = [];
  for (const item of items) {
    const value = item?.[field];
    if (!nonEmpty(value)) continue;
    if (seen.has(value)) errors.push(`coverage promotion manifest duplicates ${label} ${value}`);
    seen.add(value);
  }
  return errors;
}

function draftIngredientBoundary(draft) {
  const names = new Set([
    ...(draft?.core_ingredients || []),
    ...(draft?.optional_ingredients || []),
  ]);
  for (const slot of draft?.substitution_slots || []) {
    for (const name of slot?.replaces || []) names.add(name);
    for (const name of slot?.allowed || []) names.add(name);
  }
  return names;
}

function productionIngredientNames(recipe) {
  const names = [
    ...(recipe?.core_ingredients || []),
    ...(recipe?.optional_ingredients || []),
    ...(recipe?.generation_optional_ingredients || []),
  ];
  for (const slot of recipe?.substitution_slots || []) {
    names.push(...(slot?.replaces || []), ...(slot?.allowed || []));
  }
  return names;
}

function hasCanonicalSource(recipe) {
  const expectedUrl = `${CANONICAL_BASE}${recipe?.id}`;
  return (recipe?.source_refs || []).some(ref => ref?.usage === 'approved'
    && ref?.url === expectedUrl
    && nonEmpty(ref?.title)
    && nonEmpty(ref?.license)
    && nonEmpty(ref?.attribution)
    && nonEmpty(ref?.retrieved_at));
}

export function validateCoverageRecipePromotion(input) {
  const errors = [];
  const candidates = asArray(input?.candidates, 'entries');
  const drafts = asArray(input?.drafts, 'drafts');
  const promotions = asArray(input?.promotions, 'promotions');
  const recipes = asArray(input?.production, 'recipes');
  const candidateById = new Map(candidates.map(item => [item?.id, item]));
  const draftById = new Map(drafts.map(item => [item?.id, item]));
  const recipeById = new Map(recipes.map(item => [item?.id, item]));
  const promotionById = new Map(promotions.map(item => [item?.recipe_id, item]));

  if (promotions.length !== COVERAGE_PROMOTION_MATRIX.size) {
    errors.push(`coverage promotion manifest must contain exactly ${COVERAGE_PROMOTION_MATRIX.size} promotions`);
  }
  errors.push(...duplicateErrors(promotions, 'recipe_id', 'recipe_id'));
  errors.push(...duplicateErrors(promotions, 'draft_id', 'draft_id'));
  errors.push(...duplicateErrors(promotions, 'candidate_id', 'candidate_id'));

  for (const [recipeId, expected] of COVERAGE_PROMOTION_MATRIX) {
    if (!promotionById.has(recipeId)) errors.push(`expected promotion ${recipeId} is missing`);
    const promotion = promotionById.get(recipeId);
    if (!promotion) continue;
    if (promotion.candidate_id !== expected.candidate_id) {
      errors.push(`${recipeId} candidate_id must equal ${expected.candidate_id}`);
    }
    if (promotion.draft_id !== expected.draft_id) {
      errors.push(`${recipeId} draft_id must equal ${expected.draft_id}`);
    }
    if (promotion.family_id !== expected.family_id) {
      errors.push(`${recipeId} family_id must equal ${expected.family_id}`);
    }
    if (promotion.canonical_path !== `/recipes.html?id=${recipeId}`) {
      errors.push(`${recipeId} canonical_path must equal /recipes.html?id=${recipeId}`);
    }

    const candidate = candidateById.get(expected.candidate_id);
    if (!candidate) errors.push(`${recipeId} linked candidate ${expected.candidate_id} is missing`);
    else if (candidate.status !== 'candidate') {
      errors.push(`${recipeId} linked candidate ${expected.candidate_id} must have status candidate`);
    }

    const draft = draftById.get(expected.draft_id);
    if (!draft) errors.push(`${recipeId} linked draft ${expected.draft_id} is missing`);
    else if (draft.candidate_id !== expected.candidate_id) {
      errors.push(`${recipeId} linked draft candidate_id must equal ${expected.candidate_id}`);
    }

    const recipe = recipeById.get(recipeId);
    if (!recipe) {
      errors.push(`${recipeId} production recipe is missing`);
      continue;
    }
    if (recipe.status !== 'auto_approved') errors.push(`${recipeId} production status must be auto_approved`);
    if (recipe.origin_candidate_id !== expected.candidate_id) {
      errors.push(`${recipeId} origin_candidate_id must equal ${expected.candidate_id}`);
    }
    for (const field of ['family_id', 'cuisine', 'total_time_minutes']) {
      if (recipe[field] !== promotion[field]) {
        errors.push(`${recipeId} production ${field} must equal manifest ${promotion[field]}`);
      }
    }
    if (JSON.stringify(recipe.purposes) !== JSON.stringify(promotion.purposes)) {
      errors.push(`${recipeId} production purposes must equal manifest purposes`);
    }
    if (!hasCanonicalSource(recipe)) {
      errors.push(`${recipeId} canonical source must use ${CANONICAL_BASE}${recipeId}`);
    }
    for (const name of productionIngredientNames(recipe)) {
      if (typeof name === 'string' && IDENTITY_PLACEHOLDER.test(name)) {
        errors.push(`${recipeId} contains identity placeholder ${name}`);
      }
    }
    if (draft) {
      const allowed = draftIngredientBoundary(draft);
      for (const name of productionIngredientNames(recipe)) {
        if (!allowed.has(name)) errors.push(`${recipeId} production ingredient is outside draft semantics: ${name}`);
      }
    }
  }

  for (const group of COVERAGE_GROUPS) {
    const familyIds = new Set(group.recipe_ids.map(
      recipeId => COVERAGE_PROMOTION_MATRIX.get(recipeId)?.family_id,
    ));
    if (group.recipe_ids.length !== group.min_recipes) {
      errors.push(`${group.id} must contain exactly ${group.min_recipes} recipe identities`);
    }
    if (familyIds.size < group.min_families) {
      errors.push(`${group.id} must cover at least ${group.min_families} families`);
    }
  }

  return errors;
}

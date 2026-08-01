import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const library = JSON.parse(
  fs.readFileSync(new URL('../data/recipe-library.json', import.meta.url), 'utf8'),
);
const scope = JSON.parse(
  fs.readFileSync(new URL('./fixtures/rice-meal-preview-scope.json', import.meta.url), 'utf8'),
);

const RAW_RICE = new Set(['大米', '糯米', '泡发糯米']);
const EXCLUDED_BY_BOUNDARY = {
  noodles: [
    'north-china-green-bean-braised-noodles',
    'broccoli-beef-soup-noodles',
    'greens-tofu-soup-noodles',
    'cabbage-potato-chicken-leg-braised-noodles',
    'greens-chicken-leg-soup-noodles',
  ],
  porridge: ['chinese-congee', 'tibetan-savory-congee'],
  soup_rice: ['tomato-chicken-leg-soup-rice', 'cabbage-egg-soup-rice', 'cabbage-potato-pork-rib-soup-rice'],
  fried_or_leftover_rice: [
    'home-egg-fried-leftover-rice',
    'tomato-egg-stewed-leftover-rice',
    'greens-egg-braised-leftover-rice',
    'mushroom-egg-covered-leftover-rice',
    'shrimp-egg-fried-leftover-rice',
    'broccoli-beef-fried-rice',
    'tomato-broccoli-beef-stewed-rice',
    'greens-tofu-fried-rice',
    'tomato-tofu-stewed-rice',
    'chicken-leg-mushroom-stewed-rice',
    'greens-sausage-fried-rice',
    'potato-pork-rib-stewed-rice',
  ],
  foreign_rice: [
    'simple-chicken-biryani',
    'jollof-rice',
    'creole-jambalaya',
    'basic-risotto',
    'rice-cabbage-minestrone',
  ],
  grade_c_potato_rice: ['shanxi-potato-rice', 'shanxi-nitun-millet-rice'],
};

const EXPLICIT_EXCLUSION_CATEGORIES = {
  wild_mushroom: ['banshan-wild-rice'],
  ceremonial_glutinous_rice: ['daxi-lotus-leaf-oil-rice'],
  requires_mid_cook_opening: [
    'cantonese-cured-meat-claypot-rice',
    'cantonese-mushroom-chicken-claypot-rice',
    'cantonese-black-bean-pork-rib-claypot-rice',
    'shanghai-salted-pork-vegetable-rice',
    'suzhou-salted-pork-vegetable-rice',
    'nanjing-cured-pork-greens-rice',
    'nanjing-sausage-greens-rice',
    'taiwan-cabbage-mushroom-rice',
    'fujian-gai-cai-minced-pork-rice',
    'xinjiang-vegetable-pilaf',
    'cabbage-tofu-braised-rice',
    'mushroom-greens-tofu-covered-rice',
    'broccoli-beef-braised-rice',
    'greens-minced-pork-braised-rice',
  ],
};

test('rice-meal preview scope keeps the 72-recipe baseline and uses an explicit recipe allowlist', () => {
  assert.equal(library.recipes.length, 72);
  assert.equal(scope.expected_recipe_count, 72);

  const recipeIds = new Set(library.recipes.map(recipe => recipe.id));
  const included = new Set(scope.included_recipe_ids);
  const excluded = new Set(scope.excluded_recipe_ids);
  assert.equal(included.size, scope.included_recipe_ids.length, 'included recipe IDs must be unique');
  assert.equal(excluded.size, scope.excluded_recipe_ids.length, 'excluded recipe IDs must be unique');
  assert.equal([...included].filter(id => excluded.has(id)).length, 0, 'scope lists must not overlap');
  assert.deepEqual(new Set([...included, ...excluded]), recipeIds, 'scope must explicitly classify every baseline recipe');
});

test('each included recipe is an existing raw-rice or glutinous-rice meal, never leftover cooked rice', () => {
  const recipesById = new Map(library.recipes.map(recipe => [recipe.id, recipe]));
  for (const recipeId of scope.included_recipe_ids) {
    const recipe = recipesById.get(recipeId);
    assert.ok(recipe, `${recipeId} must exist in recipe-library.json`);
    assert.ok(
      recipe.core_ingredients.some(ingredient => RAW_RICE.has(ingredient)),
      `${recipeId} must use raw rice or glutinous rice`,
    );
    assert.ok(
      !recipe.core_ingredients.includes('熟米饭'),
      `${recipeId} must not use cooked leftover rice`,
    );
  }
});

test('scope excludes noodles, porridge, soup rice, fried or leftover rice, foreign rice, and grade-C potato rice', () => {
  const included = new Set(scope.included_recipe_ids);
  const excluded = new Set(scope.excluded_recipe_ids);
  for (const [boundary, recipeIds] of Object.entries(EXCLUDED_BY_BOUNDARY)) {
    for (const recipeId of recipeIds) {
      assert.ok(excluded.has(recipeId), `${recipeId} must remain excluded as ${boundary}`);
      assert.ok(!included.has(recipeId), `${recipeId} must not enter the preview scope as ${boundary}`);
    }
  }
});

test('scope keeps wild-mushroom, ceremonial glutinous-rice, and mid-cook-opening recipes outside the rice-cooker flow', () => {
  const recipeIds = new Set(library.recipes.map(recipe => recipe.id));
  const included = new Set(scope.included_recipe_ids);
  const excluded = new Set(scope.excluded_recipe_ids);
  assert.deepEqual(
    scope.explicit_exclusion_categories,
    EXPLICIT_EXCLUSION_CATEGORIES,
    'fixture must name the non-negotiable exclusions instead of relying on their current position in the broad excluded list',
  );
  for (const [boundary, recipeIdsForBoundary] of Object.entries(scope.explicit_exclusion_categories)) {
    for (const recipeId of recipeIdsForBoundary) {
      assert.ok(recipeIds.has(recipeId), `${recipeId} must remain a real baseline recipe for ${boundary}`);
      assert.ok(excluded.has(recipeId), `${recipeId} must remain explicitly excluded as ${boundary}`);
      assert.ok(!included.has(recipeId), `${recipeId} must not enter the rice-cooker flow as ${boundary}`);
    }
  }
});

test('only three named legacy mid-open recipes may support a separately validated closed-cycle process adaptation', () => {
  assert.deepEqual(scope.controlled_process_adaptation_recipe_ids, [
    'cabbage-tofu-braised-rice',
    'broccoli-beef-braised-rice',
    'greens-minced-pork-braised-rice',
  ]);
  const midOpen = new Set(scope.explicit_exclusion_categories.requires_mid_cook_opening);
  const excluded = new Set(scope.excluded_recipe_ids);
  for (const recipeId of scope.controlled_process_adaptation_recipe_ids) {
    assert.ok(midOpen.has(recipeId), `${recipeId} legacy flow must remain classified as mid-open`);
    assert.ok(excluded.has(recipeId), `${recipeId} legacy recipe path must remain excluded`);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildRecipeCoverageEntry,
} from '../lib/planner-menu-coverage-builder.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const recipeLibrary = readJson('../data/recipe-library.json');
const taxonomy = readJson('../data/ingredient-taxonomy.v1.json');
const templates = readJson('../data/meal-templates.v2.json');
const ratios = readJson('../data/ratio-rules.v1.json');

function contextFor(recipeId = 'sample') {
  return {
    plannerAssets: {
      recipes: recipeLibrary,
      taxonomy,
      templates,
      ratios,
    },
    mappingByRecipeId: new Map([[
      recipeId,
      {
        source_type: 'production_recipe',
        source_id: recipeId,
        regional_scope: 'national_household',
        region_ids: [],
        primary_family_id: 'cooked-rice-stew',
      },
    ]]),
  };
}

function sampleWith(coreIngredients, overrides = {}) {
  return {
    id: 'sample',
    name: '样例',
    status: 'auto_approved',
    core_ingredients: coreIngredients,
    ...overrides,
  };
}

test('keeps source order while partitioning planner, basic, and unknown identities', () => {
  const entry = buildRecipeCoverageEntry(
    sampleWith(['牛里脊', '水', '陌生菜', '牛肉片']),
    contextFor(),
  );

  assert.deepEqual(entry.raw_core_items, ['牛里脊', '水', '陌生菜', '牛肉片']);
  assert.deepEqual(entry.recognized_basic_items.map(row => row.raw), ['水']);
  assert.deepEqual(entry.unclassified_core_items.map(row => row.raw), ['陌生菜']);
  assert.equal(entry.planner_eligible_items.filter(row => row.duplicate_of === null).length, 1);
  assert.equal(entry.identity_recognition_ratio, 1 / 2);
});

test('raw scenario keeps unknown items while recognized scenario isolates template capacity', () => {
  const entry = buildRecipeCoverageEntry(
    sampleWith(['熟米饭', '白菜', '鸡蛋', '陌生菜']),
    contextFor(),
  );

  assert.deepEqual(entry.raw_core_scenario.submitted_raw_items, ['熟米饭', '白菜', '鸡蛋', '陌生菜']);
  assert.deepEqual(entry.recognized_only_scenario.submitted_raw_items, ['熟米饭', '白菜', '鸡蛋']);
  assert.equal(entry.raw_core_scenario.status, 'needs_user_decision');
  assert.equal(entry.recognized_only_scenario.status, 'complete');
});

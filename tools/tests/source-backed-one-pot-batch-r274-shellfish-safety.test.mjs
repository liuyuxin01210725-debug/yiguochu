import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

const expected = {
  'tiger-steamed-abalone-rice': /raw abalone|Tiger source/u,
  'towngas-asparagus-shrimp-quinoa-rice': /Towngas source|shrimp/u,
};

test('r274 adds shellfish visual endpoints only where the recipe source proves shellfish cooking state', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  for (const [recipeId, locatorPattern] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.deepEqual(recipe.safety_endpoints, [{
      code: 'shellfish_fully_cooked',
      visual_endpoint: '肉质呈珍珠白或白色且不透明',
      source_ids: [safetySourceId],
    }], recipeId);
    const safetySource = recipe.source_refs.find((source) => source.source_id === safetySourceId);
    assert.ok(safetySource, `${recipeId} missing safety source`);
    assert.equal(safetySource.url, safetyUrl, recipeId);
    assert.equal(safetySource.access_status, 'opened', recipeId);
    assert.equal(safetySource.evidence_tier, 1, recipeId);
    assert.deepEqual(safetySource.claim_scopes, ['safety'], recipeId);
    assert.match(safetySource.evidence_locator, locatorPattern, recipeId);
  }
});

test('r274 does not infer shellfish safety for the unresolved crab porridge', () => {
  assert.deepEqual(byId['panasonic-taiwan-red-crab-pork-congee']?.safety_endpoints, []);
});

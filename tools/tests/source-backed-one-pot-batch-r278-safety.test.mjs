import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find((item) => item.recipe_id === 'japan-hyogo-barley-chicken-vegetable-rice');
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

test('r278 closes the MAFF Hyogo raw chicken mixed-rice safety gap', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.safety_endpoints, [{
    code: 'poultry_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: [safetySourceId],
  }]);
  const source = recipe.source_refs.find((item) => item.source_id === safetySourceId);
  assert.ok(source);
  assert.equal(source.url, safetyUrl);
  assert.equal(source.access_status, 'opened');
  assert.equal(source.evidence_tier, 1);
  assert.deepEqual(source.claim_scopes, ['safety']);
  assert.match(source.evidence_locator, /poultry|鸡|165|74|raw|生/u);
});

test('r278 preserves the two-person gas-stove boundary', () => {
  assert.equal(recipe.fixed_batch.servings, 2);
  assert.equal(recipe.fixed_batch.ingredients.find((item) => item.name === '鸡胸肉')?.amount.value, 40);
  assert.match(recipe.cooking_sequence.map((step) => step.instruction).join(' '), /铺在米和もち麦上|燃气灶\/锅炊煮至熟/u);
  assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
  assert.notEqual(recipe.status, 'executable');
});

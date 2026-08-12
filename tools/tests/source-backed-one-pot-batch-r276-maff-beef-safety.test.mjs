import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find((item) => item.recipe_id === 'maff-gobo-beef-rice');
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

test('r276 closes the direct MAFF raw beef rice safety gap with the whole-cut beef endpoint', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.safety_endpoints, [{
    code: 'beef_fully_cooked',
    minimum_core_temperature_c: 63,
    source_ids: [safetySourceId],
  }]);
  const source = recipe.source_refs.find((item) => item.source_id === safetySourceId);
  assert.ok(source);
  assert.equal(source.url, safetyUrl);
  assert.equal(source.access_status, 'opened');
  assert.equal(source.evidence_tier, 1);
  assert.deepEqual(source.claim_scopes, ['safety']);
  assert.match(source.evidence_locator, /beef|牛|145|63|steaks|roasts|chops/i);
});

test('r276 preserves the MAFF fixed batch and direct rice-cooker process', () => {
  assert.equal(recipe.fixed_batch.servings, 2);
  assert.equal(recipe.fixed_batch.ingredients.find((item) => item.name === '牛腿薄片')?.amount.value, 150);
  assert.match(recipe.cooking_sequence.map((step) => step.instruction).join(' '), /牛肉|牛蒡|金针菇|炊煮|电饭锅/u);
  assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
  assert.notEqual(recipe.status, 'executable');
});

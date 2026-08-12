import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find((item) => item.recipe_id === 'maff-oita-torimeshi');
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

test('r277 closes the MAFF Oita raw chicken rice safety gap', () => {
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
  assert.match(source.evidence_locator, /poultry|鸡|165|74|raw chicken|生鸡/i);
});

test('r277 preserves the MAFF staged cooked-rice boundary', () => {
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.equal(recipe.fixed_batch.ingredients.find((item) => item.name === '地鸡')?.amount.value, 150);
  assert.match(recipe.cooking_sequence.map((step) => step.instruction).join(' '), /先炒煮|熟饭|焖约15分钟/u);
  assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
  assert.notEqual(recipe.status, 'executable');
});

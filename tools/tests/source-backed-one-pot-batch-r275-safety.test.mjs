import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find((item) => item.recipe_id === 'maff-hokkaido-ikameshi');
const safetySourceId = 'S-SAFETY-SEAFOOD-GENERAL-CDC-1';

test('r275 closes the direct raw-squid MAFF safety gap with the general seafood endpoint', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.safety_endpoints, [{
    code: 'seafood_fully_cooked',
    minimum_core_temperature_c: 63,
    source_ids: [safetySourceId],
  }]);
  const source = recipe.source_refs.find((item) => item.source_id === safetySourceId);
  assert.ok(source);
  assert.equal(source.url, 'https://www.cdc.gov/anisakiasis/about/index.html');
  assert.equal(source.access_status, 'opened');
  assert.equal(source.evidence_tier, 1);
  assert.deepEqual(source.claim_scopes, ['safety']);
  assert.match(source.evidence_locator, /145|63|squid|raw|undercooked/i);
});

test('r275 preserves the MAFF pot process and range boundary', () => {
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.equal(recipe.fixed_batch.ingredients[0].amount.unit, '至8杯');
  assert.match(recipe.cooking_sequence.map((step) => step.instruction).join(' '), /糯米|鱿鱼|30分钟|出汁/u);
  assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
  assert.notEqual(recipe.status, 'executable');
});

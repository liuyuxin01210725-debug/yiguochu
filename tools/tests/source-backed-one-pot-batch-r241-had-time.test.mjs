import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find((item) => item.recipe_id === 'had-vegetable-pulao');

test('r241 closes the official HAD vegetable pulao total time only', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r248');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.time_contract, {
    total_minutes: 60,
    source_ids: ['S-HAD-HOME-RECIPE-VEGETABLE-PULAO-1'],
  });
  assert.equal(recipe.fixed_batch, null);
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.safety_endpoints.length, 0);
  assert.match(recipe.evidence_notes, /总时长约60分钟|4至6人份|4至6杯水/u);
  assert.match(recipe.cooker_adaptation.notes, /锅煮|不推导/u);
  assert.equal('executable' in recipe, false);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);
const targetId = 'toshiba-chinese-sticky-rice-rcp30r';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

test('r234 closes the Toshiba raw pork safety gap without changing its pressure-cooker contract', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);

  const recipe = catalog.recipes.find(item => item.recipe_id === targetId);
  assert.ok(recipe, targetId);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.safety_endpoints, [{
    code: 'pork_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);

  const safetySource = recipe.source_refs.find(source => source.source_id === 'S-SAFETY-TEMPERATURES-1');
  assert.equal(safetySource?.url, safetyUrl);
  assert.equal(safetySource?.access_status, 'opened');
  assert.equal(safetySource?.evidence_tier, 1);
  assert.deepEqual(safetySource?.claim_scopes, ['safety']);
  assert.notEqual(recipe.status, 'executable');
});

test('r234 preserves raw-ingredient evidence and RCP-30R-only boundaries', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const recipe = catalog.recipes.find(item => item.recipe_id === targetId);
  assert.ok(recipe, targetId);
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.equal(recipe.fixed_batch.ingredients.find(item => item.name === '猪肉')?.amount.value, 1);
  assert.equal(recipe.liquid_contract.amount.value, 270);
  assert.equal(recipe.time_contract.total_minutes, 30);
  assert.equal(recipe.cooker_adaptation.status, 'source_limited');
  assert.match(recipe.cooker_adaptation.notes, /1\.4气压/);
  assert.match(recipe.cooker_adaptation.notes, /不外推到普通电饭煲/);
  assert.match(recipe.evidence_notes, /猪肉“1大匙”/);
});

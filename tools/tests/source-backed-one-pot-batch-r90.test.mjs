import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

test('r90 records two Panasonic Taiwan named rice recipes with different nutrition roles', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r145');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(catalog.recipes.filter(item => item.status === 'recipe_fact_checked').length, 794);

  const seafood = catalog.recipes.find(item => item.recipe_id === 'panasonic-taiwan-mullet-roe-scallop-seafood-rice');
  assert.equal(seafood?.canonical_name, '迎春烏魚子干貝海味飯');
  assert.equal(seafood?.status, 'recipe_fact_checked');
  assert.deepEqual(seafood?.region_codes, []);
  assert.equal(seafood?.liquid_contract?.kind, 'waterline');
  assert.equal(seafood?.liquid_contract?.waterline?.appliance_model, 'Panasonic SR-PAA100');
  assert.equal(seafood?.fixed_batch, null);
  assert.deepEqual(seafood?.safety_endpoints, []);
  assert.match(seafood?.evidence_notes ?? '', /烏魚子|裝飾|安全|授权/u);

  const corn = catalog.recipes.find(item => item.recipe_id === 'panasonic-taiwan-butter-corn-mushroom-rice');
  assert.equal(corn?.canonical_name, '奶油玉米香菇炊飯');
  assert.equal(corn?.status, 'recipe_fact_checked');
  assert.deepEqual(corn?.region_codes, []);
  assert.equal(corn?.liquid_contract?.kind, 'waterline');
  assert.equal(corn?.liquid_contract?.waterline?.appliance_model, 'Panasonic SR-PAA100');
  assert.equal(corn?.time_contract?.total_minutes, 55);
  assert.deepEqual(corn?.nutrition_structure?.roles, ['carbohydrate', 'fiber']);
  assert.match(corn?.evidence_notes ?? '', /缺少明确蛋白|低优先|不完整/u);
});

test('r90 keeps both manufacturer entries model-scoped and research-only', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  for (const id of [
    'panasonic-taiwan-mullet-roe-scallop-seafood-rice',
    'panasonic-taiwan-butter-corn-mushroom-rice',
  ]) {
    const recipe = catalog.recipes.find(item => item.recipe_id === id);
    assert.deepEqual(recipe?.region_codes, []);
    assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
    assert.notEqual(recipe?.status, 'executable');
  }
});

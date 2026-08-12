import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('r291 closes the same-source approximate batch for Nonoko rice without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  const recipe = catalog.recipes.find(item => item.recipe_id === 'zojirushi-nonokomeshi-el-mb30');
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.fixed_batch, {
    servings: 8,
    ingredients: [
      {
        name: '白米',
        amount: { value: 1, unit: '杯' },
        source_ids: ['S-R71-ZOJIRUSHI-NONOKO'],
      },
    ],
    source_ids: ['S-R71-ZOJIRUSHI-NONOKO'],
  });
  assert.equal(recipe.liquid_contract.amount.value, 450);
  assert.equal(recipe.time_contract.total_minutes, 42);
  assert.equal(recipe.cooker_adaptation.status, 'source_limited');
  assert.match(recipe.evidence_notes, /约8份|白米1杯|固定批量/u);
});

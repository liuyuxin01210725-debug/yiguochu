import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find(item => item.recipe_id === 'panasonic-taiwan-cabbage-mackerel-rice');

test('r170 records Panasonic cabbage mackerel rice liquid without inventing a cooker contract', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r239');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.liquid_contract, {
    kind: 'added_water',
    amount: { value: 1.1, unit: '杯（热水，含酱油1/2小匙）' },
    source_ids: ['S-PANASONIC-TAIWAN-CABBAGE-MACKEREL-RICE-1'],
  });
  assert.equal(recipe.fixed_batch.servings, 3);
  assert.equal(recipe.fixed_batch.ingredients.find(item => item.name === '白米')?.amount.value, 1);
  assert.equal(recipe.fixed_batch.ingredients.find(item => item.name === '薄盐鲭鱼')?.amount.value, 1);
  assert.equal(recipe.time_contract, null);
  assert.equal(recipe.cooker_adaptation?.status, 'source_limited');
  assert.match(recipe.cooker_adaptation?.notes ?? '', /NU-SC300B|普通电饭煲/u);
  assert.deepEqual(recipe.safety_endpoints, []);
});

test('r170 keeps the Panasonic source locator as the liquid evidence boundary', () => {
  const source = recipe?.source_refs?.find(item => item.source_id === 'S-PANASONIC-TAIWAN-CABBAGE-MACKEREL-RICE-1');
  assert.ok(source);
  assert.ok(source.claim_scopes.includes('liquid'));
  assert.match(source.evidence_locator ?? '', /1\.1杯热水|原味蒸25分钟/u);
  assert.match(recipe?.evidence_notes ?? '', /1\.1\s*杯热水|1\/2\s*小匙酱油/u);
});

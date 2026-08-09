import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find(item => item.recipe_id === 'tiger-cheese-curry-pilaf');

test('r173 records the Tiger COK-B220 model-scoped waterline', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r215');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.liquid_contract, {
    kind: 'waterline',
    waterline: { appliance_model: 'Tiger COK-B220', scale: 'white_rice', mark: '2刻度略低' },
    source_ids: ['S-R69-TIGER-CHEESE-CURRY-PILAF'],
  });
  assert.equal(recipe.fixed_batch.servings, 3);
  assert.equal(recipe.fixed_batch.ingredients.find((item) => item.name === '米').amount.value, 300);
  assert.equal(recipe.time_contract?.total_minutes, 45);
  assert.equal(recipe.cooker_adaptation?.status, 'source_limited');
  assert.deepEqual(recipe.cooker_adaptation?.waterline, {
    appliance_model: 'Tiger COK-B220',
    scale: '白米',
    mark: '2刻度略低',
  });
});

test('r173 keeps the COK-B220 post-cook cheese boundary', () => {
  const source = recipe?.source_refs?.find(item => item.source_id === 'S-R69-TIGER-CHEESE-CURRY-PILAF');
  assert.ok(source);
  assert.ok(source.claim_scopes.includes('liquid'));
  assert.match(source.evidence_locator ?? '', /COK-B220|米300g|水位线语义/u);
  assert.match(recipe?.cooking_sequence?.[1]?.instruction ?? '', /完成后|芝士|5分钟/u);
  assert.deepEqual(recipe?.safety_endpoints, []);
});

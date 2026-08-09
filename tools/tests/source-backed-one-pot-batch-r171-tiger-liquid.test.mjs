import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find(item => item.recipe_id === 'tiger-brown-rice-curry-pilaf');

test('r171 records the Tiger brown-rice curry pilaf chicken-stock contract', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r244');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.liquid_contract, {
    kind: 'added_chicken_stock',
    amount: { value: 600, unit: 'mL' },
    source_ids: ['S-TIGER-BROWN-RICE-CURRY-PILAF-1'],
  });
  assert.equal(recipe.fixed_batch.servings, 3);
  assert.equal(recipe.fixed_batch.ingredients.find(item => item.name === '玄米')?.amount.value, 2);
  assert.equal(recipe.fixed_batch.ingredients.find(item => item.name === '香肠')?.amount.value, 80);
  assert.equal(recipe.time_contract?.total_minutes, 90);
  assert.equal(recipe.cooker_adaptation?.status, 'source_limited');
  assert.match(recipe.cooker_adaptation?.notes ?? '', /玄米|普通白米程序/u);
});

test('r171 keeps the exact stock evidence and staged boundary', () => {
  const source = recipe?.source_refs?.find(item => item.source_id === 'S-TIGER-BROWN-RICE-CURRY-PILAF-1');
  assert.ok(source);
  assert.ok(source.claim_scopes.includes('liquid'));
  assert.match(source.evidence_locator ?? '', /3人份|玄米2杯|鸡汤600mL|90分钟/u);
  assert.match(recipe?.cooking_sequence?.[1]?.instruction ?? '', /出锅后|4至5分钟/u);
  assert.deepEqual(recipe?.safety_endpoints, []);
});

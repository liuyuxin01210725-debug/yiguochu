import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find(item => item.recipe_id === 'tefal-602-chicken-pea-risotto');

test('r175 records the TEFAL602 chicken pea risotto stock contract', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r245');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.liquid_contract, {
    kind: 'added_chicken_stock',
    amount: { value: 650, unit: 'mL鸡高汤' },
    source_ids: ['S-R76-TEFAL602-CHICKEN-PEA-RISOTTO'],
  });
  assert.equal(recipe.fixed_batch?.servings, 4);
  assert.equal(recipe.time_contract, null);
  assert.equal(recipe.cooker_adaptation?.status, 'source_limited');
  assert.match(recipe.cooker_adaptation?.notes ?? '', /TEFAL602|熟鸡肉|平底锅/u);
});

test('r175 keeps the cooked-chicken staged boundary', () => {
  const source = recipe?.source_refs?.find(item => item.source_id === 'S-R76-TEFAL602-CHICKEN-PEA-RISOTTO');
  assert.ok(source);
  assert.ok(source.claim_scopes.includes('liquid'));
  assert.match(source.evidence_locator ?? '', /4人份|鸡高汤650mL|熟鸡肉250g/u);
  assert.match(recipe?.cooking_sequence?.[2]?.instruction ?? '', /约20分钟|熟鸡肉|豌豆/u);
  assert.deepEqual(recipe?.safety_endpoints, []);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const carrotSeafood = catalog.recipes.find(item => item.recipe_id === 'r104-hk-carrot-seafood-rice');
const mushroomRice = catalog.recipes.find(item => item.recipe_id === 'r104-hk-mushroom-italian-rice-ricotta');

test('r177 records the HK carrot seafood rice chicken-stock contract', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r199');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(carrotSeafood);
  assert.equal(carrotSeafood.status, 'recipe_fact_checked');
  assert.deepEqual(carrotSeafood.liquid_contract, {
    kind: 'added_chicken_stock',
    amount: { value: 100, unit: 'mL鸡汤' },
    source_ids: ['S-R104-HK-CARROT-SEAFOOD-RICE-1'],
  });
  const source = carrotSeafood.source_refs?.find(item => item.source_id === 'S-R104-HK-CARROT-SEAFOOD-RICE-1');
  assert.ok(source);
  assert.ok(source.claim_scopes.includes('liquid'));
  assert.match(source.evidence_locator ?? '', /4人份|鸡汤100毫升|青口8只/u);
  assert.match(carrotSeafood.cooking_sequence?.[2]?.instruction ?? '', /加鸡汤|小火煮约15分钟/u);
  assert.deepEqual(carrotSeafood.safety_endpoints, []);
});

test('r177 records the HK mushroom Italian rice vegetable-stock contract', () => {
  assert.ok(mushroomRice);
  assert.equal(mushroomRice.status, 'recipe_fact_checked');
  assert.deepEqual(mushroomRice.liquid_contract, {
    kind: 'added_broth',
    amount: { value: 200, unit: 'mL蔬菜高汤' },
    source_ids: ['S-R104-HK-MUSHROOM-ITALIAN-RICE-RICOTTA-1'],
  });
  const source = mushroomRice.source_refs?.find(item => item.source_id === 'S-R104-HK-MUSHROOM-ITALIAN-RICE-RICOTTA-1');
  assert.ok(source);
  assert.ok(source.claim_scopes.includes('liquid'));
  assert.match(source.evidence_locator ?? '', /1人份|蔬菜高汤200毫升|10分钟煮米/u);
  assert.match(mushroomRice.cooking_sequence?.[0]?.instruction ?? '', /蔬菜高汤煮约10分钟/u);
  assert.deepEqual(mushroomRice.safety_endpoints, []);
});

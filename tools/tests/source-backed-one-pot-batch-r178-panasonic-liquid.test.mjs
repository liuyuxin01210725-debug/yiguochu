import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const spring = catalog.recipes.find(item => item.recipe_id === 'panasonic-spring-chicken-vegetable-risotto');
const biryani = catalog.recipes.find(item => item.recipe_id === 'panasonic-chicken-biryani-sr-da182');

test('r178 records the Panasonic spring chicken risotto stock contract', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r186');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(spring);
  assert.equal(spring.status, 'recipe_fact_checked');
  assert.deepEqual(spring.liquid_contract, {
    kind: 'added_chicken_stock',
    amount: { value: 750, unit: 'mL鸡高汤' },
    source_ids: ['S-R76-PANASONIC-SPRING-CHICKEN-RISOTTO'],
  });
  const source = spring.source_refs?.find(item => item.source_id === 'S-R76-PANASONIC-SPRING-CHICKEN-RISOTTO');
  assert.ok(source);
  assert.ok(source.claim_scopes.includes('liquid'));
  assert.match(source.evidence_locator ?? '', /鸡胸500g|Arborio米1.5杯|热鸡高汤750mL/u);
  assert.match(spring.cooking_sequence?.[2]?.instruction ?? '', /Arborio|热鸡高汤|15–20分钟/u);
  assert.deepEqual(spring.safety_endpoints, []);
});

test('r178 records the Panasonic chicken biryani stock contract', () => {
  assert.ok(biryani);
  assert.equal(biryani.status, 'recipe_fact_checked');
  assert.deepEqual(biryani.liquid_contract, {
    kind: 'added_chicken_stock',
    amount: { value: 550, unit: 'mL鸡高汤' },
    source_ids: ['S-R76-PANASONIC-CHICKEN-BIRYANI-SR-DA182'],
  });
  const source = biryani.source_refs?.find(item => item.source_id === 'S-R76-PANASONIC-CHICKEN-BIRYANI-SR-DA182');
  assert.ok(source);
  assert.ok(source.claim_scopes.includes('liquid'));
  assert.match(source.evidence_locator ?? '', /4只鸡腿|印度香米400g|鸡高汤550mL/u);
  assert.match(biryani.cooking_sequence?.[2]?.instruction ?? '', /鸡高汤550mL|Quick Cook\/Steam|20分钟/u);
  assert.deepEqual(biryani.safety_endpoints, []);
});

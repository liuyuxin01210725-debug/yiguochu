import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const pumpkin = catalog.recipes.find(({ recipe_id: recipeId }) => recipeId === 'taiwan-pumpkin-rice');

test('r145 records the same-source approximate time for Taiwan pumpkin rice', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r231');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(pumpkin);
  assert.equal(pumpkin.status, 'recipe_fact_checked');
  assert.equal(pumpkin.fixed_batch, null);
  assert.equal(pumpkin.time_contract.total_minutes, 60);
  assert.deepEqual(pumpkin.time_contract.source_ids, ['S-TW-MOA-KIDS-PUMPKIN-RICE-1']);
});

test('r145 does not merge inner-pot liquid with outer-pot cooker water', () => {
  assert.ok(pumpkin);
  assert.equal(pumpkin.liquid_contract.amount.value, 0.8);
  assert.equal(pumpkin.liquid_contract.amount.unit, '杯水/杯米');
  assert.deepEqual(pumpkin.liquid_contract.source_ids, ['taiwan-afa-pumpkin-rice']);
  assert.match(pumpkin.cooker_adaptation.notes, /外锅.*1.*杯|5.*杯.*外锅/iu);
  assert.match(pumpkin.evidence_notes, /约60分钟|600克.*4杯|不.*混合/iu);
});

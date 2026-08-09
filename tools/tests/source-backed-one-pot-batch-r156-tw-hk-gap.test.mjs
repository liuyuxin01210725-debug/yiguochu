import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

test('r156 closes only the three same-source contract fields without adding recipes', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r255');
  assert.equal(catalog.recipes.length, 923);

  const bottleGourd = byId['taiwan-bottle-gourd-mushroom-rice'];
  assert.ok(bottleGourd);
  assert.equal(bottleGourd.status, 'recipe_fact_checked');
  assert.deepEqual(bottleGourd.time_contract, {
    total_minutes: 60,
    source_ids: ['S-TW-MOA-KIDS-BOTTLE-GOURD-MUSHROOM-RICE-1'],
  });
  assert.deepEqual(bottleGourd.fixed_batch, null);
  assert.deepEqual(bottleGourd.liquid_contract, {
    kind: 'added_water',
    amount: { value: 3, unit: '杯' },
    source_ids: ['S-TW-MOA-KIDS-BOTTLE-GOURD-MUSHROOM-RICE-1'],
  });

  const porkRib = byId['taiwan-pork-rib-claypot-rice'];
  assert.ok(porkRib);
  assert.equal(porkRib.status, 'recipe_fact_checked');
  assert.deepEqual(porkRib.time_contract, {
    total_minutes: 30,
    source_ids: ['S-MOA-TW-PORK-RIB-CLAYPOT-1'],
  });
  assert.deepEqual(porkRib.fixed_batch, null);
  assert.deepEqual(porkRib.liquid_contract, null);
  assert.match(porkRib.evidence_notes, /半包|2杯|液体/u);

  const tenFragrant = byId['taiwan-ten-fragrant-rice'];
  assert.ok(tenFragrant);
  assert.equal(tenFragrant.status, 'recipe_fact_checked');
  assert.deepEqual(tenFragrant.liquid_contract, {
    kind: 'added_water',
    amount: { value: 336, unit: 'g' },
    source_ids: ['S-AFA-TEN-FRAGRANT-RICE-1'],
  });
  assert.deepEqual(tenFragrant.fixed_batch, null);
  assert.deepEqual(tenFragrant.time_contract, null);
  const tenSource = tenFragrant.source_refs.find(({ source_id: sourceId }) => sourceId === 'S-AFA-TEN-FRAGRANT-RICE-1');
  assert.ok(tenSource);
  assert.ok(tenSource.claim_scopes.includes('liquid'));
  assert.match(tenFragrant.evidence_notes, /300g|336g|米态|生米/u);
  assert.match(tenFragrant.cooker_adaptation.notes, /不建立通用|状态|336g/u);
});

test('r156 keeps the three entries non-executable and preserves source boundaries', () => {
  for (const id of [
    'taiwan-bottle-gourd-mushroom-rice',
    'taiwan-pork-rib-claypot-rice',
    'taiwan-ten-fragrant-rice',
  ]) {
    assert.notEqual(byId[id].status, 'executable', `${id} must remain non-executable`);
  }
  assert.equal(byId['taiwan-pork-rib-claypot-rice'].cooker_adaptation.status, 'not_adapted');
  assert.equal(byId['taiwan-ten-fragrant-rice'].cooker_adaptation.status, 'source_limited');
});

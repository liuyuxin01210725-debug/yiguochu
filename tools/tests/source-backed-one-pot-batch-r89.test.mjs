import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

test('r89 records the Panasonic red-crab congee and Taiwan agriculture yam rice', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r125');
  assert.equal(catalog.recipes.length, 884);
  assert.equal(catalog.recipes.filter(item => item.status === 'recipe_fact_checked').length, 755);

  const crab = catalog.recipes.find(item => item.recipe_id === 'panasonic-taiwan-red-crab-pork-congee');
  assert.equal(crab?.canonical_name, '紅蟳稀飯');
  assert.equal(crab?.status, 'recipe_fact_checked');
  assert.deepEqual(crab?.region_codes, []);
  assert.equal(crab?.liquid_contract?.amount?.value, 900);
  assert.equal(crab?.liquid_contract?.amount?.unit, 'g');
  assert.equal(crab?.cooker_adaptation?.status, 'source_limited');
  assert.deepEqual(crab?.safety_endpoints, []);
  assert.match(crab?.evidence_notes ?? '', /紅蟳|蟹|猪肉|安全终点/u);

  const yam = catalog.recipes.find(item => item.recipe_id === 'taiwan-yam-rice');
  assert.equal(yam?.canonical_name, '山藥飯');
  assert.equal(yam?.status, 'recipe_fact_checked');
  assert.deepEqual(yam?.region_codes, ['TW']);
  assert.equal(yam?.liquid_contract?.amount?.value, 1);
  assert.equal(yam?.liquid_contract?.amount?.unit, '杯水');
  assert.equal(yam?.cooker_adaptation?.status, 'source_limited');
  assert.deepEqual(yam?.safety_endpoints, []);
  assert.match(yam?.evidence_notes ?? '', /桃园|电锅|虾米量|安全/u);
});

test('r89 does not promote either new research entry to executable', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  for (const id of ['panasonic-taiwan-red-crab-pork-congee', 'taiwan-yam-rice']) {
    const recipe = catalog.recipes.find(item => item.recipe_id === id);
    assert.equal(recipe?.status, 'recipe_fact_checked');
    assert.notEqual(recipe?.status, 'executable');
  }
});

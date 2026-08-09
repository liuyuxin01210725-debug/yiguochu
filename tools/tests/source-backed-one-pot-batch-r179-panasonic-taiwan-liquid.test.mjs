import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const expected = [
  ['panasonic-taiwan-scallop-five-color-rice', 'added_dashi', 5, '杯', 'S-PANASONIC-TW-SCALLOP-FIVE-COLOR-RICE-1', /米5杯|柴鱼高汤5杯/u],
  ['panasonic-taiwan-loofah-dried-fish-rice', 'added_water', 300, 'g', 'S-PANASONIC-TW-LOOFAH-DRIED-FISH-RICE-1', /米300g|水300g|午仔魚一夜干/u],
  ['panasonic-taiwan-salmon-mushroom-rice', 'added_water', 1.5, '杯', 'S-PANASONIC-SALMON-MUSHROOM-1', /米1.5杯\/水1.5杯|鮭魚250g/u],
  ['panasonic-taiwan-sakura-shrimp-cabbage-rice', 'added_water', 400, 'g', 'S-PANASONIC-SAKURA-CABBAGE-1', /白米300g|水400g|櫻花蝦5g/u],
];

test('r179 records four exact Panasonic Taiwan liquid contracts', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r223');
  assert.equal(catalog.recipes.length, 923);
  const byId = new Map(catalog.recipes.map(item => [item.recipe_id, item]));
  for (const [id, kind, value, unit, sourceId, locator] of expected) {
    const recipe = byId.get(id);
    assert.ok(recipe, id);
    assert.equal(recipe.status, 'recipe_fact_checked', id);
    assert.deepEqual(recipe.liquid_contract, { kind, amount: { value, unit }, source_ids: [sourceId] }, id);
    assert.equal(recipe.fixed_batch, null, id);
    assert.equal(recipe.time_contract, null, id);
    assert.equal(recipe.cooker_adaptation?.status, 'source_limited', id);
    const source = recipe.source_refs?.find(item => item.source_id === sourceId);
    assert.ok(source, id);
    assert.ok(source.claim_scopes.includes('liquid'), id);
    assert.match(source.evidence_locator ?? '', locator, id);
    assert.notEqual(recipe.status, 'executable', id);
  }
});

test('r179 preserves Panasonic Taiwan safety and authorization boundaries', () => {
  const byId = new Map(catalog.recipes.map(item => [item.recipe_id, item]));
  assert.deepEqual(byId.get('panasonic-taiwan-scallop-five-color-rice')?.safety_endpoints, []);
  assert.deepEqual(byId.get('panasonic-taiwan-loofah-dried-fish-rice')?.safety_endpoints, []);
  assert.deepEqual(byId.get('panasonic-taiwan-salmon-mushroom-rice')?.safety_endpoints, [{ code: 'seafood_fully_cooked', minimum_core_temperature_c: 63, source_ids: ['S-SAFETY-TEMPERATURES-1'] }]);
  assert.deepEqual(byId.get('panasonic-taiwan-sakura-shrimp-cabbage-rice')?.safety_endpoints, []);
  assert.match(byId.get('panasonic-taiwan-loofah-dried-fish-rice')?.evidence_notes ?? '', /第三方授权|鱼类安全/u);
});

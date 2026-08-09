import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const expected = [
  ['panasonic-taiwan-golden-snapper-rice', 'added_dashi', 3, '杯', 'S-PANASONIC-GOLDEN-SNAPPER-1', /米3杯|柴鱼高汤3杯/u],
  ['panasonic-taiwan-five-color-rice', 'added_water', 3, '杯', 'S-PANASONIC-FIVE-COLOR-RICE-1', /虾仁200g|米3杯|水3杯/u],
  ['panasonic-taiwan-mushroom-risotto', 'added_water', 3, '杯', 'S-PANASONIC-MUSHROOM-RISOTTO-1', /白米3杯|水3杯|三种菇/u],
  ['panasonic-taiwan-pumpkin-mushroom-chicken-brown-rice', 'added_water', 2.5, '杯', 'S-PANASONIC-PUMPKIN-MUSHROOM-CHICKEN-BROWN-RICE-1', /糙米2杯|鸡腿200g|水2.5杯/u],
  ['panasonic-taiwan-ginseng-chicken-rice', 'added_water', 500, 'g', 'S-PANASONIC-GINSENG-CHICKEN-1', /米200g|鸡肉200g|热水500g/u],
];
const poultrySafetyClosed = new Set([
  'panasonic-taiwan-pumpkin-mushroom-chicken-brown-rice',
  'panasonic-taiwan-ginseng-chicken-rice',
]);

test('r180 records five exact Panasonic Taiwan liquid contracts', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r246');
  assert.equal(catalog.recipes.length, 923);
  const byId = new Map(catalog.recipes.map(item => [item.recipe_id, item]));
  for (const [id, kind, value, unit, sourceId, locator] of expected) {
    const recipe = byId.get(id);
    assert.ok(recipe, id);
    assert.equal(recipe.status, 'recipe_fact_checked', id);
    assert.deepEqual(recipe.liquid_contract, { kind, amount: { value, unit }, source_ids: [sourceId] }, id);
    assert.equal(recipe.fixed_batch, null, id);
    assert.equal(recipe.time_contract, null, id);
    assert.equal(recipe.safety_endpoints?.length, poultrySafetyClosed.has(id) ? 1 : 0, id);
    const source = recipe.source_refs?.find(item => item.source_id === sourceId);
    assert.ok(source, id);
    assert.ok(source.claim_scopes.includes('liquid'), id);
    assert.match(source.evidence_locator ?? '', locator, id);
    assert.notEqual(recipe.status, 'executable', id);
  }
});

test('r180 preserves Panasonic Taiwan model and scope boundaries', () => {
  const byId = new Map(catalog.recipes.map(item => [item.recipe_id, item]));
  assert.equal(byId.get('panasonic-taiwan-golden-snapper-rice')?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId.get('panasonic-taiwan-five-color-rice')?.cooker_adaptation?.status, 'not_adapted');
  assert.match(byId.get('panasonic-taiwan-pumpkin-mushroom-chicken-brown-rice')?.cooker_adaptation?.notes ?? '', /水量|总时长|机型/u);
  assert.match(byId.get('panasonic-taiwan-ginseng-chicken-rice')?.cooker_adaptation?.notes ?? '', /热水|总时长|机型/u);
});

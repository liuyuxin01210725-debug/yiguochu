import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('r184 records four exact source-backed water and component-liquid contracts', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r190');
  assert.equal(catalog.recipes.length, 923);
  const byId = new Map(catalog.recipes.map(item => [item.recipe_id, item]));
  const expected = [
    ['tiger-usa-autumn-chicken-mushroom-green-bean-pilaf', { kind: 'waterline', waterline: { appliance_model: 'Tiger Tacook', scale: 'source waterline', mark: '3/4' }, source_ids: ['S-TIGER-USA-AUTUMN-PILAF-1'] }, /米.*鸡汤.*水位|Tacook.*水位/u],
    ['toshiba-vegetarian-mixed-brown-rice', { kind: 'waterline', waterline: { appliance_model: 'Toshiba PC-48DRSHK(K)', scale: 'RICE', mark: 2 }, source_ids: ['S-TOSHIBA-VEGETARIAN-MIXED-BROWN-RICE-1'] }, /RICE 2水位|PC-48DRSHK/u],
    ['tvb-octopus-chicken-claypot-rice', { kind: 'rice_to_water_ratio', amount: { value: 1, unit: '米:水' }, source_ids: ['S-TVB-OCTOPUS-CHICKEN-RICE-1'] }, /砂煲米水1:1|大火.*中火/u],
    ['r59-panasonic-taiwan-spanish-seafood-risotto', { kind: 'added_broth', amount: { value: 800, unit: 'mL' }, source_ids: ['S-PANASONIC-TAIWAN-SPANISH-SEAFOOD-RISOTTO-R59'] }, /高汤800mL|分三次加液/u],
  ];
  for (const [id, contract, locator] of expected) {
    const recipe = byId.get(id);
    assert.ok(recipe, id);
    assert.equal(recipe.status, 'recipe_fact_checked', id);
    assert.deepEqual(recipe.liquid_contract, contract, id);
    const source = recipe.source_refs?.find(item => item.source_id === contract.source_ids[0]);
    assert.ok(source, id);
    assert.ok(source.claim_scopes.includes('liquid'), id);
    assert.match(source.evidence_locator ?? '', locator, id);
    assert.notEqual(recipe.status, 'executable', id);
  }
});

test('r184 keeps model, vessel, and staged-liquid boundaries explicit', () => {
  const byId = new Map(catalog.recipes.map(item => [item.recipe_id, item]));
  assert.equal(byId.get('tiger-usa-autumn-chicken-mushroom-green-bean-pilaf')?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId.get('toshiba-vegetarian-mixed-brown-rice')?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId.get('tvb-octopus-chicken-claypot-rice')?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(byId.get('r59-panasonic-taiwan-spanish-seafood-risotto')?.cooker_adaptation?.status, 'source_limited');
  assert.match(byId.get('tiger-usa-autumn-chicken-mushroom-green-bean-pilaf')?.cooker_adaptation?.notes ?? '', /水位|Tacook|机型/u);
  assert.match(byId.get('toshiba-vegetarian-mixed-brown-rice')?.evidence_notes ?? '', /RICE 2|Quick Rice|不外推/u);
  assert.match(byId.get('tvb-octopus-chicken-claypot-rice')?.cooker_adaptation?.notes ?? '', /砂煲|米水1:1|电饭煲/u);
  assert.match(byId.get('r59-panasonic-taiwan-spanish-seafood-risotto')?.evidence_notes ?? '', /分段|800|水|白酒/u);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const expected = [
  ['tiger-sweet-potato-bacon-kombu-rice', 'added_water', 400, 'cc', 'S-TIGER-SWEET-POTATO-BACON-KOMBU-RICE-1', /米2合|水400cc|红薯|培根/u],
  ['zojirushi-endo-gohan', 'added_water', 720, 'mL', 'S-ZOJIRUSHI-ENDO-GOHAN-1', /米3杯|水720mL|豌豆1杯/u],
  ['zojirushi-stamina-rice', 'added_water', 700, 'mL', 'S-ZOJIRUSHI-STAMINA-RICE-1', /米3杯|牛肉150g|水700mL|蛋皮/u],
];

test('r181 records three exact manufacturer liquid contracts', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r229');
  assert.equal(catalog.recipes.length, 923);
  const byId = new Map(catalog.recipes.map(item => [item.recipe_id, item]));
  for (const [id, kind, value, unit, sourceId, locator] of expected) {
    const recipe = byId.get(id);
    assert.ok(recipe, id);
    assert.equal(recipe.status, 'recipe_fact_checked', id);
    assert.deepEqual(recipe.liquid_contract, { kind, amount: { value, unit }, source_ids: [sourceId] }, id);
    assert.equal(recipe.fixed_batch, null, id);
    assert.equal(recipe.safety_endpoints?.length, 0, id);
    const source = recipe.source_refs?.find(item => item.source_id === sourceId);
    assert.ok(source, id);
    assert.ok(source.claim_scopes.includes('liquid'), id);
    assert.match(source.evidence_locator ?? '', locator, id);
    assert.notEqual(recipe.status, 'executable', id);
  }
});

test('r181 preserves manufacturer appliance and staged-topping boundaries', () => {
  const byId = new Map(catalog.recipes.map(item => [item.recipe_id, item]));
  assert.match(byId.get('tiger-sweet-potato-bacon-kombu-rice')?.cooker_adaptation?.notes ?? '', /完整炊煮时长|水量|来源/u);
  assert.equal(byId.get('zojirushi-endo-gohan')?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(byId.get('zojirushi-stamina-rice')?.cooker_adaptation?.status, 'not_adapted');
  assert.match(byId.get('zojirushi-stamina-rice')?.cooker_adaptation?.notes ?? '', /锅外蛋皮|同锅主饭/u);
});

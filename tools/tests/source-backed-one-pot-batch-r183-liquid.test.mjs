import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('r183 records three exact source-backed water contracts', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r229');
  assert.equal(catalog.recipes.length, 923);
  const byId = new Map(catalog.recipes.map(item => [item.recipe_id, item]));
  const expected = [
    ['cookpot-lap-mei-claypot-rice-1200', { kind: 'rice_to_water_ratio', amount: { value: 1, unit: '米:水' }, source_ids: ['S-COOKPOT-LAP-MEI-1200-R62'] }, /米水1:1|煲仔饭模式/u],
    ['tiger-corn-rice', { kind: 'waterline', waterline: { appliance_model: 'Tiger IH电饭煲（页面列出的型号）', scale: 'white_rice', mark: 2 }, source_ids: ['S-R77-TIGER-CORN-RICE'] }, /米2杯|白米2杯水位线|Plain程序/u],
    ['maff-tokushima-sobagome-zosui', { kind: 'added_dashi', amount: { value: 4, unit: '杯' }, source_ids: ['S-MAFF-TOKUSHIMA-SOBAGOME-ZOSUI-1'] }, /4人份|荞麦米120g|出汁4杯|预煮/u],
    ['tatung-pork-jowl-sesame-rice', { kind: 'soaking_liquid', amount: { value: 180, unit: 'ml' }, source_ids: ['S-TATUNG-PORK-JOWL-SESAME-RICE-1'] }, /猪颈肉200g|香菇泡发液180ml|外锅1杯水/u],
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

test('r183 keeps source-specific vessel and nutrition boundaries', () => {
  const byId = new Map(catalog.recipes.map(item => [item.recipe_id, item]));
  assert.equal(byId.get('cookpot-lap-mei-claypot-rice-1200')?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId.get('tiger-corn-rice')?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId.get('tatung-pork-jowl-sesame-rice')?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId.get('maff-tokushima-sobagome-zosui')?.cooker_adaptation?.status, 'not_adapted');
  assert.match(byId.get('cookpot-lap-mei-claypot-rice-1200')?.cooker_adaptation?.notes ?? '', /1:1|机型/u);
  assert.match(byId.get('tiger-corn-rice')?.evidence_notes ?? '', /蛋白质|蔬菜|碳水/u);
  assert.match(byId.get('maff-tokushima-sobagome-zosui')?.cooker_adaptation?.notes ?? '', /预煮|出汁|一键/u);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const validatorModule = await import('../lib/rice-cooker-source-evidence-validator.mjs')
  .catch(error => ({ loadError: error }));

async function loadLedger() {
  return JSON.parse(await readFile(new URL('../data/rice-cooker-source-evidence.v1.json', import.meta.url), 'utf8'));
}

test('machine ledger and fail-closed validator exist', async () => {
  assert.ok(!validatorModule.loadError, `validator must load: ${validatorModule.loadError?.message}`);
  assert.equal(typeof validatorModule.validateRiceCookerSourceEvidence, 'function');
  assert.equal(typeof validatorModule.assertRiceCookerSourceEvidence, 'function');
  assert.ok(await loadLedger());
});

test('ledger validates and pins the six audited source recipes without floating recipe URLs', async () => {
  const ledger = await loadLedger();
  const errors = validatorModule.validateRiceCookerSourceEvidence(ledger);
  assert.deepEqual(errors, []);
  assert.deepEqual(
    ledger.entries.map(entry => entry.source_id).sort(),
    [
      'howtocook-salted-pork-vegetable-rice-b1f0a1a',
      'panasonic-fresh-shiitake-rice-sr-afg',
      'panasonic-mixed-chicken-rice-sr-df151',
      'tatung-sesame-chicken-rice',
      'tatung-shanghai-vegetable-rice',
      'zojirushi-fresh-vegetable-bamboo-rice',
    ],
  );

  const howToCook = ledger.entries.find(entry => entry.source_id.startsWith('howtocook-'));
  assert.match(howToCook.source_url, /blob\/b1f0a1aaba4c86508df1640a2fb8a01e1602c72e\//);
  assert.equal(howToCook.rights.license_name, 'Unlicense');
  assert.equal(howToCook.rights.contribution_permission_url, 'https://github.com/Anduin2017/HowToCook/pull/1717');
});

test('every entry records quantities, liquid semantics, appliance boundary, verdict, and negative claims', async () => {
  const ledger = await loadLedger();
  for (const entry of ledger.entries) {
    assert.ok(entry.quantities.rice, `${entry.source_id}: rice quantity missing`);
    assert.ok(entry.quantities.liquid_contract.semantic, `${entry.source_id}: liquid semantic missing`);
    assert.ok(Array.isArray(entry.quantities.protein_items), `${entry.source_id}: protein quantities missing`);
    assert.ok(Array.isArray(entry.quantities.vegetable_items), `${entry.source_id}: vegetable quantities missing`);
    assert.ok(entry.appliance_profile.profile, `${entry.source_id}: appliance profile missing`);
    assert.ok(['executable_reference', 'research_only'].includes(entry.verdict.status), `${entry.source_id}: invalid verdict`);
    assert.ok(entry.verdict.scope.length > 0, `${entry.source_id}: verdict scope missing`);
    assert.ok(entry.cannot_prove.length > 0, `${entry.source_id}: negative claims missing`);
  }
});

test('liquid semantics distinguish added water, waterline, and inner-vessel liquid', async () => {
  const ledger = await loadLedger();
  const byId = Object.fromEntries(ledger.entries.map(entry => [entry.source_id, entry]));

  assert.equal(byId['howtocook-salted-pork-vegetable-rice-b1f0a1a'].quantities.liquid_contract.semantic, 'added_water_texture_range');
  assert.equal(byId['panasonic-mixed-chicken-rice-sr-df151'].quantities.liquid_contract.semantic, 'added_water_exact');
  assert.equal(byId['panasonic-fresh-shiitake-rice-sr-afg'].quantities.liquid_contract.semantic, 'added_water_exact');
  assert.equal(byId['zojirushi-fresh-vegetable-bamboo-rice'].quantities.liquid_contract.semantic, 'waterline_after_liquid_seasonings');
  assert.equal(byId['tatung-shanghai-vegetable-rice'].quantities.liquid_contract.semantic, 'inner_vessel_total_liquid_with_separate_outer_water');
  assert.equal(byId['tatung-sesame-chicken-rice'].quantities.liquid_contract.semantic, 'inner_vessel_added_water_with_separate_outer_water');
});

test('audited quantities stay attached to the exact source recipe that proves them', async () => {
  const ledger = await loadLedger();
  const byId = Object.fromEntries(ledger.entries.map(entry => [entry.source_id, entry]));

  const howToCook = byId['howtocook-salted-pork-vegetable-rice-b1f0a1a'];
  assert.deepEqual(howToCook.quantities.rice, { value: 300, unit: 'g', servings: 3 });
  assert.deepEqual(howToCook.quantities.liquid_contract.amounts_ml, { firm: 300, default: 310, soft: 325 });
  assert.deepEqual(howToCook.quantities.liquid_contract.conditional_adjustments, [{ when: 'add_winter_bamboo_100g', add_ml: 20 }]);
  assert.equal(howToCook.quantities.protein_items.find(item => item.name === '淡咸肉').quantity.value, 150);
  assert.equal(howToCook.quantities.vegetable_items.find(item => item.name === '上海青').quantity.value, 400);

  const panasonicMixed = byId['panasonic-mixed-chicken-rice-sr-df151'];
  assert.deepEqual(panasonicMixed.quantities.rice, { value: 450, unit: 'g', source_measure: '3 manufacturer cups' });
  assert.deepEqual(panasonicMixed.quantities.liquid_contract.amount, { value: 720, unit: 'ml' });
  assert.equal(panasonicMixed.quantities.protein_items.find(item => item.name === '鸡肉').quantity.value, 80);

  const panasonicMushroom = byId['panasonic-fresh-shiitake-rice-sr-afg'];
  assert.deepEqual(panasonicMushroom.quantities.rice, { value: 150, unit: 'g', source_measure: '1 manufacturer cup' });
  assert.deepEqual(panasonicMushroom.quantities.liquid_contract.amount, { value: 180, unit: 'ml' });
  assert.equal(panasonicMushroom.quantities.vegetable_items.find(item => item.name === '芹菜').quantity.value, 15);

  const zojirushi = byId['zojirushi-fresh-vegetable-bamboo-rice'];
  assert.deepEqual(zojirushi.quantities.rice, { value: 3, unit: 'manufacturer_cup' });
  assert.deepEqual(zojirushi.quantities.liquid_contract.waterline, { scale: 'white_rice', mark: 3 });
  assert.equal(zojirushi.quantities.vegetable_items.find(item => item.name === '竹笋').quantity.value, 100);

  const tatungShanghai = byId['tatung-shanghai-vegetable-rice'];
  assert.deepEqual(tatungShanghai.quantities.liquid_contract.amount, { value: 3.5, unit: 'manufacturer_cup', includes: ['高汤'] });
  assert.equal(tatungShanghai.verdict.status, 'research_only');

  const tatungChicken = byId['tatung-sesame-chicken-rice'];
  assert.deepEqual(tatungChicken.quantities.liquid_contract.amount, { value: 4, unit: 'manufacturer_cup', includes: ['温水'] });
  assert.equal(tatungChicken.quantities.protein_items.find(item => item.name === '鸡腿').quantity.value, 520);
  assert.equal(tatungChicken.verdict.status, 'research_only');
});

test('validator fails closed when evidence boundaries are removed or liquid types are conflated', async () => {
  const ledger = await loadLedger();
  const invalid = structuredClone(ledger);
  invalid.entries[0].cannot_prove = [];
  invalid.entries[1].quantities.liquid_contract.semantic = 'added_water_exact';
  invalid.entries[1].quantities.liquid_contract.amount = null;
  invalid.entries[2].rights.usage_boundary = '';

  const errors = validatorModule.validateRiceCookerSourceEvidence(invalid);
  assert.ok(errors.some(error => error.includes('cannot_prove')));
  assert.ok(errors.some(error => error.includes('added_water_exact requires amount')));
  assert.ok(errors.some(error => error.includes('usage_boundary')));
});

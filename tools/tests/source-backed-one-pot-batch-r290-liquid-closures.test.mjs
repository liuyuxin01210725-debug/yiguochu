import assert from 'node:assert/strict';
import test from 'node:test';
import catalog from '../data/source-backed-one-pot-recipes.v1.json' with { type: 'json' };

const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

test('r290 closes five exact liquid contracts without changing recipe count', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);

  assert.deepEqual(byId['tatung-oyster-mountain-vegetable-rice'].liquid_contract, {
    kind: 'added_dashi',
    amount: { value: 300, unit: 'mL（基础高汤；牡蛎蒸汁另行保留）' },
    source_ids: ['S-TATUNG-OYSTER-MOUNTAIN-RICE-1'],
  });
  assert.deepEqual(byId['zojirushi-seafood-paella'].liquid_contract, {
    kind: 'added_steam_juice',
    amount: { value: 720, unit: 'mL（海鲜蒸汁）' },
    source_ids: ['S-ZOJIRUSHI-SEAFOOD-PAELLA-1'],
  });
  assert.deepEqual(byId['taiwan-tea-oil-vegetable-health-rice'].liquid_contract, {
    kind: 'added_water',
    amount: { value: 2, unit: '米杯（内锅；外锅另加1米杯）' },
    source_ids: ['S-TW-RICE-EDUCATION-TEA-OIL-VEGETABLE-1'],
  });
  assert.deepEqual(byId['panasonic-taiwan-mushroom-chicken-bamboo-rice'].liquid_contract, {
    kind: 'added_liquid',
    amount: { value: 2.5, unit: '杯（腌汁0.5+清水2）' },
    source_ids: ['S-PANASONIC-MUSHROOM-CHICKEN-BAMBOO-1'],
  });
  assert.deepEqual(byId['philips-soy-milk-chicken-congee'].liquid_contract, {
    kind: 'composite_liquid',
    amount: { value: 6, unit: '杯（豆浆1+水5）' },
    components: [
      { name: '豆浆', amount: { value: 1, unit: '杯' }, source_ids: ['S-PHILIPS-SOY-MILK-CHICKEN-CONGEE-1'] },
      { name: '水', amount: { value: 5, unit: '杯' }, source_ids: ['S-PHILIPS-SOY-MILK-CHICKEN-CONGEE-1'] },
    ],
    source_ids: ['S-PHILIPS-SOY-MILK-CHICKEN-CONGEE-1'],
  });
});

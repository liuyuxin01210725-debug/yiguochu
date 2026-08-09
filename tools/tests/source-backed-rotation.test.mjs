import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  nextSourceRecipe,
  rotatableSourceRecipes,
  sourceRotationRegionPriority,
  sourceRotationRegionLabel,
  sourceRotationFamilyLabel,
  sourceRotationDisplayName,
  isSourceRotationEligible,
  sourceRotationLabel,
} from '../lib/source-backed-rotation.mjs';

const shelf = JSON.parse(fs.readFileSync(new URL('../../dist/source-backed-one-pot-shelf.v1.json', import.meta.url), 'utf8'));

test('rotation uses recipe records with fixed quantities and steps, not archive-only records', () => {
  const records = rotatableSourceRecipes(shelf);

  assert.equal(records.length, 317);
  assert.ok(records.every(record => ['A', 'B'].includes(record.shelf)));
  assert.ok(records.every(record => record.fixed_batch?.ingredients?.length));
  assert.ok(records.every(record => record.cooking_sequence?.length));
  assert.ok(records.every(record => !/酸香主食锅|家常焖饭|按食材/u.test(record.canonical_name)));
  const excludedIds = [
    'tatung-seafood-porridge',
    'macau-lettuce-fishball-porridge',
    'taiwan-brown-rice-sishen-porridge',
    'taiwan-sliding-egg-sweet-potato-vegetable-porridge',
    'taiwan-pork-liver-spinach-porridge',
    'r61-tiger-multigrain-medicinal-porridge',
    'maff-gifu-ayu-zosui',
    'maff-salmon-okra-mixed-rice',
    'maff-komatsuna-sausage-mixed-rice',
    'panasonic-nara-chagayu-nf-ac1000',
    'panasonic-my-century-egg-chicken-congee',
    'hk-mushroom-grass-carp-congee',
    'hk-golden-seafood-congee',
  ];
  assert.ok(records.every(record => !excludedIds.includes(record.recipe_id)));
});

test('rotation preserves original source-backed name and does not create a synthetic title', () => {
  const records = rotatableSourceRecipes(shelf);
  const first = records[0];

  assert.equal(first.canonical_name, '冬菇滑鸡饭');
  assert.equal(sourceRotationLabel(first), '可直接试做（来源已核对）');
  assert.equal(nextSourceRecipe(records, first.recipe_id).recipe_id, records[1].recipe_id);
});

test('rotation removes archival prefecture brackets from the user-facing title', () => {
  assert.equal(sourceRotationDisplayName({ canonical_name: '〖愛媛県ご当地メニュー〗鯛めし' }), '鯛めし');
  assert.equal(sourceRotationDisplayName({ canonical_name: '上海咸肉菜饭' }), '上海咸肉菜饭');
});

test('rotation prioritizes Chinese regional rice meals before Japanese records', () => {
  const records = rotatableSourceRecipes(shelf);
  assert.ok(records.slice(0, 5).every(record => record.region_codes?.some(code => /^CN(?:-|$)/.test(code))));
  assert.ok(sourceRotationRegionPriority(records[0]) < sourceRotationRegionPriority({ region_codes:['JP'] }));
  assert.ok(sourceRotationRegionPriority({ region_codes:['TW'] }) < sourceRotationRegionPriority({ region_codes:['JP'] }));
});

test('rotation puts Chinese-readable titles before Japanese-script titles within one region', () => {
  const make = (recipe_id, canonical_name) => ({
    recipe_id,
    canonical_name,
    region_codes: ['TW'],
    shelf: 'B',
    fixed_batch: { ingredients: [{ name: '米', amount: { value: 1, unit: '杯' } }] },
    cooking_sequence: [{ instruction: '煮熟' }],
  });
  const records = rotatableSourceRecipes({ records: [
    make('jp-title', '背徳のガリバタ飯'),
    make('zh-title', '大同高麗菜飯'),
  ] });
  assert.deepEqual(records.map(record => record.recipe_id), ['zh-title', 'jp-title']);
});

test('rotation keeps Chinese titles without a region ahead of Japanese vendor records', () => {
  const make = (recipe_id, canonical_name, region_codes = []) => ({
    recipe_id,
    canonical_name,
    region_codes,
    shelf: 'B',
    fixed_batch: { ingredients: [{ name: '米', amount: { value: 1, unit: '杯' } }] },
    cooking_sequence: [{ instruction: '煮熟' }],
  });
  const records = rotatableSourceRecipes({ records: [
    make('jp-vendor', '鯛めし', ['JP']),
    make('unassigned-cn', '腊味菜饭'),
  ]});
  assert.deepEqual(records.map(record => record.recipe_id), ['unassigned-cn', 'jp-vendor']);
});

test('rotation prefers signed Chinese-region records before trial records in the same region', () => {
  const make = (recipe_id, shelf, canonical_name) => ({
    recipe_id,
    canonical_name,
    region_codes: ['CN-SH'],
    shelf,
    fixed_batch: { ingredients: [{ name: '米', amount: { value: 1, unit: '杯' } }] },
    cooking_sequence: [{ instruction: '煮熟' }],
  });
  const records = rotatableSourceRecipes({ records: [
    make('trial', 'B', '上海家常菜饭'),
    make('signed', 'A', '上海咸肉菜饭'),
  ]});
  assert.deepEqual(records.map(record => record.recipe_id), ['signed', 'trial']);
});

test('rotation labels expose human-readable region and family names', () => {
  assert.equal(sourceRotationRegionLabel({ region_codes: ['CN-SH'] }), '上海');
  assert.equal(sourceRotationRegionLabel({ region_codes: ['TW'] }), '台湾');
  assert.equal(sourceRotationFamilyLabel({ cuisine_family: 'jiangnan-vegetable-rice' }), '江南菜饭');
  assert.equal(sourceRotationFamilyLabel({ cuisine_family: 'manufacturer-rice-cooker-recipes' }), '厂商电饭煲食谱');
  assert.equal(sourceRotationFamilyLabel({ cuisine_family: 'unlisted-internal-slug' }), '来源记录的菜饭');
});

test('generic manufacturer families cannot smuggle an explicitly excluded porridge title into rotation', () => {
  assert.equal(isSourceRotationEligible({
    recipe_id: 'future-manufacturer-porridge',
    cuisine_family: 'manufacturer-rice-cooker-recipes',
    canonical_name: '新款海鲜粥',
    aliases: ['Seafood congee'],
  }), false);
});

test('rotation wraps to the first source recipe after the last one', () => {
  const records = rotatableSourceRecipes(shelf);
  const last = records.at(-1);

  assert.equal(nextSourceRecipe(records, last.recipe_id).recipe_id, records[0].recipe_id);
});

test('unknown current id starts at the first source recipe', () => {
  const records = rotatableSourceRecipes(shelf);
  assert.equal(nextSourceRecipe(records, 'missing').recipe_id, records[0].recipe_id);
  assert.equal(nextSourceRecipe([], 'missing'), null);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

test('r158 closes only same-source MAFF batch and liquid fields', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r160');
  assert.equal(catalog.recipes.length, 923);

  const nara = byId['maff-kanagawa-narachameshi'];
  assert.ok(nara);
  assert.equal(nara.status, 'recipe_fact_checked');
  assert.deepEqual(nara.fixed_batch, {
    servings: 4,
    ingredients: [
      { name: '米', amount: { value: 3, unit: '合' }, source_ids: ['S-MAFF-KANAGAWA-NARACHAMESHI-R65'] },
      { name: '煎茶或焙茶', amount: { value: 500, unit: 'mL' }, source_ids: ['S-MAFF-KANAGAWA-NARACHAMESHI-R65'] },
      { name: '炒大豆', amount: { value: 30, unit: 'g' }, source_ids: ['S-MAFF-KANAGAWA-NARACHAMESHI-R65'] },
      { name: '栗', amount: { value: 100, unit: 'g' }, source_ids: ['S-MAFF-KANAGAWA-NARACHAMESHI-R65'] },
      { name: '盐', amount: { value: 1, unit: '小匙' }, source_ids: ['S-MAFF-KANAGAWA-NARACHAMESHI-R65'] },
    ],
    source_ids: ['S-MAFF-KANAGAWA-NARACHAMESHI-R65'],
  });
  assert.deepEqual(nara.liquid_contract, {
    kind: 'added_liquid',
    amount: { value: 500, unit: 'mL' },
    source_ids: ['S-MAFF-KANAGAWA-NARACHAMESHI-R65'],
  });
  assert.equal(nara.time_contract, null);

  const whale = byId['maff-shimane-kujira-gohan'];
  assert.ok(whale);
  assert.equal(whale.status, 'recipe_fact_checked');
  assert.equal(whale.fixed_batch.servings, 4);
  assert.equal(whale.fixed_batch.ingredients.find(({ name }) => name === '米').amount.value, 2);
  assert.deepEqual(whale.liquid_contract, {
    kind: 'rice_to_water_ratio',
    amount: { value: 1, unit: '份水/份米' },
    source_ids: ['S-MAFF-SHIMANE-KUJIRA-GOHAN-1'],
  });
  assert.equal(whale.time_contract, null);
  const whaleSource = whale.source_refs.find(({ source_id: id }) => id === 'S-MAFF-SHIMANE-KUJIRA-GOHAN-1');
  assert.ok(whaleSource.claim_scopes.includes('quantity'));
  assert.ok(whaleSource.claim_scopes.includes('liquid'));

  const fukui = byId['maff-fukui-chameshi'];
  assert.ok(fukui);
  assert.equal(fukui.status, 'recipe_fact_checked');
  assert.equal(fukui.fixed_batch.servings, 20);
  assert.equal(fukui.fixed_batch.ingredients.find(({ name }) => name === '糯米').amount.value, 6);
  assert.deepEqual(fukui.liquid_contract, {
    kind: 'added_liquid',
    amount: { value: 1500, unit: 'mL' },
    source_ids: ['S-MAFF-FUKUI-CHAMESHI-1'],
  });
  assert.equal(fukui.time_contract, null);
  const fukuiSource = fukui.source_refs.find(({ source_id: id }) => id === 'S-MAFF-FUKUI-CHAMESHI-1');
  assert.ok(fukuiSource.claim_scopes.includes('quantity'));

  const ehime = byId['maff-ehime-shoyu-meshi'];
  assert.ok(ehime);
  assert.equal(ehime.status, 'recipe_fact_checked');
  assert.equal(ehime.fixed_batch.servings, 4);
  assert.equal(ehime.fixed_batch.ingredients.find(({ name }) => name === '鸡肉').amount.value, 150);
  assert.equal(ehime.liquid_contract, null);
  assert.equal(ehime.time_contract, null);
  const ehimeSource = ehime.source_refs.find(({ source_id: id }) => id === 'S-MAFF-EHIME-SHOYU-MESHI-1');
  assert.ok(ehimeSource.claim_scopes.includes('quantity'));
});

test('r158 keeps the four MAFF entries non-executable and preserves boundaries', () => {
  for (const id of [
    'maff-kanagawa-narachameshi',
    'maff-shimane-kujira-gohan',
    'maff-fukui-chameshi',
    'maff-ehime-shoyu-meshi',
  ]) {
    assert.notEqual(byId[id].status, 'executable', `${id} must remain non-executable`);
  }
  assert.equal(byId['maff-kanagawa-narachameshi'].cooker_adaptation.status, 'source_limited');
  assert.equal(byId['maff-shimane-kujira-gohan'].cooker_adaptation.status, 'not_adapted');
  assert.equal(byId['maff-fukui-chameshi'].cooker_adaptation.status, 'source_limited');
  assert.equal(byId['maff-ehime-shoyu-meshi'].cooker_adaptation.status, 'not_adapted');
});

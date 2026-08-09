import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const expected = [
  ['maff-kanagawa-ume-gohan', 'added_dashi', 720, 'cc', 'S-MAFF-KANAGAWA-UME-GOHAN-1', /5至6人份|720ccだし汁|浸泡炊饭/u],
  ['panasonic-taiwan-truffle-seafood-risotto', 'added_broth', 150, 'g', 'S-PANASONIC-TRUFFLE-SEAFOOD-1', /义大利米200g|高汤150g|蛤蜊5只|虾6只/u],
  ['panasonic-taiwan-shiitake-bamboo-chicken-rice', 'added_water', 1.5, '杯', 'S-PANASONIC-SHIITAKE-BAMBOO-1', /香菇水1.5杯|竹笋300g|鸡肉与具材先炒/u],
  ['r60-tiger-shiitake-garlic-rice', 'added_broth', 2, '杯', 'S-TIGER-SHIITAKE-GARLIC-RICE-R60', /2杯糙米|400克香菇|2杯高汤|Brown程序/u],
];

test('r182 records four exact source-backed liquid contracts', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r243');
  assert.equal(catalog.recipes.length, 923);
  const byId = new Map(catalog.recipes.map(item => [item.recipe_id, item]));
  for (const [id, kind, value, unit, sourceId, locator] of expected) {
    const recipe = byId.get(id);
    assert.ok(recipe, id);
    assert.equal(recipe.status, 'recipe_fact_checked', id);
    assert.deepEqual(recipe.liquid_contract, { kind, amount: { value, unit }, source_ids: [sourceId] }, id);
    assert.equal(recipe.fixed_batch, null, id);
    assert.equal(recipe.time_contract, null, id);
    const source = recipe.source_refs?.find(item => item.source_id === sourceId);
    assert.ok(source, id);
    assert.ok(source.claim_scopes.includes('liquid'), id);
    assert.match(source.evidence_locator ?? '', locator, id);
    assert.notEqual(recipe.status, 'executable', id);
  }
});

test('r182 keeps appliance, staging, and safety boundaries unchanged', () => {
  const byId = new Map(catalog.recipes.map(item => [item.recipe_id, item]));
  assert.equal(byId.get('maff-kanagawa-ume-gohan')?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(byId.get('panasonic-taiwan-truffle-seafood-risotto')?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId.get('r60-tiger-shiitake-garlic-rice')?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId.get('panasonic-taiwan-shiitake-bamboo-chicken-rice')?.safety_endpoints?.length, 1);
  assert.match(byId.get('panasonic-taiwan-shiitake-bamboo-chicken-rice')?.cooker_adaptation?.notes ?? '', /先炒|电饭锅/u);
});

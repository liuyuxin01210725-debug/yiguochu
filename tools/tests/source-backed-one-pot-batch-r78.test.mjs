import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

const expected = [
  ['iris-kpc-ma2-tai-meshi', '鯛飯', 'recipe_fact_checked'],
  ['iris-pc-mb3-ikameshi', 'いかめし', 'recipe_fact_checked'],
  ['iris-kpc-rema3-takikomi-rice', '炊き込みご飯', 'recipe_fact_checked'],
];

test('r78 records three direct Iris Ohyama rice-meal candidates without promoting research', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260806-national-r86');
  assert.equal(catalog.recipes.length, 748);
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.equal(recipe?.identity_status, 'verified', recipeId);
    assert.equal(recipe?.cuisine_family, 'manufacturer-rice-cooker-recipes', recipeId);
    assert.deepEqual(recipe?.region_codes, [], recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.evidence_locator === 'string' && source.evidence_locator.length > 0), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.attribution === 'string' && source.attribution.length > 0), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.license === 'string' && source.license.length > 0), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r78 preserves each Iris appliance contract and does not merge source variants', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

  const tai = byId.get('iris-kpc-ma2-tai-meshi');
  assert.equal(tai.cooker_adaptation.status, 'source_limited');
  assert.match(tai.traditional_vessels.join(' '), /KPC-MA2/);
  assert.equal(tai.fixed_batch, null);
  assert.match(tai.source_refs[0].evidence_locator, /300g|2合/);
  assert.deepEqual(tai.liquid_contract.amount, { value: 320, unit: 'mL' });
  assert.match(tai.cooking_sequence.map(step => step.instruction).join(' '), /鲷|排气|白米/);
  assert.equal(tai.time_contract.total_minutes, 75);

  const ika = byId.get('iris-pc-mb3-ikameshi');
  assert.equal(ika.cooker_adaptation.status, 'source_limited');
  assert.match(ika.traditional_vessels.join(' '), /PC-MB3-H/);
  assert.equal(ika.liquid_contract.amount.value, 400);
  assert.equal(ika.liquid_contract.amount.unit, 'mL');
  assert.match(ika.cooking_sequence.map(step => step.instruction).join(' '), /一半|胀裂|糯米/);
  assert.equal(ika.safety_endpoints[0].code, 'seafood_fully_cooked');

  const takikomi = byId.get('iris-kpc-rema3-takikomi-rice');
  assert.equal(takikomi.cooker_adaptation.status, 'source_limited');
  assert.match(takikomi.traditional_vessels.join(' '), /KPC-REMA3/);
  assert.equal(takikomi.fixed_batch, null);
  assert.equal(takikomi.liquid_contract.waterline.mark, 2);
  assert.equal(takikomi.time_contract.total_minutes, 55);
  assert.match(takikomi.cooking_sequence.map(step => step.instruction).join(' '), /水位线|压力|牛蒡|鸡胸/);
  assert.match(takikomi.evidence_notes, /普通电饭煲|型号|不外推/);
});

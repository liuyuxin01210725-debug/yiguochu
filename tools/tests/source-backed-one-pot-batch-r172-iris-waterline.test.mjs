import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find(item => item.recipe_id === 'iris-hijiki-tuna-mixed-rice');

test('r172 records the IRIS RC-PGA50 model-scoped waterline', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r230');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.liquid_contract, {
    kind: 'waterline',
    waterline: { appliance_model: 'IRIS OHYAMA RC-PGA50', scale: 'white_rice', mark: 2 },
    source_ids: ['S-IRIS-HIJIKI-TUNA-MIXED-RICE-1'],
  });
  assert.equal(recipe.fixed_batch, null);
  assert.equal(recipe.time_contract?.total_minutes, 55);
  assert.equal(recipe.cooker_adaptation?.status, 'source_limited');
  assert.match(recipe.cooker_adaptation?.notes ?? '', /RC-PGA50|不换算为通用毫升/u);
});

test('r172 keeps the IRIS waterline source and tuna boundary exact', () => {
  const source = recipe?.source_refs?.find(item => item.source_id === 'S-IRIS-HIJIKI-TUNA-MIXED-RICE-1');
  assert.ok(source);
  assert.ok(source.claim_scopes.includes('liquid'));
  assert.match(source.evidence_locator ?? '', /RC-PGA50|米2合|55分钟/u);
  assert.match(recipe?.cooking_sequence?.[0]?.instruction ?? '', /白米2合水位线/u);
  assert.deepEqual(recipe?.safety_endpoints, []);
});

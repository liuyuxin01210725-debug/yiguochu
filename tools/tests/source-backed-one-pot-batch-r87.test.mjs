import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

test('r87 records Panasonic Taiwan gyudon onion takikomi rice as a model-scoped named recipe', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r152');
  assert.equal(catalog.recipes.length, 923);
  const recipe = catalog.recipes.find(item => item.recipe_id === 'panasonic-taiwan-gyudon-onion-takikomi-rice');
  assert.equal(recipe?.canonical_name, '牛丼洋蔥炊飯');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.fixed_batch?.servings, 2);
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.equal(recipe?.liquid_contract?.waterline?.appliance_model, 'Panasonic SR-PAA100');
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.ok(recipe?.evidence_notes?.includes('不证明传统日本牛丼身份'));
});

test('r87 records Kashgar Nowruz rice as an identity-only regional entry', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const recipe = catalog.recipes.find(item => item.recipe_id === 'kashgar-nowruz-rice');
  assert.equal(recipe?.canonical_name, '诺鲁孜饭');
  assert.equal(recipe?.status, 'identity_verified');
  assert.deepEqual(recipe?.core_ingredients, []);
  assert.deepEqual(recipe?.cooking_sequence, []);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.match(recipe?.evidence_notes ?? '', /七种|不补写|身份/u);
});

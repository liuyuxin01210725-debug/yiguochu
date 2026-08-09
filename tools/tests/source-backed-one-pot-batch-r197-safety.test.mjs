import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const cdcSafetySourceId = 'S-SAFETY-SEAFOOD-GENERAL-CDC-1';

const temperatureIds = [
  'hk-golden-seafood-congee',
  'maff-aichi-tako-meshi',
  'maff-okayama-tako-meshi',
  'jp-mie-tako-meshi',
  'maff-yamaguchi-uni-meshi',
  'tiger-uni-rice',
];

test('r197 closes directly evidenced raw seafood and roe safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r240');
  for (const recipeId of temperatureIds) {
    const recipe = byId[recipeId];
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.deepEqual(recipe.safety_endpoints, [{
      code: 'seafood_fully_cooked',
      minimum_core_temperature_c: 63,
      source_ids: [cdcSafetySourceId],
    }], recipeId);
    const source = recipe.source_refs.find(row => row.source_id === cdcSafetySourceId);
    assert.ok(source, `${recipeId} missing CDC safety source`);
    assert.equal(source.access_status, 'opened', recipeId);
    assert.equal(source.evidence_tier, 1, recipeId);
    assert.match(source.evidence_locator, /seafood|63|145|squid|fish/u, recipeId);
    assert.deepEqual(source.claim_scopes, ['safety'], recipeId);
  }
});

test('r197 closes the shucked-clam visual gap without changing the staged MAFF process', () => {
  const recipe = byId['maff-ibaraki-hamaguri-gohan'];
  assert.ok(recipe);
  assert.deepEqual(recipe.safety_endpoints, [{
    code: 'shellfish_fully_cooked',
    visual_endpoint: '蛤蜊肉边缘卷曲、肉质饱满且不透明',
    source_ids: ['S-SAFETY-SHUCKED-CLAM-VDH-1', 'S-SAFETY-CLAM-FDACS-1'],
  }]);
  for (const sourceId of ['S-SAFETY-SHUCKED-CLAM-VDH-1', 'S-SAFETY-CLAM-FDACS-1']) {
    const source = recipe.source_refs.find(row => row.source_id === sourceId);
    assert.ok(source, `${recipe.recipe_id} missing ${sourceId}`);
    assert.equal(source.access_status, 'opened', sourceId);
    assert.equal(source.evidence_tier, 1, sourceId);
    assert.deepEqual(source.claim_scopes, ['safety'], sourceId);
  }
  assert.match(recipe.cooking_sequence?.[2]?.instruction ?? '', /蛤蜊|焖/u);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const catalogPath = join(here, '..', 'data', 'source-backed-one-pot-recipes.v1.json');

const expected = [
  ['maff-satoimo-takana-takikomi-gohan', 'recipe_fact_checked'],
  ['maff-air-buri-daikon-daikon-meshi', 'recipe_fact_checked'],
  ['maff-beef-mushroom-yolk-rice', 'recipe_fact_checked'],
  ['maff-satoimo-rice', 'recipe_fact_checked'],
  ['maff-irogohan-nara', 'recipe_fact_checked'],
  ['kagoshima-ginger-takikomi-gohan', 'recipe_fact_checked'],
  ['kochi-nakamura-mushroom-ginkgo-takikomi', 'recipe_fact_checked'],
  ['tokyo-hachijo-tokobushi-takikomi', 'recipe_fact_checked'],
  ['wakayama-ayu-takikomi', 'recipe_fact_checked'],
  ['ntpc-red-quinoa-sesame-chicken-rice', 'recipe_fact_checked'],
  ['maff-salmon-green-onion-takikomi', 'recipe_fact_checked'],
  ['maff-kingyo-meshi', 'recipe_fact_checked'],
  ['maff-tofumeshi', 'recipe_fact_checked'],
  ['wakayama-usuendo-mame-gohan', 'recipe_fact_checked'],
  ['ningshan-liangcanzi-dry-rice', 'identity_verified'],
  ['zhengning-braised-rice', 'identity_verified'],
  ['heizhe-lala-millet-corn-porridge', 'recipe_fact_checked'],
  ['xinzhou-fragrant-rice-pot-crust-rice', 'identity_verified'],
  ['taicang-seafood-pot-crust-rice', 'identity_verified'],
  ['yuping-gongmi-pot-crust-rice', 'identity_verified'],
  ['pinghe-luxi-salted-vegetable-rice', 'identity_verified'],
  ['cookpot-lap-mei-claypot-rice-1200', 'recipe_fact_checked'],
  ['cookpot-hainan-chicken-quinoa-rice-1000', 'recipe_fact_checked'],
  ['cookpot-century-egg-pork-congee-704', 'recipe_fact_checked'],
  ['tiger-post-196-gomoku-rice', 'recipe_fact_checked'],
];

test('r62 collection batch is source-backed, bounded, and not auto-promoted', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-national-r62');
  assert.equal(catalog.recipes.length, 509);
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  for (const [recipeId, status] of expected) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, status, recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
    assert.ok(recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every(source => Array.isArray(source.claim_scopes)), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients), recipeId);
    if (status === 'identity_verified') {
      assert.deepEqual(recipe.cooking_sequence, [], recipeId);
      assert.equal(recipe.fixed_batch, null, recipeId);
      assert.equal(recipe.liquid_contract, null, recipeId);
      assert.equal(recipe.time_contract, null, recipeId);
      assert.deepEqual(recipe.safety_endpoints, [], recipeId);
    }
  }
  assert.equal(byId.has('hjs-diqidan-haocaifan'), false, '洪江名称变体必须先去重，不得自动新建');
});

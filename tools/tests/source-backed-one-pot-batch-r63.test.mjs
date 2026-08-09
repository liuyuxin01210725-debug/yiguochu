import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const catalogPath = join(here, '..', 'data', 'source-backed-one-pot-recipes.v1.json');

const expected = [
  ['tiger-brown-rice-curry-pilaf', 'recipe_fact_checked'],
  ['iris-hijiki-tuna-mixed-rice', 'recipe_fact_checked'],
  ['iris-cooking-kettle-saba-canned-rice', 'recipe_fact_checked'],
  ['iris-cotoco-corn-mixed-rice', 'recipe_fact_checked'],
  ['iris-chinese-chicken-congee', 'recipe_fact_checked'],
  ['iris-rc-pga-paella', 'recipe_fact_checked'],
  ['iris-rc-pga-chicken-rice', 'recipe_fact_checked'],
  ['maff-miyazaki-toukibimeshi', 'recipe_fact_checked'],
  ['maff-aichi-kiinai-okowa', 'recipe_fact_checked'],
  ['maff-hokkaido-ikameshi', 'recipe_fact_checked'],
  ['maff-oita-torimeshi', 'recipe_fact_checked'],
  ['maff-chiba-toridose', 'recipe_fact_checked'],
  ['maff-tokushima-omiisan', 'recipe_fact_checked'],
  ['maff-tokushima-sobagome-zosui', 'recipe_fact_checked'],
  ['maff-tokushima-ayuro-sui', 'recipe_fact_checked'],
  ['maff-kagawa-shima-chagayu', 'recipe_fact_checked'],
  ['maff-mie-chagayu', 'recipe_fact_checked'],
  ['wuhu-zharou-steamed-rice', 'identity_verified'],
  ['youxi-jiumi-salty-rice', 'identity_verified'],
  ['xinyang-green-rice', 'identity_verified'],
  ['xuwen-eight-treasure-rice', 'recipe_fact_checked'],
  ['jiangchuan-eight-treasure-rice', 'recipe_fact_checked'],
];

test('r63 collection batch is source-backed, bounded, and not auto-promoted', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r229');
  assert.equal(catalog.recipes.length, 923);
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
  }
  assert.equal(byId.has('panasonic-yamagata-imoni-takikomi-rice'), true, 'already catalogued Panasonic variant must not be duplicated');
  assert.equal(byId.has('hjs-diqidan-haocaifan'), false, '洪江名称变体必须先去重，不得自动新建');
});

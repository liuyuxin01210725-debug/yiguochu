import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const catalogPath = join(here, '..', 'data', 'source-backed-one-pot-recipes.v1.json');

const expected = [
  ['midea-shiitake-lapcheong-rice', 'recipe_fact_checked'],
  ['philips-soy-milk-chicken-congee', 'recipe_fact_checked'],
  ['panasonic-taiwan-cabbage-mackerel-rice', 'recipe_fact_checked'],
  ['panasonic-taiwan-quinoa-brown-rice-olive-rice', 'recipe_fact_checked'],
  ['panasonic-taiwan-sweet-potato-congee', 'recipe_fact_checked'],
  ['panasonic-taiwan-chestnut-rice-steam-oven', 'recipe_fact_checked'],
  ['panasonic-taiwan-spanish-seafood-risotto-breadmaker', 'recipe_fact_checked'],
  ['tiger-tuscan-bean-brown-rice-soup', 'recipe_fact_checked'],
  ['maff-yamanashi-amanatto-sekihan', 'recipe_fact_checked'],
  ['maff-shizuoka-someimeshi', 'recipe_fact_checked'],
  ['maff-shimane-uzume-meshi', 'recipe_fact_checked'],
  ['maff-kochi-koshimeshi', 'recipe_fact_checked'],
  ['maff-kumamoto-mazemeshi', 'recipe_fact_checked'],
  ['maff-tokushima-irimeshi', 'recipe_fact_checked'],
  ['maff-tokushima-houhan', 'recipe_fact_checked'],
  ['maff-akita-tenko-azuki-sekihan', 'recipe_fact_checked'],
  ['maff-hiroshima-anagomeshi', 'recipe_fact_checked'],
  ['guangzhou-zengcheng-she-wufan', 'recipe_fact_checked'],
  ['kizilsu-polo-pilaf', 'recipe_fact_checked'],
  ['changning-kas-dai-bamboo-rice', 'identity_verified'],
  ['motuo-menluo-red-rice-stonepot-chicken-hand-grab', 'recipe_fact_checked'],
  ['wulong-dingpot-sticky-rice-kongfan', 'identity_verified'],
  ['xinjiang-egg-pilaf', 'recipe_fact_checked'],
  ['yuping-dong-sticky-rice', 'identity_verified'],
  ['baise-zhuang-five-color-sticky-rice', 'recipe_fact_checked'],
  ['wuming-zhuang-five-color-sticky-rice', 'recipe_fact_checked'],
];

test('r64 collection batch is source-backed, bounded, and not auto-promoted', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r236');
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
  assert.equal(byId.has('panasonic-yamagata-imoni-takikomi-rice'), true, '已有 Panasonic 版本不得重复');
  assert.equal(byId.has('hjs-diqidan-haocaifan'), false, '洪江名称变体必须先去重');
});

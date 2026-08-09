import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const catalogPath = join(here, '..', 'data', 'source-backed-one-pot-recipes.v1.json');

const expected = [
  ['maff-wakayama-shouga-meshi', 'recipe_fact_checked'],
  ['maff-kanagawa-narachameshi', 'recipe_fact_checked'],
  ['maff-ishikawa-mitama', 'recipe_fact_checked'],
  ['maff-saga-kuri-okowa', 'recipe_fact_checked'],
  ['maff-hiroshima-uomeshi', 'recipe_fact_checked'],
  ['maff-tokyo-fukagawa-meshi', 'recipe_fact_checked'],
  ['maff-fukushima-harako-meshi', 'recipe_fact_checked'],
  ['midea-mixed-lapcheong-rice-26183', 'recipe_fact_checked'],
  ['tiger-spinach-chickpea-curry-rice', 'recipe_fact_checked'],
  ['tiger-clam-tomato-rice', 'recipe_fact_checked'],
  ['tiger-salmon-mushroom-rice-pilaf', 'recipe_fact_checked'],
  ['tiger-jambalaya-rice-cooker', 'recipe_fact_checked'],
  ['tiger-hainanese-chicken-rice', 'recipe_fact_checked'],
  ['tiger-jujube-chicken-fillet-rice', 'recipe_fact_checked'],
  ['tiger-pork-napa-mille-feuille-mushroom-rice', 'recipe_fact_checked'],
  ['tiger-oyakodon-tacook', 'recipe_fact_checked'],
  ['tiger-edamame-carrot-rice-soup', 'recipe_fact_checked'],
  ['rongjiang-dong-three-treasure-sister-rice', 'recipe_fact_checked'],
  ['tujia-jinbaoyin-corn-rice', 'recipe_fact_checked'],
  ['zhangjiajie-cured-meat-claypot-rice', 'identity_verified'],
  ['lengshuijiang-bozifan', 'recipe_fact_checked'],
  ['taishan-eel-claypot-rice', 'recipe_fact_checked'],
];

test('r65 collection batch is source-backed, bounded, and not auto-promoted', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r249');
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
  assert.equal(byId.has('xifeng-yellow-millet-braised-rice'), false, 'regional refinement must not fork an existing identity');
  assert.equal(byId.has('shandan-niuwazi-rice'), false, 'dough-and-broth food stays outside rice-first catalog');
  assert.equal(byId.has('jixi-huizhou-yipinguo'), false, 'non-rice one-pot dish stays outside rice-first catalog');
  assert.equal(byId.has('fanshi-braised-meat-noodles'), false, 'noodle dish stays outside rice-first catalog');
});

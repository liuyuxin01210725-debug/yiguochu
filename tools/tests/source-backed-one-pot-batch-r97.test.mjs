import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

test('r97 adds newly verified one-pot rice candidates without promoting incomplete evidence', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r167');
  assert.equal(catalog.recipes.length, 923);
  const expected = [
    ['r97-panasonic-taiwan-shiitake-oil-rice', '香菇油飯', 'recipe_fact_checked'],
    ['r97-panasonic-taiwan-cinderella-pumpkin-risotto', '灰姑娘南瓜馬車燉飯', 'recipe_fact_checked'],
    ['r97-panasonic-taiwan-green-sauce-chicken-risotto', '青醬嫩雞燉飯', 'recipe_fact_checked'],
    ['r97-anyang-an-yuan-bamboo-tube-rice', '安远竹筒饭', 'recipe_fact_checked'],
    ['r97-kaiping-crucian-carp-baked-rice', '开平鲫鱼焗饭', 'identity_verified'],
    ['r97-zojirushi-taiwan-brown-cabbage-mixed-rice', '糙米高麗菜什錦飯', 'recipe_fact_checked'],
    ['r97-zojirushi-taiwan-kombu-chestnut-rice', '昆布栗子炊飯', 'recipe_fact_checked'],
  ];
  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = catalog.recipes.find(item => item.recipe_id === recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
    if (status === 'identity_verified') {
      assert.deepEqual(recipe.cooking_sequence, [], recipeId);
      assert.equal(recipe.fixed_batch, null, recipeId);
    } else {
      assert.ok(recipe.core_ingredients.length >= 2, recipeId);
      assert.ok(recipe.cooking_sequence.length > 0, recipeId);
    }
  }
});

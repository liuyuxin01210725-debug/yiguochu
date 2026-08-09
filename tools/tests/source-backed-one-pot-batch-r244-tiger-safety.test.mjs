import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

for (const [id, label] of [
  ['tiger-hainanese-chicken-rice', 'Hainanese Chicken Rice'],
  ['tiger-usa-autumn-chicken-mushroom-green-bean-pilaf', 'Autumn Rice Pilaf with Chicken Mushroom Green Bean Casserole'],
]) {
  test(`r244 adds the poultry endpoint to Tiger ${label}`, () => {
    assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r253');
    assert.equal(catalog.recipes.length, 923);
    const recipe = byId[id];
    assert.ok(recipe);
    assert.equal(recipe.status, 'recipe_fact_checked');
    assert.deepEqual(recipe.safety_endpoints, [{
      code: 'poultry_fully_cooked',
      minimum_core_temperature_c: 74,
      source_ids: ['S-SAFETY-TEMPERATURES-1'],
    }]);
    assert.equal('executable' in recipe, false);
  });
}

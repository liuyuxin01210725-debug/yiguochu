import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = (recipeId) => catalog.recipes.find((item) => item.recipe_id === recipeId);

test('r330 adds source-labelled process fragments without inventing contracts', () => {
  const yongchun = byId('yongchun-pork-rib-salted-rice');
  const xianju = byId('xianju-salted-sour-rice');

  for (const recipe of [yongchun, xianju]) {
    assert.ok(recipe);
    assert.equal(recipe.status, 'identity_verified');
    assert.ok(recipe.cooking_sequence.length >= 2);
    assert.ok(recipe.cooking_sequence.every((step) => step.source_ids?.length));
    assert.equal(recipe.fixed_batch, null);
    assert.equal(recipe.liquid_contract, null);
    assert.equal(recipe.time_contract, null);
    assert.deepEqual(recipe.safety_endpoints, []);
  }

  assert.match(yongchun.cooking_sequence[0].instruction, /海蛎干|花生|白米|咸饭/u);
  assert.match(yongchun.cooking_sequence[1].instruction, /同锅煮成咸饭|不能/u);
  assert.ok(yongchun.source_refs.some((source) => source.source_id === 'S-FJ-YONGCHUN-SALTED-RICE-VARIANT-2'));

  assert.match(xianju.cooking_sequence[0].instruction, /炒饭|锅巴|土灶/u);
  assert.match(xianju.cooking_sequence[1].instruction, /米菜比例|电饭煲/u);
  assert.ok(xianju.source_refs.some((source) => source.source_id === 'S-XJ-XIANJU-SALTED-SOUR-RICE-2'));
});

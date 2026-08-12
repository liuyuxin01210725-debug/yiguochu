import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = (recipeId) => catalog.recipes.find((item) => item.recipe_id === recipeId);

test('r329 adds source-labelled Lisu and Jingpo process boundaries without execution contracts', () => {
  const lisu = byId('cn-yunnan-nujiang-lisu-hand-grab-mixed-rice');
  const jingpo = byId('cn-yunnan-ruili-jingpo-steamed-rice-technique');
  for (const recipe of [lisu, jingpo]) {
    assert.ok(recipe);
    assert.equal(recipe.status, 'identity_verified');
    assert.ok(recipe.cooking_sequence.length > 0);
    assert.ok(recipe.cooking_sequence.every((step) => step.source_ids?.length));
    assert.equal(recipe.fixed_batch, null);
    assert.equal(recipe.liquid_contract, null);
    assert.equal(recipe.time_contract, null);
    assert.deepEqual(recipe.safety_endpoints, []);
  }
  assert.match(lisu.cooking_sequence[0].instruction, /竹编大簸箕|熟饭/u);
  assert.match(lisu.cooking_sequence[1].instruction, /熟肉|核桃粉|搅拌均匀/u);
  assert.ok(lisu.source_refs.some((source) => source.source_id === 'S-CCTV-LISU-HAND-GRAB-RICE-1'));
  assert.match(jingpo.cooking_sequence[0].instruction, /大米|煮、蒸、拌/u);
  assert.ok(jingpo.source_refs.some((source) => source.source_id === 'S-NEAC-JINGPO-FOOD-CUSTOM-1'));
});

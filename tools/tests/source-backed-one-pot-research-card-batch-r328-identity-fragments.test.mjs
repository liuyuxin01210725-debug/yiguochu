import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = (recipeId) => catalog.recipes.find((item) => item.recipe_id === recipeId);

test('r328 preserves official identity/process fragments for three formerly empty source sequences', () => {
  const huaihua = byId('huaihua-haocai-rice');
  const xuyi = byId('xuyi-salted-pork-rice-cracker');
  const dulong = byId('dulong-corn-rice');

  for (const recipe of [huaihua, xuyi, dulong]) {
    assert.ok(recipe);
    assert.ok(recipe.cooking_sequence.length > 0);
    assert.ok(recipe.cooking_sequence.every((step) => step.source_ids?.length));
    assert.equal(recipe.fixed_batch, null);
    assert.equal(recipe.liquid_contract, null);
    assert.equal(recipe.time_contract, null);
  }

  assert.match(huaihua.cooking_sequence[0].instruction, /三月三|300公斤|薅菜饭/u);
  assert.match(xuyi.cooking_sequence[0].instruction, /柴火灶|炒饭|边界/u);
  assert.match(dulong.cooking_sequence[0].instruction, /玉米饭|烧、烤、煮/u);
  assert.ok(huaihua.source_refs[0].claim_scopes.includes('quantity'));
  assert.ok(xuyi.source_refs.some((source) => source.source_id === 'S-XUYI-SALTED-PORK-RICE-CRACKER-2'));
  assert.ok(dulong.source_refs[0].claim_scopes.includes('process'));
});

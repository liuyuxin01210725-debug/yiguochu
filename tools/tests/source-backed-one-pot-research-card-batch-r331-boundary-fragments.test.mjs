import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = (recipeId) => catalog.recipes.find((item) => item.recipe_id === recipeId);

test('r331 exposes source-labelled quantity and identity boundaries for four formerly empty cards', () => {
  const ids = [
    'yunlin-soft-egg-roast-pork-rice',
    'zojirushi-china-tomato-seafood-rice',
    'wansheng-potato-green-bean-kongfan',
    'r99-guangzhou-winter-solstice-cured-glutinous-rice',
  ];

  for (const recipeId of ids) {
    const recipe = byId(recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, 'identity_verified', recipeId);
    assert.ok(recipe.cooking_sequence.length >= 2, recipeId);
    assert.ok(recipe.cooking_sequence.every((step) => step.source_ids?.length), recipeId);
    assert.equal(recipe.fixed_batch, null, recipeId);
    assert.equal(recipe.liquid_contract, null, recipeId);
    assert.equal(recipe.time_contract, null, recipeId);
  }

  assert.match(byId('yunlin-soft-egg-roast-pork-rice').cooking_sequence[0].instruction, /电锅|糙米|豆皮/u);
  assert.match(byId('zojirushi-china-tomato-seafood-rice').cooking_sequence[0].instruction, /3杯米|鱿鱼圈40g|虾仁40g/u);
  assert.match(byId('zojirushi-china-tomato-seafood-rice').cooking_sequence[1].instruction, /错配|不得/u);
  assert.match(byId('wansheng-potato-green-bean-kongfan').cooking_sequence[0].instruction, /洋芋|四季豆/u);
  assert.match(byId('r99-guangzhou-winter-solstice-cured-glutinous-rice').cooking_sequence[0].instruction, /冬至|冬菇|腊肠/u);
});

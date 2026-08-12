import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find((item) => item.recipe_id === 'yanbian-stone-pot-bibimbap');

test('r327 records Yanbian stone-pot bibimbap as a cooked-rice and post-mix process', () => {
  assert.ok(recipe);
  assert.equal(recipe.status, 'identity_verified');
  assert.equal(recipe.cooking_sequence.length, 2);
  assert.ok(recipe.cooking_sequence.every((step) => step.provenance === 'source'));
  assert.ok(recipe.cooking_sequence.every((step) => step.source_ids.includes('S-R67-JILIN-YANBIAN-BIBIMBAP')));
  assert.match(recipe.cooking_sequence[0].instruction, /米饭|肉类|鸡蛋|黄豆芽|菌菇/u);
  assert.match(recipe.cooking_sequence[1].instruction, /拌匀|熟饭|执行合同/u);
  assert.equal(recipe.fixed_batch, null);
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.deepEqual(recipe.safety_endpoints, []);
  assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
});

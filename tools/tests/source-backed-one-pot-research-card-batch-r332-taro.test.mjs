import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find((item) => item.recipe_id === 'taiwan-taro-rice-aroma');

test('r332 exposes the official taro-rice card quantities and five source steps', () => {
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.core_ingredients, ['米', '芋头', '干香菇', '虾米', '绞肉']);
  assert.equal(recipe.cooking_sequence.length, 5);
  assert.ok(recipe.cooking_sequence.every((step) => step.source_ids?.includes('S-R70-TW-FAE-TARO-RICE')));
  assert.match(recipe.cooking_sequence[0].instruction, /白米200克/iu);
  assert.match(recipe.cooking_sequence[0].instruction, /芋头200克/iu);
  assert.match(recipe.cooking_sequence[0].instruction, /干香菇75克/iu);
  assert.match(recipe.cooking_sequence[3].instruction, /电子锅煮熟/iu);
  assert.equal(recipe.fixed_batch, null);
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.deepEqual(recipe.source_refs[0].claim_scopes, ['identity', 'ingredients', 'quantity', 'process', 'appliance']);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalog = JSON.parse(fs.readFileSync(
  new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url),
  'utf8',
));

const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

function ingredient(recipe, name) {
  return recipe.fixed_batch?.ingredients?.find((item) => item.name === name);
}

test('r219 closes the same-source fixed batches for three MAFF regional rice dishes', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r255');
  assert.equal(catalog.recipes.length, 923);

  const shimane = byId.get('maff-shimane-uzume-meshi');
  assert.equal(shimane.fixed_batch?.servings, 4);
  assert.deepEqual(ingredient(shimane, '米')?.amount, { value: 1.5, unit: '合' });
  assert.deepEqual(ingredient(shimane, '鸡肉')?.amount, { value: 32, unit: 'g' });
  assert.deepEqual(ingredient(shimane, '厚揚げ')?.amount, { value: 1, unit: '枚' });
  assert.deepEqual(shimane.liquid_contract, {
    kind: 'added_broth',
    amount: { value: 600, unit: 'cc' },
    source_ids: ['S-MAFF-SHIMANE-UZUME-MESHI-1'],
  });

  const hiroshima = byId.get('maff-hiroshima-uzume');
  assert.equal(hiroshima.fixed_batch?.servings, 4);
  assert.deepEqual(ingredient(hiroshima, '鯛')?.amount, { value: 4, unit: '切れ(1切れ30g)' });
  assert.deepEqual(ingredient(hiroshima, 'えび')?.amount, { value: 8, unit: '尾' });
  assert.deepEqual(ingredient(hiroshima, '厚揚げ')?.amount, { value: 200, unit: 'g' });

  const tokushima = byId.get('maff-tokushima-houhan');
  assert.equal(tokushima.fixed_batch?.servings, 4);
  assert.deepEqual(ingredient(tokushima, 'そば米')?.amount, { value: 150, unit: 'g' });
  assert.deepEqual(ingredient(tokushima, '飯')?.amount, { value: 150, unit: 'g' });
  assert.deepEqual(ingredient(tokushima, '鶏肉（もも肉）')?.amount, { value: 100, unit: 'g' });
  assert.deepEqual(tokushima.liquid_contract, {
    kind: 'added_broth',
    amount: { value: 800, unit: 'g' },
    source_ids: ['S-MAFF-TOKUSHIMA-HOUHAN-1'],
  });
});

test('r219 preserves staged, cooked-rice, and non-executable boundaries', () => {
  for (const recipeId of [
    'maff-shimane-uzume-meshi',
    'maff-hiroshima-uzume',
    'maff-tokushima-houhan',
  ]) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.equal(recipe.cooker_adaptation?.status, 'not_adapted', recipeId);
    assert.equal(recipe.executable, undefined, recipeId);
    assert.match(
      `${recipe.evidence_notes} ${recipe.cooker_adaptation?.notes ?? ''}`,
      /熟饭|熟米饭|荞麦米|分段|另锅/u,
      recipeId,
    );
  }
});

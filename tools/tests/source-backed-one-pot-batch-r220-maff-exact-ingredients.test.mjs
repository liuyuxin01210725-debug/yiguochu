import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalog = JSON.parse(
  fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'),
);

const byId = (recipeId) => {
  const recipe = catalog.recipes.find((entry) => entry.recipe_id === recipeId);
  assert.ok(recipe, `missing ${recipeId}`);
  return recipe;
};

const ingredient = (recipe, name) => {
  const found = recipe.fixed_batch?.ingredients?.find((entry) => entry.name === name);
  assert.ok(found, `${recipe.recipe_id} missing ingredient ${name}`);
  return found;
};

test('r220 bumps the catalog without adding canonical recipes', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r220');
  assert.equal(catalog.recipes.length, 923);
});

test('r220 closes same-source quantified ingredients and the Ehime water ratio', () => {
  const mie = byId('jp-mie-tako-meshi');
  assert.deepEqual(ingredient(mie, '酱油').amount, { value: 2, unit: '大匙' });
  assert.deepEqual(ingredient(mie, '酒').amount, { value: 3, unit: '大匙' });
  assert.deepEqual(ingredient(mie, '味醂').amount, { value: 1, unit: '大匙' });
  assert.deepEqual(ingredient(mie, '盐').amount, { value: 1, unit: '小匙' });

  const ehime = byId('jp-ehime-tako-meshi');
  assert.deepEqual(ingredient(ehime, '昆布').amount, { value: 5, unit: 'cm角' });
  assert.deepEqual(ingredient(ehime, '酱油').amount, { value: 3, unit: '大匙' });
  assert.deepEqual(ingredient(ehime, '味醂').amount, { value: 0.5, unit: '大匙' });
  assert.deepEqual(ingredient(ehime, '酒').amount, { value: 0.5, unit: '大匙' });
  assert.deepEqual(ingredient(ehime, '干油豆腐').amount, { value: 0.5, unit: '枚' });
  assert.deepEqual(ehime.liquid_contract, {
    kind: 'rice_to_water_ratio',
    amount: { value: 1, unit: '米:水' },
    source_ids: ['S-JP-EHIME-TAKO-1'],
  });
});

test('r220 keeps source-specific boundaries and does not invent water or time', () => {
  const hebo = byId('maff-aichi-hebo-meshi');
  assert.deepEqual(ingredient(hebo, '酱油').amount, { value: 50, unit: 'mL' });
  assert.deepEqual(ingredient(hebo, '糖').amount, { value: 0.5, unit: '大匙' });
  assert.deepEqual(ingredient(hebo, '味醂').amount, { value: 1, unit: '大匙' });
  assert.deepEqual(ingredient(hebo, '酒').amount, { value: 1, unit: '大匙' });
  assert.deepEqual(ingredient(hebo, '盐').amount, { value: 0.5, unit: '小匙' });
  assert.equal(hebo.liquid_contract, null);
  assert.equal(hebo.time_contract, null);
  for (const recipeId of ['jp-mie-tako-meshi', 'jp-ehime-tako-meshi', 'maff-aichi-hebo-meshi']) {
    const recipe = byId(recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.notEqual(recipe.cooker_adaptation.status, 'adapted', recipeId);
    assert.equal('executable' in recipe, false, recipeId);
  }
});

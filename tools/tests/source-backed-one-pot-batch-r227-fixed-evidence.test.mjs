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

test('r227 keeps the 923-entry catalog and advances the catalog version', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r227');
  assert.equal(catalog.recipes.length, 923);
});

test('r227 closes exact serving evidence without inventing missing amounts', () => {
  const kamameshi = byId('hk-mushroom-mixed-vegetable-kamameshi');
  assert.equal(kamameshi.fixed_batch.servings, 6);
  assert.deepEqual(ingredient(kamameshi, '米').amount, { value: 283, unit: 'g' });
  assert.deepEqual(kamameshi.liquid_contract, {
    kind: 'added_broth',
    amount: { value: 300, unit: 'mL' },
    source_ids: ['S-HK-EATSMART-MUSHROOM-MIXED-VEGETABLE-KAMAMESHI-1'],
  });

  const congee = byId('r60-tiger-basic-chicken-congee');
  assert.equal(congee.fixed_batch.servings, 2);
  assert.deepEqual(ingredient(congee, '日本米').amount, { value: 0.5, unit: 'cup' });
  assert.deepEqual(congee.liquid_contract.waterline, {
    appliance_model: 'Tiger 5.5-cup cooker',
    scale: 'Soft Porridge',
    mark: 0.5,
  });

  const salmon = byId('r59-tiger-usa-garlic-salmon-garden-rice');
  assert.equal(salmon.fixed_batch.servings, 2);
  assert.deepEqual(ingredient(salmon, 'rice').amount, { value: 2, unit: 'cups' });
  assert.equal(salmon.liquid_contract, null);

  for (const recipe of [kamameshi, congee, salmon]) {
    assert.equal(recipe.status, 'recipe_fact_checked');
    assert.equal('executable' in recipe, false);
  }
});

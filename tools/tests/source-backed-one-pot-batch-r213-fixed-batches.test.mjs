import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

function ingredient(recipe, name) {
  return recipe.fixed_batch?.ingredients?.find((item) => item.name === name);
}

test('r213 closes StartSmart institutional corn-lean-pork congee batch and liquid', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r218');
  const recipe = byId['startsmart-corn-lean-pork-porridge'];
  assert.equal(recipe.fixed_batch.servings, 83);
  assert.equal(ingredient(recipe, '米').amount.value, 375);
  assert.equal(ingredient(recipe, '瘦肉').amount.value, 350);
  assert.equal(ingredient(recipe, '玉米').amount.value, 250);
  assert.deepEqual(recipe.liquid_contract, {
    kind: 'added_water',
    amount: { value: 3600, unit: 'mL' },
    source_ids: ['S-STARTSMART-CORN-LEAN-PORK-1'],
  });
});

test('r213 closes MAFF Oita chicken-rice four-person source batch', () => {
  const recipe = byId['maff-oita-torimeshi'];
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.equal(ingredient(recipe, '米').amount.value, 2);
  assert.equal(ingredient(recipe, '地鸡').amount.value, 150);
  assert.equal(ingredient(recipe, '牛蒡').amount.value, 120);
  assert.equal(recipe.liquid_contract, null);
});

test('r213 closes MAFF Tokushima soba-grain porridge four-person source batch', () => {
  const recipe = byId['maff-tokushima-sobagome-zosui'];
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.equal(ingredient(recipe, '荞麦米').amount.value, 120);
  assert.deepEqual(recipe.liquid_contract, {
    kind: 'added_dashi',
    amount: { value: 4, unit: '杯' },
    source_ids: ['S-MAFF-TOKUSHIMA-SOBAGOME-ZOSUI-1'],
  });
});

test('r213 closes MAFF Tokushima ayu porridge four-person grain and fish batch', () => {
  const recipe = byId['maff-tokushima-ayuro-sui'];
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.equal(ingredient(recipe, '香鱼').amount.value, 4);
  assert.equal(ingredient(recipe, '米').amount.value, 150);
  assert.equal(recipe.liquid_contract, null);
});

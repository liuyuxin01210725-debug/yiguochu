import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find((item) => item.recipe_id === 'taiwan-sesame-oil-chicken-glutinous-rice-cake');

function ingredient(name) {
  const found = recipe?.fixed_batch?.ingredients?.find((item) => item.name === name);
  assert.ok(found, `missing ${name}`);
  return found;
}

test('r239 closes the exact six-person Taiwan HPA glutinous rice cake batch', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r255');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.fixed_batch?.servings, 6);
  assert.deepEqual(ingredient('红葱').amount, { value: 10, unit: 'g' });
  assert.deepEqual(ingredient('糯米').amount, { value: 200, unit: 'g' });
  assert.deepEqual(ingredient('干香菇').amount, { value: 60, unit: 'g' });
  assert.deepEqual(ingredient('老姜').amount, { value: 10, unit: 'g' });
  assert.deepEqual(ingredient('麻油').amount, { value: 30, unit: 'mL' });
  assert.deepEqual(ingredient('肉丝').amount, { value: 30, unit: 'g' });
  assert.deepEqual(ingredient('去骨鸡腿肉').amount, { value: 150, unit: 'g' });
  assert.deepEqual(ingredient('虾米').amount, { value: 30, unit: 'g' });
  assert.deepEqual(ingredient('盐').amount, { value: 6, unit: 'g' });
  assert.deepEqual(ingredient('米酒').amount, { value: 30, unit: 'mL' });
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.equal(recipe.cooker_adaptation.status, 'source_limited');
});

test('r239 preserves dynamic liquid and two-stage cooker boundary', () => {
  assert.ok(recipe);
  assert.match(recipe.cooker_adaptation.notes, /先炒|外鍋|復蒸|复蒸/u);
  assert.match(recipe.cooking_sequence.map((step) => step.instruction).join(' '), /30分鐘|30分钟|外鍋|外锅|復蒸|复蒸/u);
  assert.deepEqual(recipe.safety_endpoints, [
    {
      code: 'poultry_fully_cooked',
      minimum_core_temperature_c: 74,
      source_ids: ['S-SAFETY-TEMPERATURES-1']
    }
  ]);
  assert.equal('executable' in recipe, false);
});

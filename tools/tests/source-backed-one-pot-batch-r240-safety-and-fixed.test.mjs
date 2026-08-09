import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const ingredient = (recipe, name) => {
  const found = recipe?.fixed_batch?.ingredients?.find((item) => item.name === name);
  assert.ok(found, `${recipe?.recipe_id ?? 'recipe'} missing ${name}`);
  return found;
};

test('r240 closes Bubur Lambuk exact yield and ground-beef safety', () => {
  const recipe = byId['sg-healthhub-bubur-lambuk'];
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r244');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.fixed_batch?.servings, 4);
  assert.deepEqual(ingredient(recipe, '瘦牛肉末').amount, { value: 200, unit: 'g' });
  assert.deepEqual(ingredient(recipe, '三色杂粮米').amount, { value: 200, unit: 'g' });
  assert.deepEqual(ingredient(recipe, '主锅水').amount, { value: 1500, unit: 'ml' });
  assert.deepEqual(ingredient(recipe, '香料糊用水').amount, { value: 100, unit: 'ml' });
  assert.deepEqual(recipe.liquid_contract, { kind: 'added_water', amount: { value: 1500, unit: 'ml' }, source_ids: ['S-R140-SG-BUBUR-LAMBUK-1'] });
  assert.equal(recipe.time_contract, null);
  assert.deepEqual(recipe.safety_endpoints, [{
    code: 'beef_fully_cooked',
    minimum_core_temperature_c: 71,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.equal('executable' in recipe, false);
});

test('r240 adds only a poultry endpoint for Illinois staged chicken rice', () => {
  const recipe = byId['illinois-governors-mansion-chicken-manoomin'];
  assert.ok(recipe);
  assert.deepEqual(recipe.safety_endpoints, [{
    code: 'poultry_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.equal(recipe.fixed_batch, null);
  assert.equal(recipe.time_contract, null);
  assert.match(recipe.cooker_adaptation.notes, /先煎|取出|回锅/u);
  assert.equal('executable' in recipe, false);
});

test('r240 preserves HealthHub timing conflict and staged boundaries', () => {
  const recipe = byId['sg-healthhub-bubur-lambuk'];
  assert.ok(recipe);
  assert.equal(recipe.time_contract, null);
  assert.match(recipe.evidence_notes, /4份|40分钟|30分钟|1小时|冲突/u);
  assert.match(recipe.cooker_adaptation.notes, /普通锅|另锅|不外推电饭煲/u);
});

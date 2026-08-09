import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

test('r168 closes the same-source CUCKOO abalone fixed batch', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r211');
  assert.equal(catalog.recipes.length, 923);
  const recipe = byId['cuckoo-abalone-pot-rice'];
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.fixed_batch?.servings, 4);
  assert.deepEqual(recipe.fixed_batch?.source_ids, ['S-CUCKOO-ABALONE-POT-RICE-1']);
  for (const [name, value, unit] of [
    ['短粒米', 2, 'cups'],
    ['水', 2.5, 'cups'],
    ['鲍鱼', 4, '个'],
    ['酱油', 1, 'Tbsp'],
    ['麻油', 1, 'tsp'],
    ['糖', 1, 'tsp'],
    ['大蒜', 1, 'Tbsp'],
    ['盐', 0.5, 'tsp'],
    ['葱', 2, '根'],
    ['芝麻', 1, 'tsp'],
  ]) {
    const ingredient = recipe.fixed_batch.ingredients.find(item => item.name === name);
    assert.ok(ingredient, `missing ${name}`);
    assert.deepEqual(ingredient.amount, { value, unit });
    assert.deepEqual(ingredient.source_ids, ['S-CUCKOO-ABALONE-POT-RICE-1']);
  }
  assert.deepEqual(recipe.liquid_contract, {
    kind: 'added_water',
    amount: { value: 2.5, unit: 'cups' },
    source_ids: ['S-CUCKOO-ABALONE-POT-RICE-1'],
  });
  assert.deepEqual(recipe.time_contract, {
    total_minutes: 50,
    source_ids: ['S-CUCKOO-ABALONE-POT-RICE-1'],
  });
});

test('r168 preserves the page-specific appliance and abalone-state boundary', () => {
  const recipe = byId['cuckoo-abalone-pot-rice'];
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.match(recipe?.cooker_adaptation?.notes ?? '', /CR-0675F/);
  assert.match(recipe?.evidence_notes ?? '', /罐装|鲜/);
});

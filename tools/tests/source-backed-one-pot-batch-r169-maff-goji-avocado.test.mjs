import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find(item => item.recipe_id === 'maff-goji-avocado-rice');

function ingredient(name) {
  return recipe?.fixed_batch?.ingredients.find(item => item.name === name);
}

test('r169 closes the same-source MAFF goji avocado rice fixed batch', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r205');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.fixed_batch?.servings, 2);
  assert.deepEqual(recipe.fixed_batch?.source_ids, ['S-R69-MAFF-GOJI-AVOCADO']);

  for (const [name, value, unit] of [
    ['米', 1, '合'],
    ['牛油果', 40, 'g'],
    ['枸杞', 20, 'g'],
    ['白だし', 1, 'Tbsp'],
    ['酒', 1, 'Tbsp'],
    ['芹菜叶', 80, 'g'],
    ['盐', 0.8, 'g'],
    ['亚麻籽油', 2, 'tsp'],
    ['芝麻粉', 0.5, 'g'],
    ['麦仁', 0.5, 'Tbsp'],
  ]) {
    const row = ingredient(name);
    assert.ok(row, `missing ${name}`);
    assert.deepEqual(row.amount, { value, unit });
    assert.deepEqual(row.source_ids, ['S-R69-MAFF-GOJI-AVOCADO']);
  }
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
});

test('r169 preserves the low-protein and separate celery finish boundary', () => {
  assert.match(recipe?.evidence_notes ?? '', /低蛋白|芹菜叶.*另行|另行收尾/u);
  assert.match(recipe?.cooker_adaptation?.notes ?? '', /低蛋白|芹菜叶.*另行/u);
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.deepEqual(recipe?.safety_endpoints, []);
});

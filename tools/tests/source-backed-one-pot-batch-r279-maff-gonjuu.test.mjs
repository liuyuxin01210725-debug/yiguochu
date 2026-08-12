import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(
  readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'),
);

const recipe = catalog.recipes.find((item) => item.recipe_id === 'maff-chiba-gonjuu');
const sourceId = 'S-MAFF-CHIBA-GONJUU-1';

const amountOf = (name) => {
  const item = recipe?.fixed_batch?.ingredients?.find((entry) => entry.name === name);
  assert.ok(item, `missing fixed-batch ingredient ${name}`);
  return item.amount;
};

test('r279 records the exact MAFF Gonjuu batch without promoting cooked-rice research', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.fixed_batch.servings, 20);
  for (const [name, amount] of [
    ['米', { value: 5, unit: '合' }],
    ['猪五花肉', { value: 400, unit: 'g' }],
    ['油豆腐皮', { value: 5, unit: '枚' }],
    ['柴鱼片', { value: 50, unit: 'g' }],
    ['砂糖', { value: 3, unit: '大匙（轻）' }],
    ['酱油', { value: 150, unit: 'cc' }],
    ['味醂', { value: 50, unit: 'cc' }],
    ['酒', { value: 100, unit: 'cc' }],
    ['水', { value: 250, unit: 'cc' }],
  ]) {
    assert.deepEqual(amountOf(name), amount);
  }
  assert.deepEqual(recipe.fixed_batch.source_ids, [sourceId]);
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
  assert.notEqual(recipe.status, 'executable');
});

test('r279 keeps every fixed-batch ingredient tied to the MAFF quantity source', () => {
  for (const ingredient of recipe.fixed_batch.ingredients) {
    assert.deepEqual(ingredient.source_ids, [sourceId], ingredient.name);
  }
  assert.match(recipe.evidence_notes, /20个饭团|固定批次|熟饭|饭团/u);
});

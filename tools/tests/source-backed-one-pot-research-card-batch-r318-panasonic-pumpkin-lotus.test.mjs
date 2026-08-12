import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildResearchMethod } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('r318 closes Panasonic pumpkin-lotus chicken rice with source-backed steps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  const recipe = catalog.recipes.find(item => item.recipe_id === 'panasonic-my-chicken-pumpkin-lotus-mixed-rice');
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.equal(recipe.fixed_batch.ingredients.find(item => item.name === '鸡腿丁').amount.value, 200);
  assert.equal(recipe.liquid_contract.components.find(item => item.name === '水').amount.value, 100);
  assert.equal(recipe.cooking_sequence.length, 4);
  assert.deepEqual(recipe.cooking_sequence.map(step => step.instruction), [
    '将洗净的糙米和大麦放入内锅，加入鲣鱼高汤和水。',
    '将南瓜和莲藕洗净并切碎。',
    '将姜放入内锅，加入南瓜、莲藕和鸡腿肉丁；合盖选择 Brown Rice 程序烹煮。',
    '煮好后盛出，拌入盐和芝麻油，按需用葱、枸杞、烤松子装饰。',
  ]);
  assert.ok(recipe.cooking_sequence.every(step => step.source_ids.includes('S-PANASONIC-MY-CHICKEN-PUMPKIN-LOTUS-MIXED-RICE-1')));

  const method = buildResearchMethod(recipe);
  assert.equal(method.status, 'source_partial_with_draft');
  assert.equal(method.steps.filter(step => step.provenance === 'source').length, 4);
  assert.equal(method.ingredients.find(item => item.name === '鸡腿丁').amount.value, 200);
  assert.equal(method.liquid.amount.value, 3);
  assert.match(method.source_facts.map(item => item.text).join('\n'), /鸡腿丁200g|鸡腿肉200g/u);
});

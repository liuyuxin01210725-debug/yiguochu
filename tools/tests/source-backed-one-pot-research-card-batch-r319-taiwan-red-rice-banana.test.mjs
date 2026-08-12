import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildResearchMethod } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('r319 closes the official process fragment for Taiwan red-rice banana rice', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  const recipe = catalog.recipes.find(item => item.recipe_id === 'taiwan-red-rice-banana-rice');
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.fixed_batch, null);
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.deepEqual(recipe.cooking_sequence.map(step => step.instruction), [
    '将当季新鲜、甜度高的香蕉揉进米饭中。',
    '将花莲红米和莲藕少量且均匀地分布在带有香蕉果肉的米饭中。',
    '如加入红藜粉，则一起蒸煮，使香蕉饭呈淡粉红色。',
  ]);
  assert.ok(recipe.source_refs[0].claim_scopes.includes('process'));

  const method = buildResearchMethod(recipe);
  assert.equal(method.steps.filter(step => step.provenance === 'source').length, 3);
  assert.ok(method.steps.length >= 4);
  assert.ok(method.ingredients.some(item => item.name === '红米'));
  assert.ok(method.ingredients.some(item => item.name === '香蕉'));
  assert.match(method.assumptions.join('\n'), /液体|份数|时长|蒸煮/u);
});

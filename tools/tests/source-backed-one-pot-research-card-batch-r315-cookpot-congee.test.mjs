import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildResearchMethod } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('r315 exposes the Cookpot source quantities, broth and one-hour congee sequence', () => {
  const recipe = catalog.recipes.find(item => item.recipe_id === 'cookpot-century-egg-pork-congee-704');
  assert.ok(recipe, 'Cookpot congee exists');
  assert.equal(recipe.fixed_batch, null, 'the source says 3–4 servings, so it is not collapsed to one fixed batch');
  assert.deepEqual(recipe.liquid_contract, {
    kind: 'added_broth',
    amount: { value: 1800, unit: 'mL' },
    source_ids: ['S-COOKPOT-CENTURY-EGG-PORK-704-R62'],
  });
  assert.equal(recipe.time_contract.total_minutes, 60);
  assert.equal(recipe.cooking_sequence.length, 4);
  assert.match(recipe.cooking_sequence[0].instruction, /猪绞肉.*腌15分钟/iu);
  assert.match(recipe.cooking_sequence[1].instruction, /白米.*皮蛋.*高汤/iu);
  assert.match(recipe.cooking_sequence[2].instruction, /粥模式.*1小时/iu);
  assert.match(recipe.cooking_sequence[3].instruction, /盐.*白胡椒.*葱花/iu);
});

test('r315 keeps the 3–4 serving range while exposing source-hint amounts on the research card', () => {
  const recipe = catalog.recipes.find(item => item.recipe_id === 'cookpot-century-egg-pork-congee-704');
  const method = buildResearchMethod(recipe);
  assert.equal(method.status, 'source_partial_with_draft');
  assert.match(method.servings_source_hint?.text || '', /3.?4份/iu);
  const amount = name => method.ingredients.find(item => item.name === name);
  assert.deepEqual(amount('白米')?.amount, { value: 1, unit: '杯' });
  assert.deepEqual(amount('猪绞肉')?.amount, { value: 300, unit: 'g' });
  assert.deepEqual(amount('皮蛋')?.amount, { value: 3, unit: '个' });
  assert.deepEqual(amount('高汤')?.amount, { value: 10, unit: '杯' });
  assert.deepEqual(amount('盐')?.amount, { value: 0.5, unit: '大匙' });
  assert.ok(method.ingredients.every(item => item.amount), 'all research ingredient rows show a quantity');
  assert.equal(method.liquid.amount.value, 1800);
  assert.equal(method.time.total_minutes, 60);
  assert.ok(method.steps.every(step => step.provenance === 'source'));
  assert.match(method.assumptions.join('；'), /份数范围.*不压成固定批量/iu);
});

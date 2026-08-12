import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildResearchMethod } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('r314 exposes the Anyuan half-cook, drain and residual-heat sequence', () => {
  const recipe = catalog.recipes.find(item => item.recipe_id === 'cn-jiangxi-ganzhou-anyuan-menfan');
  assert.ok(recipe, 'Anyuan recipe exists');
  assert.equal(recipe.fixed_batch, null);
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.equal(recipe.cooking_sequence.length, 3);
  assert.match(recipe.cooking_sequence[0].instruction, /生米.*半熟/iu);
  assert.match(recipe.cooking_sequence[1].instruction, /倒去米汤.*加盖/iu);
  assert.match(recipe.cooking_sequence[2].instruction, /余热.*焖熟/iu);
  const method = buildResearchMethod(recipe);
  assert.equal(method.steps[0].provenance, 'source');
  assert.equal(method.steps[1].provenance, 'source');
  assert.equal(method.steps[2].provenance, 'source');
  assert.ok(method.steps.length >= 4, 'estimated completion follows source sequence');
  assert.ok(method.ingredients.every(item => item.amount));
  assert.ok(method.liquid?.amount || method.liquid?.research_starting_point || method.liquid?.waterline);
  assert.ok(method.time);
  assert.match(method.assumptions.join('；'), /原文|研究稿|估算/iu);
});

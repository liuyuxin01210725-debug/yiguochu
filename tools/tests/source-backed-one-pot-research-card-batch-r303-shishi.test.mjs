import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { buildResearchMethod } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('r303 closes the official Shishi sesame-oil rice ingredient and process clue', () => {
  const recipe = catalog.recipes.find(item => item.recipe_id === 'fujian-shishi-sesame-oil-rice');
  assert.ok(recipe);
  assert.deepEqual(recipe.core_ingredients, ['大米', '干贝', '葱油丝', '鱼肉', '香菇', '三层肉', '香油']);
  const source = recipe.source_refs.find(item => item.source_id === 'S-FJ-SHISHI-SESAME-OIL-RICE-1');
  assert.ok(source);
  assert.ok(source.claim_scopes.includes('ingredients'));
  assert.ok(source.claim_scopes.includes('process'));
  assert.match(source.evidence_locator, /主要材料.*大米.*干贝.*三层肉.*香油.*焖熟/iu);

  const method = buildResearchMethod(recipe);
  assert.ok(method.ingredients.some(item => item.name === '干贝' && item.amount));
  assert.ok(method.ingredients.some(item => item.name === '三层肉' && item.amount));
  assert.ok(method.source_process_hints.some(hint => /香油.*焖熟/iu.test(hint.text)));
  assert.ok(method.steps.length >= 4);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildShelfCatalog } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find(item => item.recipe_id === 'cn-henan-linzhou-millet-thick-rice');

test('r323 exposes the official Linzhou millet-thick-rice ingredient assembly fragment', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.fixed_batch, null);
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.deepEqual(recipe.cooking_sequence.map(step => step.instruction), [
    '准备小米、红萝卜、白萝卜、红薯粉条和白菜叶。',
    '以小米为主料，配红萝卜、白萝卜、红薯粉条和白菜叶，组合为林州小米稠饭；原文未提供投料顺序、水量或焖煮时间。',
  ]);
  assert.ok(recipe.cooking_sequence.every(step => step.source_ids.includes('S-R107-CN-LINZHOU-MILLET-THICK-RICE-1')));
  const source = recipe.source_refs[0];
  assert.ok(source.claim_scopes.includes('process'));
  const method = buildShelfCatalog(catalog).records.find(item => item.recipe_id === recipe.recipe_id).research_method;
  assert.equal(method.steps.filter(step => step.provenance === 'source').length, 2);
  assert.ok(method.steps.length >= 4);
  assert.equal(method.liquid.provenance, 'estimated');
  assert.equal(method.time.provenance, 'estimated');
});


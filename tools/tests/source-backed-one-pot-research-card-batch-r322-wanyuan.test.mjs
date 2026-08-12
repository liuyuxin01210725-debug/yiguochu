import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildShelfCatalog } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find(item => item.recipe_id === 'wanyuan-selenium-rice-guanfan');

test('r322 closes the directly opened Wanyuan selenium-rice pairing fragment', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.core_ingredients, ['硒米', '腊肉', '酸豆角', '野菜']);
  assert.equal(recipe.fixed_batch, null);
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.deepEqual(recipe.safety_endpoints, []);
  assert.deepEqual(recipe.cooking_sequence.map(step => step.instruction), [
    '将硒米焖熟成米饭。',
    '准备腊肉、酸豆角和野菜作为搭配。',
    '将腊肉、酸豆角和野菜与焖熟的硒米饭搭配食用；来源未证明这些配料同锅。',
  ]);
  assert.ok(recipe.cooking_sequence.every(step => step.source_ids.includes('S-R68-SC-WANYUAN-RICE-CAN')));
  const source = recipe.source_refs.find(item => item.source_id === 'S-R68-SC-WANYUAN-RICE-CAN');
  assert.equal(source.access_status, 'opened');
  assert.ok(source.claim_scopes.includes('process'));
  const shelf = buildShelfCatalog(catalog);
  const method = shelf.records.find(item => item.recipe_id === recipe.recipe_id).research_method;
  assert.equal(method.steps.filter(step => step.provenance === 'source').length, 3);
  assert.ok(method.steps.length >= 4);
  assert.equal(method.liquid.provenance, 'estimated');
  assert.equal(method.time.provenance, 'estimated');
});


import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

test('r85 registers the Yongchun named salted-rice identity without inventing a recipe contract', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r201');
  assert.equal(catalog.recipes.length, 923);
  const recipe = catalog.recipes.find(item => item.recipe_id === 'yongchun-yifan-salty-rice');
  assert.equal(recipe?.canonical_name, '永春一饭（香饭）');
  assert.equal(recipe?.status, 'identity_verified');
  assert.equal(recipe?.identity_status, 'verified');
  assert.deepEqual(recipe?.core_ingredients, ['海蛎干', '花生', '肉', '葱油', '白米']);
  assert.ok(recipe?.source_refs?.every(source => Number.isInteger(source.evidence_tier)));
  assert.ok(recipe?.source_refs?.every(source => source.access_status === 'opened'));

  const counts = Object.groupBy(catalog.recipes, item => item.status);
  assert.equal(counts.recipe_fact_checked.length, 794);
  assert.equal(counts.identity_verified.length, 100);
  assert.equal(counts.executable.length, 12);
  assert.equal(counts.discovered.length, 17);
});

test('r85 keeps Yongchun salted-rice process and appliance facts unresolved', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const recipe = catalog.recipes.find(item => item.recipe_id === 'yongchun-yifan-salty-rice');
  assert.deepEqual(recipe?.cooking_sequence, []);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract, null);
  assert.equal(recipe?.time_contract, null);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.match(recipe?.evidence_notes ?? '', /身份|不补写|流程/u);
});

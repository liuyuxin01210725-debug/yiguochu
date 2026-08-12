import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalog = JSON.parse(fs.readFileSync('tools/data/source-backed-one-pot-recipes.v1.json', 'utf8'));

test('r282 closes MAFF frozen seafood paella with the mixed-seafood visual endpoint', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  const row = catalog.recipes.find((recipe) => recipe.recipe_id === 'maff-eryngii-seafood-pan-paella');
  assert.equal(row.status, 'recipe_fact_checked');
  assert.deepEqual(row.safety_endpoints, [{
    code: 'shellfish_fully_cooked',
    visual_endpoint: '虾、蛤蜊等海鲜充分加热，肉质呈白色且不透明',
    source_ids: ['S-SAFETY-TEMPERATURES-1']
  }]);
  assert.ok(row.source_refs.some((source) => source.source_id === 'S-SAFETY-TEMPERATURES-1'));
});

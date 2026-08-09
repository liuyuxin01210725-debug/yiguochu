import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find(row => row.recipe_id === 'maff-ishikawa-sazae-meshi');

test('r196 closes the same-species MAFF Ishikawa sazae safety gap', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.safety_endpoints, [{
    code: 'shellfish_fully_cooked',
    visual_endpoint: '肉质呈珍珠白或白色且不透明',
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  const source = recipe.source_refs.find(row => row.source_id === 'S-SAFETY-TEMPERATURES-1');
  assert.ok(source);
  assert.equal(source.access_status, 'opened');
  assert.equal(source.evidence_tier, 1);
  assert.match(source.evidence_locator, /sazae|蝾螺|同种/u);
  assert.deepEqual(source.claim_scopes, ['safety']);
});

test('r196 preserves the Ishikawa staged sazae process', () => {
  assert.match(recipe?.cooking_sequence?.[1]?.instruction ?? '', /米|昆布|蝾螺|炊煮/u);
  assert.match(recipe?.cooking_sequence?.[2]?.instruction ?? '', /焖|拌/u);
  assert.notEqual(recipe?.cooker_adaptation?.status, 'adapted');
});

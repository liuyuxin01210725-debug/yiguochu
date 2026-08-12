import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find(item => item.recipe_id === 'tatung-fresh-vegetable-clam-rice');

test('r264 closes the directly evidenced clam endpoint without collapsing the liquid ambiguity', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  const endpoint = recipe.safety_endpoints.find(item => item.code === 'shellfish_fully_cooked');
  assert.ok(endpoint);
  assert.equal(endpoint.visual_endpoint, '肉质呈珍珠白或白色且不透明');
  assert.deepEqual(endpoint.source_ids, ['S-SAFETY-TEMPERATURES-1']);
  const source = recipe.source_refs.find(item => item.source_id === 'S-SAFETY-TEMPERATURES-1');
  assert.ok(source);
  assert.equal(source.url, 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures');
  assert.equal(source.access_status, 'opened');
  assert.equal(source.evidence_tier, 1);
  assert.match(source.evidence_locator, /clam|蚬|shellfish|珍珠白/u);
  assert.deepEqual(source.claim_scopes, ['safety']);
});

test('r264 keeps the Tatung appliance and unresolved liquid contract unchanged', () => {
  assert.equal(recipe.cooker_adaptation.status, 'source_limited');
  assert.equal(recipe.liquid_contract, null);
  assert.notEqual(recipe.status, 'executable');
});

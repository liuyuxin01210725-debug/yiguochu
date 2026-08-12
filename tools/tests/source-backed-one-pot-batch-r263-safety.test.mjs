import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find(item => item.recipe_id === 'maff-tokushima-ayuro-sui');

test('r263 closes the directly evidenced fish endpoint without changing the stovetop boundary', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  const endpoint = recipe.safety_endpoints.find(item => item.code === 'seafood_fully_cooked');
  assert.ok(endpoint);
  assert.equal(endpoint.minimum_core_temperature_c, 63);
  assert.deepEqual(endpoint.source_ids, ['S-SAFETY-TEMPERATURES-1']);
  const source = recipe.source_refs.find(item => item.source_id === 'S-SAFETY-TEMPERATURES-1');
  assert.ok(source);
  assert.equal(source.url, 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures');
  assert.equal(source.access_status, 'opened');
  assert.equal(source.evidence_tier, 1);
  assert.match(source.evidence_locator, /fish|香鱼|63/u);
  assert.deepEqual(source.claim_scopes, ['safety']);
});

test('r263 preserves the source-specific pan and non-executable status', () => {
  assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
  assert.equal(recipe.traditional_vessels[0], '平锅');
  assert.notEqual(recipe.status, 'executable');
});

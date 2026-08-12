import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

test('r286 closes the Panasonic seafood risotto fish and shrimp safety endpoints', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);

  const recipe = byId['r59-panasonic-taiwan-spanish-seafood-risotto'];
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');

  const fish = recipe.safety_endpoints.find(row => row.code === 'seafood_fully_cooked');
  assert.ok(fish);
  assert.equal(fish.minimum_core_temperature_c, 63);
  assert.deepEqual(fish.source_ids, [safetySourceId]);

  const shellfish = recipe.safety_endpoints.find(row => row.code === 'shellfish_fully_cooked');
  assert.ok(shellfish);
  assert.equal(shellfish.visual_endpoint, '肉质呈珍珠白或白色且不透明');
  assert.deepEqual(shellfish.source_ids, [safetySourceId]);

  const source = recipe.source_refs.find(row => row.source_id === safetySourceId);
  assert.ok(source);
  assert.equal(source.url, safetyUrl);
  assert.equal(source.access_status, 'opened');
  assert.equal(source.evidence_tier, 1);
  assert.match(source.evidence_locator, /fish|shrimp|shellfish|63|珍珠白|不透明/u);
  assert.deepEqual(source.claim_scopes, ['safety']);
});

test('r286 keeps the Panasonic source-limited appliance and quantity boundaries', () => {
  const recipe = byId['r59-panasonic-taiwan-spanish-seafood-risotto'];
  assert.deepEqual(recipe.fixed_batch, null);
  assert.equal(recipe.cooker_adaptation.status, 'source_limited');
  assert.match(recipe.cooker_adaptation.notes, /NF-MF701|普通.*電飯煲|普通.*电饭煲/u);
});

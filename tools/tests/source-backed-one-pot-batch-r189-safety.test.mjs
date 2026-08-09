import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find(item => item.recipe_id === 'taiwan-tilapia-edamame-rice');
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';

test('r189 closes the directly evidenced raw-tilapia safety gap', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r223');
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  const endpoint = recipe.safety_endpoints.find(row => row.code === 'seafood_fully_cooked');
  assert.ok(endpoint);
  assert.equal(endpoint.minimum_core_temperature_c, 63);
  assert.deepEqual(endpoint.source_ids, [safetySourceId]);
  const source = recipe.source_refs.find(row => row.source_id === safetySourceId);
  assert.ok(source);
  assert.equal(source.access_status, 'opened');
  assert.equal(source.evidence_tier, 1);
  assert.match(source.evidence_locator, /fish|鱼|tilapia|鲷/u);
  assert.deepEqual(source.claim_scopes, ['safety']);
});

test('r189 preserves the source-limited staged fish and cooker boundary', () => {
  assert.equal(recipe.cooker_adaptation?.status, 'source_limited');
  assert.match(recipe.cooking_sequence?.[1]?.instruction ?? '', /先煎|电锅/u);
  assert.match(recipe.cooking_sequence?.[2]?.instruction ?? '', /全熟/u);
  assert.deepEqual(recipe.safety_endpoints.filter(row => row.code === 'shellfish_fully_cooked'), []);
});

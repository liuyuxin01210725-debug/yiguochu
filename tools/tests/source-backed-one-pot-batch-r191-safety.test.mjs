import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find(item => item.recipe_id === 'philips-crab-congee-all-in-one-cooker');
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';

test('r191 closes the directly evidenced raw-crab congee safety gap', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r215');
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  const endpoint = recipe.safety_endpoints.find(row => row.code === 'shellfish_fully_cooked');
  assert.ok(endpoint);
  assert.equal(endpoint.minimum_core_temperature_c, undefined);
  assert.match(endpoint.visual_endpoint ?? '', /珍珠白|白色.*不透明/u);
  assert.deepEqual(endpoint.source_ids, [safetySourceId]);
  const source = recipe.source_refs.find(row => row.source_id === safetySourceId);
  assert.ok(source);
  assert.equal(source.access_status, 'opened');
  assert.equal(source.evidence_tier, 1);
  assert.match(source.evidence_locator, /crab|蟹|甲壳/u);
  assert.deepEqual(source.claim_scopes, ['safety']);
});

test('r191 preserves pressure-cooker and mid-program crab insertion boundaries', () => {
  assert.equal(recipe.cooker_adaptation?.status, 'not_adapted');
  assert.match(recipe.cooking_sequence?.[1]?.instruction ?? '', /压力煮汤|20分钟/u);
  assert.match(recipe.cooking_sequence?.[2]?.instruction ?? '', /剩5分钟.*膏蟹/u);
});

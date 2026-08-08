import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

const expected = [
  'maff-saga-tsugani-meshi',
  'pingtan-golden-crab-glutinous-rice',
];

test('r188 closes two directly evidenced raw-crab safety gaps with visual endpoints', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r198');
  for (const recipeId of expected) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    const endpoint = recipe.safety_endpoints.find(row => row.code === 'shellfish_fully_cooked');
    assert.ok(endpoint, `${recipeId} missing shellfish endpoint`);
    assert.equal(endpoint.minimum_core_temperature_c, undefined, recipeId);
    assert.match(endpoint.visual_endpoint ?? '', /珍珠白|白色.*不透明/u, recipeId);
    assert.deepEqual(endpoint.source_ids, [safetySourceId], recipeId);
    const source = recipe.source_refs.find(row => row.source_id === safetySourceId);
    assert.ok(source, `${recipeId} missing shared safety source`);
    assert.equal(source.url, safetyUrl, recipeId);
    assert.equal(source.access_status, 'opened', recipeId);
    assert.equal(source.evidence_tier, 1, recipeId);
    assert.match(source.evidence_locator, /crab|甲壳|蟹/u, recipeId);
    assert.deepEqual(source.claim_scopes, ['safety'], recipeId);
  }
});

test('r188 preserves traditional-vessel and non-executable boundaries', () => {
  assert.equal(byId['maff-saga-tsugani-meshi']?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(byId['pingtan-golden-crab-glutinous-rice']?.cooker_adaptation?.status, 'not_adapted');
  assert.match(byId['maff-saga-tsugani-meshi']?.cooker_adaptation?.notes ?? '', /传统釜|电饭煲/u);
  assert.match(byId['pingtan-golden-crab-glutinous-rice']?.cooker_adaptation?.notes ?? '', /蒸|电饭煲/u);
});

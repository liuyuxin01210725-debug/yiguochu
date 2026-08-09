import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';

const expected = {
  'maff-tokushima-tai-meshi': ['seafood_fully_cooked', 63, /sea-bream|鲷|fish/u],
  'maff-tochigi-ayu-meshi': ['seafood_fully_cooked', 63, /ayu|香鱼|fish/u],
};

test('r193 closes two directly evidenced MAFF raw-protein safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r249');
  for (const [recipeId, [code, temperature, locatorPattern]] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    const endpoint = recipe.safety_endpoints.find(row => row.code === code);
    assert.ok(endpoint, `${recipeId} missing ${code}`);
    if (temperature === null) {
      assert.equal(endpoint.visual_endpoint, '肉质呈珍珠白或白色且不透明', recipeId);
    } else {
      assert.equal(endpoint.minimum_core_temperature_c, temperature, recipeId);
    }
    assert.deepEqual(endpoint.source_ids, [safetySourceId], recipeId);
    const source = recipe.source_refs.find(row => row.source_id === safetySourceId);
    assert.ok(source, `${recipeId} missing safety source`);
    assert.equal(source.access_status, 'opened', recipeId);
    assert.equal(source.evidence_tier, 1, recipeId);
    assert.match(source.evidence_locator, locatorPattern, recipeId);
    assert.deepEqual(source.claim_scopes, ['safety'], recipeId);
  }
});

test('r193 preserves MAFF preprocessing and non-executable boundaries', () => {
  for (const recipeId of Object.keys(expected)) {
    const recipe = byId[recipeId];
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.notEqual(recipe.cooker_adaptation?.status, 'adapted', recipeId);
  }
  assert.match(byId['maff-tokushima-tai-meshi']?.cooking_sequence?.[0]?.instruction ?? '', /烤|盐/u);
  assert.match(byId['maff-tochigi-ayu-meshi']?.cooking_sequence?.[0]?.instruction ?? '', /烤|香鱼/u);
});

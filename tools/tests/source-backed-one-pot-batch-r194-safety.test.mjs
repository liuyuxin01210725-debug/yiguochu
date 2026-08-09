import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';

const expected = {
  'maff-shimane-sazae-meshi': ['shellfish_fully_cooked', null, /shellfish|sazae|蝾螺/u],
  'maff-nagasaki-torimeshi': ['poultry_fully_cooked', 74, /poultry|chicken|鸡肉/u],
};

test('r194 closes two directly evidenced MAFF shellfish and poultry gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r206');
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

test('r194 preserves the MAFF staged preprocessing boundaries', () => {
  assert.match(byId['maff-shimane-sazae-meshi']?.cooking_sequence?.[0]?.instruction ?? '', /煮|蝾螺/u);
  assert.match(byId['maff-nagasaki-torimeshi']?.cooking_sequence?.[1]?.instruction ?? '', /鸡肉|熟透/u);
  for (const recipeId of Object.keys(expected)) {
    assert.equal(byId[recipeId]?.status, 'recipe_fact_checked', recipeId);
    assert.notEqual(byId[recipeId]?.cooker_adaptation?.status, 'adapted', recipeId);
  }
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

const expected = {
  'quanzhou-red-xun-rice': { code: 'shellfish_fully_cooked', locator: /蟹|红蟳|shellfish|珍珠白|不透明/u },
  'taishan-shixialuo-rice': { code: 'shellfish_fully_cooked', locator: /螺|石硖|shellfish|珍珠白|不透明/u },
  'meixian-shisan-fish-braised-rice': { code: 'seafood_fully_cooked', temperature: 63, locator: /鱼|鲩|fish|63/u },
};

test('r288 closes three directly documented fish and shellfish safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);

  for (const [recipeId, expectedEndpoint] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    const endpoint = recipe.safety_endpoints.find(row => row.code === expectedEndpoint.code);
    assert.ok(endpoint, `${recipeId} missing ${expectedEndpoint.code}`);
    if (expectedEndpoint.temperature != null) {
      assert.equal(endpoint.minimum_core_temperature_c, expectedEndpoint.temperature, recipeId);
    } else {
      assert.equal(endpoint.visual_endpoint, '肉质呈珍珠白或白色且不透明', recipeId);
    }
    assert.deepEqual(endpoint.source_ids, [safetySourceId], recipeId);
    const source = recipe.source_refs.find(row => row.source_id === safetySourceId);
    assert.ok(source, `${recipeId} missing shared safety source`);
    assert.equal(source.url, safetyUrl, recipeId);
    assert.equal(source.access_status, 'opened', recipeId);
    assert.equal(source.evidence_tier, 1, recipeId);
    assert.match(source.evidence_locator, expectedEndpoint.locator, recipeId);
    assert.deepEqual(source.claim_scopes, ['safety'], recipeId);
  }
});

test('r288 preserves the historical vessel and staged-process boundaries', () => {
  assert.equal(byId['quanzhou-red-xun-rice'].cooker_adaptation.status, 'not_adapted');
  assert.equal(byId['taishan-shixialuo-rice'].cooker_adaptation.status, 'not_adapted');
  assert.equal(byId['meixian-shisan-fish-braised-rice'].cooker_adaptation.status, 'not_adapted');
  assert.equal(byId['quanzhou-red-xun-rice'].fixed_batch, null);
  assert.equal(byId['taishan-shixialuo-rice'].liquid_contract, null);
  assert.equal(byId['meixian-shisan-fish-braised-rice'].time_contract, null);
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

const safetySourceId = 'S-SAFETY-TEMPERATURES-1';

const expected = {
  'tiger-pork-bamboo-rice': ['pork_fully_cooked', 74],
  'tiger-scallop-pea-rice': ['shellfish_fully_cooked', null],
  'tiger-beef-matsutake-rice': ['beef_fully_cooked', 71],
  'toshiba-bibimbap-mixed-rice': ['beef_fully_cooked', 71],
  'zojirushi-brown-rice-ih-pot': ['poultry_fully_cooked', 74],
  'panasonic-chicken-vegetable-rice': ['poultry_fully_cooked', 74],
};

test('r157 closes only high-confidence raw protein safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r187');
  for (const [recipeId, [code, temperature]] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, recipeId);
    const endpoint = recipe.safety_endpoints.find(row => row.code === code);
    assert.ok(endpoint, `${recipeId} missing ${code}`);
    if (temperature === null) assert.equal(endpoint.minimum_core_temperature_c, undefined, recipeId);
    else assert.equal(endpoint.minimum_core_temperature_c, temperature, recipeId);
    assert.deepEqual(endpoint.source_ids, [safetySourceId], recipeId);
    const source = recipe.source_refs.find(row => row.source_id === safetySourceId);
    assert.ok(source, `${recipeId} missing shared safety source`);
    assert.equal(source.access_status, 'opened', recipeId);
    assert.equal(source.evidence_tier, 1, recipeId);
    assert.match(source.evidence_locator, /lamb|pork|poultry|beef|牛|猪|鸡|贝类|扇贝|scallop|鱼/i, recipeId);
    assert.deepEqual(source.claim_scopes, ['safety'], recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
  }
});

test('r157 keeps unresolved raw-status or cut/contract blockers out of safety promotion', () => {
  for (const recipeId of [
    'panasonic-tokyo-seafood-pilaf',
    'tiger-seafood-pilaf',
    'toshiba-seafood-paella-rice',
    'philips-sea-conch-oyster-chicken-congee',
    'panasonic-my-chicken-pumpkin-lotus-mixed-rice',
    'yutian-electric-cooker-lamb-pilaf',
  ]) {
    assert.deepEqual(byId[recipeId]?.safety_endpoints, [], recipeId);
  }
});

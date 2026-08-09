import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';
const expected = {
  'sg-healthhub-chicken-briyani': {
    code: 'poultry_fully_cooked',
    temperature: 74,
    locator: /poultry 165°F \/ 74°C/u,
  },
  'taiwan-sesame-oil-chicken-glutinous-rice-cake': {
    code: 'poultry_fully_cooked',
    temperature: 74,
    locator: /poultry 165°F \/ 74°C/u,
  },
  'maff-salmon-corn-japanese-paella': {
    code: 'seafood_fully_cooked',
    temperature: 63,
    locator: /fish 145°F \/ 63°C/u,
  },
};

test('r250 closes three directly evidenced poultry and fish safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r251');
  assert.equal(catalog.recipes.length, 923);
  for (const [id, expectedEndpoint] of Object.entries(expected)) {
    const recipe = catalog.recipes.find(({ recipe_id: recipeId }) => recipeId === id);
    assert.ok(recipe, `missing ${id}`);
    assert.equal(recipe.status, 'recipe_fact_checked');
    assert.deepEqual(recipe.safety_endpoints, [{
      code: expectedEndpoint.code,
      minimum_core_temperature_c: expectedEndpoint.temperature,
      source_ids: ['S-SAFETY-TEMPERATURES-1'],
    }]);
    const source = recipe.source_refs.find(({ source_id: sourceId }) => sourceId === 'S-SAFETY-TEMPERATURES-1');
    assert.ok(source, `${id} lacks FoodSafety.gov source`);
    assert.deepEqual(source.claim_scopes, ['safety']);
    assert.equal(source.url, safetyUrl);
    assert.equal(source.access_status, 'opened');
    assert.equal(source.evidence_tier, 1);
    assert.match(source.evidence_locator, expectedEndpoint.locator);
  }
});

test('r250 preserves the original staged and vessel boundaries', () => {
  const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.match(byId['sg-healthhub-chicken-briyani'].cooker_adaptation.notes, /另锅|分层|rice cooking mode/u);
  assert.match(byId['taiwan-sesame-oil-chicken-glutinous-rice-cake'].evidence_notes, /复蒸|糯米糕/u);
  assert.match(byId['maff-salmon-corn-japanese-paella'].evidence_notes, /炉灶|平底锅/u);
  for (const id of Object.keys(expected)) assert.notEqual(byId[id].status, 'executable');
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  {
    recipeId: 'sdsu-easy-red-beans-rice',
    name: 'Easy One-Pot Red Beans & Rice',
    url: 'https://extension.sdstate.edu/one-pot-meals',
    vessel: /普通锅|煎锅|skillet/u,
  },
  {
    recipeId: 'illinois-texas-hash',
    name: 'Texas Hash',
    url: 'https://eat-move-save.extension.illinois.edu/eat/recipes/texas-hash',
    vessel: /普通锅|煎锅|skillet/u,
  },
  {
    recipeId: 'va-pork-rice-skillet',
    name: 'Pork and Rice Skillet',
    url: 'https://www.nutrition.va.gov/docs/Recipes/MainDishes/Pork-And-Rice-Skillet.pdf',
    vessel: /普通锅|煎锅|skillet/u,
  },
];

test('r129 integrates only directly evidenced main-dish candidates from r129-public5', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r187');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);

  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.ok(recipe, item.recipeId);
    assert.equal(recipe.canonical_name, item.name, item.recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', item.recipeId);
    assert.equal(recipe.identity_status, 'verified', item.recipeId);
    assert.notEqual(recipe.status, 'executable', item.recipeId);
    assert.ok(recipe.core_ingredients.length >= 4, item.recipeId);
    assert.ok(recipe.cooking_sequence.length >= 2, item.recipeId);
    assert.match(recipe.traditional_vessels.join(' '), item.vessel, item.recipeId);
    assert.equal(recipe.cooker_adaptation.status, 'source_limited', item.recipeId);

    const source = recipe.source_refs.find((candidate) => candidate.url === item.url);
    assert.ok(source, `${item.recipeId}: official source URL`);
    assert.equal(source.access_status, 'opened', item.recipeId);
    assert.ok(source.evidence_locator, item.recipeId);
    assert.ok(source.claim_scopes.includes('identity'), item.recipeId);
    assert.ok(source.claim_scopes.includes('ingredients'), item.recipeId);
    assert.ok(source.claim_scopes.includes('process'), item.recipeId);
  }
});

test('r129 preserves source appliance, quantities, timings, and safety gaps', () => {
  const sdsu = byId.get('sdsu-easy-red-beans-rice');
  assert.equal(sdsu.fixed_batch.servings, 4);
  assert.equal(sdsu.fixed_batch.ingredients.find((item) => item.name === '糙米').amount.value, 1);
  assert.equal(sdsu.liquid_contract.amount.value, 2);
  assert.equal(sdsu.liquid_contract.amount.unit, 'cup');
  assert.equal(sdsu.time_contract.total_minutes, 55);
  assert.deepEqual(sdsu.safety_endpoints, []);

  const texas = byId.get('illinois-texas-hash');
  assert.equal(texas.fixed_batch.servings, 5);
  assert.equal(texas.fixed_batch.ingredients.find((item) => item.name === '米').amount.value, 1);
  assert.equal(texas.liquid_contract.amount.value, 2);
  assert.equal(texas.liquid_contract.amount.unit, 'cup');
  assert.equal(texas.time_contract.total_minutes, 20);
  assert.deepEqual(texas.safety_endpoints, [{ code: 'beef_fully_cooked', minimum_core_temperature_c: 71.1, source_ids: ['S-R129-ILLINOIS-TEXAS-HASH-1'] }]);

  const pork = byId.get('va-pork-rice-skillet');
  assert.equal(pork.fixed_batch.servings, 4);
  assert.equal(pork.fixed_batch.ingredients.find((item) => item.name === '糙米').amount.value, 1);
  assert.equal(pork.liquid_contract.amount.value, 2);
  assert.equal(pork.liquid_contract.amount.unit, 'cup');
  assert.equal(pork.time_contract.total_minutes, 75);
  assert.deepEqual(pork.safety_endpoints, []);
});

test('r129 keeps candidate assets below executable and excludes side-dish-only r129 entries', () => {
  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.ok(!['approved', 'auto_approved', 'executable', 'preview_ready'].includes(recipe.status), item.recipeId);
    assert.match(recipe.evidence_notes, /来源|普通锅|煎锅|主餐/u, item.recipeId);
  }
  assert.equal(byId.has('umich-one-pot-beans-rice'), false);
  assert.equal(byId.has('rice-university-middle-eastern-rice'), false);
});

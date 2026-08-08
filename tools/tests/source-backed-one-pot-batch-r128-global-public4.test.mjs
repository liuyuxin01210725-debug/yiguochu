import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  {
    recipeId: 'tamu-turkey-burrito-bowl',
    name: 'Turkey Burrito Bowl',
    url: 'https://dinnertonight.tamu.edu/recipe/turkey-burrito-bowl/',
    vessel: /电压力锅|electric pressure cooker/u,
    adaptation: 'source_limited',
  },
  {
    recipeId: 'purdue-one-pot-lentil-dish',
    name: 'One-pot Lentil Dish',
    url: 'https://www.purdue.edu/indianasefrnetwork/Home/MDDetail/131',
    vessel: /普通大锅|普通锅|large pot/u,
    adaptation: 'source_limited',
  },
  {
    recipeId: 'uconn-crock-pot-enchilada-rice',
    name: 'Crock Pot Enchilada Rice',
    url: 'https://huskynutritionsport.education.uconn.edu/recipes/crock-pot-enchilada-rice/',
    vessel: /慢炖锅|crock pot|slow cooker/u,
    adaptation: 'source_limited',
  },
  {
    recipeId: 'unh-spanish-rice',
    name: 'Spanish Rice',
    url: 'https://extension.unh.edu/recipe/spanish-rice',
    vessel: /普通锅|带盖锅|covered pot/u,
    adaptation: 'source_limited',
  },
  {
    recipeId: 'illinois-governors-mansion-chicken-manoomin',
    name: 'Chicken & Rice（Wild Rice/Manoomin）',
    url: 'https://governorsmansion.illinois.gov/all-recipes/recipe.chicken-and-rice.html',
    vessel: /重锅|普通锅|heavy pot/u,
    adaptation: 'source_limited',
  },
];

test('r128 adds five directly evidenced global rice-main candidates', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r137');
  assert.equal(catalog.recipes.length, 916);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);

  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.ok(recipe, item.recipeId);
    assert.equal(recipe.canonical_name, item.name, item.recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', item.recipeId);
    assert.equal(recipe.identity_status, 'verified', item.recipeId);
    assert.notEqual(recipe.status, 'executable', item.recipeId);
    assert.notEqual(recipe.status, 'preview_ready', item.recipeId);
    assert.ok(recipe.core_ingredients.length >= 3, item.recipeId);
    assert.ok(recipe.cooking_sequence.length >= 2, item.recipeId);
    assert.match(recipe.traditional_vessels.join(' '), item.vessel, item.recipeId);
    assert.equal(recipe.cooker_adaptation.status, item.adaptation, item.recipeId);

    const source = recipe.source_refs.find((candidate) => candidate.url === item.url);
    assert.ok(source, `${item.recipeId}: official source URL`);
    assert.equal(source.access_status, 'opened', item.recipeId);
    assert.ok(source.evidence_locator, item.recipeId);
    assert.ok(source.claim_scopes.includes('identity'), item.recipeId);
    assert.ok(source.claim_scopes.includes('ingredients'), item.recipeId);
    assert.ok(source.claim_scopes.includes('process'), item.recipeId);
  }
});

test('r128 preserves original appliance, quantity, liquid and safety boundaries', () => {
  const tamu = byId.get('tamu-turkey-burrito-bowl');
  assert.equal(tamu.fixed_batch.servings, 10);
  assert.equal(tamu.fixed_batch.ingredients.find((item) => item.name === '长粒白米').amount.value, 1);
  assert.equal(tamu.liquid_contract.amount.value, 2);
  assert.equal(tamu.liquid_contract.amount.unit, 'cup');
  assert.equal(tamu.time_contract.total_minutes, 20);
  assert.deepEqual(tamu.safety_endpoints, []);

  const lentil = byId.get('purdue-one-pot-lentil-dish');
  assert.equal(lentil.fixed_batch, null);
  assert.equal(lentil.liquid_contract.amount.value, 3);
  assert.equal(lentil.liquid_contract.amount.unit, 'cup');
  assert.equal(lentil.time_contract.total_minutes, 40);

  const enchilada = byId.get('uconn-crock-pot-enchilada-rice');
  assert.equal(enchilada.fixed_batch.servings, 6);
  assert.equal(enchilada.liquid_contract, null);
  assert.deepEqual(enchilada.safety_endpoints, []);

  const spanish = byId.get('unh-spanish-rice');
  assert.equal(spanish.fixed_batch.servings, 6);
  assert.equal(spanish.liquid_contract.amount.value, 1);
  assert.equal(spanish.liquid_contract.amount.unit, 'cup');
  assert.equal(spanish.time_contract.total_minutes, 45);

  const illinois = byId.get('illinois-governors-mansion-chicken-manoomin');
  assert.equal(illinois.fixed_batch, null);
  assert.equal(illinois.liquid_contract.amount.value, 2);
  assert.equal(illinois.liquid_contract.amount.unit, 'qt');
  assert.equal(illinois.time_contract, null);
  assert.deepEqual(illinois.safety_endpoints, []);
});

test('r128 candidates remain source assets, never automatic promotions', () => {
  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.match(recipe.evidence_notes, /来源|官方|普通锅|电压力锅|慢炖锅|重锅/u, item.recipeId);
    assert.ok(!['approved', 'auto_approved', 'executable', 'preview_ready'].includes(recipe.status), item.recipeId);
  }
});

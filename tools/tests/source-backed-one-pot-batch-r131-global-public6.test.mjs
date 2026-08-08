import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  {
    recipeId: 'asmi-pink-salmon-rice-bowls',
    name: 'Pink Salmon Rice Bowls (One-Pot Rice Cooker Meal)',
    url: 'https://www.alaskaseafood.org/recipe/pink-salmon-rice-bowls-one-pot-rice-cooker-meal/',
    vessel: /电饭煲|rice cooker/u,
    boundary: /电饭煲|rice cooker/u,
  },
  {
    recipeId: 'urochester-smoky-hoppin-john',
    name: 'Smoky Hoppin’ John',
    url: 'https://www.urmc.rochester.edu/news/publications/cooking-for-wellness/smoky-hoppin-john',
    vessel: /普通锅|煎锅|skillet/u,
    boundary: /即食米|熟豆|普通锅|skillet/u,
  },
  {
    recipeId: 'usu-salsa-verde-chicken-rice',
    name: 'Salsa Verde Chicken',
    url: 'https://www.usu.edu/campusrec/files/Cooking-on-a-Budget-Cookbook.pdf',
    vessel: /普通锅|高边锅|重锅|有盖锅/u,
    boundary: /普通锅|不外推电饭煲/u,
  },
  {
    recipeId: 'nih-medlineplus-chicken-rice',
    name: 'Chicken and Rice',
    url: 'https://medlineplus.gov/recipes/chicken-and-rice/',
    vessel: /普通锅|大锅/u,
    boundary: /取出|回锅|分阶段|普通锅/u,
  },
];

test('r131 integrates only directly evidenced global public candidates', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r133');
  assert.equal(catalog.recipes.length, 906);
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
    assert.match(recipe.cooker_adaptation.notes, item.boundary, item.recipeId);

    const source = recipe.source_refs.find((candidate) => candidate.url === item.url);
    assert.ok(source, `${item.recipeId}: official source URL`);
    assert.equal(source.access_status, 'opened', item.recipeId);
    assert.ok(source.evidence_locator, item.recipeId);
    assert.ok(source.evidence_tier >= 1 && source.evidence_tier <= 5, item.recipeId);
    assert.ok(source.claim_scopes.includes('identity'), item.recipeId);
    assert.ok(source.claim_scopes.includes('ingredients'), item.recipeId);
    assert.ok(source.claim_scopes.includes('process'), item.recipeId);
  }
});

test('r131 preserves source-specific batches and staged boundaries', () => {
  const salmon = byId.get('asmi-pink-salmon-rice-bowls');
  assert.equal(salmon.fixed_batch.servings, 2);
  assert.equal(salmon.fixed_batch.ingredients.find((item) => item.name === '米').amount.value, 1);
  assert.equal(salmon.liquid_contract.amount.value, 1.25);
  assert.equal(salmon.liquid_contract.amount.unit, 'cup');
  assert.equal(salmon.time_contract.total_minutes, 40);
  assert.deepEqual(salmon.safety_endpoints, []);

  const hoppin = byId.get('urochester-smoky-hoppin-john');
  assert.equal(hoppin.fixed_batch.servings, 4);
  assert.equal(hoppin.fixed_batch.ingredients.find((item) => item.name === '即食糙米').amount.value, 0.5);
  assert.equal(hoppin.liquid_contract.amount.value, 1);
  assert.equal(hoppin.liquid_contract.amount.unit, 'cup');
  assert.equal(hoppin.time_contract.total_minutes, 22);
  assert.deepEqual(hoppin.safety_endpoints, []);

  const salsa = byId.get('usu-salsa-verde-chicken-rice');
  assert.equal(salsa.fixed_batch.servings, 4);
  assert.equal(salsa.fixed_batch.ingredients.find((item) => item.name === '长粒白米').amount.value, 1);
  assert.equal(salsa.liquid_contract.amount.value, 1.5);
  assert.equal(salsa.liquid_contract.amount.unit, 'cup');
  assert.equal(salsa.time_contract.total_minutes, 30);
  assert.deepEqual(salsa.safety_endpoints, []);

  const chickenRice = byId.get('nih-medlineplus-chicken-rice');
  assert.equal(chickenRice.fixed_batch.servings, 6);
  assert.equal(chickenRice.fixed_batch.ingredients.find((item) => item.name === '米').amount.value, 2);
  assert.equal(chickenRice.liquid_contract.amount.value, 4);
  assert.equal(chickenRice.liquid_contract.amount.unit, 'cup');
  assert.equal(chickenRice.time_contract.total_minutes, 90);
  assert.deepEqual(chickenRice.safety_endpoints, []);
  assert.match(chickenRice.cooking_sequence.map((step) => step.instruction).join(' '), /取出|放回|回锅/u);
});

test('r131 does not pull in cooked-rice or blocked candidates', () => {
  assert.equal(byId.has('psu-leftover-rice-bean-greens-skillet'), false);
  assert.equal(byId.has('usu-one-pot-spinach-rice-blocked'), false);
});

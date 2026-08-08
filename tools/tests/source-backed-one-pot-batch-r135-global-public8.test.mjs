import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  {
    recipeId: 'cleveland-clinic-chicken-brown-rice-casserole',
    name: 'One-Pot Chicken and Brown Rice Casserole',
    url: 'https://health.clevelandclinic.org/one-pot-chicken-brown-rice-casserole-recipe?slug=one-pot-chicken-brown-rice-casserole-recipe%2F',
    vessel: /汤锅|stock pot/iu,
    boundary: /普通|汤锅|四季豆|不外推电饭煲/iu,
    servings: 2,
  },
  {
    recipeId: 'bmc-chicken-carrots-brown-rice',
    name: 'One-Pot Chicken, Carrots, and Rice',
    url: 'https://www.bmc.org/recipes/one-pot-chicken-carrots-and-rice',
    vessel: /煎锅|frying pan/iu,
    boundary: /普通|煎锅|4–6|不外推电饭煲/iu,
    servings: null,
  },
  {
    recipeId: 'kidney-care-chicken-tikka-pulao',
    name: 'Chicken tikka pulao',
    url: 'https://kidneycareuk.org/get-support/healthy-diet-support/kidney-kitchen/recipe-index/chicken-tikka-pulao/',
    vessel: /普通|带盖锅|pan/iu,
    boundary: /普通|pulao|不外推电饭煲/iu,
    servings: 4,
  },
  {
    recipeId: 'firststeps-turkey-vegetable-pilaf',
    name: 'Turkey and vegetable pilaf',
    url: 'https://www.firststepsnutrition.org/s/Eating-Well-Recipe-Book-for-web-10-Apr-2022-for-web.pdf',
    vessel: /普通|大锅|pan/iu,
    boundary: /普通|pilaf|不外推电饭煲/iu,
    servings: 4,
  },
  {
    recipeId: 'firststeps-vegetable-biryani',
    name: 'Vegetable biryani',
    url: 'https://www.firststepsnutrition.org/s/Eating-Well-Recipe-Book-for-web-10-Apr-2022-for-web.pdf',
    vessel: /普通|大锅|pan/iu,
    boundary: /普通|biryani|不外推电饭煲/iu,
    servings: 4,
  },
];

test('r135 integrates five directly opened global public candidates only', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r148');
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
    assert.match(recipe.cooker_adaptation.notes, item.boundary, item.recipeId);
    if (item.servings == null) assert.equal(recipe.fixed_batch, null, item.recipeId);
    else assert.equal(recipe.fixed_batch.servings, item.servings, item.recipeId);

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

test('r135 preserves source-specific quantities, states and boundaries', () => {
  const cleveland = byId.get('cleveland-clinic-chicken-brown-rice-casserole');
  assert.equal(cleveland.fixed_batch.servings, 2);
  assert.equal(cleveland.fixed_batch.ingredients.find((item) => item.name === '未煮糙米').amount.value, 0.5);
  assert.equal(cleveland.liquid_contract.amount.value, 2);
  assert.equal(cleveland.liquid_contract.amount.unit, 'cup');
  assert.equal(cleveland.time_contract, null);
  assert.match(cleveland.cooking_sequence.map((step) => step.instruction).join(' '), /四季豆|35|8–10|低火/u);

  const bmc = byId.get('bmc-chicken-carrots-brown-rice');
  assert.equal(bmc.fixed_batch, null);
  assert.equal(bmc.liquid_contract.amount.value, 4);
  assert.equal(bmc.liquid_contract.amount.unit, 'cup');
  assert.equal(bmc.time_contract.total_minutes, 60);
  assert.match(bmc.cooking_sequence.map((step) => step.instruction).join(' '), /鸡|米|30/u);

  const kidney = byId.get('kidney-care-chicken-tikka-pulao');
  assert.equal(kidney.fixed_batch.servings, 4);
  assert.equal(kidney.fixed_batch.ingredients.find((item) => item.name === '巴斯马蒂米').amount.value, 300);
  assert.equal(kidney.liquid_contract.amount.value, 850);
  assert.equal(kidney.liquid_contract.amount.unit, 'ml');
  assert.equal(kidney.time_contract.total_minutes, 40);
  assert.match(kidney.cooking_sequence.map((step) => step.instruction).join(' '), /豌豆|四季豆|30/u);

  const turkey = byId.get('firststeps-turkey-vegetable-pilaf');
  assert.equal(turkey.fixed_batch.servings, 4);
  assert.equal(turkey.fixed_batch.ingredients.find((item) => item.name === '白米').amount.value, 200);
  assert.equal(turkey.liquid_contract.amount.value, 400);
  assert.equal(turkey.liquid_contract.amount.unit, 'ml');
  assert.equal(turkey.time_contract.total_minutes, 15);
  assert.match(turkey.cooking_sequence.map((step) => step.instruction).join(' '), /火鸡|甜玉米|15/u);

  const biryani = byId.get('firststeps-vegetable-biryani');
  assert.equal(biryani.fixed_batch.servings, 4);
  assert.equal(biryani.fixed_batch.ingredients.find((item) => item.name === '白米').amount.value, 200);
  assert.equal(biryani.liquid_contract.amount.value, 400);
  assert.equal(biryani.liquid_contract.amount.unit, 'ml');
  assert.equal(biryani.time_contract.total_minutes, 20);
  assert.match(biryani.cooking_sequence.map((step) => step.instruction).join(' '), /鹰嘴豆|花椰菜|20/u);
});

test('r135 does not pull in canonical variants, side dishes, or cooked-rice/oven-only candidates', () => {
  for (const recipeId of [
    'eatright-new-orleans-red-beans-rice-variant',
    'umich-one-pot-beans-rice',
    'incredible-egg-rice-bean-baked-eggs',
  ]) {
    assert.equal(byId.has(recipeId), false, recipeId);
  }
});

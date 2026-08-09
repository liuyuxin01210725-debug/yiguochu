import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  {
    recipeId: 'unl-chicken-rice',
    name: 'Chicken & Rice',
    url: 'https://food.unl.edu/recipe/chicken-rice/',
    vessel: /普通锅|大锅|pressure cooker/iu,
    boundary: /浸泡|熟豆|普通锅|不外推电饭煲/iu,
    servings: 8,
  },
  {
    recipeId: 'osu-cheesy-chicken-rice-vegetable-skillet',
    name: 'Cheesy Chicken, Rice, & Vegetable Skillet',
    url: 'https://u.osu.edu/simplesuppers/recipes/cheesy-chicken-rice-vegetable-skillet/',
    vessel: /skillet|煎锅/iu,
    boundary: /普通锅|skillet|不外推电饭煲/iu,
    servings: null,
  },
  {
    recipeId: 'illinois-extension-arroz-con-pollo',
    name: 'Arroz con Pollo (Chicken with Rice)',
    url: 'https://extension.illinois.edu/diabetes/recipes/arroz-con-pollo-chicken-rice',
    vessel: /普通锅|煎锅|skillet/iu,
    boundary: /取出|回锅|分阶段/iu,
    servings: 9,
  },
  {
    recipeId: 'cu-caribbean-jerk-chicken-rice',
    name: 'One Pot Caribbean Jerk Chicken & Rice',
    url: 'https://www.cu.edu/doc/ssc-cookbookpdf',
    vessel: /skillet|荷兰锅|烤箱/iu,
    boundary: /取出|回锅|烤箱|不外推电饭煲/iu,
    servings: 6,
  },
];

test('r133 integrates four directly opened global public candidates only', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r244');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(new Set(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe.region_codes.join(',')].join('\u0000'))).size, catalog.recipes.length);

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

test('r133 preserves source-specific quantities and staged boundaries', () => {
  const unl = byId.get('unl-chicken-rice');
  assert.equal(unl.fixed_batch.ingredients.find((item) => item.name === 'Basmati米').amount.value, 1);
  assert.equal(unl.liquid_contract.amount.value, 2.5);
  assert.equal(unl.liquid_contract.amount.unit, 'cup');
  assert.equal(unl.time_contract, null);
  assert.match(unl.cooking_sequence.map((step) => step.instruction).join(' '), /浸泡|熟豆/u);

  const osu = byId.get('osu-cheesy-chicken-rice-vegetable-skillet');
  assert.equal(osu.fixed_batch, null);
  assert.ok(Math.abs(osu.liquid_contract.amount.value - (4 / 3)) < 1e-9);
  assert.equal(osu.liquid_contract.amount.unit, 'cup');
  assert.equal(osu.time_contract, null);
  assert.match(osu.cooking_sequence.map((step) => step.instruction).join(' '), /即食|米|西兰花/u);

  const illinois = byId.get('illinois-extension-arroz-con-pollo');
  assert.equal(illinois.fixed_batch.servings, 9);
  assert.equal(illinois.fixed_batch.ingredients.find((item) => item.name === '长粒白米').amount.value, 1);
  assert.equal(illinois.liquid_contract.amount.value, 14.5);
  assert.equal(illinois.liquid_contract.amount.unit, 'oz');
  assert.equal(illinois.time_contract, null);
  assert.match(illinois.cooking_sequence.map((step) => step.instruction).join(' '), /取出|回锅/u);

  const cu = byId.get('cu-caribbean-jerk-chicken-rice');
  assert.equal(cu.fixed_batch.servings, 6);
  assert.equal(cu.fixed_batch.ingredients.find((item) => item.name === '未煮长粒米').amount.value, 2);
  assert.equal(cu.liquid_contract.amount.value, 2);
  assert.equal(cu.liquid_contract.amount.unit, 'cup');
  assert.equal(cu.time_contract.total_minutes, 45);
  assert.match(cu.cooking_sequence.map((step) => step.instruction).join(' '), /取出|回锅|烤箱/u);
});

test('r133 does not pull in cooked-rice or blocked candidates', () => {
  for (const recipeId of [
    'ncsu-leftover-rice-chicken-stir-fry',
    'nih-wiki-fast-rice',
    'osu-burrito-bowl-cooked-rice',
    'kstate-mamas-chicken-rice',
    'va-chicken-cauliflower-enchilada-skillet',
    'ucf-southwest-chicken-rice-skillet',
    'tamu-skillet-chicken-rice-casserole',
    'usc-spanish-chicken-sausage-shrimp-rice',
  ]) {
    assert.equal(byId.has(recipeId), false, recipeId);
  }
});

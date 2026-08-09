import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  {
    recipeId: 'healthvermont-spinach-carrot-rice-pilaf',
    name: 'Spinach and Carrot Rice Pilaf',
    url: 'https://www.healthvermont.gov/sites/default/files/documents/2016/12/cyf_WIC_EatWell_more_brown-rice_recipes.pdf',
    vessel: /saucepan|锅|煲/iu,
    boundary: /普通|saucepan|不外推电饭煲/iu,
    servings: 4,
  },
  {
    recipeId: 'healthvermont-easy-veggie-risotto',
    name: 'Easy Veggie Risotto',
    url: 'https://www.healthvermont.gov/sites/default/files/documents/2016/12/cyf_WIC_EatWell_more_brown-rice_recipes.pdf',
    vessel: /skillet|煎锅|平底锅/iu,
    boundary: /普通|skillet|不外推电饭煲/iu,
    servings: 4,
  },
  {
    recipeId: 'healthvermont-one-pot-chicken-brown-rice',
    name: 'One Pot Chicken and Rice',
    url: 'https://www.healthvermont.gov/sites/default/files/documents/2016/12/cyf_WIC_EatWell_more_brown-rice_recipes.pdf',
    vessel: /烤箱|oven|casserole/iu,
    boundary: /烤箱|oven|不外推电饭煲/iu,
    servings: 6,
  },
  {
    recipeId: 'cdph-calfresh-chicken-rice',
    name: 'Chicken and Rice',
    url: 'https://calfreshhealthyliving.cdph.ca.gov/en/recipes/Pages/Chicken-and-Rice.aspx',
    vessel: /skillet|煎锅|平底锅/iu,
    boundary: /取出|回放|staged|不外推电饭煲/iu,
    servings: 6,
  },
  {
    recipeId: 'wisconsin-polk-arroz-con-pollo',
    name: 'Arroz con Pollo Chicken and Rice',
    url: 'https://polk.extension.wisc.edu/files/2012/10/Compiled-Book-Draft-2.pdf',
    vessel: /skillet|煎锅|平底锅/iu,
    boundary: /普通|分阶段|不外推电饭煲/iu,
    servings: 6,
  },
];

test('r137 integrates five direct public candidates without promoting them', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r241');
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
    assert.equal(recipe.fixed_batch.servings, item.servings, item.recipeId);

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

test('r137 preserves source-specific rice states and staged boundaries', () => {
  const spinach = byId.get('healthvermont-spinach-carrot-rice-pilaf');
  assert.equal(spinach.fixed_batch.ingredients.find((item) => item.name === '糙米').amount.value, 1);
  assert.equal(spinach.liquid_contract.amount.value, 2);
  assert.equal(spinach.liquid_contract.amount.unit, 'cup');
  assert.match(spinach.cooking_sequence.map((step) => step.instruction).join(' '), /菠菜|40|液体吸收/u);

  const risotto = byId.get('healthvermont-easy-veggie-risotto');
  assert.equal(risotto.fixed_batch.ingredients.find((item) => item.name === '糙米').amount.value, 1);
  assert.equal(risotto.liquid_contract.amount.value, 1.5);
  assert.equal(risotto.liquid_contract.amount.unit, 'cup');
  assert.match(risotto.cooking_sequence.map((step) => step.instruction).join(' '), /西兰花|红椒|豌豆|奶酪/u);

  const chicken = byId.get('healthvermont-one-pot-chicken-brown-rice');
  assert.equal(chicken.fixed_batch.ingredients.find((item) => item.name === '糙米').amount.value, 1.5);
  assert.equal(chicken.liquid_contract.amount.value, 3);
  assert.equal(chicken.liquid_contract.amount.unit, 'cup');
  assert.equal(chicken.time_contract, null);
  assert.match(chicken.cooking_sequence.map((step) => step.instruction).join(' '), /400|烤|鸡肉/u);

  const calfresh = byId.get('cdph-calfresh-chicken-rice');
  assert.equal(calfresh.fixed_batch.ingredients.find((item) => item.name === '糙米').amount.value, 0.75);
  assert.equal(calfresh.liquid_contract.amount.value, 2);
  assert.equal(calfresh.liquid_contract.amount.unit, 'cup');
  assert.match(calfresh.cooking_sequence.map((step) => step.instruction).join(' '), /取出|回放|30|静置/u);

  const polk = byId.get('wisconsin-polk-arroz-con-pollo');
  assert.equal(polk.fixed_batch.ingredients.find((item) => item.name === '未煮米').amount.value, 1);
  assert.equal(polk.liquid_contract.amount.value, 2.25);
  assert.equal(polk.liquid_contract.amount.unit, 'cup');
  assert.match(polk.cooking_sequence.map((step) => step.instruction).join(' '), /鸡|番茄|20|豌豆/u);
});

test('r137 keeps side dishes, cooked-rice variants and unapproved canonical merges out', () => {
  for (const recipeId of [
    'unh-rice-pilaf',
    'healthvermont-beef-brown-rice-broccoli-stir-fry',
    'healthvermont-veggie-stir-fry-over-brown-rice',
    'wisconsin-sawyer-chicken-rice-broccoli',
    'wisconsin-kewaunee-chicken-rice-broccoli-bake',
  ]) {
    assert.equal(byId.has(recipeId), false, recipeId);
  }
});

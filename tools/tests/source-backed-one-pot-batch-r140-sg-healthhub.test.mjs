import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  {
    recipeId: 'sg-healthhub-nasi-kuning',
    name: 'Nasi Kuning',
    url: 'https://www.healthhub.sg/well-being-and-lifestyle/food-diet-and-nutrition/nasi-kuning',
    vessel: /rice cooker|电饭煲|电锅/iu,
    boundary: /炒锅|wok|后拌|不外推/iu,
    servings: null,
  },
  {
    recipeId: 'sg-healthhub-chicken-briyani',
    name: 'Chicken Briyani',
    url: 'https://ch-api.healthhub.sg/api/public/content/dcd55c4444624855949b0b1cfaa4e86c?v=5eb0cb6f',
    vessel: /rice cooker|电饭煲|普通锅/iu,
    boundary: /半熟|分层|另锅|不外推/iu,
    servings: 4,
  },
  {
    recipeId: 'sg-healthhub-brown-rice-chicken-congee',
    name: 'Brown Rice Chicken Congee',
    url: 'https://ch-api.healthhub.sg/api/public/content/6f3ac74473de451faa5ed46fdb084ce5?v=57588ce9',
    vessel: /rice cooker|电饭煲|电锅/iu,
    boundary: /分阶段|后段|不外推/iu,
    servings: 4,
  },
  {
    recipeId: 'sg-healthhub-bubur-lambuk',
    name: 'Bubur Lambuk',
    url: 'https://www.healthhub.sg/programmes/korangok/resources/bubur-lambuk',
    vessel: /普通锅|汤锅|pot/iu,
    boundary: /煎蛋|另锅|普通锅|不外推/iu,
    servings: null,
  },
];

test('r140 integrates four Singapore HealthHub candidates without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r209');
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

test('r140 preserves HealthHub quantities and staged boundaries', () => {
  const nasi = byId.get('sg-healthhub-nasi-kuning');
  assert.equal(nasi.fixed_batch, null);
  assert.equal(nasi.liquid_contract.amount.value, 500);
  assert.equal(nasi.liquid_contract.amount.unit, 'ml');
  assert.match(nasi.cooking_sequence.map((step) => step.instruction).join(' '), /炒|rice cooker|吞拿鱼|番茄|青豆/u);

  const briyani = byId.get('sg-healthhub-chicken-briyani');
  assert.equal(briyani.fixed_batch.servings, 4);
  assert.equal(briyani.time_contract.total_minutes, 100);
  assert.equal(briyani.liquid_contract, null);
  assert.match(briyani.cooking_sequence.map((step) => step.instruction).join(' '), /半熟|分层|另锅|rice cooking mode/u);

  const congee = byId.get('sg-healthhub-brown-rice-chicken-congee');
  assert.equal(congee.fixed_batch.servings, 4);
  assert.equal(congee.liquid_contract.amount.value, 10);
  assert.equal(congee.liquid_contract.amount.unit, 'cup');
  assert.equal(congee.time_contract, null);
  assert.match(congee.cooking_sequence.map((step) => step.instruction).join(' '), /糙米|鸡肉|胡萝卜|蘑菇|白菜|拆丝/u);

  const bubur = byId.get('sg-healthhub-bubur-lambuk');
  assert.equal(bubur.fixed_batch, null);
  assert.equal(bubur.liquid_contract.amount.value, 1500);
  assert.equal(bubur.liquid_contract.amount.unit, 'ml');
  assert.equal(bubur.time_contract, null);
  assert.match(bubur.cooking_sequence.map((step) => step.instruction).join(' '), /牛肉碎|三色|40|玉米|青豆|椰奶|煎蛋/u);
});

test('r140 does not silently turn HealthHub staged or separate steps into electric-rice-cooker contracts', () => {
  const nasi = byId.get('sg-healthhub-nasi-kuning');
  assert.match(nasi.cooker_adaptation.notes, /先炒|后拌|不外推/iu);
  const briyani = byId.get('sg-healthhub-chicken-briyani');
  assert.match(briyani.cooker_adaptation.notes, /半熟|分层|不外推/iu);
  const bubur = byId.get('sg-healthhub-bubur-lambuk');
  assert.match(bubur.cooker_adaptation.notes, /普通锅|煎蛋另锅|不外推/iu);
});

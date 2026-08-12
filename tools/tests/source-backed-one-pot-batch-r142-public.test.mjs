import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  {
    recipeId: 'au-cclhd-microwave-risotto',
    name: 'Microwave Risotto',
    url: 'https://www.cclhd.health.nsw.gov.au/wp-content/uploads/Back-to-Basics.pdf',
    vessel: /微波|microwave/iu,
    boundary: /单容器|微波|不.*电饭煲/iu,
    servings: 4,
  },
  {
    recipeId: 'ca-health-multigrain-congee',
    name: 'Multigrain congee with shiitake, ginger and scallion',
    url: 'https://www.canada.ca/en/health-canada/services/food-guide/eating-support/kitchen/recipes/multigrain-congee-shiitake-ginger-scallion.html',
    vessel: /大锅|普通锅|rice cooker|电饭煲/iu,
    boundary: /普通锅|泛称|不.*程序|不.*外推/iu,
    servings: 4,
  },
  {
    recipeId: 'au-slhd-oven-baked-biryani',
    name: 'Oven baked biryani',
    url: 'https://slhd.health.nsw.gov.au/yhunger/recipes-tips/soups-stews/oven-baked-biranyi',
    vessel: /烤箱|oven/iu,
    boundary: /预炒|炉灶|烤箱|不.*电饭煲/iu,
    servings: 4,
  },
];

test('r142 adds three public rice candidates without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
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
    assert.equal(recipe.fixed_batch?.servings, item.servings, item.recipeId);

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

test('r142 preserves exact quantities and appliance boundaries', () => {
  const risotto = byId.get('au-cclhd-microwave-risotto');
  assert.equal(risotto.fixed_batch.servings, 4);
  assert.equal(risotto.liquid_contract.amount.value, 2.5);
  assert.equal(risotto.liquid_contract.amount.unit, 'cup');
  assert.equal(risotto.time_contract, null);
  assert.match(risotto.cooking_sequence.map((step) => step.instruction).join(' '), /微波|10|搅拌|芝士/u);
  assert.equal(risotto.cooker_adaptation.status, 'source_limited');

  const congee = byId.get('ca-health-multigrain-congee');
  assert.equal(congee.fixed_batch.servings, 4);
  assert.equal(congee.liquid_contract.amount.value, 7);
  assert.equal(congee.liquid_contract.amount.unit, 'cup');
  assert.equal(congee.time_contract.total_minutes, 90);
  assert.match(congee.cooking_sequence.map((step) => step.instruction).join(' '), /香菇|杂粮|每15分钟|大锅/u);
  assert.equal(congee.cooker_adaptation.status, 'source_limited');

  const biryani = byId.get('au-slhd-oven-baked-biryani');
  assert.equal(biryani.fixed_batch.servings, 4);
  assert.equal(biryani.liquid_contract.amount.value, 2);
  assert.equal(biryani.liquid_contract.amount.unit, 'cup');
  assert.equal(biryani.time_contract.total_minutes, 50);
  assert.match(biryani.cooking_sequence.map((step) => step.instruction).join(' '), /炉灶|预炒|180|烤箱|40/u);
  assert.equal(biryani.cooker_adaptation.status, 'source_limited');
});

test('r142 does not turn non-rice-cooker sources into universal electric-cooker contracts', () => {
  const risotto = byId.get('au-cclhd-microwave-risotto');
  assert.match(risotto.cooker_adaptation.notes, /微波|不.*电饭煲/iu);
  const congee = byId.get('ca-health-multigrain-congee');
  assert.match(congee.cooker_adaptation.notes, /普通锅|泛称|不.*程序|不.*外推/iu);
  const biryani = byId.get('au-slhd-oven-baked-biryani');
  assert.match(biryani.cooker_adaptation.notes, /炉灶|烤箱|预炒|不.*电饭煲/iu);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  {
    recipeId: 'instant-pot-one-pot-chicken-brown-rice',
    name: 'One Pot Chicken and Brown Rice Dinner',
    url: 'https://instantpot.com/blogs/recipes/one-pot-chicken-and-brown-rice-dinner',
    vessel: /Instant Pot/u,
  },
  {
    recipeId: 'instant-pot-quick-chicken-steamed-rice',
    name: 'Quick Chicken Steamed Rice',
    url: 'https://instantpot.com/blogs/recipes/quick-chicken-steamed-rice',
    vessel: /Instant Pot/u,
  },
  {
    recipeId: 'instant-pot-easy-chicken-rice',
    name: 'Easy Chicken and Rice',
    url: 'https://instantpot.com/blogs/recipes/easy-chicken-and-rice',
    vessel: /Instant Pot/u,
  },
  {
    recipeId: 'instant-pot-chicken-rice-soup',
    name: 'Chicken Rice Soup',
    url: 'https://instantpot.com/blogs/recipes/chicken-rice-soup',
    vessel: /Instant Pot/u,
  },
  {
    recipeId: 'instant-pot-chicken-satay-rice',
    name: 'Chicken Satay Rice',
    url: 'https://instantpot.com/blogs/recipes/chicken-satay-rice',
    vessel: /Instant Pot/u,
  },
  {
    recipeId: 'instant-pot-chicken-enchilada-rice',
    name: 'Chicken Enchilada Rice',
    url: 'https://instantpot.com/blogs/recipes/chicken-enchilada-rice',
    vessel: /Instant Pot/u,
  },
  {
    recipeId: 'instant-pot-spanish-chicken-rice',
    name: 'Spanish Chicken and Rice',
    url: 'https://instantpot.com/blogs/recipes/spanish-chicken-and-rice',
    vessel: /Instant Pot/u,
  },
  {
    recipeId: 'philips-multigrain-baked-chicken-rice',
    name: 'ข้าวไก่อบธัญพืช',
    url: 'https://www.documents.philips.com/assets/20210504/2b225944d7cb481abeffad1e01377c70.pdf',
    vessel: /Philips HD4777\/HD4775/u,
  },
];
const executableIds = new Set(['instant-pot-chicken-satay-rice', 'instant-pot-chicken-enchilada-rice']);

test('r124 adds eight official manufacturer rice main candidates', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r221');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);

  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.ok(recipe, item.recipeId);
    assert.equal(recipe.canonical_name, item.name, item.recipeId);
    assert.equal(recipe.status, executableIds.has(item.recipeId) ? 'executable' : 'recipe_fact_checked', item.recipeId);
    assert.equal(recipe.identity_status, 'verified', item.recipeId);
    assert.equal(recipe.region_codes.length, 0, item.recipeId);
    assert.match(recipe.traditional_vessels.join(' '), item.vessel, item.recipeId);
    assert.ok(recipe.core_ingredients.length >= 3, item.recipeId);
    assert.ok(recipe.cooking_sequence.length >= 2, item.recipeId);
    if (!executableIds.has(item.recipeId)) assert.notEqual(recipe.status, 'executable', item.recipeId);
    assert.notEqual(recipe.status, 'preview_ready', item.recipeId);

    const source = recipe.source_refs.find((candidate) => candidate.url === item.url);
    assert.ok(source, `${item.recipeId}: official source URL`);
    assert.equal(source.access_status, 'opened', item.recipeId);
    assert.equal(source.evidence_tier, 3, item.recipeId);
    assert.ok(source.evidence_locator, item.recipeId);
    assert.ok(source.claim_scopes.includes('identity'), item.recipeId);
    assert.ok(source.claim_scopes.includes('ingredients'), item.recipeId);
    assert.ok(source.claim_scopes.includes('process'), item.recipeId);
    assert.ok(source.claim_scopes.includes('appliance'), item.recipeId);
  }
});

test('r124 keeps fixed quantities and model boundaries without widening safety evidence', () => {
  const onePot = byId.get('instant-pot-one-pot-chicken-brown-rice');
  // The source gives a 6–8 serving range; the current schema only accepts a
  // single positive serving count, so keep the structured batch null and
  // preserve the range in evidence_notes/source locator.
  assert.equal(onePot.fixed_batch, null);
  assert.equal(onePot.liquid_contract.amount.value, 2.5);
  assert.equal(onePot.liquid_contract.amount.unit, 'cups');
  assert.equal(onePot.time_contract, null);
  assert.deepEqual(onePot.safety_endpoints, [{
    code: 'poultry_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);
  assert.match(onePot.cooker_adaptation.notes, /Instant Pot|不外推普通电饭煲/u);

  const quick = byId.get('instant-pot-quick-chicken-steamed-rice');
  assert.equal(quick.fixed_batch.servings, 6);
  assert.equal(quick.liquid_contract.amount.value, 2);
  assert.equal(quick.time_contract, null);
  assert.equal(quick.safety_endpoints[0]?.code, 'poultry_fully_cooked');
  assert.match(quick.evidence_notes, /165°F|独立来源|安全/u);

  const soup = byId.get('instant-pot-chicken-rice-soup');
  assert.equal(soup.fixed_batch.servings, 4);
  assert.equal(soup.liquid_contract.amount.value, 4);
  assert.equal(soup.time_contract, null);
  assert.deepEqual(soup.safety_endpoints, [{
    code: 'poultry_fully_cooked',
    minimum_core_temperature_c: 74,
    source_ids: ['S-SAFETY-TEMPERATURES-1'],
  }]);

  const philips = byId.get('philips-multigrain-baked-chicken-rice');
  assert.equal(philips.fixed_batch, null);
  assert.equal(philips.liquid_contract.amount.value, 2.25);
  assert.equal(philips.liquid_contract.amount.unit, 'cups');
  assert.equal(philips.time_contract.total_minutes, 60);
  assert.deepEqual(philips.safety_endpoints, []);
  assert.match(philips.cooker_adaptation.notes, /HD4777|HD4775|不外推普通电饭煲/u);
});

test('r124 does not label manufacturer recipes as regional traditions or publish-ready plans', () => {
  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.deepEqual(recipe.region_codes, [], item.recipeId);
    assert.match(recipe.cuisine_family, /manufacturer-rice-cooker-recipes/u, item.recipeId);
    assert.match(recipe.evidence_notes, /厂商|官方|不宣称|不外推/u, item.recipeId);
    assert.equal(recipe.cooker_adaptation.status, 'source_limited', item.recipeId);
  }
});

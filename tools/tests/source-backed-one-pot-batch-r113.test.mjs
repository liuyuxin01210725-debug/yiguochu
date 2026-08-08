import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  [
    'tiger-usa-century-egg-fish-porridge',
    'Century Eggs and Fish Fillet Porridge',
    'https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/century-eggs-and-fish-fillet-porridge/',
  ],
  [
    'tiger-usa-tomato-cheese-risotto',
    'Tomato Cheese Risotto',
    'https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/tomato-cheese-risotto/',
  ],
  [
    'tiger-usa-keema-curry-chickpeas',
    'Keema Curry with Chickpeas',
    'https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/keema-curry-with-chickpeas/',
  ],
];

test('r113 adds three directly sourced Tiger one-pot candidates without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r185');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);
  for (const [recipeId, name, url] of expected) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.canonical_name, name, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.equal(recipe.identity_status, 'verified', recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients) && recipe.core_ingredients.length >= 3, recipeId);
    assert.ok(Array.isArray(recipe.cooking_sequence) && recipe.cooking_sequence.length >= 3, recipeId);
    assert.ok(recipe.source_refs.some((source) => source.url === url), recipeId);
    assert.ok(recipe.source_refs.every((source) => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every((source) => Number.isInteger(source.evidence_tier)), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r113 preserves each Tiger appliance and process boundary', () => {
  const porridge = byId.get('tiger-usa-century-egg-fish-porridge');
  assert.equal(porridge.fixed_batch.servings, 2);
  assert.equal(porridge.liquid_contract.waterline.mark, 0.5);
  assert.equal(porridge.time_contract.total_minutes, 70);
  assert.equal(porridge.cooker_adaptation.status, 'source_limited');
  assert.match(porridge.cooker_adaptation.notes, /Tiger|5\.5|Porridge|鱼/u);

  const risotto = byId.get('tiger-usa-tomato-cheese-risotto');
  assert.equal(risotto.fixed_batch, null);
  assert.equal(risotto.liquid_contract.waterline.mark, 2);
  assert.equal(risotto.cooker_adaptation.status, 'source_limited');
  assert.match(risotto.cooker_adaptation.notes, /Tiger|Plain|普通米|3至4份/u);

  const keema = byId.get('tiger-usa-keema-curry-chickpeas');
  assert.equal(keema.fixed_batch, null);
  assert.equal(keema.liquid_contract, null);
  assert.equal(keema.cooker_adaptation.status, 'source_limited');
  assert.match(keema.cooker_adaptation.notes, /Tacook|Synchro|机型|水量/u);
});

test('r113 records official claims without inventing absent quantity, time, or safety facts', () => {
  for (const [recipeId, , url] of expected) {
    const recipe = byId.get(recipeId);
    const source = recipe.source_refs.find((item) => item.url === url);
    assert.equal(source.publisher, 'Tiger Corporation USA', recipeId);
    assert.equal(source.license, 'publisher_copyright', recipeId);
    assert.ok(source.evidence_locator, recipeId);
    assert.ok(source.claim_scopes.includes('identity'), recipeId);
    assert.ok(source.claim_scopes.includes('ingredients'), recipeId);
    assert.ok(source.claim_scopes.includes('process'), recipeId);
    assert.ok(source.claim_scopes.includes('appliance'), recipeId);
    assert.match(recipe.evidence_notes, /未给|未提供|不外推|来源/u, recipeId);
  }
});

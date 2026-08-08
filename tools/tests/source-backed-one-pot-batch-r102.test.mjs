import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));
const tigerUrls = {
  'tiger-honey-garlic-chicken': 'https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/honey-garlic-chicken/',
  'tiger-teriyaki-chicken': 'https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/teriyaki-chicken/',
  'tiger-bubur-ayam-indonesian-chicken-porridge': 'https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/bubur-ayam-indonesian-chicken-porridge/',
  'tiger-chicken-meatballs-grated-daikon': 'https://www.tiger-corporation.com/en/usa/feature/recipe/rice-cooker/chicken-meatballs-with-grated-daikon/',
};

test('r102 adds four opened Tiger source records without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r133');
  assert.equal(catalog.recipes.length, 906);
  for (const [recipeId, url] of Object.entries(tigerUrls)) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked');
    assert.equal(recipe.identity_status, 'verified');
    assert.equal(recipe.fixed_batch, null);
    assert.equal(recipe.liquid_contract, null);
    assert.ok(recipe.cooking_sequence.length >= 2);
    assert.equal(recipe.source_refs.length, 1);
    const source = recipe.source_refs[0];
    assert.equal(source.url, url);
    assert.equal(source.access_status, 'opened');
    assert.equal(source.evidence_tier, 3);
    assert.ok(source.evidence_locator);
    assert.ok(source.claim_scopes.includes('identity'));
    assert.ok(source.claim_scopes.includes('ingredients'));
    assert.ok(source.claim_scopes.includes('quantity'));
    assert.ok(source.claim_scopes.includes('process'));
    assert.ok(source.claim_scopes.includes('appliance'));
    assert.ok(source.claim_scopes.includes('liquid'));
    assert.equal(recipe.cooker_adaptation.status, 'source_limited');
    assert.ok(recipe.cooker_adaptation.waterline);
    assert.match(recipe.cooker_adaptation.notes, /不外推|水位线/);
  }
});

test('r102 preserves Tiger-specific boundaries and no duplicate ids', () => {
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);
  assert.equal(byId.get('tiger-bubur-ayam-indonesian-chicken-porridge').time_contract?.total_minutes, 60);
  assert.match(byId.get('tiger-bubur-ayam-indonesian-chicken-porridge').evidence_notes, /另锅|范围/);
  assert.match(byId.get('tiger-chicken-meatballs-grated-daikon').evidence_notes, /Tacook|不晋升/);
  assert.equal(catalog.recipes.filter((recipe) => tigerUrls[recipe.recipe_id]).filter((recipe) => recipe.status === 'executable').length, 0);
});

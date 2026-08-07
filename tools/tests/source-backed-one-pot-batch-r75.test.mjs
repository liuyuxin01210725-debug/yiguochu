import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

const expected = [
  ['tatung-sesame-shiitake-shio-koji-chicken-rice', '麻油香菇鹽麴雞飯'],
  ['tatung-chestnut-sesame-oil-chicken-rice', '栗子麻油雞飯'],
];

test('r75 records two new direct manufacturer rice-meal candidates without promotion', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r125');
  assert.equal(catalog.recipes.length, 884);
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  for (const [recipeId, canonicalName] of expected) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, 'recipe_fact_checked', recipeId);
    assert.equal(recipe?.identity_status, 'verified', recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.evidence_locator === 'string' && source.evidence_locator.length > 0), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.attribution === 'string' && source.attribution.length > 0), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.license === 'string' && source.license.length > 0), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients) && recipe.core_ingredients.length >= 2, recipeId);
    assert.ok(Array.isArray(recipe.cooking_sequence) && recipe.cooking_sequence.length > 0, recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r75 keeps model-specific cooker and ingredient-state boundaries explicit', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.match(byId.get('tatung-sesame-shiitake-shio-koji-chicken-rice')?.evidence_notes ?? '', /大同|盐麴|外锅|普通电饭煲/);
  assert.match(byId.get('tatung-chestnut-sesame-oil-chicken-rice')?.evidence_notes ?? '', /栗子|珐琅|外锅|普通电饭煲/);
  assert.equal(byId.get('panasonic-frozen-seafood-paella-rice')?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId.get('tatung-sesame-shiitake-shio-koji-chicken-rice')?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(byId.get('tatung-chestnut-sesame-oil-chicken-rice')?.cooker_adaptation?.status, 'not_adapted');
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

const expected = [
  ['panasonic-spring-chicken-vegetable-risotto', 'Spring Chicken and Vegetable Risotto'],
  ['panasonic-chicken-biryani-sr-da182', 'Chicken Biryani'],
  ['tefal-602-chicken-pea-risotto', 'Chicken & Pea Risotto'],
  ['tefal-602-smoked-haddock-kedgeree', 'Smoked Haddock Kedgeree'],
  ['tefal-602-seafood-paella', 'Seafood Paella'],
];

test('r76 records five direct manufacturer rice-meal candidates without promotion', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r154');
  assert.equal(catalog.recipes.length, 923);
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

test('r76 preserves manufacturer, PDF, staged-process, and cooked-protein boundaries', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.match(byId.get('panasonic-spring-chicken-vegetable-risotto')?.evidence_notes ?? '', /Panasonic|高汤|预处理|普通电饭煲/);
  assert.match(byId.get('panasonic-chicken-biryani-sr-da182')?.evidence_notes ?? '', /SR-DA182|腌制|分阶段|普通电饭煲/);
  assert.match(byId.get('tefal-602-chicken-pea-risotto')?.evidence_notes ?? '', /TEFAL602|熟鸡肉|PDF|平底锅/);
  assert.match(byId.get('tefal-602-smoked-haddock-kedgeree')?.evidence_notes ?? '', /烟熏黑线鳕|TEFAL602|煮熟鸡蛋/);
  assert.match(byId.get('tefal-602-seafood-paella')?.evidence_notes ?? '', /TEFAL602|海鲜|PDF|安全/);
  assert.equal(byId.get('panasonic-spring-chicken-vegetable-risotto')?.cooker_adaptation?.status, 'source_limited');
  assert.equal(byId.get('panasonic-chicken-biryani-sr-da182')?.cooker_adaptation?.status, 'source_limited');
  for (const recipeId of expected.slice(2).map(([id]) => id)) {
    assert.equal(byId.get(recipeId)?.cooker_adaptation?.status, 'source_limited', recipeId);
  }
  assert.equal(byId.get('tefal-602-chicken-pea-risotto')?.fixed_batch, null);
  assert.equal(byId.get('tefal-602-smoked-haddock-kedgeree')?.fixed_batch, null);
  assert.equal(byId.get('tefal-602-seafood-paella')?.fixed_batch, null);
});

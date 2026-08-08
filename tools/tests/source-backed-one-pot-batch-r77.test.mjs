import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

const expected = [
  ['tiger-corn-rice', 'Corn Rice', 'recipe_fact_checked'],
  ['tiger-bang-bang-chicken-rice', 'Bang Bang Chicken', 'recipe_fact_checked'],
  ['huoqiu-haozi-guoba-rice', '霍邱蒿子锅巴', 'identity_verified'],
];

test('r77 records two direct Tiger rice-meal candidates and one regional identity candidate', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r152');
  assert.equal(catalog.recipes.length, 923);
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.equal(recipe?.identity_status, 'verified', recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.evidence_locator === 'string' && source.evidence_locator.length > 0), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.attribution === 'string' && source.attribution.length > 0), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.license === 'string' && source.license.length > 0), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r77 preserves the difference between direct inner-pot rice, Tacook two-level cooking, and regional identity only', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  const corn = byId.get('tiger-corn-rice');
  assert.deepEqual(corn.core_ingredients, ['短粒日本米', '玉米']);
  assert.equal(corn.cooker_adaptation.status, 'source_limited');
  assert.match(corn.evidence_notes, /Corn Rice|Plain|蛋白质|膳食纤维/);
  assert.equal(corn.fixed_batch, null);

  const bangBang = byId.get('tiger-bang-bang-chicken-rice');
  assert.equal(bangBang.cooker_adaptation.status, 'source_limited');
  assert.match(bangBang.evidence_notes, /Tacook|同步|米饭|鸡肉/);
  assert.match(bangBang.cooking_sequence.map(step => step.instruction).join(' '), /鸡肉|米/);
  assert.equal(bangBang.fixed_batch, null);

  const regional = byId.get('huoqiu-haozi-guoba-rice');
  assert.deepEqual(regional.core_ingredients, ['米', '蒿子']);
  assert.deepEqual(regional.cooking_sequence, []);
  assert.equal(regional.fixed_batch, null);
  assert.equal(regional.liquid_contract, null);
  assert.equal(regional.cooker_adaptation.status, 'not_adapted');
  assert.match(regional.evidence_notes, /霍邱|非遗|没有.*米量|锅具/);
});

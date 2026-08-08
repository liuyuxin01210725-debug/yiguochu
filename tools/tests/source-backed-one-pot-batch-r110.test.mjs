import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  [
    'zojirushi-black-rice-ih-pot',
    '黒米（ご飯）',
    'https://www.zojirushi.co.jp/recipe/ihnabe/syousai/012.html',
  ],
  [
    'zojirushi-plain-brown-rice-ih-pot',
    '玄米（ご飯）',
    'https://www.zojirushi.co.jp/recipe/ihnabe/syousai/002.html',
  ],
];

test('r110 adds two directly sourced ZOJIRUSHI rice candidates without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r202');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);
  for (const [recipeId, name, url] of expected) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.canonical_name, name, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.equal(recipe.identity_status, 'verified', recipeId);
    assert.ok(recipe.core_ingredients.some((ingredient) => ['米', '白米', '黑米', '玄米'].includes(ingredient)), recipeId);
    assert.ok(recipe.cooking_sequence.length >= 3, recipeId);
    assert.ok(recipe.source_refs.some((source) => source.url === url), recipeId);
    assert.ok(recipe.source_refs.every((source) => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every((source) => Number.isInteger(source.evidence_tier)), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r110 preserves IH-pot boundaries and exact liquid contracts', () => {
  const black = byId.get('zojirushi-black-rice-ih-pot');
  assert.equal(black.fixed_batch.servings, 4);
  assert.equal(black.liquid_contract.amount.value, 720);
  assert.equal(black.liquid_contract.amount.unit, 'mL');
  assert.equal(black.cooker_adaptation.status, 'not_adapted');
  assert.match(black.cooker_adaptation.notes, /IH锅|电饭煲|不外推/u);
  assert.match(black.evidence_notes, /黑米|蛋白|蔬菜/u);

  const brown = byId.get('zojirushi-plain-brown-rice-ih-pot');
  assert.equal(brown.fixed_batch.servings, 4);
  assert.equal(brown.liquid_contract.amount.value, 900);
  assert.equal(brown.liquid_contract.amount.unit, 'mL');
  assert.equal(brown.cooker_adaptation.status, 'not_adapted');
  assert.match(brown.cooker_adaptation.notes, /IH锅|电饭煲|不外推/u);
  assert.match(brown.evidence_notes, /玄米|蛋白|蔬菜/u);
});

test('r110 keeps every official claim directly attributable', () => {
  for (const [recipeId, , url] of expected) {
    const recipe = byId.get(recipeId);
    const source = recipe.source_refs.find((item) => item.url === url);
    assert.equal(source.publisher, '象印', recipeId);
    assert.equal(source.license, 'publisher_copyright', recipeId);
    assert.ok(source.evidence_locator, recipeId);
    assert.deepEqual(source.claim_scopes.includes('identity'), true, recipeId);
    assert.deepEqual(source.claim_scopes.includes('ingredients'), true, recipeId);
    assert.deepEqual(source.claim_scopes.includes('liquid'), true, recipeId);
    assert.deepEqual(source.claim_scopes.includes('process'), true, recipeId);
    assert.deepEqual(source.claim_scopes.includes('appliance'), true, recipeId);
  }
});

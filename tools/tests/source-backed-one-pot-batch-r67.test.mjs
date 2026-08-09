import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const catalogPath = join(here, '..', 'data', 'source-backed-one-pot-recipes.v1.json');

const expected = [
  ['maff-tochigi-gomokumeshi', 'recipe_fact_checked'],
  ['maff-okayama-tofumeshi', 'recipe_fact_checked'],
  ['maff-gifu-sengoku-bean-kakimawashi', 'recipe_fact_checked'],
  ['maff-hiroshima-uzume', 'recipe_fact_checked'],
  ['maff-hiroshima-moburi', 'recipe_fact_checked'],
  ['afa-douchi-pork-steamed-rice', 'discovered'],
  ['afa-japanese-chestnut-rice', 'discovered'],
  ['afa-sesame-oil-chicken-rice', 'discovered'],
  ['afa-garlic-fresh-fish-rice', 'discovered'],
  ['afa-tomato-pork-rice', 'discovered'],
  ['afa-beef-rice', 'discovered'],
  ['zojirushi-chicken-dry-curry', 'recipe_fact_checked'],
  ['zojirushi-kurigohan-japanese-chestnut-rice', 'recipe_fact_checked'],
  ['panasonic-brown-rice-soybean-rice-nf-pc400', 'recipe_fact_checked'],
  ['panasonic-corn-rice-shimamoto', 'recipe_fact_checked'],
  ['tiger-chinese-sticky-rice-post-fry', 'recipe_fact_checked'],
  ['yanbian-stone-pot-bibimbap', 'identity_verified'],
  ['yining-caipulao-pilaf', 'identity_verified'],
  ['yining-asimantu-pilaf', 'identity_verified'],
  ['jinjiang-squid-rice', 'recipe_fact_checked'],
  ['taiwan-pumpkin-dried-fish-red-shallot-rice', 'identity_verified'],
  ['taiwan-sausage-chestnut-rice', 'identity_verified'],
  ['taiwan-sesame-oil-matsusaka-pork-rice', 'identity_verified'],
];

test('r67 batch records official one-pot and rice-meal research without promotion', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r242');
  assert.equal(catalog.recipes.length, 923);
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  for (const [recipeId, status] of expected) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, status, recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
    assert.ok(recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every(source => Array.isArray(source.claim_scopes)), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients), recipeId);
  }
});

test('r67 keeps low-confidence and unparsed source leads out of the catalog batch', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const ids = new Set(catalog.recipes.map(recipe => recipe.recipe_id));
  for (const id of [
    'taiwan-golden-wild-mushroom-red-quinoa-chicken-rice',
    'taiwan-braised-seabream-cabbage-rice',
    'taiwan-small-anchovy-aromatic-rice',
  ]) assert.equal(ids.has(id), false, id);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const catalogPath = join(here, '..', 'data', 'source-backed-one-pot-recipes.v1.json');

const expected = [
  ['maff-ehime-taimeshi', 'recipe_fact_checked'],
  ['maff-fukushima-hokki-meshi', 'recipe_fact_checked'],
  ['maff-shizuoka-bokumeshi', 'recipe_fact_checked'],
  ['maff-okayama-funa-meshi', 'recipe_fact_checked'],
  ['maff-oita-ouhan-kayaku', 'recipe_fact_checked'],
  ['maff-saitama-katemeshi', 'recipe_fact_checked'],
  ['maff-gifu-ayu-zosui', 'recipe_fact_checked'],
  ['maff-gunma-torimeshi', 'identity_verified'],
  ['maff-toyama-kuro-mame-okowa', 'recipe_fact_checked'],
  ['zojirushi-takikomi-gohan-mixed-rice', 'recipe_fact_checked'],
  ['zojirushi-brown-rice-salmon-shiitake', 'recipe_fact_checked'],
  ['zojirushi-shiitake-gohan', 'recipe_fact_checked'],
  ['zojirushi-new-orleans-red-beans-rice', 'recipe_fact_checked'],
  ['toshiba-steamed-sekihan-edion-rice-cooker', 'recipe_fact_checked'],
  ['tianjin-ninghe-braised-meat-rice', 'identity_verified'],
  ['yecheng-jiucun-pilaf', 'identity_verified'],
];

test('r66 batch is present as source-backed research records without promotion', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r250');
  assert.equal(catalog.recipes.length, 923);
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  for (const [recipeId, status] of expected) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, status, recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
    assert.ok(recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every(source => Array.isArray(source.claim_scopes)), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients), recipeId);
  }
});

test('r66 does not re-add duplicate identities or assembled-only rice bowls', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const ids = new Set(catalog.recipes.map(recipe => recipe.recipe_id));
  for (const id of [
    'maff-niigata-shoyu-okowa',
    'maff-oita-torimeshi',
    'zojirushi-halal-style-chicken-rice',
    'zojirushi-portabella-beef-broccoli-rice',
    'zojirushi-jasmine-tofu-broccoli-edamame-rice',
  ]) {
    assert.equal(ids.has(id), id === 'maff-niigata-shoyu-okowa' || id === 'maff-oita-torimeshi' ? true : false, id);
  }
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

test('r94 records the Tefal Spanish Style Chicken Legs steam-pot meal without converting it to rice-cooker semantics', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r228');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(catalog.recipes.filter(item => item.status === 'recipe_fact_checked').length, 771);

  const recipe = catalog.recipes.find(item => item.recipe_id === 'tefal-spanish-style-chicken-legs-r106521');
  assert.equal(recipe?.canonical_name, 'Spanish Style Chicken Legs');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.region_codes, []);
  assert.equal(recipe?.fixed_batch?.servings, 2);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '鸡腿')?.amount?.value, 3);
  assert.equal(recipe?.liquid_contract?.amount?.value, 300);
  assert.equal(recipe?.time_contract?.total_minutes, 50);
  assert.deepEqual(recipe?.nutrition_structure?.roles, ['carbohydrate', 'protein', 'fiber']);
  assert.equal(recipe?.traditional_vessels?.[0], 'Tefal MINICOMPACT / STEAM N\' LIGHT / VITACUISINE COMPACT 蒸锅');
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.match(recipe?.evidence_notes ?? '', /双层|蒸锅|不外推|Spanish Style/u);
});

test('r94 keeps the Tefal meal non-executable and preserves the upper-basket boundary', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const recipe = catalog.recipes.find(item => item.recipe_id === 'tefal-spanish-style-chicken-legs-r106521');
  assert.notEqual(recipe?.status, 'executable');
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.match(recipe?.cooking_sequence?.[1]?.instruction ?? '', /上层蒸篮/u);
  assert.match(recipe?.evidence_notes ?? '', /不宣称|安全/u);
});

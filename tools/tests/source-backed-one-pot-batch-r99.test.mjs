import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('r99 adds eight source-backed Chinese/Taiwan rice entries without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r213');
  assert.equal(catalog.recipes.length, 923);
  const expected = new Map([
    ['r99-taiwan-golden-wild-mushroom-quinoa-chicken-rice', ['黃金野菇紅藜雞肉炊飯', 'recipe_fact_checked']],
    ['r99-guangzhou-winter-solstice-cured-glutinous-rice', ['广州冬至腊味糯米饭', 'identity_verified']],
    ['r99-daojiao-glutinous-rice', ['道滘糯米饭', 'identity_verified']],
    ['r99-daojiao-dragon-boat-rice', ['道滘龙船饭', 'recipe_fact_checked']],
    ['r99-shipai-tianliao-dragon-boat-rice', ['石排田寮龙船饭', 'recipe_fact_checked']],
    ['r99-an-hai-eight-treasure-rice', ['安海八宝饭', 'recipe_fact_checked']],
    ['r99-chikan-oil-salt-rice', ['赤坎油盐饭', 'identity_verified']],
    ['r99-yao-shixing-glutinous-vegetable-rice', ['瑶乡糯米菜饭', 'recipe_fact_checked']],
  ]);
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  for (const [recipeId, [name, status]] of expected) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe?.canonical_name, name, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.equal(recipe?.identity_status, 'verified', recipeId);
    assert.ok(recipe?.source_refs?.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r99 keeps multi-stage and appliance boundaries explicit', () => {
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.equal(byId.get('r99-taiwan-golden-wild-mushroom-quinoa-chicken-rice')?.liquid_contract?.amount?.value, 2);
  assert.match(byId.get('r99-daojiao-dragon-boat-rice')?.cooker_adaptation?.notes ?? '', /不.*单内锅/);
  assert.match(byId.get('r99-shipai-tianliao-dragon-boat-rice')?.evidence_notes ?? '', /分制/);
  assert.match(byId.get('r99-yao-shixing-glutinous-vegetable-rice')?.evidence_notes ?? '', /先蒸后炒/);
  assert.equal(byId.get('r99-chikan-oil-salt-rice')?.cooking_sequence?.length, 0);
});

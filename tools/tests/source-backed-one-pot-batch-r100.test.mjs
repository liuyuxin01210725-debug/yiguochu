import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

const expected = new Map([
  ['r100-taiwan-red-quinoa-lotus-leaf-rice', '紅藜臘味荷葉飯'],
  ['r100-taiwan-quinoa-oil-rice', '臺灣藜油飯'],
  ['r100-taiwan-momordica-vegetable-risotto', '木鱉果時蔬燉飯'],
  ['r100-taiwan-grain-health-congee', '桂圓穀物養生粥'],
  ['r100-macau-tomato-chicken-rice', '茄汁雞絲飯'],
  ['r100-macau-high-fiber-brown-fried-rice', '高纖糙米炒飯'],
  ['r100-hk-corn-pumpkin-chicken-ball-rice', '粟米南瓜雞球飯'],
  ['r100-hk-scallop-egg-braised-rice', '菜片瑤柱鴛鴦蛋燴飯'],
  ['r100-hk-garlic-wild-mushroom-stonepot-rice', '蒜蓉野菌雜菜石頭窩飯'],
  ['r100-hk-pumpkin-multigrain-rice', '南瓜五穀飯'],
  ['r100-hk-pumpkin-seafood-brown-rice', '焗南瓜海鮮糙米飯'],
]);

test('r100 persists eleven opened official-source assets without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r147');
  assert.equal(catalog.recipes.length, 923);
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  for (const [recipeId, name] of expected) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe?.canonical_name, name, recipeId);
    assert.equal(recipe?.status, 'discovered', recipeId);
    assert.equal(recipe?.identity_status, 'verified', recipeId);
    assert.ok(recipe?.source_refs?.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every(source => source.claim_scopes?.length > 0), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
  }
});

test('r100 keeps non-electric and cooked-rice boundaries visible', () => {
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.match(byId.get('r100-macau-high-fiber-brown-fried-rice')?.cooker_adaptation?.notes ?? '', /熟饭二次烹/);
  assert.match(byId.get('r100-hk-scallop-egg-braised-rice')?.cooker_adaptation?.notes ?? '', /不是电饭煲/);
  assert.match(byId.get('r100-taiwan-quinoa-oil-rice')?.cooker_adaptation?.notes ?? '', /多锅|拌合/);
  assert.equal(byId.get('r100-hk-pumpkin-seafood-brown-rice')?.liquid_contract, null);
});

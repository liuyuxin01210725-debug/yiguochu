import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = {
  'panasonic-taiwan-cabbage-mackerel-rice': 30,
  'tiger-usa-asparagus-mushroom-risotto': 75,
  'tiger-usa-multi-cooker-butternut-squash-risotto': 90,
  'maff-salmon-corn-japanese-paella': 23,
  'maff-eryngii-seafood-pan-paella': 20,
  'tefal-602-seafood-paella': 33,
  'zojirushi-black-rice-ih-pot': 40,
  'zojirushi-plain-brown-rice-ih-pot': 55,
};

const expectedSourceSequences = {
  'panasonic-taiwan-cabbage-mackerel-rice': [
    /米加入页面所示热水和调味液/u,
    /依序铺入菇类、木耳、玉米笋、高丽菜、胡萝卜和鲭鱼/u,
    /按 NU-SC300B 原味蒸程序/u,
    /最后 5 分钟加入毛豆，出锅去刺拌饭/u,
  ],
  'maff-salmon-corn-japanese-paella': [
    /在平底锅内煎鲑鱼/u,
    /炒玉米、菇和米/u,
    /加入500ml水和其他蔬菜/u,
    /加盖小中火焖约13分钟，再焖约10分钟/u,
  ],
  'maff-eryngii-seafood-pan-paella': [
    /炒海鲜混合物和杏鲍菇取汁/u,
    /再炒米/u,
    /加入液体煮约5分钟/u,
    /放回海鲜和蔬菜，加盖小火焖约15分钟/u,
  ],
};

test('r295 adds only explicit same-source total cooking times', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  for (const [recipeId, minutes] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    assert.equal(recipe.time_contract?.total_minutes, minutes, recipeId);
    assert.ok(recipe.time_contract?.source_ids?.length, `${recipeId} source_ids`);
  }
});

test('r295 keeps the eight time closures non-executable and source-bounded', () => {
  for (const recipeId of Object.keys(expected)) {
    const recipe = byId[recipeId];
    assert.notEqual(recipe.status, 'executable', recipeId);
    assert.ok(recipe.cooker_adaptation?.status, recipeId);
  }
});

test('r295 keeps compact complete-source sequences source-only when expanded', () => {
  for (const [recipeId, patterns] of Object.entries(expectedSourceSequences)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, recipeId);
    assert.equal(recipe.cooking_sequence.length, patterns.length, `${recipeId} source step count`);
    const instructions = recipe.cooking_sequence.map((step) => step.instruction).join(' ');
    for (const pattern of patterns) assert.match(instructions, pattern, `${recipeId} keeps source fact`);
    assert.ok(recipe.cooking_sequence.every((step) => step.source_ids?.length), `${recipeId} source binding`);
  }
});

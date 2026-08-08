import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

const expected = [
  ['philips-japanese-wagyu-beef-rice-bowl', '日式牛肉丼飯', 'recipe_fact_checked'],
  ['philips-sweet-potato-tomato-mixed-grain-vegetable-rice', '甜薯番茄多穀菜飯', 'recipe_fact_checked'],
  ['philips-corn-quinoa-vegetable-rice', '粟米藜麥菜飯', 'recipe_fact_checked'],
  ['philips-corn-purple-sweet-potato-meatball-congee', '粟米紫薯肉丸粥', 'recipe_fact_checked'],
  ['philips-pumpkin-minced-pork-congee', '南瓜肉碎粥', 'recipe_fact_checked'],
  ['philips-crab-congee-all-in-one-cooker', '膏蟹粥', 'recipe_fact_checked'],
  ['quanzhou-shishi-green-island-daikon-rice', '绿岛白萝卜饭', 'recipe_fact_checked'],
  ['shunchang-she-bamboo-tube-rice', '顺昌畲家竹筒饭', 'identity_verified'],
  ['pingjiang-red-army-guerrilla-bamboo-rice', '湘鄂赣革命根据地红军游击队竹筒饭', 'identity_verified'],
];

test('r82 registers nine directly sourced named one-pot candidates without promotion', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r168');
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
    assert.notEqual(recipe.status, 'executable', recipeId);
  }

  const counts = Object.groupBy(catalog.recipes, recipe => recipe.status);
  assert.equal(counts.recipe_fact_checked.length, 794);
  assert.equal(counts.identity_verified.length, 100);
  assert.equal(counts.executable.length, 12);
  assert.equal(counts.discovered.length, 17);
});

test('r82 preserves named-source boundaries instead of inventing missing facts', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

  const wagyu = byId.get('philips-japanese-wagyu-beef-rice-bowl');
  assert.equal(wagyu.liquid_contract.kind, 'waterline');
  assert.equal(wagyu.time_contract, null);
  assert.equal(wagyu.safety_endpoints.length, 1);
  assert.match(wagyu.cooking_sequence.map(step => step.instruction).join(' '), /倒数5分钟|和牛/u);

  const sweetPotato = byId.get('philips-sweet-potato-tomato-mixed-grain-vegetable-rice');
  assert.equal(sweetPotato.fixed_batch, null);
  assert.equal(sweetPotato.safety_endpoints.length, 0);
  assert.match(sweetPotato.evidence_notes, /蛋白|纤维|不/u);

  const quinoa = byId.get('philips-corn-quinoa-vegetable-rice');
  assert.equal(quinoa.traditional_vessels[0], 'Philips All-in-One 智能万用锅');
  assert.equal(quinoa.safety_endpoints.length, 0);
  assert.match(quinoa.evidence_notes, /后下|伴食|锅内/u);

  const meatball = byId.get('philips-corn-purple-sweet-potato-meatball-congee');
  assert.equal(meatball.liquid_contract.kind, 'waterline');
  assert.equal(meatball.time_contract.total_minutes, 120);
  assert.equal(meatball.safety_endpoints.length, 0);

  const pork = byId.get('philips-pumpkin-minced-pork-congee');
  assert.equal(pork.liquid_contract.kind, 'waterline');
  assert.equal(pork.time_contract.total_minutes, 240);
  assert.equal(pork.safety_endpoints.length, 1);

  const crab = byId.get('philips-crab-congee-all-in-one-cooker');
  assert.equal(crab.fixed_batch, null);
  assert.match(crab.evidence_notes, /4至6人/u);
  assert.equal(crab.traditional_vessels[0], 'Philips All-in-One 智能万用锅');
  assert.equal(crab.safety_endpoints.length, 0);
  assert.match(crab.cooking_sequence.map(step => step.instruction).join(' '), /剩5分钟|蟹/u);

  const daikon = byId.get('quanzhou-shishi-green-island-daikon-rice');
  assert.equal(daikon.fixed_batch, null);
  assert.equal(daikon.liquid_contract, null);
  assert.equal(daikon.time_contract, null);
  assert.match(daikon.evidence_notes, /同煮|不补写/u);

  for (const recipeId of ['shunchang-she-bamboo-tube-rice', 'pingjiang-red-army-guerrilla-bamboo-rice']) {
    const recipe = byId.get(recipeId);
    assert.deepEqual(recipe.cooking_sequence, []);
    assert.equal(recipe.fixed_batch, null);
    assert.equal(recipe.liquid_contract, null);
    assert.equal(recipe.time_contract, null);
    assert.match(recipe.evidence_notes, /身份|缺口|不/u);
  }
});

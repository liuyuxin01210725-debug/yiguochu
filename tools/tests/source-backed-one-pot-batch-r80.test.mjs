import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

const expected = [
  ['iris-cooking-kettle-pilaf', 'ピラフ（IRIS Cooking Kettle）', 'recipe_fact_checked'],
  ['philips-sweet-corn-pumpkin-pork-rice', '粟米南瓜肉碎飯', 'recipe_fact_checked'],
  ['philips-grouper-dried-shrimp-conpoy-claypot-rice', '蝦乾瑤柱班腩煲仔飯', 'recipe_fact_checked'],
  ['philips-hainan-chicken-rice', '海南雞飯（Philips）', 'recipe_fact_checked'],
  ['philips-italian-seafood-rice', '意大利海鮮飯（Philips）', 'recipe_fact_checked'],
  ['zengcheng-zhucun-chicken-rice', '朱村雞飯', 'recipe_fact_checked'],
];

test('r80 registers six newly sourced named one-pot rice candidates', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r190');
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
});

test('r80 preserves exact appliance and nutrition boundaries instead of inventing universal recipes', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

  const iris = byId.get('iris-cooking-kettle-pilaf');
  assert.equal(iris.liquid_contract.amount.value, 250);
  assert.equal(iris.liquid_contract.amount.unit, 'g');
  assert.match(iris.cooker_adaptation.notes, /Cooking Kettle|菜单5|不外推/u);
  assert.deepEqual(iris.nutrition_structure.roles, ['carbohydrate', 'protein', 'fiber']);

  const pumpkin = byId.get('philips-sweet-corn-pumpkin-pork-rice');
  assert.equal(pumpkin.liquid_contract.amount.value, 220);
  assert.equal(pumpkin.liquid_contract.amount.unit, 'g');
  assert.match(pumpkin.evidence_notes, /电饭煲|南瓜|猪肉/u);

  const hainan = byId.get('philips-hainan-chicken-rice');
  assert.equal(hainan.liquid_contract.kind, 'waterline');
  assert.match(hainan.liquid_contract.waterline.mark, /2杯/u);
  assert.match(hainan.cooker_adaptation.notes, /指定|不外推/u);
  assert.deepEqual(hainan.nutrition_structure.roles, ['carbohydrate', 'protein']);

  const zhu = byId.get('zengcheng-zhucun-chicken-rice');
  assert.equal(zhu.fixed_batch, null);
  assert.equal(zhu.liquid_contract, null);
  assert.match(zhu.evidence_notes, /走地鸡|丝苗米|电饭锅|未给/u);
  assert.deepEqual(zhu.nutrition_structure.roles, ['carbohydrate', 'protein']);
});

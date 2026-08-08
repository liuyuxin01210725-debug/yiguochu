import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  ['r103-cn-huarong-guobayu-fan', '华容锅巴鱼饭', 'recipe_fact_checked'],
  ['r103-cn-hunan-liling-weishan-nuomi-fan', '沩山糯米饭', 'recipe_fact_checked'],
  ['r103-cn-fujian-fuzhou-hongxun-nuomi-fan', '福州红鲟糯米饭', 'recipe_fact_checked'],
  ['r103-cn-guangxi-fangcheng-wuse-nuomi-fan', '防城港五色糯米饭', 'recipe_fact_checked'],
  ['r103-cn-guangxi-shangsi-xiangnu-wuse-fan', '上思香糯五色饭', 'identity_verified'],
  ['r103-cn-guangxi-sanjiang-dong-nuomi-fan', '三江侗族糯米饭', 'identity_verified'],
  ['r103-cn-zhejiang-longwan-sanjie-nuomi-fan', '龙湾三姐妹糯米饭', 'identity_verified'],
  ['r103-cn-shanxi-yangqu-nidun-xiaomi-fan', '泥屯小米饭', 'identity_verified'],
  ['r103-cn-hubei-enshi-longfeng-she-fan', '恩施龙凤社饭', 'recipe_fact_checked'],
  ['r103-cn-hunan-huaihua-gaoyi-heifan', '高椅黑饭', 'recipe_fact_checked'],
];

test('r103 CN batch adds ten source-backed regional rice records without promotion', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r185');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);
  for (const [recipeId, name, status] of expected) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.canonical_name, name, recipeId);
    assert.equal(recipe.status, status, recipeId);
    assert.equal(recipe.identity_status, 'verified', recipeId);
    assert.ok(recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every((source) => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every((source) => Number.isInteger(source.evidence_tier)), recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
    assert.equal(recipe.fixed_batch, null, recipeId);
  }
});

test('r103 CN keeps process and evidence boundaries explicit', () => {
  const processIds = expected.filter(([, , status]) => status === 'recipe_fact_checked').map(([recipeId]) => recipeId);
  const identityIds = expected.filter(([, , status]) => status === 'identity_verified').map(([recipeId]) => recipeId);
  for (const recipeId of processIds) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe.cooking_sequence.length > 0, recipeId);
    assert.equal(recipe.fixed_batch, null, recipeId);
    assert.equal(recipe.liquid_contract, null, recipeId);
    assert.equal(recipe.time_contract, null, recipeId);
    assert.equal(recipe.cooker_adaptation.status, 'not_adapted', recipeId);
  }
  for (const recipeId of identityIds) {
    const recipe = byId.get(recipeId);
    assert.deepEqual(recipe.cooking_sequence, [], recipeId);
    assert.equal(recipe.fixed_batch, null, recipeId);
    assert.equal(recipe.cooker_adaptation.status, 'not_adapted', recipeId);
  }
  assert.match(byId.get('r103-cn-huarong-guobayu-fan').evidence_notes, /鱼汤|锅巴|不.*电饭煲/);
  assert.match(byId.get('r103-cn-hunan-liling-weishan-nuomi-fan').evidence_notes, /浸泡|猪油|不.*电饭煲/);
  assert.match(byId.get('r103-cn-fujian-fuzhou-hongxun-nuomi-fan').evidence_notes, /红鲟|腊味|冬菇/);
  assert.match(byId.get('r103-cn-guangxi-fangcheng-wuse-nuomi-fan').evidence_notes, /染|木甑|安全/);
  assert.match(byId.get('r103-cn-hubei-enshi-longfeng-she-fan').evidence_notes, /社饭|变体|不.*拼/);
  assert.match(byId.get('r103-cn-hunan-huaihua-gaoyi-heifan').evidence_notes, /乌饭|铁锅|配餐/);
});

test('r103 does not duplicate already catalogued regional names', () => {
  const names = new Set(catalog.recipes.map((recipe) => recipe.canonical_name));
  for (const [, name] of expected) {
    assert.equal([...catalog.recipes].filter((recipe) => recipe.canonical_name === name).length, 1, name);
    assert.ok(names.has(name), name);
  }
  for (const duplicateName of ['怀柔敛巧饭', '靖西七色糯米饭', '石扇鱼焖饭', '台山菜果饭']) {
    assert.equal(catalog.recipes.filter((recipe) => recipe.canonical_name === duplicateName).length, 1, duplicateName);
  }
});

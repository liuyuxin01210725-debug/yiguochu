import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

test('r101 adds the opened Tatung clam-rice source without promoting it', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r202');
  assert.equal(catalog.recipes.length, 923);

  const recipe = byId.get('tatung-fresh-vegetable-clam-rice');
  assert.equal(recipe?.canonical_name, '鲜蔬蚬精炊饭');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.identity_status, 'verified');
  assert.equal(recipe?.fixed_batch, null, '2–3人份范围不能伪装成固定批量');
  assert.equal(recipe?.liquid_contract, null, '来源的1:1:1对象不清，不能建立机器液体合同');
  assert.equal(recipe?.time_contract?.total_minutes, 30);
  assert.match(recipe?.cooker_adaptation?.notes ?? '', /外锅水|不外推/);
  assert.match(recipe?.evidence_notes ?? '', /1:1:1|比例对象不清|贝类/);

  const source = recipe?.source_refs?.[0];
  assert.equal(source?.url, 'https://www.tatung.com.cn/ElectronicRecipes/info_itemid_214.html');
  assert.equal(source?.access_status, 'opened');
  assert.equal(source?.evidence_tier, 3);
  assert.ok(source?.evidence_locator?.includes('800cc'));
  assert.deepEqual(
    source?.claim_scopes,
    ['identity', 'ingredients', 'quantity', 'liquid', 'process', 'appliance', 'time'],
  );
  assert.equal(catalog.recipes.filter((item) => item.recipe_id === 'tatung-fresh-vegetable-clam-rice').length, 1);
});

test('r101 keeps the existing avocado chicken version separate and source-bounded', () => {
  const recipe = byId.get('tatung-avocado-chicken-rice');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.equal(recipe?.source_refs?.length, 2);
  assert.equal(recipe?.source_refs?.[0]?.access_status, 'opened');
  assert.match(recipe?.cooking_sequence?.[0]?.instruction ?? '', /先在平底锅煎/);
  assert.match(recipe?.cooking_sequence?.at(-1)?.instruction ?? '', /拌入牛油果/);
  assert.match(recipe?.cooker_adaptation?.notes ?? '', /两阶段|不外推/);
  assert.equal(catalog.recipes.filter((item) => item.recipe_id === 'tatung-avocado-chicken-rice').length, 1);
});

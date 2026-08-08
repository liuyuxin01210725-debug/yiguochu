import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

test('r92 records Tefal Portuguese Rice as a named low-priority research recipe', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r150');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(catalog.recipes.filter(item => item.status === 'recipe_fact_checked').length, 794);

  const recipe = catalog.recipes.find(item => item.recipe_id === 'tefal-portuguese-rice-r106506');
  assert.equal(recipe?.canonical_name, 'Portuguese Rice');
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.region_codes, []);
  assert.equal(recipe?.fixed_batch?.servings, 4);
  assert.equal(recipe?.fixed_batch?.ingredients.find(item => item.name === '长粒米')?.amount?.value, 300);
  assert.equal(recipe?.liquid_contract?.amount?.value, 400);
  assert.equal(recipe?.time_contract?.total_minutes, 16);
  assert.deepEqual(recipe?.nutrition_structure?.roles, ['carbohydrate', 'fiber']);
  assert.equal(recipe?.cooker_adaptation?.status, 'source_limited');
  assert.match(recipe?.evidence_notes ?? '', /低优先|没有蛋白|不外推/u);

  const yakitori = catalog.recipes.find(item => item.recipe_id === 'japan-yakitori-canned-rice');
  assert.equal(yakitori?.canonical_name, 'やきとり炊き込みご飯');
  assert.equal(yakitori?.status, 'recipe_fact_checked');
  assert.equal(yakitori?.fixed_batch, null);
  assert.equal(yakitori?.liquid_contract?.amount?.value, 1);
  assert.equal(yakitori?.time_contract?.total_minutes, 40);
  assert.deepEqual(yakitori?.nutrition_structure?.roles, ['carbohydrate', 'protein', 'fiber']);

  const mackerel = catalog.recipes.find(item => item.recipe_id === 'japan-canned-mackerel-wafu-rice');
  assert.equal(mackerel?.canonical_name, 'さば缶を使った和風炊き込みご飯');
  assert.equal(mackerel?.status, 'recipe_fact_checked');
  assert.equal(mackerel?.fixed_batch, null);
  assert.equal(mackerel?.liquid_contract?.amount?.value, 200);
  assert.equal(mackerel?.time_contract?.total_minutes, 30);
  assert.deepEqual(mackerel?.nutrition_structure?.roles, ['carbohydrate', 'protein', 'fiber']);
});

test('r92 keeps the Tefal entry research-only and does not claim a traditional regional identity', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  for (const id of [
    'tefal-portuguese-rice-r106506',
    'japan-yakitori-canned-rice',
    'japan-canned-mackerel-wafu-rice',
  ]) {
    const recipe = catalog.recipes.find(item => item.recipe_id === id);
    assert.notEqual(recipe?.status, 'executable', id);
    assert.equal(recipe?.safety_endpoints?.length, 0, id);
    assert.match(recipe?.evidence_notes ?? '', /不宣称|不外推|缺口|安全/u, id);
  }
  const recipe = catalog.recipes.find(item => item.recipe_id === 'tefal-portuguese-rice-r106506');
  assert.equal(recipe?.traditional_vessels?.[0], 'Tefal自动烹煮器具');
  assert.equal(catalog.recipes.find(item => item.recipe_id === 'japan-yakitori-canned-rice')?.traditional_vessels?.[0], '耐热袋/沸水锅');
  assert.equal(catalog.recipes.find(item => item.recipe_id === 'japan-canned-mackerel-wafu-rice')?.traditional_vessels?.[0], '耐热袋/沸水锅');
});

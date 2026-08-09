import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

test('r96 records the Korean RDA ginseng nutrition rice as a source-backed research recipe', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r206');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(catalog.recipes.filter(item => item.status === 'recipe_fact_checked').length, 770);

  const recipe = catalog.recipes.find(item => item.recipe_id === 'rda-korean-ginseng-chicken-nutrition-rice');
  assert.equal(recipe?.canonical_name, '인삼 영양밥');
  assert.deepEqual(recipe?.aliases, ['韩国人参营养饭', '人参营养饭']);
  assert.deepEqual(recipe?.region_codes, ['KR']);
  assert.equal(recipe?.status, 'recipe_fact_checked');
  assert.deepEqual(recipe?.core_ingredients, ['大米', '鸡肉', '人参', '栗子', '红枣', '鸡高汤']);
  assert.equal(recipe?.fixed_batch, null);
  assert.equal(recipe?.liquid_contract?.amount?.value, 7);
  assert.equal(recipe?.liquid_contract?.amount?.unit, '杯鸡高汤');
  assert.match(recipe?.cooking_sequence?.[0]?.instruction ?? '', /浸泡.*30/u);
  assert.match(recipe?.cooking_sequence?.[3]?.instruction ?? '', /除人参外.*鸡高汤/u);
  assert.deepEqual(recipe?.safety_endpoints, []);
  assert.equal(recipe?.cooker_adaptation?.status, 'not_adapted');
  assert.equal(recipe?.source_refs?.[0]?.url, 'https://www.rda.go.kr/middlePopOpenPopNongsaroDBView.do?no=2109');
  assert.equal(recipe?.source_refs?.[0]?.access_status, 'opened');
  assert.equal(recipe?.source_refs?.[0]?.evidence_tier, 1);
  assert.match(recipe?.source_refs?.[0]?.evidence_locator ?? '', /71.*76/u);
});

test('r96 keeps ginseng nutrition rice below executable without inventing appliance or safety facts', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const recipe = catalog.recipes.find(item => item.recipe_id === 'rda-korean-ginseng-chicken-nutrition-rice');
  assert.notEqual(recipe?.status, 'executable');
  assert.match(recipe?.evidence_notes ?? '', /安全|人参.*时机|器具|电饭煲/u);
  assert.deepEqual(recipe?.nutrition_structure?.roles, ['carbohydrate', 'protein', 'fiber']);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  {
    recipeId: 'tiger-post-196-gomoku-rice',
    name: '五目ごはん',
    url: 'https://www.tiger-corporation.com/ja/jpn/feature/recipe/post_196/',
  },
  {
    recipeId: 'panasonic-fresh-shiitake-rice-sr-afg',
    name: '鲜香菇饭',
    url: 'https://home.panasonic.cn/support/attachments/auld/manual/SR-AFG.pdf',
  },
  {
    recipeId: 'panasonic-mixed-chicken-rice-sr-df151',
    name: '什锦鸡饭',
    url: 'https://home.panasonic.cn/support/attachments/auld/manual/SR-DF151.pdf',
  },
  {
    recipeId: 'zojirushi-minced-pork-greens-rice-nl-erh',
    name: '肉糜青菜饭',
    url: 'https://www.zojirushi-china.com/media/6749/nl-erh-ccn20250317_a.pdf',
  },
];

test('r143 keeps the four existing manufacturer records and closes only source-proven contracts', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r181');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);

  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.ok(recipe, item.recipeId);
    assert.equal(recipe.canonical_name, item.name, item.recipeId);
    assert.equal(recipe.status, 'recipe_fact_checked', item.recipeId);
    assert.notEqual(recipe.status, 'executable', item.recipeId);
    const source = recipe.source_refs.find((candidate) => candidate.url === item.url);
    assert.ok(source, `${item.recipeId}: official source URL`);
    assert.equal(source.access_status, 'opened', item.recipeId);
    assert.ok(source.evidence_locator, item.recipeId);
    assert.ok(source.claim_scopes.includes('quantity'), item.recipeId);
    assert.ok(source.claim_scopes.includes('liquid'), item.recipeId);
    assert.ok(source.claim_scopes.includes('process'), item.recipeId);
  }
});

test('r143 records Tiger post_196 fixed batch, waterline, and duration from the same source', () => {
  const recipe = byId.get('tiger-post-196-gomoku-rice');
  const sourceId = 'S-TIGER-POST-196-GOMOKU-R62';
  assert.equal(recipe.fixed_batch.servings, 4);
  const ingredients = new Map(recipe.fixed_batch.ingredients.map((entry) => [entry.name, entry.amount]));
  assert.deepEqual(ingredients.get('米'), { value: 2, unit: '杯' });
  assert.deepEqual(ingredients.get('鸡肉'), { value: 40, unit: 'g' });
  assert.deepEqual(ingredients.get('胡萝卜'), { value: 20, unit: 'g' });
  assert.equal(recipe.fixed_batch.source_ids[0], sourceId);
  assert.equal(recipe.liquid_contract.kind, 'waterline');
  assert.equal(recipe.liquid_contract.waterline.scale, 'white_rice');
  assert.equal(recipe.liquid_contract.waterline.mark, 2);
  assert.equal(recipe.liquid_contract.source_ids[0], sourceId);
  assert.equal(recipe.time_contract.total_minutes, 55);
  assert.equal(recipe.time_contract.source_ids[0], sourceId);
  assert.equal(recipe.safety_endpoints[0].code, 'poultry_fully_cooked');
  assert.equal(recipe.safety_endpoints[0].minimum_core_temperature_c, 74);
  assert.equal(recipe.safety_endpoints[0].source_ids[0], 'S-SAFETY-TEMPERATURES-1');
  assert.match(recipe.cooker_adaptation.notes, /Tiger|型号|水位|不.*外推/iu);
});

test('r143 preserves model-scoped Panasonic and Zojirushi boundaries where time or servings are not fixed', () => {
  const panasonicAfG = byId.get('panasonic-fresh-shiitake-rice-sr-afg');
  assert.equal(panasonicAfG.fixed_batch, null);
  assert.deepEqual(panasonicAfG.liquid_contract.amount, { value: 1, unit: '杯' });
  assert.equal(panasonicAfG.time_contract, null);
  assert.match(panasonicAfG.cooker_adaptation.notes, /SR-AFG|煲仔饭|37|随食材变化/iu);

  const panasonicDf = byId.get('panasonic-mixed-chicken-rice-sr-df151');
  assert.equal(panasonicDf.fixed_batch, null);
  assert.deepEqual(panasonicDf.liquid_contract.amount, { value: 4, unit: '杯' });
  assert.equal(panasonicDf.time_contract, null);
  assert.match(panasonicDf.cooker_adaptation.notes, /SR-DF151|精煮|38|随食材变化/iu);

  const zojirushi = byId.get('zojirushi-minced-pork-greens-rice-nl-erh');
  assert.equal(zojirushi.fixed_batch, null);
  assert.equal(zojirushi.liquid_contract.kind, 'waterline');
  assert.equal(zojirushi.liquid_contract.waterline.mark, 3);
  assert.equal(zojirushi.time_contract, null);
  assert.match(zojirushi.evidence_notes, /4至5人|65至71|68至75|范围/iu);
});

test('r143 does not invent a universal appliance or safety contract', () => {
  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.doesNotMatch(recipe.cooker_adaptation.notes, /适用于所有|普通电饭煲均可|通用毫升/iu, item.recipeId);
    assert.ok(recipe.safety_endpoints.length > 0, item.recipeId);
  }
});

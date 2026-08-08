import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expected = [
  {
    recipeId: 'afa-ebook8-healthy-ten-grain-rice',
    canonicalName: '健康十榖米',
    alias: '健康十谷米',
    status: 'recipe_fact_checked',
    region: 'TW',
    ingredients: ['糙米', '黑糯米', '蓮子', '小米', '小麥', '紅薏仁', '蕎麥米', '燕麥', '麥片', '芡實'],
    water: 1.2,
    waterUnit: '倍',
    hasFixedBatch: false,
    locator: 'ebook8-1.html 行268至277',
  },
  {
    recipeId: 'hk-startsmart-silk-gourd-seafood-soup-rice',
    canonicalName: '勝瓜海皇泡飯',
    alias: '胜瓜海皇泡饭',
    status: 'recipe_fact_checked',
    region: 'HK',
    ingredients: ['勝瓜', '冬菇', '蝦仁', '帶子', '飯'],
    water: 600,
    waterUnit: 'mL',
    hasFixedBatch: true,
    locator: 'RecipeID=82 行43至80：4人份、勝瓜300g、冬菇50g、蝦仁80g、帶子80g、飯3碗、清水600mL、煮約10分鐘',
  },
  {
    recipeId: 'mo-tourism-portuguese-seafood-rice',
    canonicalName: '葡式海鮮飯',
    alias: '葡式海鲜饭',
    status: 'identity_verified',
    region: 'MO',
    ingredients: ['生米', '蕃茄蓉', '蝦', '青口', '八爪魚'],
    water: null,
    waterUnit: null,
    hasFixedBatch: false,
    locator: '澳门旅游局页面行61、75至77：葡式海鮮飯主菜名称及生米、番茄蓉、蝦、青口、八爪魚熬制描述',
  },
];

test('r117 adds three deduplicated official rice candidates without overclaiming appliance support', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r142');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, catalog.recipes.length);

  for (const item of expected) {
    const recipe = byId.get(item.recipeId);
    assert.ok(recipe, item.recipeId);
    assert.equal(recipe.canonical_name, item.canonicalName, item.recipeId);
    assert.ok(recipe.aliases.includes(item.alias), item.recipeId);
    assert.equal(recipe.status, item.status, item.recipeId);
    assert.equal(recipe.identity_status, 'verified', item.recipeId);
    assert.deepEqual(recipe.region_codes, [item.region], item.recipeId);
    for (const ingredient of item.ingredients) {
      assert.ok(recipe.core_ingredients.includes(ingredient), `${item.recipeId} missing ${ingredient}`);
    }
    assert.equal(recipe.cooker_adaptation.status, 'not_adapted', item.recipeId);
    assert.equal(recipe.time_contract, null, item.recipeId);
    assert.deepEqual(recipe.safety_endpoints, [], item.recipeId);
    assert.equal(recipe.source_refs.length, 1, item.recipeId);
    const source = recipe.source_refs[0];
    assert.equal(source.access_status, 'opened', item.recipeId);
    assert.ok(Number.isInteger(source.evidence_tier) && source.evidence_tier >= 1 && source.evidence_tier <= 5, item.recipeId);
    assert.equal(source.evidence_locator, item.locator, item.recipeId);
    assert.ok(source.claim_scopes.includes('identity'), item.recipeId);
    assert.ok(source.claim_scopes.includes('ingredients'), item.recipeId);
    assert.notEqual(source.access_status, 'search_extract_only', item.recipeId);
    if (item.water === null) {
      assert.equal(recipe.fixed_batch, null, item.recipeId);
      assert.equal(recipe.liquid_contract, null, item.recipeId);
    } else {
      assert.equal(Boolean(recipe.fixed_batch), item.hasFixedBatch, item.recipeId);
      assert.equal(recipe.liquid_contract.kind, 'added_water', item.recipeId);
      assert.equal(recipe.liquid_contract.amount.value, item.water, item.recipeId);
      assert.equal(recipe.liquid_contract.amount.unit, item.waterUnit, item.recipeId);
    }
  }
});

test('r117 preserves direct, cooked-rice, and archive boundaries', () => {
  const grains = byId.get('afa-ebook8-healthy-ten-grain-rice');
  assert.deepEqual(grains.nutrition_structure.roles, ['carbohydrate', 'fiber']);
  assert.match(grains.cooker_adaptation.notes, /未.*(器具|电饭煲|電飯煲)|不.*外推/u);
  assert.match(grains.evidence_notes, /十.*谷|十.*榖/u);

  const soupRice = byId.get('hk-startsmart-silk-gourd-seafood-soup-rice');
  assert.equal(soupRice.fixed_batch.servings, 4);
  assert.equal(soupRice.liquid_contract.amount.value, 600);
  assert.equal(soupRice.liquid_contract.amount.unit, 'mL');
  assert.match(soupRice.evidence_notes, /熟饭|熟飯/iu);
  assert.match(soupRice.cooker_adaptation.notes, /汤锅|湯鍋|电饭煲|電飯煲/u);

  const macau = byId.get('mo-tourism-portuguese-seafood-rice');
  assert.equal(macau.status, 'identity_verified');
  assert.deepEqual(macau.cooking_sequence.length, 1);
  assert.equal(macau.fixed_batch, null);
  assert.equal(macau.liquid_contract, null);
  assert.match(macau.evidence_notes, /缺.*(份数|份量|液体|时间)|没有.*(份数|克数|液体|时间)|仅.*身份/u);
  assert.match(macau.cooker_adaptation.notes, /未.*(器具|电饭煲)|不.*外推/u);
});

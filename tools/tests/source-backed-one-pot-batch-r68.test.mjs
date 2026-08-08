import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

const expected = [
  ['maff-gobo-beef-rice', 'ごぼうと牛肉のごはん', 'recipe_fact_checked'],
  ['maff-fukuoka-bamboo-rice', '福岡たけのこごはん', 'recipe_fact_checked'],
  ['maff-daikon-chicken-rice', '大根ご飯', 'recipe_fact_checked'],
  ['maff-kamo-nasu-jako-rice', 'おまかせ丸投げ賀茂なすご飯', 'recipe_fact_checked'],
  ['maff-tomato-salmon-takikomi', 'トマト炊き込みごはん', 'recipe_fact_checked'],
  ['maff-ume-shirasu-kombu-takikomi', '梅干し炊き込みごはん', 'recipe_fact_checked'],
  ['maff-kombu-mushroom-kaori-gohan', '刻みコンブときのこの香りごはん', 'recipe_fact_checked'],
  ['moa-red-coix-mushroom-risotto', '紅薏仁燉飯', 'recipe_fact_checked'],
  ['guangyuan-sauerkraut-dry-rice', '酸菜干饭', 'recipe_fact_checked'],
  ['wanyuan-selenium-rice-guanfan', '硒米罐儿饭', 'identity_verified'],
  ['zhongtang-clam-meat-rice', '蚬肉饭', 'recipe_fact_checked'],
  ['xianju-salted-sour-rice', '仙居咸酸饭', 'identity_verified'],
  ['tefal-risotto-milanese', 'Risotto Milanese', 'recipe_fact_checked'],
  ['tefal-saffron-rice-seafood', 'Saffron Rice with Seafood', 'recipe_fact_checked'],
  ['tefal-chicken-rice-olives-one-pot-pan', 'Chicken rice with olives', 'recipe_fact_checked'],
];

test('r68 batch records institution, regional, and vendor research without promotion', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r159');
  assert.equal(catalog.recipes.length, 923);
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  for (const [recipeId, canonicalName, status] of expected) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, status, recipeId);
    assert.ok(Array.isArray(recipe?.source_refs) && recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.evidence_locator === 'string' && source.evidence_locator.length > 0), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients) && recipe.core_ingredients.length >= 2, recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
    if (status === 'recipe_fact_checked') {
      assert.ok(Array.isArray(recipe.cooking_sequence) && recipe.cooking_sequence.length > 0, recipeId);
    } else {
      assert.deepEqual(recipe.cooking_sequence, [], recipeId);
      assert.equal(recipe.fixed_batch, null, recipeId);
      assert.equal(recipe.liquid_contract, null, recipeId);
    }
  }
  assert.equal(byId.get('tefal-risotto-milanese')?.cuisine_family, 'manufacturer-one-pot-recipes');
  assert.equal(byId.get('tefal-saffron-rice-seafood')?.cuisine_family, 'manufacturer-one-pot-recipes');
  assert.equal(byId.get('tefal-chicken-rice-olives-one-pot-pan')?.cuisine_family, 'manufacturer-one-pot-recipes');
});

test('r68 keeps process and appliance boundaries explicit', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.match(byId.get('maff-tomato-salmon-takikomi')?.evidence_notes ?? '', /先炒香|预炒/);
  assert.match(byId.get('moa-red-coix-mushroom-risotto')?.evidence_notes ?? '', /两阶段|另锅/);
  assert.match(byId.get('tefal-chicken-rice-olives-one-pot-pan')?.evidence_notes ?? '', /One Pot|平底锅|非电饭煲/);
  assert.match(byId.get('zhongtang-clam-meat-rice')?.evidence_notes ?? '', /熟饭|拌/);
  assert.equal(byId.get('wanyuan-selenium-rice-guanfan')?.fixed_batch, null);
  assert.equal(byId.get('xianju-salted-sour-rice')?.fixed_batch, null);
});

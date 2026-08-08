import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

const expected = [
  ['maff-tomato-cheese-rice', 'トマチーご飯'],
  ['maff-sora-imo-takikomi-rice', '宇宙（そら）芋ごはん'],
  ['maff-chicken-eryngii-omurice', '鶏エリンギごはんの和風オムライス'],
  ['maff-salmon-corn-japanese-paella', '鮭ととうもろこしの和風パエリア'],
  ['maff-eryngii-seafood-pan-paella', 'エリンギとシーフードミックスのパエリア風ご飯'],
  ['maff-goji-avocado-rice', 'クコの実アボガドご飯'],
  ['maff-salmon-okra-mixed-rice', '時短！！オクラ入り鮭の混ぜご飯'],
  ['maff-komatsuna-sausage-mixed-rice', '混ぜるだけ！簡単で美味しい小松菜の混ぜご飯！！'],
  ['jinhua-tangxi-wufan', '汤溪乌饭'],
  ['jining-bengrou-ganfan', '甏肉干饭'],
  ['heilongjiang-demoli-stewed-fish', '得莫利炖鱼'],
  ['tiger-chicken-paella', 'チキンのパエリア'],
  ['tiger-cheese-curry-pilaf', 'チーズカレーピラフ'],
];

test('r69 adds only directly sourced named research candidates without promotion', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r144');
  assert.equal(catalog.recipes.length, 923);
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  for (const [recipeId, canonicalName] of expected) {
    const recipe = byId.get(recipeId);
    assert.equal(recipe?.canonical_name, canonicalName, recipeId);
    assert.equal(recipe?.status, 'recipe_fact_checked', recipeId);
    assert.ok(recipe.source_refs.length > 0, recipeId);
    assert.ok(recipe.source_refs.every(source => source.access_status === 'opened'), recipeId);
    assert.ok(recipe.source_refs.every(source => Number.isInteger(source.evidence_tier)), recipeId);
    assert.ok(recipe.source_refs.every(source => typeof source.evidence_locator === 'string' && source.evidence_locator.length > 0), recipeId);
    assert.ok(Array.isArray(recipe.core_ingredients) && recipe.core_ingredients.length >= 2, recipeId);
    assert.notEqual(recipe.status, 'executable', recipeId);
    assert.ok(Array.isArray(recipe.cooking_sequence) && recipe.cooking_sequence.length > 0, recipeId);
  }
});

test('r69 keeps category and nutrition boundaries explicit', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));
  assert.match(byId.get('maff-chicken-eryngii-omurice')?.evidence_notes ?? '', /两阶段|蛋皮|平底锅/);
  assert.match(byId.get('maff-salmon-corn-japanese-paella')?.evidence_notes ?? '', /炉灶|平底锅|非电饭煲/);
  assert.match(byId.get('maff-salmon-okra-mixed-rice')?.evidence_notes ?? '', /熟饭|拌/);
  assert.match(byId.get('jinhua-tangxi-wufan')?.evidence_notes ?? '', /点心|非主餐|低蛋白/);
  assert.match(byId.get('jining-bengrou-ganfan')?.evidence_notes ?? '', /分开|配菜/);
  assert.match(byId.get('heilongjiang-demoli-stewed-fish')?.evidence_notes ?? '', /非米饭/);
  assert.match(byId.get('tiger-chicken-paella')?.evidence_notes ?? '', /电压力锅|出锅后|同锅/);
});

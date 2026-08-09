import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

test('r218 closes exact same-source fixed batches without changing catalog size', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r232');
  assert.equal(catalog.recipes.length, 923);

  const anago = byId['maff-hiroshima-anagomeshi'];
  assert.ok(anago);
  assert.equal(anago.status, 'recipe_fact_checked');
  assert.equal(anago.fixed_batch?.servings, 4);
  assert.deepEqual(anago.fixed_batch?.source_ids, ['S-MAFF-HIROSHIMA-ANAGOMESHI-1']);
  for (const [name, value, unit] of [
    ['米', 480, 'g'],
    ['昆布', 10, 'cm角'],
    ['穴子', 4, '尾'],
    ['甘醋姜', 40, 'g'],
    ['酱油（调味料A）', 1, '大匙1弱'],
    ['酒（调味料A）', 1, '大匙'],
    ['盐（调味料A）', 0.5, '小匙'],
    ['酱油（调味料B）', 3, '大匙'],
    ['酒（调味料B）', 3, '大匙'],
    ['味醂（调味料B）', 3, '大匙'],
  ]) {
    const ingredient = anago.fixed_batch.ingredients.find((item) => item.name === name);
    assert.ok(ingredient, `missing ${name}`);
    assert.deepEqual(ingredient.amount, { value, unit });
    assert.deepEqual(ingredient.source_ids, ['S-MAFF-HIROSHIMA-ANAGOMESHI-1']);
  }
  assert.equal(anago.liquid_contract, null);
  assert.equal(anago.time_contract, null);
  assert.equal(anago.cooker_adaptation?.status, 'not_adapted');

  const keihan = byId['maff-kagoshima-keihan'];
  assert.ok(keihan);
  assert.equal(keihan.status, 'recipe_fact_checked');
  assert.equal(keihan.fixed_batch?.servings, 4);
  assert.deepEqual(keihan.fixed_batch?.source_ids, ['S-MAFF-KAGOSHIMA-KEIHAN-1']);
  for (const [name, value, unit] of [
    ['米', 320, 'g'],
    ['水（米饭）', 480, 'cc'],
    ['鸡骨', 240, 'g'],
    ['水（鸡汤）', 800, 'cc'],
    ['鸡胸肉', 60, 'g'],
    ['清酒（A）', 2, '小匙'],
    ['淡口酱油（A）', 1, '大匙'],
    ['本味醂（A）', 2, '小匙'],
    ['干香菇', 8, 'g'],
    ['香菇回水', 80, 'cc'],
    ['淡口酱油（B）', 2, '小匙'],
    ['本味醂（B）', 1, '小匙'],
    ['鸡蛋', 2, '个'],
    ['四季豆', 80, 'g'],
    ['葱', 20, 'g'],
    ['木瓜味噌渍', 40, 'g'],
  ]) {
    const ingredient = keihan.fixed_batch.ingredients.find((item) => item.name === name);
    assert.ok(ingredient, `missing ${name}`);
    assert.deepEqual(ingredient.amount, { value, unit });
  }
  assert.equal(keihan.liquid_contract, null);
  assert.equal(keihan.cooker_adaptation?.status, 'not_adapted');

  const soy = byId['philips-soy-milk-chicken-congee'];
  assert.ok(soy);
  assert.equal(soy.status, 'recipe_fact_checked');
  assert.equal(soy.fixed_batch?.servings, 1);
  assert.deepEqual(soy.fixed_batch?.source_ids, ['S-PHILIPS-SOY-MILK-CHICKEN-CONGEE-1']);
  for (const [name, value, unit] of [
    ['鸡里肌肉', 2, '条'],
    ['豆浆', 1, '杯'],
    ['米', 1, '杯'],
    ['水', 5, '杯'],
  ]) {
    const ingredient = soy.fixed_batch.ingredients.find((item) => item.name === name);
    assert.ok(ingredient, `missing ${name}`);
    assert.deepEqual(ingredient.amount, { value, unit });
  }
  assert.equal(soy.liquid_contract, null);
  assert.deepEqual(soy.time_contract, {
    total_minutes: 35,
    source_ids: ['S-PHILIPS-SOY-MILK-CHICKEN-CONGEE-1'],
  });
});

test('r218 keeps staged and multi-liquid boundaries explicit', () => {
  const anago = byId['maff-hiroshima-anagomeshi'];
  assert.match(anago.evidence_notes ?? '', /穴子.*单独|分段|铺饭/u);
  assert.ok((anago.cooking_sequence ?? []).length >= 3);

  const keihan = byId['maff-kagoshima-keihan'];
  assert.match(keihan.evidence_notes ?? '', /分段|汤泡饭/u);
  assert.equal(keihan.liquid_contract, null);

  const soy = byId['philips-soy-milk-chicken-congee'];
  assert.match(soy.cooker_adaptation?.notes ?? '', /多功能烹煮锅|普通电饭煲/u);
});

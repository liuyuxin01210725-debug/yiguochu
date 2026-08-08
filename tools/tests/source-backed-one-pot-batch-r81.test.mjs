import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalogPath = new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url);

const expected = [
  ['philips-red-bean-beef-brown-rice-vegetable-rice', '紅豆牛肉糙米菜飯', 'recipe_fact_checked'],
  ['philips-spinach-salmon-congee', '菠菜三文魚粥', 'recipe_fact_checked'],
  ['philips-sea-conch-oyster-chicken-congee', '螺片金蠔滑雞粥', 'recipe_fact_checked'],
  ['panasonic-my-century-egg-chicken-congee', 'Century Egg & Chicken Congee', 'recipe_fact_checked'],
  ['panasonic-my-chicken-pumpkin-lotus-mixed-rice', 'Mixed Rice with pumpkin and lotus roots', 'identity_verified'],
  ['wuerhe-awudan-lamb-shank-pilaf', '阿吾丹羊拐抓飯', 'identity_verified'],
  ['shache-pea-meat-pilaf', '豌豆肉抓飯', 'identity_verified'],
];

test('r81 registers seven directly sourced named one-pot candidates without promotion', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r192');
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

  const counts = Object.groupBy(catalog.recipes, recipe => recipe.status);
  assert.equal(counts.recipe_fact_checked.length, 794);
  assert.equal(counts.identity_verified.length, 100);
  assert.equal(counts.executable.length, 12);
  assert.equal(counts.discovered.length, 17);
});

test('r81 preserves source limits and unresolved boundaries for new candidates', () => {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const byId = new Map(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

  const redBean = byId.get('philips-red-bean-beef-brown-rice-vegetable-rice');
  assert.equal(redBean.liquid_contract.kind, 'waterline');
  assert.match(redBean.cooker_adaptation.notes, /指定型号|不外推/u);
  assert.equal(redBean.fixed_batch, null);

  const spinach = byId.get('philips-spinach-salmon-congee');
  assert.match(spinach.evidence_notes, /8个月|15分钟|中途/u);
  assert.equal(spinach.time_contract.total_minutes, 240);
  assert.equal(spinach.safety_endpoints.length, 0);

  const chickenCongee = byId.get('philips-sea-conch-oyster-chicken-congee');
  assert.equal(chickenCongee.liquid_contract.kind, 'waterline');
  assert.match(chickenCongee.cooker_adaptation.notes, /指定|不外推/u);
  assert.equal(chickenCongee.fixed_batch, null);

  const panasonicCongee = byId.get('panasonic-my-century-egg-chicken-congee');
  assert.equal(panasonicCongee.fixed_batch.servings, 3);
  assert.equal(panasonicCongee.time_contract.total_minutes, 23);
  assert.match(panasonicCongee.evidence_notes, /搅拌机|传统皮蛋瘦肉粥|安全/u);
  assert.equal(panasonicCongee.safety_endpoints.length, 1);

  const pumpkinLotus = byId.get('panasonic-my-chicken-pumpkin-lotus-mixed-rice');
  assert.equal(pumpkinLotus.cooking_sequence.length, 0);
  assert.match(pumpkinLotus.evidence_notes, /鸡腿|步骤|投料/u);
  assert.equal(pumpkinLotus.status, 'identity_verified');

  const awudan = byId.get('wuerhe-awudan-lamb-shank-pilaf');
  assert.deepEqual(awudan.cooking_sequence, []);
  assert.equal(awudan.fixed_batch, null);
  assert.match(awudan.evidence_notes, /原料|流程|不补写/u);

  const shache = byId.get('shache-pea-meat-pilaf');
  assert.deepEqual(shache.cooking_sequence, []);
  assert.equal(shache.fixed_batch, null);
  assert.match(shache.evidence_notes, /豌豆肉抓饭|流程|不补写/u);
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map(recipe => [recipe.recipe_id, recipe]));

const tigerTakikomiSource = 'S-TIGER-TAKIKOMI-GOHAN-1';
const basicCongeeSource = 'S-TIGER-BASIC-CONGEE-R60';
const mincedPorkSource = 'S-TIGER-TAIWAN-MINCED-PORK-R60';
const garlicShrimpSource = 'S-TIGER-GARLIC-SHRIMP-HERBED-RICE-R60';

function ingredient(recipe, name) {
  return recipe.fixed_batch.ingredients.find(row => row.name === name);
}

test('r159 closes Tiger Takikomi fixed batch and model-scoped waterline only', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r225');
  const recipe = byId['tiger-takikomi-gohan'];
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.notEqual(recipe.status, 'executable');
  assert.equal(recipe.fixed_batch.servings, 4);
  assert.equal(ingredient(recipe, '米').amount.value, 3);
  assert.equal(ingredient(recipe, '鸡腿肉').amount.value, 2);
  assert.equal(ingredient(recipe, '鸡腿肉').amount.unit, 'oz');
  assert.equal(ingredient(recipe, '胡萝卜').amount.value, 1.5);
  assert.deepEqual(recipe.fixed_batch.source_ids, [tigerTakikomiSource]);
  assert.equal(recipe.liquid_contract.kind, 'waterline');
  assert.equal(recipe.liquid_contract.waterline.scale, 'Ultra');
  assert.equal(recipe.liquid_contract.waterline.mark, '3 (5.5-cup) / 6 (10-cup)');
  assert.match(recipe.liquid_contract.waterline.appliance_model, /Tiger 5\.5-cup.*10-cup/u);
  assert.deepEqual(recipe.liquid_contract.source_ids, [tigerTakikomiSource]);
  assert.equal(recipe.time_contract, null);
  assert.match(recipe.evidence_notes, /雪豆|荷兰豆.*出锅|5\.5/u);
});

test('r159 closes Basic Congee waterline and 70-minute program without inventing chicken quantity', () => {
  const recipe = byId['r60-tiger-basic-chicken-congee'];
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.fixed_batch, null);
  assert.equal(recipe.liquid_contract.kind, 'waterline');
  assert.equal(recipe.liquid_contract.waterline.scale, 'Soft Porridge');
  assert.equal(recipe.liquid_contract.waterline.mark, 0.5);
  assert.match(recipe.liquid_contract.waterline.appliance_model, /Tiger 5\.5-cup/u);
  assert.deepEqual(recipe.liquid_contract.source_ids, [basicCongeeSource]);
  assert.equal(recipe.time_contract.total_minutes, 70);
  assert.deepEqual(recipe.time_contract.source_ids, [basicCongeeSource]);
  assert.match(recipe.evidence_notes, /未给鸡肉.*用量|不补写鸡肉/u);
});

test('r159 closes quantified Taiwan Minced Pork fixed batch and keeps water/time unknown', () => {
  const recipe = byId['r60-tiger-taiwan-minced-pork-rice'];
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.notEqual(recipe.status, 'executable');
  assert.equal(recipe.fixed_batch.servings, 2);
  assert.equal(ingredient(recipe, '白米').amount.value, 2);
  assert.equal(ingredient(recipe, '猪绞肉').amount.value, 0.5);
  assert.equal(ingredient(recipe, '猪绞肉').amount.unit, 'lb');
  assert.equal(ingredient(recipe, '香菇').amount.value, 2);
  assert.equal(ingredient(recipe, '香菇').amount.unit, 'oz');
  assert.equal(ingredient(recipe, '炸葱').amount.value, 0.5);
  assert.deepEqual(recipe.fixed_batch.source_ids, [mincedPorkSource]);
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.match(recipe.evidence_notes, /Tacook|上层|水量.*未|普通电饭煲/u);
});

test('r159 closes quantified Garlic Shrimp fixed batch while preserving later safety closure', () => {
  const recipe = byId['r60-tiger-garlic-shrimp-herbed-rice'];
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.notEqual(recipe.status, 'executable');
  assert.equal(recipe.fixed_batch.servings, 2);
  assert.equal(ingredient(recipe, '白米').amount.value, 2);
  assert.equal(ingredient(recipe, '虾').amount.value, 0.625);
  assert.equal(ingredient(recipe, '虾').amount.unit, 'lb');
  assert.ok(Math.abs(ingredient(recipe, '蒜').amount.value - (1 / 6)) < 1e-9);
  assert.equal(ingredient(recipe, '橄榄油').amount.value, 1);
  assert.equal(ingredient(recipe, '柠檬汁').amount.value, 1.5);
  assert.deepEqual(recipe.fixed_batch.source_ids, [garlicShrimpSource]);
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.equal(recipe.safety_endpoints[0]?.code, 'shellfish_fully_cooked');
  assert.match(recipe.evidence_notes, /Tacook|上层|水量.*未|安全/u);
});

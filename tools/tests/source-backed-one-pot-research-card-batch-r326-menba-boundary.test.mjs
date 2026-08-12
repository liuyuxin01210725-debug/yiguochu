import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

test('r326 records the opened Menba corn-rice staple and stone-pot boundary without inventing a recipe contract', () => {
  const recipe = byId.get('metok-menba-corn-rice');
  assert.ok(recipe);
  assert.equal(recipe.status, 'identity_verified');
  assert.equal(recipe.cooking_sequence.length, 2);
  assert.ok(recipe.cooking_sequence.every((step) => step.provenance === 'source'));
  assert.ok(recipe.cooking_sequence.every((step) => step.source_ids.includes('S-XZ-MENBA-METOK-CORN-RICE-1')));
  assert.match(recipe.cooking_sequence[1].instruction, /石锅|没有玉米饭的加水量/u);
  assert.equal(recipe.fixed_batch, null);
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.deepEqual(recipe.safety_endpoints, []);
  assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
});

test('r326 leaves the unrelated Yichang card unchanged after the boundary-only patch', () => {
  const recipe = byId.get('yichang-cured-pork-braised-rice');
  assert.ok(recipe);
  assert.deepEqual(recipe.cooking_sequence, []);
  assert.match(recipe.evidence_notes, /宜昌市发展和改革委员会页面的搜索摘录/);
  assert.ok(!recipe.cooking_sequence.some((step) => step.source_ids.includes('S-XZ-MENBA-METOK-CORN-RICE-1')));
});

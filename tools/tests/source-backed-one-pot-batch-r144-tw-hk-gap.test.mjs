import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

test('r144 bumps the catalog without adding canonical recipes', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r229');
  assert.equal(catalog.recipes.length, 923);
  assert.equal(new Set(catalog.recipes.map((recipe) => recipe.recipe_id)).size, 923);
});

test('r144 closes only the same-source time contracts that are explicit', () => {
  const porridge = byId.get('taiwan-four-season-pork-congee');
  assert.ok(porridge);
  assert.equal(porridge.status, 'recipe_fact_checked');
  assert.equal(porridge.fixed_batch, null);
  assert.equal(porridge.liquid_contract.amount.value, 3);
  assert.equal(porridge.liquid_contract.amount.unit, '杯');
  assert.equal(porridge.time_contract.total_minutes, 20);
  assert.deepEqual(porridge.time_contract.source_ids, ['S-TW-AFA-FOUR-SEASON-PORRIDGE-1']);

  const turmeric = byId.get('taiwan-turmeric-chicken-risotto');
  assert.ok(turmeric);
  assert.equal(turmeric.status, 'recipe_fact_checked');
  assert.equal(turmeric.fixed_batch, null);
  assert.equal(turmeric.liquid_contract, null);
  assert.equal(turmeric.time_contract.total_minutes, 30);
  assert.deepEqual(turmeric.time_contract.source_ids, ['S-TW-MOA-KIDS-TURMERIC-CHICKEN-RISOTTO-1']);
  assert.match(turmeric.evidence_notes, /高汤.*1\/2杯|椰浆.*2大匙|外锅.*1杯/iu);
});

test('r144 does not collapse ranged or layered liquids into a false scalar', () => {
  const millet = byId.get('taiwan-millet-root-vegetable-rice');
  assert.ok(millet);
  assert.equal(millet.time_contract.total_minutes, 30);
  assert.deepEqual(millet.time_contract.source_ids, ['S-TW-MOA-KIDS-MILLET-RICE-1']);
  assert.equal(millet.liquid_contract, null);
  assert.match(millet.evidence_notes, /2\.5[–-]3.*水|范围|不能.*中值/iu);

  for (const recipeId of [
    'taiwan-shiitake-tea-oil-vegetable-rice',
    'taiwan-tea-oil-vegetable-health-rice',
  ]) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.fixed_batch, null, recipeId);
    assert.equal(recipe.liquid_contract, null, recipeId);
    assert.equal(recipe.time_contract, null, recipeId);
  }
});

test('r144 keeps appliance boundaries and source evidence unchanged', () => {
  const porridge = byId.get('taiwan-four-season-pork-congee');
  assert.equal(porridge.cooker_adaptation.status, 'not_adapted');
  assert.match(porridge.cooker_adaptation.notes, /锅中小火慢煮|不.*电饭煲/iu);
  const source = porridge.source_refs.find(({ source_id: sourceId }) => sourceId === 'S-TW-AFA-FOUR-SEASON-PORRIDGE-1');
  assert.ok(source);
  assert.equal(source.access_status, 'opened');
  assert.equal(source.evidence_tier, 1);
  assert.match(source.evidence_locator, /136.*148/);
});

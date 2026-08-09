import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));
const expectedIds = [
  'instant-pot-chicken-satay-rice',
  'osu-cheesy-chicken-rice-vegetable-skillet',
  'cu-caribbean-jerk-chicken-rice',
  'cdph-calfresh-chicken-rice',
  'wisconsin-polk-arroz-con-pollo',
];
const executableIds = new Set(['instant-pot-chicken-satay-rice']);

test('r201 closes five directly evidenced public-institution poultry gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r252');
  assert.equal(catalog.recipes.length, 923);

  for (const recipeId of expectedIds) {
    const recipe = byId.get(recipeId);
    assert.ok(recipe, recipeId);
    assert.equal(recipe.status, executableIds.has(recipeId) ? 'executable' : 'recipe_fact_checked', recipeId);
    assert.deepEqual(recipe.safety_endpoints, [{
      code: 'poultry_fully_cooked',
      minimum_core_temperature_c: 74,
      source_ids: ['S-SAFETY-TEMPERATURES-1'],
    }], recipeId);
    const source = recipe.source_refs.find((row) => row.source_id === 'S-SAFETY-TEMPERATURES-1');
    assert.ok(source, `${recipeId}: safety source`);
    assert.equal(source.access_status, 'opened', recipeId);
    assert.equal(source.evidence_tier, 1, recipeId);
    assert.deepEqual(source.claim_scopes, ['safety'], recipeId);
  }
});

test('r201 preserves the original public-institution process and appliance boundaries', () => {
  const instant = byId.get('instant-pot-chicken-satay-rice');
  assert.match(instant.cooking_sequence.map((step) => step.instruction).join(' '), /鸡胸|Sauté|压力/u);
  assert.equal(instant.cooker_adaptation.status, 'source_limited');

  const osu = byId.get('osu-cheesy-chicken-rice-vegetable-skillet');
  assert.match(osu.cooking_sequence.map((step) => step.instruction).join(' '), /煎锅|鸡肉|糙米/u);
  assert.equal(osu.cooker_adaptation.status, 'source_limited');

  const cu = byId.get('cu-caribbean-jerk-chicken-rice');
  assert.match(cu.cooking_sequence.map((step) => step.instruction).join(' '), /鸡腿|烤箱|回锅/u);
  assert.equal(cu.cooker_adaptation.status, 'source_limited');

  const cdph = byId.get('cdph-calfresh-chicken-rice');
  assert.match(cdph.cooking_sequence.map((step) => step.instruction).join(' '), /鸡胸|煎锅|摆回/u);
  assert.equal(cdph.cooker_adaptation.status, 'source_limited');

  const wisconsin = byId.get('wisconsin-polk-arroz-con-pollo');
  assert.match(wisconsin.cooking_sequence.map((step) => step.instruction).join(' '), /整鸡|大煎锅|未煮米/u);
  assert.equal(wisconsin.cooker_adaptation.status, 'source_limited');
});

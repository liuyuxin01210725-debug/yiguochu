import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = new Map(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));

const expectedIds = [
  'global-nwu-one-pot-chicken-rice',
  'global-irga-risoto-frango-legumes',
  'global-peru-minsa-arroz-pollo',
  'tamu-turkey-burrito-bowl',
  'usu-salsa-verde-chicken-rice',
];
const executableIds = new Set(['tamu-turkey-burrito-bowl']);

test('r199 closes five directly evidenced global poultry safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r237');
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
    const safetySource = recipe.source_refs.find((source) => source.source_id === 'S-SAFETY-TEMPERATURES-1');
    assert.ok(safetySource, `${recipeId}: safety source`);
    assert.equal(safetySource.access_status, 'opened', recipeId);
    assert.equal(safetySource.evidence_tier, 1, recipeId);
    assert.deepEqual(safetySource.claim_scopes, ['safety'], recipeId);
    if (!executableIds.has(recipeId)) assert.ok(!['approved', 'auto_approved', 'executable', 'preview_ready'].includes(recipe.status), recipeId);
  }
});

test('r199 preserves source-specific poultry process and appliance boundaries', () => {
  const nwu = byId.get('global-nwu-one-pot-chicken-rice');
  assert.match(nwu.cooking_sequence.map((step) => step.instruction).join(' '), /普通锅|低火|20–30/u);
  assert.equal(nwu.cooker_adaptation.status, 'source_limited');

  const irga = byId.get('global-irga-risoto-frango-legumes');
  assert.match(irga.cooking_sequence.map((step) => step.instruction).join(' '), /炒香|分次|高汤/u);
  assert.equal(irga.cooker_adaptation.status, 'source_limited');

  const peru = byId.get('global-peru-minsa-arroz-pollo');
  assert.match(peru.cooking_sequence.map((step) => step.instruction).join(' '), /鸡肉|煮熟|米饭/u);

  const tamu = byId.get('tamu-turkey-burrito-bowl');
  assert.match(tamu.cooking_sequence.map((step) => step.instruction).join(' '), /火鸡肉末|Sauté|高压/u);
  assert.equal(tamu.cooker_adaptation.status, 'source_limited');

  const salsa = byId.get('usu-salsa-verde-chicken-rice');
  assert.match(salsa.cooking_sequence.map((step) => step.instruction).join(' '), /鸡腿|煎|盖锅/u);
  assert.equal(salsa.cooker_adaptation.status, 'source_limited');
});

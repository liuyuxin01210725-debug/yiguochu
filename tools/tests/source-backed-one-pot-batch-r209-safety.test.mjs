import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const byId = Object.fromEntries(catalog.recipes.map((recipe) => [recipe.recipe_id, recipe]));
const safetySourceId = 'S-SAFETY-TEMPERATURES-1';
const safetyUrl = 'https://www.foodsafety.gov/food-safety-charts/safe-minimum-internal-temperatures';

const expected = {
  'cookpot-salted-mackerel-chicken-claypot-rice': {
    code: 'poultry_fully_cooked',
    temperature: 74,
    evidence: /鸡肉炒至表面变色|确认鸡鱼熟透/u,
  },
  'zojirushi-pad-thai-shrimp-mixed-rice': {
    code: 'shellfish_fully_cooked',
    visual: '虾肉呈珍珠白或白色且不透明',
    evidence: /12 oz生虾|生虾单独炒至完全熟透/u,
  },
  'toshiba-hk-chicken-scallop-porridge-pc48drshk': {
    code: 'poultry_fully_cooked',
    temperature: 74,
    evidence: /生鸡肉.*同一内锅/u,
  },
};

test('r209 closes three directly evidenced raw-protein safety gaps', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r235');
  assert.equal(catalog.recipes.length, 923);

  for (const [recipeId, contract] of Object.entries(expected)) {
    const recipe = byId[recipeId];
    assert.ok(recipe, `missing ${recipeId}`);
    assert.equal(recipe.status, 'recipe_fact_checked', recipeId);
    const endpoint = recipe.safety_endpoints.find((row) => row.code === contract.code);
    assert.ok(endpoint, `${recipeId}: missing ${contract.code}`);
    if (contract.temperature != null) {
      assert.equal(endpoint.minimum_core_temperature_c, contract.temperature, recipeId);
    } else {
      assert.equal(endpoint.visual_endpoint, contract.visual, recipeId);
    }
    assert.deepEqual(endpoint.source_ids, [safetySourceId], recipeId);
    const safetySource = recipe.source_refs.find((row) => row.source_id === safetySourceId);
    assert.ok(safetySource, `${recipeId}: shared safety source`);
    assert.equal(safetySource.url, safetyUrl, recipeId);
    assert.equal(safetySource.access_status, 'opened', recipeId);
    assert.equal(safetySource.evidence_tier, 1, recipeId);
    assert.deepEqual(safetySource.claim_scopes, ['safety'], recipeId);
    assert.match(`${recipe.evidence_notes} ${JSON.stringify(recipe.cooking_sequence)}`, contract.evidence, recipeId);
  }
});

test('r209 preserves the original staged and contradictory process boundaries', () => {
  assert.match(byId['cookpot-salted-mackerel-chicken-claypot-rice'].evidence_notes, /分层|咸鱼|鸡肉/u);
  assert.match(byId['zojirushi-pad-thai-shrimp-mixed-rice'].evidence_notes, /独立煎锅|另锅|出锅混合/u);
  assert.match(byId['toshiba-hk-chicken-scallop-porridge-pc48drshk'].evidence_notes, /6杯|水位4|液体.*矛盾/u);
});

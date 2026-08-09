import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find((item) => item.recipe_id === 'r58-taiwan-red-crab-glutinous-rice');

test('r252 closes the directly evidenced red-crab safety gap', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r254');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.safety_endpoints, [
    {
      code: 'shellfish_fully_cooked',
      visual_endpoint: '肉质呈珍珠白或白色且不透明',
      source_ids: ['S-SAFETY-TEMPERATURES-1']
    }
  ]);
  const safety = recipe.source_refs.find((source) => source.source_id === 'S-SAFETY-TEMPERATURES-1');
  assert.ok(safety);
  assert.deepEqual(safety.claim_scopes, ['safety']);
  assert.equal(safety.access_status, 'opened');
  assert.equal(safety.evidence_tier, 1);
});

test('r252 preserves the staged steaming and non-executable boundaries', () => {
  assert.ok(recipe);
  const steps = recipe.cooking_sequence.map((step) => step.instruction).join(' ');
  assert.match(steps, /先蒸7至8分钟/u);
  assert.match(steps, /继续蒸/u);
  assert.equal(recipe.time_contract, null);
  assert.equal(recipe.fixed_batch, null);
  assert.equal(recipe.cooker_adaptation.status, 'not_adapted');
  assert.equal('executable' in recipe, false);
});

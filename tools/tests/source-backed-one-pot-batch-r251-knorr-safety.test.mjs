import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find((item) => item.recipe_id === 'knorr-electric-rice-cooker-egg-mushroom-beef-rice');

test('r251 closes the directly evidenced ground-beef safety gap', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r251');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.safety_endpoints, [
    {
      code: 'beef_fully_cooked',
      minimum_core_temperature_c: 71,
      source_ids: ['S-SAFETY-TEMPERATURES-1']
    }
  ]);
  const safety = recipe.source_refs.find((source) => source.source_id === 'S-SAFETY-TEMPERATURES-1');
  assert.ok(safety);
  assert.deepEqual(safety.claim_scopes, ['safety']);
  assert.equal(safety.access_status, 'opened');
  assert.equal(safety.evidence_tier, 1);
});

test('r251 keeps the post-cook egg and electric-cooker boundaries explicit', () => {
  assert.ok(recipe);
  assert.match(recipe.cooker_adaptation.notes, /后投牛肉|窝蛋/u);
  assert.match(recipe.cooking_sequence.map((step) => step.instruction).join(' '), /跳掣前约5分钟|再焗约10分钟/u);
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.equal(recipe.cooker_adaptation.status, 'source_limited');
  assert.equal('executable' in recipe, false);
});

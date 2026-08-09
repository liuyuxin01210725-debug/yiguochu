import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find(item => item.recipe_id === 'tefal-602-seafood-paella');

test('r174 records the TEFAL602 seafood paella fish-stock contract', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r236');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.liquid_contract, {
    kind: 'added_broth',
    amount: { value: 500, unit: 'mL鱼高汤' },
    source_ids: ['S-R76-TEFAL602-SEAFOOD-PAELLA'],
  });
  assert.equal(recipe.fixed_batch?.servings, 4);
  assert.equal(recipe.time_contract, null);
  assert.equal(recipe.cooker_adaptation?.status, 'source_limited');
  assert.match(recipe.cooker_adaptation?.notes ?? '', /TEFAL602|分阶段|PDF/u);
});

test('r174 keeps the staged seafood and archive boundary', () => {
  const source = recipe?.source_refs?.find(item => item.source_id === 'S-R76-TEFAL602-SEAFOOD-PAELLA');
  assert.ok(source);
  assert.ok(source.claim_scopes.includes('liquid'));
  assert.match(source.evidence_locator ?? '', /4人份|鱼高汤500mL|海鲜混合250g/u);
  assert.match(recipe?.cooking_sequence?.[1]?.instruction ?? '', /约28分钟|海鲜混合|5分钟/u);
  assert.deepEqual(recipe?.safety_endpoints, []);
});

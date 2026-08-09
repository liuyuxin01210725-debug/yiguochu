import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find(item => item.recipe_id === 'tefal-602-smoked-haddock-kedgeree');

test('r176 records the TEFAL602 smoked haddock kedgeree stock contract', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260808-global-r223');
  assert.equal(catalog.recipes.length, 923);
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.deepEqual(recipe.liquid_contract, {
    kind: 'added_stock',
    amount: { value: 400, unit: 'mL高汤' },
    source_ids: ['S-R76-TEFAL602-SMOKED-HADDOCK-KEDGEREE'],
  });
  assert.equal(recipe.fixed_batch?.servings, 4);
  assert.equal(recipe.time_contract, null);
  assert.equal(recipe.cooker_adaptation?.status, 'source_limited');
  assert.match(recipe.cooker_adaptation?.notes ?? '', /TEFAL602|熟鸡蛋|PDF/u);
});

test('r176 keeps the smoked-fish and separate-egg boundary', () => {
  const source = recipe?.source_refs?.find(item => item.source_id === 'S-R76-TEFAL602-SMOKED-HADDOCK-KEDGEREE');
  assert.ok(source);
  assert.ok(source.claim_scopes.includes('liquid'));
  assert.match(source.evidence_locator ?? '', /4人份|高汤400mL|烟熏黑线鳕300g/u);
  assert.match(recipe?.cooking_sequence?.[2]?.instruction ?? '', /另行煮熟|鸡蛋|不是锅内/u);
  assert.deepEqual(recipe?.safety_endpoints, []);
});

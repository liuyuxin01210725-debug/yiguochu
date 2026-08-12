import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildResearchMethod } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const recipe = catalog.recipes.find(item => item.recipe_id === 'wuhu-zharou-steamed-rice');

test('r317 adds the directly opened Wuhu steamed pork-rice process without inventing contracts', () => {
  assert.ok(recipe);
  assert.equal(recipe.status, 'identity_verified');
  assert.equal(recipe.fixed_batch, null);
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.deepEqual(recipe.cooking_sequence.map(step => step.instruction), [
    '以糯米为饭。',
    '将猪肉切开，用调味料腌渍。',
    '把腌渍后的猪肉蘸上渣粉。',
    '把蘸好渣粉的猪肉放在糯米饭上蒸熟。',
  ]);
  const source = recipe.source_refs.find(item => item.source_id === 'S-CN-AH-WUHU-ZHAROU-RECIPE-20250321');
  assert.ok(source);
  assert.equal(source.access_status, 'opened');
  assert.ok(source.claim_scopes.includes('process'));
  assert.match(source.evidence_locator, /糯米为饭|腌渍|渣粉|蒸熟/u);
});

test('r317 exposes the four official steps before any research supplement', () => {
  const method = buildResearchMethod(recipe);
  assert.equal(method.steps.length, 4);
  assert.ok(method.steps.every(step => step.provenance === 'source'));
  assert.equal(method.liquid.provenance, 'estimated');
  assert.equal(method.time.provenance, 'estimated');
  assert.ok(method.assumptions.some(note => /液体|总时长|来源/iu.test(note)));
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildResearchMethod } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('r321 closes the Shaanxi gazette process fragment for northern jujube braised rice', () => {
  assert.equal(catalog.catalog_version, 'source-backed-one-pot-v1-20260812-global-r297');
  assert.equal(catalog.recipes.length, 923);
  const recipe = catalog.recipes.find(item => item.recipe_id === 'cn-shaanxi-northern-jujube-braised-rice');
  assert.ok(recipe);
  assert.equal(recipe.status, 'recipe_fact_checked');
  assert.equal(recipe.fixed_batch, null);
  assert.equal(recipe.liquid_contract, null);
  assert.equal(recipe.time_contract, null);
  assert.deepEqual(recipe.core_ingredients, ['软谷米', '软黄米', '红枣', '豇豆', '红糖']);
  assert.deepEqual(recipe.cooking_sequence.map(step => step.instruction), [
    '准备软谷米、软黄米、红枣、豇豆和红糖。',
    '将软谷米、软黄米、红枣、豇豆和红糖一同下锅。',
    '加水后用文火慢慢焖煮，保持原文的慢火焖煮边界。',
  ]);
  const source = recipe.source_refs.find(item => item.source_id === 'S-CN-SN-NORTHERN-JUJUBE-BRAISED-RICE-1');
  assert.ok(source);
  assert.equal(source.access_status, 'opened');
  assert.ok(source.claim_scopes.includes('ingredients'));
  assert.ok(source.claim_scopes.includes('process'));
  assert.match(source.evidence_locator, /软谷米|软黄米|红枣|豇豆|红糖|文火慢慢焖煮/u);
});

test('r321 keeps missing batch, liquid and time fields visibly estimated in the research card', () => {
  const recipe = catalog.recipes.find(item => item.recipe_id === 'cn-shaanxi-northern-jujube-braised-rice');
  const method = buildResearchMethod(recipe);
  assert.equal(method.steps.filter(step => step.provenance === 'source').length, 3);
  assert.ok(method.steps.length >= 4);
  assert.ok(method.ingredients.some(item => item.name === '软谷米'));
  assert.equal(method.liquid.provenance, 'estimated');
  assert.equal(method.time.provenance, 'estimated');
  assert.ok(method.assumptions.some(note => /份数|液体|时长|来源/iu.test(note)));
});

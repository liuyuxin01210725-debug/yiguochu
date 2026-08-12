import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildShelfCatalog } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const shelf = buildShelfCatalog(catalog);
const record = shelf.records.find(item => item.recipe_id === 'shunchang-she-bamboo-tube-rice');

test('r304 closes Shunchang She bamboo-tube rice ingredients and source process', () => {
  assert.ok(record, 'Shunchang record must exist');
  assert.deepEqual(record.core_ingredients, ['糯米', '粳米', '畲家腊肉', '芳香草根']);
  assert.deepEqual(record.traditional_vessels, ['一年生毛竹竹筒', '火堆', '蒸锅']);
  assert.ok(record.cooking_sequence.length >= 3);
  assert.match(record.cooking_sequence[0].instruction, /装进适量|竹筒/);
  assert.match(record.cooking_sequence[1].instruction, /糯米|粳米|腊肉|草根/);
  assert.match(record.cooking_sequence[2].instruction, /火堆|蒸锅|蒸煮|烤/);
  const source = record.source_refs.find(item => item.source_id === 'S-FJ-NANPING-SHUNCHANG-BAMBOO-RICE-2');
  assert.ok(source);
  assert.equal(source.access_status, 'opened');
  assert.deepEqual(source.claim_scopes, ['identity', 'ingredients', 'process', 'appliance']);
  assert.equal(record.research_method.status, 'source_partial_with_draft');
});

test('r304 keeps Shunchang rice non-equivalent to an electric cooker', () => {
  assert.equal(record.cooker_adaptation.status, 'not_adapted');
  assert.match(record.cooker_adaptation.notes, /竹筒|火堆|蒸锅/);
  assert.equal(record.fixed_batch, null);
  assert.equal(record.liquid_contract, null);
  assert.equal(record.time_contract, null);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildShelfCatalog } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const shelf = buildShelfCatalog(catalog);

test('r308 exposes the government-sourced process for Shishi sesame-oil rice', () => {
  const record = shelf.records.find(item => item.recipe_id === 'fujian-shishi-sesame-oil-rice');
  assert.ok(record);
  assert.ok(record.cooking_sequence.length >= 1);
  assert.match(record.cooking_sequence[0].instruction, /大米|配料|香油|焖熟/);
  const source = record.source_refs.find(item => item.source_id === 'S-FJ-SHISHI-SESAME-OIL-RICE-1');
  assert.deepEqual(source.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.equal(record.research_method.status, 'source_partial_with_draft');
});

test('r308 exposes the opened three-color-rice dye and steamer process', () => {
  const record = shelf.records.find(item => item.recipe_id === 'cn-hainan-sanya-miao-three-color-rice');
  assert.ok(record);
  assert.deepEqual(record.traditional_vessels, ['独木蒸笼']);
  assert.ok(record.cooking_sequence.length >= 3);
  assert.match(record.cooking_sequence[0].instruction, /山兰糯米|浸泡/);
  assert.match(record.cooking_sequence[1].instruction, /红蓝藤|黄姜|三角枫|植物汁液/);
  assert.match(record.cooking_sequence[2].instruction, /独木蒸笼|蒸制/);
  assert.equal(record.research_method.status, 'source_partial_with_draft');
});

test('r308 records the named Yongchun yifan boil process without inventing a batch', () => {
  const record = shelf.records.find(item => item.recipe_id === 'yongchun-yifan-salty-rice');
  assert.ok(record);
  assert.ok(record.cooking_sequence.length >= 1);
  assert.match(record.cooking_sequence[0].instruction, /海蛎干|花生|肉|白米|煮成/);
  const source = record.source_refs.find(item => item.source_id === 'S-YONGCHUN-YIFAN-SALTY-RICE-1');
  assert.deepEqual(source.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.equal(record.fixed_batch, null);
  assert.equal(record.liquid_contract, null);
  assert.equal(record.research_method.status, 'source_partial_with_draft');
});


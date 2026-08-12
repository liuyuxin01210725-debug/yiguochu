import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildShelfCatalog } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const shelf = buildShelfCatalog(catalog);

test('r309 records Shaoyang black rice as a plant-dyed glutinous-rice steam process', () => {
  const record = shelf.records.find(item => item.recipe_id === 'shaoyang-black-rice');
  assert.ok(record);
  assert.ok(record.cooking_sequence.length >= 1);
  assert.match(record.cooking_sequence[0].instruction, /植物染汁|糯米|蒸煮|黑饭/);
  const source = record.source_refs.find(item => item.source_id === 'S-HN-SHAOYANG-BLACK-RICE-1');
  assert.deepEqual(source.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.equal(record.fixed_batch, null);
  assert.equal(record.liquid_contract, null);
  assert.equal(record.research_method.status, 'source_partial_with_draft');
});

test('r309 surfaces Chayu Dengren hand-grab rice ingredients and total-time clue', () => {
  const record = shelf.records.find(item => item.recipe_id === 'chayu-dengren-hand-grab-rice');
  assert.ok(record);
  assert.ok(record.cooking_sequence.length >= 1);
  assert.match(record.cooking_sequence[0].instruction, /米饭|鸡肉|香料|1–2小时/);
  assert.equal(record.fixed_batch, null);
  assert.equal(record.liquid_contract, null);
  assert.equal(record.time_contract, null);
  assert.equal(record.research_method.status, 'source_partial_with_draft');
});

test('r309 keeps Daojiao glutinous rice as a named mixed finished-rice process', () => {
  const record = shelf.records.find(item => item.recipe_id === 'r99-daojiao-glutinous-rice');
  assert.ok(record);
  assert.ok(record.cooking_sequence.length >= 1);
  assert.match(record.cooking_sequence[0].instruction, /糯米饭|腊肠|腊肉|冬菇|煎蛋|酱油/);
  const source = record.source_refs.find(item => item.source_id === 'S-R99-GD-DONGGUAN-DAOJIAO-GLUTINOUS-RICE-1');
  assert.deepEqual(source.claim_scopes, ['identity', 'ingredients', 'process']);
  assert.equal(record.research_method.status, 'source_partial_with_draft');
});


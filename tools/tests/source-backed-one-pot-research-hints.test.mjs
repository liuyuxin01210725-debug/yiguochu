import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { buildShelfCatalog } from '../lib/source-backed-shelf.mjs';
import { buildSourceBackedOnePotArtifacts } from '../lib/source-backed-one-pot-catalog-renderer.mjs';

const catalog = JSON.parse(readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));

test('research cards expose raw quantity and process locators when canonical fields are not structured', () => {
  const shelf = buildShelfCatalog(catalog);
  const record = shelf.records.find(item => item.recipe_id === 'tiger-corn-rice');
  assert.ok(record);
  assert.equal(record.fixed_batch, null);
  assert.ok(record.research_method.source_quantity_hints.length > 0);
  assert.match(record.research_method.source_quantity_hints[0].text, /3.?4份|米2杯/u);
  assert.ok(record.research_method.source_process_hints.length > 0);
  assert.match(record.research_method.source_process_hints[0].text, /Plain|水位线/u);
});

test('research estimates use small kitchen quantities for preserved and dried add-ins', () => {
  const shelf = buildShelfCatalog(catalog);
  const douchi = shelf.records.find(item => item.recipe_id === 'afa-douchi-pork-steamed-rice');
  const chestnut = shelf.records.find(item => item.recipe_id === 'afa-japanese-chestnut-rice');
  assert.ok(douchi);
  assert.ok(chestnut);
  const douchiRow = douchi.research_method.ingredients.find(item => item.name === '豆豉');
  const chestnutRow = chestnut.research_method.ingredients.find(item => item.name === '栗子');
  assert.deepEqual(douchiRow.amount, { value: 20, unit: 'g' });
  assert.equal(douchiRow.provenance, 'estimated');
  assert.match(douchiRow.note, /研究起步量 20g/u);
  assert.deepEqual(chestnutRow.amount, { value: 120, unit: 'g' });
  assert.equal(chestnutRow.provenance, 'estimated');
});

test('existing oil estimates remain explicit rather than being treated as source facts', () => {
  const shelf = buildShelfCatalog(catalog);
  const record = shelf.records.find(item => item.recipe_id === 'afa-sesame-oil-chicken-rice');
  assert.ok(record);
  const oil = record.research_method.ingredients.find(item => item.name === '麻油');
  assert.deepEqual(oil.amount, { value: 15, unit: 'mL' });
  assert.equal(oil.provenance, 'estimated');
  assert.match(oil.note, /不是来源原方/u);
});

test('research methods artifact labels raw quantity and process locators as source hints', () => {
  const artifacts = buildSourceBackedOnePotArtifacts(catalog, { items: [] });
  const methods = artifacts.get('docs/source-backed-one-pot-research-methods.md');
  assert.match(methods, /原文量线索/u);
  assert.match(methods, /原文流程线索/u);
  assert.match(methods, /Corn Rice标题、3–4份/u);
});

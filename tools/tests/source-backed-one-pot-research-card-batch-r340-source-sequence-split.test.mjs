import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildShelfCatalog } from '../lib/source-backed-shelf.mjs';

const root = path.resolve(process.cwd());
const catalog = JSON.parse(fs.readFileSync(
  path.join(root, 'tools/data/source-backed-one-pot-recipes.v1.json'),
  'utf8',
));

const IDS = [
  'zojirushi-beef-mixed-rice',
  'joyoung-curry-chicken-rice-jrc-4hp82',
  'taiwan-turmeric-chicken-risotto',
  'taiwan-bottle-gourd-mushroom-rice',
  'macau-scallop-mushroom-vegetable-rice',
  'hk-salmon-edamame-quinoa-rice',
  'tiger-hijiki-brown-rice',
  'tiger-bibimbap-style-rice',
  'toshiba-vegetarian-mixed-brown-rice',
  'taiwan-five-elements-bamboo-shoot-rice',
];

test('r340 exposes split source sequences without adding estimated steps', () => {
  const shelf = buildShelfCatalog(catalog);
  const byId = new Map(shelf.records.map(record => [record.recipe_id, record]));
  for (const id of IDS) {
    const method = byId.get(id)?.research_method;
    assert.ok(method, `${id} must have a research method`);
    assert.ok(method.steps.length >= 4, `${id} should expose at least four source steps`);
    assert.ok(method.steps.every(step => step.provenance === 'source'), `${id} must not add a draft step`);
    assert.ok(method.steps.every(step => step.source_ids?.length), `${id} steps must retain source ids`);
  }
});

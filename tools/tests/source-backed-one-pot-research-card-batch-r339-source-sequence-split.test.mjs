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
  'tiger-brown-rice-curry-pilaf',
  'maff-tokushima-omiisan',
  'philips-soy-milk-chicken-congee',
  'tefal-risotto-milanese',
  'tefal-saffron-rice-seafood',
  'tiger-cheese-curry-pilaf',
  'tiger-hotaruika-rice',
  'tiger-canned-curry-takikomi-pilaf',
  'qld-one-pot-beans-rice',
];

test('r339 splits compact source sequences without adding estimated steps', () => {
  const shelf = buildShelfCatalog(catalog);
  const byId = new Map(shelf.records.map(record => [record.recipe_id, record]));
  for (const id of IDS) {
    const method = byId.get(id)?.research_method;
    assert.ok(method, `${id} must have a research method`);
    assert.equal(method.status, 'source_complete', id);
    assert.ok(method.steps.length >= 3, `${id} should expose at least three source steps`);
    assert.ok(method.steps.every(step => step.provenance === 'source'), `${id} must not add a draft step`);
    assert.ok(method.steps.every(step => step.source_ids?.length), `${id} steps must retain source ids`);
  }
});

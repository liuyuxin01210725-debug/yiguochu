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
  'tiger-kimchi-rice',
  'tiger-edamame-fried-tofu-rice',
  'tiger-seafood-pilaf',
  'taiwan-angelica-sesame-chicken-rice',
  'hk-choy-sum-scallop-rice',
  'taiwan-high-fiber-pumpkin-rice',
  'joyoung-millet-corn-multigrain-rice',
  'joyoung-three-color-quinoa-rice',
  'taiwan-burdock-rice',
  'taiwan-five-grain-rice',
];

test('r341 exposes split source sequences without adding estimated steps', () => {
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

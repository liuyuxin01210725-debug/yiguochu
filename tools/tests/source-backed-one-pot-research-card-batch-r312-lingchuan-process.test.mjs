import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildShelfCatalog } from '../lib/source-backed-shelf.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../data/source-backed-one-pot-recipes.v1.json', import.meta.url), 'utf8'));
const shelf = buildShelfCatalog(catalog);

test('Lingchuan firewood rice exposes the government one-pot boundary', () => {
  const record = shelf.records.find(item => item.recipe_id === 'shanxi-lingchuan-firewood-rice');
  assert.ok(record, 'missing shanxi-lingchuan-firewood-rice');
  assert.equal(record.research_method.status, 'source_partial_with_draft');
  assert.ok(record.research_method.steps.some(step => /一锅出|柴火大米|蔬菜副食/u.test(step.instruction) && step.provenance === 'source'));
  assert.equal(record.research_method.servings.provenance, 'estimated');
  assert.equal(record.research_method.liquid.provenance, 'estimated');
  assert.equal(record.research_method.time.provenance, 'estimated');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateRiceMealCollection } from '../lib/rice-meal-collection-validator.mjs';

const readJson = async name => JSON.parse(await readFile(new URL(`../data/${name}`, import.meta.url), 'utf8'));

test('national rice-meal collection records all research candidates, exclusions, regional gaps and current catalog tracking', async () => {
  const [collection, taxonomy, catalog] = await Promise.all([
    readJson('rice-meal-collection.v1.json'),
    readJson('ingredient-taxonomy.v1.json'),
    readJson('rice-meal-catalog.v1.json'),
  ]);
  assert.deepEqual(validateRiceMealCollection(collection, { taxonomy, catalog }), []);
  assert.equal(collection.candidates.length, 37);
  assert.ok(collection.exclusions.length >= 8);
  assert.equal(collection.catalog_tracking.length, 11);
  assert.deepEqual(
    collection.region_nodes.filter(node => node.gap).map(node => node.region_id).sort(),
    ['CN-BJ', 'CN-GS', 'CN-GX', 'CN-HE', 'CN-HI', 'CN-HK', 'CN-HL', 'CN-JL', 'CN-JX', 'CN-LN', 'CN-MO', 'CN-NM', 'CN-QH', 'CN-SD', 'CN-SX', 'CN-XZ'],
  );
  assert.equal(collection.catalog_tracking.filter(row => row.status === 'runtime_ready').length, 4);
  assert.equal(collection.catalog_tracking.filter(row => row.status === 'planned').length, 7);
});

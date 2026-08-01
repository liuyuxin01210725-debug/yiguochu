import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const validatorModule = await import('../lib/rice-meal-collection-validator.mjs')
  .catch(error => ({ loadError: error }));

const readCollection = async () => JSON.parse(await readFile(
  new URL('../data/rice-meal-collection.v1.json', import.meta.url), 'utf8',
));
const readJson = async name => JSON.parse(await readFile(new URL(`../data/${name}`, import.meta.url), 'utf8'));

async function dependencies() {
  return {
    taxonomy: await readJson('ingredient-taxonomy.v1.json'),
    catalog: await readJson('rice-meal-catalog.v1.json'),
  };
}

test('collection validator and machine collection exist', async () => {
  assert.ok(!validatorModule.loadError, `validator must load: ${validatorModule.loadError?.message}`);
  assert.equal(typeof validatorModule.validateRiceMealCollection, 'function');
  assert.equal(typeof validatorModule.assertRiceMealCollection, 'function');
  assert.ok(await readCollection());
});

test('collection validator fails closed for candidate identity, nutrition, blockers, region coverage and runtime mapping drift', async () => {
  const collection = await readCollection();
  const invalid = structuredClone(collection);
  const candidate = invalid.candidates[0];
  const runtime = invalid.catalog_tracking.find(row => row.status === 'runtime_ready');

  invalid.candidates.push(structuredClone(candidate));
  candidate.identity_sources[0].url = 'http://not-https.example.test';
  candidate.core_ingredients = [];
  candidate.nutrition_grade = 'Z';
  runtime.nutrition_grade = 'C';
  invalid.candidates.find(row => row.status === 'research_candidate').blockers = [];
  invalid.region_nodes.push({ region_id: 'CN-TEST', display_name: 'test empty region', candidate_ids: [], gap: null });
  runtime.runtime_variant_id = 'does-not-exist';
  invalid.runtime_mappings[0].candidate_id = 'mismatched-candidate';

  const errors = validatorModule.validateRiceMealCollection(invalid, await dependencies());
  assert.ok(errors.some(error => error.includes('duplicate candidate_id')));
  assert.ok(errors.some(error => error.includes('identity_sources[0].url must be HTTPS')));
  assert.ok(errors.some(error => error.includes('core_ingredients must be non-empty')));
  assert.ok(errors.some(error => error.includes('nutrition_grade is invalid')));
  assert.ok(errors.some(error => error.includes('runtime_ready cannot use nutrition grade C')));
  assert.ok(errors.some(error => error.includes('research_candidate requires blockers')));
  assert.ok(errors.some(error => error.includes('must declare candidate_ids or an explicit gap')));
  assert.ok(errors.some(error => error.includes('runtime_variant_id does not exist in catalog')));
  assert.ok(errors.some(error => error.includes('runtime_mappings[0] is not the reverse mapping')));
});

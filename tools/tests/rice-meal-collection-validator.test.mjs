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

test('rejects a duplicate candidate id', async () => {
  const collection = await readCollection();
  const invalid = structuredClone(collection);
  invalid.candidates.push(structuredClone(invalid.candidates[0]));
  assert.ok(validatorModule.validateRiceMealCollection(invalid, await dependencies()).some(error => error.includes('duplicate candidate_id')));
});

test('rejects malformed HTTPS URL without a host', async () => {
  const invalid = structuredClone(await readCollection());
  invalid.candidates[0].identity_sources[0].url = 'https://';
  assert.ok(validatorModule.validateRiceMealCollection(invalid, await dependencies()).some(error => error.includes('url must be HTTPS with host')));
});

test('rejects incomplete structured identity source', async () => {
  const invalid = structuredClone(await readCollection());
  delete invalid.candidates[0].identity_sources[0].title;
  assert.ok(validatorModule.validateRiceMealCollection(invalid, await dependencies()).some(error => error.includes('identity_sources[0].title is required')));
});

test('rejects non-rice candidate states', async () => {
  const invalid = structuredClone(await readCollection());
  invalid.candidates[0].rice_state = 'raw-millet';
  assert.ok(validatorModule.validateRiceMealCollection(invalid, await dependencies()).some(error => error.includes('rice_state is invalid')));
});

test('requires the complete region set', async () => {
  const invalid = structuredClone(await readCollection());
  invalid.region_nodes = [];
  assert.ok(validatorModule.validateRiceMealCollection(invalid, await dependencies()).some(error => error.includes('region_nodes must cover the complete supported region set')));
});

test('rejects candidate to region node drift', async () => {
  const invalid = structuredClone(await readCollection());
  invalid.candidates[0].region_codes = ['CN-JS'];
  assert.ok(validatorModule.validateRiceMealCollection(invalid, await dependencies()).some(error => error.includes('candidate-region mismatch')));
});

test('rejects region node to candidate drift', async () => {
  const invalid = structuredClone(await readCollection());
  invalid.region_nodes.find(node => node.region_id === 'CN-SH').candidate_ids = [];
  invalid.region_nodes.find(node => node.region_id === 'CN-SH').gap = 'forged gap';
  assert.ok(validatorModule.validateRiceMealCollection(invalid, await dependencies()).some(error => error.includes('candidate-region mismatch')));
});

test('rejects catalog tracking status drift', async () => {
  const invalid = structuredClone(await readCollection());
  invalid.catalog_tracking.find(row => row.status === 'planned').status = 'runtime_ready';
  assert.ok(validatorModule.validateRiceMealCollection(invalid, await dependencies()).some(error => error.includes('status must match catalog status')));
});

test('rejects runtime-ready tracking without candidate and reverse mapping', async () => {
  const invalid = structuredClone(await readCollection());
  const tracking = invalid.catalog_tracking.find(row => row.status === 'planned');
  tracking.runtime_variant_id = invalid.catalog_tracking.find(row => row.status === 'runtime_ready').runtime_variant_id;
  tracking.status = 'runtime_ready';
  tracking.candidate_id = null;
  tracking.reverse_mapping_id = null;
  assert.ok(validatorModule.validateRiceMealCollection(invalid, await dependencies()).some(error => error.includes('runtime_ready requires candidate_id and reverse_mapping_id')));
});

test('rejects runtime-ready candidate without a complete executable contract', async () => {
  const invalid = structuredClone(await readCollection());
  const candidate = invalid.candidates.find(row => row.status !== 'runtime_ready');
  candidate.status = 'runtime_ready';
  assert.ok(validatorModule.validateRiceMealCollection(invalid, await dependencies()).some(error => error.includes('runtime_ready requires complete quantity, liquid, appliance and safety contracts')));
});

test('assertRiceMealCollection throws on invalid input', async () => {
  const invalid = structuredClone(await readCollection());
  const deps = await dependencies();
  invalid.candidates[0].core_ingredients = [];
  assert.throws(() => validatorModule.assertRiceMealCollection(invalid, deps), /invalid rice-meal collection/u);
});

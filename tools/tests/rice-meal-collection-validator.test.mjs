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

test('requires exactly one non-geographic household node without weakening province coverage', async () => {
  const invalid = structuredClone(await readCollection());
  invalid.region_nodes = invalid.region_nodes.filter(node => node.region_id !== 'HOUSEHOLD');
  assert.ok(validatorModule.validateRiceMealCollection(invalid, await dependencies()).some(error => error.includes('plus HOUSEHOLD')));
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

test('rejects tracking nutrition grades that drift from the mapped candidate', async () => {
  const runtimeInvalid = structuredClone(await readCollection());
  runtimeInvalid.catalog_tracking.find(row => row.status === 'runtime_ready').nutrition_grade = 'C';
  assert.ok(validatorModule.validateRiceMealCollection(runtimeInvalid, await dependencies()).some(error => error.includes('runtime_ready nutrition_grade must be A or B')));

  const plannedInvalid = structuredClone(await readCollection());
  const planned = plannedInvalid.catalog_tracking.find(row => row.status === 'planned' && row.candidate_id !== null);
  planned.nutrition_grade = planned.nutrition_grade === 'A' ? 'B' : 'A';
  assert.ok(validatorModule.validateRiceMealCollection(plannedInvalid, await dependencies()).some(error => error.includes('nutrition_grade must match mapped candidate')));
});

test('requires collection tracking to be the reverse of each catalog variant candidate mapping', async () => {
  const invalid = structuredClone(await readCollection());
  const deps = await dependencies();
  const tracking = invalid.catalog_tracking.find(row => row.runtime_variant_id === 'home-chicken-leg-potato-rice');
  const variant = deps.catalog.families.flatMap(family => family.variants)
    .find(row => row.variant_id === tracking.runtime_variant_id);
  variant.collection_candidate_id = 'household-corn-carrot-chicken-rice';
  assert.ok(
    validatorModule.validateRiceMealCollection(invalid, deps)
      .some(error => error.includes('catalog collection_candidate_id must match tracking candidate_id')),
  );

  const coreInvalid = structuredClone(await readCollection());
  const coreDeps = await dependencies();
  coreInvalid.catalog_tracking.find(row => row.runtime_variant_id === 'home-chicken-leg-potato-rice')
    .core_ingredient_ids = ['raw-rice', 'chicken-leg'];
  assert.ok(
    validatorModule.validateRiceMealCollection(coreInvalid, coreDeps)
      .some(error => error.includes('tracking core_ingredient_ids must match catalog variant')),
  );

  const candidateCoreInvalid = structuredClone(await readCollection());
  const candidateCoreDeps = await dependencies();
  candidateCoreInvalid.candidates.find(row => row.candidate_id === 'household-chicken-leg-potato-rice')
    .mapped_core = ['raw-rice', 'chicken-leg', 'shiitake'];
  assert.ok(
    validatorModule.validateRiceMealCollection(candidateCoreInvalid, candidateCoreDeps)
      .some(error => error.includes('candidate mapped_core must match catalog variant')),
  );

  const candidateLabelInvalid = structuredClone(await readCollection());
  const candidateLabelDeps = await dependencies();
  const candidateLabel = candidateLabelInvalid.candidates
    .find(row => row.candidate_id === 'household-chicken-leg-potato-rice');
  candidateLabel.core_ingredients
    .find(item => item.canonical_id === 'potato').label = '香菇';
  assert.ok(
    validatorModule.validateRiceMealCollection(candidateLabelInvalid, candidateLabelDeps)
      .some(error => error.includes('core_ingredients[2].label conflicts with canonical_id potato')),
  );

  const promotedCandidateInvalid = structuredClone(await readCollection());
  const promotedCandidateDeps = await dependencies();
  promotedCandidateInvalid.candidates.find(row => row.candidate_id === 'household-green-bean-pork-rib-rice')
    .status = 'runtime_ready';
  assert.ok(
    validatorModule.validateRiceMealCollection(promotedCandidateInvalid, promotedCandidateDeps)
      .some(error => error.includes('planned must map to a planned candidate')),
  );
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

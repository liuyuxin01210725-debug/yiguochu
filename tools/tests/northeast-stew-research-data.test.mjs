import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateNortheastStewResearch } from '../lib/northeast-stew-research-validator.mjs';

const readJson = relativePath => JSON.parse(fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
const assessment = readJson('../data/northeast-stew-research.v1.json');
const regionalAtlas = readJson('../data/regional-atlas.v2.json');
const regionalResearch = readJson('../data/regional-menu-research.v1.json');
const inputs = { assessment, regionalAtlas, regionalResearch };

const EXPECTED_IDS = [
  'northeast-chicken-mushroom-potato-corn-cake',
  'northeast-fish-tofu-vegetable-corn-cake',
  'northeast-ribs-beans-corn-cake',
  'northeast-ribs-beans-sticky-rolls',
];

test('assessment covers exactly the four existing northeast candidates', () => {
  assert.deepEqual(assessment.prototypes.map(row => row.atlas_id).sort(), EXPECTED_IDS);
  assert.deepEqual(validateNortheastStewResearch(inputs), []);
});

test('claim evidence cannot merge separate source facts into a traditional fixed combination', () => {
  const chicken = assessment.prototypes.find(row => row.atlas_id.includes('chicken'));
  assert.equal(chicken.claims.exact_combination.verdict, 'not_proven');
  assert.equal(chicken.claims.family_compatibility.verdict, 'supported');
});

test('sticky rolls keep verified Beijing geography separate from an unproven northeast link', () => {
  const sticky = assessment.prototypes.find(row => row.atlas_id.endsWith('sticky-rolls'));
  assert.equal(sticky.claims.northeast_identity.verdict, 'not_proven');
  assert.deepEqual(sticky.verified_geography.province_codes, ['CN-BJ']);
  assert.match(sticky.claims.northeast_identity.reason, /不能证明东北不存在/);
});

test('fish plus tofu remains unproven even when fish plus corn cake is supported', () => {
  const fish = assessment.prototypes.find(row => row.atlas_id.includes('fish-tofu'));
  assert.equal(fish.claims.fish_corn_cake_family.verdict, 'supported');
  assert.equal(fish.claims.tofu_as_traditional_core.verdict, 'not_proven');
});

test('staple forms and safety branches remain separate without invented quantities', () => {
  assert.deepEqual(assessment.family_model.staple_forms.map(row => row.form_id).sort(), [
    'corn_dough_cake', 'sticky_roll', 'wheat_flower_roll',
  ]);
  assert.deepEqual(assessment.family_model.safety_branches.map(row => row.branch_id).sort(), [
    'chicken', 'fish', 'green_beans', 'pork_ribs',
  ]);
  for (const row of [...assessment.family_model.staple_forms, ...assessment.family_model.safety_branches]) {
    assert.equal(row.evidence_status, 'unresearched');
    assert.equal('grams' in row, false);
    assert.equal('minutes' in row, false);
    assert.equal('temperature_c' in row, false);
  }
});

test('validator rejects foreign IDs, fake completion and unsupported exclusion claims', () => {
  const broken = structuredClone(assessment);
  broken.prototypes[0].atlas_id = 'not-a-real-candidate';
  const fish = broken.prototypes.find(row => row.atlas_id.includes('fish-tofu'));
  fish.research_state = 'fact_checked';
  fish.claims.tofu_as_traditional_core.verdict = 'supported';
  const sticky = broken.prototypes.find(row => row.atlas_id.endsWith('sticky-rolls'));
  sticky.claims.northeast_identity.verdict = 'contradicted';
  const message = validateNortheastStewResearch({ ...inputs, assessment: broken }).join('\n');
  assert.match(message, /prototype atlas_id must match the approved northeast set/);
  assert.match(message, /fact_checked requires every identity claim to be supported/);
  assert.match(message, /supported claim requires evidence that proves the claim/);
  assert.match(message, /another verified geography cannot contradict northeast existence/);
});

test('validator is total for malformed roots and nested rows', () => {
  assert.deepEqual(validateNortheastStewResearch({ assessment: null }), ['assessment must be an object']);
  assert.doesNotThrow(() => validateNortheastStewResearch({
    assessment: { prototypes: [null], source_refs: [null] },
    regionalAtlas: null,
    regionalResearch: { entries: [null] },
  }));
});

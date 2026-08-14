import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildRuntimeCoverageMatrix,
  validateRuntimeCoverageMatrix,
} from '../lib/runtime-coverage-matrix.mjs';

const readJson = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const inputs = {
  runtimeJourneys: readJson('recipe-runtime-journeys.v1.json'),
  riceMealJourneys: readJson('rice-meal-journeys.v1.json'),
  directRecommendShadow: readJson('direct-recommend-shadow-v1.json'),
  formalRecipeLibrary: readJson('recipe-library.json'),
  riceMealCatalog: readJson('rice-meal-catalog.v1.json'),
};

test('runtime coverage matrix is scenario keyed and records contract expectations separately from observations', () => {
  const matrix = buildRuntimeCoverageMatrix(inputs);
  assert.equal(matrix.scope, 'runtime-coverage-matrix');
  assert.equal(matrix.runtime_coverage_matrix_version, 'runtime-coverage-matrix-v1-20260813-c6');
  assert.equal(matrix.counts.total, 101);
  assert.deepEqual(matrix.counts.by_source, {
    recipe_runtime: 17,
    rice_meal: 54,
    direct_recommend_shadow: 30,
  });
  assert.equal(new Set(matrix.scenarios.map(row => row.scenario_id)).size, 101);
  assert.ok(matrix.scenarios.every(row => row.observation.observed === false));
  assert.ok(matrix.scenarios.every(row => row.production_eligible === false));

  const tiger = matrix.scenarios.find(row => row.scenario_id === 'rice_meal:RM-344-source-tiger-pork-bamboo-rice');
  assert.deepEqual(tiger.request.pantry, ['五花肉', '竹笋']);
  assert.deepEqual(tiger.expected.candidate_refs.variant_ids, ['source-tiger-pork-bamboo-rice']);
  assert.equal(tiger.joins.candidate_refs.status, 'ok');
  assert.deepEqual(tiger.joins.candidate_refs.resolved_ids, ['source-tiger-pork-bamboo-rice']);
  assert.equal(tiger.observation.hit.recipe_ids.length, 0);
  assert.equal(tiger.quantity.status, 'not_observed');
  assert.equal(tiger.liquid.status, 'not_observed');
  assert.equal(tiger.safety.status, 'not_observed');

  const titleMention = buildRuntimeCoverageMatrix({
    ...inputs,
    runtimeJourneys: {
      journeys: [{ id: 'RR-text', title: 'text has shanghai-salted-pork-vegetable-rice' }],
    },
    riceMealJourneys: { journeys: [] },
    directRecommendShadow: { journeys: [] },
  }).scenarios[0];
  assert.deepEqual(titleMention.expected.candidate_refs.recipe_ids, []);
  assert.equal(titleMention.joins.candidate_refs.status, 'none');

  const unknown = buildRuntimeCoverageMatrix({
    ...inputs,
    runtimeJourneys: {
      journeys: [{
        id: 'RR-unknown',
        expected_title: 'Unknown candidate',
        candidate_recipe_ids: ['does-not-exist'],
      }],
    },
    riceMealJourneys: { journeys: [] },
    directRecommendShadow: { journeys: [] },
  }).scenarios[0];
  assert.deepEqual(unknown.expected.candidate_refs.recipe_ids, []);
  assert.equal(unknown.joins.candidate_refs.status, 'invalid');
  assert.deepEqual(unknown.joins.candidate_refs.unknown_ids, ['does-not-exist']);
  assert.deepEqual(unknown.joins.candidate_refs.blocker_codes, ['unknown_candidate_id', 'candidate_join_invalid']);
});

test('runtime coverage matrix rejects duplicate or missing scenario joins', () => {
  const matrix = buildRuntimeCoverageMatrix(inputs);
  assert.deepEqual(validateRuntimeCoverageMatrix(matrix, inputs), []);
  const broken = structuredClone(matrix);
  broken.scenarios[1].scenario_id = broken.scenarios[0].scenario_id;
  assert.match(validateRuntimeCoverageMatrix(broken, inputs).join('\n'), /duplicate scenario_id/u);
});

test('runtime coverage joins retain structured variant ids and fail closed on unknown variants', () => {
  const synthetic = buildRuntimeCoverageMatrix({
    ...inputs,
    runtimeJourneys: {
      journeys: [{
        id: 'RR-known-variant',
        expected_title: 'variant candidate',
        recipe_id: 'shanghai-salted-pork-vegetable-rice',
        variant_id: 'shanghai-salted-pork-rice',
      }, {
        id: 'RR-unknown-variant',
        expected_title: 'unknown variant candidate',
        recipe_id: 'shanghai-salted-pork-vegetable-rice',
        variant_id: 'does-not-exist-variant',
      }, {
        id: 'RR-recipe-id-in-variant-slot',
        expected_title: 'recipe id must not satisfy a variant join',
        recipe_id: 'shanghai-salted-pork-vegetable-rice',
        variant_id: 'shanghai-salted-pork-vegetable-rice',
      }],
    },
    riceMealJourneys: { journeys: [] },
    directRecommendShadow: { journeys: [] },
  });
  const known = synthetic.scenarios[0];
  assert.deepEqual(known.expected.candidate_refs.variant_ids, ['shanghai-salted-pork-rice']);
  assert.equal(known.joins.candidate_refs.status, 'ok');
  assert.deepEqual(known.joins.candidate_refs.resolved_ids, [
    'shanghai-salted-pork-vegetable-rice',
    'shanghai-salted-pork-rice',
  ]);

  const unknown = synthetic.scenarios[1];
  assert.deepEqual(unknown.expected.candidate_refs.variant_ids, []);
  assert.equal(unknown.joins.candidate_refs.status, 'invalid');
  assert.deepEqual(unknown.joins.candidate_refs.unknown_ids, ['does-not-exist-variant']);
  assert.deepEqual(unknown.joins.candidate_refs.blocker_codes, ['unknown_candidate_id', 'candidate_join_invalid']);

  const namespaceCollision = synthetic.scenarios[2];
  assert.equal(namespaceCollision.joins.candidate_refs.status, 'invalid');
  assert.deepEqual(namespaceCollision.joins.candidate_refs.unknown_ids, ['shanghai-salted-pork-vegetable-rice']);
});
